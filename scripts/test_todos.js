// Checks lib/todos.ts (C10, to-dos with a day and a repeat): grouping, the
// next day of a repeating one, what answering writes, the typed-sentence
// reading, and that no sentence calls a to-do late, missed or failed.
// "Today" is fixed at Wednesday 30 September 2026.
// Run: node scripts/test_todos.js
/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(rel) {
  const file = path.join(__dirname, '..', 'lib', `${rel}.ts`);
  if (cache[file]) return cache[file];
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const m = { exports: {} };
  cache[file] = m.exports;
  new Function('module', 'exports', 'require', outputText)(m, m.exports, (name) => {
    if (name.startsWith('./')) return load(name.slice(2));
    throw new Error(`lib/todos.ts must stay pure, asked for ${name}`);
  });
  cache[file] = m.exports;
  return m.exports;
}
const T = load('todos');
const TODAY = '2026-09-30';
const NOW = new Date(2026, 8, 30, 10, 0);

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL ${name}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

let n = 0;
function todo(over) {
  n++;
  return {
    id: `t${n}`,
    title: `To-do ${n}`,
    notes: null,
    area: 'personal',
    dueOn: null,
    anchorOn: null,
    repeat: null,
    doneAt: null,
    closedAs: null,
    createdAt: `2026-09-01T00:00:0${n % 10}Z`,
    ...over,
  };
}
const weekly = { type: 'weekly', interval: 1, weekdays: [5], endType: 'indefinite' };
const daily = { type: 'daily', interval: 1, endType: 'indefinite' };

// Grouping.
const list = [
  todo({ dueOn: '2026-09-20' }),
  todo({ dueOn: TODAY }),
  todo({ dueOn: '2026-10-03' }),
  todo({ dueOn: '2026-10-07' }),
  todo({ dueOn: '2026-10-08' }),
  todo({}),
  todo({ dueOn: '2026-09-25', doneAt: '2026-09-26T10:00:00Z', closedAs: 'done' }),
];
const groups = T.groupTodos(list, TODAY);
check('group order', groups.map((g) => g.key).join() === 'earlier,today,soon,later,noDate,closed', groups.map((g) => g.key));
check('seven days ahead is this week', groups.find((g) => g.key === 'soon').todos.length === 2);
check('eight days ahead is further', groups.find((g) => g.key === 'later').todos.length === 1);
check('past day still open', T.todoGroupOf(list[0], TODAY) === 'earlier');
check('closed wins over its day', T.todoGroupOf(list[6], TODAY) === 'closed');
check('empty groups left out', T.groupTodos([todo({})], TODAY).length === 1);

// Next day of a repeating one.
const nextOf = (dueOn, anchorOn, repeat, today) => T.nextTodoDay({ dueOn, anchorOn, repeat }, today);
check('daily done today moves to tomorrow', nextOf(TODAY, TODAY, daily, TODAY) === '2026-10-01');
check('daily waiting since the 20th skips what went by', nextOf('2026-09-20', '2026-09-20', daily, TODAY) === '2026-10-01');
// Friday 2 October is the one waited on; done early on Wednesday moves to 9 October.
check('weekly done early moves past the one waited on', nextOf('2026-10-02', '2026-10-02', weekly, TODAY) === '2026-10-09', nextOf('2026-10-02', '2026-10-02', weekly, TODAY));
const twice = { ...daily, endType: 'count', count: 2 };
check('count end: second of two follows the first', nextOf(TODAY, TODAY, twice, TODAY) === '2026-10-01');
check('count end: after the last, nothing', nextOf('2026-10-01', TODAY, twice, '2026-10-01') === null, nextOf('2026-10-01', TODAY, twice, '2026-10-01'));
const until = { ...daily, endType: 'until_date', until: '2026-10-01' };
check('until end reached', nextOf('2026-10-01', TODAY, until, '2026-10-01') === null, nextOf('2026-10-01', TODAY, until, '2026-10-01'));
check('no repeat has no next', nextOf(TODAY, null, null, TODAY) === null);

// Answering.
const oneOff = T.planTodoAnswer({ dueOn: TODAY, anchorOn: null, repeat: null }, 'done', TODAY);
check('one-off done closes', oneOff.closes && oneOff.doing.kind === 'done');
const rep = T.planTodoAnswer({ dueOn: TODAY, anchorOn: TODAY, repeat: daily }, 'let_go', TODAY);
check('repeating let go moves on', !rep.closes && rep.nextDueOn === '2026-10-01' && rep.doing.kind === 'let_go');
const last = T.planTodoAnswer({ dueOn: '2026-10-01', anchorOn: TODAY, repeat: twice }, 'done', '2026-10-01');
check('last of a count closes', last.closes);

// Wording.
const cap = (dueOn) => T.describeTodoCaption(todo({ dueOn }), TODAY);
check('caption today', cap(TODAY) === 'Today');
check('caption tomorrow', cap('2026-10-01') === 'Tomorrow');
check('caption yesterday', cap('2026-09-29') === 'From yesterday');
check('caption earlier', cap('2026-09-20') === 'From Sun 20 Sep', cap('2026-09-20'));
check('caption other year', T.formatTodoDay('2027-01-04', TODAY) === 'Mon 4 Jan 2027');
const weeklyCaption = T.describeTodoCaption(todo({ dueOn: '2026-10-02', anchorOn: '2026-10-02', repeat: weekly }), TODAY);
check('caption repeat', weeklyCaption.startsWith('Fri 2 Oct · '), weeklyCaption);
check('let go label', T.letGoLabel({ repeat: daily }) === 'Let this one go' && T.letGoLabel({ repeat: null }) === 'Let it go');
check('answered repeat', T.describeTodoAnswered('Water ferns', rep, 'let_go', TODAY) === 'Water ferns: this one let go, next Thu 1 Oct.');

// Reading a typed to-do.
const plain = T.readTodoWords('buy stamps', NOW);
check('no day read', plain.title === 'buy stamps' && plain.dueOn === null && plain.repeat === null, plain);
const bill = T.readTodoWords('pay the water bill on October 20', NOW);
check('day read', bill.dueOn === '2026-10-20' && !/october|20/i.test(bill.title), bill);
const ferns = T.readTodoWords('water the ferns every 3 days', NOW);
check('repeat read', ferns.repeat !== null && ferns.dueOn !== null && !/every/i.test(ferns.title), ferns);
const timed = T.readTodoWords('call the dentist tomorrow at 3pm', NOW);
check('time named as left out', timed.dueOn === '2026-10-01' && timed.notes.some((line) => /not the time/.test(line)), timed);
check('when empty is no day', JSON.stringify(T.readTodoWhen('', NOW)) === JSON.stringify({ dueOn: null, repeat: null }));
check('when tomorrow', (T.readTodoWhen('tomorrow', NOW) || {}).dueOn === '2026-10-01', T.readTodoWhen('tomorrow', NOW));
const monday = T.readTodoWhen('every Monday', NOW);
check('when every Monday', monday && monday.repeat && monday.repeat.type === 'weekly', monday);
check('when unreadable is null', T.readTodoWhen('whenever', NOW) === null, T.readTodoWhen('whenever', NOW));
check('when read back', T.describeTodoWhen(null, null, TODAY) === 'No day' && T.describeTodoWhen(TODAY, null, TODAY) === 'Today');

// No verdict words anywhere a to-do is described, the screen included.
const screen = fs
  .readFileSync(path.join(__dirname, '..', 'components', 'TodoSection.tsx'), 'utf8')
  .split('\n')
  .filter((line) => !/^\s*\/\//.test(line))
  .join('\n');
const said = [
  ...Object.values(T.TODO_GROUP_LABELS),
  ...list.map((t) => T.describeTodoCaption(t, TODAY)),
  T.describeTodoAnswered('X', oneOff, 'done', TODAY),
  T.describeTodoAnswered('X', rep, 'done', TODAY),
  T.describeTodoAnswered('X', oneOff, 'let_go', TODAY),
  ...timed.notes,
  screen,
].join('\n');
for (const word of ['late', 'missed', 'failed', 'overdue', 'streak', 'behind', 'genuine', 'real']) {
  check(`no "${word}"`, !new RegExp(`\\b${word}\\b`, 'i').test(said));
}
check('no em or en dash', !/[–—]/.test(said));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
