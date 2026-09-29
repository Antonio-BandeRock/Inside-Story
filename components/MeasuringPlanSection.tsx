// What is measured in one garden area, and whether for the area as a whole
// or for each planting (1.0.55.32). It stands under every area on Garden >
// Plots & Plantings and on Garden > Growing Conditions, and opens by itself
// as the step after a new area is saved, which is the setting-up process
// that was asked for. Folded to one line until opened. The rules and words
// are in lib/measuringPlan.ts.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { GardenPlot } from '../lib/db';
import {
  PLAN_HOW,
  planSummary,
  scopeLabel,
  suggestedPlan,
  suggestionNote,
  type MeasureScope,
  type PlanChoice,
} from '../lib/measuringPlan';
import { listMeasurePlan, saveMeasurePlan } from '../lib/measuringPlanDb';
import { termChoices, termLabel, type CustomGardenTerm } from '../lib/growSetup';
import { listGardenTerms, listGrowEquipment } from '../lib/growSetupDb';
import { GardenTermField } from './GardenTermField';

const TAB_COLOR = colors.tabGarden;

type Props = {
  plot: GardenPlot;
  /** Open on arrival, as the step after a new area is saved. */
  startOpen?: boolean;
  onSaved?: () => Promise<void> | void;
};

type Level = MeasureScope | 'none';

export function MeasuringPlanSection({ plot, startOpen = false, onSaved }: Props) {
  const [open, setOpen] = useState(startOpen);
  const [saved, setSaved] = useState<PlanChoice[]>([]);
  const [choices, setChoices] = useState<Record<string, Level>>({});
  const [terms, setTerms] = useState<CustomGardenTerm[]>([]);
  const [lit, setLit] = useState(false);
  const [suggested, setSuggested] = useState(false);

  const load = useCallback(async () => {
    const [rows, custom, equipment] = await Promise.all([listMeasurePlan(plot.id), listGardenTerms(), listGrowEquipment(plot.id)]);
    setSaved(rows.map((row) => ({ measurement: row.measurement, scope: row.scope })));
    setTerms(custom);
    setLit(equipment.some((piece) => piece.kind === 'light' && !piece.retiredAt));
  }, [plot.id]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load]),
  );

  // Opening sets the ticks from what is saved, or from the starting point
  // for this kind of area when nothing is.
  const fill = useCallback(() => {
    const from = saved.length > 0 ? saved : suggestedPlan(plot.locationType, lit);
    setSuggested(saved.length === 0);
    setChoices(Object.fromEntries(from.map((row) => [row.measurement, row.scope])));
  }, [saved, plot.locationType, lit]);

  useEffect(() => {
    if (open) fill();
    // Filled again only when what is saved or the area's lights change.
  }, [open, fill]);

  const labelOf = (code: string) => termLabel('measurement_kind', code, terms) ?? code;
  const rows = termChoices('measurement_kind', terms);
  // A measurement already set here stays on screen even once taken off
  // the list, so it can be unticked.
  const extra = saved.filter((row) => !rows.some((entry) => entry.code === row.measurement));

  async function handleSave() {
    const picked: PlanChoice[] = Object.entries(choices)
      .filter(([, level]) => level !== 'none')
      .map(([measurement, level]) => ({ measurement, scope: level as MeasureScope }));
    await saveMeasurePlan(plot.id, picked);
    await load();
    setOpen(false);
    await onSaved?.();
  }

  function renderRow(code: string, label: string) {
    const level = choices[code] ?? 'none';
    const levels: { value: Level; label: string }[] = [
      { value: 'none', label: 'Not here' },
      { value: 'area', label: scopeLabel('area', plot.locationType) },
      { value: 'planting', label: 'Each planting' },
    ];
    return (
      <View key={code} style={styles.planRow}>
        <Text style={styles.bodyText}>{label}</Text>
        <View style={styles.pillRow}>
          {levels.map((entry) => {
            const on = level === entry.value;
            return (
              <TouchableOpacity
                key={entry.value}
                onPress={() => setChoices((current) => ({ ...current, [code]: entry.value }))}
                style={[styles.pill, on ? { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR } : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.pillText, on ? styles.pillTextOn : null]}>{entry.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide what is measured here' : 'What Is Measured Here'}</Text>
      </TouchableOpacity>
      {!open ? (
        <Text style={styles.captionText}>{planSummary(saved, labelOf, plot.locationType)}</Text>
      ) : (
        <View style={styles.nested}>
          <Text style={styles.captionText}>{PLAN_HOW}</Text>
          {suggested ? <Text style={styles.captionText}>{suggestionNote(plot.locationType)}</Text> : null}
          {rows.map((entry) => renderRow(entry.code, entry.label))}
          {extra.map((row) => renderRow(row.measurement, labelOf(row.measurement)))}
          <GardenTermField
            list="measurement_kind"
            label="Something else"
            selected={null}
            onSelect={(code) => {
              if (code) setChoices((current) => ({ ...current, [code]: current[code] && current[code] !== 'none' ? current[code] : 'area' }));
            }}
            terms={terms}
            onTermsChanged={load}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save What Is Measured</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.linkText}>{startOpen && saved.length === 0 ? 'Later' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, marginVertical: 4 },
  nested: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  planRow: { gap: 4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
