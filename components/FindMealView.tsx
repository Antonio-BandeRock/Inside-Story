// "Find a meal you've had" -- 2026-08-30, replacing the Log Again tile strip
// that shipped a few hours earlier the same day.
//
// Direct steer, and it was right: "random meals being presented to possibly
// have them again doesn't make sense. It could be a shortcut to reschedule a
// past meal and they then see a standard scrollable list of meal names to
// choose from, with a search field to filter by a specific word rather than
// remembering what it was named in the app."
//
// The premise behind the tiles (most logging is a repeat of something already
// logged) still holds. The presentation did not. Eight guessed tiles assume the
// app knows someone is eating right now, and the moment the meal they want is
// not among those eight there is no way to reach it at all. A searchable list
// serves the moments that actually happen: something was eaten instead of what
// was planned, logging is being caught up after the fact, or a known meal is
// being put on the calendar.
//
// relogMeal and the rest of the machinery underneath are unchanged; only the
// way in is different.
//
// Renamed the same day, on a second steer: "Find a Meal You've Had is
// mislabeled because they could want to find a meal they haven't had yet. It
// should also have access to the system meals generally in an order that makes
// sense." So this is not a history list, it is the whole catalogue of meals
// reachable without opening a builder.
//
// Corrected again straight after, and the correction was right on both counts.
// The first pass renamed the screen title and the Food menu entry but left the
// Home button reading "Find a meal you have had", which is the one people
// actually tap. And the same release hid auto-generated carrier favorites,
// which was correct in itself but took away the only way meals from a 6-week
// plan could be found here, so the screen filled up with system recipes and
// looked like it had swapped one thing for the other.
//
// Both fixed. Meals already scheduled but not yet eaten now have their own
// section, which is the most literal reading of "a meal they haven't had yet",
// and a Yours/System filter keeps 300-plus curated recipes from burying a
// handful of the person's own meals.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from './HomeSectionBand';
import { ALL_DIGEST_ENTRIES } from '../lib/digest';
import { isProblemFoodEntry } from '../lib/digest/types';
import { encodeBuildMealHandoff, type BuildMealItem } from '../lib/mealBuilderHandoff';
import {
  createMealFromComponents,
  deleteMealPhotoDraft,
  getMealFavorite,
  getMealPickerDetailForCuratedRecipe,
  getMealPickerDetailForFavorite,
  getMealPickerDetailForLoggedMeal,
  listFavorites,
  listAllCuratedRecipes,
  listRecentDistinctMeals,
  listScheduledMealsForDate,
  listScheduledMealsForDateRange,
  markScheduledMealLogged,
  logCuratedRecipeAsMeal,
  relogMeal,
  scheduleCuratedRecipe,
  scheduleMeal,
  type BuilderFavoriteItemType,
  type CuratedRecipeListRow,
  type MealPickerDetail,
  type RecentMealSummary,
  type ScheduleItemRecord,
} from '../lib/db';
import { buildTime24, describeTimeInputProblem, formatTime12, type TimeOfDayInput } from '../lib/timeOfDay';

// How many rows are loaded at once. High enough that a personal history is
// covered whole, and the search runs in SQL rather than over this list, so a
// name past the cap is still reachable by typing it.
const LIST_LIMIT = 300;

type PickableMeal =
  | { kind: 'meal'; id: string; name: string; mealType: string; lastEatenAt: string; timesLogged: number }
  | { kind: 'favorite'; id: string; name: string }
  | {
      kind: 'curated';
      id: string;
      name: string;
      builderType: BuilderFavoriteItemType;
      healthBenefit: string;
      flavorProfile: string;
    }
  // A meal already on the schedule and not yet eaten. Its components live on
  // the favorite the scheduling path created to carry them, which is why this
  // carries that id rather than the schedule item's.
  | { kind: 'planned'; id: string; favoriteId: string; name: string; mealType: string; scheduledFor: string };

// One dish inside a meal, as a key for the tick state.
function dishKey(dish: { componentType: string; componentId: string }, index: number): string {
  // Indexed, since a meal can hold the same saved dish twice.
  return `${dish.componentType}_${dish.componentId}_${index}`;
}

// One ticked dish, wherever it came from: what Meal Builder needs to load
// it, plus the name and the meal it was taken from for the tray.
type TickedDish = { name: string; from: string; item: BuildMealItem };

// The order the Digest's own Recipes category already lists these in, reused
// rather than invented, so a system meal sits where someone who has browsed
// Recipes would expect it.
const BUILDER_SECTIONS: { type: BuilderFavoriteItemType; label: string }[] = [
  { type: 'side', label: 'Sides' },
  { type: 'salad', label: 'Salads & Bowls' },
  { type: 'soup', label: 'Soups' },
  { type: 'handheld', label: 'Handhelds' },
  { type: 'smoothie', label: 'Smoothies' },
  { type: 'beverage', label: 'Beverages' },
  { type: 'fermentation', label: 'Fermentation' },
  { type: 'snack', label: 'Snacks' },
  { type: 'bakedGoods', label: 'Baked Goods' },
  { type: 'sauce', label: 'Sauces' },
  { type: 'dessert', label: 'Desserts' },
];

// One band per section, 2026-09-13: the section's name is the band's own
// header row ("'Coming up on your schedule' should be at the top of the
// header box as a header inside of the box") and its meals sit beneath it,
// spaced at the standard band gap. One FlatList over sections, so nothing
// here needs SectionList's own rendering contract.
type ListSection = { key: string; label: string; icon: ComponentProps<typeof Ionicons>['name']; rows: { key: string; meal: PickableMeal }[] };

// The one-line teaser the Digest already carries for every system recipe,
// keyed by the recipe id the two share. This is the enticement: it was
// written for that dish, so nothing is invented here. Built once.
const CURATED_TEASER_BY_ID: Map<string, string> = new Map();
for (const entry of ALL_DIGEST_ENTRIES) {
  if (isProblemFoodEntry(entry)) continue;
  const linked = entry.linkedCuratedRecipeId;
  if (linked && entry.teaser) CURATED_TEASER_BY_ID.set(linked, entry.teaser);
}

const SECTION_ICON_BY_BUILDER: Record<BuilderFavoriteItemType, ComponentProps<typeof Ionicons>['name']> = {
  side: 'fast-food-outline',
  salad: 'leaf-outline',
  smoothie: 'wine-outline',
  fermentation: 'flask-outline',
  beverage: 'cafe-outline',
  snack: 'nutrition-outline',
  bakedGoods: 'pizza-outline',
  soup: 'flame-outline',
  sauce: 'water-outline',
  handheld: 'layers-outline',
  dessert: 'ice-cream-outline',
};

type Mode = 'list' | 'actions' | 'earlier' | 'schedule' | 'replace';

// Yours covers everything that is this person's: logged, favorited, and
// already on their schedule. System is the curated library. Defaulting to Yours
// keeps a handful of real meals from being buried under 300-plus recipes, while
// System is one tap away rather than absent.
type Scope = 'yours' | 'system';

// How far ahead a scheduled meal is still worth offering. A 6-week plan is the
// longest thing this app generates, so this covers one whole plan.
const PLANNED_LOOKAHEAD_DAYS = 42;

function todayLocalDateString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function nowLocalTime24(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function dateStringDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 2026-09-13: a Food lens rather than a Stack screen. Direct: "Log or
// Schedule a Meal should be treated the same way that the food builders
// are treated when they are tapped. They go to their own screen... and
// have the footer at the bottom. In my opinion, only Profile should have
// screens like the current Log or Schedule a Meal... All 10 tab related
// screens should always continue to keep their own background or the
// shared one." So this renders inside Food's own GatedTabContent like the
// twelve builders: the tab's background behind it, the footer band, the
// hub buttons and the corner box all where they always are. What used to
// arrive as route params (a photo draft to finish) arrives as props, and
// what used to be router.back() is onDone, which the tab decides.
export function FindMealView({
  draftId,
  photoUri,
  capturedAt,
  onDone,
}: {
  // Set only when this lens was opened to finish a photo taken earlier. The
  // photo goes onto whatever gets logged, and the meal is dated to when the
  // photo was taken rather than to now.
  draftId?: string;
  photoUri?: string;
  capturedAt?: string;
  // Called once something has been logged or scheduled, or nothing will be.
  onDone: () => void;
}) {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('yours');
  const [sections, setSections] = useState<ListSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [selected, setSelected] = useState<PickableMeal | null>(null);
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [dateText, setDateText] = useState(todayLocalDateString());
  const [plannedToday, setPlannedToday] = useState<ScheduleItemRecord[]>([]);
  // 2026-08-30, direct request: "the meals listed need to be able to expand to
  // show the ingredients, and then have a button to choose what to do with it."
  // A name alone often will not separate two similar meals, and picking one
  // blind then backing out is worse than being able to look first.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // Which groups (Coming up on your schedule, Sides, Soups, and the rest)
  // are open, 2026-09-13: "There are categories of things in the list and
  // they need to be collapsable." Closed until tapped, so eleven system
  // groups read as a menu rather than four hundred rows; a search opens
  // every group that still has a match, since what was typed is the
  // thing being looked for.
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  function toggleSection(key: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  // Resolved on first expand and kept, keyed by row. Loading a meal's
  // ingredients means several queries for a favorite (one per component), so
  // re-resolving on every collapse and re-expand would be wasteful; the list
  // itself is reloaded whenever the search or scope changes, which is when this
  // could go stale.
  const [detailByKey, setDetailByKey] = useState<Record<string, MealPickerDetail>>({});
  // Dishes ticked across EVERY opened meal, one selection for the whole
  // screen, 2026-09-13. The first cut kept ticks per meal, so the button in
  // each meal counted only its own: "each one says on the button Build a
  // meal with the 1 ticked, instead of taking into account those that are
  // ticked from other recipes. We need all that are ticked to be included."
  // Keyed by row and dish so the same saved dish inside two meals is two
  // ticks; the value carries what Meal Builder needs and where it came
  // from, so the tray can list the combination before it is built.
  const [tickedDishes, setTickedDishes] = useState<Record<string, TickedDish>>({});
  const tickedList = Object.values(tickedDishes);
  const router = useRouter();

  function toggleDishTicked(key: string, dish: TickedDish) {
    setTickedDishes((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = dish;
      return next;
    });
  }

  // Pushing this tab's own route with the new param is what its focus
  // effect reacts to, the same way Use this Favorite already opens Meal
  // Builder. A nonce so picking the same thing twice is two distinct
  // params, since the focus effect only reacts to a param that changed.
  function sendToMealBuilder(items: BuildMealItem[], name: string | undefined, mealType: string | undefined) {
    if (items.length === 0) return;
    const buildMealFrom = encodeBuildMealHandoff({ name, mealType, items, nonce: Date.now() });
    router.push({ pathname: '/food', params: { buildMealFrom } });
  }

  // One whole meal into Meal Builder, keeping its name and type. A system
  // recipe is one dish and travels by its recipe id; everything else
  // travels as the saved records the meal is made from.
  function buildMealWithWhole(meal: PickableMeal, detail: MealPickerDetail | undefined) {
    const items: BuildMealItem[] =
      meal.kind === 'curated'
        ? [{ curatedRecipeId: meal.id }]
        : (detail?.dishes ?? []).map((dish) => ({ componentType: dish.componentType, componentId: dish.componentId }));
    const mealType = meal.kind === 'meal' || meal.kind === 'planned' ? meal.mealType : undefined;
    sendToMealBuilder(items, meal.name, mealType);
  }

  // Everything ticked, from however many meals, as one new meal. A
  // combination is not any of the meals it was drawn from, so it carries
  // no name and no type: Meal Builder asks for the type first.
  function buildMealWithTicked() {
    sendToMealBuilder(
      tickedList.map((dish) => dish.item),
      undefined,
      undefined,
    );
  }
  const [loadingIngredientsKey, setLoadingIngredientsKey] = useState<string | null>(null);

  const load = useCallback(async (search: string, currentScope: Scope) => {
    setLoading(true);
    try {
      const [recent, favorites, curated, scheduled] = await Promise.all([
        listRecentDistinctMeals(LIST_LIMIT, search),
        listFavorites(LIST_LIMIT, 'meal'),
        // Bundled reference content, identical for everyone and unchanging
        // between searches, so this is filtered in memory rather than requeried
        // on every keystroke.
        listAllCuratedRecipes(),
        listScheduledMealsForDateRange(todayLocalDateString(), dateStringDaysFromToday(PLANNED_LOOKAHEAD_DAYS)),
      ]);
      const trimmed = search.trim().toLowerCase();
      // Favorites are filtered here rather than in SQL because listFavorites is
      // shared with every other favorite type and does not take a query. The
      // list is small enough that this costs nothing.
      const favoriteRows: PickableMeal[] = favorites
        .filter((favorite) => !trimmed || favorite.name.toLowerCase().includes(trimmed))
        .map((favorite) => ({ kind: 'favorite' as const, id: favorite.id, name: favorite.name }));
      const mealRows: PickableMeal[] = recent.map((meal: RecentMealSummary) => ({
        kind: 'meal' as const,
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType,
        lastEatenAt: meal.eatenAt,
        timesLogged: meal.timesLogged,
      }));
      const curatedRows: PickableMeal[] = curated
        .filter((recipe: CuratedRecipeListRow) => !trimmed || recipe.name.toLowerCase().includes(trimmed))
        .map((recipe: CuratedRecipeListRow) => ({
          kind: 'curated' as const,
          id: recipe.id,
          name: recipe.name,
          builderType: recipe.builderType,
          healthBenefit: recipe.healthBenefit,
          flavorProfile: recipe.flavorProfile,
        }));

      // Only meals still waiting, and only those that kept a carrier favorite to
      // resume their components from. One row per distinct name: a 6-week plan
      // repeats the same dishes, and 126 near-identical rows would be worse than
      // no list at all.
      const seenPlannedNames = new Set<string>();
      const plannedRows: PickableMeal[] = [];
      for (const item of scheduled) {
        if (item.status !== 'planned' || !item.sourceFavoriteId) continue;
        if (trimmed && !item.title.toLowerCase().includes(trimmed)) continue;
        const nameKey = item.title.toLowerCase();
        if (seenPlannedNames.has(nameKey)) continue;
        seenPlannedNames.add(nameKey);
        plannedRows.push({
          kind: 'planned',
          id: item.id,
          favoriteId: item.sourceFavoriteId,
          name: item.title,
          mealType: item.mealType ?? 'snack',
          scheduledFor: item.scheduledFor,
        });
      }

      const built: ListSection[] = [];
      const pushSection = (label: string, icon: ListSection['icon'], rows: PickableMeal[]) => {
        if (rows.length === 0) return;
        built.push({
          key: `section-${label}`,
          label,
          icon,
          rows: rows.map((meal) => ({ key: `${meal.kind}-${meal.id}`, meal })),
        });
      };

      if (currentScope === 'yours') {
        pushSection('Coming up on your schedule', 'calendar-outline', plannedRows);
        pushSection('Meals you have logged', 'restaurant-outline', mealRows);
        pushSection('Your favorites', 'heart-outline', favoriteRows);
      } else {
        for (const section of BUILDER_SECTIONS) {
          pushSection(
            section.label,
            SECTION_ICON_BY_BUILDER[section.type],
            curatedRows.filter((row) => row.kind === 'curated' && row.builderType === section.type),
          );
        }
      }
      setSections(built);
      // The rows themselves just changed, so anything resolved against the old
      // ones is no longer addressable.
      setExpandedKey(null);
      setDetailByKey({});
    } catch (error) {
      console.error('[FindMealScreen] Failed to load meals', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query, scope);
  }, [query, scope, load]);

  useEffect(() => {
    listScheduledMealsForDate(todayLocalDateString())
      .then((scheduled) => setPlannedToday(scheduled.filter((item) => item.status === 'planned')))
      .catch((error) => console.error('[FindMealScreen] Failed to load planned meals', error));
  }, []);

  // Only the draft ROW goes: the photo file now belongs to the meal, and
  // deleting it here would take the photo off the meal that just received it.
  async function clearFinishedDraft() {
    if (!draftId) return;
    try {
      await deleteMealPhotoDraft(draftId);
    } catch (error) {
      console.error('[FindMealScreen] Logged the meal but could not clear the photo draft', error);
    }
  }

  // One place that knows how to turn a picked row into a real logged meal, so
  // "now", "earlier" and "replace a planned meal" cannot drift apart. A past
  // meal is copied by relogMeal; a favorite is a template with no meal of its
  // own to copy, so it goes through createMealFromComponents.
  async function logSelectedAt(eatenAt: string): Promise<string | null> {
    if (!selected) return null;
    if (selected.kind === 'curated') {
      // A curated recipe is reference content shared by everyone, so it becomes
      // one of this person's own saved dishes first, exactly as "Build This
      // Recipe" already does inside a builder.
      const result = await logCuratedRecipeAsMeal({
        recipeId: selected.id,
        mealType: 'snack',
        eatenAt,
        photoUri: photoUri ?? null,
      });
      if ('error' in result) {
        showInfoAlert('That did not log', result.error);
        return null;
      }
      return result.id;
    }
    if (selected.kind === 'planned') {
      // Its components live on the carrier favorite the scheduling path made,
      // which is exactly what the scheduled occurrence itself resumes from.
      const favorite = await getMealFavorite(selected.favoriteId);
      if (!favorite) {
        showInfoAlert('That did not log', 'This scheduled meal could not be opened. Its saved parts may have been deleted.');
        return null;
      }
      const result = await createMealFromComponents({
        name: favorite.name,
        mealType: favorite.mealType || selected.mealType,
        eatenAt,
        notes: favorite.notes,
        isImmediate: true,
        components: favorite.components,
      });
      if ('error' in result) {
        showInfoAlert('That did not log', result.error);
        return null;
      }
      // Logging it closes out the occurrence it came from, so it stops sitting
      // on the schedule waiting for something that already happened.
      try {
        await markScheduledMealLogged(selected.id, result.id);
      } catch (error) {
        console.error('[FindMealScreen] Logged, but could not close out the scheduled meal', error);
      }
      return result.id;
    }
    if (selected.kind === 'meal') {
      const result = await relogMeal(selected.id, eatenAt, { photoUri: photoUri ?? null });
      if ('error' in result) {
        showInfoAlert('That did not log', result.error);
        return null;
      }
      return result.id;
    }
    const favorite = await getMealFavorite(selected.id);
    if (!favorite) {
      showInfoAlert('That did not log', 'That favorite could not be opened. It may have been deleted.');
      return null;
    }
    const result = await createMealFromComponents({
      name: favorite.name,
      mealType: favorite.mealType || 'snack',
      eatenAt,
      notes: favorite.notes,
      isImmediate: true,
      components: favorite.components,
    });
    if ('error' in result) {
      showInfoAlert('That did not log', result.error);
      return null;
    }
    return result.id;
  }

  async function handleLogNow() {
    setBusy(true);
    try {
      // A photo taken at 12:40 and finished at 3pm was still eaten at 12:40.
      const eatenAt =
        capturedAt && capturedAt.length >= 16 ? capturedAt : `${todayLocalDateString()}T${nowLocalTime24()}`;
      const id = await logSelectedAt(eatenAt);
      if (!id) return;
      await clearFinishedDraft();
      onDone();
    } catch (error) {
      console.error('[FindMealScreen] Failed to log now', error);
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogEarlier() {
    const time24 = buildTime24(time.hour, time.minute, time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(time.hour, time.minute, time.ampm));
      return;
    }
    setBusy(true);
    try {
      const id = await logSelectedAt(`${todayLocalDateString()}T${time24}`);
      if (!id) return;
      await clearFinishedDraft();
      onDone();
    } catch (error) {
      console.error('[FindMealScreen] Failed to log earlier', error);
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSchedule() {
    if (!selected) return;
    const time24 = buildTime24(time.hour, time.minute, time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(time.hour, time.minute, time.ampm));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText.trim())) {
      showInfoAlert('Almost there', 'Enter the date as YYYY-MM-DD, or use one of the buttons above it.');
      return;
    }
    setBusy(true);
    try {
      if (selected.kind === 'curated') {
        const failure = await scheduleCuratedRecipe({
          recipeId: selected.id,
          mealType: 'snack',
          scheduledFor: `${dateText.trim()}T${time24}`,
        });
        if (failure) {
          showInfoAlert('That did not schedule', failure.error);
          return;
        }
        onDone();
        return;
      }
      // Scheduling records where this came from rather than copying it: a
      // planned meal is resolved into real components at the moment it is
      // actually logged, which is what every other scheduling path in the app
      // already does.
      await scheduleMeal({
        title: selected.name,
        mealType: selected.kind === 'meal' ? selected.mealType : 'snack',
        scheduledFor: `${dateText.trim()}T${time24}`,
        sourceMealId: selected.kind === 'meal' ? selected.id : undefined,
        sourceFavoriteId:
          selected.kind === 'favorite' ? selected.id : selected.kind === 'planned' ? selected.favoriteId : undefined,
      });
      onDone();
    } catch (error) {
      console.error('[FindMealScreen] Failed to schedule', error);
      showInfoAlert('That did not schedule', 'Something went wrong saving it. Give it another try.');
    } finally {
      setBusy(false);
    }
  }

  // Logs what was actually eaten and marks the planned slot as covered by it.
  // Marking it skipped would say no meal happened at all; leaving it planned
  // would have the day read as two meals when there was one.
  async function handleReplacePlanned(planned: ScheduleItemRecord) {
    setBusy(true);
    try {
      const eatenAt = planned.scheduledFor.length >= 16 ? planned.scheduledFor : `${todayLocalDateString()}T${nowLocalTime24()}`;
      const id = await logSelectedAt(eatenAt);
      if (!id) return;
      try {
        await markScheduledMealLogged(planned.id, id);
      } catch (error) {
        console.error('[FindMealScreen] Logged, but could not resolve the planned meal', error);
        showInfoAlert(
          'Logged, but the planned meal is still showing',
          'What you ate is saved. Marking the planned meal as covered by it did not work, so you may still see it on your schedule.',
        );
      }
      await clearFinishedDraft();
      onDone();
    } catch (error) {
      console.error('[FindMealScreen] Failed to replace a planned meal', error);
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleExpanded(entryKey: string, meal: PickableMeal) {
    if (expandedKey === entryKey) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(entryKey);
    if (detailByKey[entryKey]) return;
    setLoadingIngredientsKey(entryKey);
    try {
      // A scheduled meal keeps its components on the favorite the scheduling
      // path created to carry them, so it resolves the same way a favorite does.
      const detail =
        meal.kind === 'meal'
          ? await getMealPickerDetailForLoggedMeal(meal.id)
          : meal.kind === 'curated'
            ? await getMealPickerDetailForCuratedRecipe(meal.id)
            : meal.kind === 'planned'
              ? await getMealPickerDetailForFavorite(meal.favoriteId)
              : await getMealPickerDetailForFavorite(meal.id);
      setDetailByKey((current) => ({ ...current, [entryKey]: detail }));
    } catch (error) {
      console.error('[FindMealScreen] Failed to load ingredients', error);
      // An empty list renders as "could not be read" below rather than as a
      // spinner that never stops.
      setDetailByKey((current) => ({ ...current, [entryKey]: { ingredients: [], methods: [], components: [], dishes: [] } }));
    } finally {
      setLoadingIngredientsKey(null);
    }
  }

  function openActionsFor(meal: PickableMeal) {
    setSelected(meal);
    // Seeded to now, so "log it earlier" starts somewhere sensible and only
    // needs the hour nudged back rather than three fields filled from blank.
    const [hour24, minute] = nowLocalTime24().split(':');
    const hourNumber = Number(hour24);
    const hour12 = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
    setTime({ hour: String(hour12), minute, ampm: hourNumber < 12 ? 'AM' : 'PM' });
    setDateText(todayLocalDateString());
    setMode('actions');
  }

  function describeMeal(meal: PickableMeal): string {
    if (meal.kind === 'planned') {
      const when = meal.scheduledFor.slice(0, 10);
      const at = meal.scheduledFor.length >= 16 ? formatTime12(meal.scheduledFor.slice(11, 16)) : '';
      return `Scheduled for ${when}${at ? ` at ${at}` : ''}`;
    }
    if (meal.kind === 'curated') return meal.healthBenefit || 'System recipe';
    if (meal.kind === 'favorite') return 'Saved favorite';
    const mealType = meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : 'Meal';
    const times = meal.timesLogged === 1 ? 'logged once' : `${meal.timesLogged} times`;
    return `${mealType} · ${times} · last on ${meal.lastEatenAt.slice(0, 10)}`;
  }

  function renderTimeFields() {
    return (
      <View style={styles.timeRow}>
        <AppTextInput
          value={time.hour}
          onChangeText={(text) => setTime((current) => ({ ...current, hour: text }))}
          style={styles.timeInput}
          keyboardType="number-pad"
          placeholder="12"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <AppTextInput
          value={time.minute}
          onChangeText={(text) => setTime((current) => ({ ...current, minute: text }))}
          style={styles.timeInput}
          keyboardType="number-pad"
          placeholder="30"
          placeholderTextColor={colors.textMuted}
        />
        {(['AM', 'PM'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pill, time.ampm === option ? styles.pillActive : null]}
            activeOpacity={0.8}
            onPress={() => setTime((current) => ({ ...current, ampm: option }))}
          >
            <Text style={[styles.pillText, time.ampm === option ? styles.pillTextActive : null]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderList() {
    return (
      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        data={sections}
        keyExtractor={(section) => section.key}
        ListHeaderComponent={
          <View style={styles.headerStack}>
          <View style={[styles.panel, styles.listHeader]}>
            {/* Says what this screen is for before anything is picked,
                2026-09-13, the same line the Food row that opens it carries. */}
            <Text style={styles.muted}>
              Every meal you can reach without opening a builder: meals you have logged or saved, meals already on your schedule, and the system recipes. Tap a group to open it, then tap a meal to see what it is made of.
            </Text>
            <Text style={styles.muted}>
              From an opened meal: Use this meal logs it now, logs it for earlier today, puts it on your schedule, or swaps it in for a meal that was planned. Or tick dishes, from as many meals as you like, and build a new meal from them.
            </Text>
            {photoUri ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Finishing this photo</Text>
                <Image source={{ uri: photoUri }} style={styles.draftPhoto} />
                <Text style={styles.muted}>
                  Nothing is read from the picture. It is kept with whatever you pick, and the meal is dated to when
                  the photo was taken.
                </Text>
              </View>
            ) : null}
            <View style={styles.scopeRow}>
              {(
                [
                  { value: 'yours' as const, label: 'Your meals' },
                  { value: 'system' as const, label: 'System recipes' },
                ]
              ).map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pill, scope === option.value ? styles.pillActive : null]}
                  activeOpacity={0.8}
                  onPress={() => setScope(option.value)}
                >
                  <Text style={[styles.pillText, scope === option.value ? styles.pillTextActive : null]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder={scope === 'yours' ? 'Search your meals' : 'Search system recipes'}
              placeholderTextColor={colors.textMuted}
            />
            {loading ? <ActivityIndicator color={colors.accent} /> : null}
          </View>
          {/* The meal being put together from ticked dishes, shown whole
              before it is built (2026-09-13: "show the entire meal to let
              the user choose to create this combination of food as a
              meal"). Every ticked dish from every opened meal, each
              removable here, and one button that builds from all of them. */}
          {tickedList.length > 0 ? (
            <HomeSectionBand kind="static" title="Meal you are building" icon="construct-outline" color={colors.tabFood} contentStyle={styles.sectionBody}>
              <Text style={styles.muted}>
                {`${tickedList.length} dish${tickedList.length === 1 ? '' : 'es'} ticked so far. Open more meals below and tick what else belongs on the plate, then build it.`}
              </Text>
              {Object.entries(tickedDishes).map(([key, dish]) => (
                <View key={key} style={[styles.rowWrap, styles.row]}>
                  <Ionicons name="checkbox" size={18} color={colors.accent} style={textShadow} />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {dish.name}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {`From ${dish.from}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleDishTicked(key, dish)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.useButton} activeOpacity={0.85} onPress={buildMealWithTicked}>
                <Ionicons name="construct-outline" size={16} color={colors.background} />
                <Text style={styles.useButtonText}>{`Build a meal with these ${tickedList.length} dish${tickedList.length === 1 ? '' : 'es'}`}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buildButton} activeOpacity={0.85} onPress={() => setTickedDishes({})}>
                <Text style={styles.buildButtonText}>Clear the ticks</Text>
              </TouchableOpacity>
            </HomeSectionBand>
          ) : null}
        </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.card}>
              <Text style={styles.muted}>
                {query.trim()
                  ? 'Nothing here matches that.'
                  : scope === 'yours'
                    ? 'Meals you log, favorite, or have coming up on your schedule show up here. System recipes are under the other tab.'
                    : 'Every system recipe shows up here to log or schedule.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item: section }) => (
          <HomeSectionBand
            kind="fold"
            title={`${section.label} (${section.rows.length})`}
            icon={section.icon}
            color={colors.tabFood}
            expanded={query.trim().length > 0 || openSections.has(section.key)}
            onToggle={() => toggleSection(section.key)}
            contentStyle={styles.sectionBody}
          >
            {section.rows.map((item) => {
              const expanded = expandedKey === item.key;
              const detail = detailByKey[item.key];
              const teaser = item.meal.kind === 'curated' ? CURATED_TEASER_BY_ID.get(item.meal.id) : undefined;
              return (
                <View key={item.key} style={styles.rowWrap}>
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.8}
                    onPress={() => toggleExpanded(item.key, item.meal)}
                  >
                    <Ionicons
                      name={
                        item.meal.kind === 'favorite'
                          ? 'star-outline'
                          : item.meal.kind === 'curated'
                            ? 'book-outline'
                            : item.meal.kind === 'planned'
                              ? 'calendar-outline'
                              : 'restaurant-outline'
                      }
                      size={18}
                      color={colors.accent}
                      style={textShadow}
                    />
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowName} numberOfLines={2}>
                        {item.meal.name}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {describeMeal(item.meal)}
                      </Text>
                      {/* The enticement, the Digest's own line for this
                          dish, shown before anything is opened. */}
                      {teaser ? (
                        <Text style={styles.rowTeaser} numberOfLines={expanded ? undefined : 2}>
                          {teaser}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={styles.expandedBlock}>
                      {loadingIngredientsKey === item.key ? (
                        <ActivityIndicator color={colors.accent} />
                      ) : (
                        <>
                          {/* Flavor and method first, then the ingredients:
                              the description someone reads before deciding,
                              with the list beneath it. Every line here is
                              something the app already stores for the dish;
                              a meal with no recorded method says nothing
                              rather than guessing one. */}
                          {item.meal.kind === 'curated' && item.meal.flavorProfile ? (
                            <Text style={styles.detailLine}>
                              <Text style={styles.detailLabel}>Flavor: </Text>
                              {item.meal.flavorProfile}
                            </Text>
                          ) : null}
                          {/* The dishes a meal is made from, each one
                              tickable into the one selection the whole
                              screen shares (see tickedDishes), so dishes
                              from several meals can go into Meal Builder
                              together. A system recipe is one dish, so it
                              gets one tick for itself. */}
                          {detail && detail.dishes.length > 0 ? (
                            <>
                              <Text style={styles.detailLine}>
                                <Text style={styles.detailLabel}>Made from these dishes. </Text>
                                Tick any to combine with dishes from other meals.
                              </Text>
                              {detail.dishes.map((dish, index) => {
                                const key = `${item.key}::${dishKey(dish, index)}`;
                                const isTicked = !!tickedDishes[key];
                                return (
                                  <TouchableOpacity
                                    key={key}
                                    style={styles.dishRow}
                                    onPress={() =>
                                      toggleDishTicked(key, {
                                        name: dish.name,
                                        from: item.meal.name,
                                        item: { componentType: dish.componentType, componentId: dish.componentId },
                                      })
                                    }
                                  >
                                    <Ionicons name={isTicked ? 'checkbox' : 'square-outline'} size={20} color={colors.accent} />
                                    <Text style={styles.dishRowName} numberOfLines={1}>
                                      {dish.name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </>
                          ) : item.meal.kind === 'curated' ? (
                            <TouchableOpacity
                              style={styles.dishRow}
                              onPress={() =>
                                toggleDishTicked(`${item.key}::self`, {
                                  name: item.meal.name,
                                  from: 'System recipes',
                                  item: { curatedRecipeId: item.meal.id },
                                })
                              }
                            >
                              <Ionicons name={tickedDishes[`${item.key}::self`] ? 'checkbox' : 'square-outline'} size={20} color={colors.accent} />
                              <Text style={styles.dishRowName}>Tick to combine this dish with others into a meal</Text>
                            </TouchableOpacity>
                          ) : detail && detail.components.length > 0 ? (
                            <Text style={styles.detailLine}>
                              <Text style={styles.detailLabel}>Made from: </Text>
                              {detail.components.join(', ')}
                            </Text>
                          ) : null}
                          {detail && detail.methods.length > 0 ? (
                            <Text style={styles.detailLine}>
                              <Text style={styles.detailLabel}>How it is made: </Text>
                              {detail.methods.join(', ')}
                            </Text>
                          ) : null}
                          <Text style={styles.detailLabel}>Ingredients</Text>
                          {detail && detail.ingredients.length > 0 ? (
                            detail.ingredients.map((line, index) => (
                              <Text key={`${item.key}-ing-${index}`} style={styles.ingredientLine}>
                                {line.amount ? `${line.foodName} · ${line.amount}` : line.foodName}
                              </Text>
                            ))
                          ) : (
                            <Text style={styles.rowMeta}>No ingredients are saved for this one.</Text>
                          )}
                        </>
                      )}
                      <TouchableOpacity
                        style={styles.useButton}
                        activeOpacity={0.85}
                        onPress={() => openActionsFor(item.meal)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color={colors.background} />
                        <Text style={styles.useButtonText}>Use this meal</Text>
                      </TouchableOpacity>
                      {/* Into Meal Builder. While anything is ticked
                          anywhere on the screen, the button here builds
                          from ALL of it (the tray at the top shows the
                          combination); otherwise it takes this whole
                          meal, or this one dish for a system recipe. A
                          logged meal entered as a flat ingredient list has
                          no dishes to carry and gets no button. */}
                      {item.meal.kind === 'curated' || (detail && detail.dishes.length > 0) ? (
                        <TouchableOpacity
                          style={styles.buildButton}
                          activeOpacity={0.85}
                          onPress={() => (tickedList.length > 0 ? buildMealWithTicked() : buildMealWithWhole(item.meal, detail))}
                        >
                          <Ionicons name="construct-outline" size={16} color={colors.tabFood} />
                          <Text style={styles.buildButtonText}>
                            {tickedList.length > 0
                              ? `Build a meal with all ${tickedList.length} ticked`
                              : item.meal.kind === 'curated'
                                ? 'Build a meal with this dish'
                                : 'Build a meal with this whole meal'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </HomeSectionBand>
        )}
      />
    );
  }

  function renderActions() {
    if (!selected) return null;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.panel}>
        <Text style={styles.title}>{selected.name}</Text>
        <Text style={styles.muted}>{describeMeal(selected)}</Text>

        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleLogNow}
          disabled={busy}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Log it now'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('earlier')}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Log it earlier today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('schedule')}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Schedule it</Text>
        </TouchableOpacity>

        {plannedToday.length > 0 ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('replace')}>
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Use it instead of a planned meal</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('list')}>
          <Text style={styles.secondaryButtonText}>Back to the list</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderEarlier() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.panel}>
        <Text style={styles.title}>{selected?.name}</Text>
        <Text style={styles.sectionLabel}>What time did you eat it?</Text>
        <Text style={styles.muted}>Today, at whatever time it actually happened.</Text>
        {renderTimeFields()}
        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleLogEarlier}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Log it'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('actions')}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderSchedule() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.panel}>
        <Text style={styles.title}>{selected?.name}</Text>
        <Text style={styles.sectionLabel}>When should this be scheduled?</Text>
        <View style={styles.quickDateRow}>
          {[
            { label: 'Today', value: todayLocalDateString() },
            { label: 'Tomorrow', value: dateStringDaysFromToday(1) },
            { label: 'In a week', value: dateStringDaysFromToday(7) },
          ].map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[styles.pill, dateText === option.value ? styles.pillActive : null]}
              activeOpacity={0.8}
              onPress={() => setDateText(option.value)}
            >
              <Text style={[styles.pillText, dateText === option.value ? styles.pillTextActive : null]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppTextInput
          value={dateText}
          onChangeText={setDateText}
          style={styles.searchInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
        />
        {renderTimeFields()}
        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleSchedule}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Schedule it'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('actions')}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderReplace() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.panel}>
        <Text style={styles.title}>{selected?.name}</Text>
        <Text style={styles.sectionLabel}>Which planned meal did this replace?</Text>
        <Text style={styles.muted}>
          It gets logged at the planned meal&apos;s own time, and that meal stops sitting on your schedule waiting.
        </Text>
        {plannedToday.map((planned) => (
          <TouchableOpacity
            key={planned.id}
            style={[styles.rowWrap, styles.row]}
            activeOpacity={0.8}
            onPress={() => handleReplacePlanned(planned)}
            disabled={busy}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.accent} style={textShadow} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowName} numberOfLines={2}>
                {planned.title}
              </Text>
              <Text style={styles.rowMeta}>
                {planned.scheduledFor.length >= 16 ? formatTime12(planned.scheduledFor.slice(11, 16)) : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('actions')}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      {infoAlertElement}
      {mode === 'list'
        ? renderList()
        : mode === 'actions'
          ? renderActions()
          : mode === 'earlier'
            ? renderEarlier()
            : mode === 'schedule'
              ? renderSchedule()
              : renderReplace()}
    </View>
  );
}

const styles = StyleSheet.create({
  // No fill of its own: the Food tab's background shows through, the
  // same as behind every builder.
  screen: { flex: 1 },
  // The band look, 2026-09-13 (see components/HomeSectionBand.tsx), the
  // same as every Food builder: no horizontal padding, every box edge to
  // edge in the Food colour, the standard gap between them.
  content: { paddingHorizontal: 0, paddingTop: 5, gap: HOME_BAND_GAP },
  panel: { ...homeBandStyle, borderColor: colors.tabFood, padding: HOME_BAND_CONTENT_PADDING, gap: 10 },
  listHeader: { marginBottom: 0 },
  // The header panel and, once anything is ticked, the tray beneath it,
  // the standard gap apart like every other band on the screen.
  headerStack: { gap: HOME_BAND_GAP },
  // The rows inside a section band, the standard gap apart, no top padding
  // since the band's header row already separates its name from the first.
  sectionBody: { gap: HOME_BAND_GAP },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4, ...textShadow },
  // textPrimary rather than textMuted: textMuted measures under 3:1 on the
  // surface (2026-09-12).
  muted: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  // The photo-draft block inside the list header's own band: a quiet inset
  // box, since a band inside a band would put its accent 16px in.
  card: { padding: 12, borderRadius: 10, backgroundColor: colors.surfaceMuted, gap: 6 },
  draftPhoto: { width: '100%', height: 160, borderRadius: 10, backgroundColor: colors.border },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  // The border and fill moved to this wrapper so an expanded row reads as one
  // card holding its own ingredients, rather than a card with a separate block
  // floating under it.
  // A meal inside its section's band: an inset box rather than a second
  // band (a band inside a band would put its accent 16px in).
  rowWrap: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  rowTeaser: { ...typography.caption, color: colors.textPrimary, lineHeight: 17, marginTop: 2, ...textShadow },
  detailLine: { ...typography.caption, color: colors.textPrimary, lineHeight: 17, ...textShadow },
  detailLabel: { ...typography.captionEmphasis, color: colors.tabFood, fontWeight: '400', marginTop: 4, ...textShadow },
  expandedBlock: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  ingredientLine: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 10,
  },
  dishRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dishRowName: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  // Outlined in the Food colour, beneath the filled Use this meal: the
  // second action, not the primary one.
  buildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.tabFood,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  buildButtonText: { ...typography.bodyEmphasis, color: colors.tabFood, ...textShadow },
  useButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  scopeRow: { flexDirection: 'row', gap: 8 },
  rowTextWrap: { flex: 1, gap: 2 },
  rowName: { ...typography.body, color: colors.textPrimary, ...textShadow },
  rowMeta: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    width: 64,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
    ...textShadow,
  },
  timeSeparator: { ...typography.body, color: colors.textSecondary, ...textShadow },
  quickDateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  pillText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  // Dark text on the light accent fill: cancel the shadow it would otherwise
  // inherit. See constants/typography.ts.
  pillTextActive: { color: colors.background, textShadowColor: 'transparent', textShadowRadius: 0 },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
});
