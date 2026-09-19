/* global __dirname */
// Writes the output of compute_recipe_diet_tags.js into
// lib/digest/recipes.ts as each entry's own recipeCard.dietTags field.
// Line-anchored, not a blind regex replace: for every
// `linkedCuratedRecipeId: '<id>',` line, finds that entry's own
// following `recipeCard: {` line and inserts a `dietTags: [...]` line
// directly after it, matching RecipeCard's own field order in types.ts.
//
// 2026-09-19: this used to insert without looking, which made it a
// one-shot script. Running it a second time gave all 456 entries two
// dietTags lines and a TS1117 on each, found by tsc rather than by the
// script. Any dietTags line already in the file is dropped first now, so
// the script can be re-run after a batch of new recipes the way the rest
// of the pipeline can.
//
// Usage: node scripts/apply_recipe_diet_tags.js

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
const TAGS_PATH = path.join(__dirname, '_recipe_diet_tags_output.json');

const tagsById = JSON.parse(fs.readFileSync(TAGS_PATH, 'utf8'));
const lines = fs.readFileSync(RECIPES_PATH, 'utf8').split('\n');

const idLineRe = /^\s*linkedCuratedRecipeId:\s*'([^']+)',\s*$/;
const cardLineRe = /^(\s*)recipeCard:\s*\{\s*$/;
// dietTags is always written as one inline line, by this script and by
// every generator that seeds a new entry with an empty one.
const dietTagsLineRe = /^\s*dietTags:\s*\[.*\],\s*$/;

let applied = 0;
let replaced = 0;
let pendingId = null;
const out = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (dietTagsLineRe.test(line)) { replaced += 1; continue; }
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
    const tags = tagsById[pendingId];
    if (!tags) {
      throw new Error(`No computed diet tags found for recipe id "${pendingId}" (line ${i + 1})`);
    }
    const tagList = tags.map((t) => `'${t}'`).join(', ');
    out.push(`${indent}dietTags: [${tagList}],`);
    applied += 1;
    pendingId = null;
    continue;
  }
  out.push(line);
}

fs.writeFileSync(RECIPES_PATH, out.join('\n'), 'utf8');
console.log(`Applied dietTags to ${applied} recipeCard entries (${replaced} existing lines replaced).`);
