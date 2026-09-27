// Checks F3 and F4 of the competitive build plan (Phase 2, 2026-09-26):
// the median hours from the last eating of a food to each flare, said with
// the count behind it, and foods on the worst days beside the best days,
// counted only, with milder days left out of both. Sweeps every sentence
// and the Trends band for verdict words. Exits non-zero on any failure.

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

const B = load('lib/patternBasis.ts');
const W = load('lib/bestWorstDays.ts');

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

// F3: hours before a flare.
const meals = [
  { eatenAt: '2026-06-01T08:00', keys: ['oats', 'milk'] },
  { eatenAt: '2026-06-01T12:30', keys: ['milk'] },
  { eatenAt: '2026-06-01T19:00', keys: ['rice'] },
];
const end = new Date(2026, 5, 1, 20, 0);
const hours = B.hoursBeforeEnd(meals, end, 24);
check('oats 12 hours before', hours.get('oats'), 12);
check('milk counts from its last eating', hours.get('milk'), 7.5);
check('rice an hour before', hours.get('rice'), 1);
check('nothing in the window is null', B.hoursBeforeEnd(meals, new Date(2026, 5, 10, 8, 0), 24), null);
check('outside a short window is left out', B.hoursBeforeEnd(meals, end, 6).has('oats'), false);
check('a meal after the flare is not counted', B.hoursBeforeEnd(meals, new Date(2026, 5, 1, 10, 0), 24).has('rice'), false);

check('one delay is too few', B.medianDelay([3]), null);
check('odd count median', B.medianDelay([2, 9, 4]), { medianHours: 4, count: 3 });
check('even count median', B.medianDelay([2, 4, 6, 10]), { medianHours: 5, count: 4 });
const flareWords = { shortMany: 'flares' };
check('sentence', B.delaySentence({ medianHours: 5, count: 4 }, flareWords), 'Last eaten a median of 5 hours before, across the 4 flares it came before.');
check('one hour', B.delaySentence({ medianHours: 1.2, count: 2 }, flareWords).includes('of 1 hour before'), true);
check('under an hour', B.delaySentence({ medianHours: 0.5, count: 2 }, flareWords).includes('under an hour'), true);
check('other words', B.delaySentence({ medianHours: 3, count: 2 }, { shortMany: 'low mood days' }).endsWith('the 2 low mood days it came before.'), true);

// F4: best days beside worst days.
const dayMeals = [
  { day: '2026-06-01', foods: ['bread', 'milk', 'rice'] },
  { day: '2026-06-02', foods: ['bread', 'rice'] },
  { day: '2026-06-03', foods: ['bread', 'rice', 'kale'] },
  { day: '2026-06-04', foods: ['kale', 'rice'] },
  { day: '2026-06-05', foods: ['kale', 'rice'] },
  { day: '2026-06-06', foods: ['milk', 'bread'] },
  { day: '2026-06-07', foods: ['rice'] },
];
const flares = [
  { day: '2026-06-01', onTen: 7 },
  { day: '2026-06-02', onTen: 9 },
  { day: '2026-06-02', onTen: 2 },
  { day: '2026-06-06', onTen: 3 },
  { day: '2026-06-09', onTen: 8 },
  { day: '2026-06-07', onTen: null },
];
const r = W.bestWorstDays(dayMeals, flares);
check('worst days need meals', r.worstDays, 2);
check('best days have no flare at all', r.bestDays, 3);
check('milder days counted apart', r.milderDays, 2);
check('bread leans worst', r.onWorst.map((e) => e.key), ['bread']);
check('bread counts', r.onWorst[0], { key: 'bread', worst: 2, best: 1 });
check('kale leans best', r.onBest.map((e) => e.key), ['kale']);
check('everyday rice is on neither list', [...r.onWorst, ...r.onBest].some((e) => e.key === 'rice'), false);
check('one-day food is left out', [...r.onWorst, ...r.onBest].some((e) => e.key === 'milk'), false);
check('no refusal', W.bestWorstRefusal(r), null);
check('row sentence', W.foodDaysSentence(r.onWorst[0], r), 'Eaten on 2 of 2 worst days and 1 of 3 best days.');
check(
  'summary',
  W.bestWorstSummary(r),
  'Worst days are the 2 days with a flare or reaction at 6 or more out of 10 and meals logged. Best days are the 3 days with meals logged and no flare or reaction. 2 days with only milder flares or reactions are left out of both.',
);
const thin = W.bestWorstDays([{ day: '2026-06-01', foods: ['a'] }, { day: '2026-06-02', foods: ['a'] }], [{ day: '2026-06-01', onTen: 8 }]);
check('too few worst days lists nothing', thin.onWorst.length + thin.onBest.length, 0);
check('refusal', W.bestWorstRefusal(thin), 'This needs at least 2 of each kind of day with meals logged. So far there is 1 worst and 1 best.');
check('singular summary', W.bestWorstSummary(thin).includes('the 1 day with a flare'), true);
const many = [];
for (let i = 1; i <= 20; i += 1) many.push({ day: `2026-07-${String(i).padStart(2, '0')}`, foods: [`f${i % 12}`, `g${i % 11}`] });
const manyFlares = many.filter((_, i) => i % 2 === 0).map((m) => ({ day: m.day, onTen: 8 }));
const big = W.bestWorstDays(many, manyFlares);
check('at most eight listed', big.onWorst.length <= W.FOODS_LISTED && big.onBest.length <= W.FOODS_LISTED, true);

// No verdicts, anywhere the person reads.
const FORBIDDEN =
  /\b(cause[sd]?|causing|trigger\w*|safe|unsafe|should|must|avoid|healthy|unhealthy|ideal|optimal|bad|good|culprit|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
const written = [
  B.delaySentence({ medianHours: 5, count: 4 }, flareWords),
  W.bestWorstSummary(r),
  W.bestWorstRefusal(thin),
  W.foodDaysSentence(r.onWorst[0], r),
  W.BEST_WORST_CAVEAT,
  W.NOTHING_LEANS,
];
const trends = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/trends.tsx'), 'utf8');
const start = trends.indexOf("'trends:patterns:best-worst'");
const band = trends.slice(start, trends.indexOf("'trends:patterns:factors'"));
const sf = ts.createSourceFile('band.tsx', band, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
(function walk(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (/[A-Z][a-z]+ /.test(node.text)) written.push(node.text);
  }
  ts.forEachChild(node, walk);
})(sf);
check('band text found', written.length >= 8, true);
for (const sentence of written) check(`no verdict words: ${sentence.slice(0, 60)}`, FORBIDDEN.test(sentence), false);

console.log(`${total - failures} of ${total} checks passed`);
if (failures > 0) process.exit(1);
