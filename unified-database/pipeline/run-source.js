// The real, permanent way to run any source adapter through the full
// pipeline -- ingest, then classify whatever's new, then re-run the
// matching cascade over the whole current whole-food pool (not just
// this source's own rows, since a newly-ingested source might complete
// a real cross-source match with something already sitting in the
// database from an earlier run).
//
// Usage: node run-source.js <adapter-file>
// Example: node run-source.js ../sources/norway.js

const { execFileSync } = require('child_process');
const path = require('path');
const { buildSourceRegistration, buildIngestStatements } = require('./ingest.js');
const classify = require('./classify.js');
const match = require('./match.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', 'unified_foods.sqlite');

// Real fix for two real problems hit during the first live run against
// Norway's actual data: (1) "database is locked" -- a concurrent,
// innocent read-only progress check collided with a writer that had no
// busy_timeout set, causing an immediate hard failure instead of a
// bounded wait-and-retry; (2) genuinely severe slowness (~0.5 rows/sec)
// -- outside an explicit transaction, SQLite fsyncs to disk after every
// single statement, and batching into many separate execFileSync calls
// (each spawning a brand-new sqlite3.exe process) added real, additional
// overhead on top of that. Fixed by wrapping an entire statement set in
// one real transaction and running it as a single sqlite3.exe
// invocation, with a real busy_timeout set for genuine safety against
// any future concurrent access (a person poking at the database with
// another tool while this runs, say), not just this specific incident.
// The busy-timeout has to be set via the real -cmd CLI flag, not a
// PRAGMA embedded in the SQL text -- confirmed by direct testing: a
// PRAGMA that returns a value (like busy_timeout) prints its own
// result as plain text ahead of any -json output, corrupting
// JSON.parse; -cmd ".timeout N" sets the same thing at the CLI/session
// level with zero output pollution.
function runBatch(statements) {
  if (statements.length === 0) return;
  const sql = `BEGIN TRANSACTION;\n${statements.join('\n')}\nCOMMIT;\n`;
  execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath], { input: sql, stdio: ['pipe', 'inherit', 'inherit'], maxBuffer: 1024 * 1024 * 64 });
}
function query(sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  return JSON.parse(out || '[]');
}

async function main() {
  const adapterPath = process.argv[2];
  if (!adapterPath) {
    console.error('Usage: node run-source.js <path-to-adapter-file>');
    process.exit(1);
  }
  const adapter = require(path.resolve(adapterPath));

  console.log(`=== Ingesting ${adapter.sourceCode} ===`);
  runBatch([buildSourceRegistration(adapter.sourceMeta)]);

  const t0 = Date.now();
  const records = await adapter.ingest();
  console.log(`Fetched ${records.length} real records in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);

  const countBefore = query('SELECT COUNT(*) c FROM raw_foods;')[0].c;
  const t1 = Date.now();
  const ingestStatements = buildIngestStatements(adapter.sourceCode, records);
  console.log(`Writing ${ingestStatements.length} real SQL statements in one transaction...`);
  runBatch(ingestStatements);
  console.log(`Done in ${((Date.now() - t1) / 1000).toFixed(1)}s.`);
  const countAfter = query('SELECT COUNT(*) c FROM raw_foods;')[0].c;
  console.log(`raw_foods: ${countBefore} -> ${countAfter} (${countAfter - countBefore} new, rest were real re-import updates).`);

  console.log(`\n=== Classifying ===`);
  const t2 = Date.now();
  const { rowCount, statements: classifyStatements } = classify.classifyAll(null, execFileSync, SQLITE_EXE, dbPath);
  console.log(`Evaluated ${rowCount} rows needing classification.`);
  runBatch(classifyStatements);
  console.log(`Done in ${((Date.now() - t2) / 1000).toFixed(1)}s.`);

  const classSummary = query(`
    SELECT is_whole_food, COUNT(*) AS c
    FROM whole_food_classifications
    GROUP BY is_whole_food;
  `);
  console.log('Real classification totals across the whole database so far:');
  for (const row of classSummary) {
    const label = row.is_whole_food === 1 ? 'whole food' : row.is_whole_food === 0 ? 'not whole food' : 'needs human review (ambiguous/no English evidence)';
    console.log(`  ${label}: ${row.c}`);
  }

  console.log(`\n=== Matching ===`);
  const wholeFoodRows = query(`
    SELECT rf.raw_id, rf.source_code, rf.name_original, rf.name_english, rf.latin_name, rf.langual_codes, s.language AS source_language
    FROM raw_foods rf
    JOIN sources s ON s.source_code = rf.source_code
    JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id
    WHERE wfc.is_whole_food = 1;
  `);
  console.log(`Running the real matching cascade against ${wholeFoodRows.length} whole-food rows currently in the database.`);
  const t3 = Date.now();
  // Real, current MAX(match_group_id) -- required so a second/later run
  // (a new source, or a re-run after more English names are filled in)
  // never generates a group id colliding with one already in the
  // database. 0 for a fresh database (no rows yet -> COALESCE kicks in).
  const startingGroupId = query('SELECT COALESCE(MAX(match_group_id), 0) AS m FROM food_match_groups;')[0].m;
  const matchStatements = match.proposeMatches(wholeFoodRows, startingGroupId);
  runBatch(matchStatements);
  console.log(`Done in ${((Date.now() - t3) / 1000).toFixed(1)}s.`);

  const groupSummary = query(`
    SELECT is_region_specific, COUNT(*) AS group_count, SUM(member_count) AS total_members FROM (
      SELECT g.match_group_id, g.is_region_specific,
             (SELECT COUNT(*) FROM food_match_members m WHERE m.match_group_id = g.match_group_id) AS member_count
      FROM food_match_groups g
    ) GROUP BY is_region_specific;
  `);
  console.log('\nReal match group totals:');
  for (const row of groupSummary) {
    const label = row.is_region_specific ? 'region-specific (single source, no match found)' : 'matched across 2+ sources';
    console.log(`  ${label}: ${row.group_count} groups, ${row.total_members} real foods`);
  }
}

main().catch((err) => {
  console.error('run-source.js failed:', err);
  process.exit(1);
});
