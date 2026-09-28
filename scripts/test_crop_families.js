// Runs lib/cropFamilies.ts: the crop rotation note on a new planting (I10,
// 1.0.55.24).
//
// The rules checked:
//
//  1. A crop's family comes from its crop guide; a food with no guide and a
//     perennial get no note.
//  2. Only the same area's plantings from the last three years count, and a
//     sowing still to go in (planned) does not.
//  3. Years read newest first, each once, and each crop is named once.
//  4. A family with nothing in the window reads as nothing recorded, and an
//     area with no plantings in the window gets no note at all.
//  5. The four families with a named soil problem carry it, with its source.
//  6. No dashes and no verdict words in any sentence.
//
// Run with: node scripts/test_crop_families.js
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
    if (name in deps) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const N = loadModule('lib/plantNutrients.ts');
const P = loadModule('lib/cropProblems.ts', { './plantNutrients': N });
const G = loadModule('lib/cropGuides.ts', { './plantNutrients': N, './cropProblems': P });
const F = loadModule('lib/cropFamilies.ts', { './cropGuides': G, './plantNutrients': N });

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const TODAY = '2026-09-28';
const row = (foodName, plantedAt, status = 'harvested') => ({ foodName, plantedAt, status });

// 1. Families.
check('tomato is rotated', F.rotatedCrop('Tomatoes, red, ripe, raw')?.family === 'Nightshade family');
check('a perennial is not rotated', F.rotatedCrop('Asparagus, raw') === null && F.rotatedCrop('Apples, raw') === null);
check('a food with no guide is not', F.rotatedCrop('Quinoa, cooked') === null && F.rotatedCrop('') === null);
check('no note for a perennial', F.rotationNote('Rhubarb, raw', [row('Rhubarb, raw', '2025-04-01')], TODAY) === null);

// 2. The window.
check('the window starts three years back', F.windowStart(TODAY) === '2023-09-28');
const area = [
  row('Tomatoes, red, ripe, raw', '2025-04-10'),
  row('Potatoes, flesh and skin, raw', '2024-03-20', 'failed'),
  row('Tomatoes, red, ripe, raw', '2024-05-01', 'removed'),
  row('Peppers, sweet, red, raw', '2023-05-01'),
  row('Aubergine, raw', '2026-11-01', 'planned'),
  row('Lettuce, cos or romaine, raw', '2026-03-01'),
];
const note = F.rotationNote('Potatoes, flesh and skin, raw', area, TODAY);
check('a repeat is found', note?.kind === 'repeat');
check('older than three years is left out, and a planned sowing', same(note?.years, [2025, 2024]));
check('crops named once each', same(note?.crops, ['tomatoes', 'potatoes']));
check('the sentence says what grew and when',
  note?.sentence === 'Potatoes are in the nightshade family, which grew in this area in 2025 and 2024: tomatoes and potatoes.');
check('a planting from today counts', F.rotationNote('Kale, raw', [row('Cabbage, raw', TODAY, 'growing')], TODAY)?.kind === 'repeat');
check('a planted date past today does not', F.rotationNote('Kale, raw', [row('Cabbage, raw', '2026-10-01', 'growing')], TODAY) === null);

// 3 and 4. Clear, and nothing to say.
const clear = F.rotationNote('Peas, green, raw', area, TODAY);
check('a family not grown here is clear', clear?.kind === 'clear' && clear.years.length === 0);
check('clear says nothing is recorded', clear?.sentence === 'Nothing from the pea family is recorded in this area in the last 3 years.');
check('an area with nothing in the window gets no note', F.rotationNote('Peas, green, raw', [row('Lettuce, raw', '2020-04-01')], TODAY) === null);
check('an area with only planned sowings gets no note', F.rotationNote('Peas, green, raw', [row('Lettuce, raw', '2026-10-10', 'planned')], TODAY) === null);
check('garlic reads as is', F.rotationNote('Garlic, raw', [row('Onions, raw', '2025-10-01')], TODAY)?.sentence.startsWith('Garlic is in the onion family'));

// 5. Carryover.
for (const [food, family] of [['Kale, raw', 'Cabbage family'], ['Onions, raw', 'Onion family'], ['Tomatoes, raw', 'Nightshade family'], ['Carrots, raw', 'Carrot family']]) {
  const n = F.rotationNote(food, [row(food, '2025-04-01')], TODAY);
  check(`${family} carries its soil problem`, typeof n?.carryover === 'string' && n.carryover.length > 0);
  check(`${family} cites its page`, F.rotationSources(family).length === 2 && F.rotationSources(family)[1].url.startsWith('https://www.rhs.org.uk/'));
}
check('a family with no named problem has none', F.rotationNote('Lettuce, raw', [row('Lettuce, raw', '2025-04-01')], TODAY)?.carryover === null);
check('it still cites the rotation page', same(F.rotationSources('Daisy family').map((s) => s.url), ['https://www.rhs.org.uk/vegetables/crop-rotation']));

// 6. Words.
const source = fs.readFileSync(path.join(__dirname, '..', 'lib/cropFamilies.ts'), 'utf8');
const strings = source.match(/`[^`]*`|'[^'\n]*'/g) || [];
for (const text of [...strings, F.ROTATION_WHY]) {
  check(`no verdict words: ${text}`, !/\b(must|should|ideal|optimal|avoid|never plant|do not plant|bad|wrong)\b/i.test(text));
  check(`no dashes: ${text}`, !/[–—]| -- /.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
