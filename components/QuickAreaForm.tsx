import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BUTTON_SHADOW, colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import { createGardenPlot, type GardenPlot } from "../lib/db";
import { insideChoices, ON_ITS_OWN } from "../lib/gardenAreaNesting";
import { AppTextInput } from "./AppTextInput";
import { GardenSpaceField } from "./GardenSpaceField";
import { PopoverSelect } from "./PopoverSelect";

// A short form for a new garden area, opened in place from a form that asks
// which area something is for, so nobody has to leave what they are
// entering to go and make one (Growing Costs since 2026-09-20, Record a
// Reading since 1.0.55.33: "Recording a Reading needs an option to create an
// area if they don't have any areas to go with").
//
// It asks only the name, where it grows, the area it stands inside if any
// (a tent in a grow room, lib/gardenAreaNesting.ts) and the kind of space.
// Size, sunlight, lights and zone stay on Plots & Plantings. Saving writes
// the same garden_plots row Plots & Plantings does and hands its id back.

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const ON_ITS_OWN_VALUE = "__own__";

type AreaLocationType = "outdoor" | "indoor" | "greenhouse";
const LOCATION_OPTIONS: { label: string; value: AreaLocationType }[] = [
  { label: "Greenhouse", value: "greenhouse" },
  { label: "Indoor", value: "indoor" },
  { label: "Outdoor", value: "outdoor" },
];

export function QuickAreaForm(props: {
  /** Current areas, for the Inside picker. */
  areas: GardenPlot[];
  /** What saving does for the form it was opened from. */
  caption: string;
  backLabel: string;
  onSaved: (id: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState<AreaLocationType>("outdoor");
  const [insideId, setInsideId] = useState<string | null>(null);
  const [space, setSpace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const insideOptions = [
    { label: ON_ITS_OWN, value: ON_ITS_OWN_VALUE },
    ...insideChoices(null, props.areas),
  ];

  async function handleSave() {
    if (!name.trim()) {
      setError("Give the area a name.");
      return;
    }
    if (saving) return;
    setSaving(true);
    const id = await createGardenPlot({
      name,
      locationType: location,
      spaceType: space,
      insidePlotId: insideId,
    });
    setSaving(false);
    props.onSaved(id);
  }

  return (
    <View style={styles.nestedForm}>
      <Text style={styles.fieldLabel}>New area</Text>
      <AppTextInput
        style={styles.textInput}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="Tent 1, or the back bed"
      />
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Where</Text>
        <PopoverSelect
          options={LOCATION_OPTIONS}
          selected={location}
          onSelect={(value) => setLocation(value as AreaLocationType)}
          tabColor={TAB_COLOR}
        />
      </View>
      {props.areas.length > 0 ? (
        <>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Inside</Text>
            <PopoverSelect
              options={insideOptions}
              selected={insideId ?? ON_ITS_OWN_VALUE}
              onSelect={(value) => {
                const picked = value === ON_ITS_OWN_VALUE ? null : value;
                setInsideId(picked);
                const room = props.areas.find((area) => area.id === picked);
                if (room) setLocation(room.locationType);
              }}
              tabColor={TAB_COLOR}
              width={220}
            />
          </View>
          <Text style={styles.captionText}>
            A tent or a section in a room, or a bed in a larger garden, can
            stand inside that area and keep separate lights, fans, heating,
            cooling and readings.
          </Text>
        </>
      ) : null}
      <GardenSpaceField label="Space" selected={space} onSelect={setSpace} />
      <Text style={styles.captionText}>{props.caption}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: PRIMARY_BUTTON_BACKGROUND },
          ]}
          onPress={handleSave}
        >
          <Text style={styles.primaryButtonText}>Save Area</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={props.onBack}>
          <Text style={styles.linkText}>{props.backLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  captionText: {
    ...typography.caption,
    color: colors.textMuted,
    ...textShadow,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  nestedForm: {
    gap: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: TAB_COLOR,
    marginVertical: 4,
  },
  primaryButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    ...BUTTON_SHADOW,
  },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: "400",
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
