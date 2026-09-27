// Checks F17 of the competitive build plan (Phase 2, 2026-09-26): six
// months and a year on Trends. Up to ninety days a series is drawn as it
// is; past that as weekly averages, then monthly, with an empty week or
// month kept as a gap, and no verdict words. Also times Pattern Finder's
// ordinary-stretch comparison over a year of meals, the heaviest thing a
// year's range asks for. Exits non-zero on any failure.

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

const L = load('lib/longRange.ts');
const B = load('lib/patternBasis.ts');

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

function day(offset) {
  const d = new Date(2025, 8, 29 + offset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

check('Monday of a Sunday', L.mondayOf('2026-09-27'), '2026-09-21');
check('Monday of a Monday', L.mondayOf('2026-09-21'), '2026-09-21');
check('Monday across a month', L.mondayOf('2026-10-01'), '2026-09-28');

// Ninety days or fewer are left alone.
const short = [];
for (let i = 0; i < 90; i += 1) short.push({ date: day(i), value: i });
const shortSeries = L.chartSeries(short);
check('ninety days stay days', [shortSeries.bucket, shortSeries.points.length], ['day', 90]);
check('no caption for days', L.longRangeCaption(shortSeries), null);
check('no prefix for days', L.pointLabelPrefix(shortSeries), '');

// A year with a three-week hole. 2025-09-29 is a Monday.
const year = [];
for (let i = 0; i < 365; i += 1) {
  if (i >= 70 && i < 91) continue;
  year.push({ date: day(i), value: i % 7 === 0 ? 10 : 20 });
}
const yearSeries = L.chartSeries(year);
check('a year becomes weeks', yearSeries.bucket, 'week');
check('weeks dated by Monday', yearSeries.points.slice(0, 2).map((p) => p.date), ['2025-09-29', '2025-10-06']);
check('weekly average of the days recorded', yearSeries.points[0].value, (10 + 6 * 20) / 7);
check('three empty weeks kept as gaps', yearSeries.emptyPeriods, 3);
check('empty weeks draw no point', yearSeries.points.some((p) => p.date === '2025-12-08'), false);
check('break after seven days', yearSeries.breakGapDays, 7);
check('prefix', L.pointLabelPrefix(yearSeries), 'Week of ');
check(
  'caption counts the gaps',
  L.longRangeCaption(yearSeries),
  'Each point is the average of the days with a reading in the week starting that Monday. The line breaks at a week with nothing recorded: 3 weeks here.',
);

// A busy day counts once in its week.
const busy = L.weeklyAverages([
  { date: '2026-09-21', value: 2 },
  { date: '2026-09-21', value: 4 },
  { date: '2026-09-22', value: 9 },
]);
check('busy day averaged first', [busy[0].value, busy[0].days], [6, 2]);

// Past ninety weeks, months.
const long = [];
for (let i = 0; i < 700; i += 3) long.push({ date: day(i), value: 5 });
const longSeries = L.chartSeries(long);
check('two years become months', [longSeries.bucket, longSeries.breakGapDays], ['month', 45]);
check('month points dated the first', longSeries.points[0].date, '2025-09-01');
check('month caption', L.longRangeCaption(longSeries).startsWith('Each point is the average of the days with a reading in that month. Every month'), true);
check('nothing in, nothing out', L.chartSeries([]).points, []);

// A year of meals through the ordinary-stretch comparison, four stretches
// a day, the way Pattern Finder runs it.
const meals = [];
for (let i = 0; i < 365; i += 1) {
  for (const hour of ['08', '13', '19']) {
    meals.push({ eatenAt: `${day(i)}T${hour}:00`, keys: ['a', 'b', 'c', 'd', 'e'] });
  }
}
const started = Date.now();
const ends = B.usualWindowEnds(day(0), day(364), new Date(2027, 0, 1));
const windows = ends.map((end) => B.keysInWindow(meals, end, 24));
const elapsed = Date.now() - started;
check('a year of stretches', ends.length, 1460);
check('every stretch after the first morning found its meals', windows.slice(1).every((w) => w && w.size === 5), true);
total += 1;
if (elapsed > 1000) {
  failures += 1;
  console.log(`FAIL  a year of stretches took ${elapsed} ms`);
}

const FORBIDDEN =
  /\b(better|worse|improv\w*|should|must|healthy|unhealthy|ideal|optimal|bad|good|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
for (const sentence of [L.longRangeCaption(yearSeries), L.longRangeCaption(longSeries), L.longRangeCaption({ ...yearSeries, emptyPeriods: 1 })]) {
  check(`no verdict words: ${sentence.slice(0, 60)}`, FORBIDDEN.test(sentence), false);
}

console.log(`${total - failures} of ${total} checks passed (a year of stretches in ${elapsed} ms)`);
if (failures > 0) process.exit(1);
