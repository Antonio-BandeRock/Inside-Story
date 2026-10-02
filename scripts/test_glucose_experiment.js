// Runs glucose as an experiment measure: F8, 2026-10-01.
//
// The rules checked:
//
//  1. "Glucose after meals" is a measure, and only it brings in glucose.
//  2. Each period counts the meals read inside it and averages their rise,
//     with the period's own days (before, without, back).
//  3. A period with no meal read says so, never a rise of 0, and no
//     readings at all says there is nothing to compare.
//  4. The result still ends with the one-run limit.
//  5. The loader reads meal glucose only when glucose is the measure, and
//     the form explains it.
//  6. No dashes and no verdict or cause words.
//
// Run with: node scripts/test_glucose_experiment.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) return {};
    if (name === './db') throw new Error(`${relPath} reaches the database`);
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const E = load('lib/foodExperiment.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

function read(day, rise, n) {
  return {
    status: 'read',
    meal: { id: `${day}-${n}`, name: 'Rice bowl', mealType: 'lunch', at: 0, day, clock: '12:00' },
    before: 5,
    beforeMinutes: 5,
    peak: 5 + rise,
    peakMinutes: 45,
    rise,
    readingsAfter: 8,
    back: 'back',
    backMinutes: 100,
    nextMeal: null,
    lastReadingMinutes: null,
  };
}
function unread(day) {
  return { status: 'no_before', meal: { id: `${day}-u`, name: 'Pasta', mealType: 'dinner', at: 0, day, clock: '19:00' } };
}

// Before: Sept 1 to 7, without: Sept 8 to 14, back from Sept 15 for 7 days.
const base = {
  removalStartedOn: '2026-09-08',
  removalDays: 7,
  returnedOn: '2026-09-15',
  observationDays: 7,
  today: '2026-09-30',
  eventDates: [],
  eatenDates: [],
  measure: E.GLUCOSE_MEASURE,
  subject: 'food',
};

const results = [];

// 1. The measure
check('glucose is a measure option', E.MEASURE_OPTIONS.includes(E.GLUCOSE_MEASURE));
check('isGlucoseMeasure', E.isGlucoseMeasure(E.GLUCOSE_MEASURE) && !E.isGlucoseMeasure('Sleep') && !E.isGlucoseMeasure(null));
{
  const sleep = E.experimentResultLines({ ...base, measure: 'Sleep', mealGlucose: [read('2026-09-02', 2, 1)] });
  check('another measure brings in no glucose line', !sleep.some((l) => /glucose/i.test(l)));
  check('another measure keeps its notes line', sleep.some((l) => l.startsWith('You set out to watch sleep.')));
}

check(
  'the rise is worded the same as lib/mealGlucose.ts',
  [0, 0.04, 1, 2.15, -1.3, 7.777].every((v) => E.formatGlucoseRise(v) === load('lib/mealGlucose.ts').formatRise(v)),
);

// 2. Periods
{
  const mealGlucose = [
    read('2026-09-02', 2.0, 1),
    read('2026-09-03', 3.0, 1),
    read('2026-09-05', 1.0, 1),
    read('2026-09-09', 1.0, 1),
    read('2026-09-10', 0.5, 1),
    read('2026-09-12', 1.5, 1),
    unread('2026-09-12'),
    read('2026-09-16', 2.5, 1),
    read('2026-09-17', 2.0, 1),
    read('2026-09-18', 1.5, 1),
    read('2026-09-25', 9, 1), // after the back days end
  ];
  const input = { ...base, mealGlucose };
  const periods = E.glucosePeriods(input);
  check('three periods', periods.length === 3);
  check('before averages its meals', periods[0].read === 3 && Math.abs(periods[0].averageRise - 2) < 1e-9);
  check('without counts read and unread', periods[1].read === 3 && periods[1].unread === 1);
  check('without averages', Math.abs(periods[1].averageRise - 1) < 1e-9);
  check('back stops at its days', periods[2].read === 3 && Math.abs(periods[2].averageRise - 2) < 1e-9);
  const lines = E.experimentResultLines(input);
  results.push(lines);
  check(`before line: ${lines.find((l) => l.startsWith('Before, glucose'))}`, lines.includes(
    'Before, glucose: 3 meals read; after them it rose by 2 mmol/L (36 mg/dL) on average.',
  ));
  check(
    'without line names the unread meal',
    lines.includes('Without it, glucose: 3 meals read; after them it rose by 1 mmol/L (18 mg/dL) on average. 1 more meal had readings that could not be read.'),
  );
  check('glucose note present', lines.includes(E.GLUCOSE_EXPERIMENT_NOTE));
  check('the generic notes line is gone', !lines.some((l) => l.startsWith('You set out to watch')));
  check('ends with the limit', lines[lines.length - 1] === E.EXPERIMENT_LIMIT);
  check('flare counts still come first', lines[0].startsWith('Before (7 days): 0 flares and reactions logged.'));
}

// 3. Gaps
{
  const gap = E.experimentResultLines({ ...base, mealGlucose: [read('2026-09-02', 2, 1), read('2026-09-03', 2, 2)] });
  results.push(gap);
  check('an empty period says no meal read', gap.includes('Without it, glucose: no meal with readings before and after.'));
  check('few meals are named', gap.includes('A period with only one or two meals read rests on very little.'));
  const flat = E.experimentResultLines({ ...base, mealGlucose: [0, 1, 2].map((n) => read('2026-09-0' + (n + 2), -0.2, n)) });
  results.push(flat);
  check('a fall reads as did not rise', flat.some((l) => l.includes('did not rise above the level before on average')));
  const none = E.experimentResultLines({ ...base, mealGlucose: [] });
  results.push(none);
  check('no readings says nothing to compare', none.some((l) => /nothing to compare yet/.test(l)));
  check('no readings still ends with the limit', none[none.length - 1] === E.EXPERIMENT_LIMIT);
  const waiting = E.experimentResultLines({ ...base, returnedOn: null, today: '2026-09-10', mealGlucose: [read('2026-09-02', 2, 1)] });
  check('no back period before the return', !waiting.some((l) => l.startsWith('Back, glucose')));
  const change = E.experimentResultLines({ ...base, subject: 'bedtime', mealGlucose: [read('2026-09-02', 2, 1)] });
  results.push(change);
  check('a change uses its period names', change.some((l) => l.startsWith('With the change, glucose')));
}

// 5. Wiring
{
  const src = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const db = src('lib/foodExperimentDb.ts');
  check('loader reads meal glucose when glucose is the measure', /isGlucoseMeasure\(trial\.measure\)\s*\?\s*await listMealGlucose/.test(db));
  check('loader passes it on', /mealGlucose,\n\s*};/.test(db));
  const log = src('app/(tabs)/log.tsx');
  check('both forms explain the glucose measure', (log.match(/GLUCOSE_MEASURE_HINT\}/g) || []).length === 2);
  check('pure module never reaches the database', !/from '\.\/db'/.test(src('lib/foodExperiment.ts')));
}

// 6. Words
{
  const texts = results.flat();
  texts.push(E.GLUCOSE_EXPERIMENT_NOTE, E.GLUCOSE_MEASURE_HINT);
  const banned = [...READING_FORBIDDEN_WORDS, 'spike', 'because of', 'caused', '—', '–', ' -- ', 'genuine', 'normal', 'healthy'];
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
    check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
  }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
