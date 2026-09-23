// Reading and writing the Tell Claude notes. Every sentence, every parse and
// every decision is in lib/devNotes.ts with no database; this is the I/O.
// See dev_notes in lib/db.ts for the table.
//
// Two stores, for two different reasons.
//
//   The table    so a note written on a bus with no signal is kept, and so
//                the app can say what is still waiting.
//   The file     inside-story-notes.jsonl in the shared Backups folder,
//                which on a computer is a plain file on the disk, so Claude
//                reads it with no transport to build and writes the answer
//                back into the same file as a status line.
//
// The file is read before it is written, so a status line Claude appended is
// taken in on the same pass that publishes whatever is new here. Neither
// step is allowed to fail loudly: the whole point of the table is that a
// note survives a folder nobody has set up yet, and notesToPublish means the
// backlog goes out whole the first time there is somewhere to put it.

import { APP_VERSION } from '../constants/version';
import { getDatabase } from './db';
import {
  DEV_NOTES_FILE_NAME,
  devNoteToLine,
  notesToPublish,
  readNoteIds,
  readStatusLines,
  statusesToApply,
} from './devNotes';
import type { DevNote, DevNoteKind, DevNoteStatusLine } from './devNotes';
import { getBackupsFolder } from './oneDriveFolders';
import { downloadText, uploadText } from './oneDriveGraph';
import { getMyDevice } from './snapshotSyncDevice';

const COLUMNS = [
  'id',
  'created_at AS createdAt',
  'device',
  'app_version AS appVersion',
  'tab',
  'lens',
  'band_id AS bandId',
  'band_title AS bandTitle',
  'kind',
  'body',
  'status',
  'done_version AS doneVersion',
  'done_at AS doneAt',
].join(', ');

/** Every note, newest first. */
export async function listDevNotes(): Promise<DevNote[]> {
  const db = await getDatabase();
  return db.getAllAsync<DevNote>(`SELECT ${COLUMNS} FROM dev_notes ORDER BY created_at DESC`);
}

export type NewDevNote = {
  kind: DevNoteKind;
  body: string;
  tab: string | null;
  lens: string | null;
  bandId: string | null;
  bandTitle: string | null;
};

/**
 * Writes a note down. The device, the version and the time are not asked for
 * and never passed in: the request was that it knows by itself which machine
 * the note came from.
 */
export async function addDevNote(input: NewDevNote): Promise<DevNote> {
  const db = await getDatabase();
  const device = await getMyDevice();
  const now = new Date().toISOString();
  const note: DevNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    device: device.kind === 'computer' ? 'computer' : 'phone',
    appVersion: APP_VERSION,
    tab: input.tab,
    lens: input.lens,
    bandId: input.bandId,
    bandTitle: input.bandTitle,
    kind: input.kind,
    body: input.body.trim(),
    status: 'open',
    doneVersion: null,
    doneAt: null,
  };
  await db.runAsync(
    `INSERT INTO dev_notes
       (id, created_at, device, app_version, tab, lens, band_id, band_title, kind, body, status, done_version, done_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NULL, NULL)`,
    note.id,
    note.createdAt,
    note.device,
    note.appVersion,
    note.tab,
    note.lens,
    note.bandId,
    note.bandTitle,
    note.kind,
    note.body,
  );
  return note;
}

/** Clears out the notes already shipped, so the count on screen is what is
 *  still waiting. The file keeps every line, so nothing is lost by this:
 *  the note and the status that answered it both stay readable there, and
 *  notesToPublish will not send a cleared note back out, since it is no
 *  longer in the table to be sent. */
export async function clearShippedDevNotes(): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM dev_notes WHERE status = 'done'");
  return result.changes ?? 0;
}

/** Takes in what the file said about notes already written here. */
export async function applyDevNoteStatuses(statuses: readonly DevNoteStatusLine[]): Promise<void> {
  if (!statuses.length) return;
  const db = await getDatabase();
  for (const status of statuses) {
    await db.runAsync(
      'UPDATE dev_notes SET status = ?, done_version = ?, done_at = ? WHERE id = ?',
      status.status,
      status.doneVersion,
      status.doneAt,
      status.id,
    );
  }
}

export type DevNoteSyncResult = {
  /** How many notes reached the file this time. */
  published: number;
  /** How many answers came back from it. */
  answered: number;
  /** Why nothing could be done, or null when it worked. */
  problem: string | null;
};

/**
 * Carries notes out to the file and answers back from it.
 *
 * There is no append in the Graph API and none on the disk side either, so
 * this reads the whole file, puts the new lines on the end, and writes it
 * back. That is safe here because the file is read immediately before the
 * write on every device that touches it, and because a line is never edited
 * in place: a note marked done is a new line rather than a changed one, and
 * lib/devNotes.ts settles a repeated id by taking the later line.
 */
export async function syncDevNotes(): Promise<DevNoteSyncResult> {
  const nothing: DevNoteSyncResult = { published: 0, answered: 0, problem: null };
  const notes = await listDevNotes();
  const folder = await getBackupsFolder();
  if (!folder.ok) return { ...nothing, problem: folder.reason };

  let text = '';
  const existing = await downloadText(folder.value, DEV_NOTES_FILE_NAME);
  if (existing.ok) text = existing.value;

  const answers = statusesToApply(notes, readStatusLines(text));
  await applyDevNoteStatuses(answers);

  const waiting = notesToPublish(notes, readNoteIds(text));
  if (!waiting.length) return { published: 0, answered: answers.length, problem: null };

  const added = waiting.map((note) => devNoteToLine(note)).join('\n');
  const body = text && !text.endsWith('\n') ? `${text}\n${added}\n` : `${text}${added}\n`;
  const written = await uploadText(folder.value, DEV_NOTES_FILE_NAME, body);
  if (!written.ok) return { published: 0, answered: answers.length, problem: written.reason };
  return { published: waiting.length, answered: answers.length, problem: null };
}
