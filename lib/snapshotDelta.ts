// The changes file: what one device changed since the last whole copy it
// put in the shared folder, so a save carries a few rows rather than the
// whole database.
//
// Asked for on 2026-09-30, after 1.0.57.11 cut how often a device saves
// but still sent the whole encrypted copy, about 2 MB, each time: "I
// thought you said it would be a changes file only." This is only between
// one person's own devices (lib/snapshotSync.ts). What travels between
// two people (lib/peerSyncDevice.ts) is untouched.
//
// HOW IT FITS TOGETHER
//
//   - A device still puts a whole copy in the folder the first time, and
//     keeps that same copy on itself (lib/snapshotSyncDevice.ts).
//   - Each save after that writes one changes file: every row added,
//     changed or removed since that whole copy. It grows from save to save
//     rather than chaining, so the other device only ever reads one, and
//     it does not matter how many saves it missed.
//   - When the changes file would be more than DELTA_WHOLE_SHARE of a
//     whole copy, the device sends a whole copy again and starts over.
//   - The device reading it keeps the whole copy it last downloaded, adds
//     the changes to it, and checks the result against the fingerprint the
//     sender wrote (tablesDigest). What it hands to the merge is then the
//     same full picture it always had, so lib/snapshotMerge.ts and every
//     decision about who wins a row is unchanged.
//   - Anything that does not line up (the wrong whole copy, a row whose
//     key cannot be read, a fingerprint that differs) answers null, and
//     the caller downloads the whole copy again rather than guess.
//
// The file deliberately has no `exportedAt` and no `tables`, so a build
// from before this change that finds it reads it as a copy it cannot
// open and says so, rather than loading something partial.
//
// No I/O here. scripts/test_snapshot_delta.js checks that adding the
// changes to the whole copy gives back exactly what the sender held.

import { keyOf, rowText, sameRows, type Row, type Shapes, type Tables } from './snapshotMerge';
import { fingerprintText, type SyncDevice } from './snapshotSync';

export const DELTA_KIND = 'inside-story-changes';

/** Past this share of a whole copy, a whole copy is sent instead. */
export const DELTA_WHOLE_SHARE = 0.5;

export function changesFileName(device: SyncDevice): string {
  return 'inside-story-changes-' + device.kind + '-' + device.fingerprint + '.json';
}

/** One table's changes: every row, or the rows that moved by key. */
export type TableDelta =
  | { rows: Row[] }
  | { key: string[]; upsert: Row[]; remove: string[] };

export type SnapshotDelta = {
  kind: typeof DELTA_KIND;
  version: 1;
  /** When the whole copy these changes are added to was saved. */
  baseSavedAt: string;
  /** When these changes were saved, the same moment the record names. */
  savedAt: string;
  schemaVersion: number;
  tableNames: string[];
  /** tablesDigest of every table as the sender held it. */
  digest: string;
  changedTables: Record<string, TableDelta>;
  droppedTables: string[];
  /** The words for what changed, as the whole copy carries them. */
  syncChanges?: string[];
};

/**
 * A fingerprint of every table that does not depend on the order rows
 * came back in, since the rebuilt copy puts new rows at the end and the
 * sender's database may not.
 */
export function tablesDigest(tables: Tables): string {
  const names = Object.keys(tables).sort();
  const parts: string[] = [];
  for (const name of names) {
    const rows = Array.isArray(tables[name]) ? tables[name] : [];
    parts.push(name + '\u0002' + rows.map(rowText).sort().join('\u0003'));
  }
  return fingerprintText(parts.join('\u0004'));
}

// Rows by key, or null when two rows share a key or one has none, since
// changes by key could not be followed for that table.
function indexByKey(rows: readonly Row[], key: string[]): Map<string, Row> | null {
  const index = new Map<string, Row>();
  const shape = { key };
  for (const row of rows) {
    const id = keyOf(row, shape);
    if (id === null || index.has(id)) return null;
    index.set(id, row);
  }
  return index;
}

/** The changes from `base` (the whole copy last sent) to `current`. */
export function buildTableDeltas(
  base: Tables,
  current: Tables,
  shapes: Shapes,
): { changedTables: Record<string, TableDelta>; droppedTables: string[] } {
  const changedTables: Record<string, TableDelta> = {};
  for (const [name, rows] of Object.entries(current)) {
    const before = base[name];
    if (!Array.isArray(before)) {
      changedTables[name] = { rows };
      continue;
    }
    if (sameRows(before, rows)) continue;
    const key = shapes[name]?.key ?? [];
    const was = indexByKey(before, key);
    const now = indexByKey(rows, key);
    if (!was || !now) {
      changedTables[name] = { rows };
      continue;
    }
    const upsert: Row[] = [];
    for (const [id, row] of now) {
      const old = was.get(id);
      if (!old || rowText(old) !== rowText(row)) upsert.push(row);
    }
    const remove: string[] = [];
    for (const id of was.keys()) {
      if (!now.has(id)) remove.push(id);
    }
    changedTables[name] = { key, upsert, remove };
  }
  const droppedTables = Object.keys(base).filter((name) => !(name in current));
  return { changedTables, droppedTables };
}

export function buildDelta(input: {
  base: Tables;
  baseSavedAt: string;
  current: Tables;
  savedAt: string;
  schemaVersion: number;
  tableNames: string[];
  shapes: Shapes;
  syncChanges?: string[];
}): SnapshotDelta {
  const { changedTables, droppedTables } = buildTableDeltas(input.base, input.current, input.shapes);
  return {
    kind: DELTA_KIND,
    version: 1,
    baseSavedAt: input.baseSavedAt,
    savedAt: input.savedAt,
    schemaVersion: input.schemaVersion,
    tableNames: input.tableNames,
    digest: tablesDigest(input.current),
    changedTables,
    droppedTables,
    syncChanges: input.syncChanges,
  };
}

/**
 * The sender's tables, from the whole copy plus the changes. Null when the
 * result is not what the sender held, which the caller answers by fetching
 * the whole copy again.
 */
export function applyDelta(base: Tables, delta: SnapshotDelta): Tables | null {
  const out: Tables = {};
  for (const [name, rows] of Object.entries(base)) {
    if (!delta.droppedTables.includes(name)) out[name] = rows;
  }
  for (const [name, change] of Object.entries(delta.changedTables)) {
    if ('rows' in change) {
      out[name] = change.rows;
      continue;
    }
    const before = Array.isArray(out[name]) ? out[name] : [];
    const shape = { key: change.key };
    const removed = new Set(change.remove);
    const replacing = new Map<string, Row>();
    for (const row of change.upsert) {
      const id = keyOf(row, shape);
      if (id === null) return null;
      replacing.set(id, row);
    }
    const next: Row[] = [];
    for (const row of before) {
      const id = keyOf(row, shape);
      if (id === null) return null;
      if (removed.has(id)) continue;
      const replacement = replacing.get(id);
      if (replacement) {
        next.push(replacement);
        replacing.delete(id);
      } else {
        next.push(row);
      }
    }
    for (const row of replacing.values()) next.push(row);
    out[name] = next;
  }
  return tablesDigest(out) === delta.digest ? out : null;
}

/** Whether a changes file this size is worth sending instead of a whole copy. */
export function deltaWorthSending(deltaLength: number, wholeLength: number): boolean {
  return deltaLength <= wholeLength * DELTA_WHOLE_SHARE;
}

/** Reads a changes file back, answering null for anything that is not one. */
export function parseDelta(value: unknown): SnapshotDelta | null {
  if (!value || typeof value !== 'object') return null;
  const delta = value as Partial<SnapshotDelta>;
  if (delta.kind !== DELTA_KIND || delta.version !== 1) return null;
  if (typeof delta.baseSavedAt !== 'string' || typeof delta.savedAt !== 'string') return null;
  if (typeof delta.digest !== 'string' || typeof delta.schemaVersion !== 'number') return null;
  if (!Array.isArray(delta.tableNames) || !Array.isArray(delta.droppedTables)) return null;
  if (!delta.changedTables || typeof delta.changedTables !== 'object') return null;
  for (const change of Object.values(delta.changedTables)) {
    if (!change || typeof change !== 'object') return null;
    if ('rows' in change) {
      if (!Array.isArray(change.rows)) return null;
    } else if (!Array.isArray(change.key) || !Array.isArray(change.upsert) || !Array.isArray(change.remove)) {
      return null;
    }
  }
  return delta as SnapshotDelta;
}
