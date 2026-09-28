// Reading and writing the household meal calendar (H9). Every decision and
// sentence is in lib/householdCalendar.ts with no database; see
// household_meal_calendar in lib/db.ts for why it is a table of its own.

import { listConnections } from './connections';
import {
  getDatabase,
  getMealPlanTimes,
  listScheduledMealsForDateRange,
  scheduleMeal,
  scheduleSystemRecipesAsMeal,
  setScheduledMealServings,
} from './db';
import type { CalendarPartner, HouseholdMealDraft, HouseholdMealEntry, MyDayMeal } from './householdCalendar';
import { draftToFields, isHouseholdMealType, sortEntries } from './householdCalendar';
import { relationshipFor, talksAutomatically } from './peerRelationships';

type EntryRow = {
  id: string;
  mealDate: string;
  time: string | null;
  mealType: string;
  title: string;
  recipeIdsJson: string | null;
  servings: number | null;
  cook: string | null;
  note: string | null;
  myScheduleItemId: string | null;
  myCopiedAt: string | null;
  updatedAt: string;
};

function parseRecipeIds(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function fromRow(row: EntryRow): HouseholdMealEntry {
  return {
    id: row.id,
    mealDate: row.mealDate,
    time: row.time,
    mealType: isHouseholdMealType(row.mealType) ? row.mealType : 'dinner',
    title: row.title,
    recipeIds: parseRecipeIds(row.recipeIdsJson),
    servings: row.servings,
    cook: row.cook,
    note: row.note,
    myScheduleItemId: row.myScheduleItemId,
    myCopiedAt: row.myCopiedAt,
    updatedAt: row.updatedAt,
  };
}

export async function listHouseholdMeals(startDate: string, endDate: string): Promise<HouseholdMealEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT id, meal_date AS mealDate, time, meal_type AS mealType, title, recipe_ids_json AS recipeIdsJson,
            servings, cook, note, my_schedule_item_id AS myScheduleItemId, my_copied_at AS myCopiedAt,
            updated_at AS updatedAt
     FROM household_meal_calendar WHERE meal_date BETWEEN ? AND ?`,
    startDate,
    endDate,
  );
  return sortEntries(rows.map(fromRow));
}

// The id carries a random part as well as the time, since two phones can
// each add a meal in the same millisecond and both rows have to survive
// the merge.
function newEntryId(): string {
  return `household_meal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function addHouseholdMeal(draft: HouseholdMealDraft): Promise<string> {
  const fields = draftToFields(draft);
  const db = await getDatabase();
  const id = newEntryId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO household_meal_calendar
       (id, meal_date, time, meal_type, title, recipe_ids_json, servings, cook, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    fields.mealDate,
    fields.time,
    fields.mealType,
    fields.title,
    JSON.stringify(fields.recipeIds),
    fields.servings,
    fields.cook,
    fields.note,
    now,
    now,
  );
  return id;
}

export async function updateHouseholdMeal(id: string, draft: HouseholdMealDraft): Promise<void> {
  const fields = draftToFields(draft);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE household_meal_calendar
     SET meal_date = ?, time = ?, meal_type = ?, title = ?, recipe_ids_json = ?, servings = ?, cook = ?, note = ?,
         updated_at = ?
     WHERE id = ?`,
    fields.mealDate,
    fields.time,
    fields.mealType,
    fields.title,
    JSON.stringify(fields.recipeIds),
    fields.servings,
    fields.cook,
    fields.note,
    new Date().toISOString(),
    id,
  );
}

// Nothing on the schedule points back at a calendar entry, so the meal
// somebody copied onto their day stays where it is.
export async function removeHouseholdMeal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM household_meal_calendar WHERE id = ?', id);
}

/** Planned meals on this person's schedule for a range, with any system recipes they came from. */
export async function listMyDayMeals(startDate: string, endDate: string): Promise<MyDayMeal[]> {
  const items = await listScheduledMealsForDateRange(startDate, endDate);
  const db = await getDatabase();
  const slots = await db.getAllAsync<{ scheduleItemId: string; recipeIdsJson: string | null }>(
    `SELECT schedule_item_id AS scheduleItemId, recipe_ids_json AS recipeIdsJson
     FROM meal_plan_slots WHERE date BETWEEN ? AND ? AND schedule_item_id IS NOT NULL`,
    startDate,
    endDate,
  );
  const recipesByItem = new Map(slots.map((slot) => [slot.scheduleItemId, parseRecipeIds(slot.recipeIdsJson)]));
  return items
    .filter((item) => item.status !== 'skipped')
    .map((item) => ({
      scheduledFor: item.scheduledFor,
      mealType: item.mealType,
      title: item.title,
      servings: item.servings,
      recipeIds: recipesByItem.get(item.id) ?? [],
    }));
}

/**
 * Copies a calendar meal onto this person's schedule. System recipes become
 * the same saved dishes the meal plan makes, so the meal logs from its
 * ingredients; a meal typed in by name goes on by name. Returns the new
 * schedule item's id.
 */
export async function putHouseholdMealOnSchedule(entry: HouseholdMealEntry): Promise<string> {
  let time = entry.time;
  if (!time) {
    const times = await getMealPlanTimes();
    time = entry.mealType === 'snack' ? '15:00' : times[entry.mealType];
  }
  const scheduledFor = `${entry.mealDate}T${time}`;
  const notes = entry.note ?? undefined;
  let scheduleItemId =
    entry.recipeIds.length > 0
      ? await scheduleSystemRecipesAsMeal({
          recipeIds: entry.recipeIds,
          title: entry.title,
          mealType: entry.mealType,
          scheduledFor,
          servings: entry.servings,
          notes,
        })
      : null;
  if (!scheduleItemId) {
    scheduleItemId = await scheduleMeal({ title: entry.title, mealType: entry.mealType, scheduledFor, notes });
    if (entry.servings != null) await setScheduledMealServings(scheduleItemId, entry.servings);
  }
  const db = await getDatabase();
  // updated_at is left alone: the copy is this device's business, and a
  // changed updated_at would travel as if the meal itself had changed.
  await db.runAsync(
    'UPDATE household_meal_calendar SET my_schedule_item_id = ?, my_copied_at = ? WHERE id = ?',
    scheduleItemId,
    new Date().toISOString(),
    entry.id,
  );
  return scheduleItemId;
}

/** The people the calendar can travel to, and whether Meals is turned on for each. */
export async function getCalendarPartners(): Promise<CalendarPartner[]> {
  const connections = await listConnections();
  return connections
    .filter((connection) => talksAutomatically(connection.role) && relationshipFor(connection.role).linkable)
    .map((connection) => ({ name: connection.name, sharing: connection.grants.meals === true }));
}
