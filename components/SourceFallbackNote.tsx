import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { isFallbackSource } from '../lib/db';
import { sourceLabel } from './FoodLookup';

// Real source attribution, 2026-08-11 -- a shared component (the same
// "one small file, reused everywhere" shape as AlcoholCalculatorPanel)
// rather than duplicating this same conditional row and its styles across
// all ten direct-ingredient Food builders. Renders nothing when the
// resolved food IS from USDA/Derived (the common case, and the whole
// point of resolveFoodChoice's own new USDA-preference tiebreaker --
// see lib/db.ts's own comment there) -- only appears when USDA genuinely
// has no row for this exact food/prep state and the resolution fell back
// to a real, named alternative source.
export function SourceFallbackNote({ source, tabColor }: { source: string; tabColor: string }) {
  if (!isFallbackSource(source)) return null;
  return (
    <View style={[styles.note, { borderColor: tabColor }]}>
      <Text style={styles.text}>Not in USDA: from {sourceLabel(source)}</Text>
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
