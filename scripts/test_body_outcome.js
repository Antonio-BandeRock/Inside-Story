// Checks lib/bodyOutcome.ts and the body reading outcomes in
// lib/patternOutcome.ts, Pattern Finder's body readings as outcomes (F2,
// 2026-09-30, 1.0.57.27).
//
// 1. One figure a day per signal, the average, placed at the last reading;
//    average heart rate at the end of its day.
// 2. The usual range needs 8 days with a reading, and a day with no reading
//    is never counted, inside the range or out of it.
// 3. The after counts take each day once from its first time, count only a
//    reading inside the window, and say how many of the days had one.
// 4. Outcome keys round trip, and every outcome has complete words.
// 5. No sentence carries a word from READING_FORBIDDEN_WORDS, a verdict, a
//    cause, a long dash, or "real"/"genuine".
//
// Exits non-zero on any failure.

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
    if (name === './db') throw new Error(`${relPath} reaches the database`);
    return load(path.join(dir, name + '.ts').replace(/\\/g, '/'));
  });
  return module.exports;
}

const B = load('lib/bodyOutcome.ts');
const O = load('lib/patternOutcome.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let failures = 0;
function check(ok, label) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const day = (n) => `2026-09-${String(n).padStart(2, '0')}`;

// 1. Day figures.
const raw = [
  { signal: 'restingHeartRate', date: day(1), at: `${day(1)}T07:00`, value: 60 },
  { signal: 'restingHeartRate', date: day(1), at: `${day(1)}T08:30`, value: 64 },
  { signal: 'hrv', date: day(1), at: `${day(1)}T07:00`, value: 40 },
  { signal: 'heartRate', date: day(1), at: `${day(1)}T12:00`, value: 75 },
];
const rhr = B.bodyDayFigures(raw, 'restingHeartRate');
check(rhr.length === 1 && rhr[0].value === 62 && rhr[0].at === `${day(1)}T08:30`, `one averaged figure at the last reading (${JSON.stringify(rhr)})`);
check(B.bodyDayFigures(raw, 'heartRate')[0].at === `${day(1)}T23:59`, 'average heart rate placed at the end of its day');

// Twenty days of resting heart rate, one high day, gaps on 21 to 25.
const readings = [];
for (let n = 1; n <= 20; n += 1) readings.push({ signal: 'restingHeartRate', date: day(n), at: `${day(n)}T07:00`, value: 58 + (n % 5) });
readings[9].value = 75; // 10 September, above
readings[14].value = 50; // 15 September, below
readings.push({ signal: 'restingHeartRate', date: day(28), at: `${day(28)}T07:00`, value: 80 });
const figures = B.bodyDayFigures(readings, 'restingHeartRate');

// 2. The usual range.
const read = B.readBodyOutcome(figures, 'above', day(1), day(30));
check(read.range && read.range.count === 21, 'range drawn from the 21 days with a reading');
check(read.daysRead === 21, 'days read counts only days with a reading');
check(read.events.map((e) => e.date).join(',') === `${day(10)},${day(28)}`, `above days are 10 and 28 (${read.events.map((e) => e.date)})`);
check(!read.placed.some((p) => p.date === day(23)), 'a gap day is not placed anywhere');
const below = B.readBodyOutcome(figures, 'below', day(1), day(30));
check(below.events.length === 1 && below.events[0].date === day(15), 'below day is 15');
const few = B.readBodyOutcome(figures.slice(0, 7), 'above', day(1), day(30));
check(few.range === null && few.events.length === 0 && few.daysRead === 7, 'seven days draw no range and no events');
check(B.bodyOutcomeNotes(few, 'restingHeartRate', 8)[0].includes('there are 7'), 'notes say how many days there are');
check(B.bodyOutcomeNotes({ placed: [], events: [], range: null, daysRead: 0 }, 'hrv', 8)[0].includes('Health Connect'), 'no readings says where they come from');
const notes = B.bodyOutcomeNotes(read, 'restingHeartRate', 8);
check(notes[0].includes('bpm') && notes[0].includes('not what they should be'), `notes give the range with units (${notes[0]})`);
check(notes[1].includes('left out'), 'notes say a day with no reading is left out');

// 3. After counts. Eaten in the evenings of 9, 14, 22 (gap after) and
// twice on 9 (counted once).
const ats = [`${day(9)}T19:00`, `${day(9)}T21:00`, `${day(14)}T19:00`, `${day(22)}T19:00`];
const c24 = B.afterCounts(ats, read.placed, 24);
check(c24.occasions === 3, `three days (${JSON.stringify(c24)})`);
check(c24.read === 2, 'the day before a gap has no reading after it');
check(c24.above === 1 && c24.below === 1 && c24.within === 0, `one above (10th), one below (15th) (${JSON.stringify(c24)})`);
const c6 = B.afterCounts(ats, read.placed, 6);
check(c6.read === 0, 'a 6 hour window from 19:00 reaches no 07:00 reading');
const line = B.afterSentence(c24, 'restingHeartRate', 24, 'it was eaten');
check(line === 'On 3 days it was eaten. In the 24 hours after, resting heart rate was read on 2 of them: inside your usual range on 0, above it on 1, below it on 1.', `after line (${line})`);
const none = B.afterSentence(c6, 'restingHeartRate', 6, 'it was eaten');
check(none.includes('was not read in the 6 hours after'), `no reading line (${none})`);
check(B.afterSentence({ occasions: 0, read: 0, within: 0, above: 0, below: 0 }, 'hrv', 24, 'it was eaten') === null, 'nothing eaten, no line');
const all = B.afterSentence({ occasions: 2, read: 2, within: 2, above: 0, below: 0 }, 'hrv', 24, 'it was recorded');
check(all.includes('read on all 2: inside your usual range on 2.'), `all read (${all})`);

// 4. Keys and words.
const key = O.bodyOutcomeKey('hrv', 'below');
check(key === 'body:hrv:below', 'key shape');
const parsed = O.parseBodyOutcome(key);
check(parsed && parsed.signal === 'hrv' && parsed.side === 'below', 'key parses back');
check(O.parseBodyOutcome('flares') === null, 'a base outcome is not a body one');
const sentences = [];
for (const signal of ['restingHeartRate', 'heartRate', 'hrv', 'spo2', 'glucose', 'skinTemperature']) {
  for (const side of ['above', 'below']) {
    const k = O.bodyOutcomeKey(signal, side);
    const w = O.outcomeWords(k);
    check(['one', 'many', 'short', 'shortMany', 'owner', 'logged', 'loggedMany'].every((f) => typeof w[f] === 'string' && w[f].length > 0), `${k} words complete`);
    check(O.outcomeCountsSentence(k).includes('never counted as inside'), `${k} counts sentence names gaps`);
    sentences.push(O.outcomeCountsSentence(k), O.emptyOutcomeSentence(k), ...Object.values(w), O.BODY_SIGNAL_LABELS[signal], O.BODY_SIDE_LABELS[side]);
    sentences.push(B.formatBodyValue(signal, 1.25));
  }
}
check(O.outcomeWords('flares').one === O.OUTCOME_WORDS.flares.one, 'base outcomes keep their words');

// 5. Words.
sentences.push(line, none, all, ...notes, ...B.bodyOutcomeNotes(few, 'glucose', 8));
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of READING_FORBIDDEN_WORDS) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  for (const word of ['caused', 'because of', 'led to', 'raised', 'lowered', 'normal', 'healthy', 'real ', 'genuine', 'too high', 'too low']) {
    check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  }
  check(!/[–—]/.test(sentence), `"${sentence}" has no long dash`);
}
check(!/[–—]/.test(fs.readFileSync(path.join(ROOT, 'lib', 'bodyOutcome.ts'), 'utf8')), 'no long dashes in the module');

// Wiring.
const finder = fs.readFileSync(path.join(ROOT, 'lib', 'patternFinder.ts'), 'utf8');
check(finder.includes('bodyRead.events.map'), 'Pattern Finder counts the body days as outcomes');
check(finder.includes("afterLine: body ?"), 'factors carry the after line');
const trends = fs.readFileSync(path.join(ROOT, 'app', '(tabs)', 'trends.tsx'), 'utf8');
check(trends.includes('Body readings') && trends.includes('patternResult.bodyNotes'), 'Trends offers the pill and shows the notes');
check((trends.match(/candidate\.after \?/g) || []).length === 4, 'all four candidate kinds show the after line');

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('body outcome: all checks passed');
