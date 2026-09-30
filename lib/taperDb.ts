// Reading and writing a med's taper (A2). The steps and every sentence about
// them are in lib/taper.ts; the reminder queries in lib/db.ts read the table
// directly for a dose's day.

import { getDatabase } from './db';
import { sortSteps, type TaperStep } from './taper';

type Row = {
  treatment_id: string;
  start_date: string;
  end_date: string;
  dose_amount: number;
  dose_unit: string | null;
};

// Every med's steps, keyed by treatment id, each list in date order.
export async function listTaperSteps(): Promise<Map<string, TaperStep[]>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>(
    'SELECT treatment_id, start_date, end_date, dose_amount, dose_unit FROM treatment_taper_steps ORDER BY treatment_id, start_date',
  );
  const byTreatment = new Map<string, TaperStep[]>();
  for (const row of rows) {
    const list = byTreatment.get(row.treatment_id) ?? [];
    list.push({ startDate: row.start_date, endDate: row.end_date, amount: row.dose_amount, unit: row.dose_unit });
    byTreatment.set(row.treatment_id, list);
  }
  for (const [id, list] of byTreatment) byTreatment.set(id, sortSteps(list));
  return byTreatment;
}

// A taper is saved whole: the steps are one schedule, so changing any of
// them replaces the lot. Each step's id is the med plus its first day, so
// the same taper entered on two devices merges into the same rows.
export async function saveTaperSteps(treatmentId: string, steps: readonly TaperStep[]): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM treatment_taper_steps WHERE treatment_id = ?', treatmentId);
    for (const step of sortSteps(steps)) {
      await db.runAsync(
        `INSERT INTO treatment_taper_steps (id, treatment_id, start_date, end_date, dose_amount, dose_unit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        `taper_${treatmentId}_${step.startDate}`,
        treatmentId,
        step.startDate,
        step.endDate,
        step.amount,
        step.unit,
        now,
        now,
      );
    }
  });
}

export async function clearTaperSteps(treatmentId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM treatment_taper_steps WHERE treatment_id = ?', treatmentId);
}
