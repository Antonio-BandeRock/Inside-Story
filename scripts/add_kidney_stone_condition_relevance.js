// Adds real, citable condition-relevance mappings for kidney-stone risk
// to the live reference database -- 2026-08-26, direct follow-up to a
// shared Google AI Mode conversation researching what causes kidney
// stones, and to the same day's own oxalate-severity-scoring fix (see
// CLAUDE.md, "The Rule Engine" standing rule): "these topics... need to
// be added to the conditions as they apply."
//
// Oxalate Load Rank and its own Oxalate Tolerance Note (the two real
// sub-criteria the same-day fix already made the correct drivers of
// oxalate severity for Hashimoto's) are extended to two more real,
// verified conditions here -- Chronic Kidney Disease and IBD -- each
// with its own real, condition-specific mechanism and citation, not a
// blind copy of Hashimoto's own framing:
//
//   Chronic Kidney Disease: calcium oxalate is the single most common
//   kidney stone type, and kidney stones are a real, established
//   contributor to progressive kidney damage through recurrent
//   obstruction -- the most direct real connection of any tracked
//   condition to this exact scoring dimension.
//
//   IBD: enteric hyperoxaluria is a real, documented complication
//   specific to Crohn's disease and ulcerative colitis (and more so
//   after bowel resection) -- fat malabsorption lets dietary fat bind
//   the calcium that would otherwise bind oxalate in the gut, leaving
//   free oxalate to be absorbed and reach the kidneys instead.
//
// Deliberately NOT mapped to Gout: gout's own real kidney-stone
// connection runs through URIC ACID stones (purine metabolism, already
// its own real, separate mechanism), not calcium oxalate -- forcing an
// oxalate mapping onto Gout would misapply a criterion built for a
// different real mechanism, directly against this app's own standing
// "don't force a citation that doesn't really support the claim"
// discipline (see add_migraine_condition_relevance.js's own precedent).
//
// Every claim here is independently verified via WebSearch this same
// session, not carried over from the source conversation as-is:
// Chai & Liebman 2005 (J Agric Food Chem, DOI 10.1021/jf048128d) for the
// real 30-87% boiling-reduces-oxalate figure; Curhan et al. 1993 (NEJM,
// PMID 8441427) for the real, inverse dietary-calcium/stone-risk finding.
//
// Usage: node scripts/add_kidney_stone_condition_relevance.js

const { execFileSync } = require('child_process');
const path = require('path');

const SQLITE3 = 'C:/Users/TonyR/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const DB = path.join(__dirname, '..', 'assets', 'data', 'foods_reference.db');

function run(sql) {
  return execFileSync(SQLITE3, [DB, sql], { encoding: 'utf8' });
}

function esc(s) {
  return s.replace(/'/g, "''");
}

for (const conditionCode of ['chronic_kidney_disease', 'ibd']) {
  const existing = execFileSync(
    SQLITE3,
    [DB, `SELECT COUNT(*) FROM sub_criterion_condition_relevance WHERE condition_code = '${conditionCode}' AND sub_criterion_id IN (SELECT id FROM sub_criteria WHERE sub_criterion LIKE 'Oxalate%');`],
    { encoding: 'utf8' },
  ).trim();
  if (existing !== '0') {
    throw new Error(`Expected zero existing Oxalate relevance rows for ${conditionCode}, found ${existing}. Aborting rather than risk a duplicate insert.`);
  }
}

const ckdNote = esc(
  'Calcium oxalate is the single most common kidney stone type in the general population, and recurrent kidney stones are a real, established contributor to progressive kidney damage through repeated obstruction and infection risk. A high-oxalate food is worth the same real, calibrated caution here as for Hashimoto\'s, cooked (boiled, water discarded) rather than avoided outright, and paired with a calcium source at the same meal.',
);
const ckdCitation = esc(
  'Curhan GC, Willett WC, Rimm EB, Stampfer MJ. A prospective study of dietary calcium and other nutrients and the risk of symptomatic kidney stones. N Engl J Med. 1993, PMID 8441427.',
);

const ibdNote = esc(
  'Enteric hyperoxaluria is a real, documented complication specific to Crohn\'s disease and ulcerative colitis, more so after a bowel resection: fat malabsorption lets dietary fat bind the calcium that would otherwise bind oxalate in the gut, leaving free oxalate to be absorbed and reach the kidneys as a real kidney-stone risk. The same real, calibrated caution applies: cook (boil, discard the water) rather than avoid outright, and pair with a calcium source at the same meal.',
);
const ibdCitation = esc(
  'Metabolic Profile of Calcium Oxalate Stone Patients with Enteric Hyperoxaluria and Impact of Dietary Intervention, PMC11357492.',
);

for (const [conditionCode, dimensionLabel, note, citation] of [
  ['chronic_kidney_disease', 'Kidney Stone Risk', ckdNote, ckdCitation],
  ['ibd', 'Enteric Hyperoxaluria Risk', ibdNote, ibdCitation],
]) {
  run(`
    INSERT INTO sub_criterion_condition_relevance (sub_criterion_id, condition_code, dimension_label, relevance_note, citation)
    SELECT id, '${conditionCode}', '${dimensionLabel}', '${note}', '${citation}'
    FROM sub_criteria WHERE sub_criterion IN ('Oxalate Level', 'Oxalate Load Rank', 'Oxalate Tolerance Note') AND home_condition_code = 'hashimotos';
  `);
}

const verify = execFileSync(
  SQLITE3,
  [
    DB,
    "SELECT scr.condition_code, sc.sub_criterion, scr.dimension_label FROM sub_criterion_condition_relevance scr JOIN sub_criteria sc ON sc.id = scr.sub_criterion_id WHERE scr.condition_code IN ('chronic_kidney_disease', 'ibd') AND sc.sub_criterion LIKE 'Oxalate%' ORDER BY scr.condition_code, sc.sub_criterion;",
  ],
  { encoding: 'utf8' },
);
console.log('Kidney-stone relevance rows now present:');
console.log(verify);
