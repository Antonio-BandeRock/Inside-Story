// Trackers the person names (D2, 2026-09-26). Somebody wants to follow a
// thing this app never thought to ask about: brain fog, hot flushes, cups
// of coffee, minutes outside, a morning temperature. They name it, pick
// what kind of number it is, and log it on Signals > My Trackers; Trends >
// My Trackers charts it, and Pattern Finder for any factor (F1) reads the
// same daily values.
//
// Pure, no imports at run time, so scripts/test_custom_trackers.js can
// check every rule and sentence here without a phone. The reading and
// writing is lib/customTrackersDb.ts.
//
// Four kinds, and a tracker's kind never changes once it is made, since a
// 3 on a scale and a 3 as a count are different things and history would
// be misread. A day with nothing logged is a gap, never a zero: being too
// busy to log is not a day of none.

export type TrackerKind = 'scale' | 'count' | 'duration' | 'measurement';

export type CustomTracker = {
  id: string;
  name: string;
  kind: TrackerKind;
  /** What a count or a measurement is in ("cups", "°C"); null otherwise. */
  unit: string | null;
  retiredAt: string | null;
  entryCount: number;
};

export type TrackerEntry = {
  id: string;
  trackerId: string;
  value: number;
  /** A local stamp, "YYYY-MM-DDTHH:mm". */
  loggedAt: string;
  notes: string | null;
};

export type TrackerPoint = { date: string; value: number };

export const TRACKER_KINDS: { key: TrackerKind; label: string; line: string; takesUnit: boolean }[] = [
  { key: 'scale', label: 'Scale of 1 to 5', line: 'How much of something there was, where 1 is the least and 5 the most.', takesUnit: false },
  { key: 'count', label: 'Count', line: 'How many times, or how many of something. A day adds up.', takesUnit: true },
  { key: 'duration', label: 'Length of time', line: 'How long something lasted, in hours and minutes. A day adds up.', takesUnit: false },
  { key: 'measurement', label: 'Measurement', line: 'A reading in a unit you choose, such as a temperature or a weight.', takesUnit: true },
];

export function trackerKindLabel(kind: TrackerKind): string {
  return TRACKER_KINDS.find((entry) => entry.key === kind)?.label ?? kind;
}

export function isTrackerKind(value: unknown): value is TrackerKind {
  return TRACKER_KINDS.some((entry) => entry.key === value);
}

/** Whether several entries on one day are added together or averaged. */
export function dailyMode(kind: TrackerKind): 'total' | 'average' {
  return kind === 'count' || kind === 'duration' ? 'total' : 'average';
}

// Names ------------------------------------------------------------------

export function cleanTrackerName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** A problem with a name, or null when it can be saved. Names are compared
 *  without regard to case, and a retired tracker still holds its name, so
 *  a second "Brain fog" is refused and the first can be brought back. */
export function trackerNameProblem(name: string, trackers: readonly CustomTracker[], exceptId?: string): string | null {
  const cleaned = cleanTrackerName(name);
  if (!cleaned) return 'Give the tracker a name first.';
  if (cleaned.length > 60) return 'Keep the name to 60 characters or fewer.';
  const clash = trackers.find((tracker) => tracker.id !== exceptId && tracker.name.toLowerCase() === cleaned.toLowerCase());
  if (!clash) return null;
  return clash.retiredAt
    ? `"${clash.name}" is already under Past trackers. Bring it back from there to keep adding to it.`
    : `There is already a tracker called "${clash.name}".`;
}

// Values -----------------------------------------------------------------

export type TrackerValueInput = { text: string; hours?: string; minutes?: string };

/** Reads what was typed or tapped into the number stored, or says what is
 *  missing. A count of zero and a length of time of zero are answers. */
export function parseTrackerValue(kind: TrackerKind, input: TrackerValueInput): { value: number } | { problem: string } {
  if (kind === 'duration') {
    const hoursText = (input.hours ?? '').trim();
    const minutesText = (input.minutes ?? '').trim();
    if (!hoursText && !minutesText) return { problem: 'Enter how long it lasted, in hours, minutes or both.' };
    const hours = hoursText ? Number(hoursText) : 0;
    const minutes = minutesText ? Number(minutesText) : 0;
    if (!Number.isInteger(hours) || hours < 0 || hours > 48) return { problem: 'Enter the hours as a whole number from 0 to 48.' };
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return { problem: 'Enter the minutes as a whole number from 0 to 59.' };
    return { value: hours * 60 + minutes };
  }
  const text = input.text.trim().replace(',', '.');
  if (!text) {
    return { problem: kind === 'scale' ? 'Pick a number from 1 to 5.' : 'Enter a number first.' };
  }
  const value = Number(text);
  if (!Number.isFinite(value)) return { problem: 'Enter a number, such as 3 or 36.6.' };
  if (kind === 'scale') {
    return Number.isInteger(value) && value >= 1 && value <= 5 ? { value } : { problem: 'Pick a number from 1 to 5.' };
  }
  if (kind === 'count') {
    return Number.isInteger(value) && value >= 0 && value <= 100000
      ? { value }
      : { problem: 'Enter the count as a whole number. Zero is a fine answer.' };
  }
  return { value };
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatMinutes(minutes: number): string {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** One value as it reads on screen: "3 of 5", "4 cups", "1 h 20 min". */
export function formatTrackerValue(tracker: Pick<CustomTracker, 'kind' | 'unit'>, value: number): string {
  if (tracker.kind === 'duration') return formatMinutes(value);
  const shown = String(roundTo(value, 2));
  if (tracker.kind === 'scale') return `${shown} of 5`;
  return tracker.unit ? `${shown} ${tracker.unit}` : shown;
}

// Days -------------------------------------------------------------------

/**
 * One point per day that has anything logged, from `rangeStart` on. A count
 * or a length of time adds up over the day; a scale or a measurement is the
 * average of that day's entries. Days with nothing are left out, so a chart
 * shows them as a gap.
 */
export function trackerDailySeries(kind: TrackerKind, entries: readonly TrackerEntry[], rangeStart: string): TrackerPoint[] {
  const byDay = new Map<string, number[]>();
  for (const entry of entries) {
    const day = entry.loggedAt.slice(0, 10);
    if (day < rangeStart || !Number.isFinite(entry.value)) continue;
    const list = byDay.get(day) ?? [];
    list.push(entry.value);
    byDay.set(day, list);
  }
  const total = dailyMode(kind) === 'total';
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => {
      const sum = values.reduce((acc, value) => acc + value, 0);
      return { date, value: roundTo(total ? sum : sum / values.length, 2) };
    });
}

/** Where a chart's y axis runs for a tracker, so a scale always shows 1 to 5
 *  and anything else fits what was logged. */
export function trackerChartBounds(kind: TrackerKind, points: readonly TrackerPoint[]): { yMin: number; yMax: number } {
  if (kind === 'scale') return { yMin: 1, yMax: 5 };
  if (points.length === 0) return { yMin: 0, yMax: 1 };
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (kind === 'measurement') {
    const pad = high === low ? Math.max(1, Math.abs(high) * 0.05) : (high - low) * 0.1;
    return { yMin: roundTo(low - pad, 2), yMax: roundTo(high + pad, 2) };
  }
  return { yMin: 0, yMax: Math.max(1, high) };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The line under a tracker's chart. Counts days logged against days in
 *  the range, says how a day is worked out, and gives the lowest and
 *  highest day. Never says whether any of it is good. */
export function trackerSummarySentence(
  tracker: Pick<CustomTracker, 'kind' | 'unit'>,
  points: readonly TrackerPoint[],
  days: number,
): string {
  if (points.length === 0) return `Nothing logged in the last ${plural(days, 'day', 'days')}.`;
  const how =
    dailyMode(tracker.kind) === 'total'
      ? 'Each point is that day added up.'
      : 'Each point is that day, averaged when you logged more than once.';
  const parts = [`Logged on ${points.length} of the last ${plural(days, 'day', 'days')}.`, how];
  if (points.length > 1) {
    const values = points.map((point) => point.value);
    parts.push(
      `The lowest day was ${formatTrackerValue(tracker, Math.min(...values))} and the highest ${formatTrackerValue(tracker, Math.max(...values))}.`,
    );
  }
  const blank = days - points.length;
  if (blank > 0) parts.push(`${plural(blank, 'day has', 'days have')} nothing logged and show as a gap.`);
  return parts.join(' ');
}

// Removing ---------------------------------------------------------------

/**
 * A tracker with anything logged is retired rather than deleted, so what
 * was logged stays readable on Trends and it can be brought back; one with
 * nothing logged is simply deleted, since nothing refers to it.
 */
export function planTrackerRemoval(tracker: Pick<CustomTracker, 'entryCount'>): 'retire' | 'delete' {
  return tracker.entryCount > 0 ? 'retire' : 'delete';
}

export function trackerRemovalSentence(tracker: Pick<CustomTracker, 'name' | 'entryCount'>): string {
  if (planTrackerRemoval(tracker) === 'delete') return `"${tracker.name}" has nothing logged, so it will be deleted.`;
  return `"${tracker.name}" moves to Past trackers. Its ${plural(tracker.entryCount, 'entry stays', 'entries stay')} on Trends > My Trackers, and you can bring it back to keep adding to it.`;
}

/** Trackers that can take a new entry, in alphabetical order. */
export function activeTrackers(trackers: readonly CustomTracker[]): CustomTracker[] {
  return trackers
    .filter((tracker) => !tracker.retiredAt)
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

/** Retired trackers, in alphabetical order. */
export function pastTrackers(trackers: readonly CustomTracker[]): CustomTracker[] {
  return trackers
    .filter((tracker) => tracker.retiredAt)
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

export const TRACKERS_EMPTY_LINE =
  'Nothing tracked here yet. Name something this app does not ask about, such as brain fog, cups of coffee or minutes outside, and log it here whenever you like.';

export const TRENDS_TRACKERS_EMPTY_LINE =
  'No trackers made yet. Make one on Signals > My Trackers and each one gets a chart here.';
