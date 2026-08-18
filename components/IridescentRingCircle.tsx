import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

// A solid colors.menuSurface circle with a thin ring around its own edge --
// the shared "this is currently selected/this is where you are" cue behind
// LensHub's own corner button (shown only while its popup is open) and
// TabHub's tab-picker grid (shown on whichever tab is currently active,
// plus the Info tile, which is always "about the current page"). 2026-07-26:
// replaces each of those rendering its own, slightly different version of
// "a highlighted circle" (a static border, a plain gradient-filled pill)
// with one shared piece, so "selected" reads the same way everywhere in the
// app instead of several similar-but-not-identical treatments.
//
// 2026-08-17: the ring itself used to be the app's own animated iridescent
// rainbow (rotatedIridescentPalette/useIridescentHueRotation, the same
// rotation ScreenHeader's app-name text and ScreenBackground's footer line
// used) -- removed entirely, a real, confirmed continuous battery drain
// (see constants/colors.ts's own header note). Replaced with a flat,
// static colors.primary ring -- this app's own single already-established
// "this is tapped/active/interactive" color (see that token's own comment
// in constants/colors.ts), not a per-tab color, matching what the ring's
// own real job always was: per the comment history on TabHub.tsx's own use
// of this component, "a shape-based cue independent of color the same way
// the pill used to be" -- the fact that it happened to be rainbow-colored
// was decorative, not semantically tied to which tab, so a flat, single
// accent color is a faithful, non-animated version of the same idea.
//
// Also a real simplification, not just a de-animation: a gradient ring
// needed a two-layer "gradient-filled outer circle + slightly smaller solid
// circle on top" trick, since a plain View border can't take a gradient
// directly in React Native. A single flat color needs none of that -- a
// plain View with a real borderColor does the identical job in one layer.
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
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: colors.primary,
          backgroundColor: innerColor,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
