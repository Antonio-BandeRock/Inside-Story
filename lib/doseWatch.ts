// A16: somebody you are linked with sees when a dose of yours goes
// unmarked. Everything here is pure: the part that travels, reading it back
// on arrival, when an alert fires, and every sentence. Reading and writing
// the records and the notifications is in lib/peerDosesDb.ts.
//
// WHAT CROSSES. For each dose in a window around now: the med's name, the
// moment it was due, and whether it was marked taken or skipped. Never the
// amount, the notes, the reason for a skip or anything else about the med,
// and nothing at all unless the person whose doses they are turned on
// "When a dose is not marked" for that link and said yes on their phone.
//
// WHAT IT CAN SAY. This phone hears about a dose only when the other phone
// sends an update, so every sentence names when that last happened. A dose
// not marked by then is "not marked when their phone last sent an update",
// never "missed", and an update from before the dose was due says this phone
// cannot tell. Nothing here says whether to take a med or what to do about
// one that was not taken; that is between the person and their prescriber.

export type PeerDoseMark = 'taken' | 'skipped' | 'unmarked';

export type PeerDose = {
  /** The schedule row's id on their phone, so an alert is not repeated. */
  id: string;
  /** The med's name as they wrote it. */
  name: string;
  /** When it was due, as an instant (ISO, UTC), so a zone difference cannot move it. */
  dueAt: string;
  mark: PeerDoseMark;
  /** When it was marked, as an instant, when it was. */
  markedAt: string | null;
};

export type PeerDosePart = { items: PeerDose[] };

/** How far back and ahead the doses sent reach, in hours. */
export const DOSE_WATCH_BACK_HOURS = 36;
export const DOSE_WATCH_AHEAD_HOURS = 24;
/** How long after a dose is due before an unmarked one is said, in minutes. */
export const DOSE_WATCH_GRACE_MINUTES = 120;
/** An alert that would have fired longer ago than this is not raised late. */
export const DOSE_WATCH_LATE_LIMIT_HOURS = 12;
/** The most doses one update carries. */
export const DOSE_WATCH_MAX_ITEMS = 80;
/** Identifiers of these notifications, apart from lib/reminderNotifications.ts's own. */
export const PEER_DOSE_PREFIX = 'inside-story-peer-dose:';

const HOUR_MS = 60 * 60_000;

export function peerDoseMark(status: string | null | undefined): PeerDoseMark {
  if (status === 'logged' || status === 'partial' || status === 'replaced') return 'taken';
  if (status === 'skipped') return 'skipped';
  return 'unmarked';
}

function isInstant(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

/**
 * The doses to send, from this phone's schedule. Each row's due moment has
 * already been worked out as an instant by the caller (lib/peerDosesDb.ts,
 * which knows the home time zone for a med kept on home time).
 */
export function peerDoseItems(
  rows: { id: string; name: string; dueAtMs: number | null; status: string | null; markedAt: string | null }[],
  nowMs: number,
): PeerDose[] {
  const from = nowMs - DOSE_WATCH_BACK_HOURS * HOUR_MS;
  const to = nowMs + DOSE_WATCH_AHEAD_HOURS * HOUR_MS;
  return rows
    .filter((row) => row.dueAtMs !== null && Number.isFinite(row.dueAtMs) && row.dueAtMs >= from && row.dueAtMs <= to)
    .sort((a, b) => (a.dueAtMs as number) - (b.dueAtMs as number))
    .slice(0, DOSE_WATCH_MAX_ITEMS)
    .map((row) => {
      const mark = peerDoseMark(row.status);
      return {
        id: row.id,
        name: row.name.trim() || 'A med',
        dueAt: new Date(row.dueAtMs as number).toISOString(),
        mark,
        markedAt: mark !== 'unmarked' && isInstant(row.markedAt) ? new Date(row.markedAt).toISOString() : null,
      };
    });
}

/**
 * Reads the part back on arrival. Undefined when it was not sent at all (an
 * older phone, or a link that never carried it), null when the other person
 * has turned it off, which clears what this phone held.
 */
export function cleanPeerDosePart(value: unknown): PeerDosePart | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = (value as { items?: unknown }).items;
  if (!Array.isArray(raw)) return undefined;
  const items: PeerDose[] = [];
  const seen = new Set<string>();
  for (const entry of raw.slice(0, DOSE_WATCH_MAX_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue;
    const dose = entry as Record<string, unknown>;
    if (typeof dose.id !== 'string' || !dose.id.trim() || dose.id.length > 120 || seen.has(dose.id)) continue;
    if (typeof dose.name !== 'string' || !isInstant(dose.dueAt)) continue;
    const mark: PeerDoseMark = dose.mark === 'taken' || dose.mark === 'skipped' ? dose.mark : 'unmarked';
    seen.add(dose.id);
    items.push({
      id: dose.id,
      name: dose.name.trim().slice(0, 120) || 'A med',
      dueAt: new Date(dose.dueAt).toISOString(),
      mark,
      markedAt: mark !== 'unmarked' && isInstant(dose.markedAt) ? new Date(dose.markedAt).toISOString() : null,
    });
  }
  return { items };
}

/** Where one dose stands, as this phone last heard. */
export type WatchState = 'taken' | 'skipped' | 'comingUp' | 'due' | 'notMarked';

export function watchState(dose: PeerDose, nowMs: number): WatchState {
  if (dose.mark === 'taken') return 'taken';
  if (dose.mark === 'skipped') return 'skipped';
  const due = Date.parse(dose.dueAt);
  if (due > nowMs) return 'comingUp';
  if (nowMs < due + DOSE_WATCH_GRACE_MINUTES * 60_000) return 'due';
  return 'notMarked';
}

export type DoseAlertPlan = {
  /** Alerts to raise, each at its moment (now or later). */
  schedule: { doseId: string; fireAtMs: number }[];
  /** Pending alerts to take back: marked since, gone from the window, or alerts turned off. */
  cancel: string[];
};

/**
 * What to raise and what to take back after an update arrives, or after
 * alerts are turned on or off. `alerted` is every alert this phone has
 * already raised or queued for this person, by dose, with its moment.
 */
export function planDoseAlerts(input: {
  doses: readonly PeerDose[];
  nowMs: number;
  alerted: ReadonlyMap<string, number>;
  enabled: boolean;
}): DoseAlertPlan {
  const schedule: DoseAlertPlan['schedule'] = [];
  const cancel: string[] = [];
  const present = new Set(input.doses.map((dose) => dose.id));
  for (const [doseId, fireAtMs] of input.alerted) {
    // Queued and not yet raised, for a dose no longer in what was sent.
    if (!present.has(doseId) && fireAtMs > input.nowMs) cancel.push(doseId);
  }
  for (const dose of input.doses) {
    const queued = input.alerted.get(dose.id);
    const pending = queued !== undefined && queued > input.nowMs;
    if (!input.enabled || dose.mark !== 'unmarked') {
      if (pending) cancel.push(dose.id);
      continue;
    }
    // Raised already: said once, never again for the same dose.
    if (queued !== undefined && !pending) continue;
    const fireAtMs = Date.parse(dose.dueAt) + DOSE_WATCH_GRACE_MINUTES * 60_000;
    if (fireAtMs > input.nowMs) {
      schedule.push({ doseId: dose.id, fireAtMs });
    } else if (input.nowMs - fireAtMs <= DOSE_WATCH_LATE_LIMIT_HOURS * HOUR_MS) {
      schedule.push({ doseId: dose.id, fireAtMs: input.nowMs });
    }
  }
  return { schedule, cancel };
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "7:00 AM", with the day in front when it is not the day of `nowMs`. */
export function clockWords(ms: number, nowMs: number): string {
  const at = new Date(ms);
  const hour = at.getHours();
  const time = `${hour % 12 === 0 ? 12 : hour % 12}:${String(at.getMinutes()).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  const now = new Date(nowMs);
  if (at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth() && at.getDate() === now.getDate()) return time;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (at.getFullYear() === yesterday.getFullYear() && at.getMonth() === yesterday.getMonth() && at.getDate() === yesterday.getDate()) {
    return `yesterday ${time}`;
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (at.getFullYear() === tomorrow.getFullYear() && at.getMonth() === tomorrow.getMonth() && at.getDate() === tomorrow.getDate()) {
    return `tomorrow ${time}`;
  }
  return `${at.getDate()} ${MONTHS[at.getMonth()]}, ${time}`;
}

function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}’` : `${name}’s`;
}

export function alertTitle(personName: string, dose: PeerDose): string {
  return `${personName}: ${dose.name} not marked`;
}

/** The alert's words, fixed when it is queued, so they say what was known then. */
export function alertBody(personName: string, dose: PeerDose, sentAt: string, nowMs: number): string {
  const due = Date.parse(dose.dueAt);
  const sent = Date.parse(sentAt);
  const dueWords = `Due at ${clockWords(due, nowMs)}.`;
  if (Number.isNaN(sent)) {
    return `${dueWords} This phone has no word from ${possessive(personName)} phone about it yet.`;
  }
  if (sent < due) {
    return `${dueWords} The last update from ${possessive(personName)} phone came at ${clockWords(sent, nowMs)}, before it was due, so this phone cannot tell whether it has been marked since.`;
  }
  return `${dueWords} When ${possessive(personName)} phone last sent an update, at ${clockWords(sent, nowMs)}, it had not been marked taken or skipped.`;
}

/** One dose on the watcher's band. */
export function watchRowLine(dose: PeerDose, nowMs: number): string {
  const due = clockWords(Date.parse(dose.dueAt), nowMs);
  switch (watchState(dose, nowMs)) {
    case 'taken':
      return dose.markedAt ? `Due ${due}. Marked taken at ${clockWords(Date.parse(dose.markedAt), nowMs)}.` : `Due ${due}. Marked taken.`;
    case 'skipped':
      return dose.markedAt ? `Due ${due}. Marked skipped at ${clockWords(Date.parse(dose.markedAt), nowMs)}.` : `Due ${due}. Marked skipped.`;
    case 'comingUp':
      return `Due ${due}.`;
    case 'due':
      return `Due ${due}. Not marked yet.`;
    case 'notMarked':
      return `Due ${due}. Not marked when their phone last sent an update.`;
  }
}

export function lastUpdateLine(personName: string, sentAt: string, nowMs: number): string {
  const sent = Date.parse(sentAt);
  if (Number.isNaN(sent)) return `Nothing has arrived from ${possessive(personName)} phone yet.`;
  return `Last update from ${possessive(personName)} phone: ${clockWords(sent, nowMs)}.`;
}

export const DOSE_WATCH_LIMIT =
  'This phone hears about a dose only when their phone sends an update, so a dose marked since then may not show here yet, and an alert can come after it was marked. Marking a dose is the only thing counted: nothing here knows whether a med was swallowed. Whether and when to take a med is between them and the prescriber.';

export const DOSE_WATCH_EMPTY = 'Nobody has shared their doses with you. Somebody turns this on for you in Connections, on their phone.';

// ---------------------------------------------------------------------------
// Saying yes (the consent step from the Caregiver tier)
// ---------------------------------------------------------------------------

export type DoseConsentKind = 'self' | 'attested';

export const DOSE_CONSENT_TITLE = 'Let them know when a dose is not marked?';

export function doseConsentMessage(personName: string): string {
  return `${personName} will see the name of each med on your schedule, when it was due, and whether it was marked taken or skipped, for the day and a half before and the day after, every time this phone sends them an update. Their phone raises an alert when a dose has not been marked two hours after it was due. Amounts, notes and everything else about your meds stay here. You can turn this off at any time.`;
}

export const DOSE_CONSENT_CHOICES: { kind: DoseConsentKind; label: string }[] = [
  { kind: 'self', label: 'This is my phone and I agree' },
  {
    kind: 'attested',
    label: 'I am setting this up for the person this phone belongs to, who cannot decide this themselves, and I have the right to act for them',
  },
];

export function consentLine(kind: DoseConsentKind, givenAt: string, nowMs: number): string {
  const when = clockWords(Date.parse(givenAt), nowMs);
  return kind === 'self'
    ? `Agreed on this phone by the person it belongs to, ${when}.`
    : `Set up on this phone by somebody acting for the person it belongs to, who stated they have the right to, ${when}.`;
}
