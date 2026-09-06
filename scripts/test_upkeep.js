// Runs lib/upkeep.ts: things that need doing again, and things that run out.
//
// Built 2026-09-05. The risks, in order:
//
//  1. A service is LAST-DONE-anchored, not calendar-anchored. A boiler
//     serviced in March is next due the following March. Getting this from a
//     calendar rule instead would have told someone it was due in January
//     regardless of the service three months earlier, which is exactly why
//     this file does not reuse the bill machinery.
//  2. Month arithmetic. 31 August plus six months is 28 February, not a date
//     that does not exist.
//  3. Every missing piece refuses with a reason rather than producing a date
//     from nothing: never done, no interval, no date.
//  4. A cost is never invented, and any total says how many are missing and
//     calls itself a floor.
//
// Run with: node scripts/test_upkeep.js
// Exits non-zero on any failure.

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
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('unexpected import');
  });
  return module.exports;
}

const U = loadModule('lib/upkeep.ts');
const {
  UPKEEP_CATEGORIES, upkeepCategoryLabel,
  upkeepStanding, DUE_SOON_DAYS,
  summarizeUpkeep, describeUpkeepStanding, describeUpkeepSummary,
  nextDueAfterDoing, formatUpkeepMoney,
} = U;

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
function checkTrue(label, actual) { check(label, actual === true, true); }

const TODAY = '2026-09-05';
const rec = (over = {}) => ({
  id: 'u1', name: 'Boiler service', category: 'home', cadence: 'recurring',
  intervalMonths: 12, lastDoneOn: '2026-03-01', expiresOn: null, renewable: false,
  cost: null, active: true, notes: null, ...over,
});
const exp = (over = {}) => ({
  id: 'u2', name: 'Passport', category: 'document', cadence: 'expires',
  intervalMonths: null, lastDoneOn: null, expiresOn: '2027-01-15', renewable: true,
  cost: null, active: true, notes: null, ...over,
});

// --- 1. A service counts from when it was last done -------------------------

{
  // THE CASE THE WHOLE FILE TURNS ON. Serviced in March, annual, so next March.
  // A calendar rule would have said January.
  const s = upkeepStanding(rec({ lastDoneOn: '2026-03-01', intervalMonths: 12 }), TODAY);
  check('next due is a year after it was last done', s.dueOn, '2027-03-01');
  checkTrue('which is in the future', (s.daysAway ?? 0) > 0);
  check('so not overdue', s.overdue, false);
  check('and not due soon either', s.dueSoon, false);
  checkTrue('the wording names both the last date and the interval',
    describeUpkeepStanding(s).includes('Last done 2026-03-01') && describeUpkeepStanding(s).includes('every year'));
}
{
  // Doing it later moves the next date later. This is the difference from a
  // bill, stated as a test.
  const early = upkeepStanding(rec({ lastDoneOn: '2026-01-01' }), TODAY);
  const late = upkeepStanding(rec({ lastDoneOn: '2026-06-01' }), TODAY);
  check('an earlier service is due earlier', early.dueOn, '2027-01-01');
  check('and a later one later', late.dueOn, '2027-06-01');
  checkTrue('so the next date follows the doing, not the calendar', early.dueOn < late.dueOn);
}
{
  const s = upkeepStanding(rec({ name: 'Water filter', intervalMonths: 3, lastDoneOn: '2026-03-01' }), TODAY);
  check('a three-month filter was due in June', s.dueOn, '2026-06-01');
  check('so it is overdue', s.overdue, true);
  check('and not counted as due soon as well', s.dueSoon, false);
  checkTrue('the wording says it was due, past tense',
    describeUpkeepStanding(s).includes('it was due'));
  checkTrue('and gives a human span rather than a raw day count',
    /months ago/.test(describeUpkeepStanding(s)));
}
{
  const s = upkeepStanding(rec({ intervalMonths: 6, lastDoneOn: '2026-04-01' }), TODAY);
  check('due in October', s.dueOn, '2026-10-01');
  check('which is inside the window', s.dueSoon, true);
  check('and not overdue', s.overdue, false);
}

// --- 2. Month arithmetic that has to clamp ---------------------------------

{
  // 31 August plus six months. February has no 31st, so it lands on the 28th.
  const s = upkeepStanding(rec({ lastDoneOn: '2026-08-31', intervalMonths: 6 }), TODAY);
  check('the last day of a shorter month, not an impossible date', s.dueOn, '2027-02-28');
  checkTrue('and it is a date that actually parses', !Number.isNaN(Date.parse(s.dueOn)));
}
{
  const s = upkeepStanding(rec({ lastDoneOn: '2027-08-31', intervalMonths: 6 }), TODAY);
  // 2028 is a leap year, so the same arithmetic lands on the 29th.
  check('a leap year gives the 29th', s.dueOn, '2028-02-29');
}
{
  const s = upkeepStanding(rec({ lastDoneOn: '2026-01-31', intervalMonths: 1 }), TODAY);
  check('31 January plus one month clamps to the end of February', s.dueOn, '2026-02-28');
}
{
  const s = upkeepStanding(rec({ lastDoneOn: '2026-12-15', intervalMonths: 12 }), TODAY);
  check('crossing a year boundary works', s.dueOn, '2027-12-15');
}

// --- 3. Something that runs out --------------------------------------------

{
  const s = upkeepStanding(exp({ expiresOn: '2027-01-15' }), TODAY);
  check('the date is the date', s.dueOn, '2027-01-15');
  check('not overdue', s.overdue, false);
  checkTrue('the wording says it runs out', describeUpkeepStanding(s).includes('Runs out'));
}
{
  const s = upkeepStanding(exp({ name: 'Residency card', expiresOn: '2026-08-01' }), TODAY);
  check('a passed date is overdue', s.overdue, true);
  checkTrue('and the wording says it ran out', describeUpkeepStanding(s).includes('Ran out'));
  checkTrue('and suggests checking what rested on it',
    describeUpkeepStanding(s).includes('resting on it'));
}
{
  // Something that just ends. Telling someone to renew a finished warranty
  // would be telling them to do an impossible thing.
  const s = upkeepStanding(exp({ name: 'Laptop warranty', expiresOn: '2026-08-01', renewable: false }), TODAY);
  check('still overdue in the sense of past', s.overdue, true);
  checkTrue('but the wording says there is nothing to renew',
    describeUpkeepStanding(s).includes('Nothing to renew'));
  checkTrue('and calls it a record rather than a task',
    describeUpkeepStanding(s).includes('record rather than a task'));
  const future = upkeepStanding(exp({ expiresOn: '2027-06-01', renewable: false }), TODAY);
  checkTrue('a future one says it does not renew',
    describeUpkeepStanding(future).includes('does not renew'));
}

// --- 4. Every refusal ------------------------------------------------------

{
  const s = upkeepStanding(rec({ lastDoneOn: null }), TODAY);
  check('never done gives no date', s.dueOn, null);
  check('and no day count', s.daysAway, null);
  check('named as never done', s.missing, 'neverDone');
  check('not reported as overdue, which would be a guess', s.overdue, false);
  checkTrue('the wording asks when it was last done',
    describeUpkeepStanding(s).includes('Never recorded as done'));
}
{
  const s = upkeepStanding(rec({ intervalMonths: null }), TODAY);
  check('no interval gives no date', s.dueOn, null);
  check('named as such', s.missing, 'noInterval');
  checkTrue('the wording asks how often', describeUpkeepStanding(s).includes('how often'));
  check('zero is treated the same as missing', upkeepStanding(rec({ intervalMonths: 0 }), TODAY).missing, 'noInterval');
}
{
  const s = upkeepStanding(exp({ expiresOn: null }), TODAY);
  check('no expiry date gives no date', s.dueOn, null);
  check('named as such', s.missing, 'noDate');
  checkTrue('the wording asks for the date', describeUpkeepStanding(s).includes('Add the date'));
}
{
  // Due exactly today is neither overdue nor merely upcoming: it is today.
  const s = upkeepStanding(rec({ lastDoneOn: '2025-09-05', intervalMonths: 12 }), TODAY);
  check('due today', s.daysAway, 0);
  check('not overdue', s.overdue, false);
  check('but due soon', s.dueSoon, true);
  checkTrue('and the wording says today', describeUpkeepStanding(s).includes('today'));
}

// --- 5. Everything together, and the cost floor ----------------------------

{
  const summary = summarizeUpkeep(
    [
      rec({ id: 'a', name: 'Water filter', intervalMonths: 3, lastDoneOn: '2026-03-01', cost: 40 }),
      rec({ id: 'b', name: 'Boiler service', intervalMonths: 12, lastDoneOn: '2025-08-01', cost: 180 }),
      rec({ id: 'c', name: 'Gutters', intervalMonths: 6, lastDoneOn: '2026-04-10', cost: null }),
      exp({ id: 'd', name: 'Passport', expiresOn: '2029-01-01', cost: 130 }),
      rec({ id: 'e', name: 'Chimney', intervalMonths: 12, lastDoneOn: null }),
      rec({ id: 'f', name: 'Old thing', intervalMonths: 12, lastDoneOn: '2020-01-01', active: false }),
    ],
    TODAY,
  );
  check('inactive is left out of the count', summary.tracked, 5);
  check('two are overdue', summary.overdue.length, 2);
  // The filter, not the boiler. A three-month filter last done in March is 96
  // days past due; an annual boiler last done in August 2025 is only 35. My
  // first pass expected the boiler because a year sounds worse than a quarter,
  // and the sort was right. How far past due is the question, not how long the
  // interval is.
  check('most overdue first, by how far past due', summary.overdue[0].item.name, 'Water filter');
  check('and the boiler second', summary.overdue[1].item.name, 'Boiler service');
  checkTrue('the ordering really is by days past due',
    (summary.overdue[0].daysAway ?? 0) < (summary.overdue[1].daysAway ?? 0));
  check('one is due soon', summary.dueSoon.length, 1);
  check('and it is the gutters', summary.dueSoon[0].item.name, 'Gutters');
  check('one cannot be placed at all', summary.needsSetup.length, 1);
  check('named as the chimney', summary.needsSetup[0].item.name, 'Chimney');

  // The passport is years out, so it must not be in the figure.
  check('only what is coming up is costed', summary.costAhead, 40 + 180);
  check('and what has no cost is counted', summary.costUnknown, 1);

  const text = describeUpkeepSummary(summary);
  checkTrue('the overdue count is named', text.includes('2 things are overdue'));
  checkTrue('the longest overdue is named', text.includes('Water filter'));
  checkTrue('the figure is given as a floor', text.includes('at least $220.00'));
  checkTrue('and says why', text.includes('treat it as a floor'));
  checkTrue('and nothing placeable is admitted', text.includes('cannot be placed on a calendar'));
}
{
  // Every cost known, so the figure is a total rather than a floor.
  const summary = summarizeUpkeep(
    [rec({ intervalMonths: 3, lastDoneOn: '2026-03-01', cost: 40 })],
    TODAY,
  );
  check('nothing unknown', summary.costUnknown, 0);
  const text = describeUpkeepSummary(summary);
  checkTrue('so it reads as a plain total', text.includes('That comes to $40.00'));
  checkTrue('and not as a floor', !text.includes('floor'));
}
{
  // Something due, but no costs recorded anywhere. No figure should appear.
  const summary = summarizeUpkeep([rec({ intervalMonths: 3, lastDoneOn: '2026-03-01', cost: null })], TODAY);
  check('nothing to add up', summary.costAhead, 0);
  const text = describeUpkeepSummary(summary);
  checkTrue('no money figure is quoted at all', !text.includes('$'));
  checkTrue('and it asks for the costs', text.includes('Add what they cost'));
}
{
  const summary = summarizeUpkeep([], TODAY);
  check('nothing tracked', summary.tracked, 0);
  checkTrue('and honest wording', describeUpkeepSummary(summary).includes('Nothing here yet'));
}
{
  // All in order. Should say so rather than finding something to warn about.
  const summary = summarizeUpkeep([rec({ intervalMonths: 12, lastDoneOn: '2026-08-01' })], TODAY);
  check('nothing overdue', summary.overdue.length, 0);
  check('nothing due soon', summary.dueSoon.length, 0);
  const text = describeUpkeepSummary(summary);
  checkTrue('and the wording is calm', text.includes('nothing overdue'));
  checkTrue('naming the window it checked', text.includes(String(DUE_SOON_DAYS)));
}

// --- 6. Doing it resets the clock -----------------------------------------

{
  const item = rec({ intervalMonths: 6, lastDoneOn: '2026-01-01' });
  check('doing it today moves the next date to today plus the interval',
    nextDueAfterDoing(item, '2026-09-05'), '2027-03-05');
  checkTrue('which is later than it was before', nextDueAfterDoing(item, '2026-09-05') > '2026-07-01');
  check('an expiring thing has no next date from doing it', nextDueAfterDoing(exp(), '2026-09-05'), null);
  check('nor does one with no interval', nextDueAfterDoing(rec({ intervalMonths: null }), '2026-09-05'), null);
}

// --- 7. Vocabulary and formatting -----------------------------------------

check('four categories', UPKEEP_CATEGORIES.length, 4);
check('a category has a label', upkeepCategoryLabel('document'), 'Documents');
check('an unknown one is not renamed', upkeepCategoryLabel('nonsense'), 'nonsense');
checkTrue('every category carries an example, since the names alone are vague',
  UPKEEP_CATEGORIES.every((entry) => entry.example.length > 0));
check('money formats', formatUpkeepMoney(1234.5), '$1,234.50');
checkTrue('the window is a real stretch of weeks', DUE_SOON_DAYS >= 30);

{
  // The rule carried over from the Work area: nothing here may assert what is
  // required, because that depends on where someone lives.
  const everything = UPKEEP_CATEGORIES.flatMap((entry) => [entry.label, entry.example]).join(' ');
  checkTrue('no category claims a legal requirement',
    !/must|required by|by law|mandatory/i.test(everything));
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
