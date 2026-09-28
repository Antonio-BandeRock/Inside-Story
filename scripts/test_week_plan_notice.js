/* global __dirname */
// Checks This week's meals as a notification (H10, 2026-09-28): the seven
// days it covers, one line a day, skipped meals left out, an empty week
// pointing to Meal Plan, the line saying when the plan was read, and that
// no sentence passes a verdict.
//
// USAGE
//   node scripts/test_week_plan_notice.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

function load(rel) {
  const file = path.join(ROOT, rel);
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod._compile(out, file);
  return mod.exports;
}

const w = load('lib/weekPlanNotice.ts');

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  } else console.log(`ok   ${name}`);
}

// Sunday 27 Sep 2026 at 4pm, read on Saturday 26 Sep at 9:05am.
const fireAt = new Date(2026, 8, 27, 16, 0);
const now = new Date(2026, 8, 26, 9, 5);

check('seven days from the day it fires', w.weekPlanDays(fireAt), [
  '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03',
]);

const meals = [
  { scheduledFor: '2026-09-27T08:00', title: 'Oatmeal', status: 'planned' },
  { scheduledFor: '2026-09-27T18:00', title: 'Lentil soup', status: 'planned' },
  { scheduledFor: '2026-09-28T12:00', title: 'Lentil soup', status: 'planned' },
  { scheduledFor: '2026-09-28T18:00', title: 'Lentil soup', status: 'planned' },
  { scheduledFor: '2026-09-29T12:00', title: 'Salad', status: 'skipped' },
  { scheduledFor: '2026-10-03T12:00', title: 'Tacos', status: 'done' },
  { scheduledFor: '2026-10-04T12:00', title: 'Past the week', status: 'planned' },
];
const body = w.buildWeekPlanBody(meals, fireAt, now);
const lines = body.split('\n');
check('eight lines: seven days and when it was read', lines.length, 8);
check('first day starts on the day it fires', lines[0], 'Sun: Oatmeal, Lentil soup');
check('the same dish twice in a day is named once with a count', lines[1], 'Mon: Lentil soup (2)');
check('a skipped meal is left out', lines[2], 'Tue: nothing planned');
check('an eaten meal stays, since the list is what was planned', lines[6], 'Sat: Tacos');
check('a meal past the seven days is not listed', body.includes('Past the week'), false);
check('says when the plan was read', lines[7], 'As planned on Sat 26 Sep, 9:05am.');

const empty = w.buildWeekPlanBody([], fireAt, now);
check('an empty week points to Meal Plan rather than seven empty lines', empty,
  'Nothing is planned for the next seven days. Schedules > Meal Plan can fill a week. As planned on Sat 26 Sep, 9:05am.');
check('a week of only skipped meals reads as empty', w.buildWeekPlanBody([meals[4]], fireAt, now), empty);

const noon = w.buildWeekPlanBody([], fireAt, new Date(2026, 8, 26, 12, 0));
check('noon reads pm', noon.endsWith('Sat 26 Sep, 12:00pm.'), true);

const VERDICT = /\b(good|bad|great|healthy|unhealthy|should|must|well done|too (few|many|little|much)|not enough|ideal|optimal)\b/i;
check('no verdict words', [body, empty, w.WEEK_PLAN_NOTIFICATION_TITLE].some((t) => VERDICT.test(t)), false);

console.log(failures ? `\n${failures} failed` : '\nall passed');
if (failures) process.exit(1);
