import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useAnimatedProps } from 'react-native-reanimated';
import { AnimatedLinearGradient } from '../../components/AnimatedLinearGradient';
import { AppTextInput } from '../../components/AppTextInput';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DayArc } from '../../components/DayArc';
import { EnergyOrb } from '../../components/EnergyOrb';
import { FlipCard } from '../../components/FlipCard';
import type { HelpSection } from '../../components/HelpButton';
import { ProgressRing } from '../../components/ProgressRing';
import { PurpleRibbonIcon } from '../../components/PurpleRibbonIcon';
import { useBackgroundBottomInset } from '../../components/ScreenBackground';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors, IRIDESCENT_PALETTE, rotatedIridescentPalette } from '../../constants/colors';
import { FLOATING_BUTTON_SIZE, useBottomLeftHubPosition, useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { TAB_ROUTES } from '../../constants/tabs';
import { textShadow, typography } from '../../constants/typography';
import { useIridescentHueRotation } from '../../hooks/useIridescentHueRotation';
import {
  getDailyNutrientBreakdown,
  getDailySixDimensionsBreakdown,
  getUserProfile,
  listCheckins,
  listMealsForDate,
  listScheduledMealsForDate,
  recordBodyMeasurement,
  recordExercise,
  setScheduledMealSkipped,
  type MealRecord,
  type ScheduleItemRecord,
} from '../../lib/db';
import {
  analyzeNutrientIntake,
  findExcessRisks,
  findNutrientGaps,
  nutrientStatusSeverity,
  type NutrientGapEntry,
  type NutrientStatus,
} from '../../lib/nutrientAnalysis';
import { isFlaggedTier } from '../../lib/sixDimensionsReference';
import { formatTime12 } from '../../lib/timeOfDay';
import { getSixDimensionsFlagTrendSeries } from '../../lib/trendAnalysis';

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

// The "A Few Things Worth Knowing" flip-card pool, 2026-07-27 -- used to be
// 4 hardcoded cards, always the same 4, every single day. Explicitly asked
// to feel alive instead: a much bigger pool (16 real, cited-in-spirit
// tidbits spanning Hashimoto's specifically and autoimmune disease more
// broadly, matching The Purple Digest's own broadened scope), a different
// stable subset shown each day, and a "show more" card at the end that
// reveals further cards from the same pool rather than an infinite/AI-
// generated feed -- this app's whole ethos is curated and cited, not
// generative, and that stays true here too.
type FlipCardEntry = {
  icon: ComponentProps<typeof Ionicons>['name'];
  hook: string;
  backTitle: string;
  backBody: string;
};

const FLIP_CARD_POOL: FlipCardEntry[] = [
  {
    icon: 'body-outline',
    hook: 'An autoimmune condition affecting your thyroid',
    backTitle: "What is Hashimoto's?",
    backBody: 'Your immune system gradually attacks your thyroid gland, lowering its hormone production. Full picture in Help, top right.',
  },
  {
    icon: 'time-outline',
    hook: 'Some foods can block your prescription',
    backTitle: 'Why timing matters',
    backBody: 'Calcium and iron can block prescription absorption if eaten too close to a dose -- Schedules tracks timing for exactly this.',
  },
  {
    icon: 'leaf-outline',
    hook: 'Your gut and thyroid are connected',
    backTitle: 'Gut health matters here',
    backBody: "Digestion and absorption are often disrupted in Hashimoto's -- gut and microbiome support is a real goal here, not an afterthought.",
  },
  {
    icon: 'sparkles-outline',
    hook: 'This app does the hard part for you',
    backTitle: 'What Inside Story does',
    backBody: 'Matching foods to your chemistry, catching interactions, and finding your patterns -- so eating feels like following clear rules, not homework.',
  },
  {
    icon: 'nutrition-outline',
    hook: 'One nut can cover a whole day of a key mineral',
    backTitle: 'Selenium and your thyroid',
    backBody: 'Selenium helps convert thyroid hormone into its active form -- a single Brazil nut can cover a full day\'s worth, though more isn\'t automatically better; excess selenium has its own real risks.',
  },
  {
    icon: 'water-outline',
    hook: "More iodine isn't always better",
    backTitle: 'Iodine, a double-edged nutrient',
    backBody: "Iodine is essential for making thyroid hormone, but in someone already prone to autoimmune thyroid disease, too much of it can actually trigger or worsen an attack.",
  },
  {
    icon: 'people-outline',
    hook: 'Autoimmune disease affects women far more than men',
    backTitle: 'Why women are affected more',
    backBody: "Roughly 3 out of 4 autoimmune disease patients are women -- Hashimoto's specifically runs 7-10x more common in women, likely tied to hormonal and X-chromosome factors still being studied.",
  },
  {
    icon: 'link-outline',
    hook: 'One autoimmune disease raises the odds of another',
    backTitle: 'Autoimmune conditions often cluster',
    backBody: "Having one autoimmune disease measurably raises the risk of developing another (celiac disease and type 1 diabetes are common companions to Hashimoto's) -- part of why Signals tracks more than just thyroid symptoms.",
  },
  {
    icon: 'flask-outline',
    hook: "Your labs can lag behind how you feel",
    backTitle: "Why labs and symptoms don't always match",
    backBody: 'TSH can trail actual hormone shifts by weeks -- part of why this app treats your own logged symptoms as real data, not just noise between lab draws.',
  },
  {
    icon: 'alert-circle-outline',
    hook: 'A common supplement can throw off thyroid labs',
    backTitle: 'Biotin can fake out thyroid tests',
    backBody: 'High-dose biotin (common in hair/skin/nail supplements) can cause falsely abnormal thyroid results -- most labs recommend stopping it 2-3 days before a blood draw.',
  },
  {
    icon: 'restaurant-outline',
    hook: "Celiac and Hashimoto's often travel together",
    backTitle: 'The gluten connection',
    backBody: "People with Hashimoto's have a meaningfully higher rate of celiac disease than the general population -- one more reason digestion gets real attention in this app.",
  },
  {
    icon: 'battery-dead-outline',
    hook: 'Thyroid fatigue is real, not "just stress"',
    backTitle: "Fatigue isn't a character flaw",
    backBody: "Hypothyroid fatigue has a real physiological basis -- slowed metabolism, reduced oxygen delivery -- worth naming plainly since it's so often dismissed as something to just push through.",
  },
  {
    icon: 'pulse-outline',
    hook: 'Stress can genuinely trigger flares',
    backTitle: 'The stress-immune connection',
    backBody: 'Psychological stress measurably influences immune activity -- part of why Signals logging is about more than just food.',
  },
  {
    icon: 'flame-outline',
    hook: "Cooking changes how 'goitrogenic' a food really is",
    backTitle: "Goitrogens aren't simply bad",
    backBody: "Cooking meaningfully reduces the goitrogenic compounds in foods like broccoli and kale -- context (raw vs. cooked, how much) matters more than a blanket avoid list, exactly what the 6 Dimensions scoring accounts for.",
  },
  {
    icon: 'hourglass-outline',
    hook: 'What you eat can cut your prescription\'s effectiveness',
    backTitle: 'The empty-stomach rule',
    backBody: 'Levothyroxine absorption drops substantially when taken with food, especially coffee or high-fiber/high-calcium meals -- most guidance is 30-60 minutes before eating, at a consistent time every day.',
  },
  {
    icon: 'person-outline',
    hook: 'Your own patterns matter more than averages',
    backTitle: 'You are not a population average',
    backBody: "Population-level guidance is a starting point, not a verdict -- this app's own trend-finding exists because your own repeated patterns are the most relevant data about your own body.",
  },
];

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

function todayDaySeed(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / (24 * 60 * 60 * 1000));
  return now.getFullYear() * 1000 + dayOfYear;
}

// Fisher-Yates using the seeded generator above -- deterministic for a
// given seed, so "today's order" is stable across every re-render and
// every time Home refocuses today, but reshuffles tomorrow.
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

// Same green/yellow/red language as the Insights tab's Nutrients table
// (see nutrientStatusSeverity in lib/nutrientAnalysis.ts) -- a nutrient
// should read the same color here on Home as it does over there, not a
// second, slightly different color scheme for the same status.
function nutrientRingColor(status: NutrientStatus): string {
  const severity = nutrientStatusSeverity(status);
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  return colors.primary;
}

type DashboardData = {
  todaysMeals: MealRecord[];
  scheduledToday: ScheduleItemRecord[];
  nutrientEntries: NutrientGapEntry[];
  sixDsFlagCount: number;
  recentMaxSeverity: number | null;
  hasAnyLogHistory: boolean;
};

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

// The Purple Digest's own corner shortcut, 2026-07-27 -- explicitly
// requested: Home is the one page with no LensHub of its own (nothing to
// switch between), so its own bottom-left corner sits unused; this gives
// Home a direct, always-visible way into The Purple Digest, "just like the
// other main tabs" have for their own lenses, rather than only being
// reachable through the butterfly menu's own grid (TabHub.tsx, added
// earlier the same day).
//
// 2026-08-05: simplified from its own 3-option LensHub (MedlinePlus/ATA/
// Autoimmune Association -- the original external-source plan named in the
// old app/purple-digest.tsx's own header comment) down to a single plain
// button, once Purple Digest was promoted to a real tab (see
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
    heading: 'What this page shows',
    body: "A live dashboard, not a static page -- your day's arc, today's fuel gauges, and how you've been feeling, refreshed every time you open it. Tap anything to jump to the tab it summarizes.",
  },
  {
    heading: 'The Day Arc',
    body: 'A visual line across your day (6 AM to 10 PM by default) with a dot for each scheduled item, plus a glowing marker for right now. Tap a dot for details and quick actions.',
  },
  {
    heading: 'Fuel Gauges',
    body: "Rings for iodine, selenium, zinc, iron, copper, vitamin D, calcium, magnesium, and B12 -- nutrients most directly tied to thyroid function and bone health. Green means on track, amber means low, red means deficient or over a safe limit. Filled from today's logged meals and supplements.",
  },
  {
    heading: 'The mood orb',
    body: "Reflects the most severe flare or food reaction you've logged in Signals over the last 2 days -- cool and calm with nothing recent, warmer the more severe. Gray means you haven't logged anything there yet, which is different from calm.",
  },
  {
    heading: 'What is Hashimoto’s thyroiditis?',
    body: "An autoimmune condition: the immune system produces antibodies (most often against thyroid peroxidase, sometimes thyroglobulin) that gradually attack the thyroid gland, reducing its ability to make thyroid hormone. It's the most common cause of an underactive thyroid (hypothyroidism) in the US and other iodine-sufficient countries, and roughly 7-10x more common in women than men. The course is often slow and uneven -- some people pass through a period of normal, or even briefly overactive, thyroid function before settling into an underactive pattern.",
  },
  {
    heading: 'Common challenges & symptoms',
    body: 'Persistent fatigue, unexplained weight gain, feeling unusually cold, brain fog, low mood, dry skin and hair thinning, joint/muscle aches, constipation, irregular periods, and in some cases a visibly enlarged thyroid (goiter). Hashimoto’s also tends to cluster with other autoimmune conditions such as celiac disease or pernicious anemia, which can compound digestive and nutrient-absorption symptoms. Source: StatPearls (NCBI Bookshelf), "Hashimoto Thyroiditis," NBK459262; NIDDK, "Hashimoto’s Disease."',
  },
  {
    heading: 'Why food and timing matter here',
    body: 'Certain foods and minerals -- calcium and iron are well-documented examples -- can interfere with how well a thyroid prescription is absorbed if eaten too close to a dose, which is part of why Schedules tracks meal, supplement, and prescription timing together. Digestion and absorption are also frequently disrupted in Hashimoto’s, which is why gut and microbiome support is treated as its own goal throughout this app.',
  },
  {
    heading: 'What Inside Story does',
    body: "Not a generic calorie counter -- Inside Story exists to help someone with Hashimoto's relearn how and what to eat, and understand how food affects their own body specifically. Meals builds and scores meals; Insights shows how today stacks up; Schedules handles timing; Trends looks for patterns over time; Signals is where you record flares, reactions, and new foods; Reports turns it all into something to hand a doctor.",
  },
  {
    heading: 'Personal notes, not medical fact',
    body: "This page's education sections and your own Signals entries are general information and personal observation, not medical advice, and are not a substitute for care from your own doctor.",
  },
  {
    heading: 'Getting around',
    body: 'Tap a tab at the bottom to jump to it, or swipe left/right anywhere on a screen to move to the next or previous tab -- Home, Meals, Insights, Schedules, Trends, Signals, Reports, in that order.',
  },
];

export default function HomeScreen() {
  useRegisterScreenHelp('Home', HOME_HELP_SECTIONS, '/');
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const { height: windowHeight } = useWindowDimensions();
  const bottomInset = useBackgroundBottomInset();
  // The Purple Digest corner shortcut's own position -- same hook LensHub
  // uses internally, called here directly since this button is now a plain
  // TouchableOpacity rather than a LensHub instance (see that button's own
  // render/comment below).
  const purpleDigestShortcutPosition = useBottomLeftHubPosition();
  // Feeds Home's own footerLine below -- same shared Reanimated value every
  // other iridescent element in the app reads (ScreenHeader's own divider/
  // app-name text, ScreenBackground.tsx's own footer line for every other
  // tab), so this stays in lockstep with them.
  const hueRotation = useIridescentHueRotation();
  const footerLineAnimatedProps = useAnimatedProps(() => ({
    colors: rotatedIridescentPalette(hueRotation.value),
  }));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScheduleItemRecord | null>(null);
  const [quickLogModal, setQuickLogModal] = useState<'bp' | 'exercise' | null>(null);
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpBpm, setBpBpm] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [exerciseIntensity, setExerciseIntensity] = useState<'light' | 'moderate' | 'vigorous' | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  // undefined = not fetched yet, null = fetched but no logged days this
  // week (nothing worth showing), object = real comparison.
  const [weekTrend, setWeekTrend] = useState<WeekTrend | null | undefined>(undefined);
  // How many of FLIP_CARD_POOL's own today-shuffled order are currently
  // shown -- starts at 4 (the original fixed count), grows via the "show
  // more" card at the end. Intentionally NOT reset on focus/day change --
  // if someone's mid-browsing when the date rolls over, snapping their
  // already-expanded view back to 4 would feel like a bug, not a feature;
  // it'll naturally reset next cold start.
  const [visibleFlipCardCount, setVisibleFlipCardCount] = useState(4);
  // Ref, not state -- read once per focus to decide whether this is the
  // very first load this session (show the loading gate, then reveal
  // everything at once, scrolled to the top) or a returning focus (Tabs
  // keeps Home mounted in the background on switch, so swiping/hubbing
  // back to it re-runs this effect -- refresh the data silently in that
  // case, without re-showing "Loading today…" or fighting wherever the
  // person had scrolled to).
  const hasLoadedOnceRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

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

  const load = useCallback(() => {
    const date = todayDateString();
    const twoDayFloor = dateStringDaysAgo(1);

    return Promise.all([
      listMealsForDate(date),
      listScheduledMealsForDate(date),
      getDailyNutrientBreakdown(date),
      getDailySixDimensionsBreakdown(date),
      listCheckins({ checkinType: 'flare', limit: 60 }),
      listCheckins({ checkinType: 'post_meal', limit: 60 }),
      getUserProfile(),
    ]).then(([todaysMeals, scheduledToday, nutrientBreakdown, dimensionsBreakdown, flareEntries, reactionEntries, profile]) => {
      setFirstName(profile.firstName);
      const nutrientEntries = analyzeNutrientIntake(
        nutrientBreakdown.driRows,
        nutrientBreakdown.dayTotals,
        nutrientBreakdown.supplementTotals,
      );
      const sixDsFlagCount = dimensionsBreakdown.day.filter((score) =>
        score.entries.some((entry) => isFlaggedTier(entry.tier)),
      ).length;

      const negativeEntries = [...flareEntries, ...reactionEntries];
      const hasAnyLogHistory = negativeEntries.length > 0;
      const recentSeverities = negativeEntries
        .filter((entry) => entry.loggedAt.slice(0, 10) >= twoDayFloor && entry.severity != null)
        .map((entry) => entry.severity as number);
      const recentMaxSeverity = recentSeverities.length > 0 ? Math.max(...recentSeverities) : null;

      setData({ todaysMeals, scheduledToday, nutrientEntries, sixDsFlagCount, recentMaxSeverity, hasAnyLogHistory });
    });
  }, []);

  // Both loaded together, on every focus (so returning from Food/Bio-
  // Compass with something new logged still shows up) -- but the loading
  // gate and scroll-to-top below only ever fire on the first one this
  // session, via hasLoadedOnceRef. A returning focus updates `data`/
  // `weekTrend` in place once both resolve, with no gate flicker and no
  // fighting the person's own scroll position.
  useFocusEffect(
    useCallback(() => {
      const isFirstLoad = !hasLoadedOnceRef.current;
      if (isFirstLoad) setLoading(true);
      Promise.all([load(), loadWeekTrend()]).then(() => {
        if (!isFirstLoad) return;
        hasLoadedOnceRef.current = true;
        setLoading(false);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [load, loadWeekTrend]),
  );

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
      Alert.alert('Enter both a systolic and diastolic number.');
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
      Alert.alert('Enter what kind of activity this was.');
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
  const worthALookCount = nutrientFlagCount + (data?.sixDsFlagCount ?? 0);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const coreNutrientRings = data
    ? CORE_NUTRIENT_CODES.map((code) => data.nutrientEntries.find((entry) => entry.nutrientCode === code)).filter(
        (entry): entry is NutrientGapEntry => entry != null,
      )
    : [];

  const dailyFlipCardOrder = seededShuffleIndices(FLIP_CARD_POOL.length, todayDaySeed());
  const visibleFlipCards = dailyFlipCardOrder.slice(0, visibleFlipCardCount).map((index) => FLIP_CARD_POOL[index]);
  const hasMoreFlipCards = visibleFlipCardCount < FLIP_CARD_POOL.length;

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen>
        <View style={styles.contentArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        >
          <View style={styles.greetingCard}>
            <Text style={styles.greetingText}>
              {timeGreeting()}
              {firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.affirmationText}>{pickAffirmation()}</Text>
            <Text style={styles.dateText}>{todayLabel}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading today…</Text>
            </View>
          ) : (
            <>
              <View style={[styles.arcCard, { borderColor: tabColorFor('/schedule') }]}>
                <CardLabel tabPath="/schedule" text="Your Day" />
                <DayArc items={data?.scheduledToday ?? []} onPressItem={setSelectedItem} labelColor={tabColorFor('/schedule')} />
                <Text style={[styles.arcCaption, { color: tabColorFor('/schedule') }]}>
                  {upNext
                    ? upNext.isPast
                      ? `${upNext.item.title} was due ${formatTime12(upNext.item.scheduledFor.slice(11, 16))} -- anything to log?`
                      : `Next: ${upNext.item.title} at ${formatTime12(upNext.item.scheduledFor.slice(11, 16))}`
                    : 'Nothing scheduled yet today.'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <TouchableOpacity
                  style={[styles.statTile, { borderColor: tabColorFor('/food') }]}
                  onPress={() => router.navigate('/food')}
                  activeOpacity={0.75}
                >
                  <CardLabel tabPath="/food" text={mealsLoggedToday === 1 ? 'Meal logged today' : 'Meals logged today'} />
                  <Text style={[styles.statNumber, { color: tabColorFor('/food') }]}>{mealsLoggedToday}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statTile, { borderColor: tabColorFor('/insights') }]}
                  onPress={() => router.navigate('/insights')}
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.fullBleedScroll}
                contentContainerStyle={styles.quickActionsRow}
              >
                {/* Daily check-in is now first, 2026-07-28 -- explicitly
                    requested reorder, Log a meal moved to second (right
                    after this one, unchanged otherwise). Deliberately left
                    the generic colors.primary, not tab-colored like the
                    others below -- it opens Assessment, a standalone
                    screen outside TAB_ROUTES entirely (see TabHub.tsx's
                    own profileActive comment for the same "not really a
                    tab" situation), so there's no real tab color to
                    borrow here. */}
                <TouchableOpacity style={styles.quickActionSecondary} onPress={() => router.push('/assessment')} activeOpacity={0.85}>
                  <Ionicons name="pulse-outline" size={18} color={colors.primary} />
                  <Text style={styles.quickActionSecondaryText}>Daily check-in</Text>
                </TouchableOpacity>
                {/* Reverted the solid green fill, same day -- just the
                    border/icon/text carry Food's color now, matching every
                    secondary pill's own outline treatment instead of
                    standing out as a differently-colored filled button. */}
                <TouchableOpacity
                  style={[styles.quickActionSecondary, { borderColor: tabColorFor('/food') }]}
                  onPress={() => router.navigate('/food')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color={tabColorFor('/food')} />
                  <Text style={[styles.quickActionSecondaryText, { color: tabColorFor('/food') }]}>Log a meal</Text>
                </TouchableOpacity>
                {/* These three all write to Signals's own data (flares,
                    and blood pressure/exercise under its Other lens) --
                    explicitly requested, 2026-07-27, so a pill's own color
                    matches where its data actually lives, the same
                    tab-color consistency already applied to every info box
                    above. Blood pressure/exercise open a local modal
                    rather than literally navigating to /log, but the data
                    they save is Signals's regardless. */}
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

              {/* "How You're Feeling" (Signals, a warm peach) now comes
                  before "Today's Fuel Gauges" (Insights, a cool teal-green)
                  -- explicitly reordered, 2026-07-27, so the two Insights-
                  colored boxes (this one and the "Worth a look" stat tile
                  right above) don't stack directly on top of each other.
                  Food's green and Insights' teal-green already sit right
                  next to each other in the stat row above (unavoidable --
                  they're a deliberately paired "today's stats" duo), and
                  adding a third same-family green immediately below them
                  made that whole top section read as one indistinct green
                  blur. A genuinely different hue (peach) in between breaks
                  that up; see TAB_BORDER_WIDTH's own comment for the other
                  half of this fix (a thicker border makes each individual
                  color easier to read regardless of ordering). */}
              <View style={[styles.orbCard, styles.sectionHeadingSpaced, { borderColor: tabColorFor('/log') }]}>
                <CardLabel tabPath="/log" text="How You're Feeling" />
                <EnergyOrb
                  recentMaxSeverity={data?.recentMaxSeverity ?? null}
                  hasAnyHistory={data?.hasAnyLogHistory ?? false}
                  onPress={() => router.navigate('/log')}
                  textColor={tabColorFor('/log')}
                />
              </View>

              {mealsLoggedToday === 0 ? (
                <View style={[styles.emptyCard, styles.sectionHeadingSpaced, { borderColor: tabColorFor('/insights') }]}>
                  <CardLabel tabPath="/insights" text="Today's Fuel Gauges" />
                  <Text style={[styles.emptyText, { color: tabColorFor('/insights') }]}>Log a meal to see today's fuel gauges fill in.</Text>
                </View>
              ) : (
                <View style={[styles.fuelGaugesCard, styles.sectionHeadingSpaced, { borderColor: tabColorFor('/insights') }]}>
                  <CardLabel tabPath="/insights" text="Today's Fuel Gauges" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
                    {coreNutrientRings.map((entry) => (
                      <TouchableOpacity key={entry.nutrientCode} onPress={() => router.navigate('/insights')} activeOpacity={0.75}>
                        <ProgressRing
                          percent={entry.percentOfTarget}
                          color={nutrientRingColor(entry.status)}
                          label={entry.displayName}
                          sublabel={`${Math.round(entry.percentOfTarget)}%`}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {weekTrend ? (
                <TouchableOpacity
                  style={[styles.trendCard, styles.sectionHeadingSpaced, { borderColor: tabColorFor('/trends') }]}
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
              ) : null}
            </>
          )}

          {/* Explicitly requested, 2026-07-27: no header above this row
              anymore ("A Few Things Worth Knowing" is gone) -- the ribbon
              icon/purple coloring on the cards themselves, plus the "More
              from The Purple Digest" card at the end, already say what
              this is without a label spelling it out too. See
              FLIP_CARD_POOL's own comment (top of file) for the bigger
              change this is part of: a real rotating pool instead of 4
              fixed cards, reshuffled daily, with more revealed on tap
              rather than shown all at once. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.fullBleedScroll, styles.sectionHeadingSpaced]}
            contentContainerStyle={styles.flipRow}
          >
            {visibleFlipCards.map((card) => (
              <FlipCard
                key={card.hook}
                icon={<Ionicons name={card.icon} size={28} color={colors.tabPurpleDigest} />}
                hook={card.hook}
                backTitle={card.backTitle}
                backBody={card.backBody}
              />
            ))}
            {hasMoreFlipCards ? (
              <TouchableOpacity
                style={[styles.moreFlipCard, { borderColor: colors.tabPurpleDigest }]}
                onPress={() => setVisibleFlipCardCount((count) => Math.min(count + 4, FLIP_CARD_POOL.length))}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.tabPurpleDigest} />
                <Text style={[styles.moreFlipCardText, { color: colors.tabPurpleDigest }]}>More from{'\n'}The Purple Digest</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          {/* Temporary diagnostic spacer -- scrolling all the way down
              pushes every real card above the viewport, leaving nothing
              covering the shared fixed background (app/(tabs)/_layout.tsx's
              image doesn't scroll with this content), so the whole sky --
              including the sky band up top where AnimatedSky's sun/moon
              render -- is visible unobstructed for a clean look while
              tuning that. Remove once no longer needed for that. */}
          <View style={{ height: windowHeight }} />
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
        {/* This mask painting flat colors.background over the shared
            background's own footer line (rendered underneath it, as part
            of the one persistent ScreenBackground instance mounted in
            app/(tabs)/_layout.tsx) was quietly erasing that line on Home
            specifically -- every other tab's own risen ScreenBackground
            instance carries its bottomMask and footerLine together as one
            unit, so this never showed up there. Same fix: draw Home's own
            copy of that line on top of its own mask, matching
            ScreenBackground.tsx's own footerLine exactly (down to the -4-1
            offset math -- see that file's own comment for where those
            numbers come from). */}
        <AnimatedLinearGradient
          // Static fallback so TypeScript's own required `colors` prop is
          // satisfied -- animatedProps overrides this at the native level
          // the instant it mounts.
          colors={IRIDESCENT_PALETTE}
          animatedProps={footerLineAnimatedProps}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.footerLine, { bottom: bottomInset - 4 - 1 }]}
          pointerEvents="none"
        />
        </View>
      </SwipeableTabScreen>

      <TouchableOpacity
        style={[styles.purpleDigestShortcut, purpleDigestShortcutPosition]}
        onPress={() => router.push('/purple-digest')}
        activeOpacity={0.85}
        accessibilityLabel="Open The Purple Digest"
      >
        <PurpleRibbonIcon size={32} color={colors.tabPurpleDigest} />
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
                  <AppTextInput
                    style={[styles.quickInput, styles.quickInputFull]}
                    placeholder="e.g. Walk, yoga, weights"
                    value={exerciseType}
                    onChangeText={setExerciseType}
                  />
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
// a tab color (not the plain colors.border boxes like greetingCard/
// loadingCard, which don't carry that meaning and don't need it).
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
  footerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    // `bottom` set inline (bottomInset - 4 - 1) -- see where this renders.
  },
  // paddingTop: a little separation between the header and the greeting
  // card below it, present from the start (not just something scrolling
  // reveals) -- otherwise the greeting card sits flush against the header
  // the instant the page loads.
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  // Same colors.surface "dark blue" card used everywhere else on this page
  // (arcCard, statTile, trendCard, etc.) -- every text-bearing element on
  // Home sits on this same box now, since the background underneath is a
  // photo (not the flat navy colors.background), and textPrimary's light
  // cream reads poorly floating over the photo's brighter patches.
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: { ...typography.body, ...textShadow, color: colors.textSecondary },

  greetingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  greetingText: { ...typography.screenTitle, ...textShadow, color: colors.textPrimary },
  affirmationText: { ...typography.body, ...textShadow, color: colors.primary, marginTop: 2, fontStyle: 'italic' },
  dateText: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 2 },

  // Used to precede every content card on this page as its own separate
  // box -- 2026-07-26, folded into each of those cards instead (see
  // CardLabel above). The last holdout, "A Few Things Worth Knowing," lost
  // its own header entirely on 2026-07-27 (explicitly requested), so this
  // chip/heading pair is unused now -- only sectionHeadingSpaced (the
  // plain top-margin spacer) is still needed, kept on its own below.
  sectionHeadingSpaced: { marginTop: 24 },
  // CardLabel's own row -- alignSelf: 'flex-start' so it hugs the box's
  // own left edge even inside a parent using alignItems: 'center'
  // (arcCard, fuelGaugesCard, orbCard all center their real content).
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 8 },
  // Color set inline per box (see CardLabel) to match that box's own tab.
  cardLabelText: { ...typography.eyebrow },
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

  statRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
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
  statNumber: { ...typography.screenTitle, ...textShadow, color: colors.textPrimary },
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
  quickActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 20 },
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
  quickActionSecondaryText: { ...typography.bodyEmphasis, ...textShadow, color: colors.primary },

  fuelGaugesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
  },
  ringRow: { flexDirection: 'row', gap: 16, paddingRight: 8 },

  orbCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: INFO_CARD_PADDING_HORIZONTAL,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: TAB_BORDER_WIDTH,
    borderColor: colors.border,
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
  trendNumber: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary },
  trendDelta: { ...typography.bodyEmphasis, ...textShadow, marginTop: 4 },
  trendCaption: { ...typography.caption, ...textShadow, color: colors.textSecondary, marginTop: 4 },

  flipRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  // Same footprint as FlipCard's own default width/height (220x260) so it
  // sits in this row as an equal, not an odd one out -- a plain button,
  // not a flip card itself (no back face, no flip animation), dashed
  // border to read as "tap for more," not "here's a fact."
  moreFlipCard: {
    width: 220,
    height: 260,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  moreFlipCardText: { ...typography.bodyEmphasis, ...textShadow, textAlign: 'center', lineHeight: 21 },

  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 24 },
  modalBackdropTouchable: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary },
  modalMeta: { ...typography.body, ...textShadow, color: colors.textSecondary, marginTop: 4 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.bodyEmphasis, ...textShadow, color: colors.textOnPrimary },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, ...textShadow, color: colors.textSecondary },

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
  quickInputFull: { width: '100%', marginTop: 12 },
  quickInputSeparator: { ...typography.label, ...textShadow, color: colors.textPrimary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flexShrink: 1 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary },
});
