import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { AppTextInput } from '../../components/AppTextInput';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DayArc } from '../../components/DayArc';
import { EDGE_SHADOW_HEIGHT, EdgeShadow } from '../../components/EdgeShadow';
import { EnergyOrb } from '../../components/EnergyOrb';
import { FlipCard } from '../../components/FlipCard';
import type { HelpSection } from '../../components/HelpButton';
import { AppActionSheet } from '../../components/AppActionSheet';
import { useInfoAlert } from '../../components/InfoAlert';
import { ProgressRing } from '../../components/ProgressRing';
import { PurpleRibbonIcon } from '../../components/PurpleRibbonIcon';
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
import { FLOATING_BUTTON_SIZE, useBottomLeftHubPosition, useFloatingButtonScrollPadding } from '../../constants/floatingButton';
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
import { ALL_DIGEST_ENTRIES, isProblemFoodEntry, type DigestCategoryKey } from '../../lib/digest';
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
  createMealPhotoDraft,
  deleteMealPhotoDraft,
  getCheckinForDate,
  getCuriousAboutConditions,
  getLastSeenAppVersion,
  getNutrientTotalsByDateRange,
  getSixDimensionsFlagCountsByDateRange,
  getUserConditions,
  getUserProfile,
  listCheckins,
  listMealPhotoDrafts,
  listMealsForDate,
  listScheduledMealsForDate,
  listSymptomAssessments,
  recordBodyMeasurement,
  recordCheckin,
  recordExercise,
  setLastSeenAppVersion,
  setScheduledMealSkipped,
  type CheckinValence,
  type MealPhotoDraft,
  type MealRecord,
  type ScheduleItemRecord,
  type WellbeingCheckin,
} from '../../lib/db';
import {
  analyzeNutrientIntake,
  findExcessRisks,
  findNutrientGaps,
  type NutrientGapEntry,
} from '../../lib/nutrientAnalysis';
import { formatTime12 } from '../../lib/timeOfDay';
import { getSixDimensionsFlagTrendSeries } from '../../lib/trendAnalysis';
import { ALL_HOME_SECTION_KEYS, getOrderedHomeSectionKeys, isHomeSectionVisible, type HomeSectionKey } from '../../lib/visualPreferences';
import { useVisualPreferences } from '../../hooks/useVisualPreferences';

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
  'Take it at your own pace',
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

// The greeting card's own sky-info row -- a plain 4-tone system reused for
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

// Fisher-Yates using the seeded generator above -- deterministic for a given
// seed, which is the whole point: the flip-card shelf is seeded once per app
// open, so its order is random each time the app starts and then stable while
// it is open, rather than reshuffling under someone on every re-render.
function seededShuffleIndices(length: number, seed: number): number[] {
  const random = mulberry32(seed);
  const indices = Array.from({ length }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
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
  scheduledToday: ScheduleItemRecord[];
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

type WeekTrend = { thisWeekCount: number; lastWeekCount: number | null };

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

// Small (typography.eyebrow -- the same "structural label, not content"
// tier LensHub/TabHub's own popup headers use) and pinned to the box's own
// top-left corner specifically so it reads as a label ON the box, not a
// second competing headline -- the box's own real content (a number, the
// day's arc, the rings) stays the visually dominant thing. Replaces the
// old pattern of a separate sectionHeadingChip floating above its own
// content card: every box below is now the single, self-contained unit
// the "Good evening" card already was, with this folded inside it instead
// of living as a second box above.
function CardLabel({ tabPath, text }: { tabPath: Href; text: string }) {
  const route = TAB_ROUTES.find((r) => r.path === tabPath);
  const color = route?.color ?? colors.primary;
  return (
    <View style={styles.cardLabelRow}>
      {route ? <Ionicons name={route.icon} size={11} color={color} style={textShadow} /> : null}
      <Text style={[styles.cardLabelText, textShadow, { color }]}>{text}</Text>
    </View>
  );
}

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
    body: "One glance at where today already stands, without opening five separate tabs to find out. This is the page you open first: your day's own schedule, whether today's nutrients are on track, and how you've been feeling, all refreshed the moment you open the app.",
  },
  {
    heading: 'What this page shows',
    body: "A live dashboard, not a static page: your day's arc, today's fuel gauges, and how you've been feeling, refreshed every time you open it. Tap anything to jump to the tab it summarizes.",
  },
  {
    heading: "Today's sky & weather",
    body: "A row of chips under the date. Moon phase and the next equinox/solstice countdown are computed directly on your phone using standard astronomical formulas; no location or network needed, so they're always shown. Sunrise, sunset, today's high and low temperature, humidity, UV index, and air quality (AQI) come from Open-Meteo, a free weather service, using the same location your Garden → My Zone already has saved, with no separate GPS permission required. The high/low chips turn red or cool blue-teal, with a 🥵/🥶 icon, only when today's forecast actually crosses a plain, disclosed threshold; this isn't an official government weather warning. Pollen is requested for any location, but only ever shows where the weather service actually has real data for it, which today means Europe; nothing is guessed or approximated for anywhere else (the US isn't covered by the free source this app uses right now). If a fetch genuinely fails, a chip says so directly (offline, a service error, or an unexpected response) rather than quietly showing old numbers as if they were current. Nothing shows here until you've set a growing zone in Garden → My Zone; tap the prompt chip to go straight there.",
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
    heading: 'Symptom check-in reminder',
    body: "The full symptom check-in (13 hypothyroid items, 5 digestive/IBS items, 5 wellbeing items) is a periodic, not daily, thing. A banner appears here automatically every 30 days (or the first time you haven't taken one at all) so it's easy to notice without having to remember. It stays available any time from the \"Symptom check-in\" button below, whether or not the banner is currently showing.",
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
    body: 'Certain foods and minerals (calcium and iron are well-documented examples) can interfere with how well a thyroid prescription is absorbed if eaten too close to a dose, which is part of why Schedules tracks meal, supplement, and prescription timing together. Digestion and absorption are also frequently disrupted in Hashimoto’s, which is why gut and microbiome support is treated as its own goal throughout this app.',
  },
  {
    heading: 'What Inside Story does',
    body: "Not a generic calorie counter. Inside Story exists to help someone with an autoimmune condition relearn how and what to eat, and understand how food affects their own body specifically. Hashimoto's is the first condition built out in full depth, with more autoimmune conditions in active development. Meals builds and scores meals; Insights shows how today stacks up; Schedules handles timing; Trends looks for patterns over time; Signals is where you record flares, reactions, and new foods; Reports turns it all into something to hand a doctor.",
  },
  {
    heading: 'Personal notes, not medical fact',
    body: "This page's education sections and your own Signals entries are general information and personal observation, not medical advice, and are not a substitute for care from your own doctor.",
  },
  {
    heading: 'Getting around',
    body: 'Tap a tab at the bottom to jump to it, or swipe left/right anywhere on a screen to move to the next or previous tab: Home, Meals, Insights, Schedules, Trends, Signals, Reports, in that order.',
  },
];

export default function HomeScreen() {
  useRegisterScreenHelp('Home', HOME_HELP_SECTIONS, '/');
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const bottomInset = useBackgroundBottomInset();
  // The Digest corner shortcut's own position -- same hook LensHub
  // uses internally, called here directly since this button is now a plain
  // TouchableOpacity rather than a LensHub instance (see that button's own
  // render/comment below).
  const purpleDigestShortcutPosition = useBottomLeftHubPosition();
  // Which of this screen's own content sections the person has chosen to
  // keep visible -- see HomeSectionKey's own comment in
  // lib/visualPreferences.ts for the full "let them dial in what they
  // want" reasoning. Read the same live way every other visual preference
  // already is, so a toggle flipped on Profile reaches Home immediately.
  const visualPrefs = useVisualPreferences();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Only ever opens when "Worth a look" is genuinely made of both kinds of
  // flag at once -- see handleWorthALookPress below.
  const [worthALookChoiceOpen, setWorthALookChoiceOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItemRecord | null>(null);
  const [quickLogModal, setQuickLogModal] = useState<'bp' | 'exercise' | null>(null);
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
  // Fixed once per mount, which is once per app open, so the shelf order is
  // random each time the app opens but stable while it is open. Regenerating it
  // on every render would reshuffle the shelf under someone mid-read.
  const [flipCardShelfSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  // The real scope of Home's own Digest flip cards, 2026-08-23 direct
  // request -- see digestFlipCardPool's own comment below for how these
  // two lists actually get used. Both start empty (matching "nothing
  // selected yet" honestly) rather than undefined, so the first render
  // before this loads still shows Basic Health content rather than an
  // empty or crashing pool.
  const [userConditionCodes, setUserConditionCodes] = useState<string[]>([]);
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
  // The greeting card's own collapse state, 2026-08-23 direct request:
  // full size for the first minute after Home first mounts ('initial',
  // in normal document flow, unchanged from before this), then
  // ('collapsed') a small floating seed-icon square pinned at the top
  // left, tap to reopen ('expanded', a semi-transparent floating overlay
  // on top of the rest of Home rather than back in document flow, since
  // the rest of Home has already moved up to fill the space by then),
  // auto-collapsing again after 30 seconds or a tap on its own small
  // seed badge. Plain useState, not tied to visualPreferences -- this is
  // moment-to-moment display state for the current session, not a saved
  // preference, the same way visibleFlipCardCount just above isn't one
  // either. Home stays mounted across tab switches (see
  // hasLoadedOnceRef's own comment above), so a timer started once here
  // genuinely means "once per app session," not "every time Home
  // refocuses."
  const [greetingCardState, setGreetingCardState] = useState<'initial' | 'collapsed' | 'expanded'>('initial');

  // Kept separate from `load` below -- getSixDimensionsFlagTrendSeries
  // loops one DB call per day over 14 days, so it's noticeably heavier
  // than the rest of Home's data. Still awaited together with `load`
  // below (Promise.all) before the loading gate ever lifts, though --
  // letting it resolve on its own after the gate already lifted was
  // exactly what made the week-trend caption visibly pop in a beat after
  // everything else, instead of the whole page appearing at once.
  const loadWeekTrend = useCallback(() => {
    return getSixDimensionsFlagTrendSeries(14).then((points) => {
      const thisWeekStart = dateStringDaysAgo(6);
      const thisWeekPoints = points.filter((point) => point.date >= thisWeekStart);
      const lastWeekPoints = points.filter((point) => point.date < thisWeekStart);
      if (thisWeekPoints.length === 0) {
        setWeekTrend(null);
        return;
      }
      const thisWeekCount = thisWeekPoints.reduce((sum, point) => sum + point.value, 0);
      const lastWeekCount = lastWeekPoints.length > 0 ? lastWeekPoints.reduce((sum, point) => sum + point.value, 0) : null;
      setWeekTrend({ thisWeekCount, lastWeekCount });
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
  const loadDigestConditionScope = useCallback(() => {
    return Promise.all([getUserConditions(), getCuriousAboutConditions()]).then(([owned, curious]) => {
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

        const lastAssessment = recentAssessments[0] ?? null;
        const daysSinceAssessment = lastAssessment
          ? Math.floor((Date.now() - new Date(lastAssessment.completedAt).getTime()) / (24 * 60 * 60 * 1000))
          : null;

        setData({
          todaysMeals,
          photoDrafts,
          scheduledToday,
          nutrientEntries,
          sixDsFlagCount,
          recentMaxSeverity,
          hasAnyLogHistory,
          feelingCheckin,
          daysSinceAssessment,
          checkinReminderDays: profile.checkinReminderDays,
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
      const isFirstLoad = !hasLoadedOnceRef.current;
      if (isFirstLoad) setLoading(true);
      Promise.all([load(), loadWeekTrend(), loadSkyData(), loadDigestConditionScope()]).then(() => {
        if (!isFirstLoad) return;
        hasLoadedOnceRef.current = true;
        setLoading(false);
        // Deliberately here, inside the first-load branch, rather than in
        // its own mount effect: this is the exact moment the startup
        // overlay is about to clear (markHomeDataReady below), so the
        // What's New popup lands over a ready Home screen instead of
        // racing the loading gate and appearing behind it.
        void announceAppliedUpdate();
        // 2026-08-16: the real fix for "the loading bar... was put in
        // place to hide the loading time of the home screen." Signals
        // app/_layout.tsx's own startup gate that Home's own first real
        // load is genuinely done, so DatabaseSetupScreen can finally
        // clear -- see lib/homeReadySignal.ts's own header comment for
        // the full "why."
        markHomeDataReady();
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [load, loadWeekTrend, loadSkyData, loadDigestConditionScope, announceAppliedUpdate]),
  );

  // Plain useEffect (mount-once), not useFocusEffect -- this is meant to
  // fire once per real app open, not restart every time someone swipes
  // back to Home from another tab (see the dedicated blur effect further
  // below for that specific behavior). Only actually collapses if still
  // 'initial' by the time this fires, so a person who's already tapped
  // the corner badge to collapse it manually before the 30 seconds are up
  // isn't yanked back into a re-collapse of a state they already left.
  // 30000ms, 2026-08-23 direct follow-up (was 60000) -- now the same
  // duration the 'expanded' auto-close below already uses, though kept as
  // its own separate effect regardless, since they're conceptually
  // different triggers (first display vs. a tap-triggered reopen) that
  // happen to currently share one number, not the same event.
  useEffect(() => {
    const timer = setTimeout(() => {
      setGreetingCardState((current) => (current === 'initial' ? 'collapsed' : current));
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  // Separate effect keyed on greetingCardState itself -- the 30-second
  // auto-close here only ever applies to a tap-triggered reopen, re-armed
  // every time greetingCardState actually becomes 'expanded' again,
  // cleared (and not fired) if it leaves 'expanded' before the 30 seconds
  // are up, whether from this same timer or a manual tap on the corner
  // badge.
  useEffect(() => {
    if (greetingCardState !== 'expanded') return;
    const timer = setTimeout(() => setGreetingCardState('collapsed'), 30000);
    return () => clearTimeout(timer);
  }, [greetingCardState]);

  // 2026-08-23, direct request: "if the user swipes to either side or
  // chooses another tab, the welcome shrinks right then and stays shrunk
  // until they select it again." useFocusEffect's own cleanup function
  // (the part a plain useEffect doesn't have) fires exactly on blur --
  // leaving Home for another tab, by swipe or by TabHub -- which is
  // precisely the moment this needs to act. Setting 'collapsed'
  // unconditionally here is deliberately safe even when it's already
  // collapsed (a no-op re-set, not a bug), so this doesn't need to read
  // the current state first. Home staying mounted across tab switches
  // (see hasLoadedOnceRef's own comment) is exactly what makes "stays
  // shrunk until they select it again" true for free -- there's no
  // remount here to reset it back.
  useFocusEffect(
    useCallback(() => {
      return () => setGreetingCardState('collapsed');
    }, []),
  );

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
  // Both kinds of randomness are seeded rather than Math.random() at render
  // time, for the same reason the daily shuffle this replaced was: an unseeded
  // pick would land on a different entry on every single re-render, so a card
  // would change under someone the moment anything else on Home updated. The
  // shelf order is seeded per app open, and each card's entry is seeded by its
  // own group plus the rotation counter, so a card only moves when 15 minutes
  // have genuinely passed.
  const visibleFlipCards = useMemo(() => {
    const shelfOrder = seededShuffleIndices(flipCardGroups.length, flipCardShelfSeed);
    return shelfOrder.map((groupIndex) => {
      const group = flipCardGroups[groupIndex];
      const random = mulberry32(flipCardShelfSeed + flipCardRotation * 7919 + groupIndex * 104729);
      const entry = group.entries[Math.floor(random() * group.entries.length)];
      // Keyed by group as well as entry: two groups could in principle surface
      // the same entry id, and a duplicate React key would drop a card.
      return { ...entry, groupKey: group.category };
    });
  }, [flipCardGroups, flipCardShelfSeed, flipCardRotation]);

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

  // Shared between the card's two full-size states ('initial', in normal
  // document flow, and 'expanded', a floating overlay) -- the actual
  // greeting/date/affirmation/weather content never changes between them,
  // only where and how the card itself is positioned does. Split into a
  // header row (badge plus greeting/affirmation/date, side by side, so
  // the badge genuinely sits in the card's own top left corner rather
  // than floating over the text) and the weather grid below it, spanning
  // the card's own full width rather than being squeezed into the
  // header row's narrower text column.
  function renderGreetingCardFull() {
    return (
      <>
        <View style={styles.greetingCardRow}>
          {renderGreetingSeedBadge('collapse')}
          <View style={styles.greetingCardTextCol}>
            <Text style={styles.greetingText}>
              {timeGreeting()}
              {firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.affirmationText}>{pickAffirmation()}</Text>
            <Text style={styles.dateText}>{todayLabel}</Text>
          </View>
        </View>

        {isHomeSectionVisible(visualPrefs, 'weather') ? (
          <View style={styles.skyGrid}>
            {skyGridItems.map((item, index) => (
              <SkyGridItem key={index} {...item} />
            ))}
          </View>
        ) : null}
      </>
    );
  }

  // The small seed-icon badge, 2026-08-23 direct request: "make sure the
  // sprouting seed default TabHub button continues to be used... Make it
  // have that as a small version of it on the top left corner of the
  // card, and then it shrinks into that sprouting seed on a little
  // square." One shared render function rather than three near-identical
  // copies (the badge sitting in the corner of both full-size states,
  // plus the collapsed state's own standalone square) -- same asset the
  // TabHub button's own default icon already uses
  // (assets/branding/seed-tall-transparent.png), not a new icon
  // commissioned for this. Always the tap target that collapses the
  // card, in every state it appears in.
  // Reused in two different contexts with two different taps: sitting in
  // the corner of a full-size card, it collapses; standing on its own as
  // the resting collapsed state, it expands. A plain parameter rather
  // than a fixed 'collapse' behavior baked in, since a badge that always
  // collapsed would have silently done nothing (already collapsed, tap
  // ignored) the one time it actually needs to reopen the card.
  //
  // 2026-08-23, direct follow-up: "while it is visible, the sprout is
  // full color and only goes to 50% transparency after." action already
  // encodes exactly this distinction, action === 'collapse' only ever
  // happens while the card itself is currently full-size and visible
  // (that's the only context this badge collapses anything from), and
  // action === 'expand' only ever happens once it's already shrunk down
  // to just this badge on its own -- so dimmed is derived from action
  // directly rather than threading a second, separately-tracked prop
  // that would only ever move in lockstep with the one already here.
  function renderGreetingSeedBadge(action: 'collapse' | 'expand') {
    const dimmed = action === 'expand';
    return (
      <TouchableOpacity
        onPress={() => setGreetingCardState(action === 'collapse' ? 'collapsed' : 'expanded')}
        activeOpacity={0.8}
        style={styles.greetingSeedBadge}
        accessibilityRole="button"
        accessibilityLabel={action === 'collapse' ? 'Collapse the greeting card' : 'Expand the greeting card'}
      >
        <Image
          source={require('../../assets/branding/seed-tall-transparent.png')}
          style={[styles.greetingSeedIcon, dimmed && styles.greetingSeedIconDimmed]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }

  // 2026-08-23, direct request: "they should be able to move the things
  // on the home screen they have chosen to be there into any order they
  // want to from top to bottom, except the welcome box." Every
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
  function renderSymptomCheckinReminder() {
    if (!assessmentDue || !isHomeSectionVisible(visualPrefs, 'symptomCheckinReminder')) return null;
    return (
      <TouchableOpacity style={styles.assessmentDueBanner} onPress={() => router.push('/assessment')} activeOpacity={0.85}>
        <Ionicons name="pulse-outline" size={20} color={colors.primary} />
        <View style={styles.assessmentDueTextCol}>
          <Text style={styles.assessmentDueTitle}>
            {data?.daysSinceAssessment == null ? 'Take your first symptom check-in' : 'Time for your symptom check-in'}
          </Text>
          <Text style={styles.assessmentDueSubtitle}>
            {data?.daysSinceAssessment == null
              ? "A few minutes now becomes a baseline to compare against next time."
              : `It's been ${data.daysSinceAssessment} days since your last one. Retaking it is what turns today into a trend.`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>
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
    return (
      <View style={[styles.feelingCard, { borderColor: tabColorFor('/log') }]}>
        <CardLabel tabPath="/log" text="Today's Check-In" />
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
      </View>
    );
  }

  function renderYourDay() {
    if (!isHomeSectionVisible(visualPrefs, 'yourDay')) return null;
    return (
      <View style={[styles.arcCard, { borderColor: tabColorFor('/schedule') }]}>
        <CardLabel tabPath="/schedule" text="Your Day" />
        <DayArc items={data?.scheduledToday ?? []} onPressItem={setSelectedItem} labelColor={tabColorFor('/schedule')} />
        <Text style={[styles.arcCaption, { color: tabColorFor('/schedule') }]}>
          {upNext
            ? upNext.isPast
              ? `${upNext.item.title} was due ${formatTime12(upNext.item.scheduledFor.slice(11, 16))}: anything to log?`
              : `Next: ${upNext.item.title} at ${formatTime12(upNext.item.scheduledFor.slice(11, 16))}`
            : 'Nothing scheduled yet today.'}
        </Text>
      </View>
    );
  }

  function renderStatTiles() {
    if (!isHomeSectionVisible(visualPrefs, 'statTiles')) return null;
    return (
      <View style={styles.statRow}>
        {/* 2026-08-29, direct report: this "just goes to the My Foods
            screen and the person doesn't know where to go from there."
            Correct -- it navigated to /food, which rests on the Desktop
            menu, so the count it had just shown led nowhere. The meals
            behind this number are today's meals, so it opens Schedule's
            Today's Meals lens: the whole day in time order, each one
            openable to its ingredients and steps. It briefly pointed at
            Past Meals instead, which was closer than the Desktop menu but
            still the wrong question, since that lens is for correcting the
            record rather than cooking from it. */}
        <TouchableOpacity
          style={[styles.statTile, { borderColor: tabColorFor('/schedule') }]}
          onPress={() => router.navigate({ pathname: '/schedule', params: { openScheduleLens: 'todaysMeals' } })}
          activeOpacity={0.75}
        >
          {/* Carries Schedule's colour and icon rather than Food's, since
              CardLabel draws the destination tab's own icon, and a Food
              icon on a tile that opens Schedule would be its own small lie. */}
          <CardLabel tabPath="/schedule" text={mealsLoggedToday === 1 ? 'Meal logged today' : 'Meals logged today'} />
          <Text style={[styles.statNumber, { color: tabColorFor('/schedule') }]}>{mealsLoggedToday}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statTile, { borderColor: tabColorFor('/insights') }]}
          onPress={handleWorthALookPress}
          activeOpacity={0.75}
        >
          <CardLabel tabPath="/insights" text="Worth a look" />
          <Text
            style={[
              styles.statNumber,
              { color: tabColorFor('/insights') },
              worthALookCount > 0 && styles.statNumberFlagged,
            ]}
          >
            {mealsLoggedToday === 0 ? '—' : worthALookCount}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderQuickActions() {
    if (!isHomeSectionVisible(visualPrefs, 'quickActions')) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.fullBleedScroll}
        contentContainerStyle={styles.quickActionsRow}
      >
        {/* Daily check-in is now first, 2026-07-28 -- explicitly
            requested reorder, Log a meal moved to second (right after
            this one, unchanged otherwise). Deliberately left the generic
            colors.primary, not tab-colored like the others below -- it
            opens Assessment, a standalone screen outside TAB_ROUTES
            entirely (see TabHub.tsx's own profileActive comment for the
            same "not really a tab" situation), so there's no real tab
            color to borrow here.
            Relabeled "Symptom check-in," 2026-08-08 -- this opens the
            full periodic assessment (30 real questions across 3
            domains), which was never actually a daily action; "Daily
            check-in" became genuinely misleading once a real daily
            action (Today's Check-In, above) exists on this same page.
            This pill still opens the same assessment as always -- just
            named for what it actually is, available any time regardless
            of whether the new 30-day due banner above is currently
            showing. */}
        <TouchableOpacity style={styles.quickActionSecondary} onPress={() => router.push('/assessment')} activeOpacity={0.85}>
          <Ionicons name="pulse-outline" size={18} color={colors.primary} />
          <Text style={styles.quickActionSecondaryText}>Symptom check-in</Text>
        </TouchableOpacity>
        {/* Reverted the solid green fill, same day -- just the
            border/icon/text carry Food's color now, matching every
            secondary pill's own outline treatment instead of standing
            out as a differently-colored filled button. */}
        <TouchableOpacity
          style={[styles.quickActionSecondary, { borderColor: tabColorFor('/food') }]}
          onPress={() => router.navigate('/food')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color={tabColorFor('/food')} />
          <Text style={[styles.quickActionSecondaryText, { color: tabColorFor('/food') }]}>Log a meal</Text>
        </TouchableOpacity>
        {/* "Scan a Product," 2026-08-17 -- a real shortcut to the
            barcode-scanning screen (app/scan-product.tsx), moved here
            directly per its own explicit request: "having a shortcut to
            it on the Home screen seems appropriate." Food-colored, same
            as "Log a meal" right above it -- the screen it opens is
            reached from Food's own "My Foods" menu and lives entirely
            within that tab's own real identity, even though it's a
            standalone Stack screen, not a Food-tab lens. */}
        <TouchableOpacity
          style={[styles.quickActionSecondary, { borderColor: tabColorFor('/food') }]}
          onPress={() => router.push('/scan-product')}
          activeOpacity={0.85}
        >
          <Ionicons name="barcode-outline" size={18} color={tabColorFor('/food')} />
          <Text style={[styles.quickActionSecondaryText, { color: tabColorFor('/food') }]}>Scan a product</Text>
        </TouchableOpacity>
        {/* These three all write to Signals's own data (flares, and
            blood pressure/exercise under its Other lens) -- explicitly
            requested, 2026-07-27, so a pill's own color matches where
            its data actually lives, the same tab-color consistency
            already applied to every info box above. Blood
            pressure/exercise open a local modal rather than literally
            navigating to /log, but the data they save is Signals's
            regardless. */}
        <TouchableOpacity
          style={[styles.quickActionSecondary, { borderColor: tabColorFor('/log') }]}
          onPress={() => router.navigate('/log')}
          activeOpacity={0.85}
        >
          <Ionicons name="flame-outline" size={18} color={tabColorFor('/log')} />
          <Text style={[styles.quickActionSecondaryText, { color: tabColorFor('/log') }]}>Log a flare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionSecondary, { borderColor: tabColorFor('/log') }]}
          onPress={() => setQuickLogModal('bp')}
          activeOpacity={0.85}
        >
          <Ionicons name="heart-outline" size={18} color={tabColorFor('/log')} />
          <Text style={[styles.quickActionSecondaryText, { color: tabColorFor('/log') }]}>Log blood pressure</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionSecondary, { borderColor: tabColorFor('/log') }]}
          onPress={() => setQuickLogModal('exercise')}
          activeOpacity={0.85}
        >
          <Ionicons name="walk-outline" size={18} color={tabColorFor('/log')} />
          <Text style={[styles.quickActionSecondaryText, { color: tabColorFor('/log') }]}>Log exercise</Text>
        </TouchableOpacity>
      </ScrollView>
    );
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
    return (
      <View style={[styles.orbCard, { borderColor: tabColorFor('/log') }]}>
        <CardLabel tabPath="/log" text="How You're Feeling" />
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
      </View>
    );
  }

  function renderFuelGauges() {
    if (!isHomeSectionVisible(visualPrefs, 'fuelGauges')) return null;
    if (mealsLoggedToday === 0) {
      return (
        <View style={[styles.emptyCard, { borderColor: tabColorFor('/insights') }]}>
          <CardLabel tabPath="/insights" text="Today's Fuel Gauges" />
          <Text style={[styles.emptyText, { color: tabColorFor('/insights') }]}>Log a meal to see today's fuel gauges fill in.</Text>
        </View>
      );
    }
    return (
      <View style={[styles.fuelGaugesCard, { borderColor: tabColorFor('/insights') }]}>
        <CardLabel tabPath="/insights" text="Today's Fuel Gauges" />
        {/* 2026-08-29, direct report: "needs to explain what the
            percentages represent. Is it so far today, or does it represent
            how much they will have all day." Confirmed by reading
            analyzeNutrientIntake: it is what has actually been logged so
            far (food plus supplements) against the whole day's target, so
            it climbs as the day goes on. Nothing is projected. */}
        <Text style={[styles.fuelGaugesCaption, { color: tabColorFor('/insights') }]}>
          Percent of your whole day&apos;s target, from what you have logged so far today. These climb as you log
          more, so a low number early is normal.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
          {coreNutrientRings.map((entry) => {
            const ringColors = nutrientRingColors(entry);
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
                  label={entry.displayName}
                  sublabel={`${Math.round(entry.percentOfTarget)}%`}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {overLimitNutrients.length > 0 ? (
          <Text style={styles.fuelGaugesOverLimit}>
            {`Over a safe upper limit today: ${overLimitNutrients.map((entry) => entry.displayName).join(', ')}. Tap through for the detail.`}
          </Text>
        ) : null}
      </View>
    );
  }

  function renderWeekTrend() {
    if (!weekTrend || !isHomeSectionVisible(visualPrefs, 'weekTrend')) return null;
    return (
      <TouchableOpacity
        style={[styles.trendCard, { borderColor: tabColorFor('/trends') }]}
        onPress={() => router.navigate('/trends')}
        activeOpacity={0.75}
      >
        <CardLabel tabPath="/trends" text="This Week's Trend" />
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
        <Text style={[styles.trendCaption, { color: tabColorFor('/trends') }]}>Tap to see Trends →</Text>
      </TouchableOpacity>
    );
  }

  // Explicitly requested, 2026-07-27: no header above this row ("A Few
  // Things Worth Knowing" is gone) -- the ribbon icon/purple coloring on
  // the cards themselves, plus the "More from The Digest" card at the
  // end, already say what this is without a label spelling it out too.
  // See digestFlipCardPool's own comment (top of file) for the bigger
  // change this is part of, 2026-08-23: real Digest entries, scoped to
  // Basic Health plus the person's own conditions, rather than a fixed
  // hand-written array, reshuffled daily, with more revealed on tap
  // rather than shown all at once.
  function renderDigestCards() {
    if (!isHomeSectionVisible(visualPrefs, 'digestCards')) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.fullBleedScroll]}
        contentContainerStyle={styles.flipRow}
      >
        {/* No "more from the Digest" card any more: the shelf is now every
            group the person actually has, so there is nothing being held back
            to reveal. Each card moves to a different entry from its own group
            every 15 minutes instead. */}
        {visibleFlipCards.map((card) => (
          <FlipCard
            key={card.groupKey}
            icon={<PurpleRibbonIcon size={28} color={colors.tabPurpleDigest} />}
            hook={card.hook}
            backTitle={card.backTitle}
            backBody={card.backBody}
            onReadMore={() => router.push({ pathname: '/purple-digest', params: { openEntryId: card.id } })}
            borderColor={colors.tabPurpleDigest}
          />
        ))}
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
            "You can turn this on in your device's own Settings, under this app's permissions.",
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
    return (
      <View style={[styles.logAgainCard, { borderColor: foodColor }]}>
        <CardLabel tabPath="/food" text="Log a Meal" />
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
          onPress={() => setPhotoSourceSheetOpen(true)}
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
          onPress={() => router.push('/find-meal')}
        >
          <Ionicons name="restaurant-outline" size={18} color={foodColor} style={textShadow} />
          <Text style={[styles.logAgainSpeakText, { color: foodColor }]}>Find a meal</Text>
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
      </View>
    );
  }

  // Single dispatcher rather than a Record<HomeSectionKey, fn> object --
  // this only ever gets called with a REORDERABLE_HOME_SECTION_KEYS
  // member (see getOrderedHomeSectionKeys), never 'weather' (which stays
  // embedded in the fixed greeting card, not part of this reorderable
  // list at all), so the default branch below covering 'weather' is a
  // real, deliberate safety net, not a case actually expected to fire.
  function renderHomeSection(key: HomeSectionKey) {
    switch (key) {
      case 'symptomCheckinReminder':
        return renderSymptomCheckinReminder();
      case 'todaysCheckin':
        return renderTodaysCheckin();
      case 'logAgain':
        return renderLogAgain();
      case 'yourDay':
        return renderYourDay();
      case 'statTiles':
        return renderStatTiles();
      case 'quickActions':
        return renderQuickActions();
      case 'howYoureFeeling':
        return renderHowYoureFeeling();
      case 'fuelGauges':
        return renderFuelGauges();
      case 'weekTrend':
        return renderWeekTrend();
      case 'digestCards':
        return renderDigestCards();
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
                  pathname: '/find-meal',
                  params: { draftId: draft.id, photoUri: draft.photoUri, capturedAt: draft.capturedAt },
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
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        >
          {greetingCardState === 'initial' ? (
            <View style={styles.greetingCard}>{renderGreetingCardFull()}</View>
          ) : null}

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading today…</Text>
            </View>
          ) : (
            <>
              {getOrderedHomeSectionKeys(visualPrefs).map((key) => (
                <Fragment key={key}>{renderHomeSection(key)}</Fragment>
              ))}
            </>
          )}

          {/* 2026-08-21, direct request alongside the section toggles
              above: "they may end up wanting everything, or even
              nothing." A person who has genuinely turned every real
              content section off (not just the current loading/empty
              states any individual section already handles on its own)
              gets a plain, honest explanation here instead of a mostly-
              blank screen that reads as broken. Only checks the 10 real
              toggleable keys -- the greeting/date text above always
              stays, so this never fires on a technically-empty-but-not-
              really-empty page. */}
          {!loading && ALL_HOME_SECTION_KEYS.every((key) => !isHomeSectionVisible(visualPrefs, key)) ? (
            <View style={styles.allSectionsHiddenCard}>
              <Text style={styles.allSectionsHiddenText}>
                Every section here is turned off. Head to Profile → Home Screen to turn any of them back on.
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

        {/* The greeting card's own collapsed/expanded states, 2026-08-23
            direct request -- both real siblings of the ScrollView above,
            not inside it, same "floats over the scrollable content"
            technique bottomMask/EdgeShadow already use on this exact
            screen. 'collapsed': just the small seed badge, pinned at the
            top left of contentArea (which itself already starts below
            ScreenHeader, see that style's own comment, so no separate
            safe-area math is needed here). 'expanded': the full card
            again, at the same top-left origin so it visibly grows back
            out of the badge it came from, but now floating over
            everything else that has already moved up to fill the space
            the card used to occupy in normal flow, and a little more
            transparent than the resting card look so it reads as a
            temporary overlay rather than a permanent fixture. */}
        {greetingCardState === 'collapsed' ? (
          <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={styles.greetingCollapsedWrap}>
            {renderGreetingSeedBadge('expand')}
          </Animated.View>
        ) : null}
        {greetingCardState === 'expanded' ? (
          <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={styles.greetingExpandedCard}>
            {renderGreetingCardFull()}
          </Animated.View>
        ) : null}
        </View>
      </SwipeableTabScreen>

      <TouchableOpacity
        style={[styles.purpleDigestShortcut, purpleDigestShortcutPosition]}
        // openLensHub query param, 2026-08-08 -- same mechanism TabHub's
        // own go() now uses (see that file's comment), so this shortcut
        // lands on Digest with its own LensHub already open too,
        // exactly like tapping "Digest" from TabHub itself would.
        onPress={() => router.push(`/purple-digest?openLensHub=${Date.now()}` as Href)}
        activeOpacity={0.85}
        accessibilityLabel="Open The Digest"
      >
        {/* 2026-08-30: the same icon slot LensHub's own corner button now
            reserves. Every other tab's corner label sits below a 60px slot
            (whether or not the ring is showing), so this one rendering a bare
            32px glyph left "Digest" sitting higher than the label on every
            other tab. Direct report: "You missed the Digest icon on the Home
            screen for the label jump problem." */}
        <View style={styles.purpleDigestIconSlot}>
          <PurpleRibbonIcon size={32} color={colors.tabPurpleDigest} />
        </View>
        <Text style={[styles.purpleDigestShortcutLabel, { color: colors.tabPurpleDigest }]} numberOfLines={1}>
          Digest
        </Text>
      </TouchableOpacity>

      <Modal visible={selectedItem != null} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
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

        <Modal visible={quickLogModal != null} transparent animationType="fade" onRequestClose={closeQuickLogModal}>
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
// Also explicitly requested, same day: with borders now carrying real
// meaning (which tab a box belongs to, see CardLabel/tabColorFor above),
// several of the tab palette's own colors read as too close to tell apart
// at the previous 1px width -- thickened to make the actual hue easier to
// read at a glance, on every box whose border color is dynamically set to
// a tab color.
//
// 2026-08-23, direct follow-up report: "line thicknesses need to be
// consistent... many different thicknesses here and there." The plain
// colors.border boxes (greetingCard, loadingCard, allSectionsHiddenCard)
// were originally left at 1px, since their own border carries no tab-color
// meaning to make legible -- reasonable at the time, but it read as
// inconsistent once actually seen next to every tab-colored card on the
// same screen. All of this screen's primary content cards now share this
// same width; only small controls (pills, chips, buttons, the text input)
// stay at a separate, deliberately thinner 1px, so a large card and a
// small tappable control don't compete for the same visual weight.
const TAB_BORDER_WIDTH = 2;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // Same footprint/shadow treatment as LensHub's own corner button at rest
  // (components/LensHub.tsx's own `button`/`buttonLabel` styles) -- this
  // replaced a real LensHub instance, 2026-08-05, so it should still read
  // as "the same kind of button," just without a popup behind it.
  purpleDigestShortcut: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purpleDigestIconSlot: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // No fill, 2026-08-30, direct request: "It is the Digest icon located on the
  // Home tab that the name Digest has a background behind it... remove both
  // backgrounds." It had carried one since the 2026-08-29 no-bare-text sweep,
  // which was right by that rule and wrong in effect: a pill behind a corner
  // control's own one-word label reads as a badge stuck to the screen. This is a
  // named exception in scripts/audit_bare_text_on_background.js rather than a
  // silent one. Legibility rests on textShadow, the same as the hub labels
  // beside it.
  purpleDigestShortcutLabel: {
    ...typography.caption,
    ...textShadow,
    fontSize: 11,
    marginTop: 2,
  },
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
  // paddingTop: a little separation between the header and the greeting
  // card below it, present from the start (not just something scrolling
  // reveals) -- otherwise the greeting card sits flush against the header
  // the instant the page loads.
  // 2026-08-08, explicitly requested: "the individual boxes and buttons per
  // rows [should] be the same 10 pixel distance away from each other...
  // both vertically and horizontally." `gap` here is the vertical half of
  // that -- applies uniformly between every direct top-level child of this
  // ScrollView's content (greetingCard, the assessment-due banner, Today's
  // Check-In, the Day Arc, the stat tiles row, the quick-actions row, the
  // mood orb, fuel gauges, this week's trend, the flip-card row), including
  // correctly skipping a gap on either side of any that don't render at all
  // right now (the due banner, trendCard) -- a real advantage over each
  // element carrying its own marginTop by hand, which is what every one of
  // those used to do (several different values -- 16, 24 -- not even
  // consistent with each other before this). The horizontal half of the
  // same request is each row's own `gap` (statRow/quickActionsRow/ringRow/
  // flipRow/feelingTagRow below), normalized to this same 10.
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 10 },
  // Same colors.surface "dark blue" card used everywhere else on this page
  // (arcCard, statTile, trendCard, etc.) -- every text-bearing element on
  // Home sits on this same box now, since the background underneath is a
  // photo (not the flat navy colors.background), and textPrimary's light
  // cream reads poorly floating over the photo's brighter patches.
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
  loadingText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  // Same card treatment as loadingCard above (plain surface/border, no
  // per-tab color -- this isn't about any one tab), shown only once every
  // real Home section has been individually turned off from Profile.
  allSectionsHiddenCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
    marginTop: 12,
  },
  allSectionsHiddenText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  greetingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
    // marginBottom removed, 2026-08-08 -- content's own new `gap: 10`
    // handles the space after this now; keeping this too would have
    // stacked on top of it (26px instead of the real, intended 10).
  },
  greetingText: { ...typography.screenTitle, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  affirmationText: { ...typography.body, ...textShadow, color: colors.primary, marginTop: 2, fontStyle: 'italic' },
  dateText: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 2 },

  // 2026-08-23: the greeting card's own collapse/expand system. See
  // greetingCardState's own comment near this screen's other state for
  // the full behavior; these are just the visual pieces.
  greetingCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  greetingCardTextCol: { flex: 1 },
  // The seed badge itself -- same size as this app's own established
  // floating-button footprint (FLOATING_BUTTON_SIZE), not a new number,
  // so it reads as belonging to the same family of floating controls as
  // TabHub's own corner button rather than a one-off size. 2026-08-23,
  // direct follow-up: "the sprout has a transparent background
  // completely and no border around the square... make the sprout about
  // 50% transparent, too." No fill, no border left on the square itself
  // -- it's purely a tap target now, the icon alone is what's actually
  // seen. Still the same width/height/borderRadius, so the tappable area
  // (and where the card visually shrinks into/grows out of) is unchanged.
  greetingSeedBadge: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // opacity lives on the icon, not on greetingSeedBadge itself -- this
  // app's own established split (see FlipCard's own borderColor prop
  // comment, and the greeting card's own expanded-overlay opacity
  // comment) between the interactive element and what's actually drawn,
  // so the tap target's own hit area never shrinks or fades along with
  // the icon's look. Full color (no opacity here at all) by default,
  // 2026-08-23 direct follow-up: "while it is visible, the sprout is
  // full color and only goes to 50% transparency after" -- see
  // renderGreetingSeedBadge's own comment for exactly when
  // greetingSeedIconDimmed below applies instead.
  greetingSeedIcon: { width: 32, height: 38 },
  greetingSeedIconDimmed: { opacity: 0.5 },
  // 2026-08-23, direct follow-up: "it should go farther into the corner,
  // sort of in the margin. It needs to be visible but not take away from
  // the other things as much as possible." Moved from matching content's
  // own left/top padding (where the full card itself still starts, see
  // greetingCard/greetingExpandedCard below, both unchanged) to sitting
  // almost flush with the true screen edge instead, once it's shrunk down
  // to just this badge -- a deliberately different, smaller offset than
  // the full card's own, not the same constant reused.
  // 2026-08-24, direct follow-up: "move the shrunken sprout farther left
  // and a little bit higher... Left by about 5 to 10 pixels and up by
  // about 3 to 5." Given as a range, not one exact number -- landed near
  // the middle of each (7px left, 4px up).
  greetingCollapsedWrap: { position: 'absolute', top: 0, left: -3 },
  greetingExpandedCard: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    // 2026-08-23, direct report, second round: dropping this card's own
    // opacity: 0.92 helped ("that's a little better") but colors.surface
    // itself is only ~85% opaque by design (see that token's own comment)
    // -- fine for a card sitting in the normal page flow, not solid
    // enough for one floating directly on top of everything else, which
    // is exactly what "should be even less transparent" asked for next.
    // colors.menuSurface instead: a fully opaque color (no alpha
    // channel at all) already established in this app for exactly this
    // "needs to read as solid, not translucent" job (see that token's own
    // comment -- TabHub's own popup menu was deliberately kept opaque
    // the same way). Not theme-reactive the way colors.surface is (one
    // fixed color regardless of the person's own chosen ground theme), an
    // accepted tradeoff for a card whose whole point right now is
    // reading as solid above everything else, not matching the ground
    // theme precisely.
    backgroundColor: colors.menuSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },

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
  // CardLabel's own row -- alignSelf: 'flex-start' so it hugs the box's
  // own left edge even inside a parent using alignItems: 'center'
  // (arcCard, fuelGaugesCard, orbCard all center their real content).
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 8 },
  // Color set inline per box (see CardLabel) to match that box's own tab.
  cardLabelText: { ...typography.eyebrow, ...textShadow,
    fontWeight: '400',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
  emptyText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  arcCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
    alignItems: 'center',
  },
  // Stays neutral (colors.textSecondary), not tab-colored -- unlike
  // statNumber/trendNumber below, this is a full descriptive sentence, not
  // a short bold headline number, and a full paragraph in a saturated
  // brand color reads worse for readability than an accent used sparingly.
  // The card's own border + CardLabel already carry the tab-color signal.
  arcCaption: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },

  // gap 10 (was 12), marginTop removed (content's own gap: 10 handles the
  // space before this row now) -- 2026-08-08, see content's own comment.
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
  // Base color (textPrimary) is a fallback only -- both call sites override
  // it inline with that tile's own tabColorFor(...) (2026-07-27, explicitly
  // requested: the big headline number itself should carry the tab color
  // too, not just the small CardLabel above it, for real consistency
  // across every info box). "Worth a look" layers statNumberFlagged on top
  // of that when there's something to flag -- a semantic warning color
  // deliberately takes priority over the tab's own identity color there.
  statNumber: { ...typography.screenTitle, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  statNumberFlagged: { color: colors.statusFlagged },

  // Cancels `content`'s own paddingHorizontal: 20 on the ScrollView itself
  // (not its contentContainerStyle), so the scrollable viewport spans the
  // true screen width -- otherwise a horizontal row nested inside the
  // padded page content can only ever scroll within that narrower inset,
  // clipping the last item's edge instead of letting it reach the real
  // screen edge. contentContainerStyle re-adds the same 20px as visual
  // padding so the row still starts/ends flush with everything else at
  // rest; only the *scrollable* viewport is full-bleed, not the resting look.
  fullBleedScroll: { marginHorizontal: -20 },
  // marginTop removed, 2026-08-08 -- content's own gap: 10 handles the
  // space before this row now; gap was already 10, unchanged.
  quickActionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickActionSecondaryText: { ...typography.bodyEmphasis, ...textShadow, color: colors.primary,
    fontWeight: '400',
  },

  // Log Again (quick-log phase 1), 2026-08-30. One surface holds the whole
  // section, its heading included, per the standing "no text sits directly on
  // the tab background" rule: a label that names one card belongs inside that
  // card rather than floating above it.
  logAgainCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
    gap: 10,
  },
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
  // to the content instead. Same technique as fullBleedScroll above, scoped
  // to this one card rather than the whole screen.
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

  fuelGaugesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
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
  orbCaption: {
    ...typography.caption,
    ...textShadow,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  orbCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },

  // The periodic-assessment due banner -- colors.primary throughout (same
  // "no real tab owns this" reasoning as the Symptom check-in pill below
  // it), deliberately more attention-grabbing than a plain info card
  // (solid-tinted background, not just a bordered surface card) since the
  // whole point is that it's hard to miss.
  assessmentDueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryMuted,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.primary,
  },
  assessmentDueTextCol: { flex: 1 },
  assessmentDueTitle: { ...typography.bodyEmphasis, ...textShadow, color: colors.primary,
    fontWeight: '400',
  },
  assessmentDueSubtitle: { ...typography.caption, ...textShadow, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },

  // Today's Check-In -- same card shape as orbCard/fuelGaugesCard above,
  // alignItems left at the default (stretch) rather than orbCard's own
  // 'center', since this one's real content (the tag grid, the prompt
  // text) is naturally left-aligned, not a single centered widget.
  feelingCard: {
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
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

  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
  // Base color is a fallback only -- overridden inline with tabColorFor('/trends'), same reasoning as statNumber above.
  trendNumber: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary,
    fontWeight: '400',
  },
  trendDelta: { ...typography.bodyEmphasis, ...textShadow, marginTop: 4,
    fontWeight: '400',
  },
  trendCaption: { ...typography.caption, ...textShadow, color: colors.textSecondary, marginTop: 4 },

  // gap 10 (was 12), 2026-08-08 -- see content's own comment.
  flipRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 8 },
  // Same footprint as FlipCard's own default width/height (220x260) so it
  // sits in this row as an equal, not an odd one out -- a plain button,
  // not a flip card itself (no back face, no flip animation), dashed
  // border to read as "tap for more," not "here's a fact."
  moreFlipCard: {
    width: 220,
    height: 260,
    borderRadius: 18,
    borderWidth: TAB_BORDER_WIDTH,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    // Filled so its label is not sitting on the photo background.
    backgroundColor: colors.surface,
  },
  moreFlipCardText: { ...typography.bodyEmphasis, ...textShadow, textAlign: 'center', lineHeight: 21,
    fontWeight: '400',
  },

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
