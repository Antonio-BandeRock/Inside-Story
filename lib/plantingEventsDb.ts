// Reading and writing what was done to each planting (I14, 2026-09-28).
// The words and counting are in lib/plantingEvents.ts with no database;
// this is the reading and writing of garden_planting_events (see its
// comment in lib/db.ts).
//
// Append-only in the way compost_events is: an entry is added or deleted,
// never edited, since a mistaken one is fixed by deleting it and adding the
// right one.

import { getDatabase } from './db';
import type { PlantingEventRecord } from './plantingEvents';

const COLUMNS = `
  id, planting_id AS plantingId, plot_id AS plotId, occurred_on AS occurredOn, kind, note, created_at AS createdAt
`;

export async function addPlantingEvent(input: {
  plantingId: string;
  plotId: string | null;
  occurredOn: string;
  kind: string;
  note?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `plant_ev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await db.runAsync(
    'INSERT INTO garden_planting_events (id, planting_id, plot_id, occurred_on, kind, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id,
    input.plantingId,
    input.plotId,
    input.occurredOn,
    input.kind,
    input.note?.trim() || null,
    new Date().toISOString(),
  );
  return id;
}

export async function deletePlantingEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_planting_events WHERE id = ?', id);
}

/** One planting's record, newest first. */
export async function listPlantingEvents(plantingId: string): Promise<PlantingEventRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<PlantingEventRecord>(
    `SELECT ${COLUMNS} FROM garden_planting_events WHERE planting_id = ? ORDER BY occurred_on DESC, created_at DESC`,
    plantingId,
  );
}

/** How many entries each planting in an area has, keyed by planting id. A
 *  planting with any is a record and is not deleted. */
export async function listPlantingEventCounts(plotId: string): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ plantingId: string; n: number }>(
    `SELECT e.planting_id AS plantingId, COUNT(*) AS n
     FROM garden_planting_events e
     JOIN garden_plantings g ON g.id = e.planting_id
     WHERE g.plot_id = ?
     GROUP BY e.planting_id`,
    plotId,
  );
  return Object.fromEntries(rows.map((row) => [row.plantingId, row.n]));
}

/** Every entry on the given plantings, up to a day, for Trends > Garden
 *  Yield. Plain local dates, so a ten-character comparison is the day. */
export async function listPlantingEventsFor(plantingIds: string[], endDate: string): Promise<PlantingEventRecord[]> {
  if (plantingIds.length === 0) return [];
  const db = await getDatabase();
  const out: PlantingEventRecord[] = [];
  // SQLite caps bound parameters; 400 at a time stays well under it.
  for (let i = 0; i < plantingIds.length; i += 400) {
    const chunk = plantingIds.slice(i, i + 400);
    const rows = await db.getAllAsync<PlantingEventRecord>(
      `SELECT ${COLUMNS} FROM garden_planting_events
       WHERE occurred_on <= ? AND planting_id IN (${chunk.map(() => '?').join(', ')})
       ORDER BY occurred_on`,
      endDate,
      ...chunk,
    );
    out.push(...rows);
  }
  return out;
}
