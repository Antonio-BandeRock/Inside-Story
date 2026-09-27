// Checks lib/householdFit.ts (G20): one line per person in the household on
// a recipe and a label, each against that person's conditions, allergies,
// eating style and food restrictions, and never a word that promises safety.
// Run: node scripts/test_household_fit.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function transpile(file, requireFn) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, requireFn);
  return mod.exports;
}

const restrictions = transpile('lib/foodRestrictions.ts', (name) => {
  throw new Error(`foodRestrictions.ts imported ${name}`);
});
const fodmap = transpile('lib/fodmapLabel.ts', (name) => {
  throw new Error(`fodmapLabel.ts imported ${name}`);
});
const flags = transpile('lib/ingredientFlags.ts', (name) => {
  if (name === './fodmapLabel') return fodmap;
  if (name === './foodRestrictions') return restrictions;
  throw new Error(`ingredientFlags.ts imported ${name}`);
});
const oneWord = transpile('lib/foodOneWord.ts', (name) => {
  throw new Error(`foodOneWord.ts imported ${name}`);
});
const types = transpile('lib/digest/types.ts', (name) => {
  throw new Error(`digest/types.ts imported ${name}`);
});
const fit = transpile('lib/householdFit.ts', (name) => {
  if (name === './foodOneWord') return oneWord;
  if (name === './foodRestrictions') return restrictions;
  if (name === './ingredientFlags') return flags;
  if (name === './digest/types') return types;
  throw new Error(`householdFit.ts imported ${name}`);
});

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

const emptyProfile = { trackedConditions: [], dietPreferences: [], foodAllergies: [], foodRestrictions: [] };
const you = {
  id: fit.YOU_ID,
  name: 'You',
  isYou: true,
  profile: { ...emptyProfile, trackedConditions: [{ code: 'celiac', name: 'Celiac Disease' }] },
};
const sam = { id: 'm1', name: 'Sam', isYou: false, profile: { ...emptyProfile, foodAllergies: ['peanut'] } };
const ada = { id: 'm2', name: 'Ada', isYou: false, profile: { ...emptyProfile, dietPreferences: ['Vegan'] } };
const nobody = { id: 'm3', name: 'Lee', isYou: false, profile: emptyProfile };
const nightshadeFree = { id: 'm4', name: 'Kai', isYou: false, profile: { ...emptyProfile, foodRestrictions: ['nightshade'] } };

// Possessives and names
ok('your', fit.possessiveFor(you) === 'your');
ok("Sam's", fit.possessiveFor(sam) === "Sam's");
ok('You', fit.whoFor(you) === 'You');
ok('Sam', fit.whoFor(sam) === 'Sam');

// A recipe with condition data and a diet tag
const satay = {
  dietTags: ['Omnivore'],
  safeForConditions: ['celiac'],
  conditionCautions: {},
  ingredients: [{ text: '2 tbsp peanut butter' }, { text: '300 g chicken thigh' }, { text: '1 red bell pepper' }],
};
const lines = [you, sam, ada, nobody, nightshadeFree].map((person) => fit.recipeFitFor(person, satay));
const byId = Object.fromEntries(lines.map((line) => [line.personId, line]));
ok('you fits celiac', byId.you.tone === 'fits' && byId.you.unchecked === null, JSON.stringify(byId.you));
ok('sam stops on peanut', byId.m1.tone === 'stop' && /Sam's/.test(byId.m1.phrase) && !/your/.test(byId.m1.phrase), JSON.stringify(byId.m1));
ok('ada outside vegan', byId.m2.tone !== 'fits' && /Ada's/.test(byId.m2.phrase), JSON.stringify(byId.m2));
ok('lee holds nothing', byId.m3.phrase === 'Nothing set for Lee to check against', byId.m3.phrase);
ok('kai nightshade', byId.m4.tone !== 'fits' && /Kai's/.test(byId.m4.phrase), JSON.stringify(byId.m4));
ok('who fields', lines.map((line) => line.who).join('|') === 'You|Sam|Ada|Lee|Kai');

// A recipe with no condition data and no diet tags says what was not checked
const plain = { ingredients: [{ text: 'rice' }, { text: 'water' }] };
const youPlain = fit.recipeFitFor(you, plain);
ok('unchecked conditions', youPlain.unchecked === 'Your conditions not checked for this one.', youPlain.unchecked);
ok('no condition claim when unchecked', youPlain.phrase === 'Nothing on your lists', youPlain.phrase);
const adaPlain = fit.recipeFitFor(ada, plain);
ok('unchecked diet', adaPlain.unchecked === "Ada's eating style not checked for this one.", adaPlain.unchecked);
const both = { ...ada, profile: { ...ada.profile, trackedConditions: [{ code: 'ibs', name: 'IBS' }] } };
ok(
  'unchecked both',
  fit.recipeFitFor(both, plain).unchecked === "Ada's conditions and Ada's eating style not checked for this one.",
  fit.recipeFitFor(both, plain).unchecked,
);
ok('you with nothing set', fit.recipeFitFor({ ...you, profile: emptyProfile }, plain).phrase === 'Nothing set in Profile to check against');

// A label
const label = 'Ingredients: rice flour, peanuts, salt, paprika.';
const samLabel = fit.labelFitFor(sam, label);
ok('label allergy stops', samLabel.tone === 'stop' && /^Contains one of Sam's allergies: /.test(samLabel.phrase), samLabel.phrase);
const kaiLabel = fit.labelFitFor(nightshadeFree, label);
ok('label restriction caution', kaiLabel.tone === 'caution' && /on Kai's lists: paprika/.test(kaiLabel.phrase), kaiLabel.phrase);
ok('label nothing set', fit.labelFitFor(nobody, label).phrase === 'Nothing set for Lee to check against');
const clean = fit.labelFitFor(sam, 'Ingredients: rice, water.');
ok('label clear', clean.tone === 'fits' && clean.phrase === "Nothing on Sam's lists", clean.phrase);

// oneWordFor keeps the person in the phrase
const ow = fit.oneWordFor(
  sam,
  { trackedConditions: [], safeForConditions: [], conditionCautions: {}, dietViolations: [], allergyMatch: 'peanut', restrictionHits: [] },
  { conditions: true, diet: true },
);
ok('oneWordFor owner', /Sam's/.test(ow.phrase) && ow.tone === 'stop', ow.phrase);

// No word that promises anything, anywhere this module speaks
const FORBIDDEN = /\b(safe|unsafe|bad|good for|should|must|healthy|unhealthy|real|genuine|genuinely|guarantee)\b|[–—]| -- /i;
const spoken = [
  ...lines.flatMap((line) => [line.phrase, line.unchecked ?? '']),
  youPlain.phrase,
  youPlain.unchecked,
  adaPlain.unchecked,
  samLabel.phrase,
  kaiLabel.phrase,
  clean.phrase,
];
for (const text of spoken) ok(`no verdict words: ${text}`, !FORBIDDEN.test(text), text);
ok('caption allergen-aware', /Allergen-aware, not allergy-safe/.test(fit.HOUSEHOLD_FIT_CAPTION));
ok('caption no other verdict', !FORBIDDEN.test(fit.HOUSEHOLD_FIT_CAPTION.replace('not allergy-safe', '')), fit.HOUSEHOLD_FIT_CAPTION);

if (failures) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log('test_household_fit: all checks passed');
