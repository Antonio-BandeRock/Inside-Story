// Runs lib/growingConditions.ts: the arithmetic behind Garden > Growing
// Conditions and Trends > Growing Conditions.
//
// Built 2026-09-23, stage 0 of the sensor work. The reading is separated
// from the radio, so everything here has to be right whether a figure was
// typed off a meter or arrived from a sensor nobody has built yet.
//
// The rules checked:
//
//  1. UNITS ARE NEVER CONVERTED ACROSS KINDS. Celsius and Fahrenheit are one
//     quantity read two ways and convert; a moisture percentage and a
//     tensiometer centibar are two quantities, as are lux and PPFD, and a
//     reading in the odd one out is set aside and counted rather than folded
//     into the figures.
//  2. A MONTH WITH NOTHING MEASURED IS A GAP, NEVER A ZERO, and the note
//     under the rows tells "nothing came in" from "nothing was measured".
//  3. Rain and watering are added up over a month; everything else is
//     averaged, and an averaged band also says its lowest and highest, since
//     an average hides the night that dropped below freezing.
//  4. A FIGURE IS NEVER GUESSED AT: a blank or unreadable one is refused
//     rather than stored as zero, and nothing carries a reading forward into
//     a month that had none.
//  5. An area with no readings is named as having none, and a reading whose
//     area is gone still reads back under the name it was taken in.
//  6. Nothing here marks a garden or a gardener: no sentence blames, praises
//     or calls a figure good or bad.
//
// Run with: node scripts/test_growing_conditions.js
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
    if (!found) throw new Error(`unexpected import ${name}`);
    return found;
  });
  return module.exports;
}

// growingConditions.ts takes its calendar from harvestYield.ts rather than
// growing a second copy of it, and that file takes its day arithmetic from
// three others.
const V = run('lib/eatingVariety.ts', {});
const T = run('lib/harvestTrade.ts', {});
const U = run('lib/unitConversion.ts', {});
const H = run('lib/harvestYield.ts', {
  './eatingVariety': V,
  './harvestTrade': T,
  './unitConversion': U,
});
const G = run('lib/growingConditions.ts', { './harvestYield': H });

const C = run('lib/choiceOrder.ts', {});
const S = run('lib/growSetup.ts', { './choiceOrder': C, './harvestTrade': T });

const {
  buildMonths,
  unitsCompatible,
  convertUnit,
  unitChoices,
  aggregateFor,
  placesFor,
  formatFigure,
  buildMeasurementBand,
  describeMeasuredThings,
  describeWhen,
  describeAreaCoverage,
  checkReading,
  describeReading,
  BUILT_IN_UNITS,
} = G;

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
function checkClose(name, actual, expected) {
  check(name, Math.round(actual * 1000) / 1000, Math.round(expected * 1000) / 1000);
}

const everySentence = [];
function collect(...values) {
  for (const value of values) if (typeof value === 'string' && value.length > 0) everySentence.push(value);
}

function reading(overrides) {
  return {
    id: overrides.id ?? `r${Math.random()}`,
    plotId: overrides.plotId ?? null,
    plotName: overrides.plotName ?? null,
    plantingId: overrides.plantingId ?? null,
    measurement: overrides.measurement ?? 'soil_temperature',
    value: overrides.value,
    unit: overrides.unit ?? '°C',
    measuredOn: overrides.measuredOn,
    source: overrides.source ?? 'hand',
    deviceName: overrides.deviceName ?? null,
    note: overrides.note ?? null,
    createdAt: overrides.createdAt ?? `${overrides.measuredOn}T09:00:00.000Z`,
  };
}

// --- Rule 1: units that mean the same thing, and units that do not ---------

checkTrue('a unit is compatible with itself', unitsCompatible('%', '%'));
checkTrue('Celsius and Fahrenheit are one quantity', unitsCompatible('°C', '°F'));
checkTrue('millimetres and inches are one quantity', unitsCompatible('mm', 'in'));
checkTrue('litres and gallons are one quantity', unitsCompatible('L', 'gal'));
checkTrue('mS/cm and µS/cm are one quantity', unitsCompatible('mS/cm', 'µS/cm'));
check('a moisture percentage is not a centibar', unitsCompatible('%', 'cb'), false);
check('lux is not PPFD', unitsCompatible('lux', 'PPFD'), false);
check('a temperature is not a rainfall', unitsCompatible('°C', 'mm'), false);
check('an unknown unit matches only itself', unitsCompatible('fingers', 'thumbs'), false);
checkTrue('an unknown unit matches itself', unitsCompatible('fingers', 'fingers'));

check('freezing in Fahrenheit is zero Celsius', convertUnit(32, '°F', '°C'), 0);
checkClose('a hot greenhouse converts back', convertUnit(30, '°C', '°F'), 86);
checkClose('an inch of rain is 25.4mm', convertUnit(1, 'in', 'mm'), 25.4);
checkClose('a gallon of water is 3.785 litres', convertUnit(1, 'gal', 'L'), 3.785411784);
checkClose('1400 µS/cm is 1.4 mS/cm', convertUnit(1400, 'µS/cm', 'mS/cm'), 1.4);
check('a percentage refuses to become a centibar', convertUnit(40, '%', 'cb'), null);
check('lux refuses to become PPFD', convertUnit(20000, 'lux', 'PPFD'), null);
check('a unit converted to itself is untouched', convertUnit(6.4, 'pH', 'pH'), 6.4);

// The built-in unit lists are the ones the picker offers first.
check('soil moisture offers both ways of reading it', BUILT_IN_UNITS.soil_moisture, ['%', 'cb']);
check('a measurement with no built-ins offers what was recorded', unitChoices('soil_nitrogen', ['ppm', 'ppm', ' ']), ['ppm']);
check('recorded units come after the built-ins', unitChoices('soil_temperature', ['K']), ['°C', '°F', 'K']);
check('a recorded unit is not listed twice', unitChoices('humidity', ['%']), ['%']);

// --- How a figure reads ----------------------------------------------------

check('pH reads to two places', placesFor('pH'), 2);
check('EC reads to two places', placesFor('mS/cm'), 2);
check('lux reads whole', placesFor('lux'), 0);
check('a centibar reads whole', placesFor('cb'), 0);
check('a temperature reads to a tenth', placesFor('°C'), 1);
check('a temperature carries no space', formatFigure(18.44, '°C'), '18.4°C');
check('a whole temperature drops its decimal', formatFigure(18, '°C'), '18°C');
check('everything else carries a space', formatFigure(62.5, '%'), '62.5 %');
check('pH keeps both places', formatFigure(6.456, 'pH'), '6.46 pH');
check('a lux figure rounds whole', formatFigure(21499.6, 'lux'), '21500 lux');

// --- Rule 3: added up, or averaged ----------------------------------------

check('rainfall is added up', aggregateFor('rainfall'), 'total');
check('water given is added up', aggregateFor('water_given'), 'total');
check('soil temperature is averaged', aggregateFor('soil_temperature'), 'average');
check('soil pH is averaged', aggregateFor('soil_ph'), 'average');
check('a measurement the person named is averaged', aggregateFor('term_measurement_kind_1'), 'average');

const quarter = buildMonths('2026-01-01', '2026-03-31');

const tempBand = buildMeasurementBand({
  measurement: 'soil_temperature',
  label: 'Soil temperature',
  readings: [
    reading({ value: 4, measuredOn: '2026-01-05' }),
    reading({ value: 6, measuredOn: '2026-01-20' }),
    reading({ value: 12, measuredOn: '2026-03-02' }),
    reading({ value: 16, measuredOn: '2026-03-28' }),
  ],
  months: quarter,
  preferredUnit: '°C',
});
collect(tempBand.headline, ...tempBand.notes);
check('a band reads in the unit it was asked for', tempBand.unit, '°C');
check('an averaged band says so', tempBand.aggregate, 'average');
check('January averages its two readings', tempBand.months[0].figure, 5);
check('March averages its two readings', tempBand.months[2].figure, 14);
check('the headline averages the months', tempBand.headline, '9.5°C on average, from 4 readings across 2 months.');
check('a month keeps its lowest and highest', [tempBand.months[0].lowest, tempBand.months[0].highest], [4, 6]);
check(
  'an averaged band names the spread',
  tempBand.notes.includes('Each month is the average of what was read that month, and the readings ran from 4°C to 16°C.'),
  true,
);

const rainBand = buildMeasurementBand({
  measurement: 'rainfall',
  label: 'Rainfall',
  readings: [
    reading({ measurement: 'rainfall', value: 10, unit: 'mm', measuredOn: '2026-01-04' }),
    reading({ measurement: 'rainfall', value: 15, unit: 'mm', measuredOn: '2026-01-09' }),
    reading({ measurement: 'rainfall', value: 1, unit: 'in', measuredOn: '2026-02-11' }),
  ],
  months: quarter,
  preferredUnit: 'mm',
});
collect(rainBand.headline, ...rainBand.notes);
check('rainfall adds up inside a month', rainBand.months[0].figure, 25);
check('an inch of rain joins the millimetres', rainBand.months[1].figure, 25.4);
check('a totalled band says so', rainBand.aggregate, 'total');
check('the headline adds the months up', rainBand.headline, '50.4 mm in all, from 3 readings across 2 months.');
check(
  'a totalled band does not report a spread',
  rainBand.notes.some((note) => note.includes('ran from')),
  false,
);

// --- Rule 2: a blank month is a gap ---------------------------------------

check('a month with nothing measured has no figure', tempBand.months[1].figure, null);
check('a blank month draws nothing', tempBand.months[1].display, '');
check('a blank month counts no readings', tempBand.months[1].readings, 0);
check('every row is null or a figure, never a substituted zero', tempBand.rows[1].value, null);
check('a blank month is counted in words', tempBand.notes[0], 'One month is blank, because nothing was measured that month.');

const sensorBand = buildMeasurementBand({
  measurement: 'air_temperature',
  label: 'Air temperature',
  readings: [
    reading({ measurement: 'air_temperature', value: 20, measuredOn: '2026-01-05', source: 'device', deviceName: 'Tent sensor' }),
    reading({ measurement: 'air_temperature', value: 22, measuredOn: '2026-01-06', source: 'device', deviceName: 'Tent sensor' }),
  ],
  months: quarter,
  preferredUnit: '°C',
});
collect(sensorBand.headline, ...sensorBand.notes);
check(
  'where a sensor feeds it, a blank month says nothing came in',
  sensorBand.notes[0],
  '2 months are blank, because nothing came in those months.',
);

const quietBand = buildMeasurementBand({
  measurement: 'soil_ph',
  label: 'Soil pH',
  readings: [reading({ measurement: 'soil_ph', value: 6.4, unit: 'pH', measuredOn: '2026-02-14' })],
  months: quarter,
  preferredUnit: 'pH',
});
collect(quietBand.headline, ...quietBand.notes);
check('one reading is one month', quietBand.headline, '6.4 pH on average, from 1 reading in one month.');
check(
  'a single reading reports no spread it does not have',
  quietBand.notes.includes('Every reading came in at 6.4 pH.'),
  true,
);

check('a band with no readings at all is nothing to draw', buildMeasurementBand({
  measurement: 'humidity',
  label: 'Humidity',
  readings: [],
  months: quarter,
  preferredUnit: null,
}), null);

// --- Rule 1 again, where it actually bites --------------------------------

const mixedBand = buildMeasurementBand({
  measurement: 'soil_moisture',
  label: 'Soil moisture',
  readings: [
    reading({ measurement: 'soil_moisture', value: 40, unit: '%', measuredOn: '2026-01-10' }),
    reading({ measurement: 'soil_moisture', value: 50, unit: '%', measuredOn: '2026-01-24' }),
    reading({ measurement: 'soil_moisture', value: 30, unit: 'cb', measuredOn: '2026-02-02' }),
    reading({ measurement: 'soil_moisture', value: 45, unit: 'cb', measuredOn: '2026-02-20' }),
  ],
  months: quarter,
  preferredUnit: '%',
});
collect(mixedBand.headline, ...mixedBand.notes);
check('a centibar never joins a percentage', mixedBand.months[0].figure, 45);
check('the month holding only centibars stays blank', mixedBand.months[1].figure, null);
check(
  'the readings left out are counted and named',
  mixedBand.notes.includes(
    '2 readings are left out, recorded in cb, which is a different quantity from % rather than another way of writing it.',
  ),
  true,
);

const oneAside = buildMeasurementBand({
  measurement: 'light',
  label: 'Light',
  readings: [
    reading({ measurement: 'light', value: 20000, unit: 'lux', measuredOn: '2026-01-10' }),
    reading({ measurement: 'light', value: 400, unit: 'PPFD', measuredOn: '2026-01-11' }),
  ],
  months: quarter,
  preferredUnit: 'lux',
});
collect(oneAside.headline, ...oneAside.notes);
check(
  'one reading left out reads as one',
  oneAside.notes.includes(
    '1 reading is left out, recorded in PPFD, which is a different quantity from lux rather than another way of writing it.',
  ),
  true,
);

// With no preferred unit the band reads in the newest reading's unit, which
// is the unit the person has moved to.
const newestUnit = buildMeasurementBand({
  measurement: 'soil_temperature',
  label: 'Soil temperature',
  readings: [
    reading({ value: 50, unit: '°F', measuredOn: '2026-01-10' }),
    reading({ value: 12, unit: '°C', measuredOn: '2026-03-10' }),
  ],
  months: quarter,
  preferredUnit: null,
});
collect(newestUnit.headline, ...newestUnit.notes);
check('the newest reading sets the unit', newestUnit.unit, '°C');
check('the older Fahrenheit reading converts in', newestUnit.months[0].figure, 10);

// --- Rule 4: a figure is never guessed at ---------------------------------

const goodDraft = {
  plotId: 'plot1',
  plantingId: null,
  measurement: 'soil_ph',
  value: '6.4',
  unit: 'pH',
  measuredOn: '2026-09-23',
  note: '',
};
check('a complete reading saves', checkReading(goodDraft), { ok: true });
check('a reading with nothing measured is refused', checkReading({ ...goodDraft, measurement: null }), {
  ok: false,
  problem: 'Pick what you measured.',
});
check('a blank figure is refused', checkReading({ ...goodDraft, value: '   ' }), {
  ok: false,
  problem: 'Put in the figure you read.',
});
check('an unreadable figure is refused', checkReading({ ...goodDraft, value: 'about six' }), {
  ok: false,
  problem: '"about six" is not a figure this can read.',
});
check('a reading with no unit is refused', checkReading({ ...goodDraft, unit: null }), {
  ok: false,
  problem: 'Pick the unit it was read in.',
});
check('a reading with no proper date is refused', checkReading({ ...goodDraft, measuredOn: 'yesterday' }), {
  ok: false,
  problem: 'Put in the date as YYYY-MM-DD.',
});
check('a zero reading is a figure and saves', checkReading({ ...goodDraft, value: '0' }), { ok: true });
check('a reading below zero saves', checkReading({ ...goodDraft, value: '-3.5' }), { ok: true });
collect(
  checkReading({ ...goodDraft, measurement: null }).problem,
  checkReading({ ...goodDraft, value: '' }).problem,
  checkReading({ ...goodDraft, value: 'about six' }).problem,
  checkReading({ ...goodDraft, unit: null }).problem,
  checkReading({ ...goodDraft, measuredOn: 'x' }).problem,
);

// --- How long ago -----------------------------------------------------------

check('today is today', describeWhen('2026-09-23', '2026-09-23'), 'today');
check('a reading dated ahead still reads as today', describeWhen('2026-09-30', '2026-09-23'), 'today');
check('yesterday is yesterday', describeWhen('2026-09-22', '2026-09-23'), 'yesterday');
check('three days ago counts days', describeWhen('2026-09-20', '2026-09-23'), '3 days ago');
check('a week and a bit is about a week', describeWhen('2026-09-15', '2026-09-23'), 'about a week ago');
check('three weeks counts weeks', describeWhen('2026-09-02', '2026-09-23'), '3 weeks ago');
check('five weeks is about a month', describeWhen('2026-08-19', '2026-09-23'), 'about a month ago');
check('half a year counts months', describeWhen('2026-03-23', '2026-09-23'), 'about 6 months ago');
check('a year is about a year', describeWhen('2025-09-23', '2026-09-23'), 'about a year ago');
check('two years counts years', describeWhen('2024-09-23', '2026-09-23'), 'about 2 years ago');

// --- What is being measured at all ----------------------------------------

const things = describeMeasuredThings(
  [
    { measurement: 'soil_ph', label: 'Soil pH', readings: 3, lastOn: '2026-08-01', latestValue: 6.4, latestUnit: 'pH', deviceReadings: 0 },
    {
      measurement: 'air_temperature',
      label: 'Air temperature',
      readings: 40,
      lastOn: '2026-09-22',
      latestValue: 21.5,
      latestUnit: '°C',
      deviceReadings: 40,
    },
    {
      measurement: 'soil_moisture',
      label: 'Soil moisture',
      readings: 9,
      lastOn: '2026-09-20',
      latestValue: 38,
      latestUnit: '%',
      deviceReadings: 4,
    },
  ],
  '2026-09-23',
);
for (const thing of things) collect(thing.line, thing.caption);
check('the most recently measured thing comes first', things.map((thing) => thing.measurement), [
  'air_temperature',
  'soil_moisture',
  'soil_ph',
]);
check('a thing reads back its latest figure', things[0].line, 'Air temperature: 21.5°C');
check('a thing measured only by sensor says all of it came that way', things[0].caption, '40 readings, last yesterday, all from a device.');
check('a thing measured both ways counts the sensor readings', things[1].caption, '9 readings, last 3 days ago, 4 from a device.');
check('a thing measured by hand mentions no device', things[2].caption, '3 readings, last about 2 months ago.');
check('a thing knows whether a sensor fed it', things.map((thing) => thing.bySensor), [true, true, false]);

const onlyOne = describeMeasuredThings(
  [{ measurement: 'co2', label: 'CO2', readings: 1, lastOn: '2026-09-23', latestValue: 900, latestUnit: 'ppm', deviceReadings: 0 }],
  '2026-09-23',
);
collect(onlyOne[0].line, onlyOne[0].caption);
check('one reading reads as one', onlyOne[0].caption, '1 reading, last today.');

// --- Rule 5: which areas are measured -------------------------------------

const coverage = describeAreaCoverage({
  areas: [
    { id: 'plot1', name: 'Back bed' },
    { id: 'plot2', name: 'Greenhouse' },
    { id: 'plot3', name: 'Front strip' },
  ],
  readings: [
    { plotId: 'plot1', plotName: 'Back bed', measurement: 'soil_ph', measuredOn: '2026-09-20' },
    { plotId: 'plot1', plotName: 'Back bed', measurement: 'soil_moisture', measuredOn: '2026-09-22' },
    { plotId: 'plot1', plotName: 'Back bed', measurement: 'soil_moisture', measuredOn: '2026-09-23' },
    { plotId: 'plot2', plotName: 'Greenhouse', measurement: 'air_temperature', measuredOn: '2026-09-01' },
  ],
  today: '2026-09-23',
});
for (const area of coverage.measured) collect(area.line, area.caption);
collect(coverage.note);
check('the busiest area comes first', coverage.measured.map((area) => area.name), ['Back bed', 'Greenhouse']);
check('an area counts its readings and its kinds', coverage.measured[0].caption, '3 readings of 2 measurements, last today.');
check('one of each reads as one', coverage.measured[1].caption, '1 reading of 1 measurement, last 3 weeks ago.');
check('an area with nothing against it is named', coverage.unmeasured, ['Front strip']);
check('one unmeasured area is named outright', coverage.note, 'Front strip has nothing recorded against it.');

const twoUnmeasured = describeAreaCoverage({
  areas: [
    { id: 'plot1', name: 'Back bed' },
    { id: 'plot2', name: 'Greenhouse' },
    { id: 'plot3', name: 'Front strip' },
  ],
  readings: [{ plotId: 'plot1', plotName: 'Back bed', measurement: 'soil_ph', measuredOn: '2026-09-20' }],
  today: '2026-09-23',
});
collect(twoUnmeasured.note);
check('several unmeasured areas are counted', twoUnmeasured.note, '2 areas have nothing recorded against them.');

const allCovered = describeAreaCoverage({
  areas: [{ id: 'plot1', name: 'Back bed' }],
  readings: [{ plotId: 'plot1', plotName: 'Back bed', measurement: 'soil_ph', measuredOn: '2026-09-20' }],
  today: '2026-09-23',
});
collect(allCovered.note);
check('every area measured says so', allCovered.note, 'Every area has readings against it.');
check('nothing measured anywhere says so', describeAreaCoverage({ areas: [], readings: [], today: '2026-09-23' }).note, 'Nothing is measured anywhere yet.');

// A reading whose area has gone still reads back under the name it carried,
// which is why plot_name sits on the row.
const orphaned = describeAreaCoverage({
  areas: [{ id: 'plot1', name: 'Back bed' }],
  readings: [
    { plotId: 'plot1', plotName: 'Back bed', measurement: 'soil_ph', measuredOn: '2026-09-20' },
    { plotId: 'gone', plotName: 'Old tent', measurement: 'air_temperature', measuredOn: '2026-05-04' },
    { plotId: 'gone', plotName: 'Old tent', measurement: 'humidity', measuredOn: '2026-05-04' },
  ],
  today: '2026-09-23',
});
for (const area of orphaned.measured) collect(area.line, area.caption);
check('a vanished area keeps its name', orphaned.measured[0].name, 'Old tent (no longer a garden area)');
check('a vanished area holds no plot id', orphaned.measured[0].plotId, null);

const untied = describeAreaCoverage({
  areas: [{ id: 'plot1', name: 'Back bed' }],
  readings: [{ plotId: null, plotName: null, measurement: 'rainfall', measuredOn: '2026-09-23' }],
  today: '2026-09-23',
});
for (const area of untied.measured) collect(area.line, area.caption);
check('a reading tied to no area is still on the record', untied.measured[0].name, 'Not tied to an area');

// --- A reading on its own row ---------------------------------------------

check(
  'a hand reading reads back plainly',
  describeReading(reading({ value: 6.4, unit: 'pH', measuredOn: '2026-09-22' }), '2026-09-23'),
  '6.4 pH, yesterday',
);
check(
  'a named device is named',
  describeReading(
    reading({ value: 21.5, measuredOn: '2026-09-23', source: 'device', deviceName: 'Tent sensor' }),
    '2026-09-23',
  ),
  '21.5°C, today, from Tent sensor',
);
check(
  'an unnamed device still says it was one',
  describeReading(reading({ value: 21.5, measuredOn: '2026-09-23', source: 'device' }), '2026-09-23'),
  '21.5°C, today, from a device',
);
collect(
  describeReading(reading({ value: 6.4, unit: 'pH', measuredOn: '2026-09-22' }), '2026-09-23'),
  describeReading(reading({ value: 21.5, measuredOn: '2026-09-23', source: 'device', deviceName: 'Tent sensor' }), '2026-09-23'),
);

// --- The measurement list the picker offers -------------------------------

const kinds = S.MEASUREMENT_KINDS;
checkTrue('the measurement list is not empty', kinds.length > 0);
checkTrue('every measurement has a code, a label and a help line', kinds.every((kind) => kind.code && kind.label && kind.help));
check('no two measurements share a code', new Set(kinds.map((kind) => kind.code)).size, kinds.length);
checkTrue(
  'every built-in measurement has units to offer',
  kinds.every((kind) => unitChoices(kind.code).length > 0),
);
for (const kind of kinds) collect(kind.label, kind.help);

check('a reading is a record, so a measurement name is never moved', S.termSaveNote('measurement_kind').includes('reading'), true);
collect(S.termSaveNote('measurement_kind'), S.termRemovalNote('measurement_kind', 'Soil nitrogen', { current: 0, past: 4 }));
collect(S.termSaveNote('equipment_kind'), S.termRemovalNote('equipment_kind', 'Humidifier', { current: 2, past: 0 }));

// --- Rule 6: nothing here marks a garden ----------------------------------

const forbidden = [
  'you should',
  'you failed',
  'poor ',
  'too low',
  'too high',
  'ideal',
  'optimal',
  'disappointing',
  'well done',
  'good job',
  'keep it up',
  'you are behind',
  'bad ',
  'worse',
  'better than',
  'healthy range',
];
for (const sentence of everySentence) {
  for (const word of forbidden) {
    checkTrue(`"${word.trim()}" stays out of "${sentence.slice(0, 44)}"`, !sentence.toLowerCase().includes(word));
  }
}

console.log(`${passed + failed} checks, ${failed} failures`);
process.exit(failed ? 1 : 0);
