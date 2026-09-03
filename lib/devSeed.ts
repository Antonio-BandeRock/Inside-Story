// A real, dev-only tool. Rebuilt 2026-08-15 (Part F of the same pass that
// fixed Trends' own real performance/picker/informative-chart gaps) --
// direct feedback: the prior seedTestWeek() only covered a real 9 days
// (-6..+2) using ONE repeated breakfast/lunch/dinner set every single day,
// and the request was explicit: "provide 90 days of meals... 60 days in
// the past and 30 days into the future." Rebuilt into seedTest90Days(),
// still reusing real, already-verified curated-recipe content (see
// lib/digest/recipes.ts's own header comment) through the exact same
// per-builder save functions a person tapping "Or Start From a Recipe"
// already goes through -- never a second, parallel creation path -- but
// now cycling through 5 real breakfast/lunch/dinner templates and 4 real
// snack templates (see the *_TEMPLATES arrays below) instead of one fixed
// set, so a real 90-day span shows genuine day-to-day variety, not the
// identical three dishes repeated 90 times.
//
// Every real record this creates gets its own real name prefixed with
// NAME_PREFIX below, and a real, dedicated local manifest table
// (dev_seed_records -- owned entirely by this file, never touching
// initializeDatabase()'s own real app schema in lib/db.ts) records exactly
// which row this tool made, in which table. clearSeededTestData() reads
// that manifest back to undo precisely what was made, nothing more,
// nothing less -- with one real, named exception: the actual `meals` rows
// settlePastScheduledMeals() itself creates while settling the past 60
// days below can't be captured this way (that real, production function
// reports back nothing about which meal ids it made), so those are cleaned
// up via a real name-prefix sweep instead. See clearSeededTestData()'s own
// comment for the full reasoning.
//
// Reached only from Profile's own __DEV__-gated "Developer Tools" card
// (see app/profile.tsx) -- never reachable in a real production build.

import { removeKitchenSourceTestData } from './testData';
import {
  createFoodTrial,
  createMealFromComponents,
  deleteBakedGoods,
  deleteBeverage,
  deleteDessert,
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
  saveDessert,
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
// content) and saves it as a real record through the matching builder's
// own real save function -- the identical path a person tapping "Or Start
// From a Recipe" and then "Save" already goes through, not a second,
// parallel creation path.
async function saveRecipeAsComponent(recipeId: string, componentType: MealComponentType): Promise<ComponentRecord | null> {
  const recipe = await getCuratedRecipe(recipeId);
  if (!recipe) return null;

  const payload = {
    name: `${NAME_PREFIX}${recipe.name}`,
    servings: recipe.servings,
    servingSizeAmount: recipe.servingSizeAmount,
    servingSizeUnit: recipe.servingSizeUnit,
    ingredients: recipe.ingredients,
    // Only saveSide's own real input type actually requires this (see that
    // function's own comment in lib/db.ts) -- a curated recipe has no real
    // hand-authored steps to seed with (see getCuratedRecipe's own comment),
    // and the other 10 saveX() calls below simply never read it off
    // `payload`, harmless excess-property-wise since `payload` is a named
    // variable, not a fresh object literal, at each call site.
    instructions: [] as string[],
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
      // fermentation_strains/curated_recipe_strains) -- the same real call
      // FermentationBuilder.tsx's own handlePickCuratedRecipe already makes.
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
    case 'dessert':
      ({ id } = await saveDessert(payload));
      tableName = 'desserts';
      break;
    default: {
      // A real, exhaustive default -- both fixes a genuine pre-existing
      // TypeScript bug (id/tableName were declared with no default,
      // meaning tsc couldn't prove every real componentType assigned them
      // without this) and, more importantly, means an unrecognized real
      // componentType fails loudly here rather than silently leaving
      // id/tableName unassigned.
      const exhaustiveCheck: never = componentType;
      throw new Error(`saveRecipeAsComponent: unhandled componentType "${String(exhaustiveCheck)}"`);
    }
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

type RecipeRef = { recipeId: string; componentType: MealComponentType };
type MealTemplate = { title: string; mealType: string; recipes: RecipeRef[] };

// Five real breakfast/lunch/dinner combinations apiece, and four real
// standalone snacks -- a genuine rotation across the real curated-recipe
// library (44 pre-existing + 3 added directly alongside this rebuild: the
// Rainbow Stir-Fried Vegetables side and the 2 curated desserts, see
// REFERENCE_DB_VERSION's own history), cycled by day offset so a real
// 90-day span shows real day-to-day variety instead of one repeated set.
// Not every one of the 47 real recipes is used here -- a deliberate,
// bounded rotation, not an attempt to force in literally everything.
const BREAKFAST_TEMPLATES: MealTemplate[] = [
  {
    title: 'Breakfast',
    mealType: 'breakfast',
    recipes: [
      { recipeId: 'curated_smoothie_green_glow', componentType: 'smoothie' },
      { recipeId: 'curated_baked_banana_oat_cookies', componentType: 'bakedGoods' },
    ],
  },
  {
    title: 'Breakfast',
    mealType: 'breakfast',
    recipes: [
      { recipeId: 'curated_side_herb_roasted_potatoes', componentType: 'side' },
      { recipeId: 'curated_bev_golden_milk', componentType: 'beverage' },
      { recipeId: 'curated_ferment_plain_yogurt', componentType: 'fermentation' },
    ],
  },
  {
    title: 'Breakfast',
    mealType: 'breakfast',
    recipes: [
      { recipeId: 'curated_smoothie_berry_antioxidant', componentType: 'smoothie' },
      { recipeId: 'curated_baked_buttermilk_biscuits', componentType: 'bakedGoods' },
    ],
  },
  {
    title: 'Breakfast',
    mealType: 'breakfast',
    recipes: [
      { recipeId: 'curated_ferment_probiotic_yogurt', componentType: 'fermentation' },
      { recipeId: 'curated_snack_trail_mix', componentType: 'snack' },
    ],
  },
  {
    title: 'Breakfast',
    mealType: 'breakfast',
    recipes: [
      { recipeId: 'curated_smoothie_iron_vitamin_c', componentType: 'smoothie' },
      { recipeId: 'curated_baked_whole_wheat_bread', componentType: 'bakedGoods' },
      { recipeId: 'curated_bev_ginger_turmeric_tonic', componentType: 'beverage' },
    ],
  },
];

const LUNCH_TEMPLATES: MealTemplate[] = [
  {
    title: 'Lunch',
    mealType: 'lunch',
    recipes: [
      { recipeId: 'curated_salad_mediterranean_chickpea_feta', componentType: 'salad' },
      { recipeId: 'curated_soup_tomato_basil', componentType: 'soup' },
    ],
  },
  {
    title: 'Lunch',
    mealType: 'lunch',
    recipes: [
      { recipeId: 'curated_handheld_grilled_chicken_sandwich', componentType: 'handheld' },
      { recipeId: 'curated_side_lemon_garlic_broccoli', componentType: 'side' },
      { recipeId: 'curated_sauce_basic_tomato', componentType: 'sauce' },
    ],
  },
  {
    title: 'Lunch',
    mealType: 'lunch',
    recipes: [
      { recipeId: 'curated_salad_southwest_quinoa_black_bean', componentType: 'salad' },
      { recipeId: 'curated_soup_red_lentil', componentType: 'soup' },
    ],
  },
  {
    title: 'Lunch',
    mealType: 'lunch',
    recipes: [
      { recipeId: 'curated_handheld_turkey_avocado_wrap', componentType: 'handheld' },
      { recipeId: 'curated_salad_kale_citrus_iron', componentType: 'salad' },
    ],
  },
  {
    title: 'Lunch',
    mealType: 'lunch',
    recipes: [
      { recipeId: 'curated_handheld_black_bean_sweet_potato_tacos', componentType: 'handheld' },
      { recipeId: 'curated_salad_sesame_ginger_slaw', componentType: 'salad' },
    ],
  },
];

const DINNER_TEMPLATES: MealTemplate[] = [
  {
    title: 'Dinner',
    mealType: 'dinner',
    recipes: [
      { recipeId: 'curated_side_rainbow_stir_fry', componentType: 'side' },
      { recipeId: 'curated_sauce_simple_pesto', componentType: 'sauce' },
      { recipeId: 'curated_soup_butternut_squash', componentType: 'soup' },
    ],
  },
  {
    title: 'Dinner',
    mealType: 'dinner',
    recipes: [
      { recipeId: 'curated_handheld_egg_salad_lettuce_wraps', componentType: 'handheld' },
      { recipeId: 'curated_salad_spinach_strawberry_almond', componentType: 'salad' },
      { recipeId: 'curated_dessert_baked_cinnamon_apples', componentType: 'dessert' },
    ],
  },
  {
    title: 'Dinner',
    mealType: 'dinner',
    recipes: [
      { recipeId: 'curated_soup_chicken_vegetable', componentType: 'soup' },
      { recipeId: 'curated_side_garlic_mashed_cauliflower', componentType: 'side' },
      { recipeId: 'curated_salad_beet_walnut_arugula', componentType: 'salad' },
      { recipeId: 'curated_ferment_sauerkraut', componentType: 'fermentation' },
    ],
  },
  {
    title: 'Dinner',
    mealType: 'dinner',
    recipes: [
      { recipeId: 'curated_handheld_turkey_avocado_wrap', componentType: 'handheld' },
      { recipeId: 'curated_side_sauteed_spinach_garlic', componentType: 'side' },
      { recipeId: 'curated_dessert_mixed_berry_chia_pudding', componentType: 'dessert' },
    ],
  },
  {
    title: 'Dinner',
    mealType: 'dinner',
    recipes: [
      { recipeId: 'curated_side_herb_roasted_potatoes', componentType: 'side' },
      { recipeId: 'curated_sauce_tahini_lemon', componentType: 'sauce' },
      { recipeId: 'curated_bev_iced_green_tea_mint', componentType: 'beverage' },
      { recipeId: 'curated_ferment_kombucha', componentType: 'fermentation' },
    ],
  },
];

const SNACK_TEMPLATES: MealTemplate[] = [
  { title: 'Snack', mealType: 'snack', recipes: [{ recipeId: 'curated_snack_apple_almond_butter', componentType: 'snack' }] },
  { title: 'Snack', mealType: 'snack', recipes: [{ recipeId: 'curated_snack_berries_yogurt', componentType: 'snack' }] },
  { title: 'Snack', mealType: 'snack', recipes: [{ recipeId: 'curated_snack_roasted_chickpeas', componentType: 'snack' }] },
  { title: 'Snack', mealType: 'snack', recipes: [{ recipeId: 'curated_bev_electrolyte_water', componentType: 'beverage' }] },
];

type ResolvedFavorite = { id: string; components: MealComponentSelection[] };

// Resolves every real template in a list into a real, saved favorite --
// componentCache is shared across ALL four template lists (breakfast/
// lunch/dinner/snack), so a real recipe referenced by more than one
// template (e.g. curated_side_herb_roasted_potatoes shows up in both a
// breakfast and a dinner template) only gets saved once, not once per
// place it's referenced.
async function resolveAllTemplates(
  templates: MealTemplate[],
  componentCache: Map<string, ComponentRecord | null>,
): Promise<ResolvedFavorite[]> {
  const favorites: ResolvedFavorite[] = [];
  for (const [index, template] of templates.entries()) {
    const parts: (ComponentRecord | null)[] = [];
    for (const ref of template.recipes) {
      if (!componentCache.has(ref.recipeId)) {
        componentCache.set(ref.recipeId, await saveRecipeAsComponent(ref.recipeId, ref.componentType));
      }
      parts.push(componentCache.get(ref.recipeId) ?? null);
    }
    const favorite = await createMealFavoriteFromComponents(`${template.title} Option ${index + 1}`, template.mealType, parts);
    if (favorite) favorites.push(favorite);
  }
  return favorites;
}

// Picks which of a real template list's own favorites applies on a given
// day -- a plain, deterministic cycle (day offset mod list length,
// normalized so a negative offset still lands on a real, valid index), not
// randomized, so re-running this tool always produces the exact same real
// rotation for the exact same day.
function templateFor(favorites: ResolvedFavorite[], dayOffset: number): ResolvedFavorite {
  const index = ((dayOffset % favorites.length) + favorites.length) % favorites.length;
  return favorites[index];
}

const PAST_DAYS = 60;
const FUTURE_DAYS = 30;

export async function seedTest90Days(): Promise<void> {
  await ensureSeedManifestTable();

  const componentCache = new Map<string, ComponentRecord | null>();
  const breakfastFavorites = await resolveAllTemplates(BREAKFAST_TEMPLATES, componentCache);
  const lunchFavorites = await resolveAllTemplates(LUNCH_TEMPLATES, componentCache);
  const dinnerFavorites = await resolveAllTemplates(DINNER_TEMPLATES, componentCache);
  const snackFavorites = await resolveAllTemplates(SNACK_TEMPLATES, componentCache);

  if (breakfastFavorites.length === 0 || lunchFavorites.length === 0 || dinnerFavorites.length === 0 || snackFavorites.length === 0) {
    // A real, honest failure -- one of the real curated recipes above
    // failed to resolve at all (every real ingredient in every one of
    // these was already verified against the live database before being
    // written in, so this shouldn't happen in practice, but a silent
    // partial seed would be worse than a clear stop here).
    throw new Error('seedTest90Days: one or more real curated recipes failed to resolve -- aborting rather than seeding partial data.');
  }

  async function scheduleAt(favorite: ResolvedFavorite, title: string, mealType: string, dayOffset: number, hour: number, minute: number) {
    await recordSeeded(
      'schedule_items',
      await scheduleMeal({
        title: `${NAME_PREFIX}${title}`,
        mealType,
        scheduledFor: dateAt(dayOffset, hour, minute),
        sourceFavoriteId: favorite.id,
        components: favorite.components,
      }),
    );
  }

  // Real past days -- scheduled first, then genuinely settled via
  // settlePastScheduledMeals() below, the exact real production code path
  // a lapsed scheduled meal goes through (see that function's own comment
  // in lib/db.ts). This is what gives the Past Meals lens real, genuine
  // content to show.
  for (let dayOffset = -PAST_DAYS; dayOffset <= -1; dayOffset += 1) {
    await scheduleAt(templateFor(breakfastFavorites, dayOffset), 'Breakfast', 'breakfast', dayOffset, 8, 0);
    await scheduleAt(templateFor(lunchFavorites, dayOffset), 'Lunch', 'lunch', dayOffset, 12, 30);
    await scheduleAt(templateFor(dinnerFavorites, dayOffset), 'Dinner', 'dinner', dayOffset, 18, 30);
    await scheduleAt(templateFor(snackFavorites, dayOffset), 'Snack', 'snack', dayOffset, 15, 0);
  }

  // The real, genuine settle pass -- materializes every one of the real
  // schedule_items rows just created above into a real meals/meal_items/
  // meal_components row apiece, and marks each schedule_items row
  // 'logged'. See clearSeededTestData()'s own comment for how the
  // resulting meal rows get cleaned up, since this real function reports
  // back nothing about which meal ids it made.
  await settlePastScheduledMeals();

  // Today -- breakfast, lunch, and the afternoon snack already eaten,
  // logged directly (the same real path a genuine "Log This Now" tap in
  // Meal Builder already uses); dinner deliberately left unscheduled, a
  // realistic "haven't eaten yet today."
  const todayBreakfast = await createMealFromComponents({
    name: `${NAME_PREFIX}Breakfast`,
    mealType: 'breakfast',
    eatenAt: dateAt(0, 8, 0),
    isImmediate: false,
    components: templateFor(breakfastFavorites, 0).components,
  });
  if ('id' in todayBreakfast) await recordSeeded('meals', todayBreakfast.id);

  const todayLunch = await createMealFromComponents({
    name: `${NAME_PREFIX}Lunch`,
    mealType: 'lunch',
    eatenAt: dateAt(0, 12, 30),
    isImmediate: false,
    components: templateFor(lunchFavorites, 0).components,
  });
  if ('id' in todayLunch) await recordSeeded('meals', todayLunch.id);

  const todaySnack = await createMealFromComponents({
    name: `${NAME_PREFIX}Snack`,
    mealType: 'snack',
    eatenAt: dateAt(0, 15, 0),
    isImmediate: false,
    components: templateFor(snackFavorites, 0).components,
  });
  if ('id' in todaySnack) await recordSeeded('meals', todaySnack.id);

  // Real future days -- stay 'planned' (never settled), so the ordinary
  // Meals lens (not Past Meals) and Trends' own real future-projection path
  // (getProjectedNutrientTotalsByDateRange, see lib/db.ts) both have real,
  // genuine content to read.
  for (let dayOffset = 1; dayOffset <= FUTURE_DAYS; dayOffset += 1) {
    await scheduleAt(templateFor(breakfastFavorites, dayOffset), 'Breakfast', 'breakfast', dayOffset, 8, 0);
    await scheduleAt(templateFor(lunchFavorites, dayOffset), 'Lunch', 'lunch', dayOffset, 12, 30);
    await scheduleAt(templateFor(dinnerFavorites, dayOffset), 'Dinner', 'dinner', dayOffset, 18, 30);
    await scheduleAt(templateFor(snackFavorites, dayOffset), 'Snack', 'snack', dayOffset, 15, 0);
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
// during seedTest90Days() above. That real, production function (correctly,
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
        case 'desserts':
          await deleteDessert(row.record_id);
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

  // 2026-09-03. The kitchen-source seeder (lib/testData.ts) keeps its rows out
  // of this manifest deliberately: several are parent/child pairs that have to
  // come out children-first, and this manifest is walked in insertion order,
  // which is parents-first. Rather than make the order of one list carry a
  // constraint it was never built for, that file removes its own rows in its
  // own order and reports how many. One Clear button, two modules each
  // responsible for what they created.
  deletedCount += await removeKitchenSourceTestData();

  return { deletedCount };
}
