import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  ABV_PRESETS,
  ALCOHOL_RETENTION_CITATION,
  ALCOHOL_RETENTION_OPTIONS,
  POURS_PRESETS,
  RESIDUAL_SUGAR_PRESETS,
  VOLUME_ML_PRESETS,
  calculateAlcoholEstimate,
} from '../lib/alcoholCalculator';
import type { AlcoholCalculatorOverride } from '../lib/db';
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
//
// 2026-08-11: became a real, tracked-value source, not just an
// informational display -- direct request, given the whole point of
// filling this in is to describe your own real pour. The moment Volume
// and ABV are both filled (Pours defaults to 1), this panel reports its
// own computed calories/carbs upward via `onOverrideChange`, and the
// parent builder both auto-fills Quantity/Unit from it (total volume in
// mL) AND saves those calories/carbs directly for this ingredient,
// bypassing the plain database-row lookup entirely -- see
// getBeverageNutrientBreakdown's own comment in lib/db.ts for the read
// side. No separate "confirm" button: reactive and live, the same as
// every other field here already was, so filling this in IS using it.
// Clearing Volume or ABV back out (`result` becomes null) reports `null`
// upward too, handing tracking back to the plain Quantity/Unit fields.

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
  onOverrideChange,
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
  // Fires every time the computed result changes -- a real override
  // object the instant Volume+ABV are both valid, `null` the instant
  // either gets cleared back out. `suggestedQuantity`/`suggestedUnit` are
  // the honest, literal total volume (Volume x Pours, in mL) for the
  // parent builder to auto-fill its own Quantity/Unit fields with, so a
  // person never has to separately compute or type that number by hand.
  onOverrideChange: (override: AlcoholCalculatorOverride | null, suggestedQuantity: string, suggestedUnit: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [volumeMl, setVolumeMl] = useState<string | null>(null);
  const [abvPercent, setAbvPercent] = useState<string | null>(null);
  const [residualSugar, setResidualSugar] = useState<string | null>('0');
  const [retentionId, setRetentionId] = useState('not-cooked');
  const [pours, setPours] = useState('1');

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
  const parsedPoursRaw = Number(pours);
  const parsedPours = Number.isFinite(parsedPoursRaw) && parsedPoursRaw > 0 ? parsedPoursRaw : 1;

  // Pours multiplies straight into the volume passed to
  // calculateAlcoholEstimate -- the formula is linear in volume, so this
  // is the exact total across every pour, not a separate approximation
  // layered on top.
  const totalVolumeMl = parsedVolume !== null ? parsedVolume * parsedPours : null;

  const result =
    totalVolumeMl !== null && Number.isFinite(totalVolumeMl) && totalVolumeMl > 0 && parsedAbv !== null && Number.isFinite(parsedAbv) && parsedAbv > 0
      ? calculateAlcoholEstimate({
          volumeMl: totalVolumeMl,
          abvPercent: parsedAbv,
          residualSugarGPerL: parsedSugar,
          retainedPercent: retentionOption.retainedPercent,
        })
      : null;

  useEffect(() => {
    if (result && totalVolumeMl !== null && parsedAbv !== null) {
      onOverrideChange(
        {
          volumeMl: parsedVolume ?? totalVolumeMl,
          abvPercent: parsedAbv,
          residualSugarGPerL: parsedSugar,
          retentionId,
          pours: parsedPours,
          calories: roundTo(result.totalCalories, 1),
          carbsG: roundTo(result.sugarGrams, 1),
        },
        String(roundTo(totalVolumeMl, 1)),
        'ml',
      );
    } else {
      onOverrideChange(null, '', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, totalVolumeMl, parsedVolume, parsedAbv, parsedSugar, retentionId, parsedPours]);

  return (
    <View>
      <TouchableOpacity style={[styles.toggleRow, { borderColor: tabColor }]} onPress={() => setExpanded((value) => !value)}>
        <Ionicons name="calculator-outline" size={16} color={tabColor} />
        <Text style={[styles.toggleText, { color: tabColor }]}>Alcohol calculator: estimate ethanol &amp; calories</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={tabColor} />
      </TouchableOpacity>

      {expanded && (
        <Animated.View layout={LinearTransition} style={[styles.panel, { borderColor: tabColor }]}>
          <Text style={styles.panelIntro}>
            Tell us about your actual drink (its size, proof, and how many pours) and we&apos;ll use that,
            instead of the database&apos;s standard serving, to track this ingredient&apos;s calories and carbs.
            Fill in Volume and ABV below and this takes over from Quantity and Unit above automatically; clear
            either one back out and Quantity/Unit take over again.
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: tabColor }]}>Volume (per pour)</Text>
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
            <Text style={[styles.fieldLabel, { color: tabColor }]}>Pours</Text>
            <PopoverSelect
              options={POURS_PRESETS}
              selected={pours}
              onSelect={setPours}
              tabColor={tabColor}
              width={160}
            />
            <Text style={styles.fieldHint}>
              How many of that pour you&apos;re having: 1 shot, 3 glasses of wine, etc. Volume above x Pours is
              the total that gets tracked.
            </Text>
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
            <Text style={styles.fieldHint}>
              The % Alc/Vol printed on the bottle. A higher number means more alcohol (and more calories) in the
              same size pour.
            </Text>
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
            <Text style={styles.fieldHint}>
              The natural sugar left over in the drink itself, separate from the alcohol: higher in a sweet
              wine, cordial, or liqueur, close to zero in a dry wine or a plain spirit like vodka or whiskey.
              Leave at &quot;Dry / None&quot; if you&apos;re not sure.
            </Text>
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
            <Text style={styles.fieldHint}>
              Cooking or flambéing burns some alcohol off but never all of it. If you&apos;re just pouring and
              drinking it (a shot, a glass of wine, a mixed drink), leave this at &quot;Not Cooked.&quot;
            </Text>
          </View>

          {result ? (
            <View style={[styles.resultBox, { borderColor: tabColor }]}>
              {parsedPours > 1 && parsedVolume !== null && (
                <Text style={styles.resultLine}>
                  {parsedPours} pours x {roundTo(parsedVolume, 1)} ml = {roundTo(totalVolumeMl ?? 0, 1)} ml total
                </Text>
              )}
              <Text style={styles.resultLine}>
                Ethanol: {roundTo(result.ethanolGramsRetained, 1)} g
                {retentionOption.retainedPercent < 100 ? ` (${roundTo(result.ethanolGramsRaw, 1)} g before cooking)` : ''}
              </Text>
              <Text style={styles.resultLine}>Calories from alcohol: ~{Math.round(result.ethanolCalories)} kcal</Text>
              {parsedSugar > 0 && (
                <Text style={styles.resultLine}>Calories from residual sugar: ~{Math.round(result.sugarCalories)} kcal</Text>
              )}
              <Text style={[styles.resultTotal, { color: tabColor }]}>Estimated total: ~{Math.round(result.totalCalories)} kcal</Text>
              <View style={[styles.trackedBanner, { borderColor: tabColor, backgroundColor: `${tabColor}1A` }]}>
                <Ionicons name="checkmark-circle" size={14} color={tabColor} />
                <Text style={[styles.trackedBannerText, { color: tabColor }]}>
                  Tracking this now, not the database&apos;s standard serving; Quantity and Unit above have been
                  updated to your total.
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.resultPrompt}>
              Fill in Volume and ABV above and we&apos;ll track your pour here instead of the database&apos;s
              standard serving.
            </Text>
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
  toggleText: { ...typography.caption, flex: 1, ...textShadow },
  panel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    gap: 10,
    backgroundColor: colors.surface,
  },
  panelIntro: { ...typography.caption, color: colors.textMuted, ...textShadow },
  fieldBlock: { gap: 4 },
  fieldLabel: { ...typography.eyebrow, ...textShadow },
  fieldHint: { ...typography.caption, color: colors.textMuted, fontSize: 11, ...textShadow },
  resultBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  resultLine: { ...typography.body, color: colors.textPrimary, ...textShadow },
  resultTotal: { ...typography.bodyEmphasis, marginTop: 2, ...textShadow },
  trackedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  trackedBannerText: { ...typography.caption, flex: 1, ...textShadow },
  resultPrompt: { ...typography.caption, color: colors.textMuted, ...textShadow },
  citation: { ...typography.caption, color: colors.textMuted, fontSize: 11, ...textShadow },
});
