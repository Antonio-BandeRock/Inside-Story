// Checks lib/seedInventory.ts (I9): reading a packet's date and amount, its
// age in years, the keeping table against the growing guides, what is left
// after sowings, germination tests, which packets a planting is offered,
// when a packet may be deleted, and every sentence swept for verdict words,
// dashes and "real". Also checks the tables exist, travel in the sync change
// list, and that deleting a planting gives its seed back to the packet.
// Run: node scripts/test_seed_inventory.js
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
  const allowed = { './plantNutrients': 'lib/plantNutrients.ts', './cropProblems': 'lib/cropProblems.ts', './cropGuides': 'lib/cropGuides.ts' };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (allowed[name]) return load(allowed[name]);
    throw new Error(`${file} imported ${name}, which this test does not allow`);
  });
  cache[file] = mod.exports;
  return mod.exports;
}

const si = load('lib/seedInventory.ts');
const guides = load('lib/cropGuides.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

// Packet dates.
ok('year alone', si.readPackedOn('2025').status === 'date');
ok('month', si.readPackedOn('2025-03').status === 'date');
ok('day', si.readPackedOn('2025-03-14').status === 'date');
ok('blank', si.readPackedOn('  ').status === 'empty');
ok('words rejected', si.readPackedOn('last spring').status === 'invalid');
ok('month 13 rejected', si.readPackedOn('2025-13').status === 'invalid');
ok('age this year', si.packetAgeYears('2026', '2026-10-02') === 0);
ok('age two years', si.packetAgeYears('2024-03-14', '2026-10-02') === 2);
ok('age with no date', si.packetAgeYears(null, '2026-10-02') === null);
ok('future packet reads as this year', si.packetAgeYears('2027', '2026-10-02') === 0);

// Amounts.
ok('amount', si.readAmount('25').status === 'amount' && si.readAmount('2,5').value === 2.5);
ok('zero rejected', si.readAmount('0').status === 'invalid');
ok('blank amount', si.readAmount('').status === 'empty');
ok('format seeds', si.formatAmount(1, 'seeds') === '1 seed' && si.formatAmount(30, 'seeds') === '30 seeds');
ok('format grams', si.formatAmount(2.5, 'grams') === '2.5 g');
ok('format packets', si.formatAmount(1, 'packets') === '1 packet');
ok('units in natural order', si.SEED_UNITS.map((u) => u.code).join() === 'seeds,grams,packets');

// The keeping table names only crops the growing guides have.
const keys = new Set(guides.CROP_GUIDES.map((g) => g.key));
for (const key of Object.keys(si.SEED_KEEPS_YEARS)) {
  ok(`keeping table key ${key} is a growing guide`, keys.has(key));
  const years = si.SEED_KEEPS_YEARS[key];
  ok(`keeping years for ${key} in the table range`, years >= 1 && years <= 5);
}
ok('lettuce 1', si.seedKeepsYears('Lettuce') === 1);
ok('tomato 4', si.seedKeepsYears('Tomato') === 4);
ok('cucumber 5', si.seedKeepsYears('Cucumber') === 5);
ok('not in the table gives nothing', si.seedKeepsYears('Basil') === null);
ok('not a crop gives nothing', si.seedKeepsYears('Chocolate cake') === null);
ok('source cited', /colostate\.edu/.test(si.SEED_LONGEVITY_SOURCE.url));

const k1 = si.describeKeeping('Lettuce', '2024', '2026-10-02');
ok('past keeping says so and points to a test', /2 years ago/.test(k1) && /keeps about 1 year/.test(k1) && /germination test/.test(k1), k1);
const k2 = si.describeKeeping('Tomato', '2026', '2026-10-02');
ok('this year', /this year/.test(k2) && /about 4 years/.test(k2) && !/past that/.test(k2), k2);
const k3 = si.describeKeeping('Basil', '2025', '2026-10-02');
ok('no table figure, age only', k3 === 'Packed for 2025, 1 year ago.', k3);
const k4 = si.describeKeeping('Carrot', null, '2026-10-02');
ok('no date', /No packing date recorded/.test(k4), k4);

// Remaining.
const pk = { amount: 50, amountUnit: 'seeds' };
ok('nothing sown', si.describeRemaining(pk, []) === '50 seeds in the packet.');
ok('some sown', si.describeRemaining(pk, [{ amount: 12 }, { amount: 8 }]) === '30 seeds left of 50 seeds.');
ok('use with no amount counts nothing', si.remainingAmount(pk, [{ amount: null }]).left === 50);
const over = si.remainingAmount(pk, [{ amount: 60 }]);
ok('over the packet', over.left === 0 && over.over === true);
ok('over sentence', /More recorded as sown/.test(si.describeRemaining(pk, [{ amount: 60 }])));
ok('no amount recorded', si.remainingAmount({ amount: null }, []) === null && si.describeRemaining({ amount: null, amountUnit: null }, []) === 'No amount recorded.');
ok('grams left', si.describeRemaining({ amount: 5, amountUnit: 'grams' }, [{ amount: 1.2 }]) === '3.8 g left of 5 g.');

// Tests.
ok('test ok', si.readTest('10', '8').status === 'ok');
ok('more sprouted than sown', si.readTest('10', '11').status === 'invalid');
ok('none set', si.readTest('0', '0').status === 'invalid');
ok('words', si.readTest('ten', '8').status === 'invalid');
ok('8 of 10', si.describeTest({ sown: 10, sprouted: 8 }) === '8 of 10 sprouted. At that rate, about 13 seeds give 10 seedlings.');
ok('all', /Every seed/.test(si.describeTest({ sown: 10, sprouted: 10 })));
ok('none', /None came up/.test(si.describeTest({ sown: 10, sprouted: 0 })));

// Packets offered to a planting.
const packets = [
  { id: 'a', foodId: 1, source: 'USDA', foodName: 'Tomatoes, red, ripe, raw', finishedAt: null },
  { id: 'b', foodId: 2, source: 'CNF', foodName: 'Tomato, cherry', finishedAt: null },
  { id: 'c', foodId: 1, source: 'USDA', foodName: 'Tomatoes, red, ripe, raw', finishedAt: '2026-01-01' },
  { id: 'd', foodId: 3, source: 'USDA', foodName: 'Lettuce, cos', finishedAt: null },
];
const offered = si.packetsForCrop(packets, { foodId: 1, source: 'USDA', name: 'Tomatoes, red, ripe, raw' }).map((p) => p.id);
ok('same food and same crop offered, put away left out', offered.join() === 'a,b', offered.join());
ok('other crop not offered', !offered.includes('d'));
ok('title with variety', si.packetTitle({ foodName: 'Tomato', variety: ' Brandywine ' }) === 'Tomato, Brandywine');
ok('title without variety', si.packetTitle({ foodName: 'Tomato', variety: null }) === 'Tomato');

// Delete or put away.
ok('nothing recorded can be deleted', si.canDeletePacket(0, 0));
ok('a use keeps it', !si.canDeletePacket(1, 0));
ok('a test keeps it', !si.canDeletePacket(0, 1));

// Sentence sweep, the module and the screens.
const sentences = [si.SEEDS_INTRO, si.SEEDS_TEST_HOW, si.SEEDS_PUT_AWAY_NOTE, si.SEED_USE_CAPTION, k1, k2, k3, k4];
for (const file of ['components/SeedsLens.tsx', 'components/SeedPacketChoice.tsx']) {
  const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  for (const m of text.matchAll(/'([A-Z][^'\n]{12,})'|`([A-Z][^`\n]{12,})`|>([A-Z][^<>{}\n]{6,})</g)) sentences.push(m[1] || m[2] || m[3]);
}
const forbidden = /\b(ideal|optimal|perfect|best|worst|poor|bad|good|dead|expired|too old|wrong|should|must|real|genuinely?)\b|—|–| -- /i;
for (const s of sentences) ok(`sentence free of verdicts and dashes: ${s}`, !forbidden.test(s), s);

// Tables, sync and cleanup.
const db = fs.readFileSync(path.join(__dirname, '..', 'lib/db.ts'), 'utf8');
for (const table of ['garden_seeds', 'garden_seed_uses', 'garden_seed_tests']) {
  ok(`${table} exists with updated_at`, new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?updated_at TEXT NOT NULL`).test(db));
}
ok('deleting a planting gives its seed back', /DELETE FROM garden_seed_uses WHERE planting_id = \?', id\)/.test(db));
const changes = fs.readFileSync(path.join(__dirname, '..', 'lib/snapshotChanges.ts'), 'utf8');
ok('seed packets counted, uses and tests quiet', /count: \['garden_seeds'\], quiet: \['garden_seed_uses', 'garden_seed_tests'\]/.test(changes));
const garden = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/garden.tsx'), 'utf8');
ok('Seeds lens wired', /lens === 'seeds'/.test(garden) && /openGardenLens === 'seeds'/.test(garden));
ok('planting draws down a packet', /addSeedUse\(\{/.test(garden));

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('seed inventory: all checks passed');
