// The night after a tag, F20 (2026-10-01). For each check-in tag logged in
// the range, the next night's sleep, resting heart rate and heart rate
// variability, each set beside the person's usual range for that reading.
// A band on Trends > Nights. Pure, with no database, so
// scripts/test_tag_nights.js can check it.
//
// Dating: sleep is filed under the morning it ended, and the overnight
// resting heart rate and HRV under the same morning, so the night after a
// tag logged on day D is the record dated D + 1.
//
// Every count names its denominator (days tagged, and how many of the
// nights after them had a reading), and nothing says why a night went the
// way it did: a tag and the night after it can still be chance.
import { plural, type ReadingBand, type ReadingItem } from './readingBands';
import type { TagMarkRow } from './tagMarks';
import { placeInUsual, usualRange, MIN_USUAL_READINGS } from './yourUsual';

export type NightReading = { date: string; value: number };

export type TagNightsInputs = {
  range: { start: string; end: string };
  // From tagDays in lib/tagMarks.ts: local days inside the range.
  tags: TagMarkRow[];
  // One reading a morning, oldest first, over a longer stretch than the
  // range, so the usual range has enough to be drawn from.
  sleep: NightReading[];
  restingHeartRate: NightReading[];
  hrv: NightReading[];
};

export type NightMeasure = 'sleep' | 'restingHeartRate' | 'hrv';

export const NIGHT_MEASURES: { key: NightMeasure; title: string; icon: ReadingBand['icon']; format: (value: number) => string }[] = [
  { key: 'sleep', title: 'Sleep the night after a tag', icon: 'bed-outline', format: (v) => `${Math.round(v * 10) / 10} h` },
  { key: 'restingHeartRate', title: 'Resting heart rate the night after a tag', icon: 'heart-outline', format: (v) => `${Math.round(v)} bpm` },
  { key: 'hrv', title: 'Heart rate variability the night after a tag', icon: 'pulse-outline', format: (v) => `${Math.round(v)} ms` },
];

// At most this many tags in one band, the tag on most days first.
export const MAX_TAGS_SHOWN = 8;

export const TAG_NIGHTS_NOTE =
  'This shows what followed a tag, not why. Many things change a night, and two things on neighbouring days can still be chance. Usual means what your readings have been, not what they should be.';

export function nextDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return date.toISOString().slice(0, 10);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// One caption for one tag and one reading.
export function tagNightCaption(
  tagDates: string[],
  byDate: Map<string, number>,
  usual: ReturnType<typeof usualRange>,
  format: (value: number) => string,
): string | null {
  const values = tagDates.map((day) => byDate.get(nextDay(day))).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  const parts = [`${values.length} of the ${plural(tagDates.length, 'night')} after had a reading, the middle ${format(median(values) as number)}.`];
  if (usual) {
    const counts = { below: 0, within: 0, above: 0 };
    for (const value of values) counts[placeInUsual(value, usual)] += 1;
    parts.push(`${counts.below} below your usual, ${counts.within} inside it, ${counts.above} above it.`);
  }
  return parts.join(' ');
}

export function buildTagNightsBands(input: TagNightsInputs): ReadingBand[] {
  const tags = input.tags.filter((tag) => tag.dates.length > 0).slice(0, MAX_TAGS_SHOWN);
  if (tags.length === 0) return [];
  const bands: ReadingBand[] = [];
  for (const measure of NIGHT_MEASURES) {
    const readings = input[measure.key];
    if (readings.length === 0) continue;
    const byDate = new Map(readings.map((r) => [r.date, r.value]));
    const usual = usualRange(readings.map((r) => r.value));
    const items: ReadingItem[] = [];
    for (const tag of tags) {
      const caption = tagNightCaption(tag.dates, byDate, usual, measure.format);
      if (caption) items.push({ key: tag.code, title: `${tag.label}, ${plural(tag.dates.length, 'day')} tagged`, caption });
    }
    if (items.length === 0) continue;
    const inRange = readings.filter((r) => r.date > input.range.start && r.date <= nextDay(input.range.end)).map((r) => r.value);
    const lines: string[] = [];
    const all = median(inRange);
    if (all !== null) lines.push(`Every night in this range with a reading: the middle ${measure.format(all)}, over ${plural(inRange.length, 'night')}. The nights after each tag sit below for comparison.`);
    lines.push(
      usual
        ? `Your usual range is ${measure.format(usual.low)} to ${measure.format(usual.high)}, the middle of your ${usual.count} readings.`
        : `Your usual range shows once there are ${MIN_USUAL_READINGS} readings to draw it from. There ${readings.length === 1 ? 'is 1' : `are ${readings.length}`} so far.`,
    );
    bands.push({ id: `afterTag_${measure.key}`, title: measure.title, icon: measure.icon, count: items.length, lines, items, notes: [TAG_NIGHTS_NOTE] });
  }
  return bands;
}
