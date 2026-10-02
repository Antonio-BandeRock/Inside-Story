// Checks the Pests and Beneficial Insects shelf in Garden > Horticulture
// (I11): every entry it should hold lands on it and nowhere else, the shelf
// sits after Growing Techniques, stays under the size that would need
// subgroups, no Horticulture topic grew past it, every relatedId resolves,
// and the new text carries no dashes, "real", "genuine" or a colon title.
// Run: node scripts/test_horticulture_pests.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  cache[file] = mod.exports;
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (!name.startsWith('.')) return {};
    const base = path.join(path.dirname(file), name);
    for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(path.join(root, candidate))) return load(candidate);
    }
    throw new Error(`${file} imported ${name}, which this test could not find`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

const { HOME_GARDENING_ENTRIES } = load('lib/digest/homeGardening.ts');
const grouping = load('lib/digest/categoryGrouping.ts');
const SHELF = 'Pests and Beneficial Insects';

const expected = [
  'garden-natural-pest-management',
  'garden-organic-approved-pesticides',
  'garden-pests-watch-before-acting',
  'garden-pests-natural-enemies',
  'garden-pests-flowers-for-natural-enemies',
  'garden-pests-covers-and-barriers',
  'garden-pests-slugs-and-snails',
  'garden-pests-why-sprays-bring-pests-back',
];

const order = grouping.HOME_GARDENING_TOPIC_ORDER;
ok('shelf is in the order once', order.filter((t) => t === SHELF).length === 1);
ok('shelf follows Growing Techniques', order.indexOf(SHELF) === order.indexOf('Growing Techniques') + 1);

const { topics, tyingTogether } = grouping.groupHomeGardeningEntries(HOME_GARDENING_ENTRIES);
const shelf = topics.find((t) => t.label === SHELF);
ok('shelf renders', !!shelf);
const onShelf = shelf ? shelf.entries.map((e) => e.id).sort() : [];
ok('shelf holds exactly the pest entries', JSON.stringify(onShelf) === JSON.stringify([...expected].sort()), onShelf.join(', '));
ok('Three Sisters stays in Growing Techniques', grouping.classifyHomeGardeningTopic({ id: 'garden-three-sisters-companion-planting' }) === 'Growing Techniques');

// Every entry accounted for once, no topic past the subgroup line.
const placed = topics.flatMap((t) => t.entries.map((e) => e.id));
const all = HOME_GARDENING_ENTRIES.map((e) => e.id).filter((id) => !tyingTogether || id !== tyingTogether.id);
ok('every Horticulture entry placed once', placed.length === all.length && new Set(placed).size === all.length, `${placed.length} placed of ${all.length}`);
for (const t of topics) ok(`${t.label} under the subgroup line`, t.entries.length <= 12, `${t.entries.length}`);
console.log(`Horticulture: ${topics.length} shelves, ${placed.length} entries, ${shelf ? shelf.entries.length : 0} on ${SHELF}`);

// Related ids across the whole reading corpus.
const ids = new Set();
for (const file of fs.readdirSync(path.join(root, 'lib/digest'))) {
  if (!file.endsWith('.ts')) continue;
  for (const m of fs.readFileSync(path.join(root, 'lib/digest', file), 'utf8').matchAll(/id:\s*'([^']+)'/g)) ids.add(m[1]);
}
for (const id of expected) {
  const entry = HOME_GARDENING_ENTRIES.find((e) => e.id === id);
  ok(`${id} exists`, !!entry);
  if (!entry) continue;
  for (const rel of entry.relatedIds || []) ok(`${id} related ${rel} resolves`, ids.has(rel));
  ok(`${id} has a source`, entry.citations.length > 0 && entry.citations.every((c) => /^https:\/\//.test(c.url)));
}

// Wording of the six new entries.
const forbidden = /\b(real|really|genuine|genuinely)\b|—|–| -- |\*\*/i;
for (const entry of HOME_GARDENING_ENTRIES.filter((e) => e.id.startsWith('garden-pests-'))) {
  for (const field of ['title', 'teaser', 'summary']) ok(`${entry.id} ${field} wording`, !forbidden.test(entry[field]), entry[field].match(forbidden)?.[0]);
  ok(`${entry.id} title has no colon subtitle`, !entry.title.includes(':'));
  ok(`${entry.id} has no stageNote`, !('stageNote' in entry));
}

const tying = HOME_GARDENING_ENTRIES.find((e) => e.id === 'garden-tying-together');
ok('closing card links the shelf', tying.relatedIds.includes('garden-pests-watch-before-acting') && tying.relatedIds.includes('garden-pests-natural-enemies'));

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('horticulture pests: all checks passed');
