// From the garden onto the plate: which of the foods somebody eats came out
// of their own growing, and what that came to.
//
// Phase 6 of the 2026-09-23 cross-app push, and the last of it, because it
// is the only piece in the push that needs capture nobody has done yet. It
// says nothing at all until a garden has fed somebody for a season.
//
// The gap it closes. garden_harvests has carried quantity_remaining since
// the Harvest Log was built, and Food's "From Your Harvest" picker has been
// able to resolve a food from a picking for just as long. What that picker
// never did was take anything off the picking or write down that the food
// went onto a plate, so a bed could feed a household all summer and nothing
// in the app would know. recordHarvestUsage decrements a single number and
// keeps no history, which is the shape markUpkeepDone had before phase 3
// gave it upkeep_doings, so this needs an append-only record beside it
// rather than a second reading of one.
//
// Two rules run through everything here.
//
// 1. Units are never converted across kinds. A price recorded per package
//    says nothing about a kilo, and a count of cucumbers is a count. So an
//    amount comes off a picking only when the meal recorded the same unit
//    that picking is measured in, and where it did not, the row says so out
//    loud and the amount on hand is left alone.
//
// 2. A week or a month nobody logged is a gap, never a zero. Being too busy
//    to log is not a week of eating nothing, so every periodic figure is
//    `number | null`, a blank row says so in words, and the count of blank
//    periods sits under the headline.
//
// Pure: no database, no React, no clock, so scripts/test_plate_source.js can
// check every figure and every sentence without a phone.

import { formatQuantity, formatTradeMoney, harvestUnitForPricing, valueReceivedGoods, type RecordedPrice } from './harvestTrade';
import { shortDate, type VarietyWeek } from './eatingVariety';
import type { PeriodRow, YieldMonth } from './harvestYield';

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** The same normalisation valueReceivedGoods uses on a unit, kept here so a
 *  draw-down and a valuation agree about when two units are the same word. */
function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/s$/, '');
}

function sameFood(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function usableAmount(amount: number | null | undefined): number | null {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : null;
}

// ---------------------------------------------------------------------------
// What gets handed in
// ---------------------------------------------------------------------------

/** A picking with something left on it, as the Harvest Log recorded it. */
export type OnHandHarvest = {
  id: string;
  foodId: number;
  source: string;
  foodName: string;
  /** 'YYYY-MM-DD', already a local date in garden_harvests. */
  harvestedOn: string;
  unit: string;
  quantityRemaining: number;
  plotName: string | null;
};

/** One ingredient row off a meal that was just saved. `amount` is
 *  meal_items.serving_size, which is the amount in the DISH rather than the
 *  eater's share: all of it left the garden even where one person ate a
 *  third of it, so the share is deliberately not applied here. */
export type LoggedIngredient = {
  foodId: string | null;
  foodName: string;
  amount: number | null;
  unit: string | null;
};

/** One row of the append-only record: a picking that went onto a plate. */
export type PlateUse = {
  id: string;
  harvestId: string;
  foodName: string;
  /** 0 where the amount could not be told from what the meal recorded. */
  quantityUsed: number;
  unit: string;
  /** Local 'YYYY-MM-DD', the day the meal was eaten. */
  usedOn: string;
};

// ---------------------------------------------------------------------------
// The offer, at the moment a meal is saved
// ---------------------------------------------------------------------------

export type PlateOffer = {
  harvestId: string;
  foodId: number;
  source: string;
  foodName: string;
  /** What the picking is measured in. */
  unit: string;
  quantityRemaining: number;
  harvestedOn: string;
  plotName: string | null;
  /** How much to take off the picking, or null where the meal's units are
   *  not the picking's and nothing can be taken off without inventing a
   *  conversion. */
  drawDown: number | null;
  line: string;
};

type Collected = {
  harvest: OnHandHarvest;
  /** Summed logged amount that was recorded in the picking's own unit. */
  sameUnit: number | null;
  /** Amounts the meal recorded in some other unit, worded for the line. */
  otherUnits: string[];
  /** Ingredient rows that recorded no amount at all. */
  noAmount: number;
};

function matchesFood(ingredient: LoggedIngredient, harvest: OnHandHarvest): boolean {
  // A meal item's food_id is "<food_id>|<source>", which is exactly what
  // identifies a harvest's food too, so where both carry one they settle it
  // and a rename on either side changes nothing. Falling back to the name
  // covers a free-text ingredient somebody typed.
  if (ingredient.foodId) return ingredient.foodId === `${harvest.foodId}|${harvest.source}`;
  return sameFood(ingredient.foodName, harvest.foodName);
}

/**
 * Which pickings the meal just saved could have come from, in the order the
 * meal listed them.
 *
 * The oldest picking of a food is offered first, which is how anybody with a
 * fridge works through what they grew. A meal listing the same food twice
 * (two dishes both using basil) adds up to one offer against one picking
 * rather than two offers that would draw it down twice.
 */
export function buildPlateOffers(ingredients: LoggedIngredient[], harvests: OnHandHarvest[]): PlateOffer[] {
  const oldestFirst = harvests
    .filter((harvest) => harvest.quantityRemaining > 0)
    .sort((a, b) => (a.harvestedOn === b.harvestedOn ? a.id.localeCompare(b.id) : a.harvestedOn < b.harvestedOn ? -1 : 1));

  const collected = new Map<string, Collected>();

  for (const ingredient of ingredients) {
    const harvest = oldestFirst.find((candidate) => matchesFood(ingredient, candidate));
    if (!harvest) continue;

    const entry: Collected =
      collected.get(harvest.id) ?? { harvest, sameUnit: null, otherUnits: [], noAmount: 0 };

    const amount = usableAmount(ingredient.amount);
    if (amount === null) {
      entry.noAmount += 1;
    } else if (ingredient.unit && normalizeUnit(ingredient.unit) === normalizeUnit(harvest.unit)) {
      entry.sameUnit = (entry.sameUnit ?? 0) + amount;
    } else {
      entry.otherUnits.push(formatQuantity(amount, ingredient.unit ?? ''));
    }

    collected.set(harvest.id, entry);
  }

  return [...collected.values()].map((entry) => offerFrom(entry));
}

function offerFrom(entry: Collected): PlateOffer {
  const { harvest } = entry;
  const where = harvest.plotName ? ` from ${harvest.plotName}` : '';
  const onHand = formatQuantity(harvest.quantityRemaining, harvest.unit);
  const drawDown = entry.sameUnit === null ? null : Math.min(entry.sameUnit, harvest.quantityRemaining);

  let line: string;
  if (drawDown !== null && entry.sameUnit !== null) {
    line = `${formatQuantity(drawDown, harvest.unit)} off the ${onHand} picked ${shortDate(harvest.harvestedOn)}${where}.`;
    if (entry.sameUnit > harvest.quantityRemaining) {
      line += ` Your meal recorded ${formatQuantity(entry.sameUnit, harvest.unit)}, more than is left on this picking, so all of it comes off and the rest came from somewhere else.`;
    }
  } else if (entry.otherUnits.length > 0) {
    line = `Picked ${shortDate(harvest.harvestedOn)}${where}, ${onHand} still on hand. Your meal recorded ${entry.otherUnits.join(' and ')}, which is not what this picking is measured in, so nothing comes off it. Mark it used under Garden > Harvest Log once you know how much.`;
  } else {
    line = `Picked ${shortDate(harvest.harvestedOn)}${where}, ${onHand} still on hand. Your meal recorded no amount, so nothing comes off it.`;
  }

  return {
    harvestId: harvest.id,
    foodId: harvest.foodId,
    source: harvest.source,
    foodName: harvest.foodName,
    unit: harvest.unit,
    quantityRemaining: harvest.quantityRemaining,
    harvestedOn: harvest.harvestedOn,
    plotName: harvest.plotName,
    drawDown,
    line,
  };
}

export function describePlateOffer(offers: PlateOffer[]): string {
  if (offers.length === 0) return 'Nothing in this meal matches a picking you still have on hand.';
  return `${offers.length} ${plural(offers.length, 'food', 'foods')} in this meal came out of your garden.`;
}

/** What the one tap does, worded for what it can actually do to these rows. */
export function describePlateAction(offers: PlateOffer[]): string {
  const drawn = offers.filter((offer) => offer.drawDown !== null && offer.drawDown > 0).length;
  if (drawn === 0) {
    return 'Keeping this writes down what your garden fed you. Nothing comes off what is on hand, because no amount here was recorded in the units your pickings are measured in.';
  }
  if (drawn === offers.length) {
    return 'Keeping this writes down what your garden fed you and takes the amounts above off what is still on hand.';
  }
  return `Keeping this writes down what your garden fed you. ${drawn} of the ${offers.length} amounts above come off what is still on hand; the rest stay as they are.`;
}

export type PlateUseDraft = {
  harvestId: string;
  mealId: string | null;
  foodId: number;
  source: string;
  foodName: string;
  quantityUsed: number;
  unit: string;
  usedOn: string;
  /** Whether garden_harvests.quantity_remaining should come down too. */
  drawsDown: boolean;
};

/**
 * What to write, for a set of offers somebody kept.
 *
 * Every offer becomes a record of the food going onto a plate, including one
 * whose amount could not be told: the garden fed somebody either way, and
 * the share band counts foods rather than weight. Only an offer with an
 * amount in the picking's own unit takes anything off what is on hand.
 */
export function planPlateUses(offers: PlateOffer[], mealId: string | null, usedOn: string): PlateUseDraft[] {
  return offers.map((offer) => ({
    harvestId: offer.harvestId,
    mealId,
    foodId: offer.foodId,
    source: offer.source,
    foodName: offer.foodName,
    quantityUsed: offer.drawDown ?? 0,
    unit: offer.unit,
    usedOn,
    drawsDown: offer.drawDown !== null && offer.drawDown > 0,
  }));
}

// ---------------------------------------------------------------------------
// Band on Trends > What You Eat: the garden share of what gets eaten
// ---------------------------------------------------------------------------

/** One logged food, as Trends > What You Eat already reads them. */
export type EatenFood = {
  /** 'YYYY-MM-DD', the local day the meal was eaten. */
  date: string;
  foodKey: string;
  foodName: string;
};

export type PlateShareInputs = {
  startDate: string;
  endDate: string;
  eaten: EatenFood[];
  uses: PlateUse[];
};

export type PlateShareCrop = { foodName: string; times: number; line: string };

export type PlateShareBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  blankWeeks: number;
  gapNote: string | null;
  fromGarden: number;
  totalFoods: number;
  crops: PlateShareCrop[];
  unmatchedLine: string | null;
  caveat: string;
};

function describeBlankPeriods(blank: number, total: number, word: string): string | null {
  if (blank === 0) return null;
  const verb = blank === 1 ? 'has' : 'have';
  return `${blank} of the ${total} ${plural(total, word, `${word}s`)} ${verb} nothing logged and ${plural(blank, 'is', 'are')} left blank rather than counted as none.`;
}

/**
 * How much of what somebody ate came out of their garden, week by week.
 *
 * A logged food counts as home grown when a picking was marked onto a plate
 * on the same local day under the same food name. That is deliberately
 * strict: one tap can cover food cooked on Sunday and eaten on Monday, and
 * matching loosely across days would credit the garden for meals it had
 * nothing to do with. So this undercounts rather than guessing, and the
 * caveat says so where anybody can read it.
 */
export function summarizePlateShare(inputs: PlateShareInputs, weeks: VarietyWeek[]): PlateShareBand {
  const caveat =
    'This counts foods on a plate rather than weight, and one marking covers the day the meal was eaten. Food you picked on Sunday and ate on Monday is left out rather than guessed at.';

  const usesByDay = new Map<string, PlateUse[]>();
  for (const use of inputs.uses) {
    const day = usesByDay.get(use.usedOn);
    if (day) day.push(use);
    else usesByDay.set(use.usedOn, [use]);
  }

  // Each use is spent on at most one logged food, and each logged food is
  // credited at most once, so two pickings of basil on one day cannot make
  // one salad count twice.
  const spent = new Set<string>();
  const homeGrown = new Set<number>();
  const cropTimes = new Map<string, number>();

  inputs.eaten.forEach((food, index) => {
    const candidates = usesByDay.get(food.date);
    if (!candidates) return;
    const match = candidates.find((use) => !spent.has(use.id) && sameFood(use.foodName, food.foodName));
    if (!match) return;
    spent.add(match.id);
    homeGrown.add(index);
    cropTimes.set(match.foodName, (cropTimes.get(match.foodName) ?? 0) + 1);
  });

  const rows: PeriodRow[] = weeks.map((week) => {
    const inWeek = inputs.eaten
      .map((food, index) => ({ food, index }))
      .filter((entry) => entry.food.date >= week.weekStart && entry.food.date <= week.weekEnd);
    if (!week.hasLogging || inWeek.length === 0) {
      return { key: week.weekStart, label: shortDate(week.weekStart), value: null, display: 'not logged' };
    }
    const grown = inWeek.filter((entry) => homeGrown.has(entry.index)).length;
    const percent = Math.round((grown / inWeek.length) * 100);
    return { key: week.weekStart, label: shortDate(week.weekStart), value: percent, display: `${percent}%` };
  });

  const blankWeeks = rows.filter((row) => row.value === null).length;
  const totalFoods = inputs.eaten.length;
  const fromGarden = homeGrown.size;

  const crops: PlateShareCrop[] = [...cropTimes.entries()]
    .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
    .slice(0, 5)
    .map(([foodName, times]) => ({
      foodName,
      times,
      line: `${times} ${plural(times, 'time', 'times')} on a plate in this stretch.`,
    }));

  const leftOver = inputs.uses.filter((use) => !spent.has(use.id)).length;
  const unmatchedLine =
    leftOver === 0
      ? null
      : `${leftOver} ${plural(leftOver, 'marking', 'markings')} from the garden ${plural(leftOver, 'lines', 'line')} up with no food logged the same day, so ${plural(leftOver, 'it is', 'they are')} left out of the share above.`;

  let headline: string;
  if (totalFoods === 0) {
    headline = 'Nothing logged in this stretch, so there is nothing yet to say how much of it came from your garden.';
  } else if (fromGarden === 0) {
    headline =
      'None of what you logged in this stretch was marked as coming from your garden. Log a meal using something you picked and the offer comes up on its own.';
  } else {
    const percent = Math.round((fromGarden / totalFoods) * 100);
    headline = `${percent}% of the foods you logged came out of your garden, ${fromGarden} of ${totalFoods}.`;
  }

  return {
    hasAnything: inputs.uses.length > 0 || totalFoods > 0,
    headline,
    rows,
    blankWeeks,
    gapNote: describeBlankPeriods(blankWeeks, rows.length, 'week'),
    fromGarden,
    totalFoods,
    crops,
    unmatchedLine,
    caveat,
  };
}

// ---------------------------------------------------------------------------
// Band on Trends > What It Costs: what the garden share came to
// ---------------------------------------------------------------------------

export type PlateValueInputs = {
  startDate: string;
  endDate: string;
  uses: PlateUse[];
  lastPaid: Record<string, RecordedPrice | undefined>;
};

export type PlateValueCrop = { foodName: string; amount: number; line: string };

export type PlateValueBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  blankMonths: number;
  gapNote: string | null;
  totalAvoided: number;
  crops: PlateValueCrop[];
  unpricedLine: string | null;
  noAmountLine: string | null;
  boundary: string;
};

function valueUses(uses: PlateUse[], lastPaid: Record<string, RecordedPrice | undefined>) {
  return valueReceivedGoods(
    uses
      .filter((use) => use.quantityUsed > 0)
      .map((use) => ({ foodName: use.foodName, quantity: use.quantityUsed, unit: harvestUnitForPricing(use.unit) })),
    lastPaid,
  );
}

/**
 * What the garden put on the plate would have cost at a shop, month by
 * month.
 *
 * Money not spent rather than money made, and worked out only from prices
 * this person has recorded paying for the same food in the same unit. A crop
 * they have never bought is counted and left out of the figure instead of
 * being guessed at, which is the refusal lib/harvestTrade.ts makes everywhere
 * else money touches a harvest.
 */
export function summarizePlateValue(inputs: PlateValueInputs, months: YieldMonth[]): PlateValueBand {
  const boundary =
    'This is money you did not spend at a shop rather than money made. The band above values everything you picked, and this values only the part that reached a plate, so the two read the same pickings different ways rather than adding together.';

  const rows: PeriodRow[] = months.map((month) => {
    const inMonth = inputs.uses.filter((use) => use.usedOn >= month.monthStart && use.usedOn <= month.monthEnd);
    if (inMonth.length === 0) {
      return { key: month.monthStart, label: month.label, value: null, display: 'nothing marked' };
    }
    const amount = roundMoney(valueUses(inMonth, inputs.lastPaid).avoidedCost);
    return { key: month.monthStart, label: month.label, value: amount, display: formatTradeMoney(amount) };
  });

  const blankMonths = rows.filter((row) => row.value === null).length;
  const valuation = valueUses(inputs.uses, inputs.lastPaid);
  const totalAvoided = roundMoney(valuation.avoidedCost);

  const byCrop = new Map<string, number>();
  for (const entry of valuation.valued) {
    byCrop.set(entry.foodName, (byCrop.get(entry.foodName) ?? 0) + entry.amount);
  }
  const crops: PlateValueCrop[] = [...byCrop.entries()]
    .map(([foodName, amount]) => ({ foodName, amount: roundMoney(amount) }))
    .sort((a, b) => (b.amount === a.amount ? a.foodName.localeCompare(b.foodName) : b.amount - a.amount))
    .slice(0, 5)
    .map((crop) => ({ ...crop, line: `${formatTradeMoney(crop.amount)} of ${crop.foodName}.` }));

  const unpriced = valuation.unvalued.length;
  const unpricedLine =
    unpriced === 0
      ? null
      : `${unpriced} ${plural(unpriced, 'marking', 'markings')} ${plural(unpriced, 'has', 'have')} no matching price you have recorded paying and ${plural(unpriced, 'is', 'are')} left out of the figure, so your garden fed you more than this shows.`;

  const noAmount = inputs.uses.filter((use) => use.quantityUsed <= 0).length;
  const noAmountLine =
    noAmount === 0
      ? null
      : `${noAmount} ${plural(noAmount, 'marking', 'markings')} ${plural(noAmount, 'carries', 'carry')} no amount, because the meal recorded units your picking is not measured in, and ${plural(noAmount, 'is', 'are')} counted here without a figure.`;

  let headline: string;
  if (inputs.uses.length === 0) {
    headline = 'Nothing from the garden has been marked onto a plate in this stretch yet.';
  } else if (totalAvoided === 0) {
    headline = `${inputs.uses.length} ${plural(inputs.uses.length, 'picking', 'pickings')} went onto a plate in this stretch, and none of them matches a price you have recorded paying, so there is no figure to put on them yet.`;
  } else {
    headline = `${formatTradeMoney(totalAvoided)} of shop food your garden replaced on your plate in this stretch.`;
  }

  return {
    hasAnything: inputs.uses.length > 0,
    headline,
    rows,
    blankMonths,
    gapNote: describeBlankPeriods(blankMonths, rows.length, 'month'),
    totalAvoided,
    crops,
    unpricedLine,
    noAmountLine,
    boundary,
  };
}

// ---------------------------------------------------------------------------
// Every sentence, for the test script's forbidden-words sweep
// ---------------------------------------------------------------------------

export function everySentence(parts: {
  offers?: PlateOffer[];
  share?: PlateShareBand;
  value?: PlateValueBand;
}): string[] {
  const out: string[] = [];
  if (parts.offers) {
    out.push(describePlateOffer(parts.offers), describePlateAction(parts.offers));
    for (const offer of parts.offers) out.push(offer.line);
  }
  if (parts.share) {
    out.push(parts.share.headline, parts.share.caveat);
    if (parts.share.gapNote) out.push(parts.share.gapNote);
    if (parts.share.unmatchedLine) out.push(parts.share.unmatchedLine);
    for (const crop of parts.share.crops) out.push(crop.line);
    for (const row of parts.share.rows) out.push(row.display);
  }
  if (parts.value) {
    out.push(parts.value.headline, parts.value.boundary);
    if (parts.value.gapNote) out.push(parts.value.gapNote);
    if (parts.value.unpricedLine) out.push(parts.value.unpricedLine);
    if (parts.value.noAmountLine) out.push(parts.value.noAmountLine);
    for (const crop of parts.value.crops) out.push(crop.line);
    for (const row of parts.value.rows) out.push(row.display);
  }
  return out;
}
