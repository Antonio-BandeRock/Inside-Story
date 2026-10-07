// How a screen reads records that may be in the vault (lib/vault.ts, phase 2).
//
// Two pieces, used together:
//   1. readOrClosed(work, fallback): a read refused because the vault is
//      closed hands back the fallback (an empty list, null) rather than an
//      error, so a screen draws with nothing and shows VaultClosedBand in
//      its place. Any other error is thrown as before.
//   2. useVaultReloadKey(): a number that changes whenever the vault opens,
//      closes or what is in it changes. Put it in the dependencies of the
//      effect or focus callback that loads, so opening the vault on the
//      screen loads what was refused, and closing it clears what was shown.

import { useEffect, useRef, useState } from 'react';
import { isVaultClosedError } from './vault';
import { subscribeVault } from './vaultState';

export async function readOrClosed<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (isVaultClosedError(error)) return fallback;
    throw error;
  }
}

export function useVaultReloadKey(): number {
  const [key, setKey] = useState(0);
  useEffect(() => subscribeVault(() => setKey((k) => k + 1)), []);
  return key;
}

/**
 * Runs `reload` whenever the vault opens, closes or what is in it changes,
 * for a screen whose loader is a named callback. Kept in a ref so the
 * latest loader runs, never the one from the first draw.
 */
export function useOnVaultChange(reload: () => void): void {
  const latest = useRef(reload);
  latest.current = reload;
  useEffect(() => subscribeVault(() => latest.current()), []);
}
