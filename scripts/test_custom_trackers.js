// Checks trackers the person names (D2, lib/customTrackers.ts): what each
// kind accepts, how a value reads, how a day is worked out (a count or a
// length of time adds up, a scale or a measurement is averaged), that a day
// with nothing logged is a gap rather than a zero, where a chart's axis
// runs, that names are unique without regard to case, and that removing a
// tracker with entries retires it rather than deleting it. Then every
// sentence the file writes is swept for verdict and praise words.
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

const t = load('lib/customTrackers.ts');

let failures = 0;
function check(label, ok) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const value = (kind, input) => t.parseTrackerValue(kind, input);
const ok = (result, expected) => result && 'value' in result && result.value === expected;
const problem = (result) => result && 'problem' in result;

// Kinds.
check('four kinds', t.TRACKER_KINDS.length === 4);
check('count and measurement take a unit', t.TRACKER_KINDS.filter((k) => k.takesUnit).map((k) => k.key).join() === 'count,measurement');
check('isTrackerKind', t.isTrackerKind('scale') && !t.isTrackerKind('mood'));
check('count totals', t.dailyMode('count') === 'total' && t.dailyMode('duration') === 'total');
check('scale averages', t.dailyMode('scale') === 'average' && t.dailyMode('measurement') === 'average');

// Values.
check('scale 3', ok(value('scale', { text: '3' }), 3));
check('scale 0 refused', problem(value('scale', { text: '0' })));
check('scale 6 refused', problem(value('scale', { text: '6' })));
check('scale 2.5 refused', problem(value('scale', { text: '2.5' })));
check('scale blank refused', problem(value('scale', { text: '' })));
check('count zero is an answer', ok(value('count', { text: '0' }), 0));
check('count 1.5 refused', problem(value('count', { text: '1.5' })));
check('count negative refused', problem(value('count', { text: '-2' })));
check('measurement comma decimal', ok(value('measurement', { text: '36,6' }), 36.6));
check('measurement negative allowed', ok(value('measurement', { text: '-4' }), -4));
check('measurement text refused', problem(value('measurement', { text: 'warm' })));
check('duration h and min', ok(value('duration', { text: '', hours: '1', minutes: '20' }), 80));
check('duration minutes only', ok(value('duration', { text: '', hours: '', minutes: '45' }), 45));
check('duration zero is an answer', ok(value('duration', { text: '', hours: '0', minutes: '' }), 0));
check('duration blank refused', problem(value('duration', { text: '', hours: '', minutes: '' })));
check('duration 60 min refused', problem(value('duration', { text: '', hours: '', minutes: '60' })));

// Formatting.
check('scale reads of 5', t.formatTrackerValue({ kind: 'scale', unit: null }, 3) === '3 of 5');
check('count with unit', t.formatTrackerValue({ kind: 'count', unit: 'cups' }, 4) === '4 cups');
check('count without unit', t.formatTrackerValue({ kind: 'count', unit: null }, 4) === '4');
check('duration h min', t.formatTrackerValue({ kind: 'duration', unit: null }, 80) === '1 h 20 min');
check('duration whole hour', t.formatTrackerValue({ kind: 'duration', unit: null }, 120) === '2 h');
check('duration minutes', t.formatTrackerValue({ kind: 'duration', unit: null }, 5) === '5 min');
check('measurement rounds', t.formatTrackerValue({ kind: 'measurement', unit: '°C' }, 36.6666) === '36.67 °C');

// Days: sum versus average, gaps stay gaps, range respected.
const entry = (loggedAt, v) => ({ id: loggedAt, trackerId: 'x', value: v, loggedAt, notes: null });
const entries = [
  entry('2026-09-18T08:00', 2),
  entry('2026-09-18T20:00', 4),
  entry('2026-09-20T09:00', 1),
  entry('2026-09-10T09:00', 5),
];
const counted = t.trackerDailySeries('count', entries, '2026-09-15');
check('count adds up the day', counted.length === 2 && counted[0].date === '2026-09-18' && counted[0].value === 6);
const averaged = t.trackerDailySeries('scale', entries, '2026-09-15');
check('scale averages the day', averaged[0].value === 3);
check('no point for the blank 19th', !counted.some((p) => p.date === '2026-09-19'));
check('before the range left out', !counted.some((p) => p.date === '2026-09-10'));
check('sorted by day', counted.every((p, i) => i === 0 || counted[i - 1].date < p.date));
check('a logged zero is kept', t.trackerDailySeries('count', [entry('2026-09-19T08:00', 0)], '2026-09-15').length === 1);

// Chart bounds.
const scaleBounds = t.trackerChartBounds('scale', []);
check('scale always 1 to 5', scaleBounds.yMin === 1 && scaleBounds.yMax === 5);
const countBounds = t.trackerChartBounds('count', counted);
check('count starts at zero', countBounds.yMin === 0 && countBounds.yMax === 6);
const flat = t.trackerChartBounds('measurement', [{ date: '2026-09-18', value: 36.5 }]);
check('flat measurement gets room', flat.yMin < 36.5 && flat.yMax > 36.5);

// Summary sentence.
const coffee = { kind: 'count', unit: 'cups' };
const summary = t.trackerSummarySentence(coffee, counted, 7);
check(`summary counts days (${summary})`, summary.includes('Logged on 2 of the last 7 days.'));
check('summary names low and high', summary.includes('1 cups') && summary.includes('6 cups'));
check('summary counts gap days', summary.includes('5 days have nothing logged and show as a gap.'));
check('summary empty', t.trackerSummarySentence(coffee, [], 30) === 'Nothing logged in the last 30 days.');

// Names.
const tracker = (id, name, retiredAt = null, entryCount = 0) => ({ id, name, kind: 'scale', unit: null, retiredAt, entryCount });
const list = [tracker('a', 'Brain fog'), tracker('b', 'Hot flushes', '2026-09-01', 3)];
check('blank name refused', t.trackerNameProblem('   ', list) !== null);
check('long name refused', t.trackerNameProblem('x'.repeat(61), list) !== null);
check('duplicate without regard to case', t.trackerNameProblem('brain  FOG', list) !== null);
check('retired clash points to Past trackers', (t.trackerNameProblem('hot flushes', list) || '').includes('Past trackers'));
check('renaming to itself is fine', t.trackerNameProblem('Brain Fog', list, 'a') === null);
check('new name is fine', t.trackerNameProblem('Cups of coffee', list) === null);
check('name cleaned', t.cleanTrackerName('  Brain   fog ') === 'Brain fog');

// Removal and lists.
check('nothing logged deletes', t.planTrackerRemoval({ entryCount: 0 }) === 'delete');
check('entries retire', t.planTrackerRemoval({ entryCount: 1 }) === 'retire');
const sorted = t.activeTrackers([tracker('c', 'zinc'), tracker('d', 'Apples'), tracker('e', 'banana', '2026-09-01', 1)]);
check('active alphabetical and unretired', sorted.map((x) => x.name).join() === 'Apples,zinc');
check('past holds the retired', t.pastTrackers(list).map((x) => x.id).join() === 'b');

// Sweep: no verdict, praise, blame or cause anywhere in what this writes.
const FORBIDDEN = [
  'real', 'genuine', ' own ', '—', '–', ' -- ',
  'well done', 'good job', 'keep it up', 'great job', 'you should', 'normal', 'healthy',
  'caused', 'causes', 'because of', 'diagnos', 'too low', 'too high', 'ideal', 'optimal',
];
const sentences = [t.TRACKERS_EMPTY_LINE, t.TRENDS_TRACKERS_EMPTY_LINE, summary, t.trackerSummarySentence(coffee, [], 30)];
for (const kind of t.TRACKER_KINDS) sentences.push(kind.label, kind.line);
sentences.push(t.trackerRemovalSentence({ name: 'Brain fog', entryCount: 0 }), t.trackerRemovalSentence({ name: 'Brain fog', entryCount: 4 }));
sentences.push(t.trackerNameProblem('', list), t.trackerNameProblem('brain fog', list), t.trackerNameProblem('hot flushes', list));
for (const kind of ['scale', 'count', 'duration', 'measurement']) {
  for (const bad of [{ text: '' }, { text: 'x' }, { text: '99.5', hours: '99', minutes: '99' }]) {
    const result = value(kind, bad);
    if (result && 'problem' in result) sentences.push(result.problem);
  }
}
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of FORBIDDEN) check(`"${sentence}" avoids "${word}"`, !lower.includes(word));
}

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('custom trackers: all checks passed');
