// Checks F13 of the competitive build plan (Phase 2, 2026-09-26): Your
// week, the seven days ending yesterday beside the seven before. A blank
// week says not logged rather than zero, a line for a reading shows only
// when either week has one, and no sentence carries a verdict. Exits
// non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const loaded = {};
function load(file, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  loaded[file] = mod.exports;
  return mod.exports;
}

const morning = load('lib/morningCheckin.ts', { './yourUsual': load('lib/yourUsual.ts') });
const W = load('lib/weeklySummary.ts', { './morningCheckin': morning });

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

// Ranges: today 2026-09-26, so this week is 19 to 25 and last week 12 to 18.
const ranges = W.weekRanges('2026-09-26');
check('this week ends yesterday', ranges.thisWeek, { start: '2026-09-19', end: '2026-09-25' });
check('last week is the seven before', ranges.lastWeek, { start: '2026-09-12', end: '2026-09-18' });
check('across a month end', W.weekRanges('2026-10-02').thisWeek, { start: '2026-09-25', end: '2026-10-01' });

const base = {
  today: '2026-09-26',
  mealDays: ['2026-09-19', '2026-09-19', '2026-09-20', '2026-09-22', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-13', '2026-09-14'],
  flareDays: ['2026-09-20', '2026-09-20', '2026-09-23', '2026-09-15', '2026-09-26'],
  sleep: [
    { date: '2026-09-20', value: 7 },
    { date: '2026-09-21', value: 6 },
    { date: '2026-09-14', value: 8 },
  ],
  steps: [],
  scales: [
    { date: '2026-09-20', mood: 3, energy: null, stress: 2 },
    { date: '2026-09-20', mood: 5, energy: null, stress: null },
    { date: '2026-09-22', mood: 2, energy: 4, stress: null },
  ],
};
const week = W.buildYourWeek(base);
const line = (key) => (week.lines.find((l) => l.key === key) || {}).sentence;
check('heading', week.heading, 'Sep 19 to Sep 25, beside the 7 days before');
check('meals count distinct days, today left out', line('meals'), 'Meals logged on 5 of 7 days (the week before, 2).');
check('flares with days', line('flares'), '3 flares or reactions recorded on 2 days (the week before, 1 on 1 day).');
check('sleep average', line('sleep'), 'Sleep averaged 6 h 30 min across 2 nights (the week before, 8 h).');
check('no steps either week, no line', line('steps'), undefined);
check('mood averaged per day first', line('mood'), 'Mood averaged 3.0 out of 5 across 2 rated days (the week before, not rated).');
check('energy', line('energy'), 'Energy averaged 4.0 out of 5 across 1 rated day (the week before, not rated).');
check('stress', line('stress'), 'Stress averaged 2.0 out of 5 across 1 rated day (the week before, not rated).');
check('something logged', week.nothingLogged, false);

// A blank week is said to be blank.
const blank = W.buildYourWeek({ ...base, mealDays: ['2026-09-13'], flareDays: [], sleep: [{ date: '2026-09-14', value: 7.5 }], scales: [] });
check('nothing logged', blank.nothingLogged, true);
check('nothing logged sentence', W.nothingLoggedSentence(blank).startsWith('Nothing was logged from Sep 19 to Sep 25.'), true);
check('meals blank this week', blank.lines.find((l) => l.key === 'meals').sentence, 'Meals: not logged this week (the week before, on 1 day).');
check('sleep blank this week', blank.lines.find((l) => l.key === 'sleep').sentence, 'Sleep: not recorded this week (the week before, 7 h 30 min).');
check('no flares either week', blank.lines.find((l) => l.key === 'flares').sentence, 'No flares or reactions recorded (the week before, none recorded).');
const empty = W.buildYourWeek({ today: '2026-09-26', mealDays: [], flareDays: [], sleep: [], steps: [], scales: [] });
check('meals blank both weeks', empty.lines.find((l) => l.key === 'meals').sentence, 'Meals: not logged this week (nor the week before).');
check('only meals and flares when nothing else exists', empty.lines.map((l) => l.key), ['meals', 'flares']);
const stepsOnly = W.buildYourWeek({ ...base, steps: [{ date: '2026-09-25', value: 6400 }, { date: '2026-09-24', value: 5600 }] });
check('steps', stepsOnly.lines.find((l) => l.key === 'steps').sentence, `Steps averaged ${(6000).toLocaleString()} steps across 2 days (the week before, not recorded).`);
check('shiftDay', W.shiftDay('2026-03-01', -1), '2026-02-28');

// The notification says nothing about what was logged.
check('notification carries no numbers', /\d/.test(W.YOUR_WEEK_NOTIFICATION_BODY.replace('seven', '')), false);

// No verdicts, anywhere the person reads.
const FORBIDDEN =
  /\b(better|worse|improv\w*|declin\w*|up|down|great|well done|cause[sd]?|trigger\w*|should|must|healthy|unhealthy|ideal|optimal|bad|good|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
const written = [
  ...week.lines.map((l) => l.sentence),
  ...blank.lines.map((l) => l.sentence),
  ...stepsOnly.lines.map((l) => l.sentence),
  W.nothingLoggedSentence(blank),
  W.YOUR_WEEK_CAPTION,
  W.YOUR_WEEK_NOTIFICATION_TITLE,
  W.YOUR_WEEK_NOTIFICATION_BODY,
  week.heading,
];
for (const sentence of written) check(`no verdict words: ${sentence.slice(0, 60)}`, FORBIDDEN.test(sentence), false);

console.log(`${total - failures} of ${total} checks passed`);
if (failures > 0) process.exit(1);
