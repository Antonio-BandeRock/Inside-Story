/* global __dirname */
// Checks use-by dates on what is in the kitchen (H2, 2026-09-28): the
// arithmetic and sentences in lib/useBy.ts, the draw order in
// lib/groceryList.ts, a grocery list not counting on stock past its date,
// the meal plan generator reaching for dated stock first, and that no
// sentence calls food spoiled, safe or anything else the app cannot see.
//
// USAGE
//   node scripts/test_use_by.js
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

const U = load('lib/useBy.ts');
const G = load('lib/groceryList.ts');
const H = load('lib/onHand.ts');

let failures = 0;
function ok(condition, label) {
  if (condition) console.log('  ok  ' + label);
  else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

const FORBIDDEN =
  /\b(safe|unsafe|spoiled|spoilt|rotten|gone off|bad|fine|should|must|expired|dangerous|good|enough|already|real|genuine|genuinely)\b|[–—]| -- /i;
const sentences = [];
function clean(text) {
  if (text != null) sentences.push(text);
  return text;
}

const TODAY = '2026-09-28';

// --- 1. lib/useBy.ts ---------------------------------------------------------
ok(U.localToday(new Date(2026, 8, 28, 23, 30)) === TODAY, 'a late evening is still the local day');
ok(U.shiftUseByDay(TODAY, 4) === '2026-10-02' && U.shiftUseByDay(TODAY, -28) === '2026-08-31', 'days shift across months');
ok(U.isUseByDate('2026-10-02') && !U.isUseByDate('Oct 2') && !U.isUseByDate(null) && !U.isUseByDate(''), 'only a YYYY-MM-DD value is a date');
ok(U.daysUntilUseBy('2026-10-02', TODAY) === 4 && U.daysUntilUseBy(TODAY, TODAY) === 0 && U.daysUntilUseBy('2026-09-26', TODAY) === -2, 'days until counts whole days');
ok(U.daysUntilUseBy(null, TODAY) === null, 'no date, no count');
ok(!U.isPastUseBy(TODAY, TODAY) && U.isPastUseBy('2026-09-27', TODAY), 'the day itself is not past; the day before is');
ok(U.formatUseByDay('2026-10-02') === 'Oct 2', 'a short month and day');
ok(clean(U.describeUseBy(TODAY, TODAY)) === 'Use by today', 'on the day');
ok(clean(U.describeUseBy('2026-09-29', TODAY)) === 'Use by tomorrow', 'the day before');
ok(clean(U.describeUseBy('2026-10-02', TODAY)) === 'Use by Oct 2, in 4 days', 'a few days out');
ok(clean(U.describeUseBy('2026-11-20', TODAY)) === 'Use by Nov 20', 'far out, just the date');
ok(clean(U.describeUseBy('2026-09-27', TODAY)).includes('was yesterday'), 'past by a day');
ok(clean(U.describeUseBy('2026-09-20', TODAY)).includes('was 8 days ago'), 'past by several days');
ok(U.describeUseBy(null, TODAY) === null, 'no date, no line');

const items = [
  { name: 'milk', useBy: '2026-09-30' },
  { name: 'rice', useBy: null },
  { name: 'yogurt', useBy: '2026-09-25' },
  { name: 'cheese', useBy: '2026-10-20' },
  { name: 'spinach', useBy: '2026-10-01' },
];
const soon = U.selectUseSoon(items, (item) => item.useBy, TODAY).map((item) => item.name);
ok(JSON.stringify(soon) === '["yogurt","milk","spinach"]', 'Use Soon: past first, then soonest, nothing undated or far out');
ok(U.describeUseSoonCount(0, 0) === null, 'no heading with nothing in the band');
clean(U.describeUseSoonCount(1, 0));
clean(U.describeUseSoonCount(3, 1));
clean(U.describeUseSoonCount(1, 1));
clean(U.describeUseSoonCount(4, 2));
ok(U.describeUseSoonCount(3, 1) === '2 things to use in the next 3 days, and 1 past its date', 'the heading counts both kinds');

const choices = U.choicesForUseBy(TODAY);
ok(choices.length === 4 && choices[0].date === '2026-10-01' && choices[1].date === '2026-10-05', 'quick choices are days from today');
for (const choice of choices) clean(choice.label);
ok(JSON.stringify(U.parseUseByInput('', TODAY)) === '{"date":null}', 'empty text is no date');
ok(U.parseUseByInput(' 5 ', TODAY).date === '2026-10-03', 'a number is days from today');
ok(U.parseUseByInput('2026-10-09', TODAY).date === '2026-10-09', 'a typed date is kept');
ok(U.parseUseByInput('next tuesday', TODAY) === null && U.parseUseByInput('2026-13-40', TODAY) === null, 'anything else is not guessed at');
ok(U.soonestUseBy(['2026-10-10', null, '2026-09-30', '2026-09-20'], TODAY, 7) === '2026-09-30', 'soonest counts only dates from today on');
ok(U.soonestUseBy(['2026-10-10'], TODAY, 7) === null, 'a date past the window does not count');

// --- 2. Draw order and a grocery list -----------------------------------------
const ordered = G.soonestFirstOrder([
  { id: 'a', source: 'kitchen', quantity: 1, unit: 'g', date: '2026-09-01' },
  { id: 'b', source: 'kitchen', quantity: 1, unit: 'g', date: '2026-09-20', useBy: '2026-10-05' },
  { id: 'c', source: 'kitchen', quantity: 1, unit: 'g', date: '2026-09-25', useBy: '2026-09-30' },
  { id: 'd', source: 'kitchen', quantity: 1, unit: 'g', date: '2026-08-01' },
]).map((entry) => entry.id);
ok(JSON.stringify(ordered) === '["c","b","d","a"]', 'dated stock first, soonest first, then oldest first');

const shelf = [
  { id: 'k1', source: 'kitchen', quantity: 200, unit: 'g', date: '2026-09-01', useBy: '2026-09-20' },
  { id: 'k2', source: 'kitchen', quantity: 100, unit: 'g', date: '2026-09-10' },
];
const hold = G.holdFromKitchen(250, 'g', shelf, TODAY);
ok(hold && hold.level === 'some' && Math.abs(hold.held - 100) < 1e-9 && Math.abs(hold.toBuy - 150) < 1e-9, 'stock past its date is not held against a list');
ok(shelf[0].quantity === 200, 'and it stays on the ledger, untouched');
const dated = [
  { id: 'k3', source: 'kitchen', quantity: 100, unit: 'g', date: '2026-09-01' },
  { id: 'k4', source: 'kitchen', quantity: 100, unit: 'g', date: '2026-09-20', useBy: '2026-09-30' },
];
G.holdFromKitchen(100, 'g', dated, TODAY);
ok(dated[1].quantity === 0 && dated[0].quantity === 100, 'a list draws the dated stock before the older undated stock');

// --- 3. The meal plan generator ------------------------------------------------
const kitchen = {
  oats: [{ id: 'k5', source: 'kitchen', quantity: 500, unit: 'g', date: '2026-09-01' }],
  spinach: [{ id: 'k6', source: 'kitchen', quantity: 200, unit: 'g', date: '2026-09-25', useBy: '2026-10-01' }],
  lentils: [{ id: 'k7', source: 'kitchen', quantity: 400, unit: 'g', date: '2026-09-01', useBy: '2026-09-20' }],
};
const rows = [
  { recipeId: 'porridge', category: 'Grain', baseName: 'Oats', quantity: 50, unit: 'g', servings: 1 },
  { recipeId: 'saag', category: 'Veg', baseName: 'Spinach', quantity: 100, unit: 'g', servings: 1 },
  { recipeId: 'saag', category: 'Spice', baseName: 'Cumin', quantity: 1, unit: 'tsp', servings: 1 },
  { recipeId: 'saag', category: 'Veg', baseName: 'Onion', quantity: 50, unit: 'g', servings: 1 },
  { recipeId: 'dal', category: 'Legumes', baseName: 'Lentils', quantity: 100, unit: 'g', servings: 1 },
];
const dishes = H.onHandByRecipe(rows, (row) => kitchen[row.baseName.toLowerCase()] ?? [], TODAY);
ok(!dishes.has('dal'), 'a dish whose only stock is past its date is not leaned on');
const lean = H.newOnHandLean(dishes, TODAY);
ok(JSON.stringify(H.leanTowardOnHand(['porridge', 'saag', 'dal'], (x) => x, lean)) === '["saag"]', 'a dish using stock with a date this week leads one the kitchen covers more of');
H.claimOnHand(lean, 'saag', 'Saag');
ok(lean.claims[0].dated && lean.claims[0].dated[0].useBy === '2026-10-01', 'the claim keeps the date it was picked for');
const line = clean(H.onHandDayLine(lean.claims));
ok(line === 'Uses what is in your kitchen: Saag (spinach; spinach to use by Oct 1).', 'the day line says why it came first');
H.claimOnHand(lean, 'saag', 'Saag');
ok(JSON.stringify(H.leanTowardOnHand(['porridge', 'saag'], (x) => x, lean)) === '["porridge"]', 'once the spinach is spoken for, the next day leans elsewhere');
clean(H.ON_HAND_SWITCH_HELP);

// --- 4. The words ---------------------------------------------------------------
// The reminder and screen sentences, read out of their source files.
const reminderSrc = fs.readFileSync(path.join(ROOT, 'lib/reminderSchedule.ts'), 'utf8');
const prefSrc = fs.readFileSync(path.join(ROOT, 'lib/reminderPreferences.ts'), 'utf8');
const kitchenSrc = fs.readFileSync(path.join(ROOT, 'components/KitchenSection.tsx'), 'utf8');
for (const match of reminderSrc.matchAll(/kind === 'useBy'\) return ([^\n]+)/g)) clean(match[1]);
for (const match of prefSrc.matchAll(/useBy:\s*\n?\s*'([^']+)'/g)) clean(match[1]);
for (const match of kitchenSrc.matchAll(/USE_BY_HELP = '([^']+)'/g)) clean(match[1]);
for (const text of ['Use soon', 'Give it a use-by date', 'Change the use-by date', 'Clear the date', 'Use by? (you can leave this blank)', 'Use by? (empty it to clear the date)']) {
  ok(kitchenSrc.includes(text), 'the Kitchen carries: ' + text);
  clean(text);
}
ok(sentences.length > 25, 'enough sentences were gathered to sweep');
for (const text of sentences) ok(!FORBIDDEN.test(text), 'no verdict words or dashes: ' + text.slice(0, 70));

console.log(failures === 0 ? `\nAll passed (${sentences.length} sentences swept).` : `\n${failures} failed.`);
if (failures > 0) process.exit(1);
