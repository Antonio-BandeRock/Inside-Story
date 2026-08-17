// A real, minimal draggable slider, 2026-08-16 -- built for
// app/scan-product.tsx's own new brightness/contrast controls. React
// Native has no built-in Slider component (it was removed from RN core
// years ago), and this app has no slider dependency installed anywhere,
// so this is a small, purpose-built one rather than a new dependency for
// two simple sliders. Uses the identical stale-closure-safe useRef/
// PanResponder pattern DraggableCropOverlay.tsx already establishes, for
// the same real reason.
import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const TRACK_WIDTH = 240;
const THUMB_SIZE = 24;

type Props = {
  label: string;
  value: number; // -1..1
  onChange: (value: number) => void;
};

export function SimpleSlider({ label, value, onChange }: Props) {
  const liveRef = useRef({ value, onChange });
  liveRef.current = { value, onChange };
  // The value as it stood at the moment this drag began -- gesture.dx is
  // always relative to that grant, never an absolute finger position.
  const dragStartValueRef = useRef(0);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartValueRef.current = liveRef.current.value;
        },
        onPanResponderMove: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
          // The real, full track width covers a real range of 2 (-1..1).
          const delta = (gesture.dx / (TRACK_WIDTH - THUMB_SIZE)) * 2;
          const next = Math.min(1, Math.max(-1, dragStartValueRef.current + delta));
          liveRef.current.onChange(next);
        },
      }),
    [],
  );

  const thumbLeft = ((value + 1) / 2) * (TRACK_WIDTH - THUMB_SIZE);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {value > 0 ? '+' : ''}
          {Math.round(value * 100)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={styles.baseTrack} />
        <View style={[styles.filledTrack, { width: thumbLeft + THUMB_SIZE / 2 }]} />
        <View style={[styles.thumb, { left: thumbLeft }]} {...responder.panHandlers} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...typography.bodyEmphasis, color: colors.textPrimary },
  valueText: { ...typography.caption, color: colors.textMuted },
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  baseTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  filledTrack: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
