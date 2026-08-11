// Applies the real, individually-verified fixes in
// data/translation-corrections.json to raw_foods.name_english -- see that
// file's own header comment for the full "why" behind every one of these
// 11 records. This is a genuinely different kind of fix from
// apply-audit-decisions.js: that script applies a HUMAN'S real judgment
// call (is this a whole food or not); this one corrects a real DATA ERROR
// (the machine translation itself was factually wrong), which is why it
// writes to raw_foods.name_english directly rather than
// whole_food_classifications.
//
// Usage: node apply-translation-corrections.js
//   (no argument needed -- always reads data/translation-corrections.json)
//
// Real safety behavior: each UPDATE only fires when the row's CURRENT
// name_english still matches the exact wrong_translation this correction
// was written against -- if someone already re-translated or manually
// fixed that row since, this script leaves it alone rather than blindly
// overwriting a possibly-newer, possibly-different value. Reported as a
// real "skipped" count, not silently ignored.
//
// A brand-new, honest provenance tag, 'translation_corrected', is set on
// every row this actually touches -- distinct from 'machine_translated'
// (never individually checked) and 'source_verified' (came from the
// source's own native English data), so a future review pass can tell at
// a glance these 11 rows have already been checked by a person.
//
// Because name_english is exactly what classify.js's own
// classifyOne() reads to decide whole-food status (see classify.js's own
// classifyRow(), which reads row.name_english first), every corrected
// row's classification is almost certainly now stale -- it was computed
// against the WRONG English text. This script re-classifies each of the
// 11 touched rows itself, right after fixing the name, using the exact
// same classifyOne() function classify.js and reclassify-all.js both
// already use, rather than leaving that for a separate manual step.

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { classifyOne } = require('./classify');

const SQLITE_EXE =
  process.env.SQLITE_EXE ||
  'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const dbPath = process.env.UNIFIED_DB_PATH || path.resolve(__dirname, '..', 'unified_foods.sqlite');
// Same real, overridable-for-testing precedent as SQLITE_EXE/UNIFIED_DB_PATH
// above -- lets a real test point this at a small, isolated corrections
// file instead of the live, 11-entry translation-corrections.json.
const correctionsPath =
  process.env.TRANSLATION_CORRECTIONS_PATH ||
  path.resolve(__dirname, 'data', 'translation-corrections.json');

function query(sql) {
  const out = execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath, '-json', sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
  return JSON.parse(out || '[]');
}

function runBatch(statements) {
  if (statements.length === 0) return;
  const sql = 'BEGIN TRANSACTION;\n' + statements.join('\n') + '\nCOMMIT;\n';
  execFileSync(SQLITE_EXE, ['-cmd', '.timeout 30000', dbPath], {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });
}

function sqlEscape(str) {
  return String(str).replace(/'/g, "''");
}

const payload = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
const corrections = payload.corrections || [];

console.log(`Applying ${corrections.length} real translation correction(s) from ${correctionsPath}`);

let applied = 0;
let skipped = 0;
const updateStatements = [];
const touchedIds = [];

for (const c of corrections) {
  const rows = query(
    `SELECT raw_id, name_english, name_original FROM raw_foods WHERE raw_id = ${c.raw_id};`
  );
  if (rows.length === 0) {
    console.log(`  SKIP raw_id ${c.raw_id}: no such row exists.`);
    skipped += 1;
    continue;
  }
  const current = rows[0].name_english;
  if (current === c.corrected_translation) {
    // Already carries the right text (a prior run of this same script
    // already applied it) -- still worth re-classifying below, in case an
    // earlier run's own reclassification step had a bug (as happened
    // once, real, on 2026-08-10: a null "needs review" result was
    // wrongly collapsed to a hard 0), so this stays idempotent and
    // self-healing rather than a one-shot fix that can go stale.
    console.log(`  Already correct raw_id ${c.raw_id}: "${current}" -- re-checking its classification anyway.`);
    touchedIds.push(c.raw_id);
    continue;
  }
  if (current !== c.wrong_translation) {
    console.log(
      `  SKIP raw_id ${c.raw_id}: current name_english ("${current}") matches neither the expected wrong translation nor the corrected one -- changed by something else, leaving it alone.`
    );
    skipped += 1;
    continue;
  }
  updateStatements.push(
    `UPDATE raw_foods SET name_english = '${sqlEscape(c.corrected_translation)}', name_english_source = 'translation_corrected' WHERE raw_id = ${c.raw_id};`
  );
  touchedIds.push(c.raw_id);
  applied += 1;
}

runBatch(updateStatements);
console.log(`\nApplied ${applied} real correction(s); skipped ${skipped}.`);

// Re-classify every row this script actually touched -- its own
// name_english just changed, so whatever classification was computed
// before (against the wrong text) is stale. This deliberately does NOT
// touch whole_food_classifications.reviewed -- these are ordinary
// translation-quality fixes, not a human whole-food judgment call, so a
// row that was reviewed=0 before stays reviewed=0 (still eligible for a
// real future review pass), and a row that was already reviewed=1 (a real
// human classify decision already made) keeps that reviewed=1 protection
// untouched -- only is_whole_food/rule_matched/auto_confidence are
// refreshed to reflect the now-correct English text.
if (touchedIds.length > 0) {
  console.log('\nRe-classifying the touched row(s) against their corrected English text...');
  const reclassifyStatements = [];
  for (const rawId of touchedIds) {
    const rows = query(
      `SELECT rf.raw_id, rf.name_original, rf.name_english, s.language AS source_language
       FROM raw_foods rf
       JOIN sources s ON s.source_code = rf.source_code
       WHERE rf.raw_id = ${rawId};`
    );
    if (rows.length === 0) continue;
    const row = rows[0];
    const englishIsNative = (row.source_language || '').toLowerCase() === 'en';
    const nameForClassification = row.name_english || (englishIsNative ? row.name_original : null);
    const hasEnglishEvidence = Boolean(nameForClassification);
    const result = classifyOne({ nameForClassification: nameForClassification || '', hasEnglishEvidence });
    // Match classify.js's own classifyRecord() convention exactly: a real
    // null result (no rule matched either way -- genuinely needs human
    // review) writes SQL NULL, not 0. Collapsing null to 0 here would
    // silently misrepresent "needs review" as a confirmed "not a whole
    // food," a real, different claim.
    const isWholeFoodSql =
      result.isWholeFood === null ? 'NULL' : result.isWholeFood ? '1' : '0';
    reclassifyStatements.push(
      `UPDATE whole_food_classifications SET is_whole_food = ${isWholeFoodSql}, rule_matched = '${sqlEscape(result.ruleMatched)}', auto_confidence = '${sqlEscape(result.autoConfidence)}', classified_at = '${new Date().toISOString()}' WHERE raw_id = ${rawId};`
    );
    console.log(`  raw_id ${rawId}: "${row.name_english}" -> isWholeFood=${result.isWholeFood === null ? 'NULL (needs review)' : result.isWholeFood} (${result.ruleMatched})`);
  }
  runBatch(reclassifyStatements);
}

// Real, final verification -- search for every one of the specific wrong
// translations this run was meant to fix, confirming zero remain, rather
// than just trusting that no error was thrown.
console.log('\nVerifying: searching for each wrong translation still in the database...');
let stillWrong = 0;
for (const c of corrections) {
  const hit = query(
    `SELECT COUNT(*) AS n FROM raw_foods WHERE name_english = '${sqlEscape(c.wrong_translation)}';`
  )[0].n;
  if (hit > 0) {
    console.log(`  STILL PRESENT (${hit}x): "${c.wrong_translation}"`);
    stillWrong += hit;
  }
}
if (stillWrong === 0) {
  console.log(`  None of the ${corrections.length} wrong translation(s) remain anywhere in the database.`);
} else {
  console.log(`  WARNING: ${stillWrong} real record(s) still carry a wrong translation this run was meant to fix.`);
}

console.log('\nDone.');
