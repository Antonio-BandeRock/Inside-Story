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

// From lux to PPFD (1.0.55.18).
ok(M.luxToPpfd(54000, 'sun') === 1000, 'full sun: 54,000 lux is 1,000 PPFD');
ok(M.luxToPpfd(6700, 'white_led') === 100, 'white LED ratio 67');
ok(M.luxToPpfd(8200, 'hps') === 100, 'HPS ratio 82');
ok(M.luxToPpfd(7400, 'fluorescent') === 100, 'fluorescent ratio 74');
ok(M.luxToPpfd(7100, 'metal_halide') === 100, 'metal halide ratio 71');
ok(M.luxToPpfd(5000, 'incandescent') === 100, 'incandescent ratio 50');
ok(M.luxToPpfd(100, 'sun') === 1.9, 'a small figure keeps one decimal');
ok(M.luxToPpfd(5000, 'red_blue_led') === null, 'no ratio for red and blue light');
ok(M.meterFigure(12345.6, 'lux', null) === '12346', 'lux stays lux, whatever the light');
ok(M.meterFigure(54000, 'PPFD', 'sun') === '1000', 'PPFD is worked out, not left as lux');
ok(M.meterFigure(54000, 'PPFD', null) === null, 'PPFD with no light picked leaves the figure empty');
ok(M.meterFigure(54000, 'PPFD', 'red_blue_led') === null, 'PPFD under red and blue leaves the figure empty');
ok(/about 1000 µmol/.test(M.describePpfd(54000, 'sun')), 'the PPFD line gives the figure');
ok(/estimate/i.test(M.describePpfd(54000, 'sun')), 'the PPFD line says it is an estimate');
ok(/no general ratio/.test(M.describePpfd(5000, 'red_blue_led')), 'red and blue says why');
ok(/Pick the light/.test(M.describePpfd(5000, null)), 'no light asks for one');
ok(M.meterNote({ lux: 5000, unit: 'lux', source: 'sun', distance: '40', distanceUnit: 'cm' }) === '', 'the sun has no lamp height and lux needs no working');
ok(M.meterNote({ lux: 6700, unit: 'PPFD', source: 'white_led', distance: '45', distanceUnit: 'cm' }) === 'Worked out from 6,700 lux under white LED light, at 67 lux to one µmol. Lamp 45 cm above where it was read.', 'note keeps the working and the height');
ok(M.meterNote({ lux: 6700, unit: 'lux', source: 'white_led', distance: '', distanceUnit: 'in' }) === '', 'no height typed, nothing said');
ok(M.meterNote({ lux: 6700, unit: 'lux', source: 'hps', distance: '18', distanceUnit: 'in' }) === 'Lamp 18 in above where it was read.', 'inches follow the setting');
ok(M.likelyLightSource('outdoor', []) === 'sun', 'outdoors is the sun');
ok(M.likelyLightSource('greenhouse', []) === 'sun', 'a greenhouse is the sun');
ok(M.likelyLightSource('indoor', []) === null, 'indoors with no light recorded asks');
ok(M.likelyLightSource('indoor', [{ lightType: 'hps', spectrum: null }]) === 'hps', 'indoor HPS');
ok(M.likelyLightSource('indoor', [{ lightType: 'led', spectrum: 'full' }]) === 'white_led', 'full spectrum LED is white');
ok(M.likelyLightSource('indoor', [{ lightType: 'led', spectrum: 'bloom' }]) === null, 'a red-heavy LED is left to the person');
ok(M.likelyLightSource(null, []) === null, 'no area, no guess');
ok(M.LIGHT_SOURCES.every((s) => s.code === 'sun' ? !s.lamp : s.lamp), 'only the sun is not a lamp');
ok(/iPhone/.test(M.LIGHT_METER_IPHONE), 'the iPhone line names the iPhone');
for (const sentence of [M.describePpfd(54000, 'sun'), M.describePpfd(5000, 'red_blue_led'), M.describePpfd(5000, null), M.LIGHT_METER_DISTANCE_HOW, M.LIGHT_METER_IPHONE, ...M.LIGHT_SOURCES.map((s) => s.help)]) {
  ok(!forbidden.test(sentence), `no verdict words: ${sentence}`);
  ok(!/[–—]| -- /.test(sentence), `no dashes: ${sentence}`);
}

// This lamp's ratio (1.0.55.21).
ok(M.parseLampRatio('') === null, 'blank ratio is none');
ok(M.parseLampRatio('61,5') === 61.5, 'a comma decimal reads');
ok(M.parseLampRatio('3') === null && M.parseLampRatio('500') === null, 'out of range is refused');
ok(M.lampRatioFromMaker('52000', '850') === 61.2, 'lumens over PPF');
ok(M.lampRatioFromMaker('180', '2.9') === 62.1, 'lm/W over umol/J');
ok(M.lampRatioFromMaker('52000', '') === null, 'a missing figure gives nothing');
ok(M.lampRatioFromMaker('52000', '8.5') === null, 'figures from different lines are refused');
ok(M.luxToPpfd(6120, 'white_led', 61.2) === 100, 'a lamp ratio replaces the kind');
ok(M.luxToPpfd(3000, 'red_blue_led', 30) === 100, 'red and blue converts once a lamp ratio is given');
ok(M.luxToPpfd(3000, 'other') === null && M.luxToPpfd(3000, 'other', 60) === 50, 'another light needs its ratio');
ok(M.meterFigure(6120, 'PPFD', 'white_led', 61.2) === '100', 'the form figure follows the lamp ratio');
ok(/this lamp's 61.2 lux/.test(M.describePpfd(6120, 'white_led', 61.2)), 'the line names the lamp ratio');
ok(/can be given below/.test(M.describePpfd(6700, 'white_led')), 'the general line points to the field');
ok(/Give this lamp's ratio/.test(M.describePpfd(3000, 'other')), 'another light asks for its ratio');
ok(M.meterNote({ lux: 6120, unit: 'PPFD', source: 'white_led', distance: '', distanceUnit: 'cm', lampRatio: 61.2 }) === "Worked out from 6,120 lux under white LED light, at this lamp's 61.2 lux to one µmol.", 'note keeps the lamp ratio');
ok(M.lampRatioKey('a1', 'sun') === null && M.lampRatioKey(null, 'hps') === 'none:hps', 'the sun is never remembered, a lamp is');
ok(M.ratioInUse('hps', null) === 82 && M.ratioInUse('hps', 70) === 70, 'ratio in use');
for (const sentence of [M.LAMP_RATIO_HOW, M.describePpfd(6120, 'white_led', 61.2), M.describePpfd(3000, 'other'), M.describePpfd(3000, 'red_blue_led')]) {
  ok(!forbidden.test(sentence), `no verdict words: ${sentence}`);
  ok(!/[–—]| -- /.test(sentence), `no dashes: ${sentence}`);
}

console.log(`${passed} of ${passed + failed} checks pass`);
process.exit(failed === 0 ? 0 : 1);
