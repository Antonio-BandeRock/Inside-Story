/* global __dirname */
// Runs the vault (lib/vault.ts, lib/vaultState.ts and the read guard in
// lib/databaseActivity.ts).
//
// What has to hold:
//
//  1. A read naming a vault table, quoted or bare, in any case, is seen;
//     a name inside a string value or a comment is not, and a longer name
//     that only starts with a vault table's name is not.
//  2. Only reads are refused: a PRAGMA, an INSERT, an UPDATE, a CREATE is
//     never stopped by the vault.
//  3. Off, open, or inside startup work, nothing is refused; on and closed,
//     a vault read is refused with VaultClosedError naming its categories.
//  4. The wrapped connection refuses vault reads on getAllAsync and
//     getFirstAsync, lets everything else through, and unguardedGetAll
//     reads past it for a backup.
//  5. Every vault table exists in lib/db.ts, the emergency card's tables
//     are never in the vault, and no table is in two categories.
//  6. In the source: the backup reads through unguardedGetAll, database
//     startup runs inside withVaultBypass, and the root layout closes the
//     vault when the app is put away.
//
// Run with: node scripts/test_vault.js

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const LIB = path.join(ROOT, 'lib');

// A lock file the stand-in for expo-file-system hands back.
let lockFileText = null;
const fakeFileSystem = {
  Paths: { document: 'doc' },
  File: class {
    constructor() {
      this.exists = lockFileText !== null;
    }
    textSync() {
      return lockFileText;
    }
  },
};

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
    if (request === 'expo-file-system') return fakeFileSystem;
    if (request === 'tweetnacl') return require('tweetnacl');
    if (request === '@noble/hashes/scrypt') return require('@noble/hashes/scrypt');
    if (request.startsWith('./')) return loadModule(request.slice(2), cache);
    throw new Error(`This harness does not provide ${request}`);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

const cache = new Map();
const V = loadModule('vault', cache);
const S = loadModule('vaultState', cache);
const A = loadModule('databaseActivity', cache);

// 1. Seeing a vault table.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
check('a bare name is seen', same(V.vaultTablesIn('SELECT * FROM lab_results WHERE id = ?'), ['lab_results']));
check('a quoted name is seen', same(V.vaultTablesIn('SELECT * FROM "lab_results"'), ['lab_results']));
check('any case is seen', same(V.vaultTablesIn('select * from Lab_Results'), ['lab_results']));
check('a join names both', same(V.vaultTablesIn('SELECT * FROM wellbeing_checkins c JOIN checkin_tags t ON t.checkin_id = c.id'), ['wellbeing_checkins', 'checkin_tags']));
check('a name in a string value is not a table', V.vaultTablesIn("SELECT * FROM meals WHERE note = 'lab_results'").length === 0);
check('a quote doubled inside a value is handled', V.vaultTablesIn("SELECT * FROM meals WHERE note = 'it''s lab_results'").length === 0);
check('a name in a line comment is not a table', V.vaultTablesIn('SELECT * FROM meals -- lab_results\nWHERE 1').length === 0);
check('a name in a block comment is not a table', V.vaultTablesIn('SELECT * FROM meals /* lab_results */').length === 0);
check('a longer name is not the vault table', V.vaultTablesIn('SELECT * FROM lab_results_archive').length === 0);
check('a name ending the same is not the vault table', V.vaultTablesIn('SELECT * FROM old_lab_results').length === 0);
check('a column named alike is not the table', V.vaultTablesIn('SELECT cycle_days_count FROM meals').length === 0);

// 2. Only reads.
check('SELECT is a read', V.isReadStatement('  SELECT 1'));
check('WITH is a read', V.isReadStatement('WITH x AS (SELECT 1) SELECT * FROM x'));
check('a read after a comment is a read', V.isReadStatement('-- note\nSELECT * FROM lab_results'));
check('a PRAGMA is not a read', !V.isReadStatement('PRAGMA table_info("lab_results")'));
check('an INSERT is not a read', !V.isReadStatement('INSERT INTO lab_results (id) VALUES (?)'));
check('an UPDATE is not a read', !V.isReadStatement('UPDATE lab_results SET value = 1'));
check('a CREATE is not a read', !V.isReadStatement('CREATE TABLE IF NOT EXISTS lab_results (id TEXT)'));
check('a write names no categories', V.vaultCategoriesRead('DELETE FROM lab_results WHERE id = ?').length === 0);
check('categories are named once each', same(V.vaultCategoriesRead('SELECT * FROM lab_results JOIN own_lab_tests ON 1 JOIN cycle_days ON 1'), ['labs', 'cycle']));

// 3. When a read is refused.
const read = 'SELECT * FROM lab_results';
check('off refuses nothing', V.vaultRefusal(read, false, false) === null);
check('open refuses nothing', V.vaultRefusal(read, true, true) === null);
check('on and closed refuses a vault read', V.vaultRefusal(read, true, false) instanceof V.VaultClosedError);
check('on and closed lets an ordinary read through', V.vaultRefusal('SELECT * FROM meals', true, false) === null);
check('the refusal names its category', same(V.vaultRefusal(read, true, false).categories, ['labs']));
check('the refusal is recognised by name too', V.isVaultClosedError(Object.assign(new Error('x'), { name: 'VaultClosedError' })));
check('another error is not the vault', !V.isVaultClosedError(new Error('no such table')));

const baseLock = {
  version: 1,
  phase: 'on',
  passcodeKind: 'digits',
  biometric: false,
  autoLockMinutes: 5,
  allowScreenshots: false,
  kdf: { name: 'scrypt', N: 16384, r: 8, p: 1, salt: 'c2FsdA==' },
  recoveryWrapped: 'd3JhcHBlZA==',
  setUpAt: '',
  answerBoxPublicKey: null,
  failedTries: 0,
  lastFailedAt: 0,
  reminderDetail: 'full',
};

lockFileText = null;
S.refreshVaultOn();
check('no lock file, no vault', !S.isVaultOn() && S.vaultRefusalNow(read) === null);

lockFileText = JSON.stringify({ ...baseLock, vault: false });
S.refreshVaultOn();
check('lock on, vault off', !S.isVaultOn());

lockFileText = JSON.stringify({ ...baseLock, vault: true, phase: 'encrypting' });
S.refreshVaultOn();
check('a lock still being set up has no vault', !S.isVaultOn());

lockFileText = JSON.stringify(baseLock);
S.refreshVaultOn();
check('a lock file from before the vault reads as vault off', !S.isVaultOn());

lockFileText = JSON.stringify({ ...baseLock, vault: true });
S.refreshVaultOn();
check('lock on, vault on', S.isVaultOn() && S.isVaultClosed());
check('closed refuses a vault read', S.vaultRefusalNow(read) instanceof V.VaultClosedError);
let heard = 0;
const stop = S.subscribeVault(() => {
  heard += 1;
});
S.setVaultOpen(true);
check('opening is heard', heard === 1);
check('open refuses nothing', S.vaultRefusalNow(read) === null && !S.isVaultClosed());
S.setVaultOpen(true);
check('opening twice is heard once', heard === 1);
S.setVaultOpen(false);
stop();
check('closed again refuses', S.vaultRefusalNow(read) instanceof V.VaultClosedError);

(async () => {
  let insideBypass = null;
  await S.withVaultBypass(async () => {
    insideBypass = S.vaultRefusalNow(read);
  });
  check('startup work reads past the vault', insideBypass === null);
  check('and the vault is closed again after it', S.vaultRefusalNow(read) instanceof V.VaultClosedError);
  try {
    await S.withVaultBypass(async () => {
      throw new Error('boom');
    });
  } catch {
    // expected
  }
  check('a failing startup step does not leave the vault open', S.vaultRefusalNow(read) instanceof V.VaultClosedError);

  // 4. The wrapped connection.
  const ran = [];
  const db = A.attachWriteTracking({
    async runAsync(sql) {
      ran.push(sql);
      return { changes: 1 };
    },
    async execAsync(sql) {
      ran.push(sql);
    },
    async getAllAsync(sql) {
      ran.push(sql);
      return [{ ok: 1 }];
    },
    async getFirstAsync(sql) {
      ran.push(sql);
      return { ok: 1 };
    },
  });
  const refused = async (work) => {
    try {
      await work();
      return false;
    } catch (error) {
      return V.isVaultClosedError(error);
    }
  };
  check('getAllAsync refuses a vault read', await refused(() => db.getAllAsync(read)));
  check('getFirstAsync refuses a vault read', await refused(() => db.getFirstAsync('SELECT COUNT(*) FROM "cycle_days"')));
  check('a refused read never reaches the database', !ran.includes(read));
  check('an ordinary read goes through', (await db.getAllAsync('SELECT * FROM meals')).length === 1);
  check('a write to a vault table goes through', !(await refused(() => db.runAsync('INSERT INTO lab_results (id) VALUES (?)', 'a'))));
  check('a PRAGMA on a vault table goes through', !(await refused(() => db.getAllAsync('PRAGMA table_info("lab_results")'))));
  check('a backup reads past the vault', (await A.unguardedGetAll(db, 'SELECT * FROM "lab_results"')).length === 1);
  S.setVaultOpen(true);
  check('open, the wrapped read goes through', (await db.getAllAsync(read)).length === 1);
  S.setVaultOpen(false);

  // 5. The table list against the schema.
  const dbSource = fs.readFileSync(path.join(LIB, 'db.ts'), 'utf8');
  for (const table of V.ALL_VAULT_TABLES) {
    check(`${table} is a table in lib/db.ts`, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`).test(dbSource));
  }
  check('no table is in two categories', new Set(V.ALL_VAULT_TABLES).size === V.ALL_VAULT_TABLES.length);
  check('every category has a label', Object.keys(V.VAULT_TABLES).every((k) => typeof V.VAULT_CATEGORY_LABELS[k] === 'string'));
  check('the emergency card is never in the vault', V.ALL_VAULT_TABLES.every((t) => !t.startsWith('emergency')));
  check('app_meta is never in the vault', !V.ALL_VAULT_TABLES.includes('app_meta'));

  // 6. In the source.
  const backup = fs.readFileSync(path.join(LIB, 'dataBackup.ts'), 'utf8');
  check('the backup reads through unguardedGetAll', backup.includes('await unguardedGetAll<Record<string, unknown>>(db, `SELECT * FROM "${name}"`)'));
  check('database startup runs inside withVaultBypass', /withVaultBypass\(runDatabaseInitialization\)/.test(dbSource));
  const layout = fs.readFileSync(path.join(ROOT, 'app', '_layout.tsx'), 'utf8');
  check('the root layout closes the vault when the app is put away', layout.includes('watchVaultClosing()'));
  const lockDevice = fs.readFileSync(path.join(LIB, 'appLockDevice.ts'), 'utf8');
  check('writing the lock file refreshes the vault switch', /serializeLockState\(state\)\);\s*refreshVaultOn\(\);/.test(lockDevice));

  console.log(`${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
