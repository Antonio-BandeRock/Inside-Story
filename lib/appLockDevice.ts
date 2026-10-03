// App Lock on the phone: secure store, the lock file, the fingerprint
// prompt, and moving the database into an encrypted file. Every decision is
// in lib/appLock.ts; this file does what those decisions say.
//
// Secure store holds three things at most:
//   PASSCODE_ITEM   the data key wrapped under the passcode (no prompt)
//   BIOMETRIC_ITEM  the data key behind the fingerprint or face prompt
//   MIGRATION_ITEM  the bare data key, only between setting the lock up and
//                   the database finishing its move, so the move can run
//                   at the next start before anybody has unlocked. Deleted
//                   the moment the move is done.
// Expo's secure store keeps each in the Android Keystore, so none of them
// is in a copy of the app's files.

import * as SQLite from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import {
  countMismatches,
  DATA_KEY_BYTES,
  decodeRecoveryKey,
  DEFAULT_AUTO_LOCK_MINUTES,
  DEFAULT_KDF,
  encodeRecoveryKey,
  fileKindFromHeader,
  isBiometricCancel,
  KDF_SALT_BYTES,
  keyFromBase64,
  keyPragma,
  keyToBase64,
  keyToHex,
  passcodeWrappingKey,
  planMigration,
  quoteIdentifier,
  RECOVERY_KEY_BYTES,
  recoveryKeyGroups,
  recoveryWrappingKey,
  serializeLockState,
  unwrapKey,
  WRAP_NONCE_BYTES,
  wrapKey,
  type AppLockState,
  type AutoLockMinutes,
  type FileKind,
  type PasscodeKind,
  type TableCount,
} from './appLock';
import { dropDataKey, holdDataKey, LOCK_FILE_NAME, readLockStateSync } from './appLockSession';
import { restartApp } from './restartApp';
import { bytesToBase64Fast } from './localSeal';
import { closeDatabasesForRestart, DB_NAME } from './db';

const PASSCODE_ITEM = 'inside_story_app_lock_passcode_v1';
const BIOMETRIC_ITEM = 'inside_story_app_lock_biometric_v1';
const MIGRATION_ITEM = 'inside_story_app_lock_migrating_v1';

const PARTIAL_NAME = `${DB_NAME}.locking`;
const BEFORE_NAME = `${DB_NAME}.before-lock`;
const UNOPENED_NAME = `${DB_NAME}.locked-unopened`;
const SIDE_FILES = ['-wal', '-shm', '-journal'];

const BIOMETRIC_PROMPT = 'Unlock Inside Story';

async function secureStore() {
  return import('expo-secure-store');
}

async function randomBytes(count: number): Promise<Uint8Array> {
  const Crypto = await import('expo-crypto');
  return Crypto.getRandomBytesAsync(count);
}

// ---------------------------------------------------------------------------
// The lock file

export { readLockStateSync };

function writeLockState(state: AppLockState): void {
  new File(Paths.document, LOCK_FILE_NAME).write(serializeLockState(state));
}

function deleteLockState(): void {
  const file = new File(Paths.document, LOCK_FILE_NAME);
  if (file.exists) file.delete();
}

export function updateLockSettings(
  patch: Partial<Pick<AppLockState, 'autoLockMinutes' | 'allowScreenshots'>>,
): AppLockState | null {
  const state = readLockStateSync();
  if (!state) return null;
  const next = { ...state, ...patch };
  writeLockState(next);
  void applyScreenCapturePolicy(next);
  return next;
}

/** Screenshots and the app switcher preview, per the setting (R5). */
export async function applyScreenCapturePolicy(state: AppLockState | null): Promise<void> {
  try {
    const ScreenCapture = await import('expo-screen-capture');
    if (state && state.phase === 'on' && !state.allowScreenshots) await ScreenCapture.preventScreenCaptureAsync('app-lock');
    else await ScreenCapture.allowScreenCaptureAsync('app-lock');
  } catch (error) {
    console.error('[appLock] screenshot setting not applied', error);
  }
}

// ---------------------------------------------------------------------------
// Setting up

export type RecoveryKey = { bytes: Uint8Array; encoded: string; groups: string[] };

export async function newRecoveryKey(): Promise<RecoveryKey> {
  const bytes = await randomBytes(RECOVERY_KEY_BYTES);
  const encoded = encodeRecoveryKey(bytes);
  return { bytes, encoded, groups: recoveryKeyGroups(encoded) };
}

export async function canUseBiometrics(): Promise<boolean> {
  try {
    const SecureStore = await secureStore();
    return SecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

async function wrapForPasscode(dataKey: Uint8Array, passcode: string): Promise<{ wrapped: string; kdf: AppLockState['kdf'] }> {
  const salt = await randomBytes(KDF_SALT_BYTES);
  const kdf = { ...DEFAULT_KDF, salt: bytesToBase64Fast(salt) };
  const wrapping = await passcodeWrappingKey(passcode, kdf);
  return { wrapped: wrapKey(dataKey, wrapping, await randomBytes(WRAP_NONCE_BYTES)), kdf };
}

async function wrapForRecovery(dataKey: Uint8Array, recovery: Uint8Array): Promise<string> {
  return wrapKey(dataKey, recoveryWrappingKey(recovery), await randomBytes(WRAP_NONCE_BYTES));
}

/**
 * Keeps the data key behind the fingerprint or face prompt. Android may ask
 * for the fingerprint to store it. False when it could not be kept, which
 * leaves the passcode as the way in.
 */
export async function storeBiometricCopy(dataKey: Uint8Array): Promise<boolean> {
  try {
    const SecureStore = await secureStore();
    await SecureStore.setItemAsync(BIOMETRIC_ITEM, keyToBase64(dataKey), {
      requireAuthentication: true,
      authenticationPrompt: BIOMETRIC_PROMPT,
    });
    return true;
  } catch (error) {
    console.error('[appLock] the fingerprint copy could not be kept', error);
    return false;
  }
}

/**
 * Sets the lock up and leaves the database waiting to be moved. The caller
 * restarts the app, and the move runs at the start with nothing else open.
 */
export async function turnOnAppLock(options: {
  passcode: string;
  passcodeKind: PasscodeKind;
  biometric: boolean;
  recovery: Uint8Array;
}): Promise<{ biometric: boolean }> {
  const SecureStore = await secureStore();
  const dataKey = await randomBytes(DATA_KEY_BYTES);
  const { wrapped, kdf } = await wrapForPasscode(dataKey, options.passcode);
  await SecureStore.setItemAsync(PASSCODE_ITEM, wrapped);
  await SecureStore.setItemAsync(MIGRATION_ITEM, keyToBase64(dataKey));
  const biometric = options.biometric ? await storeBiometricCopy(dataKey) : false;
  writeLockState({
    version: 1,
    phase: 'encrypting',
    passcodeKind: options.passcodeKind,
    biometric,
    autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
    allowScreenshots: false,
    kdf,
    recoveryWrapped: await wrapForRecovery(dataKey, options.recovery),
    setUpAt: new Date().toISOString(),
  });
  return { biometric };
}

// ---------------------------------------------------------------------------
// Unlocking

export async function unlockWithPasscode(passcode: string): Promise<Uint8Array | null> {
  const state = readLockStateSync();
  if (!state) return null;
  const SecureStore = await secureStore();
  const wrapped = await SecureStore.getItemAsync(PASSCODE_ITEM);
  const wrapping = await passcodeWrappingKey(passcode, state.kdf);
  return unwrapKey(wrapped, wrapping);
}

export type BiometricResult = { kind: 'key'; key: Uint8Array } | { kind: 'cancelled' } | { kind: 'needs-passcode' };

/**
 * Asks for the fingerprint or face. "needs-passcode" means the copy is
 * gone or voided, which Android does when a new fingerprint or face is
 * added (R8): the passcode opens it once and the copy is made again.
 */
export async function unlockWithBiometric(): Promise<BiometricResult> {
  try {
    const SecureStore = await secureStore();
    const stored = await SecureStore.getItemAsync(BIOMETRIC_ITEM, {
      requireAuthentication: true,
      authenticationPrompt: BIOMETRIC_PROMPT,
    });
    const key = keyFromBase64(stored);
    return key ? { kind: 'key', key } : { kind: 'needs-passcode' };
  } catch (error) {
    if (isBiometricCancel(error)) return { kind: 'cancelled' };
    console.error('[appLock] fingerprint unlock failed', error);
    return { kind: 'needs-passcode' };
  }
}

export function unlockWithRecovery(typed: string): Uint8Array | null {
  const state = readLockStateSync();
  const recovery = decodeRecoveryKey(typed);
  if (!state || !recovery) return null;
  return unwrapKey(state.recoveryWrapped, recoveryWrappingKey(recovery));
}

/** Replaces the passcode. The old one stops working, since its copy is overwritten. */
export async function setNewPasscode(dataKey: Uint8Array, passcode: string, kind: PasscodeKind): Promise<void> {
  const state = readLockStateSync();
  if (!state) throw new Error('App Lock is not on.');
  const SecureStore = await secureStore();
  const { wrapped, kdf } = await wrapForPasscode(dataKey, passcode);
  await SecureStore.setItemAsync(PASSCODE_ITEM, wrapped);
  writeLockState({ ...state, passcodeKind: kind, kdf });
}

/** Replaces the recovery key. The old one stops working. */
export async function replaceRecoveryKey(dataKey: Uint8Array, recovery: Uint8Array): Promise<void> {
  const state = readLockStateSync();
  if (!state) throw new Error('App Lock is not on.');
  writeLockState({ ...state, recoveryWrapped: await wrapForRecovery(dataKey, recovery) });
}

export async function setBiometricUnlock(dataKey: Uint8Array | null, on: boolean): Promise<boolean> {
  const state = readLockStateSync();
  if (!state) return false;
  let kept = false;
  if (on && dataKey) {
    kept = await storeBiometricCopy(dataKey);
  } else {
    try {
      const SecureStore = await secureStore();
      await SecureStore.deleteItemAsync(BIOMETRIC_ITEM);
    } catch (error) {
      console.error('[appLock] the fingerprint copy could not be removed', error);
    }
  }
  writeLockState({ ...state, biometric: kept });
  return kept;
}

export function setAutoLockMinutes(minutes: AutoLockMinutes): void {
  updateLockSettings({ autoLockMinutes: minutes });
}

// ---------------------------------------------------------------------------
// Moving the database into the encrypted file

export type MigrationProgress =
  | { stage: 'checking-space' }
  | { stage: 'copying' }
  | { stage: 'counting'; done: number; total: number }
  | { stage: 'swapping' }
  | { stage: 'opening' }
  | { stage: 'done' };

export type MigrationResult = { ok: true } | { ok: false; problem: string };

function databaseDirectory(): string {
  return SQLite.defaultDatabaseDirectory.replace(/^file:\/\//, '');
}

function databaseFile(name: string): File {
  return new File(`file://${databaseDirectory()}/${name}`);
}

function databasePath(name: string): string {
  return `${databaseDirectory()}/${name}`;
}

function kindOf(name: string): FileKind {
  const file = databaseFile(name);
  if (!file.exists) return 'missing';
  if (!file.size) return 'plain';
  let header: Uint8Array | null = null;
  try {
    const handle = file.open();
    try {
      header = handle.readBytes(16);
    } finally {
      handle.close();
    }
  } catch (error) {
    console.error('[appLock] could not read the database header', error);
  }
  return fileKindFromHeader(true, header);
}

function deleteWithSideFiles(name: string): void {
  for (const suffix of ['', ...SIDE_FILES]) {
    const file = databaseFile(name + suffix);
    if (file.exists) file.delete();
  }
}

/** Renames a database and the side files that hold part of it. */
function moveWithSideFiles(from: string, to: string): void {
  deleteWithSideFiles(to);
  for (const suffix of ['', '-wal', '-journal']) {
    const file = databaseFile(from + suffix);
    if (file.exists) file.move(databaseFile(to + suffix));
  }
  const shm = databaseFile(from + '-shm');
  if (shm.exists) shm.delete();
}

async function countRows(db: SQLite.SQLiteDatabase, schema: string, tables: string[]): Promise<TableCount[]> {
  const counts: TableCount[] = [];
  for (const table of tables) {
    const row = await db.getFirstAsync<{ n: number }>(`SELECT count(*) AS n FROM ${schema}.${quoteIdentifier(table)}`);
    counts.push({ table, rows: row?.n ?? -1 });
  }
  return counts;
}

async function exportToPartial(key: Uint8Array, onProgress: (progress: MigrationProgress) => void): Promise<void> {
  deleteWithSideFiles(PARTIAL_NAME);

  onProgress({ stage: 'checking-space' });
  const size = databaseFile(DB_NAME).size ?? 0;
  let free = Number.POSITIVE_INFINITY;
  try {
    free = Paths.availableDiskSpace;
  } catch {
    // Unknown free space: try anyway, and a full disk fails the copy safely.
  }
  if (free < size * 1.2 + 50 * 1024 * 1024) {
    throw new Error(
      `The phone needs about ${Math.ceil((size * 1.2) / (1024 * 1024)) + 50} MB free to make the locked copy. Free some room and try again.`,
    );
  }

  const plain = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
  try {
    const tables = (
      await plain.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
    ).map((row) => row.name);

    onProgress({ stage: 'copying' });
    const path = databasePath(PARTIAL_NAME).replace(/'/g, "''");
    await plain.execAsync(`ATTACH DATABASE '${path}' AS locked KEY "x'${keyToHex(key)}'";`);
    try {
      await plain.getFirstAsync("SELECT sqlcipher_export('locked')");
      const before: TableCount[] = [];
      const after: TableCount[] = [];
      for (let i = 0; i < tables.length; i += 1) {
        onProgress({ stage: 'counting', done: i, total: tables.length });
        before.push(...(await countRows(plain, 'main', [tables[i]])));
        after.push(...(await countRows(plain, 'locked', [tables[i]])));
      }
      onProgress({ stage: 'counting', done: tables.length, total: tables.length });
      const wrong = countMismatches(before, after);
      if (wrong.length) throw new Error(`The locked copy did not match in ${wrong.slice(0, 3).join(', ')}.`);
    } finally {
      await plain.execAsync('DETACH DATABASE locked;').catch(() => {});
    }
  } finally {
    await plain.closeAsync();
  }
}


async function opensWithKey(key: Uint8Array): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
    try {
      await db.execAsync(keyPragma(key));
      await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
      return true;
    } finally {
      await db.closeAsync();
    }
  } catch (error) {
    console.error('[appLock] the locked file did not open', error);
    return false;
  }
}

/**
 * Moves the database into the encrypted file. Safe to run again after a
 * kill at any point: see planMigration in lib/appLock.ts. On success the key
 * is held and the app can open straight away.
 */
export async function runMigration(onProgress: (progress: MigrationProgress) => void): Promise<MigrationResult> {
  try {
    const SecureStore = await secureStore();
    const key = keyFromBase64(await SecureStore.getItemAsync(MIGRATION_ITEM));
    if (!key) return { ok: false, problem: 'The key made when the lock was set up could not be found.' };
    await closeDatabasesForRestart();

    let step = planMigration({
      main: kindOf(DB_NAME),
      partial: databaseFile(PARTIAL_NAME).exists,
      before: databaseFile(BEFORE_NAME).exists,
    });
    if (step.kind === 'restore-before') {
      moveWithSideFiles(BEFORE_NAME, DB_NAME);
      step = { kind: 'export' };
    }
    if (step.kind === 'export') {
      await exportToPartial(key, onProgress);
      onProgress({ stage: 'swapping' });
      moveWithSideFiles(DB_NAME, BEFORE_NAME);
      moveWithSideFiles(PARTIAL_NAME, DB_NAME);
    }

    onProgress({ stage: 'opening' });
    if (step.kind !== 'no-database' && !(await opensWithKey(key))) {
      // Put the plain file back and keep the one that would not open
      // rather than deleting anything.
      if (databaseFile(BEFORE_NAME).exists) {
        moveWithSideFiles(DB_NAME, UNOPENED_NAME);
        moveWithSideFiles(BEFORE_NAME, DB_NAME);
      }
      return { ok: false, problem: 'The locked copy did not open, so your data was left as it was.' };
    }

    deleteWithSideFiles(BEFORE_NAME);
    deleteWithSideFiles(PARTIAL_NAME);
    const state = readLockStateSync();
    if (!state) return { ok: false, problem: 'The lock settings could not be read.' };
    writeLockState({ ...state, phase: 'on' });
    await SecureStore.deleteItemAsync(MIGRATION_ITEM);
    holdDataKey(key);
    onProgress({ stage: 'done' });
    return { ok: true };
  } catch (error) {
    console.error('[appLock] the move did not finish', error);
    try {
      deleteWithSideFiles(PARTIAL_NAME);
    } catch {
      // Left for the next try, which deletes it first.
    }
    return { ok: false, problem: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Backs out of a lock that was set up but whose database never moved. Only
 * allowed while the database is still the plain file, so nothing that
 * needs the key is ever thrown away.
 */
export async function abandonLockSetup(): Promise<boolean> {
  const state = readLockStateSync();
  if (!state || state.phase !== 'encrypting') return false;
  if (kindOf(DB_NAME) === 'encrypted') return false;
  if (databaseFile(BEFORE_NAME).exists && kindOf(DB_NAME) === 'missing') moveWithSideFiles(BEFORE_NAME, DB_NAME);
  deleteWithSideFiles(PARTIAL_NAME);
  const SecureStore = await secureStore();
  for (const item of [PASSCODE_ITEM, BIOMETRIC_ITEM, MIGRATION_ITEM]) {
    await SecureStore.deleteItemAsync(item).catch(() => {});
  }
  deleteLockState();
  return true;
}

/** Locks straight away: the key goes and the app starts again at the lock screen. */
export async function lockNow(): Promise<void> {
  dropDataKey();
  await restartApp();
}
