// Checks F14 of the competitive build plan (Phase 2, 2026-09-26): averages
// by weekday and by month, each with the number of days behind it, a busy
// day counted once, an empty weekday or month said to be not recorded, and
// no verdict words. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const P = load('lib/periodAverages.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

// 2026-09-21 is a Monday.
const points = [
  { date: '2026-09-21', value: 4000 },
  { date: '2026-09-28', value: 6000 },
  { date: '2026-09-22', value: 3000 },
  { date: '2026-09-22', value: 5000 },
  { date: '2026-09-26', value: 9000 },
];
const weekdays = P.averagesByWeekday(points);
check('Monday first, Sunday last', weekdays.map((r) => r.label), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
check('Monday average and days', [weekdays[0].average, weekdays[0].days], [5000, 2]);
check('a busy day counts once', [weekdays[1].average, weekdays[1].days], [4000, 1]);
check('Saturday', weekdays[5].average, 9000);
check('an empty weekday is null, not zero', [weekdays[2].average, weekdays[2].days], [null, 0]);
check('not recorded text', P.periodValueText(weekdays[2], String, { one: 'day', many: 'days' }), 'not recorded');
check('value text', P.periodValueText(weekdays[0], (v) => `${v} steps`, { one: 'day', many: 'days' }), '5000 steps, 2 days');
check('one day text', P.periodValueText(weekdays[1], (v) => `${v}`, { one: 'night', many: 'nights' }), '4000, 1 night');

const months = P.averagesByMonth([
  { date: '2026-06-03', value: 2 },
  { date: '2026-06-20', value: 4 },
  { date: '2026-08-01', value: 5 },
]);
check('months oldest first with the gap kept', months.map((r) => [r.label, r.average, r.days]), [
  ['June', 3, 2],
  ['July', null, 0],
  ['August', 5, 1],
]);
const acrossYears = P.averagesByMonth([{ date: '2025-12-30', value: 1 }, { date: '2026-01-02', value: 3 }]);
check('years named when the range crosses one', acrossYears.map((r) => r.label), ['December 2025', 'January 2026']);
check('no readings, no months', P.averagesByMonth([]), []);
check('one month is not enough', P.showsMonths([{ date: '2026-06-03', value: 2 }, { date: '2026-06-09', value: 2 }]), false);
check('two months are', P.showsMonths([{ date: '2026-06-03', value: 2 }, { date: '2026-07-09', value: 2 }]), true);
check('few readings hide the weekday split', P.showsWeekdays(points), false);
const many = [];
for (let i = 1; i <= 14; i += 1) many.push({ date: `2026-06-${String(i).padStart(2, '0')}`, value: i });
check('fourteen days show it', P.showsWeekdays(many), true);
check('a timestamp is read by its date', P.averagesByWeekday([{ date: '2026-09-21T07:30', value: 1 }])[0].days, 1);

const FORBIDDEN =
  /\b(better|worse|best|worst|improv\w*|should|must|healthy|unhealthy|ideal|optimal|bad|good|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
for (const sentence of [P.PERIOD_AVERAGES_CAPTION, P.periodValueText(weekdays[0], String, { one: 'day', many: 'days' })]) {
  check(`no verdict words: ${sentence.slice(0, 60)}`, FORBIDDEN.test(sentence), false);
}

console.log(`${total - failures} of ${total} checks passed`);
if (failures > 0) process.exit(1);
