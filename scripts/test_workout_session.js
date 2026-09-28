/* global __dirname */
// Checks lib/workoutSession.ts (H11 part 2, the workout player at
// app/workout.tsx): how a workout is laid out as sets, where rest falls,
// skipping, planned against done, what is kept and read back as "last
// time", and that no sentence it writes passes a verdict.
//
// USAGE
//   node scripts/test_workout_session.js
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

const S = load('lib/workoutSession.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) return;
  failures += 1;
  console.log('FAIL  ' + label);
}
const FORBIDDEN = /\b(should|good|bad|better|worse|too much|too little|enough|great|well done|failed|missed|only|real|genuine|genuinely)\b|[–—]| -- /i;
let swept = 0;
function clean(text, label) {
  if (text == null) return;
  swept += 1;
  const hit = FORBIDDEN.exec(text);
  ok(!hit, `${label}: "${hit ? hit[0] : ''}" in "${text}"`);
}

function step(id, extra) {
  return { id, workoutId: 'w', source: 'library', exerciseId: id, position: 0, sets: 3, reps: 10, seconds: null, perSide: false, weight: null, weightUnit: null, restSeconds: 60, note: null, ...extra };
}
const workout = {
  id: 'w',
  name: 'Morning',
  note: null,
  archivedAt: null,
  steps: [
    step('squat', { weight: 8, weightUnit: 'kg' }),
    step('lunge', { sets: 2, reps: 8, perSide: true, restSeconds: 45 }),
    step('plank', { sets: 2, reps: null, seconds: 30, restSeconds: null }),
    step('gone', { sets: 1 }),
  ],
};
const names = { squat: 'Squat', lunge: 'Lunge', plank: 'Plank' };
const resolve = (_source, id) => (names[id] ? { name: names[id], measure: 'reps' } : null);
const sets = S.buildSessionSets(workout, resolve, () => 'An exercise no longer on the list');

// 1. Layout.
ok(sets.length === 3 + 4 + 2 + 1, `set count (${sets.length})`);
ok(new Set(sets.map((s) => s.key)).size === sets.length, 'every key is unique');
ok(sets[0].restAfter === 60 && sets[1].restAfter === 60 && sets[2].restAfter === null, 'no rest after the last set of an exercise');
const lunges = sets.filter((s) => s.stepId === 'lunge');
ok(lunges.map((s) => s.side).join() === 'left,right,left,right', 'per side: left then right each round');
ok(lunges[0].restAfter === null && lunges[1].restAfter === 45 && lunges[3].restAfter === null, 'rest after the right side only, not after the last round');
const planks = sets.filter((s) => s.stepId === 'plank');
ok(planks.every((s) => s.measure === 'time' && s.plannedSeconds === 30 && s.restAfter === null), 'timed step with no rest');
ok(sets[sets.length - 1].exerciseName === 'An exercise no longer on the list', 'a missing exercise keeps a name');
ok(S.setHeading(lunges[1]) === 'Set 1 of 2, right side', `heading: ${S.setHeading(lunges[1])}`);
ok(S.setHeading(sets[sets.length - 1]) === 'One set', 'one set heading');
ok(S.plannedLine(sets[0]) === '10 times, 8 kg', `planned: ${S.plannedLine(sets[0])}`);
ok(S.exerciseProgressLine(sets, 3) === 'Exercise 2 of 4', `progress: ${S.exerciseProgressLine(sets, 3)}`);
ok(S.nextExerciseIndex(sets, 0) === 3 && S.nextExerciseIndex(sets, sets.length - 1) === null, 'skip the rest of an exercise');
ok(S.nextIndex(sets, sets.length - 1) === null, 'end of workout');
ok(S.upNextLine(sets, 2).startsWith('Next: Lunge, set 1 of 2, left side'), `up next: ${S.upNextLine(sets, 2)}`);

// 2. Timers and parsing.
ok(S.secondsLeft(10500, 10000) === 1 && S.secondsLeft(5000, 10000) === 0, 'seconds left rounds up, never below zero');
ok(S.clockText(65) === '1:05' && S.clockText(0) === '0:00', 'clock text');
ok(S.parseWeight('7,5') === 7.5 && S.parseWeight('') === null && S.parseWeight('x') === null, 'weight parse');
ok(S.parseCount('12') === 12 && S.parseCount('-1') === null, 'count parse');

// 3. Planned against done.
const results = {};
const at = '2026-09-28T10:00:00.000Z';
const put = (set, status, reps, seconds, weight) => {
  results[set.key] = { key: set.key, status, reps, seconds, weight, at };
};
put(sets[0], 'done', 10, null, 8);
put(sets[1], 'done', 9, null, 8);
put(sets[2], 'skipped', null, null, null);
put(lunges[0], 'done', 8, null, null);
put(lunges[1], 'done', 8, null, null);
put(planks[0], 'done', null, 25, null);
const comparisons = S.compareExercises(sets, results);
ok(comparisons.length === 4, 'one line per exercise');
ok(comparisons[0].planned === '3 sets of 10, 8 kg', `squat planned: ${comparisons[0].planned}`);
ok(comparisons[0].done === '2 sets: 10, 9, 8 kg, 1 skipped', `squat done: ${comparisons[0].done}`);
ok(comparisons[1].done === '1 set: 8 left, 8 right, 2 not reached', `lunge done: ${comparisons[1].done}`);
ok(comparisons[3].done === 'None done, 1 not reached', `not reached is not zero: ${comparisons[3].done}`);
const totals = S.sessionTotals(sets, results);
ok(totals.done === 5 && totals.skipped === 1 && totals.notReached === 4, `totals ${JSON.stringify(totals)}`);
ok(S.totalsLine(totals) === '5 sets done, 1 skipped, 4 not reached', S.totalsLine(totals));
ok(S.sessionMinutes('2026-09-28T10:00:00Z', '2026-09-28T10:31:00Z') === 31, 'minutes');
ok(S.sessionMinutes('2026-09-28T10:00:00Z', '2026-09-28T10:00:00Z') === 1, 'never below one minute');
const notes = S.logNotes(comparisons, '  felt steady ');
ok(notes.split('\n').length === 5 && notes.endsWith('felt steady'), 'log notes carry every exercise and the note');

// 4. Kept and read back.
const kept = S.keptSets(sets, results);
ok(kept.length === sets.length, 'every set kept, reached or not');
ok(kept[2].status === 'skipped' && kept[2].reps === null, 'skipped keeps no amount');
ok(kept[kept.length - 1].status === 'not reached', 'not reached kept as such');
const round = S.parseKeptSets(JSON.stringify(kept));
ok(round.length === kept.length, 'kept sets survive JSON');
ok(S.parseKeptSets('not json').length === 0 && S.parseKeptSets(null).length === 0, 'bad JSON reads as nothing');
const now = new Date(2026, 8, 28, 12, 0, 0);
const three = new Date(2026, 8, 25, 18, 0, 0).toISOString();
ok(S.lastTimeLine('squat', round, three, now) === 'Last time, 3 days ago: 10, 9 at 8 kg', `last time: ${S.lastTimeLine('squat', round, three, now)}`);
ok(S.lastTimeLine('gone', round, three, now) === null, 'no last time when nothing was done');
ok(S.daysAgoText(new Date(2026, 8, 27, 23, 0).toISOString(), now) === 'yesterday', 'yesterday');
ok(S.daysAgoText(new Date(2026, 8, 28, 1, 0).toISOString(), now) === 'today', 'today');

// 5. No verdicts anywhere.
for (const set of sets) {
  clean(S.setHeading(set), 'heading');
  clean(S.plannedLine(set), 'planned');
}
for (let i = 0; i < sets.length; i += 1) {
  clean(S.exerciseProgressLine(sets, i), 'progress');
  clean(S.upNextLine(sets, i), 'up next');
}
for (const line of comparisons) {
  clean(line.planned, 'compare planned');
  clean(line.done, 'compare done');
}
clean(S.totalsLine(totals), 'totals');
clean(notes, 'log notes');
clean(S.PLAYER_FOOT, 'player foot');
clean(S.TIMER_FOOT, 'timer foot');
clean(S.lastTimeLine('lunge', round, three, now), 'last time');

// The player screen: every sentence a person reads there.
const screen = fs.readFileSync(path.join(ROOT, 'app/workout.tsx'), 'utf8');
const sf = ts.createSourceFile('workout.tsx', screen, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
(function visit(node) {
  if (ts.isImportDeclaration(node)) return;
  if (ts.isJsxText(node) && node.text.trim()) clean(node.text.trim(), 'screen text');
  else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && /^[A-Z][a-z]*[ ,]/.test(node.text)) clean(node.text, 'screen text');
  ts.forEachChild(node, visit);
})(sf);

console.log(`${swept} sentences swept`);
if (failures > 0) {
  console.log(`${failures} failed`);
  process.exit(1);
}
console.log('All workout session checks passed.');
