// App Lock, the rules with no I/O in them (steps 2 to 4 of
// docs/app-lock-phase0-audit.md: setting the lock up, moving the database
// into an encrypted file, and unlocking). Pure, so
// scripts/test_app_lock.js can check every decision without a phone.
//
// One random 32-byte data key opens the database (SQLCipher, raw key). It is
// never stored bare. Three wrapped copies exist:
//
//  1. Under the passcode: secretbox under a key stretched from the passcode
//     with scrypt. That wrapped copy is itself kept in secure store (the
//     Android Keystore), so a copied set of files gives nobody a six-digit
//     code to try a million times offline (audit finding 1).
//  2. Under the fingerprint or face: the data key in secure store with
//     authentication required. Android voids that Keystore entry when a new
//     fingerprint or face is enrolled, which is what makes R8 hold: the
//     passcode is needed once and the copy is made again.
//  3. Under the recovery key: 160 random bits shown once, grouped, so
//     stretching adds nothing and the wrapped copy can sit in the plain
//     lock file beside the database.
//
// The lock file (app-lock.json) holds settings and the recovery-wrapped
// copy only. No file means no lock, which is how every install starts.

import nacl from 'tweetnacl';
import { scryptAsync } from '@noble/hashes/scrypt';
import { base64ToBytesFast, bytesToBase64Fast } from './localSeal';

export const DATA_KEY_BYTES = nacl.secretbox.keyLength;
export const WRAP_NONCE_BYTES = nacl.secretbox.nonceLength;
export const RECOVERY_KEY_BYTES = 20;
export const KDF_SALT_BYTES = 16;

// scrypt at 4 MB of memory. The wrapped copy sits behind the Keystore, so
// this is a second wall rather than the only one, and a six-digit code has
// only a million possibilities whatever the stretch. scrypt runs in plain
// JavaScript on the phone with no JIT, where 2^14 took about three seconds a
// try and made every unlock wait five (2026-10-03, reported from the phone);
// 2^12 takes under one. The numbers are kept in the lock file, so a later
// version can raise them, and a lock made at other numbers is wrapped again
// at these the next time its passcode opens it (checkPasscode).
export const DEFAULT_KDF = { name: 'scrypt' as const, N: 2 ** 12, r: 8, p: 1 };

export const MIN_PASSCODE_DIGITS = 6;
export const MAX_PASSCODE_DIGITS = 12;
export const MIN_PASSPHRASE_LENGTH = 8;

export const AUTO_LOCK_CHOICES = [0, 1, 5, 15] as const;
export type AutoLockMinutes = (typeof AUTO_LOCK_CHOICES)[number];
export const DEFAULT_AUTO_LOCK_MINUTES: AutoLockMinutes = 1;

export type PasscodeKind = 'digits' | 'phrase';

// decrypting (1.0.60.6): the person asked to turn the lock off and the
// database is being moved back into a plain file. The data key is held bare
// in secure store for that move only, exactly as it is while encrypting.
export type LockPhase = 'encrypting' | 'on' | 'decrypting';

/**
 * What a reminder says while the lock is set up (R9). Full detail is the
 * default since 1.0.62.3, by direct instruction: a reminder that hides what it
 * is about cannot be answered with a tap, and the many reminders this app
 * sends have to be answerable from the shade without unlocking. 'kind' is the
 * person's choice to hide the words. Lock files written before 1.0.62.3 said
 * 'private' for the old default, and read as full detail now.
 */
export type ReminderDetail = 'kind' | 'full';

export type AppLockState = {
  version: 1;
  /** encrypting: set up, waiting for the database to be moved. on: done. */
  phase: LockPhase;
  passcodeKind: PasscodeKind;
  biometric: boolean;
  autoLockMinutes: AutoLockMinutes;
  allowScreenshots: boolean;
  kdf: { name: 'scrypt'; N: number; r: number; p: number; salt: string };
  /** The data key, secretboxed under the recovery key. */
  recoveryWrapped: string;
  setUpAt: string;
  /**
   * Where a reminder answered while locked is sealed to (base64). Anybody
   * can seal to it; only the data key opens what was sealed. Null on a lock
   * file from before 1.0.59.20 until the next unlock writes it.
   */
  answerBoxPublicKey: string | null;
  /** Wrong passcodes in a row since the last one that opened it (R6). */
  failedTries: number;
  /** When the last wrong passcode was typed, in milliseconds, or 0. */
  lastFailedAt: number;
  /** kind: a reminder says only what kind it is. full: its whole text. */
  reminderDetail: ReminderDetail;
  /**
   * The vault (lib/vault.ts): the health records that stay closed while the
   * app is open, until the same code or fingerprint opens them. Off on any
   * lock file written before the vault was built (1.0.63.10).
   */
  vault: boolean;
};

// ---------------------------------------------------------------------------
// The lock file

export function parseLockState(text: string | null): AppLockState | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) return null;
  if (r.phase !== 'encrypting' && r.phase !== 'on' && r.phase !== 'decrypting') return null;
  if (r.passcodeKind !== 'digits' && r.passcodeKind !== 'phrase') return null;
  if (typeof r.recoveryWrapped !== 'string' || !r.recoveryWrapped) return null;
  const kdf = r.kdf as Record<string, unknown> | undefined;
  if (
    !kdf ||
    kdf.name !== 'scrypt' ||
    typeof kdf.N !== 'number' ||
    typeof kdf.r !== 'number' ||
    typeof kdf.p !== 'number' ||
    typeof kdf.salt !== 'string'
  ) {
    return null;
  }
  const minutes = AUTO_LOCK_CHOICES.includes(r.autoLockMinutes as AutoLockMinutes)
    ? (r.autoLockMinutes as AutoLockMinutes)
    : DEFAULT_AUTO_LOCK_MINUTES;
  return {
    version: 1,
    phase: r.phase,
    passcodeKind: r.passcodeKind,
    biometric: r.biometric === true,
    autoLockMinutes: minutes,
    allowScreenshots: r.allowScreenshots === true,
    kdf: { name: 'scrypt', N: kdf.N, r: kdf.r, p: kdf.p, salt: kdf.salt },
    recoveryWrapped: r.recoveryWrapped,
    setUpAt: typeof r.setUpAt === 'string' ? r.setUpAt : '',
    answerBoxPublicKey:
      typeof r.answerBoxPublicKey === 'string' && r.answerBoxPublicKey ? r.answerBoxPublicKey : null,
    failedTries: wholeNumber(r.failedTries),
    lastFailedAt: wholeNumber(r.lastFailedAt),
    reminderDetail: r.reminderDetail === 'kind' ? 'kind' : 'full',
    vault: r.vault === true,
  };
}

function wholeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function serializeLockState(state: AppLockState): string {
  return JSON.stringify(state);
}

// ---------------------------------------------------------------------------
// Passcodes

export type PasscodeProblem = string | null;

/** Why a passcode cannot be used, in words for the screen, or null. */
export function passcodeProblem(passcode: string, kind: PasscodeKind): PasscodeProblem {
  if (kind === 'digits') {
    if (!/^[0-9]*$/.test(passcode)) return 'A passcode is digits only.';
    if (passcode.length < MIN_PASSCODE_DIGITS) return `Use at least ${MIN_PASSCODE_DIGITS} digits.`;
    if (passcode.length > MAX_PASSCODE_DIGITS) return `Use at most ${MAX_PASSCODE_DIGITS} digits.`;
    if (/^(\d)\1+$/.test(passcode)) return 'The same digit over and over is the first thing anybody tries.';
    if ('0123456789012345678901'.includes(passcode) || '9876543210987654321098'.includes(passcode)) {
      return 'Digits in a row are the first thing anybody tries.';
    }
    return null;
  }
  if (normalizePasscode(passcode).length < MIN_PASSPHRASE_LENGTH) {
    return `Use at least ${MIN_PASSPHRASE_LENGTH} characters.`;
  }
  return null;
}

/** The same passphrase typed on two keyboards gives the same bytes. */
export function normalizePasscode(passcode: string): string {
  return passcode.normalize('NFC');
}

// ---------------------------------------------------------------------------
// Wrong passcodes (R6)
//
// Five tries free, then a wait that grows with every wrong one after: 30
// seconds, a minute, five minutes, then fifteen minutes for each try after
// that. Nothing is ever wiped, by direct instruction, so the wait is the
// whole defence against somebody guessing at a phone in their hand. The
// recovery key is never made to wait: it is 160 random bits, and the person
// reaching for it is usually the one who forgot.

export const FREE_TRIES = 5;
const WAITS_MS = [30_000, 60_000, 5 * 60_000, 15 * 60_000];

/** How long the next try has to wait after this many wrong ones in a row. */
export function wrongTryWaitMs(failures: number): number {
  if (failures < FREE_TRIES) return 0;
  return WAITS_MS[Math.min(failures - FREE_TRIES, WAITS_MS.length - 1)];
}

/**
 * How much of the wait is left. A clock that moved backwards restarts the
 * whole wait, since the time that passed is unknown; the same rule
 * shouldLockOnReturn follows.
 */
export function waitRemainingMs(failedTries: number, lastFailedAt: number, now: number): number {
  const wait = wrongTryWaitMs(failedTries);
  if (wait === 0 || lastFailedAt === 0) return 0;
  const passed = now - lastFailedAt;
  if (passed < 0) return wait;
  return Math.max(0, wait - passed);
}

/** "30 seconds", "1 minute", "4 minutes", rounded up so it never reads 0. */
export function waitLabel(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 60) return seconds === 1 ? '1 second' : `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

// ---------------------------------------------------------------------------
// The recovery key

// Crockford's base32: no I, L, O or U, so nothing can be misread as a digit.
const RECOVERY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const RECOVERY_GROUP_SIZE = 4;

export function encodeRecoveryKey(bytes: Uint8Array): string {
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += RECOVERY_ALPHABET[(buffer >> bits) & 31];
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) out += RECOVERY_ALPHABET[(buffer << (5 - bits)) & 31];
  return out;
}

/** Reads a recovery key however it was typed, or null when it cannot be one. */
export function decodeRecoveryKey(typed: string): Uint8Array | null {
  const cleaned = typed
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  const expectedLength = Math.ceil((RECOVERY_KEY_BYTES * 8) / 5);
  if (cleaned.length !== expectedLength) return null;
  const out = new Uint8Array(RECOVERY_KEY_BYTES);
  let buffer = 0;
  let bits = 0;
  let at = 0;
  for (const ch of cleaned) {
    const digit = RECOVERY_ALPHABET.indexOf(ch);
    if (digit < 0) return null;
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      if (at < out.length) out[at] = (buffer >> bits) & 0xff;
      at += 1;
    }
    buffer &= (1 << bits) - 1;
  }
  return out;
}

export function recoveryKeyGroups(encoded: string): string[] {
  const groups: string[] = [];
  for (let i = 0; i < encoded.length; i += RECOVERY_GROUP_SIZE) groups.push(encoded.slice(i, i + RECOVERY_GROUP_SIZE));
  return groups;
}

/**
 * Two different groups to type back, picked from two random numbers so the
 * caller supplies the randomness. Numbered from 1 for the screen.
 */
export function groupsToConfirm(groupCount: number, pickA: number, pickB: number): [number, number] {
  const first = Math.floor(Math.abs(pickA) * groupCount) % groupCount;
  let second = Math.floor(Math.abs(pickB) * (groupCount - 1)) % (groupCount - 1);
  if (second >= first) second += 1;
  return first < second ? [first + 1, second + 1] : [second + 1, first + 1];
}

export function groupMatches(typed: string, group: string): boolean {
  const cleaned = typed.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return cleaned === group;
}

/** The recovery key's own 32 bytes for secretbox, separated from any other use. */
export function recoveryWrappingKey(recovery: Uint8Array): Uint8Array {
  const label = new TextEncoder().encode('inside-story-app-lock-recovery-1');
  const joined = new Uint8Array(label.length + recovery.length);
  joined.set(label, 0);
  joined.set(recovery, label.length);
  return nacl.hash(joined).slice(0, DATA_KEY_BYTES);
}

export async function passcodeWrappingKey(
  passcode: string,
  kdf: AppLockState['kdf'],
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  const salt = base64ToBytesFast(kdf.salt);
  if (!salt) throw new Error('The lock file salt cannot be read.');
  return scryptAsync(new TextEncoder().encode(normalizePasscode(passcode)), salt, {
    N: kdf.N,
    r: kdf.r,
    p: kdf.p,
    dkLen: DATA_KEY_BYTES,
    asyncTick: 20,
    onProgress,
  });
}

// ---------------------------------------------------------------------------
// Wrapping the data key

export function wrapKey(dataKey: Uint8Array, wrappingKey: Uint8Array, nonce: Uint8Array): string {
  if (dataKey.length !== DATA_KEY_BYTES) throw new Error('A data key is 32 bytes.');
  if (wrappingKey.length !== DATA_KEY_BYTES) throw new Error('A wrapping key is 32 bytes.');
  if (nonce.length !== WRAP_NONCE_BYTES) throw new Error('A nonce is 24 bytes.');
  const box = nacl.secretbox(dataKey, nonce, wrappingKey);
  const joined = new Uint8Array(nonce.length + box.length);
  joined.set(nonce, 0);
  joined.set(box, nonce.length);
  return bytesToBase64Fast(joined);
}

/** The data key, or null when the wrapping key is wrong or the copy is damaged. */
export function unwrapKey(wrapped: string | null, wrappingKey: Uint8Array): Uint8Array | null {
  if (!wrapped || wrappingKey.length !== DATA_KEY_BYTES) return null;
  const joined = base64ToBytesFast(wrapped);
  if (!joined || joined.length !== WRAP_NONCE_BYTES + nacl.secretbox.overheadLength + DATA_KEY_BYTES) return null;
  const opened = nacl.secretbox.open(joined.subarray(WRAP_NONCE_BYTES), joined.subarray(0, WRAP_NONCE_BYTES), wrappingKey);
  return opened && opened.length === DATA_KEY_BYTES ? opened : null;
}

export function keyToBase64(key: Uint8Array): string {
  return bytesToBase64Fast(key);
}

export function keyFromBase64(text: string | null): Uint8Array | null {
  if (!text) return null;
  const bytes = base64ToBytesFast(text);
  return bytes && bytes.length === DATA_KEY_BYTES ? bytes : null;
}

export function keyToHex(key: Uint8Array): string {
  let out = '';
  for (const byte of key) out += byte.toString(16).padStart(2, '0');
  return out;
}

/** The statement that opens a SQLCipher file with a raw key, skipping its own stretching. */
export function keyPragma(key: Uint8Array, schema?: string): string {
  const target = schema ? `${schema}.` : '';
  return `PRAGMA ${target}key = "x'${keyToHex(key)}'";`;
}

// ---------------------------------------------------------------------------
// Moving the database into the encrypted file

/** What the bytes at the start of a database file say it is. */
export type FileKind = 'missing' | 'plain' | 'encrypted';

const SQLITE_HEADER = 'SQLite format 3\u0000';

export function fileKindFromHeader(exists: boolean, header: Uint8Array | null): FileKind {
  if (!exists) return 'missing';
  if (!header || header.length < 16) return 'encrypted';
  for (let i = 0; i < 16; i += 1) {
    if (header[i] !== SQLITE_HEADER.charCodeAt(i)) return 'encrypted';
  }
  return 'plain';
}

export type MigrationFiles = {
  /** inside_story.db */
  main: FileKind;
  /** inside_story.db.locking, the encrypted copy being made */
  partial: boolean;
  /** inside_story.db.before-lock, the plain file kept until the new one opens */
  before: boolean;
};

export type MigrationStep =
  | { kind: 'export' }
  | { kind: 'restore-before' }
  | { kind: 'verify-then-finish' }
  | { kind: 'no-database' };

/**
 * Where an interrupted or fresh move stands, decided from the files alone.
 *
 * The plain file is only ever renamed aside, never deleted, until the
 * encrypted one has opened with the key. So every state a kill can leave
 * maps to a safe next step: an encrypted main file means the swap happened
 * and only the check and the tidy-up are left; a missing main file with
 * the plain one set aside means the kill came between the two renames;
 * anything else starts the copy over, since a partial file is thrown away
 * first.
 */
export function planMigration(files: MigrationFiles): MigrationStep {
  if (files.main === 'encrypted') return { kind: 'verify-then-finish' };
  if (files.main === 'missing') return files.before ? { kind: 'restore-before' } : { kind: 'no-database' };
  return { kind: 'export' };
}

/**
 * Turning the lock off (1.0.60.6, R12) is the same move backwards: the
 * encrypted file is copied out to a plain one beside it
 * (inside_story.db.unlocking), the encrypted one is set aside
 * (inside_story.db.before-unlock) and the plain one takes its name. A kill
 * at any point lands on a safe next step for the same reasons as above,
 * with plain and encrypted trading places.
 */
export function planUnlockMigration(files: MigrationFiles): MigrationStep {
  if (files.main === 'plain') return { kind: 'verify-then-finish' };
  if (files.main === 'missing') return files.before ? { kind: 'restore-before' } : { kind: 'no-database' };
  return { kind: 'export' };
}

export type TableCount = { table: string; rows: number };

/** The tables whose row counts differ between the two files, by name. */
export function countMismatches(plain: TableCount[], locked: TableCount[]): string[] {
  const lockedRows = new Map(locked.map((entry) => [entry.table, entry.rows]));
  const wrong: string[] = [];
  for (const entry of plain) {
    if (lockedRows.get(entry.table) !== entry.rows) wrong.push(entry.table);
  }
  return wrong;
}

/** Table names safe to put inside a quoted identifier. */
export function quoteIdentifier(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

// ---------------------------------------------------------------------------
// Locking again

/**
 * Whether coming back to the app locks it. Away for at least the chosen
 * number of minutes locks; "right away" locks on any return. A clock that
 * moved backwards counts as long enough, since the time away is unknown.
 */
export function shouldLockOnReturn(awaySince: number | null, now: number, minutes: AutoLockMinutes): boolean {
  if (awaySince === null) return false;
  const away = now - awaySince;
  if (away < 0) return true;
  return away >= minutes * 60_000;
}

export function autoLockLabel(minutes: AutoLockMinutes): string {
  if (minutes === 0) return 'Right Away';
  return minutes === 1 ? '1 Minute' : `${minutes} Minutes`;
}

/** Whether a failure from the fingerprint prompt was the person backing out. */
export function isBiometricCancel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

// ---------------------------------------------------------------------------
// Reminders answered while locked
//
// A button on a reminder has to work without a passcode, which is the whole
// point of a button. While locked the database cannot be opened, so the
// answer is sealed to a public key and kept beside it until the next unlock.
// The key pair comes from the data key, so the private half is never stored
// anywhere: the locked app can add answers and cannot read them back.

const ANSWER_BOX_LABEL = 'inside-story-locked-answers-v1';

export function answerBoxKeyPair(dataKey: Uint8Array): nacl.BoxKeyPair {
  const label = new TextEncoder().encode(ANSWER_BOX_LABEL);
  const input = new Uint8Array(dataKey.length + label.length);
  input.set(dataKey, 0);
  input.set(label, dataKey.length);
  return nacl.box.keyPair.fromSecretKey(nacl.hash(input).slice(0, nacl.box.secretKeyLength));
}

/** Randomness comes in from the caller, the same way wrapKey takes its nonce. */
export function sealForUnlock(
  text: string,
  publicKey: Uint8Array,
  ephemeralSecret: Uint8Array,
  nonce: Uint8Array,
): string {
  const ephemeral = nacl.box.keyPair.fromSecretKey(ephemeralSecret);
  const box = nacl.box(new TextEncoder().encode(text), nonce, publicKey, ephemeral.secretKey);
  const out = new Uint8Array(ephemeral.publicKey.length + nonce.length + box.length);
  out.set(ephemeral.publicKey, 0);
  out.set(nonce, ephemeral.publicKey.length);
  out.set(box, ephemeral.publicKey.length + nonce.length);
  return bytesToBase64Fast(out);
}

/** Null for anything not sealed to this data key, cut short or altered. */
export function openSealedForUnlock(sealed: string, dataKey: Uint8Array): string | null {
  let bytes: Uint8Array | null;
  try {
    bytes = base64ToBytesFast(sealed.trim());
  } catch {
    return null;
  }
  if (!bytes) return null;
  const head = nacl.box.publicKeyLength + nacl.box.nonceLength;
  if (bytes.length <= head + nacl.box.overheadLength) return null;
  const opened = nacl.box.open(
    bytes.slice(head),
    bytes.slice(nacl.box.publicKeyLength, head),
    bytes.slice(0, nacl.box.publicKeyLength),
    answerBoxKeyPair(dataKey).secretKey,
  );
  if (!opened) return null;
  try {
    return new TextDecoder().decode(opened);
  } catch {
    return null;
  }
}
