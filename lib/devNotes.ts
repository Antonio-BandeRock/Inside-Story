// Tell Claude: a note about a piece of this app, made from inside the app.
//
// Direct request, 2026-09-22: "I would like to have the ability to have the
// long press 'Tell Claude' for development purposes only, just like me
// editing content, so I can directly interface with Claude to change
// something about it. A function with many steps gets one Tell Claude and
// it applies to all of them. It needs to know automatically when I am
// making the note from my mobile phone or the windows app."
//
// Four decisions were settled the same day, and each one is why a piece of
// this looks the way it does.
//
// 1. A NOTE IS QUEUED, NOT APPLIED. An edit to the wording does not replace
//    what is on screen. It is written down with the exact text, Claude
//    changes the source, and it arrives on the next update. The alternative
//    (an override layer the running app prefers) would have meant a wrapper
//    around every Text in the app and a standing hazard of the phone showing
//    words that are nowhere in the repository.
// 2. A NOTE BELONGS TO A BAND. Every fold band already carries an id and a
//    title (components/TabBand.tsx), so a note anchors to the one under the
//    finger. A form with six steps inside one band is one note covering all
//    six, which is what the request asked for. A note about the screen
//    rather than any one band carries no band at all.
// 3. THE DEVICE SAYS ITSELF. Nothing here asks which device is being used:
//    lib/snapshotSyncDevice.ts already answers phone or computer, and the
//    version, the tab, the lens and the time come from the app.
// 4. IT IS FOR BUILDING THIS APP, AND NOTHING ELSE. The whole feature is
//    behind a switch in Profile that starts off, so nobody who is using the
//    app to run their life ever meets it.
//
// WHERE A NOTE GOES. Two places at once, for two different reasons. The
// dev_notes table, so the app can show what is still waiting and so a note
// survives with no signal. And one line appended to inside-story-notes.jsonl
// in the shared Backups folder, which on a computer is a plain file on the
// disk, so Claude reads it directly with no transport to build. The same
// file carries the answer back: a status line names a note's id and the
// version its change shipped in, and the app folds those in on the next
// check so the note reads Done.
//
// This module does no I/O, imports nothing and holds no React, so
// scripts/test_dev_notes.js checks every sentence and every parse without a
// phone. lib/devNotesDb.ts does the reading and writing,
// components/TellClaudeHost.tsx is the button and what somebody types
// into, and lib/tellClaude.ts is how a long press reaches it.

/** The file in the Backups folder, one JSON object per line. */
export const DEV_NOTES_FILE_NAME = 'inside-story-notes.jsonl';

export type DevNoteKind = 'wording' | 'behaviour' | 'bug' | 'idea';

export type DevNoteStatus = 'open' | 'done';

/** Which device a note was made on. Mirrors SyncDeviceKind in
 *  lib/snapshotSync.ts; neither file imports the other. */
export type DevNoteDevice = 'phone' | 'computer';

export type DevNote = {
  id: string;
  /** ISO, when it was written. */
  createdAt: string;
  device: DevNoteDevice;
  /** The APP_VERSION running when it was written, so a note about something
   *  since changed can be read against what was on screen at the time. */
  appVersion: string;
  /** The tab, as TAB_ROUTES titles it. Null when nothing said. */
  tab: string | null;
  /** The lens inside that tab, as its menu labels it. */
  lens: string | null;
  /** The fold band's id, which is what makes a note findable in the source. */
  bandId: string | null;
  /** The band's title as it read on screen. */
  bandTitle: string | null;
  kind: DevNoteKind;
  body: string;
  status: DevNoteStatus;
  /** The version the change shipped in, once Claude has written it back. */
  doneVersion: string | null;
  doneAt: string | null;
};

export const DEV_NOTE_KINDS: readonly DevNoteKind[] = ['wording', 'behaviour', 'bug', 'idea'];

export const DEV_NOTE_LABELS: Record<DevNoteKind, string> = {
  wording: 'Wording',
  behaviour: 'Behaviour',
  bug: 'Something broken',
  idea: 'Idea',
};

export const DEV_NOTE_CAPTIONS: Record<DevNoteKind, string> = {
  wording: 'Change what this says. Quote the words you want gone and say what should stand there instead.',
  behaviour: 'It works, and it should work differently. Say what it does now and what it should do.',
  bug: 'It does the wrong thing. Say what you did, what happened, and what you expected.',
  idea: 'Something that is not here yet, thought of while looking at this.',
};

/** What is wrong with a note as typed, or null when it can be saved. */
export function devNoteProblem(body: string): string | null {
  if (!body.trim()) return 'Say what you want changed.';
  return null;
}

/** Where a note was made, in one line. Reads as much as is known and no
 *  more: a note made with no lens open says only the tab. */
export function describeDevNoteWhere(note: Pick<DevNote, 'tab' | 'lens' | 'bandTitle'>): string {
  const place = [note.tab, note.lens].filter((part): part is string => Boolean(part)).join(' > ');
  if (note.bandTitle && place) return `${place}, the ${note.bandTitle} band`;
  if (note.bandTitle) return `The ${note.bandTitle} band`;
  return place || 'Somewhere with no name on it';
}

/** The device a note came from, named the way somebody would say it. */
export function describeDevNoteDevice(device: DevNoteDevice): string {
  return device === 'computer' ? 'the Windows app' : 'the phone';
}

/** The line a note reads as in a list: where it was made and when. */
export function describeDevNote(note: DevNote): string {
  const where = describeDevNoteWhere(note);
  const made = `${describeDevNoteDevice(note.device)}, ${note.appVersion}`;
  if (note.status === 'done') {
    return note.doneVersion
      ? `${where}. From ${made}, shipped in ${note.doneVersion}.`
      : `${where}. From ${made}, done.`;
  }
  return `${where}. From ${made}.`;
}

/** How many are waiting and how many have been dealt with. */
export function summariseDevNotes(notes: readonly DevNote[]): string {
  if (!notes.length) return 'Nothing written down yet.';
  const open = notes.filter((note) => note.status === 'open').length;
  const done = notes.length - open;
  const waiting = open === 1 ? '1 waiting' : `${open} waiting`;
  if (!done) return `${waiting}.`;
  return `${waiting}, ${done} already shipped.`;
}

// THE FILE.
//
// One JSON object per line, appended and never rewritten, so two devices
// writing the same file cannot lose each other's lines to a half-written
// replacement. A line is either a whole note or a status for one.

export type DevNoteStatusLine = {
  id: string;
  status: DevNoteStatus;
  doneVersion: string | null;
  doneAt: string | null;
};

export type DevNoteLine =
  | { type: 'note'; note: DevNote }
  | { type: 'status'; status: DevNoteStatusLine };

export function devNoteToLine(note: DevNote): string {
  return JSON.stringify({ type: 'note', ...note });
}

export function devNoteStatusToLine(status: DevNoteStatusLine): string {
  return JSON.stringify({ type: 'status', ...status });
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function asKind(value: unknown): DevNoteKind {
  return DEV_NOTE_KINDS.includes(value as DevNoteKind) ? (value as DevNoteKind) : 'idea';
}

/** One line back, or null when it is blank or cannot be read. A line this
 *  version does not understand is passed over rather than throwing, since
 *  the file is appended to by whatever version happened to be running. */
export function parseDevNoteLine(line: string): DevNoteLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const id = asString(parsed.id);
  if (!id) return null;
  if (parsed.type === 'status') {
    return {
      type: 'status',
      status: {
        id,
        status: parsed.status === 'open' ? 'open' : 'done',
        doneVersion: asString(parsed.doneVersion),
        doneAt: asString(parsed.doneAt),
      },
    };
  }
  const body = asString(parsed.body);
  if (!body) return null;
  return {
    type: 'note',
    note: {
      id,
      createdAt: asString(parsed.createdAt) ?? '',
      device: parsed.device === 'computer' ? 'computer' : 'phone',
      appVersion: asString(parsed.appVersion) ?? '',
      tab: asString(parsed.tab),
      lens: asString(parsed.lens),
      bandId: asString(parsed.bandId),
      bandTitle: asString(parsed.bandTitle),
      kind: asKind(parsed.kind),
      body,
      status: parsed.status === 'done' ? 'done' : 'open',
      doneVersion: asString(parsed.doneVersion),
      doneAt: asString(parsed.doneAt),
    },
  };
}

/** Every status line in a file, keyed by the note it is about. A later line
 *  for the same note wins, which is what makes the file appendable: a note
 *  reopened after being marked done reads as open again. */
export function readStatusLines(text: string): Map<string, DevNoteStatusLine> {
  const found = new Map<string, DevNoteStatusLine>();
  for (const line of text.split('\n')) {
    const parsed = parseDevNoteLine(line);
    if (parsed?.type === 'status') found.set(parsed.status.id, parsed.status);
  }
  return found;
}

/** Which of these notes the file has an answer for that the app has not
 *  taken in yet. Anything already agreeing with what is here is left out, so
 *  nothing is written to the database for a file that said nothing new. */
export function statusesToApply(
  notes: readonly DevNote[],
  fromFile: Map<string, DevNoteStatusLine>,
): DevNoteStatusLine[] {
  const changed: DevNoteStatusLine[] = [];
  for (const note of notes) {
    const answer = fromFile.get(note.id);
    if (!answer) continue;
    if (answer.status === note.status && answer.doneVersion === note.doneVersion) continue;
    changed.push(answer);
  }
  return changed;
}

/** Every note id the file already carries. */
export function readNoteIds(text: string): Set<string> {
  const ids = new Set<string>();
  for (const line of text.split('\n')) {
    const parsed = parseDevNoteLine(line);
    if (parsed?.type === 'note') ids.add(parsed.note.id);
  }
  return ids;
}

/** Which notes are in the app but have never reached the file, so a note
 *  written with no folder set up is published the moment there is one. */
export function notesToPublish(notes: readonly DevNote[], publishedIds: ReadonlySet<string>): DevNote[] {
  return notes.filter((note) => !publishedIds.has(note.id));
}
