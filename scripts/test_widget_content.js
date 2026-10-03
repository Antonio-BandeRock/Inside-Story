// Checks lib/widgetContent.ts, the words on the seven home screen widgets
// (L2, rebuild R1): the next thing and the next dose skip what is done or
// past, read today then tomorrow, and count what is still unmarked; hiding
// health details turns a dose and an appointment into plain words and
// empties the fuel gauges; a gauge always says which source its amount came
// from, food first; the grocery list stops at its line budget and says how
// many more; a routine left more than 12 hours is history; every widget has
// a link into the app; and every sentence is swept for verdict words.
// Run: node scripts/test_widget_content.js
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
const w = load('lib/widgetContent.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too much|too many|too low|enough|deficien\w*|limit|over|under|excess\w*|great|well done|dangerous|diagnos\w*|missed|forgot\w*|streak)\b|[–—]| -- /i;
let swept = 0;
function clean(label, content) {
  for (const text of [content.heading, ...content.lines, content.caption]) {
    if (text == null) continue;
    swept += 1;
    ok(`${label} has no verdict words`, !FORBIDDEN.test(text), text);
  }
  ok(`${label} links into the app`, typeof content.uri === 'string' && content.uri.startsWith('hashimotosapp://'), content.uri);
}

// A fixed morning: 2026-10-02, 8:00 local.
const NOW = new Date(2026, 9, 2, 8, 0).getTime();
const at = (d, h, m = 0) => new Date(2026, 9, d, h, m).getTime();
const day = (ms) => w.localDayOf(ms);
const item = (kind, title, start, status = 'planned', allDay = false) => ({ kind, title, start, allDay, day: day(start), status });

// --- time words --------------------------------------------------------------
ok('clock', w.widgetClock(at(2, 8, 5)) === '8:05 AM', w.widgetClock(at(2, 8, 5)));
ok('clock noon', w.widgetClock(at(2, 12, 0)) === '12:00 PM');
ok('clock midnight', w.widgetClock(at(2, 0, 30)) === '12:30 AM');
ok('soon', w.whenWords(at(2, 8, 25), NOW) === 'in 25 minutes, at 8:25 AM', w.whenWords(at(2, 8, 25), NOW));
ok('later today', w.whenWords(at(2, 18, 30), NOW) === 'at 6:30 PM', w.whenWords(at(2, 18, 30), NOW));
ok('tomorrow', w.whenWords(at(3, 7), NOW) === 'tomorrow at 7:00 AM', w.whenWords(at(3, 7), NOW));

// --- Next thing --------------------------------------------------------------
const items = [
  item('dose', 'Levothyroxine 50 mcg', at(2, 6), 'overdue'),
  item('meal', 'Breakfast', at(2, 7), 'done'),
  item('checkin', 'How are you', at(2, 9)),
  item('appointment', 'Dr. Lee, endocrinology', at(2, 9, 30)),
  item('dose', 'Selenium', at(2, 12)),
  item('upkeep', 'Change the water filter', at(2, 0), 'planned', true),
];
let c = w.nextThingContent(items, NOW, false);
clean('next thing', c);
ok('next thing skips check-ins and all-day rows', c.lines[0] === 'Dr. Lee, endocrinology', c.lines);
ok('next thing says when', c.lines[1] === 'in 1 hour 30 min, at 9:30 AM', c.lines);
ok('next thing counts the unmarked dose', c.caption === '1 earlier thing today is not marked yet.', c.caption);
c = w.nextThingContent(items, NOW, true);
clean('next thing hidden', c);
ok('hidden appointment', c.lines[0] === 'An appointment', c.lines);
c = w.nextThingContent([], NOW, false);
clean('next thing empty', c);
ok('next thing empty words', c.lines[0] === 'Nothing else is planned for today or tomorrow.');
c = w.nextThingContent([item('meal', 'Dinner', at(4, 18))], NOW, false);
ok('two days out is not next', c.lines[0] === 'Nothing else is planned for today or tomorrow.', c.lines);

// --- Next dose ---------------------------------------------------------------
c = w.nextDoseContent(items, NOW, false);
clean('next dose', c);
ok('next dose is the noon dose', c.lines[0] === 'Selenium', c.lines);
ok('next dose opens Meds', c.uri === w.WIDGET_LINKS.meds);
c = w.nextDoseContent(items, NOW, true);
ok('hidden dose', c.lines[0] === 'A dose', c.lines);
ok('hidden dose never names the medicine', !JSON.stringify(c).includes('Selenium') && !JSON.stringify(c).includes('Levothyroxine'));
c = w.nextDoseContent([item('dose', 'Iron', at(3, 7))], NOW, false);
ok('dose tomorrow', c.lines[1] === 'tomorrow at 7:00 AM', c.lines);
clean('next dose empty', w.nextDoseContent([], NOW, false));

// --- Capture -----------------------------------------------------------------
clean('capture', w.captureContent());

// --- Grocery -----------------------------------------------------------------
clean('grocery none', w.groceryContent(null));
clean('grocery all ticked', w.groceryContent({ name: 'Saturday', stillToGet: [], total: 4 }));
ok('grocery empty list', w.groceryContent({ name: '', stillToGet: [], total: 0 }).lines[0] === 'Nothing on the list yet.');
const many = Array.from({ length: 9 }, (_, i) => `Item ${i + 1}`);
c = w.groceryContent({ name: 'Saturday', stillToGet: many, total: 12 });
clean('grocery long', c);
ok('grocery stops at its budget', c.lines.length === w.GROCERY_WIDGET_LINES, c.lines.length);
ok('grocery says how many more', c.caption === 'and 3 more still to get', c.caption);
c = w.groceryContent({ name: 'Saturday', stillToGet: ['Kale', 'Eggs'], total: 5 });
ok('grocery short caption', c.caption === '2 of 5 still to get', c.caption);

// --- Fuel gauges -------------------------------------------------------------
const g = (displayName, fromFood, fromSupplements, target, unit = 'mg') => ({ displayName, unit, fromFood, fromSupplements, target });
ok('all from food', w.gaugeLine(g('Iron', 8, 0, 18)) === 'Iron: 8 of 18 mg, all from food', w.gaugeLine(g('Iron', 8, 0, 18)));
ok('both sources, food first', w.gaugeLine(g('Vitamin D', 5, 15, 15, 'mcg')) === 'Vitamin D: 20 of 15 mcg, 5 from food and 15 from supplements');
ok('all from supplements', w.gaugeLine(g('B12', 0, 2.4, 2.4, 'mcg')).endsWith('all from supplements'));
ok('nothing logged is not zero eaten', w.gaugeLine(g('Zinc', 0, 0, 8)) === 'Zinc: 0 of 8 mg, nothing logged yet');
ok('small amounts keep a decimal', w.gaugeLine(g('B12', 1.25, 0, 2.4, 'mcg')).startsWith('B12: 1.3 of 2.4'));
const gauges = [g('Iron', 8, 0, 18), g('Zinc', 3, 0, 8), g('Selenium', 40, 0, 55, 'mcg'), g('Fibre', 12, 0, 28, 'g'), g('Calcium', 300, 0, 1000)];
c = w.fuelContent(gauges, false);
clean('fuel', c);
ok('fuel stops at its budget', c.lines.length === w.FUEL_WIDGET_LINES);
ok('fuel says how many more', c.caption === 'and 1 more on Home', c.caption);
c = w.fuelContent(gauges, true);
clean('fuel hidden', c);
ok('fuel hidden shows no amounts', !/\d/.test(c.lines.join(' ')), c.lines);
clean('fuel none chosen', w.fuelContent([], false));

// --- Routine step ------------------------------------------------------------
const run = { routineId: 'r1', routineName: 'Morning', startedAt: at(2, 7, 30), stepsTotal: 6, position: 2, step: 'Take the thyroid dose' };
c = w.routineStepContent(run, NOW);
clean('routine', c);
ok('routine says the step', c.lines[0] === 'Take the thyroid dose');
ok('routine counts from one', c.caption === 'Step 3 of 6', c.caption);
ok('routine opens the routine', c.uri === 'hashimotosapp://routine?id=r1', c.uri);
c = w.routineStepContent({ ...run, startedAt: NOW - 13 * 3600000 }, NOW);
ok('a walk left 13 hours is history', c.lines[0] === 'No routine in progress.', c.lines);
clean('routine none', w.routineStepContent(null, NOW));
ok('routine id is encoded', w.routineLink('a b&c') === 'hashimotosapp://routine?id=a%20b%26c');

// --- Glass -------------------------------------------------------------------
c = w.glassContent(at(2, 7, 45), NOW);
clean('glass', c);
ok('glass says the last one today', c.caption === 'Last one logged at 7:45 AM', c.caption);
ok('yesterday is not today', w.glassContent(at(1, 21), NOW).caption === 'Tap to log one now');
ok('glass failure is said', w.glassContent(null, NOW, 'Not logged. Open the app to log it.').caption === 'Not logged. Open the app to log it.');
ok('glass opens Hydration', c.uri === w.WIDGET_LINKS.hydration);

// --- names -------------------------------------------------------------------
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
const plugin = appJson.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'react-native-android-widget');
const declared = plugin ? plugin[1].widgets.map((x) => x.name).sort() : [];
ok('every widget in app.json has words, and every one with words is in app.json', JSON.stringify(declared) === JSON.stringify([...w.WIDGET_NAMES].sort()), declared);
ok('isWidgetName', w.isWidgetName('Glass') && !w.isWidgetName('Other'));
for (const [key, uri] of Object.entries(w.WIDGET_LINKS)) ok(`link ${key}`, uri.startsWith('hashimotosapp://'), uri);

// The switch's row must stay on this phone.
const syncSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'snapshotSync.ts'), 'utf8');
ok('widget_hide_health is device-local', syncSrc.includes(`'${w.WIDGET_HIDE_HEALTH_META_KEY}'`));

console.log(`${swept} sentences swept.`);
if (failures) {
  console.log(`${failures} failure(s).`);
  process.exit(1);
}
console.log('All widget content checks passed.');
