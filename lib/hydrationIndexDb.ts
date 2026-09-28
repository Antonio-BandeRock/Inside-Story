// Reads what lib/hydrationIndex.ts works from for one day: the activity
// minutes that move the water target, and the names of the drinks logged.
// Read-only.
//
// Activity comes from two places that can hold the same workout: Health
// Connect sessions (health_records, record_type 'exercise', value in
// minutes, one row per session on its local day) and workouts logged in the
// app (exercise_logs, logged_at stored as a local 'YYYY-MM-DDTHH:mm').
// `activeMinutesToday` counts the larger of the two rather than their sum.

import { getDatabase } from './db';
import { activeMinutesToday, movedWaterTarget, type MovedTarget } from './hydrationIndex';

export type HydrationDay = {
  active: { minutes: number; source: 'health' | 'logged' | null };
  /** Ingredient names from the day's logged drinks, in the order logged. */
  drinkNames: string[];
};

export async function getHydrationDay(date: string): Promise<HydrationDay> {
  const db = await getDatabase();
  const [health, logged, drinks] = await Promise.all([
    db.getAllAsync<{ minutes: number | null }>(
      `SELECT value AS minutes FROM health_records WHERE record_type = 'exercise' AND local_date = ?`,
      date,
    ),
    db.getAllAsync<{ minutes: number | null }>(
      `SELECT duration_minutes AS minutes FROM exercise_logs WHERE substr(logged_at, 1, 10) = ?`,
      date,
    ),
    db.getAllAsync<{ name: string | null }>(
      `SELECT mi.food_name AS name
         FROM meal_items mi
         JOIN meals m ON m.id = mi.meal_id
        WHERE m.meal_type = 'beverage' AND substr(m.eaten_at, 1, 10) = ?
        ORDER BY m.eaten_at ASC, mi.sort_order ASC`,
      date,
    ),
  ]);
  return {
    active: activeMinutesToday(
      health.map((row) => Number(row.minutes ?? 0)),
      logged.map((row) => Number(row.minutes ?? 0)),
    ),
    drinkNames: drinks.map((row) => (row.name ?? '').trim()).filter((name) => name.length > 0),
  };
}

/** The day's water target moved for activity, from the base target the nutrient analysis carries. */
export async function getMovedWaterTarget(date: string, baseMl: number): Promise<MovedTarget> {
  const day = await getHydrationDay(date);
  return movedWaterTarget(baseMl, day.active);
}
