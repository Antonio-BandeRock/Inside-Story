// Trouble that passes on its own is not said out loud until it has lasted,
// 1.0.66.9 (2026-10-10). Direct instruction, after a "Sync could not reach
// your shared folder ... OneDrive refused that (503)" notice on the phone:
// "The last thing we need is for the users to get messages that aren't a big
// deal and only serve to make them wonder what's wrong when nothing is wrong."
// And for anything else like it: "please make the same change for them."
//
// A 503 is Microsoft's server saying it is busy for a moment. Sync tries again
// by itself and nothing recorded is at risk, so saying so at once only worries
// somebody. What is worth saying is the same trouble still there an hour later,
// since by then something may need doing. So a passing kind of trouble starts a
// clock, and the notice waits until the clock passes PASSING_TROUBLE_HOLD_MS
// with no success in between. Any success stops the clock.
//
// Anything not recognised as passing is said at once, the way it always was:
// a folder that was moved, a permission never given, a sign-in that is gone.
// Those need the person, and holding them back an hour would be the bug.
//
// No I/O here, so scripts/test_passing_trouble.js can check it. Where the
// clock is kept is lib/passingTroubleClock.ts.

export const PASSING_TROUBLE_HOLD_MS = 60 * 60 * 1000;

// The sentence lib/oneDriveGraph.ts gives a status Microsoft uses for "busy,
// try later" (408, 429 and the 5xx family). Kept here so the two cannot drift.
export const ONEDRIVE_BUSY_LEAD = 'OneDrive is busy or briefly unavailable';

const PASSING_PATTERNS: readonly RegExp[] = [
  new RegExp('^' + ONEDRIVE_BUSY_LEAD),
  // No connection, or Microsoft not answering: OneDrive and the sign-in both.
  /could not be reached\. Check the connection/,
  // A refused sign-in that lib/oneDriveGraph.ts says often clears by itself.
  /sometimes on Microsoft’s side/,
];

export function isPassingTrouble(reason: string): boolean {
  return PASSING_PATTERNS.some((pattern) => pattern.test(reason));
}

export type TroubleDecision =
  | { speak: false; since: number }
  | { speak: true; since: number | null; sentence: string };

/**
 * What to do with one failure. `since` is when the current run of passing
 * trouble began, or null when there is none. The answer carries the `since`
 * to keep: a passing failure keeps or starts the clock, any other failure
 * leaves it as it was.
 */
export function decideTrouble(since: number | null, reason: string, now: number): TroubleDecision {
  if (!isPassingTrouble(reason)) return { speak: true, since, sentence: reason };
  const began = since ?? now;
  if (now - began < PASSING_TROUBLE_HOLD_MS) return { speak: false, since: began };
  return { speak: true, since: began, sentence: 'This has been going on for more than an hour. ' + reason };
}
