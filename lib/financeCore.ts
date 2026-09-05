// The arithmetic behind Finances: turning things that repeat on different
// schedules into one comparable monthly picture, working out what is due
// next, and combining what someone planned with what actually went out.
//
// Added 2026-09-05 with the Life tab's first area.
//
// Pure and database-free on purpose, the same reasoning lib/groceryList.ts
// and lib/therapyResponse.ts both carry: every failure mode in this file
// is a silently wrong NUMBER rather than a crash, and a wrong number here
// is one someone plans a month around. scripts/test_finance_math.js runs
// all of it with no device and no SQLite connection.
//
// Reading and writing lives in lib/financeDb.ts; the category and cadence
// vocabulary lives in lib/financeCategories.ts.

import {
  SET_ASIDE_GROUP,
  financeCategoryGroup,
  type FinanceCadence,
  type FinanceCategoryGroup,
  type FinanceDirection,
} from './financeCategories';

// --- Cadence, and the one piece of arithmetic most worth getting right ------
//
// A month is not four weeks. There are 52 weeks in a year and 12 months,
// so something paid weekly costs 52/12 = 4.333 times its amount per month,
// not 4. Treating it as 4 understates the year by four whole payments,
// roughly 8%, and that error compounds across every weekly line someone
// has. It is the single most common way a household budget quietly runs
// short, so it is worth stating plainly rather than leaving in a constant.
//
// Biweekly and semimonthly look interchangeable and are not. Every two
// weeks is 26 payments a year (26/12 = 2.167 a month); twice a month is 24
// (exactly 2 a month). Anyone paid every second Friday gets three
// paychecks in two months of the year, and a budget built on "twice a
// month" misses them.
//
// Quarterly, semiannual and annual divide cleanly and carry no such trap,
// but they carry a different one the UI handles rather than this file: a
// large annual bill looks small spread over twelve months and still has to
// be paid all at once on one day.
export const MONTHLY_FACTOR: Record<FinanceCadence, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  annual: 1 / 12,
};

export const ANNUAL_FACTOR: Record<FinanceCadence, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

export function toMonthly(amount: number, cadence: FinanceCadence): number {
  return amount * MONTHLY_FACTOR[cadence];
}

export function toAnnual(amount: number, cadence: FinanceCadence): number {
  return amount * ANNUAL_FACTOR[cadence];
}

// --- Dates ------------------------------------------------------------------
//
// Plain local 'YYYY-MM-DD' throughout, and deliberately never
// `new Date(str)`, which parses a bare date as UTC midnight and shifts the
// day for anyone west of Greenwich. Same convention and same reasoning as
// lib/therapyResponse.ts and lib/patternFinder.ts.

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function parseLocalDate(dateStr: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.slice(0, 10));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

function formatLocalDate(y: number, m: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * The next date a day-of-month bill lands on, at or after `fromDate`.
 *
 * Clamps to the length of whatever month it lands in, which is the whole
 * reason this is a function rather than a template string: a bill due on
 * the 31st is due on the 30th in April and on the 28th in February. Left
 * unclamped it would produce 2026-02-31, which every date parser in the
 * app then either rejects or silently rolls forward into March.
 *
 * Returns null for a cadence that has no day-of-month at all (weekly,
 * every two weeks, twice a month), rather than inventing one.
 */
export function nextDueDate(dueDay: number | null, fromDate: string): string | null {
  if (dueDay == null) return null;
  const from = parseLocalDate(fromDate);
  if (!from) return null;
  if (dueDay < 1 || dueDay > 31) return null;

  const thisMonthDay = Math.min(dueDay, daysInMonth(from.y, from.m));
  if (thisMonthDay >= from.d) return formatLocalDate(from.y, from.m, thisMonthDay);

  const nextM = from.m === 12 ? 1 : from.m + 1;
  const nextY = from.m === 12 ? from.y + 1 : from.y;
  return formatLocalDate(nextY, nextM, Math.min(dueDay, daysInMonth(nextY, nextM)));
}

export function daysBetween(fromDate: string, toDate: string): number | null {
  const a = parseLocalDate(fromDate);
  const b = parseLocalDate(toDate);
  if (!a || !b) return null;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b.y, b.m - 1, b.d).getTime() - new Date(a.y, a.m - 1, a.d).getTime()) / MS_PER_DAY);
}

/** 'YYYY-MM' for the month a date falls in. */
export function monthKey(dateStr: string): string | null {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return null;
  return dateStr.slice(0, 7);
}

// --- What repeats ----------------------------------------------------------

export type RecurringItem = {
  id: string;
  direction: FinanceDirection;
  name: string;
  category: string;
  amount: number;
  cadence: FinanceCadence;
  dueDay: number | null;
  autopay: boolean;
  active: boolean;
};

export type GroupTotal = { group: FinanceCategoryGroup; monthly: number };
export type CategoryTotal = { category: string; monthly: number };

export type RecurringSummary = {
  monthlyIncome: number;
  // Everything that repeats and is actually consumed. Deliberately
  // excludes the Set Aside group: money moved to savings does leave the
  // account, but calling it an expense would tell someone their costs went
  // up when what happened is they saved more.
  monthlyCommitted: number;
  monthlySetAside: number;
  // Income minus everything that leaves the account, savings included,
  // because what is left to live on is the question being asked.
  monthlyLeftOver: number;
  annualIncome: number;
  annualCommitted: number;
  byCategory: CategoryTotal[];
  byGroup: GroupTotal[];
  activeCount: number;
};

export function summarizeRecurring(items: RecurringItem[]): RecurringSummary {
  const active = items.filter((item) => item.active);

  let monthlyIncome = 0;
  let monthlyCommitted = 0;
  let monthlySetAside = 0;
  let annualIncome = 0;
  let annualCommitted = 0;

  const categoryTotals = new Map<string, number>();
  const groupTotals = new Map<FinanceCategoryGroup, number>();

  for (const item of active) {
    const monthly = toMonthly(item.amount, item.cadence);
    const annual = toAnnual(item.amount, item.cadence);

    if (item.direction === 'income') {
      monthlyIncome += monthly;
      annualIncome += annual;
      continue;
    }

    const group = financeCategoryGroup(item.category);
    if (group === SET_ASIDE_GROUP) monthlySetAside += monthly;
    else {
      monthlyCommitted += monthly;
      annualCommitted += annual;
    }

    categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + monthly);
    groupTotals.set(group, (groupTotals.get(group) ?? 0) + monthly);
  }

  return {
    monthlyIncome,
    monthlyCommitted,
    monthlySetAside,
    monthlyLeftOver: monthlyIncome - monthlyCommitted - monthlySetAside,
    annualIncome,
    annualCommitted,
    byCategory: [...categoryTotals.entries()]
      .map(([category, monthly]) => ({ category, monthly }))
      .sort((a, b) => b.monthly - a.monthly),
    byGroup: [...groupTotals.entries()]
      .map(([group, monthly]) => ({ group, monthly }))
      .sort((a, b) => b.monthly - a.monthly),
    activeCount: active.length,
  };
}

// --- What is due soon ------------------------------------------------------

export type UpcomingBill = {
  item: RecurringItem;
  dueDate: string;
  daysAway: number;
};

/**
 * Bills landing within `withinDays` of `fromDate`, soonest first.
 *
 * Only items with a real day-of-month appear. A weekly or every-two-weeks
 * item is left out rather than guessed at, and the screen says so, because
 * the honest answer for "when is my every-2-weeks bill next due" needs an
 * anchor date this app does not ask for yet.
 */
export function upcomingBills(items: RecurringItem[], fromDate: string, withinDays: number): UpcomingBill[] {
  const out: UpcomingBill[] = [];
  for (const item of items) {
    if (!item.active || item.direction !== 'expense') continue;
    const dueDate = nextDueDate(item.dueDay, fromDate);
    if (!dueDate) continue;
    const daysAway = daysBetween(fromDate, dueDate);
    if (daysAway == null || daysAway > withinDays) continue;
    out.push({ item, dueDate, daysAway });
  }
  return out.sort((a, b) => a.daysAway - b.daysAway || b.item.amount - a.item.amount);
}

// --- What actually went out ------------------------------------------------
//
// The distinction this whole feature turns on. What repeats is a plan;
// what is below is a record. Comparing the two is the point, and neither
// is allowed to stand in for the other.

export type MoneyEntry = {
  occurredOn: string;
  direction: FinanceDirection;
  amount: number;
  category: string;
};

/**
 * Spending this app already collected elsewhere, passed in rather than
 * recomputed, so nothing is copied into the finance tables and nothing can
 * drift from its source. lib/financeDb.ts does the reading.
 *
 * The counts matter as much as the money. A grocery line with no price
 * recorded, or a therapy session with no cost, is a real gap in what the
 * app knows, and the total is reported alongside how many of those there
 * were so nobody reads a partial figure as a complete one. Same rule the
 * grocery list itself already follows for a line still waiting on a
 * weight: never estimate the missing part.
 */
export type TrackedSpending = {
  grocerySpend: number;
  groceryLinesWithoutPrice: number;
  therapySpend: number;
  therapySessionsWithoutCost: number;
  // A count, never a dollar figure. The app knows which grocery lines were
  // covered from the garden or a ferment instead of bought, because those
  // lines carry sourced_from_kitchen and deliberately carry no price. What
  // that produce would have cost is genuinely unknown, and turning it into
  // a saving would be inventing the number this app refuses to invent
  // everywhere else. So it is reported as what it is: lines that did not
  // have to be bought.
  kitchenCoveredLines: number;
};

export type MonthPicture = {
  month: string;
  plannedIncome: number;
  plannedCommitted: number;
  plannedSetAside: number;
  loggedIncome: number;
  loggedSpend: number;
  tracked: TrackedSpending;
  // Everything the app can actually account for going out this month:
  // entries someone logged, plus the grocery and therapy money it already
  // held. Not a claim about total spending, which this app cannot see.
  knownSpendTotal: number;
  // How many pieces of known spending are missing an amount, so the figure
  // above can be read for what it is.
  incompleteRecords: number;
  byCategory: CategoryTotal[];
};

export function buildMonthPicture(
  month: string,
  recurring: RecurringItem[],
  entries: MoneyEntry[],
  tracked: TrackedSpending,
): MonthPicture {
  const summary = summarizeRecurring(recurring);
  const inMonth = entries.filter((entry) => entry.occurredOn.slice(0, 7) === month);

  let loggedIncome = 0;
  let loggedSpend = 0;
  const categoryTotals = new Map<string, number>();

  for (const entry of inMonth) {
    if (entry.direction === 'income') {
      loggedIncome += entry.amount;
      continue;
    }
    loggedSpend += entry.amount;
    categoryTotals.set(entry.category, (categoryTotals.get(entry.category) ?? 0) + entry.amount);
  }

  // Tracked money joins the category breakdown so a month reads as one
  // picture rather than two lists the reader has to add up themselves.
  if (tracked.grocerySpend > 0) {
    categoryTotals.set('groceries', (categoryTotals.get('groceries') ?? 0) + tracked.grocerySpend);
  }
  if (tracked.therapySpend > 0) {
    categoryTotals.set('therapies', (categoryTotals.get('therapies') ?? 0) + tracked.therapySpend);
  }

  return {
    month,
    plannedIncome: summary.monthlyIncome,
    plannedCommitted: summary.monthlyCommitted,
    plannedSetAside: summary.monthlySetAside,
    loggedIncome,
    loggedSpend,
    tracked,
    knownSpendTotal: loggedSpend + tracked.grocerySpend + tracked.therapySpend,
    incompleteRecords: tracked.groceryLinesWithoutPrice + tracked.therapySessionsWithoutCost,
    byCategory: [...categoryTotals.entries()]
      .map(([category, monthly]) => ({ category, monthly }))
      .sort((a, b) => b.monthly - a.monthly),
  };
}

// --- Wording ----------------------------------------------------------------

/**
 * The plain-language reading of a month, kept here rather than in the
 * screen so it cannot drift between the Overview and anything that shows
 * this later (a Report section, most likely).
 *
 * Never states a total as complete when records are missing, and never
 * says someone is over or under budget on a partial figure.
 */
export function describeMonthPicture(picture: MonthPicture): string {
  const left = picture.plannedIncome - picture.plannedCommitted - picture.plannedSetAside;

  if (picture.plannedIncome === 0 && picture.plannedCommitted === 0) {
    return 'Add what comes in and what goes out every month, and this will show what is left before anything else happens.';
  }

  if (picture.plannedIncome === 0) {
    return 'Your bills are in, but no income is. Add what comes in and this can show what is left over rather than just what is owed.';
  }

  const shape =
    left < 0
      ? `Your regular bills and savings come to more than your income by ${formatFinanceMoney(Math.abs(left))} a month.`
      : `After your regular bills and savings, ${formatFinanceMoney(left)} a month is unspoken for.`;

  if (picture.incompleteRecords > 0) {
    const n = picture.incompleteRecords;
    return `${shape} This month's recorded spending is at ${formatFinanceMoney(picture.knownSpendTotal)} so far, with ${n} ${n === 1 ? 'record' : 'records'} still missing an amount, so treat that as a floor rather than a total.`;
  }

  return `${shape} Recorded spending this month is ${formatFinanceMoney(picture.knownSpendTotal)}.`;
}

// Kept here rather than importing lib/groceryList.ts's own formatMoney: a
// finance figure is routinely large enough to want thousands separators,
// which a grocery line never is. Same two-decimal convention, so the two
// never disagree about how many places a price shows.
export function formatFinanceMoney(value: number): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const [whole, cents] = abs.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${grouped}.${cents}`;
}

export function describeDaysAway(daysAway: number): string {
  if (daysAway === 0) return 'today';
  if (daysAway === 1) return 'tomorrow';
  return `in ${daysAway} days`;
}
