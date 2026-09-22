// What automatic sync brought in and what it sent out, kept so the person
// can look.
//
// Direct instruction, 2026-09-22: "The user should be able to have the
// update on the screen that tells them about each change that was made by
// which device, or to not see them and assume that the system works each
// time, but there is a log for them to view." The on-screen notice is the
// first half (lib/snapshotSync.ts, mergedNotice) and has a switch of its
// own; this is the second, and it fills whether or not the notice shows.
//
// Grouped rather than a row per row: a shopping list with eleven items
// ticked off is one line saying so, not eleven. lib/snapshotMerge.ts
// hands over one entry per record it decided about, and the grouping
// happens here, through the same words lib/snapshotChanges.ts uses for
// the notices.
//
// The table is device local (DEVICE_LOCAL_TABLES in lib/snapshotSync.ts):
// it is this device's account of what it did, so publishing it would have
// the other device read its own doing back as something that arrived.
// Written with the write tracking suspended for the same reason it is
// kept local: writing the log is not a change to sync.

import { getDatabase } from './db';
import { withDatabaseWriteTrackingSuspended } from './databaseActivity';
import { wordsForTable } from './snapshotChanges';
import type { MergeEntry, MergeSide } from './snapshotMerge';
import type { SyncDeviceKind } from './snapshotSync';

/** How many merges the log keeps before the oldest fall off. */
export const SYNC_LOG_KEPT = 200;

export type SyncLogRow = {
  id: string;
  mergedAt: string;
  /** The device the change was made on. */
  deviceKind: SyncDeviceKind;
  /** The words a person reads for it, and the word for one of them. */
  area: string;
  areaOne: string;
  kind: 'added' | 'changed' | 'removed';
  count: number;
  /** True when both devices had moved the same record and this side won. */
  conflict: boolean;
};

/** One merge, as the viewer shows it. */
export type SyncLogMerge = {
  mergedAt: string;
  rows: SyncLogRow[];
};

type DbRow = {
  id: string;
  merged_at: string;
  device_kind: string;
  area: string;
  area_one: string;
  kind: string;
  count: number;
  conflict: number;
};

function asDeviceKind(value: string): SyncDeviceKind {
  return value === 'computer' ? 'computer' : 'phone';
}

function asKind(value: string): SyncLogRow['kind'] {
  if (value === 'added' || value === 'removed') return value;
  return 'changed';
}

/**
 * The lines one merge is written down as. Pure, so
 * scripts/test_sync_log.js can check the grouping without a database.
 *
 * A table whose rows only mark their area as touched (the six ingredient
 * rows under one salad) reads as an edit to that area however it arrived,
 * which is the same rule the notices follow.
 */
export function linesForMerge(
  entries: readonly MergeEntry[],
  devices: Record<MergeSide, SyncDeviceKind>,
  words: (table: string) => { one: string; many: string; counts: boolean } | null = wordsForTable,
): SyncLogLine[] {
  const buckets = new Map<string, SyncLogLine>();
  for (const entry of entries) {
    const found = words(entry.table);
    if (!found) continue;
    const deviceKind = devices[entry.side];
    const kind = found.counts ? entry.kind : 'changed';
    const conflict = entry.conflict !== undefined;
    const at = deviceKind + '\u0001' + found.many + '\u0001' + kind + '\u0001' + (conflict ? '1' : '0');
    const bucket = buckets.get(at);
    if (bucket) bucket.count += 1;
    else buckets.set(at, { deviceKind, area: found.many, areaOne: found.one, kind, count: 1, conflict });
  }
  return [...buckets.values()].sort((a, b) =>
    b.count !== a.count ? b.count - a.count : a.area.localeCompare(b.area),
  );
}

/** One grouped line of a merge, before it is written down. */
export type SyncLogLine = {
  deviceKind: SyncDeviceKind;
  area: string;
  areaOne: string;
  kind: SyncLogRow['kind'];
  count: number;
  conflict: boolean;
};

/** Writes down what one merge did. Never throws: a log that fails is not a reason to lose a merge. */
export async function recordMerge(
  entries: readonly MergeEntry[],
  devices: Record<MergeSide, SyncDeviceKind>,
  mergedAt: string = new Date().toISOString(),
): Promise<void> {
  const lines = linesForMerge(entries, devices);
  if (lines.length === 0) return;
  try {
    await withDatabaseWriteTrackingSuspended(async () => {
      const db = await getDatabase();
      let index = 0;
      for (const line of lines) {
        index += 1;
        await db.runAsync(
          `
            INSERT INTO sync_change_log (id, merged_at, device_kind, area, area_one, kind, count, conflict)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          'sync_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 6),
          mergedAt,
          line.deviceKind,
          line.area,
          line.areaOne,
          line.kind,
          line.count,
          line.conflict ? 1 : 0,
        );
      }
      // Oldest merges fall off once there are more than SYNC_LOG_KEPT of
      // them, counted by merge rather than by line so a busy one cannot
      // push out everything before it.
      await db.runAsync(
        `
          DELETE FROM sync_change_log
          WHERE merged_at NOT IN (
            SELECT merged_at FROM sync_change_log
            GROUP BY merged_at ORDER BY merged_at DESC LIMIT ?
          )
        `,
        SYNC_LOG_KEPT,
      );
    });
  } catch (error) {
    console.error('[syncLog] could not write the sync log', error);
  }
}

/** Every merge written down, newest first. */
export async function readSyncLog(limit = SYNC_LOG_KEPT): Promise<SyncLogMerge[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      `
        SELECT * FROM sync_change_log
        WHERE merged_at IN (
          SELECT merged_at FROM sync_change_log
          GROUP BY merged_at ORDER BY merged_at DESC LIMIT ?
        )
        ORDER BY merged_at DESC, count DESC, area ASC
      `,
      limit,
    );
    const merges: SyncLogMerge[] = [];
    for (const row of rows) {
      const line: SyncLogRow = {
        id: row.id,
        mergedAt: row.merged_at,
        deviceKind: asDeviceKind(row.device_kind),
        area: row.area,
        areaOne: row.area_one,
        kind: asKind(row.kind),
        count: row.count,
        conflict: row.conflict === 1,
      };
      const last = merges[merges.length - 1];
      if (last && last.mergedAt === line.mergedAt) last.rows.push(line);
      else merges.push({ mergedAt: line.mergedAt, rows: [line] });
    }
    return merges;
  } catch (error) {
    console.error('[syncLog] could not read the sync log', error);
    return [];
  }
}

/** The one line a log row reads as. */
export function describeLogRow(row: SyncLogRow): string {
  const noun = row.count === 1 ? row.areaOne : row.area;
  if (row.kind === 'added') return row.count + ' more ' + noun;
  if (row.kind === 'removed') return row.count + ' fewer ' + noun;
  return 'edits to ' + row.area;
}

export async function clearSyncLog(): Promise<void> {
  try {
    await withDatabaseWriteTrackingSuspended(async () => {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM sync_change_log');
    });
  } catch (error) {
    console.error('[syncLog] could not clear the sync log', error);
  }
}
