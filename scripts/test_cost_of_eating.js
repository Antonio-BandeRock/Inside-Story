// Runs lib/costOfEating.ts: the arithmetic behind Trends > What It Costs.
//
// Built 2026-09-23, phase 5 of the cross-app push.
//
// The rules checked:
//
//  1. A MONTH WITH NOTHING RECORDED IS A GAP, NEVER A ZERO. Every monthly
//     figure is null where nothing was recorded, the row says so in words,
//     and the blank months are counted under the headline.
//  2. Averages divide by the months that carried a record, never by the
//     whole range, so months nobody entered do not water a figure down.
//  3. Untagged health money is reported on a line of its own and is never
//     divided across conditions.
//  4. Insurance is kept apart from care, since a premium is owed whether or
//     not anything happened that month.
//  5. A count of a crop never becomes a weight, so the cost per weight is
//     taken only over what was weighed and the counted crops are named.
//  6. A picking with no recorded price is left out of the money figure and
//     said, so the garden's return is never read as whole.
//  7. Band 4 says nothing about whether stopping a supplement was right,
//     and its boundary sentence is always present.
//  8. Nothing here judges a decision: no sentence blames or praises.
//
// Run with: node scripts/test_cost_of_eating.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function transpile(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  return outputText;
}

function run(relPath, resolve) {
  const module = { exports: {} };
  new Function('exports', 'module', 'require', transpile(relPath))(module.exports, module, (name) => {
    const found = resolve[name];
    if (!found) throw new Error(`unexpected import ${name}`);
    return found;
  });
  return module.exports;
}

// costOfEating.ts borrows its months, its weights and its money formatting
// rather than growing a second copy of any of them.
const V = run('lib/eatingVariety.ts', {});
const T = run('lib/harvestTrade.ts', {});
const U = run('lib/unitConversion.ts', {});
const H = run('lib/harvestYield.ts', {
  './eatingVariety': V,
  './harvestTrade': T,
  './unitConversion': U,
});
const C = run('lib/costOfEating.ts', {
  './harvestTrade': T,
  './harvestYield': H,
});

const {
  daysInMonth,
  monthlyMoneyRows,
  describeBlankMonths,
  moneySlices,
  describeRunLength,
  summarizeConditionCosts,
  summarizeFoodCosts,
  summarizeGrowingCosts,
  summarizeSupplementCosts,
  summarizeCosts,
  HEALTH_COST_LABELS,
} = C;
const { buildMonths } = H;

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

const everySentence = [];
function collect(...values) {
  for (const value of values) if (typeof value === 'string' && value.length > 0) everySentence.push(value);
}

// --- Days inside a month ----------------------------------------------------

const quarter = buildMonths('2026-04-01', '2026-06-30');
check('the quarter is three months', quarter.length, 3);
check('April has 30 days', daysInMonth(quarter[0]), 30);
check('May has 31 days', daysInMonth(quarter[1]), 31);
check('June has 30 days', daysInMonth(quarter[2]), 30);

const clipped = buildMonths('2026-02-20', '2026-03-05');
check('a clipped February counts only the days inside the range', daysInMonth(clipped[0]), 9);
check('a clipped March counts only the days inside the range', daysInMonth(clipped[1]), 5);
checkTrue('a clipped month is marked partial', clipped[0].partial);

const leap = buildMonths('2024-02-01', '2024-02-29');
check('February 2024 has 29 days', daysInMonth(leap[0]), 29);

// --- A blank month is a gap, never a zero -----------------------------------

const gapRows = monthlyMoneyRows(quarter, [
  { occurredOn: '2026-04-10', amount: 40 },
  { occurredOn: '2026-04-22', amount: 10 },
  { occurredOn: '2026-06-02', amount: 25 },
]);
check('April adds its two records', gapRows[0].value, 50);
check('May is null rather than zero', gapRows[1].value, null);
check('a blank month says so in words', gapRows[1].display, 'nothing recorded');
check('June carries its one record', gapRows[2].value, 25);
check('a month with money prints it as money', gapRows[0].display, '$50.00');

const zeroRows = monthlyMoneyRows(quarter, [{ occurredOn: '2026-05-04', amount: 0 }]);
check('a month recorded at nothing is zero, not null', zeroRows[1].value, 0);
check('a recorded nothing still prints as money', zeroRows[1].display, '$0.00');

check('no blanks gives no note', describeBlankMonths(0, 3, 'spending'), null);
check(
  'one blank month is said in the singular',
  describeBlankMonths(1, 3, 'food spending'),
  '1 month here had no food spending recorded, and is left blank rather than counted as nothing spent.',
);
check(
  'every month blank is said plainly',
  describeBlankMonths(3, 3, 'food spending'),
  'No food spending recorded in any of these months.',
);

// --- Shares of money --------------------------------------------------------

check('nothing to share gives nothing back', moneySlices([]), []);
check(
  'shares come back largest first with zeros dropped',
  moneySlices([
    { name: 'Small', amount: 25 },
    { name: 'Big', amount: 75 },
    { name: 'None', amount: 0 },
  ]),
  [
    { name: 'Big', amount: 75, display: '$75.00', share: 75 },
    { name: 'Small', amount: 25, display: '$25.00', share: 25 },
  ],
);

// --- Band 1: what the condition costs ---------------------------------------

const emptyHealth = summarizeConditionCosts(quarter, [], {});
check('no health money is said plainly', emptyHealth.hasAnything, false);
check('no health money leaves the rows empty', emptyHealth.rows.length, 0);
collect(emptyHealth.headline, emptyHealth.sourcesNote);

const health = summarizeConditionCosts(
  quarter,
  [
    { occurredOn: '2026-04-01', amount: 150, kind: 'insurance', conditionCode: null },
    { occurredOn: '2026-04-14', amount: 80, kind: 'care', conditionCode: 'hashimotos' },
    { occurredOn: '2026-06-01', amount: 150, kind: 'insurance', conditionCode: null },
    { occurredOn: '2026-06-18', amount: 60, kind: 'therapies', conditionCode: null },
  ],
  { hashimotos: "Hashimoto's thyroiditis" },
);
collect(health.headline, health.gapNote, health.untaggedLine, health.careLine, health.sourcesNote);

check('health money is found', health.hasAnything, true);
check('April carries its two records', health.rows[0].value, 230);
check('May recorded nothing and stays blank', health.rows[1].value, null);
check('June carries its two records', health.rows[2].value, 210);
check('one month was blank', health.blankMonths, 1);
check(
  'the average divides by the months that carried a record',
  health.headline,
  '$440.00 of health spending, averaging $220.00 a month across 2 months with anything recorded.',
);
check(
  'insurance is kept apart from care',
  health.careLine,
  '$300.00 of that is insurance, which you pay whether or not anything happens. The remaining $140.00 is care, prescriptions, supplements and sessions.',
);
check('the largest kind leads', health.byKind[0], {
  name: 'Health insurance',
  amount: 300,
  display: '$300.00',
  share: 68,
});
check('three kinds were used', health.byKind.length, 3);
check('the one tagged condition is named', health.byCondition, [
  { name: "Hashimoto's thyroiditis", amount: 80, display: '$80.00', share: 100 },
]);
check(
  'untagged money is reported on its own and never divided',
  health.untaggedLine,
  '$360.00 is not tagged to a condition. It is left out of the per-condition figures rather than shared between them.',
);
checkTrue(
  'the untagged figure is not folded into the condition',
  health.byCondition.reduce((sum, slice) => sum + slice.amount, 0) === 80,
);
checkTrue('repeating bills are said to be left out', health.sourcesNote.includes('Repeating bills are left out'));
checkTrue('double entry is admitted rather than pretended away', health.sourcesNote.includes('counted from both'));

const untaggedOnly = summarizeConditionCosts(
  quarter,
  [{ occurredOn: '2026-05-05', amount: 90, kind: 'prescriptions', conditionCode: null }],
  {},
);
collect(untaggedOnly.headline, untaggedOnly.untaggedLine, untaggedOnly.gapNote);
check('nothing tagged yet gives no per-condition rows', untaggedOnly.byCondition.length, 0);
check(
  'nothing tagged yet says how to fill it in',
  untaggedOnly.untaggedLine,
  '$90.00 recorded, none of it tagged to a condition yet. Tag a bill or a session with what it was for and this fills in.',
);
check('one month with anything is said in the singular', untaggedOnly.headline.includes('the one month'), true);
check('insurance alone is not claimed where there is none', untaggedOnly.careLine, null);

check('every kind has a label', Object.keys(HEALTH_COST_LABELS).length, 5);

// --- Band 2: what eating this way costs -------------------------------------

const groceryLines = [
  { foodName: 'Tomato', on: '2026-04-05', price: 3, priceUnit: 'kg', purchasedQuantity: 2, onSale: false, sourcedFromKitchen: false },
  { foodName: 'Lettuce', on: '2026-04-05', price: 2, priceUnit: 'each', purchasedQuantity: 1, onSale: true, sourcedFromKitchen: false },
  { foodName: 'Chard', on: '2026-04-05', price: null, priceUnit: null, purchasedQuantity: null, onSale: false, sourcedFromKitchen: true },
  { foodName: 'Basil', on: '2026-05-02', price: null, priceUnit: null, purchasedQuantity: null, onSale: false, sourcedFromKitchen: true },
];

const emptyFood = summarizeFoodCosts(quarter, [], []);
check('no food money is said plainly', emptyFood.hasAnything, false);
check('no food money leaves no split to state', emptyFood.splitLine, null);
collect(emptyFood.headline, emptyFood.note);

const food = summarizeFoodCosts(
  quarter,
  [
    { occurredOn: '2026-04-06', amount: 400, kind: 'groceries' },
    { occurredOn: '2026-04-20', amount: 100, kind: 'diningOut' },
    { occurredOn: '2026-05-08', amount: 380, kind: 'groceries' },
  ],
  groceryLines,
);
collect(food.headline, food.gapNote, food.perDayLine, food.splitLine, food.kitchenLine, food.saleLine, food.note);

check('April adds shopping and eating out together', food.rows[0].value, 500);
check('May carries its shopping', food.rows[1].value, 380);
check('June recorded nothing and stays blank', food.rows[2].value, null);
check('one food month was blank', food.blankMonths, 1);
check(
  'the daily figure divides by the days inside the recorded months',
  food.headline,
  '$14.43 a day on food, from $880.00 across 61 days.',
);
check(
  'the split is stated with nothing attached to it',
  food.splitLine,
  '$780.00 of it was shopping and $100.00 was eating out, which is 11% of your food money spent on meals somebody else made.',
);
check(
  'what came out of the kitchen is counted',
  food.kitchenLine,
  '2 lines on your shopping lists were covered out of the kitchen instead of bought.',
);
check(
  'a sale price is admitted rather than read as the usual price',
  food.saleLine,
  '1 of 2 priced lines were on sale, so a price history read across this stretch runs lower than the usual price.',
);
checkTrue('the blank month is explained under the daily figure', food.perDayLine !== null);
checkTrue('growing money is said to live elsewhere', food.note.includes('growing'));

const allOut = summarizeFoodCosts(quarter, [{ occurredOn: '2026-04-02', amount: 60, kind: 'diningOut' }], []);
collect(allOut.headline, allOut.splitLine, allOut.gapNote);
check(
  'eating out on its own is stated without a percentage',
  allOut.splitLine,
  'All of it was eating out. Nothing has been recorded under groceries in this stretch.',
);
check('no kitchen lines gives no kitchen sentence', allOut.kitchenLine, null);
check('no priced lines gives no sale sentence', allOut.saleLine, null);

const allShopping = summarizeFoodCosts(quarter, [{ occurredOn: '2026-04-02', amount: 60, kind: 'groceries' }], []);
collect(allShopping.splitLine);
check(
  'shopping on its own is stated the same way',
  allShopping.splitLine,
  'All of it was shopping. Nothing has been recorded under eating out in this stretch.',
);

const fullQuarter = summarizeFoodCosts(
  quarter,
  [
    { occurredOn: '2026-04-06', amount: 300, kind: 'groceries' },
    { occurredOn: '2026-05-06', amount: 300, kind: 'groceries' },
    { occurredOn: '2026-06-06', amount: 300, kind: 'groceries' },
  ],
  [],
);
check('no blank months gives no gap note', fullQuarter.gapNote, null);
check('no blank months needs no explanation of the divisor', fullQuarter.perDayLine, null);
check('a full quarter divides by all 91 days', fullQuarter.headline, '$9.89 a day on food, from $900.00 across 91 days.');

// --- Band 3: what the garden costs ------------------------------------------

const lastPaid = {
  tomato: { price: 3, unit: 'kg', on: '2026-03-01' },
};

const emptyGarden = summarizeGrowingCosts(quarter, [], [], {}, 'metric');
check('an empty garden is said plainly', emptyGarden.hasAnything, false);
collect(emptyGarden.headline, emptyGarden.netLine, emptyGarden.caveat);

const harvests = [
  { id: 'h1', harvestedOn: '2026-05-20', foodName: 'Tomato', quantity: 2, unit: 'kg', plotName: 'Back bed', plantingId: null },
  { id: 'h2', harvestedOn: '2026-06-02', foodName: 'Cucumber', quantity: 6, unit: 'count', plotName: 'Back bed', plantingId: null },
];
const growing = summarizeGrowingCosts(
  quarter,
  [
    { occurredOn: '2026-04-03', amount: 60, plotName: 'Back bed' },
    { occurredOn: '2026-05-11', amount: 20, plotName: null },
  ],
  harvests,
  lastPaid,
  'metric',
);
collect(
  growing.headline,
  growing.gapNote,
  growing.perWeightLine,
  growing.shopLine,
  growing.netLine,
  growing.countedOutLine,
  growing.byAreaLine,
  growing.caveat,
);

check('the garden has something to say', growing.hasAnything, true);
check('April carries its growing cost', growing.rows[0].value, 60);
check('June had no growing cost and stays blank', growing.rows[2].value, null);
check(
  'the cost per weight is taken only over what was weighed',
  growing.headline,
  '$40.00 a kilo, from $80.00 spent against 2 kg picked.',
);
check(
  'a counted crop is named as left out rather than turned into a weight',
  growing.countedOutLine,
  '1 picking was counted rather than weighed, and is left out of the cost per weight. A count of cucumbers is not a weight and is never turned into one.',
);
check(
  'the shop comparison uses only prices actually paid',
  growing.shopLine,
  'At prices you have recorded paying, the same picking would have cost $6.00 in a shop.',
);
check(
  'the net names what could not be priced',
  growing.netLine,
  '$74.00 more spent than the priced picking comes to so far. 1 picking has no matching recorded price and is left out of that figure, so the garden gave back more than this shows.',
);
check(
  'growing money is split by area with the untied money named',
  growing.byAreaLine,
  'Most of it went to Back bed, at $60.00. A further $20.00 was not tied to one area.',
);
checkTrue('the caveat about a one-off purchase is always there', growing.caveat.length > 0);

const imperial = summarizeGrowingCosts(
  quarter,
  [{ occurredOn: '2026-04-03', amount: 80, plotName: 'Back bed' }],
  [harvests[0]],
  lastPaid,
  'imperial',
);
collect(imperial.headline, imperial.perWeightLine, imperial.byAreaLine);
check('imperial counts in pounds', imperial.headline, '$18.14 a pound, from $80.00 spent against 4.4 lb picked.');
check('a single area with nothing untied is said plainly', imperial.byAreaLine, 'All of it went to Back bed.');

const countOnly = summarizeGrowingCosts(
  quarter,
  [{ occurredOn: '2026-04-03', amount: 40, plotName: null }],
  [harvests[1]],
  {},
  'metric',
);
collect(countOnly.headline, countOnly.netLine, countOnly.countedOutLine, countOnly.byAreaLine);
check('nothing weighed gives no cost per weight', countOnly.perWeightLine, null);
check(
  'nothing weighed is said rather than divided by zero',
  countOnly.headline,
  '$40.00 spent on growing, with nothing weighed yet to set it against.',
);
check(
  'nothing priced is said rather than read as a loss',
  countOnly.netLine,
  '$40.00 spent on growing, and none of what you picked matches a price you have recorded paying, so there is nothing to set against it yet.',
);
check('money tied to no area is said', countOnly.byAreaLine, 'None of it was tied to a particular area.');

const pickedOnly = summarizeGrowingCosts(quarter, [], [harvests[0]], lastPaid, 'metric');
collect(pickedOnly.headline, pickedOnly.netLine);
check(
  'picking with no recorded cost is said rather than called free',
  pickedOnly.headline,
  '2 kg picked, with no growing costs recorded against it.',
);
check('an unspent garden is ahead by what it saved', pickedOnly.netLine, '$6.00 more than it cost, counting only what has a recorded price.');

const evenGarden = summarizeGrowingCosts(
  quarter,
  [{ occurredOn: '2026-04-03', amount: 6, plotName: 'Back bed' }],
  [harvests[0]],
  lastPaid,
  'metric',
);
collect(evenGarden.netLine);
check('a garden exactly even says so', evenGarden.netLine, 'What you spent and what the priced picking comes to match exactly.');

// --- Band 4: supplements, and what food is reaching --------------------------

check('no dates gives no run length', describeRunLength(null, '2026-05-15'), null);
check('an end before its start gives no run length', describeRunLength('2026-05-15', '2026-01-01'), null);
check('a same-day run is said plainly', describeRunLength('2026-05-15', '2026-05-15'), 'less than a day');
check('a short run counts days', describeRunLength('2026-05-01', '2026-05-15'), '14 days');
check('a one-day run is singular', describeRunLength('2026-05-01', '2026-05-02'), '1 day');
check('a long run rounds to months', describeRunLength('2026-01-01', '2026-05-15'), 'about 4 months');
check('a very long run rounds to years', describeRunLength('2023-01-01', '2026-01-01'), 'about 3 years');

const supplements = [
  {
    id: 's1',
    name: 'Magnesium glycinate',
    startDate: '2026-01-01',
    endDate: '2026-05-15',
    active: false,
    nutrientCodes: ['MG'],
  },
  { id: 's2', name: 'Vitamin D3', startDate: '2026-02-01', endDate: null, active: true, nutrientCodes: ['VITD'] },
];
const coverage = [
  { nutrientCode: 'MG', displayName: 'Magnesium', averagePercent: 96.4, days: 21 },
  { nutrientCode: 'VITD', displayName: 'Vitamin D', averagePercent: 40, days: 21 },
];

const supps = summarizeSupplementCosts(
  quarter,
  supplements,
  [
    { occurredOn: '2026-04-09', amount: 25 },
    { occurredOn: '2026-06-09', amount: 25 },
  ],
  coverage,
  30,
  '2026-04-01',
  '2026-06-30',
);
collect(
  supps.headline,
  supps.gapNote,
  supps.runningLine,
  supps.coverageNote,
  supps.boundary,
  ...supps.ended.map((row) => row.line),
  ...supps.coverage.map((row) => row.line),
);

check('supplement spending is found', supps.hasAnything, true);
check('May had no supplement spending and stays blank', supps.rows[1].value, null);
check(
  'the average divides by the months that carried a record',
  supps.headline,
  '$50.00 on supplements, averaging $25.00 a month across 2 months with anything recorded.',
);
check('only the run that ended inside the range is listed', supps.ended.length, 1);
check('the ended run is named with how long it ran', supps.ended[0], {
  id: 's1',
  name: 'Magnesium glycinate',
  line: 'Ended 2026-05-15, after about 4 months.',
});
check('only the ended run nutrients are read', supps.coverage.length, 1);
check(
  'food coverage is reported as what food is reaching',
  supps.coverage[0].line,
  'Magnesium: food by itself has averaged 96% of the target across 21 days with a meal logged.',
);
check(
  'the coverage note says what it was read over',
  supps.coverageNote,
  'Read over the last 30 days, counting only days with a meal logged, and only the nutrients carried by the supplements above.',
);
check(
  'what is still running is counted',
  supps.runningLine,
  '1 supplement is recorded as running right now. The ones food is not covering are the ones to keep.',
);

// The boundary, which is the whole reason this band is written the way it is.
checkTrue('the boundary refuses to say a stop was right', supps.boundary.includes('whether stopping any supplement was right'));
checkTrue('the boundary says no dose is recorded', supps.boundary.includes('records a dose being swallowed'));
checkTrue('the boundary says it is not advice to stop', supps.boundary.includes('advice to stop taking anything'));
checkTrue('the word unnecessary appears only as a refusal', supps.boundary.includes('never that a supplement was unnecessary'));
for (const row of supps.coverage) {
  checkTrue(`"${row.nutrientCode}" does not call a supplement unnecessary`, !row.line.includes('unnecessary'));
  checkTrue(`"${row.nutrientCode}" does not tell anybody to stop`, !row.line.toLowerCase().includes('stop taking'));
}

const noLabels = summarizeSupplementCosts(
  quarter,
  [{ id: 's3', name: 'Turmeric', startDate: null, endDate: '2026-04-20', active: false, nutrientCodes: [] }],
  [],
  [],
  30,
  '2026-04-01',
  '2026-06-30',
);
collect(noLabels.headline, noLabels.runningLine, noLabels.coverageNote, noLabels.boundary, noLabels.ended[0].line);
check('a run with no start date says so', noLabels.ended[0].line, 'Ended 2026-04-20. No start date was recorded, so how long it ran is not known.');
check(
  'no labelled nutrients says how to fill it in',
  noLabels.coverageNote,
  'No nutrients are recorded on the labels of the supplements that ended, so there is nothing to read food against. Add what a supplement contains under Life > My Meds and this fills in.',
);
check('nothing running is said plainly', noLabels.runningLine, 'Nothing is recorded as running right now.');
check('supplements with no spending still count as something', noLabels.hasAnything, true);
check('no spending is said rather than shown as zero', noLabels.headline, 'No supplement spending recorded in this stretch.');

const nothingAtAll = summarizeSupplementCosts(quarter, [], [], [], 30, '2026-04-01', '2026-06-30');
collect(nothingAtAll.headline, nothingAtAll.runningLine, nothingAtAll.boundary);
check('nothing at all is said plainly', nothingAtAll.hasAnything, false);
check('nothing at all gives no coverage note', nothingAtAll.coverageNote, null);
checkTrue('the boundary is present even with nothing recorded', nothingAtAll.boundary.length > 0);

// --- The whole lens ---------------------------------------------------------

const whole = summarizeCosts({
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  system: 'metric',
  health: [{ occurredOn: '2026-04-14', amount: 80, kind: 'care', conditionCode: 'hashimotos' }],
  conditionNames: { hashimotos: "Hashimoto's thyroiditis" },
  food: [{ occurredOn: '2026-04-06', amount: 400, kind: 'groceries' }],
  groceryLines,
  growing: [{ occurredOn: '2026-04-03', amount: 60, plotName: 'Back bed' }],
  harvests,
  lastPaid,
  supplements,
  supplementSpend: [{ occurredOn: '2026-04-09', amount: 25 }],
  foodCoverage: coverage,
  coverageDays: 30,
});

check('the whole lens builds its months once', whole.months.length, 3);
check('the whole lens knows it has something', whole.hasAnything, true);
check('every band comes back', Object.keys(whole).sort(), [
  'condition',
  'endDate',
  'food',
  'growing',
  'hasAnything',
  'months',
  'startDate',
  'supplements',
  'system',
]);
check('the range comes back as it went in', [whole.startDate, whole.endDate], ['2026-04-01', '2026-06-30']);
check('the measurement system carries through', whole.system, 'metric');

const emptyWhole = summarizeCosts({
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  system: 'metric',
  health: [],
  conditionNames: {},
  food: [],
  groceryLines: [],
  growing: [],
  harvests: [],
  lastPaid: {},
  supplements: [],
  supplementSpend: [],
  foodCoverage: [],
  coverageDays: 30,
});
check('an empty lens says it has nothing', emptyWhole.hasAnything, false);
collect(
  emptyWhole.condition.headline,
  emptyWhole.food.headline,
  emptyWhole.growing.headline,
  emptyWhole.growing.netLine,
  emptyWhole.supplements.headline,
);

// --- Nothing here judges a decision -----------------------------------------

const forbidden = [
  'you should',
  'you failed',
  'poor ',
  'disappointing',
  'well done',
  'good job',
  'keep it up',
  'you are behind',
  'bad ',
  'worse',
  'better than',
  'underperform',
  'too much',
  'overspend',
  'wasteful',
  'cut back',
];
for (const sentence of everySentence) {
  for (const word of forbidden) {
    checkTrue(`"${word.trim()}" stays out of "${sentence.slice(0, 44)}"`, !sentence.toLowerCase().includes(word));
  }
}

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
