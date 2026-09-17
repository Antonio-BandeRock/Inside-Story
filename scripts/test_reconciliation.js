// Checks reconciliation's own rules (lib/reconciliation.ts): what each kind of
// thing can be answered with, which status word that answer turns into, how
// lateness is said out loud, and where a one-tap move actually lands. Pure, so
// it runs here rather than needing a phone.
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
    throw new Error('lib/reconciliation.ts must stay free of runtime imports');
  });
  return module.exports;
}

const {
  RECONCILE_ACTIONS,
  RECONCILE_KIND_ORDER,
  assumedActions,
  assumptionMustBeUndone,
  describeLateness,
  describeReconcileQueue,
  describeStatus,
  formatLocalDateTime,
  groupReconcileItems,
  isSettledStatus,
  lookbackDateString,
  moveOptions,
  parseLocalDateTime,
  reconcileKindFor,
  scheduleStatusForOutcome,
  sortReconcileItems,
  thoughtTimeOptions,
} = load('lib/reconciliation.ts');

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

// --- What a row is -----------------------------------------------------------

check('a plain meal is a meal', reconcileKindFor('meal', 'breakfast'), 'meal');
// How the Hydration lens and the Daily Meal Plan's water-gap filler both write
// a drink: item_type 'meal', meal_type 'beverage'. Getting this wrong would
// offer "Ate it" for a glass of water.
check('a beverage row is a drink', reconcileKindFor('meal', 'beverage'), 'drink');
check('a supplement is a dose', reconcileKindFor('supplement', null), 'dose');
check('a prescription is a dose', reconcileKindFor('prescription', null), 'dose');
check('an OTC drug is a dose', reconcileKindFor('otc', null), 'dose');
check('an appointment is its own kind', reconcileKindFor('appointment', null), 'appointment');
check('garden work is a task', reconcileKindFor('garden', null), 'task');
check('a food trial check-in is a task', reconcileKindFor('foodTest', null), 'task');
check('a ferment check-in is a task', reconcileKindFor('fermentation', null), 'task');
check('a scheduled thought is a task', reconcileKindFor('reminder', null), 'task');
// Anything added later lands somewhere answerable rather than vanishing.
check('an unknown type still gets asked about', reconcileKindFor('somethingNew', null), 'task');

// --- What each kind can be answered with -------------------------------------

check(
  'only a meal offers "ate something else"',
  RECONCILE_KIND_ORDER.filter((kind) =>
    RECONCILE_ACTIONS[kind].some((action) => action.outcome === 'replaced'),
  ),
  ['meal'],
);
check(
  'a dose was taken or it was not, nothing in between',
  RECONCILE_ACTIONS.dose.map((action) => action.outcome),
  ['done', 'skipped'],
);
check(
  'food and drink can both be partly done',
  RECONCILE_KIND_ORDER.filter((kind) => RECONCILE_ACTIONS[kind].some((action) => action.outcome === 'partial')),
  ['meal', 'drink'],
);
check('every kind has an answer', RECONCILE_KIND_ORDER.every((kind) => RECONCILE_ACTIONS[kind].length >= 2), true);

// --- Asking about an answer the app filled in --------------------------------

// Same list of answers, so a chip cannot exist on one and not the other. Only
// the confirming one is worded as a yes, because the question being asked is
// different: the app already put something there.
check(
  'confirming a meal is the same set of answers',
  assumedActions('meal').map((action) => action.outcome),
  RECONCILE_ACTIONS.meal.map((action) => action.outcome),
);
check('the yes chip says yes', assumedActions('meal')[0].label, 'Yes, I ate it');
check('a dose confirms in its own words', assumedActions('dose')[0].label, 'Yes, I took it');
check(
  'nothing but the yes chip is reworded',
  assumedActions('meal').slice(1).map((action) => action.label),
  RECONCILE_ACTIONS.meal.slice(1).map((action) => action.label),
);
// A meal the app built out of the plan is counted by every nutrient figure in
// Trends, so saying it did not happen has to take it back out.
check('skipping undoes the assumption', assumptionMustBeUndone('skipped'), true);
check('eating something else undoes it too', assumptionMustBeUndone('replaced'), true);
// Something was eaten, and the planned amounts are the only figures anybody
// has, so the record keeps them rather than the app halving a number nobody
// chose.
check('some of it leaves the meal in place', assumptionMustBeUndone('partial'), false);
check('agreeing changes nothing but who said it', assumptionMustBeUndone('done'), false);

// --- What that answer is written down as -------------------------------------

check('a meal eaten is logged', scheduleStatusForOutcome('meal', 'done'), 'logged');
check('a dose taken is logged', scheduleStatusForOutcome('dose', 'done'), 'logged');
// A task and an appointment take the word those lenses already show, rather
// than a second word meaning the same thing.
check('a task done is completed', scheduleStatusForOutcome('task', 'done'), 'completed');
check('an appointment attended is completed', scheduleStatusForOutcome('appointment', 'done'), 'completed');
check('an appointment missed is cancelled', scheduleStatusForOutcome('appointment', 'skipped'), 'cancelled');
check('a meal skipped is skipped', scheduleStatusForOutcome('meal', 'skipped'), 'skipped');
check('some of it is partial', scheduleStatusForOutcome('meal', 'partial'), 'partial');
// The distinction asked for by name: eating something else is not the same as
// going without, and recording it as skipped would say somebody did not eat.
check('something else is replaced, not skipped', scheduleStatusForOutcome('meal', 'replaced'), 'replaced');

check('planned reads back as nothing at all', describeStatus('planned'), null);
check('a word exists for every status written', [
  describeStatus('logged'),
  describeStatus('completed'),
  describeStatus('partial'),
  describeStatus('replaced'),
  describeStatus('skipped'),
  describeStatus('cancelled'),
], ['Logged', 'Completed', 'Partly', 'Replaced', 'Skipped', 'Cancelled']);
check('an unrecognised status prints nothing rather than a database word', describeStatus('mystery'), null);

check('only planned is unanswered', isSettledStatus('planned'), false);
check('partial counts as answered', isSettledStatus('partial'), true);
check('replaced counts as answered', isSettledStatus('replaced'), true);

// --- Local times, never UTC --------------------------------------------------

const parsedEarly = parseLocalDateTime('2026-09-16T00:30');
check('an early-morning row stays on its own day', [parsedEarly.getDate(), parsedEarly.getHours()], [16, 0]);
check('a bare date parses at midnight', parseLocalDateTime('2026-09-16').getHours(), 0);
check('nonsense parses as nothing', parseLocalDateTime('soon'), null);
check(
  'formatting round-trips the stored shape',
  formatLocalDateTime(parseLocalDateTime('2026-09-16T07:05')),
  '2026-09-16T07:05',
);

// A week back, counted in calendar days: seven dates, not 168 hours landing
// mid-morning and cutting that day in half.
check('the lookback is seven whole days', lookbackDateString(new Date(2026, 8, 16, 14, 0)), '2026-09-09');
check('it crosses a month end', lookbackDateString(new Date(2026, 8, 3, 1, 0)), '2026-08-27');

// --- How late it is ----------------------------------------------------------

const now = new Date(2026, 8, 16, 14, 0);
check('minutes while it is still this hour', describeLateness('2026-09-16T13:40', now), '20 min ago');
check('hours for the rest of today', describeLateness('2026-09-16T08:00', now), '6 hours ago');
check('one hour reads as a word', describeLateness('2026-09-16T13:00', now), 'an hour ago');
// 31 hours is arithmetic; yesterday is a memory.
check('yesterday is named, not counted', describeLateness('2026-09-15T07:00', now), 'yesterday, 7:00am');
check('this week is named by its day', describeLateness('2026-09-12T19:30', now), 'Saturday, 7:30pm');
check('past a week it goes back to counting', describeLateness('2026-09-01T09:00', now), '15 days ago');
check('something still ahead is not called late', describeLateness('2026-09-16T14:30', now), 'in 30 min');
check('later today says so', describeLateness('2026-09-16T19:00', now), 'later today, 7:00pm');

// --- Where a one-tap move lands ----------------------------------------------

const morningNow = new Date(2026, 8, 16, 9, 30);
const moves = moveOptions('2026-09-16T07:00', morningNow);
check('three choices at most', moves.length <= 3, true);
check('an hour means an hour', moves.find((option) => option.key === 'hour').scheduledFor, '2026-09-16T10:30');
check('the evening is offered while it is still ahead', moves.some((option) => option.key === 'evening'), true);
// A breakfast moved to tomorrow lands at breakfast time, not at whatever hour
// the person happened to open the screen.
check('tomorrow keeps the time it was set for', moves.find((option) => option.key === 'tomorrow').scheduledFor, '2026-09-17T07:00');

const eveningNow = new Date(2026, 8, 16, 21, 0);
const eveningMoves = moveOptions('2026-09-16T07:00', eveningNow);
check('the evening stops being offered once it is over', eveningMoves.some((option) => option.key === 'evening'), false);
check('tomorrow is still there at night', eveningMoves.find((option) => option.key === 'tomorrow').scheduledFor, '2026-09-17T07:00');

// --- Where a thought can be put ----------------------------------------------

const thoughtOptions = thoughtTimeOptions(morningNow);
check('later today is offered in the morning', thoughtOptions.find((option) => option.key === 'later').scheduledFor, '2026-09-16T12:30');
check('tomorrow morning is nine', thoughtOptions.find((option) => option.key === 'tomorrow').scheduledFor, '2026-09-17T09:00');
// 2026-09-16 is a Wednesday, so the weekend is the 19th.
check('the weekend is the coming Saturday', thoughtOptions.find((option) => option.key === 'weekend').scheduledFor, '2026-09-19T10:00');
check('next week is seven days out', thoughtOptions.find((option) => option.key === 'week').scheduledFor, '2026-09-23T09:00');
check(
  'nothing gets quietly scheduled for eleven at night',
  thoughtTimeOptions(eveningNow).some((option) => option.key === 'later'),
  false,
);
// Somebody sorting their inbox on a Saturday morning who picks "this weekend"
// does not mean the day they are standing in the middle of.
const saturdayNow = new Date(2026, 8, 19, 10, 0);
check(
  'on a Saturday the weekend is the next one',
  thoughtTimeOptions(saturdayNow).find((option) => option.key === 'weekend').scheduledFor,
  '2026-09-26T10:00',
);

// --- Order and grouping ------------------------------------------------------

const items = [
  { id: 'a', itemType: 'meal', mealType: 'dinner', title: 'Salmon', scheduledFor: '2026-09-16T18:00', status: 'planned' },
  { id: 'b', itemType: 'supplement', mealType: null, title: 'Selenium', scheduledFor: '2026-09-15T08:00', status: 'planned' },
  { id: 'c', itemType: 'meal', mealType: 'breakfast', title: 'Oats', scheduledFor: '2026-09-16T07:00', status: 'planned' },
  { id: 'd', itemType: 'meal', mealType: 'beverage', title: 'Water', scheduledFor: '2026-09-16T09:30', status: 'planned' },
];

check(
  'oldest first, so the hardest to remember is asked first',
  sortReconcileItems(items).map((item) => item.id),
  ['b', 'c', 'd', 'a'],
);

const groups = groupReconcileItems(items);
check('an empty kind gets no heading', groups.map((group) => group.kind), ['meal', 'drink', 'dose']);
check('meals come first', groups[0].items.map((item) => item.id), ['c', 'a']);
check('the drink is on its own', groups[1].items.map((item) => item.id), ['d']);
check('grouping loses nothing', groups.reduce((total, group) => total + group.items.length, 0), items.length);

// --- The sentence on Home ----------------------------------------------------

check('nothing waiting says nothing', describeReconcileQueue({ thoughts: 0, scheduled: 0 }), '');
check('one thought', describeReconcileQueue({ thoughts: 1, scheduled: 0 }), '1 thought to sort.');
check('several thoughts', describeReconcileQueue({ thoughts: 4, scheduled: 0 }), '4 thoughts to sort.');
check('one scheduled thing', describeReconcileQueue({ thoughts: 0, scheduled: 1 }), '1 thing to answer for.');
check(
  'both halves in one line',
  describeReconcileQueue({ thoughts: 2, scheduled: 3 }),
  '2 thoughts to sort, and 3 things to answer for.',
);

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`reconciliation: ${checks} checks passed.`);
