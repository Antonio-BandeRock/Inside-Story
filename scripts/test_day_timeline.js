// Checks the one Today timeline in lib/dayTimeline.ts: what goes on it,
// which things count as past their time, where a routine's reminder lands,
// how a night's sleep spans, how cards pack into rows, and that the strip
// opens with Now in the middle. Since Phase 2 also the phone calendar,
// workouts and steps on the strip (B2, B9), the Now and Next line (B3),
// minutes and whether the day fits (B4), how full today is (B7), what
// moves to tomorrow (B8, lib/moveToTomorrow.ts) and the routine walk
// notification's words (lib/routineWalkNotice.ts).
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, stubs = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const {
  buildDayTimeline,
  layoutTimeline,
  initialScrollX,
  dayLabel,
  clockLabel,
  describeDuration,
  describeOverdue,
  describeNext,
  describeHowFull,
  describeDayFit,
  describeRoutineLength,
  describeFilledIn,
  routineTotalMinutes,
  statusLabel,
  localDayOf,
  TIMELINE_CARD_WIDTH,
  TIMELINE_PX_PER_HOUR,
} = load('lib/dayTimeline.ts');

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

// Saturday 2026-09-26, 2:30pm local.
const now = new Date(2026, 8, 26, 14, 30).getTime();
const local = (y, m, d, h, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

const empty = { now, schedule: [], routines: [], runs: [], checkins: [], sleep: [], dated: [] };
const row = (id, scheduledFor, extra = {}) => ({
  id,
  scheduledFor,
  itemType: 'meal',
  mealType: 'lunch',
  title: 'Lentil soup',
  status: 'planned',
  providerName: null,
  location: null,
  treatmentName: null,
  ...extra,
});

check('today is the local day', buildDayTimeline(empty).today, '2026-09-26');
check('nothing logged is an empty strip', buildDayTimeline(empty).items.length, 0);

{
  const view = buildDayTimeline({
    ...empty,
    schedule: [
      row('a', '2026-09-26T12:00'),
      row('b', '2026-09-26T18:00'),
      row('c', '2026-09-25T08:00', { status: 'logged' }),
      row('d', '2026-09-25T19:00'),
      row('e', '2026-09-24T19:00'),
      row('f', '2026-09-26T08:00', { status: 'skipped' }),
      row('g', '2026-09-26T09:00', { itemType: 'prescription', treatmentName: 'Levothyroxine', title: 'Dose' }),
      row('h', '2026-10-05T09:00'),
    ],
  });
  const status = (id) => view.items.find((item) => item.id === `schedule:${id}`)?.status;
  check('a planned meal past its time today is overdue', status('a'), 'overdue');
  check('a meal still ahead is planned', status('b'), 'planned');
  check('a logged meal is done', status('c'), 'done');
  check('yesterday unmarked is overdue', status('d'), 'overdue');
  check('two days back unmarked is left on the strip, not gathered', status('e'), 'unmarked');
  check('skipped stays skipped', status('f'), 'skipped');
  check('a dose takes the treatment name', view.items.find((item) => item.id === 'schedule:g').title, 'Levothyroxine');
  check('a dose goes to Meds', view.items.find((item) => item.id === 'schedule:g').route.params.openScheduleLens, 'meds');
  check('past the range is left off', status('h'), undefined);
  check(
    'overdue gathers oldest first',
    view.overdue.map((item) => item.id),
    ['schedule:d', 'schedule:g', 'schedule:a'],
  );
  check('items are in time order', view.items.map((item) => item.start).every((v, i, all) => i === 0 || all[i - 1] <= v), true);
}

{
  const view = buildDayTimeline({
    ...empty,
    routines: [
      { id: 'r1', name: 'Morning', reminderTime: '07:30', reminderDays: [], reminderOn: true },
      { id: 'r2', name: 'Weekdays only', reminderTime: '09:00', reminderDays: [1, 2, 3, 4, 5], reminderOn: true },
      { id: 'r3', name: 'No reminder', reminderTime: null, reminderDays: [], reminderOn: false },
    ],
    runs: [
      { id: 'x1', routineId: 'r1', routineName: 'Morning', completedAt: local(2026, 9, 26, 7, 45) },
      { id: 'x2', routineId: 'r3', routineName: 'No reminder', completedAt: local(2026, 9, 25, 21, 10) },
      { id: 'x3', routineId: 'r1', routineName: 'Morning', completedAt: null },
    ],
  });
  const morning = view.items.filter((item) => item.title === 'Morning');
  check('a daily routine lands on every day of the strip', morning.length, 7);
  check('today, finished', morning.find((item) => item.day === '2026-09-26').status, 'done');
  check('today says when it was finished', morning.find((item) => item.day === '2026-09-26').caption, 'Finished at 7:45am');
  check('yesterday, not finished, is overdue', morning.find((item) => item.day === '2026-09-25').status, 'overdue');
  check('tomorrow is planned', morning.find((item) => item.day === '2026-09-27').status, 'planned');
  check(
    'a weekday routine skips Saturday and Sunday',
    view.items.filter((item) => item.title === 'Weekdays only').map((item) => item.day),
    ['2026-09-23', '2026-09-24', '2026-09-25', '2026-09-28', '2026-09-29'],
  );
  const walked = view.items.find((item) => item.title === 'No reminder');
  check('a routine walked with no reminder sits at the time it was finished', clockLabel(walked.start), '9:10pm');
  check('and is done', walked.status, 'done');
}

{
  const view = buildDayTimeline({
    ...empty,
    checkins: [
      { id: 'k1', loggedAt: local(2026, 9, 26, 10), checkinType: 'flare', valence: 'negative', severity: 2, tags: ['Joint pain'] },
      { id: 'k2', loggedAt: local(2026, 9, 25, 13), checkinType: 'post_meal', valence: 'positive', severity: null, tags: [] },
    ],
    sleep: [{ id: 's1', startedAt: local(2026, 9, 25, 23, 10), endedAt: local(2026, 9, 26, 6, 40) }],
  });
  const flare = view.items.find((item) => item.id === 'checkin:k1');
  check('a flare is its own kind', flare.kind, 'flare');
  check('a flare says how bad and what', flare.caption, 'Moderate · Joint pain');
  check('a flare opens Signals on Flares', flare.route.params.openSignalsLens, 'flares');
  check('a check-in with no tags says the feeling', view.items.find((item) => item.id === 'checkin:k2').caption, 'Felt good');
  check('a check-in is a record, never overdue', flare.status, 'record');
  const night = view.items.find((item) => item.kind === 'sleep');
  check('a night spans', night.end - night.start, 450 * 60000);
  check('a night says its length', night.caption, '7 h 30 min, until 6:40am');
}

{
  const view = buildDayTimeline({
    ...empty,
    dated: [
      { kind: 'bill', sourceId: 'b1', title: 'Electricity', detail: '$84.00', dueOn: '2026-09-26', tab: 'life', lens: 'finances' },
      { kind: 'upkeep', sourceId: 'u1', title: 'Furnace filter', detail: null, dueOn: '2026-08-01', tab: 'life', lens: 'upkeep' },
      { kind: 'countdown', sourceId: 'c1', title: 'Tomatoes ripe', detail: null, dueOn: '2026-09-28', tab: 'garden', lens: 'daysUntil' },
      { kind: 'countdown', sourceId: 'c2', title: 'Trip', detail: null, dueOn: '2026-09-24', tab: 'life', lens: 'daysUntil' },
    ],
  });
  check('a bill due today is any time today', view.anyTime.map((item) => item.title), ['Electricity']);
  check('an upkeep long past is gathered even off the strip', view.overdue.map((item) => item.title), ['Furnace filter']);
  check('and is not drawn on the strip', view.items.some((item) => item.title === 'Furnace filter'), false);
  check('a counter ahead goes to Garden', view.items.find((item) => item.title === 'Tomatoes ripe').route, {
    pathname: '/garden',
    params: { openGardenLens: 'daysUntil' },
  });
  check('a counter whose day has gone is a record, not overdue', view.items.find((item) => item.title === 'Trip').status, 'record');
}

{
  const view = buildDayTimeline({
    ...empty,
    schedule: [row('a', '2026-09-26T12:00'), row('b', '2026-09-26T12:30'), row('c', '2026-09-26T16:00')],
    dated: [{ kind: 'bill', sourceId: 'b1', title: 'Rent', detail: null, dueOn: '2026-09-26', tab: 'life', lens: 'finances' }],
  });
  const layout = layoutTimeline(view, now);
  check('seven days wide', layout.width, 7 * 24 * TIMELINE_PX_PER_HOUR);
  check('an all-day row comes first', layout.hasAllDayRow, true);
  const lane = (id) => layout.cards.find((card) => card.item.id === `schedule:${id}`).lane;
  check('the first meal takes the first timed row', lane('a'), 1);
  check('a meal 30 minutes later moves down', lane('b'), 2);
  check('a later meal goes back up', lane('c'), 1);
  check('three rows in all', layout.lanes, 3);
  check('Now sits at 3 days and 14.5 hours', layout.nowX, (3 * 24 + 14.5) * TIMELINE_PX_PER_HOUR);
  check('seven day marks', layout.dayMarks.map((mark) => mark.label)[3], 'Today');
  check('a label every three hours', layout.ticks.filter((tick) => tick.label).length, 7 * 7);
  check('card width floor', layout.cards[0].width, TIMELINE_CARD_WIDTH);

  check('opens with Now in the middle', initialScrollX(layout.nowX, 400, layout.width), layout.nowX - 200);
  check('never before the start', initialScrollX(50, 400, 5000), 0);
  check('never past the end', initialScrollX(4900, 400, 5000), 4600);
}

check('day label yesterday', dayLabel('2026-09-25', '2026-09-26'), 'Yesterday');
check('day label tomorrow', dayLabel('2026-09-27', '2026-09-26'), 'Tomorrow');
check('day label further', dayLabel('2026-09-29', '2026-09-26'), 'Tuesday 29 Sep');
check('clock at noon', clockLabel(new Date(2026, 8, 26, 12).getTime()), '12pm');
check('duration under an hour', describeDuration(45), '45 min');
check('overdue one', describeOverdue(1), '1 thing past its time, not marked yet');
check('overdue none', describeOverdue(0), null);
check('planned carries no word', statusLabel('planned'), null);
check('a DST day still has its own date', localDayOf(new Date(2026, 10, 1, 12).getTime()), '2026-11-01');

// ---- Phase 2: B2 to B9 ----

{
  const view = buildDayTimeline({
    ...empty,
    schedule: [
      row('lunch', '2026-09-26T14:00', { status: 'logged' }),
      row('walk', '2026-09-26T15:00', { itemType: 'reminder', title: 'Walk the dog' }),
      row('dinner', '2026-09-26T18:00'),
      row('dose', '2026-09-26T21:00', { itemType: 'supplement', treatmentName: 'Magnesium', title: 'Dose' }),
    ],
    scheduleMinutes: { 'schedule:walk': 30, walk: 30 },
    calendar: [
      { id: 'c1', title: 'Dentist', startDate: local(2026, 9, 26, 14, 15), endDate: local(2026, 9, 26, 14, 45), allDay: false, location: null, calendarTitle: 'Home' },
      { id: 'c2', title: 'Market day', startDate: '2026-09-26', endDate: '2026-09-27', allDay: true, location: null, calendarTitle: 'Home' },
    ],
    workouts: [{ id: 'w1', startedAt: local(2026, 9, 26, 7), endedAt: local(2026, 9, 26, 7, 35), name: 'Walking', minutes: 35 }],
    steps: [{ date: '2026-09-26', steps: 8432 }],
  });
  const find = (kind) => view.items.filter((item) => item.kind === kind);
  check('a timed calendar event is on the strip', find('calendar').some((item) => item.title === 'Dentist'), true);
  check('an all-day calendar event is in any time today', view.anyTime.some((item) => item.title === 'Market day'), true);
  check('a workout is a record', find('workout')[0]?.status, 'record');
  check('steps read with a thousands comma', find('steps')[0]?.title, '8,432 steps');
  check('steps are not in any time today', view.anyTime.some((item) => item.kind === 'steps'), false);

  const next = describeNext(view, now);
  check('the calendar event on now is named', next, 'Now: Dentist, until 2:45pm. Next: Walk the dog in 30 minutes, at 3pm.');
  const later = describeNext(view, new Date(2026, 8, 26, 14, 50).getTime());
  check('next within the hour says the minutes', later, 'Next: Walk the dog in 10 minutes, at 3pm.');

  const full = describeHowFull(view, now);
  check('how full names the meals', full.includes('2 meals'), true);
  check('how full says how many are still ahead', /still ahead\.$/.test(full), true);
  check('how full never counts records', full.includes('step'), false);

  const fit = describeDayFit(view, now);
  check('fit counts what is still ahead', fit?.startsWith('Still ahead today: 3 timed things'), true);
  check('fit says how many have minutes', fit?.includes('1 with minutes set'), true);
}

check('an empty day says so', describeHowFull(buildDayTimeline(empty), now), 'Nothing is on today yet.');
check('nothing ahead has no fit line', describeDayFit(buildDayTimeline(empty), now), null);
check('nothing timed has no next line', describeNext(buildDayTimeline(empty), now), null);

{
  const steps = [{ minutes: 10 }, { minutes: 15 }, { minutes: null }, { minutes: null }];
  check('routine total adds what is known', routineTotalMinutes(steps), 25);
  check('routine total is null with nothing known', routineTotalMinutes([{ minutes: null }]), null);
  check('routine length names what is not counted', describeRoutineLength(steps), 'About 25 minutes, not counting 2 steps with no minutes set');
  check('routine length with nothing known', describeRoutineLength([{ minutes: null }]), null);
}

check(
  'filled in from Health Connect',
  describeFilledIn({ sleepMinutes: 430, steps: 8432, workouts: [{ name: 'Walking', minutes: 35 }] }),
  'Filled in from Health Connect: slept 7 h 10 min, 8,432 steps and walking, 35 min.',
);
check('nothing filled in says nothing', describeFilledIn({ sleepMinutes: null, steps: null, workouts: [] }), null);

// B8: what moves to tomorrow.
{
  const { planMoveToTomorrow, describeMovePlan, sameTimeTomorrow } = load('lib/moveToTomorrow.ts');
  const cand = (id, itemType, scheduledFor, status = 'planned') => ({ id, itemType, title: id, status, scheduledFor });
  const plan = planMoveToTomorrow(
    [
      cand('breakfast', 'meal', '2026-09-26T08:00'),
      cand('dinner', 'meal', '2026-09-26T18:00'),
      cand('eaten', 'meal', '2026-09-26T19:00', 'logged'),
      cand('call', 'reminder', '2026-09-26T16:00'),
      cand('water', 'garden', '2026-09-26T17:30'),
      cand('mag', 'supplement', '2026-09-26T21:00'),
      cand('gp', 'appointment', '2026-09-26T16:30'),
      cand('monday', 'reminder', '2026-09-28T09:00'),
    ],
    now,
  );
  check('a meal already past its time is not moved', plan.replan.some((entry) => entry.id === 'breakfast'), false);
  check('a meal still ahead is replanned for tomorrow', plan.replan, [{ id: 'dinner', scheduledFor: '2026-09-27T18:00', title: 'dinner' }]);
  check('a logged meal stays', plan.replan.some((entry) => entry.id === 'eaten'), false);
  check('reminders and garden tasks move', plan.move.map((entry) => entry.id), ['call', 'water']);
  check('a dose and an appointment stay', plan.stay.map((entry) => entry.kind), ['dose', 'appointment']);
  check('another day is left alone', [...plan.move, ...plan.replan].some((entry) => entry.id === 'monday'), false);
  check('same time tomorrow across a month end', sameTimeTomorrow('2026-09-30T07:15'), '2026-10-01T07:15');
  const words = describeMovePlan(plan);
  check('the plan says the meal stays skipped', words.includes('stays in the record as skipped'), true);
  check('the plan names what stays', words.includes('1 dose and 1 appointment stay where they are'), true);
  check('nothing to move says nothing', describeMovePlan({ move: [], replan: [], stay: [] }), null);
}

// B3: the routine walk notification's words.
{
  const { routineWalkNotice } = load('lib/routineWalkNotice.ts', {
    'expo-notifications': {},
    'react-native': { Platform: { OS: 'android' } },
    './desktop/bridge': { isDesktopApp: () => false },
  });
  const notice = routineWalkNotice({
    routineName: 'Morning',
    position: 1,
    total: 6,
    stepText: 'Take the levothyroxine with water',
    stepMinutes: 5,
    stepStartedAt: new Date(2026, 8, 26, 7, 5),
  });
  check('notice title', notice.title, 'Morning: step 2 of 6');
  check('notice body', notice.body, 'Take the levothyroxine with water. Up since 7:05 am, about 5 minutes.');
}

// No sentence this module writes may use a dash in place of punctuation, or
// a word that scolds.
for (const file of ['lib/dayTimeline.ts', 'lib/moveToTomorrow.ts', 'lib/routineWalkNotice.ts']) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  check(`no em or en dashes in ${file}`, /[–—]/.test(source), false);
  const strings = (source.match(/'[^'\n]*'|`[^`\n]*`/g) || []).join(' ').toLowerCase();
  for (const word of ['missed', 'failed', 'forgot', 'behind', 'well done', 'great job', 'overwhelm', 'too much', 'too busy']) {
    check(`no "${word}" in any string of ${file}`, strings.includes(word), false);
  }
}

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log('\nAll day timeline checks passed.');
