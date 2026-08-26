// The "Nutrition & Safety Report" -- 2026-08-25, direct instruction after
// being asked whether every Food builder wires into the same real
// condition-safety/diet-tag depth curated Recipes carry (they didn't):
// "maybe this is an opportunity to work in a new report that can maybe be
// created prior to saving, so the user can see things clearly rather than
// try to build something into the builder view that crowds the screen...
// laid out very professionally so they could view it easily and decide if
// they want to save it as is or replace or adjust something." Piloted on
// Side Builder first, direct follow-up: "Pilot it on Side Builder first,
// choice to create the report or not but both paths route to saving it" --
// this component is the optional view; the underlying computation (see
// lib/recipeDepth.ts) always runs either way.
//
// A pure presentational component, deliberately -- it takes already-
// computed data as props and renders it, with no data-fetching of its own,
// specifically so a future builder's own rollout can render this same
// component from its own review step without touching this file at all.
//
// Reuses this app's own already-established visual language rather than
// inventing a new one: SideBuilder's own nutrition/condition box shapes
// (borderWidth 2, tinted per-severity), and the same green/yellow/red
// severity-dot palette (colors.statusGood/statusYellow/danger) "Meals You
// Can Eat" already uses for the identical safe/caution/serious concept
// (see app/(tabs)/purple-digest.tsx's own severityDotColor).

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { ComponentNutritionHighlight } from '../lib/db';
import type { ConditionStageAdvisory } from '../lib/conditionStageAdvisory';
import type { RecipeDietTag } from '../lib/digest/types';

export type RecipeDepthReportProps = {
  dishName: string;
  yieldLabel: string;
  ingredientLines: string[];
  nutritionHighlights: ComponentNutritionHighlight[];
  dietTags: RecipeDietTag[];
  trackedConditions: { code: string; name: string }[];
  safeForConditions: string[];
  conditionCautions: Record<string, { severity: 'yellow' | 'red'; note: string }>;
  stageNotes: ConditionStageAdvisory[];
  tabColor: string;
  onSave: () => void;
  onGoBack: () => void;
  saving?: boolean;
};

function severityDotColor(severity: 'green' | 'yellow' | 'red'): string {
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  return colors.statusGood;
}

export function RecipeDepthReport({
  dishName,
  yieldLabel,
  ingredientLines,
  nutritionHighlights,
  dietTags,
  trackedConditions,
  safeForConditions,
  conditionCautions,
  stageNotes,
  tabColor,
  onSave,
  onGoBack,
  saving,
}: RecipeDepthReportProps) {
  const safeCodes = new Set(safeForConditions);
  // Every tracked condition gets a real row, green/yellow/red -- not just
  // the ones that happen to be flagged -- so "nothing shown" never reads
  // as "not checked."
  const conditionRows = trackedConditions.map((condition) => {
    const caution = conditionCautions[condition.code];
    if (caution) {
      return { code: condition.code, name: condition.name, severity: caution.severity as 'yellow' | 'red', note: caution.note };
    }
    if (safeCodes.has(condition.code)) {
      return { code: condition.code, name: condition.name, severity: 'green' as const, note: null };
    }
    // Neither safe nor cautioned means this condition's own absolute-
    // exclusion rule matched (see lib/recipeDepth.ts's own
    // ABSOLUTE_EXCLUSIONS) -- genuinely never safe at any dose, not a
    // matter of degree like every other row here.
    return { code: condition.code, name: condition.name, severity: 'excluded' as const, note: null };
  });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: tabColor }]}>Nutrition &amp; Safety Report</Text>
      <Text style={styles.title}>{dishName}</Text>
      <Text style={styles.yield}>{yieldLabel}</Text>

      <View style={[styles.card, { borderColor: tabColor }]}>
        <Text style={[styles.cardLabel, { color: tabColor }]}>Ingredients</Text>
        {ingredientLines.map((line, index) => (
          <Text key={index} style={styles.bodyText}>
            • {line}
          </Text>
        ))}
      </View>

      {dietTags.length > 0 ? (
        <View style={styles.dietTagRow}>
          {dietTags.map((tag) => (
            <View key={tag} style={[styles.dietTagPill, { backgroundColor: colors.buttonColor }]}>
              <Text style={styles.dietTagPillText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {nutritionHighlights.length > 0 ? (
        <View style={[styles.card, { borderColor: tabColor }]}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>What This Dish Gives You</Text>
          {nutritionHighlights.map((highlight, index) => (
            <Text key={index} style={styles.bodyText}>
              • <Text style={styles.bodyTextBold}>{highlight.nutrient}:</Text> {highlight.note}
            </Text>
          ))}
        </View>
      ) : null}

      {trackedConditions.length > 0 ? (
        <View style={[styles.card, { borderColor: tabColor }]}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>Your Tracked Conditions</Text>
          {conditionRows.map((row) => (
            <View key={row.code} style={styles.conditionRow}>
              <View
                style={[
                  styles.severityDot,
                  { backgroundColor: row.severity === 'excluded' ? colors.danger : severityDotColor(row.severity) },
                ]}
              />
              <View style={styles.conditionRowText}>
                <Text style={styles.bodyTextBold}>{row.name}</Text>
                {row.severity === 'excluded' ? (
                  <Text style={[styles.bodyText, { color: colors.danger }]}>
                    Contains something that isn’t safe at any amount for this condition.
                  </Text>
                ) : row.note ? (
                  <Text style={styles.bodyText}>{row.note}</Text>
                ) : (
                  <Text style={styles.bodyText}>Nothing flagged for this condition.</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {stageNotes.length > 0 ? (
        <View style={[styles.card, { borderColor: colors.statusYellow }]}>
          <Text style={[styles.cardLabel, { color: colors.statusYellowStandalone }]}>Worth Knowing for Your Healing Stage</Text>
          {stageNotes.map((note, index) => (
            <View key={index} style={index > 0 ? styles.stageNoteSpacing : undefined}>
              <Text style={styles.bodyTextBold}>{note.title}</Text>
              <Text style={styles.bodyText}>{note.message}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.secondaryButton, styles.buttonHalf, { borderColor: tabColor }]} onPress={onGoBack} disabled={saving}>
          <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Go Back and Adjust</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.buttonHalf, { backgroundColor: colors.buttonColor }]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save As Is'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 24 },
  eyebrow: { ...typography.eyebrow, marginBottom: 4 },
  title: { ...typography.sectionTitle, color: colors.textPrimary },
  yield: { ...typography.caption, color: colors.textMuted, marginBottom: 8 },
  card: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  cardLabel: { ...typography.eyebrow, marginBottom: 6 },
  bodyText: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
  bodyTextBold: { ...typography.bodyEmphasis, color: colors.textPrimary },
  dietTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'flex-start' },
  dietTagPill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  dietTagPillText: { ...typography.caption, fontWeight: '700', color: colors.textOnButton },
  conditionRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  conditionRowText: { flex: 1 },
  stageNoteSpacing: { marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  buttonHalf: { flex: 1 },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis },
});
