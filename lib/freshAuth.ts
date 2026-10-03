// Asking again before records leave the phone (R10 of docs/app-lock-spec.md).
// With App Lock on, a backup, a restore, an export, a PDF or CSV report, the
// emergency PDF and a new pairing each ask for the passcode, or the
// fingerprint or face, even when the app is already open, so a phone left
// unlocked on a table does not hand everything over in two taps. A recipe
// shared as a .is file is not asked about: it carries no health records.
//
// Without the lock this answers yes straight away, so every call site reads
// the same either way. The question itself is drawn by
// components/FreshAuthHost.tsx, mounted once in app/_layout.tsx.

import { readLockStateSync } from './appLockSession';

export type FreshAuthRequest = {
  reason: string;
  resolve: (ok: boolean) => void;
};

type Listener = (request: FreshAuthRequest | null) => void;

let listener: Listener | null = null;
let pending: FreshAuthRequest | null = null;

/** Called by FreshAuthHost; returns the function that stops listening. */
export function listenForFreshAuth(next: Listener): () => void {
  listener = next;
  if (pending) next(pending);
  return () => {
    if (listener === next) listener = null;
  };
}

/** Whether a fresh check is asked for at all: only with the lock on. */
export function freshAuthNeeded(): boolean {
  const state = readLockStateSync();
  return !!state && state.phase === 'on';
}

/**
 * Resolves true once the person has proved it is them, false when they
 * cancel. reason is one line naming what is about to happen, such as
 * "Before the backup is made".
 */
export function confirmItsYou(reason: string): Promise<boolean> {
  if (!freshAuthNeeded()) return Promise.resolve(true);
  // One question at a time: a second ask while one is showing is refused
  // rather than stacked behind it.
  if (pending) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const request: FreshAuthRequest = {
      reason,
      resolve: (ok) => {
        pending = null;
        listener?.(null);
        resolve(ok);
      },
    };
    pending = request;
    if (listener) listener(request);
    else request.resolve(false);
  });
}
