import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { DigestChart as DigestChartData } from '../lib/digest';

// A plain, small horizontal bar chart -- 2026-08-07, built for Purple
// Digest's own DigestCard, direct request: "we need graph images that
// depict the trends and data in ways that make it easy to understand...
// to provide a professional view of the data." Horizontal, not vertical
// bars, deliberately: this app's own real datasets carry labels like
// "2001-02" vs. "2017-18" or a full disease name, which read far better as
// a row's own left-hand text than crammed under a narrow vertical bar on a
// phone-width screen. Plain styled Views, not react-native-svg or a
// charting library -- react-native has no built-in charting, and a bar is
// just a View with a proportional width; no new dependency, no SVG-
// specific rendering risk for something this simple. Every real value
// rendered here comes straight from the calling entry's own already-cited
// `chart` data (see lib/digest/types.ts's own DigestChart comment) --
// this component only lays it out, it never computes or invents a number.
export function DigestBarChart({ chart, color }: { chart: DigestChartData; color: string }) {
  const max = Math.max(...chart.data.map((datum) => datum.value), 0.0001);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{chart.title}</Text>
      {chart.data.map((datum) => (
        <View key={datum.label} style={styles.row}>
          <Text style={styles.label} numberOfLines={2}>
            {datum.label}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max((datum.value / max) * 100, 4)}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {datum.value}
            {chart.unit ?? ''}
          </Text>
        </View>
      ))}
      <Text style={styles.sourceNote}>{chart.sourceNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // A subtly distinct sub-card within DigestCard's own already-expanded
  // detail area, not a flat, unbounded block -- colors.background (the
  // app's own darkest navy) rather than colors.surface, since this sits
  // one level further "inside" the already-surfaced card behind it, the
  // same visual-nesting convention several builder screens already use for
  // a summary box within a larger card.
  container: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  title: {
    ...typography.caption,
    fontWeight: '400',
    color: colors.textPrimary,
    ...textShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Fixed-ish share of the row via flex, not a hardcoded pixel width --
  // stays proportional across phone widths the same way every other
  // percentage-based layout in this app already does.
  label: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    flex: 5,
    ...textShadow,
  },
  track: {
    flex: 7,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 7,
  },
  value: {
    ...typography.caption,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right',
    ...textShadow,
  },
  sourceNote: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    ...textShadow,
  },
});
