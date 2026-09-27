// Foods that would close a short nutrient (G12, 2026-09-27).
//
// Insights > Nutrients shows a day's nutrient as Low or Deficient; opening
// that row now also lists foods rich in it, so the next thing to eat is one
// step away instead of a trip to Nutrient Ranking and back. Three rules:
//
//  1. Only foods Safe Foods lists for this person (scored, and not flagged
//     for any condition they track), then their diet and allergies. Each
//     count left out is said, never hidden.
//  2. Foods already in their meal history come first, since a food somebody
//     already eats is the easiest one to eat more of. Within each half the
//     richest per 100 g stays first.
//  3. Each row says what 100 g of it would cover of what is still missing,
//     worked from the end-of-day projection when one exists, so a gap that
//     planned meals will close anyway is not offered foods to close it.
//
// Pure: no database and no React, so scripts/test_nutrient_gap_foods.js
// checks it directly. Nothing here says a food is good for anybody; the
// amount and the share of the gap are the whole claim.

import type { NutrientGapEntry } from './nutrientAnalysis';
import { formatAmount } from './nutrientAnalysis';
import type { RichFood } from './nutrientRichPicks';

/** How many foods the list shows at most. */
export const GAP_FOOD_LIMIT = 8;

/** How many rows to ask the database for, leaving room for every filter. */
export const GAP_FOOD_FETCH = 150;

export type NutrientShortfall = {
  /** What is still missing, in the nutrient's unit. */
  missing: number;
  /** True when the figure already counts the meals still planned today. */
  afterPlanned: boolean;
};

export type GapFood = {
  food: RichFood;
  /** How many logged meals held this food before, 0 when none. */
  mealsBefore: number;
  /** The share of what is missing that 100 g would cover, 0 to 1 and beyond. */
  shareOf100g: number;
};

/**
 * What is still missing for a nutrient, or null when it is not short. The
 * end-of-day projection wins when there is one: a nutrient Low now but met
 * once the planned meals are eaten is not short.
 */
export function nutrientShortfall(now: NutrientGapEntry, endOfDay: NutrientGapEntry | null | undefined): NutrientShortfall | null {
  const judged = endOfDay ?? now;
  if (judged.status !== 'deficient' && judged.status !== 'low') return null;
  const missing = judged.target - judged.combinedTotal;
  if (!(missing > 0)) return null;
  return { missing, afterPlanned: endOfDay != null };
}

/** The key a history match is made on: the same category, name and preparation the ranking folds together. */
export function gapFoodNameKey(category: string, baseName: string, prepMethod: string | null): string {
  return `${category}|${baseName.toLowerCase()}|${(prepMethod || 'Raw').toLowerCase()}`;
}

/**
 * Picks the foods to show. `isSafe` is the Safe Foods check and `fits` the
 * diet and allergy check, both passed in so this stays free of the
 * database. `mealsBefore` answers how many meals held a food before.
 */
export function pickGapFoods(
  ranked: RichFood[],
  shortfall: NutrientShortfall,
  checks: {
    isSafe: (food: RichFood) => boolean;
    fits: (food: RichFood) => boolean;
    mealsBefore: (food: RichFood) => number;
  },
  limit = GAP_FOOD_LIMIT,
): { foods: GapFood[]; leftOutUnsafe: number; leftOutDiet: number } {
  let leftOutUnsafe = 0;
  let leftOutDiet = 0;
  const eaten: GapFood[] = [];
  const others: GapFood[] = [];
  for (const food of ranked) {
    if (!checks.isSafe(food)) {
      leftOutUnsafe++;
      continue;
    }
    if (!checks.fits(food)) {
      leftOutDiet++;
      continue;
    }
    const item: GapFood = {
      food,
      mealsBefore: checks.mealsBefore(food),
      shareOf100g: food.amountPer100g / shortfall.missing,
    };
    (item.mealsBefore > 0 ? eaten : others).push(item);
  }
  return { foods: [...eaten, ...others].slice(0, limit), leftOutUnsafe, leftOutDiet };
}

/** The sentence over the list. */
export function gapFoodsHeading(displayName: string, unit: string, shortfall: NutrientShortfall): string {
  const amount = formatAmount(shortfall.missing, unit);
  return shortfall.afterPlanned
    ? `${displayName} still missing once today's planned meals are eaten: ${amount}. Foods rich in it that Safe Foods lists for you:`
    : `${displayName} still missing today: ${amount}. Foods rich in it that Safe Foods lists for you:`;
}

/** A row's caption: what 100 g covers, and whether it is a food the person already eats. */
export function gapFoodCaption(item: GapFood): string {
  const covers =
    item.shareOf100g >= 1
      ? '100 g covers all of what is missing.'
      : `100 g covers about ${Math.max(1, Math.round(item.shareOf100g * 100))}% of what is missing.`;
  if (item.mealsBefore === 0) return covers;
  const before = item.mealsBefore === 1 ? 'In 1 meal you logged before.' : `In ${item.mealsBefore} meals you logged before.`;
  return `${before} ${covers}`;
}

/** Said under the list: what was left out and why, or why there is nothing. */
export function describeGapFoods(shown: number, leftOutUnsafe: number, leftOutDiet: number): string[] {
  const lines: string[] = [];
  if (shown === 0 && leftOutUnsafe === 0 && leftOutDiet === 0) {
    lines.push('No food in the database has a measured amount of it.');
    return lines;
  }
  if (shown === 0) lines.push('None of the foods richest in it fit what Safe Foods lists for you and your diet.');
  if (leftOutUnsafe > 0) {
    lines.push(
      leftOutUnsafe === 1
        ? '1 food was left out because Safe Foods does not list it for you.'
        : `${leftOutUnsafe} foods were left out because Safe Foods does not list them for you.`,
    );
  }
  if (leftOutDiet > 0) {
    lines.push(
      leftOutDiet === 1
        ? '1 food was left out for your diet or allergies.'
        : `${leftOutDiet} foods were left out for your diet or allergies.`,
    );
  }
  return lines;
}
