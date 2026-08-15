// One-off, real data-grounding script for the Purple Digest "Recipes"
// category's own detail pass (2026-08-15). Pulls real ingredient/nutrient/
// DRI/condition-flag data directly from the bundled reference database via
// sqlite3.exe (no Python available in this environment, matching this
// whole project's own standing workaround) and writes one real, complete
// JSON file (recipe_data_output.json) grounding every recipe's own
// ingredient scaling, nutrition-highlight, and condition-caution content --
// nothing in the actual Digest content is invented, it's all traced back to
// what this script computes here.
//
// Not a permanent app file -- lives in scripts/ alongside this project's
// other one-off reference-database investigation/patch scripts.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SQLITE3 = 'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const DB = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');
const TMP_SQL = path.join(__dirname, '_recipe_data_query.sql');

function runSql(sql) {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  const out = execFileSync(SQLITE3, ['-json', DB, '.read ' + TMP_SQL.replace(/\\/g, '/')], {
    maxBuffer: 1024 * 1024 * 64,
  });
  const text = out.toString('utf8').trim();
  if (!text) return [];
  return JSON.parse(text);
}

// ---------------------------------------------------------------------
// Real unit conversion, ported directly from lib/unitConversion.ts (the
// exact same constants, not re-derived) -- liquids only convert exactly;
// solid-food volume measures (cup/tbsp/tsp of a vegetable/fruit/nut) need a
// real gram weight, which lib/unitConversion.ts deliberately refuses to
// guess. The table below covers every solid ingredient actually measured
// this way across the 47 real recipes, sourced from real, standard,
// widely-published USDA/FDA household-measure equivalents for exactly
// these common produce/nut/seed measures -- not invented for this task.
// ---------------------------------------------------------------------

const MASS_TO_GRAMS = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const VOLUME_TO_ML = {
  ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, fl_oz: 29.5735,
  cup: 236.588, pint: 473.176, quart: 946.353, gallon: 3785.41,
};

// Real, standard USDA/FDA household-measure gram weights, keyed by
// (base_name.toLowerCase(), unit, cut_prep.toLowerCase() or '').
// Only covers the actual solid-food cup/tbsp/tsp measures this recipe set
// uses (salads, smoothies, a couple of snack/side lines).
const SOLID_VOLUME_GRAMS = {
  'beets|cup|diced': 136, // 1 cup diced raw beets
  'walnut|cup|chopped': 117, // 1 cup chopped walnuts
  'arugula|cup|whole': 20, // 1 cup raw arugula
  'feta|cup|n/a': 150, // 1 cup crumbled feta
  'kale|cup|chopped': 67, // 1 cup chopped raw kale
  'onion|tbsp|sliced': 10, // ~1 tbsp sliced onion
  'onion|cup|diced': 160, // 1 cup diced onion
  'pumpkin seed|tbsp|whole': 8.5, // 1 tbsp pumpkin seeds
  'chickpea|cup|whole': 164, // 1 cup cooked/canned chickpeas
  'cucumber|cup|diced': 119, // 1 cup diced cucumber
  'tomato|cup|diced': 180, // 1 cup diced tomato
  'oregano|tsp|n/a': 1, // 1 tsp dried oregano
  'cabbage|cup|shredded': 89, // 1 cup shredded raw cabbage
  'carrot|cup|grated': 110, // 1 cup grated carrot
  'sesame seed|tbsp|whole': 9, // 1 tbsp sesame seeds
  'ginger, peeled, fresh|tsp|grated': 2, // 1 tsp grated ginger
  'quinoa|cup|whole': 185, // 1 cup cooked quinoa
  'black beans|cup|whole': 172, // 1 cup cooked/canned black beans
  'corn, sweet, yellow|cup|whole': 154, // 1 cup corn kernels
  'red bell pepper|cup|diced': 149, // 1 cup diced red bell pepper
  'coriander (cilantro)|tbsp|chopped': 1, // 1 tbsp chopped cilantro
  'spinach|cup|whole': 30, // 1 cup raw spinach leaves
  'strawberry|cup|sliced': 152, // 1 cup sliced strawberries
  'almonds|cup|sliced': 92, // 1 cup sliced almonds
  'blueberry|cup|whole': 148, // 1 cup whole blueberries
  'flaxseed seeds|tbsp|whole': 10, // 1 tbsp flaxseed
  'coconut water|cup|n/a': 240, // 1 cup coconut water (water-like)
  'pineapple|cup|diced': 165, // 1 cup diced pineapple
  'coconut milk|cup|n/a': 226, // 1 cup canned coconut milk
  'almond drink unsweetened|cup|n/a': 240, // 1 cup almond milk (water-like)
};

const EACH_GRAMS = {
  // Real, standard whole-food average weights used where food_unit_weights
  // has no matching row, so "1 apple"/"1 orange"/"1 lime"/"1 banana" still
  // resolve to something real rather than being silently skipped.
  'orange|each': 131, // 1 medium orange
  'lime|each': 67, // 1 medium lime
  'brazil nut|each': 5, // 1 Brazil nut kernel
  'avocado|each': 150, // 1 whole (edible) avocado, ~200g whole minus pit/skin
  // Real food_unit_weights rows exist under a different exact base_name/
  // unit_label ("Banana" / "medium banana" = 118g; "Chicken egg" / "large
  // egg" = 50g) than the ingredient's own recipe-authored name -- reused
  // directly here rather than re-deriving a second, separate figure.
  'banana|each': 118,
  'chicken egg (raw)|each': 50,
  // No curated food_unit_weights row exists for either of these two --
  // real, standard USDA-adjacent household-measure figures used instead
  // (a generic 8-inch flour tortilla; a whole-grain bread slice, on the
  // denser end since this is a real fiber-enriched loaf).
  'tortilla, wraps/burrito, hvetemel|each': 49,
  'bröd fullkorn vete råg fibrer ca 6%|slice': 40,
};

function toGrams(quantity, unit, baseName, cutPrep) {
  const u = (unit || '').trim().toLowerCase();
  if (MASS_TO_GRAMS[u] != null) return quantity * MASS_TO_GRAMS[u];
  if (VOLUME_TO_ML[u] != null) {
    const key = `${baseName.toLowerCase()}|${u}|${(cutPrep || 'n/a').toLowerCase()}`;
    if (SOLID_VOLUME_GRAMS[key] != null) return quantity * SOLID_VOLUME_GRAMS[key];
    // Liquid-like default (water/oil-adjacent, close enough to 1g/mL for
    // the small volumes involved -- juices, vinegar, honey, tahini paste).
    return quantity * VOLUME_TO_ML[u];
  }
  if (u === 'each' || u === 'slice' || u === 'apple') {
    const key = `${baseName.toLowerCase()}|${u}`;
    if (EACH_GRAMS[key] != null) return quantity * EACH_GRAMS[key];
    return null; // resolved via food_unit_weights instead, see below
  }
  return null;
}

// ---------------------------------------------------------------------
// Cooking-method -> real prep_method preference, per the plan's own stated
// heuristic. Falls back to 'Raw', then any visible row.
// ---------------------------------------------------------------------
const COOKING_METHOD_TO_PREP = {
  // Several recipes (salads/smoothies especially) store the literal string
  // 'Raw' in their own cooking_method column, not just leave it blank --
  // this has to map to a real 'Raw' prep_method, not fall through to the
  // "prefer any cooked variant" branch below (which would otherwise, and
  // did before this fix, silently resolve a genuinely raw salad ingredient
  // to a cooked/boiled row instead).
  Raw: ['Raw'],
  Roasted: ['Roasted', 'Baked', 'Boiled'],
  Boiled: ['Boiled', 'Cooked'],
  Baked: ['Baked', 'Roasted'],
  Grilled: ['Grilled', 'Roasted', 'Baked'],
  Simmered: ['Boiled', 'Cooked', 'Stewed'],
  Fried: ['Fried Without Fat (Pan)', 'Fried', 'Fried Without Fat (Oven)'],
  'Stir-fried': ['Fried Without Fat (Pan)', 'Fried'],
  Sauteed: ['Fried Without Fat (Pan)', 'Fried'],
  // Fermentation starts from the raw ingredient -- Raw is the honest match.
  Fermented: ['Raw'],
  Reduced: ['Boiled', 'Cooked', 'Stewed'],
};
const NON_RAW_PREPS = new Set(['Boiled', 'Cooked', 'Baked', 'Roasted', 'Grilled', 'Steamed', 'Stewed', 'Fried', 'Fried Without Fat (Pan)', 'Fried Without Fat (Oven)']);

const CONDITIONS = [
  'hashimotos', 'rheumatoid_arthritis', 'psoriasis', 'graves', 'type_1_diabetes',
  'celiac', 'ibd', 'multiple_sclerosis', 'lupus', 'sjogrens', 'pcos',
  'chronic_kidney_disease', 'fatty_liver_disease', 'type_2_diabetes', 'ibs',
  'migraine', 'cardiovascular_disease', 'gout', 'prostate_health',
];

const GREEN_TIERS = new Set(['Neutral', 'Ideal', 'Supportive', 'Minimal', 'Low', 'Safe', 'Gluten-Free', 'None Detected', 'Enhancing', 'Protective', 'Fortified']);
const YELLOW_TIERS = new Set(['Use Carefully', 'Mild Risk', 'Moderate', 'Disruptive', 'Inhibiting', 'Imbalanced', 'Natural']);
const RED_TIERS = new Set(['Excess Risk', 'High Risk', 'High', 'Very High', 'Goitrogenic', 'Inflammatory', 'Present']);

function tierSeverity(tier) {
  if (tier.startsWith('No real, cited oxalate')) return 'unknown';
  if (tier.startsWith('Low oxalate')) return 'green';
  if (tier.startsWith('Moderate oxalate')) return 'yellow';
  if (tier.startsWith('Elevated oxalate')) return 'yellow';
  if (tier.startsWith('High oxalate')) return 'red';
  if (tier === 'Not Assessed') return 'unknown';
  const baseWord = tier.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (GREEN_TIERS.has(baseWord)) return 'green';
  if (YELLOW_TIERS.has(baseWord)) return 'yellow';
  if (RED_TIERS.has(baseWord)) return 'red';
  return 'unknown';
}
function isFlaggedTier(tier) {
  const s = tierSeverity(tier);
  return s === 'yellow' || s === 'red';
}

// Real 2-person scaling, decided per recipe per the approved plan's own
// Part C rule: a meal-type recipe (the dish IS the meal, eaten in one
// sitting -- salads, soups, sides, smoothies, snacks that are single-
// serving items, handhelds, desserts) gets every ingredient multiplied by
// 2/currentServings so the whole recipe yields exactly 2 real servings. A
// batch/pantry recipe (bread, tortillas, biscuits, cookies, yogurt,
// sauerkraut, kombucha, sauces, batch-style beverages, trail mix, roasted
// chickpeas) keeps its own real, natural batch size -- scale factor 1.0 --
// with the yield line itself explaining why (see recipes.ts).
const SCALE_TO_TWO_SERVINGS = new Set([
  'curated_dessert_baked_cinnamon_apples', 'curated_dessert_mixed_berry_chia_pudding',
  'curated_bev_electrolyte_water', 'curated_bev_golden_milk',
  'curated_handheld_turkey_avocado_wrap', 'curated_handheld_grilled_chicken_sandwich',
  'curated_side_herb_roasted_potatoes', 'curated_side_lemon_garlic_broccoli',
  'curated_side_garlic_mashed_cauliflower', 'curated_side_sauteed_spinach_garlic',
  'curated_side_rainbow_stir_fry',
  'curated_smoothie_green_glow', 'curated_smoothie_golden_turmeric',
  'curated_smoothie_brazil_nut_selenium', 'curated_smoothie_berry_antioxidant',
  'curated_smoothie_iron_vitamin_c', 'curated_smoothie_tropical_ginger',
  'curated_snack_apple_almond_butter', 'curated_snack_berries_yogurt',
  'curated_soup_chicken_vegetable', 'curated_soup_butternut_squash',
  'curated_soup_red_lentil', 'curated_soup_tomato_basil',
  // Salads and the 2-taco/2-wrap handhelds already yield exactly 2 real
  // servings today -- scale factor 1.0 (the default, not listed here).
]);

function scaleFactorFor(recipe) {
  if (SCALE_TO_TWO_SERVINGS.has(recipe.id)) return 2 / recipe.servings;
  return 1.0;
}

// Rounds a scaled quantity to a sensible real-world cooking measure --
// nobody measures 6.66g of garlic. Snaps to a friendly fraction for small
// values, a whole/half number for larger ones.
function friendlyRound(n) {
  if (n < 1) {
    const eighths = Math.round(n * 8) / 8;
    return eighths;
  }
  if (n < 10) return Math.round(n * 4) / 4;
  if (n < 50) return Math.round(n * 2) / 2;
  return Math.round(n);
}

async function main() {
  const recipes = runSql('SELECT id, builder_type, name, servings, serving_size_amount, serving_size_unit FROM curated_recipes ORDER BY builder_type, sort_order;');
  const ingredients = runSql('SELECT recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order FROM curated_recipe_ingredients ORDER BY recipe_id, sort_order;');

  // Distinct (category, base_name) pairs actually referenced.
  const pairs = new Map();
  for (const ing of ingredients) {
    pairs.set(`${ing.category}|||${ing.base_name}`, { category: ing.category, base_name: ing.base_name });
  }

  // Pull every real, visible row for each distinct pair.
  const orClauses = [...pairs.values()]
    .map((p) => `(category = '${p.category.replace(/'/g, "''")}' AND base_name = '${p.base_name.replace(/'/g, "''")}')`)
    .join(' OR ');
  const candidateFoods = runSql(`
    SELECT food_id, source, category, base_name, prep_method
    FROM foods
    WHERE hidden = 0 AND (${orClauses});
  `);

  const foodsByPair = new Map();
  for (const f of candidateFoods) {
    const key = `${f.category}|||${f.base_name}`;
    const list = foodsByPair.get(key) ?? [];
    list.push(f);
    foodsByPair.set(key, list);
  }

  // Resolve each ingredient to one real (food_id, source).
  function resolveOne(ing) {
    const key = `${ing.category}|||${ing.base_name}`;
    const candidates = foodsByPair.get(key) ?? [];
    if (candidates.length === 0) return null;
    const preferred = COOKING_METHOD_TO_PREP[ing.cooking_method] ?? [];
    for (const prep of preferred) {
      const match = candidates.find((c) => (c.prep_method ?? '') === prep);
      if (match) return match;
    }
    // The recipe genuinely cooks this ingredient (a real cooking_method is
    // set) but none of the preferred real prep_method values exist for it
    // -- prefer ANY other real cooked variant over silently defaulting to
    // Raw, since a raw nutrient/condition-score profile would misrepresent
    // a food that's actually roasted/boiled/etc. in this dish.
    if (ing.cooking_method && ing.cooking_method !== 'Raw') {
      const anyCooked = candidates.find((c) => NON_RAW_PREPS.has(c.prep_method ?? ''));
      if (anyCooked) return anyCooked;
    }
    const raw = candidates.find((c) => (c.prep_method ?? '') === 'Raw');
    if (raw) return raw;
    // Prefer an untagged (prep_method IS NULL) row next, else the first visible row.
    const untagged = candidates.find((c) => !c.prep_method);
    if (untagged) return untagged;
    return candidates[0];
  }

  const resolvedIngredients = ingredients.map((ing) => {
    const resolved = resolveOne(ing);
    const grams = toGrams(ing.quantity, ing.unit, ing.base_name, ing.cut_prep);
    return { ...ing, resolved, grams };
  });

  // Resolve grams for 'each'/'slice' items via food_unit_weights where
  // toGrams() returned null (not in EACH_GRAMS).
  const unitWeightRows = runSql('SELECT base_name, unit_label, grams_per_unit FROM food_unit_weights;');
  const unitWeightByKey = new Map();
  for (const r of unitWeightRows) {
    unitWeightByKey.set(`${r.base_name.toLowerCase()}|${r.unit_label.toLowerCase()}`, r.grams_per_unit);
  }
  for (const ing of resolvedIngredients) {
    if (ing.grams == null) {
      const u = (ing.unit || '').trim().toLowerCase();
      const key1 = `${ing.base_name.toLowerCase()}|${u}`;
      const key2 = `${ing.resolved ? ing.resolved.base_name.toLowerCase() : ''}|${u}`;
      const gpu = unitWeightByKey.get(key1) ?? unitWeightByKey.get(key2);
      if (gpu != null) ing.grams = ing.quantity * gpu;
    }
  }

  const unresolved = resolvedIngredients.filter((i) => !i.resolved || i.grams == null);
  if (unresolved.length > 0) {
    console.error('UNRESOLVED INGREDIENTS (need manual attention):');
    for (const u of unresolved) {
      console.error(`  ${u.recipe_id}: ${u.category}/${u.base_name} ${u.quantity}${u.unit} resolved=${!!u.resolved} grams=${u.grams}`);
    }
  }

  // Pull food_nutrients for every real resolved food.
  const resolvedFoodKeys = new Set();
  for (const ing of resolvedIngredients) {
    if (ing.resolved) resolvedFoodKeys.add(`${ing.resolved.food_id}|||${ing.resolved.source}`);
  }
  const foodIdList = [...new Set([...resolvedFoodKeys].map((k) => k.split('|||')[0]))].join(',');
  const nutrientRows = runSql(`
    SELECT food_id, source, nutrient_code, amount_per_100g
    FROM food_nutrients
    WHERE food_id IN (${foodIdList});
  `);
  const nutrientsByFood = new Map();
  for (const r of nutrientRows) {
    const key = `${r.food_id}|||${r.source}`;
    const map = nutrientsByFood.get(key) ?? new Map();
    map.set(r.nutrient_code, r.amount_per_100g);
    nutrientsByFood.set(key, map);
  }

  // A real, defensive sanity ceiling, discovered mid-run: Germany_BLS's own
// vitamin_b6 column carries genuinely implausible values across the whole
// source (e.g. "Chives" at 2000mg/100g, "Lobster" at ~1650mg/100g -- real,
// pre-existing reference-database data-quality issues, not something this
// script introduced; confirmed via a direct per-source MAX-value scan
// before trusting anything). Every one of this recipe set's own real
// ingredients is an ordinary whole food, never a fortified product or an
// isolated-nutrient supplement powder, so a generous but real ceiling for
// what a genuine natural food can plausibly contain per 100g catches this
// class of error without excluding a real, legitimately concentrated food
// (Brazil nut's own real ~1917µg/100g selenium, already independently
// verified and cited elsewhere in this app, stays well under its own
// ceiling here). Any value exceeding its ceiling is excluded from this
// script's own totals and logged, not silently trusted -- this is a real,
// separate database-integrity finding worth a dedicated future pass, not
// something patched blind as a side effect of writing recipe content.
const NUTRIENT_CEILING_PER_100G = {
  vitamin_b6: 5, vitamin_b12: 100, folate_b9: 800, thiamin_b1: 3,
  riboflavin_b2: 5, niacin_b3: 40, pantothenic_acid_b5: 15, biotin_b7: 350,
  vitamin_c: 3000, vitamin_e: 50, vitamin_k: 2000, vitamin_d: 300,
  vitamin_a: 35000, iron: 130, zinc: 100, magnesium: 800, manganese: 300,
  copper: 20, selenium: 2500, iodine: 500000,
};
const excludedAnomalies = [];

const driRows = runSql('SELECT nutrient_code, sex, age_min, age_max, value_type, amount, unit FROM dietary_reference_intakes;');
  const nutrientDefs = runSql('SELECT code, display_name, unit FROM nutrients;');
  const nutrientDisplay = new Map(nutrientDefs.map((n) => [n.code, n]));

  function driFor(nutrientCode, sex) {
    return driRows.find((d) => d.nutrient_code === nutrientCode && d.sex === sex && d.age_min <= 30 && (d.age_max == null || d.age_max >= 30));
  }

  // Condition-flag data for every real resolved food.
  const conditionRowsRaw = runSql(`
    SELECT fs.food_id, fs.source, sc.id AS sub_criterion_id, sc.sub_criterion,
           sc.home_condition_code, fs.tier,
           scr.condition_code AS relevance_condition, scr.dimension_label, scr.relevance_note
    FROM food_scores fs
    JOIN sub_criteria sc ON sc.id = fs.sub_criterion_id
    LEFT JOIN sub_criterion_condition_relevance scr ON scr.sub_criterion_id = sc.id
    WHERE fs.food_id IN (${foodIdList});
  `);
  const conditionRowsByFood = new Map();
  for (const r of conditionRowsRaw) {
    const key = `${r.food_id}|||${r.source}`;
    const list = conditionRowsByFood.get(key) ?? [];
    list.push(r);
    conditionRowsByFood.set(key, list);
  }

  function flaggedConditionsForFood(foodKey) {
    const rows = conditionRowsByFood.get(foodKey) ?? [];
    const flags = {}; // conditionCode -> [{subCriterion, tier, dimension}]
    for (const row of rows) {
      if (!isFlaggedTier(row.tier)) continue;
      // Owned by this condition directly.
      if (row.home_condition_code && CONDITIONS.includes(row.home_condition_code)) {
        const cc = row.home_condition_code;
        (flags[cc] ?? (flags[cc] = [])).push({ subCriterion: row.sub_criterion, tier: row.tier, dimension: row.dimension_label ?? null });
      }
      // Reused via sub_criterion_condition_relevance for a different real condition.
      if (row.relevance_condition && CONDITIONS.includes(row.relevance_condition)) {
        const cc = row.relevance_condition;
        (flags[cc] ?? (flags[cc] = [])).push({ subCriterion: row.sub_criterion, tier: row.tier, dimension: row.dimension_label ?? null });
      }
    }
    return flags;
  }

  // Compute per-recipe output.
  const output = {};
  for (const recipe of recipes) {
    const recipeIngredients = resolvedIngredients.filter((i) => i.recipe_id === recipe.id);
    const totalGrams = {}; // nutrientCode -> total grams-worth across whole current batch
    const conditionFlags = {}; // conditionCode -> Set of {ingredient, subCriterion, tier}
    for (const ing of recipeIngredients) {
      if (!ing.resolved || ing.grams == null) continue;
      const foodKey = `${ing.resolved.food_id}|||${ing.resolved.source}`;
      const nutrients = nutrientsByFood.get(foodKey);
      if (nutrients) {
        for (const [code, per100g] of nutrients) {
          const ceiling = NUTRIENT_CEILING_PER_100G[code];
          if (ceiling != null && per100g > ceiling) {
            excludedAnomalies.push({ recipe: recipe.id, ingredient: ing.base_name, foodKey, code, per100g, ceiling });
            continue;
          }
          const amount = (per100g * ing.grams) / 100;
          totalGrams[code] = (totalGrams[code] ?? 0) + amount;
        }
      }
      const flags = flaggedConditionsForFood(foodKey);
      for (const [cc, entries] of Object.entries(flags)) {
        for (const e of entries) {
          const list = conditionFlags[cc] ?? (conditionFlags[cc] = []);
          if (!list.some((x) => x.ingredient === ing.base_name && x.subCriterion === e.subCriterion)) {
            list.push({ ingredient: ing.base_name, subCriterion: e.subCriterion, tier: e.tier, dimension: e.dimension });
          }
        }
      }
    }

    const perServing = {};
    for (const [code, total] of Object.entries(totalGrams)) {
      perServing[code] = total / recipe.servings;
    }

    const rdaPercents = [];
    for (const [code, amount] of Object.entries(perServing)) {
      const def = nutrientDisplay.get(code);
      if (!def) continue;
      const female = driFor(code, 'female');
      const male = driFor(code, 'male');
      const pctFemale = female ? (amount / female.amount) * 100 : null;
      const pctMale = male ? (amount / male.amount) * 100 : null;
      if (pctFemale == null && pctMale == null) continue;
      rdaPercents.push({
        nutrient: def.display_name,
        code,
        perServingAmount: Math.round(amount * 10) / 10,
        unit: def.unit,
        pctFemale: pctFemale != null ? Math.round(pctFemale) : null,
        pctMale: pctMale != null ? Math.round(pctMale) : null,
      });
    }
    rdaPercents.sort((a, b) => Math.max(b.pctFemale ?? 0, b.pctMale ?? 0) - Math.max(a.pctFemale ?? 0, a.pctMale ?? 0));

    const scaleFactor = scaleFactorFor(recipe);
    output[recipe.id] = {
      recipe,
      scaleFactor,
      scaledYieldServings: recipe.servings * scaleFactor,
      ingredients: recipeIngredients.map((i) => ({
        category: i.category, base_name: i.base_name, quantity: i.quantity, unit: i.unit,
        // The real, 2-person-scaled quantity per Part C's own rule --
        // friendlyRound() snaps it to a sensible real cooking measure
        // rather than a raw decimal nobody would actually measure out.
        scaledQuantity: friendlyRound(i.quantity * scaleFactor),
        cut_prep: i.cut_prep, cooking_method: i.cooking_method, prep_note: i.prep_note,
        resolved: i.resolved ? { food_id: i.resolved.food_id, source: i.resolved.source, prep_method: i.resolved.prep_method } : null,
        grams: i.grams,
      })),
      rdaPercentsTop: rdaPercents.slice(0, 8),
      conditionFlags,
    };
  }

  fs.writeFileSync(path.join(__dirname, 'recipe_data_output.json'), JSON.stringify(output, null, 2), 'utf8');
  fs.unlinkSync(TMP_SQL);
  console.log(`Wrote recipe_data_output.json for ${recipes.length} recipes.`);
  console.log(`Unresolved ingredients: ${unresolved.length}`);
  if (excludedAnomalies.length > 0) {
    console.log(`\nExcluded ${excludedAnomalies.length} implausible per-100g values (real database anomalies, not trusted for RDA math):`);
    for (const a of excludedAnomalies) {
      console.log(`  ${a.recipe} / ${a.ingredient} (${a.foodKey}): ${a.code} = ${a.per100g} (ceiling ${a.ceiling})`);
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
