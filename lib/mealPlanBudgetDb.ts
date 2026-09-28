// Reads for the meal plan's daily food budget (G38, lib/mealPlanBudget.ts):
// the prices recorded on the Grocery List, and one serving's ingredient
// amounts for every curated recipe, costed once per load. Reads only; the
// budget writes nothing anywhere.

import { getDatabase, getReferenceDatabase } from './db';
import { isNonPurchasableIngredient } from './groceryList';
import { dishCost, pricesByFood, type DishCost, type FoodPrices, type IngredientAmount, type RecordedPriceRow } from './mealPlanBudget';
import { convertToGrams, volumeToMl, MASS_UNITS, VOLUME_UNITS, type MeasurementUnit } from './unitConversion';

/**
 * Every price recorded on a food line of any grocery list. A line taken
 * from the garden or the kitchen carries no price and is left out by
 * `sourced_from_kitchen`.
 */
export async function getRecordedGroceryPrices(): Promise<Map<string, FoodPrices>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string; price: number; unit: string; paidOn: string; onSale: number }>(
    `
      SELECT i.food_name AS name, i.price AS price, i.price_unit AS unit,
             COALESCE(i.checked_at, l.created_at) AS paidOn, i.on_sale AS onSale
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE i.price IS NOT NULL AND i.price > 0 AND i.price_unit IS NOT NULL
        AND i.sourced_from_kitchen = 0 AND i.kind = 'food'
    `,
  );
  const recorded: RecordedPriceRow[] = rows.map((row) => ({
    name: row.name,
    price: row.price,
    unit: row.unit,
    on: row.paidOn ?? '',
    onSale: row.onSale === 1,
  }));
  return pricesByFood(recorded);
}

function measurementUnit(unit: string): MeasurementUnit | null {
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, '_');
  const known: readonly string[] = [...MASS_UNITS, ...VOLUME_UNITS];
  return known.includes(normalized) ? (normalized as MeasurementUnit) : null;
}

/** One serving's amount of an ingredient, in every form it converts to without a guess. */
function servingAmount(row: { base_name: string; category: string; quantity: number; unit: string; servings: number; gramsPerUnit: number | null }): IngredientAmount {
  const share = row.quantity / Math.max(1, row.servings || 1);
  const amount: IngredientAmount = { name: row.base_name, grams: null, ml: null, count: null, gramsPerUnit: row.gramsPerUnit };
  if (row.unit.trim().toLowerCase() === 'each') {
    amount.count = share;
    return amount;
  }
  const unit = measurementUnit(row.unit);
  if (!unit) return amount;
  amount.ml = volumeToMl(share, unit);
  const grams = convertToGrams(share, unit, { foodCategory: row.category });
  if (grams.ok) amount.grams = grams.grams;
  return amount;
}

/**
 * One serving's known cost for every curated recipe, keyed by recipe id,
 * from the prices given. Four reads in all, however many recipes there are.
 */
export async function getCuratedDishCosts(prices: Map<string, FoodPrices>): Promise<Map<string, DishCost>> {
  const ref = await getReferenceDatabase();
  const rows = await ref.getAllAsync<{ recipe_id: string; category: string; base_name: string; quantity: number; unit: string; servings: number; gramsPerUnit: number | null }>(
    `
      SELECT i.recipe_id, i.category, i.base_name, i.quantity, i.unit, r.servings,
             (SELECT fuw.grams_per_unit FROM food_unit_weights fuw WHERE fuw.base_name = i.base_name LIMIT 1) AS gramsPerUnit
      FROM curated_recipe_ingredients i
      JOIN curated_recipes r ON r.id = i.recipe_id
      ORDER BY i.recipe_id, i.sort_order
    `,
  );
  const byRecipe = new Map<string, IngredientAmount[]>();
  for (const row of rows) {
    if (isNonPurchasableIngredient(row.base_name)) continue;
    const list = byRecipe.get(row.recipe_id) ?? [];
    list.push(servingAmount(row));
    byRecipe.set(row.recipe_id, list);
  }
  const costs = new Map<string, DishCost>();
  for (const [id, ingredients] of byRecipe) costs.set(id, dishCost(ingredients, prices));
  return costs;
}
