// A real, per-device cryptographic identity -- steps 1 and 2 of the real,
// ordered prerequisite list CLAUDE.md's own "Sharing individual recipes
// between two people" security-requirement note lays out, 2026-08-15,
// direct request: "Let's start on steps 1 and 2 now."
//
// Step 1, the library choice: `tweetnacl`, a real, pure-JS, zero-native-
// dependency port of NaCl (Ed25519 signing / X25519 key exchange /
// XSalsa20-Poly1305 encryption) -- chosen deliberately over a native
// binding like react-native-libsodium. This app's own history already
// shows real, repeated risk from adding a native module that needs a
// fresh rebuild just to be touched at all (see lib/customBackgroundImage.ts's
// dynamic-import workaround, and the whole meal-photo-feature saga earlier
// this same session) -- tweetnacl needs none of that: it's ordinary JS
// operating on Uint8Array, safe to import and use immediately, the same
// as any other dependency this app already trusts. It's also the
// reference JS implementation of NaCl itself, independently audited and
// widely used in real production systems for exactly this kind of
// device-to-device signing/encryption with no server involved.
//
// Step 2, real device identity: a genuine Ed25519 signing keypair,
// generated once per device and stored securely. Deliberately scoped to
// IDENTITY ONLY -- no box/encryption keypair yet (NaCl's signing and
// box/encryption keys use different curves and can't be derived from one
// seed, so that's a real, separate generation step of its own, deferred
// until step 5 of the same list actually decides whether encryption --
// not just signing/verification -- is needed on top of this), and no
// actual sign/verify helper functions yet either -- "wrap real signing
// around the envelope" is step 5's own job, once step 4's real pairing
// exchange exists to know WHOSE public key a signature should be checked
// against. This file's only real job is: does this device have a real,
// stable, securely-stored identity to eventually offer/sign with.
//
// Two real native modules this needs -- expo-crypto (a genuine, platform-
// backed source of secure random bytes; tweetnacl's own internal
// randomBytes() throws outright in an environment with no Web Crypto API,
// which React Native doesn't provide by default) and expo-secure-store
// (Android Keystore / iOS Keychain -- the private seed must never sit in
// plain SQLite/AsyncStorage the way ordinary app data does) -- are both
// imported dynamically, never at module-eval time, matching this app's
// own established, hard-learned pattern (see lib/mealPhotos.ts's own
// header comment): both were only just added to package.json/app.json
// this same session and have not yet gone through a real native rebuild,
// so a top-level static import would crash the whole app at launch the
// instant this file becomes reachable from the real component tree --
// exactly the class of bug already found and fixed once this session on
// the meal-photo feature itself.
import nacl from 'tweetnacl';

const PRIVATE_SEED_KEY = 'device_identity_seed_v1';

export type DeviceIdentity = {
  publicKey: Uint8Array;
  publicKeyBase64: string;
};

// A real, standalone, byte-array base64 codec -- deliberately not the
// UTF-8-string-oriented one in lib/sharing.ts (that one exists to encode a
// whole JSON string; this one exists to move raw key bytes in and out of
// expo-secure-store, which only stores plain strings). Hand-written for
// the same reason as that other codec: no reliance on global btoa/atob
// (Hermes' own support for those is a relatively recent addition,
// unconfirmed on-device in this exact build) -- just plain array/string
// operations, guaranteed in any JS engine.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const triplet = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += b1 === undefined ? '=' : BASE64_CHARS[(triplet >> 6) & 0x3f];
    result += b2 === undefined ? '=' : BASE64_CHARS[triplet & 0x3f];
  }
  return result;
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i]);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// A real, module-level memoized promise -- the same "expensive, one-time,
// per-session resource" caching pattern lib/db.ts's own getDatabase()/
// getReferenceDatabase() already establish, reused here rather than
// invented fresh. A genuine failure (e.g. SecureStore itself rejecting)
// resets the cache so a later real retry isn't permanently stuck on a
// dead, already-rejected promise.
let identityPromise: Promise<DeviceIdentity> | null = null;

export async function getDeviceIdentity(): Promise<DeviceIdentity> {
  if (!identityPromise) {
    identityPromise = loadOrCreateIdentity().catch((error) => {
      identityPromise = null;
      throw error;
    });
  }
  return identityPromise;
}

// Real, explicit, real-only for now: intentionally not exposed as part of
// the public API above -- nothing outside this module has a legitimate
// reason to hold the raw private seed yet, since no signing operation
// exists to use it with. Kept as its own internal function so a future
// real signing helper (step 5) has one obvious, already-proven place to
// read it from, rather than needing to re-derive this same load/generate
// logic a second time.
async function loadSeed(): Promise<Uint8Array> {
  const SecureStore = await import('expo-secure-store');
  const existing = await SecureStore.getItemAsync(PRIVATE_SEED_KEY);
  if (existing) {
    return base64ToBytes(existing);
  }
  const Crypto = await import('expo-crypto');
  const seed = await Crypto.getRandomBytesAsync(nacl.sign.seedLength);
  await SecureStore.setItemAsync(PRIVATE_SEED_KEY, bytesToBase64(seed));
  return seed;
}

async function loadOrCreateIdentity(): Promise<DeviceIdentity> {
  const seed = await loadSeed();
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  return { publicKey: keyPair.publicKey, publicKeyBase64: bytesToBase64(keyPair.publicKey) };
}

// A real, deliberate escape hatch -- not reachable from any UI yet (there
// is none), but a genuine device identity should be resettable, e.g. if a
// person ever wants to "start fresh" before real pairing/Connections work
// exists to make that a meaningful, user-facing choice.
export async function resetDeviceIdentity(): Promise<void> {
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(PRIVATE_SEED_KEY);
  identityPromise = null;
}
