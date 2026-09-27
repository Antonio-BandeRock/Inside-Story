// Checks lib/pendingScans.ts: when a waiting barcode is tried again, that a
// pass stops at the first attempt with no answer, the order a person sees,
// and that no sentence calls a barcode unknown before it was looked up.
// Run: node scripts/test_pending_scans.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib/pendingScans.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
  throw new Error(`pendingScans.ts imported ${name}`);
});
const p = mod.exports;

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|guarantee|unknown product)\b|[–—]| -- /i;

function scan(overrides) {
  return {
    barcode: '0123456789012',
    scannedAt: '2026-09-27T15:00:00.000Z',
    tries: 1,
    lastTriedAt: '2026-09-27T15:00:00.000Z',
    outcome: 'waiting',
    foundName: null,
    foundBrand: null,
    ...overrides,
  };
}

const at = (iso) => new Date(iso);

// Retry timing.
ok('never tried is due', p.dueForRetry(scan({ tries: 0, lastTriedAt: null }), at('2026-09-27T15:00:00Z')));
ok('first retry waits 30 s', !p.dueForRetry(scan(), at('2026-09-27T15:00:20Z')));
ok('first retry after 30 s', p.dueForRetry(scan(), at('2026-09-27T15:00:31Z')));
ok('later retries wait half an hour', !p.dueForRetry(scan({ tries: 6 }), at('2026-09-27T15:20:00Z')));
ok('later retries after half an hour', p.dueForRetry(scan({ tries: 6 }), at('2026-09-27T15:31:00Z')));
ok('found is never retried', !p.dueForRetry(scan({ outcome: 'found' }), at('2026-09-28T15:00:00Z')));
ok('missing is never retried', !p.dueForRetry(scan({ outcome: 'not_found' }), at('2026-09-28T15:00:00Z')));
ok('bad time is due', p.dueForRetry(scan({ lastTriedAt: 'x' }), at('2026-09-27T15:00:00Z')));
ok('delays grow', [0, 1, 2, 3, 4].map(p.retryDelayMs).every((d, i, a) => i === 0 || d >= a[i - 1]));

// A pass.
ok('no answer stops the pass', p.stopsThePass({ kind: 'no-answer' }));
ok('found keeps going', !p.stopsThePass({ kind: 'found', name: 'Oats', brand: null }));
ok('missing keeps going', !p.stopsThePass({ kind: 'missing' }));

// Order.
const ordered = p.orderPendingScans([
  scan({ barcode: 'w-old', scannedAt: '2026-09-26T10:00:00Z' }),
  scan({ barcode: 'n', outcome: 'not_found' }),
  scan({ barcode: 'w-new', scannedAt: '2026-09-27T10:00:00Z' }),
  scan({ barcode: 'f', outcome: 'found', foundName: 'Oat Milk' }),
]);
ok('order', ordered.map((s) => s.barcode).join() === 'f,n,w-new,w-old', ordered.map((s) => s.barcode));

// Sentences.
const now = at('2026-09-27T20:00:00Z');
const found = scan({ outcome: 'found', foundName: 'Oat Milk', foundBrand: 'Oatly' });
ok('found title', p.pendingScanTitle(found) === 'Oat Milk, Oatly');
ok('waiting title names the barcode', p.pendingScanTitle(scan()) === 'Barcode 0123456789012');
ok('waiting says waiting', p.pendingScanCaption(scan(), now).includes('Waiting for a signal'));
ok('waiting never says not found', !/not (in|found)|has this barcode/i.test(p.pendingScanCaption(scan(), now)));
ok('heading', p.pendingScansHeading(ordered) === 'Scanned with no signal: 1 looked up, 2 waiting for a signal, 1 not in either database', p.pendingScansHeading(ordered));
ok('queued message names the barcode', p.queuedMessage('777').includes('777'));
const sentences = [
  p.QUEUED_TITLE,
  p.queuedMessage('777'),
  p.pendingScansHeading(ordered),
  ...['waiting', 'found', 'not_found'].map((outcome) => p.pendingScanCaption(scan({ outcome, foundName: 'Oats' }), now)),
];
for (const sentence of sentences) ok(`forbidden words: ${sentence}`, !FORBIDDEN.test(sentence));

if (failures > 0) {
  console.log(`${failures} failed`);
  process.exit(1);
}
console.log('test_pending_scans: all passed');
