// Variety read at the level of whole meals (2026-09-27), the third part of
// the usual-meals rework. lib/eatingVariety.ts counts foods; this counts
// meals: which meals came back most, where each one came from (made at
// home, mostly out of a package, eaten out), whether it came from the plan,
// which food groups never turned up, and which plants a person used to eat
// and has not eaten lately.
//
// It feeds two places from one set of numbers: the line under a usual meal
// on Home, and the Eating Variety report with its shorter section in the
// Nutritionist and Looking Back reports. The database half is
// lib/mealVarietyDb.ts, and scripts/test_meal_variety.js covers this file.
//
// Repeating a meal is never called wrong here. A count is said as a count,
// a week with nothing logged is a gap rather than a zero, and a food a
// person has not eaten lately is offered, never prescribed.
import {
  addDays,
  buildWeeks,
  describeWeek,
  isPlantCategory,
  plantIdentity,
  shortDate,
  summarizeDistinctFoods,
  summarizeDistinctPlants,
  summarizeGutFoods,
  summarizeRotation,
  type DistinctFoodsResult,
  type GutFoodResult,
  type PlantsResult,
  type RotationResult,
  type VarietyFoodRecord,
  type VarietyInputs,
} from './eatingVariety';

export type VarietyMeal = {
  id: string;
  date: string; // 'YYYY-MM-DD', local
  mealType: string | null;
  name: string;
  // Marked eaten out, or its notes start with "Eaten out." (lib/eatenOut.ts).
  eatenOut: boolean;
  // A scheduled meal was marked logged with this meal, so it came from the
  // plan or from a meal chosen ahead (Pack for tomorrow).
  planned: boolean;
};

export type MealSource = 'home' | 'packaged' | 'out' | 'unknown';

export const MEAL_SOURCE_LABELS: Record<MealSource, string> = {
  home: 'Made at home',
  packaged: 'Mostly from a package',
  out: 'Eaten out',
  unknown: 'Could not tell',
};

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const SLOT_PLURAL: Record<string, string> = {
  breakfast: 'Breakfasts',
  lunch: 'Lunches',
  dinner: 'Dinners',
  snack: 'Snacks',
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function roundShare(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function slotPlural(slot: string | null): string {
  return (slot && SLOT_PLURAL[slot]) || 'Other meals';
}

/** Every food entry, grouped under the meal it came from. */
export function groupRecordsByMeal(records: VarietyFoodRecord[]): Map<string, VarietyFoodRecord[]> {
  const byMeal = new Map<string, VarietyFoodRecord[]>();
  for (const record of records) {
    if (!record.mealId) continue;
    const list = byMeal.get(record.mealId);
    if (list) list.push(record);
    else byMeal.set(record.mealId, [record]);
  }
  return byMeal;
}

/**
 * Where a meal came from. Eaten out is what the person said. Otherwise a
 * meal counts as mostly from a package when at least half of what could be
 * placed was bought ready, so a home-cooked dinner with a jar of sauce in it
 * stays home-made. A meal nothing in could be placed says so.
 */
export function mealSource(meal: VarietyMeal, items: VarietyFoodRecord[]): MealSource {
  if (meal.eatenOut) return 'out';
  const bought = items.filter((item) => item.packaged === 'bought').length;
  const home = items.filter((item) => item.packaged === 'home').length;
  if (bought + home === 0) return 'unknown';
  return bought * 2 >= bought + home ? 'packaged' : 'home';
}

// ---------------------------------------------------------------------------
// Where meals came from, by meal of the day
// ---------------------------------------------------------------------------

export type MealSourceRow = { slot: string; label: string; counts: Record<MealSource, number>; total: number };

export type MealSourcesResult = { rows: MealSourceRow[]; totals: Record<MealSource, number>; total: number; headline: string };

export function summarizeMealSources(meals: VarietyMeal[], byMeal: Map<string, VarietyFoodRecord[]>): MealSourcesResult {
  const empty = (): Record<MealSource, number> => ({ home: 0, packaged: 0, out: 0, unknown: 0 });
  const bySlot = new Map<string, Record<MealSource, number>>();
  const totals = empty();
  for (const meal of meals) {
    const slot = meal.mealType && SLOT_PLURAL[meal.mealType] ? meal.mealType : 'other';
    const source = mealSource(meal, byMeal.get(meal.id) ?? []);
    const counts = bySlot.get(slot) ?? empty();
    counts[source] += 1;
    bySlot.set(slot, counts);
    totals[source] += 1;
  }
  const order = [...SLOT_ORDER, 'other'];
  const rows: MealSourceRow[] = Array.from(bySlot.entries())
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([slot, counts]) => ({
      slot,
      label: slotPlural(slot === 'other' ? null : slot),
      counts,
      total: counts.home + counts.packaged + counts.out + counts.unknown,
    }));
  const total = meals.length;
  let headline: string;
  if (total === 0) headline = 'No meals logged in this range yet.';
  else {
    const parts = (['home', 'packaged', 'out'] as const)
      .filter((key) => totals[key] > 0)
      .map((key) => `${totals[key]} ${MEAL_SOURCE_LABELS[key].toLowerCase()}`);
    headline = parts.length
      ? `Of ${total} ${plural(total, 'meal', 'meals')}: ${joinWords(parts)}.`
      : `${total} ${plural(total, 'meal', 'meals')}, none of which could be placed.`;
    if (totals.unknown > 0 && parts.length) {
      headline += ` ${totals.unknown} could not be told either way, usually because nothing in them matched the food list.`;
    }
  }
  return { rows, totals, total, headline };
}

// ---------------------------------------------------------------------------
// From the plan, or not
// ---------------------------------------------------------------------------

export type PlannedResult = {
  plannedMeals: number;
  unplannedMeals: number;
  daysAllPlanned: number;
  daysSomePlanned: number;
  daysNonePlanned: number;
  daysLogged: number;
  headline: string;
  daysLine: string | null;
};

export function summarizePlanned(meals: VarietyMeal[]): PlannedResult {
  const plannedMeals = meals.filter((meal) => meal.planned).length;
  const unplannedMeals = meals.length - plannedMeals;
  const byDay = new Map<string, { planned: number; total: number }>();
  for (const meal of meals) {
    const day = byDay.get(meal.date) ?? { planned: 0, total: 0 };
    day.total += 1;
    if (meal.planned) day.planned += 1;
    byDay.set(meal.date, day);
  }
  let daysAllPlanned = 0;
  let daysSomePlanned = 0;
  let daysNonePlanned = 0;
  byDay.forEach((day) => {
    if (day.planned === 0) daysNonePlanned += 1;
    else if (day.planned === day.total) daysAllPlanned += 1;
    else daysSomePlanned += 1;
  });
  const daysLogged = byDay.size;
  const headline =
    meals.length === 0
      ? 'No meals logged in this range yet.'
      : `${plannedMeals} of ${meals.length} ${plural(meals.length, 'meal', 'meals')} came from the plan or were chosen ahead. The other ${unplannedMeals} ${plural(unplannedMeals, 'was', 'were')} decided on the day.`;
  const daysLine =
    daysLogged === 0
      ? null
      : `Of ${daysLogged} ${plural(daysLogged, 'day', 'days')} with meals logged: ${daysAllPlanned} all from the plan, ${daysSomePlanned} partly, ${daysNonePlanned} with nothing from it.`;
  return { plannedMeals, unplannedMeals, daysAllPlanned, daysSomePlanned, daysNonePlanned, daysLogged, headline, daysLine };
}

// ---------------------------------------------------------------------------
// Meals that came back most
// ---------------------------------------------------------------------------

export type MealRepeat = { name: string; times: number; days: number; lastDate: string };

export type MealRepeatsResult = {
  top: MealRepeat[];
  totalMeals: number;
  distinctNames: number;
  daysLogged: number;
  topFiveShare: number | null;
  headline: string;
};

export function summarizeMealRepeats(meals: VarietyMeal[], limit = 8): MealRepeatsResult {
  const byName = new Map<string, { name: string; times: number; dates: Set<string>; lastDate: string }>();
  for (const meal of meals) {
    const key = meal.name.trim().toLowerCase();
    if (!key) continue;
    const entry = byName.get(key) ?? { name: meal.name.trim(), times: 0, dates: new Set<string>(), lastDate: meal.date };
    entry.times += 1;
    entry.dates.add(meal.date);
    if (meal.date > entry.lastDate) entry.lastDate = meal.date;
    byName.set(key, entry);
  }
  const all = Array.from(byName.values())
    .map((entry) => ({ name: entry.name, times: entry.times, days: entry.dates.size, lastDate: entry.lastDate }))
    .sort((a, b) => b.times - a.times || b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name));
  const totalMeals = meals.length;
  const daysLogged = new Set(meals.map((meal) => meal.date)).size;
  const topFive = all.slice(0, 5).reduce((sum, entry) => sum + entry.times, 0);
  const topFiveShare = all.length >= 5 && totalMeals > 0 ? roundShare(topFive, totalMeals) : null;
  const headline =
    totalMeals === 0
      ? 'No meals logged in this range yet.'
      : `${totalMeals} ${plural(totalMeals, 'meal', 'meals')} logged under ${all.length} different ${plural(all.length, 'name', 'names')}.` +
        (topFiveShare != null ? ` The five that came back most are ${topFiveShare}% of them.` : '');
  return { top: all.filter((entry) => entry.times > 1).slice(0, limit), totalMeals, distinctNames: all.length, daysLogged, topFiveShare, headline };
}

export function describeMealRepeat(entry: MealRepeat, daysLogged: number): string {
  return `${entry.name}: ${entry.times} times, on ${entry.days} of the ${daysLogged} days with meals logged, last on ${shortDate(entry.lastDate)}.`;
}

// ---------------------------------------------------------------------------
// Food groups that never turned up
// ---------------------------------------------------------------------------

export const VARIETY_GROUPS: { key: string; label: string }[] = [
  { key: 'Fruit', label: 'fruit' },
  { key: 'Veg', label: 'vegetables' },
  { key: 'Legume', label: 'beans, lentils and peas' },
  { key: 'Grain', label: 'grains' },
  { key: 'NutSeed', label: 'nuts and seeds' },
  { key: 'Herbs', label: 'herbs and spices' },
  { key: 'Mushroom', label: 'mushrooms' },
  { key: 'Algae', label: 'seaweed' },
  { key: 'fermented', label: 'fermented foods' },
];

export type GroupsResult = { present: { label: string; entries: number }[]; missing: string[]; unplaced: number; headline: string };

export function summarizeGroups(records: VarietyFoodRecord[]): GroupsResult {
  const present: { label: string; entries: number }[] = [];
  const missing: string[] = [];
  for (const group of VARIETY_GROUPS) {
    const entries = records.filter((record) => (group.key === 'fermented' ? record.fermented : record.category === group.key)).length;
    if (entries > 0) present.push({ label: group.label, entries });
    else missing.push(group.label);
  }
  const unplaced = records.filter((record) => record.category == null).length;
  let headline: string;
  if (records.length === 0) headline = 'Nothing logged in this range yet, so there is nothing to count.';
  else if (missing.length === 0) headline = `Every one of these groups turned up at least once: ${joinWords(VARIETY_GROUPS.map((group) => group.label))}.`;
  else headline = `Not logged at all in this range: ${joinWords(missing)}.`;
  return { present, missing, unplaced, headline };
}

// ---------------------------------------------------------------------------
// Plants a person used to eat and has not lately
// ---------------------------------------------------------------------------

/** A plant's name as it reads in a sentence: "Beans, black" becomes "black beans". */
export function plainPlantName(label: string): string {
  const parts = label.split(',').map((part) => part.trim()).filter(Boolean);
  const words = parts.length === 2 ? `${parts[1]} ${parts[0]}` : parts.join(' ');
  return words.toLowerCase();
}

export type PlantNotLately = {
  key: string;
  name: string;
  // The most recent entry for it, so a tap can add the same food again.
  foodId: string;
  foodName: string;
  category: string;
  daysEaten: number;
  lastDate: string;
};

export const RECENT_DAYS = 28;
export const LOOKBACK_DAYS = 120;

/**
 * Plants eaten between RECENT_DAYS and LOOKBACK_DAYS ago and not in the last
 * RECENT_DAYS, the most familiar first. Only foods that matched the food
 * list are offered, since a tap adds that food to a meal.
 */
export function plantsNotLately(records: VarietyFoodRecord[], today: string, limit = 3): PlantNotLately[] {
  const recentStart = addDays(today, -(RECENT_DAYS - 1));
  const olderStart = addDays(today, -(LOOKBACK_DAYS - 1));
  const recent = new Set<string>();
  const older = new Map<string, { record: VarietyFoodRecord; dates: Set<string>; lastDate: string }>();
  for (const record of records) {
    if (!isPlantCategory(record.category) || record.date < olderStart || record.date > today) continue;
    const { key } = plantIdentity(record.foodName);
    if (!key) continue;
    if (record.date >= recentStart) {
      recent.add(key);
      continue;
    }
    if (!record.foodKey.includes('|')) continue;
    const entry = older.get(key);
    if (!entry) older.set(key, { record, dates: new Set([record.date]), lastDate: record.date });
    else {
      entry.dates.add(record.date);
      if (record.date >= entry.lastDate) {
        entry.lastDate = record.date;
        entry.record = record;
      }
    }
  }
  return Array.from(older.entries())
    .filter(([key]) => !recent.has(key))
    .map(([key, entry]) => ({
      key,
      name: plainPlantName(plantIdentity(entry.record.foodName).label),
      foodId: entry.record.foodKey,
      foodName: entry.record.foodName,
      category: entry.record.category as string,
      daysEaten: entry.dates.size,
      lastDate: entry.lastDate,
    }))
    .sort((a, b) => b.daysEaten - a.daysEaten || b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Different plants across one meal of the day's entries in the last RECENT_DAYS. */
export function slotPlantCount(records: VarietyFoodRecord[], slot: string, today: string): { plants: number; meals: number } {
  const start = addDays(today, -(RECENT_DAYS - 1));
  const inSlot = records.filter((record) => record.mealType === slot && record.date >= start && record.date <= today);
  const plants = new Set<string>();
  for (const record of inSlot) {
    if (!isPlantCategory(record.category)) continue;
    const { key } = plantIdentity(record.foodName);
    if (key) plants.add(key);
  }
  return { plants: plants.size, meals: new Set(inSlot.map((record) => record.mealId)).size };
}

/**
 * The line under a usual meal on Home. Null when that meal of the day has
 * nothing logged in four weeks and nothing is waiting to be offered.
 */
export function homeVarietyLine(slot: string, count: { plants: number; meals: number }, notLately: PlantNotLately[]): string | null {
  const parts: string[] = [];
  if (count.meals > 0) {
    parts.push(
      `Your ${slotPlural(slot).toLowerCase()} over the last four weeks held ${count.plants} different ${plural(count.plants, 'plant', 'plants')}.`,
    );
  }
  if (notLately.length > 0) parts.push(`Not eaten in four weeks: ${joinWords(notLately.map((plant) => plant.name))}.`);
  return parts.length ? parts.join(' ') : null;
}

export function homeChipCaption(slot: string, logged: boolean): string {
  const meal = slot === 'snack' ? 'snack' : slot;
  return logged ? `Tap one to add it to today’s ${meal}.` : `Tap one to add it when you log today’s ${meal}.`;
}

export function addedToMealSentence(name: string, slot: string): string {
  return `Added ${name} to today’s ${slot}.`;
}

// ---------------------------------------------------------------------------
// The whole reading, for the reports
// ---------------------------------------------------------------------------

export type VarietyWeekRow = { label: string; partial: boolean; daysLogged: number; foods: number | null; plants: number | null };

export type MealVarietySummary = {
  weeks: VarietyWeekRow[];
  weeksWithoutLogging: number;
  distinct: DistinctFoodsResult;
  plants: PlantsResult;
  rotation: RotationResult;
  gut: GutFoodResult;
  repeats: MealRepeatsResult;
  groups: GroupsResult;
  sources: MealSourcesResult;
  planned: PlannedResult;
  hasAnything: boolean;
};

export function summarizeMealVariety(inputs: VarietyInputs, meals: VarietyMeal[]): MealVarietySummary {
  const weeks = buildWeeks(inputs.startDate, inputs.endDate, inputs.loggedDates);
  const distinct = summarizeDistinctFoods(inputs, weeks);
  const plants = summarizeDistinctPlants(inputs, weeks);
  const byMeal = groupRecordsByMeal(inputs.records);
  return {
    weeks: weeks.map((week, index) => ({
      label: describeWeek(week),
      partial: week.partial,
      daysLogged: week.daysLogged,
      foods: distinct.weeks[index]?.value ?? null,
      plants: plants.weeks[index]?.value ?? null,
    })),
    weeksWithoutLogging: weeks.filter((week) => !week.hasLogging).length,
    distinct,
    plants,
    rotation: summarizeRotation(inputs),
    gut: summarizeGutFoods(inputs, weeks),
    repeats: summarizeMealRepeats(meals),
    groups: summarizeGroups(inputs.records),
    sources: summarizeMealSources(meals, byMeal),
    planned: summarizePlanned(meals),
    hasAnything: meals.length > 0 || inputs.records.length > 0,
  };
}
