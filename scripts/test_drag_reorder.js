/* global __dirname */
// Checks lib/dragReorder.ts, the arithmetic behind dragging a row whose
// height is its own (1.0.55.15, the exercises in a workout on Life >
// Workouts): where the held row lands, how far each neighbour slides, and
// the list after the drop.
//
// USAGE
//   node scripts/test_drag_reorder.js
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'lib/dragReorder.ts');
const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = new Module(file);
mod.filename = file;
mod._compile(out, file);
const D = mod.exports;

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.log('FAIL', label);
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Rows of 60, 120, 60, 90: middles at 30, 120, 210, 285.
const heights = [60, 120, 60, 90];
ok(D.dragTargetIndex(heights, 0, 0) === 0, 'no movement stays put');
ok(D.dragTargetIndex(heights, 0, 80) === 0, 'not yet past the tall neighbour middle');
ok(D.dragTargetIndex(heights, 0, 95) === 1, 'past the tall neighbour middle');
ok(D.dragTargetIndex(heights, 0, 5000) === 3, 'clamped at the end');
ok(D.dragTargetIndex(heights, 3, -5000) === 0, 'clamped at the start');
ok(D.dragTargetIndex(heights, 2, -30) === 2, 'a short move up stays');
ok(D.dragTargetIndex(heights, 2, -100) === 1, 'past the tall row going up');
ok(D.dragTargetIndex(heights, 1, 60) === 1, 'the tall row moves less than half a neighbour');
ok(D.dragTargetIndex(heights, 1, 100) === 2, 'the tall row passes the short one');
ok(D.dragTargetIndex([60, 60], 0, 31, 10) === 0, 'a gap is counted: not yet');
ok(D.dragTargetIndex([60, 60], 0, 71, 10) === 1, 'a gap is counted: past');
ok(D.dragTargetIndex(heights, 9, 100) === 9, 'a row not in the list is left alone');

ok(D.dragShiftFor(heights, 0, 2, 1) === -60, 'passed going down slides up by the held height');
ok(D.dragShiftFor(heights, 0, 2, 2) === -60, 'the landing row slides too');
ok(D.dragShiftFor(heights, 0, 2, 3) === 0, 'a row past the landing stays');
ok(D.dragShiftFor(heights, 3, 1, 1) === 90, 'passed going up slides down by the held height');
ok(D.dragShiftFor(heights, 3, 1, 0) === 0, 'a row above the landing stays');
ok(D.dragShiftFor(heights, 3, 1, 3) === 0, 'the held row is moved by the finger, not here');
ok(D.dragShiftFor(heights, 1, 1, 2) === 0, 'nothing slides while the row is still home');
ok(D.dragShiftFor([60, 60], 0, 1, 1, 10) === -70, 'a gap slides with the row');

ok(same(D.moveIndex(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']), 'moved down');
ok(same(D.moveIndex(['a', 'b', 'c', 'd'], 3, 1), ['a', 'd', 'b', 'c']), 'moved up');
ok(same(D.moveIndex(['a', 'b'], 0, 0), ['a', 'b']), 'dropped where it started');
ok(same(D.moveIndex(['a', 'b'], 1, 2), ['a', 'b']), 'off the end is refused');
ok(same(D.moveIndex(['a', 'b'], -1, 0), ['a', 'b']), 'before the start is refused');

console.log(`${passed} of ${passed + failed} checks pass`);
process.exit(failed === 0 ? 0 : 1);
