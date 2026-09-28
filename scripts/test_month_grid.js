/* global __dirname */
// Checks the month view on Schedules > Meals (H8, 2026-09-28): the grid's
// weeks start on Sunday like the week strip, cover the whole month and no
// more than the weeks it touches, month paging crosses a year, the marks
// count each day's meals and notes, and no sentence passes a verdict.
//
// USAGE
//   node scripts/test_month_grid.js
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

const M = load('lib/monthGrid.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const weekday = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

// --- 1. The grid --------------------------------------------------------------------
for (const month of ['2026-09', '2026-02', '2027-02', '2026-11', '2024-02', '2026-08']) {
  const weeks = M.monthGridWeeks(month);
  const days = weeks.flat();
  const inMonth = days.filter((d) => M.isInMonth(d, month));
  const [y, m] = month.split('-').map(Number);
  const length = new Date(y, m, 0).getDate();
  ok(weeks.length >= 4 && weeks.length <= 6, `${month}: four to six rows (${weeks.length})`);
  ok(weeks.every((w) => w.length === 7 && weekday(w[0]) === 0 && weekday(w[6]) === 6), `${month}: every row runs Sunday to Saturday`);
  ok(inMonth.length === length && inMonth[0] === `${month}-01`, `${month}: every day of the month once, from the 1st`);
  ok(new Set(days).size === days.length, `${month}: no day twice`);
  ok(M.isInMonth(weeks[0].find((d) => d.endsWith('-01') && M.isInMonth(d, month)), month), `${month}: the 1st is in the first row`);
  ok(weeks[weeks.length - 1].some((d) => M.isInMonth(d, month)) && weeks[0].some((d) => M.isInMonth(d, month)), `${month}: no row lies wholly outside the month`);
  const range = M.monthGridRange(month);
  ok(range.from === days[0] && range.to === days[days.length - 1], `${month}: the query range is the grid`);
}
ok(M.monthGridWeeks('2026-02').length === 4, 'February 2026 starts on a Sunday and fills exactly four rows');
ok(M.monthGridWeeks('2026-08').length === 6, 'August 2026 needs six rows');

// --- 2. Paging --------------------------------------------------------------------
ok(M.shiftMonth('2026-12', 1) === '2027-01' && M.shiftMonth('2027-01', -1) === '2026-12', 'paging crosses the year');
ok(M.shiftMonth('2026-09', 0) === '2026-09' && M.shiftMonth('2026-09', 14) === '2027-11', 'paging by several months');
ok(M.monthOf('2026-09-30') === '2026-09' && M.monthOf('2026-09-30T18:30') === '2026-09', 'a day and a timed day read to their month');
ok(/2026/.test(M.monthLabel('2026-09')), 'the heading names the year');
ok(M.weekdayInitials().length === 7, 'seven column headings');

// --- 3. The marks -----------------------------------------------------------------
const marks = M.marksByDate(
  ['2026-09-30T08:00', '2026-09-30T12:30', '2026-10-01T18:00'],
  ['2026-09-30', '2026-10-02T09:00'],
);
ok(marks.get('2026-09-30').meals === 2 && marks.get('2026-09-30').notes === 1, 'two meals and a note on one day');
ok(marks.get('2026-10-01').meals === 1 && marks.get('2026-10-01').notes === 0, 'a meal alone');
ok(marks.get('2026-10-02').meals === 0 && marks.get('2026-10-02').notes === 1, 'a timed note on its day');
ok(!marks.has('2026-10-03'), 'a day with nothing has no marks');

// --- 4. The words ---------------------------------------------------------------------
const FORBIDDEN = /\b(safe|unsafe|bad|should|must|missed|failed|overdue|late|empty|real|genuine|genuinely|better|worse|great|well done)\b|[–—]| -- /i;
const sentences = [
  M.MONTH_GRID_KEY,
  M.WEEK_VIEW_LABEL,
  M.MONTH_VIEW_LABEL,
  M.monthDayAccessibilityLabel('2026-09-30', marks.get('2026-09-30')),
  M.monthDayAccessibilityLabel('2026-10-01', marks.get('2026-10-01')),
  M.monthDayAccessibilityLabel('2026-10-03', undefined),
];
ok(sentences[3].includes('2 meals planned, 1 note'), 'a screen reader hears the count');
ok(sentences[4].includes('1 meal planned') && !sentences[4].includes('note'), 'singular, and no note named when there is none');
for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + text.slice(0, 70));

// --- 5. The screen --------------------------------------------------------------------
const src = fs.readFileSync(path.join(ROOT, 'app/(tabs)/schedule.tsx'), 'utf8');
ok(src.includes('monthGridRange(viewMonth)') && src.includes('listScheduledMealsForDateRange(from, to), listCalendarNotes(from, to)'), 'the grid reads meals and notes for its whole range in one pass');
ok(src.includes('styles.weekDayDot') && src.includes('styles.weekDayRing') && src.includes('monthMarks.get(date)'), 'the grid uses the same dot and ring as the week strip');
ok(/function pickMonthDay[\s\S]{0,200}setWeekStart\(startOfWeekLocal\(date\)\)/.test(src), 'tapping a day moves the week to that day');
ok(src.includes('[calendarView, viewMonth, items, notes]'), 'the grid reloads when the week reloads');

console.log(failures === 0 ? '\nAll passed.' : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
