// A genuinely idempotent sibling to apply_recipe_condition_data.js's own
// stage-advisory-note step -- 2026-08-27, direct question: "are we
// accounting for [healing stages people have already gotten through]
// throughout the entire stock of system recipes?" Extending
// FOOD_RELEVANT_HEALING_STAGES to cover Rebalancing/Maintenance (see
// lib/healingStage.ts's own comment) meant every recipe's own computed
// stageAdvisoryNotes now includes real new entries for those two stages
// alongside the already-applied Digging/Gut Repair ones -- but the
// original apply_recipe_condition_data.js unconditionally APPENDS every
// computed note every time it runs, which is exactly why CLAUDE.md's own
// history already documents it as unsafe to re-run (it would duplicate
// the already-applied Digging/Gut Repair notes, not just add the new
// Rebalancing/Maintenance ones).
//
// This script instead checks each recipe's own CURRENT conditionNotes
// array in recipes.ts and only appends a computed note whose exact
// `condition` string doesn't already exist there -- genuinely safe to
// run again later (a second run is a real no-op, not just assumed safe),
// and reusable for any future stage/condition note additions, not a
// one-off patch scoped to just this one fix.
//
// Usage: node scripts/apply_new_stage_advisory_notes.js
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
const conditionNotesEmptyRe = /^(\s*)conditionNotes:\s*\[\],\s*$/;
const conditionNotesOpenRe = /^(\s*)conditionNotes:\s*\[\s*$/;
const noteConditionRe = /condition:\s*'((?:[^'\\]|\\.)*)'/;

let pendingId = null;
let appliedNotes = 0;
let recipesTouched = 0;
const out = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const idMatch = line.match(idLineRe);
  if (idMatch) {
    pendingId = idMatch[1];
    out.push(line);
    continue;
  }

  const emptyMatch = line.match(conditionNotesEmptyRe);
  if (emptyMatch && pendingId) {
    const data = dataById[pendingId];
    const notes = data ? data.stageAdvisoryNotes : [];
    if (!data || notes.length === 0) {
      out.push(line);
    } else {
      const indent = emptyMatch[1];
      out.push(`${indent}conditionNotes: [`);
      for (const note of notes) {
        out.push(`${indent}  { condition: ${jsStringLiteral(note.condition)}, note: ${jsStringLiteral(note.note)} },`);
      }
      out.push(`${indent}],`);
      appliedNotes += notes.length;
      recipesTouched += 1;
    }
    pendingId = null;
    continue;
  }

  const openMatch = line.match(conditionNotesOpenRe);
  if (openMatch && pendingId) {
    const indent = openMatch[1];
    const closeRe = new RegExp(`^${indent}\\],\\s*$`);
    out.push(line);
    const existingConditions = new Set();
    i += 1;
    while (i < lines.length && !closeRe.test(lines[i])) {
      const noteMatch = lines[i].match(noteConditionRe);
      if (noteMatch) existingConditions.add(noteMatch[1].replace(/\\'/g, "'"));
      out.push(lines[i]);
      i += 1;
    }
    // lines[i] is now the closing `      ],` line -- append only the
    // genuinely new notes (not already present by exact condition text)
    // before it, so a second run of this script is a real no-op.
    const data = dataById[pendingId];
    const notes = data ? data.stageAdvisoryNotes : [];
    let addedHere = 0;
    for (const note of notes) {
      if (existingConditions.has(note.condition)) continue;
      out.push(`${indent}  { condition: ${jsStringLiteral(note.condition)}, note: ${jsStringLiteral(note.note)} },`);
      addedHere += 1;
    }
    if (addedHere > 0) recipesTouched += 1;
    appliedNotes += addedHere;
    out.push(lines[i]);
    pendingId = null;
    continue;
  }

  out.push(line);
}

fs.writeFileSync(RECIPES_PATH, out.join('\n'), 'utf8');
console.log(`Appended ${appliedNotes} genuinely new stage-advisory notes across ${recipesTouched} recipes.`);
