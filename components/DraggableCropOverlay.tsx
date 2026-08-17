// A real, direct-request feature, 2026-08-16: "There definitely needs to
// be a crop area that can be set. Otherwise it provides information that
// isn't part of what we need." Four draggable corner handles let a person
// pull a rectangular crop in from any edge to exclude whatever a curved or
// shiny label's own raw photo picked up that isn't the actual ingredients
// text -- built on React Native's own core PanResponder (no new
// dependency), not react-native-gesture-handler, since a handful of
// independent single-finger drag targets is simple enough not to need it.
//
// Uses the SAME stale-closure-avoidance pattern already established
// elsewhere in this app (see AppTextInput.tsx's own valueRef/
// selectionRef): each PanResponder is created exactly ONCE via useRef/
// useMemo, but its own callbacks read live values from a plain ref that's
// reassigned fresh on every render, rather than closing over render-time
// variables that would otherwise go stale the moment a later render
// creates new ones the already-created responder itself never sees.
import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import { colors } from '../constants/colors';

// Fractional, 0-1, relative to this component's own width/height prop --
// NOT the source image's real pixel dimensions. The caller (app/
// scan-product.tsx) is the one real place that converts this into actual
// image pixel coordinates, once, at the moment a crop is actually applied.
export type CropRect = { x: number; y: number; width: number; height: number };

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const HANDLE_SIZE = 28;
// A real, enforced floor -- without one, dragging two adjacent handles
// past each other would collapse the crop rect to nothing, a real,
// useless state with no way back to a valid one via the same gesture.
const MIN_FRACTION = 0.12;

type Props = {
  width: number;
  height: number;
  value: CropRect;
  onChange: (rect: CropRect) => void;
};

export function DraggableCropOverlay({ width, height, value, onChange }: Props) {
  // Reassigned every render -- always current by the time any responder
  // callback actually fires, however stale the responder object itself is
  // (it's created exactly once, via the useMemo below).
  const liveRef = useRef({ width, height, value, onChange });
  liveRef.current = { width, height, value, onChange };
  // The rect as it stood at the moment THIS drag gesture began -- captured
  // fresh per corner in onPanResponderGrant, so gesture.dx/dy (always
  // relative to that grant, never an absolute position) can be applied
  // against a stable starting point rather than the live, already-moving
  // value.
  const dragStartRef = useRef<CropRect | null>(null);

  const responders = useMemo(() => {
    function makeResponder(corner: Corner) {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = liveRef.current.value;
        },
        onPanResponderMove: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
          const start = dragStartRef.current;
          const { width: w, height: h, onChange: change } = liveRef.current;
          if (!start || w <= 0 || h <= 0) return;
          const dxFraction = gesture.dx / w;
          const dyFraction = gesture.dy / h;
          let x = start.x;
          let y = start.y;
          let cw = start.width;
          let ch = start.height;
          if (corner === 'topLeft') {
            x = start.x + dxFraction;
            y = start.y + dyFraction;
            cw = start.width - dxFraction;
            ch = start.height - dyFraction;
          } else if (corner === 'topRight') {
            y = start.y + dyFraction;
            cw = start.width + dxFraction;
            ch = start.height - dyFraction;
          } else if (corner === 'bottomLeft') {
            x = start.x + dxFraction;
            cw = start.width - dxFraction;
            ch = start.height + dyFraction;
          } else {
            cw = start.width + dxFraction;
            ch = start.height + dyFraction;
          }
          // Clamp: never smaller than the real minimum, never past the
          // real 0-1 bounds of the displayed image itself.
          x = Math.min(Math.max(0, x), 1 - MIN_FRACTION);
          y = Math.min(Math.max(0, y), 1 - MIN_FRACTION);
          cw = Math.max(MIN_FRACTION, Math.min(cw, 1 - x));
          ch = Math.max(MIN_FRACTION, Math.min(ch, 1 - y));
          change({ x, y, width: cw, height: ch });
        },
        onPanResponderRelease: () => {
          dragStartRef.current = null;
        },
      });
    }
    return {
      topLeft: makeResponder('topLeft'),
      topRight: makeResponder('topRight'),
      bottomLeft: makeResponder('bottomLeft'),
      bottomRight: makeResponder('bottomRight'),
    };
    // Created once on purpose -- every real value the callbacks need
    // comes from liveRef/dragStartRef, both stable refs, never from a
    // render-scoped variable this would otherwise need to depend on.
  }, []);

  const left = value.x * width;
  const top = value.y * height;
  const w = value.width * width;
  const h = value.height * height;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Dim everything outside the crop rect, so what's actually kept is obvious at a glance. */}
      <View style={[styles.dim, { left: 0, top: 0, width, height: top }]} pointerEvents="none" />
      <View style={[styles.dim, { left: 0, top: top + h, width, height: Math.max(0, height - top - h) }]} pointerEvents="none" />
      <View style={[styles.dim, { left: 0, top, width: left, height: h }]} pointerEvents="none" />
      <View style={[styles.dim, { left: left + w, top, width: Math.max(0, width - left - w), height: h }]} pointerEvents="none" />
      {/* The crop rect's own visible border. */}
      <View style={[styles.cropBorder, { left, top, width: w, height: h }]} pointerEvents="none" />
      {/* Four real, draggable corner handles. */}
      <View style={[styles.handle, { left: left - HANDLE_SIZE / 2, top: top - HANDLE_SIZE / 2 }]} {...responders.topLeft.panHandlers} />
      <View style={[styles.handle, { left: left + w - HANDLE_SIZE / 2, top: top - HANDLE_SIZE / 2 }]} {...responders.topRight.panHandlers} />
      <View style={[styles.handle, { left: left - HANDLE_SIZE / 2, top: top + h - HANDLE_SIZE / 2 }]} {...responders.bottomLeft.panHandlers} />
      <View style={[styles.handle, { left: left + w - HANDLE_SIZE / 2, top: top + h - HANDLE_SIZE / 2 }]} {...responders.bottomRight.panHandlers} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropBorder: { position: 'absolute', borderWidth: 2, borderColor: colors.accent },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
