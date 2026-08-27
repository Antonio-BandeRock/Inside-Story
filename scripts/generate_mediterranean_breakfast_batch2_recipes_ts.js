// Reads scripts/_mediterranean_breakfast_batch2_data.json (written by
// scripts/add_mediterranean_breakfast_batch2.py) and appends a matching
// lib/digest/recipes.ts DigestEntry block per recipe. Same established
// pattern as this session's earlier recipe-batch generators.
//
// Usage: node scripts/generate_mediterranean_breakfast_batch2_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_mediterranean_breakfast_batch2_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const DISPLAY_NAME = {
  'Olive Oil (Extra Virgin)': 'olive oil',
  'Chicken Egg (Raw)': 'egg',
  'Yogurt, Greek, plain, lowfat': 'plain Greek yogurt',
  'Pistachio nut': 'pistachio',
  'Squash, zucchini': 'zucchini',
  'Red Bell Pepper': 'red bell pepper',
  'Fennel Bulb': 'fennel bulb',
  'Maple Syrup (100% Pure)': 'maple syrup',
  'Common salt/table salt': 'salt',
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
  curated_snack_mediterranean_fennel_feta_egg_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the eggs and feta together.' },
  ],
  curated_snack_mediterranean_leek_feta_egg_skillet: [
    { nutrient: 'Vitamin K', note: 'A real, meaningful amount from the leek.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs and feta together.' },
  ],
  curated_snack_mediterranean_carrot_tomato_egg_skillet: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the carrot.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
  ],
  curated_snack_mediterranean_zucchini_tomato_feta_skillet: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the tomato.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs and feta together.' },
  ],
  curated_snack_mediterranean_pepper_zucchini_egg_skillet: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the red bell pepper.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
  ],
  curated_snack_mediterranean_fennel_zucchini_egg_skillet: [
    { nutrient: 'Potassium', note: 'A real, meaningful amount from the fennel and zucchini together.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
  ],
  curated_snack_greek_yogurt_strawberry_pistachio_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the strawberries.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_greek_yogurt_blueberry_olive_oil_bowl: [
    { nutrient: 'Manganese', note: 'A real, meaningful amount from the blueberries.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_greek_yogurt_grapefruit_olive_oil_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the grapefruit.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_greek_yogurt_apple_pistachio_bowl: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the apple.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_greek_yogurt_cantaloupe_olive_oil_bowl: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the cantaloupe.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
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

let block = '\n  // 2026-08-27, direct follow-up: "close the remaining Hashimoto\'s/IBD/\n' +
  '  // CKD Mediterranean and Paleo breakfast gaps." 11 more Mediterranean\n' +
  '  // breakfast recipes, reusing the same already-verified-clean palette\n' +
  '  // as the first Mediterranean batch, closing Hashimoto\'s own\n' +
  '  // Mediterranean-breakfast gap outright and over-closing IBD/CKD\'s.\n' +
  '  // See scripts/add_mediterranean_breakfast_batch2.py\'s header comment\n' +
  '  // for the full reasoning. safeForConditions/conditionCautions/\n' +
  '  // dietTags below are placeholders, replaced by the same real compute\n' +
  '  // pipeline every other batch already goes through.\n';

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
