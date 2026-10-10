// Checks lib/lifeSquares.ts, Your Life in Squares (2026-10-02): where each
// shape of stored stamp lands on the local clock, that nothing after now is
// drawn, moving between periods and levels, the five page builders, that
// every source names a lens its tab knows, the wording, and, when the
// desktop app's database is on this PC, that every source's two queries
// run against the actual schema.
// Run: node scripts/test_life_squares.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

// A fixed zone west of Greenwich with no daylight saving, so an evening
// UTC stamp must move back a day.
process.env.TZ = 'America/Mexico_City';

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const src = read('lib/lifeSquares.ts');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
  throw new Error(`lib/lifeSquares.ts imported ${name}`);
});
const M = mod.exports;

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const same = (label, got, want) => ok(label, JSON.stringify(got) === JSON.stringify(want), { got, want });

// --- stamps ---------------------------------------------------------------------
same('plain date has no time', M.placeStamp('2026-10-02'), { day: '2026-10-02', minute: null });
same('local stamp read as written', M.placeStamp('2026-10-02T21:15'), { day: '2026-10-02', minute: 21 * 60 + 15 });
same('local stamp with seconds', M.placeStamp('2026-10-02T07:05:00'), { day: '2026-10-02', minute: 7 * 60 + 5 });
same('UTC evening moves back a day', M.placeStamp('2026-10-02T03:30:00.000Z'), { day: '2026-10-01', minute: 21 * 60 + 30 });
same('offset stamp', M.placeStamp('2026-10-02T12:00:00+02:00'), { day: '2026-10-02', minute: 4 * 60 });
same("SQLite datetime('now') is UTC", M.placeStamp('2026-10-02 02:00:00'), { day: '2026-10-01', minute: 20 * 60 });
same('nothing', M.placeStamp(null), null);
same('not a date', M.placeStamp('soon'), null);

// --- now --------------------------------------------------------------------------
ok('yesterday recorded', M.isRecorded({ day: '2026-10-01', minute: 23 * 60 }, '2026-10-02', 60));
ok('later today not yet', !M.isRecorded({ day: '2026-10-02', minute: 18 * 60 }, '2026-10-02', 9 * 60));
ok('earlier today recorded', M.isRecorded({ day: '2026-10-02', minute: 8 * 60 }, '2026-10-02', 9 * 60));
ok('today with no time recorded', M.isRecorded({ day: '2026-10-02', minute: null }, '2026-10-02', 0));
ok('tomorrow not yet', !M.isRecorded({ day: '2026-10-03', minute: null }, '2026-10-02', 0));

// --- days and periods ------------------------------------------------------------
same('week starts Sunday', M.weekStartOf('2026-10-02'), '2026-09-27');
same('Sunday is its own start', M.weekStartOf('2026-09-27'), '2026-09-27');
same('February in a leap year', M.daysInMonth(2028, 2), 29);
same('year span', M.periodDays({ level: 'year', day: '2026-05-09', hour: 8 }), { from: '2026-01-01', through: '2026-12-31' });
same('month span', M.periodDays({ level: 'month', day: '2026-02-14', hour: 8 }), { from: '2026-02-01', through: '2026-02-28' });
same('week span', M.periodDays({ level: 'week', day: '2026-10-02', hour: 8 }), { from: '2026-09-27', through: '2026-10-03' });
same('month back over a year end', M.shiftPlace({ level: 'month', day: '2026-01-31', hour: 8 }, -1).day, '2025-12-01');
same('month forward from the 31st', M.shiftPlace({ level: 'month', day: '2026-01-31', hour: 8 }, 1).day, '2026-02-01');
same('week back', M.shiftPlace({ level: 'week', day: '2026-10-02', hour: 8 }, -1).day, '2026-09-25');
same('hour past midnight', M.shiftPlace({ level: 'hour', day: '2026-10-01', hour: 23 }, 1), { level: 'hour', day: '2026-10-02', hour: 0 });
same('hour back before midnight', M.shiftPlace({ level: 'hour', day: '2026-10-02', hour: 0 }, -1), { level: 'hour', day: '2026-10-01', hour: 23 });
ok('next month is future', M.isFuture({ level: 'month', day: '2026-11-01', hour: 8 }, '2026-10-02', 9));
ok('this month is not', !M.isFuture({ level: 'month', day: '2026-10-01', hour: 8 }, '2026-10-02', 9));
ok('later hour today is future', M.isFuture({ level: 'hour', day: '2026-10-02', hour: 10 }, '2026-10-02', 9));
ok('same week, same period', M.samePlace({ level: 'week', day: '2026-09-28', hour: 1 }, { level: 'week', day: '2026-10-03', hour: 5 }));

// --- levels -------------------------------------------------------------------------
same('in from this month lands on today', M.placeAtLevel({ level: 'month', day: '2026-10-01', hour: 8 }, 'week', '2026-10-02', 9).day, '2026-10-02');
same('in from a past month lands on its first', M.placeAtLevel({ level: 'month', day: '2026-06-17', hour: 8 }, 'day', '2026-10-02', 9).day, '2026-06-01');
same('out keeps the day', M.placeAtLevel({ level: 'day', day: '2026-06-17', hour: 8 }, 'year', '2026-10-02', 9).day, '2026-06-17');
same('hour in from today is now', M.placeAtLevel({ level: 'day', day: '2026-10-02', hour: 8 }, 'hour', '2026-10-02', 9).hour, 9);
same('crumbs for an hour', M.crumbsFor({ level: 'hour', day: '2026-10-02', hour: 14 }).map((c) => c.label), ['2026', 'October', 'Week of 27 Sep', 'Fri 2', '2pm']);
same('crumbs for a year', M.crumbsFor({ level: 'year', day: '2026-10-02', hour: 14 }).length, 1);
same('week heading', M.placeLabel({ level: 'week', day: '2026-10-02', hour: 8 }), '27 Sep to 3 Oct 2026');
same('hour heading', M.placeLabel({ level: 'hour', day: '2026-10-02', hour: 23 }), '11pm to 12am, Friday 2 October 2026');
same('minute label', [M.minuteLabel(0), M.minuteLabel(12 * 60 + 45), M.minuteLabel(9 * 60 + 5)], ['12am', '12:45pm', '9:05am']);

// --- builders ---------------------------------------------------------------------
const presence = new Map([
  ['2026-03', new Set(['meal', 'harvest', 'flare'])],
  ['2026-10-02', new Set(['dose', 'money'])],
]);
const year = M.buildYearPage(2026, presence, '2026-10-02');
same('twelve months', year.length, 12);
same('tabs in tab order, no counts', year[2].tabs, ['schedule', 'log', 'garden']);
ok('November is future', year[10].future && !year[9].future);
const month = M.buildMonthPage(2026, 10, presence, '2026-10-02');
ok('weeks of seven', month.every((w) => w.length === 7));
same('October 2026 starts on a Thursday', month[0].slice(0, 4), [null, null, null, null]);
const second = month[0][5];
same('the 2nd', [second.day, second.today, second.tabs], ['2026-10-02', true, ['schedule', 'life']]);
ok('the 3rd is future', month[0][6].future);
same('a month has every day once', month.flat().filter(Boolean).length, 31);

const records = [
  { id: 'meal:1', source: 'meal', title: 'Oats', day: '2026-09-30', minute: 8 * 60 + 10 },
  { id: 'dose:1', source: 'dose', title: 'Levothyroxine', day: '2026-09-30', minute: 6 * 60 },
  { id: 'drink:1', source: 'drink', title: 'Tea', day: '2026-09-30', minute: 8 * 60 + 40 },
  { id: 'money:1', source: 'money', title: 'Market', day: '2026-09-30', minute: null },
  { id: 'harvest:1', source: 'harvest', title: 'Kale', day: '2026-10-01', minute: 17 * 60 },
];
const week = M.buildWeekPage('2026-09-27', records, '2026-10-02');
same('seven columns', week.length, 7);
const wed = week[3];
same('Wednesday 8am has the meal first and one more', [wed.hours[8].first.id, wed.hours[8].more], ['meal:1', 1]);
same('Wednesday 6am is the dose', wed.hours[6].first.id, 'dose:1');
same('that day square holds the dated record', wed.thatDay.first.id, 'money:1');
ok('an empty hour is empty', wed.hours[3].first === null && wed.hours[3].more === 0);
ok('Saturday is future', week[6].future && !week[5].future);

const day = M.buildDayPage('2026-09-30', records);
same('ninety-six quarters', day.rows.reduce((n, r) => n + r.quarters.length, 0), 96);
same('8:10 is the first quarter of 8', day.rows[8].quarters[0].first.id, 'meal:1');
same('8:40 is the third quarter', day.rows[8].quarters[2].first.id, 'drink:1');
same('that day list', day.thatDay.map((r) => r.id), ['money:1']);
ok('another day is not drawn', day.rows[17].quarters.every((q) => q.first === null));

const hour = M.buildHourPage('2026-09-30', 8, records);
same('four quarters', hour.map((q) => q.label), ['8am', '8:15am', '8:30am', '8:45am']);
same('every record named, none behind a +N', hour.map((q) => q.records.map((r) => r.title)), [['Oats'], [], ['Tea'], []]);
same('caption names the place', M.recordCaption(records[0]), '8:10am · Schedules > Meals');
same('a dated record says so', M.recordCaption(records[3]), 'That day · Life > Finances');
same('describe for a screen reader', M.describeTabs(['food', 'garden']), 'recorded in Food, Garden');
same('describe nothing', M.describeTabs([]), 'nothing recorded');

// --- sources --------------------------------------------------------------------------
const keys = M.SQUARE_SOURCES.map((s) => s.key);
ok('source keys unique', new Set(keys).size === keys.length, keys);
const tabFiles = { food: 'food.tsx', schedule: 'schedule.tsx', log: 'log.tsx', insights: 'insights.tsx', life: 'life.tsx', garden: 'garden.tsx' };
const tabSource = {};
for (const source of M.SQUARE_SOURCES) {
  const file = tabFiles[source.tab];
  tabSource[file] = tabSource[file] || read(path.join('app', '(tabs)', file));
  ok(`${source.key}: ${file} has lens ${source.lens}`, tabSource[file].includes(`key: '${source.lens}'`));
  const labelled = new RegExp(`key: '${source.lens}',\\s*label: ['"]${source.lensLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  ok(`${source.key}: lens label ${source.lensLabel}`, labelled.test(tabSource[file]));
  ok(`${source.key}: an outline icon`, /-outline$/.test(source.icon));
  const route = M.squareRoute(source);
  ok(`${source.key}: route`, route.pathname === M.SQUARE_TAB_PATH[source.tab] && Object.values(route.params)[0] === source.lens);
}
ok('workout_sessions not read twice beside exercise_logs', !M.SQUARE_SOURCES.some((s) => s.table === 'workout_sessions'));
ok('todos not read beside todo_doings', !M.SQUARE_SOURCES.some((s) => s.table === 'todos'));

// --- wording ----------------------------------------------------------------------------
const words = [M.SQUARES_NOTE, ...M.SQUARE_SOURCES.map((s) => s.label)].join(' ');
for (const banned of ['streak', 'score', 'great', 'well done', 'keep it up', 'missed', 'behind', 'goal', 'percent', '%', '—', '–', ' real ', 'genuine']) {
  ok(`no "${banned}" in the wording`, !words.toLowerCase().includes(banned));
}

// --- wiring -------------------------------------------------------------------------------
const trends = read('app/(tabs)/trends.tsx');
ok('Trends has the squares lens', trends.includes("key: 'squares'") && trends.includes('<LifeInSquares'));
const home = read('app/(tabs)/index.tsx');
ok('Home renders it at today', home.includes('<LifeInSquares startAt="today"') && home.includes("case 'lifeSquares'"));
ok('Home section registered', read('lib/visualPreferences.ts').includes("'lifeSquares'") && read('lib/homeSections.ts').includes("lifeSquares: '/trends'"));
const component = read('components/LifeInSquares.tsx');
ok("pager is gesture-handler's ScrollView", component.includes("import { ScrollView } from 'react-native-gesture-handler'"));
ok('squares are at least SQUARE_MIN', M.SQUARE_MIN >= 44);
const dbFile = read('lib/lifeSquaresDb.ts');
ok('the reader never writes', !/runAsync|execAsync|INSERT|UPDATE|DELETE/.test(dbFile));

// --- the schema ----------------------------------------------------------------------------
const desktopDb = process.env.APPDATA ? [path.join(process.env.APPDATA, 'lifestead-desktop', 'SQLite', 'inside_story.db'), path.join(process.env.APPDATA, 'inside-story-desktop', 'SQLite', 'inside_story.db')].find((p) => fs.existsSync(p)) || null : null;
if (desktopDb && fs.existsSync(desktopDb)) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(desktopDb, { readOnly: true });
  for (const source of M.SQUARE_SOURCES) {
    const where = source.where ? ` AND (${source.where})` : '';
    try {
      db.prepare(`SELECT CAST(rowid AS TEXT) AS rid, ${source.title} AS title, ${source.column} AS stamp FROM ${source.table} WHERE ${source.column} >= ? AND ${source.column} < ?${where} LIMIT 1`).all('2000-01-01', '2100-01-01');
    } catch (error) {
      ok(`${source.key}: query runs`, false, error.message);
    }
  }
  db.close();
} else {
  console.log('(desktop database not found; schema check skipped)');
}

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log('All Life in Squares checks pass.');
