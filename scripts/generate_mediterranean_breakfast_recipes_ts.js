// Reads scripts/_mediterranean_breakfast_data.json (written by scripts/
// add_mediterranean_breakfast_batch.py) and appends a matching lib/
// digest/recipes.ts DigestEntry block per recipe. Same established
// pattern as the two earlier same-day recipe-batch generators.
//
// Usage: node scripts/generate_mediterranean_breakfast_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_mediterranean_breakfast_data.json');
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
  'Spices, cinnamon, ground': 'cinnamon',
  'Coriander (cilantro) leaves': 'cilantro',
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
    const label = quantity === 1 ? name : `${name}s`;
    qtyUnit = `${qty} ${label}`;
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
  curated_snack_greek_yogurt_olive_oil_pistachio_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the Greek yogurt.' },
    { nutrient: 'Healthy Fats', note: 'A solid amount of monounsaturated fat from the olive oil and pistachio.' },
  ],
  curated_snack_mediterranean_egg_tomato_zucchini_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the eggs.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the tomato.' },
  ],
  curated_snack_mediterranean_feta_tomato_egg_scramble: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the eggs and feta together.' },
  ],
  curated_snack_greek_yogurt_berry_olive_oil_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the Greek yogurt.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the strawberries.' },
  ],
  curated_snack_mediterranean_tomato_pepper_egg_skillet: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the tomato and red bell pepper together.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
  ],
  curated_snack_greek_yogurt_citrus_pistachio_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the orange and grapefruit together.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_mediterranean_zucchini_feta_egg_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the eggs and feta together.' },
  ],
  curated_snack_greek_yogurt_banana_pistachio_bowl: [
    { nutrient: 'Potassium', note: 'A real, meaningful amount from the banana.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_mediterranean_fennel_tomato_egg_skillet: [
    { nutrient: 'Potassium', note: 'A real, meaningful amount from the fennel and tomato together.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
  ],
  curated_snack_greek_yogurt_apple_cinnamon_olive_oil_bowl: [
    { nutrient: 'Fiber', note: 'A real, meaningful amount from the apple.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_mediterranean_leek_tomato_egg_skillet: [
    { nutrient: 'Vitamin K', note: 'A real, meaningful amount from the leek.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
  ],
  curated_snack_greek_yogurt_cantaloupe_pistachio_bowl: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the cantaloupe.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_mediterranean_pepper_feta_egg_skillet: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the red bell pepper.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs and feta together.' },
  ],
  curated_snack_greek_yogurt_tropical_olive_oil_bowl: [
    { nutrient: 'Vitamin C', note: 'A real, meaningful amount from the orange.' },
    { nutrient: 'Potassium', note: 'A solid amount from the banana.' },
  ],
  curated_snack_mediterranean_carrot_zucchini_egg_skillet: [
    { nutrient: 'Vitamin A', note: 'A real, meaningful amount from the carrot.' },
    { nutrient: 'Protein', note: 'A solid amount from the eggs.' },
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

let block = '\n  // 2026-08-27, Open Next Steps item 20, phase 2: the real, structural,\n' +
  '  // condition-agnostic Mediterranean breakfast shortage (4 recipes for\n' +
  '  // Hashimoto\'s, 16 for every other condition, against the 30-minimum\n' +
  '  // bar), left untouched by phase 1\'s AIP-focused batch since\n' +
  '  // Mediterranean needs a genuinely different palette (olive oil\n' +
  '  // present, no red meat) from AIP\'s dairy-free/egg-free one. 15 new\n' +
  '  // recipes: 8 savory olive-oil-and-egg skillets plus 7 Greek-yogurt-\n' +
  '  // and-olive-oil bowls, every ingredient individually checked against\n' +
  '  // this app\'s reference database for Hashimoto\'s before being used.\n' +
  '  // Walnut and dried basil/oregano were considered and excluded after\n' +
  '  // direct verification (a real "Mineral Binding Risk: High" or\n' +
  '  // "Iron, contextual: Excess Risk" flag respectively), the same\n' +
  '  // still-open data question already named in this app\'s own history.\n' +
  '  // See scripts/add_mediterranean_breakfast_batch.py\'s header comment\n' +
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
