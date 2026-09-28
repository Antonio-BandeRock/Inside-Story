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
const dishes = H.onHandByRecipe(
  [
    { recipeId: 'soup', category: 'Legumes', baseName: 'Lentils' },
    { recipeId: 'soup', category: 'Veg', baseName: 'Carrot' },
    { recipeId: 'dal', category: 'Legumes', baseName: 'Lentils' },
    { recipeId: 'salad', category: 'Veg', baseName: 'Carrot' },
    { recipeId: 'toast', category: 'Grain', baseName: 'Bread' },
  ],
  (row) => ({ lentils: '2026-09-01', carrot: '2026-09-15' })[row.baseName.toLowerCase()] ?? null,
);
ok(dishes.size === 3 && !dishes.has('toast'), 'only dishes using stock on hand are kept');
ok(dishes.get('soup').oldest === '2026-09-01' && dishes.get('soup').names.length === 2, 'a dish carries its names and oldest date');
const pool = ['toast', 'salad', 'dal', 'soup'];
const lean = H.newOnHandLean(dishes);
ok(JSON.stringify(H.leanTowardOnHand(pool, (x) => x, lean)) === '["soup"]', 'the dish using the most on hand wins');
H.claimOnHand(lean, 'soup', 'Lentil soup');
ok(JSON.stringify(H.leanTowardOnHand(pool, (x) => x, lean)) === JSON.stringify(pool), 'once claimed, a food leads no further pick');
ok(JSON.stringify(H.leanTowardOnHand(pool, (x) => x, undefined)) === JSON.stringify(pool), 'switch off leaves the pool as it was');
const lean2 = H.newOnHandLean(dishes);
ok(JSON.stringify(H.leanTowardOnHand(['dal', 'salad'], (x) => x, lean2)) === '["dal"]', 'a tie goes to the oldest stock');
H.claimOnHand(lean2, 'toast', 'Toast');
ok(lean2.claims.length === 0, 'a dish using nothing on hand claims nothing');
ok(H.onHandDayLine(undefined) === null && H.onHandDayLine([]) === null, 'no line when nothing was used');
clean(H.onHandDayLine(lean.claims));
ok(H.onHandDayLine(lean.claims) === 'Uses what is in your kitchen: Lentil soup (lentils, carrot).', 'the day line names dish and foods');
clean(H.ON_HAND_SWITCH_LABEL);
clean(H.ON_HAND_SWITCH_HELP);

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
