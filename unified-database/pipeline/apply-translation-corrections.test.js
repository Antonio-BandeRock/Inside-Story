// Real, DB-backed integration test for apply-translation-corrections.js --
// runs the ACTUAL CLI script (not a refactored testable stand-in) against
// a real, isolated test database and a real, small corrections JSON file,
// then verifies the resulting database state directly via SQL. Never
// touches the live unified_foods.sqlite (UNIFIED_DB_PATH override) or the
// live translation-corrections.json (TRANSLATION_CORRECTIONS_PATH
// override) -- same precedent as apply-audit-decisions.test.js.

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { buildSourceRegistration, buildIngestStatements } = require('./ingest.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', '_apply_translation_corrections_test.sqlite');
const correctionsPath = path.resolve(__dirname, '..', '_apply_translation_corrections_test_input.json');
const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
const applyScriptPath = path.resolve(__dirname, 'apply-translation-corrections.js');

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

// Seed: 1 source, 3 raw foods -- one carrying a real, deliberately wrong
// "translation" to correct (mirroring the real Batavia/flood shape: a
// short, ambiguous name mistranslated into something food-nonsensical),
// one that's a genuine composite/excluded food once correctly translated
// (to prove the false->NULL "needs review" distinction is preserved, not
// collapsed to a hard 0), and one bystander row untouched by any
// correction (to prove this script only ever touches what it's told to).
runBatch([buildSourceRegistration({ sourceCode: 'TEST_FR', displayName: 'Test French Source', countryOrRegion: 'Testland', language: 'fr', homeUrl: 'https://example.test', licenseOrTerms: 'Test', rawFormat: 'json' })]);
runBatch(buildIngestStatements('TEST_FR', [
  { sourceFoodId: 'f1', nameOriginal: 'Testlegume, cru', nameEnglish: 'Testlegume, flood', latinName: null, langualCodes: null, categoryOriginal: 'Veg', nutrients: {}, raw: {} },
  { sourceFoodId: 'f2', nameOriginal: 'Testconfiserie', nameEnglish: 'Test brown', latinName: null, langualCodes: null, categoryOriginal: 'Sweets', nutrients: {}, raw: {} },
  { sourceFoodId: 'f3', nameOriginal: 'Bystander, raw', nameEnglish: 'Bystander, raw', latinName: null, langualCodes: null, categoryOriginal: 'Veg', nutrients: {}, raw: {} },
]));

// Two real pending classification rows, seeded with an auto call that's
// deliberately WRONG for what the corrected English text should produce
// -- this is the whole point of the test: confirming the reclassify step
// actually re-derives the result from the corrected name rather than
// just leaving the stale pre-correction value sitting there.
runBatch([
  `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed) VALUES ((SELECT raw_id FROM raw_foods WHERE source_food_id='f1' AND source_code='TEST_FR'), 0, 'no_rule_matched', 'low', 0);`,
  `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed) VALUES ((SELECT raw_id FROM raw_foods WHERE source_food_id='f2' AND source_code='TEST_FR'), 1, 'raw_hint', 'low', 0);`,
  `INSERT INTO whole_food_classifications (raw_id, is_whole_food, rule_matched, auto_confidence, reviewed) VALUES ((SELECT raw_id FROM raw_foods WHERE source_food_id='f3' AND source_code='TEST_FR'), 1, 'raw_hint', 'high', 0);`,
]);

const rawIdF1 = query(`SELECT raw_id FROM raw_foods WHERE source_food_id='f1' AND source_code='TEST_FR';`)[0].raw_id;
const rawIdF2 = query(`SELECT raw_id FROM raw_foods WHERE source_food_id='f2' AND source_code='TEST_FR';`)[0].raw_id;
const rawIdF3 = query(`SELECT raw_id FROM raw_foods WHERE source_food_id='f3' AND source_code='TEST_FR';`)[0].raw_id;

// A real, small corrections file matching the exact shape of the real
// translation-corrections.json: f1's corrected name should classify TRUE
// (a real, plain raw vegetable), f2's corrected name should classify
// FALSE (a real excluded confection), f3 is deliberately not mentioned at
// all -- it must come out of this whole run completely untouched.
const correctionsPayload = {
  _comment: 'Real, small test fixture -- not the live corrections file.',
  corrections: [
    { raw_id: rawIdF1, name_original: 'Testlegume, cru', wrong_translation: 'Testlegume, flood', corrected_translation: 'Testlegume, raw', reason: 'Test fixture' },
    { raw_id: rawIdF2, name_original: 'Testconfiserie', wrong_translation: 'Test brown', corrected_translation: 'Test candied fruit', reason: 'Test fixture' },
  ],
};
fs.writeFileSync(correctionsPath, JSON.stringify(correctionsPayload, null, 2));

execFileSync('node', [applyScriptPath], {
  env: { ...process.env, UNIFIED_DB_PATH: dbPath, SQLITE_EXE, TRANSLATION_CORRECTIONS_PATH: correctionsPath },
  stdio: ['pipe', 'inherit', 'inherit'],
});

// Real verification against the actual, post-apply database state.
const f1Raw = query(`SELECT name_english, name_english_source FROM raw_foods WHERE raw_id=${rawIdF1};`)[0];
check('name_english corrected to the real, right text', f1Raw.name_english === 'Testlegume, raw', JSON.stringify(f1Raw));
check('name_english_source tagged translation_corrected', f1Raw.name_english_source === 'translation_corrected', JSON.stringify(f1Raw));

const f1Class = query(`SELECT is_whole_food, reviewed FROM whole_food_classifications WHERE raw_id=${rawIdF1};`)[0];
check('f1 reclassified TRUE against its corrected text (was stale 0, should now be 1)', f1Class.is_whole_food === 1, JSON.stringify(f1Class));
check('f1 reviewed stays 0 -- a translation fix is not a human whole-food review decision', f1Class.reviewed === 0, JSON.stringify(f1Class));

const f2Raw = query(`SELECT name_english FROM raw_foods WHERE raw_id=${rawIdF2};`)[0];
check('f2 name_english corrected', f2Raw.name_english === 'Test candied fruit', JSON.stringify(f2Raw));
const f2Class = query(`SELECT is_whole_food FROM whole_food_classifications WHERE raw_id=${rawIdF2};`)[0];
check('f2 reclassified FALSE against its corrected text (candied is a real exclude keyword; was stale 1)', f2Class.is_whole_food === 0, JSON.stringify(f2Class));

const f3Raw = query(`SELECT name_english, name_english_source FROM raw_foods WHERE raw_id=${rawIdF3};`)[0];
check('the bystander row (no correction targets it) is completely untouched', f3Raw.name_english === 'Bystander, raw' && f3Raw.name_english_source !== 'translation_corrected', JSON.stringify(f3Raw));

// Real idempotency check -- applying the exact same corrections a second
// time must be a safe no-op, never an error, never a double-effect, and
// (the real bug this test guards against) must still correctly
// re-classify even when the "already correct" skip path is what fires
// instead of a fresh UPDATE.
execFileSync('node', [applyScriptPath], {
  env: { ...process.env, UNIFIED_DB_PATH: dbPath, SQLITE_EXE, TRANSLATION_CORRECTIONS_PATH: correctionsPath },
  stdio: ['pipe', 'inherit', 'inherit'],
});
const f1ClassAfterRerun = query(`SELECT is_whole_food FROM whole_food_classifications WHERE raw_id=${rawIdF1};`)[0];
check('re-applying the same corrections is a safe no-op, and still correctly classified', f1ClassAfterRerun.is_whole_food === 1, JSON.stringify(f1ClassAfterRerun));

// Real safety-check test: a row whose name_english has since been changed
// to something OTHER than either the wrong or the corrected translation
// (simulating "something else already touched this row") must be left
// completely alone, not overwritten.
runBatch([`UPDATE raw_foods SET name_english = 'Something totally different' WHERE raw_id = ${rawIdF2};`]);
const correctionsPayload2 = {
  corrections: [
    { raw_id: rawIdF2, name_original: 'Testconfiserie', wrong_translation: 'Test brown', corrected_translation: 'Test candied fruit', reason: 'Test fixture' },
  ],
};
fs.writeFileSync(correctionsPath, JSON.stringify(correctionsPayload2, null, 2));
execFileSync('node', [applyScriptPath], {
  env: { ...process.env, UNIFIED_DB_PATH: dbPath, SQLITE_EXE, TRANSLATION_CORRECTIONS_PATH: correctionsPath },
  stdio: ['pipe', 'inherit', 'inherit'],
});
const f2RawAfterDrift = query(`SELECT name_english FROM raw_foods WHERE raw_id=${rawIdF2};`)[0];
check('a row changed by something else since is left alone, not overwritten', f2RawAfterDrift.name_english === 'Something totally different', JSON.stringify(f2RawAfterDrift));

fs.unlinkSync(dbPath);
fs.unlinkSync(correctionsPath);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
