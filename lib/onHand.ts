// What is already in the kitchen, reaching the three places that used to
// ignore it (2026-09-27):
//
//   1. Logging a meal. The garden sheet already offered to take pickings off
//      what is on hand; food in the kitchen (bought, traded, given, or a
//      ferment) is now offered on the same sheet, as "From your kitchen".
//   2. The meal plan generator. With the switch on, a breakfast or main dish
//      the kitchen covers more of is chosen ahead of one it covers less of,
//      then the oldest stock first. Since H1 (2026-09-28) this is by amount:
//      each pick takes one serving's share off a copy of the kitchen, so the
//      next day leans only on what would still be there.
//   3. A new grocery list. Since H1 it is built around the kitchen: a line
//      the kitchen holds is left off what to buy, and a line it partly holds
//      is cut to the shortfall (lib/groceryList.ts, holdFromKitchen). Nothing
//      is taken off at that point; logging the meal is when it is.
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
  takeOutOfLedger,
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

export type OnHandNeed = {
  // Lower-cased base name, which is how the day line names it.
  name: string;
  // What one serving of the dish asks for, in the recipe's unit. Null when
  // the recipe gives no amount, which still counts as using the food.
  quantity: number | null;
  unit: string;
  // The measured stock it would come from, oldest first.
  stock: KitchenStockEntry[];
};

export type OnHandDish = {
  // Lower-cased names of what the dish uses from the kitchen.
  names: string[];
  // Local date the oldest of that stock came in.
  oldest: string;
  // Every ingredient the dish is bought for, so the share the kitchen covers
  // can be worked out (H1, 2026-09-28).
  ingredientCount: number;
  needs: OnHandNeed[];
};

export type OnHandLean = {
  dishes: Map<string, OnHandDish>;
  // What is left in the kitchen as this run picks dishes, kept on copies so
  // the map a screen holds is never drawn down by a preview. One bag of
  // lentils cannot feed every lunch for six weeks.
  ledger: Map<KitchenStockEntry, KitchenStockEntry>;
  // Foods given to an earlier pick where the amounts could not be compared,
  // so each of those leads one pick only.
  used: Set<string>;
  claims: { recipeId: string; title: string; names: string[] }[];
};

export type RecipeIngredientName = {
  recipeId: string;
  category: string;
  baseName: string;
  quantity?: number | null;
  unit?: string | null;
  // Servings the recipe makes; the amount per serving is what one pick needs.
  servings?: number | null;
};

/**
 * For every curated recipe, which of its ingredients are measured in the
 * kitchen right now and how much of each one serving asks for. `stockFor`
 * returns the stock for that ingredient; purchases and empty entries are
 * left out here.
 */
export function onHandByRecipe(
  rows: RecipeIngredientName[],
  stockFor: (row: RecipeIngredientName) => KitchenStockEntry[],
): Map<string, OnHandDish> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.recipeId, (counts.get(row.recipeId) ?? 0) + 1);
  const dishes = new Map<string, OnHandDish>();
  for (const row of rows) {
    const stock = stockFor(row)
      .filter((entry) => entry.source !== 'purchase' && entry.quantity > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (stock.length === 0) continue;
    const name = row.baseName.trim().toLowerCase();
    const date = stock[0].date;
    const dish = dishes.get(row.recipeId) ?? { names: [], oldest: date, ingredientCount: counts.get(row.recipeId) ?? 1, needs: [] };
    if (!dish.names.includes(name)) {
      dish.names.push(name);
      const servings = row.servings && row.servings > 0 ? row.servings : 1;
      const quantity = row.quantity != null && row.quantity > 0 && row.unit ? row.quantity / servings : null;
      dish.needs.push({ name, quantity, unit: row.unit ?? '', stock });
    }
    if (date < dish.oldest) dish.oldest = date;
    dishes.set(row.recipeId, dish);
  }
  return dishes;
}

export function newOnHandLean(dishes: Map<string, OnHandDish>): OnHandLean {
  const ledger = new Map<KitchenStockEntry, KitchenStockEntry>();
  for (const dish of dishes.values()) {
    for (const need of dish.needs) for (const entry of need.stock) if (!ledger.has(entry)) ledger.set(entry, { ...entry });
  }
  return { dishes, ledger, used: new Set(), claims: [] };
}

type NeedShare = { need: OnHandNeed; share: number; draws: KitchenDraw[]; oldest: string | null; ledger: KitchenStockEntry[] };

// How much of each on-hand ingredient the kitchen still covers for one
// serving, from 0 to 1. Where the amounts cannot be compared (no amount in
// the recipe, or grams against cups) the food counts whole until an earlier
// pick has used it.
function needShares(lean: OnHandLean, recipeId: string): NeedShare[] {
  const dish = lean.dishes.get(recipeId);
  if (!dish) return [];
  return dish.needs.map((need) => {
    const ledger = need.stock.map((entry) => lean.ledger.get(entry) ?? entry).filter((entry) => entry.quantity > 0);
    const oldest = ledger.length > 0 ? ledger[0].date : null;
    if (ledger.length === 0) return { need, share: 0, draws: [], oldest, ledger };
    if (need.quantity != null) {
      const coverage = kitchenCoverageFor(need.quantity, need.unit, ledger);
      if (coverage.coveredQuantity != null) {
        return { need, share: Math.min(1, coverage.coveredQuantity / need.quantity), draws: coverage.draws, oldest, ledger };
      }
    }
    return { need, share: lean.used.has(need.name) ? 0 : 1, draws: [], oldest, ledger };
  });
}

function scoreFor(lean: OnHandLean, recipeId: string): { bucket: number; amount: number; oldest: string } {
  const dish = lean.dishes.get(recipeId);
  const shares = needShares(lean, recipeId);
  const amount = shares.reduce((sum, entry) => sum + entry.share, 0);
  if (!dish || amount === 0) return { bucket: 0, amount: 0, oldest: '9999' };
  const oldest = shares.reduce((min, entry) => (entry.share > 0 && entry.oldest && entry.oldest < min ? entry.oldest : min), '9999');
  // Quarters of the dish the kitchen covers, so a dish mostly made from what
  // is on hand leads one that only uses a pinch of it.
  return { bucket: Math.ceil((amount / dish.ingredientCount) * 4 - 1e-9), amount: Math.round(amount * 100) / 100, oldest };
}

/**
 * Keeps the candidates the kitchen covers the largest share of, then the ones
 * using the most of it, then the ones whose stock is oldest. A pool where
 * nothing uses anything on hand is returned as it was.
 */
export function leanTowardOnHand<T>(pool: T[], idOf: (item: T) => string, lean: OnHandLean | undefined): T[] {
  if (!lean || lean.dishes.size === 0 || pool.length === 0) return pool;
  const scored = pool.map((item) => ({ item, score: scoreFor(lean, idOf(item)) }));
  const bucket = Math.max(...scored.map((entry) => entry.score.bucket));
  if (bucket === 0) return pool;
  const inBucket = scored.filter((entry) => entry.score.bucket === bucket);
  const amount = Math.max(...inBucket.map((entry) => entry.score.amount));
  const most = inBucket.filter((entry) => entry.score.amount === amount);
  const oldest = most.reduce((min, entry) => (entry.score.oldest < min ? entry.score.oldest : min), '9999');
  return most.filter((entry) => entry.score.oldest === oldest).map((entry) => entry.item);
}

/** Takes what a chosen dish uses off this run's copy of the kitchen, for the
 *  next pick and for the day's line. The kitchen itself is untouched. */
export function claimOnHand(lean: OnHandLean | undefined, recipeId: string, title: string): void {
  if (!lean) return;
  const names: string[] = [];
  for (const entry of needShares(lean, recipeId)) {
    if (entry.share <= 0) continue;
    names.push(entry.need.name);
    if (entry.draws.length > 0) takeOutOfLedger(entry.ledger, entry.draws);
    else lean.used.add(entry.need.name);
  }
  if (names.length > 0) lean.claims.push({ recipeId, title, names });
}

/** "Uses what is in your kitchen: Lentil soup (lentils, carrots)." */
export function onHandDayLine(uses: { title: string; names: string[] }[] | undefined): string | null {
  if (!uses || uses.length === 0) return null;
  return `Uses what is in your kitchen: ${uses.map((use) => `${use.title} (${use.names.join(', ')})`).join('; ')}.`;
}

export const ON_HAND_SWITCH_LABEL = 'Use what is in the kitchen first';
export const ON_HAND_SWITCH_HELP =
  'Breakfasts and main dishes made mostly from food measured in Life > Kitchen, picked from the garden or from a ferment come first, the oldest first. Each pick uses up its share, so a later day only leans on what would still be there. Nothing comes off the kitchen until a meal is logged.';

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
