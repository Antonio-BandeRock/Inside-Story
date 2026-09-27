// Checks G6 of the competitive build plan (Phase 2, 2026-09-26): the grocery
// list in a store's walking order. Aisles come in the order set, a category no
// aisle holds keeps its own heading after them, what was added while shopping
// stays last, removing an aisle leaves nothing pointing at it, and nothing
// said carries a verdict. Exits non-zero on any failure.

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

const A = load('lib/groceryAisles.ts');

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

const HAND = 'Added While Shopping';
const items = [
  { id: 1, category: 'Vegetables' },
  { id: 2, category: 'Dairy & Eggs' },
  { id: 3, category: 'Added While Shopping' },
  { id: 4, category: 'Fruits' },
  { id: 5, category: 'Baking' },
  { id: 6, category: 'vegetables ' },
  { id: 7, category: 'Spices' },
];

// No layout: by category, alphabetical, hand-added last.
const plain = A.arrangeByAisle(items, null, HAND);
check('plain titles', plain.map((s) => s.title), ['Baking', 'Dairy & Eggs', 'Fruits', 'Spices', 'Vegetables', HAND]);
check('plain merges case and spaces', plain.find((s) => s.title === 'Vegetables').items.map((i) => i.id), [1, 6]);
check('plain has no captions', plain.every((s) => s.caption === null), true);
check('every line placed once (plain)', plain.flatMap((s) => s.items.map((i) => i.id)).sort(), [1, 2, 3, 4, 5, 6, 7]);

const layout = {
  aisles: [
    { id: 'back', name: 'Back wall', position: 2 },
    { id: 'produce', name: 'Produce', position: 0 },
    { id: 'a4', name: 'Aisle 4', position: 1 },
  ],
  placements: { Vegetables: 'produce', Fruits: 'produce', 'Dairy & Eggs': 'back', Baking: 'a4', Ghost: 'gone' },
};
const walked = A.arrangeByAisle(items, layout, HAND);
check('walking order', walked.map((s) => s.title), ['Produce', 'Aisle 4', 'Back wall', 'Spices', HAND]);
check('aisle keeps line order', walked[0].items.map((i) => i.id), [1, 4, 6]);
check('aisle caption lists categories', walked[0].caption, 'Fruits, Vegetables');
check('single category caption', walked[1].caption, 'Baking');
check('every line placed once (walked)', walked.flatMap((s) => s.items.map((i) => i.id)).sort(), [1, 2, 3, 4, 5, 6, 7]);
check('empty aisle not shown', A.arrangeByAisle([{ id: 9, category: 'Baking' }], layout, HAND).map((s) => s.title), ['Aisle 4']);
check('aisle named as its one category has no caption',
  A.arrangeByAisle([{ id: 9, category: 'Baking' }], { aisles: [{ id: 'b', name: 'baking', position: 0 }], placements: { Baking: 'b' } }, HAND)[0].caption,
  null);
check('placement to a missing aisle ignored',
  A.arrangeByAisle([{ id: 9, category: 'Ghost' }], layout, HAND).map((s) => s.title), ['Ghost']);
check('empty list', A.arrangeByAisle([], layout, HAND), []);

// Moving aisles.
const up = A.moveAisle(layout.aisles, 'back', -1);
check('move up', up.map((a) => a.id), ['produce', 'back', 'a4']);
check('positions renumbered', up.map((a) => a.position), [0, 1, 2]);
check('move first up stays', A.moveAisle(layout.aisles, 'produce', -1).map((a) => a.id), ['produce', 'a4', 'back']);
check('move last down stays', A.moveAisle(layout.aisles, 'back', 1).map((a) => a.id), ['produce', 'a4', 'back']);
check('move unknown stays', A.moveAisle(layout.aisles, 'nope', 1).map((a) => a.id), ['produce', 'a4', 'back']);

// Removing an aisle.
const toBack = A.planAisleRemoval(layout, 'produce', 'back');
check('removal moves to replacement', toBack.move, ['Fruits', 'Vegetables']);
check('removal sentence', toBack.sentence, 'The 2 categories in Produce move to Back wall.');
const release = A.planAisleRemoval(layout, 'produce', null);
check('removal releases', release.release, ['Fruits', 'Vegetables']);
check('release sentence', release.sentence, 'The 2 categories in Produce go back under their category headings.');
check('self as replacement releases', A.planAisleRemoval(layout, 'produce', 'produce').release.length, 2);
check('empty aisle removal', A.planAisleRemoval({ aisles: layout.aisles, placements: {} }, 'a4', 'back').sentence, 'Aisle 4 holds nothing, so it simply goes.');
check('one category sentence', A.planAisleRemoval(layout, 'a4', 'back').sentence, 'The 1 category in Aisle 4 moves to Back wall.');

// Placeable categories.
check('placeable merges, drops hand-added and blanks',
  A.placeableCategories(['Vegetables', 'vegetables', ' ', HAND, 'Baking'], { aisles: [], placements: { Nuts: 'x' } }, HAND),
  ['Baking', 'Nuts', 'Vegetables']);

check('describe none', A.describeStoreLayout(null), null);
check('describe', A.describeStoreLayout(layout), '3 aisles, 5 categories placed');
check('store key', A.storeKey('  Whole   Foods '), 'whole foods');

const FORBIDDEN = /\b(great|good|bad|well done|ideal|optimal|should|must|healthy|unhealthy|real|genuine|genuinely|own)\b|[–—]| -- /i;
const samples = [toBack.sentence, release.sentence, A.describeStoreLayout(layout)];
for (const line of samples) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(`${total - failures}/${total} checks passed`);
if (failures > 0) process.exit(1);
