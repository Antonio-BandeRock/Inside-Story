// Checks lib/hydrationTarget.ts, water reminders stopping at the target
// (G35): the target counts as reached only from a logged total at or past
// a target above zero, only today's reminders are left out, tomorrow's are
// kept, and every sentence is swept for verdict words, since the lens must
// never call a day's water enough or too little for anybody.
// Run: node scripts/test_hydration_target.js
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
const water = load('lib/hydrationTarget.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|enough|too much|too little|dehydrat\w*|great|well done|congrat\w*|dangerous|diagnos\w*)\b|[–—!]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text), text);
}

// --- Reached -------------------------------------------------------------------
ok('nothing read is not reached', water.waterTargetReached(null) === false);
ok('below target', water.waterTargetReached({ combinedTotal: 1999, target: 2000 }) === false);
ok('at target', water.waterTargetReached({ combinedTotal: 2000, target: 2000 }) === true);
ok('past target', water.waterTargetReached({ combinedTotal: 2600, target: 2000 }) === true);
ok('no target is never reached', water.waterTargetReached({ combinedTotal: 500, target: 0 }) === false);
ok('broken total is not reached', water.waterTargetReached({ combinedTotal: NaN, target: 2000 }) === false);

// --- Which reminders are left out ----------------------------------------------
{
  const now = new Date(2026, 8, 27, 15, 0);
  ok('later today skipped when reached', water.skipHydrationReminder(new Date(2026, 8, 27, 17, 0), now, true) === true);
  ok('earlier today follow-up skipped when reached', water.skipHydrationReminder(new Date(2026, 8, 27, 11, 0), now, true) === true);
  ok('tomorrow kept', water.skipHydrationReminder(new Date(2026, 8, 28, 9, 30), now, true) === false);
  ok('just after midnight kept', water.skipHydrationReminder(new Date(2026, 8, 28, 0, 5), now, true) === false);
  ok('not reached keeps everything', water.skipHydrationReminder(new Date(2026, 8, 27, 17, 0), now, false) === false);
}

// --- The line on the lens ------------------------------------------------------
{
  const reached = water.hydrationReminderLine({ combinedTotal: 2100, target: 2000 }, true);
  const notYet = water.hydrationReminderLine({ combinedTotal: 900, target: 2000 }, true);
  ok('reached says reminders are off', /reminders are off/.test(reached) && /tomorrow/.test(reached), reached);
  ok('not yet says when they stop', /stop/.test(notYet), notYet);
  ok('reminders off, nothing said', water.hydrationReminderLine({ combinedTotal: 2100, target: 2000 }, false) === null);
  ok('no target, nothing said', water.hydrationReminderLine({ combinedTotal: 2100, target: 0 }, true) === null);
  ok('no entry, nothing said', water.hydrationReminderLine(null, true) === null);
  clean('reached line', reached);
  clean('not yet line', notYet);
}

// --- Wired into the sync -------------------------------------------------------
{
  const sync = fs.readFileSync(path.join(__dirname, '..', 'lib', 'reminderNotifications.ts'), 'utf8');
  ok('sync reads the water total', /waterTargetReached\(/.test(sync));
  ok('sync leaves out hydration reminders', /=== 'hydration' && skipHydrationReminder\(/.test(sync));
}

console.log(failures === 0 ? `test_hydration_target: all passed (${swept} sentences swept)` : `test_hydration_target: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
