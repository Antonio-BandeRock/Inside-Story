// Sealing a file the app keeps for itself in private storage. App Lock
// step 1 (docs/app-lock-phase0-audit.md, finding 3): the copies of the
// database that sync keeps beside it were plain JSON, so anybody who copied
// the app's files read everything in them. They are now sealed with a key
// that never leaves this device (lib/localSealKey.ts).
//
// Pure, with no I/O, so scripts/test_local_seal.js can check it without a
// phone. The nonce is handed in rather than drawn here, because tweetnacl's
// own randomBytes throws in React Native.
//
// A sealed file is one line: SEALED_PREFIX, then base64 of the 24-byte
// nonce followed by the secretbox. Anything not starting with the prefix is
// a file written before this step, which openStoredText hands back as it is
// so an upgrade loses nothing; the next write seals it.

import nacl from 'tweetnacl';

export const SEALED_PREFIX = 'inside-story-sealed-1:';
export const SEAL_KEY_BYTES = nacl.secretbox.keyLength;
export const SEAL_NONCE_BYTES = nacl.secretbox.nonceLength;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = (() => {
  const index = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64.length; i += 1) index[B64.charCodeAt(i)] = i;
  return index;
})();

// These copies run to megabytes, so the base64 here is built in chunks
// rather than one character at a time.
export function bytesToBase64Fast(bytes: Uint8Array): string {
  const parts: string[] = [];
  const chunk: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b = has1 ? bytes[i + 1] : 0;
    const c = has2 ? bytes[i + 2] : 0;
    chunk.push(
      B64[a >> 2] +
        B64[((a & 3) << 4) | (b >> 4)] +
        (has1 ? B64[((b & 15) << 2) | (c >> 6)] : '=') +
        (has2 ? B64[c & 63] : '='),
    );
    if (chunk.length === 4096) {
      parts.push(chunk.join(''));
      chunk.length = 0;
    }
  }
  parts.push(chunk.join(''));
  return parts.join('');
}

export function base64ToBytesFast(value: string): Uint8Array | null {
  let length = value.length;
  while (length > 0 && value[length - 1] === '=') length -= 1;
  if (length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let at = 0;
  for (let i = 0; i < length; i += 1) {
    const code = value.charCodeAt(i);
    const digit = code < 128 ? B64_INDEX[code] : -1;
    if (digit < 0) return null;
    buffer = ((buffer << 6) | digit) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[at] = (buffer >> bits) & 0xff;
      at += 1;
    }
  }
  return out;
}

export function isSealedText(stored: string): boolean {
  return stored.startsWith(SEALED_PREFIX);
}

/** Seals text under `key` with the given 24 random bytes as its nonce. */
export function sealText(text: string, key: Uint8Array, nonce: Uint8Array): string {
  if (key.length !== SEAL_KEY_BYTES) throw new Error('A seal key is 32 bytes.');
  if (nonce.length !== SEAL_NONCE_BYTES) throw new Error('A seal nonce is 24 bytes.');
  const box = nacl.secretbox(new TextEncoder().encode(text), nonce, key);
  const joined = new Uint8Array(nonce.length + box.length);
  joined.set(nonce, 0);
  joined.set(box, nonce.length);
  return SEALED_PREFIX + bytesToBase64Fast(joined);
}

export type OpenedText = { ok: true; text: string; wasSealed: boolean } | { ok: false };

/**
 * Opens what sealText wrote. A file from before sealing comes back as it
 * is, marked wasSealed false so the caller can seal it on the next write.
 * A sealed file that does not open under `key` (another device's, or
 * damaged) is a failure, never a guess.
 */
export function openStoredText(stored: string, key: Uint8Array | null): OpenedText {
  if (!isSealedText(stored)) return { ok: true, text: stored, wasSealed: false };
  if (!key || key.length !== SEAL_KEY_BYTES) return { ok: false };
  const joined = base64ToBytesFast(stored.slice(SEALED_PREFIX.length));
  if (!joined || joined.length < SEAL_NONCE_BYTES + nacl.secretbox.overheadLength) return { ok: false };
  const opened = nacl.secretbox.open(joined.subarray(SEAL_NONCE_BYTES), joined.subarray(0, SEAL_NONCE_BYTES), key);
  if (!opened) return { ok: false };
  return { ok: true, text: new TextDecoder().decode(opened), wasSealed: true };
}
