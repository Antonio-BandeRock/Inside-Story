// Checks how lib/reminderNotifications.ts decides a pending reminder is still
// right (2026-09-28). Every body ends with an "as of" stamp carrying the
// minute the reconcile ran, and comparing whole bodies rescheduled every
// reminder at each app open or close, which showed as lag between screens.
//
// The rules checked:
//
//  1. withoutFreshness takes out each stamp shape the module writes: a time
//     alone, and a month, day and time.
//  2. Two bodies that differ only in the stamp compare equal; a body whose
//     other wording changed does not.
//  3. The reconcile compares through withoutFreshness.
//  4. A call made during a run queues one more run rather than sharing the
//     run already going.
//
// Run with: node scripts/test_reminder_freshness_compare.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'reminderNotifications.ts'), 'utf8');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

const match = source.match(/const FRESHNESS_STAMP = (\/.+\/g);/);
check('the stamp pattern is there', Boolean(match));
const pattern = match ? eval(match[1]) : /$^/g;
const withoutFreshness = (body) => (body ?? '').replace(pattern, ' as of.');

// 1 and 2.
const cases = [
  ['Due 8:00 AM. Tap Taken. Schedule as of 5:42 PM.', 'Due 8:00 AM. Tap Taken. Schedule as of 5:43 PM.'],
  ['Due Oct 1. Records as of Sep 28, 5:42 PM.', 'Due Oct 1. Records as of Sep 29, 9:05 AM.'],
  ['Tap to walk it. Routines as of 11:59 PM.', 'Tap to walk it. Routines as of Sep 28, 12:00 AM.'],
  ['Answer here. Did I Do It as of 7:07 AM.', 'Answer here. Did I Do It as of 7:08 AM.'],
  ['The daily check-in. Check-ins as of 10:00 AM.', 'The daily check-in. Check-ins as of 10:30 AM.'],
  ['About 2 hours since you ate. Meals as of 1:15 PM.', 'About 2 hours since you ate. Meals as of 1:16 PM.'],
];
for (const [a, b] of cases) {
  check(`same apart from the stamp: ${a}`, withoutFreshness(a) === withoutFreshness(b));
  check(`the stamp is gone: ${a}`, !/\d:\d\d [AP]M\.$/.test(withoutFreshness(a)));
}
check('other wording still counts', withoutFreshness('Due 8:00 AM. Schedule as of 5:42 PM.') !== withoutFreshness('Due 9:00 AM. Schedule as of 5:42 PM.'));
check('a time inside the wording is kept', withoutFreshness('Due 8:00 AM. Schedule as of 5:42 PM.').includes('8:00 AM'));
check('no body reads as empty', withoutFreshness(undefined) === '' && withoutFreshness(null) === '');
check('a body with no stamp is unchanged', withoutFreshness('This month in the garden.') === 'This month in the garden.');

// Every stamp the module writes has a shape the pattern takes out.
const stampLeads = source.match(/[A-Za-z' -]+ as of \$\{describeFreshness\(/g) || [];
check('stamps found in the module', stampLeads.length >= 7);

// 3.
check('the reconcile compares through withoutFreshness',
  source.includes('withoutFreshness(request.content.body) === withoutFreshness(want.body)'));
check('no whole-body comparison left', !source.includes('request.content.body === want.body'));

// 4.
check('a call during a run queues one more', /if \(inFlight\) \{\s*if \(!queued\)/.test(source)
  && source.includes('queued = inFlight.then('));

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
