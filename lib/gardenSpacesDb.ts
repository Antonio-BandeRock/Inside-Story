// Reading and writing the kinds of space the person has named for garden
// areas. The built-ins and the labels are in lib/gardenSpaces.ts with no
// database; this is the garden_spaces table.
//
// Added 2026-09-20 beside garden_cost_kinds, and shaped the same way: a
// space's id is stored in garden_plots.space_type next to the built-in
// codes, removing one clears the plots that used it rather than deleting
// them, and the same name typed twice makes one space.

import { getDatabase } from './db';
import type { CustomGardenSpace } from './gardenSpaces';

export async function listGardenSpaces(): Promise<CustomGardenSpace[]> {
  const db = await getDatabase();
  return db.getAllAsync<CustomGardenSpace>('SELECT id, name FROM garden_spaces ORDER BY created_at ASC, name ASC');
}

/** Adds a space, or returns the one already there under the same name (the
 *  case and spacing aside). Returns null for an empty name. */
export async function createGardenSpace(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM garden_spaces WHERE lower(name) = lower(?) LIMIT 1',
    trimmed,
  );
  if (existing) return existing.id;
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

/** Removes the space. An area recorded under it keeps its record and simply
 *  has no space said for it from then on; none is deleted. */
export async function deleteGardenSpace(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE garden_plots SET space_type = NULL WHERE space_type = ?', id);
  await db.runAsync('DELETE FROM garden_spaces WHERE id = ?', id);
}
