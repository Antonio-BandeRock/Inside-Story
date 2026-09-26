// Checks the repeat patterns in lib/repeatRule.ts: every day, every few
// days, chosen weekdays every N weeks, and monthly with short months, each
// with its three ways to stop, plus the top-up that continues a series
// without repeating a date or losing a fortnight's parity.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('lib/repeatRule.ts must stay free of runtime imports');
  });
  return module.exports;
}

const {
  occurrencesOf,
  validateRepeatRule,
  describeRepeat,
  describeRepeatPattern,
  weekdaysToColumn,
  weekdaysFromColumn,
  weekdayOf,
} = load('lib/repeatRule.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  actual   ${a}`);
  } else {
    console.log(`ok   ${label}`);
  }
}
const dates = (list) => list.map((o) => o.date);

// 2026-09-28 is a Monday.
check('2026-09-28 is a Monday', weekdayOf('2026-09-28'), 1);

check('once is one date', dates(occurrencesOf('2026-09-28', { type: 'none' }, { through: '2026-12-31' })), ['2026-09-28']);

check(
  'daily, 3 times',
  dates(occurrencesOf('2026-09-28', { type: 'daily', endType: 'count', count: 3 }, { through: '2026-12-31' })),
  ['2026-09-28', '2026-09-29', '2026-09-30'],
);
check(
  'daily until a date, inclusive',
  dates(occurrencesOf('2026-09-28', { type: 'daily', endType: 'until_date', until: '2026-10-01' }, { through: '2026-12-31' })),
  ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01'],
);
check(
  'daily indefinite stops at the window',
  occurrencesOf('2026-09-28', { type: 'daily', endType: 'indefinite' }, { through: '2026-10-07' }).length,
  10,
);
check(
  'daily across a DST change keeps every day',
  dates(occurrencesOf('2026-10-31', { type: 'daily', endType: 'count', count: 3 }, { through: '2026-12-31' })),
  ['2026-10-31', '2026-11-01', '2026-11-02'],
);

check(
  'every 3 days',
  dates(occurrencesOf('2026-09-28', { type: 'every_n_days', interval: 3, endType: 'count', count: 4 }, { through: '2026-12-31' })),
  ['2026-09-28', '2026-10-01', '2026-10-04', '2026-10-07'],
);

check(
  'weekly Monday and Thursday',
  dates(occurrencesOf('2026-09-28', { type: 'weekly', weekdays: [4, 1], endType: 'count', count: 4 }, { through: '2026-12-31' })),
  ['2026-09-28', '2026-10-01', '2026-10-05', '2026-10-08'],
);
check(
  'weekly set up on a Wednesday starts on the next chosen day',
  dates(occurrencesOf('2026-09-30', { type: 'weekly', weekdays: [1, 5], endType: 'count', count: 3 }, { through: '2026-12-31' })),
  ['2026-10-02', '2026-10-05', '2026-10-09'],
);
check(
  'every 2 weeks on Monday',
  dates(occurrencesOf('2026-09-28', { type: 'weekly', weekdays: [1], interval: 2, endType: 'count', count: 3 }, { through: '2026-12-31' })),
  ['2026-09-28', '2026-10-12', '2026-10-26'],
);
check(
  'every 2 weeks, top-up keeps the fortnight',
  occurrencesOf('2026-09-28', { type: 'weekly', weekdays: [1], interval: 2, endType: 'indefinite' }, { after: '2026-10-12', through: '2026-11-10' }),
  [{ date: '2026-10-26', index: 3 }, { date: '2026-11-09', index: 4 }],
);
check(
  'weekly with no days gives nothing and does not loop',
  occurrencesOf('2026-09-28', { type: 'weekly', weekdays: [], endType: 'indefinite' }, { through: '2026-12-31' }),
  [],
);

check(
  'monthly from the 31st lands on each month end',
  dates(occurrencesOf('2026-01-31', { type: 'monthly', endType: 'count', count: 4 }, { through: '2027-12-31' })),
  ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'],
);
check(
  'monthly keeps the 31st after a short month',
  dates(occurrencesOf('2027-12-31', { type: 'monthly', endType: 'count', count: 3 }, { through: '2028-12-31' })),
  ['2027-12-31', '2028-01-31', '2028-02-29'],
);
check(
  'every 3 months crosses the year',
  dates(occurrencesOf('2026-11-15', { type: 'monthly', interval: 3, endType: 'count', count: 3 }, { through: '2027-12-31' })),
  ['2026-11-15', '2027-02-15', '2027-05-15'],
);
check(
  'a first occurrence past the window is still kept',
  dates(occurrencesOf('2027-06-01', { type: 'monthly', endType: 'indefinite' }, { through: '2026-11-25' })),
  ['2027-06-01'],
);

check(
  'daily top-up by count continues the index',
  occurrencesOf('2026-09-28', { type: 'daily', endType: 'count', count: 5 }, { after: '2026-09-30', through: '2026-12-31' }),
  [{ date: '2026-10-01', index: 4 }, { date: '2026-10-02', index: 5 }],
);
check(
  'top-up past the end gives nothing',
  occurrencesOf('2026-09-28', { type: 'daily', endType: 'until_date', until: '2026-09-30' }, { after: '2026-09-30', through: '2026-12-31' }),
  [],
);

check('valid daily', validateRepeatRule({ type: 'daily', endType: 'indefinite' }), null);
check('weekly needs a day', validateRepeatRule({ type: 'weekly', weekdays: [], endType: 'indefinite' }), 'Choose at least one day of the week.');
check(
  'every few days needs 2 or more',
  validateRepeatRule({ type: 'every_n_days', interval: 1, endType: 'indefinite' }),
  'Enter how many days apart, 2 or more. For every day, choose Every day.',
);
check('count needs a number', validateRepeatRule({ type: 'monthly', endType: 'count' }), 'Enter how many times this should repeat.');
check('until needs a date', validateRepeatRule({ type: 'daily', endType: 'until_date', until: 'soon' }), 'Enter a valid end date (YYYY-MM-DD).');

check('describe daily', describeRepeatPattern({ type: 'daily' }), 'Every day');
check('describe every 3 days', describeRepeatPattern({ type: 'every_n_days', interval: 3 }), 'Every 3 days');
check('describe weekdays', describeRepeatPattern({ type: 'weekly', weekdays: [4, 1] }), 'Every Monday and Thursday');
check('describe three weekdays', describeRepeatPattern({ type: 'weekly', weekdays: [1, 3, 5] }), 'Every Monday, Wednesday and Friday');
check('describe fortnightly', describeRepeatPattern({ type: 'weekly', weekdays: [1], interval: 2 }), 'Every 2 weeks on Monday');
check('describe monthly', describeRepeatPattern({ type: 'monthly' }, '2026-09-15'), 'Every month on the 15th');
check('describe quarterly', describeRepeatPattern({ type: 'monthly', interval: 3 }, '2026-09-22'), 'Every 3 months on the 22nd');
check('describe 11th', describeRepeatPattern({ type: 'monthly' }, '2026-09-11'), 'Every month on the 11th');
check('describe with count', describeRepeat({ type: 'weekly', weekdays: [1], endType: 'count', count: 10 }), 'Every Monday, 10 times');
check(
  'describe with until',
  describeRepeat({ type: 'every_n_days', interval: 3, endType: 'until_date', until: '2026-10-12' }),
  'Every 3 days until 12 Oct 2026',
);

check('weekdays to column', weekdaysToColumn([4, 1, 4]), '1,4');
check('weekdays from column', weekdaysFromColumn('1,4'), [1, 4]);
check('empty weekdays column', weekdaysFromColumn(null), undefined);

// No sentence this module writes may use a dash in place of punctuation.
const source = fs.readFileSync(path.join(__dirname, '..', 'lib/repeatRule.ts'), 'utf8');
check('no em or en dashes in lib/repeatRule.ts', /[–—]/.test(source), false);

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log('\nAll repeat rule checks passed.');
