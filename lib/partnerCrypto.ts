// Encrypting something so that only one specific partner can read it.
//
// WHY THIS EXISTS NOW. Everything shared between two phones so far has been
// SIGNED and not encrypted, which was the right call while the only carrier was
// a file the two people handed to each other directly: a signature answers "did
// this really come from them", and nobody else was ever holding the bytes.
//
// The cloud inbox changes that. A partner's meal plan and condition codes will
// sit in a storage folder, and a signature does nothing to stop whoever can
// reach that folder from reading it. So the payload has to be unreadable to
// anyone but its recipient.
//
// WHAT THIS IS NOT. This does not replace signing, it wraps it. The order is
// sign, THEN encrypt: the recipient decrypts and is then left holding exactly
// the signed envelope lib/sharing.ts already knows how to verify. Encrypting
// first and signing the ciphertext would only prove who uploaded a blob, not
// who wrote what is inside it.
//
// THE SHAPE. A sealed box, the standard NaCl pattern for "encrypt to a public
// key": the sender makes a throwaway keypair, encrypts to the recipient with
// it, and sends the throwaway public key along. tweetnacl-js does not ship
// nacl.box.seal, so it is assembled here from nacl.box, which is the same
// construction libsodium's own sealed box uses.
//
// Two things fall out of using a throwaway key rather than the sender's own.
// The recipient needs nothing from the sender to decrypt beyond what travels
// with the message, so this works even before the two sides have exchanged
// encryption keys in both directions. And each message uses a key that exists
// for one message only, so a secret recovered later cannot open messages
// already sent.
//
// Kept pure and free of native modules on purpose: every key and every random
// byte is passed IN. That is what lets the whole format be tested in plain
// node, which matters because a mistake here is silent. Wrong nonce handling or
// a mis-sliced header does not throw, it just produces bytes that never open,
// or worse, bytes that look encrypted and are not.
import nacl from 'tweetnacl';

/** Version 1 of the sealed-blob layout. Written into the blob so a later change can be told apart. */
export const SEALED_BLOB_VERSION = 1;

export const EPHEMERAL_KEY_BYTES = nacl.box.publicKeyLength; // 32
export const NONCE_BYTES = nacl.box.nonceLength; // 24
/** The fixed part before the ciphertext: one version byte, the throwaway public key, the nonce. */
export const SEALED_HEADER_BYTES = 1 + EPHEMERAL_KEY_BYTES + NONCE_BYTES;

/**
 * How many random bytes a caller has to supply to seal one message.
 *
 * Named rather than left for the caller to work out, because getting it wrong
 * is the exact kind of mistake that produces a weak nonce or a weak throwaway
 * key without anything failing visibly.
 */
export const SEAL_RANDOM_BYTES = 32 + NONCE_BYTES;

/** Turns raw bytes into base64 without relying on btoa, which React Native does not provide. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const c = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? '=' : B64[c & 63];
  }
  return out;
}

export function base64ToBytes(value: string): Uint8Array {
  const clean = value.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const index = B64.indexOf(char);
    if (index === -1) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Derives the encryption keypair from the device's existing root secret.
 *
 * The signing key and the encryption key sit on different curves and one cannot
 * be turned into the other, which is exactly why lib/deviceIdentity.ts's own
 * header comment scoped encryption out when it was written. They CAN both come
 * from one root secret though, which keeps a single value in secure storage
 * rather than two.
 *
 * The domain tag is what makes that safe. Hashing the seed with a fixed,
 * purpose-specific label means the encryption key is independent of the signing
 * key even though both descend from the same bytes. Feeding the raw seed
 * straight into both would be reusing one secret across two algorithms, which
 * is the thing this avoids.
 */
export const ENCRYPTION_KEY_DOMAIN_TAG = 'inside-story/encryption-key/v1';

export function deriveEncryptionKeyPair(rootSeed: Uint8Array): nacl.BoxKeyPair {
  const tag = new TextEncoder().encode(ENCRYPTION_KEY_DOMAIN_TAG);
  const input = new Uint8Array(tag.length + rootSeed.length);
  input.set(tag, 0);
  input.set(rootSeed, tag.length);
  // SHA-512, first half. The seed a box keypair needs is 32 bytes.
  const derived = nacl.hash(input).slice(0, nacl.box.secretKeyLength);
  return nacl.box.keyPair.fromSecretKey(derived);
}

/**
 * Seals a message so only the holder of `recipientPublicKey` can read it.
 *
 * `random` has to be exactly SEAL_RANDOM_BYTES of real cryptographic randomness
 * and must never be reused. It is passed in rather than generated here so this
 * function stays pure and testable; the caller in lib/deviceIdentity.ts gets it
 * from expo-crypto, since tweetnacl's own randomBytes throws outright in React
 * Native, which provides no Web Crypto API.
 */
export function sealTo(message: Uint8Array, recipientPublicKey: Uint8Array, random: Uint8Array): string {
  if (recipientPublicKey.length !== nacl.box.publicKeyLength) {
    throw new Error(`A recipient key must be ${nacl.box.publicKeyLength} bytes, got ${recipientPublicKey.length}.`);
  }
  if (random.length !== SEAL_RANDOM_BYTES) {
    throw new Error(`Sealing needs exactly ${SEAL_RANDOM_BYTES} random bytes, got ${random.length}.`);
  }

  const ephemeral = nacl.box.keyPair.fromSecretKey(random.slice(0, 32));
  const nonce = random.slice(32);
  const ciphertext = nacl.box(message, nonce, recipientPublicKey, ephemeral.secretKey);

  const blob = new Uint8Array(SEALED_HEADER_BYTES + ciphertext.length);
  blob[0] = SEALED_BLOB_VERSION;
  blob.set(ephemeral.publicKey, 1);
  blob.set(nonce, 1 + EPHEMERAL_KEY_BYTES);
  blob.set(ciphertext, SEALED_HEADER_BYTES);
  return bytesToBase64(blob);
}

/**
 * Opens a sealed blob, or returns null.
 *
 * Null for every failure rather than throwing, and deliberately without saying
 * WHICH failure: a truncated blob, an unknown version, a wrong recipient and a
 * tampered ciphertext all read the same from here. This sits on the "is a
 * received payload trustworthy" boundary, the same discipline
 * verifySignature and decodeShareEnvelope already follow.
 */
export function openSealed(blobBase64: string, recipientSecretKey: Uint8Array): Uint8Array | null {
  try {
    const blob = base64ToBytes(blobBase64);
    // No explicit length guard here on purpose. One was written and then
    // removed: nacl.box.open already refuses a short or empty ciphertext, so a
    // length check could not be made to fail a test, and this project's own
    // rule is that a check which cannot fail is worth nothing. The version
    // check below is load-bearing and does have a test that isolates it.
    if (blob[0] !== SEALED_BLOB_VERSION) return null;
    const ephemeralPublicKey = blob.slice(1, 1 + EPHEMERAL_KEY_BYTES);
    const nonce = blob.slice(1 + EPHEMERAL_KEY_BYTES, SEALED_HEADER_BYTES);
    const ciphertext = blob.slice(SEALED_HEADER_BYTES);
    const opened = nacl.box.open(ciphertext, nonce, ephemeralPublicKey, recipientSecretKey);
    return opened ?? null;
  } catch {
    return null;
  }
}

/**
 * Whether a stored partner key is usable for encryption at all.
 *
 * A partner paired before encryption keys existed has none, and the screens
 * need to say so plainly rather than appear ready to share.
 */
export function canEncryptTo(publicKeyBase64: string | null | undefined): boolean {
  if (typeof publicKeyBase64 !== 'string' || !publicKeyBase64.trim()) return false;
  try {
    return base64ToBytes(publicKeyBase64).length === nacl.box.publicKeyLength;
  } catch {
    return false;
  }
}
