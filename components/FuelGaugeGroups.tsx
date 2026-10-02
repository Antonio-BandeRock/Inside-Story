// Today's nutrients grouped by body system or by condition (G32,
// 2026-10-02). A fold inside Today's Fuel Gauges on Home, under the row of
// rings. Every grouping and every sentence lives in lib/fuelGaugeGroups.ts;
// this only draws it. Tapping a group's name says where its grouping comes
// from, through the screen's info popup, so the citations are a tap away
// rather than sitting on Home every day.
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  FUEL_GAUGE_GROUPS_INTRO,
  FUEL_GAUGE_GROUPS_TITLE,
  GROUP_SOURCE_LINE,
  NO_CONDITIONS_LINE,
  groupByCondition,
  groupBySystem,
  type GroupedRow,
  type GroupingMode,
} from '../lib/fuelGaugeGroups';
import type { NutrientGapEntry } from '../lib/nutrientAnalysis';

type Props = {
  entries: NutrientGapEntry[];
  conditionCodes: string[];
  accent: string;
  showInfo: (title: string, message: string) => void;
};

const MODES: { mode: GroupingMode; label: string }[] = [
  { mode: 'system', label: 'By body system' },
  { mode: 'condition', label: 'By condition' },
];

export function FuelGaugeGroups({ entries, conditionCodes, accent, showInfo }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<GroupingMode>('system');

  if (!open) {
    return (
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={8} style={styles.link} accessibilityRole="button">
        <Text style={[styles.linkText, { color: accent }]}>{`${FUEL_GAUGE_GROUPS_TITLE} ▾`}</Text>
      </TouchableOpacity>
    );
  }

  const rows = mode === 'system' ? groupBySystem(entries) : groupByCondition(conditionCodes, entries);

  function showSource(row: GroupedRow) {
    const sources = row.citations.length > 0 ? `\n\nSources:\n${row.citations.join('\n\n')}` : '';
    showInfo(row.name, `${row.note}${sources}`);
  }

  return (
    <View style={styles.block}>
      <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8} style={styles.link} accessibilityRole="button">
        <Text style={[styles.linkText, { color: accent }]}>{`${FUEL_GAUGE_GROUPS_TITLE} ▴`}</Text>
      </TouchableOpacity>
      <Text style={styles.caption}>{FUEL_GAUGE_GROUPS_INTRO}</Text>
      <View style={styles.modes}>
        {MODES.map((choice) => {
          const chosen = choice.mode === mode;
          return (
            <TouchableOpacity
              key={choice.mode}
              onPress={() => setMode(choice.mode)}
              style={[styles.pill, chosen ? { backgroundColor: accent, borderColor: accent } : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: chosen }}
            >
              <Text style={[styles.pillText, chosen ? styles.pillTextOnAccent : null]}>{choice.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {mode === 'condition' && rows.length === 0 ? <Text style={styles.caption}>{NO_CONDITIONS_LINE}</Text> : null}
      {rows.length > 0 ? <Text style={styles.caption}>{GROUP_SOURCE_LINE}</Text> : null}
      {rows.map((row) => (
        <View key={row.key} style={styles.group}>
          <TouchableOpacity onPress={() => showSource(row)} hitSlop={6} accessibilityRole="button">
            <Text style={[styles.groupName, { color: accent }]}>{row.name}</Text>
          </TouchableOpacity>
          {row.emptyLine ? (
            <Text style={styles.caption}>{`${row.emptyLine} ${row.note}`}</Text>
          ) : (
            <Text style={styles.nutrients}>{row.nutrients.map((nutrient) => nutrient.line).join('  ·  ')}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  link: { alignSelf: 'flex-start', marginTop: 12 },
  linkText: { ...typography.caption, ...textShadow },
  caption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
  },
  pillText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  pillTextOnAccent: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  group: { gap: 2 },
  groupName: { ...typography.body, ...textShadow },
  nutrients: { ...typography.caption, ...textShadow, color: colors.textPrimary },
});
