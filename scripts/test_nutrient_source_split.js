// Runs nutrientSourceSplit in lib/nutrientAnalysis.ts: the food half and
// the supplement half of one nutrient row, and the words that go under it.
//
// Built 2026-09-22, from "the goal is to modify how a person eats so with
// their food they are receiving an optimal amount of every one of them and
// not have to take any supplements, but to also make sure that you do take
// the ones you cannot receive from your food because of whatever reason,
// such as being vegan, or alergic, etc."
//
// The rules checked:
//
//  1. A row no supplement touched says nothing, and a row with no usable
//     target says nothing either.
//  2. The two shares are fractions of the target and never sum past 1, so
//     a row far over target cannot flatten the rest of the table.
//  3. Food past the target clips to a full food segment with no supplement
//     segment left to draw.
//  4. The wording covers the four cases: food carrying part of it, food
//     already carrying all of it, food carrying none of it, and a ceiling
//     row where more is not better.
//
// Run with: node scripts/test_nutrient_source_split.js
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

const { nutrientSourceSplit, analyzeNutrientIntake } = loadModule('lib/nutrientAnalysis.ts');

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }
function near(label, actual, expected, tol = 0.001) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}

// One row, built the way analyzeNutrientIntake builds it.
function entry(over = {}) {
  const fromFood = over.fromFood ?? 0;
  const fromSupplements = over.fromSupplements ?? 0;
  const target = over.target ?? 18;
  const combinedTotal = fromFood + fromSupplements;
  return {
    nutrientCode: over.nutrientCode ?? 'iron',
    displayName: over.displayName ?? 'Iron',
    unit: over.unit ?? 'mg',
    fromFood,
    fromSupplements,
    combinedTotal,
    target,
    targetType: over.targetType ?? 'RDA',
    upperLimit: over.upperLimit ?? null,
    percentOfTarget: target > 0 ? (combinedTotal / target) * 100 : NaN,
    status: over.status ?? 'adequate',
    sourceAgency: 'NASEM',
    citation: null,
    notes: null,
  };
}

// --- 1. Rows with nothing to say -------------------------------------------------

check('no supplement, no split', nutrientSourceSplit(entry({ fromFood: 12 })), null);
check('nothing at all, no split', nutrientSourceSplit(entry()), null);
check('a negative supplement total is treated as none', nutrientSourceSplit(entry({ fromFood: 12, fromSupplements: -3 })), null);
check('no target to measure against, no split', nutrientSourceSplit(entry({ fromFood: 4, fromSupplements: 6, target: 0 })), null);

// --- 2. The two shares -----------------------------------------------------------

const half = nutrientSourceSplit(entry({ fromFood: 9, fromSupplements: 18 }));
near('food share is food over target', half.foodShare, 0.5);
near('supplement share fills what is left of the bar', half.supplementShare, 0.5);
near('food percent is of the target, not of the total', half.foodPercentOfTarget, 50);
near('supplement percent can pass 100 on its own', half.supplementPercentOfTarget, 100);
checkTrue('shares never sum past a full bar', half.foodShare + half.supplementShare <= 1);
check('food alone does not cover it here', half.foodAloneCoversTarget, false);

const sliver = nutrientSourceSplit(entry({ fromFood: 1.8, fromSupplements: 1.8 }));
near('a small food share stays proportional', sliver.foodShare, 0.1);
near('a small supplement share stays proportional', sliver.supplementShare, 0.1);
checkTrue('an unmet target leaves empty track', sliver.foodShare + sliver.supplementShare < 1);

// --- 3. Food past the target clips ------------------------------------------------

const over = nutrientSourceSplit(entry({ fromFood: 54, fromSupplements: 18 }));
near('food past target clips to a full segment', over.foodShare, 1);
near('nothing left for the supplement segment', over.supplementShare, 0);
near('the percent itself is not clipped', over.foodPercentOfTarget, 300);
check('food alone covers it', over.foodAloneCoversTarget, true);

// --- 4. The wording ---------------------------------------------------------------

check(
  'food carrying part of it names both percentages',
  half.sentence,
  'Food covered 50% of your target (9.0 mg), and the supplement brought it to 150%.',
);
check(
  'food already carrying all of it says so first',
  nutrientSourceSplit(entry({ nutrientCode: 'magnesium', fromFood: 340, fromSupplements: 200, target: 320 })).sentence,
  'Food alone already covers this target (340 mg). The supplement adds 200 mg on top of it.',
);
check(
  'food carrying none of it is the vegan B12 case',
  nutrientSourceSplit(entry({ nutrientCode: 'vitamin_b12', unit: 'µg', fromFood: 0, fromSupplements: 25, target: 2.4 })).sentence,
  'All 25 µg of this came from a supplement. Nothing you ate today carried any.',
);
check(
  'a ceiling row drops the covering-it wording',
  nutrientSourceSplit(entry({ nutrientCode: 'sodium', fromFood: 1800, fromSupplements: 50, target: 2300, targetType: 'CDRR' })).sentence,
  '1.8 g of this came from food and 50 mg from a supplement.',
);
checkTrue(
  'a ceiling row never claims food is covering it for you',
  !/covers this target/.test(
    nutrientSourceSplit(entry({ nutrientCode: 'sodium', fromFood: 2400, fromSupplements: 50, target: 2300, targetType: 'CDRR' })).sentence,
  ),
);

// --- 5. Against the analyzer that actually feeds it -------------------------------

const driRows = [
  { nutrientCode: 'iron', displayName: 'Iron', unit: 'mg', amount: 18, valueType: 'RDA', upperLimit: 45, sourceAgency: 'NASEM', citation: null, notes: null },
];
const analyzed = analyzeNutrientIntake(driRows, { iron: 9 }, { iron: 18 });
const fromAnalyzer = nutrientSourceSplit(analyzed[0]);
near('a real analyzer row splits the same way', fromAnalyzer.foodShare, 0.5);
check('and words it the same way', fromAnalyzer.sentence, half.sentence);

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
