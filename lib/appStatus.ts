// The status page in Profile, and the answer to "why did that reminder not
// come?" (Phase A of the 2026-09-24 gap review).
//
// Everything a person would otherwise have to find in five places: which
// version is running, which reference data it is scoring against, whether
// the last backup was checked, whether sync is working, and whether
// reminders can arrive at all. Each line says plainly what is true, and a
// line that needs doing something about says what to do.
//
// The reminder half cannot say why ONE reminder did not arrive, since the
// phone keeps no record of what it showed. What it can say is every reason
// this app knows of that stops reminders in general, in the order worth
// checking, plus what is queued right now, so a person can see whether the
// thing they expected is on the list.
//
// Imports nothing, so scripts/test_phase_a_trust.js can load it.

export type StatusTone = 'ok' | 'attention' | 'info';

export type StatusLine = {
  label: string;
  value: string;
  tone: StatusTone;
};

export type ReminderFacts = {
  /** False on a computer, where reminders are timers that only run while the app is open. */
  phone: boolean;
  permission: boolean;
  /** Labels of the reminder kinds switched off in Profile > Reminders. */
  kindsOff: string[];
  /** "10:00 PM to 7:00 AM", or null when quiet hours are off. */
  quietWindow: string | null;
  queued: number;
  maxQueued: number;
  lookaheadDays: number;
  /** Android 12 or later, where exact alarms need a separate allowance. */
  exactAlarmsAsked: boolean;
};

export function reminderStatusLine(facts: ReminderFacts): StatusLine {
  if (!facts.phone) {
    return {
      label: 'Reminders',
      value: 'On a computer, a reminder only appears while the app is open.',
      tone: 'info',
    };
  }
  if (!facts.permission) {
    return { label: 'Reminders', value: 'Notifications are turned off for Inside Story.', tone: 'attention' };
  }
  return {
    label: 'Reminders',
    value: facts.queued === 1 ? '1 reminder queued.' : `${facts.queued} reminders queued.`,
    tone: 'ok',
  };
}

// Every reason, in the order worth checking: the ones that stop everything
// first, then the ones that stop some, then the ones that make a reminder
// late rather than missing.
export function reminderDiagnosis(facts: ReminderFacts): string[] {
  const reasons: string[] = [];
  if (!facts.phone) {
    reasons.push(
      'This is the computer. A reminder here is a timer inside the app, so it only appears while the app is open. ' +
        'The phone is where reminders arrive with the app closed.',
    );
    return reasons;
  }
  if (!facts.permission) {
    reasons.push(
      'Notifications are turned off for Inside Story in the phone settings, so nothing can arrive. ' +
        'Turning them back on there, then opening this app once, queues everything again.',
    );
  }
  if (facts.kindsOff.length > 0) {
    reasons.push(`These kinds are switched off in Profile > Reminders: ${facts.kindsOff.join(', ')}.`);
  }
  if (facts.quietWindow) {
    reasons.push(
      `Quiet hours are on, ${facts.quietWindow}. A reminder due then arrives when they end, and a repeat due then is skipped. ` +
        'Doses and appointments are never held.',
    );
  }
  if (facts.permission && facts.queued >= facts.maxQueued) {
    reasons.push(
      `The phone holds ${facts.maxQueued} reminders from one app at a time, and that many are queued. ` +
        'Later ones join the queue as earlier ones arrive, each time the app is opened.',
    );
  }
  reasons.push(
    `Reminders are queued ${facts.lookaheadDays} days ahead, each time the app is opened. ` +
      `If the app has not been opened for longer than that, anything past the first ${facts.lookaheadDays} days was never queued.`,
  );
  reasons.push(
    'A reminder is queued from the time saved on the thing itself, so a dose or meal with no time, ' +
      'or one changed on another device that has not synced yet, has nothing to queue.',
  );
  if (facts.exactAlarmsAsked) {
    reasons.push(
      'If reminders arrive late rather than not at all: on Android 12 and later, allow Alarms & reminders ' +
        'for Inside Story in the phone settings, and set its battery use to Unrestricted. ' +
        'Without those, Android may hold a reminder back while the phone is saving battery.',
    );
  }
  return reasons;
}

export type SyncFacts = {
  enabled: boolean;
  lastSavedAt: string | null;
  lastLoadedAt: string | null;
  lastProblem: string | null;
};

export function syncStatusLine(facts: SyncFacts, describe: (iso: string) => string): StatusLine {
  if (!facts.enabled) {
    return { label: 'Sync between your devices', value: 'Off.', tone: 'info' };
  }
  if (facts.lastProblem) {
    return { label: 'Sync between your devices', value: `On, with a problem: ${facts.lastProblem}`, tone: 'attention' };
  }
  const parts: string[] = [];
  if (facts.lastSavedAt) parts.push(`saved from here ${describe(facts.lastSavedAt)}`);
  if (facts.lastLoadedAt) parts.push(`brought in from the other device ${describe(facts.lastLoadedAt)}`);
  return {
    label: 'Sync between your devices',
    value: parts.length > 0 ? `On, last ${parts.join(', and last ')}.` : 'On, and nothing has been saved yet.',
    tone: 'ok',
  };
}

// Whether the reference database on this device is the one this build
// ships with. A mismatch is normal for the moment after an update and
// settles on the next start, so it is said rather than raised.
export function referenceStatusLine(bundled: string, installed: string | null, dateOf: (v: string) => string): StatusLine {
  if (installed === bundled) {
    return { label: 'Food reference data', value: `Dated ${dateOf(bundled)} (build ${bundled}).`, tone: 'ok' };
  }
  return {
    label: 'Food reference data',
    value:
      `This version ships data dated ${dateOf(bundled)}, and ` +
      (installed ? `the copy on this device is dated ${dateOf(installed)}.` : 'no copy has been recorded on this device yet.') +
      ' It is brought up to date the next time the app starts.',
    tone: 'info',
  };
}
