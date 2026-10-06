// Insights > Check a Label (G18, 2026-09-27): paste or say the
// ingredient list off any package and see every ingredient with its named
// reasons, the same check the Food scan report runs. Nothing is saved;
// the list lives only while the lens is open.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { HouseholdFitBand, useHouseholdPeople } from './HouseholdFitBand';
import { IngredientCheckList } from './IngredientCheckList';
import { useTabBandStyles } from './TabBand';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { PersonalizationProfile } from '../lib/foodPersonalization';
import { labelFitFor, YOU_ID } from '../lib/householdFit';
import { checkIngredients } from '../lib/ingredientFlags';
import { flagAdditivesInIngredients, flagConditionConcernsForConditions } from '../lib/scannedProductFlags';

type Props = {
  tabColor: string;
  profile: PersonalizationProfile | null;
  onOpenReading: (readingId: string) => void;
};

export function LabelCheckView({ tabColor, profile, onOpenReading }: Props) {
  const band = useTabBandStyles(tabColor);
  const [labelText, setLabelText] = useState('');

  const rows = useMemo(() => {
    if (!labelText.trim()) return [];
    const conditions = profile?.trackedConditions.map((condition) => condition.code) ?? [];
    return checkIngredients(labelText, {
      conditions,
      dietTags: profile?.dietPreferences ?? [],
      allergies: profile?.foodAllergies ?? [],
      restrictions: profile?.foodRestrictions ?? [],
      additiveFlagsFor: flagAdditivesInIngredients,
      conditionFlagsFor: (text) => flagConditionConcernsForConditions(text, conditions),
      conditionName: (code) => profile?.trackedConditions.find((condition) => condition.code === code)?.name ?? code.replace(/_/g, ' '),
    });
  }, [labelText, profile]);

  // G20: a line per person in the household. The person's own line reads
  // the profile this lens was handed, so it matches the list below.
  const household = useHouseholdPeople();
  const householdLines = useMemo(() => {
    if (!labelText.trim()) return [];
    return household.map((person) =>
      labelFitFor(
        person.id === YOU_ID && profile ? { ...person, profile } : person,
        labelText,
        (codes) => (text) => flagConditionConcernsForConditions(text, codes),
      ),
    );
  }, [household, labelText, profile]);

  return (
    <View style={band.column}>
      <View style={[band.box, styles.inputBox]}>
        <Text style={styles.label}>Ingredients off the label</Text>
        <View style={styles.inputRow}>
          <AppTextInput
            onVoiceResult={setLabelText}
            value={labelText}
            onChangeText={setLabelText}
            style={styles.textArea}
            multiline
            placeholder="Paste or type the ingredient list, commas and all."
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <Text style={styles.hint}>
          Checked against your allergies, diet preferences, food restrictions and conditions from Profile, plus lists that apply to anybody.
        </Text>
      </View>
      {householdLines.length > 1 ? (
        <View style={band.box}>
          <HouseholdFitBand lines={householdLines} tabColor={tabColor} />
        </View>
      ) : null}
      {rows.length > 0 ? (
        <View style={band.box}>
          <IngredientCheckList rows={rows} onOpenReading={onOpenReading} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputBox: { gap: 8 },
  label: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  textArea: {
    flex: 1,
    minHeight: 100,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    ...textShadow,
  },
  hint: { ...typography.caption, color: colors.textSecondary, ...textShadow },
});
