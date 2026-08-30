// Runs lib/quickLog.ts's spoken-phrase parser against a fixed set of real
// phrases and checks each one against the amount, unit and food text it is
// supposed to produce.
//
// Built 2026-08-30 alongside quick-log phase 3 ("Say What You Ate"), and
// built because writing the parser and reading it back was not enough: the
// first version looked correct and was wrong five separate ways, every one of
// them a silently wrong NUMBER rather than a crash. "One and a half cups of
// oatmeal" came out as two items, one of them foodless. "Half a avocado" came
// out as 1.5. "A couple of eggs" came out as 3. "Three quarters of a cup"
// dropped the cup. "A banana, two eggs and 150g of salmon" glued the first two
// together, because the normalizer stripped commas before the splitter ran.
// None of those would have thrown anything; they would just have put the wrong
// amount into someone's record.
//
// Run with: node scripts/test_spoken_food_parsing.js
// Exits non-zero on any failure, so it can gate a commit the same way the
// bare-text audit does.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SOURCE = path.join(__dirname, '..', 'lib', 'quickLog.ts');

// Transpiled in memory rather than shelling out to tsc and writing files: this
// module imports nothing but a type (erased at transpile time), so the plain
// transpiler is enough and the script stays a single, side-effect-free run.
function loadQuickLog() {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: 'quickLog.ts',
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

// [phrase, [[quantity, unit, foodText], ...]]
const CASES = [
  ['two eggs and a slice of whole wheat toast', [[2, 'each', 'eggs'], [1, 'each', 'slice whole wheat toast']]],
  ['a cup of white rice', [[1, 'cup', 'white rice']]],
  // Not a list: "and" joins one food's name, so this must stay one item.
  ['macaroni and cheese', [[1, 'each', 'macaroni cheese']]],
  ['peanut butter and jelly sandwich', [[1, 'each', 'peanut butter jelly sandwich']]],
  // "and" continuing a number, not starting a new item.
  ['one and a half cups of oatmeal', [[1.5, 'cup', 'oatmeal']]],
  ['two and a quarter cups of milk', [[2.25, 'cup', 'milk']]],
  ['200 grams of chicken breast', [[200, 'g', 'chicken breast']]],
  // Fraction multiplying, with the unit two filler words away from the number.
  ['three quarters of a cup of blueberries', [[0.75, 'cup', 'blueberries']]],
  ['greek yogurt bowl', [[1, 'each', 'greek yogurt bowl']]],
  // Commas must survive normalization long enough to split on.
  [
    'I had a banana, two eggs and 150 g of salmon',
    [[1, 'each', 'banana'], [2, 'each', 'eggs'], [150, 'g', 'salmon']],
  ],
  // An article after a number is English, not another "one".
  ['half a avocado', [[0.5, 'each', 'avocado']]],
  ['a couple of eggs', [[2, 'each', 'eggs']]],
  ['an apple', [[1, 'each', 'apple']]],
  ['1/2 cup of oats', [[0.5, 'cup', 'oats']]],
  // 2026-08-30, from a real failed attempt that logged nothing at all. Two
  // causes: "and" only separated when an amount followed it, and the prep word
  // dragged the match down. Both fixed; both locked in here.
  [
    'scrambled eggs and ham and bacon',
    [[1, 'each', 'eggs'], [1, 'each', 'ham'], [1, 'each', 'bacon']],
  ],
  ['grilled chicken and steamed broccoli', [[1, 'each', 'chicken'], [1, 'each', 'broccoli']]],
  ['a banana and coffee', [[1, 'each', 'banana'], [1, 'each', 'coffee']]],
  // Still one dish, protected by name rather than by the old amount rule.
  ['mac and cheese', [[1, 'each', 'mac cheese']]],
  ['cookies and cream ice cream', [[1, 'each', 'cookies cream ice cream']]],
];

// [spoken, candidate, expectation] -- the ordering that matters, not exact
// scores, which are free to be retuned without failing this.
const SCORE_EXPECTATIONS = [
  ['greek yogurt bowl', 'Greek Yogurt Bowl', 'confident'],
  ['chicken breast', 'Chicken, broiler, breast, skinless, boneless, meat', 'confident'],
  ['eggs', 'Egg, whole, raw', 'confident'],
  ['toast', 'Bread, whole-wheat', 'weak'],
  ['salmon', 'Beef, ground, raw', 'weak'],
];

function run() {
  const quickLog = loadQuickLog();
  let failures = 0;

  for (const [phrase, expected] of CASES) {
    const actual = quickLog
      .splitSpokenItems(phrase)
      .map(quickLog.parseSpokenItem)
      .map((item) => [Math.round(item.quantity * 1000) / 1000, item.unit, item.foodText]);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures += 1;
      console.error(`FAIL  ${phrase}`);
      console.error(`  got      ${JSON.stringify(actual)}`);
      console.error(`  expected ${JSON.stringify(expected)}`);
    }
  }

  for (const [spoken, candidate, expectation] of SCORE_EXPECTATIONS) {
    const score = quickLog.scoreNameMatch(spoken, candidate);
    const isConfident = score >= quickLog.CONFIDENT_MATCH_SCORE;
    if ((expectation === 'confident') !== isConfident) {
      failures += 1;
      console.error(`FAIL  score ${JSON.stringify(spoken)} vs ${JSON.stringify(candidate)}`);
      console.error(`  scored ${score.toFixed(3)}, expected to read as ${expectation}`);
    }
  }

  const total = CASES.length + SCORE_EXPECTATIONS.length;
  if (failures > 0) {
    console.error(`\nSpoken food parsing: ${failures} of ${total} checks failed.`);
    process.exit(1);
  }
  console.log(`Spoken food parsing: all ${total} checks passed.`);
}

run();
