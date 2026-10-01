// Checks lib/pacing.ts, Trends > Pacing and Home's Pacing Today card (D16,
// 2026-09-30, 1.0.57.24).
//
// 1. Nothing recorded reads as the empty sentence, never as zeros.
// 2. A day with no steps is a gap: its row carries null, never 0.
// 3. The typical day needs 8 days, and minutes come only from days that
//    have minutes.
// 4. Bigger days are counted against the other days on whether a tag came
//    that day or in the two after, and a day whose two after have not all
//    happened is left out.
// 5. The Home lines say "so far", read yesterday's tags, and stay silent
//    until there is a usual range.
// 6. No sentence carries a word from READING_FORBIDDEN_WORDS, a limit, a
//    long dash, or "real"/"genuine".
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

const P = load('lib/pacing.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let failures = 0;
function check(ok, label) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const day = (n) => `2026-09-${String(n).padStart(2, '0')}`;
const range = { start: day(1), end: day(30) };
const today = day(30);
const base = { range, today, steps: [], exercise: [], therapy: [], tagged: [] };
const crash = (n) => ({ date: day(n), code: 'energy_crash', label: 'Energy crash' });

// 1. Nothing recorded.
const empty = P.buildPacingView(base);
check(!empty.hasAnything && empty.empty.length > 0 && empty.bands.length === 0, 'nothing recorded reads as the empty sentence');
check(P.pacingTodayLines(base).length === 0, 'no Home lines with nothing recorded');

// Twenty days of steps, a varied usual, two bigger days, a gap after.
const steps = [];
for (let n = 1; n <= 20; n += 1) steps.push({ date: day(n), value: 5000 + (n % 5) * 200 });
steps[9].value = 15000; // 10 September, past the usual
steps.push({ date: day(29), value: 16000 }); // window not finished
steps.push({ date: day(30), value: 2100 });
const exercise = [
  { date: day(2), name: 'Walk', minutes: 30 },
  { date: day(4), name: 'Yoga', minutes: null },
];
const therapy = [{ date: day(12), label: 'Massage', minutes: 60 }];
const tagged = [crash(11), crash(3), { date: day(29), code: 'overstimulated', label: 'Overstimulated' }];
const full = { ...base, steps, exercise, therapy, tagged };
const view = P.buildPacingView(full);
const band = (id) => view.bands.find((b) => b.id === id);

// 2. Gaps.
const byDay = band('dayByDay');
check(byDay && byDay.rows.length === P.DAY_BY_DAY_LIMIT, 'day by day shows the last fortnight');
const gap = byDay.rows.find((row) => row.key === day(25));
check(gap && gap.value === null, 'a day with no steps carries null');
check(!byDay.rows.some((row) => row.value === 0), 'no zero bar anywhere');

// 3. The typical day.
const usual = P.typicalDay(full);
check(usual.steps && usual.steps.high < 15000 && usual.steps.low >= 2100, `usual steps (${JSON.stringify(usual.steps)})`);
check(usual.minutes === null, 'minutes need 8 days with minutes given');
const few = P.typicalDay({ ...base, steps: steps.slice(0, 7) });
check(few.steps === null, 'seven days are not enough');

// 4. Bigger days.
const bigger = band('biggerDays');
check(bigger && bigger.count === 1, `one finished bigger day (${bigger && bigger.count})`);
check(bigger.items.length === 1 && bigger.items[0].key === day(10), 'the bigger day is 10 September, 29 September left out');
check(bigger.items[0].caption.includes('Energy crash'.toLowerCase()), 'the crash the day after is named');
check(bigger.lines[0].includes('on 1 of them'), 'bigger day tagged within two days');
check(/it was tagged that day or in the 2 after on 5./.test(bigger.lines[1]), `other days tagged count (${bigger.lines[1]})`);
check(band('tags').rows.every((row) => row.value > 0), 'tag rows count days');
check(band('therapy').items[0].caption.startsWith('Nothing tagged'), 'therapy band reads the two days after');

// 5. Home.
const lines = P.pacingTodayLines(full);
check(lines.length >= 1 && lines[0].sentence.startsWith('2,100 steps so far today'), `Home steps line (${lines[0] && lines[0].sentence})`);
const lines2 = P.pacingTodayLines({ ...full, today: day(30), tagged: [...tagged, crash(29)] });
check(lines2.some((l) => l.key === 'yesterday'), 'yesterday tags read on Home');
check(P.pacingTodayLines({ ...base, steps: steps.slice(0, 5) }).length === 0, 'Home silent without a usual range');

// 6. Words.
const sentences = [empty.empty, P.PACING_NO_LIMIT_NOTE, P.PACING_SIDE_BY_SIDE_NOTE, P.PACING_TODAY_CAPTION];
for (const b of view.bands) {
  sentences.push(b.title, ...b.lines, ...(b.notes || []));
  for (const row of b.rows || []) sentences.push(row.label, row.display);
  for (const item of b.items || []) sentences.push(item.title, item.caption || '');
}
for (const l of [...lines, ...lines2]) sentences.push(l.sentence);
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of READING_FORBIDDEN_WORDS) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  for (const word of ['too much', 'overdid', 'real ', 'genuine', 'you need to', 'slow down']) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  check(!/[–—]/.test(sentence), `"${sentence}" has no long dash`);
}
check(!/[–—]/.test(fs.readFileSync(path.join(ROOT, 'lib', 'pacing.ts'), 'utf8')), 'no long dashes in the module');

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('pacing: all checks passed');
