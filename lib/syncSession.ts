// Which of one person's two devices has the session, the decisions.
//
// Asked for on 2026-09-30, in place of the half-minute check and the save
// eight seconds after every edit: "Can there be a way for the two devices
// to lock who has write access so while the mobile device is in charge of
// writing, the computer version waits until the mobile device hasn't used
// the app for at least 30 minutes ... If they sit at the computer and do
// not start using their mobile device app again, the computer can take
// control because there is no active session on the phone." Then, asked
// what the waiting device should allow: "Read only with Take over now."
//
// This is step B of the sync design in CLAUDE.md (the lock with a visible
// takeover and a 30-minute lease), built on top of step A rather than in
// place of it. The three-way merge underneath (lib/snapshotMerge.ts) stays
// as the safety net for the cases a lock cannot cover: a phone with no
// signal that could not say it was in use, or a phone put away before its
// copy finished uploading.
//
// What is in the folder: one small plain note, SESSION_FILE_NAME, naming
// the device that has the session and when it was last used. It holds no
// health content, only the same device fingerprint already in the
// record's file names.
//
// How it runs (components/SnapshotSyncWatcher.tsx):
//   - A device opening or coming back to the front reads the note. The
//     other device used within SESSION_QUIET_MS means this one waits, read
//     only, with Take over now. Anything else means this device takes in
//     whatever the other one saved and claims the session.
//   - The device with the session writes the note again when it is used,
//     no more often than SESSION_TOUCH_MS, and when the app is put away.
//   - Nothing is ever told that the session ended. The waiting device
//     works it out from the time in the note, which is why the holder
//     never has to run anything half an hour after it was put down.
//
// No I/O here, so scripts/test_sync_session.js checks every decision.

import { sameDevice, type SyncDevice } from './snapshotSync';

export const SESSION_FILE_NAME = 'inside-story-session.json';

/** How long the device with the session must go unused before the other may take it. */
export const SESSION_QUIET_MS = 30 * 60 * 1000;

/** How often the device with the session writes that it is still in use. */
export const SESSION_TOUCH_MS = 5 * 60 * 1000;

/**
 * How long after the last write the device with the session saves its
 * copy. Long enough that steady work is one upload rather than dozens,
 * short enough that the copy is in the folder well before the half hour
 * is up, which matters on a computer left open and walked away from,
 * since its window never loses focus to trigger the save on leaving.
 */
export const SESSION_SAVE_QUIET_MS = 3 * 60 * 1000;

export type SessionNote = {
  version: 1;
  holder: SyncDevice;
  /** ISO 8601, when the holder claimed the session. */
  since: string;
  /** ISO 8601, the holder's clock, when it was last used. */
  lastUsedAt: string;
};

export function buildSessionNote(holder: SyncDevice, since: string, lastUsedAt: string): SessionNote {
  return { version: 1, holder: { kind: holder.kind, fingerprint: holder.fingerprint }, since, lastUsedAt };
}

/** Reads the note back, answering null for anything that is not one. */
export function parseSessionNote(text: string): SessionNote | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const note = parsed as Partial<SessionNote>;
  const holder = note.holder as Partial<SyncDevice> | undefined;
  if (note.version !== 1 || !holder) return null;
  if (holder.kind !== 'phone' && holder.kind !== 'computer') return null;
  if (typeof holder.fingerprint !== 'string' || holder.fingerprint.length === 0) return null;
  if (typeof note.since !== 'string' || typeof note.lastUsedAt !== 'string') return null;
  if (Number.isNaN(Date.parse(note.lastUsedAt))) return null;
  return buildSessionNote({ kind: holder.kind, fingerprint: holder.fingerprint }, note.since, note.lastUsedAt);
}

export type SessionPlan =
  /** This device has the session. */
  | { mode: 'mine' }
  /** Nobody has it: no note, or the holder has gone quiet. */
  | { mode: 'free' }
  /** The other device has it; this one is read only until `freeAtMs`. */
  | { mode: 'waiting'; holder: SyncDevice; lastUsedAt: string; freeAtMs: number };

/**
 * Where this device stands, from the note and this device's clock.
 *
 * The holder's time is compared with this device's clock, so the two can
 * disagree by however far apart their clocks are. Minutes either way do
 * not matter against half an hour. A time more than a half hour ahead of
 * this clock is a clock that is wrong, and a device should not be shut
 * out for hours by it, so that note counts as free.
 */
export function planSession(note: SessionNote | null, me: SyncDevice, nowMs: number): SessionPlan {
  if (!note) return { mode: 'free' };
  if (sameDevice(note.holder, me)) return { mode: 'mine' };
  const last = Date.parse(note.lastUsedAt);
  if (Number.isNaN(last)) return { mode: 'free' };
  if (last - nowMs > SESSION_QUIET_MS) return { mode: 'free' };
  const freeAtMs = last + SESSION_QUIET_MS;
  if (nowMs >= freeAtMs) return { mode: 'free' };
  return { mode: 'waiting', holder: note.holder, lastUsedAt: note.lastUsedAt, freeAtMs };
}

/** Whether the device with the session should write the note again now. */
export function shouldTouchSession(note: SessionNote | null, me: SyncDevice, nowMs: number): boolean {
  if (!note || !sameDevice(note.holder, me)) return true;
  const last = Date.parse(note.lastUsedAt);
  if (Number.isNaN(last)) return true;
  return nowMs - last >= SESSION_TOUCH_MS;
}

/** "3:40 pm", from this device's clock. */
export function formatClock(ms: number): string {
  const date = new Date(ms);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return twelve + ':' + minutes + (hours < 12 ? ' am' : ' pm');
}

function holderName(holder: SyncDevice): string {
  return holder.kind === 'phone' ? 'Your phone' : 'Your computer';
}

/** The line on the strip while this device waits. */
export function describeWaiting(plan: Extract<SessionPlan, { mode: 'waiting' }>): string {
  const last = Date.parse(plan.lastUsedAt);
  return (
    holderName(plan.holder) + ' has the session, last used at ' + formatClock(last) +
    '. You can read everything here. Changes can be made from ' + formatClock(plan.freeAtMs) + ', or take over now.'
  );
}

/** What a change tried while waiting is refused with. */
export function waitingRefusal(holder: SyncDevice): string {
  return (
    holderName(holder) + ' has the session, so nothing can be changed here yet. ' +
    'Press Take Over Now at the top of the screen to make changes here.'
  );
}
