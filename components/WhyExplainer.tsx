import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

// 2026-08-23, direct request: a generic, no-personal-data "why" for
// interaction warnings and reference-only rules, direct follow-up to
// "there are other interactions that might also require an AI response
// like about the reason why it says they shouldn't take certain
// medications or supplements with something or around something." Landed
// as pre-written content (see InteractionRuleRecord's own mechanism
// field in lib/db.ts) rather than a live AI call, a deliberate choice:
// ships now, costs nothing per use, works offline, and never sends
// anything off the device, all things a live call would give up.
//
// One small shared component rather than six near-identical inline
// blocks -- interaction warnings and reference-only rules each render
// from their own local JSX in both Insights' My Meds screen and four
// separate lenses on Schedule, and duplicating this same "if there's a
// mechanism, show a tappable Why?" logic six times would only invite the
// six copies to drift. Deliberately NOT its own InfoAlert instance --
// every screen that renders interaction rules already has one real
// showInfoAlert from its own useInfoAlert() call, and this just reuses
// it via the onPress prop rather than mounting a second modal.
type Props = {
  title: string;
  mechanism: string | null;
  onPress: (title: string, message: string) => void;
};

export function WhyExplainer({ title, mechanism, onPress }: Props) {
  if (!mechanism) return null;
  return (
    <TouchableOpacity onPress={() => onPress(title, mechanism)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Why: ${title}`}>
      <Text style={styles.whyText}>Why?</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  whyText: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
