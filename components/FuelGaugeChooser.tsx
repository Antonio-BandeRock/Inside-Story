// Choose which nutrients Today's Fuel Gauges show (G31, 2026-09-27). Opens
// inside the gauges band on Home: every chosen nutrient on a row of its own
// with Earlier, Later and Take off, a searchable list of every nutrient with
// a daily target to add from, and a way back to the nine the app starts
// with. The list itself is held by the Home screen; this only draws it. See
// lib/fuelGaugeChoice.ts.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { sortByLabel } from '../lib/choiceOrder';
import {
  DEFAULT_FUEL_GAUGE_CODES,
  addFuelGauge,
  addableFuelGauges,
  fuelGaugeChoiceCaption,
  isDefaultFuelGaugeChoice,
  moveFuelGauge,
  removeFuelGauge,
} from '../lib/fuelGaugeChoice';
import { PopoverSelect } from './PopoverSelect';
import { ThumbEndRow } from './ThumbEndRow';

type Props = {
  codes: string[];
  nutrients: { nutrientCode: string; displayName: string }[];
  onChange: (codes: string[]) => void;
  onDone: () => void;
  accent: string;
};

export function FuelGaugeChooser({ codes, nutrients, onChange, onDone, accent }: Props) {
  const nameFor = (code: string) => nutrients.find((entry) => entry.nutrientCode === code)?.displayName ?? code;
  const addable = sortByLabel(addableFuelGauges(codes, nutrients));

  return (
    <View style={styles.block}>
      <Text style={styles.heading}>Choose nutrients</Text>
      <Text style={styles.caption}>{fuelGaugeChoiceCaption(codes)}</Text>
      {codes.map((code, index) => (
        <View key={code} style={styles.item}>
          <Text style={styles.itemName}>{nameFor(code)}</Text>
          <View style={styles.actions}>
            {index > 0 ? (
              <TouchableOpacity onPress={() => onChange(moveFuelGauge(codes, code, -1))} hitSlop={8}>
                <Text style={styles.action}>Earlier</Text>
              </TouchableOpacity>
            ) : null}
            {index < codes.length - 1 ? (
              <TouchableOpacity onPress={() => onChange(moveFuelGauge(codes, code, 1))} hitSlop={8}>
                <Text style={styles.action}>Later</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => onChange(removeFuelGauge(codes, code))} hitSlop={8}>
              <Text style={styles.action}>Take off</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {addable.length > 0 ? (
        <PopoverSelect
          options={addable}
          selected={null}
          onSelect={(code) => onChange(addFuelGauge(codes, code))}
          tabColor={accent}
          placeholder="Add a nutrient"
          searchable
          searchPlaceholder="Find a nutrient"
          width={240}
        />
      ) : null}
      <ThumbEndRow style={styles.footer}>
        {!isDefaultFuelGaugeChoice(codes) ? (
          <TouchableOpacity
            style={styles.button}
            onPress={() => onChange([...DEFAULT_FUEL_GAUGE_CODES])}
          >
            <Text style={styles.buttonText}>Put back the nine</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.button, { backgroundColor: accent, borderColor: accent }]} onPress={onDone}>
          <Text style={[styles.buttonText, styles.buttonTextOnAccent]}>Done</Text>
        </TouchableOpacity>
      </ThumbEndRow>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10, marginTop: 12 },
  heading: { ...typography.eyebrow, ...textShadow, color: colors.textMuted, fontWeight: '400' },
  caption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemName: { ...typography.body, ...textShadow, color: colors.textPrimary, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 14 },
  action: { ...typography.caption, ...textShadow, color: colors.textMuted },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
  },
  buttonText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  buttonTextOnAccent: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
});
