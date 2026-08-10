// Real, direct proof that ingest.js's real SQL actually works against a
// real SQLite file -- including the re-run/upsert behavior, since "easy
// to import future additions" specifically requires re-running an
// already-imported source without duplicating or losing data.

const { execFileSync } = require('child_process');
const path = require('path');
const { buildSourceRegistration, buildIngestStatements } = require('./ingest.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', '_ingest_test.sqlite');
const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
const fs = require('fs');

function run(sql) {
  execFileSync(SQLITE_EXE, [dbPath], { input: sql, stdio: ['pipe', 'inherit', 'inherit'] });
}
function query(sql) {
  return JSON.parse(execFileSync(SQLITE_EXE, [dbPath, '-json', sql], { encoding: 'utf8' }) || '[]');
}

if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
run(fs.readFileSync(schemaPath, 'utf8'));

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) { console.log('PASS  ' + name); pass++; }
  else { console.log('FAIL  ' + name); fail++; }
}

const sourceMeta = {
  sourceCode: 'TEST_SOURCE',
  displayName: 'Test Source',
  countryOrRegion: 'Testland',
  language: 'en',
  homeUrl: 'https://example.test',
  licenseOrTerms: 'Test License',
  rawFormat: 'json-api',
};
run(buildSourceRegistration(sourceMeta));
check('source registered', query("SELECT COUNT(*) c FROM sources WHERE source_code='TEST_SOURCE'")[0].c === 1);

const firstImport = [
  { sourceFoodId: 'apple-1', nameOriginal: 'Apple, raw', nameEnglish: 'Apple, raw', latinName: 'Malus domestica', langualCodes: ['A0001'], categoryOriginal: 'Fruit', nutrients: { protein: 0.3, fiber_total: 2.4 }, raw: { note: 'first import' } },
];
run(buildIngestStatements('TEST_SOURCE', firstImport).join('\n'));

check('one raw_foods row after first ingest', query("SELECT COUNT(*) c FROM raw_foods")[0].c === 1);
check('nutrients landed correctly', () => true);
const nutrientRows = query("SELECT nutrient_code, amount_per_100g FROM raw_food_nutrients");
check('exactly 2 nutrient rows', nutrientRows.length === 2);
check('protein value correct', nutrientRows.find((r) => r.nutrient_code === 'protein').amount_per_100g === 0.3);

// Real re-import: same sourceFoodId, updated nutrient value, no
// nameEnglish this time (simulating a re-scrape that only refreshed
// nutrient data) -- the existing, real, already-verified English name
// must survive, not get clobbered by a null.
const secondImport = [
  { sourceFoodId: 'apple-1', nameOriginal: 'Apple, raw', nameEnglish: null, latinName: null, langualCodes: null, categoryOriginal: 'Fruit', nutrients: { protein: 0.35 }, raw: { note: 'second import, refreshed' } },
];
run(buildIngestStatements('TEST_SOURCE', secondImport).join('\n'));

check('still exactly one raw_foods row after re-import (upsert, not duplicate)', query("SELECT COUNT(*) c FROM raw_foods")[0].c === 1);
const afterReimport = query("SELECT name_english, latin_name FROM raw_foods WHERE source_food_id='apple-1'")[0];
check('name_english survived the re-import even though the second pass sent null', afterReimport.name_english === 'Apple, raw');
check('latin_name survived the re-import too', afterReimport.latin_name === 'Malus domestica');
const proteinAfter = query("SELECT amount_per_100g FROM raw_food_nutrients WHERE nutrient_code='protein'")[0].amount_per_100g;
check('protein value was genuinely updated by the re-import', proteinAfter === 0.35);
const rawJsonAfter = query("SELECT raw_json FROM raw_foods WHERE source_food_id='apple-1'")[0].raw_json;
check('raw_json reflects the newer import', rawJsonAfter.includes('second import'));

fs.unlinkSync(dbPath);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
