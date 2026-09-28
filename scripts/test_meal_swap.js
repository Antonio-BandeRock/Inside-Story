/* global __dirname */
// Checks swapping one meal on a planned day (H4, 2026-09-28): the breakfast
// and the main dish of lunch or dinner can be changed the way a side could,
// the choices are ranked against what the day still needs, the day's totals
// are worked again, a household's plates of their own come off once the
// shared dish fits everybody, and no sentence passes a verdict.
//
// USAGE
//   node scripts/test_meal_swap.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

// lib/db.ts and the reading corpus reach expo-sqlite and thousands of
// entries; nothing the swap does touches either, so both are stood in for.
const stub = new Proxy({}, { get: (_target, key) => (key === '__esModule' ? false : () => null) });
const cache = new Map();
function load(rel) {
  const file = path.join(ROOT, rel);
  if (cache.has(file)) return cache.get(file).exports;
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(file, module);
  cache.set(file, mod);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod.require = (request) => {
    if (request === './db' || request === './digest') return stub;
    if (request.startsWith('./')) {
      const base = path.join(path.dirname(rel), request);
      const candidate = fs.existsSync(path.join(ROOT, base + '.ts')) ? base + '.ts' : path.join(base, 'index.ts');
      return load(candidate);
    }
    return Module.prototype.require.call(mod, request);
  };
  mod._compile(out, file);
  return mod.exports;
}

const M = load('lib/dailyMealPlan.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|good for|should|must|healthy|unhealthy|real|genuine|genuinely|guarantee|better|worse)\b|[–—]| -- /i;
const sentences = [];

// Two targets: fibre and vitamin C, 30 g and 90 mg.
const dri = (code, amount) => ({ nutrientCode: code, displayName: code === 'fiber' ? 'Fiber' : 'Vitamin C', unit: code === 'fiber' ? 'g' : 'mg', valueType: 'RDA', amount, upperLimit: null });
const driByCode = new Map([
  ['fiber', dri('fiber', 30)],
  ['vitc', dri('vitc', 90)],
]);
function dish(id, totals, carbs = 20, extra = {}) {
  return {
    entry: { id: 'e-' + id, linkedCuratedRecipeId: id, title: 'Dish ' + id, recipeCard: { dietTags: extra.dietTags ?? [] }, ...extra.entry },
    carbGrams: carbs,
    nutrientTotals: totals,
  };
}
const oats = dish('oats', { fiber: 4, vitc: 0 });
const berryOats = dish('berryoats', { fiber: 9, vitc: 40 });
const toast = dish('toast', { fiber: 1, vitc: 0 });
const stew = dish('stew', { fiber: 6, vitc: 10 });
const lentilStew = dish('lentils', { fiber: 14, vitc: 20 });
const pasta = dish('pasta', { fiber: 2, vitc: 2 });
const salmon = dish('salmon', { fiber: 1, vitc: 0 });
const greens = dish('greens', { fiber: 5, vitc: 30 });

const pools = {
  breakfastCandidates: [oats, berryOats, toast],
  lunchMainCandidates: [stew, lentilStew, pasta],
  dinnerMainCandidates: [salmon, lentilStew],
  sideCandidates: [greens],
  saladCandidates: [],
  beverageCandidates: [],
  driRows: [...driByCode.values()],
  driByCode,
  baseDriByCode: driByCode,
  everyDayOverrides: [],
  weekdayOverrides: [],
  profileIncomplete: false,
  myUnsureFoodsByRecipeId: new Map(),
};
const handle = { pools, conditionCodes: [] };
const pick = (c, role) => ({ entry: c.entry, role, carbGrams: c.carbGrams, nutrientTotals: c.nutrientTotals });

function makeDay() {
  const picks = [pick(oats, 'main'), pick(stew, 'main'), pick(greens, 'side'), pick(salmon, 'main')];
  const totals = {};
  let carbs = 0;
  for (const p of picks) {
    carbs += p.carbGrams;
    for (const [k, v] of Object.entries(p.nutrientTotals)) totals[k] = (totals[k] ?? 0) + v;
  }
  return {
    breakfast: picks[0],
    lunch: [picks[1], picks[2]],
    dinner: [picks[3]],
    healthRating: 'green',
    nutrientTotals: totals,
    nutrientCoverage: [],
    totalCarbGrams: carbs,
    carbCeiling: null,
    warnings: [],
    date: '2026-09-28',
  };
}

// --- 1. Breakfast ------------------------------------------------------------
const day = makeDay();
ok(M.mealPlate(day, 'breakfast').length === 1 && M.mealPlate(day, 'lunch').length === 2, 'mealPlate reads breakfast as one dish');
const breakfast = M.plateSwapOptions(handle, day, 'breakfast', 'main');
ok(breakfast.choices[0].current && breakfast.choices[0].entry.linkedCuratedRecipeId === 'oats', 'the breakfast there now comes first');
ok(breakfast.choices[1].entry.linkedCuratedRecipeId === 'berryoats', 'then the one that brings the day nearest its targets');
ok(breakfast.choices.length === 3, 'every breakfast in the pool is offered');
for (const choice of breakfast.choices) sentences.push(choice.effect, ...choice.cautions);
const swapped = M.applyPlateSwap(handle, day, 'breakfast', 'main', breakfast.choices[1]);
ok(swapped.breakfast.entry.linkedCuratedRecipeId === 'berryoats' && swapped.breakfast.role === 'main', 'the new breakfast is on the day');
ok(swapped.nutrientTotals.fiber === day.nutrientTotals.fiber - 4 + 9, 'the day totals are worked again');
ok(swapped.nutrientTotals.vitc === day.nutrientTotals.vitc + 40, 'every nutrient, not only one');
ok(swapped.lunch === day.lunch && swapped.dinner === day.dinner, 'the other meals are left alone');
ok(day.breakfast.entry.linkedCuratedRecipeId === 'oats', 'the day it was worked from is not changed');

// --- 2. A main dish ------------------------------------------------------------
const lunch = M.plateSwapOptions(handle, swapped, 'lunch', 'main');
ok(lunch.choices[0].entry.linkedCuratedRecipeId === 'stew', 'the lunch main there now comes first');
ok(lunch.choices[1].entry.linkedCuratedRecipeId === 'lentils', 'then the nearest the targets');
const dinner = M.plateSwapOptions(handle, swapped, 'dinner', 'main');
ok(!dinner.choices.some((c) => !c.current && c.entry.linkedCuratedRecipeId === 'stew'), 'a dinner is chosen from the dinner mains');
const lunchSwapped = M.applyPlateSwap(handle, swapped, 'lunch', 'main', lunch.choices[1]);
ok(lunchSwapped.lunch[0].entry.linkedCuratedRecipeId === 'lentils' && lunchSwapped.lunch[1].role === 'side', 'the main is traded and the side stays beside it');
ok(lunchSwapped.lunch.length === 2, 'nothing is added, only traded');
const lentilsTaken = M.plateSwapOptions(handle, lunchSwapped, 'dinner', 'main');
ok(!lentilsTaken.choices.some((c) => !c.current && c.entry.linkedCuratedRecipeId === 'lentils'), 'a dish on the day already is not offered again');
ok(lentilsTaken.notes.length === 1, 'with nothing else to offer, the scroller says so');
sentences.push(...lentilsTaken.notes, ...lunch.notes);

// --- 3. A household --------------------------------------------------------------
function eater(id, name, extra = {}) {
  return { id, name, isYou: false, conditionCodes: [], dietTags: [], allergies: [], restrictions: [], portion: 'regular', soft: false, awayMeals: [], livesFrom: null, livesUntil: null, ageGroup: null, sex: null, ...extra };
}
const you = eater('you', 'You', { isYou: true });
const sam = eater('sam', 'Sam', { soft: true });
const lee = eater('lee', 'Lee', { awayMeals: ['lunch'] });
const houseHandle = { pools, conditionCodes: [], eaters: [you, sam, lee] };
const houseDay = makeDay();
houseDay.household = {
  meals: {
    breakfast: { names: ['you', 'Sam', 'Lee'], servings: 3 },
    lunch: { names: ['you'], servings: 1 },
    dinner: { names: ['you', 'Sam', 'Lee'], servings: 3 },
  },
  plates: [
    { meal: 'lunch', forId: 'sam', forName: 'Sam', pick: pick(pasta, 'main'), reason: 'own', note: 'x', servings: 1 },
    { meal: 'dinner', forId: 'lee', forName: 'Lee', pick: pick(greens, 'side'), reason: 'gap', note: 'y', servings: 1 },
  ],
  notes: ['Dish pasta for Sam has nuts in it; chop, mash or cook it softer.', 'Dinner has nuts in it; for Sam, chop, mash or cook it softer.'],
};
const houseLunch = M.plateSwapOptions(houseHandle, houseDay, 'lunch', 'main');
const foldNote = houseLunch.notes.find((note) => note.includes('Sam'));
ok(!!foldNote, 'the scroller says a new main would be made for the person with a plate of their own');
sentences.push(...houseLunch.notes);
const folded = M.applyPlateSwap(houseHandle, houseDay, 'lunch', 'main', houseLunch.choices.find((c) => !c.current));
ok(!folded.household.plates.some((p) => p.meal === 'lunch' && p.reason === 'own'), 'the plate of their own comes off');
ok(folded.household.plates.some((p) => p.reason === 'gap'), 'a side for a gap at another meal stays');
ok(JSON.stringify(folded.household.meals.lunch.names) === '["you","Sam"]', 'everybody home for lunch eats it; Lee is away');
ok(folded.household.meals.lunch.servings === 2, 'servings follow who is eating');
ok(!folded.household.notes.some((n) => n.startsWith('Dish pasta for Sam')), 'the note about the plate that came off goes with it');
ok(folded.household.notes.includes('Dinner has nuts in it; for Sam, chop, mash or cook it softer.'), 'notes about another meal stay');
ok(houseDay.household.plates.length === 2, 'the day it was worked from is not changed');
const sideOnly = M.applyPlateSwap(houseHandle, houseDay, 'lunch', 'side', { entry: greens.entry, carbGrams: 20, nutrientTotals: greens.nutrientTotals, current: false, effect: '', cautions: [] });
ok(sideOnly.household.plates.length === 2, 'trading a side leaves the plates of their own alone');

// --- 4. The words ------------------------------------------------------------------
const src = fs.readFileSync(path.join(ROOT, 'app/(tabs)/schedule.tsx'), 'utf8');
ok(src.includes("meal=\"breakfast\" role=\"main\""), 'the breakfast row opens the scroller');
ok(src.includes("main: 'main dish'"), 'the scroller names a main dish');
sentences.push('Choose a different breakfast', 'Choose a different main dish');
ok(sentences.length >= 6, 'enough sentences were gathered to sweep');
for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + String(text).slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
