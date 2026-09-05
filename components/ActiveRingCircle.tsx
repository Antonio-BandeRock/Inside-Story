import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, lighten } from '../constants/colors';

// Renamed from IridescentRingCircle, 2026-09-05. It stopped being iridescent
// some time ago (see the note further down: the rotating rainbow was replaced
// with one flat colour) and the old name had been describing something the
// component no longer did, which is worse than no name at all.
//
// The ring now takes RING_COLOR, which is defined per ground theme
// (#8D9EC4 Navy, #87B8C2 Teal, #AE88C0 Purple, and so on) rather than the
// fixed teal it used before. Direct request: "Make the selection circle follow
// the ground color chosen." It was previously colors.primary, a single hex
// that stayed the same whichever theme was picked, so the one element marking
// "you are here" was the one element ignoring the chosen palette.
//
// The ring is the ground theme's own button colour, lightened. Taking
// buttonColor raw does not work: this ring is drawn on colors.menuSurface
// (#545A63), a fairly light mid grey, and against it buttonColor measures
// 2.26:1 (Burgundy) to 3.20:1 (Teal) -- under the 3:1 floor for a non-text UI
// element on four of the five themes, and WORSE than the fixed teal it
// replaces, which managed 3.60:1. A "you are here" marker that is harder to
// see than before would be a regression dressed up as a feature.
//
// 0.35 of the remaining headroom to white is what clears it everywhere:
// 3.50:1 at worst (Burgundy) up to roughly 4.3:1, so every theme is past the
// floor while keeping enough of its own hue to still read as that theme.
// Measured across all five, not estimated.
const RING_LIGHTEN_FRACTION = 0.35;
const RING_COLOR = lighten(colors.buttonColor, RING_LIGHTEN_FRACTION);

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
// static RING_COLOR ring -- this app's own single already-established
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
export function ActiveRingCircle({
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
          borderColor: RING_COLOR,
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
