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
 */
export const CHECK_INTERVAL_MS = 2 * 60 * 1000;

/**
 * A periodic check is skipped this soon after a write: a load restarts
 * the app, and a write this recent means the person is in the middle of
 * something. The foreground check has no such guard, since coming back is
 * the moment a restart costs least.
 */
export const CHECK_QUIET_MS = 60 * 1000;

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
  | { action: 'load'; record: SnapshotRecord }
  | { action: 'conflict'; record: SnapshotRecord; reason: 'unsavedChanges' | 'firstTime' };

/**
 * What to do with the record found in the folder.
 *
 * A record from this device, or one this device has already loaded, is
 * nothing to act on. The other device's newer copy loads on its own when
 * nothing here has changed since the last save or load, which is the
 * ordinary case of picking up the phone after using the computer. It is a
 * question for the person when this device has unsaved changes, and on the
 * first check after turning sync on, since then nothing is known about how
 * the two devices' contents relate.
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
  if (state.dirtySince !== null) return { action: 'conflict', record, reason: 'unsavedChanges' };
  return { action: 'load', record };
}

export type SavePlan =
  | { action: 'skip'; reason: 'off' | 'clean' }
  | { action: 'conflict'; record: SnapshotRecord }
  | { action: 'save' };

/**
 * Whether a save may go ahead, given what the folder holds right now.
 *
 * The record is read again immediately before every save, because the
 * other device may have saved since this device last looked. A newer copy
 * from the other device that this one has not loaded stops the save: the
 * person decides which copy wins. `force` is that decision, made.
 */
export function planBeforeSave(
  record: SnapshotRecord | null,
  state: SnapshotSyncState,
  me: SyncDevice,
  options: { force?: boolean } = {},
): SavePlan {
  if (!state.enabled) return { action: 'skip', reason: 'off' };
  if (!options.force && state.dirtySince === null) return { action: 'skip', reason: 'clean' };
  if (
    record &&
    !options.force &&
    !sameDevice(record.latest.device, me) &&
    record.latest.savedAt !== state.loadedSavedAt
  ) {
    return { action: 'conflict', record };
  }
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

/** The sentence a conflict dialog opens with. */
export function conflictMessage(plan: Extract<ArrivalPlan, { action: 'conflict' }>, me: SyncDevice): string {
  const other = describeDevice(plan.record.latest.device);
  const here = me.kind === 'phone' ? 'this phone' : 'this computer';
  const when = describeMoment(plan.record.latest.savedAt);
  if (plan.reason === 'firstTime') {
    return (
      'A copy saved from ' + other + ' on ' + when + ' is in your shared folder. ' +
      'Load it here, replacing what is on ' + here + ', or keep what is here and save it over that copy.'
    );
  }
  return (
    'Changes were made on ' + here + ' that have not been saved yet, and ' + other +
    ' saved a copy on ' + when + '. Load that copy, losing the changes made here, or keep what is here and save it over that copy.'
  );
}

/** The sentence a save refuses with when the folder moved on. */
export function saveConflictMessage(record: SnapshotRecord, me: SyncDevice): string {
  const here = me.kind === 'phone' ? 'this phone' : 'this computer';
  return (
    describeDevice(record.latest.device).replace(/^y/, 'Y') + ' saved a copy on ' +
    describeMoment(record.latest.savedAt) + ' that ' + here + ' has not loaded. ' +
    'Load that copy, losing the changes made here, or keep what is here and save it over that copy.'
  );
}

/** What the person is told once, after the restart that follows an automatic load. */
export function loadedNotice(record: SnapshotRecord): string {
  return (
    'Loaded the copy ' + describeDevice(record.latest.device) + ' saved on ' +
    describeMoment(record.latest.savedAt) + '.'
  );
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
