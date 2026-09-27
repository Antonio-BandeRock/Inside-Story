// Runs lib/nutrientRichPicks.ts: richest foods for a nutrient from inside a
// builder (G10, 2026-09-27).
//
// The rules checked:
//
//  1. Nutrients are listed under a heading per group, in the order given.
//  2. Foods keep the richest-first order, stop at the cap, and the count left
//     out for diet or allergy is only of rows that would have shown.
//  3. A row names its preparation unless it is plain raw, and its amount
//     scales units the way the rest of the app does.
//  4. The sentences under the list, and none of them says a food is good for
//     anybody.
//
// Run with: node scripts/test_nutrient_rich_picks.js
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
const R = loadModule('lib/nutrientRichPicks.ts', { './nutrientAnalysis': A });

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

// 1. Nutrient rows
const rows = R.nutrientChoiceRows([
  { code: 'protein', displayName: 'Protein', unit: 'g', group: 'macro' },
  { code: 'fiber', displayName: 'Fiber', unit: 'g', group: 'macro' },
  { code: 'vitc', displayName: 'Vitamin C', unit: 'mg', group: 'vitamin' },
  { code: 'lyco', displayName: 'Lycopene', unit: 'µg', group: 'carotenoid' },
]);
check('row labels', rows.map((row) => row.label), ['Macronutrients', 'Protein (g)', 'Fiber (g)', 'Vitamins', 'Vitamin C (mg)', 'Other Nutrients', 'Lycopene (µg)']);
check('headers flagged', rows.filter((row) => row.isHeader).length, 3);
check('member carries its group', rows[4].groupLabel, 'Vitamins');
check('empty list', R.nutrientChoiceRows([]), []);

// 2. Picking
function food(baseName, amount, more = {}) {
  return { foodId: amount, source: 'USDA', baseName, category: 'Fruit', subcategory: null, prepMethod: 'Raw', amountPer100g: amount, ...more };
}
const ranked = [food('Guava', 228), food('Peanut', 200), food('Kiwi', 93), food('Orange', 53), food('Lemon', 53, { foodId: 7 })];
const noPeanut = (f) => f.baseName !== 'Peanut';
check('order kept, peanut out', R.pickRichFoods(ranked, noPeanut, 10).foods.map((f) => f.baseName), ['Guava', 'Kiwi', 'Orange', 'Lemon']);
check('left out counted', R.pickRichFoods(ranked, noPeanut, 10).leftOut, 1);
check('cap', R.pickRichFoods(ranked, () => true, 2).foods.map((f) => f.baseName), ['Guava', 'Peanut']);
check('left out past the cap not counted', R.pickRichFoods(ranked, (f) => f.baseName !== 'Orange', 2).leftOut, 0);
check('input untouched', ranked.length, 5);

// 3. Labels
check('raw label', R.richFoodLabel(food('Guava', 228.3), 'mg'), 'Guava: 228 mg');
check('prep label', R.richFoodLabel(food('Mushroom', 5.25, { prepMethod: 'Dried' }), 'µg'), 'Mushroom, Dried: 5.3 µg');
check('no prep label', R.richFoodLabel(food('Kale', 1500, { prepMethod: null }), 'µg'), 'Kale: 1.5 mg');
check('key', R.richFoodKey(food('Kiwi', 93)), 'USDA|93');
check('heading', R.richFoodsHeading('Vitamin C'), 'Richest in Vitamin C, per 100 g');

// 4. Sentences
check('nothing left out', R.describeRichFoods(5, 0), null);
check('one left out', R.describeRichFoods(5, 1), '1 food was left out for your diet or allergies.');
check('several left out', R.describeRichFoods(5, 3), '3 foods were left out for your diet or allergies.');
const sentences = [R.describeRichFoods(0, 0), R.describeRichFoods(0, 4), R.describeRichFoods(5, 1), R.describeRichFoods(5, 3), R.richFoodsHeading('Iron')];
const FORBIDDEN = /\b(best|healthy|healthiest|should|superfood|boost|real|genuine|genuinely)\b|[–—]| -- /i;
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
console.log('nutrient rich picks: all checks passed');
