// The shared folder on a computer, answering what lib/oneDriveGraph.ts
// asks of Microsoft Graph on a phone.
//
// WHY A DIFFERENT ROUTE ON A COMPUTER. On a phone the app signs in to
// Microsoft and reaches OneDrive through Graph, because Android's OneDrive
// provider will not let an app pick a folder (lib/oneDriveAuth.ts has the
// whole account). On a computer that sign-in is both unnecessary and
// impossible: unnecessary because the OneDrive client is already signed in
// and keeps its folder on the disk, and impossible because Microsoft's
// redirect goes to hashimotosapp://, which nothing on a PC is registered
// for, so the sign-in waited for a result that never came (2026-09-21:
// "it forces me to login but my computer is already logged in ... the
// OneDrive login wouldn't complete"). So here the shared folder is a
// folder on the disk, and the OneDrive client carries the bytes.
//
// THE SAME ADDRESS SHAPE, ONE DRIVE ID. Everything above this file keeps
// passing DriveItemRefs around. On a computer the driveId is DISK_DRIVE_ID
// and the itemId is the folder's absolute path, which is the one address
// a disk understands. The stored folder in app_meta takes the same shape,
// so nothing in lib/db.ts changes.
//
// THE PATH A PERSON READS IS THE SAME ON BOTH. A phone shows a folder as
// "OneDrive / Apps / Inside Story", built by describeItemPath from Graph's
// parent path. A computer builds the same sentence from the folder's place
// under the OneDrive root, and that is deliberate: a backup taken on the
// phone carries the phone's stored folder, and when it is restored on the
// computer, folderFromPhonePath reads that sentence back into a folder on
// this disk. The two never have to be set up twice.
//
// Every bridge call is wrapped so a thrown Error comes back as the same
// { ok: false, reason } every caller already handles.

import { getDesktopBridge } from './bridge';
import type { DriveFileRef, DriveItemRef, GraphResult } from '../oneDriveGraph';

/** The driveId of every folder addressed on this computer's disk. */
export const DISK_DRIVE_ID = 'disk';

export function isDiskFolder(folder: { driveId: string }): boolean {
  return folder.driveId === DISK_DRIVE_ID;
}

function bridge() {
  return getDesktopBridge().cloudFolder;
}

function reasonFrom(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  // Electron prefixes an error from the main process with the handler's
  // name; the sentence after it is the one worth showing.
  const cleaned = message.replace(/^Error invoking remote method '[^']*':\s*(Error:\s*)?/, '').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

async function attempt<T>(work: () => Promise<T>, fallback: string): Promise<GraphResult<T>> {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    return { ok: false, reason: reasonFrom(error, fallback) };
  }
}

function lastSegment(folderPath: string): string {
  const parts = folderPath.split(/[\\/]/).filter((part) => part.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : folderPath;
}

function samePath(a: string, b: string): boolean {
  return a.replace(/[\\/]+$/, '').toLowerCase() === b.replace(/[\\/]+$/, '').toLowerCase();
}

function isUnder(folderPath: string, rootPath: string): boolean {
  const root = rootPath.replace(/[\\/]+$/, '');
  const folder = folderPath.replace(/[\\/]+$/, '');
  if (samePath(folder, root)) return true;
  const lowerFolder = folder.toLowerCase();
  const lowerRoot = root.toLowerCase();
  return lowerFolder.startsWith(lowerRoot + '\\') || lowerFolder.startsWith(lowerRoot + '/');
}

/**
 * The sentence a person reads for a folder on this disk.
 *
 * Under a OneDrive root it reads as the phone would show the same folder,
 * "OneDrive / Apps / Inside Story", so the two agree. Anywhere else the
 * absolute path is the honest description.
 */
export async function describeDiskPath(folderPath: string): Promise<string> {
  let roots: { name: string; path: string }[] = [];
  try {
    roots = await bridge().roots();
  } catch {
    roots = [];
  }
  for (const root of roots) {
    if (!isUnder(folderPath, root.path)) continue;
    const inside = folderPath.slice(root.path.length).split(/[\\/]/).filter((part) => part.length > 0);
    return [root.name, ...inside].join(' / ');
  }
  return folderPath;
}

async function refFor(folderPath: string, name?: string): Promise<DriveItemRef> {
  return {
    driveId: DISK_DRIVE_ID,
    itemId: folderPath,
    name: name ?? lastSegment(folderPath),
    path: await describeDiskPath(folderPath),
  };
}

/**
 * A folder chosen on a phone, found on this disk.
 *
 * The phone stores the folder's Graph address plus the sentence it showed,
 * "OneDrive / Apps / Inside Story". The address means nothing here, but
 * the sentence does: its first part names a OneDrive root on this computer
 * and the rest is the folder's place under it. Null when no root by that
 * name is here or the folder is not under it, which the caller says
 * plainly rather than guessing.
 */
export async function folderFromPhonePath(described: string | undefined): Promise<DriveItemRef | null> {
  if (!described) return null;
  const parts = described.split(' / ').map((part) => part.trim()).filter((part) => part.length > 0);
  if (parts.length < 2) return null;
  let roots: { name: string; path: string }[] = [];
  try {
    roots = await bridge().roots();
  } catch {
    return null;
  }
  const rootName = parts[0].toLowerCase();
  for (const root of roots) {
    if (root.name.toLowerCase() !== rootName) continue;
    const separator = root.path.includes('\\') ? '\\' : '/';
    const folderPath = root.path.replace(/[\\/]+$/, '') + separator + parts.slice(1).join(separator);
    try {
      const info = await bridge().stat(folderPath);
      if (info.exists && info.isDirectory) return refFor(info.path, info.name);
    } catch {
      // A root that cannot be read is not the one.
    }
  }
  return null;
}

/**
 * The OneDrive folders on this computer, as the top of the picker.
 *
 * Usually one, called OneDrive. A work account adds "OneDrive - Contoso"
 * beside it. Empty when OneDrive is not installed or not signed in, which
 * the picker says in so many words.
 */
export async function listRoots(): Promise<GraphResult<DriveItemRef[]>> {
  return attempt(async () => {
    const roots = await bridge().roots();
    return roots.map((root) => ({ driveId: DISK_DRIVE_ID, itemId: root.path, name: root.name, path: root.name }));
  }, 'The OneDrive folder on this computer could not be found.');
}

/** The operating system's own folder dialog; null when closed without a choice. */
export async function pickFolder(): Promise<GraphResult<DriveItemRef | null>> {
  return attempt(async () => {
    const roots = await bridge().roots();
    const picked = await bridge().pickFolder(roots.length > 0 ? roots[0].path : null);
    if (!picked) return null;
    return refFor(picked);
  }, 'The folder dialog could not be opened.');
}

export async function listChildFolders(parent: DriveItemRef): Promise<GraphResult<DriveItemRef[]>> {
  return attempt(async () => {
    const folders = await bridge().listFolders(parent.itemId);
    const refs: DriveItemRef[] = [];
    for (const folder of folders) {
      refs.push(await refFor(folder.path, folder.name));
    }
    return refs;
  }, parent.name + ' could not be read on this computer.');
}

export async function createFolder(parent: DriveItemRef, name: string): Promise<GraphResult<DriveItemRef>> {
  return attempt(async () => {
    const made = await bridge().makeFolder(parent.itemId, name);
    return refFor(made.path, made.name);
  }, 'The folder could not be made.');
}

export async function listFiles(folder: DriveItemRef): Promise<GraphResult<DriveFileRef[]>> {
  return attempt(async () => {
    const names = await bridge().listFiles(folder.itemId);
    // A file on a disk is addressed by its name; the itemId a move needs is
    // that same name.
    return names.map((name) => ({ itemId: name, name }));
  }, folder.name + ' could not be read on this computer.');
}

export async function listFileNames(folder: DriveItemRef): Promise<GraphResult<string[]>> {
  return attempt(() => bridge().listFiles(folder.itemId), folder.name + ' could not be read on this computer.');
}

export async function moveFile(from: DriveItemRef, file: DriveFileRef, into: DriveItemRef): Promise<GraphResult<null>> {
  return attempt(async () => {
    await bridge().moveFile(from.itemId, file.name, into.itemId);
    return null;
  }, file.name + ' could not be moved.');
}

export async function uploadText(folder: DriveItemRef, fileName: string, text: string): Promise<GraphResult<null>> {
  return attempt(async () => {
    await bridge().writeText(folder.itemId, fileName, text);
    return null;
  }, fileName + ' could not be written into ' + folder.name + '.');
}

export async function downloadText(folder: DriveItemRef, fileName: string): Promise<GraphResult<string>> {
  return attempt(() => bridge().readText(folder.itemId, fileName), fileName + ' could not be read.');
}

export async function deleteFile(folder: DriveItemRef, fileName: string): Promise<GraphResult<null>> {
  return attempt(async () => {
    await bridge().deleteFile(folder.itemId, fileName);
    return null;
  }, fileName + ' could not be removed.');
}

export async function checkFolder(folder: DriveItemRef): Promise<GraphResult<{ name: string; path?: string }>> {
  if (!isDiskFolder(folder)) {
    return {
      ok: false,
      reason:
        'That folder was chosen on a phone' +
        (folder.path ? ' (' + folder.path + ')' : '') +
        ', and no folder at that place was found in OneDrive on this computer.',
    };
  }
  return attempt(async () => {
    const info = await bridge().stat(folder.itemId);
    if (!info.exists) throw new Error('There is no folder at ' + folder.itemId + ' any more.');
    if (!info.isDirectory) throw new Error(folder.itemId + ' is a file now, not a folder.');
    return { name: info.name, path: await describeDiskPath(info.path) };
  }, folder.name + ' could not be checked on this computer.');
}
