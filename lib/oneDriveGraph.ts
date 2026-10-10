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
//
// ON A COMPUTER NONE OF THIS RUNS. The OneDrive client there already keeps
// the folder on the disk, signed in by the person once for the whole
// machine, so every exported function below hands off to
// lib/desktop/cloudFolder.ts when isDesktopApp() says so, and the folder is
// read and written like any other folder. Same DriveItemRef shape, with
// driveId 'disk' and the absolute path as the itemId, so nothing above this
// module knows the difference. A runtime check rather than a metro swap,
// because what changes is where the folder is, not which package answers.

import { isDesktopApp } from './desktop/bridge';
import * as disk from './desktop/cloudFolder';
import { forgetAccessToken, getAccessToken } from './oneDriveAuth';
import { ONEDRIVE_BUSY_LEAD } from './passingTrouble';

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

/**
 * What to say about a refused Graph request. A message that is a sentence is
 * read out as it is; one that is only an exception's name ("AuthenticationException",
 * "generalException") says nothing to a person, so it goes in brackets after
 * a sentence that does.
 */
export function graphErrorSentence(status: number, message: string | null): string {
  const bare = !message || !/\s/.test(message.trim());
  if (status === 401) {
    return (
      'OneDrive did not accept this phone\u2019s sign-in' +
      (message ? ' (it answered ' + message.trim() + ')' : '') +
      '. This is sometimes on Microsoft\u2019s side and clears within a few minutes. If it keeps happening, sign in to OneDrive again on the Shared Folder screen.'
    );
  }
  // Microsoft's way of saying busy, try later (408, 429 and the 5xx
  // family). Its message adds nothing, and lib/passingTrouble.ts knows
  // this sentence, so background sync holds it back unless it lasts.
  if (status === 408 || status === 429 || status >= 500) {
    return ONEDRIVE_BUSY_LEAD + ' (' + status + '). Try again in a few minutes.';
  }
  if (!bare && message) return message;
  return 'OneDrive refused that (' + status + (message ? ', ' + message.trim() : '') + '). Try again in a few minutes.';
}

async function graphFetch(
  path: string,
  init?: { method?: string; body?: string; contentType?: string; raw?: boolean },
): Promise<GraphResult<unknown>> {
  const send = async (): Promise<Response | { ok: false; reason: string }> => {
    const token = await getAccessToken();
    if (!token.ok) return { ok: false, reason: token.reason };
    const headers: Record<string, string> = { Authorization: 'Bearer ' + token.token };
    if (init?.contentType) headers['Content-Type'] = init.contentType;
    try {
      return await fetch(GRAPH + path, {
        method: init?.method ?? 'GET',
        headers,
        body: init?.body,
      });
    } catch {
      return { ok: false, reason: 'OneDrive could not be reached. Check the connection and try again.' };
    }
  };

  let sent = await send();
  if (!(sent instanceof Response)) return sent;
  if (sent.status === 401) {
    // OneDrive can refuse a token before its time is up, and now and then
    // refuses a fresh one for a few minutes with a bare "AuthenticationException"
    // (2026-09-29, the first launch after an update). Ask Microsoft for a new
    // token once and try again before saying anything.
    forgetAccessToken();
    sent = await send();
    if (!(sent instanceof Response)) return sent;
  }
  const response = sent;

  if (response.status === 204) return { ok: true, value: null };

  if (!response.ok) {
    // Graph's own message names the actual problem: a folder that was moved, a
    // permission that was never granted, a name already in use. Reading it out
    // is more useful than a status number.
    let message: string | null = null;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // A body that is not JSON leaves the status-based sentence in place.
    }
    return { ok: false, reason: graphErrorSentence(response.status, message) };
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
  if (isDesktopApp()) return { ok: true, value: disk.DISK_DRIVE_ID };
  const result = await graphFetch('/me/drive?$select=id');
  if (!result.ok) return result;
  const id = (result.value as { id?: string }).id;
  if (!id) return { ok: false, reason: 'OneDrive did not say which drive belongs to this account.' };
  return { ok: true, value: id };
}

/** Folders at the top of the person's own OneDrive. */
export async function listMyRootFolders(): Promise<GraphResult<DriveItemRef[]>> {
  if (isDesktopApp()) return disk.listRoots();
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
  // A folder somebody shared appears inside the OneDrive folder on the disk
  // once the person adds it to their own files, so there is no second list.
  if (isDesktopApp()) return { ok: true, value: [] };
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
  if (isDesktopApp()) return disk.listChildFolders(parent);
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
  if (isDesktopApp()) return disk.createFolder(parent, name);
  const result = await graphFetch('/drives/' + parent.driveId + '/items/' + parent.itemId + '/children', {
    method: 'POST',
    contentType: 'application/json',
    body: JSON.stringify({
      name,
      folder: {},
      // Renames rather than failing or overwriting if the name is taken. A
      // second folder called "Lifestead 1" is recoverable; a silently
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
  if (isDesktopApp()) return disk.listFiles(folder);
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
  if (isDesktopApp()) return disk.moveFile(from, file, into);
  const result = await graphFetch('/drives/' + from.driveId + '/items/' + file.itemId, {
    method: 'PATCH',
    contentType: 'application/json',
    body: JSON.stringify({ parentReference: { driveId: into.driveId, id: into.itemId } }),
  });
  if (!result.ok) return result;
  return { ok: true, value: null };
}

export async function listFileNames(folder: DriveItemRef): Promise<GraphResult<string[]>> {
  if (isDesktopApp()) return disk.listFileNames(folder);
  // Every page, not the first 200: the photo folder (lib/mediaSyncDevice.ts)
  // can hold thousands, and a name missing from the list would be uploaded
  // again. Graph hands back the next page as a full address.
  const names: string[] = [];
  let path: string | null =
    '/drives/' + folder.driveId + '/items/' + folder.itemId + '/children?$top=200&$select=id,name,file';
  while (path) {
    const result = await graphFetch(path);
    if (!result.ok) return result;
    const page = result.value as { value?: GraphChild[]; '@odata.nextLink'?: string };
    for (const child of page.value ?? []) {
      if (child.file && typeof child.name === 'string') names.push(child.name);
    }
    const next = page['@odata.nextLink'];
    path = typeof next === 'string' && next.startsWith(GRAPH) ? next.slice(GRAPH.length) : null;
  }
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
  if (isDesktopApp()) return disk.uploadText(folder, fileName, text);
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
  if (isDesktopApp()) return disk.downloadText(folder, fileName);
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' +
      encodeURIComponent(fileName) + ':/content',
    { raw: true },
  );
  if (!result.ok) return result;
  return { ok: true, value: String(result.value ?? '') };
}

// Whole files: photos and recordings (2026-09-30, 1.0.57.23). A recording
// can be tens of MB, so nothing here holds a file as text, and anything
// past SIMPLE_UPLOAD_LIMIT goes up in pieces through an upload session,
// which is the only way Graph takes a file that size.

const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;
/** Graph asks for pieces in multiples of 320 KiB. 10 MiB is 32 of them. */
const UPLOAD_PIECE = 320 * 1024 * 32;

async function sendBytes(
  url: string,
  method: 'PUT' | 'POST',
  body: Uint8Array,
  headers: Record<string, string>,
): Promise<{ ok: true; status: number; json: unknown } | { ok: false; reason: string }> {
  try {
    // expo/fetch rather than the global fetch, since it sends bytes as they
    // are where the older one wants a string or a blob.
    const { fetch: expoFetch } = await import('expo/fetch');
    const response = await expoFetch(url, { method, headers, body: body as unknown as ArrayBuffer });
    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      // An empty body, as a piece in the middle of an upload has.
    }
    if (!response.ok) {
      const message = (json as { error?: { message?: string } } | null)?.error?.message ?? null;
      return { ok: false, reason: graphErrorSentence(response.status, message) };
    }
    return { ok: true, status: response.status, json };
  } catch {
    return { ok: false, reason: 'OneDrive could not be reached. Check the connection and try again.' };
  }
}

/**
 * Copies a file on this device into a folder, replacing one of the same
 * name. Small files go in one request; anything larger in pieces, read from
 * the file a piece at a time so a long recording is never held in memory.
 */
export async function uploadFile(
  folder: DriveItemRef,
  fileName: string,
  localUri: string,
  mimeType: string,
): Promise<GraphResult<null>> {
  if (isDesktopApp()) return disk.uploadFile(folder, fileName, localUri);
  const { File } = await import('expo-file-system');
  const file = new File(localUri);
  if (!file.exists) return { ok: false, reason: fileName + ' is not on this device.' };
  const size = file.size ?? 0;
  const address =
    GRAPH + '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' + encodeURIComponent(fileName) + ':';

  const token = await getAccessToken();
  if (!token.ok) return { ok: false, reason: token.reason };

  if (size <= SIMPLE_UPLOAD_LIMIT) {
    const bytes = await file.bytes();
    let sent = await sendBytes(address + '/content?@microsoft.graph.conflictBehavior=replace', 'PUT', bytes, {
      Authorization: 'Bearer ' + token.token,
      'Content-Type': mimeType,
    });
    if (!sent.ok && /sign-in/.test(sent.reason)) {
      forgetAccessToken();
      const again = await getAccessToken();
      if (!again.ok) return { ok: false, reason: again.reason };
      sent = await sendBytes(address + '/content?@microsoft.graph.conflictBehavior=replace', 'PUT', bytes, {
        Authorization: 'Bearer ' + again.token,
        'Content-Type': mimeType,
      });
    }
    return sent.ok ? { ok: true, value: null } : sent;
  }

  const session = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' + encodeURIComponent(fileName) + ':/createUploadSession',
    {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } }),
    },
  );
  if (!session.ok) return session;
  const uploadUrl = (session.value as { uploadUrl?: string }).uploadUrl;
  if (!uploadUrl) return { ok: false, reason: 'OneDrive did not say where to send ' + fileName + '.' };

  const handle = file.open();
  try {
    let start = 0;
    while (start < size) {
      const length = Math.min(UPLOAD_PIECE, size - start);
      handle.offset = start;
      const piece = handle.readBytes(length);
      // The upload address carries its own permission, so no sign-in goes
      // with the pieces.
      const sent = await sendBytes(uploadUrl, 'PUT', piece, {
        'Content-Length': String(piece.length),
        'Content-Range': 'bytes ' + start + '-' + (start + piece.length - 1) + '/' + size,
      });
      if (!sent.ok) return sent;
      start += piece.length;
    }
  } finally {
    handle.close();
  }
  return { ok: true, value: null };
}

/**
 * Fetches a file from a folder onto this device at destUri, replacing
 * anything there. Graph hands out a short-lived download address that
 * needs no sign-in, and the file goes straight to disk from it.
 */
export async function downloadToFile(
  folder: DriveItemRef,
  fileName: string,
  destUri: string,
): Promise<GraphResult<null>> {
  if (isDesktopApp()) return { ok: false, reason: 'A computer reads the folder on its disk directly.' };
  const meta = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + ':/' + encodeURIComponent(fileName) +
      '?$select=id,size,@microsoft.graph.downloadUrl',
  );
  if (!meta.ok) return meta;
  const url = (meta.value as { '@microsoft.graph.downloadUrl'?: string })['@microsoft.graph.downloadUrl'];
  if (!url) return { ok: false, reason: 'OneDrive did not offer ' + fileName + ' for download.' };
  try {
    const { File } = await import('expo-file-system');
    const dest = new File(destUri);
    if (dest.exists) dest.delete();
    await File.downloadFileAsync(url, dest, { idempotent: true });
    return { ok: true, value: null };
  } catch {
    return { ok: false, reason: fileName + ' could not be fetched from OneDrive.' };
  }
}

/** Removes a file, used to clear an inbox entry once it has been applied. */
export async function deleteFile(
  folder: DriveItemRef,
  fileName: string,
): Promise<GraphResult<null>> {
  if (isDesktopApp()) return disk.deleteFile(folder, fileName);
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
  if (isDesktopApp()) return disk.checkFolder(folder);
  const result = await graphFetch(
    '/drives/' + folder.driveId + '/items/' + folder.itemId + '?$select=id,name,folder,parentReference',
  );
  if (!result.ok) return result;
  const child = result.value as GraphChild;
  if (!child.folder) return { ok: false, reason: 'That is no longer a folder in OneDrive.' };
  const name = child.name ?? folder.name;
  return { ok: true, value: { name, path: describeItemPath(child.parentReference?.path, name) } };
}

/**
 * A folder chosen on a computer, found again in this OneDrive.
 *
 * The mirror of folderFromPhonePath in lib/desktop/cloudFolder.ts, and the
 * repair for what that one never had: a phone that loaded a snapshot saved
 * on a computer came away holding a Windows path as its shared folder, so
 * it asked the person to set up a folder they had already set up and could
 * save nothing in the meantime (1.0.42.30). The sentence the computer
 * stored, "OneDrive / Documents / Lifestead", names the same folder
 * here, so it is looked up by that path.
 *
 * Only a sentence beginning with the plain word OneDrive, which is the
 * personal drive this account signs in to. A work root reads as
 * "OneDrive - Contoso" on a computer and is a different drive entirely, so
 * that case answers null and the caller says plainly where the folder was
 * chosen rather than opening the wrong one.
 */
export async function folderFromComputerPath(described: string | undefined): Promise<DriveItemRef | null> {
  if (isDesktopApp() || !described) return null;
  const parts = described.split(' / ').map((part) => part.trim()).filter((part) => part.length > 0);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'onedrive') return null;
  const drive = await getMyDriveId();
  if (!drive.ok) return null;
  const route = parts.slice(1).map((part) => encodeURIComponent(part)).join('/');
  const result = await graphFetch('/me/drive/root:/' + route + '?$select=id,name,folder,parentReference');
  if (!result.ok) return null;
  const child = result.value as GraphChild;
  if (!child.folder) return null;
  return toRef(child, drive.value);
}
