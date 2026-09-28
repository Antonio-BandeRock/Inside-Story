// The database half of Pack for tomorrow (2026-09-27). The pure half, the
// choices, the reminder times and every sentence, is lib/mealPack.ts.
//
// Reading never writes. Every write is the person's own tap: choosing
// tomorrow's meal, clearing it, setting the reminder to make it, and saying
// they had it or had something else.
import {
  deleteMeal,
  deleteScheduledMeal,
  getDatabase,
  getMealPlanTimes,
  listScheduledMealsForDate,
  markScheduledMealLogged,
  scheduleMeal,
  scheduleReminder,
  setScheduledMealSkipped,
} from './db';
import {
  addDays,
  packRowFor,
  prepReminderTitle,
  tomorrowSlots,
  type MealPack,
  type MealPackSource,
  type PackChoice,
  type TomorrowSlot,
} from './mealPack';
import { syncReminderNotifications } from './reminderNotifications';
import type { UsualMeal, UsualSlot } from './usualMeal';
import { getOpenMealRules, listUsualMeals, logUsualMeal, type UsualMealLogResult } from './usualMealDb';

type MealPackRow = {
  id: string;
  date: string;
  meal_type: string;
  kind: string;
  source: string;
  usual_meal_id: string | null;
  favorite_id: string | null;
  source_meal_id: string | null;
  name: string;
  place: string | null;
  foods_json: string | null;
  schedule_item_id: string | null;
  prep_reminder_id: string | null;
  prep_at: string | null;
  created_at: string;
  schedule_status: string | null;
  reminder_status: string | null;
};

function foodsOf(json: string | null): string[] {
  try {
    const parsed = JSON.parse(json ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((food): food is string => typeof food === 'string') : [];
  } catch {
    return [];
  }
}

function newId(): string {
  return `pack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Every pack from one day to another. A pack whose scheduled meal was
// removed from Schedules is no longer a choice and is left out; where two
// devices chose for the same meal, the newer choice is the one kept.
export async function listPacksBetween(from: string, to: string): Promise<MealPack[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MealPackRow>(
    `SELECT p.id, p.date, p.meal_type, p.kind, p.source, p.usual_meal_id, p.favorite_id, p.source_meal_id, p.name,
            p.place, p.foods_json, p.schedule_item_id, p.prep_reminder_id, p.prep_at, p.created_at,
            s.status AS schedule_status, r.status AS reminder_status
       FROM meal_packs p
       LEFT JOIN schedule_items s ON s.id = p.schedule_item_id
       LEFT JOIN schedule_items r ON r.id = p.prep_reminder_id
      WHERE p.date >= ? AND p.date <= ?
      ORDER BY p.created_at DESC`,
    from,
    to,
  );
  const seen = new Set<string>();
  const packs: MealPack[] = [];
  for (const row of rows) {
    if (!row.schedule_status) continue;
    const key = `${row.date}:${row.meal_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    packs.push({
      id: row.id,
      date: row.date,
      mealType: row.meal_type as UsualSlot,
      kind: row.kind === 'out' ? 'out' : 'home',
      source: row.source as MealPackSource,
      usualMealId: row.usual_meal_id,
      favoriteId: row.favorite_id,
      sourceMealId: row.source_meal_id,
      name: row.name,
      place: row.place,
      foods: foodsOf(row.foods_json),
      scheduleItemId: row.schedule_item_id,
      prepReminderId: row.reminder_status ? row.prep_reminder_id : null,
      prepAt: row.reminder_status ? row.prep_at : null,
      status: row.schedule_status === 'logged' ? 'logged' : row.schedule_status === 'skipped' ? 'skipped' : 'planned',
    });
  }
  return packs;
}

// Tomorrow's meals that are open or standing and not planned. anyTime shows
// them whatever the hour, for the Your Usual Meals screen.
export async function getTomorrowSlots(today: string, nowTime: string, anyTime = false): Promise<TomorrowSlot[]> {
  const tomorrow = addDays(today, 1);
  const [openRules, usualMeals, scheduled, packsTomorrow] = await Promise.all([
    getOpenMealRules(),
    listUsualMeals(),
    listScheduledMealsForDate(tomorrow),
    listPacksBetween(tomorrow, tomorrow),
  ]);
  const packItems = new Set(packsTomorrow.map((pack) => pack.scheduleItemId).filter(Boolean));
  return tomorrowSlots({
    today,
    nowTime,
    anyTime,
    openRules,
    usualMeals,
    plannedTomorrow: scheduled
      .filter((item) => item.status !== 'skipped' && item.mealType && !packItems.has(item.id))
      .map((item) => item.mealType as string),
    packsTomorrow,
  });
}

// The dinner logged on this day, for "Tonight's leftovers".
export async function getTonightsDinner(today: string): Promise<{ id: string; name: string } | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string; name: string }>(
    `SELECT id, name FROM meals WHERE meal_type = 'dinner' AND substr(eaten_at, 1, 10) = ? ORDER BY eaten_at DESC LIMIT 1`,
    today,
  );
  return row ?? null;
}

async function removePack(db: Awaited<ReturnType<typeof getDatabase>>, id: string): Promise<void> {
  const row = await db.getFirstAsync<{ schedule_item_id: string | null; prep_reminder_id: string | null }>(
    'SELECT schedule_item_id, prep_reminder_id FROM meal_packs WHERE id = ?',
    id,
  );
  if (!row) return;
  if (row.schedule_item_id) {
    const item = await db.getFirstAsync<{ status: string }>('SELECT status FROM schedule_items WHERE id = ?', row.schedule_item_id);
    // A meal already logged from it stays on the schedule as the record.
    if (item && item.status !== 'logged') await deleteScheduledMeal(row.schedule_item_id);
  }
  if (row.prep_reminder_id) await deleteScheduledMeal(row.prep_reminder_id);
  await db.runAsync('DELETE FROM meal_packs WHERE id = ?', id);
}

// Chooses what a meal will be on a day. Anything chosen before for the same
// meal and day is cleared first, reminder included.
export async function packMeal(date: string, mealType: UsualSlot, choice: PackChoice): Promise<string> {
  const db = await getDatabase();
  const earlier = await db.getAllAsync<{ id: string }>('SELECT id FROM meal_packs WHERE date = ? AND meal_type = ?', date, mealType);
  for (const row of earlier) await removePack(db, row.id);

  const row = packRowFor(choice);
  const times = await getMealPlanTimes();
  const scheduleItemId = await scheduleMeal({
    title: row.name,
    mealType,
    scheduledFor: `${date}T${times[mealType]}`,
    notes: row.scheduleNotes,
    sourceFavoriteId: row.scheduleFavoriteId ?? undefined,
    sourceMealId: row.scheduleMealId ?? undefined,
  });
  const id = newId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO meal_packs (id, date, meal_type, kind, source, usual_meal_id, favorite_id, source_meal_id, name, place, foods_json,
                             schedule_item_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    date,
    mealType,
    row.kind,
    row.source,
    row.usualMealId,
    row.favoriteId,
    row.sourceMealId,
    row.name,
    row.place,
    JSON.stringify(row.foods),
    scheduleItemId,
    now,
    now,
  );
  return id;
}

export async function unpackMeal(id: string): Promise<void> {
  const db = await getDatabase();
  await removePack(db, id);
  await syncReminderNotifications().catch(() => undefined);
}

// Sets, moves or clears the reminder to make a packed meal.
export async function setPackPrepReminder(pack: MealPack, scheduledFor: string | null): Promise<void> {
  const db = await getDatabase();
  if (pack.prepReminderId) await deleteScheduledMeal(pack.prepReminderId);
  let reminderId: string | null = null;
  if (scheduledFor) {
    reminderId = await scheduleReminder({ title: prepReminderTitle(pack.mealType, pack.name), scheduledFor });
  }
  await db.runAsync(
    'UPDATE meal_packs SET prep_reminder_id = ?, prep_at = ?, updated_at = ? WHERE id = ?',
    reminderId,
    scheduledFor,
    new Date().toISOString(),
    pack.id,
  );
  await syncReminderNotifications().catch(() => undefined);
}

// The packed meal as a usual meal, so logging it goes through the one path
// that already knows saved meals, copies, leftovers and typed foods.
async function asUsualMeal(pack: MealPack): Promise<UsualMeal> {
  if (pack.source === 'usual' && pack.usualMealId) {
    const usual = (await listUsualMeals()).find((meal) => meal.id === pack.usualMealId);
    if (usual) return { ...usual, mealType: pack.mealType };
  }
  const source =
    pack.source === 'leftovers'
      ? 'leftovers'
      : pack.favoriteId
        ? 'favorite'
        : pack.sourceMealId
          ? 'meal'
          : 'typed';
  return {
    id: pack.usualMealId ?? pack.id,
    mealType: pack.mealType,
    kind: pack.kind,
    source,
    name: pack.name,
    favoriteId: pack.favoriteId,
    sourceMealId: pack.sourceMealId,
    place: pack.place,
    foods: pack.foods,
    lastUsedAt: null,
    createdAt: '',
    standingWeekdays: [],
  };
}

export async function logPackedMeal(pack: MealPack, eatenAt: string): Promise<UsualMealLogResult> {
  const result = await logUsualMeal(await asUsualMeal(pack), eatenAt);
  if ('error' in result) return result;
  if (pack.scheduleItemId) await markScheduledMealLogged(pack.scheduleItemId, result.id);
  return result;
}

export async function undoPackedMeal(pack: MealPack, mealId: string): Promise<void> {
  await deleteMeal(mealId);
  if (!pack.scheduleItemId) return;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET status = 'planned', linked_meal_id = NULL, updated_at = ? WHERE id = ?`,
    new Date().toISOString(),
    pack.scheduleItemId,
  );
}

// "Had something else": the choice stays as a record of what was meant, and
// the usual list comes back for what was eaten.
export async function skipPackedMeal(pack: MealPack): Promise<void> {
  if (pack.scheduleItemId) await setScheduledMealSkipped(pack.scheduleItemId, true);
}
