// Whether anything has been written to the person's database, and when.
//
// Automatic snapshot sync (lib/snapshotSync.ts) needs to know two things:
// that something changed since the last save, and that the writing has
// paused long enough to save once rather than after every keystroke. Every
// write in this app goes through the one connection getDatabase() opens,
// so wrapping runAsync and execAsync on that instance (see
// attachWriteTracking, called from getDatabase in lib/db.ts) hears all of
// them, on the phone and in the desktop app alike.
//
// expo-sqlite's addDatabaseChangeListener was not used: it fires once per
// changed row, and a restore rewrites every row of every table.
//
// Only statements that change rows count. A PRAGMA, a CREATE TABLE at
// startup or a SELECT is not something the other device needs.

import { APP_META_TABLE, DEVICE_LOCAL_TABLES } from './snapshotSync';

type WriteListener = (count: number) => void;

let writeCount = 0;
let lastWriteAt = 0;
let suspendDepth = 0;
const listeners = new Set<WriteListener>();

// Any statement in a script, not only the first: a migration script can
// carry a CREATE TABLE and then an INSERT.
const ROW_CHANGING = /(^|;)\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i;

export function isRowChangingSql(sql: string): boolean {
  return ROW_CHANGING.test(sql);
}

// Tables that stay on this device (DEVICE_LOCAL_TABLES in
// lib/snapshotSync.ts) and are written often enough to matter: a gateway
// read every minute (I20) writes its samples and its last-read time each
// time, and neither is anything the other device receives. A single
// statement writing only to one of these is not counted, so sync does not
// save a snapshot that nothing in it changed. The hours and days worked out
// from the samples go to tables that travel and are counted as usual.
const STAYS_ON_THIS_DEVICE =
  /^\s*(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:garden_device_samples|garden_gateway_polling|daily_weather)\b[^;]*;?\s*$/i;

/** Whether a statement is a change the other device needs to hear about. */
export function countsAsChange(sql: string): boolean {
  return isRowChangingSql(sql) && !STAYS_ON_THIS_DEVICE.test(sql);
}

// READ ONLY WHILE THE OTHER DEVICE HAS THE SESSION (lib/syncSession.ts).
//
// The watcher sets a guard while the other device has the session, and
// every change the person could make is refused with a sentence saying
// why, before it reaches the database. Three kinds of write still go
// through: bringing the other device's copy in (tracking suspended), work
// the app does on its own that a person is not there to redo, such as a
// weather station's readings (withSessionGuardLifted), and rows that
// never leave this device, which app_meta is counted among since what is
// written there on its own is this device's bookkeeping. A setting
// changed there in the meantime is merged the way everything was before
// the lock, which is what the merge underneath is kept for.

export class SessionReadOnlyError extends Error {}

let guard: (() => string | null) | null = null;
let liftDepth = 0;

const LOCAL_TABLE_NAMES = [APP_META_TABLE, ...DEVICE_LOCAL_TABLES].join('|');
const WRITES_ONLY_HERE = new RegExp(
  '^\\s*(?:INSERT(?:\\s+OR\\s+\\w+)?\\s+INTO|REPLACE\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+(?:' + LOCAL_TABLE_NAMES + ')\\b[^;]*;?\\s*$',
  'i',
);

/** Sets or clears the guard. It answers the refusal sentence while writes are refused, or null. */
export function setSessionWriteGuard(next: (() => string | null) | null): void {
  guard = next;
}

/** Work the app does on its own, allowed while this device waits. */
export async function withSessionGuardLifted<T>(work: () => Promise<T>): Promise<T> {
  liftDepth += 1;
  try {
    return await work();
  } finally {
    liftDepth -= 1;
  }
}

/** The sentence a statement is refused with right now, or null when it may run. */
export function sessionRefusalFor(sql: string): string | null {
  if (!guard || suspendDepth > 0 || liftDepth > 0) return null;
  if (!countsAsChange(sql) || WRITES_ONLY_HERE.test(sql)) return null;
  return guard();
}

/** Records one write. Silent while tracking is suspended (during a restore). */
export function noteDatabaseWrite(): void {
  if (suspendDepth > 0) return;
  writeCount += 1;
  lastWriteAt = Date.now();
  for (const listener of listeners) {
    try {
      listener(writeCount);
    } catch (error) {
      console.error('[databaseActivity] listener failed', error);
    }
  }
}

/** When the last counted write happened (Date.now()), or 0 when nothing has been written this run. */
export function getLastDatabaseWriteAt(): number {
  return lastWriteAt;
}

/** Rises by one on every counted write; compare two readings to see whether anything happened between them. */
export function getDatabaseWriteCount(): number {
  return writeCount;
}

/**
 * Runs work whose writes are not changes of the person's making: loading
 * the other device's snapshot rewrites every table, and that must not
 * read as something new to save back.
 */
export async function withDatabaseWriteTrackingSuspended<T>(work: () => Promise<T>): Promise<T> {
  suspendDepth += 1;
  try {
    return await work();
  } finally {
    suspendDepth -= 1;
  }
}

export function addDatabaseWriteListener(listener: WriteListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

type TrackableDatabase = {
  runAsync: (...args: any[]) => Promise<any>;
  execAsync: (source: string) => Promise<void>;
};

/**
 * Wraps the two methods every write in this app goes through. The
 * connection is returned so getDatabase can hand back the same object it
 * opened; the wrapped methods live on the instance, ahead of the
 * prototype's, so `db.runAsync(...)` anywhere lands here first.
 */
export function attachWriteTracking<T extends TrackableDatabase>(db: T): T {
  const runAsync = db.runAsync.bind(db);
  const execAsync = db.execAsync.bind(db);
  db.runAsync = async (...args: any[]) => {
    const refusal = typeof args[0] === 'string' ? sessionRefusalFor(args[0]) : null;
    if (refusal) throw new SessionReadOnlyError(refusal);
    const result = await runAsync(...args);
    if (typeof args[0] === 'string' && countsAsChange(args[0])) noteDatabaseWrite();
    return result;
  };
  db.execAsync = async (source: string) => {
    const refusal = sessionRefusalFor(source);
    if (refusal) throw new SessionReadOnlyError(refusal);
    await execAsync(source);
    if (countsAsChange(source)) noteDatabaseWrite();
  };
  return db;
}
