// Who in the household it suits (G20, 2026-09-27): one line per person,
// the person first and then each family member from Life > Conditions,
// on a recipe, a scan and Check a Label. Shown only when there is a
// family member, since a single line would repeat the For You phrase.
// The lines themselves come from lib/householdFit.ts.
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import { getHouseholdPeople } from "../lib/foodPersonalization";
import {
  HOUSEHOLD_FIT_CAPTION,
  type HouseholdLine,
  type HouseholdPerson,
} from "../lib/householdFit";

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

export function HouseholdFitBand({
  lines,
  tabColor,
}: {
  lines: HouseholdLine[];
  tabColor: string;
}) {
  if (lines.length < 2) return null;
  return (
    <View style={[styles.box, { borderColor: tabColor }]}>
      <Text style={[styles.heading, { color: tabColor }]}>Who it suits</Text>
      {lines.map((line) => (
        <View key={line.personId} style={styles.row}>
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
        </View>
      ))}
      <Text style={styles.caption}>{HOUSEHOLD_FIT_CAPTION}</Text>
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
  rowText: { flex: 1, gap: 2 },
  line: { ...typography.body, color: colors.textPrimary, ...textShadow },
  who: { ...typography.bodyEmphasis, color: colors.textPrimary },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
});
