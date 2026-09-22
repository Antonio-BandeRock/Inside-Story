// Checks lib/syncLog.ts, the record of what automatic sync did (2026-09-22,
// direct instruction: "The user should be able to have the update on the
// screen that tells them about each change that was made by which device,
// or to not see them and assume that the system works each time, but there
// is a log for them to view."):
//
// 1. Many records of one kind changed at once read as one line, not many.
// 2. Each line says which device the change was made on.
// 3. A record both devices had moved is marked as such, and kept apart
//    from the plain changes of the same kind.
// 4. A table whose rows only mark their area as touched reads as an edit,
//    however the row arrived.
// 5. The busiest line is said first.
// 6. The sentence each line reads as, singular and plural.
//
// The module reads and writes the database, so its runtime imports are
// stubbed here rather than refused. Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const stubs = {
  './db': {
    getDatabase: async () => {
      throw new Error('no database in this test');
    },
  },
  './databaseActivity': { withDatabaseWriteTrackingSuspended: async (run) => run() },
  './snapshotChanges': { wordsForTable: () => null },
  './snapshotMerge': {},
  './snapshotSync': {},
};

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`${relPath} asked for an unexpected module (${name})`);
  });
  return module.exports;
}

const log = load('lib/syncLog.ts');

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

// The words lib/snapshotChanges.ts hands over for the tables used below.
const WORDS = {
  shopping_list_items: { one: 'shopping list item', many: 'shopping list items', counts: true },
  meals: { one: 'meal', many: 'meals', counts: true },
  garden_countdowns: { one: 'Days Until counter', many: 'Days Until counters', counts: true },
  meal_items: { one: 'meal', many: 'meals', counts: false },
};
const words = (table) => WORDS[table] ?? null;

// This device is the phone; the copy that arrived came from the computer.
const DEVICES = { here: 'phone', there: 'computer' };

function entry(table, key, kind, side, conflict) {
  return conflict === undefined ? { table, key, kind, side } : { table, key, kind, side, conflict };
}

// 1 and 2. Eleven items ticked off on the computer is one line that says so.
const ticked = [];
for (let i = 0; i < 11; i += 1) ticked.push(entry('shopping_list_items', 'i' + i, 'changed', 'there'));
same(
  log.linesForMerge(ticked, DEVICES, words),
  [
    {
      deviceKind: 'computer',
      area: 'shopping list items',
      areaOne: 'shopping list item',
      kind: 'changed',
      count: 11,
      conflict: false,
    },
  ],
  'eleven items ticked off on one device read as one line',
);

// Each side keeps its own line, even for the same kind of thing.
const sides = log.linesForMerge(
  [entry('meals', 'a', 'added', 'there'), entry('meals', 'b', 'added', 'here')],
  DEVICES,
  words,
);
check(sides.length === 2, 'each device gets a line of its own');
check(
  sides.some((line) => line.deviceKind === 'computer') && sides.some((line) => line.deviceKind === 'phone'),
  'and each line names the device the change was made on',
);

// Added, changed and removed stay apart.
const mixed = log.linesForMerge(
  [
    entry('meals', 'a', 'added', 'there'),
    entry('meals', 'b', 'removed', 'there'),
    entry('meals', 'c', 'changed', 'there'),
  ],
  DEVICES,
  words,
);
check(mixed.length === 3, 'added, changed and removed are not folded together');

// 3. A record both devices had moved is its own line.
const clash = log.linesForMerge(
  [entry('meals', 'a', 'changed', 'there'), entry('meals', 'b', 'changed', 'there', 'later')],
  DEVICES,
  words,
);
check(clash.length === 2, 'a record changed in both places is kept apart from the plain changes');
check(
  clash.some((line) => line.conflict) && clash.some((line) => !line.conflict),
  'and it is the one marked as such',
);

// 4. A table that only marks its area as touched reads as an edit.
same(
  log.linesForMerge([entry('meal_items', 'x', 'added', 'there')], DEVICES, words),
  [{ deviceKind: 'computer', area: 'meals', areaOne: 'meal', kind: 'changed', count: 1, conflict: false }],
  'a row that only marks its area as touched reads as an edit, however it arrived',
);

// A table with no words of its own is passed over rather than guessed at.
same(
  log.linesForMerge([entry('some_new_table', 'x', 'added', 'there')], DEVICES, words),
  [],
  'a table nobody has words for is left unsaid',
);

// 5. The busiest line is said first.
const ordered = log.linesForMerge(
  [
    entry('meals', 'a', 'added', 'there'),
    entry('garden_countdowns', 'c1', 'added', 'there'),
    entry('garden_countdowns', 'c2', 'added', 'there'),
    entry('garden_countdowns', 'c3', 'added', 'there'),
  ],
  DEVICES,
  words,
);
check(ordered[0].area === 'Days Until counters' && ordered[0].count === 3, 'the busiest line is said first');

// 6. What each line reads as.
const line = (over) => ({
  id: 'x',
  mergedAt: '2026-09-22T10:00:00.000Z',
  deviceKind: 'computer',
  area: 'meals',
  areaOne: 'meal',
  kind: 'added',
  count: 3,
  conflict: false,
  ...over,
});
check(log.describeLogRow(line()) === '3 more meals', 'several added read as more');
check(log.describeLogRow(line({ count: 1 })) === '1 more meal', 'one added reads in the singular');
check(log.describeLogRow(line({ kind: 'removed' })) === '3 fewer meals', 'removed reads as fewer');
check(log.describeLogRow(line({ kind: 'removed', count: 1 })) === '1 fewer meal', 'one removed reads in the singular');
check(log.describeLogRow(line({ kind: 'changed' })) === 'edits to meals', 'changed reads as edits');
check(
  log.describeLogRow(line({ kind: 'changed', count: 1 })) === 'edits to meals',
  'one edit reads the same way, since a count of edits would mean nothing',
);

// Nothing on a line is a sentence fragment somebody would not say.
for (const sentence of [log.describeLogRow(line()), log.describeLogRow(line({ kind: 'changed' }))]) {
  check(!/\s--\s|—|–/.test(sentence), 'no dashes standing in for punctuation: ' + sentence);
  check(!/\b(real|genuine|genuinely)\b/i.test(sentence), 'no filler words: ' + sentence);
}

// How many merges are kept, which is what the viewer tells the person.
check(log.SYNC_LOG_KEPT === 200, 'the log keeps the last 200 merges');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ': ' + (checks - failures) + '/' + checks + ' checks');
process.exit(failures === 0 ? 0 : 1);
