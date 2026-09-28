// A meal left open on the plan (2026-09-27, direct request: "let the user
// who works have one meal per day be unplanned, and not entered until they
// make the meal for tomorrow, or they decide to eat out, and would choose
// one of their usual meals out"). The meal generator plans nothing for an
// open meal on the days it applies to, the schedule gets no row for it, and
// Home offers the person's usual meals for it instead of guessing.
//
// Pure: the rule, which days it covers, and every sentence. The rule is kept
// as JSON in app_meta under OPEN_MEALS_META_KEY, and it travels between a
// person's devices like any other preference.

export type OpenMeal = 'breakfast' | 'lunch' | 'dinner';

export const OPEN_MEAL_CHOICES: readonly OpenMeal[] = ['breakfast', 'lunch', 'dinner'];

export type OpenMealRule = {
  meal: OpenMeal;
  // 0 is Sunday, as Date.getDay() counts.
  weekdays: number[];
};

export const OPEN_MEALS_META_KEY = 'open_meals';

// Monday to Friday, the working week most people mean.
export const WORKDAYS: readonly number[] = [1, 2, 3, 4, 5];

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MEAL_WORD: Record<OpenMeal, string> = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };
const MEAL_PLURAL: Record<OpenMeal, string> = { breakfast: 'breakfasts', lunch: 'lunches', dinner: 'dinners' };
const MEAL_TITLE: Record<OpenMeal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

function isOpenMeal(value: unknown): value is OpenMeal {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner';
}

/** Rules as stored; anything unreadable is dropped rather than guessed at, and a meal appears once. */
export function parseOpenMeals(json: string | null | undefined): OpenMealRule[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const seen = new Set<OpenMeal>();
  const rules: OpenMealRule[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const meal = (item as { meal?: unknown }).meal;
    const days = (item as { weekdays?: unknown }).weekdays;
    if (!isOpenMeal(meal) || seen.has(meal) || !Array.isArray(days)) continue;
    const weekdays = [...new Set(days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
    if (weekdays.length === 0) continue;
    seen.add(meal);
    rules.push({ meal, weekdays });
  }
  return rules;
}

export function serializeOpenMeals(rules: OpenMealRule[]): string {
  return JSON.stringify(rules.filter((rule) => rule.weekdays.length > 0));
}

/** 0 to 6 for a "YYYY-MM-DD" date, read at local noon so no time zone moves it. */
export function weekdayOf(date: string): number {
  return new Date(`${date.slice(0, 10)}T12:00:00`).getDay();
}

/** The meals left open on this date, in the order of the day. */
export function openMealsOn(rules: OpenMealRule[], date: string | undefined): OpenMeal[] {
  if (!date || rules.length === 0) return [];
  const day = weekdayOf(date);
  return OPEN_MEAL_CHOICES.filter((meal) => rules.some((rule) => rule.meal === meal && rule.weekdays.includes(day)));
}

export function isMealOpenOn(rules: OpenMealRule[], date: string, meal: string): boolean {
  return openMealsOn(rules, date).includes(meal as OpenMeal);
}

/** "every day", "Monday to Friday", "Saturday and Sunday", or the days named. */
export function weekdaysPhrase(weekdays: number[]): string {
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  if (days.length === 7) return 'every day';
  if (days.join() === '1,2,3,4,5') return 'Monday to Friday';
  if (days.join() === '0,6') return 'Saturday and Sunday';
  // Monday first, Sunday last, the way a week is read.
  const ordered = [...days.filter((d) => d !== 0), ...days.filter((d) => d === 0)].map((d) => WEEKDAY_NAMES[d]);
  if (ordered.length === 1) return `on ${ordered[0]}s`;
  return `on ${ordered.slice(0, -1).join(', ')} and ${ordered[ordered.length - 1]}`;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** One line for the Meal Plan form: what the plan leaves open, or null when nothing is. */
export function describeOpenMeals(rules: OpenMealRule[]): string | null {
  if (rules.length === 0) return null;
  const parts = rules.map((rule) => `${MEAL_TITLE[rule.meal]} is left open ${weekdaysPhrase(rule.weekdays)}`);
  const it = rules.length === 1 ? 'it' : 'them';
  return `${parts.join('. ')}. Nothing is planned for ${it}: a meal you pack the day before or eat out goes there, logged when you choose it.`;
}

/** Said on a generated day that has an open meal. */
export function openMealDayNote(open: OpenMeal[], planned: OpenMeal[]): string {
  const openWords = joinWords(open.map((meal) => MEAL_WORD[meal]));
  const plannedWords = joinWords(planned.map((meal) => MEAL_WORD[meal]));
  const verb = open.length === 1 ? 'is' : 'are';
  if (planned.length === 0) {
    return `${openWords.charAt(0).toUpperCase()}${openWords.slice(1)} ${verb} left open on this day, so nothing is planned.`;
  }
  return (
    `${openWords.charAt(0).toUpperCase()}${openWords.slice(1)} ${verb} left open on this day for a meal you pack or eat out, ` +
    `so the nutrient figures below cover ${plannedWords} only.`
  );
}

/** The Home line when an open meal has no usual meals set yet. */
export function openMealEmptyLine(meal: OpenMeal): string {
  return `${MEAL_TITLE[meal]} is left open on your plan today. Add a few usual ${MEAL_PLURAL[meal]}, from home or eaten out, and they will be here to log with one tap.`;
}
