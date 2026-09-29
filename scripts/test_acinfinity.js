// Runs lib/acInfinityCloud.ts, what AC Infinity's server answers for an
// account's controllers and what is kept of it (I23, 1.0.55.39), then checks
// the wiring: nothing is sent until the switch agreeing to it is on, the
// password is kept in secure storage and never in the database, the desktop
// can post only to AC Infinity's server, and an account is read by one
// device the way a gateway is.
//
// Built 2026-09-28.
//
// Run with: node scripts/test_acinfinity.js
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

const C = load('lib/acInfinityCloud.ts');
const E = load('lib/ecowittLocal.ts');

// 1. Sign-in and the answer's shape
check('login form, password cut to 25', JSON.stringify(C.loginForm(' a@b.com ', 'x'.repeat(30))) === JSON.stringify({ appEmail: 'a@b.com', appPasswordl: 'x'.repeat(25) }));
check('form encoded', C.formEncode({ appEmail: 'a+b@c.com', appPasswordl: 'p&q' }) === 'appEmail=a%2Bb%40c.com&appPasswordl=p%26q');
check('code 200 is an answer', C.answerOf({ code: 200, data: { appId: 'abc' } }).ok && C.userIdOf({ appId: 'abc' }) === 'abc');
check('a refusal gives its reason', C.answerOf({ code: 10001, msg: 'Password error' }).reason === 'Password error');
check('a refusal with no msg names its code', C.answerOf({ code: 403 }).reason === 'code 403');
check('not an answer', !C.answerOf('<html>').ok && !C.answerOf(null).ok);
check('a numeric id', C.userIdOf({ appId: 1234 }) === '1234' && C.userIdOf({}) === null);
check('precision scales', C.sensorValue(2150, 3) === 21.5 && C.sensorValue(55, 1) === 55 && C.sensorValue('x', 2) === null);

// 2. Controllers
const devices = [
  {
    devId: '100',
    devName: 'Tent',
    online: 1,
    deviceInfo: { temperature: 2415, humidity: 5820, vpdnums: 125, ports: [{ port: 1 }], sensors: [] },
  },
  {
    devId: 200,
    devName: 'Veg room',
    online: 1,
    deviceInfo: {
      temperature: 0,
      humidity: 0,
      sensors: [
        { accessPort: 0, sensorType: 4, sensorData: 7750, sensorPrecision: 3 },
        { accessPort: 0, sensorType: 6, sensorData: 6010, sensorPrecision: 3 },
        { accessPort: 0, sensorType: 7, sensorData: 105, sensorPrecision: 3 },
        { accessPort: 2, sensorType: 0, sensorData: 7310, sensorPrecision: 3 },
        { accessPort: 2, sensorType: 2, sensorData: 5500, sensorPrecision: 3 },
        { accessPort: 3, sensorType: 10, sensorData: 42, sensorPrecision: 1 },
        { accessPort: 4, sensorType: 11, sensorData: 820, sensorPrecision: 1 },
        { accessPort: 4, sensorType: 12, sensorData: 60, sensorPrecision: 1 },
        { accessPort: 5, sensorType: 13, sensorData: 62, sensorPrecision: 2 },
        { accessPort: 6, sensorType: 20, sensorData: 0, sensorPrecision: 1 },
      ],
    },
  },
  { devId: '300', devName: 'Dry room', online: 0, deviceInfo: { temperature: 2000, humidity: 5000 } },
  { devId: '400', devName: 'No probe', online: 1, deviceInfo: { temperature: 0, humidity: 0, vpdnums: 0 } },
];
const got = C.readControllers(devices);
const f = (key, measurement) => got.figures.find((x) => x.sensorKey === key && x.measurement === measurement) || { value: null };
check('older controller from deviceInfo, divided by 100', f('ac100', 'air_temperature').value === 24.15 && f('ac100', 'air_temperature').unit === '°C'
  && f('ac100', 'humidity').value === 58.2 && f('ac100', 'vpd').value === 1.25);
check('newer controller from its sensors', f('ac200', 'air_temperature').value === 77.5 && f('ac200', 'air_temperature').unit === '°F'
  && f('ac200', 'humidity').value === 60.1 && f('ac200', 'vpd').value === 1.05);
check('probe on a port', f('ac200p2', 'air_temperature').value === 73.1 && f('ac200p2', 'humidity').value === 55);
check('soil and co2', f('ac200p3', 'soil_moisture').value === 42 && f('ac200p4', 'co2').value === 820);
check('labels name the controller and port', got.sensors.find((s) => s.key === 'ac200p2').label === 'Veg room, temperature and humidity probe, port 2'
  && got.sensors.find((s) => s.key === 'ac100').label === 'Tent, built-in probe');
check('offline controller not kept, and named', got.offline.join() === 'Dry room' && !got.sensors.some((s) => s.key === 'ac300'));
check('a controller with no probe reads nothing', !got.sensors.some((s) => s.key === 'ac400'));
check('light percent, hydro, water detection and ports named as not kept',
  got.notKept.some((n) => /light level/.test(n)) && got.notKept.some((n) => /hydroponic/.test(n))
  && got.notKept.includes('water detection') && got.notKept.some((n) => /ports are set to/.test(n)));
check('a port with only unkept sensors is not listed', !got.sensors.some((s) => s.key === 'ac200p5' || s.key === 'ac200p6'));
check('an unreadable figure is left out', !C.readControllers([{ devId: 1, devName: 'x', online: 1, deviceInfo: { humidity: 15000, temperature: 2000 } }]).figures.some((x) => x.measurement === 'humidity'));
check('not a list is not controllers', C.readControllers({}) === null && C.readControllers([]).sensors.length === 0);
check('the read line', /2 sensors|sensors/.test(C.describeAccountRead(got, 3)) && /Dry room shows as offline/.test(C.describeAccountRead(got, 3)));

// 3. Who reads an account
const R = (over) => E.gatewayReader({ method: 'cloud', readerId: null, readerKind: null, me: 'me', myKind: 'phone', ...over });
check('a phone can take an account', R({ readerId: 'pc', readerKind: 'computer' }).takeOverLabel === 'Read It on This Phone Instead'
  && /password is typed here/.test(R({ readerId: 'pc', readerKind: 'computer' }).takeOverConfirm));
check('nobody reads it, in account words', R({}).text === 'No device reads this account.');

// 4. The words
const sentences = [C.AC_HOW, C.AC_WHAT_IS_SENT, C.AC_FRAGILE_NOTE, C.AC_CONSENT_LABEL, ...C.AC_STEPS, C.AC_PASSWORD_NEEDED, C.AC_WHILE_OPEN_NOTE,
  C.AC_SIGN_IN_ADVICE, C.AC_UNREACHABLE_ADVICE, ...got.notKept, C.describeAccountRead(got, 3)].join(' ');
check('says what is sent and where', /acinfinityserver\.com/.test(C.AC_WHAT_IS_SENT) && /secure storage/.test(C.AC_WHAT_IS_SENT) && /never sent to your other device/.test(C.AC_WHAT_IS_SENT));
check('says it is unpublished and can stop', /not published/.test(C.AC_FRAGILE_NOTE) && /without notice/.test(C.AC_FRAGILE_NOTE));
check('text: no verdict words', !/\b(ideal|optimal|too (low|high)|healthy|unhealthy|perfect)\b/i.test(sentences));
check('text: no dashes as punctuation', !/[–—]| -- /.test(sentences));
check('text: no filler', !/\b(real|genuine|genuinely)\b/i.test(sentences));

// 5. Wiring
const account = read_('lib/acInfinityAccount.ts');
check('password in secure storage', /SecureStore\.setItemAsync\(passwordKey/.test(account) && /deleteItemAsync/.test(account));
const edb = read_('lib/ecowittDb.ts');
check('password never in the database', !/password/i.test(edb.replace(/forgetAcPassword/g, '').replace(/\/\/.*$/gm, '')));
check('cloud read dispatched', /method === 'cloud'\s*\?\s*await fetchAcInfinity/.test(edb) && /forgetAcPassword\(id\)/.test(edb));
check('cloud accounts are read on the timer', /gateway\.method === 'push' \|\| !isDue/.test(edb));
check('method kept as cloud', /held === 'cloud' \? 'cloud'/.test(edb));
const main = read_('desktop/main.js');
check('desktop posts only to AC Infinity', /POST_FORM_HOSTS = new Set\(\['www\.acinfinityserver\.com'\]\)/.test(main) && /parsed\.protocol !== 'https:'/.test(main));
check('desktop post exposed', /web:postForm/.test(read_('desktop/preload.js')) && /postForm\?\(/.test(read_('lib/desktop/bridge.ts')));
const band = read_('components/EcowittGatewaySection.tsx');
check('nothing sent until the switch is on', /if \(!consent\) \{/.test(band) && band.includes('AC_CONSENT_LABEL'));
check('password fields are masked', (band.match(/^\s+secureTextEntry\r?$/gm) || []).length === 2);
check('band mounted', /kind="acinfinity"/.test(read_('components/GrowingConditionsLens.tsx')));

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
