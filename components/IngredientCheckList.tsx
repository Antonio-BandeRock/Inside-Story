// Every ingredient on a label with its named reasons (G18, 2026-09-27).
//
// One row per ingredient in label order. A row with reasons lists each on
// one line, coloured by whether it touches something the person set
// (yellow), is an additive worth a second look (red) or is only worth
// knowing (muted). Tapping a reason opens why it is there; a reason with
// a reading behind it carries a Read link. The full sentences live in
// lib/ingredientFlags.ts, so the Food scan and the Insights lens say the
// same thing.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useInfoAlert } from './InfoAlert';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  describeIngredientCheck,
  describeReason,
  INGREDIENT_CHECK_CAPTION,
  INGREDIENT_CHECK_SOURCES,
  NO_REASON_LINE,
  type CheckedIngredient,
  type IngredientReason,
  type IngredientReasonTone,
} from '../lib/ingredientFlags';

const TONE_COLOR: Record<IngredientReasonTone, string> = {
  yours: colors.statusYellowOnSurface,
  look: colors.statusRedOnSurface,
  note: colors.textSecondary,
};

type Props = {
  rows: CheckedIngredient[];
  onOpenReading: (readingId: string) => void;
};

export function IngredientCheckList({ rows, onOpenReading }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  function openReason(reason: IngredientReason) {
    showInfoAlert(reason.label, `${reason.why}\n\nOn this label: ${reason.matched}`);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.summary}>{describeIngredientCheck(rows)}</Text>
      {rows.map((row, index) => (
        <View key={`${index}:${row.name}`} style={styles.row}>
          <Text style={styles.name}>{row.name}</Text>
          {row.parts.length > 0 ? <Text style={styles.parts}>{row.parts.join(', ')}</Text> : null}
          {row.reasons.length === 0 ? (
            <Text style={styles.none}>{NO_REASON_LINE}</Text>
          ) : (
            row.reasons.map((reason, reasonIndex) => (
              <View key={`${reason.kind}:${reasonIndex}`} style={styles.reasonLine}>
                <TouchableOpacity style={styles.reasonTap} activeOpacity={0.75} onPress={() => openReason(reason)}>
                  <Text style={[styles.reason, { color: TONE_COLOR[reason.tone] }]}>{describeReason(reason)}</Text>
                </TouchableOpacity>
                {reason.readingId ? (
                  <TouchableOpacity activeOpacity={0.75} accessibilityRole="link" onPress={() => onOpenReading(reason.readingId as string)}>
                    <Text style={styles.link}>Read</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>
      ))}
      <Text style={styles.caption}>{INGREDIENT_CHECK_CAPTION}</Text>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => showInfoAlert('Where these lists come from', INGREDIENT_CHECK_SOURCES.join('\n\n'))}
      >
        <Text style={styles.link}>Where these lists come from</Text>
      </TouchableOpacity>
      {infoAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  summary: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  row: { gap: 2, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  name: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  parts: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  none: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  reasonLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reasonTap: { flex: 1 },
  reason: { ...typography.caption, ...textShadow },
  link: { ...typography.captionEmphasis, color: colors.accent, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, marginTop: 4, ...textShadow },
});
