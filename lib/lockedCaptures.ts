// Notes and photos taken over the phone's lock screen (1.0.62.1).
//
// Direct request, 2026-10-05: "You'd pull down the tile or tap a button on a
// notification you keep in the shade, enter your Inside Story code, speak,
// and it saves. The phone stays locked the whole time." And for the camera:
// "Taken while the phone is locked, it would be sealed the same way, so the
// photo can't be looked at until you unlock."
//
// The capture screen over the lock screen (components/LockedCaptureScreen.tsx)
// cannot open the database and asks for no code (2026-10-07: one step, never
// unlocking the phone or the app). What was said or photographed is
// sealed to the same public key reminder presses use (lib/lockedAnswers.ts)
// and kept as one file per capture in a folder beside the lock file. The
// locked app can add files and cannot read them back. The next time Inside
// Story is open and unlocked, every file is opened, written into Capture as a
// spoken or photo note with the time it was taken, and deleted.
//
// Nothing readable sits outside the encryption: the folder holds only sealed
// files, named by when they were taken, and the photo's plain copies the
// camera and the shrinking made are deleted before the screen says Saved.

import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { openSealedForUnlock, sealForUnlock } from './appLock';
import { heldDataKey, readLockStateSync } from './appLockSession';
import { base64ToBytesFast, bytesToBase64Fast } from './localSeal';

const FOLDER_NAME = 'locked-captures';
const SEALED_SUFFIX = '.sealed';
// Turning the lock off opens every sealed capture into one of these, since
// the key that opens them is thrown away with the lock (the same reasoning
// as lockedAnswers.ts's UNSEALED_FILE_NAME).
const OPENED_SUFFIX = '.opened.json';

// Set while the capture screen over the lock screen is up. It runs in the
// same JavaScript as the app, so the app sees itself become active when that
// screen opens; the lock gate reads this so it does not take that for the
// person coming back (components/AppLockGate.tsx).
let captureScreenShowing = false;

export function setLockedCaptureShowing(showing: boolean): void {
  captureScreenShowing = showing;
}

export function isLockedCaptureShowing(): boolean {
  return captureScreenShowing;
}


export type LockedCapture = {
  kind: 'spoken' | 'photo';
  text: string;
  takenAt: string;
  /** JPEG bytes in base64, for a photo. */
  photo: string | null;
  width: number;
  height: number;
};

function folder(): Directory {
  return new Directory(Paths.document, FOLDER_NAME);
}

async function randomBytes(count: number): Promise<Uint8Array> {
  const Crypto = await import('expo-crypto');
  return Crypto.getRandomBytesAsync(count);
}

/** Whether a capture can be sealed now: the lock is on and its file has the key to seal to. */
export function canSealCaptures(): boolean {
  const state = readLockStateSync();
  const publicKey = state?.answerBoxPublicKey ? base64ToBytesFast(state.answerBoxPublicKey) : null;
  return publicKey !== null && publicKey.length === 32;
}

/** Seals one capture for the next unlock. False when there is no key to seal to. */
export async function keepCaptureForUnlock(capture: LockedCapture): Promise<boolean> {
  const state = readLockStateSync();
  const publicKey = state?.answerBoxPublicKey ? base64ToBytesFast(state.answerBoxPublicKey) : null;
  if (!publicKey || publicKey.length !== 32) return false;
  const sealed = sealForUnlock(JSON.stringify(capture), publicKey, await randomBytes(32), await randomBytes(24));
  const dir = folder();
  dir.create({ intermediates: true, idempotent: true });
  const name = `${Date.parse(capture.takenAt) || Date.now()}-${bytesToBase64Fast(await randomBytes(6)).replace(/[^A-Za-z0-9]/g, '')}`;
  new File(dir, `${name}${SEALED_SUFFIX}`).write(sealed);
  return true;
}

/** Reads a photo the capture screen made into base64, ready to seal. */
export function photoFileToBase64(uri: string): string {
  return bytesToBase64Fast(new File(uri).bytesSync());
}

function parseCapture(text: string): LockedCapture | null {
  try {
    const raw = JSON.parse(text) as Partial<LockedCapture>;
    if (raw.kind !== 'spoken' && raw.kind !== 'photo') return null;
    if (typeof raw.text !== 'string') return null;
    if (typeof raw.takenAt !== 'string' || Number.isNaN(Date.parse(raw.takenAt))) return null;
    return {
      kind: raw.kind,
      text: raw.text,
      takenAt: raw.takenAt,
      photo: typeof raw.photo === 'string' ? raw.photo : null,
      width: typeof raw.width === 'number' ? raw.width : 0,
      height: typeof raw.height === 'number' ? raw.height : 0,
    };
  } catch {
    return null;
  }
}

function captureFiles(suffix: string): File[] {
  const dir = folder();
  if (!dir.exists) return [];
  return dir
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith(suffix))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type Opened = { capture: LockedCapture; file: File };

/**
 * With the key held, or with the lock turned off since: every capture kept
 * while locked, oldest first. A file is deleted only once its capture is
 * written (writeLockedCaptures), so a failure leaves it for next time.
 */
function openWaitingCaptures(): Opened[] {
  const state = readLockStateSync();
  const key = heldDataKey();
  const out: Opened[] = [];
  if (state && key) {
    for (const file of captureFiles(SEALED_SUFFIX)) {
      try {
        const opened = openSealedForUnlock(file.textSync(), key);
        const capture = opened ? parseCapture(opened) : null;
        if (capture) out.push({ capture, file });
        // A file sealed to a lock since replaced can never be opened; it
        // goes rather than being tried on every start.
        else file.delete();
      } catch (error) {
        console.error('[lockedCaptures] a kept capture could not be read', error);
      }
    }
  }
  if (!state) {
    for (const file of captureFiles(OPENED_SUFFIX)) {
      try {
        const capture = parseCapture(file.textSync());
        if (capture) out.push({ capture, file });
        else file.delete();
      } catch (error) {
        console.error('[lockedCaptures] an opened capture could not be read', error);
      }
    }
  }
  return out.sort((a, b) => a.capture.takenAt.localeCompare(b.capture.takenAt));
}

let writing: Promise<number> | null = null;

/**
 * Writes every waiting capture into the Capture inbox. Safe to call on every
 * start and every return to the app: with nothing waiting it reads one
 * folder listing. Answers how many were written.
 */
export function writeLockedCaptures(): Promise<number> {
  if (!writing) {
    writing = writeNow().finally(() => {
      writing = null;
    });
  }
  return writing;
}

async function writeNow(): Promise<number> {
  // Only an Android phone has a lock screen to capture over.
  if (Platform.OS !== 'android') return 0;
  const waiting = openWaitingCaptures();
  if (waiting.length === 0) return 0;
  const [{ createCaptureNote, deleteCaptureNote }, { keepPhoto }, { withSessionGuardLifted }, { localDayOf }] = await Promise.all([
    import('./captureNotesDb'),
    import('./mediaDb'),
    import('./databaseActivity'),
    import('./dayTimeline'),
  ]);
  let written = 0;
  for (const { capture, file } of waiting) {
    try {
      const takenAt = new Date(capture.takenAt);
      await withSessionGuardLifted(async () => {
        const id = await createCaptureNote(capture.text, capture.kind, takenAt);
        if (id && capture.kind === 'photo' && capture.photo) {
          const bytes = base64ToBytesFast(capture.photo);
          if (bytes) {
            const plain = new File(Paths.cache, `locked-capture-${id}.jpg`);
            plain.write(bytes);
            const kept = await keepPhoto(plain.uri, capture.width, capture.height, { kind: 'capture_note', id }, {
              takenOn: localDayOf(takenAt.getTime()),
              deleteSource: true,
            });
            if (plain.exists) plain.delete();
            // A note without its photo would be the words "A photo" and
            // nothing else: take the note back and leave the sealed file
            // for the next start to try again.
            if (kept.status !== 'added') {
              await deleteCaptureNote(id);
              throw new Error(kept.status === 'error' ? kept.message : `the photo was ${kept.status}`);
            }
          }
        }
      });
      file.delete();
      written += 1;
    } catch (error) {
      console.error('[lockedCaptures] a kept capture could not be written', error);
    }
  }
  return written;
}

/**
 * Turning the lock off: every sealed capture opened with the key and kept as
 * a plain file for the next start, which writes them as an unlock would.
 */
export function unsealLockedCapturesForTurnOff(key: Uint8Array): void {
  for (const file of captureFiles(SEALED_SUFFIX)) {
    try {
      const opened = openSealedForUnlock(file.textSync(), key);
      if (opened && parseCapture(opened)) {
        new File(folder(), file.name.replace(SEALED_SUFFIX, OPENED_SUFFIX)).write(opened);
      }
      file.delete();
    } catch (error) {
      console.error('[lockedCaptures] a kept capture could not be opened for turning the lock off', error);
    }
  }
}
