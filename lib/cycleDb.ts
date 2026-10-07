// Period days: reading and writing cycle_days (lib/db.ts), E1 of the
// competitive build plan (Phase 2, 2026-09-26). Signals > Cycle writes here
// by hand; a device import (Health Connect) would write the same table with
// source 'device', so the two share one record. Pattern Finder reads the
// period starts (lib/patternFinder.ts). The table is not on the
// between-people allowlist and never travels to anybody else.
import { getDatabase } from './db';
import { periodsFrom, type CycleDay } from './cycle';
import { readOrClosed } from './vaultReads';

export type CycleDayRow = { id: string; day: string; flow: number | null; source: string; notes: string | null };

export async function listCycleDays(limit = 120): Promise<CycleDayRow[]> {
  const db = await getDatabase();
  return readOrClosed(() => db.getAllAsync<CycleDayRow>(
    'SELECT id, day, flow, source, notes FROM cycle_days ORDER BY day DESC, source ASC LIMIT ?',
    limit,
  ), []);
}

export async function listAllCycleDays(): Promise<CycleDay[]> {
  const db = await getDatabase();
  return readOrClosed(() => db.getAllAsync<CycleDay>('SELECT day, flow FROM cycle_days ORDER BY day ASC'), []);
}

export async function listPeriodStarts(): Promise<string[]> {
  return periodsFrom(await listAllCycleDays()).map((period) => period.start);
}

/** One hand-logged row a day: logging the same day again replaces it. */
export async function saveCycleDay(input: { day: string; flow: number | null; notes: string | null }): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
  const existing = await db.getFirstAsync<{ id: string }>(
    "/* vault:tool */ SELECT id FROM cycle_days WHERE day = ? AND source = 'hand'",
    input.day,
  );
  if (existing) {
    await db.runAsync('UPDATE cycle_days SET flow = ?, notes = ?, updated_at = ? WHERE id = ?', input.flow, notes, now, existing.id);
    return;
  }
  await db.runAsync(
    "INSERT INTO cycle_days (id, day, flow, source, notes, created_at, updated_at) VALUES (?, ?, ?, 'hand', ?, ?, ?)",
    `cycle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    input.day,
    input.flow,
    notes,
    now,
    now,
  );
}

export async function deleteCycleDay(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM cycle_days WHERE id = ?', id);
}
