import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import type { FoodScore } from '../lib/db';
import {
  getSubCriterionSources,
  getTierDefinition,
  selectPrepTips,
  tierSeverity,
} from '../lib/sixDimensionsReference';

// Compact, tappable color-coded warning boxes for a single food's own
// 6-Dimension scores -- one box per RED-severity sub-criterion only.
//
// Deliberately shows nothing at all for green ("fine"), unknown ("Not
// Assessed"), AND yellow ("a real but moderate concern"), per an explicit
// product decision 2026-07-31: a food with no serious concern should
// render a visually clean row, so the eye only ever lands on something
// that genuinely needs attention.
//
// Why yellow is excluded, measured against the real database rather than
// assumed: including yellow leaves only 5.9% of the 22,016 foods with a
// clean row (median 2 boxes, max 9), which makes an empty row almost
// meaningless. One sub-criterion dominates that noise -- "Selenium & Zn
// synergy = Inhibiting" alone fires on 11,077 foods, roughly half the
// database, followed by "Sodium = Moderate" and "Saturated Fat =
// Moderate" at ~5,400 each. A warning that appears on half of all foods
// trains people to ignore warnings. Red-only leaves 62% of foods clean
// (median 1 box, max 5) and surfaces the concerns that actually matter
// here: high saturated fat, high sodium, gluten, high sugar, trans fat.
//
// Two accepted tradeoffs, both real information loss, stated plainly:
//   1. An empty row can't be told apart from a food this app has no data
//      for. "Not Assessed" genuinely is not the same claim as "this is
//      fine" (see TIER_DEFINITIONS' own note in
//      lib/sixDimensionsReference.ts). If that matters in real use, the
//      honest fix is a separate "no data" affordance, not recoloring
//      unknowns green.
//   2. Yellow-level concerns are invisible here. They remain available in
//      the food's own full 6-Dimension view, which shows every tier.
//
// Severity/tier vocabulary, the plain-language explanations, the
// actionable prep advice, and the citations are all reused as-is from
// lib/sixDimensionsReference.ts -- this component owns presentation only
// and deliberately introduces no health judgments of its own.
export function DimensionFlags({
  scores,
  onExplain,
  size = 12,
}: {
  scores: FoodScore[];
  // Opens the explanation for one tapped flag. Wired by the caller to its
  // own useInfoAlert() instance rather than owning a modal here, so this
  // stays a pure inline display component usable inside a tight list row.
  onExplain: (title: string, message: string) => void;
  size?: number;
}) {
  const flagged = scores.filter((score) => tierSeverity(score.tier) === 'red');

  if (flagged.length === 0) return null;

  return (
    <View style={styles.row}>
      {flagged.map((score, index) => (
        <TouchableOpacity
          key={`${score.subCriterion}-${index}`}
          style={[styles.box, { width: size, height: size, borderRadius: size / 4 }, styles.boxRed]}
          hitSlop={6}
          accessibilityLabel={`${score.subCriterion}: ${score.tier}. Tap for details.`}
          onPress={() => onExplain(...buildExplanation(score, scores))}
        />
      ))}
    </View>
  );
}

// Assembles the popup body for one flagged sub-criterion: what the rating
// means, what (if anything) can actually be done about it, and where the
// rating rule comes from. Every piece is pulled from the existing shared
// reference module rather than written here.
function buildExplanation(score: FoodScore, allScores: FoodScore[]): [string, string] {
  const title = `${score.subCriterion}: ${score.tier}`;

  const parts: string[] = [getTierDefinition(score.tier)];

  // Only a subset of sub-criteria have a real, actionable preparation fix
  // (see selectPrepTips' own comment on why it's deliberately narrow) --
  // when this food has one for THIS sub-criterion, it's the single most
  // useful thing to show, so it goes directly under the definition.
  const tip = selectPrepTips(allScores).find((prepTip) => prepTip.subCriterion === score.subCriterion);
  if (tip) {
    parts.push(`What you can do:\n${tip.instruction}`);
  }

  parts.push(`Source:\n${getSubCriterionSources(score.subCriterion)}`);

  return [title, parts.join('\n\n')];
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  box: { borderWidth: 1 },
  // Reuses the app's own existing status palette (colors.danger /
  // colors.statusYellow, the same pair Home's nutrient rings and Trends
  // already map severity onto) rather than introducing a second, parallel
  // set of warning colors.
  //
  // A muted, dark tinted fill + solid (lighter) border, rather than a
  // solid fill: colors.statusYellow (#7A5215) is a dark olive designed as
  // TEXT on its own chip background, so a solid-filled box in it would be
  // close to invisible against this app's dark navy surface. Filling with
  // each status's own *Bg tone (corrected 2026-08-01 from a stale pale
  // tint left over from the pre-redesign light theme -- see
  // constants/colors.ts's own comment on those two tokens) and carrying
  // the semantic color in the border keeps both severities legible on
  // dark while still using only existing tokens.
  boxRed: { backgroundColor: colors.statusRedBg, borderColor: colors.danger },
  boxYellow: { backgroundColor: colors.statusYellowBg, borderColor: colors.statusYellow },
});

// Kept for callers that want the same "is there anything to warn about"
// answer without rendering (e.g. deciding whether to fetch/show a row at
// all) -- same filter as the component itself, so the two can never drift.
export function hasDimensionFlags(scores: FoodScore[]): boolean {
  return scores.some((score) => {
    const severity = tierSeverity(score.tier);
    return severity === 'yellow' || severity === 'red';
  });
}
