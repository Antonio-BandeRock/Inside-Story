/* global __dirname */
// Checks lib/onHand.ts (2026-09-27, what is in the kitchen reaching a
// logged meal, the meal plan generator and a new grocery list), and that
// no sentence judges anybody.
//
// USAGE
//   node scripts/test_on_hand.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

function load(rel) {
  const file = path.join(ROOT, rel);
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const origResolve = Module._resolveFilename;
  mod.require = (request) => {
    if (request.startsWith('./')) return load(path.join(path.dirname(rel), request + '.ts'));
    return Module.prototype.require.call(mod, request);
  };
  void origResolve;
  mod._compile(out, file);
  return mod.exports;
}

const H = load('lib/onHand.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const FORBIDDEN = /\b(safe|should|good|bad|better|worse|too much|enough|great|well done|failed|real|genuine|genuinely)\b|[–—]| -- /i;
const sentences = [];
function clean(text) {
  sentences.push(text);
  return text;
}

// --- 1. A meal just logged ---------------------------------------------------
const stock = {
  lentils: [{ id: 'k1', source: 'kitchen', quantity: 500, unit: 'g', date: '2026-09-01' }],
  rice: [{ id: 'k2', source: 'kitchen', quantity: 100, unit: 'g', date: '2026-09-10' }],
  oil: [{ id: 'k3', source: 'kitchen', quantity: 2, unit: 'each', date: '2026-09-10' }],
  kraut: [{ id: 'f1', source: 'fermentation', quantity: 300, unit: 'g', date: '2026-09-05' }],
  bread: [{ id: '', source: 'purchase', quantity: 1, unit: 'each', date: '2026-09-20' }],
  tomato: [{ id: 'g1', source: 'garden', quantity: 900, unit: 'g', date: '2026-09-20' }],
};
const ingredients = [
  { key: 'i1', foodName: 'Lentils', amount: 200, unit: 'g' },
  { key: 'i2', foodName: 'Rice', amount: 250, unit: 'g' },
  { key: 'i3', foodName: 'Oil', amount: 15, unit: 'ml' },
  { key: 'i4', foodName: 'Kraut', amount: 50, unit: 'g' },
  { key: 'i5', foodName: 'Bread', amount: 1, unit: 'each' },
  { key: 'i6', foodName: 'Tomato', amount: 100, unit: 'g' },
  { key: 'i7', foodName: 'Lentils', amount: 400, unit: 'g' },
];
const offers = H.buildPantryOffers(ingredients, (i) => stock[i.foodName.toLowerCase()] ?? [], new Set(['kraut']));
const by = (k) => offers.find((o) => o.key === k);
ok(by('i1') && by('i1').takeable && by('i1').ticked && by('i1').line.startsWith('Takes 200'), 'a covered ingredient is offered ticked');
ok(by('i2') && by('i2').takeable && by('i2').line.includes('all that is left there'), 'a part-covered ingredient takes what is left');
ok(by('i3') && !by('i3').takeable && !by('i3').ticked, 'a unit that cannot be matched is shown and cannot be ticked');
ok(by('i4') && by('i4').takeable && !by('i4').ticked && by('i4').line.includes('starts unticked'), 'food already taken for a grocery list starts unticked');
ok(!by('i5'), 'a purchase with no amount is never offered');
ok(!by('i6'), 'garden pickings are left to the garden sheet');
ok(by('i7') && by('i7').line.includes('all that is left there'), 'stock an earlier row claimed is not offered twice');
ok(by('i7') && by('i7').draws.reduce((sum, d) => sum + d.quantity, 0) === 300, 'the later row gets only what is left (300 g)');
clean(H.describePantryOffer(offers));
clean(H.describePantryOffer([by('i3')]));
clean(H.describePantryOffer([by('i1')]));
clean(H.describePantryAction(0));
clean(H.describePantryAction(1));
clean(H.describePantryAction(3));
for (const offer of offers) clean(offer.line);

// --- 2. The meal plan generator ----------------------------------------------
// By amount since H1 (2026-09-28): one serving's share of each ingredient
// comes off a copy of the kitchen as each dish is picked.
const kitchen = {
  lentils: [{ id: 'k1', source: 'kitchen', quantity: 300, unit: 'g', date: '2026-09-01' }],
  carrot: [{ id: 'g1', source: 'garden', quantity: 400, unit: 'g', date: '2026-09-15' }],
  bread: [{ id: '', source: 'purchase', quantity: 1, unit: 'each', date: '2026-09-20' }],
  oats: [{ id: 'k4', source: 'kitchen', quantity: 500, unit: 'g', date: '2026-09-12' }],
};
const kitchenBefore = JSON.stringify(kitchen);
const rows = [
  // Soup: 2 servings, 400 g lentils and 200 g carrot, plus stock and onion.
  { recipeId: 'soup', category: 'Legumes', baseName: 'Lentils', quantity: 400, unit: 'g', servings: 2 },
  { recipeId: 'soup', category: 'Veg', baseName: 'Carrot', quantity: 200, unit: 'g', servings: 2 },
  { recipeId: 'soup', category: 'Veg', baseName: 'Onion', quantity: 100, unit: 'g', servings: 2 },
  // Dal: lentils is one of four ingredients.
  { recipeId: 'dal', category: 'Legumes', baseName: 'Lentils', quantity: 100, unit: 'g', servings: 1 },
  { recipeId: 'dal', category: 'Spice', baseName: 'Cumin', quantity: 1, unit: 'tsp', servings: 1 },
  { recipeId: 'dal', category: 'Veg', baseName: 'Onion', quantity: 50, unit: 'g', servings: 1 },
  { recipeId: 'dal', category: 'Veg', baseName: 'Garlic', quantity: 5, unit: 'g', servings: 1 },
  // Salad: carrot only, measured in cups, which grams cannot be compared with.
  { recipeId: 'salad', category: 'Veg', baseName: 'Carrot', quantity: 1, unit: 'cup', servings: 1 },
  { recipeId: 'toast', category: 'Grain', baseName: 'Bread', quantity: 1, unit: 'slice', servings: 1 },
  { recipeId: 'porridge', category: 'Grain', baseName: 'Oats', quantity: 50, unit: 'g', servings: 1 },
  { recipeId: 'porridge', category: 'Dairy', baseName: 'Milk', quantity: 200, unit: 'ml', servings: 1 },
];
const dishes = H.onHandByRecipe(rows, (row) => kitchen[row.baseName.toLowerCase()] ?? []);
ok(dishes.size === 4 && !dishes.has('toast'), 'only dishes using measured stock are kept; a purchase is not');
ok(dishes.get('soup').oldest === '2026-09-01' && dishes.get('soup').names.length === 2, 'a dish carries its names and oldest date');
ok(dishes.get('soup').needs[0].quantity === 200 && dishes.get('soup').ingredientCount === 3, 'an amount is per serving, and every ingredient is counted');
const pool = ['toast', 'dal', 'soup', 'porridge'];
const lean = H.newOnHandLean(dishes);
ok(JSON.stringify(H.leanTowardOnHand(pool, (x) => x, lean)) === '["soup"]', 'the dish the kitchen covers the most of wins');
H.claimOnHand(lean, 'soup', 'Lentil soup');
ok(JSON.stringify(lean.claims[0].names) === '["lentils","carrot"]', 'the claim names what the dish used');
ok(JSON.stringify(H.leanTowardOnHand(pool, (x) => x, lean)) === '["soup"]', 'with 100 g lentils left, the soup still leads (over half of it covered)');
H.claimOnHand(lean, 'soup', 'Lentil soup');
ok(JSON.stringify(H.leanTowardOnHand(['dal', 'porridge'], (x) => x, lean)) === '["porridge"]', 'once the lentils are used up, the dal no longer leads');
ok(JSON.stringify(kitchen) === kitchenBefore, 'the kitchen itself is never drawn down by the generator');
const lean2 = H.newOnHandLean(dishes);
ok(lean2.claims.length === 0 && JSON.stringify(H.leanTowardOnHand(['soup'], (x) => x, lean2)) === '["soup"]', 'a second run starts from the whole kitchen');
H.claimOnHand(lean2, 'salad', 'Carrot salad');
ok(lean2.claims.length === 1, 'an amount that cannot be compared still counts once');
ok(JSON.stringify(H.leanTowardOnHand(['salad', 'toast'], (x) => x, lean2)) === '["salad","toast"]', 'and then leads no further pick');
H.claimOnHand(lean2, 'toast', 'Toast');
ok(lean2.claims.length === 1, 'a dish using nothing on hand claims nothing');
ok(JSON.stringify(H.leanTowardOnHand(pool, (x) => x, undefined)) === JSON.stringify(pool), 'switch off leaves the pool as it was');
ok(H.onHandDayLine(undefined) === null && H.onHandDayLine([]) === null, 'no line when nothing was used');
clean(H.onHandDayLine(lean.claims.slice(0, 1)));
ok(H.onHandDayLine(lean.claims.slice(0, 1)) === 'Uses what is in your kitchen: Lentil soup (lentils, carrot).', 'the day line names dish and foods');
clean(H.ON_HAND_SWITCH_LABEL);
clean(H.ON_HAND_SWITCH_HELP);

// --- 2b. A grocery list built around the kitchen (H1) -------------------------
const G = load('lib/groceryList.ts');
const shelf = [
  { id: 'k1', source: 'kitchen', quantity: 300, unit: 'g', date: '2026-09-01' },
  { id: 'g1', source: 'garden', quantity: 100, unit: 'g', date: '2026-09-10' },
];
const whole = G.holdFromKitchen(250, 'g', shelf, '2026-09-28');
ok(whole && whole.level === 'covered' && whole.held === 250 && whole.toBuy === 0, 'a line the kitchen holds is left off');
const part = G.holdFromKitchen(250, 'g', shelf, '2026-09-28');
ok(part && part.level === 'some' && Math.abs(part.held - 150) < 1e-9 && Math.abs(part.toBuy - 100) < 1e-9, 'the next line gets only what is left, and buys the rest');
ok(G.holdFromKitchen(50, 'g', shelf, '2026-09-28') === null, 'an empty kitchen holds nothing back');
ok(G.holdFromKitchen(1, 'cup', [{ id: 'g2', source: 'garden', quantity: 500, unit: 'g', date: '2026-09-10' }], '2026-09-28') === null, 'grams never stand in for cups');
const ledger = [{ id: 'k9', source: 'kitchen', quantity: 1, unit: 'kg', date: '2026-09-01' }];
const oz = G.kitchenCoverageFor(8, 'oz', ledger, '2026-09-28');
ok(oz.level === 'covered' && Math.abs(oz.coveredQuantity - 8) < 1e-6, 'covered amount comes back in the line unit (8 oz, not grams)');
G.takeOutOfLedger(ledger, oz.draws);
ok(Math.abs(ledger[0].quantity - (1 - 8 * 28.349523125 / 1000)) < 1e-3, 'the ledger loses the same weight in its own unit');
ok(G.describeKitchenHolds(0, 0) === null, 'no header line when the kitchen changed nothing');
clean(G.describeKitchenHolds(1, 0));
clean(G.describeKitchenHolds(2, 1));
clean(G.describeKitchenHolds(0, 3));
clean(G.kitchenCoverageFor(1, 'cup', [{ id: 'g2', source: 'garden', quantity: 500, unit: 'g', date: '2026-09-10' }], '2026-09-28').note ?? '');

// --- 3. A new grocery list ---------------------------------------------------
clean(H.newListKitchenMessage([{ name: 'Lentils', level: 'covered' }]));
clean(H.newListKitchenMessage([{ name: 'Lentils', level: 'covered' }, { name: 'Rice', level: 'some' }, { name: 'Oats', level: 'covered' }]));
clean(H.newListKitchenMessage([{ name: 'Rice', level: 'some' }]));
ok(H.newListKitchenMessage([{ name: 'Rice', level: 'some' }]).includes('nothing is given a price'), 'the list sheet says nothing is priced');
clean(H.tookFromKitchenMessage(0, 0));
clean(H.tookFromKitchenMessage(1, 0));
clean(H.tookFromKitchenMessage(2, 1));
clean(H.tookFromKitchenMessage(1, 3));
ok(H.tookFromKitchenMessage(2, 1) === 'Took 3 lines from the kitchen. 1 line still has some left to buy.', 'the took message counts lines');
clean(H.TAKE_ALL_FROM_KITCHEN_LABEL);

for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + text.slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
