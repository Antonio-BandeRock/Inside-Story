// Runs lib/readingImport.ts: a controller's history file read in whole
// (I19, 1.0.55.34, every row kept with its moment since 1.0.55.35), and the
// hour-by-hour band on Trends. Then checks where it is wired.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. Comma, semicolon and tab files are read, quotes and a title line above
//     the headings included, and a decimal comma is recognised.
//  2. Each column gets a guess from its heading, VPD comes in as Controller
//     VPD, and rain and water given never come from a file.
//  3. Days are read as written, and where every day could be read either way
//     round the person is asked.
//  4. Every row is kept with its moment; a moment the file gives twice is
//     kept once, and blanks and impossible figures are counted and left out.
//  5. Hours and days put figures in two units of one quantity together.
//  6. The same hour or day always has the same id, so a second import
//     rewrites rather than doubles.
//  7. Trends reads hour by hour and day by day, a blank one reading as a gap.
//  8. No sentence judges a figure.
//
// Run with: node scripts/test_reading_import.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const { outputText } = ts.transpileModule(read(relPath), {
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

const R = load('lib/readingImport.ts');

// 1. Reading the file
const acInfinity = [
  '﻿Controller 69 Pro,,,',
  'Time,Temperature(℉),Humidity(%),VPD(kPa)',
  '2026-09-26 23:50:00,75.2,61,1.1',
  '2026-09-27 00:00:00,74.0,62,1.0',
  '2026-09-27 00:10:00,72.8,64,0.9',
  '2026-09-27 12:00:00,80.6,--,1.4',
  '2026-09-27 12:10:00,999,58,1.4',
  ',,,',
  'not a day,70,50,1',
].join('\r\n');
const table = R.parseTable(acInfinity);
check('a title line above the headings is skipped', table.skippedAbove === 1);
check('headings read', table.headers.join('|') === 'Time|Temperature(℉)|Humidity(%)|VPD(kPa)');
check('blank rows dropped', table.rows.length === 6);
const semi = R.parseTable('Datum;Temperatur °C;Luftfeuchte %\n27.09.2026 10:00;24,5;60\n27.09.2026 11:00;25,5;62\n');
check('semicolon file read', semi.headers.length === 3 && semi.rows[0][1] === '24,5');
check('decimal comma recognised', R.usesDecimalComma(semi) && !R.usesDecimalComma(table));
const tabbed = R.parseTable('Date\tCO2 (ppm)\n2026-09-27\t800\n');
check('tab file read', tabbed.headers[1] === 'CO2 (ppm)' && tabbed.rows[0][1] === '800');
const quoted = R.parseTable('"Time","Note, with comma","Temp °C"\n"2026-09-27","a ""b""",21\n');
check('quotes and doubled quotes', quoted.rows[0][1] === 'a "b"' && quoted.rows[0][2] === '21');
check('one line is no table', R.parseTable('just one line') === null);

// 2. Guesses
const g = (h, f) => R.guessColumn(h, f);
check('time column', g('Time').kind === 'time');
check('°F temperature', g('Temperature(℉)').measurement === 'air_temperature' && g('Temperature(℉)').unit === '°F');
check('°C temperature', g('Temp °C').unit === '°C');
check('unmarked temperature follows the person', g('Temperature', true).unit === '°F' && g('Temperature').unit === '°C');
check('soil probe temperature', g('Soil Temp (C)').measurement === 'soil_temperature');
check('humidity', g('Humidity(%)').measurement === 'humidity' && g('RH').measurement === 'humidity');
check('VPD comes in as Controller VPD', g('VPD(kPa)').measurement === 'vpd' && g('VPD(kPa)').unit === 'kPa' && g('Leaf VPD').measurement === 'vpd');
check('co2', g('CO2 (ppm)').measurement === 'co2');
check('pH', g('pH').measurement === 'soil_ph');
check('EC in µS', g('EC (µS/cm)').unit === 'µS/cm' && g('EC').unit === 'mS/cm');
check('moisture', g('Soil Moisture').measurement === 'soil_moisture');
check('light as PPFD', g('PPFD (µmol/m²/s)').unit === 'PPFD');
check('light as lux', g('Light (lux)').unit === 'lux');
check('fan level left out', g('Fan Level').kind === 'skip');
check('rain never from a file', !!R.NOT_FROM_A_FILE.rainfall && !!R.NOT_FROM_A_FILE.water_given);
const cols = R.initialColumns(table, 0, false);
check('day column not offered again', cols.every((c) => c.index !== 0) && cols.length === 3);

// 3. Days
check('ISO with time', R.dayOfCell('2026-09-27 23:50:00', null) === '2026-09-27');
check('ISO slashes', R.dayOfCell('2026/9/7', null) === '2026-09-07');
check('day first', R.dayOfCell('27/09/2026 10:00', 'dmy') === '2026-09-27');
check('month first', R.dayOfCell('09/27/2026', 'mdy') === '2026-09-27');
check('two-figure year', R.dayOfCell('27.09.26', 'dmy') === '2026-09-27');
check('ambiguous without an order is no day', R.dayOfCell('05/06/2026', null) === null);
check('impossible day', R.dayOfCell('2026-02-30', null) === null);
check('words', R.dayOfCell('Sep 27, 2026 2:05 PM', null) === '2026-09-27');
const epoch = new Date(2026, 8, 27, 12).getTime();
check('seconds since 1970', R.dayOfCell(String(Math.floor(epoch / 1000)), null) === '2026-09-27');
check('milliseconds since 1970', R.dayOfCell(String(epoch), null) === '2026-09-27');
check('order found from a day over 12', R.dateOrderOf(['05/06/2026', '27/06/2026']) === 'dmy');
check('order found month first', R.dateOrderOf(['06/05/2026', '06/27/2026']) === 'mdy');
check('order unknown asks', R.dateOrderOf(['05/06/2026', '06/07/2026']) === null);
check('no numeric days', R.dateOrderOf(['2026-09-27']) === 'none');
check('day column found', R.findDayColumn(table) === 0 && R.findDayColumn(semi) === 0);

// 4. Every row, with its moment
check('ISO moment kept', R.momentOfCell('2026-09-27 23:50:00', null) === '2026-09-27 23:50:00');
check('ISO T moment', R.momentOfCell('2026-09-27T08:05', null) === '2026-09-27 08:05:00');
check('words with pm', R.momentOfCell('Sep 27, 2026 2:05 PM', null) === '2026-09-27 14:05:00');
check('day first with time', R.momentOfCell('27/09/2026 10:00', 'dmy') === '2026-09-27 10:00:00');
check('12:30 am is just after midnight', R.momentOfCell('09/27/2026 12:30 am', 'mdy') === '2026-09-27 00:30:00');
check('a day with no time stays a day', R.momentOfCell('2026-09-27', null) === '2026-09-27');
check('epoch has its time', R.momentOfCell(String(Math.floor(epoch / 1000)), null) === '2026-09-27 12:00:00');
const utc = new Date(Date.UTC(2026, 8, 27, 12, 0, 0));
const pad = (n) => String(n).padStart(2, '0');
const utcLocal = `${utc.getFullYear()}-${pad(utc.getMonth() + 1)}-${pad(utc.getDate())} ${pad(utc.getHours())}:${pad(utc.getMinutes())}:00`;
check('an offset is turned into local time', R.momentOfCell('2026-09-27T12:00:00Z', null) === utcLocal);
check('number with unit', R.numberOfCell('24.5°C', false) === 24.5);
check('decimal comma number', R.numberOfCell('24,5', true) === 24.5);
check('dashes are no number', R.numberOfCell('--', false) === null && R.numberOfCell('', false) === null);
check('impossible humidity', !R.couldBeRead('humidity', 104, '%'));
check('unplugged probe', !R.couldBeRead('air_temperature', 999, '°F') && R.couldBeRead('air_temperature', 75, '°F'));
check('pH range', !R.couldBeRead('soil_ph', 15, 'pH'));
check('VPD range', R.couldBeRead('vpd', 1.2, 'kPa') && !R.couldBeRead('vpd', 25, 'kPa') && !R.couldBeRead('vpd', -1, 'kPa'));
const plan = R.planImport({
  table,
  dayColumn: 0,
  order: null,
  columns: [
    { index: 1, measurement: 'air_temperature', unit: '°F' },
    { index: 2, measurement: 'humidity', unit: '%' },
    { index: 3, measurement: 'vpd', unit: 'kPa' },
    { index: 3, measurement: 'rainfall', unit: 'mm' },
  ],
  decimalComma: false,
});
check('every row kept', plan.kept.air_temperature === 4 && plan.kept.humidity === 4 && plan.kept.vpd === 5);
check('samples carry their moment', plan.samples.some((s) => s.measurement === 'air_temperature' && s.at === '2026-09-27 00:10:00' && s.value === 72.8));
check('VPD comes in', plan.samples.filter((s) => s.measurement === 'vpd').length === 5);
check('days spanned', plan.days === 2 && plan.firstDay === '2026-09-26' && plan.lastDay === '2026-09-27');
check('rain column never read', plan.samples.every((s) => s.measurement !== 'rainfall'));
check('row with no day counted', plan.rowsWithoutDay === 1);
check('blank counted', plan.notNumbers.humidity === 1);
check('impossible counted', plan.outOfReach.air_temperature === 1);
const repeats = R.parseTable('Time,Temp °C\n2026-09-27 10:00,20\n2026-09-27 10:00,21\n2026-09-27,22\n');
const repeatPlan = R.planImport({ table: repeats, dayColumn: 0, order: null, columns: [{ index: 1, measurement: 'air_temperature', unit: '°C' }], decimalComma: false });
check('a repeated moment is kept once', repeatPlan.kept.air_temperature === 2 && repeatPlan.repeatsInFile.air_temperature === 1);
check('the first of a repeat is the one kept', repeatPlan.samples[0].value === 20);
check('a row with no time counted', repeatPlan.rowsWithoutTime === 1);
const semiPlan = R.planImport({ table: semi, dayColumn: 0, order: 'dmy', columns: [{ index: 1, measurement: 'air_temperature', unit: '°C' }], decimalComma: true });
check('decimal comma file read', semiPlan.samples.length === 2 && semiPlan.samples[0].value === 24.5 && semiPlan.samples[0].at === '2026-09-27 10:00:00');

// 5. Hours and days
const combined = R.combineGroups([
  { measurement: 'air_temperature', unit: '°C', period: '2026-09-27 10', sum: 60, count: 3, lowest: 19, highest: 21 },
  { measurement: 'air_temperature', unit: '°F', period: '2026-09-27 10', sum: 68, count: 1, lowest: 68, highest: 68 },
  { measurement: 'humidity', unit: '%', period: '2026-09-27 10', sum: 120, count: 2, lowest: 55, highest: 65 },
]);
const hourT = combined.find((f) => f.measurement === 'air_temperature');
check('two units in one hour move into the usual one', hourT.unit === '°C' && hourT.count === 4 && Math.abs(hourT.average - 20) < 1e-9);
check('lowest and highest across units', Math.abs(hourT.lowest - 19) < 1e-9 && Math.abs(hourT.highest - 21) < 1e-9);
check('a figure for each measurement', combined.length === 2 && combined.find((f) => f.measurement === 'humidity').average === 60);
check('a unit that cannot move is left out', R.combineGroups([
  { measurement: 'x', unit: 'kg', period: 'p', sum: 3, count: 3, lowest: 1, highest: 1 },
  { measurement: 'x', unit: '°C', period: 'p', sum: 2, count: 1, lowest: 2, highest: 2 },
])[0].count === 3);
const day27 = { measurement: 'air_temperature', unit: '°F', period: '2026-09-27', average: 75.8, lowest: 72.8, highest: 80.6, count: 3 };
check('one reading note', R.figureNote({ ...day27, count: 1 }, 'Tent 2') === 'One reading from Tent 2.');
check('average note', /^Average of 3 readings that day from Tent 2; lowest 72\.8/.test(R.figureNote(day27, 'Tent 2')));
check('device names compared loosely', R.deviceKeyOf(' Tent 2 ') === 'tent 2');

// 6. Ids
const idA = R.importedReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', day: '2026-09-27', deviceName: 'Tent 2' });
check('same reading, same id', idA === R.importedReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', day: '2026-09-27', deviceName: ' tent 2 ' }));
check('another day, another id', idA !== R.importedReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', day: '2026-09-28', deviceName: 'Tent 2' }));
check('another area, another id', idA !== R.importedReadingId({ plotId: 'p2', plantingId: null, measurement: 'humidity', day: '2026-09-27', deviceName: 'Tent 2' }));
check('an import id never looks typed', /^reading_file_/.test(idA));
const hourA = R.hourReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', hour: '2026-09-27 10', deviceName: 'Tent 2' });
check('same hour, same id', hourA === R.hourReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', hour: '2026-09-27 10', deviceName: 'tent 2' }));
check('another hour, another id', hourA !== R.hourReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', hour: '2026-09-27 11', deviceName: 'Tent 2' }));
check('hour ids stand apart', /^reading_hour_/.test(hourA));

// 7. Hour by hour on Trends
const G = load('lib/growingConditions.ts');
const hr = (hour, average, extra = {}) => ({
  plotId: 'p1',
  plotName: 'Tent',
  plantingId: null,
  deviceName: 'Tent 2',
  unit: '°C',
  hour,
  average,
  lowest: average - 1,
  highest: average + 1,
  count: 6,
  ...extra,
});
const hourRows = [hr('2026-09-25 10', 20), hr('2026-09-27 10', 22), hr('2026-09-27 11', 24), hr('2026-09-27 11', 30, { deviceName: 'Probe' })];
const detail = G.buildDeviceDetail({ rows: hourRows, labelOfSource: (r) => r.deviceName, pickedSource: null, pickedDay: null });
check('a source per device', detail.sources.length === 2 && detail.sources[0].label === 'Probe');
const tentKey = G.deviceSourceKey({ plotId: 'p1', plantingId: null, deviceName: 'Tent 2' });
const tent = G.buildDeviceDetail({ rows: hourRows, labelOfSource: (r) => r.deviceName, pickedSource: tentKey, pickedDay: null });
check('days latest first', tent.days.map((d) => d.key).join(',') === '2026-09-27,2026-09-26,2025-09-25'.replace('2025', '2026'));
check('a day with nothing is a gap', tent.days[1].value === null && tent.days[1].display === 'not logged');
check('a day averages its hours', tent.days[0].value === 23);
check('latest day picked', tent.day === '2026-09-27' && tent.hours.length === 24);
check('an hour with nothing is a gap', tent.hours[9].value === null && tent.hours[9].display === 'not logged');
check('an hour shows its spread', tent.hours[11].value === 24 && tent.hours[11].display === '24°C, 23 to 25');
check('the gap is said', tent.notes.some((n) => /^1 day in that stretch had nothing logged/.test(n)));
const picked = G.buildDeviceDetail({ rows: hourRows, labelOfSource: (r) => r.deviceName, pickedSource: tentKey, pickedDay: '2026-09-25' });
check('a picked day is shown', picked.day === '2026-09-25' && picked.hours[10].value === 20);
check('no hours, no band', G.buildDeviceDetail({ rows: [], labelOfSource: () => '', pickedSource: null, pickedDay: null }) === null);

// 8. Words
const labelOf = (code) => ({ air_temperature: 'Air temperature', humidity: 'Humidity', vpd: 'Controller VPD' })[code] || code;
const lines = R.describePlan(plan, labelOf);
check('span said', lines[0] === '2 days, 26 September 2026 to 27 September 2026, from 6 rows.');
check('what is kept said', lines[1] === 'Kept: air temperature, 4 figures, humidity, 4 figures and controller vpd, 5 figures.');
check('left out said', lines.some((l) => /1 row has no day that can be read, and is left out\./.test(l)));
check('impossible said', lines.some((l) => /^Air temperature: 1 figure outside what the sensor can read/.test(l)));
check('repeats said', R.describePlan(repeatPlan, labelOf).some((l) => /^Air temperature: 1 figure repeats a moment the file already gave/.test(l)));
check('no time said', R.describePlan(repeatPlan, labelOf).some((l) => /^1 row has a day and no time/.test(l)));
check('empty plan says so', /^Nothing in this file/.test(R.describePlan({ ...plan, samples: [], firstDay: null, lastDay: null }, labelOf)[0]));
const all = [
  ...lines,
  ...tent.notes,
  tent.headline,
  tent.hoursHeadline,
  R.IMPORT_HOW,
  R.REIMPORT_NOTE,
  R.WHERE_KEPT_NOTE,
  R.VPD_COLUMN_NOTE,
  R.RAIN_FROM_A_FILE_NOTE,
  ...Object.values(R.NOT_FROM_A_FILE),
]
  .join(' ')
  .toLowerCase();
for (const bad of ['too high', 'too low', 'ideal', 'optimal', 'should be', 'healthy', 'perfect', ' real ', 'genuine']) {
  check(`no "${bad}"`, !all.includes(bad));
}

// Wiring
const db = read('lib/growingConditionsDb.ts');
check('import writes device rows', /export async function importDeviceReadings/.test(db) && /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, 'device'/.test(db));
check('every moment kept once', /INSERT OR IGNORE INTO garden_device_samples/.test(db));
check('hours written', /INSERT OR REPLACE INTO garden_reading_hours/.test(db));
check('days rewritten from what is held', /INSERT OR REPLACE INTO garden_readings/.test(db));
check('import in one transaction', /withTransactionAsync/.test(db));
check('Trends reads the hours', /FROM garden_reading_hours/.test(db) && /buildDeviceDetail\(/.test(db));
const schema = read('lib/db.ts');
check('samples table has no duplicate moments', /CREATE TABLE IF NOT EXISTS garden_device_samples[\s\S]*?PRIMARY KEY \(plot_id, planting_id, device_key, measurement, measured_at\)/.test(schema));
check('hours table exists', /CREATE TABLE IF NOT EXISTS garden_reading_hours/.test(schema));
check('samples stay on the device', /DEVICE_LOCAL_TABLES: readonly string\[\] = \[[^\]]*'garden_device_samples'/.test(read('lib/snapshotSync.ts')));
check('sync skips what stays on the device', (read('lib/snapshotSyncDevice.ts').match(/buildBackupEnvelope\(DEVICE_LOCAL_TABLES\)/g) || []).length === 3);
check('Controller VPD is a measurement', /code: 'vpd', label: 'Controller VPD'/.test(read('lib/growSetup.ts')));
const form = read('components/ReadingImportForm.tsx');
check('form picks a file', /File\.pickFileAsync/.test(form));
check('form can add an area', /<QuickAreaForm/.test(form));
check('form asks the day order', /ORDER_OPTIONS/.test(form));
check('form imports every sample', /importDeviceReadings\(plan\.samples/.test(form));
const lens = read('components/GrowingConditionsLens.tsx');
check('lens offers the import', />Import Readings from a File</.test(lens) && /<ReadingImportForm/.test(lens));
check('Trends shows hour by hour', /trends:conditions:device/.test(read('app/(tabs)/trends.tsx')));
check('desktop picker offers CSV', /'text\/csv'/.test(read('desktop/files.js')));

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
