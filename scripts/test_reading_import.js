// Runs lib/readingImport.ts: a controller's history file read into
// garden_readings (I19, 1.0.55.34). Then checks where it is wired.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. Comma, semicolon and tab files are read, quotes and a title line above
//     the headings included, and a decimal comma is recognised.
//  2. Each column gets a guess from its heading, VPD is never read in, and
//     rain and water given never come from a file.
//  3. Days are read as written, and where every day could be read either way
//     round the person is asked.
//  4. One reading per measurement per day: that day's average, lowest,
//     highest and count, with blanks and impossible figures counted and left
//     out.
//  5. The same imported reading always has the same id, so a second import
//     replaces rather than doubles.
//  6. No sentence judges a figure.
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
check('VPD never read in', g('VPD(kPa)').kind === 'vpd' && g('Leaf VPD').kind === 'vpd');
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

// 4. Per day
check('number with unit', R.numberOfCell('24.5°C', false) === 24.5);
check('decimal comma number', R.numberOfCell('24,5', true) === 24.5);
check('dashes are no number', R.numberOfCell('--', false) === null && R.numberOfCell('', false) === null);
check('impossible humidity', !R.couldBeRead('humidity', 104, '%'));
check('unplugged probe', !R.couldBeRead('air_temperature', 999, '°F') && R.couldBeRead('air_temperature', 75, '°F'));
check('pH range', !R.couldBeRead('soil_ph', 15, 'pH'));
const plan = R.planImport({
  table,
  dayColumn: 0,
  order: null,
  columns: [
    { index: 1, measurement: 'air_temperature', unit: '°F' },
    { index: 2, measurement: 'humidity', unit: '%' },
    { index: 3, measurement: 'rainfall', unit: 'mm' },
  ],
  decimalComma: false,
});
const t27 = plan.figures.find((f) => f.day === '2026-09-27' && f.measurement === 'air_temperature');
const h27 = plan.figures.find((f) => f.day === '2026-09-27' && f.measurement === 'humidity');
check('a day per day', plan.days === 2 && plan.firstDay === '2026-09-26' && plan.lastDay === '2026-09-27');
check('day average', Math.abs(t27.average - (74.0 + 72.8 + 80.6) / 3) < 1e-9 && t27.count === 3);
check('lowest and highest', t27.lowest === 72.8 && t27.highest === 80.6);
check('humidity per day', h27.count === 3 && h27.average === (62 + 64 + 58) / 3);
check('rain column never read', plan.figures.every((f) => f.measurement !== 'rainfall'));
check('row with no day counted', plan.rowsWithoutDay === 1);
check('blank counted', plan.notNumbers.humidity === 1);
check('impossible counted', plan.outOfReach.air_temperature === 1);
const semiPlan = R.planImport({ table: semi, dayColumn: 0, order: 'dmy', columns: [{ index: 1, measurement: 'air_temperature', unit: '°C' }], decimalComma: true });
check('decimal comma file averaged', semiPlan.figures.length === 1 && semiPlan.figures[0].average === 25 && semiPlan.figures[0].day === '2026-09-27');
check('one reading note', R.figureNote({ ...t27, count: 1 }, 'tent.csv') === 'One reading from tent.csv.');
check('average note', /^Average of 3 readings that day from tent\.csv; lowest 72\.8/.test(R.figureNote(t27, 'tent.csv')));

// 5. Ids
const idA = R.importedReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', day: '2026-09-27', deviceName: 'Tent 2' });
check('same reading, same id', idA === R.importedReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', day: '2026-09-27', deviceName: ' tent 2 ' }));
check('another day, another id', idA !== R.importedReadingId({ plotId: 'p1', plantingId: null, measurement: 'humidity', day: '2026-09-28', deviceName: 'Tent 2' }));
check('another area, another id', idA !== R.importedReadingId({ plotId: 'p2', plantingId: null, measurement: 'humidity', day: '2026-09-27', deviceName: 'Tent 2' }));
check('an import id never looks typed', /^reading_file_/.test(idA));

// 6. Words
const labelOf = (code) => ({ air_temperature: 'Air temperature', humidity: 'Humidity' })[code] || code;
const lines = R.describePlan(plan, labelOf);
check('span said', lines[0] === '2 days, 26 September 2026 to 27 September 2026, from 6 rows.');
check('left out said', lines.some((l) => /1 row has no day that can be read, and is left out\./.test(l)));
check('impossible said', lines.some((l) => /^Air temperature: 1 figure outside what the sensor can read/.test(l)));
check('empty plan says so', /^Nothing in this file/.test(R.describePlan({ ...plan, figures: [], firstDay: null, lastDay: null }, labelOf)[0]));
const all = [...lines, R.IMPORT_HOW, R.REIMPORT_NOTE, R.VPD_COLUMN_NOTE, R.RAIN_FROM_A_FILE_NOTE, ...Object.values(R.NOT_FROM_A_FILE)].join(' ').toLowerCase();
for (const bad of ['too high', 'too low', 'ideal', 'optimal', 'should be', 'healthy', 'perfect', ' real ', 'genuine']) {
  check(`no "${bad}"`, !all.includes(bad));
}

// Wiring
const db = read('lib/growingConditionsDb.ts');
check('import writes device rows', /export async function importDeviceReadings/.test(db) && /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, 'device'/.test(db));
check('import replaces the same days', /INSERT OR REPLACE INTO garden_readings/.test(db));
check('import in one transaction', /withTransactionAsync/.test(db));
const form = read('components/ReadingImportForm.tsx');
check('form picks a file', /File\.pickFileAsync/.test(form));
check('form can add an area', /<QuickAreaForm/.test(form));
check('form asks the day order', /ORDER_OPTIONS/.test(form));
const lens = read('components/GrowingConditionsLens.tsx');
check('lens offers the import', />Import Readings from a File</.test(lens) && /<ReadingImportForm/.test(lens));
check('desktop picker offers CSV', /'text\/csv'/.test(read('desktop/files.js')));

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
