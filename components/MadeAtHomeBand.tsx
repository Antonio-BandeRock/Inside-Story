// Made at Home Instead (G22, 2026-10-02): on a scanned product's report,
// the recipes and whole foods of the same kind that clear the person's
// lists. Which kind, and every sentence, come from lib/packagedSwap.ts; the
// recipe check is recipeFitFor (lib/householdFit.ts), the same line the
// recipe itself shows, and the foods come from listClearedFoodsMatching in
// lib/db.ts narrowed by eating style, allergies and restrictions here.
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { listClearedFoodsMatching, type SafeFood } from '../lib/db';
import { RECIPES_ENTRIES } from '../lib/digest/recipes';
import { routeForDigestEntry } from '../lib/digestNavigation';
import { foodMatchesAllergy, foodMatchesDietPreferences } from '../lib/foodPersonalization';
import { restrictionHitsInText } from '../lib/foodRestrictions';
import { recipeFitFor, type HouseholdPerson } from '../lib/householdFit';
import {
  pickSwapFoods,
  pickSwapRecipes,
  SWAP_BAND_TITLE,
  SWAP_NO_KIND_LINE,
  swapCaption,
  swapKindFor,
  swapLeadLine,
  swapNothingClearsLine,
} from '../lib/packagedSwap';
import { isSideDish } from '../lib/recipeDishRole';
import { useHouseholdPeople } from './HouseholdFitBand';

const RECIPE_CANDIDATES = RECIPES_ENTRIES.filter((entry) => entry.recipeCard).map((entry) => ({
  id: entry.id,
  title: entry.title,
  builder: entry.linkedBuilderType,
  curatedRecipeId: entry.linkedCuratedRecipeId,
  card: entry.recipeCard!,
}));

export function MadeAtHomeBand({
  categoryTags,
  productName,
  tabColor,
}: {
  categoryTags: readonly string[];
  productName: string;
  tabColor: string;
}) {
  const router = useRouter();
  const people = useHouseholdPeople();
  const you: HouseholdPerson | undefined = people.find((person) => person.isYou);
  const match = useMemo(() => swapKindFor(categoryTags, productName), [categoryTags, productName]);

  const recipes = useMemo(() => {
    if (!match || !you) return [];
    return pickSwapRecipes(
      match.kind,
      RECIPE_CANDIDATES,
      (recipe) => {
        const line = recipeFitFor(you, recipe.card);
        return line.tone === 'fits' && line.unchecked === null;
      },
      isSideDish,
    );
  }, [match, you]);

  const [foods, setFoods] = useState<SafeFood[] | null>(null);
  useEffect(() => {
    if (!match || !you) return;
    let cancelled = false;
    const profile = you.profile;
    listClearedFoodsMatching(
      match.kind.foods,
      profile.trackedConditions.map((condition) => condition.code),
    )
      .then((rows) => {
        if (cancelled) return;
        const cleared = rows.filter(
          (food) =>
            foodMatchesDietPreferences(food.category, food.baseName, profile.dietPreferences) &&
            !foodMatchesAllergy(food.baseName, profile.foodAllergies) &&
            restrictionHitsInText(food.baseName, profile.foodRestrictions).length === 0,
        );
        setFoods(pickSwapFoods(match.kind, cleared));
      })
      .catch((error) => {
        console.error('[MadeAtHomeBand] Failed to load whole foods', error);
        if (!cancelled) setFoods([]);
      });
    return () => {
      cancelled = true;
    };
  }, [match, you]);

  if (!match) {
    return (
      <View style={[styles.box, { borderColor: tabColor }]}>
        <Text style={[styles.heading, { color: tabColor }]}>{SWAP_BAND_TITLE}</Text>
        <Text style={styles.caption}>{SWAP_NO_KIND_LINE}</Text>
      </View>
    );
  }
  if (!you) return null;

  const profile = you.profile;
  const loading = foods === null;
  const nothing = !loading && recipes.length === 0 && foods.length === 0;

  return (
    <View style={[styles.box, { borderColor: tabColor }]}>
      <Text style={[styles.heading, { color: tabColor }]}>{SWAP_BAND_TITLE}</Text>
      <Text style={styles.line}>{nothing ? swapNothingClearsLine(match) : swapLeadLine(match)}</Text>
      {recipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => router.push(routeForDigestEntry(recipe.id))}
        >
          <Ionicons name="restaurant-outline" size={18} color={tabColor} style={styles.icon} />
          <Text style={styles.rowText}>{recipe.title}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.icon} />
        </TouchableOpacity>
      ))}
      {(foods ?? []).map((food) => (
        <TouchableOpacity
          key={`${food.foodId}|${food.source}`}
          style={styles.row}
          activeOpacity={0.7}
          onPress={() =>
            router.navigate({
              pathname: '/insights',
              params: {
                openInsightsLens: 'foodLookup',
                lookupCategory: food.category,
                lookupSubcategory: food.subcategory ?? '',
              },
            })
          }
        >
          <Ionicons name="leaf-outline" size={18} color={tabColor} style={styles.icon} />
          <Text style={styles.rowText}>{food.baseName}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.icon} />
        </TouchableOpacity>
      ))}
      {loading ? <Text style={styles.caption}>Looking through the whole foods…</Text> : null}
      <Text style={styles.caption}>
        {swapCaption({
          conditions: profile.trackedConditions.length,
          eatingStyle: profile.dietPreferences.length > 0,
          allergies: profile.foodAllergies.length > 0,
          restrictions: profile.foodRestrictions.length > 0,
        })}
      </Text>
      <Text style={styles.caption}>A recipe opens on Food; a whole food opens its shelf in Food Lookup.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginVertical: 8,
  },
  heading: { ...typography.label, ...textShadow },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  icon: { marginTop: 2 },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  line: { ...typography.body, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
});
