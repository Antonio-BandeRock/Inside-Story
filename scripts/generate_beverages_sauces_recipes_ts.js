/* global __dirname */
// Reads scripts/_beverages_sauces_batch_data.json (written by
// scripts/add_beverages_sauces_batch.js) and appends a matching
// lib/digest/recipes.ts DigestEntry block per recipe. Same established
// pattern as scripts/generate_sides_snacks_recipes_ts.js, which this copies:
// a mapped display name keeps its case, and `yield` accounts for a recipe
// that makes more than one serving.
//
// Usage: node scripts/generate_beverages_sauces_recipes_ts.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '_beverages_sauces_batch_data.json');
const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');

const DATA = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const DISPLAY_NAME = {
  'Olive Oil (Extra Virgin)': 'olive oil',
  'Common salt/table salt': 'salt',
  'Pepper, black, ground': 'black pepper',
  'Spices, cinnamon, ground': 'ground cinnamon',
  'Spices, cardamom, ground': 'ground cardamom',
  'Spices, cloves, ground': 'ground cloves',
  'Spices, spearmint, fresh': 'fresh mint',
  'Turmeric, dried, ground': 'ground turmeric',
  'Parsley Spices': 'parsley',
  'Fresh Dill Weed': 'fresh dill',
  'Ginger root': 'fresh ginger',
  'Mustard, prepared, yellow': 'yellow mustard',
  'Maple Syrup (100% Pure)': 'maple syrup',
  'Standard Honey (Blossom Honey)': 'honey',
  'Red Bell Pepper': 'red bell pepper',
  'Cantaloupe Melon': 'cantaloupe',
  'Sour Cherry': 'sour cherries',
  'Coriander (cilantro)': 'cilantro',
  'Yogurt, Greek, plain, lowfat': 'plain Greek yogurt',
  'Milk, whole, 3.25% milkfat, with added vitamin D': 'whole milk',
  'Coconut milk': 'coconut milk',
  'Water, tap': 'water',
  'Vegetable stock': 'vegetable stock',
  'Arrowroot flour': 'arrowroot',
  'Green Tea (Brewed)': 'brewed green tea',
  'Black Tea (Brewed)': 'brewed black tea',
  'Herbal Tea (Chamomile / Peppermint / Rooibos / Mate)': 'brewed herbal tea',
  'Hibiscus / Fruit Tea (Unsweetened)': 'brewed hibiscus tea',
  'Brewed Black Coffee': 'brewed coffee',
  'Pure Cocoa / Cacao Powder (Unsweetened)': 'unsweetened cocoa powder',
  Beetroot: 'beet',
  Oats: 'rolled oats',
  Date: 'date',
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

// Written by hand per recipe, naming the nutrient the drink or sauce carries
// enough of to be worth saying and the ingredient it comes from. Two per
// recipe at most.
const NUTRITION_HIGHLIGHTS = {
  curated_bev_cucumber_mint_water: [
    { nutrient: 'Water', note: 'A full glass of it, with almost nothing else.' },
  ],
  curated_bev_strawberry_lemon_water: [
    { nutrient: 'Vitamin C', note: 'A little from the strawberries and lemon, more if you eat the berries after.' },
  ],
  curated_bev_warm_lemon_ginger: [
    { nutrient: 'Vitamin C', note: 'From the lemon juice, added after the water has cooled a little.' },
  ],
  curated_bev_chamomile_honey_lemon: [
    { nutrient: 'Caffeine', note: 'None. Chamomile is a flower, not a tea leaf.' },
  ],
  curated_bev_rooibos_cinnamon_latte: [
    { nutrient: 'Calcium', note: 'A modest amount from the milk.' },
    { nutrient: 'Caffeine', note: 'None. Rooibos is naturally caffeine-free.' },
  ],
  curated_bev_hibiscus_lime_iced_tea: [
    { nutrient: 'Vitamin C', note: 'From the lime juice and the hibiscus flowers.' },
  ],
  curated_bev_peach_iced_black_tea: [
    { nutrient: 'Polyphenols', note: 'The theaflavins of black tea, with no sugar to carry them.' },
  ],
  curated_bev_homemade_chai: [
    { nutrient: 'Calcium', note: 'A modest amount from the milk.' },
  ],
  curated_bev_cinnamon_cardamom_coffee: [
    { nutrient: 'Caffeine', note: 'About the same as a plain cup, since the spices add none.' },
  ],
  curated_bev_stovetop_hot_cocoa: [
    { nutrient: 'Calcium', note: 'A strong amount from a full cup of milk.' },
    { nutrient: 'Flavanols', note: 'From the unsweetened cocoa.' },
  ],
  curated_bev_stovetop_apple_cider: [
    { nutrient: 'Potassium', note: 'A modest amount pressed out of the apples.' },
  ],
  curated_bev_cranberry_orange_cooler: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the orange juice and cranberries.' },
  ],
  curated_bev_tart_cherry_cooler: [
    { nutrient: 'Potassium', note: 'A modest amount from the cherries.' },
    { nutrient: 'Vitamin C', note: 'From the lime juice.' },
  ],
  curated_bev_cantaloupe_agua_fresca: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the cantaloupe.' },
    { nutrient: 'Vitamin C', note: 'From the melon and the lime.' },
  ],
  curated_bev_blueberry_lemonade: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the lemon juice.' },
    { nutrient: 'Anthocyanins', note: 'The pigments that color the blueberries.' },
  ],
  curated_bev_pineapple_ginger_juice: [
    { nutrient: 'Vitamin C', note: 'A full day from the pineapple.' },
    { nutrient: 'Manganese', note: 'A strong amount, pineapple being one of the richest fruit sources.' },
  ],
  curated_bev_carrot_orange_ginger_juice: [
    { nutrient: 'Vitamin A', note: 'A strong amount from the carrots.' },
    { nutrient: 'Vitamin C', note: 'A strong amount from the orange.' },
  ],
  curated_bev_beet_apple_lemon_juice: [
    { nutrient: 'Folate', note: 'A solid amount from the beet.' },
    { nutrient: 'Nitrate', note: 'The dietary kind, from the beet.' },
  ],
  curated_bev_homemade_oat_milk: [
    { nutrient: 'Beta-glucan', note: 'The soluble oat fiber, some of which passes through the sieve.' },
  ],
  curated_bev_mango_lassi: [
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
    { nutrient: 'Vitamin C', note: 'A strong amount from the mango.' },
  ],
  curated_sauce_lemon_mustard_vinaigrette: [
    { nutrient: 'Monounsaturated fat', note: 'From the olive oil.' },
  ],
  curated_sauce_orange_ginger_dressing: [
    { nutrient: 'Vitamin C', note: 'From the orange and lime juice.' },
  ],
  curated_sauce_carrot_ginger_dressing: [
    { nutrient: 'Vitamin A', note: 'A solid amount from the carrot, and the oil helps it absorb.' },
  ],
  curated_sauce_yogurt_ranch: [
    { nutrient: 'Protein', note: 'From the Greek yogurt base.' },
    { nutrient: 'Calcium', note: 'A modest amount from the yogurt.' },
  ],
  curated_sauce_ginger_lime_marinade: [
    { nutrient: 'Vitamin C', note: 'From the lime juice.' },
  ],
  curated_sauce_lemon_garlic_herb_marinade: [
    { nutrient: 'Vitamin C', note: 'From the lemon juice.' },
  ],
  curated_sauce_tzatziki: [
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
    { nutrient: 'Calcium', note: 'A solid amount from the yogurt.' },
  ],
  curated_sauce_cucumber_mint_raita: [
    { nutrient: 'Protein', note: 'A solid amount from the Greek yogurt.' },
  ],
  curated_sauce_avocado_lime: [
    { nutrient: 'Monounsaturated fat', note: 'From the avocado.' },
    { nutrient: 'Potassium', note: 'A solid amount from the avocado.' },
  ],
  curated_sauce_tahini_ginger: [
    { nutrient: 'Calcium', note: 'A modest amount from the tahini.' },
    { nutrient: 'Magnesium', note: 'A modest amount from the tahini.' },
  ],
  curated_sauce_fresh_tomato_salsa: [
    { nutrient: 'Vitamin C', note: 'From the tomato and lime.' },
    { nutrient: 'Lycopene', note: 'From the raw tomato.' },
  ],
  curated_sauce_mango_salsa: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the mango and red pepper together.' },
  ],
  curated_sauce_parsley_chimichurri: [
    { nutrient: 'Vitamin K', note: 'A strong amount from the parsley.' },
    { nutrient: 'Vitamin C', note: 'From the parsley and lemon.' },
  ],
  curated_sauce_roasted_tomato_garlic: [
    { nutrient: 'Lycopene', note: 'Concentrated by roasting, and the oil helps it absorb.' },
    { nutrient: 'Vitamin C', note: 'A solid amount from the tomatoes.' },
  ],
  curated_sauce_roasted_red_pepper: [
    { nutrient: 'Vitamin C', note: 'A strong amount from the peppers, even after roasting.' },
    { nutrient: 'Vitamin A', note: 'A solid amount from the peppers.' },
  ],
  curated_sauce_coconut_ginger: [
    { nutrient: 'Manganese', note: 'A modest amount from the coconut milk.' },
  ],
  curated_sauce_onion_gravy: [
    { nutrient: 'Fiber', note: 'A little from the onions, and the gravy is gluten-free.' },
  ],
  curated_sauce_applesauce: [
    { nutrient: 'Fiber', note: 'Pectin from the apples, with no sugar added.' },
  ],
  curated_sauce_cranberry_orange: [
    { nutrient: 'Vitamin C', note: 'A solid amount from the cranberries and orange.' },
  ],
  curated_sauce_blueberry_maple: [
    { nutrient: 'Anthocyanins', note: 'From the blueberries.' },
    { nutrient: 'Manganese', note: 'A modest amount from the blueberries.' },
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
  '\n  // 2026-09-19, direct request: "Add more beverages and sauces." Both\n' +
    '  // bands held 4 recipes, the two thinnest on the System Recipes screen\n' +
    '  // after the sides and snacks batch the same day. 20 new beverages and\n' +
    '  // 20 new sauces, built from the palette the shipped condition pipeline\n' +
    '  // proved clean against all 19 conditions. See\n' +
    '  // scripts/add_beverages_sauces_batch.js for how that palette was\n' +
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
