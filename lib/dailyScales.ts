// Mood, energy and stress on a 1 to 5 scale (D1 of the competitive build
// plan, 2026-09-26). Three optional columns on wellbeing_checkins, answered
// on Home's Today's Check-In and on Signals > General Note, charted on
// Trends > Symptoms & Flares and offered to Pattern Finder as something to
// look for patterns before.
//
// Pure and free of runtime imports, so scripts/test_daily_scales.js can run
// it without a phone. Nothing here scores anybody: a 2 is a 2, the words
// under each number describe the answer rather than judge it, and no
// reading is called too low, too high or healthy.

export type DailyScaleKey = 'mood' | 'energy' | 'stress';

export type DailyScaleValues = {
  mood: number | null;
  energy: number | null;
  stress: number | null;
};

export type DailyScale = {
  key: DailyScaleKey;
  label: string;
  question: string;
  /** Index 0 is the word for 1, index 4 the word for 5. */
  words: [string, string, string, string, string];
};

// Mood and energy run low to high. Stress runs the same way, from none to a
// great deal, so on every scale a bigger number means more of the thing
// named, and nobody has to remember which end is which.
export const DAILY_SCALES: DailyScale[] = [
  { key: 'mood', label: 'Mood', question: 'How is your mood?', words: ['Very low', 'Low', 'Okay', 'Good', 'Very good'] },
  { key: 'energy', label: 'Energy', question: 'How much energy do you have?', words: ['Very low', 'Low', 'Some', 'Good', 'Plenty'] },
  { key: 'stress', label: 'Stress', question: 'How much stress are you under?', words: ['None', 'A little', 'Some', 'A lot', 'A great deal'] },
];

export const EMPTY_DAILY_SCALES: DailyScaleValues = { mood: null, energy: null, stress: null };

export function isScaleValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function scaleOf(key: DailyScaleKey): DailyScale {
  return DAILY_SCALES.find((scale) => scale.key === key)!;
}

export function scaleWord(key: DailyScaleKey, value: number): string {
  return isScaleValue(value) ? scaleOf(key).words[value - 1] : String(value);
}

export function hasAnyScale(values: DailyScaleValues): boolean {
  return DAILY_SCALES.some((scale) => isScaleValue(values[scale.key]));
}

/** "Mood 4 (Good), Energy 2 (Low)", or null when none was answered. */
export function describeScales(values: DailyScaleValues): string | null {
  const parts = DAILY_SCALES.filter((scale) => isScaleValue(values[scale.key])).map((scale) => {
    const value = values[scale.key]!;
    return `${scale.label} ${value} (${scale.words[value - 1]})`;
  });
  return parts.length > 0 ? parts.join(', ') : null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The local 'YYYY-MM-DDTHH:mm' every check-in form writes. */
export function localStamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Until 1.0.53.4 Home's Today's Check-In wrote logged_at through
// toISOString(), which is UTC, while every Signals form wrote local time. A
// stamp carrying a zone is read back through a Date so an evening answer
// west of Greenwich lands on its own day rather than tomorrow; a plain one
// is already local.
export function localStampOf(loggedAt: string): string {
  if (!/[zZ]$|[+-]\d\d:?\d\d$/.test(loggedAt)) return loggedAt.slice(0, 16);
  const parsed = new Date(loggedAt);
  return Number.isNaN(parsed.getTime()) ? loggedAt.slice(0, 16) : localStamp(parsed);
}

export function localDayOf(loggedAt: string): string {
  return localStampOf(loggedAt).slice(0, 10);
}

export type ScaledCheckin = DailyScaleValues & { loggedAt: string };

export type DailyScalePoint = { date: string; value: number };

// One point per day for one scale: the latest answer that day, since a
// second answer later in the day is the person correcting or updating the
// first. A day with no answer has no point at all, never a zero.
export function dailyScaleSeries(checkins: ScaledCheckin[], key: DailyScaleKey, rangeStart: string): DailyScalePoint[] {
  const latest = new Map<string, { stamp: string; value: number }>();
  for (const checkin of checkins) {
    const value = checkin[key];
    if (!isScaleValue(value)) continue;
    const stamp = localStampOf(checkin.loggedAt);
    const date = stamp.slice(0, 10);
    if (date < rangeStart) continue;
    const seen = latest.get(date);
    if (!seen || stamp >= seen.stamp) latest.set(date, { stamp, value });
  }
  return [...latest.entries()].map(([date, { value }]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

/** "Answered on 12 of the 30 days", the count of blank days said in words. */
export function answeredSentence(points: DailyScalePoint[], days: number): string {
  if (points.length === 0) return `Not answered on any of the ${days} days.`;
  return `Answered on ${points.length} of the ${days} days. A day with no answer is left blank rather than drawn as a number.`;
}
