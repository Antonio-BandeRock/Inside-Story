// Checks K7 (report history), lib/reportHistory.ts (2026-09-29).
//
//  1. A report's range, a name and the words each line says.
//  2. The same report sent the same way within 30 minutes is one line.
//  3. Make it again keeps the range choice, and a custom range its length.
//  4. Names already used, most recent first, each once.
//
// Run with: node scripts/test_report_history.js

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

const H = load('lib/reportHistory.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b));
  }
}

// Range label
same(H.rangeFromLabel('2026-08-31 to 2026-09-29'), { start: '2026-08-31', end: '2026-09-29' }, 'a range label read as two dates');
same(H.rangeFromLabel('last month'), null, 'anything else is not a range');

// Names
same(H.cleanForWhom('  Dr.   Ruiz  '), 'Dr. Ruiz', 'spaces tidied');
same(H.cleanForWhom('   '), null, 'blank means nobody named');
same(H.cleanForWhom(null), null, 'null stays null');
same(H.cleanForWhom('x'.repeat(200)).length, H.FOR_WHOM_MAX, 'a long name is cut to the limit');

// Lines
const entry = { id: 'a', kind: 'r-doctor', rangeKey: '30', rangeStart: '2026-08-31', rangeEnd: '2026-09-29', days: 30, how: 'pdf', forWhom: 'Dr. Ruiz', madeAt: '2026-09-29T15:00:00' };
same(H.historyTitle(entry, 'For Your Doctor'), 'For Your Doctor, Aug 31, 2026 to Sep 29, 2026', 'title names the report and its dates');
same(H.historyTitle(entry, null), 'A report no longer in the app, Aug 31, 2026 to Sep 29, 2026', 'a removed kind still reads');
same(H.historyCaption(entry), 'Shared as a PDF on Sep 29, 2026, for Dr. Ruiz', 'caption says how, when and for whom');
same(H.historyCaption({ ...entry, how: 'csv', forWhom: null }), 'Saved as a spreadsheet on Sep 29, 2026', 'no name, no "for"');
same(H.historyCaption({ ...entry, how: 'text', forWhom: null }), 'Shared as text on Sep 29, 2026', 'text');

// Same sending
same(H.isSameSending(entry, { ...entry, madeAt: '2026-09-29T15:20:00' }), true, 'the same report the same way within 30 minutes is one');
same(H.isSameSending(entry, { ...entry, madeAt: '2026-09-29T15:31:00' }), false, 'later than that is another');
same(H.isSameSending(entry, { ...entry, how: 'text', madeAt: '2026-09-29T15:01:00' }), false, 'another way is another line');
same(H.isSameSending(entry, { ...entry, kind: 'overview', madeAt: '2026-09-29T15:01:00' }), false, 'another report is another line');
same(H.isSameSending(entry, { ...entry, rangeStart: '2026-09-01', madeAt: '2026-09-29T15:01:00' }), false, 'another range is another line');

// Make it again
same(H.againRange(entry, '2026-10-15'), { rangeKey: '30', customStart: null }, 'a preset is picked again');
same(H.againRange({ rangeKey: 'custom', days: 14 }, '2026-10-15'), { rangeKey: 'custom', customStart: '2026-10-02' }, 'a custom range keeps its length, ending today');
same(H.againRange({ rangeKey: 'custom', days: 1 }, '2026-03-01'), { rangeKey: 'custom', customStart: '2026-03-01' }, 'one day is today');

// Earlier names
same(
  H.earlierNames([
    { forWhom: 'Dr. Ruiz', madeAt: '2026-09-01T10:00:00' },
    { forWhom: null, madeAt: '2026-09-20T10:00:00' },
    { forWhom: 'Ana', madeAt: '2026-09-10T10:00:00' },
    { forWhom: 'dr. ruiz', madeAt: '2026-09-15T10:00:00' },
  ]),
  ['dr. ruiz', 'Ana'],
  'most recent first, each name once',
);

// Keys
same(['7', '30', '90', '6m', '1y', 'visit', 'custom', '14'].map(H.isRangeKey), [true, true, true, true, true, true, true, false], 'range keys');
same(['text', 'pdf', 'csv', 'docx'].map(H.isSentHow), [true, true, true, false], 'ways a report goes out');

// No verdicts in anything shown
const shown = [H.REPORT_HISTORY_CAPTION, H.REPORT_HISTORY_EMPTY, H.historyCaption(entry)].join(' ');
same(/\b(real|genuine|genuinely|great|well done|streak)\b/i.test(shown), false, 'no filler or praise');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
