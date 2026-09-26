// The meal plan as a record of curated recipes, for sending and for holding
// what a partner sent.
//
// WHY THIS EXISTS AT ALL. lib/partnerSync.ts has always had a place for a plan
// in its payload and every caller passed an empty array, so the one thing two
// people most obviously want to share was the one thing that never travelled.
// The reason was not the transport: it was that nothing on this phone could
// answer "which curated recipes are on my schedule?". scheduleMealPlanSlot
// resolves a slot's curated recipes into saved dishes and keeps the
// ingredients, the steps and the name, but not the recipe id it came from.
//
// So the fix is a record written at the moment a plan is scheduled
// (recordMealPlanSlot, in lib/db.ts, because that is where the scheduling
// happens) and read back here. Reconstructing the pointer afterwards by
// matching a dish name against curated_recipes would be guessing, and a plan
// that resolves to the wrong dish on somebody else's phone is worse than
// sending no plan at all.
//
// WHY THE TWO HALVES DO NOT SHARE A TABLE. meal_plan_slots is what this person
// scheduled. partner_meal_plan_slots is a copy of something another person
// owns, which never becomes a scheduled meal here. Keeping both in one table
// with an owner column would put exactly one WHERE clause between a partner's
// dinner and somebody's own schedule.
import { addDaysToLocalDate, getDatabase } from './db';

/** One day's slots, as curated recipe ids. Matches SyncPlanDay structurally. */
export type PlannedDayRecipes = {
  /** YYYY-MM-DD. */
  date: string;
  slots: { slot: 'breakfast' | 'lunch' | 'dinner'; recipeIds: string[] }[];
};

/** How much of the plan a send carries. Two weeks forward, from today. */
export const SYNC_PLAN_DAYS = 14;

/** The same UTC-midnight reading of "today" addDaysToLocalDate works in. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseRecipeIds(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return [];
  }
}

const SLOT_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2 };

type PlanRow = { date: string; meal_type: string; recipe_ids_json: string };

/**
 * Rows to days, dropping anything that cannot be trusted rather than repairing
 * it. These rows are read back on the sending side and, for a partner's plan,
 * originated on another device, so an unknown meal type or an empty recipe list
 * is skipped instead of guessed at.
 */
function toPlannedDays(rows: readonly PlanRow[]): PlannedDayRecipes[] {
  const byDate = new Map<string, PlannedDayRecipes>();
  for (const row of rows) {
    if (row.meal_type !== 'breakfast' && row.meal_type !== 'lunch' && row.meal_type !== 'dinner') {
      continue;
    }
    const recipeIds = parseRecipeIds(row.recipe_ids_json);
    if (recipeIds.length === 0) continue;
    let day = byDate.get(row.date);
    if (!day) {
      day = { date: row.date, slots: [] };
      byDate.set(row.date, day);
    }
    day.slots.push({ slot: row.meal_type, recipeIds });
  }
  const days = [...byDate.values()];
  for (const day of days) {
    day.slots.sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]);
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * The plan to send a partner: what is still actually scheduled, from today on.
 *
 * THE JOIN ONTO schedule_items IS THE POINT. meal_plan_slots records what was
 * scheduled and never revises itself, so reading it alone would keep offering a
 * partner a dinner that has since been deleted, eaten, or skipped. Joining
 * through schedule_item_id and requiring status 'planned' means the record stays
 * a record while what gets SENT is only what is still true, with no cleanup code
 * anywhere and nothing to forget to call.
 *
 * Bounded at both ends on purpose. Nothing before today, because a partner has
 * no use for a week that already happened. Nothing past SYNC_PLAN_DAYS, because
 * a six-week plan would make every send forty times larger to say something
 * neither person is looking at yet.
 */
export async function getMealPlanForSync(options?: {
  fromDate?: string;
  days?: number;
}): Promise<PlannedDayRecipes[]> {
  const db = await getDatabase();
  const from = options?.fromDate ?? today();
  const span = options?.days ?? SYNC_PLAN_DAYS;
  const through = addDaysToLocalDate(from, Math.max(0, span - 1));
  const rows = await db.getAllAsync<PlanRow>(
    `SELECT s.date AS date, s.meal_type AS meal_type, s.recipe_ids_json AS recipe_ids_json
       FROM meal_plan_slots s
       JOIN schedule_items i ON i.id = s.schedule_item_id
      WHERE s.date >= ? AND s.date <= ?
        AND i.item_type = 'meal' AND i.status = 'planned'
      ORDER BY s.date ASC`,
    from,
    through,
  );
  return toPlannedDays(rows);
}

/**
 * Stores the plan a partner sent, replacing whatever they sent before.
 *
 * Replace rather than merge, for the same reason setPartnerConditionCodes
 * replaces their condition list: their latest send is their current plan, and a
 * day they took out has to be able to disappear here too. Delete and insert
 * inside one transaction, so a failure halfway cannot leave somebody looking at
 * half of last week and half of this one.
 */
export async function setPartnerMealPlan(
  connectionId: string,
  days: readonly PlannedDayRecipes[],
  sentAt: string,
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM partner_meal_plan_slots WHERE connection_id = ?', connectionId);
    for (const day of days) {
      for (const slot of day.slots) {
        const recipeIds = slot.recipeIds.filter(
          (id) => typeof id === 'string' && id.trim().length > 0,
        );
        if (recipeIds.length === 0) continue;
        await db.runAsync(
          `INSERT INTO partner_meal_plan_slots
             (id, connection_id, date, meal_type, recipe_ids_json, sent_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          `pplan_${connectionId}_${day.date}_${slot.slot}`,
          connectionId,
          day.date,
          slot.slot,
          JSON.stringify(recipeIds),
          sentAt,
        );
      }
    }
  });
}

export type PartnerMealPlan = {
  days: PlannedDayRecipes[];
  /** When they sent it, so a screen can say how fresh it is. */
  sentAt: string | null;
};

/**
 * What a partner last sent, from today forward.
 *
 * Past days are filtered on the way out rather than deleted on arrival. A plan
 * is stored exactly as it was sent, and what counts as past depends on when
 * somebody looks, not on when it landed.
 */
export async function getPartnerMealPlan(connectionId: string): Promise<PartnerMealPlan> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlanRow & { sent_at: string }>(
    `SELECT date, meal_type, recipe_ids_json, sent_at
       FROM partner_meal_plan_slots
      WHERE connection_id = ? AND date >= ?
      ORDER BY date ASC`,
    connectionId,
    today(),
  );
  return { days: toPlannedDays(rows), sentAt: rows[0]?.sent_at ?? null };
}

export type NamedPlanDay = {
  date: string;
  slots: { slot: 'breakfast' | 'lunch' | 'dinner'; names: string[] }[];
};

export type PartnerMealPlanNamed = {
  days: NamedPlanDay[];
  sentAt: string | null;
  /**
   * Dishes this phone could not name. Reported rather than hidden, because the
   * two apps can be on different versions and a day that quietly shows two of
   * its three meals looks like a partner who skipped lunch.
   */
  unknown: number;
  /** Every dish this phone could name, once each, for the photos their
   *  phone sends beside the plan (components/PeerDishPhotos.tsx). */
  dishes: { id: string; name: string }[];
};

/**
 * A partner's plan with the dish names filled in, for showing on a screen.
 *
 * The ids travel, not the names, because a name is 40 bytes of something both
 * phones already have and an id survives somebody renaming a dish. Resolving
 * them here is one query for the whole plan rather than one per meal.
 */
export async function getPartnerMealPlanNamed(connectionId: string): Promise<PartnerMealPlanNamed> {
  const plan = await getPartnerMealPlan(connectionId);
  const ids = [...new Set(plan.days.flatMap((day) => day.slots.flatMap((slot) => slot.recipeIds)))];
  if (ids.length === 0) return { days: [], sentAt: plan.sentAt, unknown: 0, dishes: [] };

  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name FROM curated_recipes WHERE id IN (${placeholders})`,
    ...ids,
  );
  const names = new Map(rows.map((row) => [row.id, row.name]));

  let unknown = 0;
  const days: NamedPlanDay[] = [];
  for (const day of plan.days) {
    const slots: NamedPlanDay['slots'] = [];
    for (const slot of day.slots) {
      const resolved: string[] = [];
      for (const id of slot.recipeIds) {
        const name = names.get(id);
        if (name) resolved.push(name);
        else unknown += 1;
      }
      if (resolved.length > 0) slots.push({ slot: slot.slot, names: resolved });
    }
    if (slots.length > 0) days.push({ date: day.date, slots });
  }
  const dishes = ids.flatMap((id) => {
    const name = names.get(id);
    return name ? [{ id, name }] : [];
  });
  return { days, sentAt: plan.sentAt, unknown, dishes };
}

/** Drops a partner's plan. Called when the connection itself goes. */
export async function clearPartnerMealPlan(connectionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM partner_meal_plan_slots WHERE connection_id = ?', connectionId);
}
