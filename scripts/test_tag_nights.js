// Runs lib/tagNights.ts, check-in tags beside the next night's sleep and
// heart rate: F20, 2026-10-01.
//
// The rules checked:
//
//  1. The night after a tag on day D is the reading dated D + 1, across a
//     month and a year end.
//  2. Each tag names its days and how many of the nights after had a
//     reading, and a tag with none draws no row.
//  3. Below, inside and above the usual range add up to the nights with a
//     reading, and with too few readings the usual range says so.
//  4. The band shows on Nights even with no nights up logged, the reader
//     is wired, and no sentence carries a dash or a cause word.
//
// Run with: node scripts/test_tag_nights.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) return {};
    if (name === './db') throw new Error(`${relPath} reaches the database`);
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const N = load('lib/tagNights.ts');
const T = load('lib/trendsMore.ts');
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

// 1. Dating
check('next day', N.nextDay('2026-09-10') === '2026-09-11');
check('across a month', N.nextDay('2026-09-30') === '2026-10-01');
check('across a year', N.nextDay('2026-12-31') === '2027-01-01');

// A month of mornings: sleep 7 h most nights, 5 h after a bloating day.
const range = { start: '2026-09-01', end: '2026-09-30' };
const mornings = [];
for (let d = 1; d <= 30; d++) mornings.push(`2026-09-${String(d).padStart(2, '0')}`);
mornings.push('2026-10-01');
const bloatDays = ['2026-09-05', '2026-09-12', '2026-09-19'];
const sleep = mornings.map((date) => ({ date, value: bloatDays.some((b) => N.nextDay(b) === date) ? 5 : 7 + (date.endsWith('0') ? 0.5 : 0) }));
const rhr = mornings.filter((_, i) => i % 2 === 0).map((date) => ({ date, value: 58 }));
const tags = [
  { code: 'bloating', label: 'Bloating', dates: bloatDays },
  { code: 'slept_well', label: 'Slept well', dates: ['2026-09-07', '2026-09-30'] },
];
const bands = N.buildTagNightsBands({ range, tags, sleep, restingHeartRate: rhr, hrv: [] });
const sleepBand = bands.find((b) => b.id === 'afterTag_sleep');
check('a sleep band', !!sleepBand);
check('no HRV band with no HRV readings', !bands.some((b) => b.id === 'afterTag_hrv'));
const bloating = sleepBand.items.find((i) => i.key === 'bloating');
check(`tag names its days: ${bloating.title}`, bloating.title === 'Bloating, 3 days tagged');
check(`reading count and middle: ${bloating.caption}`, bloating.caption.startsWith('3 of the 3 nights after had a reading, the middle 5 h.'));
check(`below the usual: ${bloating.caption}`, bloating.caption.includes('3 below your usual, 0 inside it, 0 above it.'));
const slept = sleepBand.items.find((i) => i.key === 'slept_well');
check(`the night after the last day is read from the next month: ${slept.caption}`, slept.caption.startsWith('2 of the 2 nights after'));

// 2. A tag with no reading the night after draws no row
const rhrBand = bands.find((b) => b.id === 'afterTag_restingHeartRate');
const sparse = N.buildTagNightsBands({ range, tags: [{ code: 'x', label: 'X', dates: ['2026-09-01'] }], sleep: [], restingHeartRate: rhr, hrv: [] });
check('a tag with no reading the night after draws no row', sparse.length === 0);
check('only tags with a reading are counted', rhrBand.items.every((i) => /^\d+ of the/.test(i.caption)));
check('no tags, no bands', N.buildTagNightsBands({ range, tags: [], sleep, restingHeartRate: rhr, hrv: [] }).length === 0);

// 3. Below, inside and above add up; too few readings says so
for (const band of bands) {
  for (const item of band.items) {
    const m = item.caption.match(/^(\d+) of the .*?(\d+) below your usual, (\d+) inside it, (\d+) above it\./);
    if (m) check(`counts add up: ${item.caption}`, Number(m[1]) === Number(m[2]) + Number(m[3]) + Number(m[4]));
  }
}
const few = N.buildTagNightsBands({ range, tags, sleep: sleep.slice(0, 7), restingHeartRate: [], hrv: [] });
check('too few readings says how many', few[0].lines.some((l) => l.includes('once there are 8 readings') && l.includes('are 7 so far')));
check('too few readings places nothing', few[0].items.every((i) => !i.caption.includes('below your usual')));
check('at most eight tags', N.MAX_TAGS_SHOWN === 8);

// 4. Nights lens, wiring, words
const view = T.buildNightsView({ range, nights: [], meals: [], afterTags: { range, tags, sleep, restingHeartRate: rhr, hrv: [] } });
check('shows with no nights up logged', view.hasAnything && view.bands.some((b) => b.id === 'afterTag_sleep'));
check('still empty with nothing at all', !T.buildNightsView({ range, nights: [], meals: [] }).hasAnything);
const withNights = T.buildNightsView({ range, nights: [{ nightOf: '2026-09-03', times: 1, firstWake: null }], meals: [], afterTags: { range, tags, sleep, restingHeartRate: rhr, hrv: [] } });
check('comes after the nights up bands', withNights.bands[0].id === 'byWeek' && withNights.bands.some((b) => b.id === 'afterTag_sleep'));
const db = fs.readFileSync(path.join(ROOT, 'lib/trendsMoreDb.ts'), 'utf8');
check('reader feeds the Nights lens', db.includes('loadTagNights(range)') && db.includes('afterTags });'));
check('reader adds sleep on one morning and averages the rest', db.includes("row.recordType === 'sleep' ? (row.value2 ?? row.value)") && db.includes('d.total / d.n'));
const help = fs.readFileSync(path.join(ROOT, 'app/(tabs)/trends.tsx'), 'utf8');
check('help explains it', help.includes('"The night after a tag"'));

const texts = [N.TAG_NIGHTS_NOTE, ...[...bands, ...few].flatMap((b) => [b.title, ...b.lines, ...b.items.flatMap((i) => [i.title, i.caption])])];
const banned = [...READING_FORBIDDEN_WORDS, 'because', 'correlat', 'linked to', 'trigger', 'normal', 'healthy', '—', '–', ' -- ', 'genuine'];
for (const text of texts) {
  const lower = text.toLowerCase();
  for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
  check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
