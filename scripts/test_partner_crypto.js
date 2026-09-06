// Runs lib/partnerCrypto.ts: sealing a payload so only one partner can read it.
//
// Built 2026-09-06, ahead of the cloud inbox. Everything shared so far has been
// signed and not encrypted, which was right while the only carrier was a file
// handed over in person. Once a partner's meal plan and condition codes sit in a
// storage folder, a signature does nothing to stop whoever can reach that folder
// from reading them.
//
// The risks, in order:
//
//  1. FAILURE HERE IS SILENT. Wrong nonce handling, a mis-sliced header, or a
//     reused throwaway key does not throw. It produces bytes that never open,
//     or worse, bytes that look encrypted and are not. Nothing on screen would
//     look different either way.
//  2. THE TWO DERIVED KEYS MUST BE INDEPENDENT. The encryption key comes from
//     the same root secret as the signing key, which is only safe because of the
//     domain tag. Drop the tag and one secret is being reused across two
//     algorithms.
//  3. THE WRONG RECIPIENT MUST GET NOTHING. Not an error, not a partial read:
//     nothing.
//  4. TAMPERING MUST FAIL CLOSED. A flipped byte anywhere has to come back null
//     rather than decrypt to something.
//  5. A PARTNER WITH NO KEY MUST BE DETECTABLE, since anyone paired before this
//     existed has none, and the screens have to say so rather than look ready.
//
// Run with: node scripts/test_partner_crypto.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const LIB = path.join(__dirname, '..', 'lib');
const REAL_PACKAGES = new Set(['tweetnacl']);

function throwingStub(what) {
  return new Proxy(
    {},
    {
      get(_unused, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return throwingStub(what);
        throw new Error(`This harness stubs ${what}; it cannot provide ${String(prop)}.`);
      },
    },
  );
}

function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (REAL_PACKAGES.has(request)) return require(request);
    if (!request.startsWith('./')) return throwingStub(request);
    const target = request.slice(2);
    if (target === 'db') return throwingStub('lib/db.ts');
    return loadModule(target, cache);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const C = loadModule('partnerCrypto');
const {
  SEALED_BLOB_VERSION, SEALED_HEADER_BYTES, SEAL_RANDOM_BYTES, NONCE_BYTES, EPHEMERAL_KEY_BYTES,
  ENCRYPTION_KEY_DOMAIN_TAG, deriveEncryptionKeyPair, sealTo, openSealed, canEncryptTo,
  bytesToBase64, base64ToBytes,
} = C;
const nacl = require('tweetnacl');

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }
function checkFalse(label, actual) { check(label, actual === false, true); }

// Fixed inputs so a failure is reproducible rather than dependent on the run.
const seedA = new Uint8Array(32).fill(11);
const seedB = new Uint8Array(32).fill(22);
const text = (s) => new TextEncoder().encode(s);
const str = (b) => new TextDecoder().decode(b);

// Deterministic stand-in for expo-crypto's randomness. Fine for tests, and the
// reuse case below is exactly what makes it useful here.
//
// Every byte DIFFERS on purpose. A buffer filled with one repeated value looked
// fine and hid a real bug: slicing the nonce one byte off the correct offset
// produced a byte-identical array, so the mistake was invisible. That is the
// third time in this project a fixture uniform enough to satisfy two different
// rules has tested neither.
function fakeRandom(seed) {
  const out = new Uint8Array(SEAL_RANDOM_BYTES);
  for (let i = 0; i < out.length; i += 1) out[i] = (seed * 37 + i * 11 + 1) & 0xff;
  return out;
}

// --- 1. Layout ---------------------------------------------------------------

check('the header is a version byte plus a key plus a nonce',
  SEALED_HEADER_BYTES, 1 + EPHEMERAL_KEY_BYTES + NONCE_BYTES);
check('a throwaway key is 32 bytes', EPHEMERAL_KEY_BYTES, 32);
check('a nonce is 24 bytes', NONCE_BYTES, 24);
check('sealing needs a key seed plus a nonce worth of randomness', SEAL_RANDOM_BYTES, 32 + 24);

// --- 2. The two derived keys are independent ---------------------------------

const boxA = deriveEncryptionKeyPair(seedA);
const signA = nacl.sign.keyPair.fromSeed(seedA);

check('an encryption public key is 32 bytes', boxA.publicKey.length, 32);
checkFalse('the encryption key is not the signing key',
  bytesToBase64(boxA.publicKey) === bytesToBase64(signA.publicKey));
checkFalse('and it is not the raw seed either',
  bytesToBase64(boxA.secretKey) === bytesToBase64(seedA));

// This is the check that catches the domain tag being dropped. Hashing the seed
// with no tag, or with a different one, must not land on the same key.
const untagged = nacl.box.keyPair.fromSecretKey(nacl.hash(seedA).slice(0, 32));
checkFalse('the domain tag actually changes the derived key',
  bytesToBase64(boxA.publicKey) === bytesToBase64(untagged.publicKey));
checkTrue('the tag is a real, purpose-specific label',
  typeof ENCRYPTION_KEY_DOMAIN_TAG === 'string' && ENCRYPTION_KEY_DOMAIN_TAG.includes('encryption'));

// Deriving twice from one seed has to land in the same place, or a device would
// lose the ability to read its own mail after a restart.
check('derivation is stable across calls',
  bytesToBase64(deriveEncryptionKeyPair(seedA).publicKey), bytesToBase64(boxA.publicKey));
checkFalse('two different seeds give two different keys',
  bytesToBase64(deriveEncryptionKeyPair(seedB).publicKey) === bytesToBase64(boxA.publicKey));

// --- 3. The round trip -------------------------------------------------------

const boxB = deriveEncryptionKeyPair(seedB);
const secret = 'Thursday: salmon with leeks. Conditions: hashimotos, celiac.';
const sealed = sealTo(text(secret), boxB.publicKey, fakeRandom(7));

checkTrue('a sealed blob is base64', /^[A-Za-z0-9+/=]+$/.test(sealed));
check('the recipient reads it back exactly', str(openSealed(sealed, boxB.secretKey)), secret);
check('the version byte is written into the blob', base64ToBytes(sealed)[0], SEALED_BLOB_VERSION);

// The whole point. Anyone holding the folder sees this and no more.
checkFalse('the plaintext is not sitting in the blob', sealed.includes('salmon'));
checkFalse('and neither are the condition codes', sealed.includes('hashimotos'));
checkTrue('the blob is longer than its header', base64ToBytes(sealed).length > SEALED_HEADER_BYTES);

// --- 4. The wrong reader gets nothing ---------------------------------------

check('the sender cannot open their own sealed message', openSealed(sealed, boxA.secretKey), null);
check('an unrelated key opens nothing',
  openSealed(sealed, deriveEncryptionKeyPair(new Uint8Array(32).fill(99)).secretKey), null);

// --- 5. Tampering fails closed ----------------------------------------------

function tamper(blobBase64, byteIndex) {
  const bytes = base64ToBytes(blobBase64);
  bytes[byteIndex] = (bytes[byteIndex] + 1) & 0xff;
  return bytesToBase64(bytes);
}

const raw = base64ToBytes(sealed);
check('a flipped version byte is refused', openSealed(tamper(sealed, 0), boxB.secretKey), null);
check('a flipped throwaway key is refused', openSealed(tamper(sealed, 3), boxB.secretKey), null);
check('a flipped nonce is refused', openSealed(tamper(sealed, 1 + EPHEMERAL_KEY_BYTES + 2), boxB.secretKey), null);
check('a flipped ciphertext byte is refused', openSealed(tamper(sealed, raw.length - 1), boxB.secretKey), null);

check('a truncated blob is refused', openSealed(sealed.slice(0, 20), boxB.secretKey), null);
check('an empty blob is refused', openSealed('', boxB.secretKey), null);
check('rubbish is refused', openSealed('not a blob at all', boxB.secretKey), null);
check('a header with no ciphertext is refused',
  openSealed(bytesToBase64(new Uint8Array(SEALED_HEADER_BYTES)), boxB.secretKey), null);

// --- 6. Sealing refuses bad inputs loudly ------------------------------------
//
// These throw rather than return null, on purpose. Opening is a boundary that
// handles hostile input, so it fails quietly. Sealing is this app calling its
// own code, and a short random buffer or a wrong-sized key is a bug here, not
// something that arrived from outside.

function throws(fn) {
  try { fn(); return false; } catch { return true; }
}
checkTrue('a short random buffer throws', throws(() => sealTo(text('x'), boxB.publicKey, new Uint8Array(10))));
checkTrue('a long random buffer throws', throws(() => sealTo(text('x'), boxB.publicKey, new Uint8Array(200))));
checkTrue('a wrong-sized recipient key throws', throws(() => sealTo(text('x'), new Uint8Array(16), fakeRandom(1))));

// --- 7. Randomness is actually used -----------------------------------------

// Two seals of the same message with different randomness must differ. If they
// match, the nonce or the throwaway key is not coming from the random buffer.
const twice1 = sealTo(text('same message'), boxB.publicKey, fakeRandom(3));
const twice2 = sealTo(text('same message'), boxB.publicKey, fakeRandom(4));
checkFalse('the same message sealed twice with different randomness differs', twice1 === twice2);
check('and both still open', [str(openSealed(twice1, boxB.secretKey)), str(openSealed(twice2, boxB.secretKey))],
  ['same message', 'same message']);

// Reused randomness producing an identical blob is correct behaviour for a pure
// function, and is exactly why the caller must never reuse it. Asserted so the
// requirement is written down rather than assumed.
checkTrue('reused randomness reproduces the blob, which is why it must not be reused',
  sealTo(text('same message'), boxB.publicKey, fakeRandom(3)) === twice1);

// The two checks above are NOT enough on their own, which mutation testing
// showed: replacing the nonce with a fixed block of zeroes still produced
// different blobs, because the throwaway key alone was varying. So the nonce is
// pinned to the random buffer directly. A fixed nonce is a real weakness even
// with a fresh key each time, and nothing visible would change.
{
  const random = fakeRandom(31);
  const blob = base64ToBytes(sealTo(text('pin the nonce'), boxB.publicKey, random));
  const nonceInBlob = blob.slice(1 + EPHEMERAL_KEY_BYTES, SEALED_HEADER_BYTES);
  check('the nonce written into the blob is the caller-supplied randomness',
    bytesToBase64(nonceInBlob), bytesToBase64(random.slice(32)));
  const keyInBlob = blob.slice(1, 1 + EPHEMERAL_KEY_BYTES);
  check('and the throwaway key is derived from the first half of it',
    bytesToBase64(keyInBlob), bytesToBase64(nacl.box.keyPair.fromSecretKey(random.slice(0, 32)).publicKey));
  checkFalse('the nonce is not a block of zeroes', nonceInBlob.every((b) => b === 0));
}

// --- 8. A partner with no key --------------------------------------------------

checkFalse('a partner paired before encryption existed is not encryptable', canEncryptTo(null));
checkFalse('an empty key is not encryptable', canEncryptTo(''));
checkFalse('whitespace is not encryptable', canEncryptTo('   '));
checkFalse('a short key is not encryptable', canEncryptTo(bytesToBase64(new Uint8Array(16))));
checkFalse('a long key is not encryptable', canEncryptTo(bytesToBase64(new Uint8Array(64))));
checkFalse('rubbish is not encryptable', canEncryptTo('!!!!'));
checkTrue('a real encryption key is encryptable', canEncryptTo(bytesToBase64(boxB.publicKey)));

// --- 9. Size, since this travels ----------------------------------------------

// The overhead is fixed: header plus NaCl's own 16-byte authentication tag.
const overhead = base64ToBytes(sealTo(text(''), boxB.publicKey, fakeRandom(5))).length;
check('sealing an empty message costs only the header and the auth tag', overhead, SEALED_HEADER_BYTES + 16);

const week = 'x'.repeat(1400);
const sealedWeek = base64ToBytes(sealTo(text(week), boxB.publicKey, fakeRandom(6))).length;
checkTrue('a week-sized payload grows by well under 10 percent', sealedWeek < week.length * 1.1);

if (failures) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`${checks}/${checks} checks passed`);
