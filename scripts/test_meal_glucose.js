// Runs lib/mealGlucose.ts, glucose around each meal: F10, 2026-10-01.
//
// The rules checked:
//
//  1. The level before is the last reading in the hour before the meal;
//     no reading there means the meal cannot be read, never a rise of 0.
//  2. The highest reading is found in the three hours after, cut at the
//     next meal, and the rise is the highest minus the level before.
//  3. Back means within 0.3 mmol/L of the level before; a meal eaten first
//     says so, readings that stop say so, and staying up says so.
//  4. A drink does not close another meal's window.
//  5. The wiring: Trends > Body Signals and Insights > Signals Today carry
//     the band, and the clinical-claims audit reads the module.
//  6. No dashes and no verdict or cause words in anything said.
//
// Run with: node scripts/test_meal_glucose.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) return {};
    if (name === './db') throw new Error(`${relPath} reaches the database`);
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const G = load('lib/mealGlucose.ts');
const T = load('lib/trendsMore.ts');
const I = load('lib/insightsMore.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

const MIN = 60000;
const BASE = new Date(2026, 8, 30, 8, 0).getTime();
function meal(id, minutes, mealType = 'breakfast', name = 'Oatmeal') {
  const at = BASE + minutes * MIN;
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    id,
    name,
    mealType,
    at,
    day: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    clock: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
// Readings every 15 minutes from `from` to `to` minutes after BASE.
function series(from, to, fn, step = 15) {
  const out = [];
  for (let m = from; m <= to; m += step) out.push({ at: BASE + m * MIN, mmol: fn(m) });
  return out;
}
// Up from 5.2 to 7.3 at 45 minutes, back to 5.3 by 105.
const curve = (m) => {
  if (m <= 0) return 5.2;
  if (m <= 45) return 5.2 + (2.1 * m) / 45;
  if (m <= 105) return 7.3 - (2.0 * (m - 45)) / 60;
  return 5.3;
};

// 1. Before
{
  const r = G.readMealGlucose(meal('a', 0), series(-30, 360, curve), [meal('a', 0)]);
  check('read with readings around it', r.status === 'read');
  check('before is the reading at the meal', Math.abs(r.before - 5.2) < 1e-9);
  check('rise is peak minus before', Math.abs(r.rise - 2.1) < 1e-9);
  check('peak at 45 minutes', r.peakMinutes === 45);
  check('back at 105 minutes', r.back === 'back' && r.backMinutes === 105);
  const sentence = G.mealGlucoseCaption(r);
  check(
    `rise sentence: ${sentence}`,
    sentence.startsWith('Rose by 2.1 mmol/L (38 mg/dL), from 5.2 mmol/L (94 mg/dL) before to 7.3 mmol/L (132 mg/dL) 45 minutes after.'),
  );
  check(`back sentence: ${sentence}`, sentence.includes('Back to the level before 1 hour 45 minutes after the meal.'));

  const none = G.readMealGlucose(meal('a', 0), series(15, 360, curve), [meal('a', 0)]);
  check('no reading before means no_before', none.status === 'no_before');
  check('no_before says it cannot be worked out', /cannot be worked out/.test(G.riseSentence(none)));
  const old = G.readMealGlucose(meal('a', 0), [{ at: BASE - 90 * MIN, mmol: 5 }, ...series(15, 360, curve)], [meal('a', 0)]);
  check('a reading 90 minutes before is too old', old.status === 'no_before');
  const after = G.readMealGlucose(meal('a', 0), [{ at: BASE - 10 * MIN, mmol: 5 }], [meal('a', 0)]);
  check('nothing after means no_after', after.status === 'no_after');
}

// 2 and 3. Next meal, readings stop, not back, no rise
{
  const breakfast = meal('a', 0);
  const lunch = meal('b', 60, 'lunch', 'Soup');
  const r = G.readMealGlucose(breakfast, series(-30, 360, (m) => (m <= 0 ? 5.2 : 6.8)), [breakfast, lunch]);
  check('next meal closes the window', r.status === 'read' && r.back === 'next_meal' && r.nextMeal.id === 'b');
  check('peak is cut at the next meal', r.peakMinutes <= 60);
  check(`next meal sentence names it: ${G.backSentence(r)}`, /Lunch at 9:00 AM came before it was back/.test(G.backSentence(r)));

  const stop = G.readMealGlucose(breakfast, series(-30, 90, (m) => (m <= 0 ? 5.2 : 7)), [breakfast]);
  check('readings that stop say so', stop.back === 'readings_stop' && stop.lastReadingMinutes === 90);
  check('stop sentence', /readings stop 1 hour 30 minutes after the meal/.test(G.backSentence(stop)));

  const up = G.readMealGlucose(breakfast, series(-30, 400, (m) => (m <= 0 ? 5.2 : 7)), [breakfast]);
  check('staying up within five hours is not_back', up.back === 'not_back');
  check('not back sentence', G.backSentence(up) === 'Not back to the level before within 5 hours.');

  const flat = G.readMealGlucose(breakfast, series(-30, 360, (m) => (m <= 0 ? 5.2 : 5.0)), [breakfast]);
  check('no rise reads as did not rise', /^Did not rise above the level before/.test(G.riseSentence(flat)));
  check('no rise has no back sentence', G.backSentence(flat) === null);
}

// 4. A drink does not close the window
{
  const breakfast = meal('a', 0);
  const water = meal('w', 30, 'beverage', 'Water');
  const r = G.readMealGlucose(breakfast, series(-30, 360, curve), [breakfast, water]);
  check('a drink does not close the window', r.back === 'back' && r.backMinutes === 105);
  const all = G.readMealsGlucose([water, breakfast], series(-30, 360, curve));
  check('readMealsGlucose reads both in time order', all.length === 2 && all[0].meal.id === 'a');
  check('a meal far from readings is not near', !G.hasReadingsNear(meal('z', 2000), series(-30, 360, curve)));
}

// Counts and minutes
{
  check(
    'describeMinutes',
    G.describeMinutes(105) === '1 hour 45 minutes' && G.describeMinutes(60) === '1 hour' && G.describeMinutes(1) === '1 minute',
  );
  check(
    'count sentence',
    G.countSentence({ read: 3, noBefore: 1, noAfter: 0 }) ===
      '3 meals with readings before and after. 1 more could not be read: 1 with no reading in the hour before.',
  );
}

// 5. The views and the wiring
const views = [];
{
  const reads = [];
  for (let n = 0; n < 12; n++) {
    const start = n * 1440 - 20 * 1440;
    const m = meal(`m${n}`, start, 'lunch', 'Rice bowl');
    reads.push(G.readMealGlucose(m, series(start - 30, start + 360, (x) => curve(x - start) + n / 50), [m]));
  }
  reads.push({ status: 'no_before', meal: meal('nb', -1440, 'dinner', 'Pasta') });
  reads.sort((a, b) => a.meal.at - b.meal.at);
  const days = reads.map((r) => r.meal.day).sort();
  const range = { start: days[0], end: days[days.length - 1] };
  const readings = reads.flatMap((r) =>
    r.status === 'read' ? [{ signal: 'glucose', date: r.meal.day, at: new Date(r.meal.at).toISOString(), value: r.before }] : [],
  );
  const view = T.buildBodySignalsView({ range, readings, mealGlucose: reads });
  views.push(view);
  const ids = view.bands.map((b) => b.id);
  check('Body Signals has the meal band right after glucose', ids.indexOf('mealGlucose') === ids.indexOf('glucose') + 1);
  const band = view.bands.find((b) => b.id === 'mealGlucose');
  check(
    `band counts read and unread: ${band && band.lines[0]}`,
    band && band.lines[0].startsWith('12 meals with readings before and after. 1 more could not be read'),
  );
  check('band has a usual rise sentence', band && band.lines.some((l) => l.startsWith('The latest rise,')));
  check('band has weekly rows', band && band.rows.length > 0);
  check('band lists at most ten meals', band && band.items.length === 10);
  const without = T.buildBodySignalsView({ range, readings });
  check('no meal band without meals', !without.bands.some((b) => b.id === 'mealGlucose'));

  const today = reads[reads.length - 1].meal.day;
  const sig = I.buildSignalsView({ today, timeline: [], checkins: [], bloodPressure: [], mealGlucose: reads });
  views.push(sig);
  check('Signals Today shows with only glucose', sig.hasAnything && sig.bands.some((b) => b.id === 'mealGlucose'));
  const sigBand = sig.bands.find((b) => b.id === 'mealGlucose');
  check("Signals Today lists only today's meals", sigBand && sigBand.items.length === 1);
  const empty = I.buildSignalsView({ today, timeline: [], checkins: [], bloodPressure: [] });
  check('Signals Today empty without glucose', !empty.hasAnything);
}
{
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  check('Trends loader reads meal glucose', /listMealGlucose\(addDays\(range\.start, -90\), range\.end\)/.test(read('lib/trendsMoreDb.ts')));
  check('Insights loader reads meal glucose', /listMealGlucose\(today, today\)/.test(read('lib/insightsMoreDb.ts')));
  check('clinical-claims audit reads the module', read('scripts/audit_clinical_claims.js').includes("'lib/mealGlucose.ts'"));
  check('pure module never reaches the database', !/from '\.\/db'/.test(read('lib/mealGlucose.ts')));
}

// 6. Words
{
  const texts = [];
  const collect = (v) => {
    if (typeof v === 'string') texts.push(v);
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  collect(views);
  texts.push(G.MEAL_GLUCOSE_HOW, G.MEAL_GLUCOSE_LIMIT);
  const banned = [...READING_FORBIDDEN_WORDS, 'spike', 'because of', '—', '–', ' -- ', 'genuine', 'normal', 'healthy'];
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
    check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
  }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
