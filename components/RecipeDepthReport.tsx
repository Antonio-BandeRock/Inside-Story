// The "Nutrition & Health Report" -- 2026-08-25, rebuilt from a direct
// correction to the first attempt: "This looks pretty much like another
// version of the recipe. It needs to be a report about the nutrients. It
// does need to use some sort of graph instead of just writing it out.
// Visuals are far more effective... I was looking more for a PDF style of
// reporting feature, very professional looking, like a real health report
// as it applies to their conditions, so for Hashimoto's it should show how
// it does not cause problems or does cause them for the D1-D6." Scoped by
// direct follow-up: a styled in-app screen, not a real exported PDF file
// (that stays a named, deferred capability shared with the Reports tab's
// own long-standing PDF-export goal, not built twice).
//
// The recipe already shows the ingredient list and diet-tag badges (see
// app/(tabs)/purple-digest.tsx's own RecipeCardDetail) -- neither is
// repeated here. This report is specifically the two things a recipe
// doesn't already show: a real chart of nutrient content against this
// person's own daily target, and, per tracked condition, a real chart of
// how the dish scores across that condition's own real dimensions (its
// literal "D1-D6" for Hashimoto's specifically -- see
// lib/recipeDepth.ts's own DimensionSeverity comment for why every other
// condition has its own, differently-shaped real dimension set instead).
//
// A pure presentational component, deliberately -- it takes already-
// computed data as props and renders it, with no data-fetching, so a
// future builder's rollout can render this same component unchanged.

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { DimensionSeverity } from '../lib/recipeDepth';
import type { ConditionStageAdvisory } from '../lib/conditionStageAdvisory';
import type { DeclaredConditionStage } from '../lib/conditionStages';
import { DimensionChart } from './DimensionChart';
import { NutrientBarChart, type NutrientChartDatum } from './NutrientBarChart';

export type RecipeDepthReportProps = {
  dishName: string;
  yieldLabel: string;
  ingredientCount: number;
  nutrientChartData: NutrientChartDatum[];
  trackedConditions: { code: string; name: string }[];
  safeForConditions: string[];
  conditionCautions: Record<string, { severity: 'yellow' | 'red'; note: string }>;
  dimensionBreakdown: Record<string, DimensionSeverity[]>;
  // 2026-08-25, direct request: "There should be something about the
  // stage they are in of their healing, such as for Hashimoto's stages of
  // healing." Keyed by condition code, absent for a condition with no
  // real staging model or no declared stage yet (see
  // lib/conditionStages.ts's own resolveDeclaredStage).
  declaredStages: Record<string, DeclaredConditionStage>;
  // 2026-08-25, direct follow-up: "If the user doesn't have a stage
  // chosen, there needs to be a way to tell them here, and give them a way
  // to set it." Which conditions have a real staging model at all (most
  // don't) -- lets a condition with no model stay silent (correct) while
  // a condition with a real model but nothing declared yet gets a real
  // prompt instead of just missing information.
  conditionsWithStagingModel: Set<string>;
  // Opens a real, in-place stage picker (see SideBuilder.tsx's own
  // stagePickerFor) rather than sending the person to Profile -- this
  // screen has no way to know whether a real navigation away and back
  // would still find this in-progress side intact.
  onSetStage: (conditionCode: string, conditionName: string) => void;
  stageNotes: ConditionStageAdvisory[];
  tabColor: string;
  onSave: () => void;
  onGoBack: () => void;
  saving?: boolean;
};

function verdictFor(
  conditionCode: string,
  safeForConditions: string[],
  conditionCautions: RecipeDepthReportProps['conditionCautions'],
): { label: string; color: string } {
  const caution = conditionCautions[conditionCode];
  if (caution) {
    return caution.severity === 'red' ? { label: 'Caution', color: colors.danger } : { label: 'Mild Caution', color: colors.statusYellowStandalone };
  }
  if (safeForConditions.includes(conditionCode)) {
    return { label: 'Clean', color: colors.statusGood };
  }
  // Neither safe nor cautioned means an absolute-exclusion rule matched
  // (see lib/recipeDepth.ts's own ABSOLUTE_EXCLUSIONS) -- genuinely never
  // safe at any dose, not a matter of degree.
  return { label: 'Not Recommended', color: colors.danger };
}

export function RecipeDepthReport({
  dishName,
  yieldLabel,
  ingredientCount,
  nutrientChartData,
  trackedConditions,
  safeForConditions,
  conditionCautions,
  dimensionBreakdown,
  declaredStages,
  conditionsWithStagingModel,
  onSetStage,
  stageNotes,
  tabColor,
  onSave,
  onGoBack,
  saving,
}: RecipeDepthReportProps) {
  return (
    <View style={[styles.wrap, { borderColor: tabColor }]}>
      <Text style={[styles.eyebrow, { color: tabColor }]}>Nutrition &amp; Health Report</Text>
      <Text style={styles.title}>{dishName}</Text>
      <Text style={styles.yield}>
        {yieldLabel} · {ingredientCount} ingredient{ingredientCount === 1 ? '' : 's'}
      </Text>

      {/* TEMPORARY DEBUG BLOCK -- 2026-08-25, to find why the stage
          section is reported missing despite the underlying data and
          render code both checking out on review. Remove once resolved. */}
      <View style={{ borderWidth: 2, borderColor: 'red', padding: 8, marginTop: 8 }}>
        <Text style={{ color: 'red', fontWeight: '700' }}>DEBUG</Text>
        <Text style={{ color: 'red' }}>trackedConditions: {JSON.stringify(trackedConditions)}</Text>
        <Text style={{ color: 'red' }}>declaredStages: {JSON.stringify(declaredStages)}</Text>
        <Text style={{ color: 'red' }}>conditionsWithStagingModel: {JSON.stringify(Array.from(conditionsWithStagingModel))}</Text>
      </View>

      {nutrientChartData.length > 0 ? (
        <View style={[styles.card, { borderColor: tabColor }]}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>Nutrient Content</Text>
          <NutrientBarChart data={nutrientChartData} color={tabColor} />
        </View>
      ) : null}

      {trackedConditions.length > 0 ? (
        <View style={[styles.card, { borderColor: tabColor }]}>
          <Text style={[styles.cardLabel, { color: tabColor }]}>How This Scores for Your Conditions</Text>
          {trackedConditions.map((condition) => {
            const verdict = verdictFor(condition.code, safeForConditions, conditionCautions);
            const data = dimensionBreakdown[condition.code] ?? [];
            const stage = declaredStages[condition.code];
            return (
              <View key={condition.code} style={styles.conditionBlock}>
                <View style={styles.conditionHeaderRow}>
                  <Text style={styles.conditionName}>{condition.name}</Text>
                  <View style={[styles.verdictPill, { backgroundColor: verdict.color }]}>
                    <Text style={styles.verdictPillText}>{verdict.label}</Text>
                  </View>
                </View>
                {stage ? (
                  <View style={styles.stageContextRow}>
                    <Text style={styles.bodyText}>
                      <Text style={styles.bodyTextBold}>Your stage: </Text>
                      {stage.stageLabel}
                    </Text>
                    <Text style={styles.stageDescription}>{stage.stageShortDescription}</Text>
                  </View>
                ) : conditionsWithStagingModel.has(condition.code) ? (
                  <View style={styles.stageContextRow}>
                    <Text style={styles.bodyText}>No healing stage set for {condition.name} yet.</Text>
                    <TouchableOpacity onPress={() => onSetStage(condition.code, condition.name)}>
                      <Text style={[styles.setStageLink, { color: tabColor }]}>Set My Stage</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {data.length > 0 ? (
                  <DimensionChart data={data} color={tabColor} />
                ) : (
                  <Text style={styles.bodyText}>No dimension data scored for this condition.</Text>
                )}
              </View>
            );
          })}
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
  // One solid, opaque colors.surface card wrapping the whole report
  // (2026-08-25, direct report: nothing had a real backing at all, so the
  // Food tab's own background photo showed straight through) -- matching
  // SideBuilder.tsx's own formCard, so every nested box below sits on a
  // real backdrop instead of the photo behind it.
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 10,
    padding: 16,
  },
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
  conditionBlock: { marginTop: 12 },
  conditionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  conditionName: { ...typography.bodyEmphasis, color: colors.textPrimary },
  verdictPill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  verdictPillText: { ...typography.caption, fontWeight: '700', color: colors.textOnButton },
  stageContextRow: { marginTop: 4, marginBottom: 4 },
  stageDescription: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  setStageLink: { ...typography.captionEmphasis, marginTop: 4, textDecorationLine: 'underline' },
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
