// Runs lib/harvestYield.ts: the arithmetic behind Trends > Garden Yield.
//
// Built 2026-09-23, phase 4 of the cross-app push.
//
// The rules checked:
//
//  1. A MONTH WITH NOTHING RECORDED IS A GAP, NEVER A ZERO, and the note
//     under the rows says a quiet month may be out of season.
//  2. Months are built off the calendar, so February is 28 or 29 days and a
//     range clipped at either end marks that month partial.
//  3. Mass converts and adds up; a count never joins a weight; anything else
//     is kept in its own bucket and said plainly.
//  4. A crop measured only by count gets no percentage share, since it has
//     no weight to take a share of.
//  5. Growing time is the middle value rather than the mean, reads against
//     the date the person wrote, and a planting with no expected date is
//     counted and left uncompared.
//  6. A first picking dated before its planting is left out rather than
//     charted as a negative growing time.
//  7. Compost totals stay per unit, since buckets, bags and kilos do not add.
//  8. Nothing here marks a garden: no sentence blames, praises, or claims a
//     harvest was good or bad.
//
// Run with: node scripts/test_harvest_yield.js
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

// harvestYield.ts takes its day arithmetic from eatingVariety.ts, its
// per-unit refusals from harvestTrade.ts and its mass conversion from
// unitConversion.ts rather than growing a second copy of any of them.
const V = run('lib/eatingVariety.ts', {});
const T = run('lib/harvestTrade.ts', {});
const U = run('lib/unitConversion.ts', {});
const H = run('lib/harvestYield.ts', {
  './eatingVariety': V,
  './harvestTrade': T,
  './unitConversion': U,
});

const {
  buildMonths,
  monthsBack,
  isCountUnit,
  harvestGrams,
  formatWeight,
  describeTally,
  summarizeYield,
  middleValue,
  describeDifference,
  summarizeTiming,
  summarizeCompost,
  summarizeSharing,
  summarizeHarvestYield,
  describeGardenYieldHome,
  describeDaysAgo,
} = H;

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

// --- Months ----------------------------------------------------------------

const wholeYear = buildMonths('2026-01-01', '2026-12-31');
check('a whole year is twelve months', wholeYear.length, 12);
check('the first month is labelled', wholeYear[0].label, 'Jan 2026');
check('the last month is labelled', wholeYear[11].label, 'Dec 2026');
check('a whole year has no partial month', wholeYear.filter((m) => m.partial).length, 0);
check('February 2026 ends on the 28th', wholeYear[1].monthEnd, '2026-02-28');
check('February 2024 ends on the 29th', buildMonths('2024-02-01', '2024-02-29')[0].monthEnd, '2024-02-29');

const clipped = buildMonths('2026-03-14', '2026-05-09');
check('a clipped range covers the months it touches', clipped.map((m) => m.label), ['Mar 2026', 'Apr 2026', 'May 2026']);
check('the first month is marked partial', clipped[0].partial, true);
check('the middle month is whole', clipped[1].partial, false);
check('the last month is marked partial', clipped[2].partial, true);
check('a clipped month starts where the range starts', clipped[0].monthStart, '2026-03-14');
check('a clipped month ends where the range ends', clipped[2].monthEnd, '2026-05-09');
check('a backwards range builds nothing', buildMonths('2026-05-01', '2026-04-01'), []);
check('one day is one month', buildMonths('2026-07-04', '2026-07-04').length, 1);

check('twelve months back crosses the year', monthsBack('2026-09-23', 12), '2025-10-01');
check('one month back is this month', monthsBack('2026-09-23', 1), '2026-09-01');
check('twenty four months back', monthsBack('2026-09-23', 24), '2024-10-01');

// --- Units -----------------------------------------------------------------

check('count is a count', isCountUnit('count'), true);
check('each is a count', isCountUnit('Each'), true);
check('kg is not a count', isCountUnit('kg'), false);

check('kilos convert', harvestGrams(2, 'kg'), 2000);
check('pounds convert', Math.round(harvestGrams(1, 'lb')), 454);
check('ounces convert', Math.round(harvestGrams(4, 'oz')), 113);
check('grams pass through', harvestGrams(250, 'g'), 250);
check('a count is not a weight', harvestGrams(12, 'count'), null);
check('a volume with no density refuses', harvestGrams(1, 'cup'), null);
check('a bunch is not a weight', harvestGrams(3, 'bunch'), null);

check('grams stay grams under a kilo', formatWeight(850, 'metric'), '850 g');
check('a kilo reads as kilos', formatWeight(2450, 'metric'), '2.5 kg');
check('imperial under a pound reads as ounces', formatWeight(200, 'imperial'), '7 oz');
check('imperial over a pound reads as pounds', formatWeight(2450, 'imperial'), '5.4 lb');

// --- Band 1: what the garden gave -----------------------------------------

function harvest(id, on, foodName, quantity, unit, plotName, plantingId) {
  return { id, harvestedOn: on, foodName, quantity, unit, plotName: plotName ?? null, plantingId: plantingId ?? null };
}

const months = buildMonths('2026-06-01', '2026-09-30');
const harvests = [
  harvest('h1', '2026-06-12', 'Tomato', 1.5, 'kg', 'Back Bed', 'p1'),
  harvest('h2', '2026-07-03', 'Tomato', 2, 'kg', 'Back Bed', 'p1'),
  harvest('h3', '2026-07-19', 'Kale', 400, 'g', 'Front Bed', 'p2'),
  harvest('h4', '2026-09-02', 'Cucumber', 8, 'count', 'Back Bed', 'p3'),
];
const band1 = summarizeYield(harvests, months, 'metric');
collect(band1.headline, band1.countLine, band1.otherUnitsLine, band1.gapNote, band1.unassignedLine);

check('four months of rows', band1.rows.length, 4);
check('June carries its weight', band1.rows[0].value, 1500);
check('July adds both pickings', band1.rows[1].value, 2400);
check('August recorded nothing, so it is null', band1.rows[2].value, null);
check('an unrecorded month says so', band1.rows[2].display, 'nothing recorded');
check('a count-only month has a zero weight rather than a gap', band1.rows[3].value, 0);
check('a count-only month says what it was', band1.rows[3].display, '8 picked by count');
check('one month counted blank', band1.blankMonths, 1);
checkTrue('the gap note explains the blank', band1.gapNote.includes('out of season'));
check('crops are counted', band1.byCrop.length, 3);
check('the heaviest crop leads', band1.byCrop[0].name, 'Tomato');
check('the heaviest crop carries its share', band1.byCrop[0].share, 90);
check('a count-only crop has no share', band1.byCrop.find((c) => c.name === 'Cucumber').share, null);
check('a count-only crop still says what it gave', band1.byCrop.find((c) => c.name === 'Cucumber').display, '8 picked by count');
check('areas are counted', band1.byArea.length, 2);
check('nothing is unassigned here', band1.unassignedLine, null);
check('the count line is said beside the weight', band1.countLine !== null, true);
check('no odd units here', band1.otherUnitsLine, null);
check('the total holds both shapes', band1.totalDisplay, '3.9 kg and 8 picked by count');

const noArea = summarizeYield([harvest('h9', '2026-07-01', 'Basil', 300, 'g', null, null)], months, 'metric');
collect(noArea.headline, noArea.unassignedLine);
checkTrue('a harvest with no area is said', noArea.unassignedLine.includes('no area'));
check('a harvest with no area still counts as a crop', noArea.byCrop.length, 1);
check('a harvest with no area lists no area', noArea.byArea.length, 0);

const oddUnits = summarizeYield([harvest('h8', '2026-07-01', 'Chard', 4, 'bunch', 'Front Bed', null)], months, 'metric');
collect(oddUnits.headline, oddUnits.otherUnitsLine);
checkTrue('an odd unit is kept in its own bucket', oddUnits.otherUnitsLine.includes('4 bunch'));
check('an odd unit takes no share of a weight', oddUnits.byCrop[0].share, null);

const nothing = summarizeYield([], months, 'metric');
collect(nothing.headline);
check('nothing harvested has nothing', nothing.hasAnything, false);
check('every month reads as a gap', nothing.rows.filter((r) => r.value === null).length, 4);
checkTrue('the empty headline points at where to log', nothing.headline.includes('Harvest Log'));

check('imperial reads the same figures in pounds', summarizeYield(harvests, months, 'imperial').byCrop[0].display, '7.7 lb');

// --- Band 2: days to harvest ----------------------------------------------

check('a middle value of one is itself', middleValue([5]), 5);
check('a middle value takes the lower middle', middleValue([1, 3, 5, 9]), 3);
check('a middle value ignores order', middleValue([9, 1, 5]), 5);
check('no values give no middle', middleValue([]), null);
check('one outlier cannot move the middle', middleValue([2, 3, 4, 90]), 3);

check('on the day reads plainly', describeDifference(0), 'on the day you expected');
check('one day late is singular', describeDifference(1), '1 day later than you expected');
check('early is early', describeDifference(-6), '6 days earlier than you expected');

function planting(id, foodName, plantedOn, expected, status, firstHarvestOn, plotName) {
  return {
    id,
    foodName,
    plotName: plotName ?? null,
    plantedOn,
    expectedHarvestStart: expected,
    status,
    firstHarvestOn: firstHarvestOn ?? null,
  };
}

const band2 = summarizeTiming(
  [
    planting('p1', 'Tomato', '2026-04-01', '2026-06-06', 'harvested', '2026-06-12', 'Back Bed'),
    planting('p2', 'Kale', '2026-05-01', '2026-07-01', 'harvested', '2026-07-19', 'Front Bed'),
    planting('p3', 'Cucumber', '2026-06-01', null, 'harvested', '2026-09-02', 'Back Bed'),
    planting('p4', 'Squash', '2026-06-01', '2026-08-15', 'growing', null, 'Front Bed'),
    planting('p5', 'Leek', '2026-07-01', '2026-11-01', 'growing', null, 'Front Bed'),
  ],
  '2026-09-30',
);
for (const runRow of band2.runs) collect(runRow.line);
for (const crop of band2.byCrop) collect(crop.line);
for (const waiting of band2.stillGrowing) collect(waiting.line);
collect(band2.headline, band2.noExpectedLine, band2.caveat);

check('three plantings were picked', band2.runs.length, 3);
check('the longest grower leads', band2.runs[0].foodName, 'Cucumber');
const tomato = band2.runs.find((r) => r.foodName === 'Tomato');
check('tomato took 72 days', tomato.actualDays, 72);
check('tomato was expected in 66', tomato.expectedDays, 66);
check('tomato came in 6 days late', tomato.difference, 6);
checkTrue('the line names the area', tomato.line.includes('Back Bed'));
const cucumber = band2.runs.find((r) => r.foodName === 'Cucumber');
check('a planting with no expected date has no difference', cucumber.difference, null);
checkTrue('and its line says there is nothing to compare', cucumber.line.includes('No date was expected'));
check('one planting had no expected date', band2.noExpectedLine.startsWith('1 of these'), true);
check('the middle difference is the lower of two', band2.runs.filter((r) => r.difference != null).length, 2);
checkTrue('the headline carries the middle difference', band2.headline.includes('later than you expected'));
check('one planting is past its date and still growing', band2.stillGrowing.length, 1);
check('the one past its date is the squash', band2.stillGrowing[0].foodName, 'Squash');
check('it is 46 days past', band2.stillGrowing[0].daysPast, 46);
check('a crop shown once gets no per-crop row', band2.byCrop.length, 0);

const twoTomatoes = summarizeTiming(
  [
    planting('p1', 'Tomato', '2026-04-01', '2026-06-06', 'harvested', '2026-06-12', 'Back Bed'),
    planting('p6', 'Tomato', '2026-04-15', '2026-06-20', 'harvested', '2026-06-22', 'Front Bed'),
  ],
  '2026-09-30',
);
for (const crop of twoTomatoes.byCrop) collect(crop.line);
check('two plantings of one crop make a per-crop row', twoTomatoes.byCrop.length, 1);
check('the per-crop row counts both', twoTomatoes.byCrop[0].runs, 2);
check('the per-crop middle takes the lower', twoTomatoes.byCrop[0].median, 2);

const backwards = summarizeTiming(
  [planting('p7', 'Beet', '2026-06-01', '2026-08-01', 'harvested', '2026-05-01', 'Back Bed')],
  '2026-09-30',
);
check('a picking dated before its planting is left out', backwards.runs.length, 0);

const noTiming = summarizeTiming([], '2026-09-30');
collect(noTiming.headline);
check('no plantings means nothing to read', noTiming.hasAnything, false);
checkTrue('the empty headline says what a planting needs', noTiming.headline.includes('planting date'));

// --- Band 3: compost -------------------------------------------------------

function compostEvent(on, kind, amount, unit, plotName, materialClass) {
  return {
    occurredOn: on,
    kind,
    materialClass: materialClass ?? null,
    amount: amount ?? null,
    unit: unit ?? '',
    plotName: plotName ?? null,
  };
}

const band3 = summarizeCompost(
  [
    compostEvent('2026-06-05', 'added', 2, 'bucket', null, 'green'),
    compostEvent('2026-06-09', 'added', 1, 'bucket', null, 'brown'),
    compostEvent('2026-06-20', 'turned', null, '', null, null),
    compostEvent('2026-07-01', 'turned', null, '', null, null),
    compostEvent('2026-08-01', 'harvested', 3, 'bucket', null, null),
    compostEvent('2026-08-02', 'applied', 2, 'bucket', 'Back Bed', null),
    compostEvent('2026-08-03', 'applied', 4, 'kg', 'Front Bed', null),
    compostEvent('2026-08-09', 'applied', null, 'bucket', 'Back Bed', null),
  ],
  { active: 1, curing: 1, finished: 0 },
);
collect(band3.headline, band3.materialsLine, band3.turnsLine, band3.pilesLine, band3.unmeasuredLine);

check('what came out is totalled', band3.produced, [{ unit: 'bucket', amount: 3, display: '3 bucket' }]);
check('buckets and kilos stay apart', band3.applied.length, 2);
check('the bigger applied unit leads', band3.applied[0].unit, 'kg');
check('two areas took compost', band3.appliedByArea.length, 2);
check('areas read alphabetically', band3.appliedByArea.map((a) => a.name), ['Back Bed', 'Front Bed']);
checkTrue('the headline says what came out and what went on', band3.headline.includes('taken out'));
checkTrue('greens and browns are counted', band3.materialsLine.includes('1 green'));
checkTrue('turns are counted', band3.turnsLine.includes('2 times'));
checkTrue('piles are counted', band3.pilesLine.includes('2 piles'));
checkTrue('an amount nobody wrote down is said', band3.unmeasuredLine.includes('1 of those'));

const noCompost = summarizeCompost([], { active: 0, curing: 0, finished: 0 });
collect(noCompost.headline);
check('no compost has nothing', noCompost.hasAnything, false);
checkTrue('the empty headline points at the lens', noCompost.headline.includes('Garden > Compost'));

const onlyAdded = summarizeCompost([compostEvent('2026-06-05', 'added', 2, 'bucket', null, 'green')], {
  active: 1,
  curing: 0,
  finished: 0,
});
collect(onlyAdded.headline);
checkTrue('a pile with nothing out of it yet says so', onlyAdded.headline.includes('Nothing has come out'));

// --- Band 4: given away, traded and received ------------------------------

function disposition(id, on, kind, foodName, quantity, unit, amount, received) {
  return {
    id,
    occurredOn: on,
    kind,
    foodName,
    quantityGiven: quantity,
    unit,
    withWhom: null,
    amount: amount ?? null,
    received: received ?? [],
    recipientKind: null,
    receiptGiven: false,
  };
}

const band4 = summarizeSharing(
  [
    disposition('d1', '2026-08-01', 'sold', 'Tomato', 5, 'kg', 24),
    disposition('d2', '2026-08-04', 'given', 'Kale', 2, 'bunch'),
    disposition('d3', '2026-08-09', 'traded', 'Tomato', 3, 'kg', null, [
      { foodName: 'Eggs', quantity: 12, unit: 'count' },
    ]),
  ],
  [
    { receivedOn: '2026-08-11', fromWhom: 'Marta', foodName: 'Chayote', quantity: 4, unit: 'count' },
    { receivedOn: '2026-08-18', fromWhom: 'Marta', foodName: 'Chayote', quantity: 3, unit: 'count' },
  ],
);
collect(band4.headline, band4.receivedLine, band4.note);
for (const row of band4.outgoing) collect(`${row.foodName} ${row.display} ${row.kinds}`);

check('three things went out', band4.surplus.sales + band4.surplus.trades + band4.surplus.gifts, 3);
check('the money from selling is totalled', band4.surplus.salesTotal, 24);
check('tomato sold and traded reads as one food', band4.outgoing.filter((r) => r.foodName === 'Tomato').length, 1);
check('and both ways are named', band4.outgoing.find((r) => r.foodName === 'Tomato').kinds, 'sold and traded');
check('a gift is worded as given away', band4.outgoing.find((r) => r.foodName === 'Kale').kinds, 'given away');
check('two lots came in', band4.received.length, 1);
check('the same food from the same person adds up', band4.received[0].display, '7 count');
check('who it came from is kept', band4.received[0].from, 'Marta');
checkTrue('what came in is said', band4.receivedLine.includes('2 lots'));
check('every sale had an amount, so no note', band4.note, null);

const unpricedSale = summarizeSharing([disposition('d4', '2026-08-01', 'sold', 'Tomato', 5, 'kg', null)], []);
collect(unpricedSale.note);
checkTrue('a sale with no amount is said', unpricedSale.note.includes('no amount'));

const noSharing = summarizeSharing([], []);
collect(noSharing.headline);
check('nothing shared has nothing', noSharing.hasAnything, false);

// --- The whole lens --------------------------------------------------------

const whole = summarizeHarvestYield({
  startDate: '2026-06-01',
  endDate: '2026-09-30',
  system: 'metric',
  harvests,
  plantings: [planting('p1', 'Tomato', '2026-04-01', '2026-06-06', 'harvested', '2026-06-12', 'Back Bed')],
  compostEvents: [],
  compostPiles: { active: 0, curing: 0, finished: 0 },
  dispositions: [],
  shares: [],
});
check('the lens carries its months', whole.months.length, 4);
check('one band with something makes the lens have something', whole.hasAnything, true);
check('the range is carried through', whole.endDate, '2026-09-30');

const emptyLens = summarizeHarvestYield({
  startDate: '2026-06-01',
  endDate: '2026-09-30',
  system: 'metric',
  harvests: [],
  plantings: [],
  compostEvents: [],
  compostPiles: { active: 0, curing: 0, finished: 0 },
  dispositions: [],
  shares: [],
});
check('an empty garden says so across the lens', emptyLens.hasAnything, false);

// --- The Home card ---------------------------------------------------------

const home = describeGardenYieldHome({
  monthLabel: 'September',
  harvests: [
    harvest('h1', '2026-09-02', 'Tomato', 1.5, 'kg', 'Back Bed', null),
    harvest('h2', '2026-09-11', 'Kale', 400, 'g', 'Front Bed', null),
  ],
  system: 'metric',
  avoidedCost: 18.4,
  unpricedCount: 0,
  lastHarvestOn: '2026-09-11',
  today: '2026-09-23',
});
collect(home.headline, home.line, home.caption);
check('the weight leads the card', home.headline, '1.9 kg');
checkTrue('the line counts the crops', home.line.includes('2 crops'));
checkTrue('the caption is money kept rather than earned', home.caption.includes('did not have to buy'));
checkTrue('the caption names the money', home.caption.includes('$18.40'));

const homeCounted = describeGardenYieldHome({
  monthLabel: 'September',
  harvests: [
    harvest('h1', '2026-09-02', 'Tomato', 1.5, 'kg', 'Back Bed', null),
    harvest('h4', '2026-09-05', 'Cucumber', 8, 'count', 'Back Bed', null),
  ],
  system: 'metric',
  avoidedCost: 0,
  unpricedCount: 2,
  lastHarvestOn: '2026-09-05',
  today: '2026-09-23',
});
collect(homeCounted.headline, homeCounted.line, homeCounted.caption);
check('a weight still leads when a count sits beside it', homeCounted.headline, '1.5 kg');
checkTrue('and the count is said in the line', homeCounted.line.includes('8 picked by count'));
checkTrue('no price means no figure rather than a zero', homeCounted.caption.includes('no figure'));

const homeEmpty = describeGardenYieldHome({
  monthLabel: 'September',
  harvests: [],
  system: 'metric',
  avoidedCost: 0,
  unpricedCount: 0,
  lastHarvestOn: '2026-08-14',
  today: '2026-09-23',
});
collect(homeEmpty.line, homeEmpty.caption);
check('nothing picked draws no headline', homeEmpty.headline, null);
checkTrue('nothing picked says the month', homeEmpty.line.includes('September'));
checkTrue('and says when the last picking was', homeEmpty.caption.includes('about 1 month ago'));

const homeNever = describeGardenYieldHome({
  monthLabel: 'September',
  harvests: [],
  system: 'metric',
  avoidedCost: 0,
  unpricedCount: 0,
  lastHarvestOn: null,
  today: '2026-09-23',
});
collect(homeNever.line, homeNever.caption);
checkTrue('never picked points at the Harvest Log', homeNever.caption.includes('Harvest Log'));

check('today is today', describeDaysAgo(0), 'today');
check('yesterday is yesterday', describeDaysAgo(1), 'yesterday');
check('a fortnight is counted in days', describeDaysAgo(14), '14 days ago');
check('a long gap rounds to months', describeDaysAgo(95), 'about 3 months ago');

// --- Nothing here marks a garden ------------------------------------------

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
];
for (const sentence of everySentence) {
  for (const word of forbidden) {
    checkTrue(`"${word.trim()}" stays out of "${sentence.slice(0, 44)}"`, !sentence.toLowerCase().includes(word));
  }
}

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
