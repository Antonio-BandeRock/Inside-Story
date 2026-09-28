/* global __dirname */
// Checks lib/exercisePlan.ts (H11 part 3, Schedules > Exercise): drafts,
// which days a plan lands on, how a day reads marked and unmarked, when a
// reminder fires, the Health Connect exercise type, what removing a plan
// leaves behind, and that no sentence it or the lens writes passes a
// verdict or keeps count of days in a row.
//
// USAGE
//   node scripts/test_exercise_plan.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

function load(rel) {
  const file = path.join(ROOT, rel);
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod.require = (request) => {
    if (request.startsWith('./')) return load(path.join(path.dirname(rel), request + '.ts'));
    return Module.prototype.require.call(mod, request);
  };
  mod._compile(out, file);
  return mod.exports;
}

const P = load('lib/exercisePlan.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) return;
  failures += 1;
  console.log('FAIL  ' + label);
}
const FORBIDDEN =
  /\b(should|good|bad|better|worse|great|well done|failed|missed|behind|streak|only|real|genuine|genuinely|keep it up|on track)\b|[–—]| -- /i;
let swept = 0;
function clean(text, label) {
  if (text == null) return;
  swept += 1;
  const hit = FORBIDDEN.exec(text);
  ok(!hit, `${label}: "${hit ? hit[0] : ''}" in "${text}"`);
}

function plan(extra) {
  return {
    id: 'p1',
    workoutId: 'w1',
    activity: null,
    startsOn: '2026-09-28',
    atTime: '07:00',
    minutes: 30,
    repeat: { type: 'none' },
    remind: true,
    note: null,
    archivedAt: null,
    ...extra,
  };
}
const names = new Map([['w1', 'Morning strength']]);

// 1. Drafts.
const blank = P.blankPlanDraft('2026-09-28');
ok(P.planDraftProblem(blank) === 'Choose a workout, or type the activity.', 'blank draft asks for what');
ok(P.planDraftProblem({ ...blank, activity: 'Walk', remind: true, atTime: null }).startsWith('A reminder needs a time'), 'reminder needs a time');
ok(P.planDraftProblem({ ...blank, activity: 'Walk', remind: false }) === null, 'activity with no time and no reminder saves');
ok(P.planDraftProblem({ ...blank, activity: 'Walk', remind: false, minutes: '0' }) !== null, 'zero minutes refused');
ok(P.planDraftProblem({ ...blank, activity: 'Walk', remind: false, startsOn: '28/09' }) !== null, 'bad date refused');
ok(P.parseMinutes('45') === 45 && P.parseMinutes('') === null && P.parseMinutes('601') === null && P.parseMinutes('2.5') === null, 'minutes parse');
const round = P.draftFromPlan(plan({ minutes: 20, note: 'x' }));
ok(round.minutes === '20' && round.note === 'x' && round.workoutId === 'w1', 'draft from plan');

// 2. Titles and dates.
ok(P.planTitle(plan(), names) === 'Morning strength', 'workout title');
ok(P.planTitle(plan({ workoutId: 'gone' }), names) === P.MISSING_WORKOUT_TITLE, 'missing workout keeps a title');
ok(P.planTitle(plan({ workoutId: null, activity: ' Swim ' }), names) === 'Swim', 'activity title trimmed');
ok(P.dayLabel('2026-09-28', '2026-09-28') === 'Today', 'today');
ok(P.dayLabel('2026-09-29', '2026-09-28') === 'Tomorrow', 'tomorrow');
ok(P.dayLabel('2026-09-27', '2026-09-28') === 'Yesterday', 'yesterday');
ok(P.dayLabel('2026-09-30', '2026-09-28') === 'Wednesday 30 Sep', `named day: ${P.dayLabel('2026-09-30', '2026-09-28')}`);
ok(P.describePlan(plan()) === 'On Mon 28 Sep at 7:00 AM, about 30 minutes', `describe once: ${P.describePlan(plan())}`);
ok(P.describePlan(plan({ atTime: null, minutes: null })) === 'On Mon 28 Sep, any time of day', 'describe any time');

// 3. Which days.
const daily = plan({ repeat: { type: 'daily', endType: 'indefinite' } });
const dates = P.planDatesBetween(daily, '2026-09-28', '2026-10-04');
ok(dates.length === 7 && dates[0] === '2026-09-28' && dates[6] === '2026-10-04', `daily dates ${dates.join()}`);
ok(P.planDatesBetween(daily, '2026-09-01', '2026-09-27').length === 0, 'nothing before the first day');
const weekly = plan({ id: 'p2', startsOn: '2026-09-28', repeat: { type: 'weekly', endType: 'indefinite', interval: 1, weekdays: [1, 4] } });
const weeklyDates = P.planDatesBetween(weekly, '2026-09-28', '2026-10-11');
ok(weeklyDates.join() === '2026-09-28,2026-10-01,2026-10-05,2026-10-08', `weekly dates ${weeklyDates.join()}`);
const counted = plan({ id: 'p3', repeat: { type: 'daily', endType: 'count', count: 3 } });
ok(P.planDatesBetween(counted, '2026-09-28', '2026-10-10').length === 3, 'a counted repeat stops');

// 4. Days and marks.
const walk = plan({ id: 'walk', workoutId: null, activity: 'Walk', atTime: null, minutes: null, repeat: { type: 'daily', endType: 'indefinite' } });
const marks = [
  { planId: 'p1', onDate: '2026-09-28', status: 'done', workoutSessionId: 's1', exerciseLogId: 'l1', markedAt: 'x' },
  { planId: 'walk', onDate: '2026-09-27', status: 'skipped', workoutSessionId: null, exerciseLogId: null, markedAt: 'x' },
];
const days = P.planDays([plan(), walk], marks, names, '2026-09-26', '2026-09-29');
ok(days.map((d) => d.date).join() === '2026-09-28,2026-09-29', `days: ${days.map((d) => d.date).join()}`);
const today = days[0];
ok(today.entries[0].plan.id === 'p1' && today.entries[1].plan.id === 'walk', 'timed entries before untimed');
ok(P.entryStatusLine(today.entries[0], '2026-09-28') === 'Done, from the workout player', 'done from player');
ok(P.entryStatusLine(today.entries[1], '2026-09-28') === 'Planned for today, any time', 'today untimed');
ok(P.entryStatusLine(days[1].entries[0], '2026-09-28') === 'Planned, any time of day', 'future untimed');
const past = P.planDays([walk], marks, names, '2026-09-28', '2026-09-30');
ok(P.entryStatusLine(past[0].entries[0], '2026-09-30') === 'Nothing marked', 'an unmarked past day is nothing marked, never missed');
const archived = { ...walk, startsOn: '2026-09-26', archivedAt: '2026-09-28T00:00:00Z' };
const archivedDays = P.planDays([archived], marks, names, '2026-09-26', '2026-10-05');
ok(archivedDays.length === 1 && archivedDays[0].date === '2026-09-27', 'an archived plan shows on its marked days and nowhere else');

// 5. Reminders.
const now = new Date(2026, 8, 28, 8, 0, 0);
const moments = P.reminderMoments(daily, marks, now, 3);
ok(moments.map((m) => m.date).join() === '2026-09-29,2026-09-30,2026-10-01', `moments ${moments.map((m) => m.date).join()}`);
ok(moments[0].fireAt.getHours() === 7 && moments[0].fireAt.getMinutes() === 0, 'fires at the planned time');
const early = new Date(2026, 8, 28, 6, 0, 0);
ok(P.reminderMoments(plan({ repeat: { type: 'daily', endType: 'indefinite' } }), marks, early, 1).map((m) => m.date).join() === '2026-09-29', 'a marked day does not remind');
ok(P.reminderMoments(daily, [], early, 0).length === 1, 'today still ahead reminds');
ok(P.reminderMoments({ ...daily, remind: false }, [], early, 3).length === 0, 'reminder off');
ok(P.reminderMoments({ ...daily, atTime: null }, [], early, 3).length === 0, 'no time, no reminder');
ok(P.reminderMoments({ ...daily, archivedAt: 'x' }, [], early, 3).length === 0, 'archived, no reminder');
ok(P.reminderTitle('Swim') === 'Time for Swim', 'reminder title');
ok(P.reminderBody(plan()) === 'About 30 minutes. Tap to start the workout, one set at a time.', P.reminderBody(plan()));
ok(P.reminderBody(walk) === 'Tap to open Schedules and mark it when it is done.', P.reminderBody(walk));
ok(P.localDate(new Date(2026, 0, 5, 23, 30)) === '2026-01-05', 'local date');
ok(P.momentOf('2026-01-05', '18:45').getHours() === 18, 'moment of');

// 6. Health Connect type and removal.
ok(P.healthExerciseType(['stretch', 'mobility']) === 71, 'stretching');
ok(P.healthExerciseType(['cardio', 'strength']) === 70, 'strength');
ok(P.healthExerciseType(['cardio']) === 0 && P.healthExerciseType([]) === 0, 'general workout');
ok(P.planRemoval(plan(), marks) === 'archive', 'a plan with marks is archived');
ok(P.planRemoval(plan({ id: 'fresh' }), marks) === 'delete', 'a plan never marked is deleted');

// 7. No verdicts, no counting days in a row.
clean(P.PLAN_FOOT, 'plan foot');
ok(/Nothing here counts days in a row/.test(P.PLAN_FOOT), 'the foot says nothing counts days in a row');
for (const p of [plan(), daily, weekly, walk, counted]) {
  clean(P.describePlan(p), 'describe');
  clean(P.reminderBody(p), 'reminder body');
}
for (const day of [...days, ...past]) {
  for (const entry of day.entries) {
    for (const on of ['2026-09-26', '2026-09-28', '2026-10-02']) clean(P.entryStatusLine(entry, on), 'status');
  }
}
for (const problem of [
  P.planDraftProblem(blank),
  P.planDraftProblem({ ...blank, activity: 'Walk', minutes: 'x', remind: false }),
  P.planDraftProblem({ ...blank, activity: 'Walk', atTime: null }),
]) {
  clean(problem, 'draft problem');
}

// 8. Home's Start a Workout card (lib/startWorkout.ts, H11 part 4).
const S = load('lib/startWorkout.ts');
const cardNow = new Date(2026, 8, 28, 9, 0, 0);
ok(S.lastDoneLine(null, cardNow) === 'Not done yet', 'never done');
ok(S.lastDoneLine(new Date(2026, 8, 28, 7, 0).toISOString(), cardNow) === 'Last done today', 'done today');
ok(S.lastDoneLine(new Date(2026, 8, 27, 22, 0).toISOString(), cardNow) === 'Last done yesterday', 'done yesterday');
ok(S.lastDoneLine(new Date(2026, 8, 24, 7, 0).toISOString(), cardNow) === 'Last done 4 days ago', 'done days ago');
const cardWorkouts = [
  { id: 'w1', name: 'Morning strength', stepCount: 5 },
  { id: 'w2', name: 'Stretch', stepCount: 1 },
  { id: 'w3', name: 'Empty', stepCount: 0 },
  { id: 'w4', name: 'Bike', stepCount: 3 },
  { id: 'w5', name: 'Arms', stepCount: 2 },
  { id: 'w6', name: 'Core', stepCount: 4 },
  { id: 'w7', name: 'Balance', stepCount: 2 },
];
const lastDone = new Map([['w4', '2026-09-27T08:00:00Z'], ['w2', '2026-09-20T08:00:00Z']]);
const card = S.startWorkoutCard({ plans: [plan(), walk], marks: [], workouts: cardWorkouts, lastDone, today: '2026-09-28', now: cardNow });
ok(card.today.length === 2 && card.today[0].action === 'start' && card.today[1].action === 'mark', 'today: start a workout, mark an activity');
ok(!card.others.some((o) => o.id === 'w1' || o.id === 'w3'), 'planned and empty workouts not repeated below');
ok(card.others[0].id === 'w4' && card.others[1].id === 'w2', 'most recently done first');
ok(card.others.length === S.OTHERS_LIMIT && card.heldBack === 1, `limit and held back: ${card.heldBack}`);
ok(card.others[0].line === '3 exercises. Last done yesterday', card.others[0].line);
ok(card.emptyLine === null, 'no empty line when something shows');
const markedCard = S.startWorkoutCard({ plans: [plan()], marks, workouts: cardWorkouts, lastDone, today: '2026-09-28', now: cardNow });
ok(markedCard.today[0].action === 'none', 'a marked day has nothing to press');
const noneCard = S.startWorkoutCard({ plans: [], marks: [], workouts: [], lastDone: new Map(), today: '2026-09-28', now: cardNow });
ok(noneCard.emptyLine === S.EMPTY_LINE, 'nothing built says how to begin');
const emptyCard = S.startWorkoutCard({ plans: [], marks: [], workouts: [{ id: 'w3', name: 'Empty', stepCount: 0 }], lastDone: new Map(), today: '2026-09-28', now: cardNow });
ok(/needs at least one exercise/.test(emptyCard.emptyLine || ''), 'a workout with no exercises says so');
for (const c of [card, markedCard, noneCard, emptyCard]) {
  clean(c.emptyLine, 'card empty line');
  for (const item of c.today) clean(item.status, 'card status');
  for (const other of c.others) clean(other.line, 'card line');
}

// The lens and the card: every sentence a person reads there.
for (const rel of ['components/ExerciseScheduleSection.tsx', 'components/StartWorkoutCard.tsx']) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  (function visit(node) {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isJsxText(node) && node.text.trim()) clean(node.text.trim(), rel);
    else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && /^[A-Z][a-z]*[ ,]/.test(node.text)) clean(node.text, rel);
    ts.forEachChild(node, visit);
  })(sf);
}

console.log(`${swept} sentences swept`);
if (failures > 0) {
  console.log(`${failures} failed`);
  process.exit(1);
}
console.log('All exercise plan checks passed.');
