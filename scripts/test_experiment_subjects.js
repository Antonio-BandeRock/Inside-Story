// Runs lib/foodExperiment.ts for experiments about something other than a
// food: F5, 2026-10-01.
//
// The rules checked:
//
//  1. A row made before F5 (subject null) still reads as a food, with the
//     food wording and the eaten-while-left-out line.
//  2. A bedtime, supplement, walk or anything else reads "With the change"
//     and "Back to usual", never counts meals against it, and says the app
//     cannot see whether the change was kept.
//  3. Every result still ends with the one-run limit, which names no food.
//  4. The wiring: the column, Back to Usual, a check-in title that reads,
//     the Signals form, the report, Trends and achievements.
//  5. No dashes and no verdict words in anything said.
//
// Run with: node scripts/test_experiment_subjects.js
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

const E = loadModule('lib/foodExperiment.ts');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

const base = {
  removalStartedOn: '2026-09-01',
  removalDays: 14,
  returnedOn: '2026-09-16',
  observationDays: 5,
  today: '2026-09-30',
  eventDates: ['2026-08-20', '2026-08-25', '2026-09-03', '2026-09-17'],
  eatenDates: ['2026-09-05'],
  measure: 'Sleep',
};

// 1. Food, old and new.
for (const subject of [undefined, null, 'food']) {
  const lines = E.experimentResultLines({ ...base, subject });
  check(`food (${subject}) reads Without it`, lines[1].startsWith('Without it (14 days)'));
  check(`food (${subject}) counts the meal`, lines.some((l) => l.includes('logged as eaten once')));
  check(`food (${subject}) has no not-seen line`, !lines.includes(E.NOT_SEEN_LINE));
}
check('null subject is a food', E.subjectOf(null) === 'food' && E.subjectOf('nonsense') === 'food');
check('a food check-in keeps its title', E.experimentCheckinTitle('Eggs', null) === 'How did today go with Eggs?');

// 2. Anything else.
for (const option of E.SUBJECT_OPTIONS) {
  const lines = E.experimentResultLines({ ...base, subject: option.key });
  check(`${option.key}: before`, lines[0] === 'Before (14 days): 2 flares and reactions logged.');
  check(`${option.key}: with the change`, lines[1] === 'With the change (14 days): 1 flare or reaction logged.');
  check(`${option.key}: back to usual`, lines[2] === 'Back to usual (5 days): 1 flare or reaction logged.');
  check(`${option.key}: meals never counted`, !lines.some((l) => l.includes('eaten')));
  check(`${option.key}: says it cannot see the change`, lines.includes(E.NOT_SEEN_LINE));
  check(`${option.key}: progress says Back to Usual`, E.removalProgressLine('2026-09-01', 14, '2026-09-03', option.key).includes('Press Back to Usual'));
  check(`${option.key}: done line says Back to Usual`, E.awaitingReturnLine(option.key).includes('Back to Usual'));
  check(`${option.key}: check-in names the change`, E.experimentCheckinTitle('In bed by 10:30', option.key) === 'How did today go? Your experiment: In bed by 10:30');
  check(`${option.key}: has a label and an example`, option.label.length > 0 && option.example.length > 0);
  check(`${option.key}: subjectOf round trip`, E.subjectOf(option.key) === option.key);
}
check('progress line for a food is unchanged', E.removalProgressLine('2026-09-01', 14, '2026-09-03') === 'Without it: day 3 of 14, 12 days to go. It comes back the next time it is logged after that.');
check('still waiting shows two periods', E.experimentResultLines({ ...base, returnedOn: null, subject: 'bedtime' }).filter((l) => /^(Before|With the change|Back to usual) \(/.test(l)).length === 2);

// 3. The limit.
for (const subject of [null, 'bedtime']) {
  const lines = E.experimentResultLines({ ...base, subject });
  check(`limit last (${subject})`, lines[lines.length - 1] === E.EXPERIMENT_LIMIT);
}
check('the limit names no food', !/food/i.test(E.EXPERIMENT_LIMIT));

// 4. Wiring.
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const db = read('lib/db.ts');
check('the column', db.includes("['subject_kind', 'TEXT']"));
check('selected with the rest', (db.match(/subject_kind AS subjectKind/g) || []).length >= 3);
check('Back to Usual starts the back period', db.includes('export async function markExperimentBack('));
check('check-ins take the subject', db.includes('experimentCheckinTitle(input.foodName, input.subjectKind)'));
check('anything else always waits', db.includes("subject !== 'food' || (input.foodId != null && input.source) ? 'waiting' : 'trialing'"));
const dbRead = read('lib/foodExperimentDb.ts');
check('meals read only for a food', dbRead.includes("subject === 'food' && trial.foodId != null"));
const log = read('app/(tabs)/log.tsx');
check('a second start button', log.includes('+ Start an experiment about something else'));
check('the Back to Usual action', log.includes('handleBackToUsual(trial.id)'));
check('the lens is renamed', log.includes("label: 'New Foods & Experiments'"));
check('a prescription is left to the prescriber', log.includes('Leaving out a prescription is a question for whoever prescribed it'));
const report = read('lib/reportNoticed.ts');
check('the report heading names no food', report.includes("EXPERIMENTS_HEADING = 'Experiments'"));
check('the report carries the subject', read('lib/reportGenerator.ts').includes('subject: input.subject ?? null'));
check('Trends reads the subject', read('lib/trendsMoreDb.ts').includes('subject_kind AS subjectKind'));
const ach = read('lib/achievementCriteria.ts');
check('food achievements count foods only', (ach.match(/subject_kind IS NULL OR subject_kind = 'food'/g) || []).length === 2);
check('an experiment has its own', ach.includes("key: 'experiment_tried'"));

// 5. Words.
const said = [
  E.NOT_SEEN_LINE,
  E.EXPERIMENT_LIMIT,
  E.awaitingReturnLine('food'),
  E.awaitingReturnLine('bedtime'),
  E.removalProgressLine('2026-09-01', 14, '2026-09-14', 'activity'),
  ...E.SUBJECT_OPTIONS.flatMap((o) => [o.label, o.example]),
  ...E.experimentResultLines({ ...base, subject: 'supplement' }),
];
for (const text of said) {
  check(`no dashes: ${text.slice(0, 50)}`, !/[–—]| -- /.test(text));
  check(`no verdict words: ${text.slice(0, 50)}`, !/\b(caused|causes|works|worked|proves?|should)\b/i.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
