/* global __dirname */
// Checks lib/exerciseLibrary.ts and lib/workouts.ts (H11, Life > Workouts):
// that every built-in exercise is complete (how to do it, doing it safely,
// the common mistakes, an easier and a harder version, a page that shows
// it), that condition notes are cited and reach only the conditions a person
// tracks, and the pure workout arithmetic, drafts and removal plan.
//
// USAGE
//   node scripts/test_exercise_library.js           the checks
//   node scripts/test_exercise_library.js --links   also fetch every demonstration
//                                                   and source page (PubMed skipped)
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

const L = load('lib/exerciseLibrary.ts');
const W = load('lib/workouts.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) return;
  failures += 1;
  console.log('FAIL  ' + label);
}

// Sentences the app writes about the person or their plan: no verdicts.
const FORBIDDEN = /\b(should|good|bad|better|worse|too much|enough|great|well done|failed|real|genuine|genuinely)\b|[–—]| -- /i;
// Instruction text in the library may say how to do something safely, so
// only the writing-style rules apply to it.
const STYLE = /\b(real|genuine|genuinely)\b|[–—]| -- /i;
let swept = 0;
function clean(text, label, pattern = FORBIDDEN) {
  swept += 1;
  const hit = pattern.exec(text);
  ok(!hit, `${label}: "${hit ? hit[0] : ''}" in "${text}"`);
}

// 1. The library.
const ids = new Set();
const categories = new Set(L.EXERCISE_CATEGORIES.map((c) => c.key));
ok(L.LIBRARY_EXERCISES.length >= 55 && L.LIBRARY_EXERCISES.length <= 70, `about sixty exercises (${L.LIBRARY_EXERCISES.length})`);
for (const ex of L.LIBRARY_EXERCISES) {
  const at = `library ${ex.id}`;
  ok(!ids.has(ex.id), `${at}: id is unique`);
  ids.add(ex.id);
  ok(!!ex.name && ex.name.trim() === ex.name, `${at}: has a name`);
  ok(categories.has(ex.category), `${at}: category is known`);
  ok(ex.equipment.length > 0 && ex.equipment.every((e) => !!L.EQUIPMENT_LABELS[e]), `${at}: equipment is known`);
  ok(ex.steps.length >= 2, `${at}: at least two steps`);
  ok(ex.safety.length >= 1, `${at}: at least one safety point`);
  ok(ex.mistakes.length >= 1, `${at}: at least one common mistake`);
  ok(!!ex.easier && !!ex.harder, `${at}: an easier and a harder version`);
  ok(ex.sets >= 1, `${at}: at least one set`);
  if (ex.measure === 'reps') ok(ex.reps > 0 && ex.seconds == null, `${at}: reps and no seconds`);
  else ok(ex.seconds > 0 && ex.reps == null, `${at}: seconds and no reps`);
  ok(!!ex.demo && /^https:\/\//.test(ex.demo.url) && !!ex.demo.source, `${at}: a demonstration page`);
  ok(['light', 'moderate', 'vigorous'].includes(ex.intensity), `${at}: intensity`);
  for (const line of [ex.name, ex.muscles, ...ex.steps, ...ex.safety, ...ex.mistakes, ex.easier, ex.harder]) clean(line, at, STYLE);
  ok(L.findLibraryExercise(ex.id) === ex, `${at}: found by id`);
}
for (const c of categories) ok(L.LIBRARY_EXERCISES.some((ex) => ex.category === c), `category ${c} has exercises`);
ok(L.LIBRARY_EXERCISES.filter((ex) => ex.gentle).length >= 10, 'at least ten gentle exercises');
ok(L.LIBRARY_EXERCISES.some((ex) => ex.equipment.includes('none')), 'some need no equipment');
ok(L.findLibraryExercise('nope') === null, 'an unknown id finds nothing');

// 2. Condition notes: cited, named, and only for what the person tracks.
for (const note of [...L.CONDITION_NOTES, ...L.SESSION_NOTES]) {
  ok(note.conditions.every((c) => !!L.CONDITION_NAMES[c]), `note ${note.id}: every condition has a name`);
  ok(/^https:\/\//.test(note.source.url) && !!note.source.label, `note ${note.id}: cited`);
  clean(note.text, `note ${note.id}`, STYLE);
}
for (const note of L.CONDITION_NOTES) {
  ok(note.tags.length > 0, `note ${note.id}: fits some exercise tag`);
  ok(L.LIBRARY_EXERCISES.some((ex) => note.tags.some((t) => ex.tags.includes(t))), `note ${note.id}: some exercise carries its tag`);
}
ok(L.sessionNotesFor([]).length === 0, 'no tracked conditions, no session notes');
ok(L.sessionNotesFor(['hashimotos']).length === 0, 'a condition with no note brings none');
const t1 = L.sessionNotesFor(['type_1_diabetes']);
ok(t1.length === 2 && t1.every((n) => n.condition === 'type 1 diabetes'), 'type 1 diabetes gets both session notes, named for it alone');
const bothDiabetes = L.sessionNotesFor(['type_1_diabetes', 'type_2_diabetes']);
ok(bothDiabetes[0].condition === 'type 1 diabetes and type 2 diabetes', 'two tracked conditions are named together');
ok(L.noteHeading(t1[0]) === 'Because you track type 1 diabetes', 'the heading names the condition');
const strain = L.CONDITION_NOTES[0];
ok(L.exerciseNotesFor(strain.tags, []).length === 0, 'an exercise note needs a tracked condition');
ok(L.exerciseNotesFor(strain.tags, strain.conditions).length >= 1, 'an exercise note reaches its condition');
ok(L.exerciseNotesFor([], strain.conditions).length === 0, 'an exercise without the tag gets no note');
clean(L.ACTIVITY_GUIDELINE.text, 'activity guideline', STYLE);
clean(L.GENTLE_FILTER_HELP, 'gentle help');

// 3. Amounts, search and equipment words.
ok(L.formatSeconds(30) === '30 seconds' && L.formatSeconds(60) === '1 minute' && L.formatSeconds(90) === '1 minute 30 seconds', 'seconds read as words');
ok(L.describeAmount({ measure: 'reps', sets: 3, reps: 10, seconds: null, perSide: true, weight: 8, weightUnit: 'kg', restSeconds: 60 }) === '3 sets of 10 each side, 8 kg, 1 minute rest', 'a full amount');
ok(L.describeAmount({ measure: 'reps', sets: 1, reps: 12, seconds: null, perSide: false }) === '12 times', 'one set of reps');
ok(L.describeAmount({ measure: 'time', sets: 1, reps: null, seconds: 45, perSide: false, restSeconds: 60 }) === '45 seconds', 'one timed set has no rest');
const gentle = L.LIBRARY_EXERCISES.filter((ex) => L.matchesFilter(ex, { ...L.NO_FILTER, gentleOnly: true }));
ok(gentle.every((ex) => ex.gentle), 'the flare-day filter keeps only gentle exercises');
ok(L.LIBRARY_EXERCISES.filter((ex) => L.matchesFilter(ex, L.NO_FILTER)).length === L.LIBRARY_EXERCISES.length, 'no filter keeps everything');
const squat = L.LIBRARY_EXERCISES.filter((ex) => L.matchesFilter(ex, { ...L.NO_FILTER, query: 'SQUAT' }));
ok(squat.length >= 1 && squat.every((ex) => /squat/i.test(`${ex.name} ${ex.muscles}`)), 'search ignores case');
ok(L.equipmentLine(['none']) === 'No equipment', 'no equipment');
ok(L.equipmentLine(['dumbbells', 'band']) === `${L.EQUIPMENT_LABELS.dumbbells} or ${L.EQUIPMENT_LABELS.band}`, 'two kinds of equipment read as either');

// 4. Views, drafts and custom exercises.
const views = W.allExerciseViews([]);
ok(views.length === L.LIBRARY_EXERCISES.length, 'every library exercise has a view');
ok(views.every((v, i) => i === 0 || views[i - 1].name.localeCompare(v.name) <= 0), 'views read alphabetically');
const first = W.libraryView(L.LIBRARY_EXERCISES[0]);
const copy = W.draftFromExercise(first, true);
ok(copy.name === `${first.name} (my version)`, 'a copy is named as your version');
ok(W.exerciseDraftProblem(copy) === null, 'a copied library exercise is a valid draft');
ok(W.exerciseDraftProblem(W.blankExerciseDraft()) !== null, 'a blank draft is not ready');
ok(W.exerciseDraftProblem({ ...copy, videoUrl: 'not a link' }) !== null, 'a video link must be a link');
ok(W.isVideoLink('https://example.com/v') && !W.isVideoLink('example'), 'what counts as a link');
const fields = W.exerciseDraftToFields({ ...copy, steps: ' one \n\n two ', safety: '', mistakes: 'x' });
ok(fields.steps.length === 2 && fields.steps[0] === 'one' && fields.safety.length === 0, 'multiline fields become trimmed lists');
const custom = { id: 'c1', ...fields, archivedAt: null };
const retired = { ...custom, id: 'c2', name: 'Retired one', archivedAt: '2026-09-28' };
const withCustom = W.allExerciseViews([custom, retired]);
ok(withCustom.length === views.length + 1, 'a retired exercise is not offered');
ok(W.resolveExercise('custom', 'c2', [custom, retired]) !== null, 'a retired exercise still resolves for the workout that uses it');
ok(W.resolveExercise('custom', 'gone', [custom]) === null, 'a removed exercise resolves to nothing');
ok(W.exerciseMetaLine(W.customView(custom)).endsWith('Yours'), 'your own exercise says so');
clean(W.exerciseMetaLine(first), 'meta line');

// 5. Steps and workouts.
const stepFields = W.newStepFields(first);
const step = { id: 's1', workoutId: 'w1', position: 0, ...stepFields };
ok(step.source === 'library' && step.exerciseId === first.id, 'a step points at its exercise');
ok(step.sets === first.sets, 'a new step starts from the exercise default');
const draft = W.stepDraftFrom(step, first);
ok(W.stepDraftProblem(draft) === null, 'an untouched step draft is valid');
ok(W.stepDraftProblem({ ...draft, sets: '0' }) !== null, 'zero sets is refused');
ok(W.stepDraftProblem({ ...draft, measure: 'reps', reps: '' }) !== null, 'reps are needed when counted in reps');
const withWeight = W.stepDraftToFields({ ...draft, weight: '7,5', weightUnit: 'kg' });
ok(withWeight.weight === 7.5, 'a comma decimal weight is read');
const timed = W.stepDraftToFields({ ...draft, measure: 'time', seconds: '40', reps: '10' });
ok(timed.seconds === 40 && timed.reps == null, 'a timed step keeps seconds and drops reps');
clean(W.describeStep(step, first), 'describe step');
const workout = { id: 'w1', name: 'Monday', note: null, archivedAt: null, steps: [step, { ...step, id: 's2', position: 1 }] };
ok(W.describeWorkout({ ...workout, steps: [] }) === 'No exercises yet', 'an empty workout');
ok(/^2 exercises, about \d+ minutes$/.test(W.describeWorkout(workout)), 'a workout with two exercises');
ok(W.estimateMinutes([{ ...step, sets: 3, reps: 10, seconds: null, perSide: false, restSeconds: 60 }]) === 4, 'three sets of ten with a minute rest is about four minutes');
ok(JSON.stringify(W.moveStep(['a', 'b', 'c'], 'b', -1)) === '["b","a","c"]', 'moving up');
ok(JSON.stringify(W.moveStep(['a', 'b', 'c'], 'c', 1)) === '["a","b","c"]', 'the last cannot move down');
ok(W.workoutNameProblem('  ', []) !== null, 'a workout needs a name');
ok(W.workoutNameProblem('monday ', ['Monday']) !== null, 'names do not repeat, whatever the case');
ok(W.workoutNameProblem('Tuesday', ['Monday']) === null, 'a new name is fine');
ok(W.workoutIntensity([null, W.libraryView({ ...L.LIBRARY_EXERCISES[0], intensity: 'vigorous' })]) === 'vigorous', 'the hardest exercise sets the intensity');
ok(W.workoutIntensity([]) === 'light', 'an empty workout is light');
clean(W.missingExerciseName({ ...step, source: 'custom' }), 'missing name');

// 6. Removal: never orphan a workout.
ok(W.planExerciseRemoval([]) === 'delete', 'unused: deleted');
ok(W.planExerciseRemoval(['Monday']) === 'retire', 'in a workout: retired');
ok(W.exerciseRemovalMessage('Wall slide', ['Monday', 'Friday']).includes('Monday and Friday'), 'the message names the workouts');
clean(W.exerciseRemovalMessage('Wall slide', ['A', 'B', 'C']), 'removal message');
clean(W.exerciseRemovalMessage('Wall slide', []), 'removal message, unused');
clean(W.workoutRemovalMessage(workout), 'workout removal message');
for (const text of [W.WORKOUTS_INTRO, W.LIBRARY_INTRO, W.libraryCountLine(3, 64), W.libraryCountLine(1, 1), W.restLine(90), W.restLine(null)]) clean(text, 'lens words');

async function checkLinks() {
  const urls = new Map();
  for (const ex of L.LIBRARY_EXERCISES) urls.set(ex.demo.url, ex.id);
  for (const d of L.SHARED_DEMONSTRATIONS) urls.set(d.url, d.source);
  for (const note of [...L.CONDITION_NOTES, ...L.SESSION_NOTES]) urls.set(note.source.url, note.id);
  urls.set(L.ACTIVITY_GUIDELINE.source.url, 'activity guideline');
  let checked = 0;
  for (const [url, owner] of urls) {
    if (url.includes('pubmed.ncbi.nlm.nih.gov')) continue;
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      ok(res.status === 200, `link ${owner}: ${url} returned ${res.status}`);
    } catch (error) {
      ok(false, `link ${owner}: ${url} failed (${error.message})`);
    }
    checked += 1;
  }
  console.log(`${checked} links checked.`);
}

(async () => {
  if (process.argv.includes('--links')) await checkLinks();
  if (failures > 0) {
    console.log(`${failures} failed.`);
    process.exit(1);
  }
  console.log(`All passed (${swept} sentences swept).`);
})();
