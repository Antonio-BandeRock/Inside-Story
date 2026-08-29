import { useCallback, useMemo, useRef, useState } from 'react';
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
  addMealPlanDayToSchedule,
  applyRotationSelection,
  applyRotationSelectionsToIngredients,
  createOtcTreatment,
  createPrescriptionTreatment,
  createSupplementTreatment,
  deleteScheduledMeal,
  deleteScheduleSeries,
  deleteTreatment,
  ensureScheduleSeriesGenerated,
  getDailyNutrientAnalysis,
  getDietPreferences,
  getNutrientTiming,
  getSupplementForms,
  getTreatmentNutrients,
  getUpcomingShoppingList,
  getUserConditions,
  getUserProfile,
  hasStandingHydrationRoutine,
  linkScheduleItemToDeviceCalendarEvent,
  listAllActiveTreatments,
  listCommonMedications,
  listFavorites,
  listMeals,
  listMealsForDate,
  listPastScheduledMeals,
  listPrescriptionTreatments,
  listScheduledMealsForDate,
  listScheduledMealsForDateRange,
  listScheduledPrescriptionDosesForTreatment,
  listScheduledSupplementDosesForTreatment,
  listSupplementTreatments,
  listTrackedNutrients,
  listUpcomingAppointments,
  markAppointmentCompleted,
  markScheduledDoseTaken,
  scheduleAppointment,
  scheduleHydrationRemindersForDay,
  scheduleMeal,
  schedulePrescriptionDose,
  scheduleSupplementDose,
  setAppointmentCancelled,
  setScheduledMealRotationSelections,
  setScheduledMealSkipped,
  settlePastScheduledMeals,
  setTreatmentActive,
  setUpMealPlan,
  unlinkScheduleItemFromDeviceCalendarEvent,
  updateAppointment,
  updateOtcTreatment,
  updateScheduledMeal,
  updatePrescriptionTreatment,
  updateSupplementTreatment,
  type CommonMedication,
  type FavoriteRecord,
  type MealFavoritePayload,
  type MealIngredientInput,
  type MealPlanDay,
  type MealRecord,
  type NutrientTiming,
  type RepeatConfig,
  type RotationSelection,
  type ScheduleItemRecord,
  type ShoppingListSection,
  type SupplementForm,
  type SupplementIngredientInput,
  type TrackedNutrient,
  type TreatmentNutrientRecord,
  type TreatmentRecord,
  type UserProfile,
} from '../../lib/db';
import type { RecipeDietTag } from '../../lib/digest';
import { RECIPES_ENTRIES } from '../../lib/digest/recipes';
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
import { MEAL_PLAN } from '../../lib/mealPlan';
import { VEGAN_MEAL_PLAN } from '../../lib/mealPlanVegan';
import { VEGETARIAN_MEAL_PLAN } from '../../lib/mealPlanVegetarian';
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
import { buildTime24, formatTime12, splitTime24, type TimeOfDayInput } from '../../lib/timeOfDay';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { Dropdown, type DropdownOption } from '../../components/Dropdown';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PopoverSelect } from '../../components/PopoverSelect';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { WhyExplainer } from '../../components/WhyExplainer';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
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
  | 'pastMeals'
  | 'mealPlan'
  | 'dailyMealPlan'
  | 'shoppingList'
  | 'hydration'
  | 'myMeds'
  | 'supplements'
  | 'prescriptions'
  | 'appointments'
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
    key: 'mealPlan',
    label: 'Meal Plan',
    icon: 'calendar-outline',
    help: [
      {
        heading: 'What this is',
        body: 'A real, ready-made 6-week rotation of whole-food breakfasts, lunches, and dinners, no two days the same, built from this Digest\'s own curated recipes. "Set Up My Plan" fills your Meals schedule automatically starting from a date you choose; each day below also has its own "Add to Schedule" button if you\'d rather pick days one at a time.',
      },
      {
        heading: 'Still growing',
        body: 'The first 2 weeks are built now; more weeks are on the way in a future update. Nothing here ever repeats a day\'s own combination of meals.',
      },
    ],
  },
  {
    key: 'dailyMealPlan',
    label: 'Daily Meal Plan',
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
    key: 'shoppingList',
    label: 'Shopping List',
    icon: 'cart-outline',
    help: [
      {
        heading: 'What this is',
        body: 'Every ingredient your already-scheduled meals need over the next few days, added up and grouped by aisle, so a single trip covers everything. Only counts meals you\'ve actually scheduled (from the Meal Plan, or scheduled any other way), never a guess at what you might eat.',
      },
      {
        heading: 'Choosing the window',
        body: 'Matches how often you\'d rather shop for fresh ingredients, 3 to 4 days is the usual sweet spot for produce that doesn\'t keep long, a full week works too if that suits you better.',
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
    key: 'myMeds',
    label: 'My Meds',
    icon: 'flask-outline',
    help: [
      {
        heading: 'One place for everything you take',
        body: 'Prescriptions, over-the-counter drugs, and supplements, all in one registry: pick a prescription or OTC item from a cited reference list where it exists, or enter it yourself when it doesn\'t. A supplement asks which nutrient(s) it contains and, for the ones this app has researched, which specific form (e.g. magnesium glycinate vs. oxide); the form changes how well it absorbs.',
      },
      {
        heading: 'More than a name and a dose',
        body: 'Once a nutrient and form are picked, this shows when to take it (empty stomach, with food, before bed), what to avoid taking it with, what pairs well with it, and, where this app has the data, how much you\'re already getting from food today, so a supplement decision starts from what food is already covering, not a guess.',
      },
      {
        heading: 'Interactions',
        body: 'Reuses the same cited interaction-checking engine as Supplements and Prescriptions, extended for My Meds specifically: potassium supplements with blood pressure medications, or metformin\'s effect on TSH readings for anyone also on levothyroxine.',
      },
      {
        heading: 'What this doesn\'t do yet',
        body: 'Reminder times and repeat schedules for prescriptions and supplements still live on those two lenses, unchanged; adding an item here does not yet also set up a reminder for it. Looking up a medication this app doesn\'t already have online is a planned future capability, not built yet: for now, anything not in the list can still be tracked by entering it yourself.',
      },
    ],
  },
  {
    key: 'supplements',
    label: 'Supplements',
    icon: 'medkit-outline',
    help: [
      {
        heading: 'Document every ingredient',
        body: 'For a supplement\'s contribution to count toward your daily totals, document exactly what one dose contains: each ingredient, its amount, and its unit (mg, mcg, g, or IU). A single-ingredient product gets one row; a multivitamin gets one row per nutrient on its label.',
      },
      {
        heading: 'Tracking / Not tracking',
        body: 'This one toggle covers stopping a supplement, cycling on and off it, or taking it temporarily; flip it off when you are not taking it and back on when you are. Nothing is deleted either way, so you never have to re-enter its ingredients.',
      },
      {
        heading: 'Reminder times are separate from tracking',
        body: 'A supplement\'s contribution to your daily totals always comes from the Tracking toggle alone. Adding reminder times underneath it is optional and purely a personal adherence record: for a supplement that needs a specific dose time (e.g. away from calcium, or with a meal for fat solubility), not a second way of counting it.',
      },
      {
        heading: 'Interaction checking',
        body: 'Calcium/iron/zinc timing and the fat-soluble vitamins are checked automatically once reminder times are set. Biotin + an upcoming lab draw is checked too, once you\'re tracking biotin and have a "Lab / bloodwork" appointment within the next couple weeks. Anything triggered shows under "Things to check" here.',
      },
      REPEATING_SCHEDULES_HELP,
    ],
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    icon: 'medical-outline',
    help: [
      {
        heading: 'Prescriptions',
        body: 'Track what you take, its dose and frequency, and (optionally) specific reminder times: same on/off Tracking toggle and repeat picker as Supplements. Prescriptions don\'t contribute nutrients, so there\'s no ingredient list to document.',
      },
      {
        heading: 'Interaction checking',
        body: 'Levothyroxine + calcium/iron timing is checked automatically once you track levothyroxine as a prescription and calcium/iron as supplements with reminder times set. This app matches a prescription by name (e.g. "levothyroxine" anywhere in what you named it). Anything triggered shows under "Things to check" here.',
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
    key: 'exercise',
    label: 'Exercise',
    icon: 'barbell-outline',
    help: [{ heading: 'Exercise', body: 'Schedule planned workouts and activity. Not built yet.' }],
  },
];

const COMING_SOON_COPY: Record<
  Exclude<Lens, 'meals' | 'pastMeals' | 'mealPlan' | 'dailyMealPlan' | 'shoppingList' | 'myMeds' | 'supplements' | 'hydration' | 'prescriptions' | 'appointments'>,
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
function MealsLens() {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
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
      showInfoAlert('Almost there', 'Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
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
      {loading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
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

            {selectedItems.length === 0 ? (
              <Text style={styles.emptyText}>Nothing scheduled for {describeRelativeDate(selectedDate)} yet.</Text>
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
        <Text style={styles.emptyText}>Loading…</Text>
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>No past meals yet.</Text>
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
function DailyPlanFullReport({ day }: { day: DailyMealPlanResult }) {
  const ratingColors = healthRatingColors(day.healthRating);
  return (
    <>
      <View style={[styles.formCard, { backgroundColor: ratingColors.bg, borderColor: ratingColors.border }]}>
        <Text style={[styles.label, { color: ratingColors.text }]}>
          {day.healthRating === 'green' ? 'Green' : day.healthRating === 'yellow' ? 'Yellow' : 'Incomplete'}
        </Text>
        <Text style={[styles.helperText, { color: ratingColors.text }]}>{healthRatingLabel(day.healthRating)}</Text>
        <Text style={styles.helperText}>
          Total carbohydrate: {Math.round(day.totalCarbGrams)}g{day.carbCeiling ? ` (target: under ${day.carbCeiling}g)` : ''}
        </Text>
        {day.warnings.map((warning, index) => (
          <Text key={index} style={styles.helperText}>
            ⚠ {warning}
          </Text>
        ))}
      </View>

      <View style={styles.sourceList}>
        <View style={styles.mealPlanDayRow}>
          <Text style={styles.rowTitle}>Breakfast</Text>
          {day.breakfast ? <DailyMealPlanPickRow pick={day.breakfast} /> : <Text style={styles.helperText}>No compliant option found.</Text>}
        </View>
        <View style={styles.mealPlanDayRow}>
          <Text style={styles.rowTitle}>Lunch</Text>
          {day.lunch.length > 0 ? (
            day.lunch.map((pick) => <DailyMealPlanPickRow key={pick.entry.id} pick={pick} />)
          ) : (
            <Text style={styles.helperText}>No compliant option found.</Text>
          )}
        </View>
        <View style={styles.mealPlanDayRow}>
          <Text style={styles.rowTitle}>Dinner</Text>
          {day.dinner.length > 0 ? (
            day.dinner.map((pick) => <DailyMealPlanPickRow key={pick.entry.id} pick={pick} />)
          ) : (
            <Text style={styles.helperText}>No compliant option found.</Text>
          )}
        </View>
      </View>

      {(() => {
        const waterRow = day.nutrientCoverage.find((row) => row.nutrientCode === 'water');
        if (!waterRow || waterRow.targetAmount == null) return null;
        const remainingMl = getDailyMealPlanWaterGapMl(day);
        return (
          <View style={styles.formCard}>
            <Text style={styles.label}>Hydration</Text>
            <Text style={styles.helperText}>
              {Math.round(waterRow.amount)}ml of your {Math.round(waterRow.targetAmount)}ml daily target from this plan&apos;s food and drink
              {waterRow.percentOfTarget !== null ? ` (${waterRow.percentOfTarget}%)` : ''}.
            </Text>
            <Text style={styles.helperText}>
              {remainingMl > 0
                ? `Drink about ${remainingMl}ml more of plain water today to reach your target, the same combined food-and-drink target the Hydration lens tracks. "Add to Schedule" turns this into real, timed reminders through the day, not just a note.`
                : "This plan's food and drink alone already reaches your daily target."}
            </Text>
          </View>
        );
      })()}

      <View style={styles.formCard}>
        <Text style={styles.label}>Nutrient coverage</Text>
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
                  {row.topContributors.length > 0 ? (
                    <Text style={[styles.helperText, { textAlign: 'right' }]}>
                      Mostly from: {row.topContributors.slice(0, 3).map((c) => `${c.title} (${c.percentOfDayTotal}%)`).join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
      </View>
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
      const results = await generateMealPlanDays({ conditionCodes, dietPreferences, carbLevel, days: daysToGenerate, limitAddedSugar });
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
      const result = await generateDailyMealPlan({ conditionCodes, dietPreferences, carbLevel, limitAddedSugar });
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
      </View>

      {singleDay ? (
        <DailyPlanFullReport day={singleDay} />
      ) : plans.length > 1 ? (
        // Multi-day: a condensed row per day, tappable to expand into the
        // exact same full report the single-day case uses -- "Each week
        // per day needs to be available for viewing so they can go
        // through their whole week and swap things out if they need to."
        <View style={styles.sourceList}>
          {plans.map((day, index) => {
            const isExpanded = expandedDayIndex === index;
            const isRegenerating = regeneratingDayIndex === index;
            return (
              <View key={index} style={styles.mealPlanDayRow}>
                <TouchableOpacity onPress={() => setExpandedDayIndex(isExpanded ? null : index)} activeOpacity={0.7}>
                  <View style={styles.dailyPlanDayHeaderRow}>
                    <View style={[styles.dailyPlanHealthDot, { backgroundColor: healthRatingDotColor(day.healthRating) }]} />
                    <Text style={styles.rowTitle}>Day {index + 1}</Text>
                    <Text style={[styles.helperText, { marginLeft: 8 }]}>{isExpanded ? 'Hide full day' : 'View full day'}</Text>
                  </View>
                </TouchableOpacity>
                {isExpanded ? (
                  <>
                    <DailyPlanFullReport day={day} />
                    <TouchableOpacity
                      style={[styles.primaryButton, { marginTop: 8 }, isRegenerating && styles.primaryButtonDisabled]}
                      activeOpacity={0.85}
                      disabled={isRegenerating}
                      onPress={() => regenerateDay(index)}
                    >
                      <Text style={styles.primaryButtonText}>{isRegenerating ? "Regenerating..." : "Regenerate This Day"}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.mealPlanSlotText}>Breakfast: {day.breakfast?.entry.title ?? "No compliant option found."}</Text>
                    <Text style={styles.mealPlanSlotText}>
                      Lunch: {day.lunch.length > 0 ? day.lunch.map((p) => p.entry.title).join(" with ") : "No compliant option found."}
                    </Text>
                    <Text style={styles.mealPlanSlotText}>
                      Dinner: {day.dinner.length > 0 ? day.dinner.map((p) => p.entry.title).join(" with ") : "No compliant option found."}
                    </Text>
                    {day.warnings.length > 0 ? <Text style={styles.helperText}>⚠ {day.warnings.join(" ")}</Text> : null}
                  </>
                )}
              </View>
            );
          })}
        </View>
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

// A quick, synchronous title lookup for lib/mealPlan.ts's own recipe
// references -- built once from RECIPES_ENTRIES (already imported for the
// whole app either way), not a DB round-trip, since this lens only needs
// a name to show, not the full resolved ingredient list.
const RECIPE_TITLE_BY_ID: Record<string, string> = Object.fromEntries(
  RECIPES_ENTRIES.filter((entry): entry is typeof entry & { linkedCuratedRecipeId: string } => Boolean(entry.linkedCuratedRecipeId)).map(
    (entry) => [entry.linkedCuratedRecipeId, entry.title],
  ),
);

function mealPlanSlotLabel(slot: MealPlanDay['breakfast']): string {
  const mainTitle = RECIPE_TITLE_BY_ID[slot.main.curatedRecipeId] ?? slot.main.curatedRecipeId;
  if (!slot.side) return mainTitle;
  const sideTitle = RECIPE_TITLE_BY_ID[slot.side.curatedRecipeId] ?? slot.side.curatedRecipeId;
  return `${mainTitle} with ${sideTitle}`;
}

// 2026-08-24, direct follow-up to the chrononutrition pass above:
// "we need vegan alternatives... vegan or vegetarian, or any point in
// between." Confirmed as full, parallel 42-day tracks rather than a
// smaller sampler. MEAL_PLAN/VEGAN_MEAL_PLAN/VEGETARIAN_MEAL_PLAN are
// all the same real MealPlanDay[] shape (see mealPlanVegan.ts/
// mealPlanVegetarian.ts's own header comments for how each was built),
// so switching tracks here is just picking which array feeds everything
// below, no separate code path per track.
const DIET_TRACK_OPTIONS = ['Omnivore', 'Vegan', 'Vegetarian'] as const;
type DietTrack = (typeof DIET_TRACK_OPTIONS)[number];
const MEAL_PLAN_BY_TRACK: Record<DietTrack, MealPlanDay[]> = {
  Omnivore: MEAL_PLAN,
  Vegan: VEGAN_MEAL_PLAN,
  Vegetarian: VEGETARIAN_MEAL_PLAN,
};

// 2026-08-24, direct request: "I want a button that will set it up for
// them if they want it to, or they can go through and individually import
// meals into the schedule." Both paths call the exact same real
// scheduleMealPlanSlot logic under the hood (see lib/db.ts's own
// setUpMealPlan/addMealPlanDayToSchedule), so a day added individually
// here behaves identically to one the bulk button would have created.
function MealPlanLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [dietTrack, setDietTrack] = useState<DietTrack>('Omnivore');
  const activePlan = MEAL_PLAN_BY_TRACK[dietTrack];
  // 2026-08-24, direct request: "the type of diet a person is trying to
  // follow... should be in the Profile." Defaults this picker from
  // Profile's own new "Diet Preferences" card, still freely changeable
  // right here -- dietTrackTouched (not persisted, a plain ref) stops a
  // later background refetch from silently overwriting a manual pick made
  // earlier in the same visit. Vegan wins over Vegetarian if both are
  // selected on Profile, matching RecipeDietTag's own "vegan implies
  // vegetarian-safe" convention; Omnivore stays the default when neither is
  // selected, unchanged from before this.
  const dietTrackTouched = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getDietPreferences()
        .then((tags) => {
          if (cancelled || dietTrackTouched.current) return;
          if (tags.includes('Vegan')) setDietTrack('Vegan');
          else if (tags.includes('Vegetarian')) setDietTrack('Vegetarian');
        })
        .catch(() => {
          // Best-effort only -- a failure here just means the picker falls
          // back to its own original Omnivore default, never a broken screen.
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );
  const [startDate, setStartDate] = useState(todayDateString());
  const [settingUp, setSettingUp] = useState(false);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  // Every track has the same 42 days, so the day-number-to-date mapping
  // stays valid across a track switch without needing to be reset.
  const [dayDates, setDayDates] = useState<Record<number, string>>(
    Object.fromEntries(MEAL_PLAN.map((planDay) => [planDay.day, addDaysToDateStringLocal(todayDateString(), planDay.day - 1)])),
  );

  async function handleSetUpPlan() {
    if (!isValidDateString(startDate)) {
      showInfoAlert('Almost there', 'Enter a valid start date (YYYY-MM-DD).');
      return;
    }
    setSettingUp(true);
    try {
      const result = await setUpMealPlan(startDate, activePlan);
      showInfoAlert(
        'Plan scheduled',
        `${result.scheduled} meal${result.scheduled === 1 ? '' : 's'} added to your schedule` +
          (result.skipped > 0 ? `, ${result.skipped} already had something planned and were left as-is.` : '.'),
      );
    } catch (error) {
      showInfoAlert('Could not set up the plan', error instanceof Error ? error.message : String(error));
    } finally {
      setSettingUp(false);
    }
  }

  async function handleAddDay(planDay: MealPlanDay) {
    const date = dayDates[planDay.day];
    if (!isValidDateString(date)) {
      showInfoAlert('Almost there', 'Enter a valid date (YYYY-MM-DD) for this day.');
      return;
    }
    setAddingDay(planDay.day);
    try {
      await addMealPlanDayToSchedule(planDay, date);
      showInfoAlert('Added', `Day ${planDay.day} was added to your schedule for ${date}.`);
    } catch (error) {
      showInfoAlert('Could not add this day', error instanceof Error ? error.message : String(error));
    } finally {
      setAddingDay(null);
    }
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      <View style={styles.formCard}>
        <Text style={styles.label}>Diet track</Text>
        <Text style={styles.helperText}>
          The same 42-day plan, three ways: every fruit, vegetable, and whole-grain choice stays the same, only the protein changes.
        </Text>
        <PopoverSelect
          selected={dietTrack}
          options={[...DIET_TRACK_OPTIONS]}
          onSelect={(value) => {
            dietTrackTouched.current = true;
            setDietTrack(value as DietTrack);
          }}
          placeholder="Diet track"
          tabColor={TAB_COLOR}
          width={220}
        />
      </View>
      <View style={styles.formCard}>
        <Text style={styles.label}>Set up the whole plan at once</Text>
        <Text style={styles.helperText}>
          Choose a start date and every day below fills in your Meals schedule automatically, breakfast, lunch, and dinner.
        </Text>
        <AppTextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
        />
        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 12 }, settingUp && styles.primaryButtonDisabled]}
          activeOpacity={0.85}
          disabled={settingUp}
          onPress={handleSetUpPlan}
        >
          <Text style={styles.primaryButtonText}>{settingUp ? 'Setting up…' : 'Set Up My 6-Week Plan'}</Text>
        </TouchableOpacity>

        {/* 2026-08-29: the "fix the times on meals already scheduled"
            action deliberately lives in Profile, in the Meal Timing card
            right below the times themselves, NOT here. Direct instruction
            after it was first built here: "Move it to Profile next to the
            meal times." Kept in exactly one place rather than duplicated,
            so there is never a question of which one is real. */}
        <Text style={[styles.helperText, { marginTop: 16 }]}>
          Setting the plan up again leaves days already on your schedule alone, so it will not change their
          times. To apply new meal times or a fasting window to a plan already scheduled, use Profile, under
          Meal Timing.
        </Text>
      </View>

      <View style={styles.sourceList}>
        {activePlan.map((planDay) => (
          <View key={planDay.day} style={styles.mealPlanDayRow}>
            <Text style={styles.rowTitle}>Day {planDay.day}</Text>
            <Text style={styles.mealPlanSlotText}>Breakfast: {mealPlanSlotLabel(planDay.breakfast)}</Text>
            <Text style={styles.mealPlanSlotText}>Lunch: {mealPlanSlotLabel(planDay.lunch)}</Text>
            <Text style={styles.mealPlanSlotText}>Dinner: {mealPlanSlotLabel(planDay.dinner)}</Text>
            <View style={styles.mealPlanDayFooter}>
              <AppTextInput
                style={[styles.input, styles.mealPlanDayDateInput]}
                placeholder="YYYY-MM-DD"
                value={dayDates[planDay.day] ?? ''}
                onChangeText={(text) => setDayDates((current) => ({ ...current, [planDay.day]: text }))}
              />
              <TouchableOpacity
                style={[styles.secondaryButton, addingDay === planDay.day && styles.primaryButtonDisabled]}
                activeOpacity={0.85}
                disabled={addingDay === planDay.day}
                onPress={() => handleAddDay(planDay)}
              >
                <Text style={styles.secondaryButtonText}>{addingDay === planDay.day ? 'Adding…' : 'Add to Schedule'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const SHOPPING_LIST_WINDOW_OPTIONS = [3, 4, 7];

// "receive a full shopping list for all ingredients to be purchased fresh
// every 3 to 4 days" -- calls lib/db.ts's own getUpcomingShoppingList,
// which resolves ANY already-planned meal in the chosen window, not just
// ones the Meal Plan lens itself created, so this stays useful even for
// someone who never touches that lens at all.
function ShoppingListLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [daysAhead, setDaysAhead] = useState(4);
  const [sections, setSections] = useState<ShoppingListSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback((window: number) => {
    setLoading(true);
    setErrorMessage('');
    getUpcomingShoppingList(window)
      .then(setSections)
      .catch((error) => setErrorMessage(`Could not load your shopping list: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(daysAhead);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daysAhead]),
  );

  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <View style={styles.pillRow}>
        {SHOPPING_LIST_WINDOW_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pill, daysAhead === option && styles.pillActive]}
            activeOpacity={0.85}
            onPress={() => setDaysAhead(option)}
          >
            <Text style={[styles.pillText, daysAhead === option && styles.pillTextActive]}>Next {option} days</Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : totalItems === 0 ? (
        <Text style={styles.emptyText}>
          Nothing scheduled in this window yet. Meals added from the Meal Plan lens (or scheduled any other way) will show up here.
        </Text>
      ) : (
        sections.map((section) => (
          <View key={section.category} style={styles.formCard}>
            <Text style={styles.label}>{section.category}</Text>
            {section.items.map((item) => (
              <Text key={`${item.foodName}|${item.unit}`} style={styles.mealPlanSlotText}>
                {item.foodName}: {roundForDisplay(item.quantity)} {item.unit}
              </Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function roundForDisplay(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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
      showInfoAlert('Almost there', 'Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
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
        <Text style={styles.emptyText}>Loading…</Text>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
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

          {rows.length === 0 ? (
            <Text style={styles.emptyText}>
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
        </>
      )}
    </ScrollView>
  );
}

type IngredientFormRow = { key: string; nutrientCode: string; amount: string; unit: string };

function blankIngredientRow(): IngredientFormRow {
  return { key: `ingredient_${Date.now()}_${Math.random().toString(36).slice(2)}`, nutrientCode: '', amount: '', unit: 'mg' };
}

type SupplementFormState = {
  editingId: string | null;
  name: string;
  unitsPerDay: string;
  servingUnitLabel: string;
  notes: string;
  ingredients: IngredientFormRow[];
};

function blankSupplementForm(): SupplementFormState {
  return { editingId: null, name: '', unitsPerDay: '1', servingUnitLabel: '', notes: '', ingredients: [blankIngredientRow()] };
}

// Only nutrients with one unambiguous, universally agreed IU->mass
// conversion accept IU today (see lib/supplementUnits.ts) -- offered here
// regardless of which nutrient is picked, with any that can't be
// normalized surfaced honestly via Insights' "couldn't be counted" note
// rather than hidden or guessed at.
const SUPPLEMENT_UNIT_OPTIONS: DropdownOption[] = [
  { label: 'mg', value: 'mg' },
  { label: 'mcg', value: 'mcg' },
  { label: 'g', value: 'g' },
  { label: 'IU', value: 'IU' },
];

// --- My Meds -----------------------------------------------------------
//
// A real, cited registry over the same underlying `treatments` table
// Supplements and Prescriptions already use -- plus, as of 2026-08-08, a
// third real treatment_type ('otc', see createOtcTreatment in lib/db.ts).
// Direct request: "This is a place to document all prescription,
// nonprescription over the counter drugs, and macro and micronutrients
// regimen... exact ingredients of every supplement... true interaction
// logic built in."
//
// Deliberate scope boundary, stated here and in this lens's own Info
// content above: reminder times and repeat schedules for prescriptions and
// supplements still live on those two lenses, unchanged -- adding an item
// here doesn't also set up a dose reminder for it. Building a real,
// working third parallel reminder system for OTC in the same pass as
// everything else below would have meant either rushing it or blocking
// everything on it; tracking on/off (which is what actually feeds
// interaction checking and nutrient totals) works for all three types
// today, reminders are a real, separate fast-follow.
//
// The "pick from a researched list, or enter it yourself" flow for
// prescriptions/OTC (COMMON_MED_OPTIONS below) is intentionally NOT a live
// internet lookup for medications this app doesn't already have -- that's
// a real, separate product/architecture decision (which data source, what
// it costs, what it means for this app's own local-first privacy stance)
// that hasn't been made yet, not something to silently wire up. Manual
// entry is the honest, working fallback today.
type MyMedsCategory = 'supplement' | 'prescription' | 'otc';

type MedIngredientRow = { key: string; nutrientCode: string; supplementForm: string; amount: string; unit: string };

function blankMedIngredientRow(): MedIngredientRow {
  return { key: `ingredient_${Date.now()}_${Math.random().toString(36).slice(2)}`, nutrientCode: '', supplementForm: '', amount: '', unit: 'mg' };
}

type MyMedsSupplementFormState = {
  editingId: string | null;
  name: string;
  unitsPerDay: string;
  servingUnitLabel: string;
  notes: string;
  ingredients: MedIngredientRow[];
};

function blankMyMedsSupplementForm(): MyMedsSupplementFormState {
  return { editingId: null, name: '', unitsPerDay: '1', servingUnitLabel: '', notes: '', ingredients: [blankMedIngredientRow()] };
}

type MedFormState = {
  editingId: string | null;
  category: 'prescription' | 'otc';
  commonMedId: string;
  manualEntry: boolean;
  name: string;
  genericName: string;
  doseAmount: string;
  doseUnit: string;
  frequency: string;
  notes: string;
};

function blankMedForm(category: 'prescription' | 'otc'): MedFormState {
  return {
    editingId: null,
    category,
    commonMedId: '',
    manualEntry: false,
    name: '',
    genericName: '',
    doseAmount: '',
    doseUnit: '',
    frequency: '',
    notes: '',
  };
}

const EVIDENCE_TIER_LABEL: Record<string, string> = {
  established: 'Established',
  emerging: 'Emerging evidence',
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
};

function MyMedsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [ingredientsByTreatment, setIngredientsByTreatment] = useState<Record<string, TreatmentNutrientRecord[]>>({});
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [referenceOnlyRules, setReferenceOnlyRules] = useState<ReferenceOnlyRule[]>([]);
  const [nutrients, setNutrients] = useState<TrackedNutrient[]>([]);
  const [commonMedications, setCommonMedications] = useState<CommonMedication[]>([]);
  const [foodEntries, setFoodEntries] = useState<NutrientGapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [addMode, setAddMode] = useState<MyMedsCategory | null>(null);
  const [supplementForm, setSupplementForm] = useState<MyMedsSupplementFormState>(blankMyMedsSupplementForm());
  const [medForm, setMedForm] = useState<MedFormState>(blankMedForm('prescription'));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  // Lazily loaded, cached by nutrient code -- there's no reason to fetch
  // supplement_forms/nutrient_timing for every nutrient this app tracks up
  // front when a person will only ever pick a handful.
  const [formsByNutrient, setFormsByNutrient] = useState<Record<string, SupplementForm[]>>({});
  const [timingByNutrient, setTimingByNutrient] = useState<Record<string, NutrientTiming | null>>({});

  const load = useCallback(() => {
    setLoading(true);
    ensureScheduleSeriesGenerated()
      .then(() =>
        Promise.all([
          listAllActiveTreatments(),
          listTrackedNutrients(),
          listCommonMedications(),
          getDailyNutrientAnalysis(todayDateString()),
          evaluateInteractionRules(todayDateString()),
        ]),
      )
      .then(async ([loadedTreatments, loadedNutrients, loadedMeds, dailyAnalysis, evaluation]) => {
        setTreatments(loadedTreatments);
        setNutrients(loadedNutrients);
        setCommonMedications(loadedMeds);
        setFoodEntries(dailyAnalysis.entries);
        setInteractionWarnings(evaluation.warnings);
        setReferenceOnlyRules(evaluation.referenceOnly);
        const supplementTreatments = loadedTreatments.filter((treatment) => treatment.treatmentType === 'supplement');
        const entries = await Promise.all(
          supplementTreatments.map(async (treatment) => [treatment.id, await getTreatmentNutrients(treatment.id)] as const),
        );
        setIngredientsByTreatment(Object.fromEntries(entries));
      })
      .catch((error) => {
        setErrorMessage(`Could not load My Meds: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Notice this DOESN'T include activeOnly=false the way Supplements/
  // Prescriptions do (those show every treatment ever added so re-enabling
  // one doesn't mean re-entering it) -- My Meds is deliberately the
  // "what am I taking right now" view; a paused/stopped item is still
  // fully preserved in the database and still editable/re-enable-able from
  // its own original Supplements/Prescriptions lens.

  function nutrientDisplayName(code: string): string {
    return nutrients.find((nutrient) => nutrient.code === code)?.displayName ?? code;
  }

  async function ensureNutrientDataLoaded(nutrientCode: string) {
    if (!nutrientCode) return;
    if (!(nutrientCode in formsByNutrient)) {
      const forms = await getSupplementForms(nutrientCode);
      setFormsByNutrient((current) => ({ ...current, [nutrientCode]: forms }));
    }
    if (!(nutrientCode in timingByNutrient)) {
      const timing = await getNutrientTiming(nutrientCode);
      setTimingByNutrient((current) => ({ ...current, [nutrientCode]: timing }));
    }
  }

  function foodStatusFor(nutrientCode: string): NutrientGapEntry | null {
    return foodEntries.find((entry) => entry.nutrientCode === nutrientCode) ?? null;
  }

  // --- Add flow: category picker ---
  function openAddSupplement() {
    setSupplementForm(blankMyMedsSupplementForm());
    setAddMode('supplement');
  }
  function openAddMed(category: 'prescription' | 'otc') {
    setMedForm(blankMedForm(category));
    setAddMode(category);
  }
  function closeAddForm() {
    setAddMode(null);
    setSupplementForm(blankMyMedsSupplementForm());
    setMedForm(blankMedForm('prescription'));
  }

  // --- Supplement ingredient rows ---
  function addIngredientRow() {
    setSupplementForm((current) => ({ ...current, ingredients: [...current.ingredients, blankMedIngredientRow()] }));
  }
  function removeIngredientRow(key: string) {
    setSupplementForm((current) => ({ ...current, ingredients: current.ingredients.filter((row) => row.key !== key) }));
  }
  function updateIngredientRow(key: string, update: Partial<MedIngredientRow>) {
    setSupplementForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((row) => (row.key === key ? { ...row, ...update } : row)),
    }));
  }

  async function handleSaveSupplement() {
    if (!supplementForm.name.trim()) {
      showInfoAlert('Almost there', "Enter the supplement's name.");
      return;
    }
    const unitsPerDay = Number(supplementForm.unitsPerDay);
    if (!unitsPerDay || unitsPerDay <= 0) {
      showInfoAlert('Almost there', 'Enter how many are taken per day (e.g. 1 or 2).');
      return;
    }
    if (!supplementForm.servingUnitLabel.trim()) {
      showInfoAlert('Almost there', 'Enter what one dose is called (e.g. capsule, tablet, scoop, powder).');
      return;
    }
    const validIngredients = supplementForm.ingredients.filter((row) => row.nutrientCode && row.amount);
    if (validIngredients.length === 0) {
      showInfoAlert('Almost there', 'Add at least one ingredient with an amount.');
      return;
    }

    const ingredients: SupplementIngredientInput[] = validIngredients.map((row) => ({
      nutrientCode: row.nutrientCode,
      supplementForm: row.supplementForm || undefined,
      amountPerUnit: Number(row.amount),
      unit: row.unit,
    }));

    try {
      if (supplementForm.editingId) {
        await updateSupplementTreatment(supplementForm.editingId, {
          name: supplementForm.name,
          unitsPerDay,
          servingUnitLabel: supplementForm.servingUnitLabel,
          ingredients,
          notes: supplementForm.notes,
        });
      } else {
        await createSupplementTreatment({
          name: supplementForm.name,
          unitsPerDay,
          servingUnitLabel: supplementForm.servingUnitLabel,
          ingredients,
          notes: supplementForm.notes,
        });
      }
      closeAddForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  // --- Prescription / OTC form ---
  function selectCommonMed(med: CommonMedication) {
    setMedForm((current) => ({
      ...current,
      commonMedId: med.id,
      manualEntry: false,
      name: med.genericName,
      genericName: med.id,
    }));
  }

  async function handleSaveMed() {
    if (!medForm.name.trim()) {
      showInfoAlert('Almost there', 'Enter a name for this medication.');
      return;
    }
    const input = {
      name: medForm.name,
      genericName: medForm.genericName || undefined,
      doseAmount: medForm.doseAmount ? Number(medForm.doseAmount) : undefined,
      doseUnit: medForm.doseUnit || undefined,
      frequency: medForm.frequency || undefined,
      notes: medForm.notes || undefined,
    };
    try {
      if (medForm.editingId) {
        if (medForm.category === 'prescription') {
          await updatePrescriptionTreatment(medForm.editingId, input);
        } else {
          await updateOtcTreatment(medForm.editingId, input);
        }
      } else if (medForm.category === 'prescription') {
        await createPrescriptionTreatment(input);
      } else {
        await createOtcTreatment(input);
      }
      closeAddForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemove(treatment: TreatmentRecord) {
    const ok = await confirmSheet({
      title: 'Remove this item?',
      message: `"${treatment.name}" will be permanently deleted from My Meds.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await deleteTreatment(treatment.id);
    load();
  }

  async function handleToggleActive(treatment: TreatmentRecord) {
    await setTreatmentActive(treatment.id, !treatment.active);
    load();
  }

  // useMemo, not a plain inline .map() -- PopoverSelect (unlike the old
  // Dropdown) is memoized against referentially-stable `options`, so a
  // fresh array on every render (e.g. every Name/Notes keystroke, which
  // re-renders this whole lens) would otherwise force these two pickers'
  // own popovers to rebuild for no real reason.
  const nutrientOptions: DropdownOption[] = useMemo(
    () => nutrients.map((nutrient) => ({ label: nutrient.displayName, value: nutrient.code })),
    [nutrients],
  );
  const commonMedOptionsForCategory: DropdownOption[] = useMemo(
    () =>
      commonMedications
        .filter((med) => med.treatmentType === medForm.category)
        .map((med) => ({
          label: med.commonBrandNames ? `${med.genericName} (${med.commonBrandNames})` : med.genericName,
          value: med.id,
        })),
    [commonMedications, medForm.category],
  );
  const selectedCommonMed = commonMedications.find((med) => med.id === medForm.commonMedId) ?? null;

  function renderNutrientResearchCard(nutrientCode: string, chosenForm: string) {
    const forms = formsByNutrient[nutrientCode] ?? [];
    const timing = timingByNutrient[nutrientCode];
    const foodStatus = foodStatusFor(nutrientCode);
    const formDetail = forms.find((form) => form.formName === chosenForm);

    if (!nutrientCode) return null;

    return (
      <View style={styles.myMedsResearchCard}>
        {formDetail ? (
          <>
            <Text style={styles.myMedsResearchLabel}>
              {formDetail.formName} · {EVIDENCE_TIER_LABEL[formDetail.evidenceStrength] ?? formDetail.evidenceStrength}
            </Text>
            <Text style={styles.helperText}>{formDetail.absorptionNote}</Text>
            {formDetail.giToleranceNote ? <Text style={styles.helperText}>{formDetail.giToleranceNote}</Text> : null}
            {formDetail.notes ? <Text style={styles.helperText}>{formDetail.notes}</Text> : null}
          </>
        ) : null}
        {timing ? (
          <>
            <Text style={styles.myMedsResearchLabel}>When to take it</Text>
            <Text style={styles.helperText}>{timing.bestTaken}</Text>
            {timing.avoidWith ? <Text style={styles.helperText}>Avoid taking with: {timing.avoidWith}</Text> : null}
            {timing.pairsWellWith ? <Text style={styles.helperText}>Pairs well with: {timing.pairsWellWith}</Text> : null}
          </>
        ) : null}
        <Text style={styles.myMedsResearchLabel}>From food today</Text>
        {foodStatus ? (
          <Text style={styles.helperText}>
            You&apos;re already getting about {Math.round(foodStatus.percentOfTarget)}% of today&apos;s {foodStatus.displayName} target
            from food ({Math.round(foodStatus.fromFood)}{foodStatus.unit}).
          </Text>
        ) : (
          <Text style={styles.helperText}>This app doesn&apos;t track {nutrientDisplayName(nutrientCode)} content in food yet.</Text>
        )}
      </View>
    );
  }

  function renderTreatmentGroup(title: string, groupTreatments: TreatmentRecord[]) {
    if (groupTreatments.length === 0) return null;
    return (
      <View style={styles.myMedsGroup}>
        <Text style={styles.doseSectionLabel}>{title}</Text>
        {groupTreatments.map((treatment) => {
          const isExpanded = expandedId === treatment.id;
          const ingredients = ingredientsByTreatment[treatment.id] ?? [];
          const matchedMed = treatment.genericName ? commonMedications.find((med) => med.id === treatment.genericName) : null;

          return (
            <View key={treatment.id} style={styles.row}>
              <TouchableOpacity style={styles.rowTextCol} onPress={() => setExpandedId(isExpanded ? null : treatment.id)}>
                <Text style={styles.rowTitle}>{treatment.name}</Text>
                <Text style={styles.rowMeta}>
                  {treatment.treatmentType === 'supplement'
                    ? `${treatment.unitsPerDay} ${treatment.servingUnitLabel}${Number(treatment.unitsPerDay) === 1 ? '' : 's'}/day`
                    : [treatment.doseAmount ? `${treatment.doseAmount}${treatment.doseUnit ?? ''}` : null, treatment.frequency]
                        .filter(Boolean)
                        .join(', ') || 'No dose details entered'}
                  {treatment.active ? '' : ' · Not tracking'}
                </Text>
                {ingredients.length > 0 ? (
                  <Text style={styles.rowMeta}>
                    {ingredients
                      .map(
                        (ingredient) =>
                          `${nutrientDisplayName(ingredient.nutrientCode)}${ingredient.supplementForm ? ` (${ingredient.supplementForm})` : ''}`,
                      )
                      .join(', ')}
                  </Text>
                ) : null}
              </TouchableOpacity>

              <View style={styles.supplementRowActions}>
                <TouchableOpacity onPress={() => handleToggleActive(treatment)}>
                  <Text style={treatment.active ? styles.actionTextPrimary : styles.actionText}>
                    {treatment.active ? 'Tracking' : 'Not tracking'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : treatment.id)}>
                  <Text style={styles.actionText}>{isExpanded ? 'Hide details' : 'Details'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(treatment)}>
                  <Text style={styles.actionTextRemove}>Remove</Text>
                </TouchableOpacity>
              </View>

              {isExpanded ? (
                <View style={styles.myMedsDetail}>
                  {treatment.treatmentType === 'supplement'
                    ? ingredients.map((ingredient) => (
                        <View key={ingredient.id}>
                          <Text style={styles.myMedsResearchLabel}>
                            {nutrientDisplayName(ingredient.nutrientCode)}: {ingredient.amountPerUnit}
                            {ingredient.unit}/dose
                          </Text>
                          {renderNutrientResearchCard(ingredient.nutrientCode, ingredient.supplementForm ?? '')}
                        </View>
                      ))
                    : matchedMed ? (
                        <>
                          <Text style={styles.myMedsResearchLabel}>{matchedMed.drugClass}</Text>
                          <Text style={styles.helperText}>{matchedMed.commonUse}</Text>
                          {matchedMed.thyroidRelevantNotes ? (
                            <Text style={styles.helperText}>{matchedMed.thyroidRelevantNotes}</Text>
                          ) : null}
                          {matchedMed.timingGuidance ? (
                            <>
                              <Text style={styles.myMedsResearchLabel}>Timing</Text>
                              <Text style={styles.helperText}>{matchedMed.timingGuidance}</Text>
                            </>
                          ) : null}
                          {matchedMed.keyInteractions ? (
                            <>
                              <Text style={styles.myMedsResearchLabel}>Key interactions</Text>
                              <Text style={styles.helperText}>{matchedMed.keyInteractions}</Text>
                            </>
                          ) : null}
                          {matchedMed.commonSideEffects ? (
                            <>
                              <Text style={styles.myMedsResearchLabel}>Common side effects</Text>
                              <Text style={styles.helperText}>{matchedMed.commonSideEffects}</Text>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <Text style={styles.helperText}>
                          Not matched to this app&apos;s researched medication list; entered manually.
                        </Text>
                      )}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      {confirmSheetElement}
      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <>
          {addMode === null ? (
            <View style={styles.myMedsAddRow}>
              <TouchableOpacity style={styles.addButton} onPress={() => openAddMed('prescription')}>
                <Text style={styles.addButtonText}>+ Prescription</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => openAddMed('otc')}>
                <Text style={styles.addButtonText}>+ OTC drug</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={openAddSupplement}>
                <Text style={styles.addButtonText}>+ Supplement</Text>
              </TouchableOpacity>
            </View>
          ) : addMode === 'supplement' ? (
            <View style={styles.formCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Name</Text>
                <VoiceInputButton
                  onResult={(text) => setSupplementForm((current) => ({ ...current, name: text }))}
                  color={TAB_COLOR}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Daily Multivitamin, or just Magnesium"
                value={supplementForm.name}
                onChangeText={(text) => setSupplementForm((current) => ({ ...current, name: text }))}
              />

              <Text style={styles.label}>Dose</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  keyboardType="number-pad"
                  value={supplementForm.unitsPerDay}
                  onChangeText={(text) => setSupplementForm((current) => ({ ...current, unitsPerDay: text }))}
                />
                <AppTextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="capsule, tablet, scoop, powder…"
                  value={supplementForm.servingUnitLabel}
                  onChangeText={(text) => setSupplementForm((current) => ({ ...current, servingUnitLabel: text }))}
                />
                <Text style={styles.timeSeparator}>/ day</Text>
              </View>

              <Text style={styles.label}>Ingredients (per single dose)</Text>
              {supplementForm.ingredients.map((row) => {
                const forms = formsByNutrient[row.nutrientCode] ?? [];
                const formOptions: DropdownOption[] = forms.map((form) => ({ label: form.formName, value: form.formName }));
                return (
                  <View key={row.key}>
                    <View style={styles.ingredientRow}>
                      <View style={styles.ingredientNutrientCol}>
                        {/* colors.tabFood, not this lens's own TAB_COLOR (tabSchedules) --
                            2026-08-08, explicitly requested to match "the same color as
                            those on the Side Dish Builder," which passes this same
                            constant as its own tabColor. All four PopoverSelect fields
                            in this lens share it, for one consistent picker color. */}
                        <PopoverSelect
                          selected={row.nutrientCode || null}
                          options={nutrientOptions}
                          onSelect={(value) => {
                            updateIngredientRow(row.key, { nutrientCode: value, supplementForm: '' });
                            ensureNutrientDataLoaded(value);
                          }}
                          placeholder="Nutrient"
                          tabColor={colors.tabFood}
                          width={220}
                          searchable
                          searchPlaceholder="Search nutrients…"
                        />
                      </View>
                      <AppTextInput
                        style={[styles.input, styles.ingredientAmountInput]}
                        placeholder="Amount"
                        keyboardType="decimal-pad"
                        value={row.amount}
                        onChangeText={(text) => updateIngredientRow(row.key, { amount: text })}
                      />
                      <View style={styles.ingredientUnitCol}>
                        <PopoverSelect
                          selected={row.unit || null}
                          options={SUPPLEMENT_UNIT_OPTIONS}
                          onSelect={(value) => updateIngredientRow(row.key, { unit: value })}
                          tabColor={colors.tabFood}
                          minWidth={64}
                        />
                      </View>
                      <TouchableOpacity onPress={() => removeIngredientRow(row.key)} style={styles.ingredientRemove}>
                        <Text style={styles.actionTextRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {row.nutrientCode && formOptions.length > 0 ? (
                      <View style={styles.ingredientFormRow}>
                        <PopoverSelect
                          selected={row.supplementForm || null}
                          options={formOptions}
                          onSelect={(value) => updateIngredientRow(row.key, { supplementForm: value })}
                          placeholder="Which form? (optional, but changes absorption)"
                          tabColor={colors.tabFood}
                          width={240}
                        />
                      </View>
                    ) : null}
                    {row.nutrientCode ? renderNutrientResearchCard(row.nutrientCode, row.supplementForm) : null}
                  </View>
                );
              })}
              <TouchableOpacity onPress={addIngredientRow} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>+ Add ingredient</Text>
              </TouchableOpacity>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton
                  onResult={(text) => setSupplementForm((current) => ({ ...current, notes: text }))}
                  color={TAB_COLOR}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. take with food"
                value={supplementForm.notes}
                onChangeText={(text) => setSupplementForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeAddForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveSupplement}>
                  <Text style={styles.primaryButtonText}>Add supplement</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.label}>{medForm.category === 'prescription' ? 'Prescription' : 'OTC drug'}</Text>

              {!medForm.manualEntry ? (
                <>
                  <PopoverSelect
                    selected={medForm.commonMedId || null}
                    options={commonMedOptionsForCategory}
                    onSelect={(value) => {
                      const med = commonMedications.find((candidate) => candidate.id === value);
                      if (med) selectCommonMed(med);
                    }}
                    placeholder="Search this app's researched list…"
                    tabColor={colors.tabFood}
                    width={260}
                    searchable
                    searchPlaceholder="e.g. levothyroxine, metformin, ibuprofen…"
                  />
                  <TouchableOpacity onPress={() => setMedForm((current) => ({ ...current, manualEntry: true }))}>
                    <Text style={styles.actionTextPrimary}>Not in the list? Enter it myself</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => setMedForm((current) => ({ ...current, manualEntry: false, commonMedId: '' }))}>
                  <Text style={styles.actionTextPrimary}>Search the researched list instead</Text>
                </TouchableOpacity>
              )}

              {selectedCommonMed ? (
                <View style={styles.myMedsResearchCard}>
                  <Text style={styles.myMedsResearchLabel}>
                    {selectedCommonMed.drugClass} · {EVIDENCE_TIER_LABEL[selectedCommonMed.evidenceStrength] ?? selectedCommonMed.evidenceStrength}
                  </Text>
                  <Text style={styles.helperText}>{selectedCommonMed.commonUse}</Text>
                  {selectedCommonMed.thyroidRelevantNotes ? (
                    <Text style={styles.helperText}>{selectedCommonMed.thyroidRelevantNotes}</Text>
                  ) : null}
                  {selectedCommonMed.timingGuidance ? (
                    <Text style={styles.helperText}>Timing: {selectedCommonMed.timingGuidance}</Text>
                  ) : null}
                  {selectedCommonMed.keyInteractions ? (
                    <Text style={styles.helperText}>Key interactions: {selectedCommonMed.keyInteractions}</Text>
                  ) : null}
                </View>
              ) : medForm.manualEntry ? (
                <Text style={styles.helperText}>
                  Not in this app&apos;s researched list yet, but you can still track it with the details you know. Looking this up
                  online automatically is a planned future capability, not built yet.
                </Text>
              ) : null}

              <View style={styles.labelRow}>
                <Text style={styles.label}>Name</Text>
                <VoiceInputButton onResult={(text) => setMedForm((current) => ({ ...current, name: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Synthroid 75mcg"
                value={medForm.name}
                onChangeText={(text) => setMedForm((current) => ({ ...current, name: text }))}
              />

              {medForm.manualEntry ? (
                <>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Generic name (optional, helps interaction checking)</Text>
                    <VoiceInputButton
                      onResult={(text) => setMedForm((current) => ({ ...current, genericName: text }))}
                      color={TAB_COLOR}
                    />
                  </View>
                  <AppTextInput
                    style={styles.input}
                    placeholder="e.g. levothyroxine"
                    value={medForm.genericName}
                    onChangeText={(text) => setMedForm((current) => ({ ...current, genericName: text }))}
                  />
                </>
              ) : null}

              <Text style={styles.label}>Dose</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="75"
                  keyboardType="decimal-pad"
                  value={medForm.doseAmount}
                  onChangeText={(text) => setMedForm((current) => ({ ...current, doseAmount: text }))}
                />
                <AppTextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="mcg, mg…"
                  value={medForm.doseUnit}
                  onChangeText={(text) => setMedForm((current) => ({ ...current, doseUnit: text }))}
                />
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Frequency (optional)</Text>
                <VoiceInputButton
                  onResult={(text) => setMedForm((current) => ({ ...current, frequency: text }))}
                  color={TAB_COLOR}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. once daily"
                value={medForm.frequency}
                onChangeText={(text) => setMedForm((current) => ({ ...current, frequency: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton onResult={(text) => setMedForm((current) => ({ ...current, notes: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. prescribed by Dr. …"
                value={medForm.notes}
                onChangeText={(text) => setMedForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeAddForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveMed}>
                  <Text style={styles.primaryButtonText}>{medForm.category === 'prescription' ? 'Add prescription' : 'Add OTC drug'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {interactionWarnings.length > 0 ? (
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Things to check</Text>
              {interactionWarnings.map((warning, index) => (
                <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                  <Text style={styles.interactionTitle}>{warning.title}</Text>
                  <Text style={styles.interactionMessage}>{warning.message}</Text>
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                  <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
          ) : null}

          {referenceOnlyRules.length > 0 ? (
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Worth knowing (reference only, not personalized)</Text>
              {referenceOnlyRules.map((rule) => (
                <View key={rule.ruleId} style={[styles.interactionCard, styles.interactionCardReference]}>
                  <Text style={styles.interactionTitle}>{rule.title}</Text>
                  <Text style={styles.interactionMessage}>{rule.guidance}</Text>
                  <Text style={styles.interactionCitation}>{rule.citation}</Text>
                  <WhyExplainer title={rule.title} mechanism={rule.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
          ) : null}

          {treatments.length === 0 ? (
            <Text style={styles.emptyText}>Nothing tracked yet. Add a prescription, OTC drug, or supplement above.</Text>
          ) : (
            <>
              {renderTreatmentGroup('Prescriptions', treatments.filter((treatment) => treatment.treatmentType === 'prescription'))}
              {renderTreatmentGroup('OTC drugs', treatments.filter((treatment) => treatment.treatmentType === 'otc'))}
              {renderTreatmentGroup('Supplements', treatments.filter((treatment) => treatment.treatmentType === 'supplement'))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

// The Supplements lens -- a list of every supplement ever added (active or
// not, so turning one back on later doesn't mean re-entering its whole
// ingredient list), each independently switchable between "Tracking" and
// "Not tracking." That single toggle is deliberately the entire mechanism
// for "I stopped taking this," "I cycle on and off this," and "I'm only
// taking this temporarily" -- all three are just "is this counted toward
// today's totals right now," decided by the person in the moment, not a
// date-range schedule to configure ahead of time.
function SupplementsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [ingredientsByTreatment, setIngredientsByTreatment] = useState<Record<string, TreatmentNutrientRecord[]>>({});
  const [dosesByTreatment, setDosesByTreatment] = useState<Record<string, ScheduleItemRecord[]>>({});
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [referenceOnlyRules, setReferenceOnlyRules] = useState<ReferenceOnlyRule[]>([]);
  const [nutrients, setNutrients] = useState<TrackedNutrient[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SupplementFormState>(blankSupplementForm());
  const [doseFormTreatmentId, setDoseFormTreatmentId] = useState<string | null>(null);
  const [doseFormTime, setDoseFormTime] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [doseFormRepeat, setDoseFormRepeat] = useState<RepeatConfig>({ type: 'none' });
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    ensureScheduleSeriesGenerated()
      .then(() => Promise.all([listSupplementTreatments(false), listTrackedNutrients()]))
      .then(async ([loadedTreatments, loadedNutrients]) => {
        setTreatments(loadedTreatments);
        setNutrients(loadedNutrients);
        const today = todayDateString();
        const entries = await Promise.all(
          loadedTreatments.map(async (treatment) => [treatment.id, await getTreatmentNutrients(treatment.id)] as const),
        );
        setIngredientsByTreatment(Object.fromEntries(entries));
        const doseEntries = await Promise.all(
          loadedTreatments.map(
            async (treatment) => [treatment.id, await listScheduledSupplementDosesForTreatment(treatment.id, today)] as const,
          ),
        );
        setDosesByTreatment(Object.fromEntries(doseEntries));
        const evaluation = await evaluateInteractionRules(today);
        setInteractionWarnings(evaluation.warnings);
        setReferenceOnlyRules(evaluation.referenceOnly);
      })
      .catch((error) => {
        setErrorMessage(`Could not load supplements: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function nutrientDisplayName(code: string): string {
    return nutrients.find((nutrient) => nutrient.code === code)?.displayName ?? code;
  }

  function openAddForm() {
    setForm(blankSupplementForm());
    setShowForm(true);
  }

  function openEditForm(treatment: TreatmentRecord) {
    const ingredients = ingredientsByTreatment[treatment.id] ?? [];
    setForm({
      editingId: treatment.id,
      name: treatment.name,
      unitsPerDay: String(treatment.unitsPerDay ?? 1),
      servingUnitLabel: treatment.servingUnitLabel ?? '',
      notes: treatment.notes ?? '',
      ingredients: ingredients.length
        ? ingredients.map((ingredient) => ({
            key: ingredient.id,
            nutrientCode: ingredient.nutrientCode,
            amount: String(ingredient.amountPerUnit),
            unit: ingredient.unit,
          }))
        : [blankIngredientRow()],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(blankSupplementForm());
  }

  function addIngredientRow() {
    setForm((current) => ({ ...current, ingredients: [...current.ingredients, blankIngredientRow()] }));
  }

  function removeIngredientRow(key: string) {
    setForm((current) => ({ ...current, ingredients: current.ingredients.filter((row) => row.key !== key) }));
  }

  function updateIngredientRow(key: string, update: Partial<IngredientFormRow>) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((row) => (row.key === key ? { ...row, ...update } : row)),
    }));
  }

  async function handleSaveForm() {
    if (!form.name.trim()) {
      showInfoAlert('Almost there', "Enter the supplement's name.");
      return;
    }
    const unitsPerDay = Number(form.unitsPerDay);
    if (!unitsPerDay || unitsPerDay <= 0) {
      showInfoAlert('Almost there', 'Enter how many are taken per day (e.g. 1 or 2).');
      return;
    }
    if (!form.servingUnitLabel.trim()) {
      showInfoAlert('Almost there', 'Enter what one dose is called (e.g. capsule, tablet, scoop).');
      return;
    }
    const validIngredients = form.ingredients.filter((row) => row.nutrientCode && row.amount);
    if (validIngredients.length === 0) {
      showInfoAlert('Almost there', 'Add at least one ingredient with an amount.');
      return;
    }

    const ingredients: SupplementIngredientInput[] = validIngredients.map((row) => ({
      nutrientCode: row.nutrientCode,
      amountPerUnit: Number(row.amount),
      unit: row.unit,
    }));

    try {
      if (form.editingId) {
        await updateSupplementTreatment(form.editingId, {
          name: form.name,
          unitsPerDay,
          servingUnitLabel: form.servingUnitLabel,
          ingredients,
          notes: form.notes,
        });
      } else {
        await createSupplementTreatment({
          name: form.name,
          unitsPerDay,
          servingUnitLabel: form.servingUnitLabel,
          ingredients,
          notes: form.notes,
        });
      }
      closeForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemove(treatment: TreatmentRecord) {
    const ok = await confirmSheet({
      title: 'Remove this supplement?',
      message: `"${treatment.name}" and its ingredient list will be permanently deleted.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await deleteTreatment(treatment.id);
    load();
  }

  async function handleToggleActive(treatment: TreatmentRecord) {
    await setTreatmentActive(treatment.id, !treatment.active);
    load();
  }

  function openDoseForm(treatmentId: string) {
    setDoseFormTreatmentId(treatmentId);
    setDoseFormTime({ hour: '', minute: '', ampm: '' });
    setDoseFormRepeat({ type: 'none' });
  }

  function closeDoseForm() {
    setDoseFormTreatmentId(null);
  }

  async function handleSaveDose(treatment: TreatmentRecord) {
    const time24 = buildTime24(doseFormTime.hour, doseFormTime.minute, doseFormTime.ampm);
    if (!time24) {
      showInfoAlert('Almost there', 'Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
      return;
    }
    const repeatError = validateRepeat(doseFormRepeat);
    if (repeatError) {
      showInfoAlert('Almost there', repeatError);
      return;
    }
    try {
      await scheduleSupplementDose({
        treatmentId: treatment.id,
        title: treatment.name,
        scheduledFor: `${todayDateString()}T${time24}`,
        repeat: doseFormRepeat,
      });
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

  const nutrientOptions: DropdownOption[] = nutrients.map((nutrient) => ({ label: nutrient.displayName, value: nutrient.code }));

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      {confirmSheetElement}
      <AppActionSheet
        visible={removePrompt !== null}
        onClose={() => setRemovePrompt(null)}
        title={removePrompt?.title}
        message={removePrompt?.message}
        actions={removePrompt?.actions ?? []}
      />
      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <>
          {!showForm ? (
            <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
              <Text style={styles.addButtonText}>+ Add a supplement</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Name</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, name: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Daily Multivitamin"
                value={form.name}
                onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
              />

              <Text style={styles.label}>Dose</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  keyboardType="number-pad"
                  value={form.unitsPerDay}
                  onChangeText={(text) => setForm((current) => ({ ...current, unitsPerDay: text }))}
                />
                <AppTextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="capsule, tablet, scoop…"
                  value={form.servingUnitLabel}
                  onChangeText={(text) => setForm((current) => ({ ...current, servingUnitLabel: text }))}
                />
                <Text style={styles.timeSeparator}>/ day</Text>
              </View>

              <Text style={styles.label}>Ingredients (per single dose)</Text>
              {form.ingredients.map((row) => (
                <View key={row.key} style={styles.ingredientRow}>
                  <View style={styles.ingredientNutrientCol}>
                    <Dropdown
                      value={row.nutrientCode}
                      options={nutrientOptions}
                      onChange={(value) => updateIngredientRow(row.key, { nutrientCode: value })}
                      placeholder="Nutrient"
                      searchable
                      searchPlaceholder="Search nutrients…"
                    />
                  </View>
                  <AppTextInput
                    style={[styles.input, styles.ingredientAmountInput]}
                    placeholder="Amount"
                    keyboardType="decimal-pad"
                    value={row.amount}
                    onChangeText={(text) => updateIngredientRow(row.key, { amount: text })}
                  />
                  <View style={styles.ingredientUnitCol}>
                    <Dropdown
                      value={row.unit}
                      options={SUPPLEMENT_UNIT_OPTIONS}
                      onChange={(value) => updateIngredientRow(row.key, { unit: value })}
                      compact
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeIngredientRow(row.key)} style={styles.ingredientRemove}>
                    <Text style={styles.actionTextRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={addIngredientRow} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>+ Add ingredient</Text>
              </TouchableOpacity>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, notes: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. take with food"
                value={form.notes}
                onChangeText={(text) => setForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveForm}>
                  <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Add supplement'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {interactionWarnings.length > 0 ? (
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Things to check</Text>
              {interactionWarnings.map((warning, index) => (
                <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                  <Text style={styles.interactionTitle}>{warning.title}</Text>
                  <Text style={styles.interactionMessage}>{warning.message}</Text>
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                  <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
          ) : null}

          {referenceOnlyRules.length > 0 ? (
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Worth knowing (reference only, not personalized)</Text>
              <Text style={styles.helperText}>
                This needs information this app doesn't track yet (an upcoming lab draw), so it can't be checked
                against your actual schedule. Shown as cited background information only.
              </Text>
              {referenceOnlyRules.map((rule) => (
                <View key={rule.ruleId} style={[styles.interactionCard, styles.interactionCardReference]}>
                  <Text style={styles.interactionTitle}>{rule.title}</Text>
                  <Text style={styles.interactionMessage}>{rule.guidance}</Text>
                  <Text style={styles.interactionCitation}>{rule.citation}</Text>
                  <WhyExplainer title={rule.title} mechanism={rule.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
          ) : null}

          {treatments.length === 0 ? (
            <Text style={styles.emptyText}>No supplements added yet.</Text>
          ) : (
            <View style={styles.table}>
              {treatments.map((treatment) => {
                const ingredients = ingredientsByTreatment[treatment.id] ?? [];
                const doses = dosesByTreatment[treatment.id] ?? [];
                return (
                  <View key={treatment.id} style={styles.row}>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowTitle}>{treatment.name}</Text>
                      <Text style={styles.rowMeta}>
                        {treatment.unitsPerDay} {treatment.servingUnitLabel}
                        {Number(treatment.unitsPerDay) === 1 ? '' : 's'}/day
                        {treatment.active ? '' : ' · Not tracking'}
                      </Text>
                      {ingredients.length > 0 ? (
                        <Text style={styles.rowMeta}>
                          {ingredients
                            .map((ingredient) => `${nutrientDisplayName(ingredient.nutrientCode)} (${ingredient.amountPerUnit}${ingredient.unit})`)
                            .join(', ')}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.supplementRowActions}>
                      <TouchableOpacity onPress={() => handleToggleActive(treatment)}>
                        <Text style={treatment.active ? styles.actionTextPrimary : styles.actionText}>
                          {treatment.active ? 'Tracking' : 'Not tracking'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditForm(treatment)}>
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemove(treatment)}>
                        <Text style={styles.actionTextRemove}>Remove</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.doseSection}>
                      <Text style={styles.doseSectionLabel}>Reminder times today</Text>
                      {doses.length === 0 ? (
                        <Text style={styles.helperText}>No dose times set; the on/off toggle above still counts it toward totals.</Text>
                      ) : (
                        doses
                          .filter((dose) => dose.scheduledFor.slice(0, 10) === todayDateString())
                          .map((dose) => (
                            <View key={dose.id} style={styles.doseRow}>
                              <Text style={styles.doseRowTime}>{formatTime12(dose.scheduledFor.split('T')[1] ?? '')}</Text>
                              <Text style={styles.doseRowStatus}>
                                {capitalize(dose.status)}
                                {dose.repeatGroupId ? ' · Repeats' : ''}
                              </Text>
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
                            </View>
                          ))
                      )}

                      {doseFormTreatmentId === treatment.id ? (
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
                                  <Text style={[styles.pillTextSmall, doseFormTime.ampm === option && styles.pillTextActive]}>
                                    {option}
                                  </Text>
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
          )}
        </>
      )}
    </ScrollView>
  );
}

type PrescriptionFormState = {
  editingId: string | null;
  name: string;
  doseAmount: string;
  doseUnit: string;
  frequency: string;
  notes: string;
};

function blankPrescriptionForm(): PrescriptionFormState {
  return { editingId: null, name: '', doseAmount: '', doseUnit: '', frequency: '', notes: '' };
}

// The Prescriptions lens -- structurally the same pattern as Supplements
// (a list of every prescription ever added, active or not, each with its
// own Tracking toggle and optional reminder times), but simpler: a
// prescription is a genuinely single-substance product (see
// createPrescriptionTreatment in lib/db.ts), so there's no per-ingredient
// nutrient list to document the way a multivitamin supplement needs --
// just what it's called, its dose, and how often it's taken.
function PrescriptionsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [dosesByTreatment, setDosesByTreatment] = useState<Record<string, ScheduleItemRecord[]>>({});
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PrescriptionFormState>(blankPrescriptionForm());
  const [doseFormTreatmentId, setDoseFormTreatmentId] = useState<string | null>(null);
  const [doseFormTime, setDoseFormTime] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [doseFormRepeat, setDoseFormRepeat] = useState<RepeatConfig>({ type: 'none' });
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    ensureScheduleSeriesGenerated()
      .then(() => listPrescriptionTreatments(false))
      .then(async (loadedTreatments) => {
        setTreatments(loadedTreatments);
        const today = todayDateString();
        const doseEntries = await Promise.all(
          loadedTreatments.map(
            async (treatment) => [treatment.id, await listScheduledPrescriptionDosesForTreatment(treatment.id, today)] as const,
          ),
        );
        setDosesByTreatment(Object.fromEntries(doseEntries));
        const evaluation = await evaluateInteractionRules(today);
        setInteractionWarnings(evaluation.warnings);
      })
      .catch((error) => {
        setErrorMessage(`Could not load prescriptions: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openAddForm() {
    setForm(blankPrescriptionForm());
    setShowForm(true);
  }

  function openEditForm(treatment: TreatmentRecord) {
    setForm({
      editingId: treatment.id,
      name: treatment.name,
      doseAmount: treatment.doseAmount != null ? String(treatment.doseAmount) : '',
      doseUnit: treatment.doseUnit ?? '',
      frequency: treatment.frequency ?? '',
      notes: treatment.notes ?? '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(blankPrescriptionForm());
  }

  async function handleSaveForm() {
    if (!form.name.trim()) {
      showInfoAlert('Almost there', "Enter the prescription's name.");
      return;
    }

    const input = {
      name: form.name,
      doseAmount: form.doseAmount.trim() ? Number(form.doseAmount) : undefined,
      doseUnit: form.doseUnit || undefined,
      frequency: form.frequency || undefined,
      notes: form.notes,
    };

    try {
      if (form.editingId) {
        await updatePrescriptionTreatment(form.editingId, input);
      } else {
        await createPrescriptionTreatment(input);
      }
      closeForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemove(treatment: TreatmentRecord) {
    const ok = await confirmSheet({
      title: 'Remove this prescription?',
      message: `"${treatment.name}" will be permanently deleted.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await deleteTreatment(treatment.id);
    load();
  }

  async function handleToggleActive(treatment: TreatmentRecord) {
    await setTreatmentActive(treatment.id, !treatment.active);
    load();
  }

  function openDoseForm(treatmentId: string) {
    setDoseFormTreatmentId(treatmentId);
    setDoseFormTime({ hour: '', minute: '', ampm: '' });
    setDoseFormRepeat({ type: 'none' });
  }

  function closeDoseForm() {
    setDoseFormTreatmentId(null);
  }

  async function handleSaveDose(treatment: TreatmentRecord) {
    const time24 = buildTime24(doseFormTime.hour, doseFormTime.minute, doseFormTime.ampm);
    if (!time24) {
      showInfoAlert('Almost there', 'Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
      return;
    }
    const repeatError = validateRepeat(doseFormRepeat);
    if (repeatError) {
      showInfoAlert('Almost there', repeatError);
      return;
    }
    try {
      await schedulePrescriptionDose({
        treatmentId: treatment.id,
        title: treatment.name,
        scheduledFor: `${todayDateString()}T${time24}`,
        repeat: doseFormRepeat,
      });
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

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      {confirmSheetElement}
      <AppActionSheet
        visible={removePrompt !== null}
        onClose={() => setRemovePrompt(null)}
        title={removePrompt?.title}
        message={removePrompt?.message}
        actions={removePrompt?.actions ?? []}
      />
      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <>
          {!showForm ? (
            <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
              <Text style={styles.addButtonText}>+ Add a prescription</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Name</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, name: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Levothyroxine"
                value={form.name}
                onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
              />

              <Text style={styles.label}>Dose (optional)</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  keyboardType="decimal-pad"
                  placeholder="75"
                  value={form.doseAmount}
                  onChangeText={(text) => setForm((current) => ({ ...current, doseAmount: text }))}
                />
                <AppTextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="mcg, mg, tablet…"
                  value={form.doseUnit}
                  onChangeText={(text) => setForm((current) => ({ ...current, doseUnit: text }))}
                />
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Frequency (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, frequency: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Once daily"
                value={form.frequency}
                onChangeText={(text) => setForm((current) => ({ ...current, frequency: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, notes: text }))} color={TAB_COLOR} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. take on an empty stomach"
                value={form.notes}
                onChangeText={(text) => setForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveForm}>
                  <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Add prescription'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {interactionWarnings.length > 0 ? (
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Things to check</Text>
              {interactionWarnings.map((warning, index) => (
                <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                  <Text style={styles.interactionTitle}>{warning.title}</Text>
                  <Text style={styles.interactionMessage}>{warning.message}</Text>
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                  <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
          ) : null}

          {treatments.length === 0 ? (
            <Text style={styles.emptyText}>No prescriptions added yet.</Text>
          ) : (
            <View style={styles.table}>
              {treatments.map((treatment) => {
                const doses = dosesByTreatment[treatment.id] ?? [];
                return (
                  <View key={treatment.id} style={styles.row}>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowTitle}>{treatment.name}</Text>
                      <Text style={styles.rowMeta}>
                        {treatment.doseAmount != null ? `${treatment.doseAmount}${treatment.doseUnit ? ` ${treatment.doseUnit}` : ''}` : ''}
                        {treatment.frequency ? `${treatment.doseAmount != null ? ' · ' : ''}${treatment.frequency}` : ''}
                        {treatment.active ? '' : ' · Not tracking'}
                      </Text>
                    </View>

                    <View style={styles.supplementRowActions}>
                      <TouchableOpacity onPress={() => handleToggleActive(treatment)}>
                        <Text style={treatment.active ? styles.actionTextPrimary : styles.actionText}>
                          {treatment.active ? 'Tracking' : 'Not tracking'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditForm(treatment)}>
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemove(treatment)}>
                        <Text style={styles.actionTextRemove}>Remove</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.doseSection}>
                      <Text style={styles.doseSectionLabel}>Reminder times today</Text>
                      {doses.length === 0 ? (
                        <Text style={styles.helperText}>No dose times set; the on/off toggle above still tracks it.</Text>
                      ) : (
                        doses
                          .filter((dose) => dose.scheduledFor.slice(0, 10) === todayDateString())
                          .map((dose) => (
                            <View key={dose.id} style={styles.doseRow}>
                              <Text style={styles.doseRowTime}>{formatTime12(dose.scheduledFor.split('T')[1] ?? '')}</Text>
                              <Text style={styles.doseRowStatus}>
                                {capitalize(dose.status)}
                                {dose.repeatGroupId ? ' · Repeats' : ''}
                              </Text>
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
                            </View>
                          ))
                      )}

                      {doseFormTreatmentId === treatment.id ? (
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
                                  <Text style={[styles.pillTextSmall, doseFormTime.ampm === option && styles.pillTextActive]}>
                                    {option}
                                  </Text>
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
      showInfoAlert('Almost there', 'Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
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
        <Text style={styles.emptyText}>Loading…</Text>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
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
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Things to check</Text>
              {interactionWarnings.map((warning, index) => (
                <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                  <Text style={styles.interactionTitle}>{warning.title}</Text>
                  <Text style={styles.interactionMessage}>{warning.message}</Text>
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                  <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
          ) : null}

          {appointments.length === 0 ? (
            <Text style={styles.emptyText}>Nothing scheduled. Add an appointment or import one from your phone calendar.</Text>
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
        </>
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
  lens: Exclude<Lens, 'meals' | 'pastMeals' | 'mealPlan' | 'dailyMealPlan' | 'shoppingList' | 'myMeds' | 'supplements' | 'hydration' | 'prescriptions' | 'appointments'>;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={styles.emptyText}>{COMING_SOON_COPY[lens]}</Text>
    </ScrollView>
  );
}

export default function ScheduleScreen() {
  useRegisterScreenHelp('Schedules', SCHEDULE_HELP_SECTIONS, '/schedule');
  // 2026-08-26 -- the same real deep-link mechanism purple-digest.tsx's
  // own openDigestLens already established, so Profile can jump straight
  // into the Daily Meal Plan lens rather than leaving someone to find it
  // themselves via LensHub afterward.
  const { openScheduleLens } = useLocalSearchParams<{ openScheduleLens?: string }>();
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
  useFocusEffect(
    useCallback(() => {
      // openScheduleLens overrides the normal "always land on the resting
      // picker" reset below, the same way purple-digest.tsx's own
      // openDigestLens does -- without this, a real deep link from
      // Profile would still show the LensHub picker for a beat instead of
      // the lens it was actually sent to.
      if (openScheduleLens === 'dailyMealPlan') {
        setLens('dailyMealPlan');
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
          ) : lens === 'pastMeals' ? (
            <PastMealsLens />
          ) : lens === 'mealPlan' ? (
            <MealPlanLens />
          ) : lens === 'dailyMealPlan' ? (
            <DailyMealPlanLens />
          ) : lens === 'shoppingList' ? (
            <ShoppingListLens />
          ) : lens === 'hydration' ? (
            <HydrationLens />
          ) : lens === 'myMeds' ? (
            <MyMedsLens />
          ) : lens === 'supplements' ? (
            <SupplementsLens />
          ) : lens === 'prescriptions' ? (
            <PrescriptionsLens />
          ) : lens === 'appointments' ? (
            <AppointmentsLens />
          ) : (
            <ComingSoonLens lens={lens} />
          )}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Schedules" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Schedules"
        tabColor={TAB_COLOR}
        open={mySchedulesOpen}
        onOpenChange={setMySchedulesOpen}
      />
      <LensHub
        pageTitle="Schedules"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Schedules', icon: 'bookmarks-outline', onPress: () => setMySchedulesOpen(true) }}
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
  bodyContent: { padding: 16, paddingBottom: 32 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  errorText: { ...typography.body, color: colors.danger },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { ...typography.bodyEmphasis, color: colors.primary },
  // Meals lens' own week strip, 2026-08-18 -- same border/color rule as
  // every other card on this page (a TAB_COLOR border, TAB_COLOR text).
  weekStripCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  weekStripNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  weekNavButton: { paddingHorizontal: 14, paddingVertical: 2 },
  weekNavButtonText: { ...typography.sectionTitle, color: TAB_COLOR },
  weekRangeLabel: { ...typography.bodyEmphasis, color: TAB_COLOR },
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
  weekDayLabel: { ...typography.caption, color: TAB_COLOR },
  weekDayNumber: { ...typography.bodyEmphasis, color: TAB_COLOR, marginTop: 2 },
  weekDayLabelSelected: { color: colors.textOnPrimary },
  weekDayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginTop: 4 },
  weekDayDotActive: { backgroundColor: TAB_COLOR },
  weekDayDotActiveSelected: { backgroundColor: colors.textOnPrimary },
  weekTodayLink: { ...typography.caption, color: TAB_COLOR, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule,
  // 2026-07-27.
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  // Same rule extended here, 2026-07-27: a border in TAB_COLOR (this card
  // had none before), and its own label/headline value both now carry
  // TAB_COLOR too, matching Home's statNumber -- the loud number is the
  // "reading" this box exists to show.
  hydrationSummaryCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  hydrationSummaryLabel: { ...typography.eyebrow, color: TAB_COLOR },
  hydrationSummaryValue: { ...typography.screenTitle, color: TAB_COLOR, marginTop: 4 },
  hydrationSummaryMeta: { ...typography.caption, color: TAB_COLOR, marginTop: 2 },
  // Colors below (through interactionCitation) are TAB_COLOR, not the
  // plain neutrals they used to be -- 2026-07-27, "every font inside a box
  // should match that box's own border color." Leaves selection-state
  // colors (pillActive/pillTextActive, sourceRowTextSelected) alone -- that's
  // a "this option is currently picked" signal, the same convention used
  // app-wide, a different meaning than "which tab."
  label: { ...typography.label, color: TAB_COLOR, marginBottom: 6, marginTop: 10 },
  // 2026-08-16 -- wraps a real free-text field's own label with a real mic
  // button beside it, the same shape SideBuilder.tsx's own Name-field row
  // already established. label's own marginTop/marginBottom still apply
  // (margin on a child inside a row isn't cleared by the row itself), so
  // no existing spacing anywhere this wraps needed to change.
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helperText: { ...typography.caption, color: TAB_COLOR, marginTop: 4, marginBottom: 8 },
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
  pillText: { ...typography.caption, color: TAB_COLOR, textTransform: 'capitalize' },
  pillTextSmall: { ...typography.caption, color: TAB_COLOR },
  pillTextActive: { color: colors.textOnPrimary },
  modeRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  modeTabActive: { backgroundColor: colors.primary },
  modeTabText: { ...typography.captionEmphasis, color: TAB_COLOR },
  modeTabTextActive: { color: colors.textOnPrimary },
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
  sourceRowText: { ...typography.body, color: TAB_COLOR, flex: 1, marginRight: 8 },
  sourceRowTextSelected: { color: colors.primary, fontWeight: '600' },
  sourceRowKind: { ...typography.caption, color: TAB_COLOR },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    ...typography.body,
    color: TAB_COLOR,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 56, textAlign: 'center' },
  timeSeparator: { ...typography.label, color: TAB_COLOR },
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
  myMedsAddRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  myMedsGroup: { marginBottom: 16 },
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
    padding: 10,
    marginBottom: 10,
  },
  myMedsResearchLabel: { ...typography.captionEmphasis, color: TAB_COLOR, marginTop: 4 },
  myMedsDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, color: TAB_COLOR },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton },
  primaryButtonDisabled: { opacity: 0.5 },
  // Meal Plan/Shopping List lenses, 2026-08-24.
  mealPlanDayRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  mealPlanSlotText: { ...typography.body, color: TAB_COLOR },
  mealPlanDayFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  mealPlanDayDateInput: { flex: 1 },
  // Daily Meal Plan lens, 2026-08-25.
  dailyPlanPickRow: { marginTop: 4, marginBottom: 4, gap: 1 },
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
  table: {
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
  },
  rowMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowTime: { ...typography.captionEmphasis, color: TAB_COLOR, width: 68 },
  rowTextCol: { flex: 1 },
  rowTitle: { ...typography.label, color: TAB_COLOR },
  rowMeta: { ...typography.caption, color: TAB_COLOR, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 16, marginTop: 10, marginLeft: 80 },
  supplementRowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  doseSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doseSectionLabel: { ...typography.captionEmphasis, color: TAB_COLOR, marginBottom: 6 },
  doseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  doseRowTime: { ...typography.captionEmphasis, color: TAB_COLOR, width: 68 },
  doseRowStatus: { ...typography.caption, color: TAB_COLOR, flex: 1 },
  doseRowActions: { flexDirection: 'row', gap: 14 },
  doseForm: { marginTop: 8 },
  appointmentTopActions: { gap: 10, marginBottom: 16 },
  secondaryButtonFull: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateInput: { flex: 1 },
  appointmentRowTime: { width: 76, lineHeight: 16 },
  interactionSection: { marginBottom: 16 },
  interactionSectionLabel: { ...typography.label, color: TAB_COLOR, marginBottom: 8 },
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule,
  // 2026-07-27.
  interactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    padding: 12,
    marginBottom: 8,
  },
  interactionCardReference: { backgroundColor: colors.surfaceMuted },
  interactionTitle: { ...typography.bodyEmphasis, color: TAB_COLOR },
  interactionMessage: { ...typography.body, color: TAB_COLOR, marginTop: 4 },
  interactionCitation: { ...typography.caption, color: TAB_COLOR, marginTop: 6 },
  actionText: { ...typography.captionEmphasis, color: TAB_COLOR },
  actionTextPrimary: { ...typography.captionEmphasis, color: colors.primary },
  actionTextRemove: { ...typography.captionEmphasis, color: colors.danger },
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
  rotateSheetTitle: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1, marginRight: 12 },
  rotateSheetCloseText: { ...typography.sectionTitle, color: colors.textMuted },
  rotateSheetScroll: { marginTop: 8 },
  rotateIngredientCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rotateIngredientLabel: { ...typography.captionEmphasis, color: colors.textSecondary, marginBottom: 6 },
});
