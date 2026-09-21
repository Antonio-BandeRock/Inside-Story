import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors, inputBackground } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from './HomeSectionBand';
import { textShadow, typography } from '../constants/typography';
import {
  correctFoodTrialStartDate,
  createMealFromComponents,
  findTrialsAffectedByMealEdit,
  getConditionStages,
  getMeal,
  getMealComponentDisplayInfo,
  getMealComponents,
  getMealComponentsGoitrogenicFlags,
  getMealFavorite,
  getNutrientChartDataForIngredients,
  getUserConditions,
  listAllConditions,
  listCuratedRecipeComponentOptions,
  listFavorites,
  listMealComponentOptions,
  listRecentDistinctMeals,
  listScheduledMealsForDateRange,
  markScheduledMealLogged,
  materializeCuratedRecipeAsMealComponent,
  resolveMealComponent,
  revertFoodTrialToWaiting,
  saveMealFavorite,
  scheduleMeal,
  setConditionStage,
  updateMealFromComponents,
  type CuratedComponentOption,
  type MealComponentOption,
  type MealComponentSelection,
  type MealComponentType,
  type MealIngredientInput,
  type TrialNeedingReconciliation,
} from '../lib/db';
import { getConditionStagingModel, resolveDeclaredStage, type DeclaredConditionStage } from '../lib/conditionStages';
import { parseAmountValue } from '../lib/measurement';
import type { BuildMealHandoff } from '../lib/mealBuilderHandoff';
import { computeRecipeDepth, type RecipeDepthResult } from '../lib/recipeDepth';
import { buildTime24, describeTimeInputProblem, formatTime12, type TimeOfDayInput } from '../lib/timeOfDay';
import { useActiveField, useActiveInputControls } from './ActiveInputContext';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { HelpButton, type HelpSection } from './HelpButton';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { RecipeDepthReport } from './RecipeDepthReport';
import { VoiceInputButton } from './VoiceInputButton';

// Deliberately last of the ten Food-tab builders, per this app's own build
// order (see CLAUDE.md's Next steps) -- this is the only one that assembles
// FROM the other nine's own saved output instead of building its own from
// raw ingredients, so it couldn't exist until they did. See the published
// design doc (linked from CLAUDE.md's Status section) for the full
// pipeline/schema reasoning; this file is Phase 2+4 of that doc's own
// 4-phase build sequence -- assemble a meal from saved sides/salads/etc and
// log it now, plus reconnect Schedule's/Home's "Log now" deep link, which
// has pointed at a dead end since the old all-in-one meal builder was
// deleted 2026-07-25. Phase 3 ("Save & Schedule for later," a convenience
// shortcut distinct from fixing that deep link) is deliberately deferred --
// Schedule already has its own independent "schedule a meal" flow that
// doesn't require Meal Builder at all, so this isn't a hard gap the way the
// Log Now dead end was.
//
// 2026-09-13: a meal is no longer assembled only from what the person has
// built. Every "Add from..." category lists the system recipes of that
// builder alongside the person's own saved dishes (a system pick becomes a
// hidden carrier record the moment it is confirmed, see
// materializeCuratedRecipeAsMealComponent in lib/db.ts), and "Start from a
// meal you have" loads a meal favorite, a meal on the schedule, or a past
// logged meal as the starting point. The old "nothing to build from yet"
// gate is gone with it: there is always something to build from now.
//
// Same vocabulary as Schedule's own mealTypes -- kept as a separate literal
// here rather than importing across screen files, same precedent already
// used elsewhere in this app (e.g. SideBuilder's own COOKING_METHODS).
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'salad', 'smoothie'];

// Same fixed fraction/whole-number list every other builder's own amount
// pickers already use (see SideBuilder's own AMOUNT_PICKER_VALUES) --
// interpreted here as "how many of the record's own servings did you have,"
// not a raw ingredient quantity.
const SHARE_PICKER_VALUES = ['1/8', '1/4', '1/3', '1/2', '2/3', '3/4', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const CATEGORY_META: { type: MealComponentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'side', label: 'Side', icon: 'fast-food-outline' },
  { type: 'salad', label: 'Salad', icon: 'leaf-outline' },
  { type: 'smoothie', label: 'Smoothie', icon: 'wine-outline' },
  { type: 'fermentation', label: 'Fermentation', icon: 'flask-outline' },
  { type: 'beverage', label: 'Beverage', icon: 'cafe-outline' },
  { type: 'snack', label: 'Snack', icon: 'nutrition-outline' },
  { type: 'bakedGoods', label: 'Baked Goods', icon: 'pizza-outline' },
  { type: 'soup', label: 'Soup', icon: 'flame-outline' },
  { type: 'sauce', label: 'Sauce', icon: 'water-outline' },
  // Added 2026-08-08 -- a real, separate gap found while building the
  // "nothing to build from yet" check below: Handhelds Builder (the 11th
  // sub-builder, added 2026-08-04) was already fully wired into
  // MealComponentType/listMealComponentOptions/getComponentDetail (see
  // lib/db.ts), but this grid itself was never updated to actually offer it
  // as an "Add from..." category -- 'layers-outline', matching that
  // builder's own icon in FOOD_LENSES (app/(tabs)/food.tsx).
  { type: 'handheld', label: 'Handheld', icon: 'layers-outline' },
  // Added 2026-08-14, proactively this time rather than found as a gap
  // after the fact -- Handhelds' own 2026-08-08 miss (see the comment
  // right above) is exactly why Dessert Builder's own MealComponentType/
  // listMealComponentOptions/getComponentDetail wiring (lib/db.ts) and this
  // grid entry were added in the same pass, not left for a later report.
  { type: 'dessert', label: 'Dessert', icon: 'ice-cream-outline' },
];

// 2026-08-16, direct report: someone landing here via Past Meals' own
// "Adjust" link (editMealId mode) never passes through Food's own LensHub
// at all, so its Info tile (see food.tsx's own FOOD_LENS_COPY.mealBuilder)
// never gets a chance to explain any of this -- and even reached the normal
// way, that text is a wall of prose read once, before ever touching the
// screen it's describing. This is a real, second, in-context copy of the
// same explanation, live on the one screen ("Your Meal") this actually
// needs answering on, regardless of how someone got there.
const MEAL_BUILDER_HELP: HelpSection[] = [
  {
    heading: '"Add from...": what it actually does',
    body: "Each button opens that one builder's dishes: anything you have built and saved there yourself, followed by the system recipes for that builder. Tap a category, pick a dish from either list, then say how much of it you actually had. A search box at the top of the list finds a dish by its name or by an ingredient in it, across both lists at once. Picking a system recipe never adds it to your saved dishes; it only becomes part of this meal.",
  },
  {
    heading: 'Start from a meal you have',
    body: 'Instead of adding one dish at a time, load a whole meal as the starting point: one of your meal favorites, a meal already on your schedule, or a meal you have logged before. Everything in it lands here with its amounts, and you can add, remove, or change any of it before logging. Loading one replaces whatever is in this meal so far, and it asks first if anything is.',
  },
  {
    heading: 'What the percent under each item means',
    body: "That percent is how much of THAT ONE SAVED ITEM's stated servings you're counting toward this meal, not a share of the whole meal split between people. 100% means you're counting the entire saved amount; 50% means about half of it; 0% means none of it happened, and it should probably be removed instead.",
  },
  {
    heading: 'Adjusting a past meal',
    body: "If this meal was filled in automatically from something you'd scheduled, every item starts at 100%, on the assumption you had the full planned amount. Change any item's percent here if you actually had more, less, or none of it, then Save Changes. If a food you're testing in a trial is affected, you'll be asked separately whether the trial happened on a different day or never really happened at all.",
  },
];

// meals.eaten_at's own stored format ('YYYY-MM-DDTHH:mm', local time,
// truncated to the minute -- see listMealsForDate's own comment in
// lib/db.ts). new Date().toISOString() would be UTC with seconds/
// milliseconds and a trailing 'Z', silently breaking the substr(eaten_at,
// 1, 10) date matching every other Insights/Trends/Home lens already relies
// on.
function nowLocalDateTimeString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// Just the date half of nowLocalDateTimeString above -- schedule_items'
// own scheduled_for column wants "YYYY-MM-DDTHH:mm" too (see Schedule's own
// todayDateString in app/(tabs)/schedule.tsx), local time same as above.
function todayLocalDateString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// How far ahead "Start from a meal you have" looks for planned meals: one
// whole 6-week plan, the same window Log or Schedule a Meal uses.
const STARTING_POINT_LOOKAHEAD_DAYS = 42;

function dateStringDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "today at 6:30 PM", "tomorrow at 12:30 PM", or the date for anything
// further out, from a schedule_items scheduled_for ("YYYY-MM-DDTHH:mm").
function describeScheduledFor(scheduledFor: string): string {
  const day = scheduledFor.slice(0, 10);
  const time = scheduledFor.length >= 16 ? formatTime12(scheduledFor.slice(11, 16)) : '';
  const when = day === todayLocalDateString() ? 'today' : day === dateStringDaysFromToday(1) ? 'tomorrow' : `on ${day}`;
  return time ? `${when} at ${time}` : when;
}

// One whole meal offered as a starting point. A planned meal loads through
// its carrier favorite (the same resolution Log Now already uses), a favorite
// through itself, a logged meal through its own meal_components rows.
type StartingPoint =
  | { kind: 'planned'; key: string; favoriteId: string; name: string; mealType: string | null; detail: string }
  | { kind: 'favorite'; key: string; favoriteId: string; name: string; mealType: string | null; detail: string }
  | { kind: 'logged'; key: string; mealId: string; name: string; mealType: string | null; detail: string };

// Name or ingredient match for the "Add from..." search box: someone might
// remember "the side with broccoli in it" as readily as its given name, and
// both saved and system rows carry an ingredient summary.
function optionMatchesQuery(option: MealComponentOption, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return option.name.toLowerCase().includes(query) || (option.ingredientNames ?? '').toLowerCase().includes(query);
}

// Part 5's own "Fix the date" step, 2026-08-14 -- the trial-correction date
// picker offers Today/Yesterday as one-tap choices (the two by far most
// likely real answers to "I ate it, just not exactly on schedule") before
// falling back to a typed custom date.
function yesterdayLocalDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Same 12-value hour/60-value minute lists Profile's own time pickers use
// (see app/profile.tsx's own HOUR_OPTIONS/MINUTE_OPTIONS) -- "Save &
// Schedule for Later" below reuses that exact Hour/Minute/AM-PM PopoverSelect
// shape, not a new time-entry pattern.
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// One selected component, as this builder tracks it on screen -- carries
// its own display name/servings alongside the bare componentType/
// componentId/yourSharePercent MealComponentSelection needs, so the "Your
// Meal" summary card never has to re-fetch anything just to render a row.
// `key` is unique per SELECTION, not per record -- the same saved side can
// genuinely be added to one meal twice (e.g. two small servings logged
// separately rather than one larger one).
type SelectedComponent = {
  key: string;
  componentType: MealComponentType;
  componentId: string;
  name: string;
  servings: number;
  yourSharePercent: number;
};

function toSelection(component: SelectedComponent): MealComponentSelection {
  return { componentType: component.componentType, componentId: component.componentId, yourSharePercent: component.yourSharePercent };
}

export function MealBuilder({
  tabColor,
  // Set when reached via Schedule's/Home's "Log now" action (see
  // app/(tabs)/food.tsx's own scheduleItemId handling) -- 2026-08-02. On
  // finish, links the new meal back to that scheduled occurrence
  // (markScheduledMealLogged) and returns to wherever Log Now was tapped
  // from, instead of resetting to a blank meal the way a fresh visit does.
  scheduleItemId,
  // The scheduled occurrence's own meal type/title, prefilled straight into
  // the identity step -- and, when set, skipping that step's own Continue
  // gate entirely (see identityConfirmed's own initializer below), since
  // both are already known and re-asking them would just be friction on
  // top of what Log Now is supposed to be a shortcut past.
  initialMealType,
  initialTitle,
  // The scheduled occurrence's own sourceMealId, if any -- when that meal
  // was itself built by Meal Builder (has real meal_components rows), its
  // component selections are loaded back in below so "Log now" resumes
  // with the same sides/salads/etc already chosen rather than an empty
  // meal. A meal with no meal_components (built by the old, deleted
  // builder, or never built via Meal Builder at all) simply leaves
  // `components` empty -- still lets the person log something real today,
  // just not a literal replay of that older meal's own flattened
  // ingredients, which would need a whole separate read-only rendering
  // path for an increasingly rare, legacy case.
  templateMealId,
  // Set when reached via a saved meal favorite's own "Use this Favorite"
  // tap (see app/food-items.tsx) -- 2026-08-08. Same shape as
  // templateMealId just above (resolves each saved component via
  // getMealComponentDisplayInfo), except sourced from getMealFavorite
  // instead of getMealComponents, and it also prefills mealName/mealType
  // from the favorite's own name/mealType, since a favorite is reached
  // with no other identity info the way Log Now's initialMealType/
  // initialTitle props already carry. Skips the identity step entirely
  // (see identityConfirmed's own initializer below) for the same reason
  // scheduleItemId does -- resuming a favorite isn't a fresh choice of
  // what to build.
  favoriteId,
  // Set when reached via Past Meals (Schedule's own PastMealsLens, see
  // app/(tabs)/food.tsx's own editMealId handling) -- 2026-08-14. Unlike
  // templateMealId just above (which means "start a brand-new meal,
  // prefilled from this one as a starting point"), this is the exact real
  // meal, adjusted in place -- resolved with the same real
  // getMealComponents/getMealComponentDisplayInfo pattern templateMealId
  // already uses, but saved via updateMealFromComponents, not
  // createMealFromComponents, and with a real trial-reconciliation check
  // (findTrialsAffectedByMealEdit) run right after. See this file's own
  // saveEditedMeal for the full save path.
  editMealId,
  // A whole meal or a few dishes picked out of one on Log or Schedule a
  // Meal, 2026-09-13, arriving through the `buildMealFrom` route param
  // (see lib/mealBuilderHandoff.ts and the effect below).
  buildFrom,
  // Told once the handoff has been loaded, so the Food tab can stop
  // passing it.
  onBuildFromConsumed,
}: {
  tabColor: string;
  scheduleItemId?: string;
  initialMealType?: string;
  initialTitle?: string;
  templateMealId?: string;
  favoriteId?: string;
  editMealId?: string;
  buildFrom?: BuildMealHandoff | null;
  onBuildFromConsumed?: () => void;
}) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  // Scrolling an opened meal in the Start-from picker to the top of the
  // screen, 2026-09-13, the same measure-then-scroll Log or Schedule a
  // Meal and the Digest use: an opened row that stays where it was may
  // not even be on screen once its dishes render beneath it.
  const startingPointsScrollRef = useRef<ScrollView>(null);
  const startingPointsScrollY = useRef(0);
  const startingPointRowRefs = useRef<Record<string, View | null>>({});
  function scrollStartingPointToTop(rowKey: string, attemptsLeft = 10) {
    requestAnimationFrame(() => {
      const row = startingPointRowRefs.current[rowKey];
      const scrollNode = startingPointsScrollRef.current;
      if (!row || !scrollNode) {
        if (attemptsLeft > 0) scrollStartingPointToTop(rowKey, attemptsLeft - 1);
        return;
      }
      row.measure((_x, _y, _w, _h, _rowPageX, rowPageY) => {
        (scrollNode as unknown as View).measure((_sx, _sy, _sw, _sh, _scrollPageX, scrollPageY) => {
          const y = Math.max(startingPointsScrollY.current + (rowPageY - scrollPageY) - 10, 0);
          scrollNode.scrollTo({ y, animated: true });
        });
      });
    });
  }
  const activeField = useActiveField();
  const { forceClear } = useActiveInputControls();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  // Same navigation-isn't-a-real-blur fix every other Food builder already
  // needs -- see SideBuilder's own dismissKeyboard comment for why this
  // pair of calls (not just activeField?.blur()) is required.
  function dismissKeyboard() {
    activeField?.blur();
    forceClear();
  }

  const [mealName, setMealName] = useState(initialTitle ?? '');
  const [mealType, setMealType] = useState<string | null>(initialMealType || null);
  // Reached via Log Now, via a saved favorite's own "Use this Favorite"
  // tap, or via Past Meals' own editMealId, already knows both of the
  // above -- skips straight to assembling instead of showing an identity
  // form for information that's already settled (the favoriteId/editMealId
  // effects below fill mealName/mealType in asynchronously; identityReady/
  // the assembling screen tolerate a beat of "No meal type chosen" while
  // that load is still in flight, the same way templateMealId's own
  // component list starts empty and fills in).
  const [identityConfirmed, setIdentityConfirmed] = useState(!!scheduleItemId || !!favoriteId || !!editMealId || !!buildFrom?.mealType);

  // The 2026-08-08 "nothing to build from yet" gate (Continue blocked until
  // some other builder had a saved record) is gone as of 2026-09-13: every
  // category now lists the system recipes too, so a first-time user can
  // assemble a whole meal without having built anything first.
  const identityReady = !!mealType;

  const [components, setComponents] = useState<SelectedComponent[]>([]);

  // "Start from a meal you have", 2026-09-13. Three kinds of whole meal this
  // app already holds, each loaded into `components` the same way the
  // templateMealId/favoriteId effects below already resolve one: a meal
  // favorite (its own components), a meal still planned on the schedule
  // (its carrier favorite's components, the same resolution Log Now uses),
  // and a past logged meal that was assembled from components (its own
  // meal_components rows). A past meal entered as a flat ingredient list
  // has no components to load and is left out rather than shown as an
  // empty row. Loaded only when the picker is opened, since the rest of
  // this screen never needs any of it.
  const [browsingStartingPoints, setBrowsingStartingPoints] = useState(false);
  const [startingPointsLoading, setStartingPointsLoading] = useState(false);
  const [startingPoints, setStartingPoints] = useState<StartingPoint[]>([]);
  const [startingPointSearch, setStartingPointSearch] = useState('');
  const [loadingStartingPoint, setLoadingStartingPoint] = useState(false);

  async function openStartingPoints() {
    dismissKeyboard();
    setBrowsingStartingPoints(true);
    setStartingPointsLoading(true);
    setStartingPointSearch('');
    try {
      const [favorites, scheduled, recent] = await Promise.all([
        listFavorites(200, 'meal'),
        listScheduledMealsForDateRange(todayLocalDateString(), dateStringDaysFromToday(STARTING_POINT_LOOKAHEAD_DAYS)),
        listRecentDistinctMeals(200),
      ]);
      const rows: StartingPoint[] = [];
      // One row per distinct planned name, the same dedupe Log or Schedule a
      // Meal already makes: a 6-week plan repeats its dishes.
      const seenPlanned = new Set<string>();
      for (const item of scheduled) {
        if (item.status !== 'planned' || !item.sourceFavoriteId) continue;
        const nameKey = item.title.toLowerCase();
        if (seenPlanned.has(nameKey)) continue;
        seenPlanned.add(nameKey);
        rows.push({
          kind: 'planned',
          key: `planned_${item.id}`,
          favoriteId: item.sourceFavoriteId,
          name: item.title,
          mealType: item.mealType ?? null,
          detail: `On your schedule ${describeScheduledFor(item.scheduledFor)}`,
        });
      }
      for (const favorite of favorites) {
        rows.push({ kind: 'favorite', key: `favorite_${favorite.id}`, favoriteId: favorite.id, name: favorite.name, mealType: null, detail: 'A meal favorite' });
      }
      for (const meal of recent) {
        if (!meal.hasComponents) continue;
        rows.push({
          kind: 'logged',
          key: `logged_${meal.id}`,
          mealId: meal.id,
          name: meal.name,
          mealType: meal.mealType,
          detail: `Logged ${meal.timesLogged === 1 ? 'once' : `${meal.timesLogged} times`}, last ${meal.eatenAt.slice(0, 10)}`,
        });
      }
      setStartingPoints(rows);
    } finally {
      setStartingPointsLoading(false);
    }
  }

  function closeStartingPoints() {
    setBrowsingStartingPoints(false);
    setStartingPoints([]);
    setStartingPointSearch('');
    setExpandedStartingPointKey(null);
    setStartingPointDishes({});
    setTickedDishes({});
  }

  const filteredStartingPoints = useMemo(() => {
    const query = startingPointSearch.trim().toLowerCase();
    if (!query) return startingPoints;
    return startingPoints.filter((row) => row.name.toLowerCase().includes(query));
  }, [startingPoints, startingPointSearch]);

  // The dishes inside each whole meal, resolved once a row is expanded
  // (2026-09-13: "They could choose an entire meal or they could choose a
  // few sides to make up a meal"). Keyed by the row's own key; a row not
  // yet expanded has no entry.
  const [expandedStartingPointKey, setExpandedStartingPointKey] = useState<string | null>(null);
  // Which groups of the picker are open, closed until tapped, the same
  // fold Log or Schedule a Meal's groups have (2026-09-13). A search opens
  // every group that still has a match.
  const [openStartingPointGroups, setOpenStartingPointGroups] = useState<Set<string>>(new Set());
  function toggleStartingPointGroup(title: string) {
    setOpenStartingPointGroups((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }
  const [startingPointDishes, setStartingPointDishes] = useState<Record<string, SelectedComponent[]>>({});
  const [loadingDishesKey, setLoadingDishesKey] = useState<string | null>(null);
  // One selection across every opened meal, not one per meal (2026-09-13,
  // the same correction Log or Schedule a Meal took: "We need all that are
  // ticked to be included, not just the one in the recipe that contains
  // the button tapped"). Keyed by row and dish; the value is the dish
  // ready to load, plus the meal it came from for the tray.
  const [tickedDishes, setTickedDishes] = useState<Record<string, SelectedComponent & { from: string }>>({});
  const tickedList = Object.values(tickedDishes);

  async function resolveStartingPointDishes(row: StartingPoint): Promise<{ dishes: SelectedComponent[]; name: string; mealType: string | null } | null> {
    let selections: MealComponentSelection[] = [];
    let name = row.name;
    let type: string | null = row.mealType;
    if (row.kind === 'logged') {
      const records = await getMealComponents(row.mealId);
      selections = records.map((record) => ({ componentType: record.componentType, componentId: record.componentId, yourSharePercent: record.yourSharePercent }));
    } else {
      const favorite = await getMealFavorite(row.favoriteId);
      if (!favorite) return null;
      selections = favorite.components;
      if (row.kind === 'favorite') {
        name = favorite.name;
        type = favorite.mealType;
      }
    }
    const dishes: SelectedComponent[] = [];
    for (const selection of selections) {
      const detail = await getMealComponentDisplayInfo(selection.componentType, selection.componentId);
      // A dish whose saved record is gone is dropped, the same silent-drop
      // every other load path here makes.
      if (!detail) continue;
      dishes.push({
        key: `${selection.componentType}_${selection.componentId}_${dishes.length}`,
        componentType: selection.componentType,
        componentId: selection.componentId,
        name: detail.name,
        servings: detail.servings,
        yourSharePercent: selection.yourSharePercent,
      });
    }
    return { dishes, name, mealType: type };
  }

  async function toggleStartingPointExpanded(row: StartingPoint) {
    if (expandedStartingPointKey === row.key) {
      setExpandedStartingPointKey(null);
      return;
    }
    setExpandedStartingPointKey(row.key);
    scrollStartingPointToTop(row.key);
    if (startingPointDishes[row.key]) return;
    setLoadingDishesKey(row.key);
    try {
      const resolved = await resolveStartingPointDishes(row);
      setStartingPointDishes((current) => ({ ...current, [row.key]: resolved?.dishes ?? [] }));
    } finally {
      setLoadingDishesKey(null);
    }
  }

  function toggleDishTicked(key: string, dish: SelectedComponent & { from: string }) {
    setTickedDishes((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = dish;
      return next;
    });
  }

  // Puts a set of dishes into this meal, replacing what is there (after
  // asking, if anything is), then lands on the assembling screen. The one
  // path every way of loading a whole or partial meal ends in: the
  // Start-from picker above, and the handoff from Log or Schedule a Meal
  // below.
  async function loadDishesIntoMeal(
    dishes: SelectedComponent[],
    sourceName: string,
    name: string | null,
    type: string | null,
    options?: { skipConfirm?: boolean },
  ) {
    if (dishes.length === 0) {
      showInfoAlert('Nothing to load', 'None of the dishes in that meal could be found any more, so there is nothing to start from.');
      return;
    }
    if (components.length > 0 && !options?.skipConfirm) {
      const ok = await confirmSheet({
        title: 'Replace what is in this meal?',
        message: `Everything added so far will be replaced by what you picked from "${sourceName}".`,
        confirmLabel: 'Replace',
        destructive: true,
      });
      if (!ok) return;
    }
    // Only fill a name or type that has not been chosen yet: reaching here
    // from the identity step means neither has, but from the assembling
    // screen the person may already have named this meal deliberately.
    if (!mealName.trim() && name) setMealName(name);
    if (!mealType && type) setMealType(type);
    const stamp = Date.now();
    setComponents(dishes.map((dish, index) => ({ ...dish, key: `${dish.key}_${stamp}_${index}` })));
    // A meal type is still required to log anything, so a starting point
    // that carries none leaves the identity step showing (with the dishes
    // already loaded) rather than skipping past the one question left.
    if (mealType || type) setIdentityConfirmed(true);
    closeStartingPoints();
  }

  // One whole meal, keeping its name and type.
  async function chooseStartingPoint(row: StartingPoint) {
    setLoadingStartingPoint(true);
    try {
      const resolved = startingPointDishes[row.key]
        ? { dishes: startingPointDishes[row.key], name: row.name, mealType: row.mealType }
        : await resolveStartingPointDishes(row);
      if (!resolved) {
        showInfoAlert('Meal not found', 'That meal could not be opened. It may have been removed.');
        return;
      }
      await loadDishesIntoMeal(resolved.dishes, row.name, resolved.name, resolved.mealType);
    } finally {
      setLoadingStartingPoint(false);
    }
  }

  // Everything ticked, from however many meals. A combination is not any
  // of the meals it was drawn from, so it carries no name and no type.
  async function chooseTickedDishes() {
    await loadDishesIntoMeal(tickedList, 'the meals you ticked from', null, null);
  }

  // The handoff from Log or Schedule a Meal (lib/mealBuilderHandoff.ts):
  // a whole meal or a few dishes picked out of one, arriving as a route
  // param. Runs once per distinct handoff. A system recipe among the items
  // has no saved record yet and is made here, hidden, the same as one
  // picked from "Add from...".
  const handledBuildFrom = useRef<string | null>(null);
  useEffect(() => {
    if (!buildFrom) return;
    const signature = JSON.stringify(buildFrom);
    if (handledBuildFrom.current === signature) return;
    handledBuildFrom.current = signature;
    let isCurrent = true;
    (async () => {
      const dishes: SelectedComponent[] = [];
      for (const item of buildFrom.items) {
        if ('curatedRecipeId' in item) {
          const made = await materializeCuratedRecipeAsMealComponent(item.curatedRecipeId);
          if ('error' in made) continue;
          dishes.push({
            key: `${made.componentType}_${made.componentId}`,
            componentType: made.componentType,
            componentId: made.componentId,
            name: made.name,
            servings: made.servings,
            yourSharePercent: 100,
          });
        } else {
          const detail = await getMealComponentDisplayInfo(item.componentType, item.componentId);
          if (!detail) continue;
          dishes.push({
            key: `${item.componentType}_${item.componentId}`,
            componentType: item.componentType,
            componentId: item.componentId,
            name: detail.name,
            servings: detail.servings,
            yourSharePercent: 100,
          });
        }
      }
      if (!isCurrent) return;
      // Arriving from another lens is a fresh start, not an edit of
      // something half-built here, so nothing is asked before loading.
      await loadDishesIntoMeal(dishes, buildFrom.name ?? 'that meal', buildFrom.name ?? null, buildFrom.mealType ?? null, { skipConfirm: true });
      onBuildFromConsumed?.();
    })();
    return () => {
      isCurrent = false;
    };
    // loadDishesIntoMeal reads the current name, type and dishes, and this
    // must run once per handoff, not again on every edit to those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildFrom]);

  useEffect(() => {
    if (!templateMealId) return;
    let isCurrent = true;
    (async () => {
      const records = await getMealComponents(templateMealId);
      const resolved: SelectedComponent[] = [];
      for (const record of records) {
        const detail = await getMealComponentDisplayInfo(record.componentType, record.componentId);
        // A component whose own saved record has since been deleted is
        // silently dropped here rather than shown as a broken row -- the
        // person can always re-add whatever they actually still want.
        if (!detail) continue;
        resolved.push({
          key: record.id,
          componentType: record.componentType,
          componentId: record.componentId,
          name: detail.name,
          servings: detail.servings,
          yourSharePercent: record.yourSharePercent,
        });
      }
      if (isCurrent) setComponents(resolved);
    })();
    return () => {
      isCurrent = false;
    };
  }, [templateMealId]);

  // Loads a saved meal favorite's own real data in place of the blank-
  // builder defaults above, 2026-08-08 -- runs once per favoriteId. Mirrors
  // the templateMealId effect just above almost exactly (same
  // getMealComponentDisplayInfo resolution, same silent-drop for a
  // component whose own saved record has since been deleted), except this
  // also carries the favorite's own name/mealType, which templateMealId's
  // meal record doesn't need to (Log Now already gets those from
  // initialTitle/initialMealType instead).
  useEffect(() => {
    if (!favoriteId) return;
    let isCurrent = true;
    (async () => {
      const favorite = await getMealFavorite(favoriteId);
      if (!favorite || !isCurrent) return;
      const resolved: SelectedComponent[] = [];
      for (const component of favorite.components) {
        const detail = await getMealComponentDisplayInfo(component.componentType, component.componentId);
        if (!detail) continue;
        resolved.push({
          key: `${component.componentType}_${component.componentId}_${Date.now()}_${resolved.length}`,
          componentType: component.componentType,
          componentId: component.componentId,
          name: detail.name,
          servings: detail.servings,
          yourSharePercent: component.yourSharePercent,
        });
      }
      if (!isCurrent) return;
      setMealName(favorite.name);
      setMealType(favorite.mealType);
      setComponents(resolved);
    })();
    return () => {
      isCurrent = false;
    };
  }, [favoriteId]);

  // Real, in-place editing of an already-real meal, 2026-08-14, Past Meals
  // -- mirrors templateMealId's own effect almost exactly (same
  // getMealComponents/getMealComponentDisplayInfo resolution, same
  // silent-drop for a since-deleted component), except this also loads the
  // real meal's own name/mealType (getMeal, a real gap this closed --
  // templateMealId never needed it, since Log Now already carries
  // initialTitle/initialMealType), and captures the just-loaded components
  // into originalComponentsForEdit -- saveEditedMeal (below) diffs against
  // this exact snapshot to know which real foods lost their own share,
  // needed for the trial-reconciliation check (Part 5).
  const originalComponentsForEdit = useRef<MealComponentSelection[] | null>(null);
  useEffect(() => {
    if (!editMealId) return;
    let isCurrent = true;
    (async () => {
      const [meal, records] = await Promise.all([getMeal(editMealId), getMealComponents(editMealId)]);
      if (!isCurrent) return;
      const resolved: SelectedComponent[] = [];
      for (const record of records) {
        const detail = await getMealComponentDisplayInfo(record.componentType, record.componentId);
        if (!detail) continue;
        resolved.push({
          key: record.id,
          componentType: record.componentType,
          componentId: record.componentId,
          name: detail.name,
          servings: detail.servings,
          yourSharePercent: record.yourSharePercent,
        });
      }
      if (!isCurrent) return;
      if (meal) {
        setMealName(meal.name);
        setMealType(meal.meal_type);
      }
      setComponents(resolved);
      originalComponentsForEdit.current = resolved.map(toSelection);
    })();
    return () => {
      isCurrent = false;
    };
  }, [editMealId]);

  // null: showing the "Add from..." grid. Set: showing that one category's
  // own saved-items list.
  const [browsingCategory, setBrowsingCategory] = useState<MealComponentType | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<MealComponentOption[]>([]);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(false);
  // 2026-08-16, direct request: "there should be a search utility like in
  // the Digest areas to search the saved side or whatever for the items
  // they want to add." Deliberately a plain, un-debounced filter, not
  // Digest's own DigestSearchInput machinery -- that component's
  // real complexity exists specifically to keep typing responsive against
  // a 1,500+-entry corpus re-rendering a large screen on every keystroke
  // (see its own header comment); a category's own saved-item list here is
  // one person's own real, much smaller set of saved dishes, so a plain
  // useMemo filter is genuinely fast enough without needing that same
  // isolation architecture.
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  // The system recipes of the open category, 2026-09-13, listed beneath
  // the person's own saved dishes and searched together with them.
  const [curatedOptions, setCuratedOptions] = useState<CuratedComponentOption[]>([]);

  function openCategory(type: MealComponentType) {
    dismissKeyboard();
    setBrowsingCategory(type);
    setCategoryOptionsLoading(true);
    setCategorySearchQuery('');
    Promise.all([listMealComponentOptions(type), listCuratedRecipeComponentOptions(type)]).then(([saved, curated]) => {
      setCategoryOptions(saved);
      setCuratedOptions(curated);
      setCategoryOptionsLoading(false);
    });
  }

  function closeCategory() {
    setBrowsingCategory(null);
    setCategoryOptions([]);
    setCuratedOptions([]);
    setCategorySearchQuery('');
  }

  // Searches both the saved item's own name AND its real ingredient-name
  // summary -- someone might remember "the side with broccoli in it" as
  // readily as its own given name, and MealComponentOption already carries
  // both (see lib/db.ts's own type) with no extra query needed.
  const filteredCategoryOptions = useMemo(
    () => categoryOptions.filter((option) => optionMatchesQuery(option, categorySearchQuery)),
    [categoryOptions, categorySearchQuery],
  );
  const filteredCuratedOptions = useMemo(
    () => curatedOptions.filter((option) => optionMatchesQuery(option, categorySearchQuery)),
    [curatedOptions, categorySearchQuery],
  );

  // A saved item tapped from categoryOptions, awaiting its own "how much of
  // this did you have" answer before it actually joins `components`. A
  // system recipe carries its recipeId here instead of a componentId, since
  // it has no saved record yet: that record is made when the amount is
  // confirmed, not when the row is tapped.
  const [pendingSelection, setPendingSelection] = useState<{
    componentType: MealComponentType;
    componentId: string | null;
    curatedRecipeId: string | null;
    name: string;
    servings: number;
  } | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);
  const [confirmingPending, setConfirmingPending] = useState(false);

  function selectSavedOption(option: MealComponentOption) {
    if (!browsingCategory) return;
    setPendingSelection({ componentType: browsingCategory, componentId: option.id, curatedRecipeId: null, name: option.name, servings: option.servings });
    setPendingAmount(null);
  }

  function selectCuratedOption(option: CuratedComponentOption) {
    if (!browsingCategory) return;
    setPendingSelection({ componentType: browsingCategory, componentId: null, curatedRecipeId: option.recipeId, name: option.name, servings: option.servings });
    setPendingAmount(null);
  }

  function cancelPendingSelection() {
    setPendingSelection(null);
    setPendingAmount(null);
  }

  async function confirmPendingSelection() {
    if (!pendingSelection || !pendingAmount) {
      showInfoAlert('Almost there', 'Please choose how much of this you had.');
      return;
    }
    let componentType = pendingSelection.componentType;
    let componentId = pendingSelection.componentId;
    let servings = pendingSelection.servings;
    if (!componentId) {
      if (!pendingSelection.curatedRecipeId) return;
      setConfirmingPending(true);
      try {
        const made = await materializeCuratedRecipeAsMealComponent(pendingSelection.curatedRecipeId);
        if ('error' in made) {
          showInfoAlert('Could not add that recipe', made.error);
          return;
        }
        componentType = made.componentType;
        componentId = made.componentId;
        servings = made.servings;
      } finally {
        setConfirmingPending(false);
      }
    }
    const chosenServings = parseAmountValue(pendingAmount);
    const sharePercent = servings > 0 ? (chosenServings / servings) * 100 : 100;
    const newComponent: SelectedComponent = {
      key: `${componentType}_${componentId}_${Date.now()}`,
      componentType,
      componentId,
      name: pendingSelection.name,
      servings,
      yourSharePercent: sharePercent,
    };
    setComponents((current) => [...current, newComponent]);
    setPendingSelection(null);
    setPendingAmount(null);
    // Stays on the same category's saved list, deliberately -- a meal very
    // often draws more than one item from the same builder (two sides,
    // say), so bouncing all the way back to the full "Add from..." grid
    // after every single add would be real, needless friction. The < back
    // arrow (closeCategory) is still one tap away whenever a different
    // category is actually needed next.
  }

  async function removeComponent(key: string) {
    const ok = await confirmSheet({ title: 'Remove this item?', confirmLabel: 'Remove', destructive: true });
    if (ok) setComponents((current) => current.filter((c) => c.key !== key));
  }

  const [saving, setSaving] = useState(false);
  // 2026-08-08 -- independent of the real "Log This Now" save; see
  // SideBuilder.tsx's own identical field for the full reasoning. Only
  // governs Log This Now -- "Save & Schedule for Later" below always saves
  // its own favorite regardless of this, since scheduleMeal's own
  // sourceFavoriteId needs a real favorite to point at either way (see
  // confirmScheduleForLater's own comment).
  const [alsoSaveAsFavorite, setAlsoSaveAsFavorite] = useState(!!favoriteId);

  // Meal Builder's own version of the depth report, 2026-08-25 -- direct
  // follow-up to rolling the same report out to the other 10 builders.
  // A real, structural difference from all of them, named directly rather
  // than glossed over: those 10 build FROM raw ingredients and always
  // compute and persist a real depthData onto the record they save (see
  // lib/recipeDepth.ts's own header comment); a meal here is assembled FROM
  // already-saved components, each of which may already carry its own real
  // depthData for its own full batch, not for whatever share of it actually
  // landed in this meal. Recomputing depth fresh, live, across the exact
  // combined ingredient list this specific meal draws from (via
  // resolveMealComponent, the same real per-component resolution
  // getMealComponentsGoitrogenicFlags already uses) is the honest answer for
  // THIS meal, rather than trying to merge several already-computed,
  // differently-scoped results. There's also no depth_data_json column on
  // `meals` the way the other 11 tables have -- a meal is a logged EVENT or
  // a reusable favorite template, not a browsable saved dish the way My
  // Kitchen shows sides/salads/etc, so nothing here reads a stored value
  // back later; this report is computed fresh every time it's opened,
  // purely a look before finishing, same as every other builder's own.
  const [trackedConditions, setTrackedConditions] = useState<{ code: string; name: string }[]>([]);
  const [conditionStages, setConditionStages] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [selectedCodes, allConditions, stages] = await Promise.all([getUserConditions(), listAllConditions(), getConditionStages()]);
      if (!isMounted) return;
      const selected = new Set(selectedCodes);
      setTrackedConditions(
        allConditions
          .filter((condition) => selected.has(condition.code))
          .map((condition) => ({ code: condition.code, name: condition.name })),
      );
      setConditionStages(stages);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // See SideBuilder.tsx's own identical declaredStages/
  // conditionsWithStagingModel/stagePickerFor for the full reasoning.
  const declaredStages = useMemo(() => {
    const stages: Record<string, DeclaredConditionStage> = {};
    for (const condition of trackedConditions) {
      const resolved = resolveDeclaredStage(condition.code, conditionStages[condition.code]);
      if (resolved) stages[condition.code] = resolved;
    }
    return stages;
  }, [trackedConditions, conditionStages]);

  const conditionsWithStagingModel = useMemo(
    () => new Set(trackedConditions.filter((condition) => getConditionStagingModel(condition.code)).map((condition) => condition.code)),
    [trackedConditions],
  );
  const [stagePickerFor, setStagePickerFor] = useState<{ code: string; name: string } | null>(null);

  const [showingReport, setShowingReport] = useState(false);
  const [reportData, setReportData] = useState<RecipeDepthResult | null>(null);
  const [reportNutrientData, setReportNutrientData] = useState<{ nutrient: string; percent: number }[]>([]);
  // The real, resolved ingredient count across every selected component
  // combined -- distinct from components.length (the number of DISHES this
  // meal draws from), captured once in handlePreviewReport rather than
  // recomputed on every render.
  const [reportIngredientCount, setReportIngredientCount] = useState(0);
  const [computingReport, setComputingReport] = useState(false);
  const [savingFromReport, setSavingFromReport] = useState(false);

  // Resolves every currently selected component's own real ingredients
  // (foodId/foodName/category/quantity/unit/dishServings/yourSharePercent
  // already resolved by resolveMealComponent, the same function
  // logMealNow's own createMealFromComponents ultimately reads through) and
  // flattens them into one real list. computeRecipeDepth never actually
  // reads quantity/dishServings/yourSharePercent at all (it scores by
  // foodId/source identity and foodName/category alone -- see that file's
  // own header comment), so this flattening is correct for safety/diet-tag/
  // stage purposes regardless of how much of each component was actually
  // had; the nutrient chart below is the one real place share percentage
  // still matters, and getNutrientChartDataForIngredients already applies
  // it correctly per ingredient via the same shareFraction math every other
  // real meal-nutrition view in this app already uses.
  async function buildDepthIngredientsForMeal(): Promise<MealIngredientInput[]> {
    const resolved = await Promise.all(components.map((component) => resolveMealComponent(toSelection(component))));
    return resolved.filter((component): component is NonNullable<typeof component> => component !== null).flatMap((component) => component.ingredients);
  }

  async function handlePreviewReport() {
    setComputingReport(true);
    try {
      const depthIngredients = await buildDepthIngredientsForMeal();
      const [depth, nutrientData] = await Promise.all([
        computeRecipeDepth(depthIngredients, trackedConditions),
        getNutrientChartDataForIngredients(depthIngredients, 1),
      ]);
      setReportData(depth);
      setReportNutrientData(nutrientData);
      setReportIngredientCount(depthIngredients.length);
      setShowingReport(true);
    } catch (error) {
      console.error('[MealBuilder] Failed to compute the depth report', error);
      showInfoAlert('Report failed', 'Something went wrong building the report. You can still save this meal directly.');
    } finally {
      setComputingReport(false);
    }
  }

  async function logMealNow() {
    setSaving(true);
    const result = await createMealFromComponents({
      name: mealName.trim() || 'Meal',
      mealType: mealType!,
      eatenAt: nowLocalDateTimeString(),
      isImmediate: true,
      components: components.map(toSelection),
    });
    setSaving(false);
    if ('error' in result) {
      showInfoAlert('Save failed', result.error);
      return;
    }
    // Independent of the real log above -- 2026-08-08, see SideBuilder.tsx's
    // own identical block for the full reasoning.
    if (alsoSaveAsFavorite) {
      try {
        await saveMealFavorite({ name: mealName.trim() || 'Meal', mealType: mealType!, components: components.map(toSelection) });
      } catch (error) {
        console.error('[MealBuilder] Failed to save favorite', error);
        showInfoAlert('Meal logged, favorite failed', "This meal is logged, but saving it as a favorite didn't work. You can try favoriting it again later.");
      }
    }
    if (scheduleItemId) {
      await markScheduledMealLogged(scheduleItemId, result.id);
      router.back();
      return;
    }
    const finishedName = mealName.trim() || 'Meal';
    setComponents([]);
    setMealName('');
    setMealType(null);
    setIdentityConfirmed(false);
    setAlsoSaveAsFavorite(false);
    setShowingReport(false);
    setReportData(null);
    setReportNutrientData([]);
    setStagePickerFor(null);
    showInfoAlert('Meal logged', `${finishedName} is logged. Starting a fresh meal now.`);
  }

  // 2026-08-08 -- see SideBuilder.tsx's own identical function.
  function renderFavoriteToggle() {
    return (
      <TouchableOpacity style={styles.favoriteToggleRow} onPress={() => setAlsoSaveAsFavorite((current) => !current)} activeOpacity={0.7}>
        <Ionicons name={alsoSaveAsFavorite ? 'checkbox' : 'square-outline'} size={20} color={tabColor} />
        <Text style={styles.favoriteToggleText}>Also save as a Favorite, for fast reuse later</Text>
      </TouchableOpacity>
    );
  }

  // Pools the raw-goitrogenic-load check every sub-builder already runs on
  // its own ingredient list ACROSS every selected component -- two
  // separately-built sides can each be individually fine (one raw
  // goitrogenic vegetable apiece) while still combining into the same real
  // risk those builders already warn about on their own: easy to eat far
  // more of them raw and combined than any one builder's own ingredient
  // list would show. Same Cancel/"Continue anyway" Alert shape as Salad/
  // Smoothie's own confirmAndFinishX, not a silent pass-through.
  async function confirmAndLogMealNow() {
    if (components.length === 0) {
      showInfoAlert('Nothing to log yet', 'Add at least one item to this meal first.');
      return;
    }
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setSaving(true);
    const flagged = await getMealComponentsGoitrogenicFlags(components.map(toSelection));
    setSaving(false);
    if (flagged.length >= 2) {
      const ok = await confirmSheet({
        title: 'Several raw goitrogenic foods together',
        message: `This meal combines ${flagged.length} raw goitrogenic foods (${flagged.join(', ')}) across its different parts. Eating this much of them raw at once is easy to do without realizing it when they're spread across separate sides/salads/etc. Consider cooking one first, or using less.`,
        confirmLabel: 'Continue anyway',
        cancelLabel: 'Go back and adjust',
      });
      if (ok) void logMealNow();
      return;
    }
    void logMealNow();
  }

  // "Save & Schedule for Later," 2026-08-08 -- the Phase 3 convenience
  // shortcut this file's own top comment used to flag as deliberately
  // deferred, now built. Deliberately TODAY-only (see schedulingTime's own
  // step below) -- Schedule's own Meals lens (app/(tabs)/schedule.tsx)
  // only supports "today, at a specific time" itself right now, not an
  // arbitrary future date, and this shouldn't hand Meal Builder more
  // scheduling reach than Schedule's own UI actually has.
  const [schedulingTime, setSchedulingTime] = useState(false);
  const [scheduleTimeBuffer, setScheduleTimeBuffer] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [scheduling, setScheduling] = useState(false);

  // "Add to My Hydration Routine," 2026-08-26 -- direct request: "it
  // requires a presence in Food > Meal Builder... attribute it
  // automatically somehow to their self created scheduled hydration,
  // which probably could be on a repeating daily schedule." A real,
  // separate action from "Save & Schedule for Later" above (which is
  // deliberately a one-off, today-only occurrence): this saves the same
  // kind of favorite but schedules it as a genuinely indefinite DAILY
  // repeating series (RepeatConfig {type:'daily', endType:'indefinite'}),
  // the exact same repeat/rolling-window machinery every other recurring
  // schedule item in this app already uses, reused rather than a second,
  // parallel mechanism. Only offered for a beverage-type meal -- a
  // recurring hydration slot is the one real use case this is built for,
  // not a general "repeat any meal" feature.
  const [addingToRoutine, setAddingToRoutine] = useState(false);
  const [routineTimeBuffer, setRoutineTimeBuffer] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [savingToRoutine, setSavingToRoutine] = useState(false);

  function openScheduleForLater() {
    if (components.length === 0) {
      showInfoAlert('Nothing to schedule yet', 'Add at least one item to this meal first.');
      return;
    }
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setScheduleTimeBuffer({ hour: '', minute: '', ampm: '' });
    setSchedulingTime(true);
  }

  function cancelScheduleForLater() {
    setSchedulingTime(false);
  }

  async function confirmScheduleForLater() {
    const time24 = buildTime24(scheduleTimeBuffer.hour, scheduleTimeBuffer.minute, scheduleTimeBuffer.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(scheduleTimeBuffer.hour, scheduleTimeBuffer.minute, scheduleTimeBuffer.ampm));
      return;
    }
    if (!mealType) return;
    dismissKeyboard();
    setScheduling(true);
    const finishedName = mealName.trim() || 'Meal';
    try {
      // Always saves a real favorite here, independent of
      // alsoSaveAsFavorite's own checkbox (which only governs Log This
      // Now) -- scheduleMeal's own sourceFavoriteId is how a scheduled
      // occurrence remembers which components to resume with later (the
      // same mechanism the favoriteId effect above reads back), so there's
      // no way to schedule this meal at all without a real favorite to
      // point at. Structurally required, not a preference.
      const selections = components.map(toSelection);
      // autoGenerated unless the person actually asked to keep it: this row is
      // structurally required so the scheduled occurrence can resume its
      // components, but that is not the same as choosing to favorite the meal.
      const favorite = await saveMealFavorite({
        name: finishedName,
        mealType,
        components: selections,
        autoGenerated: !alsoSaveAsFavorite,
      });
      // components passed through here too, 2026-08-14 -- so any real
      // 'waiting' food trial matching one of these ingredients activates
      // the moment this scheduled occurrence's own date arrives, not just
      // when a meal is logged right now via "Log This Now" below. See
      // activateWaitingTrialsForComponents's own comment in lib/db.ts.
      await scheduleMeal({
        title: finishedName,
        mealType,
        scheduledFor: `${todayLocalDateString()}T${time24}`,
        sourceFavoriteId: favorite.id,
        components: selections,
      });
    } catch (error) {
      console.error('[MealBuilder] Failed to schedule meal', error);
      setScheduling(false);
      showInfoAlert('Schedule failed', 'Something went wrong scheduling this meal. Please try again.');
      return;
    }
    setScheduling(false);
    setSchedulingTime(false);
    setComponents([]);
    setMealName('');
    setMealType(null);
    setIdentityConfirmed(false);
    setAlsoSaveAsFavorite(false);
    setShowingReport(false);
    setReportData(null);
    setReportNutrientData([]);
    setStagePickerFor(null);
    showInfoAlert(
      'Meal scheduled',
      `${finishedName} is scheduled for ${formatTime12(time24)} today. Find it on the Schedule tab's Meals lens.`,
    );
  }

  function openAddToRoutine() {
    if (components.length === 0) {
      showInfoAlert('Nothing to add yet', 'Add at least one item to this drink first.');
      return;
    }
    if (mealType !== 'beverage') return;
    dismissKeyboard();
    setRoutineTimeBuffer({ hour: '', minute: '', ampm: '' });
    setAddingToRoutine(true);
  }

  function cancelAddToRoutine() {
    setAddingToRoutine(false);
  }

  async function confirmAddToRoutine() {
    const time24 = buildTime24(routineTimeBuffer.hour, routineTimeBuffer.minute, routineTimeBuffer.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(routineTimeBuffer.hour, routineTimeBuffer.minute, routineTimeBuffer.ampm));
      return;
    }
    dismissKeyboard();
    setSavingToRoutine(true);
    const finishedName = mealName.trim() || 'Drink';
    try {
      const selections = components.map(toSelection);
      const favorite = await saveMealFavorite({
        name: finishedName,
        mealType: 'beverage',
        components: selections,
        autoGenerated: !alsoSaveAsFavorite,
      });
      await scheduleMeal({
        title: finishedName,
        mealType: 'beverage',
        scheduledFor: `${todayLocalDateString()}T${time24}`,
        sourceFavoriteId: favorite.id,
        components: selections,
        repeat: { type: 'daily', endType: 'indefinite' },
      });
    } catch (error) {
      console.error('[MealBuilder] Failed to add to hydration routine', error);
      setSavingToRoutine(false);
      showInfoAlert('Could not add', "Something went wrong setting this up as a repeating drink. Please try again.");
      return;
    }
    setSavingToRoutine(false);
    setAddingToRoutine(false);
    setComponents([]);
    setMealName('');
    setMealType(null);
    setIdentityConfirmed(false);
    setAlsoSaveAsFavorite(false);
    setShowingReport(false);
    setReportData(null);
    setReportNutrientData([]);
    setStagePickerFor(null);
    showInfoAlert(
      'Added to your Hydration Routine',
      `${finishedName} is now scheduled every day at ${formatTime12(time24)}, starting today. Manage it anytime from the Schedule tab's Hydration lens.`,
    );
  }

  // Part 4/5 of Past Meals, 2026-08-14 -- editMealId mode's own save path.
  // Distinct from logMealNow (which always creates a brand-new meal):
  // updateMealFromComponents adjusts the SAME real, already-logged meal in
  // place, matching Past Meals' whole point -- correcting what actually
  // happened, not logging a new event. On success, diffs the components
  // this screen loaded in against what's actually being saved for any real
  // food trial whose meal-of-record just stopped proving it happened (see
  // findTrialsAffectedByMealEdit's own comment) and walks the person
  // through a real decision for each one, one at a time.
  const [savingEdit, setSavingEdit] = useState(false);
  const [reconciliationQueue, setReconciliationQueue] = useState<TrialNeedingReconciliation[]>([]);
  const [correctingTrial, setCorrectingTrial] = useState<TrialNeedingReconciliation | null>(null);
  const [correctionDateChoice, setCorrectionDateChoice] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [correctionCustomDate, setCorrectionCustomDate] = useState('');
  const [correctionTimeBuffer, setCorrectionTimeBuffer] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [correcting, setCorrecting] = useState(false);

  // One app-styled action sheet per affected trial, chained -- matches this
  // app's own established sequential-Alert convention (see the
  // onboarding-review "already tested" flow this mirrors in spirit) rather
  // than trying to cram several unrelated decisions into one dialog.
  // Genuine local state + AppActionSheet directly, not ConfirmSheet -- each
  // of the 3 real actions here does something genuinely different and
  // stateful (revert, open a correction sub-form, or recurse to the next
  // item), not a plain true/false choice a single resolved Promise could
  // represent.
  const [reconciliationPrompt, setReconciliationPrompt] = useState<{
    next: TrialNeedingReconciliation;
    rest: TrialNeedingReconciliation[];
  } | null>(null);

  function promptNextReconciliation(queue: TrialNeedingReconciliation[]) {
    if (queue.length === 0) {
      router.back();
      return;
    }
    const [next, ...rest] = queue;
    setReconciliationPrompt({ next, rest });
  }

  const reconciliationActions: AppActionSheetAction[] = reconciliationPrompt
    ? [
        {
          label: 'Never actually happened',
          destructive: true,
          onPress: () => {
            const { next, rest } = reconciliationPrompt;
            void (async () => {
              try {
                await revertFoodTrialToWaiting(next.trial.id);
              } catch (error) {
                console.error('[MealBuilder] Failed to revert trial to waiting', error);
              }
              promptNextReconciliation(rest);
            })();
          },
        },
        {
          label: 'I ate it, just a different day',
          onPress: () => {
            const { next, rest } = reconciliationPrompt;
            setReconciliationQueue(rest);
            setCorrectingTrial(next);
            setCorrectionDateChoice('today');
            setCorrectionCustomDate('');
            setCorrectionTimeBuffer({ hour: '', minute: '', ampm: '' });
          },
        },
        {
          label: 'Decide later',
          onPress: () => promptNextReconciliation(reconciliationPrompt.rest),
        },
      ]
    : [];

  const reconciliationSheetElement = (
    <AppActionSheet
      visible={reconciliationPrompt !== null}
      onClose={() => setReconciliationPrompt(null)}
      title={reconciliationPrompt ? `${reconciliationPrompt.next.foodName} (no longer in this meal)` : undefined}
      message="You removed it, or changed how much of it you had down to none, and a food trial is actively riding on this meal as proof it was eaten. What actually happened?"
      actions={reconciliationActions}
    />
  );

  function cancelTrialDateCorrection() {
    const rest = reconciliationQueue;
    setCorrectingTrial(null);
    promptNextReconciliation(rest);
  }

  async function confirmTrialDateCorrection() {
    if (!correctingTrial) return;
    const time24 = buildTime24(correctionTimeBuffer.hour, correctionTimeBuffer.minute, correctionTimeBuffer.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(correctionTimeBuffer.hour, correctionTimeBuffer.minute, correctionTimeBuffer.ampm));
      return;
    }
    let dateStr: string;
    if (correctionDateChoice === 'today') {
      dateStr = todayLocalDateString();
    } else if (correctionDateChoice === 'yesterday') {
      dateStr = yesterdayLocalDateString();
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(correctionCustomDate.trim())) {
        showInfoAlert('Almost there', 'Enter the date as YYYY-MM-DD.');
        return;
      }
      dateStr = correctionCustomDate.trim();
    }
    dismissKeyboard();
    setCorrecting(true);
    try {
      await correctFoodTrialStartDate(correctingTrial.trial.id, `${dateStr}T${time24}`);
    } catch (error) {
      console.error('[MealBuilder] Failed to correct trial date', error);
    }
    setCorrecting(false);
    const rest = reconciliationQueue;
    setCorrectingTrial(null);
    promptNextReconciliation(rest);
  }

  async function saveEditedMeal() {
    if (!editMealId) return;
    if (components.length === 0) {
      showInfoAlert('Nothing to save', 'A meal needs at least one item. If none of this actually happened, remove the whole entry from Past Meals instead.');
      return;
    }
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setSavingEdit(true);
    const newSelections = components.map(toSelection);
    const result = await updateMealFromComponents(editMealId, {
      name: mealName.trim() || 'Meal',
      mealType,
      components: newSelections,
    });
    if ('error' in result) {
      setSavingEdit(false);
      showInfoAlert('Save failed', result.error);
      return;
    }
    const oldSelections = originalComponentsForEdit.current ?? [];
    let affected: TrialNeedingReconciliation[] = [];
    try {
      affected = await findTrialsAffectedByMealEdit(editMealId, oldSelections, newSelections);
    } catch (error) {
      console.error('[MealBuilder] Failed to check for affected food trials', error);
    }
    setSavingEdit(false);
    if (affected.length === 0) {
      router.back();
      return;
    }
    promptNextReconciliation(affected);
  }

  function handleContinuePress() {
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setIdentityConfirmed(true);
  }

  // Picking a whole meal to start from, 2026-09-13. Reachable from both the
  // identity step and the assembling screen, so it sits ahead of both.
  if (browsingStartingPoints) {
    const plannedRows = filteredStartingPoints.filter((row) => row.kind === 'planned');
    const favoriteRows = filteredStartingPoints.filter((row) => row.kind === 'favorite');
    const loggedRows = filteredStartingPoints.filter((row) => row.kind === 'logged');
    const renderGroup = (title: string, icon: 'calendar-outline' | 'heart-outline' | 'restaurant-outline', rows: StartingPoint[]) =>
      rows.length === 0 ? null : (
        <View style={styles.bandOut}>
          <HomeSectionBand
            kind="fold"
            title={`${title} (${rows.length})`}
            icon={icon}
            color={tabColor}
            expanded={startingPointSearch.trim().length > 0 || openStartingPointGroups.has(title)}
            onToggle={() => toggleStartingPointGroup(title)}
            contentStyle={styles.bandRows}
          >
            {rows.map((row) => {
              const expanded = expandedStartingPointKey === row.key;
              const dishes = startingPointDishes[row.key];

              return (
                // A meal expands to the dishes it is made from, each one
                // tickable, so the whole meal or only some of it can be
                // taken (2026-09-13). The same shape Log or Schedule a
                // Meal's rows have.
                <View
                  key={row.key}
                  style={styles.savedRowWrap}
                  ref={(node) => {
                    startingPointRowRefs.current[row.key] = node;
                  }}
                >
                  <TouchableOpacity style={styles.savedRow} onPress={() => void toggleStartingPointExpanded(row)} disabled={loadingStartingPoint}>
                    <View style={styles.savedRowText}>
                      <Text style={styles.savedRowName} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text style={styles.savedRowDetail} numberOfLines={1}>
                        {row.detail}
                      </Text>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={tabColor} />
                  </TouchableOpacity>
                  {expanded ? (
                    <View style={styles.expandedBlock}>
                      {loadingDishesKey === row.key || !dishes ? (
                        <ActivityIndicator color={tabColor} />
                      ) : dishes.length === 0 ? (
                        <Text style={styles.savedRowDetail}>None of the dishes in this meal could be found any more.</Text>
                      ) : (
                        <>
                          <Text style={styles.savedRowDetail}>Made from these dishes. Tick any to combine with dishes from other meals, or take the whole meal.</Text>
                          {dishes.map((dish) => {
                            const tickKey = `${row.key}::${dish.key}`;
                            const isTicked = !!tickedDishes[tickKey];
                            return (
                              <TouchableOpacity key={dish.key} style={styles.dishRow} onPress={() => toggleDishTicked(tickKey, { ...dish, from: row.name })}>
                                <Ionicons name={isTicked ? 'checkbox' : 'square-outline'} size={20} color={tabColor} />
                                <Text style={styles.dishRowName} numberOfLines={1}>
                                  {dish.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          <View style={styles.buttonRow}>
                            <TouchableOpacity
                              style={[styles.secondaryButton, { flex: 1, borderColor: tabColor }]}
                              onPress={() => void chooseStartingPoint(row)}
                              disabled={loadingStartingPoint}
                            >
                              <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Use the whole meal</Text>
                            </TouchableOpacity>
                            {tickedList.length > 0 ? (
                              <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, marginTop: 0 }]}
                                onPress={() => void chooseTickedDishes()}
                                disabled={loadingStartingPoint}
                              >
                                <Text style={styles.primaryButtonText}>{`Use all ${tickedList.length} ticked`}</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </HomeSectionBand>
        </View>
      );
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView
          ref={startingPointsScrollRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            startingPointsScrollY.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <TouchableOpacity style={[styles.backPill, { backgroundColor: tabColor }]} onPress={closeStartingPoints}>
            <Text style={styles.backPillText}>{identityConfirmed ? '‹ Back to your meal' : '‹ Back'}</Text>
          </TouchableOpacity>
          {/* One band per group of whole meals, the same shape Log or
              Schedule a Meal's sections take: the group's name as the band
              header, its meals as inset boxes beneath. The search sits in
              its own band above them since it covers all three. */}
          <View style={styles.bandOut}>
            <HomeSectionBand kind="static" title="Start from a meal you have" icon="restaurant-outline" color={tabColor}>
              {startingPointsLoading || loadingStartingPoint ? (
                <ActivityIndicator color={tabColor} />
              ) : startingPoints.length === 0 ? (
                <Text style={styles.emptyText}>
                  No whole meals yet. A meal favorite, a meal on your schedule, or a meal logged from this builder would show here. Go back and add dishes one at a time instead.
                </Text>
              ) : (
                <>
                  <Text style={styles.savedRowDetail}>
                    Tap a group below to open it, then tap a meal to see the dishes it is made of. Use the whole meal, or tick dishes from as many meals as you like and use those together.
                  </Text>
                  <View style={styles.categorySearchRow}>
                    <AppTextInput
                      style={[styles.formInput, styles.categorySearchInput, { backgroundColor: inputBackground(tabColor) }]}
                      value={startingPointSearch}
                      onChangeText={setStartingPointSearch}
                      placeholder="Search your meals..."
                      placeholderTextColor={colors.textMuted}
                    />
                    <VoiceInputButton onResult={(transcript) => setStartingPointSearch(transcript)} color={tabColor} />
                  </View>
                  {filteredStartingPoints.length === 0 ? (
                    <Text style={[styles.emptyText, styles.formLabelSpaced]}>{`No meals match "${startingPointSearch.trim()}".`}</Text>
                  ) : null}
                </>
              )}
            </HomeSectionBand>
          </View>
          {/* The combination so far, shown whole before it is loaded: every
              ticked dish from every opened meal, each removable, and one
              button that takes all of them. */}
          {tickedList.length > 0 && !loadingStartingPoint ? (
            <View style={styles.bandOut}>
              <HomeSectionBand kind="static" title="Meal you are building" icon="construct-outline" color={tabColor} contentStyle={styles.bandRows}>
                <Text style={styles.savedRowDetail}>
                  {`${tickedList.length} dish${tickedList.length === 1 ? '' : 'es'} ticked so far. Open more meals below and tick what else belongs on the plate.`}
                </Text>
                {Object.entries(tickedDishes).map(([key, dish]) => (
                  <View key={key} style={styles.savedRow}>
                    <View style={styles.savedRowText}>
                      <Text style={styles.savedRowName} numberOfLines={1}>
                        {dish.name}
                      </Text>
                      <Text style={styles.savedRowDetail} numberOfLines={1}>
                        {`From ${dish.from}`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleDishTicked(key, dish)} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.buttonColor, marginTop: 0 }]}
                  onPress={() => void chooseTickedDishes()}
                >
                  <Text style={styles.primaryButtonText}>{`Use these ${tickedList.length} dish${tickedList.length === 1 ? '' : 'es'}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: tabColor }]} onPress={() => setTickedDishes({})}>
                  <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Clear the ticks</Text>
                </TouchableOpacity>
              </HomeSectionBand>
            </View>
          ) : null}
          {!startingPointsLoading && !loadingStartingPoint ? (
            <>
              {renderGroup('Coming up on your schedule', 'calendar-outline', plannedRows)}
              {renderGroup('Your meal favorites', 'heart-outline', favoriteRows)}
              {renderGroup('Meals you have logged', 'restaurant-outline', loggedRows)}
            </>
          ) : null}
        </ScrollView>
      </>
    );
  }

  // Identity step -- name (optional) + meal type (required), matching the
  // "required to Continue" bar SideBuilder's own dishName/servings already
  // set, minus Servings/Serving Size (a meal's own "how much" lives per
  // component instead, see pendingAmount above, not at the meal level).
  if (!identityConfirmed) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          {/* "Start from a meal you have", 2026-09-13: ahead of the name and
              type form, since a whole meal already carries both and picking
              one skips straight to assembling. */}
          <View style={styles.bandOut}>
            <HomeSectionBand
              kind="action"
              title="Start from a meal you have"
              caption="A meal favorite, one on your schedule, or one you have logged before, loaded here to adjust."
              icon="restaurant-outline"
              color={tabColor}
              onPress={() => void openStartingPoints()}
            />
          </View>
          {components.length > 0 ? (
            <View style={[styles.formCard, styles.emptyStateCard, { borderColor: tabColor }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color={tabColor} />
              <Text style={styles.emptyStateText}>
                {`${components.length} dish${components.length === 1 ? '' : 'es'} in this meal so far: ${components.map((component) => component.name).join(', ')}. ${mealType ? 'Continue to keep them, or start from a different meal.' : 'Pick a meal type to continue.'}`}
              </Text>
            </View>
          ) : null}
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            {/* 2026-08-16 -- a real mic button beside Name too, not just the
                "Add from..." search box above (categorySearchRow). Every
                result replaces the field live, the same "speak and watch
                it fill in" shape a search box already gets -- a name is
                said whole, not built up with dictated bullet/paragraph
                commands. */}
            <View style={styles.nameLabelRow}>
              <Text style={[styles.formLabel, { color: tabColor }]}>Meal Name (optional)</Text>
              <VoiceInputButton onResult={(transcript) => setMealName(transcript)} size={16} />
            </View>
            <AppTextInput
              style={[styles.formInput, { backgroundColor: inputBackground(tabColor) }]}
              value={mealName}
              onChangeText={setMealName}
              placeholder="e.g. Sunday Dinner"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Text style={[styles.formLabel, styles.formLabelSpaced, { color: tabColor }]}>Meal Type</Text>
            <View style={styles.pillWrap}>
              {mealTypes.map((type) => {
                const isSelected = type === mealType;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typePill,
                      { backgroundColor: isSelected ? tabColor : inputBackground(tabColor), borderColor: isSelected ? tabColor : colors.border },
                    ]}
                    onPress={() => setMealType(type)}
                  >
                    <Text style={[styles.typePillText, isSelected ? styles.typePillTextActive : null]}>
                      {type[0].toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: identityReady ? colors.buttonColor : colors.border }]}
              onPress={handleContinuePress}
            >
              <Text style={[styles.primaryButtonText, identityReady ? null : styles.primaryButtonTextMuted]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  // A saved item was tapped -- ask how much of it before it joins the meal.
  if (pendingSelection) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={styles.pendingName}>{pendingSelection.name}</Text>
            <Text style={styles.pendingSubtitle}>
              {pendingSelection.curatedRecipeId ? 'System recipe, makes ' : 'Makes '}
              {pendingSelection.servings} serving{pendingSelection.servings === 1 ? '' : 's'}
            </Text>
            <Text style={[styles.formLabel, styles.formLabelSpaced, { color: tabColor }]}>How much did you have?</Text>
            <PopoverSelect options={SHARE_PICKER_VALUES} selected={pendingAmount} onSelect={setPendingAmount} tabColor={tabColor} minWidth={80} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={cancelPendingSelection}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, marginTop: 0, opacity: confirmingPending ? 0.6 : 1 }]}
                onPress={() => void confirmPendingSelection()}
                disabled={confirmingPending}
              >
                {confirmingPending ? <ActivityIndicator color={colors.textOnButton} /> : <Text style={styles.primaryButtonText}>Add to Meal</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  // Collecting a time before scheduling this meal for later today --
  // 2026-08-08. See openScheduleForLater's own comment for why this is
  // deliberately today-only, not a real date picker.
  if (schedulingTime) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={[styles.mealTitle, { color: tabColor }]} numberOfLines={2}>
              {mealName.trim() || 'Meal'}
            </Text>
            <Text style={styles.pendingSubtitle}>What time today?</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>Hour</Text>
                <PopoverSelect
                  options={HOUR_OPTIONS}
                  selected={scheduleTimeBuffer.hour || null}
                  minWidth={48}
                  tabColor={tabColor}
                  onSelect={(value) => setScheduleTimeBuffer((current) => ({ ...current, hour: value }))}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>Minute</Text>
                <PopoverSelect
                  options={MINUTE_OPTIONS}
                  selected={scheduleTimeBuffer.minute || null}
                  minWidth={52}
                  tabColor={tabColor}
                  onSelect={(value) => setScheduleTimeBuffer((current) => ({ ...current, minute: value }))}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>AM/PM</Text>
                <View style={styles.pillWrap}>
                  {(['AM', 'PM'] as const).map((option) => {
                    const active = scheduleTimeBuffer.ampm === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.typePill,
                          { backgroundColor: active ? tabColor : inputBackground(tabColor), borderColor: active ? tabColor : colors.border },
                        ]}
                        onPress={() => setScheduleTimeBuffer((current) => ({ ...current, ampm: option }))}
                      >
                        <Text style={[styles.typePillText, active ? styles.typePillTextActive : null]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={cancelScheduleForLater} disabled={scheduling}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, marginTop: 0, opacity: scheduling ? 0.6 : 1 }]}
                onPress={confirmScheduleForLater}
                disabled={scheduling}
              >
                {scheduling ? <ActivityIndicator color={colors.textOnButton} /> : <Text style={styles.primaryButtonText}>Schedule It</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  // "Add to My Hydration Routine"'s own time-picker step, 2026-08-26 --
  // the identical Hour/Minute/AM-PM row schedulingTime above already
  // established, just labeled for a real, indefinitely-repeating slot
  // rather than a single today-only occurrence.
  if (addingToRoutine) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={[styles.mealTitle, { color: tabColor }]} numberOfLines={2}>
              {mealName.trim() || 'Drink'}
            </Text>
            <Text style={styles.pendingSubtitle}>What time each day?</Text>
            <Text style={styles.hydrationRoutineHelperText}>
              This repeats every day, indefinitely, starting today, on the same recurring schedule Supplements and Prescriptions
              already use. Manage or remove it anytime from the Hydration lens.
            </Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>Hour</Text>
                <PopoverSelect
                  options={HOUR_OPTIONS}
                  selected={routineTimeBuffer.hour || null}
                  minWidth={48}
                  tabColor={tabColor}
                  onSelect={(value) => setRoutineTimeBuffer((current) => ({ ...current, hour: value }))}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>Minute</Text>
                <PopoverSelect
                  options={MINUTE_OPTIONS}
                  selected={routineTimeBuffer.minute || null}
                  minWidth={52}
                  tabColor={tabColor}
                  onSelect={(value) => setRoutineTimeBuffer((current) => ({ ...current, minute: value }))}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>AM/PM</Text>
                <View style={styles.pillWrap}>
                  {(['AM', 'PM'] as const).map((option) => {
                    const active = routineTimeBuffer.ampm === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.typePill,
                          { backgroundColor: active ? tabColor : inputBackground(tabColor), borderColor: active ? tabColor : colors.border },
                        ]}
                        onPress={() => setRoutineTimeBuffer((current) => ({ ...current, ampm: option }))}
                      >
                        <Text style={[styles.typePillText, active ? styles.typePillTextActive : null]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={cancelAddToRoutine} disabled={savingToRoutine}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, marginTop: 0, opacity: savingToRoutine ? 0.6 : 1 }]}
                onPress={confirmAddToRoutine}
                disabled={savingToRoutine}
              >
                {savingToRoutine ? <ActivityIndicator color={colors.textOnButton} /> : <Text style={styles.primaryButtonText}>Add to Routine</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  // Part 5's own "Fix the date" step, 2026-08-14 -- same Hour/Minute/AM-PM
  // PopoverSelect row schedulingTime above already established, plus a
  // Today/Yesterday/Custom date choice ahead of it (a trial correction can
  // genuinely be about any recent day, not just "today").
  if (correctingTrial) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={[styles.mealTitle, { color: tabColor }]} numberOfLines={2}>
              {correctingTrial.foodName}
            </Text>
            <Text style={styles.pendingSubtitle}>When did you actually eat it?</Text>
            <View style={styles.pillWrap}>
              {(
                [
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'custom', label: 'A different date' },
                ] as const
              ).map((option) => {
                const active = correctionDateChoice === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.typePill,
                      { backgroundColor: active ? tabColor : inputBackground(tabColor), borderColor: active ? tabColor : colors.border },
                    ]}
                    onPress={() => setCorrectionDateChoice(option.key)}
                  >
                    <Text style={[styles.typePillText, active ? styles.typePillTextActive : null]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {correctionDateChoice === 'custom' ? (
              <AppTextInput
                style={[styles.formInput, styles.formLabelSpaced, { backgroundColor: inputBackground(tabColor) }]}
                value={correctionCustomDate}
                onChangeText={setCorrectionCustomDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            ) : null}
            <Text style={[styles.pendingSubtitle, styles.formLabelSpaced]}>What time?</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>Hour</Text>
                <PopoverSelect
                  options={HOUR_OPTIONS}
                  selected={correctionTimeBuffer.hour || null}
                  minWidth={48}
                  tabColor={tabColor}
                  onSelect={(value) => setCorrectionTimeBuffer((current) => ({ ...current, hour: value }))}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>Minute</Text>
                <PopoverSelect
                  options={MINUTE_OPTIONS}
                  selected={correctionTimeBuffer.minute || null}
                  minWidth={52}
                  tabColor={tabColor}
                  onSelect={(value) => setCorrectionTimeBuffer((current) => ({ ...current, minute: value }))}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={[styles.formLabel, { color: tabColor }]}>AM/PM</Text>
                <View style={styles.pillWrap}>
                  {(['AM', 'PM'] as const).map((option) => {
                    const active = correctionTimeBuffer.ampm === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.typePill,
                          { backgroundColor: active ? tabColor : inputBackground(tabColor), borderColor: active ? tabColor : colors.border },
                        ]}
                        onPress={() => setCorrectionTimeBuffer((current) => ({ ...current, ampm: option }))}
                      >
                        <Text style={[styles.typePillText, active ? styles.typePillTextActive : null]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={cancelTrialDateCorrection} disabled={correcting}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, marginTop: 0, opacity: correcting ? 0.6 : 1 }]}
                onPress={confirmTrialDateCorrection}
                disabled={correcting}
              >
                {correcting ? <ActivityIndicator color={colors.textOnButton} /> : <Text style={styles.primaryButtonText}>Save Correction</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  // Browsing one category: the person's own saved dishes and the system
  // recipes, each group its own band (2026-09-13), the search in a band
  // above both since it covers both.
  if (browsingCategory) {
    const meta = CATEGORY_META.find((entry) => entry.type === browsingCategory)!;
    const lower = meta.label.toLowerCase();
    const searching = categorySearchQuery.trim().length > 0;
    const renderOptionRows = (rows: MealComponentOption[], onPick: (option: MealComponentOption) => void, keyOf: (option: MealComponentOption) => string) =>
      rows.map((option) => (
        <TouchableOpacity key={keyOf(option)} style={styles.savedRow} onPress={() => onPick(option)}>
          <View style={styles.savedRowText}>
            <Text style={styles.savedRowName} numberOfLines={1}>
              {option.name}
            </Text>
            <Text style={styles.savedRowDetail} numberOfLines={1}>
              {option.ingredientNames || `${option.ingredientCount} ingredient${option.ingredientCount === 1 ? '' : 's'}`}
            </Text>
          </View>
          <Ionicons name="add-circle-outline" size={22} color={tabColor} />
        </TouchableOpacity>
      ));
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={[styles.backPill, { backgroundColor: tabColor }]} onPress={closeCategory}>
            <Text style={styles.backPillText}>‹ Back to Add from...</Text>
          </TouchableOpacity>
          <View style={styles.bandOut}>
            <HomeSectionBand kind="static" title={`${meta.label}s`} icon={meta.icon} color={tabColor}>
              {categoryOptionsLoading ? (
                <ActivityIndicator color={tabColor} />
              ) : (
                <View style={styles.categorySearchRow}>
                  <AppTextInput
                    style={[styles.formInput, styles.categorySearchInput, { backgroundColor: inputBackground(tabColor) }]}
                    value={categorySearchQuery}
                    onChangeText={setCategorySearchQuery}
                    placeholder={`Search ${lower}s by name or ingredient...`}
                    placeholderTextColor={colors.textMuted}
                  />
                  <VoiceInputButton onResult={(transcript) => setCategorySearchQuery(transcript)} color={tabColor} />
                </View>
              )}
            </HomeSectionBand>
          </View>
          {categoryOptionsLoading ? null : (
            <>
              {/* Both bands show even when one is empty, so it is plain
                  which kind a row is and that the other kind was looked
                  for. */}
              <View style={styles.bandOut}>
                <HomeSectionBand kind="static" title={`Your saved ${lower}s`} icon="bookmark-outline" color={tabColor} contentStyle={styles.bandRows}>
                  {filteredCategoryOptions.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {categoryOptions.length === 0
                        ? `None saved yet. Anything you build in the ${meta.label} Builder shows here.`
                        : searching
                          ? `None of your saved ${lower}s match "${categorySearchQuery.trim()}".`
                          : `None saved yet.`}
                    </Text>
                  ) : (
                    renderOptionRows(filteredCategoryOptions, selectSavedOption, (option) => option.id)
                  )}
                </HomeSectionBand>
              </View>
              <View style={styles.bandOut}>
                <HomeSectionBand kind="static" title={`System ${lower}s`} icon="library-outline" color={tabColor} contentStyle={styles.bandRows}>
                  {filteredCuratedOptions.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {curatedOptions.length === 0
                        ? `No system ${lower}s exist yet.`
                        : `No system ${lower}s match "${categorySearchQuery.trim()}".`}
                    </Text>
                  ) : (
                    renderOptionRows(filteredCuratedOptions, (option) => selectCuratedOption(option as CuratedComponentOption), (option) => `curated_${option.id}`)
                  )}
                </HomeSectionBand>
              </View>
            </>
          )}
        </ScrollView>
      </>
    );
  }

  // The optional Nutrition & Health Report, Meal Builder's own version --
  // see the state block above and this component's own header comment for
  // the full reasoning behind why this one is computed fresh every time
  // rather than reusing a stored depthData the way the other 10 builders'
  // own reports do.
  if (showingReport && reportData) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
          <RecipeDepthReport
            dishName={mealName.trim() || 'Meal'}
            yieldLabel={`Assembled from ${components.length} saved item${components.length === 1 ? '' : 's'}`}
            ingredientCount={reportIngredientCount}
            nutrientChartData={reportNutrientData}
            trackedConditions={trackedConditions}
            safeForConditions={reportData.safeForConditions}
            conditionCautions={reportData.conditionCautions}
            dimensionBreakdown={reportData.dimensionBreakdown}
            declaredStages={declaredStages}
            conditionsWithStagingModel={conditionsWithStagingModel}
            // Empty on purpose: every component of a meal was built in one of
            // the ingredient builders, where this same check already ran and
            // was already shown. The flattened list a meal works from no longer
            // carries which reference row each ingredient resolved to, so
            // recomputing it here would mean guessing.
            prepMismatchNotes={[]}
            onSetStage={(code, name) => setStagePickerFor({ code, name })}
            stageNotes={reportData.stageNotes}
            tabColor={tabColor}
            saving={savingFromReport}
            onGoBack={() => setShowingReport(false)}
            onSave={() => {
              setSavingFromReport(true);
              const finish = editMealId ? saveEditedMeal() : confirmAndLogMealNow();
              void finish.finally(() => setSavingFromReport(false));
            }}
          />
        </ScrollView>
        <AppActionSheet
          visible={!!stagePickerFor}
          onClose={() => setStagePickerFor(null)}
          title={stagePickerFor ? `Your ${stagePickerFor.name} Stage` : undefined}
          message="Purely advisory. This changes nothing about what you can build or save; it only makes the report above reflect where you actually are."
          actions={[
            ...(stagePickerFor ? getConditionStagingModel(stagePickerFor.code)?.stages ?? [] : []).map((stage) => ({
              label: stage.label,
              onPress: () => {
                const code = stagePickerFor?.code;
                if (!code) return;
                setStagePickerFor(null);
                setConditionStage(code, stage.code)
                  .then(() => {
                    setConditionStages((current) => ({ ...current, [code]: stage.code }));
                  })
                  .catch((error) => {
                    console.error('[MealBuilder] Failed to save the declared healing stage', error);
                    showInfoAlert('Stage not saved', 'Something went wrong saving your healing stage. Please try setting it again.');
                  });
              },
            })),
            { label: 'Cancel', onPress: () => {} },
          ]}
        />
      </>
    );
  }

  // Assembling -- the "Your Meal" summary plus the "Add from..." grid.
  return (
    <>
      {infoAlertElement}
      {confirmSheetElement}
      {reconciliationSheetElement}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
        {/* 2026-09-13, direct report after Start from a meal you have
            landed here: "there is no way to go back once a meal is
            selected." This screen never had a way back; the identity step
            was a one-way Continue. Back returns to that step with the
            name, type and every loaded dish kept, so from there a
            different meal can be picked (it asks before replacing), the
            type changed, or Continue pressed again. Not while adjusting a
            past meal in place, which has no identity step to go back to. */}
        {!editMealId ? (
          <TouchableOpacity style={[styles.backPill, { backgroundColor: tabColor }]} onPress={() => setIdentityConfirmed(false)}>
            <Text style={styles.backPillText}>‹ Back</Text>
          </TouchableOpacity>
        ) : null}
        <View style={[styles.formCard, { borderColor: tabColor }]}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealTitle, { color: tabColor, flex: 1 }]} numberOfLines={2}>
              {mealName.trim() || 'Meal'}
            </Text>
            <HelpButton pageTitle="Meal" sections={MEAL_BUILDER_HELP} />
          </View>
          <Text style={styles.pendingSubtitle}>{mealType ? mealType[0].toUpperCase() + mealType.slice(1) : 'No meal type chosen'}</Text>
          {components.length === 0 ? (
            <Text style={[styles.emptyText, styles.formLabelSpaced]}>
              Nothing added yet. Pick a category below to add a dish, or start from a whole meal you already have.
            </Text>
          ) : (
            <View style={[styles.savedList, styles.formLabelSpaced]}>
              {components.map((component) => (
                <View key={component.key} style={styles.savedRow}>
                  <View style={styles.savedRowText}>
                    <Text style={styles.savedRowName} numberOfLines={1}>
                      {component.name}
                    </Text>
                    <Text style={styles.savedRowDetail}>
                      {Math.round(component.yourSharePercent)}% of this saved item{component.servings > 1 ? ` (its own ${component.servings} servings)` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeComponent(component.key)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Not offered while adjusting an already-logged meal in place: that
            screen corrects one real meal, and swapping its whole contents for
            a different meal is a different act. */}
        {!editMealId ? (
          <View style={styles.bandOut}>
            <HomeSectionBand
              kind="action"
              title="Start from a meal you have"
              caption="A meal favorite, one on your schedule, or one you have logged before."
              icon="restaurant-outline"
              color={tabColor}
              onPress={() => void openStartingPoints()}
            />
          </View>
        ) : null}

        {/* The band look, 2026-09-13: "Add from..." is one static band with
            its caption and the category grid inside, the tiles as inset
            boxes, instead of a heading chip, a caption chip and a loose
            grid on the photo. */}
        <View style={styles.bandOut}>
          <HomeSectionBand kind="static" title="Add from..." icon="add-circle-outline" color={tabColor} contentStyle={styles.bandRows}>
            <Text style={styles.gridCaption}>
              Each builder below lists your saved dishes and the system recipes for it. Tap the (i) above to see exactly what this does.
            </Text>
            <View style={styles.grid}>
              {CATEGORY_META.map((entry) => (
                <TouchableOpacity key={entry.type} style={styles.gridTile} onPress={() => openCategory(entry.type)}>
                  <Ionicons name={entry.icon} size={26} color={tabColor} />
                  <Text style={styles.gridTileLabel}>{entry.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </HomeSectionBand>
        </View>

        {components.length > 0 && editMealId ? (
          // Editing a real, already-real meal in place (Past Meals'
          // portion-correction flow, 2026-08-14) -- a single real "Save
          // Changes" action, not the Log Now/Schedule pair below, since
          // neither of those makes sense for a meal that's already logged
          // (or already lapsed and auto-materialized) somewhere real on the
          // calendar; this genuinely adjusts that same event, it doesn't
          // create a new one.
          <>
            {/* "Preview Full Report" -- Meal Builder's own version, see the
                state block near the top of this component for the full
                reasoning. */}
            <TouchableOpacity
              style={[styles.secondaryButton, styles.reportPreviewButton, { borderColor: tabColor }]}
              onPress={() => void handlePreviewReport()}
              disabled={computingReport}
            >
              {computingReport ? (
                <ActivityIndicator color={tabColor} />
              ) : (
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Preview Full Report</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.logButton, { backgroundColor: colors.buttonColor, opacity: savingEdit ? 0.6 : 1 }]}
              onPress={saveEditedMeal}
              disabled={savingEdit || computingReport}
            >
              {savingEdit ? <ActivityIndicator color={colors.textOnButton} /> : <Text style={styles.primaryButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </>
        ) : components.length > 0 ? (
          <>
            {renderFavoriteToggle()}
            {/* "Preview Full Report" -- Meal Builder's own version, see the
                state block near the top of this component for the full
                reasoning. */}
            <TouchableOpacity
              style={[styles.secondaryButton, styles.reportPreviewButton, { borderColor: tabColor }]}
              onPress={() => void handlePreviewReport()}
              disabled={computingReport}
            >
              {computingReport ? (
                <ActivityIndicator color={tabColor} />
              ) : (
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Preview Full Report</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.logButton, { backgroundColor: colors.buttonColor, opacity: saving ? 0.6 : 1 }]}
              onPress={confirmAndLogMealNow}
              disabled={saving || computingReport}
            >
              {saving ? <ActivityIndicator color={colors.textOnButton} /> : <Text style={styles.primaryButtonText}>Log This Now</Text>}
            </TouchableOpacity>
            {/* "Save & Schedule for Later," 2026-08-08 -- a separate action
                from Log This Now, not a variant of it: this always saves its
                own favorite regardless of the checkbox above (see
                confirmScheduleForLater's own comment), so the two buttons
                stay independently reachable rather than gated behind one
                shared "what do you want to do" choice. secondaryButton
                (outlined, not filled) -- Log This Now stays the visually
                primary action, matching how every other builder's own
                single real "finish" action is the filled button. */}
            <TouchableOpacity style={[styles.secondaryButton, styles.scheduleButton]} onPress={openScheduleForLater}>
              <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Save &amp; Schedule for Later</Text>
            </TouchableOpacity>
            {/* "Add to My Hydration Routine," 2026-08-26 -- see the state
                block above for the full reasoning. Beverage-only: this is
                the one real use case a genuinely indefinite daily repeat
                is built for, not a general-purpose repeat-any-meal
                feature. */}
            {mealType === 'beverage' ? (
              <TouchableOpacity style={[styles.secondaryButton, styles.scheduleButton]} onPress={openAddToRoutine}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Add to My Hydration Routine</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingTop: 5, gap: HOME_BAND_GAP },
  // The band look, 2026-09-12 (see components/HomeSectionBand.tsx), the
  // same headerless box the other eleven builders use: every card here is
  // a form or a notice whose own title sits inside it, so none carries a
  // band header row. Edge to edge by cancelling scrollContent's own 16px.
  formCard: {
    ...homeBandStyle,
    marginHorizontal: -16,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  // Wraps a HomeSectionBand placed among the formCards so it too cancels
  // scrollContent's own 16px and runs edge to edge (the same bandOut the
  // other builders use).
  bandOut: { marginHorizontal: -16 },
  // Rows or tiles inside a band, the standard gap apart.
  bandRows: { gap: HOME_BAND_GAP },
  formLabel: { ...typography.eyebrow, ...textShadow },
  formLabelSpaced: { marginTop: 14 },
  // The "nothing saved yet" notice above the identity form, 2026-08-08 --
  // row layout (icon beside the explanation) rather than formCard's own
  // usual stacked-fields shape, since this card holds one message, not a
  // form.
  emptyStateCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emptyStateText: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },

  // 2026-08-16 -- wraps the Meal Name label with its own real mic button,
  // same plain label-plus-button layout every direct-ingredient builder's
  // own prepNoteLabelRow already uses (this file has no ingredient card of
  // its own to have inherited that style from, so a small local one of the
  // identical shape lives here instead).
  nameLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    ...textShadow,
  },
  // 2026-08-16 -- the "Add from..." category list's own search box, right
  // under the "Saved Xs" heading rather than inside a formCard (this
  // screen isn't a form at this step, just a plain browsable list). The
  // row wraps the input with a real mic button (VoiceInputButton, added
  // the same day) so this list can be searched by speaking too, not just
  // typing.
  categorySearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 },
  categorySearchInput: { flex: 1 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typePill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typePillText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  // A selected pill fills with the tab colour and its label goes dark; dark
  // text never carries a shadow (scripts/audit_dark_text_shadow.js).
  typePillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  primaryButtonTextMuted: { color: colors.textMuted },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    // Filled so its label is not sitting on the photo background.
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, ...textShadow },
  reportPreviewButton: { borderWidth: 2 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  // 2026-08-08 -- renderFavoriteToggle's own row, same shape as every
  // sub-builder's identical style (see SideBuilder.tsx's own
  // favoriteToggleRow/favoriteToggleText).
  favoriteToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 , backgroundColor: colors.surface },
  favoriteToggleText: { ...typography.body, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  // schedulingTime's own Hour/Minute/AM-PM row, 2026-08-08 -- three roughly
  // equal fields side by side, same flexDirection: 'row' shape as Profile's
  // own dateRow (app/profile.tsx).
  timeRow: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  timeField: { gap: 4 },
  // marginTop 10 (not buttonRow's own 16-ish default via primaryButton/
  // secondaryButton) -- sits directly under Log This Now with a bit less
  // separation than that button has from the card above it, since these
  // two are a related pair of finishing actions, not two separate steps.
  scheduleButton: { marginTop: 10 },
  // colors.textSecondary, not tabColor -- matches SideBuilder's own
  // pendingHeader exactly (both name a saved item that's about to be
  // added, i.e. this card's own CONTENT, not the meal's own identity the
  // way mealTitle/formLabel are -- tabColor is reserved for the form's own
  // labels/controls, per that file's own comment on pendingHeader).
  pendingName: { ...typography.bodyEmphasis, fontSize: 17, color: colors.textSecondary, ...textShadow },
  pendingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, ...textShadow },
  // "Add to My Hydration Routine"'s own explanatory line, 2026-08-26 --
  // pendingSubtitle's own style plus a bit more room below since this one
  // is a full sentence, not a short label.
  hydrationRoutineHelperText: { ...typography.caption, color: colors.textSecondary, marginTop: 6, marginBottom: 10, ...textShadow },
  // tabColor applied inline at its one call site -- matches SideBuilder's
  // own overviewDishName, the same "this card's own name is the form's
  // subject" role mealTitle plays here.
  mealTitle: { ...typography.bodyEmphasis, fontSize: 18, ...textShadow },
  // 2026-08-16 -- HelpButton sits beside the title rather than the title
  // owning the whole row alone, so the (i) icon is visible the instant the
  // Assembling view opens, regardless of how it was reached (a fresh meal,
  // Past Meals' own "Adjust" link, or a scheduled/logged meal's own
  // "Log now"/edit path all land here with zero shared entry-point copy).
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Surface so the back link is not sitting on the photo (2026-08-29
  // standing rule).
  // The Back pill every converted Food screen carries at the top (see
  // FoodItemDetailView's own backLink): the tab colour as fill, dark text.
  backPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  backPillText: { ...typography.body, color: colors.textOnPrimary, fontWeight: '400' },
  // tabColor applied inline at both call sites -- matches SideBuilder's own
  // "Ingredients" heading (also typography.eyebrow), which gets the same
  // treatment despite being a section heading rather than a single-field
  // label.
  // Inside the "Add from..." band now, so no surface of its own.
  // textPrimary rather than textSecondary: the band carries the tab
  // colour in its header, and the content reads in the text colour, the
  // same split Home's bands make.
  gridCaption: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  emptyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  savedList: { gap: HOME_BAND_GAP },
  // A row inside a band: an inset box rather than a second band (a band
  // inside a band would put its accent 16px in), the same shape Log or
  // Schedule a Meal's rows take.
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
  },
  // A row that can expand to its dishes: the fill moves to this wrapper so
  // the row and what opens under it read as one box.
  savedRowWrap: { borderRadius: 10, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  expandedBlock: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  dishRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dishRowName: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  savedRowText: { flex: 1 },
  // colors.textPrimary, matching SideBuilder's own overviewIngredientText --
  // a plain saved-item name in a list, not the form's own identity.
  savedRowName: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  savedRowDetail: { ...typography.caption, color: colors.textPrimary, marginTop: 2, ...textShadow },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // A tile inside the "Add from..." band: the same inset box a row is.
  gridTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gridTileLabel: { ...typography.caption, textAlign: 'center', color: colors.textPrimary, ...textShadow },
  logButton: { marginTop: 4 },
});
