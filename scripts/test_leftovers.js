// Checks lib/leftovers.ts (H3): titles, the week of later meals, which
// later meal can be added, when a leftover buys its own food on the Grocery
// List and how much the cooking buys, what each row says, and a sweep of
// every sentence for verdict words.
// Run: node scripts/test_leftovers.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  const dir = path.dirname(file);
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (name.startsWith('./')) return load(path.posix.join(dir, name.slice(2)) + '.ts');
    throw new Error(`${file} imported ${name}`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}
const lo = load('lib/leftovers.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too much|too little|enough|great|well done|dangerous|diagnos\w*|better|worse|spoil\w*|expired|own)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text), text);
}

// --- Titles -----------------------------------------------------------------------
ok('leftover title', lo.leftoverTitle('Lentil stew') === 'Leftovers: Lentil stew');
ok('leftover title idempotent', lo.leftoverTitle('Leftovers: Lentil stew') === 'Leftovers: Lentil stew');
ok('title restored', lo.titleWithoutLeftover('Leftovers: Lentil stew') === 'Lentil stew');
ok('plain title untouched', lo.titleWithoutLeftover('Lentil stew') === 'Lentil stew');

// --- Dates ------------------------------------------------------------------------
ok('add days across a month', lo.addDays('2026-09-29', 3) === '2026-10-02');
ok('days between', lo.daysBetween('2026-09-27T18:30', '2026-10-01') === 4);
const choices = lo.eatAgainDayChoices('2026-09-27');
ok('eight day choices', choices.length === 8, choices);
ok('same day first', choices[0].date === '2026-09-27' && choices[0].label.startsWith('Same day, Sunday 27 Sep'), choices[0]);
ok('next day', choices[1].label === 'Next day, Monday 28 Sep', choices[1]);
ok('day four not marked', !choices[4].label.includes('past 4 days'), choices[4]);
ok('day five marked', choices[5].label.endsWith(', past 4 days'), choices[5]);
choices.forEach((choice) => clean('day choice', choice.label));

// --- Which later meal -------------------------------------------------------------
const cook = { scheduledFor: '2026-09-27T18:30', mealType: 'dinner' };
ok('before the cooking refused', lo.eatAgainProblem(cook, { scheduledFor: '2026-09-27T12:30', mealType: 'lunch' }, []) !== null);
ok('the same slot refused', lo.eatAgainProblem(cook, { scheduledFor: '2026-09-27T18:30', mealType: 'dinner' }, []) !== null);
ok('next day lunch accepted', lo.eatAgainProblem(cook, { scheduledFor: '2026-09-28T12:30', mealType: 'lunch' }, []) === null);
ok('past a week refused', lo.eatAgainProblem(cook, { scheduledFor: '2026-10-05T12:30', mealType: 'lunch' }, []) !== null);
ok('twice at one meal refused', lo.eatAgainProblem(cook, { scheduledFor: '2026-09-28T13:00', mealType: 'lunch' }, [{ scheduledFor: '2026-09-28T12:30', mealType: 'lunch' }]) !== null);
ok('another meal that day accepted', lo.eatAgainProblem(cook, { scheduledFor: '2026-09-28T18:30', mealType: 'dinner' }, [{ scheduledFor: '2026-09-28T12:30', mealType: 'lunch' }]) === null);
[
  lo.eatAgainProblem(cook, { scheduledFor: '2026-09-27T12:30', mealType: 'lunch' }, []),
  lo.eatAgainProblem(cook, { scheduledFor: '2026-10-05T12:30', mealType: 'lunch' }, []),
  lo.eatAgainProblem(cook, { scheduledFor: '2026-09-28T12:30', mealType: 'lunch' }, [{ scheduledFor: '2026-09-28T12:30', mealType: 'lunch' }]),
].forEach((text) => clean('problem', text));

// --- The Grocery List -------------------------------------------------------------
ok('cooking gone: leftover buys', lo.leftoverBuysOnItsOwn(null, null, '2026-09-27') === true);
ok('cooking skipped: leftover buys', lo.leftoverBuysOnItsOwn('skipped', '2026-09-27', '2026-09-27') === true);
ok('cooking coming: leftover buys nothing', lo.leftoverBuysOnItsOwn('planned', '2026-09-28', '2026-09-27') === false);
ok('cooking passed unlogged: leftover buys', lo.leftoverBuysOnItsOwn('planned', '2026-09-26', '2026-09-27') === true);
ok('cooking logged: leftover buys nothing', lo.leftoverBuysOnItsOwn('logged', '2026-09-26', '2026-09-27') === false);
ok('cooked factor adds leftovers', lo.cookedShoppingFactor(1, [1, 0.5]) === 2.5);
ok('cooked factor alone', lo.cookedShoppingFactor(2, []) === 2);

// --- Captions ---------------------------------------------------------------------
ok('no caption without leftovers', lo.cookCaption(0) === null);
ok('cook caption', lo.cookCaption(2) === 'Cooked once for 3 meals');
const dinner = { scheduledFor: '2026-09-27T18:30', mealType: 'dinner', status: 'planned' };
ok('today', lo.leftoverCaption(dinner, '2026-09-27') === "From today's dinner");
ok('yesterday', lo.leftoverCaption(dinner, '2026-09-28') === "From yesterday's dinner");
ok('weekday', lo.leftoverCaption(dinner, '2026-09-30') === "From Sunday's dinner");
ok('past four days', lo.leftoverCaption(dinner, '2026-10-02').endsWith(', more than 4 days after'));
ok('skipped says the list buys', /skipped, so the Grocery List buys for this meal$/.test(lo.leftoverCaption({ ...dinner, status: 'skipped' }, '2026-09-28')));
ok('gone', lo.leftoverCaption(null, '2026-09-28') === 'Leftovers');
[
  lo.cookCaption(1),
  lo.leftoverCaption(dinner, '2026-09-28'),
  lo.leftoverCaption(dinner, '2026-10-02'),
  lo.leftoverCaption({ ...dinner, status: 'skipped' }, '2026-09-28'),
  lo.eatAgainIntro('Lentil stew'),
  lo.eatAgainAdded('Lunch, tomorrow, 12:30 PM', 1),
  lo.eatAgainAdded('Lunch, Friday, 12:30 PM', 6),
  lo.removeCookMessage('Lentil stew', 1),
  lo.removeCookMessage('Lentil stew', 3),
  lo.REMOVE_WITH_LEFTOVERS,
  lo.REMOVE_KEEP_LEFTOVERS,
  lo.USDA_NOTE,
].forEach((text) => clean('sentence', text));
ok('USDA line past four days', lo.eatAgainAdded('x', 5).includes('USDA'));
ok('no USDA line within four days', !lo.eatAgainAdded('x', 4).includes('USDA'));
ok('one later meal', lo.removeCookMessage('Stew', 1).startsWith('1 later meal eats leftovers of "Stew". Remove it too'));

// --- Leftovers of a meal already eaten ----------------------------------------------
const ahead = lo.leftoverDayChoices('2026-09-25', '2026-09-27');
ok('only today on', ahead.length > 0 && ahead.every((c) => c.date >= '2026-09-27'));
ok('ends a week after the cooking', ahead[ahead.length - 1].date === '2026-10-02');
ok('first day is today when the next day passed', lo.firstLeftoverDay('2026-09-25', '2026-09-27') === '2026-09-27');
ok('first day is the next day when eaten today', lo.firstLeftoverDay('2026-09-27T12:30', '2026-09-27') === '2026-09-28');
ok('nothing past a week', lo.leftoverDayChoices('2026-09-10', '2026-09-27').length === 0);
ok('can save within the week', lo.canSaveLeftovers('2026-09-21T18:30', '2026-09-27'));
ok('cannot save after a week', !lo.canSaveLeftovers('2026-09-19T18:30', '2026-09-27'));
[lo.saveLeftoversIntro('Lentil stew'), lo.SAVE_LEFTOVERS_LABEL, lo.EAT_AGAIN_LABEL].forEach((text) => clean('sentence', text));

// --- Times ------------------------------------------------------------------------
ok('breakfast time', lo.defaultMealTime('breakfast') === '08:00');
ok('dinner time', lo.defaultMealTime('dinner') === '18:30');

console.log(`${failures === 0 ? 'PASS' : 'FAIL'} leftovers: ${swept} sentences swept, ${failures} failure${failures === 1 ? '' : 's'}`);
if (failures > 0) process.exit(1);
