// The capture inbox: somewhere to throw a thought before it evaporates.
//
// 2026-09-16, direct instruction, after the reminder coverage work the same
// day: "then the capture inbox". The reason it exists, in the tracker row's
// own words: this app has plenty of places to PUT a thing and nowhere to
// THROW one. Every capture path already built (Log Again, Say What You Ate,
// the barcode scanner) knows what kind of thing it is receiving before it
// starts. This one must not.
//
// So capture asks nothing. No category, no date, no form, no decision. One
// field and one microphone, and the words are kept exactly as they arrived.
// Deciding what "call the dentist" actually is happens afterwards, on the
// person's own time, which is the easy half.
//
// Pure on purpose: no database, no React, no colours, so the rules below can
// be checked in plain node (scripts/test_capture_notes.js) and so both the
// screen and the database module can read them without a cycle.

// Typed or spoken. Kept because the two read differently later: a spoken note
// carries whatever the recognizer heard, so a person re-reading a strange line
// deserves to know a microphone wrote it rather than their own thumbs.
export type CaptureSource = 'typed' | 'spoken';

// waiting: thrown in, nothing decided.
// sorted: given a destination, not finished with.
// done: dealt with, kept for a while so it can be looked back at.
export type CaptureStatus = 'waiting' | 'sorted' | 'done';

// Where a thought turns out to belong. Deliberately short. A long list is a
// form, and a form at sorting time is the same tax this feature exists to
// remove, only moved later in the day.
export type CaptureDestinationKey =
  | 'calendar'
  | 'shopping'
  | 'garden'
  | 'upkeep'
  | 'money'
  | 'health'
  | 'thought';

export type CaptureNote = {
  id: string;
  text: string;
  source: CaptureSource;
  status: CaptureStatus;
  destination: CaptureDestinationKey | null;
  createdAt: string;
  sortedAt: string | null;
  doneAt: string | null;
};

export type CaptureDestination = {
  key: CaptureDestinationKey;
  label: string;
  // What sort of thing lands here, in the words someone would use about it.
  hint: string;
  // The tab this belongs to, so the pill wears that tab's own colour and
  // icon rather than a palette invented here. null means it belongs to no
  // tab, which is the honest answer for a thought being kept as a thought.
  tabPath: string | null;
  // The lens to open, as a plain pathname and params the screen turns into
  // a route. Nothing here imports expo-router, so this stays loadable in node.
  open: { pathname: string; params?: Record<string, string> } | null;
};

// Each one opens a lens the app already has, so sorting is a handoff to a
// place that already exists rather than a label with nothing behind it.
// Nothing is created in that area automatically: a garden task needs a date,
// an upkeep item needs a cadence, and a bill needs a rule, none of which a
// five-word note carries. Guessing them would put figures nobody chose into
// the record, the same refusal lib/quickLog.ts makes about an amount it
// cannot resolve.
export const CAPTURE_DESTINATIONS: CaptureDestination[] = [
  {
    key: 'calendar',
    label: 'On the calendar',
    hint: 'Anything with a day attached: an appointment to book, a birthday, somewhere to be.',
    tabPath: '/schedule',
    open: { pathname: '/schedule', params: { openScheduleLens: 'appointments' } },
  },
  {
    key: 'shopping',
    label: 'To buy',
    hint: 'Something to pick up, whether or not it is food.',
    tabPath: '/life',
    open: { pathname: '/life', params: { openLifeLens: 'groceryList' } },
  },
  {
    key: 'garden',
    label: 'In the garden',
    hint: 'Sowing, watering, pruning, anything the plot needs doing to it.',
    tabPath: '/garden',
    open: { pathname: '/garden', params: { openGardenLens: 'upcomingTasks' } },
  },
  {
    key: 'upkeep',
    label: 'Upkeep',
    hint: 'Servicing, filters, registrations, anything that runs out or comes round again.',
    tabPath: '/life',
    open: { pathname: '/life', params: { openLifeLens: 'upkeep' } },
  },
  {
    key: 'money',
    label: 'Money',
    hint: 'A bill, a payment to chase, something to cancel.',
    tabPath: '/life',
    open: { pathname: '/life', params: { openLifeLens: 'finances' } },
  },
  {
    key: 'health',
    label: 'Health',
    hint: 'Something to mention at an appointment, or to keep an eye on.',
    tabPath: '/log',
    open: { pathname: '/log' },
  },
  {
    key: 'thought',
    label: 'Just a thought',
    hint: 'Worth keeping, not worth turning into a task.',
    tabPath: null,
    open: null,
  },
];

export const ALL_CAPTURE_DESTINATION_KEYS: CaptureDestinationKey[] = CAPTURE_DESTINATIONS.map((d) => d.key);

export function captureDestination(key: CaptureDestinationKey | null): CaptureDestination | null {
  if (!key) return null;
  return CAPTURE_DESTINATIONS.find((d) => d.key === key) ?? null;
}

// Long enough for a sentence someone speaks in one breath, and short enough
// that this stays a note rather than becoming a journal nobody re-reads. A
// longer thought is not refused, it is trimmed to this and the person can see
// what was kept before saving.
export const MAX_CAPTURE_LENGTH = 300;

// Everything a recognizer or a keyboard can hand over that is not the point:
// leading and trailing space, the double spaces dictation leaves behind, and
// the line breaks a soft keyboard's return key produces. The words themselves
// are never edited, corrected or capitalised: a capture that quietly rewrites
// what someone said is worse than one that keeps a typo.
export function cleanCaptureText(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_CAPTURE_LENGTH);
}

// A note has to be worth the row it takes up. One stray character from a
// pocket tap is not, and neither is an empty recognizer result.
export function isCaptureTextUsable(raw: string): boolean {
  return cleanCaptureText(raw).length >= 2;
}

// How long a note has been sitting there, said the way a person would say it.
// The point of showing this at all is that a thought waiting three weeks is
// telling you something the note itself is not.
export function describeCaptureAge(createdAt: string, now: Date): string {
  const then = new Date(createdAt);
  if (Number.isNaN(then.getTime())) return '';
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'a week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? 'a month ago' : `${months} months ago`;
}

export type CaptureInboxCounts = { waiting: number; sorted: number; done: number };

export function countCaptureNotes(notes: CaptureNote[]): CaptureInboxCounts {
  const counts: CaptureInboxCounts = { waiting: 0, sorted: 0, done: 0 };
  for (const note of notes) {
    if (note.status === 'waiting') counts.waiting += 1;
    else if (note.status === 'sorted') counts.sorted += 1;
    else if (note.status === 'done') counts.done += 1;
  }
  return counts;
}

// Sorted notes, gathered under the place they were sent to, in
// CAPTURE_DESTINATIONS' own order so the headings do not shuffle as notes
// come and go. A destination with nothing under it is left out entirely.
export function groupSortedByDestination(
  notes: CaptureNote[],
): { destination: CaptureDestination; notes: CaptureNote[] }[] {
  const groups: { destination: CaptureDestination; notes: CaptureNote[] }[] = [];
  for (const destination of CAPTURE_DESTINATIONS) {
    const members = notes.filter((note) => note.status === 'sorted' && note.destination === destination.key);
    if (members.length > 0) groups.push({ destination, notes: members });
  }
  return groups;
}

// What the Home card says without being opened. One line, and it says nothing
// at all when the inbox is empty, because an empty inbox is the normal state
// and a card announcing "0 waiting" every day is noise.
export function describeInbox(counts: CaptureInboxCounts): string {
  if (counts.waiting === 0 && counts.sorted === 0) return '';
  const parts: string[] = [];
  if (counts.waiting > 0) parts.push(`${counts.waiting} waiting to be sorted`);
  if (counts.sorted > 0) parts.push(`${counts.sorted} sorted, not done`);
  return `${parts.join(', ')}.`;
}
