// Runs lib/gardenAreaNesting.ts: garden areas standing inside other areas,
// a tent in a grow room (1.0.55.33). Then checks where it is wired.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. An area reads by its path, "Grow room › Tent 2", and a loop written
//     by two devices at once never hangs or drops an area.
//  2. An area can never be put inside itself, inside anything already
//     inside it, or inside an area in Past Areas.
//  3. A list reads each area followed by the areas inside it.
//  4. An area with areas in use inside it cannot go to Past Areas, and one
//     with any area inside it is never deleted.
//  5. Record a Reading and Growing Costs can each add an area in place.
//
// Run with: node scripts/test_garden_area_nesting.js
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
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

let passed = 0;
let failed = 0;
function check(name, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${name}`);
  }
}

const N = run('lib/gardenAreaNesting.ts');

const areas = [
  { id: 'room', name: 'Grow room', insidePlotId: null },
  { id: 't1', name: 'Tent 1', insidePlotId: 'room' },
  { id: 't2', name: 'Tent 2', insidePlotId: 'room' },
  { id: 'shelf', name: 'Top shelf', insidePlotId: 't2' },
  { id: 'bed', name: 'Back bed', insidePlotId: null },
  { id: 'old', name: 'Old tent', insidePlotId: 'room', archivedAt: '2026-09-01' },
];

// 1. Paths
check('an area on its own reads plainly', N.areaPath('bed', areas) === 'Back bed');
check('a tent reads under its room', N.areaPath('t2', areas) === 'Grow room › Tent 2');
check('nesting goes deeper', N.areaPath('shelf', areas) === 'Grow room › Tent 2 › Top shelf');
check('depth counts the areas around it', N.areaDepth('shelf', areas) === 2 && N.areaDepth('room', areas) === 0);
check('a parent not in the list starts the chain', N.areaPath('x', [{ id: 'x', name: 'Loft', insidePlotId: 'gone' }]) === 'Loft');
const loop = [
  { id: 'a', name: 'A', insidePlotId: 'b' },
  { id: 'b', name: 'B', insidePlotId: 'a' },
];
check('a loop never hangs', N.areaPath('a', loop).length > 0);
check('a loop lists every area', N.nestedOrder(loop).length === 2);

// 2. Where an area may stand
check('never inside itself', !N.canStandInside('t2', 't2', areas));
check('never inside what is inside it', !N.canStandInside('room', 'shelf', areas));
check('never inside a past area', !N.canStandInside('bed', 'old', areas));
check('a new area may stand in any current one', N.canStandInside(null, 'shelf', areas));
const choices = N.insideChoices('t2', areas).map((c) => c.value);
check('choices leave out itself and its shelf', !choices.includes('t2') && !choices.includes('shelf'));
check('choices offer the room and the bed', choices.includes('room') && choices.includes('bed'));
check('choices are labelled by path', N.insideChoices(null, areas).some((c) => c.label === 'Grow room › Tent 2 › Top shelf'));
check('within finds every depth', N.areasWithin('room', areas).length === 4);

// 3. Order
const order = N.nestedOrder(areas.filter((a) => !a.archivedAt)).map((a) => a.id);
check('each area is followed by what is inside it', order.join(',') === 'room,t1,t2,shelf,bed');

// 4. Past Areas and deleting
const blocker = N.insideAreaBlocker('room', areas);
check('a room with tents in use is held back', blocker === 'Tent 1 and Tent 2 are still inside this area. Set each inside another area, or move each to Past Areas, and then this area can go there too.');
check('one tent reads as it', /^Top shelf is still inside this area\. Set it inside/.test(N.insideAreaBlocker('t2', areas) || ''));
check('a past area inside does not hold it back', N.insideAreaBlocker('room', areas.filter((a) => a.id !== 't1' && a.id !== 't2')) === null);
for (const bad of ['too many', 'wrong', 'should not', 'ideal', 'optimal', 'real', 'genuine']) {
  check(`no "${bad}"`, !(blocker + N.ON_ITS_OWN).toLowerCase().includes(bad));
}

// Wiring
const db = read('lib/db.ts');
check('column added', /ALTER TABLE garden_plots ADD COLUMN inside_plot_id TEXT/.test(db));
check('column read', /inside_plot_id AS insidePlotId/.test(db));
check('an area with areas inside it has records', /SELECT COUNT\(\*\) FROM garden_plots WHERE inside_plot_id = \?/.test(db));
const garden = read('app/(tabs)/garden.tsx');
check('areas listed nested', /nestedOrder\(plots\)\.map/.test(garden));
check('past areas check what is inside', /insideAreaBlocker\(id,/.test(garden));
check('new area form asks Inside', /insideChoices\(null, plots\)/.test(garden) && /insidePlotId: newAreaInsideId/.test(garden));
check('each area can be moved inside another', /insideChoices\(plot\.id, plots\)/.test(garden));
const lens = read('components/GrowingConditionsLens.tsx');
check('Record a Reading can add an area', /<QuickAreaForm/.test(lens) && />Add an area</.test(lens));
check('a new area is picked for the reading', /function handleAreaSaved/.test(lens));
check('Growing Costs uses the same form', /<QuickAreaForm/.test(read('components/GrowingCostsLens.tsx')));
check('quick form saves the Inside choice', /insidePlotId: insideId/.test(read('components/QuickAreaForm.tsx')));

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
