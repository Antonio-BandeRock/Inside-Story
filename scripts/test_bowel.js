// Checks lib/bowel.ts, the bowel log (D10, 2026-09-30).
//
// 1. All seven Bristol types are described in plain words.
// 2. A day with nothing logged reads as a gap, never a zero, and a range
//    past 31 days is drawn by week.
// 3. Pattern Finder gets one moment per day, the first of that day.
// 4. Entry detail and the blood line say only what was recorded.
// 5. No word in the module judges a type or claims a cause.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'bowel.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/bowel.ts must stay free of imports (asked for ' + name + ')');
});
const B = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const entry = (id, occurredAt, bristolType, extra = {}) => ({
  id, occurredAt, bristolType, urgency: null, blood: null, pain: null, note: null, ...extra,
});

// 1. Types.
check(B.BRISTOL_TYPES.length === 7, 'seven types');
check(B.BRISTOL_TYPES.every((t, i) => t.type === i + 1 && t.words.length > 5), 'each type has words, in order');
check(B.bristolWords(4) === B.BRISTOL_TYPES[3].words, 'bristolWords reads the list');
check(B.isBristolType(1) && B.isBristolType(7) && !B.isBristolType(0) && !B.isBristolType(8) && !B.isBristolType(2.5), 'isBristolType');
check(B.BLOOD_NOTE.includes('clinician'), 'the blood note points to a clinician');

// 2. Periods.
const entries = [
  entry('a', '2026-09-21T08:00', 4),
  entry('b', '2026-09-21T19:30', 5),
  entry('c', '2026-09-23T07:10', 1, { blood: 1 }),
];
const rows = B.bowelPeriods(entries, '2026-09-21', '2026-09-23');
check(rows.length === 3, 'one row per day');
check(rows[0].value === 2 && rows[0].display === '2, types 4 and 5', 'a logged day counts and names its types');
check(rows[1].value === null && rows[1].display === 'nothing logged', 'an empty day is a gap');
check(rows[2].display === '1, type 1', 'one entry reads with one type');
check(rows[0].label === 'Sep 21', 'day label');
const weekly = B.bowelPeriods(entries, '2026-08-01', '2026-09-30');
check(weekly.length === 9 && weekly[0].label.startsWith('From '), 'past 31 days the rows are weeks');
check(weekly.filter((r) => r.value === null).every((r) => r.display === 'nothing logged'), 'an empty week is a gap');
check(B.bowelRangeSentence(entries, '2026-09-21', '2026-09-23') === '3 entries on 2 of 3 days. Nothing logged on the other 1.', 'range sentence');
check(B.bowelRangeSentence([], '2026-09-21', '2026-09-23') === 'Nothing logged in this range.', 'empty range sentence');
const tally = B.bowelTypeTally(entries);
check(tally.map((t) => `${t.type}:${t.count}`).join() === '1:1,4:1,5:1', 'tally in type order');

// 3. Pattern Finder moments.
const outcome = [
  entry('a', '2026-09-20T09:00', 2),
  entry('b', '2026-09-21T18:00', 1),
  entry('c', '2026-09-21T07:00', 2),
  entry('d', '2026-09-22T07:00', 6),
  entry('e', '2026-09-23T12:00', 7),
];
check(B.bowelOutcomeStamps(outcome, 'typesOneTwo', '2026-09-21').join() === '2026-09-21T07:00', 'one per day, the first, from the range start');
check(B.bowelOutcomeStamps(outcome, 'typesSixSeven', '2026-09-01').join() === '2026-09-22T07:00,2026-09-23T12:00', 'types 6 and 7, oldest first');

// 4. Detail and blood.
check(B.entryDetail({ urgency: 1, blood: 1, pain: 1, note: ' after lunch ' }) === 'Some urgency · blood seen · mild pain · after lunch', 'entry detail');
check(B.entryDetail({ urgency: 0, blood: 0, pain: 0, note: null }) === '', 'nothing worth saying stays empty');
check(B.bloodSeenLine(entries) === 'Blood marked as seen on one day: Sep 23.', 'blood line');
check(B.bloodSeenLine([entries[0]]) === null, 'no blood, no line');

// 5. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
for (const word of ['normal', 'healthy', 'ideal', 'good', 'bad', 'worry', 'because', 'caused', 'streak', 'score']) {
  check(!new RegExp('\b' + word + '\b', 'i').test(code), 'no "' + word + '" in the module');
}

console.log(`${checks - failures}/${checks} bowel log checks passed`);
if (failures > 0) process.exit(1);
