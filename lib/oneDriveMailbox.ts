// The mailbox, running on a OneDrive folder the person actually chose.
//
// WHAT CHANGES HERE AND WHAT DOES NOT. The carrier changes: bytes move through
// Microsoft Graph instead of a file handed over a share sheet. Nothing else
// does. The payload is still built by lib/partnerSync.ts, still honours the
// grants because that function reads them itself, still sealed by
// lib/partnerCrypto.ts so only the recipient can open it, still named and
// addressed by lib/syncInbox.ts, and still verified on arrival by the same four
// checks in lib/partnerTransfer.ts rather than a second copy of them. A carrier
// deciding what is allowed to be true before something is stored is exactly the
// drift this app keeps having to unpick.
//
// ONE FOLDER, EVERY PARTNER, AND LATER EVERY CHILD. A shared folder holds
// everybody's files at once, and incomingFilesFor is what stops one phone
// reading another person's mail: it matches the recipient half of the filename
// and drops anything addressed elsewhere, before anything is downloaded. The
// sealing would refuse it anyway, but a device that downloads and tries to open
// every file in a household folder is doing something it has no business doing.
//
// A FILE IS DELETED ONCE IT HAS BEEN APPLIED. What is in the folder is the
// latest thing somebody sent, not a history, and leaving read mail in a folder
// two people share means the same conditions get re-applied on every check with
// no way to tell a fresh send from an old one.

import { computeKeyFingerprint, getMyKeyFingerprint, sealForRecipient } from './deviceIdentity';
import { listConnections } from './connections';
import { getOneDriveFolder, getUserConditions, setOneDriveFolder, type StoredOneDriveFolder } from './db';
import { buildSyncPayload } from './partnerSync';
import { applySyncFileText, PARTNER_SYNC_FILE_KIND } from './partnerTransfer';
import { REFERENCE_DB_VERSION } from './referenceDbVersion';
import { buildSyncFileName, incomingFilesFor } from './syncInbox';
import {
  checkFolder,
  deleteFile,
  downloadText,
  listFileNames,
  uploadText,
  type DriveItemRef,
} from './oneDriveGraph';
import { isSignedIn } from './oneDriveAuth';

export type MailboxStatus =
  | { state: 'notSignedIn' }
  | { state: 'noFolder' }
  | { state: 'unreachable'; folderName: string; reason: string }
  | { state: 'ready'; folder: DriveItemRef };

/**
 * What the screen needs to know before offering to send or check anything.
 *
 * Confirms the folder is still there rather than assuming, because a folder can
 * be renamed, moved, or unshared long after it was picked, and finding that out
 * when somebody taps Send is worse than finding it out on the screen that shows
 * the mailbox.
 */
export async function getMailboxStatus(): Promise<MailboxStatus> {
  if (!(await isSignedIn())) return { state: 'notSignedIn' };

  const stored = await getOneDriveFolder();
  if (!stored) return { state: 'noFolder' };

  const folder: DriveItemRef = stored;
  const check = await checkFolder(folder);
  if (!check.ok) {
    return { state: 'unreachable', folderName: stored.name, reason: check.reason };
  }

  // A rename or a move is not a problem, but a stale name or path on screen is
  // confusing, so the stored copy is brought back in line with where OneDrive
  // actually says the folder is now.
  if (check.value.name !== stored.name || check.value.path !== stored.path) {
    const refreshed: StoredOneDriveFolder = {
      ...stored,
      name: check.value.name,
      path: check.value.path,
    };
    await setOneDriveFolder(refreshed);
    return { state: 'ready', folder: refreshed };
  }

  return { state: 'ready', folder };
}

export type MailboxSendOutcome = {
  connectionId: string;
  name: string;
  sent: boolean;
  reason?: string;
};

/**
 * Writes one sealed file per partner into the shared folder.
 *
 * Per recipient, and so is the outcome: one partner having no encryption key
 * must not stop another partner's file being written, so each gets its own
 * result and the caller reports all of them.
 */
export async function sendViaOneDrive(): Promise<{
  status: MailboxStatus;
  outcomes: MailboxSendOutcome[];
}> {
  const status = await getMailboxStatus();
  if (status.state !== 'ready') return { status, outcomes: [] };

  const [connections, myFingerprint, myConditions] = await Promise.all([
    listConnections(),
    getMyKeyFingerprint(),
    getUserConditions(),
  ]);

  const partners = connections.filter((connection) => connection.role === 'partner');
  const outcomes: MailboxSendOutcome[] = [];

  for (const partner of partners) {
    if (!partner.encryptionPublicKeyBase64) {
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason: 'They paired before this app could encrypt. Show each other a code once more.',
      });
      continue;
    }

    const fileName = buildSyncFileName(
      computeKeyFingerprint(partner.publicKeyBase64),
      myFingerprint,
    );
    if (!fileName) {
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason: 'Their key could not be turned into an address.',
      });
      continue;
    }

    // Read here rather than passed in, so no call site can send more than was
    // granted by handing over the wrong argument.
    const payload = buildSyncPayload({
      grants: partner.grants,
      myConditionCodes: myConditions,
      plan: [],
      referenceDbVersion: REFERENCE_DB_VERSION,
      fromFingerprint: myFingerprint,
      sentAt: new Date().toISOString(),
    });

    let sealed: string;
    try {
      sealed = await sealForRecipient(
        new TextEncoder().encode(JSON.stringify(payload)),
        partner.encryptionPublicKeyBase64,
      );
    } catch {
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason: 'Their key could not be used to encrypt this. Pair with them again.',
      });
      continue;
    }

    const wire = {
      kind: PARTNER_SYNC_FILE_KIND,
      v: 1 as const,
      to: computeKeyFingerprint(partner.publicKeyBase64),
      from: myFingerprint,
      sealed,
    };

    const uploaded = await uploadText(status.folder, fileName, JSON.stringify(wire));
    outcomes.push({
      connectionId: partner.id,
      name: partner.name,
      sent: uploaded.ok,
      reason: uploaded.ok ? undefined : uploaded.reason,
    });
  }

  return { status, outcomes };
}

export type MailboxReceiveOutcome = {
  fromFingerprint: string;
  applied: boolean;
  message: string;
};

/** Reads whatever the folder holds that is addressed to this phone. */
export async function receiveViaOneDrive(): Promise<{
  status: MailboxStatus;
  outcomes: MailboxReceiveOutcome[];
}> {
  const status = await getMailboxStatus();
  if (status.state !== 'ready') return { status, outcomes: [] };

  const [connections, myFingerprint] = await Promise.all([listConnections(), getMyKeyFingerprint()]);

  const listed = await listFileNames(status.folder);
  if (!listed.ok) {
    return {
      status: { state: 'unreachable', folderName: status.folder.name, reason: listed.reason },
      outcomes: [],
    };
  }

  const mine = incomingFilesFor(listed.value, myFingerprint);
  const outcomes: MailboxReceiveOutcome[] = [];

  for (const incoming of mine) {
    const text = await downloadText(status.folder, incoming.entry);
    if (!text.ok) {
      outcomes.push({
        fromFingerprint: incoming.fromFingerprint,
        applied: false,
        message: text.reason,
      });
      continue;
    }

    const result = await applySyncFileText(text.value, connections);
    outcomes.push({
      fromFingerprint: incoming.fromFingerprint,
      applied: result.applied,
      message: result.message,
    });

    // Only what was actually used is cleared. A file that failed a check stays
    // put, so a fixable problem (a missing key, a pairing not finished) can be
    // fixed and the same file read again rather than silently thrown away.
    if (result.applied) await deleteFile(status.folder, incoming.entry);
  }

  return { status, outcomes };
}

export function describeMailboxSend(outcomes: readonly MailboxSendOutcome[]): string {
  if (outcomes.length === 0) return 'Nobody is set up as a partner yet, so there was nothing to send.';
  const sent = outcomes.filter((outcome) => outcome.sent);
  const failed = outcomes.filter((outcome) => !outcome.sent);
  const parts: string[] = [];
  if (sent.length > 0) {
    parts.push(
      'Put in the folder for ' + sent.map((outcome) => outcome.name).join(', ') + '.',
    );
  }
  for (const outcome of failed) {
    parts.push(outcome.name + ': ' + (outcome.reason ?? 'It could not be sent.'));
  }
  return parts.join(' ');
}

export function describeMailboxReceive(outcomes: readonly MailboxReceiveOutcome[]): string {
  if (outcomes.length === 0) {
    return 'Nothing addressed to this phone is in the folder right now.';
  }
  return outcomes.map((outcome) => outcome.message).join(' ');
}
