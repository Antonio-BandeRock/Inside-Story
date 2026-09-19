import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { EntryPhotoSection } from './EntryPhotoSection';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { CuratedRecipeShareButton, RECIPE_BUILDER_PARAM, RecipeBuildRow, RecipeDetailCard } from './RecipeDetailCard';
import { getEntriesForCategory } from '../lib/digest';
import { isProblemFoodEntry, type DigestEntry } from '../lib/digest/types';
import type { BuilderFavoriteItemType } from '../lib/db';

// The curated recipes, on the Food tab, grouped under the builder that
// makes them. Direct instruction, 2026-09-18: "I would like the System
// recipes from Digest to move to Food on the Food page and be access from
// System Meals, but change System Meals to System Recipes. When I select
// System Recipes, the recipes should be listed by the Builder that would
// create them or would be used to edit them if the user wanted to start
// with a system recipes and change it to suit their liking... When the
// user selects a meal, side, smoothie, etc from the drop down collapsable
// card, it expands to show everything it would have shown from when it was
// listed in Digest. The recipe, the measurements, the prepwork,
// everything."
//
// So the shape is My Recipes' shape (components/FoodItemsView.tsx): one
// fold band per builder, an inset row per recipe, and the row opens in
// place rather than navigating anywhere. What opens is the same
// RecipeDetailCard the Digest renders, painted in Food's green rather
// than the Digest's purple, so the two can never drift apart.
//
// No data plumbing of its own: every curated recipe already carries its
// full recipeCard, its linkedBuilderType and its linkedCuratedRecipeId in
// the JS bundle (lib/digest/recipes.ts), so this reads them straight out
// rather than going near either database.

const TAB_COLOR = colors.tabFood;

// Every builder that can hold a recipe, in the order Food's lens list puts
// them, with the shelf label and the icon each builder already uses.
//
// There is no Meals group, and it is not an omission: a curated recipe's
// linkedBuilderType is a BuilderFavoriteItemType (lib/db.ts), which has no
// 'meal' in it, because Meal Builder assembles a meal out of saved
// components rather than holding ingredients of its own. So a system meal
// cannot exist in the corpus today, and adding one would mean widening
// that type first, then authoring meals as combinations of the components
// below. Raised with the owner 2026-09-18.
const RECIPE_GROUPS: { type: BuilderFavoriteItemType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'side', label: 'Sides', icon: 'fast-food-outline' },
  { type: 'salad', label: 'Salads & Bowls', icon: 'leaf-outline' },
  { type: 'smoothie', label: 'Smoothies', icon: 'wine-outline' },
  { type: 'fermentation', label: 'Fermentation', icon: 'flask-outline' },
  { type: 'beverage', label: 'Beverages', icon: 'cafe-outline' },
  { type: 'snack', label: 'Snacks', icon: 'nutrition-outline' },
  { type: 'bakedGoods', label: 'Baked Goods', icon: 'pizza-outline' },
  { type: 'soup', label: 'Soups', icon: 'flame-outline' },
  { type: 'sauce', label: 'Sauces', icon: 'water-outline' },
  { type: 'handheld', label: 'Handhelds', icon: 'layers-outline' },
  { type: 'dessert', label: 'Desserts', icon: 'ice-cream-outline' },
];

type RecipeGroup = { type: BuilderFavoriteItemType; label: string; icon: keyof typeof Ionicons.glyphMap; entries: DigestEntry[] };

// Worked out once for the life of the app, since the corpus is bundled and
// cannot change while it is running. Food's own tile reads the count from
// here on every render, which is why this is cached rather than filtered
// afresh each time.
let cachedGroups: RecipeGroup[] | null = null;

function systemRecipeGroups(): RecipeGroup[] {
  if (cachedGroups) return cachedGroups;
  // The Recipes category holds one other shape too (a problem-food entry
  // has no title or recipeCard of its own), so that is told apart here
  // rather than assumed away.
  const entries = getEntriesForCategory('recipes').filter(
    (entry): entry is DigestEntry => !isProblemFoodEntry(entry),
  );
  const byType = new Map<string, DigestEntry[]>();
  for (const entry of entries) {
    if (!entry.linkedBuilderType) continue;
    const bucket = byType.get(entry.linkedBuilderType);
    if (bucket) bucket.push(entry);
    else byType.set(entry.linkedBuilderType, [entry]);
  }
  for (const bucket of byType.values()) {
    bucket.sort((a, b) => a.title.localeCompare(b.title));
  }
  cachedGroups = RECIPE_GROUPS.map((group) => ({ ...group, entries: byType.get(group.type) ?? [] })).filter(
    (group) => group.entries.length > 0,
  );
  return cachedGroups;
}

// How many recipes the app ships, for the Food tile that opens this.
export function countSystemRecipes(): number {
  return systemRecipeGroups().reduce((total, group) => total + group.entries.length, 0);
}

export function SystemRecipesView({
  onOpenBuilder,
  onClose,
}: {
  // A builder, pre-loaded with the curated recipe to start from: the same
  // openSideRecipeId/openSaladRecipeId/... params the Digest's own "Build
  // This Recipe" has always pushed, which is what makes "start with a
  // system recipe and change it" work.
  onOpenBuilder: (params: Record<string, string>) => void;
  onClose: () => void;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  const groups = systemRecipeGroups();

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.backLink}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Every recipe that comes with the app, under the tool that makes it. Tap one to read it: what it makes,
            what goes in it, how to cook it, and what it gives you. Build This Recipe opens that tool already loaded
            with it, so you can change it into your own.
          </Text>
        </View>
        {groups.map((group) => (
          <HomeSectionBand
            key={group.type}
            kind="fold"
            title={`${group.label} (${group.entries.length})`}
            icon={group.icon}
            color={TAB_COLOR}
            expanded={openGroup === group.type}
            onToggle={() => setOpenGroup(openGroup === group.type ? null : group.type)}
            contentStyle={styles.bandBody}
          >
            {group.entries.map((entry) => (
              <SystemRecipeRow
                key={entry.id}
                entry={entry}
                expanded={openEntryId === entry.id}
                onToggle={() => setOpenEntryId(openEntryId === entry.id ? null : entry.id)}
                onOpenBuilder={onOpenBuilder}
              />
            ))}
          </HomeSectionBand>
        ))}
      </ScrollView>
    </View>
  );
}

// One recipe, closed to its title and teaser, open to the whole thing.
function SystemRecipeRow({
  entry,
  expanded,
  onToggle,
  onOpenBuilder,
}: {
  entry: DigestEntry;
  expanded: boolean;
  onToggle: () => void;
  onOpenBuilder: (params: Record<string, string>) => void;
}) {
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemTapArea} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>{entry.title}</Text>
          <Text style={styles.itemSubtitle}>{entry.teaser}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.itemDetail}>
          <Text style={styles.detailText}>{entry.summary}</Text>
          {entry.linkedCuratedRecipeId && entry.linkedBuilderType ? (
            <RecipeBuildRow
              label="Build This Recipe"
              tabColor={TAB_COLOR}
              onPress={() =>
                onOpenBuilder({
                  [RECIPE_BUILDER_PARAM[entry.linkedBuilderType!]]: entry.linkedCuratedRecipeId!,
                })
              }
            >
              <CuratedRecipeShareButton
                recipeId={entry.linkedCuratedRecipeId}
                builderType={entry.linkedBuilderType}
                tabColor={TAB_COLOR}
              />
            </RecipeBuildRow>
          ) : null}
          {entry.recipeCard ? (
            <RecipeDetailCard card={entry.recipeCard} tabColor={TAB_COLOR} tabTextColor={TAB_COLOR} />
          ) : null}
          <EntryPhotoSection entry={entry} tabColor={TAB_COLOR} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // The Food background shows through, as it does behind every builder.
  wrapper: { flex: 1 },
  container: { paddingHorizontal: 0, paddingTop: 5, gap: HOME_BAND_GAP },
  backLink: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '400',
    alignSelf: 'flex-start',
    marginLeft: HOME_BAND_CONTENT_PADDING,
    backgroundColor: colors.tabFood,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  bandBody: { gap: HOME_BAND_GAP },
  introBox: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
  },
  introText: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  // An inset box inside the band rather than a second band, the same shape
  // My Recipes' own rows take.
  itemRow: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
  },
  itemTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemTextWrap: { flex: 1, marginRight: 12 },
  itemTitle: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    ...textShadow,
  },
  itemDetail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 12,
  },
  detailText: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
});
