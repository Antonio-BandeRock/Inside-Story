// Checks lib/reportCharts.ts, the charts drawn in a report PDF (K3,
// 2026-09-26):
// 1. One slot per day of the range, and a day with nothing recorded draws
//    nothing, so a gap is never a zero.
// 2. No line joins two points.
// 3. Bars start at zero; dots are scaled to the readings.
// 4. The caption says how many days were recorded, and no sentence judges
//    a figure.
//
// Pure, so it runs here rather than needing a phone. Exits non-zero on any
// failure.

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
    throw new Error('lib/reportCharts.ts must stay free of imports');
  });
  return module.exports;
}

const C = load('lib/reportCharts.ts');

let failures = 0;
let checks = 0;
function check(label, ok) {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const steps = {
  style: 'bars',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  points: [
    { date: '2026-09-02', value: 4200 },
    { date: '2026-09-03', value: 8100 },
    { date: '2026-09-20', value: 0 },
    { date: '2026-08-31', value: 9000 },
    { date: '2026-10-01', value: 9000 },
  ],
  unit: 'steps',
  decimals: 0,
  slotNoun: 'day',
};

// 1. Slots and gaps.
check('thirty days in September', C.chartDayCount(steps) === 30);
check('a range across a month end counts both ends', C.chartDayCount({ startDate: '2026-08-30', endDate: '2026-09-02' }) === 4);
const inRange = C.chartPointsInRange(steps);
check('points outside the range are left out', inRange.length === 3);
check('a recorded zero is still a record', inRange.some((point) => point.value === 0));
const svg = C.renderChartSvg(steps);
check('one bar per recorded day, none for the gaps', (svg.match(/<rect /g) || []).length === 3);
check('the last given value for a date wins', C.chartPointsInRange({ ...steps, points: [{ date: '2026-09-05', value: 1 }, { date: '2026-09-05', value: 2 }] })[0].value === 2);
check('nothing recorded draws nothing', C.renderChartSvg({ ...steps, points: [] }) === '');
check('a date-time is read as its day', C.chartPointsInRange({ ...steps, points: [{ date: '2026-09-05T08:30', value: 3 }] }).length === 1);

// 2. No lines between points.
check('no path or polyline in a bar chart', !/<path|<polyline/.test(svg));
const weight = {
  style: 'dots',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  points: [
    { date: '2026-09-01', value: 71.2 },
    { date: '2026-09-15', value: 70.4 },
    { date: '2026-09-29', value: 70.9 },
  ],
  unit: 'kg',
  decimals: 1,
  slotNoun: 'day',
};
const dots = C.renderChartSvg(weight);
check('one dot per reading', (dots.match(/<circle /g) || []).length === 3);
check('no path or polyline in a dot chart', !/<path|<polyline/.test(dots));

// 3. Scales.
const barScale = C.chartScale(steps, inRange);
check('bars start at zero', barScale.low === 0);
check('bars top out at a round number', barScale.high === 10000);
const dotScale = C.chartScale(weight, C.chartPointsInRange(weight));
check('dots are scaled to the readings, not to zero', dotScale.low > 60 && dotScale.high < 80);
check('a single repeated reading still has room', C.chartScale(weight, [{ date: '2026-09-01', value: 70 }]).high > 70);
check('nice ceilings', C.niceCeiling(3.2) === 5 && C.niceCeiling(8100) === 10000 && C.niceCeiling(0) === 1 && C.niceCeiling(2) === 2);
check('the unit is labelled', svg.includes('>steps<'));
check('the first and last dates are labelled', svg.includes('Sep 1') && svg.includes('Sep 30'));

// 4. Captions.
const caption = C.chartCaption(steps);
check('the caption counts recorded days against the range', caption.startsWith('3 days recorded across 30 days'));
check('the caption says a blank is not a zero', caption.includes('not a zero'));
const full = C.chartCaption({ ...steps, startDate: '2026-09-02', endDate: '2026-09-03' });
check('a range with no gaps does not mention blanks', !full.includes('blank'));
const empty = C.chartCaption({ ...steps, points: [] });
check('an empty chart says nothing was recorded', empty.startsWith('Nothing recorded'));
const nights = C.chartCaption({ ...steps, unit: 'hours', decimals: 1, slotNoun: 'night', points: [{ date: '2026-09-04', value: 7 }] });
check('one night reads in the singular', nights.startsWith('1 night recorded') && nights.includes('7.0 hours'));

const written = [caption, full, empty, nights, C.chartCaption(weight)];
const FORBIDDEN = /too low|too high|\bideal\b|\boptimal\b|healthy range|well done|good job|keep it up|great|\breal\b|\bgenuine|\bown\b|[—–]| -- /i;
for (const line of written) check(`no verdict, praise or dashes in: ${line}`, !FORBIDDEN.test(line));

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
