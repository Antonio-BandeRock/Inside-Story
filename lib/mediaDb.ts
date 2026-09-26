// One photo layer (X1): reading and writing the media table (lib/db.ts) and
// the files under Paths.document/media. Every rule and sentence is in
// lib/media.ts; copying to the shared folder is lib/mediaSyncDevice.ts.
//
// expo-file-system, expo-image-picker and expo-image-manipulator are only
// ever reached through a dynamic import inside the function that needs
// them, the discipline lib/customBackgroundImage.ts set after a top-level
// import once closed the app on launch.

import { isDesktopApp } from './desktop/bridge';
import { getDatabase } from './db';
import {
  isLocalDay,
  localDay,
  MEDIA_FOLDER,
  MEDIA_MAX_DIMENSION,
  MEDIA_MAX_FILE_SIZE_BYTES,
  MEDIA_MIN_DIMENSION,
  MEDIA_THUMB_DIMENSION,
  MEDIA_THUMB_MAX_FILE_SIZE_BYTES,
  mediaFileName,
  newMediaId,
  mediaMimeType,
  sortMedia,
  thumbFileName,
  type MediaItem,
  type MediaOwnerKind,
} from './media';
import { shrinkPhotoFile } from './mealPhotos';
import { saveOriginalToGallery } from './photoNative';

const COLUMNS =
  'id, owner_kind AS ownerKind, owner_id AS ownerId, file_name AS fileName, taken_on AS takenOn, caption, width, height, created_at AS createdAt';

export async function listMediaFor(ownerKind: MediaOwnerKind, ownerId: string): Promise<MediaItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MediaItem>(
    `SELECT ${COLUMNS} FROM media WHERE owner_kind = ? AND owner_id = ?`,
    ownerKind,
    ownerId,
  );
  return sortMedia(rows);
}

/** Every photo of one kind, for a screen that shows them across owners. */
export async function listMediaOfKind(ownerKind: MediaOwnerKind): Promise<MediaItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MediaItem>(`SELECT ${COLUMNS} FROM media WHERE owner_kind = ?`, ownerKind);
  return sortMedia(rows);
}

export async function listAllMedia(): Promise<MediaItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<MediaItem>(`SELECT ${COLUMNS} FROM media`);
}

export async function mediaDirectory() {
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, MEDIA_FOLDER);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** The file for a photo, whether or not it has arrived yet. */
export async function mediaFile(fileName: string) {
  const { File } = await import('expo-file-system');
  return new File(await mediaDirectory(), fileName);
}

/** The names of every file in the media folder here. */
export async function listLocalMediaFileNames(): Promise<string[]> {
  const dir = await mediaDirectory();
  const { File } = await import('expo-file-system');
  return dir
    .list()
    .filter((entry) => entry instanceof File)
    .map((entry) => entry.name);
}

/**
 * Something an Image can show, or null when the file has not arrived from
 * the other device yet. On the phone that is the file itself. The desktop
 * app cannot show a file address (lib/desktop/phoneOnly.ts), so there it
 * is the bytes as a data address, read from the copy sync brought over.
 */
export async function mediaDisplayUri(item: Pick<MediaItem, 'fileName'>): Promise<string | null> {
  try {
    const file = await mediaFile(item.fileName);
    if (!file.exists) return null;
    if (isDesktopApp()) return `data:${mediaMimeType(item.fileName)};base64,${await file.base64()}`;
    return file.uri;
  } catch {
    return null;
  }
}

/**
 * The thumbnail of a photo, for a row of photos. A photo kept before
 * thumbnails existed, or one whose thumbnail did not come over with it, gets
 * one made here the first time it is shown. Falls back to the photo itself
 * when a thumbnail cannot be made, and on the desktop app, which reads every
 * photo from the copy sync brought over.
 */
export async function mediaThumbUri(item: Pick<MediaItem, 'fileName'>): Promise<string | null> {
  if (isDesktopApp()) return mediaDisplayUri(item);
  try {
    const main = await mediaFile(item.fileName);
    if (!main.exists) return null;
    const thumb = await mediaFile(thumbFileName(item.fileName));
    if (thumb.exists) return thumb.uri;
    if (await writeThumbnail(main.uri, item.fileName)) return thumb.uri;
    return main.uri;
  } catch {
    return null;
  }
}

/** Makes the thumbnail beside a kept photo. False when it could not be
 *  made, which is never fatal: the strip shows the photo itself instead. */
async function writeThumbnail(sourceUri: string, fileName: string): Promise<boolean> {
  try {
    const shrunk = await shrinkPhotoFile(sourceUri, MEDIA_THUMB_DIMENSION, MEDIA_THUMB_MAX_FILE_SIZE_BYTES);
    if (!shrunk) return false;
    const { File } = await import('expo-file-system');
    const temporary = new File(shrunk.uri);
    const destination = await mediaFile(thumbFileName(fileName));
    if (destination.exists) destination.delete();
    temporary.copy(destination);
    try {
      temporary.delete();
    } catch {
      // Cleared by the system in time.
    }
    return true;
  } catch {
    return false;
  }
}

/** How many photos this device keeps and the room both sizes take, for
 *  the line in Profile. */
export async function mediaStorageUsed(): Promise<{ photos: number; bytes: number }> {
  try {
    const rows = await listAllMedia();
    const dir = await mediaDirectory();
    const { File } = await import('expo-file-system');
    let bytes = 0;
    for (const entry of dir.list()) {
      if (entry instanceof File) bytes += entry.size ?? 0;
    }
    return { photos: rows.length, bytes };
  } catch {
    return { photos: 0, bytes: 0 };
  }
}

export type AddPhotoResult =
  | { status: 'added'; item: MediaItem; originalInGallery?: boolean }
  | { status: 'canceled' }
  | { status: 'permission-denied' }
  | { status: 'too-small' }
  | { status: 'too-large' }
  | { status: 'error'; message: string };

/**
 * Takes a photo or picks one from the library, shrinks it, keeps it under
 * the media folder and records it against its owner. `takenOn` defaults to
 * today, the local day.
 */
export async function addPhoto(
  source: 'camera' | 'library',
  owner: { kind: MediaOwnerKind; id: string },
  options: { takenOn?: string; caption?: string | null } = {},
): Promise<AddPhotoResult> {
  try {
    const ImagePicker = await import('expo-image-picker');
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { status: 'permission-denied' };
    // Written out at each call rather than hoisted, so mediaTypes keeps its
    // literal type (see pickAndSaveMealPhoto in lib/mealPhotos.ts).
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false, exif: false });
    if (picked.canceled || picked.assets.length === 0) return { status: 'canceled' };
    const asset = picked.assets[0];
    // A camera shot's original goes to the gallery; a photo picked from the
    // gallery is already there and is never copied back into it.
    return await keepPhoto(asset.uri, asset.width ?? 0, asset.height ?? 0, owner, {
      ...options,
      originalToGallery: source === 'camera',
    });
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The same keeping, for a photo already taken in the app's camera view or
 * handed over from elsewhere in the app. Two sizes are kept: the report size
 * and its thumbnail. `originalToGallery` puts the untouched source file in
 * the phone's gallery first, for a camera shot; the result says whether that
 * happened, since the installed build may not be able to yet
 * (lib/photoNative.ts). `deleteSource` removes the source file once kept,
 * for a file the app itself wrote to its cache.
 */
export async function keepPhoto(
  sourceUri: string,
  sourceWidth: number,
  sourceHeight: number,
  owner: { kind: MediaOwnerKind; id: string },
  options: { takenOn?: string; caption?: string | null; originalToGallery?: boolean; deleteSource?: boolean } = {},
): Promise<AddPhotoResult> {
  try {
    const originalInGallery = options.originalToGallery ? await saveOriginalToGallery(sourceUri) : undefined;
    const shorter = Math.min(sourceWidth, sourceHeight);
    if (shorter > 0 && shorter < MEDIA_MIN_DIMENSION) return { status: 'too-small' };
    const shrunk = await shrinkPhotoFile(sourceUri, MEDIA_MAX_DIMENSION, MEDIA_MAX_FILE_SIZE_BYTES);
    if (!shrunk) return { status: 'too-large' };

    const { File } = await import('expo-file-system');
    const id = newMediaId(Date.now(), Math.random().toString(36).slice(2));
    const fileName = mediaFileName(id);
    const destination = await mediaFile(fileName);
    const temporary = new File(shrunk.uri);
    temporary.copy(destination);
    try {
      temporary.delete();
    } catch {
      // The cache is cleared by the system in time; the photo is kept.
    }

    await writeThumbnail(destination.uri, fileName);
    if (options.deleteSource) {
      try {
        new File(sourceUri).delete();
      } catch {
        // Cleared by the system in time.
      }
    }

    const now = new Date().toISOString();
    const takenOn = options.takenOn && isLocalDay(options.takenOn) ? options.takenOn : localDay(new Date());
    const caption = options.caption && options.caption.trim() ? options.caption.trim() : null;
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO media (id, owner_kind, owner_id, file_name, taken_on, caption, width, height, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      owner.kind,
      owner.id,
      fileName,
      takenOn,
      caption,
      shrunk.width,
      shrunk.height,
      now,
      now,
    );
    return {
      status: 'added',
      originalInGallery,
      item: {
        id,
        ownerKind: owner.kind,
        ownerId: owner.id,
        fileName,
        takenOn,
        caption,
        width: shrunk.width,
        height: shrunk.height,
        createdAt: now,
      },
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Keeps a file the app made itself, such as a series GIF, as a photo of
 * its owner. It is not shrunk, since it was made at its size.
 */
export async function keepGeneratedFile(
  base64: string,
  extension: 'gif' | 'jpg',
  width: number,
  height: number,
  owner: { kind: MediaOwnerKind; id: string },
  options: { caption?: string | null } = {},
): Promise<MediaItem> {
  const { base64ToBytes } = await import('./deviceIdentity');
  const id = newMediaId(Date.now(), Math.random().toString(36).slice(2));
  const fileName = `${mediaFileName(id).slice(0, -4)}.${extension}`;
  (await mediaFile(fileName)).write(base64ToBytes(base64));
  const now = new Date().toISOString();
  const takenOn = localDay(new Date());
  const caption = options.caption && options.caption.trim() ? options.caption.trim() : null;
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO media (id, owner_kind, owner_id, file_name, taken_on, caption, width, height, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    owner.kind,
    owner.id,
    fileName,
    takenOn,
    caption,
    width,
    height,
    now,
    now,
  );
  return { id, ownerKind: owner.kind, ownerId: owner.id, fileName, takenOn, caption, width, height, createdAt: now };
}

export async function updatePhotoDetails(id: string, details: { takenOn: string; caption: string | null }): Promise<void> {
  if (!isLocalDay(details.takenOn)) return;
  const db = await getDatabase();
  const caption = details.caption && details.caption.trim() ? details.caption.trim() : null;
  await db.runAsync(
    'UPDATE media SET taken_on = ?, caption = ?, updated_at = ? WHERE id = ?',
    details.takenOn,
    caption,
    new Date().toISOString(),
    id,
  );
}

/**
 * Removes a photo: the row, and the file here. The copy in the shared
 * folder goes on the next sync pass after this device saves, and the other
 * device drops its file once the merge has taken the row away
 * (lib/mediaSyncDevice.ts).
 */
export async function removePhoto(item: Pick<MediaItem, 'id' | 'fileName'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM media WHERE id = ?', item.id);
  try {
    const file = await mediaFile(item.fileName);
    if (file.exists) file.delete();
    const thumb = await mediaFile(thumbFileName(item.fileName));
    if (thumb.exists) thumb.delete();
  } catch {
    // A file that could not be removed now is removed by the next sync
    // pass, which clears files no row refers to.
  }
}

/** Removes every photo of one owner, for when the owner itself is deleted
 *  outright. An owner that is retired keeps its photos. */
export async function removePhotosOf(ownerKind: MediaOwnerKind, ownerId: string): Promise<void> {
  for (const item of await listMediaFor(ownerKind, ownerId)) {
    await removePhoto(item);
  }
  // A Photo Series of the owner goes too, with any GIF made from it. Read
  // here by table name rather than through lib/photoSeriesDb.ts, which
  // imports this module. 'photo_series_gif' is SERIES_GIF_OWNER_KIND there.
  const db = await getDatabase();
  const series = await db.getAllAsync<{ id: string }>('SELECT id FROM photo_series WHERE owner_kind = ? AND owner_id = ?', ownerKind, ownerId);
  for (const { id } of series) {
    for (const item of await listMediaFor('photo_series_gif', id)) {
      await removePhoto(item);
    }
  }
  if (series.length > 0) await db.runAsync('DELETE FROM photo_series WHERE owner_kind = ? AND owner_id = ?', ownerKind, ownerId);
}

/** How many photos one owner has, for a row that shows the count before
 *  anything is loaded. */
export async function countMediaFor(ownerKind: MediaOwnerKind, ownerId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM media WHERE owner_kind = ? AND owner_id = ?', ownerKind, ownerId);
  return row?.n ?? 0;
}
