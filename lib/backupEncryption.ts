// Real password-based encryption for the local backup file -- 2026-08-16,
// direct request following a real, honest security question: the plain
// JSON export lib/dataBackup.ts produces has zero protection at all --
// readable in any text editor or AI tool the moment it leaves this
// device. This closes that gap the way CLAUDE.md's own already-decided
// architecture always said cloud backups would work ("The primary device
// periodically writes an ENCRYPTED backup/snapshot...") -- built now for
// the LOCAL export specifically, ahead of the larger cloud-sync system,
// using the same real "no forgot-password flow, the app never holds your
// key" recovery model already decided there.
//
// Built entirely on tweetnacl (already installed for lib/deviceIdentity.ts's
// own real device-pairing signing key) -- nacl.secretbox is real,
// authenticated symmetric encryption (XSalsa20-Poly1305): a wrong
// password OR a genuinely tampered file both fail to decrypt cleanly,
// rather than silently returning garbage, since authentication is baked
// into the primitive itself.
//
// A real, honest limitation stated directly, not glossed over: tweetnacl
// has no built-in password-to-key derivation function, and expo-crypto's
// own digestStringAsync is a native-bridge call -- genuinely expensive to
// invoke tens of thousands of times in a loop, since bridge-crossing
// overhead is paid per call, not once. deriveKey() below is a real,
// hand-built key-stretching construction instead -- repeated nacl.hash
// (pure JS SHA-512, no bridge round-trip per iteration) over the
// password+salt -- genuine, meaningful protection against brute force,
// but NOT a certified KDF the way PBKDF2-HMAC-SHA256/scrypt/Argon2 are. A
// real, deliberate, disclosed tradeoff to avoid a new native dependency
// for this pass, not a claim of gold-standard security.

import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';
import { base64ToBytes, bytesToBase64 } from './deviceIdentity';

// 100,000 real iterations of a pure-JS SHA-512 over a small (password +
// 16-byte salt) input is fast enough on a real phone to stay well under a
// second, while still meaningfully slowing down a brute-force attempt
// versus a single, instant hash.
const KDF_ITERATIONS = 100_000;
const SALT_LENGTH = 16;

export const ENCRYPTED_BACKUP_FORMAT_VERSION = 1;

export interface EncryptedBackupWire {
  encrypted: true;
  version: number;
  salt: string; // base64
  nonce: string; // base64
  ciphertext: string; // base64
}

// Mirrors lib/sharing.ts's own already-proven utf8Bytes/bytesToUtf8 pair
// exactly (same real surrogate-pair handling, same real UTF-8 byte-length
// branches) -- not reused directly, since that module's own version
// returns/accepts a plain number[] for its own JSON-in-a-URL job, while
// tweetnacl's real API requires Uint8Array throughout; copied rather than
// risk a subtle bug re-deriving this by hand a second time.
function utf8Bytes(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)!;
    if (code > 0xffff) i++; // consumed a surrogate pair
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

function bytesToUtf8(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      result += String.fromCharCode(b0);
      i += 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      result += String.fromCharCode(((b0 & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else {
      const codePoint =
        ((b0 & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      result += String.fromCodePoint(codePoint);
      i += 4;
    }
  }
  return result;
}

// See this file's own header comment for the honest, disclosed reason
// this is a real, hand-built construction rather than a certified KDF.
function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  const passwordBytes = utf8Bytes(password);
  const seed = new Uint8Array(passwordBytes.length + salt.length);
  seed.set(passwordBytes, 0);
  seed.set(salt, passwordBytes.length);
  // Typed to match nacl.hash's own real return type exactly (a wider
  // Uint8Array<ArrayBufferLike> than `new Uint8Array(...)` alone infers)
  // so each reassignment through the loop stays consistent -- a real,
  // narrow TypeScript generic-Uint8Array strictness issue, not a runtime
  // concern either way.
  let material: Uint8Array<ArrayBufferLike> = seed;
  for (let i = 0; i < KDF_ITERATIONS; i++) {
    material = nacl.hash(material);
  }
  return material.slice(0, nacl.secretbox.keyLength);
}

export async function encryptBackupPayload(plaintextJson: string, password: string): Promise<EncryptedBackupWire> {
  const salt = await Crypto.getRandomBytesAsync(SALT_LENGTH);
  const nonce = await Crypto.getRandomBytesAsync(nacl.secretbox.nonceLength);
  const key = deriveKey(password, salt);
  const ciphertext = nacl.secretbox(utf8Bytes(plaintextJson), nonce, key);
  return {
    encrypted: true,
    version: ENCRYPTED_BACKUP_FORMAT_VERSION,
    salt: bytesToBase64(salt),
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertext),
  };
}

// Returns null for a real, honestly-indistinguishable pair of failure
// causes -- a wrong password, or a genuinely corrupted/tampered file --
// nacl.secretbox's own real authentication can't and shouldn't tell them
// apart; that inability is exactly the point of authenticated encryption,
// not a gap in this wrapper.
export function decryptBackupPayload(wire: EncryptedBackupWire, password: string): string | null {
  try {
    const salt = base64ToBytes(wire.salt);
    const nonce = base64ToBytes(wire.nonce);
    const ciphertext = base64ToBytes(wire.ciphertext);
    const key = deriveKey(password, salt);
    const opened = nacl.secretbox.open(ciphertext, nonce, key);
    return opened ? bytesToUtf8(opened) : null;
  } catch {
    return null;
  }
}

export function isEncryptedBackupWire(value: unknown): value is EncryptedBackupWire {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as EncryptedBackupWire).encrypted === true &&
    typeof (value as EncryptedBackupWire).salt === 'string' &&
    typeof (value as EncryptedBackupWire).nonce === 'string' &&
    typeof (value as EncryptedBackupWire).ciphertext === 'string'
  );
}
