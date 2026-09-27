// A plain one-off reminder (C3 of the competitive build plan, Phase 2,
// 2026-09-26). "Move the laundry in 40 minutes."
//
// Until now the only way to have the phone say something once, later, was
// to throw a note into Capture, open Reconcile and pick a day, which is three
// screens for a thought that lasts forty minutes. The Capture screen now
// offers a row of times under the box. Tapping one saves the words as a
// reminder (schedule_items, item_type 'reminder', the same row Reconcile's
// day picker writes), so it answers with Done and Snooze like any other and
// shows on Reconcile if it is left unanswered.
//
// The times are offered and never applied. Nothing is saved until a time is
// picked, which is the capture inbox's rule that the app does not choose a
// date for anybody.
//
// Pure, so scripts/test_quick_reminder.js checks it in node.

import { formatLocalDateTime } from './reconciliation';

export type QuickReminderOption = {
  key: string;
  label: string;
  /** 'YYYY-MM-DDTHH:mm', local, the form schedule_items stores. */
  scheduledFor: string;
};

/** The short ones, in minutes. Forty is the laundry. */
export const QUICK_REMINDER_MINUTES = [10, 20, 40, 60, 120];

function minutesLabel(minutes: number): string {
  if (minutes === 60) return 'In an hour';
  if (minutes % 60 === 0) return `In ${minutes / 60} hours`;
  return `In ${minutes} minutes`;
}

/**
 * The times offered under the Capture box. "This evening" only while the
 * evening is still ahead, and "Tomorrow morning" always, so late at night
 * there is still somewhere to put a thought.
 */
export function quickReminderOptions(now: Date): QuickReminderOption[] {
  const options: QuickReminderOption[] = QUICK_REMINDER_MINUTES.map((minutes) => {
    // To the minute, with the seconds dropped, so "in 10 minutes" at 3:04:50
    // lands at 3:14 rather than a moment the clock never shows.
    const at = new Date(now.getTime() + minutes * 60_000);
    at.setSeconds(0, 0);
    return { key: `in${minutes}`, label: minutesLabel(minutes), scheduledFor: formatLocalDateTime(at) };
  });
  if (now.getHours() < 18) {
    const evening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0);
    options.push({ key: 'evening', label: 'This evening', scheduledFor: formatLocalDateTime(evening) });
  }
  const morning = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0, 0);
  options.push({ key: 'morning', label: 'Tomorrow morning', scheduledFor: formatLocalDateTime(morning) });
  return options;
}

function clock(date: Date): string {
  const hour = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
  return `${hour}:${String(date.getMinutes()).padStart(2, '0')} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
}

/** What the screen says once it is saved, naming the time rather than the
 *  interval, since "in 40 minutes" stops being true the moment it is read. */
export function describeQuickReminderSet(scheduledFor: string, now: Date): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(scheduledFor);
  if (!match) return 'Saved as a reminder.';
  const at = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  const sameDay = at.toDateString() === now.toDateString();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === at.toDateString();
  const day = sameDay ? 'today' : tomorrow ? 'tomorrow' : at.toDateString();
  return `The phone will say it at ${clock(at)} ${day}. Done on the reminder marks it done, and one left unanswered waits on Reconcile.`;
}
