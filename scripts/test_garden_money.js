// Runs lib/gardenMoney.ts: the garden's growing costs set against what it
// gave back.
//
// Built 2026-09-20, from "The Garden harvest should also take into account
// all money spent to grow the food."
//
// The rules checked:
//
//  1. Costs subtract from what was not spent, and the net can go negative.
//     A garden that cost more than it gave back at recorded prices says so.
//  2. Unpriced harvests and gifts are named in the sentence, so a net figure
//     is never read as the whole story.
//  3. Nothing here is income: the summary holds an avoided cost, a cost and
//     a difference, and no field called income exists.
//  4. Every growing-cost kind has a label, and an unknown kind falls back
//     rather than throwing.
//
// Run with: node scripts/test_garden_money.js
// Exits non-zero on any failure.

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
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const H = loadModule('lib/harvestTrade.ts');
const G = loadModule('lib/gardenMoney.ts', { './harvestTrade': H });
const { GROWING_COST_KINDS, growingCostKindLabel, isGrowingCostKind, summarizeGardenMoney, describeGardenNet, RECEIVED_SHARE_UNITS } = G;

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
function near(label, actual, expected, tol = 0.01) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}

// --- 1. The arithmetic ------------------------------------------------------

const ahead = summarizeGardenMoney({ harvestsAvoided: 40, receivedAvoided: 10, growingCosts: 12.5, unpricedCount: 0 });
near('net ahead', ahead.net, 37.5);
check('sides kept separately', [ahead.harvestsAvoided, ahead.receivedAvoided, ahead.growingCosts], [40, 10, 12.5]);
check('no income field anywhere', Object.keys(ahead).some((key) => /income/i.test(key)), false);

const behind = summarizeGardenMoney({ harvestsAvoided: 5, receivedAvoided: 0, growingCosts: 30, unpricedCount: 2 });
near('net can be negative', behind.net, -25);
check('unpriced count kept', behind.unpricedCount, 2);

const negativeInputs = summarizeGardenMoney({ harvestsAvoided: -5, receivedAvoided: -1, growingCosts: -2, unpricedCount: -1 });
check('negative inputs clamp to zero', [negativeInputs.harvestsAvoided, negativeInputs.receivedAvoided, negativeInputs.growingCosts, negativeInputs.unpricedCount, negativeInputs.net], [0, 0, 0, 0, 0]);

near('rounds to cents', summarizeGardenMoney({ harvestsAvoided: 10.005, receivedAvoided: 0, growingCosts: 0.001, unpricedCount: 0 }).net, 10);

// --- 2. The sentence --------------------------------------------------------

check('nothing on either side', describeGardenNet(summarizeGardenMoney({ harvestsAvoided: 0, receivedAvoided: 0, growingCosts: 0, unpricedCount: 0 })), 'Nothing priced on either side yet.');
checkTrue('no costs names the saving', describeGardenNet(summarizeGardenMoney({ harvestsAvoided: 20, receivedAvoided: 0, growingCosts: 0, unpricedCount: 0 })).startsWith('$20.00 you did not have to spend, with no growing costs'));
checkTrue('ahead names the costs', describeGardenNet(ahead).startsWith('$37.50 ahead after $12.50 spent on growing.'));
checkTrue('behind says so plainly', describeGardenNet(behind).startsWith('$25.00 spent on growing beyond what the garden has given back'));
checkTrue('behind names the unpriced ones', describeGardenNet(behind).includes('2 harvests and gifts had no recorded price and are counted without one'));
checkTrue('one unpriced is singular', describeGardenNet(summarizeGardenMoney({ harvestsAvoided: 1, receivedAvoided: 0, growingCosts: 1, unpricedCount: 1 })).includes('One harvest or gift had no recorded price and is counted'));
checkTrue('matched exactly', describeGardenNet(summarizeGardenMoney({ harvestsAvoided: 10, receivedAvoided: 0, growingCosts: 10, unpricedCount: 0 })).startsWith('Growing costs of $10.00 matched exactly'));
checkTrue('no unpriced, no caveat', !describeGardenNet(ahead).includes('recorded price'));

// --- 3. Kinds ---------------------------------------------------------------

check('nine kinds', GROWING_COST_KINDS.length, 9);
checkTrue('every kind labelled', GROWING_COST_KINDS.every((entry) => entry.label.length > 0 && entry.help.length > 0));
check('kind label', growingCostKindLabel('fertilizer_nutrients'), 'Fertilizer and nutrients');
check('unknown kind falls back', growingCostKindLabel('mystery'), 'Something else');
check('isGrowingCostKind', [isGrowingCostKind('water'), isGrowingCostKind('nope')], [true, false]);
checkTrue('fertilizer help says kitchen compost is free', GROWING_COST_KINDS.find((entry) => entry.code === 'fertilizer_nutrients').help.includes('costs nothing'));
check('gift units include the two informal ones', RECEIVED_SHARE_UNITS.includes('bunch') && RECEIVED_SHARE_UNITS.includes('bag'), true);

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
