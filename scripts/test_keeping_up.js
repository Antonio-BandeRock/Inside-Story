// Runs lib/keepingUp.ts: the arithmetic behind Trends > Keeping Up.
//
// Built 2026-09-23, phase 3 of the cross-app push.
//
// The rules checked:
//
//  1. An unrecognised cadence falls back to anytime, which is the reading
//     that claims the least about whether anything is overdue.
//  2. A daily run counts up to today, and today not yet marked is the day in
//     progress rather than a broken run.
//  3. A WEEK WITH NOTHING IN IT IS A GAP, NEVER A ZERO, in every one of the
//     five bands, and the note under the rows says what the blank means.
//  4. A check never marked says so, and a weekly or monthly one is never
//     described as being on a run of days.
//  5. A walk that stopped is counted where it stopped, a finished one stopped
//     nowhere, and a step is only called a stall once it has happened twice.
//  6. The typical wait on a capture is the middle value, not the mean, so one
//     note left for months cannot move it.
//  7. An upkeep doing with no due date reads as could not be told, never as
//     on time, and early, on the day and late each have their own wording.
//  8. Drain direction needs four answered weeks and compares halves, so one
//     hard week is not a trend.
//  9. Nothing here scores anybody: no sentence blames, praises or claims a
//     count caused anything.
//
// Run with: node scripts/test_keeping_up.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function transpile(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  return outputText;
}

function run(relPath, resolve) {
  const module = { exports: {} };
  new Function('exports', 'module', 'require', transpile(relPath))(module.exports, module, (name) => {
    const found = resolve[name];
    if (!found) throw new Error(`unexpected import ${name}`);
    return found;
  });
  return module.exports;
}

// keepingUp.ts takes its week arithmetic from eatingVariety.ts rather than
// growing a second copy of it, so the shim hands the transpiled module over
// instead of refusing every require.
const V = run('lib/eatingVariety.ts', {});
const K = run('lib/keepingUp.ts', { './eatingVariety': V });

const {
  readCadence,
  plural,
  daysAgoPhrase,
  gapNote,
  dailyStreak,
  describeCheckStanding,
  summarizeChecks,
  summarizeRoutines,
  middleValue,
  summarizeCaptures,
  describeUpkeepDoing,
  describeUpkeepStandingLine,
  summarizeUpkeepTimeliness,
  drainDirection,
  summarizeWork,
  summarizeKeepingUp,
  describeKeepingUpHome,
} = K;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(name, actual) {
  check(name, actual === true, true);
}

// A fortnight, so weeks land as two clean blocks of seven.
const START = '2026-09-10';
const END = '2026-09-23';

const NO_STANDING = { overdue: 0, dueSoon: 0, settled: 0, worstName: null, worstDaysLate: null };

function inputs(over = {}) {
  return {
    startDate: START,
    endDate: END,
    checks: [],
    marks: [],
    runs: [],
    captures: [],
    upkeepDoings: [],
    upkeepStanding: NO_STANDING,
    workCheckins: [],
    ...over,
  };
}

// ---------------------------------------------------------------------------
// 1. Cadence, and the fallback that claims the least.
// ---------------------------------------------------------------------------
check('daily is read as daily', readCadence('daily'), 'daily');
check('weekly is read as weekly', readCadence('weekly'), 'weekly');
check('monthly is read as monthly', readCadence('monthly'), 'monthly');
check('anytime is read as anytime', readCadence('anytime'), 'anytime');
check('an unknown cadence falls back to anytime', readCadence('fortnightly'), 'anytime');
check('a null cadence falls back to anytime', readCadence(null), 'anytime');
check('an empty cadence falls back to anytime', readCadence(''), 'anytime');

check('one of a thing', plural(1, 'day', 'days'), 'day');
check('none of a thing reads as many', plural(0, 'day', 'days'), 'days');
check('two of a thing', plural(2, 'day', 'days'), 'days');

// ---------------------------------------------------------------------------
// 2. How long ago something was.
// ---------------------------------------------------------------------------
check('today', daysAgoPhrase(END, END), 'today');
check('yesterday', daysAgoPhrase('2026-09-22', END), 'yesterday');
check('a few days back', daysAgoPhrase('2026-09-20', END), '3 days ago');
check('a week and a bit', daysAgoPhrase('2026-09-15', END), 'over a week ago');
check('a few weeks', daysAgoPhrase('2026-09-02', END), '3 weeks ago');
check('past two months it names the day', daysAgoPhrase('2026-06-01', END), 'Jun 1');
check('a date in the future does not go negative', daysAgoPhrase('2026-09-25', END), 'today');

// ---------------------------------------------------------------------------
// 3. A blank period is a gap, and the note says what the blank means.
// ---------------------------------------------------------------------------
const noBlanks = [{ value: 3 }, { value: 1 }];
check('nothing blank means no note', gapNote(noBlanks, 'nothing was marked in them.'), null);
check(
  'one blank week out of three',
  gapNote([{ value: 3 }, { value: null }, { value: 2 }], 'nothing was marked in them.'),
  '1 of these 3 weeks has nothing to read: nothing was marked in them.',
);
check(
  'two blank weeks read as have',
  gapNote([{ value: null }, { value: null }, { value: 2 }], 'nothing was captured in them.'),
  '2 of these 3 weeks have nothing to read: nothing was captured in them.',
);

// ---------------------------------------------------------------------------
// 4. Daily runs.
// ---------------------------------------------------------------------------
check(
  'a run ending today',
  dailyStreak(new Set(['2026-09-23', '2026-09-22', '2026-09-21']), END),
  3,
);
check(
  'today unmarked is the day in progress, not a broken run',
  dailyStreak(new Set(['2026-09-22', '2026-09-21']), END),
  2,
);
check('nothing marked is no run', dailyStreak(new Set([]), END), 0);
check(
  'a gap ends the run',
  dailyStreak(new Set(['2026-09-23', '2026-09-21', '2026-09-20']), END),
  1,
);
check(
  'neither today nor yesterday marked is no run',
  dailyStreak(new Set(['2026-09-20', '2026-09-19']), END),
  0,
);

// ---------------------------------------------------------------------------
// 5. How a single check reads.
// ---------------------------------------------------------------------------
check(
  'never marked says so',
  describeCheckStanding(
    { checkId: 'a', name: 'Water', cadence: 'daily', daysMarked: 0, daysInRange: 14, streak: 0, lastMarked: null, line: '' },
    END,
  ),
  'Never marked.',
);
check(
  'a daily run is read out',
  describeCheckStanding(
    { checkId: 'a', name: 'Water', cadence: 'daily', daysMarked: 9, daysInRange: 14, streak: 4, lastMarked: END, line: '' },
    END,
  ),
  'Marked on 9 of the last 14 days, 4 days running.',
);
check(
  'a daily check with no run says when it was last marked',
  describeCheckStanding(
    { checkId: 'a', name: 'Water', cadence: 'daily', daysMarked: 3, daysInRange: 14, streak: 0, lastMarked: '2026-09-20', line: '' },
    END,
  ),
  'Marked on 3 of the last 14 days. Last marked 3 days ago.',
);
check(
  'an anytime check only says when',
  describeCheckStanding(
    { checkId: 'a', name: 'Bins', cadence: 'anytime', daysMarked: 2, daysInRange: 14, streak: null, lastMarked: '2026-09-22', line: '' },
    END,
  ),
  'Last marked yesterday.',
);
check(
  'a weekly check inside its window',
  describeCheckStanding(
    { checkId: 'a', name: 'Sheets', cadence: 'weekly', daysMarked: 2, daysInRange: 14, streak: null, lastMarked: '2026-09-20', line: '' },
    END,
  ),
  'Marked 2 times in this range. Last marked 3 days ago.',
);
check(
  'a weekly check past its window says so without calling it a failure',
  describeCheckStanding(
    { checkId: 'a', name: 'Sheets', cadence: 'weekly', daysMarked: 1, daysInRange: 14, streak: null, lastMarked: '2026-09-02', line: '' },
    END,
  ),
  'Last marked 3 weeks ago, which is more than a week back.',
);
check(
  'a monthly check past its window names the month',
  describeCheckStanding(
    { checkId: 'a', name: 'Filters', cadence: 'monthly', daysMarked: 0, daysInRange: 14, streak: null, lastMarked: '2026-06-01', line: '' },
    END,
  ),
  'Last marked Jun 1, which is more than a month back.',
);

// ---------------------------------------------------------------------------
// 6. The checks band.
// ---------------------------------------------------------------------------
const noChecks = summarizeChecks(inputs());
check('nothing set up says where to set one up', noChecks.headline,
  'Nothing set up under Did I Do It yet. Add one on the Life tab and this fills in on its own.');
check('nothing set up has no standings', noChecks.standings.length, 0);
check('two clean weeks over a fortnight', noChecks.weeks.length, 2);
checkTrue('every week of an empty range is null', noChecks.weeks.every((week) => week.value === null));
check('and the note says nothing was marked', noChecks.gapNote,
  '2 of these 2 weeks have nothing to read: nothing was marked in them.');

const setUpButQuiet = summarizeChecks(inputs({
  checks: [{ id: 'a', name: 'Water', cadence: 'daily' }, { id: 'b', name: 'Bins', cadence: 'weekly' }],
}));
check('set up but nothing marked', setUpButQuiet.headline, '2 things to check, and nothing marked in this range.');
check('and both are listed', setUpButQuiet.standings.length, 2);
checkTrue('each one reading as never marked',
  setUpButQuiet.standings.every((standing) => standing.line === 'Never marked.'));

const marked = summarizeChecks(inputs({
  checks: [{ id: 'a', name: 'Water', cadence: 'daily' }, { id: 'b', name: 'Bins', cadence: 'weekly' }],
  marks: [
    { checkId: 'a', date: '2026-09-23' },
    { checkId: 'a', date: '2026-09-22' },
    { checkId: 'a', date: '2026-09-21' },
    // Two marks on one day are still one day.
    { checkId: 'b', date: '2026-09-21' },
    { checkId: 'b', date: '2026-09-14' },
  ],
}));
check('days with something marked, and the run leading', marked.headline,
  '4 days with something marked in this range. Water is on 3 days running.');
check('the longest run sorts first', marked.standings[0].name, 'Water');
check('a weekly check never gets a run', marked.standings[1].streak, null);
check('the most recent week counts its days', marked.weeks[1].value, 3);
check('the older week counts its one day', marked.weeks[0].value, 1);
check('nothing blank, so no note', marked.gapNote, null);
check('the caveat is always there', marked.caveat,
  'A day with no mark means no mark was made. It does not mean the thing went undone, since plenty gets done without anybody tapping anything.');

const oneSilentWeek = summarizeChecks(inputs({
  checks: [{ id: 'a', name: 'Water', cadence: 'daily' }],
  marks: [{ checkId: 'a', date: '2026-09-12' }],
}));
check('a week with no marks stays null rather than becoming zero', oneSilentWeek.weeks[1].value, null);
check('and the note says so', oneSilentWeek.gapNote,
  '1 of these 2 weeks has nothing to read: nothing was marked in them.');

// ---------------------------------------------------------------------------
// 7. Routine walks.
// ---------------------------------------------------------------------------
const noRuns = summarizeRoutines(inputs());
check('no walks says the next one fills it in', noRuns.headline,
  'No routine walks recorded in this range. This fills in from the next one you walk.');
check('no walks means no share to read', noRuns.finishedShare, null);
check('and no note, since nothing has stalled twice', noRuns.note, null);

function walk(over) {
  return {
    routineId: 'r1',
    routineName: 'Morning',
    date: '2026-09-20',
    completed: false,
    stepsDone: 2,
    stepsTotal: 5,
    stoppedOnStep: 'Take the tablets',
    ...over,
  };
}

const allFinished = summarizeRoutines(inputs({
  runs: [
    walk({ date: '2026-09-21', completed: true, stoppedOnStep: null, stepsDone: 5 }),
    walk({ date: '2026-09-22', completed: true, stoppedOnStep: null, stepsDone: 5 }),
  ],
}));
check('every walk finished', allFinished.headline, '2 walks, every one of them finished.');
check('the routine line says the same', allFinished.standings[0].line, '2 walks, all finished.');
check('a finished walk stalls nowhere', allFinished.stalls.length, 0);

const someStalled = summarizeRoutines(inputs({
  runs: [
    walk({ date: '2026-09-21', completed: true, stoppedOnStep: null, stepsDone: 5 }),
    walk({ date: '2026-09-22' }),
    walk({ date: '2026-09-23' }),
    walk({ date: '2026-09-19', stoppedOnStep: 'Pack the bag' }),
  ],
}));
check('some finished, some not', someStalled.headline, '4 walks, 1 of them finished to the last step.');
check('a step stopped on twice is a stall', someStalled.stalls.length, 1);
check('and it says how many times', someStalled.stalls[0].line, 'Morning stopped here 2 times.');
check('a step stopped on once is not', someStalled.stalls.every((stall) => stall.times >= 2), true);
check('the note comes with the stall', someStalled.note,
  'A step things stop on more than once is worth a look: it may be in the wrong place in the order, or it may be two steps wearing one label.');
check('the quiet week is still null', someStalled.weeks[0].value, null);

const noneFinished = summarizeRoutines(inputs({ runs: [walk({ date: '2026-09-22' })] }));
check('one walk, none finished', noneFinished.standings[0].line, '1 walk, none of them reached the last step.');
check('one walk on its own is not a stall yet', noneFinished.stalls.length, 0);

// ---------------------------------------------------------------------------
// 8. Captures.
// ---------------------------------------------------------------------------
check('no values has no middle', middleValue([]), null);
check('one value is its own middle', middleValue([4]), 4);
check('an odd count takes the middle one', middleValue([9, 1, 5]), 5);
check('an even count splits the two middles', middleValue([1, 2, 4, 9]), 3);
check('one long wait cannot drag the middle', middleValue([0, 1, 1, 2, 400]), 1);

const noCaptures = summarizeCaptures(inputs());
check('nothing captured', noCaptures.headline, 'Nothing captured in this range.');
check('and no wait to describe', noCaptures.note, null);

const captured = summarizeCaptures(inputs({
  captures: [
    { date: '2026-09-21', sortedDate: '2026-09-21', doneDate: null, waiting: false },
    { date: '2026-09-22', sortedDate: '2026-09-24', doneDate: null, waiting: false },
    { date: '2026-09-20', sortedDate: null, doneDate: null, waiting: true },
    { date: '2026-09-12', sortedDate: null, doneDate: '2026-09-13', waiting: false },
  ],
}));
check('what was captured and what got sorted', captured.headline, '4 notes captured, 3 of them sorted.');
check('a note finished without being sorted still counts as sorted', captured.sorted, 3);
check('one still waiting', captured.stillWaiting, 1);
check('the typical wait is the middle of the two', captured.typicalWaitDays, 1);
check('and it is said in days', captured.note, 'A note usually waits 1.0 day before it gets sorted.');

const sameDay = summarizeCaptures(inputs({
  captures: [
    { date: '2026-09-21', sortedDate: '2026-09-21', doneDate: null, waiting: false },
    { date: '2026-09-12', sortedDate: '2026-09-12', doneDate: null, waiting: false },
  ],
}));
check('sorted the same day reads as the same day', sameDay.note, 'A note usually waits the same day before it gets sorted.');

const longWaiting = summarizeCaptures(inputs({
  captures: [{ date: '2026-09-01', sortedDate: null, doneDate: null, waiting: true }],
}));
check('a note waiting a fortnight is called out', longWaiting.note,
  'The oldest note still waiting has been there 22 days.');
check('a note captured before the range still counts as waiting', longWaiting.stillWaiting, 1);
check('but it is not counted as captured in the range', longWaiting.captured, 0);

// ---------------------------------------------------------------------------
// 9. Upkeep, on time against late.
// ---------------------------------------------------------------------------
check(
  'nothing set a date, so nothing is called late',
  describeUpkeepDoing({ itemName: 'Boiler', doneOn: '2026-09-20', dueOn: null }),
  {
    itemName: 'Boiler',
    doneOn: '2026-09-20',
    daysLate: null,
    line: 'Done Sep 20. Nothing had set a date for it, so there is nothing to call it early or late against.',
  },
);
check(
  'done on the day',
  describeUpkeepDoing({ itemName: 'Boiler', doneOn: '2026-09-20', dueOn: '2026-09-20' }).line,
  'Done Sep 20, on the day it was due.',
);
check(
  'done early',
  describeUpkeepDoing({ itemName: 'Boiler', doneOn: '2026-09-18', dueOn: '2026-09-20' }).line,
  'Done Sep 18, 2 days before it was due.',
);
check(
  'done a day late',
  describeUpkeepDoing({ itemName: 'Boiler', doneOn: '2026-09-21', dueOn: '2026-09-20' }).line,
  'Done Sep 21, 1 day after it was due.',
);
check(
  'done well late',
  describeUpkeepDoing({ itemName: 'Boiler', doneOn: '2026-09-23', dueOn: '2026-09-01' }).line,
  'Done Sep 23, 22 days after it was due.',
);

check('an empty upkeep list says so', describeUpkeepStandingLine(NO_STANDING), 'Nothing on the upkeep list yet.');
check(
  'everything settled',
  describeUpkeepStandingLine({ overdue: 0, dueSoon: 0, settled: 4, worstName: null, worstDaysLate: null }),
  'All 4 items on the upkeep list are settled for now.',
);
check(
  'past due and due soon together',
  describeUpkeepStandingLine({ overdue: 2, dueSoon: 1, settled: 3, worstName: 'Boiler', worstDaysLate: 30 }),
  '2 past due and 1 due soon out of 6. Boiler is furthest behind, by 30 days.',
);
check(
  'due soon on its own',
  describeUpkeepStandingLine({ overdue: 0, dueSoon: 1, settled: 3, worstName: null, worstDaysLate: null }),
  '1 due soon out of 4.',
);

const noDoings = summarizeUpkeepTimeliness(inputs());
check('nothing done in the range', noDoings.headline,
  'Nothing marked done in this range, so there is nothing to compare against a due date yet.');
check('and the history note is always there', noDoings.historyNote,
  'Until 2026-09-23 the app kept only the last time each upkeep item was done, so this counts from when it started keeping every one of them.');

const doings = summarizeUpkeepTimeliness(inputs({
  upkeepDoings: [
    { itemName: 'Boiler', doneOn: '2026-09-21', dueOn: '2026-09-20' },
    { itemName: 'Filters', doneOn: '2026-09-18', dueOn: '2026-09-20' },
    { itemName: 'Gutters', doneOn: '2026-09-12', dueOn: null },
  ],
  upkeepStanding: { overdue: 1, dueSoon: 0, settled: 2, worstName: 'Roof', worstDaysLate: 9 },
}));
check('one on time, one late, one that could not be told', doings.headline,
  '3 things done: 1 by the date it was due, 1 after. 1 had no due date to be measured against.');
check('the undated one is counted nowhere but its own column', doings.couldNotTell, 1);
check('how late the late one was', doings.averageDaysLate, 1);
check('newest first', doings.recent[0].itemName, 'Boiler');
check('and the standing line comes from the list as it is now', doings.standingLine,
  '1 past due out of 3. Roof is furthest behind, by 9 days.');

const allOnTime = summarizeUpkeepTimeliness(inputs({
  upkeepDoings: [
    { itemName: 'Boiler', doneOn: '2026-09-21', dueOn: '2026-09-22' },
    { itemName: 'Filters', doneOn: '2026-09-18', dueOn: '2026-09-20' },
  ],
}));
check('everything by its date', allOnTime.headline, '2 things done, every one of them by the date it was due.');
check('and nothing late to average', allOnTime.averageDaysLate, null);

// ---------------------------------------------------------------------------
// 10. Work.
// ---------------------------------------------------------------------------
check('one week is no direction', drainDirection([4]), null);
check('three weeks is still no direction', drainDirection([4, 4, 5]), null);
check('four flat weeks read as flat', drainDirection([3, 3, 3, 3]), 'Roughly the same across the range.');
check('a small wobble is not a trend', drainDirection([3, 3, 3.4, 3.4]), 'Roughly the same across the range.');
check(
  'drain climbing',
  drainDirection([2, 2, 4, 4]),
  'Work has been taking more out of you lately: 2.0 earlier in the range against 4.0 more recently.',
);
check(
  'drain easing',
  drainDirection([5, 5, 3, 3]),
  'Work has been taking less out of you lately: 5.0 earlier in the range against 3.0 more recently.',
);

const noWork = summarizeWork(inputs());
check('no check-ins says where one lives', noWork.headline,
  'No work check-ins answered in this range. One takes a few seconds on the Life tab.');
check('and there is no average to read', noWork.averageDrain, null);
checkTrue('every week stays null', noWork.weeks.every((week) => week.value === null));
check('with the note saying why', noWork.gapNote,
  '2 of these 2 weeks have nothing to read: no check-in was answered for them.');

const work = summarizeWork(inputs({
  workCheckins: [
    { weekOf: '2026-09-14', autonomy: 3, competence: 4, relatedness: 2, drain: 4 },
    { weekOf: '2026-09-21', autonomy: 4, competence: 4, relatedness: 3, drain: 2 },
  ],
}));
check('two weeks answered, with the drain average', work.headline,
  '2 weeks answered. What work took out of you averaged 3.0 out of 5.');
check('the three needs read together', work.needsLine,
  'Say over how you work 3.5, being good at it 4.0, the people 2.5.');
check('two weeks is not enough for a direction', work.drainDirection, null);
check('the drain is what the weekly rows carry', [work.weeks[0].value, work.weeks[1].value], [4, 2]);
check('the caveat is always there', work.caveat,
  'Four answers a week on a scale of one to five. There is no score here and nothing being graded. What it took out of you is the one worth putting beside your flares, since that is the answer that might line up with them.');

// ---------------------------------------------------------------------------
// 11. The whole lens, and the Home card.
// ---------------------------------------------------------------------------
const empty = summarizeKeepingUp(inputs());
check('nothing anywhere has nothing to show', empty.hasAnything, false);

const upkeepOnly = summarizeKeepingUp(inputs({
  upkeepStanding: { overdue: 1, dueSoon: 0, settled: 1, worstName: 'Boiler', worstDaysLate: 4 },
}));
checkTrue('an upkeep list on its own is enough to show the lens', upkeepOnly.hasAnything);

const full = summarizeKeepingUp(inputs({
  checks: [{ id: 'a', name: 'Water', cadence: 'daily' }, { id: 'b', name: 'Stretch', cadence: 'daily' }],
  marks: [
    { checkId: 'a', date: '2026-09-23' },
    { checkId: 'a', date: '2026-09-22' },
    { checkId: 'a', date: '2026-09-21' },
    { checkId: 'b', date: '2026-09-22' },
    { checkId: 'b', date: '2026-09-21' },
  ],
  captures: [{ date: '2026-09-20', sortedDate: null, doneDate: null, waiting: true }],
  upkeepDoings: [{ itemName: 'Boiler', doneOn: '2026-09-21', dueOn: '2026-09-14' }],
}));
checkTrue('something in it shows the lens', full.hasAnything);

const home = describeKeepingUpHome(full);
check('the longest run leads', home.streakName, 'Water');
check('with its length', home.streakDays, 3);
check('and the others are counted', home.line, 'Water, and 1 other thing going as well.');
check('the caption carries what is waiting', home.caption,
  '1 capture still to sort, 1 upkeep thing done late.');

const oneRun = describeKeepingUpHome(summarizeKeepingUp(inputs({
  checks: [{ id: 'a', name: 'Water', cadence: 'daily' }],
  marks: [{ checkId: 'a', date: '2026-09-23' }, { checkId: 'a', date: '2026-09-22' }],
})));
check('one thing running on its own', oneRun.line, 'Water, kept up every day.');
check('and nothing waiting means no caption', oneRun.caption, null);

const nothingRunning = describeKeepingUpHome(summarizeKeepingUp(inputs({
  checks: [{ id: 'a', name: 'Water', cadence: 'daily' }],
})));
check('set up but nothing going invites one mark', nothingRunning.line,
  'Nothing on a run at the moment. One mark today starts one.');
check('and there is no number to lead with', nothingRunning.streakDays, null);

const nothingSetUp = describeKeepingUpHome(empty);
check('nothing set up points at the Life tab', nothingSetUp.line,
  'Set up something to check on the Life tab and this starts keeping count.');

// ---------------------------------------------------------------------------
// 12. Nothing here scores anybody.
// ---------------------------------------------------------------------------
const everySentence = [
  full.checks.headline,
  full.checks.gapNote,
  full.checks.caveat,
  ...full.checks.standings.map((standing) => standing.line),
  someStalled.headline,
  someStalled.note,
  ...someStalled.standings.map((standing) => standing.line),
  ...someStalled.stalls.map((stall) => stall.line),
  captured.headline,
  captured.note,
  captured.gapNote,
  doings.headline,
  doings.standingLine,
  doings.historyNote,
  ...doings.recent.map((line) => line.line),
  work.headline,
  work.needsLine,
  work.caveat,
  drainDirection([2, 2, 4, 4]),
  home.line,
  home.caption,
  nothingRunning.line,
  nothingSetUp.line,
].filter(Boolean);

const forbidden = [
  'you failed',
  'you should have',
  'caused',
  'because of',
  'proves',
  'slacking',
  'lazy',
  'well done',
  'good job',
  'keep it up',
  'you are behind',
  'bad week',
];
for (const sentence of everySentence) {
  for (const word of forbidden) {
    checkTrue(`"${word}" stays out of "${sentence.slice(0, 44)}"`, !sentence.toLowerCase().includes(word));
  }
}

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
