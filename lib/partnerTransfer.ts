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
import { writeRawIsFile } from './sharing';
import { Share } from 'react-native';
import { shareFileIfAvailable } from './nativeSharing';

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

// ---------------------------------------------------------------------------
// THE CARRIER THAT ALWAYS WORKS: hand the sealed file over yourself.
//
// Three carriers were investigated before this one, and each was ruled out by
// evidence rather than taste:
//
//  1. A CLOUD API. A OneDrive app registration was completed and then abandoned:
//     Graph's createLink needs full read and write access to somebody's entire
//     OneDrive for a personal account, and /shares requires a bearer token on
//     the reading side too, so BOTH people would have to sign in and both would
//     have to grant access to every document and photo they own. To move a few
//     hundred bytes.
//  2. A SHARED FOLDER. Android's folder picker only lists providers that support
//     directory trees, and few cloud providers do. Confirmed on a real device:
//     OneDrive does not appear in the picker at all. The OneDrive Android app
//     also keeps no locally synced folder to point at instead, unlike the
//     Windows client.
//  3. A QR CODE. Measured, not guessed: condition codes fit easily, a one-week
//     plan is borderline at 141x141 modules, and anything longer will not fit.
//
// So the payload is handed over as a file, through whatever the two people
// already use to send each other things. NO ACCOUNT, NO PERMISSION FROM ANY
// PROVIDER, AND IT WORKS WHEN THEY ARE APART. The tradeoff is honest and named
// on screen: it is a deliberate act rather than a background poll.
//
// BOTH HALVES WERE ALREADY BUILT AND PROVEN IN THIS APP. writeRawIsFile has
// written .is files since recipe sharing shipped, shareFileIfAvailable is the
// second of the two native calls this app has always needed on Android (React
// Native's own Share.share silently discards its url field there), and
// File.pickFileAsync is what Backup & Restore already uses to read a file back
// in. This is wiring, not new capability.
//
// PICKING RATHER THAN TAPPING IS THE POINT. Tapping a received .is file has
// never reliably opened this app on Android, because a content:// URI handed
// over by another app usually carries no filename for the intent filter to match
// (see the 1.0.34.34 finding). Opening the file browser from inside the app
// sidesteps that entirely: no intent filter, no OS registration, nothing outside
// this app has to cooperate.

export const PARTNER_SYNC_FILE_KIND = 'partnerSync';

/**
 * What a handed-over file contains.
 *
 * The sealed blob plus who it is for and who it claims to be from. Both
 * fingerprints are outside the seal because the receiver has to know whether to
 * bother opening it, and neither is trusted: the one inside the sealed payload
 * is what resolveSender checks against.
 */
type PartnerSyncFile = {
  kind: typeof PARTNER_SYNC_FILE_KIND;
  v: 1;
  to: string;
  from: string;
  sealed: string;
};

/**
 * Builds the sealed file for one partner and opens the share sheet.
 *
 * One partner at a time, because a share sheet sends one thing to one place. A
 * button per partner row is also clearer than one button that silently decides
 * who it meant.
 */
export async function sendToPartnerAsFile(connectionId: string): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const [connections, myFingerprint, myConditions] = await Promise.all([
    listConnections(),
    getMyKeyFingerprint(),
    getUserConditions(),
  ]);

  const partner = connections.find((connection) => connection.id === connectionId);
  if (!partner) return { sent: false, reason: 'That partner is no longer in your list.' };
  if (partner.role !== 'partner') {
    return { sent: false, reason: `${partner.name} is not set up as a partner.` };
  }
  if (!partner.encryptionPublicKeyBase64) {
    return {
      sent: false,
      reason:
        'They paired before this app could encrypt, so there is no key to seal anything to. Show each other a code once more to fix it.',
    };
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
    return { sent: false, reason: 'Their key could not be used to encrypt this. Pair with them again.' };
  }

  const wire: PartnerSyncFile = {
    kind: PARTNER_SYNC_FILE_KIND,
    v: 1,
    to: computeKeyFingerprint(partner.publicKeyBase64),
    from: myFingerprint,
    sealed,
  };

  const uri = await writeRawIsFile(wire);
  if (!uri) {
    return { sent: false, reason: 'The file could not be written. There may be no room left on the device.' };
  }

  // MATCHES THE CONFIGURATION RECIPE SHARING ALREADY PROVES ON A REAL PHONE,
  // rather than a plausible-looking one. Two differences, both of which decide
  // whether the file reaches anybody:
  //
  //  * mimeType '*/*' rather than application/octet-stream. Messaging apps filter
  //    the share sheet by type, and a .is file under a narrow type can be left
  //    out of the list entirely. The recipe path has used '*/*' since it shipped.
  //  * Share.share({ message }) first, then the file. React Native's own
  //    Share.share silently discards its url field on Android, which is why every
  //    file share in this app has always been two native calls rather than one.
  await Share.share({
    message: `Here is what I am sharing with you from Inside Story. Open it with Get What They Sent on the Connections screen.`,
  });
  const shared = await shareFileIfAvailable(uri, {
    dialogTitle: `Send to ${partner.name}`,
    mimeType: '*/*',
  });
  if (!shared) {
    return {
      sent: false,
      reason: 'This device could not open a way to send the file.',
    };
  }
  return { sent: true };
}

/**
 * Reads a file a partner handed over, after the person picks it.
 *
 * THE SAME FOUR CHECKS AS THE FOLDER PATH, deliberately reusing the same
 * functions rather than a second copy: addressed to this device, opens with this
 * device's key, the fingerprint inside the payload matches the one outside it,
 * and that fingerprint belongs to somebody paired as a partner. A carrier
 * changing does not change what has to be true before anything is stored.
 */
export async function importPartnerFile(): Promise<{ applied: boolean; message: string }> {
  let text: string;
  try {
    const { File } = await import('expo-file-system');
    // No mime filter. A .is file arriving through a messaging app can land with
    // almost any type attached, and filtering on one would hide the very file
    // the person is trying to pick.
    const picked = await File.pickFileAsync();
    const file = Array.isArray(picked) ? picked[0] : picked;
    if (!file) return { applied: false, message: 'Nothing was picked.' };
    text = await file.text();
  } catch {
    // Cancelling lands here too, and is not worth an alarming message.
    return { applied: false, message: 'No file was read.' };
  }

  let wire: Partial<PartnerSyncFile>;
  try {
    wire = JSON.parse(text) as Partial<PartnerSyncFile>;
  } catch {
    return {
      applied: false,
      message: 'That file could not be read. Make sure you picked the file your partner sent from this app.',
    };
  }

  if (wire.kind !== PARTNER_SYNC_FILE_KIND || typeof wire.sealed !== 'string') {
    return {
      applied: false,
      message: 'That file is not something a partner sent from this app.',
    };
  }

  const opened = await openSealedForMe(wire.sealed);
  if (!opened) {
    return {
      applied: false,
      message: 'That file was not sent to this phone, so it could not be opened. Ask them to send it again to you specifically.',
    };
  }

  const result = readSyncPayload(new TextDecoder().decode(opened), {
    myReferenceDbVersion: REFERENCE_DB_VERSION,
  });
  if (!result) {
    return { applied: false, message: 'The file opened but its contents could not be read.' };
  }

  const sender = resolveSender(
    typeof wire.from === 'string' ? wire.from : '',
    result.payload.fromFingerprint,
  );
  if (!sender.trusted) return { applied: false, message: sender.reason };

  const connections = await listConnections();
  const connection = connections.find(
    (candidate) => computeKeyFingerprint(candidate.publicKeyBase64).replace(/\s+/g, '') === sender.fingerprint,
  );
  if (!connection) {
    return {
      applied: false,
      message: 'That came from a device you are not paired with, so nothing was used from it.',
    };
  }
  if (connection.role !== 'partner') {
    return {
      applied: false,
      message: `${connection.name} is not set up as a partner, so what they sent was not used.`,
    };
  }

  const codes = result.payload.conditionCodes ?? [];
  if (codes.length > 0) await setPartnerConditionCodes(connection.id, codes);

  const parts: string[] = [];
  if (codes.length > 0) {
    parts.push(
      `Got ${codes.length} ${codes.length === 1 ? 'condition' : 'conditions'} from ${connection.name}. Meal plans you generate now account for both of you.`,
    );
  } else {
    parts.push(`${connection.name} did not share which conditions they track.`);
  }
  if (result.planRefusal === 'differentReferenceDatabase') {
    parts.push(
      'Their meal plan was left out because the two apps are on different versions of the food database. Updating both fixes it.',
    );
  }

  return { applied: codes.length > 0, message: parts.join(' ') };
}
