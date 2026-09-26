// Checks a photo series (lib/photoSeries.ts): one frame a day, the days
// with no photo said as gaps rather than filled, today not counted as a gap
// while it is still today, the flipbook speeds, the GIF frame size and how a
// long series is thinned, and every sentence swept for praise, blame and
// verdict words, since a series is the easiest place to start scoring
// somebody for keeping it up.
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
    throw new Error(`${relPath} must stay free of runtime imports`);
  });
  return module.exports;
}

const s = load('lib/photoSeries.ts');

let failures = 0;
function check(label, ok) {
  if (ok) return;
  failures += 1;
  console.error('FAIL', label);
}

const running = { startedOn: '2026-09-20', endedOn: null };
const ended = { startedOn: '2026-09-20', endedOn: '2026-09-24' };
const photos = [
  { id: 'a', takenOn: '2026-09-20', createdAt: '2026-09-20T08:00:00Z' },
  { id: 'a2', takenOn: '2026-09-20', createdAt: '2026-09-20T09:00:00Z' },
  { id: 'b', takenOn: '2026-09-22', createdAt: '2026-09-22T08:00:00Z' },
  { id: 'c', takenOn: '2026-09-19', createdAt: '2026-09-19T08:00:00Z' },
  { id: 'd', takenOn: '2026-09-25', createdAt: '2026-09-25T08:00:00Z' },
];

const frames = s.seriesFrames(running, photos, '2026-09-26');
check('one frame a day, the first taken that day', frames.map((f) => f.id).join() === 'a,b,d');
check('an ended series stops at its last day', s.seriesFrames(ended, photos, '2026-09-26').map((f) => f.id).join() === 'a,b');

const days = frames.map((f) => f.takenOn);
check('gaps are the missing days, today excluded while running',
  s.seriesGaps(running, days, '2026-09-26').join() === '2026-09-21,2026-09-23,2026-09-24');
check('an ended series counts its last day',
  s.seriesGaps(ended, ['2026-09-20', '2026-09-22'], '2026-09-26').join() === '2026-09-21,2026-09-23,2026-09-24');
check('days covered counts both ends', s.daysCovered('2026-09-20', '2026-09-26') === 7);
check('days covered across a month', s.daysCovered('2026-09-29', '2026-10-02') === 4);

const summary = s.seriesSummary(running, days, '2026-09-26');
check('summary counts photos and days', summary.startsWith('3 photos across 7 days.'));
check('summary says gaps in words, never as zero', summary.includes('3 days have no photo'));
check('summary notes today is not in yet', summary.includes('No photo yet today.'));
check('empty running series explains the first photo', s.seriesSummary(running, [], '2026-09-26').startsWith('No photos in this series yet.'));
check('photo today is seen', s.hasPhotoToday(['2026-09-26'], '2026-09-26'));

check('reminder time shape', s.isReminderTime('08:00') && !s.isReminderTime('8:00') && !s.isReminderTime('24:00'));
check('frame delay', s.frameDelayMs(4) === 250 && s.frameDelayMs(0) === 1000);

const size = s.gifFrameSize(4000, 3000);
check('GIF frame fits 480 on the long side', size.width === 480 && size.height === 360);
check('GIF frame sides are even', s.gifFrameSize(1001, 333).height % 2 === 0);
check('a small photo is not enlarged', s.gifFrameSize(200, 100).width === 200);
check('a missing size falls back', s.gifFrameSize(0, 0).width === s.GIF_MAX_DIMENSION);

const many = Array.from({ length: 300 }, (_, i) => i);
const picked = s.pickGifFrames(many, 120);
check('a long series is thinned to the limit', picked.length === 120);
check('first and last kept', picked[0] === 0 && picked[picked.length - 1] === 299);
check('a short series keeps every frame', s.pickGifFrames([1, 2, 3], 120).length === 3);

const FORBIDDEN = [
  'real', 'genuine', ' own ', '—', '–', ' -- ',
  'well done', 'good job', 'keep it up', 'great job', 'streak', 'missed', 'failed', 'you should',
];
const sentences = [
  summary, s.seriesSummary(running, [], '2026-09-26'), s.seriesSummary(ended, [], '2026-09-26'),
  s.seriesSummary(ended, ['2026-09-20'], '2026-09-26'),
  s.gifMadeSentence(10, 10), s.gifMadeSentence(120, 300),
  s.seriesReminderTitle('Tomato by the fence'), s.seriesReminderBody(0), s.seriesReminderBody(6),
  s.seriesReminderLine({ reminderOn: true, reminderTime: '08:00', endedOn: null }, '8:00 AM'),
  s.seriesReminderLine({ reminderOn: false, reminderTime: '08:00', endedOn: null }, '8:00 AM'),
  s.seriesReminderLine({ reminderOn: true, reminderTime: '08:00', endedOn: '2026-09-24' }, '8:00 AM'),
  s.SERIES_START_LINE,
  ...s.FLIPBOOK_SPEEDS.map((speed) => speed.label),
];
for (const sentence of sentences) {
  const lower = ` ${String(sentence).toLowerCase()} `;
  for (const word of FORBIDDEN) check(`"${sentence}" avoids "${word}"`, !lower.includes(word));
}

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('photo series: all checks passed');
