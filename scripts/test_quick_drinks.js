// Checks lib/quickDrinks.ts, Hydration's one-tap drinks and caffeine line
// (G34): every button is tied to a row of the reference food data that
// carries water and a caffeine figure, water is never logged against a tap
// water row, a tap logs a beverage in ml at this minute, the caffeine line
// tells nothing logged apart from 0, and every sentence is swept for
// verdict words, since the line must never call a day's caffeine too much.
// Run: node scripts/test_quick_drinks.js
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
const quick = load('lib/quickDrinks.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too much|too many|limit|over|under|excess\w*|great|well done|dangerous|diagnos\w*)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text), text);
}

// --- Every button resolves in the reference data -----------------------------
const dbPath = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');
if (fs.existsSync(dbPath)) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  for (const drink of quick.QUICK_DRINKS) {
    const [id, source] = drink.foodId.split('|');
    const food = db.prepare('SELECT name, category FROM foods WHERE food_id = ? AND source = ?').get(Number(id), source);
    ok(`${drink.key} is in the food data`, food != null, drink.foodId);
    if (!food) continue;
    ok(`${drink.key} is a Bev, so ml converts`, food.category === 'Bev', food);
    ok(`${drink.key} is never a tap water row`, !(/\btap\b/i.test(food.name) && /^(Beverages, )?water/i.test(food.name)), food.name);
    const codes = db
      .prepare("SELECT nutrient_code FROM food_nutrients WHERE food_id = ? AND source = ? AND nutrient_code IN ('water', 'caffeine')")
      .all(Number(id), source)
      .map((row) => row.nutrient_code);
    ok(`${drink.key} carries water and caffeine`, codes.includes('water') && codes.includes('caffeine'), codes);
  }
  db.close();
} else {
  console.log('test_quick_drinks: reference database not present, food data checks skipped');
}

// --- What a tap logs --------------------------------------------------------------
{
  const glass = quick.QUICK_DRINKS.find((drink) => drink.key === 'water-glass');
  ok('water is filtered or bottled by name', /filtered/i.test(glass.foodName) && !/\btap\b/i.test(glass.foodName));
  const meal = quick.quickDrinkMeal(glass, new Date(2026, 8, 27, 15, 40));
  ok('a beverage', meal.mealType === 'beverage' && meal.isImmediate === true);
  ok('logged at this minute, local', meal.eatenAt === '2026-09-27T15:40', meal.eatenAt);
  ok('one ingredient in ml', meal.ingredients.length === 1 && meal.ingredients[0].unit === 'ml' && meal.ingredients[0].quantity === 250, meal.ingredients);
  ok('Bev category for the ml conversion', meal.ingredients[0].category === 'Bev');
  ok('the whole of it is the person\'s', meal.ingredients[0].yourSharePercent === 100 && meal.ingredients[0].dishServings === 1);
  const line = quick.loggedLine(glass, new Date(2026, 8, 27, 15, 40));
  ok('logged line', line === 'Logged a glass of water at 3:40 PM.', line);
  clean('logged line', line);
  const keys = new Set(quick.QUICK_DRINKS.map((drink) => drink.key));
  ok('keys are unique', keys.size === quick.QUICK_DRINKS.length);
  for (const drink of quick.QUICK_DRINKS) {
    clean(`${drink.key} label`, drink.label);
    ok(`${drink.key} size says ml`, drink.sizeLabel === `${drink.milliliters} ml`, drink);
  }
}

// --- The caffeine line -----------------------------------------------------------
{
  ok('no totals is nothing logged', quick.caffeineToday(undefined) === null);
  ok('no caffeine key is nothing logged', quick.caffeineToday({ water: 500 }) === null);
  ok('a zero is a zero', quick.caffeineToday({ caffeine: 0 }) === 0);
  ok('a figure', quick.caffeineToday({ caffeine: 191.6 }) === 191.6);
  ok('never below zero', quick.caffeineToday({ caffeine: -2 }) === 0);
  const none = quick.caffeineLine(null);
  const zero = quick.caffeineLine(0);
  const some = quick.caffeineLine(191.6);
  ok('nothing logged differs from 0', none !== zero, [none, zero]);
  ok('figure rounded with mg', some === 'Caffeine today: 192 mg in what you have logged.', some);
  clean('none line', none);
  clean('zero line', zero);
  clean('some line', some);
  clean('big line', quick.caffeineLine(900));
}

clean('buttons caption', quick.QUICK_DRINKS_CAPTION);
clean('caffeine caption', quick.CAFFEINE_CAPTION);

console.log(failures === 0 ? `test_quick_drinks: all passed (${swept} sentences swept)` : `test_quick_drinks: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
