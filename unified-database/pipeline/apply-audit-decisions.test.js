// Real, DB-backed integration test for apply-audit-decisions.js -- runs
// the ACTUAL CLI script (not a refactored testable stand-in) against a
// real, isolated test database and a real decisions JSON file, then
// verifies the resulting database state directly via SQL. Never touches
// the live unified_foods.sqlite (UNIFIED_DB_PATH override, same
// precedent as SQLITE_EXE throughout this pipeline).

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { buildSourceRegistration, buildIngestStatements } = require('./ingest.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', '_apply_decisions_test.sqlite');
const decisionsPath = path.resolve(__dirname, '..', '_apply_decisions_test_input.json');
const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
const applyScriptPath = path.resolve(__dirname, 'apply-audit-decisions.js');

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

// Seed: 2 sources, 4 raw foods (2 classification-pending, and a real
// 3-member match group -- 2 confirmed sources plus one that should get
// removed as a bad match -- plus a real, separate single-member group
// that should get flagged for split).
runBatch([buildSourceRegistration({ sourceCode: 'TEST_A', displayName: 'Test A', countryOrRegion: 'Testland', language: 'en', homeUrl: 'https://example.test', licenseOrTerms: 'Test', rawFormat: 'json' })]);
runBatch(buildIngestStatements('TEST_A', [
  { sourceFoodId: 'a1', nameOriginal: 'Carrot, raw', nameEnglish: 'Carrot, raw', latinName: 'Daucus carota', langualCodes: null, categoryOriginal: 'Veg', nutrients: {}, raw: {} },
  { sourceFoodId: 'a2', nameOriginal: 'Candy bar', nameEnglish: 'Candy bar', latinName: null, langualCodes: null, categoryOriginal: 'Sweets', nutrients: {}, raw: {} },
  { sourceFoodId: 'a3', nameOriginal: 'Blueberry', nameEnglish: 'Blueberry', latinName: 'Vaccinium', langualCodes: null, categoryOriginal: 'Fruit', nutrients: {}, raw: {} },
]));
runBatch([buildSourceRegistration({ sourceCode: 'TEST_B', displayName: 'Test B', countryOrRegion: 'Testland2', language: 'en', homeUrl: 'https://example2.test', licenseOrTerms: 'Test', rawFormat: 'json' })]);
runBatch(buildIngestStatements('TEST_B', [
  { sourceFoodId: 'b1', nameOriginal: 'Something', nameEnglish: 'Something else entirely', latinName: null, langualCodes: null, categoryOriginal: 'Mixed', nutrients: {}, raw: {} },
]));

// Two real, pending classification rows.
runBatch([
  `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed) VALUES ((SELECT raw_id FROM raw_foods WHERE source_food_id='a1' AND source_code='TEST_A'), 1, 'raw_hint', 'medium', 0);`,
  `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed) VALUES ((SELECT raw_id FROM raw_foods WHERE source_food_id='a2' AND source_code='TEST_A'), 0, 'exclude_keyword', 'high', 0);`,
]);

// A real 3-member proposed match group (Carrot from A, plus two more
// standalone-looking rows deliberately bundled in wrong) and a separate
// real single-member group that a person will flag for split.
runBatch([
  `INSERT INTO food_match_groups (match_group_id, canonical_english_name, canonical_latin_name, is_region_specific, created_at) VALUES (1, 'Carrot', 'Daucus carota', 0, '2026-01-01');`,
  `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence) VALUES (1, (SELECT raw_id FROM raw_foods WHERE source_food_id='a1' AND source_code='TEST_A'), 'latin_name', 'proposed');`,
  `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence) VALUES (1, (SELECT raw_id FROM raw_foods WHERE source_food_id='a3' AND source_code='TEST_A'), 'canonical_name', 'proposed');`,
  `INSERT INTO food_match_members (match_group_id, raw_id, match_method, match_confidence) VALUES (1, (SELECT raw_id FROM raw_foods WHERE source_food_id='b1' AND source_code='TEST_B'), 'canonical_name', 'proposed');`,
  `INSERT INTO food_match_groups (match_group_id, canonical_english_name, canonical_latin_name, is_region_specific, created_at) VALUES (2, 'Standalone thing', NULL, 1, '2026-01-01');`,
]);

const rawIdA1 = query(`SELECT raw_id FROM raw_foods WHERE source_food_id='a1' AND source_code='TEST_A';`)[0].raw_id;
const rawIdA2 = query(`SELECT raw_id FROM raw_foods WHERE source_food_id='a2' AND source_code='TEST_A';`)[0].raw_id;
const rawIdB1 = query(`SELECT raw_id FROM raw_foods WHERE source_food_id='b1' AND source_code='TEST_B';`)[0].raw_id;

// A real decisions export, matching exactly the shape unified-audit.html
// itself produces via openExport() -- confirm carrot as whole food,
// confirm the flagged candy bar's own auto-call by skipping it, remove
// the bad TEST_B member from group 1, confirm what's left of group 1,
// and flag group 2 for a future split.
const decisionsPayload = {
  exportedAt: new Date().toISOString(),
  sourceExportedAt: '2026-01-01T00:00:00.000Z',
  decisions: {
    classify: { [rawIdA1]: 'whole', [rawIdA2]: 'skip' },
    groupConfirm: { 1: true },
    groupSplit: { 2: true },
    memberRemove: { [`1:${rawIdB1}`]: true },
  },
};
fs.writeFileSync(decisionsPath, JSON.stringify(decisionsPayload, null, 2));

execFileSync('node', [applyScriptPath, decisionsPath], {
  env: { ...process.env, UNIFIED_DB_PATH: dbPath, SQLITE_EXE },
  stdio: ['pipe', 'inherit', 'inherit'],
});

// Real verification against the actual, post-apply database state.
const a1Row = query(`SELECT is_whole_food, reviewed FROM whole_food_classifications WHERE raw_id=${rawIdA1};`)[0];
check('classify "whole": is_whole_food set to 1, reviewed set to 1', a1Row.is_whole_food === 1 && a1Row.reviewed === 1, JSON.stringify(a1Row));

const a2Row = query(`SELECT is_whole_food, reviewed FROM whole_food_classifications WHERE raw_id=${rawIdA2};`)[0];
check('classify "skip": is_whole_food left at its original auto value (0), reviewed set to 1', a2Row.is_whole_food === 0 && a2Row.reviewed === 1, JSON.stringify(a2Row));

const group1Members = query(`SELECT raw_id, match_confidence FROM food_match_members WHERE match_group_id=1 ORDER BY raw_id;`);
check('memberRemove: the bad TEST_B member is genuinely gone from group 1', !group1Members.some((m) => m.raw_id === rawIdB1), JSON.stringify(group1Members));
check('groupConfirm: every real remaining member of group 1 is confirmed', group1Members.length === 2 && group1Members.every((m) => m.match_confidence === 'confirmed'), JSON.stringify(group1Members));

const group2Row = query(`SELECT needs_split FROM food_match_groups WHERE match_group_id=2;`)[0];
check('groupSplit: group 2 is flagged needs_split=1', group2Row.needs_split === 1, JSON.stringify(group2Row));

const group1Row = query(`SELECT needs_split FROM food_match_groups WHERE match_group_id=1;`)[0];
check('the confirmed group (1) is NOT flagged for split', group1Row.needs_split === 0, JSON.stringify(group1Row));

// Real idempotency check -- applying the exact same export a second time
// must be a safe no-op, never an error and never a double-effect.
execFileSync('node', [applyScriptPath, decisionsPath], {
  env: { ...process.env, UNIFIED_DB_PATH: dbPath, SQLITE_EXE },
  stdio: ['pipe', 'inherit', 'inherit'],
});
const group1MembersAfterRerun = query(`SELECT raw_id, match_confidence FROM food_match_members WHERE match_group_id=1 ORDER BY raw_id;`);
check('re-applying the same export is a safe no-op (still exactly 2 real members, both confirmed)', group1MembersAfterRerun.length === 2 && group1MembersAfterRerun.every((m) => m.match_confidence === 'confirmed'), JSON.stringify(group1MembersAfterRerun));

fs.unlinkSync(dbPath);
fs.unlinkSync(decisionsPath);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
