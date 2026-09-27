// Averages by weekday and by month: F14 of the competitive build plan
// (Phase 2, 2026-09-26). Steps, sleep and the mood, energy and stress
// scales on Trends, each set out per day of the week and per calendar
// month, with the number of days behind every average so a Tuesday built
// on two readings is never read as firmly as one built on twenty.
//
// Pure, and a companion to lib/yourUsual.ts: it says what the readings have
// been on each kind of day and nothing about what they should be. A weekday
// or a month with no readings says not recorded, never zero. Checked by
// scripts/test_period_averages.js, which sweeps for verdict words.

export type DatedValue = { date: string; value: number };

export type PeriodAverage = {
  key: string;
  label: string;
  average: number | null;
  days: number;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Fewer readings than this and a weekday split says too little to show.
export const WEEKDAY_MIN_READINGS = 14;

function parts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

// Several readings on one date (two sleeps ending the same morning, three
// check-ins in a day) are averaged into that date first, so a busy day
// counts once.
function byDate(points: DatedValue[]): DatedValue[] {
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

function summarise(key: string, label: string, values: number[]): PeriodAverage {
  return {
    key,
    label,
    average: values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length,
    days: values.length,
  };
}

// Monday first, since that is how a working week is read.
export function averagesByWeekday(points: DatedValue[]): PeriodAverage[] {
  const buckets: number[][] = WEEKDAYS.map(() => []);
  for (const point of byDate(points)) {
    const { y, m, d } = parts(point.date);
    buckets[new Date(y, m - 1, d).getDay()].push(point.value);
  }
  return [1, 2, 3, 4, 5, 6, 0].map((index) => summarise(String(index), WEEKDAYS[index], buckets[index]));
}

// Every calendar month from the first reading to the last, oldest first,
// with a month that holds nothing kept in its place rather than skipped.
export function averagesByMonth(points: DatedValue[]): PeriodAverage[] {
  const days = byDate(points);
  if (days.length === 0) return [];
  const first = parts(days[0].date);
  const last = parts(days[days.length - 1].date);
  const buckets = new Map<string, number[]>();
  for (const point of days) {
    const key = point.date.slice(0, 7);
    buckets.set(key, [...(buckets.get(key) ?? []), point.value]);
  }
  const out: PeriodAverage[] = [];
  let y = first.y;
  let m = first.m;
  while (y < last.y || (y === last.y && m <= last.m)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = first.y === last.y ? MONTHS[m - 1] : `${MONTHS[m - 1]} ${y}`;
    out.push(summarise(key, label, buckets.get(key) ?? []));
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** What the day-of-the-week split is waiting for. Null once it shows, or
 *  when there are no readings at all. */
export function weekdaysWaitingLine(points: DatedValue[]): string | null {
  const have = byDate(points).length;
  if (have === 0 || have >= WEEKDAY_MIN_READINGS) return null;
  return `The split by day of the week shows once there are ${WEEKDAY_MIN_READINGS} days of readings. There ${have === 1 ? 'is 1' : `are ${have}`} so far.`;
}

export function showsWeekdays(points: DatedValue[]): boolean {
  return byDate(points).length >= WEEKDAY_MIN_READINGS;
}

// A month split needs readings in at least two months to say anything.
export function showsMonths(points: DatedValue[]): boolean {
  return averagesByMonth(points).filter((row) => row.days > 0).length >= 2;
}

export function periodValueText(row: PeriodAverage, format: (value: number) => string, unit: { one: string; many: string }): string {
  if (row.average == null) return 'not recorded';
  return `${format(row.average)}, ${row.days} ${row.days === 1 ? unit.one : unit.many}`;
}

export const PERIOD_AVERAGES_CAPTION =
  'Each average is of the days with a reading, and the count beside it is how many there were. A few days say less than many.';
