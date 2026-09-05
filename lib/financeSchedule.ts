// When a bill is actually due, and how often that works out to.
//
// Added 2026-09-05, directly after Finances shipped, from a report that
// the first model could not express real bills: "Sometimes a bill could be
// due on a specific day of the month, or the first, second, third, or
// fourth specific day of the week, per week, per every 2 or 3 weeks per
// month."
//
// WHY THIS REPLACED THE FIRST ATTEMPT RATHER THAN EXTENDING IT.
//
// Finances shipped with two separate stored fields: a `cadence`
// ('biweekly') and a `due_day` (a number 1-31). That is the same fact
// written twice, and it makes most combinations meaningless: a biweekly
// bill has no day of the month, a weekly bill has no day of the month, and
// an annual bill with only a day of the month does not say WHICH month, so
// the first version of upcomingBills showed a yearly bill as due every
// month. That was a real bug in what shipped, found by taking the report
// seriously rather than by testing.
//
// The fix is one rule that says both things at once, with how often it
// repeats derived from the rule instead of stored beside it. There is then
// no way to represent a contradiction, and no second field to keep in
// step.
//
// STORED AS JSON IN ONE COLUMN, deliberately. The alternative was six or
// seven nullable columns (day, second day, weekday, week-of-month, anchor,
// interval, kind) where most are null for any given row and illegal
// combinations are representable. Nothing queries a bill BY its due rule
// in SQL: Coming Up loads the handful of recurring rows and computes in
// JS. So the relational shape buys nothing and costs correctness. The app
// already stores structured values this way where the same reasoning
// applies (payload_json, instructions_json, depth_data_json).

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// 'last' earns its place next to 1-4: "the last Friday of the month" is
// something people genuinely say, and the machinery for the numbered ones
// already has to find weekdays within a month, so it costs one branch.
export type WeekOfMonth = 1 | 2 | 3 | 4 | 'last';

export const WEEK_OF_MONTH_LABELS: Record<string, string> = {
  '1': 'First',
  '2': 'Second',
  '3': 'Third',
  '4': 'Fourth',
  last: 'Last',
};

/**
 * Every shape a due date can take, and nothing else.
 *
 * `anchor` on everyNWeeks is a real date, and it is what makes "every 2
 * weeks" answerable at all: without knowing one Friday it lands on, every
 * other Friday is a coin flip. `anchorMonth` on the month-based rules does
 * the same job for anything repeating less often than monthly, which is
 * what the shipped version was missing when it showed yearly bills every
 * month.
 */
export type DueRule =
  | { kind: 'everyNWeeks'; weeks: 1 | 2 | 3 | 4; weekday: Weekday; anchor: string }
  | { kind: 'dayOfMonth'; months: 1 | 3 | 6 | 12; day: number; anchorMonth?: string | null }
  | { kind: 'twiceMonthly'; day1: number; day2: number }
  | { kind: 'nthWeekday'; months: 1 | 3 | 6 | 12; week: WeekOfMonth; weekday: Weekday; anchorMonth?: string | null };

// --- Dates ------------------------------------------------------------------
// Plain local 'YYYY-MM-DD' throughout, never `new Date(str)`, which parses
// a bare date as UTC midnight and shifts the day west of Greenwich. Same
// convention and reasoning as lib/therapyResponse.ts and lib/financeCore.ts.

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

type Parts = { y: number; m: number; d: number };

export function parseDate(dateStr: string): Parts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dateStr ?? '').slice(0, 10));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

function fmt(y: number, m: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function weekdayOf(dateStr: string): Weekday | null {
  const p = parseDate(dateStr);
  if (!p) return null;
  return new Date(p.y, p.m - 1, p.d).getDay() as Weekday;
}

export function addDays(dateStr: string, days: number): string | null {
  const p = parseDate(dateStr);
  if (!p) return null;
  const d = new Date(p.y, p.m - 1, p.d + days);
  return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Whole calendar days from a to b. Negative when b is earlier. */
export function daysBetween(a: string, b: string): number | null {
  const pa = parseDate(a);
  const pb = parseDate(b);
  if (!pa || !pb) return null;
  const MS = 86400000;
  return Math.round((new Date(pb.y, pb.m - 1, pb.d).getTime() - new Date(pa.y, pa.m - 1, pa.d).getTime()) / MS);
}

/** Day-of-month of the nth given weekday, or null when that month has no nth. */
export function nthWeekdayOfMonth(year: number, month: number, weekday: Weekday, week: WeekOfMonth): number | null {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const firstOccurrence = 1 + ((weekday - firstDow + 7) % 7);
  const length = daysInMonth(year, month);

  if (week === 'last') {
    let day = firstOccurrence;
    while (day + 7 <= length) day += 7;
    return day;
  }

  const day = firstOccurrence + (week - 1) * 7;
  // A month can genuinely lack a 5th of a given weekday. Nothing above
  // offers 5, but a stored rule could carry one, and returning null is the
  // honest answer rather than rolling into the next month.
  return day <= length ? day : null;
}

// --- How often it works out to ---------------------------------------------

/**
 * Payments a year. Derived from the rule rather than stored beside it, so
 * the two can never disagree.
 *
 * Week-based rules use 52 weeks a year. The trap this exists to avoid is
 * that "every 4 weeks" is 13 payments a year and NOT the same as monthly,
 * which is 12: a bill someone thinks of as monthly but actually pays every
 * four weeks costs an extra payment a year, every year.
 */
export function occurrencesPerYear(rule: DueRule): number {
  switch (rule.kind) {
    case 'everyNWeeks':
      return 52 / rule.weeks;
    case 'twiceMonthly':
      return 24;
    case 'dayOfMonth':
    case 'nthWeekday':
      return 12 / rule.months;
  }
}

export function monthlyFactor(rule: DueRule): number {
  return occurrencesPerYear(rule) / 12;
}

export function toMonthly(amount: number, rule: DueRule): number {
  return amount * monthlyFactor(rule);
}

export function toAnnual(amount: number, rule: DueRule): number {
  return amount * occurrencesPerYear(rule);
}

// --- When it next lands -----------------------------------------------------

function addMonths(y: number, m: number, months: number): { y: number; m: number } {
  const zero = (y * 12 + (m - 1)) + months;
  return { y: Math.floor(zero / 12), m: (zero % 12) + 1 };
}

function monthIndex(y: number, m: number): number {
  return y * 12 + (m - 1);
}

/**
 * The first occurrence on or after `fromDate`, or null when the rule does
 * not carry enough to say.
 *
 * Null is a real answer here, not a failure: an every-2-weeks bill with no
 * anchor genuinely cannot be placed, and guessing a Friday would put a
 * wrong date in front of someone planning around it. The screen reports
 * how many bills are in that state instead of dropping them silently.
 */
export function nextOccurrence(rule: DueRule, fromDate: string): string | null {
  const from = parseDate(fromDate);
  if (!from) return null;

  if (rule.kind === 'everyNWeeks') {
    const anchor = parseDate(rule.anchor);
    if (!anchor) return null;
    // The anchor is snapped forward onto the chosen weekday rather than
    // trusted to already be on it, so a start date typed as "some day that
    // week" still produces the right series.
    const anchorDow = new Date(anchor.y, anchor.m - 1, anchor.d).getDay();
    const snapped = addDays(rule.anchor, (rule.weekday - anchorDow + 7) % 7);
    if (!snapped) return null;

    const gap = daysBetween(snapped, fromDate);
    if (gap == null) return null;
    if (gap <= 0) return snapped;

    const step = rule.weeks * 7;
    return addDays(snapped, Math.ceil(gap / step) * step);
  }

  if (rule.kind === 'twiceMonthly') {
    const days = [rule.day1, rule.day2].filter((d) => d >= 1 && d <= 31).sort((a, b) => a - b);
    if (days.length === 0) return null;
    for (let ahead = 0; ahead <= 1; ahead += 1) {
      const { y, m } = addMonths(from.y, from.m, ahead);
      for (const day of days) {
        const landed = Math.min(day, daysInMonth(y, m));
        if (ahead > 0 || landed >= from.d) return fmt(y, m, landed);
      }
    }
    return null;
  }

  // Month-based. A rule repeating every 3, 6 or 12 months needs an anchor
  // month to know which months are in the cycle; monthly needs none,
  // because every month is.
  const step = rule.months;
  let startY = from.y;
  let startM = from.m;

  if (step > 1) {
    const anchor = parseDate(rule.anchorMonth ? `${rule.anchorMonth.slice(0, 7)}-01` : '');
    if (!anchor) return null;
    // Walk forward from the anchor in whole steps to the first month in the
    // cycle that is not before the current one.
    const diff = monthIndex(from.y, from.m) - monthIndex(anchor.y, anchor.m);
    const stepsAhead = diff <= 0 ? 0 : Math.floor(diff / step);
    const start = addMonths(anchor.y, anchor.m, stepsAhead * step);
    startY = start.y;
    startM = start.m;
  }

  // Two cycles is always enough: the first may already have passed this
  // month, the second cannot.
  for (let i = 0; i < 3; i += 1) {
    const { y, m } = addMonths(startY, startM, i * step);
    const day =
      rule.kind === 'dayOfMonth'
        ? Math.min(rule.day, daysInMonth(y, m))
        : nthWeekdayOfMonth(y, m, rule.weekday, rule.week);
    if (day == null) continue;
    if (monthIndex(y, m) > monthIndex(from.y, from.m) || (monthIndex(y, m) === monthIndex(from.y, from.m) && day >= from.d)) {
      return fmt(y, m, day);
    }
  }
  return null;
}

export function isPlaceable(rule: DueRule, fromDate: string): boolean {
  return nextOccurrence(rule, fromDate) !== null;
}

// --- Reading and writing ----------------------------------------------------

export function serializeDueRule(rule: DueRule): string {
  return JSON.stringify(rule);
}

/**
 * Parsed defensively: this comes back out of a text column, and a row
 * written by an older version, hand-edited, or restored from a backup can
 * be anything. Anything that is not a rule this file recognizes returns
 * null and the caller treats the bill as unplaced, rather than throwing
 * and taking the screen down with it.
 */
export function parseDueRule(json: string | null | undefined): DueRule | null {
  if (!json) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const isWeekday = (n: unknown): n is Weekday => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 6;
  const isDay = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 31;

  switch (value.kind) {
    case 'everyNWeeks':
      if (![1, 2, 3, 4].includes(value.weeks as number)) return null;
      if (!isWeekday(value.weekday)) return null;
      if (typeof value.anchor !== 'string' || !parseDate(value.anchor)) return null;
      return { kind: 'everyNWeeks', weeks: value.weeks as 1 | 2 | 3 | 4, weekday: value.weekday, anchor: value.anchor };
    case 'twiceMonthly':
      if (!isDay(value.day1) || !isDay(value.day2)) return null;
      return { kind: 'twiceMonthly', day1: value.day1, day2: value.day2 };
    case 'dayOfMonth':
      if (![1, 3, 6, 12].includes(value.months as number)) return null;
      if (!isDay(value.day)) return null;
      return {
        kind: 'dayOfMonth',
        months: value.months as 1 | 3 | 6 | 12,
        day: value.day,
        anchorMonth: typeof value.anchorMonth === 'string' ? value.anchorMonth : null,
      };
    case 'nthWeekday': {
      if (![1, 3, 6, 12].includes(value.months as number)) return null;
      if (!isWeekday(value.weekday)) return null;
      const week = value.week;
      const okWeek = week === 'last' || (typeof week === 'number' && week >= 1 && week <= 4);
      if (!okWeek) return null;
      return {
        kind: 'nthWeekday',
        months: value.months as 1 | 3 | 6 | 12,
        week: week as WeekOfMonth,
        weekday: value.weekday,
        anchorMonth: typeof value.anchorMonth === 'string' ? value.anchorMonth : null,
      };
    }
    default:
      return null;
  }
}

// --- Wording ----------------------------------------------------------------

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

const MONTHS_PHRASE: Record<number, string> = {
  1: 'month',
  3: '3 months',
  6: '6 months',
  12: 'year',
};

/** How often, in the words someone would use. */
export function describeDueRule(rule: DueRule): string {
  switch (rule.kind) {
    case 'everyNWeeks':
      return rule.weeks === 1
        ? `Every ${WEEKDAY_NAMES[rule.weekday]}`
        : `Every ${rule.weeks} weeks on ${WEEKDAY_NAMES[rule.weekday]}`;
    case 'twiceMonthly': {
      const [a, b] = [rule.day1, rule.day2].sort((x, y) => x - y);
      return `The ${ordinal(a)} and ${ordinal(b)} of each month`;
    }
    case 'dayOfMonth':
      return rule.months === 1
        ? `The ${ordinal(rule.day)} of each month`
        : `The ${ordinal(rule.day)}, every ${MONTHS_PHRASE[rule.months]}`;
    case 'nthWeekday': {
      const which = `${WEEK_OF_MONTH_LABELS[String(rule.week)]} ${WEEKDAY_NAMES[rule.weekday]}`;
      return rule.months === 1 ? `${which} of each month` : `${which}, every ${MONTHS_PHRASE[rule.months]}`;
    }
  }
}

/** The short form for a list row, where the name matters more. */
export function describeDueRuleShort(rule: DueRule): string {
  switch (rule.kind) {
    case 'everyNWeeks':
      return rule.weeks === 1 ? `weekly, ${WEEKDAY_SHORT[rule.weekday]}` : `every ${rule.weeks}wk, ${WEEKDAY_SHORT[rule.weekday]}`;
    case 'twiceMonthly':
      return '2x/month';
    case 'dayOfMonth':
      return rule.months === 1 ? 'monthly' : rule.months === 12 ? 'yearly' : `every ${rule.months}mo`;
    case 'nthWeekday':
      return rule.months === 1 ? 'monthly' : rule.months === 12 ? 'yearly' : `every ${rule.months}mo`;
  }
}

/** What is still missing before this bill can be placed on a calendar. */
export function describeMissingPiece(rule: DueRule): string | null {
  if (rule.kind === 'everyNWeeks' && !parseDate(rule.anchor)) {
    return 'Needs a date it last landed on, so the app knows which week it falls in.';
  }
  if ((rule.kind === 'dayOfMonth' || rule.kind === 'nthWeekday') && rule.months > 1) {
    if (!rule.anchorMonth || !parseDate(`${rule.anchorMonth.slice(0, 7)}-01`)) {
      return `Needs a month to count from, since it only comes round every ${MONTHS_PHRASE[rule.months]}.`;
    }
  }
  return null;
}
