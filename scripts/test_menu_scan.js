// Checks lib/menuScan.ts (G27): a menu split into dishes and each dish
// checked against what the person set.
// Run: node scripts/test_menu_scan.js
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
const menu = transpile('lib/menuScan.ts', (name) => {
  if (name === './ingredientFlags') return flags;
  throw new Error(`menuScan.ts imported ${name}`);
});

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

// --- Splitting -------------------------------------------------------------

const SAMPLE = `MENU
STARTERS
Garlic Shrimp
sauteed in butter, white wine and garlic   $14.50
Guacamole
avocado, lime, cilantro, tortilla chips 9

Caesar Salad
romaine, parmesan, anchovy dressing, croutons
$12

MAINS
Grilled Fish Tacos
corn tortillas, cabbage, chipotle crema  16.00
Pad Thai
rice noodles, peanuts, egg, bean sprouts, tamarind 15
Prices include tax. Please inform your server of any allergies.`;

const dishes = menu.splitMenu(SAMPLE);
const titles = dishes.map((d) => d.title);
ok('five dishes read', dishes.length === 5, JSON.stringify(titles));
ok('headings left out', !titles.some((t) => /STARTERS|MAINS|MENU/.test(t)), JSON.stringify(titles));
ok('first dish title', titles[0] === 'Garlic Shrimp', titles[0]);
ok('price taken off a description', dishes[0].description === 'sauteed in butter, white wine and garlic', dishes[0].description);
ok('price alone on a line closes a dish', titles.includes('Caesar Salad') && titles[3] === 'Grilled Fish Tacos', JSON.stringify(titles));
ok('notice line left out', !dishes.some((d) => /inform|tax/i.test(d.title + d.description)), JSON.stringify(dishes));
ok('empty text is no dishes', menu.splitMenu('').length === 0);
ok('a lone price is no dish', menu.splitMenu('$12.00\n\n9').length === 0);
ok('one typed line is one dish', menu.splitMenu('Chicken soup').length === 1);
ok('euro price', menu.splitMenu('Tortilla española 8,50 €')[0].title === 'Tortilla española', JSON.stringify(menu.splitMenu('Tortilla española 8,50 €')));

// --- Checking --------------------------------------------------------------

const none = { conditions: [], dietTags: [], allergies: [] };
const plain = menu.checkMenu(SAMPLE, none);
ok('nothing set, nothing yours', plain.every((d) => d.reasons.length === 0), JSON.stringify(plain.map((d) => d.reasons)));

const shellfish = menu.checkMenu(SAMPLE, { ...none, allergies: ['shellfish'] });
const shrimp = shellfish.find((d) => d.title === 'Garlic Shrimp');
ok('shellfish allergy touches the shrimp', shrimp && shrimp.reasons.some((r) => r.kind === 'allergy'), JSON.stringify(shrimp && shrimp.reasons));
ok('shellfish allergy leaves guacamole', shellfish.find((d) => d.title === 'Guacamole').reasons.length === 0);

const peanut = menu.checkMenu(SAMPLE, { ...none, allergies: ['peanut'] });
const pad = peanut.find((d) => d.title === 'Pad Thai');
ok('peanut allergy touches pad thai', pad && pad.reasons.some((r) => r.kind === 'allergy'), JSON.stringify(pad && pad.reasons));

const vegan = menu.checkMenu(SAMPLE, { ...none, dietTags: ['Vegan'] });
ok('vegan touches the caesar', vegan.find((d) => d.title === 'Caesar Salad').reasons.length > 0);
ok('reasons are only yours', vegan.every((d) => d.reasons.every((r) => r.tone === 'yours')));
ok('one reason per list on a dish', vegan.every((d) => new Set(d.reasons.map((r) => r.kind + r.label)).size === d.reasons.length));

const celiac = menu.checkMenu(SAMPLE, { ...none, conditions: ['celiac'] });
const caesar = celiac.find((d) => d.title === 'Caesar Salad');
ok('celiac touches croutons', caesar && caesar.reasons.some((r) => r.kind === 'gluten'), JSON.stringify(caesar && caesar.reasons));

ok('gluten dish word: croutons', caesar && caesar.reasons.some((r) => r.label === 'Usually made with wheat' && r.matched === 'croutons'));
const padCeliac = celiac.find((d) => d.title === 'Pad Thai');
ok('rice noodles are not wheat', padCeliac && !padCeliac.reasons.some((r) => r.kind === 'gluten'), JSON.stringify(padCeliac && padCeliac.reasons));
const tacos = celiac.find((d) => d.title === 'Grilled Fish Tacos');
ok('corn tortillas are not wheat', tacos && !tacos.reasons.some((r) => r.kind === 'gluten'), JSON.stringify(tacos && tacos.reasons));
ok('guacamole chips are tortilla chips: counted', celiac.find((d) => d.title === 'Guacamole').reasons.some((r) => r.kind === 'gluten') === true);
ok('dish words unused without a gluten setting', !shellfish.some((d) => d.reasons.some((r) => r.label === 'Usually made with wheat')));
ok('wheat allergy uses dish words', menu.checkMenu('Spaghetti carbonara', { ...none, allergies: ['wheat'] })[0].reasons.length > 0);
ok('flour tortilla matches', menu.findWheatDishWord('flour tortilla') !== null);
ok('gluten-free pasta does not', menu.findWheatDishWord('gluten-free pasta') === null);

// --- Words -----------------------------------------------------------------

const sentences = [
  menu.MENU_BAND_TITLE,
  menu.MENU_INTRO,
  menu.MENU_TEXT_HINT,
  menu.MENU_NO_DISHES_LINE,
  menu.MENU_NOTHING_SET_LINE,
  menu.MENU_DISH_CLEAR_LINE,
  menu.MENU_CAPTION,
  menu.describeMenuCheck([]),
  menu.describeMenuCheck(plain),
  menu.describeMenuCheck(shellfish),
  menu.describeMenuCheck(vegan),
  menu.describeMenuCheck(shellfish.slice(0, 1)),
  ...shellfish.flatMap((d) => d.reasons.map(menu.describeMenuReason)),
  ...celiac.flatMap((d) => d.reasons.flatMap((r) => [menu.describeMenuReason(r), r.why])),
];
ok('count line, one touched', menu.describeMenuCheck(shellfish) === 'Five dishes read. One names something on your lists, and four name nothing on them.', menu.describeMenuCheck(shellfish));
ok('count line, nothing touched', /None of them/.test(menu.describeMenuCheck(plain)));
ok('count line, all touched', menu.describeMenuCheck(shellfish.slice(0, 1)) === 'One dish read. One names something on your lists.', menu.describeMenuCheck(shellfish.slice(0, 1)));

const FORBIDDEN = /\b(safe to eat|is safe|are safe|guaranteed|free of|real|genuine|genuinely|healthy|unhealthy|bad for you|good for you|causes?|avoid)\b|[—–]| -- /i;
for (const sentence of sentences) ok(`no forbidden words: ${sentence}`, !FORBIDDEN.test(sentence));
ok('caption names the kitchen', /kitchen/.test(menu.MENU_CAPTION));

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log(`All menu scan checks passed (${sentences.length} sentences swept).`);
