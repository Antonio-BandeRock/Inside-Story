/* global __dirname, Buffer */
// Runs lib/localSeal.ts: sealing the files the app keeps for itself.
//
// App Lock step 1. The sync copies beside the database were plain JSON. What
// has to hold:
//
//  1. A sealed file round-trips exactly, including non-ASCII text and a
//     copy running to megabytes.
//  2. Nothing of the text shows in what is written.
//  3. The wrong key, a flipped byte or a cut file opens to nothing, never a
//     partial read.
//  4. A plain file from before sealing opens as it is, so an upgrade loses
//     nothing.
//  5. The fast base64 agrees with the one lib/partnerCrypto.ts already uses.
//  6. Every read and write of the sync copies goes through the seal.
//
// Run with: node scripts/test_local_seal.js

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const nacl = require('tweetnacl');

const LIB = path.join(__dirname, '..', 'lib');

function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (request === 'tweetnacl') return require('tweetnacl');
    if (request.startsWith('./')) return loadModule(request.slice(2), cache);
    throw new Error(`This harness does not provide ${request}`);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const S = loadModule('localSeal');
const P = loadModule('partnerCrypto');

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

const random = (n) => new Uint8Array(require('crypto').randomBytes(n));
const key = random(S.SEAL_KEY_BYTES);
const otherKey = random(S.SEAL_KEY_BYTES);

// 1 and 2: round trips, and nothing shows.
const samples = [
  '',
  '{"meals":[{"name":"Levothyroxine 75 mcg","note":"took at 6:00"}]}',
  'Ñandú, café, 甲状腺, 🙂 and a tab\tand a newline\n',
  JSON.stringify({ rows: Array.from({ length: 40000 }, (_, i) => ({ id: i, text: `symptom note ${i}` })) }),
];
for (const text of samples) {
  const sealed = S.sealText(text, key, random(S.SEAL_NONCE_BYTES));
  check('sealed text carries the prefix', sealed.startsWith(S.SEALED_PREFIX) && S.isSealedText(sealed));
  const opened = S.openStoredText(sealed, key);
  check(`round trip of ${text.length} characters`, opened.ok && opened.text === text && opened.wasSealed === true);
  if (text.length > 10) {
    check('no readable text in the sealed file', !sealed.includes('Levothyroxine') && !sealed.includes('symptom note'));
  }
}
check('large copy is over a megabyte', samples[3].length > 1000000);

// Same text twice under fresh nonces never looks the same.
const a = S.sealText('same', key, random(24));
const b = S.sealText('same', key, random(24));
check('fresh nonce gives a different file', a !== b);

// 3: wrong key, tampering, truncation, no key.
const sealed = S.sealText('private', key, random(24));
check('wrong key opens to nothing', S.openStoredText(sealed, otherKey).ok === false);
check('no key opens to nothing', S.openStoredText(sealed, null).ok === false);
const body = sealed.slice(S.SEALED_PREFIX.length);
const flipped = S.SEALED_PREFIX + (body[30] === 'A' ? body.slice(0, 30) + 'B' + body.slice(31) : body.slice(0, 30) + 'A' + body.slice(31));
check('a flipped character opens to nothing', S.openStoredText(flipped, key).ok === false);
check('a cut file opens to nothing', S.openStoredText(sealed.slice(0, sealed.length - 8), key).ok === false);
check('a prefix with nothing after opens to nothing', S.openStoredText(S.SEALED_PREFIX, key).ok === false);
check('a prefix with junk opens to nothing', S.openStoredText(S.SEALED_PREFIX + '!!!!', key).ok === false);

// 4: plain files from before sealing.
const legacy = '{"savedAt":"2026-10-01T10:00:00Z","tables":{}}';
const openedLegacy = S.openStoredText(legacy, key);
check('a plain file opens as it is', openedLegacy.ok && openedLegacy.text === legacy && openedLegacy.wasSealed === false);
check('a plain file opens even with no key', S.openStoredText(legacy, null).ok === true);

// Bad inputs to sealText throw rather than seal weakly.
let threw = false;
try { S.sealText('x', random(16), random(24)); } catch { threw = true; }
check('a short key throws', threw);
threw = false;
try { S.sealText('x', key, random(12)); } catch { threw = true; }
check('a short nonce throws', threw);

// 5: base64 agrees with partnerCrypto's.
for (const n of [0, 1, 2, 3, 4, 5, 100, 1001, 70000]) {
  const bytes = random(n);
  const fast = S.bytesToBase64Fast(bytes);
  check(`base64 of ${n} bytes matches`, fast === P.bytesToBase64(bytes));
  const back = S.base64ToBytesFast(fast);
  check(`base64 of ${n} bytes reads back`, back && back.length === n && Buffer.from(back).equals(Buffer.from(bytes)));
}
check('base64 refuses a stray character', S.base64ToBytesFast('ab$d') === null);
check('base64 refuses an impossible length', S.base64ToBytesFast('abcde') === null);

// The seal is secretbox, so its numbers are the library's.
check('key length is secretbox', S.SEAL_KEY_BYTES === nacl.secretbox.keyLength);
check('nonce length is secretbox', S.SEAL_NONCE_BYTES === nacl.secretbox.nonceLength);

// 6: every read and write of the sync copies goes through the seal.
const device = fs.readFileSync(path.join(LIB, 'snapshotSyncDevice.ts'), 'utf8');
check('sync device imports the seal', device.includes("from './localSealKey'"));
const plainWrites = device.match(/new File\(Paths\.document, [^)]*\)\.write\(/g) || [];
check('no sync copy is written plain', plainWrites.length === 1 && device.includes('.write(await sealForThisDevice(text))'));
check('no sync copy is read with textSync', !device.includes('textSync()'));
check('a plain file is sealed when read', device.includes('!isSealedText(stored)'));
check('the merge base goes through the seal', /readSealedFile\(MERGE_BASE_FILE_NAME\)/.test(device) && /writeSealedFile\(MERGE_BASE_FILE_NAME/.test(device));
const keyFile = fs.readFileSync(path.join(LIB, 'localSealKey.ts'), 'utf8');
check('the key lives in secure store', keyFile.includes("import('expo-secure-store')") && keyFile.includes('setItemAsync'));
check('the nonce comes from expo-crypto', keyFile.includes('getRandomBytesAsync(SEAL_NONCE_BYTES)'));

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log('All local seal checks pass.');
