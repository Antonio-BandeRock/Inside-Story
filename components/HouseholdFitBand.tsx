// Who in the household it suits (G20, 2026-09-27): one line per person,
// the person first and then each family member from Life > Conditions,
// on a recipe, a scan and Check a Label. Shown only when there is a
// family member, since a single line would repeat the For You phrase,
// except on a person's own recipe, which has no For You card (G26).
// The lines themselves come from lib/householdFit.ts.
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import { getHouseholdPeople } from "../lib/foodPersonalization";
import {
  HOUSEHOLD_FIT_CAPTION,
  type HouseholdLine,
  type HouseholdPerson,
} from "../lib/householdFit";
import { HOUSEHOLD_TAP_CAPTION } from "../lib/recipeConditionLine";

/** Everyone in the household, read once when the view opens. Empty until read. */
export function useHouseholdPeople(): HouseholdPerson[] {
  const [people, setPeople] = useState<HouseholdPerson[]>([]);
  useEffect(() => {
    let cancelled = false;
    getHouseholdPeople()
      .then((result) => {
        if (!cancelled) setPeople(result);
      })
      .catch((error) =>
        console.error("[HouseholdFitBand] Failed to load the household", error),
      );
    return () => {
      cancelled = true;
    };
  }, []);
  return people;
}

export function householdToneColor(tone: HouseholdLine["tone"]): string {
  return tone === "fits"
    ? colors.statusGood
    : tone === "caution"
      ? colors.statusYellowStandalone
      : colors.danger;
}

// G26: a person's own recipe shows its line even when nobody else is in
// the household (single), and a tapped line opens the detail per
// condition (onPressLine).
export function HouseholdFitBand({
  lines,
  tabColor,
  single,
  onPressLine,
}: {
  lines: HouseholdLine[];
  tabColor: string;
  single?: { heading: string; caption: string };
  onPressLine?: (line: HouseholdLine) => void;
}) {
  if (lines.length === 0) return null;
  if (lines.length < 2 && !single) return null;
  const alone = lines.length < 2 && single;
  return (
    <View style={[styles.box, { borderColor: tabColor }]}>
      <Text style={[styles.heading, { color: tabColor }]}>{alone ? single.heading : "Who it suits"}</Text>
      {lines.map((line) => (
        <TouchableOpacity
          key={line.personId}
          style={styles.row}
          activeOpacity={0.7}
          disabled={!onPressLine}
          onPress={() => onPressLine?.(line)}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: householdToneColor(line.tone) },
            ]}
          />
          <View style={styles.rowText}>
            <Text style={styles.line}>
              <Text style={styles.who}>{line.who}: </Text>
              {line.phrase}
            </Text>
            {line.unchecked ? (
              <Text style={styles.caption}>{line.unchecked}</Text>
            ) : null}
          </View>
          {onPressLine ? (
            <Ionicons name="information-circle-outline" size={18} color={tabColor} style={styles.info} />
          ) : null}
        </TouchableOpacity>
      ))}
      <Text style={styles.caption}>{alone ? single.caption : HOUSEHOLD_FIT_CAPTION}</Text>
      {onPressLine && !alone ? <Text style={styles.caption}>{HOUSEHOLD_TAP_CAPTION}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginVertical: 8,
  },
  heading: { ...typography.label, ...textShadow },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  info: { marginTop: 2 },
  rowText: { flex: 1, gap: 2 },
  line: { ...typography.body, color: colors.textPrimary, ...textShadow },
  who: { ...typography.bodyEmphasis, color: colors.textPrimary },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
});
