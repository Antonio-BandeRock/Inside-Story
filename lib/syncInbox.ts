// Naming and addressing for files in a shared folder, kept pure so it can be
// tested in plain node.
//
// WHY A SHARED FOLDER RATHER THAN A CLOUD API. The OneDrive route was built as
// far as a live app registration and then ruled out on evidence: Graph's
// createLink needs Files.ReadWrite for a personal account, which is full read
// and write access to somebody's entire OneDrive, to move a few hundred bytes.
// See lib/oneDriveConfig.ts for the finding. A folder the person picks needs no
// registration, no scope, and no permission from Microsoft or Google at all,
// because whatever sync app already owns that folder moves the bytes.
//
// AN INBOX PER RECIPIENT, NOT ONE SHARED FILE. Two devices writing one file is a
// locking problem, and locking over a sync service that reconciles whenever it
// feels like it is not a problem worth having. One file per direction removes it
// outright: each device only ever writes its own outgoing files and only ever
// reads the ones addressed to it. It also extends to children with no new
// mechanism, since a third device is just more filenames in the same folder.
//
// THE FOLDER IS ASSUMED VISIBLE TO OTHERS, AND THAT IS FINE. Anyone who can see
// the folder can see the files. Every payload is sealed to one recipient's
// encryption key by lib/partnerCrypto.ts before it ever gets here, so a listing
// reveals who is talking to whom and nothing about what was said.
//
// A FILENAME IS NOT EVIDENCE. Nothing stops a file being named as though it came
// from someone. The name is only used to decide what is worth opening; who it
// actually came from is settled by opening the sealed payload and checking the
// fingerprint inside it against the name. resolveSender below is that check.

/** Prefix every file this app writes carries, so nothing else is mistaken for ours. */
export const SYNC_FILE_PREFIX = 'is-sync';

export const SYNC_FILE_EXTENSION = '.json';

/** What a fingerprint looks like once the display spacing is stripped: 16 hex characters. */
const COMPACT_FINGERPRINT = /^[0-9A-F]{16}$/;

/**
 * Strips the display spacing out of a key fingerprint.
 *
 * computeKeyFingerprint returns groups of four for reading out loud ("A1B2 C3D4
 * E5F6 7890"). A filename cannot carry spaces comfortably across every file
 * system a synced folder might land on, so they come out here and go back in
 * only for display.
 */
export function compactFingerprint(fingerprint: string): string | null {
  const compact = fingerprint.replace(/\s+/g, '').toUpperCase();
  return COMPACT_FINGERPRINT.test(compact) ? compact : null;
}

/**
 * The filename for one direction of one pairing.
 *
 * Deliberately stable rather than timestamped: sending again overwrites, so a
 * folder holds the latest state per direction instead of growing forever. How
 * fresh it is comes from sentAt inside the payload, which is signed and sealed,
 * rather than from a filename anyone could have typed.
 *
 * Returns null rather than a plausible-looking name if either fingerprint is not
 * a fingerprint, since a malformed name would be written once and then never
 * matched by the reader, which is a silent failure.
 */
export function buildSyncFileName(toFingerprint: string, fromFingerprint: string): string | null {
  const to = compactFingerprint(toFingerprint);
  const from = compactFingerprint(fromFingerprint);
  if (!to || !from) return null;
  if (to === from) return null; // Nothing sends to itself.
  return `${SYNC_FILE_PREFIX}-${to}-${from}${SYNC_FILE_EXTENSION}`;
}

export type ParsedSyncFileName = {
  /** Who the file claims to be for. */
  toFingerprint: string;
  /** Who the file claims to be from. Unverified until the payload is opened. */
  fromFingerprint: string;
};

/**
 * Reads a directory entry, or returns null for anything that is not ours.
 *
 * Takes either a bare filename or a full URI, because a folder chosen through
 * Android's Storage Access Framework lists its contents as content:// URIs with
 * the name percent-encoded inside the document id, while every other way of
 * listing a folder gives plain names. Handling both means the caller never has
 * to know which it is holding.
 */
export function parseSyncFileName(entry: string): ParsedSyncFileName | null {
  let decoded = entry;
  try {
    decoded = decodeURIComponent(entry);
  } catch {
    // A stray percent sign is not worth refusing over; fall through with the raw
    // text, which still parses correctly for a plain filename.
  }

  // Take whatever follows the last separator. SAF document ids use both, since
  // the path inside the id is encoded with colons and slashes.
  const name = decoded.split(/[/\\:]/).pop() ?? '';

  const lower = name.toLowerCase();
  if (!lower.startsWith(`${SYNC_FILE_PREFIX}-`)) return null;
  if (!lower.endsWith(SYNC_FILE_EXTENSION)) return null;

  const middle = name.slice(SYNC_FILE_PREFIX.length + 1, name.length - SYNC_FILE_EXTENSION.length);
  const parts = middle.split('-');
  if (parts.length !== 2) return null;

  const to = compactFingerprint(parts[0]);
  const from = compactFingerprint(parts[1]);
  if (!to || !from) return null;
  if (to === from) return null;

  return { toFingerprint: to, fromFingerprint: from };
}

export type IncomingSyncFile = {
  /** The directory entry exactly as it was listed, so the caller can read it back. */
  entry: string;
  /** Who it claims to be from. Still a claim at this point. */
  fromFingerprint: string;
};

/**
 * Picks out of a directory listing only the files addressed to this device.
 *
 * The privacy-relevant function in this module. A folder shared by a household
 * holds everybody's files, and this is what stops one device reading another
 * person's mail. It matches on the recipient half of the name, never merely on
 * the prefix, and a file addressed to somebody else is dropped even though it
 * would open to nothing anyway, because relying on the encryption alone would
 * mean every device downloading and attempting every other device's payloads.
 */
export function incomingFilesFor(entries: readonly string[], myFingerprint: string): IncomingSyncFile[] {
  const me = compactFingerprint(myFingerprint);
  if (!me) return [];

  const found: IncomingSyncFile[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const parsed = parseSyncFileName(entry);
    if (!parsed) continue;
    if (parsed.toFingerprint !== me) continue;
    // One file per sender by design. If a folder somehow holds two, take the
    // first and ignore the rest rather than guessing which is newer from a name.
    if (seen.has(parsed.fromFingerprint)) continue;
    seen.add(parsed.fromFingerprint);
    found.push({ entry, fromFingerprint: parsed.fromFingerprint });
  }

  return found;
}

/**
 * Confirms an opened payload actually came from who its filename said.
 *
 * The filename is how a device decides what to open; this is how it decides
 * whether to believe it. A mismatch means either the file was renamed or it was
 * written by something other than the device it names, and either way the
 * honest answer is to refuse it rather than attribute a partner's meal plan to
 * the wrong person.
 */
export function resolveSender(
  claimedFromFingerprint: string,
  payloadFromFingerprint: string,
): { trusted: true; fingerprint: string } | { trusted: false; reason: string } {
  const claimed = compactFingerprint(claimedFromFingerprint);
  const actual = compactFingerprint(payloadFromFingerprint);

  if (!actual) {
    return { trusted: false, reason: 'The file did not say which device wrote it.' };
  }
  if (!claimed) {
    return { trusted: false, reason: 'The file name did not say who it was from.' };
  }
  if (claimed !== actual) {
    return {
      trusted: false,
      reason: 'The file name and the contents disagree about which device sent it, so it was not used.',
    };
  }
  return { trusted: true, fingerprint: actual };
}

/**
 * Every filename this device is responsible for writing, given its partners.
 *
 * Used to clean up after a partner is removed: a file left in a shared folder
 * after someone unpaired keeps being readable, and nobody would think to go
 * looking for it, so the app has to know its own litter by name.
 */
export function outgoingFileNames(
  myFingerprint: string,
  recipientFingerprints: readonly string[],
): string[] {
  const names: string[] = [];
  for (const recipient of recipientFingerprints) {
    const name = buildSyncFileName(recipient, myFingerprint);
    if (name) names.push(name);
  }
  return names;
}
