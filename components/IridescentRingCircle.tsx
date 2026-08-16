import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedProps } from 'react-native-reanimated';
import { AnimatedLinearGradient } from './AnimatedLinearGradient';
import { colors, IRIDESCENT_PALETTE, rotatedIridescentPalette } from '../constants/colors';
import { useIridescentHueRotation } from '../hooks/useIridescentHueRotation';

// A solid colors.menuSurface circle with a thin, animated iridescent ring
// around its own edge -- the shared "this is currently selected/this is
// where you are" cue behind LensHub's own corner button (shown only while
// its popup is open) and TabHub's tab-picker grid (shown on whichever tab
// is currently active, plus the Info tile, which is always "about the
// current page"). 2026-07-26: replaces each of those rendering its own,
// slightly different version of "a highlighted circle" (a static border,
// a plain gradient-filled pill) with one shared piece, so "selected" reads
// the same way everywhere in the app instead of several similar-but-not-
// identical treatments.
//
// The ring itself uses rotatedIridescentPalette/useIridescentHueRotation --
// the same real, wall-clock-driven color rotation already used for
// ScreenHeader's app-name text and ScreenBackground's own footer line, not
// the separate, static per-tab iridescentSheen these two components used
// for their own fills before. Those two moments are deliberately different
// visual language: iridescentSheen is a fixed sheen tied to one tab's own
// color; this ring is the app's genuinely-animated "shimmer," the same one
// everywhere it appears.
//
// Built as an outer gradient-filled circle with a slightly smaller solid
// circle centered on top of it, rather than a true gradient stroke --
// View's own border styling can't take a gradient directly in React
// Native, and this two-circle stack is the standard way around that
// without reaching for SVG just for one ring.
export function IridescentRingCircle({
  size,
  ringWidth = 2,
  innerColor = colors.menuSurface,
  children,
}: {
  // Outer diameter, ring included -- the icon/content passed as `children`
  // should be sized to fit inside `size - ringWidth * 2`.
  size: number;
  ringWidth?: number;
  // The solid fill inside the ring -- defaults to the existing menuSurface
  // every current caller (LensHub's own corner button, TabHub's tab grid)
  // already expects, so this is purely additive. A caller that wants the
  // ring around an already-colored button rather than a menu tile (e.g.
  // Insights' own ScopeHub, filled with that tab's own identity color) can
  // override it instead of the fixed neutral.
  innerColor?: string;
  children?: ReactNode;
}) {
  const hueRotation = useIridescentHueRotation();
  const innerSize = size - ringWidth * 2;
  // Reads hueRotation.value on the UI thread, inside this worklet callback,
  // rather than in the component's own render body -- see
  // hooks/useIridescentHueRotation.ts's own history for why this no longer
  // causes a JS-thread re-render every tick the way it used to.
  const animatedProps = useAnimatedProps(() => ({
    colors: rotatedIridescentPalette(hueRotation.value),
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <AnimatedLinearGradient
        // Static fallback so TypeScript's own required `colors` prop is
        // satisfied -- animatedProps overrides this at the native level
        // the instant it mounts, this initial value only matters for the
        // very first paint before that.
        colors={IRIDESCENT_PALETTE}
        animatedProps={animatedProps}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
      />
      <View
        style={[styles.inner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: innerColor }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // overflow: 'hidden' + borderRadius (set inline, size-dependent) is what
  // actually clips the gradient (a rectangle by default) into a circle.
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // backgroundColor set inline per-instance (innerColor) rather than here.
  inner: { position: 'absolute' },
});
