// Runs lib/calendarHeat.ts, a year in squares: F15, 2026-10-01.
//
// The rules checked:
//
//  1. One square per day for 365 days, a week to a column with Monday at
//     the top, the last square on the end day.
//  2. A day with nothing recorded has no level (an empty outline); a day
//     recorded with a figure of nothing is level 0, never the same thing.
//  3. Levels rank a day among the person's own days, and a fixed scale
//     (mood 1 to 5) by where the day sits on it.
//  4. dayCounts and daySums keep recorded zeros apart from unrecorded days.
//  5. The component draws an unrecorded day as an outline with no fill,
//     and the wiring reaches the Trends and Signals lenses named in the plan.
//  6. No dashes and no verdict or cause words.
//
// Run with: node scripts/test_calendar_heat.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) return {};
    throw new Error(`${relPath} has a runtime import ${name}`);
  });
  void dir;
  return module.exports;
}

const H = load('lib/calendarHeat.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

const END = '2026-10-01'; // a Thursday
const texts = [];

// 1. The grid
{
  check('shiftDay across a month', H.shiftDay('2026-03-31', 1) === '2026-04-01');
  check('shiftDay across daylight saving', H.shiftDay('2026-03-07', 2) === '2026-03-09' && H.shiftDay('2026-11-02', -2) === '2026-10-31');
  check('weekdayRow Monday 0', H.weekdayRow('2026-09-28') === 0 && H.weekdayRow('2026-10-04') === 6 && H.weekdayRow(END) === 3);
  check(`sayDay: ${H.sayDay(END)}`, H.sayDay(END) === 'Thu 1 Oct 2026');

  const heat = H.buildCalendarHeat(H.YEAR_STRIPS.drinks, new Map(), END);
  texts.push(heat.summary, heat.accessibilityLabel);
  check('365 squares', heat.cells.length === 365 && heat.total === 365);
  check('first square a year back', heat.start === '2025-10-02' && heat.cells[0].day === '2025-10-02');
  check('last square is the end day', heat.cells[364].day === END);
  check('first square on its weekday row', heat.cells[0].row === H.weekdayRow('2025-10-02'));
  check('rows run Monday to Sunday down a column', heat.cells.every((c, i) => i === 0 || (c.row === 0 ? c.column === heat.cells[i - 1].column + 1 : c.column === heat.cells[i - 1].column)));
  check('every day once', new Set(heat.cells.map((c) => c.day)).size === 365);
  check('column count covers the last square', heat.columns === heat.cells[364].column + 1);
  check('nothing recorded: every square an outline', heat.cells.every((c) => c.value === null && c.level === null));
  check(`empty summary: ${heat.summary}`, heat.summary === 'Nothing recorded in the last 365 days, so every square is an empty outline.');
  check('months labelled on a Monday column', heat.months.length >= 10 && heat.months.every((m) => {
    const first = heat.cells.find((c) => c.column === m.column && c.row === 0);
    return first && Number(first.day.slice(8)) <= 7;
  }));
  check('no month label at the right edge', heat.months.every((m) => m.column <= heat.columns - 2));
}

// 2 and 3. Gaps, zeros and levels
{
  const values = new Map([
    ['2026-09-01', 0],
    ['2026-09-02', 1],
    ['2026-09-03', 2],
    ['2026-09-04', 3],
    ['2026-09-05', 4],
    ['2026-09-06', 8],
    ['2026-09-07', 8],
    ['2026-09-08', 8],
    ['2024-01-01', 5], // outside the year
  ]);
  const heat = H.buildCalendarHeat(H.YEAR_STRIPS.drinks, values, END);
  texts.push(heat.summary);
  const at = (day) => heat.cells.find((c) => c.day === day);
  check('recorded zero is level 0', at('2026-09-01').level === 0 && at('2026-09-01').value === 0);
  check('unrecorded day has no level', at('2026-09-09').level === null && at('2026-09-09').value === null);
  check('zero and gap differ', at('2026-09-01').level !== at('2026-09-09').level);
  check('lowest positive is level 1', at('2026-09-02').level === 1);
  check('highest is level 4', at('2026-09-08').level === 4);
  check('levels never fall as the figure rises', ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'].every((d, i, a) => i === 0 || at(d).level >= at(a[i - 1]).level));
  check('outside the year is left out', heat.recorded === 8);
  check(`summary counts: ${heat.summary}`, heat.summary === '8 days of the last 365 have something recorded. The other 357 days are empty outlines, never the lightest colour.');

  const same = H.levelsFor([2, 2, 2]);
  check('all the same is the middle', same(2) === 3 && same(0) === 0);
  const mood = H.levelsFor([], [1, 5]);
  check('scale: 1 is level 1, 5 is level 4, 3 is between', mood(1) === 1 && mood(5) === 4 && mood(3) >= 2 && mood(3) <= 3);
  const one = H.buildCalendarHeat(H.YEAR_STRIPS.mood, new Map([[END, 4]]), END);
  texts.push(one.summary);
  check(`one day: singular: ${one.summary}`, one.summary.startsWith('1 day of the last 365 has something recorded.'));
  const full = new Map(Array.from({ length: 365 }, (_, i) => [H.shiftDay(END, -i), 1]));
  const all = H.buildCalendarHeat(H.YEAR_STRIPS.done, full, END);
  texts.push(all.summary);
  check(`all recorded: ${all.summary}`, all.summary.endsWith('None are left empty.'));
}

// 4. Counts and sums
{
  const c = H.dayCounts(['2026-09-02', '2026-09-02', '2026-09-03'], ['2026-09-01', '2026-09-02']);
  check('dayCounts adds events', c.get('2026-09-02') === 2 && c.get('2026-09-03') === 1);
  check('dayCounts keeps a recorded zero', c.get('2026-09-01') === 0);
  check('dayCounts leaves out unrecorded days', !c.has('2026-09-04'));
  const s = H.daySums([{ day: '2026-09-01', value: 30 }, { day: '2026-09-01', value: 15 }, { day: '2026-09-02', value: null }]);
  check('daySums adds', s.get('2026-09-01') === 45);
  check('daySums: a null amount still marks the day', s.get('2026-09-02') === 0);
}

// Described days
{
  const lines = [
    H.describeCell(H.YEAR_STRIPS.drinks, { day: END, value: 3 }),
    H.describeCell(H.YEAR_STRIPS.drinks, { day: END, value: 0 }),
    H.describeCell(H.YEAR_STRIPS.drinks, { day: END, value: null }),
    H.describeCell(H.YEAR_STRIPS.flares, { day: END, value: 1 }),
    H.describeCell(H.YEAR_STRIPS.flares, { day: END, value: 2 }),
    H.describeCell(H.YEAR_STRIPS.mood, { day: END, value: 4 }),
    H.describeCell(H.YEAR_STRIPS.nights, { day: END, value: 0 }),
    H.describeCell(H.YEAR_STRIPS.nights, { day: END, value: 2 }),
    H.describeCell(H.YEAR_STRIPS.exercise, { day: END, value: 45 }),
    H.describeCell(H.YEAR_STRIPS.steps, { day: END, value: 8412 }),
    H.describeCell(H.YEAR_STRIPS.done, { day: END, value: 1 }),
    H.describeCell(H.YEAR_STRIPS.reactions, { day: END, value: 1 }),
  ];
  texts.push(...lines, H.HEAT_SHADE_NOTE);
  check(`drinks: ${lines[0]}`, lines[0] === 'Thu 1 Oct 2026: 3 drinks logged.');
  check(`zero drinks: ${lines[1]}`, lines[1] === 'Thu 1 Oct 2026: meals logged, no drink among them.');
  check(`nothing: ${lines[2]}`, lines[2] === 'Thu 1 Oct 2026: nothing recorded.');
  check(`two flares: ${lines[4]}`, lines[4] === 'Thu 1 Oct 2026: 2 flares and reactions.');
  check(`steps: ${lines[9]}`, lines[9] === 'Thu 1 Oct 2026: 8,412 steps.');
  check('every set names known strips', Object.values(H.YEAR_SQUARE_SETS).every((keys) => keys.every((k) => k === 'trackers' || H.YEAR_STRIPS[k])));
}

// 5. The component and the wiring
{
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const strip = read('components/CalendarHeatStrip.tsx');
  check('component draws with react-native-svg', /from 'react-native-svg'/.test(strip));
  check('an unrecorded day is drawn with no fill', /c\.level === null \?[\s\S]*?fill="none"/.test(strip));
  check('the legend shows the outline as nothing recorded', strip.includes('Nothing recorded'));
  const trends = read('app/(tabs)/trends.tsx');
  for (const lens of ['hydration', 'nights', 'reactions', 'workouts', 'movement', 'symptoms', 'keepingUp', 'trackers']) {
    check(`Trends > ${lens} carries the year`, new RegExp(`\\n  ${lens}: '${lens}',`).test(trends));
  }
  check('Trends draws the band', /<YearInSquaresBand set=\{YEAR_SQUARE_LENSES\[lens\]\}/.test(trends));
  const log = read('app/(tabs)/log.tsx');
  check('Signals > Flares carries the year', log.includes('<YearInSquaresBand set="flares"'));
  check('Signals > Exercise carries the year', log.includes('<YearInSquaresBand set="exercise"'));
  check('pure module never reaches the database', !/from '\.\/db'/.test(read('lib/calendarHeat.ts')));
  const db = read('lib/calendarHeatDb.ts');
  check('loader only reads', !/\b(INSERT|UPDATE|DELETE)\b/.test(db));
}

// 6. Words
{
  const banned = [...READING_FORBIDDEN_WORDS, 'because of', '—', '–', ' -- ', 'genuine', 'normal', 'healthy', 'good day', 'bad day'];
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
    check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
  }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
