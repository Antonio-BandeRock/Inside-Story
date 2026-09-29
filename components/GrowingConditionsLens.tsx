import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { LightSensor } from 'expo-sensors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { sortByLabel } from '../lib/choiceOrder';
import { getStoredMeasurementSystem, type GardenPlanting, type GardenPlot } from '../lib/db';
import {
  checkReading,
  describeReading,
  describeVpdPair,
  pairVpdReadings,
  unitChoices,
  VPD_CODE,
  VPD_HOW,
  VPD_LABEL,
  VPD_LEAF_NOTE,
  VPD_PAIRING_NOTE,
  type GardenReading,
  type ReadingDraft,
} from '../lib/growingConditions';
import {
  addGardenReading,
  deleteGardenReading,
  getConditionsSetup,
  getLampRatios,
  listGardenReadings,
  saveLampRatio,
} from '../lib/growingConditionsDb';
import { termLabel, type CustomGardenTerm, type GrowEquipment } from '../lib/growSetup';
import { listAllGrowEquipmentInUse } from '../lib/growSetupDb';
import { detectMeasurementSystemFromLocale } from '../lib/measurement';
import { isDesktopApp } from '../lib/desktop/bridge';
import { phoneOnlyNotice } from '../lib/desktop/phoneOnly';
import {
  describeMeasurement,
  describePpfd,
  formatLux,
  LAMP_RATIO_HOW,
  LAMP_RATIO_MAX,
  LAMP_RATIO_MIN,
  lampRatioFromMaker,
  lampRatioKey,
  LIGHT_METER_DEVICE_NAME,
  LIGHT_METER_DISTANCE_HOW,
  LIGHT_METER_HOW,
  LIGHT_METER_INTERVAL_MS,
  LIGHT_METER_IPHONE,
  LIGHT_METER_LIMITS,
  LIGHT_METER_LISTEN_MS,
  LIGHT_METER_UNAVAILABLE,
  LIGHT_SOURCES,
  lightSource,
  likelyLightSource,
  luxToPpfd,
  meterFigure,
  meterNote,
  parseLampRatio,
  summarizeLightSamples,
  type DistanceUnit,
  type LightSampleSummary,
  type LightSourceCode,
} from '../lib/lightMeter';
import {
  COLOUR_BANDS,
  ratioFromColourShares,
  ratioFromPeaks,
  SPECTRUM_PEAKS_HOW,
  SPECTRUM_SENSOR_LIMIT,
  SPECTRUM_SHARES_HOW,
  type PeakText,
} from '../lib/lightSpectrum';
import { AppTextInput } from './AppTextInput';
import { NotesInput } from './NotesInput';
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
const NO_SOURCE = '__none__';
// The four ways of giving a light's spectrum (1.0.55.25). Colour shares open
// first, since that is what most spec sheets print.
type RatioWay = 'shares' | 'peaks' | 'maker' | 'typed';
const RATIO_WAYS: { value: RatioWay; label: string }[] = [
  { value: 'shares', label: 'Colour Shares' },
  { value: 'peaks', label: 'Diode Peaks' },
  { value: 'maker', label: "Maker's Lumens and PPF" },
  { value: 'typed', label: 'Type the Ratio' },
];
const SPECTRUM_FORMULA =
  "Each wavelength counts as 683 × V(λ) × 119.627 ÷ λ lux per µmol, where V(λ) is the eye's daylight curve (CIE 1924) and 119.627 ÷ λ turns a photon's energy into watts, averaged over the photons given from 400 to 700 nm.";
// Android is the one place the light sensor can be read: an iPhone never
// lets an app read it, and a computer (Windows or Mac) has none.
const METER_ON_THIS_DEVICE = Platform.OS === 'android' && !isDesktopApp();
const EMPTY_PEAKS: PeakText[] = [
  { nm: '', share: '' },
  { nm: '', share: '' },
  { nm: '', share: '' },
  { nm: '', share: '' },
];

function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// The light meter's state (I3, 1.0.55.17): idle, listening with the latest
// sample, finished with the sentence that describes it, or unable to read
// a sensor on this phone.
type MeterState =
  | { status: 'idle' }
  | { status: 'reading'; live: number | null }
  | { status: 'done'; summary: LightSampleSummary }
  | { status: 'unavailable'; line: string };

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
  const [meter, setMeter] = useState<MeterState>({ status: 'idle' });
  // True while the figure in the form is the one the phone measured, so it
  // is saved as coming from this phone; typing over it makes it a hand
  // reading again.
  const [fromPhone, setFromPhone] = useState(false);
  // What the phone last read, the light it was under and how far the lamp
  // was (1.0.55.18). The form's figure follows the unit: lux as read, or
  // PPFD worked out from it through that light's ratio.
  const [meterLux, setMeterLux] = useState<number | null>(null);
  const [pickedSource, setPickedSource] = useState<LightSourceCode | null>(null);
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('cm');
  const [lights, setLights] = useState<GrowEquipment[]>([]);
  // This lamp's lux-to-PPFD ratio (1.0.55.21), typed or worked out from the
  // maker's lumens and PPF, and remembered per area and kind of light.
  const [lampRatioText, setLampRatioText] = useState('');
  const [savedRatios, setSavedRatios] = useState<Record<string, number>>({});
  // Which way of giving this light's spectrum is open (1.0.55.23; always
  // shown since 1.0.55.25): colour shares, diode peaks, the maker's lumens
  // and PPF, or the ratio typed. Whatever it gives is used straight away.
  const [ratioWay, setRatioWay] = useState<RatioWay>('shares');
  const [shareTexts, setShareTexts] = useState({ blue: '', green: '', red: '' });
  const [peakTexts, setPeakTexts] = useState<PeakText[]>(EMPTY_PEAKS);
  // A lux figure typed from any light meter, turned into PPFD the same way
  // as the phone's (1.0.55.23), so an iPhone and the computer convert too.
  const [typedLuxText, setTypedLuxText] = useState('');
  const [makerLumens, setMakerLumens] = useState('');
  const [makerPpf, setMakerPpf] = useState('');
  const listening = useRef<{ remove: () => void; timer: ReturnType<typeof setTimeout> } | null>(null);
  const today = todayDateString();

  const stopListening = useCallback(() => {
    if (!listening.current) return;
    clearTimeout(listening.current.timer);
    listening.current.remove();
    listening.current = null;
  }, []);
  useEffect(() => stopListening, [stopListening]);

  // A few seconds of samples, the middle one kept, then the form filled in
  // lux. The area, the note and the day are left as they were.
  const measureLight = useCallback(async () => {
    stopListening();
    let available = false;
    try {
      available = await LightSensor.isAvailableAsync();
    } catch {
      available = false;
    }
    if (!available) {
      setMeter({ status: 'unavailable', line: LIGHT_METER_UNAVAILABLE });
      return;
    }
    const samples: number[] = [];
    setMeter({ status: 'reading', live: null });
    LightSensor.setUpdateInterval(LIGHT_METER_INTERVAL_MS);
    const subscription = LightSensor.addListener(({ illuminance }) => {
      samples.push(illuminance);
      setMeter({ status: 'reading', live: Math.round(illuminance) });
    });
    const timer = setTimeout(() => {
      stopListening();
      const summary = summarizeLightSamples(samples);
      if (!summary) {
        setMeter({ status: 'unavailable', line: 'The light sensor sent nothing in those few seconds. Try again, or type a figure in.' });
        return;
      }
      // The unit the form is set to is kept: the figure below follows it.
      setDraft((current) => ({ ...current, measurement: 'light', unit: current.unit ?? 'lux' }));
      setMeterLux(summary.lux);
      setFromPhone(true);
      setMeter({ status: 'done', summary });
    }, LIGHT_METER_LISTEN_MS);
    listening.current = { remove: () => subscription.remove(), timer };
  }, [stopListening]);

  const load = useCallback(async () => {
    const [setup, rows, equipment, system, ratios] = await Promise.all([
      getConditionsSetup(),
      listGardenReadings(),
      listAllGrowEquipmentInUse(),
      getStoredMeasurementSystem(),
      getLampRatios(),
    ]);
    setSavedRatios(ratios);
    setLights(equipment.filter((piece) => piece.kind === 'light'));
    setDistanceUnit((system ?? detectMeasurementSystemFromLocale()) === 'imperial' ? 'in' : 'cm');
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

  // The light the picked area is most likely under, used until the person
  // picks one.
  const suggestedSource = useMemo(() => {
    const area = areas.find((candidate) => candidate.id === draft.plotId);
    if (!area) return null;
    return likelyLightSource(
      area.locationType,
      lights.filter((piece) => piece.plotId === area.id),
    );
  }, [areas, lights, draft.plotId]);
  const source = pickedSource ?? suggestedSource;
  const sourceOptions = useMemo(
    () => [
      { label: 'Pick the light it is under', value: NO_SOURCE },
      ...sortByLabel(LIGHT_SOURCES.map((entry) => ({ label: entry.label, value: entry.code }))),
    ],
    [],
  );

  // The ratio remembered for this area and light fills the field whenever
  // either changes; a blank field means the kind's general figure is used.
  const ratioKey = lampRatioKey(draft.plotId, source);
  useEffect(() => {
    const remembered = ratioKey ? savedRatios[ratioKey] : undefined;
    setLampRatioText(remembered !== undefined ? String(remembered) : '');
    setRatioWay(remembered !== undefined ? 'typed' : 'shares');
  }, [ratioKey, savedRatios]);
  const makerRatio = lampRatioFromMaker(makerLumens, makerPpf);
  const sharesRatio = ratioFromColourShares(shareTexts);
  const peaksRatio = ratioFromPeaks(peakTexts);
  // The spectrum section stands under any light but the sun, whether or not
  // a light has been picked, and whatever the unit (1.0.55.25). Its ratio is
  // used as soon as it can be worked out, with no further step.
  const spectrumShown = draft.measurement === 'light' && source !== 'sun';
  const wayRatio =
    ratioWay === 'shares' ? sharesRatio : ratioWay === 'peaks' ? peaksRatio : ratioWay === 'maker' ? makerRatio : parseLampRatio(lampRatioText);
  const lampRatio = spectrumShown && wayRatio !== null ? parseLampRatio(String(wayRatio)) : null;
  const wayFilled =
    ratioWay === 'shares'
      ? Object.values(shareTexts).some((text) => text.trim() !== '')
      : ratioWay === 'peaks'
        ? peakTexts.some((row) => row.nm.trim() !== '' || row.share.trim() !== '')
        : ratioWay === 'maker'
          ? makerLumens.trim() !== '' || makerPpf.trim() !== ''
          : lampRatioText.trim() !== '';
  // With no light picked, a given spectrum is enough: it is treated as
  // another light with this ratio.
  const convSource: LightSourceCode | null = source ?? (lampRatio !== null ? 'other' : null);
  const typedLux = useMemo(() => {
    const trimmed = typedLuxText.trim().replace(',', '.');
    if (!trimmed) return null;
    const value = Number(trimmed);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }, [typedLuxText]);

  // The last unit light was recorded in, so the form opens on it rather
  // than on lux every time.
  const lastLightUnit = useMemo(
    () => readings.find((reading) => reading.measurement === 'light')?.unit ?? 'lux',
    [readings],
  );

  // While the figure is the phone's, it follows the unit and the light:
  // switching lux to PPFD, or picking another light, works it out again.
  useEffect(() => {
    if (!fromPhone || meterLux === null) return;
    const figure = meterFigure(meterLux, draft.unit, convSource, lampRatio) ?? '';
    setDraft((current) => (current.value === figure ? current : { ...current, value: figure }));
  }, [fromPhone, meterLux, draft.unit, convSource, lampRatio]);

  // A typed lux figure fills the form as PPFD while the unit is PPFD and
  // the figure is not the phone's.
  useEffect(() => {
    if (fromPhone || typedLux === null || draft.unit !== 'PPFD') return;
    const figure = meterFigure(typedLux, draft.unit, convSource, lampRatio) ?? '';
    setDraft((current) => (current.value === figure ? current : { ...current, value: figure }));
  }, [fromPhone, typedLux, draft.unit, convSource, lampRatio]);

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

  // Air VPD worked out from the temperature and humidity readings above
  // (I18). Nothing is stored, so deleting either reading changes it.
  const vpd = useMemo(() => pairVpdReadings(readings), [readings]);
  const showVpd = vpd.pairs.length > 0 || (groups.some((group) => group.measurement === 'air_temperature') && groups.some((group) => group.measurement === 'humidity'));

  // What the spectrum section says about the ratio: where it came from and
  // the formula behind it, or why none is worked out yet (1.0.55.25).
  function spectrumLine(): string {
    const kind = lightSource(source);
    if (lampRatio !== null) {
      const how =
        ratioWay === 'maker'
          ? "Lumens divided by PPF, both off the maker's sheet."
          : ratioWay === 'typed'
            ? 'The ratio as given.'
            : SPECTRUM_FORMULA;
      const kept = ratioKey ? ' It is remembered for this area and light when a PPFD reading is saved.' : '';
      return `This light: ${lampRatio} lux to one µmol, used in place of any general figure. ${how}${kept}`;
    }
    if (wayRatio !== null && wayRatio < LAMP_RATIO_MIN) {
      return `That spectrum gives about ${wayRatio} lux to one µmol, under the ${LAMP_RATIO_MIN} kept: so little of that light shows as lux that a quantum sensor is the way to read its PPFD.`;
    }
    if (wayFilled) {
      return ratioWay === 'maker'
        ? `Those two give a ratio outside ${LAMP_RATIO_MIN} to ${LAMP_RATIO_MAX}, or one is missing; check both are from the same line of the sheet.`
        : ratioWay === 'typed'
          ? `A ratio from ${LAMP_RATIO_MIN} to ${LAMP_RATIO_MAX} is kept, so check the figure.`
          : 'Each figure needs to be a number, and each peak between 400 and 700 nm.';
    }
    if (kind?.luxPerPpfd) {
      return `No spectrum given yet, so the general figure for ${kind.phrase} is used: ${kind.luxPerPpfd} lux to one µmol.`;
    }
    if (kind) return 'This light has no general figure, so lux turns into PPFD once its spectrum or ratio is given.';
    return 'Pick the light above, or give its spectrum here, and lux turns into PPFD from it.';
  }

  // The formula at work on the figure in hand: the phone's, a typed lux
  // figure, or the Figure field while the unit is lux.
  function conversionLine(): string | null {
    const figure = Number(draft.value.trim().replace(',', '.'));
    const lux =
      fromPhone && meterLux !== null
        ? meterLux
        : typedLux !== null
          ? typedLux
          : draft.unit === 'lux' && draft.value.trim() && Number.isFinite(figure) && figure >= 0
            ? figure
            : null;
    if (lux === null || !convSource) return null;
    const ppfd = luxToPpfd(lux, convSource, lampRatio);
    const ratio = lampRatio ?? lightSource(convSource)?.luxPerPpfd ?? null;
    if (ppfd === null || ratio === null) return null;
    const unitNote = draft.unit === 'PPFD' ? '' : ' Set the unit above to PPFD to record it that way.';
    return `${formatLux(lux)} ÷ ${ratio} = about ${ppfd} µmol/m²/s PPFD.${unitNote}`;
  }

  async function handleSave() {
    const check = checkReading(draft);
    if (!check.ok) {
      setProblem(check.problem);
      return;
    }
    const noteLux = fromPhone ? meterLux : draft.unit === 'PPFD' ? typedLux : null;
    await addGardenReading({
      plotId: draft.plotId,
      plantingId: draft.plantingId,
      measurement: draft.measurement as string,
      value: Number(draft.value.trim()),
      unit: draft.unit as string,
      measuredOn: draft.measuredOn,
      note:
        noteLux !== null
          ? [meterNote({ lux: noteLux, unit: draft.unit, source: convSource, distance, distanceUnit, lampRatio }), draft.note.trim()]
              .filter(Boolean)
              .join(' ')
          : draft.note,
      ...(fromPhone && (draft.unit === 'lux' || draft.unit === 'PPFD')
        ? { source: 'device' as const, deviceName: LIGHT_METER_DEVICE_NAME }
        : {}),
    });
    if (noteLux !== null && draft.unit === 'PPFD' && ratioKey && (lampRatio !== null || !lampRatioText.trim())) {
      await saveLampRatio(ratioKey, lampRatio);
    }
    setFromPhone(false);
    setMeterLux(null);
    setTypedLuxText('');
    setMeter({ status: 'idle' });
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
                onSelect={(value) => {
                  setDraft({ ...draft, plotId: value === NO_PLOT ? null : value, plantingId: null });
                  setPickedSource(null);
                }}
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
              onSelect={(value) => {
                setDraft({ ...draft, measurement: value, unit: value === 'light' ? lastLightUnit : null });
                setFromPhone(false);
                setMeterLux(null);
                setMeter({ status: 'idle' });
              }}
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
                    onChangeText={(value) => {
                      setDraft({ ...draft, value });
                      setFromPhone(false);
                    }}
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
                      if (value !== 'lux' && value !== 'PPFD') setFromPhone(false);
                    }}
                    tabColor={TAB_COLOR}
                    width={130}
                    placeholder="Pick a unit"
                  />
                </View>
                {draft.measurement === 'light' ? (
                  <View style={styles.formCard}>
                    {isDesktopApp() ? (
                      <Text style={styles.captionText}>{phoneOnlyNotice('lightMeter').message}</Text>
                    ) : !METER_ON_THIS_DEVICE ? (
                      <Text style={styles.captionText}>{LIGHT_METER_IPHONE}</Text>
                    ) : (
                      <Text style={styles.captionText}>{LIGHT_METER_HOW}</Text>
                    )}
                      <>
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>Under</Text>
                          <PopoverSelect
                            options={sourceOptions}
                            selected={source ?? NO_SOURCE}
                            onSelect={(value) => setPickedSource(value === NO_SOURCE ? null : (value as LightSourceCode))}
                            tabColor={TAB_COLOR}
                            width={240}
                          />
                        </View>
                        <Text style={styles.captionText}>
                          {lightSource(source)?.help ??
                            'The phone reads lux. The light it is under is what turns lux into PPFD, since each kind of light has a different ratio.'}
                        </Text>
                        {lightSource(source)?.lamp ? (
                          <>
                            <View style={styles.fieldRow}>
                              <Text style={styles.fieldLabel}>Lamp above ({distanceUnit}, optional)</Text>
                              <AppTextInput
                                style={[styles.textInput, styles.shortInput]}
                                value={distance}
                                onChangeText={setDistance}
                                placeholder={distanceUnit === 'cm' ? '45' : '18'}
                                keyboardType="numeric"
                              />
                            </View>
                            <Text style={styles.captionText}>{LIGHT_METER_DISTANCE_HOW}</Text>
                          </>
                        ) : null}
                        {source === 'sun' ? (
                          <Text style={styles.captionText}>
                            Sunlight is turned into PPFD at 54 lux to one µmol. Under a grow light, pick it in Under above
                            and a place to give its spectrum opens here.
                          </Text>
                        ) : null}
                        {spectrumShown ? (
                          <View style={styles.spectrumCard}>
                            <Text style={[styles.fieldLabel, { color: TAB_COLOR }]}>This Light&apos;s Spectrum</Text>
                            <Text style={styles.captionText}>
                              The phone and most light meters read lux, which counts light the way the eye sees it. Plants
                              use photons, so turning lux into PPFD takes this light&apos;s spectrum. Give it any of these
                              ways and it is used straight away.
                            </Text>
                            <View style={styles.wayRow}>
                              {RATIO_WAYS.map((way) => {
                                const on = ratioWay === way.value;
                                return (
                                  <TouchableOpacity
                                    key={way.value}
                                    onPress={() => setRatioWay(way.value)}
                                    style={[styles.wayPill, on ? { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR } : null]}
                                  >
                                    <Text style={[styles.wayPillText, on ? styles.wayPillTextOn : null]}>{way.label}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {ratioWay === 'shares' ? (
                              <>
                                <Text style={styles.captionText}>{SPECTRUM_SHARES_HOW}</Text>
                                {COLOUR_BANDS.map((colourBand) => (
                                  <View key={colourBand.key} style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>{colourBand.label}</Text>
                                    <AppTextInput
                                      style={[styles.textInput, styles.shortInput]}
                                      value={shareTexts[colourBand.key]}
                                      onChangeText={(text) => setShareTexts((current) => ({ ...current, [colourBand.key]: text }))}
                                      placeholder={colourBand.key === 'blue' ? '20' : colourBand.key === 'green' ? '45' : '35'}
                                      keyboardType="numeric"
                                    />
                                  </View>
                                ))}
                              </>
                            ) : ratioWay === 'peaks' ? (
                              <>
                                <Text style={styles.captionText}>{SPECTRUM_PEAKS_HOW}</Text>
                                {peakTexts.map((row, index) => (
                                  <View key={index} style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>Peak (nm)</Text>
                                    <AppTextInput
                                      style={[styles.textInput, styles.shortInput]}
                                      value={row.nm}
                                      onChangeText={(text) =>
                                        setPeakTexts((current) => current.map((entry, at) => (at === index ? { ...entry, nm: text } : entry)))
                                      }
                                      placeholder={index === 0 ? '450' : index === 1 ? '660' : ''}
                                      keyboardType="numeric"
                                    />
                                    <Text style={styles.fieldLabel}>share</Text>
                                    <AppTextInput
                                      style={[styles.textInput, styles.shortInput]}
                                      value={row.share}
                                      onChangeText={(text) =>
                                        setPeakTexts((current) => current.map((entry, at) => (at === index ? { ...entry, share: text } : entry)))
                                      }
                                      placeholder={index === 0 ? '20' : index === 1 ? '80' : ''}
                                      keyboardType="numeric"
                                    />
                                  </View>
                                ))}
                              </>
                            ) : ratioWay === 'maker' ? (
                              <>
                                <Text style={styles.captionText}>{LAMP_RATIO_HOW}</Text>
                                <View style={styles.fieldRow}>
                                  <Text style={styles.fieldLabel}>Lumens (or lm/W)</Text>
                                  <AppTextInput
                                    style={[styles.textInput, styles.shortInput]}
                                    value={makerLumens}
                                    onChangeText={setMakerLumens}
                                    placeholder="52000"
                                    keyboardType="numeric"
                                  />
                                </View>
                                <View style={styles.fieldRow}>
                                  <Text style={styles.fieldLabel}>PPF in µmol/s (or µmol/J)</Text>
                                  <AppTextInput
                                    style={[styles.textInput, styles.shortInput]}
                                    value={makerPpf}
                                    onChangeText={setMakerPpf}
                                    placeholder="850"
                                    keyboardType="numeric"
                                  />
                                </View>
                              </>
                            ) : (
                              <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Lux to one µmol</Text>
                                <AppTextInput
                                  style={[styles.textInput, styles.shortInput]}
                                  value={lampRatioText}
                                  onChangeText={setLampRatioText}
                                  placeholder={String(lightSource(source)?.luxPerPpfd ?? 60)}
                                  keyboardType="numeric"
                                />
                              </View>
                            )}
                            <Text style={styles.bodyText}>{spectrumLine()}</Text>
                            {conversionLine() ? <Text style={styles.bodyText}>{conversionLine()}</Text> : null}
                            {source === 'red_blue_led' ? <Text style={styles.captionText}>{SPECTRUM_SENSOR_LIMIT}</Text> : null}
                          </View>
                        ) : null}
                        {draft.unit === 'PPFD' ? (
                          <>
                            <View style={styles.fieldRow}>
                              <Text style={styles.fieldLabel}>
                                {METER_ON_THIS_DEVICE ? 'Or lux from another meter' : 'Lux from a light meter'}
                              </Text>
                              <AppTextInput
                                style={[styles.textInput, styles.shortInput]}
                                value={typedLuxText}
                                onChangeText={(text) => {
                                  setTypedLuxText(text);
                                  setFromPhone(false);
                                }}
                                placeholder="12000"
                                keyboardType="numeric"
                              />
                            </View>
                            <Text style={styles.captionText}>
                              {typedLux !== null && !fromPhone
                                ? describePpfd(typedLux, convSource, lampRatio)
                                : 'Type the lux a light meter read and it is worked out as PPFD in the figure above, through the light it is under.'}
                            </Text>
                          </>
                        ) : null}
                        {METER_ON_THIS_DEVICE ? (
                          <>
                        {meter.status === 'reading' ? (
                          <Text style={styles.bodyText}>
                            Reading{meter.live !== null ? `: ${meter.live.toLocaleString('en-US')} lux` : ''}
                          </Text>
                        ) : meter.status === 'done' ? (
                          <Text style={styles.bodyText}>
                            {draft.unit === 'PPFD'
                              ? describePpfd(meter.summary.lux, convSource, lampRatio)
                              : describeMeasurement(meter.summary)}
                          </Text>
                        ) : meter.status === 'unavailable' ? (
                          <Text style={styles.bodyText}>{meter.line}</Text>
                        ) : null}
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: meter.status === 'reading' ? colors.border : PRIMARY_BUTTON_BACKGROUND }]}
                            disabled={meter.status === 'reading'}
                            onPress={() => void measureLight()}
                          >
                            <Text style={styles.primaryButtonText}>
                              {meter.status === 'done' ? 'Measure Again' : 'Measure With This Phone'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.captionText}>{LIGHT_METER_LIMITS}</Text>
                          </>
                        ) : null}
                      </>
                  </View>
                ) : null}
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
            <NotesInput
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
                  stopListening();
                  setRecording(false);
                  setProblem(null);
                  setNewUnit(null);
                  setMeter({ status: 'idle' });
                  setFromPhone(false);
                  setMeterLux(null);
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
              {METER_ON_THIS_DEVICE ? (
                <TouchableOpacity
                  onPress={() => {
                    setDraft({ ...draft, measurement: 'light', unit: lastLightUnit, value: '' });
                    setRecording(true);
                    void measureLight();
                  }}
                >
                  <Text style={styles.linkText}>Measure the Light Here</Text>
                </TouchableOpacity>
              ) : null}
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

      {showVpd ? (
        <TabBand
          folds={folds}
          color={TAB_COLOR}
          id="garden:conditions:vpd"
          title={`${VPD_LABEL}, Worked Out`}
          icon="water-outline"
          count={vpd.pairs.length}
        >
          <View style={styles.eventList}>
            {vpd.pairs.length === 0 ? (
              <Text style={styles.bodyText}>No air temperature and humidity recorded for the same area on the same day yet.</Text>
            ) : null}
            {(showAll[VPD_CODE] ? vpd.pairs : vpd.pairs.slice(0, SHOWN_AT_FIRST)).map((pair) => (
              <View key={`${pair.temperatureId}+${pair.humidityId}`} style={styles.rowText}>
                <Text style={styles.bodyText}>{describeVpdPair(pair, today)}</Text>
                <Text style={styles.captionText}>{pair.plotName ?? 'An area since removed'}</Text>
              </View>
            ))}
            {vpd.pairs.length > SHOWN_AT_FIRST ? (
              <TouchableOpacity onPress={() => setShowAll({ ...showAll, [VPD_CODE]: !showAll[VPD_CODE] })}>
                <Text style={styles.linkText}>{showAll[VPD_CODE] ? 'Show fewer' : `Show all ${vpd.pairs.length}`}</Text>
              </TouchableOpacity>
            ) : null}
            {vpd.notes.map((note, index) => (
              <Text key={index} style={styles.captionText}>
                {note}
              </Text>
            ))}
            <Text style={styles.captionText}>{VPD_HOW}</Text>
            <Text style={styles.captionText}>{VPD_LEAF_NOTE}</Text>
            <Text style={styles.captionText}>{VPD_PAIRING_NOTE}</Text>
          </View>
        </TabBand>
      ) : null}

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
  spectrumCard: { borderRadius: 10, borderWidth: 1, borderColor: TAB_COLOR, backgroundColor: colors.surface, padding: 12, gap: 8 },
  wayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wayPill: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 6 },
  wayPillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  wayPillTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
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
