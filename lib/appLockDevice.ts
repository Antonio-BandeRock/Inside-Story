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
//
// On the computer (1.0.60.7) the same file runs with three differences,
// each behind isDesktopApp(): the records are a sealed file the main process
// opens into memory (desktop/sealedDb.js) rather than a SQLCipher file, so
// the move is one call over the bridge; BIOMETRIC_ITEM holds a copy only
// Windows Hello can open (desktop/hello.js), since the desktop secure store
// has no prompt of its own; and secure store is Electron's safeStorage.

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
  planUnlockMigration,
  waitRemainingMs,
  wrongTryWaitMs,
  quoteIdentifier,
  RECOVERY_KEY_BYTES,
  recoveryKeyGroups,
  recoveryWrappingKey,
  serializeLockState,
  unwrapKey,
  WRAP_NONCE_BYTES,
  wrapKey,
  answerBoxKeyPair,
  type AppLockState,
  type AutoLockMinutes,
  type FileKind,
  type PasscodeKind,
  type ReminderDetail,
  type TableCount,
} from './appLock';
import { dropDataKey, holdDataKey, LOCK_FILE_NAME, readLockStateSync } from './appLockSession';
import { restartApp } from './restartApp';
import { bytesToBase64Fast } from './localSeal';
import { runBeforeRestart } from './beforeRestart';
import { closeDatabasesForRestart, DB_NAME } from './db';
import { unsealWaitingAnswersForTurnOff } from './lockedAnswers';
import { unsealLockedCapturesForTurnOff } from './lockedCaptures';
import { getDesktopBridge, isDesktopApp, type DesktopSqliteBridge } from './desktop/bridge';

const PASSCODE_ITEM = 'inside_story_app_lock_passcode_v1';
const BIOMETRIC_ITEM = 'inside_story_app_lock_biometric_v1';
const MIGRATION_ITEM = 'inside_story_app_lock_migrating_v1';

const PARTIAL_NAME = `${DB_NAME}.locking`;
const BEFORE_NAME = `${DB_NAME}.before-lock`;
const UNOPENED_NAME = `${DB_NAME}.locked-unopened`;
// Turning the lock off (1.0.60.6) uses names of its own, so a file left by
// one direction is never mistaken for the other's.
const UNLOCK_PARTIAL_NAME = `${DB_NAME}.unlocking`;
const UNLOCK_BEFORE_NAME = `${DB_NAME}.before-unlock`;
const UNLOCK_UNOPENED_NAME = `${DB_NAME}.unlocked-unopened`;
const SIDE_FILES = ['-wal', '-shm', '-journal'];

const BIOMETRIC_PROMPT = 'Unlock Inside Story';

async function secureStore() {
  return import('expo-secure-store');
}

type SealingBridge = Required<Pick<DesktopSqliteBridge, 'seal' | 'unseal' | 'keepSealed' | 'abandonSeal'>>;

/** The main process's sealing calls, which every installer from 1.0.60.7 has. */
function desktopSealing(): SealingBridge {
  const sqlite = getDesktopBridge().sqlite;
  if (!sqlite.seal || !sqlite.unseal || !sqlite.keepSealed || !sqlite.abandonSeal) {
    throw new Error('This installer is too old for App Lock. Install the newest one and try again.');
  }
  return sqlite as SealingBridge;
}

async function removeHelloKey(): Promise<void> {
  if (!isDesktopApp()) return;
  await getDesktopBridge().hello?.remove().catch(() => {});
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
  patch: Partial<Pick<AppLockState, 'autoLockMinutes' | 'allowScreenshots' | 'reminderDetail'>>,
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
  if (isDesktopApp()) {
    try {
      return (await getDesktopBridge().hello?.available()) ?? false;
    } catch {
      return false;
    }
  }
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
    if (isDesktopApp()) {
      // Windows asks for Hello here; what is stored opens only with it.
      const hello = getDesktopBridge().hello;
      const wrapped = hello ? await hello.wrapKey(keyToBase64(dataKey)) : null;
      if (!wrapped) return false;
      await SecureStore.setItemAsync(BIOMETRIC_ITEM, wrapped);
      return true;
    }
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
  // 1.0.60.15: a second setup over a lock that is on, or still moving,
  // wrote a new key over the only one that opened the records already
  // locked. Refused here whatever screen asks.
  if (readLockStateSync()) throw new Error('App Lock is already set up on this device.');
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
    answerBoxPublicKey: bytesToBase64Fast(answerBoxKeyPair(dataKey).publicKey),
    failedTries: 0,
    lastFailedAt: 0,
    reminderDetail: 'full',
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

export type PasscodeCheck =
  | { kind: 'key'; key: Uint8Array }
  | { kind: 'wrong'; waitMs: number }
  | { kind: 'wait'; waitMs: number };

/**
 * Every passcode typed anywhere goes through here, so the wait after five
 * wrong tries (R6) holds on the lock screen, in settings and before a
 * backup alike. The count lives in the lock file, so closing the app does
 * not reset it. A try during a wait is refused before scrypt runs.
 */
export async function checkPasscode(passcode: string): Promise<PasscodeCheck> {
  const state = readLockStateSync();
  if (!state) return { kind: 'wrong', waitMs: 0 };
  const remaining = waitRemainingMs(state.failedTries, state.lastFailedAt, Date.now());
  if (remaining > 0) return { kind: 'wait', waitMs: remaining };
  const key = await unlockWithPasscode(passcode);
  // Read again: scrypt takes a moment and a setting may have changed.
  const now = readLockStateSync() ?? state;
  if (key) {
    if (now.failedTries || now.lastFailedAt) writeLockState({ ...now, failedTries: 0, lastFailedAt: 0 });
    // A lock made at an older stretch is wrapped again at today's, after
    // the person is in, so the next unlock is the faster one.
    if (stretchIsOutdated(now.kdf)) {
      setNewPasscode(key, passcode, now.passcodeKind).catch(() => {});
    }
    return { kind: 'key', key };
  }
  const failedTries = now.failedTries + 1;
  writeLockState({ ...now, failedTries, lastFailedAt: Date.now() });
  return { kind: 'wrong', waitMs: wrongTryWaitMs(failedTries) };
}

function stretchIsOutdated(kdf: { N: number; r: number; p: number }): boolean {
  return kdf.N !== DEFAULT_KDF.N || kdf.r !== DEFAULT_KDF.r || kdf.p !== DEFAULT_KDF.p;
}

/** How long before another passcode can be tried, in milliseconds. */
export function passcodeWaitRemaining(): number {
  const state = readLockStateSync();
  return state ? waitRemainingMs(state.failedTries, state.lastFailedAt, Date.now()) : 0;
}

/** A fingerprint or the recovery key opening it clears the wrong tries too. */
export function clearWrongTries(): void {
  const state = readLockStateSync();
  if (state && (state.failedTries || state.lastFailedAt)) writeLockState({ ...state, failedTries: 0, lastFailedAt: 0 });
}

export function setReminderDetail(detail: ReminderDetail): void {
  updateLockSettings({ reminderDetail: detail });
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
    if (isDesktopApp()) {
      const stored = await SecureStore.getItemAsync(BIOMETRIC_ITEM);
      const hello = getDesktopBridge().hello;
      if (!stored || !hello) return { kind: 'needs-passcode' };
      const opened = await hello.unwrapKey(stored);
      if (opened.kind !== 'key') return opened;
      const key = keyFromBase64(opened.key);
      return key ? { kind: 'key', key } : { kind: 'needs-passcode' };
    }
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
      await removeHelloKey();
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

/**
 * unopenable: the computer already holds sealed records this key does not
 * open, which only a second setup over a finished one leaves behind
 * (1.0.60.15). Trying again cannot help; bringRecordsBackFromSharedFolder can.
 */
export type MigrationResult = { ok: true } | { ok: false; problem: string; unopenable?: boolean };

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

function checkRoomForCopy(onProgress: (progress: MigrationProgress) => void, what: string): void {
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
      `The phone needs about ${Math.ceil((size * 1.2) / (1024 * 1024)) + 50} MB free to make the ${what}. Free some room and try again.`,
    );
  }
}

async function exportToPartial(key: Uint8Array, onProgress: (progress: MigrationProgress) => void): Promise<void> {
  deleteWithSideFiles(PARTIAL_NAME);
  checkRoomForCopy(onProgress, 'locked copy');

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

async function finishLockingOn(
  key: Uint8Array,
  SecureStore: Awaited<ReturnType<typeof secureStore>>,
  onProgress: (progress: MigrationProgress) => void,
): Promise<MigrationResult> {
  const state = readLockStateSync();
  if (!state) return { ok: false, problem: 'The lock settings could not be read.' };
  writeLockState({ ...state, phase: 'on' });
  await SecureStore.deleteItemAsync(MIGRATION_ITEM);
  holdDataKey(key);
  onProgress({ stage: 'done' });
  return { ok: true };
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
    if (isDesktopApp()) {
      onProgress({ stage: 'copying' });
      let sealed;
      try {
        sealed = await desktopSealing().seal(DB_NAME, keyToBase64(key));
      } catch (error) {
        if (error instanceof Error && /WrongKeyError/.test(error.message)) {
          return {
            ok: false,
            unopenable: true,
            problem:
              'This computer already holds records locked with an earlier key, and that key is no longer here, so the new one cannot open them.',
          };
        }
        throw error;
      }
      if (!sealed.ok) return { ok: false, problem: `${sealed.problem} Your records were left as they were.` };
      return finishLockingOn(key, SecureStore, onProgress);
    }

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
    return finishLockingOn(key, SecureStore, onProgress);
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

// ---------------------------------------------------------------------------
// Turning the lock off (1.0.60.6, R12)

/**
 * Starts turning the lock off. The caller has just checked the passcode or
 * fingerprint, so the data key is in hand; it is kept bare in secure store
 * for the move only, the same as while the lock was being set up, and the
 * caller restarts the app so the move runs with nothing else open.
 */
export async function startTurningOff(dataKey: Uint8Array): Promise<void> {
  const state = readLockStateSync();
  if (!state || state.phase !== 'on') throw new Error('App Lock is not on.');
  const SecureStore = await secureStore();
  await SecureStore.setItemAsync(MIGRATION_ITEM, keyToBase64(dataKey));
  writeLockState({ ...state, phase: 'decrypting' });
}

async function exportToPlain(key: Uint8Array, onProgress: (progress: MigrationProgress) => void): Promise<void> {
  deleteWithSideFiles(UNLOCK_PARTIAL_NAME);
  checkRoomForCopy(onProgress, 'unlocked copy');

  const locked = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
  try {
    await locked.execAsync(keyPragma(key));
    const tables = (
      await locked.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
    ).map((row) => row.name);

    onProgress({ stage: 'copying' });
    const path = databasePath(UNLOCK_PARTIAL_NAME).replace(/'/g, "''");
    // An empty key attaches a plain SQLite file.
    await locked.execAsync(`ATTACH DATABASE '${path}' AS plain KEY '';`);
    try {
      await locked.getFirstAsync("SELECT sqlcipher_export('plain')");
      const before: TableCount[] = [];
      const after: TableCount[] = [];
      for (let i = 0; i < tables.length; i += 1) {
        onProgress({ stage: 'counting', done: i, total: tables.length });
        before.push(...(await countRows(locked, 'main', [tables[i]])));
        after.push(...(await countRows(locked, 'plain', [tables[i]])));
      }
      onProgress({ stage: 'counting', done: tables.length, total: tables.length });
      const wrong = countMismatches(before, after);
      if (wrong.length) throw new Error(`The unlocked copy did not match in ${wrong.slice(0, 3).join(', ')}.`);
    } finally {
      await locked.execAsync('DETACH DATABASE plain;').catch(() => {});
    }
  } finally {
    await locked.closeAsync();
  }
}

async function opensPlain(): Promise<boolean> {
  if (kindOf(DB_NAME) !== 'plain') return false;
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
    try {
      await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
      return true;
    } finally {
      await db.closeAsync();
    }
  } catch (error) {
    console.error('[appLock] the unlocked file did not open', error);
    return false;
  }
}

async function finishTurningOff(
  key: Uint8Array,
  SecureStore: Awaited<ReturnType<typeof secureStore>>,
  onProgress: (progress: MigrationProgress) => void,
): Promise<MigrationResult> {
  // Presses made on a reminder while the lock was on are still sealed;
  // open them now, while the key is in hand, so the next start applies them.
  unsealWaitingAnswersForTurnOff(key);
  unsealLockedCapturesForTurnOff(key);
  deleteLockState();
  for (const item of [PASSCODE_ITEM, BIOMETRIC_ITEM, MIGRATION_ITEM]) {
    await SecureStore.deleteItemAsync(item).catch(() => {});
  }
  await removeHelloKey();
  key.fill(0);
  await applyScreenCapturePolicy(null);
  onProgress({ stage: 'done' });
  return { ok: true };
}

/**
 * Moves the database back into a plain file and takes the lock away. Safe
 * to run again after a kill at any point (planUnlockMigration): the
 * encrypted file is only set aside, never deleted, until the plain one has
 * opened, and the lock file and keys go last, so a kill before the end
 * comes back here at the next start.
 */
export async function runUnlockMigration(onProgress: (progress: MigrationProgress) => void): Promise<MigrationResult> {
  try {
    const SecureStore = await secureStore();
    const key = keyFromBase64(await SecureStore.getItemAsync(MIGRATION_ITEM));
    if (!key) return { ok: false, problem: 'The key kept for turning the lock off could not be found.' };
    await closeDatabasesForRestart();
    if (isDesktopApp()) {
      onProgress({ stage: 'copying' });
      const unsealed = await desktopSealing().unseal(DB_NAME, keyToBase64(key));
      if (!unsealed.ok) return { ok: false, problem: `${unsealed.problem} Your records were left locked.` };
      return finishTurningOff(key, SecureStore, onProgress);
    }

    let step = planUnlockMigration({
      main: kindOf(DB_NAME),
      partial: databaseFile(UNLOCK_PARTIAL_NAME).exists,
      before: databaseFile(UNLOCK_BEFORE_NAME).exists,
    });
    if (step.kind === 'restore-before') {
      moveWithSideFiles(UNLOCK_BEFORE_NAME, DB_NAME);
      step = { kind: 'export' };
    }
    if (step.kind === 'export') {
      await exportToPlain(key, onProgress);
      onProgress({ stage: 'swapping' });
      moveWithSideFiles(DB_NAME, UNLOCK_BEFORE_NAME);
      moveWithSideFiles(UNLOCK_PARTIAL_NAME, DB_NAME);
    }

    onProgress({ stage: 'opening' });
    if (step.kind !== 'no-database' && !(await opensPlain())) {
      if (databaseFile(UNLOCK_BEFORE_NAME).exists) {
        moveWithSideFiles(DB_NAME, UNLOCK_UNOPENED_NAME);
        moveWithSideFiles(UNLOCK_BEFORE_NAME, DB_NAME);
      }
      return { ok: false, problem: 'The unlocked copy did not open, so your records were left locked.' };
    }

    deleteWithSideFiles(UNLOCK_BEFORE_NAME);
    deleteWithSideFiles(UNLOCK_PARTIAL_NAME);
    return finishTurningOff(key, SecureStore, onProgress);
  } catch (error) {
    console.error('[appLock] turning the lock off did not finish', error);
    try {
      deleteWithSideFiles(UNLOCK_PARTIAL_NAME);
    } catch {
      // Left for the next try, which deletes it first.
    }
    return { ok: false, problem: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Keeps the lock on after turning it off failed. Only while the database is
 * still the encrypted file, so nothing written plain is ever left behind a
 * lock that would not cover it.
 */
export async function keepLockOn(): Promise<boolean> {
  const state = readLockStateSync();
  if (!state || state.phase !== 'decrypting') return false;
  if (isDesktopApp()) {
    if (!(await desktopSealing().keepSealed(DB_NAME))) return false;
    const SecureStore = await secureStore();
    await SecureStore.deleteItemAsync(MIGRATION_ITEM).catch(() => {});
    writeLockState({ ...state, phase: 'on' });
    return true;
  }
  if (kindOf(DB_NAME) === 'missing' && databaseFile(UNLOCK_BEFORE_NAME).exists) {
    moveWithSideFiles(UNLOCK_BEFORE_NAME, DB_NAME);
  }
  if (kindOf(DB_NAME) !== 'encrypted') return false;
  deleteWithSideFiles(UNLOCK_PARTIAL_NAME);
  const SecureStore = await secureStore();
  await SecureStore.deleteItemAsync(MIGRATION_ITEM).catch(() => {});
  writeLockState({ ...state, phase: 'on' });
  return true;
}

/**
 * Backs out of a lock that was set up but whose database never moved. Only
 * allowed while the database is still the plain file, so nothing that
 * needs the key is ever thrown away.
 */
export async function abandonLockSetup(): Promise<boolean> {
  const state = readLockStateSync();
  if (!state || state.phase !== 'encrypting') return false;
  if (isDesktopApp()) {
    if (!(await desktopSealing().abandonSeal(DB_NAME))) return false;
  } else {
    if (kindOf(DB_NAME) === 'encrypted') return false;
    if (databaseFile(BEFORE_NAME).exists && kindOf(DB_NAME) === 'missing') moveWithSideFiles(BEFORE_NAME, DB_NAME);
    deleteWithSideFiles(PARTIAL_NAME);
  }
  const SecureStore = await secureStore();
  for (const item of [PASSCODE_ITEM, BIOMETRIC_ITEM, MIGRATION_ITEM]) {
    await SecureStore.deleteItemAsync(item).catch(() => {});
  }
  await removeHelloKey();
  deleteLockState();
  return true;
}

export type RecordsBackOutcome =
  | { ok: true; setAside: string }
  | { ok: false; problem: string; syncTurnedOff?: boolean };

/**
 * Brings the records back on a computer whose sealed file no key here opens
 * (1.0.60.15). That happened when a reload after the first setup landed on
 * the setup screen again and a second setup wrote a new key over the only
 * one that opened the records.
 *
 * Nothing is deleted. The sealed file is renamed beside where it was, the
 * lock is cleared, and the copy this computer last saved to the shared
 * folder is loaded into a fresh database, the same as Load the Other
 * Device's Copy would. Refused, with nothing changed, unless sync is on with
 * its password and the folder can be found. If anything after the rename
 * fails, sync is turned off before returning, because an empty computer
 * left syncing would tell the phone that every record had been removed.
 */
export async function bringRecordsBackFromSharedFolder(): Promise<RecordsBackOutcome> {
  if (!isDesktopApp()) return { ok: false, problem: 'This is only for the computer.' };
  const state = readLockStateSync();
  if (!state || state.phase !== 'encrypting') {
    return { ok: false, problem: 'The lock is not partway through being set up, so there is nothing to bring back.' };
  }
  const sqlite = getDesktopBridge().sqlite;
  if (!sqlite.setAsideSealed || !sqlite.filesOnDisk) {
    return { ok: false, problem: 'This installer is too old for this. Install the newest one and try again.' };
  }
  const onDisk = await sqlite.filesOnDisk(DB_NAME);
  if (onDisk.plain || !onDisk.sealed) {
    return { ok: false, problem: 'The records on this computer are not in the state this was made for, so nothing was changed.' };
  }
  const { readSyncState, readSyncRecord, loadSnapshot, disableSnapshotSync } = await import('./snapshotSyncDevice');
  const sync = await readSyncState();
  if (!sync.enabled || !sync.password) {
    return {
      ok: false,
      problem: 'Sync with the shared folder was not on here, so there is no copy to bring back from. Nothing was changed.',
    };
  }
  const cloud = await import('./desktop/cloudFolder');
  let folder = await cloud.findSharedFolderOnDisk();
  if (!folder) {
    const picked = await cloud.pickFolder();
    if (!picked.ok) return { ok: false, problem: picked.reason };
    if (!picked.value) return { ok: false, problem: 'No folder was picked, so nothing was changed.' };
    folder = picked.value;
  }

  await closeDatabasesForRestart();
  const setAside = await sqlite.setAsideSealed(DB_NAME);
  if (!setAside) return { ok: false, problem: 'The locked file could not be moved aside, so nothing was changed.' };

  // The lock goes first: until it does, opening the database is refused.
  const SecureStore = await secureStore();
  for (const item of [PASSCODE_ITEM, BIOMETRIC_ITEM, MIGRATION_ITEM]) {
    await SecureStore.deleteItemAsync(item).catch(() => {});
  }
  await removeHelloKey();
  deleteLockState();

  const turnSyncOff = async (problem: string): Promise<RecordsBackOutcome> => {
    await disableSnapshotSync().catch(() => {});
    return { ok: false, syncTurnedOff: true, problem };
  };
  try {
    const { initializeDatabase, setOneDriveFolder } = await import('./db');
    const { withSessionGuardLifted } = await import('./databaseActivity');
    await initializeDatabase();
    await setOneDriveFolder(folder);
    const record = await readSyncRecord();
    if (!record.ok) return turnSyncOff(record.reason);
    if (!record.value) return turnSyncOff('There is no saved copy in that folder.');
    const loaded = await withSessionGuardLifted(() => loadSnapshot(record.value!));
    if (loaded.status !== 'loaded') return turnSyncOff(loaded.reason);
  } catch (error) {
    return turnSyncOff(error instanceof Error ? error.message : String(error));
  }
  return { ok: true, setAside };
}

/**
 * Locks straight away: the key goes and the app starts again at the lock
 * screen. Whatever sync was still waiting to send goes first, since nothing
 * can be read to send once the key has gone (1.0.60.17).
 */
export async function lockNow(): Promise<void> {
  await runBeforeRestart();
  dropDataKey();
  await restartApp();
}
