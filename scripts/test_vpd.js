// Runs the air VPD part of lib/growingConditions.ts (I18): VPD worked out
// from temperature and humidity readings already entered, and checks where
// it is wired.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. The arithmetic is the Tetens formula, checked against figures worked
//     by hand, and a temperature in °F is moved to °C first.
//  2. A pair is an air temperature and a humidity reading for the same area
//     on the same day. Soil temperature is never used, a reading with no
//     area is never paired, each reading is used once, and the two entered
//     nearest together pair first.
//  3. Anything left out is counted in a sentence, never dropped quietly.
//  4. A month with no pair is a gap, never a zero, and the blank note says
//     no pair was made rather than that nothing was measured.
//  5. No sentence calls a figure right or wrong.
//
// Run with: node scripts/test_vpd.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function run(relPath, resolve) {
  const { outputText } = ts.transpileModule(read(relPath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    const found = resolve[name];
    if (!found) throw new Error(`unexpected import ${name}`);
    return found;
  });
  return module.exports;
}

let failures = 0;
let passes = 0;
function check(label, condition, detail) {
  if (condition) {
    passes += 1;
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ''}`);
  }
}
const near = (a, b, within = 0.005) => typeof a === 'number' && Math.abs(a - b) <= within;

const V = run('lib/eatingVariety.ts', {});
const H = run('lib/harvestYield.ts', {
  './plantingEvents': run('lib/plantingEvents.ts', {}),
  './eatingVariety': V,
  './harvestTrade': run('lib/harvestTrade.ts', {}),
  './unitConversion': run('lib/unitConversion.ts', {}),
});
const G = run('lib/growingConditions.ts', { './harvestYield': H, './lightMeter': run('lib/lightMeter.ts', {}) });

// 1. Arithmetic
check('SVP at 0°C', near(G.saturationVapourPressure(0), 0.6108, 0.0001));
check('SVP at 25°C', near(G.saturationVapourPressure(25), 3.168, 0.002), G.saturationVapourPressure(25));
check('VPD 25°C 60%', near(G.airVpd(25, 60), 1.267, 0.002), G.airVpd(25, 60));
check('VPD 20°C 50%', near(G.airVpd(20, 50), 1.169, 0.002), G.airVpd(20, 50));
check('saturated air', G.airVpd(22, 100) === 0);
check('bone dry air is the whole SVP', near(G.airVpd(30, 0), G.saturationVapourPressure(30), 1e-9));
check('humidity over 100 refused', G.airVpd(25, 101) === null);
check('humidity below 0 refused', G.airVpd(25, -1) === null);
check('temperature past the range refused', G.airVpd(71, 50) === null && G.airVpd(-51, 50) === null);
check('not a number refused', G.airVpd(Number.NaN, 50) === null);
check('kPa reads to two places', G.formatFigure(1.2671, 'kPa') === '1.27 kPa');

let next = 0;
function reading(over) {
  next += 1;
  return {
    id: `r${String(next).padStart(3, '0')}`,
    plotId: 'tent',
    plotName: 'Grow tent',
    plantingId: null,
    measurement: 'air_temperature',
    value: 25,
    unit: '°C',
    measuredOn: '2026-09-10',
    source: 'hand',
    deviceName: null,
    note: null,
    createdAt: '2026-09-10T08:00:00.000Z',
    ...over,
  };
}

// 2. Pairing
{
  const p = G.pairVpdReadings([
    reading({ value: 77, unit: '°F' }),
    reading({ measurement: 'humidity', value: 60, unit: '%', createdAt: '2026-09-10T08:00:30.000Z' }),
  ]);
  check('one pair', p.pairs.length === 1);
  check('°F moved to °C first', near(p.pairs[0].vpd, 1.267, 0.002), p.pairs[0] && p.pairs[0].vpd);
  check('temperature shown as recorded', p.pairs[0].temperature === '77°F');
  check('row line', G.describeVpdPair(p.pairs[0], '2026-09-10') === '1.27 kPa, today, from 77°F and 60% humidity', G.describeVpdPair(p.pairs[0], '2026-09-10'));
  check('nothing left over', p.notes.length === 0, p.notes.join(' | '));
}
{
  const p = G.pairVpdReadings([
    reading({ measurement: 'soil_temperature', value: 18 }),
    reading({ measurement: 'humidity', value: 55, unit: '%' }),
  ]);
  check('soil temperature never paired', p.pairs.length === 0 && p.unpairedHumidity === 1);
  check('unpaired said in words', p.notes[0] === '1 humidity reading has no reading of the other kind for the same area on the same day, so it gives no VPD.', p.notes[0]);
}
{
  const p = G.pairVpdReadings([
    reading({}),
    reading({ measurement: 'humidity', value: 55, unit: '%', plotId: 'bed' }),
    reading({ measurement: 'humidity', value: 55, unit: '%', measuredOn: '2026-09-11' }),
  ]);
  check('another area is not a pair', p.pairs.length === 0);
  check('another day is not a pair', p.unpairedTemperature === 1 && p.unpairedHumidity === 2);
  check('plural wording', /^1 air temperature reading and 2 humidity readings have no reading/.test(p.notes[0]), p.notes[0]);
}
{
  const p = G.pairVpdReadings([
    reading({ plotId: null }),
    reading({ measurement: 'humidity', value: 55, unit: '%', plotId: null }),
  ]);
  check('no area is never paired', p.pairs.length === 0 && p.noArea === 2);
  check('no area said', p.notes.includes('2 readings were recorded with no area, so there is nothing to pair them by.'), p.notes.join(' | '));
}
{
  const p = G.pairVpdReadings([
    reading({ value: 25 }),
    reading({ measurement: 'humidity', value: 55, unit: 'g/m³' }),
    reading({ measurement: 'humidity', value: 140, unit: '%' }),
    reading({ value: 12, unit: 'lux' }),
  ]);
  check('unreadable readings counted', p.unreadable === 3 && p.pairs.length === 0);
  check('unreadable said', p.notes.some((note) => note.startsWith('3 readings are left out: humidity is read here as a percentage from 0 to 100')), p.notes.join(' | '));
}
{
  // Two of each on one day: the two entered nearest together pair.
  const p = G.pairVpdReadings([
    reading({ value: 20, createdAt: '2026-09-10T07:00:00.000Z' }),
    reading({ value: 28, createdAt: '2026-09-10T15:00:00.000Z' }),
    reading({ measurement: 'humidity', value: 70, unit: '%', createdAt: '2026-09-10T15:01:00.000Z' }),
    reading({ measurement: 'humidity', value: 80, unit: '%', createdAt: '2026-09-10T07:02:00.000Z' }),
  ]);
  const at20 = p.pairs.find((pair) => pair.celsius === 20);
  const at28 = p.pairs.find((pair) => pair.celsius === 28);
  check('two pairs', p.pairs.length === 2);
  check('morning with morning', at20 && at20.humidity === 80);
  check('afternoon with afternoon', at28 && at28.humidity === 70);
}
{
  const p = G.pairVpdReadings([
    reading({}),
    reading({}),
    reading({ measurement: 'humidity', value: 50, unit: '%' }),
  ]);
  check('each reading used once', p.pairs.length === 1 && p.unpairedTemperature === 1);
  const again = G.pairVpdReadings([
    reading({ id: 'b' }),
    reading({ id: 'a' }),
    reading({ id: 'h', measurement: 'humidity', value: 50, unit: '%' }),
  ]);
  check('a tie settles the same way each time', again.pairs[0].temperatureId === 'a');
}
{
  const p = G.pairVpdReadings([
    reading({ source: 'device', deviceName: 'Tent sensor' }),
    reading({ measurement: 'humidity', value: 60, unit: '%', source: 'device', deviceName: 'Tent sensor' }),
  ]);
  check('same device named', / both from Tent sensor$/.test(G.describeVpdPair(p.pairs[0], '2026-09-12')));
  const mixed = G.pairVpdReadings([
    reading({ source: 'device', deviceName: 'Tent sensor' }),
    reading({ measurement: 'humidity', value: 60, unit: '%' }),
  ]);
  check('mixed sources name no device', mixed.pairs[0].deviceName === null);
}
{
  const p = G.pairVpdReadings([
    reading({ measuredOn: '2026-08-01' }),
    reading({ measurement: 'humidity', value: 60, unit: '%', measuredOn: '2026-08-01' }),
    reading({ measuredOn: '2026-09-01' }),
    reading({ measurement: 'humidity', value: 60, unit: '%', measuredOn: '2026-09-01' }),
  ]);
  check('newest day first', p.pairs[0].measuredOn === '2026-09-01');
}

// 3 and 4. The band
{
  const pairing = G.pairVpdReadings([
    reading({ measuredOn: '2026-07-04', value: 25 }),
    reading({ measurement: 'humidity', value: 60, unit: '%', measuredOn: '2026-07-04' }),
    reading({ measuredOn: '2026-09-02', value: 20 }),
    reading({ measurement: 'humidity', value: 50, unit: '%', measuredOn: '2026-09-02' }),
    reading({ measuredOn: '2026-09-20', value: 20 }),
    reading({ measurement: 'humidity', value: 50, unit: '%', measuredOn: '2026-09-20' }),
    reading({ measuredOn: '2026-09-21', value: 30 }),
  ]);
  const band = G.buildVpdBand({ pairing, months: G.buildMonths('2026-07-01', '2026-09-28') });
  check('three months', band.months.length === 3);
  check('blank month is a gap', band.months[1].figure === null && band.rows[1].value === null);
  check('averaged', band.aggregate === 'average' && band.unit === 'kPa');
  check('September is the average of its pairs', near(band.months[2].figure, 1.169, 0.002));
  check('headline counts pairs', /^1\.22 kPa on average, from 3 pairs of readings across 2 months\.$/.test(band.headline), band.headline);
  check('blank note says why', band.notes[0] === 'One month is blank, because no air temperature and humidity were recorded for the same area on the same day that month.', band.notes[0]);
  check('left over carried to the band', band.notes.some((note) => note.startsWith('1 air temperature reading has no reading')));
  check('formula stated', band.notes.includes(G.VPD_HOW) && band.notes.includes(G.VPD_LEAF_NOTE) && band.notes.includes(G.VPD_PAIRING_NOTE));
  const none = G.buildVpdBand({ pairing: G.pairVpdReadings([]), months: G.buildMonths('2026-09-01', '2026-09-28') });
  check('no pairs headline', /^No air VPD in this stretch/.test(none.headline));
}
check('measurement blank note unchanged', /nothing was measured/.test(
  G.buildMeasurementBand({ measurement: 'humidity', label: 'Humidity', readings: [], months: G.buildMonths('2026-09-01', '2026-09-28'), preferredUnit: '%' }).notes[0],
));

// Wiring
const db = read('lib/growingConditionsDb.ts');
const lens = read('components/GrowingConditionsLens.tsx');
const trends = read('app/(tabs)/trends.tsx');
check('Trends offers VPD once both are recorded', /measuredCodes\.has\('air_temperature'\) && measuredCodes\.has\('humidity'\)/.test(db) && /measurements\.push\(\{ code: VPD_CODE, label: VPD_LABEL \}\)/.test(db));
check('Trends band built from pairs', /buildVpdBand\(\{ pairing: pairVpdReadings\(pairable\)/.test(db));
check('Trends draws the chosen band', /conditionsSummary\.band\.notes\.map/.test(trends));
check('Garden works it out from the readings', /pairVpdReadings\(readings\)/.test(lens) && /describeVpdPair\(pair, today\)/.test(lens));
check('Garden states the formula', /\{VPD_HOW\}/.test(lens) && /\{VPD_LEAF_NOTE\}/.test(lens));

// 5. Wording
const sentences = [
  G.VPD_HOW, G.VPD_LEAF_NOTE, G.VPD_PAIRING_NOTE,
  ...lens.match(/>[^<>{}\n]+</g).filter((s) => /VPD|humidity/i.test(s)),
];
const sample = G.pairVpdReadings([reading({ plotId: null }), reading({ unit: 'lux' }), reading({ measurement: 'humidity', value: 5, unit: '%' })]);
sentences.push(...sample.notes);
for (const pattern of [/—|–| -- /, /\breal\b/i, /\bgenuine(ly)?\b/i, /\bshould\b/i, /\bideal\b/i, /\boptimal\b/i, /too (low|high)/i, /\bbest\b/i, /\bhealthy\b/i, /\btarget\b/i]) {
  const hit = sentences.find((s) => pattern.test(s));
  check(`no ${pattern}`, !hit, hit);
}

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
