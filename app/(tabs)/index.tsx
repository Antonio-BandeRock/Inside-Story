import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { ScreenBackground } from '../../components/ScreenBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';

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
  | 'snackBuilder';

const FOOD_LENSES: LensOption<FoodLens>[] = [
  { key: 'mealBuilder', label: 'Meal Builder', icon: 'restaurant-outline' },
  { key: 'sideBuilder', label: 'Side Builder', icon: 'fast-food-outline' },
  { key: 'saladBuilder', label: 'Salad Builder', icon: 'leaf-outline' },
  { key: 'smoothieBuilder', label: 'Smoothie Builder', icon: 'wine-outline' },
  { key: 'fermentationBuilder', label: 'Fermentation Builder', icon: 'flask-outline' },
  { key: 'beverageBuilder', label: 'Beverage Builder', icon: 'cafe-outline' },
  { key: 'snackBuilder', label: 'Snack Builder', icon: 'nutrition-outline' },
];

const FOOD_LENS_COPY: Record<FoodLens, string> = {
  mealBuilder: 'Not built yet. Replaces the old all-in-one meal builder -- build and log a full meal from one or more sides.',
  sideBuilder: 'Not built yet. A single side (protein, starch, vegetable, etc.) as its own reusable building block.',
  saladBuilder: 'Not built yet. Its own builder rather than a dropdown value on a generic meal -- room for salad-specific handling (dressing, raw-quantity checks on goitrogenic greens, etc.).',
  smoothieBuilder: 'Not built yet. Its own builder, same reasoning as Salad -- blending makes it easy to eat a much larger raw quantity of goitrogenic ingredients than you would cooked and separate, worth a dedicated check.',
  fermentationBuilder: 'Not built yet. New territory -- logging homemade fermented foods (yogurt, sauerkraut, etc.), eventually down to the specific bacterial strain involved.',
  beverageBuilder: 'Not built yet. Replaces "Beverage" as a meal-type dropdown value -- water and other drinks, including anything dissolved or mixed in, as their own builder.',
  snackBuilder: 'Not built yet. A lighter-weight builder for anything that is not really a full meal or a side on its own.',
};

const FOOD_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page is for',
    body: 'The Food tab is being rebuilt from one all-in-one meal builder into seven focused builders, one per kind of thing you actually make -- a full meal, a side, a salad, a smoothie, a fermented food, a beverage, or a snack.',
  },
  {
    heading: 'The seven builders',
    body: 'Meal Builder, Side Builder, Salad Builder, Smoothie Builder, Fermentation Builder, Beverage Builder, and Snack Builder -- pick one from the button to the left of the main navigation button, bottom of the screen.',
  },
  {
    heading: 'Status',
    body: "None of the seven are built yet -- they're being built one at a time. Nothing you could do on the old Food tab (build a meal, save a favorite, search ingredients) works here yet.",
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
  const [lens, setLens] = useState<FoodLens>('mealBuilder');
  const activeLensLabel = FOOD_LENSES.find((option) => option.key === lens)?.label;

  return (
    <SwipeableTabScreen>
      <View style={styles.screen}>
        <View style={styles.header}>
          <ScreenHeader title="Food" tabPath="/" helpSections={FOOD_HELP_SECTIONS} />
        </View>

        <ScreenBackground variant="produce">
          <ComingSoonBuilder lens={lens} />
        </ScreenBackground>

        <PageIdentityLabel title="Food" activeLensLabel={activeLensLabel} />
        <LensHub pageTitle="Food" options={FOOD_LENSES} selected={lens} onSelect={setLens} />
      </View>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 12 },
  body: { padding: 16, paddingTop: 2 },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
