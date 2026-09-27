// Checks the FODMAP ingredient caution on a scanned product's label (added
// beside G23 of the competitive build plan, 2026-09-26): whole-word
// matching, plant milks and "-free" claims not read as what they are free
// of, one mention per ingredient, presence only, and no verdict words.
// Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const F = load('lib/fodmapLabel.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}
const groups = (text) => F.findFodmapIngredients(text).map((m) => m.group);
const found = (text) => F.findFodmapIngredients(text).map((m) => m.found);

check('empty', F.findFodmapIngredients('  '), []);
check('nothing', groups('Water, salt, olive oil, black pepper'), []);
check('garlic and onion powder', found('Tomatoes, onion powder, salt, garlic'), [['onion', 'garlic']]);
check('groups in fixed order', groups('Honey, wheat flour, sorbitol, milk, lentils'), ['fructans', 'gos', 'lactose', 'fructose', 'polyols']);
check('buckwheat is not wheat', groups('Buckwheat flour, water'), []);
check('honeydew is not honey', groups('Honeydew melon'), []);
check('maltose is not maltitol', groups('Maltose, rice'), []);
check('coconut milk is not milk', groups('Coconut milk, guar gum'), []);
check('oat milk is not milk', groups('Oat milk (water, oats)'), []);
check('cow milk still milk', found('Whole milk, sugar'), [['whole milk']]);
check('lactose-free', groups('Lactose-free milk'), []);
check('wheat free', groups('Wheat free, corn starch'), []);
check('longer phrase once', found('High fructose corn syrup, water'), [['high fructose corn syrup']]);
check('chicory root fibre once', found('Chicory root fibre, cocoa'), [['chicory root fibre']]);
check('E number polyol', found('Sweetener (E420), gelatin'), [['e420']]);
check('case kept lower', found('GARLIC, ONIONS'), [['garlic', 'onions']]);

check('show for ibs', F.showsFodmapCard(['hashimotos', 'ibs']), true);
check('show for ibd', F.showsFodmapCard(['ibd']), true);
check('hidden otherwise', F.showsFodmapCard(['hashimotos', 'celiac']), false);

const m = F.findFodmapIngredients('Garlic, honey');
check('line', F.describeFodmapLine(m[0]), 'Fructans: garlic');
check('spoken', F.describeFodmapSpoken(m), 'FODMAP ingredients on the label, with no amounts given. Fructans: garlic. Fructose in excess of glucose: honey.');

const FORBIDDEN = /\b(safe|unsafe|avoid|great|good|bad|ideal|optimal|should|must|healthy|unhealthy|real|genuine|genuinely|own|low fodmap|high fodmap)\b|[–—]| -- /i;
const samples = [F.describeFodmapCaption([]), F.describeFodmapCaption(m), F.describeFodmapSpoken([]), F.describeFodmapSpoken(m)];
for (const line of samples) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);
check('caption names amounts', /amount/.test(F.describeFodmapCaption(m)), true);

console.log(`${total - failures}/${total} checks passed`);
if (failures > 0) process.exit(1);
