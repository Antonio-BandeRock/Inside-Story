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

import { File, Paths } from 'expo-file-system';
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
  wordsForTable,
  type TableStamps,
} from './snapshotChanges';
import {
  conflictsIn,
  describeMerge,
  mergeTables,
  type MergeSide,
  type Tables,
} from './snapshotMerge';
import { readSchemaShapes, WORKED_OUT_TABLES } from './snapshotShapes';
import { recordMerge } from './syncLog';
import {
  ANNOUNCE_MERGES,
  APP_META_TABLE,
  CHANGE_BASELINE_META_KEY,
  DEVICE_LOCAL_META_KEYS,
  withoutDeviceLocalRows,
  buildSnapshotRecord,
  EMPTY_SYNC_STATE,
  fingerprintText,
  loadedNotice,
  mergedNotice,
  parseSnapshotRecord,
  planBeforeSave,
  planOnArrival,
  snapshotFileName,
  SYNC_RECORD_FILE_NAME,
  type ArrivalPlan,
  type SnapshotRecord,
  type SnapshotSyncState,
  type SyncChangeNotes,
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
  | { status: 'merge'; record: SnapshotRecord }
  | { status: 'problem'; reason: string };

/**
 * Saves this device's snapshot, unless the folder holds a copy from the
 * other device that this one has not taken in, which is handed back for
 * the caller to merge first. `force` skips that, and is only ever the
 * answer to the first-time question.
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
    if (plan.action === 'merge') return { status: 'merge', record: plan.record };

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
    // Only for a pair with no history yet, where the other device reads
    // this copy whole. After that the base is what arrived, since sending
    // says nothing about what the other device has read.
    seedMergeBase(envelope.tables as Tables);

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
    const loaded = withoutDeviceLocalRows(envelope.tables) as Tables;
    await writeChangeBaseline(stampTables(loaded, fingerprintText));
    writeMergeBase(loaded);
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

// THE COPY THE OTHER DEVICE LAST HELD.
//
// A merge needs three things: what arrived, what is here, and what both
// devices last held in common. Without the third, a row only one side
// has cannot be told apart from a row the other side deleted, and the
// merge would quietly bring back everything either device has ever
// removed.
//
// THE BASE IS THE COPY THAT ARRIVED, AND NEVER THE COPY THAT WAS SENT.
// A save learns nothing about the other device: it puts a file in the
// folder and cannot know whether anybody has read it. Writing the base
// from a save claimed the other device had seen those rows, so when that
// device saved a copy it had built before reading ours, every row added
// here looked like a row deleted there and was dropped. A row could flip
// between present and absent on each exchange, and a change made inside
// the minute OneDrive takes to carry a file could go quietly. So the base
// moves only when a copy is read: a load takes it whole, a merge takes
// what arrived (renumbered into this device's ids, which is why
// mergeTables hands that back), and a save seeds it only when there is
// nothing there at all.
//
// It goes stale in the safe direction. The other device has usually
// merged and moved on past the copy recorded here, which makes a row it
// holds look added rather than deleted, and an addition is kept.
//
// A file rather than a table: it is a copy of every table, so keeping it
// in the database would double the database and travel inside the next
// snapshot. It sits beside the database in the app's private storage, no
// more reachable than the database itself, and the desktop app gets the
// same File and Paths through lib/desktop.
//
// Missing is survivable. A device with nothing written since its last
// save is itself the agreed copy, which is the ordinary case, so the
// file only decides anything when there are unsaved changes here at the
// moment a copy arrives. Missing with unsaved changes falls back to
// asking, which is the first merge after an upgrade from 1.0.49.2 and
// nothing after that.

const MERGE_BASE_FILE_NAME = 'inside-story-sync-base.json';

function mergeBaseFile(): File {
  return new File(Paths.document, MERGE_BASE_FILE_NAME);
}

async function readMergeBase(): Promise<Tables | null> {
  try {
    const file = mergeBaseFile();
    if (!file.exists) return null;
    const parsed: unknown = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Tables;
  } catch (error) {
    console.error('[snapshotSync] could not read the agreed copy', error);
    return null;
  }
}

function writeMergeBase(tables: Tables): void {
  try {
    mergeBaseFile().write(JSON.stringify(tables));
  } catch (error) {
    // The next merge asks instead, which is where this was before.
    console.error('[snapshotSync] could not write the agreed copy', error);
  }
}

/**
 * The starting point for a pair with nothing between them yet, which is
 * the copy this device just published: the other device reads it whole
 * the first time. Does nothing once there is a base to go on.
 */
function seedMergeBase(tables: Tables): void {
  try {
    if (mergeBaseFile().exists) return;
  } catch (error) {
    console.error('[snapshotSync] could not look for the agreed copy', error);
    return;
  }
  writeMergeBase(tables);
}

function forgetMergeBase(): void {
  try {
    const file = mergeBaseFile();
    if (file.exists) file.delete();
  } catch (error) {
    console.error('[snapshotSync] could not clear the agreed copy', error);
  }
}

export type MergeOutcome =
  | { status: 'merged'; record: SnapshotRecord; restart: boolean; notice: string | null }
  | { status: 'noBase'; record: SnapshotRecord }
  | { status: 'problem'; reason: string };

/**
 * Brings the copy in the folder together with what is on this device,
 * row by row, keeping every change either device made.
 *
 * This is what replaced the question with two answers that both threw
 * work away (1.0.49.3). What it cannot do is invent a shared history:
 * with no agreed copy to work changes out against it answers 'noBase'
 * and the caller asks instead.
 *
 * It writes to the database only when the merge actually changed
 * something here, so a copy carrying nothing new costs no restart. The
 * caller saves afterwards: the merged result is not in the folder until
 * it does, and the other device is waiting for it.
 */
export function mergeSnapshot(record: SnapshotRecord): Promise<MergeOutcome> {
  return enqueue(async () => {
    const state = await readSyncState();
    const me = await getMyDevice();
    if (!state.enabled || !state.password) {
      return { status: 'problem', reason: 'Sync is off on this device.' };
    }

    const folder = await getBackupsFolder();
    if (!folder.ok) return problem(folder.reason);
    const downloaded = await downloadSnapshot(folder.value, record, state.password);
    if (!downloaded.ok) return problem(downloaded.reason);

    let built: BackupEnvelope;
    try {
      built = await buildBackupEnvelope();
    } catch (error) {
      console.error('[snapshotSync] could not read this device for the merge', error);
      return problem('What is on this device could not be read.');
    }
    const here = withoutDeviceLocalRows(built.tables) as Tables;
    const there = withoutDeviceLocalRows(downloaded.value.envelope.tables) as Tables;

    let base = await readMergeBase();
    if (!base && state.dirtySince === null) base = here;
    if (!base) return { status: 'noBase', record };

    // Which device to believe about one record both devices moved that
    // carries no time of its own. The row's own timestamp settles it
    // where there is one (laterOf in lib/snapshotMerge.ts); this is the
    // fallback, and it compares when the writing here began against when
    // the other device saved.
    const laterSide: MergeSide =
      state.dirtySince !== null && state.dirtySince > record.latest.savedAt ? 'here' : 'there';

    let merged;
    try {
      const { shapes } = await readSchemaShapes(Object.keys(here));
      merged = mergeTables(base, here, there, { shapes, laterSide, wholesale: WORKED_OUT_TABLES });
    } catch (error) {
      console.error('[snapshotSync] the merge failed', error);
      return problem('The two copies could not be brought together on this device.');
    }

    const restart = fingerprintText(JSON.stringify(merged.tables)) !== fingerprintText(JSON.stringify(here));
    if (restart) {
      try {
        await withDatabaseWriteTrackingSuspended(async () => {
          const mine = await readDeviceLocalRows();
          await restoreFromBackupEnvelope({
            ...built,
            tableNames: Object.keys(merged.tables),
            tables: merged.tables,
          });
          await putBackDeviceLocalRows(mine);
        });
      } catch (error) {
        console.error('[snapshotSync] writing the merged copy failed', error);
        return problem('The merged copy could not be written to this device.');
      }
    }

    // What arrived, not what the merge made of it. The other device has
    // not been handed the merged copy yet, and until it has, these are the
    // rows it holds.
    writeMergeBase(merged.incoming);
    await writeChangeBaseline(stampTables(merged.tables, fingerprintText));
    await recordMerge(merged.entries, { here: me.kind, there: record.latest.device.kind });
    peeked = null;

    const notice = ANNOUNCE_MERGES
      ? mergedNotice(
          record,
          {
            there: describeMerge(merged.entries, wordsForTable, 'there'),
            here: describeMerge(merged.entries, wordsForTable, 'here'),
          } satisfies SyncChangeNotes,
          conflictsIn(merged.entries).length,
        )
      : null;

    const now = new Date().toISOString();
    await updateSyncState({
      loadedSavedAt: record.latest.savedAt,
      lastLoadedAt: now,
      lastCheckedAt: now,
      // Cleared rather than set to what was just merged, since the folder
      // may not hold this yet. A later write on this device then always
      // saves, instead of being read as matching what was last sent.
      lastHash: null,
      // Only when the merge left something the copy that arrived does not
      // already hold. Saving back a copy identical to the one in the
      // folder tells the other device nothing, and it costs: that device
      // reads the fresh record as an arrival, merges it, saves in its
      // turn, and the two answer each other for as long as both are open.
      dirtySince: merged.sendsBack ? now : null,
      lastProblem: null,
      pendingNotice: restart ? notice : null,
    });
    return { status: 'merged', record, restart, notice };
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
  // Nothing from a previous pairing counts as agreed with this one.
  forgetMergeBase();
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
  forgetMergeBase();
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
