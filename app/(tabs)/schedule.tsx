import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import {
  applyRotationSelection,
  applyRotationSelectionsToIngredients,
  createPrescriptionTreatment,
  createSupplementTreatment,
  deleteScheduledMeal,
  deleteScheduleSeries,
  deleteTreatment,
  ensureScheduleSeriesGenerated,
  getDailyNutrientAnalysis,
  getTreatmentNutrients,
  getUserProfile,
  linkAppointmentToDeviceCalendarEvent,
  listFavorites,
  listMeals,
  listMealsForDate,
  listPrescriptionTreatments,
  listScheduledMealsForDate,
  listScheduledPrescriptionDosesForTreatment,
  listScheduledSupplementDosesForTreatment,
  listSupplementTreatments,
  listTrackedNutrients,
  listUpcomingAppointments,
  markAppointmentCompleted,
  markScheduledDoseTaken,
  scheduleAppointment,
  scheduleMeal,
  schedulePrescriptionDose,
  scheduleSupplementDose,
  setAppointmentCancelled,
  setScheduledMealRotationSelections,
  setScheduledMealSkipped,
  setTreatmentActive,
  unlinkAppointmentFromDeviceCalendarEvent,
  updateAppointment,
  updateScheduledMeal,
  updatePrescriptionTreatment,
  updateSupplementTreatment,
  type FavoriteRecord,
  type MealFavoritePayload,
  type MealIngredientInput,
  type MealRecord,
  type RepeatConfig,
  type RotationSelection,
  type ScheduleItemRecord,
  type SupplementIngredientInput,
  type TrackedNutrient,
  type TreatmentNutrientRecord,
  type TreatmentRecord,
  type UserProfile,
} from '../../lib/db';
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
import { ScreenHeader } from '../../components/ScreenHeader';
import { Dropdown, type DropdownOption } from '../../components/Dropdown';
import { LensHub, type LensOption } from '../../components/LensHub';
import { ScreenBackground } from '../../components/ScreenBackground';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';

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
type Lens = 'meals' | 'hydration' | 'supplements' | 'prescriptions' | 'appointments' | 'exercise';

const LENSES: LensOption<Lens>[] = [
  { key: 'meals', label: 'Meals', icon: 'restaurant-outline' },
  { key: 'hydration', label: 'Hydration', icon: 'water-outline' },
  { key: 'supplements', label: 'Supplements', icon: 'medkit-outline' },
  { key: 'prescriptions', label: 'Prescriptions', icon: 'medical-outline' },
  { key: 'appointments', label: 'Appointments', icon: 'calendar-outline' },
  { key: 'exercise', label: 'Exercise', icon: 'barbell-outline' },
];

const COMING_SOON_COPY: Record<Exclude<Lens, 'meals' | 'supplements' | 'hydration' | 'prescriptions' | 'appointments'>, string> = {
  exercise: 'Schedule planned workouts and activity. Not built yet.',
};

const SCHEDULE_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'Planning vs. logging',
    body: 'This page is for planning what you intend to do, before you do it. Meals still get logged on the Food tab -- either through "Log now" here or by creating a meal there directly.',
  },
  {
    heading: 'Six schedule types, five built so far',
    body: 'Meals, Hydration, Supplements, Prescriptions, and Appointments are fully built. Exercise is still a placeholder.',
  },
  {
    heading: 'Hydration is Meals, filtered',
    body: 'A "Beverage" meal (water, tea, coffee, a smoothie -- see the Food tab) already is a hydration entry. This lens doesn\'t track anything separately -- it\'s the same schedule/meal data, just filtered to beverages and shown with a running water total, so logging or scheduling a drink from either tab shows up in both automatically.',
  },
  {
    heading: 'From templates & favorites, or unplanned',
    body: 'On the Food tab, pick a meal type first. "From templates & favorites" shows only your saved meals/favorites that match that meal type. "Something unplanned" is for when the day did not go as planned (e.g. you ate out) -- type in your best guess of what you actually had.',
  },
  {
    heading: '"Log now"',
    body: 'Turns a planned meal into a real logged entry. If it was scheduled from a template or favorite, the Meals builder opens with those exact ingredients already filled in.',
  },
  {
    heading: '"Rotate" (smoothies, mixed vegetables, mixed fruit)',
    body: 'Shows up on a planned meal only when it was scheduled from a favorite that has at least one ingredient marked Rotating (set on the Food tab -- tap "Rotate?" next to an ingredient in a side). Tap any alternate to make it current for this specific scheduled meal, or randomize one or all of them, then Save. This choice belongs to this one occurrence only -- rotating a Tuesday smoothie never changes what a Wednesday one shows, even if both were scheduled from the same favorite, so you can plan real variety across several upcoming days ahead of time. Whatever\'s chosen is exactly what "Log now" prefills and what actually gets logged, so nutrients, 6 Dimensions, and Trends always reflect the real ingredient used that day.',
  },
  {
    heading: 'Planned, Logged, Skipped',
    body: 'A planned meal you never got to stays honestly marked "Planned," not silently dropped. "Skip" marks it as intentionally not happening today, without deleting the record of what you had planned.',
  },
  {
    heading: 'Usual meal times & fasting window',
    body: 'Set in Profile. "Usual meal times" just pre-fills the time picker for that meal type. If you turn on fasting and set an eating window, this page will not let you schedule a meal outside it.',
  },
  {
    heading: 'Supplements: document every ingredient',
    body: 'For a supplement\'s contribution to count toward your daily totals, document exactly what one dose contains -- each ingredient, its amount, and its unit (mg, mcg, g, or IU). A single-ingredient product gets one row; a multivitamin gets one row per nutrient on its label.',
  },
  {
    heading: 'Tracking / Not tracking',
    body: 'This one toggle covers stopping a supplement, cycling on and off it, or taking it temporarily (e.g. only during a training block) -- flip it off when you are not taking it and back on when you are. Nothing is deleted either way, so you never have to re-enter its ingredients.',
  },
  {
    heading: 'Reminder times are separate from tracking',
    body: 'A supplement\'s contribution to your daily totals always comes from the Tracking toggle alone. Adding reminder times underneath it is optional and purely a personal adherence record -- for a supplement that needs a specific dose time (e.g. away from calcium, or with a meal for fat solubility), not a second way of counting it.',
  },
  {
    heading: 'Prescriptions',
    body: 'Track what you take, its dose and frequency, and (optionally) specific reminder times -- same on/off Tracking toggle and repeat picker as Supplements. Prescriptions don\'t contribute nutrients, so there\'s no ingredient list to document.',
  },
  {
    heading: 'Appointments',
    body: 'Doctor, lab/bloodwork, nutritionist, trainer, or other visits -- title, type, date/time, location, and provider. Mark one completed or cancelled once it\'s past, or remove it. Appointments don\'t repeat yet (most get booked one at a time anyway) -- add each one as it\'s scheduled.',
  },
  {
    heading: 'Phone calendar sync',
    body: 'Appointments can connect to your phone\'s own Calendar app -- if you\'ve already added your Outlook or Google account in your phone\'s Settings, its events already live there. "Import from Phone Calendar" pulls in an existing event as an appointment here; "Add to Phone Calendar" pushes an appointment you made here out to your phone\'s calendar so its own reminders fire too. No separate sign-in, and nothing beyond a one-time permission prompt -- this app never talks to Google or Microsoft directly.',
  },
  {
    heading: 'Interaction checking, once real data exists',
    body: 'Calcium/iron/zinc timing and the fat-soluble vitamins are checked automatically. Levothyroxine + calcium/iron timing is checked too, once you track levothyroxine as a prescription and calcium/iron as supplements with reminder times set -- this app matches a prescription by name (e.g. "levothyroxine" anywhere in what you named it). Biotin + an upcoming lab draw is checked automatically too, once you\'re tracking biotin and have a "Lab / bloodwork" appointment scheduled within the next couple weeks. Anything triggered shows under "Things to check" on the Supplements and Prescriptions tabs.',
  },
  {
    heading: 'Repeating schedules',
    body: 'Meal, drink, supplement, and prescription reminders can repeat daily -- indefinitely, a set number of times, or until a date you choose. Real entries are generated about 60 days ahead and topped up automatically, so editing, skipping, or removing one day never touches any other.',
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
            <TextInput
              style={[styles.input, styles.timeInput, { marginTop: 8 }]}
              placeholder="e.g. 14"
              keyboardType="number-pad"
              value={repeat.count ? String(repeat.count) : ''}
              onChangeText={(text) => onChange({ ...repeat, count: Number(text) || undefined })}
            />
          ) : null}
          {repeat.endType === 'until_date' ? (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="YYYY-MM-DD"
              value={repeat.until ?? ''}
              onChangeText={(text) => onChange({ ...repeat, until: text })}
            />
          ) : null}
          <Text style={styles.helperText}>
            Generates real entries about 60 days ahead at a time, topped up automatically as time passes -- editing or
            skipping one day never affects any other.
          </Text>
        </>
      ) : null}
    </>
  );
}

// The Meals lens -- the one schedule type with real functionality behind
// it. Renders just its own body content (no ScreenHeader/lens tabs of its
// own); the outer ScheduleScreen owns those and mounts this only when the
// Meals lens is selected.
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

  const load = useCallback(() => {
    setLoading(true);
    ensureScheduleSeriesGenerated()
      .then(() =>
        Promise.all([
          listScheduledMealsForDate(todayDateString()),
          getUserProfile(),
          listFavorites(100, 'meal'),
          listMeals(100),
        ]),
      )
      .then(([scheduled, loadedProfile, loadedFavorites, loadedTemplates]) => {
        setItems(scheduled);
        setProfile(loadedProfile);
        setFavorites(loadedFavorites);
        setTemplates(loadedTemplates);
      })
      .catch((error) => {
        setErrorMessage(`Could not load today's schedule: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

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
    setForm(BLANK_FORM);
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
      Alert.alert('Pick a meal type first.');
      return;
    }
    if (!form.title.trim()) {
      Alert.alert(form.mode === 'source' ? 'Pick a template or favorite first.' : 'Enter what you plan to eat.');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      Alert.alert('Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
      return;
    }
    const repeatError = form.editingId ? null : validateRepeat(form.repeat);
    if (repeatError) {
      Alert.alert(repeatError);
      return;
    }

    if (profile?.fastingEnabled && profile.eatingWindowStart && profile.eatingWindowEnd) {
      // Local re-check of isWithinEatingWindow's own logic -- kept here
      // rather than imported so this screen fails closed (blocks the save)
      // even if that import ever broke, since this is the one hard
      // constraint the person explicitly asked to be enforced.
      const { eatingWindowStart, eatingWindowEnd } = profile;
      const withinWindow =
        eatingWindowStart <= eatingWindowEnd
          ? time24 >= eatingWindowStart && time24 < eatingWindowEnd
          : time24 >= eatingWindowStart || time24 < eatingWindowEnd;

      if (!withinWindow) {
        Alert.alert(
          'Outside your eating window',
          `Your eating window is ${formatTime12(eatingWindowStart)} - ${formatTime12(eatingWindowEnd)}. Pick a time inside it, or turn off fasting in Profile if this is a deliberate exception.`,
        );
        return;
      }
    }

    const scheduledFor = `${todayDateString()}T${time24}`;

    try {
      if (form.editingId) {
        await updateScheduledMeal(form.editingId, { title: form.title, mealType: form.mealType, scheduledFor });
      } else {
        await scheduleMeal({
          title: form.title,
          mealType: form.mealType,
          scheduledFor,
          sourceFavoriteId: form.sourceFavoriteId ?? undefined,
          sourceMealId: form.sourceMealId ?? undefined,
          repeat: form.repeat,
        });
      }
      closeForm();
      load();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(item: ScheduleItemRecord) {
    if (item.repeatGroupId) {
      Alert.alert('Remove this planned meal?', `"${item.title}" repeats. Remove just this occurrence, or this and every future one?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just this one',
          onPress: async () => {
            await deleteScheduledMeal(item.id);
            load();
          },
        },
        {
          text: 'This and future',
          style: 'destructive',
          onPress: async () => {
            await deleteScheduleSeries(item.repeatGroupId!);
            load();
          },
        },
      ]);
      return;
    }
    Alert.alert('Remove this planned meal?', `"${item.title}" will no longer show on your schedule.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteScheduledMeal(item.id);
          load();
        },
      },
    ]);
  }

  async function handleToggleSkipped(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    load();
  }

  function handleLogNow(item: ScheduleItemRecord) {
    router.push({
      pathname: '/',
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
  // that day's real meal_items, so nutrients/6 Dimensions/Trends automatically
  // reflect it with no separate recalculation step -- and, later, an
  // automatic shopping list can read each upcoming occurrence's own
  // resolved ingredients the same way.
  function favoriteBaseIngredients(favoriteId: string | null): MealIngredientInput[] {
    if (!favoriteId) return [];
    const favorite = favorites.find((candidate) => candidate.id === favoriteId);
    if (!favorite) return [];
    try {
      const payload = JSON.parse(favorite.payload_json) as MealFavoritePayload;
      return payload.ingredients;
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  const sourceMatches = form.mealType
    ? [...matchingFavorites(favorites, form.mealType), ...matchingTemplates(templates, form.mealType)]
    : [];

  return (
    <>
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {loading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : (
          <>
            {!showForm ? (
              <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
                <Text style={styles.addButtonText}>+ Schedule a meal</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.formCard}>
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
                          No {capitalize(form.mealType)} templates or favorites yet -- save a meal as a favorite, or
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
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Lunch out with a coworker -- probably a sandwich and fries"
                          value={form.title}
                          onChangeText={(text) => setForm((current) => ({ ...current, title: text, sourceFavoriteId: null, sourceMealId: null }))}
                        />
                      </>
                    )}
                  </>
                ) : null}

                {form.editingId ? (
                  <>
                    <Text style={styles.label}>What do you plan to eat?</Text>
                    <TextInput
                      style={styles.input}
                      value={form.title}
                      onChangeText={(text) => setForm((current) => ({ ...current, title: text }))}
                    />
                  </>
                ) : null}

                <Text style={styles.label}>About what time?</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="8"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={form.time.hour}
                    onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                  />
                  <Text style={styles.timeSeparator}>:</Text>
                  <TextInput
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

            {items.length === 0 ? (
              <Text style={styles.emptyText}>Nothing scheduled for today yet.</Text>
            ) : (
              <View style={styles.table}>
                {items.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTime}>{formatTime12(item.scheduledFor.split('T')[1] ?? '')}</Text>
                      <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>{item.title}</Text>
                        <Text style={styles.rowMeta}>
                          {capitalize(item.mealType ?? '')}
                          {item.sourceFavoriteId ? ' -- Favorite' : item.sourceMealId ? ' -- Template' : ''}
                          {item.status === 'logged' ? ' -- Logged' : item.status === 'skipped' ? ' -- Skipped' : ''}
                          {item.repeatGroupId ? ' -- Repeats' : ''}
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
            <Text style={styles.rotateSheetTitle}>Rotate ingredients -- {rotatingItem?.title}</Text>
            <TouchableOpacity onPress={closeRotateSheet}>
              <Text style={styles.rotateSheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Tap any alternate to make it current for this meal, or randomize. This only applies to this one scheduled
            meal -- other scheduled meals from the same favorite are unaffected. "Log now" for this meal will use
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
                  {ingredient.sideName ? `${ingredient.sideName} -- ` : ''}
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
              : `${capitalize(row.item.status)}${row.item.sourceFavoriteId ? ' -- Favorite' : row.item.sourceMealId ? ' -- Template' : ''}${row.item.repeatGroupId ? ' -- Repeats' : ''}`}
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
    setForm({ ...BLANK_FORM, mealType: 'beverage' });
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
      Alert.alert(form.mode === 'source' ? 'Pick a template or favorite first.' : 'Enter what you plan to drink.');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      Alert.alert('Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
      return;
    }
    const repeatError = form.editingId ? null : validateRepeat(form.repeat);
    if (repeatError) {
      Alert.alert(repeatError);
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(item: ScheduleItemRecord) {
    if (item.repeatGroupId) {
      Alert.alert('Remove this planned drink?', `"${item.title}" repeats. Remove just this occurrence, or this and every future one?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just this one',
          onPress: async () => {
            await deleteScheduledMeal(item.id);
            load();
          },
        },
        {
          text: 'This and future',
          style: 'destructive',
          onPress: async () => {
            await deleteScheduleSeries(item.repeatGroupId!);
            load();
          },
        },
      ]);
      return;
    }
    Alert.alert('Remove this planned drink?', `"${item.title}" will no longer show on your schedule.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteScheduledMeal(item.id);
          load();
        },
      },
    ]);
  }

  async function handleToggleSkipped(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    load();
  }

  function handleLogNow(item: ScheduleItemRecord) {
    router.push({
      pathname: '/',
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
                        No Beverage templates or favorites yet -- save a beverage as a favorite on the Food tab, or
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
                        Water, tea, coffee, a smoothie -- whatever you plan to drink, plus anything mixed into it.
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Green tea with honey"
                        value={form.title}
                        onChangeText={(text) => setForm((current) => ({ ...current, title: text, sourceFavoriteId: null, sourceMealId: null }))}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.label}>What do you plan to drink?</Text>
                  <TextInput
                    style={styles.input}
                    value={form.title}
                    onChangeText={(text) => setForm((current) => ({ ...current, title: text }))}
                  />
                </>
              )}

              <Text style={styles.label}>About what time?</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="8"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.hour}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
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
              Nothing logged or scheduled yet today -- this includes any "Beverage" meals logged directly from Meals too.
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
      Alert.alert("Enter the supplement's name.");
      return;
    }
    const unitsPerDay = Number(form.unitsPerDay);
    if (!unitsPerDay || unitsPerDay <= 0) {
      Alert.alert('Enter how many are taken per day (e.g. 1 or 2).');
      return;
    }
    if (!form.servingUnitLabel.trim()) {
      Alert.alert('Enter what one dose is called (e.g. capsule, tablet, scoop).');
      return;
    }
    const validIngredients = form.ingredients.filter((row) => row.nutrientCode && row.amount);
    if (validIngredients.length === 0) {
      Alert.alert('Add at least one ingredient with an amount.');
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(treatment: TreatmentRecord) {
    Alert.alert('Remove this supplement?', `"${treatment.name}" and its ingredient list will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteTreatment(treatment.id);
          load();
        },
      },
    ]);
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
      Alert.alert('Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
      return;
    }
    const repeatError = validateRepeat(doseFormRepeat);
    if (repeatError) {
      Alert.alert(repeatError);
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
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
      Alert.alert('Remove this reminder?', `This time repeats. Remove just today's, or this and every future one?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just this one',
          onPress: async () => {
            await deleteScheduledMeal(item.id);
            load();
          },
        },
        {
          text: 'This and future',
          style: 'destructive',
          onPress: async () => {
            await deleteScheduleSeries(item.repeatGroupId!);
            load();
          },
        },
      ]);
      return;
    }
    Alert.alert('Remove this reminder?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteScheduledMeal(item.id);
          load();
        },
      },
    ]);
  }

  const nutrientOptions: DropdownOption[] = nutrients.map((nutrient) => ({ label: nutrient.displayName, value: nutrient.code }));

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
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
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Daily Multivitamin"
                value={form.name}
                onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
              />

              <Text style={styles.label}>Dose</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  keyboardType="number-pad"
                  value={form.unitsPerDay}
                  onChangeText={(text) => setForm((current) => ({ ...current, unitsPerDay: text }))}
                />
                <TextInput
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
                  <TextInput
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

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
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
                  {warning.confidence === 'unverified' ? (
                    <Text style={styles.interactionMeta}>Not checked precisely -- add dose times to verify.</Text>
                  ) : null}
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {referenceOnlyRules.length > 0 ? (
            <View style={styles.interactionSection}>
              <Text style={styles.interactionSectionLabel}>Worth knowing (reference only -- not personalized)</Text>
              <Text style={styles.helperText}>
                This needs information this app doesn't track yet (an upcoming lab draw), so it can't be checked
                against your actual schedule. Shown as cited background information only.
              </Text>
              {referenceOnlyRules.map((rule) => (
                <View key={rule.ruleId} style={[styles.interactionCard, styles.interactionCardReference]}>
                  <Text style={styles.interactionTitle}>{rule.title}</Text>
                  <Text style={styles.interactionMessage}>{rule.guidance}</Text>
                  <Text style={styles.interactionCitation}>{rule.citation}</Text>
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
                        {treatment.active ? '' : ' -- Not tracking'}
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
                        <Text style={styles.helperText}>No dose times set -- the on/off toggle above still counts it toward totals.</Text>
                      ) : (
                        doses
                          .filter((dose) => dose.scheduledFor.slice(0, 10) === todayDateString())
                          .map((dose) => (
                            <View key={dose.id} style={styles.doseRow}>
                              <Text style={styles.doseRowTime}>{formatTime12(dose.scheduledFor.split('T')[1] ?? '')}</Text>
                              <Text style={styles.doseRowStatus}>
                                {capitalize(dose.status)}
                                {dose.repeatGroupId ? ' -- Repeats' : ''}
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
                            <TextInput
                              style={[styles.input, styles.timeInput]}
                              placeholder="8"
                              keyboardType="number-pad"
                              maxLength={2}
                              value={doseFormTime.hour}
                              onChangeText={(text) => setDoseFormTime((current) => ({ ...current, hour: text }))}
                            />
                            <Text style={styles.timeSeparator}>:</Text>
                            <TextInput
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
      Alert.alert("Enter the prescription's name.");
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(treatment: TreatmentRecord) {
    Alert.alert('Remove this prescription?', `"${treatment.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteTreatment(treatment.id);
          load();
        },
      },
    ]);
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
      Alert.alert('Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
      return;
    }
    const repeatError = validateRepeat(doseFormRepeat);
    if (repeatError) {
      Alert.alert(repeatError);
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
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
      Alert.alert('Remove this reminder?', `This time repeats. Remove just today's, or this and every future one?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just this one',
          onPress: async () => {
            await deleteScheduledMeal(item.id);
            load();
          },
        },
        {
          text: 'This and future',
          style: 'destructive',
          onPress: async () => {
            await deleteScheduleSeries(item.repeatGroupId!);
            load();
          },
        },
      ]);
      return;
    }
    Alert.alert('Remove this reminder?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteScheduledMeal(item.id);
          load();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
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
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Levothyroxine"
                value={form.name}
                onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
              />

              <Text style={styles.label}>Dose (optional)</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  keyboardType="decimal-pad"
                  placeholder="75"
                  value={form.doseAmount}
                  onChangeText={(text) => setForm((current) => ({ ...current, doseAmount: text }))}
                />
                <TextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="mcg, mg, tablet…"
                  value={form.doseUnit}
                  onChangeText={(text) => setForm((current) => ({ ...current, doseUnit: text }))}
                />
              </View>

              <Text style={styles.label}>Frequency (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Once daily"
                value={form.frequency}
                onChangeText={(text) => setForm((current) => ({ ...current, frequency: text }))}
              />

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
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
                  {warning.confidence === 'unverified' ? (
                    <Text style={styles.interactionMeta}>Not checked precisely -- add dose times to verify.</Text>
                  ) : null}
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
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
                        {treatment.frequency ? `${treatment.doseAmount != null ? ' -- ' : ''}${treatment.frequency}` : ''}
                        {treatment.active ? '' : ' -- Not tracking'}
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
                        <Text style={styles.helperText}>No dose times set -- the on/off toggle above still tracks it.</Text>
                      ) : (
                        doses
                          .filter((dose) => dose.scheduledFor.slice(0, 10) === todayDateString())
                          .map((dose) => (
                            <View key={dose.id} style={styles.doseRow}>
                              <Text style={styles.doseRowTime}>{formatTime12(dose.scheduledFor.split('T')[1] ?? '')}</Text>
                              <Text style={styles.doseRowStatus}>
                                {capitalize(dose.status)}
                                {dose.repeatGroupId ? ' -- Repeats' : ''}
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
                            <TextInput
                              style={[styles.input, styles.timeInput]}
                              placeholder="8"
                              keyboardType="number-pad"
                              maxLength={2}
                              value={doseFormTime.hour}
                              onChangeText={(text) => setDoseFormTime((current) => ({ ...current, hour: text }))}
                            />
                            <Text style={styles.timeSeparator}>:</Text>
                            <TextInput
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

function formatAppointmentDate(dateStr: string): string {
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
      Alert.alert('Enter what this appointment is for.');
      return;
    }
    if (!isValidDateString(form.date)) {
      Alert.alert('Enter a valid date (YYYY-MM-DD).');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      Alert.alert('Enter a valid time (hour 1-12, minute 0-59, AM or PM).');
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
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(item: ScheduleItemRecord) {
    const removeIt = async (alsoRemoveFromCalendar: boolean) => {
      if (alsoRemoveFromCalendar && item.linkedDeviceCalendarEventId) {
        await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
      }
      await deleteScheduledMeal(item.id);
      load();
    };

    if (item.linkedDeviceCalendarEventId) {
      Alert.alert('Remove this appointment?', 'This appointment is also on your phone calendar.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove here only', onPress: () => removeIt(false) },
        { text: 'Remove from both', style: 'destructive', onPress: () => removeIt(true) },
      ]);
      return;
    }

    Alert.alert('Remove this appointment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeIt(false) },
    ]);
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
    if (calendarPermissionGranted) {
      return true;
    }
    const granted = await requestCalendarPermission();
    setCalendarPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        'Calendar access needed',
        "Turn on calendar access for Inside Story in your phone's Settings to sync appointments with your phone calendar.",
      );
    }
    return granted;
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
        Alert.alert('Could not add to calendar', 'No writable calendar was found on this device.');
        return;
      }
      await linkAppointmentToDeviceCalendarEvent(item.id, eventId);
      load();
    } catch (error) {
      Alert.alert('Could not add to calendar', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemoveFromDeviceCalendar(item: ScheduleItemRecord) {
    if (!item.linkedDeviceCalendarEventId) return;
    await deleteDeviceCalendarEvent(item.linkedDeviceCalendarEventId);
    await unlinkAppointmentFromDeviceCalendarEvent(item.id);
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
      Alert.alert('Could not read phone calendar', error instanceof Error ? error.message : String(error));
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
                          {event.title} -- {formatAppointmentDate(dateStr)}
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
              <Text style={styles.label}>What is this for?</Text>
              <TextInput
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
                <TextInput
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
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="8"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.hour}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
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

              <Text style={styles.label}>Location (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Riverside Medical, Suite 200"
                value={form.location}
                onChangeText={(text) => setForm((current) => ({ ...current, location: text }))}
              />

              <Text style={styles.label}>Provider (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dr. Smith"
                value={form.providerName}
                onChangeText={(text) => setForm((current) => ({ ...current, providerName: text }))}
              />

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. fasting required, bring insurance card"
                value={form.notes}
                onChangeText={(text) => setForm((current) => ({ ...current, notes: text }))}
              />

              {form.importingDeviceEventId ? (
                <Text style={styles.helperText}>Importing from your phone calendar -- will stay linked to that event.</Text>
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
                </View>
              ))}
            </View>
          ) : null}

          {appointments.length === 0 ? (
            <Text style={styles.emptyText}>Nothing scheduled -- add an appointment or import one from your phone calendar.</Text>
          ) : (
            <View style={styles.table}>
              {appointments.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowTime, styles.appointmentRowTime]}>
                      {formatAppointmentDate(item.scheduledFor.slice(0, 10))}
                      {'\n'}
                      {formatTime12(item.scheduledFor.split('T')[1] ?? '')}
                    </Text>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowMeta}>
                        {appointmentTypeLabel(item.appointmentType)}
                        {item.providerName ? ` -- ${item.providerName}` : ''}
                        {item.location ? ` -- ${item.location}` : ''}
                        {item.status === 'completed' ? ' -- Completed' : item.status === 'cancelled' ? ' -- Cancelled' : ''}
                        {item.linkedDeviceCalendarEventId ? ' -- On phone calendar' : ''}
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
function ComingSoonLens({ lens }: { lens: Exclude<Lens, 'meals' | 'supplements' | 'hydration' | 'prescriptions' | 'appointments'> }) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={styles.emptyText}>{COMING_SOON_COPY[lens]}</Text>
    </ScrollView>
  );
}

export default function ScheduleScreen() {
  const [lens, setLens] = useState<Lens>('meals');
  const activeLensLabel = LENSES.find((option) => option.key === lens)?.label;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader
          title="Schedules"
          tabPath="/schedule"
          helpSections={SCHEDULE_HELP_SECTIONS}
          activeLensLabel={activeLensLabel}
        />
      </View>

      <SwipeableTabScreen>
        <ScreenBackground>
          {lens === 'meals' ? (
            <MealsLens />
          ) : lens === 'hydration' ? (
            <HydrationLens />
          ) : lens === 'supplements' ? (
            <SupplementsLens />
          ) : lens === 'prescriptions' ? (
            <PrescriptionsLens />
          ) : lens === 'appointments' ? (
            <AppointmentsLens />
          ) : (
            <ComingSoonLens lens={lens} />
          )}
        </ScreenBackground>
      </SwipeableTabScreen>

      <LensHub pageTitle="Schedules" options={LENSES} selected={lens} onSelect={setLens} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 12 },
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hydrationSummaryCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  hydrationSummaryLabel: { ...typography.eyebrow, color: colors.primary },
  hydrationSummaryValue: { ...typography.screenTitle, color: colors.textPrimary, marginTop: 4 },
  hydrationSummaryMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  helperText: { ...typography.caption, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
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
  pillText: { ...typography.caption, color: colors.textPrimary, textTransform: 'capitalize' },
  pillTextSmall: { ...typography.caption, color: colors.textPrimary },
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
  modeTabText: { ...typography.captionEmphasis, color: colors.textSecondary },
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
  sourceRowText: { ...typography.body, color: colors.textPrimary, flex: 1, marginRight: 8 },
  sourceRowTextSelected: { color: colors.primary, fontWeight: '600' },
  sourceRowKind: { ...typography.caption, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    ...typography.body,
    color: colors.textPrimary,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 56, textAlign: 'center' },
  timeSeparator: { ...typography.label, color: colors.textPrimary },
  doseUnitInput: { flex: 1 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ingredientNutrientCol: { flex: 2 },
  ingredientAmountInput: { flex: 1, minWidth: 64 },
  ingredientUnitCol: { minWidth: 76 },
  ingredientRemove: { paddingHorizontal: 6, paddingVertical: 6 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
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
  rowTime: { ...typography.captionEmphasis, color: colors.textSecondary, width: 68 },
  rowTextCol: { flex: 1 },
  rowTitle: { ...typography.label, color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 16, marginTop: 10, marginLeft: 80 },
  supplementRowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  doseSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doseSectionLabel: { ...typography.captionEmphasis, color: colors.textSecondary, marginBottom: 6 },
  doseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  doseRowTime: { ...typography.captionEmphasis, color: colors.textPrimary, width: 68 },
  doseRowStatus: { ...typography.caption, color: colors.textSecondary, flex: 1 },
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
  interactionSectionLabel: { ...typography.label, color: colors.textPrimary, marginBottom: 8 },
  interactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  interactionCardReference: { backgroundColor: colors.surfaceMuted },
  interactionTitle: { ...typography.bodyEmphasis, color: colors.textPrimary },
  interactionMessage: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  interactionMeta: { ...typography.caption, color: colors.primary, marginTop: 4, fontStyle: 'italic' },
  interactionCitation: { ...typography.caption, color: colors.textMuted, marginTop: 6 },
  actionText: { ...typography.captionEmphasis, color: colors.textSecondary },
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
