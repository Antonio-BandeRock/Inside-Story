// Checks G5 of the competitive build plan (Phase 2, 2026-09-26): making a
// recipe for more than one, and a planned meal's number of people on the
// grocery list. Amounts scale by the ratio to the recipe's servings, the
// hand-off to a builder is read once, a meal's number replaces the list's
// rather than multiplying it, and nothing said carries a verdict. Exits
// non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const M = load('lib/makeItFor.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

const soup = { id: 'soup', servings: 1, ingredients: [{ name: 'lentils', quantity: 100 }, { name: 'salt', quantity: 0.1 }] };
const bread = { id: 'bread', servings: 2, ingredients: [{ name: 'flour', quantity: 300 }] };

check('clamp low', M.clampMakeFor(0), 1);
check('clamp high', M.clampMakeFor(99), M.MAX_MAKE_FOR);
check('clamp rounds', M.clampMakeFor(3.6), 4);
check('clamp NaN', M.clampMakeFor(NaN), 1);

check('same count returns the recipe unchanged', M.scaleRecipeFor(soup, 1) === soup, true);
check('four people', M.scaleRecipeFor(soup, 4).ingredients.map((i) => i.quantity), [400, 0.4]);
check('servings set to the count', M.scaleRecipeFor(soup, 4).servings, 4);
check('no float noise', M.scaleRecipeFor(soup, 3).ingredients[1].quantity, 0.3);
check('two-serving recipe for six', M.scaleRecipeFor(bread, 6).ingredients[0].quantity, 900);
check('two-serving recipe for one halves', M.scaleRecipeFor(bread, 1).ingredients[0].quantity, 150);
check('zero servings read as one', M.scaleRecipeFor({ servings: 0, ingredients: [{ quantity: 5 }] }, 2).ingredients[0].quantity, 10);
check('original untouched', soup.ingredients[0].quantity, 100);

M.setPendingMakeFor('soup', 3);
check('hand-off read', M.takeMadeFor(soup, 'soup').ingredients[0].quantity, 300);
check('hand-off read once', M.takeMadeFor(soup, 'soup') === soup, true);
M.setPendingMakeFor('soup', 2);
check('other recipe not touched', M.takeMadeFor(bread, 'bread') === bread, true);
check('null recipe stays null and clears', M.takeMadeFor(null, 'soup'), null);
check('cleared after null', M.takePendingMakeFor('soup'), null);

check('label one', M.makeForLabel(1), 'Make it for 1 person');
check('label many', M.makeForLabel(4), 'Make it for 4 people');
check('no caption at one', M.makeForCaption(1), null);
check('caption', M.makeForCaption(4), 'Every amount opens multiplied by 4, and the dish is saved as 4 servings.');

check('meal follows list', M.mealServingFactor(null, 2), 2);
check('meal replaces list, not multiplied', M.mealServingFactor(6, 2), 6);
check('meal zero follows list', M.mealServingFactor(0, 3), 3);
check('list below one reads as one', M.mealServingFactor(undefined, 0), 1);
check('row label', M.mealServingsLabel(6), 'For 6 people');
check('row label one', M.mealServingsLabel(1), 'For 1 person');
check('no row label when following', M.mealServingsLabel(null), null);
check('choices start with the list', M.MEAL_SERVING_CHOICES[0], { value: null, label: 'Same as the grocery list' });
check('choices run to twelve', M.MEAL_SERVING_CHOICES.length, 13);

const FORBIDDEN = /\b(great|good|bad|well done|ideal|optimal|should|must|healthy|unhealthy|real|genuine|genuinely|own)\b|[–—]| -- /i;
const samples = [
  M.makeForLabel(1),
  M.makeForLabel(5),
  M.makeForCaption(5),
  M.mealServingsLabel(3),
  ...M.MEAL_SERVING_CHOICES.map((choice) => choice.label),
];
for (const line of samples) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(`${total - failures}/${total} checks passed`);
if (failures > 0) process.exit(1);
