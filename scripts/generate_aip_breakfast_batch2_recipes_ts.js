// Reads scripts/_aip_breakfast_batch2_data.json (written by scripts/
// add_aip_breakfast_batch2.py) and appends a matching lib/digest/
// recipes.ts DigestEntry block per recipe. Same established pattern as
// this session's earlier recipe-batch generators.
//
// Usage: node scripts/generate_aip_breakfast_batch2_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_aip_breakfast_batch2_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const DISPLAY_NAME = {
  'Chicken Breast (without skin)': 'chicken breast',
  'Turkey Breast (Raw)': 'turkey breast',
  'Beef Top Sirloin (Raw)': 'beef top sirloin',
  'Pork Fillet / Tenderloin (Raw)': 'pork tenderloin',
  'Salmon Fillet (Raw)': 'salmon fillet',
  'Halibut Fish (Raw)': 'halibut fillet',
  'Cod Fish': 'cod fillet',
  'Squash, zucchini': 'zucchini',
  'Fennel Bulb': 'fennel bulb',
  'Common salt/table salt': 'salt',
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
  curated_snack_chicken_broccoli_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the chicken breast.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_chicken_cabbage_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the chicken breast.' },
  ],
  curated_snack_chicken_kale_breakfast_hash: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the chicken breast.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
  ],
  curated_snack_chicken_zucchini_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the chicken breast.' },
  ],
  curated_snack_turkey_broccoli_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the turkey breast.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_turkey_cabbage_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the turkey breast.' },
  ],
  curated_snack_turkey_kale_breakfast_hash: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the turkey breast.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
  ],
  curated_snack_turkey_fennel_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the turkey breast.' },
  ],
  curated_snack_beef_fennel_breakfast_bowl: [
    { nutrient: 'Iron', note: 'A real, meaningful amount from the beef sirloin.' },
  ],
  curated_snack_pork_broccoli_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the pork tenderloin, a genuinely lean cut.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_salmon_kale_breakfast_bowl: [
    { nutrient: 'Omega-3 Fatty Acids', note: 'A real, meaningful amount from the salmon.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
  ],
  curated_snack_halibut_broccoli_breakfast_bowl: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the halibut.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the broccoli.' },
  ],
  curated_snack_cod_kale_breakfast_skillet: [
    { nutrient: 'Protein', note: 'A real, meaningful amount from the cod, for very little saturated fat.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the kale.' },
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
  '  // CKD Mediterranean and Paleo breakfast gaps." Confirmed directly: all\n' +
  '  // phase-1 AIP breakfast recipes are already safe for IBD/CKD too, and\n' +
  '  // every AIP recipe auto-earns Paleo, so closing the GENERAL AIP-\n' +
  '  // breakfast gap (17 of 30, uniform across all 19 conditions) directly\n' +
  '  // closes Paleo-breakfast for Hashimoto\'s/IBD/CKD too. 13 more AIP\n' +
  '  // recipes, closing the general gap to exactly 30. Two new proteins\n' +
  '  // verified completely clean for Hashimoto\'s/IBD/CKD: Chicken Breast\n' +
  '  // (without skin) and Turkey Breast (Raw) -- the "without skin" turkey\n' +
  '  // variant was tried first and found entirely hidden in this database,\n' +
  '  // caught before the pipeline ran by checking real ingredient\n' +
  '  // resolution directly, not assumed from the earlier flag check alone.\n' +
  '  // See scripts/add_aip_breakfast_batch2.py\'s header comment for the\n' +
  '  // full reasoning. safeForConditions/conditionCautions/dietTags below\n' +
  '  // are placeholders, replaced by the same real compute pipeline every\n' +
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
