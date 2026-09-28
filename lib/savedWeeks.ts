// Save a week of meals and use it again (H6, 2026-09-27).
//
// A week that worked, kept under a name, so next month it can be laid onto
// any week in one step rather than scheduled meal by meal. What is kept is
// each meal's day within the week (0 to 6 from the week's first day), its
// time, meal type, name, the favorite or dish it came from, servings and
// rotation, and which meal in the same week it eats the leftovers of.
//
// Everything here decides; lib/savedWeeksDb.ts reads and writes.
//
// Rules this module holds:
//   - A skipped meal is left out of what is saved: it did not happen, and a
//     week kept for reuse is the week as it was eaten or planned.
//   - A saved week never holds a pointer that can go stale in a way that
//     matters. The meals it creates are ordinary schedule rows with no link
//     back, so removing a saved week touches nothing on the schedule, and a
//     favorite or dish deleted after the week was saved still schedules by
//     its name, said in the summary.
//   - Using a saved week never doubles a meal. A day that already has a
//     breakfast, lunch or dinner keeps it and the saved one is left out; a
//     snack or drink is left out only when the same one is already there.
//   - Days already gone are not filled in, since a planned meal in the past
//     only settles as missed.

import { titleWithoutLeftover } from './leftovers';

export type SavedWeekMeal = {
  // Stable within one saved week; what a leftover's leftoverOfKey names.
  key: string;
  dayOffset: number;
  time: string;
  mealType: string;
  title: string;
  sourceFavoriteId: string | null;
  sourceMealId: string | null;
  servings: number | null;
  rotationSelectionsJson: string | null;
  notes: string | null;
  leftoverOfKey: string | null;
};

export type SavedWeek = {
  id: string;
  name: string;
  createdAt: string;
  meals: SavedWeekMeal[];
};

// What a schedule row needs to carry to be saved. A subset of
// ScheduleItemRecord, so the Meals lens passes its rows straight in.
export type WeekItemForSaving = {
  id: string;
  scheduledFor: string;
  itemType: string;
  mealType: string | null;
  title: string;
  status: string;
  notes: string | null;
  linkedMealId: string | null;
  sourceFavoriteId: string | null;
  sourceMealId: string | null;
  servings: number | null;
  rotationSelectionsJson: string | null;
  leftoverOf: string | null;
  leftoverOfMeal: string | null;
};

export const SAVE_WEEK_LABEL = 'Save this week';
export const USE_SAVED_WEEK_LABEL = 'Use on this week';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Meal types a person commonly has more than one of in a day.
const SEVERAL_A_DAY = new Set(['snack', 'beverage']);

function dateParts(date: string): [number, number, number] {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return [y, m, d];
}

export function addDaysTo(date: string, days: number): string {
  const [y, m, d] = dateParts(date);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

export function dayOffsetIn(weekStart: string, date: string): number {
  const [ay, am, ad] = dateParts(weekStart);
  const [by, bm, bd] = dateParts(date);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

function weekdayOf(date: string): string {
  const [y, m, d] = dateParts(date);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "Week of Sep 21", the name offered when a week is saved. */
export function defaultWeekName(weekStart: string): string {
  const [, m, d] = dateParts(weekStart);
  return `Week of ${MONTHS[m - 1]} ${d}`;
}

/**
 * The week's meals as they would be saved, in day and time order. Skipped
 * meals are left out. A leftover of a meal in the same week keeps that link;
 * a leftover whose meal lies outside the week is saved as the dish itself.
 */
export function mealsForSaving(items: WeekItemForSaving[], weekStart: string): SavedWeekMeal[] {
  const kept = items
    .filter((item) => item.itemType === 'meal' && item.status !== 'skipped')
    .filter((item) => {
      const offset = dayOffsetIn(weekStart, item.scheduledFor);
      return offset >= 0 && offset <= 6;
    })
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const keyOf = new Map(kept.map((item, index) => [item.id, `m${index + 1}`]));
  return kept.map((item) => {
    const cookKey = item.leftoverOf ? (keyOf.get(item.leftoverOf) ?? null) : null;
    // A meal logged with nothing planned behind it can still be scheduled
    // again from what was logged.
    const loggedTemplate = item.status === 'logged' || item.status === 'partial' ? item.linkedMealId : null;
    return {
      key: keyOf.get(item.id) as string,
      dayOffset: dayOffsetIn(weekStart, item.scheduledFor),
      time: (item.scheduledFor.split('T')[1] ?? '12:00').slice(0, 5),
      mealType: item.mealType ?? 'lunch',
      title: cookKey ? item.title : titleWithoutLeftover(item.title),
      sourceFavoriteId: item.sourceFavoriteId,
      sourceMealId: item.sourceFavoriteId ? null : (item.sourceMealId ?? item.leftoverOfMeal ?? loggedTemplate),
      servings: item.servings,
      rotationSelectionsJson: item.rotationSelectionsJson,
      notes: item.notes,
      leftoverOfKey: cookKey,
    };
  });
}

export type ExistingMeal = { date: string; mealType: string | null; title: string; status: string };

export type PlannedFromSavedWeek = {
  key: string;
  scheduledFor: string;
  mealType: string;
  title: string;
  sourceFavoriteId: string | null;
  sourceMealId: string | null;
  servings: number | null;
  rotationSelectionsJson: string | null;
  notes: string | null;
  leftoverOfKey: string | null;
};

export type SavedWeekApplication = {
  create: PlannedFromSavedWeek[];
  alreadyThere: number;
  daysGone: number;
  sourceGone: number;
};

/**
 * What using a saved week on the week starting `weekStart` would add. Pure,
 * so the sheet can say what will happen before anything is written.
 */
export function planSavedWeek(
  meals: SavedWeekMeal[],
  weekStart: string,
  today: string,
  existing: ExistingMeal[],
  stillSaved: { favorites: Set<string>; meals: Set<string> },
): SavedWeekApplication {
  const taken = existing.filter((meal) => meal.status !== 'skipped');
  let alreadyThere = 0;
  let daysGone = 0;
  let sourceGone = 0;
  const create: PlannedFromSavedWeek[] = [];
  for (const meal of [...meals].sort((a, b) => a.dayOffset - b.dayOffset || a.time.localeCompare(b.time))) {
    const date = addDaysTo(weekStart, meal.dayOffset);
    if (date < today) {
      daysGone += 1;
      continue;
    }
    const clash = taken.some(
      (other) =>
        other.date === date &&
        other.mealType === meal.mealType &&
        (!SEVERAL_A_DAY.has(meal.mealType) || titleWithoutLeftover(other.title) === titleWithoutLeftover(meal.title)),
    );
    if (clash) {
      alreadyThere += 1;
      continue;
    }
    const favoriteKept = meal.sourceFavoriteId ? stillSaved.favorites.has(meal.sourceFavoriteId) : false;
    const mealKept = meal.sourceMealId ? stillSaved.meals.has(meal.sourceMealId) : false;
    if ((meal.sourceFavoriteId && !favoriteKept) || (meal.sourceMealId && !mealKept)) sourceGone += 1;
    create.push({
      key: meal.key,
      scheduledFor: `${date}T${meal.time}`,
      mealType: meal.mealType,
      title: meal.title,
      sourceFavoriteId: favoriteKept ? meal.sourceFavoriteId : null,
      sourceMealId: mealKept ? meal.sourceMealId : null,
      servings: meal.servings,
      rotationSelectionsJson: favoriteKept ? meal.rotationSelectionsJson : null,
      notes: meal.notes,
      leftoverOfKey: meal.leftoverOfKey,
    });
  }
  // A leftover whose cooking is not being added this time is scheduled as
  // the dish itself, never as leftovers of nothing.
  const added = new Set(create.map((meal) => meal.key));
  for (const meal of create) {
    if (meal.leftoverOfKey && !added.has(meal.leftoverOfKey)) {
      meal.leftoverOfKey = null;
      meal.title = titleWithoutLeftover(meal.title);
    }
  }
  return { create, alreadyThere, daysGone, sourceGone };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "12 meals over 5 days", under a saved week's name. */
export function describeSavedWeek(meals: SavedWeekMeal[]): string {
  if (meals.length === 0) return 'No meals';
  const days = new Set(meals.map((meal) => meal.dayOffset)).size;
  return `${plural(meals.length, 'meal', 'meals')} over ${plural(days, 'day', 'days')}`;
}

/** Which weekdays a saved week covers, in the week's order. */
export function savedWeekDays(meals: SavedWeekMeal[], weekStart: string): string {
  const offsets = [...new Set(meals.map((meal) => meal.dayOffset))].sort((a, b) => a - b);
  return offsets.map((offset) => weekdayOf(addDaysTo(weekStart, offset))).join(', ');
}

export function savedWeekMessage(name: string, count: number): string {
  if (count === 0) return 'This week has no meals planned or eaten yet, so there is nothing to save.';
  return `Saved ${plural(count, 'meal', 'meals')} as "${name}". Skipped meals were left out.`;
}

/** The sentence under Use on this week, before anything is written. */
export function savedWeekPreview(plan: SavedWeekApplication): string {
  const parts = [`Adds ${plural(plan.create.length, 'meal', 'meals')} to this week.`];
  if (plan.alreadyThere > 0) {
    parts.push(`${plural(plan.alreadyThere, 'meal is', 'meals are')} left out because that day already has one of that kind planned.`);
  }
  if (plan.daysGone > 0) parts.push(`${plural(plan.daysGone, 'meal falls', 'meals fall')} on a day already gone and ${plan.daysGone === 1 ? 'is' : 'are'} left out.`);
  if (plan.sourceGone > 0) {
    parts.push(
      `${plural(plan.sourceGone, 'dish is', 'dishes are')} no longer saved, so ${plan.sourceGone === 1 ? 'it goes' : 'they go'} on by name only and logging ${plan.sourceGone === 1 ? 'it starts' : 'them starts'} from a blank meal.`,
    );
  }
  return parts.join(' ');
}

export function savedWeekApplied(count: number): string {
  if (count === 0) return 'Nothing was added: every meal in it is already covered or falls on a day already gone.';
  return `Added ${plural(count, 'meal', 'meals')}. Each one is now a separate meal, so changing or removing it leaves the saved week as it is.`;
}

export function removeSavedWeekMessage(name: string): string {
  return `Removes "${name}" from your saved weeks. Meals already scheduled from it stay on the schedule.`;
}
