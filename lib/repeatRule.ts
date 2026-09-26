// How a schedule item repeats, and every date that pattern lands on.
//
// A1 of the competitive build plan (2026-09-26). Before this a schedule item
// could only repeat every day, which left out the doses people actually keep:
// a biologic every other week, methotrexate on Mondays, a B12 shot every
// month, an iron tablet every third day. Four patterns now, each with the
// same three ways to stop (never, after a number of times, on a date):
//
// - daily: every day.
// - every_n_days: every `interval` days from the first date.
// - weekly: on the chosen weekdays (0 = Sunday, matching Date.getDay()),
//   every `interval` weeks, counted from the week the series started in so
//   "every other Monday" keeps its fortnight however the rolling window is
//   topped up.
// - monthly: on the first date's day of the month, every `interval` months,
//   landing on the month's last day when that month is shorter (a series
//   started on the 31st lands on 30 April and 28 or 29 February).
//
// Pure and free of runtime imports so scripts/test_repeat_rule.js can check
// it without a phone. Dates are 'YYYY-MM-DD' strings throughout, worked out
// in UTC so a daylight-saving change can never move a day.

export type RepeatType = 'none' | 'daily' | 'every_n_days' | 'weekly' | 'monthly';
export type RepeatEndType = 'indefinite' | 'count' | 'until_date';

// type: 'none' means one occurrence and every other field is ignored.
// endType: 'count' needs count (total occurrences including the first);
// endType: 'until_date' needs until (inclusive). interval defaults to 1.
// weekdays is used by 'weekly' only.
export type RepeatConfig = {
  type: RepeatType;
  endType?: RepeatEndType;
  count?: number;
  until?: string;
  interval?: number;
  weekdays?: number[];
};

export type Occurrence = { date: string; index: number };

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A series can run for years; this only guards against a rule that can
// never produce a date (no weekdays chosen) looping forever.
const MAX_STEPS = 20000;

function parse(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function format(ms: number): string {
  const value = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
}

const DAY_MS = 86400000;

export function addDays(date: string, days: number): string {
  return format(parse(date) + days * DAY_MS);
}

export function weekdayOf(date: string): number {
  return new Date(parse(date)).getUTCDay();
}

function daysBetween(from: string, to: string): number {
  return Math.round((parse(to) - parse(from)) / DAY_MS);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function intervalOf(repeat: RepeatConfig): number {
  const value = Math.floor(repeat.interval ?? 1);
  return value >= 1 ? value : 1;
}

function weekdaysOf(repeat: RepeatConfig): number[] {
  return [...new Set((repeat.weekdays ?? []).filter((day) => day >= 0 && day <= 6))].sort((a, b) => a - b);
}

// Every date the pattern lands on, in order, starting from the anchor (the
// date the series was set up for). The anchor itself is always the first
// occurrence for daily, every_n_days and monthly; for weekly it is the
// first chosen weekday on or after the anchor, since a series set up on a
// Wednesday for Mondays and Fridays has not happened on that Wednesday.
function* patternDates(anchor: string, repeat: RepeatConfig): Generator<string> {
  if (repeat.type === 'none') {
    yield anchor;
    return;
  }
  const interval = intervalOf(repeat);

  if (repeat.type === 'daily' || repeat.type === 'every_n_days') {
    const step = repeat.type === 'daily' ? 1 : interval;
    for (let k = 0; k < MAX_STEPS; k++) {
      yield addDays(anchor, k * step);
    }
    return;
  }

  if (repeat.type === 'weekly') {
    const weekdays = weekdaysOf(repeat);
    if (weekdays.length === 0) return;
    const anchorWeekStart = addDays(anchor, -weekdayOf(anchor));
    for (let offset = 0; offset < MAX_STEPS; offset++) {
      const date = addDays(anchor, offset);
      const week = Math.floor(daysBetween(anchorWeekStart, date) / 7);
      if (week % interval === 0 && weekdays.includes(weekdayOf(date))) {
        yield date;
      }
    }
    return;
  }

  // monthly
  const [year, month, day] = anchor.split('-').map(Number);
  for (let k = 0; k < MAX_STEPS; k++) {
    const monthIndex = month - 1 + k * interval;
    const targetYear = year + Math.floor(monthIndex / 12);
    const targetMonth = ((monthIndex % 12) + 12) % 12;
    const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
    yield format(Date.UTC(targetYear, targetMonth, targetDay));
  }
}

// The occurrences of a series, each with its 1-based position counted from
// the anchor, stopping at the series' end rule and at `through` (the end of
// the rolling window). Only occurrences after `after` are returned when it
// is given, which is how a series is topped up without repeating a date it
// already has. The very first occurrence is returned even when it falls
// past `through`, since that is the one the person asked for.
export function occurrencesOf(
  anchor: string,
  repeat: RepeatConfig,
  options: { through: string; after?: string },
): Occurrence[] {
  const result: Occurrence[] = [];
  let index = 0;
  for (const date of patternDates(anchor, repeat)) {
    index++;
    if (repeat.type === 'none') {
      if (!options.after || date > options.after) result.push({ date, index });
      break;
    }
    if (repeat.endType === 'count' && index > (repeat.count ?? 1)) break;
    if (repeat.endType === 'until_date' && repeat.until && date > repeat.until && index > 1) break;
    if (date > options.through && index > 1) break;
    if (options.after && date <= options.after) continue;
    result.push({ date, index });
  }
  return result;
}

// What is wrong with a rule as entered, in words, or null when it can be saved.
export function validateRepeatRule(repeat: RepeatConfig): string | null {
  if (repeat.type === 'none') return null;
  if (repeat.type === 'weekly' && weekdaysOf(repeat).length === 0) {
    return 'Choose at least one day of the week.';
  }
  if ((repeat.type === 'every_n_days' || repeat.type === 'weekly' || repeat.type === 'monthly') && repeat.interval !== undefined) {
    if (!Number.isFinite(repeat.interval) || repeat.interval < 1 || Math.floor(repeat.interval) !== repeat.interval) {
      return 'Enter how often as a whole number, 1 or more.';
    }
  }
  if (repeat.type === 'every_n_days' && (repeat.interval ?? 0) < 2) {
    return 'Enter how many days apart, 2 or more. For every day, choose Every day.';
  }
  if (repeat.endType === 'count' && (!repeat.count || repeat.count < 1)) {
    return 'Enter how many times this should repeat.';
  }
  if (repeat.endType === 'until_date' && (!repeat.until || !/^\d{4}-\d{2}-\d{2}$/.test(repeat.until))) {
    return 'Enter a valid end date (YYYY-MM-DD).';
  }
  return null;
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// The pattern in a few words, for a row's caption: "Every day", "Every 3
// days", "Every Monday and Thursday", "Every 2 weeks on Monday", "Every
// month on the 15th". anchor is the series' first date, which the monthly
// wording needs for its day of the month.
export function describeRepeatPattern(repeat: RepeatConfig, anchor?: string): string {
  const interval = intervalOf(repeat);
  switch (repeat.type) {
    case 'none':
      return 'Once';
    case 'daily':
      return 'Every day';
    case 'every_n_days':
      return interval === 1 ? 'Every day' : `Every ${interval} days`;
    case 'weekly': {
      const weekdays = weekdaysOf(repeat);
      if (weekdays.length === 7 && interval === 1) return 'Every day';
      const names = joinWords(weekdays.map((day) => WEEKDAY_NAMES[day]));
      return interval === 1 ? `Every ${names}` : `Every ${interval} weeks on ${names}`;
    }
    case 'monthly': {
      const day = anchor ? Number(anchor.slice(8, 10)) : null;
      const onDay = day ? ` on the ${ordinal(day)}` : '';
      return interval === 1 ? `Every month${onDay}` : `Every ${interval} months${onDay}`;
    }
  }
}

// The pattern plus how it stops: "Every Monday, 10 times", "Every 3 days
// until 12 Oct 2026". Indefinite series say only the pattern.
export function describeRepeat(repeat: RepeatConfig, anchor?: string): string {
  const pattern = describeRepeatPattern(repeat, anchor);
  if (repeat.type === 'none') return pattern;
  if (repeat.endType === 'count' && repeat.count) {
    return `${pattern}, ${repeat.count} ${repeat.count === 1 ? 'time' : 'times'}`;
  }
  if (repeat.endType === 'until_date' && repeat.until && /^\d{4}-\d{2}-\d{2}$/.test(repeat.until)) {
    const [year, month, day] = repeat.until.split('-').map(Number);
    return `${pattern} until ${day} ${MONTH_SHORT[month - 1]} ${year}`;
  }
  return pattern;
}

// Weekdays as stored in schedule_items.repeat_weekdays ("1,4"), and back.
export function weekdaysToColumn(weekdays: number[] | undefined): string | null {
  if (!weekdays || weekdays.length === 0) return null;
  return [...new Set(weekdays)].sort((a, b) => a - b).join(',');
}

export function weekdaysFromColumn(value: string | null | undefined): number[] | undefined {
  if (!value) return undefined;
  const days = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return days.length > 0 ? days : undefined;
}
