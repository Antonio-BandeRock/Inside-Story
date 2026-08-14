import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NutrientsTable, PrepView, SixDsView, type Scope } from './(tabs)/insights';
import type { ResolvedFoodSelection } from '../components/FoodLookup';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
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
  { key: 'sixDs', label: '6 Dimensions' },
  { key: 'prep', label: 'Cooking & Prep' },
];

export default function FoodItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const { itemType, id, title } = useLocalSearchParams<{ itemType: string; id: string; title: string }>();

  const [lens, setLens] = useState<DetailLens>('ingredients');
  const [side, setSide] = useState<SideDetail | null>(null);
  const [ingredients, setIngredients] = useState<SideIngredientDetail[]>([]);
  const [nutrientBreakdown, setNutrientBreakdown] = useState<DailyNutrientBreakdown | null>(null);
  const [dimensionsBreakdown, setDimensionsBreakdown] = useState<DailySixDimensionsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  // Which ingredient (by index into the BREAKDOWN's own item list, not
  // `ingredients` above -- see this file's own top comment on why those
  // two lists aren't guaranteed to line up index-for-index) the Nutrients/
  // 6 Dimensions/Cooking & Prep lenses are currently drilled into. null =
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
    loadSide(itemType, id).then((loaded) => {
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
  }, [itemType, id]);

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
// fermentation, beverage, snack, baked good, soup, sauce, or handheld --
// SideDetail/SideIngredientDetail and SaladDetail/SaladIngredientDetail/
// SmoothieDetail/SmoothieIngredientDetail/FermentationDetail/
// FermentationIngredientDetail/BeverageDetail/BeverageIngredientDetail/
// SnackDetail/SnackIngredientDetail/BakedGoodsDetail/
// BakedGoodsIngredientDetail/SoupDetail/SoupIngredientDetail/SauceDetail/
// SauceIngredientDetail/HandheldDetail/HandheldIngredientDetail are all
// structurally identical shapes (see lib/db.ts's own Salad/Smoothie/
// Fermentation/Beverage/Snack/BakedGoods/Soup/Sauce/Handheld CRUD, each a
// deliberate mirror of Side's), so a loaded salad, smoothie, fermentation,
// beverage, snack, baked good, soup, sauce, or handheld is assignable
// straight into these same types with no separate union needed.

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
  return 'side';
}

async function loadSide(
  itemType: string | undefined,
  id: string | undefined,
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
      getSaladSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'smoothie') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSmoothie(id),
      getSmoothieIngredients(id),
      getSmoothieNutrientBreakdown(id),
      getSmoothieSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'fermentation') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getFermentation(id),
      getFermentationIngredients(id),
      getFermentationNutrientBreakdown(id),
      getFermentationSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'beverage') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getBeverage(id),
      getBeverageIngredients(id),
      getBeverageNutrientBreakdown(id),
      getBeverageSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'snack') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSnack(id),
      getSnackIngredients(id),
      getSnackNutrientBreakdown(id),
      getSnackSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'bakedGoods') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getBakedGoods(id),
      getBakedGoodsIngredients(id),
      getBakedGoodsNutrientBreakdown(id),
      getBakedGoodsSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'soup') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSoup(id),
      getSoupIngredients(id),
      getSoupNutrientBreakdown(id),
      getSoupSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'sauce') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getSauce(id),
      getSauceIngredients(id),
      getSauceNutrientBreakdown(id),
      getSauceSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType === 'handheld') {
    const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
      getHandheld(id),
      getHandheldIngredients(id),
      getHandheldNutrientBreakdown(id),
      getHandheldSixDimensionsBreakdown(id),
    ]);
    if (!side) return empty;
    return { side, ingredients, nutrientBreakdown, dimensionsBreakdown };
  }

  if (itemType !== 'side') return empty;

  const [side, ingredients, nutrientBreakdown, dimensionsBreakdown] = await Promise.all([
    getSide(id),
    getSideIngredients(id),
    getSideNutrientBreakdown(id),
    getSideSixDimensionsBreakdown(id),
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
  },
  lensButtonTextActive: {
    color: colors.textOnPrimary,
  },
  sideMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 10,
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
  },
  ingredientDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ingredientNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // The Favorites/Saved-item round-trip, 2026-08-14 -- see this file's own
  // top-of-component comment.
  ingredientTrialLink: {
    ...typography.caption,
    color: colors.tabFood,
    marginTop: 4,
  },
  ingredientTrialNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    ...typography.eyebrow,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 6,
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
