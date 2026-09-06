// Actually moving a payload between two phones.
//
// The piece that ties the four halves together, each of which was built and
// tested on its own first: lib/partnerSync.ts decides WHAT travels and honours
// the grants, lib/partnerCrypto.ts seals it so only the recipient can read it,
// lib/syncInbox.ts names and addresses the file, lib/syncInboxStorage.ts puts it
// in the folder. Nothing here re-decides any of that; it sequences it.
//
// WHAT THIS VERSION CARRIES, STATED PLAINLY: condition codes. That is the thing
// originally asked for ("the two sides need to be able to combine the conditions
// for each user into one meal system that both users see"), and it closes the
// whole loop, because lib/partnerPlanning.ts already reads a partner's stored
// codes and plans around both people once they are there.
//
// WHAT IT DOES NOT CARRY YET: the generated meal plan itself. Sending that means
// resolving each scheduled meal through its carrier favorite to the curated
// recipe ids underneath, which is a real several-step read this has not been
// wired to. The payload format already has the field and the tests already cover
// it, so this is a wiring gap rather than a design one, and it is named here
// rather than left for somebody to discover as a silent omission.
//
// SENDING IS PER RECIPIENT, AND SO IS THE OUTCOME. One partner having no
// encryption key must not stop another partner's file being written, so each one
// gets its own result and the caller reports all of them.
import { REFERENCE_DB_VERSION } from './referenceDbVersion';
import { computeKeyFingerprint, getMyKeyFingerprint, openSealedForMe, sealForRecipient } from './deviceIdentity';
import { listConnections, setPartnerConditionCodes, type Connection } from './connections';
import { getUserConditions } from './db';
import { buildSyncPayload, readSyncPayload, type SyncPlanDay } from './partnerSync';
import { resolveSender } from './syncInbox';
import {
  readInboxFromFolder,
  writeSealedToFolder,
  type SyncFolderProblem,
} from './syncInboxStorage';

export type SendOutcome = {
  connectionId: string;
  name: string;
  sent: boolean;
  /** Why not, in words that name the missing piece rather than a code. */
  reason?: string;
};

/**
 * Writes one sealed file per partner.
 *
 * Only partners, deliberately. Somebody you share a recipe with is not somebody
 * whose meals are being planned with yours, and the role distinction already
 * exists precisely so this does not have to guess.
 */
export async function sendToPartners(options?: { plan?: SyncPlanDay[] }): Promise<{
  outcomes: SendOutcome[];
  folderProblem: SyncFolderProblem | null;
}> {
  const [connections, myFingerprint, myConditions] = await Promise.all([
    listConnections(),
    getMyKeyFingerprint(),
    getUserConditions(),
  ]);

  const partners = connections.filter((connection) => connection.role === 'partner');
  if (partners.length === 0) return { outcomes: [], folderProblem: null };

  // getUserConditions returns the codes themselves, confirmed by the type checker
  // rejecting the assumption that they were objects.
  const myConditionCodes = myConditions;
  const sentAt = new Date().toISOString();
  const outcomes: SendOutcome[] = [];
  let folderProblem: SyncFolderProblem | null = null;

  for (const partner of partners) {
    if (!partner.encryptionPublicKeyBase64) {
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason:
          'They paired before this app could encrypt, so there is no key to seal anything to. Show each other a code once more to fix it.',
      });
      continue;
    }

    // Built per recipient, because the grants are per recipient. Reading them
    // inside buildSyncPayload rather than passing the fields is what stops a
    // caller here sending a condition list that was never granted.
    const payload = buildSyncPayload({
      grants: partner.grants,
      myConditionCodes,
      plan: options?.plan ?? [],
      referenceDbVersion: REFERENCE_DB_VERSION,
      fromFingerprint: myFingerprint,
      sentAt,
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

    const written = await writeSealedToFolder({
      toFingerprint: computeKeyFingerprint(partner.publicKeyBase64),
      fromFingerprint: myFingerprint,
      sealedBase64: sealed,
    });

    if (written.written) {
      outcomes.push({ connectionId: partner.id, name: partner.name, sent: true });
    } else {
      folderProblem = written.problem;
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason: 'The shared folder could not be written to.',
      });
    }
  }

  return { outcomes, folderProblem };
}

export type ReceiveOutcome = {
  /** Who it turned out to be from, once the sealed payload was opened. */
  name: string;
  /** How many condition codes were taken from it. */
  conditionCount: number;
  /** What was refused and why, if anything was. */
  note?: string;
};

/**
 * Reads whatever is addressed to this device and applies it.
 *
 * FOUR THINGS HAVE TO AGREE BEFORE ANYTHING IS STORED, and each is checked here
 * rather than assumed from the one before it:
 *
 *  1. The file is addressed to this device. lib/syncInbox.ts already did that.
 *  2. The sealed box opens with this device's own key. Only the intended
 *     recipient can, which is why a folder anyone in the house can see is safe.
 *  3. The fingerprint inside the payload matches the one in the filename. A name
 *     is not evidence, and a mismatch means the file was renamed or written by
 *     something other than the device it claims.
 *  4. That fingerprint belongs to somebody actually paired as a partner. A file
 *     from a stranger, or from somebody demoted since, is dropped.
 */
export async function receiveFromPartners(): Promise<{
  outcomes: ReceiveOutcome[];
  skipped: number;
  folderProblem: SyncFolderProblem | null;
}> {
  const myFingerprint = await getMyKeyFingerprint();
  const inbox = await readInboxFromFolder(myFingerprint);
  if (!inbox.read) return { outcomes: [], skipped: 0, folderProblem: inbox.problem };

  const connections = await listConnections();
  const byFingerprint = new Map<string, Connection>();
  for (const connection of connections) {
    byFingerprint.set(computeKeyFingerprint(connection.publicKeyBase64).replace(/\s+/g, ''), connection);
  }

  const outcomes: ReceiveOutcome[] = [];
  let skipped = inbox.skipped;

  for (const file of inbox.files) {
    const opened = await openSealedForMe(file.sealedBase64);
    if (!opened) {
      // Not addressed to this device's key after all, or damaged in transit.
      // Either way there is nothing to say about it beyond the count.
      skipped += 1;
      continue;
    }

    let text: string;
    try {
      text = new TextDecoder().decode(opened);
    } catch {
      skipped += 1;
      continue;
    }

    const result = readSyncPayload(text, { myReferenceDbVersion: REFERENCE_DB_VERSION });
    if (!result) {
      skipped += 1;
      continue;
    }

    const sender = resolveSender(file.claimedFromFingerprint, result.payload.fromFingerprint);
    if (!sender.trusted) {
      outcomes.push({ name: 'An unrecognised device', conditionCount: 0, note: sender.reason });
      continue;
    }

    const connection = byFingerprint.get(sender.fingerprint);
    if (!connection) {
      outcomes.push({
        name: 'An unrecognised device',
        conditionCount: 0,
        note: 'Something addressed to you arrived from a device you are not paired with, so it was ignored.',
      });
      continue;
    }
    if (connection.role !== 'partner') {
      outcomes.push({
        name: connection.name,
        conditionCount: 0,
        note: `${connection.name} is not set up as a partner, so what they sent was not used.`,
      });
      continue;
    }

    const codes = result.payload.conditionCodes ?? [];
    if (codes.length > 0) {
      await setPartnerConditionCodes(connection.id, codes);
    }

    // The plan is reported on but not stored, because nothing reads a partner's
    // plan yet. Saying so is better than silently discarding it.
    const note =
      result.planRefusal === 'differentReferenceDatabase'
        ? 'Their meal plan was left out because the two apps are on different versions of the food database. Updating both fixes it.'
        : undefined;

    outcomes.push({ name: connection.name, conditionCount: codes.length, note });
  }

  return { outcomes, skipped, folderProblem: null };
}

/**
 * One line summarising a send or a check, for putting on screen.
 *
 * Never claims more than happened: a run where every partner failed says so
 * rather than reporting success with a quiet caveat underneath.
 */
export function describeSend(outcomes: readonly SendOutcome[]): string {
  if (outcomes.length === 0) return 'No partners to send to yet.';
  const sent = outcomes.filter((outcome) => outcome.sent);
  if (sent.length === 0) {
    return `Nothing was sent. ${outcomes[0].reason ?? ''}`.trim();
  }
  const names = sent.map((outcome) => outcome.name).join(' and ');
  const failed = outcomes.length - sent.length;
  const base = `Sent to ${names}.`;
  return failed > 0 ? `${base} ${failed} could not be sent.` : base;
}

export function describeReceive(result: {
  outcomes: readonly ReceiveOutcome[];
  skipped: number;
}): string {
  if (result.outcomes.length === 0) {
    return result.skipped > 0
      ? 'Nothing new arrived. Some files in the folder could not be read, which usually means they are still syncing.'
      : 'Nothing new has arrived yet.';
  }
  const parts = result.outcomes.map((outcome) => {
    if (outcome.note) return outcome.note;
    if (outcome.conditionCount === 0) return `${outcome.name} did not share any conditions.`;
    const n = outcome.conditionCount;
    return `Got ${n} ${n === 1 ? 'condition' : 'conditions'} from ${outcome.name}.`;
  });
  return parts.join(' ');
}
