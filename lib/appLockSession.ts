// App Lock: the one place the database key is held while the app is
// unlocked, and what getDatabase() in lib/db.ts asks before it opens the
// file. Kept apart from lib/appLockDevice.ts so lib/db.ts can import it
// without pulling in secure store, the prompt or the migration.
//
// The key lives only in this module's memory. A restart, which is how the
// app locks itself (lib/restartApp.ts), replaces the JS context and the key
// with it, so nothing has to remember to wipe it.
//
// A reminder button pressed with the app closed, or a widget redrawing,
// starts the app's JS with no key. The lock file says the lock is on, so
// getDatabase() refuses with AppLockedError rather than opening an
// encrypted file without its key (which SQLite would report as "file is
// not a database"). Both callers treat that as locked and stay quiet.

import { File, Paths } from 'expo-file-system';
import { parseLockState, type AppLockState } from './appLock';

export const LOCK_FILE_NAME = 'app-lock.json';

export class AppLockedError extends Error {
  constructor() {
    super('Inside Story is locked.');
    this.name = 'AppLockedError';
  }
}

export function isAppLockedError(error: unknown): boolean {
  return error instanceof AppLockedError || (error instanceof Error && error.name === 'AppLockedError');
}

let heldKey: Uint8Array | null = null;

export function holdDataKey(key: Uint8Array): void {
  heldKey = key;
}

export function dropDataKey(): void {
  if (heldKey) heldKey.fill(0);
  heldKey = null;
}

export function isUnlocked(): boolean {
  return heldKey !== null;
}

/** The lock file as it is on disk, or null when the lock is off. */
export function readLockStateSync(): AppLockState | null {
  try {
    const file = new File(Paths.document, LOCK_FILE_NAME);
    if (!file.exists) return null;
    return parseLockState(file.textSync());
  } catch (error) {
    console.error('[appLock] the lock file could not be read', error);
    return null;
  }
}

/**
 * The key to open the database with: null when the lock is off, the held
 * key when unlocked. Throws AppLockedError when the lock is on and nobody
 * has unlocked, or while the database is still being moved.
 */
export function dataKeyForOpening(): Uint8Array | null {
  const state = readLockStateSync();
  if (!state) return null;
  if (state.phase !== 'on' || !heldKey) throw new AppLockedError();
  return heldKey;
}

/** The held key, or null when nobody has unlocked (or the lock is off). */
export function heldDataKey(): Uint8Array | null {
  return heldKey;
}

/** True when the lock is on and nobody has unlocked in this run of the app. */
export function isLockedNow(): boolean {
  return readLockStateSync() !== null && heldKey === null;
}

/**
 * Whether a reminder queued now names only its kind (R9). True whenever the
 * lock is set up, locked or not, since a reminder's words are fixed when it
 * is queued and shown later on the lock screen; false only when the person
 * chose full detail.
 */
export function reminderDetailHidden(): boolean {
  const state = readLockStateSync();
  return state !== null && state.reminderDetail !== 'full';
}
