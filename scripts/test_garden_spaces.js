// Runs lib/gardenSpaces.ts: the kinds of space a garden area can be.
//
// Built 2026-09-20, from "The same needs to be applied for Spaces where
// the grow might be. LED Lights, Hydroponic, and Temperature & Humidity,
// and Not Said yet are all not spaces, they are expenses."
//
// The rules checked:
//
//  1. Four built-in spaces, none of them equipment, and no placeholder.
//  2. The picker never offers a retired value, and a plot still holding
//     one reads by its old name.
//  3. A space the person named follows the built-ins, is marked as theirs,
//     and reads by its name; a built-in is not theirs.
//  4. A removed space, or no space, reads as nothing rather than throwing.
//  5. Removing a space (2026-09-21): current areas under it have to be
//     moved first, a past area keeps the row, and the replacement list
//     never offers the one being removed.
//
// Run with: node scripts/test_garden_spaces.js
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

const C = loadModule('lib/choiceOrder.ts');
const S = loadModule('lib/gardenSpaces.ts', { './choiceOrder': C });
const {
  GARDEN_SPACE_TYPES, RETIRED_GARDEN_SPACE_LABELS, gardenSpaceChoices, findGardenSpace, gardenSpaceLabel,
  isRetiredGardenSpace, replacementSpaceChoices, planSpaceRemoval,
} = S;

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL ${name}`);
  }
}

const mine = [{ id: 'space_1', name: 'Hoop house' }, { id: 'space_2', name: 'Windowsill' }];

// 1. The built-ins.
check('four built-in spaces', GARDEN_SPACE_TYPES.length === 4);
check('no equipment among the built-ins', !GARDEN_SPACE_TYPES.some((entry) => ['hydroponic', 'led_lights', 'temp_humidity_control'].includes(entry.code)));
check('no placeholder among the built-ins', !GARDEN_SPACE_TYPES.some((entry) => /not said/i.test(entry.label)));
check('a tent is still a space', GARDEN_SPACE_TYPES.some((entry) => entry.code === 'tent'));

// 2. Retired values.
const offered = gardenSpaceChoices(mine).map((entry) => entry.code);
for (const code of Object.keys(RETIRED_GARDEN_SPACE_LABELS)) {
  check(`picker does not offer ${code}`, !offered.includes(code));
  check(`${code} still reads by its old name`, gardenSpaceLabel(code, mine) === RETIRED_GARDEN_SPACE_LABELS[code]);
  check(`${code} is not found as a choice`, findGardenSpace(code, mine) === null);
}

// 3. The person's spaces.
const choices = gardenSpaceChoices(mine);
const spaceLabels = choices.map((entry) => entry.label);
check('spaces read alphabetically, theirs merged in', JSON.stringify(spaceLabels) === JSON.stringify([...spaceLabels].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))));
check('their space sits among the built-ins by name', spaceLabels.indexOf('Windowsill') === spaceLabels.length - 1 && choices.some((entry, i) => entry.mine && i < spaceLabels.length - 1));
check('their space is marked as theirs', findGardenSpace('space_1', mine).mine === true);
check('a built-in is not theirs', findGardenSpace('raised_bed', mine).mine === false);
check('their space reads by its name', gardenSpaceLabel('space_2', mine) === 'Windowsill');
check('a built-in reads by its label', gardenSpaceLabel('containers', mine) === 'Containers & Pots');
check('no custom spaces is fine', gardenSpaceChoices().length === 4);

// 4. Nothing to read.
check('a removed space reads as nothing', gardenSpaceLabel('space_gone', mine) === null);
check('no space reads as nothing', gardenSpaceLabel(null, mine) === null && gardenSpaceLabel(undefined) === null);

// 5. Removing a space.
check('current areas need a move first', JSON.stringify(planSpaceRemoval({ current: 2, past: 0 }, null)) === JSON.stringify({ ok: false, reason: 'needs_move' }));
check('moved, nothing past: the row goes', JSON.stringify(planSpaceRemoval({ current: 2, past: 0 }, 'raised_bed')) === JSON.stringify({ ok: true, keepRow: false }));
check('moved, a past area reads it: the row stays', JSON.stringify(planSpaceRemoval({ current: 1, past: 3 }, 'space_2')) === JSON.stringify({ ok: true, keepRow: true }));
check('nothing current: no move needed', JSON.stringify(planSpaceRemoval({ current: 0, past: 0 }, null)) === JSON.stringify({ ok: true, keepRow: false }));
check('only past areas: kept without a move', JSON.stringify(planSpaceRemoval({ current: 0, past: 1 }, null)) === JSON.stringify({ ok: true, keepRow: true }));
const replacements = replacementSpaceChoices('space_1', mine).map((entry) => entry.code);
check('replacements leave out the one going', !replacements.includes('space_1') && replacements.includes('space_2') && replacements.includes('raised_bed'));
check('replacements are one fewer than the list', replacements.length === gardenSpaceChoices(mine).length - 1);
check('a removed space counts as retired', isRetiredGardenSpace('space_gone', mine) === true);
check('a retired built-in counts as retired', isRetiredGardenSpace('hydroponic', mine) === true);
check('a listed space is not retired', isRetiredGardenSpace('space_1', mine) === false && isRetiredGardenSpace('tent', mine) === false);
check('no space is not retired', isRetiredGardenSpace(null, mine) === false);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
