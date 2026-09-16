// Reading and writing the capture inbox.
//
// Added 2026-09-16. Same split every other area here follows: the schema in
// lib/db.ts, the rules and the wording in lib/captureNotes.ts with no database
// so they can be checked without one, and the reading and writing here.

import { getDatabase } from './db';
import {
  cleanCaptureText,
  isCaptureTextUsable,
  type CaptureDestinationKey,
  type CaptureNote,
  type CaptureSource,
  type CaptureStatus,
} from './captureNotes';

type CaptureRow = {
  id: string;
  text: string;
  source: string;
  status: string;
  destination: string | null;
  createdAt: string;
  sortedAt: string | null;
  doneAt: string | null;
};

function toNote(row: CaptureRow): CaptureNote {
  return {
    id: row.id,
    text: row.text,
    source: row.source === 'spoken' ? 'spoken' : 'typed',
    status: row.status === 'sorted' || row.status === 'done' ? (row.status as CaptureStatus) : 'waiting',
    destination: (row.destination as CaptureDestinationKey | null) ?? null,
    createdAt: row.createdAt,
    sortedAt: row.sortedAt,
    doneAt: row.doneAt,
  };
}

/**
 * Throw a thought in. Returns the new note's id, or null when there was
 * nothing usable to keep.
 *
 * Nothing is asked and nothing is inferred: no destination, no date, no
 * matching against anything already in the app. The two seconds this takes is
 * the whole feature, and every check added here would be spent out of it.
 */
export async function createCaptureNote(text: string, source: CaptureSource = 'typed'): Promise<string | null> {
  if (!isCaptureTextUsable(text)) return null;
  const db = await getDatabase();
  const id = `capture_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await db.runAsync(
    `INSERT INTO capture_notes (id, text, source, status, destination, created_at) VALUES (?, ?, ?, 'waiting', NULL, ?)`,
    id, cleanCaptureText(text), source, new Date().toISOString(),
  );
  return id;
}

/**
 * Everything in the inbox, newest first.
 *
 * Done notes come back too rather than being filtered out here, because the
 * screen shows them folded away and the Home card counts against the same one
 * read. `sinceDays` trims the done pile only: a note still waiting is still
 * waiting however long it has been there, and quietly hiding it would be the
 * app deciding a thought had expired.
 */
export async function listCaptureNotes(sinceDays = 60): Promise<CaptureNote[]> {
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const rows = await db.getAllAsync<CaptureRow>(
    `
      SELECT id, text, source, status, destination,
             created_at AS createdAt, sorted_at AS sortedAt, done_at AS doneAt
      FROM capture_notes
      WHERE status != 'done' OR done_at IS NULL OR done_at >= ?
      ORDER BY created_at DESC
    `,
    cutoff,
  );
  return rows.map(toNote);
}

/** Correcting what a recognizer heard, or finishing a thought later. */
export async function updateCaptureNoteText(id: string, text: string): Promise<boolean> {
  if (!isCaptureTextUsable(text)) return false;
  const db = await getDatabase();
  await db.runAsync(`UPDATE capture_notes SET text = ? WHERE id = ?`, cleanCaptureText(text), id);
  return true;
}

/**
 * Say where a thought belongs. Passing null puts it back in the waiting pile,
 * which is how a wrong guess is undone: the note is never consumed by being
 * sorted, so nothing is lost by getting it wrong.
 */
export async function setCaptureNoteDestination(
  id: string,
  destination: CaptureDestinationKey | null,
): Promise<void> {
  const db = await getDatabase();
  if (!destination) {
    await db.runAsync(
      `UPDATE capture_notes SET destination = NULL, status = 'waiting', sorted_at = NULL, done_at = NULL WHERE id = ?`,
      id,
    );
    return;
  }
  await db.runAsync(
    `UPDATE capture_notes SET destination = ?, status = 'sorted', sorted_at = ?, done_at = NULL WHERE id = ?`,
    destination, new Date().toISOString(), id,
  );
}

/**
 * Dealt with. A note can be marked done straight from the waiting pile without
 * ever being sorted, because plenty of thoughts are handled in the ten seconds
 * after they are written down and never need a category at all.
 */
export async function setCaptureNoteDone(id: string, done: boolean): Promise<void> {
  const db = await getDatabase();
  if (done) {
    await db.runAsync(`UPDATE capture_notes SET status = 'done', done_at = ? WHERE id = ?`, new Date().toISOString(), id);
    return;
  }
  // Back to wherever it was before: still sorted if it has a destination,
  // waiting if it never got one.
  await db.runAsync(
    `
      UPDATE capture_notes
      SET status = CASE WHEN destination IS NULL THEN 'waiting' ELSE 'sorted' END, done_at = NULL
      WHERE id = ?
    `,
    id,
  );
}

/** For a note that should not have been kept at all. */
export async function deleteCaptureNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM capture_notes WHERE id = ?`, id);
}

/**
 * What Home needs to know without reading the notes themselves: how many are
 * waiting, and how many were sorted but not finished with.
 */
export async function getCaptureInboxCounts(): Promise<{ waiting: number; sorted: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ waiting: number; sorted: number }>(
    `
      SELECT
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
        SUM(CASE WHEN status = 'sorted' THEN 1 ELSE 0 END) AS sorted
      FROM capture_notes
    `,
  );
  return { waiting: Number(row?.waiting ?? 0), sorted: Number(row?.sorted ?? 0) };
}
