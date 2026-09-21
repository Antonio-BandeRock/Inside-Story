// Days Until counters under one garden area, on the Plots & Plantings lens.
//
// Added 2026-09-21 by direct request: "create a Days Until counter the
// user can create, Name, and start a timer in days. All this to be tied
// to Plots & Planting. These will be available from the Home screen in
// Garden quick access."
//
// The person names a counter (Days to germination, Transplant out, First
// harvest), says how many days, and the day it started (today unless they
// change it), and can tie it to one planting in the area. Each counter
// then reads with the days left, Today on the day, or the days over once
// past, until it is marked done, which keeps it under the area as the
// record of how long the thing took. The arithmetic and every sentence
// are in lib/gardenCountdown.ts; Home's Days Until card reads the running
// ones across every area through the same functions.
//
// Since 1.0.42.13 the phone reminds on the day a counter lands (dated
// reminder kind 'countdown', lib/reminderSources.ts). Adding, finishing or
// removing a counter reconciles the queued reminders straight away, so a
// counter marked done on its eve does not still ring the next morning.

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { GardenPlanting, GardenPlot } from '../lib/db';
import {
  countdownFigure,
  countdownFormProblem,
  countdownProgress,
  describeCountdown,
  sortCountdowns,
  type GardenCountdownRow,
} from '../lib/gardenCountdown';
import { addGardenCountdown, deleteGardenCountdown, listGardenCountdowns, setGardenCountdownDone } from '../lib/gardenCountdownDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const WHOLE_AREA = '__whole_area__';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  plot: GardenPlot;
  plantings: GardenPlanting[];
  /** Called after any change, so the area can re-read what is recorded
   *  under it (a counter counts). */
  onChanged?: () => void | Promise<void>;
  /** A past area reads its counters and changes nothing. */
  readOnly?: boolean;
};

export function DaysUntilSection({ plot, plantings, onChanged, readOnly = false }: Props) {
  const [items, setItems] = useState<GardenCountdownRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [days, setDays] = useState('');
  const [startedOn, setStartedOn] = useState(todayDateString());
  const [plantingId, setPlantingId] = useState<string>(WHOLE_AREA);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await listGardenCountdowns(plot.id));
  }, [plot.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    const problem = countdownFormProblem({ name, days, startedOn });
    if (problem) {
      setError(problem);
      return;
    }
    await addGardenCountdown({
      plotId: plot.id,
      plantingId: plantingId === WHOLE_AREA ? null : plantingId,
      name,
      startedOn,
      days: Number(days),
    });
    setName('');
    setDays('');
    setStartedOn(todayDateString());
    setPlantingId(WHOLE_AREA);
    setError(null);
    setAdding(false);
    await load();
    void syncReminderNotifications();
    if (onChanged) await onChanged();
  }

  async function handleDone(item: GardenCountdownRow) {
    await setGardenCountdownDone(item.id, !item.doneAt);
    await load();
    void syncReminderNotifications();
  }

  async function handleRemove(item: GardenCountdownRow) {
    await deleteGardenCountdown(item.id);
    await load();
    void syncReminderNotifications();
    if (onChanged) await onChanged();
  }

  const today = todayDateString();
  const ordered = sortCountdowns(items, today);
  if (readOnly && items.length === 0) return null;
  // The whole area is the fixed first entry; the plantings after it read
  // alphabetically, like every chooser list of names.
  const plantingOptions = [
    { label: 'The whole area', value: WHOLE_AREA },
    ...[...plantings]
      .sort((a, b) => a.foodName.toLowerCase().localeCompare(b.foodName.toLowerCase()))
      .map((planting) => ({ label: planting.varietyNote ? `${planting.foodName} (${planting.varietyNote})` : planting.foodName, value: planting.id })),
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Days Until</Text>
      {items.length === 0 ? (
        <Text style={styles.captionText}>Name something and count the days to it: germination, transplanting out, the first harvest, the cover coming off. The phone reminds you on the day, and a counter keeps counting past its day until you mark it done.</Text>
      ) : null}
      {ordered.map((item) => {
        const figure = countdownFigure(item, today);
        const progress = countdownProgress(item, today);
        return (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.figure, item.doneAt ? styles.doneText : null]}>{figure}</Text>
            <View style={styles.itemText}>
              <Text style={[styles.bodyText, item.doneAt ? styles.doneText : null]}>
                {item.name}
                {item.plantingName ? ` · ${item.plantingName}` : ''}
              </Text>
              <Text style={styles.captionText}>{describeCountdown(item, today)}</Text>
              {!item.doneAt ? (
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
              ) : null}
            </View>
            {!readOnly ? (
              <>
                <TouchableOpacity onPress={() => handleDone(item)}>
                  <Text style={styles.linkText}>{item.doneAt ? 'Start again' : 'Done'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item)}>
                  <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        );
      })}

      {readOnly ? null : adding ? (
        <View style={styles.nestedForm}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Days until what?</Text>
            <AppTextInput style={[styles.textInput, styles.wideInput]} value={name} onChangeText={setName} placeholder="Germination, transplant, first harvest" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>How many days</Text>
            <AppTextInput style={[styles.textInput, styles.shortInput]} value={days} onChangeText={setDays} placeholder="14" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Started on</Text>
            <AppTextInput style={[styles.textInput, styles.dateInput]} value={startedOn} onChangeText={setStartedOn} placeholder="YYYY-MM-DD" />
          </View>
          {plantings.length > 0 ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>For</Text>
              <PopoverSelect options={plantingOptions} selected={plantingId} onSelect={setPlantingId} tabColor={TAB_COLOR} width={220} />
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Start Counting</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAdding(false); setError(null); }}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => setAdding(true)}>
          <Text style={styles.primaryButtonText}>+ Add a Days Until Counter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  heading: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  doneText: { color: colors.textMuted },
  figure: { ...typography.bodyEmphasis, color: TAB_COLOR, ...textShadow, width: 84 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  itemText: { flex: 1, minWidth: 160, gap: 2 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 2 },
  fill: { height: 4, backgroundColor: TAB_COLOR },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  shortInput: { width: 90 },
  wideInput: { flex: 1, minWidth: 160 },
  dateInput: { width: 130 },
  nestedForm: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR, marginVertical: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
