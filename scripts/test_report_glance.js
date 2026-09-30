// Checks K2 (the At a glance front page of the Overview, Doctor and
// Caregiver reports), lib/reportGlance.ts (2026-09-29).
//
//  1. Symptoms are counted by the days they were marked, with the days
//     checked in beside them; a symptom rated none today is not counted.
//  2. Doses are said in words, never as a share.
//  3. Weight and blood pressure are the latest readings with their dates.
//  4. Only the latest labs outside their lab's printed range are named.
//  5. Nothing it says is a score or a verdict.
//
// Run with: node scripts/test_report_glance.js

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

const G = load('lib/reportGlance.ts');
const T = load('lib/trendsMore.ts');

let checks = 0;
let failures = 0;
function same(a, b, label) {
  checks += 1;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures += 1;
    console.error('FAIL: ' + label + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b));
  }
}
function check(ok, label) {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const said = [];
const tag = (day, code, fields = {}) => ({
  loggedAt: day + 'T09:00:00',
  checkinType: 'daily',
  tagCode: code,
  label: code ? code[0].toUpperCase() + code.slice(1) : null,
  negative: true,
  severity: null,
  ...fields,
});

const base = {
  rangeStart: '2026-09-01',
  today: '2026-09-29',
  checkins: [],
  doses: [],
  weights: [],
  bloodPressure: null,
  labs: [],
};

// --- Symptoms -------------------------------------------------------------
const symptoms = {
  ...base,
  checkins: [
    tag('2026-09-02', 'fatigue'),
    tag('2026-09-02', 'fatigue'),
    tag('2026-09-03', 'fatigue'),
    tag('2026-09-03', 'bloating'),
    tag('2026-09-04', 'bloating', { severity: 0 }),
    tag('2026-09-05', null),
    tag('2026-09-06', 'calm', { negative: false }),
    tag('2026-09-07', 'headache', { checkinType: 'flare' }),
    tag('2026-08-20', 'fatigue'),
  ],
};
const symptomLine = G.glanceSymptomLine(symptoms);
said.push(symptomLine);
same(
  symptomLine,
  'Symptoms marked on the most days (of 6 days with a check-in): fatigue on 2 days, bloating on 1 day, headache on 1 day. Flares logged on 1 day.',
  'symptoms by days, none today and a good feeling not counted, before the range left out',
);
const many = { ...base, checkins: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((c) => tag('2026-09-10', c)) };
const manyLine = G.glanceSymptomLine(many);
said.push(manyLine);
check(manyLine.endsWith(', and 2 other symptoms. No flares logged.'), 'past five the rest are counted: ' + manyLine);
same(G.glanceSymptomLine(base), 'Symptoms: nothing checked in during this range.', 'no check-ins says so');
const quiet = { ...base, checkins: [tag('2026-09-10', null)] };
same(G.glanceSymptomLine(quiet), 'Symptoms: none marked, across 1 day with a check-in. No flares logged.', 'a check-in with nothing marked says so');

// --- Doses ----------------------------------------------------------------
const doses = {
  ...base,
  doses: [
    { scheduledFor: '2026-09-10T08:00:00', status: 'logged' },
    { scheduledFor: '2026-09-11T08:00:00', status: 'logged' },
    { scheduledFor: '2026-09-12T08:00:00', status: 'skipped' },
    { scheduledFor: '2026-09-13T08:00:00', status: 'scheduled' },
    { scheduledFor: '2026-10-01T08:00:00', status: 'scheduled' },
  ],
};
const doseLine = G.glanceDoseLine(doses);
said.push(doseLine);
const expectedDoses = T.describeDoseDays([
  { date: '2026-09-10', mark: 'taken' },
  { date: '2026-09-11', mark: 'taken' },
  { date: '2026-09-12', mark: 'skipped' },
  { date: '2026-09-13', mark: 'unmarked' },
]);
same(doseLine, 'Doses: ' + expectedDoses, 'doses in words, a dose after today left out');
same(G.glanceDoseLine(base), 'Doses: none on the schedule in this range.', 'no doses says so');

// --- Weight and blood pressure --------------------------------------------
const body = {
  ...base,
  weights: [
    { loggedAt: '2026-09-20T07:00:00', value: 68.2, unit: 'kg' },
    { loggedAt: '2026-08-01T07:00:00', value: 71, unit: 'kg' },
    { loggedAt: '2026-09-02T07:00:00', value: 69.4, unit: 'kg' },
  ],
  bloodPressure: { systolic: 124.4, diastolic: 79.6, unit: 'mmHg', loggedAt: '2026-09-25T08:00:00' },
};
said.push(G.glanceWeightLine(body), G.glanceBloodPressureLine(body));
same(G.glanceWeightLine(body), 'Weight: 68.2 kg on Sep 20, down 1.2 kg since Sep 2.', 'weight with its change since the first reading in range');
const heavier = { ...base, weights: [{ loggedAt: '2026-09-02T07:00:00', value: 68, unit: 'kg' }, { loggedAt: '2026-09-20T07:00:00', value: 69.5, unit: 'kg' }] };
same(G.glanceWeightLine(heavier), 'Weight: 69.5 kg on Sep 20, up 1.5 kg since Sep 2.', 'weight up');
const level = { ...base, weights: [{ loggedAt: '2026-09-02T07:00:00', value: 68, unit: 'kg' }, { loggedAt: '2026-09-20T07:00:00', value: 68, unit: 'kg' }] };
same(G.glanceWeightLine(level), 'Weight: 68 kg on Sep 20, the same as on Sep 2.', 'weight the same');
same(G.glanceBloodPressureLine(body), 'Blood pressure: 124/80 mmHg on Sep 25.', 'blood pressure rounded, with its date');
const oneWeight = { ...base, weights: [{ loggedAt: '2026-07-01T07:00:00', value: 70, unit: 'kg' }] };
same(G.glanceWeightLine(oneWeight), 'Weight: 70 kg on Jul 1.', 'a reading before the range still shows, with no change');
same(G.glanceWeightLine(base), null, 'no weight, no line');
same(G.glanceBloodPressureLine(base), null, 'no blood pressure, no line');

// --- Labs -----------------------------------------------------------------
const lab = (displayName, value, low, high, testedAt) => ({ displayName, value, unit: 'mIU/L', low, high, testedAt });
const labs = {
  ...base,
  labs: [lab('TSH', 5.1, 0.4, 4, '2026-09-10'), lab('Free T4', 1.2, 0.8, 1.8, '2026-09-10'), lab('Ferritin', 12, 15, null, '2026-06-01')],
};
const labLines = G.glanceLabLines(labs);
said.push(...labLines);
same(
  labLines,
  ['TSH: 5.1 mIU/L, above the range printed by the lab, tested Sep 10.', 'Ferritin: 12 mIU/L, below the range printed by the lab, tested Jun 1.'],
  'only the ones outside their lab range, newest first',
);
const inside = G.glanceLabLines({ ...base, labs: [lab('TSH', 2, 0.4, 4, '2026-09-10')] });
said.push(...inside);
same(inside, ['Labs: the latest result of each test is inside the range its lab printed, for the 1 test with a range.'], 'all inside says how many had a range');
same(G.glanceLabLines({ ...base, labs: [lab('TSH', 2, null, null, '2026-09-10')] }), ['Labs: none of the latest results has a range from its lab to read it against.'], 'no ranges says so');
same(G.glanceLabLines(base), ['Labs: none recorded.'], 'no labs says so');

// --- The section ----------------------------------------------------------
const section = G.buildAtAGlance({ ...base, checkins: symptoms.checkins, doses: doses.doses, weights: body.weights, bloodPressure: body.bloodPressure, labs: labs.labs });
same(section.heading, 'At a glance', 'the heading');
same(section.rows.length, 6, 'symptoms, doses, weight, blood pressure and two labs');
same(G.buildAtAGlance(base).rows.length, 3, 'with nothing recorded: symptoms, doses and labs each say so');
said.push(G.GLANCE_NOTE);

// --- Wiring ---------------------------------------------------------------
const K = load('lib/reportKinds.ts');
for (const key of ['overview', 'r-doctor', 'r-care']) same(K.REPORT_KIND_BY_KEY[key].core[0], 'glance', key + ' opens with at a glance');
for (const key of Object.keys(K.REPORT_KIND_BY_KEY).filter((k) => !['overview', 'r-doctor', 'r-care'].includes(k))) {
  check(!K.REPORT_KIND_BY_KEY[key].core.includes('glance'), key + ' leaves it out');
}

// --- Forbidden words ------------------------------------------------------
const FORBIDDEN = /\b(score|scored|percent|good|bad|normal|abnormal|healthy|unhealthy|worrying|concerning|improv\w*|worse|better|great|well done|adherence|compliance)\b|%/i;
for (const text of said) check(!FORBIDDEN.test(text), 'no score or verdict in: ' + text);

console.log((failures === 0 ? 'PASS' : 'FAIL') + ' ' + (checks - failures) + '/' + checks);
process.exit(failures === 0 ? 0 : 1);
