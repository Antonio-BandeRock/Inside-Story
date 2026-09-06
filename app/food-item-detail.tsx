import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NutrientsTable, PrepView, SixDsView, type Scope } from './(tabs)/insights';
import type { ResolvedFoodSelection } from '../components/FoodLookup';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { useInfoAlert } from '../components/InfoAlert';
import { formatGroceryAmount } from '../lib/groceryList';
import { addGroceryListItem, getActiveGroceryList, loadKitchenStock, stockIdKey, stockPairKey } from '../lib/groceryDb';
import { applyMakePlan } from '../lib/kitchenDb';
import { buildMakePlan, shortfallsFrom, type MakeIngredient, type MakePlan } from '../lib/kitchenUsage';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  getBakedGoods,
  getBakedGoodsIngredients,
  getBakedGoodsNutrientBreakdown,
  getBakedGoodsSixDimensionsBreakdown,
  getBeverage,
  getBeverageIngredients,
  getBeverageNutrientBreakdown,
  getBeverageSixDimensionsBreakdown,
  getFermentation,
  getFermentationIngredients,
  getFermentationNutrientBreakdown,
  getFermentationSixDimensionsBreakdown,
  getFoodIdentity,
  getFoodScores,
  getFoodTrialHistory,
  getSalad,
  getSaladIngredients,
  getSaladNutrientBreakdown,
  getSaladSixDimensionsBreakdown,
  getSide,
  getSideIngredients,
  getSideNutrientBreakdown,
  getSideSixDimensionsBreakdown,
  getSmoothie,
  getSmoothieIngredients,
  getSmoothieNutrientBreakdown,
  getSmoothieSixDimensionsBreakdown,
  getSnack,
  getSnackIngredients,
  getSnackNutrientBreakdown,
  getSnackSixDimensionsBreakdown,
  getSauce,
  getSauceIngredients,
  getSauceNutrientBreakdown,
  getSauceSixDimensionsBreakdown,
  getHandheld,
  getHandheldIngredients,
  getHandheldNutrientBreakdown,
  getHandheldSixDimensionsBreakdown,
  getDessert,
  getDessertIngredients,
  getDessertNutrientBreakdown,
  getDessertSixDimensionsBreakdown,
  getSoup,
  getSoupIngredients,
  getSoupNutrientBreakdown,
  getSoupSixDimensionsBreakdown,
  reopenFoodTrial,
  type DailyNutrientBreakdown,
  type DailySixDimensionsBreakdown,
  type FoodTrialRecord,
  type SideDetail,
  type SideIngredientDetail,
} from '../lib/db';
import { getPersonalizationProfile, type PersonalizationProfile } from '../lib/foodPersonalization';
import { isFlaggedTier } from '../lib/sixDimensionsReference';

// Step 2 of "save a Side, then actually be able to see it" (step 1:
// app/food-items.tsx's own list screen) -- reuses Insights' own
// NutrientsTable/SixDsView/PrepView verbatim (see app/(tabs)/insights.tsx's
// own export comments) rather than building a parallel viewer, per an
// explicit request. Those three components only ever needed a
// DailyNutrientBreakdown/DailySixDimensionsBreakdown + a Scope to render
// correctly regardless of whether the data underneath is really "today"
// or, as here, a single saved side -- see lib/db.ts's own
// getSideNutrientBreakdown/getSideSixDimensionsBreakdown for how a side is
// shaped to fit that same structure (one synthetic meal wrapping one
// synthetic side, both real).
//
// Deliberately NOT reusing Insights' own ScopeHub/scopeBreadcrumbs, though
// -- those assume a genuine 4-level Whole Day -> Meal -> Side -> Item
// hierarchy with a real CHOICE at every level. A single saved side only
// ever has 2 meaningful levels (the side itself, and its ingredients), so
// this screen's own drill-down is a plain toggle between "whole side" (a
// Scope at 'meal' level -- see WHOLE_SIDE_SCOPE below for why 'meal', not
// 'day') and one ingredient (a Scope at 'item' level), not a copy of the
// heavier 4-level navigator.
//
// Same "one shared screen, itemType decides the data source" shape as
// food-items.tsx -- this grows by one case in loadSide's own switch as
// each builder gets a real save path, not a new screen per builder.

type DetailLens = 'ingredients' | 'nutrients' | 'sixDs' | 'prep';

const DETAIL_LENSES: { key: DetailLens; label: string }[] = [
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'nutrients', label: 'Nutrients' },
  { key: 'sixDs', label: 'Condition Scores' },
  { key: 'prep', label: 'Cooking & Prep' },
];

// The plan in plain words, so someone can see exactly what is about to happen
// before it happens. Deliberately leads with what will be TAKEN, since that is
// the destructive half and the part worth reading.
function describeMakePlan(plan: MakePlan, servings: number): string {
  const taking = plan.lines.filter((line) => line.draws.length > 0);
  const short = plan.lines.filter((line) => line.status !== 'full');
  const parts: string[] = [];
  parts.push(
    taking.length === 0
      ? 'Nothing in your kitchen matches this, so nothing comes out.'
      : `Comes out of your kitchen: ${taking
          .map((line) => `${line.foodName} ${formatGroceryAmount(line.covered, line.unit)}`)
          .join(', ')}.`,
  );
  if (short.length > 0) {
    parts.push(
      `Not covered: ${short
        .map((line) => `${line.foodName} ${formatGroceryAmount(Math.max(0, line.needed - line.covered), line.unit)}`)
        .join(', ')}. Those are left alone.`,
    );
  }
  parts.push(`Goes in: ${servings} serving${servings === 1 ? '' : 's'}.`);
  return parts.join('\n\n');
}

// One place that builds a plan, so the readout and the action can never
// disagree about what the kitchen holds.
async function planForIngredients(ingredients: MakeIngredient[]): Promise<MakePlan> {
  const stock = await loadKitchenStock();
  return buildMakePlan(ingredients, (ingredient: MakeIngredient) =>
    stock.get(stockIdKey(ingredient.foodId) ?? ' ') ??
    stock.get(stockPairKey(ingredient.category ?? '', ingredient.foodName)) ??
    stock.get(ingredient.foodName.trim().toLowerCase()),
  );
}

export default function FoodItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const { itemType, id, title } = useLocalSearchParams<{ itemType: string; id: string; title: string }>();

  const [lens, setLens] = useState<DetailLens>('ingredients');
  const [side, setSide] = useState<SideDetail | null>(null);
  const [making, setMaking] = useState(false);
  // Whether the kitchen can cover this, worked out as the dish loads rather
  // than on request. The point of the question is to answer it BEFORE anyone
  // commits to cooking, so making them ask first would be most of the way to
  // not having it at all.
  const [stockPlan, setStockPlan] = useState<MakePlan | null>(null);
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [ingredients, setIngredients] = useState<SideIngredientDetail[]>([]);
  const [nutrientBreakdown, setNutrientBreakdown] = useState<DailyNutrientBreakdown | null>(null);
  const [dimensionsBreakdown, setDimensionsBreakdown] = useState<DailySixDimensionsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  // 2026-08-26, phase 3 of the Condition Scores rebuild -- see
  // app/(tabs)/insights.tsx's own identical state for the full reasoning.
  // This screen reuses that same shared SixDsView, so it needs the same
  // real tracked-conditions list to hand it, not a second, separate
  // condition picker.
  const [personalizationProfile, setPersonalizationProfile] = useState<PersonalizationProfile | null>(null);
  useEffect(() => {
    getPersonalizationProfile().then(setPersonalizationProfile);
  }, []);

  // Nothing to plan against until the ingredients are in. A failure here
  // leaves the readout absent rather than claiming a full cupboard.
  useEffect(() => {
    if (ingredients.length === 0) {
      setStockPlan(null);
      return;
    }
    void planForIngredients(ingredients).then(setStockPlan).catch(() => setStockPlan(null));
  }, [ingredients]);

  // Which ingredient (by index into the BREAKDOWN's own item list, not
  // `ingredients` above -- see this file's own top comment on why those
  // two lists aren't guaranteed to line up index-for-index) the Nutrients/
  // Condition Scores/Cooking & Prep lenses are currently drilled into. null =
  // viewing the whole side.
  const [drilledItemIndex, setDrilledItemIndex] = useState<number | null>(null);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [expandedTierKey, setExpandedTierKey] = useState<string | null>(null);

  // The Favorites/Saved-item round-trip, 2026-08-14 -- direct request: "if
  // it gets into the Favorites because of testing, it can again be put
  // back to testing." Real, per-ingredient status keyed by the ingredient's
  // own row id (SideIngredientDetail.id), computed once ingredients load.
  // Reuses the exact same flagged signal every Food builder's own "Worth
  // testing?" button already checks (getFoodScores + isFlaggedTier -- a
  // general, condition-agnostic check across every scored sub-criterion,
  // not narrowed to the person's own tracked conditions, matching the
  // builders exactly so "flagged" means the same thing everywhere).
  const [ingredientTrialInfo, setIngredientTrialInfo] = useState<
    Record<string, { flagged: boolean; latestTrial: FoodTrialRecord | null; identity: ResolvedFoodSelection | null }>
  >({});

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    loadSide(itemType, id, personalizationProfile?.trackedConditions ?? []).then((loaded) => {
      if (!isCurrent) return;
      setSide(loaded.side);
      setIngredients(loaded.ingredients);
      setNutrientBreakdown(loaded.nutrientBreakdown);
      setDimensionsBreakdown(loaded.dimensionsBreakdown);
      setLoading(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [itemType, id, personalizationProfile]);

  useEffect(() => {
    let isCurrent = true;
    const realIngredients = ingredients.filter((ingredient) => ingredient.foodId);
    if (realIngredients.length === 0) {
      setIngredientTrialInfo({});
      return;
    }
    Promise.all(
      realIngredients.map(async (ingredient) => {
        const [foodIdStr, source] = ingredient.foodId!.split('|');
        const foodId = Number(foodIdStr);
        const [scores, trials, identity] = await Promise.all([
          getFoodScores(foodId, source),
          getFoodTrialHistory(foodId, source),
          getFoodIdentity(foodId, source),
        ]);
        const flagged = scores.some((score) => isFlaggedTier(score.tier));
        return {
          rowId: ingredient.id,
          flagged,
          latestTrial: trials[0] ?? null,
          identity: identity ? { ...identity, foodId, source } : null,
        };
      }),
    ).then((results) => {
      if (!isCurrent) return;
      const next: Record<string, { flagged: boolean; latestTrial: FoodTrialRecord | null; identity: ResolvedFoodSelection | null }> = {};
      results.forEach((entry) => {
        next[entry.rowId] = { flagged: entry.flagged, latestTrial: entry.latestTrial, identity: entry.identity };
      });
      setIngredientTrialInfo(next);
    });
    return () => {
      isCurrent = false;
    };
  }, [ingredients]);

  async function handleReopenIngredientTrial(trialId: string, rowId: string) {
    await reopenFoodTrial(trialId);
    const info = ingredientTrialInfo[rowId];
    if (!info) return;
    const ingredient = ingredients.find((row) => row.id === rowId);
    if (!ingredient?.foodId) return;
    const [foodIdStr, source] = ingredient.foodId.split('|');
    const trials = await getFoodTrialHistory(Number(foodIdStr), source);
    setIngredientTrialInfo((current) => ({
      ...current,
      [rowId]: { ...info, latestTrial: trials[0] ?? null },
    }));
  }

  function handleWorthTesting(identity: ResolvedFoodSelection) {
    router.push({
      pathname: '/log',
      params: {
        trialFoodId: identity.foodId,
        trialSource: identity.source,
        trialBaseName: identity.baseName,
        trialCategory: identity.category,
        trialSubcategory: identity.subcategory ?? '',
        trialPrepMethod: identity.prepMethod ?? '',
      },
    });
  }

  function changeLens(next: DetailLens) {
    setLens(next);
    setDrilledItemIndex(null);
    setExpandedDimension(null);
    setExpandedTierKey(null);
  }

  // 'meal', not 'day', for the whole-side view -- see NutrientsTable's own
  // isDayScope check: 'day' scope shows the judged/colored "Deficient/
  // Adequate/Excess" framing, which asks "does this cover a whole day's
  // needs," a real category error for a single dish that was never meant
  // to BE a whole day's food. 'meal' scope already gives exactly the right
  // framing instead ("what % of today's target would this contribute"),
  // with no changes needed to NutrientsTable/SixDsView/PrepView at all.
  const scope: Scope = drilledItemIndex === null ? { level: 'meal', mealIndex: 0 } : { level: 'item', mealIndex: 0, sideIndex: 0, itemIndex: drilledItemIndex };

  const nutrientItems = nutrientBreakdown?.meals[0]?.sides[0]?.items ?? [];
  const dimensionItems = dimensionsBreakdown?.meals[0]?.sides[0]?.items ?? [];
  // Whichever of the two the current lens actually needs -- both lists
  // should always agree on length/order (both are built from the exact
  // same resolved-ingredient pass in lib/db.ts), this just picks the right
  // one to read a name from for the drilled-in ingredient's own heading.
  const drillNames = lens === 'nutrients' ? nutrientItems.map((item) => item.foodName) : dimensionItems.map((item) => item.foodName);

  return (
    <View style={styles.wrapper}>
      {/* headerLeft: () => null, 2026-08-02 -- explicitly requested: the
          native stack header was still drawing its own back chevron at
          the top-left even after an earlier attempt at headerBackVisible:
          false, which is a real, valid native-stack option (confirmed
          directly against @react-navigation/native-stack's own type
          definitions) but apparently didn't take effect through Expo
          Router's own Stack.Screen wrapper here -- headerLeft: () => null
          is a more forceful override (replacing the header's whole left
          slot with nothing, not asking it to hide a button while still
          reserving the space) and is the standard, reliable way to fully
          remove it. The Close button alone is enough -- no separate Back
          control needed at all: switching lenses (changeLens) already
          resets drilledItemIndex, so there's already a real way out of
          an ingredient's own drill-down without a dedicated button. */}
      <Stack.Screen options={{ title: title || side?.name || 'Saved Item', headerLeft: () => null }} />
      {confirmSheetElement}
      {infoAlertElement}
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        {loading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : !side ? (
          <Text style={styles.emptyText}>This item couldn&apos;t be found. It may have been deleted.</Text>
        ) : (
          <>
            <View style={styles.lensRow}>
              {DETAIL_LENSES.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.lensButton, lens === option.key ? { backgroundColor: colors.tabFood } : null]}
                  onPress={() => changeLens(option.key)}
                >
                  <Text style={[styles.lensButtonText, lens === option.key ? styles.lensButtonTextActive : null]} numberOfLines={1}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {lens === 'ingredients' ? (
              <>
                <Text style={styles.sideMeta}>
                  Serves {side.servings} · {side.servingSizeAmount} {side.servingSizeUnit} / serving
                </Text>
                {/* Can this be made right now, answered before anyone commits
                    to it. Absent rather than reassuring when the plan could
                    not be worked out: silence is the safe direction, since a
                    wrong "you have everything" sends someone to a cupboard
                    that is empty. */}
                {stockPlan ? (
                  <View style={styles.stockCard}>
                    <Text style={styles.stockTitle}>
                      {stockPlan.fullyStocked
                        ? 'You have everything for this'
                        : `Short ${shortfallsFrom(stockPlan).length} of ${stockPlan.lines.length}`}
                    </Text>
                    {stockPlan.fullyStocked ? null : (
                      <>
                        <Text style={styles.stockBody}>
                          {shortfallsFrom(stockPlan)
                            .map((short) => `${short.foodName} ${formatGroceryAmount(short.quantity, short.unit)}`)
                            .join(', ')}
                        </Text>
                        <TouchableOpacity
                          style={styles.stockButton}
                          activeOpacity={0.85}
                          disabled={making}
                          onPress={async () => {
                            const list = await getActiveGroceryList();
                            if (!list) {
                              showInfoAlert(
                                'No list open',
                                'Start a grocery list first, then what you are missing can go straight onto it.',
                              );
                              return;
                            }
                            setMaking(true);
                            try {
                              // Each shortfall carries the food it is, so the
                              // line arrives identified rather than as a bare
                              // name and matches stock again next time.
                              for (const short of shortfallsFrom(stockPlan)) {
                                await addGroceryListItem(list.id, {
                                  foodName: short.foodName,
                                  category: short.category ?? undefined,
                                  foodId: short.foodId,
                                  unit: short.unit,
                                  quantity: short.quantity,
                                  note: `For ${side.name}`,
                                });
                              }
                              showInfoAlert(
                                'On your list',
                                `What you were missing for ${side.name} has been added.`,
                              );
                            } finally {
                              setMaking(false);
                            }
                          }}
                        >
                          <Text style={styles.stockButtonText}>Add What I Am Missing to My List</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ) : null}

                {/* The one action that moves stock: ingredients out, the batch
                    in. See lib/kitchenUsage.ts for why it asks first. */}
                <TouchableOpacity
                  style={styles.madeButton}
                  activeOpacity={0.85}
                  disabled={making || ingredients.length === 0}
                  onPress={async () => {
                    setMaking(true);
                    try {
                      // Recomputed rather than reusing the readout's plan:
                      // stock can move while a screen sits open, and what is
                      // confirmed has to be what will actually happen.
                      const plan = await planForIngredients(ingredients);
                      // Shown before anything is written. See
                      // lib/kitchenUsage.ts for why that is not negotiable.
                      const ok = await confirmSheet({
                        title: `Made ${side.name}?`,
                        message: describeMakePlan(plan, side.servings),
                        confirmLabel: 'Yes, I made it',
                      });
                      if (!ok) return;
                      await applyMakePlan({
                        draws: plan.lines.flatMap((line) => line.draws),
                        made: { name: side.name, servings: side.servings, servingUnit: 'servings' },
                      });
                      showInfoAlert('Recorded', `${side.name} is in your kitchen, and what it used has come out.`);
                      setStockPlan(await planForIngredients(ingredients));
                    } finally {
                      setMaking(false);
                    }
                  }}
                >
                  <Text style={styles.madeButtonText}>{making ? 'Recording…' : 'I Made This'}</Text>
                </TouchableOpacity>
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientCard}>
                    <Text style={styles.ingredientName}>{ingredient.foodName}</Text>
                    <Text style={styles.ingredientDetail}>
                      {ingredient.quantity} {ingredient.unit} · {ingredient.cutPrep} · {ingredient.cookingMethod}
                    </Text>
                    {ingredient.prepNote ? <Text style={styles.ingredientNote}>{ingredient.prepNote}</Text> : null}
                    {/* The Favorites/Saved-item round-trip, 2026-08-14 --
                        see this file's own top-of-component comment.
                        Invisible by default: renders nothing at all unless
                        this exact ingredient is genuinely flagged. */}
                    {(() => {
                      const info = ingredientTrialInfo[ingredient.id];
                      if (!info?.flagged) return null;
                      const trial = info.latestTrial;
                      if (!trial) {
                        return info.identity ? (
                          <TouchableOpacity onPress={() => handleWorthTesting(info.identity!)}>
                            <Text style={styles.ingredientTrialLink}>Worth testing?</Text>
                          </TouchableOpacity>
                        ) : null;
                      }
                      if (trial.status === 'trialing') {
                        return <Text style={styles.ingredientTrialNote}>Currently being tested.</Text>;
                      }
                      if (trial.status === 'waiting') {
                        // A plain, non-tappable note -- 2026-08-14, matches
                        // "Currently being tested" above rather than
                        // offering a second, separate "Start now" action
                        // here; the real one already lives on the Signals
                        // tab's own trial list (log.tsx's handleReopen).
                        return <Text style={styles.ingredientTrialNote}>Waiting to start (once scheduled/logged).</Text>;
                      }
                      return (
                        <TouchableOpacity onPress={() => handleReopenIngredientTrial(trial.id, ingredient.id)}>
                          <Text style={styles.ingredientTrialLink}>
                            Tested: {trial.status === 'cleared' ? 'tolerated' : 'avoiding'} -- reopen?
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                ))}
              </>
            ) : null}

            {lens === 'nutrients' && nutrientBreakdown ? (
              <NutrientsTable breakdown={nutrientBreakdown} scope={scope} />
            ) : lens === 'sixDs' && dimensionsBreakdown ? (
              <SixDsView
                breakdown={dimensionsBreakdown}
                scope={scope}
                trackedConditions={personalizationProfile?.trackedConditions ?? []}
                expandedDimension={expandedDimension}
                onToggleDimension={(dimension) => setExpandedDimension((current) => (current === dimension ? null : dimension))}
                expandedTierKey={expandedTierKey}
                onToggleTier={(key) => setExpandedTierKey((current) => (current === key ? null : key))}
              />
            ) : lens === 'prep' && dimensionsBreakdown ? (
              <PrepView breakdown={dimensionsBreakdown} scope={scope} mealNoun={mealNounFor(itemType)} />
            ) : null}

            {(lens === 'nutrients' || lens === 'sixDs' || lens === 'prep') && drilledItemIndex === null ? (
              <>
                <Text style={styles.sectionLabel}>Drill into one ingredient</Text>
                {drillNames.map((name, index) => (
                  <TouchableOpacity key={`${name}_${index}`} style={styles.ingredientLinkRow} onPress={() => setDrilledItemIndex(index)}>
                    <Text style={styles.ingredientLinkText} numberOfLines={1}>
                      {name}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Just Close, 2026-08-02 -- a separate floating Back button was
          added, then removed the same day: there's no real navigation it
          would cover that isn't already handled elsewhere. Switching
          lenses (changeLens) already resets drilledItemIndex, so an
          ingredient's own drill-down already has a real way out without a
          dedicated button, and Close already leaves the screen outright.
          Two controls that both ultimately do "go back" was redundant,
          not a real choice between two different things. */}
      <TouchableOpacity
        style={[styles.floatingButton, { bottom: insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET }]}
        onPress={() => router.back()}
        activeOpacity={0.85}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}

// "side" naming kept even though this also now loads a salad, smoothie,
// fermentation, beverage, snack, baked good, soup, sauce, handheld, or
// dessert -- SideDetail/SideIngredientDetail and SaladDetail/
// SaladIngredientDetail/SmoothieDetail/SmoothieIngredientDetail/
// FermentationDetail/FermentationIngredientDetail/BeverageDetail/
// BeverageIngredientDetail/SnackDetail/SnackIngredientDetail/
// BakedGoodsDetail/BakedGoodsIngredientDetail/SoupDetail/
// SoupIngredientDetail/SauceDetail/SauceIngredientDetail/HandheldDetail/
// HandheldIngredientDetail/DessertDetail/DessertIngredientDetail are all
// structurally identical shapes (see lib/db.ts's own Salad/Smoothie/
// Fermentation/Beverage/Snack/BakedGoods/Soup/Sauce/Handheld/Dessert CRUD,
// each a deliberate mirror of Side's), so a loaded salad, smoothie,
// fermentation, beverage, snack, baked good, soup, sauce, handheld, or
// dessert is assignable straight into these same types with no separate
// union needed.

// PrepView's own mealNoun prop, factored out once here rather than another
// nested ternary in the JSX above -- grows by one more itemType per builder,
// same as loadSide below.
function mealNounFor(itemType: string | undefined): string {
  if (itemType === 'salad') return 'salad';
  if (itemType === 'smoothie') return 'smoothie';
  if (itemType === 'fermentation') return 'fermentation';
  if (itemType === 'beverage') return 'beverage';
  if (itemType === 'snack') return 'snack';
  if (itemType === 'bakedGoods') return 'baked good';
  if (itemType === 'soup') return 'soup';
  if (itemType === 'sauce') return 'sauce';
  if (itemType === 'handheld') return 'handheld';
  if (itemType === 'dessert') return 'dessert';
  return 'side';
}

async function loadSide(
  itemType: string | undefined,
  id: string | undefined,
  trackedConditions: { code: string; name: string }[],
): Promise<{
  side: SideDetail | null;
  ingredients: SideIngredientDetail[];
  nutrientBreakdown: DailyNutrientBreakdown | null;
  dimensionsBreakdown: DailySixDimensionsBreakdown | null;
}> {
  const empty = { side: null, ingredients: [], nutrientBreakdown: null, dimensionsBreakdown: null };
  if (!id) return empty;

  if (itemType === 'salad') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSalad(id),
      getSaladIngredients(id),
      getSaladNutrientBreakdown(id),
      getSaladSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'smoothie') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSmoothie(id),
      getSmoothieIngredients(id),
      getSmoothieNutrientBreakdown(id),
      getSmoothieSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'fermentation') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getFermentation(id),
      getFermentationIngredients(id),
      getFermentationNutrientBreakdown(id),
      getFermentationSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'beverage') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getBeverage(id),
      getBeverageIngredients(id),
      getBeverageNutrientBreakdown(id),
      getBeverageSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'snack') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSnack(id),
      getSnackIngredients(id),
      getSnackNutrientBreakdown(id),
      getSnackSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'bakedGoods') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getBakedGoods(id),
      getBakedGoodsIngredients(id),
      getBakedGoodsNutrientBreakdown(id),
      getBakedGoodsSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'soup') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSoup(id),
      getSoupIngredients(id),
      getSoupNutrientBreakdown(id),
      getSoupSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'sauce') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSauce(id),
      getSauceIngredients(id),
      getSauceNutrientBreakdown(id),
      getSauceSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'handheld') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getHandheld(id),
      getHandheldIngredients(id),
      getHandheldNutrientBreakdown(id),
      getHandheldSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'dessert') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getDessert(id),
      getDessertIngredients(id),
      getDessertNutrientBreakdown(id),
      getDessertSixDimensionsBreakdown(id, trackedConditions),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType !== 'side') return empty;

  const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
    getSide(id),
    getSideIngredients(id),
    getSideNutrientBreakdown(id),
    getSideSixDimensionsBreakdown(id, trackedConditions),
  ]);
  if (!side) return empty;
  return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingTop: 12 },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    ...textShadow,
  },
  lensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  lensButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  lensButtonText: {
    ...typography.captionEmphasis,
    color: colors.textSecondary,
    ...textShadow,
  },
  lensButtonTextActive: {
    color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  stockCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  stockTitle: { ...typography.label, ...textShadow, color: colors.textPrimary },
  stockBody: { ...typography.caption, ...textShadow, color: colors.textSecondary },
  stockButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
  },
  stockButtonText: {
    ...typography.caption,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
  },
  madeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.buttonColor,
    marginBottom: 12,
    ...BUTTON_SHADOW,
  },
  madeButtonText: {
    ...typography.label,
    color: colors.textOnButton,
    // Dark text on a light fill: no shadow, matching every other button.
    textShadowColor: 'transparent',
  },
  sideMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 10,
    ...textShadow,
  },
  ingredientCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ingredientName: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  ingredientDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    ...textShadow,
  },
  ingredientNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
    ...textShadow,
  },
  // The Favorites/Saved-item round-trip, 2026-08-14 -- see this file's own
  // top-of-component comment.
  ingredientTrialLink: {
    ...typography.caption,
    color: colors.tabFood,
    marginTop: 4,
    ...textShadow,
  },
  ingredientTrialNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    ...textShadow,
  },
  sectionLabel: {
    ...typography.eyebrow,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 6,
    ...textShadow,
  },
  ingredientLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingredientLinkText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
    ...textShadow,
  },
  floatingButton: {
    position: 'absolute',
    alignSelf: 'center',
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
});
