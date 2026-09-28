// Runs lib/successionSowing.ts: the dates and names behind Sow again later
// on a new planting (I6, 1.0.55.22).
//
// The rules checked:
//
//  1. The later sowings fall every N days after the first, K of them, on
//     plain calendar days, across a month end, a year end and a leap day.
//  2. A typed figure is a whole number inside its range or nothing.
//  3. A counter is numbered among all the sowings, the first included.
//  4. A planned sowing marked sown moves its expected harvest by the same
//     number of days it went in early or late.
//  5. No sentence here tells anybody when a crop must go in.
//
// Run with: node scripts/test_succession_sowing.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const S = loadModule('lib/successionSowing.ts');
let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. Dates.
check('every 14 days, 3 more', same(S.successionDates('2026-09-28', 14, 3), ['2026-10-12', '2026-10-26', '2026-11-09']));
check('across a year end', same(S.successionDates('2026-12-20', 10, 2), ['2026-12-30', '2027-01-09']));
check('onto a leap day', same(S.successionDates('2028-02-15', 14, 1), ['2028-02-29']));
check('one more time gives one date', S.successionDates('2026-09-28', 7, 1).length === 1);
check('days between', S.daysBetween('2026-09-28', '2026-11-09') === 42 && S.daysBetween('2026-10-12', '2026-10-09') === -3);
check('across the autumn clock change', S.addDays('2026-10-24', 7) === '2026-10-31' && S.addDays('2026-03-07', 2) === '2026-03-09');

// 2. Typed figures.
check('a blank is nothing', S.parseWhole('', 1, 120) === null);
check('a whole number reads', S.parseWhole(' 14 ', 1, 120) === 14);
check('a decimal is refused', S.parseWhole('7.5', 1, 120) === null);
check('zero is refused', S.parseWhole('0', S.SUCCESSION_EVERY_MIN, S.SUCCESSION_EVERY_MAX) === null);
check('over the range is refused', S.parseWhole('21', S.SUCCESSION_TIMES_MIN, S.SUCCESSION_TIMES_MAX) === null);
check('the defaults are inside their ranges',
  S.SUCCESSION_EVERY_DEFAULT >= S.SUCCESSION_EVERY_MIN && S.SUCCESSION_EVERY_DEFAULT <= S.SUCCESSION_EVERY_MAX
  && S.SUCCESSION_TIMES_DEFAULT >= S.SUCCESSION_TIMES_MIN && S.SUCCESSION_TIMES_DEFAULT <= S.SUCCESSION_TIMES_MAX);

// 3. Counter names.
check('numbered among all sowings', S.successionCounterName('Lettuce', 2, 4) === 'Sow lettuce again (2 of 4)');

// 4. Shifting an expected harvest.
check('sown three days late moves the harvest three days', S.shiftDate('2026-12-01', 3) === '2026-12-04');
check('sown early moves it back', S.shiftDate('2026-12-01', -2) === '2026-11-29');
check('no expected date stays none', S.shiftDate(null, 5) === null);

// 5. Words.
check('two dates join with and', S.joinDates(['Oct 12', 'Oct 26']) === 'Oct 12 and Oct 26');
check('three dates join with commas and and', S.joinDates(['Oct 12', 'Oct 26', 'Nov 9']) === 'Oct 12, Oct 26 and Nov 9');
check('one date stands alone', S.joinDates(['Oct 12']) === 'Oct 12');
const source = fs.readFileSync(path.join(__dirname, '..', 'lib/successionSowing.ts'), 'utf8');
const strings = source.match(/`[^`]*`|'[^'\n]*'/g) || [];
for (const text of strings) {
  check(`no verdict words: ${text}`, !/\b(must|should|ideal|optimal|best day|too late|too early)\b/i.test(text));
  check(`no dashes: ${text}`, !/[–—]| -- /.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
