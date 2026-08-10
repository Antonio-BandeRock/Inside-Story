// The real, permanent way to run any source adapter through the full
// pipeline -- ingest, then classify whatever's new, then match ONLY the
// whole-food rows that aren't already in a match group.
//
// REAL BUG FOUND AND FIXED while running Sweden on top of Norway's
// already-matched data: this file's own first version matched EVERY
// current whole-food row every time, including ones a PREVIOUS run had
// already grouped -- match.js's own `proposeMatches` has no built-in
// awareness of pre-existing groups, so re-running it against the same
// 815 already-matched rows created a full, duplicate second set of
// match groups on top of the real ones (confirmed directly: match
// group and food counts had exactly doubled). `match.js` already had a
// real, correct function built for exactly this, `fetchUnmatchedWholeFoods`
// -- it just was never actually wired in here. Fixed by using it.
//
// Real, honest, named limitation this fix does NOT solve, worth stating
// plainly rather than implied away: a newly-ingested row can only join
// an EXISTING group from a past run if `proposeMatches` itself is given
// that old group's own members to compare against -- which it currently
// isn't (only genuinely unmatched rows are passed in). This means a
// brand-new source's row that should join, say, Norway's own already-
// grouped "Apple" (Malus domestica) group won't actually join it yet --
// it'll form its own new, separate, correct-but-unlinked group instead.
// Not a risk of silent wrong data (nothing gets merged into the wrong
// group), just a real, deferred completeness gap -- a genuine
// candidate for a later pass once more sources are in and this
// scenario actually starts happening in practice.
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
  // Only rows not already in a match group -- see this file's own
  // header comment for the real bug this fixes.
  const wholeFoodRows = match.fetchUnmatchedWholeFoods(execFileSync, SQLITE_EXE, dbPath);
  console.log(`Running the real matching cascade against ${wholeFoodRows.length} newly-unmatched whole-food rows (already-matched rows from a previous run are left untouched).`);
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
