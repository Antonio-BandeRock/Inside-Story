// Reading and writing one OneDrive folder through Microsoft Graph.
//
// WHAT THIS BUYS THAT ANDROID COULD NOT. Folders. Android's document provider
// for OneDrive hands out single files and refuses to enumerate directories, so
// no picker built on it can show somebody their own folders. Graph lists them,
// which is what makes choosing a folder a real choice rather than typing a name
// and hoping both phones meant the same one.
//
// SHARED FOLDERS ARE NOT IN YOUR OWN DRIVE, and getting that wrong is the whole
// feature. A folder somebody else shared with you does not appear under
// /me/drive at all; it appears under /me/drive/sharedWithMe as a stub carrying a
// remoteItem, and the real thing lives in THEIR drive. So nothing here addresses
// items by id alone: every folder and file is a (driveId, itemId) pair, because
// an id without the drive it belongs to is not an address.
//
// EVERY REQUEST GOES THROUGH ONE FUNCTION. graphFetch attaches the token,
// refreshes it when it has aged out, and turns a Graph error body into a
// sentence rather than a status code. One place means a permission problem
// reads the same wherever it surfaces.

import { getAccessToken } from './oneDriveAuth';

const GRAPH = 'https://graph.microsoft.com/v1.0';

/**
 * A folder or file, addressed the only way that works across drives.
 *
 * driveId is not optional and not a convenience. Dropping it works right up
 * until the folder in use is one a partner shared, which is the case this whole
 * feature exists for.
 */
export type DriveItemRef = {
  driveId: string;
  itemId: string;
  name: string;
  /**
   * Where it sits, for a person to read. Never used to address anything.
   *
   * Two folders can be called Backups and a name alone cannot tell them
   * apart, which is the whole reason this is here. Optional because a folder
   * somebody else shared reports a path inside THEIR drive, which would be
   * misleading rather than helpful, so in that case there is honestly nothing
   * to show.
   */
  path?: string;
};

/**
 * Turns Graph's own parent path into something worth showing.
 *
 * Graph reports a parent as /drive/root:/Documents, or /drives/{id}/root:/x
 * for another drive. Everything up to and including root: is addressing rather
 * than location, so it goes, and what is left is joined with the item name.
 * Returns undefined rather than a half-parsed string when the shape is not the
 * one this understands, since a wrong path is worse than none.
 */
export function describeItemPath(parentPath: string | undefined, name: string): string | undefined {
  if (typeof parentPath !== 'string') return undefined;
  const marker = parentPath.indexOf('root:');
  if (marker === -1) return undefined;
  const inside = decodeURIComponent(parentPath.slice(marker + 5));
  const parts = inside.split('/').filter((part) => part.length > 0);
  parts.push(name);
  return 'OneDrive / ' + parts.join(' / ');
}

export type GraphResult<T> = { ok: true; value: T } | { ok: false; reason: string };

type GraphChild = {
  id?: string;
  name?: string;
  folder?: { childCount?: number };
  file?: { mimeType?: string };
  parentReference?: { driveId?: string; path?: string };
  remoteItem?: {
    id?: string;
    name?: string;
    folder?: { childCount?: number };
    file?: { mimeType?: string };
    parentReference?: { driveId?: string; path?: string };
  };
};

async function graphFetch(
  path: string,
  init?: { method?: string; body?: string; contentType?: string; raw?: boolean },
): Promise<GraphResult<unknown>> {
  const token = await getAccessToken();
  if (!token.ok) return { ok: false, reason: token.reason };

  const headers: Record<string, string> = { Authorization: 'Bearer ' + token.token };
  if (init?.contentType) headers['Content-Type'] = init.contentType;

  let response: Response;
  try {
    response = await fetch(GRAPH + path, {
      method: init?.method ?? 'GET',
      headers,
      body: init?.body,
    });
  } catch {
    return { ok: false, reason: 'OneDrive could not be reached. Check the connection and try again.' };
  }

  if (response.status === 204) return { ok: true, value: null };

  if (!response.ok) {
    // Graph's own message names the actual problem: a folder that was moved, a
    // permission that was never granted, a name already in use. Reading it out
    // is more useful than a status number.
    let detail = 'OneDrive refused that (' + response.status + ').';
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) detail = body.error.message;
    } catch {
      // A body that is not JSON leaves the status-based sentence in place.
    }
    return { ok: false, reason: detail };
  }

  if (init?.raw) {
    try {
      return { ok: true, value: await response.text() };
    } catch {
      return { ok: false, reason: 'The file could not be read from OneDrive.' };
    }
  }

  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, reason: 'OneDrive sent back something this app could not read.' };
  }
}

/**
 * Turns a Graph child into an address, collapsing the shared-folder stub.
 *
 * A shared item's real id and drive live under remoteItem, and the outer id is
 * a pointer in the viewer's own drive that cannot be used to list children.
 * Preferring remoteItem here is what makes a shared folder usable at all.
 */
function toRef(child: GraphChild, fallbackDriveId: string): DriveItemRef | null {
  const remote = child.remoteItem;
  const id = remote?.id ?? child.id;
  const name = remote?.name ?? child.name;
  const driveId = remote?.parentReference?.driveId ?? child.parentReference?.driveId ?? fallbackDriveId;
  if (!id || !name || !driveId) return null;
  const parentPath = remote?.parentReference?.path ?? child.parentReference?.path;
  return { driveId, itemId: id, name, path: describeItemPath(parentPath, name) };
}

function isFolder(child: GraphChild): boolean {
  return Boolean(child.remoteItem?.folder ?? child.folder);
}

/** The id of the signed-in person's own drive, needed to address its root. */
export async function getMyDriveId(): Promise<GraphResult<string>> {
  const result = await graphFetch('/me/drive?$select=id');
  if (!result.ok) return result;
  const id = (result.value as { id?: string }).id;
  if (!id) return { ok: false, reason: 'OneDrive did not say which drive belongs to this account.' };
  return { ok: true, value: id };
}

/** Folders at the top of the person's own OneDrive. */
export async function listMyRootFolders(): Promise<GraphResult<DriveItemRef[]>> {
  const drive = await getMyDriveId();
  if (!drive.ok) return drive;
  const result = await graphFetch('/me/drive/root/children?$top=200&$select=id,name,folder,parentReference');
  if (!result.ok) return result;
  const items = ((result.value as { value?: GraphChild[] }).value ?? [])
    .filter(isFolder)
    .map((child) => toRef(child, drive.value))
    .filter((ref): ref is DriveItemRef => ref !== null);
  return { ok: true, value: items };
}

/**
 * Folders other people have shared with this account.
 *
 * The first place to look for a partner mailbox, since the usual arrangement is
 * that one person makes the folder and shares it with the other. Whoever made it
 * finds it under their own files instead, which is why both lists are offered.
 */
export async function listSharedFolders(): Promise<GraphResult<DriveItemRef[]>> {
  const result = await graphFetch('/me/drive/sharedWithMe');
  if (!result.ok) return result;
  const items = ((result.value as { value?: GraphChild[] }).value ?? [])
    .filter(isFolder)
    .map((child) => toRef(child, ''))
    .filter((ref): ref is DriveItemRef => ref !== null && ref.driveId.length > 0);
  return { ok: true, value: items };
}

/** Folders inside a folder, so the picker can go deeper than one level. */
export async function listChildFolders(parent: DriveItemRef): Promise<GraphResult<DriveItemRef[]>> {
  const result = await graphFetch(
    '/drives/' + parent.driveId + '/items/' + parent.itemId +
      '/children?$top=200&$select=id,name,folder,parentReference',
  );
  if (!result.ok) return result;
  const items = ((result.value as { value?: GraphChild[] }).value ?? [])
    .filter(isFolder)
    .map((child) => toRef(child, parent.driveId))
    .filter((ref): ref is DriveItemRef => ref !== null);
  return { ok: true, value: items };
}

/**
 * The folder of this name inside the parent, made if it is not there yet.
 *
 * The person chooses one folder and the app owns the shape underneath it, so
 * this is how Mailbox and Backups come to exist without anybody being asked to
 * make them. Looked up by name rather than remembered by id, deliberately:
 * somebody can delete or recreate either of them in OneDrive, and an id
 * remembered from months ago would then point at nothing while the folder they
 * can plainly see sits there unused.
 *
 * The create is a race against nothing in practice, but if two devices set up
 * at once, conflictBehavior rename would leave a Mailbox 1 nobody looks in. So
 * a failed create re-reads the listing before giving up: the usual reason a
 * create fails is that the folder now exists.
 */
export async function ensureChildFolder(
  parent: DriveItemRef,
  name: string,
): Promise<GraphResult<DriveItemRef>> {
  const existing = await listChildFolders(parent);
  if (!existing.ok) return existing;
  const lower = name.toLowerCase();
  const found = existing.value.find((folder) => folder.name.toLowerCase() === lower);
  if (found) return { ok: true, value: found };

  const made = await createFolder(parent, name);
  if (made.ok) return made;

  const retry = await listChildFolders(parent);
  if (!retry.ok) return made;
  const late = retry.value.find((folder) => folder.name.toLowerCase() === lower);
  return late ? { ok: true, value: late } : made;
}

/** Makes a folder, so somebody can set the mailbox up without leaving the app. */
export async function createFolder(
  parent: DriveItemRef,
  name: string,
): Promise<GraphResult<DriveItemRef>> {
  const result = await graphFetch('/drives/' + parent.driveId + '/items/' + parent.itemId + '/children', {
    method: 'POST',
    contentType: 'application/json',
    body: JSON.stringify({
      name,
      folder: {},
      // Renames rather than failing or overwriting if the name is taken. A
      // second folder called "Inside Story 1" is recoverable; a silently
      // replaced one is not.
      '@microsoft.graph.conflictBehavior': 'rename',
    }),
  });
  if (!result.ok) return result;
  const ref = toRef(result.value as GraphChild, parent.driveId);
  if (!ref) return { ok: false, reason: 'The folder was made but OneDrive did not say where.' };
  return { ok: true, value: ref };
}

/** Files directly inside a folder, by name, so an inbox can be scanned. */
export type DriveFileRef = { itemId: string; name: string };

/**
 * Files in a folder, with the ids needed to act on them.
 *
 * Separate from listFileNames because the mailbox only ever needs names and
 * asking for more than is needed there would be untidy, while moving a file
 * cannot be done with a name at all.
 */
export async function listFiles(folder: DriveItemRef): Promise<GraphResult<DriveFileRef[]>> {
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + '/children?$top=200&$select=id,name,file',
  );
  if (!result.ok) return result;
  const files = ((result.value as { value?: GraphChild[] }).value ?? [])
    .filter((child) => Boolean(child.file) && typeof child.name === 'string' && typeof child.id === 'string')
    .map((child) => ({ itemId: child.id as string, name: child.name as string }));
  return { ok: true, value: files };
}

/**
 * Moves a file into another folder.
 *
 * A move in Graph is a change of parent, which is why this reads as an edit
 * rather than a copy and a delete. Nothing is duplicated and nothing is left
 * behind, so a move that half fails cannot lose the file.
 */
export async function moveFile(
  from: DriveItemRef,
  file: DriveFileRef,
  into: DriveItemRef,
): Promise<GraphResult<null>> {
  const result = await graphFetch('/drives/' + from.driveId + '/items/' + file.itemId, {
    method: 'PATCH',
    contentType: 'application/json',
    body: JSON.stringify({ parentReference: { driveId: into.driveId, id: into.itemId } }),
  });
  if (!result.ok) return result;
  return { ok: true, value: null };
}

export async function listFileNames(folder: DriveItemRef): Promise<GraphResult<string[]>> {
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + '/children?$top=200&$select=id,name,file',
  );
  if (!result.ok) return result;
  const names = ((result.value as { value?: GraphChild[] }).value ?? [])
    .filter((child) => Boolean(child.file) && typeof child.name === 'string')
    .map((child) => child.name as string);
  return { ok: true, value: names };
}

/**
 * Writes a small text file into a folder, replacing whatever was there.
 *
 * Replace rather than rename, and that is deliberate: a mailbox file is the
 * latest thing one person sent the other, not a history. Renaming on conflict
 * would leave the receiver reading a stale copy while a newer one sat beside it
 * under a different name.
 */
export async function uploadText(
  folder: DriveItemRef,
  fileName: string,
  text: string,
): Promise<GraphResult<null>> {
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' +
      encodeURIComponent(fileName) + ':/content?@microsoft.graph.conflictBehavior=replace',
    { method: 'PUT', contentType: 'application/json', body: text },
  );
  if (!result.ok) return result;
  return { ok: true, value: null };
}

/** Reads one file out of a folder by name. */
export async function downloadText(
  folder: DriveItemRef,
  fileName: string,
): Promise<GraphResult<string>> {
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' +
      encodeURIComponent(fileName) + ':/content',
    { raw: true },
  );
  if (!result.ok) return result;
  return { ok: true, value: String(result.value ?? '') };
}

/** Removes a file, used to clear an inbox entry once it has been applied. */
export async function deleteFile(
  folder: DriveItemRef,
  fileName: string,
): Promise<GraphResult<null>> {
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' + encodeURIComponent(fileName),
    { method: 'DELETE' },
  );
  if (!result.ok) return result;
  return { ok: true, value: null };
}

/**
 * Confirms a saved folder is still reachable.
 *
 * Worth its own call because a folder can be renamed, moved, or unshared long
 * after it was picked, and finding that out when somebody taps Send is worse
 * than finding it out on the screen that shows the mailbox.
 */
export async function checkFolder(
  folder: DriveItemRef,
): Promise<GraphResult<{ name: string; path?: string }>> {
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + '?$select=id,name,folder,parentReference',
  );
  if (!result.ok) return result;
  const child = result.value as GraphChild;
  if (!child.folder) return { ok: false, reason: 'That is no longer a folder in OneDrive.' };
  const name = child.name ?? folder.name;
  return { ok: true, value: { name, path: describeItemPath(child.parentReference?.path, name) } };
}
