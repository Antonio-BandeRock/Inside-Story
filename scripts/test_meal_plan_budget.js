// Checks lib/mealPlanBudget.ts (G38): prices come only from what the person
// recorded, per unit, with a sale price used only where no other was
// recorded; a dish is costed only where a price fits the amount, and every
// other ingredient is named; the lean keeps unpriced dishes and never
// empties a pool; and every sentence is swept for verdict words.
// Run: node scripts/test_meal_plan_budget.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  const dir = path.dirname(file);
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (name.startsWith('./')) return load(path.posix.join(dir, name.slice(2)) + '.ts');
    throw new Error(`${file} imported ${name}`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}
const mb = load('lib/mealPlanBudget.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too much|too little|enough|excess\w*|great|well done|dangerous|diagnos\w*|better|worse|cheap\w*|expensive|overspen\w*|afford\w*)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text), text);
}
const near = (a, b) => Math.abs(a - b) < 1e-6;

// --- Units ------------------------------------------------------------------------
ok('per kg', mb.budgetPriceUnit('kg') === 'kg');
ok('per lb', mb.budgetPriceUnit('lb') === 'lb');
ok('each', mb.budgetPriceUnit('each') === 'each');
ok('per litre', mb.budgetPriceUnit('l') === 'l');
ok('per fl oz', mb.budgetPriceUnit('fl_oz') === 'fl_oz');
ok('a total is never used', mb.budgetPriceUnit('total') === null);
ok('unknown unit is never used', mb.budgetPriceUnit('bunch') === null);

// --- Which price ------------------------------------------------------------------
const prices = mb.pricesByFood([
  { name: 'Rice', price: 4, unit: 'kg', on: '2026-09-01', onSale: false },
  { name: 'rice', price: 5, unit: 'kg', on: '2026-09-20', onSale: false },
  { name: 'Rice', price: 2, unit: 'kg', on: '2026-09-25', onSale: true },
  { name: 'Olive oil', price: 10, unit: 'l', on: '2026-09-10', onSale: false },
  { name: 'Eggs', price: 0.5, unit: 'each', on: '2026-09-10', onSale: false },
  { name: 'Chicken', price: 3, unit: 'lb', on: '2026-09-10', onSale: true },
  { name: 'Salmon', price: 40, unit: 'total', on: '2026-09-10', onSale: false },
  { name: 'Beans', price: 0, unit: 'kg', on: '2026-09-10', onSale: false },
]);
ok('most recent usual price, sale ignored', near(prices.get('rice').perGram, 0.005), prices.get('rice'));
ok('sale price used when it is the only one', near(prices.get('chicken').perGram, 3 / 453.59237), prices.get('chicken'));
ok('per litre to per ml', near(prices.get('olive oil').perMl, 0.01));
ok('each kept each', prices.get('eggs').perEach === 0.5);
ok('a total price leaves the food out', !prices.has('salmon'));
ok('a zero price leaves the food out', !prices.has('beans'));

// --- Costing ----------------------------------------------------------------------
const amt = (name, grams, ml, count, gramsPerUnit) => ({ name, grams, ml, count, gramsPerUnit });
ok('grams at a weight price', near(mb.ingredientCost(amt('Rice', 100, null, null, null), prices.get('rice')), 0.5));
ok('volume at a volume price', near(mb.ingredientCost(amt('Olive oil', 13.5, 15, null, null), prices.get('olive oil')), 0.15));
ok('count at each', near(mb.ingredientCost(amt('Eggs', null, null, 2, null), prices.get('eggs')), 1));
ok('grams to each only through a cited unit weight', near(mb.ingredientCost(amt('Eggs', 100, null, null, 50), prices.get('eggs')), 1));
ok('grams without a unit weight is not costed at each', mb.ingredientCost(amt('Eggs', 100, null, null, null), prices.get('eggs')) === null);
ok('a count without a unit weight is not costed by weight', mb.ingredientCost(amt('Rice', null, null, 1, null), prices.get('rice')) === null);
ok('no price at all', mb.ingredientCost(amt('Kale', 50, null, null, null), undefined) === null);

const dish = mb.dishCost([amt('Rice', 100, null, null, null), amt('Eggs', null, null, 2, null), amt('Kale', 50, null, null, null), amt('Kale', 20, null, null, null)], prices);
ok('dish known cost', near(dish.known, 1.5), dish);
ok('dish priced count', dish.pricedCount === 2, dish);
ok('unpriced named once', JSON.stringify(dish.unpriced) === JSON.stringify(['Kale']), dish);

// --- The choice -------------------------------------------------------------------
ok('first choice is Off', mb.budgetChoiceLabels()[0] === mb.BUDGET_OFF_LABEL);
ok('Off parses to null', mb.budgetFromLabel(mb.BUDGET_OFF_LABEL) === null);
for (const ceiling of mb.BUDGET_CHOICES) {
  const label = mb.budgetLabel(ceiling);
  ok(`label round trips ${label}`, mb.budgetFromLabel(label) === ceiling);
  clean('budget label', label);
}
clean('caption', mb.BUDGET_CAPTION);
clean('no prices', mb.BUDGET_NO_PRICES);

// --- The lean ---------------------------------------------------------------------
ok('allowance over three meals', near(mb.mealAllowance(15, 0, 3), 5));
ok('allowance after spending', near(mb.mealAllowance(15, 7, 2), 4));
ok('allowance never below zero', mb.mealAllowance(15, 30, 1) === 0);
ok('no allowance with no ceiling', mb.mealAllowance(null, 0, 3) === null);
ok('no allowance with no meals left', mb.mealAllowance(15, 0, 0) === null);

const cost = (known, pricedCount = 1) => ({ known, pricedCount, unpriced: [] });
const pool = [
  { id: 'a', c: cost(2) },
  { id: 'b', c: cost(6) },
  { id: 'c', c: undefined },
  { id: 'd', c: cost(0, 0) },
  { id: 'e', c: cost(9) },
];
const costOf = (d) => d.c;
const kept = mb.leanTowardBudget(pool, costOf, 5).map((d) => d.id);
ok('keeps what fits and every unpriced dish', JSON.stringify(kept) === JSON.stringify(['a', 'c', 'd']), kept);
const priced = [{ id: 'x', c: cost(8) }, { id: 'y', c: cost(9) }];
ok('nothing fitting leaves the pool as it was', mb.leanTowardBudget(priced, costOf, 1).length === 2);
ok('no allowance leaves the pool', mb.leanTowardBudget(pool, costOf, null).length === pool.length);
ok('one dish left as is', mb.leanTowardBudget([{ c: cost(50) }], costOf, 1).length === 1);

// --- What the day says ------------------------------------------------------------
ok('no lines with no budget', mb.budgetLines([{ name: 'Oats', cost: cost(2) }], null).length === 0);
const within = mb.budgetLines([{ name: 'Oats', cost: cost(2) }, { name: 'Stew', cost: cost(6) }], 10);
ok('within line', within.length === 1 && /about \$8\.00 for one person, within the \$10\.00 a day you chose/.test(within[0]), within);
const over = mb.budgetLines([{ name: 'Oats', cost: cost(7) }, { name: 'Stew', cost: cost(6) }], 10);
ok('over line', /about \$13\.00 for one person, \$3\.00 over the \$10\.00 a day you chose/.test(over[0]), over);
const gaps = mb.budgetLines(
  [
    { name: 'Oats', cost: { known: 1, pricedCount: 1, unpriced: ['Kale', 'Leek', 'Dill', 'Mint', 'Sage', 'Kale'] } },
    { name: 'Soup', cost: undefined },
  ],
  10,
);
ok('unpriced named with a count', gaps.some((l) => /^5 ingredients have no recorded price that fits \(Kale, Leek, Dill, Mint and 1 more\), so the day could cost more than this\.$/.test(l)), gaps);
ok('uncosted dish named', gaps.some((l) => /^Soup could not be costed at all/.test(l)), gaps);
const one = mb.budgetLines([{ name: 'Oats', cost: { known: 1, pricedCount: 1, unpriced: ['Kale'] } }], 10);
ok('one unpriced ingredient', /^1 ingredient has no recorded price that fits \(Kale\)/.test(one[1]), one);
const none = mb.budgetLines([{ name: 'Oats', cost: { known: 0, pricedCount: 0, unpriced: ['Oats'] } }], 10);
ok('nothing priced could not be checked', none.length === 1 && /could not be checked against \$10\.00 a day/.test(none[0]), none);
[within, over, gaps, one, none].flat().forEach((line) => clean('budget line', line));

console.log(`${failures === 0 ? 'PASS' : 'FAIL'} meal plan budget: ${swept} sentences swept, ${failures} failure${failures === 1 ? '' : 's'}`);
if (failures > 0) process.exit(1);
