// Reading and writing what work offers, and how it has been going.
//
// Added 2026-09-05. Same split every other module here follows: schema in
// lib/db.ts, arithmetic and the honesty rules in lib/workBenefits.ts and
// lib/workMeaning.ts with no database so they can be tested without one, and
// the reading and writing here.

import { getDatabase } from './db';
import type { Benefit, BenefitKind, ResetCadence } from './workBenefits';
import { weekOf, type WorkCheckin } from './workMeaning';

// --- What work offers -------------------------------------------------------

export async function upsertBenefit(input: {
  id?: string;
  name: string;
  kind: BenefitKind;
  total?: number | null;
  used?: number;
  resets: ResetCadence;
  resetOn?: string | null;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  // A perk has no quantity, enforced here rather than trusted from the form,
  // so nothing downstream has to guard against a perk with a total on it.
  const total = input.kind === 'perk' ? null : input.total ?? null;
  const used = input.kind === 'perk' ? 0 : input.used ?? 0;
  // Nothing that never resets carries a reset date, for the same reason.
  const resetOn = input.resets === 'never' ? null : input.resetOn || null;

  if (input.id) {
    await db.runAsync(
      `
        UPDATE work_benefits
        SET name = ?, kind = ?, total = ?, used = ?, resets = ?, reset_on = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      input.name.trim(), input.kind, total, used, input.resets, resetOn,
      input.notes?.trim() || null, now, input.id,
    );
    return input.id;
  }

  const id = `work_ben_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO work_benefits (id, name, kind, total, used, resets, reset_on, active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id, input.name.trim(), input.kind, total, used, input.resets, resetOn,
    input.notes?.trim() || null, now, now,
  );
  return id;
}

/** Record more of an allowance as used, or for a match, change what you pay
 *  in. Additive for an allowance and absolute for a match, since one
 *  accumulates and the other is a level. */
export async function recordBenefitUse(id: string, amount: number): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ kind: string }>('SELECT kind FROM work_benefits WHERE id = ?', id);
  if (!row) return;
  const now = new Date().toISOString();
  if (row.kind === 'match') {
    await db.runAsync('UPDATE work_benefits SET used = ?, updated_at = ? WHERE id = ?', Math.max(0, amount), now, id);
    return;
  }
  await db.runAsync(
    'UPDATE work_benefits SET used = MAX(0, used + ?), updated_at = ? WHERE id = ?',
    amount, now, id,
  );
}

/**
 * Start the allowance again after a reset, and move the date forward.
 *
 * Deliberately a thing someone does rather than something that happens on its
 * own. Zeroing an allowance automatically on a date would erase the record of
 * a year nobody had looked at yet, and the whole point of this area is that
 * unused allowance is worth seeing before it goes.
 */
export async function rollBenefitPeriod(id: string, nextResetOn: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE work_benefits SET used = 0, reset_on = ?, updated_at = ? WHERE id = ?',
    nextResetOn || null, new Date().toISOString(), id,
  );
}

export async function setBenefitActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE work_benefits SET active = ?, updated_at = ? WHERE id = ?',
    active ? 1 : 0, new Date().toISOString(), id,
  );
}

export async function deleteBenefit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM work_benefits WHERE id = ?', id);
}

export async function listBenefits(): Promise<Benefit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string; name: string; kind: string; total: number | null; used: number;
    resets: string; resetOn: string | null; active: number; notes: string | null;
  }>(
    `
      SELECT id, name, kind, total, used, resets, reset_on AS resetOn, active, notes
      FROM work_benefits
      ORDER BY active DESC, reset_on IS NULL, reset_on, name
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind as BenefitKind,
    total: row.total,
    used: row.used,
    resets: (row.resets as ResetCadence) ?? 'yearly',
    resetOn: row.resetOn,
    active: Number(row.active) === 1,
    notes: row.notes,
  }));
}

// --- How work has been going ------------------------------------------------

/**
 * Save this week's answers, replacing the week's existing answer if there is
 * one. Answering again is a correction, not a second week.
 */
export async function saveWorkCheckin(input: {
  date: string;
  autonomy: number;
  competence: number;
  relatedness: number;
  drain: number;
  note?: string;
}): Promise<string> {
  const db = await getDatabase();
  const week = weekOf(input.date);
  const id = `work_ci_${week}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO work_checkins (id, week_of, autonomy, competence, relatedness, drain, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(week_of) DO UPDATE SET
        autonomy = excluded.autonomy,
        competence = excluded.competence,
        relatedness = excluded.relatedness,
        drain = excluded.drain,
        note = excluded.note,
        updated_at = excluded.updated_at
    `,
    id, week, input.autonomy, input.competence, input.relatedness, input.drain,
    input.note?.trim() || null, now, now,
  );
  return id;
}

export async function deleteWorkCheckin(weekOfDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM work_checkins WHERE week_of = ?', weekOf(weekOfDate));
}

export async function listWorkCheckins(limit = 52): Promise<WorkCheckin[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WorkCheckin>(
    `
      SELECT id, week_of AS weekOf, autonomy, competence, relatedness, drain, note
      FROM work_checkins
      ORDER BY week_of DESC
      LIMIT ?
    `,
    limit,
  );
  // Oldest first, which is the order every trend calculation wants.
  return rows.reverse();
}

export async function getWorkCheckinForWeek(date: string): Promise<WorkCheckin | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WorkCheckin>(
    `
      SELECT id, week_of AS weekOf, autonomy, competence, relatedness, drain, note
      FROM work_checkins
      WHERE week_of = ?
    `,
    weekOf(date),
  );
  return row ?? null;
}
