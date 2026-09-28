// Checks lib/recipeConditionLine.ts, the one line across every condition
// for a person's own recipe (G26): every household condition is checked
// once, a recipe with nothing checkable never reads as a pass, a family
// member's condition is never read as ruled out just because it was not
// tracked when the recipe was saved, typed-in ingredients are counted as
// not checked, and every sentence is clear of verdicts.
// Run: node scripts/test_recipe_condition_line.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file, deps = {}) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}

// householdFit needs the diet and restriction helpers; the pieces this
// test leans on are the ones that decide the phrase.
const householdFit = {
  possessiveFor: (person) => (person.isYou ? 'your' : `${person.name}'s`),
  whoFor: (person) => (person.isYou ? 'You' : person.name),
};
const line = load('lib/recipeConditionLine.ts', { './householdFit': householdFit });

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|dangerous|avoid|diagnos\w*)\b|[–—]| -- /i;
let swept = 0;
function clean(label, text) {
  if (text == null) return;
  swept += 1;
  // "Allergen-aware, not allergy-safe" is the required wording, not a verdict.
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text.replace('not allergy-safe', '')), text);
}

function person(id, name, conditions, isYou = false) {
  return {
    id,
    name,
    isYou,
    profile: { trackedConditions: conditions, dietPreferences: [], foodAllergies: [], foodRestrictions: [] },
  };
}
const HASH = { code: 'hashimotos', name: "Hashimoto's" };
const CELIAC = { code: 'celiac', name: 'Celiac Disease' };
const GOUT = { code: 'gout', name: 'Gout' };
const you = person('you', 'You', [HASH, CELIAC], true);
const sam = person('m1', 'Sam', [GOUT, HASH]);
const noOne = person('m2', 'Ana', []);

// --- The conditions to check ------------------------------------------------
{
  const all = line.conditionsForPeople([you, sam, noOne]);
  ok('every household condition once', all.map((c) => c.code).join(',') === 'hashimotos,celiac,gout', all);
  ok('nobody tracks anything is empty', line.conditionsForPeople([noOne]).length === 0);
}

// --- Checkable and typed ----------------------------------------------------
{
  const counts = line.checkableCounts([{ foodId: '1|USDA' }, { foodId: undefined }, { foodId: '' }, { foodId: '2|UK' }]);
  ok('checkable and typed counted', counts.checkable === 2 && counts.typed === 2, counts);
  ok('no typed, no sentence', line.typedIngredientsSentence(0) === null);
  clean('one typed', line.typedIngredientsSentence(1));
  clean('several typed', line.typedIngredientsSentence(3));
  ok('several typed names the count', /^3 ingredients/.test(line.typedIngredientsSentence(3)));
  const base = { personId: 'you', who: 'You', phrase: 'Fits your lists', tone: 'fits', unchecked: null };
  ok('typed note added', line.withTypedNote(base, 1).unchecked === line.typedIngredientsSentence(1));
  ok('typed note goes after what was already said', line.withTypedNote({ ...base, unchecked: 'Your eating style not checked for this one.' }, 2).unchecked.startsWith('Your eating style'));
  ok('no typed leaves the line alone', line.withTypedNote(base, 0) === base);
}

// --- The live checks replace what was saved ----------------------------------
const checkFrom = [
  { foodId: '1|USDA', foodName: 'Wheat flour', category: 'Grain' },
  { foodId: '2|USDA', foodName: 'Spinach', category: 'Veg' },
  { foodName: 'grandmas spice mix', category: 'Other' },
];
const saved = { dietTags: ['vegan'], safeForConditions: ['hashimotos'], conditionCautions: {}, ingredients: [{ text: '2 cups flour' }] };
{
  const none = line.withLiveChecks(saved, checkFrom, null, []);
  ok('nothing checkable clears conditions, never a pass', none.safeForConditions === undefined && none.conditionCautions === undefined, none);
  ok('names include typed ingredients', none.ingredients.some((i) => i.text === 'grandmas spice mix'), none.ingredients);
  ok('saved diet tags kept', none.dietTags.join() === 'vegan');
  const live = {
    safeForConditions: ['hashimotos'],
    conditionCautions: { gout: { severity: 'yellow', note: 'Spinach carries a moderate purine load.' } },
  };
  const checked = line.withLiveChecks({ ...saved, dietTags: undefined }, checkFrom, live, ['vegetarian']);
  ok('live checks replace saved', checked.conditionCautions.gout && checked.safeForConditions.join() === 'hashimotos', checked);
  ok('worked-out diet tags stand in for none saved', checked.dietTags.join() === 'vegetarian');

  // Rows: Hashimoto's clear, Gout a caution, Celiac left out of both = ruled out.
  const youRows = line.conditionRowsFor(you, checked);
  ok('one row per condition the person tracks', youRows.length === 2, youRows);
  ok('clear condition reads as nothing flagged', youRows[0].tone === 'fits', youRows[0]);
  ok('left out of both reads as ruled out', youRows[1].tone === 'stop', youRows[1]);
  const samRows = line.conditionRowsFor(sam, checked);
  ok('a caution carries its note', samRows[0].tone === 'caution' && /purine/.test(samRows[0].text), samRows[0]);
  for (const row of [...youRows, ...samRows]) clean(`row ${row.name}`, row.text);
  ok('unchecked card has no rows', line.conditionRowsFor(you, none).length === 0);

  const fit = { personId: 'you', who: 'You', phrase: 'Not suited to Celiac Disease', tone: 'stop', unchecked: null };
  const detail = line.conditionDetailFor(you, fit, checked);
  ok('detail names each condition', /Hashimoto's/.test(detail.body) && /Celiac Disease/.test(detail.body), detail);
  clean('detail title', detail.title);
  clean('detail body', detail.body);
  const noCheck = line.conditionDetailFor(sam, { ...fit, who: 'Sam', unchecked: 'Sam\'s conditions not checked for this one.' }, none);
  ok('unchecked detail says so', /not checked/.test(noCheck.body), noCheck);
  clean('unchecked detail', noCheck.body);
  const nothingSet = line.conditionDetailFor(noOne, { ...fit, who: 'Ana' }, checked);
  ok('nothing set says so', /No conditions set for Ana/.test(nothingSet.body), nothingSet);
  clean('nothing set detail', nothingSet.body);
  clean('your nothing set', line.conditionDetailFor(person('you', 'You', [], true), fit, checked).body);
}

clean('own recipe caption', line.OWN_RECIPE_LINE_CAPTION);
clean('tap caption', line.HOUSEHOLD_TAP_CAPTION);

console.log(failures === 0 ? `test_recipe_condition_line: all passed (${swept} sentences swept)` : `test_recipe_condition_line: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
