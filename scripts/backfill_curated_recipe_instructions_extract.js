// One-off script (2026-08-26): extract every RecipeCard's own real,
// hand-written `instructions` array from lib/digest/recipes.ts, keyed by
// its `linkedCuratedRecipeId`, using the real TypeScript AST (not a
// fragile regex over 15,000+ lines of prose containing every kind of
// quote/apostrophe/comma imaginable). Writes the result to a JSON file
// for backfill_curated_recipe_instructions_generate_sql.js to turn into
// real UPDATE statements against the live database.
//
// Built to fix a real, confirmed bug: getCuratedRecipe() (lib/db.ts)
// never selected or returned instructions at all, so every builder's own
// "Build This Recipe"/curated-recipe-pick flow silently carried an empty
// step list into StepsEditor, no matter what real, non-plagiarized steps
// recipes.ts already had written for that exact dish. Direct report:
// "The steps aren't showing up for a fermentation called Wild-Fermented
// Blueberry, Ginger & Turmeric Tonic... I assume they wouldn't for any
// of them" -- confirmed true for all 316 curated recipes, not just
// fermentations, since getCuratedRecipe() is shared by every builder.
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const RECIPES_TS = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
const OUT_JSON = path.join(__dirname, 'recipe_instructions_by_id.json');

const source = fs.readFileSync(RECIPES_TS, 'utf8');
const sourceFile = ts.createSourceFile(RECIPES_TS, source, ts.ScriptTarget.Latest, true);

function getStringLiteralValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

const result = {};
let objectsVisited = 0;
let withLinkedId = 0;
let withInstructions = 0;

function visit(node) {
  if (ts.isObjectLiteralExpression(node)) {
    objectsVisited += 1;
    let linkedId = null;
    let recipeCardNode = null;
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name = prop.name && ts.isIdentifier(prop.name) ? prop.name.text : null;
      if (name === 'linkedCuratedRecipeId') {
        linkedId = getStringLiteralValue(prop.initializer);
      } else if (name === 'recipeCard' && ts.isObjectLiteralExpression(prop.initializer)) {
        recipeCardNode = prop.initializer;
      }
    }
    if (linkedId && recipeCardNode) {
      withLinkedId += 1;
      let instructions = null;
      for (const prop of recipeCardNode.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name && ts.isIdentifier(prop.name) ? prop.name.text : null;
        if (name === 'instructions' && ts.isArrayLiteralExpression(prop.initializer)) {
          instructions = prop.initializer.elements
            .map((el) => getStringLiteralValue(el))
            .filter((v) => v !== null);
        }
      }
      if (instructions && instructions.length > 0) {
        withInstructions += 1;
        result[linkedId] = instructions;
      }
    }
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);

fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8');
console.log(`Objects visited: ${objectsVisited}`);
console.log(`With linkedCuratedRecipeId + recipeCard: ${withLinkedId}`);
console.log(`With real, non-empty instructions: ${withInstructions}`);
console.log(`Written to ${OUT_JSON}`);
