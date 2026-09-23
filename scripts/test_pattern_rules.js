// Runs lib/patternRules.ts: the wording the Pattern Finder proposes when
// somebody turns something it noticed into one of their own rules, and
// which of those rules the engine can actually check afterwards.
//
// Built 2026-09-23, closing the one piece deliberately left out of the
// 2026-08-18 rules-engine build.
//
// The rules checked:
//
//  1. The keyword is the food itself, not its preparation, because the
//     engine matches it as a substring of whatever was logged.
//  2. A food proposal carries the count from the person's data and nothing
//     that reads as a verdict: no causation, no instruction, no advice.
//  3. Singular and plural read correctly at one flare and at many.
//  4. A food proposal is linked and says it will stay quiet on other days.
//  5. A scoring-factor and a category proposal are unlinked, and both say
//     plainly that they will show every day until paused.
//  6. A scoring-factor proposal names the condition it matters for, so the
//     saved rule still makes sense months later on a screen that has no
//     Pattern Finder next to it.
//
// Run with: node scripts/test_pattern_rules.js
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

const P = loadModule('lib/patternRules.ts');
const { keywordFromFoodName, proposeFoodPatternRule, proposeDimensionPatternRule, proposeCategoryPatternRule } = P;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(name, actual) {
  check(name, actual === true, true);
}

// 1. The keyword is the food, not the preparation.
check('plain name is its own keyword', keywordFromFoodName('Broccoli'), 'Broccoli');
check('preparation after the comma is dropped', keywordFromFoodName('Broccoli, cooked, boiled, drained'), 'Broccoli');
check('surrounding space is trimmed', keywordFromFoodName('  Kale , raw'), 'Kale');
check('a name with no comma survives whole', keywordFromFoodName('Greek yogurt'), 'Greek yogurt');

// 2. A food proposal states the count and nothing that reads as a verdict.
const food = proposeFoodPatternRule({
  foodName: 'Broccoli, raw',
  keyword: 'Broccoli',
  occurrenceCount: 4,
  totalSymptomInstances: 11,
});
check(
  'the proposed wording is the count from their data',
  food.description,
  'Broccoli, raw was in what I ate before 4 of my 11 logged flares or reactions.',
);
const verdictWords = ['avoid', 'caus', 'stop eating', 'trigger', 'should not', 'bad for', 'allergic'];
checkTrue(
  'nothing in the proposal reads as a verdict',
  verdictWords.every((word) => !food.description.toLowerCase().includes(word)),
);

// 3. Singular and plural.
const single = proposeFoodPatternRule({
  foodName: 'Kale',
  keyword: 'Kale',
  occurrenceCount: 1,
  totalSymptomInstances: 1,
});
checkTrue('one flare reads singular', single.description.endsWith('before 1 of my 1 logged flare or reaction.'));
checkTrue('several flares read plural', food.description.endsWith('before 4 of my 11 logged flares or reactions.'));

// 4. A food proposal is linked, and says when it will be quiet.
check('a food rule is food-linked', food.linkType, 'food');
check('the link value is the keyword', food.linkValue, 'Broccoli');
check('the link label matches', food.linkLabel, 'Broccoli');
checkTrue('the note names the keyword', food.checkNote.includes('"Broccoli"'));
checkTrue('the note says it stays quiet otherwise', food.checkNote.includes('quiet'));
checkTrue('the note says where it will appear', food.checkNote.includes('Insights > My Meds'));

// A missing base name falls back to the food name rather than saving an
// empty keyword, which would match every meal ever logged.
const fallback = proposeFoodPatternRule({
  foodName: 'Cheddar cheese, aged',
  keyword: '   ',
  occurrenceCount: 2,
  totalSymptomInstances: 5,
});
check('an empty keyword falls back to the food', fallback.linkValue, 'Cheddar cheese');

// 5 and 6. Scoring factors and categories are unlinked and say so.
const dimension = proposeDimensionPatternRule({
  subCriterion: 'Goitrogen Load',
  tier: 'High',
  conditionName: "Hashimoto's Thyroiditis",
  occurrenceCount: 4,
  totalSymptomInstances: 11,
});
check(
  'a scoring factor names itself, its tier and its condition',
  dimension.description,
  "Goitrogen Load (High) showed up in what I ate before 4 of my 11 logged flares or reactions. It matters for Hashimoto's Thyroiditis.",
);
check('a scoring factor is unlinked', dimension.linkType, 'none');
check('an unlinked rule carries no link value', [dimension.linkValue, dimension.linkLabel], [null, null]);
checkTrue('it says plainly that it shows every day', dimension.checkNote.includes('every day until you pause it'));

const category = proposeCategoryPatternRule({
  category: 'Cruciferous Vegetables',
  occurrenceCount: 3,
  totalSymptomInstances: 9,
});
check(
  'a category proposal reads as one food from that group',
  category.description,
  'Something from Cruciferous Vegetables was in what I ate before 3 of my 9 logged flares or reactions.',
);
check('a category is unlinked too', category.linkType, 'none');
check('both unlinked kinds give the same warning', category.checkNote, dimension.checkNote);

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
