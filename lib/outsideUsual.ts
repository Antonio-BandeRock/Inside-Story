// Outside your usual range, and silent otherwise: F12 of the competitive
// build plan (Phase 2, 2026-09-26). The Morning Check-In sets every reading
// beside the usual range whatever it says. This does the opposite: a Home
// card that speaks only when last night's sleep, a resting heart rate, a
// heart rate variability or yesterday's steps sat outside the middle of
// what this person's readings have been, and says nothing on any other
// day. Trends > Movement gets the count for the last week, each reading
// judged against the readings before it, in the same spirit.
//
// Pure. It describes where a reading sat and never predicts anything from
// it: no "watch out", no "you may", no reason offered. Usual means what the
// readings have been, never what they should be, the same limit
// lib/yourUsual.ts keeps. scripts/test_outside_usual.js sweeps for verdict
// words.

import { formatSleepHours, type MorningInputs, type MorningPoint } from './morningCheckin';
import { placeInUsual, usualRange } from './yourUsual';

export type OutsideUsualInputs = MorningInputs & { steps: MorningPoint[] };

export type OutsideUsualLine = {
  key: 'sleep' | 'restingHeartRate' | 'hrv' | 'steps';
  sentence: string;
};

const bpm = (value: number) => `${Math.round(value)} bpm`;
const ms = (value: number) => `${Math.round(value)} ms`;
export const formatSteps = (value: number) => `${Math.round(value).toLocaleString()} steps`;

function latestOn(points: MorningPoint[], days: string[]): { point: MorningPoint; earlier: number[] } | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (days.includes(points[index].date)) {
      return { point: points[index], earlier: points.slice(0, index).map((p) => p.value) };
    }
  }
  return null;
}

function lineFor(
  key: OutsideUsualLine['key'],
  what: string,
  found: { point: MorningPoint; earlier: number[] } | null,
  format: (value: number) => string,
): OutsideUsualLine | null {
  if (!found) return null;
  const range = usualRange(found.earlier);
  if (!range) return null;
  const place = placeInUsual(found.point.value, range);
  if (place === 'within') return null;
  return {
    key,
    sentence: `${what}, ${format(found.point.value)}, was ${place} your usual range of ${format(range.low)} to ${format(range.high)}.`,
  };
}

// Sleep counts only for the night that ended this morning. Resting heart
// rate and heart rate variability take today's, or yesterday's until
// today's arrives. Steps take yesterday's, since today's count is still
// going up and would read as low every morning.
export function outsideUsualLines(input: OutsideUsualInputs): OutsideUsualLine[] {
  const when = (date: string) => (date === input.today ? 'today' : 'yesterday');
  const resting = latestOn(input.restingHeartRate, [input.today, input.yesterday]);
  const hrv = latestOn(input.hrv, [input.today, input.yesterday]);
  const lines = [
    lineFor('sleep', 'Sleep last night', latestOn(input.sleep, [input.today]), formatSleepHours),
    lineFor('restingHeartRate', `Resting heart rate ${resting ? when(resting.point.date) : ''}`.trim(), resting, bpm),
    lineFor('hrv', `Heart rate variability ${hrv ? when(hrv.point.date) : ''}`.trim(), hrv, ms),
    lineFor('steps', 'Steps yesterday', latestOn(input.steps, [input.yesterday]), formatSteps),
  ];
  return lines.filter((line): line is OutsideUsualLine => line !== null);
}

export const OUTSIDE_USUAL_CAPTION =
  'Only a reading outside your usual range shows here, and on other days this stays empty. Usual means what your readings have been, not what they should be.';

// The last `recent` readings, each judged against every reading before it.
// A reading with too few before it to draw a range from is left out and
// counted as not judged.
export type RecentOutside = { judged: number; below: number; above: number };

export const RECENT_READINGS = 7;

export function recentOutside(values: number[], recent = RECENT_READINGS): RecentOutside {
  const result: RecentOutside = { judged: 0, below: 0, above: 0 };
  const start = Math.max(0, values.length - recent);
  for (let index = start; index < values.length; index += 1) {
    const range = usualRange(values.slice(0, index));
    if (!range) continue;
    result.judged += 1;
    const place = placeInUsual(values[index], range);
    if (place === 'below') result.below += 1;
    else if (place === 'above') result.above += 1;
  }
  return result;
}

// Silent when every judged reading sat inside the range, or none could be
// judged: the chart and its caption already say where the latest one is.
export function recentOutsideSentence(counts: RecentOutside, many: string): string | null {
  if (counts.below + counts.above === 0) return null;
  const were = (n: number) => `${n} ${n === 1 ? 'was' : 'were'}`;
  const said =
    counts.below > 0 && counts.above > 0
      ? `${were(counts.below)} below your usual range and ${counts.above} above it`
      : counts.below > 0
        ? `${were(counts.below)} below your usual range`
        : `${were(counts.above)} above your usual range`;
  return `Of the last ${counts.judged} ${many} with enough readings before them to judge, ${said}, each set beside the readings that came before it.`;
}
