// Notes on the calendar (H7 of the competitive build plan, 2026-09-28:
// "Notes on the calendar: an item_type of note in the week strip"). A note
// is a line of the person's own words put on a day of Schedules > Meals:
// "Out for dinner Friday", "Sam home from school", "Shop after work". It
// has a day, an optional time and its text, and nothing else.
//
// A NOTE IS NEVER PLANNED. It lives in schedule_items with item_type 'note'
// and status 'note', never 'planned', because every reader that asks about
// open items, raises a reminder, settles a lapsed meal or offers to move
// today's leftovers to tomorrow reads planned rows. So a note is never
// asked about, never reminded about, never settled and never reads as
// missed: it is written down and stays written down.
//
// A NOTE WITH NO TIME is stored as the bare day ("2026-09-30") rather than
// at midnight, so it reads as Any time rather than 12:00 AM, sorts before
// the day's timed notes, and still matches every substr(scheduled_for, 1,
// 10) query the table already has.
//
// Pure, with no React and no database, so scripts/test_calendar_notes.js
// checks it without a phone.

import { formatTime12 } from './timeOfDay';

export const NOTE_ITEM_TYPE = 'note';
export const NOTE_STATUS = 'note';
export const NOTE_MAX_LENGTH = 280;

export const NOTES_TITLE = 'Notes';
export const ADD_NOTE_LABEL = '+ Add a note to this day';
export const NOTE_ANY_TIME = 'Any time';
export const NOTES_INTRO =
  'A note is a line you put on a day: somebody away, a meal out, a shop to do. It shows as a ring under the day in the week above, and nothing reminds you about it or asks whether it happened.';

export type CalendarNote = { id: string; scheduledFor: string; text: string };

/** The day a note is on. */
export function noteDate(scheduledFor: string): string {
  return scheduledFor.slice(0, 10);
}

/** "HH:mm", or null for a note with no time. */
export function noteTime(scheduledFor: string): string | null {
  const time = scheduledFor.split('T')[1];
  return time ? time.slice(0, 5) : null;
}

export function noteScheduledFor(date: string, time: string | null): string {
  return time ? `${date}T${time}` : date;
}

export function noteTimeLabel(scheduledFor: string): string {
  const time = noteTime(scheduledFor);
  return time ? formatTime12(time) : NOTE_ANY_TIME;
}

/**
 * Reads the optional time box. Empty is no time; "18:30", "6:30 pm",
 * "6pm" and "6 PM" are all read. Anything else comes back with the words
 * to put beside the box.
 */
export function parseNoteTime(input: string): { time: string | null; problem: string | null } {
  const text = input.trim().toLowerCase().replace(/\./g, '');
  if (text === '') return { time: null, problem: null };
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/.exec(text);
  const problem = 'Write the time like 18:30 or 6:30 pm, or leave it empty for any time of the day.';
  if (!match) return { time: null, problem };
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const half = match[3]?.[0];
  if (minute > 59) return { time: null, problem };
  if (half) {
    if (hour < 1 || hour > 12) return { time: null, problem };
    if (half === 'p' && hour !== 12) hour += 12;
    if (half === 'a' && hour === 12) hour = 0;
  } else if (hour > 23) return { time: null, problem };
  const pad = (n: number) => String(n).padStart(2, '0');
  return { time: `${pad(hour)}:${pad(minute)}`, problem: null };
}

/** What stops a note being saved, or null. The text is kept as written. */
export function noteTextProblem(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === '') return 'Write the note first.';
  if (trimmed.length > NOTE_MAX_LENGTH) {
    return `A note holds up to ${NOTE_MAX_LENGTH} characters; this one has ${trimmed.length}.`;
  }
  return null;
}

/** Notes with no time first, then by time, then in the order written. */
export function sortNotes<T extends CalendarNote>(notes: T[]): T[] {
  return notes
    .map((note, index) => ({ note, index }))
    .sort((a, b) => {
      const at = noteTime(a.note.scheduledFor) ?? '';
      const bt = noteTime(b.note.scheduledFor) ?? '';
      return at === bt ? a.index - b.index : at < bt ? -1 : 1;
    })
    .map(({ note }) => note);
}

/** Notes grouped by day, each day's list in sortNotes order. */
export function notesByDate<T extends CalendarNote>(notes: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const note of notes) {
    const date = noteDate(note.scheduledFor);
    const bucket = map.get(date);
    if (bucket) bucket.push(note);
    else map.set(date, [note]);
  }
  for (const [date, bucket] of map) map.set(date, sortNotes(bucket));
  return map;
}

/**
 * The key under the week strip, shown only when the week has a note, so a
 * week of meals alone reads the way it always has.
 */
export function weekStripKey(weekHasNotes: boolean): string | null {
  return weekHasNotes ? 'A dot under a day is a meal planned; a ring is a note.' : null;
}

/** The empty line for a day with no note. */
export function noNotesLine(dayPhrase: string): string {
  return `No note on ${dayPhrase}.`;
}

/** Said after a note is saved. */
export function noteSavedMessage(scheduledFor: string, dayPhrase: string, editing: boolean): string {
  const time = noteTime(scheduledFor);
  return `${editing ? 'Note changed' : 'Note added'} on ${dayPhrase}${time ? ` at ${formatTime12(time)}` : ''}.`;
}

export function removeNoteMessage(text: string): string {
  const shown = text.length > 80 ? `${text.slice(0, 77)}...` : text;
  return `"${shown}" comes off this day. Nothing else on the schedule changes.`;
}
