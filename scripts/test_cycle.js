// Checks E1, E2 and E5 of the competitive build plan (Phase 2, 2026-09-26):
// period days become periods (spotting alone never starts one, a single
// unlogged day inside a period does not split it), the average of past
// cycles says what it averaged and that it is no guide to pregnancy, and
// cycle day beside flares is listed only when a start is close enough.
// Also sweeps every sentence and the Cycle lens's text for verdict words.
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const C = load('lib/cycle.ts');
const P = load('lib/patternContext.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

const d = (day, flow = 3) => ({ day, flow });

// Periods.
check('no days, no periods', C.periodsFrom([]), []);
check('consecutive days make one period', C.periodsFrom([d('2026-06-01'), d('2026-06-02'), d('2026-06-03')]), [
  { start: '2026-06-01', end: '2026-06-03', days: 3 },
]);
check('one unlogged day inside does not split it', C.periodsFrom([d('2026-06-01'), d('2026-06-03')]).length, 1);
check('two unlogged days do', C.periodsFrom([d('2026-06-01'), d('2026-06-04')]).length, 2);
check('spotting alone is not a period', C.periodsFrom([d('2026-06-10', 1)]), []);
check('spotting before a period does not move its start', C.periodsFrom([d('2026-06-09', 1), d('2026-06-10')])[0].start, '2026-06-10');
check('a day with no amount counts', C.periodsFrom([d('2026-06-10', null)]).length, 1);
check('order and repeats do not matter', C.periodsFrom([d('2026-06-02'), d('2026-06-01'), d('2026-06-02')])[0], {
  start: '2026-06-01',
  end: '2026-06-02',
  days: 2,
});

// Lengths and the average.
const three = C.periodsFrom([d('2026-05-01'), d('2026-05-29'), d('2026-06-28')]);
check('start to start', C.cycleLengths(three), [28, 30]);
const withGap = C.periodsFrom([d('2026-01-01'), d('2026-05-01'), d('2026-05-29')]);
check('a gap past 90 days is left out', C.cycleLengths(withGap), [28]);
check('one cycle is too few', C.nextPeriodSentence(C.periodsFrom([d('2026-05-01'), d('2026-05-29')]), '2026-06-01'), null);
check(
  'ahead',
  C.nextPeriodSentence(three, '2026-07-01'),
  'Your last 2 cycles averaged 29 days, from 28 to 30 days. Counting 29 days from the start on 28 June puts the next start around 27 July.',
);
check(
  'already passed',
  C.nextPeriodSentence(three, '2026-07-30'),
  'Your last 2 cycles averaged 29 days, from 28 to 30 days. Counting 29 days from the start on 28 June reached 27 July, 3 days ago, with no start logged since.',
);
const same = C.periodsFrom([d('2026-05-01'), d('2026-05-29'), d('2026-06-26')]);
check('equal lengths', C.nextPeriodSentence(same, '2026-07-01').startsWith('Your last 2 cycles averaged 28 days, each 28 days.'), true);
const many = C.periodsFrom(
  ['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26', '2026-04-23', '2026-05-21', '2026-06-18', '2026-07-16', '2026-08-13'].map((x) => d(x)),
);
check('only the last six', C.nextPeriodSentence(many, '2026-08-20').startsWith('Your last 6 cycles'), true);
check('periods sentence', C.periodsSentence(three), '3 periods logged, the first starting 1 May.');
check('periods sentence, none', C.periodsSentence([]), 'No period days logged yet.');
check('flow words', [C.flowWord(1), C.flowWord(4), C.flowWord(null)], ['Spotting', 'Heavy', 'Period day']);

// Cycle day.
check('cycle day 1 is the start', C.cycleDayOn('2026-06-01', ['2026-06-01']), 1);
check('cycle day counts on', C.cycleDayOn('2026-06-14', ['2026-05-01', '2026-06-01']), 14);
check('no start before', C.cycleDayOn('2026-04-01', ['2026-05-01']), null);
check('too far after', C.cycleDayOn('2026-08-01', ['2026-05-01']), null);
check('same reach in both modules', C.CYCLE_DAY_REACH, P.CYCLE_DAY_REACH);

// Beside flares.
const starts = ['2026-06-01', '2026-06-29'];
check('no starts, no line', P.cycleLine(['2026-06-02', '2026-06-05'], []), null);
check('one flare with a day is too few', P.cycleLine(['2026-06-02', '2026-01-01'], starts), null);
check(
  'listed in day order',
  P.cycleLine(['2026-06-26', '2026-06-02', '2026-06-30', '2026-01-01'], starts),
  'Cycle day at each flare with a period start logged in the 60 days before: day 2, day 2 and day 26 (3 of 4 flares).',
);
const lines = P.contextLines({
  flareDates: ['2026-06-02', '2026-06-26'],
  nights: [],
  treatments: [],
  flares: 2,
  flaresWithMeals: 2,
  windowHours: 24,
  periodStarts: starts,
});
check('contextLines carries it', lines.some((line) => line.startsWith('Cycle day at each flare')), true);
check(
  'contextLines without starts leaves it out',
  P.contextLines({ flareDates: ['2026-06-02'], nights: [], treatments: [], flares: 1, flaresWithMeals: 1, windowHours: 24 }).some((l) =>
    l.startsWith('Cycle day'),
  ),
  false,
);
check('other words', P.cycleLine(['2026-06-02', '2026-06-03'], starts, { short: 'low mood day', shortMany: 'low mood days' }).includes('(2 of 2 low mood days)'), true);

// No verdicts, anywhere the person reads.
const FORBIDDEN =
  /\b(regular|irregular|normal|abnormal|late|early|overdue|fertile|fertility|ovulat\w*|safe|unsafe|should|must|healthy|unhealthy|ideal|optimal|cause[sd]?|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
const written = [
  C.nextPeriodSentence(three, '2026-07-01'),
  C.nextPeriodSentence(three, '2026-07-30'),
  C.NOT_FOR_CONTRACEPTION,
  C.TOO_FEW_CYCLES,
  C.periodsSentence(three),
  P.cycleLine(['2026-06-26', '2026-06-02'], starts),
];
const log = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/log.tsx'), 'utf8');
const start = log.indexOf('function CycleLens()');
const end = log.indexOf('// My Trackers (D2');
const lens = ts.createSourceFile('lens.tsx', log.slice(start, end), ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
(function walk(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (/[A-Z][a-z]+ /.test(node.text)) written.push(node.text);
  } else if (ts.isJsxText(node) && node.text.trim()) {
    written.push(node.text.trim());
  }
  ts.forEachChild(node, walk);
})(lens);
const help = log.slice(log.indexOf("key: 'cycle'"), log.indexOf("key: 'trackers'"));
written.push(help);
check('lens text found', written.length > 8, true);
for (const sentence of written) check(`no verdict words: ${sentence.slice(0, 60)}`, FORBIDDEN.test(sentence), false);

console.log(`${total - failures} of ${total} checks passed`);
if (failures > 0) process.exit(1);
