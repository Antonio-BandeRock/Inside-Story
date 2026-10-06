// The agreement's points (X2), drawn the same way on the first-launch
// screen and on the read-again page reached from Profile. The wording is
// in lib/agreement.ts.
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { AGREEMENT_INTRO, AGREEMENT_POINTS, LEGAL_PAGES_LIVE, PRIVACY_URL, TERMS_URL } from '../lib/agreement';
import { HOME_BAND_CONTENT_PADDING, homeBandStyle } from './HomeSectionBand';

export function AgreementPoints() {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.body}>{AGREEMENT_INTRO}</Text>
      </View>
      {AGREEMENT_POINTS.map((point) => (
        <View key={point.heading} style={styles.card}>
          <View style={styles.headingRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.tabProfile} style={textShadow} />
            <Text style={styles.heading}>{point.heading}</Text>
          </View>
          <Text style={styles.body}>{point.body}</Text>
        </View>
      ))}
      {LEGAL_PAGES_LIVE ? (
        <View style={styles.card}>
          <TouchableOpacity style={styles.link} onPress={() => void Linking.openURL(TERMS_URL)} accessibilityRole="link">
            <Ionicons name="document-text-outline" size={18} color={colors.tabProfile} style={textShadow} />
            <Text style={styles.linkText}>Terms of use</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => void Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
            <Ionicons name="lock-closed-outline" size={18} color={colors.tabProfile} style={textShadow} />
            <Text style={styles.linkText}>Privacy policy</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    ...homeBandStyle,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 6,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { ...typography.bodyEmphasis, color: colors.tabProfileText, flex: 1, ...textShadow },
  body: { ...typography.body, color: colors.textPrimary, ...textShadow },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  linkText: { ...typography.body, color: colors.tabProfileText, textDecorationLine: 'underline', ...textShadow },
});
