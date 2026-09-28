/* global __dirname */
// Checks lib/rainForecast.ts, the line a watering task in the garden
// carries about the rain forecast for its day and the day before (I2,
// 1.0.55.16): which tasks count as watering, when nothing is said, how the
// amounts read in millimetres and inches, and that no line ever tells
// anybody a task is not needed or scores the weather.
//
// USAGE
//   node scripts/test_rain_forecast.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'lib/rainForecast.ts');
const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = new Module(file);
mod.filename = file;
mod._compile(out, file);
const R = mod.exports;

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.log('FAIL', label);
  }
}

ok(R.isWateringTask('Water the tomatoes'), 'water');
ok(R.isWateringTask('Deep watering, back beds'), 'watering');
ok(R.isWateringTask('Run the sprinkler'), 'sprinkler');
ok(R.isWateringTask('Check the drip line'), 'drip line');
ok(R.isWateringTask('Irrigate the orchard'), 'irrigate');
ok(!R.isWateringTask('Empty the rainwater barrel'), 'rainwater is not watering');
ok(!R.isWateringTask('Watermelon harvest'), 'watermelon is not watering');
ok(!R.isWateringTask('Weed the herb bed'), 'weeding is not watering');

const today = '2026-09-28';
const mm = {
  unit: 'mm',
  fetchedAt: '2026-09-28T08:00:00Z',
  days: [
    { date: '2026-09-28', amount: 0, chance: 5 },
    { date: '2026-09-29', amount: 6.4, chance: 70 },
    { date: '2026-09-30', amount: 12, chance: 90 },
    { date: '2026-10-01', amount: 0.3, chance: 20 },
    { date: '2026-10-02', amount: 0, chance: 0 },
    { date: '2026-10-03', amount: 0, chance: 10 },
    { date: '2026-10-04', amount: null, chance: null },
  ],
};
const task = (title, date) => ({ title, scheduledFor: `${date}T08:00` });

ok(R.rainNoteForTask(task('Water beds', today), null, today) === null, 'no forecast, nothing said');
ok(R.rainNoteForTask(task('Weed beds', today), mm, today) === null, 'not a watering task');
ok(R.rainNoteForTask(task('Water beds', '2026-09-27'), mm, today) === null, 'a past task');
ok(R.rainNoteForTask(task('Water beds', '2026-10-09'), mm, today) === null, 'past the end of the forecast');

const todayNote = R.rainNoteForTask(task('Water beds', today), mm, today);
ok(todayNote && !todayNote.rain && todayNote.line === 'No rain forecast today.', 'today, dry, no day before looked at');

const tomorrow = R.rainNoteForTask(task('Water beds', '2026-09-29'), mm, today);
ok(tomorrow && tomorrow.rain, 'tomorrow rains');
ok(tomorrow && tomorrow.line.startsWith('Rain forecast tomorrow: about 6 mm, 70% chance.'), 'tomorrow line');

const both = R.rainNoteForTask(task('Water beds', '2026-09-30'), mm, today);
ok(both && both.rain && both.line.startsWith('Rain forecast tomorrow (about 6 mm, 70% chance) and '), 'both days named');
ok(both && both.line.includes('(about 12 mm, 90% chance)'), 'second day amount');

const dayBefore = R.rainNoteForTask(task('Water beds', '2026-10-01'), mm, today);
ok(dayBefore && dayBefore.rain && dayBefore.line.includes('about 12 mm'), 'rain the day before counts; a trace on the day does not');

const dry = R.rainNoteForTask(task('Water beds', '2026-10-03'), mm, today);
ok(dry && !dry.rain && /^No rain forecast \w+ or \w+\.$/.test(dry.line), 'dry both days');

ok(R.describeRainAmount(0.654, 'in') === 'about 0.65 in', 'inches to two places');
ok(R.describeRainAmount(6.4, 'mm') === 'about 6 mm', 'millimetres whole');
const inches = { ...mm, unit: 'in', days: [{ date: today, amount: 0.03, chance: 40 }, { date: '2026-09-29', amount: 0.25, chance: 60 }] };
ok(R.rainNoteForTask(task('Water beds', today), inches, today).rain === false, 'a trace in inches is not rain');
ok(R.rainNoteForTask(task('Water beds', '2026-09-29'), inches, today).line.includes('about 0.25 in, 60% chance'), 'inches line');

ok(R.anyWateringSoon([task('Water beds', '2026-10-04')], today), 'six days out is soon');
ok(!R.anyWateringSoon([task('Water beds', '2026-10-05')], today), 'a week out is not');
ok(!R.anyWateringSoon([task('Weed beds', today)], today), 'no watering task');
ok(!R.anyWateringSoon([task('Water beds', '2026-09-20')], today), 'past tasks do not count');

// No line tells anybody to skip, cancel or not bother, and none grades the
// weather.
const forbidden = /\b(skip|cancel|don't need|do not need|not needed|unnecessary|you should|ideal|optimal|too (low|high|much|little)|perfect|great|bad)\b/i;
const lines = [];
for (const fc of [mm, inches]) {
  for (const d of ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
    const note = R.rainNoteForTask(task('Water beds', d), fc, today);
    if (note) lines.push(note.line);
  }
}
ok(lines.length > 5, 'lines were made to sweep');
for (const line of lines) ok(!forbidden.test(line), `no verdict words: ${line}`);
ok(!/[–—]/.test(lines.join(' ')), 'no dashes');

console.log(`${passed} of ${passed + failed} checks pass`);
process.exit(failed === 0 ? 0 : 1);
