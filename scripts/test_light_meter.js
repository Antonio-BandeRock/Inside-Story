/* global __dirname */
// Checks lib/lightMeter.ts, the arithmetic and the words behind measuring
// light with the phone's own sensor on Garden > Growing Conditions (I3,
// 1.0.55.17): the middle of a few seconds of samples, how a figure is
// written, what else reads about the same, and that nothing tells anybody
// their light is enough or not enough.
//
// USAGE
//   node scripts/test_light_meter.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'lib/lightMeter.ts');
const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = new Module(file);
mod.filename = file;
mod._compile(out, file);
const M = mod.exports;

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.log('FAIL', label);
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

ok(M.summarizeLightSamples([]) === null, 'no samples, no figure');
ok(M.summarizeLightSamples([NaN, -3]) === null, 'nothing usable, no figure');
ok(same(M.summarizeLightSamples([300, 100, 200]), { lux: 200, low: 100, high: 300, samples: 3 }), 'odd count takes the middle');
ok(M.summarizeLightSamples([100, 200, 300, 400]).lux === 250, 'even count takes the middle two');
ok(M.summarizeLightSamples([500, 510, 90000, 505, 495]).lux === 505, 'one wild sample does not move the figure');
ok(M.summarizeLightSamples([12.4, 12.6]).lux === 13, 'rounded to a whole lux');

ok(M.formatLux(12400) === '12,400 lux', 'thousands separated');
ok(M.formatLux(0) === '0 lux', 'zero reads as zero');

ok(/turned low/.test(M.describeLightLevel(10)), 'dim');
ok(/indoor lights/.test(M.describeLightLevel(400)), 'indoor');
ok(/overcast/.test(M.describeLightLevel(5000)), 'overcast');
ok(/out of direct sun/.test(M.describeLightLevel(20000)), 'daylight');
ok(/direct sun reads/.test(M.describeLightLevel(80000)), 'direct sun');
ok(/overcast/.test(M.describeLightLevel(1000)), 'a boundary goes to the brighter band');

const steady = M.describeMeasurement({ lux: 5000, low: 4900, high: 5100, samples: 15 });
ok(steady.startsWith('5,000 lux. '), 'measurement leads with the figure');
ok(!/moved between/.test(steady), 'a steady reading says nothing about spread');
const moving = M.describeMeasurement({ lux: 5000, low: 800, high: 20000, samples: 15 });
ok(/moved between 800 lux and 20,000 lux/.test(moving), 'a moving reading says so');

// Nothing grades the light or tells anybody what to do about it.
const forbidden = /\b(enough|too (low|high|dark|bright)|ideal|optimal|perfect|good|bad|poor|should|must|needs? more|needs? less)\b/i;
const sentences = [
  ...[0, 10, 400, 5000, 20000, 80000].map((lux) => M.describeLightLevel(lux)),
  steady,
  moving,
  M.LIGHT_METER_HOW,
  M.LIGHT_METER_LIMITS,
  M.LIGHT_METER_UNAVAILABLE,
];
for (const sentence of sentences) {
  ok(!forbidden.test(sentence), `no verdict words: ${sentence}`);
  ok(!/[–—]| -- /.test(sentence), `no dashes: ${sentence}`);
  ok(!/\b(real|genuine|genuinely)\b/i.test(sentence), `no filler: ${sentence}`);
}
ok(/iPhone/.test(M.LIGHT_METER_UNAVAILABLE), 'the unavailable line names the iPhone');
ok(/not a calibrated meter/.test(M.LIGHT_METER_LIMITS), 'the limits line says it is not calibrated');
ok(M.LIGHT_METER_DEVICE_NAME === "this phone's light sensor", 'where a saved reading came from');

console.log(`${passed} of ${passed + failed} checks pass`);
process.exit(failed === 0 ? 0 : 1);
