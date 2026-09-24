import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { sortByLabel } from '../lib/choiceOrder';
import type { GardenPlanting, GardenPlot } from '../lib/db';
import {
  checkReading,
  describeReading,
  unitChoices,
  type GardenReading,
  type ReadingDraft,
} from '../lib/growingConditions';
import {
  addGardenReading,
  deleteGardenReading,
  getConditionsSetup,
  listGardenReadings,
} from '../lib/growingConditionsDb';
import { termLabel, type CustomGardenTerm } from '../lib/growSetup';
import { AppTextInput } from './AppTextInput';
import { GardenTermField } from './GardenTermField';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { makeTabBandStyles, TabBand } from './TabBand';

// Growing Conditions, a lens of Garden (2026-09-23).
//
// Stage 0 of the sensor work, and the reason it comes first: eleven garden
// tables held what was planted, spent, picked and eaten, and not one held a
// measurement of the conditions any of it grew in. A soil moisture figure is
// worth the same whether it arrived over Wi-Fi or was read off a cheap meter
// pushed into the bed, so the record is built before any radio is, and every
// later way of filling it writes the same rows.
//
// The record lives here and the months live on Trends > Growing Conditions,
// which is the rule the 2026-09-23 push runs on. One band per measurement,
// because what somebody wants to see is how one thing has been reading.
//
// What can be measured is an open list (measurement_kind in
// garden_custom_terms, through GardenTermField), so somebody measuring
// something nobody thought of records it under a name they chose. The unit
// picker needs no list of its own: it offers that kind's built-in units plus
// any unit already recorded against it, and a unit typed here is stored as
// text on the reading, so there is nothing to orphan.

const TAB_COLOR = colors.tabGarden;
const band = makeTabBandStyles(TAB_COLOR);
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const NO_PLOT = '__none__';
const NO_PLANTING = '__none__';
const ADD_UNIT = '__add_unit__';
const SHOWN_AT_FIRST = 8;

function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function emptyDraft(): ReadingDraft {
  return { plotId: null, plantingId: null, measurement: null, value: '', unit: null, measuredOn: todayDateString(), note: '' };
}

export function GrowingConditionsLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const folds = useBandFolds();
  const [areas, setAreas] = useState<GardenPlot[]>([]);
  const [plantings, setPlantings] = useState<GardenPlanting[]>([]);
  const [terms, setTerms] = useState<CustomGardenTerm[]>([]);
  const [readings, setReadings] = useState<GardenReading[]>([]);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<ReadingDraft>(emptyDraft());
  const [newUnit, setNewUnit] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const today = todayDateString();

  const load = useCallback(async () => {
    const [setup, rows] = await Promise.all([getConditionsSetup(), listGardenReadings()]);
    setAreas(setup.areas);
    setPlantings(setup.plantings);
    setTerms(setup.terms);
    setReadings(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const areaOptions = useMemo(
    () => [
      { label: 'No area in particular', value: NO_PLOT },
      ...sortByLabel(areas.map((area) => ({ label: area.name, value: area.id }))),
    ],
    [areas],
  );

  const plantingOptions = useMemo(() => {
    if (!draft.plotId) return [];
    const mine = plantings.filter((planting) => planting.plotId === draft.plotId && planting.status === 'growing');
    if (mine.length === 0) return [];
    return [
      { label: 'The area as a whole', value: NO_PLANTING },
      ...sortByLabel(mine.map((planting) => ({ label: planting.foodName, value: planting.id }))),
    ];
  }, [draft.plotId, plantings]);

  // The units already recorded against the picked measurement, so the picker
  // offers what this person actually uses.
  const unitOptions = useMemo(() => {
    if (!draft.measurement) return [];
    const recorded = readings.filter((reading) => reading.measurement === draft.measurement).map((reading) => reading.unit);
    const choices = unitChoices(draft.measurement, recorded).map((unit) => ({ label: unit, value: unit }));
    return [...choices, { label: 'Add a unit of your own', value: ADD_UNIT }];
  }, [draft.measurement, readings]);

  // One group per measurement, newest reading first, which is the order the
  // bands stand in.
  const groups = useMemo(() => {
    const byMeasurement = new Map<string, GardenReading[]>();
    for (const reading of readings) {
      const bucket = byMeasurement.get(reading.measurement);
      if (bucket) bucket.push(reading);
      else byMeasurement.set(reading.measurement, [reading]);
    }
    return [...byMeasurement.entries()]
      .map(([measurement, rows]) => ({
        measurement,
        label: termLabel('measurement_kind', measurement, terms) ?? measurement,
        rows,
      }))
      .sort((a, b) => b.rows[0].measuredOn.localeCompare(a.rows[0].measuredOn) || a.label.localeCompare(b.label));
  }, [readings, terms]);

  async function handleSave() {
    const check = checkReading(draft);
    if (!check.ok) {
      setProblem(check.problem);
      return;
    }
    await addGardenReading({
      plotId: draft.plotId,
      plantingId: draft.plantingId,
      measurement: draft.measurement as string,
      value: Number(draft.value.trim()),
      unit: draft.unit as string,
      measuredOn: draft.measuredOn,
      note: draft.note,
    });
    // The area, the measurement and the unit are kept, since the next reading
    // is usually the same meter in the same bed on another day.
    setDraft({ ...draft, value: '', note: '', measuredOn: todayDateString() });
    setProblem(null);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteGardenReading(id);
    await load();
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Record a Reading</Text>
        {recording ? (
          <>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Area</Text>
              <PopoverSelect
                options={areaOptions}
                selected={draft.plotId ?? NO_PLOT}
                onSelect={(value) => setDraft({ ...draft, plotId: value === NO_PLOT ? null : value, plantingId: null })}
                tabColor={TAB_COLOR}
                width={220}
              />
            </View>
            {plantingOptions.length > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>About</Text>
                <PopoverSelect
                  options={plantingOptions}
                  selected={draft.plantingId ?? NO_PLANTING}
                  onSelect={(value) => setDraft({ ...draft, plantingId: value === NO_PLANTING ? null : value })}
                  tabColor={TAB_COLOR}
                  width={220}
                />
              </View>
            ) : null}
            <GardenTermField
              list="measurement_kind"
              label="Measured"
              selected={draft.measurement}
              onSelect={(value) => setDraft({ ...draft, measurement: value, unit: null })}
              terms={terms}
              onTermsChanged={load}
              showHelp
            />
            {draft.measurement ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Figure</Text>
                  <AppTextInput
                    style={[styles.textInput, styles.shortInput]}
                    value={draft.value}
                    onChangeText={(value) => setDraft({ ...draft, value })}
                    placeholder="24.5"
                    keyboardType="numeric"
                  />
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <PopoverSelect
                    options={unitOptions}
                    selected={draft.unit}
                    onSelect={(value) => {
                      if (value === ADD_UNIT) {
                        setNewUnit('');
                        return;
                      }
                      setNewUnit(null);
                      setDraft({ ...draft, unit: value });
                    }}
                    tabColor={TAB_COLOR}
                    width={130}
                    placeholder="Pick a unit"
                  />
                </View>
                {newUnit !== null ? (
                  <View style={styles.formCard}>
                    <Text style={styles.fieldLabel}>A unit of your own</Text>
                    <AppTextInput
                      style={[styles.textInput, styles.shortInput]}
                      value={newUnit}
                      onChangeText={setNewUnit}
                      placeholder="kPa"
                    />
                    <Text style={styles.captionText}>
                      It is kept on the readings recorded in it and is on this measurement&apos;s list from then on. Figures
                      in one unit are never turned into another unless the two mean the same quantity, so a reading in a
                      unit of your own is charted on its own terms.
                    </Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: newUnit.trim() ? PRIMARY_BUTTON_BACKGROUND : colors.border }]}
                        disabled={!newUnit.trim()}
                        onPress={() => {
                          setDraft({ ...draft, unit: newUnit.trim() });
                          setNewUnit(null);
                        }}
                      >
                        <Text style={styles.primaryButtonText}>Use It</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setNewUnit(null)}>
                        <Text style={styles.linkText}>Back</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Read on</Text>
              <AppTextInput
                style={[styles.textInput, styles.dateInput]}
                value={draft.measuredOn}
                onChangeText={(measuredOn) => setDraft({ ...draft, measuredOn })}
                placeholder="YYYY-MM-DD"
              />
              <TouchableOpacity onPress={() => setDraft({ ...draft, measuredOn: todayDateString() })}>
                <Text style={styles.linkText}>Today</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Note</Text>
            <AppTextInput
              style={styles.textInput}
              value={draft.note}
              onChangeText={(note) => setDraft({ ...draft, note })}
              placeholder="Taken at root depth, two days after rain"
            />
            {problem ? <Text style={styles.errorText}>{problem}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>Save It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setRecording(false);
                  setProblem(null);
                  setNewUnit(null);
                }}
              >
                <Text style={styles.linkText}>Done</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.captionText}>
              Soil moisture, soil and air temperature, humidity, pH, light, EC, rain, what you watered, CO2, or anything
              else you measure. A figure read off a meter in your hand counts the same as one from a sensor, so this is
              worth keeping whether or not you ever wire anything up.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => setRecording(true)}>
                <Text style={styles.primaryButtonText}>+ Record a Reading</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {groups.length === 0 ? (
        <View style={[band.boxMuted, styles.card]}>
          <Text style={styles.emptyText}>Nothing measured yet.</Text>
        </View>
      ) : (
        groups.map((group) => {
          const open = !!showAll[group.measurement];
          const shown = open ? group.rows : group.rows.slice(0, SHOWN_AT_FIRST);
          return (
            <TabBand
              key={group.measurement}
              folds={folds}
              color={TAB_COLOR}
              id={`garden:conditions:${group.measurement}`}
              title={group.label}
              icon="thermometer-outline"
              count={group.rows.length}
            >
              <View style={styles.eventList}>
                {shown.map((reading) => (
                  <View key={reading.id} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.bodyText}>{describeReading(reading, today)}</Text>
                      <Text style={styles.captionText}>
                        {reading.plotName ?? 'No area in particular'}
                        {reading.note ? `. ${reading.note}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(reading.id)}>
                      <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {group.rows.length > SHOWN_AT_FIRST ? (
                  <TouchableOpacity onPress={() => setShowAll({ ...showAll, [group.measurement]: !open })}>
                    <Text style={styles.linkText}>{open ? 'Show fewer' : `Show all ${group.rows.length}`}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TabBand>
          );
        })
      )}

      {/* The record stays here and the months live on Trends, the rule the
          2026-09-23 push runs on. */}
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Over a longer stretch</Text>
        <Text style={styles.captionText}>
          One measurement month by month, what you are measuring and how recently, and which areas have readings against
          them and which have none.
        </Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/trends', params: { openTrendsLens: 'conditions' } })}>
          <Text style={styles.linkText}>Open Growing Conditions on Trends</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: HOME_BAND_GAP },
  card: { gap: 8 },
  cardTitle: { ...typography.sectionTitle, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  emptyText: { ...typography.body, ...textShadow, color: colors.textSecondary, textAlign: 'center' },
  formCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 },
  eventList: { gap: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  shortInput: { width: 110 },
  dateInput: { width: 140 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
