// Best days beside worst days, F4 of the competitive build plan (Phase 2,
// 2026-09-26). Pattern Finder counts what came in the hours before each
// flare; this counts whole days instead. A worst day is a day with a flare
// or reaction logged at 6 or more out of 10 (Severe or Very severe on the
// named steps). A best day is a day with meals logged and no flare or
// reaction at all. A day whose flares were all milder than that is left
// out of both, and the summary says how many were. Each food is then
// counted on both kinds of day, so a food somebody eats nearly every day
// shows up on both sides with its counts, rather than looking like a find.
// Counts only: nothing here says a food brought on or kept away a flare.
// Pure, so scripts/test_best_worst_days.js can check it without a phone.

export const WORST_DAY_FROM = 6;
export const MIN_DAYS_EACH = 2;
export const MIN_DAYS_FOR_FOOD = 2;
export const FOODS_LISTED = 8;

export type DayFoods = { day: string; foods: string[] };
export type DayFlare = { day: string; onTen: number | null };
export type FoodDayCount = { key: string; worst: number; best: number };

export type BestWorstResult = {
  worstDays: number;
  bestDays: number;
  milderDays: number;
  /** Foods turning up more often on worst days than on best days. */
  onWorst: FoodDayCount[];
  /** Foods turning up more often on best days than on worst days. */
  onBest: FoodDayCount[];
};

export function bestWorstDays(meals: DayFoods[], flares: DayFlare[]): BestWorstResult {
  const worst = new Set<string>();
  const flareDays = new Set<string>();
  for (const flare of flares) {
    flareDays.add(flare.day);
    if (flare.onTen !== null && flare.onTen >= WORST_DAY_FROM) worst.add(flare.day);
  }
  const foodsByDay = new Map<string, Set<string>>();
  for (const meal of meals) {
    const set = foodsByDay.get(meal.day) ?? new Set<string>();
    for (const food of meal.foods) set.add(food);
    foodsByDay.set(meal.day, set);
  }
  const best = new Set<string>();
  for (const day of foodsByDay.keys()) if (!flareDays.has(day)) best.add(day);
  // A worst day with no meals logged has nothing to count, so it is not one.
  const worstWithMeals = new Set([...worst].filter((day) => foodsByDay.has(day)));
  let milderDays = 0;
  for (const day of flareDays) if (!worst.has(day) && foodsByDay.has(day)) milderDays += 1;

  const counts = new Map<string, FoodDayCount>();
  const bump = (days: Set<string>, side: 'worst' | 'best') => {
    for (const day of days) {
      for (const food of foodsByDay.get(day) ?? []) {
        const entry = counts.get(food) ?? { key: food, worst: 0, best: 0 };
        entry[side] += 1;
        counts.set(food, entry);
      }
    }
  };
  bump(worstWithMeals, 'worst');
  bump(best, 'best');

  const result: BestWorstResult = { worstDays: worstWithMeals.size, bestDays: best.size, milderDays, onWorst: [], onBest: [] };
  if (worstWithMeals.size < MIN_DAYS_EACH || best.size < MIN_DAYS_EACH) return result;

  // Ordered by how much larger a share of one kind of day the food was on
  // than of the other, so an everyday food sits low rather than on top.
  const gap = (entry: FoodDayCount) => entry.worst / worstWithMeals.size - entry.best / best.size;
  const all = [...counts.values()];
  result.onWorst = all
    .filter((entry) => entry.worst >= MIN_DAYS_FOR_FOOD && gap(entry) > 0)
    .sort((a, b) => gap(b) - gap(a) || b.worst - a.worst || a.key.localeCompare(b.key))
    .slice(0, FOODS_LISTED);
  result.onBest = all
    .filter((entry) => entry.best >= MIN_DAYS_FOR_FOOD && gap(entry) < 0)
    .sort((a, b) => gap(a) - gap(b) || b.best - a.best || a.key.localeCompare(b.key))
    .slice(0, FOODS_LISTED);
  return result;
}

function days(n: number): string {
  return n === 1 ? '1 day' : `${n} days`;
}

export function bestWorstSummary(result: BestWorstResult): string {
  const milder =
    result.milderDays > 0
      ? ` ${days(result.milderDays)} with only milder flares or reactions ${result.milderDays === 1 ? 'is' : 'are'} left out of both.`
      : '';
  return `Worst days are the ${days(result.worstDays)} with a flare or reaction at ${WORST_DAY_FROM} or more out of 10 and meals logged. Best days are the ${days(result.bestDays)} with meals logged and no flare or reaction.${milder}`;
}

export function bestWorstRefusal(result: BestWorstResult): string | null {
  if (result.worstDays >= MIN_DAYS_EACH && result.bestDays >= MIN_DAYS_EACH) return null;
  return `This needs at least ${MIN_DAYS_EACH} of each kind of day with meals logged. So far there ${result.worstDays === 1 ? 'is' : 'are'} ${result.worstDays} worst and ${result.bestDays} best.`;
}

export function foodDaysSentence(entry: FoodDayCount, result: BestWorstResult): string {
  return `Eaten on ${entry.worst} of ${result.worstDays} worst days and ${entry.best} of ${result.bestDays} best days.`;
}

export const BEST_WORST_CAVEAT =
  'A food counts for a day whether it was eaten before or after the flare, and a day is one sample among many things that happened in it. These are counts to look at, never an explanation.';

export const NOTHING_LEANS = 'No food turned up on one kind of day more than the other on at least 2 days.';
