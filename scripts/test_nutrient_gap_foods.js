// Runs lib/nutrientGapFoods.ts: foods that would close a short nutrient
// (G12, 2026-09-27).
//
// The rules checked:
//
//  1. Only Low or Deficient is short, and the end-of-day projection wins
//     over Now when there is one.
//  2. Safe Foods, then diet and allergy, each counted when they leave a food
//     out.
//  3. Foods already eaten come first, richest first within each half, and
//     the list stops at the cap.
//  4. The share of what is missing that 100 g covers.
//  5. The sentences, and none of them says a food is good for anybody.
//
// Run with: node scripts/test_nutrient_gap_foods.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const A = loadModule('lib/nutrientAnalysis.ts');
const G = loadModule('lib/nutrientGapFoods.ts', { './nutrientAnalysis': A });

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

function entry(status, combinedTotal, target = 18) {
  return { nutrientCode: 'iron', displayName: 'Iron', unit: 'mg', target, combinedTotal, percentOfTarget: (combinedTotal / target) * 100, status };
}

// 1. Shortfall
check('low now, no projection', G.nutrientShortfall(entry('low', 12), null), { missing: 6, afterPlanned: false });
check('deficient now', G.nutrientShortfall(entry('deficient', 3), undefined), { missing: 15, afterPlanned: false });
check('adequate is not short', G.nutrientShortfall(entry('adequate', 18), null), null);
check('excess is not short', G.nutrientShortfall(entry('excess_risk', 60), null), null);
check('planned meals close it', G.nutrientShortfall(entry('low', 12), entry('adequate', 19)), null);
check('projection still short', G.nutrientShortfall(entry('deficient', 3), entry('low', 14)), { missing: 4, afterPlanned: true });
check('low but at target', G.nutrientShortfall(entry('low', 18), null), null);

// 2 and 3. Picking
function food(baseName, amount, more = {}) {
  return { foodId: amount, source: 'USDA', baseName, category: 'Veg', subcategory: null, prepMethod: 'Raw', amountPer100g: amount, ...more };
}
const ranked = [food('Clams', 28), food('Liver', 9), food('Pumpkin seed', 8.8), food('Lentils', 6.5), food('Spinach', 2.7), food('Tofu', 5.4)];
const shortfall = { missing: 6, afterPlanned: false };
const checks = {
  isSafe: (f) => f.baseName !== 'Liver',
  fits: (f) => f.baseName !== 'Clams',
  mealsBefore: (f) => ({ Spinach: 4, Lentils: 1 })[f.baseName] ?? 0,
};
const picked = G.pickGapFoods(ranked, shortfall, checks);
check('eaten first, richest first', picked.foods.map((item) => item.food.baseName), ['Lentils', 'Spinach', 'Pumpkin seed', 'Tofu']);
check('unsafe counted', picked.leftOutUnsafe, 1);
check('diet counted', picked.leftOutDiet, 1);
check('meals before', picked.foods.map((item) => item.mealsBefore), [1, 4, 0, 0]);
check('cap', G.pickGapFoods(ranked, shortfall, checks, 2).foods.map((item) => item.food.baseName), ['Lentils', 'Spinach']);
check('share', Math.round(picked.foods[1].shareOf100g * 100), 45);
check('input untouched', ranked.map((f) => f.baseName)[0], 'Clams');

// Name key
check('name key raw', G.gapFoodNameKey('Veg', 'Spinach', null), 'Veg|spinach|raw');
check('name key prep', G.gapFoodNameKey('Veg', 'Spinach', 'Boiled'), 'Veg|spinach|boiled');

// 4 and 5. Sentences
check('caption eaten', G.gapFoodCaption(picked.foods[1]), 'In 4 meals you logged before. 100 g covers about 45% of what is missing.');
check('caption one meal', G.gapFoodCaption(picked.foods[0]).startsWith('In 1 meal you logged before.'), true);
check('caption whole', G.gapFoodCaption({ food: food('Clams', 28), mealsBefore: 0, shareOf100g: 4.6 }), '100 g covers all of what is missing.');
check('caption tiny', G.gapFoodCaption({ food: food('X', 0.01), mealsBefore: 0, shareOf100g: 0.001 }), '100 g covers about 1% of what is missing.');
check('heading now', G.gapFoodsHeading('Iron', 'mg', shortfall), 'Iron still missing today: 6.0 mg. Foods rich in it that Safe Foods lists for you:');
check('heading planned', G.gapFoodsHeading('Iron', 'mg', { missing: 4, afterPlanned: true }).includes('once today\'s planned meals are eaten'), true);
check('nothing left out', G.describeGapFoods(4, 0, 0), []);
check('both left out', G.describeGapFoods(4, 1, 3), [
  '1 food was left out because Safe Foods does not list it for you.',
  '3 foods were left out for your diet or allergies.',
]);
check('none measured', G.describeGapFoods(0, 0, 0), ['No food in the database has a measured amount of it.']);
check('none fit', G.describeGapFoods(0, 2, 0).length, 2);

const sentences = [
  ...G.describeGapFoods(0, 0, 0),
  ...G.describeGapFoods(0, 2, 1),
  ...G.describeGapFoods(3, 1, 2),
  G.gapFoodsHeading('Iron', 'mg', shortfall),
  G.gapFoodsHeading('Iron', 'mg', { missing: 4, afterPlanned: true }),
  ...picked.foods.map((item) => G.gapFoodCaption(item)),
];
const FORBIDDEN = /\b(best|healthy|healthiest|should|superfood|boost|real|genuine|genuinely|cure|treat|deficiency)\b|[–—]| -- /i;
for (const sentence of sentences) {
  if (!sentence || FORBIDDEN.test(sentence)) {
    failures++;
    console.log(`FAIL sentence: ${sentence}`);
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('nutrient gap foods: all checks passed');
