// Checks lib/fuelGaugeChoice.ts, the person's choice of nutrients for
// Home's Today's Fuel Gauges (G31): nothing stored means the nine the app
// starts with, an empty list stays empty rather than bringing the nine back,
// the order chosen is the order drawn, a nutrient with no target is left
// out, and every sentence is clear of verdicts.
// Run: node scripts/test_fuel_gauge_choice.js
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
const g = load('lib/fuelGaugeChoice.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|optimal|ideal|too low|not enough)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  swept += 1;
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text), text);
}

const NINE = [...g.DEFAULT_FUEL_GAUGE_CODES];
ok('nine to start with', NINE.length === 9);
ok('nothing stored is the nine', g.parseFuelGaugeChoice(null).join() === NINE.join());
ok('an unreadable row is the nine', g.parseFuelGaugeChoice('{oops').join() === NINE.join());
ok('not a list is the nine', g.parseFuelGaugeChoice('{"a":1}').join() === NINE.join());
ok('an empty choice stays empty', g.parseFuelGaugeChoice('[]').length === 0);
ok('repeats and junk dropped', g.parseFuelGaugeChoice('["iron","iron",3,"","fiber"]').join() === 'iron,fiber');
ok('round trip', g.parseFuelGaugeChoice(g.serializeFuelGaugeChoice(['fiber', 'iron', 'fiber'])).join() === 'fiber,iron');
ok('the nine read as the default', g.isDefaultFuelGaugeChoice(NINE));
ok('reordered is not the default', !g.isDefaultFuelGaugeChoice([...NINE].reverse()));

let list = g.addFuelGauge(['iron'], 'fiber');
ok('added at the end', list.join() === 'iron,fiber');
ok('adding twice keeps one', g.addFuelGauge(list, 'iron').join() === 'iron,fiber');
ok('moved earlier', g.moveFuelGauge(list, 'fiber', -1).join() === 'fiber,iron');
ok('past the start stays put', g.moveFuelGauge(list, 'iron', -1) === list);
ok('past the end stays put', g.moveFuelGauge(list, 'fiber', 1) === list);
ok('taken off', g.removeFuelGauge(list, 'iron').join() === 'fiber');

const entries = [
  { nutrientCode: 'iron', displayName: 'Iron' },
  { nutrientCode: 'fiber', displayName: 'Fiber' },
  { nutrientCode: 'potassium', displayName: 'Potassium' },
];
const drawn = g.pickFuelGauges(['fiber', 'no_target', 'iron'], entries);
ok('drawn in the order chosen, without a target left out', drawn.map((e) => e.nutrientCode).join() === 'fiber,iron', drawn);
const addable = g.addableFuelGauges(['iron'], entries);
ok('addable leaves out what is on', addable.map((o) => o.value).join() === 'fiber,potassium', addable);

clean('empty caption', g.fuelGaugeChoiceCaption([]));
clean('default caption', g.fuelGaugeChoiceCaption(NINE));
clean('one caption', g.fuelGaugeChoiceCaption(['iron']));
clean('several caption', g.fuelGaugeChoiceCaption(['iron', 'fiber']));
clean('empty line', g.FUEL_GAUGE_EMPTY_LINE);

// The key names nutrients, not hardware, so it travels between devices.
const sync = fs.readFileSync(path.join(__dirname, '..', 'lib', 'snapshotSync.ts'), 'utf8');
ok('the choice travels between devices', !sync.includes(g.FUEL_GAUGE_META_KEY));

console.log(failures === 0 ? `test_fuel_gauge_choice: all passed (${swept} sentences swept)` : `test_fuel_gauge_choice: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
