// Checks lib/snapshotDelta.ts, the changes file between one person's two
// devices (2026-09-30, 1.0.57.12): a save sends the rows added, changed or
// removed since the last whole copy, rather than the whole copy again.
//
// 1. Adding the changes to the whole copy gives back exactly what the
//    sender held: adds, edits and removals by key; a table with no key
//    by what each row says; a repeated key, a key left empty or two
//    identical key-less rows, sent whole; a table
//    new since the whole copy; a table gone since it.
//    Also a few hundred random edits, checked the same way.
// 2. Nothing changed sends nothing, and a table unchanged but in another
//    order is not sent.
// 3. Changes added to the wrong whole copy answer null, never a wrong one.
// 4. The size rule: half a whole copy or less is sent as changes.
// 5. parseDelta refuses anything that is not a changes file, including a
//    whole copy, and a changes file is refused by parseBackupEnvelope, so
//    an older build says it cannot read it rather than loading part of it.
// 6. The record names the whole copy a changes file builds on, and reads
//    back the same; a record with no base is still a whole copy.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
    return load(path.posix.join(dir, name) + '.ts');
  });
  return module.exports;
}

const D = load('lib/snapshotDelta.ts');
const S = load('lib/snapshotSync.ts');
const M = load('lib/snapshotMerge.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => {
  const names = Object.keys(a).sort();
  if (names.join('|') !== Object.keys(b).sort().join('|')) return false;
  return names.every((name) => M.sameRows(a[name], b[name]));
};
// Through JSON, the way it travels.
const roundTrip = (base, current, shapes) => {
  const delta = D.buildDelta({
    base,
    baseSavedAt: 't0',
    current,
    savedAt: 't1',
    schemaVersion: 7,
    tableNames: Object.keys(current),
    shapes,
  });
  const parsed = D.parseDelta(JSON.parse(JSON.stringify(delta)));
  return { delta, parsed, rebuilt: parsed ? D.applyDelta(clone(base), parsed) : null };
};

const shapes = {
  meals: { key: ['id'] },
  meal_items: { key: ['meal_id', 'food'] },
  notes: { key: [] },
  tags: { key: ['name'] },
};
const base = {
  meals: [
    { id: 1, name: 'Oats', eaten_at: '2026-09-29' },
    { id: 2, name: 'Soup', eaten_at: '2026-09-29' },
    { id: 3, name: 'Salad', eaten_at: '2026-09-30' },
  ],
  meal_items: [
    { meal_id: 1, food: 'oats', grams: 40 },
    { meal_id: 1, food: 'milk', grams: 200 },
  ],
  notes: [{ text: 'a' }, { text: 'b' }],
  tags: [{ name: 'x', colour: null }],
  old_table: [{ id: 1 }],
};

// 1. Round trips.
const current = clone(base);
current.meals[1].name = 'Lentil soup';
current.meals.splice(2, 1);
current.meals.push({ id: 4, name: 'Eggs', eaten_at: '2026-09-30' });
current.meal_items.push({ meal_id: 4, food: 'egg', grams: 100 });
current.notes.push({ text: 'c' });
current.tags.push({ name: null, colour: 'red' });
current.new_table = [{ id: 9, value: 'here' }];
delete current.old_table;
const trip = roundTrip(base, current, shapes);
check(trip.parsed !== null, 'the changes file reads back');
check(trip.rebuilt !== null && same(trip.rebuilt, current), 'adding the changes gives back what the sender held');
const meals = trip.delta.changedTables.meals;
check(meals && meals.upsert.length === 2 && meals.remove.length === 1, 'meals: one edit and one add sent, one removal');
check(meals.upsert.every((row) => row.id !== 1), 'an unchanged row is not sent');
check(trip.delta.changedTables.notes.upsert.length === 1, 'a table with no key goes by what each row says');
check(Array.isArray(trip.delta.changedTables.tags.rows), 'a key left empty sends the table whole');
check(Array.isArray(trip.delta.changedTables.new_table.rows), 'a new table is sent whole');
check(trip.delta.droppedTables.join() === 'old_table', 'a table gone since is named');
check(trip.delta.changedTables.meal_items.upsert.length === 1, 'a changed child table sends its one new row');
const twice = clone(base);
twice.notes.push({ text: 'a' });
const twiceTrip = roundTrip(base, twice, shapes);
check(Array.isArray(twiceTrip.delta.changedTables.notes.rows), 'two identical rows with no key send the table whole');
check(twiceTrip.rebuilt && same(twiceTrip.rebuilt, twice), 'and it still adds up');

const repeated = clone(base);
repeated.meals.push({ id: 1, name: 'Oats again', eaten_at: '2026-09-30' });
const repeatedTrip = roundTrip(base, repeated, shapes);
check(Array.isArray(repeatedTrip.delta.changedTables.meals.rows), 'a repeated key sends the table whole');
check(repeatedTrip.rebuilt && same(repeatedTrip.rebuilt, repeated), 'and it still adds up');

// Random edits.
let seed = 42;
const random = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
let randomOk = true;
for (let round = 0; round < 300; round += 1) {
  const start = { meals: [], meal_items: [] };
  for (let id = 1; id <= 20; id += 1) start.meals.push({ id, name: 'n' + id, grams: id });
  for (let id = 1; id <= 10; id += 1) start.meal_items.push({ meal_id: id, food: 'f' + id, grams: id });
  const next = clone(start);
  const edits = 1 + Math.floor(random() * 8);
  for (let edit = 0; edit < edits; edit += 1) {
    const roll = random();
    if (roll < 0.35 && next.meals.length > 0) {
      next.meals[Math.floor(random() * next.meals.length)].name = 'e' + Math.floor(random() * 1000);
    } else if (roll < 0.6 && next.meals.length > 0) {
      next.meals.splice(Math.floor(random() * next.meals.length), 1);
    } else if (roll < 0.85) {
      next.meals.push({ id: 100 + round * 10 + edit, name: 'new', grams: edit });
    } else {
      next.meal_items.reverse();
      if (next.meal_items.length) next.meal_items[0].grams += 1;
    }
  }
  const result = roundTrip(start, next, shapes);
  if (!result.rebuilt || !same(result.rebuilt, next)) {
    randomOk = false;
    break;
  }
}
check(randomOk, '300 rounds of random edits all add back up');

// 2. Nothing, and order only.
const nothing = roundTrip(base, clone(base), shapes);
check(Object.keys(nothing.delta.changedTables).length === 0 && nothing.delta.droppedTables.length === 0, 'nothing changed sends nothing');
const reordered = clone(base);
reordered.meals.reverse();
check(!('meals' in roundTrip(base, reordered, shapes).delta.changedTables), 'the same rows in another order are not sent');
check(D.tablesDigest(base) === D.tablesDigest(reordered), 'the fingerprint ignores row order');
check(D.tablesDigest(base) !== D.tablesDigest(current), 'the fingerprint sees a change');

// 3. The wrong whole copy.
const other = clone(base);
other.meals[0].name = 'Something else';
check(D.applyDelta(other, trip.parsed) === null, 'changes added to the wrong whole copy answer null');
const missingRow = clone(base);
missingRow.meals.shift();
check(D.applyDelta(missingRow, trip.parsed) === null, 'a whole copy missing a row answers null');

// 4. Size.
check(D.DELTA_WHOLE_SHARE === 0.5, 'the line is half a whole copy');
check(D.deltaWorthSending(500, 1000) && !D.deltaWorthSending(501, 1000), 'half or less is sent as changes');
const big = {};
big.meals = [];
for (let id = 0; id < 200; id += 1) big.meals.push({ id, name: 'meal ' + id });
const bigNext = clone(big);
bigNext.meals.forEach((row) => (row.name += '!'));
const bigDelta = JSON.stringify(roundTrip(big, bigNext, shapes).delta);
check(!D.deltaWorthSending(bigDelta.length, JSON.stringify({ tables: bigNext }).length), 'every row changed goes whole');
const smallNext = clone(big);
smallNext.meals[5].name = 'changed';
const smallDelta = JSON.stringify(roundTrip(big, smallNext, shapes).delta);
check(D.deltaWorthSending(smallDelta.length, JSON.stringify({ tables: smallNext }).length), 'one row changed goes as changes');

// 5. Reading.
check(D.parseDelta(null) === null, 'null is no changes file');
check(D.parseDelta({ schemaVersion: 1, exportedAt: 'x', tables: {} }) === null, 'a whole copy is no changes file');
check(D.parseDelta({ ...trip.delta, version: 2 }) === null, 'an unknown version is refused');
check(D.parseDelta({ ...trip.delta, changedTables: { meals: { key: ['id'] } } }) === null, 'a table with its parts missing is refused');
const deltaText = JSON.stringify(trip.delta);
check(!('exportedAt' in trip.delta) && !('tables' in trip.delta), 'a changes file carries no exportedAt and no tables');
const backup = fs.readFileSync(path.join(__dirname, '..', 'lib/dataBackup.ts'), 'utf8');
check(/exportedAt/.test(backup) && /tables/.test(backup), 'parseBackupEnvelope still asks for exportedAt and tables');
check(JSON.parse(deltaText).kind === D.DELTA_KIND, 'the changes file says what it is');

// 6. The record.
const phone = { kind: 'phone', fingerprint: 'abc123' };
const whole = S.buildSnapshotRecord(phone, 't1');
check(whole.latest.base === undefined, 'a whole copy names no base');
check(S.parseSnapshotRecord(JSON.stringify(whole)).latest.base === undefined, 'and reads back without one');
const withBase = S.buildSnapshotRecord(phone, 't2', { fileName: D.changesFileName(phone), baseSavedAt: 't1' });
check(withBase.latest.fileName === 'inside-story-changes-phone-abc123.json', 'the record names the changes file');
check(withBase.latest.base.fileName === S.snapshotFileName(phone) && withBase.latest.base.savedAt === 't1', 'and the whole copy it builds on');
const readBack = S.parseSnapshotRecord(JSON.stringify(withBase));
check(JSON.stringify(readBack) === JSON.stringify(withBase), 'a record with a base reads back the same');
check(S.parseSnapshotRecord(JSON.stringify({ ...withBase, latest: { ...withBase.latest, base: { fileName: 1 } } })) === null, 'an unreadable base is refused');
check(!S.isSnapshotFileName(D.changesFileName(phone)), 'a changes file is not taken for a whole copy');

console.log(`${checks - failures}/${checks} snapshot changes checks passed`);
if (failures > 0) process.exit(1);
