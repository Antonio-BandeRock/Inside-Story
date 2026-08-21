import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { SHARED_BACKGROUND_SCOPE_KEY } from '../lib/visualPreferences';
import { EdgeShadow } from './EdgeShadow';
import { GenericBackground } from './GenericBackground';

// 2026-07-26: this used to be its own local formula (image bottom edge =
// TabHub's own button position + a 20px margin above it), back when the
// button sat fully inside this footer band. The button now floats ABOVE
// the band instead (see constants/floatingButton.ts's own comment for the
// full reasoning) -- useFooterBandHeight there is the one shared source
// for this band's own height now, so the band and the buttons floating
// above it can't quietly drift out of sync with each other.
export function useBackgroundBottomInset(): number {
  return useFooterBandHeight();
}

// The two available background images -- 'field' (the default wildflower
// scene) everywhere except Food, which uses 'produce' instead (2026-07-25,
// explicitly the one deliberate exception to "the same background
// everywhere"). Both use contentFit: 'cover' now -- produce originally used
// 'contain' instead, specifically to keep the whole image visible
// uncropped, but that meant its own letterboxing stretched the dark-navy
// header/footer margins wider than every other tab's, which read as
// inconsistent rather than intentional. 'cover' crops some of the produce
// image's edges, but fills the exact same header-to-footer space every
// other tab does -- consistent sizing won out over showing 100% of the
// image.
const BACKGROUNDS = {
  field: { source: require('../assets/backgrounds/App_Background_Image.png'), contentFit: 'cover' as const },
  produce: { source: require('../assets/backgrounds/Fruits_Vegetables.png'), contentFit: 'cover' as const },
  insights: { source: require('../assets/backgrounds/Insights_Background_2.png'), contentFit: 'cover' as const },
  schedule: { source: require('../assets/backgrounds/Scheduler_Background.png'), contentFit: 'cover' as const },
  trends: { source: require('../assets/backgrounds/Trends_Background_2.png'), contentFit: 'cover' as const },
  bioCompass: { source: require('../assets/backgrounds/BioCompass_Background.png'), contentFit: 'cover' as const },
  reports: { source: require('../assets/backgrounds/Reports_Background.png'), contentFit: 'cover' as const },
};

// Exported so GatedTabContent.tsx can type its own `variant` prop against
// the same set of valid values, rather than duplicating this key list.
export type BackgroundVariant = keyof typeof BACKGROUNDS;

// The shared backdrop for every tab screen's body (everything below its own
// ScreenHeader, which stays plain colors.background and is rendered outside
// this component). First built for Home (2026-07-25), then made a shared
// component so every tab gets the identical treatment rather than each
// screen hand-rolling its own copy of the same image/inset math -- "the
// same for all pages" only means something if it's actually one
// implementation, not seven that can quietly drift apart.
//
// Layering, bottom to top: the image (fixed -- it does not scroll with
// `children`'s own content), then `children` itself (typically a
// ScrollView), then an opaque bottomMask painted last so the area behind
// TabHub/LensHub/ScopeHub is *guaranteed* flat colors.background no matter
// what's scrolled underneath it, rather than relying on scroll padding
// alone to happen to leave it empty.
//
// 2026-08-17: the animated sky overlay (sun/moon/stars, day/night tint;
// components/AnimatedSky.tsx, Home-only) is removed entirely -- reported
// as real, confirmed battery drain, alongside the app's own separate,
// bigger iridescent header/footer/ring system (see constants/colors.ts's
// own header note on that removal). The wildflower field photo itself
// stays -- only the animated overlay riding on top of it is gone.
export function ScreenBackground({
  children,
  variant = 'field',
  routeKey,
}: {
  children?: ReactNode;
  variant?: BackgroundVariant;
  // 2026-08-08: which of visualPreferences' own per-tab overrides applies
  // here (a real TAB_ROUTES path, e.g. '/insights') -- passed by
  // GatedTabContent.tsx for every individually-revealed tab background.
  // Left undefined for the one other real caller, the shared/resting layer
  // mounted once in app/(tabs)/_layout.tsx, which instead follows
  // `homeBackgroundStyle` (see effectiveStyle below) -- that's "the
  // flowery shared background" the person named as its own, separate
  // toggle from each individual tab's own image.
  routeKey?: string;
}) {
  const bottomInset = useBackgroundBottomInset();
  const background = BACKGROUNDS[variant];

  const visualPrefs = useVisualPreferences();
  const effectiveStyle = routeKey
    ? (visualPrefs.tabBackgroundStyle[routeKey] ?? 'photo')
    : visualPrefs.homeBackgroundStyle;
  // 2026-08-09: the real, uploaded image for this exact scope (see
  // lib/customBackgroundImage.ts) -- undefined if 'custom' was somehow
  // selected with no image actually stored (a real edge case handled
  // below, not assumed away).
  const customImageUri = visualPrefs.customBackgroundImages[routeKey ?? SHARED_BACKGROUND_SCOPE_KEY];
  return (
    <View style={[styles.body, effectiveStyle === 'off' && styles.bodyFlat]}>
      {effectiveStyle === 'photo' ? (
        <Image
          source={background.source}
          style={[styles.backgroundImage, { bottom: bottomInset }]}
          contentFit={background.contentFit}
          contentPosition="center"
        />
      ) : null}
      {effectiveStyle === 'custom' ? (
        <Image
          // A real, edge-case fallback: 'custom' selected but no image
          // actually on file (e.g. it was somehow removed outside this
          // app) renders the ordinary bundled photo instead of leaving
          // the screen visually blank.
          source={customImageUri ? { uri: customImageUri } : background.source}
          style={[styles.backgroundImage, { bottom: bottomInset }]}
          contentFit={customImageUri ? 'cover' : background.contentFit}
          contentPosition="center"
        />
      ) : null}
      {effectiveStyle === 'generic' ? <GenericBackground palette={visualPrefs.genericPalette} /> : null}
      {children}
      <View style={[styles.bottomMask, { height: bottomInset }]} pointerEvents="none" />
      {/* footerLine (the footer's own former flat 1px divider) was removed
          outright, 2026-08-21 -- the real leak turned out to be a
          completely different, unrelated component (see AppKeyboard.tsx's
          own comment for that full account), not this one. Replaced the
          same day, direct request, with EdgeShadow instead of the plain
          line: "the top edge of the footer to look shaded for depth...
          like the edge of a kitchen counter that is rounded." Positioned
          with its own bottom at bottomInset, same real edge the old line
          sat on, extending upward into the content above it. */}
      <EdgeShadow direction="up" style={{ position: 'absolute', bottom: bottomInset }} />
    </View>
  );
}

const styles = StyleSheet.create({
  // position: 'relative' so the image/mask (position: 'absolute' inside it)
  // place relative to this box, not the whole screen; overflow: 'hidden'
  // keeps the image from ever bleeding up behind the header above it.
  body: { flex: 1, position: 'relative', overflow: 'hidden' },
  // Only applied when the effective style is 'off' -- no Image, no
  // GenericBackground, so this fills the space they'd otherwise have with
  // the same flat color bottomMask already uses, rather than leaving it
  // whatever transparent color happens to be behind this View.
  bodyFlat: { backgroundColor: colors.background },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // `bottom` set inline (bottomInset) -- varies by device safe-area inset.
  },
  bottomMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    // `height` set inline, same value as backgroundImage's own `bottom`.
  },
});
