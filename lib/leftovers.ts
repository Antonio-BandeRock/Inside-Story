// Leftovers and batch cooking on the schedule (H3 of the competitive build
// plan, 2026-09-27). A planned meal can be eaten again at later meals: each
// later meal is a schedule_items row of its own whose `leftover_of` names
// the meal where the food is cooked. So the day still reads as the meals
// somebody eats, while the Grocery List buys once: the cooked meal counts
// its planned leftovers into how much to buy, and a leftover row buys
// nothing while its cooking is still coming or has been logged.
//
// NEVER ORPHANED. Removing the cooked meal either removes its leftovers too
// or keeps them as separate meals, restoring the dish's name; a leftover
// whose cooking was skipped, or has passed without being logged, is bought
// for by itself, so nothing goes unbought.
//
// HOW LONG. The later meals offered run a week past the cooking. Past four
// days each line cites the USDA's guidance on refrigerated leftovers and
// says so once; nothing is refused, since freezing is the person's call.
//
// Pure, with no React and no database, so scripts/test_leftovers.js checks
// it without a phone.

export const LEFTOVER_PREFIX = 'Leftovers';

export function leftoverTitle(cookTitle: string): string {
  const name = cookTitle.trim();
  return name.startsWith(`${LEFTOVER_PREFIX}: `) ? name : `${LEFTOVER_PREFIX}: ${name}`;
}

/** The dish's name back, for a leftover kept as a meal of its own. */
export function titleWithoutLeftover(title: string): string {
  const prefix = `${LEFTOVER_PREFIX}: `;
  return title.startsWith(prefix) ? title.slice(prefix.length) : title;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: string, days: number): string {
  const out = parseDate(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

function dayName(date: string): string {
  return WEEKDAYS[parseDate(date).getUTCDay()];
}

function shortDate(date: string): string {
  const d = parseDate(date);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Days past cooking after which the USDA line is added. */
export const USDA_FRIDGE_DAYS = 4;
/** How far past cooking a later meal can be picked. */
export const EAT_AGAIN_MAX_DAYS = 7;

export const USDA_NOTE =
  "The USDA's guidance is to eat refrigerated leftovers within 3 to 4 days, or to freeze them for later.";

export type DayChoice = { date: string; label: string };

/** The cooking day and the week after it, each named. */
export function eatAgainDayChoices(cookDate: string): DayChoice[] {
  const out: DayChoice[] = [];
  for (let offset = 0; offset <= EAT_AGAIN_MAX_DAYS; offset += 1) {
    const date = addDays(cookDate, offset);
    const when = offset === 0 ? 'Same day' : offset === 1 ? 'Next day' : `${offset} days later`;
    const past = offset > USDA_FRIDGE_DAYS ? ', past 4 days' : '';
    out.push({ date, label: `${when}, ${dayName(date)} ${shortDate(date)}${past}` });
  }
  return out;
}

export const EAT_AGAIN_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export type Slot = { scheduledFor: string; mealType: string };

/**
 * Why a later meal cannot be added, or null. Only the plain facts: it has
 * to come after the cooking, and one meal slot holds the leftover once.
 */
export function eatAgainProblem(cook: Slot, slot: Slot, existing: Slot[]): string | null {
  if (slot.scheduledFor <= cook.scheduledFor) return 'Pick a meal after the one where it is cooked.';
  if (daysBetween(cook.scheduledFor, slot.scheduledFor) > EAT_AGAIN_MAX_DAYS) return 'Pick a meal within a week of the cooking.';
  const clash = existing.some((other) => other.scheduledFor.slice(0, 10) === slot.scheduledFor.slice(0, 10) && other.mealType === slot.mealType);
  if (clash) return 'These leftovers are already planned at that meal.';
  return null;
}

// --- The Grocery List ------------------------------------------------------------

/**
 * Whether a leftover row buys its own food: only when there is no cooking
 * left to buy it. `cookStatus` null means the cooked meal is gone.
 */
export function leftoverBuysOnItsOwn(cookStatus: string | null, cookDate: string | null, windowStart: string): boolean {
  if (cookStatus == null || cookDate == null) return true;
  if (cookStatus === 'skipped') return true;
  if (cookStatus === 'planned') return cookDate.slice(0, 10) < windowStart;
  return false;
}

/** How many servings' worth the cooked meal buys: its own and each planned leftover's. */
export function cookedShoppingFactor(ownFactor: number, leftoverFactors: number[]): number {
  return leftoverFactors.reduce((sum, factor) => sum + factor, ownFactor);
}

// --- What a row says ----------------------------------------------------------------

function mealWord(mealType: string | null): string {
  return mealType && mealType.trim() ? mealType : 'meal';
}

/** On the cooked meal's row. */
export function cookCaption(leftoverCount: number): string | null {
  if (leftoverCount <= 0) return null;
  return `Cooked once for ${leftoverCount + 1} meals`;
}

/** On a leftover's row, relative to the day it sits on. */
export function leftoverCaption(cook: { scheduledFor: string; mealType: string | null; status: string } | null, onDate: string): string {
  if (!cook) return 'Leftovers';
  const gap = daysBetween(cook.scheduledFor, onDate);
  const when = gap === 0 ? `today's ${mealWord(cook.mealType)}` : gap === 1 ? `yesterday's ${mealWord(cook.mealType)}` : `${dayName(cook.scheduledFor)}'s ${mealWord(cook.mealType)}`;
  const tail = gap > USDA_FRIDGE_DAYS ? ', more than 4 days after' : '';
  if (cook.status === 'skipped') return `From ${when}, which was skipped, so the Grocery List buys for this meal`;
  return `From ${when}${tail}`;
}

export function eatAgainIntro(title: string): string {
  return `Pick a later meal to eat "${title}" again. It shows on your schedule at that meal, and the Grocery List buys for every meal it covers when it buys for the cooking.`;
}

export function eatAgainAdded(slotLabel: string, gapDays: number): string {
  const base = `Added at ${slotLabel}.`;
  return gapDays > USDA_FRIDGE_DAYS ? `${base} ${USDA_NOTE}` : base;
}

// --- Removing the cooked meal -------------------------------------------------------

export function removeCookMessage(title: string, leftoverCount: number): string {
  const n = leftoverCount === 1 ? '1 later meal eats' : `${leftoverCount} later meals eat`;
  return `${n} leftovers of "${title}". Remove ${leftoverCount === 1 ? 'it' : 'them'} too, or keep ${leftoverCount === 1 ? 'it as a separate meal' : 'them as separate meals'}, which the Grocery List then buys for?`;
}

export const REMOVE_WITH_LEFTOVERS = 'Remove with its leftovers';
export const REMOVE_KEEP_LEFTOVERS = 'Remove, keep the later meals';

/** A time for a later meal when the person set no usual time for it. */
export function defaultMealTime(mealType: string): string {
  switch (mealType) {
    case 'breakfast':
      return '08:00';
    case 'lunch':
      return '12:30';
    case 'snack':
      return '15:30';
    default:
      return '18:30';
  }
}
