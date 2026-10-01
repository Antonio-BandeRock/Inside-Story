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
// and copied into the Photos folder under the shared folder, each photo
// encrypted with the sync password (lib/mediaSyncDevice.ts). The plaintext
// record, inside-story-sync.json, never names a photo, and the file names
// in the folder carry nothing but a random id.
//
// The shared folder is the home, the device a cache (2026-09-30, by direct
// instruction: photos, recordings and later videos live in the shared
// folder, each kind in a folder of its own, so neither device fills up).
// Every thumbnail stays on the device for good, since a row of photos has
// to draw without waiting. The report size is kept while there is room
// under the cache limit set in Profile (CACHE_LIMIT_CHOICES_MB), the
// least lately opened going first, and only once its copy is confirmed in
// the folder and its thumbnail is here (planCacheClearing). Opening a photo
// that was cleared fetches it again. With sync off nothing is cleared,
// since the folder is then not holding anything.
//
// Two sizes of every photo (2026-09-26, 1.0.53.7). Direct request: "Photos
// taken into the app need to have two sizes, thumbnails, and reporting
// size." The report size is the file above; the thumbnail sits beside it as
// <id>.thumb.jpg (MEDIA_THUMB_DIMENSION) and is what every row of photos
// shows, so a screen of forty photos reads forty small files. Both are made
// on save, and a photo kept before thumbnails existed gets one the first
// time it is shown. The original a camera took goes to the phone's gallery
// with its full detail; the app keeps only these two.
//
// Across people: a photo crosses only when what it is a photo of crosses,
// and only as a thumbnail unless the other person opens it
// (lib/peerPhotos.ts). The media table itself is never in the allowlist in
// lib/peerRelationships.ts.
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
  | 'seed_packet'
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

/** The small size every row of photos shows. 320 on the longest edge is
 *  sharp at the 84 dp a strip draws on the densest phone screens. */
export const MEDIA_THUMB_DIMENSION = 320;
export const MEDIA_THUMB_MAX_FILE_SIZE_BYTES = 50 * 1024;

/** The folder under the app's document folder that holds the files. */
export const MEDIA_FOLDER = 'media';

/** The folders under the shared folder, one per kind of file, beside
 *  Mailbox and Backups (lib/oneDriveFolders.ts). Videos is held for when
 *  video is kept and is made only then. */
export const PHOTOS_FOLDER_NAME = 'Photos';
export const RECORDINGS_FOLDER_NAME = 'Recordings';
export const VIDEOS_FOLDER_NAME = 'Videos';

/** Where the encrypted copies were kept before 1.0.57.23: a folder inside
 *  the Backups folder. A pass moves anything still there into Photos. */
export const LEGACY_PHOTO_FOLDER = 'Inside Story Photos';

const PHOTO_COPY_SUFFIX = '.photo.json';

export function newMediaId(now: number, random: string): string {
  return `media_${now}_${random.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
}

export function mediaFileName(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
}

const THUMB_SUFFIX = '.thumb.jpg';

/** The thumbnail kept beside a photo's file. */
export function thumbFileName(fileName: string): string {
  const base = fileName.endsWith('.jpg') ? fileName.slice(0, -4) : fileName.replace(/./g, '_');
  return `${base}${THUMB_SUFFIX}`;
}

export function isThumbFileName(name: string): boolean {
  return name.endsWith(THUMB_SUFFIX);
}

/** What kind of image a kept file is, from its name. A series GIF is the
 *  one file here that is not a JPEG. */
export function mediaMimeType(fileName: string): 'image/gif' | 'image/jpeg' {
  return fileName.endsWith('.gif') ? 'image/gif' : 'image/jpeg';
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
  /** Ids with a row here, neither the photo nor its thumbnail here, and a
   *  copy in the folder. A photo whose thumbnail is here and whose report
   *  size was cleared is not fetched by a pass; opening it fetches it. */
  download: string[];
  /** Ids whose copy is confirmed in the folder, the first of the two
   *  things a report size needs before it may be cleared here. */
  inFolder: string[];
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
  /** Ids whose thumbnail is here. */
  localThumbIds?: readonly string[];
  folderNames: readonly string[];
  mayClearFolder: boolean;
}): PhotoSyncPlan {
  const rows = new Set(input.rowIds);
  const local = new Set(input.localFileIds);
  const thumbs = new Set(input.localThumbIds ?? []);
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
  const confirmed: string[] = [];
  for (const id of rows) {
    if (inFolder.has(id)) confirmed.push(id);
    if (local.has(id)) {
      if (!inFolder.has(id)) upload.push(id);
    } else if (thumbs.has(id)) {
      // Cleared from the cache, or arrived as a thumbnail: nothing owed.
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
    inFolder: confirmed.sort(),
    clearFromFolder: input.mayClearFolder ? folderOnly.sort() : [],
  };
}

/** Files in the media folder here that no row refers to, which happens
 *  when the other device removed a photo and the merge took the row away. */
export function orphanedLocalFiles(rowFileNames: readonly string[], localFileNames: readonly string[]): string[] {
  const kept = new Set<string>();
  for (const name of rowFileNames) {
    kept.add(name);
    kept.add(thumbFileName(name));
  }
  return localFileNames.filter((name) => (name.endsWith('.jpg') || name.endsWith('.gif')) && !kept.has(name)).sort();
}

// The cache of files opened lately ---------------------------------------

/** What the device keeps of each kind, for the line in Profile. */
export type MediaCacheGroup = 'photos' | 'recordings';

export type CacheEntry = {
  fileName: string;
  group: MediaCacheGroup;
  bytes: number;
  /** When it was last opened or kept here; null when nobody recorded it,
   *  which reads as the longest ago. */
  usedAt: string | null;
  /** True only when its copy is confirmed in the shared folder, plus, for
   *  a photo, its thumbnail is here. Nothing else is ever cleared. */
  clearable: boolean;
};

/** The room kept for files opened lately, in MB. One limit for the
 *  device, chosen in Profile, since it is the device's room being
 *  shared out. */
export const CACHE_LIMIT_CHOICES_MB = [100, 250, 500, 1000] as const;
export const DEFAULT_CACHE_LIMIT_MB = 250;
export const MEDIA_CACHE_LIMIT_META_KEY = 'media_cache_limit_mb';

export function parseCacheLimitMb(value: string | null | undefined): number {
  const n = Number(value);
  return (CACHE_LIMIT_CHOICES_MB as readonly number[]).includes(n) ? n : DEFAULT_CACHE_LIMIT_MB;
}

export function cacheLimitLabel(mb: number): string {
  return mb >= 1000 ? `${mb / 1000} GB` : `${mb} MB`;
}

export function cacheLimitBytes(mb: number): number {
  return mb * 1024 * 1024;
}

/**
 * Which files to clear so the cache fits its limit: the least lately
 * opened first, only those marked clearable, and no more than needed. A
 * limit of 0 is Clear Now, which clears every clearable file. A file that
 * is not clearable still counts toward the room used, so a device with
 * many photos waiting to be copied can sit over its limit until they are.
 */
export function planCacheClearing(entries: readonly CacheEntry[], limitBytes: number): string[] {
  let total = entries.reduce((sum, entry) => sum + Math.max(0, entry.bytes), 0);
  if (limitBytes > 0 && total <= limitBytes) return [];
  const order = entries
    .filter((entry) => entry.clearable)
    .sort((a, b) => {
      const at = a.usedAt ?? '';
      const bt = b.usedAt ?? '';
      if (at !== bt) return at < bt ? -1 : 1;
      return a.fileName.localeCompare(b.fileName);
    });
  const cleared: string[] = [];
  for (const entry of order) {
    if (limitBytes > 0 && total <= limitBytes) break;
    cleared.push(entry.fileName);
    total -= Math.max(0, entry.bytes);
  }
  return cleared;
}

export type CacheUse = {
  thumbs: { count: number; bytes: number };
  photos: { count: number; bytes: number };
  recordings: { count: number; bytes: number };
  limitMb: number;
};

/** The space line in Profile > Backup & Restore. */
export function cacheUseSentence(use: CacheUse, syncOn: boolean): string {
  const parts: string[] = [];
  parts.push(
    use.thumbs.count === 0
      ? 'No photo thumbnails here yet.'
      : `Thumbnails of ${plural(use.thumbs.count, 'photo', 'photos')} take ${bytesLabel(use.thumbs.bytes)} and always stay on this device.`,
  );
  const opened: string[] = [];
  if (use.photos.count > 0) opened.push(`${plural(use.photos.count, 'photo', 'photos')} at full size take ${bytesLabel(use.photos.bytes)}`);
  if (use.recordings.count > 0) opened.push(`${plural(use.recordings.count, 'recording', 'recordings')} take ${bytesLabel(use.recordings.bytes)}`);
  if (opened.length > 0) parts.push(`${capitalize(opened.join(', and '))}.`);
  if (!syncOn) {
    parts.push('While automatic sync is off, every photo stays on this device at full size.');
  } else {
    parts.push(
      `Up to ${cacheLimitLabel(use.limitMb)} is kept for files opened lately. Anything older stays in the shared folder and is fetched again when it is opened.`,
    );
  }
  return parts.join(' ');
}

/** Said after Clear Now. */
export function cacheClearedSentence(files: number, bytes: number): string {
  if (files === 0) {
    return 'Nothing to clear. Every file here is either still to be copied into the shared folder or not confirmed there yet.';
  }
  return `Cleared ${plural(files, 'file', 'files')}, ${bytesLabel(bytes)}. Each one is still in the shared folder and comes back when it is opened.`;
}

/** What a photo says when its full size is not here and the folder
 *  cannot be reached right now. */
export const PHOTO_NOT_REACHABLE = 'Only the thumbnail is on this device, and the shared folder could not be reached just now.';

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** A size in bytes the way Profile says it. */
export function bytesLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return mb < 100 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

/** The storage line in Profile: how many photos, and the room both sizes
 *  take, plus the ones other people sent (lib/peerPhotosDb.ts). */
export function photoStorageSentence(
  photos: number,
  bytes: number,
  fromOthers: { photos: number; bytes: number } = { photos: 0, bytes: 0 },
): string {
  const own =
    photos === 0
      ? 'No photos kept on this device yet.'
      : `${plural(photos, 'photo', 'photos')} kept on this device, taking ${bytesLabel(bytes)} with their thumbnails. A photo chosen from your gallery is still there at full size.`;
  if (fromOthers.photos === 0) return own;
  return `${own} ${plural(fromOthers.photos, 'photo', 'photos')} from people you share meals with take ${bytesLabel(fromOthers.bytes)} more.`;
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
  parts.push(status.toCopy === 0 ? 'Each one has an encrypted copy in the Photos folder.' : `${plural(status.toCopy, 'photo is', 'photos are')} still to be copied.`);
  if (status.waiting > 0) {
    parts.push(`${plural(status.waiting, 'photo is', 'photos are')} on the way from your ${otherDevice}.`);
  }
  return parts.join(' ');
}

/** What a photo that has not arrived yet says in its place. */
export const PHOTO_ON_THE_WAY = 'On the way from your other device';

export const PHOTO_STRIP_EMPTY_LINE = 'No photos yet.';

/** Said once, after a camera shot, when the phone cannot yet keep the
 *  original in its gallery. The next app build adds that. */
export const PHOTO_ORIGINAL_NOT_KEPT =
  'This version of the app keeps the photo at two sizes but cannot yet put the full-size original in your gallery. The next app build adds that.';

export function photoRemovalSentence(): string {
  return 'This photo is removed here, and from your other device the next time the two come into step.';
}
