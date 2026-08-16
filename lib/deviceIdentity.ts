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
// IDENTITY ONLY -- no box/encryption keypair (NaCl's signing and box/
// encryption keys use different curves and can't be derived from one
// seed, so that's a real, separate generation step of its own, only worth
// adding if a future pass decides true confidentiality -- not just
// signing/verification -- is needed on top of this; step 5, below, covers
// signing and verification only, matching the roadmap's own explicit
// "if true confidentiality is wanted" framing as a separate, optional
// extension). Step 5's own real signMessage()/verifySignature() live at
// the bottom of this file, once step 4's real pairing exchange existed to
// know whose public key a signature should be checked against.
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
// operations, guaranteed in any JS engine. Exported 2026-08-15 (step 5) --
// lib/sharing.ts needs the identical real job (moving raw signature bytes,
// not a JSON string, in and out of a URL-safe form) once real signing
// exists there, reused directly rather than duplicated a third time.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
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

export function base64ToBytes(base64: string): Uint8Array {
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

// Deliberately still private -- the raw seed itself never leaves this
// module, even now that step 5 (below) has a real, legitimate reason to
// touch it. signMessage() re-derives the full keypair from this seed each
// time it's called rather than caching it anywhere, a real, deliberate
// security tradeoff: signing is a genuinely infrequent operation (once per
// share, not a hot path), so the small, real cost of re-deriving from seed
// every time is worth it to keep the raw secret key out of memory for
// longer than one signing operation actually needs it.
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

// Step 5, 2026-08-15, direct request: "Let's start on step 5" -- real
// Ed25519 signing, wrapped around the ShareEnvelope shape lib/sharing.ts
// already defines. This is the one real function anywhere in the app that
// ever touches the full keypair/secret key -- every other module that
// needs something signed calls this, never handles the raw secret key
// itself, keeping the sensitive key material encapsulated in exactly one
// place. nacl.sign.detached produces a real, standalone 64-byte signature
// separate from the message itself (not nacl.sign's own combined
// signature-plus-message output), the right shape here since the message
// (the envelope's own JSON) already travels in the clear right alongside
// it -- there's nothing to gain from bundling them into one opaque blob.
export async function signMessage(message: Uint8Array): Promise<Uint8Array> {
  const seed = await loadSeed();
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  return nacl.sign.detached(message, keyPair.secretKey);
}

// The real verification half -- a plain, synchronous, pure function (no
// private key or async work needed at all; checking a signature only ever
// needs the PUBLIC key, which travels with the message). Returns false for
// a genuinely malformed base64/signature/key rather than throwing, since
// this sits directly on the "is a received payload trustworthy" boundary
// -- a decode error there should read exactly the same as "the signature
// didn't check out," not crash the receiving screen.
export function verifySignature(message: Uint8Array, signature: Uint8Array, publicKeyBase64: string): boolean {
  try {
    const publicKey = base64ToBytes(publicKeyBase64);
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
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

// Step 4, 2026-08-15 -- a real, short, human-readable "safety number"-style
// fingerprint of a public key, the same real idea Signal's own device
// verification already uses: nothing in this app FORCES two people to
// compare it, but it gives them something real and honest to read out
// loud/compare over a separate channel if they want genuine, independent
// confidence a pairing invite really came from who it claims to -- real
// value specifically because pairing itself has no other way to verify an
// invite (there's nothing to check a signature against until AFTER the
// key exchange this fingerprint is helping verify). A real SHA-512 hash
// (nacl.hash, the same already-installed tweetnacl this whole feature is
// built on -- no new dependency), first 8 of its 64 real bytes, rendered
// as 4 groups of 4 hex characters for readability (e.g. "3F2A 9B10 7C44
// E812").
export function computeKeyFingerprint(publicKeyBase64: string): string {
  const digest = nacl.hash(base64ToBytes(publicKeyBase64));
  const hex = Array.from(digest.slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  return hex.match(/.{1,4}/g)!.join(' ');
}

export async function getMyKeyFingerprint(): Promise<string> {
  const identity = await getDeviceIdentity();
  return computeKeyFingerprint(identity.publicKeyBase64);
}
