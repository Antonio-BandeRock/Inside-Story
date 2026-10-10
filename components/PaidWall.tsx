// What a paid lens shows on Free, P27 (2026-10-09). Drawn by
// GatedTabContent in place of the lens, so every tab gets it from the one
// place a lens is drawn, whichever way the lens was reached (the corner
// menu, a jump from another tab, a link in a reminder).
//
// Board rules it keeps: a paid lens is never greyed out and never hidden,
// it says which plan includes it and what that plan gives, and it says
// plainly that nothing the person recorded is lost. What is paid comes
// from lib/paidFeatures.ts.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { paidWallWords, type PaidLens } from '../lib/paidFeatures';
import { useTabBandStyles } from './TabBand';

export function PaidWall({ paid, color }: { paid: PaidLens; color: string }) {
  const band = useTabBandStyles(color);
  const bottom = useFloatingButtonScrollPadding();
  const words = paidWallWords(paid);
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[band.column, { paddingBottom: bottom }]}>
      <View style={band.box}>
        <View style={styles.titleRow}>
          <Ionicons name="key" size={20} color={color} />
          <Text style={styles.title}>{words.title}</Text>
        </View>
        <Text style={styles.message}>{words.message}</Text>
        <Text style={[styles.message, styles.kept]}>{words.kept}</Text>
      </View>
      <View style={band.boxMuted}>
        <Text style={styles.note}>
          Developer Tools has this device set to Free, so this is what somebody on Free sees here.
          Switch it back to Paid in Profile, Developer Tools.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  message: { ...typography.body, color: colors.textSecondary, ...textShadow },
  kept: { marginTop: 8 },
  note: { ...typography.caption, color: colors.textSecondary, ...textShadow },
});
