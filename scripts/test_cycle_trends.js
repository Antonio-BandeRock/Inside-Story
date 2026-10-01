// Checks lib/cycleTrends.ts, Trends > Cycle (E3, 2026-09-30, 1.0.57.25).
//
// 1. No period logged reads as the empty sentence, and so does a range no
//    start reaches.
// 2. Cycle days are counted from each start, through a start before the
//    range, and days past the 60-day reach are left out.
// 3. Every count is taken against the days with a check-in: a cycle day
//    nobody checked in on is null, never 0.
// 4. Tags by week name both numbers; a None today tag never reaches here
//    (the loader leaves severity 0 out).
// 5. Fewer than three cycles says chance can explain a difference.
// 6. No sentence carries a word from READING_FORBIDDEN_WORDS, a claim that
//    the cycle brought something on, a long dash, or "real"/"genuine".
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



const C = load('lib/cycleTrends.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let failures = 0;
function check(ok, label) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const range = { start: '2026-06-01', end: '2026-09-30' };
const today = '2026-09-30';
const period = (start, n) => {
  const out = [];
  const [y, m, d] = start.split('-').map(Number);
  for (let i = 0; i < n; i += 1) {
    const date = new Date(y, m - 1, d + i);
    out.push({ day: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, flow: 3 });
  }
  return out;
};
const base = { range, today, cycleDays: [], checkins: [], tagged: [] };

// 1. Empty.
const none = C.buildCycleTrendsView(base);
check(!none.hasAnything && none.empty.includes('Signals > Cycle'), 'no period logged');
const old = C.buildCycleTrendsView({ ...base, cycleDays: period('2026-01-01', 4) });
check(!old.hasAnything && old.empty.includes('60 days'), 'a start too far back reaches nothing');

// Starts 20 May (before the range), 17 June, 15 July. Nothing after, so
// days past 12 September fall outside the 60-day reach.
const cycleDays = [...period('2026-05-20', 5), ...period('2026-06-17', 5), ...period('2026-07-15', 4)];
const checkins = [
  { date: '2026-06-01', type: 'symptom', mood: 3, energy: 2, stress: 4 }, // day 13 of the May cycle
  { date: '2026-06-17', type: 'flare', mood: 2, energy: 1, stress: null }, // day 1
  { date: '2026-06-18', type: 'symptom', mood: null, energy: null, stress: null }, // day 2
  { date: '2026-07-15', type: 'flare', mood: 4, energy: null, stress: null }, // day 1
  { date: '2026-07-16', type: 'flare', mood: null, energy: null, stress: null }, // day 2
  { date: '2026-09-20', type: 'flare', mood: null, energy: null, stress: null }, // past the reach
];
const tagged = [
  { date: '2026-06-17', label: 'Cramps' },
  { date: '2026-07-15', label: 'Cramps' },
  { date: '2026-07-16', label: 'Bloating' },
];
const input = { ...base, cycleDays, checkins, tagged };

// 2. Numbering.
const { days, starts } = C.cycleFacts(input);
check(starts.join() === '2026-05-20,2026-06-17,2026-07-15', `starts (${starts.join()})`);
check(days.find((d) => d.date === '2026-06-01').cycleDay === 13, 'a start before the range numbers its days');
check(!days.some((d) => d.date === '2026-09-20'), 'past the 60-day reach is left out');
check(days.find((d) => d.date === '2026-09-12').cycleDay === 60, 'day 60 kept');

const view = C.buildCycleTrendsView(input);
const band = (id) => view.bands.find((b) => b.id === id);
check(view.hasAnything, 'a view');
check(band('cycles').lines[0].startsWith('3 cycles in this range'), `cycles counted (${band('cycles').lines[0]})`);
check(band('cycles').lines.some((l) => l.includes('chance')) === false, 'three cycles do not carry the chance line');

// 3. Flares against days checked in.
const flares = band('flares');
const day1 = flares.rows.find((r) => r.key === 'd1');
const day2 = flares.rows.find((r) => r.key === 'd2');
const day5 = flares.rows.find((r) => r.key === 'd5');
check(day1.value === 2 && day1.display === '2 of 2 days checked in', `day 1 (${day1.display})`);
check(day2.value === 1 && day2.display === '1 of 2 days checked in', `day 2 (${day2.display})`);
check(day5.value === null && day5.display === 'No check-in', 'a day nobody checked in on is a gap');
check(!flares.rows.some((r) => r.value === 0 && r.display === 'No check-in'), 'a gap never draws as zero');
check(flares.count === 3, `flares counted (${flares.count})`);

// 4. Tags by week.
const tags = band('tags');
const cramps = tags.items.find((i) => i.key === 'Cramps');
check(cramps.title === 'Cramps, 2 days', `tag title (${cramps.title})`);
check(cramps.caption.includes('days 1 to 7, 2 of 4') && cramps.caption.includes('days 8 to 14, 0 of 1'), `tag caption (${cramps.caption})`);
check(!cramps.caption.includes('days 15 to 21'), 'a week with no check-in is left out of the caption');

// Scales.
const mood = band('scale-mood');
check(mood && mood.rows[0].value === 3 && mood.rows[0].display === '3.0 of 5, 2 days', `mood week 1 (${mood && mood.rows[0].display})`);
check(mood.rows[2].value === null && mood.rows[2].display === 'Not rated', 'an unrated week is a gap');
check(band('scale-stress').rows[1].display === '4.0 of 5, 1 day', 'stress week 2');

// 5. Few cycles.
const two = C.buildCycleTrendsView({ ...input, range: { start: '2026-06-17', end: '2026-08-10' } });
check(two.bands[0].lines.some((l) => l.includes('chance')), 'two cycles say chance can explain a difference');
const nothingChecked = C.buildCycleTrendsView({ ...base, cycleDays });
check(nothingChecked.bands.some((b) => b.id === 'noCheckins'), 'no check-ins says so');

// 6. Words.
const sentences = [none.empty, old.empty, C.CYCLE_SIDE_BY_SIDE_NOTE, C.CYCLE_COUNTED_NOTE];
for (const v of [view, two, nothingChecked]) {
  for (const b of v.bands) {
    sentences.push(b.title, ...b.lines, ...(b.notes || []));
    for (const row of b.rows || []) sentences.push(row.label, row.display);
    for (const item of b.items || []) sentences.push(item.title, item.caption || '');
  }
}
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of READING_FORBIDDEN_WORDS) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  for (const word of ['triggered', 'hormonal', 'luteal', 'pms', 'real ', 'genuine', 'irregular', 'normal']) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  check(!/[–—]/.test(sentence), `"${sentence}" has no long dash`);
}
check(!/[–—]/.test(fs.readFileSync(path.join(ROOT, 'lib', 'cycleTrends.ts'), 'utf8')), 'no long dashes in the module');

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('cycle trends: all checks passed');
