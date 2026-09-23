// Runs lib/countdown.ts: the Days Until counter's arithmetic and
// every sentence it reads through, without a phone.
//
// Built 2026-09-21, from "create a Days Until counter the user can create,
// Name, and start a timer in days. All this to be tied to Plots &
// Planting. These will be available from the Home screen in Garden quick
// access."
//
// The rules checked:
//
//  1. Calendar days: a counter moves by whole days between dates, across a
//     month end, a year end and a daylight-saving change.
//  2. The figure a row leads with: days ahead, Today on the day, days over
//     once past, Done once marked, singular at one.
//  3. The sentence under it names the span, the landing day, and how long
//     a done counter took.
//  4. Progress runs 0 to 1 and holds at 1.
//  5. Order: running counters soonest first (overdue ahead of them), done
//     ones after, newest done first.
//  6. The form refuses an empty name, a non-number, zero, a fraction and a
//     bad date, and accepts a whole number of days.
//  7. Two kinds, one list: a garden counter and a free-form one read into
//     the same shape, and merging them orders both by when they land.
//
// A counter stopped having to be about the garden on 2026-09-22, from "Days
// Until should be something that is also available in a free form allowing
// the user to create their own Days Until for something that we don't have
// covered in the app." The arithmetic above did not change; section 7 is
// the only part that knows there are two kinds at all.
//
// Run with: node scripts/test_countdown.js
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

const C = loadModule('lib/countdown.ts');
const {
  calendarDaysBetween, addCalendarDays, countdownDueDate, daysUntil, countdownState, countdownFigure,
  describeCountdown, countdownProgress, sortCountdowns, countdownFormProblem,
  gardenAsAny, freeAsAny, mergeCountdowns,
} = C;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}

// 1. Calendar days.
check('same day is zero', calendarDaysBetween('2026-09-21', '2026-09-21'), 0);
check('a day on', calendarDaysBetween('2026-09-21', '2026-09-22'), 1);
check('a day back is negative', calendarDaysBetween('2026-09-21', '2026-09-20'), -1);
check('across a month end', calendarDaysBetween('2026-09-21', '2026-10-05'), 14);
check('across a year end', calendarDaysBetween('2026-12-25', '2027-01-04'), 10);
check('across the November clock change', calendarDaysBetween('2026-10-30', '2026-11-03'), 4);
check('across the March clock change', calendarDaysBetween('2027-03-12', '2027-03-16'), 4);
check('adding days crosses a month', addCalendarDays('2026-09-21', 14), '2026-10-05');
check('adding days crosses a leap day', addCalendarDays('2028-02-27', 3), '2028-03-01');
check('adding zero is the same day', addCalendarDays('2026-09-21', 0), '2026-09-21');
check('due date is start plus days', countdownDueDate({ startedOn: '2026-09-21', days: 21 }), '2026-10-12');

// 2. The figure.
const seed = { startedOn: '2026-09-21', days: 14, doneAt: null };
check('days until, ahead', daysUntil(seed, '2026-09-21'), 14);
check('days until, on the day', daysUntil(seed, '2026-10-05'), 0);
check('days until, past', daysUntil(seed, '2026-10-08'), -3);
check('state ahead', countdownState(seed, '2026-09-30'), 'ahead');
check('state today', countdownState(seed, '2026-10-05'), 'today');
check('state over', countdownState(seed, '2026-10-06'), 'over');
check('state done wins over the calendar', countdownState({ ...seed, doneAt: '2026-09-28T10:00:00Z' }, '2026-10-08'), 'done');
check('figure ahead', countdownFigure(seed, '2026-09-21'), '14 days');
check('figure one day', countdownFigure(seed, '2026-10-04'), '1 day');
check('figure today', countdownFigure(seed, '2026-10-05'), 'Today');
check('figure one over', countdownFigure(seed, '2026-10-06'), '1 day over');
check('figure days over', countdownFigure(seed, '2026-10-08'), '3 days over');
check('figure done', countdownFigure({ ...seed, doneAt: '2026-09-28T10:00:00Z' }, '2026-10-08'), 'Done');

// 3. The sentence. Month names come from the runtime locale, so match the
// shape rather than the exact month word.
check('ahead names the span and the landing day', /^14 days from \w+ 21, landing \w+ 5\.$/.test(describeCountdown(seed, '2026-09-21')), true);
check('today says so', /^14 days from \w+ 21: that is today\.$/.test(describeCountdown(seed, '2026-10-05')), true);
check('over says it landed', /^14 days from \w+ 21, landed \w+ 5\.$/.test(describeCountdown(seed, '2026-10-08')), true);
check('done says how long it took', /^14 days from \w+ 21, marked done at 7 days\.$/.test(describeCountdown({ ...seed, doneAt: '2026-09-28T10:00:00Z' }, '2026-10-08')), true);
check('one day is singular', /^1 day from \w+ 21, marked done at 1 day\.$/.test(describeCountdown({ startedOn: '2026-09-21', days: 1, doneAt: '2026-09-22T08:00:00Z' }, '2026-09-30')), true);

// 4. Progress.
check('progress at the start', countdownProgress(seed, '2026-09-21'), 0);
check('progress halfway', countdownProgress(seed, '2026-09-28'), 0.5);
check('progress on the day', countdownProgress(seed, '2026-10-05'), 1);
check('progress holds at one', countdownProgress(seed, '2026-10-20'), 1);
check('progress never below zero', countdownProgress(seed, '2026-09-01'), 0);

// 5. Order.
const items = [
  { id: 'a', startedOn: '2026-09-01', days: 30, doneAt: null }, // lands Oct 1
  { id: 'b', startedOn: '2026-09-20', days: 3, doneAt: null }, // lands Sep 23
  { id: 'c', startedOn: '2026-09-01', days: 10, doneAt: '2026-09-11T08:00:00Z' },
  { id: 'd', startedOn: '2026-09-01', days: 5, doneAt: null }, // landed Sep 6, over
  { id: 'e', startedOn: '2026-08-01', days: 10, doneAt: '2026-08-12T08:00:00Z' },
];
check('overdue first, then soonest, then done newest first', sortCountdowns(items, '2026-09-21').map((i) => i.id), ['d', 'b', 'a', 'c', 'e']);
check('sorting leaves the input alone', items.map((i) => i.id), ['a', 'b', 'c', 'd', 'e']);

// 6. The form.
check('a good form passes', countdownFormProblem({ name: 'Days to germination', days: '10', startedOn: '2026-09-21' }), null);
check('an empty name is refused', countdownFormProblem({ name: '  ', days: '10', startedOn: '2026-09-21' }), 'Give the counter a name.');
check('no days is refused', countdownFormProblem({ name: 'x', days: '', startedOn: '2026-09-21' }), 'How many days? A whole number, at least 1.');
check('zero days is refused', countdownFormProblem({ name: 'x', days: '0', startedOn: '2026-09-21' }), 'How many days? A whole number, at least 1.');
check('a fraction is refused', countdownFormProblem({ name: 'x', days: '2.5', startedOn: '2026-09-21' }), 'How many days? A whole number, at least 1.');
check('words are refused', countdownFormProblem({ name: 'x', days: 'ten', startedOn: '2026-09-21' }), 'How many days? A whole number, at least 1.');
check('a bad date is refused', countdownFormProblem({ name: 'x', days: '10', startedOn: '21/09/2026' }), 'Pick the day it started.');

// 7. Two kinds, one list.
const gardenRow = {
  id: 'g1', plotId: 'p1', plantingId: 'pl1', name: 'Days to transplant',
  plotName: 'Back bed', plantingName: 'Tomatoes',
  startedOn: '2026-09-21', days: 14, doneAt: null,
};
check('a garden counter says where it is', gardenAsAny(gardenRow).where, 'Tomatoes, Back bed');
check('a garden counter keeps its kind', gardenAsAny(gardenRow).kind, 'garden');
check('inside one area the area name is left off', gardenAsAny(gardenRow, { namesArea: false }).where, 'Tomatoes');
check(
  'an area counter with no planting says the area',
  gardenAsAny({ ...gardenRow, plantingId: null, plantingName: null }).where,
  'Back bed',
);
check(
  'an area counter with no planting says nothing inside that area',
  gardenAsAny({ ...gardenRow, plantingId: null, plantingName: null }, { namesArea: false }).where,
  null,
);

const freeRow = { id: 'f1', name: 'Passport', about: 'Posted the form', startedOn: '2026-09-21', days: 21, doneAt: null };
check('a free counter says what was written under it', freeAsAny(freeRow).where, 'Posted the form');
check('a free counter keeps its kind', freeAsAny(freeRow).kind, 'free');
check('nothing written reads as nothing', freeAsAny({ ...freeRow, about: null }).where, null);
check('a blank line reads as nothing', freeAsAny({ ...freeRow, about: '   ' }).where, null);
check('a written line is trimmed', freeAsAny({ ...freeRow, about: '  Posted the form  ' }).where, 'Posted the form');

const merged = mergeCountdowns(
  [
    { id: 'f1', name: 'Passport', about: null, startedOn: '2026-09-01', days: 40, doneAt: null }, // lands Oct 11
    { id: 'f2', name: 'Cast off', about: null, startedOn: '2026-09-01', days: 5, doneAt: null }, // landed Sep 6
  ],
  [gardenRow], // lands Oct 5
  '2026-09-21',
);
check('both kinds land in one list', merged.length, 3);
check('ordered by when they land, overdue first', merged.map((row) => row.id), ['f2', 'g1', 'f1']);
check('each row still says which kind it is', merged.map((row) => row.kind), ['free', 'garden', 'free']);
check('the arithmetic is the same arithmetic', countdownFigure(merged[1], '2026-09-21'), '14 days');

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
