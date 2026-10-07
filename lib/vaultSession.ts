// The vault (lib/vault.ts): opening it with the App Lock code or
// fingerprint, closing it, and closing it again whenever the app is put
// away. lib/vaultState.ts holds the flags, so the database can ask without
// importing any of this.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { checkPasscode, readLockStateSync, unlockWithBiometric, updateLockSettings } from './appLockDevice';
import { heldDataKey } from './appLockSession';
import { isVaultOn, isVaultOpen, refreshVaultOn, setVaultOpen, subscribeVault } from './vaultState';

export type VaultOpenResult =
  | { kind: 'open' }
  | { kind: 'wrong'; waitMs: number }
  | { kind: 'wait'; waitMs: number }
  | { kind: 'cancelled' }
  | { kind: 'needs-passcode' };

function forget(key: Uint8Array): void {
  // The key handed back is a fresh copy; the one the database was opened
  // with stays held in lib/appLockSession.ts.
  if (key !== heldDataKey()) key.fill(0);
}

export async function openVaultWithPasscode(passcode: string): Promise<VaultOpenResult> {
  const result = await checkPasscode(passcode);
  if (result.kind !== 'key') return result;
  forget(result.key);
  setVaultOpen(true);
  return { kind: 'open' };
}

export async function openVaultWithBiometric(): Promise<VaultOpenResult> {
  if (!readLockStateSync()?.biometric) return { kind: 'needs-passcode' };
  const result = await unlockWithBiometric();
  if (result.kind !== 'key') return result;
  forget(result.key);
  setVaultOpen(true);
  return { kind: 'open' };
}

export function closeVault(): void {
  setVaultOpen(false);
}

/** Switches the vault on or off. Off also leaves nothing to be open. */
export function setVaultOn(on: boolean): void {
  updateLockSettings({ vault: on });
  refreshVaultOn();
  if (!on) setVaultOpen(false);
}

let watching = false;

/**
 * Closes the vault whenever the app is put away. Called once from the root
 * layout; a second call does nothing.
 */
export function watchVaultClosing(): void {
  if (watching) return;
  watching = true;
  AppState.addEventListener('change', (next) => {
    if (next === 'background' && isVaultOpen()) setVaultOpen(false);
  });
}

export type VaultView = { on: boolean; open: boolean; closed: boolean };

/** The vault's state, redrawn whenever it opens, closes or is switched. */
export function useVault(): VaultView {
  const read = (): VaultView => {
    const on = isVaultOn();
    const open = isVaultOpen();
    return { on, open, closed: on && !open };
  };
  const [view, setView] = useState<VaultView>(read);
  useEffect(() => subscribeVault(() => setView(read())), []);
  return view;
}
