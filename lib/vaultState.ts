// The vault, whether it is on and whether it is open right now. Kept apart
// from lib/vaultSession.ts, which opens it with the code or fingerprint, so
// lib/databaseActivity.ts can ask on every read without pulling in secure
// store or the prompt. The rules themselves are in lib/vault.ts.
//
// Open lives only in this module's memory, like the App Lock key: a restart
// closes it, and so does putting the app away (lib/vaultSession.ts).

import { readLockStateSync } from './appLockSession';
import { vaultRefusal, type VaultClosedError } from './vault';

let vaultOnCache: boolean | null = null;
let vaultOpen = false;
let bypassDepth = 0;
const listeners = new Set<() => void>();

/**
 * Whether the vault is switched on. Read from the lock file once and then
 * remembered, since this is asked before every SELECT; refreshVaultOn() reads
 * it again after the setting changes. Never on while App Lock is off or
 * still moving the database, since the vault opens with the lock's code.
 */
export function isVaultOn(): boolean {
  if (vaultOnCache === null) {
    const state = readLockStateSync();
    vaultOnCache = state !== null && state.phase === 'on' && state.vault;
  }
  return vaultOnCache;
}

export function refreshVaultOn(): void {
  vaultOnCache = null;
  isVaultOn();
  notify();
}

export function isVaultOpen(): boolean {
  return vaultOpen;
}

/** True when the vault is on and closed, so its records cannot be read. */
export function isVaultClosed(): boolean {
  return isVaultOn() && !vaultOpen;
}

export function setVaultOpen(open: boolean): void {
  if (vaultOpen === open) return;
  vaultOpen = open;
  notify();
}

/**
 * Work the app does on its own at startup that reads past the vault, such
 * as building and upgrading the database, which nobody can be asked to open
 * the vault for. Never for anything a screen draws.
 */
export async function withVaultBypass<T>(work: () => Promise<T>): Promise<T> {
  bypassDepth += 1;
  try {
    return await work();
  } finally {
    bypassDepth -= 1;
  }
}

/** The refusal for a statement about to run, or null when it may run. */
export function vaultRefusalNow(sql: string): VaultClosedError | null {
  if (vaultOpen || bypassDepth > 0) return null;
  return vaultRefusal(sql, isVaultOn(), vaultOpen);
}

export function subscribeVault(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error('[vault] a listener failed', error);
    }
  }
}
