// Reads the intermediate JSON dump scripts/add_hashimotos_lunch_dinner_
// batch.py's own main() writes (_hashimotos_lunch_dinner_data.json, one
// entry per RECIPES tuple, its own single source of truth for this
// batch) and appends a matching lib/digest/recipes.ts DigestEntry block
// per recipe -- ingredients and instructions text derived directly from
// that same data, not retyped by hand, the same discipline the vegan-
// breakfast batch's own generator script already established.
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
// duplicating every entry.
//
// Usage: node scripts/generate_hashimotos_lunch_dinner_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_hashimotos_lunch_dinner_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Plain database base_name -> the natural, customer-facing name this
// batch's own recipe text actually uses.
const DISPLAY_NAME = {
  'Salmon Fillet (Raw)': 'salmon fillet',
  'Halibut Fish (Raw)': 'halibut fillet',
  'Cod Fish': 'cod fillet',
  'Shrimp Crustaceans': 'shrimp',
  'Beef Top Sirloin (Raw)': 'beef top sirloin',
  'Pork Fillet / Tenderloin (Raw)': 'pork tenderloin',
  'Squash, zucchini': 'zucchini',
  'Grains, rice, brown, long-grain, dry': 'brown rice',
  'Sorghum grain': 'sorghum',
  'Common salt/table salt': 'salt',
  'Spices, cinnamon, ground': 'cinnamon',
  'Ginger, peeled, fresh': 'fresh ginger',
  'Coriander (cilantro) leaves': 'cilantro',
  'Fennel Bulb': 'fennel bulb',
  'Red Bell Pepper': 'red bell pepper',
  'Water, tap': 'filtered water',
  'Vegetable stock': 'vegetable stock',
  'Lettuce, green leaf': 'lettuce',
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
  curated_side_baked_salmon_broccoli_carrots: [
    { nutrient: 'Omega-3 Fatty Acids', note: 'A real, meaningful amount from the salmon.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_side_halibut_braised_cabbage_carrots: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the halibut.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the carrot.' },
  ],
  curated_side_cod_roasted_fennel_zucchini: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the cod, for very little saturated fat.' },
    { nutrient: 'Potassium', note: 'A solid amount from the fennel and zucchini together.' },
  ],
  curated_side_shrimp_cabbage_carrot_stir_fry: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the shrimp.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the carrot.' },
  ],
  curated_side_beef_sirloin_kale_carrots: [
    { nutrient: 'Iron', note: 'A real, meaningful amount from the beef sirloin.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
  ],
  curated_side_pork_tenderloin_braised_cabbage_apple: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the pork tenderloin, a genuinely lean cut.' },
    { nutrient: 'Fiber', note: 'A solid contribution from the cabbage and apple together.' },
  ],
  curated_soup_salmon_fennel_leek_soup: [
    { nutrient: 'Omega-3 Fatty Acids', note: 'A real, meaningful amount from the salmon.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the leek and fennel.' },
  ],
  curated_handheld_shrimp_lettuce_wraps_avocado: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the shrimp.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the avocado.' },
  ],
  curated_salad_beef_carrot_fennel_salad: [
    { nutrient: 'Iron', note: 'A real, meaningful amount from the beef sirloin.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the carrot.' },
  ],
  curated_vegan_side_coconut_rice_roasted_vegetable_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the bell pepper and tomato together.' },
    { nutrient: 'Manganese', note: 'A solid contribution from the rice.' },
  ],
  curated_vegan_soup_coconut_fennel_leek_vegetable_soup: [
    { nutrient: 'Vitamin K', note: 'A real, meaningful amount from the leek and fennel together.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the carrot.' },
  ],
  curated_vegan_salad_avocado_fennel_citrus_salad: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the orange and grapefruit together.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the avocado.' },
  ],
  curated_vegan_side_sorghum_roasted_vegetable_bowl: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the whole-grain sorghum.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the bell pepper.' },
  ],
  curated_vegan_soup_tomato_fennel_coconut_soup: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the tomato.' },
    { nutrient: 'Potassium', note: 'A solid amount from the fennel and tomato together.' },
  ],
  curated_vegan_handheld_avocado_rice_lettuce_wraps: [
    { nutrient: 'Healthy Fats', note: 'A real, meaningful amount of monounsaturated fat from the avocado.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the tomato.' },
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

let block = '\n  // 2026-08-27, direct follow-up to close Hashimoto\'s own remaining\n' +
  '  // Vegan/Vegetarian/Paleo/AIP lunch and dinner gaps (confirmed via\n' +
  '  // scripts/audit_meal_plan_recipe_coverage.js after the same-day legume-\n' +
  '  // reference bug fix, still short of the 30-minimum bar): "Let\'s tackle\n' +
  '  // the new lunch/dinner recipe batch next." 15 new recipes: 9 real\n' +
  '  // animal-protein AIP dishes (salmon, halibut, cod, shrimp, beef top\n' +
  '  // sirloin, pork tenderloin, every one confirmed genuinely clean for\n' +
  '  // Hashimoto\'s, zero flags at all) plus 6 savory vegan mains/soups\n' +
  '  // reusing the same-day\'s earlier verified-clean vegan palette. AIP\n' +
  '  // recipes here also always carry the Paleo tag by this app\'s own real\n' +
  '  // compute_recipe_diet_tags.js logic, closing that gap at the same\n' +
  '  // time. See scripts/add_hashimotos_lunch_dinner_batch.py\'s header\n' +
  '  // comment for the full reasoning, including the real, named quirk\n' +
  '  // that disqualifies coconut milk from ever earning the AIP tag in\n' +
  '  // this app\'s own category taxonomy (it\'s classified NutSeed here).\n' +
  '  // safeForConditions/conditionCautions/dietTags below are placeholders,\n' +
  '  // replaced by the same real compute_recipe_diet_tags.js/compute_\n' +
  '  // recipe_condition_data.js/apply_recipe_condition_cautions.js pipeline\n' +
  '  // every other recipe batch already goes through, not hand-guessed.\n';

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
