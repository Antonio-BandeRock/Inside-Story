// Test data, so features can actually be seen doing something.
//
// 2026-09-03, asked for directly: "We need test data for everything in order
// to see what the app can or should do with it once it is in there." The app
// changes many times a day right now, so nobody is using it for real, which
// means most of it has never run against anything.
//
// That gap has a cost already visible in the record. The kitchen inventory
// shipped and has never been seen working. Three separate grocery bugs reached
// a shopping trip before anyone noticed. Neither is a coincidence: a
// feature nobody can exercise is a feature nobody can check.
//
// SAFETY, which is the whole design constraint here:
//
// Every row this writes carries a SEED_PREFIX id. Removal deletes exactly
// those and can touch nothing else, so test data can never be mistaken for
// real data, and can never be left behind by accident. Every table written to
// has a TEXT primary key this file generates, which is what makes that
// possible; nothing here writes to a table with a generated integer id.
//
// Phase 1 covers the three things the kitchen inventory reads: garden
// harvests, fermentation harvests, and a past grocery purchase. Logged history
// and saved dishes/schedule are phases 2 and 3.
import {
  getDatabase,
  resolveFoodOptionForBaseName,
  type FoodOption,
} from './db';
import { getActiveGroceryList, getGroceryListItems } from './groceryDb';

// Every seeded row's id begins with this. Removal is a LIKE on it, so the
// prefix is the only thing standing between test data and real data: it must
// never be dropped from an insert here.
export const SEED_PREFIX = 'seed_';

export type SeedResult = {
  gardenHarvests: number;
  fermentationHarvests: number;
  purchasedLines: number;
  // Foods that were seeded specifically because they are on the active
  // grocery list, so the caller can say which lines to go and look at.
  matchedFoods: string[];
  // Named rather than reported as a success: what could not be
  // seeded, and why.
  skipped: string[];
};

function seedId(kind: string, index: number): string {
  return `${SEED_PREFIX}${kind}_${index}`;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

// Foods used when there is no grocery list to draw from. Chosen for being
// ordinary things someone actually grows, and for resolving cleanly against
// the reference database.
const FALLBACK_GARDEN_FOODS: { category: string; baseName: string }[] = [
  { category: 'Veg', baseName: 'Broccoli' },
  { category: 'Veg', baseName: 'Kale' },
  { category: 'Veg', baseName: 'Spinach' },
  { category: 'Veg', baseName: 'Carrots' },
  { category: 'Veg', baseName: 'Tomatoes' },
];

// A grocery line's unit decides what a harvest has to be measured in to count
// against it: kitchenCoverageFor refuses to cross between weight, volume and
// a count, since that needs a density or a per-item weight it does not have.
// Seeding in the wrong family would produce a harvest that is correct and
// invisible, which is the least useful possible test.
function harvestUnitFor(lineUnit: string): string {
  const key = lineUnit.trim().toLowerCase();
  if (['ml', 'l', 'fl_oz', 'cup', 'tbsp', 'tsp'].includes(key)) return 'ml';
  if (['g', 'kg', 'oz', 'lb'].includes(key)) return 'g';
  // A count, or something unrecognised: match the word exactly, which is the
  // only way a count ever merges.
  return lineUnit.trim() || 'count';
}

export async function isTestDataPresent(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM garden_plots WHERE id LIKE '${SEED_PREFIX}%'`,
  );
  if ((row?.n ?? 0) > 0) return true;
  const ferment = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM fermentations WHERE id LIKE '${SEED_PREFIX}%'`,
  );
  if ((ferment?.n ?? 0) > 0) return true;
  const grocery = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM grocery_lists WHERE id LIKE '${SEED_PREFIX}%'`,
  );
  return (grocery?.n ?? 0) > 0;
}

// Seeds the three things the grocery list's kitchen inventory reads.
//
// Deliberately draws its foods FROM the active grocery list where there is
// one. That is not a shortcut: matching is by exact food name, so seeding
// "Broccoli" against a list that wants "Kale" produces nothing on screen and
// the test fails for a reason that is not a bug. Pulling from the real list
// guarantees the feature has something to say.
export async function seedKitchenSources(): Promise<SeedResult> {
  const db = await getDatabase();
  const result: SeedResult = {
    gardenHarvests: 0,
    fermentationHarvests: 0,
    purchasedLines: 0,
    matchedFoods: [],
    skipped: [],
  };

  const activeList = await getActiveGroceryList();
  const listItems = activeList ? await getGroceryListItems(activeList.id) : [];
  const fromSchedule = listItems.filter((item) => !item.addedManually);

  // --- Garden ---------------------------------------------------------------
  await db.runAsync(
    `INSERT OR REPLACE INTO garden_plots (id, name, location_type, growing_medium, size_description, notes)
     VALUES (?, ?, 'outdoor', 'Raised bed soil mix', 'Two 4x8 beds', 'Test data')`,
    seedId('plot', 1),
    'Test Garden Bed',
  );

  // Weight-family lines only: a garden harvest is measured on a scale, and
  // seeding a bottle of oil as something picked from a bed would be nonsense
  // even though the arithmetic would work.
  const gardenCandidates = fromSchedule.filter((item) => harvestUnitFor(item.unit) === 'g').slice(0, 4);

  const gardenFoods: { category: string; baseName: string; quantity: number; unit: string }[] =
    gardenCandidates.length > 0
      ? gardenCandidates.map((item, index) => ({
          category: item.category,
          baseName: item.foodName,
          // The first one deliberately covers its line outright and the rest
          // fall short, so both readings ("that covers this line" and "you
          // still need about X") can be seen in one pass rather than needing
          // two rounds of seeding.
          quantity: index === 0 ? Math.ceil(item.quantity * 1.5) : Math.max(1, Math.floor(item.quantity * 0.4)),
          unit: 'g',
        }))
      : FALLBACK_GARDEN_FOODS.map((food) => ({ ...food, quantity: 500, unit: 'g' }));

  let plantingIndex = 0;
  for (const food of gardenFoods) {
    let option: FoodOption | null = null;
    try {
      option = await resolveFoodOptionForBaseName(food.category, food.baseName);
    } catch {
      option = null;
    }
    if (!option) {
      result.skipped.push(`${food.baseName} (no reference database match)`);
      continue;
    }
    plantingIndex += 1;
    const plantingId = seedId('planting', plantingIndex);
    await db.runAsync(
      `INSERT OR REPLACE INTO garden_plantings
         (id, plot_id, food_id, source, food_name, planted_at, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'growing', 'Test data')`,
      plantingId,
      seedId('plot', 1),
      option.foodId,
      option.source,
      food.baseName,
      daysAgo(60),
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO garden_harvests
         (id, planting_id, plot_id, food_id, source, food_name, harvested_at, quantity, unit, quantity_remaining, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Test data')`,
      seedId('harvest', plantingIndex),
      plantingId,
      seedId('plot', 1),
      option.foodId,
      option.source,
      food.baseName,
      daysAgo(2),
      food.quantity,
      food.unit,
      // Remaining equals harvested: nothing has been used yet, which is the
      // state that actually exercises the coverage arithmetic.
      food.quantity,
    );
    result.gardenHarvests += 1;
    result.matchedFoods.push(food.baseName);
  }

  // --- Fermentation ---------------------------------------------------------
  //
  // Seeded against a volume line from the list where there is one, since a
  // ferment is a liquid and a weight line could never match it honestly.
  const volumeLine = fromSchedule.find((item) => harvestUnitFor(item.unit) === 'ml');
  const fermentName = volumeLine?.foodName ?? 'Ginger Water Kefir';
  const fermentQuantity = volumeLine ? Math.ceil(volumeLine.quantity * 1.2) : 1500;

  await db.runAsync(
    `INSERT OR REPLACE INTO fermentations (id, name, servings, serving_size_amount, serving_size_unit)
     VALUES (?, ?, 6, 250, 'ml')`,
    seedId('fermentation', 1),
    fermentName,
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO fermentation_batches (id, fermentation_id, stage, started_at, stage_changed_at, notes)
     VALUES (?, ?, 'ready', ?, ?, 'Test data')`,
    seedId('ferment_batch', 1),
    seedId('fermentation', 1),
    daysAgo(9),
    daysAgo(2),
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO fermentation_harvests
       (id, fermentation_batch_id, fermentation_id, drink_name, ready_at, quantity, unit, quantity_remaining, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'ml', ?, 'Test data')`,
    seedId('ferment_harvest', 1),
    seedId('ferment_batch', 1),
    seedId('fermentation', 1),
    fermentName,
    daysAgo(2),
    fermentQuantity,
    fermentQuantity,
  );
  result.fermentationHarvests += 1;
  if (volumeLine) result.matchedFoods.push(fermentName);

  // --- A past shopping trip -------------------------------------------------
  //
  // The third source, and the one that must never become a quantity: the app
  // knows a thing was bought and cannot know how much is left. Seeded as a
  // separate, completed list, since the kitchen inventory deliberately
  // excludes the list being shopped from its own purchase history.
  const purchaseCandidates = fromSchedule
    .filter((item) => !result.matchedFoods.includes(item.foodName))
    .slice(0, 3);
  const purchaseFoods =
    purchaseCandidates.length > 0
      ? purchaseCandidates.map((item) => ({ category: item.category, foodName: item.foodName, unit: item.unit, quantity: item.quantity }))
      : [{ category: 'Veg', foodName: 'Onions', unit: 'g', quantity: 300 }];

  await db.runAsync(
    `INSERT OR REPLACE INTO grocery_lists
       (id, name, start_date, days_ahead, people_count, store_name, status, completed_at)
     VALUES (?, ?, ?, 3, 1, 'Test Store', 'completed', ?)`,
    seedId('list', 1),
    'Last week (test data)',
    daysAgo(3),
    daysAgo(3),
  );
  let purchaseIndex = 0;
  for (const food of purchaseFoods) {
    purchaseIndex += 1;
    await db.runAsync(
      `INSERT OR REPLACE INTO grocery_list_items
         (id, list_id, category, food_name, unit, quantity, sort_order, checked, checked_at, price, price_unit, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'total', 'Test data')`,
      seedId('purchase', purchaseIndex),
      seedId('list', 1),
      food.category,
      food.foodName,
      food.unit,
      food.quantity,
      purchaseIndex,
      daysAgo(3),
      // A spread of prices, so Trends' own Grocery Prices lens has more than
      // one point to draw.
      3.5 + purchaseIndex * 1.25,
    );
    result.purchasedLines += 1;
  }

  if (!activeList) {
    result.skipped.push(
      'No grocery list exists yet, so foods were seeded from a fixed list. Build a grocery list and seed again to have them match its own lines.',
    );
  }

  return result;
}

// Deletes exactly what was seeded, and nothing else.
//
// Ordered children before parents. Several of these declare ON DELETE CASCADE
// and would tidy themselves up, but relying on that would mean a row whose
// foreign key is ever relaxed later silently starts surviving removal, and
// leftover test data is the one outcome this whole file exists to prevent.
export async function removeKitchenSourceTestData(): Promise<number> {
  const db = await getDatabase();
  const tables = [
    'garden_harvests',
    'garden_plantings',
    'garden_plots',
    'fermentation_harvests',
    'fermentation_batches',
    'fermentations',
    'grocery_list_items',
    'grocery_lists',
  ];
  let removed = 0;
  for (const table of tables) {
    const result = await db.runAsync(`DELETE FROM ${table} WHERE id LIKE '${SEED_PREFIX}%'`);
    removed += result.changes ?? 0;
  }
  return removed;
}
