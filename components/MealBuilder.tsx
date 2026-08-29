import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors, inputBackground } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
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
  listMealComponentOptions,
  markScheduledMealLogged,
  resolveMealComponent,
  revertFoodTrialToWaiting,
  saveMealFavorite,
  scheduleMeal,
  setConditionStage,
  updateMealFromComponents,
  type MealComponentOption,
  type MealComponentSelection,
  type MealComponentType,
  type MealIngredientInput,
  type TrialNeedingReconciliation,
} from '../lib/db';
import { getConditionStagingModel, resolveDeclaredStage, type DeclaredConditionStage } from '../lib/conditionStages';
import { parseAmountValue } from '../lib/measurement';
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
    body: "Each button opens your own already-saved or favorited items from that one builder: a saved side, a favorited smoothie, and so on. Tap a category, pick one of your own saved items from the list, then say how much of it you actually had. It never creates anything new here; it only pulls in something you've already built and saved elsewhere. Once a category's own list is open, a search box lets you find one by its name or by an ingredient in it.",
  },
  {
    heading: 'What the percent under each item means',
    body: "That percent is how much of THAT ONE SAVED ITEM's own stated servings you're counting toward this meal, not a share of the whole meal split between people. 100% means you're counting the entire saved amount; 50% means about half of it; 0% means none of it happened, and it should probably be removed instead.",
  },
  {
    heading: 'Adjusting a past meal',
    body: "If this meal was filled in automatically from something you'd scheduled, every item starts at 100%: the honest assumption you had the full planned amount. Change any item's own percent here if you actually had more, less, or none of it, then Save Changes. If a food you're testing in a trial is affected, you'll be asked separately whether the trial happened on a different day or never really happened at all.",
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
}: {
  tabColor: string;
  scheduleItemId?: string;
  initialMealType?: string;
  initialTitle?: string;
  templateMealId?: string;
  favoriteId?: string;
  editMealId?: string;
}) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
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
  const [identityConfirmed, setIdentityConfirmed] = useState(!!scheduleItemId || !!favoriteId || !!editMealId);

  // A meal can only be assembled FROM the other ten builders' own saved
  // output (see this file's own top comment) -- with nothing saved
  // anywhere yet, "Add from..." would just be ten empty lists, so
  // Continue is blocked before that dead end is ever reached, 2026-08-08,
  // explicitly requested: "The Meal builder should not allow the Continue
  // button to turn green and activate... [it] should actually say
  // something that causes the user to know they have to make sides or
  // other things before a meal can be built." null while the real check is
  // still in flight (Continue stays muted/disabled either way, since
  // identityReady below requires a confirmed `true`, not just "not
  // false") -- only flips to a definite true/false once every category has
  // actually been checked, so this can never say "you have nothing" while
  // still genuinely finding out. Reruns on every mount, which in practice
  // is every time this screen is actually reached -- switching to a
  // different builder and back is a real unmount/remount of this whole
  // component (see food.tsx's own lens ternary), so building a first Side
  // elsewhere and returning here always sees the fresh count, no separate
  // focus-listener needed.
  const [hasAnySavedComponents, setHasAnySavedComponents] = useState<boolean | null>(null);
  useEffect(() => {
    let isCurrent = true;
    Promise.all(CATEGORY_META.map((entry) => listMealComponentOptions(entry.type))).then((lists) => {
      if (isCurrent) setHasAnySavedComponents(lists.some((list) => list.length > 0));
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const identityReady = !!mealType && hasAnySavedComponents === true;

  const [components, setComponents] = useState<SelectedComponent[]>([]);

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

  function openCategory(type: MealComponentType) {
    dismissKeyboard();
    setBrowsingCategory(type);
    setCategoryOptionsLoading(true);
    setCategorySearchQuery('');
    listMealComponentOptions(type).then((options) => {
      setCategoryOptions(options);
      setCategoryOptionsLoading(false);
    });
  }

  function closeCategory() {
    setBrowsingCategory(null);
    setCategoryOptions([]);
    setCategorySearchQuery('');
  }

  // Searches both the saved item's own name AND its real ingredient-name
  // summary -- someone might remember "the side with broccoli in it" as
  // readily as its own given name, and MealComponentOption already carries
  // both (see lib/db.ts's own type) with no extra query needed.
  const filteredCategoryOptions = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) return categoryOptions;
    return categoryOptions.filter(
      (option) => option.name.toLowerCase().includes(query) || (option.ingredientNames ?? '').toLowerCase().includes(query),
    );
  }, [categoryOptions, categorySearchQuery]);

  // A saved item tapped from categoryOptions, awaiting its own "how much of
  // this did you have" answer before it actually joins `components`.
  const [pendingSelection, setPendingSelection] = useState<{
    componentType: MealComponentType;
    componentId: string;
    name: string;
    servings: number;
  } | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  function selectSavedOption(option: MealComponentOption) {
    if (!browsingCategory) return;
    setPendingSelection({ componentType: browsingCategory, componentId: option.id, name: option.name, servings: option.servings });
    setPendingAmount(null);
  }

  function cancelPendingSelection() {
    setPendingSelection(null);
    setPendingAmount(null);
  }

  function confirmPendingSelection() {
    if (!pendingSelection || !pendingAmount) {
      showInfoAlert('Almost there', 'Please choose how much of this you had.');
      return;
    }
    const chosenServings = parseAmountValue(pendingAmount);
    const sharePercent = pendingSelection.servings > 0 ? (chosenServings / pendingSelection.servings) * 100 : 100;
    const newComponent: SelectedComponent = {
      key: `${pendingSelection.componentType}_${pendingSelection.componentId}_${Date.now()}`,
      componentType: pendingSelection.componentType,
      componentId: pendingSelection.componentId,
      name: pendingSelection.name,
      servings: pendingSelection.servings,
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
      const favorite = await saveMealFavorite({ name: finishedName, mealType, components: selections });
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
      `${finishedName} is scheduled for ${formatTime12(time24)} today. Find it on the Schedule tab's own Meals lens.`,
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
      const favorite = await saveMealFavorite({ name: finishedName, mealType: 'beverage', components: selections });
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
      `${finishedName} is now scheduled every day at ${formatTime12(time24)}, starting today. Manage it anytime from the Schedule tab's own Hydration lens.`,
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
      title={reconciliationPrompt ? `${reconciliationPrompt.next.foodName} -- no longer in this meal` : undefined}
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
      showInfoAlert('Nothing to save', 'A meal needs at least one item -- if none of this actually happened, remove the whole entry from Past Meals instead.');
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
    if (hasAnySavedComponents !== true) {
      showInfoAlert(
        'Nothing to build from yet',
        "A meal is assembled from Sides, Salads, Smoothies, and the other Food tab builders' own saved items, and there aren't any saved yet. Build one of those first (the Lens Button, bottom of the screen), then come back here.",
      );
      return;
    }
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setIdentityConfirmed(true);
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
          {hasAnySavedComponents === false ? (
            // Confirmed (not just "still loading") that every one of the
            // eleven other builders' own saved lists is empty, 2026-08-08 --
            // shown ahead of the identity form itself, not just baked into
            // the Continue button's own label below, so this is the very
            // first thing explaining why nothing here can proceed yet.
            <View style={[styles.formCard, styles.emptyStateCard, { borderColor: tabColor }]}>
              <Ionicons name="information-circle-outline" size={22} color={tabColor} />
              <Text style={styles.emptyStateText}>
                {"Nothing saved yet to build a meal from. A meal is assembled from Sides, Salads, Smoothies, and the other Food tab builders' own saved items; build one of those first (the Lens Button at the bottom of the screen), then come back here to put a meal together."}
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
                    <Text style={[styles.typePillText, isSelected ? { color: colors.textOnPrimary } : null]}>
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
              <Text style={[styles.primaryButtonText, identityReady ? null : styles.primaryButtonTextMuted]}>
                {hasAnySavedComponents === false ? 'Build a Side or Other Item First' : 'Continue'}
              </Text>
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
              Makes {pendingSelection.servings} serving{pendingSelection.servings === 1 ? '' : 's'}
            </Text>
            <Text style={[styles.formLabel, styles.formLabelSpaced, { color: tabColor }]}>How much did you have?</Text>
            <PopoverSelect options={SHARE_PICKER_VALUES} selected={pendingAmount} onSelect={setPendingAmount} tabColor={tabColor} minWidth={80} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={cancelPendingSelection}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, marginTop: 0 }]} onPress={confirmPendingSelection}>
                <Text style={styles.primaryButtonText}>Add to Meal</Text>
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
                        <Text style={[styles.typePillText, active ? { color: colors.textOnPrimary } : null]}>{option}</Text>
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
              This repeats every day, indefinitely, starting today -- the same real recurring schedule Supplements and Prescriptions
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
                        <Text style={[styles.typePillText, active ? { color: colors.textOnPrimary } : null]}>{option}</Text>
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
                    <Text style={[styles.typePillText, active ? { color: colors.textOnPrimary } : null]}>{option.label}</Text>
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
                        <Text style={[styles.typePillText, active ? { color: colors.textOnPrimary } : null]}>{option}</Text>
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

  // Browsing one category's own saved items.
  if (browsingCategory) {
    const meta = CATEGORY_META.find((entry) => entry.type === browsingCategory)!;
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {reconciliationSheetElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backRow} onPress={closeCategory}>
            <Ionicons name="chevron-back" size={18} color={tabColor} />
            <Text style={[styles.backRowText, { color: tabColor }]}>Add from...</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionHeading, { color: tabColor }]}>Saved {meta.label}s</Text>
          {categoryOptionsLoading ? (
            <ActivityIndicator color={tabColor} style={styles.loadingSpinner} />
          ) : categoryOptions.length === 0 ? (
            <Text style={styles.emptyText}>
              {`No saved ${meta.label.toLowerCase()}s yet. Build one from the ${meta.label} Builder first, then come back here to add it.`}
            </Text>
          ) : (
            <>
              <View style={styles.categorySearchRow}>
                <AppTextInput
                  style={[styles.formInput, styles.categorySearchInput, { backgroundColor: inputBackground(tabColor) }]}
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                  placeholder={`Search your saved ${meta.label.toLowerCase()}s...`}
                  placeholderTextColor={colors.textMuted}
                />
                <VoiceInputButton onResult={(transcript) => setCategorySearchQuery(transcript)} color={tabColor} />
              </View>
              {filteredCategoryOptions.length === 0 ? (
                <Text style={[styles.emptyText, styles.formLabelSpaced]}>
                  {`No saved ${meta.label.toLowerCase()}s match "${categorySearchQuery.trim()}".`}
                </Text>
              ) : (
                <View style={styles.savedList}>
                  {filteredCategoryOptions.map((option) => (
                    <TouchableOpacity key={option.id} style={styles.savedRow} onPress={() => selectSavedOption(option)}>
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
                  ))}
                </View>
              )}
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
          message="Purely advisory -- this changes nothing about what you can build or save, it only makes the report above reflect where you actually are."
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
        <View style={[styles.formCard, { borderColor: tabColor }]}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealTitle, { color: tabColor, flex: 1 }]} numberOfLines={2}>
              {mealName.trim() || 'Meal'}
            </Text>
            <HelpButton pageTitle="Meal" sections={MEAL_BUILDER_HELP} />
          </View>
          <Text style={styles.pendingSubtitle}>{mealType ? mealType[0].toUpperCase() + mealType.slice(1) : 'No meal type chosen'}</Text>
          {components.length === 0 ? (
            <Text style={[styles.emptyText, styles.formLabelSpaced]}>Nothing added yet. Pick a category below to add your first item.</Text>
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

        <Text style={[styles.sectionHeading, styles.gridHeading, { color: tabColor }]}>Add from...</Text>
        <Text style={styles.gridCaption}>
          Pick from your own already-saved or favorited items in any builder below. Tap the (i) above to see exactly what this does.
        </Text>
        <View style={styles.grid}>
          {CATEGORY_META.map((entry) => (
            <TouchableOpacity key={entry.type} style={styles.gridTile} onPress={() => openCategory(entry.type)}>
              <Ionicons name={entry.icon} size={26} color={tabColor} />
              <Text style={styles.gridTileLabel}>{entry.label}</Text>
            </TouchableOpacity>
          ))}
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
  scrollContent: { padding: 16, paddingTop: 5, gap: 10 },
  formCard: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 16,
  },
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
  },
  secondaryButtonText: { ...typography.bodyEmphasis, ...textShadow },
  reportPreviewButton: { borderWidth: 2 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  // 2026-08-08 -- renderFavoriteToggle's own row, same shape as every
  // sub-builder's identical style (see SideBuilder.tsx's own
  // favoriteToggleRow/favoriteToggleText).
  favoriteToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
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
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  backRowText: { ...typography.bodyEmphasis, ...textShadow },
  // tabColor applied inline at both call sites -- matches SideBuilder's own
  // "Ingredients" heading (also typography.eyebrow), which gets the same
  // treatment despite being a section heading rather than a single-field
  // label.
  sectionHeading: { ...typography.eyebrow, ...textShadow },
  gridHeading: { marginTop: 6 },
  gridCaption: { ...typography.caption, color: colors.textSecondary, marginTop: 4, marginBottom: 4, ...textShadow },
  loadingSpinner: { marginTop: 20 },
  emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  savedList: { gap: 8 },
  // A bordered box per row (not SideBuilder's own plain bottom-border list
  // row) -- deliberately closer to app/food-items.tsx's own itemRow in
  // spirit but boxed, since each row here is a distinct tappable saved
  // record, not a passive divided list. Stays plain colors.border, not
  // tabColor -- consistent with itemRow's own choice, and with formCard
  // being the one element per step that gets the tabColor-border
  // treatment, not every box on the page.
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  savedRowText: { flex: 1 },
  // colors.textPrimary, matching SideBuilder's own overviewIngredientText --
  // a plain saved-item name in a list, not the form's own identity.
  savedRowName: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  savedRowDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 2, ...textShadow },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // Same colors.border/colors.surface reasoning as savedRow above -- a grid
  // tile is a passive-until-tapped chrome box, not the step's own formCard.
  gridTile: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gridTileLabel: { ...typography.caption, textAlign: 'center', color: colors.textPrimary, ...textShadow },
  logButton: { marginTop: 4 },
});
