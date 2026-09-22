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

type WriteListener = (count: number) => void;

let writeCount = 0;
let suspendDepth = 0;
const listeners = new Set<WriteListener>();

// Any statement in a script, not only the first: a migration script can
// carry a CREATE TABLE and then an INSERT.
const ROW_CHANGING = /(^|;)\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i;

export function isRowChangingSql(sql: string): boolean {
  return ROW_CHANGING.test(sql);
}

/** Records one write. Silent while tracking is suspended (during a restore). */
export function noteDatabaseWrite(): void {
  if (suspendDepth > 0) return;
  writeCount += 1;
  for (const listener of listeners) {
    try {
      listener(writeCount);
    } catch (error) {
      console.error('[databaseActivity] listener failed', error);
    }
  }
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
    const result = await runAsync(...args);
    if (typeof args[0] === 'string' && isRowChangingSql(args[0])) noteDatabaseWrite();
    return result;
  };
  db.execAsync = async (source: string) => {
    await execAsync(source);
    if (isRowChangingSql(source)) noteDatabaseWrite();
  };
  return db;
}
