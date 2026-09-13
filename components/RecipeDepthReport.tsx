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

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from './HomeSectionBand';
import { textShadow, typography } from '../constants/typography';
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
  // 2026-09-01. One line per ingredient whose scored reference row
  // describes a different preparation from the one stated for it, which
  // happens when this database has no row for that food cooked. Empty in
  // the ordinary case, where the row and the stated method agree.
  //
  // Here rather than on the ingredient list itself because this screen is
  // the one that explains what the numbers above it are actually based on,
  // and a caveat about the numbers belongs with them.
  prepMismatchNotes: string[];
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

// Exported, 2026-08-26 -- components/FoodLookup.tsx's own new personalize
// block reuses this exact same verdict logic for one food at a time,
// rather than a second, drifting copy of the same Clean/Mild Caution/
// Caution/Not Recommended rule.
export function verdictFor(
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
  prepMismatchNotes,
  onSetStage,
  stageNotes,
  tabColor,
  onSave,
  onGoBack,
  saving,
}: RecipeDepthReportProps) {
  // Each section folds (Home's rule for informational content), open by
  // default; the heading box and the buttons do not.
  const [nutrientsOpen, setNutrientsOpen] = useState(true);
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [stageOpen, setStageOpen] = useState(true);
  const [basisOpen, setBasisOpen] = useState(true);
  return (
    <View style={styles.column}>
      <View style={[styles.headingBox, { borderColor: tabColor }]}>
        <Text style={[styles.eyebrow, { color: tabColor }]}>Nutrition &amp; Health Report</Text>
        <Text style={styles.title}>{dishName}</Text>
        <Text style={styles.yield}>
          {yieldLabel} · {ingredientCount} ingredient{ingredientCount === 1 ? '' : 's'}
        </Text>
      </View>

      {nutrientChartData.length > 0 ? (
        <HomeSectionBand
          title="Nutrient Content"
          icon="nutrition-outline"
          color={tabColor}
          expanded={nutrientsOpen}
          onToggle={() => setNutrientsOpen((open) => !open)}
        >
          <NutrientBarChart data={nutrientChartData} color={tabColor} />
        </HomeSectionBand>
      ) : null}

      {trackedConditions.length > 0 ? (
        <HomeSectionBand
          title="How This Scores for Your Conditions"
          icon="medical-outline"
          color={tabColor}
          expanded={conditionsOpen}
          onToggle={() => setConditionsOpen((open) => !open)}
        >
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
        </HomeSectionBand>
      ) : null}

      {/* 2026-08-25, direct correction: "If there is nothing to advise in
          line with their current stage of healing then it should say that
          there is nothing to report about it." Staying silent when
          stageNotes is empty read as the whole section having vanished,
          not as an honest "checked, nothing found" -- shown now whenever
          at least one tracked condition actually has a declared stage
          (matching declaredStages' own presence, not stageNotes' own),
          same "always confirm, never just go quiet" rule the verdict
          pill and dimension chart above already follow. */}
      {Object.keys(declaredStages).length > 0 ? (
        <HomeSectionBand
          title="Worth Knowing for Your Healing Stage"
          icon="leaf-outline"
          color={colors.statusYellowOnSurface}
          expanded={stageOpen}
          onToggle={() => setStageOpen((open) => !open)}
        >
          {stageNotes.length > 0 ? (
            stageNotes.map((note, index) => (
              <View key={index} style={index > 0 ? styles.stageNoteSpacing : undefined}>
                <Text style={styles.bodyTextBold}>{note.title}</Text>
                <Text style={styles.bodyText}>{note.message}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.bodyText}>Nothing in this dish is flagged for your current stage.</Text>
          )}
        </HomeSectionBand>
      ) : null}


      {/* 2026-09-01. Only rendered when something actually disagrees, so a
          dish whose ingredients all resolved cleanly says nothing extra. */}
      {prepMismatchNotes.length > 0 ? (
        <HomeSectionBand
          title="What These Numbers Are Based On"
          icon="information-circle-outline"
          color={tabColor}
          expanded={basisOpen}
          onToggle={() => setBasisOpen((open) => !open)}
        >
          <Text style={styles.bodyText}>
            The rest of this report uses the closest match this food database has. For these, that is a different
            preparation from the one you chose:
          </Text>
          {prepMismatchNotes.map((note, index) => (
            <Text key={index} style={styles.bodyText}>
              {note}
            </Text>
          ))}
        </HomeSectionBand>
      ) : null}
      <View style={[styles.headingBox, styles.buttonRow, { borderColor: tabColor }]}>
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
  // A column of bands, 2026-09-12 (see components/HomeSectionBand.tsx):
  // the heading and the buttons are plain band boxes, every section is a
  // fold band. Rendered inside a builder's own scrollContent, which keeps
  // its 16px so the loose buttons around the other cards stay inset, so
  // the column cancels that here the way the builders' own formCard does.
  // Before this the whole report was one colors.surface card with bordered
  // boxes nested inside it (2026-08-25).
  column: { marginHorizontal: -16, gap: HOME_BAND_GAP },
  headingBox: { ...homeBandStyle, padding: HOME_BAND_CONTENT_PADDING },
  eyebrow: { ...typography.eyebrow, marginBottom: 4, ...textShadow },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  // textPrimary rather than textMuted: textMuted measures under 3:1 on the
  // surface (2026-09-12).
  yield: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, marginTop: 2, ...textShadow },
  bodyTextBold: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  conditionBlock: { marginTop: 12 },
  conditionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  conditionName: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  verdictPill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  verdictPillText: { ...typography.caption, fontWeight: '400', color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  stageContextRow: { marginTop: 4, marginBottom: 4 },
  stageDescription: { ...typography.caption, color: colors.textPrimary, marginTop: 2, ...textShadow },
  setStageLink: { ...typography.captionEmphasis, marginTop: 4, textDecorationLine: 'underline', ...textShadow },
  stageNoteSpacing: { marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  buttonHalf: { flex: 1 },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis, ...textShadow },
});
