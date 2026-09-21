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
//
// Run with: node scripts/test_garden_spaces.js
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

const S = loadModule('lib/gardenSpaces.ts');
const { GARDEN_SPACE_TYPES, RETIRED_GARDEN_SPACE_LABELS, gardenSpaceChoices, findGardenSpace, gardenSpaceLabel } = S;

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
check('built-ins come first', choices.slice(0, 4).every((entry) => !entry.mine));
check('their spaces follow in order', choices[4].code === 'space_1' && choices[5].code === 'space_2');
check('their space is marked as theirs', findGardenSpace('space_1', mine).mine === true);
check('a built-in is not theirs', findGardenSpace('raised_bed', mine).mine === false);
check('their space reads by its name', gardenSpaceLabel('space_2', mine) === 'Windowsill');
check('a built-in reads by its label', gardenSpaceLabel('containers', mine) === 'Containers & Pots');
check('no custom spaces is fine', gardenSpaceChoices().length === 4);

// 4. Nothing to read.
check('a removed space reads as nothing', gardenSpaceLabel('space_gone', mine) === null);
check('no space reads as nothing', gardenSpaceLabel(null, mine) === null && gardenSpaceLabel(undefined) === null);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
