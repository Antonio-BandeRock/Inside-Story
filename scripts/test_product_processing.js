// Runs the processing level and additive list shown after a barcode scan
// (lib/productProcessing.ts, G16, 2026-09-27).
//
// The rules checked:
//
//  1. Open Food Facts tags ("en:e322i") become E-numbers, deduplicated and
//     sorted, with anything that is not an E-number dropped.
//  2. Variants land on the entry for their base number (E407a on carrageenan).
//  3. Every reading id the module links to exists in the reading corpus.
//  4. A NOVA group outside 1 to 4 reads as none.
//  5. The words carry no dashes and no verdict words.
//
// Run with: node scripts/test_product_processing.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const P = loadModule('lib/productProcessing.ts');

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${label}\n  expected ${e}\n  got      ${a}`);
  }
}

check('tag', P.additiveCodeFromTag('en:e322i'), 'E322i');
check('bare tag', P.additiveCodeFromTag('e1442'), 'E1442');
check('not an E-number', P.additiveCodeFromTag('en:lecithin'), null);

const rows = P.describeAdditives(['en:e407a', 'en:e330', 'en:e322i', 'en:e330', 'en:unknown', 'en:e1442', 'en:e999']);
check(
  'rows',
  rows,
  [
    { code: 'E322i', name: 'Lecithins', readingId: null },
    { code: 'E330', name: 'Citric acid', readingId: null },
    { code: 'E407a', name: 'Carrageenan', readingId: 'additive-carrageenan' },
    { code: 'E999', name: null, readingId: null },
    { code: 'E1442', name: 'Hydroxypropyl distarch phosphate', readingId: null },
  ],
);
check('label with name', P.additiveRowLabel(rows[0]), 'E322i Lecithins');
check('label without', P.additiveRowLabel(rows[3]), 'E999');
check('count none', P.describeAdditiveCount(0), 'No additives listed.');
check('count one', P.describeAdditiveCount(1), 'One additive listed.');
check('count many', P.describeAdditiveCount(5), '5 additives listed.');

check('nova string', P.parseNovaGroup('4'), 4);
check('nova out of range', P.parseNovaGroup(5), null);
check('nova missing', P.parseNovaGroup(undefined), null);
check('off read', P.readOpenFoodFactsProcessing({ nova_group: 3, additives_tags: ['en:e330', 7] }), { novaGroup: 3, additiveTags: ['en:e330'] });
check('off empty', P.readOpenFoodFactsProcessing({}), { novaGroup: null, additiveTags: [] });
check('stored', P.parseStoredAdditiveTags('["en:e330"]'), ['en:e330']);
check('stored null', P.parseStoredAdditiveTags(null), null);
check('stored broken', P.parseStoredAdditiveTags('{'), null);

// 3. Every linked reading id exists somewhere in lib/digest.
const digestDir = path.join(__dirname, '..', 'lib', 'digest');
const corpus = fs.readdirSync(digestDir).filter((f) => f.endsWith('.ts')).map((f) => fs.readFileSync(path.join(digestDir, f), 'utf8')).join('\n');
const linked = new Set([...P.novaReadingIds(4), ...P.novaReadingIds(1)]);
for (let n = 100; n <= 1600; n++) {
  const row = P.describeAdditives([`en:e${n}`])[0];
  if (row && row.readingId) linked.add(row.readingId);
}
for (const id of linked) {
  if (!corpus.includes(`id: '${id}'`)) {
    failures++;
    console.log(`FAIL reading id not found: ${id}`);
  }
}

// 5. Words.
const FORBIDDEN = /\b(good|bad|best|worst|healthy|unhealthy|should|clean|safe|real|genuine|genuinely|score|avoid|dangerous|toxic)\b|[–—]| -- /i;
const words = [P.PROCESSING_SOURCE_CAPTION, ...Object.values(P.NOVA_GROUPS).flatMap((g) => [g.label, g.caption])];
for (const text of words) {
  if (FORBIDDEN.test(text)) {
    failures++;
    console.log(`FAIL words: ${text}`);
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log(`product processing: all checks passed (${linked.size} reading entries linked)`);
