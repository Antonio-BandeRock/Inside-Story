import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { GENERIC_BACKGROUND_PALETTES } from './GenericBackground';

// A shared rounded-edge shadow, 2026-08-21 -- direct request, replacing the
// crisp 1px divider lines removed earlier the same day (both ScreenHeader's
// own divider and ScreenBackground's own footerLine, plus Home's separate
// copy of the latter): "I would like for the bottom edge of the header and
// top edge of the footer to look shaded for depth so it looks like the edge
// sort of lifts and curls over toward the main screen area, like the edge
// of a kitchen counter that is rounded." One shared component, not three
// separately hand-tuned copies, specifically because that exact drift is
// what made the removed footerLine bug so hard to track down -- see this
// component's own three call sites (ScreenHeader.tsx, ScreenBackground.tsx,
// app/(tabs)/index.tsx's own Home-specific copy) for where it's used.
//
// The "rounded counter edge" look is a real, three-stop gradient, not a
// flat shadow: a thin highlight (the lit top of the curve, closest to the
// screen edge) immediately giving way to a darker peak (the underside of
// the curve, in its own shadow) fading out to nothing (the cast shadow
// dissolving into the ordinary content area). 'down' (the header, whose
// edge lifts toward the content below it) runs highlight -> shadow -> clear
// top to bottom; 'up' (the footer, whose edge lifts toward the content
// above it) runs the same three stops in the opposite order, bottom to top.
export const EDGE_SHADOW_HEIGHT = 14;
const SHADOW_PEAK = 'rgba(0, 0, 0, 0.22)';
const SHADOW_CLEAR = 'rgba(0, 0, 0, 0)';

// GENERIC_BACKGROUND_PALETTES' own colors are plain hex strings -- this
// converts one to an rgba() string at a given alpha, so the highlight can
// reuse the same "lighter" tone the header's own app-name text and every
// other accent element already reads, tinted to whichever generic color
// combination is currently chosen, rather than a fixed, unthemed white.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function EdgeShadow({
  direction,
  style,
}: {
  // 'down': the header's own bottom edge, shadow falling onto the content
  // below it. 'up': the footer's own top edge, shadow falling onto the
  // content above it.
  direction: 'down' | 'up';
  style?: StyleProp<ViewStyle>;
}) {
  const { genericPalette } = useVisualPreferences();
  const highlight = hexToRgba(GENERIC_BACKGROUND_PALETTES[genericPalette].lighter, 0.3);

  const colors = direction === 'down' ? [highlight, SHADOW_PEAK, SHADOW_CLEAR] : [SHADOW_CLEAR, SHADOW_PEAK, highlight];
  const locations = direction === 'down' ? [0, 0.2, 1] : [0, 0.8, 1];

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        locations={locations as [number, number, ...number[]]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 0,
    right: 0,
    height: EDGE_SHADOW_HEIGHT,
  },
});
