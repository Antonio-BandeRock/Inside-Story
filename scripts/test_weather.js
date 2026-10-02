// Runs lib/weather.ts and weatherLines in lib/patternContext.ts, weather
// beside symptoms: F22, 2026-10-01.
//
// The rules checked:
//
//  1. Only a coarsened point leaves the device: half a degree, both ends of
//     the world kept in range.
//  2. NASA POWER's answer is read with its fill value left out, and a day
//     with nothing in it is not stored.
//  3. One span is asked for, from the first missing day to the last, ending
//     two days before today and reaching back no further than the cap.
//  4. Weather beside flares names its counts and denominators, needs enough
//     of both, and says how many flares have no weather yet.
//  5. Units convert, the table stays on this device, and the wiring is in
//     place on Pattern Finder and Compare Two.
//  6. No sentence carries a dash or a cause word.
//
// Run with: node scripts/test_weather.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) return {};
    if (name === './db') throw new Error(`${relPath} reaches the database`);
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const W = load('lib/weather.ts');
const P = load('lib/patternContext.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}
const texts = [];

// 1. Coarsening
const pv = W.coarsenPoint(20.6534, -105.2253);
check(`Puerto Vallarta rounds to the half degree: ${JSON.stringify(pv)}`, pv.lat === 20.5 && pv.lon === -105);
const north = W.coarsenPoint(89.9, 179.9);
check(`top of the world stays in range: ${JSON.stringify(north)}`, north.lat === 90 && north.lon === 180);
const west = W.coarsenPoint(-33.87, -179.9);
check(`date line wraps: ${JSON.stringify(west)}`, west.lon === 180 && west.lat === -34);
check('no negative zero', Object.is(W.coarsenPoint(0.1, -0.1).lon, 0) && Object.is(W.coarsenPoint(-0.1, 0.1).lat, 0));
const url = W.powerUrl(pv.lat, pv.lon, '2026-09-01', '2026-09-29');
check(`URL carries only the coarsened point: ${url}`, url.includes('latitude=20.5') && url.includes('longitude=-105') && !url.includes('20.65'));
check('URL asks for the daily point service', url.startsWith('https://power.larc.nasa.gov/api/temporal/daily/point?'));
check('URL dates are compact', url.includes('start=20260901') && url.includes('end=20260929'));

// 2. Parsing
const body = {
  properties: {
    parameter: {
      T2M: { 20260927: 28.1, 20260928: 27.9, 20260929: -999, 20260930: -999 },
      T2M_MIN: { 20260927: 24, 20260928: 23.5, 20260929: -999, 20260930: -999 },
      T2M_MAX: { 20260927: 32.4, 20260928: 31, 20260929: 30.2, 20260930: -999 },
      RH2M: { 20260927: 78, 20260928: 80, 20260929: -999, 20260930: -999 },
      PS: { 20260927: 100.9, 20260928: 100.7, 20260929: -999, 20260930: -999 },
      PRECTOTCORR: { 20260927: 4.2, 20260928: 0, 20260929: -999, 20260930: -999 },
    },
  },
};
const parsed = W.parsePowerResponse(body);
check(`a day of fill values is left out: ${parsed.map((d) => d.date)}`, parsed.length === 3 && !parsed.some((d) => d.date === '2026-09-30'));
check('dates are dashed', parsed[0].date === '2026-09-27');
const partial = parsed.find((d) => d.date === '2026-09-29');
check('a single fill value is null, the rest kept', partial.tempMaxC === 30.2 && partial.pressureKpa === null && partial.humidity === null);
check('zero rain is a reading, not a gap', parsed[1].rainMm === 0);
check('nonsense reads as nothing', W.parsePowerResponse(null).length === 0 && W.parsePowerResponse({ properties: {} }).length === 0);

// 3. The span to ask for
const today = '2026-10-01';
check('shift across a month', W.shiftDay('2026-10-01', -2) === '2026-09-29');
const none = W.spanToFetch('2026-09-01', today, today, new Set());
check(`ends two days before today: ${JSON.stringify(none)}`, none.start === '2026-09-01' && none.end === '2026-09-29');
const haveMost = new Set();
for (let d = '2026-09-01'; d <= '2026-09-29'; d = W.shiftDay(d, 1)) haveMost.add(d);
check('nothing missing asks for nothing', W.spanToFetch('2026-09-01', today, today, haveMost) === null);
haveMost.delete('2026-09-10');
haveMost.delete('2026-09-20');
const gaps = W.spanToFetch('2026-09-01', today, today, haveMost);
check(`one span from the first gap to the last: ${JSON.stringify(gaps)}`, gaps.start === '2026-09-10' && gaps.end === '2026-09-20');
const old = W.spanToFetch('2020-01-01', today, today, new Set());
check(`reaches back no further than the cap: ${old.start}`, old.start === W.shiftDay('2026-09-29', -(W.MAX_WEATHER_DAYS - 1)));
check('a range ending in the last two days only', W.spanToFetch('2026-09-30', today, today, new Set()) === null);

// 4. Weather beside flares
const days = [];
for (let d = '2026-08-31'; d <= '2026-09-29'; d = W.shiftDay(d, 1)) {
  const n = Number(d.slice(8));
  days.push({ date: d, tempMaxC: 30 + (n % 3), humidity: 70 + (n % 5), pressureKpa: 101 - (n % 4) * 0.05 });
}
// Flares on days pressure fell sharply.
const byDate = new Map(days.map((d) => [d.date, d]));
for (const f of ['2026-09-08', '2026-09-15', '2026-09-22']) byDate.get(f).pressureKpa = byDate.get(W.shiftDay(f, -1)).pressureKpa - 0.3;
const flares = ['2026-09-08', '2026-09-15', '2026-09-22', '2026-09-30'];
const say = (c) => W.sayTemp('C', c);
const lines = P.weatherLines(flares, days, '2026-09-01', say);
texts.push(...lines);
const pressure = lines.find((l) => l.startsWith('Air pressure'));
check(`pressure line names both denominators: ${pressure}`, /fallen by 1 hPa or more from the day before for 3 of 3 flares, against \d+ of \d+ other days\./.test(pressure));
const m = pressure.match(/against (\d+) of (\d+) other days/);
check('other days are the days in the range with no flare', Number(m[2]) === 29 - 3);
check('a high line', lines.some((l) => /^The day’s high averaged \d+\.\d°C across 3 flares, against \d+\.\d°C across 26 other days\.$/.test(l)));
check('a humidity line', lines.some((l) => /^Humidity averaged \d+% across 3 flares/.test(l)));
check(`the flare with no weather is counted: ${lines[lines.length - 1]}`, lines[lines.length - 1].startsWith('1 of the 4 flares have no weather yet.'));
check('one flare is too few', P.weatherLines(['2026-09-08'], days, '2026-09-01', say).every((l) => !l.startsWith('Air pressure') && !l.startsWith('Humidity')));
check('no weather says nothing but the gap', P.weatherLines(flares, [], '2026-09-01', say).length === 1);
check('no flares says nothing', P.weatherLines([], days, '2026-09-01', say).length === 0);
const reactions = P.weatherLines(flares, days, '2026-09-01', say, { short: 'reaction', shortMany: 'reactions' });
check('other outcome words carry through', reactions.some((l) => l.includes('3 of 3 reactions')));

// 5. Units, storage, wiring
check('imperial units', JSON.stringify(W.unitsFor('imperial')) === JSON.stringify({ temp: 'F', pressure: 'inHg', rain: 'in' }));
check('metric when not set', W.unitsFor(null).temp === 'C');
check('°F', W.sayTemp('F', 30) === '86.0°F');
check('hPa', W.sayPressure('hPa', 101.3) === '1013 hPa');
check('inHg', W.sayPressure('inHg', 101.3) === '29.91 inHg');
check('rain in inches', Math.abs(W.rainIn('in', 25.4) - 1) < 1e-9);
const credit = W.weatherCredit('2026-10-01');
check('credit names NASA, POWER, the version and the date', /NASA/.test(credit) && /POWER/.test(credit) && credit.includes('version 2') && credit.includes('2026-10-01'));
texts.push(credit, W.weatherCredit(null), W.WEATHER_OFFER, W.WEATHER_NO_PLACE);
check('the offer says what is sent', W.WEATHER_OFFER.includes('about 55 km') && W.WEATHER_OFFER.includes('never your exact place'));

const sync = read('lib/snapshotSync.ts');
check('the table stays on this device', /DEVICE_LOCAL_TABLES[\s\S]{0,800}'daily_weather'/.test(sync));
check('the fetch note stays on this device', sync.includes("'weather_last_fetch'"));
check('weather writes are not changes to send', read('lib/databaseActivity.ts').includes('|daily_weather)'));
check('the table exists', read('lib/db.ts').includes('CREATE TABLE IF NOT EXISTS daily_weather'));
const wdb = read('lib/weatherDb.ts');
check('nothing is fetched until turned on', /if \(!\(await isWeatherOn\(\)\)\) return \{ state: 'off' \};[\s\S]*fetch\(powerUrl/.test(wdb));
check('a failed request waits six hours', wdb.includes('6 * 60 * 60 * 1000'));
check('one request at a time', wdb.includes('if (inFlight) return inFlight;'));
const finder = read('lib/patternFinder.ts');
check('Pattern Finder reads stored weather', finder.includes('patternWeather(flareDates, rangeStart, today, words)') && !/refreshWeather/.test(finder));
const trends = read('app/(tabs)/trends.tsx');
check('Trends offers it', trends.includes('{WEATHER_OFFER}') && trends.includes("'Add the weather'"));
check('Trends has a way to stop', trends.includes('Stop adding the weather'));
check('Trends fills in missing days, then reads again', trends.includes("if (outcome.state === 'added') setWeatherTick"));
check('help no longer says weather is not recorded', !trends.includes('Weather is not recorded in the app yet'));
const db2 = read('lib/compareSeriesDb.ts');
check('Compare Two offers weather only when turned on', db2.includes('const weather = weatherOn ? await getWeatherUnits() : null;'));
check('Compare Two reads weather', db2.includes("case 'weather':"));
check('Compare Two credits NASA', read('components/CompareTwoLens.tsx').includes('weatherCredit(null)'));
const C = load('lib/compareSeries.ts');
const off = C.buildChoices({ nutrients: [], labs: [], trackers: [], weightUnit: 'kg' });
check('no weather choices when off', !off.some((c) => c.kind === 'weather'));
const on = C.buildChoices({ nutrients: [], labs: [], trackers: [], weightUnit: 'kg', weather: W.unitsFor('imperial') });
check('four weather choices when on', on.filter((c) => c.kind === 'weather').length === 4);
check('in the person’s units', on.find((c) => c.key === 'weather:high').unit === '°F' && on.find((c) => c.key === 'weather:pressure').unit === 'inHg');
check('rain adds up over a day', on.find((c) => c.key === 'weather:rain').perDay === 'total');
check('pressure and flares are a known pair', !!C.pairFor('severity', 'weather:pressure'));
for (const c of on) texts.push(c.label);

// 6. Words
const banned = [...READING_FORBIDDEN_WORDS, 'because', 'correlat', 'linked to', 'trigger', 'caused', 'normal', 'healthy', 'ideal', '—', '–', ' -- ', 'genuine'];
for (const text of texts) {
  const lower = text.toLowerCase();
  for (const word of banned) check(`no "${word}" in "${text}"`, !lower.includes(word));
  check(`no "real" in "${text}"`, !/\breal\b/i.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
