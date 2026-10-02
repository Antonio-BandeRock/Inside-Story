// A meal eaten out, G9 (2026-10-02): a restaurant, a takeaway, or a meal
// somebody else cooked. What was in it is never known the way a meal made
// at home is, so every place it is read says so: the foods listed are a
// stand-in, an amount left blank adds nothing to a day's totals, and a meal
// with nothing listed is a meal whose contents are not known.
//
// The columns are meals.eaten_out, eaten_out_place and eaten_out_how. Before
// them, a meal eaten out carried a note starting "Eaten out." (usual meals,
// voice logging, meal packs), and parseEatenOutNote reads those, so a meal
// logged either way is found by the same readers.
//
// Pure: no database, no React, checked by scripts/test_eaten_out.js.

export const EATEN_OUT_NOTE = 'Eaten out.';

export type EatenOutHow = 'restaurant' | 'takeaway' | 'someone';

export const EATEN_OUT_HOWS: { key: EatenOutHow; label: string }[] = [
  { key: 'restaurant', label: 'At the restaurant' },
  { key: 'takeaway', label: 'Takeaway or delivery' },
  { key: 'someone', label: 'Someone else cooked' },
];

export function isEatenOutHow(value: unknown): value is EatenOutHow {
  return value === 'restaurant' || value === 'takeaway' || value === 'someone';
}

/** The note a meal eaten out has carried since usual meals, with the place when there is one. */
export function eatenOutNote(place?: string | null): string {
  const where = (place ?? '').trim().replace(/\.+$/, '');
  return where ? `${EATEN_OUT_NOTE} ${where}.` : EATEN_OUT_NOTE;
}

/** Reads a note written by eatenOutNote: null when it is not one, otherwise the place or null. */
export function parseEatenOutNote(notes: string | null | undefined): { place: string | null } | null {
  const text = (notes ?? '').trim();
  if (!text.startsWith(EATEN_OUT_NOTE)) return null;
  const rest = text.slice(EATEN_OUT_NOTE.length).trim().replace(/\.+$/, '').trim();
  return { place: rest || null };
}

export type EatenOutFields = {
  eatenOut: boolean;
  place: string | null;
  how: EatenOutHow | null;
};

/** One reading of a meal row: the columns when set, the old note otherwise. */
export function eatenOutOf(row: {
  eaten_out?: number | null;
  eaten_out_place?: string | null;
  eaten_out_how?: string | null;
  notes?: string | null;
}): EatenOutFields {
  if (row.eaten_out) {
    return { eatenOut: true, place: row.eaten_out_place?.trim() || null, how: isEatenOutHow(row.eaten_out_how) ? row.eaten_out_how : null };
  }
  const fromNote = parseEatenOutNote(row.notes);
  if (fromNote) return { eatenOut: true, place: fromNote.place, how: null };
  return { eatenOut: false, place: null, how: null };
}

function whereWords(place: string | null, how: EatenOutHow | null): string {
  if (how === 'takeaway') return place ? `Takeaway from ${place}` : 'Takeaway or delivery';
  if (how === 'someone') return place ? `Cooked by ${place}` : 'Someone else cooked';
  return place ? `Eaten out at ${place}` : 'Eaten out';
}

/** A meal's name when nothing in it was listed. */
export function eatenOutMealName(place: string | null, how: EatenOutHow | null): string {
  return whereWords(place?.trim() || null, how);
}

/**
 * The caption under a meal eaten out. itemCount is how many foods were
 * listed and unmeasured how many of them were left without an amount.
 */
export function eatenOutCaption(input: { place: string | null; how: EatenOutHow | null; itemCount: number; unmeasured: number }): string {
  const where = whereWords(input.place, input.how);
  if (input.itemCount === 0) return `${where}. What was in it is not known.`;
  if (input.unmeasured === 0) return `${where}. The foods listed are a stand-in for what was served.`;
  if (input.unmeasured === input.itemCount) {
    return `${where}. The foods listed are a stand-in, with no amounts, so they add nothing to the day's totals.`;
  }
  return `${where}. The foods listed are a stand-in, and ${input.unmeasured} of ${input.itemCount} have no amount, so those add nothing to the day's totals.`;
}

export type EatenOutDayMeal = { mealName: string; itemCount: number; unmeasured: number };

/** The line under a day's nutrient totals when any meal that day was eaten out, or null. */
export function eatenOutDayLine(meals: EatenOutDayMeal[]): string | null {
  if (meals.length === 0) return null;
  const notKnown = meals.filter((meal) => meal.itemCount === 0).length;
  const unmeasured = meals.reduce((sum, meal) => sum + meal.unmeasured, 0);
  const lead =
    meals.length === 1
      ? `${meals[0].mealName} was eaten out, so the totals above count a stand-in for it.`
      : `${meals.length} meals that day were eaten out, so the totals above count a stand-in for them.`;
  const parts = [lead];
  if (notKnown > 0) parts.push(notKnown === 1 && meals.length === 1 ? 'Nothing in it was listed, so it adds nothing.' : `${notKnown} had nothing listed, so they add nothing.`);
  if (unmeasured > 0) parts.push(`${unmeasured} food${unmeasured === 1 ? '' : 's'} listed without an amount add${unmeasured === 1 ? 's' : ''} nothing.`);
  return parts.join(' ');
}

/** The Pattern Finder line when meals eaten out came before some of the flares, or null. */
export function eatenOutPatternLine(flares: number, flaresAfterEatenOut: number, windowHours: number, shortMany = 'flares'): string | null {
  if (flaresAfterEatenOut <= 0 || flares <= 0) return null;
  return `${flaresAfterEatenOut} of the ${flares} ${shortMany} came within ${windowHours} hours of a meal eaten out, where what was in it is a stand-in or not known.`;
}

/** The places most recently eaten at, newest first, each once whatever its spelling of case. */
export function recentPlaces(places: (string | null | undefined)[], limit = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of places) {
    const place = (raw ?? '').trim();
    if (!place) continue;
    const key = place.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * How many flares had a meal eaten out in the windowHours before them. Both
 * lists are local times ('YYYY-MM-DDTHH:mm', or anything Date reads).
 */
export function flaresAfterEatenOut(flareStamps: string[], eatenOutStamps: string[], windowHours: number): number {
  const meals = eatenOutStamps.map((stamp) => new Date(stamp).getTime()).filter((time) => Number.isFinite(time));
  const reach = windowHours * 60 * 60 * 1000;
  let count = 0;
  for (const stamp of flareStamps) {
    const end = new Date(stamp).getTime();
    if (!Number.isFinite(end)) continue;
    if (meals.some((time) => time <= end && end - time <= reach)) count += 1;
  }
  return count;
}
