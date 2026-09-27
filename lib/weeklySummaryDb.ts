// The reads behind Your week (F13, lib/weeklySummary.ts): fourteen days of
// meals, flares and reactions, the daily scales, sleep and steps. Stamps go
// through localDayOf, so an older row written in UTC lands on its own local
// day rather than tomorrow.

import { getStepCountTrend, getDatabase } from './db';
import { localDayOf } from './dailyScales';
import { getMorningInputs } from './morningCheckinDb';
import { shiftDay, type WeekInputs } from './weeklySummary';

export async function getYourWeekInputs(now = new Date()): Promise<WeekInputs> {
  const db = await getDatabase();
  const [morning, stepRows] = await Promise.all([getMorningInputs(now), getStepCountTrend(21)]);
  const today = morning.today;
  // A day either side of the fourteen, then narrowed on the local day.
  const from = shiftDay(today, -15);
  const to = shiftDay(today, 1);
  const [meals, checkins] = await Promise.all([
    db.getAllAsync<{ eatenAt: string }>(
      `SELECT eaten_at AS eatenAt FROM meals WHERE eaten_at >= ? AND eaten_at < ?`,
      from,
      to,
    ),
    db.getAllAsync<{
      loggedAt: string;
      checkinType: string;
      valence: string | null;
      mood: number | null;
      energy: number | null;
      stress: number | null;
    }>(
      `SELECT logged_at AS loggedAt, checkin_type AS checkinType, valence, mood, energy, stress
         FROM wellbeing_checkins
        WHERE logged_at >= ? AND logged_at < ?`,
      from,
      to,
    ),
  ]);
  const flareDays: string[] = [];
  const scales: WeekInputs['scales'] = [];
  for (const row of checkins) {
    const date = localDayOf(row.loggedAt);
    if (row.checkinType === 'flare' || (row.checkinType === 'post_meal' && row.valence === 'negative')) flareDays.push(date);
    if (row.mood != null || row.energy != null || row.stress != null) {
      scales.push({ date, mood: row.mood, energy: row.energy, stress: row.stress });
    }
  }
  return {
    today,
    mealDays: meals.map((row) => localDayOf(row.eatenAt)),
    flareDays,
    sleep: morning.sleep,
    steps: stepRows.map((row) => ({ date: row.date, value: row.stepCount })),
    scales,
  };
}
