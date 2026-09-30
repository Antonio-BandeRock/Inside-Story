// Reading the food and symptom diary (K9) for a report. What the rows say
// is in lib/reportDiary.ts.
import { getCheckinTagDefinition } from './checkinTags';
import { getDatabase, listCheckins } from './db';
import { addDays } from './eatingVariety';
import type { DiaryCheckin, DiaryMeal } from './reportDiary';

/** Every meal eaten from rangeStart to rangeEnd, both days counted, with
 *  the foods logged in it. eaten_at is local 'YYYY-MM-DDTHH:mm'. */
export async function listDiaryMeals(rangeStart: string, rangeEnd: string): Promise<DiaryMeal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; eatenAt: string; mealType: string | null; name: string; food: string | null }>(
    `SELECT m.id, m.eaten_at AS eatenAt, m.meal_type AS mealType, m.name, mi.food_name AS food
     FROM meals m LEFT JOIN meal_items mi ON mi.meal_id = m.id
     WHERE m.eaten_at >= ? AND m.eaten_at < ?
     ORDER BY m.eaten_at, mi.sort_order`,
    rangeStart,
    addDays(rangeEnd, 1),
  );
  const byId = new Map<string, DiaryMeal>();
  for (const row of rows) {
    const meal = byId.get(row.id) ?? { id: row.id, eatenAt: row.eatenAt, mealType: row.mealType, name: row.name, foods: [] };
    if (row.food) meal.foods.push(row.food);
    byId.set(row.id, meal);
  }
  return [...byId.values()];
}

/** Every flare and after-meal reaction logged in the range. */
export async function listDiaryCheckins(rangeStart: string, rangeEnd: string): Promise<DiaryCheckin[]> {
  const [flares, reactions] = await Promise.all([
    listCheckins({ checkinType: 'flare', limit: 2000 }),
    listCheckins({ checkinType: 'post_meal', limit: 2000 }),
  ]);
  return [...flares, ...reactions]
    .filter((entry) => {
      const day = entry.loggedAt.slice(0, 10);
      return day >= rangeStart && day <= rangeEnd;
    })
    .map((entry) => ({
      loggedAt: entry.loggedAt,
      kind: entry.checkinType === 'flare' ? ('flare' as const) : ('post_meal' as const),
      severity: entry.severity,
      food: entry.foodName,
      symptoms: entry.tags.map((code) => getCheckinTagDefinition(code)?.label ?? code),
      notes: entry.notes,
    }));
}
