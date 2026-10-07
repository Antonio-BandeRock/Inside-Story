// The vault's part of Profile > App Lock (phase 2): which kinds of record go
// in it, what opens it, and the way to open and close it. Shown with App
// Lock on or off, since the vault can have a code of its own.
//
// Only records go in, never the tools that make them: choice lists, forms,
// templates and settings stay usable with the vault closed (direct
// instruction, 2026-10-07). Taking a category out while the vault is closed
// would show it to whoever holds the phone, so that waits for the vault to
// be opened; putting one in never waits.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { canUseBiometrics } from '../lib/appLockDevice';
import { biometricWords, deviceWord } from '../lib/appLockWords';
import { isDesktopApp } from '../lib/desktop/bridge';
import { explainNotYet } from '../lib/notYet';
import {
  VAULT_CATEGORIES,
  VAULT_CATEGORY_GROUP,
  VAULT_CATEGORY_LABELS,
  VAULT_CATEGORY_NOTES,
  VAULT_NO_CODE_SENTENCE,
  type VaultCategory,
} from '../lib/vault';
import {
  closeVault,
  removeVaultOwnCode,
  setVaultCategories,
  setVaultOwnCode,
  useVault,
} from '../lib/vaultSession';
import { ChoosePasscode } from './AppLockGate';
import { VaultOpener } from './VaultOpener';

const GROUPS: { key: 'health' | 'money'; title: string }[] = [
  { key: 'health', title: 'Health' },
  { key: 'money', title: 'Money' },
];

export function VaultChoices({ appLockOn }: { appLockOn: boolean }) {
  const router = useRouter();
  const vault = useVault();
  const [askNoCode, setAskNoCode] = useState(false);
  const [choosingCode, setChoosingCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [codeNote, setCodeNote] = useState<string | null>(null);

  const chosen = new Set(vault.categories);

  const toggle = (category: VaultCategory) => {
    const isIn = chosen.has(category);
    if (isIn && vault.closed) {
      explainNotYet('Open the vault first. Taking something out of it while it is closed would show it to whoever is holding this phone.');
      return;
    }
    const next = isIn ? vault.categories.filter((c) => c !== category) : [...vault.categories, category];
    const { guarded } = setVaultCategories(next);
    setAskNoCode(!guarded && !isIn);
  };

  const chooseOwnCode = async (passcode: string, kind: 'digits' | 'phrase') => {
    setBusy(true);
    try {
      const wantsFingerprint = !isDesktopApp() && (await canUseBiometrics());
      const { biometric } = await setVaultOwnCode(passcode, kind, wantsFingerprint);
      setChoosingCode(false);
      setAskNoCode(false);
      setCodeNote(
        biometric
          ? `The vault code is set. ${biometricWords().replace(/^f/, 'F')} opens it too.`
          : 'The vault code is set.',
      );
    } finally {
      setBusy(false);
    }
  };

  const ownCode = vault.key === 'own-code';

  return (
    <>
      <Text style={styles.subLabel}>The Vault</Text>
      <Text style={styles.help}>
        {`What you tick here stays closed while the app is open, until ${
          appLockOn ? 'your App Lock code' : ownCode ? 'the vault code' : 'a code'
        } or fingerprint opens it, so somebody handed this ${deviceWord()} to look at the shopping list does not see your labs. It closes again whenever the app is put away. Only your records go in: lists to choose from, forms and settings stay usable, and the emergency card and safety warnings are never in it.`}
      </Text>

      {GROUPS.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {VAULT_CATEGORIES.filter((c) => VAULT_CATEGORY_GROUP[c] === group.key).map((category) => {
            const isIn = chosen.has(category);
            const note = VAULT_CATEGORY_NOTES[category];
            return (
              <TouchableOpacity
                key={category}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => toggle(category)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isIn }}
              >
                <Ionicons
                  name={isIn ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isIn ? colors.primary : colors.textMuted}
                />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{VAULT_CATEGORY_LABELS[category]}</Text>
                  {note ? <Text style={styles.rowNote}>{note}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {askNoCode && vault.key === 'none' && !choosingCode ? (
        <View style={styles.askBox}>
          <Text style={styles.askText}>{VAULT_NO_CODE_SENTENCE}</Text>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => setChoosingCode(true)}>
            <Text style={styles.buttonText}>Set a Vault Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => router.push('/app-lock-setup')}>
            <Text style={styles.buttonText}>Set Up App Lock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quietButton} activeOpacity={0.85} onPress={() => setAskNoCode(false)}>
            <Text style={styles.quietButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!appLockOn ? (
        choosingCode ? (
          <View style={styles.askBox}>
            <ChoosePasscode
              title={ownCode ? 'Choose a new vault code' : 'Choose a vault code'}
              intro="This code opens the vault and nothing else. Without App Lock your records are not encrypted on this device, so the vault keeps them off the screen rather than locking the file."
              busy={busy}
              onChosen={(passcode, kind) => void chooseOwnCode(passcode, kind)}
            />
            <TouchableOpacity style={styles.quietButton} activeOpacity={0.85} onPress={() => setChoosingCode(false)}>
              <Text style={styles.quietButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : ownCode ? (
          <>
            <Text style={styles.caption}>
              The vault has a code of its own. It keeps these records off the screen; App Lock is what encrypts the file
              itself.
            </Text>
            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={() => {
                if (vault.closed) {
                  explainNotYet('Open the vault first, then choose its new code.');
                  return;
                }
                setChoosingCode(true);
              }}
            >
              <Text style={styles.buttonText}>Change the Vault Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quietButton}
              activeOpacity={0.85}
              onPress={() => {
                if (vault.closed) {
                  explainNotYet('Open the vault first. Removing its code opens everything in it.');
                  return;
                }
                void removeVaultOwnCode().then(() => {
                  setCodeNote('The vault code is gone, so nothing closes the vault until a code is set again.');
                });
              }}
            >
              <Text style={styles.quietButtonText}>Remove the Vault Code</Text>
            </TouchableOpacity>
          </>
        ) : vault.categories.length > 0 && !askNoCode ? (
          <>
            <Text style={styles.caption}>
              Nothing opens the vault yet, so what you ticked is still open to anyone holding this phone.
            </Text>
            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => setChoosingCode(true)}>
              <Text style={styles.buttonText}>Set a Vault Code</Text>
            </TouchableOpacity>
          </>
        ) : null
      ) : null}

      {codeNote ? <Text style={styles.caption}>{codeNote}</Text> : null}

      {vault.on && vault.open ? (
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={closeVault}>
          <Text style={styles.buttonText}>Close the Vault</Text>
        </TouchableOpacity>
      ) : null}
      {vault.closed ? (
        <>
          <Text style={styles.subLabel}>Open the vault</Text>
          <VaultOpener />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  help: { ...typography.body, color: colors.textSecondary, lineHeight: 20, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
  subLabel: { ...typography.label, color: colors.textPrimary, marginTop: 14, marginBottom: 6, ...textShadow },
  group: { marginTop: 10, gap: 4 },
  groupTitle: { ...typography.label, color: colors.textSecondary, ...textShadow },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { ...typography.body, color: colors.textPrimary, ...textShadow },
  rowNote: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  askBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  askText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  quietButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  quietButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
