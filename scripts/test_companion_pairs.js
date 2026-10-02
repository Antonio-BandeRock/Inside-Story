// Checks lib/companionPairs.ts (I7): every pair names plants that exist,
// carries a tier and a source, appears once, and every sentence is swept for
// verdict words, dashes and garden chemicals. Also checks the neighbour
// lookup used on the Add a Planting form.
// Run: node scripts/test_companion_pairs.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  cache[file] = mod.exports;
  const allowed = { './cropGuides': 'lib/cropGuides.ts', './plantNutrients': 'lib/plantNutrients.ts', './cropProblems': 'lib/cropProblems.ts' };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (allowed[name]) return load(allowed[name]);
    throw new Error(`${file} imported ${name}, which this test does not allow`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}

const guides = load('lib/cropGuides.ts');
const cp = load('lib/companionPairs.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

const plants = new Set([...guides.CROP_GUIDES.map((g) => g.key), ...cp.COMPANION_FLOWERS.map((f) => f.key)]);
const seen = new Set();
const sentences = [cp.COMPANION_INTRO, cp.COMPANION_NONE, cp.COMPANION_FLOWERS_NOTE];
for (const pair of cp.COMPANION_PAIRS) {
  const label = `${pair.a} and ${pair.b}`;
  ok(`${label}: both plants exist`, plants.has(pair.a) && plants.has(pair.b));
  ok(`${label}: not a plant paired with itself`, pair.a !== pair.b);
  const id = [pair.a, pair.b].sort().join('|');
  ok(`${label}: listed once`, !seen.has(id));
  seen.add(id);
  ok(`${label}: tier`, ['trial', 'extension', 'tradition'].includes(pair.tier));
  ok(`${label}: relation`, ['together', 'apart'].includes(pair.relation));
  ok(`${label}: has a source`, pair.sources.length > 0 && pair.sources.every((s) => /^https:\/\//.test(s.url) && s.label));
  ok(`${label}: says why`, pair.why.length > 30);
  if (pair.tier === 'tradition') {
    ok(`${label}: a tradition says it is untested`, /no reason or trial|no controlled trial|no scientific support|no trial/i.test(pair.why), pair.why);
  }
  sentences.push(pair.why);
}
for (const s of cp.COMPANION_FLOWERS_SOURCES) ok(`flower source ${s.label}`, /^https:\/\//.test(s.url));

// Lookups.
ok('tomato resolves to its guide', cp.companionPlantFor('Tomatoes, red, ripe, raw') === 'tomato' || cp.companionPlantFor('Tomato') === 'tomato');
ok('a marigold resolves to the flower', cp.companionPlantFor('French marigold') === 'frenchmarigold');
ok('an unknown food has no plant', cp.companionPlantFor('Granite chips') === null && cp.companionPlantFor('') === null);
const tomato = cp.companionsFor('tomato');
ok('tomato pairs come trials first', tomato.length > 5 && tomato[0].tier === 'trial' && tomato[tomato.length - 1].tier === 'tradition');
ok('the pair reads the same from both sides', cp.companionsFor('potato').some((n) => n.key === 'tomato' && n.relation === 'apart'));
ok('cabbage has the family note', cp.familyCompanionNote('cabbage') && cp.familyCompanionNote('cabbage').tier === 'trial');
ok('lettuce has no family note', cp.familyCompanionNote('lettuce') === null);

const area = [
  { id: 'p1', foodName: 'Potato', status: 'growing' },
  { id: 'p2', foodName: 'Basil', status: 'planned' },
  { id: 'p3', foodName: 'Sweet corn', status: 'harvested' },
  { id: 'p4', foodName: 'Tomato', status: 'growing' },
];
const near = cp.neighbourNotes('Tomato', area, 'p4').map((n) => n.key);
ok('neighbours: growing and planned only, not itself', near.includes('potato') && near.includes('basil') && !near.includes('sweetcorn') && !near.includes('tomato'), near.join(','));
ok('neighbours: none for a food with no plant', cp.neighbourNotes('Granite chips', area).length === 0);
const line = cp.describeNeighbour(cp.neighbourNotes('Tomato', area, 'p4').find((n) => n.key === 'potato'));
ok('neighbour line', line === 'Potatoes: kept apart from it. Advised by an extension service.', line);
for (const tier of ['trial', 'extension', 'tradition']) sentences.push(cp.describeTier(tier));
sentences.push(line);

const VERDICT = /\b(optimal|ideal|perfect|best|healthy|unhealthy|guaranteed|always works|correct|wrong way|bad|good|must|never plant)\b/i;
const CHEMICAL = /\b(miracle-gro|roundup|glyphosate|neonicotinoid|chlorpyrifos|metaldehyde|npk|synthetic|fungicide|pesticide|herbicide|insecticide|growmore)\b/i;
for (const sentence of sentences) {
  ok(`no verdict words: ${sentence.slice(0, 70)}`, !VERDICT.test(sentence), sentence);
  ok(`no dashes: ${sentence.slice(0, 70)}`, !/[—–]| -- /.test(sentence), sentence);
  ok(`no garden chemicals: ${sentence.slice(0, 70)}`, !CHEMICAL.test(sentence), sentence);
  ok(`no "real" or "genuinely": ${sentence.slice(0, 70)}`, !/\b(real|genuine|genuinely)\b/i.test(sentence), sentence);
}
const component = fs.readFileSync(path.join(__dirname, '..', 'components', 'CompanionSection.tsx'), 'utf8');
for (const raw of component.match(/'[^'\n]{12,}'|>[^<>{}\n]{12,}</g) || []) {
  ok(`component has no verdict words: ${raw.slice(0, 70)}`, !VERDICT.test(raw), raw);
}

if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`All companion planting checks passed (${cp.COMPANION_PAIRS.length} pairs, ${sentences.length} sentences swept).`);
