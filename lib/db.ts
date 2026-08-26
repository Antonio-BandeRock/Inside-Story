import * as SQLite from 'expo-sqlite';
import { File } from 'expo-file-system';
import { REFERENCE_DB_VERSION } from './referenceDbVersion';
import { ageFromBirthDate } from './profile';
import { normalizeSupplementAmount } from './supplementUnits';
import { isAlcoholicFood } from './alcoholAdvisory';
import { isCoffeeFood } from './coffeeAdvisory';
import { isJuiceFood } from './juiceAdvisory';
import { analyzeNutrientIntake, NutrientGapEntry, sumFoodNutrientTotals } from './nutrientAnalysis';
import { ACTIVITY_LEVELS, ActivityLevel } from './energyNeeds';
import { isFlaggedTier } from './sixDimensionsReference';
import { buildPerConditionSummaries, type ConditionDimensionSummary } from './conditionDimensions';
import { convertToGrams, MASS_UNITS, MeasurementUnit, VOLUME_UNITS } from './unitConversion';
// Type-only -- lib/recipeDepth.ts imports several real functions FROM this
// file (getFoodScores, getFoodScoresForCondition, getConditionStages), so
// this stays a type-only import specifically to avoid a real circular
// runtime dependency; TypeScript erases a type-only import before Metro
// ever sees it, so there's nothing left at runtime to actually cycle.
import type { RecipeDepthResult } from './recipeDepth';

// Exported as of 2026-08-19 -- lib/visualPreferences.ts's own
// getGroundThemeSync() needs to open this exact same file (by name, via
// expo-sqlite's openDatabaseSync) for a real, synchronous, startup-time
// read. See that function's own comment for why the read has to be
// synchronous at all.
export const DB_NAME = 'inside_story.db';
const REFERENCE_DB_NAME = 'foods_reference.db';
const REFERENCE_DB_VERSION_KEY = 'reference_db_version';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let referenceDatabasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
// A real, confirmed bug, 2026-08-13: initializeDatabase() itself was never
// memoized the way databasePromise/referenceDatabasePromise both already
// are -- every call re-ran its own full CREATE TABLE/ALTER TABLE body from
// scratch. app/_layout.tsx fires two separate effects on mount that both,
// directly or indirectly, call initializeDatabase() (one directly, one via
// getReferenceDatabase()'s own internal call) -- with no dependency
// between them, React runs both in the same commit, so they raced. Every
// CREATE TABLE IF NOT EXISTS survives that fine, but each ALTER TABLE ADD
// COLUMN guard reads its own PRAGMA table_info snapshot independently --
// two concurrent calls can both see "column doesn't exist yet" for a
// genuinely brand-new column and both try to add it, the loser crashing
// with a real "duplicate column name" native error (confirmed on-device
// the moment growing_zone_country/growing_zone_postal_code were added --
// the first migration new enough that both racing calls could still see
// it as missing; every earlier migration's own column already existed on
// this device by the time this race could recur, which is why this had
// never visibly failed before). Memoized the same way getDatabase()/
// getReferenceDatabase() already are, so this class of bug can't recur for
// any future migration either -- see initializeDatabase()'s own body
// below for the real fix.
let initializeDatabasePromise: Promise<void> | null = null;

export type MealRecord = {
  id: string;
  name: string;
  meal_type: string;
  eaten_at: string;
  notes: string | null;
  is_immediate: number;
  created_at: string;
};

export type MealIngredientInput = {
  foodId?: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  notes?: string;
  dishName?: string;
  // The person's own name for this side (e.g. "Mixed vegetables", "Grandma's
  // slaw") -- typed when they create the side, not derived from whatever
  // ends up in it. Same denormalized-onto-every-ingredient-row pattern as
  // dishName/cookingMethod. Auto-generating a name from ingredients (what
  // this replaced) got unreliable and unreadable once a side had more than
  // a couple of ingredients in it.
  sideName?: string;
  // How many people the dish this ingredient belongs to is split between --
  // needed to derive per-person nutrient/scoring amounts from a dish-level
  // quantity. Same value repeated on every ingredient row in the dish
  // (mirrors how dishName is already denormalized onto each row).
  dishServings?: number;
  // What percent of the whole dish is actually this person's share -- an
  // even split (100 / dishServings) is only a starting assumption; two
  // people sharing a dish rarely eat exactly equal portions (different
  // appetites, cooking extra for someone else, etc.), so this is the
  // number nutrient math actually uses. Same denormalized-onto-every-row
  // pattern as dishServings. Nullable for rows saved before this field
  // existed, which fall back to the old equal-split-by-dishServings math.
  yourSharePercent?: number;
  // How the whole side/dish this ingredient belongs to was cooked (baked,
  // boiled, sauteed, ...) -- a side-level property, same denormalized-onto-
  // every-ingredient-row pattern as dishName/dishServings, not to be
  // confused with the per-food prep_method used to resolve which specific
  // database row's nutrients apply to this ingredient.
  cookingMethod?: string;
  // Other foods that can fill this exact slot instead of the ingredient's
  // own foodId/foodName/category (which is always the FAVORITE's own
  // default/base pick -- there's no separate mode flag, a non-empty list
  // here just means this ingredient is rotating rather than permanent).
  // This pool of possible alternates is shared across every scheduled use
  // of the favorite (edited on the Food tab); WHICH one is actually
  // chosen for one specific day is a completely separate, per-occurrence
  // concern -- see slotId, RotationSelection, and
  // setScheduledMealRotationSelections below. Only ever set/read on a
  // favorite's own stored ingredient list -- meal_items has no matching
  // column, so this is silently dropped once an ingredient is actually
  // logged into a real meal, same as it should be: a rotation pool is a
  // property of the reusable recipe, not of one specific day's log entry.
  rotationAlternates?: IngredientRotationAlternate[];
  // A stable identity for this ingredient's "role" within its side,
  // assigned once when the ingredient is first added and preserved
  // through edits/rotation -- what a per-occurrence RotationSelection
  // targets, so a chosen alternate can be matched back to the right slot
  // regardless of the ingredient list's own order (which can change if the
  // favorite is later edited). Ingredients saved before this field existed
  // simply can't be individually overridden per-occurrence until re-saved.
  slotId?: string;
};

export type IngredientRotationAlternate = {
  foodId?: string;
  foodName: string;
  category: string;
};

// What a specific scheduled meal (one schedule_items row) has chosen for
// one rotating slot, overriding that slot's own default/base pick from the
// favorite for this occurrence only -- see
// setScheduledMealRotationSelections/applyRotationSelectionsToIngredients.
// Deliberately does NOT touch the favorite itself: rotating for Tuesday's
// scheduled smoothie must never change what Wednesday's (a separate
// schedule_items row built from the same favorite) will show, since the
// whole point is planning real variety across upcoming days ahead of time
// -- including, eventually, so an automatic shopping list can already know
// exactly which ingredient each specific upcoming day needs.
export type RotationSelection = {
  slotId: string;
  foodId?: string;
  foodName: string;
  category: string;
};

export type MealFavoritePayload = {
  name: string;
  mealType: string;
  notes?: string;
  ingredients: MealIngredientInput[];
};

export type SideFavoritePayload = {
  name: string;
  cookingMethod: string;
  ingredients: MealIngredientInput[];
};

// --- Sub-builder favorites (2026-08-08) -----------------------------------
//
// Wires up "Saving a reusable favorite," named as a real, deliberately
// scoped-out gap in CLAUDE.md's own Next Steps since 2026-08-02: every one
// of the nine sub-builders (Side, Salad, Smoothie, Fermentation, Beverage,
// Snack, Baked Goods, Soup, Sauces) plus Handhelds already saves a real
// standalone record when finished, but none could be saved as a template
// for fast reuse. Direct request, 2026-08-08: "Let's wire up favoriting for
// the sub-builders... If they only want to save the meal they created, or
// if they want it to be a favorite should [both] be available" -- i.e. an
// independent, additive choice, not a replacement for the real save.
//
// One generic payload/pair of functions serves all ten builders rather than
// ten near-identical copies -- confirmed, not assumed, that their own
// XIngredientInput types (SideIngredientInput, SaladIngredientInput, ...)
// are field-for-field identical before writing this, and that every one of
// their own saveX() input shapes is exactly
// { name, servings, servingSizeAmount, servingSizeUnit, ingredients }.
//
// Deliberately a real, self-contained JSON snapshot (payload_json on the
// existing `favorites` table), not a pointer into sides/salads/etc. -- a
// favorite has to keep working even if the original record it was saved
// from is later edited or deleted, and "reuse a favorite" should always
// mean "start a fresh new [side/salad/...] from this template," never
// silently editing whatever the original happened to become since. Same
// design already established for the app's original two favorite payloads
// above (MealFavoritePayload/SideFavoritePayload, both pre-2026-07-25
// rebuild) -- this is the same idea, just generic across all ten of the
// rebuilt builders' own real shape instead of the old flat
// MealIngredientInput one.
export type BuilderFavoriteIngredient = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

export type BuilderFavoritePayload = {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: BuilderFavoriteIngredient[];
  // 2026-08-15 -- a real photo of the finished dish, set/cleared via
  // lib/mealPhotos.ts's own setPhotoForTarget({kind:'favorite', ...}).
  // Unset for the vast majority of favorites, which never had a photo
  // attached.
  photoUri?: string;
  // 2026-08-17 -- the same real, hand-authored prep steps a saved record's
  // own SideDetail.instructions carries, snapshotted into the favorite the
  // same way every other field here already is. Undefined (not an empty
  // array) whenever nothing was authored -- matches RecipeCard.instructions'
  // own "absent means nobody wrote steps" contract, and every builder but
  // Side Builder still never sets this at all.
  instructions?: string[];
  // 2026-08-25 -- the same real depth (safeForConditions/conditionCautions/
  // dietTags/stageNotes) a saved record's own depth_data_json column
  // carries, snapshotted the same way instructions above already is.
  // Undefined until a builder actually computes it (Side Builder is the
  // pilot; every other builder still never sets this).
  depthData?: RecipeDepthResult;
};

export type BuilderFavoriteItemType =
  | 'side'
  | 'salad'
  | 'smoothie'
  | 'fermentation'
  | 'beverage'
  | 'snack'
  | 'bakedGoods'
  | 'soup'
  | 'sauce'
  | 'handheld'
  | 'dessert';

export async function saveBuilderFavorite(itemType: BuilderFavoriteItemType, payload: BuilderFavoritePayload) {
  const db = await getDatabase();
  const id = `favorite_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO favorites (id, item_type, name, payload_json, last_used_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    itemType,
    payload.name.trim(),
    JSON.stringify(payload),
    now,
    now,
    now,
  );

  return { id, ...payload };
}

// The inverse -- reads a favorite's own saved payload back out for a
// builder to pre-fill itself from (see e.g. SideBuilder.tsx's own
// fromFavoriteId effect, the same shape as its existing editSideId one,
// just sourced from here instead of getSide/getSideIngredients). Touches
// last_used_at so "most recently used" ordering (already how listFavorites
// sorts) reflects real reuse, not just creation time.
export async function getBuilderFavorite(id: string): Promise<(BuilderFavoritePayload & { id: string }) | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string }>('SELECT payload_json FROM favorites WHERE id = ?', id);
  if (!row) return null;

  const now = new Date().toISOString();
  await db.runAsync('UPDATE favorites SET last_used_at = ? WHERE id = ?', now, id);

  const payload = JSON.parse(row.payload_json) as BuilderFavoritePayload;
  return { id, ...payload };
}

// --- Meal favorites (2026-08-08) ------------------------------------------
//
// A second, genuinely different payload shape under the SAME 'meal'
// item_type the app's original MealFavoritePayload already uses (see
// above) -- the old shape is a flat MealIngredientInput[] snapshot, built
// for the old, deleted all-in-one meal builder; the real, current Meal
// Builder assembles a meal from meal_components (references into the nine
// sub-builder tables, not raw ingredients), so a meal favorite has to save
// THAT shape instead -- a list of component references, not ingredients.
//
// Both shapes coexist safely in the same table/item_type: Schedule's own
// MealsLens (matchingFavorites) only ever reads `payload.mealType`, present
// in both shapes, so a new-shape favorite still surfaces correctly as a
// pickable "Template/Favorite" source when scheduling a meal. Its own
// favoriteRotatingIngredients was made defensive (payload.ingredients ??
// []) rather than assuming the old shape's `ingredients` field is always
// present -- a new-shape favorite genuinely has no per-ingredient rotation
// data (that was an old-builder-specific feature), so reporting zero
// rotating ingredients for one is the correct answer, not a bug.
export type MealFavoriteComponent = {
  componentType: MealComponentType;
  componentId: string;
  yourSharePercent: number;
};

export type MealFavoriteComponentsPayload = {
  name: string;
  mealType: string;
  notes?: string;
  components: MealFavoriteComponent[];
  // Always empty for a new-shape favorite -- present only so any code
  // still reading the OLD MealFavoritePayload shape (Schedule's own
  // favoriteBaseIngredients) sees a real, safe empty array rather than
  // undefined if it ever reads a new-shape row without checking first.
  ingredients: [];
  // 2026-08-15 -- the same real photo field BuilderFavoritePayload carries,
  // set/cleared via lib/mealPhotos.ts's own setPhotoForTarget({kind:
  // 'favorite', ...}) -- represents the whole assembled plate for a
  // favorite meal, not any one of its own real components.
  photoUri?: string;
};

export async function saveMealFavorite(payload: {
  name: string;
  mealType: string;
  notes?: string;
  components: MealFavoriteComponent[];
}) {
  const db = await getDatabase();
  const id = `favorite_${Date.now()}`;
  const now = new Date().toISOString();
  const fullPayload: MealFavoriteComponentsPayload = {
    name: payload.name.trim(),
    mealType: payload.mealType,
    notes: payload.notes?.trim() || undefined,
    components: payload.components,
    ingredients: [],
  };

  await db.runAsync(
    `
      INSERT INTO favorites (id, item_type, name, payload_json, last_used_at, created_at, updated_at)
      VALUES (?, 'meal', ?, ?, ?, ?, ?)
    `,
    id,
    fullPayload.name,
    JSON.stringify(fullPayload),
    now,
    now,
    now,
  );

  return { id, ...fullPayload };
}

// Returns null for an old-shape (pre-rebuild) meal favorite -- genuinely a
// different, incompatible shape (raw ingredients, not component
// references) with nothing here for Meal Builder to resume from. Real,
// not-yet-shipped software with no installed users to migrate, so this is
// a clean, honest "can't resume this one" rather than a data migration.
export async function getMealFavorite(id: string): Promise<(MealFavoriteComponentsPayload & { id: string }) | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string }>('SELECT payload_json FROM favorites WHERE id = ?', id);
  if (!row) return null;

  const parsed = JSON.parse(row.payload_json) as Partial<MealFavoriteComponentsPayload>;
  if (!Array.isArray(parsed.components)) return null;

  const now = new Date().toISOString();
  await db.runAsync('UPDATE favorites SET last_used_at = ? WHERE id = ?', now, id);

  return {
    id,
    name: parsed.name ?? 'Meal',
    mealType: parsed.mealType ?? '',
    notes: parsed.notes,
    components: parsed.components,
    ingredients: [],
  };
}

export type FavoriteRecord = {
  id: string;
  item_type: string;
  name: string;
  payload_json: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FoodOption = {
  id: string;
  foodId: number;
  source: string;
  name: string;
  shortName: string | null;
  category: string;
};

export type FoodScore = {
  dimension: string;
  subCriterion: string;
  tier: string;
};

export type FoodNutrient = {
  code: string;
  displayName: string;
  unit: string;
  group: string;
  amountPer100g: number;
  // Which source this specific value actually came from -- equal to the
  // requested source unless this value was backfilled from a sibling (see
  // getFoodNutrients), in which case it names that sibling's source
  // instead so the UI can disclose it (e.g. "not tested by USDA for this
  // food; value from UK_CoFID").
  sourceUsed: string;
  isSupplemented: boolean;
};

// The real, bundled Hashimoto's food-scoring reference database: 22,016
// foods across 7 national sources, six-dimension tiered scoring already
// computed. Built by scripts/build_food_reference_db.py from
// hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx -- re-run that
// script and replace assets/data/foods_reference.db to refresh.
export async function getReferenceDatabase() {
  if (!referenceDatabasePromise) {
    referenceDatabasePromise = (async () => {
      // initializeDatabase is idempotent (CREATE TABLE IF NOT EXISTS), safe
      // to call here regardless of whether the caller already did -- this
      // guarantees app_meta exists before the version check below runs.
      await initializeDatabase();

      const mainDb = await getDatabase();
      const versionRow = await mainDb.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_meta WHERE key = ?',
        REFERENCE_DB_VERSION_KEY,
      );
      const versionMatches = versionRow?.value === REFERENCE_DB_VERSION;

      // A real, direct fix for a real, confirmed root cause, 2026-08-11.
      // This used to call importDatabaseFromAssetAsync() UNCONDITIONALLY
      // on every single launch, version match or not -- but that
      // function's own real source (expo-sqlite's own code, read
      // directly, not assumed) ALWAYS calls
      // `Asset.fromModule(assetId).downloadAsync()` as its first step,
      // before it ever looks at forceOverwrite. In a dev-client build
      // talking to a live Metro server, that download step is a real
      // network fetch of the whole ~130MB+ asset over WiFi, not a local
      // file read -- so even a launch that needed zero real reimport work
      // was still paying that same real, slow network cost every time.
      // Confirmed directly: the same file copies in under a second over
      // USB (149.7 MB/s) but was taking 100+ seconds this way, and the
      // app's own 120-second startup-gate timeout kept firing as a direct
      // result. This is the actual, confirmed cause of the repeated
      // "hangs at 95%"/timeout reports today -- not the database itself,
      // not a UI animation, a real logic bug in when this call happens at
      // all.
      //
      // Fixed by skipping the whole import call -- and therefore the
      // whole network fetch -- once it's genuinely not needed: the
      // version marker matching alone was judged not quite enough of a
      // guarantee on its own, given how much has already gone wrong
      // today, so this also directly, locally (no network involved)
      // confirms the actual database FILE still exists on-device before
      // trusting the version marker. Only when either check fails does
      // the real import (and its own real network cost) still run, with
      // forceOverwrite always true at that point -- if this branch is
      // running at all, a real import is genuinely wanted.
      // A real, second bug caught before it shipped further, same day: the
      // very first version of this fix crashed on-device with "URI is not
      // absolute" -- traced directly to expo-sqlite's own native Android
      // source (SQLiteModule.kt): `defaultDatabaseDirectory` is a bare
      // filesystem path (`context.filesDir.canonicalPath + "/SQLite"`),
      // not a URI. expo-sqlite's own native layer is fine with that bare
      // path, but expo-file-system's `File` class specifically expects a
      // real `file://`-scheme URI (its own Android bridge constructs a
      // `java.io.File(URI)`, which throws exactly this exception for
      // anything without a scheme) -- two different native modules, two
      // different path conventions, bridged here without the needed
      // `file://` prefix the first time. Confirmed directly against a
      // real, adb-verified on-device path earlier the same day
      // (/data/data/com.insidestoryapp.app/files/SQLite/...) that this is
      // exactly the right directory, just missing its own scheme.
      const referenceDbPath = `file://${SQLite.defaultDatabaseDirectory}/${REFERENCE_DB_NAME}`;
      const alreadyImported = versionMatches && new File(referenceDbPath).exists;

      if (!alreadyImported) {
        await SQLite.importDatabaseFromAssetAsync(REFERENCE_DB_NAME, {
          assetId: require('../assets/data/foods_reference.db'),
          forceOverwrite: true,
        });

        const now = new Date().toISOString();
        await mainDb.runAsync(
          `
            INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `,
          REFERENCE_DB_VERSION_KEY,
          REFERENCE_DB_VERSION,
          now,
        );
      }

      return SQLite.openDatabaseAsync(REFERENCE_DB_NAME);
    })();
  }

  return referenceDatabasePromise;
}

function toFoodOption(row: { food_id: number; source: string; name: string; short_name: string | null; category: string }): FoodOption {
  return {
    id: `${row.food_id}|${row.source}`,
    foodId: row.food_id,
    source: row.source,
    name: row.name,
    shortName: row.short_name,
    category: row.category,
  };
}

// Categories hidden from the app's own category picker entirely, per direct
// 2026-08-05 requests -- "not needed for our purposes right now" rather than
// excluded from any one builder's own allowlist (see foodBuilderCategories.ts).
// Insights' unrestricted Food Lookup lens has no allowlist at all, so without
// this exclusion these would still show up there even with every builder's own
// allowlist already leaving them out. The underlying rows stay in the database
// untouched -- this only hides the category from the picker, and can be
// reversed by removing an entry here if/when either is wanted again.
//   'CommercialPremade' ("Commercial / Pre-Made") -- branded/packaged/box-mix
//     products already present in the source USDA/national databases this app
//     derives from. NOT where a future barcode-scan feature's own scanned
//     products will land -- that's a separate, not-yet-decided question.
//   'Baked' ("Baked Goods") -- bread/cookies/cake/pastry-type reference rows.
const CATEGORIES_HIDDEN_FROM_BROWSING = new Set(['CommercialPremade', 'Baked']);

export async function getReferenceCategories() {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM foods ORDER BY category',
  );
  return rows.map((row) => row.category).filter((category) => !CATEGORIES_HIDDEN_FROM_BROWSING.has(category));
}

// Hide-sync for Digest's per-food profile entries (the Fruits,
// Vegetables, Nuts & Seeds guide), 2026-08-09 -- direct request: "if any of
// them get hidden in the database so they are not viewable within the app,
// then their information should also disappear." A Digest entry about a
// specific food is real, useful content only as long as that food is still
// something a person can actually find and log in this app -- once every
// real row behind a food name has been hidden (via the Reference Database
// Audit tool's own per-row `hidden` flag, or its whole category hidden via
// CATEGORIES_HIDDEN_FROM_BROWSING above), an entry that still talks about it
// as if it were browsable would be actively misleading, not just stale.
//
// One bulk query rather than one call per entry -- Digest tags each
// profile entry with the real base_name(s) it's about (see
// lib/digest/produceProfiles.ts's own `relatedFoodNames` field) and asks
// once, up front, which of the full set across every profile entry are
// still actually visible; the screen then filters its own entry list
// client-side against that one Set. Matched by base_name (what a person
// actually sees in the food pickers), case-sensitively -- these names are
// hand-typed to match the reference database exactly, the same discipline
// already used for ALCOHOL_HIDDEN_BASE_NAMES/BEV_JUICE_ALLOWED_NAMES above.
export async function getVisibleFoodBaseNames(names: string[]): Promise<Set<string>> {
  if (names.length === 0) return new Set();
  const db = await getReferenceDatabase();
  const namePlaceholders = names.map(() => '?').join(', ');
  const hiddenCategories = Array.from(CATEGORIES_HIDDEN_FROM_BROWSING);
  const categoryClause = hiddenCategories.length > 0
    ? ` AND category NOT IN (${hiddenCategories.map(() => '?').join(', ')})`
    : '';
  const rows = await db.getAllAsync<{ base_name: string }>(
    `SELECT DISTINCT base_name FROM foods WHERE hidden = 0 AND base_name IN (${namePlaceholders})${categoryClause}`,
    [...names, ...hiddenCategories],
  );
  return new Set(rows.map((row) => row.base_name));
}

// Reported directly by the user, 2026-08-02: manufactured/packaged
// alcoholic beverages (beer, cider) and mixed drinks/cocktails shouldn't be
// loggable via a generic reference-data entry at all right now -- unlike a
// plain distilled spirit (where real research confirmed proof alone
// determines nutrition, so a generic entry is already an honest stand-in
// for any real bottle), beer/cider vary enormously by actual product, and
// a cocktail's real nutrition depends entirely on its own recipe and
// proportions, not a single well-defined "thing." The person's own stated
// direction: these should be "scan only" once a barcode-scan feature
// exists (not built yet) rather than represented by a misleadingly
// precise-looking generic entry in the meantime. Scoped to Alcohol only --
// every other category's own subcategories are unaffected.
const ALCOHOL_SUBCATEGORIES_PENDING_SCAN_FEATURE = new Set(['Beer & Cider', 'Cocktails & Mixed']);

// Returns [] for categories with no defined sub-categories (most of them,
// for now) -- the app should skip the drill-down step entirely in that case
// rather than show an empty/pointless dropdown.
export async function getReferenceSubcategories(category: string) {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ subcategory: string | null }>(
    'SELECT DISTINCT subcategory FROM foods WHERE category = ? AND subcategory IS NOT NULL AND hidden = 0 ORDER BY subcategory',
    category,
  );
  const subcategories = rows.map((row) => row.subcategory).filter((value): value is string => value !== null);
  if (category === 'Alcohol') {
    return subcategories.filter((value) => !ALCOHOL_SUBCATEGORIES_PENDING_SCAN_FEATURE.has(value));
  }
  return subcategories;
}

// Categories aren't uniformly covered by USDA -- confirmed 2026-08-02,
// reported as "no items listed in Brewing and Infusions": that category
// (and Alcohol, and Algae) has ZERO USDA rows at all, so the usdaOnly
// default every search/resolve function below otherwise applies was
// silently returning nothing for all three, not because those categories
// are genuinely empty (Alcohol alone has 159 real foods) but because
// USDA-only quietly excluded the only sources that actually cover them.
// Falls back to searching every source for a category with no USDA
// coverage; leaves categories that DO have USDA rows (the common case)
// untouched, so well-covered categories keep the single-source experience
// searchReferenceFoodNames's own docstring explains usdaOnly exists for
// (avoiding near-duplicate "Spinach" x7 entries, one per national source).
// Cached per category rather than re-queried on every keystroke of a live
// search -- categories are a small, stable set, and a real reference-DB
// rebuild only ever lands via a fresh app install/update, which restarts
// this cache fresh along with everything else.
const categoryHasUsdaCoverage = new Map<string, Promise<boolean>>();

async function hasUsdaCoverage(category: string): Promise<boolean> {
  let cached = categoryHasUsdaCoverage.get(category);
  if (!cached) {
    cached = (async () => {
      const db = await getReferenceDatabase();
      const row = await db.getFirstAsync<{ found: number }>(
        "SELECT EXISTS(SELECT 1 FROM foods WHERE category = ? AND source = 'USDA' AND hidden = 0) AS found",
        category,
      );
      return !!row?.found;
    })();
    categoryHasUsdaCoverage.set(category, cached);
  }
  return cached;
}

async function resolveEffectiveUsdaOnly(category: string, subcategory: string | null, usdaOnly: boolean): Promise<boolean> {
  if (!usdaOnly) return false;
  // A real bug found 2026-08-02, reported directly as "I 19 jucies listed"
  // right after BEV_JUICE_ALLOWED_NAMES shipped (see its own comment) --
  // Bev has plenty of real USDA coverage, so the usdaOnly default here
  // stayed true and silently crushed the curated 103-entry cross-source
  // allowlist down to just its 19 USDA-sourced rows, hiding all 84 real,
  // already-hand-verified entries from the other 6 sources (German
  // lingonberry/elderberry/quince juice, Japanese yuzu/sudachi/kabosu
  // citrus, etc.). usdaOnly exists to avoid near-duplicate "Spinach x7"
  // entries across sources -- but that's already handled here by the
  // allowlist itself, reviewed name-by-name, WITH cross-source duplicates
  // (e.g. "Blackberry juice, canned" from both Canada_CNF and USDA)
  // deliberately kept since they're the same real food independently
  // measured, not noise. So for this one specific subcategory, forcing
  // usdaOnly only throws away real, wanted variety for no benefit.
  if (category === 'Bev' && subcategory === 'Juice') return false;
  // Same exact bug, checked PROACTIVELY 2026-08-13 rather than waiting for
  // a report -- this file's own standing practice by now, six real
  // categories deep. Directly prompted by unhiding Bev's own Tea/Coffee/
  // Water/Protein & Meal Replacement subcategories the same day (see
  // REFERENCE_DB_VERSION's own bump and BeverageSubtypePicker.tsx): Bev as
  // a whole category clearly has real USDA coverage, so without this,
  // resolveEffectiveUsdaOnly's own default would have silently crushed
  // every one of these back down to USDA-only, undoing most of what just
  // got unhidden -- confirmed via direct query before writing this: only
  // 25 of 67 real Tea rows, 11 of 52 Coffee, and 17 of 133 Water (mostly
  // France_Ciqual's own 89 real mineral-water rows) are USDA-sourced.
  // Deliberately per-subcategory, not a blanket Bev bypass -- the REST of
  // Bev (Soft Drinks, Dairy & Blended, Other, all still fully hidden as of
  // this same day, a real, separate, deliberate curation call left
  // untouched here) still gets the real "Spinach x7" duplicate-avoidance
  // usdaOnly exists for, the moment any of it is unhidden later.
  if (
    category === 'Bev' &&
    (subcategory === 'Tea' ||
      subcategory === 'Coffee' ||
      subcategory === 'Water' ||
      subcategory === 'Protein & Meal Replacement' ||
      subcategory === 'Sports & Energy Drinks')
  ) {
    return false;
  }
  // Same exact bug, same day, reported directly right after PantryStaples
  // shipped: "I have the new category, but only 7 rows of data in the
  // app... Rows in the database are not showing up here for a reason."
  // Confirmed via direct query -- PantryStaples has SOME real USDA
  // coverage (7 of its 29 real ingredients, e.g. the "Leavening agent(s),
  // ..." naming), so this function's own default silently crushed the
  // category down to just those 7, hiding the other 22 (agar-agar,
  // gelatine, apple pectin, Konjac, most baking-powder/baker's-yeast
  // variants) from every other of the 7 national sources. Safe to bypass
  // entirely, same reasoning as Bev/Juice above: usdaOnly exists to avoid
  // near-duplicate "Spinach x7"-style entries, but searchReferenceFoodNames
  // already collapses same-base_name rows from different sources into one
  // distinct, selectable item (`SELECT DISTINCT base_name`) regardless of
  // this flag -- so there's no duplication risk to guard against here,
  // only real cross-source variety this category was built to consolidate.
  if (category === 'PantryStaples') return false;
  // A real, pre-existing regression found 2026-08-03 while auditing every
  // category for this same bug class after the PantryStaples fix above --
  // not reported directly, found by checking. Alcohol genuinely had ZERO
  // USDA rows when the original Alcohol/Algae/Brewing hasUsdaCoverage()
  // bypass was written (documented at the time: "USDA in particular had
  // ZERO rows in Alcohol at all"). But a LATER fix that same day
  // (reclassify_bev_alcoholic_to_alcohol(), moving 264 rows -- including
  // every real USDA wine/beer/spirit row -- out of Bev's own "Alcoholic"
  // subcategory into the proper Alcohol category) silently flipped
  // hasUsdaCoverage('Alcohol') from false to true, re-triggering the
  // USDA-only default for every Alcohol subcategory not already fully
  // hidden -- invisible in any code diff, since it's a runtime
  // recomputation, not a code change. Confirmed via direct query: Wine &
  // Champagne was showing 36 of 111 real entries, Spirits & Liqueurs 21 of
  // 82, "Other" 1 of 24 -- hiding most of the real German/French/UK/
  // Australian/Canadian diversity the alcohol cleanup work that same day
  // was built around. Safe to bypass for the same reason as Bev/Juice and
  // PantryStaples above: Alcohol already has its own purpose-built
  // duplicate-avoidance mechanism (ALCOHOL_HIDDEN_BASE_NAMES, built
  // specifically to consolidate "redundant per-source vodka/gin/rum/
  // whiskey duplicates"), so USDA-only on top of that hides real,
  // non-redundant variety rather than doing a job nothing else covers.
  if (category === 'Alcohol') return false;
  // Checked proactively, 2026-08-04, right after creating the new
  // 'PastaNoodles' category -- not waiting for "I only see some rows"
  // again, since this exact bug has now hit two new categories in a row
  // (PantryStaples, Alcohol) and is a known, standing risk for any new
  // category with partial USDA coverage. Confirmed via direct query
  // before shipping: 204 real distinct pasta/noodle products, only 31
  // with a USDA row -- without this bypass the category would silently
  // show just those 31 and hide the other 173 (nearly all of Japan_MEXT's,
  // Germany_BLS's, and France_Ciqual's real contribution). Safe for the
  // same reason as every bypass above: searchReferenceFoodNames already
  // collapses same-base_name rows from different sources into one
  // distinct, selectable item regardless of this flag.
  if (category === 'PastaNoodles') return false;
  // Checked proactively, 2026-08-04, right after the big Mixed-category
  // sauce sweep pushed 'SaucesCondiments' from zero USDA coverage (safe
  // on its own via hasUsdaCoverage() below) to partial -- 3 of 280
  // distinct products, once "Cheese sauce, prepared from recipe" and
  // "Homemade Cheese Sauce" were re-homed here from Dairy. Same standing
  // risk flagged at PastaNoodles above, now hit a third time: without
  // this bypass the category would silently collapse to just those 3
  // USDA rows and hide the other 277 (Germany_BLS's, France_Ciqual's, and
  // Australia_AFCD's real sauce/dressing/condiment contribution). Safe
  // for the same reason as every bypass above.
  if (category === 'SaucesCondiments') return false;
  // A real, PRE-EXISTING instance of this same bug, found 2026-08-04 not
  // by a report but by checking USDA coverage while moving two raw
  // mushroom items (Chanterelles, Porcini mushrooms) out of Mixed into
  // this category as part of that day's raw-ingredient-leakage cleanup --
  // Mushroom has exactly 1 real USDA row ("Fungi, Cloud ears") out of 109
  // genuinely distinct species (Chanterelle, Morel, Shiitake, Maitake,
  // Nameko, Matsutake, oyster/beech/king oyster/black poplar mushrooms,
  // black truffle...), so the usdaOnly default here has apparently been
  // silently collapsing the whole category down to that one row the
  // entire time this category has existed -- unrelated to and predating
  // every other fix in this list. Safe to bypass for the same reason as
  // every category above: this is real cross-source species variety, not
  // "Spinach x7"-style near-duplication.
  if (category === 'Mushroom') return false;
  // Checked proactively, 2026-08-04, right after creating the new
  // 'CommercialPremade' category (the same-day "no pre-made dishes in
  // Mixed" cleanup) -- 13 of 238 distinct products are USDA-covered.
  // Standing risk by now: this bug hits nearly every new/expanded
  // category with partial USDA coverage. Safe to bypass for the same
  // reason as every category above -- two different sources both
  // measuring, say, "Macaroni and cheese, box mix" are genuinely
  // independent real products, not "Spinach x7"-style near-duplication.
  if (category === 'CommercialPremade') return false;
  // A real, PRE-EXISTING instance of this bug, found 2026-08-13 not by a
  // report but by checking this whole function's own coverage while adding
  // the Bev-specific bypasses just above, for the exact same reason
  // Alcohol's own equivalent trap was found 2026-08-02: Brewing genuinely
  // had ZERO USDA rows when the original comment at this file's own top
  // ("Brewing... has ZERO USDA rows at all") was written, but that stopped
  // being true once real USDA rows were added directly to Brewing during
  // the same-day 2026-08-02 audit build-out (the "Beverages, coffee"/
  // "Beverages, tea"/etc. family) -- silently flipping hasUsdaCoverage
  // ('Brewing') from false to true with no code change to notice, the
  // identical invisible-runtime-recomputation trap Alcohol already hit.
  // Confirmed via direct query before writing this: only 28 of 102 real,
  // visible Brewing rows are USDA-sourced -- the other 74 (Canada_CNF,
  // France_Ciqual, Germany_BLS, Japan_MEXT, UK_CoFID, Australia_AFCD) have
  // been silently invisible this whole time. Safe to bypass for the same
  // reason as every category above: real cross-source variety, not
  // "Spinach x7"-style near-duplication.
  if (category === 'Brewing') return false;
  return hasUsdaCoverage(category);
}

// Hides two different kinds of Alcohol row from browsing, 2026-08-02,
// reported directly across a few messages in the same conversation:
//   1. Mixed drinks/cocktails that leaked into "Spirits & Liqueurs" or
//      "Wine & Champagne" instead of "Cocktails & Mixed" (itself already
//      hidden entirely, see ALCOHOL_SUBCATEGORIES_PENDING_SCAN_FEATURE
//      above) -- SUBCATEGORY_RULES in the build script checks Spirits &
//      Liqueurs' own keywords (whisky/rum/gin/tequila/etc.) BEFORE
//      Cocktails & Mixed's, so "Alcoholic beverage, whiskey sour" and
//      "Alcoholic beverage, tequila sunrise" both matched on the spirit
//      name first and never reached the cocktail check at all -- named
//      directly: "Whiskey Sour and Tequila Sunrise are names of mixed
//      drinks. Mixed drinks shouldn't be part of this."
//   2. Redundant near-duplicate plain-spirit/generic-bucket rows now that
//      a clean, single canonical entry exists per real spirit (see
//      scripts/build_food_reference_db.py's SPIRIT_CLEAN_RENAMES and
//      SYNTHETIC_SPIRIT_VARIANTS) -- reported directly: "the names of
//      these things are so long that I can't tell why they are
//      different... These should just have 1 unique entry for each
//      thing." Confirmed via this database's own numbers before hiding
//      anything: USDA's vodka/rum/"all" 80-proof rows and Canada_CNF's own
//      whisky/rum/vodka 40%-ABV rows are EXACT calorie matches within each
//      source, so keeping 4-5 near-identical entries per spirit added
//      confusion, not real distinguishing information.
// Scoped to Alcohol only, by base_name (not deleted from the database --
// see this file's own comment on 'Derived' above for why keeping the full
// reference data intact matters for a future scan feature). Every entry
// checked by hand against its own real name/nutrient data, not guessed.
const ALCOHOL_HIDDEN_BASE_NAMES = new Set([
  // Cocktails/mixed drinks that leaked past the Cocktails & Mixed hide.
  'Alcoholic beverage, whiskey sour',
  'Alcoholic beverage, whiskey sour, prepared from item 14028',
  'Alcoholic beverage, whiskey sour, prepared with water, whiskey and powder mix',
  'Alcoholic beverage, tequila sunrise',
  'Alcohol, cocktail, daiquiri (rum), homemade',
  'Alcohol, cocktail, pina colada (rum), homemade',
  'Alcohol, cocktail, whisky sour mix, bottled, whisky added',
  'Alcohol, cocktail, whisky sour mix, powder, water and whisky added',
  // 'Cocktail à base de whisky'/'Kir royal (au champagne)' renamed to
  // 'Whiskey-Based Cocktail'/'Kir Royale (Champagne)' here 2026-08-11, as
  // part of France_Ciqual's own real translation work -- the old French
  // strings are dead now that the rows' base_name changed, replaced with
  // their real English equivalents so both stay correctly hidden.
  'Whiskey-Based Cocktail',
  'Cocktail, Gin and tonic',
  'Cocktail, Tequila sunrise',
  'Kir Royale (Champagne)',
  // Flavored, ready-to-drink products -- the same "scan only, not a
  // plain well-defined thing" reasoning as beer/cider.
  'Vodka cooler, fruit flavours',
  'Alcohol, wine cooler',
  'Alcopops',
  // A mixed dairy+spirit drink, the same "mixed drink" reasoning as the
  // cocktails above, not a single well-defined spirit/wine/beer.
  'Egg nog',
  // Redundant generic "all spirits" buckets, now superseded by
  // Vodka/Gin/Whiskey's own clean single entries (80/86 proof) -- the
  // remaining proof tiers (90/94/100) are a real but niche use case,
  // dropped for now rather than reintroducing multiple choices per spirit.
  'Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 80 proof',
  'Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 86 proof',
  'Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 90 proof',
  'Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 94 proof',
  'Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 100 proof',
  'Alcoholic beverage, spirit, ~30% v/v, all (Brandy, Gin, Rum, Vodka and Whisky)',
  'Alcoholic beverage, spirit, ~40% v/v, all (Brandy, Gin, Rum, Vodka and Whisky)',
  // Redundant per-source vodka/gin/rum/whiskey duplicates -- the same
  // real spirit already covered by the clean canonical entry above (or,
  // for rum, by the Light/White and Dark/Aged Derived variants).
  'Alcoholic beverage, distilled, rum, 80 proof',
  'Alcohol, rum  (40% alcohol by volume)',
  'Alcohol, whisky (40% alcohol by volume)',
  'Alcohol, whisky (43% alcohol by volume)',
  'Alcohol, whisky (45% alcohol by volume)',
  'Alcohol, whisky (47% alcohol by volume)',
  'Alcohol, whisky (50% alcohol by volume)',
  'Gin',
  'Vodka',
  'Whisky',
  'Liqueur',
  // 'Rum' added 2026-08-11 -- a genuine bare "Rhum" row surfaced for the
  // first time in France_Ciqual's own real Bev-to-Alcohol reclassification
  // this same pass (see this Set's own header comment). Same reasoning as
  // Gin/Vodka/Whisky/Liqueur directly above: a real, distilled spirit
  // where proof alone determines nutrition, already superseded by Rum's
  // own clean Light/White and Dark/Aged Derived variants.
  'Rum',
  // 'Alcohol, gin (40% alcohol by volume)', 'Alcohol, vodka (40% alcohol
  // by volume)', and 'Agave spirit (Mezcal/Tequila)' removed here,
  // 2026-08-10 -- a real audit-tool decision batch explicitly unhid and
  // renamed all 3 (to "Gin (Dry / Unflavored)", "Vodka (Potato or Grape
  // preferred)", and "Tequila / Mezcal (100% Agave Blanco)"). The rename
  // alone already made them unreachable by this Set (their current
  // base_name no longer matches any entry here), so this is real cleanup
  // of now-dead strings, not a functional change -- confirmed directly
  // against the live database that all 3 rows show hidden=0 under their
  // new names before removing these.
  'Rum 37.5/40 % vol',
  'Rum 80 % vol',
  'Whisky/whiskey',
  'Distilled alcoholic beverage, gin',
  'Distilled alcoholic beverage, rum',
  'Distilled alcoholic beverage, vodka',
  'Distilled alcoholic beverage, whisky',
]);

// Reported directly by the user, 2026-08-02: "look in the Juices of
// Beverages and eliminate name branded and from concentrate from view...
// If it isn't just juice from a whole food fruit, it shouldn't be viewed
// in this list." An allowlist, not a denylist -- deliberately the more
// conservative choice given how emphatic the ask was ("just juice from a
// whole food fruit"), and given the category's own real scale (389 rows):
// a denylist trusts every future addition to be automatically fine, an
// allowlist doesn't. Built by hand-reviewing all 389 rows, not guessed --
// removed brand names (OCEAN SPRAY, V8 SPLASH, BOLTHOUSE FARMS, NAKED
// JUICE, ODWALLA, MOTTS, CONCORD, REAL LEMON), anything "from concentrate"
// or "chilled," anything fortified/with an addition (added vitamin C,
// ascorbic acid, calcium, sugar, salt -- but NOT the "without added X"/"no
// salt added" negations, which are exactly the plain versions worth
// keeping), every blend of 2+ fruits/vegetables, every "juice drink"/
// "cocktail"/"nectar"/"cordial"/"spritzer"/"fruit juice beverage" (none of
// these are pure juice), Japan_MEXT's own "reconstituted"/"X% fruit juice
// beverage" dilution tiers (kept their own "straight fruit juice" -- their
// term for undiluted, unblended, 100% juice), canned-fruit-preserved-in-
// juice products (the fruit itself, not a juice beverage), and "Kale
// juice, powder" (a dehydrated powder, not juice).
//
// Trimmed a second time, 2026-08-02, same day, to one row per real
// fruit/variety: "There should just be one of each type of fruit juice,
// not several variations of the same fruit juice." The first pass above
// still left several near-duplicate rows per fruit selectable (a plain
// "Apple juice" alongside a "canned or bottled, without added vitamin C"
// variant, five different sources' own "Orange juice" row, etc.) --
// real cross-source diversity, but not a real CHOICE, since none of the
// duplicates represent a genuinely different product. Kept exactly one
// representative row per plain fruit (preferring USDA when it's on file,
// else whichever single source has it), EXCEPT where multiple rows
// represent a real, commonly-recognized named variety rather than just a
// processing difference -- confirmed directly with the person before
// building this, since it's a real judgment call either way: Red/White
// Grape, Pink/White Grapefruit, Navel/Valencia Orange, and Purple/Yellow
// Passion Fruit all stay as their own separate entries. Also merged two
// pairs that turned out to be the same real thing under different names,
// not real varieties: "Sour cherry" (Germany_BLS) into "Tart cherry"
// (USDA) -- the same species (Prunus cerasus) under its European vs.
// American common name -- and "Mandarin juice"/"Tangerine (mandarin)
// juice" into plain "Tangerine juice," since mandarin/tangerine are used
// interchangeably by most people and neither this database nor common
// usage draws a clean line between them the way Navel/Valencia orange
// does. "Satsuma mandarin juice" (Germany_BLS, a non-Japanese-sourced row
// that would have sat confusingly close to the Japanese Satsuma entries
// below) was dropped outright in favor of the already-kept Japan_MEXT
// "Satsuma mandarins, straight fruit juice" -- same real product, and
// Satsuma is a genuinely Japanese place name, so keeping it under the
// Japanese header rather than duplicated outside it reads more honestly.
//
// Four Japan_MEXT rows that are NOT Japanese-named fruits (Seminole is a
// Florida-bred tangelo; sour/bitter orange and navel orange are both
// globally common terms) stay in this list as their own plain entries
// rather than joining the Japanese-cultivar group in
// components/FoodLookup.tsx's own JUICE_JAPAN_DISPLAY_LABELS -- they just
// happen to be Japan_MEXT-exclusive in this database's own source
// coverage, which isn't the same thing as the fruit itself being
// Japanese. Each was given a real, clean base_name via
// scripts/build_food_reference_db.py's own JUICE_CLEAN_RENAMES/
// NAME_CATEGORY_OVERRIDES (Seminole, Sour Orange, Navel Orange, Valencia
// Orange) so they read the same as every other plain fruit here, not with
// their original clunky "Oranges, navel, juice sacs" phrasing.
//
// A real complication found while building the original list, not
// assumed away: many rows share one base_name despite being nutritionally
// different (e.g. all 7 of USDA's "Apple juice" rows -- with/without
// added ascorbic acid, canned/frozen-concentrate -- collapse to base_name
// "Apple juice," 3 of them even sharing prep_method "Canned" too) -- a
// base_name-only filter couldn't separate the one plain row from the
// other 6. Filtered by the full `name` column instead, checked below in
// buildScopeClause, which is precise regardless of what base_name/
// prep_method a row happens to share with something that should be
// hidden.
const BEV_JUICE_ALLOWED_NAMES = new Set([
  // Plain fruits/vegetables -- one representative row each.
  'Acerola juice, raw',
  'Apple juice, canned or bottled, unsweetened, without added ascorbic acid',
  'Apricot juice',
  'Beetroot juice',
  'Black currant juice',
  'Blackberry juice, canned',
  'Blueberry juice',
  'Cape gooseberry juice',
  'Carrot juice, canned',
  'Celeriac juice',
  'Cherry juice, tart',
  'Clementine juice',
  // Coconut water: was deliberately kept as a mature/young pair (see this
  // const's own comment above) since young coconut water is a real,
  // separately marketed product -- reversed 2026-08-02, explicit direct
  // request ("we only need one coconut water not two"). Young/immature
  // kept as the one entry: it's what "coconut water" means as a plain
  // beverage in virtually every commercial/common usage (Vita Coco etc.);
  // mature coconut water is the less common of the two in practice, more
  // associated with coconut milk/meat production than a drink on its own.
  'Coconut, fresh, young or immature, water or juice',
  'Cucumber juice',
  'Elderberry juice',
  'Honeydew melon juice',
  'Kiwi fruit juice',
  'Lemon juice, raw',
  'Lime juice, raw',
  'Lingonberry juice',
  'Lychee juice',
  'Mango juice',
  'Mangosteen juice',
  'Mulberry juice',
  'Onion juice',
  "Orange juice, raw (Includes foods for USDA's Food Distribution Program)",
  'Passion fruit juice',
  'Pear juice',
  'Persimmon juice',
  'Plum juice',
  'Pomegranate juice, bottled',
  'Pomelo juice',
  'Prune juice, canned',
  'Quince juice',
  'Raspberry juice',
  'Red currant juice',
  'Rhubarb juice',
  'Sauerkraut juice',
  'Sea buckthorn berry juice',
  'Sloe fruit juice',
  'Spinach juice',
  'Strawberry juice',
  'Sweet cherry juice',
  'Tangerine juice, raw',
  'Tomato juice, canned, without salt added',
  'Cranberry juice, unsweetened',
  // Real, commonly-recognized named varieties -- kept separate rather
  // than collapsed into their plain fruit's single entry.
  'Grape red juice',
  'Grape white juice',
  'Grapefruit juice, pink, raw',
  'Grapefruit juice, white, raw',
  'Passion-fruit juice, purple, raw',
  'Passion-fruit juice, yellow, raw',
  // Japan_MEXT-exclusive but NOT Japanese-named fruits -- see this
  // const's own comment above for why these stay outside the Japanese
  // group.
  'Oranges, navel, juice sacs, raw',
  'Oranges, Valencia, straight fruit juice',
  'Citrus, Seminole, juice sacs, raw',
  'Citrus, sour oranges, juice, fresh',
  // Genuinely Japanese-named citrus cultivars -- grouped under their own
  // "Japanese" header, see components/FoodLookup.tsx's
  // JUICE_JAPAN_DISPLAY_LABELS.
  'Citrus, "Harumi", juice sacs, raw',
  'Citrus, "Hassaku", juice sacs, raw',
  'Citrus, "Hyuga-natsu", juice sacs, raw',
  'Citrus, "Iyo", juice sacs',
  'Citrus, "Kabosu", juice, fresh',
  'Citrus, "Kawachi-bankan", juice sacs, raw',
  'Citrus, "Kiyomi", juice sacs, raw',
  'Citrus, "Natsudaidai", juice sacs, raw',
  'Citrus, "Sanbokan", juice sacs, raw',
  'Citrus, "Setoka", juice sacs, raw',
  'Citrus, "Shiikuwasha", juice, fresh',
  'Citrus, "Shiranuhi", juice sacs, raw',
  'Citrus, "Sudachi", juice, fresh',
  'Citrus, "Yuzu", juice, fresh',
  'Oranges, Fukuhara-orange, juice sacs, raw',
  'Satsuma mandarins, juice sacs, early ripening type, raw',
  'Satsuma mandarins, juice sacs, normal ripening type, raw',
  'Satsuma mandarins, straight fruit juice',
  // 18 real, verified France_Ciqual entries added 2026-08-11, the same
  // real translation pass that discovered ~30 genuinely alcoholic
  // beverages sitting in Bev instead of Alcohol (see ALCOHOL_HIDDEN_
  // BASE_NAMES' own comment above for that separate finding). Each one
  // is real, unblended, not-from-concentrate, not-fortified juice --
  // "pur jus" (pure juice), "frais" (fresh), or "maison" (homemade) in
  // the original French -- matching this allowlist's own already-
  // established criteria exactly. Concentrate/blend/nectar/fortified/
  // salted-tomato-juice rows from the same France_Ciqual batch were
  // deliberately NOT added here, staying in subcategory 'Other' instead.
  'Carrot Juice, Pure Juice',
  'Lemon Juice, Homemade',
  'Orange Juice, Homemade',
  'Grape Juice, Pure Juice',
  'Pomegranate Juice, Pure Juice',
  'Mango Juice, Fresh',
  'Passion Fruit Juice, Fresh',
  'Grapefruit Juice, Homemade',
  'Grapefruit Juice, Pure Juice',
  'Lemon Juice, Pure Juice',
  'Lime Juice, Homemade',
  'Lime Juice, Pure Juice',
  'Clementine or Mandarin Juice, Pure Juice',
  'Pomegranate Juice, Fresh',
  'Orange Juice, Pure Juice',
  'Pineapple Juice, Pure Juice',
  'Apple Juice, Pure Juice',
  'Blood Orange Juice, Pure Juice',
]);

function buildScopeClause(category: string, subcategory: string | null, usdaOnly: boolean) {
  const params: (string | number)[] = [category];
  // 'hidden' column, 2026-08-04 -- see scripts/build_food_reference_db.py's
  // own apply_audit_decisions() comment for the full reasoning. A single
  // universal filter here, rather than extending the existing
  // ALCOHOL_HIDDEN_BASE_NAMES-style per-category hand-typed Set pattern to
  // the 8,000+-row scale the first real bulk import from the Reference
  // Database Audit tool needed -- every one of this function's own callers
  // (searchReferenceFoodNames, getPreparationMethods, resolveFoodChoice,
  // and the alias-resolution path) gets this for free from one change here.
  //
  // A 'needs_translation' column existed briefly, 2026-08-11 -- built to
  // hide untranslated Norway/Sweden/France_Ciqual rows from categories
  // that bypass the usdaOnly branch below (Mushroom, Alcohol,
  // PantryStaples, PastaNoodles, SaucesCondiments, CommercialPremade),
  // alongside a real, substantial hand-translation effort against those
  // three sources. Both were reverted the same day, per direct
  // instruction ("restore from the last back up from 8/10/2026. ONLY THE
  // APP database and structure") -- the separate Unified Whole-Foods
  // Database project (see CLAUDE.md's own "Standing directive, 2026-08-11")
  // will eventually replace this database's own untranslated rows properly,
  // so hand-translating the live one first was judged wasted effort.
  // assets/data/foods_reference.db was restored to its pre-translation
  // 2026-08-10 state, but this file wasn't touched at the same time
  // (`lib/db.ts` was deliberately left alone for two real, unrelated fixes
  // living here that same day), leaving this query referencing a column
  // the restored database no longer has -- confirmed directly via
  // `PRAGMA table_info(foods)`, and via the exact runtime crash this
  // caused ("no such column: needs_translation") once someone actually
  // browsed a category. Removed here to match the real, current, restored
  // schema. The untranslated-row-visibility problem this column was built
  // to fix is real and still open (Norway/Sweden/France_Ciqual rows can
  // still surface in Mushroom/Alcohol/etc.) -- worth a real, different fix
  // whenever this is picked back up, not a silent regression to ignore.
  let clause = 'category = ? AND hidden = 0';

  if (subcategory) {
    clause += ' AND subcategory = ?';
    params.push(subcategory);
  }

  if (usdaOnly) {
    // 'Derived' rows (see scripts/build_food_reference_db.py's
    // SYNTHETIC_SPIRIT_VARIANTS, 2026-08-02) are real USDA nutrient values
    // duplicated onto a handful of aged/unaged spirit variants no source
    // measures separately -- always included alongside USDA itself so the
    // default "USDA-only" scope some categories fall back to (see
    // hasUsdaCoverage below) doesn't hide them the same way it hides every
    // other non-USDA source.
    //
    // 2026-08-10: adding 'Norway_Matvaretabellen' here was tried and
    // deliberately reverted the same day. The real collision-risk check
    // (zero exact base_name matches against USDA across all 2,121
    // Norwegian entries) came back clean -- but a live query of the
    // actual result set surfaced the real, disqualifying problem this
    // check didn't catch: every one of those 2,121 names is genuinely in
    // Norwegian ("Agurk, norsk, rå" for cucumber, "And, kjøtt med skinn,
    // ovnsstekt" for duck), never translated during the same-day import
    // (that work only mapped categories/nutrients, not names). Direct
    // choice, given the option to ship as-is, hold off, or add a source
    // tag: hold off -- untranslated foreign text mixed into the app's own
    // primary English food-browsing experience would read as broken, not
    // international. Norway's real data stays fully imported and intact
    // in the database either way (see REFERENCE_DB_VERSION's own history
    // for the import itself); this is purely a visibility decision, safe
    // to revisit once a real name-translation pass is feasible (this
    // app's own already-documented i18n Phase 3/4, not yet started) or a
    // source-tag approach is built.
    clause += " AND source IN ('USDA', 'Derived')";
  }

  if (category === 'Alcohol' && ALCOHOL_HIDDEN_BASE_NAMES.size > 0) {
    clause += ` AND base_name NOT IN (${Array.from(ALCOHOL_HIDDEN_BASE_NAMES).map(() => '?').join(', ')})`;
    params.push(...ALCOHOL_HIDDEN_BASE_NAMES);
  }

  if (category === 'Bev' && subcategory === 'Juice') {
    clause += ` AND name IN (${Array.from(BEV_JUICE_ALLOWED_NAMES).map(() => '?').join(', ')})`;
    params.push(...BEV_JUICE_ALLOWED_NAMES);
  }

  return { clause, params };
}

// Lists distinct food names within a category (and type, if that category
// has one chosen) -- this is what populates the Food dropdown. Returns base
// names, not resolvable food rows yet: the same real food (e.g. "Spinach")
// exists once per national source that measured it, AND some sources (only
// Germany_BLS in practice, checked empirically) bake a cooking-state word
// into the name itself ("Broccoli raw" vs "Broccoli baked"), so a plain
// DISTINCT on name/short_name would still show near-duplicates. base_name
// (built by scripts/build_food_reference_db.py's split_prep_method) is
// stripped of that trailing cooking-state word -- getPreparationMethods
// below is what lets the person pick which prep-state row they actually
// mean, since raw vs. cooked genuinely changes nutrient content and this
// app's own scoring, so it's a meaningful choice, not just cosmetic noise
// to auto-collapse.
// 2026-08-11: no longer takes a usdaOnly param -- always queries the FULL
// candidate set (every visible source, hidden/curated-allowlist filtering
// still fully applied via buildScopeClause). Real,
// direct request: "for food selection in the builders, it should default
// to USDA (unless the user chooses one of the others) and then anything
// not available in the USDA dataset that exists in any of the other
// datasets will also be visible." The OLD usdaOnly=true default did the
// opposite -- it HID a food entirely from this list the moment its own
// category had ANY real USDA coverage, even for a specific food that
// itself had zero USDA representation (a category-level decision applied
// to food-level visibility). Safe to drop entirely at THIS level: this
// function already returns `SELECT DISTINCT base_name`, so a food
// measured by 5 different sources still shows exactly once here
// regardless -- the real "Spinach x7" concern this app's own
// resolveEffectiveUsdaOnly()/buildScopeClause() history is full of was
// never actually about duplicate PICKER ENTRIES (DISTINCT already
// prevented that), it was about which underlying row's real, possibly-
// different measured value silently won once resolved. That's now solved
// at the right layer -- resolveFoodChoice's own new USDA-preference
// tiebreaker, see its comment below -- not by hiding the option here.
// resolveEffectiveUsdaOnly/buildScopeClause's own usdaOnly=true path
// stays real and load-bearing for getStageFlagScoresForNames, which has a
// genuinely different job (checking every real variant of a name for a
// stage-relevant flag, not picking one to track) -- not touched here.
export async function searchReferenceFoodNames(category: string, subcategory: string | null, query = '', limit = 200) {
  const db = await getReferenceDatabase();
  const trimmed = query.trim();
  const { clause, params } = buildScopeClause(category, subcategory, false);

  let whereClause = clause;
  let orderByClause = 'base_name';
  const orderParams: string[] = [];

  if (trimmed) {
    // Plain LIKE is a literal substring match with zero whitespace
    // tolerance -- typing "seasalt" (no space) would never match "Sea
    // salt" otherwise, even though the food is right there. Also matching
    // against both sides with spaces stripped catches that case without
    // touching the real, spaced names actually stored/displayed.
    const collapsedQuery = trimmed.replace(/\s+/g, '');
    whereClause +=
      " AND (base_name LIKE ? OR name LIKE ? OR REPLACE(base_name, ' ', '') LIKE ? OR REPLACE(name, ' ', '') LIKE ?)";
    params.push(`%${trimmed}%`, `%${trimmed}%`, `%${collapsedQuery}%`, `%${collapsedQuery}%`);

    // Plain alphabetical order buries a match like "Broccoli, chinese" when
    // searching "chinese", since it only ranks by the full name -- typing
    // just the word after a comma looked broken unless you also typed the
    // word before it. Rank prefix matches, then "root, term" clause
    // matches, ahead of matches buried mid-word, before falling back to
    // alphabetical within each tier.
    orderByClause = `
      CASE
        WHEN base_name LIKE ? THEN 0
        WHEN base_name LIKE ? THEN 1
        ELSE 2
      END,
      base_name
    `;
    orderParams.push(`${trimmed}%`, `%, ${trimmed}%`);
  }

  params.push(...orderParams);

  // Only cap results once a search term is actively narrowing the list --
  // browsing unfiltered must return everything in scope. A flat LIMIT here
  // silently truncated the alphabetical list before: USDA-only Vegetables
  // alone has 256 distinct names, so anything from "Sweet potato" onward
  // (and all of "Yam") never reached the app under the old fixed 200 cap.
  const limitClause = trimmed ? 'LIMIT ?' : '';
  if (trimmed) {
    params.push(limit);
  }

  const rows = await db.getAllAsync<{ base_name: string }>(
    `
      SELECT DISTINCT base_name
      FROM foods
      WHERE ${whereClause} AND base_name IS NOT NULL
      ORDER BY ${orderByClause}
      ${limitClause}
    `,
    ...params,
  );

  const directNames = rows.map((row) => row.base_name);
  if (!trimmed) {
    return directNames;
  }

  // Bridges a genuine vocabulary gap the substring match above can't --
  // someone typing the everyday name they know a food by ("bell pepper",
  // "heavy cream") when the database only has a differently-worded name
  // for the identical food ("Red/Green/Yellow Bell Pepper", "Heavy Whipping
  // Cream"). See scripts/food_alias_data.py for how each alias was verified
  // real rather than guessed. A fresh buildScopeClause() call here (not the mutated
  // `params` above) keeps this query's params independent of the ORDER BY/
  // LIMIT params already appended to the first query.
  const collapsedQuery = trimmed.replace(/\s+/g, '');
  const aliasScope = buildScopeClause(category, subcategory, false);
  const aliasRows = await db.getAllAsync<{ base_name: string }>(
    `
      SELECT DISTINCT fa.base_name
      FROM food_aliases fa
      WHERE fa.food_category = ?
        AND (fa.alias LIKE ? OR REPLACE(fa.alias, ' ', '') LIKE ?)
        AND EXISTS (
          SELECT 1 FROM foods
          WHERE base_name = fa.base_name COLLATE NOCASE AND ${aliasScope.clause}
        )
    `,
    category, `%${trimmed}%`, `%${collapsedQuery}%`, ...aliasScope.params,
  );

  const directSet = new Set(directNames.map((name) => name.toLowerCase()));
  const aliasOnlyNames = aliasRows
    .map((row) => row.base_name)
    .filter((name) => !directSet.has(name.toLowerCase()));

  return [...directNames, ...aliasOnlyNames].slice(0, limit);
}

// What a cross-category name match resolves to -- unlike
// searchReferenceFoodNames' own plain base_name list (which only makes
// sense once a category is already picked), a real global search has to
// hand back WHICH category/subcategory a match actually lives in too,
// since that's exactly the information FoodLookup.tsx needs to jump its
// own Category/Type steps straight to "already answered" instead of
// making a person pick them by hand.
export type GlobalFoodMatch = { category: string; subcategory: string | null; baseName: string };

// A real, genuinely cross-category name search, 2026-08-16 -- built
// specifically for voice food-finding ("say broccoli, it finds it"),
// since buildScopeClause() (the function every OTHER lookup in this file
// goes through) hard-requires exactly one category, with no way to pass
// through a wildcard. Mirrors searchReferenceFoodNames' own real
// matching/ranking/alias logic (substring + whitespace-collapsed
// substring, prefix-then-comma-clause-then-substring ranking, a real
// food_aliases bridge for everyday names the database itself doesn't
// use) rather than reusing that function directly, since its own
// category-scoped WHERE clause can't be safely widened without risking a
// regression to the picker-driven callers that already depend on it
// staying scoped.
export async function searchReferenceFoodNamesAcrossCategories(
  query: string,
  allowedCategories?: string[],
  limit = 15,
): Promise<GlobalFoodMatch[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const db = await getReferenceDatabase();
  const collapsedQuery = trimmed.replace(/\s+/g, '');

  const categoryFilter = allowedCategories && allowedCategories.length > 0 ? ` AND category IN (${allowedCategories.map(() => '?').join(',')})` : '';
  const categoryParams = allowedCategories && allowedCategories.length > 0 ? allowedCategories : [];

  // getReferenceCategories() already excludes CATEGORIES_HIDDEN_FROM_
  // BROWSING (CommercialPremade, Baked) from the picker's own Category
  // step -- confirmed by direct query this function would otherwise leak
  // one straight past it (a real "Broccoli casserole" surfacing from
  // CommercialPremade for a plain "broccoli" search). Built from the same
  // shared Set rather than a second, hand-typed copy of the category
  // names, so this can't silently drift if that Set ever changes.
  const hiddenCategoryList = Array.from(CATEGORIES_HIDDEN_FROM_BROWSING);
  const hiddenCategoryFilter = ` AND category NOT IN (${hiddenCategoryList.map(() => '?').join(',')})`;

  // A real, easy-to-miss trap, caught by direct query before trusting this
  // function: several categories (Meat, Veg, Fruit, Dairy, Bev, Fats,
  // Alcohol, NutSeed) genuinely mix rows that carry a real subcategory with
  // rows that don't -- and buildScopeClause's own "AND subcategory = ?"
  // filter means a null-subcategory row in one of THOSE categories is
  // already unreachable through the normal manual Category->Type->Food
  // flow (picking any real subcategory excludes it; the app's own
  // categoryConfirmed gate never lets someone browse with subcategory left
  // null once the category has real ones to choose from). Without this
  // same guard here, voice search could resolve to a food the manual
  // picker can never actually reach, landing selectGlobalMatch's own
  // (category, subcategory: null) pick in a permanently-unconfirmable
  // state. A category with NO real subcategories at all (Grain,
  // PantryStaples, Mushroom, etc.) is untouched by this -- its own
  // null-subcategory rows were always fully reachable.
  const directRows = await db.getAllAsync<{ category: string; subcategory: string | null; base_name: string }>(
    `
      SELECT DISTINCT category, subcategory, base_name
      FROM foods
      WHERE hidden = 0${categoryFilter}${hiddenCategoryFilter}
        AND base_name IS NOT NULL
        AND (base_name LIKE ? OR name LIKE ? OR REPLACE(base_name, ' ', '') LIKE ? OR REPLACE(name, ' ', '') LIKE ?)
        AND (
          subcategory IS NOT NULL
          OR category NOT IN (SELECT DISTINCT category FROM foods WHERE subcategory IS NOT NULL AND hidden = 0)
        )
      ORDER BY
        CASE
          WHEN base_name LIKE ? THEN 0
          WHEN base_name LIKE ? THEN 1
          ELSE 2
        END,
        base_name
      LIMIT ?
    `,
    ...categoryParams,
    ...hiddenCategoryList,
    `%${trimmed}%`,
    `%${trimmed}%`,
    `%${collapsedQuery}%`,
    `%${collapsedQuery}%`,
    `${trimmed}%`,
    `%, ${trimmed}%`,
    limit,
  );

  // food_aliases only stores food_category, not subcategory -- a real
  // JOIN back into foods (not just an EXISTS check the way
  // searchReferenceFoodNames' own single-category version can get away
  // with) is what actually recovers the real subcategory a matched alias
  // resolves to.
  const aliasRows = await db.getAllAsync<{ category: string; subcategory: string | null; base_name: string }>(
    `
      SELECT DISTINCT f.category, f.subcategory, f.base_name
      FROM food_aliases fa
      JOIN foods f ON f.base_name = fa.base_name COLLATE NOCASE AND f.category = fa.food_category
      WHERE f.hidden = 0${categoryFilter.replace(/category/g, 'f.category')}${hiddenCategoryFilter.replace(/category/g, 'f.category')}
        AND (fa.alias LIKE ? OR REPLACE(fa.alias, ' ', '') LIKE ?)
        AND (
          f.subcategory IS NOT NULL
          OR f.category NOT IN (SELECT DISTINCT category FROM foods WHERE subcategory IS NOT NULL AND hidden = 0)
        )
      LIMIT ?
    `,
    ...categoryParams,
    ...hiddenCategoryList,
    `%${trimmed}%`,
    `%${collapsedQuery}%`,
    limit,
  );

  const seen = new Set<string>();
  const results: GlobalFoodMatch[] = [];
  for (const row of [...directRows, ...aliasRows]) {
    const key = `${row.category}|${row.subcategory ?? ''}|${row.base_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ category: row.category, subcategory: row.subcategory, baseName: row.base_name });
    if (results.length >= limit) break;
  }
  return results;
}

// Real, distinct cooking states available for one chosen food name. Returns
// [] when there's nothing to disambiguate (the common case) -- the app
// should skip the Preparation step entirely in that case, same pattern as
// the Type step being skipped for categories with no sub-categories.
// 2026-08-11: no longer takes a usdaOnly param -- same reasoning as
// searchReferenceFoodNames just above. This query already collapses to
// `SELECT DISTINCT` prep_method STRINGS, so two sources both measuring
// "Raw" for the same food still show one "Raw" option here, not two --
// dropping the USDA-only restriction widens which real prep states are
// offered (a food only measured cooked in a non-USDA source now shows
// that option) without reintroducing any picker-level duplication.
export async function getPreparationMethods(category: string, subcategory: string | null, baseName: string) {
  const db = await getReferenceDatabase();
  const { clause, params } = buildScopeClause(category, subcategory, false);

  const rows = await db.getAllAsync<{ prep: string }>(
    `
      SELECT DISTINCT COALESCE(prep_method, 'Standard') AS prep
      FROM foods
      WHERE ${clause} AND base_name = ?
      ORDER BY prep
    `,
    ...params,
    baseName,
  );

  const methods = rows.map((row) => row.prep);
  // A single distinct prep_method is still a real answer worth resolving
  // to -- Garlic's only USDA row is tagged 'Raw', Chia Seeds' only USDA row
  // is tagged 'Dried'. Unconditionally collapsing every length-1 result to
  // [] (as this used to do) threw that one real value away entirely: the
  // caller (FoodLookup.tsx) had no way to learn what it was, defaulted to
  // null, and resolveFoodChoice's null -> 'Standard' fallback only matches
  // a genuinely untagged (prep_method IS NULL) row -- which doesn't exist
  // for either of these foods, so resolution silently failed. Real bug,
  // confirmed 2026-08-02: reported as "the food doesn't come up in the
  // pending ingredient card" for garlic/bacon/chia seeds specifically,
  // while multi-prep foods (asparagus, snap beans) worked fine, which is
  // exactly this split -- multi-prep foods never hit this collapsed path.
  // Only still collapse to [] when the single value IS the NULL sentinel
  // ('Standard') -- a food with no prep_method tagged at all genuinely has
  // nothing to resolve or show a picker for.
  return methods.length > 1 ? methods : methods[0] === 'Standard' ? [] : methods;
}

// Resolves a chosen (category, type, food name, prep method) combination
// down to one real, scoreable food row. If more than one source measured
// the exact same food at the exact same prep state, prefers a row whose
// own name says it's unsalted/no-salt-added over one that says salted --
// 2026-08-01, explicitly requested alongside FoodLookup's own Raw default
// (see that file's own comment): prep_method alone doesn't capture added
// salt (e.g. Broccoli's two "Boiled" rows are "...with salt" and "...
// without salt", not distinguished by prep_method at all), so without
// this, which one won was purely an accident of which food_id happened to
// be lower. Foods with no salt-related wording either way (most raw
// produce) are unaffected -- they were never salted vs. unsalted VARIANTS
// of the same row to begin with, just one plain entry. Only after that:
// deterministically keeps the lowest food_id, same as before -- at this
// point category/type/name/prep(/salt) are all already fixed, so any
// remaining rows really are the same real food, just redundantly measured.
// Real, national-agency sources this app treats as "the default reference
// standard" for a builder's own food selection -- USDA itself, plus
// 'Derived' (real USDA nutrient figures duplicated onto a few aged/unaged
// spirit variants no source measures separately, see build_food_reference_
// db.py's own SYNTHETIC_SPIRIT_VARIANTS -- these are USDA data in every
// real sense, just not stored under that literal source string).
const USDA_PREFERRED_SOURCES = new Set(['USDA', 'Derived']);

export function isFallbackSource(source: string): boolean {
  return !USDA_PREFERRED_SOURCES.has(source);
}

// 2026-08-11, a real, direct requirement, restated in full since it
// reshaped this whole function: "for food selection in the builders, it
// should default to USDA (unless the user chooses one of the others) and
// then anything not available in the USDA dataset that exists in any of
// the other datasets will also be visible and noted that it comes from
// another list and it is not within the USDA data." No longer takes a
// usdaOnly param -- the OLD version either hid every non-USDA row outright
// (usdaOnly=true, the old default) or showed everything with no
// preference at all (usdaOnly=false, the category-level bypasses) --
// neither matches "prefer USDA, but still surface and label a real
// fallback for a SPECIFIC food/prep-state USDA doesn't have." Now always
// queries the full candidate set (buildScopeClause(..., false), same
// hidden/curated-allowlist filtering as before) and
// adds ONE new, highest-priority ORDER BY tier: a real USDA/Derived row
// always wins over any other source for the same (base_name, prep_method)
// combination, regardless of which food_id is lower -- the existing salt-
// preference and food_id tiebreakers only ever decide BETWEEN rows
// already in the same tier (two USDA-preferred rows, or -- for a food
// with no USDA representation at all -- two non-USDA rows), the same
// "prefer the RIGHT tier outright, only compare amounts/ids within a tier"
// shape already proven for rankFoodsByNutrient's own Raw-vs-Dried fix.
// The caller finds out a fallback happened via the real, already-returned
// `source` field -- see isFallbackSource() above -- no new return shape
// needed; every caller (FoodLookup.tsx, and everything downstream of it:
// all eleven Food builders, Insights' own Food Lookup lens) already reads
// `.source` off the resolved selection.
export async function resolveFoodChoice(category: string, subcategory: string | null, baseName: string, prepMethod: string | null) {
  const db = await getReferenceDatabase();
  const { clause, params } = buildScopeClause(category, subcategory, false);
  const normalizedPrep = prepMethod || 'Standard';

  const row = await db.getFirstAsync<{ food_id: number; source: string; name: string; short_name: string | null; category: string }>(
    `
      SELECT food_id, source, name, short_name, category
      FROM foods
      WHERE ${clause} AND base_name = ?
        AND COALESCE(prep_method, 'Standard') = ?
      ORDER BY
        CASE WHEN source IN ('USDA', 'Derived') THEN 0 ELSE 1 END,
        CASE
          WHEN name LIKE '%without salt%' OR name LIKE '%no salt added%' OR name LIKE '%unsalted%' THEN 0
          WHEN name LIKE '%with salt%' OR name LIKE '%salted%' THEN 2
          ELSE 1
        END,
        food_id
      LIMIT 1
    `,
    ...params,
    baseName,
    normalizedPrep,
  );

  return row ? toFoodOption(row) : null;
}

// --- Curated starter recipes (2026-08-09) ----------------------------------
//
// A real, app-authored library of pre-built recipes selectable inside Salad
// and Smoothie Builder, rather than only building from scratch -- direct
// request: "sort of how the NutriBullet Rx provides with their unit...
// These special recipes can exist already into the app to select so they
// don't actually have to be built." Bundled reference-database content
// (curated_recipes/curated_recipe_ingredients, seeded the same way
// common_medications/supplement_forms were), NOT the user's own local
// `favorites` table -- these are app content, not something a person
// created, and shouldn't get mixed into or deletable from their own real
// favorites list.
//
// Each ingredient row stores a plain (category, base_name) pair, not a
// hardcoded foodId/source -- a future reference-database rebuild can
// renumber food_id values, and a recipe built on a stored numeric id could
// silently start pointing at the wrong row (or none at all) after that. A
// name-based lookup, resolved fresh every time a recipe is actually opened,
// is the same "base_name is the stable identity, food_id can shift"
// discipline this whole reference database is already built on.
export type CuratedRecipeSummary = {
  id: string;
  name: string;
  flavorProfile: string;
  healthBenefit: string;
};

// Widened 2026-08-14 from the original 'salad' | 'smoothie' literal to the
// real, already-exported BuilderFavoriteItemType union -- curated recipes
// now span all 10 direct-ingredient builders, not just the first two this
// feature originally shipped with.
export async function listCuratedRecipes(builderType: BuilderFavoriteItemType): Promise<CuratedRecipeSummary[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ id: string; name: string; flavor_profile: string; health_benefit: string }>(
    'SELECT id, name, flavor_profile, health_benefit FROM curated_recipes WHERE builder_type = ? ORDER BY sort_order',
    builderType,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    flavorProfile: row.flavor_profile,
    healthBenefit: row.health_benefit,
  }));
}

// Resolves one curated-recipe ingredient's (category, base_name) to a real,
// currently-visible food_id/source -- tries 'Raw' first (the common case
// for whole produce), falls back to the untagged 'Standard' row (most
// pantry items -- olive oil, honey, ground spices -- have exactly one row
// with no prep_method tag at all), then broadens past USDA-only scoping for
// either attempt in case a category defaults to USDA-only but the specific
// ingredient only exists under a different real source. Returns null (the
// ingredient is silently skipped by getCuratedRecipe below, not a crash) if
// every one of those genuinely finds nothing -- shouldn't happen given every
// real ingredient here was individually verified against the live database
// before being written in, but a future hide of one specific row shouldn't
// break the whole recipe for the other ingredients still fine.
// 2026-08-11: the real true/false usdaOnly pairs this used to try are gone
// -- resolveFoodChoice itself no longer takes that param, it always
// searches the full candidate set with USDA preferred internally (see its
// own comment), so a separate "broaden past USDA-only" retry is no longer
// a real, different query. Down to the two genuinely different attempts:
// try 'Raw' first, then the untagged 'Standard' sentinel.
async function resolveCuratedRecipeIngredient(category: string, baseName: string) {
  const viaKnownPrep =
    (await resolveFoodChoice(category, null, baseName, 'Raw')) ?? (await resolveFoodChoice(category, null, baseName, null));
  if (viaKnownPrep) return viaKnownPrep;

  // A real, found-not-guessed gap: several whole-food ingredients (Quinoa,
  // Chickpea, Oregano, confirmed via direct query before this fallback was
  // added) don't carry either a 'Raw' or an untagged prep_method row at
  // all in this database -- their only real row is tagged something else
  // entirely ('Cooked', 'Dried'). Rather than hand-enumerate every real
  // prep_method value per ingredient, this final step picks any visible
  // row for the (category, base_name) pair, regardless of prep tag --
  // every real ingredient across every curated recipe was already
  // confirmed to have at least one visible row before being written in
  // (see curated_recipes.sql's own header comment), so this only ever
  // matters for the "not Raw, not untagged" case, never a genuine miss.
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<{ food_id: number; source: string; name: string; short_name: string | null; category: string }>(
    `SELECT food_id, source, name, short_name, category FROM foods
     WHERE category = ? AND base_name = ? AND hidden = 0
     ORDER BY CASE WHEN source IN ('USDA', 'Derived') THEN 0 ELSE 1 END, food_id
     LIMIT 1`,
    category,
    baseName,
  );
  return row ? toFoodOption(row) : null;
}

export async function getCuratedRecipe(
  id: string,
): Promise<(BuilderFavoritePayload & { id: string; flavorProfile: string; healthBenefit: string }) | null> {
  const db = await getReferenceDatabase();
  const recipe = await db.getFirstAsync<{
    name: string;
    flavor_profile: string;
    health_benefit: string;
    servings: number;
    serving_size_amount: number;
    serving_size_unit: string;
  }>(
    'SELECT name, flavor_profile, health_benefit, servings, serving_size_amount, serving_size_unit FROM curated_recipes WHERE id = ?',
    id,
  );
  if (!recipe) return null;

  const ingredientRows = await db.getAllAsync<{
    category: string;
    base_name: string;
    quantity: number;
    unit: string;
    cut_prep: string | null;
    cooking_method: string | null;
    prep_note: string | null;
  }>(
    'SELECT category, base_name, quantity, unit, cut_prep, cooking_method, prep_note FROM curated_recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order',
    id,
  );

  const ingredients: BuilderFavoriteIngredient[] = [];
  for (const row of ingredientRows) {
    const resolved = await resolveCuratedRecipeIngredient(row.category, row.base_name);
    if (!resolved) continue;
    ingredients.push({
      foodId: resolved.foodId,
      source: resolved.source,
      foodName: resolved.shortName ?? row.base_name,
      category: resolved.category,
      quantity: row.quantity,
      unit: row.unit,
      cutPrep: row.cut_prep ?? 'N/A',
      cookingMethod: row.cooking_method ?? 'N/A',
      prepNote: row.prep_note ?? undefined,
    });
  }

  return {
    id,
    name: recipe.name,
    flavorProfile: recipe.flavor_profile,
    healthBenefit: recipe.health_benefit,
    servings: recipe.servings,
    servingSizeAmount: recipe.serving_size_amount,
    servingSizeUnit: recipe.serving_size_unit,
    ingredients,
  };
}

// 2026-08-25, built for the new Daily Meal Plan generator (lib/
// dailyMealPlan.ts): real, live nutrient totals for one curated recipe as
// prepared, reusing resolveIngredientNutrientTotals/addNutrientTotalsInto
// (below, in the nutrient-totals section of this file) exactly as-is --
// the same pipeline Trends already uses for a logged or scheduled meal's
// real totals, not a separate, newly-written computation that could
// silently disagree with what those screens already show. Computed live
// against the reference database every time, never pre-baked into
// recipes.ts, so it can never drift from what getCuratedRecipe itself
// would resolve if the reference data changes later.
//
// Every one of the 300 curated recipes was already rescaled to a single
// person's own one serving (2026-08-24 status entry), so recipe.servings
// is 1 for virtually all of them -- dishServings/yourSharePercent are
// still passed through for real correctness on the rare recipe where
// that isn't true, rather than assuming it always is.
export async function getCuratedRecipeNutrientTotals(curatedRecipeId: string): Promise<Record<string, number> | null> {
  const recipe = await getCuratedRecipe(curatedRecipeId);
  if (!recipe || recipe.ingredients.length === 0) return null;
  const caches = createIngredientResolutionCaches();
  const totals: Record<string, number> = {};
  let resolvedAny = false;
  for (const ingredient of recipe.ingredients) {
    const itemTotals = await resolveIngredientNutrientTotals(
      {
        foodId: `${ingredient.foodId}|${ingredient.source}`,
        category: ingredient.category,
        rawAmount: ingredient.quantity,
        rawUnit: ingredient.unit,
        quantityMultiplier: 1,
        dishServings: recipe.servings,
      },
      caches,
    );
    if (itemTotals) {
      addNutrientTotalsInto(totals, itemTotals);
      resolvedAny = true;
    }
  }
  return resolvedAny ? totals : null;
}

// 2026-08-25, direct request: "without sugars being used in breakfast."
// A real, structural check rather than a total-sugar-gram threshold --
// every curated recipe that adds honey, maple syrup, or granulated sugar
// as an actual ingredient uses the reference database's own real
// 'Sweets' category for it (confirmed by direct query against every
// curated_recipe_ingredients row already using it: "Maple syrup",
// "Standard Honey (Blossom Honey)", "Sugar (Cane / Granulated)", and so
// on), so this asks the one question that actually matters -- was a
// sweetener deliberately added -- without also penalizing a recipe whose
// only sugar is what naturally comes from real fruit already in it
// (already this app's own standing distinction, see the chrononutrition
// 6-Week Meal Plan work: "a small amount of real honey next to a large
// amount of whole fruit isn't the processed 'hidden sugar' the research
// is actually warning against").
export async function curatedRecipeContainsSweetenerIngredient(curatedRecipeId: string): Promise<boolean> {
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM curated_recipe_ingredients WHERE recipe_id = ? AND category = 'Sweets'",
    curatedRecipeId,
  );
  return (row?.count ?? 0) > 0;
}

// 2026-08-25, built for the Daily Meal Plan generator's own new frequency
// rules (fish at least twice a week, red meat capped -- lib/
// dailyMealPlan.ts). Deliberately checks an explicit, verified base_name
// list rather than the reference database's own real `foods.subcategory`
// column -- checked directly first, and rejected: real salmon rows (both
// 'Salmon Fillet (Raw)' variants, the only salmon this app's own curated
// recipes actually use) carry subcategory 'Meat & Poultry', not 'Fish &
// Seafood', a real, confirmed data-quality inconsistency in the
// reference database that would have silently missed this app's own
// most commonly used fish. curatedRecipeContainsAnyIngredient below
// checks a plain base_name allowlist instead, built the same way
// BREAKFAST_ELIGIBLE_RECIPE_IDS was: every one of the 24 real, distinct
// 'Meat'-category base_names actually used anywhere across all 300
// curated recipes was pulled by direct query and individually
// classified by hand (lib/dailyMealPlan.ts's own FISH_SEAFOOD_BASE_NAMES/
// RED_MEAT_BASE_NAMES), not guessed or trusted from this one column.
export async function curatedRecipeContainsAnyIngredient(curatedRecipeId: string, category: string, baseNames: string[]): Promise<boolean> {
  if (baseNames.length === 0) return false;
  const db = await getReferenceDatabase();
  const placeholders = baseNames.map(() => '?').join(', ');
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM curated_recipe_ingredients WHERE recipe_id = ? AND category = ? AND base_name IN (${placeholders})`,
    curatedRecipeId,
    category,
    ...baseNames,
  );
  return (row?.count ?? 0) > 0;
}

// Fetches the curated recipe strains a real curated fermentation recipe
// declares it uses (see curated_recipe_strains just below) -- a real,
// separate lookup from getCuratedRecipe's own ingredient resolution, since
// a strain isn't a food and doesn't go through resolveCuratedRecipeIngredient
// at all.
export async function getCuratedRecipeStrainIds(recipeId: string): Promise<string[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ strain_id: string }>(
    'SELECT strain_id FROM curated_recipe_strains WHERE recipe_id = ?',
    recipeId,
  );
  return rows.map((row) => row.strain_id);
}

// --- Real, specific bacterial-strain tracking (2026-08-14) ----------------
//
// Two real layers, matching this app's own already-established
// reference-vs-local split (see this file's own initializeDatabase() for
// fermentation_batch_strains, the local-only half): fermentation_strains
// is a real, small, bundled reference catalog (scripts/add_fermentation_
// strains.py -- 7 real strains, every one reused directly from already-
// published, already-cited Digest content, zero new research done
// here), and fermentation_batch_strains links a real, saved fermentation
// batch to whichever of those real strains a person actually used.
export type FermentationStrain = {
  id: string;
  scientificName: string;
  commonName: string | null;
  category: string | null;
  description: string;
  digestEntryId: string | null;
};

function toFermentationStrain(row: {
  id: string;
  scientific_name: string;
  common_name: string | null;
  category: string | null;
  description: string;
  digest_entry_id: string | null;
}): FermentationStrain {
  return {
    id: row.id,
    scientificName: row.scientific_name,
    commonName: row.common_name,
    category: row.category,
    description: row.description,
    digestEntryId: row.digest_entry_id,
  };
}

export async function listFermentationStrains(): Promise<FermentationStrain[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    scientific_name: string;
    common_name: string | null;
    category: string | null;
    description: string;
    digest_entry_id: string | null;
  }>('SELECT id, scientific_name, common_name, category, description, digest_entry_id FROM fermentation_strains ORDER BY scientific_name');
  return rows.map(toFermentationStrain);
}

export async function getFermentationStrain(id: string): Promise<FermentationStrain | null> {
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    scientific_name: string;
    common_name: string | null;
    category: string | null;
    description: string;
    digest_entry_id: string | null;
  }>('SELECT id, scientific_name, common_name, category, description, digest_entry_id FROM fermentation_strains WHERE id = ?', id);
  return row ? toFermentationStrain(row) : null;
}

// A real delete-then-insert replace, matching replaceMealItems's own
// already-established pattern -- the whole real strain list for one
// fermentation batch is always set at once (from a multi-select picker),
// never appended one at a time, so there's no reason for a more granular
// add/remove pair.
export async function setFermentationBatchStrains(fermentationId: string, strainIds: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM fermentation_batch_strains WHERE fermentation_id = ?', fermentationId);
  for (let i = 0; i < strainIds.length; i++) {
    await db.runAsync(
      'INSERT INTO fermentation_batch_strains (id, fermentation_id, strain_id) VALUES (?, ?, ?)',
      `fbs_${Date.now()}_${i}`,
      fermentationId,
      strainIds[i],
    );
  }
}

export async function getFermentationBatchStrains(fermentationId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ strain_id: string }>(
    'SELECT strain_id FROM fermentation_batch_strains WHERE fermentation_id = ?',
    fermentationId,
  );
  return rows.map((row) => row.strain_id);
}

// Used by getDailyNutrientAnalysis to resolve a volume unit (e.g. "cup")
// to a density class via lib/unitConversion.ts's category table -- category
// isn't stored redundantly on meal_items, it's re-derived from the food's
// own row on demand.
export async function getFoodCategory(foodId: number, source: string) {
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<{ category: string }>(
    'SELECT category FROM foods WHERE food_id = ? AND source = ?',
    foodId,
    source,
  );
  return row?.category ?? null;
}

export type FoodUnitWeight = {
  unitLabel: string;
  gramsPerUnit: number;
  citation: string;
};

// "How much does one of these weigh" for the (deliberately small, common-
// foods-only) set of items covered in food_unit_weights -- what makes the
// meal builder's "each" unit ("4 eggs") convertible to grams for the
// nutrient analysis. Matches by the food's own base_name, not a keyword
// search, so a composite dish that merely mentions "egg" in its name never
// gets misattributed a plain egg's weight. Returns null for the (currently
// large) majority of foods this doesn't cover yet -- callers should treat
// that as "not supported yet," not "this food weighs nothing."
export async function getFoodUnitWeight(foodId: number, source: string): Promise<FoodUnitWeight | null> {
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<{ unitLabel: string; gramsPerUnit: number; citation: string }>(
    `
      SELECT fuw.unit_label AS unitLabel, fuw.grams_per_unit AS gramsPerUnit, fuw.citation
      FROM foods f
      JOIN food_unit_weights fuw ON fuw.base_name = f.base_name
      WHERE f.food_id = ? AND f.source = ?
      LIMIT 1
    `,
    foodId,
    source,
  );
  return row ?? null;
}

export async function getFoodScores(foodId: number, source: string) {
  const db = await getReferenceDatabase();
  return db.getAllAsync<FoodScore>(
    `
      SELECT sc.dimension AS dimension, sc.sub_criterion AS subCriterion, fs.tier AS tier
      FROM food_scores fs
      JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
      WHERE fs.food_id = ? AND fs.source = ?
      ORDER BY sc.dimension, sc.sub_criterion
    `,
    foodId,
    source,
  );
}

// A real, bulk-scoped sibling to getFoodScores above -- 2026-08-16, built
// for the exact same reason as getPrimaryNutrientAmountsBulk below it
// (Insights' own daily breakdown functions calling this once per DISTINCT
// food in a plain sequential loop, confirmed via real device logs to be
// the actual dominant cost, not the meal_items query itself). getFoodScores'
// own query has no sibling-fallback complexity to replicate -- a single
// bulk fetch scoped to every distinct (foodId, source) pair needed for the
// whole day, grouped back into a real per-food map afterward.
async function getFoodScoresBulk(pairs: { foodId: number; source: string }[]): Promise<Map<string, FoodScore[]>> {
  const result = new Map<string, FoodScore[]>();
  if (pairs.length === 0) return result;
  const db = await getReferenceDatabase();
  const placeholders = pairs.map(() => '(?, ?)').join(', ');
  const params = pairs.flatMap((p) => [p.foodId, p.source]);
  const rows = await db.getAllAsync<{ foodId: number; source: string; dimension: string; subCriterion: string; tier: string }>(
    `
      SELECT fs.food_id AS foodId, fs.source AS source, sc.dimension AS dimension, sc.sub_criterion AS subCriterion, fs.tier AS tier
      FROM food_scores fs
      JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
      WHERE (fs.food_id, fs.source) IN (${placeholders})
      ORDER BY sc.dimension, sc.sub_criterion
    `,
    ...params,
  );
  for (const row of rows) {
    const key = `${row.foodId}|${row.source}`;
    if (!result.has(key)) result.set(key, []);
    result.get(key)!.push({ dimension: row.dimension, subCriterion: row.subCriterion, tier: row.tier });
  }
  return result;
}

// The real, small, fixed set of sub-criteria referenced by ANY condition's
// own stage-advisory function -- built for the Healing Stages feature's own
// REORDERING half (2026-08-09, see lib/foodStageReordering.ts), the
// explicitly deferred second half of the 2026-07-31 decision ("stage-
// appropriate foods surface first in the pickers"). Hand-maintained here
// since the six advisory files (lib/healingStageAdvisory.ts,
// lib/ibsPhaseAdvisory.ts, lib/celiacStageAdvisory.ts,
// lib/ibdStageAdvisory.ts, lib/ckdStageAdvisory.ts,
// lib/goutStageAdvisory.ts) are otherwise independent, with no single
// shared list of what they each check -- a future advisory referencing a
// new sub-criterion needs to add it here too, or getStageFlagScoresForNames
// below silently won't fetch it, and reordering (though never the tap-to-
// explain advisory itself, which reads real per-food scores directly) will
// quietly miss that one real reason. Deliberately small and stable: each
// entry requires real, verified evidence to add in the first place, the
// same discipline as every stage advisory itself.
const STAGE_ADVISORY_SUB_CRITERIA = [
  'Gluten',
  'Goitrogenic Load',
  'Common Elimination-Diet Trigger Food',
  'Additives',
  'Processing',
  'Excess Fiber or Anti-Nutrients',
  'Irritants',
  'Protein Density',
];

// Bulk equivalent of getFoodScores() above, scoped to a real category/
// subcategory and a specific list of base_names -- the exact names a food
// picker is about to render -- rather than one query per food (a real N+1
// risk for a category with hundreds of names). Built for the Healing
// Stages reordering feature; not used by the tap-to-explain advisory
// itself, which still reads a single resolved food's own real scores via
// getFoodScores directly.
//
// Returns, per base_name, one FoodScore[] array PER DISTINCT (food_id,
// source) row that name resolves to within the given scope -- a base_name
// can carry more than one real row (raw vs. cooked, different national
// sources), and each one can carry a genuinely different real tier (e.g.
// raw broccoli triggers Hashimoto's own Goitrogenic Load flag, cooked
// broccoli doesn't) -- see lib/foodStageReordering.ts for how these
// variants get combined into one real per-name decision.
//
// Deliberately two real, separate queries rather than one JOIN: this
// app's own buildScopeClause() produces a WHERE clause written against
// BARE, unqualified column names (category, hidden, subcategory, source,
// base_name, name) -- and food_scores also has its own `source` column,
// so joining foods to food_scores in the same query would make any
// unqualified `source` reference genuinely ambiguous to SQLite. Resolving
// the real (food_id, source) rows first, then fetching their scores by
// food_id in a second query (re-validated against the real, resolved
// (food_id, source) pairs before being attributed to a name, since
// food_id alone isn't unique across sources), avoids that risk entirely
// without needing to touch buildScopeClause's own already-widely-used
// output format.
export async function getStageFlagScoresForNames(
  category: string,
  subcategory: string | null,
  baseNames: string[],
  usdaOnly = true,
): Promise<Record<string, FoodScore[][]>> {
  if (baseNames.length === 0) return {};

  const db = await getReferenceDatabase();
  const effectiveUsdaOnly = await resolveEffectiveUsdaOnly(category, subcategory, usdaOnly);
  const { clause, params } = buildScopeClause(category, subcategory, effectiveUsdaOnly);
  const namePlaceholders = baseNames.map(() => '?').join(', ');

  const resolvedRows = await db.getAllAsync<{ food_id: number; source: string; base_name: string }>(
    `
      SELECT food_id, source, base_name
      FROM foods
      WHERE ${clause} AND base_name IN (${namePlaceholders})
    `,
    ...params,
    ...baseNames,
  );

  if (resolvedRows.length === 0) return {};

  const foodIds = [...new Set(resolvedRows.map((row) => row.food_id))];
  const idPlaceholders = foodIds.map(() => '?').join(', ');
  const subCriterionPlaceholders = STAGE_ADVISORY_SUB_CRITERIA.map(() => '?').join(', ');

  const scoreRows = await db.getAllAsync<{
    food_id: number;
    source: string;
    dimension: string;
    subCriterion: string;
    tier: string;
  }>(
    `
      SELECT fs.food_id AS food_id, fs.source AS source, sc.dimension AS dimension, sc.sub_criterion AS subCriterion, fs.tier AS tier
      FROM food_scores fs
      JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
      WHERE fs.food_id IN (${idPlaceholders}) AND sc.sub_criterion IN (${subCriterionPlaceholders})
    `,
    ...foodIds,
    ...STAGE_ADVISORY_SUB_CRITERIA,
  );

  // food_id alone isn't the real key (source is, alongside it) -- only
  // attribute a scoreRow to a resolved row whose exact (food_id, source)
  // pair genuinely appeared in this real scope.
  const validPairs = new Set(resolvedRows.map((row) => `${row.food_id}|${row.source}`));
  const scoresByPair = new Map<string, FoodScore[]>();
  for (const row of scoreRows) {
    const pairKey = `${row.food_id}|${row.source}`;
    if (!validPairs.has(pairKey)) continue;
    const scores = scoresByPair.get(pairKey) ?? [];
    scores.push({ dimension: row.dimension, subCriterion: row.subCriterion, tier: row.tier });
    scoresByPair.set(pairKey, scores);
  }

  const result: Record<string, FoodScore[][]> = {};
  for (const row of resolvedRows) {
    const scores = scoresByPair.get(`${row.food_id}|${row.source}`);
    // A real, resolvable row with none of the 8 tracked sub-criteria
    // scored -- nothing to flag for this specific variant, so it's left
    // out of the list rather than added as an empty array (an empty
    // FoodScore[] would otherwise get passed to getConditionStageAdvisory
    // just like a real, checked-and-clean row -- harmless either way
    // since it correctly produces no advisory, but omitting it keeps the
    // list honest about which variants were actually checked).
    if (!scores) continue;
    const list = result[row.base_name] ?? (result[row.base_name] = []);
    list.push(scores);
  }
  return result;
}

// Condition-aware food scoring, added for the multi-autoimmune expansion (Rheumatoid
// Arthritis is the first condition built out this way, 2026-08-08 -- see CLAUDE.md's
// own Status entry for the full reasoning). This is a genuinely additive layer, not a
// replacement: getFoodScores() above and all 11 get*SixDimensionsBreakdown functions
// throughout this file are untouched and keep reading Hashimoto's own 25 sub-criteria
// exactly as before. A condition's own "6-DFF-equivalent" score draws from two real
// sources rather than needing a from-scratch re-score of all 22,022 foods:
//   1. Sub-criteria this condition owns outright (sub_criteria.home_condition_code),
//      e.g. RA's own "Common Elimination-Diet Trigger Food".
//   2. Existing sub-criteria (usually Hashimoto's own) that real research confirms are
//      chemically/scientifically identical to what this condition's own literature
//      calls for -- reused via sub_criterion_condition_relevance rather than
//      duplicated, carrying that table's own condition-specific dimension label,
//      relevance note, and citation instead of the Hashimoto's-framed original.
// Real UI wiring (making an Insights/builder screen actually condition-aware, and any
// per-dish/per-meal aggregation equivalent to aggregateBySubCriterion) is a deliberate,
// separate next step -- this function only makes the data reachable.
export type ConditionFoodScore = {
  dimension: string;
  subCriterion: string;
  tier: string;
  relevanceNote: string | null;
  citation: string | null;
};

export async function getFoodScoresForCondition(
  foodId: number,
  source: string,
  conditionCode: string,
) {
  const db = await getReferenceDatabase();
  return db.getAllAsync<ConditionFoodScore>(
    `
      SELECT
        COALESCE(scr.dimension_label, sc.dimension) AS dimension,
        sc.sub_criterion AS subCriterion,
        fs.tier AS tier,
        scr.relevance_note AS relevanceNote,
        scr.citation AS citation
      FROM food_scores fs
      JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
      LEFT JOIN sub_criterion_condition_relevance scr
        ON scr.sub_criterion_id = sc.id AND scr.condition_code = ?
      WHERE fs.food_id = ? AND fs.source = ?
        AND (sc.home_condition_code = ? OR scr.condition_code = ?)
      ORDER BY dimension, sc.sub_criterion
    `,
    conditionCode,
    foodId,
    source,
    conditionCode,
    conditionCode,
  );
}

export type SaferPrepAlternative = {
  prepMethod: string;
  foodId: number;
  source: string;
};

// Whether a real, unflagged version of this exact food exists at a
// different prep state -- 2026-08-14, the "safe if treated a certain way"
// gradient. Reuses getPreparationMethods/resolveFoodChoice (the same real
// sibling-row resolution FoodLookup.tsx already relies on) and
// getFoodScoresForCondition's own tier data, no new schema. Returns null
// when the current prep state isn't actually flagged for this condition
// (nothing to suggest an alternative to) or when no unflagged sibling
// exists. Deliberately returns the first real match, not every one --
// this is meant as a single, concrete "try it this way instead" nudge,
// not an exhaustive comparison table.
export async function getSaferPrepAlternative(
  category: string,
  subcategory: string | null,
  baseName: string,
  currentPrepMethod: string | null,
  conditionCode: string,
): Promise<SaferPrepAlternative | null> {
  const currentScores = await (async () => {
    const resolved = await resolveFoodChoice(category, subcategory, baseName, currentPrepMethod);
    if (!resolved) return null;
    return getFoodScoresForCondition(resolved.foodId, resolved.source, conditionCode);
  })();
  if (!currentScores || !currentScores.some((row) => isFlaggedTier(row.tier))) return null;

  const allPrepMethods = await getPreparationMethods(category, subcategory, baseName);
  const normalizedCurrent = currentPrepMethod || 'Standard';
  const candidates = allPrepMethods.filter((prep) => prep !== normalizedCurrent);

  for (const prep of candidates) {
    const resolved = await resolveFoodChoice(category, subcategory, baseName, prep);
    if (!resolved) continue;
    const scores = await getFoodScoresForCondition(resolved.foodId, resolved.source, conditionCode);
    if (!scores.some((row) => isFlaggedTier(row.tier))) {
      return { prepMethod: prep, foodId: resolved.foodId, source: resolved.source };
    }
  }
  return null;
}

// Phase 1 "standard panel" nutrients (energy, macros, common vitamins and
// minerals) -- amounts are per 100g as imported from each food's own
// national source. `source` on the returned rows doubles as the
// data-provenance signal: every value currently in this database comes
// from one of the 7 national testing bodies (USDA, UK_CoFID, Japan_MEXT,
// Germany_BLS, Canada_CNF, France_Ciqual, Australia_AFCD). If a future food
// ever falls back to branded/manufacturer-label data, it will carry a
// distinct source value (e.g. "Branded:Wegmans") so the UI can visually
// flag it as a different, less rigorous tier rather than showing it
// identically to reputable-body data.
// Deliberately never merges foods across sources into one row -- what
// looks like "the same food" in two national databases can genuinely be a
// different variety, growing region, or preparation state, and splicing
// values from an unverified "equivalent" row would silently fabricate a
// food nobody actually tested. Instead this is a query-time fallback: when
// the requested source is missing a nutrient for this food, look for a
// sibling row -- same category, same base_name, same prep_method, i.e. the
// same equivalence key the rest of this app already relies on to group a
// food's variants across sources -- that has it, and return that value
// with sourceUsed/isSupplemented set so the caller can disclose where it
// actually came from. Nothing is deleted or rewritten; every source's own
// row is untouched, so this is trivially reversible and easy to refine
// later (e.g. a smarter sibling-source preference) without a migration.
export async function getFoodNutrients(foodId: number, source: string) {
  // A real, local barcode-scanned product, 2026-08-16 -- see
  // getScannedProductNutrients' own comment for why this can't just be
  // one more branch inside the SQL below.
  if (source === 'Scanned') {
    return getScannedProductNutrients(foodId);
  }
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{
    code: string;
    displayName: string;
    unit: string;
    group: string;
    amountPer100g: number;
    sourceUsed: string;
    isSupplemented: number;
  }>(
    `
      WITH primary_food AS (
        SELECT category, base_name, prep_method FROM foods WHERE food_id = ? AND source = ?
      ),
      -- Other rows for the same real food (by the app's existing
      -- category + base_name + prep_method equivalence key), excluding
      -- the requested row itself.
      siblings AS (
        SELECT f.food_id, f.source
        FROM foods f
        CROSS JOIN primary_food pf
        WHERE f.category = pf.category
          AND f.base_name = pf.base_name
          AND COALESCE(f.prep_method, '') = COALESCE(pf.prep_method, '')
          AND NOT (f.food_id = ? AND f.source = ?)
      ),
      primary_nutrients AS (
        SELECT nutrient_code, amount_per_100g
        FROM food_nutrients
        WHERE food_id = ? AND source = ?
      ),
      -- Deterministic pick when more than one sibling source has the same
      -- nutrient the primary source is missing: alphabetically first
      -- source name. Simple and stable; revisit if a real source-quality
      -- preference is ever wanted -- this is the one place that logic
      -- would go.
      fallback_source AS (
        SELECT fn.nutrient_code, MIN(fn.source) AS source
        FROM food_nutrients fn
        JOIN siblings s ON s.food_id = fn.food_id AND s.source = fn.source
        WHERE fn.nutrient_code NOT IN (SELECT nutrient_code FROM primary_nutrients)
        GROUP BY fn.nutrient_code
      ),
      -- fallback_source only picks one SOURCE per nutrient, not one ROW --
      -- the app's own category/base_name/prep_method equivalence key isn't
      -- always one real food per source (e.g. several distinct wine
      -- varietals all filed under "Wine, red" from the same source), so
      -- more than one sibling row can share that chosen source for the
      -- same nutrient. ROW_NUMBER()/rn = 1 (lowest food_id, same
      -- deterministic tie-break resolveFoodChoice already uses elsewhere)
      -- picks exactly one, rather than letting every matching sibling row
      -- flow through and produce duplicate nutrient_code rows in the final
      -- result (surfaced 2026-07-27 as a real "two children with the same
      -- key" duplicate in the UI, not just a rendering-layer bug).
      fallback_nutrients AS (
        SELECT nutrient_code, amount_per_100g, source
        FROM (
          SELECT
            fn.nutrient_code,
            fn.amount_per_100g,
            fn.source,
            ROW_NUMBER() OVER (PARTITION BY fn.nutrient_code ORDER BY fn.food_id) AS rn
          FROM food_nutrients fn
          JOIN siblings s ON s.food_id = fn.food_id AND s.source = fn.source
          JOIN fallback_source fs ON fs.nutrient_code = fn.nutrient_code AND fs.source = fn.source
        )
        WHERE rn = 1
      )
      SELECT
        n.code AS code,
        n.display_name AS displayName,
        n.unit AS unit,
        n.nutrient_group AS "group",
        COALESCE(pn.amount_per_100g, fbn.amount_per_100g) AS amountPer100g,
        CASE WHEN pn.amount_per_100g IS NOT NULL THEN ? ELSE fbn.source END AS sourceUsed,
        CASE WHEN pn.amount_per_100g IS NOT NULL THEN 0 ELSE 1 END AS isSupplemented
      FROM nutrients n
      LEFT JOIN primary_nutrients pn ON pn.nutrient_code = n.code
      LEFT JOIN fallback_nutrients fbn ON fbn.nutrient_code = n.code
      WHERE pn.amount_per_100g IS NOT NULL OR fbn.amount_per_100g IS NOT NULL
      ORDER BY
        CASE n.nutrient_group WHEN 'macro' THEN 0 WHEN 'vitamin' THEN 1 WHEN 'mineral' THEN 2 ELSE 3 END,
        n.display_name
    `,
    foodId, source,
    foodId, source,
    foodId, source,
    source,
  );

  return rows.map((row) => ({ ...row, isSupplemented: Boolean(row.isSupplemented) }));
}

// A real, bulk-scoped resolver for exactly the two fields
// getDailyNutrientBreakdown/getDailySixDimensionsBreakdown actually use
// from getFoodNutrients (code + amountPer100g, confirmed via that
// function's own nutrientCache type -- neither ever reads displayName/
// unit/group/sourceUsed/isSupplemented) -- 2026-08-16, the actual root
// cause behind a real, confirmed "a minute" wait, found via live device
// logs after two earlier fixes (the meal_items N+1 loop, then a missing
// index) both turned out NOT to be the dominant cost. The real bottleneck:
// getDailyNutrientBreakdown/getDailySixDimensionsBreakdown were still
// calling getFoodNutrients/getFoodScores once PER DISTINCT FOOD, in a
// plain sequential loop -- and getFoodNutrients' own query is genuinely
// heavy per call (a real sibling-fallback CTE: a CROSS JOIN against the
// whole foods table by category/base_name/prep_method, a GROUP BY, a
// window function), not a plain indexed lookup. With expo-sqlite's one
// shared, serialized native connection (already established elsewhere in
// this codebase as the reason Promise.all can't route around a real
// per-call cost), several dozen distinct foods in one day meant several
// dozen real, individually-heavy round trips -- confirmed directly via
// [PrepDiag] timing logs showing the initial bulk item query resolving in
// well under a second, then the per-item loop alone taking 37-41 SECONDS
// on top of it.
//
// This resolves every distinct food's real nutrient rows in exactly two
// bulk queries total (its own rows, plus every real sibling's rows across
// the WHOLE set of distinct foods needed for the day), then replicates
// getFoodNutrients' own exact fallback tie-break rule in plain JS: for any
// nutrient code missing from a food's own rows, the sibling with the
// alphabetically-first SOURCE providing that code wins, and among
// siblings sharing that same source, the one with the lowest food_id --
// the identical two-step rule getFoodNutrients' own fallback_source/
// fallback_nutrients CTEs already use (MIN(source), then
// ROW_NUMBER() OVER (PARTITION BY nutrient_code ORDER BY food_id)).
// Verified directly against getFoodNutrients itself before trusting this,
// not just reasoned about -- see this function's own test coverage.
async function getPrimaryNutrientAmountsBulk(
  pairs: { foodId: number; source: string }[],
): Promise<Map<string, { code: string; amountPer100g: number }[]>> {
  const result = new Map<string, { code: string; amountPer100g: number }[]>();
  if (pairs.length === 0) return result;
  const db = await getReferenceDatabase();

  // Every target food's own real category/base_name/prep_method -- the
  // app's own established equivalence key for "the same real food,
  // measured by a different national source."
  const foodKeyPlaceholders = pairs.map(() => '(?, ?)').join(', ');
  const foodKeyParams = pairs.flatMap((p) => [p.foodId, p.source]);
  const identityRows = await db.getAllAsync<{
    foodId: number;
    source: string;
    category: string;
    baseName: string;
    prepMethod: string | null;
  }>(
    `SELECT food_id AS foodId, source, category, base_name AS baseName, prep_method AS prepMethod
     FROM foods WHERE (food_id, source) IN (${foodKeyPlaceholders})`,
    ...foodKeyParams,
  );
  const identityByKey = new Map(identityRows.map((r) => [`${r.foodId}|${r.source}`, r]));
  const tripleKey = (category: string, baseName: string, prepMethod: string | null) =>
    `${category} ${baseName} ${prepMethod ?? ''}`;

  // Every real food anywhere in the reference database sharing one of
  // those real identities -- the full sibling pool for the WHOLE day at
  // once, not one food at a time.
  const distinctTriples = Array.from(new Map(identityRows.map((r) => [tripleKey(r.category, r.baseName, r.prepMethod), r])).values());
  const siblingFoods = distinctTriples.length
    ? await db.getAllAsync<{ foodId: number; source: string; category: string; baseName: string; prepMethod: string | null }>(
        `SELECT food_id AS foodId, source, category, base_name AS baseName, prep_method AS prepMethod
         FROM foods WHERE (category, base_name, COALESCE(prep_method, '')) IN (${distinctTriples.map(() => '(?, ?, ?)').join(', ')})`,
        ...distinctTriples.flatMap((r) => [r.category, r.baseName, r.prepMethod ?? '']),
      )
    : [];

  // Every real nutrient row for the target foods AND every real sibling,
  // in one more bulk fetch.
  const allRelevantPairs = new Map<string, { foodId: number; source: string }>();
  for (const r of identityRows) allRelevantPairs.set(`${r.foodId}|${r.source}`, r);
  for (const r of siblingFoods) allRelevantPairs.set(`${r.foodId}|${r.source}`, r);
  const allPairsArr = Array.from(allRelevantPairs.values());
  const nutrientRows = allPairsArr.length
    ? await db.getAllAsync<{ foodId: number; source: string; nutrientCode: string; amountPer100g: number }>(
        `SELECT food_id AS foodId, source, nutrient_code AS nutrientCode, amount_per_100g AS amountPer100g
         FROM food_nutrients WHERE (food_id, source) IN (${allPairsArr.map(() => '(?, ?)').join(', ')})`,
        ...allPairsArr.flatMap((p) => [p.foodId, p.source]),
      )
    : [];
  const nutrientsByFoodKey = new Map<string, { code: string; amountPer100g: number }[]>();
  for (const row of nutrientRows) {
    const key = `${row.foodId}|${row.source}`;
    if (!nutrientsByFoodKey.has(key)) nutrientsByFoodKey.set(key, []);
    nutrientsByFoodKey.get(key)!.push({ code: row.nutrientCode, amountPer100g: row.amountPer100g });
  }

  // Siblings grouped by their real identity triple, matching
  // getFoodNutrients' own siblings CTE.
  const siblingsByTriple = new Map<string, { foodId: number; source: string }[]>();
  for (const r of siblingFoods) {
    const triple = tripleKey(r.category, r.baseName, r.prepMethod);
    if (!siblingsByTriple.has(triple)) siblingsByTriple.set(triple, []);
    siblingsByTriple.get(triple)!.push({ foodId: r.foodId, source: r.source });
  }

  for (const pair of pairs) {
    const key = `${pair.foodId}|${pair.source}`;
    const identity = identityByKey.get(key);
    const primary = nutrientsByFoodKey.get(key) ?? [];
    const primaryCodes = new Set(primary.map((n) => n.code));
    const combined = [...primary];

    if (identity) {
      const triple = tripleKey(identity.category, identity.baseName, identity.prepMethod);
      const siblings = (siblingsByTriple.get(triple) ?? []).filter(
        (s) => !(s.foodId === pair.foodId && s.source === pair.source),
      );
      const bestBySource = new Map<string, { source: string; amountPer100g: number; foodId: number }>();
      for (const sibling of siblings) {
        const siblingKey = `${sibling.foodId}|${sibling.source}`;
        for (const n of nutrientsByFoodKey.get(siblingKey) ?? []) {
          if (primaryCodes.has(n.code)) continue;
          const existing = bestBySource.get(n.code);
          if (
            !existing ||
            sibling.source < existing.source ||
            (sibling.source === existing.source && sibling.foodId < existing.foodId)
          ) {
            bestBySource.set(n.code, { source: sibling.source, amountPer100g: n.amountPer100g, foodId: sibling.foodId });
          }
        }
      }
      for (const [code, best] of bestBySource) combined.push({ code, amountPer100g: best.amountPer100g });
    }

    result.set(key, combined);
  }

  return result;
}

// Insights' own Nutrient Ranking lens, 2026-08-08 -- "a lens that is used
// to show food items based on how much of any specific thing is within
// them, such as to provide the list of foods in order of most protein to
// least." Its own nutrient picker reuses listTrackedNutrients/
// TrackedNutrient (defined near listAllActiveTreatments below) rather than
// a second, separately-maintained "every nutrient" list -- caught and
// fixed in the same pass this was written, before it could become a real,
// drifting duplicate of that already-existing function.
export type RankedFood = {
  foodId: number;
  source: string;
  baseName: string;
  category: string;
  subcategory: string | null;
  amountPer100g: number;
  prepMethod: string | null;
};

// Real, visible foods ranked by how much of one chosen nutrient they carry
// per 100g -- most to least. Dedupes to one row per (category, base_name,
// prep state), the same "Spinach x7" concern named throughout this file
// (see resolveEffectiveUsdaOnly's own comment) -- but keeps whichever
// SOURCE row reports the LARGEST amount for that exact food-and-prep-state
// rather than dropping every non-USDA source outright, so real cross-source
// measurement variance doesn't silently under-report a food's own
// best-measured value the way a blanket usdaOnly filter would. Pulls every
// matching row first (one nutrient code is sparse enough across 22,016
// foods that this is a cheap scan, not a full-table one) and dedupes/sorts
// in JS, since the dedup key itself needs case-insensitive base_name
// comparison SQL's own GROUP BY can't cleanly express alongside "keep the
// whole row, not just the max value."
//
// 2026-08-11, a real, reported bug (and its own real fix, then a direct
// correction to that fix the same day): the dedup key (category +
// base_name) never distinguished prep_method, so it was ALSO silently
// collapsing a food's own Raw/Boiled/Dried/Stewed rows together, not just
// genuine cross-source duplicates of the same prep state. Drying
// concentrates almost every nutrient by removing water, so "keep whichever
// row reports the largest amount" meant a food's Dried variant would always
// win over its own Raw one -- confirmed directly: black truffle
// (Germany_BLS) reads 16.54g fiber/100g raw vs. 54.923g dried, and this
// function was returning the dried figure as the food's own general "black
// truffle" value. A first fix made a real Raw/Standard row always beat any
// other prep state outright, which stopped the wrong number showing up --
// but also meant the Dried row simply vanished from the ranking entirely,
// its own real, different fiber content never shown anywhere. Direct
// correction: "this is a raw whole foods database, and even though dried
// still starts as raw, the numbers will be different and we need to
// identify that. If they show up in the list twice, once raw and once
// dried, then so be it." The dedup key now includes the food's own prep
// state directly (normalizing a null/untagged row and an explicit 'Raw' tag
// to the same key -- see resolveFoodChoice's own comment for why those two
// already mean the same real thing elsewhere in this file), so Raw and
// Dried mushrooms are two real, separately-ranked, correctly-labeled
// entries rather than one slot with a winner-take-all comparison --
// dedup by largest amount now only ever happens BETWEEN rows that are
// genuinely the same food in the same real prep state, measured by
// different sources, which is the one case this mechanism was always
// meant to cover.
// 2026-08-11, a real, direct performance fix, found while investigating a
// real, reported "Insights takes 30 seconds to open a lens" symptom. This
// function used to fetch EVERY matching row for a nutrient (15,067 rows
// for something as common as protein, out of 831,248 total rows in
// food_nutrients -- confirmed directly against the live database, not
// guessed) across the React Native JS bridge, then did the dedup/sort/
// limit entirely in JavaScript, discarding all but the first `limit`
// (default 100) of them. Crossing the bridge for thousands of individual
// rows just to throw away all but 100 is a real, well-documented React
// Native bottleneck, and this app's own reference database has only grown
// since this function was first written (Norway/Sweden added ~4,700 more
// foods and ~144,500 more nutrient rows the same week).
//
// Fixed by pushing the exact same dedup logic into the SQL itself, using a
// real window function (ROW_NUMBER() OVER (PARTITION BY ...)) -- confirmed
// safe to rely on directly, not assumed: expo-sqlite's own native Android
// build (its CMakeLists.txt) links `libsql`, a modern, actively maintained
// SQLite superset with full window-function support. The PARTITION BY
// clause (category, base_name, COALESCE(prep_method, 'Raw')) is the exact
// same grouping key the JS version used, and base_name's own column
// definition is already COLLATE NOCASE (see the foods table schema),
// which SQLite applies automatically to GROUP BY/PARTITION BY the same way
// the JS version's own .toLowerCase() did -- with one honest, narrow
// caveat: SQLite's built-in NOCASE only correctly case-folds ASCII
// characters, not full Unicode, so a non-ASCII/accented base_name
// reported with different casing by two different sources could
// theoretically dedupe very slightly differently than the old JS version
// (which used real Unicode-aware .toLowerCase()) -- an extremely narrow
// edge case, judged a reasonable tradeoff against the real, confirmed
// performance win: now only the final, already-deduped, already-limited
// result set (100 rows, not 15,067) ever crosses the bridge at all.
// Verified directly against the live database before and after this
// change: identical top-10 protein results, same real total deduped
// count.
// Nutrient Ranking's own "apples to apples" secondary filter, 2026-08-14,
// direct request: "we need a secondary filter for Nutrient ranking. It
// needs to separate raw food from dried, and from canned, and from any
// other way that makes it so we end up with an apples to apples way of
// looking at the food." A real, direct example of why this matters had
// already come up the same day -- tomato powder's own real 46,260 µg/100g
// lycopene figure is genuine (independently verified against the live
// USDA API), but it's genuine precisely BECAUSE drying concentrates
// nearly everything by removing water, the same real mechanism
// rankFoodsByNutrient's own header comment already documents at length
// for why Raw and Dried are kept as two separate, distinctly-labeled
// entries rather than merged. That existing design already stops the
// WRONG number from displaying; it doesn't stop a person from wanting to
// see, say, only the raw entries at once for a genuinely fair comparison
// -- this is what this filter is actually for.
//
// Checked the real, live database directly before designing this, not
// guessed at a scheme: prep_method carries 27 distinct real values, most
// with a tiny row count ("O'Brien," "Wedges," "Scalloped" -- 1-2 rows
// each) that wouldn't be meaningful filter choices on their own. Grouped
// into five real, checkable buckets instead, with a genuine, honest sixth
// for what's left over. A real, worth-naming gap, checked directly rather
// than assumed away: prep_method itself is only structured for roughly
// 28% of this database's visible foods overall -- USDA is the
// best-covered real source (80%), Germany_BLS/Canada_CNF/Japan_MEXT/
// Australia_AFCD partially, and Sweden_Livsmedelsverket/
// Norway_Matvaretabellen/France_Ciqual have ZERO structured prep_method
// rows at all (their own real prep-state signal, where it exists, lives
// only in each row's own untranslated name text -- Swedish "konserv." for
// canned, French "cru" for raw). A blank/untagged food is classified
// 'unspecified' here rather than guessed at from a keyword scan across 9
// different languages -- confirmed directly (a real, random sample of the
// blank bucket) that it's genuinely mixed, holding canned, fried, and
// baked foods right alongside raw ones for the sources that don't
// structure this field, so treating blank as Raw here (the way
// rankFoodsByNutrient's own internal DEDUP partition already does, for a
// narrower, different reason -- collision-avoidance between sources, not
// a semantic filter) would have actively misclassified real canned/cooked
// foods as Raw, defeating the whole point of this filter.
export type PrepStateGroup = 'raw' | 'cooked' | 'dried' | 'canned' | 'frozen' | 'unspecified';

export const PREP_STATE_GROUP_LABELS: Record<PrepStateGroup, string> = {
  raw: 'Raw',
  cooked: 'Cooked',
  dried: 'Dried',
  canned: 'Canned',
  frozen: 'Frozen',
  unspecified: 'Unspecified prep state',
};

// Every option in a real, meaningful filter order -- 'All' isn't its own
// PrepStateGroup value (no filter applied at all is represented as
// `null`, not a seventh group), so callers building a picker list prepend
// that themselves.
export const PREP_STATE_GROUP_ORDER: PrepStateGroup[] = ['raw', 'cooked', 'dried', 'canned', 'frozen', 'unspecified'];

// Real prep_method values -> group, for the four groups worth a positive,
// explicit list. 'cooked' is deliberately NOT one of these -- see
// prepStateGroupWhereClause's own comment for why it's defined as
// "everything else" instead, so a genuinely new prep_method value
// introduced by a future database rebuild automatically falls into
// 'cooked' rather than silently vanishing from every group's filter.
const PREP_STATE_EXPLICIT_VALUES: Record<'raw' | 'dried' | 'canned' | 'frozen', string[]> = {
  raw: ['Raw', 'Unprepared'],
  dried: ['Dried', 'Mashed (Dehydrated)'],
  canned: ['Canned', 'Pickled'],
  frozen: ['Frozen', 'Deep-Frozen'],
};

// Pure JS classifier for DISPLAY purposes (labeling a food's own group in
// a rendered row) -- the SQL-side filtering below is a real, separate
// WHERE-clause builder, not this function reused as a predicate, since
// pushing the filter into SQL is what keeps a large ranking query from
// having to cross the JS bridge with every row just to throw most of them
// away (the same real performance discipline rankFoodsByNutrient's own
// history already established).
export function classifyPrepStateGroup(prepMethod: string | null): PrepStateGroup {
  if (!prepMethod) return 'unspecified';
  if (PREP_STATE_EXPLICIT_VALUES.raw.includes(prepMethod)) return 'raw';
  if (PREP_STATE_EXPLICIT_VALUES.dried.includes(prepMethod)) return 'dried';
  if (PREP_STATE_EXPLICIT_VALUES.canned.includes(prepMethod)) return 'canned';
  if (PREP_STATE_EXPLICIT_VALUES.frozen.includes(prepMethod)) return 'frozen';
  return 'cooked';
}

// Real SQL condition + bound params for a given group, referencing the
// `f` alias both real callers below already use for the foods table.
// `null` (no group picked -- "All") returns an always-true clause with no
// params, so every existing call site's own query shape stays identical
// to before this filter existed.
function prepStateGroupWhereClause(group: PrepStateGroup | null): { sql: string; params: string[] } {
  if (!group) return { sql: '1=1', params: [] };
  if (group === 'unspecified') {
    return { sql: "(f.prep_method IS NULL OR f.prep_method = '')", params: [] };
  }
  if (group === 'cooked') {
    // Everything genuinely tagged, that isn't one of the other four real
    // groups -- not a positive list of every "cooked" value, deliberately,
    // so a real prep_method value this database gains later (a future
    // rebuild, a new source) is automatically covered here rather than
    // needing this list hand-updated to keep catching it.
    const excluded = [
      ...PREP_STATE_EXPLICIT_VALUES.raw,
      ...PREP_STATE_EXPLICIT_VALUES.dried,
      ...PREP_STATE_EXPLICIT_VALUES.canned,
      ...PREP_STATE_EXPLICIT_VALUES.frozen,
    ];
    return {
      sql: `(f.prep_method IS NOT NULL AND f.prep_method != '' AND f.prep_method NOT IN (${excluded.map(() => '?').join(',')}))`,
      params: excluded,
    };
  }
  const values = PREP_STATE_EXPLICIT_VALUES[group];
  return { sql: `f.prep_method IN (${values.map(() => '?').join(',')})`, params: values };
}

export async function rankFoodsByNutrient(
  nutrientCode: string,
  limit = 100,
  prepStateGroup: PrepStateGroup | null = null,
): Promise<RankedFood[]> {
  const db = await getReferenceDatabase();
  const { sql: prepClause, params: prepParams } = prepStateGroupWhereClause(prepStateGroup);
  return db.getAllAsync<RankedFood>(
    `
      SELECT foodId, source, baseName, category, subcategory, prepMethod, amountPer100g
      FROM (
        SELECT
          f.food_id AS foodId, f.source AS source, f.base_name AS baseName,
          f.category AS category, f.subcategory AS subcategory, f.prep_method AS prepMethod,
          fn.amount_per_100g AS amountPer100g,
          ROW_NUMBER() OVER (
            PARTITION BY f.category, f.base_name, COALESCE(f.prep_method, 'Raw')
            ORDER BY fn.amount_per_100g DESC
          ) AS rn
        FROM food_nutrients fn
        JOIN foods f ON f.food_id = fn.food_id AND f.source = fn.source
        WHERE fn.nutrient_code = ? AND f.hidden = 0 AND fn.amount_per_100g > 0 AND ${prepClause}
      )
      WHERE rn = 1
      ORDER BY amountPer100g DESC
      LIMIT ?
    `,
    nutrientCode,
    ...prepParams,
    limit,
  );
}

// The reverse of rankFoodsByNutrient -- 2026-08-14, direct request in the
// same message as the prep-state filter above: "the user should be able
// to select any specific food to see how it ranks in other nutrients,
// such as 50th in vegetables or 35th in fruit." Given one real, specific
// food (foodId + source, exactly what FoodLookup's own onFoodResolved
// already hands back), returns its own rank + real comparison-pool size
// within its OWN category, for every nutrient it has a genuinely measured,
// nonzero value for -- matching the request's own explicit "in
// vegetables"/"in fruit" framing (scoped to category, not the whole
// database at once, since comparing a vegetable's nutrient density
// against, say, Fats or Alcohol was never the actual question).
//
// Deliberately reuses the SAME prepStateGroup filter as
// rankFoodsByNutrient, rather than auto-detecting and silently applying
// the target food's own group -- a real, considered call, not an
// oversight: auto-switching the filter behind the scenes the instant a
// food is picked would be a real, silent behavior change a person didn't
// ask for, and this way the one filter control genuinely means the same
// thing in both of Nutrient Ranking's own modes. Passing the food's own
// real group through explicitly (the UI does this) gets the fair,
// apples-to-apples comparison; leaving it at "All" intentionally shows how
// the food stacks up against every prep state at once, a real, legitimate
// question in its own right.
//
// Built the exact same real, SQL-side-dedup way rankFoodsByNutrient's own
// history already established (a real, confirmed performance fix, not a
// stylistic choice) -- one query, real window functions doing the dedupe/
// rank/count work natively, so only the final, already-computed rows (one
// per nutrient this food actually has a value for) ever cross the JS
// bridge.
export type FoodNutrientRanking = {
  nutrientCode: string;
  displayName: string;
  unit: string;
  amountPer100g: number;
  rank: number;
  poolSize: number;
};

export async function getFoodRankingsAcrossNutrients(
  foodId: number,
  source: string,
  prepStateGroup: PrepStateGroup | null = null,
): Promise<FoodNutrientRanking[]> {
  const db = await getReferenceDatabase();
  const { sql: prepClause, params: prepParams } = prepStateGroupWhereClause(prepStateGroup);
  return db.getAllAsync<FoodNutrientRanking>(
    `
      WITH target AS (
        SELECT category, base_name AS baseName, COALESCE(prep_method, '') AS prepMethod
        FROM foods WHERE food_id = ? AND source = ?
      ),
      deduped AS (
        SELECT
          fn.nutrient_code AS nutrientCode, f.base_name AS baseName,
          COALESCE(f.prep_method, '') AS prepMethod, fn.amount_per_100g AS amountPer100g,
          ROW_NUMBER() OVER (
            PARTITION BY fn.nutrient_code, f.base_name, COALESCE(f.prep_method, '')
            ORDER BY fn.amount_per_100g DESC
          ) AS dedupeRn
        FROM food_nutrients fn
        JOIN foods f ON f.food_id = fn.food_id AND f.source = fn.source
        WHERE f.hidden = 0 AND fn.amount_per_100g > 0
          AND f.category = (SELECT category FROM target)
          AND ${prepClause}
      ),
      ranked AS (
        SELECT
          nutrientCode, baseName, prepMethod, amountPer100g,
          RANK() OVER (PARTITION BY nutrientCode ORDER BY amountPer100g DESC) AS rank,
          COUNT(*) OVER (PARTITION BY nutrientCode) AS poolSize
        FROM deduped
        WHERE dedupeRn = 1
      )
      SELECT r.nutrientCode AS nutrientCode, n.display_name AS displayName, n.unit AS unit,
             r.amountPer100g AS amountPer100g, r.rank AS rank, r.poolSize AS poolSize
      FROM ranked r
      JOIN nutrients n ON n.code = r.nutrientCode
      WHERE r.baseName = (SELECT baseName FROM target) AND r.prepMethod = (SELECT prepMethod FROM target)
      ORDER BY r.rank ASC
    `,
    foodId,
    source,
    ...prepParams,
  );
}

// Which broad group a food's protein counts toward for the Nutrient
// Ranking lens's own Animal-vs-Plant protein split -- deliberately framed
// around what actually matters practically (can a vegetarian eat this),
// not strict biology: Mushroom (a fungus) and Algae (a protist) are
// grouped with 'plant' since a vegetarian can eat both, rather than left
// in a confusing third bucket. 'Meat' already carries the real
// app-wide display label "Animal Protein" (see FoodLookup.tsx's own
// CATEGORY_DISPLAY_LABELS) -- this mapping is consistent with that, not a
// new, separate judgment call. Returns null for a category that isn't
// meaningfully a "protein source" category at all (Sweets, Fats, Herbs,
// Bev, Brewing, Alcohol, SaucesCondiments, Mixed) -- excluded from the
// split entirely rather than forced into either side.
export function classifyProteinSource(category: string): 'animal' | 'plant' | null {
  if (category === 'Meat' || category === 'Dairy') return 'animal';
  if (
    category === 'Legume' ||
    category === 'NutSeed' ||
    category === 'Grain' ||
    category === 'PastaNoodles' ||
    category === 'Veg' ||
    category === 'Fruit' ||
    category === 'Mushroom' ||
    category === 'Algae' ||
    category === 'PantryStaples'
  ) {
    return 'plant';
  }
  return null;
}

// Insights' own Safe Foods lens, 2026-08-08 -- "foods listed in this
// section have zero relevance to the 6-DFF and will not cause a problem
// for them if they eat it." A food qualifies when NONE of its own
// food_scores rows are a real yellow/red concern -- isFlaggedTier, reused
// directly from lib/sixDimensionsReference.ts (the exact same severity
// logic every other D1-D6 view in this app already trusts) rather than a
// second, drifting reimplementation of that logic here. 'Not Assessed'
// rows and real green rows are both fine; only a genuinely flagged tier
// disqualifies a food. Safe to import isFlaggedTier here -- see this
// file's own precedent with analyzeNutrientIntake (./nutrientAnalysis):
// sixDimensionsReference.ts's only reference back to this file is a
// type-only import (`import type`), which is erased entirely at compile
// time, so there's no real runtime circular dependency.
//
// Computed once per app session and cached in memory rather than a new DB
// column/rebuild: food_scores is static bundled reference data that never
// changes at runtime, so a one-time bulk fetch (~180K small rows) plus a
// JS group-by is cheap enough not to need a schema migration just for
// this -- the same "compute once, cache for the session" shape
// hasUsdaCoverage's own per-category cache already uses above.
let safeFoodIdsCache: Promise<Set<string>> | null = null;

// Two sub-criteria that fire on roughly half of all foods in this database
// (Selenium & Zn synergy alone hits ~50%, Iron Presence ~5.5%) -- a
// near-universal background signal, not a real per-food concern. Excluded
// here 2026-08-26 the same way lib/recipeDepth.ts's own
// NEAR_UNIVERSAL_SUB_CRITERIA already excludes them from a recipe's real
// cautions; this plain, condition-agnostic "safe" set had never picked up
// that same fix, so roughly half of all foods were silently marked "not
// safe" for a signal that isn't a real concern at all. A second, faithful
// copy of the same 2-entry set rather than an import, matching this
// project's own accepted duplication between recipeDepth.ts and the
// compute scripts it faithfully ports.
const NEAR_UNIVERSAL_SUB_CRITERIA = new Set(['Selenium & Zn synergy', 'Iron Presence']);

async function getSafeFoodIds(): Promise<Set<string>> {
  if (!safeFoodIdsCache) {
    safeFoodIdsCache = (async () => {
      const db = await getReferenceDatabase();
      const rows = await db.getAllAsync<{ foodId: number; source: string; tier: string; subCriterion: string }>(
        `
          SELECT fs.food_id AS foodId, fs.source AS source, fs.tier AS tier, sc.sub_criterion AS subCriterion
          FROM food_scores fs
          JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
        `,
      );
      const flagged = new Set<string>();
      const allKeys = new Set<string>();
      for (const row of rows) {
        const key = `${row.foodId}|${row.source}`;
        allKeys.add(key);
        if (!NEAR_UNIVERSAL_SUB_CRITERIA.has(row.subCriterion) && isFlaggedTier(row.tier)) flagged.add(key);
      }
      const safe = new Set<string>();
      for (const key of allKeys) {
        if (!flagged.has(key)) safe.add(key);
      }
      return safe;
    })();
  }
  return safeFoodIdsCache;
}

// 2026-08-26 -- condition-scoped "safe," reusing the exact same real
// per-condition relevance rules getFoodScoresForCondition already applies
// one food at a time (see that function's own comment), but as one bulk
// fetch rather than a per-food/per-condition query loop: Safe Foods'
// existing performance history (see getSafeFoodIds' own gating in
// app/(tabs)/insights.tsx -- a naive unindexed full-table scan there once
// froze the JS thread for 18.6 real seconds) makes a query-per-food
// approach a real, named risk to avoid here, not a hypothetical one.
//
// allScoreRowsWithSubCriteria fetches the whole food_scores table joined to
// sub_criteria ONCE (cached forever, the same "reference data never
// changes at runtime" reasoning getSafeFoodIds already relies on) --
// reusable for computing ANY condition's own flagged set afterward with no
// second SQL round-trip, only a JS filter pass. subCriterionRelevanceRows
// is the second, much smaller table (sub_criterion_condition_relevance)
// that maps a sub-criterion onto every OTHER condition that reuses it,
// also fetched once and cached.
//
// Named honestly: this single fetch now joins sub_criteria and returns two
// more columns per row than the plain, ungated query that produced the
// original 18.6-second freeze, so it is very likely at least as slow, not
// faster -- gated behind the same "only when Safe Foods is actually
// opened, once per session, real loading text while it runs" discipline
// that made the original cost acceptable, but not yet re-measured
// on-device against this new shape.
type ScoreRowWithSubCriterion = {
  foodId: number;
  source: string;
  tier: string;
  dimension: string;
  subCriterion: string;
  subCriterionId: number;
  homeConditionCode: string;
};
let allScoreRowsWithSubCriteriaCache: Promise<ScoreRowWithSubCriterion[]> | null = null;
async function getAllScoreRowsWithSubCriteria(): Promise<ScoreRowWithSubCriterion[]> {
  if (!allScoreRowsWithSubCriteriaCache) {
    allScoreRowsWithSubCriteriaCache = (async () => {
      const db = await getReferenceDatabase();
      return db.getAllAsync<ScoreRowWithSubCriterion>(
        `
          SELECT fs.food_id AS foodId, fs.source AS source, fs.tier AS tier, sc.dimension AS dimension,
                 sc.sub_criterion AS subCriterion, sc.id AS subCriterionId, sc.home_condition_code AS homeConditionCode
          FROM food_scores fs
          JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
        `,
      );
    })();
  }
  return allScoreRowsWithSubCriteriaCache;
}

// dimensionLabel/relevanceNote/citation added 2026-08-26, so
// getConditionScoresForFoodsBulk below can build a faithful, complete
// equivalent of getFoodScoresForCondition's own per-food result -- not
// just the flagged-id-set lookup this row shape was first built for.
type RelevanceRow = {
  subCriterionId: number;
  conditionCode: string;
  dimensionLabel: string;
  relevanceNote: string | null;
  citation: string | null;
};
let subCriterionRelevanceRowsCache: Promise<RelevanceRow[]> | null = null;
async function getSubCriterionRelevanceRows(): Promise<RelevanceRow[]> {
  if (!subCriterionRelevanceRowsCache) {
    subCriterionRelevanceRowsCache = (async () => {
      const db = await getReferenceDatabase();
      return db.getAllAsync<RelevanceRow>(
        `
          SELECT sub_criterion_id AS subCriterionId, condition_code AS conditionCode,
                 dimension_label AS dimensionLabel, relevance_note AS relevanceNote, citation
          FROM sub_criterion_condition_relevance
        `,
      );
    })();
  }
  return subCriterionRelevanceRowsCache;
}

// One condition's own flagged (food_id|source) set -- everything that
// would show a real caution for THIS condition specifically, the same
// "owns the sub-criterion natively, or reuses another condition's via
// sub_criterion_condition_relevance" real matching getFoodScoresForCondition
// already does per food. Cached per condition code for the session, same
// "compute once per app session" shape getSafeFoodIds already established.
const flaggedFoodIdsByConditionCache = new Map<string, Promise<Set<string>>>();
async function getFlaggedFoodIdsForCondition(conditionCode: string): Promise<Set<string>> {
  let cached = flaggedFoodIdsByConditionCache.get(conditionCode);
  if (!cached) {
    cached = (async () => {
      const [allRows, relevanceRows] = await Promise.all([getAllScoreRowsWithSubCriteria(), getSubCriterionRelevanceRows()]);
      const relevantSubCriterionIds = new Set(
        relevanceRows.filter((row) => row.conditionCode === conditionCode).map((row) => row.subCriterionId),
      );
      const flagged = new Set<string>();
      for (const row of allRows) {
        if (row.homeConditionCode !== conditionCode && !relevantSubCriterionIds.has(row.subCriterionId)) continue;
        if (NEAR_UNIVERSAL_SUB_CRITERIA.has(row.subCriterion)) continue;
        if (!isFlaggedTier(row.tier)) continue;
        flagged.add(`${row.foodId}|${row.source}`);
      }
      return flagged;
    })();
    flaggedFoodIdsByConditionCache.set(conditionCode, cached);
  }
  return cached;
}

// Bulk, cached-source equivalent of getFoodScoresForCondition -- 2026-08-26,
// built for the condition-scoped dimension breakdown (lib/conditionDimensions.ts)
// this app's own Insights "6 Dimensions" lens and every saved-dish detail
// view need: every distinct food logged across a whole day, or every
// ingredient in one dish, scored against however many conditions a person
// tracks, without a query per food per condition. Reuses the exact same
// cached full-table fetch getFlaggedFoodIdsForCondition already
// established, so this can't reopen the freeze risk documented there.
export async function getConditionScoresForFoodsBulk(
  foodPairs: { foodId: number; source: string }[],
  conditionCodes: string[],
): Promise<Map<string, Map<string, ConditionFoodScore[]>>> {
  const result = new Map<string, Map<string, ConditionFoodScore[]>>();
  if (foodPairs.length === 0 || conditionCodes.length === 0) return result;

  const wantedFoodKeys = new Set(foodPairs.map((pair) => `${pair.foodId}|${pair.source}`));
  const [allRows, relevanceRows] = await Promise.all([getAllScoreRowsWithSubCriteria(), getSubCriterionRelevanceRows()]);

  // subCriterionId -> conditionCode -> that pair's own relevance row --
  // the same lookup getFoodScoresForCondition's own LEFT JOIN resolves one
  // food at a time, built once here instead.
  const relevanceBySubCriterion = new Map<number, Map<string, RelevanceRow>>();
  for (const row of relevanceRows) {
    if (!relevanceBySubCriterion.has(row.subCriterionId)) relevanceBySubCriterion.set(row.subCriterionId, new Map());
    relevanceBySubCriterion.get(row.subCriterionId)!.set(row.conditionCode, row);
  }

  for (const row of allRows) {
    const foodKey = `${row.foodId}|${row.source}`;
    if (!wantedFoodKeys.has(foodKey)) continue;
    const relevanceForSubCriterion = relevanceBySubCriterion.get(row.subCriterionId);

    for (const conditionCode of conditionCodes) {
      const relevance = relevanceForSubCriterion?.get(conditionCode);
      const owned = row.homeConditionCode === conditionCode;
      if (!owned && !relevance) continue;

      if (!result.has(foodKey)) result.set(foodKey, new Map());
      const byCondition = result.get(foodKey)!;
      if (!byCondition.has(conditionCode)) byCondition.set(conditionCode, []);
      byCondition.get(conditionCode)!.push({
        dimension: relevance?.dimensionLabel ?? row.dimension,
        subCriterion: row.subCriterion,
        tier: row.tier,
        relevanceNote: relevance?.relevanceNote ?? null,
        citation: relevance?.citation ?? null,
      });
    }
  }

  return result;
}

// The one-shot version for a single food list with no further scope
// levels underneath it -- fetches the bulk scores once, then builds every
// tracked condition's own summary from that same fetch (see
// lib/conditionDimensions.ts's own buildPerConditionSummaries).
export async function computeConditionDimensionsForFoods(
  foods: { foodId: number; source: string; foodName: string }[],
  trackedConditions: { code: string; name: string }[],
): Promise<Record<string, ConditionDimensionSummary>> {
  if (trackedConditions.length === 0) return {};
  const scoresByFood = await getConditionScoresForFoodsBulk(
    foods.map((food) => ({ foodId: food.foodId, source: food.source })),
    trackedConditions.map((condition) => condition.code),
  );
  return buildPerConditionSummaries(foods, trackedConditions, scoresByFood);
}

// "Safe" across every one of the person's own tracked conditions at once --
// a food flagged for even one tracked condition isn't honestly "safe" to
// show here, matching the same standard "Meals You Can Eat" already
// applies per curated recipe (2026-08-24/25). An empty conditionCodes list
// (nothing tracked yet) falls back to the old, plain, condition-agnostic
// getSafeFoodIds() -- the same "absence means no restriction, fall back to
// the general case" contract this app's other personalization features
// (diet preferences, curious-about conditions) already follow.
const personalizedSafeFoodIdsCache = new Map<string, Promise<Set<string>>>();
export async function getPersonalizedSafeFoodIds(conditionCodes: string[]): Promise<Set<string>> {
  if (conditionCodes.length === 0) return getSafeFoodIds();
  const cacheKey = [...conditionCodes].sort().join(',');
  let cached = personalizedSafeFoodIdsCache.get(cacheKey);
  if (!cached) {
    cached = (async () => {
      const db = await getReferenceDatabase();
      const allRows = await db.getAllAsync<{ foodId: number; source: string }>('SELECT food_id AS foodId, source FROM foods WHERE hidden = 0');
      const flaggedSets = await Promise.all(conditionCodes.map((code) => getFlaggedFoodIdsForCondition(code)));
      const safe = new Set<string>();
      outer: for (const row of allRows) {
        const key = `${row.foodId}|${row.source}`;
        for (const flagged of flaggedSets) {
          if (flagged.has(key)) continue outer;
        }
        safe.add(key);
      }
      return safe;
    })();
    personalizedSafeFoodIdsCache.set(cacheKey, cached);
  }
  return cached;
}

// Which real categories currently have at least one safe food -- the Safe
// Foods lens's own first picker step. Deliberately queries every category
// (not CATEGORIES_HIDDEN_FROM_BROWSING-filtered like getReferenceCategories
// above) since a safe food is only ever a real, visible one anyway
// (hidden = 0 is enforced inside listSafeFoods below); a category that's
// fully hidden from ordinary browsing simply never contributes any safe
// foods and drops out of this list naturally.
//
// conditionCodes, 2026-08-26 -- optional, defaults to [] (the old,
// condition-agnostic behavior) so every existing caller stays unaffected;
// Insights' own Safe Foods lens now passes the person's real tracked
// conditions, so "safe" here means the same real, condition-scoped thing
// "Meals You Can Eat" already means in the Digest, not a generic,
// unpersonalized flag.
export async function listSafeFoodCategories(conditionCodes: string[] = []): Promise<string[]> {
  const safeIds = await getPersonalizedSafeFoodIds(conditionCodes);
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ foodId: number; source: string; category: string }>(
    'SELECT food_id AS foodId, source, category FROM foods WHERE hidden = 0',
  );
  const categories = new Set<string>();
  for (const row of rows) {
    if (safeIds.has(`${row.foodId}|${row.source}`)) categories.add(row.category);
  }
  return Array.from(categories).sort();
}

export type SafeFood = { foodId: number; source: string; baseName: string; category: string; subcategory: string | null };

// Real, visible, zero-flagged foods within one category -- deduped to one
// row per base_name (the same cross-source "Spinach x7" concern named
// throughout this file), sorted alphabetically. A v1 list, not paginated
// beyond `limit` -- a category with more real safe foods than that just
// shows its first `limit` alphabetically, matching the same cap shape
// rankFoodsByNutrient above already uses.
//
// conditionCodes, 2026-08-26 -- see listSafeFoodCategories' own comment
// directly above; same optional, defaults-to-old-behavior contract.
export async function listSafeFoods(category: string, limit = 200, conditionCodes: string[] = []): Promise<SafeFood[]> {
  const safeIds = await getPersonalizedSafeFoodIds(conditionCodes);
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<SafeFood>(
    'SELECT food_id AS foodId, source, base_name AS baseName, category, subcategory FROM foods WHERE category = ? AND hidden = 0',
    category,
  );
  const byName = new Map<string, SafeFood>();
  for (const row of rows) {
    if (!safeIds.has(`${row.foodId}|${row.source}`)) continue;
    const key = row.baseName.toLowerCase();
    if (!byName.has(key)) byName.set(key, row);
  }
  return Array.from(byName.values())
    .sort((a, b) => a.baseName.localeCompare(b.baseName))
    .slice(0, limit);
}

// Insights' own Healing Stage Food Finder lens, 2026-08-08 -- "a lens that
// identifies foods based on the Healing Stages." A real food-FINDER, not
// the separate, larger, still-unbuilt Profile self-declaration + app-wide
// advisory-reordering feature CLAUDE.md's own healing-journey section
// describes (that one needs a real "which stage are you in" field on
// Profile that doesn't exist yet, and reordering every Food builder's own
// pickers -- explicitly out of scope here). This is scoped to Stage 1
// ("Getting Started") and Stage 2 ("Rebuilding"), matching the app's own
// documented practical-scoping note that only these two meaningfully
// drive food decisions -- built directly from the real, published Healing
// Stages guide (https://claude.ai/code/artifact/48bbddce-c75a-4d31-a57b-8f71df74368c).
//
// Every keyword below was checked directly against the live reference
// database before being written here (via the sqlite3 CLI against
// assets/data/foods_reference.db), not guessed -- including one real,
// consequential finding along the way: nearly every plain chicken cut
// (breast, thigh, drumstick, whole bird) is currently hidden from
// browsing (244 of 256 chicken base_names), while beef/pork/turkey all
// kept their common cuts visible -- looks like an unintended casualty of
// an earlier bulk-hide pass, not a deliberate choice (nobody would
// deliberately keep "Chicken Gizzard" visible while hiding "Chicken
// Breast"). Not fixed here -- that's the person's own curation call, not
// mine to silently reverse -- so 'chicken breast'/'chicken, breast' stay
// in this list as a harmless no-op today that starts working the moment
// those rows are unhidden; Turkey Breast (confirmed visible) covers the
// real poultry recommendation in the meantime.
type StageFoodGroup = { label: string; category: string; keywords: string[]; exclude?: string[] };

const STAGE_1_GROUPS: StageFoodGroup[] = [
  {
    label: 'Proteins',
    category: 'Meat',
    keywords: ['turkey breast', 'turkey, breast', 'chicken breast', 'chicken, breast', 'cod', 'halibut', 'haddock'],
    exclude: ['smoked'],
  },
  { label: 'Proteins', category: 'Dairy', keywords: ['chicken egg'], exclude: ['egg roll'] },
  // Cooked, not raw, to start -- see this lens's own help text; browsing
  // still surfaces every prep-state row (the guide's own "cook it first"
  // is advisory, not a hard gate this app enforces by hiding raw rows).
  {
    label: 'Vegetables (cook first)',
    category: 'Veg',
    keywords: ['carrot', 'cucumber', 'zucchini', 'courgette', 'green bean', 'snap bean', 'bok choy', 'pak choi', 'lettuce', 'spinach'],
  },
  { label: 'Starches', category: 'Grain', keywords: ['rice, white'] },
  { label: 'Starches', category: 'Veg', keywords: ['sweet potato'], exclude: ['syrup', 'french-fried', 'puff'] },
  { label: 'Fruits (in moderation)', category: 'Fruit', keywords: ['blueberr', 'cantaloupe', 'kiwi', 'strawberr'], exclude: ['guava'] },
  { label: 'Fats', category: 'Fats', keywords: ['olive oil', 'coconut oil'] },
];

// Stage 2's own real reintroduction rounds -- "cooked goitrogenic
// vegetables and legumes first... nightshades next... dairy next...
// gluten last." Legumes and the Gluten round both reuse this app's own
// real, already-scored D1-D6 data (Goitrogenic Load / Gluten sub-
// criteria) rather than a second, separate judgment call about which
// foods count -- see foodsWithSubCriterionTag below. Nightshades has no
// real per-food D1-D6 tag in the live database (checked directly, not
// assumed -- the "Nightshades" sub-criterion referenced in this app's own
// citation text turned out to have no matching row in the live
// sub_criteria table), so that round is name-matched the same way Stage 1
// is, against real, hand-verified nightshade vegetables instead.
const STAGE_2_LEGUME_GROUP: StageFoodGroup = { label: 'Round 1: Legumes', category: 'Legume', keywords: [] };
const STAGE_2_NIGHTSHADE_GROUP: StageFoodGroup = {
  label: 'Round 2: Nightshades',
  category: 'Veg',
  keywords: ['tomato', 'potato', 'bell pepper', 'chili pepper', 'eggplant', 'aubergine'],
  exclude: ['sweet potato', 'ketchup'],
};
const STAGE_2_GLUTEN_CATEGORIES = ['Grain', 'PastaNoodles', 'PantryStaples'];

// category, 2026-08-26 -- added specifically so Insights' own diet-
// preference/allergy filter (lib/foodPersonalization.ts's
// foodMatchesDietPreferences, which needs a real category to run
// computeDietTags at all) can be applied to this lens too, the small,
// real schema gap named directly when that filter shipped everywhere else
// in Insights. Both real query functions below (queryStageGroup,
// foodsWithSubCriterionTag) already know this value -- it's the exact
// column they filter on -- so this is a plain SELECT addition, not a new
// join or a new concept.
export type StageFood = { foodId: number; source: string; baseName: string; category: string; subcategory: string | null };
export type StageFoodGroupResult = { label: string; foods: StageFood[] };

async function queryStageGroup(group: StageFoodGroup, limit: number): Promise<StageFood[]> {
  const db = await getReferenceDatabase();
  const keywordClause = group.keywords.length > 0 ? group.keywords.map(() => 'base_name LIKE ?').join(' OR ') : '1';
  const excludeClause = (group.exclude ?? []).map(() => 'base_name NOT LIKE ?').join(' AND ');
  const rows = await db.getAllAsync<StageFood>(
    `
      SELECT food_id AS foodId, source, base_name AS baseName, category, subcategory
      FROM foods
      WHERE hidden = 0 AND category = ? AND (${keywordClause})
      ${excludeClause ? `AND ${excludeClause}` : ''}
    `,
    stageGroupQueryParams(group),
  );
  const byName = new Map<string, StageFood>();
  for (const row of rows) {
    const key = row.baseName.toLowerCase();
    if (!byName.has(key)) byName.set(key, row);
  }
  return Array.from(byName.values())
    .sort((a, b) => a.baseName.localeCompare(b.baseName))
    .slice(0, limit);
}

function stageGroupQueryParams(group: StageFoodGroup): (string | number)[] {
  return [
    group.category,
    ...group.keywords.map((keyword) => `%${keyword}%`),
    ...(group.exclude ?? []).map((keyword) => `%${keyword}%`),
  ];
}

// Stage 1's own "eat" list -- grouped under real category headings
// (Proteins/Vegetables/Starches/Fruits/Fats), each group's own real,
// visible foods merged together when more than one STAGE_1_GROUPS entry
// shares the same label (Proteins spans both Meat and Dairy).
export async function listStage1Foods(): Promise<StageFoodGroupResult[]> {
  const results = new Map<string, StageFood[]>();
  for (const group of STAGE_1_GROUPS) {
    const foods = await queryStageGroup(group, 60);
    const existing = results.get(group.label) ?? [];
    results.set(group.label, [...existing, ...foods].sort((a, b) => a.baseName.localeCompare(b.baseName)));
  }
  return Array.from(results.entries()).map(([label, foods]) => ({ label, foods }));
}

// Reused by Stage 2's own goitrogenic-vegetables half of Round 1 -- real
// foods tagged with a given D1-D6 sub-criterion, any tier other than 'Not
// Assessed' (a real tag either way is the actual signal here, not which
// specific tier it landed on).
async function foodsWithSubCriterionTag(subCriterion: string, category: string, limit: number): Promise<StageFood[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<StageFood>(
    `
      SELECT DISTINCT f.food_id AS foodId, f.source, f.base_name AS baseName, f.category, f.subcategory
      FROM foods f
      JOIN food_scores fs ON fs.food_id = f.food_id AND fs.source = f.source
      JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
      WHERE f.hidden = 0 AND f.category = ? AND sc.sub_criterion = ? AND fs.tier != 'Not Assessed'
    `,
    category,
    subCriterion,
  );
  const byName = new Map<string, StageFood>();
  for (const row of rows) {
    const key = row.baseName.toLowerCase();
    if (!byName.has(key)) byName.set(key, row);
  }
  return Array.from(byName.values())
    .sort((a, b) => a.baseName.localeCompare(b.baseName))
    .slice(0, limit);
}

// Stage 2's own real reintroduction order, one round at a time --
// "cooked goitrogenic vegetables and legumes first; nightshades next;
// dairy next; gluten last."
export async function listStage2ReintroductionRounds(): Promise<StageFoodGroupResult[]> {
  const [legumes, goitrogenicVeg, nightshades, dairy] = await Promise.all([
    queryStageGroup(STAGE_2_LEGUME_GROUP, 60),
    foodsWithSubCriterionTag('Goitrogenic Load', 'Veg', 60),
    queryStageGroup(STAGE_2_NIGHTSHADE_GROUP, 60),
    queryStageGroup({ label: 'Round 3: Dairy', category: 'Dairy', keywords: [] }, 60),
  ]);

  const gluten = (
    await Promise.all(STAGE_2_GLUTEN_CATEGORIES.map((category) => foodsWithSubCriterionTag('Gluten', category, 40)))
  ).flat();

  const round1 = [...legumes, ...goitrogenicVeg].sort((a, b) => a.baseName.localeCompare(b.baseName));

  return [
    { label: 'Round 1: Cooked Goitrogenic Vegetables & Legumes', foods: round1 },
    { label: 'Round 2: Nightshades', foods: nightshades },
    { label: 'Round 3: Dairy', foods: dairy },
    { label: 'Round 4: Gluten', foods: gluten.sort((a, b) => a.baseName.localeCompare(b.baseName)).slice(0, 60) },
  ];
}

// Insights' own Today's Additives & Advisories lens, 2026-08-08 -- "Right
// now the alcohol/coffee/juice advisories only ever appear as small rows
// buried inside four individual Food builders, one item at a time. There's
// no single place to see everything those advisories cover across today's
// whole log" (Lens Coverage Audit). Deliberately scoped to the 3 advisories
// that already exist and already have real, verified per-food detection
// logic (isAlcoholicFood/isCoffeeFood/isJuiceFood, all leaf modules with no
// dependency back on this file, so importing them here carries no real
// circular-import risk -- see this file's own precedent with
// isFlaggedTier/sixDimensionsReference.ts just above for the same
// reasoning). NOT a real per-food additive-detection system (the still-
// unbuilt lib/additivesReference.ts CLAUDE.md names) -- that needs a real
// per-food additive-tagging data layer this database doesn't have yet, and
// guessing at one here would be exactly the kind of unverified claim this
// app's own research discipline avoids everywhere else.
export type TriggeredAdvisory = { kind: 'alcohol' | 'coffee' | 'juice'; foodName: string; mealName: string };

export async function getTodaysAdvisories(date: string): Promise<TriggeredAdvisory[]> {
  const meals = await listMealsForDate(date);
  const triggered: TriggeredAdvisory[] = [];
  const seenKeys = new Set<string>();

  for (const meal of meals) {
    const items = await getMealItems(meal.id);
    for (const item of items) {
      if (!item.foodId) continue;
      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;

      const identity = await getFoodIdentity(foodId, source);
      if (!identity) continue;
      const resolved = { category: identity.category, subcategory: identity.subcategory, baseName: identity.baseName };

      const checks: { kind: TriggeredAdvisory['kind']; matches: boolean }[] = [
        { kind: 'alcohol', matches: isAlcoholicFood(resolved) },
        { kind: 'coffee', matches: isCoffeeFood(resolved) },
        { kind: 'juice', matches: isJuiceFood(resolved) },
      ];
      for (const check of checks) {
        if (!check.matches) continue;
        const key = `${check.kind}|${foodId}|${source}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        triggered.push({ kind: check.kind, foodName: identity.baseName, mealName: meal.name || meal.meal_type });
      }
    }
  }

  return triggered;
}

export type DietarySex = 'male' | 'female';

export type DietaryReferenceIntake = {
  nutrientCode: string;
  displayName: string;
  sex: DietarySex | 'all';
  ageMin: number;
  ageMax: number | null;
  // 'RDA'/'AI' are intake floors (meet or exceed); 'CDRR' is the one
  // ceiling-type row in this table (sodium) -- amount there is a
  // recommended maximum, not a minimum, see notes.
  valueType: 'RDA' | 'AI' | 'CDRR';
  amount: number;
  unit: string;
  upperLimit: number | null;
  upperLimitType: string | null;
  sourceAgency: string;
  citation: string | null;
  notes: string | null;
};

export type SupplementForm = {
  nutrientCode: string;
  formName: string;
  absorptionNote: string;
  giToleranceNote: string | null;
  evidenceStrength: string;
  citation: string | null;
  notes: string | null;
};

// Resolves Dietary Reference Intake rows for a sex/age -- built from
// scripts/build_food_reference_db.py's dietary_reference_intakes table
// (NASEM DRIs for nonpregnant, nonlactating adults; see that file's
// comments for what's deliberately excluded).
//
// This app is deliberately gender-free by default: sex and age are only
// ever what the person explicitly enters in their own profile, never
// inferred or defaulted. Pass null for either (or both) when the person
// hasn't set it, and this returns every row that could apply rather than
// silently picking one -- e.g. with both unset, a nutrient with two sexes
// x two age bands comes back as 4 separate rows the caller/UI should show
// side by side, not collapse. Once the person does set a value, passing it
// narrows the result the same way a WHERE clause would.
//
// Assumes no nutrient currently has both a sex-specific row and an 'all'
// row covering the same age range (true of the seeded data) -- if that
// ever changes, this would need a tie-break preferring the sex-specific row.
export async function getDietaryReferenceIntakesForProfile(
  sex: DietarySex | null,
  ageYears: number | null,
  nutrientCode?: string,
) {
  const db = await getReferenceDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (sex) {
    conditions.push("(dri.sex = ? OR dri.sex = 'all')");
    params.push(sex);
  }
  if (ageYears != null) {
    conditions.push('dri.age_min <= ? AND (dri.age_max IS NULL OR dri.age_max >= ?)');
    params.push(ageYears, ageYears);
  }
  if (nutrientCode) {
    conditions.push('dri.nutrient_code = ?');
    params.push(nutrientCode);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.getAllAsync<DietaryReferenceIntake>(
    `
      SELECT
        dri.nutrient_code AS nutrientCode,
        n.display_name AS displayName,
        dri.sex AS sex,
        dri.age_min AS ageMin,
        dri.age_max AS ageMax,
        dri.value_type AS valueType,
        dri.amount AS amount,
        dri.unit AS unit,
        dri.upper_limit AS upperLimit,
        dri.upper_limit_type AS upperLimitType,
        dri.source_agency AS sourceAgency,
        dri.citation AS citation,
        dri.notes AS notes
      FROM dietary_reference_intakes dri
      JOIN nutrients n ON n.code = dri.nutrient_code
      ${whereClause}
      ORDER BY dri.nutrient_code, dri.sex, dri.age_min
    `,
    ...params,
  );
}

// Convenience wrapper that reads the person's own saved profile (if any)
// and resolves against it -- the common case for the meal/nutrient-gap UI.
export async function getDietaryReferenceIntakesForCurrentUser() {
  const profile = await getUserProfile();
  const ageYears = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null;
  return getDietaryReferenceIntakesForProfile(profile.sex, ageYears);
}

// Real supplement forms for a nutrient with their comparative
// absorption/GI-tolerance profile -- the "best absorption, easiest on the
// body" teaching content, kept separate from the DRI amount itself since it
// answers a different question (which form, not how much).
export async function getSupplementForms(nutrientCode: string) {
  const db = await getReferenceDatabase();
  return db.getAllAsync<SupplementForm>(
    `
      SELECT nutrient_code AS nutrientCode, form_name AS formName, absorption_note AS absorptionNote,
             gi_tolerance_note AS giToleranceNote, evidence_strength AS evidenceStrength, citation, notes
      FROM supplement_forms
      WHERE nutrient_code = ?
      ORDER BY evidence_strength, form_name
    `,
    nutrientCode,
  );
}

// When to take a given nutrient, what to avoid taking it with, and what
// pairs well with it -- added for My Meds, 2026-08-08. A separate table
// from supplement_forms (which answers "which chemical form"): this
// answers "when, and alongside what" -- a different question with its own
// citations, not a duplicate. See scripts/add_my_meds_reference_data.py
// for the real research behind every row.
export type NutrientTiming = {
  nutrientCode: string;
  solubility: string;
  bestTaken: string;
  avoidWith: string | null;
  pairsWellWith: string | null;
  citation: string | null;
  notes: string | null;
};

export async function getNutrientTiming(nutrientCode: string): Promise<NutrientTiming | null> {
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<{
    nutrient_code: string;
    solubility: string;
    best_taken: string;
    avoid_with: string | null;
    pairs_well_with: string | null;
    citation: string | null;
    notes: string | null;
  }>(
    `
      SELECT nutrient_code, solubility, best_taken, avoid_with, pairs_well_with, citation, notes
      FROM nutrient_timing
      WHERE nutrient_code = ?
    `,
    nutrientCode,
  );
  if (!row) return null;
  return {
    nutrientCode: row.nutrient_code,
    solubility: row.solubility,
    bestTaken: row.best_taken,
    avoidWith: row.avoid_with,
    pairsWellWith: row.pairs_well_with,
    citation: row.citation,
    notes: row.notes,
  };
}

// A real, deliberately bounded starting set of common medications -- see
// scripts/add_my_meds_reference_data.py's own header comment for exactly
// what's covered and why this is Phase 1 of an ongoing research project,
// not a claim of covering "every commonly prescribed medication." Powers
// My Meds' own "search before you type it in by hand" flow for
// prescriptions/OTC, the same "pick from a researched list, fall back to
// manual entry" shape this app already uses for the Food reference
// database.
export type CommonMedication = {
  id: string;
  genericName: string;
  commonBrandNames: string | null;
  drugClass: string;
  treatmentType: 'prescription' | 'otc';
  commonUse: string;
  thyroidRelevantNotes: string | null;
  timingGuidance: string | null;
  keyInteractions: string | null;
  commonSideEffects: string | null;
  evidenceStrength: string;
  citation: string | null;
  notes: string | null;
};

function mapCommonMedicationRow(row: {
  id: string;
  generic_name: string;
  common_brand_names: string | null;
  drug_class: string;
  treatment_type: string;
  common_use: string;
  thyroid_relevant_notes: string | null;
  timing_guidance: string | null;
  key_interactions: string | null;
  common_side_effects: string | null;
  evidence_strength: string;
  citation: string | null;
  notes: string | null;
}): CommonMedication {
  return {
    id: row.id,
    genericName: row.generic_name,
    commonBrandNames: row.common_brand_names,
    drugClass: row.drug_class,
    treatmentType: row.treatment_type as CommonMedication['treatmentType'],
    commonUse: row.common_use,
    thyroidRelevantNotes: row.thyroid_relevant_notes,
    timingGuidance: row.timing_guidance,
    keyInteractions: row.key_interactions,
    commonSideEffects: row.common_side_effects,
    evidenceStrength: row.evidence_strength,
    citation: row.citation,
    notes: row.notes,
  };
}

const COMMON_MEDICATION_COLUMNS =
  'id, generic_name, common_brand_names, drug_class, treatment_type, common_use, thyroid_relevant_notes, timing_guidance, key_interactions, common_side_effects, evidence_strength, citation, notes';

export async function listCommonMedications(): Promise<CommonMedication[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<Parameters<typeof mapCommonMedicationRow>[0]>(
    `SELECT ${COMMON_MEDICATION_COLUMNS} FROM common_medications ORDER BY generic_name`,
  );
  return rows.map(mapCommonMedicationRow);
}

// Matches against generic_name OR common_brand_names, so searching "Advil"
// finds ibuprofen just as well as searching "ibuprofen" itself -- the
// common real-world case, since most people know a medication by its
// brand name first.
export async function searchCommonMedications(query: string): Promise<CommonMedication[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const db = await getReferenceDatabase();
  const needle = `%${trimmed}%`;
  const rows = await db.getAllAsync<Parameters<typeof mapCommonMedicationRow>[0]>(
    `
      SELECT ${COMMON_MEDICATION_COLUMNS}
      FROM common_medications
      WHERE generic_name LIKE ? COLLATE NOCASE OR common_brand_names LIKE ? COLLATE NOCASE
      ORDER BY generic_name
    `,
    needle,
    needle,
  );
  return rows.map(mapCommonMedicationRow);
}

export type BodySystem = {
  code: string;
  displayName: string;
  description: string | null;
};

export type NutrientInteraction = {
  nutrientA: string;
  nutrientB: string;
  interactionType: string;
  summary: string;
  populationScope: string;
  citation: string | null;
};

export type NutrientSystemEffect = {
  nutrient: string;
  status: string;
  bodySystem: string;
  effectSummary: string;
  evidenceStrength: string;
  populationScope: string;
  citation: string | null;
};

// The physiology knowledge base: independently researched (not derived from
// the foods spreadsheet) documentation of how nutrients/hydration interact
// with each other and affect body systems -- built by
// populate_physiology_knowledge() in scripts/build_food_reference_db.py.
// First content slice: electrolytes & bioelectric function.
export async function getBodySystems() {
  const db = await getReferenceDatabase();
  return db.getAllAsync<BodySystem>(
    'SELECT code, display_name AS displayName, description FROM body_systems ORDER BY display_name',
  );
}

// Pass a nutrient code (e.g. "magnesium") to get every interaction involving
// it (as either nutrient_a or nutrient_b); omit it to get all interactions.
export async function getNutrientInteractions(nutrient?: string) {
  const db = await getReferenceDatabase();
  if (nutrient) {
    return db.getAllAsync<NutrientInteraction>(
      `
        SELECT nutrient_a AS nutrientA, nutrient_b AS nutrientB, interaction_type AS interactionType,
               summary, population_scope AS populationScope, citation
        FROM nutrient_interactions
        WHERE nutrient_a = ? OR nutrient_b = ?
        ORDER BY nutrient_a, nutrient_b
      `,
      nutrient,
      nutrient,
    );
  }

  return db.getAllAsync<NutrientInteraction>(
    `
      SELECT nutrient_a AS nutrientA, nutrient_b AS nutrientB, interaction_type AS interactionType,
             summary, population_scope AS populationScope, citation
      FROM nutrient_interactions
      ORDER BY nutrient_a, nutrient_b
    `,
  );
}

// Pass a nutrient code to get its effects across all body systems; pass a
// body system code to get every nutrient's effects on that one system; pass
// both to narrow to a single pairing; pass neither to get everything.
export async function getNutrientSystemEffects(filters: { nutrient?: string; bodySystem?: string } = {}) {
  const db = await getReferenceDatabase();
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.nutrient) {
    conditions.push('nutrient = ?');
    params.push(filters.nutrient);
  }
  if (filters.bodySystem) {
    conditions.push('body_system = ?');
    params.push(filters.bodySystem);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.getAllAsync<NutrientSystemEffect>(
    `
      SELECT nutrient, status, body_system AS bodySystem, effect_summary AS effectSummary,
             evidence_strength AS evidenceStrength, population_scope AS populationScope, citation
      FROM nutrient_system_effects
      ${whereClause}
      ORDER BY nutrient, body_system
    `,
    ...params,
  );
}

export type LabTestCategory = {
  code: string;
  displayName: string;
  description: string | null;
};

export type LabTest = {
  code: string;
  displayName: string;
  categoryCode: string;
  aliases: string | null;
  whatItMeasures: string;
  whyItMattersHashimotos: string;
  typicalRangeLow: number | null;
  typicalRangeHigh: number | null;
  rangeUnit: string | null;
  // Always present -- real reference ranges vary by lab/assay/sex/age, so
  // typicalRangeLow/High above is educational context, never a substitute
  // for the range the person's own lab reports alongside their result.
  rangeCaveat: string;
  isCommonlyOrdered: boolean;
  selfAdvocacyNote: string | null;
  evidenceStrength: string;
  citation: string;
};

const LAB_TEST_SELECT_COLUMNS = `
  code, display_name AS displayName, category_code AS categoryCode, aliases,
  what_it_measures AS whatItMeasures, why_it_matters_hashimotos AS whyItMattersHashimotos,
  typical_range_low AS typicalRangeLow, typical_range_high AS typicalRangeHigh,
  range_unit AS rangeUnit, range_caveat AS rangeCaveat, is_commonly_ordered AS isCommonlyOrdered,
  self_advocacy_note AS selfAdvocacyNote, evidence_strength AS evidenceStrength, citation
`;

export async function getLabTestCategories() {
  const db = await getReferenceDatabase();
  return db.getAllAsync<LabTestCategory>(
    'SELECT code, display_name AS displayName, description FROM lab_test_categories ORDER BY display_name',
  );
}

// The educational "what is this test, why does it matter for Hashimoto's,
// should I be asking my doctor for it" reference content -- omit
// categoryCode to get every test across all five categories.
export async function getLabTests(categoryCode?: string) {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<Omit<LabTest, 'isCommonlyOrdered'> & { isCommonlyOrdered: number }>(
    categoryCode
      ? `SELECT ${LAB_TEST_SELECT_COLUMNS} FROM lab_tests WHERE category_code = ? ORDER BY display_name`
      : `SELECT ${LAB_TEST_SELECT_COLUMNS} FROM lab_tests ORDER BY category_code, display_name`,
    ...(categoryCode ? [categoryCode] : []),
  );

  return rows.map((row) => ({ ...row, isCommonlyOrdered: Boolean(row.isCommonlyOrdered) }));
}

export async function getLabTest(code: string): Promise<LabTest | null> {
  const db = await getReferenceDatabase();
  const row = await db.getFirstAsync<Omit<LabTest, 'isCommonlyOrdered'> & { isCommonlyOrdered: number }>(
    `SELECT ${LAB_TEST_SELECT_COLUMNS} FROM lab_tests WHERE code = ?`,
    code,
  );

  return row ? { ...row, isCommonlyOrdered: Boolean(row.isCommonlyOrdered) } : null;
}

export type AssessmentDomain = {
  code: string;
  displayName: string;
  description: string;
  scoringMethod: string;
  framingNote: string;
  citation: string;
};

export type AssessmentResponseType = 'severity_0_4' | 'vas_0_100_10step' | 'frequency_days_0_10' | 'wellbeing_0_5';

export type AssessmentItem = {
  code: string;
  domainCode: string;
  prompt: string;
  responseType: AssessmentResponseType;
  sortOrder: number;
};

// The question content for the periodic self-assessment (see
// scripts/build_food_reference_db.py's populate_assessment_content for the
// real citations each domain is modeled on).
export async function getAssessmentDomains() {
  const db = await getReferenceDatabase();
  return db.getAllAsync<AssessmentDomain>(
    `
      SELECT code, display_name AS displayName, description, scoring_method AS scoringMethod,
             framing_note AS framingNote, citation
      FROM assessment_domains
      ORDER BY code
    `,
  );
}

export async function getAssessmentItems(domainCode?: string) {
  const db = await getReferenceDatabase();
  return db.getAllAsync<AssessmentItem>(
    `
      SELECT code, domain_code AS domainCode, prompt, response_type AS responseType, sort_order AS sortOrder
      FROM assessment_items
      ${domainCode ? 'WHERE domain_code = ?' : ''}
      ORDER BY domain_code, sort_order
    `,
    ...(domainCode ? [domainCode] : []),
  );
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DB_NAME);
  }

  return databasePromise;
}

// A thin, memoizing shell -- every real caller (app/_layout.tsx's own two
// concurrent effects, getReferenceDatabase()'s own internal call, and
// anything else that calls this) now shares the exact same one real
// initialization run rather than each independently re-executing the full
// migration body. See initializeDatabasePromise's own comment above for
// why this was needed.
export async function initializeDatabase() {
  if (!initializeDatabasePromise) {
    initializeDatabasePromise = runDatabaseInitialization();
  }
  return initializeDatabasePromise;
}

async function runDatabaseInitialization() {
  const db = await getDatabase();

  try {
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        eaten_at TEXT NOT NULL,
        notes TEXT,
        source_type TEXT NOT NULL DEFAULT 'manual',
        favorite_id TEXT,
        is_immediate INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS meal_items (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        dish_name TEXT,
        side_name TEXT,
        dish_servings REAL,
        your_share_percent REAL,
        cooking_method TEXT,
        serving_size REAL,
        serving_unit TEXT,
        quantity REAL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
      );

      -- Meal Builder's own record of WHICH saved sub-builder records a meal
      -- is made of -- 2026-08-02, added alongside Meal Builder itself.
      -- meal_items above (the flattened ingredient copy) is what every
      -- already-built screen reads for scoring -- Insights' Whole Day view,
      -- Trends' three lenses, Home's rings -- and stays exactly as it's
      -- always been, untouched. But flattening is lossy: once a side's
      -- ingredients are copied into meal_items rows, there's no link back
      -- to which 'sides' row they came from, only a text dish_name. This
      -- table is what re-opening a meal INSIDE Meal Builder itself needs
      -- to show the real picker state (the 3 things you actually picked)
      -- instead of a flat ingredient soup -- it's bookkeeping for the
      -- builder, not a second copy of the data meal_items already owns.
      -- component_type reuses the exact itemType strings already
      -- established across food-items.tsx/food-item-detail.tsx (no new
      -- vocabulary): 'side' | 'salad' | 'smoothie' | 'fermentation' |
      -- 'beverage' | 'snack' | 'bakedGoods' | 'soup' | 'sauce' | 'handheld'.
      -- component_id is a plain TEXT reference (no FK constraint) into
      -- whichever of the 10 tables component_type says -- SQLite has no way
      -- to express "FK into one of N tables depending on a sibling column,"
      -- so a component whose own saved record is later deleted just becomes
      -- unresolvable (see lib/db.ts's own resolveMealComponent, which
      -- returns null for exactly this case) rather than a broken FK.
      CREATE TABLE IF NOT EXISTS meal_components (
        id TEXT PRIMARY KEY,
        meal_id TEXT NOT NULL,
        component_type TEXT NOT NULL,
        component_id TEXT NOT NULL,
        your_share_percent REAL NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        name TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        last_used_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- The raw material the trend/correlation engine works from: a
      -- moment-in-time report of how the person actually feels. Covers
      -- both directions on purpose -- "felt great after this meal" is
      -- just as valuable a data point as "bloated again" for finding real
      -- personal patterns, and early on (before enough history exists to
      -- see a trend) logging the positives is what keeps the habit going.
      -- checkin_type says what prompted it; valence says whether it was
      -- good, bad, or just informational (e.g. a sleep-hours entry isn't
      -- inherently positive or negative on its own).
      CREATE TABLE IF NOT EXISTS wellbeing_checkins (
        id TEXT PRIMARY KEY,
        logged_at TEXT NOT NULL,
        checkin_type TEXT NOT NULL,
        valence TEXT NOT NULL,
        severity INTEGER,
        notes TEXT,
        related_meal_id TEXT,
        related_exercise_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (related_meal_id) REFERENCES meals(id),
        FOREIGN KEY (related_exercise_id) REFERENCES exercise_logs(id)
      );

      -- One check-in can carry several tags at once (e.g. bloating +
      -- fatigue), so this is a child table rather than a single column --
      -- tag_code values come from lib/checkinTags.ts, kept as app-level UI
      -- vocabulary rather than bundled/cited reference content, since
      -- these are just labels for what the person is reporting, not a
      -- researched medical claim the way the D1-D6 tiers are.
      CREATE TABLE IF NOT EXISTS checkin_tags (
        id TEXT PRIMARY KEY,
        checkin_id TEXT NOT NULL,
        tag_code TEXT NOT NULL,
        FOREIGN KEY (checkin_id) REFERENCES wellbeing_checkins(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS exercise_logs (
        id TEXT PRIMARY KEY,
        logged_at TEXT NOT NULL,
        exercise_type TEXT NOT NULL,
        duration_minutes REAL,
        intensity TEXT,
        step_count INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- One row per calendar day (date is the primary key, so recording
      -- today's count again is always an upsert, never a duplicate).
      -- source distinguishes a device-sensor reading from a manually
      -- typed-in count -- manual entry always needs to stay available
      -- since live sensor step tracking is unreliable on Android today
      -- (see lib/pedometer.ts), and even where it works, a person should
      -- still be able to correct a reading.
      CREATE TABLE IF NOT EXISTS daily_step_counts (
        date TEXT PRIMARY KEY,
        step_count INTEGER NOT NULL,
        source TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Weight and any tape-measure/body-composition figure the person
      -- wants to track, e.g. 'weight', 'waist', 'hips', 'body_fat_pct' --
      -- one row per reading rather than fixed columns, so a new
      -- measurement type is a query, not a migration (same reasoning as
      -- the normalized food_nutrients table).
      CREATE TABLE IF NOT EXISTS body_measurements (
        id TEXT PRIMARY KEY,
        logged_at TEXT NOT NULL,
        measurement_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS treatments (
        id TEXT PRIMARY KEY,
        treatment_type TEXT NOT NULL,
        name TEXT NOT NULL,
        dose_amount REAL,
        dose_unit TEXT,
        frequency TEXT,
        start_date TEXT,
        end_date TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- One row per nutrient actually contained in a treatment of type
      -- 'supplement' -- a single-ingredient product (e.g. plain magnesium
      -- glycinate) gets one row here; a multivitamin gets one row per
      -- nutrient it lists on the label. dose_amount/dose_unit on the
      -- parent treatments row are unused for supplements (they stay
      -- meaningful for prescriptions, which are genuinely single-substance);
      -- units_per_day/serving_unit_label on the parent row describe how
      -- many capsules/tablets/scoops/gummies are taken daily, and every
      -- nutrient's daily total is amount_per_unit * treatments.units_per_day.
      CREATE TABLE IF NOT EXISTS treatment_nutrients (
        id TEXT PRIMARY KEY,
        treatment_id TEXT NOT NULL,
        nutrient_code TEXT NOT NULL,
        supplement_form TEXT,
        amount_per_unit REAL NOT NULL,
        unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_treatment_nutrients_treatment ON treatment_nutrients(treatment_id);

      -- Single-row table (id is always 1) for the primary user's own
      -- optional sex/age/diagnosis info. All three are nullable on purpose
      -- -- the app must never assume a value the person hasn't actually
      -- given it; callers should treat an unset field as "show every
      -- applicable population" rather than guessing one.
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        sex TEXT,
        birth_date TEXT,
        has_hashimotos INTEGER,
        height_cm REAL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- The real multi-condition model, added 2026-08-08 alongside the
      -- Rheumatoid Arthritis build -- supersedes user_profile.has_hashimotos
      -- as the source of truth going forward, but that column is
      -- deliberately left in place rather than dropped (SQLite column
      -- removal is a real table-rebuild migration, not worth the risk for
      -- a column that's now simply unused). One row per condition the
      -- person has said they have; condition_code matches conditions.code
      -- in the bundled reference database, the same cross-database
      -- free-text-reference pattern nutrient_code/test_code already use.
      -- getUserConditions() below one-time-migrates an existing
      -- has_hashimotos=1 into this table the first time it's read, so
      -- nobody who already answered that question loses their answer.
      CREATE TABLE IF NOT EXISTS user_conditions (
        condition_code TEXT PRIMARY KEY,
        selected_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- 2026-08-23, direct request, built specifically for Home's own
      -- "A Few Things Worth Knowing" flip cards: "they should be able to
      -- select to include data from any of the other conditions... this
      -- shouldn't mean that those conditions are now added to their own
      -- that the app tracks and helps with." A deliberately separate table
      -- from user_conditions above, same shape (one row per condition
      -- code), so curiosity about a condition can never be confused with
      -- actually having it: nothing that reads user_conditions (condition
      -- scoring, medication interaction rules, the healing-stage system)
      -- ever touches this table, and nothing here ever writes to that one.
      CREATE TABLE IF NOT EXISTS curious_about_conditions (
        condition_code TEXT PRIMARY KEY,
        selected_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- 2026-08-24, direct request: "the type of diet a person is trying
      -- to follow or is interested in trying should be in the Profile."
      -- One row per diet a person is following or curious about; diet_tag
      -- stores the same string values as RecipeDietTag (lib/digest/types.ts,
      -- 'Vegan', 'Mediterranean', 'AIP', and so on), the vocabulary
      -- already computed per-recipe, so this list lines up directly
      -- against real, existing recipe data rather than inventing a second
      -- one. Same shape as curious_about_conditions just above, and the
      -- same "trying vs. curious" distinction doesn't apply here the way
      -- it does for conditions: following a diet and being curious about
      -- it both just mean "show me more of this," so one table covers
      -- both rather than splitting into two.
      CREATE TABLE IF NOT EXISTS diet_preferences (
        diet_tag TEXT PRIMARY KEY,
        selected_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- The person's own real, individually-declared food allergies,
      -- 2026-08-09, explicitly requested inside Profile's own "conditions
      -- area." allergen_name IS the primary key (the same natural-key
      -- pattern user_conditions above already uses) -- normalized to a
      -- consistent capitalization by addFoodAllergy() before ever reaching
      -- this table, so "peanuts" and "Peanuts" can't silently become two
      -- separate rows. One row per allergy; a person can have as many as
      -- they need, matching the direct "they might have multiple" request.
      CREATE TABLE IF NOT EXISTS user_food_allergies (
        allergen_name TEXT PRIMARY KEY,
        added_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- The person's own personal interaction rules, 2026-08-18 -- the
      -- second half of the interaction rules engine named in this app's
      -- own Architecture section from the start ("lets the individual
      -- user encode their own discovered pattern or their own doctor's
      -- specific instruction to them"). Local-only, unlike the bundled,
      -- cited interaction_rules table in the reference database -- this
      -- is the person's own content, never shared research, and must
      -- stay visually distinct wherever it's shown (see
      -- evaluateInteractionRules in lib/interactionRules.ts and
      -- MyMedsView in app/(tabs)/insights.tsx). link_type is 'none'
      -- (always shown, nothing to check), 'food' (link_value is a plain
      -- keyword checked against today's logged food names), or
      -- 'treatment' (link_value is a treatments.id, shown only while
      -- that treatment is currently active). link_label is a snapshot
      -- for display (the typed food keyword, or the treatment's own
      -- name at the time the rule was made) so the management list can
      -- show something meaningful even if the underlying treatment is
      -- later renamed or removed. A deliberately simple v1 -- no timing
      -- math the way the cited rules have; see lib/interactionRules.ts's
      -- own matchingPersonalRules for exactly what "currently applies"
      -- means for each link_type.
      CREATE TABLE IF NOT EXISTS personal_rules (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'self',
        link_type TEXT NOT NULL DEFAULT 'none',
        link_value TEXT,
        link_label TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Self-declared stage/phase within a real, condition-specific staged
      -- framework, 2026-08-09 -- see lib/conditionStages.ts's own
      -- CONDITION_STAGING_MODELS for the real, per-condition frameworks
      -- this drives (Hashimoto's own Wentz Healing Stages; IBS's own real,
      -- standard low-FODMAP elimination/reintroduction/personalization
      -- protocol; more to follow incrementally). condition_code is the
      -- same free-text cross-database reference user_conditions already
      -- uses. One row per condition the person has actually declared a
      -- stage for -- a real, deliberate replacement for this table's own
      -- first, Hashimoto's-only attempt (a single user_profile.healing_
      -- stage column), reverted the same day once a second real condition
      -- (IBS) needed its own, differently-shaped stage set -- no real
      -- users existed yet to migrate, so this was a clean swap, not a
      -- live migration.
      CREATE TABLE IF NOT EXISTS user_condition_stages (
        condition_code TEXT PRIMARY KEY,
        stage_code TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- A real, genuine share someone sent, staged here rather than
      -- immediately, permanently saved -- 2026-08-15 direct request:
      -- "Recipes Shared With Me" in My Kitchen, staying until the person
      -- decides to save it to their own recipes/favorites or just delete
      -- it. kind mirrors ShareEnvelope's own payload.kind
      -- ('component'|'meal', see lib/sharing.ts); component_type is only
      -- ever set for a real 'component' share. payload_json is the real
      -- ShareComponentPayload/ShareMealPayload, minus its own photoBase64
      -- field (decoded into photo_uri, a real local file, at stage time --
      -- no reason to keep the same image bytes twice). sender_public_key_
      -- base64 (step 5 of the real device-pairing prerequisite list,
      -- 2026-08-15 -- see lib/sharing.ts's own decodeShareEnvelope/
      -- ShareEnvelope) is the real, already-verified Ed25519 public key
      -- the share was genuinely signed with -- stored so a staged item's
      -- own "Verified: this is your connection X" status can be computed
      -- LIVE, at display time, via getConnectionByPublicKey, rather than
      -- baked in as a stale boolean the moment it's staged (a real,
      -- deliberate choice: if the person later adds this same sender as a
      -- Connection, an already-staged, previously-unverified share
      -- correctly starts showing as verified too, without needing to be
      -- re-received).
      CREATE TABLE IF NOT EXISTS shared_recipes (
        id TEXT PRIMARY KEY,
        from_name TEXT NOT NULL,
        kind TEXT NOT NULL,
        component_type TEXT,
        payload_json TEXT NOT NULL,
        photo_uri TEXT,
        sender_public_key_base64 TEXT,
        received_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Step 3 of the real device-pairing prerequisite list (see
      -- CLAUDE.md's own "Sharing individual recipes between two people"
      -- security-requirement note), 2026-08-15 -- a real, standing roster
      -- of people this device has actually paired with, kept so a later
      -- share to the same person doesn't need to re-pair. public_key_base64
      -- is that person's own real Ed25519 public key (the same base64
      -- encoding lib/deviceIdentity.ts already uses for this device's own
      -- key), UNIQUE by design -- two different named connections
      -- legitimately sharing one real public key would mean either a
      -- duplicate pairing or a genuine key-reuse/spoofing problem, not a
      -- normal state to allow silently. name is a plain, trusted display
      -- string the person themselves chose while pairing (e.g. "Lisa"),
      -- not itself cryptographically verified -- the public key is the
      -- real, checkable identity; the name is just how it reads in this
      -- app's own UI. Deliberately just the table + its own direct CRUD
      -- this pass (see lib/connections.ts) -- no real invitation/pairing
      -- exchange writes to this yet (that's step 4 of the same list), and
      -- no real signature verification reads from it yet (step 5).
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        public_key_base64 TEXT NOT NULL UNIQUE,
        paired_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- The person's own actual lab results over time. test_code matches
      -- lab_tests.code in the bundled reference database (a cross-database
      -- free-text reference, the same pattern nutrient_code already uses
      -- for treatment_nutrients). lab_range_low/high are what THIS
      -- specific lab reported alongside the result -- kept separate from
      -- the reference database's typical_range_low/high, since the
      -- person's own lab/assay range is what actually determines whether
      -- their result was flagged, not the educational reference figure.
      CREATE TABLE IF NOT EXISTS lab_results (
        id TEXT PRIMARY KEY,
        test_code TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        lab_range_low REAL,
        lab_range_high REAL,
        tested_at TEXT NOT NULL,
        lab_name TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_lab_results_test_code ON lab_results(test_code, tested_at);

      -- A periodic, retakeable multi-domain self-assessment (hypothyroid
      -- symptoms, digestive/IBS, wellbeing -- see assessment_domains/
      -- assessment_items in the bundled reference DB for the actual
      -- question content). Each completion is its own row so a trend of
      -- scores over time can be shown -- the whole point being to make
      -- progress visible when day-to-day change is too gradual to notice
      -- on its own.
      CREATE TABLE IF NOT EXISTS symptom_assessments (
        id TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_symptom_assessments_completed_at ON symptom_assessments(completed_at);

      CREATE TABLE IF NOT EXISTS symptom_assessment_responses (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        item_code TEXT NOT NULL,
        response_value REAL NOT NULL,
        FOREIGN KEY (assessment_id) REFERENCES symptom_assessments(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_symptom_assessment_responses_assessment ON symptom_assessment_responses(assessment_id);

      CREATE TABLE IF NOT EXISTS schedule_items (
        id TEXT PRIMARY KEY,
        scheduled_for TEXT NOT NULL,
        item_type TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'planned',
        notes TEXT,
        linked_meal_id TEXT,
        linked_treatment_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (linked_meal_id) REFERENCES meals(id),
        FOREIGN KEY (linked_treatment_id) REFERENCES treatments(id)
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- A new food being reintroduced/trialed, watched for a problem over
      -- observation_days before being cleared -- distinct from
      -- wellbeing_checkins (a moment-in-time report) because a trial is a
      -- stateful thing in progress: it has a start date, a window still
      -- open or closed, and an eventual resolution ('cleared' or
      -- 'flagged'), not just a single logged observation. food_id/source/
      -- prep_method/condition_code (2026-08-14, real ALTER TABLE additions,
      -- see runDatabaseInitialization) are the structured version: a real
      -- reference-database food, the exact prep state being tested, and
      -- which tracked condition prompted the test -- all optional, so the
      -- original free-text-only flow keeps working unchanged.
      CREATE TABLE IF NOT EXISTS food_trials (
        id TEXT PRIMARY KEY,
        food_name TEXT NOT NULL,
        started_at TEXT NOT NULL,
        observation_days INTEGER NOT NULL DEFAULT 3,
        status TEXT NOT NULL DEFAULT 'trialing',
        resolved_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- A "Side" saved on its own, independent of any meal or eaten time --
      -- 2026-08-01, the first real persistence for the rebuilt Food tab's
      -- builders. Deliberately NOT a meals row (that table's own
      -- eaten_at/meal_type shape assumes something eaten at a specific
      -- moment, which a freshly-built side isn't yet) and NOT a
      -- favorites row either (a favorite is an explicit "save this as a
      -- reusable template" action, which Side Builder doesn't do -- see
      -- FOOD_LENS_COPY's own note in app/(tabs)/food.tsx). This is its own
      -- third thing: a real, saved side, meant to be assembled into an
      -- actual meal later once Meal Builder exists to do that assembling.
      -- The other nine Food builders (Salad, Smoothie, etc.) are expected
      -- to get their own similarly-shaped tables as each is built out,
      -- rather than forcing every builder's own kind of "thing" into one
      -- shared generic table.
      CREATE TABLE IF NOT EXISTS sides (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- cut_prep has no equivalent column on meal_items -- it's a field
      -- Side Builder introduced 2026-07-31, after meal_items' own schema
      -- was designed for the old (deleted) meal builder, which never asked
      -- the question at all.
      CREATE TABLE IF NOT EXISTS side_ingredients (
        id TEXT PRIMARY KEY,
        side_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (side_id) REFERENCES sides(id) ON DELETE CASCADE
      );

      -- Salad Builder's own real persistence, 2026-08-02 -- same third-thing
      -- reasoning as sides/side_ingredients directly above (not a meals row,
      -- not a favorites row), same shape, its own table rather than reusing
      -- sides: a salad is conceptually its own kind of thing to Meal Builder
      -- later (its own item in the "what am I assembling this meal from"
      -- list), and per-builder tables were the explicit decision made when
      -- sides/side_ingredients were first added (see that comment).
      CREATE TABLE IF NOT EXISTS salads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS salad_ingredients (
        id TEXT PRIMARY KEY,
        salad_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (salad_id) REFERENCES salads(id) ON DELETE CASCADE
      );

      -- Smoothie Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients and
      -- salads/salad_ingredients above.
      CREATE TABLE IF NOT EXISTS smoothies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS smoothie_ingredients (
        id TEXT PRIMARY KEY,
        smoothie_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (smoothie_id) REFERENCES smoothies(id) ON DELETE CASCADE
      );

      -- Fermentation Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients,
      -- salads/salad_ingredients, and smoothies/smoothie_ingredients above.
      -- Real bacterial-strain tracking (once flagged here as a separate
      -- future research workstream) is now built -- see
      -- fermentation_batch_strains just below, plus the reference-DB-side
      -- fermentation_strains/curated_recipe_strains tables added 2026-08-14
      -- via scripts/add_fermentation_strains.py.
      CREATE TABLE IF NOT EXISTS fermentations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS fermentation_ingredients (
        id TEXT PRIMARY KEY,
        fermentation_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (fermentation_id) REFERENCES fermentations(id) ON DELETE CASCADE
      );

      -- 2026-08-14 -- a real many-to-many link between one saved
      -- fermentation batch and the real strain(s) actually used in it.
      -- Deliberately local, not reference-DB content (unlike
      -- fermentation_strains itself, the real strain catalog, which lives
      -- in the bundled reference database) -- this table records a real
      -- person's own choice for their own saved batch. strain_id is a
      -- plain, unenforced reference into the reference DB's own
      -- fermentation_strains table, resolved at the application layer, the
      -- same "no real cross-file SQL FK, food_id/source already cross this
      -- exact boundary the identical way" pattern this whole app already
      -- uses everywhere else.
      CREATE TABLE IF NOT EXISTS fermentation_batch_strains (
        id TEXT PRIMARY KEY,
        fermentation_id TEXT NOT NULL,
        strain_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (fermentation_id) REFERENCES fermentations(id) ON DELETE CASCADE
      );

      -- The Fermentation Tracker, 2026-08-20 -- fermentations above is a
      -- saved RECIPE (ingredients, nutrition), not a physical jar actually
      -- in progress on someone's counter. This is the real, separate thing
      -- that needed its own table: one row per real jar, moving through
      -- real stages from the day it's started to the day it's ready to
      -- drink. Mirrors the precedent garden_harvests/garden_task_links and
      -- food_trial_task_links already set (see their own comments further
      -- up) rather than inventing a new pattern -- a schedule_items row per
      -- reminder (item_type='fermentation'), linked back here the same way
      -- a garden task links back to its own plot/planting.
      CREATE TABLE IF NOT EXISTS fermentation_batches (
        id TEXT PRIMARY KEY,
        fermentation_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        started_at TEXT NOT NULL,
        stage_changed_at TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (fermentation_id) REFERENCES fermentations(id) ON DELETE CASCADE
      );

      -- Same real, basic Scheduler tie-in as garden_task_links/
      -- food_trial_task_links -- one row per reminder SERIES (only the
      -- first occurrence gets linked, the same honest Phase-1 scope limit
      -- those two tables already carry), traced back to the batch it's
      -- actually about.
      CREATE TABLE IF NOT EXISTS fermentation_task_links (
        schedule_item_id TEXT PRIMARY KEY,
        fermentation_batch_id TEXT NOT NULL,
        FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id) ON DELETE CASCADE,
        FOREIGN KEY (fermentation_batch_id) REFERENCES fermentation_batches(id) ON DELETE CASCADE
      );

      -- "My Fermented Drinks" -- mirrors garden_harvests exactly (see its
      -- own comment further up for the full reasoning): something made, on
      -- hand in a real quantity, drawn down as it's actually drunk, until
      -- the person tells the app it's gone. quantity_remaining always
      -- starts equal to quantity, same authoritative-single-number
      -- reasoning as garden_harvests.
      CREATE TABLE IF NOT EXISTS fermentation_harvests (
        id TEXT PRIMARY KEY,
        fermentation_batch_id TEXT,
        fermentation_id TEXT NOT NULL,
        drink_name TEXT NOT NULL,
        ready_at TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        quantity_remaining REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (fermentation_batch_id) REFERENCES fermentation_batches(id) ON DELETE SET NULL,
        FOREIGN KEY (fermentation_id) REFERENCES fermentations(id) ON DELETE CASCADE
      );

      -- Beverage Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients,
      -- salads/salad_ingredients, smoothies/smoothie_ingredients, and
      -- fermentations/fermentation_ingredients above.
      CREATE TABLE IF NOT EXISTS beverages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS beverage_ingredients (
        id TEXT PRIMARY KEY,
        beverage_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (beverage_id) REFERENCES beverages(id) ON DELETE CASCADE
      );

      -- Snack Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients,
      -- salads/salad_ingredients, smoothies/smoothie_ingredients,
      -- fermentations/fermentation_ingredients, and
      -- beverages/beverage_ingredients above.
      CREATE TABLE IF NOT EXISTS snacks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS snack_ingredients (
        id TEXT PRIMARY KEY,
        snack_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (snack_id) REFERENCES snacks(id) ON DELETE CASCADE
      );

      -- Baked Goods Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients,
      -- salads/salad_ingredients, smoothies/smoothie_ingredients,
      -- fermentations/fermentation_ingredients, beverages/
      -- beverage_ingredients, and snacks/snack_ingredients above.
      CREATE TABLE IF NOT EXISTS baked_goods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS baked_goods_ingredients (
        id TEXT PRIMARY KEY,
        baked_good_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (baked_good_id) REFERENCES baked_goods(id) ON DELETE CASCADE
      );

      -- Soup Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients,
      -- salads/salad_ingredients, smoothies/smoothie_ingredients,
      -- fermentations/fermentation_ingredients, beverages/
      -- beverage_ingredients, snacks/snack_ingredients, and baked_goods/
      -- baked_goods_ingredients above.
      CREATE TABLE IF NOT EXISTS soups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS soup_ingredients (
        id TEXT PRIMARY KEY,
        soup_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (soup_id) REFERENCES soups(id) ON DELETE CASCADE
      );

      -- Sauces Builder's own real persistence, 2026-08-02 -- same
      -- per-builder-table reasoning as sides/side_ingredients through
      -- soups/soup_ingredients above. Table/column names stay singular
      -- ("sauces"/"sauce_ingredients"/"sauce_id") even though the
      -- component itself is SaucesBuilder (matching the plural lens key) --
      -- see that file's own top comment for why.
      CREATE TABLE IF NOT EXISTS sauces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sauce_ingredients (
        id TEXT PRIMARY KEY,
        sauce_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (sauce_id) REFERENCES sauces(id) ON DELETE CASCADE
      );

      -- Handhelds Builder's own real persistence, 2026-08-04 -- same
      -- per-builder-table reasoning as sides/side_ingredients through
      -- sauces/sauce_ingredients above. Table/column names stay singular
      -- ("handhelds"/"handheld_ingredients"/"handheld_id") even though the
      -- component itself is HandheldsBuilder (matching the plural lens
      -- key) -- see that file's own top comment for why, the same pattern
      -- already established for Sauces.
      CREATE TABLE IF NOT EXISTS handhelds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS handheld_ingredients (
        id TEXT PRIMARY KEY,
        handheld_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (handheld_id) REFERENCES handhelds(id) ON DELETE CASCADE
      );

      -- Dessert Builder's own real persistence, 2026-08-14 -- the twelfth
      -- builder, same per-builder-table reasoning as sides/side_ingredients
      -- through handhelds/handheld_ingredients above. Table/column names
      -- stay singular ("desserts"/"dessert_ingredients"/"dessert_id"),
      -- matching this builder's own singular lens key -- no Sauces/
      -- Handhelds-style plural-key exception was needed here (see
      -- DessertBuilder.tsx's own top comment). The 7 calculator_* columns
      -- are declared directly here rather than added via a later ALTER
      -- TABLE migration the way beverage_ingredients/fermentation_
      -- ingredients/sauce_ingredients/soup_ingredients needed (this table
      -- never existed before Dessert Builder's own category allowlist
      -- already included Alcohol, so there's no earlier, column-less
      -- version of this table to migrate) -- see AlcoholCalculatorPanel's
      -- own design and the four ALTER TABLE blocks above this one for the
      -- full reasoning behind what each column holds.
      CREATE TABLE IF NOT EXISTS desserts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        servings REAL NOT NULL,
        serving_size_amount REAL NOT NULL,
        serving_size_unit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS dessert_ingredients (
        id TEXT PRIMARY KEY,
        dessert_id TEXT NOT NULL,
        food_id TEXT,
        food_name TEXT NOT NULL,
        category TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        cut_prep TEXT NOT NULL,
        cooking_method TEXT NOT NULL,
        prep_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        calculator_volume_ml REAL,
        calculator_abv_percent REAL,
        calculator_residual_sugar_g_per_l REAL,
        calculator_retention_id TEXT,
        calculator_pours REAL,
        calculator_calories REAL,
        calculator_carbs_g REAL,
        FOREIGN KEY (dessert_id) REFERENCES desserts(id) ON DELETE CASCADE
      );

      -- Home Gardening tracking, 2026-08-13 -- a real, standalone place to
      -- log where food is actually grown (a plot), what's growing in it (a
      -- planting), and what's actually come out of it (a harvest), the last
      -- of which is what makes a harvest surface as a real, selectable
      -- ingredient source in FoodLookup.tsx (see listAvailableHarvests
      -- below). All three are local-only app tables, not part of the
      -- bundled reference database -- a plot/planting is entirely personal
      -- record-keeping, and a harvest's own food_id/source still points
      -- into the real, shared reference database (via getFoodIdentity),
      -- so its nutrition/6-DFF scoring is the identical real data every
      -- other ingredient already uses, never a second, separate copy.
      CREATE TABLE IF NOT EXISTS garden_plots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location_type TEXT NOT NULL, -- 'outdoor' | 'indoor' | 'greenhouse'
        growing_medium TEXT,
        light_source TEXT,
        size_description TEXT,
        notes TEXT,
        archived_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- One row per real food being grown in one plot right now (or in the
      -- past, once its own status moves off 'growing') -- food_id/source
      -- point at the same real reference-database row every Food builder
      -- already resolves an ingredient to, so "what am I growing" and "what
      -- did I harvest from it" both stay tied to real, already-scored food
      -- identity rather than a free-text crop name with no real nutrition
      -- data behind it.
      CREATE TABLE IF NOT EXISTS garden_plantings (
        id TEXT PRIMARY KEY,
        plot_id TEXT NOT NULL,
        food_id INTEGER NOT NULL,
        source TEXT NOT NULL,
        food_name TEXT NOT NULL,
        variety_note TEXT,
        planted_at TEXT NOT NULL,
        expected_harvest_start TEXT,
        expected_harvest_end TEXT,
        status TEXT NOT NULL DEFAULT 'growing', -- 'growing' | 'harvested' | 'failed' | 'removed'
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (plot_id) REFERENCES garden_plots(id) ON DELETE CASCADE
      );

      -- A real, logged harvest -- planting_id is optional (a real harvest
      -- can be logged without ever having logged the planting it grew
      -- from, e.g. an already-established perennial fruit tree) but when
      -- present ties it back to the plot/planting it came from. Real, hard
      -- inventory tracking: quantity_remaining starts equal to quantity and
      -- is drawn down by recordHarvestUsage() every time a Food builder
      -- actually consumes some of it via the "From Your Harvest" picker
      -- (see FoodLookup.tsx) -- never re-derived from a log of usage
      -- events, so a harvest's own remaining amount is always one direct,
      -- authoritative number to check and update.
      CREATE TABLE IF NOT EXISTS garden_harvests (
        id TEXT PRIMARY KEY,
        planting_id TEXT,
        plot_id TEXT,
        food_id INTEGER NOT NULL,
        source TEXT NOT NULL,
        food_name TEXT NOT NULL,
        harvested_at TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        quantity_remaining REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (planting_id) REFERENCES garden_plantings(id) ON DELETE SET NULL,
        FOREIGN KEY (plot_id) REFERENCES garden_plots(id) ON DELETE SET NULL
      );

      -- A real, basic Scheduler tie-in, 2026-08-13 -- schedule_items.item_type
      -- is already a free-text, extensible vocabulary (see that table's own
      -- comment further up) with 'meal'/'supplement'/'prescription'/
      -- 'appointment' etc. already real values; 'garden' joins that same
      -- list rather than needing its own new table. A garden task created
      -- this way (see scheduleGardenTask below) links back to the plot/
      -- planting it's actually about.
      CREATE TABLE IF NOT EXISTS garden_task_links (
        schedule_item_id TEXT PRIMARY KEY,
        plot_id TEXT,
        planting_id TEXT,
        FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id) ON DELETE CASCADE,
        FOREIGN KEY (plot_id) REFERENCES garden_plots(id) ON DELETE SET NULL,
        FOREIGN KEY (planting_id) REFERENCES garden_plantings(id) ON DELETE SET NULL
      );

      -- The same real, basic Scheduler tie-in as garden_task_links above,
      -- 2026-08-14, for the structured food-testing feature's own daily
      -- during-a-trial check-in reminders (see scheduleFoodTrialCheckins
      -- below): a real schedule_items row (item_type='foodTest') per day of
      -- the observation window, each traced back to the trial it's about.
      -- Same real, honest Phase-1 scope limit as garden_task_links: only
      -- the FIRST occurrence of the series gets a direct link row here,
      -- since every occurrence carries the same food_trial_id and any
      -- consumer reading this table already resolves the whole series via
      -- schedule_items.repeat_group_id from that one row.
      CREATE TABLE IF NOT EXISTS food_trial_task_links (
        schedule_item_id TEXT PRIMARY KEY,
        food_trial_id TEXT NOT NULL,
        FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id) ON DELETE CASCADE,
        FOREIGN KEY (food_trial_id) REFERENCES food_trials(id) ON DELETE CASCADE
      );

      -- Barcode-scanned products, 2026-08-16 -- "My Processed Foods." Every
      -- existing builder resolves an ingredient through a (food_id, source)
      -- pair pointing into the bundled reference database; a scanned
      -- product genuinely isn't in there, so this reuses that same real
      -- identity shape rather than inventing a parallel one -- a real,
      -- unique local INTEGER id (safe against colliding with the reference
      -- database's own real food_id range, since the two live in
      -- completely separate SQLite files and every consumer branches on
      -- source='Scanned' first, before ever using the id to look anywhere)
      -- paired with source='Scanned', the same pattern this database's own
      -- 'Derived' rows already established for real-but-not-from-one-of-
      -- the-7-national-sources data. lookup_source is the real provenance
      -- of the nutrient panel below (OpenFoodFacts/USDA/Manual), kept
      -- honest and visible the same way the reference database's own
      -- per-row source column already is.
      CREATE TABLE IF NOT EXISTS scanned_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        brand TEXT,
        lookup_source TEXT NOT NULL,
        ingredients_text TEXT,
        photo_uri TEXT,
        scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Mirrors food_nutrients' own real (food_id, source, nutrient_code)
      -- shape, minus the source dimension -- a scanned product has exactly
      -- one real nutrient panel (whatever the barcode lookup reported),
      -- never a sibling-source fallback the way a reference-database food
      -- can have.
      CREATE TABLE IF NOT EXISTS scanned_product_nutrients (
        scanned_product_id INTEGER NOT NULL,
        nutrient_code TEXT NOT NULL,
        amount_per_100g REAL NOT NULL,
        PRIMARY KEY (scanned_product_id, nutrient_code),
        FOREIGN KEY (scanned_product_id) REFERENCES scanned_products(id) ON DELETE CASCADE
      );

      -- Real price-over-time tracking, one row per real "I bought this"
      -- occasion -- photo_uri is the real price-tag/receipt photo the
      -- price was read from (OCR-attempted, always confirmed/edited before
      -- being saved here, never silently trusted).
      CREATE TABLE IF NOT EXISTS scanned_product_prices (
        id TEXT PRIMARY KEY,
        scanned_product_id INTEGER NOT NULL,
        price REAL NOT NULL,
        store_name TEXT,
        photo_uri TEXT,
        logged_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (scanned_product_id) REFERENCES scanned_products(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_meals_eaten_at ON meals(eaten_at);
      -- 2026-08-16, a real, confirmed gap found while chasing a still-slow
      -- Cooking & Prep report even after the N+1 fix above and a genuine
      -- clean Metro restart: meal_items has never had an index on meal_id
      -- at all -- not just getMealItemsInWindow's own JOIN, but the much
      -- older, still-widely-used getMealItems(mealId)'s plain
      -- WHERE meal_id = ? too, both doing a real full-table scan of
      -- meal_items on every single call, for as long as this table has
      -- existed. The reference database's own food_scores/food_nutrients
      -- tables (scripts/build_food_reference_db.py) were already properly
      -- indexed on (food_id, source) -- checked directly, ruled out -- so
      -- this was the one real remaining gap.
      CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id);
      CREATE INDEX IF NOT EXISTS idx_wellbeing_checkins_logged_at ON wellbeing_checkins(logged_at);
      CREATE INDEX IF NOT EXISTS idx_checkin_tags_checkin ON checkin_tags(checkin_id);
      CREATE INDEX IF NOT EXISTS idx_exercise_logs_logged_at ON exercise_logs(logged_at);
      CREATE INDEX IF NOT EXISTS idx_body_measurements_type_logged_at ON body_measurements(measurement_type, logged_at);
      CREATE INDEX IF NOT EXISTS idx_schedule_items_scheduled_for ON schedule_items(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_food_trials_started_at ON food_trials(started_at);
      CREATE INDEX IF NOT EXISTS idx_side_ingredients_side ON side_ingredients(side_id);
      CREATE INDEX IF NOT EXISTS idx_meal_components_meal ON meal_components(meal_id);
      CREATE INDEX IF NOT EXISTS idx_garden_plantings_plot ON garden_plantings(plot_id);
      CREATE INDEX IF NOT EXISTS idx_garden_harvests_remaining ON garden_harvests(quantity_remaining);
      CREATE INDEX IF NOT EXISTS idx_garden_harvests_planting ON garden_harvests(planting_id);
      CREATE INDEX IF NOT EXISTS idx_scanned_product_prices_product ON scanned_product_prices(scanned_product_id);
      CREATE INDEX IF NOT EXISTS idx_fermentation_batches_stage ON fermentation_batches(stage);
      CREATE INDEX IF NOT EXISTS idx_fermentation_harvests_remaining ON fermentation_harvests(quantity_remaining);
      CREATE INDEX IF NOT EXISTS idx_fermentation_harvests_batch ON fermentation_harvests(fermentation_batch_id);

      -- Phase 1 of the header growth vine/Timeline plan (2026-08-21, see
      -- the Notion App Development Log). One row per achievement criterion
      -- the moment it's first detected true (never re-inserted once
      -- present -- see recordAchievementCriterionMet in this file, an
      -- INSERT OR IGNORE), the shared source of truth both the future vine
      -- (Phase 2) and self-created goal linking (Phase 4) will read from.
      -- criterion_key matches AchievementCriterionKey in
      -- lib/achievementCriteria.ts, not enforced at the SQL level (SQLite
      -- has no real enum type), kept in sync by hand the same way every
      -- other free-text vocabulary column in this file already is
      -- (schedule_items.item_type, garden_plantings.status, etc.).
      CREATE TABLE IF NOT EXISTS achievement_criteria_progress (
        criterion_key TEXT PRIMARY KEY,
        achieved_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const mealColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(meals)');
    const hasImmediateColumn = mealColumns.some((column) => column.name === 'is_immediate');

    if (!hasImmediateColumn) {
      await db.execAsync('ALTER TABLE meals ADD COLUMN is_immediate INTEGER NOT NULL DEFAULT 0;');
    }

    const mealItemColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(meal_items)');
    const hasDishNameColumn = mealItemColumns.some((column) => column.name === 'dish_name');

    if (!hasDishNameColumn) {
      await db.execAsync('ALTER TABLE meal_items ADD COLUMN dish_name TEXT;');
    }

    const hasSideNameColumn = mealItemColumns.some((column) => column.name === 'side_name');

    if (!hasSideNameColumn) {
      await db.execAsync('ALTER TABLE meal_items ADD COLUMN side_name TEXT;');
    }

    const hasDishServingsColumn = mealItemColumns.some((column) => column.name === 'dish_servings');

    if (!hasDishServingsColumn) {
      await db.execAsync('ALTER TABLE meal_items ADD COLUMN dish_servings REAL;');
    }

    const hasYourSharePercentColumn = mealItemColumns.some((column) => column.name === 'your_share_percent');

    if (!hasYourSharePercentColumn) {
      await db.execAsync('ALTER TABLE meal_items ADD COLUMN your_share_percent REAL;');
    }

    const hasMealItemCategoryColumn = mealItemColumns.some((column) => column.name === 'category');

    if (!hasMealItemCategoryColumn) {
      await db.execAsync('ALTER TABLE meal_items ADD COLUMN category TEXT;');
    }

    const hasCookingMethodColumn = mealItemColumns.some((column) => column.name === 'cooking_method');

    if (!hasCookingMethodColumn) {
      await db.execAsync('ALTER TABLE meal_items ADD COLUMN cooking_method TEXT;');
    }

    const treatmentColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(treatments)');
    const hasUnitsPerDayColumn = treatmentColumns.some((column) => column.name === 'units_per_day');

    if (!hasUnitsPerDayColumn) {
      await db.execAsync('ALTER TABLE treatments ADD COLUMN units_per_day REAL;');
    }

    const hasServingUnitLabelColumn = treatmentColumns.some((column) => column.name === 'serving_unit_label');

    if (!hasServingUnitLabelColumn) {
      await db.execAsync('ALTER TABLE treatments ADD COLUMN serving_unit_label TEXT;');
    }

    // Added for My Meds, 2026-08-08 -- a structured, canonical identity for
    // a prescription or OTC treatment, separate from the free-text `name`
    // the person actually typed (e.g. name might be "Synthroid 75mcg
    // morning" while genericName is "levothyroxine"). This is what lets
    // interaction checking and the common_medications reference lookup
    // match reliably instead of depending on a substring of whatever the
    // person happened to type -- see lib/interactionRules.ts's own updated
    // activeTreatmentsForSubject. Nullable and never backfilled for
    // existing rows -- a treatment created before this column existed
    // simply has no generic name until edited, same as every other
    // additive column in this migration block.
    const hasGenericNameColumn = treatmentColumns.some((column) => column.name === 'generic_name');

    if (!hasGenericNameColumn) {
      await db.execAsync('ALTER TABLE treatments ADD COLUMN generic_name TEXT;');
    }

    // Real, tracked-value support for the alcohol calculator, 2026-08-11 --
    // direct request/decision: rather than stay purely informational (the
    // AlcoholCalculatorPanel's own original design, see that file's header
    // comment), a person's own real calculator inputs -- when they use the
    // panel at all -- should become what actually gets tracked for that
    // ingredient, replacing the plain reference-database-row-times-quantity
    // math. Nullable throughout: an ingredient added WITHOUT ever opening
    // the calculator has every one of these columns NULL, and behaves
    // exactly as before (normal food_nutrients lookup). The raw inputs
    // (volume/ABV/sugar/retention/pours) are stored alongside the two
    // derived totals (calories/carbs) specifically so re-opening a saved
    // ingredient for editing can restore the calculator to its own
    // original state, not just the final numbers. All four builders whose
    // own category allowlist includes Alcohol get this identical column
    // set -- beverage_ingredients first, fermentation_ingredients/
    // sauce_ingredients/soup_ingredients right after, added the same day
    // as a real, mechanical follow-up once the pattern was proven on
    // Beverage Builder specifically.
    const beverageIngredientColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(beverage_ingredients)');
    const hasCalculatorCaloriesColumn = beverageIngredientColumns.some((column) => column.name === 'calculator_calories');

    if (!hasCalculatorCaloriesColumn) {
      await db.execAsync(`
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_volume_ml REAL;
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_abv_percent REAL;
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_residual_sugar_g_per_l REAL;
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_retention_id TEXT;
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_pours REAL;
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_calories REAL;
        ALTER TABLE beverage_ingredients ADD COLUMN calculator_carbs_g REAL;
      `);
    }

    const fermentationIngredientColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(fermentation_ingredients)');
    const hasFermentationCalculatorColumn = fermentationIngredientColumns.some((column) => column.name === 'calculator_calories');
    if (!hasFermentationCalculatorColumn) {
      await db.execAsync(`
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_volume_ml REAL;
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_abv_percent REAL;
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_residual_sugar_g_per_l REAL;
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_retention_id TEXT;
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_pours REAL;
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_calories REAL;
        ALTER TABLE fermentation_ingredients ADD COLUMN calculator_carbs_g REAL;
      `);
    }

    const sauceIngredientColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sauce_ingredients)');
    const hasSauceCalculatorColumn = sauceIngredientColumns.some((column) => column.name === 'calculator_calories');
    if (!hasSauceCalculatorColumn) {
      await db.execAsync(`
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_volume_ml REAL;
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_abv_percent REAL;
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_residual_sugar_g_per_l REAL;
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_retention_id TEXT;
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_pours REAL;
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_calories REAL;
        ALTER TABLE sauce_ingredients ADD COLUMN calculator_carbs_g REAL;
      `);
    }

    const soupIngredientColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(soup_ingredients)');
    const hasSoupCalculatorColumn = soupIngredientColumns.some((column) => column.name === 'calculator_calories');
    if (!hasSoupCalculatorColumn) {
      await db.execAsync(`
        ALTER TABLE soup_ingredients ADD COLUMN calculator_volume_ml REAL;
        ALTER TABLE soup_ingredients ADD COLUMN calculator_abv_percent REAL;
        ALTER TABLE soup_ingredients ADD COLUMN calculator_residual_sugar_g_per_l REAL;
        ALTER TABLE soup_ingredients ADD COLUMN calculator_retention_id TEXT;
        ALTER TABLE soup_ingredients ADD COLUMN calculator_pours REAL;
        ALTER TABLE soup_ingredients ADD COLUMN calculator_calories REAL;
        ALTER TABLE soup_ingredients ADD COLUMN calculator_carbs_g REAL;
      `);
    }

    const userProfileColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_profile)');
    const hasHeightColumn = userProfileColumns.some((column) => column.name === 'height_cm');

    if (!hasHeightColumn) {
      await db.execAsync('ALTER TABLE user_profile ADD COLUMN height_cm REAL;');
    }

    // Insights' own Energy & Portions lens, 2026-08-15.
    const hasActivityLevelColumn = userProfileColumns.some((column) => column.name === 'activity_level');
    if (!hasActivityLevelColumn) {
      await db.execAsync('ALTER TABLE user_profile ADD COLUMN activity_level TEXT;');
    }

    for (const column of [
      'first_name',
      'last_name',
      'usual_breakfast_time',
      'usual_lunch_time',
      'usual_dinner_time',
      'usual_snack_time',
      'eating_window_start',
      'eating_window_end',
    ]) {
      if (!userProfileColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE user_profile ADD COLUMN ${column} TEXT;`);
      }
    }

    if (!userProfileColumns.some((column) => column.name === 'fasting_enabled')) {
      await db.execAsync('ALTER TABLE user_profile ADD COLUMN fasting_enabled INTEGER NOT NULL DEFAULT 0;');
    }

    // A real USDA Plant Hardiness Zone (e.g. '7a'), 2026-08-13, for the new
    // Garden tab's own "My Zone" lens -- manually self-selected for now
    // (Phase 1), not auto-resolved from a ZIP/postal code (a real, named
    // Phase 2, deferred rather than half-built here). Deliberately just one
    // more plain column on the same user_profile row every other personal
    // setting already lives on, not a separate one-row table.
    if (!userProfileColumns.some((column) => column.name === 'growing_zone')) {
      await db.execAsync('ALTER TABLE user_profile ADD COLUMN growing_zone TEXT;');
    }

    // The real country/ZIP-or-postal-code pair behind a "Find My Zone"
    // lookup (lib/gardenZoneLookup.ts), 2026-08-13 -- Phase 2, completing
    // growing_zone's own real gap. Stored purely for convenience (so
    // returning to My Zone shows what was actually entered and lets a
    // person re-run the lookup after moving, rather than re-typing it),
    // not required for growing_zone itself to keep working -- both stay
    // null if someone only ever sets their zone manually.
    for (const column of ['growing_zone_country', 'growing_zone_postal_code']) {
      if (!userProfileColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE user_profile ADD COLUMN ${column} TEXT;`);
      }
    }

    // Garden Area redesign, 2026-08-14 -- "+Add a Plot" became "+Add a
    // Garden Area," direct request replacing the original free-text
    // growing_medium/light_source fields with a real, structured 5-phase
    // flow: location & environment (widening location_type's own real
    // values to include 'greenhouse', a comment-only change above --
    // location_type itself is plain TEXT, no migration needed for that
    // part), space type, sunlight exposure, real numeric size, and a real
    // per-area hardiness-zone lookup (reusing lib/gardenZoneLookup.ts, the
    // same mechanism My Zone already uses for the whole profile -- see
    // GardenPlot's own comment for why this is per-area, not just a single
    // global value). growing_medium/light_source/size_description are left
    // in place, unused by the new wizard but still readable for any plot
    // created before this -- no real users exist yet, so this is purely
    // additive.
    const gardenPlotColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(garden_plots)');
    for (const column of ['space_type', 'sunlight_exposure', 'size_unit', 'zone', 'zone_country', 'zone_postal_code']) {
      if (!gardenPlotColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE garden_plots ADD COLUMN ${column} TEXT;`);
      }
    }
    for (const column of ['length', 'width']) {
      if (!gardenPlotColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE garden_plots ADD COLUMN ${column} REAL;`);
      }
    }

    const exerciseLogColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercise_logs)');
    const hasStepCountColumn = exerciseLogColumns.some((column) => column.name === 'step_count');

    if (!hasStepCountColumn) {
      await db.execAsync('ALTER TABLE exercise_logs ADD COLUMN step_count INTEGER;');
    }

    // meal_type (breakfast/lunch/dinner/salad/smoothie/snack, same
    // vocabulary as meals.meal_type) is its own column, separate from
    // item_type -- item_type is the broad schedule category ('meal',
    // 'supplement', 'prescription' -- see also 'hydration', which is just
    // 'meal' filtered to mealType='beverage'), meal_type is which kind
    // of meal this specific one is. Only meaningful when item_type='meal'.
    const scheduleItemColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(schedule_items)');
    const hasMealTypeColumn = scheduleItemColumns.some((column) => column.name === 'meal_type');

    if (!hasMealTypeColumn) {
      await db.execAsync('ALTER TABLE schedule_items ADD COLUMN meal_type TEXT;');
    }

    // Which favorite or meal template this was scheduled from, if either --
    // null for an unplanned/on-the-fly entry typed in directly. Lets "Log
    // now" prefill the Meals builder with the actual ingredients, not just
    // a name.
    for (const column of ['source_favorite_id', 'source_meal_id']) {
      if (!scheduleItemColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE schedule_items ADD COLUMN ${column} TEXT;`);
      }
    }

    // Daily recurrence support -- a schedule item either stands alone
    // (repeat_type NULL/'none', every other repeat_* column null) or is one
    // occurrence in a series that shares a repeat_group_id. Series are
    // pre-generated as real independent rows into a rolling window (see
    // ensureScheduleSeriesGenerated) rather than computed on the fly, so
    // editing/skipping/logging one occurrence never affects any other.
    for (const column of ['repeat_type', 'repeat_end_type', 'repeat_until', 'repeat_group_id']) {
      if (!scheduleItemColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE schedule_items ADD COLUMN ${column} TEXT;`);
      }
    }
    for (const column of ['repeat_count', 'repeat_index']) {
      if (!scheduleItemColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE schedule_items ADD COLUMN ${column} INTEGER;`);
      }
    }

    // Appointments (item_type='appointment') -- doctor/lab/nutritionist/
    // trainer visits. appointment_type is a small free-text vocabulary
    // ('lab_draw' matters specifically: it's what lets the biotin/thyroid-
    // lab interaction rule actually evaluate, see lib/interactionRules.ts).
    // linked_device_calendar_event_id connects this row to a real event in
    // the phone's own Calendar app (see lib/deviceCalendar.ts) -- null for
    // an item that only exists inside this app. Lives in this same
    // migration block for historical reasons (it shipped alongside
    // Appointments), but it's a genuinely shared column -- Meals uses it
    // too (2026-08-18), not just item_type='appointment' rows.
    for (const column of ['appointment_type', 'location', 'provider_name', 'linked_device_calendar_event_id']) {
      if (!scheduleItemColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE schedule_items ADD COLUMN ${column} TEXT;`);
      }
    }

    // A JSON array of RotationSelection -- which specific alternate is
    // chosen for a rotating ingredient's slot, for THIS scheduled
    // occurrence only (item_type='meal', sourceFavoriteId set). Lives here
    // rather than on the favorite itself so rotating Tuesday's smoothie
    // never touches Wednesday's, even though both point at the same
    // favorite -- see RotationSelection's own comment.
    if (!scheduleItemColumns.some((existing) => existing.name === 'rotation_selections_json')) {
      await db.execAsync('ALTER TABLE schedule_items ADD COLUMN rotation_selections_json TEXT;');
    }

    // Free-text food/drink name for a check-in -- most reactions are to
    // something never formally logged as a meal (a bite at a party, a new
    // snack), so this can't just lean on related_meal_id alone.
    const wellbeingCheckinColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(wellbeing_checkins)');
    if (!wellbeingCheckinColumns.some((column) => column.name === 'food_name')) {
      await db.execAsync('ALTER TABLE wellbeing_checkins ADD COLUMN food_name TEXT;');
    }

    // Real food identity + testing context on a food trial, 2026-08-14 --
    // the structured food-testing/reintroduction feature. A trial can still
    // be started as free text only (foodName alone, the original design,
    // unchanged) or, when initiated from a real reference-database food (a
    // "Worth testing?" tap on a flagged ingredient, or a suggested
    // candidate), carries its full identity: which exact food/source, what
    // prep state is actually being tested (raw vs. cooked can genuinely
    // differ), and which tracked condition/concern prompted the test (the
    // same food can be tested for entirely different reasons under
    // different conditions -- dairy for lactose recovery during Celiac
    // healing vs. dairy as an RA elimination-diet trigger). All nullable --
    // a genuinely additive migration, no real users yet to migrate.
    const foodTrialColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(food_trials)');
    for (const column of [
      'source',
      'prep_method',
      'condition_code',
      // activated_by_schedule_item_id/activated_by_meal_id -- 2026-08-14,
      // the real "which meal actually proves this food got eaten" trace
      // Past Meals needs, per lib/pendingFoodTrialReturn.ts's own sibling
      // Status entry. Both nullable, both TEXT (matching schedule_items.id/
      // meals.id, both TEXT PRIMARY KEYs) -- see
      // activateWaitingTrialsForComponents' own comment for exactly when
      // each gets set. A trial activated at real schedule time only ever
      // has the schedule_item id at first (no real meal exists yet);
      // activated_by_meal_id gets backfilled once one does, whether that's
      // "Log now" or settlePastScheduledMeals' own later auto-materialize
      // pass.
      'activated_by_schedule_item_id',
      'activated_by_meal_id',
    ]) {
      if (!foodTrialColumns.some((existing) => existing.name === column)) {
        await db.execAsync(`ALTER TABLE food_trials ADD COLUMN ${column} TEXT;`);
      }
    }
    if (!foodTrialColumns.some((existing) => existing.name === 'food_id')) {
      await db.execAsync('ALTER TABLE food_trials ADD COLUMN food_id INTEGER;');
    }

    // Ties a lightweight daily during-a-trial check-in (or its escalated
    // full symptom log -- same table either way, see recordCheckin's own
    // comment) back to the real trial it belongs to, so a trial's own
    // history reads as one connected record rather than scattered entries
    // someone would have to mentally reassemble. Null for every ordinary
    // check-in that isn't part of a trial.
    if (!wellbeingCheckinColumns.some((column) => column.name === 'food_trial_id')) {
      await db.execAsync('ALTER TABLE wellbeing_checkins ADD COLUMN food_trial_id TEXT;');
    }

    // shared_from_name -- 2026-08-15, the real "who sent this to me"
    // footnote a shared item carries once imported through the new
    // sharing feature (see importSharedItem below). Nullable, TEXT, added
    // identically to all 11 real saved-record tables (matching
    // COMPONENT_TABLE_BY_TYPE exactly) -- a normal, self-created record
    // simply never sets it.
    for (const table of Object.values(COMPONENT_TABLE_BY_TYPE)) {
      const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      if (!columns.some((column) => column.name === 'shared_from_name')) {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN shared_from_name TEXT;`);
      }
    }

    // photo_uri -- 2026-08-15, a real photo of the finished dish, direct
    // request. Nullable, TEXT, added identically to all 11 real saved-
    // record tables (matching COMPONENT_TABLE_BY_TYPE exactly) -- see
    // lib/mealPhotos.ts's own PhotoTarget/getPhotoForTarget/
    // setPhotoForTarget for the one real place every one of the four real
    // photo-storage shapes (this column, favorites.payload_json, a
    // curated-recipe's own per-user app_meta override, and
    // shared_recipes.photo_uri below) actually gets read/written.
    for (const table of Object.values(COMPONENT_TABLE_BY_TYPE)) {
      const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      if (!columns.some((column) => column.name === 'photo_uri')) {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN photo_uri TEXT;`);
      }
    }

    // instructions_json -- 2026-08-17, real hand-authored prep steps,
    // direct request: "there needs to be a step able to be created on each
    // of the builders creations as you create them." Nullable, TEXT,
    // storing a plain JSON.stringify(string[]) (null, not '[]', for a
    // side with zero steps -- see parseInstructionsJson below), added
    // identically to all 11 real saved-record tables (matching
    // COMPONENT_TABLE_BY_TYPE exactly) so every future builder's own real
    // Steps section already has the column ready, without repeating this
    // same migration boilerplate later -- only Side Builder actually
    // reads/writes it for real so far (see SideBuilder.tsx's own Steps
    // section, and this file's own SideDetail/saveSide/updateSide/getSide
    // just below).
    for (const table of Object.values(COMPONENT_TABLE_BY_TYPE)) {
      const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      if (!columns.some((column) => column.name === 'instructions_json')) {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN instructions_json TEXT;`);
      }
    }

    // depth_data_json -- 2026-08-25, real condition-safety/diet-tag/stage-
    // advisory depth for a person's own saved creation, the same shape
    // (safeForConditions/conditionCautions/dietTags/stageNotes,
    // lib/recipeDepth.ts's own RecipeDepthResult) every curated recipe
    // already carries, computed live rather than bundled since there's no
    // way to know ahead of time what anyone will actually build. Direct
    // instruction: "The builders all absolutely must match the depth as is
    // provided to the recipes, and it should happen every time the user
    // creates anything." Nullable TEXT, one JSON.stringify(RecipeDepthResult)
    // per saved record, computed once at save time (not recomputed on every
    // My Kitchen view, matching how a curated recipe's own data is frozen
    // until something explicitly re-runs it). Added to all 11 real saved-
    // record tables at once, the same instructions_json precedent just
    // above -- only Side Builder actually computes/reads it so far (the
    // pilot), every other builder gets the column ready for its own later
    // rollout without repeating this migration.
    for (const table of Object.values(COMPONENT_TABLE_BY_TYPE)) {
      const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      if (!columns.some((column) => column.name === 'depth_data_json')) {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN depth_data_json TEXT;`);
      }
    }

    // shared_recipes.sender_public_key_base64 -- step 5 of the real
    // device-pairing prerequisite list, 2026-08-15 (see this table's own
    // CREATE TABLE comment above for the real reasoning). A device that
    // already ran this app's own real, prior CREATE TABLE IF NOT EXISTS
    // for shared_recipes (this table shipped, and this exact app has
    // already been rebuilt/run on a real device, earlier the same
    // session) needs this real, additive migration to actually gain the
    // column -- IF NOT EXISTS alone never adds a column to an
    // already-existing table.
    {
      const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(shared_recipes)`);
      if (!columns.some((column) => column.name === 'sender_public_key_base64')) {
        await db.execAsync(`ALTER TABLE shared_recipes ADD COLUMN sender_public_key_base64 TEXT;`);
      }
    }
  } catch (error) {
    databasePromise = null;
    initializeDatabasePromise = null;
    throw error;
  }
}

export async function saveFavoriteMeal(input: {
  name: string;
  mealType: string;
  notes?: string;
  ingredients: MealIngredientInput[];
}) {
  const db = await getDatabase();
  const id = `favorite_${Date.now()}`;
  const now = new Date().toISOString();
  const payload: MealFavoritePayload = {
    name: input.name.trim(),
    mealType: input.mealType,
    notes: input.notes?.trim() || undefined,
    ingredients: input.ingredients,
  };

  await db.runAsync(
    `
      INSERT INTO favorites (id, item_type, name, payload_json, last_used_at, created_at, updated_at)
      VALUES (?, 'meal', ?, ?, ?, ?, ?)
    `,
    id,
    payload.name,
    JSON.stringify(payload),
    now,
    now,
    now,
  );

  return { id, ...payload };
}

// A single side (e.g. "mixed vegetables, sauteed") saved on its own so it
// can be dropped into any future meal -- swapping one vegetable for
// another in an otherwise-reused side is exactly the "quick remix" this is
// for, per the app's own stated goal of keeping whole-foods cooking from
// scratch feeling fast rather than like homework every time.
export async function saveFavoriteSide(input: { name: string; cookingMethod: string; ingredients: MealIngredientInput[] }) {
  const db = await getDatabase();
  const id = `favorite_${Date.now()}`;
  const now = new Date().toISOString();
  const payload: SideFavoritePayload = {
    name: input.name.trim(),
    cookingMethod: input.cookingMethod,
    ingredients: input.ingredients,
  };

  await db.runAsync(
    `
      INSERT INTO favorites (id, item_type, name, payload_json, last_used_at, created_at, updated_at)
      VALUES (?, 'side', ?, ?, ?, ?, ?)
    `,
    id,
    payload.name,
    JSON.stringify(payload),
    now,
    now,
    now,
  );

  return { id, ...payload };
}

export type SideIngredientInput = {
  // "<food_id>|<source>", the same combined format meal_items.food_id
  // already uses -- one column, not two, so a saved ingredient's food
  // reference is looked up the same way everywhere in this file.
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

// Saves a completed Side as its own real, standalone record -- see the
// `sides`/`side_ingredients` tables' own comment in initializeDatabase for
// why this is neither a `meals` row nor a `favorites` row. Not a "favorite
// template" and not (yet) an actual meal log entry; just a real side that
// exists now, ready to be pulled into a meal once Meal Builder can do that
// assembling. This app's own scores/6-Dimension data isn't stored here --
// it's cheap to re-fetch live from foodId/source (see getFoodScores)
// whenever a saved side is actually displayed, so there's no cached copy
// here to go stale.
// Shared by every real saved-record table's own real Steps section as it
// gets built out (only Side Builder so far, 2026-08-17) -- a real, plain
// JSON.stringify(string[])/JSON.parse round trip, matching the same
// "*_json TEXT" column convention schedule_items.rotation_selections_json
// already established. serializeInstructions stores null (not '[]') for a
// dish with zero steps, matching RecipeCard.instructions's own "absent
// means nothing was authored" contract (see lib/digest/types.ts) rather
// than an empty-but-present array; parseInstructionsJson reads either back
// as a real, honest [].
function serializeInstructions(instructions: string[]): string | null {
  return instructions.length > 0 ? JSON.stringify(instructions) : null;
}

function parseInstructionsJson(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((step): step is string => typeof step === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveSide(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SideIngredientInput[];
  instructions: string[];
  // 2026-08-25 -- see depth_data_json's own migration comment above.
  // Optional only in the type-system sense (a caller could theoretically
  // skip it), never in practice: SideBuilder.tsx's own finishSide always
  // computes this via lib/recipeDepth.ts's computeRecipeDepth before
  // calling here, matching the direct instruction that this must happen
  // every time, not just when a report is actually viewed.
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `side_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO sides (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `side_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO side_ingredients
          (id, side_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id };
}

// Same shape as saveSide's own input, applied to an EXISTING side instead
// of creating a new one -- 2026-08-01, for SideBuilder's own Edit flow (see
// app/food-items.tsx's Edit button). Replaces every ingredient row rather
// than diffing old vs new (delete-then-reinsert, same id ordering
// convention saveSide already uses) -- simplest correct approach, and safe
// here since side_ingredients rows carry no independent identity anything
// else in the app references (unlike, say, a meal_item a schedule entry
// might point back to).
export async function updateSide(
  sideId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: SideIngredientInput[];
    instructions: string[];
    // See saveSide's own comment on depthData just above.
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE sides
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    sideId,
  );

  await db.runAsync('DELETE FROM side_ingredients WHERE side_id = ?', sideId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `side_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO side_ingredients
          (id, side_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      sideId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id: sideId };
}

// side_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent sides row is enough.
export async function deleteSide(sideId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sides WHERE id = ?', sideId);
}

// Real base_name/prep_method/category for one exact reference-database row
// -- 2026-08-01, for SideBuilder's own Edit flow: side_ingredients only
// stores the full descriptive food_name (e.g. "Broccoli, raw"), not
// base_name/prep_method, so re-opening a saved side for editing needs this
// to reconstruct each ingredient's ResolvedFoodSelection (see FoodLookup's
// own type) from just the stored foodId/source. Always authoritative --
// this is the exact same row every score/nutrient lookup already reads
// from, never a second, potentially-stale copy.
export type FoodIdentity = {
  baseName: string;
  prepMethod: string | null;
  category: string;
  subcategory: string | null;
};

export async function getFoodIdentity(foodId: number, source: string): Promise<FoodIdentity | null> {
  // A real, local barcode-scanned product, 2026-08-16 -- lives entirely
  // outside the bundled reference database, so this branches before ever
  // reaching it. See scanned_products' own CREATE TABLE comment for why a
  // local INTEGER id can safely reuse this same (foodId, source) shape.
  if (source === 'Scanned') {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ name: string }>('SELECT name FROM scanned_products WHERE id = ?', foodId);
    if (!row) return null;
    return { baseName: row.name, prepMethod: null, category: 'MyProcessedFoods', subcategory: null };
  }
  const db = await getReferenceDatabase();
  return db.getFirstAsync<FoodIdentity>(
    'SELECT base_name AS baseName, prep_method AS prepMethod, category, subcategory FROM foods WHERE food_id = ? AND source = ?',
    foodId,
    source,
  );
}

export type SideRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  // Comma-joined ingredient names, in save order -- 2026-08-02, explicitly
  // requested so app/food-items.tsx's own list can show what's actually IN
  // a side rather than just a count: two different "Mixed Vegetable
  // Medley" sides with different real ingredients looked identical in that
  // list before this. Null only for a side with zero ingredients (not a
  // real path through SideBuilder today, but the LEFT JOIN below can't
  // rule it out at the type level).
  ingredientNames: string | null;
  createdAt: string;
};

// Most-recently-saved first -- matches listFavorites' own ordering, and
// matches what someone opening "My Foods" right after saving a side
// actually wants to see first.
export async function listSides(limit = 50): Promise<SideRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<SideRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM side_ingredients WHERE side_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM sides s
      LEFT JOIN side_ingredients si ON si.side_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type SideDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section. getSide itself always sets a real array (possibly
  // empty), never leaves this undefined -- but the FIELD stays optional,
  // not required, so SideDetail can still structurally satisfy shared
  // contexts (e.g. app/food-item-detail.tsx's own loadSide, whose return
  // type is `SideDetail | null` reused for every one of the other 10
  // builders' own XDetail too, none of which carry this field yet).
  // Callers should still read it as `side.instructions ?? []`.
  instructions?: string[];
  // Real depth (safeForConditions/conditionCautions/dietTags/stageNotes),
  // 2026-08-25 -- see depth_data_json's own migration comment above. Left
  // undefined for a side saved before this shipped (an honest, real gap,
  // not silently backfilled with a guess) rather than always set the way
  // instructions is, since there's no live ingredient list to recompute
  // from at read time the way there is at save time.
  depthData?: RecipeDepthResult;
};

export async function getSide(sideId: string): Promise<SideDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM sides
      WHERE id = ?
    `,
    sideId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type SideIngredientDetail = {
  id: string;
  // "<food_id>|<source>", or null for an ingredient that somehow never
  // resolved to a real food -- shouldn't happen given SideBuilder requires
  // a resolved food before an ingredient can be added, but nutrient/score
  // lookups below still guard for it the same way meal_items' own do.
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
};

// Ordered the same way the ingredients were added (sort_order, set at save
// time) -- the one place this app reads back the actual recorded notes
// (cutPrep/cookingMethod/prepNote) from SideBuilder's own creation process,
// as opposed to getSideNutrientBreakdown/getSideSixDimensionsBreakdown
// below, which use this same data but only care about foodId/quantity/unit
// for the actual nutrient/score math.
export async function getSideIngredients(sideId: string): Promise<SideIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SideIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote
      FROM side_ingredients
      WHERE side_id = ?
      ORDER BY sort_order
    `,
    sideId,
  );
}

// Side-scoped equivalent of getDailyNutrientBreakdown, 2026-08-01 -- same
// output shape (DailyNutrientBreakdown), reused as-is so
// app/(tabs)/insights.tsx's own NutrientsTable/ScopeHub machinery can
// render a saved side's nutrients without any changes to that already-
// working code. A saved side isn't nested under any real day or meal, so
// it's represented as the ONLY meal (mealType 'side') containing the ONLY
// side, both wrapping the exact same totals -- dayTotals/mealTotals/
// sideTotals are identical here by construction, which is fine: nothing
// downstream distinguishes "the whole day" from "the whole side" beyond
// the label a caller chooses to show for the root scope.
//
// The actual per-ingredient math is simpler than meal_items' own version:
// side_ingredients.quantity is already the TOTAL amount of that ingredient
// in the whole side (not a per-serving size multiplied by a count the way
// meal_items splits servingSize x quantity), and there's no dishServings/
// yourSharePercent to divide by -- a saved side has no notion yet of "my
// share" of it, only its own real total.
export async function getSideNutrientBreakdown(sideId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const side = await getSide(sideId);
  if (!side) return empty;

  const ingredients = await getSideIngredients(sideId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const sideTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      sideTotals[code] = (sideTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const sideBreakdown: DailyNutrientSideBreakdown = { sideName: side.name, totals: sideTotals, items: itemBreakdowns };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: side.id,
    mealName: side.name,
    mealType: 'side',
    totals: sideTotals,
    sides: [sideBreakdown],
  };

  return {
    dayTotals: sideTotals,
    meals: [mealBreakdown],
    driRows,
    // No supplements here, same reasoning as meal_items' own -- a
    // supplement isn't part of any one dish.
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Shared by all 11 direct-ingredient builders' own SixDimensionsBreakdown
// functions below -- confirmed identical in shape across every one (each
// was a hand-copied twin of the last, per their own "same shape, same
// reasoning" comments), so this replaces 11 near-identical bodies with one
// real implementation plus 11 thin wrappers, the "one shared engine, not a
// copy" precedent this file already follows elsewhere (aggregateBySubCriterion
// itself is the same idea, one level up).
//
// trackedConditions, 2026-08-26 -- optional, defaults to [] so every
// existing caller keeps working unchanged (perCondition/dayPerCondition
// come back as {} at every level); app/food-item-detail.tsx is the real
// caller that passes the person's actual tracked conditions.
async function buildDishSixDimensionsBreakdown(
  dishId: string,
  dishName: string,
  ingredients: { foodId: string | null; foodName: string }[],
  mealType: string,
  trackedConditions: { code: string; name: string }[],
): Promise<DailySixDimensionsBreakdown> {
  const scoreCache = new Map<string, FoodScore[]>();
  type DishFood = { foodName: string; scores: FoodScore[]; foodId: number; source: string };
  const foods: DishFood[] = [];

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) continue;
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) continue;

    const cacheKey = `${foodId}|${source}`;
    let scores = scoreCache.get(cacheKey);
    if (!scores) {
      scores = await getFoodScores(foodId, source);
      scoreCache.set(cacheKey, scores);
    }
    foods.push({ foodName: ingredient.foodName, scores, foodId, source });
  }

  const conditionScoresByFood = await getConditionScoresForFoodsBulk(
    foods.map((food) => ({ foodId: food.foodId, source: food.source })),
    trackedConditions.map((condition) => condition.code),
  );

  const sideBreakdown: DailyDimensionSideBreakdown = {
    sideName: dishName,
    bySubCriterion: aggregateBySubCriterion(foods),
    items: foods.map((food) => ({
      foodName: food.foodName,
      bySubCriterion: aggregateBySubCriterion([food]),
      perCondition: buildPerConditionSummaries([food], trackedConditions, conditionScoresByFood),
    })),
    perCondition: buildPerConditionSummaries(foods, trackedConditions, conditionScoresByFood),
  };
  const mealBreakdown: DailyDimensionMealBreakdown = {
    mealId: dishId,
    mealName: dishName,
    mealType,
    bySubCriterion: sideBreakdown.bySubCriterion,
    sides: [sideBreakdown],
    perCondition: sideBreakdown.perCondition,
  };

  return { day: sideBreakdown.bySubCriterion, dayPerCondition: sideBreakdown.perCondition, meals: [mealBreakdown] };
}

// Side-scoped equivalent of getDailySixDimensionsBreakdown -- same shape,
// same reasoning as getSideNutrientBreakdown above (one synthetic meal
// wrapping one synthetic side, both real), reused as-is by
// app/(tabs)/insights.tsx's own SixDsView and PrepView (PrepView reads the
// exact same DailySixDimensionsBreakdown shape, no separate data source of
// its own).
export async function getSideSixDimensionsBreakdown(
  sideId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const side = await getSide(sideId);
  if (!side) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getSideIngredients(sideId);
  return buildDishSixDimensionsBreakdown(side.id, side.name, ingredients, 'side', trackedConditions);
}

// Salad Builder's own CRUD, 2026-08-02 -- deliberate line-for-line mirror of
// the sides/side_ingredients functions directly above (saveSide/updateSide/
// deleteSide/listSides/getSide/getSideIngredients/getSideNutrientBreakdown/
// getSideSixDimensionsBreakdown), reading/writing the salads/salad_ingredients
// tables instead. Kept as real, separate functions rather than a single
// generic "saveDish(kind, ...)" -- same per-builder-table reasoning as the
// tables themselves (see their own comment): each builder's own save path
// is free to diverge later (a salad will likely grow a dressing-specific
// field a side never needs) without the two having to stay artificially in
// sync through one shared function.
export type SaladIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

export async function saveSalad(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SaladIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `salad_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO salads (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `salad_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO salad_ingredients
          (id, salad_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id };
}

export async function updateSalad(
  saladId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: SaladIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE salads
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    saladId,
  );

  await db.runAsync('DELETE FROM salad_ingredients WHERE salad_id = ?', saladId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `salad_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO salad_ingredients
          (id, salad_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      saladId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id: saladId };
}

// salad_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent salads row is enough.
export async function deleteSalad(saladId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM salads WHERE id = ?', saladId);
}

export type SaladRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listSalads(limit = 50): Promise<SaladRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<SaladRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM salad_ingredients WHERE salad_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM salads s
      LEFT JOIN salad_ingredients si ON si.salad_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type SaladDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `salad.instructions ?? []`.
  instructions?: string[];
};

export async function getSalad(saladId: string): Promise<SaladDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM salads
      WHERE id = ?
    `,
    saladId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type SaladIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
};

export async function getSaladIngredients(saladId: string): Promise<SaladIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SaladIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote
      FROM salad_ingredients
      WHERE salad_id = ?
      ORDER BY sort_order
    `,
    saladId,
  );
}

// Salad-scoped equivalent of getSideNutrientBreakdown -- see that function's
// own comment for the full reasoning (one synthetic meal wrapping one
// synthetic "side" slot, reused as-is by Insights' own NutrientsTable/
// ScopeHub machinery). mealType 'salad' instead of 'side' is the only real
// difference in the shape produced.
export async function getSaladNutrientBreakdown(saladId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const salad = await getSalad(saladId);
  if (!salad) return empty;

  const ingredients = await getSaladIngredients(saladId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const saladTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      saladTotals[code] = (saladTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const saladBreakdown: DailyNutrientSideBreakdown = { sideName: salad.name, totals: saladTotals, items: itemBreakdowns };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: salad.id,
    mealName: salad.name,
    mealType: 'salad',
    totals: saladTotals,
    sides: [saladBreakdown],
  };

  return {
    dayTotals: saladTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Salad-scoped equivalent of getSideSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getSaladSixDimensionsBreakdown(
  saladId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const salad = await getSalad(saladId);
  if (!salad) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getSaladIngredients(saladId);
  return buildDishSixDimensionsBreakdown(salad.id, salad.name, ingredients, 'salad', trackedConditions);
}

// Smoothie Builder's own CRUD, 2026-08-02 -- deliberate line-for-line mirror
// of the salads/salad_ingredients functions directly above (see their own
// comment for the full "why separate tables/functions per builder"
// reasoning, unchanged here).
export type SmoothieIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

export async function saveSmoothie(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SmoothieIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `smoothie_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO smoothies (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `smoothie_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO smoothie_ingredients
          (id, smoothie_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id };
}

export async function updateSmoothie(
  smoothieId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: SmoothieIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE smoothies
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    smoothieId,
  );

  await db.runAsync('DELETE FROM smoothie_ingredients WHERE smoothie_id = ?', smoothieId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `smoothie_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO smoothie_ingredients
          (id, smoothie_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      smoothieId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id: smoothieId };
}

// smoothie_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent smoothies row is enough.
export async function deleteSmoothie(smoothieId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM smoothies WHERE id = ?', smoothieId);
}

export type SmoothieRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listSmoothies(limit = 50): Promise<SmoothieRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<SmoothieRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM smoothie_ingredients WHERE smoothie_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM smoothies s
      LEFT JOIN smoothie_ingredients si ON si.smoothie_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type SmoothieDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `smoothie.instructions ?? []`.
  instructions?: string[];
};

export async function getSmoothie(smoothieId: string): Promise<SmoothieDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM smoothies
      WHERE id = ?
    `,
    smoothieId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type SmoothieIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
};

export async function getSmoothieIngredients(smoothieId: string): Promise<SmoothieIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SmoothieIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote
      FROM smoothie_ingredients
      WHERE smoothie_id = ?
      ORDER BY sort_order
    `,
    smoothieId,
  );
}

// Smoothie-scoped equivalent of getSaladNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'smoothie'
// instead of 'salad' is the only real difference in the shape produced.
export async function getSmoothieNutrientBreakdown(smoothieId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const smoothie = await getSmoothie(smoothieId);
  if (!smoothie) return empty;

  const ingredients = await getSmoothieIngredients(smoothieId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const smoothieTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      smoothieTotals[code] = (smoothieTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const smoothieBreakdown: DailyNutrientSideBreakdown = { sideName: smoothie.name, totals: smoothieTotals, items: itemBreakdowns };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: smoothie.id,
    mealName: smoothie.name,
    mealType: 'smoothie',
    totals: smoothieTotals,
    sides: [smoothieBreakdown],
  };

  return {
    dayTotals: smoothieTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Smoothie-scoped equivalent of getSaladSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getSmoothieSixDimensionsBreakdown(
  smoothieId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const smoothie = await getSmoothie(smoothieId);
  if (!smoothie) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getSmoothieIngredients(smoothieId);
  return buildDishSixDimensionsBreakdown(smoothie.id, smoothie.name, ingredients, 'smoothie', trackedConditions);
}

// Fermentation Builder's own CRUD, 2026-08-02 -- deliberate line-for-line
// mirror of the smoothies/smoothie_ingredients functions directly above
// (see the sides/side_ingredients comment further up for the full "why
// separate tables/functions per builder" reasoning, unchanged here).
export type FermentationIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
  // 2026-08-11 -- see AlcoholCalculatorOverride's own comment above
  // (beverage_ingredients' own migration) for the full reasoning; same
  // shape, same read-side effect, reused as-is rather than a second,
  // near-identical type per builder.
  calculatorOverride?: AlcoholCalculatorOverride | null;
};

export async function saveFermentation(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: FermentationIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `fermentation_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO fermentations (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `fermentation_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO fermentation_ingredients
          (id, fermentation_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id };
}

export async function updateFermentation(
  fermentationId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: FermentationIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE fermentations
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    fermentationId,
  );

  await db.runAsync('DELETE FROM fermentation_ingredients WHERE fermentation_id = ?', fermentationId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `fermentation_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO fermentation_ingredients
          (id, fermentation_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      fermentationId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id: fermentationId };
}

// fermentation_ingredients rows cascade via their own FK (ON DELETE CASCADE,
// see initializeDatabase) -- deleting the parent fermentations row is enough.
export async function deleteFermentation(fermentationId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM fermentations WHERE id = ?', fermentationId);
}

export type FermentationRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listFermentations(limit = 50): Promise<FermentationRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<FermentationRecord>(
    `
      SELECT f.id, f.name, f.servings, f.serving_size_amount AS servingSizeAmount, f.serving_size_unit AS servingSizeUnit,
             f.created_at AS createdAt, COUNT(fi.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM fermentation_ingredients WHERE fermentation_id = f.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM fermentations f
      LEFT JOIN fermentation_ingredients fi ON fi.fermentation_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type FermentationDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `fermentation.instructions ?? []`.
  instructions?: string[];
};

export async function getFermentation(fermentationId: string): Promise<FermentationDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM fermentations
      WHERE id = ?
    `,
    fermentationId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type FermentationIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
  // See BeverageIngredientDetail's own identical comment.
  calculatorVolumeMl: number | null;
  calculatorAbvPercent: number | null;
  calculatorResidualSugarGPerL: number | null;
  calculatorRetentionId: string | null;
  calculatorPours: number | null;
  calculatorCalories: number | null;
  calculatorCarbsG: number | null;
};

export async function getFermentationIngredients(fermentationId: string): Promise<FermentationIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<FermentationIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote,
             calculator_volume_ml AS calculatorVolumeMl, calculator_abv_percent AS calculatorAbvPercent,
             calculator_residual_sugar_g_per_l AS calculatorResidualSugarGPerL,
             calculator_retention_id AS calculatorRetentionId, calculator_pours AS calculatorPours,
             calculator_calories AS calculatorCalories, calculator_carbs_g AS calculatorCarbsG
      FROM fermentation_ingredients
      WHERE fermentation_id = ?
      ORDER BY sort_order
    `,
    fermentationId,
  );
}

// Fermentation-scoped equivalent of getSmoothieNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'fermentation'
// instead of 'smoothie' is the only real difference in the shape produced.
export async function getFermentationNutrientBreakdown(fermentationId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const fermentation = await getFermentation(fermentationId);
  if (!fermentation) return empty;

  const ingredients = await getFermentationIngredients(fermentationId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const fermentationTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    // See getBeverageNutrientBreakdown's own identical block for the full
    // reasoning -- same real, tracked-value override, same two nutrients
    // only (calories/carbs), same reason every other one is left out.
    if (ingredient.calculatorCalories != null) {
      const itemTotals: Record<string, number> = { energy_kcal: ingredient.calculatorCalories };
      if (ingredient.calculatorCarbsG != null) {
        itemTotals.carbohydrate = ingredient.calculatorCarbsG;
      }
      itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
      for (const [code, amount] of Object.entries(itemTotals)) {
        fermentationTotals[code] = (fermentationTotals[code] ?? 0) + amount;
      }
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      fermentationTotals[code] = (fermentationTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const fermentationBreakdown: DailyNutrientSideBreakdown = {
    sideName: fermentation.name,
    totals: fermentationTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: fermentation.id,
    mealName: fermentation.name,
    mealType: 'fermentation',
    totals: fermentationTotals,
    sides: [fermentationBreakdown],
  };

  return {
    dayTotals: fermentationTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Fermentation-scoped equivalent of getSmoothieSixDimensionsBreakdown -- see
// that function's own comment for the full reasoning.
export async function getFermentationSixDimensionsBreakdown(
  fermentationId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const fermentation = await getFermentation(fermentationId);
  if (!fermentation) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getFermentationIngredients(fermentationId);
  return buildDishSixDimensionsBreakdown(fermentation.id, fermentation.name, ingredients, 'fermentation', trackedConditions);
}

// Beverage Builder's own CRUD, 2026-08-02 -- deliberate line-for-line
// mirror of the fermentations/fermentation_ingredients functions directly
// above (see the sides/side_ingredients comment further up for the full
// "why separate tables/functions per builder" reasoning, unchanged here).
// The real, tracked-value alcohol calculator payload, 2026-08-11 -- see
// this file's own beverage_ingredients migration comment. When present,
// getBeverageNutrientBreakdown uses `calories`/`carbsG` directly instead
// of the normal food_nutrients lookup for this one ingredient; every other
// field here exists only so the calculator can be restored to its own
// original inputs if this ingredient is edited later.
export type AlcoholCalculatorOverride = {
  volumeMl: number;
  abvPercent: number;
  residualSugarGPerL: number;
  retentionId: string;
  pours: number;
  calories: number;
  carbsG: number;
};

export type BeverageIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
  calculatorOverride?: AlcoholCalculatorOverride | null;
};

export async function saveBeverage(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: BeverageIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `beverage_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO beverages (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `beverage_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO beverage_ingredients
          (id, beverage_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id };
}

export async function updateBeverage(
  beverageId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: BeverageIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE beverages
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    beverageId,
  );

  await db.runAsync('DELETE FROM beverage_ingredients WHERE beverage_id = ?', beverageId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `beverage_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO beverage_ingredients
          (id, beverage_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      beverageId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id: beverageId };
}

// beverage_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent beverages row is enough.
export async function deleteBeverage(beverageId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM beverages WHERE id = ?', beverageId);
}

export type BeverageRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listBeverages(limit = 50): Promise<BeverageRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<BeverageRecord>(
    `
      SELECT b.id, b.name, b.servings, b.serving_size_amount AS servingSizeAmount, b.serving_size_unit AS servingSizeUnit,
             b.created_at AS createdAt, COUNT(bi.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM beverage_ingredients WHERE beverage_id = b.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM beverages b
      LEFT JOIN beverage_ingredients bi ON bi.beverage_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type BeverageDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `beverage.instructions ?? []`.
  instructions?: string[];
};

export async function getBeverage(beverageId: string): Promise<BeverageDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM beverages
      WHERE id = ?
    `,
    beverageId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type BeverageIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
  // Real, tracked-value calculator fields, 2026-08-11 -- all null unless
  // this ingredient was added via the alcohol calculator's own "use this
  // for tracking" flow. See AlcoholCalculatorOverride's own comment.
  calculatorVolumeMl: number | null;
  calculatorAbvPercent: number | null;
  calculatorResidualSugarGPerL: number | null;
  calculatorRetentionId: string | null;
  calculatorPours: number | null;
  calculatorCalories: number | null;
  calculatorCarbsG: number | null;
};

export async function getBeverageIngredients(beverageId: string): Promise<BeverageIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<BeverageIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote,
             calculator_volume_ml AS calculatorVolumeMl, calculator_abv_percent AS calculatorAbvPercent,
             calculator_residual_sugar_g_per_l AS calculatorResidualSugarGPerL,
             calculator_retention_id AS calculatorRetentionId, calculator_pours AS calculatorPours,
             calculator_calories AS calculatorCalories, calculator_carbs_g AS calculatorCarbsG
      FROM beverage_ingredients
      WHERE beverage_id = ?
      ORDER BY sort_order
    `,
    beverageId,
  );
}

// Beverage-scoped equivalent of getFermentationNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'beverage'
// instead of 'fermentation' is the only real difference in the shape
// produced.
export async function getBeverageNutrientBreakdown(beverageId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const beverage = await getBeverage(beverageId);
  if (!beverage) return empty;

  const ingredients = await getBeverageIngredients(beverageId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const beverageTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    // Real, tracked-value calculator override, 2026-08-11 -- when present,
    // this ingredient's own calories/carbs come directly from the
    // calculator's own real chemistry math instead of the normal
    // food_nutrients-times-quantity lookup below. Every OTHER nutrient
    // (protein, fat, vitamins, minerals) is left out of `itemTotals`
    // entirely -- deliberately, matching this app's own already-cited
    // research that distillation strips out virtually all non-ethanol
    // content, and the calculator was never designed to estimate anything
    // beyond calories/carbs even in its original, purely-informational
    // form. Skips the grams/getFoodNutrients lookup below entirely -- the
    // 6-Dimensions breakdown (a separate function) still uses this
    // ingredient's own real foodId/source for its qualitative D1-D6
    // scores, which this override intentionally leaves untouched.
    if (ingredient.calculatorCalories != null) {
      const itemTotals: Record<string, number> = { energy_kcal: ingredient.calculatorCalories };
      if (ingredient.calculatorCarbsG != null) {
        itemTotals.carbohydrate = ingredient.calculatorCarbsG;
      }
      itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
      for (const [code, amount] of Object.entries(itemTotals)) {
        beverageTotals[code] = (beverageTotals[code] ?? 0) + amount;
      }
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      beverageTotals[code] = (beverageTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const beverageBreakdown: DailyNutrientSideBreakdown = {
    sideName: beverage.name,
    totals: beverageTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: beverage.id,
    mealName: beverage.name,
    mealType: 'beverage',
    totals: beverageTotals,
    sides: [beverageBreakdown],
  };

  return {
    dayTotals: beverageTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Beverage-scoped equivalent of getFermentationSixDimensionsBreakdown -- see
// that function's own comment for the full reasoning.
export async function getBeverageSixDimensionsBreakdown(
  beverageId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const beverage = await getBeverage(beverageId);
  if (!beverage) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getBeverageIngredients(beverageId);
  return buildDishSixDimensionsBreakdown(beverage.id, beverage.name, ingredients, 'beverage', trackedConditions);
}

// Snack Builder's own CRUD, 2026-08-02 -- deliberate line-for-line mirror of
// the beverages/beverage_ingredients functions directly above (see the
// sides/side_ingredients comment further up for the full "why separate
// tables/functions per builder" reasoning, unchanged here).
export type SnackIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

export async function saveSnack(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SnackIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `snack_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO snacks (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `snack_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO snack_ingredients
          (id, snack_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id };
}

export async function updateSnack(
  snackId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: SnackIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE snacks
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    snackId,
  );

  await db.runAsync('DELETE FROM snack_ingredients WHERE snack_id = ?', snackId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `snack_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO snack_ingredients
          (id, snack_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      snackId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id: snackId };
}

// snack_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent snacks row is enough.
export async function deleteSnack(snackId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM snacks WHERE id = ?', snackId);
}

export type SnackRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listSnacks(limit = 50): Promise<SnackRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<SnackRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM snack_ingredients WHERE snack_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM snacks s
      LEFT JOIN snack_ingredients si ON si.snack_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type SnackDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. getSnack
  // itself always sets a real array (possibly empty), never leaves this
  // undefined -- but the FIELD stays optional, matching SideDetail's own
  // contract exactly. Callers should still read it as `snack.instructions ?? []`.
  instructions?: string[];
};

export async function getSnack(snackId: string): Promise<SnackDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM snacks
      WHERE id = ?
    `,
    snackId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type SnackIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
};

export async function getSnackIngredients(snackId: string): Promise<SnackIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SnackIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote
      FROM snack_ingredients
      WHERE snack_id = ?
      ORDER BY sort_order
    `,
    snackId,
  );
}

// Snack-scoped equivalent of getBeverageNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'snack' instead
// of 'beverage' is the only real difference in the shape produced.
export async function getSnackNutrientBreakdown(snackId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const snack = await getSnack(snackId);
  if (!snack) return empty;

  const ingredients = await getSnackIngredients(snackId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const snackTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      snackTotals[code] = (snackTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const snackBreakdown: DailyNutrientSideBreakdown = {
    sideName: snack.name,
    totals: snackTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: snack.id,
    mealName: snack.name,
    mealType: 'snack',
    totals: snackTotals,
    sides: [snackBreakdown],
  };

  return {
    dayTotals: snackTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Snack-scoped equivalent of getBeverageSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getSnackSixDimensionsBreakdown(
  snackId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const snack = await getSnack(snackId);
  if (!snack) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getSnackIngredients(snackId);
  return buildDishSixDimensionsBreakdown(snack.id, snack.name, ingredients, 'snack', trackedConditions);
}

// Baked Goods Builder's own CRUD, 2026-08-02 -- deliberate line-for-line
// mirror of the snacks/snack_ingredients functions directly above (see the
// sides/side_ingredients comment further up for the full "why separate
// tables/functions per builder" reasoning, unchanged here). Function/type
// names use the plural "BakedGoods" (matching the lens key), while the
// per-record id parameter is named the singular `bakedGoodId` (one saved
// item), matching the singular `baked_good_id` FK column on
// baked_goods_ingredients.
export type BakedGoodsIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

export async function saveBakedGoods(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: BakedGoodsIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `baked_good_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO baked_goods (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `baked_good_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO baked_goods_ingredients
          (id, baked_good_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id };
}

export async function updateBakedGoods(
  bakedGoodId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: BakedGoodsIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE baked_goods
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    bakedGoodId,
  );

  await db.runAsync('DELETE FROM baked_goods_ingredients WHERE baked_good_id = ?', bakedGoodId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `baked_good_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO baked_goods_ingredients
          (id, baked_good_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      bakedGoodId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id: bakedGoodId };
}

// baked_goods_ingredients rows cascade via their own FK (ON DELETE CASCADE,
// see initializeDatabase) -- deleting the parent baked_goods row is enough.
export async function deleteBakedGoods(bakedGoodId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM baked_goods WHERE id = ?', bakedGoodId);
}

export type BakedGoodsRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listBakedGoods(limit = 50): Promise<BakedGoodsRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<BakedGoodsRecord>(
    `
      SELECT b.id, b.name, b.servings, b.serving_size_amount AS servingSizeAmount, b.serving_size_unit AS servingSizeUnit,
             b.created_at AS createdAt, COUNT(bi.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM baked_goods_ingredients WHERE baked_good_id = b.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM baked_goods b
      LEFT JOIN baked_goods_ingredients bi ON bi.baked_good_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type BakedGoodsDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `bakedGood.instructions ?? []`.
  instructions?: string[];
};

export async function getBakedGoods(bakedGoodId: string): Promise<BakedGoodsDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM baked_goods
      WHERE id = ?
    `,
    bakedGoodId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type BakedGoodsIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
};

export async function getBakedGoodsIngredients(bakedGoodId: string): Promise<BakedGoodsIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<BakedGoodsIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote
      FROM baked_goods_ingredients
      WHERE baked_good_id = ?
      ORDER BY sort_order
    `,
    bakedGoodId,
  );
}

// Baked-Goods-scoped equivalent of getSnackNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'baked_good'
// instead of 'snack' is the only real difference in the shape produced.
export async function getBakedGoodsNutrientBreakdown(bakedGoodId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const bakedGood = await getBakedGoods(bakedGoodId);
  if (!bakedGood) return empty;

  const ingredients = await getBakedGoodsIngredients(bakedGoodId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const bakedGoodTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      bakedGoodTotals[code] = (bakedGoodTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const bakedGoodBreakdown: DailyNutrientSideBreakdown = {
    sideName: bakedGood.name,
    totals: bakedGoodTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: bakedGood.id,
    mealName: bakedGood.name,
    mealType: 'baked_good',
    totals: bakedGoodTotals,
    sides: [bakedGoodBreakdown],
  };

  return {
    dayTotals: bakedGoodTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Baked-Goods-scoped equivalent of getSnackSixDimensionsBreakdown -- see
// that function's own comment for the full reasoning.
export async function getBakedGoodsSixDimensionsBreakdown(
  bakedGoodId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const bakedGood = await getBakedGoods(bakedGoodId);
  if (!bakedGood) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getBakedGoodsIngredients(bakedGoodId);
  return buildDishSixDimensionsBreakdown(bakedGood.id, bakedGood.name, ingredients, 'baked_good', trackedConditions);
}

// Soup Builder's own CRUD, 2026-08-02 -- deliberate line-for-line mirror of
// the baked_goods/baked_goods_ingredients functions directly above (see the
// sides/side_ingredients comment further up for the full "why separate
// tables/functions per builder" reasoning, unchanged here).
export type SoupIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
  // See FermentationIngredientInput's own identical comment.
  calculatorOverride?: AlcoholCalculatorOverride | null;
};

export async function saveSoup(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SoupIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `soup_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO soups (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `soup_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO soup_ingredients
          (id, soup_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id };
}

export async function updateSoup(
  soupId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: SoupIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE soups
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    soupId,
  );

  await db.runAsync('DELETE FROM soup_ingredients WHERE soup_id = ?', soupId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `soup_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO soup_ingredients
          (id, soup_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      soupId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id: soupId };
}

// soup_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent soups row is enough.
export async function deleteSoup(soupId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM soups WHERE id = ?', soupId);
}

export type SoupRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listSoups(limit = 50): Promise<SoupRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<SoupRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM soup_ingredients WHERE soup_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM soups s
      LEFT JOIN soup_ingredients si ON si.soup_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type SoupDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `soup.instructions ?? []`.
  instructions?: string[];
};

export async function getSoup(soupId: string): Promise<SoupDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM soups
      WHERE id = ?
    `,
    soupId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type SoupIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
  // See BeverageIngredientDetail's own identical comment.
  calculatorVolumeMl: number | null;
  calculatorAbvPercent: number | null;
  calculatorResidualSugarGPerL: number | null;
  calculatorRetentionId: string | null;
  calculatorPours: number | null;
  calculatorCalories: number | null;
  calculatorCarbsG: number | null;
};

export async function getSoupIngredients(soupId: string): Promise<SoupIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SoupIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote,
             calculator_volume_ml AS calculatorVolumeMl, calculator_abv_percent AS calculatorAbvPercent,
             calculator_residual_sugar_g_per_l AS calculatorResidualSugarGPerL,
             calculator_retention_id AS calculatorRetentionId, calculator_pours AS calculatorPours,
             calculator_calories AS calculatorCalories, calculator_carbs_g AS calculatorCarbsG
      FROM soup_ingredients
      WHERE soup_id = ?
      ORDER BY sort_order
    `,
    soupId,
  );
}

// Soup-scoped equivalent of getBakedGoodsNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'soup' instead
// of 'baked_good' is the only real difference in the shape produced.
export async function getSoupNutrientBreakdown(soupId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const soup = await getSoup(soupId);
  if (!soup) return empty;

  const ingredients = await getSoupIngredients(soupId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const soupTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    // See getBeverageNutrientBreakdown's own identical block for the full
    // reasoning -- same real, tracked-value override, same two nutrients
    // only (calories/carbs), same reason every other one is left out.
    if (ingredient.calculatorCalories != null) {
      const itemTotals: Record<string, number> = { energy_kcal: ingredient.calculatorCalories };
      if (ingredient.calculatorCarbsG != null) {
        itemTotals.carbohydrate = ingredient.calculatorCarbsG;
      }
      itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
      for (const [code, amount] of Object.entries(itemTotals)) {
        soupTotals[code] = (soupTotals[code] ?? 0) + amount;
      }
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      soupTotals[code] = (soupTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const soupBreakdown: DailyNutrientSideBreakdown = {
    sideName: soup.name,
    totals: soupTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: soup.id,
    mealName: soup.name,
    mealType: 'soup',
    totals: soupTotals,
    sides: [soupBreakdown],
  };

  return {
    dayTotals: soupTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Soup-scoped equivalent of getBakedGoodsSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getSoupSixDimensionsBreakdown(
  soupId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const soup = await getSoup(soupId);
  if (!soup) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getSoupIngredients(soupId);
  return buildDishSixDimensionsBreakdown(soup.id, soup.name, ingredients, 'soup', trackedConditions);
}

// Sauces Builder's own CRUD, 2026-08-02 -- deliberate line-for-line mirror
// of the soups/soup_ingredients functions directly above (see the
// sides/side_ingredients comment further up for the full "why separate
// tables/functions per builder" reasoning, unchanged here). Kept singular
// ("Sauce") throughout, matching Salad/Smoothie/Fermentation/Beverage/
// Snack/Soup's own naming, even though the component itself is
// SaucesBuilder (see that file's own top comment for why).
export type SauceIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
  // See FermentationIngredientInput's own identical comment.
  calculatorOverride?: AlcoholCalculatorOverride | null;
};

export async function saveSauce(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SauceIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `sauce_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO sauces (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `sauce_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO sauce_ingredients
          (id, sauce_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id };
}

export async function updateSauce(
  sauceId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: SauceIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE sauces
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    sauceId,
  );

  await db.runAsync('DELETE FROM sauce_ingredients WHERE sauce_id = ?', sauceId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `sauce_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO sauce_ingredients
          (id, sauce_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      sauceId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id: sauceId };
}

// sauce_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent sauces row is enough.
export async function deleteSauce(sauceId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sauces WHERE id = ?', sauceId);
}

export type SauceRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listSauces(limit = 50): Promise<SauceRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<SauceRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM sauce_ingredients WHERE sauce_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM sauces s
      LEFT JOIN sauce_ingredients si ON si.sauce_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type SauceDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `sauce.instructions ?? []`.
  instructions?: string[];
};

export async function getSauce(sauceId: string): Promise<SauceDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM sauces
      WHERE id = ?
    `,
    sauceId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type SauceIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
  // See BeverageIngredientDetail's own identical comment.
  calculatorVolumeMl: number | null;
  calculatorAbvPercent: number | null;
  calculatorResidualSugarGPerL: number | null;
  calculatorRetentionId: string | null;
  calculatorPours: number | null;
  calculatorCalories: number | null;
  calculatorCarbsG: number | null;
};

export async function getSauceIngredients(sauceId: string): Promise<SauceIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SauceIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote,
             calculator_volume_ml AS calculatorVolumeMl, calculator_abv_percent AS calculatorAbvPercent,
             calculator_residual_sugar_g_per_l AS calculatorResidualSugarGPerL,
             calculator_retention_id AS calculatorRetentionId, calculator_pours AS calculatorPours,
             calculator_calories AS calculatorCalories, calculator_carbs_g AS calculatorCarbsG
      FROM sauce_ingredients
      WHERE sauce_id = ?
      ORDER BY sort_order
    `,
    sauceId,
  );
}

// Sauce-scoped equivalent of getSoupNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'sauce' instead
// of 'soup' is the only real difference in the shape produced.
export async function getSauceNutrientBreakdown(sauceId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const sauce = await getSauce(sauceId);
  if (!sauce) return empty;

  const ingredients = await getSauceIngredients(sauceId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const sauceTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    // See getBeverageNutrientBreakdown's own identical block for the full
    // reasoning -- same real, tracked-value override, same two nutrients
    // only (calories/carbs), same reason every other one is left out.
    if (ingredient.calculatorCalories != null) {
      const itemTotals: Record<string, number> = { energy_kcal: ingredient.calculatorCalories };
      if (ingredient.calculatorCarbsG != null) {
        itemTotals.carbohydrate = ingredient.calculatorCarbsG;
      }
      itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
      for (const [code, amount] of Object.entries(itemTotals)) {
        sauceTotals[code] = (sauceTotals[code] ?? 0) + amount;
      }
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      sauceTotals[code] = (sauceTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const sauceBreakdown: DailyNutrientSideBreakdown = {
    sideName: sauce.name,
    totals: sauceTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: sauce.id,
    mealName: sauce.name,
    mealType: 'sauce',
    totals: sauceTotals,
    sides: [sauceBreakdown],
  };

  return {
    dayTotals: sauceTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Sauce-scoped equivalent of getSoupSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getSauceSixDimensionsBreakdown(
  sauceId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const sauce = await getSauce(sauceId);
  if (!sauce) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getSauceIngredients(sauceId);
  return buildDishSixDimensionsBreakdown(sauce.id, sauce.name, ingredients, 'sauce', trackedConditions);
}

// Handhelds Builder's own CRUD, 2026-08-04 -- deliberate line-for-line
// mirror of the sauces/sauce_ingredients functions directly above (see the
// sides/side_ingredients comment further up for the full "why separate
// tables/functions per builder" reasoning, unchanged here). Kept singular
// ("Handheld") throughout, matching Salad/Smoothie/Fermentation/Beverage/
// Snack/Soup/Sauces' own naming, even though the component itself is
// HandheldsBuilder (see that file's own top comment for why).
export type HandheldIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
};

export async function saveHandheld(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: HandheldIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `handheld_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO handhelds (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `handheld_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO handheld_ingredients
          (id, handheld_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id };
}

export async function updateHandheld(
  handheldId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: HandheldIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE handhelds
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    handheldId,
  );

  await db.runAsync('DELETE FROM handheld_ingredients WHERE handheld_id = ?', handheldId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `handheld_ingredient_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO handheld_ingredients
          (id, handheld_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      handheldId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
    );
  }

  return { id: handheldId };
}

// handheld_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent handhelds row is enough.
export async function deleteHandheld(handheldId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM handhelds WHERE id = ?', handheldId);
}

export type HandheldRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listHandhelds(limit = 50): Promise<HandheldRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HandheldRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM handheld_ingredients WHERE handheld_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM handhelds s
      LEFT JOIN handheld_ingredients si ON si.handheld_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type HandheldDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `handheld.instructions ?? []`.
  instructions?: string[];
};

export async function getHandheld(handheldId: string): Promise<HandheldDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM handhelds
      WHERE id = ?
    `,
    handheldId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type HandheldIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
};

export async function getHandheldIngredients(handheldId: string): Promise<HandheldIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<HandheldIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote
      FROM handheld_ingredients
      WHERE handheld_id = ?
      ORDER BY sort_order
    `,
    handheldId,
  );
}

// Handheld-scoped equivalent of getSoupNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'handheld' instead
// of 'soup' is the only real difference in the shape produced.
export async function getHandheldNutrientBreakdown(handheldId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const handheld = await getHandheld(handheldId);
  if (!handheld) return empty;

  const ingredients = await getHandheldIngredients(handheldId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const handheldTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      handheldTotals[code] = (handheldTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const handheldBreakdown: DailyNutrientSideBreakdown = {
    sideName: handheld.name,
    totals: handheldTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: handheld.id,
    mealName: handheld.name,
    mealType: 'handheld',
    totals: handheldTotals,
    sides: [handheldBreakdown],
  };

  return {
    dayTotals: handheldTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Handheld-scoped equivalent of getSoupSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getHandheldSixDimensionsBreakdown(
  handheldId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const handheld = await getHandheld(handheldId);
  if (!handheld) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getHandheldIngredients(handheldId);
  return buildDishSixDimensionsBreakdown(handheld.id, handheld.name, ingredients, 'handheld', trackedConditions);
}

// Dessert Builder's own CRUD, 2026-08-14 -- deliberate line-for-line mirror
// of the sauces/sauce_ingredients functions directly above (see the
// sides/side_ingredients comment further up for the full "why separate
// tables/functions per builder" reasoning, unchanged here). Kept singular
// ("Dessert") throughout, matching every real builder's own naming --
// including this one's own component, since (unlike Sauces/Handhelds)
// DessertBuilder's own lens key was chosen singular from the start, so no
// plural-component-name exception was needed (see that file's own top
// comment for the full reasoning).
export type DessertIngredientInput = {
  foodId: number;
  source: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote?: string;
  // See FermentationIngredientInput's own identical comment.
  calculatorOverride?: AlcoholCalculatorOverride | null;
};

export async function saveDessert(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: DessertIngredientInput[];
  instructions: string[];
  depthData?: RecipeDepthResult;
}) {
  const db = await getDatabase();
  const id = `dessert_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO desserts (id, name, servings, serving_size_amount, serving_size_unit, instructions_json, depth_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `dessert_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO dessert_ingredients
          (id, dessert_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      id,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id };
}

export async function updateDessert(
  dessertId: string,
  input: {
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    ingredients: DessertIngredientInput[];
    instructions: string[];
    depthData?: RecipeDepthResult;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE desserts
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, instructions_json = ?, depth_data_json = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
    serializeInstructions(input.instructions),
    input.depthData ? JSON.stringify(input.depthData) : null,
    now,
    dessertId,
  );

  await db.runAsync('DELETE FROM dessert_ingredients WHERE dessert_id = ?', dessertId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    const ingredientId = `dessert_ingredient_${Date.now()}_${index}`;
    const c = ingredient.calculatorOverride ?? null;
    await db.runAsync(
      `
        INSERT INTO dessert_ingredients
          (id, dessert_id, food_id, food_name, category, quantity, unit, cut_prep, cooking_method, prep_note, sort_order, created_at,
           calculator_volume_ml, calculator_abv_percent, calculator_residual_sugar_g_per_l, calculator_retention_id,
           calculator_pours, calculator_calories, calculator_carbs_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      dessertId,
      `${ingredient.foodId}|${ingredient.source}`,
      ingredient.foodName,
      ingredient.category,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cutPrep,
      ingredient.cookingMethod,
      ingredient.prepNote?.trim() || null,
      index,
      now,
      c?.volumeMl ?? null,
      c?.abvPercent ?? null,
      c?.residualSugarGPerL ?? null,
      c?.retentionId ?? null,
      c?.pours ?? null,
      c?.calories ?? null,
      c?.carbsG ?? null,
    );
  }

  return { id: dessertId };
}

// dessert_ingredients rows cascade via their own FK (ON DELETE CASCADE, see
// initializeDatabase) -- deleting the parent desserts row is enough.
export async function deleteDessert(dessertId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM desserts WHERE id = ?', dessertId);
}

export type DessertRecord = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredientCount: number;
  ingredientNames: string | null;
  createdAt: string;
};

export async function listDesserts(limit = 50): Promise<DessertRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<DessertRecord>(
    `
      SELECT s.id, s.name, s.servings, s.serving_size_amount AS servingSizeAmount, s.serving_size_unit AS servingSizeUnit,
             s.created_at AS createdAt, COUNT(si.id) AS ingredientCount,
             (
               SELECT GROUP_CONCAT(food_name, ', ')
               FROM (SELECT food_name FROM dessert_ingredients WHERE dessert_id = s.id ORDER BY sort_order)
             ) AS ingredientNames
      FROM desserts s
      LEFT JOIN dessert_ingredients si ON si.dessert_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export type DessertDetail = {
  id: string;
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  createdAt: string;
  // 2026-08-25, see depth_data_json's own migration comment on sides.
  depthData?: RecipeDepthResult;
  // Real, hand-authored prep steps, 2026-08-17 -- see SideBuilder.tsx's own
  // Steps section for the original instance of this exact field. Callers
  // should read it as `dessert.instructions ?? []`.
  instructions?: string[];
};

export async function getDessert(dessertId: string): Promise<DessertDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    servings: number;
    servingSizeAmount: number;
    servingSizeUnit: string;
    createdAt: string;
    instructionsJson: string | null;
    depthDataJson: string | null;
  }>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt, instructions_json AS instructionsJson, depth_data_json AS depthDataJson
      FROM desserts
      WHERE id = ?
    `,
    dessertId,
  );
  if (!row) return null;
  const { instructionsJson, depthDataJson, ...rest } = row;
  return {
    ...rest,
    instructions: parseInstructionsJson(instructionsJson),
    depthData: depthDataJson ? (JSON.parse(depthDataJson) as RecipeDepthResult) : undefined,
  };
}

export type DessertIngredientDetail = {
  id: string;
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
  cutPrep: string;
  cookingMethod: string;
  prepNote: string | null;
  // See BeverageIngredientDetail's own identical comment.
  calculatorVolumeMl: number | null;
  calculatorAbvPercent: number | null;
  calculatorResidualSugarGPerL: number | null;
  calculatorRetentionId: string | null;
  calculatorPours: number | null;
  calculatorCalories: number | null;
  calculatorCarbsG: number | null;
};

export async function getDessertIngredients(dessertId: string): Promise<DessertIngredientDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<DessertIngredientDetail>(
    `
      SELECT id, food_id AS foodId, food_name AS foodName, category, quantity, unit,
             cut_prep AS cutPrep, cooking_method AS cookingMethod, prep_note AS prepNote,
             calculator_volume_ml AS calculatorVolumeMl, calculator_abv_percent AS calculatorAbvPercent,
             calculator_residual_sugar_g_per_l AS calculatorResidualSugarGPerL,
             calculator_retention_id AS calculatorRetentionId, calculator_pours AS calculatorPours,
             calculator_calories AS calculatorCalories, calculator_carbs_g AS calculatorCarbsG
      FROM dessert_ingredients
      WHERE dessert_id = ?
      ORDER BY sort_order
    `,
    dessertId,
  );
}

// Dessert-scoped equivalent of getSoupNutrientBreakdown -- see that
// function's own comment for the full reasoning. mealType 'dessert' instead
// of 'soup' is the only real difference in the shape produced.
export async function getDessertNutrientBreakdown(dessertId: string): Promise<DailyNutrientBreakdown> {
  const empty: DailyNutrientBreakdown = {
    dayTotals: {},
    meals: [],
    driRows: [],
    supplementTotals: {},
    unresolvedItems: [],
    supplementSkipped: [],
    profileComplete: false,
  };
  const dessert = await getDessert(dessertId);
  if (!dessert) return empty;

  const ingredients = await getDessertIngredients(dessertId);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const itemBreakdowns: DailyNutrientItemBreakdown[] = [];
  const dessertTotals: Record<string, number> = {};
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  for (const ingredient of ingredients) {
    if (!ingredient.foodId) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) {
      unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'not_linked_to_a_food' });
      continue;
    }

    // See getBeverageNutrientBreakdown's own identical block for the full
    // reasoning -- same real, tracked-value override, same two nutrients
    // only (calories/carbs), same reason every other one is left out.
    if (ingredient.calculatorCalories != null) {
      const itemTotals: Record<string, number> = { energy_kcal: ingredient.calculatorCalories };
      if (ingredient.calculatorCarbsG != null) {
        itemTotals.carbohydrate = ingredient.calculatorCarbsG;
      }
      itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
      for (const [code, amount] of Object.entries(itemTotals)) {
        dessertTotals[code] = (dessertTotals[code] ?? 0) + amount;
      }
      continue;
    }

    let grams: number;
    if (ingredient.unit.trim().toLowerCase() === 'each') {
      const unitWeight = await getFoodUnitWeight(foodId, source);
      if (!unitWeight) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'no_unit_weight_data' });
        continue;
      }
      grams = unitWeight.gramsPerUnit * ingredient.quantity;
    } else {
      const unit = normalizeUnitForConversion(ingredient.unit);
      if (!unit) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: 'unsupported_unit' });
        continue;
      }
      const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
        ? null
        : ingredient.category ?? (await getFoodCategory(foodId, source));
      const conversion = convertToGrams(ingredient.quantity, unit, { foodCategory: foodCategory ?? undefined });
      if (!conversion.ok) {
        unresolvedItems.push({ mealItemId: ingredient.id, foodName: ingredient.foodName, reason: conversion.reason });
        continue;
      }
      grams = conversion.grams;
    }

    const cacheKey = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(cacheKey);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(cacheKey, nutrients);
    }
    const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: grams, nutrients }]);
    itemBreakdowns.push({ foodName: ingredient.foodName, totals: itemTotals });
    for (const [code, amount] of Object.entries(itemTotals)) {
      dessertTotals[code] = (dessertTotals[code] ?? 0) + amount;
    }
  }

  const [driRows, profile] = await Promise.all([getDietaryReferenceIntakesForCurrentUser(), getUserProfile()]);

  const dessertBreakdown: DailyNutrientSideBreakdown = {
    sideName: dessert.name,
    totals: dessertTotals,
    items: itemBreakdowns,
  };
  const mealBreakdown: DailyNutrientMealBreakdown = {
    mealId: dessert.id,
    mealName: dessert.name,
    mealType: 'dessert',
    totals: dessertTotals,
    sides: [dessertBreakdown],
  };

  return {
    dayTotals: dessertTotals,
    meals: [mealBreakdown],
    driRows,
    supplementTotals: {},
    unresolvedItems,
    supplementSkipped: [],
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Dessert-scoped equivalent of getSoupSixDimensionsBreakdown -- see that
// function's own comment for the full reasoning.
export async function getDessertSixDimensionsBreakdown(
  dessertId: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const dessert = await getDessert(dessertId);
  if (!dessert) return { day: [], dayPerCondition: {}, meals: [] };
  const ingredients = await getDessertIngredients(dessertId);
  return buildDishSixDimensionsBreakdown(dessert.id, dessert.name, ingredients, 'dessert', trackedConditions);
}

// itemType filters to just 'meal' or 'side' favorites; omit it to get both
// mixed together (the original behavior, kept as the default since some
// callers -- like the very first favorites list this app had -- don't care
// about the distinction).
export async function listFavorites(
  limit = 8,
  itemType?:
    | 'meal'
    | 'side'
    | 'salad'
    | 'smoothie'
    | 'fermentation'
    | 'beverage'
    | 'snack'
    | 'bakedGoods'
    | 'soup'
    | 'sauce'
    | 'handheld'
    | 'dessert',
) {
  const db = await getDatabase();
  return db.getAllAsync<FavoriteRecord>(
    `
      SELECT id, item_type, name, payload_json, last_used_at, created_at, updated_at
      FROM favorites
      ${itemType ? 'WHERE item_type = ?' : ''}
      ORDER BY last_used_at DESC, created_at DESC
      LIMIT ?
    `,
    ...(itemType ? [itemType, limit] : [limit]),
  );
}

export async function deleteFavorite(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM favorites WHERE id = ?', id);
}

// Makes one of a rotating ingredient's alternates the new current pick --
// the old current food goes back into the alternates pool (at the spot the
// chosen one occupied, so the list doesn't visibly reorder itself),
// swapping only identity (foodId/foodName/category). Quantity, unit,
// notes, and every side-level field (dishName, sideName, dishServings,
// yourSharePercent, cookingMethod) all carry over unchanged -- rotation is
// about which food fills the slot, not how much of it or which dish it's
// in. A no-op if alternateIndex is out of range.
export function applyRotationSelection(ingredient: MealIngredientInput, alternateIndex: number): MealIngredientInput {
  const alternates = ingredient.rotationAlternates ?? [];
  const chosen = alternates[alternateIndex];
  if (!chosen) return ingredient;

  const previousCurrent: IngredientRotationAlternate = {
    foodId: ingredient.foodId,
    foodName: ingredient.foodName,
    category: ingredient.category,
  };
  const nextAlternates = [...alternates.slice(0, alternateIndex), previousCurrent, ...alternates.slice(alternateIndex + 1)];

  return {
    ...ingredient,
    foodId: chosen.foodId,
    foodName: chosen.foodName,
    category: chosen.category,
    rotationAlternates: nextAlternates,
  };
}

// Overlays one scheduled occurrence's own rotation choices onto a
// favorite's base ingredient list -- used both when resolving what a
// scheduled meal actually prefills as ("Log now", see
// applyFavoriteTemplate in app/(tabs)/index.tsx) and when opening the
// Rotate sheet for a specific occurrence (to show what's already chosen
// for it, not the favorite's own untouched default). Matches by slotId, so
// an ingredient without one (never touched by rotation, or saved before
// slotId existed) is simply left as the favorite's own default -- a safe,
// unsurprising fallback, not a crash.
export function applyRotationSelectionsToIngredients(
  ingredients: MealIngredientInput[],
  selections: RotationSelection[],
): MealIngredientInput[] {
  if (selections.length === 0) return ingredients;
  const bySlotId = new Map(selections.map((selection) => [selection.slotId, selection]));

  return ingredients.map((ingredient) => {
    if (!ingredient.slotId) return ingredient;
    const selection = bySlotId.get(ingredient.slotId);
    if (!selection) return ingredient;
    return { ...ingredient, foodId: selection.foodId, foodName: selection.foodName, category: selection.category };
  });
}

// Shared by createMeal (fresh insert) and replaceMealItems (re-insert
// after an edit) so there's exactly one place that knows the meal_items
// column layout.
async function insertMealItems(db: SQLite.SQLiteDatabase, mealId: string, ingredients: MealIngredientInput[], now: string) {
  for (const [index, ingredient] of ingredients.entries()) {
    const ingredientId = `meal_item_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO meal_items
          (id, meal_id, food_id, food_name, category, dish_name, side_name, dish_servings, your_share_percent, cooking_method, serving_size, serving_unit, quantity, sort_order, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ingredientId,
      mealId,
      ingredient.foodId ?? null,
      ingredient.foodName,
      ingredient.category ?? null,
      ingredient.dishName?.trim() || null,
      ingredient.sideName?.trim() || null,
      ingredient.dishServings ?? 1,
      ingredient.yourSharePercent ?? null,
      ingredient.cookingMethod?.trim() || null,
      ingredient.quantity,
      ingredient.unit,
      1,
      index,
      ingredient.notes?.trim() || null,
      now,
    );
  }
}

export async function createMeal(input: {
  name: string;
  mealType: string;
  eatenAt: string;
  notes?: string;
  isImmediate: boolean;
  ingredients: MealIngredientInput[];
}) {
  const db = await getDatabase();
  const id = `meal_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO meals (id, name, meal_type, eaten_at, notes, source_type, is_immediate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'manual', ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.mealType,
    input.eatenAt,
    input.notes?.trim() || null,
    input.isImmediate ? 1 : 0,
    now,
    now,
  );

  await insertMealItems(db, id, input.ingredients, now);

  return { id, name: input.name.trim(), mealType: input.mealType, eatenAt: input.eatenAt, notes: input.notes?.trim() || null, isImmediate: input.isImmediate };
}

// A single real meal's own metadata -- 2026-08-14, the real gap Past
// Meals' own editMealId mode needs (Meal Builder's own name/mealType
// fields need a real starting value, not just its components). No
// equivalent existed before this -- listMeals/listMealsForDate are both
// real, bounded lists, never a single-row lookup by id.
export async function getMeal(id: string): Promise<MealRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MealRecord>(
    'SELECT id, name, meal_type, eaten_at, notes, is_immediate, created_at FROM meals WHERE id = ?',
    id,
  );
  return row ?? null;
}

// Updates the meal's own fields -- deliberately doesn't touch eaten_at OR
// is_immediate, since editing a meal to fix an ingredient shouldn't
// silently re-date it or reclassify whether it was originally logged live
// vs after the fact. Pair with replaceMealItems to update its ingredients
// too.
export async function updateMeal(
  mealId: string,
  input: { name: string; mealType: string; notes?: string },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE meals SET name = ?, meal_type = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.mealType,
    input.notes?.trim() || null,
    now,
    mealId,
  );
}

// Replaces every ingredient on an existing meal with a new set -- the
// whole point of "editing a dish" is that dishes aren't their own DB row
// (they're just a shared dish_name/dish_servings across several
// meal_items rows), so the simplest correct way to persist a rename, a
// servings change, or an added/removed ingredient is to re-save the whole
// ingredient list rather than diff it item by item. meal_item ids are not
// referenced anywhere else, so replacing them outright is safe.
export async function replaceMealItems(mealId: string, ingredients: MealIngredientInput[]) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync('DELETE FROM meal_items WHERE meal_id = ?', mealId);
  await insertMealItems(db, mealId, ingredients, now);
}

export async function deleteMeal(mealId: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meals WHERE id = ?', mealId);
}

// Meal Builder's own layer, 2026-08-02 -- assembles a real meal (a normal
// `meals` row + flattened `meal_items`, via createMeal above -- no changes
// needed to it) out of one or more already-saved records from the 9 Food
// sub-builders (sides, salads, smoothies, fermentations, beverages, snacks,
// baked goods, soups, sauces). See meal_components' own comment (in
// initializeDatabase) for why a second, bookkeeping-only table sits
// alongside the flattened meal_items copy rather than replacing it.
export type MealComponentType =
  | 'side'
  | 'salad'
  | 'smoothie'
  | 'fermentation'
  | 'beverage'
  | 'snack'
  | 'bakedGoods'
  | 'soup'
  | 'sauce'
  | 'handheld'
  | 'dessert';

// The one real difference between the 10 sub-builders' otherwise identical
// getX/getXIngredients pairs is which functions they are -- this is the
// single place that knows the mapping, so resolveMealComponent below (and
// anything else that ever needs "look this component up regardless of
// which builder it came from") doesn't need its own copy of this switch.
export function getComponentDetail(componentType: MealComponentType, componentId: string) {
  switch (componentType) {
    case 'side':
      return getSide(componentId);
    case 'salad':
      return getSalad(componentId);
    case 'smoothie':
      return getSmoothie(componentId);
    case 'fermentation':
      return getFermentation(componentId);
    case 'beverage':
      return getBeverage(componentId);
    case 'snack':
      return getSnack(componentId);
    case 'bakedGoods':
      return getBakedGoods(componentId);
    case 'soup':
      return getSoup(componentId);
    case 'sauce':
      return getSauce(componentId);
    case 'handheld':
      return getHandheld(componentId);
    case 'dessert':
      return getDessert(componentId);
  }
}

export function getComponentIngredients(componentType: MealComponentType, componentId: string) {
  switch (componentType) {
    case 'side':
      return getSideIngredients(componentId);
    case 'salad':
      return getSaladIngredients(componentId);
    case 'smoothie':
      return getSmoothieIngredients(componentId);
    case 'fermentation':
      return getFermentationIngredients(componentId);
    case 'beverage':
      return getBeverageIngredients(componentId);
    case 'snack':
      return getSnackIngredients(componentId);
    case 'bakedGoods':
      return getBakedGoodsIngredients(componentId);
    case 'soup':
      return getSoupIngredients(componentId);
    case 'sauce':
      return getSauceIngredients(componentId);
    case 'handheld':
      return getHandheldIngredients(componentId);
    case 'dessert':
      return getDessertIngredients(componentId);
  }
}

// --- 6-Week Meal Plan (2026-08-24) -----------------------------------------
//
// Direct request: "I want a button that will set it up for them if they want
// it to, or they can go through and individually import meals into the
// schedule." Both paths below build on the exact same real primitives this
// file already has, rather than a new persistence mechanism: a curated
// recipe resolves via getCuratedRecipe() into a BuilderFavoritePayload (the
// same call recipes.ts's own "Build This Recipe" button already makes), one
// of the 11 saveX() functions just above turns that into a real, standalone
// saved dish (the same save every builder's own Save button already calls),
// and scheduleSingleComponent()/scheduleMeal() (both already existed, built
// 2026-08-15 for My Kitchen/My Favorites) place it on a specific date. This
// section only adds the one small piece that didn't exist yet: a generic
// dispatcher across all 11 saveX() functions, mirroring getComponentDetail/
// getComponentIngredients' own per-type switch just above rather than a new
// pattern.
async function saveComponentFromCuratedPayload(
  builderType: BuilderFavoriteItemType,
  payload: BuilderFavoritePayload,
): Promise<{ id: string }> {
  // Every one of the 11 saveX() functions requires a real instructions
  // array (never undefined) even though BuilderFavoritePayload's own
  // instructions field is optional -- getCuratedRecipe() never actually
  // populates it (curated_recipes/curated_recipe_ingredients has no
  // instructions column at all; recipes.ts's own recipeCard.instructions is
  // customer-facing Digest text, a separate real thing), so every saved
  // dish built this way starts with no steps of its own, the same real gap
  // the existing thumbs-up-to-favorite path (tryAddEntryToFavorites in
  // purple-digest.tsx) already has for the identical reason. "View Full
  // Recipe" back in the Digest still shows the real, authored steps; this
  // just doesn't duplicate them into a second copy nothing reads.
  const withInstructions = { ...payload, instructions: payload.instructions ?? [] };
  switch (builderType) {
    case 'side':
      return saveSide({ ...withInstructions, ingredients: withInstructions.ingredients as SideIngredientInput[] });
    case 'salad':
      return saveSalad({ ...withInstructions, ingredients: withInstructions.ingredients as SaladIngredientInput[] });
    case 'smoothie':
      return saveSmoothie({ ...withInstructions, ingredients: withInstructions.ingredients as SmoothieIngredientInput[] });
    case 'fermentation':
      return saveFermentation({ ...withInstructions, ingredients: withInstructions.ingredients as FermentationIngredientInput[] });
    case 'beverage':
      return saveBeverage({ ...withInstructions, ingredients: withInstructions.ingredients as BeverageIngredientInput[] });
    case 'snack':
      return saveSnack({ ...withInstructions, ingredients: withInstructions.ingredients as SnackIngredientInput[] });
    case 'bakedGoods':
      return saveBakedGoods({ ...withInstructions, ingredients: withInstructions.ingredients as BakedGoodsIngredientInput[] });
    case 'soup':
      return saveSoup({ ...withInstructions, ingredients: withInstructions.ingredients as SoupIngredientInput[] });
    case 'sauce':
      return saveSauce({ ...withInstructions, ingredients: withInstructions.ingredients as SauceIngredientInput[] });
    case 'handheld':
      return saveHandheld({ ...withInstructions, ingredients: withInstructions.ingredients as HandheldIngredientInput[] });
    case 'dessert':
      return saveDessert({ ...withInstructions, ingredients: withInstructions.ingredients as DessertIngredientInput[] });
  }
}

// One breakfast/lunch/dinner slot's real content -- one main component
// (linkedCuratedRecipeId/linkedBuilderType, matching recipes.ts's own two
// fields of the same name) plus, 2026-08-26, up to five further optional
// components spanning the other builder types, so a real dinner can
// combine a main dish with a distinct side, a salad, a sauce, and a
// beverage the same way an actual composed plate would -- not just one
// recipe standing in for the whole meal. Widened from the original
// main+side-only shape rather than replaced: every existing MealPlanDay
// literal (lib/mealPlan.ts, lib/mealPlanVegan.ts, lib/mealPlanVegetarian.ts)
// only ever sets main/side, and adding optional fields here doesn't
// invalidate any of those, so this is a real, backwards-compatible
// widening, not a breaking change. Deliberately no `snack`/`bakedGoods`
// roles -- a composed lunch/dinner plate doesn't call for either the way
// it calls for a side, a salad, a sauce, or a beverage; a whole-meal
// snack/baked-good dish already fits through `main` on its own. See
// lib/mealPlan.ts's own header comment for why this shape was chosen in
// the first place.
export type MealPlanComponentRef = {
  builderType: BuilderFavoriteItemType;
  curatedRecipeId: string;
};

export type MealPlanSlot = {
  main: MealPlanComponentRef;
  side?: MealPlanComponentRef;
  salad?: MealPlanComponentRef;
  soup?: MealPlanComponentRef;
  sauce?: MealPlanComponentRef;
  beverage?: MealPlanComponentRef;
  dessert?: MealPlanComponentRef;
};

export type MealPlanDay = {
  day: number;
  breakfast: MealPlanSlot;
  lunch: MealPlanSlot;
  dinner: MealPlanSlot;
};

// "X with Y" for exactly two components (the original, already-shipped
// wording, unchanged for every existing 2-component slot) -- "X, Y, and
// Z" once a slot actually combines three or more, rather than repeating
// "with" past the point it reads naturally ("X with Y with Z with W").
function joinMealTitleParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} with ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

// Builds every real component a slot references, saves each as a real,
// standalone dish, wraps them into one real meal favorite (a genuine
// dinner with a side and a salad is 3 real components under one
// favorite, not 3 separate meals), and schedules that favorite for the
// given date. Returns the new schedule_items id. Shared by both
// setUpMealPlan (all days at once) and addMealPlanDayToSchedule (one day
// at a time) below, so the two paths can never drift apart in what they
// actually build.
async function scheduleMealPlanSlot(
  slot: MealPlanSlot,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  scheduledFor: string,
): Promise<string> {
  const refs = [slot.main, slot.side, slot.salad, slot.soup, slot.sauce, slot.beverage, slot.dessert].filter(
    (ref): ref is MealPlanComponentRef => ref !== undefined,
  );
  const components: MealFavoriteComponent[] = [];
  const titleParts: string[] = [];

  for (const ref of refs) {
    const recipe = await getCuratedRecipe(ref.curatedRecipeId);
    if (!recipe) {
      throw new Error(`[scheduleMealPlanSlot] Missing curated recipe: ${ref.curatedRecipeId}`);
    }
    const saved = await saveComponentFromCuratedPayload(ref.builderType, recipe);
    components.push({ componentType: ref.builderType, componentId: saved.id, yourSharePercent: 100 });
    titleParts.push(recipe.name);
  }

  const title = joinMealTitleParts(titleParts);
  const favorite = await saveMealFavorite({ name: title, mealType, components });
  return scheduleMeal({ title, mealType, scheduledFor, sourceFavoriteId: favorite.id });
}

// "set this up for them if they want it to" -- walks every day in
// lib/mealPlan.ts's own MEAL_PLAN, scheduling all 3 slots starting from
// startDate (a plain 'YYYY-MM-DD' local date, day 1 = startDate). Real,
// re-run-safe: if a prior partial run already scheduled some days (the app
// closing mid-setup, say), this skips any date that already has a planned
// meal for that exact mealType rather than double-booking it, checked via a
// direct query rather than assumed from how far a loop got.
export async function setUpMealPlan(
  startDate: string,
  mealPlan: MealPlanDay[],
): Promise<{ scheduled: number; skipped: number }> {
  const db = await getDatabase();
  let scheduled = 0;
  let skipped = 0;

  for (const planDay of mealPlan) {
    const date = addDaysToLocalDate(startDate, planDay.day - 1);
    for (const [mealType, slot] of [
      ['breakfast', planDay.breakfast],
      ['lunch', planDay.lunch],
      ['dinner', planDay.dinner],
    ] as const) {
      const time = mealType === 'breakfast' ? '08:00' : mealType === 'lunch' ? '12:30' : '18:30';
      const scheduledFor = `${date}T${time}`;
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM schedule_items WHERE item_type = 'meal' AND meal_type = ? AND substr(scheduled_for, 1, 10) = ? AND status = 'planned' LIMIT 1`,
        mealType,
        date,
      );
      if (existing) {
        skipped += 1;
        continue;
      }
      await scheduleMealPlanSlot(slot, mealType, scheduledFor);
      scheduled += 1;
    }
  }

  return { scheduled, skipped };
}

// The manual/individual path -- "or they can go through and individually
// import meals into the schedule" -- the same real per-slot logic as
// setUpMealPlan above, for just one already-chosen day and date, so picking
// a single day from the Meal Plan lens works exactly like the bulk button
// did for that one day, no separate code path to drift out of sync.
export async function addMealPlanDayToSchedule(planDay: MealPlanDay, date: string): Promise<void> {
  await scheduleMealPlanSlot(planDay.breakfast, 'breakfast', `${date}T08:00`);
  await scheduleMealPlanSlot(planDay.lunch, 'lunch', `${date}T12:30`);
  await scheduleMealPlanSlot(planDay.dinner, 'dinner', `${date}T18:30`);
}

function addDaysToLocalDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + days);
  return utcMidnight.toISOString().slice(0, 10);
}

// --- Shopping list (2026-08-24) ---------------------------------------------
//
// "receive a full shopping list for all ingredients to be purchased fresh
// every 3 to 4 days" -- a genuinely new capability, confirmed directly: no
// existing code resolves a still-planned (not yet eaten/settled)
// schedule_items row's real ingredients today. schedule.tsx's own
// favoriteBaseIngredients only understands the OLD flat-ingredient meal-
// favorite shape (MealFavoritePayload.ingredients), not the component-
// reference shape saveMealFavorite/scheduleSingleComponent actually create
// (MealFavoriteComponentsPayload.components, always ingredients: [] on
// purpose -- see that type's own comment above). This walks that real chain
// instead: schedule_items -> its favorite's real components[] ->
// getComponentIngredients() (already existed) per component, OR, for a
// schedule_items row scheduled straight from an already-logged meal
// (source_meal_id, not source_favorite_id -- Meal Builder's own older
// path), meal_items directly. Works for ANY planned meal in range, not just
// ones the 6-Week Meal Plan itself created, so this is a real, general
// Schedule capability rather than a plan-only side effect.
export type ShoppingListItem = {
  category: string;
  foodName: string;
  unit: string;
  quantity: number;
};

export type ShoppingListSection = {
  category: string;
  items: ShoppingListItem[];
};

async function shoppingListItemsForFavorite(favoriteId: string): Promise<ShoppingListItem[]> {
  const favorite = await getMealFavorite(favoriteId);
  if (!favorite) return [];
  const items: ShoppingListItem[] = [];
  for (const component of favorite.components) {
    const ingredients = await getComponentIngredients(component.componentType, component.componentId);
    for (const ingredient of ingredients ?? []) {
      items.push({ category: ingredient.category ?? 'Other', foodName: ingredient.foodName, unit: ingredient.unit ?? '', quantity: ingredient.quantity });
    }
  }
  return items;
}

// meal_items' own real amount-for-this-person math (shareFraction, see
// getDailyNutrientBreakdown's own identical formula elsewhere in this file)
// without that other path's grams-conversion step -- a shopping list wants
// "how much to buy" in the ingredient's own real, natural unit (2 cups,
// 3 apples), not converted into grams the way nutrient math needs.
async function shoppingListItemsForMeal(mealId: string): Promise<ShoppingListItem[]> {
  const items = await getMealItems(mealId);
  return items.map((item) => {
    const shareFraction = item.yourSharePercent != null ? item.yourSharePercent / 100 : 1 / (item.dishServings ?? 1);
    return {
      category: item.category ?? 'Other',
      foodName: item.foodName,
      unit: item.servingUnit ?? '',
      quantity: (item.servingSize ?? 0) * shareFraction,
    };
  });
}

// daysAhead counts today as day 1 of the window, matching how "every 3 to 4
// days" reads in normal speech (today plus the next 2-3, not today plus 4
// more).
export async function getUpcomingShoppingList(daysAhead: number = 4): Promise<ShoppingListSection[]> {
  const db = await getDatabase();
  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = addDaysToLocalDate(startDate, Math.max(1, daysAhead) - 1);

  const rows = await db.getAllAsync<{ source_favorite_id: string | null; source_meal_id: string | null }>(
    `
      SELECT source_favorite_id, source_meal_id FROM schedule_items
      WHERE item_type = 'meal' AND status = 'planned' AND substr(scheduled_for, 1, 10) BETWEEN ? AND ?
    `,
    startDate,
    endDate,
  );

  const allItems: ShoppingListItem[] = [];
  for (const row of rows) {
    if (row.source_favorite_id) {
      allItems.push(...(await shoppingListItemsForFavorite(row.source_favorite_id)));
    } else if (row.source_meal_id) {
      allItems.push(...(await shoppingListItemsForMeal(row.source_meal_id)));
    }
  }

  const grouped = new Map<string, Map<string, ShoppingListItem>>();
  for (const item of allItems) {
    if (!grouped.has(item.category)) grouped.set(item.category, new Map());
    const byName = grouped.get(item.category)!;
    const key = `${item.foodName}|${item.unit}`;
    const existing = byName.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      byName.set(key, { ...item });
    }
  }

  return Array.from(grouped.entries())
    .map(([category, byName]) => ({
      category,
      items: Array.from(byName.values()).sort((a, b) => a.foodName.localeCompare(b.foodName)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export type MealComponentSelection = {
  componentType: MealComponentType;
  componentId: string;
  // "How much of this did you have?" -- asked once per selected component
  // during assembly, the one new question none of the 9 sub-builders ask
  // on their own (each only states how many servings the WHOLE saved
  // record makes). Same field/meaning as meal_items' own your_share_percent
  // -- see MealIngredientInput's own comment for the full reasoning.
  yourSharePercent: number;
};

export type ResolvedMealComponent = {
  componentType: MealComponentType;
  componentId: string;
  name: string;
  servings: number;
  yourSharePercent: number;
  ingredients: MealIngredientInput[];
  // 2026-08-17 -- real, hand-authored prep steps, only ever populated for a
  // 'side' component so far (see SideDetail.instructions); every other
  // componentType's own XDetail has no such field yet, so this stays
  // undefined for them the exact same way it does for a side with zero
  // steps of its own -- not a gap this app is trying to hide, just not
  // built out for the other 10 builders yet.
  instructions?: string[];
  // 2026-08-25 -- same real depth (safeForConditions/conditionCautions/
  // dietTags/stageNotes) a curated recipe already carries. Populated for
  // any of the 10 direct-ingredient builders once their own UI computes and
  // saves it on finish (see each XBuilder.tsx's own finishX); Meal Builder
  // itself is out of scope for this (it assembles already-saved components
  // rather than raw ingredients, a genuinely different shape this same
  // computation was never designed for -- see lib/recipeDepth.ts).
  depthData?: RecipeDepthResult;
};

// Turns one selected component into the MealIngredientInput[] slice
// createMeal/replaceMealItems already know how to write -- the actual
// technical center of Meal Builder. Returns null if the component's own
// saved record has since been deleted (see meal_components' own comment on
// why there's no real FK to enforce this can't happen).
export async function resolveMealComponent(selection: MealComponentSelection): Promise<ResolvedMealComponent | null> {
  const detail = await getComponentDetail(selection.componentType, selection.componentId);
  if (!detail) return null;

  // Real, narrow cast -- getComponentDetail's own inferred return type is a
  // union across all 11 builders' own XDetail shapes, and only SideDetail
  // actually carries `instructions` today. Widening every other XDetail
  // with the same optional field just to avoid this cast is real, separate
  // work for whenever those builders get their own Steps section (see
  // SideDetail's own comment) -- not done blind here.
  const detailInstructions = selection.componentType === 'side' ? (detail as SideDetail).instructions : undefined;
  // 2026-08-25 -- generalized the same day the depth-report rollout gave
  // all 11 XDetail shapes a real depthData field (see each one's own
  // "2026-08-25, see depth_data_json's own migration comment on sides"
  // line): unlike instructions above, every builder now genuinely carries
  // this, so no per-type branch is needed here, just a shared, generic cast.
  const detailDepthData = (detail as { depthData?: RecipeDepthResult }).depthData;

  const ingredients = await getComponentIngredients(selection.componentType, selection.componentId);
  const mealIngredients: MealIngredientInput[] = ingredients
    .filter((ingredient) => ingredient.foodId)
    .map((ingredient) => ({
      foodId: ingredient.foodId ?? undefined,
      foodName: ingredient.foodName,
      category: ingredient.category ?? '',
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.prepNote ?? undefined,
      // component.name is the grouping key AND the display label -- see
      // meal_items' own dishName/sideName comments for why both exist;
      // for a Meal-Builder-sourced dish they're always identical, the
      // same "one real name" every sub-builder already asks for.
      dishName: detail.name,
      sideName: detail.name,
      dishServings: detail.servings,
      yourSharePercent: selection.yourSharePercent,
      cookingMethod: ingredient.cookingMethod,
    }));

  return {
    componentType: selection.componentType,
    componentId: selection.componentId,
    name: detail.name,
    servings: detail.servings,
    yourSharePercent: selection.yourSharePercent,
    ingredients: mealIngredients,
    instructions: detailInstructions && detailInstructions.length > 0 ? detailInstructions : undefined,
    depthData: detailDepthData,
  };
}

export async function saveMealComponents(mealId: string, components: MealComponentSelection[]): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  for (const [index, component] of components.entries()) {
    const id = `meal_component_${Date.now()}_${index}`;
    await db.runAsync(
      `
        INSERT INTO meal_components (id, meal_id, component_type, component_id, your_share_percent, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      id,
      mealId,
      component.componentType,
      component.componentId,
      component.yourSharePercent,
      index,
      now,
    );
  }
}

// Same delete-then-reinsert pattern as replaceMealItems above -- meal_component
// rows carry no independent identity anything else references, so this is
// safe and simplest. Used when Meal Builder re-saves an existing meal (the
// Log Now resume path, see app/(tabs)/food.tsx's own editMealId handling).
export async function replaceMealComponents(mealId: string, components: MealComponentSelection[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_components WHERE meal_id = ?', mealId);
  await saveMealComponents(mealId, components);
}

export type MealComponentRecord = {
  id: string;
  mealId: string;
  componentType: MealComponentType;
  componentId: string;
  yourSharePercent: number;
  sortOrder: number;
};

// Ordered the same way they were originally selected (sort_order, set at
// save time) -- what Meal Builder's own resume-for-editing path reads to
// rebuild the real picker state, per meal_components' own top comment.
export async function getMealComponents(mealId: string): Promise<MealComponentRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<MealComponentRecord>(
    `
      SELECT id, meal_id AS mealId, component_type AS componentType, component_id AS componentId,
             your_share_percent AS yourSharePercent, sort_order AS sortOrder
      FROM meal_components
      WHERE meal_id = ?
      ORDER BY sort_order
    `,
    mealId,
  );
}

// The one call Meal Builder's own Finish actions actually make -- resolves
// every selected component to its own ingredient slice, flattens them into
// one meal via createMeal (untouched, already-proven), and records the
// bookkeeping meal_components rows alongside it. Returns an error message
// instead of throwing when a selected component can no longer be resolved
// (its own saved record was deleted mid-build) -- a real, honest state to
// show the person rather than a half-written meal.
export async function createMealFromComponents(input: {
  name: string;
  mealType: string;
  eatenAt: string;
  notes?: string;
  isImmediate: boolean;
  components: MealComponentSelection[];
}): Promise<{ id: string } | { error: string }> {
  const resolved = await Promise.all(input.components.map(resolveMealComponent));
  const missingIndex = resolved.findIndex((component) => component === null);
  if (missingIndex !== -1) {
    return { error: 'One of the items in this meal could not be found -- it may have been deleted. Remove it and try again.' };
  }

  const ingredients = (resolved as ResolvedMealComponent[]).flatMap((component) => component.ingredients);
  const meal = await createMeal({
    name: input.name,
    mealType: input.mealType,
    eatenAt: input.eatenAt,
    notes: input.notes,
    isImmediate: input.isImmediate,
    ingredients,
  });
  await saveMealComponents(meal.id, input.components);

  // Real "this food got eaten" moment -- see activateWaitingTrialsForComponents'
  // own comment. Wrapped so a hiccup here can never break a real, already-
  // successful meal log.
  try {
    await activateWaitingTrialsForComponents(input.components, input.eatenAt, { mealId: meal.id });
  } catch (error) {
    console.error('[createMealFromComponents] Failed to activate waiting food trials', error);
  }

  return { id: meal.id };
}

// Same shape as createMealFromComponents, applied to an EXISTING meal --
// for Meal Builder's own "resume and re-save" path (editing a still-planned
// scheduled meal, see app/(tabs)/food.tsx's own editMealId handling).
// Deliberately does NOT change eaten_at/is_immediate (same reasoning as
// updateMeal above) -- fixing which components make up a meal shouldn't
// silently re-date it.
export async function updateMealFromComponents(
  mealId: string,
  input: {
    name: string;
    mealType: string;
    notes?: string;
    components: MealComponentSelection[];
  },
): Promise<{ id: string } | { error: string }> {
  const resolved = await Promise.all(input.components.map(resolveMealComponent));
  const missingIndex = resolved.findIndex((component) => component === null);
  if (missingIndex !== -1) {
    return { error: 'One of the items in this meal could not be found -- it may have been deleted. Remove it and try again.' };
  }

  const ingredients = (resolved as ResolvedMealComponent[]).flatMap((component) => component.ingredients);
  await updateMeal(mealId, { name: input.name, mealType: input.mealType, notes: input.notes });
  await replaceMealItems(mealId, ingredients);
  await replaceMealComponents(mealId, input.components);
  return { id: mealId };
}

// What Meal Builder's own "Add from..." picker shows once a category is
// opened -- one row per already-saved record of that type, reusing each
// sub-builder's own listX() (same ingredientCount/ingredientNames summary
// already shown in app/food-items.tsx's own list) rather than a second,
// component-specific query.
export type MealComponentOption = {
  id: string;
  name: string;
  servings: number;
  ingredientCount: number;
  ingredientNames: string | null;
};

// What Meal Builder's own Log Now resume path (app/(tabs)/food.tsx's own
// templateMealId handling) reads to redisplay each already-selected
// component's own name/servings without needing the full ingredient list
// resolveMealComponent also fetches -- just the two display fields the
// "Your Meal" summary card actually shows.
export async function getMealComponentDisplayInfo(
  componentType: MealComponentType,
  componentId: string,
): Promise<{ name: string; servings: number } | null> {
  const detail = await getComponentDetail(componentType, componentId);
  return detail ? { name: detail.name, servings: detail.servings } : null;
}

export async function listMealComponentOptions(componentType: MealComponentType): Promise<MealComponentOption[]> {
  switch (componentType) {
    case 'side':
      return listSides();
    case 'salad':
      return listSalads();
    case 'smoothie':
      return listSmoothies();
    case 'fermentation':
      return listFermentations();
    case 'beverage':
      return listBeverages();
    case 'snack':
      return listSnacks();
    case 'bakedGoods':
      return listBakedGoods();
    case 'soup':
      return listSoups();
    case 'sauce':
      return listSauces();
    case 'handheld':
      return listHandhelds();
    case 'dessert':
      return listDesserts();
  }
}

// 2026-08-15 -- real, thin per-user computation shared by the two new
// dynamic Digest lenses (My Kitchen: a person's own saved builder
// creations; My Favorites: their favorited builds + favorite meals), each
// giving a user's own real creation the same level of computed detail
// (nutrition highlights, condition cautions) the curated Recipes category
// already ships (see lib/digest/recipes.ts) -- but computed live against
// this app's own bundled reference/DRI/condition data, never bundled or
// hand-authored, since there's no way to know ahead of time what anyone
// will actually build.

// Which real, saved-record table each component type lives in -- the one
// small, shared lookup the shared_from_name/photo_uri migrations below key
// off, rather than a switch repeated in three places. Exported so
// lib/mealPhotos.ts and lib/sharing.ts (both real leaf modules that import
// FROM this file, never the reverse -- see lib/sharing.ts's own header
// comment for why) can reuse the identical real table map rather than a
// second, separately-maintained copy.
export const COMPONENT_TABLE_BY_TYPE: Record<MealComponentType, string> = {
  side: 'sides',
  salad: 'salads',
  smoothie: 'smoothies',
  fermentation: 'fermentations',
  beverage: 'beverages',
  snack: 'snacks',
  bakedGoods: 'baked_goods',
  soup: 'soups',
  sauce: 'sauces',
  handheld: 'handhelds',
  dessert: 'desserts',
};

// getSharedFromName moved to lib/sharing.ts, 2026-08-15, alongside the rest
// of the real sharing feature -- see that file's own header comment.

// The real per-ingredient nutrient-summing math already proven for the
// Trends performance rewrite (resolveIngredientNutrientTotals,
// createIngredientResolutionCaches, addNutrientTotalsInto, all just above
// getNutrientTotalsByDateRange) -- reused directly rather than a second,
// separately-maintained copy of the same real unit-conversion/
// share-fraction logic. Takes a plain MealIngredientInput[] (exactly what
// resolveMealComponent already returns) since that's the one real,
// already-proven way to turn ANY of the 11 saved-record types, or a
// favorite meal's own several real components concatenated together, into
// one flat ingredient list with no per-type branching needed here.
export async function computeIngredientListNutrition(ingredients: MealIngredientInput[]): Promise<{
  totals: Record<string, number>;
  unresolvedItems: { foodName: string; reason: string }[];
}> {
  const caches = createIngredientResolutionCaches();
  const totals: Record<string, number> = {};
  const unresolvedItems: { foodName: string; reason: string }[] = [];

  for (const ingredient of ingredients) {
    const itemTotals = await resolveIngredientNutrientTotals(
      {
        foodId: ingredient.foodId,
        category: ingredient.category,
        rawAmount: ingredient.quantity,
        rawUnit: ingredient.unit,
        dishServings: ingredient.dishServings,
        yourSharePercent: ingredient.yourSharePercent,
      },
      caches,
    );
    if (!itemTotals) {
      unresolvedItems.push({
        foodName: ingredient.foodName,
        reason: !ingredient.foodId ? 'not_linked_to_a_food' : 'unsupported_unit_or_amount',
      });
      continue;
    }
    addNutrientTotalsInto(totals, itemTotals);
  }

  return { totals, unresolvedItems };
}

export type ComponentNutritionHighlight = { nutrient: string; note: string };

// The real, general core -- 2026-08-15, split out so both a real saved
// record (My Kitchen, resolved via getComponentNutritionHighlights below)
// AND a favorite's own plain payload (My Favorites, which has no real
// componentId to resolve -- its own ingredients live directly in
// favorites.payload_json, never in one of the 11 saved-record tables) can
// share the identical real %DV computation, the same "amount / DRI
// target" math the curated Recipes' own one-off grounding script already
// used (scripts/compute_recipe_data.js, per lib/digest/recipes.ts's own
// header comment), just run live here instead of precomputed. ingredients
// should already reflect the WHOLE dish at full share (yourSharePercent:
// 100) -- servings is applied here, once, to get a real "per serving"
// figure, matching curated Recipes' own established framing.
export async function getNutritionHighlightsForIngredients(
  ingredients: MealIngredientInput[],
  servings: number,
  topN = 4,
): Promise<ComponentNutritionHighlight[]> {
  const [{ totals }, driRows] = await Promise.all([
    computeIngredientListNutrition(ingredients),
    getDietaryReferenceIntakesForCurrentUser(),
  ]);
  const effectiveServings = servings > 0 ? servings : 1;

  const scored: { nutrient: string; percent: number }[] = [];
  const seenCodes = new Set<string>();
  for (const dri of driRows) {
    // A CDRR row (sodium) is a ceiling, not a floor -- "gives you 40% of a
    // day's sodium" reads as a warning, not the positive "what this dish
    // gives you" framing this section is built for, so it's left out here
    // (a real sodium caution belongs in condition notes instead, not this
    // list).
    if (dri.valueType === 'CDRR') continue;
    if (seenCodes.has(dri.nutrientCode)) continue; // an unset profile can return >1 real row per nutrient (both sexes/age bands) -- first one wins
    const amount = totals[dri.nutrientCode];
    if (!amount || amount <= 0 || !dri.amount) continue;
    const percent = (amount / effectiveServings / dri.amount) * 100;
    if (percent < 5) continue; // too small a share of the real target to be a meaningful highlight
    seenCodes.add(dri.nutrientCode);
    scored.push({ nutrient: dri.displayName, percent });
  }
  scored.sort((a, b) => b.percent - a.percent);
  return scored.slice(0, topN).map(({ nutrient, percent }) => ({
    nutrient,
    note: `${Math.round(percent)}% of a day's ${nutrient} target, per serving.`,
  }));
}

// The same real %-of-daily-target math as getNutritionHighlightsForIngredients
// just above, generalized for a real chart rather than a short, pre-worded
// highlights list -- 2026-08-25, direct correction to the first Nutrition &
// Safety Report attempt: "It needs to be a report about the nutrients. It
// does need to use some sort of graph instead of just writing it out."
// Returns plain {nutrient, percent} pairs (no formatted sentence) so
// RecipeDepthReport.tsx can actually plot them as bars; the same CDRR
// (ceiling, not floor -- sodium) exclusion applies for the same reason
// named there, and the same "too small a share to be meaningful" floor is
// relaxed from 5% to 2% since a chart with many thin bars still reads
// fine, unlike a short prose list that would get cluttered fast.
export async function getNutrientChartDataForIngredients(
  ingredients: MealIngredientInput[],
  servings: number,
  topN = 8,
): Promise<{ nutrient: string; percent: number }[]> {
  const [{ totals }, driRows] = await Promise.all([
    computeIngredientListNutrition(ingredients),
    getDietaryReferenceIntakesForCurrentUser(),
  ]);
  const effectiveServings = servings > 0 ? servings : 1;

  const scored: { nutrient: string; percent: number }[] = [];
  const seenCodes = new Set<string>();
  for (const dri of driRows) {
    if (dri.valueType === 'CDRR') continue;
    if (seenCodes.has(dri.nutrientCode)) continue;
    const amount = totals[dri.nutrientCode];
    if (!amount || amount <= 0 || !dri.amount) continue;
    const percent = (amount / effectiveServings / dri.amount) * 100;
    if (percent < 2) continue;
    seenCodes.add(dri.nutrientCode);
    scored.push({ nutrient: dri.displayName, percent });
  }
  scored.sort((a, b) => b.percent - a.percent);
  return scored.slice(0, topN);
}

// Thin wrapper over the real, general core above for a genuine saved
// record (My Kitchen) -- resolves the whole dish at full (100%) share via
// the already-proven resolveMealComponent, since there's no "your share"
// concept yet for a standalone saved item, only once it's actually part
// of a real meal.
export async function getComponentNutritionHighlights(
  componentType: MealComponentType,
  componentId: string,
  topN = 4,
): Promise<ComponentNutritionHighlight[]> {
  const resolved = await resolveMealComponent({ componentType, componentId, yourSharePercent: 100 });
  if (!resolved) return [];
  return getNutritionHighlightsForIngredients(resolved.ingredients, resolved.servings, topN);
}

// Only a real, specific, actionable flag counts as worth surfacing here --
// the exact same curation rule (and the exact same real excluded-as-noise
// tags: Selenium & Zn synergy, Iron Presence, both near-universal
// background signal in this app's own mineral-absorption dimension) that
// lib/digest/recipes.ts's own header comment already documents for curated
// Recipes, so a person's own saved creation gets held to the identical
// standard rather than a looser or stricter one.
function isNoteworthyConditionFlag(subCriterion: string, tier: string): boolean {
  switch (subCriterion) {
    case 'Gluten':
      return tier === 'High Risk';
    case 'Goitrogenic Load':
      return tier === 'Goitrogenic (Raw)';
    case 'Oxalate Load Rank':
      return tier === 'High Risk' || tier === 'Use Carefully';
    case 'Lectins (Legumes)':
      return tier === 'High Risk';
    case 'Fermentability':
      return tier === 'Disruptive';
    case 'Irritants':
      return tier === 'Disruptive';
    case 'Omega-3 vs 6':
      return tier === 'Imbalanced';
    case 'Iodine':
      return tier === 'Excess Risk';
    // The real, already-established per-condition elimination-diet trigger
    // tag (Dairy/Nightshade/Corn/Citrus/Egg/Coffee-Caffeine) reused across
    // Hashimoto's/RA/Psoriasis/Celiac's own advisories -- any real,
    // specific trigger name is worth surfacing; only its own "nothing
    // flagged" default tier is excluded.
    case 'Common Elimination-Diet Trigger Food':
      return tier !== 'Not a Common Trigger';
    default:
      return false;
  }
}

export type ComponentConditionNote = { condition: string; note: string };

// The real, general core -- 2026-08-15, split out for the same real
// reason as getNutritionHighlightsForIngredients above: a favorite's own
// plain ingredient list has no real componentId to resolve through
// getComponentIngredients. Checks each real ingredient against the
// person's own actually-selected conditions (never all 19 -- matching how
// the rest of this app already scopes condition-aware content to what
// someone actually tracks), reusing getFoodScoresForCondition per
// ingredient per condition, the exact same real mechanism the curated
// Recipes' own grounding pass already used. conditions is the caller's own
// already-fetched listAllConditions() result (or a filtered slice of it)
// so this can be called many times across a whole My Kitchen/My Favorites
// screen without re-querying the small conditions table on every single
// item.
export async function getConditionNotesForIngredients(
  ingredients: { foodId?: string | null; foodName: string }[],
  conditions: { code: string; name: string }[],
): Promise<ComponentConditionNote[]> {
  if (conditions.length === 0 || ingredients.length === 0) return [];

  const notes: ComponentConditionNote[] = [];
  for (const condition of conditions) {
    const flaggedFoods: string[] = [];
    for (const ingredient of ingredients) {
      if (!ingredient.foodId) continue;
      const [foodIdStr, source] = ingredient.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;
      const scores = await getFoodScoresForCondition(foodId, source, condition.code);
      if (scores.some((score) => isNoteworthyConditionFlag(score.subCriterion, score.tier))) {
        flaggedFoods.push(ingredient.foodName);
      }
    }
    if (flaggedFoods.length > 0) {
      const shown = flaggedFoods.slice(0, 3).join(', ');
      const rest = flaggedFoods.length > 3 ? `, and ${flaggedFoods.length - 3} more` : '';
      notes.push({
        condition: condition.name,
        note: `${shown}${rest} may be worth a closer look if you have ${condition.name}.`,
      });
    }
  }
  return notes;
}

// Thin wrapper over the real, general core above for a genuine saved
// record (My Kitchen) -- resolves ingredients via the already-proven
// getComponentIngredients dispatcher.
export async function getComponentConditionNotes(
  componentType: MealComponentType,
  componentId: string,
  conditions: { code: string; name: string }[],
): Promise<ComponentConditionNote[]> {
  const ingredients = await getComponentIngredients(componentType, componentId);
  return getConditionNotesForIngredients(ingredients, conditions);
}

// Pools the raw-goitrogenic-load check every sub-builder already runs on
// its OWN ingredient list (see e.g. SaladBuilder's own
// findRawGoitrogenicIngredients) across every component actually selected
// into this meal -- two separately-built sides can each be individually
// fine (one raw goitrogenic vegetable apiece) while still combining into
// the same real risk this checks for elsewhere: easy to eat far more of
// them raw and combined than any one builder's own ingredient list would
// show on its own. Reuses getComponentIngredients (the same dispatcher
// resolveMealComponent uses) rather than a second switch.
export async function getMealComponentsGoitrogenicFlags(components: MealComponentSelection[]): Promise<string[]> {
  const flagged: string[] = [];
  for (const component of components) {
    const ingredients = await getComponentIngredients(component.componentType, component.componentId);
    for (const ingredient of ingredients) {
      if (!ingredient.foodId) continue;
      const [foodIdStr, source] = ingredient.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;
      const scores = await getFoodScores(foodId, source);
      const goitrogenicScore = scores.find((score) => score.subCriterion === 'Goitrogenic Load');
      if (goitrogenicScore?.tier.startsWith('Goitrogenic')) {
        flagged.push(ingredient.foodName);
      }
    }
  }
  return flagged;
}

// The real "start the clock" moment for a 'waiting' trial -- 2026-08-14,
// direct feedback: "the 3 day trial can't start until they have scheduled
// the meal that will contain the trial food." Structured identically to
// getMealComponentsGoitrogenicFlags immediately above (same real
// getComponentIngredients resolution loop, same foodId.split('|')
// parsing) -- reusing an already-proven pattern rather than a new one.
// For each real, resolved ingredient across every selected component,
// checks for a matching 'waiting' trial and, if found, genuinely starts
// it: status -> 'trialing', started_at set to the real occurredAt (when
// the food was actually eaten or is actually scheduled to be, never
// "today" by default), and a real, fresh reminder series anchored there.
//
// Called from the two real places this app's own architecture ever
// creates a genuine "this food got eaten" event -- createMealFromComponents
// (Log This Now, occurredAt = the real eatenAt) and scheduleMeal (Save &
// Schedule for Later, occurredAt = the real scheduledFor) -- both callers
// wrap this in a try/catch so a hiccup here can never break the real
// meal-logging/scheduling action itself.
//
// refs, 2026-08-14 -- the real "which meal (or schedule occurrence, if no
// real meal exists yet) proves this happened" trace Past Meals needs to
// later find and correct/revert the right trial. scheduleMeal only ever
// has a real schedule_item id at the moment it calls this (no meals row
// exists until "Log now" or settlePastScheduledMeals' own later
// auto-materialize pass creates one), so it passes refs.scheduleItemId
// only. createMealFromComponents (both the direct "Log This Now" path and
// settlePastScheduledMeals, which goes through it too) always has a real
// meal.id, so it passes refs.mealId. Two real, separate cases follow from
// that split: a genuinely NEW activation records whichever ref is given;
// an ALREADY-active trial with no activated_by_meal_id yet (activated
// earlier at schedule time, before a real meal existed) gets it backfilled
// the moment one shows up, so Past Meals can always find it by meal id
// once a real meal exists, regardless of which path actually started it.
export async function activateWaitingTrialsForComponents(
  components: MealComponentSelection[],
  occurredAt: string,
  refs?: { scheduleItemId?: string; mealId?: string },
): Promise<void> {
  for (const component of components) {
    const ingredients = await getComponentIngredients(component.componentType, component.componentId);
    for (const ingredient of ingredients) {
      if (!ingredient.foodId) continue;
      const [foodIdStr, source] = ingredient.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;

      const trials = await getFoodTrialHistory(foodId, source);
      const waitingTrial = trials.find((trial) => trial.status === 'waiting');
      const db = await getDatabase();
      const now = new Date().toISOString();

      if (waitingTrial) {
        await db.runAsync(
          `UPDATE food_trials SET status = 'trialing', started_at = ?, activated_by_schedule_item_id = ?, activated_by_meal_id = ?, updated_at = ? WHERE id = ?`,
          occurredAt,
          refs?.scheduleItemId ?? null,
          refs?.mealId ?? null,
          now,
          waitingTrial.id,
        );
        await scheduleFoodTrialCheckins({
          foodTrialId: waitingTrial.id,
          foodName: waitingTrial.foodName,
          firstScheduledFor: `${occurredAt.slice(0, 10)}T20:00`,
          observationDays: waitingTrial.observationDays,
        });
        continue;
      }

      if (refs?.mealId) {
        const activeTrial = trials.find((trial) => trial.status === 'trialing' && !trial.activatedByMealId);
        if (activeTrial) {
          await db.runAsync(
            `UPDATE food_trials SET activated_by_meal_id = ?, updated_at = ? WHERE id = ?`,
            refs.mealId,
            now,
            activeTrial.id,
          );
        }
      }
    }
  }
}

export type MealItemRecord = {
  id: string;
  mealId: string;
  // "<food_id>|<source>" (FoodOption.id format) when the ingredient was
  // picked from the reference database; null for a free-text ingredient
  // that was never resolved to a real food, which can't contribute to a
  // nutrient analysis.
  foodId: string | null;
  foodName: string;
  category: string | null;
  dishName: string | null;
  sideName: string | null;
  dishServings: number | null;
  yourSharePercent: number | null;
  cookingMethod: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  quantity: number | null;
  sortOrder: number;
  notes: string | null;
};

export async function getMealItems(mealId: string) {
  const db = await getDatabase();
  return db.getAllAsync<MealItemRecord>(
    `
      SELECT id, meal_id AS mealId, food_id AS foodId, food_name AS foodName, category, dish_name AS dishName,
             side_name AS sideName, dish_servings AS dishServings, your_share_percent AS yourSharePercent,
             cooking_method AS cookingMethod, serving_size AS servingSize, serving_unit AS servingUnit, quantity,
             sort_order AS sortOrder, notes
      FROM meal_items
      WHERE meal_id = ?
      ORDER BY sort_order
    `,
    mealId,
  );
}

// Every real meal_items row eaten inside a given [start, end] local-time
// window -- built for lib/patternFinder.ts, which needs "what did this
// person eat before this specific flare," not one meal at a time the way
// getMealItems above already covers. Both startLocal/endLocal are expected
// in the same plain 'YYYY-MM-DDTHH:mm' local-time shape meals.eaten_at
// itself is always stored in (confirmed directly: every real caller of
// recordCheckin across this app builds loggedAt the identical way, via
// `${date}T${time24}`, never a UTC toISOString() -- so a plain lexicographic
// BETWEEN comparison here is genuinely correct, not a timezone mismatch
// waiting to happen). Ordered by meal, matching getMealItems' own
// per-meal ordering, so a caller can tell which items came from the same
// real meal if that ever matters.
export async function getMealItemsInWindow(startLocal: string, endLocal: string) {
  const db = await getDatabase();
  return db.getAllAsync<MealItemRecord & { eatenAt: string }>(
    `
      SELECT mi.id, mi.meal_id AS mealId, mi.food_id AS foodId, mi.food_name AS foodName, mi.category,
             mi.dish_name AS dishName, mi.side_name AS sideName, mi.dish_servings AS dishServings,
             mi.your_share_percent AS yourSharePercent, mi.cooking_method AS cookingMethod,
             mi.serving_size AS servingSize, mi.serving_unit AS servingUnit, mi.quantity,
             mi.sort_order AS sortOrder, mi.notes, m.eaten_at AS eatenAt
      FROM meal_items mi
      JOIN meals m ON m.id = mi.meal_id
      WHERE m.eaten_at BETWEEN ? AND ?
      ORDER BY m.eaten_at, mi.sort_order
    `,
    startLocal,
    endLocal,
  );
}

// Meals eaten on one calendar date -- `date` is a 'YYYY-MM-DD' string;
// eaten_at is stored as an ISO datetime truncated to the minute
// ('YYYY-MM-DDTHH:mm'), so matching its first 10 characters is matching
// the date portion.
export async function listMealsForDate(date: string) {
  const db = await getDatabase();
  return db.getAllAsync<MealRecord>(
    `
      SELECT id, name, meal_type, eaten_at, notes, is_immediate, created_at
      FROM meals
      WHERE substr(eaten_at, 1, 10) = ?
      ORDER BY eaten_at ASC
    `,
    date,
  );
}

// Planned-ahead meals -- distinct from meals themselves (which record what
// was actually eaten). A schedule item's status moves from 'planned' to
// either 'logged' (see markScheduledMealLogged, which also links the real
// meal row it became) or 'skipped' (the plan didn't happen -- an honest,
// expected outcome, not an error state). Insights deliberately keeps
// reading from actual logged meals, not from this table: a planned meal
// hasn't been eaten yet, so it has no nutrients/6 Dimensions/prep implications
// until it's logged.
// Daily-only for now -- the user's own request described "repeat
// indefinitely, or a set amount of times or number of times" without
// mentioning specific weekday patterns, so weekly/custom-day recurrence is
// deliberately out of scope for this pass.
export type RepeatType = 'none' | 'daily';
export type RepeatEndType = 'indefinite' | 'count' | 'until_date';

// How a schedule item repeats going forward. type: 'none' means a single
// one-off occurrence (every other field irrelevant). type: 'daily' requires
// endType; endType: 'count' requires count (total occurrences in the
// series, including the first); endType: 'until_date' requires until (a
// 'YYYY-MM-DD' date, inclusive of the last occurrence).
export type RepeatConfig = {
  type: RepeatType;
  endType?: RepeatEndType;
  count?: number;
  until?: string;
};

export type ScheduleItemRecord = {
  id: string;
  scheduledFor: string;
  itemType: string;
  mealType: string | null;
  title: string;
  status: string;
  notes: string | null;
  linkedMealId: string | null;
  linkedTreatmentId: string | null;
  // Which favorite or meal template this was scheduled from -- at most one
  // of these is ever set, never both. Both null for an unplanned entry
  // typed in directly (see schedule.tsx's "log something unplanned" path).
  sourceFavoriteId: string | null;
  sourceMealId: string | null;
  // Recurrence -- see RepeatConfig. Every occurrence generated from one
  // series shares repeatGroupId and carries the same repeatEndType/
  // repeatCount/repeatUntil (the series' own rules), differing only in
  // repeatIndex (1-based position) and scheduledFor. A non-repeating item
  // has repeatType 'none' and every other repeat_* field null.
  repeatType: RepeatType;
  repeatEndType: RepeatEndType | null;
  repeatCount: number | null;
  repeatUntil: string | null;
  repeatGroupId: string | null;
  repeatIndex: number | null;
  // Appointment-only fields (item_type='appointment') -- see
  // scheduleAppointment. All null for every other item_type.
  appointmentType: string | null;
  location: string | null;
  providerName: string | null;
  // NOT appointment-only, despite living in this same block -- 2026-08-18,
  // meals can link to a real phone-calendar event too (see the Meals
  // lens' own "Add to calendar" action in schedule.tsx). Null on any real
  // schedule_items row (of any item_type) that isn't linked to one.
  linkedDeviceCalendarEventId: string | null;
  // Raw JSON text of RotationSelection[] for this occurrence -- parsed by
  // callers (see applyRotationSelectionsToIngredients), same pattern as
  // favorites.payload_json not being auto-parsed either. Null/empty means
  // "nothing rotated for this occurrence yet, use the favorite's own
  // defaults."
  rotationSelectionsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

const SCHEDULE_ITEM_COLUMNS = `
  id, scheduled_for AS scheduledFor, item_type AS itemType, meal_type AS mealType, title, status, notes,
  linked_meal_id AS linkedMealId, linked_treatment_id AS linkedTreatmentId,
  source_favorite_id AS sourceFavoriteId, source_meal_id AS sourceMealId,
  COALESCE(repeat_type, 'none') AS repeatType, repeat_end_type AS repeatEndType, repeat_count AS repeatCount,
  repeat_until AS repeatUntil, repeat_group_id AS repeatGroupId, repeat_index AS repeatIndex,
  appointment_type AS appointmentType, location, provider_name AS providerName,
  linked_device_calendar_event_id AS linkedDeviceCalendarEventId,
  rotation_selections_json AS rotationSelectionsJson,
  created_at AS createdAt, updated_at AS updatedAt
`;

const SCHEDULE_ROLLING_WINDOW_DAYS = 60;

function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setDate(parsed.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function todayDateStringLocal(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// The real, current moment in the same local "YYYY-MM-DDTHH:mm" shape
// scheduled_for/eaten_at already use -- see components/MealBuilder.tsx's
// own identical, independent copy (a component file has no business
// importing from this data-layer module the other direction, and this is
// small/trivial enough that a second, local copy is the right call, same
// as todayDateStringLocal's own precedent just above). settlePastScheduledMeals
// (below) is this file's own real, first user of it.
function nowLocalDateTimeString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// Every calendar date (YYYY-MM-DD) an occurrence should exist for, starting
// at firstDate, respecting the series' own end rule and never generating
// past windowEnd -- the first date is always included regardless of
// windowEnd, since that's the occurrence the person explicitly asked for.
function buildOccurrenceDates(firstDate: string, repeat: RepeatConfig, windowEnd: string): string[] {
  const dates = [firstDate];
  if (repeat.type !== 'daily') {
    return dates;
  }

  let cursor = firstDate;
  for (let index = 1; repeat.endType !== 'count' || index < (repeat.count ?? 1); index++) {
    cursor = addDaysToDateString(cursor, 1);
    if (repeat.endType === 'until_date' && repeat.until && cursor > repeat.until) {
      break;
    }
    if (cursor > windowEnd) {
      break;
    }
    dates.push(cursor);
  }
  return dates;
}

// Inserts every occurrence of a (possibly repeating) series in one go, all
// sharing one repeatGroupId when repeat.type !== 'none'. Returns the id of
// the first occurrence, since that's the one most callers (e.g. "Log now"
// right after scheduling) actually need.
async function insertScheduleSeries(input: {
  // 'garden' added 2026-08-13, for the new Garden tab's own real Scheduler
  // tie-in (see scheduleGardenTask below) -- reuses this same repeat/
  // rolling-window machinery rather than a second, parallel one, since a
  // real garden task ("water the tomatoes") genuinely can want to repeat
  // daily/weekly the same way a supplement dose does. 'foodTest' added
  // 2026-08-14, the identical reasoning for the structured food-testing
  // feature's own daily during-a-trial check-in reminders (see
  // scheduleFoodTrialCheckins below).
  // 'fermentation' added 2026-08-20, the identical reasoning as 'garden'/
  // 'foodTest' above -- the Fermentation Tracker's own real reminder
  // series (see startFermentationBatch/advanceFermentationBatch below)
  // reuses this same repeat/rolling-window machinery rather than a third,
  // parallel one.
  itemType: 'meal' | 'supplement' | 'prescription' | 'appointment' | 'garden' | 'foodTest' | 'fermentation';
  mealType: string | null;
  title: string;
  scheduledFor: string;
  notes?: string;
  sourceFavoriteId?: string | null;
  sourceMealId?: string | null;
  linkedTreatmentId?: string | null;
  appointmentType?: string | null;
  location?: string | null;
  providerName?: string | null;
  linkedDeviceCalendarEventId?: string | null;
  repeat: RepeatConfig;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const [firstDate, firstTime] = input.scheduledFor.split('T');
  const windowEnd = addDaysToDateString(todayDateStringLocal(), SCHEDULE_ROLLING_WINDOW_DAYS);
  const occurrenceDates = buildOccurrenceDates(firstDate, input.repeat, windowEnd);
  const repeatGroupId = input.repeat.type === 'none' ? null : `repeat_${Date.now()}`;

  let firstId = '';
  for (const [index, occurrenceDate] of occurrenceDates.entries()) {
    const id = `schedule_item_${Date.now()}_${index}`;
    if (index === 0) {
      firstId = id;
    }
    await db.runAsync(
      `
        INSERT INTO schedule_items
          (id, scheduled_for, item_type, meal_type, title, status, notes, source_favorite_id, source_meal_id,
           linked_treatment_id, repeat_type, repeat_end_type, repeat_count, repeat_until, repeat_group_id, repeat_index,
           appointment_type, location, provider_name, linked_device_calendar_event_id,
           created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      id,
      `${occurrenceDate}T${firstTime}`,
      input.itemType,
      input.mealType,
      input.title.trim(),
      input.notes?.trim() || null,
      input.sourceFavoriteId ?? null,
      input.sourceMealId ?? null,
      input.linkedTreatmentId ?? null,
      input.repeat.type,
      input.repeat.type === 'none' ? null : (input.repeat.endType ?? 'indefinite'),
      input.repeat.type === 'none' ? null : (input.repeat.count ?? null),
      input.repeat.type === 'none' ? null : (input.repeat.until ?? null),
      repeatGroupId,
      input.repeat.type === 'none' ? null : index + 1,
      input.appointmentType ?? null,
      input.location ?? null,
      input.providerName ?? null,
      input.linkedDeviceCalendarEventId ?? null,
      now,
      now,
    );
  }

  return firstId;
}

// Called whenever schedule data loads (see schedule.tsx's lens load()
// callbacks) to refill every active daily series' rolling window. Cheap to
// call repeatedly -- a series whose latest occurrence already reaches the
// window end, or whose own count/until limit is already met, is skipped
// with no writes.
export async function ensureScheduleSeriesGenerated(): Promise<void> {
  const db = await getDatabase();
  const windowEnd = addDaysToDateString(todayDateStringLocal(), SCHEDULE_ROLLING_WINDOW_DAYS);

  const groups = await db.getAllAsync<{
    repeat_group_id: string;
    item_type: string;
    meal_type: string | null;
    title: string;
    notes: string | null;
    source_favorite_id: string | null;
    source_meal_id: string | null;
    linked_treatment_id: string | null;
    repeat_end_type: string | null;
    repeat_count: number | null;
    repeat_until: string | null;
    latest_scheduled_for: string;
    latest_index: number | null;
    occurrence_count: number;
  }>(
    `
      SELECT
        repeat_group_id,
        item_type,
        meal_type,
        title,
        notes,
        source_favorite_id,
        source_meal_id,
        linked_treatment_id,
        repeat_end_type,
        repeat_count,
        repeat_until,
        MAX(scheduled_for) AS latest_scheduled_for,
        MAX(repeat_index) AS latest_index,
        COUNT(*) AS occurrence_count
      FROM schedule_items
      WHERE repeat_type = 'daily' AND repeat_group_id IS NOT NULL
      GROUP BY repeat_group_id
    `,
  );

  const now = new Date().toISOString();

  for (const group of groups) {
    if (group.repeat_end_type === 'count' && group.occurrence_count >= (group.repeat_count ?? 0)) {
      continue;
    }

    const latestDate = group.latest_scheduled_for.slice(0, 10);
    const latestTime = group.latest_scheduled_for.slice(11);
    if (latestDate >= windowEnd) {
      continue;
    }
    if (group.repeat_end_type === 'until_date' && group.repeat_until && latestDate >= group.repeat_until) {
      continue;
    }

    const endType = (group.repeat_end_type as RepeatEndType | null) ?? 'indefinite';
    // buildOccurrenceDates treats its firstDate as occurrence 1 of a fresh
    // count, so for a count-limited series it's given only however many
    // occurrences actually remain (+1, since the leading date it always
    // includes is latestDate itself, which already exists and gets sliced
    // off below) rather than the series' original total count.
    const remainingCount = endType === 'count' ? Math.max(0, (group.repeat_count ?? 0) - group.occurrence_count) : undefined;
    const topUpRepeat: RepeatConfig = {
      type: 'daily',
      endType,
      count: remainingCount !== undefined ? remainingCount + 1 : undefined,
      until: group.repeat_until ?? undefined,
    };
    const remainingDates = buildOccurrenceDates(latestDate, topUpRepeat, windowEnd).slice(1);
    const startIndex = (group.latest_index ?? group.occurrence_count) + 1;

    for (const [offset, occurrenceDate] of remainingDates.entries()) {
      const index = startIndex + offset;
      await db.runAsync(
        `
          INSERT INTO schedule_items
            (id, scheduled_for, item_type, meal_type, title, status, notes, source_favorite_id, source_meal_id,
             linked_treatment_id, repeat_type, repeat_end_type, repeat_count, repeat_until, repeat_group_id, repeat_index,
             created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, 'daily', ?, ?, ?, ?, ?, ?, ?)
        `,
        `schedule_item_${Date.now()}_${group.repeat_group_id}_${index}`,
        `${occurrenceDate}T${latestTime}`,
        group.item_type,
        group.meal_type,
        group.title,
        group.notes,
        group.source_favorite_id,
        group.source_meal_id,
        group.linked_treatment_id,
        group.repeat_end_type,
        group.repeat_count,
        group.repeat_until,
        group.repeat_group_id,
        index,
        now,
        now,
      );
    }
  }
}

// Removes only this series' future, not-yet-happened occurrences
// ('planned' status, today or later) -- logged/skipped history stays
// intact, since stopping a recurring series shouldn't erase what already
// happened under it.
export async function deleteScheduleSeries(repeatGroupId: string): Promise<void> {
  const db = await getDatabase();
  const today = todayDateStringLocal();
  await db.runAsync(
    `DELETE FROM schedule_items WHERE repeat_group_id = ? AND status = 'planned' AND substr(scheduled_for, 1, 10) >= ?`,
    repeatGroupId,
    today,
  );
}

// scheduledFor is a local "YYYY-MM-DDTHH:mm" string, same format as
// meals.eaten_at -- lets the two be compared/sorted the same way once a
// planned meal is logged. At most one of sourceFavoriteId/sourceMealId
// should be passed. Omitting repeat (or passing type: 'none') schedules a
// single occurrence; otherwise every occurrence in the series is
// pre-generated immediately (see insertScheduleSeries).
export async function scheduleMeal(input: {
  title: string;
  mealType: string;
  scheduledFor: string;
  notes?: string;
  sourceFavoriteId?: string;
  sourceMealId?: string;
  repeat?: RepeatConfig;
  // Optional, 2026-08-14 -- when the caller already has the real, in-memory
  // component list on screen (e.g. MealBuilder.tsx's own "Save & Schedule
  // for Later"), passing it here activates any real 'waiting' food trial
  // among its ingredients, anchored to this real scheduled date rather
  // than left waiting indefinitely. See activateWaitingTrialsForComponents'
  // own comment.
  components?: MealComponentSelection[];
}) {
  const result = await insertScheduleSeries({
    itemType: 'meal',
    mealType: input.mealType,
    title: input.title,
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    sourceFavoriteId: input.sourceFavoriteId,
    sourceMealId: input.sourceMealId,
    repeat: input.repeat ?? { type: 'none' },
  });

  if (input.components) {
    try {
      // result is the first real occurrence's own schedule_item id
      // (insertScheduleSeries' own return value, already captured above) --
      // no real meals row exists yet at this point, so this is the only
      // real trace available until "Log now" or settlePastScheduledMeals'
      // own auto-materialize pass creates one (see
      // activateWaitingTrialsForComponents' own comment).
      await activateWaitingTrialsForComponents(input.components, input.scheduledFor, { scheduleItemId: result });
    } catch (error) {
      console.error('[scheduleMeal] Failed to activate waiting food trials', error);
    }
  }

  return result;
}

// 2026-08-15 -- the real way a single saved/favorited item (not yet a
// meal of its own) gets scheduled for a future date, straight from My
// Kitchen or My Favorites. Confirmed directly by reading
// settlePastScheduledMeals: a scheduled meal-type schedule_items row is
// ONLY ever resolved later via its own real sourceMealId or
// sourceFavoriteId -- scheduleMeal's own `components` param is never
// persisted for later use, only a same-call side input to trial
// activation. So this wraps the one real component in a genuine,
// synthetic one-component meal favorite first (a real, already-proven
// saveMealFavorite call, the exact shape Meal Builder itself already
// writes when assembling from a single saved item), then schedules
// through it via the already-proven scheduleMeal({ sourceFavoriteId })
// path -- no new scheduling primitive needed underneath this, just the
// one real favorite that makes the existing primitive resolvable later.
export async function scheduleSingleComponent(input: {
  componentType: MealComponentType;
  componentId: string;
  title: string;
  mealType: string;
  scheduledFor: string;
}) {
  const favorite = await saveMealFavorite({
    name: input.title,
    mealType: input.mealType,
    components: [{ componentType: input.componentType, componentId: input.componentId, yourSharePercent: 100 }],
  });
  return scheduleMeal({
    title: input.title,
    mealType: input.mealType,
    scheduledFor: input.scheduledFor,
    sourceFavoriteId: favorite.id,
    components: [{ componentType: input.componentType, componentId: input.componentId, yourSharePercent: 100 }],
  });
}

// The whole real sharing feature (ShareEnvelope/ShareComponentPayload/
// ShareMealPayload, buildBuilderFavoritePayload, encodeShareLink/
// encodeMealShareLink/encodeShareLinkFromCuratedRecipe, decodeShareEnvelope/
// decodeShareLink, setSharedFromName, and the real "Recipes Shared With Me"
// staging flow -- stageSharedItem/listSharedRecipes/
// promoteSharedRecipeToSaved/promoteSharedRecipeToFavorite/
// deleteSharedRecipe) moved to lib/sharing.ts, 2026-08-15 -- see that
// file's own header comment for why (it needs to import lib/mealPhotos.ts,
// which this file itself can't do without risking a real circular
// import).

// The real "make Trends honest" fix -- 2026-08-14, direct feedback:
// "trending and reporting are only as good as the data put in." Confirmed
// directly, not assumed: scheduling a meal already starts its own food
// trial's clock (activateWaitingTrialsForComponents, just above), but
// never creates a real logged meal -- getDailyNutrientAnalysis (and
// therefore every Trends/Reports figure) only ever reads real meals/
// meal_items rows, so a scheduled-but-never-"Log now"-ed meal stayed
// invisible to them forever, even once its own date had passed.
//
// Finds every real, still-'planned' item_type='meal' schedule_items row
// whose scheduled_for has already passed, resolves its real components
// the exact same way MealBuilder.tsx's own templateMealId/favoriteId
// effects already do (getMealComponents for a sourceMealId, getMealFavorite
// for a sourceFavoriteId), and runs it through the same, real,
// already-proven createMealFromComponents a genuine "Log now" tap already
// uses -- eatenAt set to the real scheduledFor, not "now," so a meal
// settled days late still lands on the day it was actually supposed to
// happen. That one call also already handles activating/backfilling any
// real food trial riding on it (see activateWaitingTrialsForComponents'
// own comment) -- no separate trial logic needed here.
//
// A schedule_items row with neither a real sourceMealId nor
// sourceFavoriteId (a free-text "unplanned" entry with nothing chosen) is
// left alone -- there's genuinely nothing to auto-materialize; it still
// needs the person's own real, manual confirmation, exactly as it always
// has. Already-'logged' and already-'skipped' rows never match this
// query's own WHERE clause at all, so this is safe to call repeatedly --
// see this function's own two real call sites (app/_layout.tsx at real
// app startup, and both Schedule Meals lenses' own load()) for why that
// idempotence matters.
export async function settlePastScheduledMeals(): Promise<void> {
  const db = await getDatabase();
  const now = nowLocalDateTimeString();
  const items = await db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'meal' AND status = 'planned' AND scheduled_for < ?
      ORDER BY scheduled_for ASC
    `,
    now,
  );

  for (const item of items) {
    let components: MealComponentSelection[] = [];
    if (item.sourceMealId) {
      const records = await getMealComponents(item.sourceMealId);
      components = records.map((record) => ({
        componentType: record.componentType,
        componentId: record.componentId,
        yourSharePercent: record.yourSharePercent,
      }));
    } else if (item.sourceFavoriteId) {
      const favorite = await getMealFavorite(item.sourceFavoriteId);
      if (favorite) {
        components = favorite.components.map((component) => ({
          componentType: component.componentType,
          componentId: component.componentId,
          yourSharePercent: component.yourSharePercent,
        }));
      }
    }
    if (components.length === 0) continue;

    try {
      const result = await createMealFromComponents({
        name: item.title,
        mealType: item.mealType ?? 'meal',
        eatenAt: item.scheduledFor,
        isImmediate: false,
        components,
      });
      if ('id' in result) {
        await markScheduledMealLogged(item.id, result.id);
      }
    } catch (error) {
      console.error('[settlePastScheduledMeals] Failed to auto-materialize a lapsed scheduled meal', item.id, error);
    }
  }
}

export async function listScheduledMealsForDate(date: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'meal' AND substr(scheduled_for, 1, 10) = ?
      ORDER BY scheduled_for ASC
    `,
    date,
  );
}

// The real range version -- 2026-08-18, direct request for a week view on
// the Meals lens (see that lens' own header comment for the full "why").
// Same substr-based date-only comparison as listScheduledMealsForDate
// itself, just widened to a real BETWEEN so one call can fetch a whole
// visible week at once rather than one query per day.
export async function listScheduledMealsForDateRange(startDate: string, endDate: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'meal' AND substr(scheduled_for, 1, 10) BETWEEN ? AND ?
      ORDER BY scheduled_for ASC
    `,
    startDate,
    endDate,
  );
}

// The real "Past Meals" list -- 2026-08-14, the browsing side of
// settlePastScheduledMeals just above (see that function's own comment for
// the full "why"). By the time someone opens this, every real past
// scheduled meal is either 'logged' (materialized automatically, or
// explicitly "Log now"-ed) or 'skipped' (a real, deliberate "this didn't
// happen") -- 'planned' rows this old shouldn't exist anymore, matching
// this app's own established list-size convention (listMeals(100),
// listFoodTrials()), not unbounded.
export async function listPastScheduledMeals(limit = 100): Promise<ScheduleItemRecord[]> {
  const db = await getDatabase();
  const now = nowLocalDateTimeString();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'meal' AND scheduled_for < ? AND status IN ('logged', 'skipped', 'planned')
      ORDER BY scheduled_for DESC
      LIMIT ?
    `,
    now,
    limit,
  );
}

// Generic across item_type -- used by "Log now" (app/(tabs)/index.tsx) to
// look up a specific scheduled meal's own rotationSelectionsJson, and
// available for any other one-off single-row lookup by id.
export async function getScheduleItemById(id: string): Promise<ScheduleItemRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ScheduleItemRecord>(
    `SELECT ${SCHEDULE_ITEM_COLUMNS} FROM schedule_items WHERE id = ?`,
    id,
  );
  return row ?? null;
}

// Persists which specific alternate is chosen for each rotating ingredient
// on ONE scheduled meal occurrence -- deliberately does not touch the
// source favorite, so this never affects any other schedule_items row
// built from the same favorite (a different day's occurrence, or a future
// one from a repeating series). See RotationSelection's own comment for
// why this separation matters.
export async function setScheduledMealRotationSelections(id: string, selections: RotationSelection[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET rotation_selections_json = ?, updated_at = ? WHERE id = ?`,
    JSON.stringify(selections),
    new Date().toISOString(),
    id,
  );
}

// scheduledFor is the dose's clock time on its first occurrence, same
// "YYYY-MM-DDTHH:mm" format as scheduleMeal. This is purely a personal
// adherence/reminder record -- marking a dose "logged" here never feeds
// nutrient totals, which already come entirely from the treatment's own
// on/off active flag via getSupplementNutrientTotals regardless of any
// per-dose logging. Keeping the two separate means turning dose reminders
// on/off never changes what a person's daily nutrient numbers add up to.
export async function scheduleSupplementDose(input: {
  treatmentId: string;
  title: string;
  scheduledFor: string;
  notes?: string;
  repeat?: RepeatConfig;
}) {
  return insertScheduleSeries({
    itemType: 'supplement',
    mealType: null,
    title: input.title,
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    linkedTreatmentId: input.treatmentId,
    repeat: input.repeat ?? { type: 'none' },
  });
}

export async function listScheduledSupplementsForDate(date: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'supplement' AND substr(scheduled_for, 1, 10) = ?
      ORDER BY scheduled_for ASC
    `,
    date,
  );
}

export async function listScheduledSupplementDosesForTreatment(treatmentId: string, fromDate: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'supplement' AND linked_treatment_id = ? AND substr(scheduled_for, 1, 10) >= ?
      ORDER BY scheduled_for ASC
    `,
    treatmentId,
    fromDate,
  );
}

// Same shape as scheduleSupplementDose -- a prescription dose reminder is
// purely a personal adherence record too, never feeding nutrient totals
// (a prescription doesn't contribute nutrients in the first place).
export async function schedulePrescriptionDose(input: {
  treatmentId: string;
  title: string;
  scheduledFor: string;
  notes?: string;
  repeat?: RepeatConfig;
}) {
  return insertScheduleSeries({
    itemType: 'prescription',
    mealType: null,
    title: input.title,
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    linkedTreatmentId: input.treatmentId,
    repeat: input.repeat ?? { type: 'none' },
  });
}

export async function listScheduledPrescriptionsForDate(date: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'prescription' AND substr(scheduled_for, 1, 10) = ?
      ORDER BY scheduled_for ASC
    `,
    date,
  );
}

export async function listScheduledPrescriptionDosesForTreatment(treatmentId: string, fromDate: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'prescription' AND linked_treatment_id = ? AND substr(scheduled_for, 1, 10) >= ?
      ORDER BY scheduled_for ASC
    `,
    treatmentId,
    fromDate,
  );
}

// Marks a scheduled supplement or prescription dose as taken -- a personal
// adherence record only, generic across item_type. Unlike
// markScheduledMealLogged there's no real meal row to link (a dose isn't a
// meal), and per scheduleSupplementDose/schedulePrescriptionDose's own
// notes this deliberately never feeds nutrient totals either way.
export async function markScheduledDoseTaken(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET status = 'logged', updated_at = ? WHERE id = ?`,
    new Date().toISOString(),
    id,
  );
}

// Appointments don't repeat in this pass (see RepeatType's own "daily-only
// for now" note -- most appointments are booked one at a time by a
// provider's office anyway, and monthly/quarterly recurrence would need
// real changes to the recurrence engine itself), so repeat is always
// {type:'none'} here even though insertScheduleSeries supports more.
// scheduledFor is a local "YYYY-MM-DDTHH:mm" string like every other
// schedule_items entry, but unlike meals/doses this is very often a real
// future date, not always today.
export async function scheduleAppointment(input: {
  title: string;
  scheduledFor: string;
  appointmentType?: string;
  location?: string;
  providerName?: string;
  notes?: string;
  linkedDeviceCalendarEventId?: string;
}): Promise<string> {
  return insertScheduleSeries({
    itemType: 'appointment',
    mealType: null,
    title: input.title,
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    appointmentType: input.appointmentType ?? null,
    location: input.location ?? null,
    providerName: input.providerName ?? null,
    linkedDeviceCalendarEventId: input.linkedDeviceCalendarEventId ?? null,
    repeat: { type: 'none' },
  });
}

export async function listScheduledAppointmentsForDate(date: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'appointment' AND substr(scheduled_for, 1, 10) = ?
      ORDER BY scheduled_for ASC
    `,
    date,
  );
}

// Every appointment (any status) from fromDate through toDate, inclusive --
// used both by the Appointments lens' "Upcoming" list and by
// lib/interactionRules.ts to check for an upcoming lab draw.
export async function listUpcomingAppointments(fromDate: string, toDate: string) {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'appointment' AND substr(scheduled_for, 1, 10) BETWEEN ? AND ?
      ORDER BY scheduled_for ASC
    `,
    fromDate,
    toDate,
  );
}

export async function updateAppointment(
  id: string,
  input: { title: string; scheduledFor: string; appointmentType?: string; location?: string; providerName?: string; notes?: string },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE schedule_items
      SET title = ?, scheduled_for = ?, appointment_type = ?, location = ?, provider_name = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.title.trim(),
    input.scheduledFor,
    input.appointmentType ?? null,
    input.location?.trim() || null,
    input.providerName?.trim() || null,
    input.notes?.trim() || null,
    now,
    id,
  );
}

export async function markAppointmentCompleted(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET status = 'completed', updated_at = ? WHERE id = ?`,
    new Date().toISOString(),
    id,
  );
}

export async function setAppointmentCancelled(id: string, cancelled: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET status = ?, updated_at = ? WHERE id = ?`,
    cancelled ? 'cancelled' : 'planned',
    new Date().toISOString(),
    id,
  );
}

// Connects (or disconnects) any real schedule_items row -- an appointment
// or a meal (2026-08-18) -- to a real event in the phone's own Calendar
// app -- see lib/deviceCalendar.ts. Purely a link; this app never reads
// back changes made to the event on the device side beyond what's stored
// here. Named generically since it operates on any real id regardless of
// item_type, not "Appointment" as the original, narrower name implied
// before Meals gained the same real capability.
export async function linkScheduleItemToDeviceCalendarEvent(id: string, deviceCalendarEventId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET linked_device_calendar_event_id = ?, updated_at = ? WHERE id = ?`,
    deviceCalendarEventId,
    new Date().toISOString(),
    id,
  );
}

export async function unlinkScheduleItemFromDeviceCalendarEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET linked_device_calendar_event_id = NULL, updated_at = ? WHERE id = ?`,
    new Date().toISOString(),
    id,
  );
}

export async function updateScheduledMeal(
  id: string,
  input: { title: string; mealType: string; scheduledFor: string; notes?: string },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE schedule_items
      SET title = ?, meal_type = ?, scheduled_for = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.title.trim(),
    input.mealType,
    input.scheduledFor,
    input.notes?.trim() || null,
    now,
    id,
  );
}

export async function deleteScheduledMeal(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM schedule_items WHERE id = ?', id);
}

// Links a planned meal to the real meal row it became once actually logged
// -- called from the Meals builder's save handler when it was opened via a
// scheduled meal's "Log now" action.
export async function markScheduledMealLogged(scheduleItemId: string, loggedMealId: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE schedule_items SET status = 'logged', linked_meal_id = ?, updated_at = ? WHERE id = ?`,
    loggedMealId,
    now,
    scheduleItemId,
  );
}

export async function setScheduledMealSkipped(id: string, skipped: boolean) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE schedule_items SET status = ?, updated_at = ? WHERE id = ?`,
    skipped ? 'skipped' : 'planned',
    now,
    id,
  );
}

const MEASUREMENT_SYSTEM_KEY = 'measurement_system';

export async function getStoredMeasurementSystem(): Promise<'metric' | 'imperial' | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    MEASUREMENT_SYSTEM_KEY,
  );
  return row?.value === 'metric' || row?.value === 'imperial' ? row.value : null;
}

export async function setStoredMeasurementSystem(value: 'metric' | 'imperial') {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    MEASUREMENT_SYSTEM_KEY,
    value,
    now,
  );
}

export async function listMeals(limit = 10) {
  const db = await getDatabase();
  return db.getAllAsync<MealRecord>(
    `
      SELECT id, name, meal_type, eaten_at, notes, is_immediate, created_at
      FROM meals
      ORDER BY eaten_at DESC, created_at DESC
      LIMIT ?
    `,
    limit,
  );
}

// The person's own, entirely optional sex/age/diagnosis info -- every
// field defaults to null (not set) and stays that way until the person
// deliberately sets it themselves. Nothing else in this app should ever
// assume a value here; see getDietaryReferenceIntakesForProfile, which
// treats an unset sex/age as "show every applicable population" rather
// than guessing one.
export type UserProfile = {
  // Purely cosmetic -- used to personalize the app header ("Tony's Inside
  // Story"), nothing else in the app reads these. Both optional, same
  // "never assume, only use what the person actually gave us" reasoning as
  // every other field here.
  firstName: string | null;
  lastName: string | null;
  sex: DietarySex | null;
  birthDate: string | null;
  hasHashimotos: boolean | null;
  // Only needed for the step-counter math (lib/stepMath.ts uses it to
  // estimate stride length) -- optional for the same "never assume, only
  // use what the person actually gave us" reason as every other field here.
  heightCm: number | null;
  // Insights' own Energy & Portions lens, 2026-08-15 -- the one real,
  // condition-agnostic input Mifflin-St Jeor's own TDEE math needs beyond
  // sex/birthDate/height/weight. See lib/energyNeeds.ts's own header
  // comment for the real sources behind each tier's activity multiplier.
  activityLevel: ActivityLevel | null;
  // "HH:mm", 24h, local time -- roughly when this person usually eats each
  // meal. Purely a convenience default for the Schedule tab's time picker;
  // nothing else in the app should treat these as a commitment the person
  // has to keep.
  usualBreakfastTime: string | null;
  usualLunchTime: string | null;
  usualDinnerTime: string | null;
  usualSnackTime: string | null;
  // Intermittent fasting: when enabled, the Schedule tab refuses to
  // schedule a meal outside [eatingWindowStart, eatingWindowEnd) -- a real
  // constraint, not just a default, since the person explicitly asked for
  // this to be enforced. Both null/unset until fastingEnabled is turned on
  // and both times are entered.
  fastingEnabled: boolean;
  eatingWindowStart: string | null;
  eatingWindowEnd: string | null;
  // A real USDA Plant Hardiness Zone (e.g. '7a') -- self-selected via the
  // Garden tab's own Profile field, 2026-08-13, or resolved automatically
  // via lib/gardenZoneLookup.ts's own real ZIP/postal-code lookup,
  // 2026-08-13 (either way lands in this same one column -- see
  // growingZone's own column comment in initializeDatabase). Null until
  // set.
  growingZone: string | null;
  // The real country code + postal code that produced growingZone, when it
  // was set via the lookup rather than picked manually -- kept purely so
  // returning to My Zone shows what was entered and can re-run the lookup
  // after a move, without needing growingZone itself. Both null when the
  // zone was set manually or never set at all.
  growingZoneCountry: string | null;
  growingZonePostalCode: string | null;
};

export async function getUserProfile(): Promise<UserProfile> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    first_name: string | null;
    last_name: string | null;
    sex: string | null;
    birth_date: string | null;
    has_hashimotos: number | null;
    height_cm: number | null;
    activity_level: string | null;
    usual_breakfast_time: string | null;
    usual_lunch_time: string | null;
    usual_dinner_time: string | null;
    usual_snack_time: string | null;
    fasting_enabled: number | null;
    eating_window_start: string | null;
    eating_window_end: string | null;
    growing_zone: string | null;
    growing_zone_country: string | null;
    growing_zone_postal_code: string | null;
  }>(
    `
      SELECT first_name, last_name, sex, birth_date, has_hashimotos, height_cm, activity_level,
             usual_breakfast_time, usual_lunch_time, usual_dinner_time, usual_snack_time,
             fasting_enabled, eating_window_start, eating_window_end,
             growing_zone, growing_zone_country, growing_zone_postal_code
      FROM user_profile WHERE id = 1
    `,
  );

  if (!row) {
    return {
      firstName: null,
      lastName: null,
      sex: null,
      birthDate: null,
      hasHashimotos: null,
      heightCm: null,
      activityLevel: null,
      usualBreakfastTime: null,
      usualLunchTime: null,
      usualDinnerTime: null,
      usualSnackTime: null,
      fastingEnabled: false,
      eatingWindowStart: null,
      eatingWindowEnd: null,
      growingZone: null,
      growingZoneCountry: null,
      growingZonePostalCode: null,
    };
  }

  return {
    firstName: row.first_name,
    lastName: row.last_name,
    sex: row.sex === 'male' || row.sex === 'female' ? row.sex : null,
    birthDate: row.birth_date,
    hasHashimotos: row.has_hashimotos == null ? null : Boolean(row.has_hashimotos),
    heightCm: row.height_cm,
    activityLevel: (ACTIVITY_LEVELS as string[]).includes(row.activity_level ?? '')
      ? (row.activity_level as ActivityLevel)
      : null,
    usualBreakfastTime: row.usual_breakfast_time,
    usualLunchTime: row.usual_lunch_time,
    usualDinnerTime: row.usual_dinner_time,
    usualSnackTime: row.usual_snack_time,
    fastingEnabled: Boolean(row.fasting_enabled),
    eatingWindowStart: row.eating_window_start,
    eatingWindowEnd: row.eating_window_end,
    growingZone: row.growing_zone,
    growingZoneCountry: row.growing_zone_country,
    growingZonePostalCode: row.growing_zone_postal_code,
  };
}

// Self-declared condition-stage table, 2026-08-09 -- see the real
// CREATE TABLE comment above (initializeDatabase) for the full reasoning.
// A plain Record<conditionCode, stageCode> -- callers validate a given
// stage code against that condition's own real CONDITION_STAGING_MODELS
// entry (lib/conditionStages.ts) themselves, since this layer has no
// reason to know what a "valid" stage looks like for every condition.
export async function getConditionStages(): Promise<Record<string, string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ condition_code: string; stage_code: string }>(
    'SELECT condition_code, stage_code FROM user_condition_stages',
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.condition_code] = row.stage_code;
  }
  return result;
}

// stageCode === null clears the declaration for that condition entirely
// (deletes the row) rather than storing an empty string -- "not declared"
// should mean the row genuinely doesn't exist, the same "absence is the
// real null state" convention user_conditions/user_food_allergies already
// use.
export async function setConditionStage(conditionCode: string, stageCode: string | null): Promise<void> {
  const db = await getDatabase();
  if (stageCode === null) {
    await db.runAsync('DELETE FROM user_condition_stages WHERE condition_code = ?', conditionCode);
    return;
  }
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO user_condition_stages (condition_code, stage_code, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(condition_code) DO UPDATE SET stage_code = excluded.stage_code, updated_at = excluded.updated_at
    `,
    conditionCode,
    stageCode,
    now,
  );
}

// setUserProfile reads the current row, merges the caller's partial update
// on top, then writes every column back. That read-then-write is only safe
// if it's atomic with respect to other calls -- otherwise two calls fired
// close together (e.g. the Profile screen's meal-time inputs, which commit
// on every blur plus every AM/PM tap, so a single time entry can fire 2-3
// calls within milliseconds) can interleave: the second call reads its
// "current" snapshot before the first call's write lands, so when it writes
// it silently reverts the first call's field back to the old value. Chaining
// every call through this queue forces each one to fully finish (read AND
// write) before the next one's read starts, which removes the race.
let userProfileWriteQueue: Promise<void> = Promise.resolve();

export async function setUserProfile(update: Partial<UserProfile>) {
  const run = async () => {
    const db = await getDatabase();
    const current = await getUserProfile();
    const merged: UserProfile = { ...current, ...update };
    const now = new Date().toISOString();

    await db.runAsync(
      `
        INSERT INTO user_profile (
          id, first_name, last_name, sex, birth_date, has_hashimotos, height_cm, activity_level,
          usual_breakfast_time, usual_lunch_time, usual_dinner_time, usual_snack_time,
          fasting_enabled, eating_window_start, eating_window_end,
          growing_zone, growing_zone_country, growing_zone_postal_code, updated_at
        )
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          sex = excluded.sex,
          birth_date = excluded.birth_date,
          has_hashimotos = excluded.has_hashimotos,
          height_cm = excluded.height_cm,
          activity_level = excluded.activity_level,
          usual_breakfast_time = excluded.usual_breakfast_time,
          usual_lunch_time = excluded.usual_lunch_time,
          usual_dinner_time = excluded.usual_dinner_time,
          usual_snack_time = excluded.usual_snack_time,
          fasting_enabled = excluded.fasting_enabled,
          eating_window_start = excluded.eating_window_start,
          eating_window_end = excluded.eating_window_end,
          growing_zone = excluded.growing_zone,
          growing_zone_country = excluded.growing_zone_country,
          growing_zone_postal_code = excluded.growing_zone_postal_code,
          updated_at = excluded.updated_at
      `,
      merged.firstName?.trim() || null,
      merged.lastName?.trim() || null,
      merged.sex,
      merged.birthDate,
      merged.hasHashimotos == null ? null : merged.hasHashimotos ? 1 : 0,
      merged.heightCm,
      merged.activityLevel,
      merged.usualBreakfastTime,
      merged.usualLunchTime,
      merged.usualDinnerTime,
      merged.usualSnackTime,
      merged.fastingEnabled ? 1 : 0,
      merged.eatingWindowStart,
      merged.eatingWindowEnd,
      merged.growingZone,
      merged.growingZoneCountry,
      merged.growingZonePostalCode,
      now,
    );
  };

  const result = userProfileWriteQueue.then(run, run);
  userProfileWriteQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

// The real multi-condition model, 2026-08-08 -- see user_conditions' own
// schema comment above for why has_hashimotos wasn't touched. `conditions`
// itself lives in the bundled reference database (the canonical list of
// every condition this app knows about, autoimmune and otherwise, each
// with a real build-status flag) -- the same "reference data ships with
// the app, personal data lives locally" split every other cross-database
// lookup here already follows.
export type ConditionReference = {
  code: string;
  name: string;
  category: string;
  status: 'built' | 'in_progress' | 'planned';
  sortOrder: number;
};

function mapConditionRow(row: {
  code: string;
  name: string;
  category: string;
  status: string;
  sort_order: number;
}): ConditionReference {
  return {
    code: row.code,
    name: row.name,
    category: row.category,
    status: row.status as ConditionReference['status'],
    sortOrder: row.sort_order,
  };
}

// Every condition this app knows about, `built`/`in_progress` first (the
// ones actually worth showing as selectable today) -- `planned` entries
// are included too, since Insights/Digest may still want the full
// roster for "coming soon" messaging, but a picker UI should filter to
// non-`planned` itself rather than assume this function already did.
export async function listAllConditions(): Promise<ConditionReference[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<Parameters<typeof mapConditionRow>[0]>(
    'SELECT code, name, category, status, sort_order FROM conditions ORDER BY sort_order',
  );
  return rows.map(mapConditionRow);
}

// The person's own selected conditions, local-only. One-time migrates an
// existing user_profile.has_hashimotos=1 into a real 'hashimotos' row the
// first time this is called against a fresh user_conditions table, so an
// existing answer to the old single-condition question isn't silently
// lost the moment this ships -- checked via a plain "table is still
// completely empty" test rather than a version flag, since that's exactly
// the one real case (a person who already said yes, and has never opened
// the new multi-select picker yet) this needs to catch.
export async function getUserConditions(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ condition_code: string }>(
    'SELECT condition_code FROM user_conditions ORDER BY selected_at',
  );
  if (rows.length === 0) {
    const legacy = await db.getFirstAsync<{ has_hashimotos: number | null }>(
      'SELECT has_hashimotos FROM user_profile WHERE id = 1',
    );
    if (legacy?.has_hashimotos) {
      await db.runAsync(
        'INSERT OR IGNORE INTO user_conditions (condition_code) VALUES (?)',
        'hashimotos',
      );
      return ['hashimotos'];
    }
    return [];
  }
  return rows.map((row) => row.condition_code);
}

export async function setUserConditionSelected(code: string, selected: boolean): Promise<void> {
  const db = await getDatabase();
  if (selected) {
    await db.runAsync('INSERT OR IGNORE INTO user_conditions (condition_code) VALUES (?)', code);
  } else {
    await db.runAsync('DELETE FROM user_conditions WHERE condition_code = ?', code);
  }
}

// The person's own "curious about" list -- see curious_about_conditions'
// own schema comment above for why this is a fully separate table from
// user_conditions, not a second flag on the same rows. No legacy
// migration needed here, unlike getUserConditions above: there was never
// an older, single-condition version of this concept to carry forward.
export async function getCuriousAboutConditions(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ condition_code: string }>(
    'SELECT condition_code FROM curious_about_conditions ORDER BY selected_at',
  );
  return rows.map((row) => row.condition_code);
}

export async function setCuriousAboutConditionSelected(code: string, selected: boolean): Promise<void> {
  const db = await getDatabase();
  if (selected) {
    await db.runAsync('INSERT OR IGNORE INTO curious_about_conditions (condition_code) VALUES (?)', code);
  } else {
    await db.runAsync('DELETE FROM curious_about_conditions WHERE condition_code = ?', code);
  }
}

// The person's own real diet preferences -- see diet_preferences' own
// schema comment above. dietTag matches RecipeDietTag (lib/digest/types.ts)
// exactly, stored as plain text rather than a foreign key since this table
// lives in the local, on-device database while the tag vocabulary lives in
// app code, not the bundled reference database.
export async function getDietPreferences(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ diet_tag: string }>(
    'SELECT diet_tag FROM diet_preferences ORDER BY selected_at',
  );
  return rows.map((row) => row.diet_tag);
}

export async function setDietPreferenceSelected(dietTag: string, selected: boolean): Promise<void> {
  const db = await getDatabase();
  if (selected) {
    await db.runAsync('INSERT OR IGNORE INTO diet_preferences (diet_tag) VALUES (?)', dietTag);
  } else {
    await db.runAsync('DELETE FROM diet_preferences WHERE diet_tag = ?', dietTag);
  }
}

// Real, individually-declared food allergies -- see user_food_allergies'
// own comment above for the full reasoning. Every function here works with
// the plain allergen name directly (the table's own real primary key), not
// a synthetic id -- there's nothing else to reference it by.
export async function listFoodAllergies(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ allergen_name: string }>(
    'SELECT allergen_name FROM user_food_allergies ORDER BY added_at',
  );
  return rows.map((row) => row.allergen_name);
}

// Normalizes to Title Case before storing/comparing -- "peanuts" and
// "Peanuts" typed on two different occasions should land as the exact same
// row, not two visually-near-duplicate ones. A plain per-word capitalize,
// not a full linguistic title-caser (no attempt at "of"/"and" staying
// lowercase, etc.) -- real allergen names are short enough (1-3 words)
// that this simple version reads correctly for all of them.
function normalizeAllergenName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(' ');
}

export async function addFoodAllergy(rawName: string): Promise<void> {
  const name = normalizeAllergenName(rawName);
  if (!name) return;
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO user_food_allergies (allergen_name) VALUES (?)', name);
}

export async function removeFoodAllergy(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM user_food_allergies WHERE allergen_name = ?', name);
}

// Whether a "HH:mm" time falls inside [windowStart, windowEnd) -- handles a
// window that crosses midnight (e.g. 18:00-02:00) by treating start > end
// as "wraps past midnight" rather than an empty/invalid range.
export function isWithinEatingWindow(time: string, windowStart: string, windowEnd: string): boolean {
  if (windowStart <= windowEnd) {
    return time >= windowStart && time < windowEnd;
  }
  return time >= windowStart || time < windowEnd;
}

export type TreatmentRecord = {
  id: string;
  treatmentType: string;
  name: string;
  // Structured, canonical identity for a prescription/OTC item -- e.g.
  // name might be "Synthroid 75mcg morning" while genericName is
  // "levothyroxine". Null for supplements (their real identity is their
  // per-ingredient nutrient_code rows, not a single generic name) and for
  // any prescription/OTC treatment created before this field existed or
  // left blank on purpose. See My Meds (2026-08-08) and
  // lib/interactionRules.ts's own genericName-aware matching.
  genericName: string | null;
  doseAmount: number | null;
  doseUnit: string | null;
  frequency: string | null;
  unitsPerDay: number | null;
  servingUnitLabel: string | null;
  active: boolean;
  notes: string | null;
};

export type TreatmentNutrientRecord = {
  id: string;
  treatmentId: string;
  nutrientCode: string;
  supplementForm: string | null;
  amountPerUnit: number;
  unit: string;
};

export type SupplementIngredientInput = {
  nutrientCode: string;
  supplementForm?: string;
  amountPerUnit: number;
  // Whatever unit is actually printed on the label (mg, mcg, g, IU) --
  // getSupplementNutrientTotals normalizes this later, it doesn't need to
  // match the reference database's canonical unit at entry time.
  unit: string;
};

// Records one real product the person takes -- a single-ingredient
// supplement (e.g. plain magnesium glycinate) gets one ingredient row; a
// multivitamin gets one row per nutrient listed on its own label, since
// that's what "which version of ingredients does it contain" actually
// means for a combination product. unitsPerDay + servingUnitLabel describe
// how much of the whole product is taken daily (e.g. 2 capsules); each
// ingredient's own daily contribution is computed later as
// amountPerUnit * unitsPerDay rather than stored redundantly, so changing
// the dose never requires touching the ingredient rows.
export async function createSupplementTreatment(input: {
  name: string;
  unitsPerDay: number;
  servingUnitLabel: string;
  ingredients: SupplementIngredientInput[];
  notes?: string;
}) {
  const db = await getDatabase();
  const id = `treatment_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO treatments
        (id, treatment_type, name, units_per_day, serving_unit_label, active, notes, created_at, updated_at)
      VALUES (?, 'supplement', ?, ?, ?, 1, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.unitsPerDay,
    input.servingUnitLabel.trim(),
    input.notes?.trim() || null,
    now,
    now,
  );

  for (const [index, ingredient] of input.ingredients.entries()) {
    await db.runAsync(
      `
        INSERT INTO treatment_nutrients (id, treatment_id, nutrient_code, supplement_form, amount_per_unit, unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      `treatment_nutrient_${Date.now()}_${index}`,
      id,
      ingredient.nutrientCode,
      ingredient.supplementForm?.trim() || null,
      ingredient.amountPerUnit,
      ingredient.unit,
      now,
    );
  }

  return id;
}

export async function listSupplementTreatments(activeOnly = true): Promise<TreatmentRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    treatment_type: string;
    name: string;
    generic_name: string | null;
    dose_amount: number | null;
    dose_unit: string | null;
    frequency: string | null;
    units_per_day: number | null;
    serving_unit_label: string | null;
    active: number;
    notes: string | null;
  }>(
    `
      SELECT id, treatment_type, name, generic_name, dose_amount, dose_unit, frequency, units_per_day, serving_unit_label, active, notes
      FROM treatments
      WHERE treatment_type = 'supplement' ${activeOnly ? 'AND active = 1' : ''}
      ORDER BY name
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    treatmentType: row.treatment_type,
    name: row.name,
    genericName: row.generic_name,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    frequency: row.frequency,
    unitsPerDay: row.units_per_day,
    servingUnitLabel: row.serving_unit_label,
    active: Boolean(row.active),
    notes: row.notes,
  }));
}

export async function getTreatmentNutrients(treatmentId: string): Promise<TreatmentNutrientRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    treatment_id: string;
    nutrient_code: string;
    supplement_form: string | null;
    amount_per_unit: number;
    unit: string;
  }>(
    'SELECT id, treatment_id, nutrient_code, supplement_form, amount_per_unit, unit FROM treatment_nutrients WHERE treatment_id = ?',
    treatmentId,
  );

  return rows.map((row) => ({
    id: row.id,
    treatmentId: row.treatment_id,
    nutrientCode: row.nutrient_code,
    supplementForm: row.supplement_form,
    amountPerUnit: row.amount_per_unit,
    unit: row.unit,
  }));
}

// Generic across treatment_type -- flips the on/off tracking toggle for a
// supplement or a prescription alike, since "counted toward totals right
// now or not" means the same thing regardless of which kind of treatment
// it is.
export async function setTreatmentActive(treatmentId: string, active: boolean) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE treatments SET active = ?, updated_at = ? WHERE id = ?',
    active ? 1 : 0,
    new Date().toISOString(),
    treatmentId,
  );
}

// Replaces a supplement's name/dose/ingredients wholesale -- same "re-save
// the whole thing rather than diff it" approach as replaceMealItems, for
// the same reason: treatment_nutrients rows aren't referenced anywhere
// else, so deleting and re-inserting is simpler and just as correct as a
// row-by-row diff.
export async function updateSupplementTreatment(
  treatmentId: string,
  input: {
    name: string;
    unitsPerDay: number;
    servingUnitLabel: string;
    ingredients: SupplementIngredientInput[];
    notes?: string;
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE treatments
      SET name = ?, units_per_day = ?, serving_unit_label = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.unitsPerDay,
    input.servingUnitLabel.trim(),
    input.notes?.trim() || null,
    now,
    treatmentId,
  );

  await db.runAsync('DELETE FROM treatment_nutrients WHERE treatment_id = ?', treatmentId);

  for (const [index, ingredient] of input.ingredients.entries()) {
    await db.runAsync(
      `
        INSERT INTO treatment_nutrients (id, treatment_id, nutrient_code, supplement_form, amount_per_unit, unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      `treatment_nutrient_${Date.now()}_${index}`,
      treatmentId,
      ingredient.nutrientCode,
      ingredient.supplementForm?.trim() || null,
      ingredient.amountPerUnit,
      ingredient.unit,
      now,
    );
  }
}

// Generic across treatment_type -- treatment_nutrients rows (if any)
// cascade-delete via their own FK (ON DELETE CASCADE), so removing the
// parent treatments row is enough for a supplement; a prescription has no
// treatment_nutrients rows to begin with, so this is a plain delete either
// way.
export async function deleteTreatment(treatmentId: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM treatments WHERE id = ?', treatmentId);
}

// Prescriptions share the same treatments table as supplements
// (treatment_type discriminates), but use dose_amount/dose_unit/frequency
// instead of units_per_day/serving_unit_label/treatment_nutrients -- a
// prescription is a genuinely single-substance product (see TreatmentRecord),
// so it has no per-ingredient breakdown to document the way a multivitamin
// supplement does. genericName added 2026-08-08 for My Meds -- optional,
// since a person can still just type a name the way this always worked,
// but filling it in (directly, or by picking a common_medications entry,
// see searchCommonMedications) is what lets interaction checking match
// reliably instead of depending on a name substring.
export async function createPrescriptionTreatment(input: {
  name: string;
  genericName?: string;
  doseAmount?: number;
  doseUnit?: string;
  frequency?: string;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `treatment_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO treatments
        (id, treatment_type, name, generic_name, dose_amount, dose_unit, frequency, active, notes, created_at, updated_at)
      VALUES (?, 'prescription', ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.genericName?.trim() || null,
    input.doseAmount ?? null,
    input.doseUnit?.trim() || null,
    input.frequency?.trim() || null,
    input.notes?.trim() || null,
    now,
    now,
  );

  return id;
}

export async function listPrescriptionTreatments(activeOnly = true): Promise<TreatmentRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    treatment_type: string;
    name: string;
    generic_name: string | null;
    dose_amount: number | null;
    dose_unit: string | null;
    frequency: string | null;
    units_per_day: number | null;
    serving_unit_label: string | null;
    active: number;
    notes: string | null;
  }>(
    `
      SELECT id, treatment_type, name, generic_name, dose_amount, dose_unit, frequency, units_per_day, serving_unit_label, active, notes
      FROM treatments
      WHERE treatment_type = 'prescription' ${activeOnly ? 'AND active = 1' : ''}
      ORDER BY name
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    treatmentType: row.treatment_type,
    name: row.name,
    genericName: row.generic_name,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    frequency: row.frequency,
    unitsPerDay: row.units_per_day,
    servingUnitLabel: row.serving_unit_label,
    active: Boolean(row.active),
    notes: row.notes,
  }));
}

export async function updatePrescriptionTreatment(
  treatmentId: string,
  input: { name: string; genericName?: string; doseAmount?: number; doseUnit?: string; frequency?: string; notes?: string },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE treatments
      SET name = ?, generic_name = ?, dose_amount = ?, dose_unit = ?, frequency = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.genericName?.trim() || null,
    input.doseAmount ?? null,
    input.doseUnit?.trim() || null,
    input.frequency?.trim() || null,
    input.notes?.trim() || null,
    now,
    treatmentId,
  );
}

// OTC (over-the-counter, non-prescription) treatments -- added 2026-08-08
// for My Meds. A third real treatment_type alongside 'supplement' and
// 'prescription', not a special case bolted onto Prescriptions -- the
// distinction matters for the person's own record-keeping (an antihistamine
// isn't a doctor's prescription) even though the underlying shape (a
// single-substance product with a dose/frequency, no per-ingredient
// nutrient breakdown) is identical to a prescription. These three
// functions are deliberately near-identical copies of the Prescription
// ones above rather than a shared generic helper -- matches this whole
// file's own established practice of favoring a few duplicated, readable
// functions over one parameterized one for genuinely different real-world
// categories (see e.g. every Food builder's own sides/salads/soups tables).
export async function createOtcTreatment(input: {
  name: string;
  genericName?: string;
  doseAmount?: number;
  doseUnit?: string;
  frequency?: string;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `treatment_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO treatments
        (id, treatment_type, name, generic_name, dose_amount, dose_unit, frequency, active, notes, created_at, updated_at)
      VALUES (?, 'otc', ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.genericName?.trim() || null,
    input.doseAmount ?? null,
    input.doseUnit?.trim() || null,
    input.frequency?.trim() || null,
    input.notes?.trim() || null,
    now,
    now,
  );

  return id;
}

export async function listOtcTreatments(activeOnly = true): Promise<TreatmentRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    treatment_type: string;
    name: string;
    generic_name: string | null;
    dose_amount: number | null;
    dose_unit: string | null;
    frequency: string | null;
    units_per_day: number | null;
    serving_unit_label: string | null;
    active: number;
    notes: string | null;
  }>(
    `
      SELECT id, treatment_type, name, generic_name, dose_amount, dose_unit, frequency, units_per_day, serving_unit_label, active, notes
      FROM treatments
      WHERE treatment_type = 'otc' ${activeOnly ? 'AND active = 1' : ''}
      ORDER BY name
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    treatmentType: row.treatment_type,
    name: row.name,
    genericName: row.generic_name,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    frequency: row.frequency,
    unitsPerDay: row.units_per_day,
    servingUnitLabel: row.serving_unit_label,
    active: Boolean(row.active),
    notes: row.notes,
  }));
}

export async function updateOtcTreatment(
  treatmentId: string,
  input: { name: string; genericName?: string; doseAmount?: number; doseUnit?: string; frequency?: string; notes?: string },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE treatments
      SET name = ?, generic_name = ?, dose_amount = ?, dose_unit = ?, frequency = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.genericName?.trim() || null,
    input.doseAmount ?? null,
    input.doseUnit?.trim() || null,
    input.frequency?.trim() || null,
    input.notes?.trim() || null,
    now,
    treatmentId,
  );
}

// The unified "everything I currently take" view My Meds is built around --
// one flat list across all three treatment_types rather than three separate
// queries the screen has to merge itself. Deliberately tags each row with
// its own treatmentType (already on TreatmentRecord) rather than returning
// three separate arrays, since the whole point is one list, sorted
// together, not three lists stacked.
export async function listAllActiveTreatments(): Promise<TreatmentRecord[]> {
  const [supplements, prescriptions, otc] = await Promise.all([
    listSupplementTreatments(true),
    listPrescriptionTreatments(true),
    listOtcTreatments(true),
  ]);
  return [...supplements, ...prescriptions, ...otc].sort((a, b) => a.name.localeCompare(b.name));
}

// Personal rules -- the second half of the interaction rules engine, see
// personal_rules' own table comment above for the real design. Real,
// simple CRUD, matching the shape every other local-only table in this
// file already uses (garden_plot_${Date.now()}-style ids, etc.) -- the
// actual "does this rule currently apply" evaluation lives in
// lib/interactionRules.ts, not here, since that's genuinely the same
// engine the cited rules already run through.
export type PersonalRule = {
  id: string;
  description: string;
  source: 'self' | 'doctor';
  linkType: 'none' | 'food' | 'treatment';
  linkValue: string | null;
  linkLabel: string | null;
  active: boolean;
  createdAt: string;
};

const PERSONAL_RULE_COLUMNS = `
  id, description, source, link_type AS linkType, link_value AS linkValue,
  link_label AS linkLabel, active, created_at AS createdAt
`;

// Unfiltered by default -- the "manage your rules" list needs to show a
// paused rule too, not just the currently-active ones. Callers that only
// want what's currently checkable (lib/interactionRules.ts) pass true.
export async function listPersonalRules(activeOnly = false): Promise<PersonalRule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<PersonalRule, 'active'> & { active: number }>(
    `
      SELECT ${PERSONAL_RULE_COLUMNS}
      FROM personal_rules
      ${activeOnly ? 'WHERE active = 1' : ''}
      ORDER BY created_at DESC
    `,
  );
  return rows.map((row) => ({ ...row, active: row.active === 1 }));
}

export async function createPersonalRule(input: {
  description: string;
  source: 'self' | 'doctor';
  linkType: 'none' | 'food' | 'treatment';
  linkValue?: string | null;
  linkLabel?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `personal_rule_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO personal_rules (id, description, source, link_type, link_value, link_label, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `,
    id,
    input.description.trim(),
    input.source,
    input.linkType,
    input.linkValue?.trim() || null,
    input.linkLabel?.trim() || null,
  );
  return id;
}

export async function setPersonalRuleActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE personal_rules SET active = ? WHERE id = ?', active ? 1 : 0, id);
}

export async function deletePersonalRule(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM personal_rules WHERE id = ?', id);
}

export type TrackedNutrient = {
  code: string;
  displayName: string;
  unit: string;
  group: string;
};

// Every nutrient this app tracks (the same list the Insights Nutrients
// table and DRI targets are built from) -- what populates the ingredient
// picker when documenting a supplement's per-dose contents, AND (2026-08-08)
// Insights' own Nutrient Ranking lens's picker -- the same real list
// either way, not two separately-maintained copies of it.
export async function listTrackedNutrients(): Promise<TrackedNutrient[]> {
  const db = await getReferenceDatabase();
  return db.getAllAsync<TrackedNutrient>(
    `
      SELECT code, display_name AS displayName, unit, nutrient_group AS "group"
      FROM nutrients
      ORDER BY CASE nutrient_group WHEN 'macro' THEN 0 WHEN 'vitamin' THEN 1 WHEN 'mineral' THEN 2 ELSE 3 END, display_name
    `,
  );
}

// A cited rule about a food/supplement/prescription timing or dosing
// interaction -- see scripts/add_interaction_rules.py for the full
// citation on each row. checkable=true means lib/interactionRules.ts can
// actively evaluate it against a person's real active supplements/
// prescriptions/schedule/food; checkable=false means it's shown as static
// reference content only (today, that's just the biotin/thyroid-lab rule --
// it depends on knowing about an upcoming lab draw, which this app doesn't
// track, not on prescription tracking).
export type InteractionRuleRecord = {
  id: string;
  ruleType:
    | 'timing_separation'
    | 'dietary_cofactor'
    | 'appointment_caution'
    | 'reference_only'
    | 'dose_consistency_caution'
    | 'concurrent_use_caution'
    | 'age_threshold_caution';
  checkable: boolean;
  // For rule_type='age_threshold_caution', subjectAKind may also be
  // 'condition' -- matched against the person's own selected conditions
  // (user_conditions/getUserConditions) by the conditions table's own
  // snake_case code, rather than an active treatment. Every other rule
  // type still only ever uses 'nutrient'/'prescription' here.
  subjectAKind: string;
  subjectA: string;
  subjectBKind: string | null;
  subjectB: string | null;
  minSeparationHours: number | null;
  // Only set for rule_type='appointment_caution' -- how many days ahead to
  // look for a matching upcoming appointment (see subjectB, an
  // appointment_type value like 'lab_draw') before this rule fires.
  lookaheadDays: number | null;
  // Added 2026-08-08 for real, age-personalized rules -- only set for
  // rule_type='age_threshold_caution'. At least one of minAge/maxAge is
  // set; both may be, to express a real bounded band (e.g. pediatric-only
  // is maxAge with no minAge, elderly-only is minAge with no maxAge). The
  // person's own real age is resolved from their Profile birth date at
  // evaluation time (see lib/interactionRules.ts) -- this table never
  // stores anyone's actual age, only the real, cited threshold a finding
  // applies at.
  minAge: number | null;
  maxAge: number | null;
  severity: 'caution' | 'note';
  title: string;
  guidance: string;
  citation: string;
  // 2026-08-23, direct request: a generic (not personalized, no logged
  // data involved) "why" explanation of the actual mechanism behind a
  // rule, shown only when someone taps to ask, never sitting permanently
  // on screen. Nullable rather than backfilled everywhere at once: this
  // is real, individually-researched content being written in scoped
  // batches, the same "ongoing, multi-session" discipline the Digest's
  // own content already follows, not a claim that every row has one yet.
  mechanism: string | null;
};

export async function listInteractionRules(): Promise<InteractionRuleRecord[]> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    rule_type: string;
    checkable: number;
    subject_a_kind: string;
    subject_a: string;
    subject_b_kind: string | null;
    subject_b: string | null;
    min_separation_hours: number | null;
    lookahead_days: number | null;
    min_age: number | null;
    max_age: number | null;
    severity: string;
    title: string;
    guidance: string;
    citation: string;
    mechanism: string | null;
  }>('SELECT * FROM interaction_rules ORDER BY id');

  return rows.map((row) => ({
    id: row.id,
    ruleType: row.rule_type as InteractionRuleRecord['ruleType'],
    checkable: Boolean(row.checkable),
    subjectAKind: row.subject_a_kind,
    subjectA: row.subject_a,
    subjectBKind: row.subject_b_kind,
    subjectB: row.subject_b,
    minSeparationHours: row.min_separation_hours,
    lookaheadDays: row.lookahead_days,
    minAge: row.min_age,
    maxAge: row.max_age,
    severity: row.severity as InteractionRuleRecord['severity'],
    title: row.title,
    guidance: row.guidance,
    citation: row.citation,
    mechanism: row.mechanism,
  }));
}

async function getNutrientCanonicalUnits(): Promise<Record<string, string>> {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ code: string; unit: string }>('SELECT code, unit FROM nutrients');
  return Object.fromEntries(rows.map((row) => [row.code, row.unit]));
}

// Sums the estimated daily nutrient intake from every active supplement
// the person has logged, normalized into whatever unit this app's own
// food/DRI data uses for that nutrient -- so it can be added directly to a
// day's food totals via lib/nutrientAnalysis.ts's analyzeNutrientIntake.
// Ingredients whose label unit can't be confidently normalized (e.g. an IU
// dose for a nutrient with no single official IU factor, like vitamin E)
// are skipped and reported separately rather than silently guessed at.
export async function getSupplementNutrientTotals(): Promise<{
  totals: Record<string, number>;
  skipped: { treatmentId: string; treatmentName: string; nutrientCode: string; reason: string }[];
}> {
  const [treatments, canonicalUnits] = await Promise.all([listSupplementTreatments(true), getNutrientCanonicalUnits()]);
  const totals: Record<string, number> = {};
  const skipped: { treatmentId: string; treatmentName: string; nutrientCode: string; reason: string }[] = [];

  for (const treatment of treatments) {
    if (!treatment.unitsPerDay) continue;
    const ingredients = await getTreatmentNutrients(treatment.id);

    for (const ingredient of ingredients) {
      const canonicalUnit = canonicalUnits[ingredient.nutrientCode];
      const dailyAmount = ingredient.amountPerUnit * treatment.unitsPerDay;

      if (!canonicalUnit) {
        skipped.push({
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          nutrientCode: ingredient.nutrientCode,
          reason: 'unknown_unit',
        });
        continue;
      }

      const normalized = normalizeSupplementAmount(ingredient.nutrientCode, dailyAmount, ingredient.unit, canonicalUnit);

      if (!normalized.ok) {
        skipped.push({
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          nutrientCode: ingredient.nutrientCode,
          reason: normalized.reason,
        });
        continue;
      }

      totals[ingredient.nutrientCode] = (totals[ingredient.nutrientCode] ?? 0) + normalized.amount;
    }
  }

  return { totals, skipped };
}

function normalizeUnitForConversion(unit: string): MeasurementUnit | null {
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, '_');
  // Reads straight from unitConversion.ts's own MASS_UNITS/VOLUME_UNITS
  // rather than a second, hand-maintained copy of the same list -- 2026-
  // 08-02, fixed while adding pint/quart/gallon there specifically so a
  // future unit addition can't update one list and silently miss the
  // other again.
  const recognized: readonly string[] = [...MASS_UNITS, ...VOLUME_UNITS];
  return recognized.includes(normalized) ? (normalized as MeasurementUnit) : null;
}

export type DailyNutrientAnalysisResult = {
  entries: NutrientGapEntry[];
  // Ingredients that couldn't be counted -- not linked to a real food, an
  // unrecognized unit, or (most commonly) a solid food measured by volume
  // with no available density data (see lib/unitConversion.ts). Surfaced
  // explicitly rather than silently treated as zero, since a meal missing
  // several ingredients from its totals should never look identical to a
  // meal that genuinely has nothing more to give.
  unresolvedItems: { mealItemId: string; foodName: string; reason: string }[];
  supplementSkipped: { treatmentId: string; treatmentName: string; nutrientCode: string; reason: string }[];
  // False when sex and/or birth date aren't set on the profile -- entries
  // will then include every applicable sex/age population rather than one
  // tailored row per nutrient (see getDietaryReferenceIntakesForProfile).
  profileComplete: boolean;
};

// The actual "wiring": combines every meal eaten on one date with active
// supplement intake and the person's own (or, if unset, every applicable)
// Dietary Reference Intake, and runs it through
// lib/nutrientAnalysis.ts's analyzeNutrientIntake. This is what turns
// logging a meal into "here's what you're short on today" instead of just
// a saved record.
export async function getDailyNutrientAnalysis(date: string): Promise<DailyNutrientAnalysisResult> {
  const meals = await listMealsForDate(date);
  const foodTotals: Record<string, number> = {};
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];

  for (const meal of meals) {
    const items = await getMealItems(meal.id);

    for (const item of items) {
      if (!item.foodId || item.servingSize == null || !item.servingUnit) {
        unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'not_linked_to_a_food' });
        continue;
      }

      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) {
        unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'not_linked_to_a_food' });
        continue;
      }

      let grams: number;

      // 'each' is a count, not a mass/volume unit -- convertToGrams
      // doesn't (and shouldn't) know what to do with it, since that needs
      // a per-food "how much does one weigh" fact, not unit math. Handled
      // as its own branch rather than folded into normalizeUnitForConversion.
      if (item.servingUnit.trim().toLowerCase() === 'each') {
        const unitWeight = await getFoodUnitWeight(foodId, source);
        if (!unitWeight) {
          unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'no_unit_weight_data' });
          continue;
        }
        grams = unitWeight.gramsPerUnit * item.servingSize;
      } else {
        const unit = normalizeUnitForConversion(item.servingUnit);
        if (!unit) {
          unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'unsupported_unit' });
          continue;
        }

        // Only volume units need the food's category (to resolve a density
        // class) -- skip the extra lookup for mass units, which convert
        // exactly regardless of what food they belong to. meal_items now
        // stores category directly (set at save time), so this only falls
        // back to a live lookup for rows saved before that column existed.
        const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
          ? null
          : item.category ?? (await getFoodCategory(foodId, source));

        const conversion = convertToGrams(item.servingSize, unit, { foodCategory: foodCategory ?? undefined });
        if (!conversion.ok) {
          unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: conversion.reason });
          continue;
        }
        grams = conversion.grams;
      }

      const totalGramsForDish = grams * (item.quantity ?? 1);
      // yourSharePercent is what actually gets used -- an even split across
      // dishServings is only ever a rough starting assumption (two people
      // sharing a dish rarely eat exactly equal portions), so the app
      // tracks this person's real share directly rather than assuming
      // 1/dishServings. Rows saved before this field existed have no
      // yourSharePercent on file, so they fall back to the old equal-split
      // assumption rather than losing history.
      const shareFraction = item.yourSharePercent != null ? item.yourSharePercent / 100 : 1 / (item.dishServings ?? 1);
      const gramsConsumedByThisPerson = totalGramsForDish * shareFraction;

      const nutrients = await getFoodNutrients(foodId, source);
      const scaled = sumFoodNutrientTotals([{ gramsConsumed: gramsConsumedByThisPerson, nutrients }]);

      for (const [code, amount] of Object.entries(scaled)) {
        foodTotals[code] = (foodTotals[code] ?? 0) + amount;
      }
    }
  }

  const [supplementResult, driRows, profile] = await Promise.all([
    getSupplementNutrientTotals(),
    getDietaryReferenceIntakesForCurrentUser(),
    getUserProfile(),
  ]);

  const entries = analyzeNutrientIntake(driRows, foodTotals, supplementResult.totals);

  return {
    entries,
    unresolvedItems,
    supplementSkipped: supplementResult.skipped,
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

// Raw, unlabeled nutrient totals for one scope (an item, a side, a meal, or
// the whole day) -- nutrientCode -> grams-scaled amount from food alone.
// Deliberately excludes supplements: a supplement isn't eaten as part of
// any one food/side/meal, so folding it in below the day level would
// misattribute it to whichever scope happened to be selected. Callers pass
// this straight into analyzeNutrientIntake (supplementTotals only at the
// day level) to get real percent-of-target figures for that scope.
export type DailyNutrientScopeTotals = Record<string, number>;

export type DailyNutrientItemBreakdown = {
  foodName: string;
  totals: DailyNutrientScopeTotals;
};

export type DailyNutrientSideBreakdown = {
  sideName: string;
  totals: DailyNutrientScopeTotals;
  items: DailyNutrientItemBreakdown[];
};

export type DailyNutrientMealBreakdown = {
  mealId: string;
  mealName: string;
  mealType: string;
  totals: DailyNutrientScopeTotals;
  sides: DailyNutrientSideBreakdown[];
};

export type DailyNutrientBreakdown = {
  dayTotals: DailyNutrientScopeTotals;
  meals: DailyNutrientMealBreakdown[];
  driRows: DietaryReferenceIntake[];
  supplementTotals: Record<string, number>;
  unresolvedItems: { mealItemId: string; foodName: string; reason: string }[];
  supplementSkipped: { treatmentId: string; treatmentName: string; nutrientCode: string; reason: string }[];
  profileComplete: boolean;
};

// Item -> side -> meal -> day nutrient breakdown for one date -- the
// Nutrients lens's data source, analogous to getDailySixDimensionsBreakdown
// but for nutrient amounts instead of D1-D6 scores. Reuses the exact same
// unit-conversion/yourSharePercent math as getDailyNutrientAnalysis above
// (kept in sync deliberately -- both must agree on what a food's real
// consumed grams are), just keyed by scope instead of flattened straight to
// one day total. Each distinct food's raw per-100g nutrient list is fetched
// at most once per date, then scaled locally per item -- the scaling can't
// be cached since the same food can be eaten in different amounts at
// different points in the day.
//
// 2026-08-16, a real fix for the same N+1 pattern already found and fixed
// once in getNutrientTotalsByDateRange above: this used to call
// getMealItems(meal.id) once PER MEAL, each its own real DB round-trip
// through the one shared, memoized SQLite connection every query in this
// app serializes through. Someone with breakfast/lunch/dinner/a snack
// logged was paying 4 separate item-fetch queries just to open Insights'
// Nutrients/Cooking & Prep lens, on top of every per-ingredient nutrient
// lookup already needed. Fixed the same way: one single
// getMealItemsInWindow call (already proven, endOfLocalDay reused from the
// exact same date-boundary fix that call already needs) fetches every real
// item for the whole day at once, grouped by mealId in plain JS afterward
// -- the rest of this function's own per-item processing is completely
// unchanged, since getMealItemsInWindow returns the identical real fields
// getMealItems always did (confirmed directly against both queries' own
// SELECT lists), just for the whole day in one query instead of one query
// per meal.
export async function getDailyNutrientBreakdown(date: string): Promise<DailyNutrientBreakdown> {
  const [meals, dayItems] = await Promise.all([listMealsForDate(date), getMealItemsInWindow(date, endOfLocalDay(date))]);
  const itemsByMeal = new Map<string, typeof dayItems>();
  for (const item of dayItems) {
    if (!itemsByMeal.has(item.mealId)) itemsByMeal.set(item.mealId, []);
    itemsByMeal.get(item.mealId)!.push(item);
  }

  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];

  // Every distinct real (foodId, source) pair across the WHOLE day,
  // resolved in exactly two bulk queries total via
  // getPrimaryNutrientAmountsBulk (see its own header comment for the
  // real, device-confirmed reason this replaces one getFoodNutrients call
  // per distinct food) rather than one real query per food. getCachedNutrients
  // below now just looks this map up -- no DB call left in the per-item loop.
  const distinctFoodPairs = new Map<string, { foodId: number; source: string }>();
  for (const item of dayItems) {
    if (!item.foodId) continue;
    const [foodIdStr, source] = item.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) continue;
    distinctFoodPairs.set(`${foodId}|${source}`, { foodId, source });
  }
  const nutrientsByFood = await getPrimaryNutrientAmountsBulk(Array.from(distinctFoodPairs.values()));

  function getCachedNutrients(foodId: number, source: string): Pick<FoodNutrient, 'code' | 'amountPer100g'>[] {
    return nutrientsByFood.get(`${foodId}|${source}`) ?? [];
  }

  function addInto(target: Record<string, number>, source: Record<string, number>) {
    for (const [code, amount] of Object.entries(source)) {
      target[code] = (target[code] ?? 0) + amount;
    }
  }

  const mealBreakdowns: DailyNutrientMealBreakdown[] = [];
  const dayTotals: Record<string, number> = {};

  for (const meal of meals) {
    const items = itemsByMeal.get(meal.id) ?? [];
    const sideOrder: string[] = [];
    const sidesByKey = new Map<
      string,
      { sideName: string; totals: Record<string, number>; items: DailyNutrientItemBreakdown[] }
    >();
    const mealTotals: Record<string, number> = {};

    for (const item of items) {
      if (!item.foodId || item.servingSize == null || !item.servingUnit) {
        unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'not_linked_to_a_food' });
        continue;
      }

      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) {
        unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'not_linked_to_a_food' });
        continue;
      }

      let grams: number;

      if (item.servingUnit.trim().toLowerCase() === 'each') {
        const unitWeight = await getFoodUnitWeight(foodId, source);
        if (!unitWeight) {
          unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'no_unit_weight_data' });
          continue;
        }
        grams = unitWeight.gramsPerUnit * item.servingSize;
      } else {
        const unit = normalizeUnitForConversion(item.servingUnit);
        if (!unit) {
          unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: 'unsupported_unit' });
          continue;
        }

        const foodCategory = !(VOLUME_UNITS as readonly string[]).includes(unit)
          ? null
          : item.category ?? (await getFoodCategory(foodId, source));

        const conversion = convertToGrams(item.servingSize, unit, { foodCategory: foodCategory ?? undefined });
        if (!conversion.ok) {
          unresolvedItems.push({ mealItemId: item.id, foodName: item.foodName, reason: conversion.reason });
          continue;
        }
        grams = conversion.grams;
      }

      const totalGramsForDish = grams * (item.quantity ?? 1);
      const shareFraction = item.yourSharePercent != null ? item.yourSharePercent / 100 : 1 / (item.dishServings ?? 1);
      const gramsConsumedByThisPerson = totalGramsForDish * shareFraction;

      const nutrients = getCachedNutrients(foodId, source);
      const itemTotals = sumFoodNutrientTotals([{ gramsConsumed: gramsConsumedByThisPerson, nutrients }]);

      const sideKey = item.dishName || `${meal.id}_ungrouped`;
      if (!sidesByKey.has(sideKey)) {
        sidesByKey.set(sideKey, { sideName: item.sideName || 'Side', totals: {}, items: [] });
        sideOrder.push(sideKey);
      }
      const side = sidesByKey.get(sideKey)!;
      side.items.push({ foodName: item.foodName, totals: itemTotals });
      addInto(side.totals, itemTotals);
      addInto(mealTotals, itemTotals);
      addInto(dayTotals, itemTotals);
    }

    const sides: DailyNutrientSideBreakdown[] = sideOrder.map((sideKey) => {
      const side = sidesByKey.get(sideKey)!;
      return { sideName: side.sideName, totals: side.totals, items: side.items };
    });

    mealBreakdowns.push({
      mealId: meal.id,
      mealName: meal.name,
      mealType: meal.meal_type,
      totals: mealTotals,
      sides,
    });
  }

  const [supplementResult, driRows, profile] = await Promise.all([
    getSupplementNutrientTotals(),
    getDietaryReferenceIntakesForCurrentUser(),
    getUserProfile(),
  ]);

  return {
    dayTotals,
    meals: mealBreakdowns,
    driRows,
    supplementTotals: supplementResult.totals,
    unresolvedItems,
    supplementSkipped: supplementResult.skipped,
    profileComplete: profile.sex != null && profile.birthDate != null,
  };
}

export type DailyDimensionScore = {
  dimension: string;
  subCriterion: string;
  // One entry per distinct food in whatever scope this score was rolled up
  // for (a single item, a side, a meal, or the whole day) -- a food logged
  // more than once in the same scope (e.g. olive oil in two sides of one
  // meal) only counts once there, same "distinct food" reasoning as the
  // goitrogenic-load check. An item-level score always has exactly one
  // entry, since it's just that one food's own scores.
  entries: { foodName: string; tier: string }[];
};

// perCondition, 2026-08-26 -- one entry per tracked condition, each with
// its own real dimension set and severity, scoped to whatever foods this
// level actually covers (see lib/conditionDimensions.ts). Added alongside
// bySubCriterion rather than replacing it: the Cooking & Prep lens
// (PrepView, app/(tabs)/insights.tsx) reads bySubCriterion directly for a
// genuinely different, condition-independent question (does this food
// change based on how it's prepared), and needs no change at all as long
// as this field keeps meaning exactly what it always has.
export type DailyDimensionItemBreakdown = {
  foodName: string;
  bySubCriterion: DailyDimensionScore[];
  perCondition: Record<string, ConditionDimensionSummary>;
};

export type DailyDimensionSideBreakdown = {
  sideName: string;
  bySubCriterion: DailyDimensionScore[];
  items: DailyDimensionItemBreakdown[];
  perCondition: Record<string, ConditionDimensionSummary>;
};

export type DailyDimensionMealBreakdown = {
  mealId: string;
  mealName: string;
  mealType: string;
  bySubCriterion: DailyDimensionScore[];
  sides: DailyDimensionSideBreakdown[];
  perCondition: Record<string, ConditionDimensionSummary>;
};

export type DailySixDimensionsBreakdown = {
  day: DailyDimensionScore[];
  dayPerCondition: Record<string, ConditionDimensionSummary>;
  meals: DailyDimensionMealBreakdown[];
};

// Rolls a set of distinct foods (each already carrying its own full score
// list) up into the shared per-sub-criterion shape used at every level --
// item, side, meal, and day are all "some set of distinct foods," just a
// different set at each level, so one function produces all four.
function aggregateBySubCriterion(foods: { foodName: string; scores: FoodScore[] }[]): DailyDimensionScore[] {
  const bySubCriterion = new Map<string, DailyDimensionScore>();

  for (const food of foods) {
    for (const score of food.scores) {
      if (!bySubCriterion.has(score.subCriterion)) {
        bySubCriterion.set(score.subCriterion, { dimension: score.dimension, subCriterion: score.subCriterion, entries: [] });
      }
      bySubCriterion.get(score.subCriterion)!.entries.push({ foodName: food.foodName, tier: score.tier });
    }
  }

  return Array.from(bySubCriterion.values());
}

// Full item -> side -> meal -> day breakdown of D1-D6 scores for a given
// date -- the "Today's 6 Dimensions" flyout's data source, analogous to
// getDailyNutrientAnalysis but for the 6-dimension scoring rubric instead
// of nutrient totals. Every distinct food's score list is fetched at most
// once (cached across the whole date, not just within one meal/side),
// since the same food -- olive oil especially -- tends to show up
// repeatedly across a day.
//
// 2026-08-16, the identical N+1 fix as getDailyNutrientBreakdown just above
// -- one getMealItemsInWindow call for the whole day instead of one
// getMealItems call per meal, grouped by mealId afterward. Same real fields
// either way, same per-meal processing below, completely unchanged.
// trackedConditions, 2026-08-26 -- optional, defaults to [] so every
// existing caller (Trends' own past history, anything not yet updated)
// keeps working unchanged: an empty list means perCondition/
// dayPerCondition come back as {} at every level, the same "absence means
// no restriction" contract this app's other personalization features
// already follow. Insights' own "6 Dimensions" lens is the real caller
// that passes the person's actual tracked conditions.
export async function getDailySixDimensionsBreakdown(
  date: string,
  trackedConditions: { code: string; name: string }[] = [],
): Promise<DailySixDimensionsBreakdown> {
  const [meals, dayItems] = await Promise.all([listMealsForDate(date), getMealItemsInWindow(date, endOfLocalDay(date))]);
  const itemsByMeal = new Map<string, typeof dayItems>();
  for (const item of dayItems) {
    if (!itemsByMeal.has(item.mealId)) itemsByMeal.set(item.mealId, []);
    itemsByMeal.get(item.mealId)!.push(item);
  }

  // The same real fix as getDailyNutrientBreakdown just above -- every
  // distinct real (foodId, source) pair for the WHOLE day, resolved in one
  // bulk query via getFoodScoresBulk instead of one getFoodScores call per
  // distinct food. conditionScoresByFood is the condition-scoped sibling
  // of that same fix (getConditionScoresForFoodsBulk), fetched once here
  // too rather than once per tracked condition.
  const distinctFoodPairs = new Map<string, { foodId: number; source: string }>();
  for (const item of dayItems) {
    if (!item.foodId) continue;
    const [foodIdStr, source] = item.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) continue;
    distinctFoodPairs.set(`${foodId}|${source}`, { foodId, source });
  }
  const [scoresByFood, conditionScoresByFood] = await Promise.all([
    getFoodScoresBulk(Array.from(distinctFoodPairs.values())),
    getConditionScoresForFoodsBulk(Array.from(distinctFoodPairs.values()), trackedConditions.map((condition) => condition.code)),
  ]);

  function getScores(foodId: number, source: string): FoodScore[] {
    return scoresByFood.get(`${foodId}|${source}`) ?? [];
  }

  type DayFood = { foodName: string; scores: FoodScore[]; foodId: number; source: string };
  const mealBreakdowns: DailyDimensionMealBreakdown[] = [];
  const dayFoods = new Map<string, DayFood>();

  for (const meal of meals) {
    const items = itemsByMeal.get(meal.id) ?? [];
    const sideOrder: string[] = [];
    const sidesByKey = new Map<string, { sideName: string; foods: Map<string, DayFood> }>();
    const mealFoods = new Map<string, DayFood>();

    for (const item of items) {
      if (!item.foodId) continue;
      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;

      const scores = getScores(foodId, source);
      const foodKey = `${foodId}|${source}`;
      const foodEntry: DayFood = { foodName: item.foodName, scores, foodId, source };

      const sideKey = item.dishName || `${meal.id}_ungrouped`;
      if (!sidesByKey.has(sideKey)) {
        sidesByKey.set(sideKey, { sideName: item.sideName || 'Side', foods: new Map() });
        sideOrder.push(sideKey);
      }
      sidesByKey.get(sideKey)!.foods.set(foodKey, foodEntry);
      mealFoods.set(foodKey, foodEntry);
      dayFoods.set(foodKey, foodEntry);
    }

    const sides: DailyDimensionSideBreakdown[] = sideOrder.map((sideKey) => {
      const side = sidesByKey.get(sideKey)!;
      const foodEntries = Array.from(side.foods.values());
      return {
        sideName: side.sideName,
        bySubCriterion: aggregateBySubCriterion(foodEntries),
        items: foodEntries.map((food) => ({
          foodName: food.foodName,
          bySubCriterion: aggregateBySubCriterion([food]),
          perCondition: buildPerConditionSummaries([food], trackedConditions, conditionScoresByFood),
        })),
        perCondition: buildPerConditionSummaries(foodEntries, trackedConditions, conditionScoresByFood),
      };
    });

    const mealFoodEntries = Array.from(mealFoods.values());
    mealBreakdowns.push({
      mealId: meal.id,
      mealName: meal.name,
      mealType: meal.meal_type,
      bySubCriterion: aggregateBySubCriterion(mealFoodEntries),
      sides,
      perCondition: buildPerConditionSummaries(mealFoodEntries, trackedConditions, conditionScoresByFood),
    });
  }

  const dayFoodEntries = Array.from(dayFoods.values());
  return {
    day: aggregateBySubCriterion(dayFoodEntries),
    dayPerCondition: buildPerConditionSummaries(dayFoodEntries, trackedConditions, conditionScoresByFood),
    meals: mealBreakdowns,
  };
}

export type NutrientTotalsByDateRange = {
  // date -> nutrientCode -> total amount for that day, across every real
  // meal logged. Only dates with at least one real, resolvable item ever
  // appear as a key -- a day with nothing eaten produces no entry at all,
  // never a false zero.
  dayTotals: Record<string, Record<string, number>>;
  driRows: DietaryReferenceIntake[];
  supplementTotals: Record<string, number>;
};

// The real fix for a genuine, confirmed performance bug -- 2026-08-15,
// reported directly: "why does it take so long... We aren't having to
// check the whole damn database of foods for this." Confirmed the actual
// cause by reading getDatabase(): this whole app runs every query through
// ONE shared, memoized SQLite connection, so a real fix has to cut the
// NUMBER of underlying queries, not just their JS-side scheduling (already
// tried once, via Promise.all, and confirmed not to help for exactly this
// reason).
//
// getDailyNutrientBreakdown above is correct but genuinely heavy per call
// (1 query for that day's meals, 1 per meal for its items, up to 2-3 per
// distinct ingredient), and Trends used to call it once PER CALENDAR DAY in
// the requested range, with every cache reset fresh each day and
// getDietaryReferenceIntakesForCurrentUser/getSupplementNutrientTotals
// re-fetched every single day even though neither is date-dependent at
// all. This is the real, purpose-built range-scoped replacement: ONE query
// (getMealItemsInWindow, already proven -- built 2026-08-14 for
// lib/patternFinder.ts) for every real item across the WHOLE range, ONE
// call each for the two date-independent pieces, and a nutrient/unit-weight
// /category lookup cache shared across the entire range instead of reset
// per day -- a food eaten on 20 of 90 days now costs one real lookup total,
// not 20. Reuses the exact same real unit-conversion/share-fraction math as
// getDailyNutrientBreakdown, just fed from already-fetched data instead of
// a fresh query per item. Deliberately doesn't track unresolvedItems/
// per-side/per-meal detail the way the richer single-date function does --
// a trend chart only ever needs day totals, and carrying that extra real
// work across a 90-day range would be real, unnecessary cost.
// A real, small normalized shape both a real MealItemRecord row and a
// component's own resolved MealIngredientInput can be mapped onto -- the
// two differ in field names (servingSize/servingUnit + a real, always-1
// quantity multiplier on a saved row; quantity/unit with no separate
// multiplier on a resolved-but-not-yet-saved component ingredient,
// confirmed directly against insertMealItems' own real INSERT: it always
// writes literal 1 for meal_items.quantity, the only real write path this
// column has ever had) -- one shared resolver means the same real
// unit-conversion/share-fraction math is genuinely the same code for both a
// real logged meal and a projected, not-yet-eaten one, not two copies that
// could quietly drift apart.
type ResolvableIngredient = {
  foodId: string | null | undefined;
  foodName?: string;
  category: string | null | undefined;
  rawAmount: number;
  rawUnit: string;
  quantityMultiplier?: number | null;
  dishServings?: number | null;
  yourSharePercent?: number | null;
};

type IngredientResolutionCaches = {
  nutrient: Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>;
  unitWeight: Map<string, FoodUnitWeight | null>;
  category: Map<string, string | null>;
};

function createIngredientResolutionCaches(): IngredientResolutionCaches {
  return { nutrient: new Map(), unitWeight: new Map(), category: new Map() };
}

async function resolveIngredientNutrientTotals(
  ingredient: ResolvableIngredient,
  caches: IngredientResolutionCaches,
): Promise<Record<string, number> | null> {
  if (!ingredient.foodId || ingredient.rawAmount == null || !ingredient.rawUnit) return null;
  const [foodIdStr, source] = ingredient.foodId.split('|');
  const foodId = Number(foodIdStr);
  if (!source || Number.isNaN(foodId)) return null;

  let grams: number;
  if (ingredient.rawUnit.trim().toLowerCase() === 'each') {
    const key = `${foodId}|${source}`;
    if (!caches.unitWeight.has(key)) caches.unitWeight.set(key, await getFoodUnitWeight(foodId, source));
    const unitWeight = caches.unitWeight.get(key) ?? null;
    if (!unitWeight) return null;
    grams = unitWeight.gramsPerUnit * ingredient.rawAmount;
  } else {
    const unit = normalizeUnitForConversion(ingredient.rawUnit);
    if (!unit) return null;
    let foodCategory: string | null = null;
    if ((VOLUME_UNITS as readonly string[]).includes(unit)) {
      const key = `${foodId}|${source}`;
      if (ingredient.category) {
        foodCategory = ingredient.category;
      } else {
        if (!caches.category.has(key)) caches.category.set(key, await getFoodCategory(foodId, source));
        foodCategory = caches.category.get(key) ?? null;
      }
    }
    const conversion = convertToGrams(ingredient.rawAmount, unit, { foodCategory: foodCategory ?? undefined });
    if (!conversion.ok) return null;
    grams = conversion.grams;
  }

  const totalGramsForDish = grams * (ingredient.quantityMultiplier ?? 1);
  const shareFraction = ingredient.yourSharePercent != null ? ingredient.yourSharePercent / 100 : 1 / (ingredient.dishServings ?? 1);
  const gramsConsumed = totalGramsForDish * shareFraction;

  const key = `${foodId}|${source}`;
  if (!caches.nutrient.has(key)) caches.nutrient.set(key, await getFoodNutrients(foodId, source));
  const nutrients = caches.nutrient.get(key)!;

  return sumFoodNutrientTotals([{ gramsConsumed, nutrients }]);
}

function addNutrientTotalsInto(target: Record<string, number>, source: Record<string, number>) {
  for (const [code, amount] of Object.entries(source)) {
    target[code] = (target[code] ?? 0) + amount;
  }
}

// getMealItemsInWindow's own `m.eaten_at BETWEEN startLocal AND endLocal`
// is a real, correct, precise primitive -- lib/patternFinder.ts calls it
// with genuine hour-precise datetime bounds and needs that exact-string
// behavior. But both real callers just below pass a bare 'YYYY-MM-DD'
// endLocal meaning "through the end of that whole day," and a bare date
// string sorts BEFORE any real, full 'YYYY-MM-DDTHH:mm' timestamp on that
// same date -- confirmed directly (sqlite3 CLI): `eaten_at BETWEEN
// '2026-08-02' AND '2026-08-16'` matched zero of the real rows actually
// logged on 2026-08-16 itself, only rows from the day before. Every meal
// on the requested range's own LAST day (including "today," for any
// range ending today, and any single-day range where start===end) was
// silently being dropped as a result -- a real, already-shipped bug from
// the 2026-08-15 range rewrite, not something new. Widening just the END
// bound to the true end of that calendar day fixes it here, at the two
// callers that actually mean "whole days," without touching
// getMealItemsInWindow's own correct, precise contract at all.
// Exported 2026-08-18 so lib/interactionRules.ts's own personal-rule
// matching can reuse the identical end-of-day boundary rather than
// duplicate this one-liner -- see this function's own history above for
// why a bare date string as the end bound is wrong.
export function endOfLocalDay(dateOrDateTime: string): string {
  return `${dateOrDateTime.slice(0, 10)}T23:59`;
}

export async function getNutrientTotalsByDateRange(startLocal: string, endLocal: string): Promise<NutrientTotalsByDateRange> {
  const [items, supplementResult, driRows] = await Promise.all([
    getMealItemsInWindow(startLocal, endOfLocalDay(endLocal)),
    getSupplementNutrientTotals(),
    getDietaryReferenceIntakesForCurrentUser(),
  ]);

  const caches = createIngredientResolutionCaches();
  const dayTotals: Record<string, Record<string, number>> = {};

  for (const item of items) {
    const itemTotals = await resolveIngredientNutrientTotals(
      {
        foodId: item.foodId,
        category: item.category,
        rawAmount: item.servingSize ?? 0,
        rawUnit: item.servingUnit ?? '',
        quantityMultiplier: item.quantity,
        dishServings: item.dishServings,
        yourSharePercent: item.yourSharePercent,
      },
      caches,
    );
    if (!itemTotals) continue;

    const date = item.eatenAt.slice(0, 10);
    if (!dayTotals[date]) dayTotals[date] = {};
    addNutrientTotalsInto(dayTotals[date], itemTotals);
  }

  return { dayTotals, driRows, supplementTotals: supplementResult.totals };
}

// The real future half of the same fix -- a day that hasn't happened yet
// has no real meals/meal_items row at all (confirmed: settlePastScheduledMeals
// only ever materializes one once its own scheduled_for has passed), so
// there's nothing for getMealItemsInWindow to find. This reads real,
// still-'planned' schedule_items rows instead and resolves each one's real
// components the exact same way settlePastScheduledMeals itself already
// does (getMealComponents for a sourceMealId, getMealFavorite for a
// sourceFavoriteId) -- but stops short of ever calling
// createMealFromComponents, since the day genuinely hasn't happened and
// shouldn't be faked into existing early. Shared by both the nutrient and
// 6-DFF future-projection paths below, so the real schedule/component
// resolution chain only exists once, not duplicated a second time for a
// second real metric.
async function getProjectedIngredientsByDateRange(startDate: string, endDate: string): Promise<Record<string, ResolvableIngredient[]>> {
  const db = await getDatabase();
  const scheduleRows = await db.getAllAsync<ScheduleItemRecord>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}
      FROM schedule_items
      WHERE item_type = 'meal' AND status = 'planned' AND substr(scheduled_for, 1, 10) BETWEEN ? AND ?
      ORDER BY scheduled_for ASC
    `,
    startDate,
    endDate,
  );

  // A rotation reasonably reuses the same real favorite/meal template across
  // many future days -- resolved once per real source, not once per day it
  // happens to be scheduled on.
  const componentSelectionCache = new Map<string, MealComponentSelection[]>();
  const resolvedIngredientCache = new Map<string, MealIngredientInput[]>();

  async function getComponentSelections(item: ScheduleItemRecord): Promise<MealComponentSelection[]> {
    const key = item.sourceMealId ? `meal:${item.sourceMealId}` : item.sourceFavoriteId ? `favorite:${item.sourceFavoriteId}` : null;
    if (!key) return [];
    const cached = componentSelectionCache.get(key);
    if (cached) return cached;

    let selections: MealComponentSelection[] = [];
    if (item.sourceMealId) {
      const records = await getMealComponents(item.sourceMealId);
      selections = records.map((record) => ({
        componentType: record.componentType,
        componentId: record.componentId,
        yourSharePercent: record.yourSharePercent,
      }));
    } else if (item.sourceFavoriteId) {
      const favorite = await getMealFavorite(item.sourceFavoriteId);
      if (favorite) {
        selections = favorite.components.map((component) => ({
          componentType: component.componentType,
          componentId: component.componentId,
          yourSharePercent: component.yourSharePercent,
        }));
      }
    }
    componentSelectionCache.set(key, selections);
    return selections;
  }

  async function getResolvedIngredients(selection: MealComponentSelection): Promise<MealIngredientInput[]> {
    const key = `${selection.componentType}:${selection.componentId}:${selection.yourSharePercent}`;
    const cached = resolvedIngredientCache.get(key);
    if (cached) return cached;
    const resolved = await resolveMealComponent(selection);
    const ingredients = resolved?.ingredients ?? [];
    resolvedIngredientCache.set(key, ingredients);
    return ingredients;
  }

  const byDate: Record<string, ResolvableIngredient[]> = {};

  for (const item of scheduleRows) {
    const selections = await getComponentSelections(item);
    if (selections.length === 0) continue;
    const date = item.scheduledFor.slice(0, 10);

    for (const selection of selections) {
      const ingredients = await getResolvedIngredients(selection);
      for (const ingredient of ingredients) {
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push({
          foodId: ingredient.foodId,
          foodName: ingredient.foodName,
          category: ingredient.category,
          rawAmount: ingredient.quantity,
          rawUnit: ingredient.unit,
          dishServings: ingredient.dishServings,
          yourSharePercent: ingredient.yourSharePercent,
        });
      }
    }
  }

  return byDate;
}

export async function getProjectedNutrientTotalsByDateRange(startDate: string, endDate: string): Promise<NutrientTotalsByDateRange> {
  const [byDate, supplementResult, driRows] = await Promise.all([
    getProjectedIngredientsByDateRange(startDate, endDate),
    getSupplementNutrientTotals(),
    getDietaryReferenceIntakesForCurrentUser(),
  ]);

  const caches = createIngredientResolutionCaches();
  const dayTotals: Record<string, Record<string, number>> = {};

  for (const [date, ingredients] of Object.entries(byDate)) {
    for (const ingredient of ingredients) {
      const totals = await resolveIngredientNutrientTotals(ingredient, caches);
      if (!totals) continue;
      if (!dayTotals[date]) dayTotals[date] = {};
      addNutrientTotalsInto(dayTotals[date], totals);
    }
  }

  return { dayTotals, driRows, supplementTotals: supplementResult.totals };
}

type FlagCountFood = { foodName: string; foodId: number; source: string };

// The shared counting step behind both real functions below -- 2026-08-26,
// rebuilt to be condition-scoped instead of one generic count across
// every currently-scored sub-criterion regardless of relevance (the exact
// gap phases 1-3 of this same rebuild already closed for Insights/
// food-item-detail.tsx: this was the one remaining place still asking the
// old, unpersonalized question). conditionCodes empty (nobody tracks
// anything yet) falls back to the old generic behavior, the same
// "absence means no restriction" contract this app's other
// personalization features already follow; conditionCodes non-empty
// counts DISTINCT sub-criteria flagged for ANY of those conditions (a
// sub-criterion relevant to two tracked conditions at once still counts
// once, not twice), excluding the same near-universal background signal
// (NEAR_UNIVERSAL_SUB_CRITERIA) the condition-scoped dimension engine
// already excludes everywhere else, so a Hashimoto's tracker doesn't see
// this number inflated by a sub-criterion that fires on half the
// database. One bulk fetch for every distinct food across the WHOLE
// range, not one query per food per day.
async function countFlaggedSubCriteriaByDate(
  dayFoods: Map<string, Map<string, FlagCountFood>>,
  conditionCodes: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const allPairs = Array.from(dayFoods.values()).flatMap((foods) =>
    Array.from(foods.values()).map((food) => ({ foodId: food.foodId, source: food.source })),
  );

  if (conditionCodes.length === 0) {
    const scoresByFood = await getFoodScoresBulk(allPairs);
    for (const [date, foods] of dayFoods.entries()) {
      const foodEntries = Array.from(foods.values()).map((food) => ({
        foodName: food.foodName,
        scores: scoresByFood.get(`${food.foodId}|${food.source}`) ?? [],
      }));
      const bySubCriterion = aggregateBySubCriterion(foodEntries);
      counts[date] = bySubCriterion.filter((score) => score.entries.some((entry) => isFlaggedTier(entry.tier))).length;
    }
    return counts;
  }

  const conditionScoresByFood = await getConditionScoresForFoodsBulk(allPairs, conditionCodes);
  for (const [date, foods] of dayFoods.entries()) {
    const flaggedSubCriteria = new Set<string>();
    for (const food of foods.values()) {
      const byCondition = conditionScoresByFood.get(`${food.foodId}|${food.source}`);
      if (!byCondition) continue;
      for (const conditionCode of conditionCodes) {
        for (const score of byCondition.get(conditionCode) ?? []) {
          if (NEAR_UNIVERSAL_SUB_CRITERIA.has(score.subCriterion)) continue;
          if (isFlaggedTier(score.tier)) flaggedSubCriteria.add(score.subCriterion);
        }
      }
    }
    counts[date] = flaggedSubCriteria.size;
  }
  return counts;
}

// Same real fix as getNutrientTotalsByDateRange just above, applied to the
// flag count instead of nutrient amounts -- one query for every real item
// in range, then countFlaggedSubCriteriaByDate above for the actual
// per-day counting, so the semantics can't drift from the single-date
// version (getDailySixDimensionsBreakdown) or from each other.
//
// conditionCodes, 2026-08-26 -- optional, defaults to [] so every existing
// caller not yet updated keeps its old, generic behavior; Home's own
// "Worth a Look" badge and Trends' own trend line (via
// lib/trendAnalysis.ts) are the real callers passing the person's actual
// tracked conditions.
export async function getSixDimensionsFlagCountsByDateRange(
  startLocal: string,
  endLocal: string,
  conditionCodes: string[] = [],
): Promise<Record<string, number>> {
  const items = await getMealItemsInWindow(startLocal, endOfLocalDay(endLocal));
  const dayFoods = new Map<string, Map<string, FlagCountFood>>();

  for (const item of items) {
    if (!item.foodId) continue;
    const [foodIdStr, source] = item.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!source || Number.isNaN(foodId)) continue;

    const date = item.eatenAt.slice(0, 10);
    if (!dayFoods.has(date)) dayFoods.set(date, new Map());
    const dayMap = dayFoods.get(date)!;
    const foodKey = `${foodId}|${source}`;
    if (!dayMap.has(foodKey)) dayMap.set(foodKey, { foodName: item.foodName, foodId, source });
  }

  return countFlaggedSubCriteriaByDate(dayFoods, conditionCodes);
}

// The future half of the flag count, mirroring
// getProjectedNutrientTotalsByDateRange -- reuses the identical real
// schedule-resolution chain via getProjectedIngredientsByDateRange, then
// the same countFlaggedSubCriteriaByDate above, so a projected day's flag
// count means exactly the same thing a real logged day's does.
//
// conditionCodes, 2026-08-26 -- same optional, defaults-to-old-behavior
// contract as getSixDimensionsFlagCountsByDateRange above.
export async function getProjectedSixDimensionsFlagCountsByDateRange(
  startDate: string,
  endDate: string,
  conditionCodes: string[] = [],
): Promise<Record<string, number>> {
  const byDate = await getProjectedIngredientsByDateRange(startDate, endDate);
  const dayFoods = new Map<string, Map<string, FlagCountFood>>();

  for (const [date, ingredients] of Object.entries(byDate)) {
    const foods = new Map<string, FlagCountFood>();
    for (const ingredient of ingredients) {
      if (!ingredient.foodId) continue;
      const [foodIdStr, source] = ingredient.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;
      const foodKey = `${foodId}|${source}`;
      if (!foods.has(foodKey)) foods.set(foodKey, { foodName: ingredient.foodName ?? '', foodId, source });
    }
    dayFoods.set(date, foods);
  }

  return countFlaggedSubCriteriaByDate(dayFoods, conditionCodes);
}

export type LabResultRecord = {
  id: string;
  testCode: string;
  value: number;
  unit: string;
  labRangeLow: number | null;
  labRangeHigh: number | null;
  testedAt: string;
  labName: string | null;
  notes: string | null;
  createdAt: string;
};

export async function recordLabResult(input: {
  testCode: string;
  value: number;
  unit: string;
  labRangeLow?: number;
  labRangeHigh?: number;
  testedAt: string;
  labName?: string;
  notes?: string;
}) {
  const db = await getDatabase();
  const id = `lab_result_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO lab_results (id, test_code, value, unit, lab_range_low, lab_range_high, tested_at, lab_name, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.testCode,
    input.value,
    input.unit,
    input.labRangeLow ?? null,
    input.labRangeHigh ?? null,
    input.testedAt,
    input.labName?.trim() || null,
    input.notes?.trim() || null,
    now,
  );

  return id;
}

// Every logged result across every test, most recent first -- pass
// testCode to scope to one test. Use getLabResultTrend instead when you
// specifically want one test's history in chronological order for charting.
export async function listLabResults(testCode?: string, limit = 100) {
  const db = await getDatabase();
  return db.getAllAsync<LabResultRecord>(
    `
      SELECT id, test_code AS testCode, value, unit, lab_range_low AS labRangeLow, lab_range_high AS labRangeHigh,
             tested_at AS testedAt, lab_name AS labName, notes, created_at AS createdAt
      FROM lab_results
      ${testCode ? 'WHERE test_code = ?' : ''}
      ORDER BY tested_at DESC
      LIMIT ?
    `,
    ...(testCode ? [testCode, limit] : [limit]),
  );
}

// One test's full history in chronological (oldest-first) order -- the
// shape a trend chart or "is this getting better" comparison needs, as
// opposed to listLabResults' most-recent-first feed.
export async function getLabResultTrend(testCode: string) {
  const db = await getDatabase();
  return db.getAllAsync<LabResultRecord>(
    `
      SELECT id, test_code AS testCode, value, unit, lab_range_low AS labRangeLow, lab_range_high AS labRangeHigh,
             tested_at AS testedAt, lab_name AS labName, notes, created_at AS createdAt
      FROM lab_results
      WHERE test_code = ?
      ORDER BY tested_at ASC
    `,
    testCode,
  );
}

export async function deleteLabResult(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM lab_results WHERE id = ?', id);
}

// 'food_trial_daily' added 2026-08-14, the structured food-testing
// feature's own lightweight daily during-a-trial prompt (see
// scheduleFoodTrialCheckins). A "nothing to report" tap writes one of
// these directly (neutral valence, no tags); a "something felt off" tap
// instead opens the same real, full picker every other checkinType
// already uses (flare/post_meal/etc.), just pre-linked via foodTrialId --
// deliberately not its own second, lighter form shape, so an escalated
// report gets the exact same real tag/severity/notes detail any other
// reaction would.
export type CheckinType = 'flare' | 'post_meal' | 'post_exercise' | 'general' | 'stress' | 'sleep' | 'food_trial_daily';
export type CheckinValence = 'positive' | 'negative' | 'neutral';

export type WellbeingCheckin = {
  id: string;
  loggedAt: string;
  checkinType: CheckinType;
  valence: CheckinValence;
  severity: number | null;
  notes: string | null;
  foodName: string | null;
  relatedMealId: string | null;
  relatedExerciseId: string | null;
  // Which food trial this check-in belongs to, if any -- 2026-08-14, see
  // wellbeing_checkins' own ALTER TABLE comment (runDatabaseInitialization)
  // for why this rides on the existing table rather than a new one.
  foodTrialId: string | null;
  tags: string[];
  createdAt: string;
};

// Records one moment-in-time report of how the person feels -- tag codes
// come from lib/checkinTags.ts. Positive check-ins are just as valid as
// negative ones; this is deliberately not a "symptom log."
export async function recordCheckin(input: {
  loggedAt: string;
  checkinType: CheckinType;
  valence: CheckinValence;
  severity?: number;
  notes?: string;
  foodName?: string;
  relatedMealId?: string;
  relatedExerciseId?: string;
  foodTrialId?: string;
  tags?: string[];
}) {
  const db = await getDatabase();
  const id = `checkin_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO wellbeing_checkins
        (id, logged_at, checkin_type, valence, severity, notes, food_name, related_meal_id, related_exercise_id, food_trial_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.loggedAt,
    input.checkinType,
    input.valence,
    input.severity ?? null,
    input.notes?.trim() || null,
    input.foodName?.trim() || null,
    input.relatedMealId ?? null,
    input.relatedExerciseId ?? null,
    input.foodTrialId ?? null,
    now,
    now,
  );

  for (const [index, tagCode] of (input.tags ?? []).entries()) {
    await db.runAsync(
      'INSERT INTO checkin_tags (id, checkin_id, tag_code) VALUES (?, ?, ?)',
      `checkin_tag_${Date.now()}_${index}`,
      id,
      tagCode,
    );
  }

  return id;
}

async function attachCheckinTags(
  db: SQLite.SQLiteDatabase,
  checkins: Omit<WellbeingCheckin, 'tags'>[],
): Promise<WellbeingCheckin[]> {
  if (checkins.length === 0) return [];

  const placeholders = checkins.map(() => '?').join(', ');
  const tagRows = await db.getAllAsync<{ checkin_id: string; tag_code: string }>(
    `SELECT checkin_id, tag_code FROM checkin_tags WHERE checkin_id IN (${placeholders})`,
    ...checkins.map((checkin) => checkin.id),
  );

  const tagsByCheckin = new Map<string, string[]>();
  for (const row of tagRows) {
    const existing = tagsByCheckin.get(row.checkin_id) ?? [];
    existing.push(row.tag_code);
    tagsByCheckin.set(row.checkin_id, existing);
  }

  return checkins.map((checkin) => ({ ...checkin, tags: tagsByCheckin.get(checkin.id) ?? [] }));
}

export async function listCheckins(
  filters: { checkinType?: CheckinType; relatedMealId?: string; foodTrialId?: string; limit?: number } = {},
) {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.checkinType) {
    conditions.push('checkin_type = ?');
    params.push(filters.checkinType);
  }
  if (filters.relatedMealId) {
    conditions.push('related_meal_id = ?');
    params.push(filters.relatedMealId);
  }
  // A trial's own connected check-in history, 2026-08-14 -- every daily
  // "nothing to report"/"something felt off" entry logged during its
  // window, read back as one real, ordered record.
  if (filters.foodTrialId) {
    conditions.push('food_trial_id = ?');
    params.push(filters.foodTrialId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;

  const rows = await db.getAllAsync<Omit<WellbeingCheckin, 'tags'>>(
    `
      SELECT id, logged_at AS loggedAt, checkin_type AS checkinType, valence, severity, notes, food_name AS foodName,
             related_meal_id AS relatedMealId, related_exercise_id AS relatedExerciseId, food_trial_id AS foodTrialId,
             created_at AS createdAt
      FROM wellbeing_checkins
      ${whereClause}
      ORDER BY logged_at DESC
      LIMIT ?
    `,
    ...params,
    limit,
  );

  return attachCheckinTags(db, rows);
}

export async function deleteCheckin(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM wellbeing_checkins WHERE id = ?', id);
}

// The one check-in of a given type for a given LOCAL calendar date, if any
// -- 2026-08-08, built for Home's own new "Today's Check-In" widget, which
// needs to know whether today's real answer already exists (to show it
// instead of the picker) without fetching/filtering a whole list client-
// side the way a plain listCheckins() call would require. `logged_at` is a
// real ISO timestamp, not a bare date, so this matches on its date prefix
// rather than equality -- the same "YYYY-MM-DD" local-date convention this
// app already uses everywhere else (see e.g. index.tsx's own
// todayDateString()).
export async function getCheckinForDate(date: string, checkinType: CheckinType): Promise<WellbeingCheckin | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Omit<WellbeingCheckin, 'tags'>>(
    `
      SELECT id, logged_at AS loggedAt, checkin_type AS checkinType, valence, severity, notes, food_name AS foodName,
             related_meal_id AS relatedMealId, related_exercise_id AS relatedExerciseId, food_trial_id AS foodTrialId,
             created_at AS createdAt
      FROM wellbeing_checkins
      WHERE checkin_type = ? AND logged_at LIKE ?
      ORDER BY logged_at DESC
      LIMIT 1
    `,
    checkinType,
    `${date}%`,
  );
  if (!row) return null;
  const [withTags] = await attachCheckinTags(db, [row]);
  return withTags;
}

export type ExerciseLog = {
  id: string;
  loggedAt: string;
  exerciseType: string;
  durationMinutes: number | null;
  intensity: string | null;
  // Only meaningful for step-based activities (walking, running, hiking);
  // null for anything else (weightlifting, yoga, ...). Feeds
  // lib/stepMath.ts's distance/calorie estimate when present.
  stepCount: number | null;
  notes: string | null;
  createdAt: string;
};

export async function recordExercise(input: {
  loggedAt: string;
  exerciseType: string;
  durationMinutes?: number;
  intensity?: 'light' | 'moderate' | 'vigorous';
  stepCount?: number;
  notes?: string;
}) {
  const db = await getDatabase();
  const id = `exercise_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO exercise_logs (id, logged_at, exercise_type, duration_minutes, intensity, step_count, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.loggedAt,
    input.exerciseType.trim(),
    input.durationMinutes ?? null,
    input.intensity ?? null,
    input.stepCount ?? null,
    input.notes?.trim() || null,
    now,
  );

  return id;
}

export async function listExerciseLogs(limit = 50) {
  const db = await getDatabase();
  return db.getAllAsync<ExerciseLog>(
    `
      SELECT id, logged_at AS loggedAt, exercise_type AS exerciseType, duration_minutes AS durationMinutes,
             intensity, step_count AS stepCount, notes, created_at AS createdAt
      FROM exercise_logs
      ORDER BY logged_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export async function deleteExerciseLog(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exercise_logs WHERE id = ?', id);
}

export type BodyMeasurementType = 'weight' | 'waist' | 'hips' | 'chest' | 'neck' | 'body_fat_pct';

export type BodyMeasurementRecord = {
  id: string;
  loggedAt: string;
  measurementType: string;
  value: number;
  unit: string;
  notes: string | null;
  createdAt: string;
};

// One row per reading -- weight and any tape-measure figure the person
// wants to track over time, as a longer-arc progress signal separate from
// day-to-day symptom check-ins.
export async function recordBodyMeasurement(input: {
  loggedAt: string;
  measurementType: BodyMeasurementType | string;
  value: number;
  unit: string;
  notes?: string;
}) {
  const db = await getDatabase();
  const id = `body_measurement_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO body_measurements (id, logged_at, measurement_type, value, unit, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.loggedAt,
    input.measurementType,
    input.value,
    input.unit,
    input.notes?.trim() || null,
    now,
  );

  return id;
}

export async function listBodyMeasurements(measurementType?: string, limit = 100) {
  const db = await getDatabase();
  return db.getAllAsync<BodyMeasurementRecord>(
    `
      SELECT id, logged_at AS loggedAt, measurement_type AS measurementType, value, unit, notes, created_at AS createdAt
      FROM body_measurements
      ${measurementType ? 'WHERE measurement_type = ?' : ''}
      ORDER BY logged_at DESC
      LIMIT ?
    `,
    ...(measurementType ? [measurementType, limit] : [limit]),
  );
}

export async function deleteBodyMeasurement(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM body_measurements WHERE id = ?', id);
}

// One measurement type's full history in chronological order -- the shape
// a progress chart needs, as opposed to listBodyMeasurements'
// most-recent-first feed.
export async function getBodyMeasurementTrend(measurementType: string) {
  const db = await getDatabase();
  return db.getAllAsync<BodyMeasurementRecord>(
    `
      SELECT id, logged_at AS loggedAt, measurement_type AS measurementType, value, unit, notes, created_at AS createdAt
      FROM body_measurements
      WHERE measurement_type = ?
      ORDER BY logged_at ASC
    `,
    measurementType,
  );
}

export type StepCountSource = 'device_sensor' | 'manual';

export type DailyStepCount = {
  date: string;
  stepCount: number;
  source: StepCountSource;
  updatedAt: string;
};

// One row per calendar day -- always an upsert, so a device-sensor
// reading and a later manual correction for the same date simply replace
// each other rather than creating duplicates. date should be an ISO
// 'YYYY-MM-DD' string.
export async function recordStepCount(date: string, stepCount: number, source: StepCountSource) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO daily_step_counts (date, step_count, source, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET step_count = excluded.step_count, source = excluded.source, updated_at = excluded.updated_at
    `,
    date,
    stepCount,
    source,
    now,
  );
}

export async function getStepCountForDate(date: string): Promise<DailyStepCount | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DailyStepCount>(
    'SELECT date, step_count AS stepCount, source, updated_at AS updatedAt FROM daily_step_counts WHERE date = ?',
    date,
  );
}

// Chronological (oldest-first) step-count history -- the shape a trend
// chart needs. `days` caps how many most-recent days to include.
export async function getStepCountTrend(days = 30) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyStepCount>(
    `
      SELECT date, step_count AS stepCount, source, updated_at AS updatedAt
      FROM daily_step_counts
      ORDER BY date DESC
      LIMIT ?
    `,
    days,
  );
  return rows.reverse();
}

// Exercise sessions and body measurements over the same window, so a
// future chart can overlay "what was I doing" against "how did my weight/
// measurements change" without the caller having to stitch two separate
// queries together -- this is the "tie workouts to body measurements over
// time" linkage; both tables already share a plain logged_at date, so no
// new schema was needed for it, just a convenience query.
export async function getExerciseAndMeasurementTimeline(days = 90) {
  const db = await getDatabase();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [exercises, measurements] = await Promise.all([
    db.getAllAsync<ExerciseLog>(
      `
        SELECT id, logged_at AS loggedAt, exercise_type AS exerciseType, duration_minutes AS durationMinutes,
               intensity, step_count AS stepCount, notes, created_at AS createdAt
        FROM exercise_logs
        WHERE logged_at >= ?
        ORDER BY logged_at ASC
      `,
      since,
    ),
    db.getAllAsync<BodyMeasurementRecord>(
      `
        SELECT id, logged_at AS loggedAt, measurement_type AS measurementType, value, unit, notes, created_at AS createdAt
        FROM body_measurements
        WHERE logged_at >= ?
        ORDER BY logged_at ASC
      `,
      since,
    ),
  ]);

  return { exercises, measurements };
}

// 'waiting' -- 2026-08-14, direct feedback: "the 3 day trial can't start
// until they have scheduled the meal that will contain the trial food."
// Only ever the INITIAL status for a trial with a real foodId/source (see
// createFoodTrial's own comment) -- a free-text-only trial has no way to
// auto-detect "was this logged," so it still starts 'trialing' immediately,
// unchanged. A 'waiting' trial carries no active reminders at all until
// activateWaitingTrialsForComponents (below) finds it genuinely scheduled
// or logged, or the person taps a real, explicit "Start now" override
// (reopenFoodTrial, reused verbatim -- see its own comment).
export type FoodTrialStatus = 'waiting' | 'trialing' | 'cleared' | 'flagged';

export type FoodTrialRecord = {
  id: string;
  foodName: string;
  startedAt: string;
  observationDays: number;
  status: FoodTrialStatus;
  resolvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Real reference-database identity, 2026-08-14 -- null for a trial
  // started as free text only (the original flow). See food_trials' own
  // CREATE TABLE comment for why these four ride together.
  foodId: number | null;
  source: string | null;
  prepMethod: string | null;
  conditionCode: string | null;
  // 2026-08-14, see activateWaitingTrialsForComponents' own comment --
  // which real schedule occurrence and/or meal actually proves this food
  // got eaten. Both null until a trial genuinely activates; activatedByMealId
  // specifically is what Past Meals' own reconciliation step (Part 5)
  // matches against.
  activatedByScheduleItemId: string | null;
  activatedByMealId: string | null;
};

// A new food being watched over time rather than a single moment-in-time
// report -- see food_trials' own table comment above for why this is a
// separate table from wellbeing_checkins. observationDays is just a
// default suggestion for when the person can reasonably call it "probably
// fine"; resolveFoodTrial can be called earlier (an immediate reaction) or
// later (nothing to review yet) -- the app never forces a verdict on a
// schedule the person didn't choose. foodId/source/prepMethod/
// conditionCode are all optional -- a trial can still be a plain free-text
// name with no real link to a reference-database row.
//
// 2026-08-14 -- the real INITIAL status now depends on whether this trial
// has a real foodId/source: with one, it starts 'waiting' (see
// FoodTrialStatus's own comment -- no reminders scheduled here, the
// caller must not call scheduleFoodTrialCheckins for a 'waiting' result);
// without one (free text only), it starts 'trialing' exactly as before,
// since there's no real food to later detect in a scheduled/logged meal.
export async function createFoodTrial(input: {
  foodName: string;
  startedAt: string;
  observationDays?: number;
  notes?: string;
  foodId?: number | null;
  source?: string | null;
  prepMethod?: string | null;
  conditionCode?: string | null;
}): Promise<{ id: string; status: FoodTrialStatus }> {
  const db = await getDatabase();
  const id = `food_trial_${Date.now()}`;
  const now = new Date().toISOString();
  const status: FoodTrialStatus = input.foodId != null && input.source ? 'waiting' : 'trialing';

  await db.runAsync(
    `
      INSERT INTO food_trials
        (id, food_name, started_at, observation_days, status, notes, food_id, source, prep_method, condition_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.foodName.trim(),
    input.startedAt,
    input.observationDays ?? 3,
    status,
    input.notes?.trim() || null,
    input.foodId ?? null,
    input.source ?? null,
    input.prepMethod ?? null,
    input.conditionCode ?? null,
    now,
    now,
  );

  return { id, status };
}

export async function listFoodTrials(limit = 100): Promise<FoodTrialRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<FoodTrialRecord>(
    `
      SELECT id, food_name AS foodName, started_at AS startedAt, observation_days AS observationDays,
             status, resolved_at AS resolvedAt, notes, food_id AS foodId, source, prep_method AS prepMethod,
             condition_code AS conditionCode, activated_by_schedule_item_id AS activatedByScheduleItemId,
             activated_by_meal_id AS activatedByMealId, created_at AS createdAt, updated_at AS updatedAt
      FROM food_trials
      ORDER BY started_at DESC
      LIMIT ?
    `,
    limit,
  );
}

// Every past trial for one exact real food, regardless of prep state
// tested or which condition prompted it -- the real per-food "journal"
// this is meant to build toward: "tested 3x -- 2 raw (1 reaction, 1
// cleared), 1 cooked (cleared)." Deliberately not filtered by status, so a
// still-open trial shows up alongside resolved ones. This is seed data for
// a future personal-rule builder, not that builder itself -- no
// auto-suggestion logic here, just the real, connected history.
export async function getFoodTrialHistory(foodId: number, source: string): Promise<FoodTrialRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<FoodTrialRecord>(
    `
      SELECT id, food_name AS foodName, started_at AS startedAt, observation_days AS observationDays,
             status, resolved_at AS resolvedAt, notes, food_id AS foodId, source, prep_method AS prepMethod,
             condition_code AS conditionCode, activated_by_schedule_item_id AS activatedByScheduleItemId,
             activated_by_meal_id AS activatedByMealId, created_at AS createdAt, updated_at AS updatedAt
      FROM food_trials
      WHERE food_id = ? AND source = ?
      ORDER BY started_at DESC
    `,
    foodId,
    source,
  );
}

export async function resolveFoodTrial(id: string, status: 'cleared' | 'flagged', notes?: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE food_trials SET status = ?, resolved_at = ?, notes = COALESCE(?, notes), updated_at = ? WHERE id = ?`,
    status,
    now,
    notes?.trim() || null,
    now,
    id,
  );

  // The window is genuinely over now, either way -- a deliberate, explicit
  // choice by the person, not something the daily reminder logic itself
  // ever does automatically (see scheduleFoodTrialCheckins' own comment:
  // a mid-window reaction report does NOT stop the reminders on its own,
  // exactly so a delayed second reaction still gets caught -- but an
  // explicit "I'm calling this done" here genuinely should).
  await cancelFoodTrialCheckins(id);
}

// Puts a resolved trial back into 'trialing' -- e.g. a symptom shows up a
// few days after clearing a food, and the person wants to reopen it rather
// than start an entirely new trial record. Also true for a food marked
// "already tested" during the onboarding-review flow (markConcernAlready
// Tested, below) -- "not sure anymore" should genuinely restart real
// observation, not just flip a status column.
//
// 2026-08-14 -- this used to ONLY flip the status/clear resolved_at, with
// no real reminders ever rescheduled, a real gap that predates this
// session's own extensions to food_trials. Fixed here: a real, fresh daily-
// reminder series is scheduled for the trial's own already-stored
// observationDays window (not asked again -- "the same trial, continued"),
// matching the "a test always runs its full window" decision already made
// for the original testing loop. cancelFoodTrialCheckins is called first
// as a defensive no-op -- a resolved trial's own reminders should already
// be gone (resolveFoodTrial already cancels them), but this guards against
// any real edge case where they weren't.
export async function reopenFoodTrial(id: string) {
  const db = await getDatabase();
  const trial = await db.getFirstAsync<{ food_name: string; observation_days: number }>(
    'SELECT food_name, observation_days FROM food_trials WHERE id = ?',
    id,
  );
  if (!trial) return;

  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE food_trials SET status = 'trialing', resolved_at = NULL, updated_at = ? WHERE id = ?`,
    now,
    id,
  );

  await cancelFoodTrialCheckins(id);
  await scheduleFoodTrialCheckins({
    foodTrialId: id,
    foodName: trial.food_name,
    firstScheduledFor: `${todayDateStringLocal()}T20:00`,
    observationDays: trial.observation_days,
  });
}

// Part 5 of Past Meals, 2026-08-14 -- "This never actually happened, put
// it back to waiting." A real, deliberate mirror of createFoodTrial's own
// original 'waiting' shape: status reverts, both real "which meal/schedule
// item proves this happened" links clear (the meal that was supposed to
// prove it no longer does), and the now-wrong reminder series stops. Does
// NOT touch started_at (that column is NOT NULL, and a 'waiting' trial's
// own UI already never shows it -- see log.tsx's own dedicated 'waiting'
// branch).
export async function revertFoodTrialToWaiting(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE food_trials SET status = 'waiting', activated_by_meal_id = NULL, activated_by_schedule_item_id = NULL, updated_at = ? WHERE id = ?`,
    now,
    id,
  );
  await cancelFoodTrialCheckins(id);
}

// Part 5 of Past Meals, 2026-08-14 -- "I ate it, just a different day/time
// -- let me fix the date." Mirrors reopenFoodTrial's own already-proven
// cancel-then-reschedule pattern exactly, just anchored to a real, chosen
// date instead of always "today."
export async function correctFoodTrialStartDate(id: string, newStartedAt: string): Promise<void> {
  const db = await getDatabase();
  const trial = await db.getFirstAsync<{ food_name: string; observation_days: number }>(
    'SELECT food_name, observation_days FROM food_trials WHERE id = ?',
    id,
  );
  if (!trial) return;

  const now = new Date().toISOString();
  await db.runAsync(`UPDATE food_trials SET started_at = ?, updated_at = ? WHERE id = ?`, newStartedAt, now, id);

  await cancelFoodTrialCheckins(id);
  await scheduleFoodTrialCheckins({
    foodTrialId: id,
    foodName: trial.food_name,
    firstScheduledFor: `${newStartedAt.slice(0, 10)}T20:00`,
    observationDays: trial.observation_days,
  });
}

export type TrialNeedingReconciliation = {
  trial: FoodTrialRecord;
  foodName: string;
};

// The real "did this edit drop a trial's own food out entirely" check --
// 2026-08-14, Part 5 of Past Meals. Compares a meal's real OLD components
// (as loaded before the edit) against the NEW set actually being saved;
// for any real food that was present with a genuine share before but is
// now either removed entirely or reduced to 0%, checks whether a real
// trial (activated_by_meal_id = mealId, still 'trialing') is riding on it
// -- if so, it needs a real, human decision (revertFoodTrialToWaiting or
// correctFoodTrialStartDate, both just above), since the meal that was
// supposed to prove it happened no longer says it did. A food whose share
// merely changed (more or less, but still above 0) is left alone -- it
// genuinely was eaten, on schedule, so the trial's own timing stays
// correct.
export async function findTrialsAffectedByMealEdit(
  mealId: string,
  oldComponents: MealComponentSelection[],
  newComponents: MealComponentSelection[],
): Promise<TrialNeedingReconciliation[]> {
  const newShareByKey = new Map<string, number>();
  for (const component of newComponents) {
    newShareByKey.set(`${component.componentType}:${component.componentId}`, component.yourSharePercent);
  }

  const affected: TrialNeedingReconciliation[] = [];
  for (const component of oldComponents) {
    const key = `${component.componentType}:${component.componentId}`;
    const newShare = newShareByKey.get(key);
    if (newShare != null && newShare > 0) continue;

    const ingredients = await getComponentIngredients(component.componentType, component.componentId);
    for (const ingredient of ingredients) {
      if (!ingredient.foodId) continue;
      const [foodIdStr, source] = ingredient.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;

      const trials = await getFoodTrialHistory(foodId, source);
      const affectedTrial = trials.find((trial) => trial.status === 'trialing' && trial.activatedByMealId === mealId);
      if (affectedTrial) {
        affected.push({ trial: affectedTrial, foodName: ingredient.foodName });
      }
    }
  }
  return affected;
}

// The onboarding-review path -- 2026-08-14, real per-condition "have you
// already tried this?" (see lib/conditionFoodConcerns.ts's own top comment
// for the full context). Creates a real food_trials row exactly the same
// way the live testing loop does (createFoodTrial), then immediately
// resolves it -- but deliberately never calls scheduleFoodTrialCheckins:
// there's no real observation window needed for something already known
// from real, established experience, only for something genuinely new.
// The result is indistinguishable from a trial resolved through the real
// loop (same table, same status values, same reopenFoodTrial path back
// into active testing) -- this is a real shortcut into the SAME data, not
// a second, parallel concept.
export async function markConcernAlreadyTested(
  concernLabel: string,
  conditionCode: string,
  outcome: 'cleared' | 'flagged',
): Promise<string> {
  // A concern is deliberately free-text only (see lib/conditionFoodConcerns.ts's
  // own comment -- several are real food GROUPS, not one reference-database
  // row), so createFoodTrial always returns it 'trialing', immediately
  // resolved below -- 'waiting' never applies here.
  const { id } = await createFoodTrial({
    foodName: concernLabel,
    startedAt: `${todayDateStringLocal()}T${new Date().toTimeString().slice(0, 5)}`,
    conditionCode,
  });
  await resolveFoodTrial(id, outcome);
  return id;
}

// Every real trial (any status) tagged to one condition -- the onboarding-
// review screen's own real "has this concern already been reviewed" check,
// matched client-side against each concern's own label (a small, bounded
// list per condition by design -- see lib/conditionFoodConcerns.ts -- so no
// per-concern round trip is needed).
export async function getFoodTrialsForCondition(conditionCode: string): Promise<FoodTrialRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<FoodTrialRecord>(
    `
      SELECT id, food_name AS foodName, started_at AS startedAt, observation_days AS observationDays,
             status, resolved_at AS resolvedAt, notes, food_id AS foodId, source, prep_method AS prepMethod,
             condition_code AS conditionCode, activated_by_schedule_item_id AS activatedByScheduleItemId,
             activated_by_meal_id AS activatedByMealId, created_at AS createdAt, updated_at AS updatedAt
      FROM food_trials
      WHERE condition_code = ?
      ORDER BY started_at DESC
    `,
    conditionCode,
  );
}

export async function deleteFoodTrial(id: string) {
  await cancelFoodTrialCheckins(id);
  const db = await getDatabase();
  await db.runAsync('DELETE FROM food_trials WHERE id = ?', id);
}

export type SymptomAssessmentRecord = {
  id: string;
  completedAt: string;
  notes: string | null;
  createdAt: string;
};

export type SymptomAssessmentResponseRecord = {
  id: string;
  assessmentId: string;
  itemCode: string;
  responseValue: number;
};

export async function recordSymptomAssessment(input: {
  completedAt: string;
  notes?: string;
  responses: { itemCode: string; value: number }[];
}) {
  const db = await getDatabase();
  const id = `assessment_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO symptom_assessments (id, completed_at, notes, created_at) VALUES (?, ?, ?, ?)',
    id,
    input.completedAt,
    input.notes?.trim() || null,
    now,
  );

  for (const [index, response] of input.responses.entries()) {
    await db.runAsync(
      'INSERT INTO symptom_assessment_responses (id, assessment_id, item_code, response_value) VALUES (?, ?, ?, ?)',
      `assessment_response_${Date.now()}_${index}`,
      id,
      response.itemCode,
      response.value,
    );
  }

  return id;
}

// Most-recent-first, without responses -- use getSymptomAssessmentResponses
// for one assessment's actual answers.
export async function listSymptomAssessments(limit = 50) {
  const db = await getDatabase();
  return db.getAllAsync<SymptomAssessmentRecord>(
    `
      SELECT id, completed_at AS completedAt, notes, created_at AS createdAt
      FROM symptom_assessments
      ORDER BY completed_at DESC
      LIMIT ?
    `,
    limit,
  );
}

export async function getSymptomAssessmentResponses(assessmentId: string) {
  const db = await getDatabase();
  return db.getAllAsync<SymptomAssessmentResponseRecord>(
    `
      SELECT id, assessment_id AS assessmentId, item_code AS itemCode, response_value AS responseValue
      FROM symptom_assessment_responses
      WHERE assessment_id = ?
    `,
    assessmentId,
  );
}

// Chronological (oldest-first) list of every assessment with its
// responses attached -- the shape lib/symptomAssessment.ts's scoring/trend
// functions expect.
export async function getSymptomAssessmentTrend() {
  const db = await getDatabase();
  const assessments = await db.getAllAsync<SymptomAssessmentRecord>(
    'SELECT id, completed_at AS completedAt, notes, created_at AS createdAt FROM symptom_assessments ORDER BY completed_at ASC',
  );

  const withResponses = await Promise.all(
    assessments.map(async (assessment) => ({
      ...assessment,
      responses: await getSymptomAssessmentResponses(assessment.id),
    })),
  );

  return withResponses;
}

export async function deleteSymptomAssessment(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM symptom_assessments WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Home Gardening (Garden tab), 2026-08-13. See the real CREATE TABLE
// comments in initializeDatabase (garden_plots/garden_plantings/
// garden_harvests/garden_task_links) for the full schema reasoning -- this
// section is the real CRUD layer on top of it, plus the real harvest-
// inventory function (listAvailableHarvests) FoodLookup.tsx calls to
// surface "From Your Harvest" as a real ingredient source in every Food
// builder.
// ---------------------------------------------------------------------------

// Space Type -- Phase 2 of the "New Garden Area" wizard (garden.tsx), the
// real structured replacement for the old free-text growingMedium field.
export type GardenSpaceType =
  | 'in_ground'
  | 'raised_bed'
  | 'containers'
  | 'hydroponic'
  | 'tent'
  | 'led_lights'
  | 'temp_humidity_control';

// Sunlight Exposure -- Phase 3, the real structured replacement for the old
// free-text lightSource field. 'airflow' sits alongside the real light-level
// options per the original request's own exact spec, not a mistake left in
// -- kept as given rather than second-guessed.
export type GardenSunlightExposure = 'full_sun' | 'partial_shade' | 'full_shade' | 'indoor_led_timer' | 'airflow';

export type GardenSizeUnit = 'feet' | 'meters';

export type GardenPlot = {
  id: string;
  name: string;
  locationType: 'outdoor' | 'indoor' | 'greenhouse';
  spaceType: GardenSpaceType | null;
  sunlightExposure: GardenSunlightExposure | null;
  length: number | null;
  width: number | null;
  sizeUnit: GardenSizeUnit | null;
  // A real, per-AREA hardiness zone -- deliberately separate from the
  // single, whole-person user_profile.growing_zone (lib's My Zone feature),
  // since a real person can have more than one garden area in genuinely
  // different physical locations (an outdoor plot at home, a container
  // garden somewhere else). New-area creation pre-fills these three from
  // the profile's own already-saved zone/country/postal code as a real
  // convenience default (see garden.tsx's own handleShowAddPlot), editable
  // per area via the exact same lib/gardenZoneLookup.ts lookup My Zone
  // itself already uses -- one real lookup mechanism, two real places it
  // writes to.
  zone: string | null;
  zoneCountry: string | null;
  zonePostalCode: string | null;
  growingMedium: string | null;
  lightSource: string | null;
  sizeDescription: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const GARDEN_PLOT_COLUMNS = `
  id, name, location_type AS locationType, space_type AS spaceType, sunlight_exposure AS sunlightExposure,
  length, width, size_unit AS sizeUnit, zone, zone_country AS zoneCountry, zone_postal_code AS zonePostalCode,
  growing_medium AS growingMedium, light_source AS lightSource, size_description AS sizeDescription, notes,
  archived_at AS archivedAt, created_at AS createdAt, updated_at AS updatedAt
`;

export async function createGardenPlot(input: {
  name: string;
  locationType: 'outdoor' | 'indoor' | 'greenhouse';
  spaceType?: GardenSpaceType | null;
  sunlightExposure?: GardenSunlightExposure | null;
  length?: number | null;
  width?: number | null;
  sizeUnit?: GardenSizeUnit | null;
  zone?: string | null;
  zoneCountry?: string | null;
  zonePostalCode?: string | null;
  growingMedium?: string | null;
  lightSource?: string | null;
  sizeDescription?: string | null;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `garden_plot_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO garden_plots (
        id, name, location_type, space_type, sunlight_exposure, length, width, size_unit,
        zone, zone_country, zone_postal_code, growing_medium, light_source, size_description, notes,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.locationType,
    input.spaceType ?? null,
    input.sunlightExposure ?? null,
    input.length ?? null,
    input.width ?? null,
    input.sizeUnit ?? null,
    input.zone ?? null,
    input.zoneCountry ?? null,
    input.zonePostalCode ?? null,
    input.growingMedium?.trim() || null,
    input.lightSource?.trim() || null,
    input.sizeDescription?.trim() || null,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

// Active plots first (most recently updated first within that group), then
// archived ones -- an archived plot isn't deleted (its own real plantings/
// harvests stay intact and browsable), just moved out of the way of "what
// am I actively growing right now."
export async function listGardenPlots(includeArchived = false): Promise<GardenPlot[]> {
  const db = await getDatabase();
  return db.getAllAsync<GardenPlot>(
    `
      SELECT ${GARDEN_PLOT_COLUMNS}
      FROM garden_plots
      ${includeArchived ? '' : 'WHERE archived_at IS NULL'}
      ORDER BY (archived_at IS NOT NULL), updated_at DESC
    `,
  );
}

export async function getGardenPlot(id: string): Promise<GardenPlot | null> {
  const db = await getDatabase();
  return db.getFirstAsync<GardenPlot>(`SELECT ${GARDEN_PLOT_COLUMNS} FROM garden_plots WHERE id = ?`, id);
}

export async function updateGardenPlot(
  id: string,
  update: Partial<{
    name: string;
    locationType: 'outdoor' | 'indoor' | 'greenhouse';
    spaceType: GardenSpaceType | null;
    sunlightExposure: GardenSunlightExposure | null;
    length: number | null;
    width: number | null;
    sizeUnit: GardenSizeUnit | null;
    zone: string | null;
    zoneCountry: string | null;
    zonePostalCode: string | null;
    growingMedium: string | null;
    lightSource: string | null;
    sizeDescription: string | null;
    notes: string | null;
  }>,
): Promise<void> {
  const db = await getDatabase();
  const current = await getGardenPlot(id);
  if (!current) return;
  const merged = { ...current, ...update };
  const now = new Date().toISOString();
  await db.runAsync(
    `
      UPDATE garden_plots
      SET name = ?, location_type = ?, space_type = ?, sunlight_exposure = ?, length = ?, width = ?, size_unit = ?,
          zone = ?, zone_country = ?, zone_postal_code = ?, growing_medium = ?, light_source = ?, size_description = ?,
          notes = ?, updated_at = ?
      WHERE id = ?
    `,
    merged.name.trim(),
    merged.locationType,
    merged.spaceType,
    merged.sunlightExposure,
    merged.length,
    merged.width,
    merged.sizeUnit,
    merged.zone,
    merged.zoneCountry,
    merged.zonePostalCode,
    merged.growingMedium,
    merged.lightSource,
    merged.sizeDescription,
    merged.notes,
    now,
    id,
  );
}

export async function archiveGardenPlot(id: string, archived: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE garden_plots SET archived_at = ?, updated_at = ? WHERE id = ?', archived ? now : null, now, id);
}

// Hard delete -- real, deliberate cascade: every real planting in this plot
// (and every harvest tied to either the plot or one of its plantings) goes
// with it, per the FOREIGN KEY ... ON DELETE CASCADE/SET NULL already on
// those tables. Archiving (above) is the safer, non-destructive default;
// this is for a plot that was genuinely created by mistake.
export async function deleteGardenPlot(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_plots WHERE id = ?', id);
}

export type GardenPlanting = {
  id: string;
  plotId: string;
  foodId: number;
  source: string;
  foodName: string;
  varietyNote: string | null;
  plantedAt: string;
  expectedHarvestStart: string | null;
  expectedHarvestEnd: string | null;
  status: 'growing' | 'harvested' | 'failed' | 'removed';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const GARDEN_PLANTING_COLUMNS = `
  id, plot_id AS plotId, food_id AS foodId, source, food_name AS foodName, variety_note AS varietyNote,
  planted_at AS plantedAt, expected_harvest_start AS expectedHarvestStart, expected_harvest_end AS expectedHarvestEnd,
  status, notes, created_at AS createdAt, updated_at AS updatedAt
`;

export async function createGardenPlanting(input: {
  plotId: string;
  foodId: number;
  source: string;
  foodName: string;
  varietyNote?: string | null;
  plantedAt: string;
  expectedHarvestStart?: string | null;
  expectedHarvestEnd?: string | null;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `garden_planting_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO garden_plantings
        (id, plot_id, food_id, source, food_name, variety_note, planted_at, expected_harvest_start, expected_harvest_end,
         status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'growing', ?, ?, ?)
    `,
    id,
    input.plotId,
    input.foodId,
    input.source,
    input.foodName,
    input.varietyNote?.trim() || null,
    input.plantedAt,
    input.expectedHarvestStart ?? null,
    input.expectedHarvestEnd ?? null,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

// Every planting across every plot when plotId is omitted (the Garden tab's
// own "Plots & Plantings" lens uses this for a real, combined "what's
// growing right now" view); scoped to one plot when given.
export async function listGardenPlantings(plotId?: string): Promise<GardenPlanting[]> {
  const db = await getDatabase();
  if (plotId) {
    return db.getAllAsync<GardenPlanting>(
      `SELECT ${GARDEN_PLANTING_COLUMNS} FROM garden_plantings WHERE plot_id = ? ORDER BY planted_at DESC`,
      plotId,
    );
  }
  return db.getAllAsync<GardenPlanting>(`SELECT ${GARDEN_PLANTING_COLUMNS} FROM garden_plantings ORDER BY planted_at DESC`);
}

export async function getGardenPlanting(id: string): Promise<GardenPlanting | null> {
  const db = await getDatabase();
  return db.getFirstAsync<GardenPlanting>(`SELECT ${GARDEN_PLANTING_COLUMNS} FROM garden_plantings WHERE id = ?`, id);
}

export async function updateGardenPlanting(
  id: string,
  update: Partial<{
    varietyNote: string | null;
    plantedAt: string;
    expectedHarvestStart: string | null;
    expectedHarvestEnd: string | null;
    status: 'growing' | 'harvested' | 'failed' | 'removed';
    notes: string | null;
  }>,
): Promise<void> {
  const db = await getDatabase();
  const current = await getGardenPlanting(id);
  if (!current) return;
  const merged = { ...current, ...update };
  const now = new Date().toISOString();
  await db.runAsync(
    `
      UPDATE garden_plantings
      SET variety_note = ?, planted_at = ?, expected_harvest_start = ?, expected_harvest_end = ?, status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    merged.varietyNote,
    merged.plantedAt,
    merged.expectedHarvestStart,
    merged.expectedHarvestEnd,
    merged.status,
    merged.notes,
    now,
    id,
  );
}

export async function deleteGardenPlanting(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_plantings WHERE id = ?', id);
}

export type GardenHarvest = {
  id: string;
  plantingId: string | null;
  plotId: string | null;
  foodId: number;
  source: string;
  foodName: string;
  harvestedAt: string;
  quantity: number;
  unit: string;
  quantityRemaining: number;
  notes: string | null;
  createdAt: string;
};

const GARDEN_HARVEST_COLUMNS = `
  id, planting_id AS plantingId, plot_id AS plotId, food_id AS foodId, source, food_name AS foodName,
  harvested_at AS harvestedAt, quantity, unit, quantity_remaining AS quantityRemaining, notes, created_at AS createdAt
`;

// quantity_remaining always starts equal to quantity -- see the real,
// authoritative-single-number reasoning on the CREATE TABLE comment above.
export async function recordGardenHarvest(input: {
  plantingId?: string | null;
  plotId?: string | null;
  foodId: number;
  source: string;
  foodName: string;
  harvestedAt: string;
  quantity: number;
  unit: string;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `garden_harvest_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO garden_harvests
        (id, planting_id, plot_id, food_id, source, food_name, harvested_at, quantity, unit, quantity_remaining, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.plantingId ?? null,
    input.plotId ?? null,
    input.foodId,
    input.source,
    input.foodName,
    input.harvestedAt,
    input.quantity,
    input.unit,
    input.quantity,
    input.notes?.trim() || null,
    now,
  );
  return id;
}

export async function listGardenHarvests(limit = 50): Promise<GardenHarvest[]> {
  const db = await getDatabase();
  return db.getAllAsync<GardenHarvest>(
    `SELECT ${GARDEN_HARVEST_COLUMNS} FROM garden_harvests ORDER BY harvested_at DESC LIMIT ?`,
    limit,
  );
}

// The real function FoodLookup.tsx calls to build its own "From Your
// Harvest" quick-pick section -- every real harvest still carrying real,
// unused inventory (quantity_remaining > 0), most recently harvested first.
// Deliberately no limit -- a person's own real harvest shelf is never going
// to be large enough to need pagination the way the 26,749-food reference
// database does.
export async function listAvailableHarvests(): Promise<GardenHarvest[]> {
  const db = await getDatabase();
  return db.getAllAsync<GardenHarvest>(
    `SELECT ${GARDEN_HARVEST_COLUMNS} FROM garden_harvests WHERE quantity_remaining > 0 ORDER BY harvested_at DESC`,
  );
}

// Draws down a harvest's own remaining inventory by amountUsed (in the
// harvest's own stored unit -- see FoodLookup's own "From Your Harvest"
// picker for how a builder's ingredient quantity gets translated into this
// same unit before calling this) -- called every time a Food builder
// actually consumes some of a real harvest. Clamped at 0, never negative,
// regardless of what amountUsed claims -- a real, defensive floor rather
// than trusting every caller to have already done that math correctly.
export async function recordHarvestUsage(harvestId: string, amountUsed: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE garden_harvests SET quantity_remaining = MAX(0, quantity_remaining - ?) WHERE id = ?',
    amountUsed,
    harvestId,
  );
}

export async function deleteGardenHarvest(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM garden_harvests WHERE id = ?', id);
}

// A real, basic Scheduler tie-in -- creates a genuine schedule_items row
// (item_type='garden', reusing the exact same repeat/rolling-window
// machinery every meal/supplement/prescription/appointment series already
// uses, see insertScheduleSeries) plus a garden_task_links row so it can be
// traced back to the real plot/planting it's actually about. Only the
// FIRST occurrence of a repeating series gets a direct link row -- a real,
// honest Phase-1 scope limit, not an oversight: linking every future
// occurrence individually would mean re-running this same insert on every
// ensureScheduleSeriesGenerated top-up, which that function doesn't yet do
// for any item_type.
//
// This creates a real, queryable row -- listGardenScheduleItems (below)
// reads it straight back for the Garden tab's own "Upcoming Tasks" list.
// A dedicated lens INSIDE the Schedules tab for browsing/managing these
// from that side is a real, named Phase 2 item, not built yet -- every
// existing Schedule lens (Meals/Supplements/Prescriptions/Appointments)
// queries its own item_type explicitly rather than rendering any
// item_type generically, so a 'garden' row doesn't show up there on its
// own yet.
export async function scheduleGardenTask(input: {
  title: string;
  scheduledFor: string;
  notes?: string;
  plotId?: string | null;
  plantingId?: string | null;
  repeat?: RepeatConfig;
}): Promise<string> {
  const id = await insertScheduleSeries({
    itemType: 'garden',
    mealType: null,
    title: input.title,
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    repeat: input.repeat ?? { type: 'none' },
  });

  if (input.plotId || input.plantingId) {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO garden_task_links (schedule_item_id, plot_id, planting_id) VALUES (?, ?, ?)',
      id,
      input.plotId ?? null,
      input.plantingId ?? null,
    );
  }

  return id;
}

// A real, daily-repeating reminder series for the length of a food trial's
// own observation window (2026-08-14, the structured food-testing
// feature) -- reuses the exact same repeat/rolling-window machinery as
// scheduleGardenTask just above, `type: 'daily', endType: 'count'` capping
// it at exactly observationDays real occurrences, one per day of the
// window. Each occurrence is meant to open a lightweight "how did today go
// with [food]?" prompt (see log.tsx's own FoodTrialCheckinPrompt) rather
// than a full symptom form every time -- escalating to the real, full
// picker only happens on the person's own "something felt off" tap, not
// automatically. Deliberately does NOT stop or shorten the series if a
// mid-window reaction gets logged -- per the confirmed design, a trial
// always runs its full window by default, specifically so a delayed
// second reaction still gets caught; only an explicit resolveFoodTrial
// call (a person's own deliberate "I'm calling this done") cancels the
// remaining reminders, via cancelFoodTrialCheckins below.
export async function scheduleFoodTrialCheckins(input: {
  foodTrialId: string;
  foodName: string;
  firstScheduledFor: string;
  observationDays: number;
}): Promise<string> {
  const id = await insertScheduleSeries({
    itemType: 'foodTest',
    mealType: null,
    title: `How did today go with ${input.foodName}?`,
    scheduledFor: input.firstScheduledFor,
    repeat: { type: 'daily', endType: 'count', count: Math.max(1, input.observationDays) },
  });

  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO food_trial_task_links (schedule_item_id, food_trial_id) VALUES (?, ?)',
    id,
    input.foodTrialId,
  );

  return id;
}

// Cancels a trial's own remaining, not-yet-happened daily check-in
// reminders -- called from resolveFoodTrial/deleteFoodTrial, both real,
// deliberate "this is done" moments, never from a mid-window reaction
// report on its own (see scheduleFoodTrialCheckins' own comment for why).
// Reopening a resolved trial (reopenFoodTrial) deliberately does NOT
// re-create a new reminder series -- a real, accepted, honest Phase-1
// scope limit rather than silently surprising someone with reminders they
// didn't ask to restart.
async function cancelFoodTrialCheckins(foodTrialId: string): Promise<void> {
  const db = await getDatabase();
  const link = await db.getFirstAsync<{ repeat_group_id: string | null }>(
    `
      SELECT si.repeat_group_id
      FROM food_trial_task_links ftl
      JOIN schedule_items si ON si.id = ftl.schedule_item_id
      WHERE ftl.food_trial_id = ?
    `,
    foodTrialId,
  );
  if (link?.repeat_group_id) {
    await deleteScheduleSeries(link.repeat_group_id);
  }
}

// The Fermentation Tracker, 2026-08-20 -- a real physical jar's own
// progress from the day it's started to the day it's ready to drink,
// distinct from `fermentations` (a saved RECIPE) the same way a garden
// harvest is distinct from a garden planting. See fermentation_batches'
// own CREATE TABLE comment for the full reasoning.
export type FermentationBatchStage = 'primary' | 'carbonating' | 'refrigerated' | 'finished';

export type FermentationBatch = {
  id: string;
  fermentationId: string;
  // Denormalized in from `fermentations` at read time (see
  // listFermentationBatches' own JOIN below) -- the Tracker screen always
  // needs this to render a real batch row, and a plain per-batch lookup
  // would mean an N+1 query for every batch in the list.
  fermentationName: string;
  stage: FermentationBatchStage;
  startedAt: string;
  stageChangedAt: string;
  notes: string | null;
  createdAt: string;
};

const FERMENTATION_BATCH_COLUMNS = `
  b.id, b.fermentation_id AS fermentationId, f.name AS fermentationName, b.stage, b.started_at AS startedAt,
  b.stage_changed_at AS stageChangedAt, b.notes, b.created_at AS createdAt
`;

// Cancels a batch's own currently-scheduled, not-yet-happened reminders --
// the same repeat_group_id lookup-and-delete approach as
// cancelFoodTrialCheckins just above, except a batch can carry more than
// one active series at once (a daily stir/burp reminder plus a separate
// one-time stage-transition prompt), so every link row is walked rather
// than assuming just one.
async function cancelFermentationBatchReminders(fermentationBatchId: string): Promise<void> {
  const db = await getDatabase();
  const links = await db.getAllAsync<{ repeat_group_id: string | null }>(
    `
      SELECT si.repeat_group_id
      FROM fermentation_task_links l
      JOIN schedule_items si ON si.id = l.schedule_item_id
      WHERE l.fermentation_batch_id = ?
    `,
    fermentationBatchId,
  );
  for (const link of links) {
    if (link.repeat_group_id) {
      await deleteScheduleSeries(link.repeat_group_id);
    }
  }
}

// Schedules the real reminder series for whichever stage a batch just
// entered -- called from both startFermentationBatch and
// advanceFermentationBatch below. Deliberately time-based defaults (this
// app has no per-recipe "typical fermentation window" field to key off
// yet): a daily stir/burp reminder for the stage's own typical length,
// plus one separate one-time "ready to move on?" prompt near the end of
// that window. The person confirms every real transition themselves --
// same honest Phase-1 scope limit already established for Garden's own
// task reminders, not sensor-driven.
async function scheduleFermentationStageReminders(
  fermentationBatchId: string,
  fermentationName: string,
  stage: FermentationBatchStage,
): Promise<void> {
  if (stage === 'refrigerated' || stage === 'finished') {
    return;
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  const toDateString = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const reminderTime = '09:00';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const stageDurationDays = stage === 'primary' ? 5 : 3;

  const dailyTitle =
    stage === 'primary' ? `Stir/check your ${fermentationName}` : `Burp/check your ${fermentationName}'s bottle`;
  const dailyId = await insertScheduleSeries({
    itemType: 'fermentation',
    mealType: null,
    title: dailyTitle,
    scheduledFor: `${toDateString(tomorrow)}T${reminderTime}`,
    repeat: { type: 'daily', endType: 'count', count: stageDurationDays },
  });

  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO fermentation_task_links (schedule_item_id, fermentation_batch_id) VALUES (?, ?)',
    dailyId,
    fermentationBatchId,
  );

  const followUpDate = new Date(tomorrow);
  followUpDate.setDate(followUpDate.getDate() + stageDurationDays - 2);
  const followUpTitle =
    stage === 'primary'
      ? `Taste test: is your ${fermentationName} ready to strain and bottle?`
      : `Check carbonation: is your ${fermentationName} ready to move to the fridge?`;
  const followUpId = await insertScheduleSeries({
    itemType: 'fermentation',
    mealType: null,
    title: followUpTitle,
    scheduledFor: `${toDateString(followUpDate)}T${reminderTime}`,
    repeat: { type: 'none' },
  });
  await db.runAsync(
    'INSERT INTO fermentation_task_links (schedule_item_id, fermentation_batch_id) VALUES (?, ?)',
    followUpId,
    fermentationBatchId,
  );
}

// Starts tracking a real jar built from an already-saved fermentation
// recipe (fermentationId) -- the "Track this batch" action on
// FermentationBuilder's own save/detail screen. Schedules the first
// stage's real reminder series immediately.
export async function startFermentationBatch(input: {
  fermentationId: string;
  fermentationName: string;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fermentation_batch_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO fermentation_batches (id, fermentation_id, stage, started_at, stage_changed_at, notes, created_at)
      VALUES (?, ?, 'primary', ?, ?, ?, ?)
    `,
    id,
    input.fermentationId,
    now,
    now,
    input.notes?.trim() || null,
    now,
  );
  await scheduleFermentationStageReminders(id, input.fermentationName, 'primary');
  return id;
}

// A real, one-time "start this on a chosen day" reminder, 2026-08-21 --
// the "schedule for the future" half of the Fermentation Builder's own
// new "Pick a Premade Recipe" menu (see FermentationBuilder.tsx's own
// CURATED_RECIPE_IDS_BY_SUBTYPE comment for the request behind this).
// Deliberately a plain reminder, not an automatic future
// startFermentationBatch call -- the person still needs to actually go
// buy/prep the real ingredients and physically start the batch that day,
// so this schedules the PROMPT to do that, not the batch itself. Reuses
// the same reminder machinery (insertScheduleSeries, item_type
// 'fermentation') every other real fermentation reminder already goes
// through, a single non-repeating occurrence on the chosen date.
export async function scheduleFermentationRecipeReminder(input: { recipeName: string; scheduledFor: string }): Promise<string> {
  return insertScheduleSeries({
    itemType: 'fermentation',
    mealType: null,
    title: `Start fermenting ${input.recipeName}`,
    scheduledFor: input.scheduledFor,
    repeat: { type: 'none' },
  });
}

// Moves a batch to its next real stage -- cancels that stage's remaining
// reminders and schedules the next stage's own series, the same
// cancel-then-reschedule pattern already established elsewhere in this
// file for a series that's genuinely done.
export async function advanceFermentationBatch(input: {
  fermentationBatchId: string;
  fermentationName: string;
  nextStage: FermentationBatchStage;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await cancelFermentationBatchReminders(input.fermentationBatchId);
  await db.runAsync(
    'UPDATE fermentation_batches SET stage = ?, stage_changed_at = ? WHERE id = ?',
    input.nextStage,
    now,
    input.fermentationBatchId,
  );
  await scheduleFermentationStageReminders(input.fermentationBatchId, input.fermentationName, input.nextStage);
}

// Every batch still actively being tracked, most recently started first --
// 'finished' batches drop off this list once their own contents become a
// real fermentation_harvests entry (see recordFermentationHarvest below).
export async function listFermentationBatches(): Promise<FermentationBatch[]> {
  const db = await getDatabase();
  return db.getAllAsync<FermentationBatch>(
    `
      SELECT ${FERMENTATION_BATCH_COLUMNS}
      FROM fermentation_batches b
      JOIN fermentations f ON f.id = b.fermentation_id
      WHERE b.stage != 'finished'
      ORDER BY b.started_at DESC
    `,
  );
}

export async function getFermentationBatch(id: string): Promise<FermentationBatch | null> {
  const db = await getDatabase();
  return db.getFirstAsync<FermentationBatch>(
    `
      SELECT ${FERMENTATION_BATCH_COLUMNS}
      FROM fermentation_batches b
      JOIN fermentations f ON f.id = b.fermentation_id
      WHERE b.id = ?
    `,
    id,
  );
}

export async function deleteFermentationBatch(id: string): Promise<void> {
  await cancelFermentationBatchReminders(id);
  const db = await getDatabase();
  await db.runAsync('DELETE FROM fermentation_batches WHERE id = ?', id);
}

// "My Fermented Drinks" -- mirrors garden_harvests' own
// recordGardenHarvest/listAvailableHarvests/recordHarvestUsage/
// deleteGardenHarvest exactly (see those functions' own comments further
// up for the full reasoning): something made, on hand in a real quantity,
// drawn down as it's actually drunk, until the person tells the app it's
// gone, just like a garden harvest running out.
export type FermentationHarvest = {
  id: string;
  fermentationBatchId: string | null;
  fermentationId: string;
  drinkName: string;
  readyAt: string;
  quantity: number;
  unit: string;
  quantityRemaining: number;
  notes: string | null;
  createdAt: string;
};

const FERMENTATION_HARVEST_COLUMNS = `
  id, fermentation_batch_id AS fermentationBatchId, fermentation_id AS fermentationId, drink_name AS drinkName,
  ready_at AS readyAt, quantity, unit, quantity_remaining AS quantityRemaining, notes, created_at AS createdAt
`;

// quantity_remaining always starts equal to quantity, same
// authoritative-single-number reasoning as recordGardenHarvest. Moving a
// batch to 'refrigerated' is the real moment it becomes drinkable, so
// recording its harvest here also retires the batch itself to 'finished'
// -- the jar stops being something to track once its contents have become
// a real harvest entry instead.
export async function recordFermentationHarvest(input: {
  fermentationBatchId?: string | null;
  fermentationId: string;
  drinkName: string;
  readyAt: string;
  quantity: number;
  unit: string;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fermentation_harvest_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO fermentation_harvests
        (id, fermentation_batch_id, fermentation_id, drink_name, ready_at, quantity, unit, quantity_remaining, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.fermentationBatchId ?? null,
    input.fermentationId,
    input.drinkName,
    input.readyAt,
    input.quantity,
    input.unit,
    input.quantity,
    input.notes?.trim() || null,
    now,
  );

  if (input.fermentationBatchId) {
    await cancelFermentationBatchReminders(input.fermentationBatchId);
    await db.runAsync(
      "UPDATE fermentation_batches SET stage = 'finished', stage_changed_at = ? WHERE id = ?",
      now,
      input.fermentationBatchId,
    );
  }

  return id;
}

export async function listAvailableFermentationHarvests(): Promise<FermentationHarvest[]> {
  const db = await getDatabase();
  return db.getAllAsync<FermentationHarvest>(
    `SELECT ${FERMENTATION_HARVEST_COLUMNS} FROM fermentation_harvests WHERE quantity_remaining > 0 ORDER BY ready_at DESC`,
  );
}

export async function listAllFermentationHarvests(limit = 50): Promise<FermentationHarvest[]> {
  const db = await getDatabase();
  return db.getAllAsync<FermentationHarvest>(
    `SELECT ${FERMENTATION_HARVEST_COLUMNS} FROM fermentation_harvests ORDER BY ready_at DESC LIMIT ?`,
    limit,
  );
}

// Draws down a harvest's own remaining inventory by amountUsed (a real
// "log a glass" action) -- clamped at 0, never negative, the same
// defensive floor as recordHarvestUsage (garden's own equivalent).
export async function recordFermentationHarvestUsage(harvestId: string, amountUsed: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE fermentation_harvests SET quantity_remaining = MAX(0, quantity_remaining - ?) WHERE id = ?',
    amountUsed,
    harvestId,
  );
}

// The plain "mark finished/empty" action -- zeroes out remaining inventory
// directly rather than requiring someone to log glass-by-glass until it
// hits zero naturally, matching "they let the app know when it is gone,"
// the same framing already established for a garden harvest running out.
export async function markFermentationHarvestFinished(harvestId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE fermentation_harvests SET quantity_remaining = 0 WHERE id = ?', harvestId);
}

export async function deleteFermentationHarvest(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM fermentation_harvests WHERE id = ?', id);
}

// Every planned, not-yet-happened real garden task from today onward, most
// imminent first -- the Garden tab's own real "Upcoming Tasks" list.
export async function listUpcomingGardenTasks(limit = 20): Promise<
  (ScheduleItemRecord & { plotId: string | null; plantingId: string | null })[]
> {
  const db = await getDatabase();
  const today = todayDateStringLocal();
  return db.getAllAsync<ScheduleItemRecord & { plotId: string | null; plantingId: string | null }>(
    `
      SELECT ${SCHEDULE_ITEM_COLUMNS}, l.plot_id AS plotId, l.planting_id AS plantingId
      FROM schedule_items s
      LEFT JOIN garden_task_links l ON l.schedule_item_id = s.id
      WHERE s.item_type = 'garden' AND s.status = 'planned' AND substr(s.scheduled_for, 1, 10) >= ?
      ORDER BY s.scheduled_for ASC
      LIMIT ?
    `,
    today,
    limit,
  );
}

// Barcode-scanned products -- "My Processed Foods," 2026-08-16. See
// scanned_products' own CREATE TABLE comment (initializeDatabase, above)
// for the real (foodId, source='Scanned') identity design this whole
// feature is built around.
export type ScannedProductRecord = {
  id: number;
  barcode: string;
  name: string;
  brand: string | null;
  lookupSource: string;
  ingredientsText: string | null;
  photoUri: string | null;
  scannedAt: string;
};

const SCANNED_PRODUCT_COLUMNS = `
  id, barcode, name, brand, lookup_source AS lookupSource, ingredients_text AS ingredientsText,
  photo_uri AS photoUri, scanned_at AS scannedAt
`;

// A real, checked-first lookup before ever hitting the network -- scanning
// the same product twice (a person picking up the same box again next
// week) should reuse what's already saved, not create a duplicate real
// "My Processed Foods" entry or re-fetch data that hasn't changed.
export async function getScannedProductByBarcode(barcode: string): Promise<ScannedProductRecord | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ScannedProductRecord>(
    `SELECT ${SCANNED_PRODUCT_COLUMNS} FROM scanned_products WHERE barcode = ?`,
    barcode,
  );
}

export async function getScannedProduct(id: number): Promise<ScannedProductRecord | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ScannedProductRecord>(`SELECT ${SCANNED_PRODUCT_COLUMNS} FROM scanned_products WHERE id = ?`, id);
}

// Most-recently-scanned first -- matches every other "My Foods"-style list
// in this app (listSides, listFavorites, etc.) and is also what a
// "Recently Scanned" quick-pick actually wants.
export async function listScannedProducts(limit = 100): Promise<ScannedProductRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<ScannedProductRecord>(
    `SELECT ${SCANNED_PRODUCT_COLUMNS} FROM scanned_products ORDER BY scanned_at DESC LIMIT ?`,
    limit,
  );
}

// Real, honest name-search for the "My Processed Foods" category step in
// FoodLookup.tsx -- mirrors searchReferenceFoodNames' own plain substring
// match (no ranking sophistication needed yet at this real, still-small
// scale), scoped to name/brand together since a person is as likely to
// remember "Nutella" as "the hazelnut spread."
export async function searchScannedProducts(query: string, limit = 30): Promise<ScannedProductRecord[]> {
  const trimmed = query.trim();
  const db = await getDatabase();
  if (!trimmed) {
    return db.getAllAsync<ScannedProductRecord>(
      `SELECT ${SCANNED_PRODUCT_COLUMNS} FROM scanned_products ORDER BY name COLLATE NOCASE LIMIT ?`,
      limit,
    );
  }
  return db.getAllAsync<ScannedProductRecord>(
    `SELECT ${SCANNED_PRODUCT_COLUMNS} FROM scanned_products WHERE name LIKE ? OR brand LIKE ? ORDER BY name COLLATE NOCASE LIMIT ?`,
    `%${trimmed}%`,
    `%${trimmed}%`,
    limit,
  );
}

// Creates a real, new scanned product plus its real nutrient panel in one
// transaction -- returns the real, new local id, which becomes this
// product's own foodId everywhere else in the app from this point on.
export async function saveScannedProduct(input: {
  barcode: string;
  name: string;
  brand?: string | null;
  lookupSource: string;
  ingredientsText?: string | null;
  photoUri?: string | null;
  nutrients: { code: string; amountPer100g: number }[];
}): Promise<number> {
  const db = await getDatabase();
  await db.execAsync('BEGIN TRANSACTION');
  try {
    const result = await db.runAsync(
      `
        INSERT INTO scanned_products (barcode, name, brand, lookup_source, ingredients_text, photo_uri)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      input.barcode,
      input.name,
      input.brand ?? null,
      input.lookupSource,
      input.ingredientsText ?? null,
      input.photoUri ?? null,
    );
    const id = result.lastInsertRowId;
    for (const nutrient of input.nutrients) {
      await db.runAsync(
        'INSERT INTO scanned_product_nutrients (scanned_product_id, nutrient_code, amount_per_100g) VALUES (?, ?, ?)',
        id,
        nutrient.code,
        nutrient.amountPer100g,
      );
    }
    await db.execAsync('COMMIT');
    return id;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

// Real, in-place corrections after a fresh look at the label -- a person
// re-scanning the same product later, or manually tidying up the OCR'd
// ingredients text, updates the one real saved row rather than creating a
// second, near-duplicate "My Processed Foods" entry.
export async function updateScannedProduct(
  id: number,
  updates: { name?: string; brand?: string | null; ingredientsText?: string | null; photoUri?: string | null },
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const params: (string | null)[] = [];
  if (updates.name !== undefined) {
    fields.push('name = ?');
    params.push(updates.name);
  }
  if (updates.brand !== undefined) {
    fields.push('brand = ?');
    params.push(updates.brand);
  }
  if (updates.ingredientsText !== undefined) {
    fields.push('ingredients_text = ?');
    params.push(updates.ingredientsText);
  }
  if (updates.photoUri !== undefined) {
    fields.push('photo_uri = ?');
    params.push(updates.photoUri);
  }
  if (fields.length === 0) return;
  await db.runAsync(`UPDATE scanned_products SET ${fields.join(', ')} WHERE id = ?`, ...params, id);
}

// Real cascade delete (scanned_product_nutrients, scanned_product_prices
// both carry ON DELETE CASCADE) -- removing a scanned product cleans up
// its own real nutrient panel and price history in the same step, nothing
// left orphaned.
export async function deleteScannedProduct(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM scanned_products WHERE id = ?', id);
}

// getFoodNutrients' own real branch for source='Scanned' -- deliberately
// NOT one more CASE inside that function's own sibling-fallback SQL,
// since a scanned product has no sibling-source concept at all (exactly
// one real nutrient panel, whatever the barcode lookup reported), and
// scanned_product_nutrients lives in the LOCAL app database while
// nutrients' own display_name/unit/nutrient_group live in the bundled
// reference database -- two separate SQLite connections, so this merges
// the two in JS rather than attempting a cross-database SQL JOIN.
async function getScannedProductNutrients(scannedProductId: number) {
  const localDb = await getDatabase();
  const rows = await localDb.getAllAsync<{ nutrient_code: string; amount_per_100g: number }>(
    'SELECT nutrient_code, amount_per_100g FROM scanned_product_nutrients WHERE scanned_product_id = ?',
    scannedProductId,
  );
  if (rows.length === 0) return [];
  const referenceDb = await getReferenceDatabase();
  const definitions = await referenceDb.getAllAsync<{ code: string; display_name: string; unit: string; nutrient_group: string }>(
    'SELECT code, display_name, unit, nutrient_group FROM nutrients',
  );
  const byCode = new Map(definitions.map((definition) => [definition.code, definition]));
  const results: {
    code: string;
    displayName: string;
    unit: string;
    group: string;
    amountPer100g: number;
    sourceUsed: string;
    isSupplemented: boolean;
  }[] = [];
  for (const row of rows) {
    const definition = byCode.get(row.nutrient_code);
    if (!definition) continue;
    results.push({
      code: row.nutrient_code,
      displayName: definition.display_name,
      unit: definition.unit,
      group: definition.nutrient_group,
      amountPer100g: row.amount_per_100g,
      sourceUsed: 'Scanned',
      isSupplemented: false,
    });
  }
  return results;
}

export type ScannedProductPriceRecord = {
  id: string;
  scannedProductId: number;
  price: number;
  storeName: string | null;
  photoUri: string | null;
  loggedAt: string;
};

// The real "Buy This" action -- always the same real, single combined
// step as saveScannedProduct, per direct decision: deciding to buy IS
// adding it to My Processed Foods, with today's price attached in the
// same motion, not two separate things to remember to do later.
export async function recordScannedProductPrice(input: {
  scannedProductId: number;
  price: number;
  storeName?: string | null;
  photoUri?: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const id = `scanned_price_${Date.now()}`;
  await db.runAsync(
    'INSERT INTO scanned_product_prices (id, scanned_product_id, price, store_name, photo_uri) VALUES (?, ?, ?, ?, ?)',
    id,
    input.scannedProductId,
    input.price,
    input.storeName ?? null,
    input.photoUri ?? null,
  );
}

// Oldest first -- the real, natural reading order for a price-over-time
// trend, matching how TrendLineChart's own real point arrays are already
// expected everywhere else in this app.
export async function getScannedProductPriceHistory(scannedProductId: number): Promise<ScannedProductPriceRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<ScannedProductPriceRecord>(
    `
      SELECT id, scanned_product_id AS scannedProductId, price, store_name AS storeName, photo_uri AS photoUri, logged_at AS loggedAt
      FROM scanned_product_prices
      WHERE scanned_product_id = ?
      ORDER BY logged_at ASC
    `,
    scannedProductId,
  );
}

// Phase 1 of the header growth vine/Timeline plan (2026-08-21) -- the two
// real accessors for achievement_criteria_progress (see that table's own
// CREATE TABLE comment above). The actual list of criteria and the logic
// that decides which ones to check lives in lib/achievementCriteria.ts,
// deliberately kept out of this already-15,000-line file; these two
// functions are just this table's own plain read/write, same shape as
// every other table's accessors here.

// Every criterion ever detected true, keyed for a fast lookup rather than
// a list a caller has to search -- both real callers (the evaluate loop
// below and, eventually, the vine's own render) want "is key X already
// met," not "give me everything."
export async function getAchievedCriteriaKeys(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ criterion_key: string }>('SELECT criterion_key FROM achievement_criteria_progress');
  return new Set(rows.map((row) => row.criterion_key));
}

// INSERT OR IGNORE, not INSERT -- a criterion already met stays met at its
// real first-achieved timestamp forever; re-detecting the same criterion
// true on a later check (which will happen constantly, e.g. someone who's
// already saved a Meal saves another one) must never overwrite that date.
export async function recordAchievementCriterionMet(criterionKey: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO achievement_criteria_progress (criterion_key) VALUES (?)', criterionKey);
}
