// Checks lib/shareIntake.ts, where something shared into Inside Story from
// another app goes (C11, rebuild R1): images become a Capture note with the
// photos on it, a link that reads like a recipe opens Import a Recipe, text
// and other links become a Capture note, and nothing shared is dropped for
// being the wrong kind. Also checks the desktop build swaps the package for
// a stand-in, and that Capture reads a shared note back as shared.
// Run: node scripts/test_share_intake.js
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
const s = load('lib/shareIntake.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const thing = (over) => ({ text: null, webUrl: null, images: [], title: null, ...over });

// --- links -------------------------------------------------------------------
ok('first link', s.firstLink('Look at https://example.com/a?b=1, nice') === 'https://example.com/a?b=1', s.firstLink('Look at https://example.com/a?b=1, nice'));
ok('link in brackets', s.firstLink('(https://example.com/x)') === 'https://example.com/x');
ok('no link', s.firstLink('just words') === null);
ok('no text', s.firstLink(null) === null);

// --- recipe or not -----------------------------------------------------------
for (const url of [
  'https://www.allrecipes.com/recipe/12345/lentil-soup/',
  'https://cooking.nytimes.com/recipes/1019000-dal',
  'https://www.recetasgratis.net/receta-de-sopa-de-lentejas-123.html',
  'https://www.chefkoch.de/rezepte/123/linsensuppe.html',
  'https://www.marmiton.org/recettes/recette_soupe.aspx',
  'https://www.giallozafferano.it/ricetta/zuppa',
  'https://www.matprat.no/oppskrift/linsesuppe/',
]) {
  const plan = s.planShare(thing({ text: url }));
  ok(`recipe link ${url}`, plan.kind === 'recipe' && plan.url === url, plan);
}
ok('recipe by shared words', s.planShare(thing({ text: 'Lentil soup recipe https://blog.example.com/2026/10/soup' })).kind === 'recipe');
ok('recipe by title', s.planShare(thing({ webUrl: 'https://blog.example.com/p/123', title: 'My favourite recipe' })).kind === 'recipe');
ok('Finnish word in words', s.planShare(thing({ text: 'resepti https://www.kotikokki.net/x/1/' })).kind === 'recipe');
ok('recipe link keeps the link whole', s.planShare(thing({ text: 'https://example.com/recipes/soup?serves=4' })).url === 'https://example.com/recipes/soup?serves=4');
let plan = s.planShare(thing({ text: 'https://news.example.com/story/123' }));
ok('a news link is not a recipe', plan.kind === 'capture' && plan.text === 'https://news.example.com/story/123', plan);
ok('precooked is not cooking', !s.looksLikeRecipe('https://example.com/precookedmeals', null));
ok('an unreadable link is tested as text', s.looksLikeRecipe('not a url recipe', null));

// --- text --------------------------------------------------------------------
plan = s.planShare(thing({ text: '  Call the  dentist\nabout Tuesday ' }));
ok('text becomes a capture, tidied', plan.kind === 'capture' && plan.text === 'Call the dentist about Tuesday', plan);
plan = s.planShare(thing({ text: 'https://example.com/a', title: 'A page' }));
ok('bare link with title keeps the title', plan.kind === 'capture' && plan.text === 'A page https://example.com/a', plan);
plan = s.planShare(thing({ text: 'A page https://example.com/a', title: 'A page' }));
ok('title already in the text is not repeated', plan.text === 'A page https://example.com/a', plan);
plan = s.planShare(thing({ webUrl: 'https://example.com/b' }));
ok('a web link with no text still lands', plan.kind === 'capture' && plan.text === 'https://example.com/b', plan);
ok('nothing shared is nothing', s.planShare(thing({ text: '   ' })).kind === 'nothing');

// --- images ------------------------------------------------------------------
const images = [{ uri: 'file:///cache/a.jpg', width: 1200, height: 900 }, { uri: 'file:///cache/b.jpg', width: null, height: null }];
plan = s.planShare(thing({ images }));
ok('images become photos', plan.kind === 'photos' && plan.images.length === 2 && plan.text === null, plan);
plan = s.planShare(thing({ images, text: 'https://example.com/recipes/x' }));
ok('images win over a recipe link, so no photo is lost', plan.kind === 'photos' && plan.text === 'https://example.com/recipes/x', plan);
plan = s.planShare(thing({ images: images.slice(0, 1), title: 'Receipt' }));
ok('a photo carries the title as its words', plan.text === 'Receipt', plan);

// --- wiring ------------------------------------------------------------------
const root = path.join(__dirname, '..');
const metro = fs.readFileSync(path.join(root, 'metro.config.js'), 'utf8');
ok('desktop swaps expo-share-intent', metro.includes("'expo-share-intent': 'lib/desktop/unavailableModule.ts'"));
const db = fs.readFileSync(path.join(root, 'lib', 'captureNotesDb.ts'), 'utf8');
ok('Capture reads a shared note back as shared', db.includes("row.source === 'shared'"));
const layout = fs.readFileSync(path.join(root, 'app', '(tabs)', '_layout.tsx'), 'utf8');
ok('the handler is mounted in the tabs layout', layout.includes('<ShareIntentHandler />'));
const food = fs.readFileSync(path.join(root, 'app', '(tabs)', 'food.tsx'), 'utf8');
ok('Food opens Import a Recipe from the param', food.includes("openFoodLens === 'importRecipe'") && food.includes('initialUrl={importRecipeUrl'));
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const plugin = appJson.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-share-intent');
const filters = plugin ? plugin[1].androidIntentFilters : [];
ok('Share sheet offers text and images only', JSON.stringify(filters) === JSON.stringify(['text/*', 'image/*']), filters);

if (failures) {
  console.log(`${failures} failure(s).`);
  process.exit(1);
}
console.log('All share intake checks passed.');
