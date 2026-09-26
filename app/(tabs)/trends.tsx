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
import { YourStoryMissingLine } from '../../components/YourStoryMissingLine';
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
import { basisSentence, comparisonSentence, thresholdSentence } from '../../lib/patternBasis';
import { contextCaveat } from '../../lib/patternContext';
import { OUTCOME_WORDS, PATTERN_OUTCOMES, emptyOutcomeSentence, outcomeCountsSentence, type PatternOutcome } from '../../lib/patternOutcome';
import { DAILY_SCALES, answeredSentence, scaleWord, type DailyScaleKey, type DailyScalePoint } from '../../lib/dailyScales';
import { usualSentence } from '../../lib/yourUsual';
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
  getCustomTrackerSeries,
  getDailyScaleSeries,
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
import {
  TRENDS_TRACKERS_EMPTY_LINE,
  formatTrackerValue,
  trackerChartBounds,
  trackerKindLabel,
  trackerSummarySentence,
  type CustomTracker,
  type TrackerPoint,
} from '../../lib/customTrackers';
import {
  describeRepeat,
  METHOD_NOT_SAID,
  shortDate,
  summarizeEatingVariety,
  type EatingVarietySummary,
  type WeekCount,
} from '../../lib/eatingVariety';
import { getEatingVarietyInputs, getSafeListInputs } from '../../lib/eatingVarietyDb';
import type { KeepingUpSummary } from '../../lib/keepingUp';
import { getKeepingUpSummary } from '../../lib/keepingUpDb';
import { monthsBack, type HarvestYieldSummary, type PeriodRow } from '../../lib/harvestYield';
import { getEarliestGardenDate, getHarvestYieldSummary } from '../../lib/harvestYieldDb';
import { getEarliestReadingDate, getGrowingConditionsSummary, type GrowingConditionsSummary } from '../../lib/growingConditionsDb';
import type { CostSummary } from '../../lib/costOfEating';
import { getCostSummary, getEarliestMoneyDate } from '../../lib/costOfEatingDb';
import { summarizePlateShare, type PlateShareBand, type PlateValueBand } from '../../lib/plateSource';
import { getPlateUses, getPlateValueBand } from '../../lib/plateSourceDb';
import { CORE_NUTRIENT_CODES } from './index';
import { ReadingBandsView } from '../../components/ReadingBandsView';
import type { ReadingView } from '../../lib/readingBands';
import type { YourStoryItemKey } from '../../lib/yourStory';
import { loadTrendsMoreView, type TrendsMoreLens } from '../../lib/trendsMoreDb';

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border to carry that
// identity. Matches the same rule applied there, 2026-07-27.
const TAB_COLOR = colors.tabTrends;
const band = makeTabBandStyles(TAB_COLOR);

type TrendsLens =
  | 'nutrients'
  | 'sixDs'
  | 'variety'
  | 'symptoms'
  | 'eatingWindow'
  | 'weight'
  | 'movement'
  | 'labs'
  | 'groceries'
  | 'keepingUp'
  | 'harvest'
  | 'conditions'
  | 'cost'
  | 'patterns'
  | 'therapyResponse'
  | 'trackers'
  | TrendsMoreLens;

// The nine lenses built from the inputs-to-outputs map (1.0.52.7) all read
// through one loader into one ReadingView, so each needs only its line
// here rather than a state and a render branch of its own.
const MORE_LENSES: Record<TrendsMoreLens, { loadingLine: string; missingItem?: YourStoryItemKey }> = {
  hydration: { loadingLine: 'Reading what you drank…', missingItem: 'water' },
  bloodPressure: { loadingLine: 'Reading your blood pressure…' },
  bodySignals: { loadingLine: 'Reading your body signals…' },
  doses: { loadingLine: 'Reading your doses…', missingItem: 'meds' },
  care: { loadingLine: 'Reading your appointments…' },
  work: { loadingLine: 'Reading your work weeks…', missingItem: 'workCheckin' },
  reactions: { loadingLine: 'Reading reactions and food tests…', missingItem: 'checkin' },
  nights: { loadingLine: 'Reading your nights…' },
  ferments: { loadingLine: 'Reading your ferments…' },
  planned: { loadingLine: 'Reading what was planned and eaten…', missingItem: 'meal' },
};

function isMoreLens(lens: TrendsLens): lens is TrendsMoreLens {
  return lens in MORE_LENSES;
}

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
    key: 'variety',
    label: 'What You Eat',
    icon: 'restaurant-outline',
    help: [
      {
        heading: 'What You Eat',
        body: 'Six readings of the same logged meals: how many different foods a week, what keeps coming back, how much of it feeds your gut, how it gets cooked, how much of it came out of a package, and how your safe list has grown. Open a band to read it.',
      },
      {
        heading: 'A week you did not log is a gap, not a zero',
        body: 'A week with nothing logged reads as not logged rather than as zero, since a week you were too busy to log still had food in it. The number of blank weeks is shown under the count so you can see how much of the range the reading rests on.',
      },
      {
        heading: 'Why the number of different foods is worth watching',
        body: 'A narrow week is not a failure and nothing here scores it. It is worth seeing because narrowing tends to happen without being noticed, on a hard week or after cutting something out, and noticing it is what lets you widen it again on purpose. The suggestions come from your safe list, so they are foods you have already ruled on.',
      },
      {
        heading: 'Fermented and gut-supporting foods',
        body: "The gut-supporting count comes from the app's Microbiome Effects scoring, which is cited per food. Fermented foods are counted on top of that, from the cooking method you picked and from the food's name. Vinegar pickles are deliberately left out, since preserved in vinegar is not the same as fermented and nothing live survives it.",
      },
      {
        heading: 'What it could not tell',
        body: 'A meal typed as free text still counts toward how many different foods you ate, since you ate it. What it cannot do is say whether that was bought ready or made at home, so those are counted apart and named rather than folded into one side.',
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
    key: 'keepingUp',
    label: 'Keeping Up',
    icon: 'checkmark-done-outline',
    help: [
      {
        heading: 'Keeping Up',
        body: 'Five readings of how daily life is going: the things you tick off, the routines you walk, what you capture and whether it gets sorted, whether upkeep is getting done on time, and how work has felt. Open a band to read it.',
      },
      {
        heading: 'Nothing here is a score',
        body: 'A thin week is not a failure and nothing on this lens marks one. It is here because drifting happens quietly, on a hard week or after something changed, and seeing it is what lets you pick it back up on purpose.',
      },
      {
        heading: 'A day with no mark is not a day undone',
        body: 'The app knows when you tapped something, not what you did. Plenty gets done without anybody tapping anything, so a blank day means no mark was made and nothing more than that. A week with no marks at all reads as nothing marked rather than as zero.',
      },
      {
        heading: 'Two of these bands start from today',
        body: 'Routine walks and upkeep doings only began being kept on 23 September 2026. Before that the app held the last one and forgot the one before it, so those two bands count from the day they started keeping every one rather than pretending to see further back.',
      },
      {
        heading: 'Where each of these is recorded',
        body: 'Ticks and routines live on Life > Did I Do It and Life > Routines, captures in the Capture inbox, upkeep on Life > Upkeep, and the work check-in on Life > Work. This lens only reads them: everything is still added and changed where it lives.',
      },
    ],
  },
  {
    key: 'harvest',
    label: 'Garden Yield',
    icon: 'basket-outline',
    help: [
      {
        heading: 'Garden Yield',
        body: 'Four readings over the whole life of your garden: what it gave and when, how long each crop took against how long you expected, what your compost has produced and where it went, and what has gone out to other people or come back from them. Open a band to read it.',
      },
      {
        heading: 'Why this one counts in months',
        body: 'A garden gives nothing for months and then gives everything at once, so a week is the wrong length to look at it in. The range picker here offers a year at a time rather than the 7, 30 and 90 days the other lenses use.',
      },
      {
        heading: 'A blank month is not a month that grew nothing',
        body: 'Most gardens have a season. A month with nothing recorded is left blank and counted, rather than drawn as a zero, because the app cannot tell an out-of-season month from one where picking simply did not get logged.',
      },
      {
        heading: 'Weights and counts stay apart',
        body: 'Grams, kilos, ounces and pounds all add up together. A count of cucumbers is not a weight and never joins one, and anything measured another way (bunches, buckets) is kept on a line of its own. Percentages are only ever taken of a weight, so a crop you count rather than weigh has no share next to it.',
      },
      {
        heading: 'Where each of these is recorded',
        body: 'Pickings go in on Garden > Harvest Log, plantings and their expected dates on Garden > Plots & Plantings, compost on Garden > Compost, and what went out or came back on Garden > Harvest Log. This lens only reads them: everything is still added and changed where it lives.',
      },
    ],
  },
  // 2026-09-23, stage 0 of the sensor work. A lens rather than a band on
  // Garden Yield: the conditions a garden was kept in are a subject of
  // their own, and they stay worth keeping for somebody who never picks
  // anything (a houseplant, a seedling tray, an indoor tent between grows).
  {
    key: 'conditions',
    label: 'Growing Conditions',
    icon: 'thermometer-outline',
    help: [
      {
        heading: 'Growing Conditions',
        body: 'Three readings over what you have measured: one measurement month by month, everything you are measuring and how recently, and which areas have readings against them. Pick the measurement with the buttons above the first band.',
      },
      {
        heading: 'Why this one counts in months',
        body: 'Soil warms and cools over a season, not over a week, so this shares the range picker Garden Yield uses: a year at a time rather than the 7, 30 and 90 days the other lenses offer.',
      },
      {
        heading: 'Added up, or averaged',
        body: 'Rainfall and water given are added up over a month, since what a month gave is the sum of what fell. Everything else is averaged, and the month also says its lowest and highest reading, since an average soil temperature hides the night that dropped below freezing.',
      },
      {
        heading: 'Units that mean the same thing, and units that do not',
        body: 'Celsius and Fahrenheit are the same quantity read two ways, so a month mixing them is worked out in one of them. A moisture percentage and a tensiometer centibar are not, and neither are lux and PPFD, so readings in the odd one out are set aside with a line saying how many and in what unit, rather than being folded in as if they matched.',
      },
      {
        heading: 'A blank month is not a month with nothing to measure',
        body: 'A month with no readings is left blank and counted rather than drawn as a zero, the same rule the rest of Trends follows. Where a sensor has been feeding readings in, the blank says nothing came in, which is a different thing from nobody having measured.',
      },
      {
        heading: 'Where this is recorded',
        body: 'Readings go in on Garden > Growing Conditions, by hand, from any meter or by eye. This lens only reads them.',
      },
    ],
  },
  {
    key: 'cost',
    label: 'What It Costs',
    icon: 'cash-outline',
    help: [
      {
        heading: 'What It Costs',
        body: 'Four readings on the money side of living this way: what your condition has cost month by month, what eating this way comes to a day, what the garden costs against what it gave, and what supplements cost beside what food is reaching on its own. Open a band to read it.',
      },
      {
        heading: 'Life > Finances is still the ledger',
        body: 'Every account, bill, budget and total lives on Life > Finances, and nothing here changes any of it. This lens asks the four questions a ledger cannot answer by itself, because answering them means knowing which condition a bill was for, which shopping line came out of your kitchen, how many kilos a bed gave for what it cost, and which nutrients your food is reaching.',
      },
      {
        heading: 'Only money you recorded on a date',
        body: 'A repeating bill on Finances says what is meant to happen every month. This counts only what was entered against a day, so a month you did not get to is left blank rather than filled in from a rule.',
      },
      {
        heading: 'A blank month is not a month you spent nothing',
        body: 'Months with nothing recorded are left blank and counted under each headline, and every average divides by the months that carried a record rather than by the whole stretch.',
      },
      {
        heading: 'Nothing here says a supplement was unnecessary',
        body: 'The last band reports what food by itself is reaching, which is the goal this app is built around. It never says that stopping a supplement was right. Nothing in this app records a dose being swallowed, and none of it is advice to stop taking anything.',
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
    key: 'hydration',
    label: "Hydration",
    icon: 'water-outline',
    help: [
      {
        heading: "Hydration",
        body: "Every drink you log as a meal, counted by week, by kind and by time of day, beside how much of the day's water target your logged food and drink reached.",
      },
      {
        heading: "Reading it",
        body: "Nothing here says one thing led to another. It sets what you logged side by side, and a week with nothing logged shows as a gap rather than as none.",
      },
    ],
  },
  {
    key: 'bloodPressure',
    label: "Blood Pressure",
    icon: 'heart-outline',
    help: [
      {
        heading: "Blood Pressure",
        body: "Every reading you have entered on Signals, the latest first, then by week and by time of day. Your usual range is the middle of your earlier readings, which is what they have been, never what they should be.",
      },
      {
        heading: "The numbers to aim for",
        body: "Those come from whoever looks after your blood pressure. This lens only shows what you wrote down.",
      },
    ],
  },
  {
    key: 'bodySignals',
    label: "Body Signals",
    icon: 'watch-outline',
    help: [
      {
        heading: "Body Signals",
        body: "Resting heart rate, heart rate, heart rate variability, blood oxygen, glucose and skin temperature, as your watch, ring or meter wrote them to Health Connect. Each has its latest reading, your usual range and a figure for every week.",
      },
      {
        heading: "Getting them here",
        body: "They come in when Life > Movement opens, once Health Connect is allowed there. Only the signals your devices record appear, and a week with no readings shows as a gap rather than as none.",
      },
      {
        heading: "No score",
        body: "Your usual range is the middle of your earlier readings, which is what they have been, never what they should be. What any of these figures should be for you is a question for whoever looks after your health.",
      },
    ],
  },
  {
    key: 'doses',
    label: "Doses Over Time",
    icon: 'medkit-outline',
    help: [
      {
        heading: "Doses Over Time",
        body: "Every dose on your schedule, by week, by time of day and by item, counted as marked taken, marked skipped, or not marked. A dose nobody marked is not counted as missed.",
      },
      {
        heading: "Not advice",
        body: "Nothing here suggests changing a dose or when you take it. That is a conversation with your prescriber.",
      },
    ],
  },
  {
    key: 'care',
    label: "Appointments & Care",
    icon: 'calendar-outline',
    help: [
      {
        heading: "Appointments & Care",
        body: "Every appointment on your schedule, grouped by kind and by who you saw, with how long it has usually been between visits, and what is coming up next.",
      },
    ],
  },
  {
    key: 'work',
    label: "Work",
    icon: 'briefcase-outline',
    help: [
      {
        heading: "Work",
        body: "Your weekly work check-ins over time, with the sleep and flares logged in the same weeks set beside them.",
      },
      {
        heading: "Reading it",
        body: "Nothing here says one thing led to another. It sets what you logged side by side, and a week with nothing logged shows as a gap rather than as none.",
      },
    ],
  },
  {
    key: 'reactions',
    label: "Reactions & New Foods",
    icon: 'alert-circle-outline',
    help: [
      {
        heading: "Reactions & New Foods",
        body: "Every food test you have run and how it stands, then the reactions you logged after meals, by week and one by one.",
      },
      {
        heading: "Reading it",
        body: "Nothing here says one thing led to another. It sets what you logged side by side, and a week with nothing logged shows as a gap rather than as none.",
      },
    ],
  },
  {
    key: 'nights',
    label: "Nights",
    icon: 'moon-outline',
    help: [
      {
        heading: "Nights",
        body: "How many times you got up in the night, from Signals > Nocturia, by week, beside whether you logged a drink from six in the evening on, and the usual time you first woke.",
      },
      {
        heading: "Reading it",
        body: "Nothing here says one thing led to another. It sets what you logged side by side, and a week with nothing logged shows as a gap rather than as none.",
      },
    ],
  },
  {
    key: 'trackers',
    label: 'My Trackers',
    icon: 'options-outline',
    help: [
      {
        heading: 'My Trackers',
        body: 'One chart for each tracker you named on Signals > My Trackers. A count or a length of time adds up over the day; a scale or a measurement is the day averaged when you logged more than once.',
      },
      {
        heading: 'Reading it',
        body: 'A day with nothing logged shows as a gap rather than a zero, and a past tracker still shows here when it has entries in the range. Nothing here says whether a number is good or bad, or what led to it.',
      },
    ],
  },
  {
    key: 'ferments',
    label: "Ferments",
    icon: 'flask-outline',
    help: [
      {
        heading: "Ferments",
        body: "Batches you started, what is still going, and how much of what you made has been drunk, with each unit kept on its own line.",
      },
    ],
  },
  {
    key: 'planned',
    label: "Planned and Eaten",
    icon: 'clipboard-outline',
    help: [
      {
        heading: "Planned and Eaten",
        body: "Every meal on your schedule and how it went: eaten as planned, partly, something else instead, skipped, or not marked. A meal nobody marked is not counted as skipped.",
      },
      {
        heading: "Reading it",
        body: "This is a record of how plans and days lined up, never a grade on either.",
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
        heading: 'What each finding is based on',
        body: 'The top of the list says how many flares and reactions were looked at and how many had meals logged before them. Each row then compares how often the food came before a flare with how often it turns up in any stretch of the same length, so a food you eat every day does not look suspicious just for being everywhere.',
      },
      {
        heading: 'Test this',
        body: 'A food that shows up here can be tested as an experiment in Signals: leave it out for a set number of days, then bring it back, and see what was logged before, without it and after. One run on one person can still be chance, and it says so.',
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

// The weekly bands draw as labelled rows rather than as a line, because a
// week nobody logged has to read as not logged. On a line chart a blank
// week either joins to its neighbours, which invents a week that never
// happened, or sits at zero, which says somebody ate nothing. A row can
// simply say so.
// emptyLabel exists because "not logged" is the right words for meals and
// the wrong ones for a week nobody ticked anything off in: the app was
// used, nothing was marked. Each caller says what a blank means there.
function renderWeekRows(weeks: WeekCount[], emptyLabel: string = 'not logged') {
  const highest = Math.max(1, ...weeks.map((week) => week.value ?? 0));
  return (
    <View style={styles.weekRows}>
      {weeks.map((week) => (
        <View key={week.weekStart} style={styles.shareRow}>
          <Text style={styles.shareLabel} numberOfLines={1}>
            {shortDate(week.weekStart)}
          </Text>
          <View style={styles.shareTrack}>
            {week.value === null ? null : (
              <View
                style={[
                  styles.shareBar,
                  { width: `${Math.max(2, Math.round((week.value / highest) * 100))}%`, backgroundColor: TAB_COLOR },
                ]}
              />
            )}
          </View>
          <Text style={styles.weekValue} numberOfLines={1}>
            {week.value === null ? emptyLabel : String(week.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// The same drawing as renderWeekRows, over a period that carries its own
// label and its own formatted figure. A weight cannot be printed with
// String(value) the way a count can: 2450 grams reads as 2.5 kg or 5.4 lb
// depending on what the person set, and the bar still needs the raw
// number to size itself against. So the row carries both.
function renderPeriodRows(rows: PeriodRow[]) {
  const highest = Math.max(1, ...rows.map((row) => row.value ?? 0));
  return (
    <View style={styles.weekRows}>
      {rows.map((row) => (
        <View key={row.key} style={styles.shareRow}>
          <Text style={styles.shareLabel} numberOfLines={1}>
            {row.label}
          </Text>
          <View style={styles.shareTrack}>
            {row.value === null || row.value === 0 ? null : (
              <View
                style={[
                  styles.shareBar,
                  { width: `${Math.max(2, Math.round((row.value / highest) * 100))}%`, backgroundColor: TAB_COLOR },
                ]}
              />
            )}
          </View>
          <Text style={styles.weekValue} numberOfLines={1}>
            {row.display}
          </Text>
        </View>
      ))}
    </View>
  );
}

// A garden earns over seasons and money adds up the same way, so those two
// lenses get this picker rather than the 7, 30 and 90 days the others share.
// Everything resolves per lens: to the earliest thing recorded anywhere in
// the garden for Garden Yield, and to the earliest money recorded for What
// It Costs, so a garden logged since 2019 with one receipt entered last
// month does not draw six blank years of spending.
const MONTH_RANGE_OPTIONS = [
  { value: 12, label: 'Last 12 months' },
  { value: 24, label: 'Last 2 years' },
  { value: 0, label: 'Everything' },
] as const;

export default function TrendsScreen() {
  useRegisterScreenHelp('Trends', TRENDS_HELP_SECTIONS, '/trends');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [moreView, setMoreView] = useState<ReadingView | null>(null);
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
  // Fiber rides alongside whichever nutrient is picked rather than sitting
  // in the picker: it is the one nutrient most people fall short on, and
  // CORE_NUTRIENT_CODES also feeds Home's rings and the Overview report, so
  // adding it there would have changed both without being asked.
  const [fiberSeries, setFiberSeries] = useState<NutrientTrendSeries | null>(null);
  const [varietySummary, setVarietySummary] = useState<EatingVarietySummary | null>(null);
  // Phase 6 of the 2026-09-23 push. Two bands rather than a lens of their
  // own: what the garden put on a plate is a part of what gets eaten and a
  // part of what eating costs, so each rides on the lens that already asks
  // that question. Loaded beside those lenses' own summaries, since neither
  // lib/eatingVariety.ts nor lib/costOfEating.ts reads harvest_uses.
  const [plateShare, setPlateShare] = useState<PlateShareBand | null>(null);
  const [plateValue, setPlateValue] = useState<PlateValueBand | null>(null);
  const [keepingUpSummary, setKeepingUpSummary] = useState<KeepingUpSummary | null>(null);
  const [harvestSummary, setHarvestSummary] = useState<HarvestYieldSummary | null>(null);
  // 0 means everything, resolved against the earliest date the garden has.
  const [harvestMonths, setHarvestMonths] = useState<12 | 24 | 0>(12);
  const [conditionsSummary, setConditionsSummary] = useState<GrowingConditionsSummary | null>(null);
  // Months again, for the reason Garden Yield counts in them: a season is
  // the length soil and air move over. Its own state rather than shared
  // with the other two month lenses, same reasoning as the cost range.
  const [conditionMonths, setConditionMonths] = useState<12 | 24 | 0>(12);
  // Null means whatever the summary picks, which is the measurement with
  // the most recent reading. Set once the person taps another.
  const [pickedMeasurement, setPickedMeasurement] = useState<string | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  // Its own state rather than harvestMonths shared: the two lenses reach
  // back over different records, and a range chosen for one should not
  // silently move the other.
  const [costMonths, setCostMonths] = useState<12 | 24 | 0>(12);
  const [loading, setLoading] = useState(true);

  const [nutrientSeries, setNutrientSeries] = useState<NutrientTrendSeries | null>(null);
  const [sixDsSeries, setSixDsSeries] = useState<TrendPoint[] | null>(null);
  const [symptomsSeries, setSymptomsSeries] = useState<CheckinSeverityPoint[] | null>(null);
  const [scaleSeries, setScaleSeries] = useState<Record<DailyScaleKey, DailyScalePoint[]> | null>(null);
  const [trackerSeries, setTrackerSeries] = useState<{ tracker: CustomTracker; points: TrackerPoint[] }[] | null>(null);
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
  // What Pattern Finder counts (D1, 2026-09-26): flares and reactions, or
  // the days mood or energy was rated 1 or 2, or stress 4 or 5.
  const [patternOutcome, setPatternOutcome] = useState<PatternOutcome>('flares');
  const outcomeWords = OUTCOME_WORDS[patternOutcome];
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
    if (isMoreLens(lens)) {
      loadTrendsMoreView(lens, days)
        .then(setMoreView)
        .catch(() => setMoreView(null))
        .finally(() => setLoading(false));
    } else if (lens === 'nutrients') {
      Promise.all([
        getNutrientTrendSeriesForRange(selectedNutrient, resolvedRange.startDate, resolvedRange.endDate),
        getNutrientTrendSeriesForRange('fiber_total', resolvedRange.startDate, resolvedRange.endDate),
      ]).then(([series, fiber]) => {
        setNutrientSeries(series);
        setFiberSeries(fiber);
        setLoading(false);
      });
    } else if (lens === 'variety') {
      // Always ends today, which is what lets the repetition band say how
      // long ago something was last logged rather than how far it sat from
      // the end of some range.
      const varietyEnd = todayDateString();
      const varietyStart = dateStringOffsetFrom(varietyEnd, -(days - 1));
      Promise.all([
        getEatingVarietyInputs(varietyStart, varietyEnd),
        getSafeListInputs(),
        getPlateUses(varietyStart, varietyEnd),
      ])
        .then(([inputs, safe, uses]) => {
          const summary = summarizeEatingVariety(inputs, safe.safeFoods, safe.trials);
          setVarietySummary(summary);
          // Same weeks as every other band on this lens, so a blank week is
          // blank in the same places.
          setPlateShare(
            summarizePlateShare(
              { startDate: varietyStart, endDate: varietyEnd, eaten: inputs.records, uses },
              summary.weeks,
            ),
          );
        })
        .finally(() => setLoading(false));
    } else if (lens === 'keepingUp') {
      // Ends today for the same reason Variety does: a streak is a run up
      // to now, and counting one to the end of some past range would say a
      // person is on a run they finished three weeks ago.
      const keepingUpEnd = todayDateString();
      getKeepingUpSummary(dateStringOffsetFrom(keepingUpEnd, -(days - 1)), keepingUpEnd)
        .then(setKeepingUpSummary)
        .finally(() => setLoading(false));
    } else if (lens === 'harvest') {
      // Ends today, and reaches back in whole months: a picking belongs to
      // the month it happened in, and a range ending in the middle of one
      // would compare a half month against eleven whole ones.
      const harvestEnd = todayDateString();
      (harvestMonths === 0 ? getEarliestGardenDate() : Promise.resolve(null))
        .then((earliest) =>
          getHarvestYieldSummary(
            harvestMonths === 0
              ? (earliest ? `${earliest.slice(0, 7)}-01` : monthsBack(harvestEnd, 12))
              : monthsBack(harvestEnd, harvestMonths),
            harvestEnd,
            measurementSystem === 'imperial' ? 'imperial' : 'metric',
          ),
        )
        .then(setHarvestSummary)
        .finally(() => setLoading(false));
    } else if (lens === 'conditions') {
      // Whole months, the same reason Garden Yield uses them.
      const conditionsEnd = todayDateString();
      (conditionMonths === 0 ? getEarliestReadingDate() : Promise.resolve(null))
        .then((earliest) =>
          getGrowingConditionsSummary(
            conditionMonths === 0
              ? (earliest ? `${earliest.slice(0, 7)}-01` : monthsBack(conditionsEnd, 12))
              : monthsBack(conditionsEnd, conditionMonths),
            conditionsEnd,
            pickedMeasurement,
          ),
        )
        .then(setConditionsSummary)
        .finally(() => setLoading(false));
    } else if (lens === 'cost') {
      // Whole months, the same reason Garden Yield uses them: a receipt
      // belongs to the month it was dated, and a range ending mid-month
      // would set a half month beside eleven whole ones.
      const costEnd = todayDateString();
      (costMonths === 0 ? getEarliestMoneyDate() : Promise.resolve(null))
        .then((earliest) => {
          const costStart =
            costMonths === 0
              ? (earliest ? `${earliest.slice(0, 7)}-01` : monthsBack(costEnd, 12))
              : monthsBack(costEnd, costMonths);
          return Promise.all([getCostSummary(costStart, costEnd), getPlateValueBand(costStart, costEnd)]);
        })
        .then(([summary, plate]) => {
          setCostSummary(summary);
          setPlateValue(plate);
        })
        .finally(() => setLoading(false));
    } else if (lens === 'sixDs') {
      const conditionCodes = personalizationProfile?.trackedConditions.map((condition) => condition.code) ?? [];
      getSixDimensionsFlagTrendSeriesForRange(resolvedRange.startDate, resolvedRange.endDate, conditionCodes).then((points) => {
        setSixDsSeries(points);
        setLoading(false);
      });
    } else if (lens === 'trackers') {
      getCustomTrackerSeries(days).then((series) => {
        setTrackerSeries(series);
        setLoading(false);
      });
    } else if (lens === 'symptoms') {
      Promise.all([getCheckinSeverityTrendSeries(['flare', 'post_meal'], days), getDailyScaleSeries(days)]).then(([points, scales]) => {
        setSymptomsSeries(points);
        setScaleSeries(scales);
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
      findFoodPatterns(days, patternWindow, personalizationProfile?.trackedConditions ?? [], patternOutcome).then((result) => {
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
  }, [lens, days, harvestMonths, conditionMonths, pickedMeasurement, costMonths, measurementSystem, resolvedRange, selectedNutrient, selectedTestCode, selectedGroceryFood, patternWindow, patternOutcome, personalizationProfile]);

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
          trialDesign: 'remove_return',
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
      words: outcomeWords,
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

  const fiberChart = useMemo(() => {
    const points = (fiberSeries?.points ?? []).map((point) => ({ date: point.date, value: point.value }));
    if (points.length === 0) return null;
    const latest = points[points.length - 1];
    const average = Math.round(points.reduce((sum, point) => sum + point.value, 0) / points.length);
    const atTarget = points.filter((point) => point.value >= 100).length;
    return {
      points,
      title: `Fiber, ${average}% of target on average`,
      caption: `${atTarget} of ${points.length} logged ${points.length === 1 ? 'day' : 'days'} reached the target. Most recent: ${Math.round(latest.value)}%.`,
    };
  }, [fiberSeries]);

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
            ) : lens === 'harvest' || lens === 'conditions' || lens === 'cost' ? (
              <View style={[band.inset, styles.pillRow]}>
                {MONTH_RANGE_OPTIONS.map((option) => {
                  const months =
                    lens === 'cost' ? costMonths : lens === 'conditions' ? conditionMonths : harvestMonths;
                  const chosen = months === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.pill, chosen && styles.pillActive]}
                      onPress={() =>
                        lens === 'cost'
                          ? setCostMonths(option.value)
                          : lens === 'conditions'
                            ? setConditionMonths(option.value)
                            : setHarvestMonths(option.value)
                      }
                    >
                      <Text style={[styles.pillText, chosen && styles.pillTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                {fiberChart && !resolvedRange.isSingleDay ? (
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:nutrients:fiber"
                    title={fiberChart.title}
                    icon="leaf-outline"
                  >
                    <View style={[band.box, styles.chartCard]}>
                      <TrendLineChart
                        points={fiberChart.points}
                        yMin={0}
                        yMax={Math.max(120, ...fiberChart.points.map((point) => point.value))}
                        referenceLine={100}
                        referenceLineLabel="100% target"
                        valueFormatter={(value) => `${Math.round(value)}%`}
                        lineColor={TAB_COLOR}
                        emptyMessage="Log a few meals on different days to see your fiber trend."
                      />
                    </View>
                    <Text style={styles.patternRowCaption}>{fiberChart.caption}</Text>
                    <Text style={styles.patternRowCaption}>
                      {
                        'Fiber is what most of the bacteria in your gut live on, which is why it sits above the picker rather than inside it. The target is the NASEM adequate intake for your age and sex.'
                      }
                    </Text>
                  </TabBand>
                ) : null}
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
            ) : lens === 'variety' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Reading what you have logged…</Text>
                </View>
              ) : !varietySummary || !varietySummary.hasAnything ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>
                    {'Nothing logged in this range yet. Log a few meals on the Food tab and this fills in on its own.'}
                  </Text>
                  <YourStoryMissingLine itemKey="trends" />
                </View>
              ) : (
                <>
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:distinct"
                    title="How many different foods"
                    icon="color-palette-outline"
                  >
                    <Text style={styles.patternRowCaption}>{varietySummary.distinct.headline}</Text>
                    {renderWeekRows(varietySummary.distinct.weeks)}
                    {varietySummary.distinct.gapNote ? (
                      <Text style={styles.patternRowCaption}>{varietySummary.distinct.gapNote}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>
                      {`${varietySummary.distinct.distinctAcrossRange} different foods across the whole range.`}
                    </Text>
                    {varietySummary.nearThingsNote ? (
                      <Text style={styles.patternRowCaption}>{varietySummary.nearThingsNote}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:rotation"
                    title="What keeps coming back"
                    icon="repeat-outline"
                  >
                    <Text style={styles.patternRowCaption}>{varietySummary.rotation.headline}</Text>
                    {varietySummary.rotation.mostRepeated.map((repeat) => (
                      <View key={repeat.foodKey} style={styles.patternRow}>
                        <View style={styles.patternRowText}>
                          <Text style={styles.patternRowTitle}>{repeat.foodName}</Text>
                          <Text style={styles.patternRowCaption}>{describeRepeat(repeat)}</Text>
                        </View>
                      </View>
                    ))}
                    {varietySummary.rotation.concentrationNote ? (
                      <Text style={styles.patternRowCaption}>{varietySummary.rotation.concentrationNote}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:gut"
                    title="Foods that feed your gut"
                    icon="leaf-outline"
                  >
                    <Text style={styles.patternRowCaption}>{varietySummary.gutFoods.headline}</Text>
                    {renderWeekRows(varietySummary.gutFoods.weeks)}
                    {varietySummary.gutFoods.names.length > 0 ? (
                      <Text style={styles.patternRowCaption}>
                        {`In this range: ${varietySummary.gutFoods.names.join(', ')}.`}
                      </Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:methods"
                    title="How it gets cooked"
                    icon="flame-outline"
                  >
                    <Text style={styles.patternRowCaption}>{varietySummary.methodMix.headline}</Text>
                    {varietySummary.methodMix.shares.map((share) => (
                      <View key={share.method} style={styles.shareRow}>
                        <Text style={styles.shareLabel} numberOfLines={1}>
                          {share.method}
                        </Text>
                        <View style={styles.shareTrack}>
                          <View
                            style={[
                              styles.shareBar,
                              {
                                width: `${Math.max(2, Math.round(share.share * 100))}%`,
                                backgroundColor: share.method === METHOD_NOT_SAID ? colors.surfaceMuted : TAB_COLOR,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.weekValue} numberOfLines={1}>{`${Math.round(share.share * 100)}%`}</Text>
                      </View>
                    ))}
                    {varietySummary.methodMix.notSaidNote ? (
                      <Text style={styles.patternRowCaption}>{varietySummary.methodMix.notSaidNote}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:packaged"
                    title="Bought ready against made at home"
                    icon="basket-outline"
                  >
                    <Text style={styles.patternRowCaption}>{varietySummary.packaged.headline}</Text>
                    {varietySummary.packaged.boughtShare !== null ? (
                      <View style={styles.shareRow}>
                        <Text style={styles.shareLabel} numberOfLines={1}>
                          Bought ready
                        </Text>
                        <View style={styles.shareTrack}>
                          <View
                            style={[
                              styles.shareBar,
                              {
                                width: `${Math.max(2, Math.round(varietySummary.packaged.boughtShare * 100))}%`,
                                backgroundColor: TAB_COLOR,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.weekValue} numberOfLines={1}>
                          {`${Math.round(varietySummary.packaged.boughtShare * 100)}%`}
                        </Text>
                      </View>
                    ) : null}
                    {varietySummary.packaged.unknownNote ? (
                      <Text style={styles.patternRowCaption}>{varietySummary.packaged.unknownNote}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:safelist"
                    title="How your safe list has grown"
                    icon="shield-checkmark-outline"
                  >
                    <Text style={styles.patternRowCaption}>{varietySummary.safeList.headline}</Text>
                    <View style={[band.box, styles.chartCard]}>
                      <TrendLineChart
                        points={varietySummary.safeList.points}
                        yMin={0}
                        yMax={Math.max(5, ...varietySummary.safeList.points.map((point) => point.value))}
                        valueFormatter={(value) => `${Math.round(value)} foods`}
                        lineColor={TAB_COLOR}
                        emptyMessage="Mark a food safe under Food > Safe Foods and this starts filling in."
                      />
                    </View>
                    {varietySummary.safeList.trialNote ? (
                      <Text style={styles.patternRowCaption}>{varietySummary.safeList.trialNote}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:variety:garden"
                    title="How much of it came out of your garden"
                    icon="leaf-outline"
                  >
                    {plateShare ? (
                      <>
                        <Text style={styles.patternRowCaption}>{plateShare.headline}</Text>
                        {renderPeriodRows(plateShare.rows)}
                        {plateShare.gapNote ? (
                          <Text style={styles.patternRowCaption}>{plateShare.gapNote}</Text>
                        ) : null}
                        {plateShare.crops.map((crop) => (
                          <View key={`plateCrop:${crop.foodName}`} style={styles.patternRow}>
                            <Text style={styles.patternRowTitle}>{crop.foodName}</Text>
                            <Text style={styles.patternRowCaption}>{crop.line}</Text>
                          </View>
                        ))}
                        {plateShare.unmatchedLine ? (
                          <Text style={styles.patternRowCaption}>{plateShare.unmatchedLine}</Text>
                        ) : null}
                        <Text style={styles.patternRowCaption}>{plateShare.caveat}</Text>
                      </>
                    ) : null}
                  </TabBand>
                </>
              )
            ) : isMoreLens(lens) ? (
              <ReadingBandsView
                view={moreView}
                loading={loading}
                loadingLine={MORE_LENSES[lens].loadingLine}
                folds={folds}
                color={TAB_COLOR}
                idPrefix={`trends:${lens}`}
                missingItem={MORE_LENSES[lens].missingItem}
              />
            ) : lens === 'keepingUp' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Reading how it has been going…</Text>
                </View>
              ) : !keepingUpSummary || !keepingUpSummary.hasAnything ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>
                    {'Nothing to read yet. Tick something off on Life > Did I Do It, walk a routine, or capture a note, and this fills in on its own.'}
                  </Text>
                  <YourStoryMissingLine itemKey="keepingUp" />
                </View>
              ) : (
                <>
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:keepingUp:checks"
                    title="What you tick off"
                    icon="checkbox-outline"
                  >
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.checks.headline}</Text>
                    {renderWeekRows(keepingUpSummary.checks.weeks, 'nothing marked')}
                    {keepingUpSummary.checks.gapNote ? (
                      <Text style={styles.patternRowCaption}>{keepingUpSummary.checks.gapNote}</Text>
                    ) : null}
                    {keepingUpSummary.checks.standings.map((standing) => (
                      <View key={standing.checkId} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{standing.name}</Text>
                        <Text style={styles.patternRowCaption}>{standing.line}</Text>
                      </View>
                    ))}
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.checks.caveat}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:keepingUp:routines"
                    title="Routines you walk"
                    icon="footsteps-outline"
                  >
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.routines.headline}</Text>
                    {keepingUpSummary.routines.hasRuns ? (
                      <>
                        {renderWeekRows(keepingUpSummary.routines.weeks, 'none walked')}
                        {keepingUpSummary.routines.gapNote ? (
                          <Text style={styles.patternRowCaption}>{keepingUpSummary.routines.gapNote}</Text>
                        ) : null}
                        {keepingUpSummary.routines.standings.map((standing) => (
                          <View key={standing.routineId} style={styles.patternRow}>
                            <Text style={styles.patternRowTitle}>{standing.routineName}</Text>
                            <Text style={styles.patternRowCaption}>{standing.line}</Text>
                          </View>
                        ))}
                        {keepingUpSummary.routines.stalls.map((stall) => (
                          <Text key={`${stall.routineName}|${stall.step}`} style={styles.patternRowCaption}>
                            {stall.line}
                          </Text>
                        ))}
                      </>
                    ) : null}
                    {keepingUpSummary.routines.note ? (
                      <Text style={styles.patternRowCaption}>{keepingUpSummary.routines.note}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:keepingUp:captures"
                    title="What you capture, and what happens to it"
                    icon="download-outline"
                  >
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.captures.headline}</Text>
                    {keepingUpSummary.captures.hasCaptures ? (
                      <>
                        {renderWeekRows(keepingUpSummary.captures.weeks, 'none captured')}
                        {keepingUpSummary.captures.gapNote ? (
                          <Text style={styles.patternRowCaption}>{keepingUpSummary.captures.gapNote}</Text>
                        ) : null}
                      </>
                    ) : null}
                    {keepingUpSummary.captures.note ? (
                      <Text style={styles.patternRowCaption}>{keepingUpSummary.captures.note}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:keepingUp:upkeep"
                    title="Upkeep, on time against late"
                    icon="construct-outline"
                  >
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.upkeep.standingLine}</Text>
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.upkeep.headline}</Text>
                    {keepingUpSummary.upkeep.recent.map((doing) => (
                      <View key={`${doing.itemName}|${doing.doneOn}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{doing.itemName}</Text>
                        <Text style={styles.patternRowCaption}>{doing.line}</Text>
                      </View>
                    ))}
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.upkeep.historyNote}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:keepingUp:work"
                    title="How work has felt"
                    icon="briefcase-outline"
                  >
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.work.headline}</Text>
                    {keepingUpSummary.work.hasCheckins ? (
                      <>
                        {renderWeekRows(keepingUpSummary.work.weeks, 'not answered')}
                        {keepingUpSummary.work.gapNote ? (
                          <Text style={styles.patternRowCaption}>{keepingUpSummary.work.gapNote}</Text>
                        ) : null}
                        {keepingUpSummary.work.drainDirection ? (
                          <Text style={styles.patternRowCaption}>{keepingUpSummary.work.drainDirection}</Text>
                        ) : null}
                        {keepingUpSummary.work.needsLine ? (
                          <Text style={styles.patternRowCaption}>{keepingUpSummary.work.needsLine}</Text>
                        ) : null}
                      </>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{keepingUpSummary.work.caveat}</Text>
                  </TabBand>
                </>
              )
            ) : lens === 'harvest' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Reading what the garden gave…</Text>
                </View>
              ) : !harvestSummary || !harvestSummary.hasAnything ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>
                    {'Nothing from the garden in this stretch yet. Log a picking on Garden > Harvest Log, or reach further back with the range above, and this fills in on its own.'}
                  </Text>
                </View>
              ) : (
                <>
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:harvest:weight"
                    title="What the garden gave"
                    icon="basket-outline"
                  >
                    <Text style={styles.patternRowCaption}>{harvestSummary.yields.headline}</Text>
                    {renderPeriodRows(harvestSummary.yields.rows)}
                    {harvestSummary.yields.gapNote ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.yields.gapNote}</Text>
                    ) : null}
                    {harvestSummary.yields.countLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.yields.countLine}</Text>
                    ) : null}
                    {harvestSummary.yields.otherUnitsLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.yields.otherUnitsLine}</Text>
                    ) : null}
                    {harvestSummary.yields.byCrop.map((crop) => (
                      <View key={`crop:${crop.name}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{crop.name}</Text>
                        <Text style={styles.patternRowCaption}>
                          {crop.share == null ? crop.display : `${crop.display}, ${crop.share}% of the weight`}
                        </Text>
                      </View>
                    ))}
                    {harvestSummary.yields.byArea.length > 0 ? (
                      <Text style={styles.patternRowCaption}>By area:</Text>
                    ) : null}
                    {harvestSummary.yields.byArea.map((area) => (
                      <View key={`area:${area.name}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{area.name}</Text>
                        <Text style={styles.patternRowCaption}>
                          {area.share == null ? area.display : `${area.display}, ${area.share}% of the weight`}
                        </Text>
                      </View>
                    ))}
                    {harvestSummary.yields.unassignedLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.yields.unassignedLine}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:harvest:timing"
                    title="How long each crop took"
                    icon="time-outline"
                  >
                    <Text style={styles.patternRowCaption}>{harvestSummary.timing.headline}</Text>
                    {harvestSummary.timing.byCrop.map((crop) => (
                      <View key={`timing:${crop.foodName}`} style={styles.patternRow}>
                        <Text style={styles.patternRowCaption}>{crop.line}</Text>
                      </View>
                    ))}
                    {harvestSummary.timing.runs.map((planting) => (
                      <View key={`run:${planting.plantingId}`} style={styles.patternRow}>
                        <Text style={styles.patternRowCaption}>{planting.line}</Text>
                      </View>
                    ))}
                    {harvestSummary.timing.stillGrowing.map((waiting) => (
                      <View key={`waiting:${waiting.plantingId}`} style={styles.patternRow}>
                        <Text style={styles.patternRowCaption}>{waiting.line}</Text>
                      </View>
                    ))}
                    {harvestSummary.timing.noExpectedLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.timing.noExpectedLine}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{harvestSummary.timing.caveat}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:harvest:compost"
                    title="Compost made and compost used"
                    icon="repeat-outline"
                  >
                    <Text style={styles.patternRowCaption}>{harvestSummary.compost.headline}</Text>
                    {harvestSummary.compost.appliedByArea.map((area) => (
                      <View key={`compost:${area.name}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{area.name}</Text>
                        <Text style={styles.patternRowCaption}>{area.display}</Text>
                      </View>
                    ))}
                    {harvestSummary.compost.materialsLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.compost.materialsLine}</Text>
                    ) : null}
                    {harvestSummary.compost.turnsLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.compost.turnsLine}</Text>
                    ) : null}
                    {harvestSummary.compost.pilesLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.compost.pilesLine}</Text>
                    ) : null}
                    {harvestSummary.compost.unmeasuredLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.compost.unmeasuredLine}</Text>
                    ) : null}
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:harvest:sharing"
                    title="Given away, traded and received"
                    icon="swap-horizontal-outline"
                  >
                    <Text style={styles.patternRowCaption}>{harvestSummary.sharing.headline}</Text>
                    {harvestSummary.sharing.outgoing.map((row) => (
                      <View key={`out:${row.foodName}:${row.display}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{row.foodName}</Text>
                        <Text style={styles.patternRowCaption}>{`${row.display}, ${row.kinds}`}</Text>
                      </View>
                    ))}
                    {harvestSummary.sharing.receivedLine ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.sharing.receivedLine}</Text>
                    ) : null}
                    {harvestSummary.sharing.received.map((row) => (
                      <View key={`in:${row.foodName}:${row.display}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{row.foodName}</Text>
                        <Text style={styles.patternRowCaption}>
                          {row.from ? `${row.display}, from ${row.from}` : row.display}
                        </Text>
                      </View>
                    ))}
                    {harvestSummary.sharing.note ? (
                      <Text style={styles.patternRowCaption}>{harvestSummary.sharing.note}</Text>
                    ) : null}
                  </TabBand>
                </>
              )
            ) : lens === 'conditions' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Reading what the conditions were…</Text>
                </View>
              ) : !conditionsSummary || conditionsSummary.empty ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>
                    {'Nothing measured yet. Record a reading on Garden > Growing Conditions: soil moisture off a meter, the temperature in a greenhouse, the pH of a bed, how much rain fell. One reading a week is enough for this to start saying something.'}
                  </Text>
                </View>
              ) : (
                <>
                  {conditionsSummary.measurements.length > 1 ? (
                    <View style={[band.inset, styles.pillRow]}>
                      {conditionsSummary.measurements.map((entry) => {
                        const chosen = conditionsSummary.band?.measurement === entry.code;
                        return (
                          <TouchableOpacity
                            key={entry.code}
                            style={[styles.pill, chosen && styles.pillActive]}
                            onPress={() => setPickedMeasurement(entry.code)}
                          >
                            <Text style={[styles.pillText, chosen && styles.pillTextActive]}>{entry.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                  {conditionsSummary.band ? (
                    <TabBand
                      folds={folds}
                      color={TAB_COLOR}
                      id="trends:conditions:measurement"
                      title={conditionsSummary.band.label}
                      icon="thermometer-outline"
                    >
                      <Text style={styles.patternRowCaption}>{conditionsSummary.band.headline}</Text>
                      {renderPeriodRows(conditionsSummary.band.rows)}
                      {conditionsSummary.band.notes.map((note, index) => (
                        <Text key={index} style={styles.patternRowCaption}>
                          {note}
                        </Text>
                      ))}
                    </TabBand>
                  ) : null}
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:conditions:measuring"
                    title="What you are measuring"
                    icon="speedometer-outline"
                  >
                    {conditionsSummary.things.map((thing) => (
                      <View key={thing.measurement} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{thing.line}</Text>
                        <Text style={styles.patternRowCaption}>{thing.caption}</Text>
                      </View>
                    ))}
                  </TabBand>
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:conditions:areas"
                    title="By area"
                    icon="grid-outline"
                  >
                    {conditionsSummary.coverage.measured.map((area) => (
                      <View key={area.plotId ?? area.name} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{area.line}</Text>
                        <Text style={styles.patternRowCaption}>{area.caption}</Text>
                      </View>
                    ))}
                    <Text style={styles.patternRowCaption}>{conditionsSummary.coverage.note}</Text>
                  </TabBand>
                </>
              )
            ) : lens === 'cost' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Adding up what it has cost…</Text>
                </View>
              ) : !costSummary || !costSummary.hasAnything ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>
                    {'No money recorded in this stretch yet. Enter a bill or a shop on Life > Finances, or reach further back with the range above, and this fills in on its own.'}
                  </Text>
                  <YourStoryMissingLine itemKey="whatItCosts" />
                </View>
              ) : (
                <>
                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:cost:condition"
                    title="What your condition costs"
                    icon="medkit-outline"
                  >
                    <Text style={styles.patternRowCaption}>{costSummary.condition.headline}</Text>
                    {renderPeriodRows(costSummary.condition.rows)}
                    {costSummary.condition.gapNote ? (
                      <Text style={styles.patternRowCaption}>{costSummary.condition.gapNote}</Text>
                    ) : null}
                    {costSummary.condition.careLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.condition.careLine}</Text>
                    ) : null}
                    {costSummary.condition.byKind.map((slice) => (
                      <View key={`kind:${slice.name}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{slice.name}</Text>
                        <Text style={styles.patternRowCaption}>
                          {slice.share === null ? slice.display : `${slice.display}, ${slice.share}% of it`}
                        </Text>
                      </View>
                    ))}
                    {costSummary.condition.byCondition.length > 0 ? (
                      <Text style={styles.patternRowCaption}>Tagged to a condition</Text>
                    ) : null}
                    {costSummary.condition.byCondition.map((slice) => (
                      <View key={`condition:${slice.name}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{slice.name}</Text>
                        <Text style={styles.patternRowCaption}>{slice.display}</Text>
                      </View>
                    ))}
                    {costSummary.condition.untaggedLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.condition.untaggedLine}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{costSummary.condition.sourcesNote}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:cost:food"
                    title="What eating this way costs"
                    icon="restaurant-outline"
                  >
                    <Text style={styles.patternRowCaption}>{costSummary.food.headline}</Text>
                    {renderPeriodRows(costSummary.food.rows)}
                    {costSummary.food.gapNote ? (
                      <Text style={styles.patternRowCaption}>{costSummary.food.gapNote}</Text>
                    ) : null}
                    {costSummary.food.perDayLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.food.perDayLine}</Text>
                    ) : null}
                    {costSummary.food.splitLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.food.splitLine}</Text>
                    ) : null}
                    {costSummary.food.kitchenLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.food.kitchenLine}</Text>
                    ) : null}
                    {costSummary.food.saleLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.food.saleLine}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{costSummary.food.note}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:cost:growing"
                    title="What the garden costs to grow"
                    icon="leaf-outline"
                  >
                    <Text style={styles.patternRowCaption}>{costSummary.growing.headline}</Text>
                    {renderPeriodRows(costSummary.growing.rows)}
                    {costSummary.growing.gapNote ? (
                      <Text style={styles.patternRowCaption}>{costSummary.growing.gapNote}</Text>
                    ) : null}
                    {costSummary.growing.perWeightLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.growing.perWeightLine}</Text>
                    ) : null}
                    {costSummary.growing.shopLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.growing.shopLine}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{costSummary.growing.netLine}</Text>
                    {costSummary.growing.countedOutLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.growing.countedOutLine}</Text>
                    ) : null}
                    {costSummary.growing.byAreaLine ? (
                      <Text style={styles.patternRowCaption}>{costSummary.growing.byAreaLine}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{costSummary.growing.caveat}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:cost:supplements"
                    title="Supplements, and what food is reaching"
                    icon="medical-outline"
                  >
                    <Text style={styles.patternRowCaption}>{costSummary.supplements.headline}</Text>
                    {renderPeriodRows(costSummary.supplements.rows)}
                    {costSummary.supplements.gapNote ? (
                      <Text style={styles.patternRowCaption}>{costSummary.supplements.gapNote}</Text>
                    ) : null}
                    {costSummary.supplements.ended.map((row) => (
                      <View key={`ended:${row.id}`} style={styles.patternRow}>
                        <Text style={styles.patternRowTitle}>{row.name}</Text>
                        <Text style={styles.patternRowCaption}>{row.line}</Text>
                      </View>
                    ))}
                    {costSummary.supplements.coverage.map((row) => (
                      <Text key={`coverage:${row.nutrientCode}`} style={styles.patternRowCaption}>
                        {row.line}
                      </Text>
                    ))}
                    {costSummary.supplements.coverageNote ? (
                      <Text style={styles.patternRowCaption}>{costSummary.supplements.coverageNote}</Text>
                    ) : null}
                    <Text style={styles.patternRowCaption}>{costSummary.supplements.runningLine}</Text>
                    <Text style={styles.patternRowCaption}>{costSummary.supplements.boundary}</Text>
                  </TabBand>

                  <TabBand
                    folds={folds}
                    color={TAB_COLOR}
                    id="trends:cost:plate"
                    title="What the garden put on your plate"
                    icon="leaf-outline"
                  >
                    {plateValue ? (
                      <>
                        <Text style={styles.patternRowCaption}>{plateValue.headline}</Text>
                        {renderPeriodRows(plateValue.rows)}
                        {plateValue.gapNote ? (
                          <Text style={styles.patternRowCaption}>{plateValue.gapNote}</Text>
                        ) : null}
                        {plateValue.crops.map((crop) => (
                          <View key={`plateValue:${crop.foodName}`} style={styles.patternRow}>
                            <Text style={styles.patternRowTitle}>{crop.foodName}</Text>
                            <Text style={styles.patternRowCaption}>{crop.line}</Text>
                          </View>
                        ))}
                        {plateValue.unpricedLine ? (
                          <Text style={styles.patternRowCaption}>{plateValue.unpricedLine}</Text>
                        ) : null}
                        {plateValue.noAmountLine ? (
                          <Text style={styles.patternRowCaption}>{plateValue.noAmountLine}</Text>
                        ) : null}
                        <Text style={styles.patternRowCaption}>{plateValue.boundary}</Text>
                      </>
                    ) : null}
                  </TabBand>
                </>
              )
            ) : lens === 'trackers' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              ) : !trackerSeries || trackerSeries.length === 0 ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>{TRENDS_TRACKERS_EMPTY_LINE}</Text>
                </View>
              ) : (
                <>
                  {trackerSeries.map(({ tracker, points }) => {
                    const bounds = trackerChartBounds(tracker.kind, points);
                    return (
                      <TabBand
                        key={tracker.id}
                        folds={folds}
                        color={TAB_COLOR}
                        id={`trends:trackers:${tracker.id}`}
                        title={tracker.retiredAt ? `${tracker.name} (past tracker)` : tracker.name}
                        icon="options-outline"
                      >
                        <View style={styles.chartCard}>
                          <TrendLineChart
                            points={points}
                            yMin={bounds.yMin}
                            yMax={bounds.yMax}
                            valueFormatter={(value) => formatTrackerValue(tracker, value)}
                            emptyMessage={`Nothing logged for ${tracker.name} in this range. Log it on Signals > My Trackers.`}
                          />
                          <Text style={styles.caption}>
                            {`${trackerKindLabel(tracker.kind)}${tracker.unit ? `, in ${tracker.unit}` : ''}. ${trackerSummarySentence(tracker, points, days)}`}
                          </Text>
                        </View>
                      </TabBand>
                    );
                  })}
                </>
              )
            ) : lens === 'symptoms' ? (
              loading ? (
                <View style={band.boxMuted}>
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              ) : (
                <>
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
                {DAILY_SCALES.map((scale) => {
                  const points = scaleSeries?.[scale.key] ?? [];
                  return (
                    <TabBand
                      key={scale.key}
                      folds={folds}
                      color={TAB_COLOR}
                      id={`trends:symptoms:${scale.key}`}
                      title={scale.label}
                      icon={scale.key === 'mood' ? 'happy-outline' : scale.key === 'energy' ? 'flash-outline' : 'pulse-outline'}
                    >
                      <View style={styles.chartCard}>
                        <TrendLineChart
                          points={points}
                          yMin={1}
                          yMax={5}
                          valueFormatter={(value) => `${Math.round(value)}, ${scaleWord(scale.key, Math.round(value))}`}
                          emptyMessage={`No ${scale.label.toLowerCase()} answers in this range. Answer it on Home's Today's Check-In or in Signals > General Note.`}
                        />
                        {points.length > 0 ? <Text style={styles.caption}>{answeredSentence(points, days)}</Text> : null}
                      </View>
                    </TabBand>
                  );
                })}
                </>
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
                      {latest ? (
                        <Text style={styles.caption}>
                          {usualSentence(
                            displayPoints.map((point) => point.value),
                            (value) => `${value.toFixed(1)} ${measurementSystem === 'imperial' ? 'lb' : 'kg'}`,
                          )}
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
                        {stepsAverage !== null ? (
                          <Text style={styles.caption}>
                            {usualSentence(
                              steps.map((point) => point.value),
                              (value) => `${Math.round(value).toLocaleString()} steps`,
                            )}
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
                        {sleepAverage !== null ? (
                          <Text style={styles.caption}>
                            {usualSentence(
                              sleep.map((point) => point.value),
                              (value) => `${value.toFixed(1)} h`,
                            )}
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
                        {latest ? (
                          <Text style={styles.caption}>
                            {usualSentence(
                              (labSeries ?? []).filter((row) => row.unit === latest.unit).map((row) => row.value),
                              (value) => `${Math.round(value * 100) / 100} ${latest.unit}`.trim(),
                            )}
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
                      `This shows what you actually ate before each ${outcomeWords.one} you've logged, and what shows up more than once. It's a count from your data, not a diagnosis, and not proof anything here actually causes anything. Something worth a second look deserves a trial, not just a spot on this list.`
                    }
                  </Text>
                </View>

                <View style={[band.inset, styles.pillRow]}>
                  {PATTERN_OUTCOMES.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.pill, patternOutcome === option.key && styles.pillActive]}
                      onPress={() => setPatternOutcome(option.key)}
                    >
                      <Text style={[styles.pillText, patternOutcome === option.key && styles.pillTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={band.boxMuted}>
                  <Text style={styles.patternRowCaption}>{outcomeCountsSentence(patternOutcome)}</Text>
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
                      {emptyOutcomeSentence(patternOutcome)}
                    </Text>
                    <YourStoryMissingLine itemKey="patterns" />
                  </View>
                ) : patternResult.foodCandidates.length === 0 &&
                  patternResult.dimensionCandidates.length === 0 &&
                  patternResult.categoryCandidates.length === 0 ? (
                  <View style={band.boxMuted}>
                    <Text style={styles.loadingText}>
                      {basisSentence(patternResult.basis, outcomeWords)}
                      {' Nothing showed up before 2 or more of them in this window. That is a result too; try a longer window, or keep logging.'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={band.boxMuted}>
                      <Text style={styles.patternRowCaption}>{basisSentence(patternResult.basis, outcomeWords)}</Text>
                      <Text style={styles.patternRowCaption}>{thresholdSentence()}</Text>
                    </View>
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
                                    {comparisonSentence(candidate.comparison, patternResult.basis.windowHours)}
                                  </Text>
                                </View>
                                <View style={styles.patternRowActions}>
                                  <TouchableOpacity
                                    style={[styles.trialButton, { borderColor: TAB_COLOR }]}
                                    disabled={startingTrialKey === key}
                                    onPress={() => handleStartTrial(candidate)}
                                  >
                                    <Text style={[styles.trialButtonText, { color: TAB_COLOR }]}>
                                      {startingTrialKey === key ? 'Opening…' : 'Test this'}
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
                                    Relevant to {candidate.conditionName}.{' '}
                                    {comparisonSentence(candidate.comparison, patternResult.basis.windowHours)}
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
                                        words: outcomeWords,
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
                                    {comparisonSentence(candidate.comparison, patternResult.basis.windowHours)}
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
                                        words: outcomeWords,
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

                {!loading && patternResult && patternResult.context.length > 0 ? (
                  <TabBand folds={folds} color={TAB_COLOR} id={'trends:patterns:around-flares'} title={`Other things around the same ${outcomeWords.shortMany}`} icon="git-compare-outline">
                    {patternResult.context.map((line) => (
                      <Text key={line} style={styles.patternRowCaption}>
                        {line}
                      </Text>
                    ))}
                    <Text style={styles.patternRowCaption}>{contextCaveat(outcomeWords)}</Text>
                  </TabBand>
                ) : null}

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
  weekRows: { gap: 6, marginTop: 8 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  shareLabel: { ...typography.caption, color: colors.textMuted, width: 92, ...textShadow },
  shareTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  shareBar: { height: 10, borderRadius: 5 },
  weekValue: { ...typography.caption, color: colors.textMuted, width: 72, textAlign: 'right', ...textShadow },
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
