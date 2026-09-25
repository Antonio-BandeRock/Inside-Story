import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppTextInput } from '../../components/AppTextInput';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DaysUntilSection } from '../../components/DaysUntilSection';
import { DayArc } from '../../components/DayArc';
import { EDGE_SHADOW_HEIGHT, EdgeShadow } from '../../components/EdgeShadow';
import { EnergyOrb } from '../../components/EnergyOrb';
import { FlipCard } from '../../components/FlipCard';
import type { HelpSection } from '../../components/HelpButton';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from '../../components/HomeSectionBand';
import { AppActionSheet } from '../../components/AppActionSheet';
import { useInfoAlert } from '../../components/InfoAlert';
import { YourStorySection, useYourStory } from '../../components/YourStorySection';
import { nextLine, type StoryDestination } from '../../lib/yourStory';
import { ProgressRing } from '../../components/ProgressRing';

import { useBackgroundBottomInset } from '../../components/ScreenBackground';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import {
  BUTTON_SHADOW,
  colors,
  GAUGE_EMPTY,
  GAUGE_OPTIMAL,
  GAUGE_OVER_LIMIT,
  mixHex,
} from '../../constants/colors';
import { getSharedFolder } from '../../lib/oneDriveFolders';
import { announcePhoneOnly } from '../../lib/desktop/phoneOnly';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import {
  formatReleaseNotesMessage,
  getReleaseNotesSince,
} from '../../constants/releaseNotes';
import { TAB_ROUTES } from '../../constants/tabs';
import { APP_VERSION } from '../../constants/version';
import { textShadow, typography } from '../../constants/typography';
import { getCheckinTagDefinition, getCheckinTagsByCategory } from '../../lib/checkinTags';
import { getMoonPhase, getUpcomingSeasonalMarker } from '../../lib/celestialEvents';
import { CONDITION_CODE_TO_DIGEST_KEY } from '../../lib/conditionCodeMap';
import { isTestDataPresent } from '../../lib/testData';
import { ALL_DIGEST_ENTRIES, DIGEST_CATEGORY_META, isProblemFoodEntry, type DigestCategoryKey } from '../../lib/digest';
import { routeForDigestEntry, tabPathForDigestCategory } from '../../lib/digestNavigation';
import { markHomeDataReady } from '../../lib/homeReadySignal';
import { deleteMealPhotoFile, pickAndSaveMealPhoto } from '../../lib/mealPhotos';
import {
  aqiBandForIndex,
  getHomeSkyData,
  isForecastFreezing,
  isForecastVeryHot,
  uvBandForIndex,
  type HomeSkyResult,
} from '../../lib/homeSky';
import {
  countAssumedScheduleItems,
  countOpenScheduleItems,
  createMealPhotoDraft,
  deleteMealPhotoDraft,
  getCheckinForDate,
  getCuriousAboutConditions,
  getDayMealAndDoseTimeline,
  getLastSeenAppVersion,
  getNutrientTotalsByDateRange,
  getFlaggedItemsByDateRange,
  getSixDimensionsFlagCountsByDateRange,
  getUserConditions,
  getUserProfile,
  listCheckins,
  listMealPhotoDrafts,
  listMealsForDate,
  listScheduledMealsForDate,
  listSymptomAssessments,
  listTodaysReminders,
  listUpcomingGardenTasks,
  recordBodyMeasurement,
  recordCheckin,
  recordExercise,
  setLastSeenAppVersion,
  setScheduledMealSkipped,
  type CheckinValence,
  type MealPhotoDraft,
  type MealRecord,
  type ScheduleItemRecord,
  type TodaysReminder,
  type WellbeingCheckin,
} from '../../lib/db';
import {
  analyzeNutrientIntake,
  findExcessRisks,
  findNutrientGaps,
  nutrientSourceSplit,
  type NutrientGapEntry,
} from '../../lib/nutrientAnalysis';
import { getActiveGroceryListSummary, type GroceryListSummary } from '../../lib/groceryDb';
import { describeInbox } from '../../lib/captureNotes';
import { getCaptureInboxCounts } from '../../lib/captureNotesDb';
import { getVarietyHomeSummary, type VarietyHomeSummary } from '../../lib/eatingVarietyDb';
import type { KeepingUpHomeSummary } from '../../lib/keepingUp';
import { getKeepingUpHomeSummary } from '../../lib/keepingUpDb';
import type { GardenYieldHomeSummary } from '../../lib/harvestYield';
import { getGardenYieldHomeSummary } from '../../lib/harvestYieldDb';
import { describeWhereIsItRow } from '../../lib/whereIsIt';
import { countPlaceRecords } from '../../lib/whereIsItDb';
import { describeReconcileQueue, lookbackDateString } from '../../lib/reconciliation';
import {
  checkStanding,
  describeChecksSummary,
  describeRoutineStanding,
  orderRoutinesForNow,
  summarizeChecks,
  type CustomOccasion,
  type DoneCheck,
  type Routine,
} from '../../lib/routines';
import { getRoutinesHomeData } from '../../lib/routinesDb';
import { listDatedReminderSources, type DatedReminderSource } from '../../lib/reminderSources';
import {
  DATED_KIND_PREFIX,
  datedReminderLeadToday,
  describeDatedDue,
} from '../../lib/reminderSchedule';
import {
  getReminderPreferences,
  isNudgeUntilDoneEnabled,
  isReminderKindEnabled,
} from '../../lib/reminderPreferences';
import { buildDayTimeline, type DoseFoodNote } from '../../lib/doseMealTiming';
import { reresolveSavedDishCookingMethods } from '../../lib/db';
import { formatTime12 } from '../../lib/timeOfDay';
import { dateStringOffsetFrom } from '../../lib/trendAnalysis';
import { LensHub, type LensOption } from '../../components/LensHub';
import {
  getOrderedHomeSectionKeys,
  HOME_SECTION_LABELS,
  HOME_TAB_GROUP_BAND_KEY_PREFIX,
  isHomeGroupVisible,
  isHomeSectionExpanded,
  isHomeSectionVisible,
  modalAnimationType,
  setLowStimulation,
  setVisualPreferences,
  type HomeSectionKey,
} from '../../lib/visualPreferences';
import {
  groupHomeSectionsForDisplay,
  HOME_SECTION_TAB_PATH,
  homeGroupIdOf,
  type HomeSectionDisplayGroup,
} from '../../lib/homeSections';
import { homeGroupIdentity } from '../../constants/homeGroups';
import { HomeArrangeList } from '../../components/HomeArrangeList';
import { useVisualPreferences } from '../../hooks/useVisualPreferences';
import { useBandFolds } from '../../hooks/useBandFolds';

// 'YYYY-MM-DD' in LOCAL time -- same helper (and same reasoning) duplicated
// in food.tsx/insights.tsx/schedule.tsx/log.tsx: UTC's calendar date is
// wrong for anyone not on UTC, especially in the evening.
function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeString24(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// A small rotating pool of quiet, low-key affirmations -- deliberately not
// peppy/cheerful ("Have a great day!"): this is a chronic-illness app, and
// a relentlessly upbeat line can land badly on a genuinely rough symptom
// day. Picked by day-of-year so it's stable all day (not different every
// time Home refocuses) but still varies day to day rather than feeling
// robotic on repeat visits.
const GREETING_AFFIRMATIONS = [
  "Glad you're here",
  'One step at a time',
  'No rush today',
  "Here's to a steady day",
  'Glad you checked in',
  'No rush today',
  "You're doing okay",
];

function pickAffirmation(): string {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / (24 * 60 * 60 * 1000));
  return GREETING_AFFIRMATIONS[dayOfYear % GREETING_AFFIRMATIONS.length];
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

// The Today card's own sky-info row -- a plain 4-tone system reused for
// UV, AQI, and the high/low temperature chips (UV/AQI each collapsed from
// their own real, standard 5-6 band public scale down to this app's own
// existing chip colors, rather than inventing new hex values for a wider
// palette). The underlying band NAME shown in the chip text is still the
// real one; only the color grouping is simplified. 'cold' is its own real
// tone, not a reuse of 'moderate' (yellow reads as caution/warm, not cold)
// -- colors.primaryMuted/primary are this app's own real cool teal pair,
// already used elsewhere, not a new hex value invented for this.
type SkyChipTone = 'good' | 'moderate' | 'bad' | 'cold';
function uvChipTone(band: ReturnType<typeof uvBandForIndex>): SkyChipTone {
  if (band === 'low') return 'good';
  if (band === 'moderate') return 'moderate';
  return 'bad';
}
function aqiChipTone(band: ReturnType<typeof aqiBandForIndex>): SkyChipTone {
  if (band === 'good') return 'good';
  if (band === 'moderate') return 'moderate';
  return 'bad';
}
// Returns just the text color -- the pill-chip version of this row also
// carried a matching background per tone, but SkyGridItem (the current,
// text-only grid layout) never draws one, so there's nothing real left to
// return there.
//
// 'moderate' deliberately does NOT reuse colors.statusYellow -- that token
// is a dark olive built to sit as text on top of its own statusYellowBg
// pill (see DimensionFlags.tsx's own comment), and reads as almost
// invisible without one (~1.7:1 against the dark navy background,
// confirmed directly after a real report: "AQI font color is difficult to
// see"). statusYellowStandalone is the same amber hue, lifted to a
// lightness that actually clears contrast on its own -- see
// constants/colors.ts's own comment on that token for the real numbers.
function skyChipTint(tone: SkyChipTone): string {
  if (tone === 'moderate') return colors.statusYellowStandalone;
  if (tone === 'bad') return colors.danger;
  if (tone === 'cold') return colors.primary;
  return colors.textPrimary;
}
// Open-Meteo's own sunrise/sunset are full local ISO timestamps
// ("2026-08-17T06:24") -- formatTime12 (lib/timeOfDay.ts) wants a bare
// "HH:mm", so this just slices out that piece before handing it off.
function skyTimeLabel(isoLocal: string): string {
  return formatTime12(isoLocal.slice(11, 16));
}

// The sky row's own real display shape, 2026-08-18 -- replaced a pill/chip
// row (reported directly as "I don't like how they display all in their own
// pills") with a plain two-column grid: no borders, no background boxes,
// just icon-plus-label pairs sitting in two aligned columns. The emoji still
// gets its own genuinely larger nested Text span (skyGridEmoji) -- that
// legibility fix from the pill version stands on its own merit, the pill
// itself was the actual complaint, not the icon size. A crossed severity
// threshold (heat/freeze/high UV/AQI/a fetch error) still colors just the
// label's own text, never a colored box, matching this exact layout.
//
// Built from one flat, ordered array (see skyGridItems below, assembled
// right before this component's own return) rather than fixed left/right
// column arrays -- a plain flexWrap row with each real item at 50% width
// naturally produces the same left-right pairing a real 2-column grid would
// (item 1 top-left, item 2 top-right, item 3 second-row-left, and so on),
// with no special-casing needed for however many real items happen to be
// available in a given state (loading/no-location/error each have far fewer
// real items than a fully-loaded day with AQI and pollen both present).
function SkyGridItem({
  emoji,
  label,
  tone,
  fullWidth,
  onPress,
}: {
  emoji: string;
  label: string;
  tone?: SkyChipTone;
  fullWidth?: boolean;
  onPress?: () => void;
}) {
  const tintColor = tone ? skyChipTint(tone) : null;
  const content = (
    <Text style={[styles.skyGridText, tintColor ? { color: tintColor } : null]}>
      <Text style={styles.skyGridEmoji}>{emoji}</Text> {label}
    </Text>
  );
  const cellStyle = [styles.skyGridCell, fullWidth ? styles.skyGridCellFull : null];
  if (onPress) {
    return (
      <TouchableOpacity style={cellStyle} activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={cellStyle}>{content}</View>;
}

// The "A Few Things Worth Knowing" flip cards, drawn live from The
// Digest -- 2026-08-23, direct request: "these should only reflect
// things from the Digest that are either from the free tier info, or
// from their own conditions they have selected in their profile...
// they should be able to select to include data from any of the other
// conditions... [without] those conditions... now [being] added to
// their own that the app tracks and helps with." Replaces the earlier
// 17 hand-written cards (used to be 4 fixed ones before that; the
// original seeded-shuffle/daily-rotation design directly below this
// comment is unchanged, just now shuffling real Digest entries instead
// of a fixed array), which never actually drew from The Digest despite
// this section's own name -- this makes that name true. Basic Health
// (the free-tier content) always shows; a person's own selected
// conditions and anything they've marked "curious about" without
// adding it to what the app actually tracks (Profile's own separate
// list, see curious_about_conditions in lib/db.ts) both widen the pool
// further. condition_code values come from the `conditions` reference
// table (snake_case); CONDITION_CODE_TO_DIGEST_KEY bridges them to this
// app's own camelCase DigestCategoryKey, the same shared lookup
// Digest's own LensHub pinning already uses.
type FlipCardEntry = {
  id: string;
  hook: string;
  backTitle: string;
  backBody: string;
};

// 2026-08-23, direct report: the card's own back face used to show an
// entry's full summary (sometimes several hundred words), which read as
// cutting off mid-sentence at the bottom of the visible box rather than
// building interest in reading the rest. This trims to a short excerpt
// instead, cut at the end of a real sentence wherever one falls close
// enough to the limit, so a card teases rather than dumps the whole
// entry, with FlipCard's own new "Read more" link (see that component)
// carrying someone the rest of the way to the real card in Digest.
function flipCardExcerpt(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSentenceEnd = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('! '), truncated.lastIndexOf('? '));
  if (lastSentenceEnd > maxLength * 0.4) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

// 2026-08-30, direct steer: "the flip cards at the bottom should have one card
// per each of the groups available to them from Digest; Basic Health, Earth
// Matters, Gardening, Recipes, and each of their conditions, but not My
// Kitchen, or My Favorites which should be available from the Food screen. They
// should be randomly placed on the shelf each time the app opens. The cards
// should be randomly pulled in random orders and should each change once every
// 15 minutes."
//
// So the shelf is no longer one pooled, shuffled list of entries; it is one
// card per group, each showing something from its own group. My Kitchen and My
// Favorites are deliberately absent: both are a person's own saved things
// rather than reading, and Food is where they belong.
const ALWAYS_AVAILABLE_FLIP_CARD_GROUPS: DigestCategoryKey[] = [
  'basicHealth',
  'earthMatters',
  'homeGardening',
  'recipes',
];

// How often each card swaps to a different entry from its own group.
const FLIP_CARD_ROTATION_MS = 15 * 60 * 1000;

type FlipCardGroup = { category: DigestCategoryKey; entries: FlipCardEntry[] };

function toFlipCardEntry(entry: (typeof ALL_DIGEST_ENTRIES)[number]): FlipCardEntry {
  // ProblemFoodEntry has no title/summary of its own (foodName/problem
  // instead) -- see isProblemFoodEntry's own comment in lib/digest/types.ts
  // for why category alone can't tell the two shapes apart.
  return isProblemFoodEntry(entry)
    ? { id: entry.id, hook: entry.teaser, backTitle: entry.foodName, backBody: flipCardExcerpt(entry.problem) }
    : { id: entry.id, hook: entry.teaser, backTitle: entry.title, backBody: flipCardExcerpt(entry.summary) };
}

function digestFlipCardGroups(userConditionCodes: string[], curiousAboutConditionCodes: string[]): FlipCardGroup[] {
  const categories: DigestCategoryKey[] = [...ALWAYS_AVAILABLE_FLIP_CARD_GROUPS];
  for (const code of [...userConditionCodes, ...curiousAboutConditionCodes]) {
    const digestKey = CONDITION_CODE_TO_DIGEST_KEY[code];
    if (digestKey && !categories.includes(digestKey)) categories.push(digestKey);
  }
  return categories
    .map((category) => ({
      category,
      entries: ALL_DIGEST_ENTRIES.filter((entry) => entry.category === category).map(toFlipCardEntry),
    }))
    // A group with nothing in it would render an empty card, which reads as
    // broken rather than as "nothing here yet".
    .filter((group) => group.entries.length > 0);
}

// A fixed, seeded "random" shuffle rather than Math.random() -- reused
// pattern from this app's own earlier starfield work (see the git history
// on components/AnimatedSky.tsx), a small local copy here since that
// original helper was removed when the starfield became real astronomy
// rather than decorative random placement, and this is the only other spot
// that currently needs seeded shuffling.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A real, cited-elsewhere-in-this-app subset of nutrients most directly
// tied to thyroid hormone production/conversion (iodine, selenium, zinc,
// iron, copper) and to bone health (vitamin D, calcium, magnesium) --
// deliberately not a marketing-style "17 pillars" claim, just the nutrients
// this app already tracks DRIs for that are most relevant here.
export const CORE_NUTRIENT_CODES = ['iodine', 'selenium', 'zinc', 'iron', 'vitamin_d', 'calcium', 'magnesium', 'copper', 'vitamin_b12'];

// 2026-08-29, direct report: the ring colours "don't really mean
// anything; pink brown and light blue. Can these colors be more apparent
// of using a gradient maybe? like moving from this color to that color as
// it is going around and getting closer to their optimal amount? If they
// are getting way more than their optimal amount and it could be bad for
// them, that should be visibly communicated somehow, too, but only if it
// is a real problem."
//
// The old version reused the green/yellow/red status palette, which meant
// a nutrient at 20% and one at 85% were drawn identically, and the tokens
// it reached for (a light teal, a dark olive, a salmon) genuinely do read
// as "pink brown and light blue" rather than as a scale.
//
// Now the colour travels with the fill: a cool receding slate at nothing
// logged, blending to a clear green at the target, so the colour says the
// same thing the arc length does. Past 100% it simply stays at the
// optimal colour, because for these nine nutrients more is not a problem
// on its own.
//
// The exception is a real one, not "over 100%": 'excess_risk' is set by
// lib/nutrientAnalysis.ts only when intake passes a published upper
// limit, and that function already knows which ULs apply to supplements
// rather than food (magnesium, folate, niacin, vitamin E), so this fires
// where there is genuinely something to act on and stays quiet otherwise.
function nutrientRingColors(entry: NutrientGapEntry): { from: string; to: string } {
  if (entry.status === 'excess_risk') {
    return { from: GAUGE_OVER_LIMIT, to: GAUGE_OVER_LIMIT };
  }
  const progress = Number.isFinite(entry.percentOfTarget) ? entry.percentOfTarget / 100 : 0;
  return {
    from: GAUGE_EMPTY,
    to: mixHex(GAUGE_EMPTY, GAUGE_OPTIMAL, progress),
  };
}

type DashboardData = {
  todaysMeals: MealRecord[];
  // Quick-log phase 4, 2026-08-30 -- photos taken with the intent to log
  // something, not yet turned into a meal. See meal_photo_drafts in lib/db.ts.
  photoDrafts: MealPhotoDraft[];
  // The Grocery List, 2026-09-01. Null when no list is being shopped,
  // which is the ordinary state most days.
  grocerySummary: GroceryListSummary | null;
  scheduledToday: ScheduleItemRecord[];
  // Doses and appointments for today, every status. Separate from
  // scheduledToday above, which is meals and only meals.
  todaysReminders: TodaysReminder[];
  // Everything else carrying a date that speaks today, 2026-09-23: a bill,
  // a service, a benefit about to reset, a counter landing, a pile due a
  // turn. Already filtered to what today has something to say about, and
  // already ordered with whatever is furthest past its day first.
  datedToday: DatedReminderToday[];
  nutrientEntries: NutrientGapEntry[];
  sixDsFlagCount: number;
  recentMaxSeverity: number | null;
  hasAnyLogHistory: boolean;
  // 2026-08-08: today's own "Today's Check-In" entry (checkinType
  // 'general'), if one's already been logged -- null means the picker
  // itself should show instead of a summary.
  feelingCheckin: WellbeingCheckin | null;
  // null = the periodic symptom check-in (app/assessment.tsx) has never
  // been taken at all -- treated the same as "due" as a real number would
  // be past the cadence below.
  daysSinceAssessment: number | null;
  // The person's own chosen reminder cadence (Profile > Conditions &
  // Check-In). Null means unset, in which case ASSESSMENT_DUE_AFTER_DAYS
  // applies, exactly as it did before this setting existed.
  checkinReminderDays: number | null;
  // Planned garden work from today on, 1.0.39.7. These are schedule_items
  // with item_type 'garden', so they are the same kind of thing Today's
  // Reminders shows, just not bound to today.
  gardenTasks: (ScheduleItemRecord & { plotId: string | null; plantingId: string | null })[];
  captureCounts: { waiting: number; sorted: number };
  // How many things have a place written down, 2026-09-23. A count rather
  // than the rows: Home says how much is findable and never names any of
  // it, since this page gets read over a shoulder.
  placeCount: number;
  // Routines and the Did I Do It record, 2026-09-17. Both arrive whole
  // rather than as counts: the routine list is short by nature, and the
  // whole point of the checks is reading what each one says, which a
  // number cannot carry.
  routines: Routine[];
  doneChecks: DoneCheck[];
  // The occasions the person made themselves, needed here only so the
  // band can order by the clock the same way Life does.
  routineOccasions: CustomOccasion[];
  // How many scheduled things have gone by without an answer, plus how
  // many the app answered for on somebody's behalf. Two numbers, not the
  // rows themselves: Home never reads what any of them were.
  reconcileCounts: { open: number; assumed: number };
  // How varied this week's eating has been, 2026-09-23. One sentence and
  // at most one food name, worked out in lib/eatingVariety.ts, so Home
  // draws what it is handed and decides nothing here.
  variety: VarietyHomeSummary;
  // How daily living is going, 2026-09-23. One line of streaks and one
  // caption, worked out in lib/keepingUp.ts. Home draws what it is
  // handed, including the wording for having nothing set up yet.
  keepingUp: KeepingUpHomeSummary;
  // What the garden gave this calendar month, 2026-09-23. A weight or a
  // count, what it came to at prices this person has recorded paying, and
  // nothing when the garden is out of season. Worked out in
  // lib/harvestYield.ts.
  gardenYield: GardenYieldHomeSummary;
};

// The periodic symptom check-in's own automatic re-prompt cadence --
// 2026-08-08, explicitly requested: "They need to automatically pop up
// every 30 days or on the first of every month." A rolling "N days since
// last completion" cadence, not a calendar-anchored "1st of the month"
// one -- the two aren't the same thing (anchoring to the 1st would mean a
// real gap anywhere from 1 to 31 days depending on when someone happens to
// finish one), and a rolling window is what actually keeps the gap between
// check-ins consistent regardless of when someone started, which is also
// what the assessment's own new domain-level "past 30 days" framing (see
// scripts/patch_assessment_item_timeframes.py) now assumes.
const ASSESSMENT_DUE_AFTER_DAYS = 30;

// otherCount, 2026-09-12: flags that were tripped this week but are tied
// to no condition the person tracks, so they are not in thisWeekCount.
// Named on the row so a count that dropped when a condition was added is
// explained where it is read, not left to be wondered about.
type WeekTrend = { thisWeekCount: number; lastWeekCount: number | null; otherCount: number };

// null when there's no prior week to compare against (too new to have one) --
// distinct from a real 0, which is a genuinely flag-free week.
function weekTrendDirection(trend: WeekTrend): 'down' | 'up' | 'steady' | null {
  if (trend.lastWeekCount == null) return null;
  if (trend.thisWeekCount < trend.lastWeekCount) return 'down';
  if (trend.thisWeekCount > trend.lastWeekCount) return 'up';
  return 'steady';
}

// Fewer flags is the improvement direction, same green/red vocabulary as
// nutrientRingColor below -- not a neutral "change happened" color scheme.
function weekTrendColor(direction: ReturnType<typeof weekTrendDirection>): string {
  if (direction === 'down') return colors.primary;
  if (direction === 'up') return colors.statusFlagged;
  return colors.textSecondary;
}

function weekTrendLabel(direction: ReturnType<typeof weekTrendDirection>): string {
  if (direction === 'down') return '↓ Down';
  if (direction === 'up') return '↑ Up';
  return '→ Steady';
}

// Explicitly requested, 2026-07-27: every info box below that's really a
// summary of another tab's own data (Your Day = Schedules, the fuel gauges
// = Insights, the mood orb = Signals, the week trend = Trends, "Meals
// logged"/"Worth a look" = Food/Insights) should carry that tab's own icon
// and identity color -- both as a small top-left label on the box (see
// CardLabel below) and as the box's own border color (see tabColorFor) --
// so a person builds a real visual association between a color/icon and
// where that data actually lives, the same way TabHub/LensHub already use
// color to mean "this tab." Looked up by path rather than hand-copying
// each color, so these boxes can never drift out of sync with TAB_ROUTES'
// own source-of-truth colors.
function tabColorFor(tabPath: Href): string {
  return TAB_ROUTES.find((route) => route.path === tabPath)?.color ?? colors.border;
}

// The name, icon and colour a Home group and the cards inside it wear now
// live in constants/homeGroups.ts, imported above. They moved there in
// 1.0.39.16 because Profile lists the same groups for its own switches,
// and a second hand-typed copy of them would drift.

// The three windows Reports itself offers (DAY_RANGE_OPTIONS in
// app/(tabs)/reports.tsx). Spelled out in words here because a Home card
// has room for it and "7d" on its own says nothing.
const REPORT_WINDOW_OPTIONS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
] as const;

// A garden task can be weeks out, so its row carries a date rather than
// the clock time Today's Reminders shows: everything in that card is
// today, and nothing here has to be.
function gardenTaskDayLabel(scheduledFor: string, today: string): string {
  const day = scheduledFor.slice(0, 10);
  if (day === today) return 'Today';
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// One dated thing that has something to say today, 2026-09-23. The lead is
// how far off the day itself is, negative once it has passed, and it is the
// number the notification for the same thing was built from.
type DatedReminderToday = { source: DatedReminderSource; lead: number };

// The left column of a dated row, which has no clock time to put there. The
// verb ("Due", "Resets", "Turn it") is on the detail line, in the words the
// notification used; this is the when, short enough for the same 62-wide
// column a dose time sits in.
function datedDayLabel(lead: number): string {
  if (lead === 0) return 'Today';
  if (lead === 1) return 'Tomorrow';
  if (lead > 1) return `In ${lead} days`;
  if (lead === -1) return 'Yesterday';
  return `${Math.abs(lead)} days ago`;
}

// What each Home section is a window INTO, 2026-09-05.
//
// Home's corner used to hold a shortcut to The Digest, which made the corner
// button mean "pick what you want to see here" on nine tabs and "go to The
// Digest" on one. Home now has its own, and this is what fills it.
//
// The point is not to scroll to a card. Every section on Home is a view onto a
// function that lives in another tab, so picking one from the menu goes to the
// function itself, exactly as tapping the card does. Direct instruction: it
// should "be used to select, not just jump to something listed on the Home
// screen... The user should be able to use one or the other, and not forced to
// use the things on the home screen to access them."
//
// The menu reflects the person's own choices, since it is built from whichever
// sections they have turned on and in the order they put them (Profile > Home
// Screen), the same way The Digest's own lens list reflects the conditions
// picked in Profile.
//
// One key is deliberately absent rather than overlooked: 'weather' renders
// inside the Today card rather than as a section of its own, so there is
// nothing to select. (Until 2026-09-12 'quickActions' was absent too; that
// row is now four separate sections, each listed here like any other.)
// Ordered the same way TabHub's own grid is, by what you do with the thing
// rather than by where it happens to sit on the page: what you put in, then
// what it tells you, then the wider world. Grouping by destination tab also
// makes the colours below read as blocks rather than a scatter.
//
// The ORDER is fixed here; which of these appear is still the person's own
// choice, since the list is filtered to whichever Home sections they have
// turned on.
//
// 'scrollTo' rather than an href marks the one option that stays on Home.
// Direct correction: '"From the Digest" just takes me to the Digest. It is
// really the only informational item that should just go to the entity it
// represents on the Home screen.' That is the distinction: every other card
// here is a shortcut to a function living in another tab, so selecting it goes
// there. The Digest cards ARE the content, so selecting that goes to them.
const HOME_LENS_DESTINATIONS: Partial<
  Record<
    HomeSectionKey,
    {
      label: string;
      icon: ComponentProps<typeof Ionicons>['name'];
      color: string;
      renderIcon?: (size: number, color: string) => ReactNode;
      href?: Href;
      scrollTo?: true;
      // Opens one of Home's own quick-log modals rather than navigating:
      // blood pressure and exercise are logged right here on Home.
      open?: 'bp' | 'exercise';
    }
  >
> = {
  // Home's own card, and the only entry here that is not a way into another
  // tab. Selecting it stays on Home and scrolls to it, the same as the Digest
  // cards below, for the same reason: the thing itself is already on this
  // page.
  //
  // 24, not 30: the sprout is taller than it is wide, so at 30 it would stand
  // over the 20px glyphs beside it.
  today: {
    label: 'Today',
    icon: 'partly-sunny',
    color: colors.tabHome,
    renderIcon: () => (
      <Image
        source={require('../../assets/branding/seed-tall-transparent.png')}
        style={{ width: Math.round((24 * 32) / 38), height: 24 }}
        resizeMode="contain"
      />
    ),
    scrollTo: true,
  },
  // What you put in.
  logAgain: {
    label: 'Log a Meal',
    icon: 'restaurant',
    color: colors.tabFood,
    href: { pathname: '/food', params: { openFoodLens: 'findMeal' } } as Href,
  },
  scanProduct: {
    label: 'Scan a Product',
    icon: 'barcode',
    color: colors.tabFood,
    // A Food lens since 2026-09-13, opened the same way Log a Meal is.
    href: { pathname: '/food', params: { openFoodLens: 'scanProduct' } } as Href,
  },
  yourDay: { label: 'Your Day', icon: 'calendar', color: colors.tabSchedules, href: '/schedule' as Href },
  todaysReminders: {
    label: "Today's Reminders",
    icon: 'alarm',
    color: colors.tabSchedules,
    href: { pathname: '/schedule', params: { openScheduleLens: 'meds' } } as Href,
  },
  symptomCheckinReminder: {
    label: 'Symptom Check-In',
    icon: 'pulse',
    color: colors.tabBioCompass,
    href: '/assessment' as Href,
  },
  todaysCheckin: { label: "Today's Check-In", icon: 'checkmark-circle', color: colors.tabBioCompass, href: '/log' as Href },
  howYoureFeeling: { label: "How You're Feeling", icon: 'heart', color: colors.tabBioCompass, href: '/log' as Href },
  logFlare: { label: 'Log a Flare', icon: 'flame', color: colors.tabBioCompass, href: '/log' as Href },
  logBloodPressure: { label: 'Log Blood Pressure', icon: 'heart-circle', color: colors.tabBioCompass, open: 'bp' },
  logExercise: { label: 'Log Exercise', icon: 'walk', color: colors.tabBioCompass, open: 'exercise' },
  // What it tells you.
  mealsLoggedToday: {
    label: 'Meals Logged Today',
    icon: 'restaurant',
    color: colors.tabSchedules,
    href: { pathname: '/schedule', params: { openScheduleLens: 'todaysMeals' } } as Href,
  },
  worthALook: { label: 'Worth a Look', icon: 'sparkles', color: colors.tabInsights, href: '/insights' as Href },
  fuelGauges: { label: "Today's Fuel", icon: 'speedometer', color: colors.tabInsights, href: '/insights' as Href },
  weekTrend: {
    label: "This Week's Trend",
    icon: 'trending-up',
    color: colors.tabTrends,
    href: '/week-flags' as Href,
  },
  varietyThisWeek: {
    label: 'Variety This Week',
    icon: 'color-palette',
    color: colors.tabTrends,
    href: { pathname: '/trends', params: { openTrendsLens: 'variety' } } as Href,
  },
  keepingUp: {
    label: 'Keeping Up',
    icon: 'checkmark-done',
    color: colors.tabTrends,
    href: { pathname: '/trends', params: { openTrendsLens: 'keepingUp' } } as Href,
  },
  gardenYield: {
    label: 'Garden Yield',
    icon: 'basket',
    color: colors.tabTrends,
    href: { pathname: '/trends', params: { openTrendsLens: 'harvest' } } as Href,
  },
  makeReport: {
    label: 'Make a Report',
    icon: 'document-text',
    color: colors.tabReports,
    href: { pathname: '/reports', params: { openReportDays: '30' } } as Href,
  },
  // The wider world, and the one that stays here. The Grocery List moved
  // from Schedules to Life on 2026-09-12 (see lib/homeSections.ts).
  gardenTasks: {
    label: 'Garden Tasks',
    icon: 'leaf',
    color: colors.tabGarden,
    href: { pathname: '/garden', params: { openGardenLens: 'upcomingTasks' } } as Href,
  },
  daysUntil: {
    label: 'Days Until',
    icon: 'hourglass',
    color: colors.tabGarden,
    href: { pathname: '/garden', params: { openGardenLens: 'daysUntil' } } as Href,
  },
  logHarvest: {
    label: 'Log a Harvest',
    icon: 'basket',
    color: colors.tabGarden,
    href: { pathname: '/garden', params: { openGardenLens: 'harvestLog' } } as Href,
  },
  groceryList: { label: 'Grocery List', icon: 'cart', color: colors.tabLife, href: '/grocery-list' as Href },
  routines: {
    label: 'Routines',
    icon: 'footsteps',
    color: colors.tabLife,
    href: { pathname: '/life', params: { openLifeLens: 'routines' } } as Href,
  },
  doneChecks: {
    label: 'Did I Do It',
    icon: 'checkmark-done',
    color: colors.tabLife,
    href: { pathname: '/life', params: { openLifeLens: 'didIDoIt' } } as Href,
  },
  countdowns: {
    label: 'Days Until',
    icon: 'hourglass',
    color: colors.tabLife,
    href: { pathname: '/life', params: { openLifeLens: 'daysUntil' } } as Href,
  },
  // Belongs to no tab, so it keeps colors.primary the way the shared-
  // folder nudge does.
  captureInbox: {
    label: 'Capture',
    icon: 'file-tray-outline',
    color: colors.primary,
    href: '/capture' as Href,
  },
  whereIsIt: {
    label: 'Where Is It',
    icon: 'search-outline',
    color: colors.primary,
    href: '/where-is-it' as Href,
  },
  // Your Story, 2026-09-24. The menu goes to the full page rather than
  // scrolling to the card, since the card shows one section and the page
  // shows them all. A book rather than the newspaper, which is the Digest
  // cards' mark.
  yourStory: {
    label: 'Your Story',
    icon: 'book-outline',
    color: colors.primary,
    href: '/your-story' as Href,
  },
  // 2026-09-19: the Digest tab is gone, its categories spread over Life,
  // Garden and Food, and the cards "should each be the color of the tab
  // they come from." They spent one release in the Home group before the
  // correction the same day: a group of their own again, called Digest,
  // in the purple the tab wore, under the newspaper rather than the ribbon
  // (see constants/homeGroups.ts). Each card below still wears the colour
  // and icon of the tab its entry lives on.
  digestCards: {
    label: 'Digest',
    icon: 'newspaper',
    color: colors.tabPurpleDigest,
    scrollTo: true,
  },
};

// Fixed order for the menu, independent of how the sections are stacked on the
// page. Object key order would work today and would break silently the first
// time someone reordered the literal above, so it is stated.
const HOME_LENS_ORDER: HomeSectionKey[] = [
  'today',
  'yourStory',
  'captureInbox',
  'whereIsIt',
  'logAgain',
  'scanProduct',
  'yourDay',
  'todaysReminders',
  'symptomCheckinReminder',
  'todaysCheckin',
  'howYoureFeeling',
  'logFlare',
  'logBloodPressure',
  'logExercise',
  'mealsLoggedToday',
  'worthALook',
  'fuelGauges',
  'weekTrend',
  'varietyThisWeek',
  'keepingUp',
  'gardenYield',
  'makeReport',
  'gardenTasks',
  'daysUntil',
  'logHarvest',
  'groceryList',
  'routines',
  'doneChecks',
  'countdowns',
  'digestCards',
];

// The Digest's own corner shortcut, 2026-07-27 -- explicitly
// requested: Home is the one page with no LensHub of its own (nothing to
// switch between), so its own bottom-left corner sits unused; this gives
// Home a direct, always-visible way into The Digest, "just like the
// other main tabs" have for their own lenses, rather than only being
// reachable through the butterfly menu's own grid (TabHub.tsx, added
// earlier the same day).
//
// 2026-08-05: simplified from its own 3-option LensHub (MedlinePlus/ATA/
// Autoimmune Association -- the original external-source plan named in the
// old app/purple-digest.tsx's own header comment) down to a single plain
// button, once Digest was promoted to a real tab (see
// constants/tabs.ts) with its own real 9-category LensHub of its own. "The
// icon on the Home page can stay a shortcut to that Hub," per the request
// that prompted this -- a single tap into the real tab, not a second,
// now-redundant picker with three options that no longer map onto anything
// (this app builds its own real cited content now, rather than pointing at
// those three external sites). Position matches the corner button LensHub
// itself would render there (useBottomLeftHubPosition, the same hook
// LensHub uses internally) -- so this reads as "the same slot," not a new
// element. Rendered inline in the main return below (using that
// component's own `router`), not a separate component -- every other
// floating element on this screen is inlined the same way.

// The Digest category a flip card came from, by key, for the header each
// card carries (2026-09-12). Built once from the Digest's own list rather
// than a second hand-typed set of names.
const DIGEST_CATEGORY_LABEL_BY_KEY: Partial<Record<DigestCategoryKey, string>> = Object.fromEntries(
  DIGEST_CATEGORY_META.map((meta) => [meta.key, meta.label]),
);

// Same two shapes a dose can describe itself in that the notification text
// uses (describeDose in lib/reminderNotifications.ts): prescriptions and OTC
// drugs carry an amount and a unit, supplements carry units per day of a
// labelled serving. Whichever pair is null is simply left out.
function describeReminderDose(reminder: TodaysReminder): string | null {
  if (reminder.doseAmount != null && reminder.doseUnit) {
    return `${reminder.doseAmount} ${reminder.doseUnit}`;
  }
  if (reminder.unitsPerDay != null && reminder.servingUnitLabel) {
    return `${reminder.unitsPerDay} ${reminder.servingUnitLabel}`;
  }
  return null;
}

// Wording matched to the Meds lens, which is where these get acted on, so a
// dose does not read as "Taken" here and "Logged" there. A planned dose whose
// time has not come yet says nothing at all: the time is already on the row,
// and a word saying so would only be noise on every future row of the day.
// Colour carries the same split: what still wants attention keeps the accent,
// what is settled recedes to muted.
function describeReminderState(
  reminder: TodaysReminder,
  nowKey: string,
): { label: string; color: string } | null {
  switch (reminder.status) {
    case 'logged':
      return { label: 'Taken', color: colors.textMuted };
    case 'completed':
      return { label: 'Done', color: colors.textMuted };
    case 'skipped':
      return { label: 'Skipped', color: colors.textMuted };
    case 'cancelled':
      return { label: 'Cancelled', color: colors.textMuted };
    default:
      return reminder.scheduledFor < nowKey ? { label: 'Due', color: colors.accent } : null;
  }
}

type UpNext = { item: ScheduleItemRecord; isPast: boolean };

function findUpNext(scheduledToday: ScheduleItemRecord[]): UpNext | null {
  const planned = scheduledToday
    .filter((item) => item.status === 'planned')
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  if (planned.length === 0) return null;

  const nowKey = `${todayDateString()}T${nowTimeString24()}`;
  const upcoming = planned.find((item) => item.scheduledFor >= nowKey);
  if (upcoming) return { item: upcoming, isPast: false };
  return { item: planned[planned.length - 1], isPast: true };
}

const HOME_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page is for',
    body: "One glance at where today already stands, without opening five separate tabs to find out. This is the page you open first: your day's schedule, whether today's nutrients are on track, and how you've been feeling, all refreshed the moment you open the app.",
  },
  {
    heading: 'What this page shows',
    body: "A live dashboard, not a static page: your day's arc, today's fuel gauges, and how you've been feeling, refreshed every time you open it. Tap anything inside a section to jump to the tab it summarizes.",
  },
  {
    heading: 'How the sections work',
    body: "Each section starts folded to a single row carrying just its name. Tap the row to open it and tap again to fold it away; the app remembers which ones you left open. A row with a forward arrow is an action rather than a fold: tapping it does the thing, such as opening the scanner or logging a flare. The coloured bar down the left edge of every row is the colour of the tab that section belongs to, and sections from the same tab always sit together, so a run of the same colour is one tab's worth of information. Which sections show, and the order the groups appear in, is yours to set in Profile → Home Screen.",
  },
  {
    heading: "Today's sky & weather",
    body: "A row of chips under the date. Moon phase and the next equinox/solstice countdown are computed directly on your phone using standard astronomical formulas; no location or network needed, so they're always shown. Sunrise, sunset, today's high and low temperature, humidity, UV index, and air quality (AQI) come from Open-Meteo, a free weather service, using the same location your Garden → My Zone already has saved, with no separate GPS permission required. The high/low chips turn red or cool blue-teal, with a 🥵/🥶 icon, only when today's forecast actually crosses a plain, disclosed threshold; this isn't an official government weather warning. Pollen is requested for any location, but only ever shows where the weather service actually has data for it, which today means Europe; nothing is guessed or approximated for anywhere else (the US isn't covered by the free source this app uses right now). If a fetch fails, a chip says so directly (offline, a service error, or an unexpected response) rather than quietly showing old numbers as if they were current. Nothing shows here until you've set a growing zone in Garden → My Zone; tap the prompt chip to go straight there.",
  },
  {
    heading: 'The Day Arc',
    body: 'A visual line across your day (6 AM to 10 PM by default) with a dot for each scheduled item, plus a glowing marker for right now. Tap a dot for details and quick actions.',
  },
  {
    heading: 'Fuel Gauges',
    body: "Rings for iodine, selenium, zinc, iron, copper, vitamin D, calcium, magnesium, and B12: nutrients most directly tied to thyroid function and bone health. Each shows the percent of your whole day's target reached by what you have logged so far today, food and supplements together, so they climb as the day goes on. Nothing here is projected forward.",
  },
  {
    heading: 'What the gauge colours mean',
    body: "The colour moves with the fill rather than standing for a status word: a cool slate when little has been logged, blending toward green as a nutrient approaches its target. Going past 100% is not treated as a problem, because for these nine more is not harmful on its own. A ring only turns to the warning colour, with a line naming the nutrient underneath, when intake has actually passed a published safe upper limit, and for the few nutrients whose limit applies to supplements rather than food (magnesium, folate, niacin, vitamin E) only the supplement amount is counted toward it.",
  },
  {
    heading: "How You're Feeling",
    body: "Reflects the most severe flare or food reaction you've logged in Signals over the last 2 days: cool and calm with nothing recent, warmer the more severe. Gray means you haven't logged anything there yet, which is different from calm. Its job is to keep an ongoing flare visible on the first screen you open, instead of only inside Signals, so a bad stretch is obvious without going looking for it. Tapping it opens Signals to log one or read the full history.",
  },
  {
    heading: "Today's Check-In",
    body: "A quick daily question: how are you feeling today, across a wide, categorized list covering digestion, energy, mood, sleep, skin, physical symptoms, and cognitive state. Pick everything that applies, positives included. One entry per day; tap it again any time today to change it. This builds a daily trend alongside Signals' own flare/reaction logging, not a replacement for it.",
  },
  {
    heading: 'Symptom Check-In',
    body: "The full symptom check-in (13 hypothyroid items, 5 digestive/IBS items, 5 wellbeing items) is a periodic, not daily, thing. Its row on Home says when one is due, every 30 days or the first time you haven't taken one at all, so it's easy to notice without having to remember, and it can be taken any time from the same row whether or not one is due.",
  },
  {
    heading: 'What is Hashimoto’s thyroiditis?',
    body: "An autoimmune condition: the immune system produces antibodies (most often against thyroid peroxidase, sometimes thyroglobulin) that gradually attack the thyroid gland, reducing its ability to make thyroid hormone. It's the most common cause of an underactive thyroid (hypothyroidism) in the US and other iodine-sufficient countries, and roughly 7-10x more common in women than men. The course is often slow and uneven; some people pass through a period of normal, or even briefly overactive, thyroid function before settling into an underactive pattern.",
  },
  {
    heading: 'Common challenges & symptoms',
    body: 'Persistent fatigue, unexplained weight gain, feeling unusually cold, brain fog, low mood, dry skin and hair thinning, joint/muscle aches, constipation, irregular periods, and in some cases a visibly enlarged thyroid (goiter). Hashimoto’s also tends to cluster with other autoimmune conditions such as celiac disease or pernicious anemia, which can compound digestive and nutrient-absorption symptoms. Source: StatPearls (NCBI Bookshelf), "Hashimoto Thyroiditis," NBK459262; NIDDK, "Hashimoto’s Disease."',
  },
  {
    heading: 'Why food and timing matter here',
    body: 'Certain foods and minerals (calcium and iron are well-documented examples) can interfere with how well a thyroid prescription is absorbed if eaten too close to a dose, which is part of why Schedules tracks meal, supplement, and prescription timing together. Digestion and absorption are also frequently disrupted in Hashimoto’s, which is why gut and microbiome support is treated as a goal in its own right throughout this app.',
  },
  {
    heading: 'What Inside Story does',
    body: "Not a generic calorie counter. Inside Story exists to help someone with an autoimmune condition relearn how and what to eat, and understand how food affects their body specifically. Hashimoto's is the first condition built out in full depth, with more autoimmune conditions in active development. Meals builds and scores meals; Insights shows how today stacks up; Schedules handles timing; Trends looks for patterns over time; Signals is where you record flares, reactions, and new foods; Reports turns it all into something to hand a doctor.",
  },
  {
    heading: 'Personal notes, not medical fact',
    body: "This page's education sections and your Signals entries are general information and personal observation, not medical advice, and are not a substitute for care from your doctor.",
  },
  {
    heading: 'Getting around',
    body: 'Tap a tab at the bottom to jump to it, or swipe left/right anywhere on a screen to move to the next or previous tab: Home, Meals, Insights, Schedules, Trends, Signals, Reports, in that order.',
  },
];

export default function HomeScreen() {
  useRegisterScreenHelp('Home', HOME_HELP_SECTIONS, '/');
  const router = useRouter();
  // Sent from elsewhere to a card on Home or to one of its quick-log forms,
  // 2026-09-24: Your Story's "Go there" for an item that lives on Home.
  const { openHomeSection, openHomeQuickLog } = useLocalSearchParams<{
    openHomeSection?: string;
    openHomeQuickLog?: string;
  }>();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const bottomInset = useBackgroundBottomInset();
  // The Digest corner shortcut's own position -- same hook LensHub
  // uses internally, called here directly since this button is now a plain
  // TouchableOpacity rather than a LensHub instance (see that button's own
  // render/comment below).
  // Which of this screen's own content sections the person has chosen to
  // keep visible -- see HomeSectionKey's own comment in
  // lib/visualPreferences.ts for the full "let them dial in what they
  // want" reasoning. Read the same live way every other visual preference
  // already is, so a toggle flipped on Profile reaches Home immediately.
  const visualPrefs = useVisualPreferences();
  // Which of Home's per-tab groups are open, kept under "homeTab:/food"
  // and the rest (see HOME_TAB_GROUP_BAND_KEY_PREFIX). A group is a band
  // like any other, so it remembers its fold the same way.
  const tabGroupFolds = useBandFolds();

  // Holding any band down hands the page to HomeArrangeList, 1.0.39.16:
  // "the ability to long hold on a Home screen group that causes it to be
  // able to be dragged and dropped into a new order on the screen and to
  // be turned off from the Home screen". Component state on purpose, not a
  // saved preference: what gets arranged is remembered, but being in the
  // middle of arranging is not something to come back to tomorrow.
  const [arranging, setArranging] = useState(false);
  // True only while a row in that list is actually being held. The scroll
  // below is switched off for exactly that long, 1.0.39.17: a vertical drag
  // and a vertical scroll are the same finger movement, and the ScrollView
  // was winning it every time.
  const [arrangeDragging, setArrangeDragging] = useState(false);
  // Which card was being held when arranging started, so the list can open
  // on the cards inside that group instead of on the group names,
  // 1.0.39.19: "If I long press a sub category, they should be what I see
  // when the ability to move them pops up. I didn't realize I needed to
  // select the name of the group to get to the sub items."
  const [arrangeOpenKey, setArrangeOpenKey] = useState<HomeSectionKey | null>(null);

  // Holding a card says "arrange these"; holding a group name says
  // "arrange the groups", which is why the second one passes nothing.
  function beginArranging(key?: HomeSectionKey) {
    setArrangeOpenKey(key ?? null);
    setArranging(true);
    // The page being replaced was scrolled to wherever the band being held
    // sits, and the list that replaces it is shorter, so without this the
    // list can come up part way down itself. Holding a card scrolls to that
    // card's group instead, once the list has said where it put it.
    if (!key) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  // Built from what is actually on Home, in the order it is on Home, so the
  // menu and the page can never disagree about what exists.
  const homeLensOptions = useMemo<LensOption<HomeSectionKey>[]>(
    () =>
      HOME_LENS_ORDER.filter((key) => isHomeSectionVisible(visualPrefs, key)).map((key) => {
        const entry = HOME_LENS_DESTINATIONS[key]!;
        return { key, label: entry.label, icon: entry.icon, iconColor: entry.color, renderIcon: entry.renderIcon };
      }),
    [visualPrefs],
  );

  // 2026-09-03. Seeded test data is indistinguishable from real data once it
  // is in, and the whole point of it is that the app is being used for testing
  // rather than for real. A standing line saying so is what stops a seeded
  // harvest or a seeded shopping trip being read later as something that
  // actually happened.
  const [testDataPresent, setTestDataPresent] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  // What the meals around a dose do to it, 2026-09-23, keyed by the dose's
  // schedule_items id. Loaded on its own after the dashboard rather than
  // inside it, and only when the day actually holds a dose: working this
  // out reads every scheduled meal's ingredients through to nutrients (see
  // getDayMealAndDoseTimeline), which is not work to put in front of the
  // first paint of Home for the many days that hold no dose at all.
  const [doseFoodNotes, setDoseFoodNotes] = useState<Record<string, DoseFoodNote>>({});
  const [loading, setLoading] = useState(true);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Only ever opens when "Worth a look" is genuinely made of both kinds of
  // flag at once -- see handleWorthALookPress below.
  const [worthALookChoiceOpen, setWorthALookChoiceOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItemRecord | null>(null);
  const [quickLogModal, setQuickLogModal] = useState<'bp' | 'exercise' | null>(null);
  // Your Story's view, read on focus by the hook and again whenever Home's
  // own data reloads (below), so a meal or a check-in logged right here
  // ticks its item without leaving the page.
  const [yourStory, reloadYourStory] = useYourStory();
  // Quick-log phase 4. Two sheets rather than one: picking where a photo comes
  // from, and deciding what an already-taken one actually was.
  const [photoSourceSheetOpen, setPhotoSourceSheetOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState<MealPhotoDraft | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpBpm, setBpBpm] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [exerciseIntensity, setExerciseIntensity] = useState<'light' | 'moderate' | 'vigorous' | null>(null);
  // Today's Check-In (see "Today's Check-In" render section below) --
  // false/[] until either the picker's own "Change" link is tapped, or the
  // first load finds no existing entry for today at all (see the effect
  // paired with `data` below). `selectedFeelingTags` is the working
  // selection while the picker is open, seeded from today's already-saved
  // entry when one exists so reopening it to add/remove a tag doesn't lose
  // what's already there.
  const [feelingPickerOpen, setFeelingPickerOpen] = useState(false);
  const [selectedFeelingTags, setSelectedFeelingTags] = useState<string[]>([]);
  const [feelingSaving, setFeelingSaving] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  // undefined = not fetched yet, null = fetched but no logged days this
  // week (nothing worth showing), object = real comparison.
  const [weekTrend, setWeekTrend] = useState<WeekTrend | null | undefined>(undefined);
  // undefined = not fetched yet this session. See lib/homeSky.ts's own
  // header comment for the real "no-location"/"unavailable"/"ready" states
  // this can settle into. Moon phase and the next equinox/solstice are
  // deliberately NOT state at all -- both are pure, synchronous, offline
  // math (lib/celestialEvents.ts), computed directly in the render below.
  const [skyResult, setSkyResult] = useState<HomeSkyResult | undefined>(undefined);
  // Bumped every 15 minutes to move every card onto a different entry from its
  // own group. Plain state rather than a timestamp so the shuffle below depends
  // on one changing number and nothing else.
  const [flipCardRotation, setFlipCardRotation] = useState(0);
  // Fixed once per mount, which is once per app open, so each card's entry
  // is a different one each time the app opens but stable while it is open.
  // Regenerating it on every render would change the cards under someone
  // mid-read. Until 2026-09-19 this also shuffled the order of the cards
  // themselves; they run alphabetically now (see visibleFlipCards).
  const [flipCardSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  // The real scope of Home's own Digest flip cards, 2026-08-23 direct
  // request -- see digestFlipCardPool's own comment below for how these
  // two lists actually get used. Both start empty (matching "nothing
  // selected yet" honestly) rather than undefined, so the first render
  // before this loads still shows Basic Health content rather than an
  // empty or crashing pool.
  const [userConditionCodes, setUserConditionCodes] = useState<string[]>([]);
  // Null while it is still being worked out, so the card cannot flash up on
  // somebody who set this up months ago.
  const [sharedFolderReady, setSharedFolderReady] = useState<boolean | null>(null);
  const [curiousAboutConditionCodes, setCuriousAboutConditionCodes] = useState<string[]>([]);
  // 2026-08-28, real root cause of a multi-minute cold-start stall,
  // found by adding real timing instrumentation and reading the actual
  // device log rather than guessing further: load() below used to
  // depend on `userConditionCodes` directly, but loadDigestConditionScope
  // (called alongside it in the very same Promise.all) is what SETS that
  // state -- getUserConditions() returns a freshly-built array every
  // call, a new reference even when the actual condition codes never
  // changed, so every resolution of loadDigestConditionScope recreated
  // `load`, which recreated the outer useFocusEffect callback below,
  // which refired the whole effect, which called loadDigestConditionScope
  // again, which set the state again, forever -- a real, self-sustaining
  // infinite refetch loop, not a slow database or a slow network. This
  // ref mirrors the state without `load` needing to depend on it, so
  // load() can read the latest tracked conditions without ever being
  // recreated -- the standard fix for "a callback needs a fresh value
  // without needing to change identity every time that value does."
  useEffect(() => {
    const timer = setInterval(() => setFlipCardRotation((current) => current + 1), FLIP_CARD_ROTATION_MS);
    return () => clearInterval(timer);
  }, []);

  // Whether a card has anything to show right now, which is a different
  // question from whether it is switched on, and these two are the only
  // cards where the answer can be no. Stated here rather than inside each
  // render alone so the arranging list can ask it too, 1.0.39.18: "Shared
  // Folder Setup shows when I go to move groups but its not there when I
  // select Done." A card somebody switched off belongs on that list,
  // greyed, so it can be switched back on. A card that is not here today
  // is not a row at all.
  function homeSectionHasContent(key: HomeSectionKey) {
    if (key === 'sharedFolderSetup') return sharedFolderReady === false;
    if (key === 'weekTrend') return Boolean(weekTrend);
    return true;
  }

  // Whether the page has anything left on it at all. Not just every
  // section turned off any more: a group can be turned off whole now, so
  // a page can empty out without a single card being switched off itself,
  // and a card with nothing to show today leaves no band behind either.
  const nothingIsShowing = useMemo(
    () =>
      groupHomeSectionsForDisplay(getOrderedHomeSectionKeys(visualPrefs)).every((group) =>
        group.kind === 'tab'
          ? !isHomeGroupVisible(visualPrefs, homeGroupIdOf(group)) ||
            group.keys.every(
              (key) => !isHomeSectionVisible(visualPrefs, key) || !homeSectionHasContent(key),
            )
          : !isHomeSectionVisible(visualPrefs, group.key) || !homeSectionHasContent(group.key),
      ),
    // homeSectionHasContent is rebuilt every render and reads exactly the
    // two values listed here, so those are the dependencies that matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visualPrefs, sharedFolderReady, weekTrend],
  );

  const userConditionCodesRef = useRef(userConditionCodes);
  useEffect(() => {
    userConditionCodesRef.current = userConditionCodes;
  }, [userConditionCodes]);
  // Ref, not state -- read once per focus to decide whether this is the
  // very first load this session (show the loading gate, then reveal
  // everything at once, scrolled to the top) or a returning focus (Tabs
  // keeps Home mounted in the background on switch, so swiping/hubbing
  // back to it re-runs this effect -- refresh the data silently in that
  // case, without re-showing "Loading today…" or fighting wherever the
  // person had scrolled to).
  const hasLoadedOnceRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  // Where each section sits down the page, recorded as it lays out, so the
  // lens menu can scroll to the one option that stays on Home. A ref rather
  // than state on purpose: this changes on every layout pass and nothing
  // renders from it, so storing it in state would re-render the whole screen
  // for a number only a tap ever reads.
  const sectionOffsets = useRef<Partial<Record<HomeSectionKey, number>>>({});
  // The greeting card used to keep a collapse state here: full size for
  // thirty seconds, then a shrink into a small floating seed badge in the
  // corner, tap to reopen as an overlay, thirty seconds again, shrink
  // again, and a forced shrink on every blur. All of it is gone as of
  // 1.0.39.10.
  //
  // Direct correction: "I think the Welcome card should be just available
  // at the top without the current 30 second wait... I think it should
  // remain at the top and become colapsable like the tab groups. It should
  // be a quick access thing available in the Home group."
  //
  // So it is a Home section now, called Today, in the Home group, and it
  // folds the way every other band on this page folds. Which also moves it
  // from session state to a saved preference, and that is the part that
  // matters: somebody who wants the sky in front of them every morning gets
  // it every morning, somebody who does not gets one row, and neither of
  // them has to wait thirty seconds or catch the card before it goes.

  // Kept separate from `load` below -- getSixDimensionsFlagTrendSeries
  // loops one DB call per day over 14 days, so it's noticeably heavier
  // than the rest of Home's data. Still awaited together with `load`
  // below (Promise.all) before the loading gate ever lifts, though --
  // letting it resolve on its own after the gate already lifted was
  // exactly what made the week-trend caption visibly pop in a beat after
  // everything else, instead of the whole page appearing at once.
  // Condition-scoped since 2026-09-12: this was the one flag count on
  // Home the 2026-08-26 scoping pass missed, so the week's total counted
  // every scored sub-criterion while Trends' own Condition Scores lens
  // counted only the ones relevant to a tracked condition, and the two
  // numbers could not agree. Same codes, same series function, same sum
  // as the lens now shows.
  //
  // 2026-09-12: reads the itemised flags (getFlaggedItemsByDateRange), the
  // same function the This Week's Flags screen lists from, and sums them,
  // so the number here and the rows there are one computation. It used to
  // sum a trend series that only ever carried the count.
  const loadWeekTrend = useCallback(() => {
    const today = todayDateString();
    return getFlaggedItemsByDateRange(dateStringOffsetFrom(today, -13), today, userConditionCodesRef.current).then((days) => {
      const thisWeekStart = dateStringDaysAgo(6);
      const thisWeek = days.filter((day) => day.date >= thisWeekStart);
      const lastWeek = days.filter((day) => day.date < thisWeekStart);
      if (thisWeek.length === 0) {
        setWeekTrend(null);
        return;
      }
      const thisWeekCount = thisWeek.reduce((sum, day) => sum + day.relevant.length, 0);
      const otherCount = thisWeek.reduce((sum, day) => sum + day.other.length, 0);
      const lastWeekCount = lastWeek.length > 0 ? lastWeek.reduce((sum, day) => sum + day.relevant.length, 0) : null;
      setWeekTrend({ thisWeekCount, lastWeekCount, otherCount });
    });
  }, []);

  // Also kept separate from `load` -- this one makes a real network call
  // (Open-Meteo) the first time it runs each day, and load() itself stays a
  // pure local-database read. getHomeSkyData() already caches its own
  // result per real calendar day, so every focus after the first on a given
  // day resolves this from the local cache with no network at all.
  const loadSkyData = useCallback(() => {
    return getHomeSkyData().then(setSkyResult);
  }, []);

  // Also kept separate from `load` -- two small, cheap local reads, but
  // logically about what Home's own Digest flip cards should draw from,
  // not the rest of this screen's own health/schedule data.
  // Its own loader rather than part of the main load: it is a network round
  // trip to Microsoft, and Home must not wait on it.
  const loadSharedFolderState = useCallback(async () => {
    const state = await getSharedFolder();
    setSharedFolderReady(state.state === 'ready');
  }, []);

  const loadDigestConditionScope = useCallback(() => {
    return Promise.all([getUserConditions(), getCuriousAboutConditions()]).then(([owned, curious]) => {
      // Written to the ref here as well as to state, 2026-09-12: the
      // ref's own mirroring effect only runs after the next render, and
      // load()/loadWeekTrend() below read the ref straight after this
      // resolves, on the same tick. Without this line the first load of a
      // launch counted flags with no conditions at all.
      userConditionCodesRef.current = owned;
      setUserConditionCodes(owned);
      setCuriousAboutConditionCodes(curious);
    });
  }, []);

  const load = useCallback(() => {
    const date = todayDateString();
    const twoDayFloor = dateStringDaysAgo(1);

    return Promise.all([
      listMealsForDate(date),
      listScheduledMealsForDate(date),
      // 2026-08-15: swapped from getDailyNutrientBreakdown(date)/
      // getDailySixDimensionsBreakdown(date) -- both real, but each
      // documented directly at its own definition in lib/db.ts as
      // "genuinely heavy per call" (a fresh per-meal/per-item resolution
      // pass every time, no cross-call caching between the two). Reported
      // directly as "15 to 20 seconds for the home screen to populate."
      // These two range-scoped functions were already built and proven
      // fast for exactly this class of problem (Trends' own 2026-08-15
      // rewrite, see trendAnalysis.ts's own header comment) -- called here
      // with a trivial one-day range (today to today), they do the exact
      // same real work in a fraction of the queries: one real,
      // window-scoped item lookup plus one score/nutrient lookup per
      // DISTINCT food actually eaten today, not once per meal-item with a
      // cache reset for a whole separate call. Confirmed Home only ever
      // read nutrientBreakdown.driRows/dayTotals/supplementTotals and
      // dimensionsBreakdown.day (never any meal-by-meal/side-by-side
      // detail from either), so both are safe, like-for-like swaps.
      getNutrientTotalsByDateRange(date, date),
      // 2026-08-26 -- condition-scoped, using the same userConditionCodes
      // state loadDigestConditionScope already fetches for the Digest
      // flip cards, not a second fetch. See lib/db.ts's own comment on
      // why this now means something different (and more correct) than
      // before: a flag genuinely relevant to a tracked condition, not any
      // of the ~29 currently-scored sub-criteria regardless of relevance.
      getSixDimensionsFlagCountsByDateRange(date, date, userConditionCodesRef.current),
      listCheckins({ checkinType: 'flare', limit: 60 }),
      listCheckins({ checkinType: 'post_meal', limit: 60 }),
      getUserProfile(),
      // 2026-08-08: the two new additions for Today's Check-In / the
      // periodic-assessment due banner. getCheckinForDate is a real,
      // targeted single-row query (see its own comment in lib/db.ts), not
      // a listCheckins() call filtered client-side.
      getCheckinForDate(date, 'general'),
      listSymptomAssessments(1),
      // Log Again, 2026-08-30. Appended last rather than slotted in beside
      // listMealsForDate above so the destructure below stays a stable
      // append-only list. One indexed query over meals, no per-row work.
      // Quick-log phase 4, 2026-08-30.
      listMealPhotoDrafts(12),
      // The Grocery List, 2026-09-01. One row plus one count, see
      // getActiveGroceryListSummary.
      getActiveGroceryListSummary(),
      // Today’s Reminders, 2026-09-16. One day-scoped query with a single
      // join, appended last to keep the destructure below the stable
      // append-only list its own comment above already asks for.
      listTodaysReminders(date),
      // Garden Tasks, 2026-09-16. Appended last for the same reason every
      // addition above it was: the destructure below stays append-only.
      // Five rather than the default twenty, since this is a Home card and
      // the lens itself is one tap away.
      listUpcomingGardenTasks(5),
      // The capture inbox, 2026-09-16. Appended last for the same reason
      // as everything above it. One aggregate query over one small table,
      // and it reads no note text: Home only needs to know whether there
      // is anything there.
      getCaptureInboxCounts(),
      // Reconciliation, 1.0.39.15. Appended last for the same reason as
      // everything above it. Two COUNT(*) queries over one already-indexed
      // table rather than the lists themselves, so opening Home never reads
      // a week of rows nobody has answered for.
      countOpenScheduleItems(lookbackDateString(new Date())),
      countAssumedScheduleItems(lookbackDateString(new Date())),
      // Routines and checks, 2026-09-17. Appended last for the same reason
      // as everything above it. Three small queries inside one call, over
      // tables that only ever hold what somebody typed themselves.
      getRoutinesHomeData(),
      // The dated things, 2026-09-23. Direct question: of everything added
      // lately, what belongs on Home that is not there? Three of the five
      // dated reminder kinds had nowhere on Home at all, so a bill due on
      // the 5th existed only as a notification that is gone the second it
      // is swiped. The band widened rather than a new section being added,
      // which keeps one place to look for "what is today asking of me".
      //
      // The preferences come with it because Home honours the same two
      // switches the scheduler does: a kind switched off in Profile stays
      // silent here too, and nudging decides whether something past its day
      // keeps being shown. The band and the notification saying different
      // things would be worse than either of them alone.
      listDatedReminderSources(date),
      getReminderPreferences(),
      countPlaceRecords(),
      // Variety, 2026-09-23. Four weeks of meal items over one query plus
      // one reference-database lookup, the same read the lens does over a
      // shorter range.
      getVarietyHomeSummary(date),
      // Keeping Up, 2026-09-23. Eight weeks back, which is long enough
      // for a run to have built up and short enough that the card is
      // about now.
      getKeepingUpHomeSummary(date),
      // Garden Yield, 2026-09-23. This calendar month only, since the card
      // is about what the garden is giving now; the months behind it are
      // the lens's job.
      getGardenYieldHomeSummary(date),
    ]).then(
      ([
        todaysMeals,
        scheduledToday,
        nutrientTotals,
        sixDsFlagCounts,
        flareEntries,
        reactionEntries,
        profile,
        feelingCheckin,
        recentAssessments,
        photoDrafts,
        grocerySummary,
        todaysReminders,
        gardenTasks,
        captureCounts,
        openToAnswer,
        assumedToConfirm,
        routinesHome,
        datedSources,
        reminderPrefs,
        placeCount,
        variety,
        keepingUp,
        gardenYield,
      ]) => {
        setFirstName(profile.firstName);
        const nutrientEntries = analyzeNutrientIntake(
          nutrientTotals.driRows,
          nutrientTotals.dayTotals[date] ?? {},
          nutrientTotals.supplementTotals,
        );
        const sixDsFlagCount = sixDsFlagCounts[date] ?? 0;

        const negativeEntries = [...flareEntries, ...reactionEntries];
        const hasAnyLogHistory = negativeEntries.length > 0;
        const recentSeverities = negativeEntries
          .filter((entry) => entry.loggedAt.slice(0, 10) >= twoDayFloor && entry.severity != null)
          .map((entry) => entry.severity as number);
        const recentMaxSeverity = recentSeverities.length > 0 ? Math.max(...recentSeverities) : null;

        // Which of the dated things has anything to say today, worked out
        // the way the scheduler works it out rather than by comparing dates
        // here: datedReminderDays owns the leads per kind (a bill speaks
        // three days out and again on the day, a benefit a month and a week
        // out), and asking it is what stops this band drifting away from
        // what the phone said. Ordered by lead, so anything already past
        // its day sits at the top.
        const nudge = isNudgeUntilDoneEnabled(reminderPrefs);
        const datedToday: DatedReminderToday[] = [];
        for (const source of datedSources) {
          if (!isReminderKindEnabled(reminderPrefs, source.kind)) continue;
          const lead = datedReminderLeadToday(source.kind, source.dueOn, date, nudge);
          if (lead === null) continue;
          datedToday.push({ source, lead });
        }
        datedToday.sort((a, b) => a.lead - b.lead || a.source.title.localeCompare(b.source.title));

        const lastAssessment = recentAssessments[0] ?? null;
        const daysSinceAssessment = lastAssessment
          ? Math.floor((Date.now() - new Date(lastAssessment.completedAt).getTime()) / (24 * 60 * 60 * 1000))
          : null;

        setData({
          todaysMeals,
          photoDrafts,
          grocerySummary,
          scheduledToday,
          todaysReminders,
          datedToday,
          nutrientEntries,
          sixDsFlagCount,
          recentMaxSeverity,
          hasAnyLogHistory,
          feelingCheckin,
          daysSinceAssessment,
          checkinReminderDays: profile.checkinReminderDays,
          gardenTasks,
          captureCounts,
          placeCount,
          variety,
          keepingUp,
          gardenYield,
          reconcileCounts: { open: openToAnswer, assumed: assumedToConfirm },
          routines: routinesHome.routines,
          doneChecks: routinesHome.checks,
          routineOccasions: routinesHome.occasions,
        });
      },
    );
  }, []);

  // Both loaded together, on every focus (so returning from Food/Bio-
  // Compass with something new logged still shows up) -- but the loading
  // gate and scroll-to-top below only ever fire on the first one this
  // session, via hasLoadedOnceRef. A returning focus updates `data`/
  // `weekTrend` in place once both resolve, with no gate flicker and no
  // fighting the person's own scroll position.
  //
  // 2026-08-28: this dependency array is the actual reason a cold launch
  // could take minutes, not the reference database (a real, separate fix
  // shipped the same day, worthwhile on its own merits but not the cause
  // of THIS symptom). load's own dependency array used to include
  // userConditionCodes directly -- but loadDigestConditionScope, called
  // in the very same Promise.all below, is what SETS that state, and
  // getUserConditions() returns a freshly-built array every call, a new
  // reference even when the actual condition codes never changed. Every
  // resolution of loadDigestConditionScope therefore recreated `load`,
  // which recreated this effect's own callback, which made useFocusEffect
  // refire the whole effect, which called loadDigestConditionScope again,
  // which set the state again -- a real, self-sustaining infinite refetch
  // loop, confirmed directly by adding real timing instrumentation and
  // reading the actual device log: dozens of overlapping calls to the
  // same handful of queries, each one slower than the last as more piled
  // up, very likely the same real pressure behind at least some of the
  // "NativeDatabase.prepareAsync has been rejected" SQLite-race errors
  // chased over the two days before this was found. Fixed at the source
  // (see userConditionCodesRef above): load() now reads the latest
  // tracked conditions from that ref instead of closing over the state
  // directly, so it never needs to be recreated when that state changes,
  // and all 4 functions below are genuinely stable across renders --
  // this effect now only fires on a real focus event, not on every
  // render this state churn used to cause.
  // "Was the app just updated, and what changed?" 2026-08-29, direct
  // report after the first OTA update ever actually reached a phone: "It
  // doesn't give any warning about what is going to happen, or what to do
  // when it starts again, or if an update was applied or if there was any
  // update at all... provide a informational thing after the update is
  // applied to tell that an update was actually applied, and what did that
  // update include for changes."
  //
  // Compares the running APP_VERSION against the last one this device
  // recorded (see getLastSeenAppVersion's own comment in lib/db.ts for why
  // the version, not expo-updates' own update ID, is the right thing to
  // compare). Catches both ways a new version arrives: Profile's own
  // Check for Updates button, and the automatic check-on-launch that
  // applies on the next reopen -- neither of which said anything at all
  // before this.
  //
  // The recorded version is updated whether or not there was anything to
  // show, so a version with no release-notes entry (a purely internal
  // bump) silently moves the marker forward instead of leaving it stale
  // and re-triggering on every launch afterward.
  //
  // showInfoAlert is stable by construction (useCallback with [] deps, see
  // components/InfoAlert.tsx's own comment on exactly this), so adding
  // this to the focus effect's dependency array below cannot reintroduce
  // the refetch loop fixed there on 2026-08-28.
  // 2026-09-01, asked for directly: "Yes, re-resolve the existing saved
  // dishes." The 1.0.32.3 fix made Cook Prep decide which food row an
  // ingredient is scored against, but only as one is added, so dishes saved
  // before it kept the wrong row. This runs the one-time correction and says
  // what it changed, because it is a change to records someone made
  // themselves and going quiet about that would be the wrong call.
  //
  // Placed alongside announceAppliedUpdate for the same reason: this is the
  // one moment per launch that is already past the loading gate.
  const repairSavedDishes = useCallback(async () => {
    try {
      const result = await reresolveSavedDishCookingMethods();
      if (result.alreadyDone || result.corrected === 0) return;
      showInfoAlert(
        'Saved dishes corrected',
        `${result.corrected} ingredient${result.corrected === 1 ? '' : 's'} across your saved dishes ` +
          `${result.corrected === 1 ? 'was' : 'were'} being counted as the wrong preparation, and ${result.corrected === 1 ? 'has' : 'have'} been corrected to match the Cook Prep you chose. ` +
          'Nutrients and condition scores for those dishes will read differently from now on, because they are now reading the right food. ' +
          'Meals already logged are untouched: correcting those would rewrite days you have already seen.',
      );
    } catch (error) {
      console.warn('repairSavedDishes failed', error);
    }
  }, [showInfoAlert]);

  const refreshTestDataBanner = useCallback(async () => {
    try {
      setTestDataPresent(await isTestDataPresent());
    } catch {
      // A check that fails must not put a "test data is loaded" claim on Home
      // for someone who has none. Silence is the safe direction here.
      setTestDataPresent(false);
    }
  }, []);

  const announceAppliedUpdate = useCallback(async () => {
    try {
      const previousVersion = await getLastSeenAppVersion();
      if (previousVersion === APP_VERSION) return;
      const notes = getReleaseNotesSince(previousVersion, APP_VERSION);
      await setLastSeenAppVersion(APP_VERSION);
      if (notes.length === 0) return;
      showInfoAlert(
        `Updated to ${APP_VERSION}`,
        `Inside Story updated itself and restarted. Here's what changed:\n\n${formatReleaseNotesMessage(notes)}`,
      );
    } catch (error) {
      // A failure here should never block Home from finishing its own
      // load: not knowing whether to show a changelog is a cosmetic gap,
      // not a reason to leave someone staring at a loading screen.
      console.warn('announceAppliedUpdate failed', error);
    }
  }, [showInfoAlert]);

  useFocusEffect(
    useCallback(() => {
      // Deliberately outside the Promise.all below. It is a network round trip
      // to Microsoft, and Home must not sit on the loading gate waiting for it:
      // the card it feeds is the only thing that depends on the answer.
      void loadSharedFolderState();
      const isFirstLoad = !hasLoadedOnceRef.current;
      if (isFirstLoad) setLoading(true);
      // The condition scope first, then everything that counts by it: see
      // loadDigestConditionScope's own comment for why the order matters.
      loadDigestConditionScope()
        .then(() => Promise.all([load(), loadWeekTrend(), loadSkyData(), refreshTestDataBanner()]))
        .then(() => {
        if (!isFirstLoad) return;
        hasLoadedOnceRef.current = true;
        setLoading(false);
        // Deliberately here, inside the first-load branch, rather than in
        // its own mount effect: this is the exact moment the startup
        // overlay is about to clear (markHomeDataReady below), so the
        // What's New popup lands over a ready Home screen instead of
        // racing the loading gate and appearing behind it.
        void announceAppliedUpdate();
        void repairSavedDishes();
        // 2026-08-16: the real fix for "the loading bar... was put in
        // place to hide the loading time of the home screen." Signals
        // app/_layout.tsx's own startup gate that Home's own first real
        // load is genuinely done, so DatabaseSetupScreen can finally
        // clear -- see lib/homeReadySignal.ts's own header comment for
        // the full "why."
        markHomeDataReady();
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [load, loadWeekTrend, loadSkyData, loadDigestConditionScope, loadSharedFolderState, announceAppliedUpdate, repairSavedDishes, refreshTestDataBanner]),
  );

  // Your Story reads the same records Home just reloaded, so it reads them
  // again whenever Home does: a meal logged from Home ticks its item here.
  useEffect(() => {
    if (data) void reloadYourStory();
  }, [data, reloadYourStory]);

  // Arriving from Your Story elsewhere with a card or a quick-log form to
  // open, 2026-09-24. Waits for the first load, since the page it scrolls
  // is not laid out behind the loading card, then clears the request so
  // coming back to Home later does not repeat it.
  useEffect(() => {
    if (loading) return;
    if (!openHomeSection && !openHomeQuickLog) return;
    if (openHomeQuickLog === 'exercise') goToHomeDestination({ kind: 'quickLog', form: 'exercise' });
    else if (openHomeSection) goToHomeDestination({ kind: 'home', section: openHomeSection });
    router.setParams({ openHomeSection: '', openHomeQuickLog: '' });
    // goToHomeDestination is rebuilt every render and reads current state
    // through its own closure; the request itself is what this waits on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, openHomeSection, openHomeQuickLog]);

  // What the meals around today's doses do to them, 2026-09-23.
  //
  // Schedules > Today's Meals has said this since 1.0.49.6, and it is the
  // one thing on that lens somebody needs BEFORE the dose rather than after
  // it: a levothyroxine at 7:00 beside a yogurt breakfast at 7:30 is only
  // worth knowing while there is still time to move one of them. Home
  // already lists the dose, so the sentence goes on the row that is
  // already there rather than into a section of its own.
  //
  // Its own pass, after the dashboard, for the reason set out where
  // doseFoodNotes is declared. Only the two notes that are about today
  // reach Home: a clash, and a dose with nothing near it to absorb with.
  // What is already fine, and what could not be checked, stay on the lens,
  // where there is room to say why.
  const doseIdsToday = useMemo(
    () =>
      (data?.todaysReminders ?? [])
        .filter((reminder) => reminder.itemType !== 'appointment')
        .map((reminder) => reminder.id)
        .join(','),
    [data?.todaysReminders],
  );

  useEffect(() => {
    if (doseIdsToday.length === 0) {
      setDoseFoodNotes({});
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const day = await getDayMealAndDoseTimeline(todayDateString());
        if (cancelled) return;
        const entries = buildDayTimeline(day.meals, day.doses, day.rules, day.timings, day.nutrientNames);
        const byDose: Record<string, DoseFoodNote> = {};
        for (const entry of entries) {
          if (entry.kind !== 'dose') continue;
          // doseFoodNotes already orders clash before missing, so the first
          // one that qualifies is the one worth the single line a row has.
          const note = entry.notes.find((candidate) => candidate.kind === 'clash' || candidate.kind === 'missing');
          if (note) byDose[entry.dose.id] = note;
        }
        setDoseFoodNotes(byDose);
      } catch (error) {
        // A row without the sentence is the same row Home shipped with, so
        // a failure here leaves the band working rather than blank.
        console.warn('dose food notes failed', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doseIdsToday]);


  // --- Today's Check-In (2026-08-08) -------------------------------------
  //
  // "On the home page they need to have the ability to select how they
  // feel today, just a one question thing... the list to choose from...
  // might need to be quite extensive." Reuses lib/checkinTags.ts's own
  // already-extensive, categorized vocabulary (30 tags across 7 categories,
  // covering both symptoms and positives) and the existing
  // wellbeing_checkins table (via recordCheckin, checkinType 'general')
  // rather than building either from scratch -- this is genuinely "one
  // question" (which of these describes today), just with a rich set of
  // real answers to pick from, the same tags Signals' own flare/reaction
  // logging already uses, so a pattern noticed there and here is the same
  // real tag, not two different vocabularies describing the same thing.

  function openFeelingPicker() {
    // Seeds from today's already-saved entry (if any) so reopening this to
    // add/remove a tag -- not just create one from nothing -- keeps
    // whatever's already there instead of starting blank.
    setSelectedFeelingTags(data?.feelingCheckin?.tags ?? []);
    setFeelingPickerOpen(true);
  }

  function toggleFeelingTag(code: string) {
    setSelectedFeelingTags((current) =>
      current.includes(code) ? current.filter((tag) => tag !== code) : [...current, code],
    );
  }

  // No separate valence question -- asking a second question would break
  // the "just a one question thing" this was explicitly asked to be.
  // Derived instead from the real usualValence of whatever got picked: all
  // positive -> positive, all negative -> negative, a genuine mix (or
  // nothing selected) -> neutral, the same "informational, not inherently
  // good or bad" reading the schema's own comment already gives a
  // checkin with no single clear direction.
  function derivedValenceFor(tags: string[]): CheckinValence {
    if (tags.length === 0) return 'neutral';
    const definitions = getCheckinTagsByCategory()
      .flatMap((group) => group.tags)
      .filter((tag) => tags.includes(tag.code));
    const allPositive = definitions.every((tag) => tag.usualValence === 'positive');
    const allNegative = definitions.every((tag) => tag.usualValence === 'negative');
    if (allPositive) return 'positive';
    if (allNegative) return 'negative';
    return 'neutral';
  }

  async function saveFeelingCheckin() {
    setFeelingSaving(true);
    try {
      await recordCheckin({
        loggedAt: new Date().toISOString(),
        checkinType: 'general',
        valence: derivedValenceFor(selectedFeelingTags),
        tags: selectedFeelingTags,
      });
      setFeelingPickerOpen(false);
      await load();
    } finally {
      setFeelingSaving(false);
    }
  }

  async function handleSkipFromArc(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    setSelectedItem(null);
    load();
  }

  function handleLogNowFromArc(item: ScheduleItemRecord) {
    setSelectedItem(null);
    router.push({
      pathname: '/food',
      params: {
        scheduleItemId: item.id,
        mealType: item.mealType ?? '',
        title: item.title,
        favoriteId: item.sourceFavoriteId ?? '',
        templateMealId: item.sourceMealId ?? '',
      },
    });
  }

  function closeQuickLogModal() {
    setQuickLogModal(null);
    setBpSystolic('');
    setBpDiastolic('');
    setBpBpm('');
    setExerciseType('');
    setExerciseDuration('');
    setExerciseIntensity(null);
  }

  // Both of these are the "right now" fast path -- no date/time picking,
  // unlike the fuller Exercise/Blood Pressure sections in Signals's
  // Other lens, which exist for backdated or more careful entry. Same
  // underlying lib/db.ts functions either way, just a shorter form here.
  async function handleSaveBP() {
    const sys = Number(bpSystolic);
    const dia = Number(bpDiastolic);
    if (!Number.isFinite(sys) || !Number.isFinite(dia) || sys <= 0 || dia <= 0) {
      showInfoAlert('Almost there', 'Enter both a systolic and diastolic number.');
      return;
    }
    const loggedAt = `${todayDateString()}T${nowTimeString24()}`;
    await recordBodyMeasurement({ loggedAt, measurementType: 'blood_pressure_systolic', value: sys, unit: 'mmHg' });
    await recordBodyMeasurement({ loggedAt, measurementType: 'blood_pressure_diastolic', value: dia, unit: 'mmHg' });
    const heartRate = Number(bpBpm);
    if (Number.isFinite(heartRate) && heartRate > 0) {
      await recordBodyMeasurement({ loggedAt, measurementType: 'heart_rate_bpm', value: heartRate, unit: 'bpm' });
    }
    closeQuickLogModal();
  }

  async function handleSaveExercise() {
    if (!exerciseType.trim()) {
      showInfoAlert('Almost there', 'Enter what kind of activity this was.');
      return;
    }
    const loggedAt = `${todayDateString()}T${nowTimeString24()}`;
    const minutes = Number(exerciseDuration);
    await recordExercise({
      loggedAt,
      exerciseType,
      durationMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      intensity: exerciseIntensity ?? undefined,
    });
    closeQuickLogModal();
  }

  const upNext = data ? findUpNext(data.scheduledToday) : null;
  const mealsLoggedToday = data?.todaysMeals.length ?? 0;
  const nutrientFlagCount = data ? findNutrientGaps(data.nutrientEntries).length + findExcessRisks(data.nutrientEntries).length : 0;
  const sixDsFlagCount = data?.sixDsFlagCount ?? 0;
  const worthALookCount = nutrientFlagCount + sixDsFlagCount;

  // 2026-08-29, direct report: this tile "goes to the Insights screen with
  // nothing else selected. A person who taps that will never know where
  // they are supposed to look for the thing that is worth a look."
  // Correct: it navigated to a bare /insights, which always resets to the
  // lens picker, so the number it just showed led nowhere.
  //
  // The count is genuinely two different things added together, which is
  // why one fixed destination could never be right for it: nutrientFlagCount
  // is today's nutrient gaps and excess risks (the Nutrients lens), and
  // sixDsFlagCount is flagged sub-criteria for the person's own tracked
  // conditions (the Condition Scores lens). So the tap resolves against
  // whichever the number is actually made of, and only asks when both
  // genuinely contributed -- naming each count in the choice, so the
  // question answers itself rather than being one more thing to guess at.
  function handleWorthALookPress() {
    if (nutrientFlagCount > 0 && sixDsFlagCount > 0) {
      setWorthALookChoiceOpen(true);
      return;
    }
    if (sixDsFlagCount > 0) {
      router.navigate({ pathname: '/insights', params: { openInsightsLens: 'sixDs' } });
      return;
    }
    // Nothing flagged at all still lands on Nutrients rather than the bare
    // picker: it is the lens this number is mostly built from, and seeing
    // the day's numbers with nothing flagged is a real answer to "why is
    // this zero," not a dead end.
    router.navigate({ pathname: '/insights', params: { openInsightsLens: 'nutrients' } });
  }
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  // 2026-08-29, direct request: this banner "should only be there at all
  // if they have set a preference telling the app that they have a
  // condition" -- so no tracked condition means no reminder at all,
  // rather than prompting someone who never told the app they have
  // anything to track. The cadence itself is the person's own choice now,
  // falling back to the long-standing 30-day default when unset.
  const checkinIntervalDays = data?.checkinReminderDays ?? ASSESSMENT_DUE_AFTER_DAYS;
  const assessmentDue =
    data && userConditionCodes.length > 0
      ? data.daysSinceAssessment === null || data.daysSinceAssessment >= checkinIntervalDays
      : false;

  const coreNutrientRings = data
    ? CORE_NUTRIENT_CODES.map((code) => data.nutrientEntries.find((entry) => entry.nutrientCode === code)).filter(
        (entry): entry is NutrientGapEntry => entry != null,
      )
    : [];
  // Named in the gauges card only when there is genuinely something over a
  // published upper limit, so the warning stays rare enough to mean
  // something. See nutrientRingColors above for why 'excess_risk' is the
  // right signal and "over 100%" is not.
  const overLimitNutrients = coreNutrientRings.filter((entry) => entry.status === 'excess_risk');

  // Recomputed only when the person's own condition scope actually
  // changes (Profile's two condition pickers), not on every render --
  // filtering ALL_DIGEST_ENTRIES (1,500+ entries) is real, non-trivial
  // work worth memoizing, the same lesson Basic Health's own perf fix
  // already taught this app (see CLAUDE.md's 2026-08-23 entry on that).
  const flipCardGroups = useMemo(
    () => digestFlipCardGroups(userConditionCodes, curiousAboutConditionCodes),
    [userConditionCodes, curiousAboutConditionCodes],
  );

  // One card per group, each holding a random entry from its own group.
  //
  // The cards run alphabetically by their category's name, left to right,
  // 2026-09-19: "Have the cards in Digest be in alphabetical order, left to
  // right. It actually is also grouping them by the tab they represent that
  // way, too." (Every condition, Earth Matters and Health Literacy live on
  // Life, Horticulture on Garden, Recipes on Food, and the alphabet happens
  // to keep each tab's cards together.) The shelf used to be shuffled once
  // per app open, so where a card sat changed every time.
  //
  // The entry each card shows is still random, and seeded rather than
  // Math.random() at render time, for the same reason the daily shuffle
  // this replaced was: an unseeded pick would land on a different entry on
  // every single re-render, so a card would change under someone the moment
  // anything else on Home updated. Each card's entry is seeded by its own
  // group plus the rotation counter, so a card only moves when 15 minutes
  // have genuinely passed.
  const visibleFlipCards = useMemo(() => {
    const ordered = flipCardGroups
      .map((group, groupIndex) => ({ group, groupIndex, label: DIGEST_CATEGORY_LABEL_BY_KEY[group.category] ?? '' }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return ordered.map(({ group, groupIndex }) => {
      const random = mulberry32(flipCardSeed + flipCardRotation * 7919 + groupIndex * 104729);
      const entry = group.entries[Math.floor(random() * group.entries.length)];
      // Keyed by group as well as entry: two groups could in principle surface
      // the same entry id, and a duplicate React key would drop a card.
      return { ...entry, groupKey: group.category };
    });
  }, [flipCardGroups, flipCardSeed, flipCardRotation]);

  // Moon phase + the next equinox/solstice countdown: pure, synchronous,
  // offline math (lib/celestialEvents.ts) -- always available, computed
  // fresh on every render the same cheap way dailyFlipCardOrder etc.
  // already are above, no loading state needed. Everything else in the sky
  // row below (sunrise/sunset/UV/heat-freeze/AQI/pollen) depends on
  // skyResult, which does need a real fetch -- see loadSkyData above.
  const moonPhase = getMoonPhase();
  const upcomingSeasonalMarker = getUpcomingSeasonalMarker();
  const skyReady = skyResult?.status === 'ready' ? skyResult : null;
  const topPollenReading = skyReady?.data.pollen[0] ?? null;

  // One flat, ordered array feeding the two-column grid above -- the real
  // order here (Moon, Sunrise, Equinox, Sunset, High, Humidity, Low, UV,
  // AQI, Pollen) is exactly the left/right pairing approved directly
  // ("Moon | Sunrise", "Equinox | Sunset", "High | Humidity", "Low | UV").
  // A fullWidth item (the no-location prompt, a fetch-error message) always
  // starts a fresh row on its own via flexWrap, which is the wanted effect
  // for a message that isn't a short paired fact.
  type SkyGridEntry = {
    emoji: string;
    label: string;
    tone?: SkyChipTone;
    fullWidth?: boolean;
    onPress?: () => void;
  };
  const skyGridItems: SkyGridEntry[] = [{ emoji: moonPhase.emoji, label: moonPhase.name }];
  if (skyReady?.data.sunrise) {
    skyGridItems.push({ emoji: '🌅', label: `Sunrise ${skyTimeLabel(skyReady.data.sunrise)}` });
  }
  skyGridItems.push({
    emoji: upcomingSeasonalMarker.emoji,
    label: `${upcomingSeasonalMarker.shortName} in ${upcomingSeasonalMarker.daysUntil}d`,
  });
  if (skyReady?.data.sunset) {
    skyGridItems.push({ emoji: '🌇', label: `Sunset ${skyTimeLabel(skyReady.data.sunset)}` });
  }
  if (skyResult?.status === 'no-location') {
    skyGridItems.push({
      emoji: '📍',
      label: 'Set your location for sunrise, weather & UV →',
      fullWidth: true,
      onPress: () => router.push({ pathname: '/garden', params: { openGardenLens: 'myZone' } }),
    });
  }
  if (skyReady?.data.tempMax != null) {
    skyGridItems.push({
      emoji: isForecastVeryHot(skyReady.data) ? '🥵' : '🌡️',
      label: `High ${Math.round(skyReady.data.tempMax)}°${skyReady.data.tempUnit}`,
      tone: isForecastVeryHot(skyReady.data) ? 'bad' : undefined,
    });
  }
  if (skyReady?.data.humidityMean != null) {
    skyGridItems.push({ emoji: '💧', label: `Humidity ${Math.round(skyReady.data.humidityMean)}%` });
  }
  if (skyReady?.data.tempMin != null) {
    skyGridItems.push({
      emoji: isForecastFreezing(skyReady.data) ? '🥶' : '🌡️',
      label: `Low ${Math.round(skyReady.data.tempMin)}°${skyReady.data.tempUnit}`,
      tone: isForecastFreezing(skyReady.data) ? 'cold' : undefined,
    });
  }
  if (skyReady?.data.uvIndexMax != null) {
    skyGridItems.push({
      emoji: '☀️',
      label: `UV ${skyReady.data.uvIndexMax}`,
      tone: uvChipTone(uvBandForIndex(skyReady.data.uvIndexMax)),
    });
  }
  if (skyReady?.data.usAqi != null) {
    skyGridItems.push({
      emoji: '🌬️',
      label: `AQI ${skyReady.data.usAqi}`,
      tone: aqiChipTone(aqiBandForIndex(skyReady.data.usAqi)),
    });
  }
  if (topPollenReading) {
    skyGridItems.push({
      emoji: '🌾',
      label: `${topPollenReading.label} pollen ${topPollenReading.grainsPerCubicMeter}/m³`,
    });
  }
  if (skyResult?.status === 'error') {
    skyGridItems.push({ emoji: '⚠️', label: skyResult.message, tone: 'moderate', fullWidth: true });
  }

  // Today, since 1.0.39.10. The greeting, the affirmation, the date and
  // the sky, as a band in the Home group rather than a card of its own.
  //
  // Not called Welcome any more. Direct note: "I'm not sure Welcome is the
  // right thing to call it, based on all of the info that it contains." It
  // carries the moon phase, the next equinox or solstice, sunrise and
  // sunset, the high and the low, humidity, UV, air quality and pollen.
  // None of that is a welcome, and all of it is today. Your Day was already
  // taken by the schedule section further down, so Today it is.
  //
  // The badge-plus-text row is gone with the badge: the sprout is the
  // band's own glyph now, drawn where every other section draws its icon,
  // so the text starts at the left edge like the rest of the page.
  function renderToday() {
    if (!isHomeSectionVisible(visualPrefs, 'today')) return null;
    return renderBand(
      'today',
      'Today',
      <>
        <Text style={styles.greetingText}>
          {timeGreeting()}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.affirmationText}>{pickAffirmation()}</Text>
        <Text style={styles.dateText}>{todayLabel}</Text>

        {isHomeSectionVisible(visualPrefs, 'weather') ? (
          <View style={styles.skyGrid}>
            {skyGridItems.map((item, index) => (
              <SkyGridItem key={index} {...item} />
            ))}
          </View>
        ) : null}
      </>,
      { renderIcon: renderGreetingSeedGlyph },
    );
  }

  // The sprouting seed, 2026-08-23 direct request: "make sure the sprouting
  // seed default TabHub button continues to be used... Make it have that as
  // a small version of it on the top left corner of the card." Same asset
  // the TabHub button's own default icon already uses
  // (assets/branding/seed-tall-transparent.png), not a new icon drawn for
  // this.
  //
  // It was a button with two behaviours until 1.0.39.10 (collapse from a
  // full card, expand from the collapsed square) and a 50% look for the
  // second one. Neither survives: there is no collapsed square any more,
  // and the band's own chevron is what folds the card, so a second control
  // doing nearly the same thing would be one too many. What is left is a
  // glyph, drawn wherever the band asks for it and at whatever size it
  // asks for.
  //
  // The art is 32 wide by 38 tall, so the size it is given is its height
  // and the width follows, rather than squashing the sprout into a square.
  function renderGreetingSeedGlyph(size: number) {
    return (
      <Image
        source={require('../../assets/branding/seed-tall-transparent.png')}
        style={{ width: Math.round((size * 32) / 38), height: size }}
        resizeMode="contain"
      />
    );
  }

  // 2026-08-23, direct request: "they should be able to move the things
  // on the home screen they have chosen to be there into any order they
  // want to from top to bottom, except the welcome box." The exception is
  // gone as of 1.0.39.10: the welcome box is the Today section now, and it
  // moves and folds like everything else here. Every
  // reorderable section's own exact JSX, unchanged from before this
  // change, just pulled into its own function so the render below can
  // pick each one up in whatever order Profile's own Order list saved,
  // rather than a fixed sequence hardcoded into the JSX itself.
  // digestCards used to render as its own separate block, always, right
  // after this whole loading-gated group rather than inside it (its own
  // data, visibleFlipCards, doesn't depend on `loading` at all) -- folded
  // in here too now, since once every section can land anywhere in the
  // order, one section skipping the same loading gate every other one
  // respects would leave a real, confusing gap in the middle of the
  // sequence while the rest are still waiting to appear.

  // 2026-08-08, explicitly requested: the periodic symptom check-in
  // (app/assessment.tsx) "need[s] to automatically pop up every 30
  // days" -- this is that pop-up. A rolling cadence (see
  // ASSESSMENT_DUE_AFTER_DAYS's own comment above), not a
  // calendar-anchored one.
  // Shown until the shared folder exists, then gone for good. See the top of
  // lib/oneDriveFolders.ts for what that folder is and what the app keeps in
  // it.
  // 2026-09-12: every section folds to one row and opens on tap (see
  // components/HomeSectionBand.tsx for the request and the look). The
  // open/closed state is a visual preference rather than component state,
  // so it survives leaving Home and relaunching: a person who always wants
  // Your Day open should not have to open it every morning.
  function toggleHomeSection(key: HomeSectionKey) {
    void setVisualPreferences({ homeSectionExpanded: { [key]: !isHomeSectionExpanded(visualPrefs, key) } });
  }

  // Scrolls to a card on Home, opening its tab's group first: jumping to a
  // folded group would land on a closed row and look like nothing happened
  // (2026-09-16). Shared by the corner menu and by Your Story since
  // 2026-09-24, which also opens the card itself, because an item saying
  // "go there" should land on the thing rather than on its name.
  function revealHomeSection(key: HomeSectionKey, openCard = false) {
    const tabPath = HOME_SECTION_TAB_PATH[key];
    if (tabPath) {
      const foldKey = `${HOME_TAB_GROUP_BAND_KEY_PREFIX}${tabPath}`;
      if (!tabGroupFolds.isOpen(foldKey)) tabGroupFolds.toggle(foldKey);
    }
    if (openCard && !isHomeSectionExpanded(visualPrefs, key)) {
      void setVisualPreferences({ homeSectionExpanded: { [key]: true } });
    }
    // Falls back to the top rather than doing nothing if the section has
    // not been measured yet, which can only happen if it is off-screen and
    // has never been laid out. A frame's wait lets a group just opened lay
    // its cards out first.
    requestAnimationFrame(() => {
      const y = sectionOffsets.current[key];
      scrollRef.current?.scrollTo({ y: y != null ? Math.max(0, y - 12) : 0, animated: true });
    });
  }

  // Where a Your Story item that lives on Home goes. A card somebody has
  // turned off cannot be scrolled to, so the check-in falls back to
  // Signals, where the same check-in is kept.
  function goToHomeDestination(destination: Extract<StoryDestination, { kind: 'home' | 'quickLog' }>) {
    if (destination.kind === 'quickLog') {
      setQuickLogModal(destination.form);
      return;
    }
    const key = destination.section as HomeSectionKey;
    if (!(key in HOME_SECTION_LABELS) || !isHomeSectionVisible(visualPrefs, key)) {
      router.push('/log' as Href);
      return;
    }
    revealHomeSection(key, true);
  }

  // One band per section. Colour and icon come from the tab the section is
  // a window into (lib/homeSections.ts, the same mapping that groups them),
  // looked up in TAB_ROUTES so they can never drift from the tab's own.
  // The overrides exist for the one section that belongs to no tab.
  function renderBand(
    key: HomeSectionKey,
    title: string,
    children: ReactNode,
    options?: {
      icon?: ComponentProps<typeof Ionicons>['name'];
      // A drawn glyph instead of the Ionicons one, for the one section whose
      // mark is a picture (Today's sprouting seed).
      renderIcon?: (size: number, color: string) => ReactNode;
      color?: string;
      contentStyle?: StyleProp<ViewStyle>;
      // One line under the title while the band is folded (Your Story).
      foldedCaption?: string;
    },
  ) {
    const identity = homeGroupIdentity(HOME_SECTION_TAB_PATH[key]);
    return (
      <HomeSectionBand
        title={title}
        icon={options?.icon ?? identity?.icon ?? 'ellipse-outline'}
        renderIcon={options?.renderIcon}
        color={options?.color ?? identity?.color ?? colors.primary}
        textColor={options?.color ?? identity?.textColor}
        expanded={isHomeSectionExpanded(visualPrefs, key)}
        onToggle={() => toggleHomeSection(key)}
        onLongPress={() => beginArranging(key)}
        contentStyle={options?.contentStyle}
        foldedCaption={options?.foldedCaption}
      >
        {children}
      </HomeSectionBand>
    );
  }

  // Belongs to no tab (backups and partners, not one screen's data), so it
  // keeps colors.primary and its own cloud icon rather than borrowing a
  // tab's. The nudge itself is the row's name, so folded it still nudges.
  function renderSharedFolderSetup() {
    if (!homeSectionHasContent('sharedFolderSetup') || !isHomeSectionVisible(visualPrefs, 'sharedFolderSetup')) {
      return null;
    }
    return renderBand(
      'sharedFolderSetup',
      'Set up your shared folder',
      <View style={styles.bandBody}>
        <Text style={styles.bandCaption}>
          One folder in OneDrive for your backups, and for anything you and a partner send each other. Worth
          doing now, before there is anything to lose.
        </Text>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: colors.primary }]}
          onPress={() => router.push('/onedrive-folder')}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-outline" size={18} color={colors.primary} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: colors.primary }]}>Choose the folder</Text>
        </TouchableOpacity>
      </View>,
      { icon: 'cloud-outline', color: colors.primary },
    );
  }

  // Signals' own colour, matching the corner menu's own choice for this
  // entry, since the assessment is Signals' data even though it opens as a
  // standalone screen.
  //
  // Always on Home since 2026-09-12, not only when due: the old Quick
  // Actions row carried the always-available "Symptom check-in" button and
  // that row is gone, so this section is now the one place for both. The
  // row's name says when one is due; the caption inside says why.
  function renderSymptomCheckinReminder() {
    if (!isHomeSectionVisible(visualPrefs, 'symptomCheckinReminder')) return null;
    const signalsColor = tabColorFor('/log');
    const days = data?.daysSinceAssessment ?? null;
    return renderBand(
      'symptomCheckinReminder',
      assessmentDue ? 'Symptom Check-In, due now' : 'Symptom Check-In',
      <View style={styles.bandBody}>
        <Text style={styles.bandCaption}>
          {days == null
            ? 'The full check-in, 30 questions across three areas. A few minutes now becomes a baseline to compare against next time.'
            : assessmentDue
              ? `It's been ${days} days since your last one. Retaking it is what turns today into a trend.`
              : `Last taken ${days} ${days === 1 ? 'day' : 'days'} ago. It comes around every 30 days, and can be retaken any time.`}
        </Text>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: signalsColor }]}
          onPress={() => router.push('/assessment')}
          activeOpacity={0.8}
        >
          <Ionicons name="pulse-outline" size={18} color={signalsColor} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: signalsColor }]}>Start the check-in</Text>
        </TouchableOpacity>
      </View>,
    );
  }

  // Today's Check-In -- 2026-08-08, explicitly requested: "on the home
  // page they need to have the ability to select how they feel today,
  // just a one question thing... the list to choose from... might need
  // to be quite extensive." Reuses lib/checkinTags.ts's own
  // already-extensive, categorized vocabulary and the existing
  // wellbeing_checkins table (checkinType 'general') -- see the handlers
  // above (openFeelingPicker/toggleFeelingTag/saveFeelingCheckin) for the
  // full reasoning, including how valence is derived rather than asked
  // as its own separate question.
  function renderTodaysCheckin() {
    if (!isHomeSectionVisible(visualPrefs, 'todaysCheckin')) return null;
    return renderBand(
      'todaysCheckin',
      "Today's Check-In",
      <>
        {feelingPickerOpen ? (
          <>
            <Text style={[styles.feelingPrompt, { color: tabColorFor('/log') }]}>
              How are you feeling today? Pick everything that applies.
            </Text>
            {getCheckinTagsByCategory().map((group) => (
              <View key={group.category} style={styles.feelingCategoryBlock}>
                <Text style={styles.feelingCategoryLabel}>{group.label}</Text>
                <View style={styles.feelingTagRow}>
                  {group.tags.map((tag) => {
                    const active = selectedFeelingTags.includes(tag.code);
                    return (
                      <TouchableOpacity
                        key={tag.code}
                        style={[
                          styles.feelingTagChip,
                          active && { backgroundColor: tabColorFor('/log'), borderColor: tabColorFor('/log') },
                        ]}
                        onPress={() => toggleFeelingTag(tag.code)}
                      >
                        <Text style={[styles.feelingTagText, active && styles.feelingTagTextActive]}>{tag.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={styles.feelingActionsRow}>
              <TouchableOpacity style={styles.feelingCancelButton} onPress={() => setFeelingPickerOpen(false)}>
                <Text style={styles.feelingCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.feelingSaveButton,
                  { backgroundColor: tabColorFor('/log') },
                  selectedFeelingTags.length === 0 && styles.feelingSaveButtonDisabled,
                ]}
                onPress={saveFeelingCheckin}
                disabled={selectedFeelingTags.length === 0 || feelingSaving}
              >
                <Text style={styles.feelingSaveButtonText}>{feelingSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : data?.feelingCheckin ? (
          <TouchableOpacity onPress={openFeelingPicker} activeOpacity={0.75}>
            <Text style={[styles.feelingLoggedText, { color: tabColorFor('/log') }]}>
              {data.feelingCheckin.tags.length > 0
                ? data.feelingCheckin.tags.map((code) => getCheckinTagDefinition(code)?.label ?? code).join(', ')
                : 'Logged for today, no specific tags'}
            </Text>
            <Text style={styles.feelingChangeLink}>Tap to update</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.feelingStartButton, { borderColor: tabColorFor('/log') }]}
            onPress={openFeelingPicker}
            activeOpacity={0.85}
          >
            <Text style={[styles.feelingStartButtonText, { color: tabColorFor('/log') }]}>Log how you feel today</Text>
          </TouchableOpacity>
        )}
      </>,
    );
  }

  function renderYourDay() {
    if (!isHomeSectionVisible(visualPrefs, 'yourDay')) return null;
    return renderBand(
      'yourDay',
      'Your Day',
      <>
        <DayArc items={data?.scheduledToday ?? []} onPressItem={setSelectedItem} labelColor={tabColorFor('/schedule')} />
        <Text style={[styles.arcCaption, { color: tabColorFor('/schedule') }]}>
          {upNext
            ? upNext.isPast
              ? `${upNext.item.title} was due ${formatTime12(upNext.item.scheduledFor.slice(11, 16))}: anything to log?`
              : `Next: ${upNext.item.title} at ${formatTime12(upNext.item.scheduledFor.slice(11, 16))}`
            : 'Nothing scheduled yet today.'}
        </Text>
      </>,
      { contentStyle: styles.bandContentCentered },
    );
  }

  // 2026-09-16, direct report after a day of dose reminders arrived: there
  // is "no quick access on the Home screen for reminders for the day to see
  // what they say. I saw the reminders but I didn’t realize I needed to pay
  // closer attention yet." A notification is gone the second it is swiped,
  // and Your Day above could not stand in for it: that arc is meals and only
  // meals (listScheduledMealsForDate). So nothing on Home carried a dose at
  // all, and the one place the wording survived was the Meds lens, three taps
  // away and only if you knew to look there.
  //
  // Every status shows, not just what is still pending, because "did I take
  // it?" is most of why someone comes back here. A dose already taken answers
  // that; hiding it would leave the same blank that caused the report.
  //
  // A row opens the lens where that kind of thing is acted on, the same
  // destination a tapped notification lands on (resolveReminderTap in
  // lib/reminderNotifications.ts). Marking a dose taken stays in the Meds
  // lens rather than being duplicated here.
  //
  // 2026-09-23: the band widened to everything else that carries a date.
  // Bills, upkeep, benefits, Days Until counters and a compost pile due a
  // turn all reach the phone as notifications and none of them had anywhere
  // on Home, so "what is today asking of me" was answerable only for the
  // two kinds that live on a schedule. They come after the timed rows,
  // which keeps the clock reading down the left edge, and they are ordered
  // with whatever is furthest past its day at the top. The same pass put
  // the meal-timing sentence on the dose rows; see doseFoodNotes above.
  function renderTodaysReminders() {
    if (!isHomeSectionVisible(visualPrefs, 'todaysReminders')) return null;
    const reminders = data?.todaysReminders ?? [];
    const dated = data?.datedToday ?? [];
    const nowKey = `${todayDateString()}T${nowTimeString24()}`;
    return renderBand(
      'todaysReminders',
      "Today's Reminders",
      <View style={styles.bandBody}>
        {reminders.length === 0 && dated.length === 0 ? (
          <Text style={styles.bandCaption}>Nothing on today’s schedule, and nothing else due.</Text>
        ) : null}
        {reminders.map((reminder) => {
          const isAppointment = reminder.itemType === 'appointment';
          const detail = isAppointment
            ? [reminder.location, reminder.providerName ? `with ${reminder.providerName}` : null]
                .filter(Boolean)
                .join(', ')
            : describeReminderDose(reminder);
          const state = describeReminderState(reminder, nowKey);
          const foodNote = isAppointment ? undefined : doseFoodNotes[reminder.id];
          return (
            <TouchableOpacity
              key={reminder.id}
              style={styles.reminderRow}
              activeOpacity={0.8}
              onPress={() =>
                router.navigate({
                  pathname: '/schedule',
                  // A dose with something to say about the meals around it
                  // opens the day itself, where the meal and the dose sit
                  // in one list and either can be moved. Every other row
                  // keeps opening the lens it is acted on from.
                  params: {
                    openScheduleLens: isAppointment ? 'appointments' : foodNote ? 'todaysMeals' : 'meds',
                  },
                })
              }
            >
              <Text style={styles.reminderTime}>{formatTime12(reminder.scheduledFor.slice(11, 16))}</Text>
              <View style={styles.reminderBody}>
                <Text style={styles.reminderTitle} numberOfLines={1}>
                  {reminder.title}
                </Text>
                {detail ? (
                  <Text style={styles.reminderDetail} numberOfLines={1}>
                    {detail}
                  </Text>
                ) : null}
                {foodNote ? (
                  <Text style={styles.reminderFoodNote} numberOfLines={2}>
                    {foodNote.headline}
                  </Text>
                ) : null}
              </View>
              {state ? (
                <Text style={[styles.reminderState, { color: state.color }]}>{state.label}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
        {dated.map(({ source, lead }) => {
          const prefix = DATED_KIND_PREFIX[source.kind];
          const detail = [describeDatedDue(source.kind, lead), source.detail].filter(Boolean).join('. ');
          return (
            <TouchableOpacity
              key={`${source.kind}:${source.sourceId}`}
              style={styles.reminderRow}
              activeOpacity={0.8}
              onPress={() =>
                source.tab === 'garden'
                  ? router.push({ pathname: '/garden', params: { openGardenLens: source.lens } })
                  : router.push({ pathname: '/life', params: { openLifeLens: source.lens } })
              }
            >
              <Text style={styles.reminderTime} numberOfLines={1}>
                {datedDayLabel(lead)}
              </Text>
              <View style={styles.reminderBody}>
                <Text style={styles.reminderTitle} numberOfLines={1}>
                  {prefix ? `${prefix}: ${source.title}` : source.title}
                </Text>
                <Text style={styles.reminderDetail} numberOfLines={2}>
                  {detail}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>,
    );
  }

  // The two stat tiles, each its own row since 2026-09-12 ("Separate the
  // Meals & Worth a Look the same way"). A count is the whole point of
  // each, so it sits on the row itself rather than behind a fold.
  //
  // Meals logged today opens Schedule's Today's Meals lens: the whole day
  // in time order, each meal openable to its ingredients and steps. It
  // used to land on the My Foods menu, reported 2026-08-29 as leading
  // nowhere. Schedules' colour and icon, since that is where it goes.
  function renderMealsLoggedToday() {
    if (!isHomeSectionVisible(visualPrefs, 'mealsLoggedToday')) return null;
    return renderActionRow(
      'mealsLoggedToday',
      mealsLoggedToday === 1 ? 'Meal Logged Today' : 'Meals Logged Today',
      () => router.navigate({ pathname: '/schedule', params: { openScheduleLens: 'todaysMeals' } }),
      { value: String(mealsLoggedToday) },
    );
  }

  // A semantic warning colour on the count when there is something to
  // flag, taking priority over the tab's own colour there; a dash rather
  // than a zero before any meal is logged, since nothing has been checked
  // yet. See handleWorthALookPress for where the tap goes.
  function renderWorthALook() {
    if (!isHomeSectionVisible(visualPrefs, 'worthALook')) return null;
    return renderActionRow('worthALook', 'Worth a Look', handleWorthALookPress, {
      value: mealsLoggedToday === 0 ? '—' : String(worthALookCount),
      valueColor: worthALookCount > 0 ? colors.statusRedOnSurface : undefined,
    });
  }

  // The four rows that used to be the Quick Actions pill strip, 2026-09-12,
  // direct correction: "All things on the Home Screen are supposed to be
  // Quick Actions. It makes no sense to suggest that some are Quick Actions
  // and others are not. Separate the Quick Actions items into their own
  // entities and grouped appropriately." Each is an action row (see
  // HomeSectionBand's own comment): one row, tap does the thing, grouped
  // with the tab whose data it touches. Scan a Product is Food's, the same
  // reasoning the old pill carried; the other three all write to Signals.
  // "Log a meal" is not here: it was a shortcut to Food's Desktop, and the
  // Log a Meal section above already does that job properly.
  function renderActionRow(
    key: HomeSectionKey,
    title: string,
    onPress: () => void,
    options?: { value?: string; valueColor?: string },
  ) {
    if (!isHomeSectionVisible(visualPrefs, key)) return null;
    const identity = homeGroupIdentity(HOME_SECTION_TAB_PATH[key]);
    return (
      <HomeSectionBand
        kind="action"
        title={title}
        icon={identity?.icon ?? 'ellipse-outline'}
        color={identity?.color ?? colors.primary}
        textColor={identity?.textColor}
        onPress={onPress}
        onLongPress={() => beginArranging(key)}
        value={options?.value}
        valueColor={options?.valueColor}
      />
    );
  }

    function renderScanProduct() {
    return renderActionRow('scanProduct', 'Scan a Product', () =>
      router.push({ pathname: '/food', params: { openFoodLens: 'scanProduct' } }),
    );
  }

  function renderLogFlare() {
    return renderActionRow('logFlare', 'Log a Flare', () => router.navigate('/log'));
  }

  function renderLogBloodPressure() {
    return renderActionRow('logBloodPressure', 'Log Blood Pressure', () => setQuickLogModal('bp'));
  }

  function renderLogExercise() {
    return renderActionRow('logExercise', 'Log Exercise', () => setQuickLogModal('exercise'));
  }

    // "How You're Feeling" (Signals, a warm peach) used to always come
  // right before "Today's Fuel Gauges" (Insights, a cool teal-green) --
  // explicitly ordered that way, 2026-07-27, so the two Insights-colored
  // boxes (this one and the "Worth a look" stat tile) don't stack
  // directly on top of each other. That specific pairing is no longer
  // guaranteed once order is customizable, an honest, accepted tradeoff
  // of the reordering feature itself, not something silently lost.
  function renderHowYoureFeeling() {
    if (!isHomeSectionVisible(visualPrefs, 'howYoureFeeling')) return null;
    return renderBand(
      'howYoureFeeling',
      "How You're Feeling",
      <>
        {/* 2026-08-29, direct question: "What is the How You're Feeling
            card for exactly? What does it provide to the user?" A fair
            question the card never answered: it showed a coloured orb and
            a one-word severity with nothing saying where the reading came
            from or what to do about it. It is a glance at the worst flare
            or food reaction logged in Signals in the last two days, and
            its real job is to make an ongoing flare visible on the first
            screen rather than only inside Signals. Now it says so. */}
        <Text style={[styles.orbCaption, { color: tabColorFor('/log') }]}>
          The worst flare or food reaction you have logged in the last two days, so an ongoing one is visible
          without going looking for it. Tap to log one or see the full history.
        </Text>
        <EnergyOrb
          recentMaxSeverity={data?.recentMaxSeverity ?? null}
          hasAnyHistory={data?.hasAnyLogHistory ?? false}
          onPress={() => router.navigate('/log')}
          textColor={tabColorFor('/log')}
        />
      </>,
      { contentStyle: styles.bandContentCentered },
    );
  }

  function renderFuelGauges() {
    if (!isHomeSectionVisible(visualPrefs, 'fuelGauges')) return null;
    if (mealsLoggedToday === 0) {
      return renderBand(
        'fuelGauges',
        "Today's Fuel Gauges",
        <Text style={[styles.emptyText, { color: tabColorFor('/insights') }]}>Log a meal to see today’s fuel gauges fill in.</Text>,
      );
    }
    return renderBand(
      'fuelGauges',
      "Today's Fuel Gauges",
      <>
        {/* 2026-08-29, direct report: "needs to explain what the
            percentages represent. Is it so far today, or does it represent
            how much they will have all day." Confirmed by reading
            analyzeNutrientIntake: it is what has actually been logged so
            far, food and supplements together, against the whole day's
            target, so it climbs as the day goes on. Nothing is projected.
            2026-09-23: which of those two a reading came from is now drawn
            on the ring itself, so "together" is no longer the whole of
            what the card says. See the key line below the row. */}
        <Text style={[styles.fuelGaugesCaption, { color: tabColorFor('/insights') }]}>
          Percent of your whole day&apos;s target, from what you have logged so far today. These climb as you log
          more, so a low number early is normal.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
          {coreNutrientRings.map((entry) => {
            const ringColors = nutrientRingColors(entry);
            // Null unless a supplement actually contributed to this one,
            // which is most of them on most days, and those rings are
            // drawn exactly as they always were.
            const split = nutrientSourceSplit(entry);
            return (
              <TouchableOpacity
                key={entry.nutrientCode}
                onPress={() => router.navigate({ pathname: '/insights', params: { openInsightsLens: 'nutrients' } })}
                activeOpacity={0.75}
              >
                <ProgressRing
                  percent={entry.percentOfTarget}
                  color={ringColors.from}
                  gradientTo={ringColors.to}
                  supplementPercent={split ? split.supplementShare * 100 : 0}
                  label={entry.displayName}
                  sublabel={`${Math.round(entry.percentOfTarget)}%`}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Only when one of the rings on screen actually carries a
            supplement stretch. A key for a colour nothing is drawn in
            would be a line to read past every day. */}
        {coreNutrientRings.some((entry) => nutrientSourceSplit(entry) != null) ? (
          <Text style={styles.fuelGaugesSourceKey}>
            Where a ring ends in amber, that stretch came from a supplement rather than from food. Tap through for
            the amounts.
          </Text>
        ) : null}
        {overLimitNutrients.length > 0 ? (
          <Text style={styles.fuelGaugesOverLimit}>
            {`Over a safe upper limit today: ${overLimitNutrients.map((entry) => entry.displayName).join(', ')}. Tap through for the detail.`}
          </Text>
        ) : null}
      </>,
    );
  }

  function renderWeekTrend() {
    if (!homeSectionHasContent('weekTrend') || !isHomeSectionVisible(visualPrefs, 'weekTrend')) return null;
    // The line above already settled this. TypeScript narrows from the
    // value itself, though, not from a function that went and read it,
    // so the rest of this card needs to be told again.
    if (!weekTrend) return null;
    return renderBand(
      'weekTrend',
      "This Week's Trend",
      <TouchableOpacity
        // Opens the list of the flags themselves, 2026-09-12. It went to a
        // bare /trends first (nothing selected), then to the Condition
        // Scores chart over the same week, and the report on that was the
        // one that settled it: "A graph really doesn't seem to be the right
        // way to go here, and if 24 were reported, there should be 24 to
        // see." app/week-flags.tsx is the 24, one row each.
        onPress={() => router.push('/week-flags')}
        activeOpacity={0.75}
      >
        <Text style={[styles.trendNumber, { color: tabColorFor('/trends') }]}>
          {weekTrend.thisWeekCount} {weekTrend.thisWeekCount === 1 ? 'flag' : 'flags'} this week
        </Text>
        {weekTrend.lastWeekCount != null ? (
          <Text style={[styles.trendDelta, { color: weekTrendColor(weekTrendDirection(weekTrend)) }]}>
            {weekTrendLabel(weekTrendDirection(weekTrend))} from {weekTrend.lastWeekCount} last week
          </Text>
        ) : (
          <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>Keep logging to compare against last week.</Text>
        )}
        {weekTrend.otherCount > 0 ? (
          <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>
            {`${weekTrend.otherCount} more flagged, not tied to a condition you track.`}
          </Text>
        ) : null}
        <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>Tap to see each one →</Text>
      </TouchableOpacity>,
    );
  }

  // The other half of what Trends knows about a week, 2026-09-23.
  // weekTrend counts what got flagged; this counts how wide the eating
  // was, which is the question this app is centrally for. The sentence
  // and the suggestion both come from lib/eatingVariety.ts, including
  // the wording for a week with nothing logged yet, so nothing here has
  // to decide what a missing week means.
  function renderVarietyThisWeek() {
    if (!isHomeSectionVisible(visualPrefs, 'varietyThisWeek')) return null;
    if (!data) return null;
    const variety = data.variety;
    return renderBand(
      'varietyThisWeek',
      'Variety This Week',
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/trends', params: { openTrendsLens: 'variety' } })}
        activeOpacity={0.75}
      >
        <Text style={[styles.trendNumber, { color: tabColorFor('/trends') }]}>
          {variety.distinctThisWeek == null ? 'Nothing logged this week yet' : `${variety.distinctThisWeek} different ${variety.distinctThisWeek === 1 ? 'food' : 'foods'}`}
        </Text>
        <Text style={[styles.trendDelta, { color: tabColorFor('/trends') }]}>{variety.line}</Text>
        {variety.nearThing ? (
          <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>
            {`On your safe list and not eaten lately: ${variety.nearThing}.`}
          </Text>
        ) : null}
        <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>Tap to see the whole picture →</Text>
      </TouchableOpacity>,
    );
  }

  // The third thing Trends knows, 2026-09-23, and the one that is not
  // about food: how daily living is going. The longest run of something
  // being kept up leads, since that is the one somebody is keeping going,
  // and whatever is waiting sits under it. Every sentence comes from
  // lib/keepingUp.ts, including the wording for having nothing set up
  // yet, so nothing here decides what a quiet week means.
  function renderKeepingUp() {
    if (!isHomeSectionVisible(visualPrefs, 'keepingUp')) return null;
    if (!data) return null;
    const keepingUp = data.keepingUp;
    return renderBand(
      'keepingUp',
      'Keeping Up',
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/trends', params: { openTrendsLens: 'keepingUp' } })}
        activeOpacity={0.75}
      >
        {keepingUp.streakDays == null ? null : (
          <Text style={[styles.trendNumber, { color: tabColorFor('/trends') }]}>
            {`${keepingUp.streakDays} ${keepingUp.streakDays === 1 ? 'day' : 'days'} running`}
          </Text>
        )}
        <Text style={[styles.trendDelta, { color: tabColorFor('/trends') }]}>{keepingUp.line}</Text>
        {keepingUp.caption ? (
          <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>{keepingUp.caption}</Text>
        ) : null}
        <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>Tap to see how it has been going →</Text>
      </TouchableOpacity>,
    );
  }

  // The fourth thing Trends knows, 2026-09-23, and the one that comes out
  // of the ground. The weight leads where there is one, since that is what
  // a garden is measured in, and a crop somebody counts rather than weighs
  // is said in its own words instead of being turned into a weight. The
  // money line is what this month's picking would have cost at prices the
  // person has recorded paying, so it is money not spent rather than
  // money made, and it says so.
  function renderGardenYield() {
    if (!isHomeSectionVisible(visualPrefs, 'gardenYield')) return null;
    if (!data) return null;
    const gardenYield = data.gardenYield;
    return renderBand(
      'gardenYield',
      'Garden Yield',
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/trends', params: { openTrendsLens: 'harvest' } })}
        activeOpacity={0.75}
      >
        {gardenYield.headline == null ? null : (
          <Text style={[styles.trendNumber, { color: tabColorFor('/trends') }]}>{gardenYield.headline}</Text>
        )}
        <Text style={[styles.trendDelta, { color: tabColorFor('/trends') }]}>{gardenYield.line}</Text>
        {gardenYield.caption ? (
          <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>{gardenYield.caption}</Text>
        ) : null}
        <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>Tap to see it month by month →</Text>
      </TouchableOpacity>,
    );
  }

  // See digestFlipCardPool's own comment (top of file) for what these
  // are, 2026-08-23: real Digest entries, scoped to Basic Health plus the
  // person's own conditions, one card per group, each moving to a
  // different entry from its group every 15 minutes.
  //
  // 2026-09-12, direct request: "apply the same formatting to the Digest
  // cards, but not have them be collapsable. They should still scroll
  // horizontally, but the section of the Digest where they exist should be
  // seen as a header for each card. Each card should be capable of
  // scrolling vertically if there is more info on the front or back than
  // can be displayed." So: a horizontal row of cards, each carrying its own
  // Digest category as a header on both faces, with the band look and a
  // vertical scroll on each face (see FlipCard.tsx).
  //
  // The row used to sit inside a static band of its own titled "From The
  // Digest", which put three layers of heading over the cards once the
  // per-tab groups arrived. 1.0.39.12: "The Digest area on the Home screen
  // is now 3 layers deep. It needs to only be 2 layers. Keep the outer most
  // Digest layer, and keep the flip cars layer, but remove the layer labeled
  // as From The Digest." So the cards sit straight in the Digest group band,
  // which already carries that title, that colour and that ribbon.
  //
  // Each card's header takes the tab colour, the same as the group band
  // above them. Until 2026-09-13 they took the lighter tabPurpleDigestText
  // (the 2026-08-23 text/fill split); once the ribbon moved to the tab
  // colour that morning the lighter title beside it read as a mismatch, and
  // the instruction was to match them: "match the Home band title and card
  // headers too."
  //
  // 2026-09-19: the Digest tab is gone and the cards sit in a Digest group
  // of their own on Home (constants/homeGroups.ts, '/digest'), purple, under
  // the newspaper. Each card's colour and icon come from the tab its entry lives on
  // (Life for a condition, Health Literacy or Earth Matters; Garden for
  // Horticulture; Food for a recipe), looked up through TAB_ROUTES so they
  // can never drift from what TabHub draws: "the cards should each be the
  // color of the tab they come from."
  function renderDigestCards() {
    if (!isHomeSectionVisible(visualPrefs, 'digestCards')) return null;
    return (
      // No negative margin any more: the group band insets its contents on
      // the left and leaves the right edge open, so the first card already
      // starts flush with the group's own text and the row already runs out
      // to the screen edge. The row adds a right inset so the last card is
      // not jammed against it.
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flipRow}>
        {visibleFlipCards.map((card) => {
          const tabPath = tabPathForDigestCategory(card.groupKey);
          const tab = TAB_ROUTES.find((route) => route.path === tabPath);
          const cardColor = tab?.color ?? colors.tabPurpleDigest;
          return (
            <FlipCard
              key={card.groupKey}
              icon={<Ionicons name={tab?.icon ?? 'newspaper'} size={18} color={cardColor} style={textShadow} />}
              header={DIGEST_CATEGORY_LABEL_BY_KEY[card.groupKey] ?? 'Digest'}
              hook={card.hook}
              backTitle={card.backTitle}
              backBody={card.backBody}
              onReadMore={() => router.push(routeForDigestEntry(card.id))}
              borderColor={cardColor}
            />
          );
        })}
      </ScrollView>
    );
  }

    // Quick-log phase 4, 2026-08-30. A photo takes two seconds and can be taken
  // at a table with people waiting; working out what was in it and how much
  // cannot. So the photo is kept on its own until there is time, rather than
  // being the thing that has to happen at the same moment as the logging.
  //
  // Deliberately not saved as a meal with no ingredients: that would count as a
  // logged meal everywhere in the app while contributing no nutrients, which
  // reads as a meal that had nothing in it. See meal_photo_drafts.
  async function handleCapturePhoto(source: 'camera' | 'library') {
    setPhotoSourceSheetOpen(false);
    setCapturingPhoto(true);
    try {
      const result = await pickAndSaveMealPhoto(source, 'meal-photo-draft');
      if (result.status !== 'success') {
        if (result.status === 'permission-denied') {
          showInfoAlert(
            source === 'camera' ? 'Camera access needed' : 'Photo access needed',
            "You can turn this on in your device's Settings, under this app's permissions.",
          );
        } else if (result.status === 'too-small') {
          showInfoAlert('That photo is too small', 'Try taking a new one rather than using a thumbnail.');
        }
        return;
      }
      await createMealPhotoDraft(result.uri, `${todayDateString()}T${nowTimeString24()}`);
      await load();
    } catch (error) {
      console.error('[Home] Failed to keep a meal photo', error);
      showInfoAlert('That photo did not save', 'Something went wrong keeping it. Give it another try.');
    } finally {
      setCapturingPhoto(false);
    }
  }

  async function handleDiscardDraft(draft: MealPhotoDraft) {
    setActiveDraft(null);
    try {
      await deleteMealPhotoDraft(draft.id);
      // The one case where the file itself should go too: nothing else ever
      // took ownership of it.
      await deleteMealPhotoFile(draft.photoUri);
      await load();
    } catch (error) {
      console.error('[Home] Failed to discard a photo draft', error);
    }
  }

  function renderLogAgain() {
    if (!isHomeSectionVisible(visualPrefs, 'logAgain')) return null;
    const draftPhotos = data?.photoDrafts ?? [];
    const foodColor = tabColorFor('/food');
    return renderBand(
      'logAgain',
      'Log a Meal',
      <View style={styles.bandBody}>
        <Text style={styles.logAgainCaption}>
          For anything that did not go to plan: a meal out, something eaten instead of what was scheduled, or
          catching up after the fact.
        </Text>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: foodColor }]}
          activeOpacity={0.8}
          onPress={() => router.push('/voice-log')}
        >
          <Ionicons name="mic-outline" size={18} color={foodColor} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: foodColor }]}>Ate out or off-plan? Say it</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: foodColor }, capturingPhoto ? styles.logAgainTileDisabled : null]}
          activeOpacity={0.8}
          onPress={() => {
            if (announcePhoneOnly(showInfoAlert, 'photo')) return;
            setPhotoSourceSheetOpen(true);
          }}
          disabled={capturingPhoto}
        >
          <Ionicons name="camera-outline" size={18} color={foodColor} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: foodColor }]}>
            {capturingPhoto ? 'Keeping the photo…' : 'No time now? Photograph it'}
          </Text>
        </TouchableOpacity>
        {/* 2026-08-30, replacing the tile strip that used to sit here. Direct
            steer: "random meals being presented to possibly have them again
            doesn't make sense... a standard scrollable list of meal names to
            choose from, with a search field to filter by a specific word
            rather than remembering what it was named in the app." Correct:
            eight guessed tiles assumed the app knew someone was eating right
            then, and a meal outside those eight was unreachable. */}
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: foodColor }]}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/food', params: { openFoodLens: 'findMeal' } })}
        >
          <Ionicons name="restaurant-outline" size={18} color={foodColor} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: foodColor }]}>Log or schedule a meal</Text>
        </TouchableOpacity>
        {draftPhotos.length > 0 ? (
          <Fragment>
            <Text style={styles.logAgainCaption}>
              {`${draftPhotos.length} ${draftPhotos.length === 1 ? 'photo is' : 'photos are'} waiting to be turned into a meal. Tap one when you have a minute.`}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.logAgainScroll}
              contentContainerStyle={styles.logAgainRow}
            >
              {draftPhotos.map((draft) => (
                <TouchableOpacity
                  key={draft.id}
                  style={[styles.draftTile, { borderColor: foodColor }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveDraft(draft)}
                >
                  <Image source={{ uri: draft.photoUri }} style={styles.draftThumb} />
                  <Text style={styles.logAgainTileMeta} numberOfLines={1}>
                    {draft.capturedAt.length >= 16 ? formatTime12(draft.capturedAt.slice(11, 16)) : 'Waiting'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Fragment>
        ) : null}
      </View>,
    );
  }

  // The Grocery List, 2026-09-01. Home is where this was asked to be
  // reachable from, and it is the right place: a grocery list is opened on
  // the way out the door, not by picking a tab and then a lens first.
  //
  // The card deliberately says almost nothing when there is no list being
  // shopped, because most days there is not one. It grows into a real
  // progress line only while a trip is actually underway.
  function renderGroceryList() {
    if (!isHomeSectionVisible(visualPrefs, 'groceryList')) return null;
    const summary = data?.grocerySummary ?? null;
    // Life's colour since 2026-09-12, see lib/homeSections.ts.
    const scheduleColor = tabColorFor('/life');
    const remaining = summary ? summary.itemCount - summary.checkedCount : 0;
    return renderBand(
      'groceryList',
      'Grocery List',
      <View style={styles.bandBody}>
        <Text style={styles.logAgainCaption}>
          {summary
            ? `${summary.checkedCount} of ${summary.itemCount} in the cart${remaining > 0 ? `, ${remaining} to go` : ''}.${
                summary.list.storeName ? ` At ${summary.list.storeName}.` : ''
              }`
            : 'Turn the next few days of scheduled meals into a list you can shop from, priced and checked off as you go.'}
        </Text>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: scheduleColor }]}
          activeOpacity={0.8}
          onPress={() =>
            router.push(summary ? `/grocery-list?listId=${encodeURIComponent(summary.list.id)}` : '/grocery-list')
          }
        >
          <Ionicons name="cart-outline" size={18} color={scheduleColor} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: scheduleColor }]}>
            {summary ? 'Open my grocery list' : 'Build a grocery list'}
          </Text>
        </TouchableOpacity>
      </View>,
    );
  }

  // The same switch Profile carries, on the page a person is already on.
  // 2026-09-16, direct request: "Low Stimulation needs to be available as
  // a quick access setting on the Home page." It calls setLowStimulation,
  // exactly as Profile does, and both screens read the same store, so a
  // switch moved in either place is already moved in the other by the
  // time it is looked at. No local copy, nothing to drift.
  function renderLowStimulation() {
    if (!isHomeSectionVisible(visualPrefs, 'lowStimulation')) return null;
    const homeColor = homeGroupIdentity('/profile')?.color ?? colors.primary;
    return renderBand(
      'lowStimulation',
      'Low Stimulation',
      <View style={styles.bandBody}>
        <Text style={styles.bandCaption}>
          Flat backgrounds, nothing moving on its own, and whatever is open folded shut, in one switch.
          Nothing is deleted: every picture and colour you picked comes back the moment you switch it off.
        </Text>
        <View style={styles.pillRow}>
          {[false, true].map((value) => {
            const active = visualPrefs.lowStimulation === value;
            return (
              <TouchableOpacity
                key={value ? 'on' : 'off'}
                style={[styles.pill, active && { backgroundColor: homeColor, borderColor: homeColor }]}
                onPress={() => {
                  void setLowStimulation(value);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{value ? 'On' : 'Off'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>,
    );
  }

  // Reports, 2026-09-16. The window is the only choice that page asks for
  // before it can build anything, so asking it here means one tap from
  // Home lands on a finished report rather than on the picker.
  function renderMakeReport() {
    if (!isHomeSectionVisible(visualPrefs, 'makeReport')) return null;
    const reportsColor = tabColorFor('/reports');
    return renderBand(
      'makeReport',
      'Make a Report',
      <View style={styles.bandBody}>
        <Text style={styles.bandCaption}>
          Everything logged over a stretch of days, pulled into one summary to read, print, or hand to a
          doctor. Pick how far back it goes.
        </Text>
        <View style={styles.pillRow}>
          {REPORT_WINDOW_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.days}
              style={[styles.pill, { borderColor: reportsColor }]}
              activeOpacity={0.8}
              onPress={() =>
                router.push({ pathname: '/reports', params: { openReportDays: String(option.days) } })
              }
            >
              <Text style={styles.pillText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>,
    );
  }

  // Garden, 2026-09-16. Garden tasks are schedule_items the same way doses
  // and appointments are (item_type 'garden', see listUpcomingGardenTasks),
  // so this is the same row shape as Today's Reminders, dated rather than
  // timed. A row opens the Upcoming Tasks lens, which is where a task is
  // actually marked done.
  function renderGardenTasks() {
    if (!isHomeSectionVisible(visualPrefs, 'gardenTasks')) return null;
    const tasks = data?.gardenTasks ?? [];
    const today = todayDateString();
    return renderBand(
      'gardenTasks',
      'Garden Tasks',
      <View style={styles.bandBody}>
        {tasks.length === 0 ? (
          <Text style={styles.bandCaption}>Nothing planned in the garden from today on.</Text>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.reminderRow}
              activeOpacity={0.8}
              onPress={() =>
                router.push({ pathname: '/garden', params: { openGardenLens: 'upcomingTasks' } })
              }
            >
              <Text style={styles.reminderTime} numberOfLines={1}>
                {gardenTaskDayLabel(task.scheduledFor, today)}
              </Text>
              <View style={styles.reminderBody}>
                <Text style={styles.reminderTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.notes ? (
                  <Text style={styles.reminderDetail} numberOfLines={1}>
                    {task.notes}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>,
    );
  }

  // The last row of a band that leads to where the thing gets built,
  // 2026-09-17. A band with nothing in it used to say "build one in Life"
  // as flat text, which is a sentence pointing at a door rather than a
  // door. This is the door, and it is there whether the band is empty or
  // full, because the moment somebody wants a second routine is the
  // moment the band is no longer empty.
  function renderBandWayIn(lens: string, title: string, detail: string) {
    return (
      <TouchableOpacity
        style={styles.bandWayInRow}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/life', params: { openLifeLens: lens } })}
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.tabLife} style={textShadow} />
        <View style={styles.reminderBody}>
          <Text style={styles.reminderTitle}>{title}</Text>
          <Text style={styles.reminderDetail}>{detail}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={textShadow} />
      </TouchableOpacity>
    );
  }

  // Routines, 2026-09-17. The band lists what there is and starts one, and
  // nothing more: building a routine wants every step visible at once,
  // which is a screenful, and it lives in Life where it was made.
  //
  // Ordered by what time it is rather than by the order they were made,
  // so the morning one is the first thing under the hand at seven. The
  // order is a suggestion and nothing is hidden by it; see
  // orderRoutinesForNow.
  function renderRoutines() {
    if (!isHomeSectionVisible(visualPrefs, 'routines')) return null;
    const now = new Date();
    const routines = orderRoutinesForNow(data?.routines ?? [], now, data?.routineOccasions ?? []);
    return renderBand(
      'routines',
      'Routines',
      <View style={styles.bandBody}>
        {routines.map((routine) => (
          <TouchableOpacity
            key={routine.id}
            style={styles.reminderRow}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/routine', params: { id: routine.id } })}
          >
            <View style={styles.reminderBody}>
              <Text style={styles.reminderTitle} numberOfLines={1}>
                {routine.name}
              </Text>
              <Text style={styles.reminderDetail} numberOfLines={2}>
                {describeRoutineStanding(routine, now)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={textShadow} />
          </TouchableOpacity>
        ))}
        {renderBandWayIn(
          'routines',
          routines.length === 0 ? 'Build your first routine' : 'Add or change a routine',
          routines.length === 0
            ? 'An order you would rather not hold in your head. Write the steps once in Life and it shows up here, one step at a time.'
            : 'Opens Life, where the steps get written.',
        )}
      </View>,
    );
  }

  // Days Until, anything at all, 2026-09-22: "Days Until should be
  // something that is also available in a free form allowing the user to
  // create their own Days Until for something that we don't have covered
  // in the app." The Garden group's card above holds the counters under a
  // garden area; this one holds the rest, and starting one here asks for
  // nothing but a name, a number of days and the day it started. The
  // section reads its counters on focus, so the Home load carries nothing
  // for it, and Life > Days Until is where both kinds read together.
  function renderCountdowns() {
    if (!isHomeSectionVisible(visualPrefs, 'countdowns')) return null;
    return renderBand(
      'countdowns',
      'Days Until',
      <View style={styles.bandBody}>
        <DaysUntilSection scope="free" tabColor={colors.tabLife} compact showHeading={false} />
      </View>,
    );
  }

  // Did I Do It, 2026-09-17. Read-only here on purpose. The question this
  // answers is asked on the stairs, so the whole value is being able to
  // look; recording something is a decision, and a decision belongs on the
  // screen that can also take it back.
  //
  // The summary line above the rows says nothing when nothing is waiting,
  // the same refusal the capture inbox makes: a card announcing that there
  // is nothing to say is noise every morning.
  function renderDoneChecks() {
    if (!isHomeSectionVisible(visualPrefs, 'doneChecks')) return null;
    const now = new Date();
    const checks = data?.doneChecks ?? [];
    const summaryLine = describeChecksSummary(summarizeChecks(checks, now));
    return renderBand(
      'doneChecks',
      'Did I Do It',
      <View style={styles.bandBody}>
        {summaryLine ? <Text style={styles.bandCaption}>{summaryLine}</Text> : null}
        {checks.map((check) => {
          const standing = checkStanding(check, now);
          return (
            <TouchableOpacity
              key={check.id}
              style={styles.reminderRow}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/life', params: { openLifeLens: 'didIDoIt' } })}
            >
              <View style={styles.reminderBody}>
                <Text style={styles.reminderTitle} numberOfLines={1}>
                  {check.name}
                </Text>
                <Text style={styles.reminderDetail} numberOfLines={2}>
                  {standing.line}
                </Text>
              </View>
              <Ionicons
                name={standing.doneThisPeriod === true ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={standing.doneThisPeriod === true ? colors.accent : colors.textSecondary}
                style={textShadow}
              />
            </TouchableOpacity>
          );
        })}
        {renderBandWayIn(
          'didIDoIt',
          checks.length === 0 ? 'Add your first check' : 'Add or change a check',
          checks.length === 0
            ? 'One question, asked later. Did I take it, did I lock it, did I pay it. Name what you keep wondering about and it waits here.'
            : 'Opens Life, where these get named and ticked off.',
        )}
      </View>,
    );
  }

  // Capture, 2026-09-16. Rows and a line, and the line says nothing at all
  // when the inbox is empty, because empty is the normal state and a card
  // announcing "0 waiting" every morning is noise.
  //
  // The first two rows land on the same screen. Say it starts the microphone
  // on arrival rather than waiting to be tapped again, since somebody who
  // picked the speaking row has already chosen, the same thing
  // app/voice-log.tsx does with its own autoStart.
  //
  // Sort it out, 1.0.39.15, is the other direction: everything already
  // thrown in here plus everything that was scheduled and never answered
  // for, in one place. Direct instruction: "The Capture band needs to have
  // a Reconciliation function for them to be able to get to the list of
  // their thoughts so they can be named, categorized and scheduled or
  // whatever needs to be done to them. The same needs to apply for tasks
  // and whether or not they actually ate and drank the amounts that were
  // scheduled." It shows whenever there is anything at all to answer,
  // including when the inbox itself is empty, since a week of unanswered
  // meals is exactly the case somebody needs pointing at.
  // Your Story, 2026-09-24 (lib/yourStory.ts, components/YourStorySection.tsx).
  // Always shown: it folds and moves like every card, and is the one card
  // with no switch (HOME_SECTIONS_ALWAYS_SHOWN). Folded, it is one line
  // naming the next thing to set up, or "Your Story Continues" once there
  // is nothing left to set up. No badge and no count.
  function renderYourStory() {
    return renderBand(
      'yourStory',
      yourStory?.heading ?? 'Your Story',
      <View style={styles.bandBody}>
        <YourStorySection
          mode="card"
          view={yourStory}
          onChanged={() => void reloadYourStory()}
          onHomeDestination={goToHomeDestination}
        />
      </View>,
      {
        icon: 'book-outline',
        color: colors.primary,
        foldedCaption: yourStory ? nextLine(yourStory) : undefined,
      },
    );
  }

  function renderCaptureInbox() {
    if (!isHomeSectionVisible(visualPrefs, 'captureInbox')) return null;
    const counts = data?.captureCounts ?? { waiting: 0, sorted: 0 };
    const summary = describeInbox({ ...counts, done: 0 });
    const reconcile = data?.reconcileCounts ?? { open: 0, assumed: 0 };
    // Both kinds of unanswered scheduled row counted together, because "we
    // assumed you ate this" and "nobody said what happened" are the same
    // question from the person's side.
    const toAnswer = reconcile.open + reconcile.assumed;
    // Two sentences, not one. describeInbox already says what the inbox
    // holds, so the caption below it covers only the scheduled half rather
    // than counting the same waiting notes a second time in different words.
    // The button itself watches both, since either one is a reason to open
    // the screen.
    const queue = describeReconcileQueue({ thoughts: counts.waiting, scheduled: toAnswer });
    const answerLine = describeReconcileQueue({ thoughts: 0, scheduled: toAnswer });
    return renderBand(
      'captureInbox',
      'Capture',
      <View style={styles.bandBody}>
        <Text style={styles.bandCaption}>
          Somewhere to throw a thought before it is gone. Nothing is asked of you: no category, no date, no
          form. Sorting it out can wait until you have a minute.
        </Text>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: colors.primary }]}
          onPress={() => router.push('/capture')}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: colors.primary }]}>Type it</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/capture', params: { speak: '1' } })}
          activeOpacity={0.8}
        >
          <Ionicons name="mic-outline" size={18} color={colors.primary} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: colors.primary }]}>Say it</Text>
        </TouchableOpacity>
        {queue ? (
          <TouchableOpacity
            style={[styles.logAgainSpeakButton, { borderColor: colors.accent }]}
            onPress={() => router.push('/reconcile')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-outline" size={18} color={colors.accent} style={textShadow} />
            <Text style={[styles.logAgainSpeakText, { color: colors.accent }]}>Sort it out</Text>
          </TouchableOpacity>
        ) : null}
        {answerLine ? <Text style={styles.bandCaption}>{answerLine}</Text> : null}
        {summary ? <Text style={styles.bandCaption}>{summary}</Text> : null}
      </View>,
      { icon: 'file-tray-outline', color: colors.primary },
    );
  }

  // Days Until, 2026-09-21: the counters running under the garden's areas,
  // soonest first, the ones past their day ahead of those, five at most.
  // Since 1.0.42.15 ("Add a Days Until counter to the Home screen quick
  // access") the card is the same section the Days Until lens renders, in
  // its compact form: a counter is started here, by picking its area, and
  // marked done here, and the section reads its own counters on focus, so
  // the Home load below carries nothing for it. The rest are one tap away
  // on the lens.
  function renderDaysUntil() {
    if (!isHomeSectionVisible(visualPrefs, 'daysUntil')) return null;
    return renderBand(
      'daysUntil',
      'Days Until',
      <View style={styles.bandBody}>
        <DaysUntilSection compact showHeading={false} />
      </View>,
    );
  }

  // The other half of Garden's group: picking something is the thing that
  // happens away from the phone and gets remembered later, so it is a
  // one-tap row into the Harvest Log rather than a card to read.
  function renderLogHarvest() {
    return renderActionRow('logHarvest', 'Log a Harvest', () =>
      router.push({ pathname: '/garden', params: { openGardenLens: 'harvestLog' } }),
    );
  }

  // One tab's worth of Home, as a band that opens to the cards inside it.
  //
  // 2026-09-16, direct correction: "the things that are already on the
  // Home screen are already all quick access things from other tabs. What
  // I meant was to group the existing quick access elements into their
  // overarching category, rather than something labeled as Quick Access."
  // The category is the tab, so the band carries that tab’s name, icon
  // and colour, and the cards inside keep theirs: a card's colour said
  // which tab it belonged to before, and now the band it sits in says the
  // same thing in words.
  //
  // The contents are built before the header so an empty group can be
  // dropped whole. Most of these sections return null on their own (a
  // check-in that is not due, a section turned off in Profile), and a
  // band that opens onto nothing is worse than no band at all.
  function renderHomeTabGroup(group: Extract<HomeSectionDisplayGroup, { kind: 'tab' }>) {
    // The whole group turned off from the arranging list, 1.0.39.16. A
    // separate switch from the cards inside it on purpose: turning off
    // "Signals" and turning off "Log a Flare" are two different things to
    // have decided, and only one of them should survive turning the group
    // back on. See homeGroupVisibility in lib/visualPreferences.ts.
    if (!isHomeGroupVisible(visualPrefs, homeGroupIdOf(group))) return null;
    const identity = homeGroupIdentity(group.path);
    const members = group.keys.map((key) => ({ key, node: renderHomeSection(key) }));
    const shown = members.filter((member) => member.node !== null);
    if (shown.length === 0) return null;
    const foldKey = `${HOME_TAB_GROUP_BAND_KEY_PREFIX}${group.path}`;
    return (
      <View
        key={group.path}
        onLayout={(event) => {
          // Every member reports the GROUP's y rather than its own: folded,
          // a card inside has no position to give, and the corner menu
          // opens the group before it jumps, so the name it just opened is
          // where it should land anyway.
          for (const { key } of members) sectionOffsets.current[key] = event.nativeEvent.layout.y;
        }}
      >
        <HomeSectionBand
          title={identity?.title ?? 'More'}
          icon={identity?.icon ?? 'ellipse-outline'}
          color={identity?.color ?? colors.primary}
          textColor={identity?.textColor}
          expanded={tabGroupFolds.isOpen(foldKey)}
          onToggle={() => tabGroupFolds.toggle(foldKey)}
          onLongPress={() => beginArranging()}
          contentStyle={styles.homeTabGroupBody}
        >
          {shown.map((member) => (
            <Fragment key={member.key}>{member.node}</Fragment>
          ))}
        </HomeSectionBand>
      </View>
    );
  }

  // Single dispatcher rather than a Record<HomeSectionKey, fn> object --
  // this only ever gets called with a REORDERABLE_HOME_SECTION_KEYS
  // member (see getOrderedHomeSectionKeys), never 'weather' (the sky grid is
  // Where did I put it, 2026-09-23, phase 1 of the cross-app push. The
  // other half of Capture: one is for putting a thing down somewhere, this
  // is for finding it again. A row rather than a card inside a band, and
  // directly under Capture, because the moment it has to serve is somebody
  // standing in front of an open cupboard with a phone in one hand.
  function renderWhereIsIt() {
    if (!isHomeSectionVisible(visualPrefs, 'whereIsIt')) return null;
    return renderBand(
      'whereIsIt',
      'Where Is It',
      <View style={styles.bandBody}>
        <Text style={styles.bandCaption}>
          {describeWhereIsItRow(data?.placeCount ?? 0)} Kitchen items, anything sorted to Where it is in Capture,
          and what is growing in the garden.
        </Text>
        <TouchableOpacity
          style={[styles.logAgainSpeakButton, { borderColor: colors.primary }]}
          onPress={() => router.push('/where-is-it')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={colors.primary} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: colors.primary }]}>Look something up</Text>
        </TouchableOpacity>
      </View>,
    );
  }

  // drawn inside the Today card rather than being a card of its own, so there
  // is nothing to give it a position), so the default branch below covering
  // 'weather' is a deliberate safety net, not a case expected to fire.
  function renderHomeSection(key: HomeSectionKey) {
    switch (key) {
      case 'sharedFolderSetup':
        return renderSharedFolderSetup();
      case 'yourStory':
        return renderYourStory();
      case 'captureInbox':
        return renderCaptureInbox();
      case 'whereIsIt':
        return renderWhereIsIt();
      case 'today':
        return renderToday();
      case 'lowStimulation':
        return renderLowStimulation();
      case 'symptomCheckinReminder':
        return renderSymptomCheckinReminder();
      case 'todaysCheckin':
        return renderTodaysCheckin();
      case 'logAgain':
        return renderLogAgain();
      case 'groceryList':
        return renderGroceryList();
      case 'yourDay':
        return renderYourDay();
      case 'todaysReminders':
        return renderTodaysReminders();
      case 'mealsLoggedToday':
        return renderMealsLoggedToday();
      case 'worthALook':
        return renderWorthALook();
      case 'scanProduct':
        return renderScanProduct();
      case 'logFlare':
        return renderLogFlare();
      case 'logBloodPressure':
        return renderLogBloodPressure();
      case 'logExercise':
        return renderLogExercise();
      case 'howYoureFeeling':
        return renderHowYoureFeeling();
      case 'fuelGauges':
        return renderFuelGauges();
      case 'weekTrend':
        return renderWeekTrend();
      case 'varietyThisWeek':
        return renderVarietyThisWeek();
      case 'keepingUp':
        return renderKeepingUp();
      case 'gardenYield':
        return renderGardenYield();
      case 'makeReport':
        return renderMakeReport();
      case 'gardenTasks':
        return renderGardenTasks();
      case 'daysUntil':
        return renderDaysUntil();
      case 'logHarvest':
        return renderLogHarvest();
      case 'digestCards':
        return renderDigestCards();
      case 'routines':
        return renderRoutines();
      case 'doneChecks':
        return renderDoneChecks();
      case 'countdowns':
        return renderCountdowns();
      default:
        return null;
    }
  }

  return (
    <View style={styles.screen}>
      {infoAlertElement}
      {/* Quick-log phase 4, 2026-08-30. */}
      <AppActionSheet
        visible={photoSourceSheetOpen}
        onClose={() => setPhotoSourceSheetOpen(false)}
        title="Photograph this meal"
        message="Keep a photo now and turn it into a logged meal whenever you have a minute. Nothing is sent anywhere, and nothing is guessed from the picture."
        actions={[
          { label: 'Take a photo', onPress: () => handleCapturePhoto('camera') },
          { label: 'Choose an existing photo', onPress: () => handleCapturePhoto('library') },
        ]}
      />
      <AppActionSheet
        visible={activeDraft !== null}
        onClose={() => setActiveDraft(null)}
        title="What was this?"
        message="Pick one of your usual meals, or say what it was. The photo goes onto whatever you log, at the time it was taken."
        actions={[
          {
            // Routed to the searchable list rather than offering a few guessed
            // names: someone looking at a photo has to identify it, and four
            // guesses are noise next to a list they can actually search.
            label: '🍽 Pick from your meals',
            onPress: () => {
              const draft = activeDraft;
              setActiveDraft(null);
              if (draft) {
                router.push({
                  pathname: '/food',
                  params: {
                    openFoodLens: 'findMeal',
                    findMealDraftId: draft.id,
                    findMealPhotoUri: draft.photoUri,
                    findMealCapturedAt: draft.capturedAt,
                  },
                });
              }
            },
          },
          {
            label: '🎤 Say what it was',
            onPress: () => {
              const draft = activeDraft;
              setActiveDraft(null);
              if (draft) {
                router.push({
                  pathname: '/voice-log',
                  params: { draftId: draft.id, photoUri: draft.photoUri, capturedAt: draft.capturedAt },
                });
              }
            },
          },
          {
            label: 'Discard this photo',
            onPress: () => {
              if (activeDraft) void handleDiscardDraft(activeDraft);
            },
          },
        ]}
      />
      <AppActionSheet
        visible={worthALookChoiceOpen}
        onClose={() => setWorthALookChoiceOpen(false)}
        title="Worth a look"
        message="Today's count covers two different things. Which would you like to see?"
        actions={[
          {
            label: `Nutrients (${nutrientFlagCount})`,
            onPress: () => {
              setWorthALookChoiceOpen(false);
              router.navigate({ pathname: '/insights', params: { openInsightsLens: 'nutrients' } });
            },
          },
          {
            label: `Condition Scores (${sixDsFlagCount})`,
            onPress: () => {
              setWorthALookChoiceOpen(false);
              router.navigate({ pathname: '/insights', params: { openInsightsLens: 'sixDs' } });
            },
          },
        ]}
      />
      <SwipeableTabScreen>
        <View style={styles.contentArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          scrollEnabled={!arrangeDragging}
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        >

          {/* Above the loading gate on purpose: whether test data is loaded
              is true regardless of what else has finished fetching, and it is
              the one thing that changes how everything below it should be
              read. Deliberately not a toggleable Home section either, since a
              warning that can be switched off stops being a warning. */}
          {testDataPresent ? (
            <View style={styles.testDataBanner}>
              <Text style={styles.testDataBannerText}>
                Test data is loaded. Some harvests, ferments and past shopping here are made up. Remove it from Profile
                &gt; Developer Tools.
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading today…</Text>
            </View>
          ) : arranging ? (
            // Arranging replaces the page rather than decorating it. Every
            // card folds to its name, which is the only part that matters
            // while deciding an order, and uniform rows are what let a drag
            // land where the finger says it should.
            <HomeArrangeList
              order={getOrderedHomeSectionKeys(visualPrefs)}
              prefs={visualPrefs}
              onReorder={(next) => void setVisualPreferences({ homeSectionOrder: next })}
              onToggleGroup={(groupId) =>
                void setVisualPreferences({
                  homeGroupVisibility: { [groupId]: !isHomeGroupVisible(visualPrefs, groupId) },
                })
              }
              onToggleSection={(key) =>
                void setVisualPreferences({
                  homeSectionVisibility: { [key]: !isHomeSectionVisible(visualPrefs, key) },
                })
              }
              hasContent={homeSectionHasContent}
              openFor={arrangeOpenKey}
              onReveal={(y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: false })}
              onDragChange={setArrangeDragging}
              onDone={() => {
                setArrangeDragging(false);
                setArrangeOpenKey(null);
                setArranging(false);
              }}
            />
          ) : (
            <>
              {groupHomeSectionsForDisplay(getOrderedHomeSectionKeys(visualPrefs)).map((group) =>
                group.kind === 'tab' ? (
                  renderHomeTabGroup(group)
                ) : (
                  // A bare View, no style: React Native does not collapse
                  // margins, so wrapping changes nothing about the layout, and
                  // it is what gives each section a y to scroll to.
                  <View
                    key={group.key}
                    onLayout={(event) => {
                      sectionOffsets.current[group.key] = event.nativeEvent.layout.y;
                    }}
                  >
                    {renderHomeSection(group.key)}
                  </View>
                ),
              )}
            </>
          )}

          {/* 2026-08-21, direct request alongside the section toggles
              above: "they may end up wanting everything, or even
              nothing." A person who has genuinely turned every real
              content section off (not just the current loading/empty
              states any individual section already handles on its own)
              gets a plain, honest explanation here instead of a mostly-
              blank screen that reads as broken. Since 1.0.39.10 that
              includes the greeting card, which used to sit outside this
              system and always stay: turning Today off is now a thing a
              person can do, so a page with nothing left on it is too. */}
          {!loading && !arranging && nothingIsShowing ? (
            <View style={styles.allSectionsHiddenCard}>
              <Text style={styles.allSectionsHiddenText}>
                Every section here is turned off. Hold anywhere on this page to arrange it, and turn any of them
                back on from there, or head to Profile → Home Screen.
              </Text>
            </View>
          ) : null}

        </ScrollView>

        {/* Painted after (on top of) the ScrollView above, so the area
            behind TabHub/LensHub/ScopeHub stays guaranteed flat
            colors.background regardless of scroll position -- every other
            tab gets this for free from its own risen ScreenBackground
            instance (see that component's own bottomMask); Home shows
            content immediately with no risen panel to carry it, so it
            needs its own copy of the same fix. Without this, scrolled
            content shows straight through to TabHub's own floating corner. */}
        <View style={[styles.bottomMask, { height: bottomInset }]} pointerEvents="none" />
        {/* Home's own copy of ScreenBackground.tsx's own EdgeShadow -- same
            reason Home needs its own copy of bottomMask above: it shows
            content immediately with no risen ScreenBackground instance to
            carry one for free. See EdgeShadow.tsx's own header comment for
            the design and ScreenBackground.tsx's own comment for why this
            replaced Home's former flat footer-line copy, and for why its
            own top (not bottom) sits at bottomInset. */}
        <EdgeShadow direction="up" style={{ position: 'absolute', bottom: bottomInset - EDGE_SHADOW_HEIGHT }} />
        </View>
      </SwipeableTabScreen>

      {/* Home's own lens menu, replacing the Digest shortcut that used to sit
          here. Nothing is ever "selected":
          picking an option navigates, so passing undefined keeps the ring off,
          which is what it is for (see LensHub's own note on that prop). */}
      <LensHub
        pageTitle="Home"
        options={homeLensOptions}
        selected={undefined}
        // 3, matching all eight other tabs. Home was the one left on the
        // 2-column default, from when it had no menu of its own to size.
        columns={3}
        // Without this a label longer than one line is TRUNCATED rather than
        // wrapped, which is what makes it necessary: three of these
        // ("Symptom Check-In", "How You're Feeling", "This Week's Trend") run
        // past a ~95px tile at 11px.
        //
        // Deliberately no explicit gridLabel breaks. Word wrap already lands
        // every one of them on a sensible boundary ("How You're" / "Feeling",
        // "This Week's" / "Trend"), so a hand-placed newline would only be
        // restating where the break already falls. Direct instruction: "only
        // if they need it. Don't do it just to do it." The mechanism is there
        // (LensOption.gridLabel) the moment one genuinely breaks badly, which
        // is the same place Digest landed: its own break map is empty.
        itemLabelLines={2}
        onSelect={(key) => {
          const entry = HOME_LENS_DESTINATIONS[key];
          if (!entry) return;
          if (entry.href) {
            router.push(entry.href);
            return;
          }
          if (entry.open) {
            setQuickLogModal(entry.open);
            return;
          }
          revealHomeSection(key);
        }}
      />

      <Modal visible={selectedItem != null} transparent animationType={modalAnimationType('fade')} onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalBackdropTouchable} onPress={() => setSelectedItem(null)} />
            {selectedItem ? (
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                <Text style={styles.modalMeta}>
                  {formatTime12(selectedItem.scheduledFor.slice(11, 16))} · {capitalize(selectedItem.status)}
                </Text>
                <View style={styles.modalActions}>
                  {selectedItem.status !== 'logged' ? (
                    <TouchableOpacity style={styles.primaryButton} onPress={() => handleLogNowFromArc(selectedItem)}>
                      <Text style={styles.primaryButtonText}>Log now</Text>
                    </TouchableOpacity>
                  ) : null}
                  {selectedItem.status !== 'logged' ? (
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => handleSkipFromArc(selectedItem)}>
                      <Text style={styles.secondaryButtonText}>
                        {selectedItem.status === 'skipped' ? 'Unskip' : 'Skip'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedItem(null)}>
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </Modal>

        <Modal visible={quickLogModal != null} transparent animationType={modalAnimationType('fade')} onRequestClose={closeQuickLogModal}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalBackdropTouchable} onPress={closeQuickLogModal} />
            <View style={styles.modalCard}>
              {quickLogModal === 'bp' ? (
                <>
                  <Text style={styles.modalTitle}>Log blood pressure</Text>
                  <Text style={styles.modalMeta}>Right now, {formatTime12(nowTimeString24())}</Text>
                  <View style={styles.quickInputRow}>
                    <AppTextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="120"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={bpSystolic}
                      onChangeText={setBpSystolic}
                    />
                    <Text style={styles.quickInputSeparator}>/</Text>
                    <AppTextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="80"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={bpDiastolic}
                      onChangeText={setBpDiastolic}
                    />
                    <Text style={styles.modalMeta}>mmHg</Text>
                  </View>
                  <View style={styles.quickInputRow}>
                    <AppTextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="72"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={bpBpm}
                      onChangeText={setBpBpm}
                    />
                    <Text style={styles.modalMeta}>BPM (optional)</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={closeQuickLogModal}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveBP}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : quickLogModal === 'exercise' ? (
                <>
                  <Text style={styles.modalTitle}>Log exercise</Text>
                  <Text style={styles.modalMeta}>Right now, {formatTime12(nowTimeString24())}</Text>
                  <View style={[styles.quickInputRow, { marginTop: 12 }]}>
                    <AppTextInput
                      style={[styles.quickInput, { flex: 1 }]}
                      placeholder="e.g. Walk, yoga, weights"
                      value={exerciseType}
                      onChangeText={setExerciseType}
                    />
                    <VoiceInputButton onResult={setExerciseType} />
                  </View>
                  <View style={styles.quickInputRow}>
                    <AppTextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="Minutes"
                      keyboardType="number-pad"
                      value={exerciseDuration}
                      onChangeText={setExerciseDuration}
                    />
                    <View style={styles.pillRow}>
                      {(['light', 'moderate', 'vigorous'] as const).map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.pill, exerciseIntensity === option && styles.pillActive]}
                          onPress={() => setExerciseIntensity(option)}
                        >
                          <Text style={[styles.pillText, exerciseIntensity === option && styles.pillTextActive]}>
                            {option[0].toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={closeQuickLogModal}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveExercise}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Modal>
    </View>
  );
}

// Explicitly requested, 2026-07-27: every info box's own CardLabel should
// line up along the same left edge, page to page down the screen -- before
// this, each box's own paddingHorizontal had been tuned independently (12,
// 14, 16, or 0), which put each box's own label at a slightly different x
// position even though the boxes' own outer edges already lined up. One
// shared value, used by every box below that carries a CardLabel, fixes
// that at the source instead of nudging each label individually.
const INFO_CARD_PADDING_HORIZONTAL = 16;
// The 2px full border every card used to carry is gone, 2026-09-12: every
// box on this page is now a band (components/HomeSectionBand.tsx), edge to
// edge with a 4px accent down the left in the tab's colour, a hairline
// top and bottom, and no right edge. The tab-colour signal the thicker
// border used to carry now sits in the accent bar and the header row.
// Small controls (pills, chips, buttons) keep their own 1px.

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // position: 'relative' so bottomMask (position: 'absolute' inside it)
  // places relative to this box, not the whole screen.
  contentArea: { flex: 1, position: 'relative' },
  // No backgroundColor here (stays the default transparent) -- that's what
  // lets the shared background layer (app/(tabs)/_layout.tsx) show through
  // in the gaps between cards.
  scroll: { flex: 1 },
  bottomMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    // `height` set inline (bottomInset) -- varies by device safe-area inset.
  },
  // paddingTop: a little separation between the header and the Today
  // card below it, present from the start (not just something scrolling
  // reveals) -- otherwise the greeting card sits flush against the header
  // the instant the page loads.
  // 2026-08-08, explicitly requested: "the individual boxes and buttons per
  // rows [should] be the same 10 pixel distance away from each other...
  // both vertically and horizontally." `gap` here is the vertical half of
  // that -- applies uniformly between every direct top-level child of this
  // ScrollView's content (the Today band, the assessment-due banner, Today's
  // Check-In, the Day Arc, the stat tiles row, the quick-actions row, the
  // mood orb, fuel gauges, this week's trend, the flip-card row), including
  // correctly skipping a gap on either side of any that don't render at all
  // right now (the due banner, trendCard) -- a real advantage over each
  // element carrying its own marginTop by hand, which is what every one of
  // those used to do (several different values -- 16, 24 -- not even
  // consistent with each other before this). The horizontal half of the
  // same request is each row's own `gap` (statRow/ringRow/
  // flipRow/feelingTagRow below), normalized to this same 10.
  // paddingHorizontal 0, 2026-09-12: "use the available width of the
  // entire screen, all the way from the left side of the screen to the
  // right side... with the padding in effect for the text or anything else
  // that is present, but not for the boxes." Each band carries its own
  // inner padding (HOME_BAND_CONTENT_PADDING); the page itself no longer
  // insets anything. The gap between bands is HOME_BAND_GAP, the app-wide
  // standard since 2026-09-12 (see its own comment in HomeSectionBand).
  content: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 32, gap: HOME_BAND_GAP },
  // Shared by every band's expanded content that is a stack of things
  // (caption, buttons, a photo strip) rather than one widget.
  bandBody: { gap: HOME_BAND_GAP },
  // A tab group's contents: the cards inside keep the full width on their
  // right, the way every band on Home does, and are inset on the left so
  // the group’s accent bar and theirs read as two levels rather than one
  // thick line.
  homeTabGroupBody: {
    gap: HOME_BAND_GAP,
    paddingLeft: HOME_BAND_CONTENT_PADDING,
    paddingRight: 0,
  },
  bandCaption: { ...typography.caption, ...textShadow, color: colors.textSecondary, lineHeight: 16 },
  // For a band whose content is one centred widget (the day arc, the orb).
  bandContentCentered: { alignItems: 'center' },

  // One reminder from today. The time leads at a fixed width so a column of
  // them lines up and the day reads down the left edge; the title takes what
  // is left, and the state word closes the row.
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  // The way-in row at the foot of a band. Same box as a reminder row so a
  // band reads as one column, with the tab colour down its left edge so it
  // is plainly the way out of the band rather than another of its items.
  bandWayInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.tabLife,
  },
  reminderTime: { ...typography.caption, ...textShadow, color: colors.textMuted, width: 62 },
  reminderBody: { flex: 1, gap: 2 },
  reminderTitle: { ...typography.body, ...textShadow, color: colors.textPrimary },
  reminderDetail: { ...typography.caption, ...textShadow, color: colors.textMuted },
  // The one sentence about the meals around a dose. Amber rather than the
  // muted grey of the line above it, because it is the only line on the
  // row that is asking for something to be moved.
  reminderFoodNote: { ...typography.caption, ...textShadow, color: colors.statusYellowOnSurface },
  reminderState: { ...typography.caption, ...textShadow },

  // Same colors.surface "dark blue" card used everywhere else on this page
  // (arcCard, statTile, trendCard, etc.) -- every text-bearing element on
  // Home sits on this same box now, since the background underneath is a
  // photo (not the flat navy colors.background), and textPrimary's light
  // cream reads poorly floating over the photo's brighter patches.
  loadingCard: {
    ...homeBandStyle,
    padding: HOME_BAND_CONTENT_PADDING,
    borderColor: colors.border,
  },
  loadingText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  // Same card treatment as loadingCard above (plain surface/border, no
  // per-tab color -- this isn't about any one tab), shown only once every
  // real Home section has been individually turned off from Profile.
  allSectionsHiddenCard: {
    ...homeBandStyle,
    padding: HOME_BAND_CONTENT_PADDING,
    borderColor: colors.border,
    marginTop: 12,
  },
  allSectionsHiddenText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  testDataBanner: {
    ...homeBandStyle,
    backgroundColor: colors.statusYellowBg,
    borderColor: colors.statusYellowStandalone,
    paddingVertical: 10,
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    marginBottom: 12,
  },
  testDataBannerText: {
    ...typography.caption,
    ...textShadow,
    color: colors.statusYellowStandalone,
  },
  greetingText: { ...typography.screenTitle, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  affirmationText: { ...typography.body, ...textShadow, color: colors.primary, marginTop: 2, fontStyle: 'italic' },
  dateText: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 2 },

  // Moon phase / equinox-solstice / sunrise-sunset / temp / humidity / UV /
  // AQI / pollen -- two-column grid, 2026-08-18 (see the SkyGridItem
  // component's own header comment above for the full "why" -- replaced a
  // pill/chip row, reported directly as "I don't like how they display all
  // in their own pills"). No borders, no background boxes here at all; a
  // crossed severity threshold colors only the label's own text (via
  // skyChipTint, still shared with the plain 4-tone system above).
  skyGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  skyGridCell: { width: '50%', paddingVertical: 4, paddingRight: 8 },
  skyGridCellFull: { width: '100%' },
  skyGridText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  // 2026-08-18, directly reported: the plain caption-size emoji ("not big
  // enough to be seen as what they are") -- a real, separate, larger nested
  // Text span for just the icon character, not the whole label's own font
  // size (which would make the label text itself oversized too).
  skyGridEmoji: { fontSize: 17, lineHeight: 20,

    ...textShadow,

  },

  // Used to precede every content card on this page as its own separate
  // box -- 2026-07-26, folded into each of those cards instead (see
  // CardLabel above). The last holdout, "A Few Things Worth Knowing," lost
  // its own header entirely on 2026-07-27 (explicitly requested). Its own
  // replacement, sectionHeadingSpaced (a plain per-card marginTop: 24
  // spacer), is gone too now, 2026-08-08 -- superseded by content's own
  // `gap: 10`, which handles this same job uniformly for every top-level
  // card at once (see that style's own comment) rather than needing it
  // repeated, inconsistently, on each card individually.
  emptyText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  // Stays neutral (colors.textSecondary), not tab-colored -- unlike
  // statNumber/trendNumber below, this is a full descriptive sentence, not
  // a short bold headline number, and a full paragraph in a saturated
  // brand color reads worse for readability than an accent used sparingly.
  // The card's own border + CardLabel already carry the tab-color signal.
  arcCaption: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },

  // Log Again (quick-log phase 1), 2026-08-30. The card itself is a band
  // now (2026-09-12); these are what sits inside it.
  logAgainCaption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  logAgainSpeakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logAgainSpeakText: { ...typography.bodyEmphasis, ...textShadow },
  // Negative margin so the tile row can scroll all the way to the card edges
  // instead of stopping short at its padding, with that same padding handed
  // to the content instead. Same negative-margin technique the page itself
  // used to need before it went edge to edge, scoped to this one card.
  logAgainScroll: { marginHorizontal: -INFO_CARD_PADDING_HORIZONTAL },
  logAgainRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
  },
  logAgainTileDisabled: { opacity: 0.5 },
  draftTile: {
    width: 104,
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  draftThumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: colors.border },
  logAgainTileMeta: { ...typography.caption, ...textShadow, color: colors.textMuted },

  // gap 10 (was 16), 2026-08-08 -- see content's own comment.
  ringRow: { flexDirection: 'row', gap: 10, paddingRight: 8 },

  // The three explanatory lines added 2026-08-29, when the gauges and the
  // mood orb were both reported as showing a number or a colour with
  // nothing saying what it meant. fuelGaugesOverLimit is deliberately the
  // one that carries a real warning colour, since it only ever renders
  // when something is genuinely past a published upper limit.
  fuelGaugesCaption: {
    ...typography.caption,
    ...textShadow,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
  },
  fuelGaugesOverLimit: {
    ...typography.caption,
    ...textShadow,
    color: colors.danger,
    lineHeight: 17,
    marginTop: 12,
  },
  // 2026-09-23. The amber the supplement stretch of a ring is drawn in,
  // so the line saying what that colour means is written in it.
  fuelGaugesSourceKey: {
    ...typography.caption,
    ...textShadow,
    color: colors.statusYellowOnSurface,
    lineHeight: 17,
    marginTop: 12,
  },
  orbCaption: {
    ...typography.caption,
    ...textShadow,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  // Today's Check-In. Its content is naturally left-aligned (the tag grid,
  // the prompt text), so its band takes no centring, unlike the orb and
  // the day arc.
  feelingPrompt: { ...typography.body, ...textShadow, marginBottom: 12 },
  feelingCategoryBlock: { marginBottom: 12 },
  feelingCategoryLabel: { ...typography.eyebrow, ...textShadow, color: colors.textMuted, marginBottom: 6,
    fontWeight: '400',
  },
  // gap 10 (was 8), 2026-08-08 -- see content's own comment.
  feelingTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  feelingTagChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
  },
  feelingTagText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  feelingTagTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  feelingActionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  feelingCancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feelingCancelButtonText: { ...typography.bodyEmphasis, ...textShadow, color: colors.textSecondary,
    fontWeight: '400',
  },
  feelingSaveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  feelingSaveButtonDisabled: { opacity: 0.5 },
  feelingSaveButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary,
    fontWeight: '400',

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  // Shown once today's entry already exists -- tapping it reopens the
  // picker (openFeelingPicker), pre-filled with what's already saved.
  feelingLoggedText: { ...typography.bodyEmphasis, ...textShadow,
    fontWeight: '400',
  },
  feelingChangeLink: { ...typography.caption, ...textShadow, color: colors.textMuted, marginTop: 2 },
  feelingStartButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  feelingStartButtonText: { ...typography.bodyEmphasis, ...textShadow,
    fontWeight: '400',
  },

  // Base color is a fallback only -- overridden inline with tabColorFor('/trends'), same reasoning as statNumber above.
  trendNumber: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  trendDelta: { ...typography.bodyEmphasis, ...textShadow, marginTop: 4,
    fontWeight: '400',
  },
  trendCaption: { ...typography.caption, ...textShadow, color: colors.textSecondary, marginTop: 4 },

  // gap 10 (was 12), 2026-08-08 -- see content's own comment. Inside the
  // Digest band since 2026-09-12: the row scrolls to the band's edges and
  // carries the band's own inset itself, the same as logAgainScroll/Row.
  flipRow: { flexDirection: 'row', gap: 10, paddingRight: HOME_BAND_CONTENT_PADDING },

  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 24 },
  modalBackdropTouchable: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  modalMeta: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 4 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,
    fontWeight: '400',

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, ...textShadow, color: colors.textSecondary,
    fontWeight: '400',
  },

  quickInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  quickInput: {
    ...typography.body,
    ...textShadow,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  quickInputSmall: { width: 70, textAlign: 'center' },
  quickInputSeparator: { ...typography.label, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flexShrink: 1 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
});
