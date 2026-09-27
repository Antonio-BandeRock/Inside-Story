// Runs lib/scanToList.ts: a barcode onto the grocery list (G7, 2026-09-27).
//
// The rules checked:
//
//  1. A barcode is 8 to 14 digits; spaces and dashes typed between groups
//     are dropped, and anything else is refused.
//  2. A lookup's answer is read by its status field, not the HTTP code: a
//     miss, a nameless product or a malformed body is null, and the brand is
//     the first of a comma list.
//  3. Beauty products start in Personal Care, everything else Around the
//     House.
//  4. The line's name leads with the brand unless the name already carries it.
//  5. The group chooser holds the person's group once, sorted with the rest.
//  6. No sentence says the product is safe, harmful, or anything about health.
//
// Run with: node scripts/test_scan_to_list.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const C = loadModule('lib/choiceOrder.ts');
const S = loadModule('lib/scanToList.ts', { './choiceOrder': C });

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

// 1. Barcodes
check('13 digits', S.readBarcode('7501035911208'), '7501035911208');
check('spaces and dashes dropped', S.readBarcode(' 0 12345-678905 '), '012345678905');
check('8 digits', S.readBarcode('12345670'), '12345670');
check('7 digits refused', S.readBarcode('1234567'), null);
check('15 digits refused', S.readBarcode('123456789012345'), null);
check('letters refused', S.readBarcode('ABC12345678'), null);
check('empty refused', S.readBarcode(''), null);

// 2 and 3. Lookup answers
check(
  'a found product',
  S.householdProductFromResponse({ status: 1, product: { product_name: '  Dish   Soap ', brands: 'Dawn, P&G' } }, '1', 'OpenProductsFacts'),
  { barcode: '1', name: 'Dish Soap', brand: 'Dawn', source: 'OpenProductsFacts', group: 'Around the House' },
);
check(
  'beauty starts in Personal Care',
  S.householdProductFromResponse({ status: 1, product: { product_name: 'Toothpaste' } }, '2', 'OpenBeautyFacts'),
  { barcode: '2', name: 'Toothpaste', brand: null, source: 'OpenBeautyFacts', group: 'Personal Care' },
);
check('a miss', S.householdProductFromResponse({ status: 0 }, '3', 'OpenProductsFacts'), null);
check('no name', S.householdProductFromResponse({ status: 1, product: { product_name: ' ' } }, '3', 'OpenProductsFacts'), null);
check('not an object', S.householdProductFromResponse('oops', '3', 'OpenProductsFacts'), null);
check('null body', S.householdProductFromResponse(null, '3', 'OpenProductsFacts'), null);
check('remembered default group', S.defaultGroupFor('Remembered'), 'Around the House');

// 4. Line names
check('brand leads', S.listLineName('Dish Soap', 'Dawn'), 'Dawn Dish Soap');
check('brand already in name', S.listLineName('Dawn Ultra Dish Soap', 'dawn'), 'Dawn Ultra Dish Soap');
check('no brand', S.listLineName(' Foil  ', null), 'Foil');
check('blank brand', S.listLineName('Foil', '  '), 'Foil');

// 5. Group choices
const groups = ['Cleaning', 'Paper & Wraps', 'Laundry', 'Personal Care'];
check('built-ins sorted', S.householdGroupChoices(groups, null), ['Cleaning', 'Laundry', 'Paper & Wraps', 'Personal Care']);
check('own group joins', S.householdGroupChoices(groups, 'Garage'), ['Cleaning', 'Garage', 'Laundry', 'Paper & Wraps', 'Personal Care']);
check('own group not doubled', S.householdGroupChoices(groups, 'laundry').length, 4);
check('input untouched', groups[0], 'Cleaning');

// Sentences
check('added', S.describeAddedToList('Foil', 'Saturday', false), 'Foil is on Saturday.');
check(
  'added to a new list',
  S.describeAddedToList('Foil', 'Groceries', true),
  'Foil is on a new list, Groceries, since no list was open.',
);

// 6. Forbidden words across every sentence
const sentences = [
  S.NOT_A_BARCODE,
  S.HOUSEHOLD_OFFLINE,
  S.describeAddedToList('X', 'Y', true),
  S.describeAddedToList('X', 'Y', false),
  ...['OpenProductsFacts', 'OpenBeautyFacts', 'Remembered', 'Typed'].map(S.describeHouseholdSource),
];
const FORBIDDEN = /\b(safe|unsafe|harmful|toxic|healthy|unhealthy|real|genuine|genuinely)\b|[–—]| -- /i;
for (const sentence of sentences) {
  if (FORBIDDEN.test(sentence)) {
    failures++;
    console.log(`FAIL forbidden word in: ${sentence}`);
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('scan to list: all checks passed');
