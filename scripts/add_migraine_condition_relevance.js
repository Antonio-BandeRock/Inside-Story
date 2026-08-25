// Adds a real, citable condition-relevance mapping for Migraine to the
// live reference database -- 2026-08-24, direct follow-up to the AIP/
// migraine research just published in lib/digest/migraine.ts: "Yes,
// build that migraine relevance mapping."
//
// Migraine previously had ZERO rows in sub_criterion_condition_relevance
// (and no home-owned sub-criteria either), confirmed by direct query
// before this script was written -- the reason it was excluded from
// both the diet-tag "safe for condition" computation and the "Meals You
// Can Eat" Digest topic shipped earlier the same day.
//
// Scope, deliberately narrow rather than forced: only Additives and
// Processing get a real Migraine row, reusing the exact same two
// sub-criteria IBD/Gout/CVD/etc. already reuse under their own
// condition-specific framing (a well-established, real pattern in this
// table, not a new one invented here). The histamine/DAO-deficiency
// mechanism also researched the same day is deliberately NOT mapped to
// any existing sub-criterion -- no sub-criterion in this database
// measures histamine content specifically ("Fermentability" is a real
// but unrelated FODMAP measure, and "Microbiome Effects" scores
// fermented foods POSITIVELY for their prebiotic value, the opposite
// direction a histamine caution would need) -- forcing either would
// misapply a criterion built for a different purpose, directly against
// this app's own standing "don't force a citation that doesn't really
// support the claim" discipline (see lib/conditionStages.ts's own
// header comment, and lib/ckdStageAdvisory.ts's own precedent of
// deliberately NOT adding a potassium flag for the same reason).
//
// Every claim here traces directly to the two new migraine.ts entries'
// own real citations, not re-researched: the 2025 IgG-based elimination
// diet RCT (PMID 41473187, measured drops in IL-6/TNF-alpha/CGRP after
// eliminating flagged trigger foods) and the 2024 gut-to-brain mechanism
// review (PMID 39064664, increased intestinal permeability letting
// inflammatory molecules reach the trigeminovascular system).
//
// Usage: node scripts/add_migraine_condition_relevance.js

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

const existing = execFileSync(
  SQLITE3,
  [DB, "SELECT COUNT(*) FROM sub_criterion_condition_relevance WHERE condition_code = 'migraine';"],
  { encoding: 'utf8' },
).trim();
if (existing !== '0') {
  throw new Error(`Expected zero existing Migraine relevance rows, found ${existing}. Aborting rather than risk a duplicate insert.`);
}

const additivesNote = esc(
  "A 2025 randomized, sham-controlled trial found eliminating flagged trigger foods produced a measured drop in IL-6, TNF-alpha, and CGRP itself, the neuropeptide behind an actual migraine attack, alongside fewer migraine days and lower severity scores over 12 weeks. Additive content is a practical proxy for how far a food sits from the kind of minimally processed eating that trial's own elimination approach moved toward.",
);
const processingNote = esc(
  "A 2024 review names the pathway connecting a processed, gut-disrupting diet to a migraine attack directly: increased intestinal permeability lets inflammatory molecules pass into systemic circulation, where they stimulate the trigeminovascular system, the nerve pathway an attack runs through. Processing level is a practical proxy for how much a food contributes to that gut-disruption side of the pathway.",
);

const additivesCitation = esc(
  'Food-specific IgG-based elimination diet decreased IL-6, TNF-alpha, and CGRP and improved symptoms in adults with migraine, Frontiers in Nutrition, PMID 41473187.',
);
const processingCitation = esc('The Brain, the Eating Plate, and the Gut Microbiome: Partners in Migraine Pathogenesis, PMID 39064664.');

run(`
  INSERT INTO sub_criterion_condition_relevance (sub_criterion_id, condition_code, dimension_label, relevance_note, citation)
  SELECT id, 'migraine', 'Elimination-Diet Inflammatory Signal', '${additivesNote}', '${additivesCitation}'
  FROM sub_criteria WHERE sub_criterion = 'Additives' AND home_condition_code = 'hashimotos';
`);

run(`
  INSERT INTO sub_criterion_condition_relevance (sub_criterion_id, condition_code, dimension_label, relevance_note, citation)
  SELECT id, 'migraine', 'Gut-to-Brain Inflammatory Pathway', '${processingNote}', '${processingCitation}'
  FROM sub_criteria WHERE sub_criterion = 'Processing' AND home_condition_code = 'hashimotos';
`);

const verify = execFileSync(
  SQLITE3,
  [
    DB,
    "SELECT sc.sub_criterion, scr.dimension_label FROM sub_criterion_condition_relevance scr JOIN sub_criteria sc ON sc.id = scr.sub_criterion_id WHERE scr.condition_code = 'migraine' ORDER BY sc.sub_criterion;",
  ],
  { encoding: 'utf8' },
);
console.log('Migraine relevance rows now present:');
console.log(verify);
