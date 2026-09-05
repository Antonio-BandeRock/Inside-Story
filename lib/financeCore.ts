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
  type FinanceCategoryGroup,
  type FinanceDirection,
} from './financeCategories';
import { daysBetween, monthlyFactor, nextOccurrence, occurrencesPerYear, type DueRule } from './financeSchedule';

// --- Frequency ------------------------------------------------------------
//
// How often a thing repeats is DERIVED from its due rule (see
// lib/financeSchedule.ts) rather than stored beside it, so the two can
// never disagree. The arithmetic that matters, and the traps in it, are
// documented there: a month is not four weeks, every 2 weeks is not twice
// a month, and every 4 weeks is not monthly.
//
// The one exception below is a row that predates the rule model. Finances
// shipped in 1.0.34.1 storing a plain cadence word plus an optional day of
// the month, and most of those cannot be migrated into a rule because they
// never carried enough to place them on a calendar (see the migration in
// lib/db.ts). Their frequency IS known, though, because their owner chose
// it, so this keeps them counting correctly in monthly totals until the
// missing piece is filled in. It exists to be deleted once no row needs
// it, and nothing new ever writes these values.
export const LEGACY_CADENCE_MONTHLY: Record<string, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  annual: 1 / 12,
};

// --- What repeats ----------------------------------------------------------

export type RecurringItem = {
  id: string;
  direction: FinanceDirection;
  name: string;
  category: string;
  amount: number;
  // How often AND when, in one value. Null means it has not been set up
  // yet, which is a real state: an every-2-weeks bill with no date it last
  // landed on genuinely cannot be placed, and so does a yearly one with no
  // month. Such a bill still counts toward monthly totals via
  // legacyCadence, and Coming Up names it rather than dropping it.
  rule: DueRule | null;
  // Only ever set on a row written before the rule model. See
  // LEGACY_CADENCE_MONTHLY.
  legacyCadence: string | null;
  autopay: boolean;
  active: boolean;
};

/**
 * How many times a year this repeats, from its rule where it has one and
 * from the legacy cadence where it does not. Returns null when neither is
 * known, so a total can leave it out rather than counting it as zero and
 * quietly understating a month.
 */
export function itemMonthlyFactor(item: RecurringItem): number | null {
  if (item.rule) return monthlyFactor(item.rule);
  if (item.legacyCadence && LEGACY_CADENCE_MONTHLY[item.legacyCadence] != null) {
    return LEGACY_CADENCE_MONTHLY[item.legacyCadence];
  }
  return null;
}

export function itemMonthly(item: RecurringItem): number {
  const factor = itemMonthlyFactor(item);
  return factor == null ? 0 : item.amount * factor;
}

export function itemAnnual(item: RecurringItem): number {
  if (item.rule) return item.amount * occurrencesPerYear(item.rule);
  const factor = itemMonthlyFactor(item);
  return factor == null ? 0 : item.amount * factor * 12;
}

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
    const monthly = itemMonthly(item);
    const annual = itemAnnual(item);

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

export type UpcomingResult = {
  bills: UpcomingBill[];
  total: number;
  // Bills that cannot be put on a calendar yet, because their rule is
  // missing the piece that says where it lands: which weekday, which week
  // it last fell in, or which month a longer cycle counts from. Returned
  // rather than filtered away, because a bill silently absent from Coming
  // Up is worse than one shown as needing attention. The shipped version
  // dropped these without saying so.
  needsSetup: RecurringItem[];
};

/**
 * Bills landing within `withinDays` of `fromDate`, soonest first, plus
 * the ones that could not be placed at all.
 *
 * Placement is entirely the rule's job (lib/financeSchedule.ts); this
 * decides only what is in range and what to say about the rest.
 */
export function upcomingBills(items: RecurringItem[], fromDate: string, withinDays: number): UpcomingResult {
  const bills: UpcomingBill[] = [];
  const needsSetup: RecurringItem[] = [];

  for (const item of items) {
    if (!item.active || item.direction !== 'expense') continue;

    const dueDate = item.rule ? nextOccurrence(item.rule, fromDate) : null;
    if (!dueDate) {
      needsSetup.push(item);
      continue;
    }
    const daysAway = daysBetween(fromDate, dueDate);
    if (daysAway == null || daysAway > withinDays) continue;
    bills.push({ item, dueDate, daysAway });
  }

  bills.sort((a, b) => a.daysAway - b.daysAway || b.item.amount - a.item.amount);
  return { bills, total: bills.reduce((sum, entry) => sum + entry.item.amount, 0), needsSetup };
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
