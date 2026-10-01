// Reading and writing My Crops. What a crop's reminders and row say is in
// lib/cropPlan.ts with no database; see garden_crop_plans and
// garden_crop_plan_steps in lib/db.ts.
//
// Removing a crop follows the open-lists rule: one with a step recorded is
// retired, which keeps the record and stops its reminders, and one with
// nothing recorded is deleted. Choosing a retired crop again brings it back
// with its steps.

import { getDatabase } from './db';
import type { AreaKind, CropPlan, CropPlanStep, CropStepKind } from './cropPlan';
import type { SowingAction } from './sowingWindows';

type PlanRow = {
  id: string;
  cropKey: string;
  plotId: string | null;
  plotName: string | null;
  plotLocation: AreaKind | null;
  plotArchivedAt: string | null;
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** The crops chosen and not removed, in no particular order; the band sorts
 *  them by name. */
export async function listCropPlans(): Promise<CropPlan[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlanRow>(
    `SELECT c.id, c.crop_key AS cropKey, c.plot_id AS plotId, p.name AS plotName,
            p.location_type AS plotLocation, p.archived_at AS plotArchivedAt
     FROM garden_crop_plans c
     LEFT JOIN garden_plots p ON p.id = c.plot_id
     WHERE c.retired_at IS NULL
     ORDER BY c.created_at ASC`,
  );
  return rows.map((row) => ({
    id: row.id,
    cropKey: row.cropKey,
    plotId: row.plotName === null ? null : row.plotId,
    plotName: row.plotName,
    plotLocation: row.plotLocation,
    plotArchived: row.plotArchivedAt !== null,
  }));
}

export async function listCropPlanSteps(): Promise<CropPlanStep[]> {
  const db = await getDatabase();
  return db.getAllAsync<CropPlanStep>(
    `SELECT id, plan_id AS planId, action, window_start AS windowStart, step, done_on AS doneOn
     FROM garden_crop_plan_steps ORDER BY done_on ASC`,
  );
}

/** Chooses a crop. One already chosen is left as it is, and one removed
 *  earlier with steps on it comes back. Returns the crop's id. */
export async function addCropPlan(cropKey: string, plotId: string | null): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await db.getFirstAsync<{ id: string; retiredAt: string | null }>(
    'SELECT id, retired_at AS retiredAt FROM garden_crop_plans WHERE crop_key = ? ORDER BY retired_at IS NOT NULL, created_at DESC LIMIT 1',
    cropKey,
  );
  if (existing) {
    if (existing.retiredAt) {
      await db.runAsync(
        'UPDATE garden_crop_plans SET retired_at = NULL, plot_id = COALESCE(?, plot_id), updated_at = ? WHERE id = ?',
        plotId,
        now,
        existing.id,
      );
    }
    return existing.id;
  }
  const id = newId('crop_plan');
  await db.runAsync(
    'INSERT INTO garden_crop_plans (id, crop_key, plot_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    id,
    cropKey,
    plotId,
    now,
    now,
  );
  return id;
}

export async function setCropPlanArea(id: string, plotId: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE garden_crop_plans SET plot_id = ?, updated_at = ? WHERE id = ?', plotId, new Date().toISOString(), id);
}

/** Takes a crop out of My Crops: retired when a step is recorded on it,
 *  deleted when nothing is. */
export async function removeCropPlan(id: string): Promise<'retired' | 'deleted'> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM garden_crop_plan_steps WHERE plan_id = ?', id);
  const now = new Date().toISOString();
  if ((row?.n ?? 0) > 0) {
    await db.runAsync('UPDATE garden_crop_plans SET retired_at = ?, updated_at = ? WHERE id = ?', now, now, id);
    return 'retired';
  }
  await db.runAsync('DELETE FROM garden_crop_plans WHERE id = ?', id);
  return 'deleted';
}

/** Records a step for one window. A second press for the same step and
 *  window adds nothing. */
export async function recordCropStep(planId: string, action: SowingAction, windowStart: string, step: CropStepKind, doneOn: string): Promise<void> {
  const db = await getDatabase();
  const plan = await db.getFirstAsync<{ id: string }>('SELECT id FROM garden_crop_plans WHERE id = ?', planId);
  if (!plan) return;
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM garden_crop_plan_steps WHERE plan_id = ? AND action = ? AND window_start = ? AND step = ?',
    planId,
    action,
    windowStart,
    step,
  );
  if (existing) return;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO garden_crop_plan_steps (id, plan_id, action, window_start, step, done_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId('crop_step'),
    planId,
    action,
    windowStart,
    step,
    doneOn,
    now,
    now,
  );
}

/** Undoes a step marked by mistake. */
export async function clearCropStep(planId: string, action: SowingAction, windowStart: string, step: CropStepKind): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM garden_crop_plan_steps WHERE plan_id = ? AND action = ? AND window_start = ? AND step = ?',
    planId,
    action,
    windowStart,
    step,
  );
}
