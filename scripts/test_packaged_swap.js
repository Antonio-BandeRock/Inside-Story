// Checks lib/packagedSwap.ts, G22: a scanned product is read as the right
// kind from Open Food Facts' tags (most specific first, broad aisle tags
// passed over), from USDA's category, or from its name; an unrecognised
// product is offered nothing; every kind reaches at least one recipe in the
// corpus and at least one visible food in the reference database; one food
// is picked per word; and every sentence stays clear of verdicts.
// Run: node scripts/test_packaged_swap.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const p = load('lib/packagedSwap.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const FORBIDDEN = /\b(safe|safer|unsafe|bad|should|must|healthy|healthier|unhealthy|real|genuine|genuinely|best|better|great|cause|caused|causes|because of|trigger|triggered|avoid)\b|[–—]| -- /i;
const sentences = [];
function clean(label, text) {
  sentences.push(text);
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text), text);
}

const kindOf = (tags, name) => p.swapKindFor(tags, name)?.kind.key ?? null;

// Tags.
ok('normalise', p.normaliseCategoryTag('en:breakfast-cereals') === 'breakfast cereals');
ok('phrase plural', p.containsPhrase('breakfast cereals', 'breakfast cereal'));
ok('phrase whole word', !p.containsPhrase('popcorn', 'pop') && !p.containsPhrase('hamburger', 'ham'));
ok('cereal', kindOf(['en:plant-based-foods-and-beverages', 'en:cereals-and-potatoes', 'en:breakfast-cereals'], 'Crunchy O') === 'breakfastCereal');
ok('pasta beats the broad cereal tag', kindOf(['en:cereals-and-potatoes', 'en:cereals-and-their-products', 'en:pastas'], 'Penne') === 'pasta');
ok('only a broad tag reads nothing', kindOf(['en:cereals-and-potatoes'], 'Thing') === null);
ok('cereal bars are bars', kindOf(['en:snacks', 'en:sweet-snacks', 'en:bars', 'en:cereal-bars'], 'Oat Crunch') === 'bar');
ok('most specific wins', kindOf(['en:beverages', 'en:plant-based-beverages', 'en:dairy-substitutes', 'en:plant-milks', 'en:almond-milks'], 'X') === 'plantMilk');
ok('soda', kindOf(['en:beverages', 'en:carbonated-drinks', 'en:sodas', 'en:colas'], 'Cola') === 'softDrink');
ok('yogurt', kindOf(['en:dairies', 'en:fermented-foods', 'en:fermented-milk-products', 'en:yogurts'], 'Greek') === 'yogurt');
ok('soup', kindOf(['en:meals', 'en:soups'], 'Tomato') === 'soup');
ok('ketchup', kindOf(['en:groceries', 'en:sauces', 'en:tomato-sauces', 'en:ketchup'], 'Ketchup') === 'sauce');
ok('crisps', kindOf(['en:snacks', 'en:salty-snacks', 'en:appetizers', 'en:chips-and-fries', 'en:crisps'], 'Sea Salt') === 'savourySnack');
ok('biscuits', kindOf(['en:snacks', 'en:sweet-snacks', 'en:biscuits-and-cakes', 'en:biscuits'], 'Digestive') === 'sweet');
ok('nut butter', kindOf(['en:spreads', 'en:plant-based-spreads', 'en:nut-butters', 'en:peanut-butters'], 'Smooth') === 'nutButter');
ok('sausage', kindOf(['en:meats', 'en:prepared-meats', 'en:sausages'], 'Bratwurst') === 'processedMeat');
ok('pizza', kindOf(['en:meals', 'en:pizzas-pies-and-quiches', 'en:pizzas'], 'Margherita') === 'readyMeal');
ok('sauerkraut', kindOf(['en:fermented-foods', 'en:sauerkraut'], 'Kraut') === 'pickle');
ok('bread', kindOf(['en:cereals-and-potatoes', 'en:breads', 'en:sliced-breads'], 'Loaf') === 'bread');
ok('ice cream', kindOf(['en:desserts', 'en:frozen-desserts', 'en:ice-creams'], 'Vanilla') === 'iceCream');
ok('juice', kindOf(['en:beverages', 'en:fruit-based-beverages', 'en:juices-and-nectars', 'en:fruit-juices', 'en:orange-juices'], 'OJ') === 'juice');
ok('jam', kindOf(['en:spreads', 'en:sweet-spreads', 'en:fruit-spreads', 'en:jams'], 'Strawberry') === 'jam');

// USDA's brandedFoodCategory, one entry.
ok('usda cereal', kindOf(['Cereal'], 'Toasted Oats') === 'breakfastCereal');
ok('usda soda', kindOf(['Soda'], 'Grape') === 'softDrink');
ok('usda chips', kindOf(['Chips, Pretzels & Snacks'], 'Corn') === 'savourySnack');
ok('usda bars', kindOf(['Snack, Energy & Granola Bars'], 'Choc Chip') === 'bar');
ok('usda frozen dinners', kindOf(['Frozen Dinners & Entrees'], 'Lasagna') === 'readyMeal');
ok('usda hot dogs', kindOf(['Sausages, Hotdogs & Brats'], 'Franks') === 'processedMeat');
ok('usda nut butters', kindOf(['Peanut & Other Nut Butters'], 'Creamy') === 'nutButter');
ok('usda plant milk', kindOf(['Plant Based Milk'], 'Oat') === 'plantMilk');

// The name when nothing is tagged.
ok('name granola', kindOf([], 'Honey Almond Granola') === 'breakfastCereal');
ok('name popcorn is a snack, not a soda', kindOf([], 'Butter Popcorn') === 'savourySnack');
ok('name almond meal is nothing', kindOf([], 'Almond Meal') === null);
ok('from says name', p.swapKindFor([], 'Tomato Soup').from === 'name');
ok('from says category', p.swapKindFor(['en:soups'], 'X').from === 'category');
ok('nothing at all', p.swapKindFor([], '') === null && p.swapKindFor([], null) === null);

// Every kind reaches the corpus: a recipe by builder, title or main, and
// the keys are unique.
const recipesSrc = fs.readFileSync(path.join(__dirname, '..', 'lib/digest/recipes.ts'), 'utf8');
const recipeIds = [...recipesSrc.matchAll(/id: '(recipe-[^']+)',\s*\n\s*category: 'recipes',\s*\n\s*title: '((?:[^'\\]|\\.)*)'/g)];
const recipes = [];
for (const m of recipeIds) {
  const tail = recipesSrc.slice(m.index, m.index + 4000);
  const builder = tail.match(/linkedBuilderType: '([a-zA-Z]+)'/)?.[1];
  const curated = tail.match(/linkedCuratedRecipeId: '([^']+)'/)?.[1];
  recipes.push({ id: m[1], title: m[2], builder, curatedRecipeId: curated });
}
ok('recipes read from the corpus', recipes.length > 400, recipes.length);
const roleSrc = fs.readFileSync(path.join(__dirname, '..', 'lib/recipeDishRole.ts'), 'utf8');
const sideBlock = roleSrc.slice(roleSrc.indexOf('SIDE_DISH_RECIPE_IDS'), roleSrc.indexOf(']);', roleSrc.indexOf('SIDE_DISH_RECIPE_IDS')));
const sideIds = new Set([...sideBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]));
const isSide = (id) => (id ? sideIds.has(id) : false);
const keys = new Set();
for (const kind of p.SWAP_KINDS) {
  ok(`${kind.key} unique`, !keys.has(kind.key));
  keys.add(kind.key);
  const found = p.pickSwapRecipes(kind, recipes, () => true, isSide, 4);
  ok(`${kind.key} reaches a recipe`, found.length > 0, kind.key);
  clean(`${kind.key} lead`, p.swapLeadLine({ kind, from: 'category' }));
  clean(`${kind.key} lead by name`, p.swapLeadLine({ kind, from: 'name' }));
  clean(`${kind.key} nothing clears`, p.swapNothingClearsLine({ kind, from: 'category' }));
}
const cereal = p.SWAP_KINDS.find((k) => k.key === 'breakfastCereal');
const cerealPicks = p.pickSwapRecipes(cereal, recipes, () => true, isSide, 4);
ok('cereal picks porridge and oats', cerealPicks.every((r) => /oat|porridge|granola|muesli/i.test(r.title)), cerealPicks.map((r) => r.title));
ok('a recipe the check refuses is left out', p.pickSwapRecipes(cereal, recipes, () => false, isSide).length === 0);

// Every kind reaches a visible food in the reference database, when there is one.
const dbPath = path.join(__dirname, '..', 'assets/data/foods_reference.db');
if (fs.existsSync(dbPath)) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  for (const kind of p.SWAP_KINDS) {
    for (const group of kind.foods) {
      for (const word of group.words) {
        const row = db.prepare('SELECT COUNT(*) AS n FROM foods WHERE hidden = 0 AND category = ? AND lower(base_name) LIKE ?').get(group.category, `%${word}%`);
        ok(`${kind.key} ${group.category} "${word}" is in the database`, row.n > 0, row.n);
      }
    }
  }
  db.close();
} else {
  console.log('(reference database not present, food words not checked)');
}

// One food per word, shortest name, no repeats, capped.
const foods = [
  { baseName: 'Oat flour', category: 'Grain' },
  { baseName: 'Oats', category: 'Grain' },
  { baseName: 'Oat bran', category: 'Grain' },
  { baseName: 'Buckwheat groats', category: 'Grain' },
  { baseName: 'Buckwheat', category: 'Grain' },
  { baseName: 'Chia seeds', category: 'NutSeed' },
  { baseName: 'Oats', category: 'NutSeed' },
];
const picked = p.pickSwapFoods(cereal, foods, 6).map((f) => f.baseName);
ok('one per word, shortest', JSON.stringify(picked) === JSON.stringify(['Oats', 'Buckwheat', 'Chia seeds']), picked);
ok('word starts a word', p.nameHoldsWord('Oats', 'oat') && !p.nameHoldsWord('Pepeao', 'pea') && !p.nameHoldsWord('Buckwheat', 'wheat'));
const meat = p.SWAP_KINDS.find((k) => k.key === 'processedMeat');
const meatPicks = p.pickSwapFoods(meat, [{ baseName: 'Turkey Bacon', category: 'Meat' }, { baseName: 'Turkey Breast (Raw)', category: 'Meat' }]).map((f) => f.baseName);
ok('a made food is passed over', JSON.stringify(meatPicks) === JSON.stringify(['Turkey Breast (Raw)']), meatPicks);
ok('capped', p.pickSwapFoods(cereal, foods, 2).length === 2);

// Captions.
clean('no kind', p.SWAP_NO_KIND_LINE);
const nothingSet = p.swapCaption({ conditions: 0, eatingStyle: false, allergies: false, restrictions: false });
ok('nothing set says so', /Nothing is set/.test(nothingSet), nothingSet);
clean('caption, nothing set', nothingSet);
const all = p.swapCaption({ conditions: 2, eatingStyle: true, allergies: true, restrictions: true });
ok('all four named', /your conditions, your eating style, your allergies and your food restrictions/.test(all) && /can miss/.test(all), all);
clean('caption, all', all);
const one = p.swapCaption({ conditions: 1, eatingStyle: false, allergies: false, restrictions: false });
ok('one condition singular', /against your condition,/.test(one), one);
clean('caption, one', one);
clean('title', p.SWAP_BAND_TITLE);

// The band's own words.
const band = fs.readFileSync(path.join(__dirname, '..', 'components/MadeAtHomeBand.tsx'), 'utf8');
for (const literal of band.match(/>([^<>{}]{12,})</g) || []) clean('band text', literal.slice(1, -1).trim());
ok('the scan report shows the band', /<MadeAtHomeBand /.test(fs.readFileSync(path.join(__dirname, '..', 'components/ScanProductView.tsx'), 'utf8')));

if (failures > 0) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log(`packagedSwap: all checks passed (${sentences.length} sentences swept)`);
