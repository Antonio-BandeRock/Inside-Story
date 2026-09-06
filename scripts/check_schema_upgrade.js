// Replays the schema against a database built from an OLDER version of itself.
//
// Added 2026-09-06, after 1.0.34.30 shipped a CREATE INDEX referencing a column
// that only exists once a migration has run. On a fresh install the table is
// created WITH the column and everything works. On a phone that already had the
// table, CREATE TABLE IF NOT EXISTS is a no-op, the column is not there yet, and
// the index throws inside initializeDatabase. Nothing downstream finishes, so the
// app sits on its loading screen and cannot even reach Profile to update itself.
//
// THE REASON THIS SCRIPT EXISTS RATHER THAN ANOTHER CODE REVIEW: every existing
// check passed. tsc was clean, eslint was clean, all fifteen suites passed, the
// schema-comment guard passed, and the new columns were verified against a
// scratch database. All of that tested the MIGRATIONS. Nothing tested the schema
// block that runs BEFORE them, against a database that already exists.
//
// A fresh install can never catch this class of bug. Only an upgrade can, so
// this builds one.
//
// Run with: node scripts/check_schema_upgrade.js
// Exits non-zero if the current schema cannot run on top of an older one.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'lib', 'db.ts');

// How many commits back to build the "already installed" database from. Each one
// is a version somebody could plausibly still be upgrading from.
const BASELINES = ['HEAD~1', 'HEAD~3', 'HEAD~6', 'HEAD~12'];

function extractSchema(source) {
  const marker = 'execAsync(`';
  const blocks = [];
  let index = source.indexOf(marker);
  while (index !== -1) {
    const start = index + marker.length;
    let i = start;
    while (i < source.length) {
      if (source[i] === '`' && source[i - 1] !== '\\') break;
      i += 1;
    }
    const body = source.slice(start, i);
    if (/CREATE TABLE IF NOT EXISTS/i.test(body)) blocks.push(body);
    index = source.indexOf(marker, i);
  }
  return blocks.join('\n');
}

function sqlite(dbPath, sql) {
  // The sqlite3 that ships with the Android platform tools, already used
  // elsewhere in this project for scratch verification.
  return execFileSync('sqlite3', [dbPath], { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function gitShow(rev, file) {
  try {
    return execFileSync('git', ['show', `${rev}:${file}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

const currentSchema = extractSchema(fs.readFileSync(DB_FILE, 'utf8'));
if (!currentSchema) {
  console.error('Could not find the schema block in lib/db.ts.');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-upgrade-'));
let failures = 0;
let checked = 0;

for (const baseline of BASELINES) {
  const oldSource = gitShow(baseline, 'lib/db.ts');
  if (!oldSource) continue;
  const oldSchema = extractSchema(oldSource);
  if (!oldSchema) continue;

  checked += 1;
  const dbPath = path.join(tmp, `${baseline.replace(/[^a-z0-9]/gi, '_')}.db`);

  try {
    // Build the database that version would have left behind.
    sqlite(dbPath, oldSchema);
  } catch (error) {
    // An old version failing to build is not this check's problem: it may
    // predate a table, or reference something since removed. Reported rather
    // than counted, so a genuinely broken baseline is still visible.
    console.warn(`  ${baseline}: could not build a baseline database, skipped.`);
    continue;
  }

  try {
    // Now run today's schema on top of it. This is the upgrade.
    sqlite(dbPath, currentSchema);
    console.log(`  ${baseline}: upgrade clean.`);
  } catch (error) {
    failures += 1;
    const message = String(error.stderr || error.message).trim().split('\n').slice(0, 3).join('\n      ');
    console.error(`  ${baseline}: UPGRADE FAILED`);
    console.error(`      ${message}`);
  }
}

if (checked === 0) {
  console.warn('No baselines available (shallow clone?). Nothing checked.');
  process.exit(0);
}

if (failures > 0) {
  console.error(
    '\nThe schema cannot run on top of an older one. A fresh install would be fine and every',
  );
  console.error('phone that already has the app would fail to start.');
  console.error('\nUsual cause: an index or constraint in the schema block referencing a column that');
  console.error('only exists after a migration. The schema block may only use columns from the');
  console.error('table as it was ORIGINALLY shipped.');
  process.exit(1);
}

console.log(`Schema upgrade: clean from ${checked} baseline${checked === 1 ? '' : 's'}.`);
