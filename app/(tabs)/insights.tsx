import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  classifyPrepStateGroup,
  classifyProteinSource,
  getDailyNutrientBreakdown,
  getDailySixDimensionsBreakdown,
  getDietaryReferenceIntakesForCurrentUser,
  getFoodRankingsAcrossNutrients,
  getFoodUnitWeight,
  getLabTests,
  getTodaysAdvisories,
  listAllActiveTreatments,
  listLabResults,
  listSafeFoodCategories,
  listSafeFoods,
  listStage1Foods,
  listStage2ReintroductionRounds,
  listTrackedNutrients,
  PREP_STATE_GROUP_LABELS,
  PREP_STATE_GROUP_ORDER,
  rankFoodsByNutrient,
  recordLabResult,
  type DailyDimensionScore,
  type DailyNutrientBreakdown,
  type DailyNutrientScopeTotals,
  type DailySixDimensionsBreakdown,
  type DietaryReferenceIntake,
  type FoodNutrientRanking,
  type LabResultRecord,
  type LabTest,
  type PrepStateGroup,
  type RankedFood,
  type SafeFood,
  type StageFood,
  type StageFoodGroupResult,
  type TrackedNutrient,
  type TreatmentRecord,
  type TriggeredAdvisory,
} from '../../lib/db';
import { ALCOHOL_ADVISORY_MESSAGE, ALCOHOL_ADVISORY_TITLE } from '../../lib/alcoholAdvisory';
import {
  COOKING_IMPACT_COMPOUNDS,
  COOKING_IMPACT_METHODS,
  type CookingImpactConfidence,
} from '../../lib/cookingImpactData';
import { COFFEE_ADVISORY_MESSAGE, COFFEE_ADVISORY_TITLE } from '../../lib/coffeeAdvisory';
import { evaluateInteractionRules, type InteractionWarning, type ReferenceOnlyRule } from '../../lib/interactionRules';
import { JUICE_ADVISORY_MESSAGE, JUICE_ADVISORY_TITLE } from '../../lib/juiceAdvisory';
import {
  analyzeNutrientIntake,
  formatAmount,
  nutrientStatusSeverity,
  percentOfDailyTarget,
  type StatusSeverity,
} from '../../lib/nutrientAnalysis';
import {
  NUTRIENT_STATUS_LABELS,
  flattenItemScores,
  getSubCriterionSources,
  getTierDefinition,
  groupDailyScoresByDimension,
  isFlaggedTier,
  selectPrepTips,
  tierSeverity,
  type TierSeverity,
} from '../../lib/sixDimensionsReference';
import { AppTextInput } from '../../components/AppTextInput';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { FoodLookup, categoryLabel, sourceLabel, type ResolvedFoodSelection } from '../../components/FoodLookup';
import { GatedTabContent } from '../../components/GatedTabContent';
import { linkifyText } from '../../components/InfoAlert';
import type { HelpSection } from '../../components/HelpButton';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PopoverSelect } from '../../components/PopoverSelect';
import { ProgressRing } from '../../components/ProgressRing';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import {
  FLOATING_BUTTON_SIZE,
  SECONDARY_HUB_CARD_LEFT_MARGIN,
  useFloatingButtonScrollPadding,
  useMenuCardBottom,
  useSecondaryHubPosition,
} from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';

// 'YYYY-MM-DD' in LOCAL time -- same reasoning as the rest of the app
// (see lib/db.ts/app/(tabs)/index.tsx): UTC's calendar date is wrong for
// anyone not on UTC, especially in the evening.
function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

// Shared green/yellow/red/unknown -> style lookup for both the Nutrients
// table (StatusSeverity) and the 6 Dimensions scorecard (TierSeverity) --
// same four states, same visual language, just two different sources
// feeding into it.
function severityTextStyle(severity: StatusSeverity | TierSeverity) {
  if (severity === 'green') return styles.statusGreenText;
  if (severity === 'yellow') return styles.statusYellowText;
  if (severity === 'red') return styles.statusRedText;
  return styles.statusNeutralText;
}

function severityRowStyle(severity: StatusSeverity | TierSeverity) {
  if (severity === 'green') return styles.tableRowGreen;
  if (severity === 'yellow') return styles.tableRowYellow;
  if (severity === 'red') return styles.tableRowRed;
  return null;
}

// "Worst wins" across several tiers at once (e.g. three different foods'
// worth of Gluten ratings for one sub-criterion row, or every sub-
// criterion under one dimension) -- red beats yellow beats green beats
// unknown, so a single real concern anywhere in the group is never masked
// by everything else being fine or unassessed.
const SEVERITY_RANK: Record<TierSeverity, number> = { unknown: 0, green: 1, yellow: 2, red: 3 };

function worstTierSeverity(tiers: string[]): TierSeverity {
  let worst: TierSeverity = 'unknown';
  for (const tier of tiers) {
    const severity = tierSeverity(tier);
    if (SEVERITY_RANK[severity] > SEVERITY_RANK[worst]) worst = severity;
  }
  return worst;
}

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border to carry that
// identity. Matches the same "box border = the tab it belongs to" rule
// applied there, 2026-07-27.
const TAB_COLOR = colors.tabInsights;

type Lens =
  | 'nutrients'
  | 'sixDs'
  | 'prep'
  | 'foodLookup'
  | 'nutrientRanking'
  | 'cookingImpact'
  | 'safeFoods'
  | 'healingStage'
  | 'hydration'
  | 'labs'
  | 'myMeds'
  | 'advisories';

// Shared across all three lenses' own Info content below -- the
// drill-down navigator (ScopeHub) is the one mechanic all three have in
// common, so it's worth repeating in each rather than only explaining it
// once somewhere a person might not be looking when they actually need it.
const DRILLING_DOWN_HELP: HelpSection = {
  heading: 'Drilling down',
  body: 'The third floating button, to the left of the view picker, opens the same navigator every lens shares: Whole Day -> a specific meal -> a side within it -> a single ingredient. Tap any crumb to jump straight back to that level, or tap one of the pills below it to go one level deeper.',
};

const LENSES: LensOption<Lens>[] = [
  {
    key: 'nutrients',
    label: 'Nutrients',
    icon: 'nutrition-outline',
    help: [
      {
        heading: 'Reading the table',
        body: 'Each row compares one nutrient to your daily target. At "Whole Day" scope, rows are judged and colored: a flagged (colored) row is short of target, over a safe upper limit, or otherwise worth a look; an unflagged row is quietly fine and stays neutral on purpose, so color only ever draws your eye to what actually needs it.',
      },
      {
        heading: 'Drilling into a meal or ingredient',
        body: 'Once you drill into a specific meal, side, or ingredient, the judgment coloring disappears: a single food is not "deficient" in a vitamin just for not being your whole day\'s supply of it. Instead each row shows what percent of today\'s target that one item contributed, sorted highest-contributor first.',
      },
      DRILLING_DOWN_HELP,
    ],
  },
  {
    key: 'sixDs',
    label: '6 Dimensions',
    icon: 'analytics-outline',
    help: [
      {
        heading: '6 Dimensions',
        body: 'Summarizes each of six research-backed factors (micronutrient density, inflammatory potential, lipid compatibility, hormonal/thyroid support, digestive tolerance, and oxalate load) for whatever scope is selected. "Clear" means nothing in that scope was flagged for that dimension; a number means that many sub-criteria were. Tap a dimension to see its sub-criteria, then tap a sub-criterion to see the tier it was rated and the citation behind that rating.',
      },
      DRILLING_DOWN_HELP,
    ],
  },
  {
    key: 'prep',
    label: 'Cooking & Prep',
    icon: 'flame-outline',
    help: [
      {
        heading: 'Cooking & Prep',
        body: 'Surfaces ingredients in today\'s meals that measurably change outcome based on how they are prepared (e.g. cooking cruciferous vegetables rather than eating them raw, or soaking legumes before cooking), each with the citation it is based on. At the whole-day/meal level, only items that actually need attention are shown; drilled into one side or ingredient, everything shows, including a plain "nothing specific" answer.',
      },
      DRILLING_DOWN_HELP,
    ],
  },
  {
    key: 'foodLookup',
    label: 'Food Lookup',
    icon: 'search-outline',
    help: [
      {
        heading: 'Food Lookup',
        body: "Look up any food in this app's own reference database: pick a category, then (if that category has one) a more specific type, then the food itself, to see its full nutrient, vitamin, and mineral breakdown per 100g. This is the same reference data every logged meal is scored against; it isn't tied to today's log or any drill-down scope, unlike the other three lenses here.",
      },
    ],
  },
  {
    key: 'nutrientRanking',
    label: 'Nutrient Ranking',
    icon: 'bar-chart-outline',
    help: [
      {
        heading: 'Nutrient Ranking',
        body: 'Pick any nutrient this app tracks to see foods ranked from most to least, per 100g: a way to actually find foods to build a meal around, not just check one you already picked. Same reference data as Food Lookup, independent of today\'s log.',
      },
      {
        heading: 'Protein: Animal vs. Plant',
        body: 'Protein specifically splits into two ranked lists: Animal (meat, poultry, fish, dairy, eggs) and Plant (legumes, nuts/seeds, grains, vegetables, fruit, mushrooms, algae), so a vegetarian can find their own high-protein foods just as easily as anyone else. Grouped by what you can actually eat, not strict biology (mushrooms and algae count as Plant here).',
      },
    ],
  },
  {
    key: 'cookingImpact',
    label: 'Cooking Impact',
    icon: 'thermometer-outline',
    help: [
      {
        heading: 'Cooking Impact',
        body: 'Pick a nutrient or compound to see how much of it cited studies (or, where none exist for an exact combination, a defensible mechanism-based estimate, clearly labeled) found surviving each cooking method, independent of today\'s log, and separate from what any one logged ingredient is actually tracked as.',
      },
      {
        heading: 'Measured vs. reasoned',
        body: 'Each row is labeled "Directly measured" when a cited study tested that exact compound-and-method combination, or "Reasoned estimate" when no study covers that exact case but the same compound\'s own established mechanism (leaches into water, heat-stable, enzyme-dependent) still supports an answer. Neither changes what\'s tracked for a food you\'ve actually logged; that still comes from the food\'s own database entry.',
      },
    ],
  },
  {
    key: 'safeFoods',
    label: 'Safe Foods',
    icon: 'shield-checkmark-outline',
    help: [
      {
        heading: 'Safe Foods',
        body: "Foods with zero flagged concerns across every one of the 6 Dimensions: nothing here should give the D1-D6 scoring any reason to worry, based on what this app has actually assessed. Pick a category to browse what qualifies within it.",
      },
      {
        heading: 'What "safe" means here',
        body: '"Not Assessed" (no data either way) and a green rating both count as safe; only an actual yellow or red flag on any of the 24 sub-criteria disqualifies a food. This is the same tier logic the 6 Dimensions lens itself uses, just applied across the whole reference database instead of one day\'s meals.',
      },
    ],
  },
  {
    key: 'healingStage',
    label: 'Healing Stage',
    icon: 'leaf-outline',
    help: [
      {
        heading: 'Stage 1: Getting Started',
        body: "Foods matching this app's own published Healing Stages guide: a short, deliberately narrow list meant to build a stable, low-noise baseline, not variety. Grouped by Proteins, Vegetables, Starches, Fruits, and Fats.",
      },
      {
        heading: 'Stage 2: Rebuilding',
        body: 'A reasoned reintroduction order, one round at a time: cooked goitrogenic vegetables and legumes first, nightshades next, dairy next, gluten last and most cautiously. Tap a round to see the foods in it.',
      },
      {
        heading: 'What this is not',
        body: "This is a food finder, not a personal advisory reordering system: it doesn't know which stage YOU are in (that would need a self-declared field in Profile, which doesn't exist yet) or hide anything from you. It just shows verified foods that fit each stage's own published reasoning.",
      },
    ],
  },
  {
    key: 'hydration',
    label: 'Hydration',
    icon: 'water-outline',
    help: [
      {
        heading: 'Hydration',
        body: "Today's total water intake against your own target: a true sum across everything logged today, food and drink alike (water-rich foods like soup or watermelon count too, not just what you drank). Same underlying nutrient data as the Nutrients table; this is just its own dedicated view.",
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
        body: 'Your most recent result for every test you\'ve logged, plus how long ago it was drawn. Log a new result any time: pick the test, enter the value and date, and (optionally) your own lab\'s reference range, since that varies by lab/assay and matters more than the educational typical range shown here.',
      },
      {
        heading: "What isn't built yet",
        body: "A \"you're due for a retest\" reminder isn't built: there's no standard interval for most tests, and guessing one would be worse than not claiming it. This is a log and a quick reference, not a scheduler.",
      },
    ],
  },
  {
    key: 'myMeds',
    label: 'My Meds & Interactions',
    icon: 'medkit-outline',
    help: [
      {
        heading: 'My Meds & Interactions',
        body: 'A read-only view of what Schedule\'s own My Meds lens already tracks (prescriptions, OTC, supplements) plus every interaction warning currently triggered: calcium/iron/zinc timing, the fat-soluble vitamins, levothyroxine + calcium/iron, and biotin against an upcoming lab draw.',
      },
      {
        heading: 'Adding or editing',
        body: "This lens doesn't add or edit anything; to change what you're tracking, use Schedule's own My Meds lens. This is just a more visible, always-checked place to see what's currently flagged, without having to go looking for it.",
      },
    ],
  },
  {
    key: 'advisories',
    label: "Today's Advisories",
    icon: 'information-circle-outline',
    help: [
      {
        heading: "Today's Advisories",
        body: 'Every cited advisory this app already has (alcohol, coffee, fruit juice) checked across your whole day at once, instead of only appearing one item at a time buried inside a Food builder.',
      },
      {
        heading: "What isn't covered",
        body: "This is scoped to the 3 advisories that already exist. A per-food additive-detection system (naming which specific additives are in a given food) would need reference data this app doesn't have yet, so it isn't guessed at here.",
      },
    ],
  },
];

// Where you currently are in the day -> meal -> side -> item drill-down,
// shared by both the 6 Dimensions and Cooking & Prep lenses since both are views
// over the same breakdown. Tracked by index within each level's own array
// (sides/items don't have stable ids), not by id.
export type Scope =
  | { level: 'day' }
  | { level: 'meal'; mealIndex: number }
  | { level: 'side'; mealIndex: number; sideIndex: number }
  | { level: 'item'; mealIndex: number; sideIndex: number; itemIndex: number };

// The minimal shape scope-navigation needs -- both DailySixDimensionsBreakdown
// (meals carry bySubCriterion) and DailyNutrientBreakdown (meals carry
// totals) satisfy this structurally, so one set of navigation helpers
// (resolveScopeMeal/resolveScopeSide/scopeBreadcrumbs/ScopeNav) works for
// both lenses instead of three near-duplicate copies. Each lens's own
// resolver (resolveScopeScores / resolveScopeNutrientTotals below) stays
// separately typed, since that's where the two genuinely differ -- what
// data actually lives at a given scope.
type NavigableItem = { foodName: string };
type NavigableSide = { sideName: string; items: NavigableItem[] };
type NavigableMeal = { mealId: string; mealName: string; mealType: string; sides: NavigableSide[] };

function resolveScopeMeal<M extends NavigableMeal>(breakdown: { meals: M[] }, scope: Scope): M | null {
  if (scope.level === 'day') return null;
  return breakdown.meals[scope.mealIndex] ?? null;
}

function resolveScopeSide<M extends NavigableMeal>(breakdown: { meals: M[] }, scope: Scope): M['sides'][number] | null {
  if (scope.level !== 'side' && scope.level !== 'item') return null;
  const meal = resolveScopeMeal(breakdown, scope);
  return meal?.sides[scope.sideIndex] ?? null;
}

function resolveScopeScores(breakdown: DailySixDimensionsBreakdown, scope: Scope): DailyDimensionScore[] {
  if (scope.level === 'day') return breakdown.day;
  if (scope.level === 'meal') return resolveScopeMeal(breakdown, scope)?.bySubCriterion ?? [];
  if (scope.level === 'side') return resolveScopeSide(breakdown, scope)?.bySubCriterion ?? [];
  const side = resolveScopeSide(breakdown, scope);
  return side?.items[scope.itemIndex]?.bySubCriterion ?? [];
}

// Same idea as resolveScopeScores, but for raw nutrient totals instead of
// D1-D6 scores -- what NutrientsTable reads to show a scope's own
// contribution toward today's targets.
function resolveScopeNutrientTotals(breakdown: DailyNutrientBreakdown, scope: Scope): DailyNutrientScopeTotals {
  if (scope.level === 'day') return breakdown.dayTotals;
  if (scope.level === 'meal') return resolveScopeMeal(breakdown, scope)?.totals ?? {};
  if (scope.level === 'side') return resolveScopeSide(breakdown, scope)?.totals ?? {};
  const side = resolveScopeSide(breakdown, scope);
  return side?.items[scope.itemIndex]?.totals ?? {};
}

// Breadcrumb trail for the current scope -- each crumb is tappable to jump
// straight back to that level, so drilling four levels deep never strands
// you with only "go back one step at a time."
function scopeBreadcrumbs<M extends NavigableMeal>(
  breakdown: { meals: M[] },
  scope: Scope,
): { label: string; scope: Scope }[] {
  const crumbs: { label: string; scope: Scope }[] = [{ label: 'Whole Day', scope: { level: 'day' } }];
  if (scope.level === 'day') return crumbs;

  const meal = resolveScopeMeal(breakdown, scope);
  if (!meal) return crumbs;
  crumbs.push({ label: `${capitalize(meal.mealType)}`, scope: { level: 'meal', mealIndex: scope.mealIndex } });
  if (scope.level === 'meal') return crumbs;

  const side = resolveScopeSide(breakdown, scope);
  if (!side) return crumbs;
  crumbs.push({
    label: side.sideName,
    scope: { level: 'side', mealIndex: scope.mealIndex, sideIndex: (scope as { sideIndex: number }).sideIndex },
  });
  if (scope.level === 'side') return crumbs;

  const item = side.items[scope.itemIndex];
  if (!item) return crumbs;
  crumbs.push({ label: item.foodName, scope });
  return crumbs;
}

const INSIGHTS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'Three lenses, one day of data',
    body: 'Nutrients, 6 Dimensions, and Cooking & Prep (tap the button to the left of the main navigation button, bottom of the screen) are three different views over the same set of meals you logged today. Switching views does not reload anything, it just changes how the same data is presented.',
  },
  {
    heading: 'Nutrients: reading the table',
    body: 'Each row compares one nutrient to your daily target. At "Whole Day" scope, rows are judged and colored: a flagged (colored) row is short of target, over a safe upper limit, or otherwise worth a look; an unflagged row is quietly fine and stays neutral on purpose, so color only ever draws your eye to what actually needs it.',
  },
  {
    heading: 'Nutrients: drilling into a meal or ingredient',
    body: 'Once you drill into a specific meal, side, or ingredient, the judgment coloring disappears: a single food is not "deficient" in a vitamin just for not being your whole day\'s supply of it. Instead each row shows what percent of today\'s target that one item contributed, sorted highest-contributor first.',
  },
  {
    heading: '6 Dimensions',
    body: 'The 6 Dimensions scorecard summarizes each of six research-backed factors (micronutrient density, inflammatory potential, lipid compatibility, hormonal/thyroid support, digestive tolerance, and oxalate load) for whatever scope is selected. "Clear" means nothing in that scope was flagged for that dimension; a number means that many sub-criteria were. Tap a dimension to see its sub-criteria, then tap a sub-criterion to see the tier it was rated and the citation behind that rating.',
  },
  {
    heading: 'Cooking & Prep',
    body: 'Surfaces ingredients in today\'s meals that measurably change outcome based on how they are prepared (e.g. cooking cruciferous vegetables rather than eating them raw, or soaking legumes before cooking), each with the citation it is based on. At the whole-day/meal level, only items that actually need attention are shown; drilled into one side or ingredient, everything shows, including a plain "nothing specific" answer.',
  },
  {
    heading: 'Drilling down',
    body: 'The third floating button, to the left of the view picker, opens the same navigator every lens shares: Whole Day -> a specific meal -> a side within it -> a single ingredient. Tap any crumb to jump straight back to that level, or tap one of the pills below it to go one level deeper; it stays open the whole way down, showing the next level immediately, so you can keep drilling without re-opening it. Tap the ✕ or outside it to close.',
  },
];

export default function InsightsScreen() {
  useRegisterScreenHelp('Insights', INSIGHTS_HELP_SECTIONS, '/insights');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  // Used by the three non-Food-Lookup lenses' own shared ScrollView below.
  // Food Lookup owns its own separate layout instead (see FoodLookupView's
  // own opening comment for why) and no longer needs this at all.
  const scrollViewRef = useRef<ScrollView>(null);
  const [lens, setLens] = useState<Lens>('nutrients');
  // Whether this tab's own specific background/content is currently risen
  // (GatedTabContent.tsx) -- separate from `lens` itself, which keeps its
  // last-picked value indefinitely so LensHub can still show it highlighted
  // at rest. Reset to false on every focus change (both gaining and losing
  // focus) so arriving/re-arriving at Insights always shows the resting
  // "pick a function" prompt first, never an instant resume -- confirmed
  // product behavior, not an oversight.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [nutrientBreakdown, setNutrientBreakdown] = useState<DailyNutrientBreakdown | null>(null);
  const [dimensionsBreakdown, setDimensionsBreakdown] = useState<DailySixDimensionsBreakdown | null>(null);

  // Shared across all three lenses -- drilling into "Breakfast" while
  // looking at 6 Dimensions and then switching to Nutrients should still be
  // showing Breakfast, not silently reset back to the whole day.
  const [scope, setScope] = useState<Scope>({ level: 'day' });
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [expandedTierKey, setExpandedTierKey] = useState<string | null>(null);

  // Nutrient Ranking lens, 2026-08-08 -- independent of today's log (same
  // "reference data, not today's meals" nature as Food Lookup), so this
  // loads once on mount rather than on every focus change. `nutrients`
  // itself never changes at runtime (static reference data); `rankedFoods`
  // refetches only when the picked nutrient actually changes.
  const [allNutrients, setAllNutrients] = useState<TrackedNutrient[]>([]);
  const [rankingNutrient, setRankingNutrient] = useState<string | null>(null);
  const [rankedFoods, setRankedFoods] = useState<RankedFood[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  // 2026-08-14, direct request: "we need a secondary filter for Nutrient
  // ranking. It needs to separate raw food from dried, and from canned,
  // and from any other way that makes it so we end up with an apples to
  // apples way of looking at the food." Shared by both of this lens's own
  // modes below -- see rankFoodsByNutrient/getFoodRankingsAcrossNutrients's
  // own header comments in lib/db.ts for the real, checked reasoning
  // behind the six real groups. `null` means "All," matching every
  // existing caller of rankFoodsByNutrient elsewhere in this app, which
  // still gets the exact same unfiltered result it always has.
  const [rankingPrepGroup, setRankingPrepGroup] = useState<PrepStateGroup | null>(null);
  // The reverse of "pick a nutrient, see ranked foods" -- same message,
  // same day: "the user should be able to select any specific food to see
  // how it ranks in other nutrients, such as 50th in vegetables or 35th in
  // fruit." A real, second mode within this same lens, not a separate one,
  // sharing the prep-state filter above so both modes mean the same thing
  // by "apples to apples."
  const [rankingMode, setRankingMode] = useState<'byNutrient' | 'byFood'>('byNutrient');
  const [rankingFood, setRankingFood] = useState<ResolvedFoodSelection | null>(null);
  const [foodRankings, setFoodRankings] = useState<FoodNutrientRanking[]>([]);
  const [foodRankingsLoading, setFoodRankingsLoading] = useState(false);
  // 2026-08-14, same day, direct follow-up: "the information displayed
  // should also tell the user what percentage of the recommended daily
  // allowance that it represents for a suggested serving size of however
  // much." `rankingDriRows` depends only on the person's own saved
  // profile (sex/age), not on which food/prep-group is active, so it
  // loads once on mount -- the same "static per-session, not per-pick"
  // shape `allNutrients` already has above. `rankingFoodServing` is the
  // real "however much" this asks for: a real, cited natural-unit weight
  // (getFoodUnitWeight, "1 medium banana") when this food is one of the
  // small, curated set that has one, or a plain, honest 100g fallback
  // when it isn't -- never an invented, uncited serving size.
  const [rankingDriRows, setRankingDriRows] = useState<DietaryReferenceIntake[]>([]);
  const [rankingFoodServing, setRankingFoodServing] = useState<{ grams: number; label: string } | null>(null);
  useEffect(() => {
    listTrackedNutrients().then(setAllNutrients);
  }, []);
  useEffect(() => {
    getDietaryReferenceIntakesForCurrentUser().then(setRankingDriRows);
  }, []);
  useEffect(() => {
    if (!rankingNutrient) {
      setRankedFoods([]);
      return;
    }
    let isCurrent = true;
    setRankingLoading(true);
    // TEMPORARY diagnostic logging, 2026-08-14 -- see PopoverSelect.tsx's
    // own debugLabel comment for the still-open freeze investigation this
    // is chasing. Real, direct, on-device timing of the query itself
    // (not a desktop estimate) -- the one piece of ground truth missing so
    // far. queuedAt captures the moment this effect actually starts
    // running, distinct from when React scheduled the update that
    // triggered it.
    const queuedAt = Date.now();
    console.log(`[RankQuery] starting rankFoodsByNutrient(${rankingNutrient}, 100, ${rankingPrepGroup})`);
    rankFoodsByNutrient(rankingNutrient, 100, rankingPrepGroup).then((rows) => {
      console.log(`[RankQuery] resolved in ${Date.now() - queuedAt}ms, ${rows.length} rows`);
      if (isCurrent) {
        setRankedFoods(rows);
        setRankingLoading(false);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [rankingNutrient, rankingPrepGroup]);
  useEffect(() => {
    if (!rankingFood) {
      setFoodRankings([]);
      setRankingFoodServing(null);
      return;
    }
    let isCurrent = true;
    setFoodRankingsLoading(true);
    Promise.all([
      getFoodRankingsAcrossNutrients(rankingFood.foodId, rankingFood.source, rankingPrepGroup),
      getFoodUnitWeight(rankingFood.foodId, rankingFood.source),
    ]).then(([rows, unitWeight]) => {
      if (isCurrent) {
        setFoodRankings(rows);
        setRankingFoodServing(
          unitWeight ? { grams: unitWeight.gramsPerUnit, label: `1 ${unitWeight.unitLabel} (${Math.round(unitWeight.gramsPerUnit)}g)` } : { grams: 100, label: '100g' },
        );
        setFoodRankingsLoading(false);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [rankingFood, rankingPrepGroup]);

  // Safe Foods lens, 2026-08-08 -- same "independent of today's log,
  // load once" nature as Nutrient Ranking above. Categories load once on
  // mount (the underlying safe-food computation is cached for the whole
  // session anyway, see getSafeFoodIds in lib/db.ts); the actual food list
  // refetches only when the picked category changes.
  const [safeFoodCategories, setSafeFoodCategories] = useState<string[]>([]);
  const [safeFoodCategory, setSafeFoodCategory] = useState<string | null>(null);
  const [safeFoods, setSafeFoods] = useState<SafeFood[]>([]);
  const [safeFoodsLoading, setSafeFoodsLoading] = useState(false);
  useEffect(() => {
    listSafeFoodCategories().then(setSafeFoodCategories);
  }, []);
  useEffect(() => {
    if (!safeFoodCategory) {
      setSafeFoods([]);
      return;
    }
    let isCurrent = true;
    setSafeFoodsLoading(true);
    listSafeFoods(safeFoodCategory, 200).then((rows) => {
      if (isCurrent) {
        setSafeFoods(rows);
        setSafeFoodsLoading(false);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [safeFoodCategory]);

  // Healing Stage Food Finder lens, 2026-08-08 -- same "independent of
  // today's log, load once" nature as the two lenses just above. Both
  // stages' own food lists are static reference-data queries, so both
  // load together on mount; `healingStageTab` just switches which already-
  // loaded result set is showing, no separate per-tab fetch needed.
  const [healingStageTab, setHealingStageTab] = useState<'stage1' | 'stage2'>('stage1');
  const [stage1Groups, setStage1Groups] = useState<StageFoodGroupResult[]>([]);
  const [stage2Rounds, setStage2Rounds] = useState<StageFoodGroupResult[]>([]);
  const [healingStageLoading, setHealingStageLoading] = useState(true);
  useEffect(() => {
    Promise.all([listStage1Foods(), listStage2ReintroductionRounds()]).then(([stage1, stage2]) => {
      setStage1Groups(stage1);
      setStage2Rounds(stage2);
      setHealingStageLoading(false);
    });
  }, []);

  // Labs lens, 2026-08-08 -- unlike the four lenses above, this reads a
  // real, growing personal log (lab_results), not static reference data,
  // so it reloads every time the tab regains focus (useFocusEffect, same
  // reasoning as the daily-breakdown fetch below) rather than loading
  // once on mount.
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labResults, setLabResults] = useState<LabResultRecord[]>([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const loadLabs = useCallback(() => {
    setLabsLoading(true);
    Promise.all([getLabTests(), listLabResults(undefined, 300)]).then(([tests, results]) => {
      setLabTests(tests);
      setLabResults(results);
      setLabsLoading(false);
    });
  }, []);
  useFocusEffect(useCallback(() => loadLabs(), [loadLabs]));

  // My Meds & Interactions lens, 2026-08-08 -- a read-only surface over
  // real, already-changing data (active treatments + live interaction
  // checks), so this reloads on focus too, same reasoning as Labs above.
  const [myMedsTreatments, setMyMedsTreatments] = useState<TreatmentRecord[]>([]);
  const [myMedsWarnings, setMyMedsWarnings] = useState<InteractionWarning[]>([]);
  const [myMedsReferenceOnly, setMyMedsReferenceOnly] = useState<ReferenceOnlyRule[]>([]);
  const [myMedsLoading, setMyMedsLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setMyMedsLoading(true);
      Promise.all([listAllActiveTreatments(), evaluateInteractionRules(todayDateString())]).then(
        ([treatments, evaluation]) => {
          setMyMedsTreatments(treatments);
          setMyMedsWarnings(evaluation.warnings);
          setMyMedsReferenceOnly(evaluation.referenceOnly);
          setMyMedsLoading(false);
        },
      );
    }, []),
  );

  // Today's Advisories lens, 2026-08-08 -- today's real, changing log, so
  // this reloads on focus too, same reasoning as Labs/My Meds above.
  const [advisories, setAdvisories] = useState<TriggeredAdvisory[]>([]);
  const [advisoriesLoading, setAdvisoriesLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setAdvisoriesLoading(true);
      getTodaysAdvisories(todayDateString()).then((rows) => {
        setAdvisories(rows);
        setAdvisoriesLoading(false);
      });
    }, []),
  );

  // useFocusEffect (not a plain useEffect) -- Expo Router's tab screens
  // stay mounted in the background when you switch tabs, they don't
  // unmount, so a one-time useEffect only ever fetched once for this
  // screen's entire lifetime. Any meal logged/changed on another tab would
  // never show up here until the app was fully restarted. This re-runs
  // every time Insights actually comes into view instead.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const date = todayDateString();
      setLoading(true);
      Promise.all([getDailyNutrientBreakdown(date), getDailySixDimensionsBreakdown(date)])
        .then(([nutrients, breakdown]) => {
          if (cancelled) return;
          setNutrientBreakdown(nutrients);
          setDimensionsBreakdown(breakdown);
        })
        .catch((error) => {
          if (cancelled) return;
          setErrorMessage(`Could not load today's data: ${error instanceof Error ? error.message : String(error)}`);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  function changeScope(next: Scope) {
    setScope(next);
    setExpandedDimension(null);
    setExpandedTierKey(null);
  }

  const activeLensLabel = LENSES.find((option) => option.key === lens)?.label;

  return (
    <View style={styles.screen}>

      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Insights" variant="insights" revealed={revealed}>
          {lens === 'foodLookup' ? (
            // Deliberately NOT inside the ScrollView below -- Food Lookup's
            // own InlineSelectList/InlineSearchSelectList each render a
            // FlatList, and a FlatList (a VirtualizedList) nested inside a
            // plain ScrollView of the same orientation is an RN
            // anti-pattern (breaks the list's own windowing/virtualization,
            // and RN warns about it loudly). FoodLookup owns its own
            // internal layout for that reason (see its own comment), but
            // not this page-level wrapper -- that varies per caller (see
            // FoodLookup's own closing comment), so it's supplied here.
            <View style={styles.foodLookupActiveListContainer}>
              <FoodLookup tabColor={TAB_COLOR} />
            </View>
          ) : lens === 'nutrientRanking' ? (
            // Also deliberately NOT inside the shared ScrollView below --
            // 2026-08-14, direct report: reaching the Nutrient field meant
            // reaching to the TOP of the screen every time, working against
            // this app's own one-handed-operation goal (the floating hub
            // buttons already cluster low for exactly this reason -- see
            // NAVIGATION_HAND's own comment in constants/floatingButton.ts).
            // NutrientRankingView now owns its own full internal layout
            // (the field pinned low, results scrollable above it), the
            // same "this lens owns its own layout, not the shared page
            // wrapper" precedent Food Lookup already established just
            // above, for the same real reason: this needs a layout the
            // shared ScrollView's own single, uniform scroll area can't
            // express (a fixed zone AND an independently scrolling zone
            // together, not one scrolling column).
            <View style={styles.foodLookupActiveListContainer}>
              <NutrientRankingView
                nutrients={allNutrients}
                selected={rankingNutrient}
                onSelect={setRankingNutrient}
                rankedFoods={rankedFoods}
                loading={rankingLoading}
                tabColor={TAB_COLOR}
                prepGroup={rankingPrepGroup}
                onPrepGroupChange={setRankingPrepGroup}
                mode={rankingMode}
                onModeChange={setRankingMode}
                rankingFood={rankingFood}
                onFoodSelected={setRankingFood}
                onClearFood={() => setRankingFood(null)}
                foodRankings={foodRankings}
                foodRankingsLoading={foodRankingsLoading}
                driRows={rankingDriRows}
                foodServing={rankingFoodServing}
              />
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.body}
              contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}
            >
              {lens === 'cookingImpact' ? (
              // Also independent of today's log -- a pure, static reference
              // lookup (no DB round-trip at all), so this owns its own
              // local compound-selection state rather than anything lifted
              // to this screen's own parent state.
              <CookingImpactView tabColor={TAB_COLOR} />
            ) : lens === 'safeFoods' ? (
              // Also independent of today's log -- same reasoning as
              // Nutrient Ranking, which owns its own layout outside this
              // shared ScrollView now (see InsightsScreen's own render,
              // above cookingImpact's own branch).
              <SafeFoodsView
                categories={safeFoodCategories}
                selected={safeFoodCategory}
                onSelect={setSafeFoodCategory}
                foods={safeFoods}
                loading={safeFoodsLoading}
                tabColor={TAB_COLOR}
              />
            ) : lens === 'healingStage' ? (
              // Also independent of today's log -- same reasoning as
              // Nutrient Ranking/Safe Foods above.
              <HealingStageView
                tab={healingStageTab}
                onTabChange={setHealingStageTab}
                stage1Groups={stage1Groups}
                stage2Rounds={stage2Rounds}
                loading={healingStageLoading}
                tabColor={TAB_COLOR}
              />
            ) : lens === 'labs' ? (
              // A real, growing personal log, not reference data -- see
              // loadLabs' own comment above for why this one lens still
              // reloads on focus like nutrients/sixDs/prep do.
              <LabsView
                labTests={labTests}
                labResults={labResults}
                loading={labsLoading}
                onSaved={loadLabs}
                tabColor={TAB_COLOR}
              />
            ) : lens === 'myMeds' ? (
              <MyMedsView
                treatments={myMedsTreatments}
                warnings={myMedsWarnings}
                referenceOnly={myMedsReferenceOnly}
                loading={myMedsLoading}
                tabColor={TAB_COLOR}
              />
            ) : lens === 'advisories' ? (
              <AdvisoriesView advisories={advisories} loading={advisoriesLoading} tabColor={TAB_COLOR} />
            ) : loading ? (
              <Text style={styles.emptyText}>Loading…</Text>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : lens === 'nutrients' ? (
              !nutrientBreakdown || nutrientBreakdown.meals.length === 0 ? (
                <Text style={styles.emptyText}>Save a meal to see this.</Text>
              ) : (
                <NutrientsTable breakdown={nutrientBreakdown} scope={scope} />
              )
            ) : lens === 'hydration' ? (
              !nutrientBreakdown || nutrientBreakdown.meals.length === 0 ? (
                <Text style={styles.emptyText}>Save a meal to see this.</Text>
              ) : (
                <HydrationView breakdown={nutrientBreakdown} tabColor={TAB_COLOR} />
              )
            ) : !dimensionsBreakdown || dimensionsBreakdown.meals.length === 0 ? (
              <Text style={styles.emptyText}>Save a meal to see this.</Text>
            ) : lens === 'sixDs' ? (
              <SixDsView
                breakdown={dimensionsBreakdown}
                scope={scope}
                expandedDimension={expandedDimension}
                onToggleDimension={(dimension) => setExpandedDimension((current) => (current === dimension ? null : dimension))}
                expandedTierKey={expandedTierKey}
                onToggleTier={(key) => setExpandedTierKey((current) => (current === key ? null : key))}
              />
            ) : (
              <PrepView breakdown={dimensionsBreakdown} scope={scope} />
              )}
            </ScrollView>
          )}
        </GatedTabContent>
      </SwipeableTabScreen>

      {/* Rendered here, as a sibling of the ScrollView -- not inside any
          lens's own content -- so it truly floats fixed at the bottom of
          the screen. A copy nested inside NutrientsTable/SixDsView/PrepView
          would sit in the scrollable content instead, and scroll away with
          everything else rather than staying put. Gated on `revealed` too --
          doesn't make sense to offer a drill-down into content that isn't
          risen/showing yet. */}
      {!revealed ||
      lens === 'foodLookup' ||
      lens === 'nutrientRanking' ||
      lens === 'cookingImpact' ||
      lens === 'safeFoods' ||
      lens === 'healingStage' ||
      lens === 'hydration' ||
      lens === 'labs' ||
      lens === 'myMeds' ||
      lens === 'advisories'
        ? null
        : lens === 'nutrients'
        ? nutrientBreakdown && nutrientBreakdown.meals.length > 0 && (
            <ScopeHub breakdown={nutrientBreakdown} scope={scope} onChangeScope={changeScope} />
          )
        : dimensionsBreakdown &&
          dimensionsBreakdown.meals.length > 0 && (
            <ScopeHub breakdown={dimensionsBreakdown} scope={scope} onChangeScope={changeScope} />
          )}

      <PageIdentityLabel title="Insights" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Insights" tabColor={TAB_COLOR} />
      <LensHub
        pageTitle="Insights"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

// One row per nutrient, sorted so what's actually worth a look sorts to the
// top -- a real table instead of prose sentences, since a table is what
// lets four numbers per nutrient (name, amount, target, status) be scanned
// at a glance instead of read one at a time.
//
// At "Whole Day" scope, every nutrient is judged against today's target
// (deficient/low/adequate/excess risk) -- that judgment is meaningful for a
// full day's intake. Below the day level, a single food/side/meal isn't
// "deficient" in Vitamin C just because it's not the whole day's supply of
// it -- that's a category error, not a finding. So sub-day scopes drop the
// status judgment/coloring entirely and just show what fraction of today's
// target that scope contributed, sorted by biggest contributor first, with
// only nutrients this scope actually contains listed at all.
export function NutrientsTable({
  breakdown,
  scope,
}: {
  breakdown: DailyNutrientBreakdown;
  scope: Scope;
}) {
  const isDayScope = scope.level === 'day';
  const scopeTotals = resolveScopeNutrientTotals(breakdown, scope);
  const entries = analyzeNutrientIntake(breakdown.driRows, scopeTotals, isDayScope ? breakdown.supplementTotals : {});

  const sortRank: Record<string, number> = { deficient: 0, excess_risk: 0, low: 1, adequate: 2, within_limit: 2 };
  const visibleEntries = isDayScope ? entries : entries.filter((entry) => entry.combinedTotal > 0);
  const sorted = isDayScope
    ? [...visibleEntries].sort((a, b) => (sortRank[a.status] ?? 3) - (sortRank[b.status] ?? 3))
    : [...visibleEntries].sort((a, b) => b.percentOfTarget - a.percentOfTarget);

  return (
    <>
      {isDayScope && !breakdown.profileComplete ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Your sex and birth date aren&apos;t set in Profile, so these targets cover every applicable population
            rather than one tailored to you.
          </Text>
        </View>
      ) : null}

      {sorted.length === 0 ? (
        <Text style={styles.emptyText}>
          {isDayScope
            ? 'Nothing to compare yet. Once foods with nutrient data are logged today, targets will show up here.'
            : "This doesn't have a measurable amount of any tracked nutrient."}
        </Text>
      ) : (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellNutrient]}>Nutrient</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellAmount]}>Amount</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellStatus]}>
              {isDayScope ? 'Status' : '% of Day'}
            </Text>
          </View>
          {sorted.map((entry, index) => {
            const entrySeverity = isDayScope ? nutrientStatusSeverity(entry.status) : null;
            return (
              <View
                key={`${entry.nutrientCode}_${index}`}
                style={[styles.tableRow, entrySeverity ? severityRowStyle(entrySeverity) : null]}
              >
                <Text style={[styles.tableCell, styles.tableCellNutrient]} numberOfLines={1}>
                  {entry.displayName}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellAmount]} numberOfLines={1}>
                  {formatAmount(entry.combinedTotal, entry.unit)} / {formatAmount(entry.target, entry.unit)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellStatus,
                    entrySeverity ? severityTextStyle(entrySeverity) : styles.statusNeutralText,
                  ]}
                  numberOfLines={2}
                >
                  {isDayScope
                    ? `${NUTRIENT_STATUS_LABELS[entry.status] ?? entry.status} (${Math.round(entry.percentOfTarget)}%)`
                    : `${Math.round(entry.percentOfTarget)}%`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {isDayScope && breakdown.unresolvedItems.length > 0 ? (
        <Text style={styles.footerNote}>
          {breakdown.unresolvedItems.length} ingredient{breakdown.unresolvedItems.length === 1 ? '' : 's'} couldn&apos;t be
          counted here: usually a solid food measured by volume, or logged as &quot;each&quot; for a food without a known
          per-item weight yet. Log it by weight (g/oz) to have it count.
        </Text>
      ) : null}

      {isDayScope && breakdown.supplementSkipped.length > 0 ? (
        <Text style={styles.footerNote}>
          {breakdown.supplementSkipped.length} supplement ingredient{breakdown.supplementSkipped.length === 1 ? '' : 's'} couldn&apos;t
          be counted here: usually an IU dose for a nutrient with no single official IU-to-mass conversion (e.g.
          vitamin E), or a unit this app doesn&apos;t recognize yet. Check that supplement&apos;s ingredients on the Schedule
          tab&apos;s Supplements lens.
        </Text>
      ) : null}
    </>
  );
}

// Hydration lens, 2026-08-08 -- "already explicitly named and not yet
// built. A dedicated ring or section instead of one more row buried in
// the Nutrients table" (Lens Coverage Audit). Whole-day only, deliberately
// simpler than NutrientsTable's own scope-drillable table -- a single,
// glanceable ring is the whole point here, not a second full table.
// Reuses the exact same analyzeNutrientIntake call NutrientsTable's own
// day-scope branch already makes; water's own amount is stored in grams
// (see scripts/build_food_reference_db.py's own DIETARY_REFERENCE_INTAKES),
// numerically equivalent to mL for water specifically (density ~1g/mL),
// converted to liters here purely for a more readable display.
function HydrationView({ breakdown, tabColor }: { breakdown: DailyNutrientBreakdown; tabColor: string }) {
  const entries = analyzeNutrientIntake(breakdown.driRows, breakdown.dayTotals, breakdown.supplementTotals);
  const water = entries.find((entry) => entry.nutrientCode === 'water');

  if (!water) {
    return <Text style={styles.emptyText}>No water target found. Check your sex and birth date in Profile.</Text>;
  }

  const litersConsumed = water.combinedTotal / 1000;
  const litersTarget = water.target / 1000;

  return (
    <View style={styles.hydrationWrap}>
      <ProgressRing
        percent={water.percentOfTarget}
        color={tabColor}
        size={150}
        strokeWidth={12}
        label={`${litersConsumed.toFixed(1)}L`}
        sublabel={`of ${litersTarget.toFixed(1)}L`}
      />
      <Text style={[styles.hydrationStatus, { color: tabColor }]}>
        {NUTRIENT_STATUS_LABELS[water.status] ?? water.status} ({Math.round(water.percentOfTarget)}%)
      </Text>
      <Text style={styles.hydrationNote}>
        Counts everything logged today, drinks and water-rich foods alike (soup, watermelon, and similar all
        contribute), not just what you drank directly.
      </Text>
      {!breakdown.profileComplete ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Your sex and birth date aren&apos;t set in Profile, so this target covers every applicable population
            rather than one tailored to you.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// A floating third hub button (see components/LensHub.tsx/TabHub.tsx for
// the same family of controls) -- opening a "you are here" trail plus a
// list of what's one level deeper. This is the navigation shared by all
// three lenses, so drilling from the whole day down to one ingredient is
// always a short, undoable series of taps instead of a wall of nested,
// simultaneously-expanded accordions. Was previously an inline row at the
// top of each lens's own content; moved into its own floating popup (same
// reasoning as LensHub replacing the old inline tab-pill row) so it
// doesn't eat vertical space from the actual data, and so it's reachable
// one-handed exactly like the other two hubs regardless of scroll
// position.
//
// 2026-07-25: moved from the screen's true bottom-left corner into the
// slot immediately left of TabHub (useSecondaryHubPosition(0)) -- that
// corner now belongs to LensHub's own button, redesigned to double as a
// "which tab am I in" marker, which only makes sense anchored at the true
// corner. This is the swap that made room for it.
//
// 2026-07-28: bumped from slot 0 to slot 1 -- slot 0 (closest to the
// butterfly) now belongs to MyItemsHub's own "My Insights" button, the
// same shortcut every other Lens page also gets in that exact spot. This
// button just shifts one slot further out to make room, same idea as the
// swap that first put it here.
function ScopeHub<M extends NavigableMeal>({
  breakdown,
  scope,
  onChangeScope,
}: {
  breakdown: { meals: M[] };
  scope: Scope;
  onChangeScope: (scope: Scope) => void;
}) {
  const [open, setOpen] = useState(false);
  const { bottom: buttonBottom, left: buttonLeft } = useSecondaryHubPosition(1);
  // Independent of buttonBottom -- the button itself stays anchored inside
  // the footer band; only the popup card floats clear above it (see
  // useMenuCardBottom's own comment in constants/floatingButton.ts).
  const cardBottom = useMenuCardBottom();

  const crumbs = scopeBreadcrumbs(breakdown, scope);

  let children: { label: string; scope: Scope }[] = [];
  if (scope.level === 'day') {
    children = breakdown.meals.map((meal, mealIndex) => ({
      label: `${capitalize(meal.mealType)} · ${meal.mealName}`,
      scope: { level: 'meal', mealIndex },
    }));
  } else if (scope.level === 'meal') {
    const meal = resolveScopeMeal(breakdown, scope);
    children = (meal?.sides ?? []).map((side, sideIndex) => ({
      label: side.sideName,
      scope: { level: 'side', mealIndex: scope.mealIndex, sideIndex },
    }));
  } else if (scope.level === 'side') {
    const side = resolveScopeSide(breakdown, scope);
    children = (side?.items ?? []).map((item, itemIndex) => ({
      label: item.foodName,
      scope: { level: 'item', mealIndex: scope.mealIndex, sideIndex: scope.sideIndex, itemIndex },
    }));
  }

  // Deliberately does NOT close the popup -- picking a child (e.g. a meal)
  // immediately shows the next level's own children (its sides) right
  // there, so drilling several levels deep is one continuous flow. Without
  // this, the popup closed after every single tap and silently left it up
  // to the person to notice and re-tap the floating button just to see
  // what they'd drilled into. Closing is now only ever explicit -- the ✕
  // in the header, or tapping the backdrop.
  function choose(nextScope: Scope) {
    onChangeScope(nextScope);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.scopeButton, { bottom: buttonBottom, left: buttonLeft }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        accessibilityLabel="Drill down into today's meals"
      >
        <Ionicons name="layers-outline" size={24} color={colors.textOnPrimary} style={textShadow} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.scopeCard, { bottom: cardBottom, left: SECONDARY_HUB_CARD_LEFT_MARGIN, borderColor: TAB_COLOR }]}>
            <View style={styles.scopeCardHeaderRow}>
              {/* Title case, not the literal "DRILL DOWN" this used before
                  2026-07-28 -- no all-caps headers anywhere, per explicit
                  request. This one was hardcoded uppercase text, not just
                  a textTransform, so it needed fixing here directly too. */}
              <Text style={styles.cardHeader}>Drill Down</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <Text style={styles.scopeCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.breadcrumbRow}>
              {crumbs.map((crumb, index) => (
                <View key={index} style={styles.breadcrumbItem}>
                  {index > 0 ? <Text style={styles.breadcrumbSep}>›</Text> : null}
                  <TouchableOpacity onPress={() => choose(crumb.scope)} disabled={index === crumbs.length - 1}>
                    <Text style={[styles.breadcrumbText, index === crumbs.length - 1 && styles.breadcrumbTextActive]}>
                      {crumb.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {children.length > 0 ? (
              <View style={styles.pillRow}>
                {children.map((child) => (
                  <TouchableOpacity key={child.label} style={styles.pill} onPress={() => choose(child.scope)}>
                    <Text style={styles.pillText} numberOfLines={1}>
                      {child.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

// The 6 Dimensions lens -- a compact scorecard (one row per dimension, "N flagged"
// or "Clear") for whatever scope is currently selected, expanding to a
// real sub-criterion table on tap. Never shows more than one scope's
// worth of detail at once.
export function SixDsView({
  breakdown,
  scope,
  expandedDimension,
  onToggleDimension,
  expandedTierKey,
  onToggleTier,
}: {
  breakdown: DailySixDimensionsBreakdown;
  scope: Scope;
  expandedDimension: string | null;
  onToggleDimension: (dimension: string) => void;
  expandedTierKey: string | null;
  onToggleTier: (key: string) => void;
}) {
  const scores = resolveScopeScores(breakdown, scope);
  const groups = groupDailyScoresByDimension(scores);

  return (
    <>
      <View style={styles.table}>
        {groups.map((group) => {
          const allTiersInDimension = group.items.flatMap((item) => item.entries.map((entry) => entry.tier));
          const dimensionSeverity = worstTierSeverity(allTiersInDimension);
          const flaggedCount = group.items.filter((item) =>
            item.entries.some((entry) => isFlaggedTier(entry.tier)),
          ).length;
          const dimensionLabel =
            dimensionSeverity === 'unknown' ? 'Not assessed' : flaggedCount > 0 ? `${flaggedCount} flagged` : 'Clear';
          const expanded = expandedDimension === group.dimension;

          return (
            <View key={group.dimension}>
              <TouchableOpacity
                style={[styles.tableRow, severityRowStyle(dimensionSeverity)]}
                onPress={() => onToggleDimension(group.dimension)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tableCell, styles.tableCellDimension]} numberOfLines={2}>
                  {group.dimension}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellStatus, severityTextStyle(dimensionSeverity)]}>
                  {dimensionLabel}
                </Text>
              </TouchableOpacity>

              {expanded ? (
                <View style={styles.subTable}>
                  {group.items.map((item) => {
                    const key = `${group.dimension}|${item.subCriterion}`;
                    const tierExpanded = expandedTierKey === key;
                    const distinctTiers = Array.from(new Set(item.entries.map((entry) => entry.tier)));
                    const showFoodBreakdown = item.entries.length > 1;
                    const rowSeverity = worstTierSeverity(distinctTiers);

                    return (
                      <View key={item.subCriterion}>
                        <TouchableOpacity
                          style={styles.subTableRow}
                          onPress={() => onToggleTier(key)}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.subTableLabel} numberOfLines={1}>
                            {item.subCriterion}
                          </Text>
                          <Text
                            style={[
                              styles.subTableValue,
                              severityTextStyle(rowSeverity),
                              tierExpanded && styles.subTableValueActive,
                            ]}
                            numberOfLines={1}
                          >
                            {distinctTiers.join(', ')}
                          </Text>
                        </TouchableOpacity>
                        {tierExpanded ? (
                          <View style={styles.detailBlock}>
                            {showFoodBreakdown
                              ? item.entries.map((entry, index) => (
                                  <View key={`${entry.foodName}_${index}`} style={styles.detailFoodRow}>
                                    <Text style={styles.detailFoodName}>{entry.foodName}</Text>
                                    <Text style={[styles.detailFoodTier, severityTextStyle(tierSeverity(entry.tier))]}>
                                      {entry.tier}
                                    </Text>
                                  </View>
                                ))
                              : null}
                            {distinctTiers.map((tier) => (
                              <Text key={tier} style={styles.detailText}>
                                <Text style={severityTextStyle(tierSeverity(tier))}>{tier}</Text>: {getTierDefinition(tier)}
                              </Text>
                            ))}
                            <Text style={styles.detailSourcesLabel}>Sources</Text>
                            <Text style={styles.detailSourcesText}>{linkifyText(getSubCriterionSources(item.subCriterion))}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}

// Cooking & Prep lens -- a flat "needs attention" summary for the whole
// day up top (always visible, regardless of scope), then the same scope
// navigator as 6 Dimensions for browsing tips meal-by-meal/side-by-side/item-by-
// item.
type PrepRow = { foodName: string; mealName: string; sideName: string; tips: ReturnType<typeof selectPrepTips> };

// Every item within the current scope, with its own prep tips already
// resolved -- day/meal scope walks every side under it, side/item scope
// resolves down to just that one slice. Mirrors resolveScopeScores /
// resolveScopeNutrientTotals: one function that reads whatever the current
// scope actually contains, rather than a separate always-the-whole-day list
// living next to a separately-scoped browser (the previous shape here,
// which is exactly what let the "needs attention" list silently ignore
// whatever scope was selected below it).
function itemsInScope(breakdown: DailySixDimensionsBreakdown, scope: Scope): PrepRow[] {
  const rows: PrepRow[] = [];
  const addItem = (item: { foodName: string; bySubCriterion: DailyDimensionScore[] }, mealName: string, sideName: string) => {
    rows.push({ foodName: item.foodName, mealName, sideName, tips: selectPrepTips(flattenItemScores(item)) });
  };

  if (scope.level === 'day') {
    for (const meal of breakdown.meals) {
      for (const side of meal.sides) {
        for (const item of side.items) addItem(item, meal.mealName, side.sideName);
      }
    }
    return rows;
  }

  const meal = resolveScopeMeal(breakdown, scope);
  if (!meal) return rows;

  if (scope.level === 'meal') {
    for (const side of meal.sides) {
      for (const item of side.items) addItem(item, meal.mealName, side.sideName);
    }
    return rows;
  }

  const side = resolveScopeSide(breakdown, scope);
  if (!side) return rows;

  if (scope.level === 'side') {
    for (const item of side.items) addItem(item, meal.mealName, side.sideName);
    return rows;
  }

  const item = side.items[scope.itemIndex];
  if (item) addItem(item, meal.mealName, side.sideName);
  return rows;
}

// A title that only states what the scope above it (breadcrumbs/ScopeNav)
// doesn't already say -- at "Whole Day" scope a row needs its meal and side
// spelled out, but once you've drilled into that side, repeating its name
// on every row inside it is just noise.
function prepRowTitle(row: PrepRow, scopeLevel: Scope['level']): string {
  if (scopeLevel === 'day') return `${row.foodName} · ${row.mealName}, ${row.sideName}`;
  if (scopeLevel === 'meal') return `${row.foodName} · ${row.sideName}`;
  return row.foodName;
}

export function PrepView({
  breakdown,
  scope,
  // What to call a 'meal'-level scope in the two labels below -- 'meal' by
  // default (the real Insights tab's own Whole Day -> Meal hierarchy), but
  // a saved side's own detail view (app/food-item-detail.tsx, 2026-08-01)
  // reuses this exact component with its "whole side" view AS a 'meal'-
  // level scope (see that file's own comment for why), where "Needs
  // attention in this meal" would be a real, confusing misnomer for
  // something that was never a meal at all.
  mealNoun = 'meal',
}: {
  breakdown: DailySixDimensionsBreakdown;
  scope: Scope;
  mealNoun?: string;
}) {
  const rows = itemsInScope(breakdown, scope);

  // Broad scopes (day/meal) can span a dozen-plus ingredients, most of
  // which need nothing -- only the ones actually worth attention are shown,
  // same reasoning as before. Once drilled down to a side or single item,
  // every item in scope is shown regardless, since at that point you're
  // asking a definitive question about a specific, small thing rather than
  // scanning for what stands out.
  const isBroadScope = scope.level === 'day' || scope.level === 'meal';
  const visibleRows = isBroadScope ? rows.filter((row) => row.tips.length > 0) : rows;

  const sectionLabel =
    scope.level === 'day'
      ? 'Needs attention today'
      : scope.level === 'meal'
        ? `Needs attention in this ${mealNoun}`
        : scope.level === 'side'
          ? "This side's ingredients"
          : 'This ingredient';

  const emptyMessage =
    scope.level === 'day'
      ? "Nothing in today's meals needs special cooking or prep adjustment."
      : scope.level === 'meal'
        ? `Nothing in this ${mealNoun} needs special cooking or prep adjustment.`
        : 'Nothing to show for this scope.';

  return (
    <>
      <Text style={styles.sectionLabel}>{sectionLabel}</Text>

      {visibleRows.length === 0 ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : (
        <View style={styles.table}>
          {visibleRows.map((row, index) => (
            <View key={`${row.foodName}_${index}`} style={styles.tipCard}>
              <Text style={styles.tipCardTitle}>{prepRowTitle(row, scope.level)}</Text>
              {row.tips.length === 0 ? (
                <Text style={styles.emptyText}>Nothing specific for this ingredient.</Text>
              ) : (
                row.tips.map((tip) => (
                  <View key={tip.subCriterion} style={styles.tipEntry}>
                    <Text style={styles.detailSourcesLabel}>{tip.subCriterion}</Text>
                    <Text style={styles.tipText}>{tip.instruction}</Text>
                    <Text style={styles.detailSourcesLabel}>Source</Text>
                    <Text style={styles.detailSourcesText}>{linkifyText(getSubCriterionSources(tip.subCriterion))}</Text>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

// Nutrient Ranking lens, 2026-08-08 -- "a lens that is used to show food
// items based on how much of any specific thing is within them, such as
// to provide the list of foods in order of most protein to least, but
// separated by whether they are animal protein versus plant protein."
// Plain mapped rows, the same shape NutrientsTable/SixDsView above already
// use -- no FlatList needed at this scale (100 rows max, see
// rankFoodsByNutrient's own limit).
//
// 2026-08-14, direct report: "the field is at the top of the body of the
// app space and we are trying to make the app mostly capable of being
// fully operated from the chosen hand... Place the selector the way it is
// now and place it just above the footer top edge, and w[h]en something
// is selected from it, the results should be viewed just above the
// selector." Rebuilt from one plain scrolling column (label, field,
// results, all stacked top to bottom, the field reachable only by
// scrolling all the way up) into a real, two-zone layout: a scrollable
// results area filling the available space, and a fixed, non-scrolling
// field zone -- unchanged in its own look, per "place the selector the
// way it is now" -- pinned at the bottom, clearing the floating hub
// button/footer the exact same way the last item in any other lens' own
// scroll area already does (useFloatingButtonScrollPadding). This
// component now owns its own full layout, the same "not the shared page
// ScrollView" precedent Food Lookup already established, for the same
// real reason -- see this lens' own new branch in InsightsScreen's return.
//
// 2026-08-14, same day, two more real, direct requests, both handled here:
// "we need a secondary filter for Nutrient ranking. It needs to separate
// raw food from dried, and from canned, and from any other way that makes
// it so we end up with an apples to apples way of looking at the food. And
// then, the user should be able to select any specific food to see how it
// ranks in other nutrients, such as 50th in vegetables or 35th in fruit."
// A real, second mode (`mode`) added alongside the original "pick a
// nutrient" one, sharing one prep-state filter (`prepGroup`) between both
// -- see rankFoodsByNutrient/getFoodRankingsAcrossNutrients's own header
// comments in lib/db.ts for the real, checked reasoning behind the six
// real prep-state groups, and for why this filter is genuinely NOT
// auto-applied based on a picked food's own prep state (a considered call,
// not an oversight -- see getFoodRankingsAcrossNutrients's own comment).
function NutrientRankingView({
  nutrients,
  selected,
  onSelect,
  rankedFoods,
  loading,
  tabColor,
  prepGroup,
  onPrepGroupChange,
  mode,
  onModeChange,
  rankingFood,
  onFoodSelected,
  onClearFood,
  foodRankings,
  foodRankingsLoading,
  driRows,
  foodServing,
}: {
  nutrients: TrackedNutrient[];
  selected: string | null;
  onSelect: (code: string) => void;
  rankedFoods: RankedFood[];
  loading: boolean;
  tabColor: string;
  prepGroup: PrepStateGroup | null;
  onPrepGroupChange: (group: PrepStateGroup | null) => void;
  mode: 'byNutrient' | 'byFood';
  onModeChange: (mode: 'byNutrient' | 'byFood') => void;
  rankingFood: ResolvedFoodSelection | null;
  onFoodSelected: (food: ResolvedFoodSelection) => void;
  onClearFood: () => void;
  foodRankings: FoodNutrientRanking[];
  foodRankingsLoading: boolean;
  driRows: DietaryReferenceIntake[];
  foodServing: { grams: number; label: string } | null;
}) {
  // Memoized, 2026-08-12 -- see the real render-storm root-caused and fixed
  // the same day in PopoverSelect.tsx's own header comment. A fresh array
  // here on every render was exactly the thing breaking PopoverSelect's own
  // memo() bailout, and this field is a real, direct instance of that: any
  // unrelated re-render of this screen (rankingLoading flipping, a Home/
  // TabHub-driven re-render elsewhere in the tree, etc.) rebuilt this array,
  // forcing PopoverSelect to re-render too, re-firing its own no-deps
  // effects on every one of those ticks. `nutrients` only ever changes once
  // (see its own comment above -- static reference data, loaded on mount),
  // so this now only rebuilds when it genuinely needs to.
  const nutrientOptions = useMemo(
    () => nutrients.map((n) => ({ label: `${n.displayName} (${n.unit})`, value: n.code })),
    [nutrients],
  );
  // Same reasoning as nutrientOptions just above -- a fixed, six-entry list
  // that never changes, so a plain module-scope constant would already be
  // stable, but built via useMemo anyway for the identical, cheap
  // insurance against a future edit accidentally making it unstable.
  const prepGroupOptions = useMemo(
    () => [
      { label: 'All prep states', value: 'all' },
      ...PREP_STATE_GROUP_ORDER.map((group) => ({ label: PREP_STATE_GROUP_LABELS[group], value: group })),
    ],
    [],
  );
  // 2026-08-14, a real, direct recurrence of the exact ~15-second freeze
  // this app already root-caused once (see PopoverSelect.tsx's own header
  // comment): a fresh arrow function literal, defined inline in this
  // component's own JSX, is created on every render, breaking
  // PopoverSelect's memo() bailout the same way an unmemoized `options`
  // array did before -- this field's own onSelect prop was exactly that.
  // `onPrepGroupChange` (setRankingPrepGroup, a raw React setState setter,
  // passed straight down from InsightsScreen) is itself already stable, so
  // wrapping it here is enough to make the whole callback stable too.
  const handlePrepGroupSelect = useCallback(
    (value: string) => onPrepGroupChange(value === 'all' ? null : (value as PrepStateGroup)),
    [onPrepGroupChange],
  );
  // One real DRI row per nutrient code, for the %DV computation below --
  // takes whichever row sorts first when the person's own profile doesn't
  // have sex/age set (getDietaryReferenceIntakesForProfile's own comment:
  // an unset profile can return several real rows per nutrient, one per
  // demographic). A real, acknowledged simplification for that specific
  // case; the common case (a set profile) only ever has one row per
  // nutrient to begin with, so this never actually has to choose there.
  const driByNutrient = useMemo(() => {
    const map = new Map<string, DietaryReferenceIntake>();
    for (const dri of driRows) {
      if (!map.has(dri.nutrientCode)) map.set(dri.nutrientCode, dri);
    }
    return map;
  }, [driRows]);
  const selectedNutrient = nutrients.find((n) => n.code === selected) ?? null;
  // Same real clearance every other scrollable lens already applies at the
  // bottom of ITS own last piece of content, applied here to the bottom of
  // the fixed field zone instead, so it sits just above the floating hub
  // button/footer rather than under it.
  const fieldBottomPadding = useFloatingButtonScrollPadding();
  // 2026-08-14, real, testable hypothesis for the still-open row-tap-delay
  // freeze -- see PopoverSelect's own onOpenChange comment for the full
  // reasoning. Tracks whether EITHER field's popover is genuinely open
  // right now (a Set, not a bool, since two independent fields each report
  // their own open/close) so the results area below can stop competing
  // with it for touches while it's up -- a real, testable fix for the
  // "two independently-scrollable/touchable regions sharing the same
  // screen space" theory, and a reasonable UX improvement in its own
  // right regardless (nobody's trying to scroll results while a picker is
  // actively open over them).
  const [openPopovers, setOpenPopovers] = useState<Set<'nutrient' | 'prepState'>>(() => new Set());
  const handleNutrientPopoverOpenChange = useCallback((isFieldOpen: boolean) => {
    setOpenPopovers((current) => {
      const next = new Set(current);
      if (isFieldOpen) next.add('nutrient');
      else next.delete('nutrient');
      return next;
    });
  }, []);
  const handlePrepStatePopoverOpenChange = useCallback((isFieldOpen: boolean) => {
    setOpenPopovers((current) => {
      const next = new Set(current);
      if (isFieldOpen) next.add('prepState');
      else next.delete('prepState');
      return next;
    });
  }, []);
  const anyPopoverOpen = openPopovers.size > 0;

  function renderRow(food: RankedFood, rank: number) {
    return (
      <View key={`${food.category}|${food.foodId}|${food.source}`} style={styles.rankRow}>
        <Text style={styles.rankNumber}>{rank}</Text>
        <View style={styles.rankTextWrap}>
          <Text style={styles.rankFoodName}>
            {food.baseName}
          </Text>
          <Text style={styles.rankFoodCategory}>
            {categoryLabel(food.category)}
            {food.subcategory ? ` · ${food.subcategory}` : ''}
            {/* Only shown for a real, non-default prep state -- 2026-08-11.
                rankFoodsByNutrient now dedupes per (food, prep state), not
                per food alone -- direct instruction, since drying/cooking
                genuinely changes a food's own nutrient content and both
                real numbers should be visible rather than one silently
                winning over the other. That means the SAME food can show
                up here twice (Mushroom, Raw and Mushroom, Dried, each its
                own real ranked row) -- this label is what actually
                distinguishes them, so it's genuinely load-bearing here, not
                just a nice-to-have. Plain Raw/Standard rows still don't
                need it spelled out, since that's the default a bare label
                already reads as. */}
            {food.prepMethod && food.prepMethod !== 'Raw' ? ` · ${food.prepMethod}` : ''}
            {/* Real source attribution, 2026-08-11 -- "data from any of
                the datasets should always identify itself as being from
                its host dataset." Insights is deliberately the one place
                this app lets a food's own SOURCE stay visible rather than
                defaulting/hiding it the way the builders' own USDA-first
                convention will (separate, not-yet-built work) -- this is
                exactly the "comparison between datasets" context that's
                meant to allow. */}
            {` · ${sourceLabel(food.source)}`}
          </Text>
        </View>
        <Text style={styles.rankAmount}>{formatAmount(food.amountPer100g, selectedNutrient?.unit ?? '')}</Text>
      </View>
    );
  }

  // 2026-08-14 -- the reverse of renderRow: one row per NUTRIENT (not per
  // food), sorted rank-ascending by the query itself (see
  // getFoodRankingsAcrossNutrients's own ORDER BY), so the picked food's
  // own most notable/exceptional nutrients naturally surface first rather
  // than an alphabetical list someone has to scan through.
  //
  // 2026-08-14, same day, direct follow-up: "the information displayed
  // should also tell the user what percentage of the recommended daily
  // allowance that it represents for a suggested serving size of however
  // much." Shown as a second, smaller line under the per-100g amount --
  // omitted entirely (not shown as "N/A" or similar) for the real,
  // roughly third of tracked nutrients (lycopene, caffeine, every fat/
  // carb/sugar figure) with no official DRI at all, per this app's own
  // standing discipline against inventing a target that doesn't exist.
  function renderFoodRankingRow(entry: FoodNutrientRanking) {
    const dri = driByNutrient.get(entry.nutrientCode);
    const percent = dri && foodServing ? percentOfDailyTarget(entry.amountPer100g, foodServing.grams, dri.amount) : null;
    return (
      <View key={entry.nutrientCode} style={styles.rankRow}>
        <Text style={styles.rankNumber}>{entry.rank}</Text>
        <View style={styles.rankTextWrap}>
          <Text style={styles.rankFoodName}>{entry.displayName}</Text>
          <Text style={styles.rankFoodCategory}>of {entry.poolSize}</Text>
        </View>
        <View style={styles.rankAmountWrap}>
          <Text style={styles.rankAmount}>{formatAmount(entry.amountPer100g, entry.unit)}</Text>
          {percent != null ? <Text style={styles.rankDriPercent}>{Math.round(percent)}% DV</Text> : null}
        </View>
      </View>
    );
  }

  // FoodLookup needs its own real, non-ScrollView-nested space while
  // actively picking -- nesting its internal FlatList inside this view's
  // own results ScrollView (below) is the same real RN anti-pattern that
  // crashed Garden's own harvest/planting pickers earlier this same day
  // (see FoodLookup.tsx's own closing comment). This branch is the whole
  // reason mode/rankingFood/onFoodSelected are threaded down here rather
  // than kept local to a results-only sub-view -- picking a food is a
  // genuinely different layout, not just different content inside the
  // same one.
  if (mode === 'byFood' && !rankingFood) {
    return (
      <View style={styles.rankLayout}>
        <View style={styles.pillWrap}>
          <TouchableOpacity
            style={[styles.stagePill, { borderColor: tabColor }]}
            onPress={() => onModeChange('byNutrient')}
          >
            <Text style={[styles.stagePillText, { color: tabColor }]}>By Nutrient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stagePill, { backgroundColor: tabColor, borderColor: tabColor }]}
            onPress={() => onModeChange('byFood')}
          >
            <Text style={[styles.stagePillText, styles.stagePillTextActive]}>By Food</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.emptyText, styles.rankSpaced]}>
          Search or browse below to pick a food and see how it ranks against every nutrient it has a measured
          amount of, within its own category.
        </Text>
        <FoodLookup tabColor={tabColor} showNutrients={false} onFoodResolved={onFoodSelected} />
      </View>
    );
  }

  return (
    <View style={styles.rankLayout}>
      {/* The results zone -- scrolls on its own, independent of the fixed
          field zone below it, so a long ranked list never pushes the field
          itself out of reach. Renders nothing while !selected -- the field
          zone's own caption right under the picker already explains what
          to do, 2026-08-14, so a second, duplicate explanation up here
          would be redundant. "loading"/"none found"/actual results are
          unchanged in substance -- only WHERE they sit changed. */}
      <ScrollView
        style={styles.rankResultsScroll}
        contentContainerStyle={styles.rankResultsContent}
        scrollEnabled={!anyPopoverOpen}
        pointerEvents={anyPopoverOpen ? 'none' : 'auto'}
      >
        <View style={styles.pillWrap}>
          <TouchableOpacity
            style={[styles.stagePill, mode === 'byNutrient' ? { backgroundColor: tabColor, borderColor: tabColor } : { borderColor: tabColor }]}
            onPress={() => onModeChange('byNutrient')}
          >
            <Text style={[styles.stagePillText, mode === 'byNutrient' ? styles.stagePillTextActive : { color: tabColor }]}>
              By Nutrient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stagePill, mode === 'byFood' ? { backgroundColor: tabColor, borderColor: tabColor } : { borderColor: tabColor }]}
            onPress={() => onModeChange('byFood')}
          >
            <Text style={[styles.stagePillText, mode === 'byFood' ? styles.stagePillTextActive : { color: tabColor }]}>
              By Food
            </Text>
          </TouchableOpacity>
        </View>
        {mode === 'byNutrient' ? (
          !selected ? null : loading ? (
            <Text style={[styles.emptyText, styles.rankSpaced]}>Loading…</Text>
          ) : rankedFoods.length === 0 ? (
            <Text style={[styles.emptyText, styles.rankSpaced]}>No foods with a measured amount of this found.</Text>
          ) : selected === 'protein' ? (
            // Protein specifically splits into Animal vs. Plant -- see
            // classifyProteinSource's own comment in lib/db.ts for exactly
            // which categories land where and why. A food whose category isn't
            // a real "protein source" category at all (a sauce, a sweetener)
            // is simply left out of both lists rather than forced into either.
            <>
              <Text style={[styles.rankGroupHeading, styles.rankSpaced, { color: tabColor }]}>Animal Protein</Text>
              <View style={styles.table}>
                {(() => {
                  const animal = rankedFoods.filter((food) => classifyProteinSource(food.category) === 'animal');
                  return animal.length === 0 ? (
                    <Text style={styles.emptyText}>None found.</Text>
                  ) : (
                    animal.map((food, index) => renderRow(food, index + 1))
                  );
                })()}
              </View>
              <Text style={[styles.rankGroupHeading, styles.rankSpaced, { color: tabColor }]}>Plant Protein</Text>
              <View style={styles.table}>
                {(() => {
                  const plant = rankedFoods.filter((food) => classifyProteinSource(food.category) === 'plant');
                  return plant.length === 0 ? (
                    <Text style={styles.emptyText}>None found.</Text>
                  ) : (
                    plant.map((food, index) => renderRow(food, index + 1))
                  );
                })()}
              </View>
            </>
          ) : (
            <View style={[styles.table, styles.rankSpaced]}>{rankedFoods.map((food, index) => renderRow(food, index + 1))}</View>
          )
        ) : !rankingFood ? null : (
          <>
            <View style={[styles.rankFoodSummaryRow, styles.rankSpaced]}>
              <View style={styles.rankTextWrap}>
                <Text style={styles.rankFoodSummaryText}>
                  {rankingFood.baseName} · {categoryLabel(rankingFood.category)}
                </Text>
                {/* 2026-08-14, direct request -- "a suggested serving size
                    of however much." A real, cited natural-unit weight
                    (getFoodUnitWeight, "1 medium banana") when this food is
                    one of the small, curated set that has one; a plain,
                    honest 100g fallback (this whole lens's own existing
                    reference basis already) otherwise -- never an invented,
                    uncited serving size. Every row's own %DV below is
                    computed for exactly this amount, stated once here
                    rather than repeated on every row. */}
                {foodServing ? <Text style={styles.rankFoodCategory}>Suggested serving: {foodServing.label}</Text> : null}
              </View>
              <TouchableOpacity style={styles.pill} onPress={onClearFood}>
                <Text style={styles.pillText}>Change food</Text>
              </TouchableOpacity>
            </View>
            {foodRankingsLoading ? (
              <Text style={[styles.emptyText, styles.rankSpaced]}>Loading…</Text>
            ) : foodRankings.length === 0 && prepGroup && classifyPrepStateGroup(rankingFood.prepMethod) !== prepGroup ? (
              // A real, worth-catching mismatch, not just a generic "nothing
              // found": this food's own prep state doesn't belong to the
              // currently active filter group at all, so it could never
              // show up in a comparison pool that filter builds -- an empty
              // result here means "wrong filter for this food," not "this
              // food has no measured nutrients," and deserves its own,
              // clearer message rather than reading as a possible bug.
              <Text style={[styles.emptyText, styles.rankSpaced]}>
                {rankingFood.baseName} is {PREP_STATE_GROUP_LABELS[classifyPrepStateGroup(rankingFood.prepMethod)].toLowerCase()},
                not {PREP_STATE_GROUP_LABELS[prepGroup].toLowerCase()} -- switch the Prep state filter below to see how it ranks.
              </Text>
            ) : foodRankings.length === 0 ? (
              <Text style={[styles.emptyText, styles.rankSpaced]}>
                No measured nutrients found for this food within {categoryLabel(rankingFood.category)}
                {prepGroup ? ` (${PREP_STATE_GROUP_LABELS[prepGroup]})` : ''}.
              </Text>
            ) : (
              <View style={[styles.table, styles.rankSpaced]}>{foodRankings.map((entry) => renderFoodRankingRow(entry))}</View>
            )}
          </>
        )}
      </ScrollView>

      {/* The fixed field zone -- the fields themselves are unchanged, per
          "place the selector the way it is now"; pinned just above the
          floating hub button/footer.
          2026-08-14, direct follow-up: "Place the Nutrient and the Prep
          state side by side to each other. Make the Nutrient only as wide
          as necessary, and then Prep state can be to the right of it."
          Both fields now sit in one real row rather than stacked, each
          sized to its own content (Nutrient's own minWidth removed
          entirely, falling back to PopoverSelect's own default 0 --
          "only as wide as necessary," literally). "Place the selection
          lists at the same level I identified previously" comes free as a
          direct consequence of this same row, not a separate mechanism:
          computePopoverPositionAbove positions each popover off its OWN
          field's real measured Y position, and with both fields sharing
          the same row (same Y), and both real option lists capped at the
          identical MAX_VISIBLE_ROWS (6 -- 39 nutrients and 7 prep-state
          options both exceed it), both popovers compute to the exact same
          real height and land at the exact same level regardless of which
          one is tapped. */}
      <View style={[styles.rankFieldZone, { paddingBottom: fieldBottomPadding }]}>
        <View style={styles.rankFieldRow}>
          {mode === 'byNutrient' ? (
            <View style={styles.rankFieldColumn}>
              <Text style={[styles.sectionLabel, { color: tabColor }]}>Nutrient</Text>
              {/* Not searchable, 2026-08-12, direct request ("the keyboard, which
                  isn't needed") -- 39 real tracked nutrients is a short, plain
                  scrollable list, not the "could be longer" case search mode was
                  built for (see PopoverSelect's own header comment). Removing it
                  also means this field never touches AppKeyboard's search row at
                  all, closing off the whole code path most directly implicated in
                  the freeze this same day (see that file's own fix comment).
                  openAbove, 2026-08-14, direct request ("move the location of the
                  selection list up to a little above the header word Nutrient")
                  -- with this field pinned right above the footer, the default
                  side-anchored opening put the list roughly level with the field
                  itself, uncomfortably close to the bottom edge; opening above
                  puts it over the real open space the results area occupies. */}
              <PopoverSelect
                options={nutrientOptions}
                selected={selected}
                onSelect={onSelect}
                tabColor={tabColor}
                placeholder="Pick a nutrient..."
                openAbove
                onOpenChange={handleNutrientPopoverOpenChange}
                debugLabel="NutrientField"
              />
            </View>
          ) : null}
          {/* Shared by both modes, 2026-08-14 -- see this component's own
              header comment for why this is one control, not auto-applied
              per picked food. A real, second recurrence of the exact
              render-storm freeze this app already root-caused once was
              found and fixed here the same day -- see handlePrepGroupSelect's
              own comment above: this field's own onSelect used to be a
              fresh inline arrow function on every render, breaking
              PopoverSelect's memo() bailout the identical way an
              unmemoized options array already had before. */}
          <View style={styles.rankFieldColumn}>
            <Text style={[styles.sectionLabel, { color: tabColor }]}>Prep state</Text>
            <PopoverSelect
              options={prepGroupOptions}
              selected={prepGroup ?? 'all'}
              onSelect={handlePrepGroupSelect}
              tabColor={tabColor}
              placeholder="All prep states"
              minWidth={140}
              openAbove
              onOpenChange={handlePrepStatePopoverOpenChange}
              debugLabel="PrepStateField"
            />
          </View>
        </View>
        {mode === 'byNutrient' ? (
          /* 2026-08-14, direct request -- moved down here from the results
             zone above (where it used to be the "nothing picked yet"
             placeholder), so it sits right under the fields it's actually
             describing. Reworded "below" -> "above" to match, since the
             fields are now above this text, not below it -- the same
             direction-correction already made once before when this field
             itself moved down to this fixed bottom zone, and the same
             wording Cooking Impact's own analogous caption already uses. */
          <Text style={[styles.emptyText, styles.rankSpaced]}>
            Pick a nutrient above to see foods ranked by how much of it they contain, per 100g.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// Cooking Impact lens, 2026-08-10 -- a real, cited reference for "how much
// of this nutrient/compound survives this cooking method," independent of
// today's log and independent of any one already-logged ingredient's own
// tracked prep_method. See lib/cookingImpactData.ts's own header comment
// for why this is a curated per-compound table rather than one formula,
// and for exactly which claims are real, directly-measured citations vs.
// reasoned mechanism-based estimates. Pure, static, local data -- no async
// fetch, so (unlike NutrientRankingView above) this owns its own picker
// state rather than needing anything lifted to the parent screen.
function CookingImpactView({ tabColor }: { tabColor: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // See NutrientRankingView's own identical comment -- COOKING_IMPACT_COMPOUNDS
  // is a module-level constant that never changes, so this only ever needs
  // to build once, not on every render of this view.
  const compoundOptions = useMemo(
    () => COOKING_IMPACT_COMPOUNDS.map((c) => ({ label: c.label, value: c.id })),
    [],
  );
  const selectedCompound = COOKING_IMPACT_COMPOUNDS.find((c) => c.id === selectedId) ?? null;

  function confidenceLabel(confidence: CookingImpactConfidence): string {
    if (confidence === 'measured') return 'Directly measured';
    if (confidence === 'reasoned') return 'Reasoned estimate';
    return 'Baseline';
  }

  function confidenceColor(confidence: CookingImpactConfidence): string {
    return confidence === 'measured' ? tabColor : colors.textMuted;
  }

  return (
    <>
      <Text style={[styles.sectionLabel, { color: tabColor }]}>Nutrient / Compound</Text>
      <PopoverSelect
        options={compoundOptions}
        selected={selectedId}
        onSelect={setSelectedId}
        tabColor={tabColor}
        searchable
        placeholder="Pick a nutrient or compound..."
        minWidth={220}
      />
      {!selectedCompound ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>
          Pick a nutrient or compound above to see how much of it common cooking methods leave behind.
        </Text>
      ) : (
        <>
          <View style={[styles.noticeCard, styles.rankSpaced]}>
            <Text style={styles.noticeText}>{selectedCompound.mechanism}</Text>
          </View>
          <View style={styles.table}>
            {COOKING_IMPACT_METHODS.map((method) => {
              const entry = selectedCompound.byMethod.find((e) => e.methodId === method.id);
              if (!entry) return null;
              return (
                <View key={method.id} style={styles.cookingMethodRow}>
                  <View style={styles.cookingMethodHeader}>
                    <Text style={styles.cookingMethodLabel}>{method.label}</Text>
                    <Text style={[styles.cookingConfidenceBadge, { color: confidenceColor(entry.confidence) }]}>
                      {confidenceLabel(entry.confidence)}
                    </Text>
                  </View>
                  <Text style={styles.cookingMethodSummary}>{entry.summary}</Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.cookingCitation, styles.rankSpaced]}>{selectedCompound.citation}</Text>
        </>
      )}
    </>
  );
}

// Safe Foods lens, 2026-08-08 -- "foods listed in this section have zero
// relevance to the 6-DFF and will not cause a problem for them if they eat
// it." A category picker (only categories that actually have at least one
// qualifying food, per listSafeFoodCategories) plus the real, deduped list
// within it -- see listSafeFoods' own comment in lib/db.ts for exactly
// what "safe" means here.
function SafeFoodsView({
  categories,
  selected,
  onSelect,
  foods,
  loading,
  tabColor,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (category: string) => void;
  foods: SafeFood[];
  loading: boolean;
  tabColor: string;
}) {
  // See NutrientRankingView's own identical comment.
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: categoryLabel(category), value: category })),
    [categories],
  );

  return (
    <>
      <Text style={[styles.sectionLabel, { color: tabColor }]}>Category</Text>
      <PopoverSelect
        options={categoryOptions}
        selected={selected}
        onSelect={onSelect}
        tabColor={tabColor}
        searchable
        placeholder="Pick a category..."
        minWidth={220}
      />
      {!selected ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>
          Pick a category above to see which of its foods have zero flagged 6 Dimensions concerns.
        </Text>
      ) : loading ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>Loading…</Text>
      ) : foods.length === 0 ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>No fully unflagged foods found in this category.</Text>
      ) : (
        <View style={[styles.table, styles.rankSpaced]}>
          {foods.map((food) => (
            <View key={`${food.category}|${food.foodId}|${food.source}`} style={styles.rankRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={tabColor} style={textShadow} />
              <View style={styles.rankTextWrap}>
                <Text style={styles.rankFoodName}>
                  {food.baseName}
                </Text>
                {food.subcategory ? (
                  <Text style={styles.rankFoodCategory}>
                    {food.subcategory}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

// Healing Stage Food Finder lens, 2026-08-08 -- "a lens that identifies
// foods based on the Healing Stages." Stage 1 shows its own grouped "eat"
// list directly; Stage 2 shows its own real reintroduction rounds, each
// collapsible so a long combined list doesn't dump every round's worth of
// foods on screen at once -- see listStage1Foods/listStage2ReintroductionRounds'
// own comments in lib/db.ts for exactly how each group/round is built.
function HealingStageView({
  tab,
  onTabChange,
  stage1Groups,
  stage2Rounds,
  loading,
  tabColor,
}: {
  tab: 'stage1' | 'stage2';
  onTabChange: (tab: 'stage1' | 'stage2') => void;
  stage1Groups: StageFoodGroupResult[];
  stage2Rounds: StageFoodGroupResult[];
  loading: boolean;
  tabColor: string;
}) {
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const groups = tab === 'stage1' ? stage1Groups : stage2Rounds;

  function renderFoodRow(food: StageFood) {
    return (
      <View key={`${food.foodId}|${food.source}`} style={styles.rankRow}>
        <View style={styles.rankTextWrap}>
          <Text style={styles.rankFoodName}>
            {food.baseName}
          </Text>
          {food.subcategory ? (
            <Text style={styles.rankFoodCategory}>
              {food.subcategory}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.pillWrap}>
        <TouchableOpacity
          style={[styles.stagePill, tab === 'stage1' ? { backgroundColor: tabColor, borderColor: tabColor } : { borderColor: tabColor }]}
          onPress={() => onTabChange('stage1')}
        >
          <Text style={[styles.stagePillText, tab === 'stage1' ? styles.stagePillTextActive : { color: tabColor }]}>
            Stage 1: Getting Started
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stagePill, tab === 'stage2' ? { backgroundColor: tabColor, borderColor: tabColor } : { borderColor: tabColor }]}
          onPress={() => onTabChange('stage2')}
        >
          <Text style={[styles.stagePillText, tab === 'stage2' ? styles.stagePillTextActive : { color: tabColor }]}>
            Stage 2: Rebuilding
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>Loading…</Text>
      ) : tab === 'stage1' ? (
        // Stage 1's own groups always show in full -- a deliberately short
        // list by design (see this lens's own help text), so there's
        // nothing to collapse.
        groups.map((group) => (
          <View key={group.label} style={styles.rankSpaced}>
            <Text style={[styles.rankGroupHeading, { color: tabColor }]}>{group.label}</Text>
            {group.foods.length === 0 ? (
              <Text style={styles.emptyText}>None found.</Text>
            ) : (
              <View style={styles.table}>{group.foods.map(renderFoodRow)}</View>
            )}
          </View>
        ))
      ) : (
        // Stage 2's own rounds each collapse to just their heading until
        // tapped -- one open at a time, the same accordion shape SixDsView
        // above already uses, so browsing four real rounds' worth of foods
        // doesn't mean scrolling past all of them at once.
        groups.map((round) => {
          const expanded = expandedRound === round.label;
          return (
            <TouchableOpacity
              key={round.label}
              style={[styles.formCard, styles.rankSpaced, { borderColor: tabColor }]}
              onPress={() => setExpandedRound((current) => (current === round.label ? null : round.label))}
              activeOpacity={0.7}
            >
              <View style={styles.roundHeaderRow}>
                <Text style={[styles.rankGroupHeading, { color: tabColor }]}>{round.label}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={tabColor} />
              </View>
              {expanded ? (
                round.foods.length === 0 ? (
                  <Text style={[styles.emptyText, styles.rankSpaced]}>None found.</Text>
                ) : (
                  <View style={[styles.table, styles.rankSpaced]}>{round.foods.map(renderFoodRow)}</View>
                )
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </>
  );
}

// Labs lens, 2026-08-08 -- "Most recent results plus when the next retest
// is actually due" (Lens Coverage Audit), scoped down to "most recent
// results plus how long ago" -- see this lens's own help text for why a
// real due-date calculation isn't attempted (no real standard interval to
// build one from). lab_results/lab_tests are both real, already-built
// infrastructure (recordLabResult/listLabResults/getLabTests) that simply
// had zero UI anywhere in the app before this.
const LAB_DATE_YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));
const LAB_DATE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const LAB_DATE_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function daysAgoLabel(dateString: string): string {
  const then = new Date(`${dateString.slice(0, 10)}T00:00:00`);
  const now = new Date();
  const days = Math.max(0, Math.round((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function LabsView({
  labTests,
  labResults,
  loading,
  onSaved,
  tabColor,
}: {
  labTests: LabTest[];
  labResults: LabResultRecord[];
  loading: boolean;
  onSaved: () => void;
  tabColor: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [formTestCode, setFormTestCode] = useState<string | null>(null);
  const [formValue, setFormValue] = useState('');
  const [formLabName, setFormLabName] = useState('');
  const now = new Date();
  const [formYear, setFormYear] = useState(String(now.getFullYear()));
  const [formMonth, setFormMonth] = useState(String(now.getMonth() + 1));
  const [formDay, setFormDay] = useState(String(now.getDate()));
  const [saving, setSaving] = useState(false);

  const testByCode = new Map(labTests.map((test) => [test.code, test]));
  // See NutrientRankingView's own identical comment.
  const testOptions = useMemo(
    () => labTests.map((test) => ({ label: test.displayName, value: test.code })),
    [labTests],
  );

  // Most recent result per test -- listLabResults already returns
  // most-recent-first, so the first row seen per testCode is the one to
  // keep.
  const mostRecentByTest = new Map<string, LabResultRecord>();
  for (const result of labResults) {
    if (!mostRecentByTest.has(result.testCode)) mostRecentByTest.set(result.testCode, result);
  }
  const recentResults = Array.from(mostRecentByTest.values()).sort((a, b) => b.testedAt.localeCompare(a.testedAt));

  function resetForm() {
    setFormTestCode(null);
    setFormValue('');
    setFormLabName('');
    setFormYear(String(now.getFullYear()));
    setFormMonth(String(now.getMonth() + 1));
    setFormDay(String(now.getDate()));
  }

  async function handleSave() {
    if (!formTestCode) {
      Alert.alert('Pick a test first.');
      return;
    }
    const value = Number(formValue);
    if (!Number.isFinite(value)) {
      Alert.alert('Enter a valid number for the result.');
      return;
    }
    const year = Number(formYear);
    const month = Number(formMonth);
    const day = Number(formDay);
    const pad = (n: number) => String(n).padStart(2, '0');
    const testedAt = `${year}-${pad(month)}-${pad(day)}`;
    const test = testByCode.get(formTestCode);
    setSaving(true);
    try {
      await recordLabResult({
        testCode: formTestCode,
        value,
        unit: test?.rangeUnit ?? '',
        testedAt,
        labName: formLabName.trim() || undefined,
      });
    } catch (error) {
      setSaving(false);
      Alert.alert('Could not save', error instanceof Error ? error.message : String(error));
      return;
    }
    setSaving(false);
    setFormOpen(false);
    resetForm();
    onSaved();
  }

  return (
    <>
      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : recentResults.length === 0 ? (
        <Text style={styles.emptyText}>Nothing logged yet. Tap below to log your first result.</Text>
      ) : (
        <View style={styles.table}>
          {recentResults.map((result) => {
            const test = testByCode.get(result.testCode);
            const low = result.labRangeLow ?? test?.typicalRangeLow ?? null;
            const high = result.labRangeHigh ?? test?.typicalRangeHigh ?? null;
            const outsideRange = low != null && high != null && (result.value < low || result.value > high);
            return (
              <View key={result.testCode} style={styles.rankRow}>
                <View style={styles.rankTextWrap}>
                  <Text style={styles.rankFoodName}>
                    {test?.displayName ?? result.testCode}
                  </Text>
                  <Text style={styles.rankFoodCategory}>
                    {daysAgoLabel(result.testedAt)}
                    {outsideRange ? ' · outside typical range' : ''}
                  </Text>
                </View>
                <Text style={styles.rankAmount}>
                  {result.value} {result.unit}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {formOpen ? (
        <View style={[styles.formCard, styles.rankSpaced, { borderColor: tabColor }]}>
          <Text style={[styles.sectionLabel, { color: tabColor }]}>Test</Text>
          <PopoverSelect
            options={testOptions}
            selected={formTestCode}
            onSelect={setFormTestCode}
            tabColor={tabColor}
            searchable
            placeholder="Pick a test..."
            minWidth={220}
          />
          <Text style={[styles.sectionLabel, styles.rankSpaced, { color: tabColor }]}>
            Result{testByCode.get(formTestCode ?? '')?.rangeUnit ? ` (${testByCode.get(formTestCode ?? '')?.rangeUnit})` : ''}
          </Text>
          <AppTextInput
            style={styles.labInput}
            value={formValue}
            onChangeText={setFormValue}
            placeholder="e.g. 2.4"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.sectionLabel, styles.rankSpaced, { color: tabColor }]}>Date Drawn</Text>
          <View style={styles.labDateRow}>
            <PopoverSelect options={LAB_DATE_YEAR_OPTIONS} selected={formYear} onSelect={setFormYear} tabColor={tabColor} minWidth={72} />
            <PopoverSelect options={LAB_DATE_MONTH_OPTIONS} selected={formMonth} onSelect={setFormMonth} tabColor={tabColor} minWidth={52} />
            <PopoverSelect options={LAB_DATE_DAY_OPTIONS} selected={formDay} onSelect={setFormDay} tabColor={tabColor} minWidth={52} />
          </View>
          <Text style={[styles.sectionLabel, styles.rankSpaced, { color: tabColor }]}>Lab Name (optional)</Text>
          <AppTextInput
            style={styles.labInput}
            value={formLabName}
            onChangeText={setFormLabName}
            placeholder="e.g. Quest Diagnostics"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={() => {
                setFormOpen(false);
                resetForm();
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tabColor, flex: 1, opacity: saving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save Result'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.secondaryButton, styles.rankSpaced, { borderWidth: 1, borderColor: tabColor }]}
          onPress={() => setFormOpen(true)}
        >
          <Text style={[styles.secondaryButtonText, { color: tabColor }]}>+ Log a Result</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// My Meds & Interactions lens, 2026-08-08 -- "today's active regimen plus
// everything currently flagged... an already-built engine, and the My
// Meds registry itself, far more visible day to day" (Lens Coverage
// Audit). Deliberately read-only -- adding/editing a treatment stays on
// Schedule's own My Meds lens, the same "one real place owns writing this
// data" boundary Hydration already keeps with Meals.
function MyMedsView({
  treatments,
  warnings,
  referenceOnly,
  loading,
  tabColor,
}: {
  treatments: TreatmentRecord[];
  warnings: InteractionWarning[];
  referenceOnly: ReferenceOnlyRule[];
  loading: boolean;
  tabColor: string;
}) {
  if (loading) {
    return <Text style={styles.emptyText}>Loading…</Text>;
  }

  function renderGroup(label: string, type: string) {
    const items = treatments.filter((treatment) => treatment.treatmentType === type);
    if (items.length === 0) return null;
    return (
      <View style={styles.rankSpaced}>
        <Text style={[styles.rankGroupHeading, { color: tabColor }]}>{label}</Text>
        <View style={styles.table}>
          {items.map((treatment) => (
            <View key={treatment.id} style={styles.rankRow}>
              <View style={styles.rankTextWrap}>
                <Text style={styles.rankFoodName}>
                  {treatment.name}
                </Text>
                {treatment.doseAmount != null ? (
                  <Text style={styles.rankFoodCategory}>
                    {treatment.doseAmount} {treatment.doseUnit}
                    {treatment.frequency ? ` · ${treatment.frequency}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      {warnings.length > 0 ? (
        <View style={styles.rankSpaced}>
          <Text style={[styles.rankGroupHeading, { color: tabColor }]}>Things to check</Text>
          {warnings.map((warning, index) => (
            <View key={`${warning.ruleId}_${index}`} style={[styles.formCard, styles.rankSpaced, { borderColor: tabColor }]}>
              <Text style={[styles.rankFoodName, { color: tabColor }]}>{warning.title}</Text>
              <Text style={styles.myMedsMessage}>{warning.message}</Text>
              <Text style={styles.myMedsCitation}>{warning.citation}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {referenceOnly.length > 0 ? (
        <View style={styles.rankSpaced}>
          <Text style={[styles.rankGroupHeading, { color: tabColor }]}>Worth knowing (reference only)</Text>
          {referenceOnly.map((rule) => (
            <View key={rule.ruleId} style={[styles.formCard, styles.rankSpaced, { borderColor: colors.border }]}>
              <Text style={styles.rankFoodName}>{rule.title}</Text>
              <Text style={styles.myMedsMessage}>{rule.guidance}</Text>
              <Text style={styles.myMedsCitation}>{rule.citation}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {treatments.length === 0 ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>
          Nothing tracked yet. Add a prescription, OTC drug, or supplement on Schedule&apos;s own My Meds lens.
        </Text>
      ) : (
        <>
          {renderGroup('Prescriptions', 'prescription')}
          {renderGroup('OTC', 'otc')}
          {renderGroup('Supplements', 'supplement')}
        </>
      )}
    </>
  );
}

const ADVISORY_META: Record<TriggeredAdvisory['kind'], { title: string; message: string; icon: keyof typeof Ionicons.glyphMap }> = {
  alcohol: { title: ALCOHOL_ADVISORY_TITLE, message: ALCOHOL_ADVISORY_MESSAGE, icon: 'wine-outline' },
  coffee: { title: COFFEE_ADVISORY_TITLE, message: COFFEE_ADVISORY_MESSAGE, icon: 'cafe-outline' },
  juice: { title: JUICE_ADVISORY_TITLE, message: JUICE_ADVISORY_MESSAGE, icon: 'nutrition-outline' },
};

// Today's Advisories lens, 2026-08-08 -- see getTodaysAdvisories' own
// comment in lib/db.ts for exactly what's checked and why the scope stops
// at these 3. Grouped by kind, since the same advisory can trigger more
// than once in a day (coffee at breakfast AND after lunch, say) -- one
// real card per kind, listing every food/meal that triggered it.
function AdvisoriesView({ advisories, loading, tabColor }: { advisories: TriggeredAdvisory[]; loading: boolean; tabColor: string }) {
  if (loading) {
    return <Text style={styles.emptyText}>Loading…</Text>;
  }
  if (advisories.length === 0) {
    return (
      <Text style={styles.emptyText}>
        Nothing triggered today: no alcohol, coffee, or plain fruit juice logged so far.
      </Text>
    );
  }

  const byKind = new Map<TriggeredAdvisory['kind'], TriggeredAdvisory[]>();
  for (const advisory of advisories) {
    const existing = byKind.get(advisory.kind) ?? [];
    byKind.set(advisory.kind, [...existing, advisory]);
  }

  return (
    <>
      {Array.from(byKind.entries()).map(([kind, items]) => {
        const meta = ADVISORY_META[kind];
        return (
          <View key={kind} style={[styles.formCard, styles.rankSpaced, { borderColor: tabColor }]}>
            <View style={styles.advisoryHeaderRow}>
              <Ionicons name={meta.icon} size={18} color={tabColor} style={textShadow} />
              <Text style={[styles.rankFoodName, styles.advisoryTitle, { color: tabColor }]}>{meta.title}</Text>
            </View>
            <Text style={styles.myMedsMessage}>{meta.message}</Text>
            <Text style={[styles.rankGroupHeading, styles.rankSpaced]}>Today</Text>
            {items.map((item, index) => (
              <Text key={index} style={styles.myMedsMessage}>
                {item.foodName} · {item.mealName}
              </Text>
            ))}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 10,
  },
  noticeCard: {
    backgroundColor: colors.noticeBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: {
    ...typography.caption,
    color: colors.noticeText,
    lineHeight: 17,
  },
  // Same structural-label language as the table headers below (eyebrow) --
  // both are "this is scaffolding, not content" text, so they should look
  // like the same tier of thing. Color is TAB_COLOR, not colors.primary,
  // matching CardLabel's own eyebrow-tier label on Home -- 2026-07-27.
  sectionLabel: {
    ...typography.eyebrow,
    color: TAB_COLOR,
    marginBottom: 8,
  },
  // Food Lookup's own layout -- no section labels between steps (each
  // field's own placeholder/summary text already says what it's for).
  // Always a plain View, never a ScrollView -- each step's own list and,
  // once resolved, the results table's own SectionList each handle their
  // own scrolling already (see FoodLookupView's own closing comment).
  // paddingTop: 5 puts the first thing on screen (Category) the requested
  // 5px below the header.
  foodLookupActiveListContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 5 },
  // A real table -- rows have consistent columns, so several numbers/
  // statuses per line can be scanned down a column instead of read one
  // sentence at a time.
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule --
  // the same "this box's border says which tab it belongs to" treatment,
  // just a single fixed color here since every box on this page is
  // Insights' own.
  table: {
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  tableRowGreen: {
    backgroundColor: colors.primaryTint,
  },
  tableRowYellow: {
    backgroundColor: colors.statusYellowBg,
  },
  tableRowRed: {
    backgroundColor: colors.statusRedBg,
  },
  tableHeaderRow: {
    borderTopWidth: 0,
    backgroundColor: colors.background,
  },
  // Colors below are TAB_COLOR, not the plain neutrals they used to be --
  // 2026-07-27, "every font inside a box should match that box's own
  // border color." Deliberately NOT applied to statusGreenText/Yellow/Red/
  // Neutral just below, or to anything already wrapped in
  // severityTextStyle(...) -- that's real green/yellow/red judgment
  // signal, a different (and more important) meaning than "which tab,"
  // and overriding it would erase the thing this table exists to show.
  tableCell: {
    ...typography.caption,
    color: TAB_COLOR,
  },
  tableHeaderCell: {
    ...typography.eyebrow,
    color: TAB_COLOR,
  },
  tableCellNutrient: {
    flex: 2,
  },
  tableCellAmount: {
    flex: 2,
  },
  tableCellStatus: {
    flex: 2,
    textAlign: 'right',
    fontWeight: '600',
  },
  // Bumped up to `label` size -- the dimension name is the primary thing
  // being scanned in this row, so it should read a size larger than the
  // supporting "N flagged" status text next to it, not the same size.
  tableCellDimension: {
    ...typography.label,
    flex: 3,
    color: TAB_COLOR,
  },
  // A real green/yellow/red traffic light -- green is a deliberate,
  // visible color here (not just "recede to neutral"), so all three
  // states are equally legible at a glance. See severityTextStyle/
  // severityRowStyle above.
  statusGreenText: {
    color: colors.primary,
    fontWeight: '600',
  },
  statusYellowText: {
    color: colors.statusYellow,
    fontWeight: '600',
  },
  statusRedText: {
    color: colors.danger,
    fontWeight: '600',
  },
  // Sub-day scopes show "% of today's target" as plain information, not a
  // judgment -- no flagged/good coloring, since a single food isn't
  // "deficient" for not being the whole day's supply of a nutrient. Also
  // used for tierSeverity's 'unknown' ("Not Assessed") -- deliberately the
  // same neutral gray as "no judgment," not a 4th traffic-light color.
  statusNeutralText: {
    color: colors.textSecondary,
  },
  subTable: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  subTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subTableLabel: {
    ...typography.caption,
    color: TAB_COLOR,
    flex: 1,
    marginRight: 8,
  },
  subTableValue: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  subTableValueActive: {
    color: colors.primary,
  },
  detailBlock: {
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 8,
  },
  detailFoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailFoodName: {
    ...typography.caption,
    color: TAB_COLOR,
  },
  // Base color here never actually shows -- always rendered with
  // severityTextStyle(...) layered on top (see PrepView/SixDsView's own
  // render) -- left as a plain neutral rather than TAB_COLOR so it's not
  // misleadingly implied to matter.
  detailFoodTier: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,
  },
  detailText: {
    ...typography.caption,
    color: TAB_COLOR,
    lineHeight: 17,
    marginTop: 4,
  },
  detailSourcesLabel: {
    ...typography.eyebrow,
    color: TAB_COLOR,
    marginTop: 6,
  },
  detailSourcesText: {
    ...typography.caption,
    color: TAB_COLOR,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  scopeButton: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  // Same treatment as LensHub's own popup card, 2026-07-27: menuSurface
  // background (matching the butterfly menu's own), thicker border in
  // TAB_COLOR (set inline above) instead of the flat neutral -- this is
  // just as much "a menu accessed from this page" as LensHub itself.
  scopeCard: {
    position: 'absolute',
    maxWidth: 300,
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardHeader: {
    ...typography.eyebrow,
    color: colors.primary,
  },
  scopeCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scopeCloseText: {
    ...typography.bodyEmphasis,
    color: colors.textMuted,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbSep: {
    ...typography.captionEmphasis,
    fontWeight: '400',
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  breadcrumbText: {
    ...typography.captionEmphasis,
    color: colors.primary,
  },
  breadcrumbTextActive: {
    color: colors.textPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: 220,
  },
  pillText: {
    ...typography.captionEmphasis,
    color: colors.primary,
  },
  tipCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
  },
  tipCardTitle: {
    ...typography.label,
    color: TAB_COLOR,
  },
  tipEntry: {
    marginTop: 6,
  },
  tipText: {
    ...typography.body,
    color: TAB_COLOR,
    lineHeight: 18,
  },
  // Nutrient Ranking lens, 2026-08-08.
  // 2026-08-14 -- the real two-zone layout described in NutrientRankingView's
  // own header comment: a scrollable results area filling whatever space
  // is left, and a fixed, non-scrolling field zone pinned at the bottom
  // (its own paddingBottom is set inline, via useFloatingButtonScrollPadding,
  // since it's insets-dependent -- see fieldBottomPadding above).
  rankLayout: { flex: 1 },
  rankResultsScroll: { flex: 1 },
  // A little top breathing room (the outer foodLookupActiveListContainer's
  // own paddingTop:5 is barely there) and enough bottom room that the last
  // real result row doesn't sit flush against the field zone below it.
  rankResultsContent: { paddingTop: 6, paddingBottom: 16 },
  rankFieldZone: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  rankSpaced: { marginTop: 14 },
  rankGroupHeading: { ...typography.eyebrow, marginBottom: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  rankNumber: {
    ...typography.captionEmphasis,
    color: TAB_COLOR,
    width: 22,
    textAlign: 'right',
  },
  rankTextWrap: { flex: 1 },
  // 2026-08-11: both of these used to carry numberOfLines={1}, silently
  // truncating a long food name or a long category/subcategory/prep-state/
  // source line with an ellipsis rather than wrapping -- a real, direct
  // report, since the prep-state label (Raw vs. Dried, etc.) that
  // rankFoodCategory renders is exactly the thing that got cut off first
  // on a long line, undermining the whole point of showing it at all.
  // rankRow itself has no fixed height anywhere in this chain (plain
  // flexbox, no FlatList/virtualization in any of this file's real
  // rank-list usages -- confirmed directly, not assumed), so removing the
  // line cap is the whole fix: the row already grows to fit real,
  // multi-line content on its own.
  rankFoodName: { ...typography.bodyEmphasis, color: colors.textPrimary },
  rankFoodCategory: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  rankAmount: { ...typography.captionEmphasis, color: TAB_COLOR },
  // Nutrient Ranking's own "By Food" mode, 2026-08-14 -- the amount and,
  // when a real DRI exists for that nutrient, a %DV line right under it,
  // both right-aligned as one column rather than two separately-placed
  // Texts.
  rankAmountWrap: { alignItems: 'flex-end' },
  rankDriPercent: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  // Nutrient/Prep state side by side, 2026-08-14 -- see this lens' own
  // fixed-field-zone comment above for the full reasoning. flexShrink on
  // the column is a real, defensive guard against either field's own
  // content overflowing the row's width on a narrow screen, not just
  // decoration.
  rankFieldRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rankFieldColumn: { flexShrink: 1 },
  // Nutrient Ranking's own "By Food" mode, 2026-08-14 -- the picked food's
  // own name/category, plus the "Change food" action, sitting above its
  // real per-nutrient ranking list.
  rankFoodSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rankFoodSummaryText: { ...typography.bodyEmphasis, color: colors.textPrimary, flexShrink: 1 },
  // Cooking Impact lens, 2026-08-10.
  cookingMethodRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cookingMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  cookingMethodLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, flexShrink: 1 },
  cookingConfidenceBadge: { ...typography.caption, fontSize: 11 },
  cookingMethodSummary: { ...typography.caption, color: colors.textSecondary, lineHeight: 16 },
  cookingCitation: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  // Healing Stage lens, 2026-08-08.
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stagePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stagePillText: { ...typography.captionEmphasis },
  stagePillTextActive: { color: colors.textOnPrimary },
  // Same colors.surface/2px-tabColor-border treatment every other card on
  // this page already uses (see table's own comment above) -- a round is
  // a tappable card (the whole thing opens/closes on tap), not a plain row.
  formCard: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 12,
  },
  roundHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Hydration lens, 2026-08-08.
  hydrationWrap: { alignItems: 'center', paddingTop: 12 },
  hydrationStatus: { ...typography.bodyEmphasis, marginTop: 12 },
  hydrationNote: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,
  },
  // Labs lens, 2026-08-08 -- this page's first real form, so these four
  // (button row/primary/secondary button) are new here even though the
  // exact same shape already exists in most other tabs' own files.
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis },
  labInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  labDateRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  // My Meds & Interactions lens, 2026-08-08.
  myMedsMessage: { ...typography.body, color: colors.textPrimary, marginTop: 6 },
  myMedsCitation: { ...typography.caption, color: colors.textMuted, marginTop: 6 },
  // Today's Advisories lens, 2026-08-08.
  advisoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  advisoryTitle: { flex: 1 },
});
