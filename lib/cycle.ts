// Period days and cycles, E1 and E5 of the competitive build plan (Phase 2,
// 2026-09-26). Signals > Cycle writes a day at a time into cycle_days
// (lib/cycleDb.ts); this module turns those days into periods, cycle
// lengths and the one forward-looking sentence the lens says, which is an
// average of this person's past cycles and nothing more.
//
// Pure: no imports and no I/O, so scripts/test_cycle.js runs it without a
// phone. Nothing here calls a cycle regular or irregular, long or short,
// and nothing here is fit for judging when pregnancy can or cannot happen,
// which the sentence says every time it is shown.

// How much bleeding, 1 to 4. A day logged with no amount is null.
export const FLOW_WORDS: [string, string, string, string] = ['Spotting', 'Light', 'Medium', 'Heavy'];

export function flowWord(flow: number | null): string {
  return flow !== null && Number.isInteger(flow) && flow >= 1 && flow <= 4 ? FLOW_WORDS[flow - 1] : 'Period day';
}

export type CycleDay = { day: string; flow: number | null };
export type Period = { start: string; end: string; days: number };

// Two period days with one unlogged day between them still belong to the
// same period, since a day in the middle is more likely forgotten than dry.
export const JOIN_GAP_DAYS = 2;
// A start more than this long after the one before is read as a stretch
// nothing was logged, so that gap is left out of the average.
export const LONGEST_COUNTED_CYCLE = 90;
// The average looks at this many of the latest cycles.
export const CYCLES_AVERAGED = 6;
export const MIN_CYCLES_FOR_AVERAGE = 2;
// Cycle day beside a flare is only given when a period started this
// recently before it (lib/patternContext.ts reads the same number).
export const CYCLE_DAY_REACH = 60;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDate(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86400000);
}

export function addDays(day: string, offset: number): string {
  const date = toDate(day);
  return toDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset));
}

export function spokenDate(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Periods from logged days, oldest first. Spotting on its own is kept as a
// logged day but does not start or make a period, since it so often comes
// between them.
export function periodsFrom(days: CycleDay[]): Period[] {
  const bleeding = [...new Set(days.filter((d) => d.flow !== 1).map((d) => d.day))].sort();
  const periods: Period[] = [];
  for (const day of bleeding) {
    const last = periods[periods.length - 1];
    if (last && daysBetween(last.end, day) <= JOIN_GAP_DAYS) {
      last.end = day;
      last.days = daysBetween(last.start, day) + 1;
    } else {
      periods.push({ start: day, end: day, days: 1 });
    }
  }
  return periods;
}

// Start to start, for every pair of starts close enough to be one cycle.
export function cycleLengths(periods: Period[]): number[] {
  const lengths: number[] = [];
  for (let index = 1; index < periods.length; index += 1) {
    const length = daysBetween(periods[index - 1].start, periods[index].start);
    if (length > 0 && length <= LONGEST_COUNTED_CYCLE) lengths.push(length);
  }
  return lengths;
}

export const NOT_FOR_CONTRACEPTION =
  'This is an average of past cycles, which vary from one to the next, and it is never a way to judge when pregnancy can or cannot happen.';

export const TOO_FEW_CYCLES =
  'Once two cycles are logged, start to start, their average shows here.';

// The one forward-looking sentence, or null until there are two cycles to
// average. It says what was averaged, the range it came from, and the date
// the average reaches, whether that date is ahead or already behind.
export function nextPeriodSentence(periods: Period[], today: string): string | null {
  const lengths = cycleLengths(periods).slice(-CYCLES_AVERAGED);
  if (lengths.length < MIN_CYCLES_FOR_AVERAGE || periods.length === 0) return null;
  const average = Math.round(lengths.reduce((sum, n) => sum + n, 0) / lengths.length);
  const low = Math.min(...lengths);
  const high = Math.max(...lengths);
  const last = periods[periods.length - 1].start;
  const next = addDays(last, average);
  const spread = low === high ? `each ${low} days` : `from ${low} to ${high} days`;
  let reach: string;
  if (next >= today) {
    reach = `puts the next start around ${spokenDate(next)}`;
  } else {
    const ago = daysBetween(next, today);
    reach = `reached ${spokenDate(next)}, ${ago} ${ago === 1 ? 'day' : 'days'} ago, with no start logged since`;
  }
  return `Your last ${lengths.length} cycles averaged ${average} days, ${spread}. Counting ${average} days from the start on ${spokenDate(last)} ${reach}.`;
}

export function periodsSentence(periods: Period[]): string {
  if (periods.length === 0) return 'No period days logged yet.';
  const count = periods.length === 1 ? '1 period' : `${periods.length} periods`;
  return `${count} logged, the first starting ${spokenDate(periods[0].start)}.`;
}

// Day 1 is the day a period started. Null when no start is logged in the
// CYCLE_DAY_REACH days up to and including the day.
export function cycleDayOn(day: string, starts: string[]): number | null {
  let latest: string | null = null;
  for (const start of starts) if (start <= day && (latest === null || start > latest)) latest = start;
  if (latest === null) return null;
  const n = daysBetween(latest, day) + 1;
  return n <= CYCLE_DAY_REACH ? n : null;
}
