// Checks lib/cycleShading.ts and its wiring, the period shading behind the
// Trends charts (E4, 2026-09-30, 1.0.57.26).
//
// 1. Runs come from logged period days only: spotting on its own shades
//    nothing, and a day missed inside a period is shaded with it.
// 2. A run is cut to the dates a chart draws, and one outside them drops.
// 3. Off, or nothing logged, hands the chart null, so it draws as before.
// 4. The chart reads shading from context, the Trends screen provides it,
//    and the switch is a saved display setting that starts off.
// 5. No sentence carries a word from READING_FORBIDDEN_WORDS, a claim, a
//    prediction, a long dash, or "real"/"genuine".
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

const S = load('lib/cycleShading.ts');
const { READING_FORBIDDEN_WORDS } = load('lib/readingBands.ts');

let failures = 0;
function check(ok, label) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const days = [
  { day: '2026-06-01', flow: 3 },
  { day: '2026-06-02', flow: 2 },
  { day: '2026-06-04', flow: 1 }, // spotting right after a period is left out
  { day: '2026-06-03', flow: 2 },
  { day: '2026-06-15', flow: 1 }, // spotting alone
  { day: '2026-06-29', flow: 3 },
  { day: '2026-07-01', flow: 2 }, // one day missed inside the period
  { day: '2026-08-10', flow: null }, // a period day with no flow given
];

// 1. Runs.
const runs = S.periodRuns(days);
check(runs.length === 3, `three periods (${JSON.stringify(runs)})`);
check(runs[0].start === '2026-06-01' && runs[0].end === '2026-06-03', 'first period, spotting after it not shaded');
check(!runs.some((r) => r.start === '2026-06-15'), 'spotting alone shades nothing');
check(runs[1].start === '2026-06-29' && runs[1].end === '2026-07-01', 'a missed day inside a period is shaded with it');
check(runs[2].start === '2026-08-10', 'a period day with no flow given is shaded');

// 2. Cut to the chart.
const within = S.runsWithin(runs, '2026-06-02', '2026-06-30');
check(within.length === 2, `two runs reach the chart (${JSON.stringify(within)})`);
check(within[0].start === '2026-06-02' && within[0].end === '2026-06-03', 'cut at the start');
check(within[1].start === '2026-06-29' && within[1].end === '2026-06-30', 'cut at the end');
check(S.runsWithin(runs, '2026-09-01', '2026-09-30').length === 0, 'outside the chart drops');

// 3. Off or empty.
check(S.cycleShadingFor(false, days) === null, 'off hands null');
check(S.cycleShadingFor(true, []) === null, 'nothing logged hands null');
check(S.cycleShadingFor(true, [{ day: '2026-06-15', flow: 1 }]) === null, 'spotting alone hands null');
const on = S.cycleShadingFor(true, days);
check(on && on.runs.length === 3 && on.caption === S.CYCLE_SHADING_CAPTION, 'on hands the runs and the caption');

// 4. Wiring.
const chart = fs.readFileSync(path.join(ROOT, 'components', 'TrendLineChart.tsx'), 'utf8');
check(chart.includes('useContext(CycleShadingContext)'), 'the chart reads shading from context');
check(chart.includes('createContext<CycleShading | null>(null)'), 'no shading unless provided');
const trends = fs.readFileSync(path.join(ROOT, 'app', '(tabs)', 'trends.tsx'), 'utf8');
check(trends.includes('<CycleShadingContext.Provider value={cycleShading}>'), 'Trends provides it');
check(trends.includes('setVisualPreferences({ trendsCycleShading: next })'), 'the switch saves a display setting');
const chartLenses = [...trends.matchAll(/lens === '(\w+)'[^\n]*\n(?:(?!lens === ')[\s\S])*?<TrendLineChart/g)].map((m) => m[1]);
const listed = trends.slice(trends.indexOf('const CYCLE_SHADED_LENSES'), trends.indexOf('const DAY_RANGE_OPTIONS'));
for (const lens of new Set(chartLenses)) check(listed.includes(`'${lens}'`), `lens ${lens} with a chart offers the switch`);
const prefs = fs.readFileSync(path.join(ROOT, 'lib', 'visualPreferences.ts'), 'utf8');
check(/trendsCycleShading: false,/.test(prefs), 'starts off');
const food = fs.readFileSync(path.join(ROOT, 'components', 'FoodProductDetailView.tsx'), 'utf8');
check(!food.includes('CycleShadingContext'), 'a food price chart never shades');

// 5. Words.
const sentences = [S.CYCLE_SHADING_CAPTION, S.CYCLE_SHADING_SWITCH_HELP, S.CYCLE_SHADING_SWITCH_LABEL];
for (const sentence of sentences) {
  const lower = ` ${sentence.toLowerCase()} `;
  for (const word of READING_FORBIDDEN_WORDS) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  for (const word of ['predict', 'expected', 'fertile', 'ovulat', 'caused', 'real ', 'genuine']) check(!lower.includes(word), `"${sentence}" avoids "${word}"`);
  check(!/[–—]/.test(sentence), `"${sentence}" has no long dash`);
}
check(!/[–—]/.test(fs.readFileSync(path.join(ROOT, 'lib', 'cycleShading.ts'), 'utf8')), 'no long dashes in the module');

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('cycle shading: all checks passed');
