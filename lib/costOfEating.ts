// What it costs: the money side of a condition, of eating this way, of
// growing food, and of the supplements alongside it.
//
// Phase 5 of the 2026-09-23 cross-app push. Life > Finances stays the
// ledger: it holds every account, every bill, every budget limit and what
// this month came to. This lens takes only the four questions a ledger
// structurally cannot answer, because answering them means knowing which
// condition a bill was for, which grocery line came out of the garden
// instead of a shop, how many kilos a bed produced for what it cost, and
// which nutrients food is reaching by itself.
//
// Three rules run through all four bands.
//
// 1. A month with nothing recorded is a gap, never a zero. Being too busy
//    to enter a receipt is not a month of spending nothing, so every
//    monthly figure is `number | null`, a blank row says so in words, and
//    the count of blank months sits under the headline. The same reason a
//    line chart is the wrong drawing here as in every other lens of this
//    push: a line either joins across the blank, inventing a month, or
//    plots it at zero.
//
// 2. Nothing here is a projection. A repeating bill in Finances says what
//    is supposed to happen every month; this counts only money somebody
//    actually recorded on a date. A projection month by month would draw
//    a flat line out of a rule and call it history.
//
// 3. Nothing here judges a decision. Not the cost of care, not the cost of
//    eating out, and above all not a supplement somebody stopped taking.
//    Band 4 carries that boundary in a sentence that is always present.
//
// Pure: no database, no React, no dates beyond string arithmetic, so
// scripts/test_cost_of_eating.js can check every figure and every sentence
// without a phone.

import { formatTradeMoney, valueReceivedGoods, type RecordedPrice } from './harvestTrade';
import {
  buildMonths,
  formatWeight,
  harvestGrams,
  isCountUnit,
  type HarvestRecord,
  type MeasureSystem,
  type PeriodRow,
  type YieldMonth,
} from './harvestYield';

// ---------------------------------------------------------------------------
// What gets handed in
// ---------------------------------------------------------------------------

/** The five kinds of health money this app knows how to tell apart. Kept
 *  separate because a premium and a visit answer different questions: one is
 *  what having cover costs whether or not anybody is ill, the other is what
 *  being ill cost this month. */
export type HealthCostKind = 'insurance' | 'care' | 'prescriptions' | 'supplements' | 'therapies';

export const HEALTH_COST_LABELS: Record<HealthCostKind, string> = {
  insurance: 'Health insurance',
  care: 'Doctor and dental',
  prescriptions: 'Prescriptions',
  supplements: 'Supplements',
  therapies: 'Hands-on therapies',
};

export type HealthCostRecord = {
  occurredOn: string;
  amount: number;
  kind: HealthCostKind;
  /** The condition this was for, where somebody said. Never guessed. */
  conditionCode: string | null;
};

export type FoodCostKind = 'groceries' | 'diningOut';

export type FoodCostRecord = {
  occurredOn: string;
  amount: number;
  kind: FoodCostKind;
};

/** One line off a grocery list, for the half of band 2 that Finances cannot
 *  see: what was paid per food, what came out of the kitchen instead of
 *  being bought, and which prices were sale prices. */
export type GroceryLine = {
  foodName: string;
  /** The day it was dealt with, or the day the list was made. */
  on: string;
  price: number | null;
  priceUnit: string | null;
  purchasedQuantity: number | null;
  onSale: boolean;
  sourcedFromKitchen: boolean;
};

export type GrowingCostRecord = {
  occurredOn: string;
  amount: number;
  /** The area it was charged to, where somebody said. */
  plotName: string | null;
};

/** A supplement as the person described it, with the nutrients on its
 *  label. Nothing in this app records a dose being swallowed, so a run is
 *  what somebody wrote down rather than what happened. */
export type SupplementRun = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  nutrientCodes: string[];
};

/** What food by itself has been supplying lately, for one nutrient. Worked
 *  out from the same food-only series Trends > Nutrients already draws. */
export type FoodCoverage = {
  nutrientCode: string;
  displayName: string;
  /** Average percent of target from food alone, across the days counted. */
  averagePercent: number;
  days: number;
};

export type CostInputs = {
  startDate: string;
  endDate: string;
  system: MeasureSystem;
  health: HealthCostRecord[];
  conditionNames: Record<string, string>;
  food: FoodCostRecord[];
  groceryLines: GroceryLine[];
  growing: GrowingCostRecord[];
  harvests: HarvestRecord[];
  lastPaid: Record<string, RecordedPrice | undefined>;
  supplements: SupplementRun[];
  supplementSpend: { occurredOn: string; amount: number }[];
  foodCoverage: FoodCoverage[];
  /** How many days the coverage figures above were read over. */
  coverageDays: number;
};

// ---------------------------------------------------------------------------
// What comes back
// ---------------------------------------------------------------------------

/** A share of a total, where the total is money. `share` is null when there
 *  is no total to take a share of. */
export type CostSlice = {
  name: string;
  amount: number;
  display: string;
  share: number | null;
};

export type ConditionCostBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  blankMonths: number;
  gapNote: string | null;
  byKind: CostSlice[];
  byCondition: CostSlice[];
  untaggedLine: string | null;
  careLine: string | null;
  sourcesNote: string;
};

export type FoodCostBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  blankMonths: number;
  gapNote: string | null;
  perDayLine: string | null;
  splitLine: string | null;
  kitchenLine: string | null;
  saleLine: string | null;
  note: string;
};

export type GrowingCostBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  blankMonths: number;
  gapNote: string | null;
  perWeightLine: string | null;
  shopLine: string | null;
  netLine: string;
  countedOutLine: string | null;
  byAreaLine: string | null;
  caveat: string;
};

export type SupplementCostBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  blankMonths: number;
  gapNote: string | null;
  ended: { id: string; name: string; line: string }[];
  coverage: { nutrientCode: string; line: string }[];
  runningLine: string;
  coverageNote: string | null;
  boundary: string;
};

export type CostSummary = {
  startDate: string;
  endDate: string;
  system: MeasureSystem;
  months: YieldMonth[];
  hasAnything: boolean;
  condition: ConditionCostBand;
  food: FoodCostBand;
  growing: GrowingCostBand;
  supplements: SupplementCostBand;
};

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function usable(amount: number | null | undefined): number {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/** Days covered by a month, clipped at both ends by the range. Used for
 *  anything said per day, so a range starting on the 20th does not divide
 *  by a whole month nobody was counted for. */
export function daysInMonth(month: YieldMonth): number {
  const start = Date.UTC(
    Number(month.monthStart.slice(0, 4)),
    Number(month.monthStart.slice(5, 7)) - 1,
    Number(month.monthStart.slice(8, 10)),
  );
  const end = Date.UTC(
    Number(month.monthEnd.slice(0, 4)),
    Number(month.monthEnd.slice(5, 7)) - 1,
    Number(month.monthEnd.slice(8, 10)),
  );
  return Math.round((end - start) / 86400000) + 1;
}

/** Sum a set of dated amounts into one row per month, with null where the
 *  month has no record at all. The distinction is the whole gap rule: zero
 *  means a month somebody recorded and it came to nothing, null means a
 *  month nobody recorded. */
export function monthlyMoneyRows(
  months: YieldMonth[],
  records: { occurredOn: string; amount: number }[],
): PeriodRow[] {
  return months.map((month) => {
    const inMonth = records.filter((row) => row.occurredOn >= month.monthStart && row.occurredOn <= month.monthEnd);
    if (inMonth.length === 0) {
      return { key: month.monthStart, label: month.label, value: null, display: 'nothing recorded' };
    }
    const total = roundMoney(inMonth.reduce((sum, row) => sum + usable(row.amount), 0));
    return { key: month.monthStart, label: month.label, value: total, display: formatTradeMoney(total) };
  });
}

/** The sentence under a set of monthly rows, where any month was blank. */
export function describeBlankMonths(blank: number, total: number, subject: string): string | null {
  if (blank === 0) return null;
  if (blank === total) return `No ${subject} recorded in any of these months.`;
  const months = blank === 1 ? '1 month' : `${blank} months`;
  const verb = blank === 1 ? 'is' : 'are';
  return `${months} here had no ${subject} recorded, and ${verb} left blank rather than counted as nothing spent.`;
}

/** Shares of a money total, largest first, with anything at zero dropped. */
export function moneySlices(entries: { name: string; amount: number }[]): CostSlice[] {
  const total = entries.reduce((sum, entry) => sum + usable(entry.amount), 0);
  return entries
    .filter((entry) => usable(entry.amount) > 0)
    .map((entry) => ({
      name: entry.name,
      amount: roundMoney(entry.amount),
      display: formatTradeMoney(roundMoney(entry.amount)),
      share: total > 0 ? Math.round((entry.amount / total) * 100) : null,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function monthsWithAnything(rows: PeriodRow[]): number {
  return rows.filter((row) => row.value !== null).length;
}

function totalOf(rows: PeriodRow[]): number {
  return roundMoney(rows.reduce((sum, row) => sum + (row.value ?? 0), 0));
}

// ---------------------------------------------------------------------------
// Band 1: what the condition costs
// ---------------------------------------------------------------------------

/**
 * Health money month by month, split by what kind of cost it was and, where
 * somebody tagged it, which condition it was for.
 *
 * Untagged money is reported on a line of its own and never divided across
 * conditions, which is the same refusal Life > Finances already makes:
 * splitting one honest figure into several invented ones would be the
 * easiest lie in this lens to tell.
 *
 * Insurance is separated from care for a reason worth keeping. A premium is
 * what having cover costs whether anybody is ill or not, so folding it into
 * what a condition cost this month would make every month look the same and
 * hide the months that actually cost something.
 */
export function summarizeConditionCosts(
  months: YieldMonth[],
  records: HealthCostRecord[],
  conditionNames: Record<string, string>,
): ConditionCostBand {
  const sourcesNote =
    'Built from medical bills, health spending recorded in Finances, and hands-on therapy sessions. Repeating bills are left out, since a rule about what should happen every month is not a record of a month. Anything entered in two places is counted from both.';

  if (records.length === 0) {
    return {
      hasAnything: false,
      headline: 'No health spending recorded in this stretch.',
      rows: [],
      blankMonths: months.length,
      gapNote: null,
      byKind: [],
      byCondition: [],
      untaggedLine: null,
      careLine: null,
      sourcesNote,
    };
  }

  const rows = monthlyMoneyRows(months, records);
  const counted = monthsWithAnything(rows);
  const blank = rows.length - counted;
  const total = totalOf(rows);
  const perMonth = counted > 0 ? roundMoney(total / counted) : 0;

  const byKind = moneySlices(
    (Object.keys(HEALTH_COST_LABELS) as HealthCostKind[]).map((kind) => ({
      name: HEALTH_COST_LABELS[kind],
      amount: records.filter((row) => row.kind === kind).reduce((sum, row) => sum + usable(row.amount), 0),
    })),
  );

  const tagged = new Map<string, number>();
  let untagged = 0;
  for (const row of records) {
    const amount = usable(row.amount);
    if (amount === 0) continue;
    if (!row.conditionCode) {
      untagged += amount;
      continue;
    }
    tagged.set(row.conditionCode, (tagged.get(row.conditionCode) ?? 0) + amount);
  }
  const byCondition = moneySlices(
    [...tagged.entries()].map(([code, amount]) => ({ name: conditionNames[code] ?? code, amount })),
  );

  const insurance = records.filter((row) => row.kind === 'insurance').reduce((sum, row) => sum + usable(row.amount), 0);
  const care = total - insurance;

  const monthWord = counted === 1 ? 'the one month with anything recorded' : `${counted} months with anything recorded`;
  const headline = `${formatTradeMoney(total)} of health spending, averaging ${formatTradeMoney(perMonth)} a month across ${monthWord}.`;

  const careLine =
    insurance > 0 && care > 0
      ? `${formatTradeMoney(insurance)} of that is insurance, which you pay whether or not anything happens. The remaining ${formatTradeMoney(care)} is care, prescriptions, supplements and sessions.`
      : null;

  const untaggedLine =
    untagged > 0
      ? byCondition.length > 0
        ? `${formatTradeMoney(roundMoney(untagged))} is not tagged to a condition. It is left out of the per-condition figures rather than shared between them.`
        : `${formatTradeMoney(roundMoney(untagged))} recorded, none of it tagged to a condition yet. Tag a bill or a session with what it was for and this fills in.`
      : null;

  return {
    hasAnything: true,
    headline,
    rows,
    blankMonths: blank,
    gapNote: describeBlankMonths(blank, rows.length, 'health spending'),
    byKind,
    byCondition,
    untaggedLine,
    careLine,
    sourcesNote,
  };
}

// ---------------------------------------------------------------------------
// Band 2: what eating this way costs
// ---------------------------------------------------------------------------

/**
 * Food money month by month, and what that comes to a day.
 *
 * The per-day figure divides by the days inside the months that carried a
 * record, never by the whole range, so a stretch where three months were
 * entered and nine were not reports a daily figure for those three rather
 * than a quarter of the truth spread across a year.
 *
 * The split between shopping and eating out is reported plainly and carries
 * nothing about which is better. Home cooking is what the rest of this app
 * is built around, and somebody looking at this row already knows that.
 */
export function summarizeFoodCosts(
  months: YieldMonth[],
  records: FoodCostRecord[],
  lines: GroceryLine[],
): FoodCostBand {
  const note =
    'Groceries and eating out, as recorded in Finances. Anything spent on growing is in the band below instead, so the same money is never counted twice.';

  const kitchen = lines.filter((line) => line.sourcedFromKitchen);
  const priced = lines.filter((line) => usable(line.price) > 0);
  const onSale = priced.filter((line) => line.onSale);

  const kitchenLine =
    kitchen.length > 0
      ? `${kitchen.length === 1 ? '1 line on your shopping lists was' : `${kitchen.length} lines on your shopping lists were`} covered out of the kitchen instead of bought.`
      : null;

  const saleLine =
    priced.length > 0 && onSale.length > 0
      ? `${onSale.length} of ${priced.length} priced lines were on sale, so a price history read across this stretch runs lower than the usual price.`
      : null;

  if (records.length === 0) {
    return {
      hasAnything: kitchen.length > 0 || priced.length > 0,
      headline: 'No food spending recorded in this stretch.',
      rows: [],
      blankMonths: months.length,
      gapNote: null,
      perDayLine: null,
      splitLine: null,
      kitchenLine,
      saleLine,
      note,
    };
  }

  const rows = monthlyMoneyRows(months, records);
  const counted = monthsWithAnything(rows);
  const blank = rows.length - counted;
  const total = totalOf(rows);

  const daysCounted = months
    .filter((month) => rows.find((row) => row.key === month.monthStart)?.value !== null)
    .reduce((sum, month) => sum + daysInMonth(month), 0);
  const perDay = daysCounted > 0 ? roundMoney(total / daysCounted) : 0;

  const groceries = records.filter((row) => row.kind === 'groceries').reduce((sum, row) => sum + usable(row.amount), 0);
  const out = records.filter((row) => row.kind === 'diningOut').reduce((sum, row) => sum + usable(row.amount), 0);

  const headline = `${formatTradeMoney(perDay)} a day on food, from ${formatTradeMoney(total)} across ${daysCounted} ${daysCounted === 1 ? 'day' : 'days'}.`;

  const perDayLine =
    blank > 0
      ? 'Worked out over the days inside the months that carried a record, so the months you did not enter anything for do not water the figure down.'
      : null;

  let splitLine: string | null = null;
  if (groceries > 0 && out > 0) {
    const outShare = Math.round((out / (groceries + out)) * 100);
    splitLine = `${formatTradeMoney(roundMoney(groceries))} of it was shopping and ${formatTradeMoney(roundMoney(out))} was eating out, which is ${outShare}% of your food money spent on meals somebody else made.`;
  } else if (out > 0) {
    splitLine = `All of it was eating out. Nothing has been recorded under groceries in this stretch.`;
  } else if (groceries > 0) {
    splitLine = `All of it was shopping. Nothing has been recorded under eating out in this stretch.`;
  }

  return {
    hasAnything: true,
    headline,
    rows,
    blankMonths: blank,
    gapNote: describeBlankMonths(blank, rows.length, 'food spending'),
    perDayLine,
    splitLine,
    kitchenLine,
    saleLine,
    note,
  };
}

// ---------------------------------------------------------------------------
// Band 3: what the garden costs, per kilo
// ---------------------------------------------------------------------------

/**
 * Growing money against growing weight.
 *
 * Phase 4's refusal carries straight through: a count of cucumbers is a
 * count and never becomes a weight, so the cost per kilo is taken only over
 * what was weighed, and the crops somebody counts are named as left out.
 * Without that, a hundred cucumbers would silently read as a hundred grams
 * or a hundred kilos depending on which way the mistake fell.
 *
 * The caveat is always present because the figure is honestly misleading
 * early on. A raised bed and a bag of compost bought in March feed several
 * years of picking, and charging all of it against one spring reads as
 * vegetables that cost forty dollars a kilo.
 */
export function summarizeGrowingCosts(
  months: YieldMonth[],
  costs: GrowingCostRecord[],
  harvests: HarvestRecord[],
  lastPaid: Record<string, RecordedPrice | undefined>,
  system: MeasureSystem,
): GrowingCostBand {
  const caveat =
    'Anything bought once feeds more than one season, so a cost per weight taken over a short stretch reads high. It settles as more is picked against the same spending.';

  const rows = costs.length > 0 ? monthlyMoneyRows(months, costs) : [];
  const counted = monthsWithAnything(rows);
  const blank = rows.length - counted;
  const spent = totalOf(rows);

  let grams = 0;
  let countedOut = 0;
  for (const harvest of harvests) {
    const asGrams = harvestGrams(harvest.quantity, harvest.unit);
    if (asGrams === null) {
      if (isCountUnit(harvest.unit)) countedOut += 1;
      continue;
    }
    grams += asGrams;
  }

  const valuation = valueReceivedGoods(
    harvests.map((harvest) => ({ foodName: harvest.foodName, quantity: harvest.quantity, unit: harvest.unit })),
    lastPaid,
  );
  const avoided = roundMoney(valuation.avoidedCost);
  const net = roundMoney(avoided - spent);

  if (costs.length === 0 && harvests.length === 0) {
    return {
      hasAnything: false,
      headline: 'Nothing spent on growing and nothing picked in this stretch.',
      rows: [],
      blankMonths: months.length,
      gapNote: null,
      perWeightLine: null,
      shopLine: null,
      netLine: 'Record a growing cost under Garden and a picking under Harvest Log, and this fills in.',
      countedOutLine: null,
      byAreaLine: null,
      caveat,
    };
  }

  const kilos = grams / 1000;
  const pounds = grams / 453.592;
  const perWeight =
    spent > 0 && grams > 0
      ? system === 'imperial'
        ? `${formatTradeMoney(roundMoney(spent / pounds))} a pound`
        : `${formatTradeMoney(roundMoney(spent / kilos))} a kilo`
      : null;

  const headline =
    perWeight !== null
      ? `${perWeight}, from ${formatTradeMoney(spent)} spent against ${formatWeight(grams, system)} picked.`
      : spent > 0
        ? `${formatTradeMoney(spent)} spent on growing, with nothing weighed yet to set it against.`
        : `${formatWeight(grams, system)} picked, with no growing costs recorded against it.`;

  const perWeightLine =
    perWeight !== null
      ? `That is what every ${system === 'imperial' ? 'pound' : 'kilo'} you weighed has cost you in growing money over this stretch.`
      : null;

  // Against the shop, but only where a price was actually paid for that
  // food before. A price this person never paid would be a guess with a
  // dollar sign in front of it.
  const shopLine =
    avoided > 0 && grams > 0
      ? `At prices you have recorded paying, the same picking would have cost ${formatTradeMoney(avoided)} in a shop.`
      : null;

  let netLine: string;
  if (avoided === 0 && spent === 0) {
    netLine = 'Nothing priced on either side yet.';
  } else if (avoided === 0) {
    netLine = `${formatTradeMoney(spent)} spent on growing, and none of what you picked matches a price you have recorded paying, so there is nothing to set against it yet.`;
  } else if (net > 0) {
    netLine = `${formatTradeMoney(net)} more than it cost, counting only what has a recorded price.`;
  } else if (net < 0) {
    netLine = `${formatTradeMoney(Math.abs(net))} more spent than the priced picking comes to so far.`;
  } else {
    netLine = 'What you spent and what the priced picking comes to match exactly.';
  }

  const unpriced = valuation.unvalued.length;
  if (unpriced > 0 && avoided > 0) {
    netLine += ` ${unpriced === 1 ? '1 picking has' : `${unpriced} pickings have`} no matching recorded price and ${unpriced === 1 ? 'is' : 'are'} left out of that figure, so the garden gave back more than this shows.`;
  }

  const countedOutLine =
    countedOut > 0
      ? `${countedOut === 1 ? '1 picking was' : `${countedOut} pickings were`} counted rather than weighed, and ${countedOut === 1 ? 'is' : 'are'} left out of the cost per weight. A count of cucumbers is not a weight and is never turned into one.`
      : null;

  const areas = new Map<string, number>();
  let untied = 0;
  for (const cost of costs) {
    const amount = usable(cost.amount);
    if (amount === 0) continue;
    if (!cost.plotName) {
      untied += amount;
      continue;
    }
    areas.set(cost.plotName, (areas.get(cost.plotName) ?? 0) + amount);
  }
  const areaSlices = moneySlices([...areas.entries()].map(([name, amount]) => ({ name, amount })));
  let byAreaLine: string | null = null;
  if (areaSlices.length === 1 && untied === 0) {
    byAreaLine = `All of it went to ${areaSlices[0].name}.`;
  } else if (areaSlices.length > 0) {
    byAreaLine = `Most of it went to ${areaSlices[0].name}, at ${areaSlices[0].display}.${untied > 0 ? ` A further ${formatTradeMoney(roundMoney(untied))} was not tied to one area.` : ''}`;
  } else if (untied > 0) {
    byAreaLine = 'None of it was tied to a particular area.';
  }

  return {
    hasAnything: true,
    headline,
    rows,
    blankMonths: blank,
    gapNote: describeBlankMonths(blank, rows.length, 'growing spending'),
    perWeightLine,
    shopLine,
    netLine,
    countedOutLine,
    byAreaLine,
    caveat,
  };
}

// ---------------------------------------------------------------------------
// Band 4: supplements, and what food is reaching by itself
// ---------------------------------------------------------------------------

/** How long a run lasted, in words, from whatever dates were given. */
export function describeRunLength(startDate: string | null, endDate: string | null): string | null {
  if (!startDate || !endDate || endDate < startDate) return null;
  const start = Date.UTC(Number(startDate.slice(0, 4)), Number(startDate.slice(5, 7)) - 1, Number(startDate.slice(8, 10)));
  const end = Date.UTC(Number(endDate.slice(0, 4)), Number(endDate.slice(5, 7)) - 1, Number(endDate.slice(8, 10)));
  const days = Math.round((end - start) / 86400000);
  if (days < 1) return 'less than a day';
  if (days < 60) return `${days} ${days === 1 ? 'day' : 'days'}`;
  const months = Math.round(days / 30);
  if (months < 24) return `about ${months} months`;
  return `about ${roundTo(days / 365, 1)} years`;
}

/**
 * The supplements side, which is the one band in this lens with a boundary
 * written into it rather than a caveat.
 *
 * The stated goal of this app is that food supplies the optimum and a
 * supplement covers only what a diet cannot. So this band reports two
 * things: what supplements have cost month by month, and, for the nutrients
 * carried by supplements that ended in this stretch, what food by itself has
 * been reaching lately.
 *
 * It says nothing about whether stopping any of them was right. It reports
 * that a target is being met by food, which is the stated goal, and never
 * that a capsule was unnecessary. Nothing in this app records a dose being
 * swallowed, and nothing here is advice to stop taking anything.
 */
export function summarizeSupplementCosts(
  months: YieldMonth[],
  supplements: SupplementRun[],
  spend: { occurredOn: string; amount: number }[],
  coverage: FoodCoverage[],
  coverageDays: number,
  startDate: string,
  endDate: string,
): SupplementCostBand {
  const boundary =
    'Nothing here says whether stopping any supplement was right. It reports what food is reaching, which is the goal this app is built around, and never that a supplement was unnecessary. Nothing in this app records a dose being swallowed, and none of this is advice to stop taking anything.';

  const rows = spend.length > 0 ? monthlyMoneyRows(months, spend) : [];
  const counted = monthsWithAnything(rows);
  const blank = rows.length - counted;
  const total = totalOf(rows);

  const endedRuns = supplements.filter(
    (run) => run.endDate !== null && run.endDate >= startDate && run.endDate <= endDate,
  );
  const running = supplements.filter((run) => run.active && !run.endDate);

  const ended = endedRuns.map((run) => {
    const length = describeRunLength(run.startDate, run.endDate);
    const line = length
      ? `Ended ${run.endDate}, after ${length}.`
      : `Ended ${run.endDate}. No start date was recorded, so how long it ran is not known.`;
    return { id: run.id, name: run.name, line };
  });

  const endedCodes = new Set(endedRuns.flatMap((run) => run.nutrientCodes));
  const coverageLines = coverage
    .filter((entry) => endedCodes.has(entry.nutrientCode) && entry.days > 0)
    .map((entry) => ({
      nutrientCode: entry.nutrientCode,
      line: `${entry.displayName}: food by itself has averaged ${Math.round(entry.averagePercent)}% of the target across ${entry.days} ${entry.days === 1 ? 'day' : 'days'} with a meal logged.`,
    }));

  const coverageNote =
    coverageLines.length > 0
      ? `Read over the last ${coverageDays} days, counting only days with a meal logged, and only the nutrients carried by the supplements above.`
      : endedRuns.length > 0
        ? 'No nutrients are recorded on the labels of the supplements that ended, so there is nothing to read food against. Add what a supplement contains under Life > My Meds and this fills in.'
        : null;

  const runningLine =
    running.length === 0
      ? 'Nothing is recorded as running right now.'
      : `${running.length === 1 ? '1 supplement is' : `${running.length} supplements are`} recorded as running right now. The ones food is not covering are the ones to keep.`;

  const hasAnything = spend.length > 0 || supplements.length > 0;

  let headline: string;
  if (total > 0 && counted > 0) {
    headline = `${formatTradeMoney(total)} on supplements, averaging ${formatTradeMoney(roundMoney(total / counted))} a month across ${counted === 1 ? 'the one month with anything recorded' : `${counted} months with anything recorded`}.`;
  } else if (supplements.length > 0) {
    headline = 'No supplement spending recorded in this stretch.';
  } else {
    headline = 'No supplements and no supplement spending recorded in this stretch.';
  }

  return {
    hasAnything,
    headline,
    rows,
    blankMonths: blank,
    gapNote: describeBlankMonths(blank, rows.length, 'supplement spending'),
    ended,
    coverage: coverageLines,
    runningLine,
    coverageNote,
    boundary,
  };
}

// ---------------------------------------------------------------------------
// The whole lens
// ---------------------------------------------------------------------------

export function summarizeCosts(input: CostInputs): CostSummary {
  const months = buildMonths(input.startDate, input.endDate);

  const condition = summarizeConditionCosts(months, input.health, input.conditionNames);
  const food = summarizeFoodCosts(months, input.food, input.groceryLines);
  const growing = summarizeGrowingCosts(months, input.growing, input.harvests, input.lastPaid, input.system);
  const supplements = summarizeSupplementCosts(
    months,
    input.supplements,
    input.supplementSpend,
    input.foodCoverage,
    input.coverageDays,
    input.startDate,
    input.endDate,
  );

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    system: input.system,
    months,
    hasAnything: condition.hasAnything || food.hasAnything || growing.hasAnything || supplements.hasAnything,
    condition,
    food,
    growing,
    supplements,
  };
}
