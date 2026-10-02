// Checks the 2026-10-02 "database is locked" fix: every in-place restart
// goes through lib/restartApp.ts, which closes both database connections
// before Updates.reloadAsync(); the main connection waits on a lock rather
// than failing at once; and the startup failure screen says to close the
// app completely when the error is a lock, since an update cannot clear it.
// Run: node scripts/test_restart_closes_db.js
const fs = require('fs');
/* global __dirname */
const path = require('path');

const root = path.join(__dirname, '..');
let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

function walk(dir, out) {
  for (const name of fs.readdirSync(path.join(root, dir))) {
    const rel = path.join(dir, name);
    const stat = fs.statSync(path.join(root, rel));
    if (stat.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(rel);
  }
  return out;
}

// No direct reload anywhere but the helper. Comments are stripped first.
const files = ['app', 'components', 'lib', 'hooks', 'constants'].flatMap((d) => walk(d, []));
const direct = [];
for (const file of files) {
  const code = fs.readFileSync(path.join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  if (/\.reloadAsync\s*\(/.test(code) && file.split(path.sep).join('/') !== 'lib/restartApp.ts') direct.push(file);
}
ok('only lib/restartApp.ts calls reloadAsync', direct.length === 0, direct.join(', '));

const helper = fs.readFileSync(path.join(root, 'lib/restartApp.ts'), 'utf8');
ok('helper closes before reloading', /await closeDatabasesForRestart\(\);\s*await Updates\.reloadAsync\(\);/.test(helper));

const db = fs.readFileSync(path.join(root, 'lib/db.ts'), 'utf8');
ok('busy_timeout set before write tracking', /openDatabaseAsync\(DB_NAME\)\.then\(async \(db\) => \{[\s\S]{0,600}PRAGMA busy_timeout = 5000;[\s\S]{0,200}return attachWriteTracking\(db\);/.test(db));
const close = db.match(/export async function closeDatabasesForRestart\(\)[\s\S]*?\n\}/);
ok('closeDatabasesForRestart exists', !!close);
if (close) {
  ok('both connections closed', /databasePromise, referenceDatabasePromise/.test(close[0]) && /closeAsync\(\)/.test(close[0]));
  ok('promises cleared so the next call reopens', /databasePromise = null;/.test(close[0]) && /referenceDatabasePromise = null;/.test(close[0]) && /initializeDatabasePromise = null;/.test(close[0]));
  ok('a stuck close cannot hold the restart', /setTimeout\(resolve, 3000\)/.test(close[0]));
}

const screen = fs.readFileSync(path.join(root, 'components/StartupFailureScreen.tsx'), 'utf8');
ok('screen recognises a lock', /errorText\.includes\('database is locked'\)/.test(screen));
ok('screen says to close the app completely', /Close the app completely/.test(screen));

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('restart closes db: all checks passed');
