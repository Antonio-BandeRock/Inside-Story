// The one folder somebody chooses, and the shape the app keeps inside it.
//
// THE CORRECTION THIS FILE EXISTS FOR. An earlier pass asked for two folders to
// be chosen separately, one for the mailbox and one for backups, which put the
// person in charge of a layout the app should be keeping itself. The right shape
// was stated plainly: one Shared Folder, made when the app is first opened
// whether or not anybody is ever added as a partner, with everything the app
// keeps in OneDrive living under it.
//
//   Shared Folder            what the person picks, once
//   |- Mailbox               where every person's mailbox lives
//   |- Backups               where backups are written
//
// MAILBOX IS A CONTAINER FOR EVERYBODY'S MAIL, not one person's inbox. Files in
// it are already named for who they are addressed to and who they came from, so
// a partner and, later, a child all use the same folder without seeing each
// other's mail: lib/syncInbox.ts's own incomingFilesFor drops anything not
// addressed to this device before a byte is downloaded.
//
// BACKUPS SITS UNDER THE SHARED FOLDER TOO, by direct decision. That has a
// consequence worth being straight about rather than burying: whoever the Shared
// Folder is shared with in OneDrive can see the Backups folder inside it, and a
// backup is the whole record. The app says so on the screen where the folder is
// chosen rather than leaving somebody to work it out.
//
// LOOKED UP BY NAME, NOT REMEMBERED BY ID. Somebody can delete or recreate
// either child in OneDrive, and an id remembered from months ago would point at
// nothing while the folder they can plainly see sits there unused.

import { getOneDriveFolder, setOneDriveFolder, type StoredOneDriveFolder } from './db';
import { isSignedIn } from './oneDriveAuth';
import { checkFolder, ensureChildFolder, type DriveItemRef, type GraphResult } from './oneDriveGraph';

/** What the two children are called. Fixed, because the app owns them. */
export const MAILBOX_FOLDER_NAME = 'Mailbox';
export const BACKUPS_FOLDER_NAME = 'Backups';

/**
 * Resolved children, kept only for the life of this app run.
 *
 * Resolving costs a listing of the shared folder, and sending, checking and
 * backing up would each pay it. Not persisted: a folder deleted in OneDrive
 * between runs should be found missing and made again, which is exactly what
 * starting from nothing each run gives.
 */
let cache: { rootItemId: string; mailbox?: DriveItemRef; backups?: DriveItemRef } | null = null;

export type SharedFolderState =
  | { state: 'notSignedIn' }
  | { state: 'notSetUp' }
  | { state: 'unreachable'; name: string; reason: string }
  | { state: 'ready'; folder: DriveItemRef };

/**
 * The Shared Folder, confirmed to still be there.
 *
 * Re-checked rather than trusted, because a folder can be renamed, moved or
 * deleted long after it was picked, and finding that out when somebody taps Send
 * is worse than finding it out on the screen that shows it. A rename or a move
 * is not a problem; the stored copy is brought back in line and used.
 */
export async function getSharedFolder(): Promise<SharedFolderState> {
  if (!(await isSignedIn())) return { state: 'notSignedIn' };

  const stored = await getOneDriveFolder();
  if (!stored) return { state: 'notSetUp' };

  const checked = await checkFolder(stored);
  if (!checked.ok) {
    return { state: 'unreachable', name: stored.name, reason: checked.reason };
  }

  if (checked.value.name !== stored.name || checked.value.path !== stored.path) {
    const refreshed: StoredOneDriveFolder = {
      ...stored,
      name: checked.value.name,
      path: checked.value.path,
    };
    await setOneDriveFolder(refreshed);
    return { state: 'ready', folder: refreshed };
  }

  return { state: 'ready', folder: stored };
}

/** Wording for a shared folder that is not usable, said the same way everywhere. */
export function describeSharedFolderProblem(state: SharedFolderState): string {
  switch (state.state) {
    case 'notSignedIn':
      return 'Sign in to OneDrive first, on the Shared Folder screen.';
    case 'notSetUp':
      return 'No shared folder set up yet. Set one up on the Shared Folder screen.';
    case 'unreachable':
      return state.name + ' could not be opened. ' + state.reason;
    case 'ready':
      return state.folder.path ?? state.folder.name;
  }
}

async function resolveChild(
  which: 'mailbox' | 'backups',
  name: string,
): Promise<GraphResult<DriveItemRef> | { ok: false; reason: string }> {
  const shared = await getSharedFolder();
  if (shared.state !== 'ready') {
    return { ok: false, reason: describeSharedFolderProblem(shared) };
  }

  if (cache && cache.rootItemId === shared.folder.itemId) {
    const hit = cache[which];
    if (hit) return { ok: true, value: hit };
  } else {
    // A different shared folder means every remembered child belongs to the old
    // one and none of it applies.
    cache = { rootItemId: shared.folder.itemId };
  }

  const made = await ensureChildFolder(shared.folder, name);
  if (!made.ok) return made;
  cache = { ...(cache ?? { rootItemId: shared.folder.itemId }), [which]: made.value };
  return made;
}

/** Where every mailbox lives, made inside the shared folder if it is missing. */
export async function getMailboxFolder(): Promise<GraphResult<DriveItemRef>> {
  return resolveChild('mailbox', MAILBOX_FOLDER_NAME) as Promise<GraphResult<DriveItemRef>>;
}

/** Where backups are written, made inside the shared folder if it is missing. */
export async function getBackupsFolder(): Promise<GraphResult<DriveItemRef>> {
  return resolveChild('backups', BACKUPS_FOLDER_NAME) as Promise<GraphResult<DriveItemRef>>;
}

/**
 * Makes both children now, rather than on first use.
 *
 * Called when a shared folder is chosen, so somebody can open OneDrive straight
 * afterwards and see the shape they were told about. Finding an empty folder
 * where the app said Mailbox and Backups would be is the kind of small
 * discrepancy that makes people stop trusting the rest of it.
 */
export async function prepareSharedFolder(): Promise<{ ok: boolean; reason?: string }> {
  cache = null;
  const mailbox = await getMailboxFolder();
  if (!mailbox.ok) return { ok: false, reason: mailbox.reason };
  const backups = await getBackupsFolder();
  if (!backups.ok) return { ok: false, reason: backups.reason };
  return { ok: true };
}

/** Drops what was resolved, for a sign-out or a change of folder. */
export function forgetResolvedFolders(): void {
  cache = null;
}
