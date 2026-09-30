// Which device has the session, the reading and writing. The decisions
// are lib/syncSession.ts; the note sits in the same Backups folder as the
// snapshots (lib/oneDriveFolders.ts), so on a computer reading it is a
// read of a file on the disk and on a phone it is one small request.

import { downloadText, listFiles, uploadText } from './oneDriveGraph';
import { getBackupsFolder } from './oneDriveFolders';
import { readSyncState } from './snapshotSyncDevice';
import { buildSessionNote, parseSessionNote, SESSION_FILE_NAME, type SessionNote } from './syncSession';
import type { SyncDevice } from './snapshotSync';

type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

/** The note as it stands, null when there is none, or why it could not be read. */
export async function readSessionNote(): Promise<Result<SessionNote | null>> {
  const folder = await getBackupsFolder();
  if (!folder.ok) return folder;
  const files = await listFiles(folder.value);
  if (!files.ok) return files;
  if (!files.value.some((file) => file.name === SESSION_FILE_NAME)) return { ok: true, value: null };
  const text = await downloadText(folder.value, SESSION_FILE_NAME);
  if (!text.ok) return text;
  return { ok: true, value: parseSessionNote(text.value) };
}

/**
 * Writes that this device has the session and was used just now. `since`
 * carries over from a note this device already held, so the note says
 * when the session began rather than when it was last touched.
 */
export async function claimSession(me: SyncDevice, held: SessionNote | null): Promise<Result<SessionNote>> {
  const state = await readSyncState();
  if (!state.enabled) return { ok: false, reason: 'Sync is off.' };
  const folder = await getBackupsFolder();
  if (!folder.ok) return folder;
  const now = new Date().toISOString();
  const since =
    held && held.holder.kind === me.kind && held.holder.fingerprint === me.fingerprint ? held.since : now;
  const note = buildSessionNote(me, since, now);
  const written = await uploadText(folder.value, SESSION_FILE_NAME, JSON.stringify(note));
  if (!written.ok) return written;
  return { ok: true, value: note };
}
