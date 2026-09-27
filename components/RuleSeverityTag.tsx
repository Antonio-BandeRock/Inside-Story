import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { ruleSeverityLabel, ruleSeverityMeaning, type RuleSeverity } from '../lib/ruleSeverity';

// A9 (1.0.53.35): the level of an interaction rule, drawn as the first row
// inside its card so it sits on the card's surface. Tapping it says what
// the level means, through the screen's showInfoAlert the same way
// WhyExplainer does, rather than mounting a second modal.
type Props = {
  severity: RuleSeverity;
  onPress: (title: string, message: string) => void;
};

const TONE: Record<RuleSeverity, string> = {
  major: colors.danger,
  caution: colors.statusYellowStandalone,
  note: colors.textMuted,
};

export function RuleSeverityTag({ severity, onPress }: Props) {
  const label = ruleSeverityLabel(severity);
  const tone = TONE[severity];
  return (
    <TouchableOpacity
      onPress={() => onPress(label, ruleSeverityMeaning(severity))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${label}. What this level means`}
      style={styles.row}
    >
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.label, { color: tone }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...typography.label, letterSpacing: 0.6, textTransform: 'uppercase', ...textShadow },
});
