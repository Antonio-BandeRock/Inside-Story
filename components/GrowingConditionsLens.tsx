import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { LightSensor } from 'expo-sensors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { sortByLabel } from '../lib/choiceOrder';
import { areaPath } from '../lib/gardenAreaNesting';
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
import {
  groupReadingsByArea,
  planSummary,
  plannedFor,
  scopeLabel,
  whereLine,
  wholeWord,
  type MeasurePlanRow,
} from '../lib/measuringPlan';
import { listMeasurePlans } from '../lib/measuringPlanDb';
import { explainNotYet } from '../lib/notYet';
import { AppTextInput } from './AppTextInput';
import { MeasuringPlanSection } from './MeasuringPlanSection';
import { QuickAreaForm } from './QuickAreaForm';
import { ReadingImportForm } from './ReadingImportForm';
import { EcowittGatewaySection } from './EcowittGatewaySection';
import { NotesInput } from './NotesInput';
import { GardenTermField } from './GardenTermField';
import { HOME_BAND_ACCENT_WIDTH } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { makeTabBandStyles, TabBand } from './TabBand';
import { ThumbRow } from './ThumbRow';
import { ThumbEndRow } from './ThumbEndRow';

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
// which is the rule the 2026-09-23 push runs on. Since 1.0.55.32 the
// record is read area by area, by direct request ("Growing conditions need
// to be more on a per area way of looking at it"): one band per area, the
// area as a whole first and then each planting in it, each with its
// measurements. Recording a reading, or measuring the light, first asks
// which area and which planting it is for, and then offers what that area
// is set to measure at that level (lib/measuringPlan.ts) before anything
// else.
//
// What can be measured is an open list (measurement_kind in
// garden_custom_terms, through GardenTermField), so somebody measuring
// something nobody thought of records it under a name they chose. The unit
// picker needs no list of its own: it offers that kind's built-in units plus
// any unit already recorded against it, and a unit typed here is stored as
// text on the reading, so there is nothing to orphan.

const TAB_COLOR = colors.tabGarden;
// 1.0.61.7, extended to every Garden lens in 1.0.61.8: the calm look
// (CalmBands in components/HomeSectionBand.tsx), bands a left-accent width
// apart with no hairlines.
const band = makeTabBandStyles(TAB_COLOR, { calm: true });
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const NO_PLOT = '__none__';
const NO_PLANTING = '__none__';
const ADD_UNIT = '__add_unit__';
const SHOWN_AT_FIRST = 4;
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
  // The short New area form, opened from the where step (1.0.55.33).
  const [addingArea, setAddingArea] = useState(false);
  const [plantings, setPlantings] = useState<GardenPlanting[]>([]);
  const [terms, setTerms] = useState<CustomGardenTerm[]>([]);
  const [readings, setReadings] = useState<GardenReading[]>([]);
  const [recording, setRecording] = useState(false);
  // Import Readings from a File (I19), and the line saying what the last
  // import added.
  const [importing, setImporting] = useState(false);
  const [importLine, setImportLine] = useState<string | null>(null);
  // The reading form asks where first (1.0.55.32): 'where' picks the area
  // and planting, 'what' is the measurement and figure. lightNext is set
  // when the form was opened from Measure the Light Here, so the where
  // step's button starts the meter.
  const [step, setStep] = useState<'where' | 'what'>('where');
  const [lightNext, setLightNext] = useState(false);
  const [plans, setPlans] = useState<MeasurePlanRow[]>([]);
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
    const [setup, rows, equipment, system, ratios, planRows] = await Promise.all([
      getConditionsSetup(),
      listGardenReadings(),
      listAllGrowEquipmentInUse(),
      getStoredMeasurementSystem(),
      getLampRatios(),
      listMeasurePlans(),
    ]);
    setPlans(planRows);
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

  // The ratio remembered for this light fills the field whenever it
  // changes; a blank field means the kind's general figure is used. A
  // planting can sit under its own lamp, so with a planting picked the
  // ratio is kept for that planting, and the area's is used until it has
  // one (1.0.55.32).
  const ratioKey = lampRatioKey(draft.plantingId ?? draft.plotId, source);
  const areaRatioKey = lampRatioKey(draft.plotId, source);
  useEffect(() => {
    const remembered = ratioKey ? savedRatios[ratioKey] ?? (areaRatioKey ? savedRatios[areaRatioKey] : undefined) : undefined;
    setLampRatioText(remembered !== undefined ? String(remembered) : '');
    setRatioWay(remembered !== undefined ? 'typed' : 'shares');
  }, [ratioKey, areaRatioKey, savedRatios]);
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

  // The last unit each measurement was recorded in, so the form opens on
  // it; light opens on lux the first time.
  const lastUnitFor = useCallback(
    (measurement: string) =>
      readings.find((reading) => reading.measurement === measurement)?.unit ?? (measurement === 'light' ? 'lux' : null),
    [readings],
  );
  const lastLightUnit = lastUnitFor('light') ?? 'lux';

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
      ...sortByLabel(areas.map((area) => ({ label: areaPath(area.id, areas), value: area.id }))),
    ],
    [areas],
  );

  const pickedArea = areas.find((area) => area.id === draft.plotId) ?? null;
  const pickedNested = !!pickedArea?.insidePlotId;
  const pickedPath = pickedArea ? areaPath(pickedArea.id, areas) : null;
  const plantingOptions = useMemo(() => {
    if (!draft.plotId) return [];
    const area = areas.find((entry) => entry.id === draft.plotId);
    const kind = area?.locationType ?? null;
    const mine = plantings.filter((planting) => planting.plotId === draft.plotId && planting.status === 'growing');
    if (mine.length === 0) return [];
    return [
      { label: scopeLabel('area', kind, !!area?.insidePlotId), value: NO_PLANTING },
      ...sortByLabel(mine.map((planting) => ({ label: planting.foodName, value: planting.id }))),
    ];
  }, [draft.plotId, plantings, areas]);

  const measurementLabel = useCallback(
    (code: string) => termLabel('measurement_kind', code, terms) ?? code,
    [terms],
  );
  // What the picked area is set to measure at the level picked: for the
  // area as a whole, or for each planting.
  const areaPlan = useMemo(
    () => plans.filter((row) => row.plotId === draft.plotId).map((row) => ({ measurement: row.measurement, scope: row.scope })),
    [plans, draft.plotId],
  );
  const planned = plannedFor(areaPlan, draft.plantingId ? 'planting' : 'area');
  const plantingName = draft.plantingId ? plantings.find((planting) => planting.id === draft.plantingId)?.foodName ?? null : null;

  // Every area with what was read in it, the area as a whole first, then
  // each planting, then each measurement.
  const byArea = useMemo(
    () => groupReadingsByArea({ readings, areas, plantings, labelOf: measurementLabel }),
    [readings, areas, plantings, measurementLabel],
  );

  // The units already recorded against the picked measurement, so the picker
  // offers what this person actually uses.
  const unitOptions = useMemo(() => {
    if (!draft.measurement) return [];
    const recorded = readings.filter((reading) => reading.measurement === draft.measurement).map((reading) => reading.unit);
    const choices = unitChoices(draft.measurement, recorded).map((unit) => ({ label: unit, value: unit }));
    return [...choices, { label: 'Add a unit of your own', value: ADD_UNIT }];
  }, [draft.measurement, readings]);


  // Air VPD worked out from the temperature and humidity readings above
  // (I18). Nothing is stored, so deleting either reading changes it.
  const vpd = useMemo(() => pairVpdReadings(readings), [readings]);
  const showVpd =
    vpd.pairs.length > 0 ||
    (readings.some((reading) => reading.measurement === 'air_temperature') && readings.some((reading) => reading.measurement === 'humidity'));

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

  function resetMeter() {
    stopListening();
    setMeter({ status: 'idle' });
    setFromPhone(false);
    setMeterLux(null);
  }

  // Record a Reading or Measure the Light Here: the first question is which
  // area, and which planting, the reading is for. An area band's own
  // buttons come in with that area already picked.
  function startReading(light: boolean, plotId?: string | null) {
    resetMeter();
    setProblem(null);
    setNewUnit(null);
    setLightNext(light);
    setPickedSource(null);
    setDraft((current) => ({
      ...current,
      plotId: plotId !== undefined ? plotId : current.plotId,
      plantingId: plotId !== undefined && plotId !== current.plotId ? null : current.plantingId,
      measurement: light ? 'light' : null,
      unit: light ? lastLightUnit : null,
      value: '',
    }));
    setStep('where');
    setAddingArea(false);
    setRecording(true);
  }

  // A new area made from the where step is picked for the reading.
  async function handleAreaSaved(id: string) {
    setAddingArea(false);
    await load();
    setDraft((current) => ({ ...current, plotId: id, plantingId: null }));
    setPickedSource(null);
  }

  function handleWhereNext() {
    setStep('what');
    if (lightNext) {
      setDraft((current) => ({ ...current, measurement: 'light', unit: current.unit ?? lastLightUnit }));
      if (METER_ON_THIS_DEVICE) void measureLight();
    }
  }

  function pickMeasurement(value: string | null) {
    setDraft({ ...draft, measurement: value, unit: value ? lastUnitFor(value) : null, value: '' });
    resetMeter();
  }

  async function handleDelete(id: string) {
    await deleteGardenReading(id);
    await load();
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Record a Reading</Text>
        {recording && step === 'where' ? (
          <>
            <Text style={styles.bodyText}>{lightNext ? 'Which area is this light for?' : 'Which area is this reading for?'}</Text>
            {areas.length === 0 && !addingArea ? (
              <Text style={styles.captionText}>
                No garden area is set up yet. Add one here and the reading goes with it, or record this one with no
                area in particular.
              </Text>
            ) : null}
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
              {addingArea ? null : (
                <TouchableOpacity onPress={() => setAddingArea(true)}>
                  <Text style={styles.linkText}>Add an area</Text>
                </TouchableOpacity>
              )}
            </View>
            {addingArea ? (
              <QuickAreaForm
                areas={areas}
                caption="Saving picks this area for the reading. Its lights, fans, heating and cooling, size and what is measured there can be filled in under Plots & Plantings whenever you like."
                backLabel="Back to the reading"
                onSaved={handleAreaSaved}
                onBack={() => setAddingArea(false)}
              />
            ) : null}
            {plantingOptions.length > 0 ? (
              <>
                <Text style={styles.captionText}>
                  One figure for {wholeWord(pickedArea?.locationType ?? null, pickedNested)} as a whole, such as
                  the air, or one for a single planting, such as its soil or the light it sits under?
                </Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>For</Text>
                  <PopoverSelect
                    options={plantingOptions}
                    selected={draft.plantingId ?? NO_PLANTING}
                    onSelect={(value) => {
                      setDraft({ ...draft, plantingId: value === NO_PLANTING ? null : value });
                      setPickedSource(null);
                    }}
                    tabColor={TAB_COLOR}
                    width={220}
                  />
                </View>
              </>
            ) : draft.plotId ? (
              <Text style={styles.captionText}>Nothing is growing here now, so this is for the area as a whole.</Text>
            ) : null}
            {pickedArea ? (
              <Text style={styles.captionText}>{planSummary(areaPlan, measurementLabel, pickedArea.locationType, pickedNested)}.</Text>
            ) : null}
            {addingArea ? null : (
              <ThumbRow primary="first" style={styles.actionRow}>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleWhereNext}>
                <Text style={styles.primaryButtonText}>
                  {lightNext && METER_ON_THIS_DEVICE ? 'Measure the Light' : 'Next'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  resetMeter();
                  setRecording(false);
                  setProblem(null);
                }}
              >
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </ThumbRow>
            )}
          </>
        ) : recording ? (
          <>
            <ThumbEndRow style={styles.fieldRow}>
              <Text style={styles.bodyText}>{whereLine(pickedPath, plantingName, pickedArea?.locationType ?? null, pickedNested)}</Text>
              <TouchableOpacity
                onPress={() => {
                  resetMeter();
                  setLightNext(draft.measurement === 'light');
                  setStep('where');
                }}
              >
                <Text style={styles.linkText}>Change</Text>
              </TouchableOpacity>
            </ThumbEndRow>
            {planned.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Measured here</Text>
                <View style={styles.wayRow}>
                  {planned.map((code) => {
                    const on = draft.measurement === code;
                    return (
                      <TouchableOpacity
                        key={code}
                        onPress={() => pickMeasurement(code)}
                        style={[styles.wayPill, on ? { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR } : null]}
                      >
                        <Text style={[styles.wayPillText, on ? styles.wayPillTextOn : null]}>{measurementLabel(code)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}
            <GardenTermField
              list="measurement_kind"
              label={planned.length > 0 ? 'Or something else' : 'Measured'}
              selected={draft.measurement}
              onSelect={pickMeasurement}
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
                    <ThumbRow primary="first" style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: newUnit.trim() ? PRIMARY_BUTTON_BACKGROUND : colors.border }]}
                        onPress={() => {
                          if (!newUnit.trim()) return explainNotYet('Type the unit first, for example kPa.');
                          setDraft({ ...draft, unit: newUnit.trim() });
                          setNewUnit(null);
                        }}
                      >
                        <Text style={styles.primaryButtonText}>Use It</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setNewUnit(null)}>
                        <Text style={styles.linkText}>Back</Text>
                      </TouchableOpacity>
                    </ThumbRow>
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
                  resetMeter();
                  setRecording(false);
                  setProblem(null);
                  setNewUnit(null);
                }}
              >
                <Text style={styles.linkText}>Done</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : importing ? (
          <ReadingImportForm
            areas={areas}
            plantings={plantings}
            terms={terms}
            preferF={distanceUnit === 'in'}
            onAreaAdded={load}
            onImported={(line) => {
              setImporting(false);
              setImportLine(line);
              void load();
            }}
            onCancel={() => setImporting(false)}
          />
        ) : (
          <>
            <Text style={styles.captionText}>
              Soil moisture, soil and air temperature, humidity, pH, light, EC, rain, what you watered, CO2, or anything
              else you measure. A figure read off a meter in your hand counts the same as one from a sensor, so this is
              worth keeping whether or not you ever wire anything up.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => startReading(false)}>
                <Text style={styles.primaryButtonText}>+ Record a Reading</Text>
              </TouchableOpacity>
              {METER_ON_THIS_DEVICE ? (
                <TouchableOpacity onPress={() => startReading(true)}>
                  <Text style={styles.linkText}>Measure the Light Here</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => {
                setImportLine(null);
                setImporting(true);
              }}
            >
              <Text style={styles.linkText}>Import Readings from a File</Text>
            </TouchableOpacity>
            {importLine ? <Text style={styles.bodyText}>{importLine}</Text> : null}
          </>
        )}
      </View>

      {byArea.length === 0 ? (
        <View style={[band.boxMuted, styles.card]}>
          <Text style={styles.emptyText}>Nothing measured yet, and no garden area is set up yet.</Text>
        </View>
      ) : (
        byArea.map((area) => {
          const areaKey = area.plotId ?? 'none';
          const plot = area.plotId && !area.removed ? areas.find((entry) => entry.id === area.plotId) ?? null : null;
          return (
            <TabBand
              key={areaKey}
              folds={folds}
              color={TAB_COLOR}
              id={`garden:conditions:area:${areaKey}`}
              title={area.removed ? `${area.name} (since removed)` : area.name}
              icon="leaf-outline"
              count={area.count}
            >
              <View style={styles.eventList}>
                {plot ? (
                  <>
                    <MeasuringPlanSection plot={plot} onSaved={load} />
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                        onPress={() => startReading(false, plot.id)}
                      >
                        <Text style={styles.primaryButtonText}>+ Record a Reading Here</Text>
                      </TouchableOpacity>
                      {METER_ON_THIS_DEVICE ? (
                        <TouchableOpacity onPress={() => startReading(true, plot.id)}>
                          <Text style={styles.linkText}>Measure the Light Here</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                ) : null}
                {area.targets.length === 0 ? <Text style={styles.captionText}>Nothing measured here yet.</Text> : null}
                {area.targets.map((target) => (
                  <View key={target.plantingId ?? 'whole'} style={styles.eventList}>
                    <Text style={[styles.fieldLabel, { color: TAB_COLOR }]}>{target.name}</Text>
                    {target.measurements.map((group) => {
                      const showKey = `${areaKey}|${target.plantingId ?? 'whole'}|${group.measurement}`;
                      const open = !!showAll[showKey];
                      const shown = open ? group.rows : group.rows.slice(0, SHOWN_AT_FIRST);
                      return (
                        <View key={group.measurement} style={styles.eventList}>
                          <Text style={styles.fieldLabel}>{group.label}</Text>
                          {shown.map((reading) => (
                            <View key={reading.id} style={styles.row}>
                              <View style={styles.rowText}>
                                <Text style={styles.bodyText}>{describeReading(reading, today)}</Text>
                                {reading.note ? <Text style={styles.captionText}>{reading.note}</Text> : null}
                              </View>
                              <TouchableOpacity onPress={() => handleDelete(reading.id)}>
                                <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                          {group.rows.length > SHOWN_AT_FIRST ? (
                            <TouchableOpacity onPress={() => setShowAll({ ...showAll, [showKey]: !open })}>
                              <Text style={styles.linkText}>{open ? 'Show fewer' : `Show all ${group.rows.length}`}</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
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

      <TabBand folds={folds} color={TAB_COLOR} id="garden:conditions:gateways" title="Sensors on Your Network" icon="wifi-outline">
        <EcowittGatewaySection areas={areas} plantings={plantings} onAreaAdded={load} onRead={() => void load()} />
      </TabBand>

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
  body: { paddingBottom: 32, gap: HOME_BAND_ACCENT_WIDTH },
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
