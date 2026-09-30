// Resting heart rate and heart rate variability in a report (K8,
// 2026-09-29). Both come from a watch or ring through Health Connect, the
// same readings Trends > Body Signals shows, and each is set beside the
// person's usual range: the middle 80% of the readings before the latest,
// from lib/yourUsual.ts, so the report and the screen say the same thing.
//
// Usual is what this person's readings have been, never what they should
// be. Nothing here calls a figure high, low, good or bad, and heart rate
// variability is never compared with anybody else's, since devices measure
// it differently.
//
// Pure: lib/reportGenerator.ts reads the readings and hands them over, and
// scripts/test_report_heart.js checks this without a phone.

import type { ReportSectionChart, ReportTableSection } from './reportGenerator';
import type { BodySignalReading } from './trendsMore';
import { MIN_USUAL_READINGS, placeInUsual, usualRange } from './yourUsual';

export const HEART_HEADING = 'Resting heart rate and heart rate variability';

export const HEART_NOTE =
  'From a watch or ring through Health Connect. Your usual range is the middle 80% of the readings before the latest one, and means what your readings have been, not what they should be. Heart rate variability is RMSSD as the device reported it; devices measure it differently, so it is compared only with your earlier readings.';

export const HEART_EMPTY =
  'No resting heart rate or heart rate variability in this range. Both come from a watch or ring through Health Connect, turned on in Life > Movement.';

export const HEART_COLUMNS = ['Measure', 'Latest', 'Average in range', 'Your usual range', 'Readings in range'];

type HeartSignal = 'restingHeartRate' | 'hrv';

const SHAPES: Record<HeartSignal, { title: string; unit: string; chartTitle: string }> = {
  restingHeartRate: { title: 'Resting heart rate', unit: 'bpm', chartTitle: 'Resting heart rate by day (bpm)' },
  hrv: { title: 'Heart rate variability', unit: 'ms', chartTitle: 'Heart rate variability by day, average of the day (ms)' },
};

const ORDER: HeartSignal[] = ['restingHeartRate', 'hrv'];

function shortDate(day: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = day.split('-').map(Number);
  return y && m && d ? `${months[m - 1]} ${d}, ${y}` : day;
}

/** One cell saying the usual range and where the latest sits in it. */
export function usualCell(values: number[], unit: string): string {
  const earlier = values.slice(0, -1);
  const range = usualRange(earlier);
  if (!range) return `Shows after ${MIN_USUAL_READINGS} earlier readings (${earlier.length} so far)`;
  const latest = values[values.length - 1];
  const place = placeInUsual(latest, range);
  const where = place === 'within' ? 'latest inside it' : `latest ${place} it`;
  return `${Math.round(range.low)} to ${Math.round(range.high)} ${unit}, from ${range.count} readings; ${where}`;
}

/** Each day's average, in date order, for the chart. */
function dailyAverages(readings: BodySignalReading[]): { date: string; value: number }[] {
  const byDay = new Map<string, number[]>();
  for (const reading of readings) {
    const list = byDay.get(reading.date) ?? [];
    list.push(reading.value);
    byDay.set(reading.date, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, value: values.reduce((sum, v) => sum + v, 0) / values.length }));
}

/** `readings` is everything held, oldest first, so the usual range can draw
 *  on readings from before the range as well as within it. */
export function heartSection(readings: BodySignalReading[] | null, rangeStart: string, rangeEnd: string): ReportTableSection {
  const base = { kind: 'table' as const, heading: HEART_HEADING, columns: HEART_COLUMNS };
  if (!readings) return { ...base, rows: [], empty: 'Could not be read for this report.' };
  const rows: string[][] = [];
  const charts: ReportSectionChart[] = [];
  for (const key of ORDER) {
    const shape = SHAPES[key];
    const all = readings.filter((r) => r.signal === key).sort((a, b) => a.at.localeCompare(b.at));
    const these = all.filter((r) => r.date >= rangeStart && r.date <= rangeEnd);
    if (these.length === 0) continue;
    const latest = these[these.length - 1];
    const upTo = all.filter((r) => r.at <= latest.at).map((r) => r.value);
    const average = these.reduce((sum, r) => sum + r.value, 0) / these.length;
    rows.push([
      shape.title,
      `${Math.round(latest.value)} ${shape.unit} on ${shortDate(latest.date)}`,
      `${Math.round(average)} ${shape.unit}`,
      usualCell(upTo, shape.unit),
      String(these.length),
    ]);
    const points = dailyAverages(these);
    if (points.length > 1) {
      charts.push({
        title: shape.chartTitle,
        chart: { style: 'dots', startDate: rangeStart, endDate: rangeEnd, points, unit: shape.unit, decimals: 0, slotNoun: 'day' },
      });
    }
  }
  return { ...base, charts, note: HEART_NOTE, rows, empty: HEART_EMPTY };
}
