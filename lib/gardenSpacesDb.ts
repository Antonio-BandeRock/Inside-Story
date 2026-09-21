// Reading and writing the kinds of space the person has named for garden
// areas. The built-ins and the labels are in lib/gardenSpaces.ts with no
// database; this is the garden_spaces table.
//
// Added 2026-09-20 beside garden_cost_kinds, and shaped the same way: a
// space's id is stored in garden_plots.space_type next to the built-in
// codes, and the same name typed twice makes one space.
//
// Removing one, since 2026-09-21, never leaves an area with nothing said:
// current areas under it are moved to a space the person picked, past
// areas keep it as documentation (the row is retired, off the picker and
// still readable), and the row is deleted only when nothing reads it. The
// decision is planSpaceRemoval in lib/gardenSpaces.ts; this file carries
// it out.

import { getDatabase } from './db';
import { planSpaceRemoval, type CustomGardenSpace, type SpaceUseCounts } from './gardenSpaces';

/** The spaces the picker offers. With includeRetired, also the ones a
 *  past area still reads, for showing that area's space by name. */
export async function listGardenSpaces(includeRetired = false): Promise<CustomGardenSpace[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomGardenSpace>(
    `SELECT id, name FROM garden_spaces ${includeRetired ? '' : 'WHERE retired_at IS NULL'} ORDER BY created_at ASC, name ASC`,
  );
}

/** Adds a space, or returns the one already there under the same name (the
 *  case and spacing aside). A retired row under that name comes back onto
 *  the picker rather than being made twice. Returns null for an empty name. */
export async function createGardenSpace(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM garden_spaces WHERE lower(name) = lower(?) LIMIT 1',
    trimmed,
  );
  if (existing) {
    await db.runAsync('UPDATE garden_spaces SET retired_at = NULL WHERE id = ?', existing.id);
    return existing.id;
  }
  const id = `space_${Date.now()}`;
  await db.runAsync('INSERT INTO garden_spaces (id, name, created_at) VALUES (?, ?, ?)', id, trimmed, new Date().toISOString());
  return id;
}

export async function renameGardenSpace(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const db = await getDatabase();
  await db.runAsync('UPDATE garden_spaces SET name = ? WHERE id = ?', trimmed, id);
}

/** How many areas read a space, current and past. */
export async function countAreasUnderSpace(id: string): Promise<SpaceUseCounts> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ current: number; past: number }>(
    `
      SELECT SUM(CASE WHEN archived_at IS NULL THEN 1 ELSE 0 END) AS current,
             SUM(CASE WHEN archived_at IS NOT NULL THEN 1 ELSE 0 END) AS past
      FROM garden_plots WHERE space_type = ?
    `,
    id,
  );
  return { current: row?.current ?? 0, past: row?.past ?? 0 };
}

/** Removes the space. Current areas under it move to moveTo, which has to
 *  be given when there are any (returns false otherwise, and changes
 *  nothing). Past areas keep it and the row stays, retired; with none, the
 *  row goes. */
export async function removeGardenSpace(id: string, moveTo: string | null): Promise<boolean> {
  const counts = await countAreasUnderSpace(id);
  const plan = planSpaceRemoval(counts, moveTo);
  if (!plan.ok) return false;
  const db = await getDatabase();
  const now = new Date().toISOString();
  if (counts.current > 0) {
    await db.runAsync(
      'UPDATE garden_plots SET space_type = ?, updated_at = ? WHERE space_type = ? AND archived_at IS NULL',
      moveTo,
      now,
      id,
    );
  }
  if (plan.keepRow) await db.runAsync('UPDATE garden_spaces SET retired_at = ? WHERE id = ?', now, id);
  else await db.runAsync('DELETE FROM garden_spaces WHERE id = ?', id);
  return true;
}
