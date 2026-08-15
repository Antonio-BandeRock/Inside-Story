import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PopoverSelect } from '../../components/PopoverSelect';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { TrendLineChart } from '../../components/TrendLineChart';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import {
  getDietaryReferenceIntakesForCurrentUser,
  getFoodIdentity,
  getLabResultTrend,
  getLabTests,
  getStoredMeasurementSystem,
  type LabResultRecord,
  type LabTest,
} from '../../lib/db';
import { kgToLb } from '../../lib/measurement';
import { nutrientStatusSeverity, type NutrientStatus } from '../../lib/nutrientAnalysis';
import {
  findFoodPatterns,
  PATTERN_WINDOW_HOURS,
  type FoodPatternCandidate,
  type PatternFinderResult,
  type PatternWindowHours,
} from '../../lib/patternFinder';
import { markPendingFoodTrialReturn } from '../../lib/pendingFoodTrialReturn';
import {
  getCheckinSeverityTrendSeries,
  getNutrientTrendSeries,
  getSixDimensionsFlagTrendSeries,
  getWeightTrendPoints,
  paddedTrendRange,
  type CheckinSeverityPoint,
  type TrendPoint,
} from '../../lib/trendAnalysis';
import { CORE_NUTRIENT_CODES } from './index';

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border to carry that
// identity. Matches the same rule applied there, 2026-07-27.
const TAB_COLOR = colors.tabTrends;

type TrendsLens = 'nutrients' | 'sixDs' | 'symptoms' | 'weight' | 'labs' | 'patterns';

// Shared across all three lenses' own Info content below -- the same
// caveat applies regardless of which chart you're looking at. Reworded
// 2026-08-15 once Pattern Finder actually shipped -- this used to say
// matching flares to specific foods "doesn't do yet," no longer true.
const TRENDS_PATTERN_CAVEAT_HELP: HelpSection = {
  heading: 'Finding patterns, not just charts',
  body: "This lens charts what you've already logged over time -- for the app to actually match flares to specific foods and surface what recurs, see the Pattern Finder lens.",
};

const TRENDS_LENSES: LensOption<TrendsLens>[] = [
  {
    key: 'nutrients',
    label: 'Nutrients',
    icon: 'nutrition-outline',
    help: [
      {
        heading: 'Nutrients',
        body: "Pick a nutrient to see its percent-of-target trend across the date range, with a dashed line at 100%. Only days with at least one logged meal are plotted, so days before you started logging don't show up as false zeros.",
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
  {
    key: 'sixDs',
    label: '6 Dimensions',
    icon: 'analytics-outline',
    help: [
      {
        heading: '6 Dimensions',
        body: 'How many 6-DFF flags (goitrogenic, high-risk, etc.) got logged per day, across the date range.',
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
  {
    key: 'symptoms',
    label: 'Symptoms & Flares',
    icon: 'pulse-outline',
    help: [
      {
        heading: 'Symptoms & Flares',
        body: 'Severity of every logged flare and food reaction from Signals, plotted by the date it happened.',
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
  {
    key: 'weight',
    label: 'Weight',
    icon: 'body-outline',
    help: [
      {
        heading: 'Weight',
        body: "Every reading you've logged on Profile, over time. The chart's own vertical range is scaled tight around your actual values, not pinned to zero, so real day-to-day movement is actually visible.",
      },
    ],
  },
  {
    key: 'labs',
    label: 'Labs',
    icon: 'flask-outline',
    help: [
      {
        heading: 'Labs',
        body: "Pick a test to see every result you've logged for it, over time, with a dashed line at the midpoint of its typical reference range where one exists. Log new results from Insights' own Labs lens.",
      },
    ],
  },
  {
    key: 'patterns',
    label: 'Pattern Finder',
    icon: 'search-outline',
    help: [
      {
        heading: 'Pattern Finder',
        body: "Looks at what you actually ate before each flare or reaction you've logged, and shows what shows up more than once. This is a count of what's already in your own data, not a diagnosis -- something showing up before 2 flares is worth a look; it's not proof of anything on its own.",
      },
      {
        heading: 'The lookback window',
        body: "How far back before a symptom counts as 'before it' varies by person and condition -- pick whichever window feels closest to how your own body actually reacts.",
      },
      {
        heading: 'Start a trial',
        body: "A food that shows up here can be sent straight into Signals as a real food trial -- the same deliberate, tracked way to actually test whether it's the real cause, rather than just guessing from this list.",
      },
    ],
  },
];

// Reported directly: "Is it tallying the past N days or the next N days?"
// Genuinely ambiguous with a bare "7d"/"30d"/"90d" pill and no other cue on
// screen. This has always looked backward (dateStringDaysAgo subtracts from
// today, see trendAnalysis.ts), it just never said so.
const DAY_RANGE_OPTIONS = [
  { value: 7, label: 'Last 7d' },
  { value: 30, label: 'Last 30d' },
  { value: 90, label: 'Last 90d' },
] as const;

// The real, established 1-4 severity wording from app/(tabs)/log.tsx's own
// SeverityPicker (SEVERITY_OPTIONS) -- reused here rather than a second,
// independently-worded scale, so a Y-axis label on the Symptoms chart says
// the same thing the person actually tapped when logging it.
const SEVERITY_LABELS: Record<number, string> = { 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Very severe' };

// Same green/yellow/red vocabulary the rest of the app uses for nutrient
// status (see index.tsx's nutrientRingColor (Home)) -- a nutrient's trend line
// should read the same color here as it does on Home/Insights, not a
// second, slightly different color scheme for the same status.
function nutrientStatusColor(status: NutrientStatus | null): string {
  if (status == null) return colors.primary;
  const severity = nutrientStatusSeverity(status);
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  return colors.primary;
}

function checkinColor(checkinType: CheckinSeverityPoint['checkinType']): string {
  return checkinType === 'flare' ? colors.danger : colors.statusYellow;
}

const TRENDS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page shows',
    body: "Nutrient intake, 6 Dimensions flags, and symptom/flare severity charted over a date range you pick, so slow changes that are invisible day-to-day become visible trends. Today's snapshot lives on Insights; this is the same kind of information, over time instead of just today.",
  },
  {
    heading: 'Nutrients',
    body: "Pick a nutrient to see its percent-of-target trend across the date range, with a dashed line at 100%. Only days with at least one logged meal are plotted, so days before you started logging don't show up as false zeros.",
  },
  {
    heading: '6 Dimensions',
    body: 'How many 6-DFF flags (goitrogenic, high-risk, etc.) got logged per day, across the date range.',
  },
  {
    heading: 'Symptoms & Flares',
    body: 'Severity of every logged flare and food reaction from Signals, plotted by the date it happened.',
  },
  {
    heading: 'Weight',
    body: "Every reading you've logged on Profile, over time, scaled tight around your actual values rather than pinned to zero.",
  },
  {
    heading: 'Labs',
    body: "Pick a test to see every result you've logged for it, over time, with a dashed line at its typical reference range's midpoint where one exists.",
  },
  {
    heading: 'Pattern Finder',
    body: "Looks at what you actually ate before each flare or reaction you've logged, and surfaces whatever shows up more than once -- a real count from your own data, not a diagnosis. Each food candidate carries a direct way to start a real trial and actually test it.",
  },
];

export default function TrendsScreen() {
  useRegisterScreenHelp('Trends', TRENDS_HELP_SECTIONS, '/trends');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  const [lens, setLens] = useState<TrendsLens>('nutrients');
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [selectedNutrient, setSelectedNutrient] = useState<string>(CORE_NUTRIENT_CODES[0]);
  const [nutrientLabels, setNutrientLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [nutrientSeries, setNutrientSeries] = useState<Awaited<ReturnType<typeof getNutrientTrendSeries>> | null>(null);
  const [sixDsSeries, setSixDsSeries] = useState<TrendPoint[] | null>(null);
  const [symptomsSeries, setSymptomsSeries] = useState<CheckinSeverityPoint[] | null>(null);
  const [weightSeries, setWeightSeries] = useState<TrendPoint[] | null>(null);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial' | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTestCode, setSelectedTestCode] = useState<string | null>(null);
  const [labSeries, setLabSeries] = useState<LabResultRecord[] | null>(null);
  const [patternWindow, setPatternWindow] = useState<PatternWindowHours>(24);
  const [patternResult, setPatternResult] = useState<PatternFinderResult | null>(null);
  const [startingTrialKey, setStartingTrialKey] = useState<string | null>(null);
  const router = useRouter();

  // Nutrient display names, fetched once (one profile + one DRI table
  // query -- cheap, unlike the per-day trend loop below) so the nutrient
  // picker's pills have real labels immediately.
  useFocusEffect(
    useCallback(() => {
      getDietaryReferenceIntakesForCurrentUser().then((rows) => {
        const labels: Record<string, string> = {};
        for (const row of rows) {
          if (CORE_NUTRIENT_CODES.includes(row.nutrientCode)) labels[row.nutrientCode] = row.displayName;
        }
        setNutrientLabels(labels);
      });
    }, []),
  );

  // Same real, low-cost, once-per-focus shape as the nutrient-labels effect
  // above -- the lab test catalog and unit preference are both static
  // reference data for the length of a visit, not something that needs
  // refetching on every days/lens change the way the actual series do.
  useFocusEffect(
    useCallback(() => {
      getLabTests().then(setLabTests);
      getStoredMeasurementSystem().then(setMeasurementSystem);
    }, []),
  );

  // Only the active lens's series is computed -- each of the three lenses'
  // data (especially Nutrients/6 Dimensions, which loop one DB call per
  // day in the range) is real work, so there's no reason to pay for all
  // three every time the range or lens changes.
  const load = useCallback(() => {
    setLoading(true);
    if (lens === 'nutrients') {
      getNutrientTrendSeries(selectedNutrient, days).then((series) => {
        setNutrientSeries(series);
        setLoading(false);
      });
    } else if (lens === 'sixDs') {
      getSixDimensionsFlagTrendSeries(days).then((points) => {
        setSixDsSeries(points);
        setLoading(false);
      });
    } else if (lens === 'symptoms') {
      getCheckinSeverityTrendSeries(['flare', 'post_meal'], days).then((points) => {
        setSymptomsSeries(points);
        setLoading(false);
      });
    } else if (lens === 'weight') {
      getWeightTrendPoints(days).then((points) => {
        setWeightSeries(points);
        setLoading(false);
      });
    } else if (lens === 'patterns') {
      findFoodPatterns(days, patternWindow).then((result) => {
        setPatternResult(result);
        setLoading(false);
      });
    } else if (!selectedTestCode) {
      // Labs with nothing picked yet -- nothing real to fetch, matches the
      // same "loading" -> real empty-state shape the other lenses use once
      // their own equivalent "nothing chosen" condition applies.
      setLabSeries(null);
      setLoading(false);
    } else {
      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - (days - 1));
      const rangeStartStr = rangeStart.toISOString().slice(0, 10);
      getLabResultTrend(selectedTestCode).then((rows) => {
        setLabSeries(rows.filter((row) => row.testedAt.slice(0, 10) >= rangeStartStr));
        setLoading(false);
      });
    }
  }, [lens, days, selectedNutrient, selectedTestCode, patternWindow]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Reuses the exact same real, already-proven mechanism every one of the
  // 11 Food builders' own "Worth testing?" button already uses (see
  // components/SideBuilder.tsx) -- a food surfaced here gets the identical
  // real path into a real, tracked food trial, not a second, separately-
  // invented one. getFoodIdentity resolves the rest of the identity a
  // trial needs (baseName/subcategory/prepMethod) from just foodId+source,
  // the same real reference-database lookup that path already relies on.
  async function handleStartTrial(candidate: FoodPatternCandidate) {
    const key = `${candidate.foodId}|${candidate.source}`;
    setStartingTrialKey(key);
    try {
      const identity = await getFoodIdentity(candidate.foodId, candidate.source);
      if (!identity) {
        Alert.alert('Could not start a trial', "This food's own reference entry could not be found.");
        return;
      }
      markPendingFoodTrialReturn();
      router.push({
        pathname: '/log',
        params: {
          trialFoodId: String(candidate.foodId),
          trialSource: candidate.source,
          trialBaseName: identity.baseName,
          trialCategory: identity.category,
          trialSubcategory: identity.subcategory ?? '',
          trialPrepMethod: identity.prepMethod ?? '',
        },
      });
    } finally {
      setStartingTrialKey(null);
    }
  }

  const activeLensLabel = TRENDS_LENSES.find((option) => option.key === lens)?.label;
  const latestNutrientPoint = nutrientSeries && nutrientSeries.points.length > 0 ? nutrientSeries.points[nutrientSeries.points.length - 1] : null;
  // Same reasoning as Insights' own identical testOptions/nutrientOptions
  // memoization -- labTests only changes once per visit (see the once-per-
  // focus effect above), so a fresh array on every render would otherwise
  // break PopoverSelect's own memo() bailout for no reason.
  const labTestOptions = useMemo(() => labTests.map((test) => ({ label: test.displayName, value: test.code })), [labTests]);

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Trends" variant="trends" revealed={revealed}>
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            <Text style={styles.sectionHeading}>{activeLensLabel}</Text>

            <View style={styles.pillRow}>
              {DAY_RANGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pill, days === option.value && styles.pillActive]}
                  onPress={() => setDays(option.value)}
                >
                  <Text style={[styles.pillText, days === option.value && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {lens === 'nutrients' ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.fullBleedScroll}
                  contentContainerStyle={styles.nutrientPillRow}
                >
                  {CORE_NUTRIENT_CODES.map((code) => (
                    <TouchableOpacity
                      key={code}
                      style={[styles.pill, selectedNutrient === code && styles.pillActive]}
                      onPress={() => setSelectedNutrient(code)}
                    >
                      <Text style={[styles.pillText, selectedNutrient === code && styles.pillTextActive]}>
                        {nutrientLabels[code] ?? code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {loading ? (
                  <Text style={styles.loadingText}>Loading…</Text>
                ) : (
                  <View style={styles.chartCard}>
                    <TrendLineChart
                      points={(nutrientSeries?.points ?? []).map((point) => ({ date: point.date, value: point.value }))}
                      yMin={0}
                      yMax={Math.max(120, ...(nutrientSeries?.points.map((point) => point.value) ?? [120]))}
                      referenceLine={100}
                      referenceLineLabel="100% target"
                      valueFormatter={(value) => `${Math.round(value)}%`}
                      lineColor={nutrientStatusColor(nutrientSeries?.latestStatus ?? null)}
                      emptyMessage="Log a few meals on different days to see this nutrient's trend."
                    />
                    {latestNutrientPoint ? (
                      <Text style={styles.caption}>Most recent: {Math.round(latestNutrientPoint.value)}% of target</Text>
                    ) : null}
                  </View>
                )}
              </>
            ) : lens === 'sixDs' ? (
              loading ? (
                <Text style={styles.loadingText}>Loading…</Text>
              ) : (
                <View style={styles.chartCard}>
                  <TrendLineChart
                    points={sixDsSeries ?? []}
                    yMin={0}
                    yMax={Math.max(4, ...(sixDsSeries ?? []).map((point) => point.value))}
                    valueFormatter={(value) => `${Math.round(value)} flagged`}
                    lineColor={colors.statusFlagged}
                    emptyMessage="Log a few meals on different days to see flagged items trend over time."
                  />
                </View>
              )
            ) : lens === 'symptoms' ? (
              loading ? (
                <Text style={styles.loadingText}>Loading…</Text>
              ) : (
                <View style={styles.chartCard}>
                  <TrendLineChart
                    points={(symptomsSeries ?? []).map((point) => ({
                      date: point.date,
                      value: point.severity,
                      color: checkinColor(point.checkinType),
                    }))}
                    yMin={1}
                    yMax={4}
                    valueFormatter={(value) => SEVERITY_LABELS[Math.round(value)] ?? String(Math.round(value))}
                    emptyMessage="Log a flare or food reaction in Signals to see a severity trend here."
                  />
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                      <Text style={styles.legendText}>Flare</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.statusYellow }]} />
                      <Text style={styles.legendText}>Food Reaction</Text>
                    </View>
                  </View>
                </View>
              )
            ) : lens === 'weight' ? (
              loading ? (
                <Text style={styles.loadingText}>Loading…</Text>
              ) : (
                (() => {
                  // Always stored in kg (recordBodyMeasurement's own
                  // established convention, see trendAnalysis.ts's own
                  // getWeightTrendPoints comment) -- converted here for
                  // display only, the same split every other unit-aware
                  // value in this app already uses.
                  const displayPoints = (weightSeries ?? []).map((point) => ({
                    date: point.date,
                    value: measurementSystem === 'imperial' ? kgToLb(point.value) : point.value,
                  }));
                  const { yMin, yMax } = paddedTrendRange(displayPoints.map((point) => point.value));
                  const latest = displayPoints[displayPoints.length - 1];
                  return (
                    <View style={styles.chartCard}>
                      <TrendLineChart
                        points={displayPoints}
                        yMin={yMin}
                        yMax={yMax}
                        valueFormatter={(value) => `${value.toFixed(1)} ${measurementSystem === 'imperial' ? 'lb' : 'kg'}`}
                        emptyMessage="Log a weight reading on Profile to see it trend here."
                      />
                      {latest ? (
                        <Text style={styles.caption}>
                          Most recent: {latest.value.toFixed(1)} {measurementSystem === 'imperial' ? 'lb' : 'kg'}
                        </Text>
                      ) : null}
                    </View>
                  );
                })()
              )
            ) : lens === 'labs' ? (
              <>
                <PopoverSelect
                  options={labTestOptions}
                  selected={selectedTestCode}
                  onSelect={setSelectedTestCode}
                  tabColor={TAB_COLOR}
                  searchable
                  placeholder="Pick a test..."
                  minWidth={220}
                />
                {!selectedTestCode ? (
                  <Text style={[styles.loadingText, styles.spaced]}>Pick a test above to see its own trend.</Text>
                ) : loading ? (
                  <Text style={[styles.loadingText, styles.spaced]}>Loading…</Text>
                ) : (
                  (() => {
                    const test = labTests.find((t) => t.code === selectedTestCode);
                    const points = (labSeries ?? []).map((row) => ({ date: row.testedAt.slice(0, 10), value: row.value }));
                    const { yMin, yMax } = paddedTrendRange(points.map((point) => point.value));
                    const referenceLine =
                      test?.typicalRangeLow != null && test?.typicalRangeHigh != null
                        ? (test.typicalRangeLow + test.typicalRangeHigh) / 2
                        : undefined;
                    const latest = labSeries && labSeries.length > 0 ? labSeries[labSeries.length - 1] : null;
                    return (
                      <View style={[styles.chartCard, styles.spaced]}>
                        <TrendLineChart
                          points={points}
                          yMin={yMin}
                          yMax={yMax}
                          referenceLine={referenceLine}
                          referenceLineLabel={referenceLine != null ? 'Typical range midpoint' : undefined}
                          valueFormatter={(value) => `${value} ${latest?.unit ?? test?.rangeUnit ?? ''}`.trim()}
                          emptyMessage="Log a result for this test on Insights' own Labs lens to see it trend here."
                        />
                        {latest ? (
                          <Text style={styles.caption}>
                            Most recent: {latest.value} {latest.unit}
                            {test?.typicalRangeLow != null && test?.typicalRangeHigh != null
                              ? ` · typical range ${test.typicalRangeLow}–${test.typicalRangeHigh} ${test.rangeUnit ?? ''}`
                              : ''}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })()
                )}
              </>
            ) : (
              <>
                <View style={styles.disclaimerCard}>
                  <Text style={styles.disclaimerText}>
                    {
                      "This shows what you actually ate before each flare or reaction you've logged, and what shows up more than once. It's a count from your own data, not a diagnosis, and not proof anything here actually causes anything. Something worth a second look deserves a real trial, not just a spot on this list."
                    }
                  </Text>
                </View>

                <View style={styles.pillRow}>
                  {PATTERN_WINDOW_HOURS.map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[styles.pill, patternWindow === hours && styles.pillActive]}
                      onPress={() => setPatternWindow(hours)}
                    >
                      <Text style={[styles.pillText, patternWindow === hours && styles.pillTextActive]}>{hours}h before</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {loading ? (
                  <Text style={styles.loadingText}>Looking through your logged history…</Text>
                ) : !patternResult || patternResult.totalSymptomInstances === 0 ? (
                  <Text style={styles.loadingText}>
                    {"Log a flare or food reaction in Signals first; there's nothing to look for a pattern in yet."}
                  </Text>
                ) : patternResult.foodCandidates.length === 0 &&
                  patternResult.dimensionCandidates.length === 0 &&
                  patternResult.categoryCandidates.length === 0 ? (
                  <Text style={styles.loadingText}>
                    {"Nothing showed up before 2 or more of your "}
                    {patternResult.totalSymptomInstances}
                    {" logged flares/reactions in this window. That's a real result too; try a longer window, or keep logging."}
                  </Text>
                ) : (
                  <>
                    {patternResult.foodCandidates.length > 0 ? (
                      <View style={styles.chartCard}>
                        <Text style={styles.patternSectionHeading}>Specific foods</Text>
                        {patternResult.foodCandidates.map((candidate) => {
                          const key = `${candidate.foodId}|${candidate.source}`;
                          return (
                            <View key={key} style={styles.patternRow}>
                              <View style={styles.patternRowText}>
                                <Text style={styles.patternRowTitle}>{candidate.foodName}</Text>
                                <Text style={styles.patternRowCaption}>
                                  Logged before {candidate.occurrenceCount} of your {patternResult.totalSymptomInstances} flares/reactions
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={[styles.trialButton, { borderColor: TAB_COLOR }]}
                                disabled={startingTrialKey === key}
                                onPress={() => handleStartTrial(candidate)}
                              >
                                <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>
                                  {startingTrialKey === key ? 'Starting…' : 'Start a trial'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    {patternResult.dimensionCandidates.length > 0 ? (
                      <View style={[styles.chartCard, styles.spaced]}>
                        <Text style={styles.patternSectionHeading}>6 Dimensions flags</Text>
                        {patternResult.dimensionCandidates.map((candidate) => (
                          <View key={`${candidate.dimension}::${candidate.tier}`} style={styles.patternRow}>
                            <View style={styles.patternRowText}>
                              <Text style={styles.patternRowTitle}>
                                {candidate.dimension} · {candidate.tier}
                              </Text>
                              <Text style={styles.patternRowCaption}>
                                Logged before {candidate.occurrenceCount} of your {patternResult.totalSymptomInstances} flares/reactions
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {patternResult.categoryCandidates.length > 0 ? (
                      <View style={[styles.chartCard, styles.spaced]}>
                        <Text style={styles.patternSectionHeading}>Food categories</Text>
                        {patternResult.categoryCandidates.map((candidate) => (
                          <View key={candidate.category} style={styles.patternRow}>
                            <View style={styles.patternRowText}>
                              <Text style={styles.patternRowTitle}>{candidate.category}</Text>
                              <Text style={styles.patternRowCaption}>
                                Logged before {candidate.occurrenceCount} of your {patternResult.totalSymptomInstances} flares/reactions
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Trends" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Trends" tabColor={TAB_COLOR} />
      <LensHub
        pageTitle="Trends"
        options={TRENDS_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { ...typography.body, color: colors.textSecondary, marginBottom: 16 },
  spaced: { marginTop: 12 },

  // sectionHeading/pillRow's own pills sit above chartCard, not inside it
  // (page-level lens name/filters, not "content in a box") -- left neutral
  // for that reason. caption/legendText below ARE rendered inside
  // chartCard, so they follow TAB_COLOR, 2026-07-27.
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10 },
  caption: { ...typography.body, color: TAB_COLOR, marginTop: 8, textAlign: 'center' },
  // Added 2026-07-27: the chart itself used to float with no surrounding
  // box at all, the one page in this family with no "info box" anywhere --
  // wraps it in the same colors.surface/TAB_COLOR-border treatment every
  // other page's boxes use (see TAB_COLOR's own comment above).
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    alignItems: 'center',
  },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  // See index.tsx's own fullBleedScroll (Home) comment -- same trick, same reason:
  // cancels `content`'s paddingHorizontal so the scrollable viewport spans
  // the true screen width instead of clipping inside that inset.
  fullBleedScroll: { marginHorizontal: -20 },
  nutrientPillRow: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary },

  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: TAB_COLOR },

  // Pattern Finder's own real, permanent caveat -- deliberately a plain,
  // neutral box (colors.surface, no TAB_COLOR border) rather than the
  // usual chartCard treatment, so it doesn't visually read as "just
  // another data box" the way the real candidate lists below it do.
  disclaimerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  disclaimerText: { ...typography.body, color: colors.textSecondary },
  patternSectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 12, fontSize: 16 },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  patternRowText: { flex: 1 },
  patternRowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  patternRowCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  trialButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  trialButtonText: { ...typography.caption, fontWeight: '600' },
});
