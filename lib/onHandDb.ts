// The reads and the one write behind lib/onHand.ts: what is in the kitchen,
// matched to a meal just logged and to every curated recipe.

import { getMeal, getMealItems, getDatabase, getReferenceDatabase } from './db';
import { drawKitchenStock, loadKitchenStock, stockIdKey, stockPairKey } from './groceryDb';
import { isNonPurchasableIngredient, type KitchenStockEntry } from './groceryList';
import { buildPantryOffers, onHandByRecipe, type OnHandDish, type PantryOffer } from './onHand';

function oldestFirst(entries: KitchenStockEntry[]): KitchenStockEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function lookup(stock: Map<string, KitchenStockEntry[]>, foodId: string | null, category: string, name: string): KitchenStockEntry[] {
  return (
    stock.get(stockIdKey(foodId) ?? ' ') ??
    stock.get(stockPairKey(category, name)) ??
    stock.get(name.trim().toLowerCase()) ??
    []
  );
}

/** Foods a grocery list in the last two weeks took from the kitchen for a
 *  meal of this name, lower-cased. */
async function takenForMeal(mealName: string): Promise<Set<string>> {
  const db = await getDatabase();
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const rows = await db.getAllAsync<{ foodName: string; mealNames: string | null }>(
    `
      SELECT i.food_name AS foodName, i.meal_names_json AS mealNames
      FROM grocery_list_items i
      JOIN grocery_lists l ON l.id = i.list_id
      WHERE i.kitchen_taken_quantity > 0 AND l.created_at >= ?
    `,
    since,
  );
  const wanted = mealName.trim().toLowerCase();
  const names = new Set<string>();
  for (const row of rows) {
    let meals: unknown = [];
    try {
      meals = JSON.parse(row.mealNames ?? '[]');
    } catch {
      meals = [];
    }
    if (Array.isArray(meals) && meals.some((meal) => typeof meal === 'string' && meal.trim().toLowerCase() === wanted)) {
      names.add(row.foodName.trim().toLowerCase());
    }
  }
  return names;
}

/**
 * What a meal just saved could have taken from the kitchen. Ingredients the
 * garden sheet already offers are left to it.
 */
export async function getPantryOffersForMeal(
  mealId: string,
  gardenFoods: { foodId: number | string; foodName: string }[],
): Promise<PantryOffer[]> {
  const meal = await getMeal(mealId);
  if (!meal) return [];
  const [items, stock] = await Promise.all([getMealItems(mealId), loadKitchenStock()]);
  if (stock.size === 0) return [];
  const gardenIds = new Set(gardenFoods.map((food) => String(food.foodId)));
  const gardenNames = new Set(gardenFoods.map((food) => food.foodName.trim().toLowerCase()));
  const byKey = new Map(items.map((item) => [item.id, item]));
  const ingredients = items
    .filter((item) => !gardenIds.has(String(item.foodId)) && !gardenNames.has(item.foodName.trim().toLowerCase()))
    .map((item) => ({ key: item.id, foodName: item.foodName, amount: item.servingSize ?? 0, unit: item.servingUnit ?? '' }));
  if (ingredients.length === 0) return [];
  return buildPantryOffers(
    ingredients,
    (ingredient) => {
      const item = byKey.get(ingredient.key);
      return item ? oldestFirst(lookup(stock, item.foodId == null ? null : String(item.foodId), item.category ?? '', item.foodName)) : [];
    },
    await takenForMeal(meal.name),
  );
}

/** Takes the ticked rows off the kitchen. */
export async function keepPantryUses(offers: PantryOffer[]): Promise<void> {
  for (const offer of offers) if (offer.takeable) await drawKitchenStock(offer.draws);
}

/**
 * For the meal plan generator: which curated recipes use something measured
 * in the kitchen right now, and how old that stock is. Garden pickings,
 * ferments and kitchen food all count; a purchase date with no amount does
 * not. An empty map when the kitchen holds nothing measured.
 */
export async function getOnHandDishes(): Promise<Map<string, OnHandDish>> {
  const stock = await loadKitchenStock();
  const measured = new Map<string, KitchenStockEntry[]>();
  for (const [key, entries] of stock) {
    const kept = entries.filter((entry) => entry.source !== 'purchase' && entry.quantity > 0);
    if (kept.length > 0) measured.set(key, kept);
  }
  if (measured.size === 0) return new Map();
  const ref = await getReferenceDatabase();
  const rows = await ref.getAllAsync<{ recipe_id: string; category: string; base_name: string }>(
    'SELECT recipe_id, category, base_name FROM curated_recipe_ingredients',
  );
  return onHandByRecipe(
    rows
      .filter((row) => !isNonPurchasableIngredient(row.base_name))
      .map((row) => ({ recipeId: row.recipe_id, category: row.category ?? '', baseName: row.base_name })),
    (row) => {
      const entries = lookup(measured, null, row.category, row.baseName);
      return entries.length === 0 ? null : oldestFirst(entries)[0].date;
    },
  );
}
