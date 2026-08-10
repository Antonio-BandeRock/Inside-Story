// Real, DB-backed regression test for the exact bug found while running
// Sweden on top of Norway's already-matched data: re-running the match
// phase against ALL current whole-food rows (rather than only the
// unmatched ones) silently duplicated every existing group. Confirmed
// live -- group and food counts had exactly doubled. This test proves
// the fix (fetchUnmatchedWholeFoods) holds against a real database file,
// not just in-memory logic.

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { buildSourceRegistration, buildIngestStatements } = require('./ingest.js');
const classify = require('./classify.js');
const match = require('./match.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', '_run_source_test.sqlite');
const schemaPath = path.resolve(__dirname, '..', 'schema.sql');

function runBatch(statements) {
  if (statements.length === 0) return;
  const sql = `BEGIN TRANSACTION;\n${statements.join('\n')}\nCOMMIT;\n`;
  execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath], { input: sql, stdio: ['pipe', 'inherit', 'inherit'] });
}
function query(sql) {
  return JSON.parse(execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], { encoding: 'utf8' }) || '[]');
}

if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
runBatch([fs.readFileSync(schemaPath, 'utf8')]);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { console.log('PASS  ' + name); pass++; }
  else { console.log('FAIL  ' + name + (detail ? '  ->  ' + detail : '')); fail++; }
}

// Seed one real source with 3 whole-food rows.
runBatch([buildSourceRegistration({ sourceCode: 'TEST_A', displayName: 'Test A', countryOrRegion: 'Testland', language: 'en', homeUrl: 'https://example.test', licenseOrTerms: 'Test', rawFormat: 'json' })]);
runBatch(buildIngestStatements('TEST_A', [
  { sourceFoodId: 'a1', nameOriginal: 'Carrot, raw', nameEnglish: 'Carrot, raw', latinName: 'Daucus carota', langualCodes: null, categoryOriginal: 'Veg', nutrients: { protein: 0.9 }, raw: {} },
  { sourceFoodId: 'a2', nameOriginal: 'Banana, raw', nameEnglish: 'Banana, raw', latinName: 'Musa acuminata', langualCodes: null, categoryOriginal: 'Fruit', nutrients: { protein: 1.1 }, raw: {} },
]));

// Real, permanent-pipeline-shaped run #1: classify then match.
let { statements: classifyStatements } = classify.classifyAll(null, execFileSync, SQLITE_EXE, dbPath);
runBatch(classifyStatements);
let unmatched = match.fetchUnmatchedWholeFoods(execFileSync, SQLITE_EXE, dbPath);
check('run 1: 2 real whole-food rows are unmatched before the first match pass', unmatched.length === 2, `got ${unmatched.length}`);
let startingId = query('SELECT COALESCE(MAX(match_group_id), 0) AS m FROM food_match_groups;')[0].m;
runBatch(match.proposeMatches(unmatched, startingId));

const groupsAfterRun1 = query('SELECT COUNT(*) c FROM food_match_groups;')[0].c;
const membersAfterRun1 = query('SELECT COUNT(*) c FROM food_match_members;')[0].c;
check('run 1: 2 real groups created (Carrot, Banana -- each standalone, no match yet)', groupsAfterRun1 === 2, `got ${groupsAfterRun1}`);
check('run 1: 2 real members recorded', membersAfterRun1 === 2, `got ${membersAfterRun1}`);

// Now ingest a SECOND source with its own real record sharing Carrot's
// real Latin name -- the actual "add a new source on top of existing
// data" scenario that surfaced the real bug.
runBatch([buildSourceRegistration({ sourceCode: 'TEST_B', displayName: 'Test B', countryOrRegion: 'Testland2', language: 'en', homeUrl: 'https://example2.test', licenseOrTerms: 'Test', rawFormat: 'json' })]);
runBatch(buildIngestStatements('TEST_B', [
  { sourceFoodId: 'b1', nameOriginal: 'Carrot, raw', nameEnglish: 'Carrot, raw', latinName: 'Daucus carota', langualCodes: null, categoryOriginal: 'Veg', nutrients: { protein: 0.85 }, raw: {} },
]));

({ statements: classifyStatements } = classify.classifyAll(null, execFileSync, SQLITE_EXE, dbPath));
runBatch(classifyStatements);

// This is the exact real check: fetchUnmatchedWholeFoods must return
// ONLY the new row (1), not all 3 whole-food rows now in the database.
unmatched = match.fetchUnmatchedWholeFoods(execFileSync, SQLITE_EXE, dbPath);
check('run 2: fetchUnmatchedWholeFoods returns ONLY the newly-ingested row, not the 2 already-matched ones', unmatched.length === 1, `got ${unmatched.length} (the real bug would show 3 here)`);

startingId = query('SELECT COALESCE(MAX(match_group_id), 0) AS m FROM food_match_groups;')[0].m;
runBatch(match.proposeMatches(unmatched, startingId));

const groupsAfterRun2 = query('SELECT COUNT(*) c FROM food_match_groups;')[0].c;
const membersAfterRun2 = query('SELECT COUNT(*) c FROM food_match_members;')[0].c;
// Real expected outcome: Banana's own original standalone group is
// untouched; Carrot's new row can't yet join Carrot's EXISTING group
// (a real, separately-documented limitation -- see run-source.js's own
// header comment), so it forms its own new standalone group too. Total:
// 3 real groups (not 4, and definitely not the doubled-to-4-from-a-
// full-re-match count the real bug would have produced), 3 real members.
check('run 2: no duplicate groups created (3 real groups total, not doubled)', groupsAfterRun2 === 3, `got ${groupsAfterRun2}`);
check('run 2: no duplicate members created (3 real members total)', membersAfterRun2 === 3, `got ${membersAfterRun2}`);

fs.unlinkSync(dbPath);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
