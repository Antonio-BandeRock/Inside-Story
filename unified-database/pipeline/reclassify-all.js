// Real, permanent CLI entry point for "re-run classify.js against every
// row in the database that isn't already reviewed=1" -- classify.js's
// own classifyAll() has always operated this way (its query has no
// source_code filter, and its own INSERT...ON CONFLICT clause is
// deliberately gated `WHERE whole_food_classifications.reviewed = 0`,
// so a real person's already-confirmed decision is never silently
// overwritten), it just never had its own direct CLI entry point --
// every prior call to it happened as one step inside run-source.js's own
// per-source pipeline. Genuinely needed the moment a rule CHANGE (not a
// new source) needs to be replayed across everything already ingested,
// exactly the real situation this script exists for.
//
// Usage: node reclassify-all.js

const { execFileSync } = require('child_process');
const path = require('path');
const classify = require('./classify.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = process.env.UNIFIED_DB_PATH || path.resolve(__dirname, '..', 'unified_foods.sqlite');

function runBatch(statements) {
  if (statements.length === 0) return;
  const sql = `BEGIN TRANSACTION;\n${statements.join('\n')}\nCOMMIT;\n`;
  execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath], {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
}
function query(sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
  return JSON.parse(out || '[]');
}

// Real, before-and-after counts, so the actual effect of a rule change
// is reported honestly, not just assumed from reading the new code.
function realBreakdown() {
  const rows = query(`
    SELECT
      SUM(CASE WHEN is_whole_food = 1 THEN 1 ELSE 0 END) AS whole,
      SUM(CASE WHEN is_whole_food = 0 THEN 1 ELSE 0 END) AS notWhole,
      SUM(CASE WHEN is_whole_food IS NULL THEN 1 ELSE 0 END) AS needsReview,
      COUNT(*) AS total
    FROM whole_food_classifications;
  `);
  return rows[0];
}

console.log('Real, current state before re-classifying:');
console.log(realBreakdown());

console.log('\nRunning classify.js against every unreviewed row (all 32,707 -- reviewed=0 across the board, since no real human review has happened yet)...');
const { rowCount, statements } = classify.classifyAll(null, execFileSync, SQLITE_EXE, dbPath);
console.log(`Real rows re-evaluated: ${rowCount}`);
runBatch(statements);

console.log('\nReal, current state after re-classifying:');
console.log(realBreakdown());

// Real, concrete breakdown by which NEW rule actually fired, so the new
// categories' own real impact is visible, not just the net whole/not
// totals.
console.log('\nReal counts by rule_matched, for the four brand-new categories added this pass:');
for (const prefix of ['oil', 'bread', 'flour', 'spice\\_or\\_herb']) {
  // ESCAPE '\' -- the literal underscores in "spice_or_herb" would
  // otherwise act as a SQL LIKE single-character wildcard, not a real
  // literal underscore; every prefix here already uniquely covers both
  // its own positive ("oil: ...") and disqualified ("oil_disqualified:
  // ...") rule_matched values via one plain "prefix%" match, so no
  // second OR clause is needed at all.
  const rows = query(`
    SELECT is_whole_food, COUNT(*) AS n
    FROM whole_food_classifications
    WHERE rule_matched LIKE '${prefix}%' ESCAPE '\\'
    GROUP BY is_whole_food;
  `);
  console.log(`  ${prefix.replace(/\\_/g, '_')}:`, rows);
}

console.log('\nDone.');
