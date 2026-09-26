// Trackers the person names (D2): reading and writing custom_trackers and
// custom_tracker_entries (lib/db.ts). Signals > My Trackers writes here and
// Trends > My Trackers reads it. Every rule about what a value means, how a
// day is worked out and whether removing deletes or retires is in
// lib/customTrackers.ts.
import { getDatabase } from './db';
import { cleanTrackerName, planTrackerRemoval, type CustomTracker, type TrackerEntry, type TrackerKind } from './customTrackers';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Every tracker, retired ones included, each with how many entries it has. */
export async function listCustomTrackers(): Promise<CustomTracker[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomTracker>(
    `SELECT t.id, t.name, t.kind, t.unit, t.retired_at AS retiredAt,
            (SELECT COUNT(*) FROM custom_tracker_entries e WHERE e.tracker_id = t.id) AS entryCount
       FROM custom_trackers t
      ORDER BY LOWER(t.name)`,
  );
}

export async function createCustomTracker(input: { name: string; kind: TrackerKind; unit: string | null }): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = newId('tracker');
  const unit = input.unit && input.unit.trim() ? input.unit.trim() : null;
  await db.runAsync(
    'INSERT INTO custom_trackers (id, name, kind, unit, retired_at, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)',
    id,
    cleanTrackerName(input.name),
    input.kind,
    input.kind === 'count' || input.kind === 'measurement' ? unit : null,
    now,
    now,
  );
  return id;
}

/** A new name, and a new unit only while nothing has been logged, since a
 *  changed unit would misread every entry already in the old one. */
export async function updateCustomTracker(id: string, input: { name: string; unit?: string | null }): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE custom_trackers SET name = ?, updated_at = ? WHERE id = ?', cleanTrackerName(input.name), now, id);
  if (input.unit === undefined) return;
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM custom_tracker_entries WHERE tracker_id = ?', id);
  if ((count?.n ?? 0) > 0) return;
  const unit = input.unit && input.unit.trim() ? input.unit.trim() : null;
  await db.runAsync(
    "UPDATE custom_trackers SET unit = CASE WHEN kind IN ('count', 'measurement') THEN ? ELSE NULL END, updated_at = ? WHERE id = ?",
    unit,
    now,
    id,
  );
}

/** Retires a tracker with entries and deletes one without, decided against
 *  the count at the moment of removing rather than what the screen last
 *  read. Returns which happened. */
export async function removeCustomTracker(id: string): Promise<'retire' | 'delete'> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM custom_tracker_entries WHERE tracker_id = ?', id);
  const plan = planTrackerRemoval({ entryCount: count?.n ?? 0 });
  const now = new Date().toISOString();
  if (plan === 'delete') {
    await db.runAsync('DELETE FROM custom_trackers WHERE id = ?', id);
  } else {
    await db.runAsync('UPDATE custom_trackers SET retired_at = ?, updated_at = ? WHERE id = ?', now, now, id);
  }
  return plan;
}

export async function restoreCustomTracker(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE custom_trackers SET retired_at = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}

const ENTRY_COLUMNS = 'id, tracker_id AS trackerId, value, logged_at AS loggedAt, notes';

export async function addTrackerEntry(input: { trackerId: string; value: number; loggedAt: string; notes: string | null }): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
  await db.runAsync(
    `INSERT INTO custom_tracker_entries (id, tracker_id, value, logged_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId('trackerentry'),
    input.trackerId,
    input.value,
    input.loggedAt,
    notes,
    now,
    now,
  );
}

export async function listTrackerEntries(trackerId: string, limit = 30): Promise<TrackerEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<TrackerEntry>(
    `SELECT ${ENTRY_COLUMNS} FROM custom_tracker_entries WHERE tracker_id = ? ORDER BY logged_at DESC, created_at DESC LIMIT ?`,
    trackerId,
    limit,
  );
}

/** Every entry for every tracker from `rangeStart` (a local day) on. */
export async function listTrackerEntriesSince(rangeStart: string): Promise<TrackerEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<TrackerEntry>(
    `SELECT ${ENTRY_COLUMNS} FROM custom_tracker_entries WHERE logged_at >= ? ORDER BY logged_at ASC`,
    rangeStart,
  );
}

export async function deleteTrackerEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM custom_tracker_entries WHERE id = ?', id);
}
