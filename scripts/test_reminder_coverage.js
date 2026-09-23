// Checks the dated-reminder arithmetic (lib/reminderSchedule.ts): which days
// a bill, an upkeep item or a resetting work benefit speaks on, how the
// overdue nudge behaves once it is switched on, and the wording each day
// leads with. Pure, so it runs here rather than needing a phone.
//
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does (2026-09-16).
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
    throw new Error('lib/reminderSchedule.ts must stay free of runtime imports');
  });
  return module.exports;
}

const {
  addDaysToDate,
  ALL_DATED_REMINDER_KINDS,
  datedReminderDays,
  daysBetweenDates,
  describeLead,
  LEAD_DAYS,
  MAX_OVERDUE_NUDGE_DAYS,
  NUDGES_WHILE_OVERDUE,
  NUDGE_FOLLOW_UP_MINUTES,
  REMINDER_HOUR,
} = load('lib/reminderSchedule.ts');

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

// --- Date arithmetic --------------------------------------------------------
// The whole reason this file does its own date maths is that `new Date(str)`
// reads a bare date as UTC midnight, which is the day before west of
// Greenwich. These checks are what would catch that coming back.

check('a day forward', addDaysToDate('2026-09-16', 1), '2026-09-17');
check('a day back', addDaysToDate('2026-09-16', -1), '2026-09-15');
check('across a month end', addDaysToDate('2026-09-30', 1), '2026-10-01');
check('across a year end', addDaysToDate('2026-12-31', 1), '2027-01-01');
check('across a leap day', addDaysToDate('2028-02-28', 1), '2028-02-29');
check('past a non-leap February', addDaysToDate('2026-02-28', 1), '2026-03-01');
check('thirty days out of January', addDaysToDate('2027-01-15', 30), '2027-02-14');
// A stored date sometimes arrives with a time stuck on the end of it
// (work_benefits.reset_on is an ISO string), so the day is taken off the
// front rather than the whole value being refused.
check('a date carrying a time keeps its day', addDaysToDate('2026-09-16T09:00', 1), '2026-09-17');
check('nonsense in, null out', addDaysToDate('not a date', 1), null);

check('days between, forward', daysBetweenDates('2026-09-16', '2026-09-19'), 3);
check('days between, backward', daysBetweenDates('2026-09-19', '2026-09-16'), -3);
check('days between, same day', daysBetweenDates('2026-09-16', '2026-09-16'), 0);
check('days between across a month', daysBetweenDates('2026-09-30', '2026-10-02'), 2);
// Mexico observes no DST now, but plenty of places do, and a 23-hour or
// 25-hour day must not turn three days into two and a bit.
check('days between across a spring forward', daysBetweenDates('2027-03-13', '2027-03-16'), 3);
check('days between across an autumn back', daysBetweenDates('2027-11-06', '2027-11-09'), 3);
check('days between nonsense', daysBetweenDates('2026-09-16', 'later'), null);

// --- Which days each kind speaks on -----------------------------------------

const bill = datedReminderDays('bill', '2026-09-20', '2026-09-16', false);
check('a bill speaks twice', bill.map((d) => d.on), ['2026-09-17', '2026-09-20']);
check('a bill leads by three days then none', bill.map((d) => d.lead), [3, 0]);

const upkeep = datedReminderDays('upkeep', '2026-10-01', '2026-09-16', false);
check('upkeep speaks three times', upkeep.map((d) => d.on), ['2026-09-17', '2026-09-28', '2026-10-01']);
check('upkeep leads by a fortnight, three days, then none', upkeep.map((d) => d.lead), [14, 3, 0]);

const benefit = datedReminderDays('benefit', '2026-12-31', '2026-09-16', false);
check('a benefit speaks twice', benefit.map((d) => d.on), ['2026-12-01', '2026-12-24']);
check('a benefit never speaks on the day itself', benefit.some((d) => d.lead === 0), false);

// A Days Until counter (1.0.42.13) speaks on the day it lands and only then,
// and never comes back: a counter past its day keeps counting on screen by
// design, so nudging it would be nagging about a thing to look at.
const countdown = datedReminderDays('countdown', '2026-10-04', '2026-09-20', false);
check('a countdown speaks once', countdown.map((d) => d.on), ['2026-10-04']);
check('a countdown speaks on the day itself', countdown.map((d) => d.lead), [0]);
const countdownNudged = datedReminderDays('countdown', '2026-09-18', '2026-09-20', true);
check('a countdown past its day stays quiet even with nudging on', countdownNudged.map((d) => d.on), ['2026-09-18']);
check('a countdown is not a kind that nudges', NUDGES_WHILE_OVERDUE.includes('countdown'), false);

// A compost pile (2026-09-23) speaks on the day it is due a turn and then
// keeps asking, because recording a turn is a thing this app reads back and
// it moves the date on. A pile left unturned is the single most common way
// a pile goes wrong, so going quiet about it would be the wrong silence.
const compost = datedReminderDays('compost', '2026-10-04', '2026-09-20', false);
check('a compost turn speaks once with nudging off', compost.map((d) => d.on), ['2026-10-04']);
check('a compost turn speaks on the day itself', compost.map((d) => d.lead), [0]);
const compostNudged = datedReminderDays('compost', '2026-09-18', '2026-09-20', true);
check('a compost turn keeps asking while it waits', compostNudged.length > 1, true);
check('the first of them is the day it was due', compostNudged[0].on, '2026-09-18');
check('a compost turn is a kind that nudges', NUDGES_WHILE_OVERDUE.includes('compost'), true);

// Soonest first, always, because the scheduler takes the first however-many
// that fit inside the lookahead window.
for (const kind of ALL_DATED_REMINDER_KINDS) {
  const days = datedReminderDays(kind, '2026-11-05', '2026-09-16', false);
  const sorted = [...days].map((d) => d.on).sort();
  check(`${kind} comes back in date order`, days.map((d) => d.on), sorted);
  check(`${kind} says as many days as it has leads`, days.length, LEAD_DAYS[kind].length);
  check(
    `${kind} leads match the schedule set for it`,
    days.map((d) => d.lead).sort((a, b) => a - b),
    [...LEAD_DAYS[kind]].sort((a, b) => a - b),
  );
}

check('a due date that is not a date says nothing', datedReminderDays('bill', 'soon', '2026-09-16', false), []);
check('a today that is not a date says nothing', datedReminderDays('bill', '2026-09-20', '', false), []);

// A lead day landing in a different month, which is where off-by-one date
// arithmetic usually shows itself.
const monthEnd = datedReminderDays('bill', '2026-10-01', '2026-09-16', false);
check('a bill due on the 1st warns in September', monthEnd.map((d) => d.on), ['2026-09-28', '2026-10-01']);

// --- Nudging ----------------------------------------------------------------

// Off by default is the point of the switch: with it off nothing extra
// appears, however far past the date the thing is.
check(
  'nudging off adds nothing for an overdue bill',
  datedReminderDays('bill', '2026-09-10', '2026-09-16', false).map((d) => d.on),
  ['2026-09-07', '2026-09-10'],
);
check(
  'nudging off adds nothing for overdue upkeep',
  datedReminderDays('upkeep', '2026-09-10', '2026-09-16', false).length,
  3,
);

// Two kinds repeat, and both for the same reason: the doing is recorded, so
// the app can tell when to stop. Marking an upkeep item done moves its next
// date and recording a turn on a pile moves the next turn. A bill has no
// per-occurrence paid record, a benefit is drawn down gradually, and a
// counter past its day keeps counting on screen by design, so none of those
// three can say when they have been answered.
check('upkeep and compost are the kinds that nudge', NUDGES_WHILE_OVERDUE, ['upkeep', 'compost']);
check(
  'a bill still does not nudge with nudging on',
  datedReminderDays('bill', '2026-09-10', '2026-09-16', true).map((d) => d.on),
  ['2026-09-07', '2026-09-10'],
);
check(
  'a benefit still does not nudge with nudging on',
  datedReminderDays('benefit', '2026-09-10', '2026-09-16', true).length,
  2,
);

// Six days overdue: the three lead days, plus today and the eight days after
// it, which is the fortnight cap minus the six days already gone.
const overdue = datedReminderDays('upkeep', '2026-09-10', '2026-09-16', true);
check('an overdue upkeep item keeps asking', overdue.length, 3 + (MAX_OVERDUE_NUDGE_DAYS - 6));
check('it starts asking today', overdue[overdue.length - (MAX_OVERDUE_NUDGE_DAYS - 6)].on, '2026-09-16');
check('it gives up a fortnight after the date', overdue[overdue.length - 1].on, '2026-09-23');
check('every nudge day is past the date', overdue.filter((d) => d.lead < 0).length, MAX_OVERDUE_NUDGE_DAYS - 6);
check('no day is listed twice', overdue.length, new Set(overdue.map((d) => d.on)).size);
check(
  'nudge days stay in order',
  overdue.map((d) => d.on),
  [...overdue.map((d) => d.on)].sort(),
);

// Overdue by exactly the cap, and past it: something ignored for a fortnight
// is a decision, so it stops rather than asking forever.
check(
  'at the cap it has nothing left to say',
  datedReminderDays('upkeep', '2026-09-02', '2026-09-16', true).filter((d) => d.lead < 0).length,
  0,
);
check(
  'well past the cap it stays quiet',
  datedReminderDays('upkeep', '2026-06-01', '2026-09-16', true).filter((d) => d.lead < 0).length,
  0,
);

// Due today, with nudging on: the day itself is already a lead day and must
// not be counted twice, and the run covers the whole fortnight after it.
const dueToday = datedReminderDays('upkeep', '2026-09-16', '2026-09-16', true);
check('due today lists today once', dueToday.filter((d) => d.on === '2026-09-16').length, 1);
check("today's entry is the lead day, not a nudge", dueToday.find((d) => d.on === '2026-09-16').lead, 0);
check('a full fortnight of nudges follows', dueToday.filter((d) => d.lead < 0).length, MAX_OVERDUE_NUDGE_DAYS - 1);

// Not due yet, with nudging on: nothing extra until the date has passed.
check(
  'nudging adds nothing before the date',
  datedReminderDays('upkeep', '2026-10-01', '2026-09-16', true).length,
  3,
);

// --- Wording ----------------------------------------------------------------

check('the day itself', describeLead(0), 'today');
check('one day ahead', describeLead(1), 'tomorrow');
check('three days ahead', describeLead(3), 'in 3 days');
check('a month ahead', describeLead(30), 'in 30 days');
check('one day past', describeLead(-1), 'yesterday');
check('three days past', describeLead(-3), '3 days ago');

// --- The constants themselves -----------------------------------------------
// These are judgment calls rather than arithmetic, so what is checked is that
// they stay sane: a lead schedule that runs backwards, or an hour outside the
// day, would ship a reminder arriving at the wrong end of things.

check('dated reminders fire during the day', REMINDER_HOUR >= 6 && REMINDER_HOUR <= 20, true);
for (const kind of ALL_DATED_REMINDER_KINDS) {
  check(`${kind} has at least one lead day`, LEAD_DAYS[kind].length > 0, true);
  check(
    `${kind} lists its leads longest first`,
    LEAD_DAYS[kind],
    [...LEAD_DAYS[kind]].sort((a, b) => b - a),
  );
  check(`${kind} never leads from the past`, LEAD_DAYS[kind].every((lead) => lead >= 0), true);
  check(`${kind} repeats no lead day`, LEAD_DAYS[kind].length, new Set(LEAD_DAYS[kind]).size);
}
check('follow-ups spread out rather than drum', NUDGE_FOLLOW_UP_MINUTES, [15, 45, 90]);
check(
  'follow-ups run forwards',
  NUDGE_FOLLOW_UP_MINUTES,
  [...NUDGE_FOLLOW_UP_MINUTES].sort((a, b) => a - b),
);
check('an overdue nudge gives up inside a fortnight', MAX_OVERDUE_NUDGE_DAYS, 14);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`All ${checks} checks passed`);
