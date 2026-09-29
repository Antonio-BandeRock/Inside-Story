// Reading and writing garden_measure_plan (1.0.55.32): what is measured in
// each garden area and at which level. The rules and words are in
// lib/measuringPlan.ts, with no database.

import { getDatabase } from './db';
import { normalizePlan, planRowId, type MeasurePlanRow, type PlanChoice } from './measuringPlan';

const COLUMNS = 'id, plot_id AS plotId, measurement, scope';

/** Every area's plan, in the order each row was set. */
export async function listMeasurePlans(): Promise<MeasurePlanRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<MeasurePlanRow>(`SELECT ${COLUMNS} FROM garden_measure_plan ORDER BY created_at, measurement`);
}

export async function listMeasurePlan(plotId: string): Promise<MeasurePlanRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<MeasurePlanRow>(
    `SELECT ${COLUMNS} FROM garden_measure_plan WHERE plot_id = ? ORDER BY created_at, measurement`,
    plotId,
  );
}

/** Replaces an area's plan with the choices given. A row kept keeps its
 *  created_at, so the order it was first set in holds; a row unticked is
 *  deleted, since no reading refers to it. */
export async function saveMeasurePlan(plotId: string, choices: PlanChoice[]): Promise<void> {
  const db = await getDatabase();
  const wanted = normalizePlan(choices);
  const now = new Date().toISOString();
  const existing = await listMeasurePlan(plotId);
  const keep = new Set(wanted.map((choice) => choice.measurement));
  for (const row of existing) {
    if (!keep.has(row.measurement)) await db.runAsync('DELETE FROM garden_measure_plan WHERE id = ?', row.id);
  }
  for (const choice of wanted) {
    const before = existing.find((row) => row.measurement === choice.measurement);
    if (before) {
      if (before.scope !== choice.scope) {
        await db.runAsync('UPDATE garden_measure_plan SET scope = ?, updated_at = ? WHERE id = ?', choice.scope, now, before.id);
      }
      continue;
    }
    await db.runAsync(
      'INSERT OR REPLACE INTO garden_measure_plan (id, plot_id, measurement, scope, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      planRowId(plotId, choice.measurement),
      plotId,
      choice.measurement,
      choice.scope,
      now,
      now,
    );
  }
}
