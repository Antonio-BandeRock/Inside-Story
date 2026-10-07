// The occasional offer to set the vault up (phase 2, direct instruction
// 2026-10-07): "If they choose no security, the app should provide a
// notification once every so often to offer to secure the vault later after
// they build up some data for it." lib/reminderNotifications.ts shows it
// during a reconcile; this file decides whether it is due and answers its
// two buttons that do not open a screen.

import { getDatabase } from './db';
import { shouldOfferVault, VAULT_COUNTED_TABLES, vaultOfferHourOk } from './vault';
import { getVaultSettings, isAppLockOnForVault, withVaultBypass } from './vaultState';
import { markVaultOffered, stopVaultOffers } from './vaultSession';

/**
 * How many records the offer would name, or null when it is not due. The
 * count is read only once everything else says yes, since a reconcile runs
 * often. A table missing from an older database counts as empty.
 */
export async function vaultOfferDue(now: Date): Promise<number | null> {
  if (!vaultOfferHourOk(now)) return null;
  const settings = getVaultSettings();
  const appLockOn = isAppLockOnForVault();
  if (!shouldOfferVault(settings, appLockOn, Number.MAX_SAFE_INTEGER, now.getTime())) return null;
  const db = await getDatabase();
  let count = 0;
  await withVaultBypass(async () => {
    for (const table of VAULT_COUNTED_TABLES) {
      try {
        const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
        count += row?.n ?? 0;
      } catch {
        // Not in this database yet.
      }
    }
  });
  return shouldOfferVault(settings, appLockOn, count, now.getTime()) ? count : null;
}

/** Not Now asks again in a month; Stop Asking never asks again. */
export function answerVaultOffer(actionIdentifier: string): void {
  if (actionIdentifier === 'vaultNotNow') markVaultOffered();
  else if (actionIdentifier === 'vaultStop') stopVaultOffers();
}
