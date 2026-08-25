// A small, idempotent, targeted patch -- 2026-08-24, follow-up to
// add_migraine_condition_relevance.js. Re-running the original
// apply_recipe_condition_data.js against an ALREADY-populated recipes.ts
// (as this session's own first attempt just did) turned out not to be
// idempotent: it blindly inserts a fresh safeForConditions line and
// re-appends the stage-advisory notes every time, producing real
// duplicates on a second run rather than updating in place, caught
// immediately by a direct line-count check before committing anything
// broken.
//
// The actual change needed is much smaller than a full reapply: only
// safeForConditions changes (every recipe now includes 'migraine', per
// compute_recipe_condition_data.js's own freshly recomputed output --
// Migraine's own only two relevant sub-criteria, Additives/Processing,
// never reach a flagged tier anywhere in this app's whole-food-only
// curated-recipe set). stageAdvisoryNotes is untouched -- Migraine has
// no real staging model, so it was never part of that computation
// either. This script edits ONLY the existing safeForConditions line
// per recipe, parsing its current array, adding 'migraine' if genuinely
// missing, and re-sorting -- conditionNotes is never touched.
//
// Usage: node scripts/add_migraine_to_recipe_condition_lists.js

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
const lines = fs.readFileSync(RECIPES_PATH, 'utf8').split('\n');

const lineRe = /^(\s*safeForConditions: \[)([^\]]*)(\],\s*)$/;
let changed = 0;
let alreadyPresent = 0;

const out = lines.map((line) => {
  const m = line.match(lineRe);
  if (!m) return line;
  const [, prefix, inner, suffix] = m;
  const codes = inner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^'|'$/g, ''));
  if (codes.includes('migraine')) {
    alreadyPresent += 1;
    return line;
  }
  codes.push('migraine');
  codes.sort();
  changed += 1;
  return `${prefix}${codes.map((c) => `'${c}'`).join(', ')}${suffix}`;
});

if (changed === 0 && alreadyPresent === 0) {
  throw new Error('No safeForConditions lines matched at all -- pattern mismatch, aborting without writing.');
}

fs.writeFileSync(RECIPES_PATH, out.join('\n'), 'utf8');
console.log(`Added 'migraine' to ${changed} safeForConditions lines (${alreadyPresent} already had it).`);
