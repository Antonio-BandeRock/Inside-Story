// Quiet hours and snooze, the arithmetic (Phase A of the 2026-09-24 gap
// review).
//
// Nudging, meals, drinks and dated reminders together can put a dozen
// notifications into a day, and the one thing that gets an app's
// notifications switched off altogether is one arriving at night. Once
// they are switched off the dose reminders go with them, which is the
// outcome all of this exists to avoid. So quiet hours hold reminders back
// rather than dropping them:
//
//   - A first-time reminder that falls inside quiet hours arrives when
//     they end, and says what time it was for.
//   - A follow-up (a nudge, or another day of an overdue item) that falls
//     inside them is dropped, since arriving together at the end of the
//     night would be exactly the pile quiet hours are meant to stop.
//   - Doses and appointments are never held. The time of a dose is part
//     of the dose, and an appointment reminder that arrives late is no
//     reminder at all. Somebody who does not want to hear about a dose at
//     night can move the dose, which is the prescriber's and theirs to
//     decide, not a notification setting's.
//
// Snooze is a button on the notification itself: the same reminder again
// in SNOOZE_MINUTES, once.
//
// Imports nothing, so scripts/test_phase_a_trust.js can load it.

export type QuietHours = {
  /** "HH:MM", 24-hour, local time. */
  start: string;
  /** "HH:MM"; earlier than start means the window runs past midnight. */
  end: string;
};

export const DEFAULT_QUIET_HOURS: QuietHours = { start: '22:00', end: '07:00' };

/** Kinds quiet hours never hold back. */
export const NEVER_HELD_KINDS: readonly string[] = ['dose', 'appointment'];

export const SNOOZE_MINUTES = 15;

function minutesOf(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function isValidQuietHours(quiet: QuietHours | null | undefined): quiet is QuietHours {
  if (!quiet) return false;
  const start = minutesOf(quiet.start);
  const end = minutesOf(quiet.end);
  return start !== null && end !== null && start !== end;
}

/**
 * When a reminder due at `at` may arrive: `at` itself outside quiet hours,
 * otherwise the moment they end. Local time throughout, so a window that
 * runs past midnight ends on the next calendar day.
 */
export function endOfQuiet(at: Date, quiet: QuietHours): Date | null {
  const start = minutesOf(quiet.start);
  const end = minutesOf(quiet.end);
  if (start === null || end === null || start === end) return null;
  const now = at.getHours() * 60 + at.getMinutes();
  const crossesMidnight = start > end;
  const inside = crossesMidnight ? now >= start || now < end : now >= start && now < end;
  if (!inside) return null;
  const release = new Date(at);
  release.setHours(Math.floor(end / 60), end % 60, 0, 0);
  // Past midnight's start: the window ends tomorrow morning.
  if (crossesMidnight && now >= start) release.setDate(release.getDate() + 1);
  return release;
}

export type QuietDecision = { action: 'keep' } | { action: 'hold'; until: Date } | { action: 'drop' };

/** What quiet hours do to one reminder. */
export function quietDecision(
  kind: string,
  fireAt: Date,
  isFollowUp: boolean,
  quiet: QuietHours | null | undefined,
): QuietDecision {
  if (!isValidQuietHours(quiet) || NEVER_HELD_KINDS.includes(kind)) return { action: 'keep' };
  const until = endOfQuiet(fireAt, quiet);
  if (!until) return { action: 'keep' };
  return isFollowUp ? { action: 'drop' } : { action: 'hold', until };
}

/** Half-hour steps for the two pickers, value "HH:MM", label "10:30 PM". */
export function quietTimeOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const value = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    options.push({ label: hour12 + ':' + String(minute).padStart(2, '0') + (hour >= 12 ? ' PM' : ' AM'), value });
  }
  return options;
}
