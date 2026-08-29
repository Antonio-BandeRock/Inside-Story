import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  classifyPrepStateGroup,
  classifyProteinSource,
  createPersonalRule,
  deletePersonalRule,
  getConditionStages,
  getDailyNutrientBreakdown,
  getDailySixDimensionsBreakdown,
  getDietaryReferenceIntakesForCurrentUser,
  getFoodRankingsAcrossNutrients,
  getFoodUnitWeight,
  getLabTests,
  getTodaysAdvisories,
  getUserProfile,
  listAllActiveTreatments,
  listBodyMeasurements,
  listLabResults,
  listPersonalRules,
  listSafeFoodCategories,
  listSafeFoods,
  listStage1Foods,
  listStage2ReintroductionRounds,
  listTrackedNutrients,
  PREP_STATE_GROUP_LABELS,
  PREP_STATE_GROUP_ORDER,
  rankFoodsByNutrient,
  recordLabResult,
  setPersonalRuleActive,
  type DailyDimensionItemBreakdown,
  type DailyNutrientBreakdown,
  type DailyNutrientScopeTotals,
  type DailySixDimensionsBreakdown,
  type DietaryReferenceIntake,
  type FoodNutrientRanking,
  type LabResultRecord,
  type LabTest,
  type PersonalRule,
  type PrepStateGroup,
  type RankedFood,
  type SafeFood,
  type StageFood,
  type StageFoodGroupResult,
  type TrackedNutrient,
  type TreatmentRecord,
  type TriggeredAdvisory,
  type UserProfile,
} from '../../lib/db';
import { ALCOHOL_ADVISORY_MESSAGE, ALCOHOL_ADVISORY_TITLE } from '../../lib/alcoholAdvisory';
import {
  COOKING_IMPACT_COMPOUNDS,
  COOKING_IMPACT_METHODS,
  type CookingImpactConfidence,
} from '../../lib/cookingImpactData';
import { COFFEE_ADVISORY_MESSAGE, COFFEE_ADVISORY_TITLE } from '../../lib/coffeeAdvisory';
import {
  calculateBmr,
  calculateMacroTargets,
  calculateProduceTargets,
  calculateTdee,
  perMealShare,
  type MacroTargets,
} from '../../lib/energyNeeds';
import {
  foodMatchesAllergy,
  foodMatchesDietPreferences,
  getPersonalizationProfile,
  type PersonalizationProfile,
} from '../../lib/foodPersonalization';
import { evaluateInteractionRules, type InteractionWarning, type ReferenceOnlyRule } from '../../lib/interactionRules';
import { JUICE_ADVISORY_MESSAGE, JUICE_ADVISORY_TITLE } from '../../lib/juiceAdvisory';
import { lbToKg } from '../../lib/measurement';
import {
  analyzeNutrientIntake,
  formatAmount,
  nutrientStatusSeverity,
  percentOfDailyTarget,
  type StatusSeverity,
} from '../../lib/nutrientAnalysis';
import { ageFromBirthDate } from '../../lib/profile';
import {
  NUTRIENT_STATUS_LABELS,
  flattenItemScores,
  getSubCriterionSources,
  getTierDefinition,
  selectPrepTips,
  tierSeverity,
  type TierSeverity,
} from '../../lib/sixDimensionsReference';
import { DimensionChart } from '../../components/DimensionChart';
import type { ConditionDimensionSummary } from '../../lib/conditionDimensions';
import { AppTextInput } from '../../components/AppTextInput';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { useConfirmSheet } from '../../components/ConfirmSheet';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { FoodLookup, categoryLabel, sourceLabel, type ResolvedFoodSelection } from '../../components/FoodLookup';
import { GatedTabContent } from '../../components/GatedTabContent';
import { linkifyText, useInfoAlert } from '../../components/InfoAlert';
import type { HelpSection } from '../../components/HelpButton';
import { IridescentRingCircle } from '../../components/IridescentRingCircle';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PopoverSelect } from '../../components/PopoverSelect';
import { ProgressRing } from '../../components/ProgressRing';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { WhyExplainer } from '../../components/WhyExplainer';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import {
  FLOATING_BUTTON_SIZE,
  SECONDARY_HUB_CARD_LEFT_MARGIN,
  SECONDARY_HUB_GAP,
  useBottomLeftHubPosition,
  useFloatingButtonScrollPadding,
  useMenuCardBottom,
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
// table (StatusSeverity) and the Condition Scores scorecard (TierSeverity) --
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
  | 'advisories'
  | 'portions';

// Shared across all three lenses' own Info content below -- the
// drill-down navigator (ScopeHub) is the one mechanic all three have in
// common, so it's worth repeating in each rather than only explaining it
// once somewhere a person might not be looking when they actually need it.
const DRILLING_DOWN_HELP: HelpSection = {
  heading: 'Drilling down',
  body: 'The third floating button, to the left of the view picker, opens the same navigator every lens shares: Whole Day -> a specific meal -> a side within it -> a single ingredient. Tap any crumb to jump straight back to that level, or tap one of the pills below it to go one level deeper.',
};

// 2026-08-18, real, direct request: "it is hard to know which lenses are
// for what. Can we group them somehow. I mean, insights is a pretty broad
// term." Grouped into 3 real sections rather than one flat 13-item grid:
// "Today" (this exact day's own logged data), "Explore & Look Up"
// (independent of today's log -- browse/search the reference database
// itself), and "Your Regimen & Targets" (what's tracked/scheduled and
// what your own numbers should be). Order below matches group order, not
// alphabetical or original build order, since LensHub renders a group
// header the first time a new `group` value appears in array order.
const LENSES: LensOption<Lens>[] = [
  {
    key: 'nutrients',
    label: 'Nutrients',
    icon: 'nutrition-outline',
    group: 'Today',
    help: [
      {
        heading: 'Reading the table',
        body: 'Each row compares one nutrient to your daily target. At "Whole Day" scope, rows are judged and colored: a flagged (colored) row is short of target, over a safe upper limit, or otherwise worth a look; an unflagged row is quietly fine and stays neutral on purpose, so color only ever draws your eye to what actually needs it. Tap any row to see exactly which foods (and, if any, supplements) actually produced that number, sorted biggest-contributor first.',
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
    label: 'Condition Scores',
    icon: 'analytics-outline',
    group: 'Today',
    help: [
      // 2026-08-26 -- rebuilt to be condition-scoped instead of one
      // generic scorecard: shows one section per condition set in
      // Profile, each using that condition's own real set of scoring
      // factors, not a shared, one-size-fits-all list. "Six Dimensions of
      // Food Friendliness" is its own condition's real, complete 6-factor
      // framework and appears only in that condition's own section; every
      // other condition's own section uses its own real factors instead.
      {
        heading: 'Condition Scores',
        body: 'One section per condition set in Profile, each scored against that condition\'s own real set of factors for whatever scope is selected. "Clear" means nothing in that scope was flagged for that factor; a number means that many sub-criteria were. Tap a factor to see its sub-criteria, then tap a sub-criterion to see which specific food(s) it was rated against, the tier each was rated, why it matters for that condition, and the citation behind the rating. Set which conditions to track in Profile; this screen shows whatever is set there.',
      },
      DRILLING_DOWN_HELP,
    ],
  },
  {
    key: 'prep',
    label: 'Cooking & Prep',
    icon: 'flame-outline',
    group: 'Today',
    help: [
      {
        heading: 'Cooking & Prep',
        body: 'Surfaces ingredients in today\'s meals that measurably change outcome based on how they are prepared (e.g. cooking cruciferous vegetables rather than eating them raw, or soaking legumes before cooking), each with the citation it is based on. At the whole-day/meal level, only items that actually need attention are shown; drilled into one side or ingredient, everything shows, including a plain "nothing specific" answer.',
      },
      DRILLING_DOWN_HELP,
    ],
  },
  {
    key: 'hydration',
    label: 'Hydration',
    icon: 'water-outline',
    group: 'Today',
    help: [
      {
        heading: 'Hydration',
        body: "Today's total water intake against your own target: a true sum across everything logged today, food and drink alike (water-rich foods like soup or watermelon count too, not just what you drank). Same underlying nutrient data as the Nutrients table; this is just its own dedicated view.",
      },
    ],
  },
  {
    key: 'advisories',
    label: "Today's Advisories",
    icon: 'information-circle-outline',
    group: 'Today',
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
  {
    key: 'foodLookup',
    label: 'Food Lookup',
    icon: 'search-outline',
    group: 'Explore & Look Up',
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
    group: 'Explore & Look Up',
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
    group: 'Explore & Look Up',
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
    group: 'Explore & Look Up',
    help: [
      {
        heading: 'Safe Foods',
        body: "Foods with zero flagged concerns across every one of your tracked conditions at once (set in Profile), and free of a declared diet preference or food allergy conflict. Pick a category to browse what qualifies within it.",
      },
      {
        heading: 'What "safe" means here',
        body: '"Not Assessed" (no data either way) and a green rating both count as safe; only an actual yellow or red flag on a sub-criterion relevant to one of your tracked conditions disqualifies a food. This is the same tier logic the Condition Scores lens itself uses, just applied across the whole reference database instead of one day\'s meals.',
      },
    ],
  },
  {
    key: 'healingStage',
    label: 'Healing Stage',
    icon: 'leaf-outline',
    group: 'Explore & Look Up',
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
    key: 'labs',
    label: 'Labs',
    icon: 'flask-outline',
    group: 'Your Regimen & Targets',
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
    group: 'Your Regimen & Targets',
    help: [
      {
        heading: 'My Meds & Interactions',
        body: 'A read-only view of what Schedule\'s own My Meds lens already tracks (prescriptions, OTC, supplements) plus every interaction warning currently triggered: calcium/iron/zinc timing, the fat-soluble vitamins, levothyroxine + calcium/iron, and biotin against an upcoming lab draw.',
      },
      {
        heading: 'Your Own Rules',
        body: "Every warning above comes from cited research. This is different: a place for something you've noticed yourself, or a specific instruction your own doctor gave you, especially one that differs from the general guidance. Add one under \"Manage Your Rules\" below, and it shows up here, clearly labeled as yours, whenever it's currently relevant, either always, only while a specific medication or supplement is active, or only on a day something you've logged contains a food keyword you chose.",
      },
      {
        heading: 'Adding or editing',
        body: "Treatments themselves (prescriptions, OTC, supplements) aren't added or edited here; use Schedule's own My Meds lens for that. Your own rules are the one thing this lens does let you add, pause, resume, and delete directly, further down under \"Manage Your Rules.\"",
      },
    ],
  },
  {
    key: 'portions',
    label: 'Energy & Portions',
    icon: 'restaurant-outline',
    group: 'Your Regimen & Targets',
    help: [
      {
        heading: 'Where the numbers come from',
        body: 'Your maintenance calories come from the Mifflin-St Jeor equation (weight, height, age, sex) times an activity-level multiplier -- the same method most clinical dietetics practice uses. Protein scales with your real body weight and activity level (or a condition-specific override, e.g. CKD); the remaining calories split between fat and carbohydrate using the midpoint of NASEM\'s own Acceptable Macronutrient Distribution Range. See the Portions & Recommended Amounts topic in Digest for the full method and citations.',
      },
      {
        heading: 'What this is not',
        body: 'This is a maintenance estimate, not a prescribed target, a diagnosis, or a weight-loss plan. Set your sex, birth date, height, weight, and activity level in Profile to see it -- nothing here is guessed on your behalf.',
      },
    ],
  },
];

// Where you currently are in the day -> meal -> side -> item drill-down,
// shared by both the Condition Scores and Cooking & Prep lenses since both are views
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
// resolver (resolveScopePerCondition / resolveScopeNutrientTotals below)
// stays separately typed, since that's where the two genuinely differ --
// what data actually lives at a given scope.
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

// 2026-08-26 -- the condition-scoped replacement for the old
// resolveScopeScores (removed, see this file's own git history if the
// generic version is ever needed again): reads whatever the current scope
// contains, one summary per tracked condition, instead of one flat,
// condition-agnostic list.
function resolveScopePerCondition(breakdown: DailySixDimensionsBreakdown, scope: Scope): Record<string, ConditionDimensionSummary> {
  if (scope.level === 'day') return breakdown.dayPerCondition;
  if (scope.level === 'meal') return resolveScopeMeal(breakdown, scope)?.perCondition ?? {};
  if (scope.level === 'side') return resolveScopeSide(breakdown, scope)?.perCondition ?? {};
  const side = resolveScopeSide(breakdown, scope);
  return side?.items[scope.itemIndex]?.perCondition ?? {};
}

// Same idea as resolveScopePerCondition, but for raw nutrient totals
// instead of condition-scored dimensions -- what NutrientsTable reads to
// show a scope's own contribution toward today's targets.
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
    heading: 'What this page is for',
    body: "So you don't have to work out on your own whether today's meals actually met your nutrient needs or matched what's safe for your own tracked conditions. Insights does that math for you, from the exact meals you already logged, and tells you plainly what needs attention and what doesn't.",
  },
  {
    heading: 'Three lenses, one day of data',
    body: 'Nutrients, Condition Scores, and Cooking & Prep (tap the button to the left of the main navigation button, bottom of the screen) are three different views over the same set of meals you logged today. Switching views does not reload anything, it just changes how the same data is presented.',
  },
  {
    heading: 'Nutrients: reading the table',
    body: 'Each row compares one nutrient to your daily target. At "Whole Day" scope, rows are judged and colored: a flagged (colored) row is short of target, over a safe upper limit, or otherwise worth a look; an unflagged row is quietly fine and stays neutral on purpose, so color only ever draws your eye to what actually needs it. Tap any row to see exactly which foods (and, if any, supplements) actually produced that number, sorted biggest-contributor first.',
  },
  {
    heading: 'Nutrients: drilling into a meal or ingredient',
    body: 'Once you drill into a specific meal, side, or ingredient, the judgment coloring disappears: a single food is not "deficient" in a vitamin just for not being your whole day\'s supply of it. Instead each row shows what percent of today\'s target that one item contributed, sorted highest-contributor first.',
  },
  {
    heading: 'Condition Scores',
    body: 'One section per condition set in Profile, each scored against that condition\'s own real set of factors for whatever scope is selected. "Clear" means nothing in that scope was flagged for that factor; a number means that many sub-criteria were. Tap a factor to see its sub-criteria, then tap a sub-criterion to see which specific food(s) it was rated against, the tier each was rated, why it matters for that condition, and the citation behind the rating.',
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
  const { openInsightsLens } = useLocalSearchParams<{ openInsightsLens?: string }>();
  const [lens, setLens] = useState<Lens>('nutrients');
  // Whether this tab's own specific background/content is currently risen
  // (GatedTabContent.tsx) -- separate from `lens` itself, which keeps its
  // last-picked value indefinitely so LensHub can still show it highlighted
  // at rest. Reset to false on every focus change (both gaining and losing
  // focus) so arriving/re-arriving at Insights always shows the resting
  // "pick a function" prompt first, never an instant resume -- confirmed
  // product behavior, not an oversight.
  const [revealed, setRevealed] = useState(false);
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as
  // Food's own identical addition (app/(tabs)/food.tsx): lets LensHub's
  // new "My Insights" top-left tile (see its extraTile prop below) open
  // this SAME popup, at its own already-established position, after
  // closing itself first. The standalone MyItemsHub button further down
  // keeps working exactly as before regardless.
  const [myInsightsOpen, setMyInsightsOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      // openInsightsLens overrides the normal "always land on the resting
      // picker" reset below, the same way schedule.tsx's own
      // openScheduleLens and purple-digest.tsx's own openDigestLens
      // already do. 2026-08-29, direct report about Home's "Worth a look"
      // tile: "goes to the Insights screen with nothing else selected. A
      // person who taps that will never know where they are supposed to
      // look for the thing that is worth a look." Correct -- that tile
      // navigated to a bare /insights, which resets to the lens picker,
      // so the count it just showed had no destination at all. Validated
      // against LENSES rather than cast, so a stale or mistyped link
      // falls through to the ordinary resting picker instead of setting
      // a lens key that does not exist.
      const requestedLens = LENSES.find((option) => option.key === openInsightsLens);
      if (requestedLens) {
        setLens(requestedLens.key);
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [openInsightsLens]),
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2026-08-26, direct report: "we associated and wired up all of the
  // conditions, food alergies, and general health specific tracking
  // numbers. Those things didn't get wired through to the Insights
  // tools." Confirmed true by reading this file directly first: nothing
  // here had ever called getUserConditions/getDietPreferences/
  // listFoodAllergies at all. Loaded once, on mount -- the same "reference
  // data about the person, not today's log" cadence trackedNutrients/
  // rankingDriRows below already use, since a person's own declared
  // profile rarely changes mid-visit and every lens below reads it, not
  // just one. Reused by Food Lookup (via the personalize prop), Safe
  // Foods (condition-scoped safety, plus a diet/allergy filter on top),
  // and Nutrient Ranking (a diet/allergy filter on the ranked list).
  const [personalizationProfile, setPersonalizationProfile] = useState<PersonalizationProfile | null>(null);
  useEffect(() => {
    getPersonalizationProfile().then(setPersonalizationProfile);
  }, []);

  const [nutrientBreakdown, setNutrientBreakdown] = useState<DailyNutrientBreakdown | null>(null);
  const [dimensionsBreakdown, setDimensionsBreakdown] = useState<DailySixDimensionsBreakdown | null>(null);

  // Shared across all three lenses -- drilling into "Breakfast" while
  // looking at Condition Scores and then switching to Nutrients should still be
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
  // 2026-08-14, direct report: results were showing (and the underlying
  // query firing) the instant a Nutrient was picked, using whatever
  // Prep state happened to already be set (defaulting to "All") -- before
  // the person ever got a real chance to touch that field themselves. That
  // also meant the results table was already fully mounted, with real
  // content, right as they went to open the Prep state popover next --
  // a real, plausible contributor to this screen's own already-documented
  // touch-arbitration freeze (two scrollable/touchable regions competing
  // for the same screen space), not just a UX ordering complaint. `null`
  // for rankingPrepGroup can't distinguish "never touched" from "explicitly
  // chose All prep states" (both are real, valid end states), so this is a
  // separate, dedicated flag rather than inferred from the value itself --
  // set true the first time the person makes ANY real selection here
  // (including "All prep states" itself, a genuine choice in its own
  // right), never reset afterward for the rest of this screen's lifetime.
  const [rankingPrepGroupTouched, setRankingPrepGroupTouched] = useState(false);
  const handleRankingPrepGroupChange = useCallback((group: PrepStateGroup | null) => {
    setRankingPrepGroupTouched(true);
    setRankingPrepGroup(group);
  }, []);
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
    // 2026-08-14, gated on rankingPrepGroupTouched too, not just
    // rankingNutrient -- see that flag's own comment above. Skipping the
    // query entirely (not just hiding the result) until both real
    // selections exist means the results ScrollView stays genuinely empty
    // while a person is still working through the Nutrient/Prep state
    // fields, not just visually hidden with a full table already mounted
    // underneath.
    if (!rankingNutrient || !rankingPrepGroupTouched) {
      setRankedFoods([]);
      return;
    }
    let isCurrent = true;
    setRankingLoading(true);
    rankFoodsByNutrient(rankingNutrient, 100, rankingPrepGroup).then((rows) => {
      if (!isCurrent) return;
      // 2026-08-26 -- same real gap as Safe Foods: a declared diet
      // preference or food allergy had never been checked here either,
      // so someone vegan could see beef leading their own protein
      // ranking. Both checks are pure/DB-free (lib/foodPersonalization.ts),
      // cheap enough to run over this already-fetched, capped (100-row)
      // list. personalizationProfile is null only for the brief instant
      // before its own first, fast load resolves; unfiltered in the
      // meantime rather than blocking the whole ranking on it.
      const filtered = personalizationProfile
        ? rows.filter(
            (food) =>
              foodMatchesDietPreferences(food.category, food.baseName, personalizationProfile.dietPreferences) &&
              !foodMatchesAllergy(food.baseName, personalizationProfile.foodAllergies),
          )
        : rows;
      setRankedFoods(filtered);
      setRankingLoading(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [rankingNutrient, rankingPrepGroup, rankingPrepGroupTouched, personalizationProfile]);
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
  // load once" nature as Nutrient Ranking above.
  //
  // 2026-08-14, a real, direct root cause found for this whole session's
  // own multi-day freeze investigation (see lib/db.ts's own getSafeFoodIds
  // comment for the full story) -- this effect used to run unconditionally
  // on MOUNT, with an empty dependency array, meaning it fired every single
  // time Insights itself opened, for every lens, regardless of whether the
  // person ever visited Safe Foods at all. getSafeFoodIds() underneath it
  // does a genuine, unindexed, no-WHERE-clause SELECT of every row in
  // food_scores (roughly 180K+ rows) and two full JS passes over the
  // result -- a live logcat capture during a real, reproduced freeze
  // confirmed this single call alone took 18,657ms and blocked the JS
  // thread completely (even a bare setInterval heartbeat) for its whole
  // real duration, no matter which lens someone was actually trying to
  // use at the time. Now gated on `lens === 'safeFoods'` and a ref-based
  // "already requested" guard, so this genuinely slow, one-time
  // computation only ever runs if and when someone actually opens this
  // lens -- getSafeFoodIds() is still module-level memoized in lib/db.ts,
  // so switching away and back never re-runs the expensive part, only
  // this effect's own trigger changed. safeFoodCategoriesLoading is real,
  // honest loading state for that first, still-genuinely-slow load --
  // without it, opening Safe Foods for the first time would show a blank
  // picker with zero feedback for up to ~19 real seconds, reading exactly
  // like the freeze this whole change exists to fix.
  const [safeFoodCategories, setSafeFoodCategories] = useState<string[]>([]);
  const [safeFoodCategoriesLoading, setSafeFoodCategoriesLoading] = useState(false);
  const [safeFoodCategory, setSafeFoodCategory] = useState<string | null>(null);
  const [safeFoods, setSafeFoods] = useState<SafeFood[]>([]);
  const [safeFoodsLoading, setSafeFoodsLoading] = useState(false);
  const safeFoodCategoriesRequested = useRef(false);
  useEffect(() => {
    // 2026-08-26 -- also waits for personalizationProfile so the very
    // first fetch already uses the person's real tracked conditions
    // (getPersonalizedSafeFoodIds, lib/db.ts), rather than firing once
    // unpersonalized and never again -- safeFoodCategoriesRequested only
    // ever flips true once, matching the freeze-avoiding "one real fetch
    // per session" contract this effect's own comment above documents.
    if (lens !== 'safeFoods' || safeFoodCategoriesRequested.current || !personalizationProfile) return;
    safeFoodCategoriesRequested.current = true;
    setSafeFoodCategoriesLoading(true);
    listSafeFoodCategories(personalizationProfile.trackedConditions.map((condition) => condition.code)).then((categories) => {
      setSafeFoodCategories(categories);
      setSafeFoodCategoriesLoading(false);
    });
  }, [lens, personalizationProfile]);
  useEffect(() => {
    if (!safeFoodCategory || !personalizationProfile) {
      setSafeFoods([]);
      return;
    }
    let isCurrent = true;
    setSafeFoodsLoading(true);
    const conditionCodes = personalizationProfile.trackedConditions.map((condition) => condition.code);
    listSafeFoods(safeFoodCategory, 200, conditionCodes).then((rows) => {
      if (!isCurrent) return;
      // "Safe" from the condition-scoped query above still says nothing
      // about a declared diet preference or a food allergy -- both real,
      // separate axes this lens had also never checked at all. Filtered
      // here rather than inside listSafeFoods itself: diet-tag
      // classification and allergy matching are both pure, DB-free
      // functions (lib/foodPersonalization.ts), so there's no reason to
      // push them into the SQL layer.
      const filtered = rows.filter(
        (food) =>
          foodMatchesDietPreferences(food.category, food.baseName, personalizationProfile.dietPreferences) &&
          !foodMatchesAllergy(food.baseName, personalizationProfile.foodAllergies),
      );
      setSafeFoods(filtered);
      setSafeFoodsLoading(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [safeFoodCategory, personalizationProfile]);

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
    // 2026-08-26 -- gated on personalizationProfile the same way Safe
    // Foods is (see that effect's own comment): waiting for the person's
    // real, fast-loading profile before this lens's own real query fires
    // means the very first result shown is already filtered, rather than
    // a brief flash of unfiltered foods immediately re-filtered out from
    // under the person a moment later.
    if (!personalizationProfile) return;
    Promise.all([listStage1Foods(), listStage2ReintroductionRounds()]).then(([stage1, stage2]) => {
      // Same real diet-preference/allergy filter Safe Foods and Nutrient
      // Ranking already apply -- the small schema gap that used to block
      // it here (StageFood rows carried no `category` at all) is fixed
      // directly above in lib/db.ts's own StageFood/queryStageGroup/
      // foodsWithSubCriterionTag.
      const filterGroup = (group: StageFoodGroupResult): StageFoodGroupResult => ({
        ...group,
        foods: group.foods.filter(
          (food) =>
            foodMatchesDietPreferences(food.category, food.baseName, personalizationProfile.dietPreferences) &&
            !foodMatchesAllergy(food.baseName, personalizationProfile.foodAllergies),
        ),
      });
      setStage1Groups(stage1.map(filterGroup));
      setStage2Rounds(stage2.map(filterGroup));
      setHealingStageLoading(false);
    });
  }, [personalizationProfile]);

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
  // 2026-08-18 -- gained the personal-rule half of the same engine:
  // myMedsPersonalRuleMatches is whichever of the person's own rules
  // currently apply (from the same evaluateInteractionRules call the
  // cited warnings already come from), myMedsAllPersonalRules is every
  // saved rule, active or paused, for the real "manage your rules"
  // section MyMedsView also renders. Extracted to a named loadMyMeds
  // (matching loadLabs' own shape above) so it can be passed down and
  // called again right after a rule is added, toggled, or deleted --
  // the exact same onSaved-style reload LabsView already uses.
  const [myMedsTreatments, setMyMedsTreatments] = useState<TreatmentRecord[]>([]);
  const [myMedsWarnings, setMyMedsWarnings] = useState<InteractionWarning[]>([]);
  const [myMedsReferenceOnly, setMyMedsReferenceOnly] = useState<ReferenceOnlyRule[]>([]);
  const [myMedsPersonalRuleMatches, setMyMedsPersonalRuleMatches] = useState<PersonalRule[]>([]);
  const [myMedsAllPersonalRules, setMyMedsAllPersonalRules] = useState<PersonalRule[]>([]);
  const [myMedsLoading, setMyMedsLoading] = useState(true);
  const loadMyMeds = useCallback(() => {
    setMyMedsLoading(true);
    Promise.all([listAllActiveTreatments(), evaluateInteractionRules(todayDateString()), listPersonalRules()]).then(
      ([treatments, evaluation, allPersonalRules]) => {
        setMyMedsTreatments(treatments);
        setMyMedsWarnings(evaluation.warnings);
        setMyMedsReferenceOnly(evaluation.referenceOnly);
        setMyMedsPersonalRuleMatches(evaluation.personalRules);
        setMyMedsAllPersonalRules(allPersonalRules);
        setMyMedsLoading(false);
      },
    );
  }, []);
  useFocusEffect(useCallback(() => loadMyMeds(), [loadMyMeds]));

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

  // Energy & Portions lens, 2026-08-15 -- profile/weight/condition stages
  // can all change mid-session in Profile, and today's own totals grow as
  // meals get logged, so this reloads on focus, same reasoning as Labs/My
  // Meds/Advisories above. Gated on `lens === 'portions'` too, the same
  // hard-learned discipline as Safe Foods above -- there's no reason to
  // fetch a whole day's nutrient breakdown a second time on every focus
  // change unless someone's actually looking at this lens.
  const [portionsProfile, setPortionsProfile] = useState<UserProfile | null>(null);
  const [portionsWeightKg, setPortionsWeightKg] = useState<number | null>(null);
  const [portionsConditionStages, setPortionsConditionStages] = useState<Record<string, string>>({});
  const [portionsBreakdown, setPortionsBreakdown] = useState<DailyNutrientBreakdown | null>(null);
  const [portionsLoading, setPortionsLoading] = useState(true);
  const loadPortions = useCallback(() => {
    setPortionsLoading(true);
    Promise.all([
      getUserProfile(),
      listBodyMeasurements('weight', 1),
      getConditionStages(),
      getDailyNutrientBreakdown(todayDateString()),
    ]).then(([profileResult, weightRows, stages, breakdown]) => {
      const latestWeight = weightRows[0];
      setPortionsProfile(profileResult);
      setPortionsWeightKg(
        latestWeight ? (latestWeight.unit === 'lb' ? lbToKg(latestWeight.value) : latestWeight.value) : null,
      );
      setPortionsConditionStages(stages);
      setPortionsBreakdown(breakdown);
      setPortionsLoading(false);
    });
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (lens === 'portions') loadPortions();
    }, [lens, loadPortions]),
  );

  // useFocusEffect (not a plain useEffect) -- Expo Router's tab screens
  // stay mounted in the background when you switch tabs, they don't
  // unmount, so a one-time useEffect only ever fetched once for this
  // screen's entire lifetime. Any meal logged/changed on another tab would
  // never show up here until the app was fully restarted. This re-runs
  // every time Insights actually comes into view instead.
  //
  // 2026-08-16, a real, direct report: "When i open Cooking Prep it takes
  // forever for it to load." Confirmed the actual cause reading this
  // effect: it had NO lens gate at all -- it fired on every single Insights
  // focus regardless of which lens was showing, paying the full cost of a
  // whole day's nutrient AND 6-Dimensions breakdown even for someone
  // landing on Labs, My Meds, or Cooking Impact, none of which ever read
  // either result. nutrientBreakdown/dimensionsBreakdown are read by
  // exactly 4 lenses (confirmed directly -- every other lens already has
  // its own dedicated state/effect above): nutrients + hydration both need
  // nutrientBreakdown; sixDs + prep both need dimensionsBreakdown. Gated
  // the same established way as Portions/Safe Foods above, with `lens`
  // genuinely in the dependency array this time -- useFocusEffect re-runs
  // its own callback whenever the callback identity changes while the
  // screen is still focused, not only on a real focus/blur transition, so
  // switching INTO one of these 4 lenses now correctly triggers a fresh
  // fetch even without leaving and returning to the tab, instead of only
  // ever firing once per tab visit regardless of which lens started it.
  // The other real half of the fix -- the two functions below themselves
  // no longer doing a real query per meal -- lives in lib/db.ts.
  useFocusEffect(
    useCallback(() => {
      if (lens !== 'nutrients' && lens !== 'hydration' && lens !== 'sixDs' && lens !== 'prep') return;

      let cancelled = false;
      const date = todayDateString();
      setLoading(true);
      // 2026-08-26 -- getDailySixDimensionsBreakdown now also computes a
      // real per-condition breakdown (see lib/conditionDimensions.ts),
      // scoped to whatever the person has actually tracked in Profile.
      Promise.all([getDailyNutrientBreakdown(date), getDailySixDimensionsBreakdown(date, personalizationProfile?.trackedConditions ?? [])])
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
    }, [lens, personalizationProfile]),
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
              <FoodLookup tabColor={TAB_COLOR} personalize={personalizationProfile ?? undefined} />
            </View>
          ) : lens === 'nutrientRanking' ? (
            // Also deliberately NOT inside the shared ScrollView below --
            // NutrientRankingView owns its own internal ScrollView (the
            // same "this lens owns its own layout, not the shared page
            // wrapper" precedent Food Lookup already established just
            // above), needed so its own anyPopoverOpen guard (see its own
            // header comment) can control scroll/touch on exactly the one
            // ScrollView this lens renders, not the app-wide shared one
            // every other lens also uses.
            //
            // 2026-08-14, real history worth keeping, since this exact
            // field position has now moved twice for two different real
            // reasons: originally pinned low, near the floating TabHub
            // button, specifically because reaching the Nutrient field at
            // the TOP of the screen worked against this app's own
            // one-handed-operation goal (the floating hub buttons already
            // cluster low for exactly this reason -- see NAVIGATION_HAND's
            // own comment in constants/floatingButton.ts). Moved back to
            // the top the same day, as a real, deliberate diagnostic test
            // (see NutrientRankingView's own header comment): on-device
            // evidence traced a real ~15s row-tap freeze to an Android
            // elevation conflict with that same button, and raising the
            // popover's elevation past the button's real elevation didn't
            // fully close the gap on retest. This move knowingly
            // reintroduces the original one-handed-reach tradeoff, as the
            // most direct way to confirm or rule out whether proximity to
            // that button still plays any role at all -- worth revisiting
            // once the actual cause is fully confirmed, not assumed
            // permanent either way.
            <View style={styles.foodLookupActiveListContainer}>
              <NutrientRankingView
                nutrients={allNutrients}
                selected={rankingNutrient}
                onSelect={setRankingNutrient}
                rankedFoods={rankedFoods}
                loading={rankingLoading}
                tabColor={TAB_COLOR}
                prepGroup={rankingPrepGroup}
                prepGroupTouched={rankingPrepGroupTouched}
                onPrepGroupChange={handleRankingPrepGroupChange}
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
                categoriesLoading={safeFoodCategoriesLoading}
                selected={safeFoodCategory}
                onSelect={setSafeFoodCategory}
                foods={safeFoods}
                loading={safeFoodsLoading}
                tabColor={TAB_COLOR}
                personalizationProfile={personalizationProfile}
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
                personalRuleMatches={myMedsPersonalRuleMatches}
                allPersonalRules={myMedsAllPersonalRules}
                onPersonalRuleChanged={loadMyMeds}
                loading={myMedsLoading}
                tabColor={TAB_COLOR}
              />
            ) : lens === 'advisories' ? (
              <AdvisoriesView advisories={advisories} loading={advisoriesLoading} tabColor={TAB_COLOR} />
            ) : lens === 'portions' ? (
              <PortionsView
                profile={portionsProfile}
                weightKg={portionsWeightKg}
                conditionStages={portionsConditionStages}
                breakdown={portionsBreakdown}
                loading={portionsLoading}
                tabColor={TAB_COLOR}
              />
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
                trackedConditions={personalizationProfile?.trackedConditions ?? []}
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
      lens === 'advisories' ||
      lens === 'portions'
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
      <MyItemsHub
        label="My Insights"
        tabColor={TAB_COLOR}
        open={myInsightsOpen}
        onOpenChange={setMyInsightsOpen}
      />
      <LensHub
        pageTitle="Insights"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Insights', icon: 'bookmarks-outline', onPress: () => setMyInsightsOpen(true) }}
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
// The raw data behind a scope's own nutrient total: which specific logged
// foods (and, at day scope, supplements) actually produced it, sorted
// highest-contributor first. Reuses the same resolveScopeMeal/
// resolveScopeSide walkers already built for the scope navigator itself,
// so this can never disagree with whatever scope is currently selected.
// Direct fix for a real report: "the numbers don't really relate to
// understandable usable information... it doesn't tell me what the food
// is" -- a bare "Iron: 18%" row told a person nothing they could actually
// act on without manually re-drilling through ScopeHub one level at a
// time. This surfaces the same information right where the number
// already is.
type NutrientContributor = { label: string; amount: number };

function contributorsForNutrient(
  breakdown: DailyNutrientBreakdown,
  scope: Scope,
  nutrientCode: string,
): NutrientContributor[] {
  const contributors: NutrientContributor[] = [];
  const addItem = (item: { foodName: string; totals: DailyNutrientScopeTotals }) => {
    const amount = item.totals[nutrientCode] ?? 0;
    if (amount > 0) contributors.push({ label: item.foodName, amount });
  };

  if (scope.level === 'day') {
    for (const meal of breakdown.meals) {
      for (const side of meal.sides) {
        for (const item of side.items) addItem(item);
      }
    }
    // Supplements aren't part of the meal/side/item tree at all -- a
    // separate bucket already folded into entry.combinedTotal at day
    // scope (see NutrientsTable's own analyzeNutrientIntake call below).
    // Named explicitly here so the breakdown's own totals actually add up
    // to what the row shows, rather than silently falling short with no
    // explanation for the gap.
    const supplementAmount = breakdown.supplementTotals[nutrientCode] ?? 0;
    if (supplementAmount > 0) contributors.push({ label: 'Supplements', amount: supplementAmount });
  } else if (scope.level === 'meal') {
    for (const side of resolveScopeMeal(breakdown, scope)?.sides ?? []) {
      for (const item of side.items) addItem(item);
    }
  } else if (scope.level === 'side') {
    for (const item of resolveScopeSide(breakdown, scope)?.items ?? []) addItem(item);
  } else {
    // scope.level === 'item' -- NutrientsTable never actually calls this
    // for that scope (see its own canExpandContributors), but handled
    // correctly anyway rather than left silently wrong for any future
    // caller.
    const side = resolveScopeSide(breakdown, scope);
    const item = side?.items[scope.itemIndex];
    if (item) addItem(item);
  }

  return contributors.sort((a, b) => b.amount - a.amount);
}

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

  // Which row (if any) is currently expanded to show its own contributing
  // foods -- reset on every scope change so switching meals/sides never
  // leaves a stale expansion pointing at a row that no longer means the
  // same thing. Not offered at 'item' scope: the table is already about
  // exactly one food there (its name is already the breadcrumb above it),
  // so "which food contributed this" would just repeat the same name back.
  const [expandedNutrientCode, setExpandedNutrientCode] = useState<string | null>(null);
  useEffect(() => setExpandedNutrientCode(null), [scope]);
  const canExpandContributors = scope.level !== 'item';

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

      {canExpandContributors && sorted.length > 0 ? (
        <Text style={styles.sectionLabel}>Tap any nutrient to see which foods contributed to it.</Text>
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
            const rowExpanded = canExpandContributors && expandedNutrientCode === entry.nutrientCode;
            const contributors = rowExpanded ? contributorsForNutrient(breakdown, scope, entry.nutrientCode) : [];
            return (
              <View key={`${entry.nutrientCode}_${index}`}>
                <TouchableOpacity
                  style={[styles.tableRow, entrySeverity ? severityRowStyle(entrySeverity) : null]}
                  activeOpacity={canExpandContributors ? 0.6 : 1}
                  disabled={!canExpandContributors}
                  onPress={() =>
                    setExpandedNutrientCode((prev) => (prev === entry.nutrientCode ? null : entry.nutrientCode))
                  }
                >
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellNutrient,
                      canExpandContributors ? styles.tableCellNutrientTappable : null,
                    ]}
                    numberOfLines={1}
                  >
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
                </TouchableOpacity>
                {rowExpanded ? (
                  <View style={styles.detailBlock}>
                    {contributors.length === 0 ? (
                      <Text style={styles.detailText}>Nothing logged here actually contributed to this.</Text>
                    ) : (
                      contributors.map((contributor, contributorIndex) => (
                        <View key={`${contributor.label}_${contributorIndex}`} style={styles.detailFoodRow}>
                          <Text style={styles.detailFoodName} numberOfLines={1}>
                            {contributor.label}
                          </Text>
                          <Text style={styles.detailFoodTier}>
                            {formatAmount(contributor.amount, entry.unit)}
                            {entry.combinedTotal > 0
                              ? ` (${Math.round((contributor.amount / entry.combinedTotal) * 100)}%)`
                              : ''}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
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

// Builds a real analyzeNutrientIntake-compatible row from a personally
// computed target -- 'AI' rather than 'RDA', since this is a real estimate
// meant to be met or exceeded (fuel enough for the body's own needs), not
// an official NASEM allowance; deliberately no upperLimit, since eating
// more than an estimated maintenance calorie/macro figure isn't a safety
// concern the way exceeding a real UL is. sourceAgency says plainly this
// is a computed personal estimate, never mistaken for a government DRI row.
function buildPersonalDriRow(nutrientCode: string, displayName: string, amount: number, unit: string): DietaryReferenceIntake {
  return {
    nutrientCode,
    displayName,
    sex: 'all',
    ageMin: 0,
    ageMax: null,
    valueType: 'AI',
    amount,
    unit,
    upperLimit: null,
    upperLimitType: null,
    sourceAgency: 'Personalized estimate (Mifflin-St Jeor equation + your own activity level), not an official DRI',
    citation: null,
    notes: 'Computed from your own weight, height, age, and activity level in Profile -- see Digest\'s Portions & Recommended Amounts topic for the full method.',
  };
}

// Energy & Portions lens, 2026-08-15 -- Mifflin-St Jeor BMR, a real
// activity-level PAL multiplier for TDEE, and macro targets built from
// real body weight (protein) and NASEM's own AMDR ranges (fat/carb) -- see
// lib/energyNeeds.ts's own header comment for the full sources. A
// maintenance estimate, never a prescribed target: deliberately no
// weight-loss/gain deficit or surplus layer (see that same file's own
// comment on why that's a separate, not-yet-built feature).
function PortionsView({
  profile,
  weightKg,
  conditionStages,
  breakdown,
  loading,
  tabColor,
}: {
  profile: UserProfile | null;
  weightKg: number | null;
  conditionStages: Record<string, string>;
  breakdown: DailyNutrientBreakdown | null;
  loading: boolean;
  tabColor: string;
}) {
  const [mealsPerDay, setMealsPerDay] = useState(3);

  if (loading) {
    return <Text style={styles.emptyText}>Loading…</Text>;
  }
  if (!profile) {
    return <Text style={styles.emptyText}>Loading…</Text>;
  }

  const { sex, birthDate, heightCm, activityLevel } = profile;
  if (!sex || !birthDate || !heightCm || !activityLevel || weightKg == null) {
    const missing: string[] = [];
    if (!sex) missing.push('sex');
    if (!birthDate) missing.push('birth date');
    if (!heightCm) missing.push('height');
    if (weightKg == null) missing.push('weight');
    if (!activityLevel) missing.push('activity level');
    return (
      <View style={styles.noticeCard}>
        <Text style={styles.noticeText}>
          Set your {missing.join(', ')} in Profile to see your own Energy & Portions numbers. Nothing here is
          guessed on your behalf.
        </Text>
      </View>
    );
  }

  const ageYears = ageFromBirthDate(birthDate);
  const bmr = calculateBmr(sex, weightKg, heightCm, ageYears);
  const tdee = calculateTdee(bmr, activityLevel);
  const macros: MacroTargets = calculateMacroTargets(tdee, activityLevel, weightKg, conditionStages);
  const produce = calculateProduceTargets(tdee);
  const waterRow = breakdown?.driRows.find((row) => row.nutrientCode === 'water') ?? null;

  const personalRows: DietaryReferenceIntake[] = [
    buildPersonalDriRow('energy_kcal', 'Calories', macros.calories, 'kcal'),
    buildPersonalDriRow('protein', 'Protein', macros.proteinGrams, 'g'),
    buildPersonalDriRow('carbohydrate', 'Carbohydrate', macros.carbGrams, 'g'),
    buildPersonalDriRow('fat_total', 'Fat', macros.fatGrams, 'g'),
  ];
  const todayEntries = breakdown ? analyzeNutrientIntake(personalRows, breakdown.dayTotals, breakdown.supplementTotals) : [];
  const somethingLoggedToday = todayEntries.some((entry) => entry.combinedTotal > 0);

  const macroRows = [
    { label: 'Protein', grams: macros.proteinGrams },
    { label: 'Carbohydrate', grams: macros.carbGrams },
    { label: 'Fat', grams: macros.fatGrams },
  ];

  return (
    <>
      <View style={styles.noticeCard}>
        <Text style={styles.noticeText}>
          Estimated from your own weight, height, age, and activity level -- a maintenance estimate, not a
          prescribed target or a diagnosis. See Digest&apos;s Portions & Recommended Amounts topic for the
          full method and citations.
        </Text>
      </View>

      {macros.proteinSource === 'condition' && macros.proteinNote ? (
        <View style={[styles.noticeCard, { borderColor: tabColor }]}>
          <Text style={styles.noticeText}>{macros.proteinNote}</Text>
        </View>
      ) : null}

      <Text style={styles.portionsSectionHeading}>Maintenance calories</Text>
      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{Math.round(bmr)}</Text>
          <Text style={styles.statLabel}>BMR (resting, kcal/day)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: tabColor }]}>{Math.round(tdee)}</Text>
          <Text style={styles.statLabel}>Maintenance calories (TDEE)</Text>
        </View>
      </View>

      <Text style={styles.portionsSectionHeading}>Meals per day</Text>
      <View style={styles.portionsPillRow}>
        {[2, 3, 4, 5, 6].map((count) => {
          const active = count === mealsPerDay;
          return (
            <TouchableOpacity
              key={count}
              style={[styles.portionsPill, active ? { backgroundColor: tabColor, borderColor: tabColor } : null]}
              onPress={() => setMealsPerDay(count)}
            >
              <Text style={[styles.portionsPillText, active && styles.portionsPillTextActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.portionsSectionHeading}>Daily macro targets</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellNutrient]}>Target</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellAmount]}>Per Day</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellStatus]}>Per Meal</Text>
        </View>
        {macroRows.map((row) => (
          <View key={row.label} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellNutrient]}>{row.label}</Text>
            <Text style={[styles.tableCell, styles.tableCellAmount]} numberOfLines={1}>
              {formatAmount(row.grams, 'g')}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellStatus, styles.statusNeutralText]} numberOfLines={1}>
              {formatAmount(perMealShare(row.grams, mealsPerDay), 'g')}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.footerNote}>
        Fat and carbohydrate split using the midpoint of NASEM&apos;s own Acceptable Macronutrient Distribution
        Range, applied to whatever&apos;s left once your real, weight-based protein target above is subtracted.
      </Text>

      <Text style={styles.portionsSectionHeading}>Produce guide</Text>
      <Text style={styles.footerNote}>USDA MyPlate&apos;s own published cup-equivalent amounts, scaled to your calorie need.</Text>
      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{produce.vegetableCups.toFixed(1)}</Text>
          <Text style={styles.statLabel}>cups vegetables/day</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{produce.fruitCups.toFixed(1)}</Text>
          <Text style={styles.statLabel}>cups fruit/day</Text>
        </View>
      </View>

      {waterRow ? (
        <>
          <Text style={styles.portionsSectionHeading}>Water</Text>
          <Text style={[styles.statValue, { textAlign: 'left' }]}>{(waterRow.amount / 1000).toFixed(1)}L / day</Text>
          <Text style={styles.footerNote}>
            {waterRow.sourceAgency}. Counts water-rich food too, not just drinks -- see the Hydration lens for
            today&apos;s actual progress toward it.
          </Text>
        </>
      ) : null}

      <Text style={styles.portionsSectionHeading}>Today so far</Text>
      {!somethingLoggedToday ? (
        <Text style={styles.emptyText}>Nothing logged yet today.</Text>
      ) : (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellNutrient]}>Target</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellAmount]}>Logged / Target</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellStatus]}>Status</Text>
          </View>
          {todayEntries.map((entry) => {
            const severity = nutrientStatusSeverity(entry.status);
            return (
              <View key={entry.nutrientCode} style={[styles.tableRow, severityRowStyle(severity)]}>
                <Text style={[styles.tableCell, styles.tableCellNutrient]}>{entry.displayName}</Text>
                <Text style={[styles.tableCell, styles.tableCellAmount]} numberOfLines={1}>
                  {formatAmount(entry.combinedTotal, entry.unit)} / {formatAmount(entry.target, entry.unit)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellStatus, severityTextStyle(severity)]} numberOfLines={2}>
                  {NUTRIENT_STATUS_LABELS[entry.status] ?? entry.status} ({Math.round(entry.percentOfTarget)}%)
                </Text>
              </View>
            );
          })}
        </View>
      )}
      <Text style={styles.footerNote}>
        As logged so far today -- this fills in as the day goes on, not a verdict on the whole day this early.
      </Text>
    </>
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
//
// First bumped from slot 1 to slot 0, 2026-08-15 -- a real fix, but an
// incomplete one, corrected the same day once actually reported again:
// "the circle thing is behind the My Insights icon." Slot 0's own
// unclamped position (windowWidth/2 - 102) genuinely does clear LensHub's
// corner button, which is all that got checked at the time -- but
// MyItemsHub (the "My Insights" button, see MyItemsHub.tsx) doesn't use
// the slot system at all; it sits at the live midpoint of the gap between
// LensHub's own right edge and TabHub's own icon edge, which lands almost
// exactly where slot 0 does too (both formulas are independently trying to
// fill the same narrow strip). That's the real miss in the first fix --
// only LensHub's own clearance was re-checked, not MyItemsHub's.
//
// Worked out properly this time, not guessed at a third time: at ordinary
// phone widths the whole strip between the true left corner (16px in) and
// TabHub's own icon edge is only around 120-150px wide, and LensHub (60px)
// plus MyItemsHub (32px) plus a real, separate ScopeHub (60px) plus the
// gaps between them need at least ~150-175px -- there is genuinely no
// horizontal slot left in that strip for a third full-size button on any
// normal phone; every position tried (slot 0, slot 1) collides with
// whichever of LensHub/MyItemsHub it lands closest to. Fixed by moving
// ScopeHub OUT of that strip entirely rather than trying yet another
// position within it -- stacked directly above LensHub's own corner
// button (same `left`, `bottom` raised by one button-height plus one gap)
// instead of squeezed in beside it. Confirmed via direct math that nothing
// else renders in that vertical space (PageIdentityLabel -- the "which
// lens am I in" box -- sits on the opposite side of the screen from the
// hub cluster on purpose, see its own header comment) and that the new
// bottom position stays comfortably on-screen at every real device
// height.
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
  const { bottom: rowBottom, left: buttonLeft } = useBottomLeftHubPosition();
  // Stacked one full button-height plus the standard hub gap above the
  // shared row -- directly above LensHub's own corner button, not beside
  // it, since there's no real horizontal room left in that row (see the
  // comment above). +15 more, 2026-08-15, direct request for real, extra
  // vertical clearance. Horizontal position (buttonLeft) is already shared
  // with LensHub's own corner button via the same useBottomLeftHubPosition()
  // call above, and both are the same real FLOATING_BUTTON_SIZE, so their
  // horizontal centers already match exactly -- no separate alignment
  // needed on that axis.
  const buttonBottom = rowBottom + FLOATING_BUTTON_SIZE + SECONDARY_HUB_GAP + 15;
  // Independent of buttonBottom -- the button itself stays anchored inside
  // the footer band; only the popup card floats clear above it (see
  // useMenuCardBottom's own comment in constants/floatingButton.ts).
  const cardBottom = useMenuCardBottom();

  const crumbs = scopeBreadcrumbs(breakdown, scope);

  // 2026-08-15, a real, confirmed bug, not a test-data quirk: `key` used
  // to be the composed display `label` itself, but two genuinely distinct
  // meals/sides/items can share the identical label (two real "Breakfast"
  // meals logged the same day is a completely normal, real scenario, not
  // just something dev-seed data happens to trigger) -- React needs a
  // real, structurally unique key, never display text. Each branch below
  // already has a real, guaranteed-unique array index for its own level
  // (mealIndex/sideIndex/itemIndex, from the very scope object each child
  // already carries) -- `children` is rebuilt fresh from `breakdown` every
  // render with no per-pill local state to preserve, so an index-based key
  // is genuinely safe here, not the usual index-as-key risk.
  let children: { key: string; label: string; scope: Scope }[] = [];
  if (scope.level === 'day') {
    children = breakdown.meals.map((meal, mealIndex) => ({
      key: `meal-${mealIndex}`,
      label: `${capitalize(meal.mealType)} · ${meal.mealName}`,
      scope: { level: 'meal', mealIndex },
    }));
  } else if (scope.level === 'meal') {
    const meal = resolveScopeMeal(breakdown, scope);
    children = (meal?.sides ?? []).map((side, sideIndex) => ({
      key: `side-${sideIndex}`,
      label: side.sideName,
      scope: { level: 'side', mealIndex: scope.mealIndex, sideIndex },
    }));
  } else if (scope.level === 'side') {
    const side = resolveScopeSide(breakdown, scope);
    children = (side?.items ?? []).map((item, itemIndex) => ({
      key: `item-${itemIndex}`,
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
        {/* funnel-outline, not layers-outline -- the latter is also Food's
            own Handhelds builder icon (food.tsx/MealBuilder.tsx), which
            once read as "the Handhelds icon" showing up here by mistake.
            Funnel fits the actual mechanic too: narrowing from a whole
            day down to one meal, side, or item.
            Filled with TAB_COLOR (this tab's own identity color, not the
            generic colors.primary this used before) and wrapped in
            IridescentRingCircle's own animated ring -- the same shared
            "this is a real, tappable thing sitting above the page" cue
            LensHub's own corner button already uses, given a colored fill
            here via that component's own innerColor override so the
            button stays visually distinct from whatever table content is
            scrolling underneath it, not just while a popup happens to be
            open. */}
        <IridescentRingCircle size={FLOATING_BUTTON_SIZE} innerColor={TAB_COLOR}>
          <Ionicons name="funnel-outline" size={24} color={colors.textOnPrimary} style={textShadow} />
        </IridescentRingCircle>
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
                  <TouchableOpacity key={child.key} style={styles.pill} onPress={() => choose(child.scope)}>
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

// Insights' own condition-scoped scorecard, 2026-08-26, replacing the old
// generic version outright -- one block per tracked condition (using
// whatever's set in Profile; this screen adds no picker of its own), each
// with that condition's own real dimension chart plus a tap-to-expand
// sub-criterion table, for whatever scope is currently selected. Never
// shows more than one scope's worth of detail at once.
//
// Naming: "Six Dimensions of Food Friendliness" is exclusive to Hashimoto's,
// the one tracked condition that actually owns all 6 real dimensions with
// independently-scored data of its own (confirmed directly against the
// live database, not assumed) -- every other condition's own block is
// titled with its own plain name instead, never compared to Hashimoto's
// or described as a smaller version of the same framework.
export function SixDsView({
  breakdown,
  scope,
  // Optional, defaults to [] -- app/food-item-detail.tsx's own reuse of
  // this component (a saved dish's detail view) doesn't pass this yet
  // (see this rebuild's own phase 3), so it keeps compiling and shows the
  // same honest "set your tracked conditions" message in the meantime,
  // rather than a hard break.
  trackedConditions = [],
  expandedDimension,
  onToggleDimension,
  expandedTierKey,
  onToggleTier,
}: {
  breakdown: DailySixDimensionsBreakdown;
  scope: Scope;
  trackedConditions?: { code: string; name: string }[];
  expandedDimension: string | null;
  onToggleDimension: (dimension: string) => void;
  expandedTierKey: string | null;
  onToggleTier: (key: string) => void;
}) {
  const perCondition = resolveScopePerCondition(breakdown, scope);

  if (trackedConditions.length === 0) {
    return <Text style={styles.emptyText}>Set your tracked conditions in Profile to see this.</Text>;
  }

  return (
    <>
      {trackedConditions.map((condition) => {
        const summary: ConditionDimensionSummary = perCondition[condition.code] ?? { dimensions: [], subCriteria: [] };
        const conditionTitle = condition.code === 'hashimotos' ? 'Six Dimensions of Food Friendliness' : condition.name;

        if (summary.dimensions.length === 0) {
          return (
            <View key={condition.code} style={styles.conditionScoreSection}>
              <Text style={styles.conditionScoreHeading}>{conditionTitle}</Text>
              <Text style={styles.emptyText}>Nothing in this scope is assessed against {condition.name}.</Text>
            </View>
          );
        }

        return (
          <View key={condition.code} style={styles.conditionScoreSection}>
            <DimensionChart conditionName={conditionTitle} data={summary.dimensions} color={TAB_COLOR} />
            <View style={styles.table}>
              {summary.dimensions.map((dim) => {
                const subCriteriaInDimension = summary.subCriteria.filter((sc) => sc.dimension === dim.dimension);
                const flaggedCount = subCriteriaInDimension.filter((sc) => sc.severity === 'yellow' || sc.severity === 'red').length;
                const dimensionLabel = dim.severity === 'unknown' ? 'Not assessed' : flaggedCount > 0 ? `${flaggedCount} flagged` : 'Clear';
                const dimensionKey = `${condition.code}::${dim.dimension}`;
                const expanded = expandedDimension === dimensionKey;

                return (
                  <View key={dim.dimension}>
                    <TouchableOpacity
                      style={[styles.tableRow, severityRowStyle(dim.severity)]}
                      onPress={() => onToggleDimension(dimensionKey)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tableCell, styles.tableCellDimension]} numberOfLines={2}>
                        {dim.dimension}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellStatus, severityTextStyle(dim.severity)]}>{dimensionLabel}</Text>
                    </TouchableOpacity>

                    {expanded ? (
                      <View style={styles.subTable}>
                        {subCriteriaInDimension.map((sc) => {
                          const key = `${condition.code}::${sc.dimension}|${sc.subCriterion}`;
                          const tierExpanded = expandedTierKey === key;
                          const distinctTiers = Array.from(new Set(sc.entries.map((entry) => entry.tier)));
                          // Used to require entries.length > 1 -- which
                          // silently hid the food name entirely whenever
                          // exactly one food in scope carried this sub-
                          // criterion, precisely the single-cause case a
                          // person most needs named. Only genuinely
                          // redundant at 'item' scope, where the food is
                          // already the breadcrumb above this whole table.
                          const showFoodBreakdown = scope.level !== 'item';

                          return (
                            <View key={sc.subCriterion}>
                              <TouchableOpacity style={styles.subTableRow} onPress={() => onToggleTier(key)} activeOpacity={0.6}>
                                <Text style={styles.subTableLabel} numberOfLines={1}>
                                  {sc.subCriterion}
                                </Text>
                                <Text
                                  style={[
                                    styles.subTableValue,
                                    severityTextStyle(sc.severity),
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
                                    ? sc.entries.map((entry, index) => (
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
                                  {/* relevanceNote, 2026-08-26 -- new: why THIS
                                      specific sub-criterion matters for THIS
                                      specific condition, when it's a shared
                                      one rather than a natively-owned one.
                                      Never shown before this rebuild, since
                                      the old generic view had no per-
                                      condition concept to attach it to. */}
                                  {sc.relevanceNote ? (
                                    <Text style={styles.detailText}>
                                      Why this matters for {condition.name}: {sc.relevanceNote}
                                    </Text>
                                  ) : null}
                                  <Text style={styles.detailSourcesLabel}>Sources</Text>
                                  <Text style={styles.detailSourcesText}>
                                    {linkifyText(sc.citation ?? getSubCriterionSources(sc.subCriterion))}
                                  </Text>
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
          </View>
        );
      })}
    </>
  );
}

// Cooking & Prep lens -- a flat "needs attention" summary for the whole
// day up top (always visible, regardless of scope), then the same scope
// navigator as Condition Scores for browsing tips meal-by-meal/side-by-side/item-by-
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
  const addItem = (item: DailyDimensionItemBreakdown, mealName: string, sideName: string) => {
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
// 2026-08-14, later the same day, real, on-device adb logcat evidence
// found this field's real ~15s row-tap freeze traced to an Android
// elevation/stacking conflict specifically with the floating TabHub
// button (see PopoverSelect.tsx's own `elevation` comment) -- the button
// was forced to always draw above other content, the popover wasn't, and
// they geometrically overlap right where this field sat, pinned above
// the footer. Raising the popover's own elevation past the button's
// fixed the worst of it (a confirmed 15s -> under 2s improvement), but a
// second real retest still showed a smaller, real 1-4s delay rather than
// the instant response every other PopoverSelect field in the app has.
// Moved back to the top of the ordinary scrolling column (the field-plus-
// results-both-in-one-column shape this lens originally had, before the
// bottom-pinned redesign described just above) as a real, direct
// diagnostic test -- removes proximity to that button as a variable
// entirely, rather than adding a third theory on top of two already-tried
// ones. Knowingly reintroduces the original one-handed-reach problem that
// motivated pinning it low in the first place (see InsightsScreen's own
// render, this lens' branch) -- an accepted, deliberate tradeoff for the
// duration of this specific test, not a final layout decision either way.
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
  prepGroupTouched,
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
  prepGroupTouched: boolean;
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
      {/* 2026-08-14, moved back up here from a fixed zone pinned near the
          footer/floating TabHub button -- a real, direct diagnostic test,
          not a permanent redesign decision on its own: on-device evidence
          traced the field row's own ~15s row-tap freeze to an Android
          elevation/stacking conflict specifically with that button (see
          PopoverSelect.tsx's own `elevation` comment), and raising the
          popover's elevation past the button's fixed the worst of it -- but
          a real retest still showed a smaller, real ~1-4s delay rather
          than the instant response every OTHER PopoverSelect field in the
          app has. Moving the field back into the ordinary top-of-page flow
          removes proximity to that button as a variable entirely, the most
          direct way to confirm whether it's still playing any role at all.
          If this reads as fully instant here, that's real, added
          confirmation; if the same delay follows the field up here, that's
          real, decisive evidence the elevation fix wasn't the whole story
          and something else is still going on. Bottom padding
          (fieldBottomPadding, now applied to this ScrollView's own content
          instead of a separate fixed zone) still clears the floating
          button for whatever's rendered last -- now the results table,
          the same as every other scrollable lens on this screen. */}
      <ScrollView
        style={styles.rankResultsScroll}
        contentContainerStyle={[styles.rankResultsContent, { paddingBottom: fieldBottomPadding }]}
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
        <View style={[styles.rankFieldRow, styles.rankSpaced]}>
          {mode === 'byNutrient' ? (
            <View style={styles.rankFieldColumn}>
              <Text style={[styles.sectionLabel, { color: tabColor }]}>Nutrient</Text>
              {/* openAbove removed along with the move above -- that
                  positioning only made sense for a field pinned right above
                  the footer with little room below it. Back in the normal
                  top-of-page flow, the default side-anchored positioning
                  (every other PopoverSelect field in the app) is the
                  natural fit again, and removing it also removes one more
                  variable from the diagnostic test this move is part of. */}
              <PopoverSelect
                options={nutrientOptions}
                selected={selected}
                onSelect={onSelect}
                tabColor={tabColor}
                placeholder="Pick a nutrient..."
                onOpenChange={handleNutrientPopoverOpenChange}
              />
            </View>
          ) : null}
          <View style={styles.rankFieldColumn}>
            <Text style={[styles.sectionLabel, { color: tabColor }]}>Prep state</Text>
            <PopoverSelect
              options={prepGroupOptions}
              selected={prepGroup ?? 'all'}
              onSelect={handlePrepGroupSelect}
              tabColor={tabColor}
              placeholder="All prep states"
              minWidth={140}
              onOpenChange={handlePrepStatePopoverOpenChange}
            />
          </View>
        </View>
        {mode === 'byNutrient' ? (
          <Text style={[styles.emptyText, styles.rankSpaced]}>
            {!selected
              ? 'Pick a nutrient, then a prep state, to see foods ranked by how much of it they contain, per 100g.'
              : !prepGroupTouched
                ? 'Now pick a prep state to see foods ranked by how much of this nutrient they contain.'
                : 'Change either field above to see a different ranking.'}
          </Text>
        ) : null}
        {mode === 'byNutrient' ? (
          !selected || !prepGroupTouched ? null : loading ? (
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
  categoriesLoading,
  selected,
  onSelect,
  foods,
  loading,
  tabColor,
  personalizationProfile,
}: {
  categories: string[];
  categoriesLoading: boolean;
  selected: string | null;
  onSelect: (category: string) => void;
  foods: SafeFood[];
  loading: boolean;
  tabColor: string;
  // 2026-08-26 -- names what "safe" actually means here now: every one of
  // the person's own tracked conditions at once, filtered further by their
  // declared diet preference and food allergies (see InsightsScreen's own
  // listSafeFoods call). Nullable only for the brief instant before the
  // profile itself finishes its first, fast load.
  personalizationProfile: PersonalizationProfile | null;
}) {
  const conditionNames = personalizationProfile?.trackedConditions.map((condition) => condition.name) ?? [];
  const scopeDescription =
    conditionNames.length > 0 ? `zero flagged concerns for ${conditionNames.join(', ')}` : 'zero flagged concerns of any kind';
  // See NutrientRankingView's own identical comment.
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: categoryLabel(category), value: category })),
    [categories],
  );

  // 2026-08-14 -- the one-time safe-food computation behind this whole
  // lens genuinely takes up to ~19 real seconds the first time it runs
  // (see InsightsScreen's own comment on why); this message exists so
  // that wait reads as an honest, expected one-time cost rather than a
  // frozen screen, the exact confusion this whole change was built to fix.
  if (categoriesLoading) {
    return (
      <Text style={[styles.emptyText, styles.rankSpaced]}>
        Checking every food against {conditionNames.length > 0 ? conditionNames.join(', ') : 'every scored factor'}, once for this
        session -- this can take a while the first time.
      </Text>
    );
  }

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
        <Text style={[styles.emptyText, styles.rankSpaced]}>Pick a category above to see which of its foods have {scopeDescription}.</Text>
      ) : loading ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>Loading…</Text>
      ) : foods.length === 0 ? (
        <Text style={[styles.emptyText, styles.rankSpaced]}>
          No foods in this category are both fully unflagged and free of a diet-preference or allergy conflict.
        </Text>
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
      showInfoAlert('Almost there', 'Pick a test first.');
      return;
    }
    const value = Number(formValue);
    if (!Number.isFinite(value)) {
      showInfoAlert('Almost there', 'Enter a valid number for the result.');
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
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
      return;
    }
    setSaving(false);
    setFormOpen(false);
    resetForm();
    onSaved();
  }

  return (
    <>
      {infoAlertElement}
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
          <View style={[styles.labFieldLabelRow, styles.rankSpaced]}>
            <Text style={[styles.sectionLabel, { color: tabColor }]}>Lab Name (optional)</Text>
            <VoiceInputButton onResult={setFormLabName} color={tabColor} />
          </View>
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
              style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, opacity: saving ? 0.6 : 1 }]}
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
  personalRuleMatches,
  allPersonalRules,
  onPersonalRuleChanged,
  loading,
  tabColor,
}: {
  treatments: TreatmentRecord[];
  warnings: InteractionWarning[];
  referenceOnly: ReferenceOnlyRule[];
  personalRuleMatches: PersonalRule[];
  allPersonalRules: PersonalRule[];
  onPersonalRuleChanged: () => void;
  loading: boolean;
  tabColor: string;
}) {
  // Personal-rule half of this lens, 2026-08-18. All hooks declared
  // unconditionally, before the loading early-return below -- this view
  // used to have none, so that early return sat first with nothing to
  // violate; it can't stay first now that real state/handlers exist here.
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirm, confirmElement] = useConfirmSheet();
  const [formOpen, setFormOpen] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [formSource, setFormSource] = useState<'self' | 'doctor'>('self');
  const [formLinkType, setFormLinkType] = useState<'none' | 'food' | 'treatment'>('none');
  const [formFoodKeyword, setFormFoodKeyword] = useState('');
  const [formTreatmentId, setFormTreatmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const treatmentOptions = useMemo(
    () => treatments.map((treatment) => ({ label: treatment.name, value: treatment.id })),
    [treatments],
  );
  const treatmentById = useMemo(() => new Map(treatments.map((treatment) => [treatment.id, treatment])), [treatments]);

  function resetRuleForm() {
    setFormDescription('');
    setFormSource('self');
    setFormLinkType('none');
    setFormFoodKeyword('');
    setFormTreatmentId(null);
  }

  async function handleSaveRule() {
    const description = formDescription.trim();
    if (!description) {
      showInfoAlert('Almost there', 'Describe the rule before saving it.');
      return;
    }
    if (formLinkType === 'food' && !formFoodKeyword.trim()) {
      showInfoAlert('Almost there', 'Type the food or ingredient to watch for.');
      return;
    }
    if (formLinkType === 'treatment' && !formTreatmentId) {
      showInfoAlert('Almost there', 'Pick which medication or supplement this is about.');
      return;
    }
    setSaving(true);
    try {
      await createPersonalRule({
        description,
        source: formSource,
        linkType: formLinkType,
        linkValue: formLinkType === 'food' ? formFoodKeyword : formLinkType === 'treatment' ? formTreatmentId : null,
        linkLabel:
          formLinkType === 'food'
            ? formFoodKeyword.trim()
            : formLinkType === 'treatment'
              ? (treatmentById.get(formTreatmentId ?? '')?.name ?? null)
              : null,
      });
    } catch (error) {
      setSaving(false);
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
      return;
    }
    setSaving(false);
    setFormOpen(false);
    resetRuleForm();
    onPersonalRuleChanged();
  }

  async function handleToggleRule(rule: PersonalRule) {
    await setPersonalRuleActive(rule.id, !rule.active);
    onPersonalRuleChanged();
  }

  async function handleDeleteRule(rule: PersonalRule) {
    const ok = await confirm({
      title: 'Delete this rule?',
      message: `"${rule.description}" will be removed for good.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deletePersonalRule(rule.id);
    onPersonalRuleChanged();
  }

  if (loading) {
    return (
      <>
        {infoAlertElement}
        {confirmElement}
        <Text style={styles.emptyText}>Loading…</Text>
      </>
    );
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
      {infoAlertElement}
      {confirmElement}

      {warnings.length > 0 ? (
        <View style={styles.rankSpaced}>
          <Text style={[styles.rankGroupHeading, { color: tabColor }]}>Things to check</Text>
          {warnings.map((warning, index) => (
            <View key={`${warning.ruleId}_${index}`} style={[styles.formCard, styles.rankSpaced, { borderColor: tabColor }]}>
              <Text style={[styles.rankFoodName, { color: tabColor }]}>{warning.title}</Text>
              <Text style={styles.myMedsMessage}>{warning.message}</Text>
              <Text style={styles.myMedsCitation}>{warning.citation}</Text>
              <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
            </View>
          ))}
        </View>
      ) : null}

      {personalRuleMatches.length > 0 ? (
        <View style={styles.rankSpaced}>
          <Text style={[styles.rankGroupHeading, { color: colors.accent }]}>Your Own Rules</Text>
          {/* Compact rows, not full description cards -- 2026-08-18, direct
              correction: full paragraphs and citations belong in Purple
              Digest, tool screens like this one show compact data and only
              reach the fuller text on tap. Same real "pop up when they want
              it to pop up" shape the alcohol/coffee/juice/raw-meat advisory
              rows already established in the Food builders (see the
              feedback_digest_owns_full_content memory). */}
          <View style={styles.table}>
            {personalRuleMatches.map((rule) => (
              <TouchableOpacity
                key={rule.id}
                style={styles.rankRow}
                onPress={() => showInfoAlert(rule.source === 'doctor' ? 'Your doctor told you this' : 'You noted this', rule.description)}
              >
                <View style={styles.rankTextWrap}>
                  <Text style={styles.rankFoodName} numberOfLines={1}>
                    {rule.description}
                  </Text>
                  <Text style={styles.rankFoodCategory}>
                    {rule.source === 'doctor' ? 'Your doctor told you this' : 'You noted this'} · tap for details
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
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
              <WhyExplainer title={rule.title} mechanism={rule.mechanism} onPress={showInfoAlert} />
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

      <View style={styles.rankSpaced}>
        <Text style={[styles.rankGroupHeading, { color: tabColor }]}>Manage Your Rules</Text>
        {allPersonalRules.length === 0 && !formOpen ? (
          <Text style={styles.emptyText}>
            Nothing saved yet. Add something you&apos;ve noticed yourself, or a specific instruction your own doctor gave you.
          </Text>
        ) : (
          <View style={styles.table}>
            {allPersonalRules.map((rule) => {
              const linkSummary =
                rule.linkType === 'food'
                  ? `watches for ${rule.linkLabel}`
                  : rule.linkType === 'treatment'
                    ? `tied to ${rule.linkLabel ?? 'a removed treatment'}`
                    : null;
              return (
                <View key={rule.id} style={[styles.rankRow, { opacity: rule.active ? 1 : 0.55 }]}>
                  <TouchableOpacity
                    style={styles.rankTextWrap}
                    onPress={() =>
                      showInfoAlert(
                        rule.source === 'doctor' ? 'Your doctor told you this' : 'You noted this',
                        linkSummary ? `${rule.description}\n\n${linkSummary}` : rule.description,
                      )
                    }
                  >
                    <Text style={styles.rankFoodName} numberOfLines={1}>
                      {rule.description}
                    </Text>
                    <Text style={styles.rankFoodCategory} numberOfLines={1}>
                      {rule.active ? '' : 'Paused · '}
                      {rule.source === 'doctor' ? 'Your doctor told you this' : 'You noted this'}
                      {linkSummary ? ` · ${linkSummary}` : ''}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rankActionButton} onPress={() => handleToggleRule(rule)}>
                    <Text style={[styles.rankActionText, { color: tabColor }]}>{rule.active ? 'Pause' : 'Resume'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rankActionButton} onPress={() => handleDeleteRule(rule)}>
                    <Text style={[styles.rankActionText, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {formOpen ? (
          <View style={[styles.formCard, styles.rankSpaced, { borderColor: tabColor }]}>
            <View style={styles.labFieldLabelRow}>
              <Text style={[styles.sectionLabel, { color: tabColor }]}>What did you notice, or what were you told?</Text>
              <VoiceInputButton onResult={setFormDescription} color={tabColor} />
            </View>
            <AppTextInput
              style={[styles.labInput, { minHeight: 72, textAlignVertical: 'top' }]}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="e.g. Dairy seems to bring on joint pain about half a day later"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Text style={[styles.sectionLabel, styles.rankSpaced, { color: tabColor }]}>Where did this come from?</Text>
            <View style={styles.pillWrap}>
              {(['self', 'doctor'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.stagePill, { borderColor: tabColor, backgroundColor: formSource === option ? tabColor : 'transparent' }]}
                  onPress={() => setFormSource(option)}
                >
                  <Text style={[styles.stagePillText, formSource === option ? styles.stagePillTextActive : { color: tabColor }]}>
                    {option === 'doctor' ? 'My doctor told me' : 'Something I noticed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, styles.rankSpaced, { color: tabColor }]}>Tie this to something specific? (optional)</Text>
            <View style={styles.pillWrap}>
              {(['none', 'food', 'treatment'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.stagePill, { borderColor: tabColor, backgroundColor: formLinkType === option ? tabColor : 'transparent' }]}
                  onPress={() => setFormLinkType(option)}
                >
                  <Text style={[styles.stagePillText, formLinkType === option ? styles.stagePillTextActive : { color: tabColor }]}>
                    {option === 'none' ? 'Nothing specific' : option === 'food' ? 'A food' : 'A medication'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formLinkType === 'food' ? (
              <>
                <View style={[styles.labFieldLabelRow, styles.rankSpaced]}>
                  <Text style={[styles.sectionLabel, { color: tabColor }]}>What food or ingredient?</Text>
                  <VoiceInputButton onResult={setFormFoodKeyword} color={tabColor} />
                </View>
                <AppTextInput
                  style={styles.labInput}
                  value={formFoodKeyword}
                  onChangeText={setFormFoodKeyword}
                  placeholder="e.g. dairy"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.myMedsCitation, styles.rankSpaced]}>Shown whenever something you&apos;ve logged today contains this word.</Text>
              </>
            ) : null}

            {formLinkType === 'treatment' ? (
              <>
                <Text style={[styles.sectionLabel, styles.rankSpaced, { color: tabColor }]}>Which one?</Text>
                <PopoverSelect
                  options={treatmentOptions}
                  selected={formTreatmentId}
                  onSelect={setFormTreatmentId}
                  tabColor={tabColor}
                  searchable
                  placeholder="Pick a medication or supplement..."
                  minWidth={220}
                />
                <Text style={[styles.myMedsCitation, styles.rankSpaced]}>Shown only while this is marked active.</Text>
              </>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => {
                  setFormOpen(false);
                  resetRuleForm();
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor, flex: 1, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSaveRule}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save Rule'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.secondaryButton, styles.rankSpaced, { borderWidth: 1, borderColor: tabColor }]}
            onPress={() => setFormOpen(true)}
          >
            <Text style={[styles.secondaryButtonText, { color: tabColor }]}>+ Add a Rule of Your Own</Text>
          </TouchableOpacity>
        )}
      </View>
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

    ...textShadow,

  },
  errorText: {
    ...typography.body,
    color: colors.danger,

    ...textShadow,

  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 10,

    ...textShadow,

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

    ...textShadow,

  },
  // Same structural-label language as the table headers below (eyebrow) --
  // both are "this is scaffolding, not content" text, so they should look
  // like the same tier of thing. Color is TAB_COLOR, not colors.primary,
  // matching CardLabel's own eyebrow-tier label on Home -- 2026-07-27.
  sectionLabel: {
    ...typography.eyebrow,
    color: TAB_COLOR,
    marginBottom: 8,

    ...textShadow,

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
  // One block per tracked condition, 2026-08-26 -- SixDsView's own real
  // per-condition sections, stacked top to bottom with the same 18px this
  // screen already uses to separate one distinct piece of content from
  // its neighbor.
  conditionScoreSection: {
    marginBottom: 18,
  },
  conditionScoreHeading: {
    ...typography.bodyEmphasis,
    color: TAB_COLOR,
    marginBottom: 4,

    ...textShadow,

  },
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

    ...textShadow,

  },
  tableHeaderCell: {
    ...typography.eyebrow,
    color: TAB_COLOR,

    ...textShadow,

  },
  tableCellNutrient: {
    flex: 2,
  },
  // Signals a nutrient row is tappable to reveal which foods produced it --
  // the same dotted-underline idiom subTableValue already uses for exactly
  // this "tap for detail" meaning in the Condition Scores lens below.
  tableCellNutrientTappable: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  tableCellAmount: {
    flex: 2,
  },
  tableCellStatus: {
    flex: 2,
    textAlign: 'right',
    fontWeight: '400',
  },
  // Bumped up to `label` size -- the dimension name is the primary thing
  // being scanned in this row, so it should read a size larger than the
  // supporting "N flagged" status text next to it, not the same size.
  tableCellDimension: {
    ...typography.label,
    flex: 3,
    color: TAB_COLOR,

    ...textShadow,

  },
  // A real green/yellow/red traffic light -- green is a deliberate,
  // visible color here (not just "recede to neutral"), so all three
  // states are equally legible at a glance. See severityTextStyle/
  // severityRowStyle above.
  statusGreenText: {
    color: colors.primary,
    fontWeight: '400',
  },
  statusYellowText: {
    color: colors.statusYellow,
    fontWeight: '400',
  },
  statusRedText: {
    color: colors.danger,
    fontWeight: '400',
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

    ...textShadow,

  },
  subTableValue: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',

    ...textShadow,

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

    ...textShadow,

  },
  // Base color here never actually shows -- always rendered with
  // severityTextStyle(...) layered on top (see PrepView/SixDsView's own
  // render) -- left as a plain neutral rather than TAB_COLOR so it's not
  // misleadingly implied to matter.
  detailFoodTier: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,

    ...textShadow,

  },
  detailText: {
    ...typography.caption,
    color: TAB_COLOR,
    lineHeight: 17,
    marginTop: 4,

    ...textShadow,

  },
  detailSourcesLabel: {
    ...typography.eyebrow,
    color: TAB_COLOR,
    marginTop: 6,

    ...textShadow,

  },
  detailSourcesText: {
    ...typography.caption,
    color: TAB_COLOR,
    lineHeight: 15,
    fontStyle: 'italic',

    ...textShadow,

  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  // Positioning + drop shadow only now -- the actual circle fill (TAB_COLOR)
  // and its iridescent ring both come from IridescentRingCircle itself,
  // rendered as this button's own child. borderRadius is kept here anyway
  // so Android's elevation shadow still traces a round outline rather than
  // a square one, even though nothing visible is being clipped by it.
  scopeButton: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
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

    ...textShadow,

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

    ...textShadow,

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

    ...textShadow,

  },
  breadcrumbText: {
    ...typography.captionEmphasis,
    color: colors.primary,

    ...textShadow,

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

    ...textShadow,

  },
  tipCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
  },
  tipCardTitle: {
    ...typography.label,
    color: TAB_COLOR,

    ...textShadow,

  },
  tipEntry: {
    marginTop: 6,
  },
  tipText: {
    ...typography.body,
    color: TAB_COLOR,
    lineHeight: 18,

    ...textShadow,

  },
  // Nutrient Ranking lens, 2026-08-08. 2026-08-14 -- the fields (Nutrient/
  // Prep state) used to live in a separate fixed zone pinned above the
  // floating TabHub button; moved back into this same ordinary scrolling
  // column, at the top, as a real diagnostic test for that button's own
  // Android elevation conflict with an open popover (see PopoverSelect.tsx's
  // own `elevation` comment, and NutrientRankingView's own header comment
  // for the full reasoning). One plain scrolling column now, the same shape
  // every other lens on this screen already uses -- its own paddingBottom
  // (fieldBottomPadding, insets-dependent) still clears the floating button
  // for whatever renders last, now the results table.
  rankLayout: { flex: 1 },
  rankResultsScroll: { flex: 1 },
  rankResultsContent: { paddingTop: 6, paddingBottom: 16 },
  rankSpaced: { marginTop: 14 },
  rankGroupHeading: { ...typography.eyebrow, marginBottom: 8,

    ...textShadow,

  },
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

    ...textShadow,

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
  rankFoodName: { ...typography.bodyEmphasis, color: colors.textPrimary,

    ...textShadow,

  },
  rankFoodCategory: { ...typography.caption, color: colors.textSecondary, marginTop: 1,

    ...textShadow,

  },
  rankAmount: { ...typography.captionEmphasis, color: TAB_COLOR,

    ...textShadow,

  },
  // Nutrient Ranking's own "By Food" mode, 2026-08-14 -- the amount and,
  // when a real DRI exists for that nutrient, a %DV line right under it,
  // both right-aligned as one column rather than two separately-placed
  // Texts.
  rankAmountWrap: { alignItems: 'flex-end' },
  rankDriPercent: { ...typography.caption, color: colors.textSecondary, marginTop: 1,

    ...textShadow,

  },
  // Nutrient/Prep state side by side, 2026-08-14 -- see this lens' own
  // fixed-field-zone comment above for the full reasoning. flexShrink on
  // the column is a real, defensive guard against either field's own
  // content overflowing the row's width on a narrow screen, not just
  // decoration.
  rankFieldRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rankFieldColumn: { flexShrink: 1 },
  // 2026-08-16 -- wraps the Labs entry form's own "Lab Name" label with a
  // real mic button beside it, same shape SideBuilder.tsx's own Name-field
  // row already established.
  labFieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Nutrient Ranking's own "By Food" mode, 2026-08-14 -- the picked food's
  // own name/category, plus the "Change food" action, sitting above its
  // real per-nutrient ranking list.
  rankFoodSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rankFoodSummaryText: { ...typography.bodyEmphasis, color: colors.textPrimary, flexShrink: 1,

    ...textShadow,

  },
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
  cookingMethodLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, flexShrink: 1,

    ...textShadow,

  },
  cookingConfidenceBadge: { ...typography.caption, fontSize: 11,

    ...textShadow,

  },
  cookingMethodSummary: { ...typography.caption, color: colors.textSecondary, lineHeight: 16,

    ...textShadow,

  },
  cookingCitation: { ...typography.caption, color: colors.textMuted, fontSize: 11,

    ...textShadow,

  },
  // Healing Stage lens, 2026-08-08.
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stagePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stagePillText: { ...typography.captionEmphasis,

    ...textShadow,

  },
  stagePillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
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
  hydrationStatus: { ...typography.bodyEmphasis, marginTop: 12,

    ...textShadow,

  },
  hydrationNote: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,

    ...textShadow,

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
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis,

    ...textShadow,

  },
  labInput: {
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
  labDateRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  // My Meds & Interactions lens, 2026-08-08.
  myMedsMessage: { ...typography.body, color: colors.textPrimary, marginTop: 6,

    ...textShadow,

  },
  myMedsCitation: { ...typography.caption, color: colors.textMuted, marginTop: 6,

    ...textShadow,

  },
  // Personal rules, 2026-08-18 -- a small, deliberately plain tag naming
  // where a rule came from, on every rule card in both the "Your Own
  // Rules" and "Manage Your Rules" sections, so it's never mistaken for
  // one of the cited warnings sitting right above it.
  // Compact row-action text, 2026-08-18 -- Your Own Rules/Manage Your
  // Rules both moved from full description cards to plain rankRow-shaped
  // rows (matching the treatments list right below them on this same
  // lens); these two are the small Pause/Resume/Delete touch targets that
  // sit at a row's trailing end now instead of a full-width button row.
  rankActionButton: { paddingVertical: 4, paddingHorizontal: 6 },
  rankActionText: { ...typography.captionEmphasis,

    ...textShadow,

  },
  // Today's Advisories lens, 2026-08-08.
  advisoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  advisoryTitle: { flex: 1 },
  // Energy & Portions lens, 2026-08-15.
  portionsSectionHeading: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 18, marginBottom: 8,

    ...textShadow,

  },
  statRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingVertical: 12,
  },
  statValue: { ...typography.sectionTitle, color: colors.textPrimary,

    ...textShadow,

  },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 4,

    ...textShadow,

  },
  portionsPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portionsPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  portionsPillText: { ...typography.bodyEmphasis, color: colors.textPrimary,

    ...textShadow,

  },
  portionsPillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
});
