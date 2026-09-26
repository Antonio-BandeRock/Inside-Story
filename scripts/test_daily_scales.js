// Checks mood, energy and stress (D1, lib/dailyScales.ts) and the kinds of
// day Pattern Finder can count (lib/patternOutcome.ts): a day with no answer
// is a gap rather than a zero, a second answer on one day replaces the
// first, a UTC stamp lands on its local day, and each outcome counts the end
// of its scale it says it counts. Then every sentence either file writes is
// swept for verdict and praise words.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error(`${relPath} must stay free of runtime imports`);
  });
  return module.exports;
}

const scales = load('lib/dailyScales.ts');
const outcome = load('lib/patternOutcome.ts');

let failures = 0;
function check(label, ok) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const row = (loggedAt, mood, energy, stress) => ({ loggedAt, mood, energy, stress });

// Words and the picker's vocabulary.
check('three scales', scales.DAILY_SCALES.length === 3);
for (const scale of scales.DAILY_SCALES) check(`${scale.key} has five words`, scale.words.length === 5);
check('scaleWord mood 4', scales.scaleWord('mood', 4) === 'Good');
check('scaleWord stress 1', scales.scaleWord('stress', 1) === 'None');
check('isScaleValue rejects 0', !scales.isScaleValue(0));
check('isScaleValue rejects 6', !scales.isScaleValue(6));
check('isScaleValue rejects 2.5', !scales.isScaleValue(2.5));
check('isScaleValue accepts 3', scales.isScaleValue(3));
check('hasAnyScale empty', !scales.hasAnyScale(scales.EMPTY_DAILY_SCALES));
check('hasAnyScale one', scales.hasAnyScale({ mood: null, energy: 2, stress: null }));
check('describeScales empty is null', scales.describeScales(scales.EMPTY_DAILY_SCALES) === null);
const described = scales.describeScales({ mood: 4, energy: null, stress: 2 });
check(`describeScales names only answered (${described})`, described === 'Mood 4 (Good), Stress 2 (A little)');

// Local stamps: a plain local stamp is kept, a UTC stamp goes through Date.
check('local stamp kept', scales.localStampOf('2026-09-20T21:15:00') === '2026-09-20T21:15');
const utc = '2026-09-21T03:30:00.000Z';
const d = new Date(utc);
const pad = (n) => String(n).padStart(2, '0');
const expectLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
check('UTC stamp read as local', scales.localStampOf(utc) === expectLocal);
check('localDayOf matches', scales.localDayOf(utc) === expectLocal.slice(0, 10));
check('localStamp round trip', scales.localStampOf(scales.localStamp(d)) === expectLocal);

// Series: latest per day, gaps stay gaps, range respected.
const checkins = [
  row('2026-09-18T08:00:00', 2, 3, null),
  row('2026-09-18T20:00:00', 4, null, 5),
  row('2026-09-20T09:00:00', null, 1, 4),
  row('2026-09-10T09:00:00', 1, 1, 5),
];
const mood = scales.dailyScaleSeries(checkins, 'mood', '2026-09-15');
check('mood has one point (the 18th only)', mood.length === 1);
check('latest answer that day wins', mood[0] && mood[0].value === 4 && mood[0].date === '2026-09-18');
const energy = scales.dailyScaleSeries(checkins, 'energy', '2026-09-15');
check('energy skips a later unanswered row', energy.length === 2 && energy[0].value === 3);
check(
  'no zero ever drawn',
  ['mood', 'energy', 'stress'].every((k) => scales.dailyScaleSeries(checkins, k, '2000-01-01').every((p) => p.value >= 1)),
);
check('before the range is left out', !mood.some((p) => p.date === '2026-09-10'));

// Outcomes: low mood counts 1 and 2 only, high stress 4 and 5 only.
const stamp = scales.localStampOf;
const low = outcome.scaleOutcomeEvents(checkins, 'lowMood', '2026-09-01', stamp);
check('low mood: the 10th only (the 18th was corrected to 4)', low.length === 1 && low[0].loggedAt.startsWith('2026-09-10'));
const stress = outcome.scaleOutcomeEvents(checkins, 'highStress', '2026-09-01', stamp);
check('high stress: three days', stress.length === 3);
check('outcome events sorted', stress.every((e, i) => i === 0 || stress[i - 1].loggedAt <= e.loggedAt));
const lowEnergy = outcome.scaleOutcomeEvents(checkins, 'lowEnergy', '2026-09-15', stamp);
check('low energy in range: the 20th only', lowEnergy.length === 1 && lowEnergy[0].loggedAt.startsWith('2026-09-20'));
check('three stays out of low energy', !outcome.scaleOutcomeEvents([row('2026-09-19T09:00', null, 3, null)], 'lowEnergy', '2026-09-01', stamp).length);
check('three stays out of high stress', !outcome.scaleOutcomeEvents([row('2026-09-19T09:00', null, null, 3)], 'highStress', '2026-09-01', stamp).length);

// Every outcome has its pill, its words and its sentences.
check('four outcomes', outcome.PATTERN_OUTCOMES.length === 4);
for (const { key } of outcome.PATTERN_OUTCOMES) {
  const w = outcome.OUTCOME_WORDS[key];
  check(
    `${key} words complete`,
    ['one', 'many', 'short', 'shortMany', 'owner', 'logged', 'loggedMany'].every((k) => typeof w[k] === 'string' && w[k].length > 0),
  );
}

// Sweep: no verdict, praise, blame or cause anywhere in what these write.
const FORBIDDEN = [
  'real', 'genuine', ' own ', '—', '–', ' -- ',
  'well done', 'good job', 'keep it up', 'great job', 'you should', 'normal', 'healthy',
  'caused', 'causes', 'because of', 'depress', 'anxiety', 'diagnos', 'too low', 'too high',
];
const sentences = [];
for (const s of scales.DAILY_SCALES) sentences.push(s.label, ...s.words);
sentences.push(described, scales.answeredSentence(mood, 30), scales.answeredSentence([], 30), scales.answeredSentence(energy, 7));
for (const { key, label } of outcome.PATTERN_OUTCOMES) {
  sentences.push(label, outcome.outcomeCountsSentence(key), outcome.emptyOutcomeSentence(key), ...Object.values(outcome.OUTCOME_WORDS[key]));
}
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of FORBIDDEN) check(`"${sentence}" avoids "${word}"`, !lower.includes(word));
}

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('daily scales and pattern outcomes: all checks passed');
