/* global __dirname */
// Checks lib/savedWeeks.ts (H6, save a week of meals and use it again):
// what is kept, how a week is laid onto another, and that no sentence
// judges anybody.
//
// USAGE
//   node scripts/test_saved_weeks.js
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
  const origResolve = Module._resolveFilename;
  mod.require = (request) => {
    if (request.startsWith('./')) return load(path.join(path.dirname(rel), request + '.ts'));
    return Module.prototype.require.call(mod, request);
  };
  void origResolve;
  mod._compile(out, file);
  return mod.exports;
}

const W = load('lib/savedWeeks.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const FORBIDDEN = /\b(safe|should|good|bad|better|worse|too much|enough|great|well done|failed|real|genuine|genuinely)\b|[–—]| -- /i;
const sentences = [];
function clean(text) {
  sentences.push(text);
  return text;
}

const base = {
  itemType: 'meal',
  notes: null,
  linkedMealId: null,
  sourceFavoriteId: null,
  sourceMealId: null,
  servings: null,
  rotationSelectionsJson: null,
  leftoverOf: null,
  leftoverOfMeal: null,
};
const items = [
  { ...base, id: 'a', scheduledFor: '2026-09-21T08:00', mealType: 'breakfast', title: 'Oats', status: 'logged', sourceFavoriteId: 'fav1' },
  { ...base, id: 'b', scheduledFor: '2026-09-21T18:00', mealType: 'dinner', title: 'Stew', status: 'logged', sourceMealId: 'm1', servings: 2 },
  { ...base, id: 'c', scheduledFor: '2026-09-22T12:00', mealType: 'lunch', title: 'Leftovers: Stew', status: 'planned', sourceMealId: 'm1', leftoverOf: 'b' },
  { ...base, id: 'd', scheduledFor: '2026-09-23T12:00', mealType: 'lunch', title: 'Skipped soup', status: 'skipped', sourceMealId: 'm2' },
  { ...base, id: 'e', scheduledFor: '2026-09-24T12:00', mealType: 'lunch', title: 'Leftovers: Chili', status: 'planned', sourceMealId: 'm3', leftoverOf: 'outside' },
  { ...base, id: 'f', scheduledFor: '2026-09-25T13:00', mealType: 'lunch', title: 'Sandwich', status: 'logged', linkedMealId: 'logged1' },
  { ...base, id: 'g', scheduledFor: '2026-09-28T13:00', mealType: 'lunch', title: 'Next week', status: 'planned' },
];

console.log('Saving');
const meals = W.mealsForSaving(items, '2026-09-21');
ok(meals.length === 5, 'skipped meal and a meal outside the week are left out');
ok(meals[0].dayOffset === 0 && meals[0].time === '08:00' && meals[0].sourceFavoriteId === 'fav1', 'day offset, time and favorite kept');
const stew = meals.find((m) => m.title === 'Stew');
const stewLeft = meals.find((m) => m.title === 'Leftovers: Stew');
ok(stewLeft && stewLeft.leftoverOfKey === stew.key, 'a leftover of a meal in the week keeps the link');
const chili = meals.find((m) => m.title === 'Chili');
ok(chili && chili.leftoverOfKey === null, 'a leftover whose meal is outside the week is saved as the dish');
ok(meals.find((m) => m.title === 'Sandwich').sourceMealId === 'logged1', 'a logged meal with no template reschedules from what was logged');
ok(W.defaultWeekName('2026-09-21') === 'Week of Sep 21', 'default name');
ok(clean(W.describeSavedWeek(meals)) === '5 meals over 4 days', 'description');
ok(W.savedWeekDays(meals, '2026-09-28').startsWith('Monday'), 'weekday names follow the week it is shown on');

console.log('Using');
const still = { favorites: new Set(['fav1']), meals: new Set(['m1', 'm3']) };
const plan = W.planSavedWeek(meals, '2026-10-05', '2026-10-01', [], still);
ok(plan.create.length === 5 && plan.alreadyThere === 0 && plan.daysGone === 0, 'everything added to an empty future week');
ok(plan.create[0].scheduledFor === '2026-10-05T08:00', 'dates follow the new week');
ok(plan.sourceGone === 1 && plan.create.find((m) => m.title === 'Sandwich').sourceMealId === null, 'a dish no longer saved goes on by name');

const existing = [
  { date: '2026-10-05', mealType: 'dinner', title: 'Pizza', status: 'planned' },
  { date: '2026-10-05', mealType: 'breakfast', title: 'Eggs', status: 'skipped' },
];
const clash = W.planSavedWeek(meals, '2026-10-05', '2026-10-01', existing, still);
ok(clash.alreadyThere === 1, 'a day with a dinner keeps it');
ok(clash.create.some((m) => m.title === 'Oats'), 'a skipped meal does not block the slot');
const orphan = clash.create.find((m) => m.title === 'Stew');
ok(orphan && orphan.leftoverOfKey === null, 'a leftover whose cooking is left out becomes the dish itself');

const partway = W.planSavedWeek(meals, '2026-10-05', '2026-10-07', [], still);
ok(partway.daysGone === 3, 'days already gone are not filled');

const snacks = [{ key: 's1', dayOffset: 0, time: '15:00', mealType: 'snack', title: 'Apple', sourceFavoriteId: null, sourceMealId: null, servings: null, rotationSelectionsJson: null, notes: null, leftoverOfKey: null }];
ok(W.planSavedWeek(snacks, '2026-10-05', '2026-10-01', [{ date: '2026-10-05', mealType: 'snack', title: 'Nuts', status: 'planned' }], still).create.length === 1, 'a different snack is added beside one already there');
ok(W.planSavedWeek(snacks, '2026-10-05', '2026-10-01', [{ date: '2026-10-05', mealType: 'snack', title: 'Apple', status: 'planned' }], still).create.length === 0, 'the same snack is not doubled');

console.log('Sentences');
clean(W.savedWeekPreview(plan));
clean(W.savedWeekPreview(clash));
clean(W.savedWeekPreview(partway));
clean(W.savedWeekMessage('Week of Sep 21', 5));
clean(W.savedWeekMessage('x', 0));
clean(W.savedWeekApplied(0));
clean(W.savedWeekApplied(3));
clean(W.removeSavedWeekMessage('Week of Sep 21'));
clean(W.SAVE_WEEK_LABEL);
clean(W.USE_SAVED_WEEK_LABEL);
ok(W.savedWeekPreview(partway).includes('3 meals fall on a day already gone and are left out'), 'plural agreement in the preview');
for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + text.slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
