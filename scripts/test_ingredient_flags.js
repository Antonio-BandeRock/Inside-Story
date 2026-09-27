// Checks lib/ingredientFlags.ts (G18): every ingredient on a label, each
// with a named reason.
// Run: node scripts/test_ingredient_flags.js
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

const fodmap = transpile('lib/fodmapLabel.ts', () => {
  throw new Error('fodmapLabel.ts must import nothing');
});
const restrictions = transpile('lib/foodRestrictions.ts', () => {
  throw new Error('foodRestrictions.ts must import nothing');
});
const flags = transpile('lib/ingredientFlags.ts', (name) => {
  if (name === './fodmapLabel') return fodmap;
  if (name === './foodRestrictions') return restrictions;
  throw new Error(`ingredientFlags.ts imported ${name}`);
});

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

const none = { conditions: [], dietTags: [], allergies: [] };
function row(rows, name) {
  return rows.find((r) => r.name.toLowerCase() === name.toLowerCase());
}
function kinds(r) {
  return r ? r.reasons.map((reason) => `${reason.kind}:${reason.tone}`) : [];
}

// Splitting
const split = flags.splitIngredientList(
  'Ingredients: Enriched flour (wheat flour, niacin, reduced iron), sugar, soybean oil; contains 2% or less of: salt, natural flavor, soy lecithin. Contains: Wheat, Soy.',
);
ok(
  'split names',
  split.map((s) => s.name).join('|') === 'Enriched flour|sugar|soybean oil|salt|natural flavor|soy lecithin|Contains: Wheat, Soy',
  JSON.stringify(split.map((s) => s.name)),
);
ok('split parts', split[0].parts.join('|') === 'wheat flour|niacin|reduced iron', JSON.stringify(split[0].parts));
ok('decimal kept', flags.splitIngredientList('water, vinegar (5.5% acidity), salt').length === 3);

// Nothing matched says so, never "safe"
const plain = flags.checkIngredients('water, salt, carrots', none);
ok('carrots nothing', row(plain, 'carrots').reasons.length === 0);
ok('no-reason line', !/safe/i.test(flags.NO_REASON_LINE));

// Allergen notes for anybody, and yours when declared
const cookie = flags.checkIngredients(
  'wheat flour, butter, eggs, almonds, sesame seeds, cocoa butter, coconut milk, celery salt',
  none,
);
ok('wheat allergen note', kinds(row(cookie, 'wheat flour')).includes('allergen:note'));
ok('butter is milk', kinds(row(cookie, 'butter')).includes('allergen:note'));
ok('cocoa butter is not milk', !kinds(row(cookie, 'cocoa butter')).some((k) => k.startsWith('allergen')), JSON.stringify(row(cookie, 'cocoa butter')));
ok('coconut milk is not milk', !kinds(row(cookie, 'coconut milk')).some((k) => k.startsWith('allergen')), JSON.stringify(row(cookie, 'coconut milk')));
ok('celery EU', row(cookie, 'celery salt').reasons.some((r) => /EU/.test(r.label)));
const allergic = flags.checkIngredients('wheat flour, almonds, sesame seeds, kiwi', { ...none, allergies: ['tree nuts', 'Sesame', 'kiwi'] });
ok('tree nut yours', kinds(row(allergic, 'almonds')).includes('allergy:yours'));
ok('sesame yours', kinds(row(allergic, 'sesame seeds')).includes('allergy:yours'));
ok('own-word allergy', kinds(row(allergic, 'kiwi')).includes('allergy:yours'));
ok('yours sorted first', row(allergic, 'almonds').reasons[0].tone === 'yours');
ok('free claim skipped', flags.checkIngredients('gluten-free oats', none)[0].reasons.every((r) => r.kind !== 'gluten'));

// Gluten
const bread = flags.checkIngredients('flour, rice flour, barley malt, oats', { ...none, conditions: ['celiac'] });
ok('flour alone is wheat', kinds(row(bread, 'flour')).includes('gluten:yours'));
ok('rice flour not gluten', !kinds(row(bread, 'rice flour')).includes('gluten:yours'), JSON.stringify(row(bread, 'rice flour')));
ok('malt gluten', kinds(row(bread, 'barley malt')).includes('gluten:yours'));
ok('oats unclear yours', kinds(row(bread, 'oats')).includes('unclear:yours'));
ok('gluten note for anybody', kinds(row(flags.checkIngredients('rye', none), 'rye')).includes('gluten:note'));

// Diets
const vegan = flags.checkIngredients('sugar, gelatin, honey, natural flavor, mono- and diglycerides', {
  ...none,
  dietTags: ['Vegan', 'Vegetarian'],
});
ok('gelatin vegan', kinds(row(vegan, 'gelatin')).includes('diet:yours'));
ok('vegan not told twice', row(vegan, 'gelatin').reasons.filter((r) => r.kind === 'diet').length === 1);
ok('honey vegan', kinds(row(vegan, 'honey')).includes('diet:yours'));
ok('flavor unclear yours for vegan', kinds(row(vegan, 'natural flavor')).includes('unclear:yours'));
ok('glycerides unclear', kinds(row(vegan, 'mono- and diglycerides')).includes('unclear:yours'), JSON.stringify(vegan.map((r) => r.name)));
ok('no diet, no diet reason', !kinds(row(flags.checkIngredients('gelatin', none), 'gelatin')).some((k) => k.startsWith('diet')));
const aip = flags.checkIngredients('sweet potato, potato, paprika, black pepper', { ...none, dietTags: ['AIP'] });
ok('sweet potato fine on AIP', !kinds(row(aip, 'sweet potato')).includes('diet:yours'), JSON.stringify(row(aip, 'sweet potato')));
ok('potato AIP', kinds(row(aip, 'potato')).includes('diet:yours'));
ok('paprika AIP', kinds(row(aip, 'paprika')).includes('diet:yours'));
const microbial = flags.checkIngredients('microbial rennet', { ...none, dietTags: ['Vegetarian'] });
ok('microbial rennet not meat', !kinds(microbial[0]).includes('diet:yours'), JSON.stringify(microbial));

// FODMAP and histamine
const sauce = flags.checkIngredients('tomatoes, garlic, onion, soy sauce, vinegar', { ...none, conditions: ['ibs'] });
ok('garlic fodmap yours', kinds(row(sauce, 'garlic')).includes('fodmap:yours'), JSON.stringify(row(sauce, 'garlic')));
ok('fodmap reading for ibs', (row(sauce, 'garlic').reasons.find((r) => r.kind === 'fodmap') || {}).readingId === 'ibs-low-fodmap-diet');
ok('soy sauce histamine note', kinds(row(sauce, 'soy sauce')).includes('histamine:note'));
ok('tomato liberator note', row(sauce, 'tomatoes').reasons.some((r) => /liberator/.test(r.label)));
ok('fodmap note without ibs', kinds(row(flags.checkIngredients('garlic', none), 'garlic')).includes('fodmap:note'));

// Injected additive and condition checks
const injected = flags.checkIngredients('carrageenan, xanthan gum', {
  ...none,
  conditions: ['hashimotos'],
  additiveFlagsFor: (t) =>
    /carrageenan/.test(t)
      ? [{ severity: 'yellow', label: 'Carrageenan', matchedText: 'carrageenan', detail: 'd', digestEntryId: 'x' }]
      : /xanthan/.test(t)
        ? [{ severity: 'info', label: 'Xanthan gum', matchedText: 'xanthan gum', detail: 'd' }]
        : [],
  conditionFlagsFor: (t) =>
    /carrageenan/.test(t) ? [{ conditionCode: 'hashimotos', label: 'Carrageenan', matchedText: 'carrageenan', detail: 'd' }] : [],
  conditionName: () => "Hashimoto's",
});
ok('yellow additive is look', kinds(injected[0]).includes('additive:look'));
ok('condition yours', injected[0].reasons[0].kind === 'condition' && /Hashimoto's/.test(injected[0].reasons[0].label));
ok('info additive is note', kinds(injected[1]).includes('additive:note'));

// Summary sentence
ok('empty summary', flags.describeIngredientCheck([]) === 'No ingredients to check yet.');
const summary = flags.describeIngredientCheck(allergic);
ok('summary counts', summary.startsWith('Four ingredients checked.') && /touch something you set in Profile/.test(summary), summary);

// Wording sweep over everything the person reads, except the caption,
// which has to say "allergy-safe" to deny it.
const FORBIDDEN = /[–—]| -- |\b(real|genuine|genuinely|safe|unsafe|bad|good|healthy|unhealthy|avoid|toxic|dangerous|should)\b/i;
const everything = [sauce, vegan, aip, allergic, bread, cookie, injected, plain].flat();
const texts = [
  flags.NO_REASON_LINE,
  ...flags.INGREDIENT_CHECK_SOURCES,
  flags.describeIngredientCheck(everything),
  flags.describeIngredientCheckSpoken(everything),
  ...everything.flatMap((r) => r.reasons.flatMap((reason) => [reason.label, reason.why])),
];
// The FDA's Bad Bug Book is a title, not a verdict.
for (const text of texts) ok(`wording: ${text}`, !FORBIDDEN.test(text.replace('Bad Bug Book', '')));
ok('caption says allergen-aware', /^Allergen-aware, not allergy-safe\./.test(flags.INGREDIENT_CHECK_CAPTION));
ok('caption dashes', !/[–—]| -- /.test(flags.INGREDIENT_CHECK_CAPTION));

if (failures) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log('All ingredient check cases pass.');
