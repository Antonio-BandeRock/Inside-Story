// What a screen shows in place of records that are in the vault while it is
// closed (lib/vault.ts, phase 2). Says which records, in words, and opens
// the vault right there, so nobody has to go to Profile to see their labs.
// The form beside a history stays usable: the vault holds records, never the
// tools to make them (direct instruction, 2026-10-07).
//
// Renders in the tab's colour through useTabBandStyles like every other
// band. With `inline` it draws without a band of its own, for a row inside
// a card that already has one.

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { vaultClosedWords, type VaultCategory } from '../lib/vault';
import { useVault } from '../lib/vaultSession';
import { useTabBandStyles } from './TabBand';
import { VaultOpener } from './VaultOpener';

export function VaultClosedBand({
  color,
  categories,
  inline = false,
}: {
  /** The tab's colour, for the band's accent and edge. */
  color: string;
  /** What this screen would show, for the words. Only the closed ones are named. */
  categories: readonly VaultCategory[];
  inline?: boolean;
}) {
  const vault = useVault();
  const band = useTabBandStyles(color);
  const [opening, setOpening] = useState(false);
  const closedHere = categories.filter((c) => vault.categories.includes(c));
  if (!vault.closed || closedHere.length === 0) return null;

  return (
    <View style={inline ? styles.inline : band.box}>
      <Text style={styles.title}>{vaultClosedWords(closedHere)}</Text>
      <Text style={styles.message}>
        {`Open it with your ${vault.key === 'app-lock' ? 'App Lock code' : 'vault code'} or fingerprint to see them. It closes again when the app is put away.`}
      </Text>
      {opening ? (
        <VaultOpener accent={color} />
      ) : (
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => setOpening(true)}>
          <Text style={[styles.buttonText, { color }]}>Open the Vault</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { paddingVertical: 8 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 6, ...textShadow },
  message: { ...typography.body, color: colors.textSecondary, ...textShadow },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { ...typography.bodyEmphasis, ...textShadow },
});
