// Checks lib/sinceLastMeal.ts, Home's Since Your Last Meal card (G33): the
// time since the last meal logged, the day it is named against, the
// eating window inside, outside and across midnight, and every sentence
// swept for verdict words, since the card must never say fasting is good
// or bad for anybody.
// Run: node scripts/test_since_last_meal.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const since = load('lib/sinceLastMeal.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too long|too short|great|well done|dangerous|diagnos\w*|burn\w*|ketosis|autophagy)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text), text);
}
function all(label, result) {
  clean(`${label} headline`, result.headline);
  clean(`${label} detail`, result.detail);
  clean(`${label} window`, result.windowLine);
}

const at = (y, m, d, h, min) => new Date(y, m - 1, d, h, min);
const now = at(2026, 9, 27, 16, 5);

// --- Durations and clock -----------------------------------------------------
ok('minutes', since.durationLabel(45) === '45 minutes');
ok('one minute', since.durationLabel(1) === '1 minute');
ok('hours and minutes', since.durationLabel(205) === '3 hours 25 minutes', since.durationLabel(205));
ok('whole hours', since.durationLabel(120) === '2 hours');
ok('days and hours', since.durationLabel(1440 * 2 + 240) === '2 days 4 hours');
ok('midnight label', since.clockLabel('00:00') === '12:00 AM');
ok('noon label', since.clockLabel('12:40') === '12:40 PM');
ok('stamp is local', since.localStamp(now) === '2026-09-27T16:05');

// --- Since the last meal ------------------------------------------------------
{
  const today = since.sinceLastMeal('2026-09-27T12:40', now, null);
  ok('today headline', today.headline === '3 hours 25 minutes ago', today);
  ok('today detail', today.detail === 'Last meal logged today at 12:40 PM.', today);
  ok('no window, no window line', today.windowLine === null);
  all('today', today);
  const yesterday = since.sinceLastMeal('2026-09-26T20:10', now, null);
  ok('yesterday named', /yesterday at 8:10 PM/.test(yesterday.detail), yesterday);
  all('yesterday', yesterday);
  const weekday = since.sinceLastMeal('2026-09-24T19:00', now, null);
  ok('weekday named', /on Thursday at 7:00 PM/.test(weekday.detail), weekday);
  ok('days in headline', /^2 days 21 hours/.test(weekday.headline), weekday);
  const older = since.sinceLastMeal('2026-09-01T08:00', now, null);
  ok('older names the date', /on Sep 1 at 8:00 AM/.test(older.detail), older);
  const none = since.sinceLastMeal(null, now, null);
  ok('nothing logged says so', none.headline === 'No meal logged yet' && none.detail === null, none);
  all('none', none);
  ok('just now', since.sinceLastMeal('2026-09-27T16:05', now, null).headline === 'Just now');
}

// --- The eating window --------------------------------------------------------
{
  const day = { start: '12:00', end: '20:00' };
  const inside = since.eatingWindowLine(day, now);
  ok('inside counts to close', inside === 'Your eating window is 12:00 PM to 8:00 PM. It closes in 3 hours 55 minutes.', inside);
  clean('inside', inside);
  const before = since.eatingWindowLine(day, at(2026, 9, 27, 9, 30));
  ok('before counts to open', /It opens in 2 hours 30 minutes\.$/.test(before), before);
  const after = since.eatingWindowLine(day, at(2026, 9, 27, 21, 0));
  ok('after counts to tomorrow', /It opens in 15 hours\.$/.test(after), after);
  clean('after', after);
  const atEnd = since.eatingWindowLine(day, at(2026, 9, 27, 20, 0));
  ok('the end minute is outside', /opens in/.test(atEnd), atEnd);

  const overnight = { start: '18:00', end: '02:00' };
  ok('overnight inside late', /closes in 3 hours\.$/.test(since.eatingWindowLine(overnight, at(2026, 9, 27, 23, 0))));
  ok('overnight inside early', /closes in 1 hour\.$/.test(since.eatingWindowLine(overnight, at(2026, 9, 28, 1, 0))));
  ok('overnight outside', /opens in 1 hour 55 minutes\.$/.test(since.eatingWindowLine(overnight, now)));
  ok('same start and end has no countdown', since.eatingWindowLine({ start: '10:00', end: '10:00' }, now) === 'Your eating window is 10:00 AM to 10:00 AM.');
  ok('broken time says nothing', since.eatingWindowLine({ start: 'x', end: '10:00' }, now) === null);

  all('with window', since.sinceLastMeal('2026-09-27T12:40', now, day));
}

// --- From Profile --------------------------------------------------------------
ok('fasting off, no window', since.windowFromProfile({ fastingEnabled: false, eatingWindowStart: '12:00', eatingWindowEnd: '20:00' }) === null);
ok('one time missing, no window', since.windowFromProfile({ fastingEnabled: true, eatingWindowStart: '12:00', eatingWindowEnd: null }) === null);
ok('both set', since.windowFromProfile({ fastingEnabled: true, eatingWindowStart: '12:00', eatingWindowEnd: '20:00' }).end === '20:00');

clean('caption', since.SINCE_LAST_MEAL_CAPTION);
clean('no window line', since.NO_WINDOW_LINE);

console.log(failures === 0 ? `test_since_last_meal: all passed (${swept} sentences swept)` : `test_since_last_meal: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
