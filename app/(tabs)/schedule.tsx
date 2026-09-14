import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../../components/AppTextInput';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { AppActionSheet, type AppActionSheetAction } from '../../components/AppActionSheet';
import { useConfirmSheet } from '../../components/ConfirmSheet';
import type { HelpSection } from '../../components/HelpButton';
import { useInfoAlert } from '../../components/InfoAlert';
import {
  addDaysToLocalDate,
  applyRotationSelection,
  applyRotationSelectionsToIngredients,
  deleteScheduledMeal,
  deleteScheduleSeries,
  ensureScheduleSeriesGenerated,
  getDailyNutrientAnalysis,
  getDietPreferences,
  getUpcomingScheduleCountsByType,
  getUserConditions,
  getUserProfile,
  hasStandingHydrationRoutine,
  linkScheduleItemToDeviceCalendarEvent,
  listAllActiveTreatments,
  listFavorites,
  listMeals,
  listMealsForDate,
  listPastScheduledMeals,
  listTodaysMealsWithRecipes,
  listScheduledMealsForDate,
  listScheduledMealsForDateRange,
  listScheduledMedDosesFrom,
  listUpcomingAppointments,
  markAppointmentCompleted,
  markScheduledDoseTaken,
  scheduleAppointment,
  scheduleHydrationRemindersForDay,
  scheduleMeal,
  scheduleTreatmentDose,
  setAppointmentCancelled,
  setScheduledMealRotationSelections,
  setScheduledMealSkipped,
  settlePastScheduledMeals,
  setUpMealPlan,
  unlinkScheduleItemFromDeviceCalendarEvent,
  updateAppointment,
  updateScheduledMeal,
  type FavoriteRecord,
  type MealFavoritePayload,
  type MealIngredientInput,
  type MealRecord,
  type RepeatConfig,
  type RotationSelection,
  type TodaysMeal,
  type ScheduleItemRecord,
  type TreatmentRecord,
  type UserProfile,
} from '../../lib/db';
import type { RecipeDietTag } from '../../lib/digest';
import { describePlanningScope, resolvePlanningScope, type PlanningScope } from '../../lib/partnerPlanning';
import {
  dailyMealPlanToMealPlanDay,
  FREQUENCY_RULES,
  generateDailyMealPlan,
  generateMealPlanDays,
  getDailyMealPlanWaterGapMl,
  LOW_CARB_MAX_GRAMS_PER_DAY,
  NO_CARB_MAX_GRAMS_PER_DAY,
  type CarbLevel,
  type DailyMealPlanPick,
  type DailyMealPlanResult,
} from '../../lib/dailyMealPlan';
import {
  createDeviceCalendarEvent,
  deleteDeviceCalendarEvent,
  hasCalendarPermission,
  listUpcomingDeviceEvents,
  requestCalendarPermission,
  type DeviceCalendarEvent,
} from '../../lib/deviceCalendar';
import { evaluateInteractionRules, type InteractionWarning, type ReferenceOnlyRule } from '../../lib/interactionRules';
import type { NutrientGapEntry } from '../../lib/nutrientAnalysis';
import { buildTime24, describeTimeInputProblem, formatTime12, splitTime24, type TimeOfDayInput } from '../../lib/timeOfDay';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PopoverSelect } from '../../components/PopoverSelect';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { WhyExplainer } from '../../components/WhyExplainer';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from '../../components/HomeSectionBand';
import { useBandFolds } from '../../hooks/useBandFolds';
import { describeUpkeepStanding, DUE_SOON_DAYS, upkeepCategoryLabel, upkeepStanding, type UpkeepItem, type UpkeepStanding } from '../../lib/upkeep';
import { listUpkeepItems, markUpkeepDone } from '../../lib/upkeepDb';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border/headline text to
// carry that identity. Matches the same rule applied there, 2026-07-27.
const TAB_COLOR = colors.tabSchedules;

// Same vocabulary as the Meals builder's own mealTypes -- kept as a
// separate literal here rather than importing it, since index.tsx doesn't
// export it and this is a tiny, stable list not worth wiring a shared
// module for.
const mealTypes = ['beverage', 'breakfast', 'dinner', 'lunch', 'salad', 'smoothie', 'snack'];

// Only these four have a "usual time" concept in Profile -- salad/smoothie
// are meal *formats*, not day-parts, so there's no single typical hour for
// either of them the way there is for breakfast/lunch/dinner/snack.
const USUAL_TIME_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);

// Six schedule domains, one lens tab each -- mirrors the Insights tab's
// lens pattern (see app/(tabs)/insights.tsx). Meals is the only one with
// real functionality behind it right now; the rest are honest "coming
// soon" placeholders, the same pattern already used for the Trends/Reports
// bottom tabs, rather than guessing at data models for domains that
// haven't been designed yet.
type Lens =
  | 'meals'
  | 'todaysMeals'
  | 'pastMeals'
  | 'dailyMealPlan'
  | 'hydration'
  | 'meds'
  | 'appointments'
  | 'upkeep'
  | 'exercise';

// A repeat picker exists on Meals, Supplements' own reminder times, and
// Prescriptions -- shared across those three Info entries below rather
// than re-worded three times.
const REPEATING_SCHEDULES_HELP: HelpSection = {
  heading: 'Repeating schedules',
  body: 'Can repeat daily: indefinitely, a set number of times, or until a date you choose. Entries are generated about 60 days ahead and topped up automatically, so editing, skipping, or removing one day never touches any other.',
};

const LENSES: LensOption<Lens>[] = [
  {
    key: 'meals',
    label: 'Meals',
    icon: 'restaurant-outline',
    help: [
      {
        heading: 'Planning vs. logging',
        body: 'This page is for planning what you intend to do, before you do it. Meals still get logged on the Food tab, either through "Log now" here or by creating a meal there directly.',
      },
      {
        heading: 'This week, at a glance',
        body: 'The strip at the top shows the whole week: a small dot marks any day with something scheduled. Tap a day to see it below; "‹"/"›" page a whole week at once, keeping the same day of the week you had selected. "+Schedule a meal" always schedules for whichever day is currently selected, not always today.',
      },
      {
        heading: 'Phone calendar sync',
        body: 'Any one scheduled meal can sync to your phone\'s own Calendar app, the same way appointments do: "Add to calendar" pushes it out as a 30-minute block; "Unlink calendar," or removing it here, can also remove the calendar event. This is per-occurrence, not per-series. A daily repeating meal is not synced in bulk, only whichever single day you sync from here.',
      },
      {
        heading: 'From templates & favorites, or unplanned',
        body: 'On the Food tab, pick a meal type first. "From templates & favorites" shows only your saved meals/favorites that match that meal type. "Something unplanned" is for when the day did not go as planned (e.g. you ate out); type in your best guess of what you actually had.',
      },
      {
        heading: '"Log now" and "Rotate"',
        body: '"Log now" turns a planned meal into a logged entry, prefilled if it came from a template/favorite. "Rotate" (smoothies, mixed vegetables, mixed fruit) only shows up when that favorite has a Rotating ingredient; your pick applies to this one scheduled occurrence only, so a Tuesday smoothie can vary from a Wednesday one even from the same favorite.',
      },
      {
        heading: 'Planned, Logged, Skipped',
        body: 'A planned meal you never got to stays marked "Planned," not silently dropped. "Skip" marks it as intentionally not happening today, without deleting the record of what you had planned.',
      },
      {
        heading: 'Usual meal times & fasting window',
        body: 'Set in Profile. "Usual meal times" just pre-fills the time picker for that meal type. If you turn on fasting and set an eating window, this page will not let you schedule a meal outside it.',
      },
      REPEATING_SCHEDULES_HELP,
    ],
  },
  {
    key: 'todaysMeals',
    label: "Today's Meals",
    icon: 'book-outline',
    help: [
      {
        heading: 'What this is for',
        body: 'Everything you have scheduled to eat today, in time order, with the ingredients and steps for each one. This is the lens to open while you are actually cooking, rather than to plan or to correct the record.',
      },
      {
        heading: 'Why the whole day, not just what you have eaten',
        body: 'You cook a meal before you log it, so a list of only the meals already eaten would be useless for cooking from. Planned, eaten and skipped meals all appear, each labelled, so it is clear which is which.',
      },
      {
        heading: 'Where the steps come from',
        body: 'A meal built from saved dishes carries each dish’s own ingredients and whatever steps were written for it, including the steps that come with a system recipe when you build one. A meal typed in directly has no recipe behind it and says so, rather than showing an empty panel.',
      },
      {
        heading: 'If a dish has no steps',
        body: 'The ingredients still show. Steps are only ever there if somebody wrote them, either in the dish’s own builder or by starting from a system recipe, so a dish with none is an honest gap rather than something missing here.',
      },
    ],
  },
  {
    key: 'pastMeals',
    label: 'Past Meals',
    icon: 'time-outline',
    help: [
      {
        heading: 'Why this exists',
        body: 'A scheduled meal is real, running data the moment its date passes -- it counts toward Trends and Reports on its own, in whatever amounts you originally planned, so you never have to separately "log" it just to make it count.',
      },
      {
        heading: 'Correcting what actually happened',
        body: 'Tap any past meal to open it and adjust one piece at a time: more if you had extra, less or none if you skipped something, anywhere in between. Anything left untouched still counts exactly as planned.',
      },
      {
        heading: 'A food trial riding on it',
        body: 'If you drop something to none that a food trial was riding on, this asks directly: was it never actually eaten (the trial goes back to waiting), or did you just eat it a different day (the trial\'s own start date gets corrected instead)?',
      },
      {
        heading: 'Skipped meals',
        body: 'A meal you marked Skipped ahead of time shows here too, as a plain record -- it was never assumed to have happened, so there is nothing to correct.',
      },
    ],
  },
  {
    key: 'dailyMealPlan',
    label: 'Meal Plan',
    icon: 'sparkles-outline',
    help: [
      {
        heading: 'What this is',
        body: 'One day, or up to 6 weeks at once, generated on demand: breakfast, lunch, and dinner, picked live from the same recipes "Meals You Can Eat" already knows are safe for every condition you\'ve selected and match every diet preference you\'ve set on Profile, both at once. Different from the Meal Plan lens: that one is a fixed, hand-written 6-week rotation; this one is built new each time from whatever you\'ve currently declared.',
      },
      {
        heading: 'Breakfast rules',
        body: 'Breakfast never includes a smoothie, and never includes a recipe with an actual added sweetener (honey, maple syrup, sugar) as an ingredient. Fruit\'s own natural sugar is never treated as the same thing. Smoothies are offered at lunch instead, alongside a side when the meal alone reads light.',
      },
      {
        heading: 'Rotation across multiple days',
        body: "Picking more than 1 day pulls from a real rotation: every recipe already used this run is deprioritized in favor of whatever hasn't been picked yet, only repeating once every real option has already been used at least once. This is the actual reason more days is worth choosing over generating one day repeatedly -- one day at a time has no memory of what came before it.",
      },
      {
        heading: 'Weekly frequency targets',
        body: FREQUENCY_RULES.map(
          (rule) => `${rule.label}: ${rule.kind === 'atLeast' ? 'at least' : 'no more than'} ${rule.timesPerWeek} times a week (${rule.citation})`,
        ).join(' '),
      },
      {
        heading: 'Carb level',
        body: `"No Carbs" keeps each day under ${NO_CARB_MAX_GRAMS_PER_DAY}g of carbohydrate, the same very-low-carb range clinical sources use for ketosis. "Low Carb" keeps it under ${LOW_CARB_MAX_GRAMS_PER_DAY}g, the commonly-cited low-carbohydrate-diet threshold. "Any" applies no ceiling at all.`,
      },
      {
        heading: 'The health rating',
        body: 'The same green/yellow/red system "Meals You Can Eat" already uses, not a new, separate scale: green means every pick is genuinely clean for every condition selected; yellow means at least one carries a real, milder caution. A recipe with a serious, well-documented concern for any selected condition is never picked here at all.',
      },
      {
        heading: 'Nutrient coverage',
        body: "A real comparison against your own age/sex-based RDA targets for a single generated day, shown for what it is: informational, not the day's rating. Regenerate as many times as you'd like before adding a plan to your actual schedule.",
      },
    ],
  },
  {
    key: 'hydration',
    label: 'Hydration',
    icon: 'water-outline',
    help: [
      {
        heading: 'Hydration is Meals, filtered',
        body: 'A "Beverage" meal (water, tea, coffee, a smoothie; see the Food tab) already is a hydration entry. This lens doesn\'t track anything separately: it\'s the same schedule/meal data, just filtered to beverages and shown with a running water total, so logging or scheduling a drink from either tab shows up in both automatically.',
      },
      REPEATING_SCHEDULES_HELP,
    ],
  },
  {
    key: 'meds',
    label: 'Meds',
    icon: 'flask-outline',
    help: [
      {
        heading: 'One timeline for everything you take',
        body: 'Prescriptions, over-the-counter drugs and supplements are all meds here. Each one that is being tracked shows its reminder times, today\'s doses sit at the top to be marked taken or skipped, and a med with no times still counts toward the day\'s totals through its Tracking switch.',
      },
      {
        heading: 'Defined on Life, timed here',
        body: 'Adding a med, editing its dose or ingredients, pausing it or removing it all happen in Life > My Meds; this page never defines one. From a med there, Schedule it brings you here with that med ready for its times. Add a med at the top of this page goes the other way.',
      },
      {
        heading: 'Interaction checking',
        body: 'Calcium, iron and zinc timing, the fat-soluble vitamins, and levothyroxine against calcium or iron are checked automatically once reminder times are set, along with potassium supplements against blood pressure medications and metformin\'s effect on TSH readings. Anything triggered shows under "Things to check" here.',
      },
      REPEATING_SCHEDULES_HELP,
    ],
  },
  {
    key: 'appointments',
    label: 'Appointments',
    icon: 'calendar-outline',
    help: [
      {
        heading: 'Appointments',
        body: 'Doctor, lab/bloodwork, nutritionist, trainer, or other visits: title, type, date/time, location, and provider. Mark one completed or cancelled once it\'s past, or remove it. Appointments don\'t repeat yet; add each one as it\'s scheduled.',
      },
      {
        heading: 'Phone calendar sync',
        body: 'Appointments can connect to your phone\'s own Calendar app: if you\'ve already added your Outlook or Google account in your phone\'s Settings, its events already live there. "Import from Phone Calendar" pulls in an existing event as an appointment here; "Add to Phone Calendar" pushes an appointment you made here out to your phone\'s calendar so its own reminders fire too. No separate sign-in beyond a one-time permission prompt: this app never talks to Google or Microsoft directly.',
      },
    ],
  },
  {
    key: 'upkeep',
    label: 'Upkeep',
    icon: 'construct-outline',
    help: [
      {
        heading: 'Read from Life, not entered here',
        body: 'Everything under Life > Upkeep that has a date (a service on its interval, a document that runs out) is laid out here by when it is due: overdue, due in the next few weeks, and later. Anything missing the piece it needs to be placed on a calendar is listed too, with what is missing, rather than left off so the list looks complete.',
      },
      {
        heading: 'Done today',
        body: 'Marks a recurring item as done on this date and works out its next due date from its own interval, the same as doing it from Life. Adding an item, changing its interval, or renewing something that expires happens in Life > Upkeep, one tap away from any row.',
      },
    ],
  },
  {
    key: 'exercise',
    label: 'Exercise',
    icon: 'barbell-outline',
    help: [{ heading: 'Exercise', body: 'Schedule planned workouts and activity. Not built yet.' }],
  },
];

const COMING_SOON_COPY: Record<
  Exclude<Lens, 'meals' | 'todaysMeals' | 'pastMeals' | 'dailyMealPlan' | 'meds' | 'hydration' | 'appointments' | 'upkeep'>,
  string
> = {
  exercise: 'Schedule planned workouts and activity. Not built yet.',
};

const SCHEDULE_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page is for',
    body: "So meals, hydration, supplements, prescriptions, and appointments actually happen when they're supposed to, instead of being remembered and then forgotten. Plan them here ahead of time, and this app reminds you and keeps a real record of whether each one actually happened.",
  },
  {
    heading: 'Planning vs. logging',
    body: 'This page is for planning what you intend to do, before you do it. Meals still get logged on the Food tab, either through "Log now" here or by creating a meal there directly.',
  },
  {
    heading: 'Six schedule types, five built so far',
    body: 'Meals, Hydration, Supplements, Prescriptions, and Appointments are fully built. Exercise is still a placeholder.',
  },
  {
    heading: 'Hydration is Meals, filtered',
    body: 'A "Beverage" meal (water, tea, coffee, a smoothie; see the Food tab) already is a hydration entry. This lens doesn\'t track anything separately: it\'s the same schedule/meal data, just filtered to beverages and shown with a running water total, so logging or scheduling a drink from either tab shows up in both automatically.',
  },
  {
    heading: 'From templates & favorites, or unplanned',
    body: 'On the Food tab, pick a meal type first. "From templates & favorites" shows only your saved meals/favorites that match that meal type. "Something unplanned" is for when the day did not go as planned (e.g. you ate out); type in your best guess of what you actually had.',
  },
  {
    heading: '"Log now"',
    body: 'Turns a planned meal into a logged entry. If it was scheduled from a template or favorite, the Meals builder opens with those exact ingredients already filled in.',
  },
  {
    heading: '"Rotate" (smoothies, mixed vegetables, mixed fruit)',
    body: 'Shows up on a planned meal only when it was scheduled from a favorite that has at least one ingredient marked Rotating (set on the Food tab: tap "Rotate?" next to an ingredient in a side). Tap any alternate to make it current for this specific scheduled meal, or randomize one or all of them, then Save. This choice belongs to this one occurrence only; rotating a Tuesday smoothie never changes what a Wednesday one shows, even if both were scheduled from the same favorite, so you can plan variety across several upcoming days ahead of time. Whatever\'s chosen is exactly what "Log now" prefills and what actually gets logged, so nutrients, condition scores, and Trends always reflect the ingredient actually used that day.',
  },
  {
    heading: 'Planned, Logged, Skipped',
    body: 'A planned meal you never got to stays marked "Planned," not silently dropped. "Skip" marks it as intentionally not happening today, without deleting the record of what you had planned.',
  },
  {
    heading: 'Usual meal times & fasting window',
    body: 'Set in Profile. "Usual meal times" just pre-fills the time picker for that meal type. If you turn on fasting and set an eating window, this page will not let you schedule a meal outside it.',
  },
  {
    heading: 'Supplements: document every ingredient',
    body: 'For a supplement\'s contribution to count toward your daily totals, document exactly what one dose contains: each ingredient, its amount, and its unit (mg, mcg, g, or IU). A single-ingredient product gets one row; a multivitamin gets one row per nutrient on its label.',
  },
  {
    heading: 'Tracking / Not tracking',
    body: 'This one toggle covers stopping a supplement, cycling on and off it, or taking it temporarily (e.g. only during a training block); flip it off when you are not taking it and back on when you are. Nothing is deleted either way, so you never have to re-enter its ingredients.',
  },
  {
    heading: 'Reminder times are separate from tracking',
    body: 'A supplement\'s contribution to your daily totals always comes from the Tracking toggle alone. Adding reminder times underneath it is optional and purely a personal adherence record: for a supplement that needs a specific dose time (e.g. away from calcium, or with a meal for fat solubility), not a second way of counting it.',
  },
  {
    heading: 'Prescriptions',
    body: 'Track what you take, its dose and frequency, and (optionally) specific reminder times: same on/off Tracking toggle and repeat picker as Supplements. Prescriptions don\'t contribute nutrients, so there\'s no ingredient list to document.',
  },
  {
    heading: 'Appointments',
    body: 'Doctor, lab/bloodwork, nutritionist, trainer, or other visits: title, type, date/time, location, and provider. Mark one completed or cancelled once it\'s past, or remove it. Appointments don\'t repeat yet (most get booked one at a time anyway); add each one as it\'s scheduled.',
  },
  {
    heading: 'Phone calendar sync',
    body: 'Appointments can connect to your phone\'s own Calendar app: if you\'ve already added your Outlook or Google account in your phone\'s Settings, its events already live there. "Import from Phone Calendar" pulls in an existing event as an appointment here; "Add to Phone Calendar" pushes an appointment you made here out to your phone\'s calendar so its own reminders fire too. No separate sign-in, and nothing beyond a one-time permission prompt: this app never talks to Google or Microsoft directly.',
  },
  {
    heading: 'Interaction checking, once there is data to check',
    body: 'Calcium/iron/zinc timing and the fat-soluble vitamins are checked automatically. Levothyroxine + calcium/iron timing is checked too, once you track levothyroxine as a prescription and calcium/iron as supplements with reminder times set. This app matches a prescription by name (e.g. "levothyroxine" anywhere in what you named it). Biotin + an upcoming lab draw is checked automatically too, once you\'re tracking biotin and have a "Lab / bloodwork" appointment scheduled within the next couple weeks. Anything triggered shows under "Things to check" on the Supplements and Prescriptions tabs.',
  },
  {
    heading: 'Repeating schedules',
    body: 'Meal, drink, supplement, and prescription reminders can repeat daily: indefinitely, a set number of times, or until a date you choose. Entries are generated about 60 days ahead and topped up automatically, so editing, skipping, or removing one day never touches any other.',
  },
];

function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

function validateRepeat(repeat: RepeatConfig): string | null {
  if (repeat.type !== 'daily') return null;
  if (repeat.endType === 'count' && (!repeat.count || repeat.count < 1)) {
    return 'Enter how many times this should repeat.';
  }
  if (repeat.endType === 'until_date' && (!repeat.until || !/^\d{4}-\d{2}-\d{2}$/.test(repeat.until))) {
    return 'Enter a valid end date (YYYY-MM-DD).';
  }
  return null;
}

function usualTimeForMealType(profile: UserProfile | null, mealType: string): string | null {
  if (!profile) return null;
  switch (mealType) {
    case 'breakfast':
      return profile.usualBreakfastTime;
    case 'lunch':
      return profile.usualLunchTime;
    case 'dinner':
      return profile.usualDinnerTime;
    case 'snack':
      return profile.usualSnackTime;
    default:
      return null;
  }
}

type SourceMatch = { key: string; title: string; favoriteId?: string; mealId?: string };

// Every favorite/template that matches the chosen meal type -- favorites
// carry their meal type inside payload_json (not a queryable column), so
// this parses each one rather than filtering in SQL.
function matchingFavorites(favorites: FavoriteRecord[], mealType: string): SourceMatch[] {
  const matches: SourceMatch[] = [];
  for (const favorite of favorites) {
    try {
      const payload = JSON.parse(favorite.payload_json) as MealFavoritePayload;
      if (payload.mealType === mealType) {
        matches.push({ key: `fav_${favorite.id}`, title: favorite.name, favoriteId: favorite.id });
      }
    } catch {
      // Malformed payload -- skip rather than crash the picker over one bad row.
    }
  }
  return matches;
}

function matchingTemplates(templates: MealRecord[], mealType: string): SourceMatch[] {
  return templates
    .filter((meal) => meal.meal_type === mealType)
    .map((meal) => ({ key: `meal_${meal.id}`, title: meal.name, mealId: meal.id }));
}

type FormState = {
  editingId: string | null;
  mealType: string;
  mode: 'source' | 'unplanned';
  title: string;
  sourceFavoriteId: string | null;
  sourceMealId: string | null;
  time: TimeOfDayInput;
  repeat: RepeatConfig;
  // Which real calendar day this is being scheduled for -- 2026-08-18,
  // added alongside the Meals lens' own new week strip. Never a free-text
  // field here (unlike Appointments' own date input): openAddForm seeds it
  // from whichever day is currently selected in the strip, openEditForm
  // seeds it from the item's own real scheduledFor, so it's always a
  // real, valid 'YYYY-MM-DD' by construction -- no isValidDateString
  // guard needed in handleSaveForm the way Appointments' own typed field
  // needs one.
  date: string;
};

const BLANK_FORM: FormState = {
  editingId: null,
  mealType: '',
  mode: 'source',
  title: '',
  sourceFavoriteId: null,
  sourceMealId: null,
  time: { hour: '', minute: '', ampm: '' },
  repeat: { type: 'none' },
  date: '',
};

// Recurrence is decided once, at creation time -- editing an existing
// occurrence only ever touches that one row (see updateScheduledMeal), so
// this picker is only shown while scheduling a brand-new item, never while
// editing one that already exists. "Just once" vs "Every day", and if
// "Every day", how it should eventually stop: never, after a fixed number
// of times, or on a specific date.
function RepeatPicker({ repeat, onChange }: { repeat: RepeatConfig; onChange: (repeat: RepeatConfig) => void }) {
  return (
    <>
      <Text style={styles.label}>Repeat</Text>
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={[styles.pill, repeat.type === 'none' && styles.pillActive]}
          onPress={() => onChange({ type: 'none' })}
        >
          <Text style={[styles.pillText, repeat.type === 'none' && styles.pillTextActive]}>Just once</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, repeat.type === 'daily' && styles.pillActive]}
          onPress={() => onChange({ type: 'daily', endType: repeat.endType ?? 'indefinite', count: repeat.count, until: repeat.until })}
        >
          <Text style={[styles.pillText, repeat.type === 'daily' && styles.pillTextActive]}>Every day</Text>
        </TouchableOpacity>
      </View>

      {repeat.type === 'daily' ? (
        <>
          <View style={[styles.pillRow, { marginTop: 8 }]}>
            {(['indefinite', 'count', 'until_date'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.pillSmall, repeat.endType === option && styles.pillActive]}
                onPress={() => onChange({ ...repeat, endType: option })}
              >
                <Text style={[styles.pillTextSmall, repeat.endType === option && styles.pillTextActive]}>
                  {option === 'indefinite' ? 'Indefinitely' : option === 'count' ? 'A number of times' : 'Until a date'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {repeat.endType === 'count' ? (
            <AppTextInput
              style={[styles.input, styles.timeInput, { marginTop: 8 }]}
              placeholder="e.g. 14"
              keyboardType="number-pad"
              value={repeat.count ? String(repeat.count) : ''}
              onChangeText={(text) => onChange({ ...repeat, count: Number(text) || undefined })}
            />
          ) : null}
          {repeat.endType === 'until_date' ? (
            <AppTextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="YYYY-MM-DD"
              value={repeat.until ?? ''}
              onChangeText={(text) => onChange({ ...repeat, until: text })}
            />
          ) : null}
          <Text style={styles.helperText}>
            Generates entries about 60 days ahead at a time, topped up automatically as time passes. Editing or
            skipping one day never affects any other.
          </Text>
        </>
      ) : null}
    </>
  );
}

// Real week-strip navigation, 2026-08-18 -- direct request: "a way to
// actually see a calendar where our meals are scheduled." Before this,
// Meals only ever fetched listScheduledMealsForDate(todayDateString()),
// so a meal scheduled for three days out was real, running data with no
// screen anywhere that could show it. Sunday-start week, matching this
// device's own default Date.getDay() convention (0 = Sunday) -- a real,
// deliberate simplification, not something Profile has ever asked the
// person to configure.
function startOfWeekLocal(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - date.getDay());
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// How many real calendar days sit between two 'YYYY-MM-DD' strings --
// used to preserve which day-of-week is selected when paging a whole week
// at once (see shiftWeek below), rather than always snapping back to
// Sunday.
function daysBetweenLocal(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split('-').map(Number);
  const [ty, tm, td] = toDate.split('-').map(Number);
  const diffMs = new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime();
  return Math.round(diffMs / 86400000);
}

function formatWeekdayShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDayNumber(dateStr: string): string {
  return String(Number(dateStr.slice(8, 10)));
}

// formatShortDate/addDaysToDateStringLocal are defined further down (they
// started life Appointments-only, see that section's own note) -- both are
// plain function declarations, hoisted the same as every other helper in
// this file, so calling them from up here is safe.
function formatWeekRangeLabel(weekStartDate: string): string {
  return `${formatShortDate(weekStartDate)} – ${formatShortDate(addDaysToDateStringLocal(weekStartDate, 6))}`;
}

// "today"/"tomorrow"/"yesterday" read far more naturally than a bare date
// for the three days someone actually cares about most -- everything else
// falls back to the same short Month Day format used everywhere else on
// this page.
function describeRelativeDate(dateStr: string): string {
  const today = todayDateString();
  if (dateStr === today) return 'today';
  if (dateStr === addDaysToDateStringLocal(today, 1)) return 'tomorrow';
  if (dateStr === addDaysToDateStringLocal(today, -1)) return 'yesterday';
  return formatShortDate(dateStr);
}

// The Meals lens -- the one schedule type with real functionality behind
// it. Renders just its own body content (no ScreenHeader/lens tabs of its
// own); the outer ScheduleScreen owns those and mounts this only when the
// Meals lens is selected. Shows a real, navigable week strip (see the
// helpers just above) rather than only ever today, and can sync an
// individual scheduled meal to the phone's own Calendar app the same way
// Appointments already does (see ensureDeviceCalendarPermission/
// handleAddToDeviceCalendar below, both reusing lib/deviceCalendar.ts).
// 2026-08-30, direct steer: "Ate out or off-plan maybe could be available
// from the Schedules screen." It fits here better than anywhere: this lens is
// where a planned meal sits waiting, and the voice screen is what resolves one
// that did not happen the way it was planned.
// 2026-09-13: an action band, the same row every Home quick action is.
function OffPlanShortcut() {
  const router = useRouter();
  return (
    <View style={styles.bandOut}>
      <HomeSectionBand
        kind="action"
        title="Ate out or off-plan? Say it"
        icon="mic-outline"
        color={TAB_COLOR}
        onPress={() => router.push('/voice-log')}
      />
    </View>
  );
}

// Every band on Schedules folds. 2026-09-13, asked how the lenses should
// take the band look Food had just taken: "Everything folds", every band
// closed until tapped, with its count in the title so a folded band still
// says how much is behind it. Which bands are open is remembered per band
// through useBandFolds (keys like "schedule:meals:day"), so a list opened
// once stays open on the next visit rather than costing a tap each time.
// One helper so every lens builds the same band the same way.
type ScheduleFolds = ReturnType<typeof useBandFolds>;

function ScheduleBand({
  folds,
  id,
  title,
  icon,
  count,
  children,
}: {
  folds: ScheduleFolds;
  id: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  count?: number;
  children: ReactNode;
}) {
  return (
    <View style={styles.bandOut}>
      <HomeSectionBand
        kind="fold"
        title={count == null ? title : `${title} (${count})`}
        icon={icon}
        color={TAB_COLOR}
        expanded={folds.isOpen(id)}
        onToggle={() => folds.toggle(id)}
      >
        {children}
      </HomeSectionBand>
    </View>
  );
}

function MealsLens() {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [items, setItems] = useState<ScheduleItemRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [templates, setTemplates] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Added 2026-08-29 for the "Add Meal Anyway" choice on the eating-window
  // check, which needs a real two-option prompt rather than a single-OK alert.
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);
  // weekStart/selectedDate deliberately aren't reset on focus (unlike
  // `revealed` elsewhere in this file) -- navigating away to another tab
  // and back should leave you looking at whichever week/day you were
  // already on, the same "persists across a tab switch" behavior every
  // other real picked-value state on this screen already has.
  const [weekStart, setWeekStart] = useState<string>(() => startOfWeekLocal(todayDateString()));
  const [selectedDate, setSelectedDate] = useState<string>(() => todayDateString());
  const [calendarPermissionGranted, setCalendarPermissionGranted] = useState<boolean | null>(null);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) dates.push(addDaysToDateStringLocal(weekStart, i));
    return dates;
  }, [weekStart]);

  // The whole visible week is fetched in one real query (see load below),
  // then grouped client-side by day -- both for the strip's own "does this
  // day have anything on it" dot, and so switching which day is selected
  // is a cheap, instant, local re-filter rather than a fresh network/DB
  // round trip every tap.
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ScheduleItemRecord[]>();
    for (const item of items) {
      const date = item.scheduledFor.slice(0, 10);
      const bucket = map.get(date);
      if (bucket) bucket.push(item);
      else map.set(date, [item]);
    }
    return map;
  }, [items]);

  const selectedItems = itemsByDate.get(selectedDate) ?? [];

  const load = useCallback(() => {
    setLoading(true);
    const weekEnd = addDaysToDateStringLocal(weekStart, 6);
    // settlePastScheduledMeals first, 2026-08-14 -- a real, idempotent
    // "catch anything that's lapsed since this screen was last open" pass
    // (see its own comment in lib/db.ts), so this week's own schedule and
    // every other real caller that reads meal data (Trends, Insights,
    // Home) stay accurate the moment this screen is opened, not just
    // whenever Past Meals happens to be visited.
    settlePastScheduledMeals()
      .catch((error) => console.error('settlePastScheduledMeals failed', error))
      .then(() => ensureScheduleSeriesGenerated())
      .then(() =>
        Promise.all([
          listScheduledMealsForDateRange(weekStart, weekEnd),
          getUserProfile(),
          listFavorites(100, 'meal'),
          listMeals(100),
          hasCalendarPermission(),
        ]),
      )
      .then(([scheduled, loadedProfile, loadedFavorites, loadedTemplates, granted]) => {
        setItems(scheduled);
        setProfile(loadedProfile);
        setFavorites(loadedFavorites);
        setTemplates(loadedTemplates);
        setCalendarPermissionGranted(granted);
      })
      .catch((error) => {
        setErrorMessage(`Could not load this week's schedule: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
    // weekStart in deps, deliberately -- this is what makes the existing
    // useFocusEffect(useCallback(() => load(), [load])) below re-fetch the
    // moment shiftWeek/jumpToToday change which week is visible, per that
    // hook's own documented "re-runs when the callback identity changes
    // while still focused" behavior, with no separate effect needed.
  }, [weekStart]);

  // Pages a whole week at once, preserving which day-of-week was selected
  // (viewing Wednesday and paging forward should land on next Wednesday,
  // not reset to Sunday) rather than the offset getting lost.
  function shiftWeek(deltaWeeks: number) {
    const offset = daysBetweenLocal(weekStart, selectedDate);
    const newWeekStart = addDaysToDateStringLocal(weekStart, deltaWeeks * 7);
    setWeekStart(newWeekStart);
    setSelectedDate(addDaysToDateStringLocal(newWeekStart, offset));
  }

  function jumpToToday() {
    const today = todayDateString();
    setWeekStart(startOfWeekLocal(today));
    setSelectedDate(today);
  }

  // useFocusEffect, not a plain useEffect -- Expo Router keeps tab screens
  // mounted in the background on tab switch, so a one-time effect would
  // only ever fetch once for this screen's whole lifetime (the same bug
  // just fixed on the Insights tab).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openAddForm() {
    // Seeded from whichever day is currently selected in the week strip --
    // navigate to a day first, then "+Schedule a meal" schedules for that
    // real day, the same discoverable pattern this lens already used
    // (implicitly, always "today") before the strip existed.
    setForm({ ...BLANK_FORM, date: selectedDate });
    setShowForm(true);
  }

  function openEditForm(item: ScheduleItemRecord) {
    setForm({
      editingId: item.id,
      mealType: item.mealType ?? '',
      mode: 'unplanned',
      title: item.title,
      sourceFavoriteId: item.sourceFavoriteId,
      sourceMealId: item.sourceMealId,
      time: splitTime24(item.scheduledFor.split('T')[1] ?? null),
      repeat: { type: 'none' },
      // Preserves the item's own real date -- handleSaveForm used to
      // unconditionally rebuild scheduledFor against todayDateString(),
      // which silently moved ANY edited meal back to today. Harmless while
      // this lens only ever showed today's own items; a real, reachable
      // bug the moment a week view lets you edit a meal on a different day.
      date: item.scheduledFor.slice(0, 10),
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(BLANK_FORM);
  }

  // Picking a meal type defaults the time to this person's own stated
  // usual time for it, if they've set one in Profile -- they can still
  // change it, this just saves re-entering the same time every day.
  function handlePickMealType(mealType: string) {
    const usual = usualTimeForMealType(profile, mealType);
    setForm((current) => ({
      ...current,
      mealType,
      title: '',
      sourceFavoriteId: null,
      sourceMealId: null,
      time: usual ? splitTime24(usual) : current.time,
    }));
  }

  function handlePickSource(match: SourceMatch) {
    setForm((current) => ({
      ...current,
      title: match.title,
      sourceFavoriteId: match.favoriteId ?? null,
      sourceMealId: match.mealId ?? null,
    }));
  }

  async function handleSaveForm() {
    if (!form.mealType) {
      showInfoAlert('Almost there', 'Pick a meal type first.');
      return;
    }
    if (!form.title.trim()) {
      showInfoAlert('Almost there', form.mode === 'source' ? 'Pick a template or favorite first.' : 'Enter what you plan to eat.');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(form.time.hour, form.time.minute, form.time.ampm));
      return;
    }
    const repeatError = form.editingId ? null : validateRepeat(form.repeat);
    if (repeatError) {
      showInfoAlert('Almost there', repeatError);
      return;
    }

    // 2026-08-29: this used to be a hard block with a single OK button and
    // no way through. Direct request: "what if they missed a meal, or they
    // were sick and need to eat something? Instead of that response being
    // just plain OK and no way to add the meal, have the choice be OK or
    // Add Meal Anyway... It needs to be logged as being outside of the
    // eating window, but kept for the trend info." Correct: a fasting
    // window is a goal someone set, not a lock on their own food, and a
    // real off-window meal is exactly the kind of thing trend analysis
    // should be able to see rather than something the app refuses to
    // record at all.
    let outsideEatingWindow = false;
    if (profile?.fastingEnabled && profile.eatingWindowStart && profile.eatingWindowEnd) {
      // Local re-check of isWithinEatingWindow's own logic -- kept here
      // rather than imported so this screen still notices the window even
      // if that import ever broke.
      const { eatingWindowStart, eatingWindowEnd } = profile;
      const withinWindow =
        eatingWindowStart <= eatingWindowEnd
          ? time24 >= eatingWindowStart && time24 < eatingWindowEnd
          : time24 >= eatingWindowStart || time24 < eatingWindowEnd;

      if (!withinWindow) {
        const addAnyway = await confirmSheet({
          title: 'Outside your eating window',
          message: `Your eating window is ${formatTime12(eatingWindowStart)} - ${formatTime12(eatingWindowEnd)}, and this meal is at ${formatTime12(time24)}. You can still add it, for a missed meal, feeling unwell, or any other reason. It will be saved and marked as outside your window, so your trends stay accurate rather than missing a meal you actually ate.`,
          confirmLabel: 'Add Meal Anyway',
          cancelLabel: 'Pick Another Time',
        });
        if (!addAnyway) return;
        outsideEatingWindow = true;
      }
    }

    const scheduledFor = `${form.date}T${time24}`;

    try {
      if (form.editingId) {
        await updateScheduledMeal(form.editingId, {
          title: form.title,
          mealType: form.mealType,
          scheduledFor,
          outsideEatingWindow,
        });
      } else {
        await scheduleMeal({
          title: form.title,
          mealType: form.mealType,
          scheduledFor,
          sourceFavoriteId: form.sourceFavoriteId ?? undefined,
          sourceMealId: form.sourceMealId ?? undefined,
          repeat: form.repeat,
          outsideEatingWindow,
        });
      }
      closeForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  // Real, 4-way branch, 2026-08-18 -- an occurrence can independently repeat
  // AND be linked to the phone calendar (each occurrence carries its own
  // real linked_device_calendar_event_id; a repeating series has no
  // series-level device link), so every real combination gets its own
  // honest, complete action list rather than silently dropping one.
  function handleRemove(item: ScheduleItemRecord) {
    const hasRepeat = Boolean(item.repeatGroupId);
    const hasCalendarLink = Boolean(item.linkedDeviceCalendarEventId);

    const removeOne = (alsoRemoveFromCalendar: boolean) => {
      void (async () => {
        if (alsoRemoveFromCalendar && item.linkedDeviceCalendarEventId) {
          await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
        }
        await deleteScheduledMeal(item.id);
        load();
      })();
    };
    const removeSeries = (alsoRemoveFromCalendar: boolean) => {
      void (async () => {
        if (alsoRemoveFromCalendar && item.linkedDeviceCalendarEventId) {
          await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
        }
        await deleteScheduleSeries(item.repeatGroupId!);
        load();
      })();
    };

    let actions: AppActionSheetAction[];
    let message: string;
    if (hasRepeat && hasCalendarLink) {
      message = `"${item.title}" repeats and this occurrence is also on your phone calendar.`;
      actions = [
        { label: 'Just this one', onPress: () => removeOne(false) },
        { label: 'Just this one, and from calendar', destructive: true, onPress: () => removeOne(true) },
        { label: 'This and future', onPress: () => removeSeries(false) },
        { label: 'This and future, and from calendar', destructive: true, onPress: () => removeSeries(true) },
        { label: 'Cancel', onPress: () => {} },
      ];
    } else if (hasRepeat) {
      message = `"${item.title}" repeats. Remove just this occurrence, or this and every future one?`;
      actions = [
        { label: 'Just this one', onPress: () => removeOne(false) },
        { label: 'This and future', destructive: true, onPress: () => removeSeries(false) },
        { label: 'Cancel', onPress: () => {} },
      ];
    } else if (hasCalendarLink) {
      message = `"${item.title}" is also on your phone calendar.`;
      actions = [
        { label: 'Remove here only', onPress: () => removeOne(false) },
        { label: 'Remove from both', destructive: true, onPress: () => removeOne(true) },
        { label: 'Cancel', onPress: () => {} },
      ];
    } else {
      message = `"${item.title}" will no longer show on your schedule.`;
      actions = [
        { label: 'Remove', destructive: true, onPress: () => removeOne(false) },
        { label: 'Cancel', onPress: () => {} },
      ];
    }

    setRemovePrompt({ title: 'Remove this planned meal?', message, actions });
  }

  // Same permission-request-plus-explain flow Appointments already uses,
  // pulled out to a real, shared helper (see its own definition, further
  // down alongside the other device-calendar utilities) now that Meals
  // needs the identical thing -- not duplicated a second time with slightly
  // different wording that could drift.
  async function ensureCalendarPermission(): Promise<boolean> {
    return ensureDeviceCalendarPermission(calendarPermissionGranted, setCalendarPermissionGranted, showInfoAlert, 'meals');
  }

  async function handleAddToDeviceCalendar(item: ScheduleItemRecord) {
    const granted = await ensureCalendarPermission();
    if (!granted) return;

    const [datePart, timePart] = item.scheduledFor.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute);
    // A real, shorter default than Appointments' own 1-hour guess -- a
    // meal is realistically a 30-minute block on a calendar, not an
    // hour-long visit.
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    try {
      const eventId = await createDeviceCalendarEvent({
        // Meal type prefixed on, unlike Appointments' own title -- a plain
        // dish name ("Grilled Chicken Sandwich") reads fine inside this
        // app, where the meal-type pill/icon already gives it context, but
        // loses that context entirely once it's sitting in the phone's own
        // Calendar app.
        title: item.mealType ? `${capitalize(item.mealType)}: ${item.title}` : item.title,
        startDate,
        endDate,
        notes: item.notes ?? undefined,
      });
      if (!eventId) {
        showInfoAlert('Could not add to calendar', 'No writable calendar was found on this device.');
        return;
      }
      await linkScheduleItemToDeviceCalendarEvent(item.id, eventId);
      load();
    } catch (error) {
      showInfoAlert('Could not add to calendar', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemoveFromDeviceCalendar(item: ScheduleItemRecord) {
    if (!item.linkedDeviceCalendarEventId) return;
    await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
    await unlinkScheduleItemFromDeviceCalendarEvent(item.id);
    load();
  }

  async function handleToggleSkipped(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    load();
  }

  function handleLogNow(item: ScheduleItemRecord) {
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

  // "Rotate ingredients" changes what's current for THIS one scheduled
  // occurrence only -- persisted on the schedule_items row itself (see
  // setScheduledMealRotationSelections), never on the favorite. That's
  // deliberate: the whole point is being able to plan real variety across
  // several upcoming days ahead of time (e.g. a repeating daily smoothie
  // with a different green each day), so rotating Tuesday's occurrence
  // must never change what Wednesday's shows too, even though both point
  // at the same favorite. Whatever's chosen is exactly what "Log now"
  // prefills for that occurrence and therefore exactly what ends up in
  // that day's real meal_items, so nutrients/condition scores/Trends automatically
  // reflect it with no separate recalculation step -- and, later, an
  // automatic shopping list can read each upcoming occurrence's own
  // resolved ingredients the same way.
  function favoriteBaseIngredients(favoriteId: string | null): MealIngredientInput[] {
    if (!favoriteId) return [];
    const favorite = favorites.find((candidate) => candidate.id === favoriteId);
    if (!favorite) return [];
    try {
      const payload = JSON.parse(favorite.payload_json) as MealFavoritePayload;
      // ?? [], 2026-08-08 -- a real, not just defensive, case now: Meal
      // Builder's own new meal favorites (lib/db.ts's MealFavoriteComponentsPayload)
      // share this same 'meal' item_type/table but genuinely carry no
      // per-ingredient rotation data (that's an old-builder-specific
      // feature) -- reporting zero rotating ingredients for one is the
      // correct answer, not a bug to guard against.
      return payload.ingredients ?? [];
    } catch {
      return [];
    }
  }

  function favoriteRotatingIngredients(favoriteId: string | null): MealIngredientInput[] {
    return favoriteBaseIngredients(favoriteId).filter((ingredient) => (ingredient.rotationAlternates?.length ?? 0) > 0);
  }

  const [rotatingItem, setRotatingItem] = useState<ScheduleItemRecord | null>(null);
  const [rotatingIngredients, setRotatingIngredients] = useState<MealIngredientInput[]>([]);

  function openRotateSheet(item: ScheduleItemRecord) {
    const baseRotating = favoriteRotatingIngredients(item.sourceFavoriteId);
    let existingSelections: RotationSelection[] = [];
    if (item.rotationSelectionsJson) {
      try {
        existingSelections = JSON.parse(item.rotationSelectionsJson) as RotationSelection[];
      } catch {
        existingSelections = [];
      }
    }
    setRotatingItem(item);
    setRotatingIngredients(applyRotationSelectionsToIngredients(baseRotating, existingSelections));
  }

  function closeRotateSheet() {
    setRotatingItem(null);
    setRotatingIngredients([]);
  }

  function selectRotationAlternate(ingredientIndex: number, alternateIndex: number) {
    setRotatingIngredients((current) =>
      current.map((ingredient, index) => (index === ingredientIndex ? applyRotationSelection(ingredient, alternateIndex) : ingredient)),
    );
  }

  function randomizeRotation(ingredientIndex: number) {
    const alternates = rotatingIngredients[ingredientIndex]?.rotationAlternates ?? [];
    if (alternates.length === 0) return;
    selectRotationAlternate(ingredientIndex, Math.floor(Math.random() * alternates.length));
  }

  function randomizeAllRotations() {
    setRotatingIngredients((current) =>
      current.map((ingredient) => {
        const alternates = ingredient.rotationAlternates ?? [];
        if (alternates.length === 0) return ingredient;
        return applyRotationSelection(ingredient, Math.floor(Math.random() * alternates.length));
      }),
    );
  }

  async function handleSaveRotation() {
    if (!rotatingItem) return;
    try {
      const selections: RotationSelection[] = rotatingIngredients
        .filter((ingredient): ingredient is MealIngredientInput & { slotId: string } => Boolean(ingredient.slotId))
        .map((ingredient) => ({
          slotId: ingredient.slotId,
          foodId: ingredient.foodId,
          foodName: ingredient.foodName,
          category: ingredient.category,
        }));
      await setScheduledMealRotationSelections(rotatingItem.id, selections);
      closeRotateSheet();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  const sourceMatches = form.mealType
    ? [...matchingFavorites(favorites, form.mealType), ...matchingTemplates(templates, form.mealType)]
    : [];

  return (
    <>
    {infoAlertElement}
    {confirmSheetElement}
    <AppActionSheet
      visible={removePrompt !== null}
      onClose={() => setRemovePrompt(null)}
      title={removePrompt?.title}
      message={removePrompt?.message}
      actions={removePrompt?.actions ?? []}
    />
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <OffPlanShortcut />
      {loading ? (
          <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
        ) : errorMessage ? (
          <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
        ) : (
          <>
            <View style={styles.weekStripCard}>
              <View style={styles.weekStripNav}>
                <TouchableOpacity
                  style={styles.weekNavButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => shiftWeek(-1)}
                >
                  <Text style={styles.weekNavButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.weekRangeLabel}>{formatWeekRangeLabel(weekStart)}</Text>
                <TouchableOpacity
                  style={styles.weekNavButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => shiftWeek(1)}
                >
                  <Text style={styles.weekNavButtonText}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.weekDayRow}>
                {weekDates.map((date) => {
                  const isSelected = date === selectedDate;
                  const isToday = date === todayDateString();
                  const hasItems = itemsByDate.has(date);
                  return (
                    <TouchableOpacity
                      key={date}
                      style={[styles.weekDayCell, isSelected && styles.weekDayCellSelected, isToday && !isSelected && styles.weekDayCellToday]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[styles.weekDayLabel, isSelected && styles.weekDayLabelSelected]}>
                        {formatWeekdayShort(date)}
                      </Text>
                      <Text style={[styles.weekDayNumber, isSelected && styles.weekDayLabelSelected]}>
                        {formatDayNumber(date)}
                      </Text>
                      <View
                        style={[
                          styles.weekDayDot,
                          hasItems && (isSelected ? styles.weekDayDotActiveSelected : styles.weekDayDotActive),
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedDate !== todayDateString() ? (
                <TouchableOpacity onPress={jumpToToday}>
                  <Text style={styles.weekTodayLink}>Jump back to today</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {!showForm ? (
              <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
                <Text style={styles.addButtonText}>+ Schedule a meal</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.helperText}>Scheduling for {describeRelativeDate(form.date)}.</Text>
                <Text style={styles.label}>Meal type</Text>
                <View style={styles.pillRow}>
                  {mealTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pill, form.mealType === type && styles.pillActive]}
                      onPress={() => handlePickMealType(type)}
                    >
                      <Text style={[styles.pillText, form.mealType === type && styles.pillTextActive]}>
                        {capitalize(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {form.mealType && !form.editingId ? (
                  <>
                    <View style={styles.modeRow}>
                      <TouchableOpacity
                        style={[styles.modeTab, form.mode === 'source' && styles.modeTabActive]}
                        onPress={() => setForm((current) => ({ ...current, mode: 'source' }))}
                      >
                        <Text style={[styles.modeTabText, form.mode === 'source' && styles.modeTabTextActive]}>
                          From templates & favorites
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modeTab, form.mode === 'unplanned' && styles.modeTabActive]}
                        onPress={() => setForm((current) => ({ ...current, mode: 'unplanned', sourceFavoriteId: null, sourceMealId: null }))}
                      >
                        <Text style={[styles.modeTabText, form.mode === 'unplanned' && styles.modeTabTextActive]}>
                          Something unplanned
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {form.mode === 'source' ? (
                      sourceMatches.length === 0 ? (
                        <Text style={styles.helperText}>
                          No {capitalize(form.mealType)} templates or favorites yet. Save a meal as a favorite, or
                          switch to "Something unplanned" below.
                        </Text>
                      ) : (
                        <View style={styles.sourceList}>
                          {sourceMatches.map((match) => {
                            const selected =
                              (match.favoriteId != null && match.favoriteId === form.sourceFavoriteId) ||
                              (match.mealId != null && match.mealId === form.sourceMealId);
                            return (
                              <TouchableOpacity
                                key={match.key}
                                style={[styles.sourceRow, selected && styles.sourceRowSelected]}
                                onPress={() => handlePickSource(match)}
                              >
                                <Text style={[styles.sourceRowText, selected && styles.sourceRowTextSelected]}>
                                  {match.title}
                                </Text>
                                <Text style={styles.sourceRowKind}>{match.favoriteId ? 'Favorite' : 'Template'}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )
                    ) : (
                      <>
                        <Text style={styles.helperText}>
                          Didn't go as planned? Log your best guess of what you actually had (or plan to).
                        </Text>
                        <View style={styles.labelRow}>
                          <AppTextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="e.g. Lunch out with a coworker, probably a sandwich and fries"
                            value={form.title}
                            onChangeText={(text) => setForm((current) => ({ ...current, title: text, sourceFavoriteId: null, sourceMealId: null }))}
                          />
                          <VoiceInputButton
                            onResult={(text) => setForm((current) => ({ ...current, title: text, sourceFavoriteId: null, sourceMealId: null }))}
                            color={TAB_COLOR}
                          />
                        </View>
                      </>
                    )}
                  </>
                ) : null}

                {form.editingId ? (
                  <>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>What do you plan to eat?</Text>
                      <VoiceInputButton
                        onResult={(text) => setForm((current) => ({ ...current, title: text }))}
                        color={TAB_COLOR}
                      />
                    </View>
                    <AppTextInput
                      style={styles.input}
                      value={form.title}
                      onChangeText={(text) => setForm((current) => ({ ...current, title: text }))}
                    />
                  </>
                ) : null}

                <Text style={styles.label}>About what time?</Text>
                <View style={styles.timeRow}>
                  <AppTextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="8"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={form.time.hour}
                    onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                  />
                  <Text style={styles.timeSeparator}>:</Text>
                  <AppTextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="00"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={form.time.minute}
                    onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, minute: text } }))}
                  />
                  <View style={styles.pillRow}>
                    {(['AM', 'PM'] as const).map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[styles.pillSmall, form.time.ampm === option && styles.pillActive]}
                        onPress={() => setForm((current) => ({ ...current, time: { ...current.time, ampm: option } }))}
                      >
                        <Text style={[styles.pillTextSmall, form.time.ampm === option && styles.pillTextActive]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {profile?.fastingEnabled && profile.eatingWindowStart && profile.eatingWindowEnd ? (
                  <Text style={styles.helperText}>
                    Your eating window: {formatTime12(profile.eatingWindowStart)} - {formatTime12(profile.eatingWindowEnd)}
                  </Text>
                ) : null}

                {!form.editingId ? (
                  <RepeatPicker repeat={form.repeat} onChange={(repeat) => setForm((current) => ({ ...current, repeat }))} />
                ) : null}

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={closeForm}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSaveForm}>
                    <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Add to schedule'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScheduleBand
              folds={folds}
              id="schedule:meals:day"
              title={capitalize(describeRelativeDate(selectedDate))}
              icon="restaurant-outline"
              count={selectedItems.length}
            >
            {selectedItems.length === 0 ? (
              <Text style={[styles.emptyText, styles.panelStandalone]}>Nothing scheduled for {describeRelativeDate(selectedDate)} yet.</Text>
            ) : (
              <View style={styles.table}>
                {selectedItems.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTime}>{formatTime12(item.scheduledFor.split('T')[1] ?? '')}</Text>
                      <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>{item.title}</Text>
                        <Text style={styles.rowMeta}>
                          {capitalize(item.mealType ?? '')}
                          {item.sourceFavoriteId ? ' · Favorite' : item.sourceMealId ? ' · Template' : ''}
                          {item.status === 'logged' ? ' · Logged' : item.status === 'skipped' ? ' · Skipped' : ''}
                          {item.repeatGroupId ? ' · Repeats' : ''}
                          {item.linkedDeviceCalendarEventId ? ' · On phone calendar' : ''}
                          {/* Marked, not hidden or warned about again: the
                              person already made this call deliberately, so
                              this is a plain factual label for their own
                              records and for trends, not a nag. */}
                          {item.outsideEatingWindow ? ' · Outside eating window' : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rowActions}>
                      {item.status === 'planned' ? (
                        <>
                          <TouchableOpacity onPress={() => handleLogNow(item)}>
                            <Text style={styles.actionTextPrimary}>Log now</Text>
                          </TouchableOpacity>
                          {favoriteRotatingIngredients(item.sourceFavoriteId).length > 0 ? (
                            <TouchableOpacity onPress={() => openRotateSheet(item)}>
                              <Text style={styles.actionText}>Rotate</Text>
                            </TouchableOpacity>
                          ) : null}
                          <TouchableOpacity onPress={() => handleToggleSkipped(item)}>
                            <Text style={styles.actionText}>Skip</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openEditForm(item)}>
                            <Text style={styles.actionText}>Edit</Text>
                          </TouchableOpacity>
                        </>
                      ) : item.status === 'skipped' ? (
                        <TouchableOpacity onPress={() => handleToggleSkipped(item)}>
                          <Text style={styles.actionText}>Un-skip</Text>
                        </TouchableOpacity>
                      ) : null}
                      {item.linkedDeviceCalendarEventId ? (
                        <TouchableOpacity onPress={() => handleRemoveFromDeviceCalendar(item)}>
                          <Text style={styles.actionText}>Unlink calendar</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => handleAddToDeviceCalendar(item)}>
                          <Text style={styles.actionText}>Add to calendar</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => handleRemove(item)}>
                        <Text style={styles.actionTextRemove}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
            </ScheduleBand>
          </>
        )}
    </ScrollView>

    <Modal visible={rotatingItem !== null} transparent animationType="slide" onRequestClose={closeRotateSheet}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeRotateSheet} />
        <View style={styles.rotateSheet}>
          <View style={styles.rotateSheetHeader}>
            <Text style={styles.rotateSheetTitle}>Rotate ingredients: {rotatingItem?.title}</Text>
            <TouchableOpacity onPress={closeRotateSheet}>
              <Text style={styles.rotateSheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Tap any alternate to make it current for this meal, or randomize. This only applies to this one scheduled
            meal; other scheduled meals from the same favorite are unaffected. "Log now" for this meal will use
            whatever you pick here.
          </Text>

          {rotatingIngredients.length > 1 ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={randomizeAllRotations}>
              <Text style={styles.secondaryButtonText}>🎲 Randomize all</Text>
            </TouchableOpacity>
          ) : null}

          <ScrollView style={styles.rotateSheetScroll}>
            {rotatingIngredients.map((ingredient, ingredientIndex) => (
              <View key={`${ingredient.dishName ?? ''}_${ingredient.foodName}_${ingredientIndex}`} style={styles.rotateIngredientCard}>
                <Text style={styles.rotateIngredientLabel}>
                  {ingredient.sideName ? `${ingredient.sideName}: ` : ''}
                  {ingredient.quantity} {ingredient.unit}
                </Text>
                <View style={styles.pillRow}>
                  <View style={[styles.pill, styles.pillActive]}>
                    <Text style={[styles.pillText, styles.pillTextActive]}>{ingredient.foodName}</Text>
                  </View>
                  {(ingredient.rotationAlternates ?? []).map((alternate, alternateIndex) => (
                    <TouchableOpacity
                      key={`${alternate.foodName}_${alternateIndex}`}
                      style={styles.pill}
                      onPress={() => selectRotationAlternate(ingredientIndex, alternateIndex)}
                    >
                      <Text style={styles.pillText}>{alternate.foodName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {(ingredient.rotationAlternates?.length ?? 0) > 0 ? (
                  <TouchableOpacity onPress={() => randomizeRotation(ingredientIndex)}>
                    <Text style={styles.actionText}>🎲 Randomize this one</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={closeRotateSheet}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveRotation}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

// One row in Hydration's merged timeline -- either a real schedule_items
// entry (plannable/loggable/skippable, same as Meals) or a beverage that
// was logged directly from the Food tab with no schedule entry behind it
// at all. Both are shown together deliberately: a beverage is the same
// underlying meal_type='beverage' record either way, so it should show up
// here automatically the moment it exists, not require a second, separate
// "also log it in Hydration" step.
type HydrationRow =
  | { key: string; time: string; title: string; kind: 'scheduled'; item: ScheduleItemRecord }
  | { key: string; time: string; title: string; kind: 'logged-direct' };

function HydrationRowView({
  row,
  onLogNow,
  onToggleSkipped,
  onEdit,
  onRemove,
}: {
  row: HydrationRow;
  onLogNow: (item: ScheduleItemRecord) => void;
  onToggleSkipped: (item: ScheduleItemRecord) => void;
  onEdit: (item: ScheduleItemRecord) => void;
  onRemove: (item: ScheduleItemRecord) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTime}>{row.time ? formatTime12(row.time) : ''}</Text>
        <View style={styles.rowTextCol}>
          <Text style={styles.rowTitle}>{row.title}</Text>
          <Text style={styles.rowMeta}>
            {row.kind === 'logged-direct'
              ? 'Logged from Meals'
              : `${capitalize(row.item.status)}${row.item.sourceFavoriteId ? ' · Favorite' : row.item.sourceMealId ? ' · Template' : ''}${row.item.repeatGroupId ? ' · Repeats' : ''}`}
          </Text>
        </View>
      </View>

      {row.kind === 'scheduled' ? (
        <View style={styles.rowActions}>
          {row.item.status === 'planned' ? (
            <>
              <TouchableOpacity onPress={() => onLogNow(row.item)}>
                <Text style={styles.actionTextPrimary}>Log now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onToggleSkipped(row.item)}>
                <Text style={styles.actionText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onEdit(row.item)}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            </>
          ) : row.item.status === 'skipped' ? (
            <TouchableOpacity onPress={() => onToggleSkipped(row.item)}>
              <Text style={styles.actionText}>Un-skip</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => onRemove(row.item)}>
            <Text style={styles.actionTextRemove}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function formatPastMealDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// "Past Meals" -- 2026-08-14, direct request: a real place to review and,
// when reality differed, correct what actually happened once a scheduled
// meal's time has passed. Every real row here already counts toward
// Trends/Reports the moment its date passes (settlePastScheduledMeals, see
// its own comment in lib/db.ts) -- this lens is purely about reviewing and
// correcting already-real data, not creating it in the first place.
function PastMealsLens() {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [items, setItems] = useState<ScheduleItemRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    // settlePastScheduledMeals first, same reasoning as MealsLens' own
    // load() -- catches anything that's lapsed since this lens was last
    // open, so what's shown here is never stale relative to what Trends
    // already counts.
    settlePastScheduledMeals()
      .catch((error) => console.error('settlePastScheduledMeals failed', error))
      .then(() => listPastScheduledMeals(100))
      .then((rows) => setItems(rows))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Reuses Meal Builder directly (Part 4) -- the exact same real cross-tab
  // navigation convention every other "open Food tab at a specific record"
  // action in this app already uses (handleLogNow just above, food.tsx's
  // own editSideId etc.).
  function openEditor(item: ScheduleItemRecord) {
    if (!item.linkedMealId) return;
    router.push({ pathname: '/food', params: { editMealId: item.linkedMealId } });
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : (
        <ScheduleBand folds={folds} id="schedule:pastMeals:list" title="Past meals" icon="time-outline" count={items.length}>
        {items.length === 0 ? (
        <Text style={[styles.emptyText, styles.panelStandalone]}>No past meals yet.</Text>
        ) : (
        <View style={styles.table}>
          {items.map((item) => {
            // A real, honest edge case, not hidden -- see
            // listPastScheduledMeals' own comment: a 'planned' row this
            // old means auto-materializing it genuinely failed (its own
            // source record was likely deleted). Shown plainly rather than
            // silently dropped, but with nothing real to tap into yet.
            const canEdit = item.status === 'logged' && !!item.linkedMealId;
            return (
              <TouchableOpacity key={item.id} style={styles.row} disabled={!canEdit} onPress={() => openEditor(item)}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTime}>{formatTime12(item.scheduledFor.split('T')[1] ?? '')}</Text>
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>
                      {formatPastMealDate(item.scheduledFor)} · {capitalize(item.mealType ?? '')}
                      {item.status === 'skipped'
                        ? ' · Skipped'
                        : item.status === 'planned'
                          ? " · Couldn't be logged automatically -- open it from Meals to log it directly"
                          : ''}
                    </Text>
                  </View>
                </View>
                {canEdit ? <Text style={styles.actionTextPrimary}>Adjust</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
        )}
        </ScheduleBand>
      )}
    </ScrollView>
  );
}

const CARB_LEVEL_OPTIONS: { value: CarbLevel; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'low', label: `Low Carb (under ${LOW_CARB_MAX_GRAMS_PER_DAY}g/day)` },
  { value: 'noCarb', label: `No Carbs (under ${NO_CARB_MAX_GRAMS_PER_DAY}g/day)` },
];

function healthRatingLabel(rating: DailyMealPlanResult['healthRating']): string {
  if (rating === 'green') return 'Genuinely clean for everything you selected';
  if (rating === 'yellow') return 'Worth knowing: at least one pick carries a real, milder caution';
  return 'Not enough compliant recipes were found to generate a full day';
}

function healthRatingColors(rating: DailyMealPlanResult['healthRating']): { bg: string; text: string; border: string } {
  if (rating === 'green') return { bg: colors.surface, text: colors.statusGood, border: colors.statusGood };
  if (rating === 'yellow') return { bg: colors.statusYellowBg, text: colors.statusYellowStandalone, border: colors.statusYellowStandalone };
  return { bg: colors.statusRedBg, text: colors.danger, border: colors.danger };
}

function healthRatingDotColor(rating: DailyMealPlanResult['healthRating']): string {
  if (rating === 'green') return colors.statusGood;
  if (rating === 'yellow') return colors.statusYellowStandalone;
  return colors.danger;
}

// side/salad/beverage all get the same "Role: " prefix treatment the
// side label already established -- 2026-08-26, the two new real
// "combine across builders" roles (see lib/dailyMealPlan.ts's own
// considerBonusComponent) needed the identical display, not a special
// case.
const DAILY_PLAN_ROLE_LABELS: Partial<Record<DailyMealPlanPick['role'], string>> = {
  side: 'Side',
  salad: 'Salad',
  beverage: 'Beverage',
};

function DailyMealPlanPickRow({ pick }: { pick: DailyMealPlanPick }) {
  const roleLabel = DAILY_PLAN_ROLE_LABELS[pick.role];
  return (
    <View style={styles.dailyPlanPickRow}>
      <Text style={styles.rowTitle}>
        {roleLabel ? `${roleLabel}: ` : ''}
        {pick.entry.title}
      </Text>
      <Text style={styles.helperText}>{Math.round(pick.carbGrams)}g carbohydrate</Text>
    </View>
  );
}

// 2026-08-26, pulled out of the single-day-only render path so a multi-day
// plan can show this exact same full report for whichever one day is
// currently expanded -- "Each week per day needs to be available for
// viewing so they can go through their whole week." Takes the one day's
// own result directly rather than reading from a shared "singleDay"
// variable, so it works identically whether there's genuinely only one
// day or this is day 4 of a 6-week plan.
//
// 2026-09-13, the band look. Rendered two ways, since it sits in two
// places: at the top of the lens for a one-day plan, where each section
// is its own fold band (the rating a headerless band box, since its own
// word is the header); and inside one day's band of a multi-day plan,
// where a band inside a band would put its accent 16px in, so each
// section is an inset box instead.
function DailyPlanFullReport({
  day,
  folds,
  foldId,
}: {
  day: DailyMealPlanResult;
  // Present for the top-level layout; absent when nested in a day band.
  folds?: ScheduleFolds;
  foldId?: string;
}) {
  const ratingColors = healthRatingColors(day.healthRating);
  const nested = !folds || !foldId;
  const ratingWord = day.healthRating === 'green' ? 'Green' : day.healthRating === 'yellow' ? 'Yellow' : 'Incomplete';
  const waterRow = day.nutrientCoverage.find((row) => row.nutrientCode === 'water');
  const remainingMl = waterRow && waterRow.targetAmount != null ? getDailyMealPlanWaterGapMl(day) : 0;
  const mealCount = (day.breakfast ? 1 : 0) + day.lunch.length + day.dinner.length;

  const ratingBlock = (
    <>
      <Text style={[styles.label, { color: ratingColors.text }]}>{ratingWord}</Text>
      <Text style={[styles.helperText, { color: ratingColors.text }]}>{healthRatingLabel(day.healthRating)}</Text>
      <Text style={styles.helperText}>
        Total carbohydrate: {Math.round(day.totalCarbGrams)}g{day.carbCeiling ? ` (target: under ${day.carbCeiling}g)` : ''}
      </Text>
      {day.warnings.map((warning, index) => (
        <Text key={index} style={styles.helperText}>
          ⚠ {warning}
        </Text>
      ))}
    </>
  );

  const meals = (
    <>
      <View style={nested ? styles.dailyPlanSlot : styles.row}>
        <Text style={styles.rowTitle}>Breakfast</Text>
        {day.breakfast ? <DailyMealPlanPickRow pick={day.breakfast} /> : <Text style={styles.helperText}>No compliant option found.</Text>}
      </View>
      <View style={nested ? styles.dailyPlanSlot : styles.row}>
        <Text style={styles.rowTitle}>Lunch</Text>
        {day.lunch.length > 0 ? (
          day.lunch.map((pick) => <DailyMealPlanPickRow key={pick.entry.id} pick={pick} />)
        ) : (
          <Text style={styles.helperText}>No compliant option found.</Text>
        )}
      </View>
      <View style={nested ? styles.dailyPlanSlot : styles.row}>
        <Text style={styles.rowTitle}>Dinner</Text>
        {day.dinner.length > 0 ? (
          day.dinner.map((pick) => <DailyMealPlanPickRow key={pick.entry.id} pick={pick} />)
        ) : (
          <Text style={styles.helperText}>No compliant option found.</Text>
        )}
      </View>
    </>
  );

  const hasHydration = !!waterRow && waterRow.targetAmount != null;
  const hydrationBlock = waterRow && waterRow.targetAmount != null ? (
    <>
      <Text style={styles.helperText}>
        {Math.round(waterRow.amount)}ml of your {Math.round(waterRow.targetAmount)}ml daily target from this plan&apos;s food and drink
        {waterRow.percentOfTarget !== null ? ` (${waterRow.percentOfTarget}%)` : ''}.
      </Text>
      <Text style={styles.helperText}>
        {remainingMl > 0
          ? `Drink about ${remainingMl}ml more of plain water today to reach your target, the same combined food-and-drink target the Hydration lens tracks. "Add to Schedule" turns this into real, timed reminders through the day, not just a note.`
          : "This plan's food and drink alone already reaches your daily target."}
      </Text>
    </>
  ) : null;

  const coverage = (
    <>
      <Text style={styles.helperText}>
        Against your own age/sex-based RDA targets -- informational, not the rating above. Many whole foods, nuts, seeds, and legumes
        especially, naturally run well past 100% for a nutrient with a small RDA and a much larger real safety ceiling, so a high
        percentage here is not automatically a problem. A row is only flagged below when the amount is genuinely close to or over that
        real ceiling.
      </Text>
      {day.nutrientCoverage
        .filter((row) => row.nutrientCode !== 'water')
        .map((row, index) => {
          // A ceiling row (sodium): the operative number to show
          // against is the real limit itself, not a separate
          // floor -- targetAmount stays at this row's own default
          // population figure even when a personal, stricter
          // ceiling override is set in Profile, so upperLimit is
          // what actually reflects that override.
          const displayTarget = row.isCeiling ? (row.upperLimit ?? row.targetAmount) : row.targetAmount;
          const displayPercent = row.isCeiling ? row.percentOfUpperLimit ?? row.percentOfTarget : row.percentOfTarget;
          const nearOrOverLimit = !row.isCeiling && row.percentOfUpperLimit !== null && row.percentOfUpperLimit >= 80;
          const ceilingExceeded = row.isCeiling && displayPercent !== null && displayPercent >= 100;
          return (
            <View key={`${row.nutrientCode}-${index}`} style={styles.dailyPlanNutrientRow}>
              <Text style={[styles.helperText, styles.dailyPlanNutrientLabel]}>
                {row.displayName}
                {row.isCeiling ? ' (ceiling)' : ''}
              </Text>
              <View style={styles.dailyPlanNutrientValue}>
                <Text style={[styles.helperText, { textAlign: 'right' }, ceilingExceeded && { color: colors.danger }]}>
                  {Math.round(row.amount * 10) / 10}
                  {row.unit} of {displayTarget}
                  {row.unit}
                  {displayPercent !== null ? ` (${displayPercent}%)` : ''}
                </Text>
                {nearOrOverLimit ? (
                  <Text
                    style={[
                      styles.helperText,
                      { textAlign: 'right', color: row.percentOfUpperLimit! >= 100 ? colors.danger : colors.statusYellowStandalone },
                    ]}
                  >
                    {row.percentOfUpperLimit}% of the real {row.upperLimit}
                    {row.unit} safety ceiling
                  </Text>
                ) : null}
                {/* Every dish that contributed, on every row, 2026-09-14:
                    "If a nutrient is listed for a meal, everything must be
                    accounted for at all times." The amounts sum to the
                    figure above by construction (see computeContributors
                    in lib/dailyMealPlan.ts), so nothing is left unnamed. */}
                {row.topContributors.length > 0 ? (
                  <Text style={[styles.helperText, { textAlign: 'right' }]}>
                    From: {row.topContributors.map((c) => `${c.title} ${Math.round(c.amount * 10) / 10}${row.unit} (${c.percentOfDayTotal}%)`).join(', ')}
                  </Text>
                ) : row.amount > 0 ? (
                  <Text style={[styles.helperText, { textAlign: 'right', color: colors.danger }]}>
                    No dish in this day accounts for this amount.
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
    </>
  );

  if (nested) {
    return (
      <View style={styles.table}>
        <View style={[styles.row, { backgroundColor: ratingColors.bg, borderWidth: 1, borderColor: ratingColors.border }]}>{ratingBlock}</View>
        <View style={styles.row}>
          <Text style={styles.label}>Meals</Text>
          {meals}
        </View>
        {hasHydration ? (
          <View style={styles.row}>
            <Text style={styles.label}>Hydration</Text>
            {hydrationBlock}
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Nutrient coverage</Text>
          {coverage}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.bandBox, { backgroundColor: ratingColors.bg, borderColor: ratingColors.border }]}>{ratingBlock}</View>
      <ScheduleBand folds={folds} id={`${foldId}:meals`} title="Meals" icon="restaurant-outline" count={mealCount}>
        <View style={styles.table}>{meals}</View>
      </ScheduleBand>
      {hasHydration ? (
        <ScheduleBand folds={folds} id={`${foldId}:hydration`} title="Hydration" icon="water-outline">
          {hydrationBlock}
        </ScheduleBand>
      ) : null}
      <ScheduleBand
        folds={folds}
        id={`${foldId}:coverage`}
        title="Nutrient coverage"
        icon="analytics-outline"
        count={day.nutrientCoverage.filter((row) => row.nutrientCode !== 'water').length}
      >
        {coverage}
      </ScheduleBand>
    </>
  );
}
// 1 day up to the same real 6-week/42-day ceiling the existing Meal
// Plan lens already uses -- "however many weeks up to 6" is a real,
// user-facing choice, not always the full 42.
const DAYS_TO_GENERATE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 Day' },
  { value: 7, label: '1 Week' },
  { value: 14, label: '2 Weeks' },
  { value: 21, label: '3 Weeks' },
  { value: 28, label: '4 Weeks' },
  { value: 35, label: '5 Weeks' },
  { value: 42, label: '6 Weeks' },
];

function DailyMealPlanLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [carbLevel, setCarbLevel] = useState<CarbLevel>('any');
  // 2026-08-26, direct request: "less than a certain amount of sugar."
  // See lib/dailyMealPlan.ts's own comment on this same flag for why
  // it's a structural "no added sweetener" preference rather than a raw
  // gram cap -- this corpus has no way to separate a recipe's added
  // sugar from its own natural fruit sugar.
  const [limitAddedSugar, setLimitAddedSugar] = useState(false);
  const [daysToGenerate, setDaysToGenerate] = useState(1);
  const [conditionCodes, setConditionCodes] = useState<string[]>([]);
  const [dietPreferences, setDietPreferences] = useState<RecipeDietTag[]>([]);
  const [generating, setGenerating] = useState(false);
  // Who the plan on screen was actually built for. Held rather than recomputed,
  // so the screen describes the plan it is showing rather than the current state
  // of a partner link that may have changed since it was generated.
  const [planningScope, setPlanningScope] = useState<PlanningScope | null>(null);
  const [plans, setPlans] = useState<DailyMealPlanResult[]>([]);
  const [scheduleDate, setScheduleDate] = useState(todayDateString());
  const [scheduling, setScheduling] = useState(false);
  // 2026-08-26, direct request: "Each week per day needs to be available
  // for viewing so they can go through their whole week and swap things
  // out if they need to." Multi-day plans used to show only a condensed
  // row per day with no way to see the full report or change anything --
  // expandedDayIndex tracks which single day (if any) is currently shown
  // in full via the same DailyPlanFullReport the single-day case already
  // uses, and regeneratingDayIndex tracks which day a "Regenerate This
  // Day" tap is currently in flight for, so only that one day's own row
  // shows a busy state.
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null);
  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getUserConditions(), getDietPreferences()])
        .then(([codes, tags]) => {
          if (cancelled) return;
          setConditionCodes(codes);
          setDietPreferences(tags as RecipeDietTag[]);
        })
        .catch(() => {
          // Best-effort only -- a failure here just means generation runs
          // with no declared condition/diet narrowing, the same as
          // someone who genuinely hasn't set either on Profile yet.
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function handleGenerate() {
    setGenerating(true);
    try {
      // Resolved here rather than taken from this screen's own state, because a
      // partner's conditions have to reach the generator or the whole point of
      // linking two people is lost. resolvePlanningScope reads the partner
      // itself, so this cannot silently plan for one person.
      const scope = await resolvePlanningScope({
        myConditionCodes: conditionCodes,
        today: new Date().toISOString().slice(0, 10),
      });
      const results = await generateMealPlanDays({
        conditionCodes: scope.conditionCodes,
        dietPreferences,
        carbLevel,
        days: daysToGenerate,
        limitAddedSugar,
      });
      setPlanningScope(scope);
      setPlans(results);
    } catch (error) {
      showInfoAlert('Could not generate a plan', error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  }

  // "swap things out if they need to" -- regenerates just this one day in
  // isolation (the same single-day generator the "1 Day" option already
  // uses), replacing it in place rather than re-running the whole week.
  // Named honestly, not silently glossed over: a day regenerated this way
  // no longer shares the rest of the week's own rotation/frequency state
  // (fish twice a week, no repeated meal), so it can, in principle,
  // duplicate a dish already used elsewhere in the same week -- an
  // accepted, minor limitation of swapping one day on its own rather than
  // re-running the full multi-day generator.
  async function regenerateDay(index: number) {
    setRegeneratingDayIndex(index);
    try {
      // The same scope the whole plan was built for, so a swapped day is not
      // quietly checked against a narrower set of conditions than its neighbours.
      const scope = planningScope ?? await resolvePlanningScope({
        myConditionCodes: conditionCodes,
        today: new Date().toISOString().slice(0, 10),
      });
      const result = await generateDailyMealPlan({
        conditionCodes: scope.conditionCodes,
        dietPreferences,
        carbLevel,
        limitAddedSugar,
      });
      setPlans((current) => current.map((day, i) => (i === index ? result : day)));
    } catch (error) {
      showInfoAlert('Could not regenerate this day', error instanceof Error ? error.message : String(error));
    } finally {
      setRegeneratingDayIndex(null);
    }
  }

  async function handleAddToSchedule() {
    if (plans.length === 0) return;
    if (!isValidDateString(scheduleDate)) {
      showInfoAlert('Almost there', 'Enter a valid date (YYYY-MM-DD).');
      return;
    }
    const mealPlanDays = plans.map((result, index) => dailyMealPlanToMealPlanDay(result, index + 1)).filter((day): day is NonNullable<typeof day> => day !== null);
    if (mealPlanDays.length === 0) {
      showInfoAlert('Not a full day yet', "None of these generated days have a complete breakfast, lunch, and dinner, so there's nothing to schedule. Try regenerating.");
      return;
    }
    setScheduling(true);
    try {
      const result = await setUpMealPlan(scheduleDate, mealPlanDays);
      // 2026-08-26, direct report: "more hydration will have been
      // scheduled throughout each day than just one helping... This
      // should be tied to their full day as well." Each generated day's
      // own real water gap (the same figure the report itself already
      // shows as a sentence) becomes real, scheduled reminders spread
      // through that same day -- but only when the person hasn't already
      // set up their own real, standing hydration routine (Meal
      // Builder's "Add to My Hydration Routine," or a repeating drink
      // added directly on the Hydration lens). A real routine already
      // covers every day, generated fresh or not, by name, on purpose --
      // piling generic "Drink about Xml of water" reminders on top of it
      // would just clutter a day that's already handled.
      const hasOwnRoutine = await hasStandingHydrationRoutine();
      let hydrationReminders = 0;
      if (!hasOwnRoutine) {
        for (let index = 0; index < plans.length; index += 1) {
          const date = addDaysToLocalDate(scheduleDate, index);
          const remainingMl = getDailyMealPlanWaterGapMl(plans[index]);
          hydrationReminders += await scheduleHydrationRemindersForDay(date, remainingMl);
        }
      }
      const skippedIncomplete = plans.length - mealPlanDays.length;
      showInfoAlert(
        'Added',
        `${result.scheduled} meal${result.scheduled === 1 ? '' : 's'} added to your schedule starting ${scheduleDate}` +
          (hydrationReminders > 0 ? `, plus ${hydrationReminders} water reminder${hydrationReminders === 1 ? '' : 's'} to close the gap to your daily target` : '') +
          (hasOwnRoutine ? ". Your own standing hydration routine already covers water, so nothing extra was added for that." : '') +
          (result.skipped > 0 ? `, ${result.skipped} already had something planned and were left as-is` : '') +
          (skippedIncomplete > 0 ? `. ${skippedIncomplete} generated day${skippedIncomplete === 1 ? '' : 's'} were incomplete and skipped.` : '.'),
      );
    } catch (error) {
      showInfoAlert('Could not add to schedule', error instanceof Error ? error.message : String(error));
    } finally {
      setScheduling(false);
    }
  }

  const singleDay = plans.length === 1 ? plans[0] : null;

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      <View style={styles.formCard}>
        <Text style={styles.label}>How many days</Text>
        <Text style={styles.helperText}>
          More than 1 day gets real day-to-day variety and weekly frequency targets (fish, red meat) woven in, not independent random picks each day.
        </Text>
        <PopoverSelect
          selected={DAYS_TO_GENERATE_OPTIONS.find((option) => option.value === daysToGenerate)?.label ?? '1 Day'}
          options={DAYS_TO_GENERATE_OPTIONS.map((option) => option.label)}
          onSelect={(value) => setDaysToGenerate(DAYS_TO_GENERATE_OPTIONS.find((option) => option.label === value)?.value ?? 1)}
          placeholder="Days"
          tabColor={TAB_COLOR}
          width={220}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>Carb level</Text>
        <Text style={styles.helperText}>Applies to each day's own total, not any one meal alone.</Text>
        <PopoverSelect
          selected={CARB_LEVEL_OPTIONS.find((option) => option.value === carbLevel)?.label ?? 'Any'}
          options={CARB_LEVEL_OPTIONS.map((option) => option.label)}
          onSelect={(value) => setCarbLevel(CARB_LEVEL_OPTIONS.find((option) => option.label === value)?.value ?? 'any')}
          placeholder="Carb level"
          tabColor={TAB_COLOR}
          width={260}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>Added sugar</Text>
        <Text style={styles.helperText}>
          Prefer options with no added sweetener (honey, maple syrup, sugar) at every meal, not just breakfast. A recipe&apos;s natural fruit
          sugar is never counted against this.
        </Text>
        <TouchableOpacity
          style={[styles.pill, limitAddedSugar && styles.pillActive, { alignSelf: 'flex-start' }]}
          onPress={() => setLimitAddedSugar((current) => !current)}
        >
          <Text style={[styles.pillText, limitAddedSugar && styles.pillTextActive]}>{limitAddedSugar ? 'Limiting added sugar' : 'No limit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 12 }, generating && styles.primaryButtonDisabled]}
          activeOpacity={0.85}
          disabled={generating}
          onPress={handleGenerate}
        >
          <Text style={styles.primaryButtonText}>{generating ? 'Generating…' : plans.length > 0 ? 'Regenerate' : daysToGenerate === 1 ? 'Generate My Day' : 'Generate My Plan'}</Text>
        </TouchableOpacity>
        {/* Who this plan was built for, said plainly and never omitted. A plan
            that covers one person while a partner is linked has to say so: the
            whole reason someone sets up a partner is expecting both to be
            planned around, and silence there reads as success. */}
        {planningScope && plans.length > 0 ? (
          <View style={styles.planScopeBox}>
            <Text style={styles.planScopeText}>{describePlanningScope(planningScope)}</Text>
          </View>
        ) : null}
      </View>

      {singleDay ? (
        <DailyPlanFullReport day={singleDay} folds={folds} foldId="schedule:dailyPlan" />
      ) : plans.length > 1 ? (
        // Multi-day: one band per day, opening into the exact same full
        // report the single-day case uses -- "Each week per day needs to
        // be available for viewing so they can go through their whole
        // week and swap things out if they need to." One day open at a
        // time (expandedDayIndex), the rating dot standing in for the
        // band's icon so a folded day still says how it rated.
        plans.map((day, index) => {
          const isExpanded = expandedDayIndex === index;
          const isRegenerating = regeneratingDayIndex === index;
          return (
            <View key={index} style={styles.bandOut}>
              <HomeSectionBand
                kind="fold"
                title={`Day ${index + 1}`}
                icon="calendar-outline"
                renderIcon={() => <View style={[styles.dailyPlanHealthDot, { backgroundColor: healthRatingDotColor(day.healthRating) }]} />}
                color={TAB_COLOR}
                expanded={isExpanded}
                onToggle={() => setExpandedDayIndex(isExpanded ? null : index)}
              >
                <DailyPlanFullReport day={day} />
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 8 }, isRegenerating && styles.primaryButtonDisabled]}
                  activeOpacity={0.85}
                  disabled={isRegenerating}
                  onPress={() => regenerateDay(index)}
                >
                  <Text style={styles.primaryButtonText}>{isRegenerating ? "Regenerating..." : "Regenerate This Day"}</Text>
                </TouchableOpacity>
              </HomeSectionBand>
            </View>
          );
        })
      ) : null}
      {plans.length > 0 ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>Add to your schedule</Text>
          <Text style={styles.helperText}>{plans.length === 1 ? 'Starting on this date.' : `All ${plans.length} days, starting on this date.`}</Text>
          <AppTextInput style={styles.input} placeholder="YYYY-MM-DD" value={scheduleDate} onChangeText={setScheduleDate} />
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 12 }, scheduling && styles.primaryButtonDisabled]}
            activeOpacity={0.85}
            disabled={scheduling}
            onPress={handleAddToSchedule}
          >
            <Text style={styles.primaryButtonText}>{scheduling ? 'Adding…' : plans.length === 1 ? 'Add This Day to Schedule' : 'Add This Plan to Schedule'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

// The fixed 6-week plan (lib/mealPlan.ts and its vegan and vegetarian
// twins, 2026-08-24) lived here as its own lens until 2026-09-13, when the
// two generators became one, direct: "Merge the two meal generators too."
// The dynamic generator below does everything the fixed rotation did (up
// to 6 weeks, no repeats, a diet preference from Profile) and is aware of
// the conditions the fixed one was blind to, so the lens and the three
// data files are gone.

function roundForDisplay(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// Today's Meals -- 2026-08-29, direct request: "When I go to Meals Logged
// Today, it makes me think that there needs to be a Today's Meals, and
// when it opens, each meal will have the recipe available to follow so
// they can use them to cook the recipe."
//
// Deliberately its own lens rather than another mode bolted onto Meals or
// Past Meals, because it answers a question neither of those does. Meals
// plans what you intend to do, Past Meals corrects what actually
// happened, and both are about the record. This one is for standing in
// the kitchen with the phone propped up: what am I making today, and what
// are the steps.
//
// It shows the whole day, not just what has already been eaten, since you
// cook a meal before you log it -- a lens that only listed logged meals
// would be useless for the thing it was asked for.
function TodaysMealsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [meals, setMeals] = useState<TodaysMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErrorMessage('');
    listTodaysMealsWithRecipes(todayDateString())
      .then(setMeals)
      .catch((error) =>
        setErrorMessage(`Could not load today's meals: ${error instanceof Error ? error.message : String(error)}`),
      )
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {errorMessage ? <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : meals.length === 0 ? (
        <View style={styles.bandBox}>
        <Text style={styles.emptyText}>
          Nothing scheduled to eat today yet. Anything you schedule on the Meals lens, or generate from a meal plan,
          shows up here with its steps ready to cook from.
        </Text>
        </View>
      ) : (
        // 2026-09-13: one fold band per meal, the time leading its title so
        // the folded list still reads as the day in order. One open at a
        // time, as before, since this is read at the stove.
        meals.map((meal) => {
          const expanded = expandedId === meal.scheduleItemId;
          return (
            <View key={meal.scheduleItemId} style={styles.bandOut}>
              <HomeSectionBand
                kind="fold"
                title={`${formatTime12(meal.scheduledFor.slice(11, 16))} · ${meal.title}`}
                icon="restaurant-outline"
                color={TAB_COLOR}
                expanded={expanded}
                onToggle={() => setExpandedId(expanded ? null : meal.scheduleItemId)}
              >
                <View style={styles.todaysMealBody}>
                  <Text style={styles.rowMeta}>
                    {[
                      meal.mealType ? capitalizeFirst(meal.mealType) : null,
                      meal.status === 'logged' ? 'Eaten' : meal.status === 'skipped' ? 'Skipped' : 'Planned',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {!meal.hasComponents ? (
                    // A meal typed in by hand has no recipe behind it to
                    // open. Saying so plainly beats an empty panel that
                    // reads as broken.
                    <Text style={styles.emptyText}>
                      This one was entered directly rather than built from saved dishes, so there is nothing to cook
                      from here. Building it in the Food tab is what gives a meal its ingredients and steps.
                    </Text>
                  ) : (
                    <>
                      {!meal.anyInstructions ? (
                        <Text style={styles.emptyText}>
                          The ingredients are below, but no steps were written for these dishes. You can add them by
                          editing the dish in its own builder.
                        </Text>
                      ) : null}
                      {meal.components.map((component, index) => (
                        <View key={`${component.componentType}-${index}`} style={styles.todaysMealComponent}>
                          <Text style={styles.todaysMealComponentName}>{component.name}</Text>
                          {component.yourSharePercent !== 100 ? (
                            <Text style={styles.rowMeta}>{`Your share: ${component.yourSharePercent}% of the batch`}</Text>
                          ) : null}

                          <Text style={styles.todaysMealSectionLabel}>Ingredients</Text>
                          {component.ingredients.length === 0 ? (
                            <Text style={styles.rowMeta}>No ingredients recorded.</Text>
                          ) : (
                            component.ingredients.map((ingredient, ingredientIndex) => (
                              <Text key={`${ingredient.foodName}-${ingredientIndex}`} style={styles.rowMeta}>
                                {`${ingredient.foodName}: ${roundForDisplay(ingredient.quantity)} ${ingredient.unit}`}
                                {ingredient.notes ? ` (${ingredient.notes})` : ''}
                              </Text>
                            ))
                          )}

                          {component.instructions.length > 0 ? (
                            <>
                              <Text style={styles.todaysMealSectionLabel}>Steps</Text>
                              {component.instructions.map((step, stepIndex) => (
                                <Text key={stepIndex} style={styles.todaysMealStep}>
                                  {`${stepIndex + 1}. ${step}`}
                                </Text>
                              ))}
                            </>
                          ) : null}
                        </View>
                      ))}
                    </>
                  )}
                  {meal.notes ? <Text style={styles.rowMeta}>{`Note: ${meal.notes}`}</Text> : null}
                </View>
              </HomeSectionBand>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function capitalizeFirst(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

// The Hydration lens -- deliberately not a separate tracking system from
// Meals. A scheduled/logged "Beverage" meal (see index.tsx's mealTypes) IS
// a hydration entry; this lens is just a filtered, water-focused view over
// that same schedule_items/meals data, merged with whatever's been logged
// directly, so nothing needs entering twice. No eating-window enforcement
// here unlike Meals -- water/tea/coffee are commonly fine during a fast,
// and assuming otherwise would be actively wrong for a lot of people's
// real intermittent-fasting practice.
function HydrationLens() {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [items, setItems] = useState<ScheduleItemRecord[]>([]);
  const [loggedBeverages, setLoggedBeverages] = useState<MealRecord[]>([]);
  const [waterEntry, setWaterEntry] = useState<NutrientGapEntry | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [templates, setTemplates] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ ...BLANK_FORM, mealType: 'beverage' });
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const date = todayDateString();
    ensureScheduleSeriesGenerated()
      .then(() =>
        Promise.all([
          listScheduledMealsForDate(date),
          listMealsForDate(date),
          listFavorites(100, 'meal'),
          listMeals(100),
          getDailyNutrientAnalysis(date),
        ]),
      )
      .then(([scheduled, loggedToday, loadedFavorites, loadedTemplates, analysis]) => {
        setItems(scheduled.filter((item) => item.mealType === 'beverage'));
        setLoggedBeverages(loggedToday.filter((meal) => meal.meal_type === 'beverage'));
        setFavorites(loadedFavorites);
        setTemplates(loadedTemplates);
        setWaterEntry(analysis.entries.find((entry) => entry.nutrientCode === 'water') ?? null);
      })
      .catch((error) => {
        setErrorMessage(`Could not load today's hydration: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openAddForm() {
    // 2026-08-26, direct follow-up: "probably could be on a repeating
    // daily schedule." A hydration entry is, by its own nature, almost
    // always something meant to happen every day, not a one-off the way
    // a specific dinner is -- defaulting a FRESH add here to Daily/
    // Indefinite (still fully changeable in the RepeatPicker below) makes
    // building a real standing routine the path of least resistance
    // instead of something someone has to think to opt into. Editing an
    // existing occurrence is untouched (openEditForm below still forces
    // 'none', matching this lens' own established today-only edit rule).
    setForm({ ...BLANK_FORM, mealType: 'beverage', repeat: { type: 'daily', endType: 'indefinite' } });
    setShowForm(true);
  }

  function openEditForm(item: ScheduleItemRecord) {
    setForm({
      editingId: item.id,
      mealType: 'beverage',
      mode: 'unplanned',
      title: item.title,
      sourceFavoriteId: item.sourceFavoriteId,
      sourceMealId: item.sourceMealId,
      time: splitTime24(item.scheduledFor.split('T')[1] ?? null),
      repeat: { type: 'none' },
      // Hydration stays today-only by design (see this lens' own header
      // comment) -- unlike Meals, its own handleSaveForm still always
      // rebuilds scheduledFor against todayDateString() directly, so this
      // field is only ever here to satisfy FormState's own shape, never
      // actually read.
      date: todayDateString(),
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({ ...BLANK_FORM, mealType: 'beverage' });
  }

  function handlePickSource(match: SourceMatch) {
    setForm((current) => ({
      ...current,
      title: match.title,
      sourceFavoriteId: match.favoriteId ?? null,
      sourceMealId: match.mealId ?? null,
    }));
  }

  async function handleSaveForm() {
    if (!form.title.trim()) {
      showInfoAlert('Almost there', form.mode === 'source' ? 'Pick a template or favorite first.' : 'Enter what you plan to drink.');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(form.time.hour, form.time.minute, form.time.ampm));
      return;
    }
    const repeatError = form.editingId ? null : validateRepeat(form.repeat);
    if (repeatError) {
      showInfoAlert('Almost there', repeatError);
      return;
    }

    const scheduledFor = `${todayDateString()}T${time24}`;

    try {
      if (form.editingId) {
        await updateScheduledMeal(form.editingId, { title: form.title, mealType: 'beverage', scheduledFor });
      } else {
        await scheduleMeal({
          title: form.title,
          mealType: 'beverage',
          scheduledFor,
          sourceFavoriteId: form.sourceFavoriteId ?? undefined,
          sourceMealId: form.sourceMealId ?? undefined,
          repeat: form.repeat,
        });
      }
      closeForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(item: ScheduleItemRecord) {
    if (item.repeatGroupId) {
      setRemovePrompt({
        title: 'Remove this planned drink?',
        message: `"${item.title}" repeats. Remove just this occurrence, or this and every future one?`,
        actions: [
          {
            label: 'Just this one',
            onPress: () => {
              void (async () => {
                await deleteScheduledMeal(item.id);
                load();
              })();
            },
          },
          {
            label: 'This and future',
            destructive: true,
            onPress: () => {
              void (async () => {
                await deleteScheduleSeries(item.repeatGroupId!);
                load();
              })();
            },
          },
          { label: 'Cancel', onPress: () => {} },
        ],
      });
      return;
    }
    setRemovePrompt({
      title: 'Remove this planned drink?',
      message: `"${item.title}" will no longer show on your schedule.`,
      actions: [
        {
          label: 'Remove',
          destructive: true,
          onPress: () => {
            void (async () => {
              await deleteScheduledMeal(item.id);
              load();
            })();
          },
        },
        { label: 'Cancel', onPress: () => {} },
      ],
    });
  }

  async function handleToggleSkipped(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    load();
  }

  function handleLogNow(item: ScheduleItemRecord) {
    router.push({
      pathname: '/food',
      params: {
        scheduleItemId: item.id,
        mealType: 'beverage',
        title: item.title,
        favoriteId: item.sourceFavoriteId ?? '',
        templateMealId: item.sourceMealId ?? '',
      },
    });
  }

  const sourceMatches = [...matchingFavorites(favorites, 'beverage'), ...matchingTemplates(templates, 'beverage')];

  // Beverages already turned into a real logged meal (status 'logged')
  // carry their linkedMealId -- excluded here so a beverage that was both
  // scheduled AND logged shows up once, not twice.
  const linkedMealIds = new Set(items.map((item) => item.linkedMealId).filter((id): id is string => id != null));

  const rows: HydrationRow[] = [
    ...items.map((item): HydrationRow => ({
      key: `sched_${item.id}`,
      time: item.scheduledFor.slice(11, 16),
      title: item.title,
      kind: 'scheduled',
      item,
    })),
    ...loggedBeverages
      .filter((meal) => !linkedMealIds.has(meal.id))
      .map((meal): HydrationRow => ({
        key: `meal_${meal.id}`,
        time: meal.eaten_at.slice(11, 16),
        title: meal.name,
        kind: 'logged-direct',
      })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      <AppActionSheet
        visible={removePrompt !== null}
        onClose={() => setRemovePrompt(null)}
        title={removePrompt?.title}
        message={removePrompt?.message}
        actions={removePrompt?.actions ?? []}
      />
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : errorMessage ? (
        <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
      ) : (
        <>
          {waterEntry ? (
            <View style={styles.hydrationSummaryCard}>
              <Text style={styles.hydrationSummaryLabel}>Today's water</Text>
              <Text style={styles.hydrationSummaryValue}>
                {Math.round(waterEntry.combinedTotal)} / {Math.round(waterEntry.target)} ml
              </Text>
              <Text style={styles.hydrationSummaryMeta}>{Math.round(waterEntry.percentOfTarget)}% of today's target</Text>
            </View>
          ) : null}

          {!showForm ? (
            <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
              <Text style={styles.addButtonText}>+ Schedule a drink</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              {!form.editingId ? (
                <>
                  <View style={styles.modeRow}>
                    <TouchableOpacity
                      style={[styles.modeTab, form.mode === 'source' && styles.modeTabActive]}
                      onPress={() => setForm((current) => ({ ...current, mode: 'source' }))}
                    >
                      <Text style={[styles.modeTabText, form.mode === 'source' && styles.modeTabTextActive]}>
                        From templates & favorites
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeTab, form.mode === 'unplanned' && styles.modeTabActive]}
                      onPress={() => setForm((current) => ({ ...current, mode: 'unplanned', sourceFavoriteId: null, sourceMealId: null }))}
                    >
                      <Text style={[styles.modeTabText, form.mode === 'unplanned' && styles.modeTabTextActive]}>
                        Something unplanned
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {form.mode === 'source' ? (
                    sourceMatches.length === 0 ? (
                      <Text style={styles.helperText}>
                        No Beverage templates or favorites yet. Save a beverage as a favorite on the Food tab, or
                        switch to "Something unplanned" below.
                      </Text>
                    ) : (
                      <View style={styles.sourceList}>
                        {sourceMatches.map((match) => {
                          const selected =
                            (match.favoriteId != null && match.favoriteId === form.sourceFavoriteId) ||
                            (match.mealId != null && match.mealId === form.sourceMealId);
                          return (
                            <TouchableOpacity
                              key={match.key}
                              style={[styles.sourceRow, selected && styles.sourceRowSelected]}
                              onPress={() => handlePickSource(match)}
                            >
                              <Text style={[styles.sourceRowText, selected && styles.sourceRowTextSelected]}>
                                {match.title}
                              </Text>
                              <Text style={styles.sourceRowKind}>{match.favoriteId ? 'Favorite' : 'Template'}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )
                  ) : (
                    <>
                      <Text style={styles.helperText}>
                        Water, tea, coffee, a smoothie: whatever you plan to drink, plus anything mixed into it.
                      </Text>
                      <View style={styles.labelRow}>
                        <AppTextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="e.g. Green tea with honey"
                          value={form.title}
                          onChangeText={(text) => setForm((current) => ({ ...current, title: text, sourceFavoriteId: null, sourceMealId: null }))}
                        />
                        <VoiceInputButton
                          onResult={(text) => setForm((current) => ({ ...current, title: text, sourceFavoriteId: null, sourceMealId: null }))}
                          color={TAB_COLOR}
                        />
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>What do you plan to drink?</Text>
                    <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, title: text }))} color={TAB_COLOR} />
                  </View>
                  <AppTextInput
                    style={styles.input}
                    value={form.title}
                    onChangeText={(text) => setForm((current) => ({ ...current, title: text }))}
                  />
                </>
              )}

              <Text style={styles.label}>About what time?</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="8"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.hour}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="00"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.minute}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, minute: text } }))}
                />
                <View style={styles.pillRow}>
                  {(['AM', 'PM'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pillSmall, form.time.ampm === option && styles.pillActive]}
                      onPress={() => setForm((current) => ({ ...current, time: { ...current.time, ampm: option } }))}
                    >
                      <Text style={[styles.pillTextSmall, form.time.ampm === option && styles.pillTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {!form.editingId ? (
                <RepeatPicker repeat={form.repeat} onChange={(repeat) => setForm((current) => ({ ...current, repeat }))} />
              ) : null}

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveForm}>
                  <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Add to schedule'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScheduleBand folds={folds} id="schedule:hydration:today" title="Today's drinks" icon="water-outline" count={rows.length}>
          {rows.length === 0 ? (
            <Text style={[styles.emptyText, styles.panelStandalone]}>
              Nothing logged or scheduled yet today. This includes any "Beverage" meals logged directly from Meals too.
            </Text>
          ) : (
            <View style={styles.table}>
              {rows.map((row) => (
                <HydrationRowView
                  key={row.key}
                  row={row}
                  onLogNow={handleLogNow}
                  onToggleSkipped={handleToggleSkipped}
                  onEdit={openEditForm}
                  onRemove={handleRemove}
                />
              ))}
            </View>
          )}
          </ScheduleBand>
        </>
      )}
    </ScrollView>
  );
}

// --- Meds ----------------------------------------------------------------
//
// One dose timeline for everything a person takes, 2026-09-13. Direct:
// "Schedules needs to be about the actual schedules for each category or
// topic. My Meds each need a schedule so there should be a route to do
// that. Both prescriptions and supplements should be considered within
// meds." Before this, Supplements and Prescriptions were two lenses here,
// each carrying its own copy of the form that DEFINES a treatment as well
// as its dose times, and My Meds (a third copy of the definition, with no
// times at all) sat beside them. Now the definition lives in one place,
// Life > My Meds (components/MyMedsSection.tsx), and this lens is only the
// timeline: every active med, its dose times, today's doses to tick off,
// and the interaction checks that depend on those times.
//
// The route in from Life is a Schedule it button on each med there, which
// arrives here as `scheduleTreatmentId` and opens that med's reminder form
// with its group unfolded. The route back is "Add a med" at the top and
// "Edit in My Meds" on each row, both landing on Life with the lens open.
// An OTC drug can be scheduled here like the other two; it never could
// before, and My Meds's own help text used to say so.
type MedsGroup = { title: string; treatmentType: string; icon: ComponentProps<typeof Ionicons>['name'] };

const MEDS_GROUPS: MedsGroup[] = [
  { title: 'Prescriptions', treatmentType: 'prescription', icon: 'medkit-outline' },
  { title: 'OTC drugs', treatmentType: 'otc', icon: 'bandage-outline' },
  { title: 'Supplements', treatmentType: 'supplement', icon: 'leaf-outline' },
];

function MedsLens({ scheduleTreatmentId }: { scheduleTreatmentId?: string }) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [dosesByTreatment, setDosesByTreatment] = useState<Record<string, ScheduleItemRecord[]>>({});
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [referenceOnlyRules, setReferenceOnlyRules] = useState<ReferenceOnlyRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [doseFormTreatmentId, setDoseFormTreatmentId] = useState<string | null>(null);
  const [doseFormTime, setDoseFormTime] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [doseFormRepeat, setDoseFormRepeat] = useState<RepeatConfig>({ type: 'none' });
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);
  // The handoff from Life is consumed once: the param outlives the arrival
  // (the same lesson lib/mealBuilderHandoff.ts records), so without this a
  // later focus with the stale param would reopen the form.
  const consumedHandoff = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const today = todayDateString();
    ensureScheduleSeriesGenerated()
      .then(() => Promise.all([listAllActiveTreatments(), listScheduledMedDosesFrom(today), evaluateInteractionRules(today)]))
      .then(([loadedTreatments, doses, evaluation]) => {
        setTreatments(loadedTreatments);
        const byTreatment: Record<string, ScheduleItemRecord[]> = {};
        for (const dose of doses) {
          if (!dose.linkedTreatmentId) continue;
          (byTreatment[dose.linkedTreatmentId] ??= []).push(dose);
        }
        setDosesByTreatment(byTreatment);
        setInteractionWarnings(evaluation.warnings);
        setReferenceOnlyRules(evaluation.referenceOnly);
        if (scheduleTreatmentId && consumedHandoff.current !== scheduleTreatmentId) {
          const target = loadedTreatments.find((treatment) => treatment.id === scheduleTreatmentId);
          if (target) {
            consumedHandoff.current = scheduleTreatmentId;
            const group = MEDS_GROUPS.find((entry) => entry.treatmentType === target.treatmentType);
            if (group && !folds.isOpen(`schedule:meds:${group.title}`)) folds.toggle(`schedule:meds:${group.title}`);
            setDoseFormTreatmentId(target.id);
            setDoseFormTime({ hour: '', minute: '', ampm: '' });
            setDoseFormRepeat({ type: 'daily', endType: 'indefinite' });
          }
        }
      })
      .catch((error) => {
        setErrorMessage(`Could not load your meds: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
    // folds is stable per mount; re-running on it would refetch on every fold.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleTreatmentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openMyMeds(treatment?: TreatmentRecord) {
    router.push({
      pathname: '/life',
      params: treatment ? { openLifeLens: 'myMeds', focusTreatmentId: treatment.id } : { openLifeLens: 'myMeds' },
    });
  }

  function openDoseForm(treatmentId: string) {
    setDoseFormTreatmentId(treatmentId);
    setDoseFormTime({ hour: '', minute: '', ampm: '' });
    // A dose reminder is, almost always, every day; the picker can change it.
    setDoseFormRepeat({ type: 'daily', endType: 'indefinite' });
  }

  function closeDoseForm() {
    setDoseFormTreatmentId(null);
  }

  async function handleSaveDose(treatment: TreatmentRecord) {
    const time24 = buildTime24(doseFormTime.hour, doseFormTime.minute, doseFormTime.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(doseFormTime.hour, doseFormTime.minute, doseFormTime.ampm));
      return;
    }
    const repeatError = validateRepeat(doseFormRepeat);
    if (repeatError) {
      showInfoAlert('Almost there', repeatError);
      return;
    }
    try {
      await scheduleTreatmentDose({ treatment, scheduledFor: `${todayDateString()}T${time24}`, repeat: doseFormRepeat });
      closeDoseForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleMarkDoseTaken(item: ScheduleItemRecord) {
    await markScheduledDoseTaken(item.id);
    load();
  }

  async function handleToggleDoseSkipped(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    load();
  }

  function handleRemoveDose(item: ScheduleItemRecord) {
    if (item.repeatGroupId) {
      setRemovePrompt({
        title: 'Remove this reminder?',
        message: `This time repeats. Remove just today's, or this and every future one?`,
        actions: [
          {
            label: 'Just this one',
            onPress: () => {
              void (async () => {
                await deleteScheduledMeal(item.id);
                load();
              })();
            },
          },
          {
            label: 'This and future',
            destructive: true,
            onPress: () => {
              void (async () => {
                await deleteScheduleSeries(item.repeatGroupId!);
                load();
              })();
            },
          },
          { label: 'Cancel', onPress: () => {} },
        ],
      });
      return;
    }
    setRemovePrompt({
      title: 'Remove this reminder?',
      actions: [
        {
          label: 'Remove',
          destructive: true,
          onPress: () => {
            void (async () => {
              await deleteScheduledMeal(item.id);
              load();
            })();
          },
        },
        { label: 'Cancel', onPress: () => {} },
      ],
    });
  }

  const today = todayDateString();
  const treatmentById = useMemo(() => new Map(treatments.map((treatment) => [treatment.id, treatment])), [treatments]);
  const todaysDoses = useMemo(
    () =>
      Object.values(dosesByTreatment)
        .flat()
        .filter((dose) => dose.scheduledFor.slice(0, 10) === today)
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [dosesByTreatment, today],
  );

  function describeDose(treatment: TreatmentRecord): string {
    if (treatment.treatmentType === 'supplement') {
      return `${treatment.unitsPerDay} ${treatment.servingUnitLabel}${Number(treatment.unitsPerDay) === 1 ? '' : 's'}/day`;
    }
    return (
      [treatment.doseAmount ? `${treatment.doseAmount}${treatment.doseUnit ?? ''}` : null, treatment.frequency].filter(Boolean).join(', ') ||
      'No dose details entered'
    );
  }

  function renderDoseActions(dose: ScheduleItemRecord) {
    return (
      <View style={styles.doseRowActions}>
        {dose.status === 'planned' ? (
          <>
            <TouchableOpacity onPress={() => handleMarkDoseTaken(dose)}>
              <Text style={styles.actionTextPrimary}>Taken</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleToggleDoseSkipped(dose)}>
              <Text style={styles.actionText}>Skip</Text>
            </TouchableOpacity>
          </>
        ) : dose.status === 'skipped' ? (
          <TouchableOpacity onPress={() => handleToggleDoseSkipped(dose)}>
            <Text style={styles.actionText}>Un-skip</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => handleRemoveDose(dose)}>
          <Text style={styles.actionTextRemove}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderDoseForm(treatment: TreatmentRecord) {
    return (
      <View style={styles.doseForm}>
        <View style={styles.timeRow}>
          <AppTextInput
            style={[styles.input, styles.timeInput]}
            placeholder="8"
            keyboardType="number-pad"
            maxLength={2}
            value={doseFormTime.hour}
            onChangeText={(text) => setDoseFormTime((current) => ({ ...current, hour: text }))}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <AppTextInput
            style={[styles.input, styles.timeInput]}
            placeholder="00"
            keyboardType="number-pad"
            maxLength={2}
            value={doseFormTime.minute}
            onChangeText={(text) => setDoseFormTime((current) => ({ ...current, minute: text }))}
          />
          <View style={styles.pillRow}>
            {(['AM', 'PM'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.pillSmall, doseFormTime.ampm === option && styles.pillActive]}
                onPress={() => setDoseFormTime((current) => ({ ...current, ampm: option }))}
              >
                <Text style={[styles.pillTextSmall, doseFormTime.ampm === option && styles.pillTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <RepeatPicker repeat={doseFormRepeat} onChange={setDoseFormRepeat} />
        <View style={styles.formActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={closeDoseForm}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleSaveDose(treatment)}>
            <Text style={styles.primaryButtonText}>Add reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderGroup(group: MedsGroup) {
    const groupTreatments = treatments.filter((treatment) => treatment.treatmentType === group.treatmentType);
    if (groupTreatments.length === 0) return null;
    return (
      <ScheduleBand key={group.title} folds={folds} id={`schedule:meds:${group.title}`} title={group.title} icon={group.icon} count={groupTreatments.length}>
        <View style={styles.table}>
          {groupTreatments.map((treatment) => {
            const doses = dosesByTreatment[treatment.id] ?? [];
            const doseToday = doses.filter((dose) => dose.scheduledFor.slice(0, 10) === today);
            const nextLater = doses.find((dose) => dose.scheduledFor.slice(0, 10) > today);
            return (
              <View key={treatment.id} style={styles.row}>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>{treatment.name}</Text>
                  <Text style={styles.rowMeta}>{describeDose(treatment)}</Text>
                </View>
                <View style={styles.supplementRowActions}>
                  <TouchableOpacity onPress={() => openMyMeds(treatment)}>
                    <Text style={styles.actionText}>Edit in My Meds</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.doseSection}>
                  <Text style={styles.doseSectionLabel}>Reminder times today</Text>
                  {doseToday.length === 0 ? (
                    <Text style={styles.helperText}>
                      {nextLater
                        ? `Nothing today. Next: ${nextLater.scheduledFor.slice(0, 10)} at ${formatTime12(nextLater.scheduledFor.split('T')[1] ?? '')}.`
                        : 'No reminder times set. It still counts toward totals while tracking is on in My Meds.'}
                    </Text>
                  ) : (
                    doseToday.map((dose) => (
                      <View key={dose.id} style={styles.doseRow}>
                        <Text style={styles.doseRowTime}>{formatTime12(dose.scheduledFor.split('T')[1] ?? '')}</Text>
                        <Text style={styles.doseRowStatus}>
                          {capitalize(dose.status)}
                          {dose.repeatGroupId ? ' · Repeats' : ''}
                        </Text>
                        {renderDoseActions(dose)}
                      </View>
                    ))
                  )}
                  {doseFormTreatmentId === treatment.id ? (
                    renderDoseForm(treatment)
                  ) : (
                    <TouchableOpacity onPress={() => openDoseForm(treatment.id)}>
                      <Text style={styles.actionTextPrimary}>+ Add a reminder time</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScheduleBand>
    );
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      <AppActionSheet
        visible={removePrompt !== null}
        onClose={() => setRemovePrompt(null)}
        title={removePrompt?.title}
        message={removePrompt?.message}
        actions={removePrompt?.actions ?? []}
      />
      <View style={styles.bandOut}>
        <HomeSectionBand
          kind="action"
          title="Add or change a med in My Meds"
          caption="A med is defined on the Life tab. Tap Schedule it there to bring it here."
          icon="flask-outline"
          color={TAB_COLOR}
          onPress={() => openMyMeds()}
        />
      </View>
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : errorMessage ? (
        <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
      ) : (
        <>
          <ScheduleBand folds={folds} id="schedule:meds:today" title="Today" icon="time-outline" count={todaysDoses.length}>
            {todaysDoses.length === 0 ? (
              <Text style={[styles.helperText, styles.panelStandalone]}>
                No doses on the schedule today. Add a reminder time under a med below.
              </Text>
            ) : (
              <View style={styles.table}>
                {todaysDoses.map((dose) => (
                  <View key={dose.id} style={styles.row}>
                    <View style={styles.doseRow}>
                      <Text style={styles.doseRowTime}>{formatTime12(dose.scheduledFor.split('T')[1] ?? '')}</Text>
                      <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>{treatmentById.get(dose.linkedTreatmentId ?? '')?.name ?? dose.title}</Text>
                        <Text style={styles.rowMeta}>
                          {capitalize(dose.status)}
                          {dose.repeatGroupId ? ' · Repeats' : ''}
                        </Text>
                      </View>
                    </View>
                    {renderDoseActions(dose)}
                  </View>
                ))}
              </View>
            )}
          </ScheduleBand>

          {interactionWarnings.length > 0 ? (
            <ScheduleBand folds={folds} id="schedule:meds:things-to-check" title="Things to check" icon="alert-circle-outline" count={interactionWarnings.length}>
              <View style={styles.table}>
                {interactionWarnings.map((warning, index) => (
                  <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                    <Text style={styles.interactionTitle}>{warning.title}</Text>
                    <Text style={styles.interactionMessage}>{warning.message}</Text>
                    <Text style={styles.interactionCitation}>{warning.citation}</Text>
                    <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                  </View>
                ))}
              </View>
            </ScheduleBand>
          ) : null}

          {referenceOnlyRules.length > 0 ? (
            <ScheduleBand
              folds={folds}
              id="schedule:meds:worth-knowing"
              title="Worth knowing (reference only, not personalized)"
              icon="information-circle-outline"
              count={referenceOnlyRules.length}
            >
              <View style={styles.table}>
                {referenceOnlyRules.map((rule) => (
                  <View key={rule.ruleId} style={[styles.interactionCard, styles.interactionCardReference]}>
                    <Text style={styles.interactionTitle}>{rule.title}</Text>
                    <Text style={styles.interactionMessage}>{rule.guidance}</Text>
                    <Text style={styles.interactionCitation}>{rule.citation}</Text>
                    <WhyExplainer title={rule.title} mechanism={rule.mechanism} onPress={showInfoAlert} />
                  </View>
                ))}
              </View>
            </ScheduleBand>
          ) : null}

          {treatments.length === 0 ? (
            <View style={styles.bandBox}>
              <Text style={styles.emptyText}>
                Nothing to schedule yet. Add a prescription, OTC drug or supplement in Life &gt; My Meds, then tap Schedule it there.
              </Text>
            </View>
          ) : (
            MEDS_GROUPS.map(renderGroup)
          )}
        </>
      )}
    </ScrollView>
  );
}

const APPOINTMENT_TYPES: { value: string; label: string }[] = [
  { value: 'doctor', label: 'Doctor visit' },
  { value: 'lab_draw', label: 'Lab / bloodwork' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'other', label: 'Other' },
];

function appointmentTypeLabel(value: string | null): string {
  return APPOINTMENT_TYPES.find((option) => option.value === value)?.label ?? 'Appointment';
}

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Named generically -- 2026-08-18 -- since MealsLens' own week strip now
// reuses this too (formatWeekRangeLabel, defined up near that lens), not
// just Appointments.
function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function addDaysToDateStringLocal(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}


// A device calendar event's startDate is a UTC ISO string (see
// lib/deviceCalendar.ts) -- parsed back into local Y-M-D/H:M here rather
// than naively slicing the ISO string, so an event near midnight shows on
// the correct local day.
function localDatePartsFromIso(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    dateStr: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    timeStr: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

// Real, shared permission-request-plus-explain flow, 2026-08-18 -- both
// AppointmentsLens and MealsLens need the identical thing (check whether
// calendar access is already granted; if not, ask, and if that's denied,
// explain in the same real wording either way) now that Meals also syncs
// to the phone calendar, so this is pulled out once rather than kept as
// two independently-maintained copies whose wording could quietly drift.
async function ensureDeviceCalendarPermission(
  currentlyGranted: boolean | null,
  setGranted: (granted: boolean) => void,
  showInfoAlert: (title: string, message: string) => void,
  noun: string,
): Promise<boolean> {
  if (currentlyGranted) {
    return true;
  }
  const granted = await requestCalendarPermission();
  setGranted(granted);
  if (!granted) {
    showInfoAlert(
      'Calendar access needed',
      `Turn on calendar access for Inside Story in your phone's Settings to sync ${noun} with your phone calendar.`,
    );
  }
  return granted;
}

type AppointmentFormState = {
  editingId: string | null;
  title: string;
  appointmentType: string;
  date: string;
  time: TimeOfDayInput;
  location: string;
  providerName: string;
  notes: string;
  importingDeviceEventId: string | null;
};

function blankAppointmentForm(): AppointmentFormState {
  return {
    editingId: null,
    title: '',
    appointmentType: 'doctor',
    date: todayDateString(),
    time: { hour: '', minute: '', ampm: '' },
    location: '',
    providerName: '',
    notes: '',
    importingDeviceEventId: null,
  };
}

const APPOINTMENTS_WINDOW_PAST_DAYS = 30;
const APPOINTMENTS_WINDOW_FUTURE_DAYS = 180;
const DEVICE_IMPORT_WINDOW_DAYS = 90;

// The Appointments lens -- doctor/lab/nutritionist/trainer visits, plus an
// optional connection to whatever's already in the phone's own Calendar
// app (see lib/deviceCalendar.ts). Deliberately no recurrence here (see
// scheduleAppointment's own note) -- most appointments get booked one at a
// time by a provider's office anyway.
function AppointmentsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [appointments, setAppointments] = useState<ScheduleItemRecord[]>([]);
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AppointmentFormState>(blankAppointmentForm());
  const [calendarPermissionGranted, setCalendarPermissionGranted] = useState<boolean | null>(null);
  const [showImportPicker, setShowImportPicker] = useState(false);
  const [deviceEvents, setDeviceEvents] = useState<DeviceCalendarEvent[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const today = todayDateString();
    Promise.all([
      listUpcomingAppointments(
        addDaysToDateStringLocal(today, -APPOINTMENTS_WINDOW_PAST_DAYS),
        addDaysToDateStringLocal(today, APPOINTMENTS_WINDOW_FUTURE_DAYS),
      ),
      evaluateInteractionRules(today),
      hasCalendarPermission(),
    ])
      .then(([loadedAppointments, evaluation, granted]) => {
        setAppointments(loadedAppointments);
        setInteractionWarnings(evaluation.warnings);
        setCalendarPermissionGranted(granted);
      })
      .catch((error) => {
        setErrorMessage(`Could not load appointments: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openAddForm() {
    setForm(blankAppointmentForm());
    setShowForm(true);
    setShowImportPicker(false);
  }

  function openEditForm(item: ScheduleItemRecord) {
    setForm({
      editingId: item.id,
      title: item.title,
      appointmentType: item.appointmentType ?? 'doctor',
      date: item.scheduledFor.slice(0, 10),
      time: splitTime24(item.scheduledFor.split('T')[1] ?? null),
      location: item.location ?? '',
      providerName: item.providerName ?? '',
      notes: item.notes ?? '',
      importingDeviceEventId: null,
    });
    setShowForm(true);
    setShowImportPicker(false);
  }

  function closeForm() {
    setShowForm(false);
    setForm(blankAppointmentForm());
  }

  async function handleSaveForm() {
    if (!form.title.trim()) {
      showInfoAlert('Almost there', 'Enter what this appointment is for.');
      return;
    }
    if (!isValidDateString(form.date)) {
      showInfoAlert('Almost there', 'Enter a valid date (YYYY-MM-DD).');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(form.time.hour, form.time.minute, form.time.ampm));
      return;
    }

    const scheduledFor = `${form.date}T${time24}`;

    try {
      if (form.editingId) {
        await updateAppointment(form.editingId, {
          title: form.title,
          scheduledFor,
          appointmentType: form.appointmentType,
          location: form.location,
          providerName: form.providerName,
          notes: form.notes,
        });
      } else {
        await scheduleAppointment({
          title: form.title,
          scheduledFor,
          appointmentType: form.appointmentType,
          location: form.location || undefined,
          providerName: form.providerName || undefined,
          notes: form.notes || undefined,
          linkedDeviceCalendarEventId: form.importingDeviceEventId ?? undefined,
        });
      }
      closeForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(item: ScheduleItemRecord) {
    const removeIt = (alsoRemoveFromCalendar: boolean) => {
      void (async () => {
        if (alsoRemoveFromCalendar && item.linkedDeviceCalendarEventId) {
          await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
        }
        await deleteScheduledMeal(item.id);
        load();
      })();
    };

    if (item.linkedDeviceCalendarEventId) {
      setRemovePrompt({
        title: 'Remove this appointment?',
        message: 'This appointment is also on your phone calendar.',
        actions: [
          { label: 'Remove here only', onPress: () => removeIt(false) },
          { label: 'Remove from both', destructive: true, onPress: () => removeIt(true) },
          { label: 'Cancel', onPress: () => {} },
        ],
      });
      return;
    }

    setRemovePrompt({
      title: 'Remove this appointment?',
      actions: [
        { label: 'Remove', destructive: true, onPress: () => removeIt(false) },
        { label: 'Cancel', onPress: () => {} },
      ],
    });
  }

  async function handleMarkCompleted(item: ScheduleItemRecord) {
    await markAppointmentCompleted(item.id);
    load();
  }

  async function handleToggleCancelled(item: ScheduleItemRecord) {
    await setAppointmentCancelled(item.id, item.status !== 'cancelled');
    load();
  }

  async function ensureCalendarPermission(): Promise<boolean> {
    return ensureDeviceCalendarPermission(calendarPermissionGranted, setCalendarPermissionGranted, showInfoAlert, 'appointments');
  }

  async function handleAddToDeviceCalendar(item: ScheduleItemRecord) {
    const granted = await ensureCalendarPermission();
    if (!granted) return;

    const [datePart, timePart] = item.scheduledFor.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    try {
      const eventId = await createDeviceCalendarEvent({
        title: item.title,
        startDate,
        endDate,
        location: item.location ?? undefined,
        notes: item.notes ?? undefined,
      });
      if (!eventId) {
        showInfoAlert('Could not add to calendar', 'No writable calendar was found on this device.');
        return;
      }
      await linkScheduleItemToDeviceCalendarEvent(item.id, eventId);
      load();
    } catch (error) {
      showInfoAlert('Could not add to calendar', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemoveFromDeviceCalendar(item: ScheduleItemRecord) {
    if (!item.linkedDeviceCalendarEventId) return;
    await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
    await unlinkScheduleItemFromDeviceCalendarEvent(item.id);
    load();
  }

  async function handleOpenImportPicker() {
    const granted = await ensureCalendarPermission();
    if (!granted) return;

    setImportLoading(true);
    setShowForm(false);
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + DEVICE_IMPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const events = await listUpcomingDeviceEvents(now, windowEnd);
      const alreadyLinkedIds = new Set(
        appointments.map((item) => item.linkedDeviceCalendarEventId).filter((id): id is string => id != null),
      );
      setDeviceEvents(events.filter((event) => !alreadyLinkedIds.has(event.id)));
      setShowImportPicker(true);
    } catch (error) {
      showInfoAlert('Could not read phone calendar', error instanceof Error ? error.message : String(error));
    } finally {
      setImportLoading(false);
    }
  }

  function handleStartImport(event: DeviceCalendarEvent) {
    const { dateStr, timeStr } = localDatePartsFromIso(event.startDate);
    setForm({
      editingId: null,
      title: event.title,
      appointmentType: 'doctor',
      date: dateStr,
      time: splitTime24(timeStr),
      location: event.location ?? '',
      providerName: '',
      notes: event.notes ?? '',
      importingDeviceEventId: event.id,
    });
    setShowImportPicker(false);
    setShowForm(true);
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      <AppActionSheet
        visible={removePrompt !== null}
        onClose={() => setRemovePrompt(null)}
        title={removePrompt?.title}
        message={removePrompt?.message}
        actions={removePrompt?.actions ?? []}
      />
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : errorMessage ? (
        <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
      ) : (
        <>
          {!showForm && !showImportPicker ? (
            <View style={styles.appointmentTopActions}>
              <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
                <Text style={styles.addButtonText}>+ Schedule an appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButtonFull} onPress={handleOpenImportPicker} disabled={importLoading}>
                <Text style={styles.secondaryButtonText}>{importLoading ? 'Loading…' : 'Import from Phone Calendar'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showImportPicker ? (
            <View style={styles.formCard}>
              <Text style={styles.label}>Upcoming phone calendar events</Text>
              {deviceEvents.length === 0 ? (
                <Text style={styles.helperText}>Nothing new to import in the next {DEVICE_IMPORT_WINDOW_DAYS} days.</Text>
              ) : (
                <View style={styles.sourceList}>
                  {deviceEvents.map((event) => {
                    const { dateStr } = localDatePartsFromIso(event.startDate);
                    return (
                      <TouchableOpacity key={event.id} style={styles.sourceRow} onPress={() => handleStartImport(event)}>
                        <Text style={styles.sourceRowText}>
                          {event.title}: {formatShortDate(dateStr)}
                        </Text>
                        <Text style={styles.sourceRowKind}>{event.calendarTitle}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowImportPicker(false)}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {showForm ? (
            <View style={styles.formCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>What is this for?</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, title: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Dr. Smith - Endocrinology follow-up"
                value={form.title}
                onChangeText={(text) => setForm((current) => ({ ...current, title: text }))}
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {APPOINTMENT_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pill, form.appointmentType === option.value && styles.pillActive]}
                    onPress={() => setForm((current) => ({ ...current, appointmentType: option.value }))}
                  >
                    <Text style={[styles.pillText, form.appointmentType === option.value && styles.pillTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="YYYY-MM-DD"
                  value={form.date}
                  onChangeText={(text) => setForm((current) => ({ ...current, date: text }))}
                />
                <TouchableOpacity
                  style={styles.pillSmall}
                  onPress={() => setForm((current) => ({ ...current, date: todayDateString() }))}
                >
                  <Text style={styles.pillTextSmall}>Today</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Time</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="8"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.hour}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="00"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.minute}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, minute: text } }))}
                />
                <View style={styles.pillRow}>
                  {(['AM', 'PM'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pillSmall, form.time.ampm === option && styles.pillActive]}
                      onPress={() => setForm((current) => ({ ...current, time: { ...current.time, ampm: option } }))}
                    >
                      <Text style={[styles.pillTextSmall, form.time.ampm === option && styles.pillTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Location (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, location: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Riverside Medical, Suite 200"
                value={form.location}
                onChangeText={(text) => setForm((current) => ({ ...current, location: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Provider (optional)</Text>
                <VoiceInputButton
                  onResult={(text) => setForm((current) => ({ ...current, providerName: text }))}
                  color={TAB_COLOR}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Dr. Smith"
                value={form.providerName}
                onChangeText={(text) => setForm((current) => ({ ...current, providerName: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, notes: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. fasting required, bring insurance card"
                value={form.notes}
                onChangeText={(text) => setForm((current) => ({ ...current, notes: text }))}
              />

              {form.importingDeviceEventId ? (
                <Text style={styles.helperText}>Importing from your phone calendar; will stay linked to that event.</Text>
              ) : null}

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveForm}>
                  <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Schedule appointment'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {interactionWarnings.length > 0 ? (
            <ScheduleBand
              folds={folds}
              id="schedule:appointments:things-to-check"
              title="Things to check"
              icon="alert-circle-outline"
              count={interactionWarnings.length}
            >
            <View style={styles.table}>
              {interactionWarnings.map((warning, index) => (
                <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                  <Text style={styles.interactionTitle}>{warning.title}</Text>
                  <Text style={styles.interactionMessage}>{warning.message}</Text>
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                  <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
            </ScheduleBand>
          ) : null}

          <ScheduleBand folds={folds} id="schedule:appointments:list" title="Appointments" icon="calendar-outline" count={appointments.length}>
          {appointments.length === 0 ? (
            <Text style={[styles.emptyText, styles.panelStandalone]}>Nothing scheduled. Add an appointment or import one from your phone calendar.</Text>
          ) : (
            <View style={styles.table}>
              {appointments.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowTime, styles.appointmentRowTime]}>
                      {formatShortDate(item.scheduledFor.slice(0, 10))}
                      {'\n'}
                      {formatTime12(item.scheduledFor.split('T')[1] ?? '')}
                    </Text>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowMeta}>
                        {appointmentTypeLabel(item.appointmentType)}
                        {item.providerName ? ` · ${item.providerName}` : ''}
                        {item.location ? ` · ${item.location}` : ''}
                        {item.status === 'completed' ? ' · Completed' : item.status === 'cancelled' ? ' · Cancelled' : ''}
                        {item.linkedDeviceCalendarEventId ? ' · On phone calendar' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowActions}>
                    {item.status === 'planned' ? (
                      <>
                        <TouchableOpacity onPress={() => handleMarkCompleted(item)}>
                          <Text style={styles.actionTextPrimary}>Completed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleToggleCancelled(item)}>
                          <Text style={styles.actionText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openEditForm(item)}>
                          <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                      </>
                    ) : item.status === 'cancelled' ? (
                      <TouchableOpacity onPress={() => handleToggleCancelled(item)}>
                        <Text style={styles.actionText}>Un-cancel</Text>
                      </TouchableOpacity>
                    ) : null}
                    {item.linkedDeviceCalendarEventId ? (
                      <TouchableOpacity onPress={() => handleRemoveFromDeviceCalendar(item)}>
                        <Text style={styles.actionText}>Unlink calendar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => handleAddToDeviceCalendar(item)}>
                        <Text style={styles.actionText}>Add to calendar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleRemove(item)}>
                      <Text style={styles.actionTextRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          </ScheduleBand>
        </>
      )}
    </ScrollView>
  );
}

// --- Upkeep --------------------------------------------------------------
//
// The first schedule sourced from Life rather than entered here, 2026-09-13.
// Direct: "There will be maintenance schedules, hobby schedules, etc. Many
// schedules will be because of things contained in Life." Upkeep on Life
// already holds every item with its interval and last-done date, or its
// expiry; this lens is the timeline read off those, nothing re-entered:
// what is overdue, what is due in the next few weeks, what is further out,
// and what cannot be placed on a calendar yet because a piece is missing.
// Done today writes back through the same markUpkeepDone Life uses, so the
// two never disagree; anything else (a new item, a renewal date, an
// interval) is changed in Life, one tap away.
type UpkeepBucket = { key: string; title: string; icon: ComponentProps<typeof Ionicons>['name']; rows: UpkeepStanding[] };

function UpkeepLens() {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [items, setItems] = useState<UpkeepItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const load = useCallback(() => {
    setLoading(true);
    listUpkeepItems()
      .then(setItems)
      .catch((error) => setErrorMessage(`Could not load upkeep: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayDateString();
  const buckets = useMemo<UpkeepBucket[]>(() => {
    const standings = items.filter((item) => item.active).map((item) => upkeepStanding(item, today));
    const dated = standings.filter((standing) => standing.dueOn != null).sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));
    return [
      { key: 'overdue', title: 'Overdue', icon: 'alert-circle-outline', rows: dated.filter((standing) => standing.overdue) },
      { key: 'soon', title: `Due in the next ${DUE_SOON_DAYS} days`, icon: 'time-outline', rows: dated.filter((standing) => standing.dueSoon) },
      { key: 'later', title: 'Later', icon: 'calendar-outline', rows: dated.filter((standing) => !standing.overdue && !standing.dueSoon) },
      { key: 'setup', title: 'Needs a piece before it can be placed', icon: 'help-circle-outline', rows: standings.filter((standing) => standing.missing != null) },
    ];
  }, [items, today]);

  function openUpkeep() {
    router.push({ pathname: '/life', params: { openLifeLens: 'upkeep' } });
  }

  async function handleDoneToday(standing: UpkeepStanding) {
    try {
      const result = await markUpkeepDone(standing.item.id, today);
      showInfoAlert(
        'Recorded',
        result.nextDueOn ? `${standing.item.name} done today. Next due ${result.nextDueOn}.` : `${standing.item.name} done today.`,
      );
      load();
    } catch (error) {
      showInfoAlert('Could not record that', error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      <View style={styles.bandOut}>
        <HomeSectionBand
          kind="action"
          title="Add or change something in Upkeep"
          caption="Services, filters, registrations, renewals: each is defined on the Life tab and its dates show up here."
          icon="construct-outline"
          color={TAB_COLOR}
          onPress={openUpkeep}
        />
      </View>
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : errorMessage ? (
        <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
      ) : items.filter((item) => item.active).length === 0 ? (
        <View style={styles.bandBox}>
          <Text style={styles.emptyText}>
            Nothing in Upkeep yet. Add a service, a filter, a registration or a passport under Life &gt; Upkeep and its dates appear here.
          </Text>
        </View>
      ) : (
        buckets.map((bucket) =>
          bucket.rows.length === 0 ? null : (
            <ScheduleBand key={bucket.key} folds={folds} id={`schedule:upkeep:${bucket.key}`} title={bucket.title} icon={bucket.icon} count={bucket.rows.length}>
              <View style={styles.table}>
                {bucket.rows.map((standing) => (
                  <View key={standing.item.id} style={styles.row}>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowTitle}>{standing.item.name}</Text>
                      <Text style={styles.rowMeta}>
                        {upkeepCategoryLabel(standing.item.category)}
                        {standing.dueOn ? ` · ${standing.dueOn}` : ''}
                      </Text>
                      <Text style={styles.rowMeta}>{describeUpkeepStanding(standing)}</Text>
                    </View>
                    <View style={styles.supplementRowActions}>
                      {standing.item.cadence === 'recurring' && standing.missing !== 'noInterval' ? (
                        <TouchableOpacity onPress={() => handleDoneToday(standing)}>
                          <Text style={styles.actionTextPrimary}>Done today</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={openUpkeep}>
                        <Text style={styles.actionText}>
                          {standing.missing ? 'Set it up in Upkeep' : standing.item.cadence === 'expires' && standing.item.renewable ? 'Renew in Upkeep' : 'Edit in Upkeep'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ScheduleBand>
          ),
        )
      )}
    </ScrollView>
  );
}

// A short, honest placeholder for the remaining schedule type not built
// yet -- same "coming soon" pattern already used for the Trends/Reports
// bottom tabs, one level deeper inside Schedule.
function ComingSoonLens({
  lens,
}: {
  lens: Exclude<Lens, 'meals' | 'todaysMeals' | 'pastMeals' | 'dailyMealPlan' | 'meds' | 'hydration' | 'appointments' | 'upkeep'>;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <View style={styles.bandBox}><Text style={styles.emptyText}>{COMING_SOON_COPY[lens]}</Text></View>
    </ScrollView>
  );
}

export default function ScheduleScreen() {
  useRegisterScreenHelp('Schedules', SCHEDULE_HELP_SECTIONS, '/schedule');
  // 2026-08-26 -- the same real deep-link mechanism purple-digest.tsx's
  // own openDigestLens already established, so Profile can jump straight
  // into the Daily Meal Plan lens rather than leaving someone to find it
  // themselves via LensHub afterward.
  const { openScheduleLens, scheduleTreatmentId } = useLocalSearchParams<{ openScheduleLens?: string; scheduleTreatmentId?: string }>();
  const [lens, setLens] = useState<Lens>('meals');
  const activeLensLabel = LENSES.find((option) => option.key === lens)?.label;
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment
  // for the full reasoning. `lens` itself keeps its last-picked value
  // indefinitely; only `revealed` resets on focus, so every arrival shows
  // the resting prompt first, never an instant resume.
  const [revealed, setRevealed] = useState(false);
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as
  // Food's own identical addition (app/(tabs)/food.tsx): lets LensHub's
  // new "My Schedules" top-left tile (see its extraTile prop below) open
  // this SAME popup, at its own already-established position, after
  // closing itself first. The standalone MyItemsHub button further down
  // keeps working exactly as before regardless.
  const [mySchedulesOpen, setMySchedulesOpen] = useState(false);
  // 2026-08-30, direct report: "After generating my meal plan and putting
  // it onto a schedule, it isn't listed in My Schedules." Confirmed by
  // reading this file rather than the meal plan: MyItemsHub below was
  // mounted with no `categories` prop, so it always showed that
  // component's own "Nothing saved yet" placeholder regardless of what was
  // actually scheduled. The rows were being written correctly the whole
  // time; nothing was looking for them.
  //
  // Loaded on open rather than on focus (MyItemsHub's own onOpen hook, the
  // same way Food's My Foods counts already work), so a popup nobody opens
  // costs nothing.
  const [scheduleCounts, setScheduleCounts] = useState<Record<string, number>>({});
  const loadScheduleCounts = useCallback(() => {
    getUpcomingScheduleCountsByType(todayDateString())
      .then(setScheduleCounts)
      // A count is a convenience on a shortcut menu, not the data itself --
      // failing to load one should leave the menu usable rather than break
      // the popup, so every category still opens its lens either way.
      .catch(() => setScheduleCounts({}));
  }, []);

  // Only the item types genuinely scheduled by this app today. Each opens
  // the lens that actually lists that type, so the popup is a real way
  // through to the data rather than a display of numbers.
  const myScheduleCategories = useMemo(() => {
    const openLens = (key: Lens) => () => {
      setLens(key);
      setRevealed(true);
    };
    return [
      { id: 'todaysMeals', label: "Today's Meals", count: undefined, onPress: openLens('todaysMeals') },
      { id: 'meals', label: 'Scheduled Meals', count: scheduleCounts.meal ?? 0, onPress: openLens('meals') },
      {
        id: 'meds',
        label: 'Meds',
        count: (scheduleCounts.supplement ?? 0) + (scheduleCounts.prescription ?? 0) + (scheduleCounts.otc ?? 0),
        onPress: openLens('meds'),
      },
      { id: 'appointments', label: 'Appointments', count: scheduleCounts.appointment ?? 0, onPress: openLens('appointments') },
      { id: 'hydration', label: 'Hydration', count: undefined, onPress: openLens('hydration') },
      { id: 'upkeep', label: 'Upkeep', count: undefined, onPress: openLens('upkeep') },
    ];
  }, [scheduleCounts]);
  useFocusEffect(
    useCallback(() => {
      // openScheduleLens overrides the normal "always land on the resting
      // picker" reset below, the same way purple-digest.tsx's own
      // openDigestLens does -- without this, a real deep link from
      // Profile would still show the LensHub picker for a beat instead of
      // the lens it was actually sent to.
      // 2026-08-29: generalised from the single 'dailyMealPlan' case to
      // any real lens key, so Home's "Meals logged today" tile can land on
      // Past Meals instead of dropping someone on the lens picker. Matched
      // against LENSES rather than cast, so a stale or mistyped link falls
      // through to the ordinary resting picker instead of setting a lens
      // that does not exist.
      const requestedLens = LENSES.find((option) => option.key === openScheduleLens);
      if (requestedLens) {
        setLens(requestedLens.key);
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [openScheduleLens]),
  );
  const autoOpenLensHub = useAutoOpenLensHubSignal();

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Schedules" variant="schedule" revealed={revealed}>
          {lens === 'meals' ? (
            <MealsLens />
          ) : lens === 'todaysMeals' ? (
            <TodaysMealsLens />
          ) : lens === 'pastMeals' ? (
            <PastMealsLens />
          ) : lens === 'dailyMealPlan' ? (
            <DailyMealPlanLens />
          ) : lens === 'hydration' ? (
            <HydrationLens />
          ) : lens === 'meds' ? (
            <MedsLens scheduleTreatmentId={scheduleTreatmentId} />
          ) : lens === 'appointments' ? (
            <AppointmentsLens />
          ) : lens === 'upkeep' ? (
            <UpkeepLens />
          ) : (
            <ComingSoonLens lens={lens} />
          )}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Schedules" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Schedules"
        tabColor={TAB_COLOR}
        categories={myScheduleCategories}
        onOpen={loadScheduleCounts}
        open={mySchedulesOpen}
        onOpenChange={setMySchedulesOpen}
      />
      <LensHub
        pageTitle="Schedules"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{
          label: 'My Schedules',
          icon: 'bookmarks-outline',
          onPress: () => {
            // MyItemsHub's own onOpen only fires for its own button, so
            // opening the popup this way has to load the counts itself or
            // the same menu would show stale/absent numbers.
            loadScheduleCounts();
            setMySchedulesOpen(true);
          },
        }}
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
  body: { flex: 1 },
  // The band look, 2026-09-13 (see components/HomeSectionBand.tsx), the
  // same as every Food screen: the column keeps its 16px so the loose
  // buttons between bands stay inset, every band cancels it to run edge
  // to edge, and the standard gap separates everything.
  bodyContent: { padding: 16, paddingTop: 5, paddingBottom: 32, gap: HOME_BAND_GAP },
  bandOut: { marginHorizontal: -16 },
  // Rows inside a band, the standard gap apart.
  bandRows: { gap: HOME_BAND_GAP },
  // A headerless band box: a form, a reading, a notice.
  bandBox: {
    ...homeBandStyle,
    borderColor: TAB_COLOR,
    marginHorizontal: -16,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  errorText: { ...typography.body, color: colors.danger, ...textShadow },
  // Outline-only until 2026-08-29, which left its label sitting straight
  // on the photo background. A fill is the fix rather than a shadow: an
  // unfilled control on a photo is exactly the case the standing rule
  // exists for.
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  // Since 2026-09-13 a heading introducing a group is the band's own header
  // row (ScheduleBand), and a standalone line sits in a bandBox; what is
  // left is the inset-row look for a line inside a band.
  // Today's Meals -- see TodaysMealsLens above.
  todaysMealBody: { gap: 10 },
  todaysMealComponent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 2,
  },
  todaysMealComponentName: { ...typography.label, color: TAB_COLOR, ...textShadow },
  todaysMealSectionLabel: { ...typography.eyebrow, color: TAB_COLOR, marginTop: 8, ...textShadow },
  // Steps get real line height and a hanging indent feel: this is text
  // read a line at a time with hands busy, not scanned.
  todaysMealStep: { ...typography.body, color: colors.textPrimary, lineHeight: 21, marginTop: 4, ...textShadow },
  // Rendered on a Text, so it takes the inset-row look (a band's own view
  // styles cannot sit on a Text); a lens-top loading or error line is
  // wrapped in a bandBox View instead.
  panelStandalone: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  addButtonText: { ...typography.bodyEmphasis, color: colors.primary, ...textShadow },
  // Meals lens' own week strip, 2026-08-18 -- same border/color rule as
  // every other card on this page (a TAB_COLOR border, TAB_COLOR text).
  weekStripCard: {
    ...homeBandStyle,
    borderColor: TAB_COLOR,
    marginHorizontal: -16,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  weekStripNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  weekNavButton: { paddingHorizontal: 14, paddingVertical: 2 },
  weekNavButtonText: { ...typography.sectionTitle, color: TAB_COLOR, ...textShadow },
  weekRangeLabel: { ...typography.bodyEmphasis, color: TAB_COLOR, ...textShadow },
  weekDayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  weekDayCellSelected: { backgroundColor: colors.primary },
  weekDayCellToday: { borderColor: TAB_COLOR },
  weekDayLabel: { ...typography.caption, color: TAB_COLOR, ...textShadow },
  weekDayNumber: { ...typography.bodyEmphasis, color: TAB_COLOR, marginTop: 2, ...textShadow },
  weekDayLabelSelected: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  weekDayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginTop: 4 },
  weekDayDotActive: { backgroundColor: TAB_COLOR },
  weekDayDotActiveSelected: { backgroundColor: colors.textOnPrimary },
  weekTodayLink: { ...typography.caption, color: TAB_COLOR, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline', ...textShadow },
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule,
  // 2026-07-27.
  formCard: {
    ...homeBandStyle,
    borderColor: TAB_COLOR,
    marginHorizontal: -16,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  // Same rule extended here, 2026-07-27: a border in TAB_COLOR (this card
  // had none before), and its own label/headline value both now carry
  // TAB_COLOR too, matching Home's statNumber -- the loud number is the
  // "reading" this box exists to show.
  hydrationSummaryCard: {
    ...homeBandStyle,
    borderColor: TAB_COLOR,
    marginHorizontal: -16,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  hydrationSummaryLabel: { ...typography.eyebrow, color: TAB_COLOR, ...textShadow },
  hydrationSummaryValue: { ...typography.screenTitle, color: TAB_COLOR, marginTop: 4, ...textShadow },
  hydrationSummaryMeta: { ...typography.caption, color: TAB_COLOR, marginTop: 2, ...textShadow },
  // Colors below (through interactionCitation) are TAB_COLOR, not the
  // plain neutrals they used to be -- 2026-07-27, "every font inside a box
  // should match that box's own border color." Leaves selection-state
  // colors (pillActive/pillTextActive, sourceRowTextSelected) alone -- that's
  // a "this option is currently picked" signal, the same convention used
  // app-wide, a different meaning than "which tab."
  label: { ...typography.label, color: TAB_COLOR, marginBottom: 6, marginTop: 10, ...textShadow },
  // 2026-08-16 -- wraps a real free-text field's own label with a real mic
  // button beside it, the same shape SideBuilder.tsx's own Name-field row
  // already established. label's own marginTop/marginBottom still apply
  // (margin on a child inside a row isn't cleared by the row itself), so
  // no existing spacing anywhere this wraps needed to change.
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planScopeBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  planScopeText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  helperText: { ...typography.caption, color: TAB_COLOR, marginTop: 4, marginBottom: 8, ...textShadow },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: TAB_COLOR, textTransform: 'capitalize', ...textShadow },
  pillTextSmall: { ...typography.caption, color: TAB_COLOR, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  modeRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  modeTabActive: { backgroundColor: colors.primary },
  modeTabText: { ...typography.captionEmphasis, color: TAB_COLOR, ...textShadow },
  modeTabTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  sourceList: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  sourceRowSelected: { backgroundColor: colors.primaryTint },
  sourceRowText: { ...typography.body, color: TAB_COLOR, flex: 1, marginRight: 8, ...textShadow },
  sourceRowTextSelected: { color: colors.primary, fontWeight: '400' },
  sourceRowKind: { ...typography.caption, color: TAB_COLOR, ...textShadow },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    ...typography.body,
    color: TAB_COLOR,
    ...textShadow,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 56, textAlign: 'center' },
  timeSeparator: { ...typography.label, color: TAB_COLOR, ...textShadow },
  doseUnitInput: { flex: 1 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ingredientNutrientCol: { flex: 2 },
  ingredientAmountInput: { flex: 1, minWidth: 64 },
  ingredientUnitCol: { minWidth: 76 },
  ingredientRemove: { paddingHorizontal: 6, paddingVertical: 6 },
  // Same "which form?" picker sits directly under its own ingredient row --
  // full-width on its own line rather than squeezed into the row (a form
  // name like "Myo-inositol + D-chiro-inositol (40:1 blend)" needs real
  // room), 2026-08-08 for My Meds.
  ingredientFormRow: { marginBottom: 4 },
  myMedsAddRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  // 2026-08-29, standing rule: "No font should ever be directly on the
  // tab background without its own background anywhere in the app."
  // `row` below carries no background of its own by design (it expects to
  // sit inside a card), but this group placed rows straight onto the
  // photo, so every treatment name, dose line and action label was
  // sitting on it. Giving the group the card fixes that whole cluster at
  // once rather than chipping each line inside it. overflow hidden so the
  // rows' full-bleed top borders stay inside the rounded corners.
  myMedsGroup: { gap: HOME_BAND_GAP },
  // The researched-content card shown once a nutrient/form (or a matched
  // common medication) is picked -- deliberately a lighter, dashed-border
  // look, distinct from formCard/interactionCard's own solid TAB_COLOR
  // border, so it reads as "supporting information," not another thing to
  // fill in or another warning to act on.
  myMedsResearchCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: TAB_COLOR,
    padding: 12,
  },
  myMedsResearchLabel: { ...typography.captionEmphasis, color: TAB_COLOR, marginTop: 4, ...textShadow },
  myMedsDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  // Filled for the same reason as addButton above.
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  secondaryButtonText: { ...typography.bodyEmphasis, color: TAB_COLOR, ...textShadow },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  primaryButtonDisabled: { opacity: 0.5 },
  // Meal Plan/Shopping List lenses, 2026-08-24.
  mealPlanDayRow: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    gap: 2,
  },
  mealPlanSlotText: { ...typography.body, color: TAB_COLOR, ...textShadow },
  mealPlanDayFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  mealPlanDayDateInput: { flex: 1 },
  // Daily Meal Plan lens, 2026-08-25.
  dailyPlanPickRow: { marginTop: 4, marginBottom: 4, gap: 1 },
  dailyPlanSlot: { marginTop: 8, gap: 2 },
  // 2026-08-26 fix: a long "Mostly from: X (Y%), Z (W%)" contributor line
  // (added the same day) had nothing constraining its own width, so it
  // pushed straight off the right edge of the screen instead of wrapping
  // inside the card -- flex: 1 on both real children plus flexShrink on
  // the value column's own text lets long content wrap within the
  // available space instead of overflowing it.
  dailyPlanNutrientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border },
  dailyPlanNutrientLabel: { flex: 1, marginRight: 8 },
  dailyPlanNutrientValue: { flex: 1, alignItems: 'flex-end' },
  dailyPlanDayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dailyPlanHealthDot: { width: 10, height: 10, borderRadius: 5 },
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule,
  // 2026-07-27.
  // A list inside a band: rows as inset boxes at the standard gap (a band
  // inside a band would put its accent 16px in).
  table: { gap: HOME_BAND_GAP },
  row: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
  },
  rowMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowTime: { ...typography.captionEmphasis, color: TAB_COLOR, width: 68, ...textShadow },
  rowTextCol: { flex: 1 },
  rowTitle: { ...typography.label, color: TAB_COLOR, ...textShadow },
  rowMeta: { ...typography.caption, color: TAB_COLOR, marginTop: 2, ...textShadow },
  rowActions: { flexDirection: 'row', gap: 16, marginTop: 10, marginLeft: 80 },
  supplementRowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  doseSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doseSectionLabel: { ...typography.captionEmphasis, color: TAB_COLOR, marginBottom: 6, ...textShadow },
  doseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  doseRowTime: { ...typography.captionEmphasis, color: TAB_COLOR, width: 68, ...textShadow },
  doseRowStatus: { ...typography.caption, color: TAB_COLOR, flex: 1, ...textShadow },
  doseRowActions: { flexDirection: 'row', gap: 14 },
  doseForm: { marginTop: 8 },
  appointmentTopActions: { gap: HOME_BAND_GAP },
  secondaryButtonFull: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  dateInput: { flex: 1 },
  appointmentRowTime: { width: 76, lineHeight: 16 },
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule,
  // 2026-07-27.
  interactionCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
  },
  // Reference-only rules are outlined rather than filled, so a warning
  // that applies and one kept for reference do not read the same.
  interactionCardReference: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  interactionTitle: { ...typography.bodyEmphasis, color: TAB_COLOR, ...textShadow },
  interactionMessage: { ...typography.body, color: TAB_COLOR, marginTop: 4, ...textShadow },
  interactionCitation: { ...typography.caption, color: TAB_COLOR, marginTop: 6, ...textShadow },
  actionText: { ...typography.captionEmphasis, color: TAB_COLOR, ...textShadow },
  actionTextPrimary: { ...typography.captionEmphasis, color: colors.primary, ...textShadow },
  actionTextRemove: { ...typography.captionEmphasis, color: colors.danger, ...textShadow },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  rotateSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 16,
  },
  rotateSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rotateSheetTitle: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1, marginRight: 12, ...textShadow },
  rotateSheetCloseText: { ...typography.sectionTitle, color: colors.textMuted, ...textShadow },
  rotateSheetScroll: { marginTop: 8 },
  rotateIngredientCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rotateIngredientLabel: { ...typography.captionEmphasis, color: colors.textSecondary, marginBottom: 6, ...textShadow },
});
