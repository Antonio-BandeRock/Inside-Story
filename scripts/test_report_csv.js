// Checks K5 (a report as spreadsheet files), lib/reportCsv.ts (2026-09-29).
//
//  1. Every table with rows is offered as a file of its own, keyed
//     uniquely, and an empty table is not.
//  2. A table's file is its columns and rows, quoted to RFC 4180, with the
//     byte order mark Excel needs.
//  3. The whole-report file carries every section under its heading, the
//     empty sentence for an empty one, and a photo count in place of photos.
//  4. File names sort a report's files together.
//
// Run with: node scripts/test_report_csv.js

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
    if (name === './db') throw new Error(relPath + ' reaches the database');
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const C = load('lib/reportCsv.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b));
  }
}

const BOM = String.fromCharCode(0xfeff);
const doc = {
  title: 'Doctor Report',
  rangeLabel: '2026-08-31 to 2026-09-29',
  days: 30,
  generatedAt: '2026-09-29T10:15:00',
  preface: ['For Dr. Ruiz'],
  sections: [
    { kind: 'list', heading: 'At a glance', note: 'Counts only.', rows: ['Weight: 68 kg on Sep 20.'], empty: 'Nothing recorded yet.' },
    { kind: 'table', heading: 'Labs', columns: ['Test', 'Value', 'Date'], rows: [['TSH', '5.1', '2026-09-10'], ['Note, with comma', 'say "high"', '2026-09-11']], empty: 'None.' },
    { kind: 'table', heading: 'Labs', columns: ['Test'], rows: [['Ferritin']], empty: 'None.' },
    { kind: 'table', heading: 'Movement', columns: ['Day'], rows: [], empty: 'No movement logged.' },
    { kind: 'photos', heading: 'Photos', rows: [{ caption: 'a', dataUri: 'x' }, { caption: 'b', dataUri: 'y' }], empty: 'No photos.' },
    { kind: 'table', heading: 'Doses & marks (café)', columns: ['Day'], rows: [['2026-09-12']], empty: 'None.' },
  ],
  footer: 'Made on this device.',
  versionLine: 'Inside Story 1.0.56.15',
};

// 1. Tables offered
same(
  C.reportCsvTables(doc).map((t) => t.key),
  ['labs', 'labs-2', 'doses-marks-cafe'],
  'tables with rows only, keys unique, accents folded',
);

// 2. One table
same(
  C.tableCsv(C.reportCsvTables(doc)[0]),
  BOM + 'Test,Value,Date\r\nTSH,5.1,2026-09-10\r\n"Note, with comma","say ""high""",2026-09-11\r\n',
  'a table quoted to RFC 4180 with a BOM',
);

// 3. Whole report
const whole = C.wholeReportCsv(doc).split('\r\n');
same(whole[0], BOM + 'Doctor Report', 'title first, after the BOM');
same(whole.slice(1, 5), ['Covers 2026-08-31 to 2026-09-29', 'Made 2026-09-29', 'Inside Story 1.0.56.15', 'For Dr. Ruiz'], 'range, date, version and preface');
same(whole.slice(5, 9), ['', 'At a glance', 'Counts only.', 'Weight: 68 kg on Sep 20.'], 'a list section under its heading with its note');
same(whole.slice(9, 14), ['', 'Labs', 'Test,Value,Date', 'TSH,5.1,2026-09-10', '"Note, with comma","say ""high""",2026-09-11'], 'a table keeps its columns');
const movement = whole.indexOf('Movement');
same(whole[movement + 1], 'No movement logged.', 'an empty section carries its sentence');
const photos = whole.indexOf('Photos');
same(whole[photos + 1], '2 photos in the PDF', 'photos counted, not embedded');
same(whole.slice(-3), ['', 'Made on this device.', ''], 'footer last, the file ends in CRLF');

// 4. File names
same(C.reportCsvFileName(doc, null), 'inside-story-doctor-report-2026-09-29-30d.csv', 'whole report file name');
same(C.reportCsvFileName(doc, 'labs-2'), 'inside-story-doctor-report-2026-09-29-30d-labs-2.csv', 'table file name');
same(C.slugFor('!!!'), 'section', 'a heading with no letters still names a file');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
