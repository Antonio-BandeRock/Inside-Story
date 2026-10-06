// Checks lib/chartReadout.ts: the readout beside a tapped chart dot goes on
// the far side from the navigation hand, and flips only when that side has
// no room. Run with: node scripts/test_chart_readout.js
// eslint-config-expo lints this repo as app code, which has no __dirname.
// This is a plain Node script run with node, so it does.
/* global __dirname */
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
  new Function('exports', 'module', 'require', outputText)(module.exports, module, () => {
    throw new Error('lib/chartReadout.ts must stay free of runtime imports');
  });
  return module.exports;
}

const { placeReadout, readoutWidth } = load('lib/chartReadout.ts');

let failures = 0;
function check(name, actual, expected) {
  if (actual !== expected) {
    failures += 1;
    console.log(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const base = { dotY: 60, width: 50, minX: 0, maxX: 300, minY: 0 };
check('right hand, middle dot: label on the left', placeReadout({ ...base, hand: 'right', dotX: 150 }).side, 'left');
check('left hand, middle dot: label on the right', placeReadout({ ...base, hand: 'left', dotX: 150 }).side, 'right');
check('right hand, dot at the left edge: flips right', placeReadout({ ...base, hand: 'right', dotX: 20 }).side, 'right');
check('left hand, dot at the right edge: flips left', placeReadout({ ...base, hand: 'left', dotX: 290 }).side, 'left');
const squeezed = placeReadout({ ...base, width: 280, hand: 'left', dotX: 150 });
check('too wide for either side: kept inside the chart', squeezed.x >= 0 && squeezed.x + 280 <= 300, true);
check('near the top: never above the chart', placeReadout({ ...base, hand: 'left', dotX: 150, dotY: 4 }).y >= 0, true);
check('width grows with the label', readoutWidth('120 mg') > readoutWidth('5'), true);

if (failures) {
  console.log(`${failures} failed`);
  process.exit(1);
}
console.log('chart readout: all checks passed');
