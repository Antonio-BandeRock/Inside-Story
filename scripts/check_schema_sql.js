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
