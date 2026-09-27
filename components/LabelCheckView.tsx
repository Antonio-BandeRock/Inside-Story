// Insights > Check a Label (G18, 2026-09-27): paste or say the
// ingredient list off any package and see every ingredient with its named
// reasons, the same check the Food scan report runs. Nothing is saved;
// the list lives only while the lens is open.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { IngredientCheckList } from './IngredientCheckList';
import { makeTabBandStyles } from './TabBand';
import { VoiceInputButton } from './VoiceInputButton';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { PersonalizationProfile } from '../lib/foodPersonalization';
import { checkIngredients } from '../lib/ingredientFlags';
import { flagAdditivesInIngredients, flagConditionConcernsForConditions } from '../lib/scannedProductFlags';

type Props = {
  tabColor: string;
  profile: PersonalizationProfile | null;
  onOpenReading: (readingId: string) => void;
};

export function LabelCheckView({ tabColor, profile, onOpenReading }: Props) {
  const band = useMemo(() => makeTabBandStyles(tabColor), [tabColor]);
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

  return (
    <View style={band.column}>
      <View style={[band.box, styles.inputBox]}>
        <Text style={styles.label}>Ingredients off the label</Text>
        <View style={styles.inputRow}>
          <AppTextInput
            value={labelText}
            onChangeText={setLabelText}
            style={styles.textArea}
            multiline
            placeholder="Paste or type the ingredient list, commas and all."
            placeholderTextColor={colors.textMuted}
          />
          <VoiceInputButton onResult={setLabelText} />
        </View>
        <Text style={styles.hint}>
          Checked against your allergies, diet preferences, food restrictions and conditions from Profile, plus lists that apply to anybody.
        </Text>
      </View>
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
