// Runs lib/gardenAreaLifecycle.ts: what has to be true before a garden
// area can be moved to Past Areas, and how a planting's status reads.
//
// Built 2026-09-21, from "the area should only be able to be removed if a
// grow currently using it is completed... this area they are removing is
// actually just a past area they were using before. Usually a person would
// want to use the information as documentation at the very least."
//
// The rules checked:
//
//  1. Four statuses, Growing first, and each reads by a plain label.
//  2. A grow is finished once its status is off growing.
//  3. The move to Past Areas is blocked while any grow is still going, and
//     the line says how many, singular or plural.
//
// Run with: node scripts/test_garden_area_lifecycle.js
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

const L = loadModule('lib/gardenAreaLifecycle.ts');
const { PLANTING_STATUS_OPTIONS, plantingStatusLabel, isFinishedPlanting, stillGrowing, pastAreaBlocker } = L;

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}`);
  }
}

// 1. Statuses.
check('four statuses', PLANTING_STATUS_OPTIONS.length === 4);
check('growing first', PLANTING_STATUS_OPTIONS[0].value === 'growing');
check('the four the column has always held', JSON.stringify(PLANTING_STATUS_OPTIONS.map((entry) => entry.value)) === JSON.stringify(['growing', 'harvested', 'failed', 'removed']));
check('removed reads as Pulled out', plantingStatusLabel('removed') === 'Pulled out');
check('harvested reads as Harvested', plantingStatusLabel('harvested') === 'Harvested');
check('an unknown status reads as itself', plantingStatusLabel('mystery') === 'mystery');

// 2. Finished.
check('growing is not finished', isFinishedPlanting({ status: 'growing' }) === false);
for (const status of ['harvested', 'failed', 'removed']) check(`${status} is finished`, isFinishedPlanting({ status }) === true);

// 3. The blocker.
const growing = { status: 'growing' };
const done = { status: 'harvested' };
check('no plantings: nothing blocks', pastAreaBlocker([]) === null);
check('all finished: nothing blocks', pastAreaBlocker([done, { status: 'failed' }]) === null);
check('one growing counts one', stillGrowing([growing, done]) === 1);
check('one growing reads singular', pastAreaBlocker([growing, done]).startsWith('1 planting is still growing here.'));
check('two growing read plural', pastAreaBlocker([growing, growing, done]).startsWith('2 plantings are still growing here.'));
check('the line says what to do', pastAreaBlocker([growing]).includes('Mark each one harvested, failed or pulled out first'));
check('the line says what is kept', pastAreaBlocker([growing]).endsWith('with everything recorded under it kept.'));

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
