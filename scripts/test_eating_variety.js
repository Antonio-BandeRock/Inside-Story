// Runs lib/eatingVariety.ts: the arithmetic behind Trends > What You Eat.
//
// Built 2026-09-23, phase 2 of the cross-app push.
//
// The rules checked:
//
//  1. Calendar arithmetic rolls over months and years, and the gap between
//     two dates is counted in whole days.
//  2. Weeks are anchored at the end of the range and walked backwards in
//     sevens, so the most recent week is a clean block and the ragged
//     remainder falls at the oldest end, marked partial.
//  3. A WEEK WITH NOTHING LOGGED IS A GAP, NEVER A ZERO. Every weekly figure
//     is null in that case, and the screen says how many weeks were left off.
//  4. The comparison average leaves out partial weeks, so fewer days never
//     reads as a decline.
//  5. Near things come from the safe list, exclude anything already eaten in
//     the range, and are capped.
//  6. Repetition counts entries and distinct days apart, and a food logged on
//     one day has no average gap.
//  7. Gut-feeding foods count a scored food and a fermented one together, and
//     fermented entries are counted separately on top.
//  8. A missing or N/A cooking method reads as not said rather than being
//     sorted into a guess.
//  9. The bought-against-home split is worked out over what could be placed,
//     so unresolved free text never drags it down.
// 10. The safe list is cumulative and does not use the gap rule, since a week
//     where nothing was added still has the same list.
// 11. No sentence anywhere claims a count caused anything.
//
// Run with: node scripts/test_eating_variety.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const V = loadModule('lib/eatingVariety.ts');
const {
  addDays,
  daysBetween,
  shortDate,
  buildWeeks,
  describeWeek,
  summarizeDistinctFoods,
  suggestNearThings,
  describeNearThings,
  summarizeRotation,
  describeRepeat,
  summarizeGutFoods,
  methodLabel,
  METHOD_NOT_SAID,
  summarizeMethodMix,
  summarizePackagedShare,
  summarizeSafeList,
  summarizeEatingVariety,
  describeVarietyThisWeek,
} = V;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(name, actual) {
  check(name, actual === true, true);
}

// ---------------------------------------------------------------------------
// 1. Calendar arithmetic.
// ---------------------------------------------------------------------------
check('a day forward', addDays('2026-09-23', 1), '2026-09-24');
check('a day back', addDays('2026-09-23', -1), '2026-09-22');
check('over a month boundary', addDays('2026-09-30', 1), '2026-10-01');
check('back over a month boundary', addDays('2026-10-01', -1), '2026-09-30');
check('over a year boundary', addDays('2026-12-31', 1), '2027-01-01');
check('a leap day is reachable', addDays('2028-02-28', 1), '2028-02-29');
check('a week back', addDays('2026-09-23', -7), '2026-09-16');
check('the same day is zero apart', daysBetween('2026-09-23', '2026-09-23'), 0);
check('a week apart', daysBetween('2026-09-16', '2026-09-23'), 7);
check('across a month', daysBetween('2026-08-31', '2026-09-01'), 1);
check('backwards reads negative', daysBetween('2026-09-23', '2026-09-16'), -7);
check('a date reads short', shortDate('2026-09-23'), 'Sep 23');
check('a single digit day loses its zero', shortDate('2026-01-05'), 'Jan 5');

// ---------------------------------------------------------------------------
// 2. Week blocks.
// ---------------------------------------------------------------------------
const threeWeeks = buildWeeks('2026-09-03', '2026-09-23', []);
check('a 21 day range is three weeks', threeWeeks.length, 3);
check('oldest first', threeWeeks[0].weekStart, '2026-09-03');
check('the last block ends on the last day', threeWeeks[2].weekEnd, '2026-09-23');
check('the last block is a clean seven', threeWeeks[2].weekStart, '2026-09-17');
check('an even range has no partial block', threeWeeks.filter((w) => w.partial).length, 0);

const raggedWeeks = buildWeeks('2026-09-01', '2026-09-23', []);
check('a 23 day range is four blocks', raggedWeeks.length, 4);
check('the ragged block is the oldest', raggedWeeks[0].partial, true);
check('the ragged block starts at the range start', raggedWeeks[0].weekStart, '2026-09-01');
check('the ragged block is two days', daysBetween(raggedWeeks[0].weekStart, raggedWeeks[0].weekEnd) + 1, 2);
check('only the oldest is partial', raggedWeeks.filter((w) => w.partial).length, 1);
check('the newest block is still a clean seven', raggedWeeks[3].weekStart, '2026-09-17');
check('a backwards range builds nothing', buildWeeks('2026-09-23', '2026-09-01', []), []);
check('a single day is one block', buildWeeks('2026-09-23', '2026-09-23', []).length, 1);
check('a week reads as a range', describeWeek(threeWeeks[2]), 'Sep 17 to Sep 23');

const weeksWithLogging = buildWeeks('2026-09-03', '2026-09-23', ['2026-09-04', '2026-09-05', '2026-09-20']);
check('days logged are counted per block', weeksWithLogging.map((w) => w.daysLogged), [2, 0, 1]);
check('a block with nothing has no logging', weeksWithLogging.map((w) => w.hasLogging), [true, false, true]);

// ---------------------------------------------------------------------------
// 3 and 4. Distinct foods, gaps, and the comparison average.
// ---------------------------------------------------------------------------
function food(date, key, extra) {
  return Object.assign(
    {
      date,
      foodKey: key,
      foodName: key,
      category: 'Veg',
      cookingMethod: 'Steamed',
      packaged: 'home',
      gutSupportive: false,
      fermented: false,
    },
    extra || {},
  );
}

const records = [
  // Week of Sep 3 to Sep 9: four different foods.
  food('2026-09-04', 'carrot'),
  food('2026-09-04', 'rice'),
  food('2026-09-06', 'carrot'),
  food('2026-09-06', 'salmon'),
  food('2026-09-08', 'kale'),
  // Week of Sep 10 to Sep 16: nothing at all.
  // Week of Sep 17 to Sep 23: two different foods.
  food('2026-09-18', 'carrot'),
  food('2026-09-22', 'lentils'),
];
const inputs = {
  records,
  loggedDates: ['2026-09-04', '2026-09-06', '2026-09-08', '2026-09-18', '2026-09-22'],
  startDate: '2026-09-03',
  endDate: '2026-09-23',
};
const weeks = buildWeeks(inputs.startDate, inputs.endDate, inputs.loggedDates);
const distinct = summarizeDistinctFoods(inputs, weeks);

check('a week with nothing logged is null, never zero', distinct.weeks.map((w) => w.value), [4, null, 2]);
check('the gap week is marked as having no logging', distinct.weeks[1].hasLogging, false);
check('the most recent week is the headline figure', distinct.latest, 2);
check('distinct across the range dedupes', distinct.distinctAcrossRange, 5);
check('the gap is counted', distinct.weeksWithoutLogging, 1);
checkTrue('the gap is explained rather than drawn', distinct.gapNote.includes('rather than drawn as zero'));
check('only logged full weeks feed the average', distinct.earlierWeeksCounted, 1);
check('the average is of those weeks alone', distinct.earlierAverage, 4);
checkTrue('the headline names both figures', distinct.headline.includes('2 different foods') && distinct.headline.includes('4'));

const noGaps = summarizeDistinctFoods(
  { records: [], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' },
  buildWeeks('2026-09-03', '2026-09-23', []),
);
check('an empty range has nothing to count', noGaps.headline, 'Nothing logged in this range yet, so there is nothing to count.');
check('an empty range has every week null', noGaps.weeks.map((w) => w.value), [null, null, null]);

// A partial oldest week must not be averaged in: fewer days always shows
// fewer foods, and comparing the two invents a decline that is not there.
const partialInputs = {
  records: [food('2026-09-02', 'a'), food('2026-09-09', 'b'), food('2026-09-09', 'c'), food('2026-09-20', 'd')],
  loggedDates: ['2026-09-02', '2026-09-09', '2026-09-20'],
  startDate: '2026-09-01',
  endDate: '2026-09-23',
};
const partial = summarizeDistinctFoods(partialInputs, buildWeeks(partialInputs.startDate, partialInputs.endDate, partialInputs.loggedDates));
check('the partial block still charts its own count', partial.weeks[0].value, 1);
check('the partial block is marked', partial.weeks[0].partial, true);
check('the partial block is left out of the average', partial.earlierWeeksCounted, 1);
check('the average is the one full logged week', partial.earlierAverage, 2);

const level = summarizeDistinctFoods(
  {
    records: [food('2026-09-04', 'a'), food('2026-09-04', 'b'), food('2026-09-18', 'c'), food('2026-09-18', 'd')],
    loggedDates: ['2026-09-04', '2026-09-18'],
    startDate: '2026-09-03',
    endDate: '2026-09-23',
  },
  buildWeeks('2026-09-03', '2026-09-23', ['2026-09-04', '2026-09-18']),
);
checkTrue('matching the average says so plainly', level.headline.includes('the same as'));

// ---------------------------------------------------------------------------
// 5. Near things.
// ---------------------------------------------------------------------------
const safeFoods = [
  { foodName: 'Carrot', verdict: 'safe', addedAt: '2026-08-01T10:00:00' },
  { foodName: 'Beetroot', verdict: 'safe', addedAt: '2026-09-15T10:00:00' },
  { foodName: 'Parsnip', verdict: 'safe', addedAt: '2026-09-10T10:00:00' },
  { foodName: 'Swede', verdict: 'safe', addedAt: '2026-09-01T10:00:00' },
  { foodName: 'Turnip', verdict: 'safe', addedAt: '2026-09-20T10:00:00' },
  { foodName: 'Gluten', verdict: 'avoid', addedAt: '2026-09-19T10:00:00' },
];
const near = suggestNearThings(safeFoods, records);
check('the most recently marked come first', near, ['Turnip', 'Beetroot', 'Parsnip']);
check('the cap is respected', suggestNearThings(safeFoods, records, 2), ['Turnip', 'Beetroot']);
checkTrue('something eaten in the range is not suggested', !suggestNearThings(safeFoods, records, 10).includes('Carrot'));
checkTrue('something marked avoid is never suggested', !suggestNearThings(safeFoods, records, 10).includes('Gluten'));
check('nothing safe suggests nothing', suggestNearThings([], records), []);
check('no suggestions produce no sentence', describeNearThings([]), null);
check('one reads singular', describeNearThings(['Turnip']), 'Turnip is on your safe list and has not come up in this range.');
check(
  'several read as a list',
  describeNearThings(['Turnip', 'Beetroot', 'Parsnip']),
  'Turnip, Beetroot and Parsnip are on your safe list and have not come up in this range.',
);

// ---------------------------------------------------------------------------
// 6. Repetition and rotation.
// ---------------------------------------------------------------------------
const rotation = summarizeRotation(inputs);
check('every entry is counted', rotation.totalEntries, 7);
check('distinct foods are counted apart from entries', rotation.distinctFoods, 5);
check('the most repeated leads', rotation.mostRepeated[0].foodName, 'carrot');
check('its entries are counted', rotation.mostRepeated[0].timesLogged, 3);
check('the days it landed on are counted separately', rotation.mostRepeated[0].daysOnWhichLogged, 3);
check('the average gap is the mean between those days', rotation.mostRepeated[0].averageGapDays, 7);
check('days since the last one are measured to the range end', rotation.mostRepeated[0].daysSinceLast, 5);
const oneDayFood = rotation.mostRepeated.find((f) => f.foodName === 'rice');
check('a food logged once has no gap to report', oneDayFood.averageGapDays, null);
check('fewer than five foods report no concentration', summarizeRotation({ records: records.slice(0, 2), loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).topFiveShare, null);
check('five or more report one', rotation.topFiveShare, 100);
checkTrue('the concentration note names the five', rotation.concentrationNote.includes('five'));
check(
  'an empty range has nothing to count',
  summarizeRotation({ records: [], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).headline,
  'Nothing logged in this range yet, so there is nothing to count.',
);
checkTrue('a repeat reads in words', describeRepeat(rotation.mostRepeated[0]).includes('3 times'));
checkTrue('a repeat names its gap', describeRepeat(rotation.mostRepeated[0]).includes('every 7 days'));
checkTrue('a repeat never claims a cause', !describeRepeat(rotation.mostRepeated[0]).includes('because'));

// ---------------------------------------------------------------------------
// 7. Gut-feeding foods.
// ---------------------------------------------------------------------------
const gutRecords = [
  food('2026-09-04', 'garlic', { gutSupportive: true }),
  food('2026-09-04', 'rice'),
  food('2026-09-06', 'sauerkraut', { fermented: true, cookingMethod: 'Fermented' }),
  food('2026-09-18', 'garlic', { gutSupportive: true }),
  food('2026-09-19', 'kefir', { fermented: true, gutSupportive: true, cookingMethod: 'Fermented' }),
];
const gutInputs = {
  records: gutRecords,
  loggedDates: ['2026-09-04', '2026-09-06', '2026-09-18', '2026-09-19'],
  startDate: '2026-09-03',
  endDate: '2026-09-23',
};
const gut = summarizeGutFoods(gutInputs, buildWeeks(gutInputs.startDate, gutInputs.endDate, gutInputs.loggedDates));
check('a scored food and a fermented one both count', gut.weeks[0].value, 2);
check('the gap week is still null here', gut.weeks[1].value, null);
check('the gap week has no fermented count either', gut.weeks[1].fermentedEntries, null);
check('the most recent week counts both again', gut.weeks[2].value, 2);
check('fermented entries are counted on top', gut.weeks[2].fermentedEntries, 1);
check('distinct across the range dedupes garlic', gut.distinctAcrossRange, 3);
check('fermented entries across the range', gut.fermentedEntriesAcrossRange, 2);
checkTrue('names are offered to read', gut.names.includes('sauerkraut'));
checkTrue('a food that is neither is left out', !gut.names.includes('rice'));
checkTrue('the headline names both figures', gut.headline.includes('2 different gut-feeding foods'));
const noGut = summarizeGutFoods(inputs, weeks);
checkTrue('none scored says so and points at the Info button', noGut.headline.includes('Info button'));
check('none scored counts nothing', noGut.distinctAcrossRange, 0);

// ---------------------------------------------------------------------------
// 8. Cooking method.
// ---------------------------------------------------------------------------
check('a missing method reads as not said', methodLabel(null), METHOD_NOT_SAID);
check('an empty method reads as not said', methodLabel('   '), METHOD_NOT_SAID);
check('N/A reads as not said', methodLabel('N/A'), METHOD_NOT_SAID);
check('lower case n/a reads as not said', methodLabel('n/a'), METHOD_NOT_SAID);
check('a real method is kept as written', methodLabel('Steamed'), 'Steamed');
check('surrounding space is trimmed', methodLabel('  Grilled  '), 'Grilled');

const methodInputs = {
  records: [
    food('2026-09-04', 'a', { cookingMethod: 'Boiled' }),
    food('2026-09-04', 'b', { cookingMethod: 'Boiled' }),
    food('2026-09-05', 'c', { cookingMethod: 'Raw' }),
    food('2026-09-05', 'd', { cookingMethod: null }),
  ],
  loggedDates: ['2026-09-04', '2026-09-05'],
  startDate: '2026-09-03',
  endDate: '2026-09-23',
};
const mix = summarizeMethodMix(methodInputs);
check('the commonest method leads', mix.shares[0].method, 'Boiled');
check('its count is right', mix.shares[0].count, 2);
check('its share is a whole percent', mix.shares[0].share, 50);
check('not said is a row of its own', mix.shares.find((s) => s.method === METHOD_NOT_SAID).count, 1);
check('the not said share is reported', mix.notSaidShare, 25);
checkTrue('the headline names the commonest', mix.headline.includes('boiled'));
checkTrue('the note says nothing was guessed', mix.notSaidNote.includes('rather than sorted into a guess'));
check(
  'everything unsaid says so',
  summarizeMethodMix({ records: [food('2026-09-04', 'a', { cookingMethod: null })], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).headline,
  'None of what you logged in this range said how it was cooked.',
);
check(
  'nothing logged has nothing to count',
  summarizeMethodMix({ records: [], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).headline,
  'Nothing logged in this range yet, so there is nothing to count.',
);
check(
  'every method said means no note',
  summarizeMethodMix({ records: [food('2026-09-04', 'a', { cookingMethod: 'Raw' })], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).notSaidNote,
  null,
);

// ---------------------------------------------------------------------------
// 9. Bought ready against made at home.
// ---------------------------------------------------------------------------
const packagedInputs = {
  records: [
    food('2026-09-04', 'a', { packaged: 'bought' }),
    food('2026-09-04', 'b', { packaged: 'home' }),
    food('2026-09-04', 'c', { packaged: 'home' }),
    food('2026-09-04', 'd', { packaged: 'home' }),
    food('2026-09-05', 'e', { packaged: 'unknown' }),
    food('2026-09-05', 'f', { packaged: 'unknown' }),
  ],
  loggedDates: ['2026-09-04', '2026-09-05'],
  startDate: '2026-09-03',
  endDate: '2026-09-23',
};
const packaged = summarizePackagedShare(packagedInputs);
check('bought is counted', packaged.bought, 1);
check('home is counted', packaged.home, 3);
check('unknown is counted', packaged.unknown, 2);
check('the split leaves unknown out', packaged.boughtShare, 25);
checkTrue('the headline says what could be placed', packaged.headline.includes('could be placed'));
checkTrue('the note explains free text', packaged.unknownNote.includes('free text'));
check(
  'nothing placeable says so',
  summarizePackagedShare({ records: [food('2026-09-04', 'a', { packaged: 'unknown' })], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).boughtShare,
  null,
);
check(
  'everything placed leaves no note',
  summarizePackagedShare({ records: [food('2026-09-04', 'a', { packaged: 'home' })], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).unknownNote,
  null,
);
check(
  'nothing logged has nothing to count',
  summarizePackagedShare({ records: [], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }).headline,
  'Nothing logged in this range yet, so there is nothing to count.',
);

// ---------------------------------------------------------------------------
// 10. The safe list.
// ---------------------------------------------------------------------------
const trials = [
  { foodName: 'Oats', status: 'cleared', startedAt: '2026-09-05T08:00:00' },
  { foodName: 'Soy', status: 'flagged', startedAt: '2026-09-07T08:00:00' },
  { foodName: 'Almond', status: 'trialing', startedAt: '2026-09-20T08:00:00' },
  { foodName: 'Rye', status: 'cleared', startedAt: '2026-07-01T08:00:00' },
];
const safeList = summarizeSafeList(safeFoods, trials, '2026-09-03', '2026-09-23');
check('every safe food is counted', safeList.totalSafe, 5);
check('avoid is counted apart', safeList.totalAvoid, 1);
check('unsure is counted apart', safeList.totalUnsure, 0);
check('only those added in the range are counted as added', safeList.addedInRange, 3);
check('the running count carries the whole history forward', safeList.points.map((p) => p.value), [3, 4, 5]);
check('the points are dated by when each was marked', safeList.points.map((p) => p.date), ['2026-09-10', '2026-09-15', '2026-09-20']);
check('trials started before the range are left out', safeList.trialsCleared, 1);
check('flagged trials are counted', safeList.trialsFlagged, 1);
check('running trials are counted', safeList.trialsRunning, 1);
checkTrue('the headline names both figures', safeList.headline.includes('5 foods marked safe') && safeList.headline.includes('3 of them'));
checkTrue('the trial note reads as counts', safeList.trialNote.includes('1 cleared'));
check(
  'an empty safe list points at where to fill it',
  summarizeSafeList([], [], '2026-09-03', '2026-09-23').headline,
  'Nothing on your safe list yet. Mark a food safe from Food > Safe Foods once you know it agrees with you.',
);
check('no trials leave no note', summarizeSafeList(safeFoods, [], '2026-09-03', '2026-09-23').trialNote, null);
checkTrue(
  'a range with no additions says so',
  summarizeSafeList(safeFoods, [], '2026-10-01', '2026-10-23').headline.includes('none of them added in this range'),
);

// ---------------------------------------------------------------------------
// The whole lens, and the Home line.
// ---------------------------------------------------------------------------
const summary = summarizeEatingVariety(inputs, safeFoods, trials);
check('every band is present', Object.keys(summary).length, 10);
check('the weeks are shared by every band', summary.weeks.length, 3);
check('the distinct band is filled', summary.distinct.latest, 2);
check('near things are filled', summary.nearThings.length, 3);
check('there is something to show', summary.hasAnything, true);
check(
  'an empty range says there is nothing',
  summarizeEatingVariety({ records: [], loggedDates: [], startDate: '2026-09-03', endDate: '2026-09-23' }, [], []).hasAnything,
  false,
);

check('the Home line compares against the average', describeVarietyThisWeek(distinct), '2 different foods this week, 2 fewer than your recent average.');
check('a week above the average says so', describeVarietyThisWeek({ latest: 9, earlierAverage: 4, distinctAcrossRange: 20 }), '9 different foods this week, 5 more than your recent average.');
check('a level week says so', describeVarietyThisWeek({ latest: 4, earlierAverage: 4, distinctAcrossRange: 20 }), '4 different foods this week, level with your recent average.');
check('no comparison yet leaves it out', describeVarietyThisWeek({ latest: 4, earlierAverage: null, distinctAcrossRange: 20 }), '4 different foods this week.');
check('a week with nothing logged says so', describeVarietyThisWeek({ latest: null, earlierAverage: null, distinctAcrossRange: 20 }), 'No meals logged this week yet.');
check('nothing at all invites a first meal', describeVarietyThisWeek({ latest: null, earlierAverage: null, distinctAcrossRange: 0 }), 'Log a few meals to start seeing how varied your eating is.');

// ---------------------------------------------------------------------------
// 11. Nothing here claims a cause.
// ---------------------------------------------------------------------------
const everySentence = [
  distinct.headline,
  distinct.gapNote,
  rotation.headline,
  rotation.concentrationNote,
  gut.headline,
  mix.headline,
  mix.notSaidNote,
  packaged.headline,
  packaged.unknownNote,
  safeList.headline,
  safeList.trialNote,
  describeVarietyThisWeek(distinct),
].filter(Boolean);
const forbidden = ['caused', 'because of', 'proves', 'means you', 'you should eat', 'you are eating badly'];
for (const sentence of everySentence) {
  for (const word of forbidden) {
    checkTrue(`"${word}" stays out of "${sentence.slice(0, 40)}"`, !sentence.toLowerCase().includes(word));
  }
}

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
