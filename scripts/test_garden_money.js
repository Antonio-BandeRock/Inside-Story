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
//  5. Per area (2026-09-20, same day): a cost tied to an area is set
//     against that area's harvests only; an area with harvests and no
//     costs says no costs were recorded rather than reading as free;
//     untied costs and gifts sit in their own bucket; an area with nothing
//     on either side is left out; areas roll up by location type; a cost
//     tied to an area that no longer exists falls into the untied bucket.
//  6. Cost groups (2026-09-20, later): areas combined into a group stand as
//     one row in place of their own rows, netting their costs, the costs
//     tied to the group as a whole, and their harvests together; an area
//     is in one group at most; each area still rolls up where it is; a
//     cost tied to a group in one place rolls up there and one tied to a
//     group spread across places goes on a line of its own; deleting a
//     group (passing none) leaves everything where it was; a cost tied to
//     a group that no longer exists is untied.
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
const {
  GROWING_COST_KINDS, growingCostKindLabel, isGrowingCostKind, summarizeGardenMoney, describeGardenNet, RECEIVED_SHARE_UNITS,
  groupGardenMoneyByArea, describeNetShort, describeAreaSetting, UNASSIGNED_AREA_NAME,
} = G;

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

// --- 5. Per area ------------------------------------------------------------

const areas = [
  { id: 'tent', name: 'Grow tent', locationType: 'indoor', lightSource: 'LED grow light' },
  { id: 'beds', name: 'Back beds', locationType: 'outdoor', lightSource: null },
  { id: 'shelf', name: 'Window shelf', locationType: 'indoor', lightSource: null },
  { id: 'idle', name: 'Idle bed', locationType: 'outdoor', lightSource: null },
];
const grouped = groupGardenMoneyByArea({
  areas,
  harvests: [
    { plotId: 'tent', amount: 30 },
    { plotId: 'tent', amount: null },
    { plotId: 'beds', amount: 45 },
    { plotId: 'shelf', amount: 5 },
    { plotId: 'gone', amount: 8 },
    { plotId: null, amount: 2 },
  ],
  gifts: [{ amount: 12 }, { amount: null }],
  costs: [
    { plotId: 'tent', amount: 50 },
    { plotId: 'tent', amount: 10 },
    { plotId: null, amount: 4 },
    { plotId: 'gone', amount: 1 },
  ],
});
check('areas with activity only, in area order', grouped.areas.map((a) => a.areaId), ['tent', 'beds', 'shelf']);
const tent = grouped.areas[0];
check('tent costs are set against tent harvests only', [tent.summary.harvestsAvoided, tent.summary.growingCosts, tent.summary.net], [30, 60, -30]);
check('tent counts', [tent.costCount, tent.harvestCount, tent.giftCount, tent.summary.unpricedCount], [2, 2, 0, 1]);
const beds = grouped.areas[1];
check('beds have harvests and no costs', [beds.summary.harvestsAvoided, beds.summary.growingCosts, beds.summary.net], [45, 0, 45]);
check('beds say no costs recorded rather than reading as free', describeNetShort(beds.summary), '$45.00 given back, no costs recorded');
check('untied bucket holds gifts, untied and orphaned items', [grouped.unassigned.name, grouped.unassigned.costCount, grouped.unassigned.harvestCount, grouped.unassigned.giftCount], [UNASSIGNED_AREA_NAME, 2, 2, 2]);
check('untied bucket arithmetic', [grouped.unassigned.summary.harvestsAvoided, grouped.unassigned.summary.receivedAvoided, grouped.unassigned.summary.growingCosts, grouped.unassigned.summary.unpricedCount], [10, 12, 5, 1]);
check('gifts never land in an area', grouped.areas.every((a) => a.giftCount === 0 && a.summary.receivedAvoided === 0), true);
check('by location: indoors then outdoors', grouped.byLocation.map((l) => [l.locationType, l.areaCount]), [['indoor', 2], ['outdoor', 1]]);
check('indoors rollup sums both indoor areas', [grouped.byLocation[0].summary.harvestsAvoided, grouped.byLocation[0].summary.growingCosts, grouped.byLocation[0].summary.unpricedCount], [35, 60, 1]);
check('rollup leaves untied out', grouped.byLocation[1].summary.growingCosts, 0);
const sumOfParts = grouped.areas.reduce((n, a) => n + a.summary.net, 0) + grouped.unassigned.summary.net;
near('parts add up to the whole', sumOfParts, summarizeGardenMoney({ harvestsAvoided: 90, receivedAvoided: 12, growingCosts: 65, unpricedCount: 0 }).net);

const empty = groupGardenMoneyByArea({ areas, harvests: [], gifts: [], costs: [] });
check('nothing recorded: no rows, no bucket, no rollup', [empty.areas.length, empty.unassigned, empty.byLocation.length], [0, null, 0]);

check('short net: ahead', describeNetShort(summarizeGardenMoney({ harvestsAvoided: 20, receivedAvoided: 0, growingCosts: 5, unpricedCount: 0 })), '$15.00 ahead');
check('short net: behind', describeNetShort(summarizeGardenMoney({ harvestsAvoided: 2, receivedAvoided: 0, growingCosts: 5, unpricedCount: 0 })), '$3.00 behind');
check('short net: nothing', describeNetShort(summarizeGardenMoney({ harvestsAvoided: 0, receivedAvoided: 0, growingCosts: 0, unpricedCount: 0 })), 'nothing priced yet');
check('short net: matched', describeNetShort(summarizeGardenMoney({ harvestsAvoided: 5, receivedAvoided: 0, growingCosts: 5, unpricedCount: 0 })), 'costs matched by what was given back');
check('area setting with light', describeAreaSetting(areas[0]), 'Indoors, LED grow light');
check('area setting without light', describeAreaSetting(areas[1]), 'Outdoors');
check('untied bucket has no setting', describeAreaSetting({ locationType: null, lightSource: null }), '');

// 6. Cost groups.
const fixture = {
  areas,
  harvests: [
    { plotId: 'tent', amount: 30 },
    { plotId: 'shelf', amount: 5 },
    { plotId: 'beds', amount: 45 },
    { plotId: 'idle', amount: null },
  ],
  gifts: [{ amount: 12 }],
  costs: [
    { plotId: 'tent', amount: 50 },
    { plotId: 'shelf', groupId: null, amount: 10 },
    { plotId: null, groupId: 'lights', amount: 20 },
    { plotId: null, groupId: 'gone-group', amount: 3 },
    { plotId: null, amount: 4 },
  ],
};
const withGroup = groupGardenMoneyByArea({
  ...fixture,
  groups: [{ id: 'lights', name: 'Under lights', memberIds: ['tent', 'shelf', 'not-an-area'] }],
});
check('group row stands in place of its areas, then ungrouped areas', withGroup.areas.map((a) => a.groupId ?? a.areaId), ['lights', 'beds', 'idle']);
const lights = withGroup.areas[0];
check('group nets member costs, whole-group costs and member harvests', [lights.summary.harvestsAvoided, lights.summary.growingCosts, lights.summary.net], [35, 80, -45]);
check('group counts', [lights.costCount, lights.harvestCount, lights.members], [3, 2, ['Grow tent', 'Window shelf']]);
check('group in one place carries that place', [lights.locationType, lights.locations], ['indoor', ['indoor']]);
check('group setting', describeAreaSetting(lights), 'Indoors');
check('each area still rolls up where it is, whole-group cost with them', withGroup.byLocation.map((l) => [l.locationType, l.areaCount, l.summary.growingCosts]), [['indoor', 2, 80], ['outdoor', 2, 0]]);
check('a cost tied to a vanished group is untied', [withGroup.unassigned.costCount, withGroup.unassigned.summary.growingCosts], [2, 7]);
const groupedParts = withGroup.areas.reduce((n, a) => n + a.summary.net, 0) + withGroup.unassigned.summary.net;
near('grouped parts still add up to the whole', groupedParts, summarizeGardenMoney({ harvestsAvoided: 80, receivedAvoided: 12, growingCosts: 87, unpricedCount: 0 }).net);

const spread = groupGardenMoneyByArea({
  ...fixture,
  costs: [...fixture.costs, { plotId: null, groupId: 'both', amount: 6 }],
  groups: [
    { id: 'both', name: 'Tomatoes everywhere', memberIds: ['beds', 'tent'] },
    { id: 'lights', name: 'Under lights', memberIds: ['tent', 'shelf'] },
  ],
});
check('an area is in one group at most: the first that names it', spread.areas.map((a) => [a.groupId ?? a.areaId, a.members]), [['both', ['Grow tent', 'Back beds']], ['lights', ['Window shelf']], ['idle', []]]);
check('a group spread across places has no one place', [spread.areas[0].locationType, spread.areas[0].locations], [null, ['indoor', 'outdoor']]);
check('spread group setting', describeAreaSetting(spread.areas[0]), 'Indoors and outdoors');
check('three places joined', describeAreaSetting({ locationType: null, locations: ['indoor', 'greenhouse', 'outdoor'], lightSource: null }), 'Indoors, greenhouse and outdoors');
check('whole-group cost of a spread group goes on its own line', spread.byLocation.map((l) => [l.locationType, l.summary.growingCosts]), [['indoor', 80], ['outdoor', 0], ['mixed', 6]]);
const spreadParts = spread.areas.reduce((n, a) => n + a.summary.net, 0) + spread.unassigned.summary.net;
near('spread parts add up to the whole', spreadParts, summarizeGardenMoney({ harvestsAvoided: 80, receivedAvoided: 12, growingCosts: 93, unpricedCount: 0 }).net);

const ungrouped = groupGardenMoneyByArea(fixture);
check('no groups: every area on its own, whole-group costs untied', [ungrouped.areas.map((a) => a.areaId), ungrouped.unassigned.summary.growingCosts], [['tent', 'beds', 'shelf', 'idle'], 27]);
check('an area row carries no members', ungrouped.areas.every((a) => a.groupId === null && a.members.length === 0), true);

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
