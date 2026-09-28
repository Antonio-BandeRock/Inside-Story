// A daily food budget for the meal plan generator, from prices the person
// has recorded (G38 of the competitive build plan, 2026-09-27). Off unless
// chosen on Schedules > Meal Plan, never saved, and offered only when the
// Grocery List holds at least one price this can use.
//
// NEVER GUESSED. A dish is costed only from ingredients whose price the
// person recorded, in a unit the recipe's amount converts to without a
// guess:
//   - a price per kg or per lb, for an ingredient whose amount is a weight,
//     or a volume of a food the app already converts to a weight (oils,
//     drinks: lib/unitConversion.ts);
//   - a price per litre or per fl oz, for an amount given as a volume;
//   - a price each, for an amount given as a count, or a weight of a food
//     with a cited unit weight (food_unit_weights).
// A price "for all of it" is left out, since the size of the package it
// paid for is not recorded. Anything else is named as unpriced, the known
// cost is said to be the known cost, and a day with nothing priced says it
// could not be checked. No price is ever filled in from an average.
//
// THE LEAN. Each main dish is picked, where it can be, from dishes whose
// known cost fits what is left of the day's budget shared over the meals
// still to come. Unpriced dishes stay in, and when nothing fits the pool is
// left as it was, so a budget never empties a meal.
//
// Pure, with no React and no database, so scripts/test_meal_plan_budget.js
// checks it without a phone.

import { formatMoney } from './groceryList';

export type BudgetPriceUnit = 'kg' | 'lb' | 'each' | 'l' | 'fl_oz';

export type RecordedPriceRow = {
  /** The food as named on the Grocery List. */
  name: string;
  price: number;
  unit: string;
  /** YYYY-MM-DD, or a longer timestamp; only the order matters. */
  on: string;
  onSale: boolean;
};

const GRAMS_PER_LB = 453.59237;
const ML_PER_FL_OZ = 29.5735;

/** The grocery list's stored price unit, or null for one this cannot use. */
export function budgetPriceUnit(unit: string): BudgetPriceUnit | null {
  const map: Record<string, BudgetPriceUnit> = {
    kg: 'kg',
    per_kg: 'kg',
    lb: 'lb',
    per_lb: 'lb',
    each: 'each',
    l: 'l',
    per_l: 'l',
    per_litre: 'l',
    fl_oz: 'fl_oz',
    per_floz: 'fl_oz',
  };
  return map[unit.trim().toLowerCase()] ?? null;
}

/** One food's prices, one per kind of unit, each the one this uses. */
export type FoodPrices = {
  perGram: number | null;
  perMl: number | null;
  perEach: number | null;
};

/**
 * The most recent usual price per food and kind of unit; a sale price only
 * where no other was recorded, since one week at half price is an offer
 * rather than what the food costs. Keyed on the lowercase name.
 */
export function pricesByFood(rows: RecordedPriceRow[]): Map<string, FoodPrices> {
  type Pick = { value: number; on: string; onSale: boolean };
  const chosen = new Map<string, { gram?: Pick; ml?: Pick; each?: Pick }>();
  const better = (current: Pick | undefined, next: Pick) => {
    if (!current) return true;
    if (current.onSale !== next.onSale) return current.onSale;
    return next.on >= current.on;
  };
  for (const row of rows) {
    const unit = budgetPriceUnit(row.unit);
    if (!unit || !(row.price > 0) || !row.name.trim()) continue;
    const key = row.name.trim().toLowerCase();
    const entry = chosen.get(key) ?? {};
    const kind = unit === 'kg' || unit === 'lb' ? 'gram' : unit === 'each' ? 'each' : 'ml';
    const value =
      unit === 'kg' ? row.price / 1000 : unit === 'lb' ? row.price / GRAMS_PER_LB : unit === 'l' ? row.price / 1000 : unit === 'fl_oz' ? row.price / ML_PER_FL_OZ : row.price;
    const pick = { value, on: row.on, onSale: row.onSale };
    if (better(entry[kind], pick)) entry[kind] = pick;
    chosen.set(key, entry);
  }
  const out = new Map<string, FoodPrices>();
  for (const [key, entry] of chosen) {
    out.set(key, { perGram: entry.gram?.value ?? null, perMl: entry.ml?.value ?? null, perEach: entry.each?.value ?? null });
  }
  return out;
}

/** One ingredient's amount in one serving of a dish, in whichever forms convert without a guess. */
export type IngredientAmount = {
  name: string;
  grams: number | null;
  ml: number | null;
  count: number | null;
  /** Cited weight of one, from food_unit_weights; null for most foods. */
  gramsPerUnit: number | null;
};

export type DishCost = {
  /** What the priced ingredients of one serving come to. */
  known: number;
  pricedCount: number;
  /** Ingredients with no price this could use, by name, each once. */
  unpriced: string[];
};

/** What one ingredient's amount costs, or null when no recorded price fits it. */
export function ingredientCost(amount: IngredientAmount, prices: FoodPrices | undefined): number | null {
  if (!prices) return null;
  const grams = amount.grams ?? (amount.count != null && amount.gramsPerUnit ? amount.count * amount.gramsPerUnit : null);
  const count = amount.count ?? (amount.grams != null && amount.gramsPerUnit ? amount.grams / amount.gramsPerUnit : null);
  if (prices.perGram != null && grams != null) return prices.perGram * grams;
  if (prices.perMl != null && amount.ml != null) return prices.perMl * amount.ml;
  if (prices.perEach != null && count != null) return prices.perEach * count;
  return null;
}

export function dishCost(ingredients: IngredientAmount[], prices: Map<string, FoodPrices>): DishCost {
  let known = 0;
  let pricedCount = 0;
  const unpriced: string[] = [];
  for (const ingredient of ingredients) {
    const cost = ingredientCost(ingredient, prices.get(ingredient.name.trim().toLowerCase()));
    if (cost == null) {
      if (!unpriced.includes(ingredient.name)) unpriced.push(ingredient.name);
    } else {
      known += cost;
      pricedCount += 1;
    }
  }
  return { known, pricedCount, unpriced };
}

// --- The choice on the form -------------------------------------------------------

export const BUDGET_OFF_LABEL = 'Off';

/** Per person per day, in the currency the Grocery List records. */
export const BUDGET_CHOICES = [5, 8, 10, 12, 15, 20, 25, 30, 40];

export function budgetLabel(ceiling: number): string {
  return `${formatMoney(ceiling)} a day`;
}

export function budgetChoiceLabels(): string[] {
  return [BUDGET_OFF_LABEL, ...BUDGET_CHOICES.map(budgetLabel)];
}

export function budgetFromLabel(label: string): number | null {
  return BUDGET_CHOICES.find((ceiling) => budgetLabel(ceiling) === label) ?? null;
}

export const BUDGET_CAPTION =
  'Off unless you choose one. For one person, from the most recent price you recorded on the Grocery List per kg, lb, litre, fl oz or each, with a sale price used only where no other was recorded. ' +
  'An ingredient with no recorded price is left out and named, so the day says what its known cost is and never fills a price in.';

export const BUDGET_NO_PRICES =
  'A daily food budget works from prices you record on the Grocery List per kg, lb, litre, fl oz or each. None are recorded yet, so it is not offered.';

// --- The lean ---------------------------------------------------------------------

/** What is left of the day's budget shared evenly over the meals still to come, this one included. */
export function mealAllowance(ceiling: number | null, spentSoFar: number, mealsLeft: number): number | null {
  if (ceiling == null || mealsLeft <= 0) return null;
  return Math.max(0, ceiling - Math.max(0, spentSoFar)) / mealsLeft;
}

/**
 * The dishes whose known cost fits `allowance`. Dishes with no recorded
 * price stay in; when nothing fits, the pool comes back as it was.
 */
export function leanTowardBudget<T>(pool: T[], costOf: (item: T) => DishCost | undefined, allowance: number | null): T[] {
  if (allowance === null || pool.length < 2) return pool;
  const fits = pool.filter((item) => {
    const cost = costOf(item);
    return !cost || cost.pricedCount === 0 || cost.known <= allowance;
  });
  return fits.length > 0 ? fits : pool;
}

// --- What the day says -------------------------------------------------------------

function namedList(names: string[], show = 4): string {
  const shown = names.slice(0, show);
  const rest = names.length - shown.length;
  if (rest > 0) return `${shown.join(', ')} and ${rest} more`;
  if (shown.length <= 1) return shown.join('');
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/**
 * The lines under a planned day: its known cost against the budget, and
 * what could not be priced. `dishes` are one serving of each dish planned
 * for the person; a dish missing from the cost map counts as unpriced.
 */
export function budgetLines(dishes: { name: string; cost: DishCost | undefined }[], ceiling: number | null | undefined): string[] {
  if (ceiling == null) return [];
  const budget = budgetLabel(ceiling);
  if (dishes.length === 0) return [];
  let known = 0;
  let priced = 0;
  const unpriced: string[] = [];
  const uncosted: string[] = [];
  for (const dish of dishes) {
    if (!dish.cost) {
      uncosted.push(dish.name);
      continue;
    }
    known += dish.cost.known;
    priced += dish.cost.pricedCount;
    for (const name of dish.cost.unpriced) if (!unpriced.includes(name)) unpriced.push(name);
  }
  if (priced === 0) {
    return [`None of the ingredients on this day have a price recorded on your Grocery List that fits their amounts, so the day could not be checked against ${budget}.`];
  }
  const lines: string[] = [];
  const cost = formatMoney(known);
  if (known > ceiling) lines.push(`The ingredients with a recorded price come to about ${cost} for one person, ${formatMoney(known - ceiling)} over the ${budget} you chose.`);
  else lines.push(`The ingredients with a recorded price come to about ${cost} for one person, within the ${budget} you chose.`);
  if (unpriced.length > 0) {
    lines.push(
      `${unpriced.length === 1 ? '1 ingredient has' : `${unpriced.length} ingredients have`} no recorded price that fits (${namedList(unpriced)}), so the day could cost more than this.`,
    );
  }
  if (uncosted.length > 0) {
    lines.push(`${namedList(uncosted)} could not be costed at all, so the day could cost more than this.`);
  }
  return lines;
}
