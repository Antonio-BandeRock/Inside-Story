// Automatic snapshot sync between a phone and a computer, the decisions.
//
// Both devices share one OneDrive folder (see lib/oneDriveFolders.ts), and
// since 1.0.42.28 each keeps an encrypted copy of its whole database there
// and loads the other's when it is newer. This is the whole-snapshot design
// CLAUDE.md decided under "Multi-device sync model": the copy in the folder
// is the current state, a device pulls it, works against it, and pushes it
// back. Step A, which this is, does the saving and loading; step B, the lock
// file with takeover and a 30-minute lease, is not built.
//
// One person, two devices, not meant to be used at the same time, but
// programmed as if they might be. Two guards follow from that, and every
// decision in this file serves one of them:
//
//   1. A save never writes over a copy this device has not loaded. Before
//      saving, the record is read; if the other device saved something
//      newer than what this device is at, the save stops and the person
//      decides.
//   2. A load never throws away unsaved changes on this device. If this
//      device has written since it last saved, an arriving copy is a
//      conflict rather than an automatic load.
//
// What is in the folder: one snapshot file per device, replaced on every
// save, and one small plain record (SYNC_RECORD_FILE_NAME) naming the
// latest snapshot, which device saved it and when. The record holds no
// health content, so a device can see that something arrived without
// downloading or decrypting anything. The device fingerprint in it is the
// same one already visible in the Mailbox file names.
//
// This module does no I/O at all so scripts/test_snapshot_sync.js can check
// every decision without a phone or a folder. lib/snapshotSyncDevice.ts
// does the reading, writing and restoring.

export type SyncDeviceKind = 'phone' | 'computer';

export type SyncDevice = {
  kind: SyncDeviceKind;
  fingerprint: string;
};

export type SnapshotRecord = {
  version: 1;
  latest: {
    fileName: string;
    /** ISO 8601, the saving device's clock. Compared for equality only. */
    savedAt: string;
    device: SyncDevice;
  };
};

/**
 * What one device remembers about where it stands. Kept in the secure
 * store rather than app_meta, because app_meta is inside the database and
 * travels with every snapshot: a device loading the other's copy would
 * otherwise inherit the other device's idea of what it had loaded.
 */
export type SnapshotSyncState = {
  enabled: boolean;
  /** The same password on every device. Null until sync is turned on. */
  password: string | null;
  /** savedAt of the latest snapshot this device has loaded or saved. */
  loadedSavedAt: string | null;
  /** When this device last saved a snapshot of its own. */
  lastSavedAt: string | null;
  /** When this device last loaded the other device's snapshot. */
  lastLoadedAt: string | null;
  /** When this device last looked at the record, whatever it found. */
  lastCheckedAt: string | null;
  /** First write since the last save or load; null while nothing changed. */
  dirtySince: string | null;
  /** The last save or load that did not go through, in one sentence. */
  lastProblem: string | null;
  /** Content hash of the last snapshot saved or loaded, to skip a save of the same thing. */
  lastHash: string | null;
  /** A notice to show once after the restart that follows an automatic load. */
  pendingNotice: string | null;
};

/**
 * Whether a merge says on screen what it brought in and sent out.
 *
 * Off since 1.0.49.9, by direct instruction: "The changes in app from
 * either side don't need to be displayed across the screen for each one
 * ... I think we have proven the changes work and are reliable. Now we
 * need to turn off the notifications until we see a reason to make them
 * available, how and where."
 *
 * Nothing about the merging itself changed. Every merge still happens,
 * still writes its line to sync_change_log, and Sync Activity under
 * Profile is where it is read. The wording is still built and still
 * tested (lib/snapshotChanges.ts, scripts/test_snapshot_changes.js),
 * since the first-time question, the one place somebody has to choose
 * between two copies of their database, has nothing else to go on.
 *
 * It was a per-device switch in Profile, and that switch is the part
 * that is gone: where and how to offer this again is an open question
 * rather than a setting sitting there unasked for. Turning it back on is
 * this one line.
 */
export const ANNOUNCE_MERGES = false;

export const EMPTY_SYNC_STATE: SnapshotSyncState = {
  enabled: false,
  password: null,
  loadedSavedAt: null,
  lastSavedAt: null,
  lastLoadedAt: null,
  lastCheckedAt: null,
  dirtySince: null,
  lastProblem: null,
  lastHash: null,
  pendingNotice: null,
};

export const SYNC_RECORD_FILE_NAME = 'inside-story-sync.json';
const SNAPSHOT_FILE_PREFIX = 'inside-story-snapshot-';

/** How long after the last write the save waits, so a burst of edits is one upload. */
export const SAVE_DEBOUNCE_MS = 8000;

/**
 * How often an app left open in front looks at the folder, since the
 * foreground event fires only when the app was put away first. A phone
 * left on the desk while the computer saves, or the desktop app sitting
 * open while the phone saves, would otherwise show the old data until it
 * was put away and brought back.
 *
 * Half a minute (1.0.42.30, "I waited several minutes. Nothing updated on
 * the computer app. This absolutely must work automatically"). It was two
 * minutes, which on top of the eight seconds the save waits and the time
 * the OneDrive client takes to carry the file made the whole trip feel
 * like nothing was happening. A listing of one folder is a small request,
 * and it only runs while the app is open in front.
 */
export const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * A periodic check is skipped this soon after a write: a load restarts
 * the app, and a write this recent means the person is in the middle of
 * something. The foreground check has no such guard, since coming back is
 * the moment a restart costs least.
 *
 * Long enough to outlast the save debounce, and no longer: at a minute it
 * was possible for somebody working steadily to stop the check running at
 * all, which is the opposite of what it is for.
 */
export const CHECK_QUIET_MS = 15 * 1000;

// WHAT NEVER TRAVELS INSIDE A SNAPSHOT.
//
// A snapshot is the whole database, and app_meta is in it. Most of that
// table is the person's settings and belongs on both devices. A few rows
// are this device's bookkeeping about things that exist only here, and
// carrying them across does damage:
//
//   onedrive_folder      A phone stores the shared folder's Graph address,
//                        a computer stores its path on the disk. Loading
//                        the computer's copy on the phone left the phone
//                        pointing at a Windows path, so the phone asked to
//                        set up a shared folder it had already set up, and
//                        then could not save anything at all. That is the
//                        bug this list exists for (1.0.42.30).
//   sync_folder_uri      An Android folder permission. Meaningless anywhere
//                        else.
//   reference_db_version Whether the bundled food database has been
//                        imported into this device's copy. Clearing it
//                        starts a re-import of 160 MB.
//   health_connect_*     A phone-only connection and how far it has read.
//   mailbox_folder_name  The same kind of local addressing as the folder.
//   last_seen_app_version What this device has already shown the person
//                        about a new version.
//   sync_change_baseline What this device last published or loaded,
//                        table by table, so the next save can say what
//                        changed since (lib/snapshotChanges.ts).
//   visual_fold_state    Which bands and Home sections are open on this
//                        screen. Folding a band shut on the phone is no
//                        reason to fold it shut on the computer, and
//                        while it travelled, every tap on either device
//                        had the other one merge and reload its window.
//
// Kept out of the snapshot as it is built, and put back after a load,
// both: the first stops this device's bookkeeping being published to the
// other, the second stops a copy saved before this fix from wiping what
// is here.
export const APP_META_TABLE = 'app_meta';

/** The app_meta row this device keeps its last stamp of the tables in. */
export const CHANGE_BASELINE_META_KEY = 'sync_change_baseline';

export const DEVICE_LOCAL_META_KEYS: readonly string[] = [
  'onedrive_folder',
  'sync_folder_uri',
  'reference_db_version',
  'health_connect_enabled',
  'health_connect_last_sync',
  'mailbox_folder_name',
  'last_seen_app_version',
  'visual_fold_state',
  CHANGE_BASELINE_META_KEY,
];

export function isDeviceLocalMetaKey(key: unknown): boolean {
  return typeof key === 'string' && DEVICE_LOCAL_META_KEYS.includes(key);
}

/**
 * Whole tables that stay on the device that wrote them.
 *
 * sync_change_log is what THIS device merged in and when, so sending it
 * over would have the other device write down every one of those merges
 * a second time as though they had happened there. Each device keeps its
 * own account of the same conversation, which is also what makes the log
 * readable: "your computer added" is said from the side reading it.
 */
export const DEVICE_LOCAL_TABLES: readonly string[] = ['sync_change_log'];

/**
 * The snapshot's tables with this device's bookkeeping taken out.
 *
 * A copy rather than an edit in place, since the envelope it came from is
 * also what a manual backup writes, and a backup restored onto a
 * replacement phone does want every row.
 */
export function withoutDeviceLocalRows(
  tables: Record<string, Record<string, unknown>[]>,
): Record<string, Record<string, unknown>[]> {
  const kept: Record<string, Record<string, unknown>[]> = {};
  for (const [table, rows] of Object.entries(tables)) {
    if (DEVICE_LOCAL_TABLES.includes(table)) continue;
    kept[table] =
      table === APP_META_TABLE && Array.isArray(rows)
        ? rows.filter((row) => !isDeviceLocalMetaKey(row.key))
        : rows;
  }
  return kept;
}

export function snapshotFileName(device: SyncDevice): string {
  return SNAPSHOT_FILE_PREFIX + device.kind + '-' + device.fingerprint + '.json';
}

export function isSnapshotFileName(name: string): boolean {
  return name.startsWith(SNAPSHOT_FILE_PREFIX) && name.endsWith('.json');
}

export function sameDevice(a: SyncDevice, b: SyncDevice): boolean {
  return a.kind === b.kind && a.fingerprint === b.fingerprint;
}

export function buildSnapshotRecord(device: SyncDevice, savedAt: string): SnapshotRecord {
  return {
    version: 1,
    latest: { fileName: snapshotFileName(device), savedAt, device },
  };
}

/** Reads the record back, answering null for anything that is not one. */
export function parseSnapshotRecord(text: string): SnapshotRecord | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as Partial<SnapshotRecord>;
  if (record.version !== 1 || !record.latest || typeof record.latest !== 'object') return null;
  const latest = record.latest as Partial<SnapshotRecord['latest']>;
  const device = latest.device as Partial<SyncDevice> | undefined;
  if (typeof latest.fileName !== 'string' || typeof latest.savedAt !== 'string') return null;
  if (!device || (device.kind !== 'phone' && device.kind !== 'computer')) return null;
  if (typeof device.fingerprint !== 'string' || device.fingerprint.length === 0) return null;
  return {
    version: 1,
    latest: {
      fileName: latest.fileName,
      savedAt: latest.savedAt,
      device: { kind: device.kind, fingerprint: device.fingerprint },
    },
  };
}

/** The other device, as a person would say it: "your phone", "your computer". */
export function describeDevice(device: SyncDevice): string {
  return device.kind === 'phone' ? 'your phone' : 'your computer';
}

export function describeMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export type ArrivalPlan =
  | { action: 'nothing'; reason: 'off' | 'noRecord' | 'mine' | 'current' }
  | { action: 'merge'; record: SnapshotRecord }
  | { action: 'conflict'; record: SnapshotRecord; reason: 'firstTime' };

/**
 * What to do with the record found in the folder.
 *
 * A record from this device, or one this device has already loaded, is
 * nothing to act on. Anything else is brought together with what is here,
 * row by row (lib/snapshotMerge.ts), whether or not this device has
 * unsaved changes of its own. Until 1.0.49.3 unsaved changes here made it
 * a question with two answers that both threw work away, which is the
 * thing that was wrong with it: "All changes that either side perform
 * should be completed in the order that they were done between the two
 * devices, no matter how many changes there were."
 *
 * The first check after sync is turned on is still a question. Two
 * devices that have never been in step have no shared history to work
 * out changes against, so a merge there would be a union of two whole
 * databases: right for a phone and a computer holding the same life,
 * wrong for a device that was set up separately. The person says which.
 */
export function planOnArrival(
  record: SnapshotRecord | null,
  state: SnapshotSyncState,
  me: SyncDevice,
): ArrivalPlan {
  if (!state.enabled) return { action: 'nothing', reason: 'off' };
  if (!record) return { action: 'nothing', reason: 'noRecord' };
  if (sameDevice(record.latest.device, me)) return { action: 'nothing', reason: 'mine' };
  if (record.latest.savedAt === state.loadedSavedAt) return { action: 'nothing', reason: 'current' };
  if (state.loadedSavedAt === null) return { action: 'conflict', record, reason: 'firstTime' };
  return { action: 'merge', record };
}

export type SavePlan =
  | { action: 'skip'; reason: 'off' | 'clean' }
  | { action: 'merge'; record: SnapshotRecord }
  | { action: 'save' };

/**
 * Whether a save may go ahead, given what the folder holds right now.
 *
 * The record is read again immediately before every save, because the
 * other device may have saved in the seconds since this device last
 * looked. A copy from the other device that this one has not taken in
 * stops the save and asks for a merge first, so the upload can never be
 * this device's rows standing where both devices' rows belong. `force`
 * skips that, and is only ever the answer to the first-time question.
 */
export function planBeforeSave(
  record: SnapshotRecord | null,
  state: SnapshotSyncState,
  me: SyncDevice,
  options: { force?: boolean } = {},
): SavePlan {
  if (!state.enabled) return { action: 'skip', reason: 'off' };
  if (
    record &&
    !options.force &&
    !sameDevice(record.latest.device, me) &&
    record.latest.savedAt !== state.loadedSavedAt
  ) {
    // Before the clean check, deliberately: a device with nothing of its
    // own to send still has the other device's copy to take in, which is
    // what Sync Now on a device that has changed nothing is asking for.
    return { action: 'merge', record };
  }
  if (!options.force && state.dirtySince === null) return { action: 'skip', reason: 'clean' };
  return { action: 'save' };
}

/**
 * A fast, non-cryptographic hash of the snapshot's contents (cyrb53), so a
 * save that would upload exactly what is already in the folder is skipped.
 * Not a security measure: the snapshot itself is encrypted separately.
 */
export function fingerprintText(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/**
 * What changed on each side, from lib/snapshotChanges.ts. `there` is what
 * the copy in the folder brings, read out of the copy itself; `here` is
 * what this device has written and not saved yet. Either may be unknown,
 * in which case its sentence is left out rather than guessed at.
 */
export type SyncChangeNotes = { here?: readonly string[]; there?: readonly string[] };

/** "a", "a and b", "a, b and c". */
export function listPhrases(parts: readonly string[]): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

function changeSentences(notes: SyncChangeNotes): string {
  const parts: string[] = [];
  if (notes.there && notes.there.length > 0) parts.push('What that copy brings: ' + listPhrases(notes.there) + '.');
  if (notes.here && notes.here.length > 0) parts.push('Not saved here yet: ' + listPhrases(notes.here) + '.');
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * The sentence the first-time question opens with. The only question
 * left: every later arrival is merged (see planOnArrival).
 */
export function conflictMessage(
  plan: Extract<ArrivalPlan, { action: 'conflict' }>,
  me: SyncDevice,
  notes: SyncChangeNotes = {},
): string {
  const other = describeDevice(plan.record.latest.device);
  const here = me.kind === 'phone' ? 'this phone' : 'this computer';
  const when = describeMoment(plan.record.latest.savedAt);
  return (
    'A copy saved from ' + other + ' on ' + when + ' is in your shared folder.' +
    changeSentences(notes) +
    ' Load it here, replacing what is on ' + here + ', or keep what is here and save it over that copy.' +
    ' From then on the two are kept in step on their own and nothing has to be chosen again.'
  );
}

/**
 * What the person is told after two devices have been brought together,
 * naming each side. "Both" is how many records had been changed in both
 * places at once, where the later change stands and the other is in the
 * log.
 */
export function mergedNotice(
  record: SnapshotRecord,
  notes: SyncChangeNotes = {},
  both = 0,
): string {
  const parts: string[] = [
    'Brought together with the copy ' + describeDevice(record.latest.device) + ' saved on ' +
      describeMoment(record.latest.savedAt) + '.',
  ];
  if (notes.there && notes.there.length > 0) parts.push('What came over: ' + listPhrases(notes.there) + '.');
  if (notes.here && notes.here.length > 0) parts.push('What was already here: ' + listPhrases(notes.here) + '.');
  if (both > 0) {
    parts.push(
      both === 1
        ? 'One record had been changed in both places, and the later change stands.'
        : both + ' records had been changed in both places, and the later change stands in each.',
    );
  }
  return parts.join(' ');
}

/** What the person is told once, after the restart that follows an automatic load. */
export function loadedNotice(record: SnapshotRecord, changes: readonly string[] = []): string {
  const opening =
    'Loaded the copy ' + describeDevice(record.latest.device) + ' saved on ' +
    describeMoment(record.latest.savedAt) + '.';
  return changes.length > 0 ? opening + ' What came over: ' + listPhrases(changes) + '.' : opening;
}

/** The status line under the switch in Profile. */
export function describeSyncStatus(state: SnapshotSyncState, other: SyncDeviceKind): string {
  if (!state.enabled) {
    return (
      'Off. Turn it on here and on your ' + other +
      ', with the same password, and each keeps an encrypted copy of everything in your shared folder and loads the other\'s when it is newer.'
    );
  }
  const parts: string[] = [];
  parts.push(state.lastSavedAt ? 'Last saved from here ' + describeMoment(state.lastSavedAt) + '.' : 'Nothing saved from here yet.');
  if (state.lastLoadedAt) parts.push('Last loaded from your ' + other + ' ' + describeMoment(state.lastLoadedAt) + '.');
  if (state.dirtySince) parts.push('Changes since then will be saved shortly.');
  if (state.lastProblem) parts.push(state.lastProblem);
  return parts.join(' ');
}
