// The morning check-in, D7 of the competitive build plan (Phase 2,
// 2026-09-26). A Home card and a reminder of its own: last night's sleep,
// resting heart rate and heart rate variability, each beside the person's
// usual range, then two short questions (how they slept, how much energy
// they have) and a note.
//
// Pure. The only import is the usual-range arithmetic, so
// scripts/test_morning_checkin.js can run this without a phone. Nothing
// here scores the night or budgets the day: a reading is set beside what
// this person's readings have been, and the two answers are words the
// person picked, repeated back.

import { usualSentence } from './yourUsual';

// How somebody slept, 1 to 5, low to high like the daily scales.
export const SLEEP_QUALITY_WORDS: [string, string, string, string, string] = [
  'Very poorly',
  'Poorly',
  'Okay',
  'Well',
  'Very well',
];

export function isSleepQuality(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function sleepQualityWord(value: number): string {
  return isSleepQuality(value) ? SLEEP_QUALITY_WORDS[value - 1] : String(value);
}

// One reading as the database holds it, oldest first. Sleep is one figure
// per morning (hours, dated by the morning the night ended), resting heart
// rate one a day, heart rate variability one or more a day.
export type MorningPoint = { date: string; value: number };

export type MorningInputs = {
  today: string;
  yesterday: string;
  sleep: MorningPoint[];
  restingHeartRate: MorningPoint[];
  hrv: MorningPoint[];
};

export type MorningLine = {
  key: 'sleep' | 'restingHeartRate' | 'hrv';
  label: string;
  // "7 h 20 min last night", "58 bpm today".
  reading: string;
  // The usual-range sentence from lib/yourUsual.ts.
  usual: string;
};

export function formatSleepHours(hours: number): string {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const bpm = (value: number) => `${Math.round(value)} bpm`;
const ms = (value: number) => `${Math.round(value)} ms`;

// The latest reading on one of the given days, with every reading up to and
// including it for the usual range.
function latestOn(points: MorningPoint[], days: string[]): { point: MorningPoint; upTo: number[] } | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (days.includes(points[index].date)) {
      return { point: points[index], upTo: points.slice(0, index + 1).map((p) => p.value) };
    }
  }
  return null;
}

function dayWord(date: string, input: MorningInputs): string {
  return date === input.today ? 'today' : 'yesterday';
}

// Last night's sleep is the night that ended this morning, so only a figure
// dated today counts. Resting heart rate and heart rate variability are
// often worked out during the day, so yesterday's stands in until today's
// arrives, and says it is yesterday's.
export function morningLines(input: MorningInputs): MorningLine[] {
  const lines: MorningLine[] = [];
  const sleep = latestOn(input.sleep, [input.today]);
  if (sleep) {
    lines.push({
      key: 'sleep',
      label: 'Sleep',
      reading: `${formatSleepHours(sleep.point.value)} last night`,
      usual: usualSentence(sleep.upTo, formatSleepHours),
    });
  }
  const resting = latestOn(input.restingHeartRate, [input.today, input.yesterday]);
  if (resting) {
    lines.push({
      key: 'restingHeartRate',
      label: 'Resting heart rate',
      reading: `${bpm(resting.point.value)} ${dayWord(resting.point.date, input)}`,
      usual: usualSentence(resting.upTo, bpm),
    });
  }
  const hrv = latestOn(input.hrv, [input.today, input.yesterday]);
  if (hrv) {
    lines.push({
      key: 'hrv',
      label: 'Heart rate variability',
      reading: `${ms(hrv.point.value)} ${dayWord(hrv.point.date, input)}`,
      usual: usualSentence(hrv.upTo, ms),
    });
  }
  return lines;
}

export const NO_READINGS_SENTENCE =
  'Nothing from a watch or ring for last night yet. Sleep, resting heart rate and heart rate variability show here once Health Connect brings them in, turned on in Life > Movement.';

// What was saved this morning, in the person's words.
export function morningSummary(record: { sleepQuality: number | null; energy: number | null; energyWord: string | null }): string {
  const parts: string[] = [];
  if (isSleepQuality(record.sleepQuality)) parts.push(`Slept ${sleepQualityWord(record.sleepQuality).toLowerCase()}`);
  if (record.energy !== null && record.energyWord) parts.push(`energy ${record.energy} (${record.energyWord.toLowerCase()})`);
  if (parts.length === 0) return 'Answered this morning.';
  const joined = parts.join(', ');
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}
