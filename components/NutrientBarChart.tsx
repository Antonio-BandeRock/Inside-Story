// A real horizontal bar chart of nutrient content vs. this person's own
// daily target -- 2026-08-25, direct correction to the first Nutrition &
// Safety Report attempt: "It needs to be a report about the nutrients. It
// does need to use some sort of graph instead of just writing it out.
// Visuals are far more effective." Mirrors the same horizontal-bar
// approach already established for Digest's own DigestBarChart (plain
// styled Views, no SVG needed for a simple proportional bar), built fresh
// here rather than reused directly since that component's own data shape
// is Digest's static, cited DigestChart type, not a live per-nutrient
// percentage.

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export type NutrientChartDatum = { nutrient: string; percent: number };

export function NutrientBarChart({ data, color }: { data: NutrientChartDatum[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((datum) => datum.percent), 100);
  return (
    <View>
      {data.map((datum) => (
        <View key={datum.nutrient} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {datum.nutrient}
          </Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.min((datum.percent / max) * 100, 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {Math.round(datum.percent)}%
          </Text>
        </View>
      ))}
      <Text style={styles.footnote}>% of your own daily target, per serving.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  label: { ...typography.caption, color: colors.textPrimary, width: 92 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 5 },
  value: { ...typography.caption, color: colors.textMuted, width: 36, textAlign: 'right' },
  footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, fontStyle: 'italic' },
});
