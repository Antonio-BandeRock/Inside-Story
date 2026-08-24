// Writes the output of compute_recipe_condition_data.js into
// lib/digest/recipes.ts: a new recipeCard.safeForConditions field on
// every entry, and real, computed stage-advisory notes appended to each
// recipe's own EXISTING conditionNotes array (never replacing the
// hand-written ones already there).
//
// Line-anchored, not a blind regex replace: walks the file tracking
// which recipe id each `recipeCard: {` block belongs to (via the
// `linkedCuratedRecipeId:` line immediately above it, same pattern
// apply_recipe_diet_tags.js already established), then handles
// conditionNotes' own two real shapes -- `conditionNotes: [],` (empty,
// inline) and `conditionNotes: [` ... `      ],` (populated, one entry
// per line) -- inserting new entries into whichever shape is present
// rather than assuming one.
//
// Usage: node scripts/apply_recipe_condition_data.js

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
const DATA_PATH = path.join(__dirname, '_recipe_condition_data_output.json');

const dataById = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const lines = fs.readFileSync(RECIPES_PATH, 'utf8').split('\n');

function jsStringLiteral(s) {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const idLineRe = /^\s*linkedCuratedRecipeId:\s*'([^']+)',\s*$/;
const cardLineRe = /^(\s*)recipeCard:\s*\{\s*$/;
const conditionNotesEmptyRe = /^(\s*)conditionNotes:\s*\[\],\s*$/;
const conditionNotesOpenRe = /^(\s*)conditionNotes:\s*\[\s*$/;

let pendingId = null;
let appliedSafeFor = 0;
let appliedNotes = 0;
const out = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const idMatch = line.match(idLineRe);
  if (idMatch) {
    pendingId = idMatch[1];
    out.push(line);
    continue;
  }

  const cardMatch = line.match(cardLineRe);
  if (cardMatch && pendingId) {
    out.push(line);
    const indent = cardMatch[1] + '  ';
    const data = dataById[pendingId];
    if (!data) throw new Error(`No computed condition data for recipe id "${pendingId}" (line ${i + 1})`);
    const list = data.safeForConditions.map((c) => `'${c}'`).join(', ');
    out.push(`${indent}safeForConditions: [${list}],`);
    appliedSafeFor += 1;
    continue;
  }

  const emptyMatch = line.match(conditionNotesEmptyRe);
  if (emptyMatch && pendingId) {
    const data = dataById[pendingId];
    const notes = data.stageAdvisoryNotes;
    if (notes.length === 0) {
      out.push(line);
    } else {
      const indent = emptyMatch[1];
      out.push(`${indent}conditionNotes: [`);
      for (const note of notes) {
        out.push(`${indent}  { condition: ${jsStringLiteral(note.condition)}, note: ${jsStringLiteral(note.note)} },`);
      }
      out.push(`${indent}],`);
      appliedNotes += notes.length;
    }
    // conditionNotes is the last real signal needed per recipe -- clear
    // pendingId so a stray unmatched later line can't misattribute.
    pendingId = null;
    continue;
  }

  const openMatch = line.match(conditionNotesOpenRe);
  if (openMatch && pendingId) {
    const indent = openMatch[1];
    const closeRe = new RegExp(`^${indent}\\],\\s*$`);
    out.push(line);
    // Copy every existing hand-written entry through unchanged.
    i += 1;
    while (i < lines.length && !closeRe.test(lines[i])) {
      out.push(lines[i]);
      i += 1;
    }
    // lines[i] is now the closing `      ],` line -- append new notes
    // before it rather than after, so real content stays contiguous.
    const data = dataById[pendingId];
    const notes = data.stageAdvisoryNotes;
    for (const note of notes) {
      out.push(`${indent}  { condition: ${jsStringLiteral(note.condition)}, note: ${jsStringLiteral(note.note)} },`);
    }
    appliedNotes += notes.length;
    out.push(lines[i]);
    pendingId = null;
    continue;
  }

  out.push(line);
}

fs.writeFileSync(RECIPES_PATH, out.join('\n'), 'utf8');
console.log(`Applied safeForConditions to ${appliedSafeFor} recipes; appended ${appliedNotes} real stage-advisory notes.`);
