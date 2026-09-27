// My daily list, D6 of the competitive build plan (Phase 2, 2026-09-26).
// The symptoms somebody chose to rate every day, pinned to the top of Home's
// Today's Check-In and rated 0 to 4. The 0 is "None today" and is stored
// like any other rating (checkin_tags.severity = 0), because a day a symptom
// was looked for and was not there is the good day Pattern Finder has never
// had: without it, a day with no flare logged could as easily be a day
// nobody opened the app.
//
// 1 to 4 are the same steps the Signals forms use (lib/severityScale.ts), so
// "Moderate" on the daily list and "Moderate" on a flare are one word.
//
// Pure and free of runtime imports (scripts/test_daily_list.js loads it
// directly).

export const DAILY_LIST_META_KEY = 'daily_symptom_list';

export const NONE_TODAY = 0;

export const DAILY_RATINGS: { value: number; label: string }[] = [
  { value: 0, label: 'None today' },
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
  { value: 4, label: 'Very severe' },
];

export function dailyRatingLabel(value: number): string {
  return DAILY_RATINGS.find((rating) => rating.value === value)?.label ?? String(value);
}

// The stored list, tolerant of anything that is not a list of strings, and
// without repeats.
export function parseDailyList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    for (const code of parsed) if (typeof code === 'string' && code) seen.add(code);
    return [...seen];
  } catch {
    return [];
  }
}

export function serializeDailyList(codes: string[]): string {
  return JSON.stringify([...new Set(codes)]);
}

// What a check-in saves: the tags picked in the rest of the form plus every
// rated item on the list, with the list's ratings as each one's severity.
// A listed item left unrated is not saved at all, since nothing was said
// about it. A tag on the list that was also picked below takes the list's
// rating.
export function mergeDailyRatings(
  pickedTags: string[],
  pickedSeverity: Record<string, number>,
  list: string[],
  ratings: Record<string, number>,
): { tags: string[]; tagSeverity: Record<string, number> } {
  const tags = [...pickedTags];
  const tagSeverity: Record<string, number> = { ...pickedSeverity };
  for (const code of list) {
    const rating = ratings[code];
    if (rating === undefined) continue;
    if (!tags.includes(code)) tags.push(code);
    tagSeverity[code] = rating;
  }
  return { tags, tagSeverity };
}

// Ratings to seed the form with when it reopens on a saved check-in.
export function ratingsFromSaved(
  list: string[],
  saved: { tags: string[]; tagSeverity: Record<string, number>; noneToday?: string[] } | null,
): Record<string, number> {
  const ratings: Record<string, number> = {};
  if (!saved) return ratings;
  for (const code of list) {
    if (saved.noneToday?.includes(code)) ratings[code] = NONE_TODAY;
    else if (saved.tags.includes(code) && saved.tagSeverity[code] !== undefined) ratings[code] = saved.tagSeverity[code];
  }
  return ratings;
}

// The line Home shows once a check-in is saved.
export function noneTodaySentence(labels: string[]): string | null {
  if (labels.length === 0) return null;
  return `None today: ${labels.join(', ')}`;
}

// ---- Pattern Finder -------------------------------------------------------

export type DailyListCheckin = {
  loggedAt: string;
  /** Codes rated above none. */
  tags: string[];
  tagSeverity: Record<string, number>;
  /** Codes rated None today. */
  noneToday?: string[];
};

// A daily-list day counts toward the outcome when anything on it was rated
// Moderate or worse. Mild is left out so an ordinary low hum is not read as
// a bad day.
export const LIST_OUTCOME_MIN = 2;

type DayAnswer<T> = { stamp: string; checkin: T };

// The latest check-in each local day that rated anything on the daily list,
// since a second answer that day is a correction. `localStampOf` is passed
// in so this file keeps no runtime imports.
function latestListAnswerByDay<T extends DailyListCheckin>(
  checkins: T[],
  rangeStart: string,
  localStampOf: (loggedAt: string) => string,
): Map<string, DayAnswer<T>> {
  const latest = new Map<string, DayAnswer<T>>();
  for (const checkin of checkins) {
    const rated =
      (checkin.noneToday?.length ?? 0) > 0 || checkin.tags.some((code) => checkin.tagSeverity[code] !== undefined);
    if (!rated) continue;
    const stamp = localStampOf(checkin.loggedAt);
    const day = stamp.slice(0, 10);
    if (day < rangeStart) continue;
    const seen = latest.get(day);
    if (!seen || stamp >= seen.stamp) latest.set(day, { stamp, checkin });
  }
  return latest;
}

// Days anything was rated Moderate or worse, at the time of that answer.
export function listOutcomeEvents<T extends DailyListCheckin>(
  checkins: T[],
  rangeStart: string,
  localStampOf: (loggedAt: string) => string,
): (T & { loggedAt: string })[] {
  return [...latestListAnswerByDay(checkins, rangeStart, localStampOf).values()]
    .filter(({ checkin }) => checkin.tags.some((code) => (checkin.tagSeverity[code] ?? 0) >= LIST_OUTCOME_MIN))
    .map(({ stamp, checkin }) => ({ ...checkin, loggedAt: stamp }))
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

// Days everything rated was None today: at least one None today, nothing
// above it. These are the moments a food's count is also taken before, so
// a candidate says how often it came before a day with nothing on the list.
export function noneTodayDays<T extends DailyListCheckin>(
  checkins: T[],
  rangeStart: string,
  localStampOf: (loggedAt: string) => string,
): string[] {
  return [...latestListAnswerByDay(checkins, rangeStart, localStampOf).values()]
    .filter(({ checkin }) => (checkin.noneToday?.length ?? 0) > 0 && !checkin.tags.some((code) => (checkin.tagSeverity[code] ?? 0) > 0))
    .map(({ stamp }) => stamp)
    .sort();
}
