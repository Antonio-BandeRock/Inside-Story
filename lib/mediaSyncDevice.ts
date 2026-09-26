// One photo layer (X1): copying photo files between one person's devices
// through the Backups folder, beside the encrypted snapshot. The rows travel
// inside the snapshot like any other table; this moves the bytes the rows
// name, which the snapshot deliberately leaves out so a save stays small.
//
// Each photo goes into MEDIA_SYNC_FOLDER as its own file, encrypted with the
// sync password. One salt serves a whole pass, so the slow key derivation
// runs once a pass rather than once a photo. The plaintext record,
// inside-story-sync.json, never names a photo.
//
// Every decision is planPhotoSync in lib/media.ts; this only reads, writes
// and reports. A pass never throws: anything that goes wrong is kept as the
// status line Profile shows, and the next pass tries again.

import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupWire, newBackupSalt } from './backupEncryption';
import { base64ToBytes } from './deviceIdentity';
import {
  idFromPhotoCopyName,
  MEDIA_SYNC_FOLDER,
  orphanedLocalFiles,
  photoCopyName,
  planPhotoSync,
  thumbFileName,
  type PhotoSyncStatus,
} from './media';
import { migrateLegacyDishPhotos } from './mealPhotos';
import { listAllMedia, listLocalMediaFileNames, mediaFile } from './mediaDb';
import { deleteFile, downloadText, ensureChildFolder, listFileNames, uploadText } from './oneDriveGraph';
import { getBackupsFolder } from './oneDriveFolders';
import { sameDevice } from './snapshotSync';
import { getMyDevice, readSyncRecord, readSyncState } from './snapshotSyncDevice';

let status: PhotoSyncStatus | null = null;
let running: Promise<void> | null = null;
let lastPassAt = 0;

/** How often a pass runs when nothing was saved and nothing is owed. The
 *  watcher checks every half minute, and listing a folder of photos that
 *  often would be wasted work; a save, a photo still on the way or a
 *  problem runs a pass at once. */
const QUIET_PASS_EVERY_MS = 5 * 60 * 1000;

/** Where the last pass left things, for Profile > Backup & Restore. */
export function getPhotoSyncStatus(): PhotoSyncStatus | null {
  return status;
}

// Version 2 (1.0.53.7) carries the thumbnail beside the report size, so the
// other device does not have to make its own. A version 1 copy still opens;
// its thumbnail is made the first time the photo is shown.
type PhotoCopy = { v: 1 | 2; id: string; base64: string; thumbBase64?: string };

/**
 * One pass: send the photos the folder lacks, fetch the ones this device
 * lacks, and tidy what nobody refers to. `afterSave` is true straight after
 * this device saved its snapshot, the one moment the folder may be cleared.
 * A second call while a pass runs waits for that pass rather than starting
 * another.
 */
export function syncPhotos(options: { afterSave: boolean }): Promise<void> {
  if (running) return running;
  const owed = !status || status.waiting > 0 || status.toCopy > 0 || status.problem !== null;
  if (!options.afterSave && !owed && Date.now() - lastPassAt < QUIET_PASS_EVERY_MS) return Promise.resolve();
  lastPassAt = Date.now();
  running = runPass(options.afterSave).finally(() => {
    running = null;
  });
  return running;
}

async function runPass(afterSave: boolean): Promise<void> {
  const checkedAt = new Date().toISOString();
  try {
    // Dish photos kept before the one photo layer move into it first, on
    // every device, whether or not sync is on (lib/mealPhotos.ts).
    await migrateLegacyDishPhotos().catch(() => undefined);
    const state = await readSyncState();
    if (!state.enabled || !state.password) return;
    const password = state.password;

    const rows = await listAllMedia();
    const byId = new Map(rows.map((row) => [row.id, row]));
    const localNames = await listLocalMediaFileNames();
    const localSet = new Set(localNames);

    // Files here that no row names go first, so they are never sent.
    for (const name of orphanedLocalFiles(rows.map((row) => row.fileName), localNames)) {
      try {
        (await mediaFile(name)).delete();
      } catch {
        // Tried again on the next pass.
      }
    }

    const backups = await getBackupsFolder();
    if (!backups.ok) {
      status = { onDevice: countHere(rows, localSet), waiting: 0, toCopy: 0, problem: backups.reason, checkedAt };
      return;
    }
    const folder = await ensureChildFolder(backups.value, MEDIA_SYNC_FOLDER);
    if (!folder.ok) {
      status = { onDevice: countHere(rows, localSet), waiting: 0, toCopy: 0, problem: folder.reason, checkedAt };
      return;
    }
    const names = await listFileNames(folder.value);
    if (!names.ok) {
      status = { onDevice: countHere(rows, localSet), waiting: 0, toCopy: 0, problem: names.reason, checkedAt };
      return;
    }

    const plan = planPhotoSync({
      rowIds: rows.map((row) => row.id),
      localFileIds: rows.filter((row) => localSet.has(row.fileName)).map((row) => row.id),
      folderNames: names.value,
      mayClearFolder: afterSave && (await thisDeviceSavedLast(state.lastSavedAt)),
    });

    let problem: string | null = null;
    let failedUploads = 0;
    let failedDownloads = 0;
    let salt: Uint8Array | null = null;

    for (const id of plan.upload) {
      const row = byId.get(id);
      if (!row) continue;
      try {
        const base64 = await (await mediaFile(row.fileName)).base64();
        const thumb = await mediaFile(thumbFileName(row.fileName));
        const copy: PhotoCopy = { v: 2, id, base64, thumbBase64: thumb.exists ? await thumb.base64() : undefined };
        salt = salt ?? (await newBackupSalt());
        const wire = await encryptBackupPayload(JSON.stringify(copy), password, salt);
        const sent = await uploadText(folder.value, photoCopyName(id), JSON.stringify(wire));
        if (!sent.ok) {
          failedUploads += 1;
          problem = sent.reason;
        }
      } catch (error) {
        failedUploads += 1;
        problem = error instanceof Error ? error.message : String(error);
      }
    }

    for (const id of plan.download) {
      const row = byId.get(id);
      if (!row) continue;
      try {
        const text = await downloadText(folder.value, photoCopyName(id));
        if (!text.ok) {
          failedDownloads += 1;
          problem = text.reason;
          continue;
        }
        const wire: unknown = JSON.parse(text.value);
        if (!isEncryptedBackupWire(wire)) throw new Error('A photo copy in the shared folder could not be read.');
        const plain = await decryptBackupPayload(wire, password);
        if (plain === null) throw new Error('A photo copy did not open with this password.');
        const copy = JSON.parse(plain) as Partial<PhotoCopy>;
        if (copy.id !== id || typeof copy.base64 !== 'string') throw new Error('A photo copy did not match its name.');
        (await mediaFile(row.fileName)).write(base64ToBytes(copy.base64));
        if (typeof copy.thumbBase64 === 'string') {
          (await mediaFile(thumbFileName(row.fileName))).write(base64ToBytes(copy.thumbBase64));
        }
      } catch (error) {
        failedDownloads += 1;
        problem = error instanceof Error ? error.message : String(error);
      }
    }

    for (const id of plan.clearFromFolder) {
      if (!idFromPhotoCopyName(photoCopyName(id))) continue;
      await deleteFile(folder.value, photoCopyName(id));
    }

    status = {
      onDevice: rows.length - plan.waiting.length - failedDownloads,
      waiting: plan.waiting.length + failedDownloads,
      toCopy: failedUploads,
      problem,
      checkedAt,
    };
  } catch (error) {
    status = {
      onDevice: status?.onDevice ?? 0,
      waiting: status?.waiting ?? 0,
      toCopy: status?.toCopy ?? 0,
      problem: error instanceof Error ? error.message : String(error),
      checkedAt,
    };
  }
}

function countHere(rows: readonly { fileName: string }[], localSet: ReadonlySet<string>): number {
  return rows.filter((row) => localSet.has(row.fileName)).length;
}

/** Whether the record in the folder still names this device's own save as
 *  the latest, which is when every row anybody kept is in that snapshot. */
async function thisDeviceSavedLast(lastSavedAt: string | null): Promise<boolean> {
  if (!lastSavedAt) return false;
  const record = await readSyncRecord();
  if (!record.ok || !record.value) return false;
  const me = await getMyDevice();
  return sameDevice(record.value.latest.device, me) && record.value.latest.savedAt === lastSavedAt;
}
