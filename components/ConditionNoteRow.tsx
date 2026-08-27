import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { ComponentConditionNote } from '../lib/db';

// Shared render for one row inside a Food builder's "Worth Knowing If You
// Have..." box -- 2026-08-26, direct report: "The 'worth knowing if you
// have...' boxes on the screen at the bottom should have a link to
// something in the Digest with more information about the claim we are
// making, but they are in the middle of creating their hydration through
// the fermentation, and they might want to read the warning without
// losing their place in the build. No user should ever be enticed by
// information and not be provided a way to read it and then to get back
// to what they were doing." Reused across all 11 direct-ingredient
// builders' own final-review screens (previously 11 near-identical hand-
// copied `conditionNotes.map(...)` blocks) rather than duplicated again,
// so this exact interaction only lives in one place.
//
// Only tappable when note.relevanceNote is genuinely real -- most of
// this app's older sub-criteria don't carry this yet (see
// ComponentConditionNote's own comment in lib/db.ts), and a tap that
// leads nowhere would be worse than no tap at all. Tapping opens the
// same real, cited explanation via showInfoAlert (an in-place overlay,
// not navigation) that every other "tap to learn more" affordance in
// this app already uses -- DimensionFlags, GeneralHealthAdvisories, the
// healing-stage advisory row -- so reading it never risks losing
// whatever's mid-build on this screen. A fuller version that opens the
// specific Digest article a claim traces back to, rather than the same
// real relevance/citation text Insights' own Condition Scores lens
// already surfaces for the identical question, would need mapping every
// sub-criterion to a specific long-form entry -- a real, separate,
// larger project, not built here.
export function ConditionNoteRow({
  note,
  onExplain,
  isFirst,
}: {
  note: ComponentConditionNote;
  onExplain: (title: string, message: string) => void;
  isFirst: boolean;
}) {
  const body = (
    <>
      <Text style={styles.condition}>{note.condition}</Text>
      <Text style={styles.text}>{note.note}</Text>
      {note.relevanceNote ? <Text style={styles.learnMore}>Tap to learn more</Text> : null}
    </>
  );
  if (!note.relevanceNote) {
    return <View style={isFirst ? undefined : styles.spaced}>{body}</View>;
  }
  return (
    <TouchableOpacity
      style={isFirst ? undefined : styles.spaced}
      activeOpacity={0.7}
      onPress={() => onExplain(note.condition, note.relevanceNote! + (note.citation ? `\n\nSource: ${note.citation}` : ''))}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  spaced: { marginTop: 8 },
  condition: { ...typography.bodyEmphasis, color: colors.textPrimary },
  text: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
  learnMore: { ...typography.caption, color: colors.danger, marginTop: 2 },
});
