// Reading and writing the shared folder, and remembering which folder it is.
//
// The half of the carrier that touches the device. lib/syncInbox.ts holds the
// naming and addressing rules and is pure, so it can be tested in plain node;
// everything here needs a real folder and a real picker and cannot be, which is
// why the two are separate files rather than one. The same split
// lib/groceryList.ts and lib/groceryDb.ts already use.
//
// WHY THERE IS NO ACCOUNT ANYWHERE IN THIS FILE. The OneDrive API route was
// built as far as a live app registration and then ruled out on evidence:
// Graph's createLink needs Files.ReadWrite for a personal account, meaning full
// read and write access to somebody's entire OneDrive, to create the share link
// the design depends on. Disproportionate for a few hundred bytes, and the
// consent screen says so in those words to whoever is being asked. A folder the
// person picks needs no registration, no scope and no provider at all: whatever
// already syncs that folder moves the bytes, so the same code works over
// OneDrive, Google Drive, Dropbox or a plain SD card without knowing which.
//
// NOTHING FROM expo-file-system IS IMPORTED AT MODULE SCOPE. Every call goes
// through an await import() inside the function that needs it, the discipline
// lib/customBackgroundImage.ts established and lib/dataBackup.ts, lib/sharing.ts,
// lib/mealPhotos.ts and lib/isFileLinking.ts already follow.
//
// THIS NEEDED NO NATIVE REBUILD. Directory.pickDirectoryAsync is part of
// expo-file-system's SDK 54 class-based API, and that package is already linked
// into the shipped build; its presence was confirmed against the real type
// declarations and against the native Kotlin and Swift sources before anything
// here was written, rather than assumed from the docs.
//
// EVERY OPERATION REPORTS RATHER THAN THROWS. A folder chosen months ago can be
// gone: the permission revoked in Android settings, an SD card removed, the
// folder deleted from the other end of a sync. That is an ordinary state to
// explain, not an exception to crash on, so each function returns a result the
// caller can put on screen.
import {
  clearSyncFolderUri,
  getSyncFolderUri,
  setSyncFolderUri,
} from './db';
import { buildSyncFileName, incomingFilesFor, parseSyncFileName } from './syncInbox';

/** What a written or read attempt can honestly report. */
export type SyncFolderProblem =
  | 'notChosen'
  | 'unreachable'
  | 'writeFailed'
  | 'badFingerprint';

export const SYNC_FOLDER_PROBLEM_TEXT: Record<SyncFolderProblem, string> = {
  notChosen:
    'No shared folder has been picked yet. Choose one that both phones can see, such as a folder inside OneDrive, Google Drive or Dropbox.',
  unreachable:
    'The shared folder could not be opened. It may have been moved or deleted, or this app may have lost permission to it. Pick the folder again.',
  writeFailed:
    'The shared folder could not be written to. If it is inside a cloud folder, check that the folder still exists and that the sync app is signed in.',
  badFingerprint:
    'This device or the partner device does not have a usable key yet, so there was nothing to address the file to.',
};

/**
 * Opens the system folder picker and remembers what was chosen.
 *
 * The permission granted here is persistent and scoped to that one folder: this
 * app can read and write inside it and can see nothing else, which is the whole
 * reason this route is preferable to a cloud API's all-or-nothing file scope.
 *
 * Cancelling is not an error. Somebody opening a picker and changing their mind
 * is an ordinary thing to do, so it returns chosen: false with nothing stored and
 * nothing said, rather than an alarming message.
 */
export async function chooseSyncFolder(): Promise<
  { chosen: true; uri: string } | { chosen: false; problem?: SyncFolderProblem }
> {
  try {
    const { Directory } = await import('expo-file-system');
    const directory = await Directory.pickDirectoryAsync();
    const uri = directory?.uri?.trim();
    if (!uri) return { chosen: false };
    await setSyncFolderUri(uri);
    return { chosen: true, uri };
  } catch {
    // Both a cancel and a genuine failure land here, and the two are not
    // reliably distinguishable across platforms. Treated as a cancel, because
    // telling somebody their folder is broken when they simply pressed back is
    // worse than saying nothing.
    return { chosen: false };
  }
}

export async function forgetSyncFolder(): Promise<void> {
  await clearSyncFolderUri();
}

export type SyncFolderStatus =
  | { state: 'notChosen' }
  | { state: 'ready'; uri: string; fileCount: number }
  | { state: 'unreachable'; uri: string };

/**
 * Whether the remembered folder is still usable, checked rather than assumed.
 *
 * Listing it is the only honest test. A stored URI proves somebody once picked a
 * folder, not that the folder is there now, and a settings screen that says
 * "connected" about a folder that has been deleted is worse than one that says
 * nothing.
 */
export async function getSyncFolderStatus(): Promise<SyncFolderStatus> {
  const uri = await getSyncFolderUri();
  if (!uri) return { state: 'notChosen' };
  try {
    const { Directory } = await import('expo-file-system');
    const entries = new Directory(uri).list();
    const ours = entries.filter((entry) => parseSyncFileName(entry.uri) !== null);
    return { state: 'ready', uri, fileCount: ours.length };
  } catch {
    return { state: 'unreachable', uri };
  }
}

/**
 * Writes one sealed payload for one recipient.
 *
 * Overwrites rather than accumulating, because one file per direction is the
 * whole design: it removes the locking problem two devices sharing one file
 * would create, and a sync service reconciling whenever it feels like it is not
 * something to build a lock on top of.
 *
 * The contents are already sealed to the recipient by lib/partnerCrypto.ts
 * before they arrive here. This function deliberately does no encrypting of its
 * own, so there is exactly one place in the app where that decision is made and
 * no chance of a caller writing plaintext by calling the wrong function.
 */
export async function writeSealedToFolder(input: {
  toFingerprint: string;
  fromFingerprint: string;
  sealedBase64: string;
}): Promise<{ written: true; name: string } | { written: false; problem: SyncFolderProblem }> {
  const name = buildSyncFileName(input.toFingerprint, input.fromFingerprint);
  if (!name) return { written: false, problem: 'badFingerprint' };

  const uri = await getSyncFolderUri();
  if (!uri) return { written: false, problem: 'notChosen' };

  try {
    const { Directory, File } = await import('expo-file-system');
    const directory = new Directory(uri);
    const file = new File(directory, name);
    if (!file.exists) file.create({ overwrite: true });
    file.write(input.sealedBase64);
    return { written: true, name };
  } catch {
    return { written: false, problem: 'writeFailed' };
  }
}

export type IncomingSealed = {
  /** Who the filename says wrote it. Still a claim until the payload is opened. */
  claimedFromFingerprint: string;
  sealedBase64: string;
};

export type ReadInboxResult =
  | { read: true; files: IncomingSealed[]; skipped: number }
  | { read: false; problem: SyncFolderProblem };

/**
 * Collects every sealed payload addressed to this device.
 *
 * ONE UNREADABLE FILE DOES NOT SINK THE READ. A synced folder routinely holds a
 * file that is still arriving, and refusing the whole inbox because one entry
 * was half-written would mean a partner's plan never lands on a busy day. Each
 * failure is skipped and counted, so the caller can say how many were passed
 * over rather than pretending the folder was empty.
 *
 * The claimed sender is carried forward unverified on purpose. A filename is not
 * evidence, and lib/syncInbox.ts's resolveSender is what settles it once the
 * payload has actually been opened.
 */
export async function readInboxFromFolder(myFingerprint: string): Promise<ReadInboxResult> {
  const uri = await getSyncFolderUri();
  if (!uri) return { read: false, problem: 'notChosen' };

  let entryUris: string[];
  try {
    const { Directory } = await import('expo-file-system');
    entryUris = new Directory(uri).list().map((entry) => entry.uri);
  } catch {
    return { read: false, problem: 'unreachable' };
  }

  const mine = incomingFilesFor(entryUris, myFingerprint);
  const files: IncomingSealed[] = [];
  let skipped = 0;

  const { File } = await import('expo-file-system');
  for (const candidate of mine) {
    try {
      const contents = (await new File(candidate.entry).text()).trim();
      if (!contents) {
        skipped += 1;
        continue;
      }
      files.push({ claimedFromFingerprint: candidate.fromFingerprint, sealedBase64: contents });
    } catch {
      skipped += 1;
    }
  }

  return { read: true, files, skipped };
}

/**
 * Removes files this device wrote for people it is no longer paired with.
 *
 * Worth doing rather than leaving: a file left behind after somebody unpairs
 * stays readable by whoever can see the folder, and nobody would think to go
 * looking for it. Only ever deletes names this device is responsible for
 * writing, never anything addressed to it and never anything it does not
 * recognise, since the folder is the person's own storage and may hold plenty
 * that is none of this app's business.
 *
 * Reports how many went rather than throwing, since cleanup failing is not a
 * reason to block whatever the caller was actually doing.
 */
export async function removeOutgoingFor(input: {
  myFingerprint: string;
  formerRecipientFingerprints: readonly string[];
}): Promise<{ removed: number }> {
  const uri = await getSyncFolderUri();
  if (!uri) return { removed: 0 };

  const targets = new Set<string>();
  for (const recipient of input.formerRecipientFingerprints) {
    const name = buildSyncFileName(recipient, input.myFingerprint);
    if (name) targets.add(name.toLowerCase());
  }
  if (targets.size === 0) return { removed: 0 };

  let removed = 0;
  try {
    const { Directory } = await import('expo-file-system');
    for (const entry of new Directory(uri).list()) {
      const parsed = parseSyncFileName(entry.uri);
      if (!parsed) continue;
      const name = buildSyncFileName(parsed.toFingerprint, parsed.fromFingerprint);
      if (!name || !targets.has(name.toLowerCase())) continue;
      try {
        entry.delete();
        removed += 1;
      } catch {
        // A file that will not delete is not worth failing the whole cleanup for.
      }
    }
  } catch {
    return { removed };
  }

  return { removed };
}
