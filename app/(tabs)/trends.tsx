import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { useInfoAlert } from '../../components/InfoAlert';
import { LensHub, type LensOption } from '../../components/LensHub';
import {
  getGroceryPriceHistory,
  listGroceryFoodSummaries,
  type GroceryFoodSummary,
  type GroceryPricePoint,
} from '../../lib/groceryDb';
import { formatMoney, groceryPriceUnitLabel } from '../../lib/groceryList';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PopoverSelect } from '../../components/PopoverSelect';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { TrendLineChart } from '../../components/TrendLineChart';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import {
  getDietaryReferenceIntakesForCurrentUser,
  getFoodIdentity,
  getLabResultTrend,
  getLabTests,
  getStoredMeasurementSystem,
  getUserProfile,
  type LabResultRecord,
  type LabTest,
} from '../../lib/db';
import { getPersonalizationProfile, type PersonalizationProfile } from '../../lib/foodPersonalization';
import { formatTime12 } from '../../lib/timeOfDay';
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
  dateStringOffsetFrom,
  getCheckinSeverityTrendSeries,
  getNutrientTrendSeriesForRange,
  getSixDimensionsFlagTrendSeriesForRange,
  getEatingWindowTrend,
  getWeightTrendPoints,
  paddedTrendRange,
  type EatingWindowTrend,
  type CheckinSeverityPoint,
  type NutrientTrendSeries,
  type TrendPoint,
} from '../../lib/trendAnalysis';
import { CORE_NUTRIENT_CODES } from './index';

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border to carry that
// identity. Matches the same rule applied there, 2026-07-27.
const TAB_COLOR = colors.tabTrends;

type TrendsLens = 'nutrients' | 'sixDs' | 'symptoms' | 'eatingWindow' | 'weight' | 'labs' | 'groceries' | 'patterns';

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
        body: "Pick a nutrient to see its percent-of-target trend across the date range, with a dashed line at 100%. Only days with at least one logged (or, for a future range, genuinely scheduled) meal are plotted, so days with nothing to go on don't show up as false zeros. Tap any point on the line to see that exact day's own value.",
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
  {
    key: 'sixDs',
    label: 'Condition Scores',
    icon: 'analytics-outline',
    help: [
      {
        heading: 'Condition Scores',
        // 2026-08-26 -- condition-scoped, matching the rename/rebuild
        // already applied to Insights' own lens of the same underlying
        // data: counts distinct sub-criteria flagged for one of your own
        // tracked conditions, not any of the app's currently-scored
        // sub-criteria regardless of relevance.
        body: 'How many distinct scoring factors relevant to your tracked conditions got flagged per day, across the date range.',
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
    key: 'eatingWindow',
    label: 'Eating Window',
    icon: 'time-outline',
    help: [
      {
        heading: 'What this counts',
        body: 'Meals you deliberately kept after the app told you they fell outside your declared eating window. Each one is a choice you made at the time, not a meal that merely happened to land outside a window, so a run of them says something real about how the window is fitting your life.',
      },
      {
        heading: 'Why a zero day still shows',
        body: 'A day with meals scheduled and none of them outside the window is a real zero and is plotted as one. A day with no meals scheduled at all is left off entirely, since there is nothing to say about it either way.',
      },
      {
        heading: 'What it does not see',
        body: 'Only meals scheduled through this app carry the flag, so a meal logged directly on the Food tab is not counted here. Meals generated by a meal plan are also never counted: the generator moves a meal to fit your window rather than booking one outside it, so it has no exceptions to record.',
      },
      {
        heading: 'This is not a score',
        body: 'Eating outside the window for a missed meal, illness, or any other reason is a normal thing to do, and the app deliberately lets you record it rather than refusing the meal. The count is here to be looked at, not to be kept at zero.',
      },
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
  // The Grocery List, 2026-09-01. The half of that feature that was asked
  // to feed Trends: what things cost, and how often they actually get
  // bought. Both come straight out of grocery lists already shopped, so
  // there is nothing extra to record for this to work.
  {
    key: 'groceries',
    label: 'Grocery Prices',
    icon: 'pricetag-outline',
    help: [
      {
        heading: 'Where these numbers come from',
        body: 'Every price you entered on a grocery list, plotted by the day you bought it. Nothing is estimated and nothing is looked up: if a price is here, you typed it or scanned it.',
      },
      {
        heading: 'Foods are matched by name',
        body: 'A grocery line is identified only by what it is called, so two spellings of the same food read as two separate foods here. That is deliberate rather than a limit worth papering over: guessing that two names mean the same thing would quietly merge two different price histories.',
      },
      {
        heading: 'Prices per pound and per kilo',
        body: 'A price entered per weight is charted as that unit price, not as what the line came to, since what you paid depends on how much you bought. A package price is charted as the package price. The unit is named under the chart so the two are never confused.',
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
        heading: 'Condition scoring factors',
        body: 'This section only ever checks factors relevant to the conditions set in Profile, so a candidate here is always something one of your own tracked conditions actually cares about, not any factor this app happens to score.',
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

// The plain "Last 7d/30d/90d" picker -- kept exactly as it was for the four
// lenses this range redesign doesn't apply to (Symptoms/Weight/Labs/Pattern
// Finder are all sparse, real, already-happened events, none of which have
// a genuine future-projection story the way scheduled meals do).
const DAY_RANGE_OPTIONS = [
  { value: 7, label: 'Last 7d' },
  { value: 30, label: 'Last 30d' },
  { value: 90, label: 'Last 90d' },
] as const;

// The real, symmetric past/future picker for Nutrients and Condition Scores,
// 2026-08-15 -- direct, specific spec: "90d, 60d, 30d, 7d, Yesterday,
// Today, Tomorrow, 7d, 30d, 60d, 90d." Both meal-based lenses can genuinely
// answer a future question (via lib/db.ts's own real projected-totals
// functions, reading what's actually scheduled), unlike the four lenses
// above -- there's no such thing as a "scheduled" flare or lab result.
type DateRangeSelection =
  | { kind: 'past'; days: 7 | 30 | 60 | 90 }
  | { kind: 'future'; days: 7 | 30 | 60 | 90 }
  | { kind: 'single'; label: 'yesterday' | 'today' | 'tomorrow' }
  | { kind: 'custom'; startDate: string; endDate: string };

type RangePillDefinition = { key: string; label: string; selection: DateRangeSelection };

// Past buckets end the day BEFORE today, future buckets start the day
// AFTER today -- Yesterday/Today/Tomorrow are each their own real
// single-day pick, so nothing here double-covers today itself.
const RANGE_PILLS: RangePillDefinition[] = [
  { key: 'past-90', label: '90d', selection: { kind: 'past', days: 90 } },
  { key: 'past-60', label: '60d', selection: { kind: 'past', days: 60 } },
  { key: 'past-30', label: '30d', selection: { kind: 'past', days: 30 } },
  { key: 'past-7', label: '7d', selection: { kind: 'past', days: 7 } },
  { key: 'yesterday', label: 'Yesterday', selection: { kind: 'single', label: 'yesterday' } },
  { key: 'today', label: 'Today', selection: { kind: 'single', label: 'today' } },
  { key: 'tomorrow', label: 'Tomorrow', selection: { kind: 'single', label: 'tomorrow' } },
  { key: 'future-7', label: '7d', selection: { kind: 'future', days: 7 } },
  { key: 'future-30', label: '30d', selection: { kind: 'future', days: 30 } },
  { key: 'future-60', label: '60d', selection: { kind: 'future', days: 60 } },
  { key: 'future-90', label: '90d', selection: { kind: 'future', days: 90 } },
];

function rangeSelectionKey(selection: DateRangeSelection): string {
  if (selection.kind === 'past') return `past-${selection.days}`;
  if (selection.kind === 'future') return `future-${selection.days}`;
  if (selection.kind === 'single') return selection.label;
  return 'custom';
}

// Small Y/M/D option lists for the custom picker -- a real year either side
// of the current one comfortably covers every real past/future range this
// picker's own fixed pills already reach (90 days), plus real margin for a
// genuinely far-out custom pick.
const CUSTOM_YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - 1 + i));
const CUSTOM_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const CUSTOM_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Same 'YYYY-MM-DD' local-time helper (and same reasoning) duplicated in
// index.tsx (Home)/food.tsx/insights.tsx/schedule.tsx/log.tsx: UTC's
// calendar date is wrong for anyone not on UTC, especially in the evening.
function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDisplayDate(dateString: string): string {
  const [, monthStr, dayStr] = dateString.split('-');
  const monthIndex = Number(monthStr) - 1;
  return `${MONTH_ABBREVIATIONS[monthIndex] ?? monthStr} ${Number(dayStr)}`;
}

// A small local equivalent of Profile's own (unexported) PickerField --
// same real shape (a label above a field), not worth exporting a shared
// component for one page's own custom-date panel.
function DateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.dateFieldGroup}>
      <Text style={styles.dateFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

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
    body: "Nutrient intake, Condition Scores flags, and symptom/flare severity charted over a date range you pick, so slow changes that are invisible day-to-day become visible trends. Today's snapshot lives on Insights; this is the same kind of information, over time instead of just today.",
  },
  {
    heading: 'Nutrients & Condition Scores: past AND future',
    body: "These two can look ahead as well as back, reading what's genuinely scheduled rather than only what's already been logged -- a range that reaches past today shows a real projection for the scheduled days, never a guess for a day nothing's actually planned on.",
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as
  // Food's own identical addition (app/(tabs)/food.tsx): lets LensHub's
  // new "My Trends" top-left tile (see its extraTile prop below) open
  // this SAME popup, at its own already-established position, after
  // closing itself first. The standalone MyItemsHub button further down
  // keeps working exactly as before regardless.
  const [myTrendsOpen, setMyTrendsOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  // Still used by the four lenses whose own picker didn't change.
  const [days, setDays] = useState<7 | 30 | 90>(30);
  // The new picker, Nutrients/Condition Scores only.
  const [dateRangeSelection, setDateRangeSelection] = useState<DateRangeSelection>({ kind: 'past', days: 30 });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customIsRange, setCustomIsRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  const [selectedNutrient, setSelectedNutrient] = useState<string>(CORE_NUTRIENT_CODES[0]);
  const [nutrientLabels, setNutrientLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [nutrientSeries, setNutrientSeries] = useState<NutrientTrendSeries | null>(null);
  const [sixDsSeries, setSixDsSeries] = useState<TrendPoint[] | null>(null);
  const [symptomsSeries, setSymptomsSeries] = useState<CheckinSeverityPoint[] | null>(null);
  const [eatingWindowTrend, setEatingWindowTrend] = useState<EatingWindowTrend | null>(null);
  // Null whenever fasting is off or either window time is unset -- which
  // is a genuinely different thing from "no exceptions", and the render
  // below says so rather than showing an empty chart that reads as
  // perfect compliance.
  const [eatingWindowProfile, setEatingWindowProfile] = useState<{ start: string; end: string } | null>(null);
  const [weightSeries, setWeightSeries] = useState<TrendPoint[] | null>(null);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial' | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTestCode, setSelectedTestCode] = useState<string | null>(null);
  const [labSeries, setLabSeries] = useState<LabResultRecord[] | null>(null);
  // The Grocery List, 2026-09-01.
  const [groceryFoods, setGroceryFoods] = useState<GroceryFoodSummary[]>([]);
  const [selectedGroceryFood, setSelectedGroceryFood] = useState<string | null>(null);
  const [groceryPrices, setGroceryPrices] = useState<GroceryPricePoint[] | null>(null);
  const [patternWindow, setPatternWindow] = useState<PatternWindowHours>(24);
  const [patternResult, setPatternResult] = useState<PatternFinderResult | null>(null);
  const [startingTrialKey, setStartingTrialKey] = useState<string | null>(null);
  const router = useRouter();

  // 2026-08-26 -- the same real tracked-conditions list Insights/
  // food-item-detail.tsx already load, needed here so the Condition Scores
  // trend line means the same condition-scoped thing everywhere in the
  // app rather than one flat count across every currently-scored
  // sub-criterion regardless of relevance.
  const [personalizationProfile, setPersonalizationProfile] = useState<PersonalizationProfile | null>(null);
  useEffect(() => {
    getPersonalizationProfile().then(setPersonalizationProfile);
  }, []);

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

  // Resolves whichever pill (or custom pick) is active into a concrete
  // {startDate, endDate}, plus whether it's genuinely a single day -- the
  // one place this translation happens, so the load effect and the render
  // branch below both read the exact same real dates.
  const resolvedRange = useMemo(() => {
    const today = todayDateString();
    if (dateRangeSelection.kind === 'past') {
      return { startDate: dateStringOffsetFrom(today, -dateRangeSelection.days), endDate: dateStringOffsetFrom(today, -1), isSingleDay: false };
    }
    if (dateRangeSelection.kind === 'future') {
      return { startDate: dateStringOffsetFrom(today, 1), endDate: dateStringOffsetFrom(today, dateRangeSelection.days), isSingleDay: false };
    }
    if (dateRangeSelection.kind === 'single') {
      const offset = dateRangeSelection.label === 'yesterday' ? -1 : dateRangeSelection.label === 'tomorrow' ? 1 : 0;
      const date = dateStringOffsetFrom(today, offset);
      return { startDate: date, endDate: date, isSingleDay: true };
    }
    return {
      startDate: dateRangeSelection.startDate,
      endDate: dateRangeSelection.endDate,
      isSingleDay: dateRangeSelection.startDate === dateRangeSelection.endDate,
    };
  }, [dateRangeSelection]);

  // Only the active lens's series is computed -- each of the three lenses'
  // data (especially Nutrients/Condition Scores, which loop one DB call per
  // day in the range) is real work, so there's no reason to pay for all
  // three every time the range or lens changes.
  const load = useCallback(() => {
    setLoading(true);
    if (lens === 'nutrients') {
      getNutrientTrendSeriesForRange(selectedNutrient, resolvedRange.startDate, resolvedRange.endDate).then((series) => {
        setNutrientSeries(series);
        setLoading(false);
      });
    } else if (lens === 'sixDs') {
      const conditionCodes = personalizationProfile?.trackedConditions.map((condition) => condition.code) ?? [];
      getSixDimensionsFlagTrendSeriesForRange(resolvedRange.startDate, resolvedRange.endDate, conditionCodes).then((points) => {
        setSixDsSeries(points);
        setLoading(false);
      });
    } else if (lens === 'symptoms') {
      getCheckinSeverityTrendSeries(['flare', 'post_meal'], days).then((points) => {
        setSymptomsSeries(points);
        setLoading(false);
      });
    } else if (lens === 'eatingWindow') {
      Promise.all([getEatingWindowTrend(days), getUserProfile()]).then(([trend, profile]) => {
        setEatingWindowTrend(trend);
        setEatingWindowProfile(
          profile?.fastingEnabled && profile.eatingWindowStart && profile.eatingWindowEnd
            ? { start: profile.eatingWindowStart, end: profile.eatingWindowEnd }
            : null,
        );
        setLoading(false);
      });
    } else if (lens === 'weight') {
      getWeightTrendPoints(days).then((points) => {
        setWeightSeries(points);
        setLoading(false);
      });
    } else if (lens === 'patterns') {
      // 2026-08-26 -- condition-scoped, same trackedConditions list every
      // other lens on this screen now uses; dimension candidates only
      // ever surface a concern relevant to one of these.
      findFoodPatterns(days, patternWindow, personalizationProfile?.trackedConditions ?? []).then((result) => {
        setPatternResult(result);
        setLoading(false);
      });
    } else if (lens === 'groceries') {
      // The food list is loaded every time this lens opens rather than
      // once per visit: a shopping trip finished a minute ago is exactly
      // when someone comes looking, and a stale list would be missing the
      // prices they just entered.
      Promise.all([
        listGroceryFoodSummaries(),
        selectedGroceryFood ? getGroceryPriceHistory(selectedGroceryFood) : Promise.resolve(null),
      ]).then(([foods, prices]) => {
        setGroceryFoods(foods);
        setGroceryPrices(prices);
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
  }, [lens, days, resolvedRange, selectedNutrient, selectedTestCode, selectedGroceryFood, patternWindow, personalizationProfile]);

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
        showInfoAlert('Could not start a trial', "This food's own reference entry could not be found.");
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

  // Same overrides-based, stale-closure-avoiding commit pattern as
  // Profile's own commitBirthDate -- a PopoverSelect's own onSelect fires
  // with the just-picked value in the same synchronous tap that also needs
  // it, before this render's own closure would otherwise see it.
  function commitCustomDate(which: 'start' | 'end', overrides: { year?: string; month?: string; day?: string }) {
    const current = which === 'start' ? customStartDate : customEndDate;
    const [curY, curM, curD] = current ? current.split('-') : [String(new Date().getFullYear()), '', ''];
    const year = overrides.year ?? curY;
    const month = overrides.month ?? curM;
    const day = overrides.day ?? curD;
    if (!year || !month || !day) {
      if (which === 'start') setCustomStartDate(null);
      else setCustomEndDate(null);
      return;
    }
    const pad = (n: string) => n.padStart(2, '0');
    const composed = `${year}-${pad(month)}-${pad(day)}`;

    const newStart = which === 'start' ? composed : customStartDate;
    const newEnd = customIsRange ? (which === 'end' ? composed : customEndDate) : composed;
    if (which === 'start') setCustomStartDate(composed);
    else setCustomEndDate(composed);

    if (newStart && newEnd) {
      const finalStart = newStart <= newEnd ? newStart : newEnd;
      const finalEnd = newStart <= newEnd ? newEnd : newStart;
      setDateRangeSelection({ kind: 'custom', startDate: finalStart, endDate: finalEnd });
    }
  }

  const activeLensLabel = TRENDS_LENSES.find((option) => option.key === lens)?.label;
  const latestNutrientPoint = nutrientSeries && nutrientSeries.points.length > 0 ? nutrientSeries.points[nutrientSeries.points.length - 1] : null;
  // Same reasoning as Insights' own identical testOptions/nutrientOptions
  // memoization -- labTests only changes once per visit (see the once-per-
  // focus effect above), so a fresh array on every render would otherwise
  // break PopoverSelect's own memo() bailout for no reason.
  const labTestOptions = useMemo(() => labTests.map((test) => ({ label: test.displayName, value: test.code })), [labTests]);
  // Ordered by how often each food has actually been bought (see
  // listGroceryFoodSummaries), so the things someone buys every week sit
  // at the top of the picker rather than being alphabetized among
  // one-off purchases.
  const groceryFoodOptions = useMemo(
    () => groceryFoods.map((food) => ({ label: food.foodName, value: food.foodName })),
    [groceryFoods],
  );

  const showsRangePicker = lens === 'nutrients' || lens === 'sixDs';

  return (
    <View style={styles.screen}>
      {infoAlertElement}
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Trends" variant="trends" revealed={revealed}>
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            <Text style={styles.sectionHeading}>{activeLensLabel}</Text>

            {showsRangePicker ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.fullBleedScroll}
                  contentContainerStyle={styles.nutrientPillRow}
                >
                  {RANGE_PILLS.map((pill) => {
                    const active = dateRangeSelection.kind !== 'custom' && rangeSelectionKey(dateRangeSelection) === pill.key;
                    return (
                      <TouchableOpacity
                        key={pill.key}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => {
                          setShowCustomPicker(false);
                          setDateRangeSelection(pill.selection);
                        }}
                      >
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.pill, dateRangeSelection.kind === 'custom' && styles.pillActive]}
                    onPress={() => setShowCustomPicker((current) => !current)}
                  >
                    <Text style={[styles.pillText, dateRangeSelection.kind === 'custom' && styles.pillTextActive]}>Custom</Text>
                  </TouchableOpacity>
                </ScrollView>

                {showCustomPicker ? (
                  <View style={styles.customPanel}>
                    <View style={styles.pillRow}>
                      <TouchableOpacity
                        style={[styles.smallPill, !customIsRange && styles.pillActive]}
                        onPress={() => setCustomIsRange(false)}
                      >
                        <Text style={[styles.pillText, !customIsRange && styles.pillTextActive]}>One day</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallPill, customIsRange && styles.pillActive]} onPress={() => setCustomIsRange(true)}>
                        <Text style={[styles.pillText, customIsRange && styles.pillTextActive]}>Date range</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.customLabel}>{customIsRange ? 'Start date' : 'Date'}</Text>
                    <View style={styles.dateRow}>
                      <DateField label="Year">
                        <PopoverSelect
                          options={CUSTOM_YEAR_OPTIONS}
                          selected={customStartDate?.split('-')[0] ?? null}
                          minWidth={72}
                          tabColor={TAB_COLOR}
                          onSelect={(value) => commitCustomDate('start', { year: value })}
                        />
                      </DateField>
                      <DateField label="Month">
                        <PopoverSelect
                          options={CUSTOM_MONTH_OPTIONS}
                          selected={customStartDate ? String(Number(customStartDate.split('-')[1])) : null}
                          minWidth={52}
                          tabColor={TAB_COLOR}
                          onSelect={(value) => commitCustomDate('start', { month: value })}
                        />
                      </DateField>
                      <DateField label="Day">
                        <PopoverSelect
                          options={CUSTOM_DAY_OPTIONS}
                          selected={customStartDate ? String(Number(customStartDate.split('-')[2])) : null}
                          minWidth={52}
                          tabColor={TAB_COLOR}
                          onSelect={(value) => commitCustomDate('start', { day: value })}
                        />
                      </DateField>
                    </View>

                    {customIsRange ? (
                      <>
                        <Text style={[styles.customLabel, styles.spaced]}>Through</Text>
                        <View style={styles.dateRow}>
                          <DateField label="Year">
                            <PopoverSelect
                              options={CUSTOM_YEAR_OPTIONS}
                              selected={customEndDate?.split('-')[0] ?? null}
                              minWidth={72}
                              tabColor={TAB_COLOR}
                              onSelect={(value) => commitCustomDate('end', { year: value })}
                            />
                          </DateField>
                          <DateField label="Month">
                            <PopoverSelect
                              options={CUSTOM_MONTH_OPTIONS}
                              selected={customEndDate ? String(Number(customEndDate.split('-')[1])) : null}
                              minWidth={52}
                              tabColor={TAB_COLOR}
                              onSelect={(value) => commitCustomDate('end', { month: value })}
                            />
                          </DateField>
                          <DateField label="Day">
                            <PopoverSelect
                              options={CUSTOM_DAY_OPTIONS}
                              selected={customEndDate ? String(Number(customEndDate.split('-')[2])) : null}
                              minWidth={52}
                              tabColor={TAB_COLOR}
                              onSelect={(value) => commitCustomDate('end', { day: value })}
                            />
                          </DateField>
                        </View>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : (
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
            )}

            {lens === 'nutrients' ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.fullBleedScroll}
                  contentContainerStyle={[styles.nutrientPillRow, styles.spaced]}
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
                  <Text style={[styles.loadingText, styles.panelStandalone]}>Loading…</Text>
                ) : resolvedRange.isSingleDay ? (
                  <View style={styles.chartCard}>
                    {latestNutrientPoint ? (
                      <>
                        <Text style={[styles.singleDayHeading, { color: nutrientStatusColor(nutrientSeries?.latestStatus ?? null) }]}>
                          {Math.round(latestNutrientPoint.value)}% of target
                        </Text>
                        <Text style={styles.caption}>
                          {nutrientSeries?.displayName ?? selectedNutrient} · {formatDisplayDate(latestNutrientPoint.date)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.loadingText}>
                        {`Nothing logged or scheduled for ${formatDisplayDate(resolvedRange.startDate)} yet.`}
                      </Text>
                    )}
                  </View>
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
                      emptyMessage="Log a few meals on different days (or schedule some ahead) to see this nutrient's trend."
                    />
                  </View>
                )}
              </>
            ) : lens === 'sixDs' ? (
              loading ? (
                <Text style={[styles.loadingText, styles.panelStandalone]}>Loading…</Text>
              ) : resolvedRange.isSingleDay ? (
                <View style={styles.chartCard}>
                  {sixDsSeries && sixDsSeries.length > 0 ? (
                    <>
                      <Text style={[styles.singleDayHeading, { color: colors.statusFlagged }]}>
                        {Math.round(sixDsSeries[0].value)} flagged
                      </Text>
                      <Text style={styles.caption}>{formatDisplayDate(sixDsSeries[0].date)}</Text>
                    </>
                  ) : (
                    <Text style={styles.loadingText}>
                      {`Nothing logged or scheduled for ${formatDisplayDate(resolvedRange.startDate)} yet.`}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.chartCard}>
                  <TrendLineChart
                    points={sixDsSeries ?? []}
                    yMin={0}
                    yMax={Math.max(4, ...(sixDsSeries ?? []).map((point) => point.value))}
                    valueFormatter={(value) => `${Math.round(value)} flagged`}
                    lineColor={colors.statusFlagged}
                    emptyMessage="Log a few meals on different days (or schedule some ahead) to see flagged items trend over time."
                  />
                </View>
              )
            ) : lens === 'symptoms' ? (
              loading ? (
                <Text style={[styles.loadingText, styles.panelStandalone]}>Loading…</Text>
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
            ) : lens === 'eatingWindow' ? (
              loading ? (
                <Text style={[styles.loadingText, styles.panelStandalone]}>Loading…</Text>
              ) : !eatingWindowProfile ? (
                // Deliberately not an empty chart: with fasting off there
                // is no window to be outside of, so a flat zero line would
                // be claiming compliance with a rule that was never set.
                <Text style={[styles.loadingText, styles.panelStandalone]}>
                  This tracks meals kept outside a declared eating window, and you do not have one set. Turn on
                  intermittent fasting in Profile, with a start and end time, and any meal you choose to keep outside
                  it will show up here.
                </Text>
              ) : (
                <View style={styles.chartCard}>
                  <Text style={styles.caption}>
                    {`Your eating window: ${formatTime12(eatingWindowProfile.start)} - ${formatTime12(eatingWindowProfile.end)}`}
                  </Text>
                  <TrendLineChart
                    points={eatingWindowTrend?.points ?? []}
                    yMin={0}
                    yMax={Math.max(1, ...(eatingWindowTrend?.points ?? []).map((point: TrendPoint) => point.value))}
                    valueFormatter={(value) => `${value} ${value === 1 ? 'meal' : 'meals'} outside`}
                    emptyMessage="No meals scheduled in this range yet, so there is nothing to compare against your window."
                  />
                  {eatingWindowTrend && eatingWindowTrend.totalMeals > 0 ? (
                    <Text style={styles.caption}>
                      {eatingWindowTrend.totalExceptions === 0
                        ? `All ${eatingWindowTrend.totalMeals} scheduled ${eatingWindowTrend.totalMeals === 1 ? 'meal' : 'meals'} in this range fell inside your window.`
                        : `${eatingWindowTrend.totalExceptions} of ${eatingWindowTrend.totalMeals} scheduled meals kept outside your window, across ${eatingWindowTrend.daysWithExceptions} ${eatingWindowTrend.daysWithExceptions === 1 ? 'day' : 'days'}.`}
                    </Text>
                  ) : null}
                  <Text style={styles.caption}>
                    Counts only meals scheduled in the app. A meal logged directly on Food is not counted, and meal-plan
                    meals never are, since the generator moves them to fit your window rather than booking them outside it.
                  </Text>
                </View>
              )
            ) : lens === 'weight' ? (
              loading ? (
                <Text style={[styles.loadingText, styles.panelStandalone]}>Loading…</Text>
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
            ) : lens === 'groceries' ? (
              <>
                <PopoverSelect
                  options={groceryFoodOptions}
                  selected={selectedGroceryFood}
                  onSelect={setSelectedGroceryFood}
                  tabColor={TAB_COLOR}
                  searchable
                  placeholder="Pick a food..."
                  minWidth={220}
                />
                {groceryFoods.length === 0 && !loading ? (
                  <Text style={[styles.loadingText, styles.spaced, styles.panelStandalone]}>
                    Nothing to chart yet. Prices show up here once you have entered some on a grocery list.
                  </Text>
                ) : !selectedGroceryFood ? (
                  <Text style={[styles.loadingText, styles.spaced, styles.panelStandalone]}>Pick a food above to see what it has cost over time.</Text>
                ) : loading ? (
                  <Text style={[styles.loadingText, styles.spaced, styles.panelStandalone]}>Loading…</Text>
                ) : (
                  (() => {
                    const summary = groceryFoods.find((food) => food.foodName === selectedGroceryFood);
                    const rows = groceryPrices ?? [];
                    // 2026-09-01: a sale is plotted in its own colour rather than
                    // silently pulling the line down. Reported directly: an offer
                    // "might be seen as a little drop on the timeline", and it should
                    // read as an offer rather than as the thing getting cheaper.
                    const points = rows.map((row) => ({
                      date: row.date.slice(0, 10),
                      value: row.price,
                      color: row.onSale ? colors.statusGood : undefined,
                    }));
                    const saleCount = rows.filter((row) => row.onSale).length;
                    const { yMin, yMax } = paddedTrendRange(points.map((point) => point.value));
                    const latest = rows.length > 0 ? rows[rows.length - 1] : null;
                    // Named rather than assumed: a food priced per pound
                    // on one trip and per package on another has two kinds
                    // of number on one line, and saying so is more honest
                    // than silently plotting them together as though they
                    // were comparable.
                    const units = Array.from(new Set(rows.map((row) => row.priceUnit ?? 'total')));
                    return (
                      <View style={[styles.chartCard, styles.spaced]}>
                        <TrendLineChart
                          points={points}
                          yMin={yMin}
                          yMax={yMax}
                          valueFormatter={(value) => formatMoney(value)}
                          emptyMessage="No prices recorded for this one yet. Enter what it cost on a grocery list and it will start charting here."
                        />
                        {latest ? (
                          <Text style={styles.caption}>
                            {`Most recently ${formatMoney(latest.price)} ${groceryPriceUnitLabel(latest.priceUnit ?? 'total')}`}
                            {latest.storeName ? ` at ${latest.storeName}` : ''}
                            {summary ? ` · on ${summary.timesListed} ${summary.timesListed === 1 ? 'list' : 'lists'} so far` : ''}
                          </Text>
                        ) : null}
                        {saleCount > 0 ? (
                          <View style={styles.legendRow}>
                            <View style={styles.legendItem}>
                              <View style={[styles.legendDot, { backgroundColor: colors.statusGood }]} />
                              <Text style={styles.legendText}>
                                {`${saleCount} of these ${saleCount === 1 ? 'was' : 'were'} a sale price, not the usual one`}
                              </Text>
                            </View>
                          </View>
                        ) : null}
                        {units.length > 1 ? (
                          <Text style={styles.caption}>
                            These prices were not all entered the same way ({units.map((unit) => groceryPriceUnitLabel(unit)).join(', ')}), so the line mixes
                            unit prices with package prices. Worth reading point by point rather than as one trend.
                          </Text>
                        ) : null}
                      </View>
                    );
                  })()
                )}
              </>
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
                  <Text style={[styles.loadingText, styles.spaced, styles.panelStandalone]}>Pick a test above to see its own trend.</Text>
                ) : loading ? (
                  <Text style={[styles.loadingText, styles.spaced, styles.panelStandalone]}>Loading…</Text>
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
                  <Text style={[styles.loadingText, styles.panelStandalone]}>Looking through your logged history…</Text>
                ) : !patternResult || patternResult.totalSymptomInstances === 0 ? (
                  <Text style={[styles.loadingText, styles.panelStandalone]}>
                    {"Log a flare or food reaction in Signals first; there's nothing to look for a pattern in yet."}
                  </Text>
                ) : patternResult.foodCandidates.length === 0 &&
                  patternResult.dimensionCandidates.length === 0 &&
                  patternResult.categoryCandidates.length === 0 ? (
                  <Text style={[styles.loadingText, styles.panelStandalone]}>
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
                        <Text style={styles.patternSectionHeading}>Condition scoring factors</Text>
                        {patternResult.dimensionCandidates.map((candidate) => (
                          <View
                            key={`${candidate.conditionCode}::${candidate.subCriterion}::${candidate.tier}`}
                            style={styles.patternRow}
                          >
                            <View style={styles.patternRowText}>
                              <Text style={styles.patternRowTitle}>
                                {candidate.subCriterion} · {candidate.tier}
                              </Text>
                              <Text style={styles.patternRowCaption}>
                                Relevant to {candidate.conditionName} · logged before {candidate.occurrenceCount} of your{' '}
                                {patternResult.totalSymptomInstances} flares/reactions
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (personalizationProfile?.trackedConditions.length ?? 0) === 0 ? (
                      // 2026-08-26 -- an honest reason for an empty section,
                      // not a silent gap: dimension candidates only ever
                      // check sub-criteria relevant to a tracked condition
                      // now, so tracking nothing means there's genuinely
                      // nothing this section could ever check, regardless
                      // of what's actually been logged.
                      <View style={[styles.chartCard, styles.spaced]}>
                        <Text style={styles.patternSectionHeading}>Condition scoring factors</Text>
                        <Text style={styles.loadingText}>Set your tracked conditions in Profile to check for this.</Text>
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
      <MyItemsHub
        label="My Trends"
        tabColor={TAB_COLOR}
        open={myTrendsOpen}
        onOpenChange={setMyTrendsOpen}
      />
      <LensHub
        pageTitle="Trends"
        options={TRENDS_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Trends', icon: 'bookmarks-outline', onPress: () => setMyTrendsOpen(true) }}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

// The real, established 1-4 severity wording from app/(tabs)/log.tsx's own
// SeverityPicker (SEVERITY_OPTIONS) -- reused here rather than a second,
// independently-worded scale, so a Y-axis label on the Symptoms chart says
// the same thing the person actually tapped when logging it.
const SEVERITY_LABELS: Record<number, string> = { 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Very severe' };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  // 2026-08-16, direct on-device report: Pattern Finder's own real, honest
  // empty-state text ("Log a flare or food reaction in Signals first...")
  // read as "does nothing" -- traced to this being the one real Text style
  // on this whole page rendered bare over the shared photo background, with
  // no textShadow, the same real legibility bug already found and fixed
  // for Garden's/Home's own bare empty-state text. Every one of this page's
  // five lenses shares this style for its own "loading"/"nothing yet" copy,
  // so this fix isn't Pattern-Finder-specific -- it was always latent
  // everywhere this style is used, just most visible here since Pattern
  // Finder's own empty state is genuinely reachable with real, current
  // on-device data (zero logged flares/reactions, confirmed directly).
  // 2026-08-29, standing rule: no text sits directly on a tab's
  // photographic background. panelStandalone is for text with no card
  // to join (an empty state, an error or loading line);
  // groupHeadingChip is for a heading introducing a GROUP of separate
  // cards. A heading that labels ONE card should move inside that
  // card instead of using either.
  panelStandalone: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  groupHeadingChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  loadingText: { ...typography.body, ...textShadow, color: colors.textSecondary, marginBottom: 16 },
  spaced: { marginTop: 12 },

  // sectionHeading/pillRow's own pills sit above chartCard, not inside it
  // (page-level lens name/filters, not "content in a box") -- left neutral
  // for that reason. caption/legendText below ARE rendered inside
  // chartCard, so they follow TAB_COLOR, 2026-07-27.
  // 2026-08-29: sitting above the card means sitting on the photo, so it
  // carries its own surface now (standing rule: no text directly on the
  // tab background). Its colour is unchanged.
  sectionHeading: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...textShadow,
  },
  caption: { ...typography.body, color: TAB_COLOR, marginTop: 8, textAlign: 'center', ...textShadow },
  singleDayHeading: { ...typography.sectionTitle, fontSize: 26, textAlign: 'center', ...textShadow },
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
  smallPill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },

  // The custom date panel -- a plain, neutral box (matches disclaimerCard's
  // own treatment below), tucked directly under the pill row it belongs to
  // rather than styled like a real data card.
  customPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  customLabel: { ...typography.eyebrow, color: colors.menuIconMuted, marginBottom: 6, ...textShadow },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateFieldGroup: { alignItems: 'flex-start' },
  dateFieldLabel: { ...typography.eyebrow, color: colors.menuIconMuted, marginBottom: 4, ...textShadow },

  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: TAB_COLOR, ...textShadow },

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
  disclaimerText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  patternSectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 12, fontSize: 16, ...textShadow },
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
  patternRowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  patternRowCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  trialButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  trialButtonText: { ...typography.caption, fontWeight: '400', ...textShadow },
});
