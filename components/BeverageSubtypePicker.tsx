import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';

// 2026-08-13, direct request: "if I tap the Beverages lens, it should
// provide a subcategorical choice about what kind of beverage they will be
// making... This also acts as a first level filter for at least some of
// the cases, and it also shows the different ways that the whole foods
// need to be categorized in their groups." A real, deliberate first screen
// shown before BeverageBuilder itself mounts (see app/(tabs)/food.tsx's own
// render switch) -- distinct from every other builder's own blank Name/
// Servings/Serving Size intro, since two of these seven real options don't
// stay inside Beverage Builder at all, they redirect to a genuinely
// different, already-existing builder (Smoothie, Fermentation).
//
// The five "stay in Beverage Builder" options are real, deliberate filters,
// not just labels -- BeverageBuilder.tsx's own BEVERAGE_SUBTYPE_CONFIG maps
// each one to a real, narrower allowedCategories/allowedSubcategories
// restriction, checked directly against the live reference database before
// being written (see that file's own comment for the exact mapping and the
// real visible-row counts behind each choice).
export type BeverageSubtypeKey =
  | 'cocktailsMixology'
  | 'infusionsBrews'
  | 'juicesNectars'
  | 'hydrationWellness'
  | 'performanceProtein';

export type BeverageTypeChoice =
  | { kind: 'subtype'; key: BeverageSubtypeKey }
  | { kind: 'redirect'; lens: 'smoothieBuilder' | 'fermentationBuilder' };

const BEVERAGE_TYPE_OPTIONS: { label: string; description: string; choice: BeverageTypeChoice }[] = [
  {
    label: 'Cocktails & Mixology',
    description: 'Alcoholic spirits, mixers, and craft combinations.',
    choice: { kind: 'subtype', key: 'cocktailsMixology' },
  },
  {
    label: 'Infusions & Brews',
    description: 'Traditional coffee, teas, and herbal extractions.',
    choice: { kind: 'subtype', key: 'infusionsBrews' },
  },
  {
    label: 'Juices & Nectars',
    description: 'Pressed fruits, vegetables, and simple liquid blends.',
    choice: { kind: 'subtype', key: 'juicesNectars' },
  },
  {
    label: 'Hydration & Wellness',
    description: 'Enhanced waters, electrolytes, and daily hydration bases.',
    choice: { kind: 'subtype', key: 'hydrationWellness' },
  },
  {
    label: 'Performance & Protein',
    description: 'Protein shakes, meal replacements, and fitness powders.',
    choice: { kind: 'subtype', key: 'performanceProtein' },
  },
  {
    label: 'Smoothies',
    description: 'Launches the standalone Smoothie Builder within this workspace.',
    choice: { kind: 'redirect', lens: 'smoothieBuilder' },
  },
  {
    label: 'Fermentation',
    description: 'Launches the standalone Fermentation Builder for kombucha, kefirs, beers, or other fermented types of drinks.',
    choice: { kind: 'redirect', lens: 'fermentationBuilder' },
  },
];

export function BeverageSubtypePicker({
  tabColor,
  onPick,
}: {
  tabColor: string;
  onPick: (choice: BeverageTypeChoice) => void;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={[styles.heading, { color: tabColor }]}>What Kind of Beverage?</Text>
      <Text style={styles.subheading}>
        Pick the closest match. This scopes ingredient search to the right kind of drink, or opens the right builder
        directly.
      </Text>
      {BEVERAGE_TYPE_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.label}
          style={[styles.card, { borderColor: tabColor }]}
          onPress={() => onPick(option.choice)}
        >
          <Text style={[styles.cardLabel, { color: tabColor }]}>{option.label}</Text>
          <Text style={styles.cardDescription}>{option.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12 },
  // 2026-08-29 standing rule: no text sits on the photo background.
  // heading and subheading below carry matching top/bottom corners and no
  // gap between them, so the pair reads as one intro block rather than two
  // stacked boxes.
  heading: { ...typography.sectionTitle, ...textShadow, backgroundColor: colors.surface, borderTopLeftRadius: 10, borderTopRightRadius: 10, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 4 },
  subheading: { ...typography.body, color: colors.textMuted, marginBottom: 12, marginTop: -12, ...textShadow, backgroundColor: colors.surface, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, paddingBottom: 12, paddingHorizontal: 12 },
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
