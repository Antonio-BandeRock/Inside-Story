import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// One full 360-degree rotation every 36 seconds, shared by every
// iridescent element in the app (the header's own app-name text, its
// divider line, the footer's divider line above TabHub, TabHub's own
// icon, and any active menu-item ring).
const ROTATION_PERIOD_MS = 36000;

// 2026-07-28: rebuilt entirely on Reanimated, replacing a JS setInterval
// that (even after an earlier pass consolidated 5 independent timers down
// to 1 shared one) still forced a real React re-render 20 times a second,
// the whole time the app was in the foreground -- flagged directly as a
// likely contributor to faster-than-normal battery drain. This version
// creates exactly one Reanimated shared value, animated continuously on
// the UI thread via withRepeat/withTiming, and hands it out through
// context -- every consumer reads the SAME shared value (so they stay in
// perfect lockstep, same as before) but none of them cause a JS-thread
// re-render or React reconciliation to do it. The actual color math
// (constants/colors.ts's own hueShift/rotatedIridescentPalette) is now
// marked with the 'worklet' directive so it can run on the UI thread too,
// inside each consumer's own useAnimatedProps/useAnimatedStyle.
//
// Consumers no longer get a plain number back -- they get the shared
// value itself, and read `.value` from inside their own worklet callback
// (useAnimatedProps for a LinearGradient's `colors`, useAnimatedStyle for
// plain color/style props). Reading `.value` outside a worklet (e.g.
// directly in a component's render body, the old pattern) no longer
// works -- Reanimated shared values are UI-thread state, not JS-thread
// state, by design.
//
// .tsx, not .ts -- this file renders JSX (the Provider below), which
// TypeScript requires a .tsx extension for.
const IridescentHueContext = createContext<SharedValue<number> | null>(null);

// Mounted once, at the app root (app/_layout.tsx), same reasoning as
// ActiveInputProvider -- one instance for the whole app's lifetime, not
// one per consumer.
export function IridescentHueProvider({ children }: { children: ReactNode }) {
  const hueRotation = useSharedValue(0);

  useEffect(() => {
    hueRotation.value = withRepeat(withTiming(360, { duration: ROTATION_PERIOD_MS, easing: Easing.linear }), -1, false);
  }, [hueRotation]);

  return <IridescentHueContext.Provider value={hueRotation}>{children}</IridescentHueContext.Provider>;
}

export function useIridescentHueRotation(): SharedValue<number> {
  const context = useContext(IridescentHueContext);
  if (!context) {
    throw new Error('useIridescentHueRotation must be used within an IridescentHueProvider');
  }
  return context;
}

// 2026-07-28: a small number of consumers can't read hueRotation.value
// straight from a worklet the way most of this app's iridescent elements
// do -- react-native-svg's own <Stop> (see node_modules/react-native-svg/
// src/elements/Stop.tsx) renders `null`, with zero backing native view; it
// only ever updates by its parent gradient calling forceUpdate() on a
// plain JS re-render. There is no host instance for Reanimated's
// Animated.createAnimatedComponent to attach to -- attempting that throws
// "[Reanimated] Cannot find host instance for this component" at runtime
// (confirmed on-device, first found in ScreenHeader.tsx's own gradient
// text, reused here for TabHub.tsx's Home icon, which needs the exact same
// multi-stop SVG gradient). This bridges the shared UI-thread value back to
// a throttled bit of JS state via useAnimatedReaction/runOnJS, rounded to
// the nearest whole degree so it only actually fires ~10 times/sec
// (matching one degree per 100ms at ROTATION_PERIOD_MS's 36-second full
// rotation) rather than once a frame -- a small, scoped bridge, nowhere
// near the old per-component 20/sec setInterval this whole rewrite
// replaced. Every OTHER consumer of hueRotation (plain LinearGradient
// fills, icon/text colors) still runs entirely on the UI thread with no
// bridge at all -- this is only for the handful of SVG-gradient-stop cases
// that structurally can't.
export function useThrottledHueDegrees(hueRotation: SharedValue<number>): number {
  const [degrees, setDegrees] = useState(0);
  useAnimatedReaction(
    () => Math.round(hueRotation.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDegrees)(current);
      }
    },
  );
  return degrees;
}
