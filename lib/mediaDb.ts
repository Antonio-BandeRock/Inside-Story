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
  mediaFileName,
  newMediaId,
  sortMedia,
  type MediaItem,
  type MediaOwnerKind,
} from './media';
import { shrinkPhotoFile } from './mealPhotos';

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

async function mediaDirectory() {
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
    if (isDesktopApp()) return `data:image/jpeg;base64,${await file.base64()}`;
    return file.uri;
  } catch {
    return null;
  }
}

export type AddPhotoResult =
  | { status: 'added'; item: MediaItem }
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
    return await keepPhoto(asset.uri, asset.width ?? 0, asset.height ?? 0, owner, options);
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/** The same keeping, for a photo already taken in the app's camera view. */
export async function keepPhoto(
  sourceUri: string,
  sourceWidth: number,
  sourceHeight: number,
  owner: { kind: MediaOwnerKind; id: string },
  options: { takenOn?: string; caption?: string | null } = {},
): Promise<AddPhotoResult> {
  try {
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
}
