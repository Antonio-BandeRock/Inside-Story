// What is already in the kitchen, reaching the three places that used to
// ignore it (2026-09-27):
//
//   1. Logging a meal. The garden sheet already offered to take pickings off
//      what is on hand; food in the kitchen (bought, traded, given, or a
//      ferment) is now offered on the same sheet, as "From your kitchen".
//   2. The meal plan generator. With the switch on, a main dish that uses
//      something measured in the kitchen is chosen ahead of one that does
//      not, the oldest stock first, and each food drives one pick only.
//   3. A new grocery list. Once it is built, the lines the kitchen already
//      covers are offered to be taken from the kitchen rather than bought.
//
// Everything here decides; lib/onHandDb.ts reads and writes.
//
// Rules this module holds:
//   - Nothing comes off the kitchen without the person seeing it and saying
//     yes. Every draw is shown on a sheet first.
//   - Only measured stock is ever drawn down. A purchase date with no amount
//     behind it is never subtracted (lib/groceryList.ts, kitchenCoverageFor).
//   - Units convert only within weight or within volume. Where a meal's
//     amount cannot be matched to the kitchen's, the row says so and draws
//     nothing, rather than guessing.
//   - Nothing drawn from the kitchen is given a money value here.
//   - Stock already taken off for a grocery list that names this meal starts
//     unticked, so the same food is not taken off twice.

import {
  formatGroceryAmount,
  kitchenCoverageFor,
  type KitchenDraw,
  type KitchenStockEntry,
} from './groceryList';

// --- 1. A meal just logged ---------------------------------------------------

export type PantryIngredient = {
  key: string;
  foodName: string;
  amount: number;
  unit: string;
};

export type PantryOffer = {
  key: string;
  foodName: string;
  draws: KitchenDraw[];
  // False when there is stock but nothing can be taken off without a guess.
  takeable: boolean;
  ticked: boolean;
  line: string;
};

function whereFrom(entries: KitchenStockEntry[]): string {
  const fermented = entries.some((entry) => entry.source === 'fermentation');
  const kitchen = entries.some((entry) => entry.source !== 'fermentation');
  if (fermented && kitchen) return 'what is in your kitchen and what you fermented';
  return fermented ? 'what you fermented' : 'what is in your kitchen';
}

/**
 * One row per ingredient that measured kitchen stock could have supplied.
 * `stockFor` returns kitchen and fermentation stock for an ingredient, oldest
 * first. Stock claimed by an earlier row is not offered again to a later one.
 */
export function buildPantryOffers(
  ingredients: PantryIngredient[],
  stockFor: (ingredient: PantryIngredient) => KitchenStockEntry[],
  alreadyTakenForThisMeal: Set<string> = new Set(),
): PantryOffer[] {
  const claimed = new Map<string, number>();
  const offers: PantryOffer[] = [];
  for (const ingredient of ingredients) {
    const entries = stockFor(ingredient)
      .filter((entry) => entry.source !== 'purchase' && entry.source !== 'garden' && entry.id)
      .map((entry) => ({ ...entry, quantity: entry.quantity - (claimed.get(`${entry.source}:${entry.id}`) ?? 0) }))
      .filter((entry) => entry.quantity > 0);
    if (entries.length === 0) continue;
    const where = whereFrom(entries);
    const taken = alreadyTakenForThisMeal.has(ingredient.foodName.trim().toLowerCase());
    const takenNote = taken ? ' Some was already taken off for a grocery list that names this meal, so this starts unticked.' : '';
    const coverage =
      ingredient.amount > 0 && ingredient.unit.trim() ? kitchenCoverageFor(ingredient.amount, ingredient.unit, entries) : null;
    if (!coverage || coverage.draws.length === 0) {
      offers.push({
        key: ingredient.key,
        foodName: ingredient.foodName,
        draws: [],
        takeable: false,
        ticked: false,
        line: `There is some in ${where}, measured in ${entries[0].unit}, and this meal's amount cannot be matched to that without a guess. Mark what was used in Life > Kitchen.`,
      });
      continue;
    }
    for (const draw of coverage.draws) {
      const id = `${draw.source}:${draw.id}`;
      claimed.set(id, (claimed.get(id) ?? 0) + draw.quantity);
    }
    const amountText = formatGroceryAmount(ingredient.amount, ingredient.unit);
    const line =
      coverage.level === 'covered'
        ? `Takes ${amountText} off ${where}.${takenNote}`
        : `Takes ${formatGroceryAmount(coverage.coveredQuantity ?? 0, ingredient.unit)} off ${where}, which is all that is left there. The rest of the ${amountText} came from somewhere else.${takenNote}`;
    offers.push({ key: ingredient.key, foodName: ingredient.foodName, draws: coverage.draws, takeable: true, ticked: !taken, line });
  }
  return offers;
}

export function describePantryOffer(offers: PantryOffer[]): string {
  const takeable = offers.filter((offer) => offer.takeable).length;
  if (takeable === 0) return 'Some of this meal is in your kitchen, in a measure that cannot be matched to the meal.';
  return takeable === 1
    ? 'One thing in this meal could have come from your kitchen. Untick it if it came from somewhere else.'
    : `${takeable} things in this meal could have come from your kitchen. Untick any that came from somewhere else.`;
}

export function describePantryAction(count: number): string {
  if (count === 0) return 'Nothing from the kitchen is ticked, so nothing comes off it.';
  return count === 1 ? 'Keep takes the ticked amount off your kitchen.' : `Keep takes the ${count} ticked amounts off your kitchen.`;
}

// --- 2. The meal plan generator ---------------------------------------------

export type OnHandDish = {
  // Lower-cased names of what the dish uses from the kitchen.
  names: string[];
  // Local date the oldest of that stock came in.
  oldest: string;
};

export type OnHandLean = {
  dishes: Map<string, OnHandDish>;
  // Foods already given to an earlier pick this run, so one bag of lentils
  // does not steer every lunch for six weeks.
  used: Set<string>;
  claims: { recipeId: string; title: string; names: string[] }[];
};

export type RecipeIngredientName = { recipeId: string; category: string; baseName: string };

/**
 * For every curated recipe, which of its ingredients are measured in the
 * kitchen right now. `stockDate` returns the date the oldest measured stock
 * of that ingredient came in, or null when there is none.
 */
export function onHandByRecipe(
  rows: RecipeIngredientName[],
  stockDate: (row: RecipeIngredientName) => string | null,
): Map<string, OnHandDish> {
  const dishes = new Map<string, OnHandDish>();
  for (const row of rows) {
    const date = stockDate(row);
    if (!date) continue;
    const name = row.baseName.trim().toLowerCase();
    const dish = dishes.get(row.recipeId) ?? { names: [], oldest: date };
    if (!dish.names.includes(name)) dish.names.push(name);
    if (date < dish.oldest) dish.oldest = date;
    dishes.set(row.recipeId, dish);
  }
  return dishes;
}

export function newOnHandLean(dishes: Map<string, OnHandDish>): OnHandLean {
  return { dishes, used: new Set(), claims: [] };
}

function unusedNames(lean: OnHandLean, recipeId: string): string[] {
  return (lean.dishes.get(recipeId)?.names ?? []).filter((name) => !lean.used.has(name));
}

/**
 * Keeps the candidates that use the most of what is in the kitchen and not
 * yet given to another pick, then the ones whose stock is oldest. A pool
 * where nothing uses anything on hand is returned as it was.
 */
export function leanTowardOnHand<T>(pool: T[], idOf: (item: T) => string, lean: OnHandLean | undefined): T[] {
  if (!lean || lean.dishes.size === 0 || pool.length === 0) return pool;
  const counted = pool.map((item) => ({ item, id: idOf(item), count: unusedNames(lean, idOf(item)).length }));
  const best = Math.max(...counted.map((entry) => entry.count));
  if (best === 0) return pool;
  const top = counted.filter((entry) => entry.count === best);
  const oldest = top.reduce((min, entry) => {
    const date = lean.dishes.get(entry.id)?.oldest ?? '9999';
    return date < min ? date : min;
  }, '9999');
  return top.filter((entry) => (lean.dishes.get(entry.id)?.oldest ?? '9999') === oldest).map((entry) => entry.item);
}

/** Records what a chosen dish takes from the kitchen, for the day's line. */
export function claimOnHand(lean: OnHandLean | undefined, recipeId: string, title: string): void {
  if (!lean) return;
  const names = unusedNames(lean, recipeId);
  if (names.length === 0) return;
  for (const name of names) lean.used.add(name);
  lean.claims.push({ recipeId, title, names });
}

/** "Uses what is in your kitchen: Lentil soup (lentils, carrots)." */
export function onHandDayLine(uses: { title: string; names: string[] }[] | undefined): string | null {
  if (!uses || uses.length === 0) return null;
  return `Uses what is in your kitchen: ${uses.map((use) => `${use.title} (${use.names.join(', ')})`).join('; ')}.`;
}

export const ON_HAND_SWITCH_LABEL = 'Use what is in the kitchen first';
export const ON_HAND_SWITCH_HELP =
  'Main dishes that use food measured in Life > Kitchen, from the garden or from a ferment are picked first, the oldest first, and each food leads one pick only. Nothing comes off the kitchen until a meal is logged.';

// --- 3. A new grocery list ---------------------------------------------------

export type ListCoverageLine = { name: string; level: 'covered' | 'some' };

/** The sheet shown right after a list is built, before anything is taken. */
export function newListKitchenMessage(lines: ListCoverageLine[]): string {
  const covered = lines.filter((line) => line.level === 'covered').map((line) => line.name);
  const some = lines.filter((line) => line.level === 'some').map((line) => line.name);
  const parts: string[] = [];
  if (covered.length > 0) parts.push(`Your kitchen covers ${covered.join(', ')}. Taking ${covered.length === 1 ? 'it' : 'them'} ticks the line off without buying.`);
  if (some.length > 0) parts.push(`It covers part of ${some.join(', ')}. Taking that lowers what is left to buy.`);
  parts.push('Every amount taken comes off what is in the kitchen, and nothing is given a price.');
  return parts.join(' ');
}

export function tookFromKitchenMessage(covered: number, some: number): string {
  const total = covered + some;
  if (total === 0) return 'Nothing was taken from the kitchen.';
  const parts = [`Took ${total === 1 ? '1 line' : `${total} lines`} from the kitchen.`];
  if (some > 0) parts.push(`${some === 1 ? '1 line still has' : `${some} lines still have`} some left to buy.`);
  return parts.join(' ');
}

export const TAKE_ALL_FROM_KITCHEN_LABEL = 'Take what the kitchen covers';
