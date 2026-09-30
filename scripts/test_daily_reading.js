// Checks lib/dailyReading.ts, the day's reading on Home (C20, 2026-09-30).
//
// 1. The order follows the lens, a declared stage puts Healing Stages
//    first, the closing entry comes last, and two conditions take turns
//    with no entry twice.
// 2. The day's entry stays all day, waits when it was not opened, moves on
//    the next day once it was, and starts over after the last one.
// 3. An entry that has left the order is replaced, and a stored state that
//    cannot be read is treated as none.
// 4. No word in the module keeps count of days or says anything was missed.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'dailyReading.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/dailyReading.ts must stay free of imports (asked for ' + name + ')');
});
const R = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

// 1. Order.
const a = {
  key: 'a',
  topics: [
    { label: 'Diet & Food', ids: ['a1', 'a2'] },
    { label: 'Healing Stages', ids: ['a3'] },
    { label: 'Healing Stages::Later', ids: ['a4'] },
  ],
  closingId: 'a-close',
  stageDeclared: false,
};
check(R.shelfOrder(a).join() === 'a1,a2,a3,a4,a-close', 'lens order, closing entry last');
check(
  R.shelfOrder({ ...a, stageDeclared: true }).join() === 'a3,a4,a1,a2,a-close',
  'a declared stage puts every Healing Stages shelf first',
);
const b = { key: 'b', topics: [{ label: 'Core Science', ids: ['b1', 'a1'] }], closingId: null, stageDeclared: false };
check(R.buildReadingOrder([a, b]).join() === 'a1,b1,a2,a3,a4,a-close', 'two conditions take turns, no entry twice');
check(R.buildReadingOrder([]).length === 0, 'no shelves, no order');

// 2. Days.
const order = ['x', 'y', 'z'];
const first = R.todaysReading(order, null, '2026-09-30');
check(first.id === 'x' && first.changed, 'the first day starts at the top');
const same = R.todaysReading(order, first.state, '2026-09-30');
check(same.id === 'x' && !same.changed, 'the same day keeps the same entry');
const waiting = R.todaysReading(order, first.state, '2026-10-02');
check(waiting.id === 'x', 'an entry not opened is still waiting days later');
const opened = R.markReadingOpened(first.state, 'x');
check(opened.opened.join() === 'x', 'opening it is remembered');
check(R.markReadingOpened(opened, 'x') === opened, 'opening it twice changes nothing');
check(R.markReadingOpened(opened, 'y') === opened, 'only the card entry is marked');
check(R.todaysReading(order, opened, '2026-09-30').id === 'x', 'opened today, it stays for the rest of today');
const next = R.todaysReading(order, opened, '2026-10-01');
check(next.id === 'y' && next.changed, 'the next day moves on once it was opened');
let state = next.state;
state = R.markReadingOpened(state, 'y');
state = R.todaysReading(order, state, '2026-10-02').state;
check(state.id === 'z', 'and on again');
state = R.markReadingOpened(state, 'z');
const again = R.todaysReading(order, state, '2026-10-03');
check(again.id === 'x' && again.state.opened.length === 0, 'after the last one the order starts over');

// 3. Changes to the order, and unreadable state.
const gone = R.todaysReading(['p', 'q'], { day: '2026-09-30', id: 'x', opened: ['x'] }, '2026-09-30');
check(gone.id === 'p' && gone.state.opened.length === 0, 'an entry no longer in the order is replaced');
check(R.todaysReading([], null, '2026-09-30').id === null, 'an empty order has no entry');
check(R.parseDailyReadingState('not json') === null, 'unreadable state is none');
check(R.parseDailyReadingState('{"day":1}') === null, 'state missing its parts is none');
const parsed = R.parseDailyReadingState(JSON.stringify({ day: '2026-09-30', id: 'x', opened: ['x', 3] }));
check(parsed && parsed.opened.join() === 'x', 'stored state reads back, dropping anything that is not an id');

// 4. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '');
for (const word of ['streak', 'missed', 'behind', 'catch up', 'in a row', 'well done', 'great job']) {
  check(!code.toLowerCase().includes(word), 'no "' + word + '" in the module');
}

console.log(`${checks - failures}/${checks} daily reading checks passed`);
if (failures > 0) process.exit(1);
