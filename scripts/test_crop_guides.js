// Runs lib/cropGuides.ts and lib/plantNutrients.ts: how to grow each crop,
// and how to read a plant's leaves for a nutrient shortage.
//
// Built 2026-09-26, from "In the Garden tab, there needs to be information
// about how to grow each thing, what type of soil it likes, what
// deficiencies of nutrients look like and how to fix it based on real world
// gardening advice they can be pointed to, like PubMed, outside of the
// device."
//
// The rules checked:
//
//  1. Every crop and nutrient has every field filled, a pH range whose low
//     end is below its high end and inside 4 to 8.5, and at least one
//     source besides PubMed, every source an https link.
//  2. Keys are unique, and no alias belongs to two crops.
//  3. Every "watch for" that names a nutrient names one that exists.
//  4. A planting's food name finds its crop, and a food that only shares a
//     word with a crop (black pepper, a gumbo, cornflakes) finds nothing.
//  5. Search needs every word to match.
//  6. No dash in place of punctuation and none of the filler words in any
//     text a person reads.
//  7. With --links, every source URL answers 200. Slow and needs the
//     network, so it is off by default.
//
// Run with: node scripts/test_crop_guides.js [--links]
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
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const N = loadModule('lib/plantNutrients.ts');
const P = loadModule('lib/cropProblems.ts', { './plantNutrients': N });
const G = loadModule('lib/cropGuides.ts', { './plantNutrients': N, './cropProblems': P });

// Words that belong only in insteadOf and whyNotChemical, where the app
// says why to skip them, never in the fix or in how to grow a crop.
const CHEMICAL = /chelat|general fertili[sz]er|Growmore|ammonium|urea|superphosphate|NPK|fungicide|pesticide|Epsom|sulphate of/i;
const PUBMED = 'https://pubmed.ncbi.nlm.nih.gov/?term=';

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected ${JSON.stringify(expected)}\n      got      ${JSON.stringify(actual)}`);
  }
}
function ok(label, condition) {
  check(label, !!condition, true);
}

// 1. Fields.
const CROP_TEXT = ['key', 'name', 'latin', 'family', 'group', 'season', 'sun', 'soil', 'feeding', 'sow', 'spacing', 'ready', 'water', 'grow'];
for (const guide of G.CROP_GUIDES) {
  for (const field of CROP_TEXT) ok(`${guide.key}.${field} filled`, typeof guide[field] === 'string' && guide[field].trim().length > 0);
  ok(`${guide.key} pH low below high`, guide.ph[0] < guide.ph[1]);
  ok(`${guide.key} pH inside 4 to 8.5`, guide.ph[0] >= 4 && guide.ph[1] <= 8.5);
  ok(`${guide.key} has a source`, guide.sources.length > 0);
  ok(`${guide.key} group labelled`, !!G.CROP_GROUP_LABELS[guide.group]);
  ok(`${guide.key} feeding labelled`, !!G.FEEDING_LABELS[guide.feeding]);
  ok(`${guide.key} season labelled`, !!G.SEASON_LABELS[guide.season]);
  const all = G.cropSources(guide);
  ok(`${guide.key} ends with PubMed`, all[all.length - 1].url.startsWith(PUBMED));
  for (const source of all) ok(`${guide.key} source https: ${source.url}`, source.url.startsWith('https://') && source.label.trim().length > 0);
  const outside = all.filter((source) => !source.url.startsWith(PUBMED));
  ok(`${guide.key} has at least 3 sources besides PubMed (${outside.length})`, outside.length >= 3);
  ok(`${guide.key} has 2 PubMed searches`, all.length - outside.length === 2);
  ok(`${guide.key} has a page about this crop`, guide.sources.length + (P.CROP_ORGANIC_SOURCES[guide.key] ?? []).length >= 2);
  ok(`${guide.key} listed in CROP_ORGANIC_SOURCES`, Array.isArray(P.CROP_ORGANIC_SOURCES[guide.key]));
  for (const field of ['sun', 'soil', 'sow', 'water', 'grow']) ok(`${guide.key}.${field} names no chemical`, !CHEMICAL.test(guide[field]));
}
const NUTRIENT_TEXT = ['key', 'name', 'showsOn', 'role', 'looks', 'causes', 'withTheSoil', 'whyNotChemical', 'caution'];
for (const nutrient of N.PLANT_NUTRIENTS) {
  for (const field of NUTRIENT_TEXT) ok(`${nutrient.key}.${field} filled`, typeof nutrient[field] === 'string' && nutrient[field].trim().length > 0);
  ok(`${nutrient.key} showsOn`, nutrient.showsOn === 'older' || nutrient.showsOn === 'newer');
  ok(`${nutrient.key} has sources`, nutrient.sources.length > 0);
}
check('twelve nutrients', N.PLANT_NUTRIENTS.length, 12);
ok('N shows on older leaves', N.findPlantNutrient('N').showsOn === 'older');
ok('Ca shows on the newest leaves', N.findPlantNutrient('Ca').showsOn === 'newer');
ok('Fe shows on the newest leaves', N.findPlantNutrient('Fe').showsOn === 'newer');

// 2. Unique keys and aliases.
const cropKeys = G.CROP_GUIDES.map((g) => g.key);
check('crop keys unique', cropKeys.length, new Set(cropKeys).size);
const nutrientKeys = N.PLANT_NUTRIENTS.map((n) => n.key);
check('nutrient keys unique', nutrientKeys.length, new Set(nutrientKeys).size);
const aliasOwner = new Map();
for (const guide of G.CROP_GUIDES) {
  for (const alias of [guide.name, ...guide.aliases]) {
    const norm = alias.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const owner = aliasOwner.get(norm);
    if (owner && owner !== guide.key) ok(`alias "${norm}" on ${owner} and ${guide.key}`, false);
    aliasOwner.set(norm, guide.key);
  }
}

// 3. Three problems per crop, each at the same depth, specific to the crop,
// and put right from the soil rather than a bag or bottle.
const seenLooks = new Map();
const seenFix = new Map();
check('problems for every crop and no other', Object.keys(P.CROP_PROBLEMS).sort(), cropKeys.slice().sort());
for (const guide of G.CROP_GUIDES) {
  const problems = P.CROP_PROBLEMS[guide.key] ?? [];
  check(`${guide.key} has 3 problems`, problems.length, 3);
  for (const problem of problems) {
    const where = `${guide.key} "${problem.label}"`;
    for (const field of ['label', 'looks', 'why', 'fix']) ok(`${where}.${field} filled`, typeof problem[field] === 'string' && problem[field].trim());
    ok(`${where} looks at least 70 characters`, problem.looks.length >= 70);
    ok(`${where} why at least 80 characters`, problem.why.length >= 80);
    ok(`${where} fix at least 140 characters`, problem.fix.length >= 140);
    for (const field of ['looks', 'why', 'fix']) ok(`${where}.${field} names no chemical`, !CHEMICAL.test(problem[field]));
    if (problem.nutrient) ok(`${where} nutrient ${problem.nutrient} exists`, !!N.findPlantNutrient(problem.nutrient));
    if (seenLooks.has(problem.looks)) ok(`${where} looks repeats ${seenLooks.get(problem.looks)}`, false);
    if (seenFix.has(problem.fix)) ok(`${where} fix repeats ${seenFix.get(problem.fix)}`, false);
    seenLooks.set(problem.looks, where);
    seenFix.set(problem.fix, where);
  }
}
ok('living soil guide says how strong the evidence is', N.LIVING_SOIL_GUIDE.some((item) => /evidence/i.test(item.heading)));
ok('where to ask has places', N.WHERE_TO_ASK.length >= 5);

// 4. Matching a planting's food name.
const cases = [
  ['Tomatoes Fruit', 'tomato'],
  ['Squash, zucchini', 'courgette'],
  ['Pepper black', null],
  ['Black pepper, ground', null],
  ['Mangosteen', null],
  ['Bean green', 'greenbeans'],
  ['Peppermint tea', 'mint'],
  ['Pepper, jalapeno', 'pepper'],
  ['Chard/leaf beet', 'chard'],
  ['Coriander (cilantro) leaves', 'coriander'],
  ['Cornflakes', null],
  ['Gumbo, chicken', null],
  ['Tapioca pearls', null],
  ['Garlic', 'garlic'],
  ['Lettuce, romaine', 'lettuce'],
];
for (const [name, key] of cases) {
  const found = G.findCropGuide(name);
  check(`"${name}" finds ${key}`, found ? found.key : null, key);
}
check('empty name finds nothing', G.findCropGuide(''), null);

// 5. Search.
ok('search "tomato" finds tomato', G.searchCropGuides('tomato').some((g) => g.key === 'tomato'));
ok('search "cabbage family" finds kale', G.searchCropGuides('cabbage family').some((g) => g.key === 'kale'));
check('search needs every word', G.searchCropGuides('tomato banana').length, 0);
check('formatPh', G.formatPh([6, 6.8]), 'pH 6.0 to 6.8');

// 6. Writing rules on everything a person reads.
const texts = [];
for (const guide of G.CROP_GUIDES) {
  texts.push([guide.key, guide.sun], [guide.key, guide.soil], [guide.key, guide.sow], [guide.key, guide.spacing], [guide.key, guide.ready], [guide.key, guide.water], [guide.key, guide.grow]);
  for (const p of P.CROP_PROBLEMS[guide.key] ?? []) for (const f of ['label', 'looks', 'why', 'fix', 'insteadOf']) if (p[f]) texts.push([guide.key, p[f]]);
}
for (const n of N.PLANT_NUTRIENTS) for (const f of NUTRIENT_TEXT.slice(3)) texts.push([n.key, n[f]]);
for (const item of [...N.NUTRIENT_LOOK_ALIKES, ...N.SOIL_PH_GUIDE, ...N.LIVING_SOIL_GUIDE, ...N.WHERE_TO_ASK]) texts.push([item.heading, item.heading], [item.heading, item.body]);
for (const [where, text] of texts) {
  ok(`${where}: no em or en dash in "${text.slice(0, 40)}"`, !/[–—]| -- /.test(text));
  ok(`${where}: no filler word in "${text.slice(0, 40)}"`, !/\b(real|genuine|genuinely)\b/i.test(text));
}

async function checkLinks() {
  const urls = new Set();
  for (const guide of G.CROP_GUIDES) for (const s of G.cropSources(guide)) urls.add(s.url);
  for (const n of N.PLANT_NUTRIENTS) for (const s of n.sources) urls.add(s.url);
  for (const s of N.SOIL_GUIDE_SOURCES) urls.add(s.url);
  for (const s of N.LIVING_SOIL_SOURCES) urls.add(s.url);
  for (const place of N.WHERE_TO_ASK) urls.add(place.url);
  const list = [...urls].filter((u) => !u.startsWith(PUBMED));
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(list.slice(i, i + 8).map(async (url) => {
      try {
        const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/124' } });
        ok(`${url} answers 200 (got ${res.status})`, res.status === 200);
        // Garden Organic answers a missing guide with 200 and its landing
        // page, so a guide link is checked for the landing page title.
        if (res.status === 200 && url.includes('gardenorganic.org.uk/') && !url.endsWith('.org.uk/')) {
          const title = ((await res.text()).match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
          ok(`${url} is not the Garden Organic landing page (${title.trim()})`, !/^Discover organic growing/i.test(title.trim()));
        }
      } catch (error) {
        ok(`${url} answers (${error.message})`, false);
      }
    }));
  }
  console.log(`checked ${list.length} links`);
}

(async () => {
  if (process.argv.includes('--links')) await checkLinks();
  console.log(`${checks - failures}/${checks} checks passed (${G.CROP_GUIDES.length} crops, ${N.PLANT_NUTRIENTS.length} nutrients)`);
  process.exit(failures ? 1 : 0);
})();
