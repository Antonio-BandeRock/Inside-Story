// Checks lib/patternFactors.ts, Pattern Finder for any factor (F1,
// 2026-09-26): check-in tags, sleep, doses skipped, steps, water and each
// tracker turned into moments and counted the way food is.
//
// 1. A window leaves out its end, so an outcome's own check-in never counts
//    as coming before itself.
// 2. Each group's denominator is only the outcomes with that group recorded
//    before them.
// 3. A number becomes a key only outside the person's usual range, and says
//    it cannot yet when there are too few days.
// 4. A day total is counted only at the 24 and 48 hour windows.
// 5. No sentence claims a cause, a verdict on a number, or praise.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const loaded = {};
function load(relPath, siblings = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (siblings[name]) return siblings[name];
    throw new Error(`${relPath} may only import its pure siblings (asked for ${name})`);
  });
  loaded[relPath] = module.exports;
  return module.exports;
}

const basis = load('lib/patternBasis.ts');
const usual = load('lib/yourUsual.ts');
const F = load('lib/patternFactors.ts', { './patternBasis': basis, './yourUsual': usual });

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}
const written = [];
const words = { one: 'flare', many: 'flares' };

// 1 and 2. Tags before four outcomes, one of which has nothing before it.
const outcomeAt = ['2026-09-05T12:00', '2026-09-10T12:00', '2026-09-15T12:00', '2026-09-20T12:00'];
const outcomeEnds = outcomeAt.map((at) => new Date(at));
const checkins = [
  { at: '2026-09-05T09:00', tags: ['stressful'] },
  { at: '2026-09-10T10:00', tags: ['stressful'] },
  { at: '2026-09-15T11:00', tags: ['stressful', 'noisy'] },
  { at: '2026-09-05T12:00', tags: ['self'] },
  { at: '2026-09-10T12:00', tags: ['self'] },
  { at: '2026-09-11T12:00', tags: [] },
];
for (let day = 1; day <= 20; day++) checkins.push({ at: `2026-09-${String(day).padStart(2, '0')}T20:00`, tags: ['calm'] });
const tagMoments = F.tagMoments(checkins);
check(tagMoments.length === checkins.length - 1, 'a check-in with no tags is not a record of any');
check(F.factorKeysInWindow(tagMoments, new Date('2026-09-05T12:00'), 6).has('tag:stressful'), 'a tag three hours before is in the window');
check(!F.factorKeysInWindow(tagMoments, new Date('2026-09-05T12:00'), 6).has('tag:self'), 'the end of a window is left out');
check(F.factorKeysInWindow(tagMoments, new Date('2026-09-20T12:00'), 6) === null, 'a window with nothing recorded is null');

const now = new Date('2026-09-21T09:00');
const usualEnds = basis.usualWindowEnds('2026-09-01', '2026-09-21', now);
const tagGroups = [{ group: 'tags', family: 'tags', noun: 'a check-in tag', dayTotal: false, usualShort: null }];
const tagCounted = F.findFactorCandidates({
  moments: tagMoments,
  groups: tagGroups,
  outcomeEnds,
  usualEnds,
  windowHours: 6,
  label: (key) => key.slice(4),
}).get('tags');
check(tagCounted.recordedBefore === 3, 'denominator is the outcomes with a tag recorded before them');
const stressful = tagCounted.candidates.find((candidate) => candidate.key === 'tag:stressful');
check(stressful && stressful.occurrenceCount === 3 && stressful.comparison.flaresWithMeals === 3, 'a tag before three of three counts three');
check(stressful && stressful.comparison.verdict === 'more', 'a tag rare in ordinary stretches reads as more than usual');
check(stressful && stressful.noun === 'a check-in tag', 'a candidate carries its noun');
check(!tagCounted.candidates.some((candidate) => candidate.key === 'tag:self'), "an outcome's own tag never counts");
check(!tagCounted.candidates.some((candidate) => candidate.key === 'tag:noisy'), 'once is below the minimum');
check(!tagCounted.candidates.some((candidate) => candidate.key === 'tag:calm'), 'an evening tag is outside a six hour window at noon');

// 3. Usual range keys.
const nights = [];
for (let day = 1; day <= 8; day++) nights.push({ date: `2026-09-0${day}`, value: 7 });
nights.push({ date: '2026-09-09', value: 3 });
nights.push({ date: '2026-09-10', value: 11 });
const sleep = F.usualRangeMoments(nights, 'sleep', 'sleep', F.sleepAt);
check(sleep.usualShort === null, 'ten nights are enough for a usual range');
check(sleep.moments.length === 10, 'every night is a record, inside the range or not');
check(sleep.moments.find((m) => m.at === '2026-09-09T06:00').keys[0] === 'sleep:below', 'a short night is below');
check(sleep.moments.find((m) => m.at === '2026-09-10T06:00').keys[0] === 'sleep:above', 'a long night is above');
check(sleep.moments.find((m) => m.at === '2026-09-01T06:00').keys.length === 0, 'an ordinary night carries no key');
const few = F.usualRangeMoments(nights.slice(0, 5), 'sleep', 'sleep', F.sleepAt);
check(few.usualShort === 5 && few.moments.every((m) => m.keys.length === 0), 'too few nights set nothing apart and say how many');
const fewLines = F.familyLines(
  { group: 'sleep', family: 'sleep', noun: 'sleep', dayTotal: false, usualShort: 5 },
  { candidates: [], recordedBefore: 1, skipped: false },
  4,
  24,
  words,
);
check(fewLines.some((line) => line.includes('needs 8 days')), 'a short usual range is said');
written.push(...fewLines);

// Doses: only a mark is a record, only a skip is a key.
const doses = F.doseMoments([
  { scheduledFor: '2026-09-05T08:00', title: 'Levothyroxine', status: 'logged' },
  { scheduledFor: '2026-09-10T08:00', title: 'Levothyroxine', status: 'skipped' },
  { scheduledFor: '2026-09-11T08:00', title: 'Levothyroxine', status: 'pending' },
]);
check(doses.length === 2, 'an unmarked dose is left out');
check(doses[0].keys.length === 0 && doses[1].keys[0] === 'dose:Levothyroxine', 'a taken dose is a record with no key, a skip is a key');

// Trackers: each day placed at its last entry.
const trackers = F.trackerMoments([
  { trackerId: 't1', date: '2026-09-05', value: 3, lastAt: '2026-09-05T21:30' },
  { trackerId: 't2', date: '2026-09-05', value: 1, lastAt: '2026-09-05T08:00' },
]);
check(trackers.moments.find((m) => m.group === 'tr:t1').at === '2026-09-05T21:30', 'a tracker day sits at its last entry');
check(trackers.usualShort.get('t1') === 1, 'one tracker day is too few for a usual range');

// 4. Day totals only at 24 and 48 hours.
const stepGroup = { group: 'steps', family: 'steps', noun: 'a day of steps', dayTotal: true, usualShort: null };
const stepMoments = [{ at: '2026-09-04T23:59', group: 'steps', keys: ['steps:below'] }];
const at6 = F.findFactorCandidates({ moments: stepMoments, groups: [stepGroup], outcomeEnds, usualEnds, windowHours: 6, label: String });
check(at6.get('steps').skipped, 'a day total is not counted in a six hour window');
const at24 = F.findFactorCandidates({ moments: stepMoments, groups: [stepGroup], outcomeEnds, usualEnds, windowHours: 24, label: String });
check(!at24.get('steps').skipped && at24.get('steps').recordedBefore === 1, 'a day total is counted in a 24 hour window');
const skippedLines = F.familyLines(stepGroup, at6.get('steps'), 4, 6, words);
check(skippedLines[0].includes('24 and 48'), 'the skip says when it is counted');
written.push(...skippedLines);

// 5. Sentences, and the families assembled.
const families = F.assembleFactorFamilies(
  [...tagGroups, stepGroup, { group: 'doses', family: 'doses', noun: 'a dose marked taken or skipped', dayTotal: false, usualShort: null }],
  new Map([
    ['tags', tagCounted],
    ['steps', at6.get('steps')],
    ['doses', { candidates: [], recordedBefore: 0, skipped: false }],
  ]),
  4,
  6,
  words,
);
check(families.map((family) => family.family).join() === 'tags,doses,steps', 'families come in a fixed order');
check(families[1].lines[0].startsWith('Nothing of this kind was recorded'), 'a family with nothing before any outcome says so');
for (const family of families) written.push(family.title, ...family.lines, ...family.candidates.map((c) => c.label));

const more = F.factorComparisonSentence(stressful.comparison, 6, 'a check-in tag');
check(more.includes('3 of the 3 with a check-in tag recorded'), 'the caption names its denominator');
check(more.includes('not proof'), 'more than usual is still not proof');
const same = F.factorComparisonSentence({ ...stressful.comparison, verdict: 'same', usualShare: 0.9 }, 6, 'sleep');
check(same.includes('says little'), 'about as often reads as saying little');
const none = F.factorComparisonSentence({ ...stressful.comparison, verdict: 'unknown', usualShare: null }, 6, 'sleep');
check(none.includes('no other stretches'), 'no ordinary stretches is said');
written.push(more, same, none, F.FACTOR_CAVEAT, F.NOT_RECORDED_LINE, F.FACTOR_BAND_EMPTY_LINE);

const FORBIDDEN = [
  /\bcaus(?:e|es|ed|ing)\b/i,
  /\btrigger/i,
  /too low/i,
  /too high/i,
  /\bideal\b/i,
  /\boptimal\b/i,
  /healthy range/i,
  /well done|good job|keep it up|great work/i,
  /\breal\b|\bgenuine/i,
  /\bown\b/i,
  /[–—]| -- /,
];
for (const line of written) {
  for (const pattern of FORBIDDEN) check(!pattern.test(line), `forbidden ${pattern} in: ${line}`);
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
