// Checks F11 and F12 of the competitive build plan (Phase 2, 2026-09-26):
// the usual band on a chart comes from every reading but the latest, the
// same as the caption; the Home card speaks only for a reading outside the
// usual range and is empty otherwise; steps are judged on yesterday, never
// on a day still being counted; and the Trends count over the last week
// judges each reading against the ones before it and is silent when none
// sat outside. Sweeps every sentence for verdict and prediction words.
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, map = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    if (map[name]) return map[name];
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const usual = load('lib/yourUsual.ts');
const morning = load('lib/morningCheckin.ts', { './yourUsual': usual });
const O = load('lib/outsideUsual.ts', { './yourUsual': usual, './morningCheckin': morning });

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

// F11: the band.
const ten = [7, 7.5, 6.5, 8, 7, 7.2, 6.8, 7.4, 7.1, 3];
check('band leaves the latest out', usual.usualBandFor(ten), usual.usualRange(ten.slice(0, -1)));
check('band needs 8 earlier', usual.usualBandFor([1, 2, 3]), null);
check('band of nothing', usual.usualBandFor([]), null);
check('band label', usual.USUAL_BAND_LABEL, 'Your usual');

// F12: the Home card.
function days(count, endDay, values) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(2026, 8, endDay - (count - 1 - i));
    out.push({ date: `2026-09-${String(d.getDate()).padStart(2, '0')}`, value: values[i] });
  }
  return out;
}
const steady = [7, 7.5, 6.5, 8, 7, 7.2, 6.8, 7.4, 7.1, 7.3];
const base = { today: '2026-09-20', yesterday: '2026-09-19', sleep: [], restingHeartRate: [], hrv: [], steps: [] };

check('nothing logged, nothing said', O.outsideUsualLines(base), []);
check('inside the range, nothing said', O.outsideUsualLines({ ...base, sleep: days(10, 20, steady) }), []);
const shortNight = [...steady.slice(0, 9), 4.5];
const lines = O.outsideUsualLines({ ...base, sleep: days(10, 20, shortNight) });
check('a short night speaks', lines.map((l) => l.key), ['sleep']);
check('sleep sentence', lines[0].sentence.startsWith('Sleep last night, 4 h 30 min, was below your usual range of '), true);
check('last night only: a night dated yesterday is not last night', O.outsideUsualLines({ ...base, sleep: days(10, 19, shortNight) }), []);
check('too few earlier readings stays silent', O.outsideUsualLines({ ...base, sleep: days(5, 20, [7, 7, 7, 7, 3]) }), []);

const hr = [60, 61, 59, 62, 60, 58, 61, 60, 59, 75];
const hrLines = O.outsideUsualLines({ ...base, restingHeartRate: days(10, 19, hr) });
check('yesterday heart rate stands in', hrLines.map((l) => l.sentence.slice(0, 40)), ['Resting heart rate yesterday, 75 bpm, wa']);
check('above said as above', hrLines[0].sentence.includes('was above your usual range'), true);

const stepValues = [8000, 9000, 8500, 7000, 9500, 8200, 8800, 9100, 8600, 900];
check('today steps are never judged', O.outsideUsualLines({ ...base, steps: days(10, 20, stepValues) }), []);
const stepLines = O.outsideUsualLines({ ...base, steps: days(10, 19, stepValues) });
check('yesterday steps judged', stepLines.map((l) => l.key), ['steps']);
check('steps sentence', stepLines[0].sentence.startsWith('Steps yesterday, 900 steps, was below'), true);

// F12: the Trends count.
check('nothing outside is silent', O.recentOutsideSentence(O.recentOutside(steady), 'nights'), null);
check('too few to judge', O.recentOutside([7, 7, 3]), { judged: 0, below: 0, above: 0 });
const mixed = [7, 7.5, 6.5, 8, 7, 7.2, 6.8, 7.4, 7.1, 3, 7, 11];
const counts = O.recentOutside(mixed, 4);
check('each judged against the ones before', counts, { judged: 4, below: 1, above: 1 });
check(
  'both sides',
  O.recentOutsideSentence(counts, 'nights'),
  'Of the last 4 nights with enough readings before them to judge, 1 was below your usual range and 1 above it, each set beside the readings that came before it.',
);
check('one side', O.recentOutsideSentence({ judged: 7, below: 0, above: 2 }, 'days').includes('2 were above your usual range'), true);

// No verdicts and no predictions.
const FORBIDDEN =
  /\b(abnormal|normal|too|should|must|ideal|optimal|healthy|unhealthy|bad|good|poor|warning|risk|predict\w*|expect\w*|may|might|likely|cause[sd]?|because|streak|score|real|genuine|genuinely)\b|%|!|[–—]| -- /i;
const written = [
  ...lines.map((l) => l.sentence),
  ...hrLines.map((l) => l.sentence),
  ...stepLines.map((l) => l.sentence),
  O.OUTSIDE_USUAL_CAPTION,
  O.recentOutsideSentence(counts, 'nights'),
  O.recentOutsideSentence({ judged: 7, below: 3, above: 0 }, 'days'),
  usual.USUAL_BAND_LABEL,
];
// The house limit, 'not what they should be', is the one use allowed.
for (const sentence of written) {
  check(`no verdict words: ${sentence.slice(0, 60)}`, FORBIDDEN.test(sentence.replace('not what they should be', '')), false);
}

// The Home card draws nothing unless there is a line.
const home = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/index.tsx'), 'utf8');
check('Home asks for content first', /if \(key === 'outsideUsual'\) return \(data\?\.outsideUsual\.length \?\? 0\) > 0;/.test(home), true);
check('Home render checks content', home.includes("if (!homeSectionHasContent('outsideUsual')"), true);

console.log(`${total - failures} of ${total} checks passed`);
if (failures > 0) process.exit(1);
