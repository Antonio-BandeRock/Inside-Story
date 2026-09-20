// Runs lib/compost.ts: the summary a compost pile is read through.
//
// Built 2026-09-20, from "Garden should have Compost available as a lens
// that tracks the materials added to the compost, when it was turned,
// watered, and everything else about making good compost."
//
// The rules checked:
//
//  1. Counts and day gaps come only from that pile's events; another pile's
//     turning does not reset this one.
//  2. Guidance is said only from what was recorded: no temperature line
//     without a reading, no moisture line without a check, and no balance
//     line until there are enough additions to lean one way.
//  3. The hot threshold is 131°F / 55°C, in either unit.
//  4. A finished pile gets no guidance, and a curing pile is not told to
//     turn.
//
// Run with: node scripts/test_compost.js
// Exits non-zero on any failure.

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
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('unexpected import');
  });
  return module.exports;
}

const C = loadModule('lib/compost.ts');
const {
  summarizeCompostPile, describeCompostEvent, isHotTemperature,
  COMPOST_PILE_KINDS, COMPOST_PILE_STATUSES, COMPOST_MATERIAL_CLASSES, COMPOST_MOISTURE_LEVELS,
  COMPOST_MATERIAL_SUGGESTIONS, COMPOST_EVENT_LABELS, COMPOST_TURN_INTERVALS,
} = C;

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

const pile = (over = {}) => ({
  id: 'p1', name: 'Back pile', kind: 'pile', startedOn: '2026-09-01', location: null, status: 'active', notes: null, ...over,
});
let seq = 0;
const ev = (over = {}) => ({
  id: `e${++seq}`, pileId: 'p1', occurredOn: '2026-09-02', kind: 'added', material: 'Kitchen scraps', materialClass: 'green',
  amount: null, unit: '', temperature: null, temperatureUnit: null, moisture: null, plotId: null, financeEntryId: null, note: null,
  ...over,
});
const TODAY = '2026-09-20';

// --- 1. Counting and day gaps -----------------------------------------------

const events = [
  ev({ occurredOn: '2026-09-02' }),
  ev({ occurredOn: '2026-09-03', material: 'Dead leaves', materialClass: 'brown' }),
  ev({ occurredOn: '2026-09-04', material: 'Straw', materialClass: 'brown' }),
  ev({ occurredOn: '2026-09-05', kind: 'turned', material: null, materialClass: null }),
  ev({ occurredOn: '2026-09-10', kind: 'watered', material: null, materialClass: null }),
  ev({ occurredOn: '2026-09-15', kind: 'turned', material: null, materialClass: null }),
  // Another pile's events must not count.
  ev({ pileId: 'p2', occurredOn: '2026-09-19', kind: 'turned', material: null, materialClass: null }),
  ev({ pileId: 'p2', occurredOn: '2026-09-19', material: 'Grass', materialClass: 'green' }),
];
const s = summarizeCompostPile(pile(), events, TODAY);
check('greens counted', s.greenAdditions, 1);
check('browns counted', s.brownAdditions, 2);
check('days since started', s.daysSinceStarted, 19);
check('days since the LATEST turning', s.daysSinceTurned, 5);
check('days since watered', s.daysSinceWatered, 10);
check('no temperature without a reading', s.lastTemperature, null);
check('no moisture without a check', s.lastMoisture, null);
check('balanced, recently turned, nothing to say', s.guidance, []);

// --- 2. Guidance only from what was recorded --------------------------------

const greensHeavy = summarizeCompostPile(pile(), [
  ev(), ev(), ev(), ev({ material: 'Leaves', materialClass: 'brown' }),
], TODAY);
checkTrue('more greens than browns', greensHeavy.guidance.some((line) => line.startsWith('More greens than browns')));

const twoOnly = summarizeCompostPile(pile(), [ev(), ev()], TODAY);
checkTrue('too few additions to lean', !twoOnly.guidance.some((line) => line.includes('greens')));

const brownsHeavy = summarizeCompostPile(pile(), [
  ev(), ...Array.from({ length: 4 }, () => ev({ material: 'Leaves', materialClass: 'brown' })),
], TODAY);
checkTrue('heavy on browns', brownsHeavy.guidance.some((line) => line.startsWith('Heavy on browns')));

const dry = summarizeCompostPile(pile(), [ev({ kind: 'moisture', moisture: 'dry', occurredOn: '2026-09-18' })], TODAY);
checkTrue('dry says water it', dry.guidance.some((line) => line.startsWith('Dry at the last check')));
check('last moisture kept', dry.lastMoisture, { level: 'dry', on: '2026-09-18' });

const wet = summarizeCompostPile(pile(), [ev({ kind: 'moisture', moisture: 'wet' })], TODAY);
checkTrue('wet says turn and add browns', wet.guidance.some((line) => line.startsWith('Wet at the last check')));

const neverTurned = summarizeCompostPile(pile(), [ev()], TODAY);
checkTrue('never turned after a week', neverTurned.guidance.some((line) => line.startsWith('Not turned yet')));
const young = summarizeCompostPile(pile({ startedOn: '2026-09-18' }), [ev()], TODAY);
checkTrue('a pile two days old is not nagged', !young.guidance.some((line) => line.startsWith('Not turned yet')));

const stale = summarizeCompostPile(pile(), [ev({ kind: 'turned', occurredOn: '2026-09-01' })], TODAY);
checkTrue('19 days since turned', stale.guidance.some((line) => line.startsWith('19 days since it was turned')));

// --- 3. Heat ----------------------------------------------------------------

check('hot thresholds', [isHotTemperature(131, 'f'), isHotTemperature(130, 'f'), isHotTemperature(55, 'c'), isHotTemperature(54.9, 'c')], [true, false, true, false]);
const hot = summarizeCompostPile(pile(), [ev({ kind: 'temperature', temperature: 140, temperatureUnit: 'f', occurredOn: '2026-09-19' })], TODAY);
check('last temperature kept', hot.lastTemperature, { value: 140, unit: 'f', on: '2026-09-19' });
checkTrue('hot says so', hot.guidance.some((line) => line.startsWith('Hot at the last reading')));
const cool = summarizeCompostPile(pile(), [ev(), ev(), ev(), ev({ kind: 'temperature', temperature: 30, temperatureUnit: 'c' })], TODAY);
checkTrue('cool with material says so', cool.guidance.some((line) => line.startsWith('Below 131°F')));
const coolNew = summarizeCompostPile(pile({ startedOn: '2026-09-15' }), [ev({ kind: 'temperature', temperature: 30, temperatureUnit: 'c' })], TODAY);
checkTrue('a new pile is not told it is cool', !coolNew.guidance.some((line) => line.startsWith('Below 131°F')));

// --- 4. Status --------------------------------------------------------------

const finished = summarizeCompostPile(pile({ status: 'finished' }), [ev(), ev(), ev(), ev({ kind: 'moisture', moisture: 'dry' })], TODAY);
check('finished pile gets no guidance', finished.guidance, []);
const curing = summarizeCompostPile(pile({ status: 'curing' }), [ev({ kind: 'turned', occurredOn: '2026-08-01' })], TODAY);
checkTrue('curing pile is not told to turn', !curing.guidance.some((line) => line.includes('turned')));

// --- 5. Describing an event -------------------------------------------------

check('added with amount and class', describeCompostEvent(ev({ amount: 2, unit: 'bucket' })), 'Added Kitchen scraps (2 bucket), green');
check('added other class has no class word', describeCompostEvent(ev({ material: 'Eggshells', materialClass: 'other' })), 'Added Eggshells');
check('temperature', describeCompostEvent(ev({ kind: 'temperature', temperature: 135, temperatureUnit: 'f' })), '135°F');
check('moisture', describeCompostEvent(ev({ kind: 'moisture', moisture: 'damp' })), 'Damp at a squeeze test');
check('harvested', describeCompostEvent(ev({ kind: 'harvested', amount: 1, unit: 'wheelbarrow' })), 'Took out 1 wheelbarrow of finished compost');
check('applied', describeCompostEvent(ev({ kind: 'applied' })), 'Applied to a plot');
check('turned', describeCompostEvent(ev({ kind: 'turned' })), 'Turned');
check('note', describeCompostEvent(ev({ kind: 'note', note: 'Smells sour' })), 'Smells sour');

// --- 6. Vocabulary ----------------------------------------------------------

check('five pile kinds', COMPOST_PILE_KINDS.length, 5);
check('three statuses', COMPOST_PILE_STATUSES.map((entry) => entry.code), ['active', 'curing', 'finished']);
check('three classes', COMPOST_MATERIAL_CLASSES.map((entry) => entry.code), ['green', 'brown', 'other']);
check('three moisture levels', COMPOST_MOISTURE_LEVELS.map((entry) => entry.code), ['dry', 'damp', 'wet']);
checkTrue('every suggestion has a class', COMPOST_MATERIAL_SUGGESTIONS.every((entry) => ['green', 'brown', 'other'].includes(entry.materialClass)));
check('eight event kinds labelled', Object.keys(COMPOST_EVENT_LABELS).length, 8);
check('turn intervals', COMPOST_TURN_INTERVALS, [3, 5, 7, 10, 14]);

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
