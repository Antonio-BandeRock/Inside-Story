// Photos between two people, on the device (1.0.53.7). The rules and every
// sentence are in lib/peerPhotos.ts with no I/O; this file reads the
// photos, keeps what arrives, and remembers what went where.
//
// Two tables, both device local (DEVICE_LOCAL_TABLES in
// lib/snapshotSync.ts): peer_photo_out, one row per photo per person this
// phone has offered it to, and peer_photos, what another person sent here,
// with the files under peer-media. Only the newest photo of each dish is
// kept from each person, so a partner who photographs the same soup every
// week takes up the room of one photo here, not fifty.

import type { Connection } from './connections';
import { getDatabase } from './db';
import { isDesktopApp } from './desktop/bridge';
import { thumbFileName } from './media';
import { mediaFile, mediaThumbUri } from './mediaDb';
import {
  PEER_PHOTO_LIST_LIMIT,
  choosePeerPhotos,
  newestPerRecipe,
  photosMayTravel,
  type OutgoingState,
  type PeerPhotoFull,
  type PeerPhotoPart,
  type PeerPhotoThumb,
} from './peerPhotos';
import { currentNetworkKind } from './photoNative';

const WIFI_ONLY_KEY = 'peer_photos_wifi_only';
const PEER_MEDIA_FOLDER = 'peer-media';
const DISH_RECIPE_PREFIX = 'recipe:';

export async function getPeerPhotosWifiOnly(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', WIFI_ONLY_KEY);
  return row?.value !== '0';
}

export async function setPeerPhotosWifiOnly(on: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    WIFI_ONLY_KEY,
    on ? '1' : '0',
    new Date().toISOString(),
  );
}

async function peerDirectory() {
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, PEER_MEDIA_FOLDER);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function peerFile(name: string) {
  const { File } = await import('expo-file-system');
  return new File(await peerDirectory(), name);
}

function safePart(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '_');
}

function peerFileName(connectionId: string, photoId: string, size: 'thumb' | 'full'): string {
  return `${safePart(connectionId)}__${safePart(photoId)}${size === 'thumb' ? '.thumb' : ''}.jpg`;
}

async function writePeerFile(name: string, base64: string): Promise<boolean> {
  try {
    const { base64ToBytes } = await import('./deviceIdentity');
    const file = await peerFile(name);
    if (file.exists) file.delete();
    file.write(base64ToBytes(base64));
    return true;
  } catch {
    return false;
  }
}

async function deletePeerFile(name: string | null): Promise<void> {
  if (!name) return;
  try {
    const file = await peerFile(name);
    if (file.exists) file.delete();
  } catch {
    // A file that cannot be removed now is picked up with its connection.
  }
}

async function readBase64(file: { exists: boolean; base64: () => Promise<string> }): Promise<string | null> {
  try {
    if (!file.exists) return null;
    return await file.base64();
  } catch {
    return null;
  }
}

type DishPhotoRow = { id: string; ownerId: string; takenOn: string; caption: string | null; fileName: string };

async function dishPhotosFor(recipeIds: readonly string[]): Promise<DishPhotoRow[]> {
  if (recipeIds.length === 0) return [];
  const db = await getDatabase();
  const owners = recipeIds.map((id) => `${DISH_RECIPE_PREFIX}${id}`);
  const rows = await db.getAllAsync<DishPhotoRow>(
    `SELECT id, owner_id AS ownerId, taken_on AS takenOn, caption, file_name AS fileName
       FROM media WHERE owner_kind = 'dish' AND owner_id IN (${owners.map(() => '?').join(', ')})`,
    ...owners,
  );
  return rows;
}

type OutRow = {
  photo_id: string;
  sent_at: string | null;
  acked_at: string | null;
  requested_at: string | null;
  full_sent_at: string | null;
  full_acked_at: string | null;
};

/**
 * The photo part of a send to one person. What this phone says about THEIR
 * photos (arrived, asked for) always goes, since it is ids and nothing
 * more; photos of this phone's dishes go only on a network the person has
 * allowed, and are cut down again to the grants and the plan by
 * buildSyncPayload in lib/partnerSync.ts.
 *
 * What goes is marked sent here, at build time. A send that never lands is
 * offered again after a day (PEER_PHOTO_RESEND_AFTER_MS), which is cheaper
 * than asking every transport to report back.
 */
export async function peerPhotoPartFor(
  partner: Pick<Connection, 'id' | 'grants'>,
  planRecipeIds: readonly string[],
  options: { budget: number; allowFull: boolean },
): Promise<PeerPhotoPart> {
  const part: PeerPhotoPart = {};
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const pending = await db.getAllAsync<{ photo_id: string; ack_pending: number; full_ack_pending: number; asked: number }>(
      `SELECT photo_id, ack_pending, full_ack_pending,
              CASE WHEN requested_at IS NOT NULL AND full_file IS NULL THEN 1 ELSE 0 END AS asked
         FROM peer_photos WHERE connection_id = ?`,
      partner.id,
    );
    const acks = pending.filter((row) => row.ack_pending === 1).map((row) => row.photo_id).slice(0, PEER_PHOTO_LIST_LIMIT);
    const fullAcks = pending.filter((row) => row.full_ack_pending === 1).map((row) => row.photo_id).slice(0, PEER_PHOTO_LIST_LIMIT);
    const requests = pending.filter((row) => row.asked === 1).map((row) => row.photo_id).slice(0, PEER_PHOTO_LIST_LIMIT);
    if (acks.length > 0) part.photoAcks = acks;
    if (fullAcks.length > 0) part.photoFullAcks = fullAcks;
    if (requests.length > 0) part.photoRequests = requests;
    const clearedAcks = [...acks, ...fullAcks];
    if (clearedAcks.length > 0) {
      await db.runAsync(
        `UPDATE peer_photos SET ack_pending = 0, full_ack_pending = 0
          WHERE connection_id = ? AND photo_id IN (${clearedAcks.map(() => '?').join(', ')})`,
        partner.id,
        ...clearedAcks,
      );
    }

    if (!partner.grants.meals || !partner.grants.photos || planRecipeIds.length === 0) return part;
    if (!photosMayTravel(await currentNetworkKind(), await getPeerPhotosWifiOnly())) return part;

    const outRows = await db.getAllAsync<OutRow>(
      'SELECT photo_id, sent_at, acked_at, requested_at, full_sent_at, full_acked_at FROM peer_photo_out WHERE connection_id = ?',
      partner.id,
    );
    const thumbState = new Map<string, OutgoingState>();
    const fullState = new Map<string, OutgoingState>();
    const requested = new Set<string>();
    for (const row of outRows) {
      thumbState.set(row.photo_id, { sentAt: row.sent_at, ackedAt: row.acked_at });
      fullState.set(row.photo_id, { sentAt: row.full_sent_at, ackedAt: row.full_acked_at });
      if (row.requested_at && !row.full_acked_at) requested.add(row.photo_id);
    }

    const photos = newestPerRecipe(
      (await dishPhotosFor([...new Set(planRecipeIds)])).map((row) => ({ ...row, recipeId: row.ownerId.slice(DISH_RECIPE_PREFIX.length) })),
    );

    const thumbData = new Map<string, string>();
    const thumbCandidates = [];
    for (const photo of photos) {
      const state = thumbState.get(photo.id);
      if (state?.ackedAt) continue;
      await mediaThumbUri(photo);
      const data = await readBase64(await mediaFile(thumbFileName(photo.fileName)));
      if (!data) continue;
      thumbData.set(photo.id, data);
      thumbCandidates.push({ id: photo.id, recipeId: photo.recipeId, takenOn: photo.takenOn, base64Length: data.length });
    }

    const fullData = new Map<string, string>();
    const fullCandidates = [];
    if (options.allowFull) {
      for (const photo of photos) {
        if (!requested.has(photo.id)) continue;
        const data = await readBase64(await mediaFile(photo.fileName));
        if (!data) continue;
        fullData.set(photo.id, data);
        fullCandidates.push({ id: photo.id, base64Length: data.length });
      }
    }

    const chosen = choosePeerPhotos({
      thumbs: thumbCandidates,
      thumbState,
      requestedFull: fullCandidates,
      fullState,
      budget: options.budget,
      now: Date.now(),
    });

    const byId = new Map(photos.map((photo) => [photo.id, photo]));
    const thumbs: PeerPhotoThumb[] = [];
    for (const id of chosen.thumbIds) {
      const photo = byId.get(id);
      const thumb = thumbData.get(id);
      if (!photo || !thumb) continue;
      thumbs.push({ id, recipeId: photo.recipeId, takenOn: photo.takenOn, caption: photo.caption, thumb });
      await db.runAsync(
        `INSERT INTO peer_photo_out (connection_id, photo_id, sent_at) VALUES (?, ?, ?)
         ON CONFLICT(connection_id, photo_id) DO UPDATE SET sent_at = excluded.sent_at`,
        partner.id,
        id,
        now,
      );
    }
    const full: PeerPhotoFull[] = [];
    for (const id of chosen.fullIds) {
      const data = fullData.get(id);
      if (!data) continue;
      full.push({ id, data });
      await db.runAsync('UPDATE peer_photo_out SET full_sent_at = ? WHERE connection_id = ? AND photo_id = ?', now, partner.id, id);
    }
    if (thumbs.length > 0) part.photos = thumbs;
    if (full.length > 0) part.photoFull = full;
  } catch {
    // Photos never stop a plan or a list from going.
  }
  return part;
}

/** Keeps what another person's send carried, and records what they said
 *  about this phone's photos. Never throws: a photo that cannot be kept is
 *  simply not acknowledged, and comes again after a day. */
export async function applyPeerPhotos(connectionId: string, part: PeerPhotoPart): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    for (const id of part.photoAcks ?? []) {
      await db.runAsync('UPDATE peer_photo_out SET acked_at = ? WHERE connection_id = ? AND photo_id = ?', now, connectionId, id);
    }
    for (const id of part.photoFullAcks ?? []) {
      await db.runAsync('UPDATE peer_photo_out SET full_acked_at = ? WHERE connection_id = ? AND photo_id = ?', now, connectionId, id);
    }
    for (const id of part.photoRequests ?? []) {
      await db.runAsync(
        `INSERT INTO peer_photo_out (connection_id, photo_id, requested_at) VALUES (?, ?, ?)
         ON CONFLICT(connection_id, photo_id) DO UPDATE SET
           requested_at = COALESCE(peer_photo_out.requested_at, excluded.requested_at)`,
        connectionId,
        id,
        now,
      );
    }

    for (const photo of part.photos ?? []) {
      const thumbName = peerFileName(connectionId, photo.id, 'thumb');
      if (!(await writePeerFile(thumbName, photo.thumb))) continue;
      // Only the newest photo of each dish is kept from each person.
      const older = await db.getAllAsync<{ photo_id: string; thumb_file: string | null; full_file: string | null }>(
        'SELECT photo_id, thumb_file, full_file FROM peer_photos WHERE connection_id = ? AND recipe_id = ? AND photo_id <> ?',
        connectionId,
        photo.recipeId,
        photo.id,
      );
      for (const row of older) {
        await deletePeerFile(row.thumb_file);
        await deletePeerFile(row.full_file);
        await db.runAsync('DELETE FROM peer_photos WHERE connection_id = ? AND photo_id = ?', connectionId, row.photo_id);
      }
      await db.runAsync(
        `INSERT INTO peer_photos (connection_id, photo_id, recipe_id, taken_on, caption, thumb_file, received_at, ack_pending)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(connection_id, photo_id) DO UPDATE SET
           recipe_id = excluded.recipe_id, taken_on = excluded.taken_on, caption = excluded.caption,
           thumb_file = excluded.thumb_file, received_at = excluded.received_at, ack_pending = 1`,
        connectionId,
        photo.id,
        photo.recipeId,
        photo.takenOn,
        photo.caption,
        thumbName,
        now,
      );
    }

    for (const photo of part.photoFull ?? []) {
      const known = await db.getFirstAsync<{ photo_id: string }>(
        'SELECT photo_id FROM peer_photos WHERE connection_id = ? AND photo_id = ?',
        connectionId,
        photo.id,
      );
      if (!known) continue;
      const fullName = peerFileName(connectionId, photo.id, 'full');
      if (!(await writePeerFile(fullName, photo.data))) continue;
      await db.runAsync(
        'UPDATE peer_photos SET full_file = ?, full_ack_pending = 1 WHERE connection_id = ? AND photo_id = ?',
        fullName,
        connectionId,
        photo.id,
      );
    }
  } catch {
    // Nothing here is allowed to stop the plan that came with it.
  }
}

export type PeerDishPhoto = {
  photoId: string;
  takenOn: string;
  caption: string | null;
  thumbUri: string | null;
  fullUri: string | null;
  requested: boolean;
};

async function displayUri(name: string | null): Promise<string | null> {
  if (!name) return null;
  try {
    const file = await peerFile(name);
    if (!file.exists) return null;
    if (isDesktopApp()) return `data:image/jpeg;base64,${await file.base64()}`;
    return file.uri;
  } catch {
    return null;
  }
}

/** The photos one person has sent, by the dish they are of. */
export async function listPeerDishPhotos(connectionId: string): Promise<Map<string, PeerDishPhoto>> {
  const out = new Map<string, PeerDishPhoto>();
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      photo_id: string;
      recipe_id: string;
      taken_on: string;
      caption: string | null;
      thumb_file: string | null;
      full_file: string | null;
      requested_at: string | null;
    }>(
      'SELECT photo_id, recipe_id, taken_on, caption, thumb_file, full_file, requested_at FROM peer_photos WHERE connection_id = ?',
      connectionId,
    );
    for (const row of rows) {
      out.set(row.recipe_id, {
        photoId: row.photo_id,
        takenOn: row.taken_on,
        caption: row.caption,
        thumbUri: await displayUri(row.thumb_file),
        fullUri: await displayUri(row.full_file),
        requested: row.requested_at !== null,
      });
    }
  } catch {
    // No photos is a fine thing to show.
  }
  return out;
}

/** Asks for the larger size of one of their photos. It goes with the
 *  next send from this phone, and arrives with the next send from theirs. */
export async function requestPeerPhoto(connectionId: string, photoId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE peer_photos SET requested_at = COALESCE(requested_at, ?) WHERE connection_id = ? AND photo_id = ?',
    new Date().toISOString(),
    connectionId,
    photoId,
  );
}

/** Everything to do with one person's photos, for when the link is removed. */
export async function clearPeerPhotos(connectionId: string): Promise<void> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ thumb_file: string | null; full_file: string | null }>(
      'SELECT thumb_file, full_file FROM peer_photos WHERE connection_id = ?',
      connectionId,
    );
    for (const row of rows) {
      await deletePeerFile(row.thumb_file);
      await deletePeerFile(row.full_file);
    }
    await db.runAsync('DELETE FROM peer_photos WHERE connection_id = ?', connectionId);
    await db.runAsync('DELETE FROM peer_photo_out WHERE connection_id = ?', connectionId);
  } catch {
    // The rows go with the next removal attempt.
  }
}

/** Room taken by photos other people sent here. */
export async function peerPhotoStorageUsed(): Promise<{ photos: number; bytes: number }> {
  try {
    const dir = await peerDirectory();
    const { File } = await import('expo-file-system');
    let bytes = 0;
    let photos = 0;
    for (const entry of dir.list()) {
      if (!(entry instanceof File)) continue;
      bytes += entry.size ?? 0;
      if (entry.name.endsWith('.thumb.jpg')) photos += 1;
    }
    return { photos, bytes };
  } catch {
    return { photos: 0, bytes: 0 };
  }
}
