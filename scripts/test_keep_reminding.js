// Checks lib/keepReminding.ts (C2 of the competitive build plan, Phase 2,
// 2026-09-26): the per-thing "keep reminding me until I mark it" choice,
// when a Did I Do It check speaks, and how long something already gone by
// keeps its follow-ups. Pure, so it runs here rather than on a phone. Exits
// non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, stubs = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const schedule = { NUDGE_FOLLOW_UP_MINUTES: [15, 45, 90] };
const k = load('lib/keepReminding.ts', { './reminderSchedule': schedule });

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

// --- The choice ---------------------------------------------------------------
check('null follows the switch when on', k.followUpMinutes(null, true), [15, 45, 90]);
check('null follows the switch when off', k.followUpMinutes(null, false), []);
check('once only is once, switch or not', k.followUpMinutes(0, true), []);
check('every 30 minutes, switch off', k.followUpMinutes(30, false), [30, 60, 90, 120]);
check('every 5 minutes stops at eight', k.followUpMinutes(5, true), [5, 10, 15, 20, 25, 30, 35, 40]);
check('every hour stops at two hours', k.followUpMinutes(60, false), [60, 120]);
check('clean keeps a known interval', k.cleanKeepReminding(10), 10);
check('clean keeps once only', k.cleanKeepReminding(0), 0);
check('clean drops an unknown interval', k.cleanKeepReminding(7), null);
check('clean drops nonsense', k.cleanKeepReminding('abc'), null);
check('clean reads null', k.cleanKeepReminding(null), null);
check('value round trip, switch', k.readKeepReminding(k.keepRemindingValue(null)), null);
check('value round trip, once', k.readKeepReminding(k.keepRemindingValue(0)), 0);
check('value round trip, 15', k.readKeepReminding(k.keepRemindingValue(15)), 15);
check('every option reads back', k.KEEP_REMINDING_OPTIONS.map((o) => k.keepRemindingValue(k.readKeepReminding(o.value))), k.KEEP_REMINDING_OPTIONS.map((o) => o.value));
check('lookback covers the longest follow-up', k.KEEP_REMINDING_LOOKBACK_MINUTES >= 120, true);

// --- A check that speaks -----------------------------------------------------
function makeCheck(over) {
  return { id: 'c1', name: 'Took my morning pill', cadence: 'daily', active: true, position: 0, lastMarkedAt: null, lastMarkedVia: null, reminderTime: '08:00', reminderDays: [], reminderOn: true, keepReminding: null, ...over };
}
const on = { time: '08:00', days: [], on: true };
// Friday 2026-09-25, 9:00 local.
const friday = new Date(2026, 8, 25, 9, 0, 0);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')} ${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

check('daily, unmarked: today (gone by) and the next two', k.checkReminderTimes(makeCheck(), on, friday, 2).map(iso), ['2026-09 25 8:00', '2026-09 26 8:00', '2026-09 27 8:00']);
check('daily, marked this morning: today is skipped', k.checkReminderTimes(makeCheck({ lastMarkedAt: new Date(2026, 8, 25, 7, 30).toISOString() }), on, friday, 1).map(iso), ['2026-09 26 8:00']);
check('weekly, marked Tuesday: quiet through Sunday', k.checkReminderTimes(makeCheck({ cadence: 'weekly', lastMarkedAt: new Date(2026, 8, 22, 12).toISOString() }), on, friday, 3).map(iso), ['2026-09 28 8:00']);
check('monthly, marked this month: quiet until October', k.checkReminderTimes(makeCheck({ cadence: 'monthly', lastMarkedAt: new Date(2026, 8, 2).toISOString() }), on, friday, 6).map(iso), ['2026-10 1 8:00']);
check('anytime never speaks', k.checkReminderTimes(makeCheck({ cadence: 'anytime' }), on, friday, 6), []);
check('retired never speaks', k.checkReminderTimes(makeCheck({ active: false }), on, friday, 6), []);
check('off never speaks', k.checkReminderTimes(makeCheck(), { ...on, on: false }, friday, 6), []);
check('a bad time never speaks', k.checkReminderTimes(makeCheck(), { ...on, time: '25:00' }, friday, 6), []);
check('weekdays only skips the weekend', k.checkReminderTimes(makeCheck(), { ...on, days: [1, 2, 3, 4, 5] }, friday, 3).map(iso), ['2026-09 25 8:00', '2026-09 28 8:00']);

// --- Gone by, still outstanding ----------------------------------------------
check('an hour ago is outstanding', k.outstandingSince(new Date(2026, 8, 25, 8, 0), friday) !== null, true);
check('three hours ago is not', k.outstandingSince(new Date(2026, 8, 25, 6, 0), friday), null);
check('later today is not', k.outstandingSince(new Date(2026, 8, 25, 10, 0), friday), null);
check('none is none', k.outstandingSince(null, friday), null);

// --- The words ---------------------------------------------------------------
const said = [
  ...k.KEEP_REMINDING_OPTIONS.map((o) => o.label),
  k.describeKeepReminding(null, true),
  k.describeKeepReminding(null, false),
  k.describeKeepReminding(0, true),
  ...k.KEEP_REMINDING_INTERVALS.map((m) => k.describeKeepReminding(m, false)),
];
check('every interval sentence names a count', k.KEEP_REMINDING_INTERVALS.every((m) => /\d+ more times at most/.test(k.describeKeepReminding(m, false))), true);
const FORBIDDEN = /\b(streak|great job|well done|good job|failed|missed|behind|lazy|should have|real|genuine|genuinely|score|%)\b|[–—]| -- /i;
for (const line of said) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
