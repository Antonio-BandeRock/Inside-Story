// What a wake-up from the relay looks like, and when a phone should tell the
// relay where to send one (M1, 1.0.62.2). Pure, with no Expo in it, so
// scripts/test_relay_wake.js can check it in plain node.
//
// The relay at lifestead.ghostead.com (insidestoryapp.com until 2026-10-09) holds sealed mail between linked people.
// Since M1 it also asks Google to wake the recipient's phone when mail lands,
// with a message that carries nothing but RELAY_WAKE_KIND: no sender, no size,
// nothing from the mail. docs/app-links/src/index.js sends it and has to use
// the same word.

/** The one thing a wake-up says. The Worker's WAKE_KIND, byte for byte. */
export const RELAY_WAKE_KIND = 'inside-story-mail';

/**
 * Whether something expo-notifications handed over is a relay wake-up.
 *
 * Searched for rather than read from one field, because the same message
 * reaches the app in three shapes (a background task payload, a foreground
 * notification, a start the message caused), each nesting the data
 * differently. The word is specific enough that nothing else carries it.
 */
export function isRelayWake(value: unknown): boolean {
  try {
    const text = JSON.stringify(value);
    return typeof text === 'string' && text.includes(RELAY_WAKE_KIND);
  } catch {
    return false;
  }
}

/** What this phone last told the relay, kept in a plain file on this device. */
export type WakeRegistration = {
  mailbox: string;
  token: string;
  registeredAt: string;
};

/**
 * Google can retire an address without saying so to an app that is not
 * running, so a registration is repeated after this long even when nothing
 * has changed. A week costs one request a week.
 */
export const REREGISTER_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type WakePlan = 'register' | 'forget' | 'nothing';

/**
 * Whether to tell the relay something now.
 *
 * Only a phone that has somebody to hear from leaves an address: a person
 * linked to nobody has no reason to be woken, and the relay then knows
 * nothing about their phone at all. Linking to somebody registers; the last
 * link going forgets.
 */
export function planWakeRegistration(input: {
  hasSomebody: boolean;
  mailbox: string | null;
  token: string | null;
  kept: WakeRegistration | null;
  now: number;
}): WakePlan {
  const { hasSomebody, mailbox, token, kept, now } = input;
  if (!hasSomebody) return kept ? 'forget' : 'nothing';
  // No address this run (Google unreachable, no Play services): what the
  // relay already holds may still be right, so it is left alone.
  if (!mailbox || !token) return 'nothing';
  if (!kept) return 'register';
  if (kept.mailbox !== mailbox || kept.token !== token) return 'register';
  const at = Date.parse(kept.registeredAt);
  if (Number.isNaN(at) || now - at >= REREGISTER_AFTER_MS || at > now) return 'register';
  return 'nothing';
}

export function parseWakeRegistration(text: string): WakeRegistration | null {
  try {
    const raw = JSON.parse(text) as Partial<WakeRegistration>;
    if (typeof raw.mailbox !== 'string' || typeof raw.token !== 'string' || typeof raw.registeredAt !== 'string') {
      return null;
    }
    return { mailbox: raw.mailbox, token: raw.token, registeredAt: raw.registeredAt };
  } catch {
    return null;
  }
}
