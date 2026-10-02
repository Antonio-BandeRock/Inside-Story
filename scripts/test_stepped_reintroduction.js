// Runs lib/steppedReintroduction.ts, the stepped reintroduction: F7, 2026-10-01.
//
// The rules checked:
//
//  1. Order: small, medium, large, then the washout, one of each, and the
//     washout can be started early from the small or medium step.
//  2. The progress line says which step, which day of how many, and what
//     comes next; after the washout it says to mark No problems or Flag it.
//  3. Each step is read on its own: a Before stretch the length of the
//     washout, each eating step until the next was recorded, the washout
//     for its days, never past today.
//  4. The result says what was not tried, that a step can carry over, that
//     eating it in the washout blurs it, and ends with the one-run limit.
//  5. The wiring: columns, table, no cascade, a meal never starting a
//     stepped trial, sync registration, the Signals screen and the report.
//  6. No dashes and no verdict words in anything said.
//
// Run with: node scripts/test_stepped_reintroduction.js
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
    if (name === './foodExperiment') return loadModule('lib/foodExperiment.ts');
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const S = loadModule('lib/steppedReintroduction.ts');
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
const said = [];
function say(line) {
  said.push(line);
  return line;
}

const amounts = { small: '1/4 cup', medium: '1/2 cup', large: '1 cup' };
const small = { step: 'small', startedOn: '2026-10-01' };
const medium = { step: 'medium', startedOn: '2026-10-02' };
const large = { step: 'large', startedOn: '2026-10-03' };
const washout = { step: 'washout', startedOn: '2026-10-04' };

// 1. Order.
check('first is small', S.nextStep([]) === 'small');
check('after small, medium', S.nextStep([small]) === 'medium');
check('after medium, large', S.nextStep([small, medium]) === 'large');
check('after large, washout', S.nextStep([small, medium, large]) === 'washout');
check('after washout, nothing', S.nextStep([small, medium, large, washout]) === null);
check('order does not depend on the array', S.nextStep([medium, small]) === 'large');
check('a repeated step counts once', S.orderedSteps([small, { ...small, startedOn: '2026-10-05' }]).length === 1);
check('stop early from small', S.canStopEarly([small]));
check('stop early from medium', S.canStopEarly([small, medium]));
check('no stop early after large', !S.canStopEarly([small, medium, large]));
check('no stop early before starting', !S.canStopEarly([]));
check('no stop early in the washout', !S.canStopEarly([small, washout]));
check('after an early washout, nothing', S.nextStep([small, { step: 'washout', startedOn: '2026-10-02' }]) === null);
check('small button', say(S.nextStepButton('small')) === 'Had the small amount today');
check('washout button', say(S.nextStepButton('washout')) === 'Start the washout');
check('label with an amount', S.stepLabel('medium', amounts) === 'Medium amount (1/2 cup)');
check('label without an amount', S.stepLabel('large', {}) === 'Large amount');
check('blank amount reads as none', S.stepLabel('large', { large: '  ' }) === 'Large amount');

// 2. Progress line.
const progress = (steps, today, extra = {}) =>
  say(S.steppedProgressLine({ steps, stepDays: 1, washoutDays: 3, today, amounts, ...extra }));
check('waiting line', progress([], '2026-10-01') === 'Waiting to start: press Had the small amount today on the day you eat the small amount (1/4 cup).');
check('small day 1', progress([small], '2026-10-01') === 'Small amount (1/4 cup): day 1 of 1. Next, the medium amount.');
check('small done', progress([small], '2026-10-02') === 'Small amount (1/4 cup): its 1 day is done. Next, the medium amount.');
check(
  'two days per step',
  progress([small], '2026-10-02', { stepDays: 2 }) === 'Small amount (1/4 cup): day 2 of 2. Next, the medium amount.',
);
check(
  'two days done',
  progress([small], '2026-10-03', { stepDays: 2 }) === 'Small amount (1/4 cup): its 2 days are done. Next, the medium amount.',
);
check('large then washout', progress([small, medium, large], '2026-10-03') === 'Large amount (1 cup): day 1 of 1. Next, the washout.');
check('washout day 2', progress([small, medium, large, washout], '2026-10-05') === 'Washout, none of it: day 2 of 3.');
check('washout done', progress([small, medium, large, washout], '2026-10-07') === 'Washout done. Mark No problems or Flag it.');
check('washout not done on its last day', !S.washoutDone([washout], 3, '2026-10-06'));
check('washout done the day after', S.washoutDone([washout], 3, '2026-10-07'));

// 3. Periods.
const full = {
  steps: [small, medium, large, washout],
  stepDays: 1,
  washoutDays: 3,
  today: '2026-10-10',
  amounts,
  eventDates: ['2026-09-29', '2026-10-02', '2026-10-03', '2026-10-03', '2026-10-05', '2026-10-08'],
  eatenDates: [],
};
const periods = S.steppedPeriods(full);
check('five periods', periods.length === 5);
check('before is the washout length', periods[0].label === 'Before' && periods[0].from === '2026-09-28' && periods[0].days === 3);
check('before counts its flare', periods[0].events === 1);
check('small runs to medium', periods[1].until === '2026-10-02' && periods[1].events === 0);
check('medium counts one', periods[2].events === 1);
check('large counts two', periods[3].events === 2);
check('washout runs its days', periods[4].days === 3 && periods[4].until === '2026-10-07');
check('washout counts its flare, not the later one', periods[4].events === 1);

const midway = { ...full, steps: [small, medium], today: '2026-10-02' };
const midPeriods = S.steppedPeriods(midway);
check('the current step stops at today', midPeriods[midPeriods.length - 1].until === '2026-10-03');
check('the current step is one day so far', midPeriods[midPeriods.length - 1].days === 1);
check('a step not yet reached is not read', S.steppedPeriods({ ...full, steps: [] }).length === 0);

// 4. Result lines.
const lines = S.steppedResultLines(full).map(say);
check('before line', lines[0] === 'Before (3 days): 1 flare or reaction logged.');
check('small line', lines[1] === 'Small amount (1/4 cup) (1 day): 0 flares and reactions logged.');
check('large line', lines[3] === 'Large amount (1 cup) (1 day): 2 flares and reactions logged.');
check('washout line', lines[4] === 'Washout, none of it (3 days): 1 flare or reaction logged.');
check('carryover line', lines.includes('Each step follows the one before, so something logged during a step may be carrying over from the step before it.'));
check('no stopped line when all tried', !lines.some((line) => line.startsWith('Stopped after')));
check('ends with the one-run limit', lines[lines.length - 1] === E.EXPERIMENT_LIMIT);

const stoppedSmall = S.steppedResultLines({ ...full, steps: [small, { step: 'washout', startedOn: '2026-10-02' }] }).map(say);
check(
  'stopped after small',
  stoppedSmall.includes('Stopped after the small amount, so the medium and large amounts were not tried.'),
);
check('one eating step has no carryover line', !stoppedSmall.some((line) => line.startsWith('Each step follows')));
const stoppedMedium = S.steppedResultLines({ ...full, steps: [small, medium, { step: 'washout', startedOn: '2026-10-03' }] }).map(say);
check('stopped after medium', stoppedMedium.includes('Stopped after the medium amount, so the large amount was not tried.'));
const notYet = S.steppedResultLines({ ...full, steps: [small], today: '2026-10-01' }).map(say);
check('no stopped line before the washout', !notYet.some((line) => line.startsWith('Stopped after')));
check('nothing recorded says nothing', S.steppedResultLines({ ...full, steps: [] }).length === 0);

const blurred = S.steppedResultLines({ ...full, eatenDates: ['2026-10-03', '2026-10-05', '2026-10-06', '2026-10-09'] }).map(say);
check('eaten twice in the washout', blurred.includes('It was logged as eaten twice during the washout, which blurs it.'));
check('eating outside the washout is not counted', S.eatenDuringWashout({ ...full, eatenDates: ['2026-10-03', '2026-10-07'] }) === 0);

check('stage before starting', S.steppedStage([], 3, '2026-10-01', 'waiting') === 'not started yet');
check('stage at medium', S.steppedStage([small, medium], 3, '2026-10-02', 'trialing') === 'at the medium amount');
check('stage in the washout', S.steppedStage([small, washout], 3, '2026-10-05', 'trialing') === 'in the washout');
check('stage washout done', S.steppedStage([small, washout], 3, '2026-10-08', 'trialing') === 'washout done');
check('stage finished', S.steppedStage([small, washout], 3, '2026-10-08', 'cleared') === 'finished');

// 5. Wiring.
const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const db = read('lib/db.ts');
const log = read('app/(tabs)/log.tsx');
const peers = read('lib/peerRelationships.ts');
const changes = read('lib/snapshotChanges.ts');
const report = read('lib/reportGenerator.ts');
const noticed = read('lib/reportNoticed.ts');
const expDb = read('lib/foodExperimentDb.ts');
const trends = read('lib/trendsMore.ts');

for (const column of ['step_days', 'washout_days', 'amount_small', 'amount_medium', 'amount_large']) {
  check(`food_trials gains ${column}`, db.includes(`['${column}', `));
}
check('trial_steps table', db.includes('CREATE TABLE IF NOT EXISTS trial_steps ('));
const stepsTable = db.slice(db.indexOf('CREATE TABLE IF NOT EXISTS trial_steps ('), db.indexOf('CREATE TABLE IF NOT EXISTS trial_steps (') + 600);
check('no cascade on trial_steps', !stepsTable.includes('CASCADE'));
check("TrialDesign has 'stepped'", read('lib/foodExperiment.ts').includes("'watch' | 'remove_return' | 'stepped'"));
const activate = db.slice(db.indexOf('export async function activateWaitingTrialsForComponents'), db.indexOf('export async function activateWaitingTrialsForComponents') + 1500);
check('a meal never starts a stepped trial', activate.includes("trial.design !== 'stepped'"));
const create = db.slice(db.indexOf('export async function createFoodTrial'), db.indexOf('export async function createFoodTrial') + 4000);
check('a stepped trial always waits', /stepped \|\| subject !== 'food'/.test(create));
check("create writes 'stepped'", create.includes("stepped ? 'stepped'"));
const record = db.slice(db.indexOf('export async function recordTrialStep'), db.indexOf('export async function recordTrialStep') + 2500);
check('recordTrialStep starts a waiting trial', record.includes("trial.status === 'waiting'"));
check('recordTrialStep replaces the check-ins', record.includes('cancelFoodTrialCheckins(trialId)') && record.includes('scheduleFoodTrialCheckins('));
check('recordTrialStep records a step once', record.includes('if (existing) return;'));
const del = db.slice(db.indexOf('export async function deleteFoodTrial'), db.indexOf('export async function deleteFoodTrial') + 600);
check('deleting a trial removes its steps', del.includes('DELETE FROM trial_steps WHERE trial_id = ?'));
check('every trial SELECT reads the step columns', (db.match(/subject_kind AS subjectKind,\n\s+step_days AS stepDays/g) || []).length === 3);

check('trial_steps is personal health', /'trial_steps',/.test(peers));
check('snapshot changes quiet on steps', changes.includes("quiet: ['food_trial_task_links', 'trial_steps']"));

check('readExperimentResult reads stepped', expDb.includes("if (trial.design === 'stepped')") && expDb.includes('steppedResultLines(stepped)'));
check('report reads stepped trials', report.includes("trial.design === 'stepped'") && report.includes('readSteppedInput(trial)'));
check('report opening for steps', noticed.includes('brought back in steps from'));
check('trends caption for steps', trends.includes("'brought back in steps'"));

check('Signals offers the third design', log.includes("['stepped', 'Bring it back in steps']"));
check('leaving out is for a picked food only', log.includes(".filter(([key]) => key !== 'remove_return' || pickedFood)"));
check('Signals loads the steps', log.includes('listTrialSteps()'));
check('Signals records a step', log.includes('handleRecordStep(trial.id, comingStep)'));
check('Signals offers stopping early', log.includes('Stop here and start the washout'));
check('Signals results include stepped', log.includes("trial.design === 'remove_return' || trial.design === 'stepped'"));
check('the stepped buttons come before Start now', log.indexOf('nextStepButton(comingStep)') < log.indexOf('>Start now<'));

// 6. Words.
const verdicts = /\b(safe|unsafe|tolerate[sd]?|intoleran\w*|trigger\w*|caus\w*|proves?|confirm\w*|allerg\w*)\b/i;
for (const line of said) {
  check(`no dash: ${line}`, !/[–—]| -- /.test(line));
  check(`no verdict: ${line}`, !verdicts.test(line) || line === E.EXPERIMENT_LIMIT);
}

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
