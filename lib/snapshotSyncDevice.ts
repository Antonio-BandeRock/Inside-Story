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
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupWire } from './backupEncryption';
import { getDatabaseWriteCount, withDatabaseWriteTrackingSuspended } from './databaseActivity';
import { downloadText, listFiles, uploadText, type DriveItemRef } from './oneDriveGraph';
import { getBackupsFolder } from './oneDriveFolders';
import {
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
): Promise<FolderResult<BackupEnvelope>> {
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
  return { ok: true, value: envelope };
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
      envelope = await buildBackupEnvelope();
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

    const wire = await encryptBackupPayload(JSON.stringify(envelope), state.password);
    const savedAt = envelope.exportedAt;
    const uploaded = await uploadText(folder.value, snapshotFileName(me), JSON.stringify(wire));
    if (!uploaded.ok) return problem(uploaded.reason);
    const recorded = await uploadText(
      folder.value,
      SYNC_RECORD_FILE_NAME,
      JSON.stringify(buildSnapshotRecord(me, savedAt)),
    );
    if (!recorded.ok) return problem(recorded.reason);

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
    const envelope = await downloadSnapshot(folder.value, record, state.password);
    if (!envelope.ok) return problem(envelope.reason);
    try {
      await withDatabaseWriteTrackingSuspended(() => restoreFromBackupEnvelope(envelope.value));
    } catch (error) {
      console.error('[snapshotSync] the restore failed', error);
      return problem('The copy could not be loaded onto this device.');
    }
    const now = new Date().toISOString();
    await updateSyncState({
      loadedSavedAt: record.latest.savedAt,
      lastLoadedAt: now,
      lastCheckedAt: now,
      lastHash: tablesHash(envelope.value),
      dirtySince: null,
      lastProblem: null,
      pendingNotice: loadedNotice(record),
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
  const envelope = await downloadSnapshot(folder.value, record.value, password);
  if (!envelope.ok) {
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
