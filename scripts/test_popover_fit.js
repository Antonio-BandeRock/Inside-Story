// Checks lib/popoverFit.ts and its wiring: a PopoverSelect list widens to its
// longest option within the window, a caller's width stays a floor, a long
// option wraps rather than being cut off, and no menu row in the shared
// pickers is held to one line.
//   node scripts/test_popover_fit.js

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}
function run(rel) {
  const js = ts.transpileModule(read(rel), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, () => ({}));
  return mod.exports;
}

let failures = 0;
let passes = 0;
function check(name, ok, detail) {
  if (ok) passes += 1;
  else {
    failures += 1;
    console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  }
}

const f = run('lib/popoverFit.ts');
const m = { fontSize: 14, fontScale: 1 };
const phone = 411;

check('short options keep the old width', f.popoverListWidth(160, ['Diced', 'Sliced'], phone, m) === 160);
check('a caller width is a floor', f.popoverListWidth(220, ['Diced'], phone, m) === 220);
const long = 'Something wrong with the fruit, pods, heads or roots you eat';
const w = f.popoverListWidth(160, [long], phone, m);
check('a long option widens the list', w > 160 && w <= f.POPOVER_MAX_WIDTH, String(w));
check('never past the window', f.popoverListWidth(160, [long], 300, m) <= 300 - 24);
check('never past the window at large text', f.popoverListWidth(160, [long], phone, { fontSize: 14, fontScale: 2 }) <= phone - 24);
check('a long option wraps to a taller row', f.estimateRowHeight(long, w, m) > f.POPOVER_ROW_HEIGHT);
check('a short option keeps the row height', f.estimateRowHeight('Diced', 160, m) === f.POPOVER_ROW_HEIGHT);
check('the drawn height replaces the estimate', f.popoverListHeight([long], w, m, 6, 50, 6) === 62);
check('a long list is capped and scrolls', f.popoverListHeight(Array(40).fill('Diced'), 160, m, 6, null, 0) === 6 * f.POPOVER_ROW_HEIGHT);
check('wider text grows the estimate', f.estimateTextWidth(long, { fontSize: 14, fontScale: 1.5 }) > f.estimateTextWidth(long, m));

// Every symptom label on Horticulture fits on no more than two lines.
const symptomSource = read('lib/cropSymptoms.ts');
const labels = [...symptomSource.matchAll(/label: '([^']+)'/g)].map((x) => x[1]);
check('symptom labels found', labels.length >= 14, String(labels.length));
const sw = f.popoverListWidth(160, labels, phone, m);
for (const label of labels) {
  const lines = Math.ceil(f.estimateTextWidth(label, m) / (sw - f.POPOVER_ROW_PADDING_H * 2 - 2));
  check(`"${label}" on two lines or fewer`, lines <= 2, `${lines} lines at ${sw}`);
}

// Wiring.
const popover = read('components/PopoverSelect.tsx');
check('PopoverSelect sizes from popoverFit', /popoverListWidth\(/.test(popover) && /popoverListHeight\(/.test(popover));
check('popover drawn at the fitted width', /width: listWidth,/.test(popover));
check('rows grow rather than a fixed height', /minHeight: ROW_HEIGHT/.test(popover) && !/\n    height: ROW_HEIGHT,/.test(popover));
check('no one-line cut in PopoverSelect', !/numberOfLines/.test(popover.replace(/\/\/[^\n]*/g, '')));
check('drawn height measured', /onContentSizeChange/.test(popover));
const inline = read('components/InlineSelectList.tsx');
check('InlineSelectList options not cut to one line', !/itemTextSelected : null\]\} numberOfLines/.test(inline));

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
