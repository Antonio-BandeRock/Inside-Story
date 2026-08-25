// Writes the conditionCautions output of compute_recipe_condition_data.js
// into lib/digest/recipes.ts as a new recipeCard.conditionCautions field,
// 2026-08-24 direct correction: "What they can eat is exactly that,
// everything they can eat, at the levels of healing that they need to
// start from and achieve along the way." See compute_recipe_condition_
// data.js's own header comment for the full reasoning -- this is the
// data half of fixing "Meals You Can Eat" from a hard include/exclude
// gate into a real, honest advisory view of every recipe.
//
// Deliberately a NEW, separate script rather than extending
// apply_recipe_condition_data.js: that script's own conditionNotes-
// appending logic is append-only and already proven NOT idempotent (see
// CLAUDE.md's own 2026-08-24 migraine entry -- re-running it duplicated
// stage-advisory notes on a second pass). This script only ever touches
// safeForConditions (already idempotent -- always overwrites the whole
// line) and a new conditionCautions line placed directly after it, which
// this script detects and replaces in place if already present, so it is
// safe to re-run as many times as this feature needs tuning.
//
// 2026-08-25, direct correction: each caution now carries a real
// severity ('yellow' | 'red'), not just a plain sentence -- "All of the
// conditions list all 300 meals saying they can eat all of them. That
// cannot be." See compute_recipe_condition_data.js's own header comment
// for the full reasoning. The idempotent replace-in-place logic below
// needed no changes for this -- it already treats the whole
// conditionCautions object as one opaque block to detect and swap.
//
// Usage: node scripts/apply_recipe_condition_cautions.js

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
const DATA_PATH = path.join(__dirname, '_recipe_condition_data_output.json');

const dataById = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const lines = fs.readFileSync(RECIPES_PATH, 'utf8').split('\n');

function jsStringLiteral(s) {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

// 2026-08-25, direct correction: each caution is now {severity, note},
// not a plain string -- see compute_recipe_condition_data.js's own
// header comment and RecipeCard.conditionCautions' own comment
// (lib/digest/types.ts) for why. severity is one of exactly two real
// string literals ('yellow' | 'red'), safe to write unquoted-key/
// quoted-value the same way every other field in this file already is.
function buildCautionsObjectLiteral(indent, cautions) {
  const codes = Object.keys(cautions);
  if (codes.length === 0) return `${indent}conditionCautions: {},`;
  const entries = codes.map(
    (code) =>
      `${indent}  ${code}: { severity: ${jsStringLiteral(cautions[code].severity)}, note: ${jsStringLiteral(cautions[code].note)} },`,
  );
  return [`${indent}conditionCautions: {`, ...entries, `${indent}},`].join('\n');
}

const idLineRe = /^\s*linkedCuratedRecipeId:\s*'([^']+)',\s*$/;
const safeForLineRe = /^(\s*)safeForConditions:\s*\[[^\]]*\],\s*$/;
const cautionsSingleLineRe = /^(\s*)conditionCautions:\s*\{\},\s*$/;
const cautionsOpenRe = /^(\s*)conditionCautions:\s*\{\s*$/;

let pendingId = null;
let applied = 0;
let replaced = 0;
const out = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const idMatch = line.match(idLineRe);
  if (idMatch) {
    pendingId = idMatch[1];
    out.push(line);
    continue;
  }

  const safeForMatch = line.match(safeForLineRe);
  if (safeForMatch && pendingId) {
    out.push(line);
    const data = dataById[pendingId];
    if (!data) throw new Error(`No computed condition data for recipe id "${pendingId}" (line ${i + 1})`);
    const indent = safeForMatch[1];

    // Look ahead: is a conditionCautions field already present right
    // after this line (from a prior run of this script)? If so, replace
    // it in place rather than insert a second copy.
    const next = lines[i + 1];
    if (next && cautionsSingleLineRe.test(next)) {
      out.push(buildCautionsObjectLiteral(indent, data.conditionCautions));
      i += 1;
      replaced += 1;
    } else if (next && cautionsOpenRe.test(next)) {
      let j = i + 1;
      const closeRe = new RegExp(`^${indent}\\},\\s*$`);
      while (j < lines.length && !closeRe.test(lines[j])) j += 1;
      out.push(buildCautionsObjectLiteral(indent, data.conditionCautions));
      i = j;
      replaced += 1;
    } else {
      out.push(buildCautionsObjectLiteral(indent, data.conditionCautions));
      applied += 1;
    }
    continue;
  }

  out.push(line);
}

fs.writeFileSync(RECIPES_PATH, out.join('\n'), 'utf8');
console.log(`Inserted conditionCautions on ${applied} recipes; replaced an existing field on ${replaced}.`);
