// Checks lib/energyBand.ts (G37): the calorie range and macro split are off
// unless chosen, the lean picks the half of a pool nearer what is left of
// the range and never leans toward less food for celiac disease or IBD, the
// macro split adds to about 100 and leaves carbohydrate out of its check when
// a carb level is set, and every sentence is swept for verdict words.
// Run: node scripts/test_energy_band.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const eb = load('lib/energyBand.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|good|should|must|healthy|unhealthy|real|genuine|genuinely|best|optimal|ideal|too much|too little|enough|excess\w*|great|well done|dangerous|diagnos\w*|better|worse|overeat\w*|undereat\w*)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  // The under-eating note names the risk for celiac disease and IBD in
  // those words on purpose; it describes the conditions, not the person.
  ok(`${label} has no verdict words`, !FORBIDDEN.test(text.replace('eating too little is often the larger risk', 'eating less is often the larger risk')), text);
}

// --- Off by default ---------------------------------------------------------------
ok('ENERGY_OFF is off', !eb.energySettingOn(eb.ENERGY_OFF));
ok('no lines when off', eb.energyLines({ energy_kcal: 2000 }, eb.ENERGY_OFF, false).length === 0);
ok('no lines when absent', eb.energyLines({ energy_kcal: 2000 }, undefined, false).length === 0);
ok('first choice is Off', eb.kcalChoiceLabels()[0] === eb.KCAL_OFF_LABEL);
ok('Off parses to null', eb.kcalRangeFromLabel(eb.KCAL_OFF_LABEL) === null);
for (const range of eb.KCAL_RANGE_CHOICES) {
  const label = eb.kcalRangeLabel(range);
  ok(`label round trips ${label}`, JSON.stringify(eb.kcalRangeFromLabel(label)) === JSON.stringify(range));
  clean('range label', label);
}
ok('1,800 to 2,100 label', eb.kcalRangeLabel({ min: 1800, max: 2100 }) === '1,800 to 2,100 kcal');

// --- Under-eating -------------------------------------------------------------------
ok('no note without celiac or IBD', eb.underEatingNote(['hashimotos', 'gout']) === null);
ok('lighter allowed without them', eb.mayLeanLighter(['hashimotos']));
ok('lighter not allowed with celiac', !eb.mayLeanLighter(['celiac']));
ok('lighter not allowed with IBD', !eb.mayLeanLighter(['hashimotos', 'ibd']));
const oneNote = eb.underEatingNote(['celiac']);
const twoNote = eb.underEatingNote(['ibd', 'celiac']);
ok('one condition named', /celiac disease/.test(oneNote) && / it can make/.test(oneNote), oneNote);
ok('two conditions named', /IBD and celiac disease/.test(twoNote) && / both can make/.test(twoNote), twoNote);
ok('note names a clinician', /gastroenterologist or a dietitian/.test(oneNote));
clean('one note', oneNote);
clean('two note', twoNote);
clean('kcal caption', eb.KCAL_CAPTION);
clean('macro caption', eb.MACRO_CAPTION);
ok('kcal caption names a clinician', /doctor or a dietitian/.test(eb.KCAL_CAPTION));

// --- The lean ---------------------------------------------------------------------
const range = { min: 1800, max: 2100 };
ok('target over three meals', eb.mealEnergyTarget(range, 0, 3) === 650);
ok('target after 800 over two', eb.mealEnergyTarget(range, 800, 2) === 575);
ok('target never below zero', eb.mealEnergyTarget(range, 5000, 1) === 0);
ok('no target with no range', eb.mealEnergyTarget(null, 0, 3) === null);
ok('no target with no meals left', eb.mealEnergyTarget(range, 0, 0) === null);

const pool = [200, 350, 500, 650, 800, 950].map((kcal) => ({ kcal }));
const kcalOf = (d) => d.kcal;
const near650 = eb.leanTowardEnergy(pool, kcalOf, 650, true).map(kcalOf).sort((a, b) => a - b);
ok('half nearer 650', JSON.stringify(near650) === JSON.stringify([500, 650, 800]), near650);
const near250 = eb.leanTowardEnergy(pool, kcalOf, 250, true).map(kcalOf).sort((a, b) => a - b);
ok('lighter lean when allowed', JSON.stringify(near250) === JSON.stringify([200, 350, 500]), near250);
ok('no lighter lean for celiac or IBD', eb.leanTowardEnergy(pool, kcalOf, 250, false).length === pool.length);
const near900 = eb.leanTowardEnergy(pool, kcalOf, 900, false).map(kcalOf).sort((a, b) => a - b);
ok('heavier lean still allowed for celiac or IBD', JSON.stringify(near900) === JSON.stringify([650, 800, 950]), near900);
ok('no target leaves pool', eb.leanTowardEnergy(pool, kcalOf, null, true).length === pool.length);
ok('one dish left as is', eb.leanTowardEnergy([{ kcal: 100 }], kcalOf, 900, true).length === 1);
ok('empty pool left as is', eb.leanTowardEnergy([], kcalOf, 900, true).length === 0);

// --- What the day says ---------------------------------------------------------------
const kcalOnly = { kcal: range, macros: false };
const within = eb.energyLines({ energy_kcal: 1950 }, kcalOnly, false);
ok('within line', within.length === 1 && /1,950 kcal, within the 1,800 to 2,100 kcal you chose/.test(within[0]), within);
const under = eb.energyLines({ energy_kcal: 1500 }, kcalOnly, false);
ok('under line', /300 under the 1,800 to 2,100 kcal you chose/.test(under[0]), under);
const over = eb.energyLines({ energy_kcal: 2350 }, kcalOnly, false);
ok('over line', /250 over the 1,800 to 2,100 kcal you chose/.test(over[0]), over);
const noFigure = eb.energyLines({}, kcalOnly, false);
ok('no figure line', /could not be checked/.test(noFigure[0]), noFigure);
[within, under, over, noFigure].flat().forEach((line) => clean('kcal line', line));

const shares = eb.macroShares({ protein: 100, fat_total: 70, carbohydrate: 225 });
ok('shares add to about 100', Math.abs(shares.protein + shares.fat + shares.carbohydrate - 100) <= 2, shares);
ok('shares values', shares.protein === 21 && shares.fat === 33 && shares.carbohydrate === 47, shares);
ok('no shares with nothing', eb.macroShares({}) === null);

const macrosOnly = { kcal: null, macros: true };
const inRange = eb.energyLines({ protein: 100, fat_total: 70, carbohydrate: 225 }, macrosOnly, false);
ok('split within ranges says only the split', inRange.length === 1 && /protein 21%, fat 33%, carbohydrate 47%/.test(inRange[0]), inRange);
const lowCarb = { protein: 120, fat_total: 120, carbohydrate: 60 };
const outside = eb.energyLines(lowCarb, macrosOnly, false);
ok('fat above and carbohydrate below named', outside.some((l) => /^Fat at \d+% sits above the 20 to 35% range\.$/.test(l)) && outside.some((l) => /^Carbohydrate at \d+% sits below the 45 to 65% range\.$/.test(l)), outside);
const carbSet = eb.energyLines(lowCarb, macrosOnly, true);
ok('carb level leaves carbohydrate out', !carbSet.some((l) => /^Carbohydrate at/.test(l)) && carbSet.some((l) => /left out of the range check/.test(l)), carbSet);
const noMacros = eb.energyLines({}, macrosOnly, false);
ok('no macro figures line', /could not be worked out/.test(noMacros[0]), noMacros);
const both = eb.energyLines({ energy_kcal: 1950, protein: 100, fat_total: 70, carbohydrate: 225 }, { kcal: range, macros: true }, false);
ok('both give kcal then split', both.length === 2 && /kcal/.test(both[0]) && /^Energy from/.test(both[1]), both);
[inRange, outside, carbSet, noMacros, both].flat().forEach((line) => clean('macro line', line));

console.log(`${failures === 0 ? 'PASS' : 'FAIL'} energy band: ${swept} sentences swept, ${failures} failure${failures === 1 ? '' : 's'}`);
if (failures > 0) process.exit(1);
