// The vault (lib/vault.ts): choosing what goes in it, opening it with a code
// or fingerprint, closing it, and closing it again whenever the app is put
// away. lib/vaultState.ts holds the flags, so the database can ask without
// importing any of this.
//
// What opens it: with App Lock on, the App Lock code or fingerprint (the
// agreed default, one code for both). With App Lock off, a code of the
// vault's own, set in Profile > App Lock > The Vault or at setup. That code
// guards the screen and not the file, since without App Lock the database
// is not encrypted, and the vault settings say so in words.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { File, Paths } from 'expo-file-system';
import {
  DATA_KEY_BYTES,
  DEFAULT_KDF,
  isBiometricCancel,
  KDF_SALT_BYTES,
  passcodeWrappingKey,
  unwrapKey,
  waitRemainingMs,
  WRAP_NONCE_BYTES,
  wrapKey,
  wrongTryWaitMs,
  type PasscodeKind,
} from './appLock';
import { canUseBiometrics, checkPasscode, unlockWithBiometric } from './appLockDevice';
import { heldDataKey, readLockStateSync } from './appLockSession';
import { bytesToBase64Fast } from './localSeal';
import { isDesktopApp } from './desktop/bridge';
import { cleanCategories, VAULT_CATEGORY_KIND, type VaultCategory, type VaultKey } from './vault';
import {
  chosenVaultCategories,
  currentVaultKey,
  getVaultSettings,
  isVaultOn,
  isVaultOpen,
  saveVaultSettings,
  setVaultOpen,
  subscribeVault,
} from './vaultState';

export type VaultOpenResult =
  | { kind: 'open' }
  | { kind: 'wrong'; waitMs: number }
  | { kind: 'wait'; waitMs: number }
  | { kind: 'cancelled' }
  | { kind: 'needs-passcode' };

const VAULT_BIOMETRIC_ITEM = 'inside_story_vault_biometric_v1';
const BIOMETRIC_PROMPT = 'Open the vault';

async function randomBytes(count: number): Promise<Uint8Array> {
  const Crypto = await import('expo-crypto');
  return Crypto.getRandomBytesAsync(count);
}

function forget(key: Uint8Array): void {
  // The key handed back is a fresh copy; the one the database was opened
  // with stays held in lib/appLockSession.ts.
  if (key !== heldDataKey()) key.fill(0);
}

// ---------------------------------------------------------------------------
// Opening

export async function openVaultWithPasscode(passcode: string): Promise<VaultOpenResult> {
  const key = currentVaultKey();
  if (key === 'own-code') return openWithOwnCode(passcode);
  if (key === 'none') return { kind: 'wrong', waitMs: 0 };
  const result = await checkPasscode(passcode);
  if (result.kind !== 'key') return result;
  forget(result.key);
  setVaultOpen(true);
  return { kind: 'open' };
}

async function openWithOwnCode(passcode: string): Promise<VaultOpenResult> {
  const settings = getVaultSettings();
  const code = settings.code;
  if (!code) return { kind: 'wrong', waitMs: 0 };
  const remaining = waitRemainingMs(code.failedTries, code.lastFailedAt, Date.now());
  if (remaining > 0) return { kind: 'wait', waitMs: remaining };
  const opened = unwrapKey(code.check, await passcodeWrappingKey(passcode, code.kdf));
  // Read again: scrypt takes a moment and a setting may have changed.
  const now = getVaultSettings();
  if (!now.code) return { kind: 'wrong', waitMs: 0 };
  if (opened) {
    opened.fill(0);
    if (now.code.failedTries || now.code.lastFailedAt) {
      saveVaultSettings({ ...now, code: { ...now.code, failedTries: 0, lastFailedAt: 0 } });
    }
    setVaultOpen(true);
    return { kind: 'open' };
  }
  const failedTries = now.code.failedTries + 1;
  saveVaultSettings({ ...now, code: { ...now.code, failedTries, lastFailedAt: Date.now() } });
  return { kind: 'wrong', waitMs: wrongTryWaitMs(failedTries) };
}

/** Whether a fingerprint can open the vault as it is set up now. */
export function vaultFingerprintReady(): boolean {
  const key = currentVaultKey();
  if (key === 'app-lock') return readLockStateSync()?.biometric === true;
  if (key === 'own-code') return getVaultSettings().biometric && !isDesktopApp();
  return false;
}

export async function openVaultWithBiometric(): Promise<VaultOpenResult> {
  const key = currentVaultKey();
  if (key === 'app-lock') {
    if (!readLockStateSync()?.biometric) return { kind: 'needs-passcode' };
    const result = await unlockWithBiometric();
    if (result.kind !== 'key') return result;
    forget(result.key);
    setVaultOpen(true);
    return { kind: 'open' };
  }
  if (key !== 'own-code' || !getVaultSettings().biometric || isDesktopApp()) return { kind: 'needs-passcode' };
  try {
    const SecureStore = await import('expo-secure-store');
    const stored = await SecureStore.getItemAsync(VAULT_BIOMETRIC_ITEM, {
      requireAuthentication: true,
      authenticationPrompt: BIOMETRIC_PROMPT,
    });
    if (!stored) return { kind: 'needs-passcode' };
    setVaultOpen(true);
    return { kind: 'open' };
  } catch (error) {
    if (isBiometricCancel(error)) return { kind: 'cancelled' };
    console.error('[vault] fingerprint open failed', error);
    return { kind: 'needs-passcode' };
  }
}

export function closeVault(): void {
  setVaultOpen(false);
}

// ---------------------------------------------------------------------------
// Choosing and setting up

/**
 * Puts these categories in the vault and takes the rest out. Returns whether
 * anything now opens the vault, so the caller can say plainly when it does
 * not (direct instruction, 2026-10-07).
 */
export function setVaultCategories(categories: readonly VaultCategory[]): { guarded: boolean } {
  const settings = getVaultSettings();
  saveVaultSettings({ ...settings, categories: cleanCategories(categories), setupAsked: true });
  return { guarded: currentVaultKey() !== 'none' };
}

/** Sets the vault's own code, replacing any earlier one. Used while App Lock is off. */
export async function setVaultOwnCode(passcode: string, kind: PasscodeKind, biometric: boolean): Promise<{ biometric: boolean }> {
  const salt = await randomBytes(KDF_SALT_BYTES);
  const kdf = { ...DEFAULT_KDF, salt: bytesToBase64Fast(salt) };
  const check = await randomBytes(DATA_KEY_BYTES);
  const wrapped = wrapKey(check, await passcodeWrappingKey(passcode, kdf), await randomBytes(WRAP_NONCE_BYTES));
  check.fill(0);
  const keptFingerprint = biometric ? await keepVaultFingerprint() : false;
  const settings = getVaultSettings();
  saveVaultSettings({
    ...settings,
    code: { kind, kdf, check: wrapped, failedTries: 0, lastFailedAt: 0 },
    biometric: keptFingerprint,
    setupAsked: true,
  });
  return { biometric: keptFingerprint };
}

async function keepVaultFingerprint(): Promise<boolean> {
  if (isDesktopApp() || !(await canUseBiometrics())) return false;
  try {
    const SecureStore = await import('expo-secure-store');
    const marker = bytesToBase64Fast(await randomBytes(16));
    await SecureStore.setItemAsync(VAULT_BIOMETRIC_ITEM, marker, {
      requireAuthentication: true,
      authenticationPrompt: BIOMETRIC_PROMPT,
    });
    return true;
  } catch (error) {
    console.error('[vault] the fingerprint could not be kept', error);
    return false;
  }
}

/** Takes the vault's own code away. With App Lock off, nothing then opens the vault, so nothing is closed. */
export async function removeVaultOwnCode(): Promise<void> {
  const settings = getVaultSettings();
  saveVaultSettings({ ...settings, code: null, biometric: false });
  setVaultOpen(false);
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(VAULT_BIOMETRIC_ITEM);
  } catch {
    // Nothing kept.
  }
}

/** The setup question was answered Not Now: nothing goes in, and the occasional offer takes over. */
export function answerVaultSetupNotNow(): void {
  saveVaultSettings({ ...getVaultSettings(), setupAsked: true });
}

/** The occasional offer was made now. */
export function markVaultOffered(now: number = Date.now()): void {
  saveVaultSettings({ ...getVaultSettings(), offeredAt: now });
}

export function stopVaultOffers(): void {
  saveVaultSettings({ ...getVaultSettings(), stopOffering: true });
}

/** Kept for phase 1 callers: on puts the nine phase 1 categories in, off takes everything out. */
export function setVaultOn(on: boolean): void {
  if (!on) {
    setVaultCategories([]);
    setVaultOpen(false);
    return;
  }
  setVaultCategories(['symptoms', 'labs', 'body', 'cycle', 'therapy', 'neuro', 'experiments', 'medicalBills', 'familyHealth']);
}

// ---------------------------------------------------------------------------
// Closing when the app is put away

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

export type VaultView = {
  /** The vault is closing something: categories chosen and a code opens it. */
  on: boolean;
  open: boolean;
  closed: boolean;
  /** What is in it, guarded or not. */
  categories: VaultCategory[];
  key: VaultKey;
};

function readView(): VaultView {
  const on = isVaultOn();
  const open = isVaultOpen();
  return { on, open, closed: on && !open, categories: chosenVaultCategories(), key: currentVaultKey() };
}

/** The vault's state, redrawn whenever it opens, closes, or its settings change. */
export function useVault(): VaultView {
  const [view, setView] = useState<VaultView>(readView);
  useEffect(() => subscribeVault(() => setView(readView())), []);
  return view;
}

/** Whether one category is closed right now, redrawn as the vault changes. */
export function useCategoryClosed(category: VaultCategory): boolean {
  const view = useVault();
  return view.closed && view.categories.includes(category);
}

/**
 * Whether any of these listed categories (medications, conditions,
 * appointments) is closed. The database never refuses those, since the
 * warnings and scoring read them, so a screen that lists them hides the list
 * itself when this is true.
 */
export function useListedClosed(categories: readonly VaultCategory[]): boolean {
  const view = useVault();
  return view.closed && categories.some((c) => VAULT_CATEGORY_KIND[c] === 'listed' && view.categories.includes(c));
}

/** True when the vault file exists, which is how setup knows the question was put to an older phone. */
export function vaultFileExists(): boolean {
  try {
    return new File(Paths.document, 'vault.json').exists;
  } catch {
    return false;
  }
}
