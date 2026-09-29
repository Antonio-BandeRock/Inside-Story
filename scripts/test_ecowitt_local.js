// Runs lib/ecowittLocal.ts, what an Ecowitt gateway on the home network
// answers and what is kept of it (I20, 1.0.55.36), then checks the wiring:
// samples and polling state stay on the device and are not counted as
// changes, the hours are worked out hourly rather than on every read, and
// removing a gateway keeps every reading. Since I21 (1.0.55.37) it also
// covers rain: the gauge's running total for the day becomes the day's rain
// and each hour's rise, never an average.
//
// Built 2026-09-28.
//
// Run with: node scripts/test_ecowitt_local.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read_(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const { outputText } = ts.transpileModule(read_(relPath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) throw new Error(`unexpected import ${name}`);
    return load(path.posix.join(dir, name) + '.ts');
  });
  return module.exports;
}

let passed = 0;
let failed = 0;
function check(name, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${name}`);
  }
}

const E = load('lib/ecowittLocal.ts');
const A = load('lib/databaseActivity.ts');

// 1. A gateway's answer
const answer = {
  common_list: [
    { id: '0x02', val: '21.5', unit: 'C' },
    { id: '0x07', val: '64%' },
    { id: '0x15', val: '12.30 Klux' },
    { id: '5', val: '0.92 kPa' },
    { id: '0x0B', val: '3.2 m/s' },
  ],
  wh25: [{ intemp: '72.5', unit: 'F', inhumi: '48%', abs: '1012.3 hPa', rel: '1012.3 hPa' }],
  ch_aisle: [{ channel: '2', name: 'Tent 1', temp: '25.0', unit: 'C', humidity: '58%' }],
  ch_soil: [{ channel: '1', name: '', humidity: '37%' }],
  ch_temp: [{ channel: '3', temp: '18.4', unit: 'C' }],
  co2: { CO2: '812', temp: '24.0', unit: 'C', humidity: '55%' },
  rain: [
    { id: '0x0D', val: '1.2 mm' },
    { id: '0x0E', val: '0.6 mm/Hr' },
    { id: '0x10', val: '3.4 mm' },
    { id: '0x11', val: '12.0 mm' },
  ],
  piezoRain: [{ id: '0x10', val: '0.13 in' }],
};
const read = E.readLiveData(answer);
check('an Ecowitt answer is read', read !== null);
const keys = read.sensors.map((s) => s.key).sort().join(',');
check('every sensor is found', keys === 'co2,indoor,outdoor,piezorain,probe3,rain,soil1,th2');
const fig = (key, m) => read.figures.find((f) => f.sensorKey === key && f.measurement === m);
check('outdoor temperature in °C', fig('outdoor', 'air_temperature')?.unit === '°C' && fig('outdoor', 'air_temperature')?.value === 21.5);
check('outdoor humidity', fig('outdoor', 'humidity')?.value === 64);
check('klux becomes lux', fig('outdoor', 'light')?.unit === 'lux' && Math.round(fig('outdoor', 'light').value) === 12300);
check('station VPD kept as Controller VPD', fig('outdoor', 'vpd')?.value === 0.92 && fig('outdoor', 'vpd')?.unit === 'kPa');
check('indoor temperature in °F', fig('indoor', 'air_temperature')?.unit === '°F' && fig('indoor', 'air_temperature')?.value === 72.5);
check('channel sensor', fig('th2', 'humidity')?.value === 58 && /Tent 1/.test(read.sensors.find((s) => s.key === 'th2').label));
check('soil moisture', fig('soil1', 'soil_moisture')?.value === 37);
check('probe can be either', read.sensors.find((s) => s.key === 'probe3').temperatureCanBeEither === true);
check('CO2 as a lone object', fig('co2', 'co2')?.value === 812);
check('pressure and rain rate said not kept', read.notKept.includes('air pressure') && read.notKept.some((n) => /rain rate/.test(n)));
check("rain is the day's total, not the event", fig('rain', 'rainfall')?.value === 3.4 && fig('rain', 'rainfall')?.unit === 'mm');
check('piezo rain in inches', fig('piezorain', 'rainfall')?.value === 0.13 && fig('piezorain', 'rainfall')?.unit === 'in');
check('only one rain figure per gauge', read.figures.filter((f) => f.sensorKey === 'rain').length === 1);
check('rain with a unit field', E.rainFigure('0.25', 'in')?.unit === 'in' && E.rainFigure('2', 'mm/Hr') === null && E.rainFigure('--', 'mm') === null);
check('something else is not Ecowitt', E.readLiveData({ hello: 1 }) === null && E.readLiveData([]) === null);
const broken = E.readLiveData({ ch_aisle: [{ channel: '1', temp: '--', humidity: '140%' }] });
check('impossible figures are left out', broken !== null && broken.figures.length === 0);

// 2. Addresses, moments and timing
check('address from a URL', E.normaliseHost('http://192.168.1.40/get_livedata_info') === '192.168.1.40');
check('address with a port', E.normaliseHost(' 192.168.1.40:8080 ') === '192.168.1.40:8080');
check('not an address', E.normaliseHost('my gateway') === null && E.normaliseHost('') === null);
check('moment is local to the minute', E.momentOf(new Date(2026, 8, 28, 7, 5, 42)) === '2026-09-28 07:05:00');
const now = new Date(2026, 8, 28, 12, 0, 0);
check('due with nothing read', E.isDue(null, 5, now));
check('not due inside the interval', !E.isDue(new Date(2026, 8, 28, 11, 58, 0).toISOString(), 5, now));
check('due past the interval', E.isDue(new Date(2026, 8, 28, 11, 55, 0).toISOString(), 5, now));
check('device name per sensor', E.sensorDeviceName('Greenhouse', 'Outdoor station') === 'Greenhouse, Outdoor station');

// 2b. Rain from running totals (I21)
const R = load('lib/readingImport.ts');
const G = load('lib/growingConditions.ts');
const rain = R.rainFromRunningTotals([
  { at: '2026-09-28 07:05:00', value: 2.0, unit: 'mm' },
  { at: '2026-09-28 07:35:00', value: 2.5, unit: 'mm' },
  { at: '2026-09-28 08:10:00', value: 4.0, unit: 'mm' },
  { at: '2026-09-28 08:40:00', value: 0.3, unit: 'mm' },
  { at: '2026-09-28 09:00:00', value: 1.0, unit: 'mm' },
  { at: '2026-09-29 00:05:00', value: 0, unit: 'mm' },
]);
const day28 = rain.days.find((d) => d.period === '2026-09-28');
check('day is the total as last read, a reset counted in full', day28?.average === 5);
check('rain before the first reading is kept for the day', day28?.beforeFirst === 2 && day28?.firstAt === '2026-09-28 07:05:00');
const hour = (h) => rain.hours.find((x) => x.period === h);
check('an hour is how far the total rose in it', hour('2026-09-28 07')?.average === 0.5 && hour('2026-09-28 07')?.highest === 2.5);
check('an hour across a reset', hour('2026-09-28 08')?.average === 1.8 && hour('2026-09-28 08')?.highest === 4.3);
check('the last hour ends on the day total', hour('2026-09-28 09')?.highest === 5);
check('a dry day is a zero, since it was read', rain.days.find((d) => d.period === '2026-09-29')?.average === 0);
const mixed = R.rainFromRunningTotals([
  { at: '2026-09-28 10:00:00', value: 0.1, unit: 'in' },
  { at: '2026-09-28 11:00:00', value: 5.08, unit: 'mm' },
]);
check('two units move into the last one', mixed.days[0].unit === 'mm' && mixed.days[0].average === 5.08);
check('rain cannot be negative', !R.couldBeRead('rainfall', -1, 'mm') && R.couldBeRead('rainfall', 3, 'in'));
const rainNote = R.rainDayNote(day28, 'Greenhouse, Rain gauge');
check('day note says when it was last read and what came before', /last read at 09:00/.test(rainNote) && /2 mm had fallen before the first reading at 07:05/.test(rainNote));

const rows = rain.hours
  .filter((h) => h.period.startsWith('2026-09-28'))
  .map((h) => ({ plotId: 'p', plotName: 'Garden', plantingId: null, deviceName: 'Rain gauge', unit: h.unit, hour: h.period, average: h.average, lowest: h.lowest, highest: h.highest, count: h.count }));
const detail = G.buildDeviceDetail({ rows, labelOfSource: () => 'Garden', pickedSource: null, pickedDay: null, total: true });
check('Trends reads a rain day as its total', detail.days[0].value === 5 && detail.days[0].display === '5 mm');
check('Trends reads a rain hour as what fell', detail.hours[8].display === '1.8 mm fell, 4.3 mm for the day by then');
check('an hour with no reading is a gap', detail.hours[3].value === null);
const averaged = G.buildDeviceDetail({ rows, labelOfSource: () => 'Garden', pickedSource: null, pickedDay: null });
check('without total a day still averages', averaged.days[0].value !== 5);

// 3. Sentences
const sentences = [
  E.GATEWAY_HOW,
  ...E.GATEWAY_STEPS,
  E.ADDRESS_TIP,
  E.UNREACHABLE_ADVICE,
  E.NOT_A_GATEWAY_ADVICE,
  E.RAIN_NOTE,
  E.WHILE_OPEN_NOTE,
  E.ONE_DEVICE_NOTE,
  E.HOURS_NOTE,
  E.describeRead(read, 12),
  rainNote,
  ...detail.notes,
].join(' ');
check('six setup steps, in order', E.GATEWAY_STEPS.length === 6 && /same Wi-Fi/.test(E.GATEWAY_STEPS[0]) && /address/.test(E.GATEWAY_STEPS[1]));
check('status reads in words', E.gatewayStatus({ reading: false, lastReadAt: null, lastProblem: null, readingOn: true }).kind === 'waiting'
  && E.gatewayStatus({ reading: false, lastReadAt: 'x', lastProblem: 'no', readingOn: true }).kind === 'problem'
  && E.gatewayStatus({ reading: false, lastReadAt: 'x', lastProblem: null, readingOn: true }).kind === 'connected');
check('no verdict words', !/\b(ideal|optimal|too (low|high)|healthy|unhealthy|perfect)\b/i.test(sentences));
check('no dashes as punctuation', !/[–—]| -- /.test(sentences));

// 4. Sync and write counting
check('a sample write is not a change', !A.countsAsChange('INSERT OR IGNORE INTO garden_device_samples (plot_id) VALUES (?)'));
check('a polling write is not a change', !A.countsAsChange('UPDATE garden_gateway_polling SET last_attempt_at = ? WHERE gateway_id = ?'));
check('an hour write is a change', A.countsAsChange('INSERT OR REPLACE INTO garden_reading_hours (id) VALUES (?)'));
check('a gateway write is a change', A.countsAsChange('INSERT INTO garden_gateways (id) VALUES (?)'));
check('a script touching both is a change', A.countsAsChange('DELETE FROM garden_gateway_polling; DELETE FROM garden_gateways;'));
check('polling stays on the device', /DEVICE_LOCAL_TABLES: readonly string\[\] = \[[^\]]*'garden_gateway_polling'/.test(read_('lib/snapshotSync.ts')));
check('gateways travel', !/DEVICE_LOCAL_TABLES: readonly string\[\] = \[[^\]]*'garden_gateways'/.test(read_('lib/snapshotSync.ts')));

// 5. Wiring
const db = read_('lib/db.ts');
check('tables made', /CREATE TABLE IF NOT EXISTS garden_gateways/.test(db) && /CREATE TABLE IF NOT EXISTS garden_gateway_sensors/.test(db) && /CREATE TABLE IF NOT EXISTS garden_gateway_polling/.test(db));
const edb = read_('lib/ecowittDb.ts');
check('desktop reads through the bridge', /fetchPage\(url\)/.test(edb));
check('phone read has a timeout', /AbortController/.test(edb));
check('samples stored, not worked out each read', /storeDeviceSamples\(/.test(edb) && /reworkDeviceFigures\(/.test(edb) && /hourTurned/.test(edb));
check('removing a gateway keeps readings', !/DELETE FROM garden_readings|DELETE FROM garden_device_samples/.test(edb));
check('removed area is skipped', /archived_at IS NULL/.test(edb));
check('poller mounted', /<EcowittPoller \/>/.test(read_('app/_layout.tsx')));
check('poller works out on background', /workOutAllGateways\(\)/.test(read_('components/EcowittPoller.tsx')));
check('band on Growing Conditions', /garden:conditions:gateways/.test(read_('components/GrowingConditionsLens.tsx')));
check('reworking keeps rain apart from the averages', /measurement <> 'rainfall'/.test(read_('lib/growingConditionsDb.ts')) && read_('lib/growingConditionsDb.ts').includes('rainFromRunningTotals(') && (read_('lib/growingConditionsDb.ts')));
check('Trends is told rain is a total', read_('lib/growingConditionsDb.ts').includes("total: aggregateFor(chosen) === 'total'"));
check('band shows the setup steps and status', /<SetupSteps/.test(read_('components/EcowittGatewaySection.tsx')) && read_('components/EcowittGatewaySection.tsx').includes('gatewayStatus('));
check('band can add an area', /<QuickAreaForm/.test(read_('components/EcowittGatewaySection.tsx')));

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
