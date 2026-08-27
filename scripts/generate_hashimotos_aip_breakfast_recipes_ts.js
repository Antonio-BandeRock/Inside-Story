// Reads scripts/_hashimotos_aip_breakfast_data.json (written by scripts/
// add_hashimotos_aip_breakfast_batch.py) and appends a matching lib/
// digest/recipes.ts DigestEntry block per recipe. Same established
// pattern as the two earlier same-day recipe-batch generators.
//
// safeForConditions/conditionCautions/dietTags below are placeholders,
// replaced by the same real pipeline every other batch already goes
// through, not hand-guessed.
//
// Usage: node scripts/generate_hashimotos_aip_breakfast_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_hashimotos_aip_breakfast_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const DISPLAY_NAME = {
  'Salmon Fillet (Raw)': 'salmon fillet',
  'Halibut Fish (Raw)': 'halibut fillet',
  'Cod Fish': 'cod fillet',
  'Shrimp Crustaceans': 'shrimp',
  'Beef Top Sirloin (Raw)': 'beef top sirloin',
  'Pork Fillet / Tenderloin (Raw)': 'pork tenderloin',
  'Squash, zucchini': 'zucchini',
  'Fennel Bulb': 'fennel bulb',
  'Common salt/table salt': 'salt',
  'Coriander (cilantro) leaves': 'cilantro',
  'Cantaloupe Melon': 'cantaloupe',
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

const NUTRITION_HIGHLIGHTS = {
  curated_snack_beef_kale_breakfast_hash: [
    { nutrient: 'Iron', note: 'A real, meaningful amount from the beef sirloin.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
  ],
  curated_snack_pork_cabbage_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the pork tenderloin, a genuinely lean cut.' },
  ],
  curated_snack_salmon_broccoli_breakfast_bowl: [
    { nutrient: 'Omega-3 Fatty Acids', note: 'A real, meaningful amount from the salmon.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_halibut_fennel_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the halibut.' },
    { nutrient: 'Potassium', note: 'A solid amount from the fennel.' },
  ],
  curated_snack_cod_cabbage_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the cod, for very little saturated fat.' },
  ],
  curated_snack_shrimp_zucchini_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the shrimp.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the avocado.' },
  ],
  curated_snack_beef_broccoli_breakfast_bowl: [
    { nutrient: 'Iron', note: 'A real, meaningful amount from the beef sirloin.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_pork_kale_breakfast_hash: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the pork tenderloin.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
  ],
  curated_snack_salmon_fennel_breakfast_bowl: [
    { nutrient: 'Omega-3 Fatty Acids', note: 'A real, meaningful amount from the salmon.' },
  ],
  curated_snack_halibut_cabbage_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the halibut.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the avocado.' },
  ],
  curated_snack_cod_broccoli_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the cod, for very little saturated fat.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_shrimp_cabbage_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the shrimp.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the avocado.' },
  ],
  curated_snack_citrus_avocado_breakfast_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the orange and grapefruit together.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the avocado.' },
  ],
  curated_snack_tropical_breakfast_fruit_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the pineapple and papaya together.' },
    { nutrient: 'Potassium', note: 'A solid amount from the banana.' },
  ],
  curated_snack_berry_melon_breakfast_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the strawberry and cantaloupe together.' },
    { nutrient: 'Manganese', note: 'A solid amount from the blueberries.' },
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

let block = '\n  // 2026-08-27, Open Next Steps item 20, phase 1: a real, structural,\n' +
  '  // condition-agnostic AIP breakfast shortage (2 recipes total across\n' +
  '  // every one of the 19 tracked conditions before this batch). 15 new\n' +
  '  // AIP-compliant breakfast recipes, reusing the exact same verified-\n' +
  '  // clean protein/vegetable palette confirmed earlier the same day for\n' +
  '  // the lunch/dinner batch, plus 3 fruit-only no-cook bowls. Sweet\n' +
  '  // potato was deliberately excluded after direct verification: it\n' +
  '  // carries a real "Mineral Binding Risk: High" flag for Hashimoto\'s\n' +
  '  // across every real prep method, the same still-open, named data\n' +
  '  // question from this app\'s own 2026-08-26 history. Named honestly as\n' +
  '  // a real, phased first batch, not a full closure: Hashimoto\'s own AIP\n' +
  '  // breakfast needed +28 to reach 30, this batch adds 15. See scripts/\n' +
  '  // add_hashimotos_aip_breakfast_batch.py\'s header comment for the full\n' +
  '  // reasoning. safeForConditions/conditionCautions/dietTags below are\n' +
  '  // placeholders, replaced by the same real compute pipeline every\n' +
  '  // other batch already goes through.\n';

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
