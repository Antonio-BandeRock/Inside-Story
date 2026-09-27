// Checks F21 of the competitive build plan (Phase 2, 2026-09-26): a
// different nutrient target on chosen weekdays. A weekday row replaces the
// every-day row for that nutrient on that weekday only, one side at a time;
// planned dates are counted in local days; and the notes a planned day
// carries say which figure was used and nothing more. Exits non-zero on any
// failure.

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

const W = load('lib/weekdayTargets.ts');

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

// 2026-09-26 is a Saturday.
check('weekdayOf Saturday', W.weekdayOf('2026-09-26'), 6);
check('weekdayOf Sunday', W.weekdayOf('2026-09-27'), 0);
check('weekdayOf takes a timestamp', W.weekdayOf('2026-09-28T23:30:00'), 1);
check('addDays across a month', W.addDays('2026-09-29', 3), '2026-10-02');
check('addDays across a year', W.addDays('2026-12-31', 1), '2027-01-01');
check('addDays across a clock change', W.addDays('2026-03-07', 2), '2026-03-09');
check('addDays zero', W.addDays('2026-09-26', 0), '2026-09-26');
check('isPlainDate good', W.isPlainDate('2026-02-28'), true);
check('isPlainDate impossible day', W.isPlainDate('2026-02-30'), false);
check('isPlainDate wrong shape', W.isPlainDate('26-9-2026'), false);
check('isPlainDate empty', W.isPlainDate(''), false);
check('sameWeekday a week apart', W.sameWeekday('2026-09-26', '2026-10-03'), true);
check('sameWeekday a day apart', W.sameWeekday('2026-09-26', '2026-09-27'), false);
check('weekday order starts Monday', W.WEEKDAY_ORDER.map((d) => W.WEEKDAY_NAMES[d])[0], 'Monday');
check('weekday order ends Sunday', W.WEEKDAY_ORDER.map((d) => W.WEEKDAY_NAMES[d])[6], 'Sunday');
check('weekday order covers the week', [...W.WEEKDAY_ORDER].sort(), [0, 1, 2, 3, 4, 5, 6]);
check('three fields', W.NUTRIENT_TARGET_FIELDS.map((f) => f.nutrientCode), ['protein', 'fiber_total', 'sodium']);

const everyDay = [
  { nutrientCode: 'protein', targetAmount: 90, limitAmount: null },
  { nutrientCode: 'sodium', targetAmount: null, limitAmount: 1800 },
];
const weekdays = [
  { nutrientCode: 'protein', weekday: 6, targetAmount: 120, limitAmount: null },
  { nutrientCode: 'sodium', weekday: 6, targetAmount: null, limitAmount: 2200 },
  { nutrientCode: 'fiber_total', weekday: 1, targetAmount: 40, limitAmount: null },
  { nutrientCode: 'protein', weekday: 3, targetAmount: null, limitAmount: 200 },
];
const byCode = (rows) => Object.fromEntries(rows.map((r) => [r.nutrientCode, [r.targetAmount, r.limitAmount]]));

check('Saturday takes the Saturday figures', byCode(W.overridesForDate(everyDay, weekdays, '2026-09-26')), {
  protein: [120, null],
  sodium: [null, 2200],
});
check('Sunday keeps the every-day figures', byCode(W.overridesForDate(everyDay, weekdays, '2026-09-27')), {
  protein: [90, null],
  sodium: [null, 1800],
});
check('Monday adds fiber with no every-day row', byCode(W.overridesForDate(everyDay, weekdays, '2026-09-28')), {
  protein: [90, null],
  sodium: [null, 1800],
  fiber_total: [40, null],
});
check('Wednesday: a ceiling-only weekday row keeps the every-day floor', byCode(W.overridesForDate(everyDay, weekdays, '2026-09-30')), {
  protein: [90, 200],
  sodium: [null, 1800],
});
check('no weekday rows changes nothing', byCode(W.overridesForDate(everyDay, [], '2026-09-26')), byCode(everyDay));
check('input rows are not changed', everyDay[0].targetAmount, 90);

check('weekdayValuesFor protein floor', W.weekdayValuesFor(weekdays, 'protein', false), [{ weekday: 6, name: 'Saturday', value: 120 }]);
check('weekdayValuesFor sodium ceiling', W.weekdayValuesFor(weekdays, 'sodium', true), [{ weekday: 6, name: 'Saturday', value: 2200 }]);
check('weekdayValuesFor ignores the other side', W.weekdayValuesFor(weekdays, 'protein', true), [{ weekday: 3, name: 'Wednesday', value: 200 }]);
check(
  'weekdayValuesFor lists Monday before Sunday',
  W.weekdayValuesFor(
    [
      { nutrientCode: 'protein', weekday: 0, targetAmount: 70, limitAmount: null },
      { nutrientCode: 'protein', weekday: 1, targetAmount: 100, limitAmount: null },
    ],
    'protein',
    false,
  ).map((v) => v.name),
  ['Monday', 'Sunday'],
);

const saturdayNotes = W.weekdayTargetNotes(weekdays, '2026-09-26');
check('Saturday notes', saturdayNotes, ["Saturday's protein target used: 120 g.", "Saturday's sodium ceiling used: 2200 mg."]);
check('Sunday has no notes', W.weekdayTargetNotes(weekdays, '2026-09-27'), []);
check('Monday fiber note', W.weekdayTargetNotes(weekdays, '2026-09-28'), ["Monday's fiber target used: 40 g."]);
check('Wednesday: a floor field ignores a ceiling-only row', W.weekdayTargetNotes(weekdays, '2026-09-30'), []);

// No verdict words in anything a planned day says.
const FORBIDDEN = /\b(great|good|bad|well done|ideal|optimal|should|must|too (?:low|high)|healthy|unhealthy|real|genuine|genuinely|own)\b|[–—]| -- /i;
const allNotes = ['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].flatMap((d) =>
  W.weekdayTargetNotes(weekdays, d),
);
for (const note of allNotes) check(`no verdict words: ${note}`, FORBIDDEN.test(note), false);

console.log(`${total - failures}/${total} checks passed`);
if (failures > 0) process.exit(1);
