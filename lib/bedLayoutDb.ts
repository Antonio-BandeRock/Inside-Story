// Reading and writing where plantings sit on an area's plan (I8,
// 2026-10-02). The arithmetic is in lib/bedLayout.ts with no database; the
// table is garden_layout in lib/db.ts. A patch belongs to the planting, and
// is read through the planting's area, so a planting moved to another area
// takes its patch with it rather than leaving one behind on the old plan.

import type { LayoutPatch } from './bedLayout';
import { getDatabase } from './db';

/** Every patch for plantings in this area, past ones included. */
export async function listLayoutPatches(plotId: string): Promise<LayoutPatch[]> {
  const db = await getDatabase();
  return db.getAllAsync<LayoutPatch>(
    `SELECT l.planting_id AS plantingId, l.x, l.y, l.w, l.h
       FROM garden_layout l
       JOIN garden_plantings p ON p.id = l.planting_id
      WHERE p.plot_id = ?
      ORDER BY l.updated_at`,
    plotId,
  );
}

export async function saveLayoutPatch(plotId: string, patch: LayoutPatch): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO garden_layout (planting_id, plot_id, x, y, w, h, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(planting_id) DO UPDATE SET plot_id = excluded.plot_id, x = excluded.x, y = excluded.y,
       w = excluded.w, h = excluded.h, updated_at = excluded.updated_at`,
    patch.plantingId,
    plotId,
    patch.x,
    patch.y,
    patch.w,
    patch.h,
  );
}

/** Takes a planting off the plan. The planting itself is untouched. */
export async function removeLayoutPatch(plantingId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_layout WHERE planting_id = ?', plantingId);
}
