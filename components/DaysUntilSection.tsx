// Days Until counters: under one garden area on the Plots & Plantings
// lens, or every counter across the garden on the Days Until lens.
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
//
// Two scopes since 1.0.42.14 ("Add a Days Until counter to the Garden hub
// quick access"). Given a plot, this is that area's section, as before.
// Given plots instead, it is the whole garden: every counter under an
// area still in use, each row naming its area, and the form asks which
// area first (the plantings offered follow that choice), so a counter can
// be started from the Garden hub without finding the area on Plots &
// Plantings. A counter still belongs to an area either way.
//
// Since 1.0.42.15 ("Add a Days Until counter to the Home screen quick
// access") the whole-garden scope reads its own areas, so Home's Days
// Until card and the Days Until lens both render this with no props, and
// it reloads whenever its screen comes into focus, so a counter marked
// done on Garden is gone from Home on the way back. Home takes the
// compact form: the running counters only, five at most, the same form
// to start one, and one line to the lens for the rest.

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { listGardenPlantings, listGardenPlots, type GardenPlanting, type GardenPlot } from '../lib/db';
import { sortByLabel } from '../lib/choiceOrder';
import {
  countdownFigure,
  countdownFormProblem,
  countdownProgress,
  describeCountdown,
  sortCountdowns,
  type GardenCountdownRow,
} from '../lib/gardenCountdown';
import {
  addGardenCountdown,
  deleteGardenCountdown,
  listCurrentGardenCountdowns,
  listGardenCountdowns,
  listRunningGardenCountdowns,
  setGardenCountdownDone,
} from '../lib/gardenCountdownDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const WHOLE_AREA = '__whole_area__';
// How many running counters Home's card shows before pointing at the lens.
const COMPACT_LIMIT = 5;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  /** One area's counters, on Plots & Plantings. */
  plot?: GardenPlot;
  /** That area's plantings, offered when tying a counter to one. */
  plantings?: GardenPlanting[];
  /** Home's card: the running counters only, five at most, with the rest
   *  a tap away on the Days Until lens. Whole garden, so no plot. */
  compact?: boolean;
  /** Called after any change, so the area can re-read what is recorded
   *  under it (a counter counts). */
  onChanged?: () => void | Promise<void>;
  /** A past area reads its counters and changes nothing. */
  readOnly?: boolean;
  /** Off when the band around this already says Days Until. */
  showHeading?: boolean;
};

export function DaysUntilSection({ plot, plantings, compact = false, onChanged, readOnly = false, showHeading = true }: Props) {
  const router = useRouter();
  // Given no plot, this is the whole garden: every counter under an area
  // still in use, and the areas themselves read here for the form.
  const wholeGarden = !plot;
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [items, setItems] = useState<GardenCountdownRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [days, setDays] = useState('');
  const [startedOn, setStartedOn] = useState(todayDateString());
  const [plotId, setPlotId] = useState<string>(plot?.id ?? '');
  const [plantingId, setPlantingId] = useState<string>(WHOLE_AREA);
  // Whole garden only: the plantings of whichever area is picked, read
  // when the pick changes. One area's plantings arrive as a prop.
  const [pickedPlantings, setPickedPlantings] = useState<GardenPlanting[]>([]);
  const [error, setError] = useState<string | null>(null);

  const areaId = plot?.id;
  const load = useCallback(async () => {
    if (areaId) {
      setItems(await listGardenCountdowns(areaId));
      return;
    }
    const [rows, areas] = await Promise.all([
      compact ? listRunningGardenCountdowns() : listCurrentGardenCountdowns(),
      listGardenPlots(),
    ]);
    setItems(rows);
    setPlots(areas);
  }, [areaId, compact]);

  // On focus rather than on mount, so Home's card and the lens both read
  // what happened on another screen the moment the person comes back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Alphabetical, like every chooser list of names.
  const plotOptions = useMemo(() => sortByLabel(plots.map((p) => ({ label: p.name, value: p.id }))), [plots]);

  // The first area is picked until the person picks another; an area
  // that has gone (to Past Areas, say) gives way to the first again.
  useEffect(() => {
    if (!wholeGarden) return;
    if (plotId && plotOptions.some((option) => option.value === plotId)) return;
    setPlotId(plotOptions[0]?.value ?? '');
    setPlantingId(WHOLE_AREA);
  }, [wholeGarden, plotOptions, plotId]);

  useEffect(() => {
    if (!wholeGarden) return;
    let cancelled = false;
    if (!plotId) {
      setPickedPlantings([]);
      return;
    }
    listGardenPlantings(plotId).then((rows) => {
      if (!cancelled) setPickedPlantings(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [wholeGarden, plotId]);

  const offeredPlantings = wholeGarden ? pickedPlantings : (plantings ?? []);

  async function handleSave() {
    const problem = countdownFormProblem({ name, days, startedOn });
    if (problem) {
      setError(problem);
      return;
    }
    if (!plotId) {
      setError('Pick the area the counter is for.');
      return;
    }
    await addGardenCountdown({
      plotId,
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
  const sorted = sortCountdowns(items, today);
  const ordered = compact ? sorted.slice(0, COMPACT_LIMIT) : sorted;
  const heldBack = sorted.length - ordered.length;
  if (readOnly && items.length === 0) return null;
  // The whole area is the fixed first entry; the plantings after it read
  // alphabetically, like every chooser list of names.
  const plantingOptions = [
    { label: 'The whole area', value: WHOLE_AREA },
    ...[...offeredPlantings]
      .sort((a, b) => a.foodName.toLowerCase().localeCompare(b.foodName.toLowerCase()))
      .map((planting) => ({ label: planting.varietyNote ? `${planting.foodName} (${planting.varietyNote})` : planting.foodName, value: planting.id })),
  ];
  const noAreaYet = wholeGarden && plotOptions.length === 0;

  return (
    <View style={styles.section}>
      {showHeading ? <Text style={styles.heading}>Days Until</Text> : null}
      {items.length === 0 ? (
        <Text style={styles.captionText}>
          {noAreaYet
            ? 'A counter lives under a garden area. Add an area on Plots & Plantings first, then count the days to germination, transplanting out, the first harvest, or the cover coming off here.'
            : compact
              ? 'No counters running. Name something and count the days to it: germination, transplanting out, the first harvest. The phone reminds you on the day.'
              : 'Name something and count the days to it: germination, transplanting out, the first harvest, the cover coming off. The phone reminds you on the day, and a counter keeps counting past its day until you mark it done.'}
        </Text>
      ) : null}
      {ordered.map((item) => {
        const figure = countdownFigure(item, today);
        const progress = countdownProgress(item, today);
        const where = wholeGarden
          ? item.plantingName
            ? `${item.plantingName}, ${item.plotName}`
            : item.plotName
          : item.plantingName;
        return (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.figure, item.doneAt ? styles.doneText : null]}>{figure}</Text>
            <View style={styles.itemText}>
              <Text style={[styles.bodyText, item.doneAt ? styles.doneText : null]}>
                {item.name}
                {where ? ` · ${where}` : ''}
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
                {compact ? null : (
                  <TouchableOpacity onPress={() => handleRemove(item)}>
                    <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        );
      })}

      {readOnly || noAreaYet ? null : adding ? (
        <View style={styles.nestedForm}>
          {wholeGarden ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Area</Text>
              <PopoverSelect options={plotOptions} selected={plotId} onSelect={(value) => { setPlotId(value); setPlantingId(WHOLE_AREA); }} tabColor={TAB_COLOR} width={220} />
            </View>
          ) : null}
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
          {offeredPlantings.length > 0 ? (
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
      {compact && !noAreaYet ? (
        <TouchableOpacity onPress={() => router.push({ pathname: '/garden', params: { openGardenLens: 'daysUntil' } })}>
          <Text style={styles.linkText}>
            {heldBack > 0
              ? `${heldBack} more running, and every counter, on Garden > Days Until`
              : 'Every counter, finished ones too, on Garden > Days Until'}
          </Text>
        </TouchableOpacity>
      ) : null}
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
