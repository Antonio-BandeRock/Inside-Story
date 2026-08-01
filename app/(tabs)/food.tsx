import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub, type MyItemsSection } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SideBuilder } from '../../components/SideBuilder';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import { listFavorites, listSides } from '../../lib/db';

// This page's own identity color -- every box FoodLookup draws (list
// borders, the results table, its own text) takes this as its `tabColor`
// prop, the same way Insights' Food Lookup lens passes its own teal.
const TAB_COLOR = colors.tabFood;

// 2026-07-25: the Food tab's old single-purpose meal builder (ingredient
// search, favorites/templates, rotating ingredients, the whole thing) was
// deleted wholesale, by explicit request, to rebuild the tab from the floor
// up as seven focused builders instead of one form that tried to cover
// every case. The deleted implementation is not lost -- see
// ClaudeWork/backups/index.tsx.<timestamp>.bak for the full original file --
// this project has no git repository at all, so that manual backup is the
// only safety net for reviving any of that logic (ingredient search,
// favorites, rotation, etc.) when rebuilding each builder for real.
//
// Known loose end from this deletion: Schedule's "Log now" action and
// Home's Day Arc both navigate to '/' with scheduleItemId/mealType/title/
// favoriteId/templateMealId params, expecting the old builder to read them
// (via useLocalSearchParams) and open pre-filled. Nothing here reads those
// params anymore, so right now those actions just land on a blank Food tab
// with the meal not actually logged. Needs reconnecting once whichever
// builder a "scheduled meal" maps to (almost certainly Meal Builder) is
// rebuilt -- not fixed yet.
type FoodLens =
  | 'mealBuilder'
  | 'sideBuilder'
  | 'saladBuilder'
  | 'smoothieBuilder'
  | 'fermentationBuilder'
  | 'beverageBuilder'
  | 'snackBuilder'
  | 'bakedGoodsBuilder'
  | 'soupBuilder'
  | 'saucesBuilder';

const FOOD_LENS_COPY: Record<FoodLens, string> = {
  mealBuilder: 'Not built yet. Replaces the old all-in-one meal builder -- build and log a full meal from one or more sides.',
  sideBuilder:
    "In progress. Name the dish (optional), set # of Servings and Serving Size, then add one or more ingredients (category -> type -> food -> prep, then quantity/unit) -- nutrient lookup itself lives on Insights' own Food Lookup lens instead of being duplicated here. Done leads into a required \"how was this cooked\" step (cooking method changes retained nutrients), then a soft, skippable nudge if no cooking oil/fat or seasoning was logged -- easy to miss both by accident. Saving the finished side as a reusable favorite isn't wired up yet.",
  saladBuilder: 'Not built yet. Its own builder rather than a dropdown value on a generic meal -- room for salad-specific handling (dressing, raw-quantity checks on goitrogenic greens, etc.).',
  smoothieBuilder: 'Not built yet. Its own builder, same reasoning as Salad -- blending makes it easy to eat a much larger raw quantity of goitrogenic ingredients than you would cooked and separate, worth a dedicated check.',
  fermentationBuilder: 'Not built yet. New territory -- logging homemade fermented foods (yogurt, sauerkraut, etc.), eventually down to the specific bacterial strain involved.',
  beverageBuilder: 'Not built yet. Replaces "Beverage" as a meal-type dropdown value -- water and other drinks, including anything dissolved or mixed in, as their own builder.',
  snackBuilder: 'Not built yet. A lighter-weight builder for anything that is not really a full meal or a side on its own.',
  bakedGoodsBuilder: 'Not built yet. Bread, muffins, and other home-baked items as their own builder -- distinct from Meal/Side since a baked good is usually made once and portioned out over several separate sittings.',
  soupBuilder: 'Not built yet. Its own builder rather than a Meal Builder variant -- room for soup-specific handling (broth base, simmered-down ingredient concentration, etc.).',
  saucesBuilder:
    'Not built yet. Covers sauces, gravies, dressings, dips, and anything else in that family -- the tenth builder, added 2026-07-28 after review of the existing nine turned up this as a real gap none of them covered.',
};

// The full name shown in PageIdentityLabel's own corner box once a lens
// is picked, 2026-07-28 -- deliberately separate from FOOD_LENSES' own
// short grid label (below): that label dropped "Builder" from every
// option back on 2026-07-27 (see that change's own comment) specifically
// because the popup's shared header already says "Nutrition Builders"
// once for the whole grid, but the corner box has no such shared header
// nearby to lean on, so it needs the real full name spelled out on its
// own. "Side Dish Builder," not the mechanical "Side Builder," to match
// the name SideBuilder.tsx's own in-page title bar already uses -- the one
// of these ten that's actually built, and worth matching exactly rather
// than reconstructing a close-but-different name.
//
// 2026-07-28: a forced line break (\n) before "Builder" in every one of
// these, even the ones that would otherwise fit on one line (e.g. "Snack
// Builder") -- explicitly requested so every name in this box reads as
// two lines, "what it builds" then "Builder," consistently across all
// ten rather than some wrapping and some not depending on length alone.
const FOOD_LENS_FULL_NAMES: Record<FoodLens, string> = {
  mealBuilder: 'Meal\nBuilder',
  sideBuilder: 'Side Dish\nBuilder',
  saladBuilder: 'Salad\nBuilder',
  smoothieBuilder: 'Smoothie\nBuilder',
  fermentationBuilder: 'Fermentation\nBuilder',
  beverageBuilder: 'Beverage\nBuilder',
  snackBuilder: 'Snack\nBuilder',
  bakedGoodsBuilder: 'Baked Goods\nBuilder',
  soupBuilder: 'Soup\nBuilder',
  saucesBuilder: 'Sauces\nBuilder',
};

// Per-builder Info content (LensHub's own bottom-left Info tile) -- one
// real section each, reusing FOOD_LENS_COPY's own text as the single
// source of truth rather than a second, separately-worded copy that could
// drift from what the empty-state placeholder itself says.
//
// 2026-07-27: "Builder" dropped from every option's own label here (was
// "Meal Builder," "Side Builder," etc.) -- every single one of these is a
// builder, so that's said once now, in the popup's own header instead (see
// this file's own <LensHub headerLabel="Nutrition Builders" .../> below),
// rather than repeated ten times over. Each `help` heading was shortened
// to match, for the same reason -- it used to just repeat the label.
const FOOD_LENSES: LensOption<FoodLens>[] = [
  {
    key: 'mealBuilder',
    label: 'Meal',
    icon: 'restaurant-outline',
    help: [{ heading: 'Meal', body: FOOD_LENS_COPY.mealBuilder }],
  },
  {
    key: 'sideBuilder',
    label: 'Side',
    icon: 'fast-food-outline',
    help: [{ heading: 'Side', body: FOOD_LENS_COPY.sideBuilder }],
  },
  {
    key: 'saladBuilder',
    label: 'Salad',
    icon: 'leaf-outline',
    help: [{ heading: 'Salad', body: FOOD_LENS_COPY.saladBuilder }],
  },
  {
    key: 'smoothieBuilder',
    label: 'Smoothie',
    icon: 'wine-outline',
    help: [{ heading: 'Smoothie', body: FOOD_LENS_COPY.smoothieBuilder }],
  },
  {
    key: 'fermentationBuilder',
    label: 'Fermentation',
    icon: 'flask-outline',
    help: [{ heading: 'Fermentation', body: FOOD_LENS_COPY.fermentationBuilder }],
  },
  {
    key: 'beverageBuilder',
    label: 'Beverage',
    icon: 'cafe-outline',
    help: [{ heading: 'Beverage', body: FOOD_LENS_COPY.beverageBuilder }],
  },
  {
    key: 'snackBuilder',
    label: 'Snack',
    icon: 'nutrition-outline',
    help: [{ heading: 'Snack', body: FOOD_LENS_COPY.snackBuilder }],
  },
  {
    key: 'bakedGoodsBuilder',
    label: 'Baked Goods',
    icon: 'pizza-outline',
    help: [{ heading: 'Baked Goods', body: FOOD_LENS_COPY.bakedGoodsBuilder }],
  },
  {
    key: 'soupBuilder',
    label: 'Soup',
    icon: 'flame-outline',
    help: [{ heading: 'Soup', body: FOOD_LENS_COPY.soupBuilder }],
  },
  {
    // Deliberately last, 2026-07-28 -- 10 items in this grid's 3 columns
    // leaves the final row with just one real item before Info's own
    // centered row below it, and LensHub's flexWrap layout naturally
    // places a lone trailing item at the LEFT of its row -- exactly the
    // bottom-left placement asked for, with no special-case positioning
    // logic needed.
    key: 'saucesBuilder',
    label: 'Sauces',
    icon: 'water-outline',
    help: [{ heading: 'Sauces', body: FOOD_LENS_COPY.saucesBuilder }],
  },
];

const FOOD_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page is for',
    body: 'The Food tab is being rebuilt from one all-in-one meal builder into ten focused builders, one per kind of thing you actually make -- a full meal, a side, a salad, a smoothie, a fermented food, a beverage, a snack, a baked good, a soup, or a sauce/gravy/dressing/dip.',
  },
  {
    heading: 'The ten builders',
    body: 'Meal, Side, Salad, Smoothie, Fermentation, Beverage, Snack, Baked Goods, Soup, and Sauces -- pick one from the button to the left of the main navigation button, bottom of the screen.',
  },
  {
    heading: 'Status',
    body: "Being built one at a time. Side can build a real side dish (servings, serving size, one or more ingredients with quantity/unit) and save it for real; the other nine are still plain placeholders. Saving as a reusable favorite, and building a full meal out of saved sides, aren't wired up yet. Nothing you could do on the old Food tab (build a meal, save a favorite, search ingredients) works here yet.",
  },
];

// Shared placeholder for all seven builders until each is built for real,
// one at a time -- same "coming soon" pattern already used for the
// Trends/Reports tabs and for Schedule's own not-yet-built lenses
// (see ComingSoonLens in app/(tabs)/schedule.tsx).
function ComingSoonBuilder({ lens }: { lens: FoodLens }) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <Text style={styles.emptyText}>{FOOD_LENS_COPY[lens]}</Text>
    </ScrollView>
  );
}

export default function FoodScreen() {
  useRegisterScreenHelp('Food', FOOD_HELP_SECTIONS, '/food');
  const [lens, setLens] = useState<FoodLens>('mealBuilder');
  const activeLensLabel = FOOD_LENS_FULL_NAMES[lens];
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );

  // "My Foods" (see MyItemsHub below) -- refetched every time that popup
  // opens (via its own onOpen prop), not just once at mount, so a side
  // saved a moment ago always shows up rather than whatever was fetched
  // the first time this screen rendered. Favorites filtered to 'side'
  // specifically -- Side Builder is the only builder that produces
  // anything favoritable yet, and this list has no use for meal favorites
  // saved by the old, deleted meal builder.
  const [mySides, setMySides] = useState<MyItemsSection['items']>([]);
  const [mySideFavorites, setMySideFavorites] = useState<MyItemsSection['items']>([]);
  async function loadMyFoods() {
    const [sides, favorites] = await Promise.all([listSides(), listFavorites(50, 'side')]);
    setMySides(
      sides.map((side) => ({
        id: side.id,
        title: side.name,
        subtitle: `${side.ingredientCount} ingredient${side.ingredientCount === 1 ? '' : 's'}`,
      })),
    );
    setMySideFavorites(favorites.map((favorite) => ({ id: favorite.id, title: favorite.name })));
  }
  const myFoodsSections: MyItemsSection[] = [
    { title: 'Saved Sides', items: mySides, emptyText: 'No sides saved yet.' },
    { title: 'Favorites', items: mySideFavorites, emptyText: 'Nothing favorited yet.' },
  ];

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- 2026-07-28, explicitly requested: with a
          builder's own content showing, a horizontal drag that doesn't
          land cleanly on one of its own scrollers (e.g. SideBuilder's
          pill pickers) was being caught by this swipe gesture instead,
          closing the builder and jumping to the next/previous tab. Swipe-
          to-change-tab now only works from a lens's OWN picker (nothing
          revealed yet) -- once a real builder is open, only its own
          LensHub corner button can back out of it. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Food" variant="produce" revealed={revealed}>
          {lens === 'sideBuilder' ? (
            // SideBuilder owns its own layout entirely (a plain View while
            // FoodLookup's own picker is active, its own ScrollView
            // otherwise) -- see that component's own comment for why,
            // same FlatList-in-ScrollView reasoning as Insights' own Food
            // Lookup lens.
            <SideBuilder tabColor={TAB_COLOR} />
          ) : (
            <ComingSoonBuilder lens={lens} />
          )}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Food" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Foods" tabColor={TAB_COLOR} sections={myFoodsSections} onOpen={loadMyFoods} />
      <LensHub
        pageTitle="Food"
        headerLabel="Nutrition Builders"
        buttonLabel="Food"
        options={FOOD_LENSES}
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 16, paddingTop: 2 },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
