import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';

// 2026-08-21, direct request: "Fermentation should ask what type of
// fermentation they want to build before moving on to any part of the
// rest of the builder because the answer to that question provides what
// is needed to filter what the next screen will provide. The bacterias
// and probiotics selections do not belong here at all. Those are
// ingredients for a yogurt fermentation, and that is how they should be
// treated." Direct mirror of BeverageSubtypePicker.tsx's own already-
// shipped pattern (2026-08-13) -- a real first screen shown before
// FermentationBuilder itself mounts (see app/(tabs)/food.tsx's own render
// switch), the same "genuinely fresh arrival only" bypass logic for
// editing/reusing something that already has its own real ingredients.
//
// FermentationBuilder.tsx's own FERMENTATION_SUBTYPE_CONFIG maps each of
// these five to a real, narrower allowedCategories restriction, checked
// directly against this session's own 45 curated fermentation recipes
// (which of Fruit/Veg/Dairy/Grain/Bev/Brewing each one actually draws
// from) plus the 4 that predate them (both yogurts, sauerkraut,
// kombucha) -- not guessed at. The Cultures & Probiotics strain picker
// (Lactobacillus acidophilus, L. plantarum, Bifidobacterium, S.
// thermophilus, L. bulgaricus, L. mesenteroides, S. boulardii) now shows
// ONLY for milkKefirYogurt, the one real subtype it actually describes --
// every other subtype's own real culture (a SCOBY, kefir grains, wild
// yeast on a fruit skin) isn't one of this app's own 7 catalogued
// single-organism strains at all, the same honest "leave it unlinked
// rather than guess" precedent this whole recipe set already established
// (see scripts/add_fermented_drink_recipes.py's own header comment).
export type FermentationSubtypeKey =
  | 'fruitVegTonics'
  | 'kombuchaGrainDrinks'
  | 'waterCoconutKefir'
  | 'milkKefirYogurt'
  | 'somethingElse';

const FERMENTATION_TYPE_OPTIONS: { key: FermentationSubtypeKey; label: string; description: string }[] = [
  {
    key: 'fruitVegTonics',
    label: 'Fruit & Vegetable Tonics',
    description: 'Wild-fermented fruit tonics, lacto-fermented vegetables, beet kvass, tepache, shrub, switchel, ginger beer.',
  },
  {
    key: 'kombuchaGrainDrinks',
    label: 'Kombucha, Tea & Grain Ferments',
    description: 'Kombucha, jun tea, amazake, boza, sake-style and makgeolli rice wines, rejuvelac, kvass, chicha.',
  },
  {
    key: 'waterCoconutKefir',
    label: 'Water & Coconut Kefir',
    description: 'Dairy-free kefir grains fermenting sugar water or coconut water, plus coconut palm wine-style ferments.',
  },
  {
    key: 'milkKefirYogurt',
    label: 'Milk Kefir, Yogurt & Cultured Dairy',
    description: 'Milk kefir, yogurt, ayran, lassi, the one type built around a specific starter culture, picked here as an ingredient.',
  },
  {
    key: 'somethingElse',
    label: 'Something Else',
    description: 'Not sure yet, or building something this list doesn\'t name: opens every ingredient category unfiltered.',
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
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={[styles.heading, { color: tabColor }]}>What Kind of Fermentation?</Text>
      <Text style={styles.subheading}>
        Pick the closest match. This scopes ingredient search to the right kind of ferment, and only asks about starter
        cultures where that&rsquo;s actually an ingredient choice.
      </Text>
      {FERMENTATION_TYPE_OPTIONS.map((option) => (
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
  heading: { ...typography.sectionTitle },
  subheading: { ...typography.body, color: colors.textMuted, marginBottom: 4 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  cardLabel: { ...typography.label },
  cardDescription: { ...typography.body, color: colors.textMuted },
});
