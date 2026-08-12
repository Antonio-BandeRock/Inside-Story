import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import {
  ABV_PRESETS,
  ALCOHOL_RETENTION_CITATION,
  ALCOHOL_RETENTION_OPTIONS,
  RESIDUAL_SUGAR_PRESETS,
  VOLUME_ML_PRESETS,
  calculateAlcoholEstimate,
} from '../lib/alcoholCalculator';
import { parseAmountValue } from '../lib/measurement';
import { volumeToMl } from '../lib/unitConversion';
import { PopoverSelect } from './PopoverSelect';

// A shared, standalone calculator panel -- 2026-08-10, built into the four
// builders whose own category allowlist includes Alcohol (Beverage,
// Fermentation, Soup, Sauces -- see constants/foodBuilderCategories.ts).
// Same non-gating, tap-to-open shape as the alcohol/coffee/juice advisory
// rows already sitting right above wherever this renders, but this one
// expands IN PLACE into a real interactive form rather than opening a
// static HelpSheet, since it needs live picker fields and a live-computed
// result, not fixed prose. Deliberately NOT built as a React Native
// <Modal> -- this app's own OverlayContext (see that file's header
// comment) is a single, app-root-level portal, and RN's <Modal> opens its
// own separate native window on Android; a PopoverSelect field opened from
// INSIDE a <Modal> would call showOverlay() and paint behind that
// separate window, not above it. An inline expandable section (the same
// Animated.View/LinearTransition pattern these builders already use for
// field reordering) avoids that conflict entirely and needs no new
// portal/z-order mechanism.
//
// See lib/alcoholCalculator.ts's own header comment for the real, cited
// math and constants this renders.

// Stable module-level reference (not rebuilt on every render) so
// PopoverSelect's own memoization actually holds for this one field --
// see that component's own comment on why a referentially-stable options
// array matters for it.
const RETENTION_SELECT_OPTIONS = ALCOHOL_RETENTION_OPTIONS.map((option) => ({
  label: option.label,
  value: option.id,
}));

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function AlcoholCalculatorPanel({
  tabColor,
  quantity,
  unit,
}: {
  tabColor: string;
  // The ingredient's own already-chosen Quantity/Unit (each builder's own
  // `quantity`/`unit` state) -- used only to prefill this panel's own
  // Volume field the first time it's opened, when the unit is a real
  // volume unit. Never read again after that first prefill, so editing
  // either field here never fights a person's own later change to the
  // real ingredient quantity/unit.
  quantity: string | null;
  unit: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [volumeMl, setVolumeMl] = useState<string | null>(null);
  const [abvPercent, setAbvPercent] = useState<string | null>(null);
  const [residualSugar, setResidualSugar] = useState<string | null>('0');
  const [retentionId, setRetentionId] = useState('not-cooked');

  const prefillVolumeMl = useMemo(() => {
    if (!quantity || !unit) return null;
    const amount = parseAmountValue(quantity);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return volumeToMl(amount, unit);
  }, [quantity, unit]);

  useEffect(() => {
    if (expanded && volumeMl === null && prefillVolumeMl !== null) {
      setVolumeMl(String(roundTo(prefillVolumeMl, 1)));
    }
  }, [expanded, volumeMl, prefillVolumeMl]);

  const retentionOption =
    ALCOHOL_RETENTION_OPTIONS.find((option) => option.id === retentionId) ?? ALCOHOL_RETENTION_OPTIONS[0];
  const parsedVolume = volumeMl ? Number(volumeMl) : null;
  const parsedAbv = abvPercent ? Number(abvPercent) : null;
  const parsedSugarRaw = residualSugar ? Number(residualSugar) : 0;
  const parsedSugar = Number.isFinite(parsedSugarRaw) ? parsedSugarRaw : 0;

  const result =
    parsedVolume !== null && Number.isFinite(parsedVolume) && parsedVolume > 0 && parsedAbv !== null && Number.isFinite(parsedAbv) && parsedAbv > 0
      ? calculateAlcoholEstimate({
          volumeMl: parsedVolume,
          abvPercent: parsedAbv,
          residualSugarGPerL: parsedSugar,
          retainedPercent: retentionOption.retainedPercent,
        })
      : null;

  return (
    <View>
      <TouchableOpacity style={[styles.toggleRow, { borderColor: tabColor }]} onPress={() => setExpanded((value) => !value)}>
        <Ionicons name="calculator-outline" size={16} color={tabColor} />
        <Text style={[styles.toggleText, { color: tabColor }]}>Alcohol calculator -- estimate ethanol &amp; calories</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={tabColor} />
      </TouchableOpacity>

      {expanded && (
        <Animated.View layout={LinearTransition} style={[styles.panel, { borderColor: tabColor }]}>
          <Text style={styles.panelIntro}>
            A separate, standalone estimate for your own real pour, alongside Quantity and Unit above (which still
            decide what actually gets tracked for this ingredient). Useful when your bottle&apos;s real proof or a
            recipe&apos;s cook time doesn&apos;t closely match the database entry you picked.
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: tabColor }]}>Volume</Text>
            <PopoverSelect
              options={VOLUME_ML_PRESETS}
              selected={volumeMl}
              onSelect={setVolumeMl}
              tabColor={tabColor}
              width={220}
              searchable
              placeholder="Choose a volume"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: tabColor }]}>ABV (% Alcohol)</Text>
            <PopoverSelect
              options={ABV_PRESETS}
              selected={abvPercent}
              onSelect={setAbvPercent}
              tabColor={tabColor}
              width={240}
              searchable
              placeholder="Choose an ABV"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: tabColor }]}>Residual Sugar</Text>
            <PopoverSelect
              options={RESIDUAL_SUGAR_PRESETS}
              selected={residualSugar}
              onSelect={setResidualSugar}
              tabColor={tabColor}
              width={220}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: tabColor }]}>Cooking / Cook Time</Text>
            <PopoverSelect
              options={RETENTION_SELECT_OPTIONS}
              selected={retentionId}
              onSelect={setRetentionId}
              tabColor={tabColor}
              width={240}
            />
          </View>

          {result ? (
            <View style={[styles.resultBox, { borderColor: tabColor }]}>
              <Text style={styles.resultLine}>
                Ethanol: {roundTo(result.ethanolGramsRetained, 1)} g
                {retentionOption.retainedPercent < 100 ? ` (${roundTo(result.ethanolGramsRaw, 1)} g before cooking)` : ''}
              </Text>
              <Text style={styles.resultLine}>Calories from alcohol: ~{Math.round(result.ethanolCalories)} kcal</Text>
              {parsedSugar > 0 && (
                <Text style={styles.resultLine}>Calories from residual sugar: ~{Math.round(result.sugarCalories)} kcal</Text>
              )}
              <Text style={[styles.resultTotal, { color: tabColor }]}>Estimated total: ~{Math.round(result.totalCalories)} kcal</Text>
            </View>
          ) : (
            <Text style={styles.resultPrompt}>Choose a volume and ABV to see the estimate.</Text>
          )}

          <Text style={styles.citation}>{ALCOHOL_RETENTION_CITATION}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  toggleText: { ...typography.caption, flex: 1 },
  panel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    gap: 10,
    backgroundColor: colors.surface,
  },
  panelIntro: { ...typography.caption, color: colors.textMuted },
  fieldBlock: { gap: 4 },
  fieldLabel: { ...typography.eyebrow },
  resultBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  resultLine: { ...typography.body, color: colors.textPrimary },
  resultTotal: { ...typography.bodyEmphasis, marginTop: 2 },
  resultPrompt: { ...typography.caption, color: colors.textMuted },
  citation: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
});
