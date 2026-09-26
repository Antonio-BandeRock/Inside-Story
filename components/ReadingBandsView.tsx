// Draws a ReadingView (lib/readingBands.ts), 1.0.52.7: one fold per band,
// in the colour of the tab it sits on. Used by the output lenses on
// Insights and Trends, which only read.
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import type { ReadingRow, ReadingView } from '../lib/readingBands';
import { YourStoryMissingLine } from './YourStoryMissingLine';
import type { YourStoryItemKey } from '../lib/yourStory';
import { makeTabBandStyles, TabBand } from './TabBand';

type Props = {
  view: ReadingView | null;
  loading: boolean;
  loadingLine: string;
  folds: ReturnType<typeof useBandFolds>;
  color: string;
  idPrefix: string;
  missingItem?: YourStoryItemKey;
};

function Rows({ rows, color }: { rows: ReadingRow[]; color: string }) {
  const highest = Math.max(1, ...rows.map((row) => row.value ?? 0));
  return (
    <View style={styles.rows}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {row.label}
          </Text>
          <View style={styles.track}>
            {row.value === null || row.value <= 0 ? null : (
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(2, Math.round((row.value / highest) * 100))}%`, backgroundColor: color },
                ]}
              />
            )}
          </View>
          <Text style={styles.rowValue} numberOfLines={1}>
            {row.display}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ReadingBandsView({ view, loading, loadingLine, folds, color, idPrefix, missingItem }: Props) {
  const band = makeTabBandStyles(color);
  if (loading) {
    return (
      <View style={band.boxMuted}>
        <Text style={styles.muted}>{loadingLine}</Text>
      </View>
    );
  }
  if (!view || !view.hasAnything) {
    return (
      <View style={band.boxMuted}>
        <Text style={styles.muted}>{view?.empty ?? loadingLine}</Text>
        {missingItem ? <YourStoryMissingLine itemKey={missingItem} /> : null}
      </View>
    );
  }
  return (
    <>
      {view.bands.map((entry) => (
        <TabBand
          key={entry.id}
          folds={folds}
          color={color}
          id={`${idPrefix}:${entry.id}`}
          title={entry.title}
          icon={entry.icon}
          count={entry.count}
        >
          {entry.lines.map((line) => (
            <Text key={line} style={styles.caption}>
              {line}
            </Text>
          ))}
          {entry.rows && entry.rows.length > 0 ? <Rows rows={entry.rows} color={color} /> : null}
          {entry.items?.map((item) => (
            <View key={item.key} style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
            </View>
          ))}
          {entry.notes?.map((note) => (
            <Text key={note} style={[styles.caption, styles.note]}>
              {note}
            </Text>
          ))}
        </TabBand>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  muted: { ...typography.body, ...textShadow, color: colors.textSecondary },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  note: { marginTop: 8 },
  rows: { gap: 6, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  rowLabel: { ...typography.caption, color: colors.textMuted, width: 92, ...textShadow },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  bar: { height: 10, borderRadius: 5 },
  rowValue: { ...typography.caption, color: colors.textMuted, width: 84, textAlign: 'right', ...textShadow },
  item: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  itemTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '400', ...textShadow },
});
