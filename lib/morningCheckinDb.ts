// The reads and the one write behind the morning check-in (D7,
// lib/morningCheckin.ts). The answer is a wellbeing_checkins row of type
// 'sleep', which the table has named since it was made and nothing had used:
// sleep_quality is its own column, energy is the same 1 to 5 column the
// daily scales write, and the note is the row's note. One row a morning;
// answering again the same morning changes that row rather than adding one.

import { getDatabase } from './db';
import { localStamp } from './dailyScales';
import type { MorningInputs, MorningPoint } from './morningCheckin';

// How far back the usual range reaches. The range needs 8 earlier
// readings, and four months holds far more than that for anyone who wears
// a watch at night.
const LOOKBACK_DAYS = 120;

function localDate(date: Date): string {
  return localStamp(date).slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export async function getMorningInputs(now = new Date()): Promise<MorningInputs> {
  const db = await getDatabase();
  const since = localDate(addDays(now, -LOOKBACK_DAYS));
  const today = localDate(now);
  const rows = await db.getAllAsync<{ recordType: string; localDate: string; value: number | null; value2: number | null }>(
    `SELECT record_type AS recordType, local_date AS localDate, value, value2
       FROM health_records
      WHERE record_type IN ('sleep', 'resting_heart_rate', 'hrv') AND local_date >= ? AND local_date <= ?
      ORDER BY started_at ASC`,
    since,
    today,
  );
  // Sleep as Trends reads it (getSleepTrendPoints): time asleep where the
  // watch recorded stages, otherwise time in bed, and two sessions ending
  // the same morning added together.
  const sleepByDate = new Map<string, number>();
  const restingHeartRate: MorningPoint[] = [];
  const hrv: MorningPoint[] = [];
  for (const row of rows) {
    if (row.recordType === 'sleep') {
      const hours = row.value2 ?? row.value;
      if (typeof hours === 'number' && Number.isFinite(hours)) {
        sleepByDate.set(row.localDate, (sleepByDate.get(row.localDate) ?? 0) + hours);
      }
      continue;
    }
    if (typeof row.value !== 'number' || !Number.isFinite(row.value)) continue;
    (row.recordType === 'hrv' ? hrv : restingHeartRate).push({ date: row.localDate, value: row.value });
  }
  const sleep = [...sleepByDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
  return { today, yesterday: localDate(addDays(now, -1)), sleep, restingHeartRate, hrv };
}

export type MorningRecord = {
  id: string;
  loggedAt: string;
  sleepQuality: number | null;
  energy: number | null;
  notes: string | null;
};

export async function getMorningCheckin(now = new Date()): Promise<MorningRecord | null> {
  const db = await getDatabase();
  return db.getFirstAsync<MorningRecord>(
    `SELECT id, logged_at AS loggedAt, sleep_quality AS sleepQuality, energy, notes
       FROM wellbeing_checkins
      WHERE checkin_type = 'sleep' AND logged_at >= ? AND logged_at < ?
      ORDER BY logged_at DESC
      LIMIT 1`,
    localDate(now),
    localDate(addDays(now, 1)),
  );
}

export async function saveMorningCheckin(input: {
  existingId: string | null;
  sleepQuality: number | null;
  energy: number | null;
  notes: string;
  /** When it was answered, for a reminder answered while locked; now otherwise. */
  at?: Date;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  const answeredAt = input.at ?? now;
  const stamp = now.toISOString();
  const notes = input.notes.trim() || null;
  if (input.existingId) {
    await db.runAsync(
      `UPDATE wellbeing_checkins SET sleep_quality = ?, energy = ?, notes = ?, updated_at = ? WHERE id = ?`,
      input.sleepQuality,
      input.energy,
      notes,
      stamp,
      input.existingId,
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO wellbeing_checkins (id, logged_at, checkin_type, valence, notes, energy, sleep_quality, created_at, updated_at)
     VALUES (?, ?, 'sleep', 'neutral', ?, ?, ?, ?, ?)`,
    `checkin_${Date.now()}`,
    localStamp(answeredAt),
    notes,
    input.energy,
    input.sleepQuality,
    stamp,
    stamp,
  );
}
