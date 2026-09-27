import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { foodSourceCaption } from '../lib/foodSource';

// Where a resolved food's numbers come from (G11, 2026-09-27), one shared
// component across every direct-ingredient Food builder. Until 1.0.54.7 it
// was SourceFallbackNote and said something only when a food was not from
// USDA; now every food names its national table, and a fallback says so as
// the caption's second sentence. The wording lives in lib/foodSource.ts.
export function FoodSourceNote({ source, tabColor }: { source: string; tabColor: string }) {
  return (
    <View style={[styles.note, { borderColor: tabColor }]}>
      <Text style={styles.text}>{foodSourceCaption(source)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
});
