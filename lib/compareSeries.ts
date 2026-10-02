// Compare any two series, F16 (2026-10-01): two things the person records,
// drawn on one date axis with each on a separate scale, one read off the
// left edge and one off the right. Answers Cronometer's two-chart overlay.
//
// The rules held here, with no I/O so scripts/test_compare_series.js can
// check them:
//
//  1. A day with no reading is left out of a series, never drawn as zero,
//     and nothing joins two readings across a gap: the chart draws dots.
//  2. Each series keeps a range apart, so a weight in the seventies and a
//     nutrient near 100% of target both fill the height.
//  3. The caption counts the days each series has a reading and the days
//     that have both, and says moving together is not one causing the
//     other. No correlation figure is given: on one person's records it
//     would read as a finding.
//
// The loader is lib/compareSeriesDb.ts, the chart components/CompareTwoChart.tsx.

export const COMPARE_RANGES = [30, 90, 180, 365] as const;
export type CompareRange = (typeof COMPARE_RANGES)[number];
export const DEFAULT_COMPARE_RANGE: CompareRange = 90;

export type SeriesKind = 'nutrient' | 'weight' | 'steps' | 'sleep' | 'severity' | 'scale' | 'lab' | 'tracker';

export type SeriesChoice = {
  key: string;
  kind: SeriesKind;
  label: string;
  group: string;
  unit: string;
  decimals: number;
  // A scale with fixed ends draws against those ends rather than against
  // whatever the readings happened to span.
  fixedRange?: { yMin: number; yMax: number };
  // Several readings on one day: averaged, added, or the highest kept.
  perDay: 'average' | 'total' | 'highest';
};

export type ComparePoint = { date: string; value: number };

export type ChoiceSources = {
  nutrients: { code: string; label: string }[];
  labs: { code: string; label: string; unit: string }[];
  trackers: { id: string; name: string; unit: string; perDay: 'average' | 'total'; scale: boolean }[];
  weightUnit: 'kg' | 'lb';
};

export const COMPARE_GROUPS = ['Nutrients', 'Body', 'Sleep and movement', 'How you felt', 'Labs', 'Your trackers'] as const;

export function nutrientKey(code: string): string {
  return `nutrient:${code}`;
}

// Every series the person could pick, nutrients first, in the order the
// groups above are listed.
export function buildChoices(sources: ChoiceSources): SeriesChoice[] {
  const choices: SeriesChoice[] = [];
  for (const nutrient of sources.nutrients) {
    choices.push({
      key: nutrientKey(nutrient.code),
      kind: 'nutrient',
      label: `${nutrient.label}, % of target`,
      group: 'Nutrients',
      unit: '% of target',
      decimals: 0,
      perDay: 'average',
    });
  }
  choices.push({ key: 'weight', kind: 'weight', label: 'Weight', group: 'Body', unit: sources.weightUnit, decimals: 1, perDay: 'average' });
  choices.push({ key: 'sleep', kind: 'sleep', label: 'Sleep, hours a night', group: 'Sleep and movement', unit: 'hours', decimals: 1, perDay: 'total' });
  choices.push({ key: 'steps', kind: 'steps', label: 'Steps', group: 'Sleep and movement', unit: 'steps', decimals: 0, perDay: 'total' });
  choices.push({
    key: 'severity',
    kind: 'severity',
    label: 'Flare and reaction severity, 0 to 10',
    group: 'How you felt',
    unit: 'of 10',
    decimals: 0,
    fixedRange: { yMin: 0, yMax: 10 },
    perDay: 'highest',
  });
  for (const [key, label] of [
    ['mood', 'Mood'],
    ['energy', 'Energy'],
    ['stress', 'Stress'],
  ] as const) {
    choices.push({
      key: `scale:${key}`,
      kind: 'scale',
      label: `${label}, 1 to 5`,
      group: 'How you felt',
      unit: 'of 5',
      decimals: 1,
      fixedRange: { yMin: 1, yMax: 5 },
      perDay: 'average',
    });
  }
  for (const lab of sources.labs) {
    choices.push({ key: `lab:${lab.code}`, kind: 'lab', label: lab.label, group: 'Labs', unit: lab.unit, decimals: 2, perDay: 'average' });
  }
  for (const tracker of sources.trackers) {
    choices.push({
      key: `tracker:${tracker.id}`,
      kind: 'tracker',
      label: tracker.name,
      group: 'Your trackers',
      unit: tracker.unit,
      decimals: 1,
      fixedRange: tracker.scale ? { yMin: 1, yMax: 5 } : undefined,
      perDay: tracker.perDay,
    });
  }
  return choices;
}

// The picker reads groups in the order above. Labs and trackers arrive
// already alphabetical from the loader; nutrients keep the order the
// reference intakes list them in, which is the order Insights shows.
export function choiceOptions(choices: readonly SeriesChoice[]): { label: string; value: string }[] {
  return choices.map((choice) => ({ label: choice.label, value: choice.key }));
}

// ---- dates ----

function utcOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function shiftDate(date: string, days: number): string {
  const t = new Date(utcOf(date) + days * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function dayIndex(date: string, start: string): number {
  return Math.round((utcOf(date) - utcOf(start)) / 86_400_000);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function sayDate(date: string): string {
  const t = new Date(utcOf(date));
  return `${WEEKDAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}

export function sayShortDate(date: string): string {
  const t = new Date(utcOf(date));
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}

// ---- readings ----

// One reading per day, oldest first, inside the range only.
export function oneReadingPerDay(
  points: readonly ComparePoint[],
  perDay: SeriesChoice['perDay'],
  start: string,
  end: string,
): ComparePoint[] {
  const byDay = new Map<string, number[]>();
  for (const point of points) {
    if (!Number.isFinite(point.value)) continue;
    if (point.date < start || point.date > end) continue;
    const list = byDay.get(point.date) ?? [];
    list.push(point.value);
    byDay.set(point.date, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, values]) => ({
      date,
      value:
        perDay === 'highest'
          ? Math.max(...values)
          : perDay === 'total'
            ? values.reduce((sum, v) => sum + v, 0)
            : values.reduce((sum, v) => sum + v, 0) / values.length,
    }));
}

export function seriesRange(choice: SeriesChoice, points: readonly ComparePoint[]): { yMin: number; yMax: number } {
  if (choice.fixedRange) {
    // A reading outside the fixed ends (a tracker scale used past 5)
    // still has to land on the chart.
    const values = points.map((p) => p.value);
    return {
      yMin: Math.min(choice.fixedRange.yMin, ...values),
      yMax: Math.max(choice.fixedRange.yMax, ...values),
    };
  }
  if (points.length === 0) return { yMin: 0, yMax: 1 };
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(Math.abs(max) * 0.2, 1);
  const pad = span * 0.12;
  const yMin = min >= 0 && min - pad < 0 ? 0 : min - pad;
  return { yMin, yMax: max + pad };
}

export function formatValue(choice: SeriesChoice, value: number): string {
  const rounded = choice.decimals === 0 ? Math.round(value) : Number(value.toFixed(choice.decimals));
  const number = rounded.toLocaleString('en-US', { maximumFractionDigits: choice.decimals });
  if (choice.unit === '% of target') return `${number}% of target`;
  if (!choice.unit) return number;
  return `${number} ${choice.unit}`;
}

// An axis label: short, no unit words.
export function formatAxisValue(choice: SeriesChoice, value: number): string {
  const span = Math.abs(value);
  if (span >= 10_000) return `${Math.round(value / 1000)}k`;
  if (span >= 100 || choice.decimals === 0) return String(Math.round(value));
  if (span >= 10) return value.toFixed(0);
  return value.toFixed(1);
}

// ---- the comparison ----

export type Comparison = {
  start: string;
  end: string;
  days: number;
  a: { choice: SeriesChoice; points: ComparePoint[]; range: { yMin: number; yMax: number } };
  b: { choice: SeriesChoice; points: ComparePoint[]; range: { yMin: number; yMax: number } };
  daysA: number;
  daysB: number;
  daysBoth: number;
  sameSeries: boolean;
  summary: string;
  accessibilityLabel: string;
};

export const MOVING_TOGETHER_LINE =
  'Two series rising and falling together does not show that one is causing the other. Both can follow something else, such as a season, a busy week or a change in treatment, and with few shared days it can be chance.';

function dayWord(n: number): string {
  return n === 1 ? 'day' : 'days';
}

export function buildComparison(
  choiceA: SeriesChoice,
  rawA: readonly ComparePoint[],
  choiceB: SeriesChoice,
  rawB: readonly ComparePoint[],
  end: string,
  days: number,
): Comparison {
  const start = shiftDate(end, -(days - 1));
  const pointsA = oneReadingPerDay(rawA, choiceA.perDay, start, end);
  const pointsB = oneReadingPerDay(rawB, choiceB.perDay, start, end);
  const datesB = new Set(pointsB.map((p) => p.date));
  const daysBoth = pointsA.filter((p) => datesB.has(p.date)).length;
  const sameSeries = choiceA.key === choiceB.key;

  let summary: string;
  if (sameSeries) {
    summary = 'Both pickers hold the same thing. Pick something different in one of them to compare two.';
  } else if (pointsA.length === 0 && pointsB.length === 0) {
    summary = `Nothing is recorded for either in the last ${days} days.`;
  } else {
    const parts = [
      `${choiceA.label} has a reading on ${pointsA.length} of the last ${days} days, and ${choiceB.label} on ${pointsB.length}.`,
    ];
    if (pointsA.length > 0 && pointsB.length > 0) {
      parts.push(
        daysBoth === 0
          ? 'No day has both, so the two can only be read side by side, never day against day.'
          : `${daysBoth} ${dayWord(daysBoth)} ${daysBoth === 1 ? 'has' : 'have'} both.`,
      );
    }
    summary = parts.join(' ');
  }

  return {
    start,
    end,
    days,
    a: { choice: choiceA, points: pointsA, range: seriesRange(choiceA, pointsA) },
    b: { choice: choiceB, points: pointsB, range: seriesRange(choiceB, pointsB) },
    daysA: pointsA.length,
    daysB: pointsB.length,
    daysBoth,
    sameSeries,
    summary,
    accessibilityLabel: `${choiceA.label} as circles on the left scale and ${choiceB.label} as squares on the right scale, from ${sayDate(start)} to ${sayDate(end)}. ${summary}`,
  };
}

// What one day reads, both series named, for the line under the chart.
export function describeDay(comparison: Comparison, date: string): string {
  const read = (side: Comparison['a']) => {
    const point = side.points.find((p) => p.date === date);
    return `${side.choice.label} ${point ? formatValue(side.choice, point.value) : 'not recorded'}`;
  };
  return `${sayDate(date)}: ${read(comparison.a)}; ${read(comparison.b)}.`;
}
