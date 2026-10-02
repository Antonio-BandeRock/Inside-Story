// Runs lib/tagMarks.ts, check-in tags as marks under a chart: F18, 2026-10-01.
//
// The rules checked:
//
//  1. A tag lands on the LOCAL day it was logged, never the UTC day.
//  2. One mark a day however many check-ins carried the tag, and only
//     days inside the range.
//  3. The tag on most days is offered first, then by name.
//  4. At most three rows; a fourth pick replaces the oldest, and a picked
//     tag with no day in the range draws no row.
//  5. A tapped day names its tags; the chart, the lens and the reader are
//     wired; no dashes and no cause words.
//
// Run with: node scripts/test_tag_marks.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
function load(relPath) {
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`${relPath} has a runtime import ${name}`);
  });
  return module.exports;
}

const T = load('lib/tagMarks.ts');
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

// A moment at a local hour, written the way the app writes it (UTC).
const at = (day, hour) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 30).toISOString();
};
const labels = { bloating: 'Bloating', fatigue: 'Fatigue', slept_well: 'Slept well', headache: 'Headache' };
const labelOf = (code) => labels[code];

// 1. The local day
check('late evening stays on its day', T.localDayOf(at('2026-09-10', 23)) === '2026-09-10');
check('early morning stays on its day', T.localDayOf(at('2026-09-10', 0)) === '2026-09-10');

// 2 and 3. Days per tag
const rows = [
  { loggedAt: at('2026-09-10', 8), tagCode: 'bloating' },
  { loggedAt: at('2026-09-10', 21), tagCode: 'bloating' },
  { loggedAt: at('2026-09-12', 23), tagCode: 'bloating' },
  { loggedAt: at('2026-09-11', 9), tagCode: 'fatigue' },
  { loggedAt: at('2026-09-13', 9), tagCode: 'fatigue' },
  { loggedAt: at('2026-09-11', 9), tagCode: 'slept_well' },
  { loggedAt: at('2026-08-31', 23), tagCode: 'headache' },
  { loggedAt: at('2026-09-20', 7), tagCode: 'custom:abc' },
];
const all = T.tagDays(rows, '2026-09-01', '2026-09-30', labelOf);
const bloating = all.find((r) => r.code === 'bloating');
check('one mark a day', bloating.dates.join(',') === '2026-09-10,2026-09-12');
check('a day before the range is left out', !all.some((r) => r.code === 'headache'));
check(`most days first, then by name: ${all.map((r) => r.code).join(',')}`, all.map((r) => r.code).join(',') === 'bloating,fatigue,custom:abc,slept_well');
check('a tag with no name keeps its code', all.find((r) => r.code === 'custom:abc').label === 'custom:abc');
check('nothing logged, nothing offered', T.tagDays([], '2026-09-01', '2026-09-30', labelOf).length === 0);

// 4. Picking
let picked = [];
for (const code of ['bloating', 'fatigue', 'slept_well']) picked = T.togglePicked(picked, code);
check('three picked', picked.join(',') === 'bloating,fatigue,slept_well');
picked = T.togglePicked(picked, 'custom:abc');
check(`a fourth replaces the oldest: ${picked.join(',')}`, picked.join(',') === 'fatigue,slept_well,custom:abc');
check('picking again takes it away', T.togglePicked(picked, 'fatigue').join(',') === 'slept_well,custom:abc');
check('never more than the limit', T.MAX_TAG_MARK_ROWS === 3 && picked.length <= T.MAX_TAG_MARK_ROWS);
check('rows in the order picked', T.markRows(all, ['fatigue', 'bloating']).map((r) => r.code).join(',') === 'fatigue,bloating');
check('a tag with no day in the range draws no row', T.markRows(all, ['headache', 'fatigue']).length === 1);

// 5. A tapped day, wiring, words
const marks = T.markRows(all, ['bloating', 'slept_well']);
check('a tapped day names its tags', T.taggedOn(marks, '2026-09-11') === 'Tagged that day: Slept well.');
check('a day with no tag adds nothing', T.taggedOn(marks, '2026-09-15') === null);
check('day counts', T.dayCountWords(1) === '1 day' && T.dayCountWords(4) === '4 days');

const chart = fs.readFileSync(path.join(ROOT, 'components/CompareTwoChart.tsx'), 'utf8');
check('chart draws the marks', chart.includes('marks.map(') && chart.includes('taggedOn('));
check('chart draws no path between marks', !/<(Path|Polyline)\b/.test(chart));
const lens = fs.readFileSync(path.join(ROOT, 'components/CompareTwoLens.tsx'), 'utf8');
check('lens reads the tags for the range', lens.includes('loadTagDays(') && lens.includes('marks={marks}'));
check('lens lets tags be picked and says what a mark is', lens.includes('togglePicked(') && lens.includes('TAG_MARKS_LINE'));
const db = fs.readFileSync(path.join(ROOT, 'lib/compareSeriesDb.ts'), 'utf8');
check('reader joins tags to their check-ins', /checkin_tags t JOIN wellbeing_checkins c/.test(db));
check('reader leaves out a tag marked not present', db.includes('t.severity IS NULL OR t.severity > 0'));
check('reader narrows by the local day', db.includes('tagDays(rows'));

const texts = [T.TAG_MARKS_LINE, T.taggedOn(marks, '2026-09-10')];
const banned = [...READING_FORBIDDEN_WORDS, 'because of', 'correlat', 'linked to', 'caused', 'trigger', '—', '–', ' -- ', 'genuine'];
for (const text of texts) {
  const lower = text.toLowerCase();
  for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
  check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
