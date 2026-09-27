// Your week: F13 of the competitive build plan (Phase 2, 2026-09-26). The
// seven days that ended yesterday, set beside the seven before them, read
// from records already kept: which days had meals logged, the flares and
// reactions recorded, sleep and steps where a phone or watch sent them, and
// the mood, energy and stress scales. A Home card shows it, and a reminder
// on the day the person picks says it is there.
//
// Pure. Two rules hold here that hold on Trends:
//  1. A week with nothing logged is said to be not logged, never read as a
//     zero. Being too busy to log is not a week without meals.
//  2. The two weeks are set side by side as numbers and nothing more: no
//     better, worse, up or down, no praise and no reason offered.
// scripts/test_weekly_summary.js sweeps every sentence for verdict words.

import { formatSleepHours } from './morningCheckin';

export type WeekDated = { date: string; value: number };

export type WeekInputs = {
  today: string;
  // Local days with at least one meal logged.
  mealDays: string[];
  // Local days of each flare or reaction recorded, one entry per record.
  flareDays: string[];
  sleep: WeekDated[];
  steps: WeekDated[];
  // One entry per rated check-in, on its local day.
  scales: { date: string; mood: number | null; energy: number | null; stress: number | null }[];
};

export type WeekRange = { start: string; end: string };

export type WeekLine = {
  key: 'meals' | 'flares' | 'sleep' | 'steps' | 'mood' | 'energy' | 'stress';
  sentence: string;
};

export type YourWeek = {
  thisWeek: WeekRange;
  lastWeek: WeekRange;
  heading: string;
  lines: WeekLine[];
  // True when the seven days hold no record of any kind this reads.
  nothingLogged: boolean;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function shiftDay(day: string, days: number): string {
  const date = parseDay(day);
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

function shortDay(day: string): string {
  const date = parseDay(day);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// The seven days ending yesterday, and the seven before those. Today is
// left out because it is still going on.
export function weekRanges(today: string): { thisWeek: WeekRange; lastWeek: WeekRange } {
  return {
    thisWeek: { start: shiftDay(today, -7), end: shiftDay(today, -1) },
    lastWeek: { start: shiftDay(today, -14), end: shiftDay(today, -8) },
  };
}

const inRange = (day: string, range: WeekRange) => day >= range.start && day <= range.end;

function average(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function mealsLine(input: WeekInputs, thisWeek: WeekRange, lastWeek: WeekRange): WeekLine {
  const count = (range: WeekRange) => new Set(input.mealDays.filter((d) => inRange(d, range))).size;
  const now = count(thisWeek);
  const before = count(lastWeek);
  const beforeText = before === 0 ? 'the week before, not logged' : `the week before, ${before}`;
  const sentence =
    now === 0
      ? `Meals: not logged this week (${before === 0 ? 'nor the week before' : `the week before, on ${plural(before, 'day', 'days')}`}).`
      : `Meals logged on ${now} of 7 days (${beforeText}).`;
  return { key: 'meals', sentence };
}

function flaresLine(input: WeekInputs, thisWeek: WeekRange, lastWeek: WeekRange): WeekLine {
  const count = (range: WeekRange) => {
    const days = input.flareDays.filter((d) => inRange(d, range));
    return { records: days.length, days: new Set(days).size };
  };
  const now = count(thisWeek);
  const before = count(lastWeek);
  const beforeText =
    before.records === 0 ? 'the week before, none recorded' : `the week before, ${before.records} on ${plural(before.days, 'day', 'days')}`;
  const sentence =
    now.records === 0
      ? `No flares or reactions recorded (${beforeText}).`
      : `${plural(now.records, 'flare or reaction', 'flares or reactions')} recorded on ${plural(now.days, 'day', 'days')} (${beforeText}).`;
  return { key: 'flares', sentence };
}

function averagedLine(
  key: WeekLine['key'],
  what: string,
  points: WeekDated[],
  thisWeek: WeekRange,
  lastWeek: WeekRange,
  format: (value: number) => string,
  unit: { one: string; many: string },
  blank: string,
): WeekLine | null {
  const pick = (range: WeekRange) => points.filter((p) => inRange(p.date, range));
  const now = pick(thisWeek);
  const before = pick(lastWeek);
  if (now.length === 0 && before.length === 0) return null;
  const beforeAverage = average(before.map((p) => p.value));
  const beforeText = beforeAverage == null ? `the week before, ${blank}` : `the week before, ${format(beforeAverage)}`;
  const nowAverage = average(now.map((p) => p.value));
  const sentence =
    nowAverage == null
      ? `${what}: ${blank} this week (${beforeText}).`
      : `${what} averaged ${format(nowAverage)} across ${plural(now.length, unit.one, unit.many)} (${beforeText}).`;
  return { key, sentence };
}

// A scale is averaged per day first, so three check-ins on one day count as
// that one day rather than outweighing the rest of the week.
function scaleDays(input: WeekInputs, field: 'mood' | 'energy' | 'stress'): WeekDated[] {
  const byDay = new Map<string, number[]>();
  for (const row of input.scales) {
    const value = row[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    byDay.set(row.date, [...(byDay.get(row.date) ?? []), value]);
  }
  return [...byDay.entries()].map(([date, values]) => ({ date, value: average(values) ?? 0 }));
}

const outOfFive = (value: number) => `${value.toFixed(1)} out of 5`;
const stepsText = (value: number) => `${Math.round(value).toLocaleString()} steps`;

export function buildYourWeek(input: WeekInputs): YourWeek {
  const { thisWeek, lastWeek } = weekRanges(input.today);
  const inThisWeek = (day: string) => inRange(day, thisWeek);
  const nothingLogged =
    !input.mealDays.some(inThisWeek) &&
    !input.flareDays.some(inThisWeek) &&
    !input.sleep.some((p) => inThisWeek(p.date)) &&
    !input.steps.some((p) => inThisWeek(p.date)) &&
    !input.scales.some((row) => inThisWeek(row.date));
  const heading = `${shortDay(thisWeek.start)} to ${shortDay(thisWeek.end)}, beside the 7 days before`;
  const nights = { one: 'night', many: 'nights' };
  const days = { one: 'day', many: 'days' };
  const rated = { one: 'rated day', many: 'rated days' };
  const lines = [
    mealsLine(input, thisWeek, lastWeek),
    flaresLine(input, thisWeek, lastWeek),
    averagedLine('sleep', 'Sleep', input.sleep, thisWeek, lastWeek, formatSleepHours, nights, 'not recorded'),
    averagedLine('steps', 'Steps', input.steps, thisWeek, lastWeek, stepsText, days, 'not recorded'),
    averagedLine('mood', 'Mood', scaleDays(input, 'mood'), thisWeek, lastWeek, outOfFive, rated, 'not rated'),
    averagedLine('energy', 'Energy', scaleDays(input, 'energy'), thisWeek, lastWeek, outOfFive, rated, 'not rated'),
    averagedLine('stress', 'Stress', scaleDays(input, 'stress'), thisWeek, lastWeek, outOfFive, rated, 'not rated'),
  ].filter((line): line is WeekLine => line !== null);
  return { thisWeek, lastWeek, heading, lines, nothingLogged };
}

export function nothingLoggedSentence(week: YourWeek): string {
  return `Nothing was logged from ${shortDay(week.thisWeek.start)} to ${shortDay(week.thisWeek.end)}. A week without records reads as not logged here, never as a week of nothing.`;
}

export const YOUR_WEEK_CAPTION =
  'The two weeks are set side by side as they were recorded. A line for sleep, steps or a scale shows only when either week has a reading.';

// What the weekly reminder says. It carries no health content, since a
// notification can be read on a locked screen.
export const YOUR_WEEK_NOTIFICATION_TITLE = 'Your week';
export const YOUR_WEEK_NOTIFICATION_BODY = 'The last seven days, beside the seven before, are on Home.';
