// Runs lib/ecowittLocal.ts, what an Ecowitt gateway on the home network
// answers and what is kept of it (I20, 1.0.55.36), then checks the wiring:
// samples and polling state stay on the device and are not counted as
// changes, the hours are worked out hourly rather than on every read, and
// removing a gateway keeps every reading.
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
  rain: [{ id: '0x0D', val: '1.2 mm' }],
};
const read = E.readLiveData(answer);
check('an Ecowitt answer is read', read !== null);
const keys = read.sensors.map((s) => s.key).sort().join(',');
check('every sensor is found', keys === 'co2,indoor,outdoor,probe3,soil1,th2');
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
check('rain and pressure said not kept', read.notKept.includes('air pressure') && read.notKept.some((n) => /rain/.test(n)));
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

// 3. Sentences
const sentences = [E.GATEWAY_HOW, E.WHILE_OPEN_NOTE, E.ONE_DEVICE_NOTE, E.HOURS_NOTE, E.describeRead(read, 12)].join(' ');
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
check('band can add an area', /<QuickAreaForm/.test(read_('components/EcowittGatewaySection.tsx')));

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
