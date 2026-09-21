// expo-secure-store, as the desktop app sees it (see metro.config.js).
// The phone keeps these values in the Android Keystore or the iOS
// Keychain; the desktop app keeps them encrypted with Electron's
// safeStorage (DPAPI on Windows, the Keychain on a Mac), one file per key
// under the app's data folder. lib/deviceIdentity.ts and
// lib/oneDriveAuth.ts are the callers, and they use only these three.

import { getDesktopBridge } from './bridge';

export async function getItemAsync(key: string): Promise<string | null> {
  return getDesktopBridge().secrets.get(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await getDesktopBridge().secrets.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  await getDesktopBridge().secrets.delete(key);
}

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}
