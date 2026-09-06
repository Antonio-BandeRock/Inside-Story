// Guards lib/db.ts's schema against the one mistake that keeps recurring:
// a backtick inside a SQL comment.
//
// Built 2026-09-05, after the third occurrence in three days (2026-09-04
// with `treatments`, 2026-09-05 with `direction`, then `kind` an hour
// later). Every CREATE TABLE in this project lives inside a template
// literal passed to db.execAsync, so a backtick used the way it would be
// used in prose to quote an identifier silently TERMINATES the string. The
// file then fails to parse and the whole app fails to build.
//
// tsc does catch it, immediately and every time, which is why it has never
// shipped. But it has cost the same debugging detour three times, and the
// error it produces ("',' expected") points at a line of English prose
// rather than at the real cause, which is what makes it cost minutes
// rather than seconds. A check that names the actual problem is cheaper
// than remembering.
//
// Run with: node scripts/check_schema_sql.js
// Exits non-zero if a SQL comment line contains a backtick.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'lib', 'db.ts');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const offenders = [];
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  // A SQL comment inside the schema: whitespace, then --, then anything.
  // Deliberately narrow. A backtick in an ordinary TypeScript comment (//)
  // is fine and common, and flagging those would make this noise.
  if (/^\s*--/.test(line) && line.includes('`')) {
    offenders.push({ line: i + 1, text: line.trim() });
  }
}

if (offenders.length > 0) {
  console.error('Backtick inside a SQL comment. These live in a template literal, so a backtick ends the string early:');
  for (const offender of offenders) {
    console.error(`  lib/db.ts:${offender.line}  ${offender.text}`);
  }
  console.error('\nUse plain words instead: "the kind column" rather than a quoted identifier.');
  process.exit(1);
}

console.log('Schema SQL comments: no backticks.');

// --- Check 2: an index may not reference a migrated column -----------------
//
// Added 2026-09-06 after exactly this shipped and broke every upgrading
// device. CREATE TABLE IF NOT EXISTS does nothing where the table already
// exists, so a column added by an ALTER TABLE further down the file does not
// exist yet at the point the schema block runs. An index referencing it throws
// "no such column", initializeDatabase never finishes, and the app sits on its
// loading screen. A fresh install is completely fine, which is what makes this
// invisible to whoever wrote it.

const source = fs.readFileSync(FILE, 'utf8');

// Every column each table gains through a migration, from both shapes this
// file uses: the generic [table, column] loop and an individually typed
// ALTER TABLE.
const migratedColumns = new Map();
function noteMigrated(table, column) {
  if (!migratedColumns.has(table)) migratedColumns.set(table, new Set());
  migratedColumns.get(table).add(column);
}
for (const match of source.matchAll(/\[\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*\]/g)) {
  noteMigrated(match[1], match[2]);
}
for (const match of source.matchAll(/ALTER\s+TABLE\s+([a-z_]+)\s+ADD\s+COLUMN\s+([a-z_]+)/gi)) {
  noteMigrated(match[1], match[2]);
}

// Only indexes declared in the schema block itself matter. One created after
// the migrations would be fine, but this file does not do that today.
const indexOffenders = [];
for (let i = 0; i < lines.length; i += 1) {
  const match = lines[i].match(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+\S+\s+ON\s+([a-z_]+)\s*\(([^)]*)\)/i);
  if (!match) continue;
  const table = match[1];
  const columns = match[2].split(',').map((entry) => entry.trim().split(/\s+/)[0]);
  const migrated = migratedColumns.get(table);
  if (!migrated) continue;
  for (const column of columns) {
    if (migrated.has(column)) indexOffenders.push({ line: i + 1, table, column, text: lines[i].trim() });
  }
}

if (indexOffenders.length > 0) {
  console.error('\nIndex on a migrated column. This works on a fresh install and throws on every device that already has the table:');
  for (const offender of indexOffenders) {
    console.error(`  lib/db.ts:${offender.line}  ${offender.text}`);
    console.error(`      ${offender.table}.${offender.column} is added by a migration, so it does not exist when this line runs.`);
  }
  console.error('\nDrop the index, or create it after the migrations rather than in the schema block.');
  process.exit(1);
}

console.log('Schema indexes: none reference a migrated column.');
