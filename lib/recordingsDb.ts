// Recordings (1.0.57.23): reading and writing the recordings table, the
// cache under Paths.document/recordings, and the Recordings folder under
// the shared folder. Every rule and sentence is lib/recordings.ts.
//
// expo-file-system is reached through a dynamic import inside each
// function, as everywhere else in the app.

import { isDesktopApp } from './desktop/bridge';
import { readFileBytes } from './desktop/cloudFolder';
import { getDatabase } from './db';
import { forgetCacheUse, touchCacheUse } from './mediaCacheDb';
import { shareFileIfAvailable } from './nativeSharing';
import { deleteFile, downloadToFile, listFileNames, uploadFile } from './oneDriveGraph';
import { getRecordingsFolder } from './oneDriveFolders';
import {
  extensionForMime,
  extensionOf,
  isRecordingExtension,
  nameFromPicked,
  newRecordingId,
  orphanedRecordingFiles,
  pickedFileProblem,
  planRecordingSync,
  recordingFileName,
  recordingMimeType,
  RECORDING_NOT_REACHABLE,
  RECORDING_ON_THE_WAY,
  sortRecordings,
  unusedRecordingName,
  type Recording,
  type RecordingPlace,
} from './recordings';

const RECORDINGS_CACHE = 'recordings';

const COLUMNS = 'id, name, file_name AS fileName, mime_type AS mimeType, size_bytes AS sizeBytes, created_at AS createdAt';

export async function listRecordings(): Promise<Recording[]> {
  const db = await getDatabase();
  return sortRecordings(await db.getAllAsync<Recording>(`SELECT ${COLUMNS} FROM recordings`));
}

export async function recordingsDirectory() {
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, RECORDINGS_CACHE);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export async function recordingFile(fileName: string) {
  const { File } = await import('expo-file-system');
  return new File(await recordingsDirectory(), fileName);
}

export async function listLocalRecordingFileNames(): Promise<string[]> {
  const dir = await recordingsDirectory();
  const { File } = await import('expo-file-system');
  return dir
    .list()
    .filter((entry) => entry instanceof File)
    .map((entry) => entry.name);
}

export type AddRecordingResult =
  | { status: 'added'; item: Recording }
  | { status: 'canceled' }
  | { status: 'problem'; message: string };

/**
 * Brings in one audio file chosen in the system's file picker. On the
 * computer it is copied straight into the Recordings folder; on the phone
 * it is copied here first, so it plays at once, and sent to the folder in
 * the background.
 */
export async function addRecordingFromPicker(): Promise<AddRecordingResult> {
  try {
    const { File } = await import('expo-file-system');
    let picked;
    try {
      const chosen = await File.pickFileAsync(undefined, 'audio/*');
      picked = Array.isArray(chosen) ? chosen[0] : chosen;
    } catch {
      return { status: 'canceled' };
    }
    if (!picked) return { status: 'canceled' };

    const pickedName = (picked as { name?: string }).name || '';
    const ext = isRecordingExtension(extensionOf(pickedName)) ? extensionOf(pickedName) : extensionForMime(picked.type);
    const size = typeof picked.size === 'number' ? picked.size : null;
    const problem = pickedFileProblem(ext ? `x.${ext}` : pickedName, size);
    if (problem || !ext) return { status: 'problem', message: problem ?? 'That file is not a kind of audio this app plays.' };

    const id = newRecordingId(Date.now(), Math.random().toString(36).slice(2));
    const fileName = recordingFileName(id, ext);
    const mimeType = recordingMimeType(ext);

    let placedInFolder = false;
    if (isDesktopApp()) {
      const folder = await getRecordingsFolder();
      if (folder.ok) {
        const sent = await uploadFile(folder.value, fileName, picked.uri, mimeType);
        placedInFolder = sent.ok;
      }
    }
    if (!placedInFolder) {
      const destination = await recordingFile(fileName);
      if (destination.exists) destination.delete();
      try {
        picked.copy(destination);
      } catch {
        // A file handed over by another app may refuse a copy; reading it
        // whole works for anything of an ordinary size.
        destination.write(await picked.bytes());
      }
      await touchCacheUse(fileName, 'recordings');
    }

    const others = (await listRecordings()).map((item) => item.name);
    const name = unusedRecordingName(nameFromPicked(pickedName || 'Recording'), others);
    const now = new Date().toISOString();
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO recordings (id, name, file_name, mime_type, size_bytes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      fileName,
      mimeType,
      size ?? 0,
      now,
      now,
    );
    if (!placedInFolder) void syncRecordings({ afterSave: false });
    return { status: 'added', item: { id, name, fileName, mimeType, sizeBytes: size ?? 0, createdAt: now } };
  } catch (error) {
    return { status: 'problem', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function renameRecording(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE recordings SET name = ?, updated_at = ? WHERE id = ?', name.trim(), new Date().toISOString(), id);
}

/**
 * Removes a recording: the row, the copy here and the copy in the folder.
 * Nothing else refers to a recording, so nothing is left pointing at it.
 * A folder copy that could not be removed now is cleared by a later pass.
 */
export async function removeRecording(item: Pick<Recording, 'id' | 'fileName'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recordings WHERE id = ?', item.id);
  try {
    const file = await recordingFile(item.fileName);
    if (file.exists) file.delete();
  } catch {
    // Cleared by the next pass, which removes files no row names.
  }
  await forgetCacheUse([item.fileName]);
  try {
    const folder = await getRecordingsFolder();
    if (folder.ok) await deleteFile(folder.value, item.fileName);
  } catch {
    // See above.
  }
}

/** Where each recording is right now, for the caption under it. */
export async function recordingPlaces(items: readonly Recording[]): Promise<Map<string, RecordingPlace>> {
  const here = new Set(await listLocalRecordingFileNames().catch(() => [] as string[]));
  let there = new Set<string>();
  const folder = await getRecordingsFolder().catch(() => null);
  if (folder?.ok) {
    const names = await listFileNames(folder.value);
    if (names.ok) there = new Set(names.value);
  }
  const places = new Map<string, RecordingPlace>();
  for (const item of items) {
    const a = here.has(item.fileName);
    const b = there.has(item.fileName);
    places.set(item.id, a && b ? 'both' : a ? 'here' : b ? 'folder' : 'nowhere');
  }
  return places;
}

export type PlayableResult = { ok: true; url: string; release: () => void } | { ok: false; reason: string };

/**
 * The computer's way to play: the recording's bytes as an address an Audio
 * element can play, read from the folder on the disk or from the copy
 * here. `release` frees it once playing ends.
 */
export async function recordingPlayUrl(item: Recording): Promise<PlayableResult> {
  let bytes: Uint8Array | null = null;
  try {
    const local = await recordingFile(item.fileName);
    if (local.exists) {
      bytes = await local.bytes();
      await touchCacheUse(item.fileName, 'recordings');
    }
  } catch {
    bytes = null;
  }
  if (!bytes) {
    const folder = await getRecordingsFolder();
    if (!folder.ok) return { ok: false, reason: RECORDING_NOT_REACHABLE };
    const read = await readFileBytes(folder.value, item.fileName);
    if (!read.ok) return { ok: false, reason: RECORDING_ON_THE_WAY };
    bytes = read.value;
  }
  const blob = new Blob([bytes as BlobPart], { type: item.mimeType });
  const url = URL.createObjectURL(blob);
  return { ok: true, url, release: () => URL.revokeObjectURL(url) };
}

/**
 * The phone's way to play (R1): the recording as a file on this device,
 * fetched from the folder first if the cache cleared it.
 */
export async function recordingLocalUri(item: Recording): Promise<{ ok: true; uri: string } | { ok: false; reason: string }> {
  try {
    const file = await recordingFile(item.fileName);
    if (!file.exists) {
      const folder = await getRecordingsFolder();
      if (!folder.ok) return { ok: false, reason: RECORDING_NOT_REACHABLE };
      const fetched = await downloadToFile(folder.value, item.fileName, file.uri);
      if (!fetched.ok) return { ok: false, reason: RECORDING_ON_THE_WAY };
    }
    await touchCacheUse(item.fileName, 'recordings');
    return { ok: true, uri: file.uri };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Hands a recording to another app through the share sheet, fetching it
 * here first if the cache cleared it. Null when it opened, otherwise what
 * to say. The phone's only way to play before R1.
 */
export async function openRecordingElsewhere(item: Recording): Promise<string | null> {
  try {
    const file = await recordingFile(item.fileName);
    if (!file.exists) {
      const folder = await getRecordingsFolder();
      if (!folder.ok) return RECORDING_NOT_REACHABLE;
      const fetched = await downloadToFile(folder.value, item.fileName, file.uri);
      if (!fetched.ok) return RECORDING_ON_THE_WAY;
    }
    await touchCacheUse(item.fileName, 'recordings');
    const shared = await shareFileIfAvailable(file.uri, { mimeType: item.mimeType, dialogTitle: item.name });
    return shared ? null : 'No app on this phone offered to open it.';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

let running: Promise<void> | null = null;

/**
 * One pass: send recordings the folder lacks, clear folder copies nobody
 * refers to (only straight after this device saved last), remove local
 * files no row names, then bring the cache under its limit. Runs whenever
 * a shared folder is set up, whether or not automatic sync is on.
 */
export function syncRecordings(options: { afterSave: boolean }): Promise<void> {
  if (running) return running;
  running = runPass(options.afterSave)
    .catch(() => undefined)
    .finally(() => {
      running = null;
    });
  return running;
}

async function runPass(afterSave: boolean): Promise<void> {
  const rows = await listRecordings();
  const localNames = await listLocalRecordingFileNames();
  for (const name of orphanedRecordingFiles(rows.map((row) => row.fileName), localNames)) {
    try {
      (await recordingFile(name)).delete();
    } catch {
      // Tried again on the next pass.
    }
  }
  const folder = await getRecordingsFolder();
  if (!folder.ok) return;
  const names = await listFileNames(folder.value);
  if (!names.ok) return;
  let mayClearFolder = false;
  if (afterSave) {
    const { savedLastFromHere } = await import('./mediaSyncDevice');
    mayClearFolder = await savedLastFromHere();
  }
  const plan = planRecordingSync({ rows, localFileNames: localNames, folderNames: names.value, mayClearFolder });
  const inFolder = new Set(plan.inFolder);
  for (const id of plan.upload) {
    const row = rows.find((item) => item.id === id);
    if (!row) continue;
    const local = await recordingFile(row.fileName);
    const sent = await uploadFile(folder.value, row.fileName, local.uri, row.mimeType);
    if (sent.ok) inFolder.add(id);
  }
  for (const name of plan.clearFromFolder) await deleteFile(folder.value, name);
  const { keepCacheUnderLimit } = await import('./mediaCacheDevice');
  await keepCacheUnderLimit({
    recordingsInFolder: rows.filter((row) => inFolder.has(row.id)).map((row) => row.fileName),
  });
}
