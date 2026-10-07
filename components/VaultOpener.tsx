// The one way to open the vault, used wherever it can be opened: the
// "in the vault" band on any screen and Profile > App Lock. Takes the code
// that opens it now (the App Lock code with App Lock on, the vault's own
// code with it off) and offers the fingerprint where that is set up.

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { readLockStateSync } from '../lib/appLockSession';
import { explainNotYet } from '../lib/notYet';
import { getVaultSettings } from '../lib/vaultState';
import {
  openVaultWithBiometric,
  openVaultWithPasscode,
  useVault,
  vaultFingerprintReady,
  type VaultOpenResult,
} from '../lib/vaultSession';
import { PasscodeEntry } from './PasscodeEntry';

export function vaultWaitWords(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return seconds < 60 ? `${seconds} seconds` : `${Math.ceil(seconds / 60)} minutes`;
}

export function VaultOpener({ accent }: { accent?: string }) {
  const vault = useVault();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const codeKind =
    vault.key === 'app-lock' ? readLockStateSync()?.passcodeKind ?? 'digits' : getVaultSettings().code?.kind ?? 'digits';
  const codeName = vault.key === 'app-lock' ? 'App Lock code' : 'vault code';

  const answer = (result: VaultOpenResult) => {
    setTyped('');
    if (result.kind === 'wrong') {
      setProblem(
        result.waitMs ? `That code did not open it. Try again in ${vaultWaitWords(result.waitMs)}.` : 'That code did not open it.',
      );
    } else if (result.kind === 'wait') setProblem(`Too many wrong codes. Try again in ${vaultWaitWords(result.waitMs)}.`);
    else if (result.kind === 'needs-passcode') setProblem(`Type your ${codeName} to open it.`);
    else setProblem(null);
  };

  const run = async (work: () => Promise<VaultOpenResult>) => {
    setBusy(true);
    try {
      answer(await work());
    } finally {
      setBusy(false);
    }
  };

  if (!vault.closed) return null;

  return (
    <View style={styles.wrap}>
      <PasscodeEntry
        kind={codeKind}
        value={typed}
        onChange={setTyped}
        disabled={busy}
        submitLabel="Open"
        onSubmit={() => {
          if (!typed) {
            explainNotYet(`Type your ${codeName} first, then press Open.`);
            return;
          }
          void run(() => openVaultWithPasscode(typed));
        }}
      />
      {vaultFingerprintReady() ? (
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          disabled={busy}
          onPress={() => void run(openVaultWithBiometric)}
        >
          <Text style={[styles.buttonText, accent ? { color: accent } : null]}>Open With Fingerprint</Text>
        </TouchableOpacity>
      ) : null}
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, gap: 8 },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  buttonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  problem: { ...typography.caption, color: colors.textMuted, ...textShadow },
});
