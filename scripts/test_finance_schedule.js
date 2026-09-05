// Runs lib/financeSchedule.ts against the cases that decide when a bill is
// said to be due.
//
// Built 2026-09-05, from a report that the shipped model could not express
// real bills: "Sometimes a bill could be due on a specific day of the
// month, or the first, second, third, or fourth specific day of the week,
// per week, per every 2 or 3 weeks per month."
//
// Date arithmetic is the highest-risk kind in this app, because every
// failure is a plausible-looking wrong DAY rather than a crash, and this
// particular wrong day is one someone misses a payment over. The cases
// below are weighted toward the four places it actually goes wrong:
//
//  1. Month length. The 31st has to land on the 30th in April and the 28th
//     in February, and the 29th in a leap February.
//  2. Nth weekday. Whether the 1st of the month falls before or after the
//     target weekday shifts every occurrence in that month by a week.
//  3. Phase. "Every 2 weeks" is meaningless without knowing which week,
//     and the answer must stay on the same weekday forever after.
//  4. Cycle anchoring. A quarterly or yearly bill has to know which months
//     are in its cycle. Getting this wrong is what made the shipped
//     version show a yearly bill as due every month.
//
// Run with: node scripts/test_finance_schedule.js
// Exits non-zero on any failure.

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
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

const S = load('lib/financeSchedule.ts');
const {
  nextOccurrence, nthWeekdayOfMonth, daysInMonth, weekdayOf, addDays, daysBetween,
  occurrencesPerYear, monthlyFactor, toMonthly, toAnnual,
  parseDueRule, serializeDueRule, describeDueRule, describeDueRuleShort, describeMissingPiece, isPlaceable,
} = S;

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function near(label, actual, expected, tol = 0.005) {
  checks += 1;
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ~${expected}\n      got       ${actual}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }

const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;

// Sanity on the fixtures themselves, so a wrong assumption about the
// calendar cannot quietly pass as a wrong assumption about the code.
check('2026-09-05 is a Saturday', weekdayOf('2026-09-05'), SAT);
check('2026-09-01 is a Tuesday', weekdayOf('2026-09-01'), TUE);
check('February 2026 has 28 days', daysInMonth(2026, 2), 28);
check('February 2028 has 29', daysInMonth(2028, 2), 29);
check('April has 30', daysInMonth(2026, 4), 30);

// --- 1. Day of the month, and the clamp ------------------------------------

const day15 = { kind: 'dayOfMonth', months: 1, day: 15 };
check('later this month', nextOccurrence(day15, '2026-09-05'), '2026-09-15');
check('the day itself counts as due', nextOccurrence(day15, '2026-09-15'), '2026-09-15');
check('already past rolls to next month', nextOccurrence(day15, '2026-09-16'), '2026-10-15');

const day31 = { kind: 'dayOfMonth', months: 1, day: 31 };
check('the 31st in a 31-day month', nextOccurrence(day31, '2026-01-05'), '2026-01-31');
check('the 31st clamps to the 30th in April', nextOccurrence(day31, '2026-04-05'), '2026-04-30');
check('the 31st clamps to the 28th in February', nextOccurrence(day31, '2026-02-05'), '2026-02-28');
check('and the 29th in a leap February', nextOccurrence(day31, '2028-02-05'), '2028-02-29');
check('the 31st rolls from February into March', nextOccurrence(day31, '2026-03-01'), '2026-03-31');
check('December rolls into the next year', nextOccurrence({ kind: 'dayOfMonth', months: 1, day: 3 }, '2026-12-10'), '2027-01-03');

// --- 2. Nth weekday of the month -------------------------------------------
// September 2026 starts on a Tuesday, so Tuesdays are 1, 8, 15, 22, 29 and
// Mondays are 7, 14, 21, 28. That asymmetry is the whole point.

check('1st Tuesday of Sep 2026', nthWeekdayOfMonth(2026, 9, TUE, 1), 1);
check('2nd Tuesday', nthWeekdayOfMonth(2026, 9, TUE, 2), 8);
check('4th Tuesday', nthWeekdayOfMonth(2026, 9, TUE, 4), 22);
check('last Tuesday is the 5th one here', nthWeekdayOfMonth(2026, 9, TUE, 'last'), 29);
check('1st Monday is the 7th, not the 1st', nthWeekdayOfMonth(2026, 9, MON, 1), 7);
check('last Monday', nthWeekdayOfMonth(2026, 9, MON, 'last'), 28);
check('a month with only four of a weekday has last = 4th', nthWeekdayOfMonth(2026, 2, SUN, 'last'), 22);
check('a 5th of a weekday that does not exist is null, not a rollover', nthWeekdayOfMonth(2026, 2, SUN, 5), null);

const secondTue = { kind: 'nthWeekday', months: 1, week: 2, weekday: TUE };
check('2nd Tuesday, before it', nextOccurrence(secondTue, '2026-09-05'), '2026-09-08');
check('2nd Tuesday, on it', nextOccurrence(secondTue, '2026-09-08'), '2026-09-08');
check('2nd Tuesday, after it rolls a month', nextOccurrence(secondTue, '2026-09-09'), '2026-10-13');
check('last Friday of the month', nextOccurrence({ kind: 'nthWeekday', months: 1, week: 'last', weekday: FRI }, '2026-09-05'), '2026-09-25');
checkTrue('every landing really is the named weekday',
  ['2026-09-08', '2026-10-13'].every((d) => weekdayOf(d) === TUE));

// --- 3. Every N weeks, and phase --------------------------------------------

const everyFri = { kind: 'everyNWeeks', weeks: 1, weekday: FRI, anchor: '2026-09-04' };
check('weekly lands on the next Friday', nextOccurrence(everyFri, '2026-09-05'), '2026-09-11');
check('and on the day itself', nextOccurrence(everyFri, '2026-09-11'), '2026-09-11');

const every2 = { kind: 'everyNWeeks', weeks: 2, weekday: FRI, anchor: '2026-09-04' };
check('every 2 weeks keeps its phase', nextOccurrence(every2, '2026-09-05'), '2026-09-18');
check('the anchor day itself is an occurrence', nextOccurrence(every2, '2026-09-04'), '2026-09-04');
check('mid-cycle skips to the right Friday', nextOccurrence(every2, '2026-09-12'), '2026-09-18');
check('and keeps stepping by 14', nextOccurrence(every2, '2026-09-19'), '2026-10-02');
check('far in the future still lands on a Friday in phase', nextOccurrence(every2, '2027-01-01'), '2027-01-08');

const every3 = { kind: 'everyNWeeks', weeks: 3, weekday: FRI, anchor: '2026-09-04' };
check('every 3 weeks', nextOccurrence(every3, '2026-09-05'), '2026-09-25');
check('every 3 weeks, next one', nextOccurrence(every3, '2026-09-26'), '2026-10-16');

// The anchor is snapped forward onto the chosen weekday, so a start date
// typed as "some day that week" still produces the right series.
const snapped = { kind: 'everyNWeeks', weeks: 2, weekday: FRI, anchor: '2026-09-02' };
check('an anchor on a Wednesday snaps to that Friday', nextOccurrence(snapped, '2026-09-01'), '2026-09-04');
checkTrue('and every later occurrence is still a Friday', weekdayOf(nextOccurrence(snapped, '2026-11-01')) === FRI);

check('no anchor cannot be placed, rather than guessed', nextOccurrence({ kind: 'everyNWeeks', weeks: 2, weekday: FRI, anchor: '' }, '2026-09-05'), null);

// Every 4 weeks is 13 payments a year, not 12. A bill someone thinks of as
// monthly but actually pays every four weeks costs an extra payment a year.
const every4 = { kind: 'everyNWeeks', weeks: 4, weekday: FRI, anchor: '2026-09-04' };
check('every 4 weeks is 13 a year, not 12', occurrencesPerYear(every4), 13);
check('monthly is 12', occurrencesPerYear({ kind: 'dayOfMonth', months: 1, day: 1 }), 12);
checkTrue('so they are genuinely different', occurrencesPerYear(every4) !== occurrencesPerYear({ kind: 'dayOfMonth', months: 1, day: 1 }));

// --- 4. Twice a month -------------------------------------------------------

const firstAnd15th = { kind: 'twiceMonthly', day1: 1, day2: 15 };
check('before both', nextOccurrence(firstAnd15th, '2026-09-01'), '2026-09-01');
check('between them', nextOccurrence(firstAnd15th, '2026-09-02'), '2026-09-15');
check('after both rolls to the 1st', nextOccurrence(firstAnd15th, '2026-09-16'), '2026-10-01');
check('order of the two days does not matter', nextOccurrence({ kind: 'twiceMonthly', day1: 15, day2: 1 }, '2026-09-02'), '2026-09-15');
check('the 31st half clamps too', nextOccurrence({ kind: 'twiceMonthly', day1: 15, day2: 31 }, '2026-04-16'), '2026-04-30');
check('twice a month is 24 a year', occurrencesPerYear(firstAnd15th), 24);

// --- 5. Cycles longer than a month, and the bug that prompted this ----------
// The shipped version had no anchor month, so a yearly bill due on the 15th
// appeared every single month. These are the cases that catch that.

const yearlyMar15 = { kind: 'dayOfMonth', months: 12, day: 15, anchorMonth: '2026-03' };
check('a yearly bill in its own month', nextOccurrence(yearlyMar15, '2026-03-01'), '2026-03-15');
check('a yearly bill does NOT appear the next month', nextOccurrence(yearlyMar15, '2026-04-01'), '2027-03-15');
check('nor in September', nextOccurrence(yearlyMar15, '2026-09-05'), '2027-03-15');
check('and it repeats a year later', nextOccurrence(yearlyMar15, '2027-03-16'), '2028-03-15');

const quarterly = { kind: 'dayOfMonth', months: 3, day: 1, anchorMonth: '2026-01' };
check('quarterly from January hits April', nextOccurrence(quarterly, '2026-02-01'), '2026-04-01');
check('quarterly hits July next', nextOccurrence(quarterly, '2026-05-01'), '2026-07-01');
check('quarterly skips the months between', nextOccurrence(quarterly, '2026-08-15'), '2026-10-01');
check('quarterly rolls across the year', nextOccurrence(quarterly, '2026-11-01'), '2027-01-01');

const semiannual = { kind: 'dayOfMonth', months: 6, day: 20, anchorMonth: '2026-02' };
check('every 6 months from February hits August', nextOccurrence(semiannual, '2026-03-01'), '2026-08-20');
check('and February again', nextOccurrence(semiannual, '2026-09-01'), '2027-02-20');

check('a cycle longer than a month with no anchor cannot be placed',
  nextOccurrence({ kind: 'dayOfMonth', months: 12, day: 15, anchorMonth: null }, '2026-09-05'), null);
check('monthly needs no anchor', nextOccurrence({ kind: 'dayOfMonth', months: 1, day: 15, anchorMonth: null }, '2026-09-05'), '2026-09-15');

check('an nth-weekday quarterly respects its cycle',
  nextOccurrence({ kind: 'nthWeekday', months: 3, week: 2, weekday: TUE, anchorMonth: '2026-09' }, '2026-10-01'), '2026-12-08');

// --- 6. How often it works out to -------------------------------------------

near('weekly is 4.333 a month', monthlyFactor({ kind: 'everyNWeeks', weeks: 1, weekday: FRI, anchor: '2026-09-04' }), 4.33333);
near('every 2 weeks is 2.167', monthlyFactor(every2), 2.16667);
near('every 3 weeks is 1.444', monthlyFactor(every3), 1.44444);
check('monthly is 1', monthlyFactor({ kind: 'dayOfMonth', months: 1, day: 1 }), 1);
near('quarterly is a third', monthlyFactor({ kind: 'dayOfMonth', months: 3, day: 1, anchorMonth: '2026-01' }), 0.33333);
near('yearly is a twelfth', monthlyFactor(yearlyMar15), 0.08333);
near('$100 a week is $433.33 a month, not $400', toMonthly(100, everyFri), 433.33);
check('$100 a week is $5,200 a year', toAnnual(100, everyFri), 5200);
check('$100 every 4 weeks is $1,300 a year', toAnnual(100, every4), 1300);

// --- 7. Reading a rule back out of a text column ----------------------------

checkTrue('a rule survives a round trip', JSON.stringify(parseDueRule(serializeDueRule(every2))) === JSON.stringify(every2));
check('null in, null out', parseDueRule(null), null);
check('empty string', parseDueRule(''), null);
check('not json at all', parseDueRule('{{{'), null);
check('json that is not a rule', parseDueRule('{"kind":"nonsense"}'), null);
check('a weekday out of range is refused', parseDueRule('{"kind":"everyNWeeks","weeks":2,"weekday":9,"anchor":"2026-09-04"}'), null);
check('an impossible interval is refused', parseDueRule('{"kind":"everyNWeeks","weeks":7,"weekday":5,"anchor":"2026-09-04"}'), null);
check('a day of 0 is refused', parseDueRule('{"kind":"dayOfMonth","months":1,"day":0}'), null);
check('a day of 32 is refused', parseDueRule('{"kind":"dayOfMonth","months":1,"day":32}'), null);
check('a bad anchor date is refused', parseDueRule('{"kind":"everyNWeeks","weeks":2,"weekday":5,"anchor":"2026-02-30"}'), null);
checkTrue('a valid last-weekday rule parses', parseDueRule('{"kind":"nthWeekday","months":1,"week":"last","weekday":5}') !== null);
check('an out-of-range week is refused', parseDueRule('{"kind":"nthWeekday","months":1,"week":9,"weekday":5}'), null);

// --- 8. Wording -------------------------------------------------------------

check('weekly reads plainly', describeDueRule(everyFri), 'Every Friday');
check('every 2 weeks names the day', describeDueRule(every2), 'Every 2 weeks on Friday');
check('every 3 weeks', describeDueRule(every3), 'Every 3 weeks on Friday');
check('twice monthly', describeDueRule(firstAnd15th), 'The 1st and 15th of each month');
check('day of month', describeDueRule(day15), 'The 15th of each month');
check('the 3rd gets the right ordinal', describeDueRule({ kind: 'dayOfMonth', months: 1, day: 3 }), 'The 3rd of each month');
check('so does the 22nd', describeDueRule({ kind: 'dayOfMonth', months: 1, day: 22 }), 'The 22nd of each month');
check('and the 11th, 12th, 13th are all th', describeDueRule({ kind: 'dayOfMonth', months: 1, day: 11 }), 'The 11th of each month');
check('yearly', describeDueRule(yearlyMar15), 'The 15th, every year');
check('quarterly', describeDueRule(quarterly), 'The 1st, every 3 months');
check('nth weekday', describeDueRule(secondTue), 'Second Tuesday of each month');
check('last weekday', describeDueRule({ kind: 'nthWeekday', months: 1, week: 'last', weekday: FRI }), 'Last Friday of each month');
check('short form for a list row', describeDueRuleShort(every2), 'every 2wk, Fri');
check('short weekly', describeDueRuleShort(everyFri), 'weekly, Fri');

check('a complete rule is missing nothing', describeMissingPiece(every2), null);
checkTrue('a missing anchor is named', (describeMissingPiece({ kind: 'everyNWeeks', weeks: 2, weekday: FRI, anchor: '' }) || '').includes('which week'));
checkTrue('a missing cycle month is named', (describeMissingPiece({ kind: 'dayOfMonth', months: 12, day: 15, anchorMonth: null }) || '').includes('month to count from'));
check('monthly never needs a cycle month', describeMissingPiece({ kind: 'dayOfMonth', months: 1, day: 15 }), null);

check('placeable', isPlaceable(every2, '2026-09-05'), true);
check('not placeable', isPlaceable({ kind: 'everyNWeeks', weeks: 2, weekday: FRI, anchor: '' }, '2026-09-05'), false);

// --- 9. Date helpers --------------------------------------------------------

check('adding days crosses a month', addDays('2026-09-28', 5), '2026-10-03');
check('adding days crosses a year', addDays('2026-12-30', 3), '2027-01-02');
check('subtracting days', addDays('2026-03-01', -1), '2026-02-28');
check('days between', daysBetween('2026-09-05', '2026-09-15'), 10);
check('days between, backwards', daysBetween('2026-09-15', '2026-09-05'), -10);
check('a bad date is refused rather than assumed', addDays('nope', 1), null);

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
