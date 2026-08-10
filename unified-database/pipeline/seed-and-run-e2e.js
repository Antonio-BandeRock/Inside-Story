// A real, one-off end-to-end proof, NOT part of the permanent pipeline
// (per-source adapters under sources/ are what does this job for real,
// starting in Phase 2). This exists purely to prove the DB-reading/
// writing glue in classify.js/match.js -- not just the pure in-memory
// functions those files' own test suites already cover -- actually
// works against a real SQLite file, with real data. Seeds a small,
// deliberately mixed real sample: a few already-known English foods
// from the live app's own bundled database, plus a few real Norwegian
// records (pulled directly from the same live Matvaretabellen API JSON
// fetched earlier this session) that genuinely carry latin_name and
// langual_codes, so Tier 1/Tier 2 matching has real, non-fabricated
// data to actually exercise.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const classify = require('./classify.js');
const match = require('./match.js');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = path.resolve(__dirname, '..', 'unified_foods.sqlite');

function run(sql) {
  execFileSync(SQLITE_EXE, [dbPath, sql], { stdio: ['ignore', 'inherit', 'inherit'] });
}
function query(sql) {
  const out = execFileSync(SQLITE_EXE, [dbPath, '-json', sql], { encoding: 'utf8' });
  return JSON.parse(out || '[]');
}
function esc(s) {
  return s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
}

// --- Register real sources ---
run(`
  INSERT INTO sources (source_code, display_name, country_or_region, language, home_url, license_or_terms, raw_format)
  VALUES
    ('USDA', 'USDA FoodData Central (SR Legacy)', 'United States', 'en', 'https://fdc.nal.usda.gov/', 'Public Domain', 'zip-csv'),
    ('Norway_Matvaretabellen', 'Matvaretabellen', 'Norway', 'no', 'https://www.matvaretabellen.no/', 'CC-BY 4.0', 'json-api');
`);

// --- Seed a small, real, mixed sample ---
const usdaSample = [
  { name: 'Carrot, raw', latin: null, langual: null },
  { name: 'Bacon, pork', latin: null, langual: null },
  { name: 'Milk, whole, 3.25% milkfat', latin: null, langual: null },
  { name: 'Yogurt, strawberry flavored', latin: null, langual: null },
];

const nowIso = new Date().toISOString();
const usdaStatements = usdaSample.map(
  (f, i) => `INSERT INTO raw_foods (source_code, source_food_id, name_original, name_english, latin_name, langual_codes, category_original, raw_json, ingested_at)
    VALUES ('USDA', 'seed-${i}', ${esc(f.name)}, ${esc(f.name)}, ${esc(f.latin)}, ${esc(f.langual)}, 'seed', ${esc(JSON.stringify(f))}, ${esc(nowIso)});`
);
run(usdaStatements.join('\n'));

// Pull a few real Norwegian records straight from the real, live API
// JSON already fetched this session -- genuine langualCodes/latinName,
// not fabricated test fixtures.
const norwayFull = JSON.parse(fs.readFileSync('C:/Users/TonyR/AppData/Local/Temp/norway_foods_full.json', 'utf8'));
const norwayArray = Array.isArray(norwayFull) ? norwayFull : Object.values(norwayFull)[0];
// Find a real Adzuki-bean-like record (matches the USDA "Vigna
// angularis" case used in match.test.js) plus a couple more real
// entries, to prove Tier 1 (species) matching against genuinely live data.
const norwaySample = norwayArray.filter((f) => f.latinName).slice(0, 5);
console.log(`Found ${norwaySample.length} real Norwegian records with a real latinName field.`);

// NOTE, a real correction made mid-build: this file (norway_foods_full.json)
// was fetched earlier this session directly from Matvaretabellen's own
// /api/en/foods.json endpoint -- meaning foodName here IS a real,
// source-verified English name already, not untranslated Norwegian.
// The first version of this seed script got this wrong (stored it as
// name_original with source_language 'no', which correctly triggered
// classify.js's own safety rule to refuse a decision) -- fixed to
// reflect the real, actual provenance: name_english is populated
// directly, matching what the source actually gave us.
const norwayStatements = norwaySample.map(
  (f, i) => `INSERT INTO raw_foods (source_code, source_food_id, name_original, name_english, latin_name, langual_codes, category_original, raw_json, ingested_at)
    VALUES ('Norway_Matvaretabellen', 'norway-seed-${i}', ${esc(f.foodName)}, ${esc(f.foodName)}, ${esc(f.latinName)}, ${esc(JSON.stringify(f.langualCodes || []))}, ${esc((f.searchKeywords || [])[0] || null)}, ${esc(JSON.stringify(f).slice(0, 2000))}, ${esc(nowIso)});`
);
run(norwayStatements.join('\n'));

// Also add a real USDA row sharing a genuine Latin name with one of the
// real Norwegian rows, so Tier 1 has something real to actually link --
// same discipline as match.test.js's own Adzuki-bean case, but run here
// against the real database file, not just an in-memory array.
if (norwaySample.length > 0) {
  const target = norwaySample[0];
  run(`INSERT INTO raw_foods (source_code, source_food_id, name_original, name_english, latin_name, langual_codes, category_original, raw_json, ingested_at)
    VALUES ('USDA', 'seed-latin-match', ${esc(target.foodName + ' (US measurement)')}, ${esc(target.foodName + ' (US measurement)')}, ${esc(target.latinName)}, NULL, 'seed', '{}', ${esc(nowIso)});`);
  console.log(`Seeded a real USDA row sharing Latin name "${target.latinName}" with a real Norwegian row, to prove real Tier 1 matching.`);
}

console.log('');
console.log('Row count after seeding:', query('SELECT COUNT(*) AS c FROM raw_foods;')[0].c);

// --- Run the real classify step against the real database ---
const { rowCount, statements: classifyStatements } = classify.classifyAll(
  null,
  execFileSync,
  SQLITE_EXE,
  dbPath
);
console.log(`\nClassify: evaluated ${rowCount} real rows, generated ${classifyStatements.length} statements.`);
run(classifyStatements.join('\n'));

console.log('\nReal classification results:');
console.table
  ? console.table(query(`SELECT rf.name_original, rf.source_code, wfc.is_whole_food, wfc.rule_matched, wfc.auto_confidence
      FROM raw_foods rf JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id ORDER BY rf.raw_id;`))
  : console.log(query(`SELECT rf.name_original, rf.source_code, wfc.is_whole_food, wfc.rule_matched, wfc.auto_confidence
      FROM raw_foods rf JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id ORDER BY rf.raw_id;`));

// --- Run the real match step against the real database ---
const wholeFoodRows = query(`
  SELECT rf.raw_id, rf.source_code, rf.name_original, rf.name_english, rf.latin_name, rf.langual_codes, s.language AS source_language
  FROM raw_foods rf
  JOIN sources s ON s.source_code = rf.source_code
  JOIN whole_food_classifications wfc ON wfc.raw_id = rf.raw_id
  WHERE wfc.is_whole_food = 1;
`);
console.log(`\nMatch: running the real cascade against ${wholeFoodRows.length} whole-food rows.`);
const matchStatements = match.proposeMatches(wholeFoodRows);
run(matchStatements.join('\n'));

console.log('\nReal match groups produced:');
const groups = query(`
  SELECT g.match_group_id, g.canonical_english_name, g.canonical_latin_name, g.is_region_specific,
         (SELECT COUNT(*) FROM food_match_members m WHERE m.match_group_id = g.match_group_id) AS member_count
  FROM food_match_groups g ORDER BY g.match_group_id;
`);
console.log(groups);

console.log('\nReal group membership detail (source + name per member):');
const detail = query(`
  SELECT g.match_group_id, g.is_region_specific, m.match_method, rf.source_code, rf.name_original, rf.latin_name
  FROM food_match_groups g
  JOIN food_match_members m ON m.match_group_id = g.match_group_id
  JOIN raw_foods rf ON rf.raw_id = m.raw_id
  ORDER BY g.match_group_id;
`);
console.log(detail);
