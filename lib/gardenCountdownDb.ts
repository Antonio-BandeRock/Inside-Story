// Reading and writing Days Until counters. The arithmetic and every
// sentence are in lib/gardenCountdown.ts with no database; this is the
// reading and writing. See garden_countdowns in lib/db.ts.
//
// Added 2026-09-21. A counter is the person's own note under an area, so
// removing one is a plain delete; marking one done keeps it as the record
// of how long the thing took. Home reads the running ones across every
// current area (listRunningGardenCountdowns), the area list reads its own,
// done ones included (listGardenCountdowns), and the Days Until lens on
// the Garden hub reads every counter across the current areas, done ones
// included (listCurrentGardenCountdowns).

import { getDatabase } from './db';
import type { GardenCountdown, GardenCountdownRow } from './gardenCountdown';

const COLUMNS = `
  c.id, c.plot_id AS plotId, c.planting_id AS plantingId, c.name, c.started_on AS startedOn,
  c.days, c.done_at AS doneAt, p.name AS plotName, g.food_name AS plantingName
`;

const FROM = `
  FROM garden_countdowns c
  JOIN garden_plots p ON p.id = c.plot_id
  LEFT JOIN garden_plantings g ON g.id = c.planting_id
`;

/** Every counter under an area, running ones first by how soon they land,
 *  done ones after. The order is settled in lib/gardenCountdown.ts
 *  (sortCountdowns), since it depends on today's date. */
export async function listGardenCountdowns(plotId: string): Promise<GardenCountdownRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<GardenCountdownRow>(`SELECT ${COLUMNS} ${FROM} WHERE c.plot_id = ? ORDER BY c.created_at ASC`, plotId);
}

/** The counters still running under areas still in use, for Home. */
export async function listRunningGardenCountdowns(): Promise<GardenCountdownRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<GardenCountdownRow>(
    `SELECT ${COLUMNS} ${FROM} WHERE c.done_at IS NULL AND p.archived_at IS NULL ORDER BY c.started_on ASC`,
  );
}

/** Every counter under areas still in use, running and done, for the
 *  Days Until lens. A past area's counters read only under that area. */
export async function listCurrentGardenCountdowns(): Promise<GardenCountdownRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<GardenCountdownRow>(`SELECT ${COLUMNS} ${FROM} WHERE p.archived_at IS NULL ORDER BY c.created_at ASC`);
}

export async function countRunningGardenCountdowns(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM garden_countdowns c JOIN garden_plots p ON p.id = c.plot_id WHERE c.done_at IS NULL AND p.archived_at IS NULL',
  );
  return row?.n ?? 0;
}

export async function addGardenCountdown(input: Pick<GardenCountdown, 'plotId' | 'plantingId' | 'name' | 'startedOn' | 'days'>): Promise<string> {
  const db = await getDatabase();
  const id = `countdown_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO garden_countdowns (id, plot_id, planting_id, name, started_on, days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.plotId,
    input.plantingId,
    input.name.trim(),
    input.startedOn,
    input.days,
    now,
    now,
  );
  return id;
}

/** Marks a counter done today, or, with done false, sets it running
 *  again. */
export async function setGardenCountdownDone(id: string, done: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE garden_countdowns SET done_at = ?, updated_at = ? WHERE id = ?', done ? now : null, now, id);
}

/** Removes a counter. Nothing refers to one, so the row goes. */
export async function deleteGardenCountdown(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_countdowns WHERE id = ?', id);
}
