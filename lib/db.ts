import * as SQLite from 'expo-sqlite';
import { REFERENCE_DB_VERSION } from './referenceDbVersion';
import { ageFromBirthDate } from './profile';
import { normalizeSupplementAmount } from './supplementUnits';
import { analyzeNutrientIntake, NutrientGapEntry, sumFoodNutrientTotals } from './nutrientAnalysis';
import { convertToGrams, MeasurementUnit, VOLUME_UNITS } from './unitConversion';

const DB_NAME = 'inside_story.db';
const REFERENCE_DB_NAME = 'foods_reference.db';
const REFERENCE_DB_VERSION_KEY = 'reference_db_version';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let referenceDatabasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

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
      const needsImport = versionRow?.value !== REFERENCE_DB_VERSION;

      // expo-sqlite's importDatabaseFromAssetAsync silently no-ops if the
      // target file already exists on-device, so forceOverwrite must be
      // driven explicitly by the version check above -- otherwise a
      // rebuilt bundled database never actually reaches an installed app.
      await SQLite.importDatabaseFromAssetAsync(REFERENCE_DB_NAME, {
        assetId: require('../assets/data/foods_reference.db'),
        forceOverwrite: needsImport,
      });

      if (needsImport) {
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

export async function getReferenceCategories() {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM foods ORDER BY category',
  );
  return rows.map((row) => row.category);
}

// Returns [] for categories with no defined sub-categories (most of them,
// for now) -- the app should skip the drill-down step entirely in that case
// rather than show an empty/pointless dropdown.
export async function getReferenceSubcategories(category: string) {
  const db = await getReferenceDatabase();
  const rows = await db.getAllAsync<{ subcategory: string | null }>(
    'SELECT DISTINCT subcategory FROM foods WHERE category = ? AND subcategory IS NOT NULL ORDER BY subcategory',
    category,
  );
  return rows.map((row) => row.subcategory).filter((value): value is string => value !== null);
}

function buildScopeClause(category: string, subcategory: string | null, usdaOnly: boolean) {
  const params: (string | number)[] = [category];
  let clause = 'category = ?';

  if (subcategory) {
    clause += ' AND subcategory = ?';
    params.push(subcategory);
  }

  if (usdaOnly) {
    clause += " AND source = 'USDA'";
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
export async function searchReferenceFoodNames(category: string, subcategory: string | null, query = '', usdaOnly = true, limit = 200) {
  const db = await getReferenceDatabase();
  const trimmed = query.trim();
  const { clause, params } = buildScopeClause(category, subcategory, usdaOnly);

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
  // for the identical food ("Sweet Pepper", "Heavy Whipping Cream"). See
  // scripts/food_alias_data.py for how each alias was verified real rather
  // than guessed. A fresh buildScopeClause() call here (not the mutated
  // `params` above) keeps this query's params independent of the ORDER BY/
  // LIMIT params already appended to the first query.
  const collapsedQuery = trimmed.replace(/\s+/g, '');
  const aliasScope = buildScopeClause(category, subcategory, usdaOnly);
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

// Real, distinct cooking states available for one chosen food name. Returns
// [] when there's nothing to disambiguate (the common case) -- the app
// should skip the Preparation step entirely in that case, same pattern as
// the Type step being skipped for categories with no sub-categories.
export async function getPreparationMethods(category: string, subcategory: string | null, baseName: string, usdaOnly = true) {
  const db = await getReferenceDatabase();
  const { clause, params } = buildScopeClause(category, subcategory, usdaOnly);

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
  return methods.length > 1 ? methods : [];
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
export async function resolveFoodChoice(category: string, subcategory: string | null, baseName: string, prepMethod: string | null, usdaOnly = true) {
  const db = await getReferenceDatabase();
  const { clause, params } = buildScopeClause(category, subcategory, usdaOnly);
  const normalizedPrep = prepMethod || 'Standard';

  const row = await db.getFirstAsync<{ food_id: number; source: string; name: string; short_name: string | null; category: string }>(
    `
      SELECT food_id, source, name, short_name, category
      FROM foods
      WHERE ${clause} AND base_name = ?
        AND COALESCE(prep_method, 'Standard') = ?
      ORDER BY
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

export async function initializeDatabase() {
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
      -- 'flagged'), not just a single logged observation.
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

      CREATE INDEX IF NOT EXISTS idx_meals_eaten_at ON meals(eaten_at);
      CREATE INDEX IF NOT EXISTS idx_wellbeing_checkins_logged_at ON wellbeing_checkins(logged_at);
      CREATE INDEX IF NOT EXISTS idx_checkin_tags_checkin ON checkin_tags(checkin_id);
      CREATE INDEX IF NOT EXISTS idx_exercise_logs_logged_at ON exercise_logs(logged_at);
      CREATE INDEX IF NOT EXISTS idx_body_measurements_type_logged_at ON body_measurements(measurement_type, logged_at);
      CREATE INDEX IF NOT EXISTS idx_schedule_items_scheduled_for ON schedule_items(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_food_trials_started_at ON food_trials(started_at);
      CREATE INDEX IF NOT EXISTS idx_side_ingredients_side ON side_ingredients(side_id);
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

    const userProfileColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_profile)');
    const hasHeightColumn = userProfileColumns.some((column) => column.name === 'height_cm');

    if (!hasHeightColumn) {
      await db.execAsync('ALTER TABLE user_profile ADD COLUMN height_cm REAL;');
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
    // an appointment that only exists inside this app.
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
  } catch (error) {
    databasePromise = null;
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
export async function saveSide(input: {
  name: string;
  servings: number;
  servingSizeAmount: number;
  servingSizeUnit: string;
  ingredients: SideIngredientInput[];
}) {
  const db = await getDatabase();
  const id = `side_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO sides (id, name, servings, serving_size_amount, serving_size_unit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
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
  },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE sides
      SET name = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.servings,
    input.servingSizeAmount,
    input.servingSizeUnit,
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
};

export async function getSide(sideId: string): Promise<SideDetail | null> {
  const db = await getDatabase();
  return db.getFirstAsync<SideDetail>(
    `
      SELECT id, name, servings, serving_size_amount AS servingSizeAmount, serving_size_unit AS servingSizeUnit,
             created_at AS createdAt
      FROM sides
      WHERE id = ?
    `,
    sideId,
  );
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

// Side-scoped equivalent of getDailySixDimensionsBreakdown -- same shape,
// same reasoning as getSideNutrientBreakdown above (one synthetic meal
// wrapping one synthetic side, both real), reused as-is by
// app/(tabs)/insights.tsx's own SixDsView and PrepView (PrepView reads the
// exact same DailySixDimensionsBreakdown shape, no separate data source of
// its own).
export async function getSideSixDimensionsBreakdown(sideId: string): Promise<DailySixDimensionsBreakdown> {
  const side = await getSide(sideId);
  if (!side) return { day: [], meals: [] };

  const ingredients = await getSideIngredients(sideId);
  const scoreCache = new Map<string, FoodScore[]>();
  const foods: { foodName: string; scores: FoodScore[] }[] = [];

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
    foods.push({ foodName: ingredient.foodName, scores });
  }

  const sideBreakdown: DailyDimensionSideBreakdown = {
    sideName: side.name,
    bySubCriterion: aggregateBySubCriterion(foods),
    items: foods.map((food) => ({ foodName: food.foodName, bySubCriterion: aggregateBySubCriterion([food]) })),
  };
  const mealBreakdown: DailyDimensionMealBreakdown = {
    mealId: side.id,
    mealName: side.name,
    mealType: 'side',
    bySubCriterion: sideBreakdown.bySubCriterion,
    sides: [sideBreakdown],
  };

  return { day: sideBreakdown.bySubCriterion, meals: [mealBreakdown] };
}

// itemType filters to just 'meal' or 'side' favorites; omit it to get both
// mixed together (the original behavior, kept as the default since some
// callers -- like the very first favorites list this app had -- don't care
// about the distinction).
export async function listFavorites(limit = 8, itemType?: 'meal' | 'side') {
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
  itemType: 'meal' | 'supplement' | 'prescription' | 'appointment';
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
}) {
  return insertScheduleSeries({
    itemType: 'meal',
    mealType: input.mealType,
    title: input.title,
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    sourceFavoriteId: input.sourceFavoriteId,
    sourceMealId: input.sourceMealId,
    repeat: input.repeat ?? { type: 'none' },
  });
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

// Connects (or disconnects) this appointment to a real event in the
// phone's own Calendar app -- see lib/deviceCalendar.ts. Purely a link;
// this app never reads back changes made to the event on the device side
// beyond what's stored here.
export async function linkAppointmentToDeviceCalendarEvent(id: string, deviceCalendarEventId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET linked_device_calendar_event_id = ?, updated_at = ? WHERE id = ?`,
    deviceCalendarEventId,
    new Date().toISOString(),
    id,
  );
}

export async function unlinkAppointmentFromDeviceCalendarEvent(id: string): Promise<void> {
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
    usual_breakfast_time: string | null;
    usual_lunch_time: string | null;
    usual_dinner_time: string | null;
    usual_snack_time: string | null;
    fasting_enabled: number | null;
    eating_window_start: string | null;
    eating_window_end: string | null;
  }>(
    `
      SELECT first_name, last_name, sex, birth_date, has_hashimotos, height_cm,
             usual_breakfast_time, usual_lunch_time, usual_dinner_time, usual_snack_time,
             fasting_enabled, eating_window_start, eating_window_end
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
      usualBreakfastTime: null,
      usualLunchTime: null,
      usualDinnerTime: null,
      usualSnackTime: null,
      fastingEnabled: false,
      eatingWindowStart: null,
      eatingWindowEnd: null,
    };
  }

  return {
    firstName: row.first_name,
    lastName: row.last_name,
    sex: row.sex === 'male' || row.sex === 'female' ? row.sex : null,
    birthDate: row.birth_date,
    hasHashimotos: row.has_hashimotos == null ? null : Boolean(row.has_hashimotos),
    heightCm: row.height_cm,
    usualBreakfastTime: row.usual_breakfast_time,
    usualLunchTime: row.usual_lunch_time,
    usualDinnerTime: row.usual_dinner_time,
    usualSnackTime: row.usual_snack_time,
    fastingEnabled: Boolean(row.fasting_enabled),
    eatingWindowStart: row.eating_window_start,
    eatingWindowEnd: row.eating_window_end,
  };
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
          id, first_name, last_name, sex, birth_date, has_hashimotos, height_cm,
          usual_breakfast_time, usual_lunch_time, usual_dinner_time, usual_snack_time,
          fasting_enabled, eating_window_start, eating_window_end, updated_at
        )
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          sex = excluded.sex,
          birth_date = excluded.birth_date,
          has_hashimotos = excluded.has_hashimotos,
          height_cm = excluded.height_cm,
          usual_breakfast_time = excluded.usual_breakfast_time,
          usual_lunch_time = excluded.usual_lunch_time,
          usual_dinner_time = excluded.usual_dinner_time,
          usual_snack_time = excluded.usual_snack_time,
          fasting_enabled = excluded.fasting_enabled,
          eating_window_start = excluded.eating_window_start,
          eating_window_end = excluded.eating_window_end,
          updated_at = excluded.updated_at
      `,
      merged.firstName?.trim() || null,
      merged.lastName?.trim() || null,
      merged.sex,
      merged.birthDate,
      merged.hasHashimotos == null ? null : merged.hasHashimotos ? 1 : 0,
      merged.heightCm,
      merged.usualBreakfastTime,
      merged.usualLunchTime,
      merged.usualDinnerTime,
      merged.usualSnackTime,
      merged.fastingEnabled ? 1 : 0,
      merged.eatingWindowStart,
      merged.eatingWindowEnd,
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
    dose_amount: number | null;
    dose_unit: string | null;
    frequency: string | null;
    units_per_day: number | null;
    serving_unit_label: string | null;
    active: number;
    notes: string | null;
  }>(
    `
      SELECT id, treatment_type, name, dose_amount, dose_unit, frequency, units_per_day, serving_unit_label, active, notes
      FROM treatments
      WHERE treatment_type = 'supplement' ${activeOnly ? 'AND active = 1' : ''}
      ORDER BY name
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    treatmentType: row.treatment_type,
    name: row.name,
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
// supplement does.
export async function createPrescriptionTreatment(input: {
  name: string;
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
        (id, treatment_type, name, dose_amount, dose_unit, frequency, active, notes, created_at, updated_at)
      VALUES (?, 'prescription', ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id,
    input.name.trim(),
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
    dose_amount: number | null;
    dose_unit: string | null;
    frequency: string | null;
    units_per_day: number | null;
    serving_unit_label: string | null;
    active: number;
    notes: string | null;
  }>(
    `
      SELECT id, treatment_type, name, dose_amount, dose_unit, frequency, units_per_day, serving_unit_label, active, notes
      FROM treatments
      WHERE treatment_type = 'prescription' ${activeOnly ? 'AND active = 1' : ''}
      ORDER BY name
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    treatmentType: row.treatment_type,
    name: row.name,
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
  input: { name: string; doseAmount?: number; doseUnit?: string; frequency?: string; notes?: string },
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE treatments
      SET name = ?, dose_amount = ?, dose_unit = ?, frequency = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `,
    input.name.trim(),
    input.doseAmount ?? null,
    input.doseUnit?.trim() || null,
    input.frequency?.trim() || null,
    input.notes?.trim() || null,
    now,
    treatmentId,
  );
}

export type TrackedNutrient = {
  code: string;
  displayName: string;
  unit: string;
  group: string;
};

// Every nutrient this app tracks (the same list the Insights Nutrients
// table and DRI targets are built from) -- what populates the ingredient
// picker when documenting a supplement's per-dose contents.
export async function listTrackedNutrients(): Promise<TrackedNutrient[]> {
  const db = await getReferenceDatabase();
  return db.getAllAsync<TrackedNutrient>(
    `
      SELECT code, display_name AS displayName, unit, nutrient_group AS "group"
      FROM nutrients
      ORDER BY nutrient_group, display_name
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
  ruleType: 'timing_separation' | 'dietary_cofactor' | 'appointment_caution' | 'reference_only';
  checkable: boolean;
  subjectAKind: string;
  subjectA: string;
  subjectBKind: string | null;
  subjectB: string | null;
  minSeparationHours: number | null;
  // Only set for rule_type='appointment_caution' -- how many days ahead to
  // look for a matching upcoming appointment (see subjectB, an
  // appointment_type value like 'lab_draw') before this rule fires.
  lookaheadDays: number | null;
  severity: 'caution' | 'note';
  title: string;
  guidance: string;
  citation: string;
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
    severity: string;
    title: string;
    guidance: string;
    citation: string;
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
    severity: row.severity as InteractionRuleRecord['severity'],
    title: row.title,
    guidance: row.guidance,
    citation: row.citation,
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
  const recognized: readonly string[] = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'fl_oz', 'cup'];
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
export async function getDailyNutrientBreakdown(date: string): Promise<DailyNutrientBreakdown> {
  const meals = await listMealsForDate(date);
  const unresolvedItems: { mealItemId: string; foodName: string; reason: string }[] = [];
  const nutrientCache = new Map<string, Pick<FoodNutrient, 'code' | 'amountPer100g'>[]>();

  async function getCachedNutrients(foodId: number, source: string) {
    const key = `${foodId}|${source}`;
    let nutrients = nutrientCache.get(key);
    if (!nutrients) {
      nutrients = await getFoodNutrients(foodId, source);
      nutrientCache.set(key, nutrients);
    }
    return nutrients;
  }

  function addInto(target: Record<string, number>, source: Record<string, number>) {
    for (const [code, amount] of Object.entries(source)) {
      target[code] = (target[code] ?? 0) + amount;
    }
  }

  const mealBreakdowns: DailyNutrientMealBreakdown[] = [];
  const dayTotals: Record<string, number> = {};

  for (const meal of meals) {
    const items = await getMealItems(meal.id);
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

      const nutrients = await getCachedNutrients(foodId, source);
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

export type DailyDimensionItemBreakdown = {
  foodName: string;
  bySubCriterion: DailyDimensionScore[];
};

export type DailyDimensionSideBreakdown = {
  sideName: string;
  bySubCriterion: DailyDimensionScore[];
  items: DailyDimensionItemBreakdown[];
};

export type DailyDimensionMealBreakdown = {
  mealId: string;
  mealName: string;
  mealType: string;
  bySubCriterion: DailyDimensionScore[];
  sides: DailyDimensionSideBreakdown[];
};

export type DailySixDimensionsBreakdown = {
  day: DailyDimensionScore[];
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
export async function getDailySixDimensionsBreakdown(date: string): Promise<DailySixDimensionsBreakdown> {
  const meals = await listMealsForDate(date);
  const scoreCache = new Map<string, FoodScore[]>();

  async function getScores(foodId: number, source: string): Promise<FoodScore[]> {
    const key = `${foodId}|${source}`;
    let scores = scoreCache.get(key);
    if (!scores) {
      scores = await getFoodScores(foodId, source);
      scoreCache.set(key, scores);
    }
    return scores;
  }

  const mealBreakdowns: DailyDimensionMealBreakdown[] = [];
  const dayFoods = new Map<string, { foodName: string; scores: FoodScore[] }>();

  for (const meal of meals) {
    const items = await getMealItems(meal.id);
    const sideOrder: string[] = [];
    const sidesByKey = new Map<string, { sideName: string; foods: Map<string, { foodName: string; scores: FoodScore[] }> }>();
    const mealFoods = new Map<string, { foodName: string; scores: FoodScore[] }>();

    for (const item of items) {
      if (!item.foodId) continue;
      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!source || Number.isNaN(foodId)) continue;

      const scores = await getScores(foodId, source);
      const foodKey = `${foodId}|${source}`;
      const foodEntry = { foodName: item.foodName, scores };

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
        items: foodEntries.map((food) => ({ foodName: food.foodName, bySubCriterion: aggregateBySubCriterion([food]) })),
      };
    });

    mealBreakdowns.push({
      mealId: meal.id,
      mealName: meal.name,
      mealType: meal.meal_type,
      bySubCriterion: aggregateBySubCriterion(Array.from(mealFoods.values())),
      sides,
    });
  }

  return {
    day: aggregateBySubCriterion(Array.from(dayFoods.values())),
    meals: mealBreakdowns,
  };
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

export type CheckinType = 'flare' | 'post_meal' | 'post_exercise' | 'general' | 'stress' | 'sleep';
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
  tags?: string[];
}) {
  const db = await getDatabase();
  const id = `checkin_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO wellbeing_checkins
        (id, logged_at, checkin_type, valence, severity, notes, food_name, related_meal_id, related_exercise_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

export async function listCheckins(filters: { checkinType?: CheckinType; relatedMealId?: string; limit?: number } = {}) {
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

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;

  const rows = await db.getAllAsync<Omit<WellbeingCheckin, 'tags'>>(
    `
      SELECT id, logged_at AS loggedAt, checkin_type AS checkinType, valence, severity, notes, food_name AS foodName,
             related_meal_id AS relatedMealId, related_exercise_id AS relatedExerciseId, created_at AS createdAt
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

export type FoodTrialStatus = 'trialing' | 'cleared' | 'flagged';

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
};

// A new food being watched over time rather than a single moment-in-time
// report -- see food_trials' own table comment above for why this is a
// separate table from wellbeing_checkins. observationDays is just a
// default suggestion for when the person can reasonably call it "probably
// fine"; resolveFoodTrial can be called earlier (an immediate reaction) or
// later (nothing to review yet) -- the app never forces a verdict on a
// schedule the person didn't choose.
export async function createFoodTrial(input: {
  foodName: string;
  startedAt: string;
  observationDays?: number;
  notes?: string;
}) {
  const db = await getDatabase();
  const id = `food_trial_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO food_trials (id, food_name, started_at, observation_days, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'trialing', ?, ?, ?)
    `,
    id,
    input.foodName.trim(),
    input.startedAt,
    input.observationDays ?? 3,
    input.notes?.trim() || null,
    now,
    now,
  );

  return id;
}

export async function listFoodTrials(limit = 100): Promise<FoodTrialRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<FoodTrialRecord>(
    `
      SELECT id, food_name AS foodName, started_at AS startedAt, observation_days AS observationDays,
             status, resolved_at AS resolvedAt, notes, created_at AS createdAt, updated_at AS updatedAt
      FROM food_trials
      ORDER BY started_at DESC
      LIMIT ?
    `,
    limit,
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
}

// Puts a resolved trial back into 'trialing' -- e.g. a symptom shows up a
// few days after clearing a food, and the person wants to reopen it rather
// than start an entirely new trial record.
export async function reopenFoodTrial(id: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE food_trials SET status = 'trialing', resolved_at = NULL, updated_at = ? WHERE id = ?`,
    now,
    id,
  );
}

export async function deleteFoodTrial(id: string) {
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
