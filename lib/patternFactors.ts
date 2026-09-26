// Pattern Finder for any factor (F1, 2026-09-26). Until now Pattern Finder
// looked only at food. This turns everything else the app records into
// moments the same comparison can count: check-in tags, sleep, doses marked
// skipped, steps, water, and each tracker the person named (D2).
//
// Pure, apart from the two sibling modules it borrows its arithmetic from,
// so scripts/test_pattern_factors.js checks every figure and sentence here.
//
// The Phase B rules hold for every factor exactly as they do for food:
//
//   1. Each count names its denominator, and the denominator is only the
//      outcomes that had that kind of thing recorded in the window before
//      them. A night with no sleep recorded says nothing about sleep, so it
//      is taken out rather than counted as an ordinary night.
//   2. Each candidate is set beside how often the same thing turns up in
//      any ordinary stretch of the same length that had it recorded
//      (lib/patternBasis.ts), so a tag somebody uses every day does not
//      read as standing out.
//   3. "Shows up before" is the strongest thing any sentence says. Nothing
//      here is called a cause, a trigger or a reason.
//
// A number (sleep hours, steps, water, a tracker) becomes a moment only when
// it falls outside the person's usual range, the middle 80% of their own days
// in the range (lib/yourUsual.ts), so "less than usual" always means less than
// what their days have been, never less than they should be.
//
// Weather and a menstrual cycle are named in the plan too. Neither is
// recorded anywhere in the app yet, so both are said to be missing on
// screen; when either gets a table it becomes one more group here.

import { compareWindows, MIN_PATTERN_OCCURRENCES, verdictRank, type PatternComparison } from './patternBasis';
import { placeInUsual, usualRange, MIN_USUAL_READINGS } from './yourUsual';

export type FactorFamily = 'tags' | 'sleep' | 'doses' | 'steps' | 'water' | 'trackers';

// One record of something happening, at a local 'YYYY-MM-DDTHH:mm'. `group`
// is what its presence counts toward: a window with any moment of a group in
// it is a window where that group was recorded. `keys` is what it stands for
// (empty for a night inside the usual range, which is still a night recorded).
export type FactorMoment = { at: string; group: string; keys: string[] };

export type FactorGroup = {
  group: string;
  family: FactorFamily;
  /** What was recorded, as it reads in "with ___ recorded before them". */
  noun: string;
  /** A day total, known only once the day is over; counted at 24 and 48 hours. */
  dayTotal: boolean;
  /** Set when the group had records but too few days to draw a usual range. */
  usualShort: number | null;
};

export type FactorCandidate = {
  key: string;
  group: string;
  label: string;
  /** The group's noun, for factorComparisonSentence. */
  noun: string;
  occurrenceCount: number;
  comparison: PatternComparison;
};

export type FactorFamilyResult = {
  family: FactorFamily;
  title: string;
  candidates: FactorCandidate[];
  /** What this family's counts rest on, or why there are none. */
  lines: string[];
};

export const FACTOR_FAMILY_TITLES: Record<FactorFamily, string> = {
  tags: 'Check-in tags',
  sleep: 'Sleep',
  doses: 'Doses skipped',
  steps: 'Steps',
  water: 'Water',
  trackers: 'Your trackers',
};

const FAMILY_ORDER: FactorFamily[] = ['tags', 'sleep', 'doses', 'steps', 'water', 'trackers'];

export const DAY_TOTAL_MIN_HOURS = 24;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalMinute(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The keys in the `hours` before `end`, from moments sorted by `at`. The end
// is left out, so the check-in an outcome is made of never counts as coming
// before itself. Null when nothing of the group was recorded in the window.
export function factorKeysInWindow(sorted: FactorMoment[], end: Date, hours: number): Set<string> | null {
  const endKey = toLocalMinute(end);
  const startKey = toLocalMinute(new Date(end.getTime() - hours * 60 * 60 * 1000));
  let found = false;
  const keys = new Set<string>();
  for (const moment of sorted) {
    if (moment.at < startKey) continue;
    if (moment.at >= endKey) break;
    found = true;
    for (const key of moment.keys) keys.add(key);
  }
  return found ? keys : null;
}

// --- Turning records into moments ------------------------------------------

export type TaggedCheckin = { at: string; tags: string[] };

/** Every check-in carrying at least one tag. One without tags says nothing
 *  about which tags were absent, so it is not a record of any. */
export function tagMoments(checkins: TaggedCheckin[]): FactorMoment[] {
  return checkins
    .filter((checkin) => checkin.tags.length > 0)
    .map((checkin) => ({ at: checkin.at.slice(0, 16), group: 'tags', keys: [...new Set(checkin.tags)].map((tag) => `tag:${tag}`) }));
}

export type DayValue = { date: string; value: number };

// Days above or below the person's usual range, keyed `${prefix}:below` and
// `${prefix}:above`. Every day is still a record, so a day inside the range
// is a moment with no keys. `at` places each day: sleep at the morning it
// ended, a day total at the end of its day.
export function usualRangeMoments(
  days: DayValue[],
  group: string,
  prefix: string,
  at: (date: string) => string,
): { moments: FactorMoment[]; usualShort: number | null } {
  const values = days.map((day) => day.value).filter((value) => Number.isFinite(value));
  const range = usualRange(values);
  const moments = days
    .filter((day) => Number.isFinite(day.value))
    .map((day) => {
      const place = range ? placeInUsual(day.value, range) : 'within';
      return { at: at(day.date), group, keys: place === 'within' ? [] : [`${prefix}:${place}`] };
    });
  return { moments, usualShort: range || values.length === 0 ? null : values.length };
}

export const sleepAt = (date: string) => `${date}T06:00`;
export const dayEndAt = (date: string) => `${date}T23:59`;

export type MarkedDose = { scheduledFor: string; title: string; status: string };

// A dose marked taken or skipped is a record; one left unmarked is unknown and
// is left out. Only a skip becomes a key: a dose taken is the ordinary state,
// turns up in nearly every stretch, and so could only ever read as "about as
// often as on any day".
export function doseMoments(doses: MarkedDose[]): FactorMoment[] {
  const moments: FactorMoment[] = [];
  for (const dose of doses) {
    const taken = dose.status === 'logged' || dose.status === 'partial' || dose.status === 'replaced';
    const skipped = dose.status === 'skipped';
    if (!taken && !skipped) continue;
    moments.push({ at: dose.scheduledFor.slice(0, 16), group: 'doses', keys: skipped ? [`dose:${dose.title}`] : [] });
  }
  return moments;
}

export type TrackerDay = { trackerId: string; date: string; value: number; lastAt: string };

// A tracker's day is placed at the last entry that day, when its figure was
// complete, so a total never includes an entry made after the outcome.
export function trackerMoments(days: TrackerDay[]): { moments: FactorMoment[]; usualShort: Map<string, number> } {
  const byTracker = new Map<string, TrackerDay[]>();
  for (const day of days) byTracker.set(day.trackerId, [...(byTracker.get(day.trackerId) ?? []), day]);
  const moments: FactorMoment[] = [];
  const usualShort = new Map<string, number>();
  for (const [trackerId, list] of byTracker) {
    const lastAt = new Map(list.map((day) => [day.date, day.lastAt.slice(0, 16)]));
    const made = usualRangeMoments(list, `tr:${trackerId}`, `tr:${trackerId}`, (date) => lastAt.get(date) ?? dayEndAt(date));
    moments.push(...made.moments);
    if (made.usualShort !== null) usualShort.set(trackerId, made.usualShort);
  }
  return { moments, usualShort };
}

// --- Counting ---------------------------------------------------------------

export function findFactorCandidates(input: {
  moments: FactorMoment[];
  groups: FactorGroup[];
  outcomeEnds: (Date | null)[];
  usualEnds: Date[];
  windowHours: number;
  label: (key: string) => string;
}): Map<string, { candidates: FactorCandidate[]; recordedBefore: number; skipped: boolean }> {
  const result = new Map<string, { candidates: FactorCandidate[]; recordedBefore: number; skipped: boolean }>();
  for (const group of input.groups) {
    if (group.dayTotal && input.windowHours < DAY_TOTAL_MIN_HOURS) {
      result.set(group.group, { candidates: [], recordedBefore: 0, skipped: true });
      continue;
    }
    const sorted = input.moments.filter((moment) => moment.group === group.group).sort((a, b) => a.at.localeCompare(b.at));
    const before = input.outcomeEnds.map((end) => (end ? factorKeysInWindow(sorted, end, input.windowHours) : null));
    const usual = input.usualEnds.map((end) => factorKeysInWindow(sorted, end, input.windowHours));
    const counts = new Map<string, number>();
    for (const window of before) for (const key of window ?? []) counts.set(key, (counts.get(key) ?? 0) + 1);
    const candidates = [...counts.entries()]
      .filter(([, count]) => count >= MIN_PATTERN_OCCURRENCES)
      .map(([key, count]) => ({
        key,
        group: group.group,
        label: input.label(key),
        noun: group.noun,
        occurrenceCount: count,
        comparison: compareWindows(key, before, usual),
      }))
      .sort(
        (a, b) =>
          verdictRank(a.comparison.verdict) - verdictRank(b.comparison.verdict) ||
          b.occurrenceCount - a.occurrenceCount ||
          a.label.localeCompare(b.label),
      );
    result.set(group.group, { candidates, recordedBefore: before.filter((window) => window !== null).length, skipped: false });
  }
  return result;
}

// --- Words ------------------------------------------------------------------

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export type FactorOutcomeWords = { one: string; many: string };

// One caption per candidate. Same shape as comparisonSentence in
// lib/patternBasis.ts, with what was recorded named in place of meals.
export function factorComparisonSentence(comparison: PatternComparison, windowHours: number, noun: string): string {
  const before = `${comparison.beforeCount} of the ${comparison.flaresWithMeals} with ${noun} recorded in the ${windowHours} hours before them (${percent(comparison.beforeShare)})`;
  if (comparison.usualShare === null) {
    return `Came before ${before}. There are no other stretches with ${noun} recorded to compare it with yet.`;
  }
  const usual = `${percent(comparison.usualShare)} of any ${windowHours}-hour stretch with ${noun} recorded`;
  if (comparison.verdict === 'more') {
    return `Came before ${before}, against ${usual}. That shows up before them more often than usual, which is worth watching and is not proof of anything.`;
  }
  return `Came before ${before}, against ${usual}. That is about as often as on any day, so this count alone says little.`;
}

// What a family rests on, or why it has nothing to show.
export function familyLines(
  group: FactorGroup,
  counted: { candidates: FactorCandidate[]; recordedBefore: number; skipped: boolean } | undefined,
  outcomes: number,
  windowHours: number,
  words: FactorOutcomeWords,
): string[] {
  if (!counted) return [];
  if (counted.skipped) {
    return [`A day's ${group.noun} is only known once the day is over, so it is counted at the 24 and 48 hour windows.`];
  }
  const lines: string[] = [];
  if (counted.recordedBefore === 0) {
    lines.push(
      `Nothing of this kind was recorded in the ${windowHours} hours before ${outcomes === 1 ? `the 1 ${words.one}` : `any of the ${outcomes} ${words.many}`}.`,
    );
  } else {
    lines.push(
      `${group.noun.charAt(0).toUpperCase()}${group.noun.slice(1)} was recorded in the ${windowHours} hours before ${counted.recordedBefore} of the ${outcomes} ${outcomes === 1 ? words.one : words.many}.`,
    );
    if (counted.candidates.length === 0) lines.push(`No one thing in it came before ${MIN_PATTERN_OCCURRENCES} or more of them.`);
  }
  if (group.usualShort !== null) {
    lines.push(
      `Your usual range needs ${MIN_USUAL_READINGS} days of ${group.noun} to draw from, and there ${group.usualShort === 1 ? 'is 1' : `are ${group.usualShort}`} in this range, so none of them is set apart yet.`,
    );
  }
  return lines;
}

export const FACTOR_CAVEAT =
  'Each count is only against the ones that had that kind of thing recorded before them. Usual means the middle of your days in this range, not what they should be. None of these is shown as the explanation, and the app cannot separate any of them from food or from each other.';

export const NOT_RECORDED_LINE = 'Weather and a menstrual cycle are not recorded in the app yet, so neither can be counted here.';

export const FACTOR_BAND_EMPTY_LINE =
  'Nothing besides food has been recorded in this range yet: no check-in tags, sleep, marked doses, steps, water or tracker entries.';

// Families in a fixed order, each with its candidates and lines. A family
// with no group at all (nothing of that kind ever recorded) is left out.
export function assembleFactorFamilies(
  groups: FactorGroup[],
  counted: Map<string, { candidates: FactorCandidate[]; recordedBefore: number; skipped: boolean }>,
  outcomes: number,
  windowHours: number,
  words: FactorOutcomeWords,
): FactorFamilyResult[] {
  const families: FactorFamilyResult[] = [];
  for (const family of FAMILY_ORDER) {
    const inFamily = groups.filter((group) => group.family === family);
    if (inFamily.length === 0) continue;
    const candidates = inFamily.flatMap((group) => counted.get(group.group)?.candidates ?? []);
    const lines = inFamily.flatMap((group) => familyLines(group, counted.get(group.group), outcomes, windowHours, words));
    families.push({ family, title: FACTOR_FAMILY_TITLES[family], candidates, lines });
  }
  return families;
}
