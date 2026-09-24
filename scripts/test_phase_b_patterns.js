// Checks the pure pieces of Phase B of the 2026-09-24 gap review, Pattern
// Finder discipline ("Start Phase B"):
//
// 1. What every finding is based on, and how often a food turns up in an
//    ordinary stretch of the same length (lib/patternBasis.ts).
// 2. Other things on record around the same flares: flares with no meals
//    logged, sleep the night before, a treatment started or stopped in the
//    week before (lib/patternContext.ts).
// 3. Experiments: leave a food out, then bring it back (lib/foodExperiment.ts).
// 4. Your usual range on Trends, drawn from the person's readings and never
//    worded as a verdict on them (lib/yourUsual.ts).
//
// Every module loaded here imports nothing. Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
  });
  return module.exports;
}

const basis = load('lib/patternBasis.ts');
const context = load('lib/patternContext.ts');
const experiment = load('lib/foodExperiment.ts');
const usual = load('lib/yourUsual.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
function same(actual, expected, label) {
  check(JSON.stringify(actual) === JSON.stringify(expected), label + '\n  got      ' + JSON.stringify(actual) + '\n  expected ' + JSON.stringify(expected));
}

const written = [];

// 1. Windows and comparisons.
const meals = [
  { eatenAt: '2026-09-01T08:00', keys: ['f:bread', 'c:Grain'] },
  { eatenAt: '2026-09-01T19:00', keys: ['f:cheese'] },
  { eatenAt: '2026-09-02T08:00', keys: ['f:bread'] },
];
same([...basis.keysInWindow(meals, new Date(2026, 8, 1, 12, 0), 6)].sort(), ['c:Grain', 'f:bread'], 'a window holds what was eaten in it');
same(basis.keysInWindow(meals, new Date(2026, 8, 1, 17, 0), 3), null, 'a window with nothing logged is null, not empty');
same(basis.keysInWindow(meals, new Date(2026, 8, 1, 8, 0), 1).size, 2, 'a meal at the window end counts');

const ends = basis.usualWindowEnds('2026-09-01', '2026-09-02', new Date(2026, 8, 2, 13, 0));
same(ends.length, 6, 'four stretch ends a day, stopping at now');
same(ends.map((end) => end.getHours()), [6, 12, 18, 0, 6, 12], 'stretches end at 6, 12, 18 and midnight');

const set = (...keys) => new Set(keys);
const flares = [set('f:bread'), set('f:bread'), set('f:bread', 'f:tea'), null];
const everyDay = [set('f:tea'), set('f:tea'), set('f:tea'), set('f:tea', 'f:bread'), null];
const bread = basis.compareWindows('f:bread', flares, everyDay);
same(bread.flaresWithMeals, 3, 'a flare with nothing logged before it is left out of the count');
same(bread.verdict, 'more', 'eaten before every flare but a quarter of ordinary stretches is more than usual');
const tea = basis.compareWindows('f:tea', flares, everyDay);
same(tea.verdict, 'same', 'a food eaten in every stretch is about as often as on any day');
same(basis.compareWindows('f:bread', flares, [null]).verdict, 'unknown', 'nothing to compare with is unknown');
check(basis.verdictRank('more') < basis.verdictRank('same'), 'what stands out sorts first');

const basisLine = basis.basisSentence({ flares: 4, flaresWithMeals: 3, windowHours: 24, daysInRange: 30, daysWithMeals: 21 });
same(
  basisLine,
  'Based on 4 flares and reactions, 3 of them with meals logged in the 24 hours before. The other one had nothing logged in that time, so it says nothing about food either way. Meals were logged on 21 of the 30 days looked at.',
  'the basis names every denominator',
);
check(!basis.basisSentence({ flares: 2, flaresWithMeals: 2, windowHours: 6, daysInRange: 7, daysWithMeals: 7 }).includes('other'), 'no unlogged line when every flare had meals');
const breadLine = basis.comparisonSentence(bread, 24);
same(
  breadLine,
  'Eaten before 3 of the 3 with meals logged before them (100%), against 25% of any 24-hour stretch with meals logged. That is more often than usual, which is worth watching and is not proof of anything.',
  'the comparison says both shares',
);
const teaLine = basis.comparisonSentence(tea, 24);
check(teaLine.includes('about as often as on any day'), 'an everyday food says the count alone says little');
const unknownLine = basis.comparisonSentence(basis.compareWindows('f:bread', flares, []), 12);
check(unknownLine.includes('nothing') || unknownLine.includes('no other stretches'), 'no comparison says so');
written.push(basisLine, breadLine, teaLine, unknownLine, basis.thresholdSentence());

// 2. Context around the flares.
const flareDates = ['2026-09-05', '2026-09-12'];
const nights = [
  { date: '2026-09-05', hours: 5 },
  { date: '2026-09-12', hours: 5.5 },
  { date: '2026-09-06', hours: 7.5 },
  { date: '2026-09-07', hours: 8 },
  { date: '2026-09-08', hours: 7 },
];
same(
  context.sleepLine(flareDates, nights),
  'Sleep the night before a flare averaged 5.3 hours across 2 nights, against 7.5 hours across 3 other nights.',
  'sleep dated the flare day is the night before it',
);
same(context.sleepLine(flareDates, nights.slice(0, 3)), null, 'too few other nights says nothing');
const treatments = [
  { name: 'Magnesium', startDate: '2026-09-01', endDate: null },
  { name: 'Iron', startDate: '2026-01-01', endDate: '2026-09-10' },
  { name: 'Zinc', startDate: '2026-08-01', endDate: null },
];
same(
  context.treatmentLines(flareDates, treatments),
  ['Started Magnesium on 2026-09-01, within a week before 1 flare.', 'Stopped Iron on 2026-09-10, within a week before 1 flare.'],
  'a start or stop within a week before a flare is named, sorted',
);
same(context.unloggedLine(4, 4, 24), null, 'no unlogged line when every flare had meals');
const contextAll = context.contextLines({ flareDates, nights, treatments, flares: 3, flaresWithMeals: 2, windowHours: 24 });
same(contextAll.length, 4, 'unlogged, sleep and two treatment lines');
check(contextAll[0].startsWith('1 of the 3 had no meals logged'), 'the unlogged line comes first');
written.push(...contextAll, context.CONTEXT_CAVEAT);

// 3. Experiments.
check(experiment.isInRemoval('2026-09-10', 14, '2026-09-10'), 'the first day is in removal');
check(experiment.isInRemoval('2026-09-10', 14, '2026-09-23'), 'the last day is in removal');
check(!experiment.isInRemoval('2026-09-10', 14, '2026-09-24'), 'the day after is not');
check(!experiment.isInRemoval(null, null, '2026-09-24'), 'a plain trial is never in removal');
same(
  experiment.removalProgressLine('2026-09-10', 14, '2026-09-12'),
  'Without it: day 3 of 14, 12 days to go. It comes back the next time it is logged after that.',
  'progress counts days',
);
check(experiment.removalProgressLine('2026-09-10', 14, '2026-09-23').includes('last day'), 'the last day says so');

const input = {
  removalStartedOn: '2026-09-01',
  removalDays: 7,
  returnedOn: '2026-09-10',
  observationDays: 3,
  today: '2026-09-20',
  eventDates: ['2026-08-26', '2026-08-28', '2026-08-30', '2026-09-03', '2026-09-11', '2026-09-12', '2026-09-18'],
  eatenDates: ['2026-09-04'],
  measure: 'Energy',
};
same(
  experiment.experimentPeriods(input).map((period) => [period.label, period.days, period.events]),
  [['Before', 7, 3], ['Without it', 7, 1], ['Back', 3, 2]],
  'before, without and back each count their own days',
);
const running = { ...input, returnedOn: null, today: '2026-09-03' };
same(
  experiment.experimentPeriods(running).map((period) => [period.label, period.days]),
  [['Before', 7], ['Without it', 3]],
  'a period still running is clipped at today, and Back waits for the food',
);
same(experiment.eatenDuringRemoval(input), 1, 'eating it during removal is counted');
const resultLines = experiment.experimentResultLines(input);
same(resultLines[0], 'Before (7 days): 3 flares and reactions logged.', 'the first line reads plainly');
check(resultLines.some((line) => line.includes('logged as eaten once')), 'eating it during removal is said');
check(resultLines.some((line) => line.includes('watch energy')), 'the measure is named');
same(resultLines[resultLines.length - 1], experiment.EXPERIMENT_LIMIT, 'every result ends with its limit');
check(
  !experiment.experimentResultLines({ ...input, measure: experiment.MEASURE_OPTIONS[0] }).some((line) => line.includes('set out to watch')),
  'the default measure needs no line',
);
written.push(...resultLines, experiment.removalProgressLine('2026-09-10', 14, '2026-09-12'));

// 4. Your usual range.
same(usual.usualRange([1, 2, 3]), null, 'too few readings draw no range');
const readings = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const range = usual.usualRange(readings.slice(0, -1));
same([range.low, range.high, range.count], [10.9, 18.1, 10], 'the range is the middle of the earlier readings');
same(usual.placeInUsual(20, range), 'above', 'above the range');
same(usual.placeInUsual(15, range), 'within', 'inside the range');
const fmt = (value) => `${value.toFixed(1)} kg`;
const above = usual.usualSentence(readings, fmt);
same(
  above,
  'The latest, 20.0 kg, is above your usual range of 10.9 kg to 18.1 kg, drawn from the middle of your 10 earlier readings. Usual means what your readings have been, not what they should be.',
  'the caption places the latest reading',
);
const inside = usual.usualSentence([...readings.slice(0, -1), 15], fmt);
check(inside.includes('is inside your usual range'), 'inside reads as inside');
const few = usual.usualSentence([1, 2, 3], fmt);
same(few, 'Your usual range shows once there are 8 earlier readings to draw it from. There are 2 so far.', 'too few says how many');
same(usual.usualSentence([], fmt), '', 'no readings says nothing');
written.push(above, inside, few);

// Nothing here tells somebody a reading or a food is wrong, and nothing
// breaks the house writing rules.
const allText = written.join(' ');
for (const word of ['abnormal', 'too low', 'too high', 'ideal', 'optimal', 'healthy range', 'causes', 'caused by', 'trigger', 'diagnos']) {
  check(!allText.toLowerCase().includes(word), `no "${word}" in the Phase B sentences`);
}
check(!/[–—]/.test(allText) && !allText.includes(' -- '), 'no dashes in the Phase B sentences');
check(!/\b(?:real|genuine|genuinely)\b/i.test(allText), 'no filler words in the Phase B sentences');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
