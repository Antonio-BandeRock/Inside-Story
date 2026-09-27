// Runs lib/mineralAbsorption.ts: how much of the day's calcium, iron and
// zinc from food the body likely takes up (G13, 2026-09-27).
//
// The rules checked:
//
//  1. Calcium follows each food's oxalate tier, unassessed at the milk share.
//  2. Iron follows the Monsen model meal by meal: heme from meat, fish and
//     poultry, nonheme at 3%, 5% or 8% by what shares the meal.
//  3. Zinc follows the share from whole grains, legumes, nuts and seeds.
//  4. Nothing eaten gives nothing, and the sentences carry no verdict words.
//
// Run with: node scripts/test_mineral_absorption.js
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

const M = loadModule('lib/mineralAbsorption.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}
const r = (value) => Math.round(value * 1000) / 1000;
function item(mealId, grams, totals, category = 'Veg', oxalateTier = null) {
  return { mealId, grams, totals, category, oxalateTier };
}

// 1. Calcium
check('share by tier', ['Very High', 'High', 'Moderate', 'Low', null, 'Not Assessed'].map(M.calciumShareFor), [0.051, 0.085, 0.22, 0.321, 0.321, 0.321]);
const calcium = M.estimateAbsorption('calcium', [
  item('a', 100, { calcium: 100 }, 'Veg', 'Very High'),
  item('a', 200, { calcium: 200 }, 'Dairy', null),
]);
check('calcium eaten', calcium.eaten, 300);
check('calcium absorbed', r(calcium.absorbed), r(5.1 + 64.2));
check('calcium tier', calcium.tier, 'moderate');
check('calcium bound share said', calcium.method[1], '33% of the calcium eaten came from foods with moderate to very high oxalate.');
check('no bound line when none bound', M.estimateAbsorption('calcium', [item('a', 1, { calcium: 50 })]).method.length, 1);

// 2. Iron
check('level low', M.nonhemeLevel(0, 0), 'low');
check('level medium meat', M.nonhemeLevel(30, 0), 'medium');
check('level medium vit c', M.nonhemeLevel(0, 25), 'medium');
check('level high both medium', M.nonhemeLevel(40, 30), 'high');
check('level high meat', M.nonhemeLevel(100, 0), 'high');
check('level high vit c', M.nonhemeLevel(0, 80), 'high');
const iron = M.estimateAbsorption('iron', [
  // Meal a: 100 g beef with 3 mg iron: high. Heme 1.2 at 23%, nonheme 1.8 at 8%.
  item('a', 100, { iron: 3 }, 'Meat'),
  // Meal b: lentils alone, 4 mg: low, 3%.
  item('b', 150, { iron: 4 }, 'Legume'),
  // Meal c: spinach 2 mg with orange 50 mg vitamin C: medium, 5%.
  item('c', 100, { iron: 2 }, 'Veg'),
  item('c', 130, { vitamin_c: 50 }, 'Fruit'),
]);
check('iron eaten', r(iron.eaten), 9);
check('iron absorbed', r(iron.absorbed), r(1.2 * 0.23 + 1.8 * 0.08 + 4 * 0.03 + 2 * 0.05));
check('iron meals line', iron.method[1], '3 meals with iron: 1 at 8%, 1 at 5%, 1 at 3%. 13% of the iron was heme iron.');
check('iron stores line last', iron.method[iron.method.length - 1].startsWith('The model assumes'), true);
check('meal with no iron not counted', M.estimateAbsorption('iron', [item('a', 50, { vitamin_c: 90 })]).method.length, 2);

// 3. Zinc
check('phytate high', M.phytateLevel(0.5), 'high');
check('phytate moderate', M.phytateLevel(0.3), 'moderate');
check('phytate low', M.phytateLevel(0.1), 'low');
const zincHigh = M.estimateAbsorption('zinc', [item('a', 1, { zinc: 3 }, 'Legume'), item('a', 1, { zinc: 1 }, 'Meat')]);
check('zinc high share', zincHigh.share, 0.15);
check('zinc high absorbed', r(zincHigh.absorbed), 0.6);
check('zinc tier weak', zincHigh.tier, 'weak');
check('zinc says not measured', zincHigh.method[1].includes('not measured'), true);
check('bread not phytate rich', M.estimateAbsorption('zinc', [item('a', 1, { zinc: 2 }, 'Baked')]).share, 0.5);
check('zinc moderate', M.estimateAbsorption('zinc', [item('a', 1, { zinc: 1 }, 'NutSeed'), item('a', 1, { zinc: 2 }, 'Dairy')]).share, 0.3);

// 4. Nothing eaten, sentences
const none = M.estimateAbsorption('zinc', []);
check('nothing eaten', [none.eaten, none.absorbed, none.share], [0, 0, 0]);
const fmt = (v) => `${v.toFixed(1)} mg`;
check('headline nothing', M.absorptionHeadline(none, fmt), 'No food logged today carried any, so there is nothing to estimate.');
check('headline', M.absorptionHeadline(calcium, fmt), 'Estimated taken up from food: about 69.3 mg of the 300.0 mg eaten (23%).');
check('no supplement note', M.absorptionNotes(0, fmt), []);
check('supplement note', M.absorptionNotes(18, fmt)[0].startsWith('The 18.0 mg from supplements is left out'), true);
check('is absorption nutrient', ['calcium', 'iron', 'zinc', 'magnesium'].map(M.isAbsorptionNutrient), [true, true, true, false]);

const sentences = [
  M.absorptionHeadline(none, fmt),
  M.absorptionHeadline(iron, fmt),
  ...calcium.method,
  ...iron.method,
  ...zincHigh.method,
  ...M.estimateAbsorption('zinc', [item('a', 1, { zinc: 2 }, 'Dairy')]).method,
  ...M.absorptionNotes(5, fmt),
  M.absorptionTierLine('strong'),
  M.absorptionTierLine('moderate'),
  M.absorptionTierLine('weak'),
];
const FORBIDDEN = /\b(best|healthy|healthiest|should|superfood|boost|real|genuine|genuinely|cure|treat|deficiency|deficient|poor|bad|good)\b|[–—]| -- /i;
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
console.log('mineral absorption: all checks passed');
