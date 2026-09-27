// Checks D6 of the competitive build plan (Phase 2, 2026-09-26), My daily
// list: the stored list survives rubbish, ratings merge into what a
// check-in saves with None today kept as a 0, a saved check-in reopens with
// its ratings, Pattern Finder's daily-list outcome and its None-today days
// are one answer per local day, and the good-day line under a candidate is
// a count rather than a verdict. Sweeps every sentence for verdict words.
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
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
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const list = load('lib/dailyList.ts');
const basis = load('lib/patternBasis.ts');
const outcome = load('lib/patternOutcome.ts');

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

// The stored list.
check('empty', list.parseDailyList(null), []);
check('rubbish', list.parseDailyList('{nope'), []);
check('not a list', list.parseDailyList('{"a":1}'), []);
check('repeats and non-strings dropped', list.parseDailyList('["fatigue", 3, "fatigue", "", "bloating"]'), ['fatigue', 'bloating']);
check('round trip', list.parseDailyList(list.serializeDailyList(['a', 'b', 'a'])), ['a', 'b']);

// Ratings.
check('five ratings, None today first', list.DAILY_RATINGS.map((r) => r.value), [0, 1, 2, 3, 4]);
check('0 is None today', list.dailyRatingLabel(0), 'None today');
check('3 is Severe', list.dailyRatingLabel(3), 'Severe');

const merged = list.mergeDailyRatings(['headache'], { headache: 2 }, ['fatigue', 'bloating', 'brain_fog'], { fatigue: 0, bloating: 3 });
check('picked and rated tags together', merged.tags, ['headache', 'fatigue', 'bloating']);
check('None today saved as 0, unrated left out', merged.tagSeverity, { headache: 2, fatigue: 0, bloating: 3 });
const overlap = list.mergeDailyRatings(['fatigue'], {}, ['fatigue'], { fatigue: 1 });
check('a tag picked and rated is saved once, with its rating', overlap, { tags: ['fatigue'], tagSeverity: { fatigue: 1 } });

check(
  'reopening seeds ratings, None today included',
  list.ratingsFromSaved(['fatigue', 'bloating', 'brain_fog'], {
    tags: ['bloating', 'headache'],
    tagSeverity: { bloating: 3 },
    noneToday: ['fatigue'],
  }),
  { fatigue: 0, bloating: 3 },
);
check('a listed tag picked without a rating is not a rating', list.ratingsFromSaved(['bloating'], { tags: ['bloating'], tagSeverity: {}, noneToday: [] }), {});
check('nothing saved', list.ratingsFromSaved(['a'], null), {});
check('None today line', list.noneTodaySentence(['Fatigue', 'Bloating']), 'None today: Fatigue, Bloating');
check('no None today line', list.noneTodaySentence([]), null);

// Pattern Finder.
const stamp = (loggedAt) => loggedAt;
const row = (loggedAt, tagSeverity, noneToday = []) => ({
  loggedAt,
  tags: Object.keys(tagSeverity),
  tagSeverity,
  noneToday,
});
const checkins = [
  row('2026-09-10T08:00', { fatigue: 3 }),
  row('2026-09-10T20:00', { fatigue: 1 }, ['bloating']), // a correction later the same day
  row('2026-09-11T08:00', {}, ['fatigue', 'bloating']),
  row('2026-09-12T09:00', { fatigue: 2 }, ['bloating']),
  row('2026-09-13T09:00', { fatigue: 1 }, ['bloating']),
  { loggedAt: '2026-09-14T09:00', tags: ['headache'], tagSeverity: {}, noneToday: [] }, // picked, not rated
  row('2026-08-30T09:00', { fatigue: 4 }), // before the range
];
check(
  'outcome days are Moderate or worse, latest answer per day',
  list.listOutcomeEvents(checkins, '2026-09-01', stamp).map((c) => c.loggedAt),
  ['2026-09-12T09:00'],
);
check('None today days are all zeros', list.noneTodayDays(checkins, '2026-09-01', stamp), ['2026-09-11T08:00']);
check('a Mild day is neither', list.noneTodayDays([row('2026-09-13T09:00', { fatigue: 1 }, ['bloating'])], '2026-09-01', stamp), []);

check('five outcomes', outcome.PATTERN_OUTCOMES.map((o) => o.key).includes('listSymptoms'), true);

// The good-day line.
const set = (...keys) => new Set(keys);
const flares = [set('f:bread'), set('f:bread', 'f:tea')];
const usual = [set('f:tea'), set('f:bread'), set('f:tea')];
const good = [set('f:tea'), set('f:bread'), null];
const bread = basis.compareWindows('f:bread', flares, usual, good);
check('good days counted with meals only', [bread.goodCount, bread.goodDays], [1, 2]);
check('no good days, no fields', 'goodDays' in basis.compareWindows('f:bread', flares, usual), false);
const line = basis.comparisonSentence(bread, 24);
check(
  'good-day line follows the comparison',
  line.endsWith('It was also eaten before 1 of the 2 days you rated everything on your daily list None today (days with meals logged before them).'),
  true,
);
check('no good-day line without good days', basis.goodDaySentence(basis.compareWindows('f:bread', flares, usual)), null);

// Words.
const FORBIDDEN = /\b(streak|safe|trigger|cause[sd]?|because of|proves?|great|well done|good job|real|genuine|genuinely|score|must|should|healthy|bad day)\b|%|!|[–—]| -- /i;
const shown = [
  basis.goodDaySentence(bread),
  list.noneTodaySentence(['Fatigue']),
  ...list.DAILY_RATINGS.map((r) => r.label),
  outcome.outcomeCountsSentence('listSymptoms'),
  outcome.emptyOutcomeSentence('listSymptoms'),
  ...Object.values(outcome.OUTCOME_WORDS.listSymptoms).filter((w) => w.length > 3),
];
const component = ts.createSourceFile(
  'DailyList.tsx',
  fs.readFileSync(path.join(__dirname, '..', 'components/DailyList.tsx'), 'utf8'),
  ts.ScriptTarget.ES2020,
  true,
  ts.ScriptKind.TSX,
);
(function walk(node) {
  let text = null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
  else if (ts.isJsxText(node)) text = node.text.trim();
  if (text && /[A-Za-z]+ [a-z]/.test(text)) shown.push(text);
  ts.forEachChild(node, walk);
})(component);
check('found the sentences', shown.length > 12, true);
for (const sentence of shown) check(`no verdict words: ${sentence}`, FORBIDDEN.test(sentence), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
