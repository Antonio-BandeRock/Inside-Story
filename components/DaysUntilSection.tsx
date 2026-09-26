// Days Until counters: under one garden area on the Plots & Plantings
// lens, every counter across the garden on Garden's Days Until lens, the
// free-form ones on Home, and both kinds together on Life's Days Until
// lens.
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
// past, until it is marked done, which keeps it as the record of how long
// the thing took. The arithmetic and every sentence are in
// lib/countdown.ts; Home's cards read the running ones through the same
// functions.
//
// Since 1.0.42.13 the phone reminds on the day a counter lands (dated
// reminder kind 'countdown', lib/reminderSources.ts). Adding, finishing or
// removing a counter reconciles the queued reminders straight away, so a
// counter marked done on its eve does not still ring the next morning.
//
// Two scopes since 1.0.42.14 ("Add a Days Until counter to the Garden hub
// quick access"). Given a plot, this is that area's section, as before.
// Given none, it is the whole garden: every counter under an area still
// in use, each row naming its area, and the form asks which area first
// (the plantings offered follow that choice), so a counter can be started
// from the Garden hub without finding the area on Plots & Plantings.
//
// Since 1.0.42.15 ("Add a Days Until counter to the Home screen quick
// access") the whole-garden scope reads its areas here, and reloads
// whenever its screen comes into focus, so a counter marked done on
// Garden is gone from Home on the way back. Home takes the compact form:
// the running counters only, five at most, the same form to start one,
// and one line to the lens for the rest.
//
// Two more scopes since 1.0.49.7, when a counter stopped having to be
// about the garden: "Days Until should be something that is also
// available in a free form allowing the user to create their own Days
// Until for something that we don't have covered in the app in various
// places where it might be necessary or available." 'free' is the
// counters tied to nothing, which is what Home's Life card shows and
// starts. 'everything' is both kinds in one list, ordered by when they
// land rather than by which tab they came from, which is Life's Days
// Until lens: a row says where its counter belongs, and the form starts a
// free-form one unless a garden area is picked for it.

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
  freeAsAny,
  gardenAsAny,
  sortCountdowns,
  type AnyCountdown,
} from '../lib/countdown';
import {
  addGardenCountdown,
  deleteGardenCountdown,
  listCurrentGardenCountdowns,
  listGardenCountdowns,
  listRunningGardenCountdowns,
  setGardenCountdownDone,
} from '../lib/gardenCountdownDb';
import {
  addCountdown,
  deleteCountdown,
  listCountdowns,
  listEveryCountdown,
  listEveryRunningCountdown,
  listRunningCountdowns,
  setCountdownDone,
} from '../lib/countdownDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';
import { RecordPhotos } from './RecordPhotos';

const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const WHOLE_AREA = '__whole_area__';
const NO_AREA = '__anything__';
// How many running counters a Home card shows before pointing at the lens.
const COMPACT_LIMIT = 5;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Which counters this instance holds. 'garden' is the original: one area
 *  when a plot is given, the whole garden when none is. */
export type CountdownScope = 'garden' | 'free' | 'everything';

type Props = {
  /** One area's counters, on Plots & Plantings. Garden scope only. */
  plot?: GardenPlot;
  /** That area's plantings, offered when tying a counter to one. */
  plantings?: GardenPlanting[];
  scope?: CountdownScope;
  /** The colour of the tab this is rendered on. */
  tabColor?: string;
  /** A Home card: the running counters only, five at most, with the rest
   *  a tap away on the lens. */
  compact?: boolean;
  /** Called after any change, so the area can re-read what is recorded
   *  under it (a counter counts). */
  onChanged?: () => void | Promise<void>;
  /** A past area reads its counters and changes nothing. */
  readOnly?: boolean;
  /** Off when the band around this already says Days Until. */
  showHeading?: boolean;
};

export function DaysUntilSection({
  plot,
  plantings,
  scope = 'garden',
  tabColor = colors.tabGarden,
  compact = false,
  onChanged,
  readOnly = false,
  showHeading = true,
}: Props) {
  const router = useRouter();
  // Garden scope with no plot is the whole garden: every counter under an
  // area still in use, and the areas themselves read here for the form.
  const wholeGarden = scope === 'garden' && !plot;
  // The two scopes where a counter need not belong to an area at all.
  const offersFree = scope === 'free' || scope === 'everything';
  // Which scopes need the area list loaded for the form.
  const needsAreas = wholeGarden || scope === 'everything';
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [items, setItems] = useState<AnyCountdown[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [days, setDays] = useState('');
  const [startedOn, setStartedOn] = useState(todayDateString());
  const [plotId, setPlotId] = useState<string>(plot?.id ?? (scope === 'everything' ? NO_AREA : ''));
  const [plantingId, setPlantingId] = useState<string>(WHOLE_AREA);
  // Whole garden and everything: the plantings of whichever area is
  // picked, read when the pick changes. One area's plantings arrive as a
  // prop.
  const [pickedPlantings, setPickedPlantings] = useState<GardenPlanting[]>([]);
  const [error, setError] = useState<string | null>(null);

  const areaId = plot?.id;
  const load = useCallback(async () => {
    const today = todayDateString();
    if (areaId) {
      const rows = await listGardenCountdowns(areaId);
      setItems(rows.map((row) => gardenAsAny(row, { namesArea: false })));
      return;
    }
    if (scope === 'free') {
      const rows = compact ? await listRunningCountdowns() : await listCountdowns();
      setItems(rows.map(freeAsAny));
      return;
    }
    if (scope === 'everything') {
      const [rows, areas] = await Promise.all([
        compact ? listEveryRunningCountdown(today) : listEveryCountdown(today),
        listGardenPlots(),
      ]);
      setItems(rows);
      setPlots(areas);
      return;
    }
    const [rows, areas] = await Promise.all([
      compact ? listRunningGardenCountdowns() : listCurrentGardenCountdowns(),
      listGardenPlots(),
    ]);
    setItems(rows.map((row) => gardenAsAny(row)));
    setPlots(areas);
  }, [areaId, compact, scope]);

  // On focus rather than on mount, so Home's card and the lens both read
  // what happened on another screen the moment the person comes back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Alphabetical, like every chooser list of names. Anything is the fixed
  // first entry where a counter need not belong to an area at all.
  const plotOptions = useMemo(() => {
    const areas = sortByLabel(plots.map((p) => ({ label: p.name, value: p.id })));
    return scope === 'everything' ? [{ label: 'Anything', value: NO_AREA }, ...areas] : areas;
  }, [plots, scope]);

  // The first area is picked until the person picks another; an area
  // that has gone (to Past Areas, say) gives way to the first again.
  // Under 'everything' the first entry is Anything, which is the default
  // there and never goes away.
  useEffect(() => {
    if (!needsAreas) return;
    if (plotId && plotOptions.some((option) => option.value === plotId)) return;
    setPlotId(plotOptions[0]?.value ?? (scope === 'everything' ? NO_AREA : ''));
    setPlantingId(WHOLE_AREA);
  }, [needsAreas, plotOptions, plotId, scope]);

  useEffect(() => {
    if (!needsAreas) return;
    let cancelled = false;
    if (!plotId || plotId === NO_AREA) {
      setPickedPlantings([]);
      return;
    }
    listGardenPlantings(plotId).then((rows) => {
      if (!cancelled) setPickedPlantings(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [needsAreas, plotId]);

  const offeredPlantings = needsAreas ? pickedPlantings : (plantings ?? []);
  // Free-form is what this counter is when nothing ties it to an area.
  const startingFree = scope === 'free' || (scope === 'everything' && plotId === NO_AREA);

  function clearForm() {
    setName('');
    setAbout('');
    setDays('');
    setStartedOn(todayDateString());
    setPlantingId(WHOLE_AREA);
    setError(null);
    setAdding(false);
  }

  async function handleSave() {
    const problem = countdownFormProblem({ name, days, startedOn });
    if (problem) {
      setError(problem);
      return;
    }
    if (startingFree) {
      await addCountdown({ name, about, startedOn, days: Number(days) });
    } else {
      if (!plotId || plotId === NO_AREA) {
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
    }
    clearForm();
    await load();
    void syncReminderNotifications();
    if (onChanged) await onChanged();
  }

  async function handleDone(item: AnyCountdown) {
    if (item.kind === 'free') await setCountdownDone(item.id, !item.doneAt);
    else await setGardenCountdownDone(item.id, !item.doneAt);
    await load();
    void syncReminderNotifications();
  }

  async function handleRemove(item: AnyCountdown) {
    if (item.kind === 'free') await deleteCountdown(item.id);
    else await deleteGardenCountdown(item.id);
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
  // Garden scope with no area yet has nowhere to put a counter. The other
  // scopes always have somewhere, since Anything needs nothing to exist
  // first.
  const noAreaYet = wholeGarden && plotOptions.length === 0;
  const seeAllWhere = scope === 'garden' ? 'Garden > Days Until' : 'Life > Days Until';

  function openSeeAll() {
    if (scope === 'garden') router.push({ pathname: '/garden', params: { openGardenLens: 'daysUntil' } });
    else router.push({ pathname: '/life', params: { openLifeLens: 'daysUntil' } });
  }

  return (
    <View style={styles.section}>
      {showHeading ? <Text style={styles.heading}>Days Until</Text> : null}
      {items.length === 0 ? (
        <Text style={styles.captionText}>
          {noAreaYet
            ? 'A garden counter lives under an area. Add an area on Plots & Plantings first, then count the days to germination, transplanting out, the first harvest, or the cover coming off here.'
            : offersFree
              ? compact
                ? 'No counters running. Name anything and count the days to it: a passport in the post, a course starting, a cast coming off. The phone reminds you on the day.'
                : 'Name anything and count the days to it: a passport in the post, a course starting, a cast coming off, a batch of cider. The phone reminds you on the day, and a counter keeps counting past its day until you mark it done.'
              : compact
                ? 'No counters running. Name something and count the days to it: germination, transplanting out, the first harvest. The phone reminds you on the day.'
                : 'Name something and count the days to it: germination, transplanting out, the first harvest, the cover coming off. The phone reminds you on the day, and a counter keeps counting past its day until you mark it done.'}
        </Text>
      ) : null}
      {ordered.map((item) => {
        const figure = countdownFigure(item, today);
        const progress = countdownProgress(item, today);
        return (
          <View key={`${item.kind}_${item.id}`} style={styles.itemRow}>
            <Text style={[styles.figure, { color: tabColor }, item.doneAt ? styles.doneText : null]}>{figure}</Text>
            <View style={styles.itemText}>
              <Text style={[styles.bodyText, item.doneAt ? styles.doneText : null]}>
                {item.name}
                {item.where ? ` · ${item.where}` : ''}
              </Text>
              <Text style={styles.captionText}>{describeCountdown(item, today)}</Text>
              {compact || readOnly ? null : (
                <RecordPhotos ownerKind="countdown" ownerId={`${item.kind}_${item.id}`} tabColor={tabColor} title={item.name} />
              )}
              {!item.doneAt ? (
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: tabColor }]} />
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
        <View style={[styles.nestedForm, { borderLeftColor: tabColor }]}>
          {needsAreas ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{scope === 'everything' ? 'What it is for' : 'Area'}</Text>
              <PopoverSelect options={plotOptions} selected={plotId} onSelect={(value) => { setPlotId(value); setPlantingId(WHOLE_AREA); }} tabColor={tabColor} width={220} />
            </View>
          ) : null}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Days until what?</Text>
            <AppTextInput
              style={[styles.textInput, styles.wideInput]}
              value={name}
              onChangeText={setName}
              placeholder={startingFree ? 'Passport back, course starts, cast off' : 'Germination, transplant, first harvest'}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>How many days</Text>
            <AppTextInput style={[styles.textInput, styles.shortInput]} value={days} onChangeText={setDays} placeholder="14" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Started on</Text>
            <AppTextInput style={[styles.textInput, styles.dateInput]} value={startedOn} onChangeText={setStartedOn} placeholder="YYYY-MM-DD" />
          </View>
          {startingFree ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>About it</Text>
              <AppTextInput style={[styles.textInput, styles.wideInput]} value={about} onChangeText={setAbout} placeholder="A line to read under the name (optional)" />
            </View>
          ) : offeredPlantings.length > 0 ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>For</Text>
              <PopoverSelect options={plantingOptions} selected={plantingId} onSelect={setPlantingId} tabColor={tabColor} width={220} />
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
        <TouchableOpacity onPress={openSeeAll}>
          <Text style={styles.linkText}>
            {heldBack > 0
              ? `${heldBack} more running, and every counter, on ${seeAllWhere}`
              : `Every counter, finished ones too, on ${seeAllWhere}`}
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
  figure: { ...typography.bodyEmphasis, ...textShadow, width: 84 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  itemText: { flex: 1, minWidth: 160, gap: 2 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 2 },
  fill: { height: 4 },
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
  nestedForm: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, marginVertical: 4 },
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
