// Bringing the cache of photos and recordings under its limit (2026-09-30,
// 1.0.57.23). Which files go is planCacheClearing in lib/media.ts; this
// reads what is here, deletes what the plan names and says how much room
// it gave back.
//
// A photo's thumbnail is never cleared, so a row of photos always draws
// without the folder. A photo's full size can go only once its copy is
// confirmed in the Photos folder; a recording only once it is confirmed in
// the Recordings folder. Nothing else ever leaves the device.

import {
  cacheLimitBytes,
  idFromPhotoCopyName,
  isThumbFileName,
  planCacheClearing,
  thumbFileName,
  type CacheEntry,
  type CacheUse,
} from './media';
import { forgetCacheUse, getCacheLimitMb, readCacheUse } from './mediaCacheDb';
import { listAllMedia, listLocalMediaFileNames, mediaFile } from './mediaDb';
import { listFileNames } from './oneDriveGraph';
import { getPhotosFolder, getRecordingsFolder } from './oneDriveFolders';
import { listLocalRecordingFileNames, listRecordings, recordingFile } from './recordingsDb';
import { readSyncState } from './snapshotSyncDevice';

type Confirmed = {
  /** Photo file names whose copy is confirmed in the Photos folder. */
  photosInFolder?: readonly string[];
  /** Recording file names confirmed in the Recordings folder. */
  recordingsInFolder?: readonly string[];
};

function sizeOf(file: { exists: boolean; size?: number | null }): number {
  return file.exists && typeof file.size === 'number' ? file.size : 0;
}

async function gatherEntries(confirmed: Confirmed): Promise<CacheEntry[]> {
  const used = await readCacheUse();
  const photosOk = new Set(confirmed.photosInFolder ?? []);
  const recordingsOk = new Set(confirmed.recordingsInFolder ?? []);
  const entries: CacheEntry[] = [];

  const rows = await listAllMedia();
  const named = new Set(rows.map((row) => row.fileName));
  const localMedia = new Set(await listLocalMediaFileNames());
  for (const name of localMedia) {
    if (isThumbFileName(name) || !named.has(name)) continue;
    const file = await mediaFile(name);
    entries.push({
      fileName: name,
      group: 'photos',
      bytes: sizeOf(file),
      usedAt: used.get(name) ?? null,
      clearable: photosOk.has(name) && localMedia.has(thumbFileName(name)),
    });
  }

  const recordingNames = new Set((await listRecordings()).map((row) => row.fileName));
  for (const name of await listLocalRecordingFileNames()) {
    if (!recordingNames.has(name)) continue;
    const file = await recordingFile(name);
    entries.push({
      fileName: name,
      group: 'recordings',
      bytes: sizeOf(file),
      usedAt: used.get(name) ?? null,
      clearable: recordingsOk.has(name),
    });
  }
  return entries;
}

/**
 * Clears the least lately opened files until the cache fits its limit, or
 * every clearable file when `limitBytes` is 0. A pass of photo sync and a
 * pass of recording sync each say only what they confirmed, so a call
 * from one never clears the other kind. Never throws.
 */
export async function keepCacheUnderLimit(
  confirmed: Confirmed,
  limitBytes?: number,
): Promise<{ files: number; bytes: number }> {
  try {
    const entries = await gatherEntries(confirmed);
    const limit = limitBytes ?? cacheLimitBytes(await getCacheLimitMb());
    const clear = new Set(planCacheClearing(entries, limit));
    let files = 0;
    let bytes = 0;
    const gone: string[] = [];
    for (const entry of entries) {
      if (!clear.has(entry.fileName)) continue;
      try {
        const file = entry.group === 'photos' ? await mediaFile(entry.fileName) : await recordingFile(entry.fileName);
        if (file.exists) file.delete();
        files += 1;
        bytes += entry.bytes;
        gone.push(entry.fileName);
      } catch {
        // Left for the next pass.
      }
    }
    await forgetCacheUse(gone);
    return { files, bytes };
  } catch {
    return { files: 0, bytes: 0 };
  }
}

/**
 * Clear Now in Profile: asks each folder what it holds, so only files
 * confirmed there leave, then clears all of them. Photos are cleared only
 * while automatic sync is on, since without it the folder holds no copy
 * of them.
 */
export async function clearCacheNow(): Promise<{ files: number; bytes: number }> {
  const photosInFolder: string[] = [];
  const recordingsInFolder: string[] = [];
  try {
    const state = await readSyncState();
    if (state.enabled) {
      const folder = await getPhotosFolder();
      if (folder.ok) {
        const names = await listFileNames(folder.value);
        if (names.ok) {
          const ids = new Set(names.value.map(idFromPhotoCopyName).filter((id): id is string => id !== null));
          for (const row of await listAllMedia()) if (ids.has(row.id)) photosInFolder.push(row.fileName);
        }
      }
    }
  } catch {
    // Photos stay; recordings are still asked about below.
  }
  try {
    const folder = await getRecordingsFolder();
    if (folder.ok) {
      const names = await listFileNames(folder.value);
      if (names.ok) recordingsInFolder.push(...names.value);
    }
  } catch {
    // Recordings stay.
  }
  return keepCacheUnderLimit({ photosInFolder, recordingsInFolder }, 0);
}

/** The room photos and recordings take here, for the line in Profile. */
export async function getCacheUse(): Promise<CacheUse> {
  const use: CacheUse = {
    thumbs: { count: 0, bytes: 0 },
    photos: { count: 0, bytes: 0 },
    recordings: { count: 0, bytes: 0 },
    limitMb: await getCacheLimitMb(),
  };
  try {
    for (const name of await listLocalMediaFileNames()) {
      const bytes = sizeOf(await mediaFile(name));
      const slot = isThumbFileName(name) ? use.thumbs : use.photos;
      slot.count += 1;
      slot.bytes += bytes;
    }
  } catch {
    // Counted as none.
  }
  try {
    for (const name of await listLocalRecordingFileNames()) {
      use.recordings.count += 1;
      use.recordings.bytes += sizeOf(await recordingFile(name));
    }
  } catch {
    // Counted as none.
  }
  return use;
}
