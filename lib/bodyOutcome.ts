// Body readings as outcomes in Pattern Finder, F2 of the competitive build
// plan (2026-09-30, 1.0.57.27). Until now Pattern Finder counted what came
// before a flare, a reaction or a kind of day. A watch or ring sends
// resting heart rate, heart rate variability, blood oxygen, glucose and skin
// temperature through Health Connect, and each of those can be the outcome
// too: the days a reading was above, or below, the person's usual range.
//
// Pure, apart from the usual range it borrows from lib/yourUsual.ts, so
// scripts/test_body_outcome.js checks every figure and sentence here.
//
// Three rules hold it up.
//
//   1. Usual is the middle 80% of the person's own days with a reading in
//      the range, never a population figure and never a target. Above and
//      below are named as above and below, and neither is called good or bad.
//   2. A day with no reading is a gap. It is never counted as inside the
//      range, so every count after a food or a factor names how many of the
//      days had a reading at all.
//   3. "After" is a count of what was read, never what something did. The
//      sentences say how often, and nothing here is a cause.

import { placeInUsual, usualRange, type UsualPlace, type UsualRange } from './yourUsual';
import type { BodySignalKey } from './trendsMore';
import { BODY_SIGNAL_NAMES, type BodyOutcomeSide } from './patternOutcome';

export { BODY_SIGNAL_NAMES };

export type BodyReadingIn = { signal: BodySignalKey; date: string; at: string; value: number };

// One figure a day: the average of that day's readings, placed at the last
// reading, when the figure was complete. A day average of heart rate through
// the day is placed at the end of its day for the same reason.
export type BodyDayFigure = { date: string; at: string; value: number };

export function bodyDayFigures(readings: BodyReadingIn[], signal: BodySignalKey): BodyDayFigure[] {
  const byDay = new Map<string, { sum: number; count: number; at: string }>();
  for (const reading of readings) {
    if (reading.signal !== signal || !Number.isFinite(reading.value)) continue;
    const day = byDay.get(reading.date) ?? { sum: 0, count: 0, at: '' };
    day.sum += reading.value;
    day.count += 1;
    const at = reading.at.slice(0, 16);
    if (at > day.at) day.at = at;
    byDay.set(reading.date, day);
  }
  return [...byDay.entries()]
    .map(([date, day]) => ({
      date,
      at: signal === 'heartRate' || !day.at.startsWith(date) ? `${date}T23:59` : day.at,
      value: day.sum / day.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type PlacedFigure = BodyDayFigure & { place: UsualPlace };

export type BodyOutcomeRead = {
  /** Every day in the range with a reading, with where it sits in the usual range. */
  placed: PlacedFigure[];
  /** The days that count as the outcome, oldest first. */
  events: PlacedFigure[];
  range: UsualRange | null;
  /** Days with a reading in the range, whether or not a range could be drawn. */
  daysRead: number;
};

// The usual range is drawn from every day with a reading in the range, the
// same way Pattern Finder draws it for sleep and steps (lib/patternFactors.ts).
export function readBodyOutcome(figures: BodyDayFigure[], side: BodyOutcomeSide, rangeStart: string, today: string): BodyOutcomeRead {
  const inRange = figures.filter((figure) => figure.date >= rangeStart && figure.date <= today);
  const range = usualRange(inRange.map((figure) => figure.value));
  if (!range) return { placed: [], events: [], range: null, daysRead: inRange.length };
  const placed = inRange.map((figure) => ({ ...figure, place: placeInUsual(figure.value, range) }));
  return { placed, events: placed.filter((figure) => figure.place === side), range, daysRead: inRange.length };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalMinute(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHours(at: string, hours: number): string {
  const [datePart, timePart = '00:00'] = at.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  return toLocalMinute(new Date(y, m - 1, d, (h || 0) + hours, mi || 0));
}

export type AfterCounts = {
  /** Days the thing happened, each counted once from its first time that day. */
  occasions: number;
  /** Of those, the days whose following window had a reading. */
  read: number;
  within: number;
  above: number;
  below: number;
};

// For each day something happened, the readings in the `hours` after the
// first time it happened that day. A window holding more than one day's
// figure is counted by the first of them.
export function afterCounts(occurrences: string[], placed: PlacedFigure[], hours: number): AfterCounts {
  const firstByDay = new Map<string, string>();
  for (const at of occurrences) {
    const minute = at.slice(0, 16);
    const day = minute.slice(0, 10);
    const seen = firstByDay.get(day);
    if (!seen || minute < seen) firstByDay.set(day, minute);
  }
  const sorted = [...placed].sort((a, b) => a.at.localeCompare(b.at));
  const counts: AfterCounts = { occasions: firstByDay.size, read: 0, within: 0, above: 0, below: 0 };
  for (const start of firstByDay.values()) {
    const end = addHours(start, hours);
    const next = sorted.find((figure) => figure.at > start && figure.at <= end);
    if (!next) continue;
    counts.read += 1;
    counts[next.place] += 1;
  }
  return counts;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// The line under each candidate. `happened` reads after "On 11 days":
// "it was eaten", "it was in a meal", "it was recorded".
export function afterSentence(counts: AfterCounts, signal: BodySignalKey, hours: number, happened: string): string | null {
  if (counts.occasions === 0) return null;
  const name = BODY_SIGNAL_NAMES[signal];
  const days = `On ${plural(counts.occasions, 'day', 'days')} ${happened}.`;
  if (counts.read === 0) {
    return `${days} ${name.charAt(0).toUpperCase()}${name.slice(1)} was not read in the ${hours} hours after any of them.`;
  }
  const parts = [`inside your usual range on ${counts.within}`];
  if (counts.above > 0) parts.push(`above it on ${counts.above}`);
  if (counts.below > 0) parts.push(`below it on ${counts.below}`);
  const of = counts.read === counts.occasions ? (counts.read === 1 ? 'it' : `all ${counts.read}`) : `${counts.read} of them`;
  return `${days} In the ${hours} hours after, ${name} was read on ${of}: ${parts.join(', ')}.`;
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatBodyValue(signal: BodySignalKey, value: number): string {
  switch (signal) {
    case 'restingHeartRate':
    case 'heartRate':
      return `${Math.round(value)} bpm`;
    case 'hrv':
      return `${Math.round(value)} ms`;
    case 'spo2':
      return `${round(value, 1)}%`;
    case 'glucose':
      return `${round(value, 1)} mmol/L`;
    case 'skinTemperature': {
      const shown = round(value, 1);
      return `${shown > 0 ? '+' : ''}${shown} °C`;
    }
  }
}

// What the counts rest on, shown under the outcome pills.
export function bodyOutcomeNotes(read: BodyOutcomeRead, signal: BodySignalKey, minDays: number): string[] {
  const name = BODY_SIGNAL_NAMES[signal];
  if (read.daysRead === 0) {
    return [`No ${name} readings fall in this range. They come in from a watch, ring or meter through Health Connect, set up in Profile.`];
  }
  if (!read.range) {
    return [
      `Your usual range needs ${minDays} days with a ${name} reading to draw from, and there ${read.daysRead === 1 ? 'is 1' : `are ${read.daysRead}`} in this range, so no day is set apart yet.`,
    ];
  }
  const span = `${formatBodyValue(signal, read.range.low)} to ${formatBodyValue(signal, read.range.high)}`;
  return [
    `Your usual ${name} in this range is ${span}, the middle of your ${read.daysRead} days with a reading. Usual means what your readings have been, not what they should be.`,
    `A day with no reading is left out of every count below rather than read as inside the range.`,
  ];
}
