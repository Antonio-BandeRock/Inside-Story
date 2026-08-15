// A real, dev-only tool -- rewritten from scratch 2026-08-14. The old
// seedTestDay() (this file's own previous content) was confirmed dead
// before this rewrite: zero call sites anywhere in the app, built against
// the pre-2026-08-02 all-in-one meal data model, from before the Food tab
// became eleven separate builders. This is its real replacement,
// seedTestWeek() -- built to give Past Meals/Trends/Signals/the ordinary
// Meals lens something genuinely real to look at on a fresh dev build,
// reusing real, already-verified curated-recipe content (see
// lib/digest/recipes.ts's own header comment) rather than hand-writing a
// second, parallel set of fake ingredients.
//
// Every real record this creates gets its own real name prefixed with
// NAME_PREFIX below, and a real, dedicated local manifest table
// (dev_seed_records -- owned entirely by this file, never touching
// initializeDatabase()'s own real app schema in lib/db.ts) records exactly
// which row this tool made, in which table. clearSeededTestData() reads
// that manifest back to undo precisely what was made, nothing more,
// nothing less -- with one real, named exception: the actual `meals` rows
// settlePastScheduledMeals() itself creates while settling the past week
// below can't be captured this way (that real, production function
// reports back nothing about which meal ids it made), so those are cleaned
// up via a real name-prefix sweep instead. See clearSeededTestData()'s own
// comment for the full reasoning.
//
// Reached only from Profile's own __DEV__-gated "Developer Tools" card
// (see app/profile.tsx) -- never reachable in a real production build.

import {
  createFoodTrial,
  createMealFromComponents,
  deleteBakedGoods,
  deleteBeverage,
  deleteFavorite,
  deleteFermentation,
  deleteFoodTrial,
  deleteHandheld,
  deleteMeal,
  deleteSalad,
  deleteSauce,
  deleteSide,
  deleteSmoothie,
  deleteSnack,
  deleteSoup,
  getCuratedRecipe,
  getCuratedRecipeStrainIds,
  getDatabase,
  resolveFoodTrial,
  saveBakedGoods,
  saveBeverage,
  saveFermentation,
  saveHandheld,
  saveMealFavorite,
  saveSalad,
  saveSauce,
  saveSide,
  saveSmoothie,
  saveSnack,
  saveSoup,
  scheduleMeal,
  setFermentationBatchStrains,
  settlePastScheduledMeals,
  type MealComponentSelection,
  type MealComponentType,
} from './db';

// Every real record this tool creates carries this exact prefix on its own
// name/title -- the one real, human-visible signal (alongside the manifest
// table itself) that a given row is seeded test data, not something a
// real person actually built or logged.
const NAME_PREFIX = '[TEST] ';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// A local "YYYY-MM-DDTHH:mm" string, dayOffset days from today (negative
// for the past, positive for the future) -- the same format eaten_at/
// scheduled_for/started_at already use throughout lib/db.ts.
function dateAt(dayOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`;
}

async function ensureSeedManifestTable(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dev_seed_records (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

async function recordSeeded(tableName: string, recordId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO dev_seed_records (id, table_name, record_id, created_at) VALUES (?, ?, ?, ?)',
    `seed_${tableName}_${recordId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tableName,
    recordId,
    new Date().toISOString(),
  );
}

type ComponentRecord = { componentType: MealComponentType; componentId: string };

// Resolves one real curated recipe (lib/digest/recipes.ts's own real
// content, built in Phase 2 of this same session) and saves it as a real
// record through the matching builder's own real save function -- the
// identical path a person tapping "Or Start From a Recipe" and then
// "Save" already goes through, not a second, parallel creation path.
async function saveRecipeAsComponent(recipeId: string, componentType: MealComponentType): Promise<ComponentRecord | null> {
  const recipe = await getCuratedRecipe(recipeId);
  if (!recipe) return null;

  const payload = {
    name: `${NAME_PREFIX}${recipe.name}`,
    servings: recipe.servings,
    servingSizeAmount: recipe.servingSizeAmount,
    servingSizeUnit: recipe.servingSizeUnit,
    ingredients: recipe.ingredients,
  };

  let id: string;
  let tableName: string;
  switch (componentType) {
    case 'side':
      ({ id } = await saveSide(payload));
      tableName = 'sides';
      break;
    case 'salad':
      ({ id } = await saveSalad(payload));
      tableName = 'salads';
      break;
    case 'smoothie':
      ({ id } = await saveSmoothie(payload));
      tableName = 'smoothies';
      break;
    case 'fermentation': {
      ({ id } = await saveFermentation(payload));
      tableName = 'fermentations';
      // Carries the recipe's own real strains straight through (see
      // Phase 1's fermentation_strains/curated_recipe_strains tables) --
      // the same real call FermentationBuilder.tsx's own
      // handlePickCuratedRecipe already makes.
      const strainIds = await getCuratedRecipeStrainIds(recipeId);
      if (strainIds.length > 0) await setFermentationBatchStrains(id, strainIds);
      break;
    }
    case 'beverage':
      ({ id } = await saveBeverage(payload));
      tableName = 'beverages';
      break;
    case 'snack':
      ({ id } = await saveSnack(payload));
      tableName = 'snacks';
      break;
    case 'bakedGoods':
      ({ id } = await saveBakedGoods(payload));
      tableName = 'baked_goods';
      break;
    case 'soup':
      ({ id } = await saveSoup(payload));
      tableName = 'soups';
      break;
    case 'sauce':
      ({ id } = await saveSauce(payload));
      tableName = 'sauces';
      break;
    case 'handheld':
      ({ id } = await saveHandheld(payload));
      tableName = 'handhelds';
      break;
  }

  await recordSeeded(tableName, id);
  return { componentType, componentId: id };
}

async function createMealFavoriteFromComponents(
  title: string,
  mealType: string,
  parts: (ComponentRecord | null)[],
): Promise<{ id: string; components: MealComponentSelection[] } | null> {
  const real = parts.filter((part): part is ComponentRecord => part !== null);
  if (real.length === 0) return null;

  const components: MealComponentSelection[] = real.map((part) => ({
    componentType: part.componentType,
    componentId: part.componentId,
    yourSharePercent: 100,
  }));

  const favorite = await saveMealFavorite({
    name: `${NAME_PREFIX}${title}`,
    mealType,
    components,
  });
  await recordSeeded('favorites', favorite.id);
  return { id: favorite.id, components };
}

// Real, one-shot content, deliberately covering all ten direct-ingredient
// builders exactly once -- ten real saved records, not a few dozen, is
// already enough real variety for a real test week; more would mean more
// to individually verify for no real added value here.
const RECIPE_PLAN: { recipeId: string; componentType: MealComponentType }[] = [
  { recipeId: 'curated_smoothie_green_glow', componentType: 'smoothie' },
  { recipeId: 'curated_baked_banana_oat_cookies', componentType: 'bakedGoods' },
  { recipeId: 'curated_bev_golden_milk', componentType: 'beverage' },
  { recipeId: 'curated_salad_mediterranean_chickpea_feta', componentType: 'salad' },
  { recipeId: 'curated_soup_tomato_basil', componentType: 'soup' },
  { recipeId: 'curated_snack_roasted_chickpeas', componentType: 'snack' },
  { recipeId: 'curated_handheld_grilled_chicken_sandwich', componentType: 'handheld' },
  { recipeId: 'curated_side_lemon_garlic_broccoli', componentType: 'side' },
  { recipeId: 'curated_sauce_basic_tomato', componentType: 'sauce' },
  { recipeId: 'curated_ferment_sauerkraut', componentType: 'fermentation' },
];

export async function seedTestWeek(): Promise<void> {
  await ensureSeedManifestTable();

  const saved: Record<string, ComponentRecord | null> = {};
  for (const plan of RECIPE_PLAN) {
    saved[plan.recipeId] = await saveRecipeAsComponent(plan.recipeId, plan.componentType);
  }

  const breakfastFav = await createMealFavoriteFromComponents('Breakfast', 'breakfast', [
    saved['curated_smoothie_green_glow'],
    saved['curated_baked_banana_oat_cookies'],
    saved['curated_bev_golden_milk'],
  ]);
  const lunchFav = await createMealFavoriteFromComponents('Lunch', 'lunch', [
    saved['curated_salad_mediterranean_chickpea_feta'],
    saved['curated_soup_tomato_basil'],
    saved['curated_snack_roasted_chickpeas'],
  ]);
  const dinnerFav = await createMealFavoriteFromComponents('Dinner', 'dinner', [
    saved['curated_handheld_grilled_chicken_sandwich'],
    saved['curated_side_lemon_garlic_broccoli'],
    saved['curated_sauce_basic_tomato'],
    saved['curated_ferment_sauerkraut'],
  ]);

  if (!breakfastFav || !lunchFav || !dinnerFav) {
    // A real, honest failure -- one of the ten curated recipes above
    // failed to resolve at all (every real ingredient in every one of
    // these was already verified against the live database before being
    // written in, so this shouldn't happen in practice, but a silent
    // partial seed would be worse than a clear stop here).
    throw new Error('seedTestWeek: one or more real curated recipes failed to resolve -- aborting rather than seeding a partial week.');
  }

  // Six real past days -- scheduled first, then genuinely settled via
  // settlePastScheduledMeals() below, the exact real production code path
  // a lapsed scheduled meal goes through (see that function's own comment
  // in lib/db.ts). This is what gives the new Past Meals lens real,
  // genuine content to show.
  for (let dayOffset = -6; dayOffset <= -1; dayOffset += 1) {
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}Breakfast`,
        mealType: 'breakfast',
        scheduledFor: dateAt(dayOffset, 8, 0),
        sourceFavoriteId: breakfastFav.id,
        components: breakfastFav.components,
      }),
    );
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}Lunch`,
        mealType: 'lunch',
        scheduledFor: dateAt(dayOffset, 12, 30),
        sourceFavoriteId: lunchFav.id,
        components: lunchFav.components,
      }),
    );
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}Dinner`,
        mealType: 'dinner',
        scheduledFor: dateAt(dayOffset, 18, 30),
        sourceFavoriteId: dinnerFav.id,
        components: dinnerFav.components,
      }),
    );
  }

  // The real, genuine settle pass -- materializes every one of the 18
  // schedule_items rows just created above into a real meals/meal_items/
  // meal_components row apiece, and marks each schedule_items row
  // 'logged'. See clearSeededTestData()'s own comment for how the
  // resulting meal rows get cleaned up, since this real function reports
  // back nothing about which meal ids it made.
  await settlePastScheduledMeals();

  // Today -- breakfast and lunch already eaten, logged directly (the same
  // real path a genuine "Log This Now" tap in Meal Builder already uses);
  // dinner deliberately left unscheduled, a realistic "haven't eaten yet
  // today."
  const todayBreakfast = await createMealFromComponents({
    name: `${NAME_PREFIX}Breakfast`,
    mealType: 'breakfast',
    eatenAt: dateAt(0, 8, 0),
    isImmediate: false,
    components: breakfastFav.components,
  });
  if ('id' in todayBreakfast) await recordSeeded('meals', todayBreakfast.id);

  const todayLunch = await createMealFromComponents({
    name: `${NAME_PREFIX}Lunch`,
    mealType: 'lunch',
    eatenAt: dateAt(0, 12, 30),
    isImmediate: false,
    components: lunchFav.components,
  });
  if ('id' in todayLunch) await recordSeeded('meals', todayLunch.id);

  // Tomorrow and the day after -- stay 'planned' (never settled), so the
  // ordinary Meals lens (not Past Meals) has real, genuine upcoming
  // content too.
  for (let dayOffset = 1; dayOffset <= 2; dayOffset += 1) {
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}Breakfast`,
        mealType: 'breakfast',
        scheduledFor: dateAt(dayOffset, 8, 0),
        sourceFavoriteId: breakfastFav.id,
        components: breakfastFav.components,
      }),
    );
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}Lunch`,
        mealType: 'lunch',
        scheduledFor: dateAt(dayOffset, 12, 30),
        sourceFavoriteId: lunchFav.id,
        components: lunchFav.components,
      }),
    );
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}Dinner`,
        mealType: 'dinner',
        scheduledFor: dateAt(dayOffset, 18, 30),
        sourceFavoriteId: dinnerFav.id,
        components: dinnerFav.components,
      }),
    );
  }

  // A few real food trials, in different real states, so Signals has real
  // content too -- not tied to a fake mechanism, the same real
  // createFoodTrial/resolveFoodTrial every genuine trial goes through.
  const trialSourceRecipe = await getCuratedRecipe('curated_snack_apple_almond_butter');
  const trialIngredient = trialSourceRecipe?.ingredients[0] ?? null;
  if (trialIngredient) {
    // A real foodId + source given at creation auto-starts this as
    // 'waiting' (see createFoodTrial's own status logic) -- realistic for
    // a food picked from a builder's own "Worth testing?" button, still
    // waiting on a real scheduled/logged meal to actually start its clock.
    const waiting = await createFoodTrial({
      foodName: trialIngredient.foodName,
      startedAt: dateAt(0, 9, 0),
      observationDays: 3,
      foodId: trialIngredient.foodId,
      source: trialIngredient.source,
      notes: 'Seeded test data.',
    });
    await recordSeeded('food_trials', waiting.id);
  }

  // No foodId/source given -> auto-starts 'trialing' immediately, the real
  // free-text trial path.
  const trialing = await createFoodTrial({
    foodName: 'A food tried a few days ago',
    startedAt: dateAt(-3, 9, 0),
    observationDays: 3,
    notes: 'Seeded test data.',
  });
  await recordSeeded('food_trials', trialing.id);

  const resolved = await createFoodTrial({
    foodName: 'A food already finished testing',
    startedAt: dateAt(-10, 9, 0),
    observationDays: 3,
    notes: 'Seeded test data.',
  });
  await recordSeeded('food_trials', resolved.id);
  await resolveFoodTrial(resolved.id, 'cleared', 'No reaction observed across the real 3-day window. Seeded test data.');
}

// Real, precise cleanup for everything the manifest table tracked directly
// -- plus a real, separate name-prefix sweep for the one real class of row
// this tool creates but can't individually track: the meals/meal_items/
// meal_components rows settlePastScheduledMeals() itself materializes
// during seedTestWeek() above. That real, production function (correctly,
// for its own real job) reports back nothing about which meal ids it
// made, so there's nothing to record in the manifest for those -- every
// one of them still carries the real NAME_PREFIX on its own name, which is
// what this sweep matches on instead.
export async function clearSeededTestData(): Promise<{ deletedCount: number }> {
  await ensureSeedManifestTable();
  const db = await getDatabase();

  const manifestRows = await db.getAllAsync<{ table_name: string; record_id: string }>(
    'SELECT table_name, record_id FROM dev_seed_records',
  );

  let deletedCount = 0;
  for (const row of manifestRows) {
    try {
      switch (row.table_name) {
        case 'sides':
          await deleteSide(row.record_id);
          break;
        case 'salads':
          await deleteSalad(row.record_id);
          break;
        case 'smoothies':
          await deleteSmoothie(row.record_id);
          break;
        case 'fermentations':
          await deleteFermentation(row.record_id);
          break;
        case 'beverages':
          await deleteBeverage(row.record_id);
          break;
        case 'snacks':
          await deleteSnack(row.record_id);
          break;
        case 'baked_goods':
          await deleteBakedGoods(row.record_id);
          break;
        case 'soups':
          await deleteSoup(row.record_id);
          break;
        case 'sauces':
          await deleteSauce(row.record_id);
          break;
        case 'handhelds':
          await deleteHandheld(row.record_id);
          break;
        case 'favorites':
          await deleteFavorite(row.record_id);
          break;
        case 'schedule_items':
          await db.runAsync('DELETE FROM schedule_items WHERE id = ?', row.record_id);
          break;
        case 'meals':
          await db.runAsync('DELETE FROM meal_items WHERE meal_id = ?', row.record_id);
          await db.runAsync('DELETE FROM meal_components WHERE meal_id = ?', row.record_id);
          await deleteMeal(row.record_id);
          break;
        case 'food_trials':
          await deleteFoodTrial(row.record_id);
          break;
        default:
          break;
      }
      deletedCount += 1;
    } catch (error) {
      // A row genuinely already gone (deleted by hand between seeding and
      // clearing, say) shouldn't stop the rest of a real cleanup pass.
      console.error(`[clearSeededTestData] Failed to delete ${row.table_name} ${row.record_id}`, error);
    }
  }

  const settledMeals = await db.getAllAsync<{ id: string }>('SELECT id FROM meals WHERE name LIKE ?', `${NAME_PREFIX}%`);
  for (const meal of settledMeals) {
    await db.runAsync('DELETE FROM meal_items WHERE meal_id = ?', meal.id);
    await db.runAsync('DELETE FROM meal_components WHERE meal_id = ?', meal.id);
    await deleteMeal(meal.id);
    deletedCount += 1;
  }

  await db.runAsync('DELETE FROM dev_seed_records');

  return { deletedCount };
}
