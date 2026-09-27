// Runs lib/progress.ts and lib/progressScene.ts: Your Progress and the tab
// pictures (C17 of the competitive build plan, docs/progress-design.md).
//
// Built 2026-09-27.
//
// The rules checked:
//
//  1. A plain date is a local day as it stands; a SQLite UTC stamp and an
//     ISO stamp are read through Date for the local day.
//  2. Variety counts each different name once, whatever its case or spacing,
//     at the first day it turned up, and a long list leads with a count.
//  3. A week counts once however much is in it, and nothing says "in a row".
//  4. Kept alive lists only what is growing in an area still in use, and a
//     finished ferment or pile says so rather than counting on.
//  5. Every ready line takes its number from the constant the analysis
//     itself reads, so the two can never disagree.
//  6. Since you last looked lists nothing on a first look, only new keys
//     after that, and says how many more past the limit.
//  7. A scene is the same every time for the same records, draws nothing
//     for an empty record, draws nothing on Home or Reports, and never
//     passes its piece limit.
//  8. Nothing here scores anybody: no sentence praises, blames, counts a
//     run of days, or talks about levels, points or rewards.
//
// Run with: node scripts/test_progress.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function transpile(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  return outputText;
}

function run(relPath, resolve) {
  const module = { exports: {} };
  new Function('exports', 'module', 'require', transpile(relPath))(module.exports, module, (name) => {
    const found = resolve[name];
    if (!found) throw new Error(`unexpected import ${name} in ${relPath}`);
    return found;
  });
  return module.exports;
}

const V = run('lib/eatingVariety.ts', {});
const cycle = run('lib/cycle.ts', {});
const categories = run('lib/financeCategories.ts', {});
const accounts = run('lib/financeAccounts.ts', { './financeCategories': categories });
const income = run('lib/financeIncome.ts', {});
const patternBasis = run('lib/patternBasis.ts', {});
const periodAverages = run('lib/periodAverages.ts', {});
const yourUsual = run('lib/yourUsual.ts', {});
const P = run('lib/progress.ts', {
  './cycle': cycle,
  './eatingVariety': V,
  './financeAccounts': accounts,
  './financeIncome': income,
  './patternBasis': patternBasis,
  './periodAverages': periodAverages,
  './yourUsual': yourUsual,
});
const S = run('lib/progressScene.ts', { './eatingVariety': V, './progress': P });

let failures = 0;
let passes = 0;
function check(label, condition, detail) {
  if (condition) {
    passes += 1;
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const sentences = [];
function said(text) {
  if (typeof text === 'string') sentences.push(text);
  return text;
}

// 1. Local days.
check('plain date kept', P.localDay('2026-03-04') === '2026-03-04');
check('empty is null', P.localDay('') === null && P.localDay(null) === null);
{
  const stamp = '2026-03-04 12:00:00';
  const expected = new Date('2026-03-04T12:00:00Z');
  const want = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
  check('sqlite stamp read as UTC', P.localDay(stamp) === want, P.localDay(stamp));
  check('plain date has no hour', P.localHour('2026-03-04') === null);
}
check('week of a Wednesday is its Monday', P.weekOf('2026-09-23') === '2026-09-21');
check('week of a Sunday is the Monday before', P.weekOf('2026-09-27') === '2026-09-21');
check('week of a Monday is itself', P.weekOf('2026-09-21') === '2026-09-21');
check('spoken day carries the year', P.spokenDay('2026-03-04') === 'Mar 4, 2026');

// 2. Variety.
{
  const v = P.variety(
    'Whole foods eaten',
    [
      { name: 'Kale', day: '2026-02-01' },
      { name: 'kale ', day: '2026-01-15' },
      { name: 'Apple', day: '2026-03-01' },
    ],
    'None yet.',
  );
  check('variety counts a name once', v.count === 2, v);
  check('variety is alphabetical, trimmed, in its first spelling', v.sentence === 'Apple, kale', v.sentence);
  check('variety keeps the first day', v.names.find((n) => P.sameName(n.name) === 'kale').day === '2026-01-15');
  said(v.sentence);
  const empty = P.variety('X', [], 'Nothing yet.');
  check('empty variety says its line', empty.count === 0 && empty.sentence === 'Nothing yet.');
  const many = [];
  for (let i = 0; i < P.VARIETY_LIST_LIMIT + 5; i += 1) many.push({ name: `Food ${String(i).padStart(2, '0')}`, day: V.addDays('2026-01-01', i) });
  const long = P.variety('X', many, '');
  check('long variety leads with a count', long.sentence.startsWith(`${P.VARIETY_LIST_LIMIT + 5} different.`), long.sentence);
  check('long variety names the most recent first', long.sentence.includes(`Food ${P.VARIETY_LIST_LIMIT + 4}`), long.sentence);
  said(long.sentence);
}

// 3. Weeks.
{
  const w = P.weeksKept('Meals logged', ['2026-09-21', '2026-09-22', '2026-09-27', '2026-09-28', '2026-08-03'], 'None.');
  check('a week counts once', w.weeks === 3, w);
  check('first week is the earliest Monday', w.firstWeek === '2026-08-03', w);
  check('week sentence', w.sentence === 'Meals logged in 3 different weeks, the first in the week of Aug 3, 2026.', w.sentence);
  said(w.sentence);
  const one = P.weeksKept('Meals logged', ['2026-09-22'], 'None.');
  check('one week is singular', one.sentence.includes('in 1 week,'), one.sentence);
  check('no weeks says its line', P.weeksKept('X', [], 'None.').sentence === 'None.');
}

// 4. Kept alive.
{
  const today = '2026-09-27';
  const plantings = [
    { name: 'Tomato', area: 'Back bed', planted: '2026-06-01', status: 'growing', areaRetired: false },
    { name: 'Bean', area: 'Old bed', planted: '2026-05-01', status: 'growing', areaRetired: true },
    { name: 'Pea', area: 'Back bed', planted: '2026-03-01', status: 'finished', areaRetired: false },
  ];
  const lines = P.plantingLines(plantings, today);
  check('only growing plantings in a live area', lines.length === 1 && lines[0].startsWith('Tomato in Back bed: tended for 3 months'), lines);
  const ferments = P.fermentLines(
    [
      { name: 'Sauerkraut', started: '2026-09-20', stage: 'fermenting', changed: null },
      { name: 'Kefir', started: '2026-08-01', stage: 'finished', changed: '2026-08-10' },
    ],
    today,
  );
  check('finished ferment says finished', ferments[0] === 'Kefir: started Aug 1, 2026, finished Aug 10, 2026.', ferments);
  check('going ferment counts days', ferments[1] === 'Sauerkraut: going for 7 days, since Sep 20, 2026.', ferments);
  const piles = P.pileLines([{ name: 'Bay one', started: '2026-09-27', status: 'active', additions: 1 }], today);
  check('a pile started today', piles[0] === 'Bay one: going since today, with 1 addition recorded.', piles);
  [...lines, ...ferments, ...piles].forEach(said);
}

// 5. Ready lines use the analysis constants.
{
  const need = yourUsual.MIN_USUAL_READINGS;
  const notYet = P.usualRangeLine('Weight', need - 1);
  check('usual range not yet', notYet.ready === false && notYet.text.includes(String(need)), notYet);
  check('usual range ready at the constant', P.usualRangeLine('Weight', need).ready === true);
  const wk = periodAverages.WEEKDAY_MIN_READINGS;
  check('weekday ready at the constant', P.weekdayLine('Steps', wk).ready === true && P.weekdayLine('Steps', wk - 1).ready === false);
  const cyc = cycle.MIN_CYCLES_FOR_AVERAGE;
  check('cycle ready at the constant', P.cycleLine(cyc).ready === true && P.cycleLine(cyc - 1).ready === false);
  check('no cycle says none', P.cycleLine(0).text.includes('None is complete'), P.cycleLine(0).text);
  check('one cycle says 1 is', P.cycleLine(1).text.includes('1 is complete'), P.cycleLine(1).text);
  const days = accounts.MIN_DAYS_FOR_MEASURED_CHANGE;
  check(
    'account ready at the constant',
    P.accountLine({ name: 'Savings', first: '2026-01-01', last: V.addDays('2026-01-01', days) }).ready === true &&
      P.accountLine({ name: 'Savings', first: '2026-01-01', last: V.addDays('2026-01-01', days - 1) }).ready === false,
  );
  check('income with no streams is left out', P.incomeLine([]) === null);
  const months = income.MIN_MONTHS_FOR_ESTIMATE_CHECK;
  check('income ready at the constant', P.incomeLine([1, months]).ready === true && P.incomeLine([months - 1]).ready === false);
  check('pattern line names the constant', P.PATTERN_FINDER_READY_LINE.includes(`at least ${patternBasis.MIN_PATTERN_OCCURRENCES} flares`));
  const seasons = P.seasonLines([{ area: 'Back bed', years: 1 }, { area: 'Allotment', years: 2 }]);
  check('seasons sorted and judged', seasons[0].ready === true && seasons[1].ready === false, seasons);
  const reports = P.reportLines(
    [
      { label: 'For your doctor', core: ['symptoms', 'meds', 'conditions'] },
      { label: 'Only conditions', core: ['conditions'] },
    ],
    { symptoms: true, meds: false },
  );
  check('report line names what is empty', reports.length === 1 && reports[0].text === 'For your doctor: nothing recorded yet for medicines.', reports);
  [notYet, P.usualRangeLine('Weight', need), P.cycleLine(0), P.cycleLine(1), P.incomeLine([1]), ...seasons, ...reports].forEach((line) =>
    said(line.text),
  );
  said(P.PATTERN_FINDER_READY_LINE);
}

// A full set of inputs, used for the bands, the pieces and the scenes.
function inputs(overrides) {
  const base = {
    today: '2026-09-27',
    firsts: [
      { key: 'first_meal', label: 'The first meal logged', tab: '/food', day: '2026-08-03' },
      { key: 'first_planting', label: 'The first planting', tab: '/garden', day: '2026-06-01' },
    ],
    food: {
      wholeFoods: [
        { name: 'Kale', day: '2026-08-03', group: 'Vegetables' },
        { name: 'Apple', day: '2026-08-04', group: 'Fruit' },
        { name: 'Oats', day: '2026-08-05', group: null },
      ],
      dishes: [{ name: 'Lentil soup', day: '2026-08-05' }],
      strains: [{ name: 'L. plantarum', day: '2026-09-20' }],
      mealDays: ['2026-08-03', '2026-08-04', '2026-09-22'],
      ferments: [{ name: 'Sauerkraut', started: '2026-09-20', stage: 'fermenting', changed: null }],
    },
    garden: {
      plantings: [{ name: 'Tomato', area: 'Back bed', planted: '2026-06-01', status: 'growing', areaRetired: false }],
      harvests: [{ name: 'Tomato', day: '2026-08-20', area: 'Back bed' }],
      piles: [{ name: 'Bay one', started: '2026-05-01', status: 'active', additions: 4 }],
      recordDays: ['2026-06-01', '2026-08-20'],
      harvestYearsByArea: [{ area: 'Back bed', years: 1 }],
    },
    life: {
      routines: [{ name: 'Morning', day: '2026-09-01' }],
      upkeep: [{ name: 'Change the furnace filter', day: '2026-09-02' }],
      movement: [{ name: 'Walking', day: '2026-09-03' }],
      routineDays: ['2026-09-01'],
      markDays: ['2026-09-01', '2026-09-08'],
      upkeepDays: ['2026-09-02'],
      workDays: [],
      accounts: [{ name: 'Savings', first: '2026-09-01', last: '2026-09-20' }],
      incomeStreamMonths: [],
    },
    signals: {
      checkinDays: ['2026-09-01', '2026-09-02', '2026-09-15'],
      trackers: [{ name: 'Headache', day: '2026-09-01' }],
      trackerEntryDays: ['2026-09-01'],
      trackerReadings: [{ name: 'Headache', count: 3 }],
      trials: [{ name: 'Buckwheat', day: '2026-09-10' }],
      cycleCount: 1,
      hasCycleDays: true,
    },
    schedules: {
      doseDays: ['2026-09-01'],
      mealDays: ['2026-09-01'],
      marks: [
        { day: '2026-09-01', hour: 7.5, kind: 'dose' },
        { day: '2026-09-01', hour: 8.25, kind: 'meal' },
      ],
      plannedThenEaten: [{ name: 'Lentil soup', day: '2026-09-01' }],
    },
    insights: { mealDays: 3, medsAndMealsSameDay: true },
    trends: { recordDays: ['2026-06-01', '2026-09-01'], weightReadings: 2, stepDays: 0 },
    reports: { kinds: [{ label: 'For your doctor', core: ['symptoms', 'meds'] }], filled: { symptoms: true, meds: true } },
    home: { captureDays: ['2026-09-10'] },
  };
  return { ...base, ...(overrides ?? {}) };
}

function emptyInputs() {
  return {
    today: '2026-09-27',
    firsts: [],
    food: { wholeFoods: [], dishes: [], strains: [], mealDays: [], ferments: [] },
    garden: { plantings: [], harvests: [], piles: [], recordDays: [], harvestYearsByArea: [] },
    life: { routines: [], upkeep: [], movement: [], routineDays: [], markDays: [], upkeepDays: [], workDays: [], accounts: [], incomeStreamMonths: [] },
    signals: { checkinDays: [], trackers: [], trackerEntryDays: [], trackerReadings: [], trials: [], cycleCount: 0, hasCycleDays: false },
    schedules: { doseDays: [], mealDays: [], marks: [], plannedThenEaten: [] },
    insights: { mealDays: 0, medsAndMealsSameDay: false },
    trends: { recordDays: [], weightReadings: 0, stepDays: 0 },
    reports: { kinds: [], filled: {} },
    home: { captureDays: [] },
  };
}

function sayBands(bands) {
  for (const band of bands) {
    band.firsts.forEach((f) => said(f.label));
    band.varieties.forEach((v) => said(v.sentence));
    band.weeks.forEach((w) => said(w.sentence));
    band.keptAlive.forEach(said);
    band.ready.forEach((r) => said(r.text));
    said(band.note);
  }
}

// Bands.
{
  const full = inputs();
  const bands = P.buildProgressBands(full);
  check('nine bands in tab order', bands.map((b) => b.tab).join(' ') === '/ /food /schedule /log /insights /trends /reports /garden /life');
  const signals = bands.find((b) => b.tab === '/log');
  check('signals ready starts with pattern finder', signals.ready[0].ready === null && signals.ready[0].text === P.PATTERN_FINDER_READY_LINE);
  check('signals carries the cycle line when cycle days exist', signals.ready.some((r) => r.text.startsWith('The average cycle')));
  const withoutCycle = P.buildProgressBands(inputs({ signals: { ...full.signals, hasCycleDays: false } })).find((b) => b.tab === '/log');
  check('no cycle line without cycle days', !withoutCycle.ready.some((r) => r.text.startsWith('The average cycle')));
  const trends = bands.find((b) => b.tab === '/trends');
  check('trends note names the first day', trends.note === 'The records now reach back to Jun 1, 2026, and every lens here reads from then to today.', trends.note);
  check('food firsts belong to food', bands.find((b) => b.tab === '/food').firsts.length === 1);
  sayBands(bands);
  const empty = P.buildProgressBands(emptyInputs());
  check('empty bands still nine', empty.length === 9);
  check('empty trends says it fills in', empty.find((b) => b.tab === '/trends').note.startsWith('Trends reads what'));
  sayBands(empty);
}

// 6. Since you last looked.
{
  const pieces = P.progressPieces(inputs());
  check('pieces carry each food by name', pieces.has('food:kale') && pieces.get('food:kale') === 'Kale joined the pantry');
  check('pieces carry the firsts', pieces.has('first:first_meal') && pieces.get('first:first_meal') === 'First: the first meal logged');
  const first = P.sinceLastLooked(null, pieces);
  check('first look lists nothing', first.firstLook && first.lines.length === 0);
  said(P.sinceLastLookedSentence(first));
  const keys = [...pieces.keys()].filter((key) => key !== 'food:kale');
  const next = P.sinceLastLooked(keys, pieces);
  check('only the new piece is listed', next.lines.length === 1 && next.lines[0] === 'Kale joined the pantry', next);
  check('no sentence when all lines fit', P.sinceLastLookedSentence(next) === null);
  const none = P.sinceLastLooked([...pieces.keys()], pieces);
  check('nothing new says so', P.sinceLastLookedSentence(none) === 'Nothing added since this page was last opened.');
  said(P.sinceLastLookedSentence(none));
  const lots = new Map();
  for (let i = 0; i < P.SINCE_LAST_LOOKED_LIMIT + 3; i += 1) lots.set(`k${i}`, `Thing ${i}`);
  const over = P.sinceLastLooked([], lots);
  check('limit holds', over.lines.length === P.SINCE_LAST_LOOKED_LIMIT && over.more === 3);
  check('more is counted', P.sinceLastLookedSentence(over) === 'And 3 other things.');
  [...pieces.values(), ...over.lines].forEach(said);
  said(P.sinceLastLookedSentence(over));
}

// 7. Scenes.
{
  const full = inputs();
  const bands = P.buildProgressBands(full);
  const tint = '#4a90e2';
  for (const tab of S.PICTURE_TABS) {
    const a = S.buildProgressScene(tab, full, bands, tint);
    const b = S.buildProgressScene(tab, full, bands, tint);
    check(`${tab} scene is drawn`, a && a.shapes.length > 0, a && a.shapes.length);
    check(`${tab} scene is the same every time`, JSON.stringify(a) === JSON.stringify(b));
    check(`${tab} scene stays under the limit`, a.shapes.length <= S.SCENE_PIECE_LIMIT * 2 + 40, a.shapes.length);
    const inBounds = a.shapes.every((shape) => {
      if (shape.type === 'circle') return shape.cx >= -5 && shape.cx <= S.SCENE_WIDTH + 5 && shape.cy >= -5 && shape.cy <= S.SCENE_HEIGHT + 5;
      if (shape.type === 'rect') return shape.x >= -5 && shape.x + shape.w <= S.SCENE_WIDTH + 5 && shape.y >= -5 && shape.y + shape.h <= S.SCENE_HEIGHT + 5;
      return typeof shape.d === 'string' && !shape.d.includes('NaN');
    });
    check(`${tab} scene stays inside its box`, inBounds);
    check(`${tab} scene has no NaN`, !JSON.stringify(a).includes('NaN') && !JSON.stringify(a).includes('null,"opacity"'));
  }
  check('home draws no picture', S.buildProgressScene('/', full, bands, tint) === null);
  check('reports draws no picture', S.buildProgressScene('/reports', full, bands, tint) === null);
  const empty = emptyInputs();
  const emptyBands = P.buildProgressBands(empty);
  for (const tab of ['/food', '/garden', '/log', '/schedule', '/life', '/insights', '/trends']) {
    const scene = S.buildProgressScene(tab, empty, emptyBands, tint);
    check(`${tab} empty record draws nothing`, scene === null || scene.shapes.length === 0, scene && scene.shapes.length);
  }
  // A great many records still stay under the limit.
  const big = inputs();
  big.food = { ...big.food, wholeFoods: [] };
  for (let i = 0; i < 900; i += 1) big.food.wholeFoods.push({ name: `Food ${i}`, day: V.addDays('2024-01-01', i), group: `Group ${i % 12}` });
  big.signals = { ...big.signals, checkinDays: [] };
  for (let i = 0; i < 900; i += 1) big.signals.checkinDays.push(V.addDays('2024-01-01', i));
  const bigBands = P.buildProgressBands(big);
  const pantry = S.buildProgressScene('/food', big, bigBands, tint);
  const sky = S.buildProgressScene('/log', big, bigBands, tint);
  check('a full pantry stays under the limit', pantry.shapes.length <= S.SCENE_PIECE_LIMIT * 2 + 40, pantry.shapes.length);
  check('a full sky stays bounded', sky.shapes.length <= 365 + 40, sky.shapes.length);
  check('hashUnit is between 0 and 1', [0, 1, 2].every((n) => {
    const u = S.hashUnit(`x${n}`);
    return u >= 0 && u < 1;
  }));
}

// 8. Nothing scores anybody.
// The lenses' own "not yet" lines, from the same constants their analyses read.
{
  const W = periodAverages.WEEKDAY_MIN_READINGS;
  const days = (n) => Array.from({ length: n }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), value: 1 }));
  check('weekday waiting: nothing with no readings', periodAverages.weekdaysWaitingLine([]) === null);
  check('weekday waiting: nothing once shown', periodAverages.weekdaysWaitingLine(days(W)) === null);
  const one = periodAverages.weekdaysWaitingLine(days(1));
  check('weekday waiting: one reading', one && one.includes('There is 1 so far'), one);
  const some = periodAverages.weekdaysWaitingLine(days(W - 1));
  check('weekday waiting: names both numbers', some && some.includes(String(W)) && some.includes(String(W - 1)), some);
  sentences.push(one, some);

  const M = accounts.MIN_DAYS_FOR_MEASURED_CHANGE;
  check('measured change waiting: nothing with no balances', accounts.measuredChangeWaitingLine([]) === null);
  check('measured change waiting: nothing when first balance is zero', accounts.measuredChangeWaitingLine([{ date: '2026-01-01', balance: 0 }]) === null);
  const single = accounts.measuredChangeWaitingLine([{ date: '2026-01-01', balance: 100 }]);
  check('measured change waiting: one balance asks for a second', single && single.includes('second balance'), single);
  const span = accounts.measuredChangeWaitingLine([{ date: '2026-01-01', balance: 100 }, { date: '2026-01-11', balance: 110 }]);
  check('measured change waiting: says the span so far', span && span.includes('span 10 days'), span);
  check('measured change waiting: nothing once ready', accounts.measuredChangeWaitingLine([{ date: '2026-01-01', balance: 100 }, { date: '2026-03-01', balance: 110 }]) === null);
  check('measured change waiting: agrees with measuredChange at the constant', accounts.measuredChange([{ date: '2026-01-01', balance: 100 }, { date: new Date(Date.UTC(2026, 0, 1 + M)).toISOString().slice(0, 10), balance: 110 }]) !== null);
  sentences.push(single, span);

  const E = income.MIN_MONTHS_FOR_ESTIMATE_CHECK;
  check('estimate waiting: nothing without stats', income.estimateWaitingLine(null) === null);
  check('estimate waiting: nothing once ready', income.estimateWaitingLine({ spanMonths: E }) === null);
  const wait = income.estimateWaitingLine({ spanMonths: E - 1 });
  check('estimate waiting: names the span', wait && wait.includes(`span ${E - 1} so far`), wait);
  check('months between is inclusive', income.monthsBetweenInclusive('2026-01', '2026-03') === 3 && income.monthsBetweenInclusive('2025-12', '2026-01') === 2);
  sentences.push(wait);
}

const FORBIDDEN = [
  /\bstreaks?\b/i,
  /\blevel(s|led)?\b/i,
  /\bpoints?\b/i,
  /\bscor(e|es|ed|ing)\b/i,
  /\bpercent/i,
  /%/,
  /in a row/i,
  /\bunlock/i,
  /\bearned?\b/i,
  /\breward/i,
  /well done/i,
  /great job/i,
  /\bbehind\b/i,
  /on track/i,
  /\bfailed\b/i,
  /\bmissed\b/i,
  /\bbroke(n)?\b/i,
  /\bshould\b/i,
  /congratulat/i,
  /\bamazing\b/i,
  /\breal\b/i,
  /\bgenuine(ly)?\b/i,
  /[–—]/,
  / -- /,
];
for (const sentence of sentences) {
  for (const pattern of FORBIDDEN) {
    check(`no "${pattern}" in: ${sentence}`, !pattern.test(sentence));
  }
}
check('sentences were collected', sentences.length > 60, sentences.length);

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
