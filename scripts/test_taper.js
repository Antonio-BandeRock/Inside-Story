// Checks lib/taper.ts (A2, stepped doses): laying the form's steps end to
// end, finding the step for a day, the dose line and "(step 3 of 5)", the
// status sentence before, during and after a taper, and that no sentence
// tells anybody to change a dose.
// Run: node scripts/test_taper.js
/* global __dirname */
const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'taper.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('module', 'exports', 'require', js)(m, m.exports, require);
const T = m.exports;

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name);
  }
}

const d = (amount, days, unit = 'mg') => ({ amount: String(amount), unit, days: String(days) });

// buildTaper
const built = T.buildTaper('2026-10-01', [d(40, 5), d(30, 5), d(20, 5), d(10, 5), d(5, 3)]);
check('builds five steps', built.steps && built.steps.length === 5);
const steps = built.steps;
check('first step dates', steps[0].startDate === '2026-10-01' && steps[0].endDate === '2026-10-05');
check('steps back to back', steps[1].startDate === '2026-10-06' && steps[4].endDate === '2026-10-23');
check('crosses a month', T.buildTaper('2026-09-28', [d(10, 5)]).steps[0].endDate === '2026-10-02');
check('crosses a year', T.buildTaper('2026-12-30', [d(10, 3), d(5, 2)]).steps[1].endDate === '2027-01-03');
check('leap day counted', T.buildTaper('2028-02-27', [d(10, 3)]).steps[0].endDate === '2028-02-29');
check('bad date', T.buildTaper('10/01/2026', [d(10, 5)]).problem.includes('first day'));
check('impossible date', T.buildTaper('2026-02-30', [d(10, 5)]).problem !== null);
check('no steps', T.buildTaper('2026-10-01', [{ amount: '', unit: 'mg', days: '' }]).problem.includes('at least one step'));
check('zero amount', T.buildTaper('2026-10-01', [d(0, 5)]).problem.includes('Step 1'));
check('fraction of a day', T.buildTaper('2026-10-01', [d(10, 1.5)]).problem.includes('whole number'));
check('second step problem named', T.buildTaper('2026-10-01', [d(10, 5), d('', 5)]).problem.includes('Step 2'));
check('blank rows skipped', T.buildTaper('2026-10-01', [d(10, 5), { amount: '', unit: 'mg', days: '' }]).steps.length === 1);
check('comma decimal', T.buildTaper('2026-10-01', [d('2,5', 5)]).steps[0].amount === 2.5);
check('empty unit is null', T.buildTaper('2026-10-01', [d(1, 5, ' ')]).steps[0].unit === null);

// stepOn
check('before the taper', T.stepOn(steps, '2026-09-30') === null);
check('first day', T.stepOn(steps, '2026-10-01').number === 1);
check('last day of step 1', T.stepOn(steps, '2026-10-05').number === 1);
check('step 3', T.stepOn(steps, '2026-10-12').number === 3 && T.stepOn(steps, '2026-10-12').total === 5);
check('last day', T.stepOn(steps, '2026-10-23').number === 5);
check('after the taper', T.stepOn(steps, '2026-10-24') === null);
check('unsorted input', T.stepOn([...steps].reverse(), '2026-10-12').number === 3);

// lines
check('dose line', T.taperDoseLine(T.stepOn(steps, '2026-10-12')) === '20 mg (step 3 of 5)');
check('suffix', T.stepSuffix(3, 5) === ' (step 3 of 5)');
check('no suffix outside', T.stepSuffix(0, null) === '' && T.stepSuffix(null, 5) === '');
check('decimal amount', T.formatAmount(2.5, 'mg') === '2.5 mg' && T.formatAmount(7.5, null) === '7.5');
const lines = T.describeSteps(steps);
check('describe first', lines[0] === 'Step 1: 40 mg, 1 Oct to 5 Oct (5 days)');
check('one-day step', T.describeSteps(T.buildTaper('2026-10-01', [d(5, 1)]).steps)[0] === 'Step 1: 5 mg, 1 Oct (1 day)');
check('first and last', T.taperFirstDay(steps) === '2026-10-01' && T.taperLastDay(steps) === '2026-10-23');
check('empty first and last', T.taperFirstDay([]) === null && T.taperLastDay([]) === null);

// round trip
const back = T.draftsFromSteps(steps);
const again = T.buildTaper(back.startDate, back.drafts);
check('round trip', JSON.stringify(again.steps) === JSON.stringify(steps));

// status
check('status during', T.taperStatusLine(steps, '2026-10-12', '5 mg').startsWith('Today: 20 mg (step 3 of 5), 4 days left in this step.'));
check('status last day of step', T.taperStatusLine(steps, '2026-10-15', null).includes('today is its last day'));
check('status before', T.taperStatusLine(steps, '2026-09-29', null) === 'The taper starts 1 Oct at 40 mg and its last day is 23 Oct.');
check('status after with dose', T.taperStatusLine(steps, '2026-10-30', '5 mg').includes('the dose entered on the med applies: 5 mg'));
check('status after without', T.taperStatusLine(steps, '2026-10-30', null).includes('No dose is entered'));
check('status empty', T.taperStatusLine([], '2026-10-30', null) === '');
check('repeat note names the last day', T.taperRepeatNote(steps).includes('23 Oct'));
check('no repeat note without a taper', T.taperRepeatNote([]) === null);

// wording
const all = [T.TAPER_LEAD, T.TAPER_AFTER_NOTE, T.taperRepeatNote(steps), ...lines,
  T.taperStatusLine(steps, '2026-10-12', '5 mg'), T.taperStatusLine(steps, '2026-10-30', '5 mg'), T.taperStatusLine(steps, '2026-09-29', null)].join('\n');
check('names the prescriber', /prescriber/.test(all));
check('never changes it', /never changes it/.test(all));
check('no advice words', !/\byou should\b|\bconsider (reducing|increasing|stopping)\b|\btry (reducing|lowering)\b/i.test(all));
check('no dashes', !/[–—]| -- | - /.test(all));
check('no filler words', !/\b(real|genuine|genuinely)\b/i.test(all));

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
