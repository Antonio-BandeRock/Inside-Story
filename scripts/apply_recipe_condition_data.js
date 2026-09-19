/* global __dirname */
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
// 2026-09-19: this used to insert without looking, which made it a
// one-shot script, and running it twice gave every entry a second
// safeForConditions line. It is re-runnable now. An existing
// safeForConditions line is dropped before the computed one is written,
// and a conditionNotes entry carrying COMPUTED_NOTE_MARKER is dropped
// before the computed notes are appended, so the notes this pipeline
// produces are replaced while the hand-written ones are copied through
// untouched.
//
// That second half also settled a drift nobody had noticed: every
// RECIPE_PREP_OVERRIDES entry added to compute_recipe_condition_data.js
// since 2026-08-27 changed the computed output and never reached
// recipes.ts, because this script was never run again. 42 raw-goitrogen
// and raw-legume notes across 53 recipes were still on screen for dishes
// the overrides had already resolved as cooked or pickled.
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
// safeForConditions is always written as one inline line, by this script
// and by every generator that seeds a new entry with an empty one.
const safeForLineRe = /^\s*safeForConditions:\s*\[.*\],\s*$/;
// The closing sentence every stage-advisory note this pipeline writes
// carries, and the one thing that tells a computed note apart from a
// hand-written one sitting in the same array.
const COMPUTED_NOTE_MARKER = 'This is advisory only, based on this recipe';

let pendingId = null;
let appliedSafeFor = 0;
let replacedSafeFor = 0;
let appliedNotes = 0;
let droppedNotes = 0;
const out = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (safeForLineRe.test(line)) { replacedSafeFor += 1; continue; }

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
    // Copy every existing hand-written entry through unchanged, and drop
    // the ones a previous run of this script wrote, so they can be
    // rewritten from what the pipeline computes today.
    const kept = [];
    i += 1;
    while (i < lines.length && !closeRe.test(lines[i])) {
      if (lines[i].includes(COMPUTED_NOTE_MARKER)) droppedNotes += 1;
      else kept.push(lines[i]);
      i += 1;
    }
    const data = dataById[pendingId];
    const notes = data.stageAdvisoryNotes;
    const fresh = notes.map(
      (note) => `${indent}  { condition: ${jsStringLiteral(note.condition)}, note: ${jsStringLiteral(note.note)} },`,
    );
    appliedNotes += notes.length;
    if (kept.length === 0 && fresh.length === 0) {
      // Nothing left to hold, so the array closes on its own line the way
      // an untouched empty one does.
      out.push(`${indent}conditionNotes: [],`);
    } else {
      out.push(line);
      for (const entry of kept) out.push(entry);
      for (const entry of fresh) out.push(entry);
      out.push(lines[i]);
    }
    pendingId = null;
    continue;
  }

  out.push(line);
}

fs.writeFileSync(RECIPES_PATH, out.join('\n'), 'utf8');
console.log(
  `Applied safeForConditions to ${appliedSafeFor} recipes (${replacedSafeFor} existing lines replaced); `
    + `wrote ${appliedNotes} stage-advisory notes, replacing ${droppedNotes} from an earlier run.`,
);
