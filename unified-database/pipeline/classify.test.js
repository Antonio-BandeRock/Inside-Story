// A real, direct test suite for classify.js -- run manually via
// `node classify.test.js`, not wired into any CI (this project has
// none), but the same "verify before trusting it" discipline used
// throughout this session. Covers every real rule branch plus the exact
// "ice cream" false-positive-dairy-match case that was caught and fixed
// before this was ever considered done.

const assert = require('assert');
const { classifyOne, classifyRecord } = require('./classify.js');

let pass = 0;
let fail = 0;

function check(name, nameForClassification, hasEnglishEvidence, expectedIsWholeFood) {
  const result = classifyOne({ nameForClassification, hasEnglishEvidence });
  try {
    assert.strictEqual(
      result.isWholeFood,
      expectedIsWholeFood,
      `expected isWholeFood=${expectedIsWholeFood}, got ${result.isWholeFood} (rule: ${result.ruleMatched}, confidence: ${result.autoConfidence})`
    );
    console.log(`PASS  ${name}  ->  ${result.ruleMatched}`);
    pass++;
  } catch (e) {
    console.log(`FAIL  ${name}  ->  ${e.message}`);
    fail++;
  }
}

// --- Real whole-food inclusions ---
check('plain yogurt', 'Yogurt, plain, whole milk', true, true);
check('plain milk', 'Milk, whole, 3.25% milkfat', true, true);
check('plain butter', 'Butter, salted', true, true);
check('plain cheese', 'Cheddar cheese', true, true);
check('butchered cut', 'Chicken breast, raw', true, true);
check('butchered cut, cooked', 'Pork loin, roasted', true, true);
check('dried fruit, "food, dried" order', 'Apple, dried', true, true);
check('dried apricot, "dried food" order (exact phrase list)', 'Dried apricot', true, true);
check('dehydrated, general hint', 'Mango, dehydrated', true, true);
check('fresh juice', 'Orange juice, fresh squeezed', true, true);
check('honey', 'Honey, raw', true, true);
check('smoked fish (safe override)', 'Smoked salmon', true, true);
check('raw vegetable', 'Carrot, raw', true, true);
check('whole grain', 'Oats, whole grain, raw', true, true);
check('"uncooked" (word-boundary edge case found via real data)', 'Adzuki beans, uncooked', true, true);
check('"dry" as a legume/grain prep state', 'Lentils, dry', true, true);

// --- Real exclusions ---
check('bacon', 'Bacon, pork', true, false);
check('sausage', 'Sausage, beef', true, false);
check('candy', 'Chocolate bar, milk chocolate', true, false);
check('soda', 'Cola, regular', true, false);
check('cake', 'Cake, chocolate, frosted', true, false);
check('fast food', "McDonald's hamburger", true, false);
check('processed cheese', 'Cheese, processed, American', true, false);
check('flavored yogurt (the app owner’s own rule)', 'Yogurt, strawberry flavored', true, false);
check('sweetened yogurt', 'Yogurt, sweetened, low fat', true, false);
check('juice from concentrate', 'Apple juice, from concentrate', true, false);
check('juice drink', 'Fruit juice drink, punch', true, false);
check('margarine', 'Margarine, regular', true, false);

// --- The real bug this test suite exists to catch ---
check('ICE CREAM must not slip through via "cream" dairy match', 'Ice cream, vanilla', true, false);
check('ice cream, unflavored, still not whole food', 'Ice cream, plain', true, false);
check('whipped topping must not slip through via "cream"', 'Whipped topping, non-dairy', true, false);

// --- Ambiguous / non-English: must NOT guess ---
check('genuinely ambiguous name, no rule fires', 'Xyzzy prepared item 42', true, null);
check('no English evidence at all (Norwegian, untranslated)', 'Agurk, norsk, rå', false, null);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
