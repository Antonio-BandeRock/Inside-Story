// Glucose around each meal, F10 (2026-10-01).
//
// For every logged meal with glucose readings around it: the level just
// before the meal, the highest reading after it and how long after, how far
// that is above the level before, and how long until readings came back to
// the level before. Readings come from a meter or sensor through Health
// Connect (health_records, type glucose); meals are what was logged as
// eaten (meals.eaten_at).
//
// Worded as what the readings show: "rose by", never "spiked because of".
// Activity, sleep, stress, illness and medication all move glucose too, so
// nothing here says the meal did it, and nothing says a rise was too much,
// fine, or anything a person should aim for. Usual is what this person's
// rises have been (lib/yourUsual.ts). A meal without a reading before it,
// or without one after, says so and is never read as flat.
//
// Pure: times arrive as milliseconds already worked out by the caller, so
// scripts/test_meal_glucose.js can run every case without a phone.

import { formatTime12 } from './timeOfDay';

// The level before is the last reading in this window before the meal.
export const BEFORE_WINDOW_MINUTES = 60;
// The highest reading is looked for in this window after the meal.
export const PEAK_WINDOW_MINUTES = 180;
// Coming back is looked for up to this long after the meal.
export const BACK_WINDOW_MINUTES = 300;
// "Back to the level before" means within this much of it, so the small
// wobble any meter or sensor has does not hold a meal open for hours.
export const BACK_MARGIN_MMOL = 0.3;

export const MGDL_PER_MMOL = 18.016;

const MINUTE = 60_000;

export type MealForGlucose = {
  id: string;
  name: string;
  mealType: string;
  // Milliseconds of the moment it was eaten, and its local day and clock.
  at: number;
  day: string;
  // 'HH:mm'.
  clock: string;
};

export type GlucosePoint = {
  at: number;
  mmol: number;
};

export type BackState = 'back' | 'not_back' | 'readings_stop' | 'next_meal';

export type MealGlucose =
  | {
      status: 'no_before' | 'no_after';
      meal: MealForGlucose;
    }
  | {
      status: 'read';
      meal: MealForGlucose;
      before: number;
      beforeMinutes: number;
      peak: number;
      peakMinutes: number;
      // peak minus before; zero or less when nothing after was higher.
      rise: number;
      readingsAfter: number;
      back: BackState;
      // Set when back is 'back'.
      backMinutes: number | null;
      // Set when back is 'next_meal'.
      nextMeal: MealForGlucose | null;
      // Set when back is 'readings_stop': how long after the meal the last reading was.
      lastReadingMinutes: number | null;
    };

const MEAL_WORDS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  salad: 'Salad',
  smoothie: 'Smoothie',
  snack: 'Snack',
  beverage: 'Drink',
};

export function mealTypeWord(mealType: string): string {
  return MEAL_WORDS[mealType] ?? 'Meal';
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// "5.2 mmol/L (94 mg/dL)".
export function formatGlucose(mmol: number): string {
  return `${round1(mmol)} mmol/L (${Math.round(mmol * MGDL_PER_MMOL)} mg/dL)`;
}

// A difference: "2.1 mmol/L (38 mg/dL)".
export function formatRise(mmol: number): string {
  return formatGlucose(Math.abs(mmol));
}

export function describeMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const hourPart = hours === 0 ? '' : `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  const minutePart = rest === 0 ? '' : `${rest} ${rest === 1 ? 'minute' : 'minutes'}`;
  if (!hourPart && !minutePart) return 'under a minute';
  return [hourPart, minutePart].filter(Boolean).join(' ');
}

// One meal. `readings` is every glucose reading, any order; `meals` is every
// logged meal, so a meal eaten before the readings came back can be named.
export function readMealGlucose(meal: MealForGlucose, readings: GlucosePoint[], meals: MealForGlucose[]): MealGlucose {
  const sorted = [...readings].filter((r) => Number.isFinite(r.mmol)).sort((a, b) => a.at - b.at);
  const beforeReading = sorted
    .filter((r) => r.at <= meal.at && r.at >= meal.at - BEFORE_WINDOW_MINUTES * MINUTE)
    .pop();
  if (!beforeReading) return { status: 'no_before', meal };

  // The next meal eaten after this one, if it lands inside the windows,
  // closes them: what follows it belongs to both meals. A drink does not
  // close a window, since most logged drinks are water; it is read on its own.
  const next =
    meals
      .filter((other) => other.id !== meal.id && other.mealType !== 'beverage' && other.at > meal.at && other.at < meal.at + BACK_WINDOW_MINUTES * MINUTE)
      .sort((a, b) => a.at - b.at)[0] ?? null;
  const peakEnd = Math.min(meal.at + PEAK_WINDOW_MINUTES * MINUTE, next ? next.at : Infinity);
  const backEnd = Math.min(meal.at + BACK_WINDOW_MINUTES * MINUTE, next ? next.at : Infinity);

  const after = sorted.filter((r) => r.at > meal.at && r.at <= peakEnd);
  if (after.length === 0) return { status: 'no_after', meal };

  let peakReading = after[0];
  for (const r of after) if (r.mmol > peakReading.mmol) peakReading = r;
  const before = beforeReading.mmol;
  const rise = peakReading.mmol - before;
  const toMinutes = (at: number) => Math.round((at - meal.at) / MINUTE);

  const base = {
    status: 'read' as const,
    meal,
    before,
    beforeMinutes: toMinutes(meal.at) - toMinutes(beforeReading.at),
    peak: peakReading.mmol,
    peakMinutes: toMinutes(peakReading.at),
    rise,
    readingsAfter: after.length,
  };

  if (rise <= BACK_MARGIN_MMOL) {
    return { ...base, back: 'back', backMinutes: null, nextMeal: null, lastReadingMinutes: null };
  }

  const later = sorted.filter((r) => r.at > peakReading.at && r.at <= backEnd);
  const backReading = later.find((r) => r.mmol <= before + BACK_MARGIN_MMOL);
  if (backReading) {
    return { ...base, back: 'back', backMinutes: toMinutes(backReading.at), nextMeal: null, lastReadingMinutes: null };
  }
  if (next && next.at < meal.at + BACK_WINDOW_MINUTES * MINUTE) {
    return { ...base, back: 'next_meal', backMinutes: null, nextMeal: next, lastReadingMinutes: null };
  }
  const lastAt = later.length > 0 ? later[later.length - 1].at : peakReading.at;
  // A sensor reads every few minutes; a gap of more than an hour before the
  // window ends means the readings stopped rather than stayed up.
  if (backEnd - lastAt > 60 * MINUTE) {
    return { ...base, back: 'readings_stop', backMinutes: null, nextMeal: null, lastReadingMinutes: toMinutes(lastAt) };
  }
  return { ...base, back: 'not_back', backMinutes: null, nextMeal: null, lastReadingMinutes: null };
}

export function readMealsGlucose(meals: MealForGlucose[], readings: GlucosePoint[]): MealGlucose[] {
  const ordered = [...meals].sort((a, b) => a.at - b.at);
  return ordered.map((meal) => readMealGlucose(meal, readings, ordered));
}

// Meals worth showing at all: any glucose reading within the windows around
// them. A meal on a day with no meter or sensor in use is left out rather
// than listed as unreadable.
export function hasReadingsNear(meal: MealForGlucose, readings: GlucosePoint[]): boolean {
  return readings.some(
    (r) => r.at >= meal.at - BEFORE_WINDOW_MINUTES * MINUTE && r.at <= meal.at + BACK_WINDOW_MINUTES * MINUTE,
  );
}

export function mealGlucoseTitle(meal: MealForGlucose): string {
  return `${formatTime12(meal.clock)}  ${mealTypeWord(meal.mealType)}: ${meal.name}`;
}

// The first sentence: what the readings did after the meal.
export function riseSentence(read: MealGlucose): string {
  if (read.status !== 'read') {
    return read.status === 'no_before'
      ? 'No glucose reading in the hour before, so how far it rose cannot be worked out.'
      : `No glucose reading in the ${describeMinutes(PEAK_WINDOW_MINUTES)} after, so how far it rose cannot be worked out.`;
  }
  if (read.rise <= 0) {
    return `Did not rise above the level before, ${formatGlucose(read.before)}. The highest after was ${formatGlucose(read.peak)}.`;
  }
  return `Rose by ${formatRise(read.rise)}, from ${formatGlucose(read.before)} before to ${formatGlucose(read.peak)} ${describeMinutes(read.peakMinutes)} after.`;
}

// The second sentence: whether and when readings came back.
export function backSentence(read: MealGlucose): string | null {
  if (read.status !== 'read' || read.rise <= BACK_MARGIN_MMOL) return null;
  switch (read.back) {
    case 'back':
      return `Back to the level before ${describeMinutes(read.backMinutes ?? 0)} after the meal.`;
    case 'next_meal':
      return read.nextMeal
        ? `${mealTypeWord(read.nextMeal.mealType)} at ${formatTime12(read.nextMeal.clock)} came before it was back to the level before, so what followed belongs to both.`
        : null;
    case 'readings_stop':
      return `The readings stop ${describeMinutes(read.lastReadingMinutes ?? 0)} after the meal, before it was back to the level before.`;
    case 'not_back':
      return `Not back to the level before within ${describeMinutes(BACK_WINDOW_MINUTES)}.`;
  }
}

export function mealGlucoseCaption(read: MealGlucose): string {
  return [riseSentence(read), backSentence(read)].filter(Boolean).join(' ');
}

export type MealGlucoseCounts = { read: number; noBefore: number; noAfter: number };

export function countMealGlucose(reads: MealGlucose[]): MealGlucoseCounts {
  return {
    read: reads.filter((r) => r.status === 'read').length,
    noBefore: reads.filter((r) => r.status === 'no_before').length,
    noAfter: reads.filter((r) => r.status === 'no_after').length,
  };
}

// "3 meals read; 1 more could not be: 1 with no reading before it."
export function countSentence(counts: MealGlucoseCounts): string {
  const meals = (n: number) => `${n} ${n === 1 ? 'meal' : 'meals'}`;
  const head = `${meals(counts.read)} with readings before and after.`;
  const unread = counts.noBefore + counts.noAfter;
  if (unread === 0) return head;
  const parts = [
    counts.noBefore > 0 ? `${counts.noBefore} with no reading in the hour before` : null,
    counts.noAfter > 0 ? `${counts.noAfter} with no reading after` : null,
  ].filter(Boolean);
  return `${head} ${unread === 1 ? '1 more' : `${unread} more`} could not be read: ${parts.join(' and ')}.`;
}

export const MEAL_GLUCOSE_HOW =
  'The level before is the last reading in the hour before the meal. The highest is looked for in the three hours after, and back means within 0.3 mmol/L (5 mg/dL) of the level before, looked for up to five hours after. A meal eaten before the readings came back closes the window; a drink is read on its own and closes nothing.';

export const MEAL_GLUCOSE_LIMIT =
  'These are what the readings did after each meal. Activity, sleep, stress, illness and medication move glucose too, and any of them can sit behind a rise after a meal. A sensor reads the fluid under the skin, which trails a finger-prick reading by several minutes. What a rise means for you, and any question about insulin or medication, is for your clinician.';
