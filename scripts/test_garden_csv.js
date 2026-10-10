// Runs lib/gardenCsv.ts: the garden as spreadsheet files (I15), and checks
// where the buttons stand.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. Quoting follows RFC 4180, so a note with a comma, a quote or a line
//     break comes back out of a spreadsheet exactly as written.
//  2. Each file starts with a byte order mark (Excel reads UTF-8 by it) and
//     ends its lines in CRLF.
//  3. Rows are sorted the way a person reads a garden, and a removed area
//     reads as blank rather than dropping the row.
//  4. The buttons stand on Garden > Plots & Plantings and under the Garden
//     report, and an empty file is never handed over.
//
// Run with: node scripts/test_garden_csv.js
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

// A plain RFC 4180 reader, written separately from the writer so the test
// does not grade the module against itself.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\r' && text[i + 1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 1; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const C = run('lib/gardenCsv.ts', {});
const { plantingStatusLabel } = run('lib/gardenAreaLifecycle.ts', {});

// 1. Quoting
check('plain field untouched', C.csvField('Beans') === 'Beans');
check('comma quoted', C.csvField('Tomato, cherry') === '"Tomato, cherry"');
check('quote doubled', C.csvField('the "big" one') === '"the ""big"" one"');
check('line break quoted', C.csvField('line one\nline two') === '"line one\nline two"');
check('null blank', C.csvField(null) === '' && C.csvField(undefined) === '');
check('number written', C.csvField(1.5) === '1.5' && C.csvField(0) === '0');
check('not a number blank', C.csvField(NaN) === '');

const tricky = 'Fed with "fish" emulsion, 2 capfuls\r\nthen watered';
const roundTrip = parseCsv(C.toCsv(['A', 'B'], [[tricky, 'Épinard']]).slice(1));
check('round trip keeps the text', roundTrip[1][0] === tricky && roundTrip[1][1] === 'Épinard', JSON.stringify(roundTrip));

// 2. Framing
const sample = C.toCsv(['A'], [['x']]);
check('byte order mark', sample.charCodeAt(0) === 0xfeff);
check('CRLF lines', sample === '﻿A\r\nx\r\n', JSON.stringify(sample));

// 3. The three files
const plantings = [
  { id: 'p2', areaName: 'Back bed', foodName: 'Peas', variety: null, plantedOn: '2026-04-10', expectedFrom: null, expectedTo: null, status: 'growing', firstPickedOn: null, harvestCount: 0, doneCount: 2, notes: null },
  { id: 'p1', areaName: 'Back bed', foodName: 'Beans', variety: 'Blue Lake', plantedOn: '2026-04-01', expectedFrom: '2026-06-01', expectedTo: '2026-07-01', status: 'removed', firstPickedOn: '2026-06-05', harvestCount: 3, doneCount: 0, notes: 'Shady, by the fence' },
  { id: 'p3', areaName: null, foodName: 'Apple', variety: null, plantedOn: '2020-03-01', expectedFrom: null, expectedTo: null, status: 'planned', firstPickedOn: null, harvestCount: 0, doneCount: 0, notes: null },
];
const pRows = parseCsv(C.plantingsCsv(plantings, plantingStatusLabel).slice(1));
check('plantings header', pRows[0].join('|') === C.PLANTINGS_HEADER.join('|'));
check('plantings every row', pRows.length === 4, String(pRows.length));
check('removed area blank and first', pRows[1][0] === '' && pRows[1][1] === 'Apple', pRows[1].join('|'));
check('by area then day', pRows[2][1] === 'Beans' && pRows[3][1] === 'Peas');
check('status in words', pRows[2][6] === 'Pulled out' && pRows[1][6] === 'To sow', `${pRows[2][6]} ${pRows[1][6]}`);
check('notes with a comma survive', pRows[2][10] === 'Shady, by the fence');
check('counts written', pRows[2][8] === '3' && pRows[3][9] === '2');

const harvests = [
  { id: 'h2', plantingId: 'p1', harvestedOn: '2026-06-20', foodName: 'Beans', areaName: 'Back bed', quantity: 400, unit: 'g', remaining: 0, onHand: false, notes: null },
  { id: 'h1', plantingId: null, harvestedOn: '2026-06-05', foodName: 'Beans', areaName: null, quantity: 3, unit: 'handful', remaining: 1, onHand: true, notes: null },
];
const hRows = parseCsv(C.harvestsCsv(harvests).slice(1));
check('harvests oldest first', hRows[1][0] === '2026-06-05' && hRows[2][0] === '2026-06-20');
check('kept as food in words', hRows[1][6] === 'Yes' && hRows[2][6] === 'No');
check('unit as recorded', hRows[1][4] === 'handful');
check('no planting blank', hRows[1][8] === '');

const done = [{ id: 'e1', plantingId: 'p2', occurredOn: '2026-05-01', foodName: 'Peas', areaName: 'Back bed', label: 'Staked or tied', note: null }];
const dRows = parseCsv(C.doneCsv(done).slice(1));
check('done row', dRows[1].join('|') === '2026-05-01|Peas|Back bed|Staked or tied||p2', dRows[1].join('|'));

check('file names', C.gardenCsvFileName('done', '2026-09-28') === 'lifestead-garden-what-was-done-2026-09-28.csv' && C.gardenCsvFileName('plantings', '2026-09-28') === 'lifestead-garden-plantings-2026-09-28.csv');
check('three kinds', C.GARDEN_CSV_KINDS.map((k) => k.kind).join() === 'plantings,harvests,done');
for (const kind of ['plantings', 'harvests', 'done']) check(`empty wording ${kind}`, /nothing to put in the file/.test(C.nothingToSave(kind)));

// 4. Wiring
const garden = read('app/(tabs)/garden.tsx');
const reports = read('app/(tabs)/reports.tsx');
const db = read('lib/gardenCsvDb.ts');
const buttons = read('components/GardenCsvButtons.tsx');
check('on Plots & Plantings', /<GardenCsvButtons/.test(garden) && /title="Save as a Spreadsheet"/.test(garden));
check('under the Garden report', /lens === 'r-garden'[\s\S]{0,200}<GardenCsvButtons/.test(reports));
check('empty never handed over', /if \(rows === 0\) return \{ status: 'empty' \}/.test(db));
check('CSV mime type', /mimeType: 'text\/csv'/.test(db));
check('removed areas kept', (db.match(/LEFT JOIN garden_plots/g) || []).length === 3);
check('buttons say when empty', /nothingToSave\(kind\)/.test(buttons));

// Wording
const text = [read('lib/gardenCsv.ts'), buttons].join('\n').match(/'[^'\n]*'|`[^`]*`|"[^"\n]*"|>[^<>{}\n]+</g) || [];
for (const pattern of [/—|–| -- /, /\breal\b/i, /\bgenuine(ly)?\b/i, /\bshould\b/i]) {
  const hit = text.find((s) => pattern.test(s));
  check(`no ${pattern}`, !hit, hit);
}

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
