// Checks lib/hydrationIndex.ts (G36): each drink is matched to what the
// Beverage Hydration Index trial measured for it and nothing more, a drink
// the trial did not test gets no figure, the water target moves only with
// logged activity and counts one workout once, and every sentence is swept
// for verdict words.
// Run: node scripts/test_hydration_index.js
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
const hx = load('lib/hydrationIndex.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
// "over four hours" and "a fluid limit" are the trial's method and a
// clinician's figure, so those two words are left off this list.
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too much|too little|enough|excess\w*|great|well done|dangerous|dehydrat\w*|diagnos\w*|better|worse)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  // The trial's participants are described as the paper describes them.
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text.replace('72 healthy young men', '72 young men')), text);
}

// --- Matching -----------------------------------------------------------------
const cases = [
  ['Water, filtered or bottled', 'water', '1'],
  ['Coffee, brewed', 'coffee', null],
  ['Coffee, brewed, decaffeinated', 'coffee', null],
  ['Tea, black, brewed', 'tea', null],
  ['Tea, green, brewed', 'tea', null],
  ['Milk, whole, 3.25% milkfat', 'whole-milk', '1.50'],
  ['Milk, nonfat, fluid', 'skim-milk', '1.58'],
  ['Milk, reduced fat, 2%', 'milk', '1.50 to 1.58'],
  ['Oral rehydration solution', 'ors', '1.54'],
  ['Beverages, carbonated, cola', 'cola', null],
  ['Water, bottled, sparkling', 'sparkling-water', null],
  ['Beer, regular', 'lager', null],
];
for (const [name, key, index] of cases) {
  const found = hx.drinkIndexFor(name);
  ok(`${name} matches ${key}`, found && found.key === key, found);
  if (found) ok(`${name} index`, found.index === index, found.index);
}
for (const name of ['Almond milk', 'Soy milk', 'Coconut water', 'Orange juice', 'Root beer', 'Chocolate milk', 'Kombucha', 'Tonic water']) {
  ok(`${name} gets no figure`, hx.drinkIndexFor(name) === null, hx.drinkIndexFor(name));
}
{
  const lines = hx.drinkIndexLines(['Coffee, brewed', 'Coffee, brewed', 'Coffee, brewed, decaffeinated', 'Kombucha', '  ', 'Water, filtered or bottled']);
  ok('one line per kind', lines.found.map((e) => e.key).join(',') === 'coffee,water', lines.found);
  ok('untested named once', lines.untested.join('|') === 'Kombucha', lines.untested);
  for (const entry of lines.found) {
    clean(`${entry.key} label`, entry.label);
    clean(`${entry.key} line`, entry.line);
  }
}
for (const [name] of cases) clean(`${name} line`, hx.drinkIndexFor(name).line);
clean('index caption', hx.DRINK_INDEX_CAPTION);
ok('caption names the trial', /Maughan/.test(hx.DRINK_INDEX_CAPTION) && /72 healthy young men/.test(hx.DRINK_INDEX_CAPTION));
ok('caption says the total is unchanged', /does not change it/.test(hx.DRINK_INDEX_CAPTION));

// --- The moving target ----------------------------------------------------------
ok('no activity adds nothing', hx.activityWaterMl(0) === 0 && hx.activityWaterMl(NaN) === 0 && hx.activityWaterMl(-10) === 0);
ok('an hour adds 500', hx.activityWaterMl(60) === 500);
ok('30 minutes adds 250', hx.activityWaterMl(30) === 250);
ok('rounded to 50', hx.activityWaterMl(20) === 150, hx.activityWaterMl(20));
ok('heat is zero until F22', hx.heatWaterMl() === 0);
{
  const none = hx.activeMinutesToday([], []);
  ok('no activity', none.minutes === 0 && none.source === null);
  const health = hx.activeMinutesToday([30, 15], [40]);
  ok('the larger total, counted once', health.minutes === 45 && health.source === 'health', health);
  const logged = hx.activeMinutesToday([20], [30, 30]);
  ok('logged when larger', logged.minutes === 60 && logged.source === 'logged', logged);
  ok('bad values ignored', hx.activeMinutesToday([NaN, -5], [null]).minutes === 0);
}
{
  const flat = hx.movedWaterTarget(2700, { minutes: 0, source: null });
  ok('no activity leaves the target', flat.targetMl === 2700 && flat.line === null, flat);
  const moved = hx.movedWaterTarget(2700, { minutes: 90, source: 'health' });
  ok('90 minutes adds 750', moved.targetMl === 3450 && moved.activityMl === 750, moved);
  ok('line', moved.line === 'Includes 750 ml for 1 hour 30 minutes of activity from Health Connect.', moved.line);
  clean('moved line', moved.line);
  const logged = hx.movedWaterTarget(2000, { minutes: 30, source: 'logged' });
  ok('logged line', logged.line === 'Includes 250 ml for 30 minutes of activity you logged.', logged.line);
  clean('logged line', logged.line);
  const noBase = hx.movedWaterTarget(0, { minutes: 60, source: 'logged' });
  ok('no base target stays at none', noBase.targetMl === 0 && noBase.line === null, noBase);
  clean('two hours', hx.movedWaterTarget(2000, { minutes: 120, source: 'health' }).line);
}
clean('moved caption', hx.MOVED_TARGET_CAPTION);
ok('caption names the source', /American College of Sports Medicine/.test(hx.MOVED_TARGET_CAPTION));
ok('caption puts a clinician first', /clinician/.test(hx.MOVED_TARGET_CAPTION));
ok('caption says a working figure', /working figure/.test(hx.MOVED_TARGET_CAPTION));

console.log(failures === 0 ? `test_hydration_index: all passed (${swept} sentences swept)` : `test_hydration_index: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
