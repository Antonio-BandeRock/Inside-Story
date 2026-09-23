// Runs lib/doseMealTiming.ts: where a dose lands in the day, next to what
// is being eaten around it.
//
// Built 2026-09-22, from "Supplements have some specific rules about when
// they are to be taken, with or without food, with water, or with fat, or
// not with specific foods, or not with specific other vitamins and minerals
// and acids and hormones and all other things like them ... So, when they
// were taken throughout the day is part of scheduling and should be visible
// right along side the meal schedule."
//
// The rules checked:
//
//  1. Gaps read in words: the same minute, under an hour, a whole number of
//     hours, and hours plus minutes.
//  2. A dose is matched to a rule by what it carries (a supplement, by
//     nutrient code) or by what it is (a prescription, by generic name,
//     falling back to a substring of the name the person typed).
//  3. A separation rule fires only when a meal inside the window carries
//     enough of the competing nutrient to matter, the closest such meal is
//     the one named, and the sentence carries the amount so the person
//     reads the number rather than trusting the warning.
//  4. A skipped meal competes with nothing, and a skipped dose earns no
//     notes at all.
//  5. A meal nothing resolved from is unknown rather than empty: it never
//     clears a dose, and it earns one honest line saying so.
//  6. A fat-soluble dose reads the meals within two hours: fat there is a
//     good note, no fat there is a missing note, and an unresolved meal in
//     the window silences the missing note rather than guessing.
//  7. The timeline interleaves meals and doses by time, a meal first at a
//     shared minute, and the summary counts doses rather than notes.
//
// Run with: node scripts/test_dose_meal_timing.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const N = loadModule('lib/nutrientAnalysis.ts');
const T = loadModule('lib/timeOfDay.ts');
const D = loadModule('lib/doseMealTiming.ts', { './nutrientAnalysis': N, './timeOfDay': T });
const { minutesOfDay, describeGap, doseMatchesSubject, doseFoodNotes, doseGuidance, buildDayTimeline, timelineSummary } = D;

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }

// --- Fixtures ----------------------------------------------------------------

function meal(overrides) {
  return {
    id: 'm1',
    title: 'Breakfast',
    time: '07:30',
    mealType: 'breakfast',
    status: 'planned',
    nutrients: {},
    nutrientsResolved: true,
    ...overrides,
  };
}

function dose(overrides) {
  return {
    id: 'd1',
    time: '07:00',
    treatmentId: 't1',
    treatmentName: 'Levothyroxine',
    treatmentType: 'prescription',
    status: 'planned',
    doseLabel: '75 mcg',
    nutrientCodes: [],
    genericName: 'levothyroxine',
    ...overrides,
  };
}

// The two rule shapes that matter, copied from the live reference database
// (assets/data/foods_reference.db, interaction_rules) rather than invented,
// so a change to those rows shows up here as a failing sentence.
const levoCalcium = {
  id: 'levothyroxine_calcium_timing',
  ruleType: 'timing_separation',
  checkable: true,
  subjectAKind: 'prescription',
  subjectA: 'levothyroxine',
  subjectBKind: 'nutrient',
  subjectB: 'calcium',
  minSeparationHours: 4,
  severity: 'caution',
  title: 'Levothyroxine and calcium',
  guidance: 'Calcium binds levothyroxine in the gut and cuts how much of it you absorb.',
  citation: 'Singh N et al., Thyroid 2001',
  mechanism: 'Calcium salts adsorb levothyroxine, reducing bioavailability.',
};

const calciumIron = {
  id: 'calcium_iron_timing',
  ruleType: 'timing_separation',
  checkable: true,
  subjectAKind: 'nutrient',
  subjectA: 'calcium',
  subjectBKind: 'nutrient',
  subjectB: 'iron',
  minSeparationHours: 2,
  severity: 'note',
  title: 'Calcium and iron',
  guidance: 'Calcium and iron compete for the same absorption pathway.',
  citation: 'Lonnerdal B, J Nutr 2010',
  mechanism: null,
};

const vitaminDFat = {
  id: 'vitamin_d_dietary_fat',
  ruleType: 'dietary_cofactor',
  checkable: true,
  subjectAKind: 'nutrient',
  subjectA: 'vitamin_d',
  subjectBKind: 'nutrient',
  subjectB: 'fat_total',
  minSeparationHours: null,
  severity: 'note',
  title: 'Vitamin D needs fat',
  guidance: 'Vitamin D absorbs much better taken alongside a meal containing fat.',
  citation: 'Dawson-Hughes B et al., J Bone Miner Res 2015',
  mechanism: 'Fat-soluble vitamins need dietary lipid for micelle formation.',
};

const notCheckable = { ...calciumIron, id: 'biotin_thyroid_assay', checkable: false };

const names = { calcium: 'Calcium', iron: 'Iron', fat_total: 'Total Fat', vitamin_d: 'Vitamin D' };

// --- 1. Gaps in words ---------------------------------------------------------

check('the same minute', describeGap(0), 'at the same time');
check('under an hour', describeGap(25), '25 minutes apart');
check('a whole number of hours', describeGap(120), '2 hours apart');
check('one hour is singular', describeGap(60), '1 hour apart');
check('hours plus minutes', describeGap(190), '3 hours 10 minutes apart');
check('direction does not matter', describeGap(-45), '45 minutes apart');
check('minutes of day', [minutesOfDay('00:00'), minutesOfDay('07:30'), minutesOfDay('23:59')], [0, 450, 1439]);
check('a time that is not one reads as midnight rather than throwing', minutesOfDay(''), 0);

// --- 2. Matching a dose to a rule ---------------------------------------------

checkTrue('a supplement matches by what it carries', doseMatchesSubject(dose({ treatmentType: 'supplement', nutrientCodes: ['calcium'] }), 'nutrient', 'calcium'));
check('a supplement carrying something else does not', doseMatchesSubject(dose({ nutrientCodes: ['zinc'] }), 'nutrient', 'calcium'), false);
checkTrue('a prescription matches by generic name', doseMatchesSubject(dose({}), 'prescription', 'levothyroxine'));
check('a different generic name does not', doseMatchesSubject(dose({ genericName: 'metformin' }), 'prescription', 'levothyroxine'), false);
checkTrue(
  'with no generic name, the name the person typed is searched',
  doseMatchesSubject(dose({ genericName: null, treatmentName: 'Synthroid (levothyroxine) 75mcg' }), 'prescription', 'levothyroxine'),
);
check('neither side named, no match', doseMatchesSubject(dose({}), null, null), false);

// --- 3. A separation rule against a meal --------------------------------------

const yogurtBreakfast = meal({ title: 'Yogurt and berries', time: '07:30', nutrients: { calcium: 420, fat_total: 9 } });

const clash = doseFoodNotes(dose({}), [yogurtBreakfast], [levoCalcium], names);
check('one note', clash.length, 1);
check('it is a clash', clash[0].kind, 'clash');
check('naming the meal', clash[0].headline, 'Too close to Yogurt and berries');
checkTrue('the sentence carries the amount', /about 420 mg of Calcium/.test(clash[0].detail));
checkTrue('and the gap', /30 minutes apart from this dose/.test(clash[0].detail));
checkTrue('and what to aim for', /at least 4 hours between them/.test(clash[0].detail));
checkTrue('and the guidance verbatim', clash[0].detail.includes(levoCalcium.guidance));
check('the citation travels', clash[0].citation, levoCalcium.citation);
check('so does the rule id', clash[0].ruleId, 'levothyroxine_calcium_timing');

check(
  'a meal outside the window raises nothing',
  doseFoodNotes(dose({}), [meal({ time: '13:00', nutrients: { calcium: 420 } })], [levoCalcium], names).length,
  0,
);
check(
  'a trace of the nutrient raises nothing',
  doseFoodNotes(dose({}), [meal({ nutrients: { calcium: 40 } })], [levoCalcium], names).length,
  0,
);
check(
  'a rule that is not checkable is skipped',
  doseFoodNotes(dose({ treatmentType: 'supplement', nutrientCodes: ['iron'] }), [meal({ nutrients: { calcium: 420 } })], [notCheckable], names).length,
  0,
);

const twoMeals = [
  meal({ id: 'm1', title: 'Early snack', time: '05:00', nutrients: { calcium: 500 } }),
  meal({ id: 'm2', title: 'Yogurt and berries', time: '07:30', nutrients: { calcium: 420 } }),
];
check('the closest qualifying meal is the one named', doseFoodNotes(dose({}), twoMeals, [levoCalcium], names)[0].headline, 'Too close to Yogurt and berries');

// A nutrient-to-nutrient rule reaches a supplement from either side.
check(
  'the rule reads the same from the iron side',
  doseFoodNotes(dose({ treatmentType: 'supplement', nutrientCodes: ['iron'], genericName: null, treatmentName: 'Iron bisglycinate' }), [yogurtBreakfast], [calciumIron], names)[0].kind,
  'clash',
);
check(
  'and from the calcium side',
  doseFoodNotes(
    dose({ treatmentType: 'supplement', nutrientCodes: ['calcium'], genericName: null, treatmentName: 'Calcium citrate' }),
    [meal({ title: 'Lentil bowl', nutrients: { iron: 6 } })],
    [calciumIron],
    names,
  )[0].kind,
  'clash',
);
check(
  'a rule with no nutrient on either side has nothing on a plate to check',
  doseFoodNotes(dose({}), [yogurtBreakfast], [{ ...levoCalcium, subjectBKind: 'prescription', subjectB: 'ibuprofen' }], names).length,
  0,
);

// --- 4. Skipped -------------------------------------------------------------

check(
  'a skipped meal competes with nothing',
  doseFoodNotes(dose({}), [meal({ status: 'skipped', nutrients: { calcium: 420 } })], [levoCalcium], names).length,
  0,
);
check('a skipped dose earns no notes', doseFoodNotes(dose({ status: 'skipped' }), [yogurtBreakfast], [levoCalcium], names).length, 0);
check(
  'a meal already eaten still counts',
  doseFoodNotes(dose({}), [meal({ status: 'logged', nutrients: { calcium: 420 } })], [levoCalcium], names)[0].kind,
  'clash',
);

// --- 5. Unknown is not zero ---------------------------------------------------

const unresolved = meal({ title: 'Something unplanned', nutrients: {}, nutrientsResolved: false });
const unknownNotes = doseFoodNotes(dose({}), [unresolved], [levoCalcium], names);
check('one line', unknownNotes.length, 1);
check('and it says so', unknownNotes[0].kind, 'unknown');
checkTrue('naming where to fix it', /Building it in the Food tab/.test(unknownNotes[0].detail));
check('no rule id, since no rule fired', unknownNotes[0].ruleId, null);
check(
  'an unresolved meal outside the window says nothing',
  doseFoodNotes(dose({}), [meal({ time: '18:00', nutrientsResolved: false })], [levoCalcium], names).length,
  0,
);
check(
  'an unresolved meal alongside a clash is said as well',
  doseFoodNotes(dose({}), [yogurtBreakfast, unresolved], [levoCalcium], names).map((note) => note.kind),
  ['clash', 'unknown'],
);
check(
  'with no nutrient rule in play there is nothing it could have been checked against',
  doseFoodNotes(dose({ genericName: 'metformin' }), [unresolved], [levoCalcium], names).length,
  0,
);

// --- 6. A dose that needs fat -------------------------------------------------

const vitaminD = dose({ id: 'd2', time: '08:00', treatmentType: 'supplement', treatmentName: 'Vitamin D3', genericName: null, nutrientCodes: ['vitamin_d'], doseLabel: '2 capsules' });

const withFat = doseFoodNotes(vitaminD, [meal({ title: 'Eggs and avocado', time: '08:15', nutrients: { fat_total: 22 } })], [vitaminDFat], names);
check('fat nearby is a good note', withFat[0].kind, 'good');
check('naming the meal', withFat[0].headline, 'Eggs and avocado covers the fat this one needs');
checkTrue('and the amount', /about 22 g of fat/.test(withFat[0].detail));

const noFat = doseFoodNotes(vitaminD, [meal({ title: 'Black coffee', time: '08:15', nutrients: { fat_total: 0 } })], [vitaminDFat], names);
check('no fat nearby is a missing note', noFat[0].kind, 'missing');
checkTrue('saying how far it looked', /within 2 hours of this time/.test(noFat[0].detail));
checkTrue('and what is easier to move', /Moving the dose to a meal/.test(noFat[0].detail));

check('a trace of fat does not count as fat', doseFoodNotes(vitaminD, [meal({ time: '08:15', nutrients: { fat_total: 2 } })], [vitaminDFat], names)[0].kind, 'missing');
check('nothing scheduled at all is still a missing note', doseFoodNotes(vitaminD, [], [vitaminDFat], names)[0].kind, 'missing');
check(
  'a meal three hours away is outside the window',
  doseFoodNotes(vitaminD, [meal({ time: '11:30', nutrients: { fat_total: 30 } })], [vitaminDFat], names)[0].kind,
  'missing',
);
check(
  'an unresolved meal in the window silences the missing note rather than guessing',
  doseFoodNotes(vitaminD, [meal({ time: '08:15', nutrientsResolved: false })], [vitaminDFat], names).length,
  0,
);
check(
  'the fattiest meal in the window is the one named',
  doseFoodNotes(
    vitaminD,
    [meal({ id: 'm1', title: 'Toast', time: '07:45', nutrients: { fat_total: 6 } }), meal({ id: 'm2', title: 'Eggs and avocado', time: '09:00', nutrients: { fat_total: 22 } })],
    [vitaminDFat],
    names,
  )[0].headline,
  'Eggs and avocado covers the fat this one needs',
);

// A clash outranks everything else on the same dose.
const both = doseFoodNotes(
  dose({ id: 'd3', treatmentType: 'supplement', genericName: null, treatmentName: 'Multivitamin', nutrientCodes: ['vitamin_d', 'iron'] }),
  [meal({ title: 'Yogurt and berries', nutrients: { calcium: 420, fat_total: 0 } })],
  [calciumIron, vitaminDFat],
  names,
);
check('worst first', both.map((note) => note.kind), ['clash', 'missing']);

// --- The reference lines ------------------------------------------------------

const timings = [
  { nutrientCode: 'vitamin_d', solubility: 'fat_soluble', bestTaken: 'Needs dietary fat present in the same meal.', citation: 'IOM 2011' },
  { nutrientCode: 'iron', solubility: 'mineral', bestTaken: 'Best absorbed on an empty stomach.', citation: null },
];
check('a line per nutrient with a row', doseGuidance(dose({ treatmentType: 'supplement', nutrientCodes: ['vitamin_d', 'iron'] }), timings, names).map((line) => line.nutrientName), ['Vitamin D', 'Iron']);
check('a nutrient with no row is left out', doseGuidance(dose({ treatmentType: 'supplement', nutrientCodes: ['boron'] }), timings, names).length, 0);
check('a prescription carries no nutrient lines', doseGuidance(dose({}), timings, names).length, 0);
check('a code with no display name reads as words', doseGuidance(dose({ treatmentType: 'supplement', nutrientCodes: ['vitamin_d'] }), timings, {})[0].nutrientName, 'vitamin d');

// --- 7. The day, and the line above it ----------------------------------------

const dayMeals = [
  meal({ id: 'm1', title: 'Yogurt and berries', time: '07:30', nutrients: { calcium: 420, fat_total: 9 } }),
  meal({ id: 'm2', title: 'Lentil bowl', time: '12:30', nutrients: { iron: 7, fat_total: 12 } }),
];
const dayDoses = [dose({ id: 'd1', time: '07:00' }), { ...vitaminD, time: '12:30' }];
const timeline = buildDayTimeline(dayMeals, dayDoses, [levoCalcium, vitaminDFat], timings, names);

check('everything is on it', timeline.length, 4);
check('in the order it happens', timeline.map((entry) => entry.time), ['07:00', '07:30', '12:30', '12:30']);
check('a meal comes before a dose at the same minute', timeline.slice(2).map((entry) => entry.kind), ['meal', 'dose']);
check('the dose carries its notes', timeline[0].notes.map((note) => note.kind), ['clash']);
check('and its reference lines', timeline[3].guidance.map((line) => line.nutrientName), ['Vitamin D']);
check('the midday dose is covered by the bowl it sits with', timeline[3].notes.map((note) => note.kind), ['good']);

check('the line above the day', timelineSummary(timeline), '1 dose sits too close to a meal that competes with it.');
check('nothing to say stays quiet', timelineSummary(buildDayTimeline(dayMeals, [], [levoCalcium], timings, names)), null);
check(
  'both halves read as one sentence',
  timelineSummary(buildDayTimeline([dayMeals[0]], [dose({ id: 'd1' }), { ...vitaminD, time: '20:00' }], [levoCalcium, vitaminDFat], timings, names)),
  '1 dose sits too close to a meal that competes with it, and 1 dose has no meal near it to absorb with.',
);
check(
  'two of a kind read as two',
  timelineSummary(buildDayTimeline([dayMeals[0]], [dose({ id: 'd1', time: '07:00' }), dose({ id: 'd2', time: '08:00' })], [levoCalcium], timings, names)),
  '2 doses sit too close to meals that compete with them.',
);
check(
  'a dose with both notes counts once, as the worse one',
  timelineSummary(buildDayTimeline([dayMeals[0]], [{ ...dose({ id: 'd3', treatmentType: 'supplement', genericName: null, treatmentName: 'Multivitamin', nutrientCodes: ['vitamin_d', 'iron'] }), time: '07:00' }], [calciumIron, vitaminDFat], timings, names)),
  '1 dose sits too close to a meal that competes with it.',
);
check('an empty day has nothing on it', buildDayTimeline([], [], [], [], {}).length, 0);

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
