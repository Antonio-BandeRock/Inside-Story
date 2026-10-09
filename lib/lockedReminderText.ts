// What a reminder says while App Lock is set up (1.0.60.6, R9 of
// docs/app-lock-spec.md). A reminder's words are handed to the phone when it
// is queued, which happens while the app is open, and the phone shows them on
// the lock screen to anybody holding it. So with the lock set up a reminder
// names only what kind of thing it is, never the medicine, the meal or the
// note, unless the person chose full detail in Profile > App Lock.
//
// Pure, so scripts/test_app_lock_followups.js can check it without a phone.

import { waitingGroupFor } from './waitingAnswers';

export const PRIVATE_REMINDER_BODY = 'Details are hidden while App Lock is on.';

/** The one line a reminder of this kind shows while its details are hidden. */
export function privateReminderTitle(kind: string): string {
  if (kind === 'appointment') return 'An appointment is coming up';
  if (kind === 'refill') return 'A refill is coming up';
  if (kind === 'peerDose') return 'A dose reminder for somebody you look out for';
  if (kind === 'recall') return 'A recall notice may concern you';
  switch (waitingGroupFor(kind)) {
    case 'morning':
      return 'A morning question is waiting';
    case 'dose':
      return 'Time for your scheduled dose';
    case 'meal':
      return 'Time for a planned meal';
    case 'water':
      return 'Time for a drink of water';
    case 'checkin':
      return 'A quick check-in is waiting';
    case 'todo':
      return 'Something you asked to be reminded of is due';
    case 'garden':
      return 'A garden task is due';
    case 'upkeep':
      return 'An upkeep task is due';
    default:
      return 'A reminder from Lifestead is due';
  }
}

/**
 * The words to hand the phone. hide is true when the lock is set up and the
 * person has not chosen full detail.
 */
export function reminderWords(
  kind: string,
  title: string,
  body: string,
  hide: boolean,
): { title: string; body: string } {
  // The morning question names nothing personal, and hiding it would leave
  // its sleep and energy buttons answering a question nobody can see.
  if (!hide || kind === 'morning') return { title, body };
  return { title: privateReminderTitle(kind), body: PRIVATE_REMINDER_BODY };
}
