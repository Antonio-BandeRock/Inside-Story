// Richest foods for a nutrient, picked from inside a builder (G10, 2026-09-27).
//
// A builder's ingredient chooser gains a fourth way in beside Say a Food
// Name, My Food Products and Whole Foods: pick a nutrient, see the foods
// richest in it per 100 g, tap one and it goes into the dish the same way a
// food found by browsing does. It is Insights > Nutrient Ranking brought to
// the moment somebody is choosing what to put in.
//
// Three things narrow the list, each for a reason:
//  1. Only the categories the builder takes (the SQL does this, through
//     rankFoodsByNutrient's categories argument), so a smoothie is not
//     offered a steak.
//  2. The person's diet and allergies, the same checks Nutrient Ranking uses,
//     and the count left out is said rather than hidden.
//  3. A cap, so the list stays quick to read and to draw.
//
// Pure: no database and no React, so scripts/test_nutrient_rich_picks.js
// checks it directly. Nothing here says a food is good for anybody; the
// amount per 100 g is the whole claim.

import { formatAmount } from './nutrientAnalysis';

export type RichFood = {
  foodId: number;
  source: string;
  baseName: string;
  category: string;
  subcategory: string | null;
  prepMethod: string | null;
  amountPer100g: number;
};

export type NutrientChoice = { code: string; displayName: string; unit: string; group: string };

/** How many foods the picker shows at most. */
export const RICH_FOOD_LIMIT = 40;

/** How many rows to ask the database for, leaving room for diet and allergy filtering. */
export const RICH_FOOD_FETCH = 120;

const GROUP_HEADINGS: Record<string, string> = {
  macro: 'Macronutrients',
  vitamin: 'Vitamins',
  mineral: 'Minerals',
};

function groupHeading(group: string): string {
  return GROUP_HEADINGS[group] ?? 'Other Nutrients';
}

/**
 * The nutrient list as rows for an inline list: a heading before each group,
 * in the order the database already sorts them (macros, vitamins, minerals,
 * then the rest).
 */
export function nutrientChoiceRows(
  nutrients: NutrientChoice[],
): { label: string; value: string; isHeader?: boolean; groupLabel?: string }[] {
  const rows: { label: string; value: string; isHeader?: boolean; groupLabel?: string }[] = [];
  let lastHeading: string | null = null;
  for (const nutrient of nutrients) {
    const heading = groupHeading(nutrient.group);
    if (heading !== lastHeading) {
      rows.push({ label: heading, value: `__heading__${heading}`, isHeader: true });
      lastHeading = heading;
    }
    rows.push({ label: `${nutrient.displayName} (${nutrient.unit})`, value: nutrient.code, groupLabel: heading });
  }
  return rows;
}

/**
 * Keeps the foods the person can eat, in the order given (richest first),
 * up to the cap. `fits` is the diet and allergy check, passed in so this
 * stays free of the database. Answers how many were left out for diet or
 * allergy, counted only among the rows that would otherwise have shown.
 */
export function pickRichFoods(
  ranked: RichFood[],
  fits: (food: RichFood) => boolean,
  limit = RICH_FOOD_LIMIT,
): { foods: RichFood[]; leftOut: number } {
  const foods: RichFood[] = [];
  let leftOut = 0;
  for (const food of ranked) {
    if (foods.length >= limit) break;
    if (fits(food)) foods.push(food);
    else leftOut++;
  }
  return { foods, leftOut };
}

/** A row's text: the food, its preparation when not plain raw, and the amount per 100 g. */
export function richFoodLabel(food: RichFood, unit: string): string {
  const prep = food.prepMethod && food.prepMethod !== 'Raw' ? `, ${food.prepMethod}` : '';
  return `${food.baseName}${prep}: ${formatAmount(food.amountPer100g, unit)}`;
}

/** The value a row carries, so a tap finds its food again. */
export function richFoodKey(food: RichFood): string {
  return `${food.source}|${food.foodId}`;
}

/** The heading over the list of foods. */
export function richFoodsHeading(displayName: string): string {
  return `Richest in ${displayName}, per 100 g`;
}

/** Said under the chosen nutrient when some foods were left out, or when none fit. */
export function describeRichFoods(shown: number, leftOut: number): string | null {
  if (shown === 0 && leftOut === 0) return 'No food this builder takes has a measured amount of it.';
  if (shown === 0) return 'Every food this builder takes that has it is outside your diet or allergies.';
  if (leftOut === 0) return null;
  return leftOut === 1
    ? '1 food was left out for your diet or allergies.'
    : `${leftOut} foods were left out for your diet or allergies.`;
}
