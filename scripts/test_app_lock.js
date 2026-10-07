/* global __dirname, Buffer */
// Runs lib/appLock.ts: the rules behind App Lock steps 2 to 4 (setting the
// lock up, moving the database into an encrypted file, unlocking).
//
// What has to hold:
//
//  1. A recovery key round-trips, and reads however it was typed (spaces,
//     dashes, lower case, O for 0, I or L for 1).
//  2. Weak passcodes are refused, with a reason in words.
//  3. A wrapped key opens only with its own wrapping key, and a flipped
//     byte opens to nothing.
//  4. The passcode stretch is the same for the same passcode and salt, and
//     different for a different passcode or salt.
//  5. A damaged or half-written lock file reads as no lock file, never as
//     a lock with missing fields.
//  6. Every state a kill can leave the database files in has a safe next
//     step, and a plain file is never thrown away before the locked one opens.
//  7. Locking again after time away, and the two groups asked back.
//  8. In the source: getDatabase sends the key before anything else, the
//     gate wraps the whole app, and the widget and the reminder task treat
//     a locked database as locked.
//
// Run with: node scripts/test_app_lock.js

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

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}
const random = (n) => new Uint8Array(require('crypto').randomBytes(n));
const same = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

(async () => {
  // 1. Recovery key
  for (let i = 0; i < 50; i += 1) {
    const bytes = random(L.RECOVERY_KEY_BYTES);
    const encoded = L.encodeRecoveryKey(bytes);
    check('recovery key is 32 characters', encoded.length === 32);
    check('recovery key uses no I, L, O or U', !/[ILOU]/.test(encoded));
    check('recovery key round-trips', same(L.decodeRecoveryKey(encoded), bytes));
    const groups = L.recoveryKeyGroups(encoded);
    check('eight groups of four', groups.length === 8 && groups.every((g) => g.length === 4));
    const sloppy = groups.join(' - ').toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l');
    check('typed sloppily still reads', same(L.decodeRecoveryKey(sloppy), bytes));
  }
  check('too short is not a key', L.decodeRecoveryKey('ABCD') === null);
  check('U is not in the alphabet', L.decodeRecoveryKey('U'.repeat(32)) === null);
  check('a group matches with o for 0', L.groupMatches('a0b1', 'A0B1') && L.groupMatches('aob1', 'A0B1'));
  check('a wrong group does not match', !L.groupMatches('A0B2', 'A0B1'));

  // 2. Passcodes
  check('six varied digits are fine', L.passcodeProblem('482915', 'digits') === null);
  check('five digits refused', L.passcodeProblem('48291', 'digits') !== null);
  check('thirteen digits refused', L.passcodeProblem('4829154829154', 'digits') !== null);
  check('letters refused as digits', L.passcodeProblem('48291a', 'digits') !== null);
  check('one digit repeated refused', L.passcodeProblem('777777', 'digits') !== null);
  check('a run up refused', L.passcodeProblem('123456', 'digits') !== null);
  check('a run down refused', L.passcodeProblem('987654', 'digits') !== null);
  check('a run through zero refused', L.passcodeProblem('7890123', 'digits') !== null);
  check('a short phrase refused', L.passcodeProblem('short', 'phrase') !== null);
  check('a long phrase is fine', L.passcodeProblem('blue kettle morning', 'phrase') === null);

  // 3. Wrapping
  const dataKey = random(L.DATA_KEY_BYTES);
  const wrapping = random(L.DATA_KEY_BYTES);
  const wrapped = L.wrapKey(dataKey, wrapping, random(L.WRAP_NONCE_BYTES));
  check('unwraps with its own key', same(L.unwrapKey(wrapped, wrapping), dataKey));
  check('the wrong key opens nothing', L.unwrapKey(wrapped, random(L.DATA_KEY_BYTES)) === null);
  const bytes = Buffer.from(wrapped, 'base64');
  bytes[30] ^= 1;
  check('a flipped byte opens nothing', L.unwrapKey(bytes.toString('base64'), wrapping) === null);
  check('nothing stored opens nothing', L.unwrapKey(null, wrapping) === null);
  check('a cut copy opens nothing', L.unwrapKey(wrapped.slice(0, 20), wrapping) === null);
  check('key base64 round-trips', same(L.keyFromBase64(L.keyToBase64(dataKey)), dataKey));
  check('a short base64 is not a key', L.keyFromBase64('AAAA') === null);
  const recovery = random(L.RECOVERY_KEY_BYTES);
  const rw = L.recoveryWrappingKey(recovery);
  check('recovery wrapping key is 32 bytes', rw.length === 32);
  check('recovery wrapping key is stable', same(rw, L.recoveryWrappingKey(recovery)));
  check('recovery wrapping key is not the recovery key', !same(rw.slice(0, 20), recovery));

  // 4. Passcode stretch (small N here to keep the test quick)
  const kdf = { name: 'scrypt', N: 2 ** 10, r: 8, p: 1, salt: Buffer.from(random(16)).toString('base64') };
  const k1 = await L.passcodeWrappingKey('482915', kdf);
  const k2 = await L.passcodeWrappingKey('482915', kdf);
  const k3 = await L.passcodeWrappingKey('482916', kdf);
  const k4 = await L.passcodeWrappingKey('482915', { ...kdf, salt: Buffer.from(random(16)).toString('base64') });
  check('same passcode and salt stretch the same', same(k1, k2));
  check('another passcode stretches differently', !same(k1, k3));
  check('another salt stretches differently', !same(k1, k4));
  const nfd = await L.passcodeWrappingKey('café blue sky', kdf);
  const nfc = await L.passcodeWrappingKey('café blue sky', kdf);
  check('the same phrase from two keyboards stretches the same', same(nfd, nfc));
  check('default stretch is scrypt at 2^12', L.DEFAULT_KDF.N === 4096 && L.DEFAULT_KDF.r === 8);

  // 5. Lock file
  const good = {
    version: 1,
    phase: 'on',
    passcodeKind: 'digits',
    biometric: true,
    autoLockMinutes: 5,
    allowScreenshots: false,
    kdf,
    recoveryWrapped: wrapped,
    setUpAt: '2026-10-02T00:00:00.000Z',
    answerBoxPublicKey: 'cHVibGljIGtleQ==',
    failedTries: 0,
    lastFailedAt: 0,
    reminderDetail: 'kind',
    vault: true,
  };
  const parsed = L.parseLockState(L.serializeLockState(good));
  check('a lock file round-trips', JSON.stringify(parsed) === JSON.stringify(good));
  check('no file is no lock', L.parseLockState(null) === null);
  check('a half-written file is no lock', L.parseLockState('{"version":1,"pha') === null);
  check('an unknown version is no lock', L.parseLockState(JSON.stringify({ ...good, version: 2 })) === null);
  check('an unknown phase is no lock', L.parseLockState(JSON.stringify({ ...good, phase: 'maybe' })) === null);
  check('no recovery copy is no lock', L.parseLockState(JSON.stringify({ ...good, recoveryWrapped: '' })) === null);
  check('no salt is no lock', L.parseLockState(JSON.stringify({ ...good, kdf: { ...kdf, salt: undefined } })) === null);
  const older = { ...good };
  delete older.answerBoxPublicKey;
  check('a lock file from before answers were kept reads with no answer key', L.parseLockState(JSON.stringify(older)).answerBoxPublicKey === null);
  check(
    'an unknown auto-lock time falls back to the default',
    L.parseLockState(JSON.stringify({ ...good, autoLockMinutes: 7 })).autoLockMinutes === L.DEFAULT_AUTO_LOCK_MINUTES,
  );

  // 5b. Reminders answered while locked
  {
    const dataKey = random(L.DATA_KEY_BYTES);
    const pair = L.answerBoxKeyPair(dataKey);
    check('the answer key pair is stable for one data key', same(pair.publicKey, L.answerBoxKeyPair(dataKey).publicKey));
    check('another data key gives another pair', !same(pair.publicKey, L.answerBoxKeyPair(random(L.DATA_KEY_BYTES)).publicKey));
    const message = JSON.stringify({ identifier: 'reminder:abc', actionIdentifier: 'done', pressedAt: '2026-10-03T07:00:00.000Z' });
    const sealed = L.sealForUnlock(message, pair.publicKey, random(32), random(24));
    check('a sealed press opens with the data key', L.openSealedForUnlock(sealed, dataKey) === message);
    check('a sealed press does not show what it says', !sealed.includes('reminder') && !Buffer.from(sealed, 'base64').toString('latin1').includes('reminder'));
    check('the wrong data key opens nothing', L.openSealedForUnlock(sealed, random(L.DATA_KEY_BYTES)) === null);
    const bytes = Buffer.from(sealed, 'base64');
    bytes[bytes.length - 1] ^= 1;
    check('a flipped byte opens nothing', L.openSealedForUnlock(bytes.toString('base64'), dataKey) === null);
    check('a cut line opens nothing', L.openSealedForUnlock(sealed.slice(0, 40), dataKey) === null);
    check('garbage opens nothing', L.openSealedForUnlock('not base64 at all!!', dataKey) === null);
    const twice = L.sealForUnlock(message, pair.publicKey, random(32), random(24));
    check('the same press sealed twice reads differently', twice !== sealed);
  }

  // 6. Moving the database
  const header = new Uint8Array(16);
  'SQLite format 3\u0000'.split('').forEach((c, i) => (header[i] = c.charCodeAt(0)));
  check('a SQLite header reads plain', L.fileKindFromHeader(true, header) === 'plain');
  check('random bytes read encrypted', L.fileKindFromHeader(true, random(16)) === 'encrypted');
  check('no file reads missing', L.fileKindFromHeader(false, null) === 'missing');
  const plan = (main, partial, before) => L.planMigration({ main, partial, before }).kind;
  check('fresh plain file exports', plan('plain', false, false) === 'export');
  check('a leftover partial file exports again', plan('plain', true, false) === 'export');
  check('plain main with an old before file exports', plan('plain', false, true) === 'export');
  check('killed between the renames puts the plain one back', plan('missing', true, true) === 'restore-before');
  check('killed after the swap checks and finishes', plan('encrypted', false, true) === 'verify-then-finish');
  check('finished swap with nothing set aside checks and finishes', plan('encrypted', false, false) === 'verify-then-finish');
  check('no database at all just turns on', plan('missing', false, false) === 'no-database');
  check(
    'row counts compared by table',
    JSON.stringify(
      L.countMismatches(
        [
          { table: 'meals', rows: 4 },
          { table: 'labs', rows: 2 },
        ],
        [
          { table: 'meals', rows: 4 },
          { table: 'labs', rows: 1 },
        ],
      ),
    ) === '["labs"]',
  );
  check('a table missing from the copy is a mismatch', L.countMismatches([{ table: 'x', rows: 0 }], []).length === 1);
  check('identifiers are quoted', L.quoteIdentifier('a"b') === '"a""b"');
  const pragma = L.keyPragma(dataKey);
  check('the key pragma is a raw hex key', /^PRAGMA key = "x'[0-9a-f]{64}'";$/.test(pragma));
  check('the key pragma can name a schema', L.keyPragma(dataKey, 'locked').startsWith('PRAGMA locked.key'));

  // 7. Locking again, and the groups asked back
  const now = 1_000_000_000;
  check('never away does not lock', !L.shouldLockOnReturn(null, now, 1));
  check('right away locks on any return', L.shouldLockOnReturn(now, now, 0));
  check('under a minute does not lock at 1', !L.shouldLockOnReturn(now - 59_000, now, 1));
  check('a minute locks at 1', L.shouldLockOnReturn(now - 60_000, now, 1));
  check('a clock gone backwards locks', L.shouldLockOnReturn(now + 5_000, now, 15));
  check('labels', L.autoLockLabel(0) === 'Right Away' && L.autoLockLabel(1) === '1 Minute' && L.autoLockLabel(15) === '15 Minutes');
  for (let i = 0; i < 500; i += 1) {
    const [a, b] = L.groupsToConfirm(8, Math.random(), Math.random());
    if (!(a >= 1 && b <= 8 && a < b)) {
      check(`groups ${a} and ${b} are two different groups in order`, false);
      break;
    }
  }
  check('edge picks stay in range', JSON.stringify(L.groupsToConfirm(8, 0.9999, 0.9999)) === '[7,8]');
  check('a cancelled prompt reads as cancelled', L.isBiometricCancel(new Error('User canceled the authentication')));

  // 8. Source checks
  const db = fs.readFileSync(path.join(LIB, 'db.ts'), 'utf8');
  const open = db.indexOf('const key = dataKeyForOpening();');
  const pragmaAt = db.indexOf('if (key) await db.execAsync(keyPragma(key));');
  const busy = db.indexOf('busy_timeout', pragmaAt);
  check('getDatabase asks for the key before opening', open > 0 && pragmaAt > open);
  check('the key goes before busy_timeout', pragmaAt > 0 && busy > pragmaAt);
  const layout = fs.readFileSync(path.join(ROOT, 'app', '_layout.tsx'), 'utf8');
  check('the gate wraps the whole app', /<AppLockGate>\s*<UnlockedApp \/>\s*<\/AppLockGate>/.test(layout));
  check('the gate is the default export', /export default function RootLayout\(\) \{\s*return \(\s*<AppLockGate>/.test(layout));
  const widget = fs.readFileSync(path.join(LIB, 'widgetData.ts'), 'utf8');
  check('the widget shows locked', widget.includes('if (isLockedNow()) return LOCKED_CONTENT;'));
  check('the widget catch knows locked', widget.includes('if (isAppLockedError(error)) return LOCKED_CONTENT;'));
  const task = fs.readFileSync(path.join(LIB, 'reminderBackgroundTask.ts'), 'utf8');
  check('the reminder task is quiet when locked', task.includes('if (isAppLockedError(answerError)) return;'));
  const reminders = fs.readFileSync(path.join(LIB, 'reminderNotifications.ts'), 'utf8');
  const lockedAt = reminders.indexOf('if (isLockedNow()) {');
  const claimAt = reminders.indexOf('if (!(await claimAnswer(responseKey(response))))');
  check('a locked press is kept before anything opens the database', lockedAt > 0 && claimAt > lockedAt);
  const drainAt = reminders.indexOf('// Presses kept while locked go in first');
  const lastAt = reminders.indexOf('.then(() => Notifications.getLastNotificationResponseAsync())');
  check('kept presses are written before the last press is read', drainAt > 0 && lastAt > drainAt);
  check('a kept press is written with the time it was pressed', reminders.includes('new Date(answer.pressedAt)'));
  check('the setup gives the lock file its answer key', fs.readFileSync(path.join(LIB, 'appLockDevice.ts'), 'utf8').includes('answerBoxPublicKey: bytesToBase64Fast(answerBoxKeyPair(dataKey).publicKey)'));
  const device = fs.readFileSync(path.join(LIB, 'appLockDevice.ts'), 'utf8');
  check('the move keeps the plain file until the locked one opens', device.indexOf('deleteWithSideFiles(BEFORE_NAME)') > device.indexOf('opensWithKey(key)'));
  check('the bare key item is deleted after the move', device.includes('await SecureStore.deleteItemAsync(MIGRATION_ITEM);'));

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
