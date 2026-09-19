/* global __dirname */
// Reads scripts/_sides_snacks_batch_data.json (written by
// scripts/add_sides_snacks_batch.js) and appends a matching
// lib/digest/recipes.ts DigestEntry block per recipe. Same established
// pattern as every earlier recipe-batch generator.
//
// Two departures from the earlier generators, both deliberate:
//   - displayName no longer lowercases a name it was given a mapping for,
//     so "plain Greek yogurt" survives as written instead of arriving as
//     "plain greek yogurt". Unmapped names still get lowercased.
//   - `yield` accounts for a recipe that makes more than one serving. The
//     earlier generators hardcoded "Makes 1 <unit>." because every recipe
//     in those batches made one. Several here make two, three or four.
//
// Usage: node scripts/generate_sides_snacks_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_sides_snacks_batch_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const DISPLAY_NAME = {
  'Olive Oil (Extra Virgin)': 'olive oil',
  'Common salt/table salt': 'salt',
  'Pepper, black, ground': 'black pepper',
  'Spices, cinnamon, ground': 'ground cinnamon',
  'Turmeric, dried, ground': 'ground turmeric',
  'Parsley Spices': 'parsley',
  'Fresh Dill Weed': 'fresh dill',
  'Ginger root': 'fresh ginger',
  'Vinegar, cider': 'cider vinegar',
  'Maple Syrup (100% Pure)': 'maple syrup',
  'Standard Honey (Blossom Honey)': 'honey',
  'Squash, zucchini': 'zucchini',
  'Squash, winter, butternut': 'butternut squash',
  'Snap Beans (Green Beans)': 'green beans',
  'Red Bell Pepper': 'red bell pepper',
  'Fennel Bulb': 'fennel bulb',
  'Brussels sprout': 'Brussels sprouts',
  'Cantaloupe Melon': 'cantaloupe',
  'Grains, rice, brown, long-grain, dry': 'brown rice',
  'Rice, long grain, paddy rice, well-milled, raw': 'white rice',
  'Cornmeal, whole-grain, yellow': 'whole-grain cornmeal',
  'Sorghum grain': 'sorghum',
  'Chickpeas (garbanzo beans, bengal gram)': 'chickpeas',
  'Yogurt, Greek, plain, lowfat': 'plain Greek yogurt',
  'Water, tap': 'water',
  Beetroot: 'beet',
  Oats: 'rolled oats',
};

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.125: '⅛' };

function displayName(baseName) {
  const mapped = DISPLAY_NAME[baseName];
  return mapped !== undefined ? mapped : baseName.toLowerCase();
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

function yieldLine(r) {
  if (r.servings === 1) return `Makes 1 ${r.servingSizeUnit}.`;
  return `Makes ${r.servings} servings.`;
}

function slugify(id) {
  return 'recipe-' + id.replace(/^curated_/, '').replace(/_/g, '-');
}

// Written by hand per recipe, naming the nutrient the dish carries enough of
// to be worth saying and the ingredient it comes from. Two per recipe at
// most, because a list of eight reads as a label rather than a highlight.
const NUTRITION_HIGHLIGHTS = {
  curated_side_maple_roasted_carrots: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the carrots, and the oil helps it absorb.' },
  ],
  curated_side_roasted_brussels_lemon: [
    { nutrient: 'Vitamin K', note: 'A strong amount from the sprouts.' },
    { nutrient: 'Vitamin C', note: 'From the sprouts and the lemon juice added off the heat.' },
  ],
  curated_side_roasted_butternut_cinnamon: [
    { nutrient: 'Vitamin A', note: 'One of the densest sources in the vegetable aisle.' },
    { nutrient: 'Potassium', note: 'A solid amount from the squash.' },
  ],
  curated_side_roasted_beets_orange: [
    { nutrient: 'Folate', note: 'A solid amount from the beets.' },
    { nutrient: 'Vitamin C', note: 'From the orange juice stirred in at the end.' },
  ],
  curated_side_roasted_fennel_pepper: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the red bell pepper.' },
    { nutrient: 'Potassium', note: 'A solid amount from the fennel.' },
  ],
  curated_side_roasted_turnips_rosemary: [
    { nutrient: 'Vitamin C', note: 'A solid amount from the turnips.' },
    { nutrient: 'Fiber', note: 'From the turnip, at a lower starch load than potato.' },
  ],
  curated_side_sweet_potato_wedges: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the sweet potato.' },
    { nutrient: 'Fiber', note: 'Higher here because the skin stays on.' },
  ],
  curated_side_roasted_zucchini_garlic: [
    { nutrient: 'Potassium', note: 'A solid amount from the zucchini.' },
  ],
  curated_side_sauteed_kale_lemon: [
    { nutrient: 'Vitamin K', note: 'A strong amount from the kale.' },
    { nutrient: 'Vitamin C', note: 'From the lemon juice, added off the heat so it survives.' },
  ],
  curated_side_braised_cabbage_apple: [
    { nutrient: 'Fiber', note: 'From the cabbage and the apple pectin together.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the cabbage.' },
  ],
  curated_side_garlicky_green_beans: [
    { nutrient: 'Vitamin K', note: 'A solid amount from the beans.' },
    { nutrient: 'Folate', note: 'From the green beans, kept by the short cook.' },
  ],
  curated_side_skillet_asparagus_lemon: [
    { nutrient: 'Folate', note: 'A strong amount from the asparagus.' },
    { nutrient: 'Fiber', note: 'Including inulin, which gut bacteria ferment.' },
  ],
  curated_side_sauteed_leeks_carrots: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the carrot.' },
    { nutrient: 'Fiber', note: 'Including the prebiotic fructans in the leek.' },
  ],
  curated_side_broccoli_ginger: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the broccoli, kept by the short cook.' },
    { nutrient: 'Vitamin K', note: 'A solid amount from the broccoli.' },
  ],
  curated_side_roasted_cauliflower_turmeric: [
    { nutrient: 'Vitamin C', note: 'A solid amount from the cauliflower.' },
    { nutrient: 'Fiber', note: 'From the cauliflower.' },
  ],
  curated_side_lemon_herb_brown_rice: [
    { nutrient: 'Magnesium', note: 'From the bran the whole grain keeps.' },
    { nutrient: 'Fiber', note: 'Several times what white rice carries.' },
  ],
  curated_side_creamy_polenta: [
    { nutrient: 'Fiber', note: 'From the germ and bran the whole-grain cornmeal keeps.' },
    { nutrient: 'Magnesium', note: 'A solid amount from the cornmeal.' },
  ],
  curated_side_sorghum_pilaf: [
    { nutrient: 'Fiber', note: 'More than white rice carries, from a gluten-free whole grain.' },
    { nutrient: 'Iron', note: 'A solid amount from the sorghum.' },
  ],
  curated_side_coconut_rice: [
    { nutrient: 'Manganese', note: 'A solid amount from the coconut milk.' },
  ],
  curated_side_mashed_sweet_potato_lime: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the sweet potato.' },
    { nutrient: 'Potassium', note: 'A solid amount from the sweet potato.' },
  ],
  curated_side_cabbage_carrot_slaw: [
    { nutrient: 'Vitamin C', note: 'Higher here than in a cooked cabbage dish, since nothing is heated.' },
    { nutrient: 'Vitamin A', note: 'From the carrot, absorbing better alongside the oil.' },
  ],
  curated_side_cucumber_dill_salad: [
    { nutrient: 'Potassium', note: 'A modest amount, in a side that is mostly water.' },
  ],
  curated_side_fennel_apple_slaw: [
    { nutrient: 'Fiber', note: 'From the raw fennel and the apple together.' },
    { nutrient: 'Vitamin C', note: 'From the lemon juice and the fennel.' },
  ],
  curated_side_lemon_garlic_chickpeas: [
    { nutrient: 'Protein', note: 'A solid plant amount from the chickpeas.' },
    { nutrient: 'Fiber', note: 'Mostly soluble, which is the kind gut bacteria use.' },
  ],
  curated_side_stewed_lentils_carrot: [
    { nutrient: 'Protein', note: 'A solid plant amount from the lentils.' },
    { nutrient: 'Iron', note: 'From the lentils, in a side substantial enough to stand in for a starch.' },
  ],
  curated_snack_kale_chips: [
    { nutrient: 'Vitamin K', note: 'A strong amount from the kale.' },
    { nutrient: 'Sodium', note: 'A fraction of what a bagged chip carries, since you salted it yourself.' },
  ],
  curated_snack_zucchini_chips: [
    { nutrient: 'Potassium', note: 'A modest amount from the zucchini.' },
  ],
  curated_snack_sweet_potato_chips: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the sweet potato.' },
    { nutrient: 'Fiber', note: 'From the sweet potato, which a fried chip also carries but with far more fat.' },
  ],
  curated_snack_cucumber_tahini_rounds: [
    { nutrient: 'Calcium', note: 'A solid amount from the sesame in the tahini.' },
    { nutrient: 'Magnesium', note: 'From the tahini.' },
  ],
  curated_snack_rosemary_oat_crackers: [
    { nutrient: 'Fiber', note: 'Including oat beta-glucan, tied to cholesterol handling.' },
  ],
  curated_snack_frozen_banana_coins: [
    { nutrient: 'Potassium', note: 'A solid amount from one whole banana.' },
  ],
  curated_snack_apple_cinnamon_slices: [
    { nutrient: 'Fiber', note: 'Apple pectin, a soluble fiber gut bacteria ferment.' },
  ],
  curated_snack_orange_date_bites: [
    { nutrient: 'Potassium', note: 'A strong amount from the dates.' },
    { nutrient: 'Fiber', note: 'From the dates, arriving alongside their sugar rather than after it.' },
  ],
  curated_snack_melon_lime_cups: [
    { nutrient: 'Vitamin A', note: 'One of the highest fruit sources, from the cantaloupe.' },
    { nutrient: 'Vitamin C', note: 'From the cantaloupe and the lime juice.' },
  ],
  curated_snack_berry_coconut_cups: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the strawberries.' },
    { nutrient: 'Manganese', note: 'From the blueberries.' },
  ],
  curated_snack_pear_ginger_yogurt: [
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
    { nutrient: 'Fiber', note: 'From the pear, higher because the skin stays on.' },
  ],
  curated_snack_grapefruit_honey: [
    { nutrient: 'Vitamin C', note: 'Most of a day of it in one serving.' },
  ],
  curated_snack_carrot_tahini_dip: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the carrot, absorbing better with the sesame fat.' },
    { nutrient: 'Calcium', note: 'From the tahini.' },
  ],
  curated_snack_hummus_cucumber: [
    { nutrient: 'Protein', note: 'A solid plant amount from the chickpeas and tahini together.' },
    { nutrient: 'Fiber', note: 'Mostly soluble, from the chickpeas.' },
  ],
  curated_snack_beet_yogurt_dip: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the red bell pepper.' },
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_snack_avocado_lime_bowl: [
    { nutrient: 'Monounsaturated fat', note: 'The fat that makes this hold you past the next hour.' },
    { nutrient: 'Potassium', note: 'A strong amount from the avocado.' },
  ],
  curated_snack_date_oat_bites: [
    { nutrient: 'Fiber', note: 'Oat beta-glucan and date fiber together.' },
    { nutrient: 'Potassium', note: 'A solid amount from the dates.' },
  ],
  curated_snack_banana_oat_bars: [
    { nutrient: 'Fiber', note: 'From the oats, including beta-glucan.' },
    { nutrient: 'Potassium', note: 'A solid amount from the bananas.' },
  ],
  curated_snack_coconut_date_balls: [
    { nutrient: 'Fiber', note: 'From the dates and oats together.' },
    { nutrient: 'Potassium', note: 'A strong amount from the dates.' },
  ],
  curated_snack_maple_oat_clusters: [
    { nutrient: 'Fiber', note: 'Including oat beta-glucan.' },
    { nutrient: 'Added sugar', note: 'One tablespoon of maple syrup across the whole batch.' },
  ],
};

const source = fs.readFileSync(RECIPES_TS, 'utf8');

const alreadyPresent = DATA.filter((r) => source.includes(`linkedCuratedRecipeId: '${r.id}',`));
if (alreadyPresent.length > 0) {
  console.error(
    `Refusing to run: ${alreadyPresent.length} of these ids already exist in recipes.ts ` +
      `(${alreadyPresent.map((r) => r.id).join(', ')}). Remove the existing entries first if ` +
      `you mean to regenerate them, so nothing gets silently duplicated.`,
  );
  process.exit(1);
}

// This file is mixed CRLF and LF already, because every earlier generator
// wrote \n into a CRLF file. Match whichever dominates rather than adding
// to the mixture blindly.
const crlf = (source.split('\r\n').length - 1) * 2 > source.split('\n').length;
const eol = crlf ? '\r\n' : '\n';
const lines = (text) => text.split('\n').join(eol);

let block = lines(
  '\n  // 2026-09-19, direct request: "Add more side dishes and snacks." Sides\n' +
    '  // held 5 and Snacks held 4, both too thin to be worth opening, and in\n' +
    '  // the case of Sides too thin for the meal planner to pair from. 25 new\n' +
    '  // side dishes and 20 new snacks, built from the palette the shipped\n' +
    '  // condition pipeline proved clean against all 19 conditions. See\n' +
    '  // scripts/add_sides_snacks_batch.js for how that palette was\n' +
    '  // derived. dietTags/safeForConditions/conditionCautions below are\n' +
    '  // placeholders, filled in by the same compute pipeline every other\n' +
    '  // batch goes through.\n',
);

for (const r of DATA) {
  const digestId = slugify(r.id);
  const ingredientLines = r.ingredients
    .map((ing) => `        { text: '${unitPhrase(ing).replace(/'/g, "\\'")}' },`)
    .join('\n');
  const instructionLines = r.instructions.map((step) => `        '${step.replace(/'/g, "\\'")}',`).join('\n');
  const highlights = NUTRITION_HIGHLIGHTS[r.id];
  if (!highlights) throw new Error(`No nutritionHighlights defined for ${r.id}`);
  const highlightLines = highlights
    .map((h) => `        { nutrient: '${h.nutrient.replace(/'/g, "\\'")}', note: '${h.note.replace(/'/g, "\\'")}' },`)
    .join('\n');
  block += lines(`  {
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
      yield: '${yieldLine(r)}',
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
`);
}

const closeIdx = source.lastIndexOf(`${eol}];`);
if (closeIdx === -1) throw new Error('Could not find insertion point');
const newSource = source.slice(0, closeIdx) + eol + block + source.slice(closeIdx);
fs.writeFileSync(RECIPES_TS, newSource, 'utf8');
console.log(`Added ${DATA.length} DigestEntry blocks, ${crlf ? 'CRLF' : 'LF'} line endings.`);
