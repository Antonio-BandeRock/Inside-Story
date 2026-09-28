// The database half of Your usual meals and of the meal left open on the plan
// (2026-09-27). The pure half, the card, suggestions, starters and every
// sentence, is lib/usualMeal.ts; the open-meal rule is lib/openMeals.ts.
//
// Reading never writes. Every write is the person's own tap: adding or
// removing a usual meal, logging one, Not today, and the open-meal rule.
import { createMeal, createMealFromComponents, getDatabase, getMealFavorite, getUserProfile, listScheduledMealsForDate, relogMeal } from './db';
import { listPacksBetween } from './mealPackDb';
import { OPEN_MEALS_META_KEY, openMealsOn, parseOpenMeals, serializeOpenMeals, type OpenMealRule } from './openMeals';
import {
  NO_LEFTOVERS_ERROR,
  USUAL_MEAL_META_KEY,
  eatenOutNote,
  historySuggestions,
  lookbackStart,
  usualMealsCard,
  type UsualMeal,
  type UsualMealHistoryRow,
  type UsualMealKind,
  type UsualMealSource,
  type UsualMealSuggestion,
  type UsualMealsCard,
  type UsualSlot,
} from './usualMeal';

type UsualMealRow = {
  id: string;
  meal_type: string;
  kind: string;
  source: string;
  name: string;
  favorite_id: string | null;
  source_meal_id: string | null;
  place: string | null;
  foods_json: string | null;
  last_used_at: string | null;
  created_at: string;
  standing_weekdays: string | null;
};

function parseWeekdays(json: string | null): number[] {
  try {
    const parsed = JSON.parse(json ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function toUsualMeal(row: UsualMealRow): UsualMeal {
  let foods: string[] = [];
  try {
    const parsed = JSON.parse(row.foods_json ?? '[]');
    if (Array.isArray(parsed)) foods = parsed.filter((food): food is string => typeof food === 'string');
  } catch {
    foods = [];
  }
  return {
    id: row.id,
    mealType: row.meal_type as UsualSlot,
    kind: row.kind === 'out' ? 'out' : 'home',
    source: row.source as UsualMealSource,
    name: row.name,
    favoriteId: row.favorite_id,
    sourceMealId: row.source_meal_id,
    place: row.place,
    foods,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    standingWeekdays: parseWeekdays(row.standing_weekdays),
  };
}

function newId(): string {
  return `usual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    new Date().toISOString(),
  );
}

// ---------------------------------------------------------------------------
// The meal left open on the plan
// ---------------------------------------------------------------------------

export async function getOpenMealRules(): Promise<OpenMealRule[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', OPEN_MEALS_META_KEY);
  return parseOpenMeals(row?.value);
}

export async function saveOpenMealRules(rules: OpenMealRule[]): Promise<void> {
  await setMeta(OPEN_MEALS_META_KEY, serializeOpenMeals(rules));
}

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------

export async function listUsualMeals(): Promise<UsualMeal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<UsualMealRow>(
    `SELECT id, meal_type, kind, source, name, favorite_id, source_meal_id, place, foods_json, last_used_at, created_at, standing_weekdays
       FROM usual_meals ORDER BY created_at`,
  );
  return rows.map(toUsualMeal);
}

export async function addUsualMeal(input: {
  mealType: UsualSlot;
  kind: UsualMealKind;
  source: UsualMealSource;
  name: string;
  favoriteId?: string | null;
  sourceMealId?: string | null;
  place?: string | null;
  foods?: string[];
}): Promise<string> {
  const db = await getDatabase();
  const id = newId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO usual_meals (id, meal_type, kind, source, name, favorite_id, source_meal_id, place, foods_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.mealType,
    input.kind,
    input.source,
    input.name.trim().slice(0, 80),
    input.favoriteId ?? null,
    input.sourceMealId ?? null,
    input.place?.trim() ? input.place.trim().slice(0, 80) : null,
    JSON.stringify(input.foods ?? []),
    now,
    now,
  );
  return id;
}

// Nothing refers to a usual meal: a meal logged from one is its own row, so
// taking it off the list leaves every logged meal as it was.
export async function removeUsualMeal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM usual_meals WHERE id = ?', id);
}

// The weekdays a usual meal stands on. A weekday another usual meal of the
// same slot already holds is left with that one: the screen shows it as
// taken, and this refuses it rather than moving it quietly.
export async function setStandingWeekdays(id: string, weekdays: number[]): Promise<void> {
  const db = await getDatabase();
  const meals = await listUsualMeals();
  const meal = meals.find((row) => row.id === id);
  if (!meal) return;
  const taken = new Set(
    meals.filter((row) => row.id !== id && row.mealType === meal.mealType).flatMap((row) => row.standingWeekdays),
  );
  const kept = [...new Set(weekdays)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6 && !taken.has(day)).sort((a, b) => a - b);
  await db.runAsync('UPDATE usual_meals SET standing_weekdays = ?, updated_at = ? WHERE id = ?', JSON.stringify(kept), new Date().toISOString(), id);
}

async function readHistory(today: string): Promise<UsualMealHistoryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<UsualMealHistoryRow>(
    `SELECT id, name, meal_type AS mealType, eaten_at AS eatenAt
       FROM meals WHERE eaten_at >= ? ORDER BY eaten_at`,
    lookbackStart(today),
  );
}

export async function getUsualMealSuggestions(today: string): Promise<Record<UsualSlot, UsualMealSuggestion[]>> {
  const [history, usualMeals] = await Promise.all([readHistory(today), listUsualMeals()]);
  return historySuggestions(history, today, usualMeals);
}

export async function listSavedMealsForUsual(): Promise<{ id: string; name: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name FROM favorites WHERE auto_generated = 0 AND item_type = 'meal' ORDER BY name COLLATE NOCASE`,
  );
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export async function getUsualMealsCard(today: string, nowTime: string): Promise<UsualMealsCard | null> {
  const db = await getDatabase();
  const [history, profile, planned, dismissed, usualMeals, openRules, packsToday] = await Promise.all([
    readHistory(today),
    getUserProfile(),
    listScheduledMealsForDate(today),
    db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', USUAL_MEAL_META_KEY),
    listUsualMeals(),
    getOpenMealRules(),
    listPacksBetween(today, today),
  ]);
  // A meal chosen the evening before is on the schedule too; Home offers
  // it as the packed meal rather than hiding the card as planned.
  const packItems = new Set(packsToday.map((pack) => pack.scheduleItemId).filter(Boolean));
  return usualMealsCard({
    history,
    today,
    nowTime,
    usualTimes: {
      breakfast: profile.usualBreakfastTime,
      lunch: profile.usualLunchTime,
      dinner: profile.usualDinnerTime,
    },
    plannedToday: planned
      .filter((item) => item.status !== 'skipped' && item.mealType && !packItems.has(item.id))
      .map((item) => item.mealType as string),
    dismissed: dismissed?.value ?? null,
    usualMeals,
    openToday: openMealsOn(openRules, today),
    packsToday,
  });
}

export async function dismissUsualMeal(dismissKey: string): Promise<void> {
  await setMeta(USUAL_MEAL_META_KEY, dismissKey);
}

export type UsualMealLogResult = { id: string; name: string; touchedFoodTrials: boolean } | { error: string };

// Logs one usual meal as the slot it is on the list for, at eatenAt. A meal
// eaten out carries "Eaten out." and the place in its notes, which is how
// the rest of the app (the voice log, variety reporting) tells it apart.
export async function logUsualMeal(meal: UsualMeal, eatenAt: string): Promise<UsualMealLogResult> {
  const db = await getDatabase();
  const notes = meal.kind === 'out' ? eatenOutNote(meal.place) : undefined;
  let logged: { id: string; name: string } | { error: string };

  if (meal.source === 'favorite' && meal.favoriteId) {
    const favorite = await getMealFavorite(meal.favoriteId, { markUsed: true });
    if (!favorite) return { error: 'That saved meal could not be opened. It may have been deleted, so take it off this list and add it again.' };
    const result = await createMealFromComponents({
      name: meal.name,
      mealType: meal.mealType,
      eatenAt,
      notes: notes ?? favorite.notes,
      isImmediate: true,
      components: favorite.components,
    });
    logged = 'error' in result ? result : { id: result.id, name: meal.name };
  } else if ((meal.source === 'meal' && meal.sourceMealId) || meal.source === 'leftovers') {
    let sourceId = meal.sourceMealId;
    if (meal.source === 'leftovers' && !sourceId) {
      const dinner = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM meals WHERE meal_type = 'dinner' AND eaten_at < ? ORDER BY eaten_at DESC LIMIT 1`,
        eatenAt.slice(0, 10),
      );
      if (!dinner) return { error: NO_LEFTOVERS_ERROR };
      sourceId = dinner.id;
    }
    const result = await relogMeal(sourceId as string, eatenAt, notes ? { notes } : undefined);
    if ('error' in result) return result;
    const name = meal.source === 'leftovers' ? `Leftovers: ${result.name}` : result.name;
    // relogMeal keeps the source's meal type; this one is eaten as the slot
    // it is on the list for, and leftovers say so in their name.
    await db.runAsync('UPDATE meals SET meal_type = ?, name = ? WHERE id = ?', meal.mealType, name, result.id);
    logged = { id: result.id, name };
  } else {
    const foods = meal.foods.length > 0 ? meal.foods : [meal.name];
    const created = await createMeal({
      name: meal.name,
      mealType: meal.mealType,
      eatenAt,
      notes,
      isImmediate: true,
      ingredients: foods.map((food) => ({ foodName: food, category: '', quantity: 1, unit: 'serving', dishServings: 1, yourSharePercent: 100 })),
    });
    logged = { id: created.id, name: meal.name };
  }

  if ('error' in logged) return logged;
  await db.runAsync('UPDATE usual_meals SET last_used_at = ?, updated_at = ? WHERE id = ?', new Date().toISOString(), new Date().toISOString(), meal.id);
  const trials = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM food_trials WHERE activated_by_meal_id = ?', logged.id);
  return { ...logged, touchedFoodTrials: (trials?.n ?? 0) > 0 };
}
