// Runs lib/supplementWindow.ts: which days a supplement counts toward, and
// what the food half of a nutrient trend came to over a range.
//
// Built 2026-09-23 with the Food versus supplement trend.
//
// The rules checked:
//
//  1. A supplement with a start date does not reach back before it.
//  2. A supplement with an end date stops at it.
//  3. One switched off without an end date stops on the day it was
//     switched, which is the best marker the row carries.
//  4. One with no dates at all counts across the range rather than being
//     guessed at in either direction, and the summary says so.
//  5. The summary counts the days food by itself reached the target, which
//     is the number the whole food-first goal turns on.
//  6. A split too small to draw reads as food alone rather than as two
//     lines nobody can tell apart.
//
// Run with: node scripts/test_supplement_window.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const W = loadModule('lib/supplementWindow.ts');
const { supplementCoversDate, supplementBasis, summarizeSourceSplit } = W;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(name, actual) {
  check(name, actual === true, true);
}

const running = { startDate: '2026-09-10', endDate: null, active: true, updatedDate: '2026-09-10' };
const stopped = { startDate: '2026-06-01', endDate: '2026-07-15', active: false, updatedDate: '2026-08-20' };
const switchedOff = { startDate: '2026-06-01', endDate: null, active: false, updatedDate: '2026-08-20' };
const undated = { startDate: null, endDate: null, active: true, updatedDate: '2026-09-01' };

// 1. A start date is a floor.
check('the day before it started is not covered', supplementCoversDate(running, '2026-09-09'), false);
check('the day it started is covered', supplementCoversDate(running, '2026-09-10'), true);
check('a later day is covered', supplementCoversDate(running, '2026-09-23'), true);

// 2. An end date is a ceiling.
check('the day it ended is covered', supplementCoversDate(stopped, '2026-07-15'), true);
check('the day after it ended is not', supplementCoversDate(stopped, '2026-07-16'), false);
check('a day inside the window is covered', supplementCoversDate(stopped, '2026-06-20'), true);
check('a day before it started is not', supplementCoversDate(stopped, '2026-05-31'), false);

// 3. Switched off without an end date stops when it was switched.
check('covered up to the day it was switched off', supplementCoversDate(switchedOff, '2026-08-20'), true);
check('not covered after the day it was switched off', supplementCoversDate(switchedOff, '2026-08-21'), false);
check('still covered well before that', supplementCoversDate(switchedOff, '2026-07-01'), true);

// 4. No dates at all means no boundary is invented.
check('an undated running supplement covers an old day', supplementCoversDate(undated, '2025-01-01'), true);
check('and today', supplementCoversDate(undated, '2026-09-23'), true);

check('no supplements at all', supplementBasis([]), 'none');
check('every one dated', supplementBasis([running, stopped]), 'dated');
check('one of them undated', supplementBasis([running, undated]), 'undated');

// 5 and 6. The summary.
const empty = summarizeSourceSplit([], 'none');
check('an empty range says so', empty.headline, 'Nothing logged in this range yet.');
check('an empty range draws one line', empty.supplementInvolved, false);

const foodOnly = summarizeSourceSplit(
  [
    { date: '2026-09-20', foodPercent: 104, totalPercent: 104 },
    { date: '2026-09-21', foodPercent: 88, totalPercent: 88 },
    { date: '2026-09-22', foodPercent: 120, totalPercent: 120 },
  ],
  'none',
);
check('food alone is not drawn as two lines', foodOnly.supplementInvolved, false);
check('it counts the days food reached the target', foodOnly.daysFoodAloneCovered, 2);
check(
  'and says so',
  foodOnly.headline,
  'All food. It covered the target on 2 of these 3 days.',
);
check('one line needs no legend', [foodOnly.legendNote, foodOnly.basisNote], [null, null]);

const everyDay = summarizeSourceSplit(
  [
    { date: '2026-09-20', foodPercent: 104, totalPercent: 104 },
    { date: '2026-09-21', foodPercent: 130, totalPercent: 130 },
  ],
  'none',
);
check('every day covered reads differently', everyDay.headline, 'All food, and it covered the target on every one of these 2 days.');

const split = summarizeSourceSplit(
  [
    { date: '2026-09-20', foodPercent: 40, totalPercent: 110 },
    { date: '2026-09-21', foodPercent: 60, totalPercent: 130 },
    { date: '2026-09-22', foodPercent: 110, totalPercent: 180 },
    { date: '2026-09-23', foodPercent: 30, totalPercent: 100 },
  ],
  'dated',
);
check('a split is drawn as two lines', split.supplementInvolved, true);
check('food reached the target on one of the four days', split.daysFoodAloneCovered, 1);
check(
  'the headline carries both averages and the count',
  split.headline,
  'Your food averaged 60% of the target over these 4 days, and what you take brought it to 130%. Food by itself reached the target on 1 of them.',
);
checkTrue('the legend says which line is which', split.legendNote.includes('food by itself'));
checkTrue('a dated basis says it came from the dates', split.basisNote.includes('start and end dates you gave'));
checkTrue('and admits no dose is recorded', split.basisNote.includes('records a dose being swallowed'));

const undatedSplit = summarizeSourceSplit(
  [
    { date: '2026-09-20', foodPercent: 40, totalPercent: 110 },
    { date: '2026-09-21', foodPercent: 60, totalPercent: 130 },
  ],
  'undated',
);
checkTrue('an undated basis says it is counted across the range', undatedSplit.basisNote.includes('across the whole range'));
checkTrue('and says where to sharpen it', undatedSplit.basisNote.includes('My Meds'));

// Half a percentage point apart is not two lines.
const hairline = summarizeSourceSplit(
  [
    { date: '2026-09-20', foodPercent: 99.7, totalPercent: 100.2 },
    { date: '2026-09-21', foodPercent: 80, totalPercent: 80.4 },
  ],
  'dated',
);
check('a split too small to draw reads as food alone', hairline.supplementInvolved, false);

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
