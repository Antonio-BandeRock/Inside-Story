import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getDailyNutrientBreakdown,
  getDailySixDimensionsBreakdown,
  type DailyDimensionScore,
  type DailyNutrientBreakdown,
  type DailyNutrientScopeTotals,
  type DailySixDimensionsBreakdown,
} from '../../lib/db';
import { analyzeNutrientIntake, formatAmount, nutrientStatusSeverity, type StatusSeverity } from '../../lib/nutrientAnalysis';
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
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { FoodLookup } from '../../components/FoodLookup';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
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

type Lens = 'nutrients' | 'sixDs' | 'prep' | 'foodLookup';

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
        body: 'Once you drill into a specific meal, side, or ingredient, the judgment coloring disappears -- a single food is not "deficient" in a vitamin just for not being your whole day\'s supply of it. Instead each row shows what percent of today\'s target that one item contributed, sorted highest-contributor first.',
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
        body: 'Summarizes each of six research-backed factors -- micronutrient density, inflammatory potential, lipid compatibility, hormonal/thyroid support, digestive tolerance, and oxalate load -- for whatever scope is selected. "Clear" means nothing in that scope was flagged for that dimension; a number means that many sub-criteria were. Tap a dimension to see its sub-criteria, then tap a sub-criterion to see the tier it was rated and the citation behind that rating.',
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
        body: 'Surfaces ingredients in today\'s meals that genuinely change outcome based on how they are prepared -- e.g. cooking cruciferous vegetables rather than eating them raw, or soaking legumes before cooking -- each with the citation it is based on. At the whole-day/meal level, only items that actually need attention are shown; drilled into one side or ingredient, everything shows, including a plain "nothing specific" answer.',
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
        body: "Look up any food in this app's own reference database -- pick a category, then (if that category has one) a more specific type, then the food itself -- to see its full nutrient, vitamin, and mineral breakdown per 100g. This is the same reference data every logged meal is scored against; it isn't tied to today's log or any drill-down scope, unlike the other three lenses here.",
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
    body: 'Nutrients, 6 Dimensions, and Cooking & Prep -- tap the button to the left of the main navigation button, bottom of the screen -- are three different views over the same set of meals you logged today. Switching views does not reload anything, it just changes how the same data is presented.',
  },
  {
    heading: 'Nutrients: reading the table',
    body: 'Each row compares one nutrient to your daily target. At "Whole Day" scope, rows are judged and colored: a flagged (colored) row is short of target, over a safe upper limit, or otherwise worth a look; an unflagged row is quietly fine and stays neutral on purpose, so color only ever draws your eye to what actually needs it.',
  },
  {
    heading: 'Nutrients: drilling into a meal or ingredient',
    body: 'Once you drill into a specific meal, side, or ingredient, the judgment coloring disappears -- a single food is not "deficient" in a vitamin just for not being your whole day\'s supply of it. Instead each row shows what percent of today\'s target that one item contributed, sorted highest-contributor first.',
  },
  {
    heading: '6 Dimensions',
    body: 'The 6 Dimensions scorecard summarizes each of six research-backed factors -- micronutrient density, inflammatory potential, lipid compatibility, hormonal/thyroid support, digestive tolerance, and oxalate load -- for whatever scope is selected. "Clear" means nothing in that scope was flagged for that dimension; a number means that many sub-criteria were. Tap a dimension to see its sub-criteria, then tap a sub-criterion to see the tier it was rated and the citation behind that rating.',
  },
  {
    heading: 'Cooking & Prep',
    body: 'Surfaces ingredients in today\'s meals that genuinely change outcome based on how they are prepared -- e.g. cooking cruciferous vegetables rather than eating them raw, or soaking legumes before cooking -- each with the citation it is based on. At the whole-day/meal level, only items that actually need attention are shown; drilled into one side or ingredient, everything shows, including a plain "nothing specific" answer.',
  },
  {
    heading: 'Drilling down',
    body: 'The third floating button, to the left of the view picker, opens the same navigator every lens shares: Whole Day -> a specific meal -> a side within it -> a single ingredient. Tap any crumb to jump straight back to that level, or tap one of the pills below it to go one level deeper -- it stays open the whole way down, showing the next level immediately, so you can keep drilling without re-opening it. Tap the ✕ or outside it to close.',
  },
];

export default function InsightsScreen() {
  useRegisterScreenHelp('Insights', INSIGHTS_HELP_SECTIONS, '/insights');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
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
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.body}
              contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}
            >
              {loading ? (
              <Text style={styles.emptyText}>Loading…</Text>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : lens === 'nutrients' ? (
              !nutrientBreakdown || nutrientBreakdown.meals.length === 0 ? (
                <Text style={styles.emptyText}>Save a meal to see this.</Text>
              ) : (
                <NutrientsTable breakdown={nutrientBreakdown} scope={scope} />
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
      {!revealed || lens === 'foodLookup'
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
            ? 'Nothing to compare yet -- once foods with nutrient data are logged today, targets will show up here.'
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
          counted here -- usually a solid food measured by volume, or logged as &quot;each&quot; for a food without a known
          per-item weight yet. Log it by weight (g/oz) to have it count.
        </Text>
      ) : null}

      {isDayScope && breakdown.supplementSkipped.length > 0 ? (
        <Text style={styles.footerNote}>
          {breakdown.supplementSkipped.length} supplement ingredient{breakdown.supplementSkipped.length === 1 ? '' : 's'} couldn&apos;t
          be counted here -- usually an IU dose for a nutrient with no single official IU-to-mass conversion (e.g.
          vitamin E), or a unit this app doesn&apos;t recognize yet. Check that supplement&apos;s ingredients on the Schedule
          tab&apos;s Supplements lens.
        </Text>
      ) : null}
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
      label: `${capitalize(meal.mealType)} -- ${meal.mealName}`,
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
                            <Text style={styles.detailSourcesText}>{getSubCriterionSources(item.subCriterion)}</Text>
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
  if (scopeLevel === 'day') return `${row.foodName} -- ${row.mealName}, ${row.sideName}`;
  if (scopeLevel === 'meal') return `${row.foodName} -- ${row.sideName}`;
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
                    <Text style={styles.detailSourcesText}>{getSubCriterionSources(tip.subCriterion)}</Text>
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
});
