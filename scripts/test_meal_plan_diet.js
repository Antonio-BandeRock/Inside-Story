// Runs the eating-style question on the meal plan form (lib/mealPlanDiet.ts,
// 2026-09-27).
//
// The rules checked:
//
//  1. Profile's saved list splits into what a person eats, their style and
//     anything extra, and joins back into the same tags.
//  2. Everything (Omnivore) is no restriction, and the strictest base wins.
//  3. Every tag the recipes carry is reachable from the form.
//  4. The sentences carry no dashes and no verdict words.
//
// Run with: node scripts/test_meal_plan_diet.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const D = loadModule('lib/mealPlanDiet.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

// 1 and 2
check('split', D.splitDietPreferences(['Paleo', 'Omnivore', 'Gluten-Free']), { base: null, styles: ['Paleo'], extras: ['Gluten-Free'] });
check('strictest base', D.splitDietPreferences(['Vegetarian', 'Vegan']).base, 'Vegan');
check('unknown dropped', D.splitDietPreferences(['Keto', 'Mediterranean']), { base: null, styles: ['Mediterranean'], extras: [] });
check('tags', D.planDietTags({ base: 'Vegan', styles: ['Mediterranean'], extras: ['High-Protein'] }), ['Vegan', 'Mediterranean', 'High-Protein']);
check('empty is no restriction', D.planDietTags({ base: null, styles: [], extras: [] }), []);
check('toggle on', D.toggleTag(['Paleo'], 'AIP'), ['Paleo', 'AIP']);
check('toggle off', D.toggleTag(['Paleo', 'AIP'], 'Paleo'), ['AIP']);
check('same diet', D.sameDiet({ base: null, styles: ['Paleo'], extras: [] }, D.splitDietPreferences(['Paleo', 'Omnivore'])), true);
check('base label', D.baseChoiceLabel(null), 'Everything');

// 3. Every recipe tag except Omnivore is on the form.
const typesSource = fs.readFileSync(path.join(__dirname, '..', 'lib/digest/types.ts'), 'utf8');
const listMatch = typesSource.match(/export const RECIPE_DIET_TAGS: RecipeDietTag\[\] = \[([\s\S]*?)\];/);
const allTags = listMatch[1].match(/'([^']+)'/g).map((t) => t.slice(1, -1));
const onForm = new Set([
  ...D.BASE_DIET_CHOICES.map((c) => c.tag).filter(Boolean),
  ...D.EATING_STYLE_CHOICES.map((c) => c.tag),
  ...D.DIET_EXTRA_CHOICES.map((c) => c.tag),
]);
for (const tag of allTags) {
  if (tag === 'Omnivore') continue;
  if (!onForm.has(tag)) {
    failures++;
    console.log(`FAIL tag not on the form: ${tag}`);
  }
}

// 4. Sentences
check('describe', D.describePlanDiet({ base: 'Vegetarian', styles: ['Mediterranean'], extras: ['Gluten-Free'] }), 'Every dish fits vegetarian, Mediterranean and gluten-free eating.');
const sentences = [
  D.describePlanDiet({ base: null, styles: [], extras: [] }),
  D.describePlanDiet({ base: null, styles: ['AIP'], extras: [] }),
  D.describeDifferenceFromProfile({ base: 'Vegan', styles: [], extras: [] }, { base: null, styles: [], extras: [] }),
  ...D.BASE_DIET_CHOICES.map((c) => c.caption),
  ...D.EATING_STYLE_CHOICES.map((c) => c.caption),
  ...D.DIET_EXTRA_CHOICES.map((c) => c.caption),
];
check('no difference said when the same', D.describeDifferenceFromProfile({ base: null, styles: [], extras: [] }, { base: null, styles: [], extras: [] }), null);
const FORBIDDEN = /\b(good|bad|best|healthy|healthier|should|clean|real|genuine|genuinely)\b|[–—]| -- /i;
for (const sentence of sentences) {
  if (!sentence || FORBIDDEN.test(sentence)) {
    failures++;
    console.log(`FAIL sentence: ${sentence}`);
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('meal plan diet: all checks passed');
