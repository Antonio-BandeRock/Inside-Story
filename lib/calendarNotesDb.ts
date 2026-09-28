// Reads and writes the notes on the calendar (H7, lib/calendarNotes.ts).
// A note is a schedule_items row with item_type 'note' and status 'note',
// never 'planned', so no reader of open or planned items ever sees one.

import { getDatabase } from './db';
import { NOTE_ITEM_TYPE, NOTE_STATUS, noteTextProblem, type CalendarNote } from './calendarNotes';

/** Every note on the days from `from` to `to`, both included. */
export async function listCalendarNotes(from: string, to: string): Promise<CalendarNote[]> {
  const db = await getDatabase();
  return db.getAllAsync<CalendarNote>(
    `SELECT id, scheduled_for AS scheduledFor, COALESCE(title, '') AS text
       FROM schedule_items
      WHERE item_type = ? AND substr(scheduled_for, 1, 10) BETWEEN ? AND ?
      ORDER BY scheduled_for ASC, created_at ASC`,
    NOTE_ITEM_TYPE,
    from,
    to,
  );
}

function checked(text: string): string {
  const problem = noteTextProblem(text);
  if (problem) throw new Error(problem);
  return text.trim();
}

export async function addCalendarNote(scheduledFor: string, text: string): Promise<string> {
  const db = await getDatabase();
  const id = `schedule_item_${Date.now()}_note`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO schedule_items (id, scheduled_for, item_type, title, status, repeat_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'none', ?, ?)`,
    id,
    scheduledFor,
    NOTE_ITEM_TYPE,
    checked(text),
    NOTE_STATUS,
    now,
    now,
  );
  return id;
}

export async function updateCalendarNote(id: string, scheduledFor: string, text: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule_items SET scheduled_for = ?, title = ?, updated_at = ? WHERE id = ? AND item_type = ?`,
    scheduledFor,
    checked(text),
    new Date().toISOString(),
    id,
    NOTE_ITEM_TYPE,
  );
}

export async function removeCalendarNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM schedule_items WHERE id = ? AND item_type = ?', id, NOTE_ITEM_TYPE);
}
