// Checks lib/snapshotMerge.ts, the merge that stops either device's work
// from being thrown away (2026-09-22, direct instruction: "All changes
// that either side perform should be completed in the order that they were
// done between the two devices, no matter how many changes there were.
// Our system can't just apply the last change made and do nothing about
// any that might have happened previously from either device."):
//
// 1. Following a row from one device to the other, under each of the four
//    key shapes this app's schema actually uses.
// 2. A change on one side only, in both directions, added, edited and
//    removed.
// 3. Two changes to the same row, settled by the time the row carries and,
//    without one, by the device that saved later.
// 4. A removal on one side against an edit on the other.
// 5. A table whose ids this device hands out, where two devices reached
//    the same number for different things, and the child rows that point
//    at them.
// 6. The first sync, with no base to compare against.
// 7. The words a person reads for what a merge did.
// 8. Whether the merged copy still has anything to send back, which is
//    what stops two open devices answering each other every half minute.
// 9. What arrived, handed back for the caller to keep as the base, so the
//    next merge works against what the other device holds rather than
//    against what this one last sent.
//
// The module imports nothing. Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
  });
  return module.exports;
}

const merge = load('lib/snapshotMerge.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
function same(actual, expected, label) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    label + ' (got ' + JSON.stringify(actual) + ', wanted ' + JSON.stringify(expected) + ')',
  );
}

const ID = { key: ['id'] };
const shapes = {
  upkeep_items: ID,
  meals: ID,
  app_meta: { key: ['key'] },
  user_profile: { key: ['id'] },
  family_member_conditions: { key: ['member_id', 'condition_code'] },
  scanned_products: {
    key: ['barcode'],
    localId: 'id',
    children: [{ table: 'scanned_product_nutrients', column: 'scanned_product_id' }],
  },
  scanned_product_nutrients: { key: ['scanned_product_id', 'nutrient_code'] },
};

const run = (base, here, there, options) =>
  merge.mergeTables(base, here, there, { shapes, laterSide: 'there', ...options });

const rowsOf = (result, table) => (result.tables[table] ?? []).map((row) => row.id ?? row.key);

// 1. Following a row across.
check(merge.keyOf({ id: 'a', note: 'x' }, ID) === 'a', 'a text id identifies a row');
check(merge.keyOf({ id: null }, ID) === null, 'a row with no id cannot be followed');
check(
  merge.keyOf({ member_id: 'm1', condition_code: 'hashimotos' }, shapes.family_member_conditions) ===
    merge.keyOf({ condition_code: 'hashimotos', member_id: 'm1' }, shapes.family_member_conditions),
  'a two-column key does not depend on the order of the columns',
);
check(
  merge.keyOf({ a: 1, b: 2 }, undefined) === merge.keyOf({ b: 2, a: 1 }, undefined),
  'with no shape the whole row identifies itself, whatever order it is written in',
);
check(merge.rowText({ a: 1 }) !== merge.rowText({ a: 2 }), 'a changed value changes the row text');
check(merge.rowText({ a: null }) === merge.rowText({ a: undefined }), 'nothing and nothing read alike');

// 2. The reported case: an upkeep item added on the computer while a
//    setting was changed on the phone. Both survive, nobody is asked.
const base = {
  upkeep_items: [{ id: 'u1', title: 'Filters', updated_at: '2026-09-22T10:00:00Z' }],
  app_meta: [{ key: 'visual_preferences', value: '{"tab":"leaf"}' }],
};
const phone = {
  upkeep_items: [{ id: 'u1', title: 'Filters', updated_at: '2026-09-22T10:00:00Z' }],
  app_meta: [{ key: 'visual_preferences', value: '{"tab":"sun"}' }],
};
const computer = {
  upkeep_items: [
    { id: 'u1', title: 'Filters', updated_at: '2026-09-22T10:00:00Z' },
    { id: 'u2', title: 'Gutters', updated_at: '2026-09-22T10:05:00Z' },
  ],
  app_meta: [{ key: 'visual_preferences', value: '{"tab":"leaf"}' }],
};
const both = run(base, phone, computer);
same(rowsOf(both, 'upkeep_items'), ['u1', 'u2'], 'the upkeep item added on the other device arrives');
check(
  both.tables.app_meta[0].value === '{"tab":"sun"}',
  'the setting changed on this device is still here',
);
check(both.entries.length === 2, 'both changes are recorded');
check(
  both.entries.some((e) => e.table === 'upkeep_items' && e.side === 'there' && e.kind === 'added'),
  'the other device is credited with the upkeep item',
);
check(
  both.entries.some((e) => e.table === 'app_meta' && e.side === 'here' && e.kind === 'changed'),
  'this device is credited with the setting',
);
check(merge.conflictsIn(both.entries).length === 0, 'two changes to different things are no conflict');

// 3. One side only, each direction and each kind.
const one = { meals: [{ id: 'm1', name: 'Soup' }] };
same(
  rowsOf(run(one, one, { meals: [{ id: 'm1', name: 'Soup' }, { id: 'm2', name: 'Stew' }] }), 'meals'),
  ['m1', 'm2'],
  'an addition over there arrives',
);
same(
  rowsOf(run(one, { meals: [{ id: 'm1', name: 'Soup' }, { id: 'm2', name: 'Stew' }] }, one), 'meals'),
  ['m1', 'm2'],
  'an addition here stays',
);
const edited = run(one, one, { meals: [{ id: 'm1', name: 'Broth' }] });
check(edited.tables.meals[0].name === 'Broth', 'an edit over there is taken');
check(edited.entries[0].kind === 'changed' && edited.entries[0].side === 'there', 'the edit is credited');
same(rowsOf(run(one, one, { meals: [] }), 'meals'), [], 'a removal over there is applied');
same(rowsOf(run(one, { meals: [] }, one), 'meals'), [], 'a removal here stands');
check(
  run(one, { meals: [] }, one).entries[0].side === 'here',
  'a removal here is credited to this device',
);
same(rowsOf(run(one, { meals: [] }, { meals: [] }), 'meals'), [], 'a removal on both sides is quiet');
check(
  run(one, { meals: [] }, { meals: [] }).entries.length === 0,
  'a removal on both sides says nothing',
);
check(run(one, one, one).entries.length === 0, 'nothing changed says nothing');

// 4. Two changes to the same row.
const timed = run(
  { meals: [{ id: 'm1', name: 'Soup', updated_at: '2026-09-22T09:00:00Z' }] },
  { meals: [{ id: 'm1', name: 'Mine', updated_at: '2026-09-22T11:00:00Z' }] },
  { meals: [{ id: 'm1', name: 'Theirs', updated_at: '2026-09-22T10:00:00Z' }] },
);
check(timed.tables.meals[0].name === 'Mine', 'the later of two edits wins by the time it carries');
check(timed.entries[0].conflict === 'later', 'the log marks it as two edits to one record');
check(timed.entries[0].side === 'here', 'the winning device is credited');
const untimed = run(
  { meals: [{ id: 'm1', name: 'Soup' }] },
  { meals: [{ id: 'm1', name: 'Mine' }] },
  { meals: [{ id: 'm1', name: 'Theirs' }] },
);
check(untimed.tables.meals[0].name === 'Theirs', 'without a time the device that saved later wins');
check(
  run(
    { meals: [{ id: 'm1', name: 'Soup' }] },
    { meals: [{ id: 'm1', name: 'Mine' }] },
    { meals: [{ id: 'm1', name: 'Theirs' }] },
    { laterSide: 'here' },
  ).tables.meals[0].name === 'Mine',
  'the later side is the one handed in',
);
const agreed = run(one, { meals: [{ id: 'm1', name: 'Broth' }] }, { meals: [{ id: 'm1', name: 'Broth' }] });
check(agreed.tables.meals[0].name === 'Broth', 'the same edit on both devices is kept');
check(agreed.entries[0].conflict === undefined, 'the same edit on both devices is no conflict');

// 5. A removal against an edit: the work somebody did since is kept.
const rescued = run(one, { meals: [{ id: 'm1', name: 'Kept' }] }, { meals: [] });
check(rescued.tables.meals.length === 1, 'an edit is kept over the other device removing the row');
check(rescued.entries[0].conflict === 'edited', 'the log says the removal was set aside');
const rescuedOther = run(one, { meals: [] }, { meals: [{ id: 'm1', name: 'Kept' }] });
check(rescuedOther.tables.meals.length === 1, 'it works the same way in the other direction');
check(rescuedOther.entries[0].side === 'there', 'and credits the device that made the edit');

// 6. Ids this device hands out.
const scannedHere = {
  scanned_products: [{ id: 7, barcode: '111', name: 'Beans' }],
  scanned_product_nutrients: [{ scanned_product_id: 7, nutrient_code: 'FE', amount_per_100g: 2 }],
};
const scannedThere = {
  scanned_products: [{ id: 7, barcode: '222', name: 'Rice' }],
  scanned_product_nutrients: [{ scanned_product_id: 7, nutrient_code: 'FE', amount_per_100g: 9 }],
};
const scanned = run({ scanned_products: [], scanned_product_nutrients: [] }, scannedHere, scannedThere);
const barcodes = scanned.tables.scanned_products.map((row) => row.barcode).sort();
same(barcodes, ['111', '222'], 'two devices that reached the same id keep both products');
const ids = scanned.tables.scanned_products.map((row) => row.id);
check(new Set(ids).size === ids.length, 'no two products end up under one id');
const rice = scanned.tables.scanned_products.find((row) => row.barcode === '222');
const riceNutrients = scanned.tables.scanned_product_nutrients.filter(
  (row) => row.scanned_product_id === rice.id,
);
check(riceNutrients.length === 1 && riceNutrients[0].amount_per_100g === 9, 'its nutrients came with it');
check(typeof rice.id === 'number', 'a renumbered id stays a number');
const sameProduct = run(
  { scanned_products: [], scanned_product_nutrients: [] },
  { scanned_products: [{ id: 3, barcode: '111', name: 'Beans' }], scanned_product_nutrients: [] },
  { scanned_products: [{ id: 9, barcode: '111', name: 'Beans' }], scanned_product_nutrients: [] },
);
check(sameProduct.tables.scanned_products.length === 1, 'one barcode is one product however it is numbered');
const untouched = { scanned_products: [{ id: 4, barcode: '333' }], scanned_product_nutrients: [] };
check(
  merge.renumberIncoming({ scanned_products: [], scanned_product_nutrients: [] }, untouched, shapes)
    .scanned_products[0].id === 4,
  'an id nothing here uses is left alone',
);
check(untouched.scanned_products[0].id === 4, 'renumbering does not write to what it was handed');

// 7. The first sync, with nothing agreed on yet.
const unioned = merge.mergeTables(
  null,
  { meals: [{ id: 'm1', name: 'Soup' }] },
  { meals: [{ id: 'm2', name: 'Stew' }] },
  { shapes, laterSide: 'there' },
);
same(rowsOf(unioned, 'meals'), ['m1', 'm2'], 'with no base both devices keep everything');

// 8. Tables one side has and the other does not, and tables taken whole.
const added = merge.mergeTables(null, { meals: [] }, { meals: [], moon_phases: [{ id: 'p1' }] }, {
  shapes,
  laterSide: 'there',
});
same(rowsOf(added, 'moon_phases'), ['p1'], 'a table a newer version added arrives whole');
const cached = merge.mergeTables(
  { cache: [{ id: 'c1', total: 1 }] },
  { cache: [{ id: 'c1', total: 2 }] },
  { cache: [{ id: 'c1', total: 3 }] },
  { shapes, laterSide: 'there', wholesale: ['cache'] },
);
check(cached.tables.cache[0].total === 3, 'a table the app works out is taken from the later side');
same(cached.wholesale, ['cache'], 'and is named so the caller can say so');
check(cached.entries.length === 0, 'a table taken whole is not somebody having made a change');

// 9. Whether there is anything to send back.
const nothingNew = merge.mergeTables(
  { meals: [{ id: 'm1', name: 'Soup', updated_at: '2026-09-22T10:00:00Z' }] },
  { meals: [{ id: 'm1', name: 'Soup', updated_at: '2026-09-22T10:00:00Z' }] },
  {
    meals: [
      { id: 'm1', name: 'Soup', updated_at: '2026-09-22T10:00:00Z' },
      { id: 'm2', name: 'Salad', updated_at: '2026-09-22T11:00:00Z' },
    ],
  },
  { shapes, laterSide: 'there' },
);
check(
  nothingNew.sendsBack === false,
  'taking in what the other device sent leaves nothing to send back to it',
);
const mineToo = merge.mergeTables(
  { meals: [] },
  { meals: [{ id: 'm3', name: 'Toast', updated_at: '2026-09-22T09:00:00Z' }] },
  { meals: [{ id: 'm2', name: 'Salad', updated_at: '2026-09-22T11:00:00Z' }] },
  { shapes, laterSide: 'there' },
);
check(mineToo.sendsBack === true, 'something added here has to go back the other way');
const orderOnly = merge.mergeTables(
  { meals: [] },
  {
    meals: [
      { id: 'm2', name: 'Salad', updated_at: '2026-09-22T11:00:00Z' },
      { id: 'm1', name: 'Soup', updated_at: '2026-09-22T10:00:00Z' },
    ],
  },
  {
    meals: [
      { id: 'm1', name: 'Soup', updated_at: '2026-09-22T10:00:00Z' },
      { id: 'm2', name: 'Salad', updated_at: '2026-09-22T11:00:00Z' },
    ],
  },
  { shapes, laterSide: 'there' },
);
check(
  orderOnly.sendsBack === false,
  'the same rows read back in a different order are the same rows',
);
const tableOnlyHere = merge.mergeTables(
  null,
  { meals: [], moon_phases: [{ id: 'p1' }] },
  { meals: [] },
  { shapes, laterSide: 'there' },
);
check(tableOnlyHere.sendsBack === true, 'a table only this device has, with rows in it, goes back');
const emptyTableOnlyHere = merge.mergeTables(
  null,
  { meals: [], moon_phases: [] },
  { meals: [] },
  { shapes, laterSide: 'there' },
);
check(
  emptyTableOnlyHere.sendsBack === false,
  'an empty table the other device has not built yet is nothing to send',
);
check(
  cached.sendsBack === false,
  'a worked-out table taken from the other side is nothing to send back',
);
const wholesaleHere = merge.mergeTables(
  { cache: [{ id: 'c1', total: 1 }] },
  { cache: [{ id: 'c1', total: 2 }] },
  { cache: [{ id: 'c1', total: 3 }] },
  { shapes, laterSide: 'here', wholesale: ['cache'] },
);
check(
  wholesaleHere.sendsBack === true,
  'a worked-out table kept from this side does have to go back',
);

// 10. What the other device is recorded as holding.
//
// The base for next time is what arrived, never what the merge made of
// it. Writing down the merged copy says the other device has seen rows it
// has never been handed, and the next copy it sends reads every one of
// them as a deletion.
const arrived = { meals: [{ id: 'm2', name: 'Stew' }] };
const carried = run({ meals: [] }, { meals: [{ id: 'm1', name: 'Soup' }] }, arrived);
same(carried.incoming, arrived, 'what arrived comes back as it arrived');
same(rowsOf(carried, 'meals'), ['m1', 'm2'], 'while the merge itself keeps both');
check(
  wholesaleHere.tables.cache[0].total === 2 && wholesaleHere.incoming.cache[0].total === 3,
  'a table taken whole from this side is still written down as what the other side holds',
);
check(
  scanned.incoming.scanned_products[0].id === rice.id,
  'a renumbered id is handed back in this device ids, not in theirs',
);
check(
  scanned.incoming.scanned_product_nutrients[0].scanned_product_id === rice.id,
  'and the rows that pointed at it were carried along',
);

// The two rounds the shadow exists for. A phone and a computer, one
// upkeep item between them.
const bothHeld = { upkeep_items: [{ id: 'u1', title: 'Filters' }] };
const phoneSent = { upkeep_items: [{ id: 'u1', title: 'Filters' }, { id: 'u2', title: 'Gutters' }] };
const roundOne = run(bothHeld, bothHeld, phoneSent);
same(rowsOf(roundOne, 'upkeep_items'), ['u1', 'u2'], 'the computer takes in what the phone added');
same(roundOne.incoming, phoneSent, 'and writes down what the phone holds');

// The computer adds one of its own, then the phone saves a copy it built
// before it had read any of that.
const computerNow = {
  upkeep_items: [{ id: 'u1', title: 'Filters' }, { id: 'u2', title: 'Gutters' }, { id: 'u3', title: 'Drains' }],
};
const roundTwo = run(roundOne.incoming, computerNow, phoneSent);
same(
  rowsOf(roundTwo, 'upkeep_items'),
  ['u1', 'u2', 'u3'],
  'against what the phone holds, the computer keeps the item it added',
);
const wrongBase = run(computerNow, computerNow, phoneSent);
same(
  rowsOf(wrongBase, 'upkeep_items'),
  ['u1', 'u2'],
  'against what the computer last sent, that same item reads as deleted and goes',
);

// 11. The words.
const words = (table) => {
  const map = {
    upkeep_items: { one: 'upkeep item', many: 'upkeep items', counts: true },
    meals: { one: 'meal', many: 'meals', counts: true },
    app_meta: { one: 'setting', many: 'settings', counts: false },
    meal_items: { one: 'meal', many: 'meals', counts: false },
  };
  return map[table] ?? null;
};
const entries = [
  { table: 'meals', key: 'a', kind: 'added', side: 'there' },
  { table: 'meals', key: 'b', kind: 'added', side: 'there' },
  { table: 'meals', key: 'c', kind: 'added', side: 'there' },
  { table: 'upkeep_items', key: 'd', kind: 'added', side: 'there' },
  { table: 'app_meta', key: 'e', kind: 'changed', side: 'here' },
  { table: 'nothing_named', key: 'f', kind: 'added', side: 'there' },
];
same(merge.describeMerge(entries, words, 'there'), ['3 more meals', '1 more upkeep item'], 'what arrived is said');
same(merge.describeMerge(entries, words, 'here'), ['edits to settings'], 'what this device did is said apart');
same(merge.describeMerge([], words, 'there'), [], 'a merge that did nothing says nothing');
same(
  merge.describeMerge([{ table: 'meals', key: 'a', kind: 'removed', side: 'there' }], words, 'there'),
  ['1 fewer meal'],
  'a removal is said in the singular',
);
const manyKinds = [];
for (const table of ['meals', 'upkeep_items']) {
  for (let i = 0; i < 3; i += 1) manyKinds.push({ table, key: 'a' + i, kind: 'added', side: 'there' });
  manyKinds.push({ table, key: 'r', kind: 'removed', side: 'there' });
  manyKinds.push({ table, key: 'c', kind: 'changed', side: 'there' });
}
const said = merge.describeMerge(manyKinds, words, 'there');
check(said.length === merge.MOST_MERGES_SAID + 1, 'past the fourth phrase the rest are counted');
check(said[said.length - 1] === '2 other things', 'the rest are counted in plain words');

// 12. The words themselves.
const banned = /[–—]| -- |\b(real|genuine|genuinely)\b/i;
for (const phrase of [...said, ...merge.describeMerge(entries, words, 'here')]) {
  check(!banned.test(phrase), 'phrase clean: ' + phrase);
  check(phrase === phrase.trim() && phrase.length > 0, 'phrase is a plain run of words: ' + phrase);
}
const source = fs.readFileSync(path.join(__dirname, '..', 'lib/snapshotMerge.ts'), 'utf8');
for (const line of source.split('\n')) {
  if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) continue;
  check(!/[–—]| -- /.test(line), 'comment clean: ' + line.trim().slice(0, 60));
}

if (failures > 0) {
  console.error(`${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`snapshotMerge: ${checks} checks passed`);
