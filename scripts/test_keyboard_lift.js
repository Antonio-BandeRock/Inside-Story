// Checks the arithmetic behind keeping a focused field clear of AppKeyboard
// (lib/keyboardLift.ts). Pure maths, so it runs here rather than needing a
// phone: the thing a phone has to answer is whether the line LOOKS right, not
// whether the sums do.
//
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

const { computeNextLift, FIELD_GAP } = load('lib/keyboardLift.ts');

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

// A representative phone: content ends at 800, the keyboard's top edge lands at
// 440, so everything below 440 is hidden behind the keys.
const KEYBOARD_TOP = 440;
const lift = (currentLift, fieldBottomY) =>
  computeNextLift({ currentLift, fieldBottomY, keyboardTopY: KEYBOARD_TOP });

// --- 1. A field that is already visible is left alone -----------------------

check('a field well above the keyboard does not move the screen', lift(0, 300), null);
check('a field exactly on the line still moves, by the gap', lift(0, KEYBOARD_TOP), FIELD_GAP);
check('a field one pixel short of needing it is left alone', lift(0, KEYBOARD_TOP - FIELD_GAP), null);

// --- 2. A covered field is lifted by exactly what it was short --------------

check('a field 60 under the line lifts by 60 plus the gap', lift(0, 500), 72);
check('and lands clear of the keyboard', 500 - 72 + FIELD_GAP <= KEYBOARD_TOP, true);
check('a field at the very bottom lifts the whole way', lift(0, 790), 362);
check('which still leaves it on screen', 790 - 362, 428);

// --- 3. It settles rather than creeping -------------------------------------
// The second reading of a field is taken while the screen is ALREADY lifted, so
// it reports the field's new position. Re-lifting from there must be a no-op,
// or every re-measure would shove the screen further up.

check('re-measuring a field already lifted changes nothing', lift(72, 500 - 72), null);
check('re-measuring the bottom-most field changes nothing', lift(362, 790 - 362), null);

// --- 4. Moving between fields while lifted ----------------------------------
// The regression this guards: a second field's measurement already has the
// current lift baked into it. Treating it as a fresh, unlifted number would
// double-count and throw the screen too far up.

check('a lower field, measured while lifted, adds only what it still needs', lift(72, 600 - 72), 172);
check('and lands in the same place as if it had been focused first', lift(0, 600), 172);
check('a higher field lowers the screen again', lift(72, 200 - 72), 0);
check('a field just clear of the line lowers the screen fully', lift(72, 300 - 72), 0);

// --- 5. Refusals ------------------------------------------------------------

check('never lifted past the keyboard top, whatever is measured', lift(0, 99999), KEYBOARD_TOP);
check('never lifted to a negative amount', lift(0, -500), null);
check('a keyboard line of zero cannot produce a lift', computeNextLift({ currentLift: 0, fieldBottomY: 100, keyboardTopY: 0 }), null);

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
