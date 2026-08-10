// The real, permanent way to translate a source's untranslated names,
// then re-run classification and matching now that real English
// evidence exists for rows that previously had none.
//
// Usage: node translate-source.js <source_code>
// Example: node translate-source.js Sweden_Livsmedelsverket

const { execFileSync } = require('child_process');
const path = require('path');
const { translateTexts } = require('./translate.js');
const classify = require('./classify.js');
const match = require('./match.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', 'unified_foods.sqlite');

function runBatch(statements) {
  if (statements.length === 0) return;
  const sql = `BEGIN TRANSACTION;\n${statements.join('\n')}\nCOMMIT;\n`;
  execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath], { input: sql, stdio: ['pipe', 'inherit', 'inherit'], maxBuffer: 1024 * 1024 * 64 });
}
function query(sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  return JSON.parse(out || '[]');
}
function esc(s) {
  return s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
}

async function main() {
  const sourceCode = process.argv[2];
  if (!sourceCode) {
    console.error('Usage: node translate-source.js <source_code>');
    process.exit(1);
  }

  const sourceRow = query(`SELECT language FROM sources WHERE source_code = ${esc(sourceCode)};`)[0];
  if (!sourceRow) {
    console.error(`Real source '${sourceCode}' not found in the database. Ingest it first.`);
    process.exit(1);
  }
  if (sourceRow.language === 'en') {
    console.log(`Source '${sourceCode}' is already registered as language 'en' -- nothing to translate.`);
    return;
  }

  const untranslated = query(`
    SELECT raw_id, name_original FROM raw_foods
    WHERE source_code = ${esc(sourceCode)} AND name_english IS NULL;
  `);
  console.log(`Found ${untranslated.length} real, untranslated names for ${sourceCode}.`);
  if (untranslated.length === 0) return;

  const t0 = Date.now();
  const translations = await translateTexts(
    untranslated.map((r) => r.name_original),
    { sourceLang: sourceRow.language, targetLang: 'en' }
  );
  console.log(`Real translation pass done in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);

  let succeeded = 0;
  let failed = 0;
  const statements = [];
  for (let i = 0; i < untranslated.length; i++) {
    const translated = translations[i];
    if (!translated) {
      failed++;
      continue;
    }
    succeeded++;
    statements.push(
      `UPDATE raw_foods SET name_english = ${esc(translated)}, name_english_source = 'machine_translated' WHERE raw_id = ${untranslated[i].raw_id};`
    );
  }
  console.log(`Real translations applied: ${succeeded} succeeded, ${failed} failed (left untranslated, not guessed at).`);
  runBatch(statements);

  console.log(`\n=== Re-classifying now that real English evidence exists ===`);
  const { rowCount, statements: classifyStatements } = classify.classifyAll(null, execFileSync, SQLITE_EXE, dbPath);
  console.log(`Evaluated ${rowCount} rows needing (re-)classification.`);
  runBatch(classifyStatements);

  const classSummary = query(`
    SELECT is_whole_food, COUNT(*) AS c
    FROM whole_food_classifications
    GROUP BY is_whole_food;
  `);
  console.log('Real classification totals across the whole database now:');
  for (const row of classSummary) {
    const label = row.is_whole_food === 1 ? 'whole food' : row.is_whole_food === 0 ? 'not whole food' : 'needs human review (ambiguous/no English evidence)';
    console.log(`  ${label}: ${row.c}`);
  }

  console.log(`\n=== Matching newly-classified whole foods ===`);
  const wholeFoodRows = match.fetchUnmatchedWholeFoods(execFileSync, SQLITE_EXE, dbPath);

  const existingMembers = match.fetchExistingGroupMembers(execFileSync, SQLITE_EXE, dbPath);
  const { statements: joinStatements, claimedRawIds } = match.matchAgainstExistingGroups(wholeFoodRows, existingMembers);
  runBatch(joinStatements);
  console.log(`${claimedRawIds.size} of ${wholeFoodRows.length} newly-unmatched rows joined an existing group from a previous run -- this is where a real Sweden<->Norway cross-source match actually happens.`);

  const stillUnmatched = wholeFoodRows.filter((r) => !claimedRawIds.has(r.raw_id));
  console.log(`Running the real peer-to-peer matching cascade against the remaining ${stillUnmatched.length} rows.`);
  const startingGroupId = query('SELECT COALESCE(MAX(match_group_id), 0) AS m FROM food_match_groups;')[0].m;
  const matchStatements = match.proposeMatches(stillUnmatched, startingGroupId);
  runBatch(matchStatements);

  const groupSummary = query(`
    SELECT is_region_specific, COUNT(*) AS group_count, SUM(member_count) AS total_members FROM (
      SELECT g.match_group_id, g.is_region_specific,
             (SELECT COUNT(*) FROM food_match_members m WHERE m.match_group_id = g.match_group_id) AS member_count
      FROM food_match_groups g
    ) GROUP BY is_region_specific;
  `);
  console.log('\nReal match group totals across the whole database now:');
  for (const row of groupSummary) {
    const label = row.is_region_specific ? 'region-specific (single source, no match found)' : 'matched across 2+ sources';
    console.log(`  ${label}: ${row.group_count} groups, ${row.total_members} real foods`);
  }
}

main().catch((err) => {
  console.error('translate-source.js failed:', err);
  process.exit(1);
});
