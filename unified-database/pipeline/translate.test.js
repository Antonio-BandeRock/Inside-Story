// Real tests for translate.js -- both pure batching logic (offline) and
// a real, live call against the actual endpoint (network required,
// matching how this whole module was verified before being trusted).

const assert = require('assert');
const { buildBatches, translateTexts } = require('./translate.js');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { console.log('PASS  ' + name); pass++; }
  else { console.log('FAIL  ' + name + (detail ? '  ->  ' + detail : '')); fail++; }
}

// --- Pure logic ---
check('buildBatches respects the real item-count cap', (() => {
  const texts = Array.from({ length: 250 }, (_, i) => `item ${i}`);
  const batches = buildBatches(texts);
  return batches.every((b) => b.length <= 100) && batches.reduce((s, b) => s + b.length, 0) === 250;
})());

check('buildBatches respects the real character cap even with few items', (() => {
  const longText = 'x'.repeat(3000);
  const texts = [longText, longText, longText];
  const batches = buildBatches(texts);
  return batches.length === 3 && batches.every((b) => b.length === 1);
})());

check('buildBatches preserves real input order across batch boundaries', (() => {
  const texts = Array.from({ length: 150 }, (_, i) => `item ${i}`);
  const batches = buildBatches(texts);
  const flattened = batches.flat();
  return JSON.stringify(flattened) === JSON.stringify(texts);
})());

// --- Real, live translation against the actual endpoint ---
(async () => {
  try {
    const results = await translateTexts(['Nöt talg', 'Kokosmjölk, lätt', 'Äpple, rå'], { sourceLang: 'sv', targetLang: 'en' });
    check('real live translation returns 3 results for 3 inputs', results.length === 3, `got ${results.length}`);
    check('real live translation of "Nöt talg" is sensible', results[0] && results[0].toLowerCase().includes('tallow'), `got "${results[0]}"`);
    check('real live translation of "Kokosmjölk, lätt" is sensible', results[1] && results[1].toLowerCase().includes('coconut'), `got "${results[1]}"`);
    check('real live translation of "Äpple, rå" is sensible', results[2] && results[2].toLowerCase().includes('apple'), `got "${results[2]}"`);
  } catch (e) {
    console.log('FAIL  real live translation test threw: ' + e.message);
    fail++;
  }

  console.log('');
  console.log(`${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
})();
