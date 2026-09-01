// Runs lib/groceryList.ts's price arithmetic against a fixed set of cases.
//
// Built 2026-09-01 alongside the Grocery List. Every one of these produces a
// silently wrong NUMBER rather than a crash when it goes wrong, and the number
// in question is money in a running total someone is reading in a store to
// decide what they can afford. A per-pound price counted as one pound, or a
// package price multiplied by the recipe's own quantity, would both look
// perfectly plausible on screen and be wrong.
//
// The one rule worth stating out loud, because it is the easy thing to get
// wrong: a price the app cannot honestly resolve returns null and is counted
// as missing, never guessed. That is what the unresolvedPriceCount in the
// totals exists to report.
//
// Run with: node scripts/test_grocery_list_math.js
// Exits non-zero on any failure, so it can gate a commit the same way the
// bare-text audit does.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SOURCE = path.join(__dirname, '..', 'lib', 'groceryList.ts');

// Transpiled in memory rather than shelling out to tsc and writing files: this
// module imports nothing at all, so the plain transpiler is enough and the
// script stays a single, side-effect-free run. Same approach as
// scripts/test_spoken_food_parsing.js.
function loadGroceryList() {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: 'groceryList.ts',
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

const {
  groceryLineTotal,
  groceryListTotals,
  formatGroceryQuantity,
  formatGroceryAmount,
  formatMoney,
  defaultGroceryListName,
  describeGroceryWindow,
  isEncouragedGroceryWindow,
  groceryPriceUnitLabel,
} = loadGroceryList();

let failures = 0;
let checks = 0;

function check(label, actual, expected) {
  checks += 1;
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}

// --- One line's total -------------------------------------------------------

// A package price is the whole line, whatever the recipe asked for.
check(
  'package price ignores quantity',
  groceryLineTotal({ price: 4.99, priceUnit: 'total', purchasedQuantity: null, quantity: 3 }),
  4.99,
);

// Priced each, with a real count bought.
check(
  'each times what was bought',
  groceryLineTotal({ price: 0.5, priceUnit: 'each', purchasedQuantity: 6, quantity: 4 }),
  3,
);

// Priced each with nothing entered: the list's own amount stands in, because
// that number is the app's own figure rather than a guess about the store.
check(
  'each falls back to the needed amount',
  groceryLineTotal({ price: 0.5, priceUnit: 'each', purchasedQuantity: null, quantity: 4 }),
  2,
);

// The case this whole design exists for: a weight price with no weight cannot
// be resolved, and must not fall back to the price alone or to one pound.
check(
  'per pound with no weight is unknown',
  groceryLineTotal({ price: 3.99, priceUnit: 'lb', purchasedQuantity: null, quantity: 2 }),
  null,
);
check(
  'per kilo with no weight is unknown',
  groceryLineTotal({ price: 8.5, priceUnit: 'kg', purchasedQuantity: null, quantity: 1 }),
  null,
);
check(
  'per pound times the weight bought',
  groceryLineTotal({ price: 3.5, priceUnit: 'lb', purchasedQuantity: 2, quantity: 1 }),
  7,
);

// No price at all is unknown, not zero: zero would read as free.
check(
  'no price is unknown',
  groceryLineTotal({ price: null, priceUnit: null, purchasedQuantity: null, quantity: 2 }),
  null,
);
// A price with no unit cannot be interpreted, so it stays unknown rather than
// being treated as a package price.
check(
  'price with no unit is unknown',
  groceryLineTotal({ price: 5, priceUnit: null, purchasedQuantity: null, quantity: 1 }),
  null,
);
// A genuine zero is a real answer (something free, or a price corrected to
// nothing) and must survive rather than being swallowed as falsy.
check(
  'a zero price is a real total',
  groceryLineTotal({ price: 0, priceUnit: 'total', purchasedQuantity: null, quantity: 1 }),
  0,
);

// --- A whole list -----------------------------------------------------------

const LIST = [
  { price: 4.99, priceUnit: 'total', purchasedQuantity: null, quantity: 1, checked: true },
  { price: 0.5, priceUnit: 'each', purchasedQuantity: 6, quantity: 4, checked: true },
  // Unresolved: priced per pound, no weight yet.
  { price: 3.99, priceUnit: 'lb', purchasedQuantity: null, quantity: 2, checked: true },
  // Not priced at all, and not yet in the cart.
  { price: null, priceUnit: null, purchasedQuantity: null, quantity: 3, checked: false },
];

check('list counts every line', groceryListTotals(LIST).itemCount, 4);
check('list counts what is checked', groceryListTotals(LIST).checkedCount, 3);
check('list totals only what resolved', groceryListTotals(LIST).pricedTotal, 7.99);
check('list counts resolved lines', groceryListTotals(LIST).pricedCount, 2);
// The heart of it: a priced-but-unresolvable line is reported, not silently
// dropped and not silently guessed into the total.
check('list reports unresolved prices', groceryListTotals(LIST).unresolvedPriceCount, 1);

check('an empty list totals to nothing', groceryListTotals([]), {
  itemCount: 0,
  checkedCount: 0,
  pricedTotal: 0,
  pricedCount: 0,
  unresolvedPriceCount: 0,
});

// --- Display ----------------------------------------------------------------

check('whole numbers stay whole', formatGroceryQuantity(3), '3');
check('recipe arithmetic rounds to one decimal', formatGroceryQuantity(2.34567), '2.3');
check('rounding goes up where it should', formatGroceryQuantity(0.96), '1');
check('an amount carries its unit', formatGroceryAmount(2.5, 'cups'), '2.5 cups');
check('an amount with no unit reads plainly', formatGroceryAmount(3, ''), '3');
check('money always shows cents', formatMoney(4.5), '$4.50');
check('money rounds to cents', formatMoney(7.999), '$8.00');

check('a list is named for its date', defaultGroceryListName('2026-09-01'), 'Groceries, Sep 1');
check('a malformed date still gets a name', defaultGroceryListName('nonsense'), 'Groceries');

check('the window reads as a sentence', describeGroceryWindow(3, 2), '3 days of meals for 2 people');
check('one of each is singular', describeGroceryWindow(1, 1), '1 day of meals for 1 person');

check('three days is encouraged', isEncouragedGroceryWindow(3), true);
check('a week is allowed but not encouraged', isEncouragedGroceryWindow(7), false);

check('a package price says so plainly', groceryPriceUnitLabel('total'), 'for all of it');
check('a weight price names its unit', groceryPriceUnitLabel('lb'), 'per lb');

if (failures > 0) {
  console.error(`\nGrocery list math: ${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`Grocery list math: all ${checks} checks passed.`);
