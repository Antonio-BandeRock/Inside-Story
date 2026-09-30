// Checks K8 (resting heart rate and heart rate variability in a report),
// lib/reportHeart.ts (2026-09-29).
//
//  1. Each signal with readings in the range is one row: latest, average,
//     usual range and how many readings.
//  2. The usual range draws on readings from before the range, and says
//     how many more it needs until there are enough.
//  3. A signal with nothing in the range is left out; neither gives the
//     empty sentence. A chart needs two days.
//  4. No verdict words.
//
// Run with: node scripts/test_report_heart.js

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
    if (name === './db') throw new Error(relPath + ' reaches the database');
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const H = load('lib/reportHeart.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b));
  }
}

function day(n) {
  const d = new Date(2026, 7, 1 + n);
  const pad = (x) => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
const rhr = (n, value) => ({ signal: 'restingHeartRate', date: day(n), at: day(n) + 'T07:00:00', value });
const hrv = (n, value, hour) => ({ signal: 'hrv', date: day(n), at: day(n) + 'T' + (hour || '06') + ':00:00', value });

// Ten resting readings in August before the range, three in the range.
const readings = [];
for (let i = 0; i < 10; i += 1) readings.push(rhr(i, 60 + i));
readings.push(rhr(30, 62), rhr(31, 64), rhr(32, 75));
// Two HRV readings in the range on one day, one on another, none before.
readings.push(hrv(30, 40, '05'), hrv(30, 50, '23'), hrv(32, 45));
readings.push({ signal: 'spo2', date: day(31), at: day(31) + 'T01:00:00', value: 97 });

const start = day(30);
const end = day(33);
const section = H.heartSection(readings, start, end);

// 1 and 2
same(section.columns, H.HEART_COLUMNS, 'columns');
same(section.rows.length, 2, 'one row per signal, spo2 left to Trends');
same(section.rows[0][0], 'Resting heart rate', 'resting first');
same(section.rows[0][1], '75 bpm on Sep 2, 2026', 'latest with its date');
same(section.rows[0][2], '67 bpm', 'average of the range only');
same(section.rows[0][3].startsWith('61 to 68 bpm, from 12 readings; latest above it'), true, 'usual from the 12 before the latest, place said: ' + section.rows[0][3]);
same(section.rows[0][4], '3', 'readings in range');
same(section.rows[1][3], 'Shows after 8 earlier readings (2 so far)', 'too few earlier readings says so');
same(section.rows[1][2], '45 ms', 'hrv average');

// 3
same(section.charts.map((c) => c.title), ['Resting heart rate by day (bpm)', 'Heart rate variability by day, average of the day (ms)'], 'a chart per signal with two days or more');
same(section.charts[1].chart.points, [{ date: day(30), value: 45 }, { date: day(32), value: 45 }], 'hrv charted as each day\'s average');
const onlyOne = H.heartSection([rhr(30, 60)], start, end);
same([onlyOne.rows.length, onlyOne.charts.length], [1, 0], 'one day, a row and no chart');
const none = H.heartSection([rhr(1, 60)], start, end);
same([none.rows.length, none.empty], [0, H.HEART_EMPTY], 'nothing in range: the empty sentence');
same(H.heartSection(null, start, end).empty, 'Could not be read for this report.', 'a failed read says so');
same(H.usualCell([60, 61, 62, 63, 64, 65, 66, 67, 63], 'bpm').endsWith('latest inside it'), true, 'inside');

// 4
const words = [H.HEART_NOTE, H.HEART_EMPTY, ...section.rows.flat()].join(' ');
same(/\b(abnormal|too high|too low|ideal|optimal|healthy|good|bad|normal|real|genuine|genuinely)\b/i.test(words), false, 'no verdict or filler words');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
