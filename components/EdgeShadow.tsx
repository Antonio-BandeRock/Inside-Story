import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
// Rewritten the same day, direct correction after the first version: "both
// have the blue line in them, and they shouldn't have any line at all...
// the shadows appear to extend beyond the edges of the header and footer.
// They shouldn't do that. The shading should be done directly to the edge
// of them." Three real problems in the first pass, not just a tuning
// miss: (1) a highlight color stop, meant to read as a soft sheen, instead
// read as a flat colored line since a gradient's own first/last stop
// renders as a solid band until it starts blending -- removed outright,
// this is a plain dark shadow now, no color of its own. (2) `start`/`end`
// were never set on the LinearGradient, so it defaulted to expo-linear-
// gradient's own diagonal (top-left to bottom-right), not a clean vertical
// fade -- explicitly set to a straight top-to-bottom gradient now, which
// also explains why the header and footer looked inconsistent with each
// other despite being "mirrored" in code. (3) the footer's own instance
// was positioned with its bottom edge AT the footer's real top edge,
// meaning the whole gradient extended UPWARD from there into the content
// area above -- moved to sit entirely inside the footer's own existing
// space instead, shaded darkest right at the true edge and fading away
// as it goes back into the footer's own body, never crossing into
// content. The header already lived inside its own box (part of its own
// normal document flow), so only its own stop order needed to match this
// same "darkest at the boundary, clear toward my own body" shape.
export const EDGE_SHADOW_HEIGHT = 10;
const SHADOW_PEAK = 'rgba(0, 0, 0, 0.28)';
const SHADOW_CLEAR = 'rgba(0, 0, 0, 0)';

export function EdgeShadow({
  direction,
  style,
}: {
  // 'down': the header's own bottom edge -- darkest at the bottom (the
  // real boundary with the content below), fading to clear toward the
  // top (back into the header's own body). 'up': the footer's own top
  // edge -- darkest at the top (the real boundary with the content
  // above), fading to clear toward the bottom (back into the footer's
  // own body). Both stay entirely inside their own element; neither
  // crosses the boundary into the other side.
  direction: 'down' | 'up';
  style?: StyleProp<ViewStyle>;
}) {
  const colors = direction === 'down' ? [SHADOW_CLEAR, SHADOW_PEAK] : [SHADOW_PEAK, SHADOW_CLEAR];

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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
