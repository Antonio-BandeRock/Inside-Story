// Creates a fresh copy of the master unified database from schema.sql.
// Idempotent by design: refuses to overwrite an existing database unless
// --force is passed, so re-running this by habit can never silently wipe
// real ingested data. This uses sqlite3.exe directly (the same tool
// already established throughout this project as the way to work with
// SQLite in this environment) rather than a Node SQLite binding, so it
// has zero new dependencies to install.
//
// Usage: node init-db.js [path-to-db] [--force]
// Default path: unified-database/unified_foods.sqlite

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';

const args = process.argv.slice(2);
const force = args.includes('--force');
const dbPathArg = args.find((a) => !a.startsWith('--'));
const dbPath = path.resolve(
  __dirname,
  '..',
  dbPathArg || 'unified_foods.sqlite'
);
const schemaPath = path.resolve(__dirname, '..', 'schema.sql');

if (fs.existsSync(dbPath) && !force) {
  console.error(
    `Refusing to overwrite an existing database at ${dbPath}. Pass --force if you really mean to start over (this destroys any real ingested/classified/matched data already in it).`
  );
  process.exit(1);
}

if (fs.existsSync(dbPath) && force) {
  fs.unlinkSync(dbPath);
  console.log(`--force given: removed existing ${dbPath}`);
}

if (!fs.existsSync(schemaPath)) {
  console.error(`schema.sql not found at ${schemaPath}`);
  process.exit(1);
}

execFileSync(SQLITE_EXE, [dbPath], {
  input: fs.readFileSync(schemaPath, 'utf8'),
  stdio: ['pipe', 'inherit', 'inherit'],
});

// Sanity check: confirm every table actually exists, not just that
// sqlite3 exited cleanly.
const expectedTables = [
  'sources',
  'raw_foods',
  'raw_food_nutrients',
  'whole_food_classifications',
  'food_match_groups',
  'food_match_members',
];
const actualTablesRaw = execFileSync(
  SQLITE_EXE,
  [dbPath, "SELECT name FROM sqlite_master WHERE type='table';"],
  { encoding: 'utf8' }
);
const actualTables = actualTablesRaw
  .split(/\r?\n/)
  .map((t) => t.trim())
  .filter(Boolean);
const missing = expectedTables.filter((t) => !actualTables.includes(t));

if (missing.length > 0) {
  console.error('Schema did not apply correctly. Missing tables:', missing);
  process.exit(1);
}

console.log(`Created ${dbPath}`);
console.log('Real tables confirmed present:', actualTables.join(', '));
