// Reading and writing saved weeks of meals (H6). Every decision is in
// lib/savedWeeks.ts with no database; see saved_weeks in lib/db.ts.

import { getDatabase, listScheduledMealsForDateRange } from './db';
import type { SavedWeek, SavedWeekApplication, SavedWeekMeal } from './savedWeeks';
import { addDaysTo, mealsForSaving, planSavedWeek } from './savedWeeks';

type SavedWeekMealRow = SavedWeekMeal & { savedWeekId: string };

export async function listSavedWeeks(): Promise<SavedWeek[]> {
  const db = await getDatabase();
  const weeks = await db.getAllAsync<{ id: string; name: string; createdAt: string }>(
    'SELECT id, name, created_at AS createdAt FROM saved_weeks ORDER BY name COLLATE NOCASE',
  );
  const meals = await db.getAllAsync<SavedWeekMealRow>(
    `SELECT saved_week_id AS savedWeekId, meal_key AS key, day_offset AS dayOffset, time, meal_type AS mealType, title,
            source_favorite_id AS sourceFavoriteId, source_meal_id AS sourceMealId, servings,
            rotation_selections_json AS rotationSelectionsJson, notes, leftover_of_key AS leftoverOfKey
     FROM saved_week_meals ORDER BY day_offset, time`,
  );
  return weeks.map((week) => ({
    ...week,
    meals: meals.filter((meal) => meal.savedWeekId === week.id).map(({ savedWeekId: _unused, ...meal }) => meal),
  }));
}

/** Saves the week starting `weekStart` under `name`. Returns how many meals were kept. */
export async function saveWeekOfMeals(weekStart: string, name: string): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the week a name first.');
  const items = await listScheduledMealsForDateRange(weekStart, addDaysTo(weekStart, 6));
  const meals = mealsForSaving(items, weekStart);
  if (meals.length === 0) return 0;
  const db = await getDatabase();
  const id = `saved_week_${Date.now()}`;
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO saved_weeks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', id, trimmed, now, now);
    for (const meal of meals) {
      await db.runAsync(
        `INSERT INTO saved_week_meals
           (id, saved_week_id, meal_key, day_offset, time, meal_type, title, source_favorite_id, source_meal_id,
            servings, rotation_selections_json, notes, leftover_of_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `${id}_${meal.key}`,
        id,
        meal.key,
        meal.dayOffset,
        meal.time,
        meal.mealType,
        meal.title,
        meal.sourceFavoriteId,
        meal.sourceMealId,
        meal.servings,
        meal.rotationSelectionsJson,
        meal.notes,
        meal.leftoverOfKey,
        now,
        now,
      );
    }
  });
  return meals.length;
}

export async function renameSavedWeek(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('A saved week needs a name.');
  const db = await getDatabase();
  await db.runAsync('UPDATE saved_weeks SET name = ?, updated_at = ? WHERE id = ?', trimmed, new Date().toISOString(), id);
}

// Nothing on the schedule refers to a saved week, so its own rows are all
// that go.
export async function removeSavedWeek(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM saved_week_meals WHERE saved_week_id = ?', id);
    await db.runAsync('DELETE FROM saved_weeks WHERE id = ?', id);
  });
}

/** What using `week` on the week starting `weekStart` would add, before anything is written. */
export async function previewSavedWeek(week: SavedWeek, weekStart: string, today: string): Promise<SavedWeekApplication> {
  const db = await getDatabase();
  const existing = await listScheduledMealsForDateRange(weekStart, addDaysTo(weekStart, 6));
  const favoriteIds = [...new Set(week.meals.map((meal) => meal.sourceFavoriteId).filter((id): id is string => !!id))];
  const mealIds = [...new Set(week.meals.map((meal) => meal.sourceMealId).filter((id): id is string => !!id))];
  const favorites = new Set<string>();
  const meals = new Set<string>();
  for (const id of favoriteIds) {
    if (await db.getFirstAsync('SELECT 1 FROM favorites WHERE id = ?', id)) favorites.add(id);
  }
  for (const id of mealIds) {
    if (await db.getFirstAsync('SELECT 1 FROM meals WHERE id = ?', id)) meals.add(id);
  }
  return planSavedWeek(
    week.meals,
    weekStart,
    today,
    existing.map((item) => ({ date: item.scheduledFor.slice(0, 10), mealType: item.mealType, title: item.title, status: item.status })),
    { favorites, meals },
  );
}

/** Writes what previewSavedWeek decided. Returns how many meals were added. */
export async function applySavedWeek(plan: SavedWeekApplication): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const stamp = Date.now();
  const idOf = new Map(plan.create.map((meal, index) => [meal.key, `schedule_item_${stamp}_week_${index}`]));
  await db.withTransactionAsync(async () => {
    // Cooked meals first, so a leftover's link names a row that exists.
    const ordered = [...plan.create].sort((a, b) => Number(!!a.leftoverOfKey) - Number(!!b.leftoverOfKey));
    for (const meal of ordered) {
      await db.runAsync(
        `INSERT INTO schedule_items
           (id, scheduled_for, item_type, meal_type, title, status, notes, source_favorite_id, source_meal_id,
            repeat_type, servings, rotation_selections_json, leftover_of, created_at, updated_at)
         VALUES (?, ?, 'meal', ?, ?, 'planned', ?, ?, ?, 'none', ?, ?, ?, ?, ?)`,
        idOf.get(meal.key) as string,
        meal.scheduledFor,
        meal.mealType,
        meal.title,
        meal.notes,
        meal.sourceFavoriteId,
        meal.sourceMealId,
        meal.servings,
        meal.rotationSelectionsJson,
        meal.leftoverOfKey ? (idOf.get(meal.leftoverOfKey) ?? null) : null,
        now,
        now,
      );
    }
  });
  return plan.create.length;
}
