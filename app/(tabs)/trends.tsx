import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { useInfoAlert } from '../../components/InfoAlert';
import { AppTextInput } from '../../components/AppTextInput';
import { VoiceInputButton } from '../../components/VoiceInputButton';
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
import { summarizeSourceSplit } from '../../lib/supplementWindow';
import { colors } from '../../constants/colors';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP } from '../../components/HomeSectionBand';
import { makeTabBandStyles, TabBand } from '../../components/TabBand';
import { useBandFolds } from '../../hooks/useBandFolds';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { describeTherapyResponse, summarizeTherapyResponse, type TherapyResponseResult } from '../../lib/therapyResponse';
import { therapyTypeLabel } from '../../lib/therapyTypes';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import {
  STRAIN_CAVEAT,
  describeStrainComparison,
  describeStrainRefusal,
  dimensionLabel,
} from '../../lib/workMeaning';
import {
  MOVEMENT_CAVEAT,
  describeMovementComparison,
  describeMovementRefusal,
} from '../../lib/movementMeaning';
import {
  getDietaryReferenceIntakesForCurrentUser,
  createPersonalRule,
  getFoodIdentity,
  getLabResultTrend,
  getLabTests,
  getStoredMeasurementSystem,
  getTherapyResponseInputs,
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
  keywordFromFoodName,
  proposeCategoryPatternRule,
  proposeDimensionPatternRule,
  proposeFoodPatternRule,
  type PatternRuleProposal,
} from '../../lib/patternRules';
import {
  dateStringOffsetFrom,
  getCheckinSeverityTrendSeries,
  getNutrientTrendSeriesForRange,
  getSixDimensionsFlagTrendSeriesForRange,
  getEatingWindowTrend,
  getSleepTrendPoints,
  getStepTrendPoints,
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
const band = makeTabBandStyles(TAB_COLOR);

type TrendsLens = 'nutrients' | 'sixDs' | 'symptoms' | 'eatingWindow' | 'weight' | 'movement' | 'labs' | 'groceries' | 'patterns' | 'therapyResponse';

// Shared across all three lenses' own Info content below -- the same
// caveat applies regardless of which chart you're looking at. Reworded
// 2026-08-15 once Pattern Finder actually shipped -- this used to say
// matching flares to specific foods "doesn't do yet," no longer true.
const TRENDS_PATTERN_CAVEAT_HELP: HelpSection = {
  heading: 'Finding patterns, not just charts',
  body: "This lens charts what you've already logged over time. For the app to actually match flares to specific foods and surface what recurs, see the Pattern Finder lens.",
};

const TRENDS_LENSES: LensOption<TrendsLens>[] = [
  {
    key: 'nutrients',
    label: 'Nutrients',
    icon: 'nutrition-outline',
    help: [
      {
        heading: 'Nutrients',
        body: "Pick a nutrient to see its percent-of-target trend across the date range, with a dashed line at 100%. Only days with at least one logged (or, for a future range, already scheduled) meal are plotted, so days with nothing to go on don't show up as false zeros. Tap any point on the line to see that exact day's value.",
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
        body: 'Meals you deliberately kept after the app told you they fell outside your declared eating window. Each one is a choice you made at the time, not a meal that merely happened to land outside a window, so a run of them says something about how the window is fitting your life.',
      },
      {
        heading: 'Why a zero day still shows',
        body: 'A day with meals scheduled and none of them outside the window is a true zero and is plotted as one. A day with no meals scheduled at all is left off entirely, since there is nothing to say about it either way.',
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
        body: "Every reading you've logged on Profile, over time. The chart's vertical range is scaled tight around your actual values, not pinned to zero, so day-to-day movement is actually visible.",
      },
    ],
  },
  // 2026-09-14. What the phone's health store brought in through Life >
  // Movement: steps per day and hours slept per night. Charted, not
  // interpreted.
  {
    key: 'movement',
    label: 'Movement',
    icon: 'walk-outline',
    help: [
      {
        heading: 'Steps',
        body: 'Steps per day, from the phone and watch by way of Health Connect, counted together without double counting. A day typed in by hand sits on the same line. A day with nothing recorded is left off rather than drawn as zero, because a phone whose step syncing is off has nothing to say, not nothing done.',
      },
      {
        heading: 'Sleep',
        body: 'Hours per night, dated by the morning it ended. Where the watch recorded stages, this is time asleep; where it only recorded the session, this is time in bed.',
      },
      {
        heading: 'Where it comes from',
        body: "Life > Movement connects the phone's health store and syncs it each time that area opens. Nothing is read in the background. If these charts are empty, start there.",
      },
      {
        heading: 'Beside symptoms',
        body: 'Pattern Finder shows weeks with less movement beside weeks with more, and the symptoms logged in each, once there are enough weeks to compare. Nothing here says one caused the other.',
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
    key: 'therapyResponse',
    label: 'Therapy Response',
    icon: 'hand-left-outline',
    help: [
      {
        heading: 'Therapy Response',
        body: 'For each hands-on therapy you have logged, this looks at your check-ins on the days after each session and compares them against your days away from any session. It answers the question that actually matters about a session: not whether it felt good at the time, but how many days it held.',
      },
      {
        heading: 'What it needs before it will say anything',
        body: 'At least three sessions of the same therapy, and enough check-ins both after those sessions and on ordinary days to compare them against. Below that it says so instead of showing a percentage worked out from one good afternoon. Log sessions under Signals > Hands-On Therapies and keep doing your ordinary check-ins there too.',
      },
      {
        heading: 'What the baseline is',
        body: 'Your baseline is every check-in on a day that is not within a week of any logged session, of any kind. If you had a massage on Tuesday and an adjustment on Friday, neither of those weeks counts as an ordinary week, and letting them would quietly compare one therapy against another while calling it a baseline. The number of baseline check-ins is always shown, so you can see how much it rests on.',
      },
      {
        heading: 'This is a count, not a verdict',
        body: 'Nothing here says a session caused anything. It reports what you logged, next to what you usually log. A therapy that reads no different from your ordinary days is an answer, and so is one where the days after read worse. Both are worth raising with whoever is treating you.',
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
        body: "Looks at what you actually ate before each flare or reaction you've logged, and shows what shows up more than once. This is a count of what's already in your data, not a diagnosis. Something showing up before 2 flares is worth a look; it's not proof of anything on its own.",
      },
      {
        heading: 'Condition scoring factors',
        body: 'This section only ever checks factors relevant to the conditions set in Profile, so a candidate here is always something one of your tracked conditions actually cares about, not any factor this app happens to score.',
      },
      {
        heading: 'The lookback window',
        body: "How far back before a symptom counts as 'before it' varies by person and condition, so pick whichever window feels closest to how your body actually reacts.",
      },
      {
        heading: 'Start a trial',
        body: "A food that shows up here can be sent straight into Signals as a food trial, the same deliberate, tracked way to actually test whether it is the cause, rather than just guessing from this list.",
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
    body: "These two can look ahead as well as back, reading what is already scheduled rather than only what has already been logged. A range that reaches past today shows a projection for the scheduled days, never a guess for a day nothing's actually planned on.",
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
    heading: 'Movement',
    body: "Steps per day and hours slept per night, as the phone's health store recorded them by way of Life > Movement. Days with nothing recorded are left off rather than drawn as zero.",
  },
  {
    heading: 'Pattern Finder',
    body: "Looks at what you actually ate before each flare or reaction you've logged, and surfaces whatever shows up more than once, as a count from your data rather than a diagnosis. Each food candidate carries a direct way to start a trial and actually test it.",
  },
];

export default function TrendsScreen() {
  useRegisterScreenHelp('Trends', TRENDS_HELP_SECTIONS, '/trends');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
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
  // Still used by the four lenses whose own picker didn't change.
  const [days, setDays] = useState<7 | 30 | 90>(30);
  // The new picker, Nutrients/Condition Scores only.
  const [dateRangeSelection, setDateRangeSelection] = useState<DateRangeSelection>({ kind: 'past', days: 30 });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customIsRange, setCustomIsRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  // Deep link from Home, 2026-09-12. Direct report: "This week's trend on
  // the Home screen just goes directly to the Trends screen without
  // anything selected to view. It mentions on mine that I have 24 flags
  // this week. I think when I tap to see the Trends it should show me 24
  // flags it is talking about." The same shape insights.tsx's own
  // openInsightsLens and schedule.tsx's own openScheduleLens already use,
  // validated against TRENDS_LENSES so a stale link falls through to the
  // resting picker. openTrendsRange='thisWeek' sets the exact seven days
  // Home summed (the last six days plus today) as a custom range, since no
  // fixed pill covers that: the 7d pill ends yesterday.
  const { openTrendsLens, openTrendsRange } = useLocalSearchParams<{ openTrendsLens?: string; openTrendsRange?: string }>();
  useFocusEffect(
    useCallback(() => {
      const requestedLens = TRENDS_LENSES.find((option) => option.key === openTrendsLens);
      if (requestedLens) {
        setLens(requestedLens.key);
        if (openTrendsRange === 'thisWeek') {
          const today = todayDateString();
          const start = dateStringOffsetFrom(today, -6);
          setCustomIsRange(true);
          setCustomStartDate(start);
          setCustomEndDate(today);
          setDateRangeSelection({ kind: 'custom', startDate: start, endDate: today });
        }
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [openTrendsLens, openTrendsRange]),
  );

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
  const [movementSeries, setMovementSeries] = useState<{ steps: TrendPoint[]; sleep: TrendPoint[] } | null>(null);
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
  const [therapyResponse, setTherapyResponse] = useState<TherapyResponseResult | null>(null);
  const [startingTrialKey, setStartingTrialKey] = useState<string | null>(null);
  // 2026-09-23: the rule being drafted from a pattern, if any. One at a
  // time, keyed by the same row key the trial button already uses, so
  // opening a second draft closes the first rather than leaving two
  // half-written boxes open down the list. `description` is held apart
  // from `proposal` because the proposal is what the app suggested and
  // the description is what the person has since made of it.
  const [ruleDraft, setRuleDraft] = useState<{
    key: string;
    proposal: PatternRuleProposal;
    description: string;
  } | null>(null);
  const [savingRule, setSavingRule] = useState(false);
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
    } else if (lens === 'movement') {
      Promise.all([getStepTrendPoints(days), getSleepTrendPoints(days)]).then(([steps, sleep]) => {
        setMovementSeries({ steps, sleep });
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
    } else if (lens === 'therapyResponse') {
      getTherapyResponseInputs(days)
        .then(({ sessions, checkins }) => {
          setTherapyResponse(summarizeTherapyResponse(sessions, checkins));
        })
        .finally(() => setLoading(false));
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
        showInfoAlert('Could not start a trial', "This food's reference entry could not be found.");
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

  // Turning something this lens noticed into one of the person's own
  // saved rules, 2026-09-23. The wording is proposed, never saved on the
  // person's behalf: lib/patternRules.ts builds the sentence from the
  // count alone, this opens it in an editable box, and nothing reaches
  // the database until Save is pressed. Same "the app suggests and the
  // person accepts" rule the healing stages already follow.
  async function handleDraftFoodRule(candidate: FoodPatternCandidate, key: string) {
    if (ruleDraft?.key === key) {
      setRuleDraft(null);
      return;
    }
    // The engine matches a food rule by looking for the keyword inside
    // the names of what was logged, so the keyword has to be the food
    // rather than its full reference name with the preparation on the
    // end. baseName is exactly that; the name itself is the fallback
    // when the identity row cannot be read.
    const identity = await getFoodIdentity(candidate.foodId, candidate.source);
    const proposal = proposeFoodPatternRule({
      foodName: candidate.foodName,
      keyword: identity?.baseName ?? keywordFromFoodName(candidate.foodName),
      occurrenceCount: candidate.occurrenceCount,
      totalSymptomInstances: patternResult?.totalSymptomInstances ?? 0,
    });
    setRuleDraft({ key, proposal, description: proposal.description });
  }

  function openRuleDraft(key: string, build: () => PatternRuleProposal) {
    if (ruleDraft?.key === key) {
      setRuleDraft(null);
      return;
    }
    const proposal = build();
    setRuleDraft({ key, proposal, description: proposal.description });
  }

  async function handleSaveRule() {
    if (!ruleDraft) return;
    const description = ruleDraft.description.trim();
    if (!description) {
      showInfoAlert('Almost there', 'Say what you want this rule to remind you of before saving it.');
      return;
    }
    setSavingRule(true);
    try {
      await createPersonalRule({
        description,
        source: 'self',
        linkType: ruleDraft.proposal.linkType,
        linkValue: ruleDraft.proposal.linkValue,
        linkLabel: ruleDraft.proposal.linkLabel,
      });
    } catch (error) {
      setSavingRule(false);
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
      return;
    }
    setSavingRule(false);
    setRuleDraft(null);
    showInfoAlert(
      'Saved to your rules',
      `${description}\n\nPause it or delete it under Insights > My Meds.`,
    );
  }

  // The editable box itself, rendered under whichever row opened it.
  function renderRuleDraft(key: string) {
    if (ruleDraft?.key !== key) return null;
    return (
      <View style={[styles.ruleDraft, { borderColor: TAB_COLOR }]}>
        <Text style={styles.patternRowCaption}>{ruleDraft.proposal.checkNote}</Text>
        <View style={styles.ruleDraftLabelRow}>
          <Text style={[styles.ruleDraftLabel, { color: TAB_COLOR }]}>What should this remind you of?</Text>
          <VoiceInputButton
            onResult={(text) => setRuleDraft((current) => (current ? { ...current, description: text } : current))}
            color={TAB_COLOR}
          />
        </View>
        <AppTextInput
          style={styles.ruleDraftInput}
          value={ruleDraft.description}
          onChangeText={(text) => setRuleDraft((current) => (current ? { ...current, description: text } : current))}
          placeholder="Say what you noticed, and what you want to do about it"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Text style={styles.patternRowCaption}>
          {
            'Starts from the count in your logged data. Edit it to whatever you actually want to be told, and it saves as something you noticed yourself.'
          }
        </Text>
        <View style={styles.ruleDraftButtons}>
          <TouchableOpacity style={[styles.trialButton, { borderColor: colors.border }]} onPress={() => setRuleDraft(null)}>
            <Text style={[styles.trialButtonText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.trialButton, { borderColor: TAB_COLOR }]}
            disabled={savingRule}
            onPress={handleSaveRule}
          >
            <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>{savingRule ? 'Saving…' : 'Save this rule'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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

  // Food against supplements over the charted range (2026-09-23), asked
  // for directly: the standing goal is that food supplies the optimum and
  // a supplement covers only what food cannot, and until now Trends drew
  // the two added together with no way to tell which had moved. The
  // arithmetic and every sentence live in lib/supplementWindow.ts.
  const nutrientSplit = useMemo(() => {
    const foodByDate = new Map((nutrientSeries?.foodPoints ?? []).map((point) => [point.date, point.value]));
    const points = (nutrientSeries?.points ?? [])
      .filter((point) => foodByDate.has(point.date))
      .map((point) => ({ date: point.date, foodPercent: foodByDate.get(point.date)!, totalPercent: point.value }));
    return summarizeSourceSplit(points, nutrientSeries?.supplementBasis ?? 'none');
  }, [nutrientSeries]);
  const singleDayFoodPercent = latestNutrientPoint
    ? (nutrientSeries?.foodPoints.find((point) => point.date === latestNutrientPoint.date)?.value ?? null)
    : null;
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
            <View style={band.heading}>
              <Text style={band.headingText}>{activeLensLabel}</Text>
            </View>

            {showsRangePicker ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
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
                  <View style={band.box}>
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
              <View style={[band.inset, styles.pillRow]}>
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
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Loading…</Text>
                  </View>
                ) : resolvedRange.isSingleDay ? (
                  <View style={[band.box, styles.chartCard]}>
                    {latestNutrientPoint ? (
                      <>
                        <Text style={[styles.singleDayHeading, { color: nutrientStatusColor(nutrientSeries?.latestStatus ?? null) }]}>
                          {Math.round(latestNutrientPoint.value)}% of target
                        </Text>
                        <Text style={styles.caption}>
                          {nutrientSeries?.displayName ?? selectedNutrient} · {formatDisplayDate(latestNutrientPoint.date)}
                        </Text>
                        {singleDayFoodPercent != null && latestNutrientPoint.value - singleDayFoodPercent >= 1 ? (
                          <Text style={styles.caption}>
                            {`Your food reached ${Math.round(singleDayFoodPercent)}% of it. What you take covered the rest.`}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.loadingText}>
                        {`Nothing logged or scheduled for ${formatDisplayDate(resolvedRange.startDate)} yet.`}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={[band.box, styles.chartCard]}>
                    <TrendLineChart
                      points={(nutrientSeries?.points ?? []).map((point) => ({ date: point.date, value: point.value }))}
                      yMin={0}
                      yMax={Math.max(120, ...(nutrientSeries?.points.map((point) => point.value) ?? [120]))}
                      referenceLine={100}
                      referenceLineLabel="100% target"
                      valueFormatter={(value) => `${Math.round(value)}%`}
                      lineColor={nutrientStatusColor(nutrientSeries?.latestStatus ?? null)}
                      emptyMessage="Log a few meals on different days (or schedule some ahead) to see this nutrient's trend."
                      secondaryPoints={nutrientSplit.supplementInvolved ? nutrientSeries?.foodPoints : undefined}
                      secondaryLabel="from food"
                    />
                    {nutrientSplit.daysCharted > 0 ? (
                      <>
                        <Text style={styles.caption}>{nutrientSplit.headline}</Text>
                        {nutrientSplit.legendNote ? <Text style={styles.caption}>{nutrientSplit.legendNote}</Text> : null}
                        {nutrientSplit.basisNote ? <Text style={styles.caption}>{nutrientSplit.basisNote}</Text> : null}
                      </>
                    ) : null}
                  </View>
                )}
              </>
            ) : lens === 'sixDs' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              ) : resolvedRange.isSingleDay ? (
                <View style={[band.box, styles.chartCard]}>
                  {sixDsSeries && sixDsSeries.length > 0 ? (
                    <>
                      <Text style={[styles.singleDayHeading, { color: colors.statusRedOnSurface }]}>
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
                <View style={[band.box, styles.chartCard]}>
                  {/* The total over the whole range, so a person sent here
                      by Home's "24 flags this week" finds that same 24
                      rather than having to add up the points. Same sum
                      Home makes over the same series. */}
                  {sixDsSeries && sixDsSeries.length > 0 ? (
                    <Text style={[styles.singleDayHeading, { color: colors.statusRedOnSurface }]}>
                      {`${Math.round(sixDsSeries.reduce((sum, point) => sum + point.value, 0))} flagged across ${sixDsSeries.length} ${sixDsSeries.length === 1 ? 'day' : 'days'}`}
                    </Text>
                  ) : null}
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
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              ) : (
                <View style={[band.box, styles.chartCard]}>
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
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              ) : !eatingWindowProfile ? (
                // Deliberately not an empty chart: with fasting off there
                // is no window to be outside of, so a flat zero line would
                // be claiming compliance with a rule that was never set.
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>
                    This tracks meals kept outside a declared eating window, and you do not have one set. Turn on
                    intermittent fasting in Profile, with a start and end time, and any meal you choose to keep outside
                    it will show up here.
                  </Text>
                </View>
              ) : (
                <View style={[band.box, styles.chartCard]}>
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
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
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
                    <View style={[band.box, styles.chartCard]}>
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
            ) : lens === 'movement' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              ) : (
                (() => {
                  const steps = movementSeries?.steps ?? [];
                  const sleep = movementSeries?.sleep ?? [];
                  const stepsRange = paddedTrendRange(steps.map((point) => point.value));
                  const sleepRange = paddedTrendRange(sleep.map((point) => point.value));
                  const stepsAverage = steps.length > 0 ? steps.reduce((sum, point) => sum + point.value, 0) / steps.length : null;
                  const sleepAverage = sleep.length > 0 ? sleep.reduce((sum, point) => sum + point.value, 0) / sleep.length : null;
                  return (
                    <>
                      <TabBand folds={folds} color={TAB_COLOR} id={'trends:movement:steps-per-day'} title={'Steps per day'} icon="walk-outline">
                        <View style={styles.chartCard}>
                        <TrendLineChart
                          points={steps}
                          yMin={Math.max(0, stepsRange.yMin)}
                          yMax={stepsRange.yMax}
                          valueFormatter={(value) => `${Math.round(value).toLocaleString()} steps`}
                          emptyMessage="Nothing recorded in this range. Connect the phone's health store under Life > Movement, or check that step syncing is on in its health app."
                        />
                        {stepsAverage !== null ? (
                          <Text style={styles.caption}>
                            {Math.round(stepsAverage).toLocaleString()} a day over {steps.length} recorded day{steps.length === 1 ? '' : 's'}
                          </Text>
                        ) : null}
                        </View>
                      </TabBand>
                      <TabBand folds={folds} color={TAB_COLOR} id={'trends:movement:hours-slept'} title={'Hours slept'} icon="moon-outline">
                        <View style={styles.chartCard}>
                        <TrendLineChart
                          points={sleep}
                          yMin={Math.max(0, sleepRange.yMin)}
                          yMax={sleepRange.yMax}
                          valueFormatter={(value) => `${value.toFixed(1)} h`}
                          emptyMessage="No sleep sessions in this range. Sleep needs a watch, ring or sleep app that writes to Health Connect; without one there is nothing to read."
                        />
                        {sleepAverage !== null ? (
                          <Text style={styles.caption}>
                            {sleepAverage.toFixed(1)} h a night over {sleep.length} recorded night{sleep.length === 1 ? '' : 's'}
                          </Text>
                        ) : null}
                        </View>
                      </TabBand>
                    </>
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
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>
                      Nothing to chart yet. Prices show up here once you have entered some on a grocery list.
                    </Text>
                  </View>
                ) : !selectedGroceryFood ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Pick a food above to see what it has cost over time.</Text>
                  </View>
                ) : loading ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Loading…</Text>
                  </View>
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
                      <View style={[band.box, styles.chartCard]}>
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
            ) : lens === 'therapyResponse' ? (
              <>
                <View style={band.boxMuted}>
                  <Text style={styles.disclaimerText}>
                    {
                      'This compares your check-ins on the days after each hands-on session against your check-ins on days away from any session. It is a count from your data, not a verdict on the therapy, and nothing here says a session caused anything.'
                    }
                  </Text>
                </View>

                {loading ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Reading your sessions and check-ins…</Text>
                  </View>
                ) : !therapyResponse || therapyResponse.totalSessions === 0 ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>
                      {
                        'No hands-on sessions logged in this range yet. Log one under Signals > Hands-On Therapies after your next appointment.'
                      }
                    </Text>
                  </View>
                ) : (
                  therapyResponse.summaries.map((summary) => {
                    const label = therapyTypeLabel(summary.therapyType);
                    return (
                      <TabBand
                        key={summary.therapyType}
                        folds={folds}
                        color={TAB_COLOR}
                        id={`trends:therapy:${summary.therapyType}`}
                        title={`${label} · ${summary.sessionCount} ${summary.sessionCount === 1 ? 'session' : 'sessions'}`}
                        icon="hand-left-outline"
                      >
                        <Text style={styles.patternRowCaption}>{describeTherapyResponse(summary, label.toLowerCase())}</Text>

                        {summary.hasEnoughData ? (
                          <>
                            {summary.byDayOffset.map((day) => (
                              <View key={day.dayOffset} style={styles.patternRow}>
                                <View style={styles.patternRowText}>
                                  <Text style={styles.patternRowTitle}>
                                    {day.dayOffset === 0 ? 'Same day' : `${day.dayOffset} ${day.dayOffset === 1 ? 'day' : 'days'} after`}
                                  </Text>
                                  <Text style={styles.patternRowCaption}>
                                    {day.checkinCount === 0
                                      ? 'No check-ins logged on these days.'
                                      : day.negativeShare === null
                                        ? `Only ${day.checkinCount} check-${day.checkinCount === 1 ? 'in' : 'ins'} here, too few to work out a share from.`
                                        : `${day.negativeCount} of ${day.checkinCount} check-ins reported something off (${Math.round(
                                            day.negativeShare * 100,
                                          )}%).`}
                                  </Text>
                                </View>
                              </View>
                            ))}
                            <Text style={styles.patternRowCaption}>
                              Baseline: {Math.round((summary.baselineNegativeShare ?? 0) * 100)}% of{' '}
                              {summary.baselineCheckinCount} check-ins on days away from any session.
                            </Text>
                          </>
                        ) : null}
                      </TabBand>
                    );
                  })
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
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Pick a test above to see its trend.</Text>
                  </View>
                ) : loading ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Loading…</Text>
                  </View>
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
                      <View style={[band.box, styles.chartCard]}>
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
                              ? ` · typical range ${test.typicalRangeLow} to ${test.typicalRangeHigh} ${test.rangeUnit ?? ''}`
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
                <View style={band.boxMuted}>
                  <Text style={styles.disclaimerText}>
                    {
                      "This shows what you actually ate before each flare or reaction you've logged, and what shows up more than once. It's a count from your data, not a diagnosis, and not proof anything here actually causes anything. Something worth a second look deserves a trial, not just a spot on this list."
                    }
                  </Text>
                </View>

                <View style={[band.inset, styles.pillRow]}>
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
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>Looking through your logged history…</Text>
                  </View>
                ) : !patternResult || patternResult.totalSymptomInstances === 0 ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>
                      {"Log a flare or food reaction in Signals first; there's nothing to look for a pattern in yet."}
                    </Text>
                  </View>
                ) : patternResult.foodCandidates.length === 0 &&
                  patternResult.dimensionCandidates.length === 0 &&
                  patternResult.categoryCandidates.length === 0 ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>
                      {"Nothing showed up before 2 or more of your "}
                      {patternResult.totalSymptomInstances}
                      {" logged flares/reactions in this window. That's a result too; try a longer window, or keep logging."}
                    </Text>
                  </View>
                ) : (
                  <>
                    {patternResult.foodCandidates.length > 0 ? (
                      <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:specific-foods'} title={'Specific foods'} icon="nutrition-outline">
                        {patternResult.foodCandidates.map((candidate) => {
                          const key = `${candidate.foodId}|${candidate.source}`;
                          return (
                            <View key={key}>
                              <View style={styles.patternRow}>
                                <View style={styles.patternRowText}>
                                  <Text style={styles.patternRowTitle}>{candidate.foodName}</Text>
                                  <Text style={styles.patternRowCaption}>
                                    Logged before {candidate.occurrenceCount} of your {patternResult.totalSymptomInstances} flares/reactions
                                  </Text>
                                </View>
                                <View style={styles.patternRowActions}>
                                  <TouchableOpacity
                                    style={[styles.trialButton, { borderColor: TAB_COLOR }]}
                                    disabled={startingTrialKey === key}
                                    onPress={() => handleStartTrial(candidate)}
                                  >
                                    <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>
                                      {startingTrialKey === key ? 'Starting…' : 'Start a trial'}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.trialButton, { borderColor: TAB_COLOR }]}
                                    onPress={() => handleDraftFoodRule(candidate, key)}
                                  >
                                    <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>
                                      {ruleDraft?.key === key ? 'Close' : 'Make this a rule'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              {renderRuleDraft(key)}
                            </View>
                          );
                        })}
                      </TabBand>
                    ) : null}

                    {patternResult.dimensionCandidates.length > 0 ? (
                      <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:scoring-factors'} title={'Condition scoring factors'} icon="analytics-outline">
                        {patternResult.dimensionCandidates.map((candidate) => {
                          const key = `${candidate.conditionCode}::${candidate.subCriterion}::${candidate.tier}`;
                          return (
                            <View key={key}>
                              <View style={styles.patternRow}>
                                <View style={styles.patternRowText}>
                                  <Text style={styles.patternRowTitle}>
                                    {candidate.subCriterion} · {candidate.tier}
                                  </Text>
                                  <Text style={styles.patternRowCaption}>
                                    Relevant to {candidate.conditionName} · logged before {candidate.occurrenceCount} of your{' '}
                                    {patternResult.totalSymptomInstances} flares/reactions
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={[styles.trialButton, { borderColor: TAB_COLOR }]}
                                  onPress={() =>
                                    openRuleDraft(key, () =>
                                      proposeDimensionPatternRule({
                                        subCriterion: candidate.subCriterion,
                                        tier: candidate.tier,
                                        conditionName: candidate.conditionName,
                                        occurrenceCount: candidate.occurrenceCount,
                                        totalSymptomInstances: patternResult.totalSymptomInstances,
                                      }),
                                    )
                                  }
                                >
                                  <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>
                                    {ruleDraft?.key === key ? 'Close' : 'Make this a rule'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              {renderRuleDraft(key)}
                            </View>
                          );
                        })}
                      </TabBand>
                    ) : (personalizationProfile?.trackedConditions.length ?? 0) === 0 ? (
                      // 2026-08-26 -- an honest reason for an empty section,
                      // not a silent gap: dimension candidates only ever
                      // check sub-criteria relevant to a tracked condition
                      // now, so tracking nothing means there's genuinely
                      // nothing this section could ever check, regardless
                      // of what's actually been logged.
                      <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:scoring-factors'} title={'Condition scoring factors'} icon="analytics-outline">
                        <Text style={styles.loadingText}>Set your tracked conditions in Profile to check for this.</Text>
                      </TabBand>
                    ) : null}

                    {patternResult.categoryCandidates.length > 0 ? (
                      <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:food-categories'} title={'Food categories'} icon="grid-outline">
                        {patternResult.categoryCandidates.map((candidate) => {
                          const key = `category::${candidate.category}`;
                          return (
                            <View key={key}>
                              <View style={styles.patternRow}>
                                <View style={styles.patternRowText}>
                                  <Text style={styles.patternRowTitle}>{candidate.category}</Text>
                                  <Text style={styles.patternRowCaption}>
                                    Logged before {candidate.occurrenceCount} of your {patternResult.totalSymptomInstances} flares/reactions
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={[styles.trialButton, { borderColor: TAB_COLOR }]}
                                  onPress={() =>
                                    openRuleDraft(key, () =>
                                      proposeCategoryPatternRule({
                                        category: candidate.category,
                                        occurrenceCount: candidate.occurrenceCount,
                                        totalSymptomInstances: patternResult.totalSymptomInstances,
                                      }),
                                    )
                                  }
                                >
                                  <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>
                                    {ruleDraft?.key === key ? 'Close' : 'Make this a rule'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              {renderRuleDraft(key)}
                            </View>
                          );
                        })}
                      </TabBand>
                    ) : null}
                  </>
                )}

                {!loading && patternResult ? (
                  <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:work-weeks'} title={'Work, week by week'} icon="briefcase-outline">
                    {patternResult.workStrainRefusal ? (
                      <Text style={styles.patternRowCaption}>
                        {describeStrainRefusal(patternResult.workStrainRefusal)}
                      </Text>
                    ) : (
                      <>
                        {patternResult.workStrainComparisons.map((comparison) => (
                          <View key={comparison.dimension} style={styles.patternRow}>
                            <View style={styles.patternRowText}>
                              <Text style={styles.patternRowTitle}>
                                {dimensionLabel(comparison.dimension)}
                                {comparison.notable ? '' : ' \u00b7 nothing in it'}
                              </Text>
                              <Text style={styles.patternRowCaption}>
                                {describeStrainComparison(comparison)}
                              </Text>
                            </View>
                          </View>
                        ))}
                        <Text style={styles.patternRowCaption}>{STRAIN_CAVEAT}</Text>
                      </>
                    )}
                  </TabBand>
                ) : null}

                {!loading && patternResult ? (
                  <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:movement-weeks'} title={'Movement, week by week'} icon="walk-outline">
                    {patternResult.movementRefusal ? (
                      <Text style={styles.patternRowCaption}>
                        {describeMovementRefusal(patternResult.movementRefusal)}
                      </Text>
                    ) : patternResult.movementComparison ? (
                      <>
                        <View style={styles.patternRow}>
                          <View style={styles.patternRowText}>
                            <Text style={styles.patternRowTitle}>
                              Steps a day{patternResult.movementComparison.notable ? '' : ' \u00b7 nothing in it'}
                            </Text>
                            <Text style={styles.patternRowCaption}>
                              {describeMovementComparison(patternResult.movementComparison)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.patternRowCaption}>{MOVEMENT_CAVEAT}</Text>
                      </>
                    ) : null}
                  </TabBand>
                ) : null}
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
  // No side inset, 2026-09-19: every top-level element is a band that
  // reaches both edges, and the pill rows take band.inset instead.
  content: { paddingBottom: 32, gap: HOME_BAND_GAP },
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
  // photographic background. Since 2026-09-19 an empty state, an error
  // or a loading line sits in band.boxMuted, and the lens name in
  // band.heading, both from components/TabBand.tsx.
  loadingText: { ...typography.body, ...textShadow, color: colors.textSecondary },
  spaced: { marginTop: 12 },

  // pillRow's pills sit above a chart, not inside it (page-level
  // filters, not "content in a box"), so they stay neutral. caption and
  // legendText below ARE rendered inside a chart's band, so they follow
  // TAB_COLOR, 2026-07-27.
  caption: { ...typography.body, color: TAB_COLOR, marginTop: 8, textAlign: 'center', ...textShadow },
  singleDayHeading: { ...typography.sectionTitle, fontSize: 26, textAlign: 'center', ...textShadow },
  // Added 2026-07-27: the chart itself used to float with no surrounding
  // box at all, the one page in this family with no "info box" anywhere --
  // wraps it in the same colors.surface/TAB_COLOR-border treatment every
  // other page's boxes use (see TAB_COLOR's own comment above).
  // 2026-09-19: the surface is band.box now; this only centres a chart.
  chartCard: { alignItems: 'center' },

  pillRow: { flexDirection: 'row', gap: 8 },
  // The scroller spans the screen (content has no side inset now); the
  // padding here keeps the first and last pill off the edge.
  nutrientPillRow: { flexDirection: 'row', gap: 8, paddingHorizontal: HOME_BAND_CONTENT_PADDING },
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

  // The custom date panel sits in band.box, directly under the pill row
  // it belongs to.
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
  disclaimerText: { ...typography.body, color: colors.textSecondary, ...textShadow },
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
  // Two buttons on one food row, which is the only row that has two.
  // Wrapping rather than shrinking: at a large font scale the pair goes
  // to two lines instead of squeezing the food name out of the row, and
  // this is reading text, so it scales without a cap.
  patternRowActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  ruleDraft: {
    borderWidth: 1,
    borderRadius: 10,
    padding: HOME_BAND_CONTENT_PADDING,
    marginBottom: 10,
    gap: 8,
    backgroundColor: colors.surface,
  },
  ruleDraftLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ruleDraftLabel: { ...typography.caption, fontWeight: '400', flex: 1, ...textShadow },
  ruleDraftInput: { minHeight: 72, textAlignVertical: 'top' },
  ruleDraftButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
});
