// Checks K1 (a report over six months, a year, or since the last visit),
// the date arithmetic in lib/reportRange.ts (2026-09-29).
//
// Run with: node scripts/test_report_range.js

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(relPath + ' asked for ' + name);
  });
  return module.exports;
}

const r = load('lib/reportRange.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + ' (got ' + JSON.stringify(a) + ')');
  }
}

same(r.monthsBefore('2026-09-29', 6), '2026-03-29', 'six months before 29 September is 29 March');
same(r.monthsBefore('2026-09-29', 12), '2025-09-29', 'a year before is the same day last year');
same(r.monthsBefore('2026-08-31', 6), '2026-02-28', 'a short month holds to its last day');
same(r.monthsBefore('2028-08-31', 6), '2028-02-29', 'a leap February holds to the 29th');
same(r.monthsBefore('2026-02-15', 6), '2025-08-15', 'six months back crosses the year');
same(r.monthsBefore('2028-02-29', 12), '2027-02-28', 'a year before a leap day is the 28th');

same(r.daysFromThrough('2026-09-29', '2026-09-29'), 1, 'today alone is one day');
same(r.daysFromThrough('2026-09-01', '2026-09-29'), 29, 'both ends are counted');
same(r.daysFromThrough('2025-09-29', '2026-09-29'), 366, 'a year back counts 366 days with both ends');
same(r.daysFromThrough('2026-03-01', '2026-03-31'), 31, 'a clock change inside the range does not lose a day');
same(r.daysFromThrough('2026-10-01', '2026-09-29'), 1, 'a start after today is never below one');

same(r.dayAfter('2026-02-28'), '2026-03-01', 'the day after the end of February');
same(r.dayAfter('2026-12-31'), '2027-01-01', 'the day after New Year’s Eve');

const visit = { date: '2026-09-03', title: 'Thyroid follow-up', providerName: 'Dr Lee' };
same(r.sinceVisitStart(visit), '2026-09-04', 'since the visit starts the day after it');
same(
  r.describeRange(r.sinceVisitStart(visit), '2026-09-29', visit),
  'Since Thyroid follow-up with Dr Lee on September 3, 2026: September 4, 2026 through today, 26 days.',
  'the visit is named with its date',
);
same(
  r.describeRange('2026-09-29', '2026-09-29', { date: '2026-09-28', title: '  ', providerName: null }),
  'Since your appointment on September 28, 2026: September 29, 2026 through today, 1 day.',
  'a visit yesterday with no title reads plainly',
);
same(r.describeRange('2026-03-29', '2026-09-29'), 'March 29, 2026 through today, 185 days.', 'six months says its days');

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
