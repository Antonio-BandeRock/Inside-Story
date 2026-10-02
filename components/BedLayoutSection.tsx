// Lay Out This Area (I8, 2026-10-02): the area drawn to scale from its
// length and width, with each current planting given a patch on it. Pick a
// planting, then tap the plan where it goes; a picked patch moves a grid
// square at a time and grows or shrinks across and down. Dots show about
// where plants sit at the closest spacing its growing guide gives. Every
// sentence is a caption, and an overlap is said rather than refused.
//
// Taps are read by one Pressable laid over the drawing, and the patch under
// the tap is found in lib/bedLayout.ts (patchAt), so the same code answers
// on a phone and on the desktop. The arithmetic and every sentence live in
// lib/bedLayout.ts; reading and writing in lib/bedLayoutDb.ts.

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  LAYOUT_INTRO,
  LAYOUT_NO_SIZE,
  LAYOUT_PAST_NOTE,
  areaSizeCm,
  clampPatch,
  describePatch,
  formatLength,
  gridLineEvery,
  gridStepCm,
  newPatch,
  parseSpacing,
  patchAt,
  patchesOverlap,
  planScale,
  plantPoints,
  type LayoutPatch,
  type LayoutUnit,
} from '../lib/bedLayout';
import { listLayoutPatches, removeLayoutPatch, saveLayoutPatch } from '../lib/bedLayoutDb';
import { findCropGuide } from '../lib/cropGuides';
import { updateGardenPlot, type GardenPlanting, type GardenPlot } from '../lib/db';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

const TAB_COLOR = colors.tabGarden;
const MAX_PLAN_HEIGHT = 420;

const UNIT_OPTIONS = [
  { label: 'Feet', value: 'feet' },
  { label: 'Metres', value: 'meters' },
];

function isCurrent(status: string): boolean {
  return status === 'growing' || status === 'planned';
}

function shortName(planting: GardenPlanting): string {
  const guide = findCropGuide(planting.foodName);
  const base = guide?.name ?? planting.foodName.split(',')[0];
  return planting.varietyNote ? `${base} (${planting.varietyNote})` : base;
}

type Props = {
  plot: GardenPlot;
  plantings: readonly GardenPlanting[];
  /** Called after the area's size is saved, so the screen reads it again. */
  onSizeSaved: () => void;
};

export function BedLayoutSection({ plot, plantings, onSizeSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [patches, setPatches] = useState<LayoutPatch[]>([]);
  const [placing, setPlacing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [roomWidth, setRoomWidth] = useState(0);
  const [lengthText, setLengthText] = useState('');
  const [widthText, setWidthText] = useState('');
  const [unitChoice, setUnitChoice] = useState<LayoutUnit>(plot.sizeUnit ?? 'meters');
  const [error, setError] = useState<string | null>(null);

  const unit: LayoutUnit = plot.sizeUnit ?? 'meters';
  const size = areaSizeCm(plot.length, plot.width, plot.sizeUnit);
  const step = gridStepCm(unit);

  const reload = useCallback(async () => {
    setPatches(await listLayoutPatches(plot.id));
  }, [plot.id]);

  useEffect(() => {
    if (open) reload().catch(() => undefined);
  }, [open, reload]);

  const byId = useMemo(() => new Map(plantings.map((planting) => [planting.id, planting])), [plantings]);
  const currentPatches = patches.filter((patch) => isCurrent(byId.get(patch.plantingId)?.status ?? ''));
  const pastPatches = patches.filter((patch) => {
    const planting = byId.get(patch.plantingId);
    return planting && !isCurrent(planting.status);
  });
  const placedIds = new Set(currentPatches.map((patch) => patch.plantingId));
  const unplaced = plantings.filter((planting) => isCurrent(planting.status) && !placedIds.has(planting.id));
  const selectedPatch = currentPatches.find((patch) => patch.plantingId === selected) ?? null;

  function spacingFor(plantingId: string) {
    const planting = byId.get(plantingId);
    return planting ? parseSpacing(findCropGuide(planting.foodName)?.spacing) : null;
  }

  async function store(patch: LayoutPatch) {
    if (!size) return;
    const fitted = clampPatch(patch, size.across, size.down);
    setPatches((current) => [...current.filter((p) => p.plantingId !== fitted.plantingId), fitted]);
    await saveLayoutPatch(plot.id, fitted);
  }

  function handlePlanPress(event: GestureResponderEvent, scale: number) {
    if (!size || scale <= 0) return;
    const x = event.nativeEvent.locationX / scale;
    const y = event.nativeEvent.locationY / scale;
    if (placing) {
      const patch = newPatch(placing, x, y, spacingFor(placing), step, size.across, size.down);
      setPlacing(null);
      setSelected(patch.plantingId);
      store(patch).catch(() => undefined);
      return;
    }
    const hit = patchAt(currentPatches, x, y);
    if (hit) {
      setSelected(hit.plantingId);
      return;
    }
    if (selectedPatch) {
      store({ ...selectedPatch, x: Math.floor(x / step) * step, y: Math.floor(y / step) * step }).catch(() => undefined);
    }
  }

  function nudge(dx: number, dy: number, dw: number, dh: number) {
    if (!selectedPatch) return;
    store({
      ...selectedPatch,
      x: selectedPatch.x + dx * step,
      y: selectedPatch.y + dy * step,
      w: Math.max(step, selectedPatch.w + dw * step),
      h: Math.max(step, selectedPatch.h + dh * step),
    }).catch(() => undefined);
  }

  async function handleTakeOff() {
    if (!selectedPatch) return;
    const id = selectedPatch.plantingId;
    setSelected(null);
    setPatches((current) => current.filter((patch) => patch.plantingId !== id));
    await removeLayoutPatch(id);
  }

  async function handleSaveSize() {
    const length = parseFloat(lengthText.replace(',', '.'));
    const width = parseFloat(widthText.replace(',', '.'));
    if (!(length > 0) || !(width > 0)) {
      setError('Both a length and a width above zero are needed.');
      return;
    }
    setError(null);
    await updateGardenPlot(plot.id, { length, width, sizeUnit: unitChoice });
    onSizeSaved();
  }

  function renderSizeForm() {
    return (
      <View style={styles.group}>
        <Text style={styles.bodyText}>{LAYOUT_NO_SIZE}</Text>
        <View style={styles.sizeRow}>
          <AppTextInput
            style={[styles.textInput, styles.sizeInput]}
            value={lengthText}
            onChangeText={setLengthText}
            keyboardType="decimal-pad"
            placeholder="Length"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Length of this area"
          />
          <AppTextInput
            style={[styles.textInput, styles.sizeInput]}
            value={widthText}
            onChangeText={setWidthText}
            keyboardType="decimal-pad"
            placeholder="Width"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Width of this area"
          />
          <PopoverSelect options={UNIT_OPTIONS} selected={unitChoice} onSelect={(value) => setUnitChoice(value as LayoutUnit)} tabColor={TAB_COLOR} width={120} />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={() => handleSaveSize().catch(() => undefined)}>
          <Text style={styles.primaryButtonText}>Save the Size</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderPlan() {
    if (!size) return null;
    const scale = planScale(size.across, size.down, roomWidth, MAX_PLAN_HEIGHT);
    const drawW = size.across * scale;
    const drawH = size.down * scale;
    const everyX = gridLineEvery(size.across, step);
    const everyY = gridLineEvery(size.down, step);
    const linesX: number[] = [];
    for (let x = step * everyX; x < size.across - 1e-6; x += step * everyX) linesX.push(x);
    const linesY: number[] = [];
    for (let y = step * everyY; y < size.down - 1e-6; y += step * everyY) linesY.push(y);

    return (
      <View onLayout={(event) => setRoomWidth(event.nativeEvent.layout.width)} style={styles.planRoom}>
        {scale > 0 ? (
          <Pressable
            onPress={(event) => handlePlanPress(event, scale)}
            style={{ width: drawW, height: drawH }}
            accessibilityRole="button"
            accessibilityLabel={placing ? 'Tap where this planting goes' : 'Plan of this area'}
          >
            <View pointerEvents="none">
              <Svg width={drawW} height={drawH}>
                <Rect x={0} y={0} width={drawW} height={drawH} fill={colors.surface} stroke={TAB_COLOR} strokeWidth={2} />
                {linesX.map((x) => (
                  <Line key={`x${x}`} x1={x * scale} y1={0} x2={x * scale} y2={drawH} stroke={colors.border} strokeWidth={0.5} />
                ))}
                {linesY.map((y) => (
                  <Line key={`y${y}`} x1={0} y1={y * scale} x2={drawW} y2={y * scale} stroke={colors.border} strokeWidth={0.5} />
                ))}
                {showPast
                  ? pastPatches.map((patch) => (
                      <Rect
                        key={`past${patch.plantingId}`}
                        x={patch.x * scale}
                        y={patch.y * scale}
                        width={patch.w * scale}
                        height={patch.h * scale}
                        fill="none"
                        stroke={colors.textMuted}
                        strokeWidth={1}
                        strokeDasharray="4 3"
                      />
                    ))
                  : null}
                {currentPatches.map((patch) => {
                  const spacing = spacingFor(patch.plantingId);
                  const points = spacing ? plantPoints(patch, spacing.lowCm) : [];
                  const isPicked = patch.plantingId === selected;
                  const planting = byId.get(patch.plantingId);
                  return [
                    <Rect
                      key={`r${patch.plantingId}`}
                      x={patch.x * scale}
                      y={patch.y * scale}
                      width={patch.w * scale}
                      height={patch.h * scale}
                      fill={TAB_COLOR}
                      fillOpacity={0.3}
                      stroke={isPicked ? colors.primary : TAB_COLOR}
                      strokeWidth={isPicked ? 3 : 1.5}
                    />,
                    ...points.map((point, index) => (
                      <Circle
                        key={`d${patch.plantingId}${index}`}
                        cx={point.x * scale}
                        cy={point.y * scale}
                        r={Math.max(1.5, Math.min(5, (spacing?.lowCm ?? 0) * scale * 0.15))}
                        fill={colors.textPrimary}
                        fillOpacity={0.7}
                      />
                    )),
                    patch.w * scale > 28 && planting ? (
                      <SvgText key={`t${patch.plantingId}`} x={patch.x * scale + 4} y={patch.y * scale + 13} fontSize={11} fill={colors.textPrimary}>
                        {shortName(planting)}
                      </SvgText>
                    ) : null,
                  ];
                })}
              </Svg>
            </View>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function renderSelected() {
    if (!selectedPatch) return null;
    const planting = byId.get(selectedPatch.plantingId);
    if (!planting) return null;
    const overlapsWith = currentPatches
      .filter((other) => other.plantingId !== selectedPatch.plantingId && patchesOverlap(other, selectedPatch))
      .map((other) => {
        const otherPlanting = byId.get(other.plantingId);
        return otherPlanting ? shortName(otherPlanting) : '';
      })
      .filter(Boolean);
    const lines = describePatch({ patch: selectedPatch, unit, spacing: spacingFor(selectedPatch.plantingId), overlapsWith });
    return (
      <View style={styles.selectedCard}>
        <Text style={styles.fieldLabel}>{shortName(planting)}</Text>
        {lines.map((line) => (
          <Text key={line} style={styles.captionText}>
            {line}
          </Text>
        ))}
        <Text style={styles.captionText}>Tap an empty part of the plan to move it there, or use the arrows.</Text>
        <View style={styles.controlRow}>
          {(
            [
              ['arrow-back', 'Move left', -1, 0],
              ['arrow-forward', 'Move right', 1, 0],
              ['arrow-up', 'Move up', 0, -1],
              ['arrow-down', 'Move down', 0, 1],
            ] as const
          ).map(([icon, label, dx, dy]) => (
            <TouchableOpacity key={icon} onPress={() => nudge(dx, dy, 0, 0)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label}>
              <Ionicons name={icon} size={20} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.controlRow}>
          {(
            [
              ['More Across', 1, 0],
              ['Less Across', -1, 0],
              ['More Down', 0, 1],
              ['Less Down', 0, -1],
            ] as const
          ).map(([label, dw, dh]) => (
            <TouchableOpacity key={label} onPress={() => nudge(0, 0, dw, dh)} style={styles.smallButton} accessibilityRole="button">
              <Text style={styles.linkText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={() => handleTakeOff().catch(() => undefined)} accessibilityRole="button">
            <Text style={styles.linkText}>Take Off the Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(null)} accessibilityRole="button">
            <Text style={styles.linkText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const placingPlanting = placing ? byId.get(placing) : null;

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={styles.linkText}>{open ? 'Hide the plan of this area' : 'Lay Out This Area'}</Text>
      </TouchableOpacity>
      {open ? (
        !size ? (
          renderSizeForm()
        ) : (
          <View style={styles.group}>
            <Text style={styles.captionText}>
              {`${LAYOUT_INTRO} Each grid square is ${formatLength(step, unit)}; the area is ${formatLength(size.across, unit)} across by ${formatLength(size.down, unit)} down.`}
            </Text>
            {renderPlan()}
            {placingPlanting ? (
              <View style={styles.controlRow}>
                <Text style={styles.bodyText}>{`Tap the plan where ${shortName(placingPlanting)} goes.`}</Text>
                <TouchableOpacity onPress={() => setPlacing(null)} accessibilityRole="button">
                  <Text style={styles.linkText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {renderSelected()}
            {unplaced.length > 0 ? (
              <View style={styles.group}>
                <Text style={styles.fieldLabel}>Not on the Plan Yet</Text>
                <View style={styles.chipRow}>
                  {unplaced.map((planting) => (
                    <TouchableOpacity
                      key={planting.id}
                      onPress={() => {
                        setSelected(null);
                        setPlacing(placing === planting.id ? null : planting.id);
                      }}
                      style={[styles.chip, placing === planting.id ? styles.chipPicked : null]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: placing === planting.id }}
                    >
                      <Text style={styles.chipText}>{shortName(planting)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : currentPatches.length === 0 ? (
              <Text style={styles.captionText}>Nothing is growing or planned in this area yet, so there is nothing to place.</Text>
            ) : null}
            {pastPatches.length > 0 ? (
              <View style={styles.group}>
                <TouchableOpacity onPress={() => setShowPast(!showPast)} accessibilityRole="button" accessibilityState={{ expanded: showPast }}>
                  <Text style={styles.linkText}>{showPast ? 'Hide what grew here before' : 'Show what grew here before'}</Text>
                </TouchableOpacity>
                {showPast ? (
                  <Text style={styles.captionText}>
                    {`${LAYOUT_PAST_NOTE} ${pastPatches
                      .map((patch) => byId.get(patch.plantingId))
                      .filter((planting): planting is GardenPlanting => Boolean(planting))
                      .map((planting) => shortName(planting))
                      .join(', ')}.`}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  group: { gap: 8 },
  planRoom: { width: '100%' },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: TAB_COLOR, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surface },
  chipPicked: { backgroundColor: TAB_COLOR },
  chipText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  selectedCard: { gap: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  iconButton: { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  smallButton: { paddingVertical: 4 },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  errorText: { ...typography.caption, color: colors.danger, ...textShadow },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
  },
  sizeInput: { width: 90 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    ...typography.body,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
