// Six months and a year on Trends: F17 of the competitive build plan
// (Phase 2, 2026-09-26). Past about ninety days a chart with a dot for
// every day is a smear, so a series with more than LONG_RANGE_POINT_LIMIT
// days is drawn as one average per week, and past that many weeks as one
// per month. An average is only ever of the days with a reading, and a
// week or month with none is kept as a gap: the line breaks there rather
// than joining across it, and the caption counts them. Being too busy to
// log is not a week of nothing.
//
// Pure. Checked by scripts/test_long_range.js, which sweeps for verdict
// words.

export type ChartPoint = { date: string; value: number };

export type ChartBucket = 'day' | 'week' | 'month';

export type ChartSeries = {
  points: ChartPoint[];
  bucket: ChartBucket;
  // Two points further apart than this many days are not joined.
  breakGapDays: number | null;
  // Weeks or months between the first reading and the last with nothing.
  emptyPeriods: number;
};

export const LONG_RANGE_POINT_LIMIT = 90;

function parts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

function format(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The Monday of the week a date falls in, as a plain local date.
export function mondayOf(date: string): string {
  const { y, m, d } = parts(date);
  const day = new Date(y, m - 1, d);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return format(day);
}

function monthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

// Several readings on one date become that date's average first, so a
// busy day counts once in its week.
function byDate(points: ChartPoint[]): ChartPoint[] {
  const grouped = new Map<string, number[]>();
  for (const point of points) {
    if (!Number.isFinite(point.value)) continue;
    const date = point.date.slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), point.value]);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, values]) => ({ date, value: values.reduce((s, v) => s + v, 0) / values.length }));
}

type Period = { date: string; value: number | null; days: number };

function periods(days: ChartPoint[], keyOf: (date: string) => string, next: (key: string) => string): Period[] {
  if (days.length === 0) return [];
  const buckets = new Map<string, number[]>();
  for (const point of days) {
    const key = keyOf(point.date);
    buckets.set(key, [...(buckets.get(key) ?? []), point.value]);
  }
  const out: Period[] = [];
  const last = keyOf(days[days.length - 1].date);
  for (let key = keyOf(days[0].date); key <= last; key = next(key)) {
    const values = buckets.get(key) ?? [];
    out.push({ date: key, value: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null, days: values.length });
  }
  return out;
}

function nextWeek(key: string): string {
  const { y, m, d } = parts(key);
  return format(new Date(y, m - 1, d + 7));
}

function nextMonth(key: string): string {
  const { y, m } = parts(key);
  return format(new Date(y, m, 1));
}

export function weeklyAverages(points: ChartPoint[]): Period[] {
  return periods(byDate(points), mondayOf, nextWeek);
}

export function monthlyAverages(points: ChartPoint[]): Period[] {
  return periods(byDate(points), monthOf, nextMonth);
}

function toSeries(rows: Period[], bucket: ChartBucket, breakGapDays: number): ChartSeries {
  return {
    points: rows.filter((row) => row.value !== null).map((row) => ({ date: row.date, value: row.value as number })),
    bucket,
    breakGapDays,
    emptyPeriods: rows.filter((row) => row.value === null).length,
  };
}

// Days as they are up to the limit, then weeks, then months.
export function chartSeries(points: ChartPoint[], limit = LONG_RANGE_POINT_LIMIT): ChartSeries {
  const days = byDate(points);
  if (days.length <= limit) return { points, bucket: 'day', breakGapDays: null, emptyPeriods: 0 };
  const weeks = weeklyAverages(points);
  if (weeks.length <= limit) return toSeries(weeks, 'week', 7);
  // Neighbouring months are 28 to 31 days apart; one skipped is 59 or more.
  return toSeries(monthlyAverages(points), 'month', 45);
}

export function pointLabelPrefix(series: ChartSeries): string {
  if (series.bucket === 'week') return 'Week of ';
  if (series.bucket === 'month') return 'Month of ';
  return '';
}

export function longRangeCaption(series: ChartSeries): string | null {
  if (series.bucket === 'day') return null;
  const unit = series.bucket === 'week' ? 'week' : 'month';
  const start = series.bucket === 'week' ? 'in the week starting that Monday' : 'in that month';
  const gaps =
    series.emptyPeriods === 0
      ? `Every ${unit} in this range has at least one.`
      : `The line breaks at a ${unit} with nothing recorded: ${series.emptyPeriods} ${series.emptyPeriods === 1 ? unit : `${unit}s`} here.`;
  return `Each point is the average of the days with a reading ${start}. ${gaps}`;
}
