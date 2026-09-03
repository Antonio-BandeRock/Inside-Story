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

const LIB = path.join(__dirname, '..', 'lib');

// Transpiled in memory rather than shelling out to tsc and writing files.
// groceryList.ts imports lib/unitConversion.ts for the real conversion
// factors (deliberately, rather than keeping a second copy of them), so this
// resolves that one sibling import the same way, recursively. Same approach
// as scripts/test_spoken_food_parsing.js, one step further.
function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (!request.startsWith('./')) {
      throw new Error(`This harness only resolves sibling lib modules, got: ${request}`);
    }
    const target = request.slice(2);
    // lib/db.ts is the app's whole 18,000-line database layer and pulls in
    // expo-sqlite, which cannot load outside a React Native runtime. Stubbed
    // rather than loaded, because the one thing this harness takes from
    // groceryDb.ts (scheduleLineValues) touches no database at all. If a test
    // ever reaches for something here that does, this throws by name rather
    // than silently returning undefined and failing somewhere further on.
    if (target === 'db') {
      return new Proxy(
        {},
        {
          get(_unused, prop) {
            if (prop === '__esModule') return true;
            throw new Error(`This harness stubs lib/db.ts; it cannot provide ${String(prop)}.`);
          },
        },
      );
    }
    return loadModule(target, cache);
  };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
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
  mergeShoppingAmounts,
  isNonPurchasableIngredient,
  describeApproximateCount,
  groceryPriceUnitsFor,
  parsePriceInput,
  describeUnitPrice,
  purchaseSizeUnitFor,
  comparePrices,
  unitPriceLabelFor,
  kitchenCoverageFor,
} = loadModule('groceryList');

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

// Amounts come out of real conversion factors, so they carry ordinary
// floating-point noise (a cup is 236.588 ml, and 236.588 + 100 lands a
// fifteenth decimal place away from where arithmetic on paper does). Rounded
// before comparing, since the question here is whether the merging is right,
// not whether IEEE 754 is.
function checkAmounts(label, actual, expected) {
  const round = (entry) => ({ quantity: Math.round(entry.quantity * 10000) / 10000, unit: entry.unit });
  const normalize = (merged) => ({ primary: round(merged.primary), extras: merged.extras.map(round) });
  check(label, normalize(actual), normalize(expected));
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


// --- Adding one food up across every meal that needs it ---------------------
//
// 2026-09-01. The list used to key on a name that encoded preparation, so one
// head of broccoli roasted in a side and shredded raw into a salad came out as
// two lines. These check that the arithmetic behind the fix adds up.

// Weights add to weights with no knowledge of the food.
checkAmounts('grams add to grams', mergeShoppingAmounts([{ quantity: 200, unit: 'g' }, { quantity: 140, unit: 'g' }]), {
  primary: { quantity: 340, unit: 'g' },
  extras: [],
});
// Mixed weight units still add, through the app's own conversion factors.
checkAmounts('ounces fold into grams', mergeShoppingAmounts([{ quantity: 100, unit: 'g' }, { quantity: 1, unit: 'oz' }]), {
  primary: { quantity: 128.3495, unit: 'g' },
  extras: [],
});
// Past a kilo it reads as kilos, since that is what a person would say.
checkAmounts('a big weight reads in kilos', mergeShoppingAmounts([{ quantity: 900, unit: 'g' }, { quantity: 300, unit: 'g' }]), {
  primary: { quantity: 1.2, unit: 'kg' },
  extras: [],
});
// Volumes add to volumes, also without needing a density.
checkAmounts('cups fold into millilitres', mergeShoppingAmounts([{ quantity: 1, unit: 'cup' }, { quantity: 100, unit: 'ml' }]), {
  primary: { quantity: 336.588, unit: 'ml' },
  extras: [],
});
// Counts merge only with the identical word: 3 eggs and 2 eggs are 5 eggs.
checkAmounts('counts add up', mergeShoppingAmounts([{ quantity: 3, unit: 'each' }, { quantity: 2, unit: 'each' }]), {
  primary: { quantity: 5, unit: 'each' },
  extras: [],
});

// The line this deliberately does not cross: a weight and a volume of the same
// food cannot be added without a density the app does not have, so both are
// kept rather than one being folded into the other or dropped.
checkAmounts('a weight and a volume stay separate', mergeShoppingAmounts([{ quantity: 200, unit: 'g' }, { quantity: 1, unit: 'cup' }]), {
  primary: { quantity: 200, unit: 'g' },
  extras: [{ quantity: 236.588, unit: 'ml' }],
});
// Whichever way the food was measured most often leads the line.
checkAmounts(
  'the most common measure leads',
  mergeShoppingAmounts([{ quantity: 1, unit: 'each' }, { quantity: 2, unit: 'each' }, { quantity: 50, unit: 'g' }]),
  { primary: { quantity: 3, unit: 'each' }, extras: [{ quantity: 50, unit: 'g' }] },
);
// Weight settles a tie, because a scale in a store can settle it too.
checkAmounts('weight wins a tie', mergeShoppingAmounts([{ quantity: 1, unit: 'each' }, { quantity: 50, unit: 'g' }]), {
  primary: { quantity: 50, unit: 'g' },
  extras: [{ quantity: 1, unit: 'each' }],
});
check('nothing to merge is not a crash', mergeShoppingAmounts([]), { primary: { quantity: 0, unit: '' }, extras: [] });

// --- What never reaches the list --------------------------------------------

check('tap water is not shopped for', isNonPurchasableIngredient('Water, tap'), true);
check('the check ignores casing', isNonPurchasableIngredient('  water, TAP  '), true);
// The exclusion is exact, so foods that merely contain the word survive. This
// is why it matches whole base names rather than searching for "water".
check('coconut water is a real purchase', isNonPurchasableIngredient('Coconut water'), false);
check('watermelon is a real purchase', isNonPurchasableIngredient('Watermelon'), false);

// --- Turning a weight into something you can pick up ------------------------
//
// 2026-09-01. Only ever attempted where a cited unit weight exists to divide
// by (food_unit_weights, which carries a citation per row). Everywhere else
// this returns null and the line falls back to its amount plus how the thing
// is sold, which is honest and still shoppable.

// An empty unit label means the food is the unit: 3 avocados, not 3 units.
check('a weight becomes a count', describeApproximateCount(300, 'g', 'Avocado', '', '', 150), 'about 2 avocados');
check('one of something stays singular', describeApproximateCount(150, 'g', 'Avocado', '', '', 150), 'about 1 avocado');
check('a named unit is used when there is one', describeApproximateCount(100, 'g', 'Chicken Egg (Raw)', 'egg', 'eggs', 50), 'about 2 eggs');
check('kilos convert too', describeApproximateCount(1, 'kg', 'Apple', '', '', 182), 'about 5 apples');
// Never zero: a shop does not sell a third of an avocado, and a list saying
// "about 0" would be worse than saying nothing.
check('a small amount still rounds up to one', describeApproximateCount(40, 'g', 'Avocado', '', '', 150), 'about 1 avocado');

// The refusals, which are most of the table.
check('no unit weight, no count', describeApproximateCount(300, 'g', 'Broccoli', 'head', 'heads', null), null);
check('a volume is not divided by a weight', describeApproximateCount(300, 'ml', 'Olive Oil', '', '', 150), null);
check('a count of things is not re-counted', describeApproximateCount(3, 'each', 'Avocado', '', '', 150), null);
check('a zero unit weight is refused', describeApproximateCount(300, 'g', 'Avocado', '', '', 0), null);

// --- Which price units are worth offering ----------------------------------
//
// 2026-09-01, from two reports at once: the list asked which weight unit to
// use on every line, when the app already knows from Preferences, and it
// offered per-pound on olive oil, which no store sells that way.

check('a bottle is never priced by weight', groceryPriceUnitsFor('volume', 'metric'), ['total', 'each', 'l']);
check('and in imperial it is fluid ounces', groceryPriceUnitsFor('volume', 'imperial'), ['total', 'each', 'fl_oz']);
// Only ever ONE weight unit, the one the person already chose.
check('metric offers kilos and not pounds', groceryPriceUnitsFor('weight', 'metric'), ['total', 'each', 'kg']);
check('imperial offers pounds and not kilos', groceryPriceUnitsFor('weight', 'imperial'), ['total', 'each', 'lb']);
// Counted things can still be priced by weight: onions are sold loose AND
// priced by the pound, so excluding weight here would be wrong.
check('counted things can still be weighed', groceryPriceUnitsFor('count', 'imperial'), ['total', 'each', 'lb']);
check('an unknown form still offers something sensible', groceryPriceUnitsFor(null, 'metric'), ['total', 'each', 'kg']);

// --- Reading a price that was said or photographed --------------------------

check('a typed price', parsePriceInput('3.99'), 3.99);
check('a currency symbol is ignored', parsePriceInput('$3.99'), 3.99);
check('a whole number is a real price', parsePriceInput('4'), 4);
// The rule that matters for a photographed shelf label: a number carrying
// cents beats a bare one, so "SALE 2/$5.00" is five dollars and not two.
check('a shelf label is not priced at its multibuy', parsePriceInput('SALE 2/$5.00'), 5);
check('a label with other text still reads', parsePriceInput('Organic Broccoli $2.49 /lb'), 2.49);
// Spoken, in the shapes people actually use.
check('spoken dollars and cents', parsePriceInput('three ninety nine'), 3.99);
check('spoken with a round number of cents', parsePriceInput('four fifty'), 4.5);
check('spoken the long way', parsePriceInput('three dollars and ninety nine cents'), 3.99);
check('spoken cents alone are cents', parsePriceInput('ninety nine cents'), 0.99);
check('fifty cents is not fifty dollars', parsePriceInput('fifty cents'), 0.5);
// Refusals, so a wrong number never lands in the field on its own.
check('words that are not a price', parsePriceInput('banana'), null);
check('nothing at all', parsePriceInput(''), null);

// --- What a thing works out to per unit -------------------------------------
//
// 2026-09-01: a bottle priced for all of it said nothing about value, because
// a bottle is not a size. These check the sum that turns one into the other.

// The case reported: olive oil, priced for the bottle, with the bottle's size.
check(
  'a bottle becomes a price per litre',
  describeUnitPrice({ price: 15.9, priceUnit: 'total', purchasedQuantity: 750, quantity: 100 }, 'volume', 'metric'),
  '$21.20 per litre',
);
// Quoted per litre rather than per millilitre on purpose: two cents a
// millilitre is a number nobody can compare two bottles with.
check(
  'a smaller bottle compares against it',
  describeUnitPrice({ price: 8.0, priceUnit: 'total', purchasedQuantity: 250, quantity: 100 }, 'volume', 'metric'),
  '$32.00 per litre',
);
check(
  'imperial volume quotes per fluid ounce',
  describeUnitPrice({ price: 12.0, priceUnit: 'total', purchasedQuantity: 25, quantity: 100 }, 'volume', 'imperial'),
  '$0.48 per fl oz',
);
check(
  'a block of cheese becomes a price per kilo',
  describeUnitPrice({ price: 6.0, priceUnit: 'total', purchasedQuantity: 500, quantity: 200 }, 'weight', 'metric'),
  '$12.00 per kg',
);
// A price that is already per unit is simply itself.
check(
  'a per-pound price needs no sum',
  describeUnitPrice({ price: 4.99, priceUnit: 'lb', purchasedQuantity: 2, quantity: 900 }, 'weight', 'imperial'),
  '$4.99 per lb',
);
check(
  'an each price needs no sum',
  describeUnitPrice({ price: 0.6, priceUnit: 'each', purchasedQuantity: 4, quantity: 4 }, 'count', 'metric'),
  '$0.60 each',
);
// Refusals, so no number appears until it can honestly be worked out.
check(
  'no size, no comparison',
  describeUnitPrice({ price: 15.9, priceUnit: 'total', purchasedQuantity: null, quantity: 100 }, 'volume', 'metric'),
  null,
);
check(
  'no price, no comparison',
  describeUnitPrice({ price: null, priceUnit: null, purchasedQuantity: 750, quantity: 100 }, 'volume', 'metric'),
  null,
);
check(
  'a zero size is refused rather than divided by',
  describeUnitPrice({ price: 15.9, priceUnit: 'total', purchasedQuantity: 0, quantity: 100 }, 'volume', 'metric'),
  null,
);

// The unit a size is entered in follows the same two things the price units do.
check('volume sizes are millilitres', purchaseSizeUnitFor('volume', 'metric'), 'ml');
check('volume sizes are fluid ounces in imperial', purchaseSizeUnitFor('volume', 'imperial'), 'fl oz');
check('weight sizes are grams', purchaseSizeUnitFor('weight', 'metric'), 'g');
check('weight sizes are ounces in imperial', purchaseSizeUnitFor('weight', 'imperial'), 'oz');

// --- Two bottles on a shelf -------------------------------------------------
//
// 2026-09-01: the sum people try to do in their head and mostly get wrong,
// because the bigger bottle is not reliably the cheaper one.

const OIL = [
  { label: 'Big bottle', price: 15.9, size: 750 },
  { label: 'Small bottle', price: 8.0, size: 250 },
];
check('the cheaper one per litre is found', comparePrices(OIL, 'volume', 'metric').map((r) => r.isBest), [true, false]);
check('both are quoted per litre', comparePrices(OIL, 'volume', 'metric').map((r) => r.display), [
  '$21.20 per litre',
  '$32.00 per litre',
]);
check('and it says how much dearer', comparePrices(OIL, 'volume', 'metric')[1].dearerByPercent, 51);

// The case the tool exists for: the bigger one is NOT the better buy.
const TRAP = [
  { label: 'Family size', price: 12.0, size: 1000 },
  { label: 'Regular', price: 5.0, size: 500 },
];
check('a bigger bottle is not always cheaper', comparePrices(TRAP, 'volume', 'metric').map((r) => r.isBest), [false, true]);

// Nothing is called best until there is something to be better than.
check(
  'one filled row wins nothing',
  comparePrices([{ label: '', price: 4, size: 500 }, { label: '', price: null, size: null }], 'volume', 'metric').map((r) => r.isBest),
  [false, false],
);
check(
  'an empty comparison is not a crash',
  comparePrices([], 'volume', 'metric'),
  [],
);
// A genuine tie: both are the best buy, since neither is worse.
check(
  'a tie makes both best',
  comparePrices([{ label: 'a', price: 4, size: 400 }, { label: 'b', price: 8, size: 800 }], 'volume', 'metric').map((r) => r.isBest),
  [true, true],
);
// Weight, and imperial, use the same machinery.
check(
  'cheese compares per kilo',
  comparePrices([{ label: 'a', price: 6, size: 500 }, { label: 'b', price: 10, size: 1000 }], 'weight', 'metric').map((r) => r.display),
  ['$12.00 per kg', '$10.00 per kg'],
);
check(
  'imperial compares per fluid ounce',
  comparePrices([{ label: 'a', price: 12, size: 25 }], 'volume', 'imperial')[0].display,
  '$0.48 per fl oz',
);

check('the comparison unit is named for metric volume', unitPriceLabelFor('volume', 'metric'), 'per litre');
check('and for imperial weight', unitPriceLabelFor('weight', 'imperial'), 'per oz');
// --------------------------------------------------------------------------
// A stored grocery line's columns and its values, held against each other.
//
// 2026-09-03. Not arithmetic, but it belongs here for the same reason
// everything above does: it goes wrong silently. createGroceryListFromSchedule
// and rebuildGroceryListFromSchedule each hand-maintained their own positional
// INSERT, and from 1.0.32.9 they disagreed: the create path bound the purchase
// form where approx_amount belongs and the count string where purchase_form
// belongs. SQLite accepts that happily, TypeScript cannot see it, and the
// result was a freshly built list reading "count" instead of "about 2 stalks"
// while a Refresh of the same list read correctly. There is one builder now,
// and these hold it to its column list.
const { SCHEDULE_LINE_COLUMNS, SCHEDULE_LINE_PLACEHOLDERS, scheduleLineValues } = loadModule('groceryDb');

const lineColumns = SCHEDULE_LINE_COLUMNS.split(',').map((column) => column.trim());

// One broccoli line, for two people, with a cited unit weight to divide by.
const sampleItem = {
  category: 'Veg',
  foodName: 'Broccoli',
  unit: 'g',
  quantity: 170,
  extraAmounts: [{ quantity: 100, unit: 'ml' }],
  mealNames: ['Roasted Vegetables'],
  soldAs: 'by the head',
  approxAmount: null,
  unitLabel: 'stalk',
  unitLabelPlural: 'stalks',
  gramsPerUnit: 148,
  purchaseForm: 'count',
};
const lineValues = scheduleLineValues('item_1', 'list_1', 'Veg', sampleItem, 2, 0);
const valueFor = (column) => lineValues[lineColumns.indexOf(column)];

check('every column gets exactly one value', lineValues.length, lineColumns.length);
check('and one placeholder', SCHEDULE_LINE_PLACEHOLDERS.split(',').length, lineColumns.length);

// The two that were transposed. Checked by name rather than by position, so
// this still holds if a column is ever added in the middle.
check('approx_amount holds the count, not the form', valueFor('approx_amount'), 'about 2 stalks');
check('purchase_form holds the form, not the count', valueFor('purchase_form'), 'count');

// The rest of the line, so a future reordering cannot quietly shift anything
// else either.
check('sold_as holds how a store sells it', valueFor('sold_as'), 'by the head');
check('food_name holds the purchasable name', valueFor('food_name'), 'Broccoli');
check('quantity is scaled by head count', valueFor('quantity'), 340);
check('unit is untouched by scaling', valueFor('unit'), 'g');
check('extra amounts scale by the same head count', JSON.parse(valueFor('extra_amounts_json')), [
  { quantity: 200, unit: 'ml' },
]);
check('meal names are carried through', JSON.parse(valueFor('meal_names_json')), ['Roasted Vegetables']);
check('sort order is carried through', valueFor('sort_order'), 0);
check('the list id lands in list_id', valueFor('list_id'), 'list_1');

// A food with no cited unit weight gets no count rather than a guessed one,
// and must not leave the form field carrying the gap.
const noWeightValues = scheduleLineValues(
  'item_2',
  'list_1',
  'Fats',
  { ...sampleItem, foodName: 'Olive Oil', unit: 'ml', quantity: 250, gramsPerUnit: null, purchaseForm: 'volume' },
  1,
  1,
);
check('no unit weight means no count', noWeightValues[lineColumns.indexOf('approx_amount')], null);
check('and the form still lands correctly', noWeightValues[lineColumns.indexOf('purchase_form')], 'volume');

// --------------------------------------------------------------------------
// What is already in the kitchen.
//
// The rule these exist to hold: a harvest is a measured amount and may be
// subtracted, a past purchase is a date and may not. Getting that backwards
// sends someone home without the thing they went out for, which is the same
// class of silent, plausible-looking wrongness as every price case above.
const TODAY = '2026-09-03';
const garden = (quantity, unit, date) => ({ source: 'garden', quantity, unit, date });
const ferment = (quantity, unit, date) => ({ source: 'fermentation', quantity, unit, date });
const bought = (quantity, unit, date) => ({ source: 'purchase', quantity, unit, date });

check('nothing in the kitchen says nothing', kitchenCoverageFor(340, 'g', [], TODAY).level, 'none');
check('and offers no note', kitchenCoverageFor(340, 'g', [], TODAY).note, null);

// Enough in the garden to cover the line outright.
const covered = kitchenCoverageFor(340, 'g', [garden(400, 'g', '2026-09-01')], TODAY);
check('a harvest that covers the line reads covered', covered.level, 'covered');
check('and says so plainly', covered.note, 'Already in your kitchen: 400 g from the garden. That covers this line.');
check('and reports only what the line needed', covered.coveredQuantity, 340);

// Not enough: the shortfall is what someone actually has to buy.
const partial = kitchenCoverageFor(340, 'g', [garden(200, 'g', '2026-09-01')], TODAY);
check('a harvest short of the line reads some', partial.level, 'some');
check('and names the shortfall', partial.note, 'Already in your kitchen: 200 g from the garden. You still need about 140 g.');
check('and reports what is covered', partial.coveredQuantity, 200);

// Units convert within a family, using the same factors mergeShoppingAmounts uses.
check(
  'a harvest in kilos counts against a line in grams',
  kitchenCoverageFor(340, 'g', [garden(0.5, 'kg', '2026-09-01')], TODAY).level,
  'covered',
);
// ...and never across one. A litre of something is not 400 g of it without a
// density this app does not have.
check(
  'a volume never counts against a weight',
  kitchenCoverageFor(340, 'g', [garden(1, 'l', '2026-09-01')], TODAY).level,
  'none',
);

// Two sources add up, and the note names both so it can be checked.
const both = kitchenCoverageFor(1000, 'ml', [garden(400, 'ml', '2026-09-01'), ferment(700, 'ml', '2026-09-02')], TODAY);
check('two measured sources add together', both.level, 'covered');
check('and both are named', both.note, 'Already in your kitchen: 400 ml from the garden and 700 ml from what you fermented. That covers this line.');

// The honesty rule, stated as a test: a purchase never becomes a quantity.
const purchased = kitchenCoverageFor(340, 'g', [bought(340, 'g', '2026-09-01')], TODAY);
check('a past purchase is never measured', purchased.level, 'unmeasured');
check('and never claims an amount', purchased.coveredQuantity, null);
check('it asks to be checked instead', purchased.note, 'You bought this 2 days ago. Worth checking before buying more.');
check(
  'a purchase yesterday says yesterday',
  kitchenCoverageFor(340, 'g', [bought(340, 'g', '2026-09-02')], TODAY).note,
  'You bought this yesterday. Worth checking before buying more.',
);
check(
  'and one today says today',
  kitchenCoverageFor(340, 'g', [bought(340, 'g', TODAY)], TODAY).note,
  'You bought this today. Worth checking before buying more.',
);

// A measured harvest outranks a purchase: it is the one that can be trusted
// as an amount, so it is the one that gets reported.
check(
  'a harvest wins over a purchase of the same food',
  kitchenCoverageFor(340, 'g', [bought(340, 'g', '2026-09-01'), garden(400, 'g', '2026-09-02')], TODAY).level,
  'covered',
);

// A harvest with nothing left must not read as coverage.
check(
  'an empty harvest covers nothing',
  kitchenCoverageFor(340, 'g', [garden(0, 'g', '2026-09-01')], TODAY).level,
  'none',
);

// Counts merge only with the identical word, matching mergeShoppingAmounts.
check(
  'a count matches the same count word',
  kitchenCoverageFor(3, 'each', [garden(4, 'each', '2026-09-01')], TODAY).level,
  'covered',
);
check(
  'and not a different one',
  kitchenCoverageFor(3, 'each', [garden(4, 'clove', '2026-09-01')], TODAY).level,
  'none',
);

// --------------------------------------------------------------------------
// Nothing resolves the measurement system by falling back to a flat 'metric'.
//
// 2026-09-03, reported directly: "in my profile I have imperial selected, so
// it isn't showing me the correct unit either way." Twelve files resolve this
// as "stored ?? detectMeasurementSystemFromLocale()"; the grocery list and the
// price comparison fell back to 'metric' instead, so anyone who had never
// touched the setting was offered a price per kg while their Profile read
// Imperial off their locale. Nobody had to set anything wrong for this to
// happen, which is what made it easy to ship and easy to miss.
//
// Plain string matching rather than a regex, and a source scan rather than a
// unit test: the mistake is in how a value is resolved at a call site, not in
// any function's arithmetic.
const METRIC_FALLBACKS = [
  "getStoredMeasurementSystem()) ?? 'metric'",
  "system ?? 'metric'",
  "stored ?? 'metric'",
];
const offenders = [];
const walkForFallback = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkForFallback(full);
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      const text = fs.readFileSync(full, 'utf8');
      // A useState initialiser of 'metric' is fine: it is a placeholder
      // replaced the moment the stored value resolves. Only a FALLBACK from
      // the stored value is the bug.
      if (METRIC_FALLBACKS.some((pattern) => text.includes(pattern))) offenders.push(entry.name);
    }
  }
};
for (const root of ['app', 'components']) walkForFallback(path.join(__dirname, '..', root));
check('no screen falls back to a flat metric default', offenders, []);

if (failures > 0) {
  console.error(`\nGrocery list math: ${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`Grocery list math: all ${checks} checks passed.`);
