// Automatic snapshot sync, the reading, writing and restoring.
//
// lib/snapshotSync.ts decides; this file does. It knows the shared folder
// (lib/oneDriveFolders.ts, Graph on the phone and the OneDrive folder on
// the disk in the desktop app), the backup envelope and its encryption
// (lib/dataBackup.ts, lib/backupEncryption.ts), and the secure store where
// this device's standing is kept. components/SnapshotSyncWatcher.tsx is
// what calls it as the app runs; Profile's Backup & Restore card calls it
// when sync is turned on or off or a save is asked for by hand.
//
// One operation at a time. A save and a load racing each other on one
// device is the same-time problem in miniature, so everything here queues
// behind a single promise.

import { isDesktopApp } from './desktop/bridge';
import { getMyKeyFingerprint } from './deviceIdentity';
import {
  buildBackupEnvelope,
  parseBackupEnvelope,
  restoreFromBackupEnvelope,
  type BackupEnvelope,
} from './dataBackup';
import {
  decryptBackupPayload,
  encryptBackupPayload,
  forgetDerivedKeys,
  isEncryptedBackupWire,
} from './backupEncryption';
import { getDatabaseWriteCount, withDatabaseWriteTrackingSuspended } from './databaseActivity';
import { downloadText, listFiles, uploadText, type DriveItemRef } from './oneDriveGraph';
import { getBackupsFolder } from './oneDriveFolders';
import { getDatabase } from './db';
import {
  describeChanges,
  parseChangeList,
  parseStamps,
  stampTables,
  type TableStamps,
} from './snapshotChanges';
import {
  APP_META_TABLE,
  CHANGE_BASELINE_META_KEY,
  DEVICE_LOCAL_META_KEYS,
  withoutDeviceLocalRows,
  buildSnapshotRecord,
  EMPTY_SYNC_STATE,
  fingerprintText,
  loadedNotice,
  parseSnapshotRecord,
  planBeforeSave,
  planOnArrival,
  snapshotFileName,
  SYNC_RECORD_FILE_NAME,
  type ArrivalPlan,
  type SnapshotRecord,
  type SnapshotSyncState,
  type SyncDevice,
} from './snapshotSync';

const STATE_KEY = 'inside_story_snapshot_sync';

// STATE, IN THE SECURE STORE.
//
// Not app_meta: that table is inside the database and travels with every
// snapshot, so a device loading the other's copy would inherit the other
// device's memory of what it had loaded. The secure store is per device,
// survives a restore, and is where the password belongs anyway.

let stateCache: SnapshotSyncState | null = null;

async function secureStore() {
  return import('expo-secure-store');
}

export async function readSyncState(): Promise<SnapshotSyncState> {
  if (stateCache) return stateCache;
  try {
    const store = await secureStore();
    const raw = await store.getItemAsync(STATE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<SnapshotSyncState>) : {};
    stateCache = { ...EMPTY_SYNC_STATE, ...parsed };
  } catch (error) {
    console.error('[snapshotSync] could not read the sync state', error);
    stateCache = { ...EMPTY_SYNC_STATE };
  }
  return stateCache;
}

export async function updateSyncState(patch: Partial<SnapshotSyncState>): Promise<SnapshotSyncState> {
  const current = await readSyncState();
  const next = { ...current, ...patch };
  stateCache = next;
  try {
    const store = await secureStore();
    await store.setItemAsync(STATE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('[snapshotSync] could not write the sync state', error);
  }
  return next;
}

export async function getMyDevice(): Promise<SyncDevice> {
  const fingerprint = (await getMyKeyFingerprint()).replace(/\s+/g, '');
  return { kind: isDesktopApp() ? 'computer' : 'phone', fingerprint };
}

// ONE AT A TIME.

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  queue = next.catch(() => undefined);
  return next;
}

// THE RECORD IN THE FOLDER.

type FolderResult<T> = { ok: true; value: T } | { ok: false; reason: string };

async function readRecordFrom(folder: DriveItemRef): Promise<FolderResult<SnapshotRecord | null>> {
  const files = await listFiles(folder);
  if (!files.ok) return files;
  if (!files.value.some((file) => file.name === SYNC_RECORD_FILE_NAME)) return { ok: true, value: null };
  const text = await downloadText(folder, SYNC_RECORD_FILE_NAME);
  if (!text.ok) return text;
  return { ok: true, value: parseSnapshotRecord(text.value) };
}

/** The record as it stands, or why it could not be read. */
export async function readSyncRecord(): Promise<FolderResult<SnapshotRecord | null>> {
  const folder = await getBackupsFolder();
  if (!folder.ok) return folder;
  return readRecordFrom(folder.value);
}

// THIS DEVICE'S OWN ROWS IN app_meta.
//
// See DEVICE_LOCAL_META_KEYS in lib/snapshotSync.ts for what is in the
// list and why. A snapshot is built without them, and a load puts back
// what was here before it, so a copy saved by an older build (which does
// carry them) cannot take the shared folder out from under this device.

type MetaRow = { key: string; value: string; updated_at: string | null };

async function readDeviceLocalRows(): Promise<MetaRow[]> {
  const db = await getDatabase();
  const places = DEVICE_LOCAL_META_KEYS.map(() => '?').join(', ');
  return db.getAllAsync<MetaRow>(
    `SELECT key, value, updated_at FROM ${APP_META_TABLE} WHERE key IN (${places})`,
    [...DEVICE_LOCAL_META_KEYS],
  );
}

async function putBackDeviceLocalRows(rows: MetaRow[]): Promise<void> {
  if (rows.length === 0) return;
  const db = await getDatabase();
  const now = new Date().toISOString();
  for (const row of rows) {
    await db.runAsync(
      `
        INSERT INTO ${APP_META_TABLE} (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
      row.key,
      row.value,
      row.updated_at ?? now,
    );
  }
}

// WHAT CHANGED SINCE LAST TIME.
//
// The words a person reads come from lib/snapshotChanges.ts, which needs
// a stamp of the tables as they stood the last time this device and the
// folder agreed. That stamp is a few kilobytes, past what the secure
// store holds on Android, so it lives in app_meta under a key that never
// travels (CHANGE_BASELINE_META_KEY) and is written with the write
// tracking suspended, since bookkeeping is not a change to save.
//
// It is reset on a save and on a load alike. Resetting only on a load
// would be truer to what the other device has actually seen, and would
// also let one device build a list that grows for as long as the other
// stays away. The accepted cost of resetting on both: several saves in a
// row before the other device catches up leave the notice naming the
// last batch rather than all of them.

async function readChangeBaseline(): Promise<TableStamps | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM ${APP_META_TABLE} WHERE key = ?`,
      CHANGE_BASELINE_META_KEY,
    );
    return parseStamps(row?.value);
  } catch (error) {
    console.error('[snapshotSync] could not read the change baseline', error);
    return null;
  }
}

async function writeChangeBaseline(stamps: TableStamps): Promise<void> {
  try {
    await withDatabaseWriteTrackingSuspended(async () => {
      const db = await getDatabase();
      await db.runAsync(
        `
          INSERT INTO ${APP_META_TABLE} (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `,
        CHANGE_BASELINE_META_KEY,
        JSON.stringify(stamps),
        new Date().toISOString(),
      );
    });
  } catch (error) {
    console.error('[snapshotSync] could not write the change baseline', error);
  }
}

/**
 * What this device has written since it last saved or loaded, said the
 * same way the other copy says its own. Built on the spot for a question
 * that is about to be asked, since it reads every table.
 */
export function describeUnsavedChangesHere(): Promise<string[]> {
  return enqueue(async () => {
    const state = await readSyncState();
    if (!state.enabled) return [];
    const baseline = await readChangeBaseline();
    if (!baseline) return [];
    try {
      const built = await buildBackupEnvelope();
      return describeChanges(baseline, stampTables(withoutDeviceLocalRows(built.tables), fingerprintText));
    } catch (error) {
      console.error('[snapshotSync] could not work out what is unsaved here', error);
      return [];
    }
  });
}

// What the copy in the folder says it brings, kept by the moment it was
// saved: the question and the load that usually follows it both want it,
// and the download costs the same either way. Deliberately outside the
// queue, since it only reads, and a save waiting behind a download of a
// whole database would be its own delay.
let peeked: { savedAt: string; changes: string[] } | null = null;

/** What the copy in the folder brings, or nothing when it cannot be read. */
export async function peekIncomingChanges(record: SnapshotRecord): Promise<string[]> {
  if (peeked && peeked.savedAt === record.latest.savedAt) return peeked.changes;
  const state = await readSyncState();
  if (!state.enabled || !state.password) return [];
  const folder = await getBackupsFolder();
  if (!folder.ok) return [];
  const downloaded = await downloadSnapshot(folder.value, record, state.password);
  if (!downloaded.ok) return [];
  peeked = { savedAt: record.latest.savedAt, changes: downloaded.value.changes };
  return peeked.changes;
}

// THE SNAPSHOT'S CONTENTS.

function tablesHash(envelope: BackupEnvelope): string {
  // The tables only: exportedAt changes on every build, and a snapshot of
  // the same rows a minute later is the same snapshot.
  return fingerprintText(JSON.stringify(envelope.tables));
}

async function downloadSnapshot(
  folder: DriveItemRef,
  record: SnapshotRecord,
  password: string,
): Promise<FolderResult<{ envelope: BackupEnvelope; changes: string[] }>> {
  const text = await downloadText(folder, record.latest.fileName);
  if (!text.ok) return text;
  let wire: unknown;
  try {
    wire = JSON.parse(text.value);
  } catch {
    return { ok: false, reason: 'The copy in your shared folder could not be read.' };
  }
  if (!isEncryptedBackupWire(wire)) {
    return { ok: false, reason: 'The copy in your shared folder is not an encrypted snapshot.' };
  }
  const json = await decryptBackupPayload(wire, password);
  if (json === null) {
    return {
      ok: false,
      reason:
        'The copy in your shared folder was saved with a different password. Turn sync off and on again here and enter the password used on your other device.',
    };
  }
  const envelope = parseBackupEnvelope(json);
  if (!envelope) return { ok: false, reason: 'The copy in your shared folder could not be read.' };
  // The list of changes rides inside the encrypted payload beside the
  // tables, never in the plaintext record: what somebody added to is as
  // much their health as what they added. parseBackupEnvelope answers the
  // parsed object as it stands, so the extra key is already here and the
  // several megabytes are parsed once.
  const changes = parseChangeList((envelope as { syncChanges?: unknown }).syncChanges);
  return { ok: true, value: { envelope, changes } };
}

export type SaveOutcome =
  | { status: 'saved'; savedAt: string }
  | { status: 'unchanged' }
  | { status: 'skipped'; reason: 'off' | 'clean' }
  | { status: 'conflict'; record: SnapshotRecord }
  | { status: 'problem'; reason: string };

/**
 * Saves this device's snapshot, unless the folder holds a newer copy from
 * the other device that this one has not loaded (a conflict, handed back
 * for the person to settle). `force` is that decision: save over it.
 */
export function saveSnapshot(options: { force?: boolean } = {}): Promise<SaveOutcome> {
  return enqueue(async () => {
    const state = await readSyncState();
    const me = await getMyDevice();
    if (!state.enabled || !state.password) return { status: 'skipped', reason: 'off' };
    if (!options.force && state.dirtySince === null) return { status: 'skipped', reason: 'clean' };

    const folder = await getBackupsFolder();
    if (!folder.ok) return problem(folder.reason);
    const record = await readRecordFrom(folder.value);
    if (!record.ok) return problem(record.reason);

    const plan = planBeforeSave(record.value, state, me, options);
    if (plan.action === 'skip') return { status: 'skipped', reason: plan.reason };
    if (plan.action === 'conflict') return { status: 'conflict', record: plan.record };

    const writesBefore = getDatabaseWriteCount();
    let envelope: BackupEnvelope;
    try {
      const built = await buildBackupEnvelope();
      // This device's bookkeeping stays here rather than being published
      // to the other device. Done before the hash, so a change to a row
      // that never travels is not a reason to upload.
      envelope = { ...built, tables: withoutDeviceLocalRows(built.tables) };
    } catch (error) {
      console.error('[snapshotSync] could not build the snapshot', error);
      return problem('The snapshot could not be built on this device.');
    }
    const hash = tablesHash(envelope);
    if (!options.force && hash === state.lastHash) {
      // Nothing the other device does not already have. Idempotent writes
      // at startup land here rather than as an upload.
      await updateSyncState({
        dirtySince: getDatabaseWriteCount() === writesBefore ? null : state.dirtySince,
        lastCheckedAt: new Date().toISOString(),
        lastProblem: null,
      });
      return { status: 'unchanged' };
    }

    const stamps = stampTables(envelope.tables, fingerprintText);
    const baseline = await readChangeBaseline();
    const changes = baseline ? describeChanges(baseline, stamps) : [];
    const wire = await encryptBackupPayload(
      JSON.stringify({ ...envelope, syncChanges: changes }),
      state.password,
    );
    const savedAt = envelope.exportedAt;
    const uploaded = await uploadText(folder.value, snapshotFileName(me), JSON.stringify(wire));
    if (!uploaded.ok) return problem(uploaded.reason);
    const recorded = await uploadText(
      folder.value,
      SYNC_RECORD_FILE_NAME,
      JSON.stringify(buildSnapshotRecord(me, savedAt)),
    );
    if (!recorded.ok) return problem(recorded.reason);
    await writeChangeBaseline(stamps);

    await updateSyncState({
      loadedSavedAt: savedAt,
      lastSavedAt: savedAt,
      lastCheckedAt: new Date().toISOString(),
      lastHash: hash,
      // A write that landed while the upload was in flight is still unsaved.
      dirtySince: getDatabaseWriteCount() === writesBefore ? null : new Date().toISOString(),
      lastProblem: null,
    });
    return { status: 'saved', savedAt };
  });
}

async function problem(reason: string): Promise<{ status: 'problem'; reason: string }> {
  await updateSyncState({ lastProblem: reason, lastCheckedAt: new Date().toISOString() });
  return { status: 'problem', reason };
}

export type LoadOutcome =
  | { status: 'loaded'; record: SnapshotRecord }
  | { status: 'problem'; reason: string };

/**
 * Replaces everything on this device with the other device's snapshot.
 * The caller restarts the app afterwards (Updates.reloadAsync), because
 * module-level caches such as visual preferences read the database once;
 * the notice for after that restart is left in the state here.
 */
export function loadSnapshot(record: SnapshotRecord): Promise<LoadOutcome> {
  return enqueue(async () => {
    const state = await readSyncState();
    if (!state.enabled || !state.password) return { status: 'problem', reason: 'Sync is off on this device.' };
    const folder = await getBackupsFolder();
    if (!folder.ok) return problem(folder.reason);
    const downloaded = await downloadSnapshot(folder.value, record, state.password);
    if (!downloaded.ok) return problem(downloaded.reason);
    const { envelope, changes } = downloaded.value;
    try {
      await withDatabaseWriteTrackingSuspended(async () => {
        const mine = await readDeviceLocalRows();
        await restoreFromBackupEnvelope(envelope);
        await putBackDeviceLocalRows(mine);
      });
    } catch (error) {
      console.error('[snapshotSync] the restore failed', error);
      return problem('The copy could not be loaded onto this device.');
    }
    // Stamped from what was loaded rather than by reading the tables back:
    // these rows are exactly the ones just written. The restore emptied
    // app_meta, so this lands after it rather than inside it.
    await writeChangeBaseline(stampTables(withoutDeviceLocalRows(envelope.tables), fingerprintText));
    peeked = null;
    const now = new Date().toISOString();
    await updateSyncState({
      loadedSavedAt: record.latest.savedAt,
      lastLoadedAt: now,
      lastCheckedAt: now,
      lastHash: tablesHash(envelope),
      dirtySince: null,
      lastProblem: null,
      pendingNotice: loadedNotice(record, changes),
    });
    return { status: 'loaded', record };
  });
}

export type CheckOutcome = ArrivalPlan | { action: 'problem'; reason: string };

/** Looks at the record and says what it calls for. Loads nothing itself. */
export function checkForArrival(): Promise<CheckOutcome> {
  return enqueue(async () => {
    const state = await readSyncState();
    if (!state.enabled) return { action: 'nothing', reason: 'off' };
    const me = await getMyDevice();
    const record = await readSyncRecord();
    if (!record.ok) return problem2(record.reason);
    await updateSyncState({ lastCheckedAt: new Date().toISOString() });
    return planOnArrival(record.value, state, me);
  });
}

async function problem2(reason: string): Promise<{ action: 'problem'; reason: string }> {
  await updateSyncState({ lastProblem: reason, lastCheckedAt: new Date().toISOString() });
  return { action: 'problem', reason };
}

/**
 * Whether the password given matches the copy already in the folder, for
 * turning sync on where the other device already saved something. Answers
 * the record so the caller can go on to load it or save over it.
 */
export async function checkPasswordAgainstFolder(
  password: string,
): Promise<{ ok: true; record: SnapshotRecord | null } | { ok: false; reason: string }> {
  const folder = await getBackupsFolder();
  if (!folder.ok) return { ok: false, reason: folder.reason };
  const record = await readRecordFrom(folder.value);
  if (!record.ok) return { ok: false, reason: record.reason };
  if (!record.value) return { ok: true, record: null };
  const me = await getMyDevice();
  if (record.value.latest.device.fingerprint === me.fingerprint) return { ok: true, record: record.value };
  const downloaded = await downloadSnapshot(folder.value, record.value, password);
  if (!downloaded.ok) {
    return {
      ok: false,
      reason: 'That is not the password sync was turned on with on your other device. Enter the same one here.',
    };
  }
  return { ok: true, record: record.value };
}

export async function enableSnapshotSync(password: string): Promise<void> {
  await updateSyncState({
    ...EMPTY_SYNC_STATE,
    enabled: true,
    password,
    // Everything on this device is unsaved until the first save goes through.
    dirtySince: new Date().toISOString(),
  });
}

export async function disableSnapshotSync(): Promise<void> {
  await updateSyncState({ ...EMPTY_SYNC_STATE });
  // Nothing of the password, or of the other device, is kept once sync is off.
  forgetDerivedKeys();
  peeked = null;
}

/** The one-time notice left by an automatic load, cleared as it is read. */
export async function takePendingNotice(): Promise<string | null> {
  const state = await readSyncState();
  if (!state.pendingNotice) return null;
  await updateSyncState({ pendingNotice: null });
  return state.pendingNotice;
}

/** Called on every counted write: the first one after a save starts the unsaved period. */
export async function markDatabaseDirty(): Promise<void> {
  const state = await readSyncState();
  if (!state.enabled || state.dirtySince !== null) return;
  await updateSyncState({ dirtySince: new Date().toISOString() });
}
