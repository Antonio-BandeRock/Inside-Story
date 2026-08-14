// One real, shared, tap-to-explain advisory row per matched general-health
// topic, 2026-08-14 -- replaces the near-identical, hand-copied
// alcohol/coffee/juice/raw-meat advisory rows every builder used to render
// on its own (each with its own imports, its own near-identical
// TouchableOpacity block). Every builder that used any of those four now
// renders exactly one <GeneralHealthAdvisories /> instead -- see
// lib/generalHealthRules.ts for why this is a net reduction, not an
// addition.
//
// Filters by the person's own per-topic mute preference
// (lib/generalHealthPreferences.ts) before rendering -- the ONE real place
// mute is ever actually applied (evaluateGeneralHealthRules itself never
// reads it), so Trends/Reports calling that same evaluator directly, once
// either is built out, stay unaffected by anything muted here.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { typography } from '../constants/typography';
import { useGeneralHealthPreferences } from '../hooks/useGeneralHealthPreferences';
import {
  evaluateGeneralHealthRules,
  type GeneralHealthPendingIngredient,
  type GeneralHealthResolvedFood,
} from '../lib/generalHealthRules';

type Props = {
  resolved: GeneralHealthResolvedFood;
  cookMethod?: string | null;
  // Real, computed grams for the current entry, and its own known natural
  // serving weight -- both optional, only needed by the portion-size rule.
  // See GeneralHealthPendingIngredient's own comment in
  // lib/generalHealthRules.ts for where these come from.
  quantityGrams?: number | null;
  naturalUnitWeightGrams?: number | null;
  // The full list of ingredients currently in the builder, current one
  // included -- needed for a real food-combination rule to see across more
  // than one ingredient. Defaults to empty, which simply means no
  // combination rule can ever match -- every builder not yet passing this
  // still gets every single-food rule correctly.
  allPendingIngredients?: GeneralHealthPendingIngredient[];
  tabColor: string;
  // Same "let the parent own its own alert" convention DimensionFlags
  // already uses (its own onExplain prop) -- every builder already has a
  // real useInfoAlert() instance, no reason for this component to own a
  // second one.
  onExplain: (title: string, message: string) => void;
};

export function GeneralHealthAdvisories({
  resolved,
  cookMethod = null,
  quantityGrams = null,
  naturalUnitWeightGrams = null,
  allPendingIngredients = [],
  tabColor,
  onExplain,
}: Props) {
  const preferences = useGeneralHealthPreferences();
  const matches = evaluateGeneralHealthRules(
    resolved,
    cookMethod,
    quantityGrams,
    naturalUnitWeightGrams,
    allPendingIngredients,
  );
  const visible = matches.filter((match) => !preferences.mutedTopics[match.topicId]);

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((match) => (
        <TouchableOpacity
          key={match.topicId}
          style={[styles.row, { borderColor: tabColor }]}
          onPress={() => onExplain(match.title, match.message)}
        >
          <Ionicons name="information-circle-outline" size={16} color={tabColor} />
          <Text style={[styles.text, { color: tabColor }]} numberOfLines={1}>
            {match.title} (tap to learn more)
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  // Same real shape every migrated advisory row already used (SideBuilder's
  // own healingStageAdvisoryRow, itself already reused by the alcohol/
  // coffee/juice rows in other builders) -- kept identical so this is a
  // visual no-op for anyone who already knows what these rows look like.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  text: {
    ...typography.caption,
    flex: 1,
  },
});
