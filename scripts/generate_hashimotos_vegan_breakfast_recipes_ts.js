// Reads the intermediate JSON dump scripts/add_hashimotos_safe_vegan_
// breakfasts.py's own main() writes (_hashimotos_vegan_breakfast_data.json,
// one entry per RECIPES tuple, its own single source of truth for this
// batch) and appends a matching lib/digest/recipes.ts DigestEntry block
// per recipe -- ingredients and instructions text derived directly from
// that same data, not retyped by hand, specifically so the database and
// the Digest text can never drift apart the way the "steps aren't
// showing up" bug (2026-08-26, this same day) proved they can.
//
// safeForConditions/conditionCautions/dietTags are written as empty
// placeholders here on purpose -- the real, computed values come from
// running compute_recipe_condition_data.js/apply_recipe_condition_
// cautions.js/compute_recipe_diet_tags.js/apply_recipe_diet_tags.js
// afterward, the same established pipeline every other curated-recipe
// batch in this project already goes through.
//
// Guarded against being run twice on an already-applied batch: if any
// of this run's own ids are already present as a linkedCuratedRecipeId
// in recipes.ts, this refuses to touch the file rather than silently
// duplicating every entry (the exact failure mode apply_recipe_diet_
// tags.js has separately, twice, in this project's own history).
//
// Usage: node scripts/generate_hashimotos_vegan_breakfast_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_hashimotos_vegan_breakfast_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Plain database base_name -> the natural, customer-facing name this
// batch's own recipe text actually uses. Same reasoning as every other
// curated-recipe batch: the database's own base_name exists to resolve a
// real food row precisely, not to read naturally in a sentence.
const DISPLAY_NAME = {
  'Squash, zucchini': 'zucchini',
  'Grains, rice, brown, long-grain, dry': 'brown rice',
  'Sorghum grain': 'sorghum',
  'Cornmeal, whole-grain, yellow': 'cornmeal',
  'Tapioca, pearl, dry': 'small tapioca pearls',
  'Common salt/table salt': 'salt',
  'Spices, cinnamon, ground': 'cinnamon',
  'Maple Syrup (100% Pure)': 'maple syrup',
  'Ginger, peeled, fresh': 'fresh ginger',
  'Coriander (cilantro) leaves': 'cilantro',
  'Fennel Bulb': 'fennel bulb',
  'Red Bell Pepper': 'red bell pepper',
  'Water, tap': 'filtered water',
};

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.125: '⅛' };

function displayName(baseName) {
  return (DISPLAY_NAME[baseName] || baseName).toLowerCase();
}

function formatQuantity(quantity) {
  return FRACTIONS[quantity] || String(quantity);
}

function unitPhrase(ing) {
  const { quantity, unit, baseName, cutPrep, cookingMethod, prepNote } = ing;
  const name = displayName(baseName);
  const qty = formatQuantity(quantity);
  let qtyUnit;
  if (unit === 'each') {
    qtyUnit = `${qty} ${name}`;
  } else if (unit === 'tsp' || unit === 'tbsp') {
    const singular = quantity <= 1;
    const label = unit === 'tsp' ? (singular ? 'teaspoon' : 'teaspoons') : (singular ? 'tablespoon' : 'tablespoons');
    qtyUnit = `${qty} ${label} ${name}`;
  } else {
    qtyUnit = `${quantity}${unit} ${name}`;
  }
  const descriptors = [cutPrep, cookingMethod].filter(Boolean);
  let text = qtyUnit;
  if (descriptors.length > 0) text += `, ${descriptors.join(', ')}`;
  if (prepNote === 'optional') text += ' (optional)';
  return text;
}

function slugify(id) {
  return 'recipe-' + id.replace(/^curated_/, '').replace(/_/g, '-');
}

// Real, honest per-recipe nutrition highlights, based on this batch's own
// actual ingredient composition -- not templated filler.
const NUTRITION_HIGHLIGHTS = {
  curated_vegan_blueberry_cinnamon_oatmeal: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the oats.' },
    { nutrient: 'Manganese', note: 'A solid contribution from the oats and blueberries together.' },
  ],
  curated_vegan_strawberry_banana_oatmeal: [
    { nutrient: 'Potassium', note: 'A real, meaningful amount from the banana.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the fresh strawberries.' },
  ],
  curated_vegan_baked_apple_cinnamon_oatmeal_cup: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the oats and apple together.' },
  ],
  curated_vegan_date_cinnamon_overnight_oats: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the oats and dates.' },
    { nutrient: 'Potassium', note: 'A solid amount from the dates.' },
  ],
  curated_vegan_orange_cranberry_rice_pudding: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the fresh orange.' },
    { nutrient: 'Manganese', note: 'A solid contribution from the rice.' },
  ],
  curated_vegan_ginger_pear_rice_pudding: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the pear.' },
    { nutrient: 'Manganese', note: 'A solid contribution from the rice.' },
  ],
  curated_vegan_peach_sorghum_porridge: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the whole-grain sorghum.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the peach.' },
  ],
  curated_vegan_raspberry_lime_sorghum_porridge: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the sorghum and raspberries together.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the lime and raspberries.' },
  ],
  curated_vegan_sweet_polenta_apricot_compote: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the apricot.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the whole-grain cornmeal.' },
  ],
  curated_vegan_banana_polenta_porridge: [
    { nutrient: 'Potassium', note: 'A real, meaningful amount from the banana.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the whole-grain cornmeal.' },
  ],
  curated_vegan_pineapple_coconut_tapioca_pudding: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the fresh pineapple.' },
    { nutrient: 'Manganese', note: 'A solid amount from the pineapple.' },
  ],
  curated_vegan_mixed_berry_coconut_tapioca_pudding: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the blackberries and raspberries.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the mixed berries.' },
  ],
  curated_vegan_tropical_fruit_bowl_coconut: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the orange and pineapple together.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the papaya.' },
  ],
  curated_vegan_citrus_avocado_breakfast_bowl: [
    { nutrient: 'Healthy Fats', note: 'A real, meaningful amount of monounsaturated fat from the avocado.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the orange and grapefruit.' },
  ],
  curated_vegan_berry_banana_coconut_smoothie: [
    { nutrient: 'Potassium', note: 'A real, meaningful amount from the banana.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the blueberry and strawberry.' },
  ],
  curated_vegan_savory_rice_bowl_zucchini_pepper_tomato: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the bell pepper and tomato together.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the rice and vegetables.' },
  ],
  curated_vegan_savory_polenta_leeks_tomato: [
    { nutrient: 'Vitamin K', note: 'A real, meaningful amount from the leek.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the whole-grain cornmeal.' },
  ],
  curated_vegan_zucchini_fennel_hash_avocado: [
    { nutrient: 'Healthy Fats', note: 'A real, meaningful amount of monounsaturated fat from the avocado.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the zucchini and fennel.' },
  ],
  curated_vegan_cranberry_orange_oatmeal: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the fresh orange.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the oats.' },
  ],
  curated_vegan_papaya_lime_smoothie_bowl: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the papaya.' },
    { nutrient: 'Potassium', note: 'A solid amount from the banana.' },
  ],
  curated_vegan_cantaloupe_grapefruit_breakfast_bowl: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the cantaloupe.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the grapefruit.' },
  ],
  curated_vegan_apple_rice_pudding_cinnamon: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the apple.' },
    { nutrient: 'Manganese', note: 'A solid contribution from the rice.' },
  ],
  curated_vegan_date_sorghum_porridge: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the whole-grain sorghum and dates together.' },
    { nutrient: 'Potassium', note: 'A solid amount from the dates.' },
  ],
  curated_vegan_savory_fennel_tomato_rice_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the tomato.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the rice and fennel.' },
  ],
  curated_vegan_pear_ginger_overnight_oats: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the oats and pear together.' },
  ],
  curated_vegan_blackberry_lime_rice_pudding: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the blackberries.' },
    { nutrient: 'Manganese', note: 'A solid contribution from the rice.' },
  ],
};

const source = fs.readFileSync(RECIPES_TS, 'utf8');

const alreadyPresent = DATA.filter((r) => source.includes(`linkedCuratedRecipeId: '${r.id}',`));
if (alreadyPresent.length > 0) {
  console.error(
    `Refusing to run: ${alreadyPresent.length} of these ids already exist in recipes.ts ` +
      `(${alreadyPresent.map((r) => r.id).join(', ')}). Remove the existing entries first if ` +
      `you really mean to regenerate them, to avoid silently duplicating.`,
  );
  process.exit(1);
}

let block = '\n  // 2026-08-26, direct follow-up to close the Hashimoto\'s+vegan+breakfast\n' +
  '  // gap specifically (the 2026-08-26 soy-free batch closed the general\n' +
  '  // vegan-breakfast target but left this narrower combination at 5 of\n' +
  '  // 30): "Let\'s tackle the Hashimoto\'s-vegan-breakfast batch next." 26\n' +
  '  // new recipes (18 plus an 8-recipe same-day follow-up closing the\n' +
  '  // remaining gap), every ingredient checked directly against this\n' +
  '  // app\'s reference database before being used -- zero yellow or red\n' +
  '  // hits on any of Hashimoto\'s 24 real relevant sub-criteria, not just\n' +
  '  // soy-free. See scripts/add_hashimotos_safe_vegan_breakfasts.py\'s\n' +
  '  // header comment for the full reasoning, including the real, honest\n' +
  '  // tradeoff this narrow a palette requires (no legume/nut/seed/soy\n' +
  '  // protein source survives the screen, so these run genuinely lower\n' +
  '  // in protein than a typical vegan breakfast). safeForConditions/\n' +
  '  // conditionCautions/dietTags below are placeholders, replaced by the\n' +
  '  // same real compute_recipe_diet_tags.js/compute_recipe_condition_\n' +
  '  // data.js/apply_recipe_condition_cautions.js pipeline every other\n' +
  '  // recipe batch already goes through, not hand-guessed.\n';

for (const r of DATA) {
  const digestId = slugify(r.id);
  const ingredientLines = r.ingredients.map((ing) => `        { text: '${unitPhrase(ing).replace(/'/g, "\\'")}' },`).join('\n');
  const instructionLines = r.instructions.map((step) => `        '${step.replace(/'/g, "\\'")}',`).join('\n');
  const highlights = NUTRITION_HIGHLIGHTS[r.id];
  if (!highlights) throw new Error(`No nutritionHighlights defined for ${r.id}`);
  const highlightLines = highlights
    .map((h) => `        { nutrient: '${h.nutrient.replace(/'/g, "\\'")}', note: '${h.note.replace(/'/g, "\\'")}' },`)
    .join('\n');
  block += `  {
    id: '${digestId}',
    category: 'recipes',
    title: '${r.name.replace(/'/g, "\\'")}',
    teaser: '${r.flavorProfile.replace(/'/g, "\\'")}',
    summary: '${r.healthBenefit.replace(/'/g, "\\'")}',
    citations: [],
    overallTier: 'strong',
    linkedCuratedRecipeId: '${r.id}',
    linkedBuilderType: '${r.builderType}',
    recipeCard: {
      dietTags: [],
      safeForConditions: [],
      conditionCautions: {},
      conditionNotes: [],
      yield: 'Makes 1 ${r.servingSizeUnit}.',
      ingredients: [
${ingredientLines}
      ],
      instructions: [
${instructionLines}
      ],
      nutritionHighlights: [
${highlightLines}
      ],
    },
  },
`;
}

const closeIdx = source.lastIndexOf('\n];');
if (closeIdx === -1) throw new Error('Could not find insertion point');
const newSource = source.slice(0, closeIdx) + '\n' + block + source.slice(closeIdx);
fs.writeFileSync(RECIPES_TS, newSource, 'utf8');
console.log('Inserted at end of RECIPES_ENTRIES array, before line at index', closeIdx);
console.log(`Added ${DATA.length} new DigestEntry blocks.`);
