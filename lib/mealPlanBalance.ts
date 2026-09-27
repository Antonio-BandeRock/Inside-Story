// Bringing a planned day nearer the person's nutrient targets, and trading
// one side on a plate for another (2026-09-27, asked for alongside G13).
//
// Direct request: when the app builds a plan of up to six weeks, "along
// with the other rules it is using to build the meal plan, it also tries to
// give them as close to the RDA for their nutrients as possible, with the
// ability to easily replace one side on a plate for one from another
// recipe."
//
// Two halves, both on one measure:
//
//  1. The shortfall. For every RDA or AI target, how far short of it the
//     day is as a share of the target, 0 when met and 1 when nothing of it
//     is there, added up. Going past a target earns nothing more, so a day
//     is never pushed toward one nutrient at the expense of the rest. Lower
//     is nearer.
//
//  2. The guard. A change is never allowed to carry a nutrient past its
//     upper limit, or past a ceiling target such as sodium, unless the day
//     was already past it and the change brings it no higher. The carb
//     target the person chose is held the same way.
//
// The generator (lib/dailyMealPlan.ts) runs improveDay after it has picked
// a day by its usual rules: conditions, diet, Safe Foods, frequency,
// rotation, carbs. Only the sides, salads and drinks are traded, never a
// main, so frequency rules on fish and red meat stay as they were. The
// Meal Plan lens uses rankSwapOptions for the side scroller, with the
// current side first.
//
// Pure: no database and no React, so scripts/test_meal_plan_balance.js
// checks it directly. Nothing here says a dish is good or bad.

export type BalanceTarget = {
  nutrientCode: string;
  valueType: 'RDA' | 'AI' | 'CDRR';
  amount: number;
  upperLimit: number | null;
};

export type BalanceDish = {
  id: string;
  totals: Record<string, number>;
  carbGrams: number;
};

/** A day's plate item the improvement pass may trade: a side, salad or drink. */
export type TradeablePick = {
  /** Where it sits, so the caller can put the replacement back. */
  slot: string;
  role: string;
  dish: BalanceDish;
};

/**
 * Nearer is a lower shortfall by at least this much before the generator
 * trades a dish: a twentieth of one nutrient's target. Smaller gains are
 * left alone so a day keeps the variety its rotation gave it.
 */
export const MIN_IMPROVEMENT = 0.05;

/** How many times the improvement pass goes round the day's plate items. */
export const IMPROVE_PASSES = 2;

function amountOf(totals: Record<string, number>, code: string): number {
  const value = totals[code];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isFloor(target: BalanceTarget): boolean {
  return (target.valueType === 'RDA' || target.valueType === 'AI') && target.amount > 0;
}

/** How far a day's totals fall short of its RDA and AI targets, summed as shares of each target. */
export function shortfall(totals: Record<string, number>, targets: BalanceTarget[]): number {
  let sum = 0;
  for (const target of targets) {
    if (!isFloor(target)) continue;
    sum += Math.max(0, 1 - amountOf(totals, target.nutrientCode) / target.amount);
  }
  return sum;
}

/** The limit a nutrient may not pass: its upper limit, and for a ceiling target the target itself. */
function limitFor(target: BalanceTarget): number | null {
  const limits: number[] = [];
  if (target.upperLimit != null && target.upperLimit > 0) limits.push(target.upperLimit);
  if (target.valueType === 'CDRR' && target.amount > 0) limits.push(target.amount);
  return limits.length > 0 ? Math.min(...limits) : null;
}

/** True when going from `before` to `after` carries any nutrient past a limit, or further past one. */
export function breaksALimit(before: Record<string, number>, after: Record<string, number>, targets: BalanceTarget[]): boolean {
  for (const target of targets) {
    const limit = limitFor(target);
    if (limit == null) continue;
    const next = amountOf(after, target.nutrientCode);
    if (next > limit && next > amountOf(before, target.nutrientCode) + 1e-9) return true;
  }
  return false;
}

/** True when a change takes the day's carbs past the ceiling, or further past it. */
export function breaksCarbCeiling(carbsBefore: number, carbsAfter: number, carbCeiling: number | null): boolean {
  if (carbCeiling == null) return false;
  return carbsAfter > carbCeiling && carbsAfter > carbsBefore + 1e-9;
}

/** The day's totals with one dish taken out and another put in. */
export function tradeTotals(
  dayTotals: Record<string, number>,
  outgoing: Record<string, number> | null,
  incoming: Record<string, number> | null,
): Record<string, number> {
  const result: Record<string, number> = { ...dayTotals };
  if (outgoing) for (const [code, value] of Object.entries(outgoing)) result[code] = amountOf(result, code) - (value || 0);
  if (incoming) for (const [code, value] of Object.entries(incoming)) result[code] = amountOf(result, code) + (value || 0);
  return result;
}

export type SwapOption<T extends BalanceDish> = {
  dish: T;
  /** True for the dish already on the plate. */
  current: boolean;
  totalsAfter: Record<string, number>;
  carbsAfter: number;
  shortfallAfter: number;
  /** Targets this dish leaves the day nearer to, and further from, than the current one. */
  nearer: number;
  further: number;
};

/** Counts the RDA and AI targets a change moves nearer and further. */
export function targetsMoved(before: Record<string, number>, after: Record<string, number>, targets: BalanceTarget[]): { nearer: number; further: number } {
  let nearer = 0;
  let further = 0;
  for (const target of targets) {
    if (!isFloor(target)) continue;
    const gapBefore = Math.max(0, 1 - amountOf(before, target.nutrientCode) / target.amount);
    const gapAfter = Math.max(0, 1 - amountOf(after, target.nutrientCode) / target.amount);
    if (gapAfter < gapBefore - 0.005) nearer++;
    else if (gapAfter > gapBefore + 0.005) further++;
  }
  return { nearer, further };
}

/**
 * Every dish that could stand where `current` stands, the current one first
 * and the rest nearest the targets first. A dish already elsewhere on the
 * day, or one that would break a limit or the carb ceiling, is left out and
 * counted.
 */
export function rankSwapOptions<T extends BalanceDish>(input: {
  dayTotals: Record<string, number>;
  dayCarbs: number;
  current: T;
  candidates: T[];
  usedIds: Set<string>;
  targets: BalanceTarget[];
  carbCeiling: number | null;
}): { options: SwapOption<T>[]; leftOutLimit: number; leftOutCarbs: number } {
  const { dayTotals, dayCarbs, current, candidates, usedIds, targets, carbCeiling } = input;
  const without = tradeTotals(dayTotals, current.totals, null);
  const carbsWithout = dayCarbs - current.carbGrams;
  const currentOption: SwapOption<T> = {
    dish: current,
    current: true,
    totalsAfter: dayTotals,
    carbsAfter: dayCarbs,
    shortfallAfter: shortfall(dayTotals, targets),
    nearer: 0,
    further: 0,
  };
  let leftOutLimit = 0;
  let leftOutCarbs = 0;
  const others: SwapOption<T>[] = [];
  const seen = new Set<string>([current.id]);
  for (const dish of candidates) {
    if (seen.has(dish.id) || usedIds.has(dish.id)) continue;
    seen.add(dish.id);
    const totalsAfter = tradeTotals(without, null, dish.totals);
    const carbsAfter = carbsWithout + dish.carbGrams;
    if (breaksALimit(dayTotals, totalsAfter, targets)) {
      leftOutLimit++;
      continue;
    }
    if (breaksCarbCeiling(dayCarbs, carbsAfter, carbCeiling)) {
      leftOutCarbs++;
      continue;
    }
    others.push({
      dish,
      current: false,
      totalsAfter,
      carbsAfter,
      shortfallAfter: shortfall(totalsAfter, targets),
      ...targetsMoved(dayTotals, totalsAfter, targets),
    });
  }
  others.sort((a, b) => a.shortfallAfter - b.shortfallAfter || a.dish.id.localeCompare(b.dish.id));
  return { options: [currentOption, ...others], leftOutLimit, leftOutCarbs };
}

export type Trade<T extends BalanceDish> = { slot: string; role: string; from: T; to: T };

/**
 * The generator's improvement pass. For each tradeable item in turn, the
 * dish from its pool that leaves the day nearest its targets replaces it
 * when that brings the shortfall down by at least MIN_IMPROVEMENT, within
 * every limit and the carb ceiling. `allowed` lets the caller keep its
 * rotation, so a six-week plan does not land on one side every day.
 * Returns the trades in the order made; the caller applies them.
 */
export function improveDay<T extends BalanceDish>(input: {
  dayTotals: Record<string, number>;
  dayCarbs: number;
  picks: (TradeablePick & { dish: T })[];
  poolFor: (role: string) => T[];
  usedIds: Set<string>;
  targets: BalanceTarget[];
  carbCeiling: number | null;
  allowed?: (dish: T, role: string) => boolean;
  passes?: number;
}): { trades: Trade<T>[]; dayTotals: Record<string, number>; dayCarbs: number } {
  let dayTotals = input.dayTotals;
  let dayCarbs = input.dayCarbs;
  const used = new Set(input.usedIds);
  const picks = input.picks.map((pick) => ({ ...pick }));
  const trades: Trade<T>[] = [];
  const passes = input.passes ?? IMPROVE_PASSES;
  for (let pass = 0; pass < passes; pass++) {
    let changed = false;
    for (const pick of picks) {
      const pool = input.poolFor(pick.role).filter((dish) => !input.allowed || input.allowed(dish, pick.role));
      const { options } = rankSwapOptions({
        dayTotals,
        dayCarbs,
        current: pick.dish,
        candidates: pool,
        usedIds: used,
        targets: input.targets,
        carbCeiling: input.carbCeiling,
      });
      const best = options.slice(1)[0];
      if (!best) continue;
      if (options[0].shortfallAfter - best.shortfallAfter < MIN_IMPROVEMENT) continue;
      trades.push({ slot: pick.slot, role: pick.role, from: pick.dish, to: best.dish });
      used.delete(pick.dish.id);
      used.add(best.dish.id);
      dayTotals = best.totalsAfter;
      dayCarbs = best.carbsAfter;
      pick.dish = best.dish;
      changed = true;
    }
    if (!changed) break;
  }
  return { trades, dayTotals, dayCarbs };
}

/** The line on a scroller card: what this dish does to the day compared with the one on the plate. */
export function describeSwapEffect(option: { current: boolean; nearer: number; further: number }): string {
  if (option.current) return 'On the plate now.';
  const count = (n: number) => `${n} ${n === 1 ? 'nutrient' : 'nutrients'}`;
  if (option.nearer > 0 && option.further > 0) {
    return `The day ends nearer your targets on ${count(option.nearer)} and further from them on ${option.further}.`;
  }
  if (option.nearer > 0) return `The day ends nearer your targets on ${count(option.nearer)}.`;
  if (option.further > 0) return `The day ends further from your targets on ${count(option.further)}.`;
  return 'Leaves the day about where it is against your targets.';
}

/** How near the day sits to its targets, for the plan's report: how many RDA and AI targets are met. */
export function targetsMet(totals: Record<string, number>, targets: BalanceTarget[]): { met: number; of: number } {
  let met = 0;
  let of = 0;
  for (const target of targets) {
    if (!isFloor(target)) continue;
    of++;
    if (amountOf(totals, target.nutrientCode) >= target.amount) met++;
  }
  return { met, of };
}

/** Said under the scroller when some dishes could not be offered. */
export function describeLeftOut(leftOutLimit: number, leftOutCarbs: number): string[] {
  const lines: string[] = [];
  if (leftOutLimit > 0) {
    lines.push(
      leftOutLimit === 1
        ? '1 dish is not shown because it would take a nutrient past its upper limit for the day.'
        : `${leftOutLimit} dishes are not shown because each would take a nutrient past its upper limit for the day.`,
    );
  }
  if (leftOutCarbs > 0) {
    lines.push(
      leftOutCarbs === 1
        ? '1 dish is not shown because it would take the day past your carb target.'
        : `${leftOutCarbs} dishes are not shown because each would take the day past your carb target.`,
    );
  }
  return lines;
}
