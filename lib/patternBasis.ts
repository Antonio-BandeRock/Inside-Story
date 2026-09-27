// What a Pattern Finder finding is based on (Phase B of the 2026-09-24 gap
// review, items 10 and 23). Pure: no imports, no I/O, so
// scripts/test_phase_b_patterns.js checks every figure and sentence here.
//
// The count Pattern Finder has always shown ("logged before 3 of your 9
// flares") leaves out two things a reader needs before it means anything:
//
//   1. The denominator is the flares that had meals logged before them. A
//      flare with nothing logged in the hours before it can say nothing
//      about food, so it is taken out of the count and named separately
//      rather than quietly lowering every share.
//   2. How often the same food turns up anyway. Olive oil logged before 5
//      of 7 flares is nothing to notice when it is in almost every meal.
//      So every candidate is also counted across ordinary stretches of the
//      same length, one ending at 6 AM, noon, 6 PM and midnight of every
//      day in the range, keeping only stretches with a meal logged in
//      them. Four a day keeps breakfast foods and dinner foods on an even
//      footing whatever the window length.
//
// Two occurrences stays the floor for a candidate to show at all, and the
// screen says two can be chance rather than raising the floor until the
// list goes quiet, since a short list with an honest caption helps more
// than an empty one.

export const MIN_PATTERN_OCCURRENCES = 2;

// A candidate reads as turning up more often before flares when its share
// of flare windows is at least this many times its share of ordinary
// stretches, and at least MORE_MARGIN higher in plain terms. The second
// test stops 2% against 1% counting as "twice as often".
export const MORE_RATIO = 1.5;
export const MORE_MARGIN = 0.2;

// The stretch endings used for the ordinary comparison, in hours of the day.
export const USUAL_WINDOW_END_HOURS = [6, 12, 18, 24] as const;

export type MealMoment = { eatenAt: string; keys: string[] };

export type PatternComparison = {
  beforeCount: number;
  flaresWithMeals: number;
  beforeShare: number;
  usualCount: number;
  usualWindows: number;
  usualShare: number | null;
  verdict: 'more' | 'same' | 'unknown';
  /** D6: how many days with everything on the daily list rated None today
   *  had this key in the same window before them, and how many such days
   *  had meals logged before them. Absent when there are none. */
  goodCount?: number;
  goodDays?: number;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toLocalMinute(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Every ordinary stretch end from the first day to the last, both
// 'YYYY-MM-DD', stopping at `now` so a stretch still in progress is left out.
export function usualWindowEnds(firstDay: string, lastDay: string, now: Date): Date[] {
  const [y, m, d] = firstDay.split('-').map(Number);
  const ends: Date[] = [];
  for (let day = new Date(y, m - 1, d); ; day.setDate(day.getDate() + 1)) {
    const key = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    if (key > lastDay) break;
    for (const hour of USUAL_WINDOW_END_HOURS) {
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0);
      if (end.getTime() <= now.getTime()) ends.push(end);
    }
  }
  return ends;
}

// The keys eaten in the `hours` before `end`, from meals sorted by eatenAt.
// Null when nothing at all was logged in the window, which is different
// from a window whose meals held none of the keys being counted.
export function keysInWindow(sortedMeals: MealMoment[], end: Date, hours: number): Set<string> | null {
  const endKey = toLocalMinute(end);
  const startKey = toLocalMinute(new Date(end.getTime() - hours * 60 * 60 * 1000));
  let found = false;
  const keys = new Set<string>();
  for (const meal of sortedMeals) {
    if (meal.eatenAt < startKey) continue;
    if (meal.eatenAt > endKey) break;
    found = true;
    for (const key of meal.keys) keys.add(key);
  }
  return found ? keys : null;
}

// F3, typical delay (2026-09-26): for each key eaten in the `hours` before
// `end`, the hours from the LAST time it was eaten to `end`. The last time
// rather than the first, since the nearest eating is the one somebody
// would think of. Null when nothing was logged in the window.
export function hoursBeforeEnd(sortedMeals: MealMoment[], end: Date, hours: number): Map<string, number> | null {
  const endKey = toLocalMinute(end);
  const startKey = toLocalMinute(new Date(end.getTime() - hours * 60 * 60 * 1000));
  let found = false;
  const delays = new Map<string, number>();
  for (const meal of sortedMeals) {
    if (meal.eatenAt < startKey) continue;
    if (meal.eatenAt > endKey) break;
    found = true;
    const [datePart, timePart = '00:00'] = meal.eatenAt.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, mi] = timePart.split(':').map(Number);
    const gap = Math.max(0, (end.getTime() - new Date(y, m - 1, d, h || 0, mi || 0).getTime()) / 3600000);
    // Meals are sorted oldest first, so a later eating overwrites an earlier one.
    for (const key of meal.keys) delays.set(key, gap);
  }
  return found ? delays : null;
}

export type PatternDelay = { medianHours: number; count: number };

export function medianDelay(delays: number[]): PatternDelay | null {
  if (delays.length < MIN_PATTERN_OCCURRENCES) return null;
  const sorted = [...delays].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return { medianHours: median, count: sorted.length };
}

// The middle value of the gaps, so half the times came sooner and half
// later. Said with how many it was worked from, and never as how long a
// food takes to do anything.
export function delaySentence(delay: PatternDelay, words: { shortMany: string }): string {
  const hours = Math.round(delay.medianHours);
  const gap = delay.medianHours < 1 ? 'under an hour' : `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `Last eaten a median of ${gap} before, across the ${delay.count} ${words.shortMany} it came before.`;
}

export function compareWindows(
  key: string,
  flareWindows: (Set<string> | null)[],
  usualWindows: (Set<string> | null)[],
  goodWindows: (Set<string> | null)[] = [],
): PatternComparison {
  const good = goodWindows.filter((window): window is Set<string> => window !== null);
  const withMeals = flareWindows.filter((window): window is Set<string> => window !== null);
  const usual = usualWindows.filter((window): window is Set<string> => window !== null);
  const beforeCount = withMeals.filter((window) => window.has(key)).length;
  const usualCount = usual.filter((window) => window.has(key)).length;
  const beforeShare = withMeals.length ? beforeCount / withMeals.length : 0;
  const usualShare = usual.length ? usualCount / usual.length : null;
  let verdict: PatternComparison['verdict'] = 'unknown';
  if (usualShare !== null) {
    verdict = beforeShare >= usualShare * MORE_RATIO && beforeShare >= usualShare + MORE_MARGIN ? 'more' : 'same';
  }
  return {
    beforeCount,
    flaresWithMeals: withMeals.length,
    beforeShare,
    usualCount,
    usualWindows: usual.length,
    usualShare,
    verdict,
    ...(good.length > 0 ? { goodCount: good.filter((window) => window.has(key)).length, goodDays: good.length } : {}),
  };
}

// Candidates whose count stands out sort ahead of ones that turn up just as
// often anyway, then by count.
export function verdictRank(verdict: PatternComparison['verdict']): number {
  return verdict === 'more' ? 0 : verdict === 'unknown' ? 1 : 2;
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export type PatternBasis = {
  flares: number;
  flaresWithMeals: number;
  windowHours: number;
  daysInRange: number;
  daysWithMeals: number;
};

// The line under the window pills that says what every count below it was
// counted against.
// `words` names what was counted (lib/patternOutcome.ts); it defaults to
// flares and reactions, which is what Pattern Finder counted before D1.
export function basisSentence(
  basis: PatternBasis,
  words: { one: string; many: string } = { one: 'flare or reaction', many: 'flares and reactions' },
): string {
  const without = basis.flares - basis.flaresWithMeals;
  const parts = [
    `Based on ${plural(basis.flares, words.one, words.many)}, ${basis.flaresWithMeals} of them with meals logged in the ${basis.windowHours} hours before.`,
  ];
  if (without > 0) {
    parts.push(
      `${without === 1 ? 'The other one had' : `The other ${without} had`} nothing logged in that time, so ${without === 1 ? 'it says' : 'they say'} nothing about food either way.`,
    );
  }
  parts.push(`Meals were logged on ${basis.daysWithMeals} of the ${basis.daysInRange} days looked at.`);
  return parts.join(' ');
}

export function thresholdSentence(): string {
  return `Anything eaten before ${MIN_PATTERN_OCCURRENCES} or more of them shows here. Two can be chance, so a short count is a reason to keep watching, not a finding.`;
}

// D6: the line about days with nothing on the daily list. A count, never a
// verdict, since a handful of good days is too few to compare shares with.
export function goodDaySentence(comparison: PatternComparison): string | null {
  if (!comparison.goodDays) return null;
  const days = comparison.goodDays === 1 ? '1 day' : `${comparison.goodDays} days`;
  return `It was also eaten before ${comparison.goodCount ?? 0} of the ${days} you rated everything on your daily list None today (days with meals logged before them).`;
}

// One caption per candidate, under "Logged before N of your M ...".
export function comparisonSentence(comparison: PatternComparison, windowHours: number): string {
  const main = comparisonMainSentence(comparison, windowHours);
  const good = goodDaySentence(comparison);
  return good ? `${main} ${good}` : main;
}

function comparisonMainSentence(comparison: PatternComparison, windowHours: number): string {
  const before = `${comparison.beforeCount} of the ${comparison.flaresWithMeals} with meals logged before them (${percent(comparison.beforeShare)})`;
  if (comparison.usualShare === null) {
    return `Eaten before ${before}. There are no other stretches with meals logged to compare it with yet.`;
  }
  const usual = `${percent(comparison.usualShare)} of any ${windowHours}-hour stretch with meals logged`;
  if (comparison.verdict === 'more') {
    return `Eaten before ${before}, against ${usual}. That is more often than usual, which is worth watching and is not proof of anything.`;
  }
  return `Eaten before ${before}, against ${usual}. That is about as often as on any day, so this count alone says little.`;
}
