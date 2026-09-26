// One photo layer (X1, 2026-09-26). Every photo the app keeps from here on,
// whatever it is a photo of, is one row in the media table (lib/db.ts) and
// one file under the app folder: a pill so two white tablets can be told
// apart (A5), a symptom over time (D12), a planting, an area, a harvest or
// a pile (I13), a receipt (J4), an item or the place it is kept (J9).
// Each of those names an owner kind and an owner id, and
// components/PhotoStrip.tsx is the one place photos are added, shown and
// removed, so each of them is a line or two where it is used.
//
// Where the files go. Kept small on save (MEDIA_MAX_DIMENSION,
// MEDIA_MAX_FILE_SIZE_BYTES), under Paths.document/media on this device,
// and copied into the Backups folder beside the encrypted snapshot, each
// photo encrypted with the sync password (lib/mediaSyncDevice.ts). The
// plaintext record there, inside-story-sync.json, never names a photo, and
// the file names in the folder carry nothing but a random id. The desktop
// app shows a photo from the copy that arrived that way.
//
// Never across people: the media table is not in the allowlist in
// lib/peerRelationships.ts, so nothing here reaches a partner, a child or
// a caregiver unless a relationship names it one day.
//
// Pure, no imports at run time, so scripts/test_media.js checks every rule
// and sentence here without a phone. The reading and writing is
// lib/mediaDb.ts, the folder copies lib/mediaSyncDevice.ts.

/** What a photo is of. A plain string so a later owner needs no migration;
 *  these are the ones planned so far, kept here so their words live in one
 *  place. */
export type MediaOwnerKind =
  | 'treatment'
  | 'symptom'
  | 'planting'
  | 'garden_area'
  | 'harvest'
  | 'compost_pile'
  | 'money_entry'
  | 'item'
  | 'place'
  | (string & {});

export type MediaItem = {
  id: string;
  ownerKind: MediaOwnerKind;
  ownerId: string;
  /** The file's name under the media folder, never a full path, since the
   *  folder is somewhere else on every device. */
  fileName: string;
  /** The local day it was taken, "YYYY-MM-DD". */
  takenOn: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
};

/** Longest edge after shrinking. Enough to tell two tablets or two leaves
 *  apart when zoomed, small enough that hundreds of photos fit anywhere. */
export const MEDIA_MAX_DIMENSION = 1600;
export const MEDIA_MIN_DIMENSION = 200;
export const MEDIA_MAX_FILE_SIZE_BYTES = 600 * 1024;

/** The folder under the app's document folder that holds the files. */
export const MEDIA_FOLDER = 'media';

/** The folder inside the Backups folder that holds the encrypted copies. */
export const MEDIA_SYNC_FOLDER = 'Inside Story Photos';

const PHOTO_COPY_SUFFIX = '.photo.json';

export function newMediaId(now: number, random: string): string {
  return `media_${now}_${random.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
}

export function mediaFileName(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
}

/** The name of a photo's encrypted copy in the shared folder. */
export function photoCopyName(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}${PHOTO_COPY_SUFFIX}`;
}

/** The media id a copy in the shared folder belongs to, or null for any
 *  other file that happens to be there. */
export function idFromPhotoCopyName(name: string): string | null {
  if (!name.endsWith(PHOTO_COPY_SUFFIX)) return null;
  const id = name.slice(0, -PHOTO_COPY_SUFFIX.length);
  return /^[a-zA-Z0-9_-]+$/.test(id) ? id : null;
}

/** The local day of a moment, which is what a photo is filed under.
 *  Through a Date rather than slicing an ISO string, since a UTC stamp
 *  puts an evening photo west of Greenwich on the following day. */
export function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isLocalDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Newest day first, and within a day the order they were added. */
export function sortMedia(items: readonly MediaItem[]): MediaItem[] {
  return [...items].sort((a, b) => {
    if (a.takenOn !== b.takenOn) return a.takenOn < b.takenOn ? 1 : -1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Taken 3 September 2026", or "Taken today" and "Taken yesterday". */
export function takenOnLabel(takenOn: string, today: string): string {
  if (!isLocalDay(takenOn)) return 'Date not known';
  if (takenOn === today) return 'Taken today';
  if (isLocalDay(today)) {
    const [y, m, d] = today.split('-').map(Number);
    if (localDay(new Date(y, m - 1, d - 1)) === takenOn) return 'Taken yesterday';
  }
  const [year, month, day] = takenOn.split('-').map(Number);
  return `Taken ${day} ${MONTHS[month - 1]} ${year}`;
}

// Copying to and from the shared folder -----------------------------------

export type PhotoSyncPlan = {
  /** Ids whose file is here and whose copy is not in the folder. */
  upload: string[];
  /** Ids with a row here, no file here, and a copy in the folder. */
  download: string[];
  /** Ids with a row here and neither a file here nor a copy in the folder:
   *  the other device has not sent it yet. */
  waiting: string[];
  /** Copies in the folder that no row here refers to. Only filled when
   *  `mayClearFolder` is true; see planPhotoSync. */
  clearFromFolder: string[];
};

/**
 * What one pass of copying does.
 *
 * `mayClearFolder` is true only straight after this device saved the
 * snapshot and the record still names it as the latest: at that moment
 * the snapshot in the folder is this device's rows, which already take in
 * everything the other device saved, so a copy no row refers to belongs to
 * a photo somebody removed. At any other moment it may belong to a photo
 * the other device added and this one has not merged yet, so it is left.
 * A copy cleared too early is sent again by the device that holds the
 * file, since that device sees it missing on its next pass.
 */
export function planPhotoSync(input: {
  rowIds: readonly string[];
  localFileIds: readonly string[];
  folderNames: readonly string[];
  mayClearFolder: boolean;
}): PhotoSyncPlan {
  const rows = new Set(input.rowIds);
  const local = new Set(input.localFileIds);
  const inFolder = new Set<string>();
  const folderOnly: string[] = [];
  for (const name of input.folderNames) {
    const id = idFromPhotoCopyName(name);
    if (!id) continue;
    inFolder.add(id);
    if (!rows.has(id)) folderOnly.push(id);
  }
  const upload: string[] = [];
  const download: string[] = [];
  const waiting: string[] = [];
  for (const id of rows) {
    if (local.has(id)) {
      if (!inFolder.has(id)) upload.push(id);
    } else if (inFolder.has(id)) {
      download.push(id);
    } else {
      waiting.push(id);
    }
  }
  return {
    upload: upload.sort(),
    download: download.sort(),
    waiting: waiting.sort(),
    clearFromFolder: input.mayClearFolder ? folderOnly.sort() : [],
  };
}

/** Files in the media folder here that no row refers to, which happens
 *  when the other device removed a photo and the merge took the row away. */
export function orphanedLocalFiles(rowFileNames: readonly string[], localFileNames: readonly string[]): string[] {
  const kept = new Set(rowFileNames);
  return localFileNames.filter((name) => name.endsWith('.jpg') && !kept.has(name)).sort();
}

export type PhotoSyncStatus = {
  onDevice: number;
  waiting: number;
  toCopy: number;
  problem: string | null;
  checkedAt: string | null;
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The line under the sync switch in Profile > Backup & Restore. */
export function photoSyncSentence(status: PhotoSyncStatus | null, syncOn: boolean, otherDevice: string): string {
  if (!syncOn) return 'Photos are kept on this device only while automatic sync is off.';
  if (!status || status.checkedAt === null) return 'Photos are copied into the shared folder, encrypted, once sync next runs.';
  if (status.problem) return `Photos could not be copied this time: ${status.problem}`;
  if (status.onDevice === 0 && status.waiting === 0) return 'No photos kept yet. Any you add are copied into the shared folder, encrypted.';
  const parts = [`${plural(status.onDevice, 'photo', 'photos')} on this device.`];
  parts.push(status.toCopy === 0 ? 'Each one has an encrypted copy in the shared folder.' : `${plural(status.toCopy, 'photo is', 'photos are')} still to be copied.`);
  if (status.waiting > 0) {
    parts.push(`${plural(status.waiting, 'photo is', 'photos are')} on the way from your ${otherDevice}.`);
  }
  return parts.join(' ');
}

/** What a photo that has not arrived yet says in its place. */
export const PHOTO_ON_THE_WAY = 'On the way from your other device';

export const PHOTO_STRIP_EMPTY_LINE = 'No photos yet.';

export function photoRemovalSentence(): string {
  return 'This photo is removed here, and from your other device the next time the two come into step.';
}
