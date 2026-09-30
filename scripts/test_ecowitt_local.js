// Runs lib/ecowittLocal.ts, what an Ecowitt gateway on the home network
// answers and what is kept of it (I20, 1.0.55.36), then checks the wiring:
// samples and polling state stay on the device and are not counted as
// changes, the hours are worked out hourly rather than on every read, and
// removing a gateway keeps every reading. Since I21 (1.0.55.37) it also
// covers rain: the gauge's running total for the day becomes the day's rain
// and each hour's rise, never an average.
//
// Since I22 (1.0.55.38) it also covers a station that sends its readings
// to the computer (lib/ecowittPush.ts, desktop/stationListener.js) and the
// rule that one device reads each gateway.
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
check('status reads in words', E.gatewayStatus({ reading: false, lastReadAt: null, lastProblem: null, readsHere: true }).kind === 'waiting'
  && E.gatewayStatus({ reading: false, lastReadAt: 'x', lastProblem: 'no', readsHere: true }).kind === 'problem'
  && E.gatewayStatus({ reading: false, lastReadAt: 'x', lastProblem: null, readsHere: true }).kind === 'connected');
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
check('poller works out on background', /withSessionGuardLifted\(workOutAllGateways\)/.test(read_('components/EcowittPoller.tsx')));
check('band on Growing Conditions', /garden:conditions:gateways/.test(read_('components/GrowingConditionsLens.tsx')));
check('reworking keeps rain apart from the averages', /measurement <> 'rainfall'/.test(read_('lib/growingConditionsDb.ts')) && read_('lib/growingConditionsDb.ts').includes('rainFromRunningTotals(') && (read_('lib/growingConditionsDb.ts')));
check('Trends is told rain is a total', read_('lib/growingConditionsDb.ts').includes("total: aggregateFor(chosen) === 'total'"));
check('band shows the setup steps and status', /<SetupSteps/.test(read_('components/EcowittGatewaySection.tsx')) && read_('components/EcowittGatewaySection.tsx').includes('gatewayStatus('));
check('band can add an area', /<QuickAreaForm/.test(read_('components/EcowittGatewaySection.tsx')));

// 6. A station that sends its readings (I22, 1.0.55.38)
const P = load('lib/ecowittPush.ts');
const body = 'PASSKEY=ABC123&stationtype=GW2000A_V3.1.4&dateutc=2026-09-28+14%3A00%3A00&tempinf=72.5&humidityin=48&tempf=80.1&humidity=61'
  + '&solarradiation=512.3&temp1f=70.0&humidity1=55&soilmoisture1=34&tf_ch2=65.3&co2=640&tf_co2=71.0&humi_co2=50'
  + '&dailyrainin=0.12&rainratein=0.00&weeklyrainin=1.2&windspeedmph=3.1&baromrelin=29.9&uv=2&pm25_ch1=8&vpd=0.9';
const fields = P.parsePushBody(body);
check('form body parsed, plus sign as space', fields.dateutc === '2026-09-28 14:00:00' && fields.PASSKEY === 'ABC123');
check('passkey and station type', P.passkeyOf(fields) === 'ABC123' && P.stationTypeOf(fields) === 'GW2000A_V3.1.4');
const pushed = P.readPush(fields);
const pfig = (key, measurement) => pushed.figures.find((f) => f.sensorKey === key && f.measurement === measurement) || { value: null };
check('outdoor kept in °F', pfig('outdoor', 'air_temperature').value === 80.1 && pfig('outdoor', 'air_temperature').unit === '°F');
check('outdoor humidity', pfig('outdoor', 'humidity').value === 61);
check('indoor', pfig('indoor', 'air_temperature').value === 72.5 && pfig('indoor', 'humidity').value === 48);
check('sunlight kept as W/m²', pfig('outdoor', 'light').value === 512.3);
check('channel sensor', pfig('th1', 'air_temperature').value === 70 && pfig('th1', 'humidity').value === 55);
check('soil moisture', pfig('soil1', 'soil_moisture').value === 34);
check('probe can be soil or air', pfig('probe2', 'soil_temperature').value === 65.3 && pushed.sensors.find((s) => s.key === 'probe2').temperatureCanBeEither);
check('co2 monitor', pfig('co2', 'co2').value === 640 && pfig('co2', 'air_temperature').value === 71);
check('rain is the day total in inches', pfig('rain', 'rainfall').value === 0.12 && pfig('rain', 'rainfall').unit === 'in');
check('sensor keys match the asked answer', ['outdoor', 'indoor', 'th1', 'soil1', 'probe2', 'co2', 'rain'].every((key) => pushed.sensors.some((s) => s.key === key)));
check('not kept is named', ['wind', 'air pressure', 'UV', 'air quality', 'rain rate and the week, month and year totals'].every((name) => pushed.notKept.includes(name))
  && pushed.notKept.some((name) => /VPD/.test(name)));
check('no passkey is not a station post', P.readPush(P.parsePushBody('tempf=70')) === null);
check('an unreadable figure is left out', !P.readPush(P.parsePushBody('PASSKEY=x&humidity=140')).figures.some((f) => f.measurement === 'humidity'));
check('a bad escape does not throw', P.parsePushBody('PASSKEY=x&bad=%E0%A4%A').PASSKEY === 'x');

const gws = [
  { id: 'a', passkey: 'K1', receivesHere: true },
  { id: 'b', passkey: null, receivesHere: true },
  { id: 'c', passkey: 'K3', receivesHere: false },
];
check('matched by key', JSON.stringify(P.matchPush('K1', gws)) === JSON.stringify({ gatewayId: 'a', adopt: false }));
check('first post adopted by the one waiting', JSON.stringify(P.matchPush('NEW', gws)) === JSON.stringify({ gatewayId: 'b', adopt: true }));
check('a gateway received elsewhere is not kept here', P.matchPush('K3', gws) === null);
check('two waiting means no guess', P.matchPush('NEW', [...gws, { id: 'd', passkey: null, receivesHere: true }]) === null);

// 7. One reader per gateway
const who = (over) => E.gatewayReader({ method: 'ask', readerId: null, readerKind: null, me: 'me', myKind: 'phone', ...over });
check('read here', who({ readerId: 'me', readerKind: 'phone' }).readsHere && who({ readerId: 'me' }).takeOverLabel === null);
check('read elsewhere offers to move, said first', !who({ readerId: 'pc', readerKind: 'computer' }).readsHere
  && who({ readerId: 'pc', readerKind: 'computer' }).takeOverLabel === 'Read It on This Phone Instead'
  && /your computer stops/.test(who({ readerId: 'pc', readerKind: 'computer' }).takeOverConfirm));
check('nobody reads it', who({}).text === 'No device reads this gateway.' && who({}).takeOverLabel === 'Read It on This Phone');
check('a phone never takes a sending gateway', who({ method: 'push', readerId: 'pc', readerKind: 'computer' }).takeOverLabel === null
  && who({ method: 'push' }).takeOverLabel === null);
check('a computer can take a sending gateway', who({ method: 'push', readerId: 'pc2', readerKind: 'computer', myKind: 'computer' }).takeOverLabel === 'Read It on This Computer Instead');
check('status follows who reads', E.gatewayStatus({ reading: false, lastReadAt: 'x', lastProblem: null, readsHere: false }).text === 'Connected');
check('push status in words', P.pushStatus({ listening: false, listenError: 'x', lastReadAt: null, lastProblem: null }).kind === 'problem'
  && P.pushStatus({ listening: true, listenError: null, lastReadAt: null, lastProblem: null }).kind === 'waiting'
  && P.pushStatus({ listening: true, listenError: null, lastReadAt: 'x', lastProblem: null }).kind === 'connected');
const steps = P.pushSteps({ addresses: ['192.168.1.20'], port: 8588 });
check('push steps name the address, path and port', steps.length === 7 && steps.some((s) => s.includes('192.168.1.20') && s.includes('/data/report/') && s.includes('8588')));
check('push steps with two addresses say which', /192\.168\.1\.20 or 10\.0\.0\.5/.test(P.pushSteps({ addresses: ['192.168.1.20', '10.0.0.5'], port: 9000 }).join(' ')));
const readerLines = ['ask', 'push'].flatMap((method) => [who({ method }), who({ method, readerId: 'x', readerKind: 'computer' }), who({ method, readerId: 'me' })]);
const pushSentences = [P.PUSH_HOW, P.PUSH_ADDRESS_TIP, P.PUSH_PHONE_NOTE, ...steps, E.ONE_DEVICE_NOTE, E.WHILE_OPEN_NOTE, ...E.GATEWAY_STEPS,
  ...readerLines.flatMap((r) => [r.text, r.takeOverConfirm || ''])].join(' ');
check('push text: no verdict words', !/\b(ideal|optimal|too (low|high)|healthy|unhealthy|perfect)\b/i.test(pushSentences));
check('push text: no dashes as punctuation', !/[–—]| -- /.test(pushSentences));
check('push text: no filler', !/\b(real|genuine|genuinely)\b/i.test(pushSentences));

// 8. Wiring for I22
const snap = read_('lib/snapshotSync.ts');
check('reader id stays on the device', /'gateway_reader_self'/.test(snap) && /'station_listener_port'/.test(snap));
check('reader columns made', /reader_id TEXT/.test(db) && /passkey TEXT/.test(db) && /method TEXT NOT NULL DEFAULT 'ask'/.test(db));
check('listener packaged', /- stationListener\.js/.test(read_('desktop/electron-builder.yml')));
check('listener wired in main', /require\('\.\/stationListener'\)/.test(read_('desktop/main.js')) && /station:report/.test(read_('desktop/main.js')));
check('listener exposed in preload', /stationListener:/.test(read_('desktop/preload.js')) && /station:report/.test(read_('desktop/preload.js')));
const poller = read_('components/EcowittPoller.tsx');
check('poller starts and stops the listener', /listener\.start\(/.test(poller) && /listener\.stop\(/.test(poller) && /receiveStationReport\(/.test(poller));
check('a phone cannot take a sending gateway', /method === 'push' && thisDeviceKind\(\) !== 'computer'/.test(edb));
const band = read_('components/EcowittGatewaySection.tsx');
check('band has the take-over and no switch per device', band.includes('readGatewayHere(') && !/Read it on this device/.test(band));
check('band offers sending on the computer only', /onComputer \? \(/.test(band) && band.includes('PUSH_PHONE_NOTE'));

const L = require(path.join(__dirname, '..', 'desktop', 'stationListener.js'));
check('nearby senders', L.isNearby('192.168.1.40') && L.isNearby('::ffff:10.0.0.2') && L.isNearby('172.20.1.1') && L.isNearby('127.0.0.1'));
check('far senders refused', !L.isNearby('8.8.8.8') && !L.isNearby('172.40.1.1') && !L.isNearby('::ffff:52.1.2.3'));

async function listenerRoundTrip() {
  const http = require('http');
  const got = [];
  L.install((report) => got.push(report));
  const port = 20000 + Math.floor(Math.random() * 20000);
  const started = await L.start(port);
  check('listener starts', started.listening && started.port === port);
  const request = (method, payload) => new Promise((resolve, reject) => {
    const headers = payload ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {};
    const req = http.request({ host: '127.0.0.1', port, path: '/data/report/', method, headers }, (res) => {
      let text = '';
      res.on('data', (chunk) => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
  const hello = await request('GET');
  check('a browser check answers', hello.status === 200 && /Inside Story is listening/.test(hello.text));
  const posted = await request('POST', body);
  check('a post is answered and passed on', posted.status === 200 && got.length === 1 && got[0].body === body && L.isNearby(got[0].from) && !!got[0].receivedAt);
  const now = L.status();
  check('status remembers the last post', !!now.lastReport && now.lastReport.from === got[0].from);
  const stopped = await L.stop();
  check('listener stops', !stopped.listening);
}

listenerRoundTrip()
  .catch((error) => check(`listener round trip: ${error.message}`, false))
  .then(() => {
    console.log(`${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  });
