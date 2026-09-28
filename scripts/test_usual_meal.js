// Checks lib/usualMeal.ts and lib/openMeals.ts: Your usual meals is a list
// the person chose, so Home offers only what is on it, near a meal time,
// never once the slot is logged, planned or put away for the day; history
// only suggests and never adds; a meal left open on the plan falls on the
// weekdays the person picked; and every sentence stays clear of verdicts.
// Run: node scripts/test_usual_meal.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const u = load('lib/usualMeal.ts');
const o = load('lib/openMeals.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|well done|streak)\b|[–—]| -- /i;
function clean(label, text) {
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text), text);
}

// 2026-09-27 is a Sunday; 2026-09-28 a Monday.
const TODAY = '2026-09-28';
function day(n) {
  const d = new Date(`${TODAY}T12:00:00`);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Lunches on the ten days before: a salad on seven, soup on three.
const history = [];
for (let n = 1; n <= 10; n++) {
  const salad = n <= 7;
  history.push({ id: `m${n}`, name: salad ? 'Chicken Salad' : 'Lentil Soup', mealType: 'lunch', eatenAt: `${day(n)}T12:${salad ? '30' : '10'}` });
}

function meal(id, fields) {
  return {
    id,
    mealType: 'lunch',
    kind: 'home',
    source: 'typed',
    name: id,
    favoriteId: null,
    sourceMealId: null,
    place: null,
    foods: [],
    lastUsedAt: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    standingWeekdays: [],
    ...fields,
  };
}
const list = [
  meal('Soup in a flask', { foods: ['Vegetable soup'] }),
  meal('Burrito bowl', { kind: 'out', place: 'Corner taqueria', lastUsedAt: '2026-09-25T12:00:00.000Z' }),
  meal('Grain bowl', { lastUsedAt: '2026-09-26T12:00:00.000Z' }),
  meal('Oats', { mealType: 'breakfast' }),
];

const base = {
  history,
  today: TODAY,
  nowTime: '12:15',
  usualTimes: { breakfast: null, lunch: '12:30', dinner: null },
  plannedToday: [],
  dismissed: null,
  usualMeals: list,
  openToday: [],
};

// --- The card offers only the chosen list --------------------------------
const card = u.usualMealsCard(base);
ok('card for lunch', card && card.slot === 'lunch', card);
ok('home list holds the home lunches, lately used first', card && card.home.map((m) => m.name).join() === 'Grain bowl,Soup in a flask', card && card.home.map((m) => m.name));
ok('eaten out kept apart', card && card.out.length === 1 && card.out[0].name === 'Burrito bowl', card && card.out);
ok('breakfast not on a lunch card', card && ![...card.home, ...card.out].some((m) => m.mealType !== 'lunch'));
ok('history never lands on the card', card && ![...card.home, ...card.out].some((m) => m.name === 'Chicken Salad'));
ok('no card with an empty list and nothing open', u.usualMealsCard({ ...base, usualMeals: [] }) === null);
ok('no card far from a meal time', u.usualMealsCard({ ...base, nowTime: '16:30' }) === null);
ok('no card once lunch is planned', u.usualMealsCard({ ...base, plannedToday: ['lunch'] }) === null);
ok('no card once lunch is logged', u.usualMealsCard({ ...base, history: [...history, { id: 't', name: 'X', mealType: 'lunch', eatenAt: `${TODAY}T12:00` }] }) === null);
ok('no card after Not today', u.usualMealsCard({ ...base, dismissed: u.dismissKeyFor(TODAY, 'lunch') }) === null);
const openEmpty = u.usualMealsCard({ ...base, usualMeals: [], openToday: ['lunch'] });
ok('an open meal shows even with an empty list', openEmpty && openEmpty.open && openEmpty.home.length === 0, openEmpty);
clean('card title', card && u.usualMealsCardTitle(card));
clean('card caption', card && u.usualMealsCardCaption(card));
clean('open empty caption', openEmpty && u.usualMealsCardCaption(openEmpty));
ok('title names the meal', card && u.usualMealsCardTitle(card) === 'Your usual lunches');

const many = Array.from({ length: 7 }, (_, i) => meal(`Lunch ${i}`));
const long = u.usualMealsCard({ ...base, usualMeals: many });
ok('Home shows at most four and counts the rest', long && long.home.length === u.HOME_LIST_MAX && long.moreHome === 3, long && [long.home.length, long.moreHome]);

// --- History only suggests ------------------------------------------------
const suggested = u.historySuggestions(history, TODAY, list);
ok('salad and soup suggested', suggested.lunch.map((s) => s.name).join() === 'Chicken Salad,Lentil Soup', suggested.lunch);
ok('suggestion copies the latest', suggested.lunch[0].sourceMealId === 'm1', suggested.lunch[0]);
ok('suggestion counts days', suggested.lunch[0].days === 7, suggested.lunch[0]);
const kept = u.historySuggestions(history, TODAY, [...list, meal('chicken salad')]);
ok('nothing suggested that is on the list', !kept.lunch.some((s) => s.name === 'Chicken Salad'), kept.lunch);
const once = u.historySuggestions([history[0]], TODAY, []);
ok('once is not suggested', once.lunch.length === 0, once.lunch);
clean('suggestion caption', u.suggestionCaption(suggested.lunch[0]));

// --- Starters and parsing -------------------------------------------------
ok('leftovers offered for lunch from home', u.startersToOffer('lunch', 'home', []).some((s) => s.source === 'leftovers'));
ok('leftovers not offered eaten out', !u.startersToOffer('lunch', 'out', []).some((s) => s.source === 'leftovers'));
ok('a starter on the list is not offered again', !u.startersToOffer('lunch', 'home', list).some((s) => s.name === 'Soup in a flask'));
ok('every slot has both lists', u.USUAL_SLOTS.every((slot) => u.STARTER_USUAL_MEALS[slot].home.length > 0 && u.STARTER_USUAL_MEALS[slot].out.length > 0));
for (const slot of u.USUAL_SLOTS) {
  for (const kind of ['home', 'out']) {
    for (const starter of u.STARTER_USUAL_MEALS[slot][kind]) clean(`starter ${starter.name}`, [starter.name, ...starter.foods].join(', '));
  }
}
ok('foods split on commas and lines, deduped', u.parseFoods('Rice, beans\nrice,  Salsa ,').join('|') === 'Rice|beans|Salsa', u.parseFoods('Rice, beans\nrice,  Salsa ,'));
ok('foods capped at twenty', u.parseFoods(Array.from({ length: 30 }, (_, i) => `f${i}`).join(',')).length === 20);

// --- Sentences ------------------------------------------------------------
ok('eaten out note with place', u.eatenOutNote('Corner taqueria') === 'Eaten out. Corner taqueria.');
ok('eaten out note alone', u.eatenOutNote('  ') === 'Eaten out.');
ok('eaten out note starts with the marker', u.eatenOutNote('x').startsWith(u.EATEN_OUT_NOTE));
for (const m of list) clean(`detail ${m.name}`, u.usualMealDetail(m));
clean('leftovers detail', u.usualMealDetail(meal('L', { source: 'leftovers' })));
clean('typed foods note', u.TYPED_FOODS_NOTE);
clean('trial note', u.USUAL_MEAL_TRIAL_NOTE);
clean('no leftovers', u.NO_LEFTOVERS_ERROR);
ok('logged sentence', u.usualMealLoggedSentence('Grain bowl', '12:05') === 'Grain bowl logged at 12:05pm.', u.usualMealLoggedSentence('Grain bowl', '12:05'));

// --- The meal left open ---------------------------------------------------
const rules = o.parseOpenMeals(JSON.stringify([{ meal: 'lunch', weekdays: [5, 1, 2, 3, 4, 4] }, { meal: 'lunch', weekdays: [0] }, { meal: 'tea', weekdays: [1] }]));
ok('parse keeps one rule per meal, sorted, deduped', rules.length === 1 && rules[0].weekdays.join() === '1,2,3,4,5', rules);
ok('parse survives junk', o.parseOpenMeals('{nope').length === 0 && o.parseOpenMeals(null).length === 0);
ok('round trip', JSON.stringify(o.parseOpenMeals(o.serializeOpenMeals(rules))) === JSON.stringify(rules));
ok('open on a Monday', o.openMealsOn(rules, '2026-09-28').join() === 'lunch');
ok('not open on a Sunday', o.openMealsOn(rules, '2026-09-27').length === 0);
ok('isMealOpenOn', o.isMealOpenOn(rules, '2026-09-29', 'lunch') && !o.isMealOpenOn(rules, '2026-09-29', 'dinner'));
ok('weekdays phrase, work week', o.weekdaysPhrase([1, 2, 3, 4, 5]) === 'Monday to Friday');
ok('weekdays phrase, weekend', o.weekdaysPhrase([6, 0]) === 'Saturday and Sunday');
ok('weekdays phrase, named', o.weekdaysPhrase([0, 1, 3]) === 'on Monday, Wednesday and Sunday', o.weekdaysPhrase([0, 1, 3]));
ok('describe nothing', o.describeOpenMeals([]) === null);
clean('describe', o.describeOpenMeals(rules));
clean('day note one planned', o.openMealDayNote(['lunch'], ['breakfast', 'dinner']));
clean('day note none planned', o.openMealDayNote(['breakfast', 'lunch', 'dinner'], []));
ok('day note names what is covered', o.openMealDayNote(['lunch'], ['breakfast', 'dinner']).includes('breakfast and dinner only'));
clean('empty line', o.openMealEmptyLine('lunch'));

if (failures > 0) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log('test_usual_meal: all passed');
