// Checks lib/foodRestrictions.ts (G19): six food restrictions a person can
// hold, matched by word, category or the database's lectin score, and the
// way Check a Label and the one phrase read them.
// Run: node scripts/test_food_restrictions.js
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

const r = transpile('lib/foodRestrictions.ts', () => {
  throw new Error('foodRestrictions.ts must import nothing');
});
const fodmap = transpile('lib/fodmapLabel.ts', () => {
  throw new Error('fodmapLabel.ts must import nothing');
});
const flags = transpile('lib/ingredientFlags.ts', (name) => {
  if (name === './fodmapLabel') return fodmap;
  if (name === './foodRestrictions') return r;
  throw new Error(`ingredientFlags.ts imported ${name}`);
});
const oneWord = transpile('lib/foodOneWord.ts', (name) => {
  throw new Error(`foodOneWord.ts imported ${name}`);
});

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}
const ALL = r.FOOD_RESTRICTION_KEYS;
const keysOf = (hits) => hits.map((hit) => `${hit.key}:${hit.strength}`).join('|');

// The six, in order, and stored keys filtered
ok('six keys', ALL.join('|') === 'alpha_gal|sulfite|histamine|salicylate|nightshade|lectin', ALL.join('|'));
ok('known keeps order, drops unknown', r.knownRestrictions(['lectin', 'gone', 'sulfite']).join('|') === 'sulfite|lectin');
for (const restriction of r.FOOD_RESTRICTIONS) {
  ok(`${restriction.key} has evidence`, restriction.evidence.length > 10);
  ok(`${restriction.key} why names Profile`, /in Profile\.$/.test(restriction.why), restriction.why);
}

// Words that mean something else are skipped
const none = (text, keys = ALL) => r.restrictionHitsInText(text, keys).length === 0;
ok('sweet potato', none('sweet potato', ['nightshade']));
ok('black pepper', none('black pepper', ['nightshade']));
ok('peppercorns', none('peppercorns', ['nightshade']));
ok('vanilla bean', none('vanilla bean', ['lectin']));
ok('coffee beans', none('coffee beans', ['lectin']));
ok('soy-free', none('soy-free', ['lectin']));
ok('no added sulfites', none('no added sulfites', ['sulfite']));
ok('coconut milk', none('coconut milk', ['alpha_gal']));
ok('cream of tartar', none('cream of tartar', ['alpha_gal']));
ok('teaspoon', none('1 teaspoon salt', ['salicylate']));
ok('carrots', none('carrots, water, salt'));

// Words that are on a list
ok('potato', keysOf(r.restrictionHitsInText('potato starch', ['nightshade'])) === 'nightshade:list');
ok('bare pepper is maybe', keysOf(r.restrictionHitsInText('salt, pepper', ['nightshade'])) === 'nightshade:maybe');
ok('red pepper flakes', keysOf(r.restrictionHitsInText('red pepper flakes', ['nightshade'])) === 'nightshade:list');
ok('metabisulfite', keysOf(r.restrictionHitsInText('sodium metabisulfite', ['sulfite'])) === 'sulfite:list');
ok('E220', keysOf(r.restrictionHitsInText('preservative (E220)', ['sulfite'])) === 'sulfite:list');
ok('wine maybe sulfite', keysOf(r.restrictionHitsInText('red wine', ['sulfite'])) === 'sulfite:maybe');
ok('gelatin', keysOf(r.restrictionHitsInText('gelatin', ['alpha_gal'])) === 'alpha_gal:list');
ok('milk maybe alpha-gal', keysOf(r.restrictionHitsInText('whole milk', ['alpha_gal'])) === 'alpha_gal:maybe');
const milkMaybe = r.restrictionHitsInText('whole milk', ['alpha_gal'])[0];
ok('maybe alpha-gal is not allergy weight', milkMaybe.weight === 'intolerance');
ok('smoked', keysOf(r.restrictionHitsInText('smoked salmon', ['histamine'])) === 'histamine:list');
ok('tomato maybe histamine', keysOf(r.restrictionHitsInText('tomato', ['histamine'])) === 'histamine:maybe');
ok('cinnamon', keysOf(r.restrictionHitsInText('ground cinnamon', ['salicylate'])) === 'salicylate:list');
ok('only held ones', keysOf(r.restrictionHitsInText('tomato', ['lectin'])) === '');

// Reference foods: category and the lectin score
const wine = r.restrictionHitsForFood({ baseName: 'Merlot', category: 'Alcohol' }, ['histamine']);
ok('Alcohol category is histamine', keysOf(wine) === 'histamine:list', keysOf(wine));
const lentilsHigh = r.restrictionHitsForFood({ baseName: 'Lentils, raw', category: 'Legumes', lectinTier: 'High Risk' }, ['lectin']);
ok('High Risk scored', keysOf(lentilsHigh) === 'lectin:score' && /high for lectins/.test(lentilsHigh[0].why), keysOf(lentilsHigh));
const beansNeutral = r.restrictionHitsForFood({ baseName: 'Green beans', category: 'Veg', lectinTier: 'Neutral' }, ['lectin']);
ok('Neutral score overrides the name', keysOf(beansNeutral) === '', keysOf(beansNeutral));
const noScore = r.restrictionHitsForFood({ baseName: 'Chickpeas', category: 'Legumes' }, ['lectin']);
ok('no score falls back to the name', keysOf(noScore) === 'lectin:list', keysOf(noScore));
const mixed = r.restrictionHitsForFood({ baseName: 'Tomato soup', category: 'Mixed', lectinTier: 'Mild Risk' }, ALL);
ok('hits in list order', keysOf(mixed) === 'histamine:maybe|nightshade:list|lectin:score', keysOf(mixed));
ok('describe score', r.describeRestrictionHit(lentilsHigh[0]) === 'Low lectin: scored high risk in the food database');

// Check a Label
const label = 'Beef, water, tomato paste, salt, black pepper, sodium metabisulfite, spices';
const rows = flags.checkIngredients(label, { conditions: [], dietTags: [], allergies: [], restrictions: ['alpha_gal', 'sulfite', 'nightshade'] });
const labels = (name) => {
  const found = rows.find((row) => row.name.toLowerCase() === name);
  return found ? found.reasons.filter((reason) => reason.kind === 'restriction').map((reason) => `${reason.label}:${reason.tone}`) : [];
};
ok('beef on alpha-gal list', labels('beef').join('|') === 'On your Alpha-gal list:yours', labels('beef').join('|'));
ok('tomato paste nightshade', labels('tomato paste').includes('On your No nightshades list:yours'), labels('tomato paste').join('|'));
ok('black pepper clear', labels('black pepper').length === 0);
ok('sulfite named', labels('sodium metabisulfite').includes('On your No sulfites list:yours'));
ok('spices sometimes', labels('spices').includes('Sometimes on your No nightshades list:yours'), labels('spices').join('|'));
const heldNone = flags.checkIngredients(label, { conditions: [], dietTags: [], allergies: [] });
ok('nothing held, no restriction reasons', heldNone.every((row) => row.reasons.every((reason) => reason.kind !== 'restriction')));

// The one phrase
const base = { allergyMatch: null, trackedConditions: [], safeForConditions: [], conditionCautions: {}, dietViolations: [] };
const stop = oneWord.foodOneWord({ ...base, restrictionHits: [{ label: 'Alpha-gal', weight: 'allergy', strength: 'list' }] });
ok('alpha-gal stops', stop.tone === 'stop' && stop.phrase === 'On your Alpha-gal list', JSON.stringify(stop));
const maybe = oneWord.foodOneWord({ ...base, restrictionHits: [{ label: 'Alpha-gal', weight: 'intolerance', strength: 'maybe' }] });
ok('maybe alpha-gal does not stop', maybe.tone !== 'stop', JSON.stringify(maybe));

// Wording
const FORBIDDEN = /[–—]| -- |\b(real|genuine|genuinely|safe|unsafe|bad|good|healthy|unhealthy|avoid|toxic|dangerous|should)\b/i;
const texts = [
  r.FOOD_RESTRICTIONS_HELP,
  ...r.FOOD_RESTRICTIONS.flatMap((x) => [x.label, x.caption, x.evidence, x.why, x.maybeWhy ?? '']),
  ...[...wine, ...lentilsHigh, ...mixed].map((hit) => hit.why),
  stop.phrase,
  maybe.phrase,
];
for (const text of texts) ok(`wording: ${text}`, !FORBIDDEN.test(text));
ok('help says nothing is hidden', /Nothing is hidden/.test(r.FOOD_RESTRICTIONS_HELP));

if (failures) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log('All food restriction cases pass.');
