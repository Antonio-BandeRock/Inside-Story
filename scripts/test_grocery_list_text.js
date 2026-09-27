// Runs lib/groceryListText.ts: the grocery list as plain text (G8, 2026-09-27).
//
// The rules checked:
//
//  1. Only lines still to pick up are sent; a checked-off line was bought.
//  2. A section with nothing left is left out, and an empty title reads Other.
//  3. The heading carries the store when one is chosen.
//  4. Amounts, the rough count and a note each read on the line.
//  5. Everything checked off sends nothing.
//  6. A file name drops characters Windows refuses.
//
// Run with: node scripts/test_grocery_list_text.js
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

const U = loadModule('lib/unitConversion.ts');
const G = loadModule('lib/groceryList.ts', { './unitConversion': U });
const T = loadModule('lib/groceryListText.ts', { './groceryList': G });

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

function line(foodName, quantity, unit, more = {}) {
  return { foodName, quantity, unit, extraAmounts: [], approxAmount: null, note: null, checked: false, ...more };
}

const sections = [
  { title: 'Produce', items: [line('Broccoli', 400, 'g', { approxAmount: 'about 2 heads' }), line('Lemons', 3, 'each', { checked: true })] },
  { title: 'Dairy', items: [line('Butter', 250, 'g', { checked: true })] },
  { title: '', items: [line('Dish soap', 1, '', { note: 'the unscented one' })] },
];

const text = T.groceryListAsText('Saturday', 'Soriana', sections);
const lines = text.split('\n');
check('heading with store', lines[0], 'Saturday, at Soriana');
check('checked lemons left out', text.includes('Lemons'), false);
check('all-checked section left out', text.includes('Dairy'), false);
check('empty title reads Other', text.includes('\nOther\n'), true);
check('rough count read', /Broccoli: .+ \(about 2 heads\)/.test(text), true);
check('note read', /- Dish soap.*\. the unscented one$/.test(text), true);
check('heading without store', T.groceryListAsText('Saturday', null, sections).split('\n')[0], 'Saturday');
check('blank store is no store', T.groceryListAsText('Saturday', '  ', sections).split('\n')[0], 'Saturday');
check('lines left', T.linesLeftToBuy(sections), 2);

const allDone = [{ title: 'Produce', items: [line('Lemons', 3, 'each', { checked: true })] }];
check('nothing left sends nothing', T.groceryListAsText('Saturday', null, allDone), null);
check('no sections sends nothing', T.groceryListAsText('Saturday', null, []), null);

check('file name', T.groceryListFileName('Week of 9/27: Soriana'), 'Week of 9 27 Soriana.txt');
check('blank file name', T.groceryListFileName('  '), 'Grocery list.txt');

const FORBIDDEN = /\b(real|genuine|genuinely)\b|[–—]| -- /i;
if (FORBIDDEN.test(T.NOTHING_LEFT_TO_SEND)) {
  failures++;
  console.log('FAIL forbidden word in NOTHING_LEFT_TO_SEND');
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('grocery list text: all checks passed');
