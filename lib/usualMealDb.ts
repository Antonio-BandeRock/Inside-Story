// The database half of "Log your usual lunch?" (G25, 2026-09-27). The pure
// half, which meal counts as usual and every sentence, is lib/usualMeal.ts.
//
// Reading never writes. The two writes are the person's own taps: Log it
// now (a copy through relogMeal, the same path Find a Meal uses) and Not
// today, one app_meta row holding the day and slot it was pressed for.
import { getDatabase, getUserProfile, listScheduledMealsForDate, relogMeal } from './db';
import {
  USUAL_MEAL_META_KEY,
  lookbackStart,
  usualMealSuggestion,
  type UsualMealHistoryRow,
  type UsualMealSuggestion,
} from './usualMeal';

export async function getUsualMealSuggestion(today: string, nowTime: string): Promise<UsualMealSuggestion | null> {
  const db = await getDatabase();
  const [history, profile, planned, dismissed] = await Promise.all([
    db.getAllAsync<UsualMealHistoryRow>(
      `SELECT id, name, meal_type AS mealType, eaten_at AS eatenAt
         FROM meals WHERE eaten_at >= ? ORDER BY eaten_at`,
      lookbackStart(today),
    ),
    getUserProfile(),
    listScheduledMealsForDate(today),
    db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', USUAL_MEAL_META_KEY),
  ]);
  return usualMealSuggestion({
    history,
    today,
    nowTime,
    usualTimes: {
      breakfast: profile.usualBreakfastTime,
      lunch: profile.usualLunchTime,
      dinner: profile.usualDinnerTime,
    },
    plannedToday: planned
      .filter((item) => item.status !== 'skipped' && item.mealType)
      .map((item) => item.mealType as string),
    dismissed: dismissed?.value ?? null,
  });
}

export async function dismissUsualMeal(dismissKey: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    USUAL_MEAL_META_KEY,
    dismissKey,
    new Date().toISOString(),
  );
}

export async function logUsualMeal(suggestion: UsualMealSuggestion, eatenAt: string) {
  return relogMeal(suggestion.sourceMealId, eatenAt);
}
