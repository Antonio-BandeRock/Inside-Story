import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { DAILY_SCALES, isScaleValue, type DailyScaleKey, type DailyScaleValues } from '../lib/dailyScales';

// Mood, energy and stress on a 1 to 5 scale (D1, 2026-09-26). One row of
// five buttons per scale, used on Home's Today's Check-In and on Signals >
// General Note so both ask the same question the same way. Every scale is
// optional: tapping the chosen number again clears it, and the word under
// the row says what the chosen number means rather than judging it.
export function DailyScalesPicker({
  values,
  onChange,
  accent,
}: {
  values: DailyScaleValues;
  onChange: (next: DailyScaleValues) => void;
  accent: string;
}) {
  function choose(key: DailyScaleKey, value: number) {
    onChange({ ...values, [key]: values[key] === value ? null : value });
  }

  return (
    <View style={styles.block}>
      {DAILY_SCALES.map((scale) => {
        const chosen = values[scale.key];
        return (
          <View key={scale.key} style={styles.scale}>
            <Text style={styles.label}>{scale.label}</Text>
            <View style={styles.row}>
              {[1, 2, 3, 4, 5].map((value) => {
                const active = chosen === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.button, active && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => choose(scale.key, value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${scale.label} ${value}, ${scale.words[value - 1]}`}
                  >
                    <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{value}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.word}>
              {isScaleValue(chosen)
                ? `${scale.words[chosen - 1]}. Tap ${chosen} again to clear it.`
                : `1 is ${scale.words[0].toLowerCase()}, 5 is ${scale.words[4].toLowerCase()}.`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12, marginBottom: 12 },
  scale: { gap: 6 },
  label: { ...typography.eyebrow, ...textShadow, color: colors.textMuted, fontWeight: '400' },
  row: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  buttonText: { ...typography.body, ...textShadow, color: colors.textPrimary },
  buttonTextActive: {
    color: colors.textOnPrimary,
    // Dark text: cancel the shadow inherited from buttonText. See
    // constants/typography.ts.
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  word: { ...typography.caption, ...textShadow, color: colors.textMuted },
});
