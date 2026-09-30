/* global __dirname */
// Checks lib/householdCalendar.ts (H9, the shared household meal calendar):
// drafts, the copy onto a person's own schedule, the sentences, and that the
// peer allowlist carries the calendar and nothing else of the schedule.
//
// USAGE
//   node scripts/test_household_calendar.js
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

const H = load('lib/householdCalendar.ts');
const P = load('lib/peerRelationships.ts');

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

function entry(over) {
  return {
    id: 'h1',
    mealDate: '2026-09-28',
    time: '18:30',
    mealType: 'dinner',
    title: 'Lentil soup',
    recipeIds: [],
    servings: 4,
    cook: 'Sam',
    note: null,
    myScheduleItemId: null,
    myCopiedAt: null,
    updatedAt: '2026-09-27T10:00:00.000Z',
    ...over,
  };
}

console.log('Drafts');
const blank = H.blankDraft('2026-09-28');
ok(H.draftProblem(blank) === clean(H.draftProblem(blank)) && /name/.test(H.draftProblem(blank)), 'a meal with no name is refused');
ok(H.draftProblem({ ...blank, title: 'Soup' }) === null, 'a name and a day are enough');
ok(/18:30/.test(clean(H.draftProblem({ ...blank, title: 'Soup', time: '6pm' }))), 'a time that is not hours and minutes is refused');
ok(H.draftProblem({ ...blank, title: 'Soup', time: '24:00' }) !== null, '24:00 is refused');
ok(H.draftProblem({ ...blank, title: 'Soup', time: '07:05' }) === null, '07:05 is accepted');
ok(clean(H.draftProblem({ ...blank, title: 'Soup', servings: '0' })) !== null, 'zero servings is refused');
ok(H.draftProblem({ ...blank, title: 'Soup', mealDate: '' }) !== null, 'a missing day is refused');
const fields = H.draftToFields({ ...blank, title: '  Soup ', time: ' ', servings: '2.5', cook: ' ', note: 'Double batch' });
ok(fields.title === 'Soup' && fields.time === null && fields.servings === 2.5 && fields.cook === null && fields.note === 'Double batch', 'a draft is tidied into fields');
const round = H.draftFromEntry(entry({ servings: 2 }));
ok(round.servings === '2' && round.time === '18:30' && round.cook === 'Sam', 'an entry reopens as the draft it was');

console.log('From a meal on the schedule');
const mine = H.draftFromMyMeal({ scheduledFor: '2026-09-29T12:15', mealType: 'lunch', title: 'Rice bowl', servings: 3, recipeIds: ['r1', 'r2'] });
ok(mine.mealDate === '2026-09-29' && mine.time === '12:15' && mine.mealType === 'lunch', 'the day, time and meal go across');
ok(mine.recipeIds.join(',') === 'r1,r2' && mine.servings === '3', 'the system recipes and servings go across');
ok(mine.cook === '' && mine.note === '', 'nothing written about the person goes across');
ok(H.draftFromMyMeal({ scheduledFor: '2026-09-29', mealType: 'brunch', title: 'X', servings: null, recipeIds: [] }).mealType === 'dinner', 'an unknown meal type falls back to dinner');

console.log('Copy state');
ok(H.scheduleState(entry()) === 'notCopied', 'not copied yet');
ok(H.scheduleState(entry({ myScheduleItemId: 's1', myCopiedAt: '2026-09-27T11:00:00.000Z' })) === 'copied', 'copied after the last change');
ok(H.scheduleState(entry({ myScheduleItemId: 's1', myCopiedAt: '2026-09-27T09:00:00.000Z' })) === 'changedSince', 'changed after it was copied');
ok(/On your schedule/.test(clean(H.entryMeta(entry({ myScheduleItemId: 's1', myCopiedAt: '2026-09-27T11:00:00.000Z' })))), 'the row says it is on the schedule');
ok(/Changed since/.test(clean(H.entryMeta(entry({ myScheduleItemId: 's1', myCopiedAt: '2026-09-27T09:00:00.000Z' })))), 'the row says it changed since');
ok(clean(H.entryMeta(entry())) === 'Dinner at 18:30 · 4 servings · Sam cooking', 'the row meta reads plainly');
ok(clean(H.entryMeta(entry({ time: null, servings: 1, cook: null }))) === 'Dinner · 1 serving', 'one serving is singular');

console.log('Sorting');
const sorted = H.sortEntries([
  entry({ id: 'a', mealDate: '2026-09-29', mealType: 'breakfast' }),
  entry({ id: 'b', mealDate: '2026-09-28', mealType: 'dinner' }),
  entry({ id: 'c', mealDate: '2026-09-28', mealType: 'breakfast' }),
]);
ok(sorted.map((e) => e.id).join('') === 'cba', 'by day, then breakfast to snack');

console.log('Clashes');
ok(H.scheduleClashMessage(entry(), 'today', []) === null, 'nothing planned, nothing asked');
ok(H.scheduleClashMessage(entry(), 'today', [{ mealType: 'lunch', title: 'Wrap' }]) === null, 'a different meal is not in the way');
ok(H.scheduleClashMessage(entry({ mealType: 'snack' }), 'today', [{ mealType: 'snack', title: 'Nuts' }]) === null, 'a snack is never in the way');
const clash = clean(H.scheduleClashMessage(entry(), 'tomorrow', [{ mealType: 'dinner', title: 'Stew' }, { mealType: 'dinner', title: 'Salad' }]));
ok(/Stew and Salad/.test(clash) && /Nothing already there is changed/.test(clash), 'a clash names what is there and changes nothing');
clean(H.putOnScheduleDone(entry(), 'tomorrow'));

console.log('Removing');
const removeCopied = clean(H.removeEntryMessage(entry({ myScheduleItemId: 's1', myCopiedAt: '2026-09-27T11:00:00.000Z' }), ['Sam']));
ok(/stays there/.test(removeCopied) && /you and Sam/.test(removeCopied), 'removing keeps the schedule copy and names who shares it');
ok(!/stays there/.test(clean(H.removeEntryMessage(entry(), []))), 'nothing to keep when it was never copied');
clean(H.changedSinceMessage(entry()));

console.log('Intro');
ok(/Nobody is linked yet/.test(clean(H.householdCalendarIntro([]))), 'nobody linked');
ok(/turned off for Sam/.test(clean(H.householdCalendarIntro([{ name: 'Sam', sharing: false }]))), 'Meals turned off');
const both = clean(H.householdCalendarIntro([{ name: 'Sam', sharing: true }, { name: 'Ana', sharing: false }]));
ok(/shared with Sam/.test(both) && /not shared with Ana/.test(both), 'shared with one, not the other');
ok(H.weekDays('2026-09-28').length === 7 && H.weekDays('2026-09-28')[6] === '2026-10-04', 'a week crosses a month end');
clean(H.weekCountLine(0));
clean(H.weekCountLine(1));
clean(H.weekCountLine(3));
clean(H.HOUSEHOLD_CALENDAR_TITLE);
clean(H.PUT_ON_MY_SCHEDULE_LABEL);
clean(H.ADD_TO_CALENDAR_LABEL);

console.log('The peer allowlist');
const ALL = { meals: true, shopping: true, conditions: true, photos: true };
const NONE = { meals: false, shopping: false, conditions: false, photos: false };
ok(P.tableNamesThatCross('partner', ALL).includes('household_meal_calendar'), 'a partner with Meals on shares the calendar');
ok(!P.tableNamesThatCross('partner', { ...ALL, meals: false }).includes('household_meal_calendar'), 'with Meals off the calendar does not cross');
ok(P.tableNamesThatCross('partner', { ...ALL, shopping: false }).includes('household_meal_calendar'), 'Shopping does not govern the calendar');
ok(P.tableNamesThatCross('recipe', ALL).length === 0, 'a recipe link carries nothing');
const home = P.columnsThatStayHome('partner', ALL).household_meal_calendar || [];
ok(home.includes('my_schedule_item_id') && home.includes('my_copied_at'), 'what this device copied stays home');
const roles = ['recipe', 'partner', 'child', 'caregiver'];
const grantSets = [];
for (const meals of [true, false]) for (const shopping of [true, false]) for (const conditions of [true, false]) grantSets.push({ meals, shopping, conditions, photos: true });
let leaked = [];
for (const role of roles) {
  for (const grants of grantSets) {
    const crossing = P.tableNamesThatCross(role, grants);
    for (const table of crossing) {
      if (P.PERSONAL_HEALTH_TABLES.includes(table) || table === 'schedule_items') leaked.push(`${role}:${table}`);
    }
  }
}
ok(leaked.length === 0, 'no role and no permission carries a health table or schedule_items' + (leaked.length ? ' ' + leaked.join(',') : ''));
ok(JSON.stringify(P.tableNamesThatCross('partner', NONE).sort()) === JSON.stringify(['upkeep_doings', 'upkeep_items']), 'everything off carries only the chores somebody marked for the household (J8: that mark is the permission)');
clean(P.areaFor('mealCalendar').what);
clean(P.describeWhatMerges('partner', ALL, 'Sam'));

for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + String(text).slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
