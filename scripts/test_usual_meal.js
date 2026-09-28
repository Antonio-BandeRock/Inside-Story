// Checks lib/usualMeal.ts: "Log your usual lunch?" appears only near a usual
// meal time, only when one meal is logged often enough in that slot to be
// called usual, never once the slot is logged, planned or put away for the
// day, and its sentences name what they counted against.
// Run: node scripts/test_usual_meal.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib/usualMeal.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
  throw new Error(`usualMeal.ts imported ${name}`);
});
const u = mod.exports;

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|well done|streak)\b|[–—]| -- /i;

// Lunches on the ten days before 2026-09-27: a salad on seven of them, soup
// on three, around 12:30.
const TODAY = '2026-09-27';
function day(n) {
  const d = new Date(`${TODAY}T12:00:00`);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const history = [];
for (let n = 1; n <= 10; n++) {
  const salad = n <= 7;
  history.push({
    id: `m${n}`,
    name: salad ? 'Chicken Salad' : 'Lentil Soup',
    mealType: 'lunch',
    eatenAt: `${day(n)}T12:${salad ? '30' : '10'}`,
  });
}
const base = {
  history,
  today: TODAY,
  nowTime: '12:15',
  usualTimes: { breakfast: null, lunch: '12:30', dinner: null },
  plannedToday: [],
  dismissed: null,
};

const s = u.usualMealSuggestion(base);
ok('offers the usual lunch', s && s.slot === 'lunch' && s.name === 'Chicken Salad', s);
ok('copies the latest one', s && s.sourceMealId === 'm1', s && s.sourceMealId);
ok('counts days', s && s.times === 7 && s.daysWithSlot === 10, s);
ok('usually at', s && s.usuallyAt === '12:30', s && s.usuallyAt);
ok('title', s && u.usualMealTitle(s) === 'Log your usual lunch?');

// The window.
ok('too early', u.usualMealSuggestion({ ...base, nowTime: '11:30' }) === null);
ok('45 minutes before opens', u.usualMealSuggestion({ ...base, nowTime: '11:45' }) !== null);
ok('late lunch still asked', u.usualMealSuggestion({ ...base, nowTime: '14:55' }) !== null);
ok('too late', u.usualMealSuggestion({ ...base, nowTime: '15:05' }) === null);
ok('no usual time and too few logged times', u.usualMealSuggestion({ ...base, usualTimes: { breakfast: null, lunch: null, dinner: null }, history: history.slice(0, 2) }) === null);
const fromHistory = u.usualMealSuggestion({ ...base, usualTimes: { breakfast: null, lunch: null, dinner: null } });
ok('usual time from the logged times', fromHistory && fromHistory.slot === 'lunch', fromHistory);

// Silence.
ok('lunch already logged today', u.usualMealSuggestion({ ...base, history: [...history, { id: 't', name: 'Toast', mealType: 'lunch', eatenAt: `${TODAY}T12:05` }] }) === null);
ok('breakfast logged today does not silence lunch', u.usualMealSuggestion({ ...base, history: [...history, { id: 't', name: 'Oats', mealType: 'breakfast', eatenAt: `${TODAY}T08:05` }] }) !== null);
ok('lunch planned today', u.usualMealSuggestion({ ...base, plannedToday: ['lunch'] }) === null);
ok('not today pressed', u.usualMealSuggestion({ ...base, dismissed: u.dismissKeyFor(TODAY, 'lunch') }) === null);
ok('not today yesterday does not carry', u.usualMealSuggestion({ ...base, dismissed: u.dismissKeyFor(day(1), 'lunch') }) !== null);

// What counts as usual.
const rotation = [];
for (let n = 1; n <= 12; n++) rotation.push({ id: `r${n}`, name: ['A', 'B', 'C', 'D'][n % 4], mealType: 'lunch', eatenAt: `${day(n)}T12:30` });
ok('a rotation of four offers none', u.usualMealSuggestion({ ...base, history: rotation }) === null);
ok('twice is not usual', u.usualMealSuggestion({ ...base, history: history.slice(0, 2) }) === null);
const twiceADay = [...history, { id: 'x', name: 'Chicken Salad', mealType: 'lunch', eatenAt: `${day(1)}T13:00` }];
const once = u.usualMealSuggestion({ ...base, history: twiceADay });
ok('two on one day count once', once && once.times === 7, once && once.times);
const old = history.map((row, i) => ({ ...row, eatenAt: `${day(30 + i)}T12:30` }));
ok('older than four weeks is not counted', u.usualMealSuggestion({ ...base, history: old }) === null);
ok('case of the name does not split it', (() => {
  const mixed = history.map((row) => (row.id === 'm2' ? { ...row, name: 'chicken salad' } : row));
  const r = u.usualMealSuggestion({ ...base, history: mixed });
  return r && r.times === 7;
})());

// Snacks are never offered.
const snacks = [1, 2, 3, 4, 5].map((n) => ({ id: `s${n}`, name: 'Apple', mealType: 'snack', eatenAt: `${day(n)}T15:30` }));
ok('snacks never offered', u.usualMealSuggestion({ ...base, history: snacks, nowTime: '15:30' }) === null);

// Sentences.
const caption = u.usualMealCaption(s);
ok('caption names both counts', caption.includes('7 of the 10 days'), caption);
ok('caption names the time', caption.includes('12:30pm'), caption);
ok('logged sentence', u.usualMealLoggedSentence('Chicken Salad', '12:40') === 'Chicken Salad logged at 12:40pm.');
for (const sentence of [u.usualMealTitle(s), caption, u.usualMealLoggedSentence('Soup', '18:05'), u.USUAL_MEAL_TRIAL_NOTE]) {
  ok(`forbidden words: ${sentence}`, !FORBIDDEN.test(sentence));
}

// Home wiring.
const home = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/index.tsx'), 'utf8');
ok('Home asks for content first', home.includes("if (!homeSectionHasContent('usualMeal')"));
ok('Home renders it', /case 'usualMeal':\s+return renderUsualMeal\(\);/.test(home));
const prefs = fs.readFileSync(path.join(__dirname, '..', 'lib/visualPreferences.ts'), 'utf8');
ok('toggle registered', prefs.includes("usualMeal: 'Your Usual Meal'"));

if (failures > 0) {
  console.log(`${failures} failed`);
  process.exit(1);
}
console.log('test_usual_meal: all passed');
