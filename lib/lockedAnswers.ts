// Reminder buttons answered while App Lock is locked (1.0.59.20).
//
// A button on a reminder has to work without a passcode; asking for one
// would make the button pointless. While locked the database cannot be
// opened, so the press is sealed to the public key in the lock file and
// added as one line to a file beside it. The locked app can add lines and
// cannot read them back: the private key is worked out from the data key,
// which only an unlock brings. On the next unlock every line is opened,
// written into the records with the time it was pressed, and the file is
// deleted (lib/reminderNotifications.ts, applyWaitingAnswers).
//
// Nothing readable sits outside the encryption: the file holds only sealed
// lines, and what a press said (which button, which reminder) is inside them.

import { File, Paths } from 'expo-file-system';
import { answerBoxKeyPair, openSealedForUnlock, sealForUnlock, serializeLockState } from './appLock';
import { heldDataKey, LOCK_FILE_NAME, readLockStateSync } from './appLockSession';
import { base64ToBytesFast, bytesToBase64Fast } from './localSeal';

const WAITING_FILE_NAME = 'reminder-answers-waiting.txt';

export type WaitingAnswer = {
  identifier: string;
  date: number;
  actionIdentifier: string;
  userText: string | null;
  data: Record<string, unknown> | null;
  pressedAt: string;
  /** 'snoozed' when the snooze was already done while locked. */
  handled: 'snoozed' | null;
};

function waitingFile(): File {
  return new File(Paths.document, WAITING_FILE_NAME);
}

async function randomBytes(count: number): Promise<Uint8Array> {
  const Crypto = await import('expo-crypto');
  return Crypto.getRandomBytesAsync(count);
}

/** Seals a press for the next unlock. False when the lock file has no key to seal to yet. */
export async function keepAnswerForUnlock(answer: WaitingAnswer): Promise<boolean> {
  const state = readLockStateSync();
  const publicKey = state?.answerBoxPublicKey ? base64ToBytesFast(state.answerBoxPublicKey) : null;
  if (!publicKey || publicKey.length !== 32) return false;
  const sealed = sealForUnlock(
    JSON.stringify(answer),
    publicKey,
    await randomBytes(32),
    await randomBytes(24),
  );
  const file = waitingFile();
  const before = file.exists ? file.textSync() : '';
  file.write(`${before}${sealed}\n`);
  return true;
}

function parseWaiting(text: string): WaitingAnswer | null {
  try {
    const raw = JSON.parse(text) as Partial<WaitingAnswer>;
    if (typeof raw.identifier !== 'string' || typeof raw.actionIdentifier !== 'string') return null;
    if (typeof raw.pressedAt !== 'string' || Number.isNaN(Date.parse(raw.pressedAt))) return null;
    return {
      identifier: raw.identifier,
      date: typeof raw.date === 'number' ? raw.date : 0,
      actionIdentifier: raw.actionIdentifier,
      userText: typeof raw.userText === 'string' ? raw.userText : null,
      data: raw.data && typeof raw.data === 'object' ? raw.data : null,
      pressedAt: raw.pressedAt,
      handled: raw.handled === 'snoozed' ? 'snoozed' : null,
    };
  } catch {
    return null;
  }
}

/**
 * With the key held: every press kept while locked, oldest first, and the
 * file deleted. Also gives a lock file from before 1.0.59.20 its public
 * key, so presses from now on are kept rather than dropped.
 */
export function takeWaitingAnswers(): WaitingAnswer[] {
  const key = heldDataKey();
  const state = readLockStateSync();
  if (!key || !state) return [];
  if (!state.answerBoxPublicKey) {
    try {
      new File(Paths.document, LOCK_FILE_NAME).write(
        serializeLockState({ ...state, answerBoxPublicKey: bytesToBase64Fast(answerBoxKeyPair(key).publicKey) }),
      );
    } catch (error) {
      console.error('[lockedAnswers] the lock file could not take its answer key', error);
    }
  }
  const file = waitingFile();
  if (!file.exists) return [];
  let text = '';
  try {
    text = file.textSync();
    file.delete();
  } catch (error) {
    console.error('[lockedAnswers] the waiting answers could not be read', error);
    return [];
  }
  const answers: WaitingAnswer[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const opened = openSealedForUnlock(line, key);
    const answer = opened ? parseWaiting(opened) : null;
    if (answer) answers.push(answer);
  }
  return answers.sort((a, b) => a.pressedAt.localeCompare(b.pressedAt));
}
