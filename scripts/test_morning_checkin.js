// Checks D7 of the competitive build plan (Phase 2, 2026-09-26), the
// Morning Check-In: last night's sleep counts only when dated this morning,
// resting heart rate and heart rate variability fall back to yesterday and
// say so, each reading carries the usual-range sentence, the saved answer is
// repeated back in the person's words, and nothing on the card or in the
// reminder scores the night. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, map = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (map[name]) return map[name];
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const usual = load('lib/yourUsual.ts');
const morning = load('lib/morningCheckin.ts', { './yourUsual': usual });

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

check('hours and minutes', morning.formatSleepHours(7 + 20 / 60), '7 h 20 min');
check('whole hours', morning.formatSleepHours(8), '8 h');
check('under an hour', morning.formatSleepHours(0.5), '30 min');
check('five sleep words', morning.SLEEP_QUALITY_WORDS.length, 5);
check('word for 4', morning.sleepQualityWord(4), 'Well');

const days = (n, value) => Array.from({ length: n }, (_, i) => ({ date: `2026-09-${String(10 + i).padStart(2, '0')}`, value }));
const base = { today: '2026-09-26', yesterday: '2026-09-25' };

check('nothing, no lines', morning.morningLines({ ...base, sleep: [], restingHeartRate: [], hrv: [] }), []);
check(
  "yesterday's sleep is not last night",
  morning.morningLines({ ...base, sleep: [{ date: '2026-09-25', value: 7 }], restingHeartRate: [], hrv: [] }),
  [],
);
const lines = morning.morningLines({
  ...base,
  sleep: [...days(10, 7), { date: '2026-09-26', value: 6.5 }],
  restingHeartRate: [...days(10, 60), { date: '2026-09-25', value: 58 }],
  hrv: [...days(10, 40), { date: '2026-09-26', value: 44 }],
});
check('three lines in order', lines.map((l) => l.key), ['sleep', 'restingHeartRate', 'hrv']);
check('sleep reading', lines[0].reading, '6 h 30 min last night');
check('resting heart rate from yesterday says so', lines[1].reading, '58 bpm yesterday');
check('heart rate variability today', lines[2].reading, '44 ms today');
check('each line has a usual sentence', lines.every((l) => typeof l.usual === 'string' && l.usual.length > 0), true);

check('summary both', morning.morningSummary({ sleepQuality: 4, energy: 3, energyWord: 'Some' }), 'Slept well, energy 3 (some).');
check('summary energy only', morning.morningSummary({ sleepQuality: null, energy: 2, energyWord: 'Little' }), 'Energy 2 (little).');
check('summary note only', morning.morningSummary({ sleepQuality: null, energy: null, energyWord: null }), 'Answered this morning.');

// Words. "should" is left out on purpose: the usual-range sentence ends
// "not what they should be", which is the point of it.
const FORBIDDEN = /\b(streak|score[sd]?|budget|readiness|recovery|battery|great|well done|good job|real|genuine|genuinely|must|healthy|unhealthy|optimal|ideal|too (low|high)|normal|abnormal|cause[sd]?)\b|%|!|[–—]| -- /i;
const shown = [morning.NO_READINGS_SENTENCE, ...lines.flatMap((l) => [l.label, l.reading, l.usual])];
for (const file of ['components/MorningCheckin.tsx']) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  (function walk(node) {
    let text = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
    else if (ts.isJsxText(node)) text = node.text.trim();
    if (text && /[A-Za-z]+ [a-z]/.test(text)) shown.push(text);
    ts.forEachChild(node, walk);
  })(source);
}
// The reminder's title and body, read from the source.
const notifications = fs.readFileSync(path.join(__dirname, '..', 'lib/reminderNotifications.ts'), 'utf8');
const block = notifications.slice(notifications.indexOf('function buildMorningPlanned'), notifications.indexOf('// A Photo Series asking'));
check('found the reminder', block.includes("title: 'How did you sleep?'"), true);
shown.push(block.match(/body: `([^`]*)`/)[1]);
const prefs = fs.readFileSync(path.join(__dirname, '..', 'lib/reminderPreferences.ts'), 'utf8');
shown.push(prefs.match(/morning:\s*\n\s*"([^"]*)"/)[1]);
check('found the sentences', shown.length > 8, true);
for (const sentence of shown) check(`no verdict words: ${sentence}`, FORBIDDEN.test(sentence), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
