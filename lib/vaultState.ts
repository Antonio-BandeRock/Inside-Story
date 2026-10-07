// The vault, what is in it and whether it is open right now. Kept apart
// from lib/vaultSession.ts, which opens it with a code or fingerprint, so
// lib/databaseActivity.ts can ask on every read without pulling in secure
// store or the prompt. The rules themselves are in lib/vault.ts.
//
// Open lives only in this module's memory, like the App Lock key: a restart
// closes it, and so does putting the app away (lib/vaultSession.ts).

import { readLockStateSync } from './appLockSession';
import {
  vaultGuarding,
  vaultKey,
  vaultRefusal,
  type VaultCategory,
  type VaultClosedError,
  type VaultKey,
  type VaultSettings,
} from './vault';
import { readVaultSettingsSync, writeVaultSettingsSync } from './vaultSettings';

type Snapshot = { settings: VaultSettings; appLockOn: boolean; guarding: boolean; key: VaultKey };

let snapshot: Snapshot | null = null;
let vaultOpen = false;
let bypassDepth = 0;
const listeners = new Set<() => void>();

/**
 * The settings and whether App Lock is on, read from the two files once and
 * then remembered, since this is asked before every SELECT. refreshVault()
 * reads them again after either changes.
 */
function current(): Snapshot {
  if (snapshot === null) {
    const lock = readLockStateSync();
    const appLockOn = lock !== null && lock.phase === 'on';
    const settings = readVaultSettingsSync();
    snapshot = { settings, appLockOn, guarding: vaultGuarding(appLockOn, settings), key: vaultKey(appLockOn, settings) };
  }
  return snapshot;
}

export function getVaultSettings(): VaultSettings {
  return current().settings;
}

/** Writes the settings and redraws everything watching the vault. */
export function saveVaultSettings(settings: VaultSettings): void {
  writeVaultSettingsSync(settings);
  refreshVault();
}

/** True when the vault is closing something: categories are chosen and a code opens it. */
export function isVaultOn(): boolean {
  return current().guarding;
}

/** What opens it: the App Lock code, its own code, or nothing yet. */
export function currentVaultKey(): VaultKey {
  return current().key;
}

export function isAppLockOnForVault(): boolean {
  return current().appLockOn;
}

/** The categories the person put in the vault, guarded or not. */
export function chosenVaultCategories(): VaultCategory[] {
  return current().settings.categories;
}

export function refreshVault(): void {
  snapshot = null;
  if (!current().guarding) vaultOpen = false;
  notify();
}

/** Kept for lib/appLockDevice.ts, which calls it after the lock file changes. */
export const refreshVaultOn = refreshVault;

export function isVaultOpen(): boolean {
  return vaultOpen;
}

/** True when the vault is guarding and closed, so its records cannot be read. */
export function isVaultClosed(): boolean {
  return isVaultOn() && !vaultOpen;
}

/** True when this one category is in the vault, guarded, and closed. */
export function isCategoryClosed(category: VaultCategory): boolean {
  return isVaultClosed() && current().settings.categories.includes(category);
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
  const now = current();
  return vaultRefusal(sql, now.guarding, vaultOpen, now.settings.categories);
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
