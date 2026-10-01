// The cache of photos and recordings opened lately (2026-09-30, 1.0.57.23):
// when each file here was last opened, and how much room this device gives
// them. Both are device-local (media_cache_use in DEVICE_LOCAL_TABLES,
// media_cache_limit_mb in DEVICE_LOCAL_META_KEYS). The rules are
// planCacheClearing in lib/media.ts; the clearing itself is
// lib/mediaCacheDevice.ts.

import { getDatabase } from './db';
import { MEDIA_CACHE_LIMIT_META_KEY, parseCacheLimitMb, type MediaCacheGroup } from './media';

/** Marks a file as opened now. Never throws, since a missed mark only
 *  means the file may leave the cache a little early. */
export async function touchCacheUse(fileName: string, group: MediaCacheGroup): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO media_cache_use (file_name, grp, used_at) VALUES (?, ?, ?)
       ON CONFLICT(file_name) DO UPDATE SET used_at = excluded.used_at, grp = excluded.grp`,
      fileName,
      group,
      new Date().toISOString(),
    );
  } catch {
    // See above.
  }
}

export async function forgetCacheUse(fileNames: readonly string[]): Promise<void> {
  if (fileNames.length === 0) return;
  try {
    const db = await getDatabase();
    for (const name of fileNames) await db.runAsync('DELETE FROM media_cache_use WHERE file_name = ?', name);
  } catch {
    // A stale mark names a file that is not here, and is never read for one.
  }
}

/** When each file was last opened, by file name. */
export async function readCacheUse(): Promise<Map<string, string>> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ file_name: string; used_at: string }>('SELECT file_name, used_at FROM media_cache_use');
    return new Map(rows.map((row) => [row.file_name, row.used_at]));
  } catch {
    return new Map();
  }
}

export async function getCacheLimitMb(): Promise<number> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', MEDIA_CACHE_LIMIT_META_KEY);
    return parseCacheLimitMb(row?.value);
  } catch {
    return parseCacheLimitMb(null);
  }
}

export async function setCacheLimitMb(mb: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    MEDIA_CACHE_LIMIT_META_KEY,
    String(parseCacheLimitMb(String(mb))),
    new Date().toISOString(),
  );
}
