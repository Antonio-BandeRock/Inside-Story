/* global __dirname */
// Checks moving one planned meal to another day (H5, 2026-09-28): the days
// offered, how leftovers keep after their cooking, the time kept, and that
// no sentence passes a verdict.
//
// USAGE
//   node scripts/test_move_meal.js
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
  mod.require = (request) => {
    if (request.startsWith('./')) return load(path.join(path.dirname(rel), request + '.ts'));
    return Module.prototype.require.call(mod, request);
  };
  mod._compile(out, file);
  return mod.exports;
}

const M = load('lib/moveMeal.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|should|must|missed|failed|real|genuine|genuinely|better|worse)\b|[–—]| -- /i;
const sentences = [];
const clean = (text) => {
  if (text != null) sentences.push(text);
  return text;
};

const TODAY = '2026-09-28';

// --- 1. Days offered ----------------------------------------------------------
const none = M.moveBounds({ cookScheduledFor: null, leftoverTimes: [] });
ok(none.earliest === null && none.latest === null && none.reason === null, 'a meal with no leftovers can go anywhere');
const planned = [
  { date: '2026-09-29', mealType: 'dinner' },
  { date: '2026-09-29', mealType: 'lunch' },
  { date: '2026-10-01', mealType: 'breakfast' },
];
const days = M.moveDayChoices({ fromDate: '2026-09-30T18:00', today: TODAY, mealType: 'dinner', bounds: none, planned });
ok(days.length === M.MOVE_DAY_SPAN - 1, 'four weeks from today, less the day it is on');
ok(!days.some((d) => d.date === '2026-09-30'), 'the day it is on now is not offered');
ok(days[0].date === TODAY && days[0].label === 'Today, Mon Sep 28 (nothing planned)', 'today first, named');
ok(days[1].label === 'Tomorrow, Tue Sep 29 (2 meals planned, a dinner among them)', 'a day with that meal taken says so');
ok(days.find((d) => d.date === '2026-10-01').label === 'Thu Oct 1 (1 meal planned)', 'a day with another meal counts it');
days.forEach((d) => clean(d.label));
const past = M.moveDayChoices({ fromDate: '2026-09-20T18:00', today: TODAY, mealType: 'dinner', bounds: none, planned: [] });
ok(past[0].date === TODAY && past.length === M.MOVE_DAY_SPAN, 'a meal from a past day can move to today or later');

// --- 2. Leftovers --------------------------------------------------------------
const leftover = { cookScheduledFor: '2026-09-29T18:00', leftoverTimes: [] };
const lb = M.moveBounds(leftover);
ok(lb.earliest === '2026-09-29' && lb.latest === '2026-10-06', 'a leftover stays in the week after its cooking');
clean(lb.reason);
const lDays = M.moveDayChoices({ fromDate: '2026-09-30T12:00', today: TODAY, mealType: 'lunch', bounds: lb, planned: [] });
ok(lDays[0].date === '2026-09-29' && lDays[lDays.length - 1].date === '2026-10-06', 'only those days are offered');
ok(clean(M.moveProblem('2026-09-29T12:00', leftover)) !== null, 'a leftover moved to its cooking day at an earlier hour is stopped');
ok(M.moveProblem('2026-09-29T19:00', leftover) === null, 'later that evening is fine');

const cook = { cookScheduledFor: null, leftoverTimes: ['2026-10-02T12:00', '2026-10-04T12:00'] };
const cb = M.moveBounds(cook);
ok(cb.earliest === '2026-09-27' && cb.latest === '2026-10-02', 'a cooked meal stays on or before its first leftover, within a week of its last');
clean(cb.reason);
clean(M.moveBounds({ cookScheduledFor: null, leftoverTimes: ['2026-10-02T12:00'] }).reason);
ok(clean(M.moveProblem('2026-10-02T18:00', cook)) !== null, 'a cooked meal moved past its first leftover on the same day is stopped');
ok(M.moveProblem('2026-10-02T08:00', cook) === null, 'earlier that morning is fine');

// --- 3. The time is kept ---------------------------------------------------------
ok(M.movedScheduledFor('2026-09-30T18:30', '2026-10-03') === '2026-10-03T18:30', 'the meal keeps its time');
ok(clean(M.movedMessage('Lentil stew', '2026-09-29T18:30', TODAY)) === '"Lentil stew" moved to tomorrow, still at 6:30 PM.', 'the message names the day and time');
ok(clean(M.movedMessage('Lentil stew', '2026-10-03T18:30', TODAY)).includes('moved to Sat Oct 3'), 'a later day by name');
ok(clean(M.moveIntro('Lentil stew', '2026-09-30T18:30', TODAY)).startsWith('"Lentil stew" is planned on Wed Sep 30 at 6:30 PM.'), 'the intro says where it is now');
clean(M.MOVE_SERIES_NOTE);

// --- 4. The screen ------------------------------------------------------------------
const src = fs.readFileSync(path.join(ROOT, 'app/(tabs)/schedule.tsx'), 'utf8');
ok(src.includes('<MoveMealSheet') && src.includes('setMovingItem(item)'), 'a planned meal on Schedules > Meals opens the Move sheet');
ok(/MoveMealSheet[\s\S]*?<PopoverSelect/.test(src), 'the day is picked with PopoverSelect');
ok(fs.readFileSync(path.join(ROOT, 'lib/db.ts'), 'utf8').includes("WHERE id = ? AND status = 'planned'"), 'only a planned meal moves');
ok(sentences.length > 30, 'enough sentences were gathered to sweep');
for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + String(text).slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
