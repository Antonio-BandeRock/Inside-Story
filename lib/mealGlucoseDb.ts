// Loads logged meals and glucose readings for lib/mealGlucose.ts (F10).
// Meals carry a local 'YYYY-MM-DDTHH:mm'; glucose readings carry the ISO
// time Health Connect gave them. Both become milliseconds here, so the pure
// module compares like with like.

import { getDatabase } from './db';
import { addDays } from './eatingVariety';
import { hasReadingsNear, readMealsGlucose, type GlucosePoint, type MealForGlucose, type MealGlucose } from './mealGlucose';

function localMillis(eatenAt: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(eatenAt);
  if (!match) return null;
  const [, y, m, d, h, mi] = match.map(Number);
  return new Date(y, m - 1, d, h, mi).getTime();
}

// Every meal from fromDay through toDay (local days) with glucose readings
// around it, oldest first. Meals on days with no meter or sensor in use are
// left out.
export async function listMealGlucose(fromDay: string, toDay: string): Promise<MealGlucose[]> {
  const db = await getDatabase();
  const [mealRows, glucoseRows] = await Promise.all([
    db.getAllAsync<{ id: string; name: string | null; mealType: string; eatenAt: string }>(
      `SELECT id, name, meal_type AS mealType, eaten_at AS eatenAt FROM meals
       WHERE eaten_at >= ? AND eaten_at < ? ORDER BY eaten_at ASC`,
      fromDay,
      addDays(toDay, 1),
    ),
    db.getAllAsync<{ startedAt: string; value: number | null }>(
      `SELECT started_at AS startedAt, value FROM health_records
       WHERE record_type = 'glucose' AND local_date >= ? AND local_date <= ?
       ORDER BY started_at ASC`,
      addDays(fromDay, -1),
      addDays(toDay, 1),
    ),
  ]);
  const readings: GlucosePoint[] = [];
  for (const row of glucoseRows) {
    const at = Date.parse(row.startedAt);
    if (typeof row.value === 'number' && Number.isFinite(row.value) && Number.isFinite(at)) {
      readings.push({ at, mmol: row.value });
    }
  }
  if (readings.length === 0) return [];
  const meals: MealForGlucose[] = [];
  for (const row of mealRows) {
    const at = localMillis(row.eatenAt);
    if (at === null) continue;
    meals.push({
      id: row.id,
      name: row.name?.trim() || 'Unnamed meal',
      mealType: row.mealType,
      at,
      day: row.eatenAt.slice(0, 10),
      clock: row.eatenAt.slice(11, 16),
    });
  }
  return readMealsGlucose(meals, readings).filter((read) => hasReadingsNear(read.meal, readings));
}
