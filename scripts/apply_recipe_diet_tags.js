// Writes the output of compute_recipe_diet_tags.js into
// lib/digest/recipes.ts as each entry's own recipeCard.dietTags field.
// Line-anchored, not a blind regex replace: for every
// `linkedCuratedRecipeId: '<id>',` line, finds that entry's own
// following `recipeCard: {` line and inserts a `dietTags: [...]` line
// directly after it, matching RecipeCard's own field order in types.ts.
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

let applied = 0;
let pendingId = null;
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
console.log(`Applied dietTags to ${applied} recipeCard entries.`);
