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

// --- Real, new categories: oil, bread, flour, spice/herb (the app
// owner's own direct, tightened final scope for this database) ---
check('plain olive oil', 'Olive oil', true, true);
check('plain almond oil', 'Almond oil', true, true);
check('real, traditional rendered animal fat named "oil"', 'Animal fat, native, seal oil', true, true);
check('fish canned in real oil, no other additive', 'Anchovy, canned in oil, drained', true, true);
check('essential oil is not food', 'Lavender essential oil', true, false);
check('mineral oil is not food', 'Mineral oil', true, false);
check('a blended oil product, disqualified', 'Cooking oil blend', true, false);

check('plain bread', 'Bread, from white flour', true, true);
check('plain bagel', 'Bagel, plain (with onion, poppy seed and/or sesame seed)', true, true);
check('plain pita', 'Pita bread, whole wheat', true, true);
check('plain tortilla', 'Tortilla, corn', true, true);
check('bread crumbs are a processed derivative, not bread', 'Bread crumbs, dry, grated, plain', true, false);
check('a branded bread-flour MIX product, not bread', 'Bread flour mix, no knead bread, gluten-free, organic, powder', true, false);

check('plain wheat flour', 'Wheat flour, whole grain', true, true);
check('plain almond flour', 'Almond flour', true, true);
check('bean flour', 'Beans, black, flour', true, true);
check('a sweet biscuit that happens to mention flour is not plain flour', 'Biscuit, sweet, wholemeal flour, Digestive', true, false);
check('savoury crispbread from flour IS legitimate bread, caught by the bread rule first', 'Biscuit, savoury, from rye flour, crispbread', true, true);

check('whole fresh basil ("flavor is the basis for enjoying the food")', 'Basil, fresh', true, true);
check('bare, unqualified spice name with no other descriptor at all', 'Cinnamon', true, true);
check('ground spice -- grinding is mechanical processing, same as dried fruit', 'Cinnamon, ground', true, true);
check('a spice name inside a composite sauce is not the spice itself', 'Pasta sauce with basil', true, false);
check('a spice name inside a composite pesto is not the spice itself', 'Pesto with basil pine nuts cashew nuts', true, false);
check('"ginger" alone is the real root spice', 'Ginger, ground', true, true);
check('"ginger ale" is a soft drink, not the spice', 'Ginger ale', true, false);
check('a branded cereal flavored with cinnamon is not the spice itself', 'Cereal, ready to eat, Cinnamon Toast Crunch, General Mills', true, false);
check('a cinnamon roll is a composite baked good, not the spice itself', 'Cinnamon roll, home-made', true, false);
check('a composite fish dish mentioning parsley is not the herb itself', 'Fish with sun-dried tomato parsley garlic', true, false);
check('a real, simple vegetable preparation is unaffected (fennel bulb, boiled with salt)', 'Fennel boiled with salt', true, true);

// --- Real, new pantry-staple category (sugar, baking soda, cacao,
// coffee, and similar "100 years prior to heavy processing" staples) ---
check('plain granulated sugar, now a real, positive pantry staple', 'Sugar, granulated', true, true);
check('brown sugar', 'Brown sugar', true, true);
check('baking soda', 'Baking soda', true, true);
check('baking powder', 'Baking powder', true, true);
check('plain coffee', 'Coffee, ground, roasted', true, true);
check('plain cocoa powder', 'Cocoa, unsweetened, powder', true, true);
check('plain salt', 'Salt, sea', true, true);
check('high-fructose corn syrup remains excluded -- a modern industrial sweetener, not a traditional staple', 'Corn syrup, high fructose', true, false);
check('a branded hot-chocolate MIX is not plain cocoa', 'Cocoa, hot chocolate mix, instant', true, false);
check('"coffee cake" is a cake, not coffee', 'Coffee cake, crumb topping', true, false);

// --- The two real, confirmed precedence bugs this pass fixed (general
// exclude now runs before every positive rule, not just some of them) ---
check('a gingerbread cookie containing honey is not "honey"', 'Kathrinchen honey gingerbread biscuits', true, false);
check('plain honey itself is unaffected by the reorder', 'Honey, raw', true, true);

// --- Ambiguous / non-English: must NOT guess ---
check('genuinely ambiguous name, no rule fires', 'Xyzzy prepared item 42', true, null);
check('no English evidence at all (Norwegian, untranslated)', 'Agurk, norsk, rå', false, null);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
