// Runs lib/measuringPlan.ts: what is measured in each garden area, and at
// which level, and the readings grouped area by area (1.0.55.32). Then
// checks where it is wired.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. Air temperature and humidity are one figure for the area as a whole;
//     soil readings are taken for each planting; light is for each planting
//     only indoors or under lamps, since outdoors the sun lights the area.
//  2. A new area starts from a suggestion for its kind, never a verdict.
//  3. A plan row has the same id on every device, so two devices setting
//     the same thing merge into one row.
//  4. Readings group by area, then the area as a whole first and each
//     planting by name, then by measurement, newest first. Every current
//     area is listed even with nothing measured; a removed area and a
//     reading with no area are kept, never dropped.
//  5. Recording a reading or measuring the light asks for the area first,
//     and removing an area or a measurement leaves no plan row behind.
//
// Run with: node scripts/test_measuring_plan.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function run(relPath) {
  const { outputText } = ts.transpileModule(read(relPath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name === './gardenAreaNesting') return run('lib/gardenAreaNesting.ts');
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

let failures = 0;
let passes = 0;
function check(label, condition, detail) {
  if (condition) {
    passes += 1;
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `\n     ${JSON.stringify(detail)}` : ''}`);
  }
}

const M = run('lib/measuringPlan.ts');

// 1. Levels
check('air temperature for the area', M.usualScope('air_temperature', 'indoor', true) === 'area');
check('humidity for the area', M.usualScope('humidity', 'indoor', true) === 'area');
check('soil moisture per planting', M.usualScope('soil_moisture', 'outdoor', false) === 'planting');
check('soil pH per planting', M.usualScope('soil_ph', 'greenhouse', false) === 'planting');
check('light per planting under lamps', M.usualScope('light', 'indoor', true) === 'planting');
check('light for the area outdoors', M.usualScope('light', 'outdoor', true) === 'area');
check('light for the area in an unlit greenhouse', M.usualScope('light', 'greenhouse', false) === 'area');
check('a named measurement starts at the area', M.usualScope('my_thing', 'indoor', true) === 'area');

// 2. Suggestions
const indoor = M.suggestedPlan('indoor', true);
check('indoor suggestion', indoor.map((row) => row.measurement).join() === 'air_temperature,humidity,light,soil_moisture', indoor);
check('greenhouse without lamps has no light', !M.suggestedPlan('greenhouse', false).some((row) => row.measurement === 'light'));
check('greenhouse with lamps has light', M.suggestedPlan('greenhouse', true).some((row) => row.measurement === 'light'));
check('outdoor suggestion', M.suggestedPlan('outdoor', false).map((row) => row.measurement).join() === 'rainfall,soil_moisture');
check('suggestion note says starting point', /starting point for an indoor area/.test(M.suggestionNote('indoor')));

// 3. Ids and normalising
check('plan id is deterministic', M.planRowId('p1', 'humidity') === 'plan_p1_humidity');
const norm = M.normalizePlan([
  { measurement: 'humidity', scope: 'area' },
  { measurement: '', scope: 'area' },
  { measurement: 'humidity', scope: 'planting' },
]);
check('later choice wins, blanks dropped', norm.length === 1 && norm[0].scope === 'planting', norm);

// Words
const labelOf = (code) => ({ air_temperature: 'Air temperature', humidity: 'Humidity', soil_moisture: 'Soil moisture', light: 'Light' })[code] ?? code;
check('empty plan', M.planSummary([], labelOf, 'indoor') === 'Nothing set to be measured here yet');
check(
  'plan summary',
  M.planSummary(indoor, labelOf, 'indoor') ===
    'Measured here: air temperature and humidity for the room as a whole; light and soil moisture for each planting',
  M.planSummary(indoor, labelOf, 'indoor'),
);
check('planned at area level', M.plannedFor(indoor, 'area').join() === 'air_temperature,humidity');
check('planned per planting', M.plannedFor(indoor, 'planting').join() === 'light,soil_moisture');
check('scope label indoors', M.scopeLabel('area', 'indoor') === 'The room as a whole');
check('scope label outdoors', M.scopeLabel('area', 'outdoor') === 'The area as a whole');
check('where line, whole room', M.whereLine('Tent', null, 'indoor') === 'For: Tent, the room as a whole');
check('where line, planting', M.whereLine('Tent', 'Basil', 'indoor') === 'For: Tent, Basil');
check('where line, no area', M.whereLine(null, null, null) === 'For: no area in particular');

// 4. Grouping
let n = 0;
const reading = (plotId, plantingId, measurement, measuredOn, plotName = null) => ({
  id: `r${++n}`,
  plotId,
  plantingId,
  plotName,
  measurement,
  value: 1,
  unit: '%',
  measuredOn,
  source: 'hand',
  deviceName: null,
  note: null,
  createdAt: `2026-09-28T00:00:${String(n).padStart(2, '0')}Z`,
});
const areas = [
  { id: 'tent', name: 'Tent', locationType: 'indoor' },
  { id: 'bed', name: 'Bed', locationType: 'outdoor' },
  { id: 'empty', name: 'Attic', locationType: 'indoor' },
];
const plantings = [
  { id: 'basil', foodName: 'Basil' },
  { id: 'chard', foodName: 'Chard' },
];
const readings = [
  reading('tent', null, 'humidity', '2026-09-20'),
  reading('tent', 'chard', 'soil_moisture', '2026-09-21'),
  reading('tent', 'basil', 'soil_moisture', '2026-09-25'),
  reading('tent', 'basil', 'soil_moisture', '2026-09-26'),
  reading('tent', null, 'air_temperature', '2026-09-22'),
  reading('bed', null, 'rainfall', '2026-09-27'),
  reading('gone', null, 'humidity', '2026-09-01', 'Old shed'),
  reading('gone2', 'lost', 'light', '2026-08-01'),
  reading(null, null, 'rainfall', '2026-09-10'),
];
const grouped = M.groupReadingsByArea({ readings, areas, plantings, labelOf });
check(
  'area order',
  grouped.map((area) => area.name).join('|') === 'Bed|Tent|Attic|Old shed|An area since removed|No area in particular',
  grouped.map((area) => area.name),
);
check('every reading kept', grouped.reduce((sum, area) => sum + area.count, 0) === readings.length);
const tent = grouped.find((area) => area.plotId === 'tent');
check('whole room first, then plantings by name', tent.targets.map((t) => t.name).join('|') === 'The room as a whole|Basil|Chard', tent.targets.map((t) => t.name));
check('measurements by label', tent.targets[0].measurements.map((m) => m.label).join('|') === 'Air temperature|Humidity');
check('rows newest first', tent.targets[1].measurements[0].rows[0].measuredOn === '2026-09-26');
check('latest day', tent.latest === '2026-09-26');
const attic = grouped.find((area) => area.plotId === 'empty');
check('an unmeasured area is listed', attic && attic.count === 0 && attic.targets.length === 0 && !attic.removed);
const shed = grouped.find((area) => area.plotId === 'gone');
check('a removed area keeps its name and is marked', shed.removed && shed.name === 'Old shed');
const gone2 = grouped.find((area) => area.plotId === 'gone2');
check('a removed planting is named as such', gone2.targets[0].name === 'A planting since removed');
const loose = grouped[grouped.length - 1];
check('no area reads plainly', loose.plotId === null && loose.targets[0].name === 'Not tied to a planting');
check('nothing at all', M.groupReadingsByArea({ readings: [], areas: [], plantings: [], labelOf }).length === 0);

// An area inside another one (1.0.55.33): a tent in a grow room reads under
// the room, by path, and its whole is "the area", since the room is measured
// on its own.
check('a room on its own is the room', M.scopeLabel('area', 'indoor') === 'The room as a whole');
check('a tent in a room is the area', M.scopeLabel('area', 'indoor', true) === 'The area as a whole');
check('planSummary says the area for a tent', /for the area as a whole/.test(M.planSummary([{ measurement: 'humidity', scope: 'area' }], labelOf, 'indoor', true)));
const nestedGroups = M.groupReadingsByArea({
  readings: [],
  areas: [
    { id: 'tent', name: 'Tent 2', locationType: 'indoor', insidePlotId: 'room' },
    { id: 'bed', name: 'Back bed', locationType: 'outdoor', insidePlotId: null },
    { id: 'room', name: 'Grow room', locationType: 'indoor', insidePlotId: null },
  ],
  plantings: [],
  labelOf,
});
const roomAt = nestedGroups.findIndex((g) => g.plotId === 'room');
const tentAt = nestedGroups.findIndex((g) => g.plotId === 'tent');
check('a tent follows its room', tentAt === roomAt + 1);
check('a tent reads by path', nestedGroups[tentAt].name === 'Grow room › Tent 2' && nestedGroups[tentAt].depth === 1);
check('a room has depth 0', nestedGroups[roomAt].depth === 0);
check('every area still listed', nestedGroups.length === 3);

// No verdict words in anything this module says.
const words = [M.PLAN_HOW, M.suggestionNote('indoor'), M.suggestionNote('greenhouse'), M.suggestionNote('outdoor')].join(' ');
for (const bad of ['ideal', 'optimal', 'should measure', 'too low', 'too high', 'must']) {
  check(`no "${bad}"`, !words.toLowerCase().includes(bad));
}

// 5. Wiring
const lens = read('components/GrowingConditionsLens.tsx');
check('lens asks where first', /step === 'where'/.test(lens) && /Which area is this reading for\?/.test(lens));
check('Measure the Light Here goes through the where step', /onPress=\{\(\) => startReading\(true\)\}/.test(lens));
check('meter starts only after the where step', /function handleWhereNext\(\)[\s\S]{0,300}measureLight\(\)/.test(lens));
check('lens groups by area', /groupReadingsByArea\(/.test(lens) && /garden:conditions:area:/.test(lens));
check('lens offers the plan first', /plannedFor\(areaPlan/.test(lens));
check('lamp ratio kept per planting', /lampRatioKey\(draft\.plantingId \?\? draft\.plotId, source\)/.test(lens));
const garden = read('app/(tabs)/garden.tsx');
check('new area opens its plan', /setPlanStepFor\(plotId\)/.test(garden) && /<MeasuringPlanSection/.test(garden));
const db = read('lib/db.ts');
check('table exists', /CREATE TABLE IF NOT EXISTS garden_measure_plan/.test(db));
check('removing an area removes its plan', /DELETE FROM garden_measure_plan WHERE plot_id = \?/.test(db));
const setupDb = read('lib/growSetupDb.ts');
check('removing a measurement removes its plan rows', /garden_measure_plan WHERE measurement = \?/.test(setupDb));
check('sync names the plan with readings', /quiet: \['garden_measure_plan'\]/.test(read('lib/snapshotChanges.ts')));

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
