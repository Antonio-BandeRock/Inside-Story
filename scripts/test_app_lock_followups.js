/* global __dirname */
// Checks the App Lock follow-ups (1.0.60.6, docs/app-lock-spec.md):
//
//  1. Turning the lock off: every state a kill can leave the files in has a
//     safe next step, and the lock file reads the "decrypting" phase (R12).
//  2. The wait after wrong passcodes: five free tries, then 30 seconds,
//     1 minute, 5 minutes and 15 minutes, never anything deleted (R6).
//  3. Reminder words while the lock is set up name only the kind (R9), the
//     morning question keeps its words, full detail is a choice, and the
//     hiding happens before the queue compares what changed.
//  4. Records leaving the phone ask again first (R10), and a recipe share
//     does not.
//
// Run with: node scripts/test_app_lock_followups.js

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const LIB = path.join(ROOT, 'lib');

function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (request === 'tweetnacl') return require('tweetnacl');
    if (request === '@noble/hashes/scrypt') return require('@noble/hashes/scrypt');
    if (request.startsWith('./')) return loadModule(request.slice(2), cache);
    throw new Error(`This harness does not provide ${request}`);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const L = loadModule('appLock');
const W = loadModule('lockedReminderText');

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// 1. Turning the lock off
const plan = (main, partial, before) => L.planUnlockMigration({ main, partial, before }).kind;
check('an encrypted main file is exported', plan('encrypted', false, false) === 'export');
check('a leftover partial copy is exported again', plan('encrypted', true, false) === 'export');
check('a plain main file finishes', plan('plain', false, true) === 'verify-then-finish');
check('a kill mid-swap puts the encrypted file back first', plan('missing', true, true) === 'restore-before');
check('no file at all says so', plan('missing', false, false) === 'no-database');

const base = {
  version: 1,
  phase: 'decrypting',
  passcodeKind: 'digits',
  biometric: false,
  autoLockMinutes: 5,
  allowScreenshots: false,
  kdf: { name: 'scrypt', N: 16384, r: 8, p: 1, salt: 'c2FsdA==' },
  recoveryWrapped: 'd3JhcHBlZA==',
  setUpAt: '2026-10-02T00:00:00.000Z',
};
const decrypting = L.parseLockState(JSON.stringify(base));
check('the decrypting phase reads', decrypting && decrypting.phase === 'decrypting');
check('an older lock file reads with no wrong tries', decrypting.failedTries === 0 && decrypting.lastFailedAt === 0);
check('an older lock file hides reminder detail', decrypting.reminderDetail === 'private');
check('a damaged try count reads as none', L.parseLockState(JSON.stringify({ ...base, failedTries: -3 })).failedTries === 0);
check('full detail is kept only when chosen', L.parseLockState(JSON.stringify({ ...base, reminderDetail: 'full' })).reminderDetail === 'full');
check('anything else hides', L.parseLockState(JSON.stringify({ ...base, reminderDetail: 'loud' })).reminderDetail === 'private');

const device = read('lib/appLockDevice.ts');
const run = device.slice(device.indexOf('export async function runUnlockMigration'), device.indexOf('export async function keepLockOn'));
check('the encrypted file is kept until the plain one opens', run.indexOf('deleteWithSideFiles(UNLOCK_BEFORE_NAME)') > run.indexOf('opensPlain()'));
// Since 1.0.60.7 the last steps live in finishTurningOff, which the phone
// reaches only after the plain file has opened and the desktop after unseal.
const finishOff = device.slice(device.indexOf('async function finishTurningOff'), device.indexOf('export async function runUnlockMigration'));
check('the lock file goes after the plain file opens', run.lastIndexOf('return finishTurningOff(') > run.indexOf('opensPlain()') && finishOff.includes('deleteLockState()'));
check('presses kept while locked are opened before the keys go', finishOff.indexOf('unsealWaitingAnswersForTurnOff(key)') >= 0 && finishOff.indexOf('unsealWaitingAnswersForTurnOff(key)') < finishOff.indexOf('deleteLockState()'));
check('the gate runs the move back on a decrypting start', read('components/AppLockGate.tsx').includes('state.phase === "decrypting"'));

// 2. The wait after wrong passcodes
check('five tries are free', [0, 1, 2, 3, 4].every((n) => L.wrongTryWaitMs(n) === 0));
check('the fifth wrong try waits 30 seconds', L.wrongTryWaitMs(5) === 30_000);
check('then 1 minute', L.wrongTryWaitMs(6) === 60_000);
check('then 5 minutes', L.wrongTryWaitMs(7) === 300_000);
check('then 15 minutes', L.wrongTryWaitMs(8) === 900_000);
check('and 15 minutes from then on', L.wrongTryWaitMs(40) === 900_000);
const t0 = 1_000_000_000;
check('the wait counts down', L.waitRemainingMs(6, t0, t0 + 20_000) === 40_000);
check('the wait ends', L.waitRemainingMs(6, t0, t0 + 61_000) === 0);
check('no wait under five tries', L.waitRemainingMs(4, t0, t0) === 0);
check('a clock set back waits the whole time', L.waitRemainingMs(5, t0, t0 - 3_600_000) === 30_000);
check('30 seconds reads in words', L.waitLabel(30_000) === '30 seconds');
check('a minute reads in words', L.waitLabel(60_000) === '1 minute');
check('part of a minute rounds up', L.waitLabel(61_000) === '2 minutes');
check('fifteen minutes reads in words', L.waitLabel(900_000) === '15 minutes');
check('nothing is wiped after wrong tries', !/deleteLockState\(\)/.test(device.slice(device.indexOf('export async function checkPasscode'), device.indexOf('export function passcodeWaitRemaining'))));
for (const rel of ['components/AppLockGate.tsx', 'components/ConfirmItsYou.tsx']) {
  const src = read(rel);
  check(`${rel} checks passcodes through checkPasscode`, src.includes('checkPasscode(') && !src.includes('unlockWithPasscode('));
}
check('setup no longer checks a passcode its own way', !read('app/app-lock-setup.tsx').includes('unlockWithPasscode('));

// 3. Reminder words
const kinds = ['dose', 'checkin', 'meal', 'hydration', 'appointment', 'refill', 'peerDose', 'recall', 'garden', 'upkeep', 'todo', 'countdown', 'somethingNew'];
const secret = 'Levothyroxine 50 mcg with water';
for (const kind of kinds) {
  const words = W.reminderWords(kind, secret, secret, true);
  check(`${kind}: the hidden title names nothing personal`, !words.title.includes('Levothyroxine') && words.title.length > 0);
  check(`${kind}: the hidden body names nothing personal`, words.body === W.PRIVATE_REMINDER_BODY);
  check(`${kind}: no dashes in the hidden words`, !/[–—]|--/.test(words.title + words.body));
  const full = W.reminderWords(kind, secret, 'body', false);
  check(`${kind}: full detail keeps the words`, full.title === secret && full.body === 'body');
}
const morning = W.reminderWords('morning', 'How did you sleep?', 'Tap a button', true);
check('the morning question keeps its words', morning.title === 'How did you sleep?');
check('a dose reads as a dose', W.privateReminderTitle('dose') === 'Time for your scheduled dose');

const reminders = read('lib/reminderNotifications.ts');
const hideAt = reminders.indexOf('reminderWords(planned.payload.kind');
const compareAt = reminders.indexOf('keptById', hideAt > 0 ? hideAt - 2000 : 0);
check('the reconcile hides words before it compares', hideAt > 0 && compareAt > hideAt);
check('a peer dose reminder hides its words', /reminderWords\(\s*'peerDose'/.test(read('lib/peerDosesDb.ts')));
check('a recall notice hides its words', read('lib/recallsDb.ts').includes("reminderWords('recall'"));
check('changing the setting queues reminders again', read('components/AppLockSettings.tsx').includes('void syncReminderNotifications()'));

// 4. Asking again before records leave the phone
const asks = {
  'app/profile.tsx': ['Before the backup is made', 'Before a backup is restored', 'Before syncing begins'],
  'app/(tabs)/reports.tsx': ['Before the PDF is made', 'Before the report is printed'],
  'components/ReportCsvButtons.tsx': ['Before the file is made'],
  'components/EmergencySection.tsx': ['Before the card is made'],
  'app/pair.tsx': ['Before a new pairing'],
  'app/connect.tsx': ['Before this connection is made'],
};
for (const [rel, reasons] of Object.entries(asks)) {
  const src = read(rel);
  for (const reason of reasons) check(`${rel} asks "${reason}"`, src.includes(`confirmItsYou('${reason}')`));
}
check('a recipe share does not ask', !read('lib/sharing.ts').includes('confirmItsYou'));
check('the question is mounted once', (read('app/_layout.tsx').match(/<FreshAuthHost \/>/g) || []).length === 1);
const fresh = read('lib/freshAuth.ts');
check('without the lock nothing is asked', fresh.includes("return !!state && state.phase === 'on';") && fresh.includes('if (!freshAuthNeeded()) return Promise.resolve(true);'));

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
