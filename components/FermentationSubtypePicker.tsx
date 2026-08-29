import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';

// 2026-08-21, direct request: "Fermentation should ask what type of
// fermentation they want to build before moving on to any part of the
// rest of the builder... The bacterias and probiotics selections do not
// belong here at all. Those are ingredients for a yogurt fermentation,
// and that is how they should be treated." Direct mirror of
// BeverageSubtypePicker.tsx's own already-shipped pattern (2026-08-13).
//
// 2026-08-21, same day, real, direct follow-up correction after the
// first version of this screen shipped with a flat 5-option list: picking
// "Fruit & Vegetable Tonics" and landing on a name-field example of
// "Homemade Sauerkraut" exposed a real structural problem, not just a
// wrong example -- that one option had silently conflated drinkable
// tonics (Fruit) with solid, spoon-eaten ferments (Vegetables, sauerkraut
// chief among them). Fermentation Builder has never been drink-only (its
// own original 4 curated recipes are 2 yogurts, sauerkraut, and
// kombucha), so "what kind of fermentation" genuinely has two real,
// separate axes: is this something you drink, and then which real method
// within that. This screen now asks both, in that order -- a real two-
// step flow, not a flatter list with more options crammed into one
// screen. FermentationBuilder.tsx's own FERMENTATION_SUBTYPE_CONFIG maps
// each of the 10 real leaf keys below to a narrower allowedCategories
// restriction, checked directly against which real ingredient categories
// this session's own 45 curated fermentation recipes (plus the 4 that
// predate them) actually draw from -- not guessed at.
export type FermentationSubtypeKey =
  | 'fruitHerbalTonics'
  | 'vegetableRootFerments'
  | 'kombuchaTeaGrainDrinks'
  | 'waterCoconutKefir'
  | 'milkKefirCulturedDairyDrinks'
  | 'somethingElseDrink'
  | 'fermentedVegetables'
  | 'yogurt'
  | 'syrupsSpoonableTonics'
  | 'somethingElseFood';

type DrinkChoice = 'drink' | 'food';

const DRINK_TYPE_OPTIONS: { key: FermentationSubtypeKey; label: string; description: string }[] = [
  {
    key: 'fruitHerbalTonics',
    label: 'Fruit & Herbal Tonics',
    description: 'Wild-fermented fruit tonics, tepache, ginger beer, ginger bug soda, turmeric drink, shrub, switchel.',
  },
  {
    key: 'vegetableRootFerments',
    label: 'Vegetable & Root Ferments',
    description: 'Beet kvass, kanji, and other bitter root tonics fermented in a salt brine, drunk in small shots.',
  },
  {
    key: 'kombuchaTeaGrainDrinks',
    label: 'Kombucha, Tea & Grain Ferments',
    description: 'Kombucha, jun tea, amazake, boza, sake-style and makgeolli rice wines, rejuvelac, kvass, chicha.',
  },
  {
    key: 'waterCoconutKefir',
    label: 'Water & Coconut Kefir',
    description: 'Dairy-free kefir grains fermenting sugar water or coconut water, plus coconut palm wine-style ferments.',
  },
  {
    key: 'milkKefirCulturedDairyDrinks',
    label: 'Milk Kefir & Cultured Dairy Drinks',
    description: 'Milk kefir, ayran, mango lassi: thin, drinkable dairy ferments, distinct from yogurt itself.',
  },
  {
    key: 'somethingElseDrink',
    label: 'Something Else to Drink',
    description: 'Not sure yet, or building a drink this list does not name: opens every ingredient category unfiltered.',
  },
];

const FOOD_TYPE_OPTIONS: { key: FermentationSubtypeKey; label: string; description: string }[] = [
  {
    key: 'fermentedVegetables',
    label: 'Fermented Vegetables',
    description: 'Sauerkraut and other salt-brine vegetable ferments, eaten by the forkful, not poured into a glass.',
  },
  {
    key: 'yogurt',
    label: 'Yogurt',
    description: 'Built around a specific starter culture, the one type where picking a Culture & Probiotic is an actual ingredient choice.',
  },
  {
    key: 'syrupsSpoonableTonics',
    label: 'Syrups & Spoonable Tonics',
    description: 'Fermented garlic honey, pine needle-style cheong, taken by the spoonful, not diluted into a drink.',
  },
  {
    key: 'somethingElseFood',
    label: 'Something Else',
    description: 'Not sure yet, or building something this list does not name: opens every ingredient category unfiltered.',
  },
];

export function FermentationSubtypePicker({
  tabColor,
  onPick,
}: {
  tabColor: string;
  onPick: (key: FermentationSubtypeKey) => void;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [drinkChoice, setDrinkChoice] = useState<DrinkChoice | null>(null);

  if (drinkChoice === null) {
    return (
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
        <Text style={[styles.heading, { color: tabColor }]}>Is This a Drink?</Text>
        <Text style={styles.subheading}>
          Fermentation Builder covers both. A fermented drink and a fermented food (sauerkraut, yogurt) need different
          ingredients, so this narrows things before anything else.
        </Text>
        <TouchableOpacity style={[styles.card, { borderColor: tabColor }]} onPress={() => setDrinkChoice('drink')}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>Yes, a Drink</Text>
          <Text style={styles.cardDescription}>Something you pour into a glass and drink.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { borderColor: tabColor }]} onPress={() => setDrinkChoice('food')}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>No, Something You Eat</Text>
          <Text style={styles.cardDescription}>Sauerkraut, yogurt, or a syrup taken by the spoonful.</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const options = drinkChoice === 'drink' ? DRINK_TYPE_OPTIONS : FOOD_TYPE_OPTIONS;
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
      <TouchableOpacity style={styles.backRow} onPress={() => setDrinkChoice(null)}>
        <Text style={[styles.backText, { color: tabColor }]}>{'‹ Back'}</Text>
      </TouchableOpacity>
      <Text style={[styles.heading, { color: tabColor }]}>What Kind of {drinkChoice === 'drink' ? 'Drink' : 'Ferment'}?</Text>
      <Text style={styles.subheading}>
        Pick the closest match. This scopes ingredient search to the right kind of ferment, and only asks about starter
        cultures where that&rsquo;s actually an ingredient choice.
      </Text>
      {options.map((option) => (
        <TouchableOpacity key={option.key} style={[styles.card, { borderColor: tabColor }]} onPress={() => onPick(option.key)}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>{option.label}</Text>
          <Text style={styles.cardDescription}>{option.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12 },
  heading: { ...typography.sectionTitle, ...textShadow },
  subheading: { ...typography.body, color: colors.textMuted, marginBottom: 4, ...textShadow },
  backRow: { marginBottom: 4 },
  backText: { ...typography.bodyEmphasis, ...textShadow },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  cardLabel: { ...typography.label, ...textShadow },
  cardDescription: { ...typography.body, color: colors.textMuted, ...textShadow },
});
