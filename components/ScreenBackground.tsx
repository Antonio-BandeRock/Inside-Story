import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useAnimatedProps } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, IRIDESCENT_PALETTE, rotatedIridescentPalette } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { useIridescentHueRotation } from '../hooks/useIridescentHueRotation';
import { AnimatedLinearGradient } from './AnimatedLinearGradient';
import { AnimatedSky } from './AnimatedSky';

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
// `children`'s own content), then the animated sky overlay (Home only --
// see `sky` below), then `children` itself (typically a ScrollView), then
// an opaque bottomMask painted last so the area behind
// TabHub/LensHub/ScopeHub is *guaranteed* flat colors.background no matter
// what's scrolled underneath it, rather than relying on scroll padding
// alone to happen to leave it empty.
//
// 2026-08-02: briefly tried the reverse (sky behind the image) at explicit
// request, then reverted the same day once the real consequence was seen
// on-device -- the wildflower photo is a single fully-opaque asset with no
// transparency in its own sky band, so that order hid the sun/moon/stars/
// tint completely, all the time. Back to sky-in-front, as it was before.
export function ScreenBackground({
  children,
  variant = 'field',
  sky = false,
}: {
  children?: ReactNode;
  variant?: BackgroundVariant;
  // Home-only, opt-in (see components/AnimatedSky.tsx) -- every other
  // screen leaves this unset, so nothing changes for them at all. Only
  // 'field' (Home's own wildflower-field image) actually shows open sky;
  // this isn't validated against `variant` since Home is the only caller
  // that would ever pass it.
  sky?: boolean;
}) {
  const bottomInset = useBackgroundBottomInset();
  const background = BACKGROUNDS[variant];
  // Same shared Reanimated value ScreenHeader's own app-name text and
  // divider read (see hooks/useIridescentHueRotation) -- this line shimmers
  // in lockstep with those, not on its own separate schedule.
  const hueRotation = useIridescentHueRotation();
  const animatedProps = useAnimatedProps(() => ({
    colors: rotatedIridescentPalette(hueRotation.value),
  }));
  // The image's own real rendered size -- AnimatedSky needs this to know
  // where its sky band actually is and how far the tint overlay should
  // reach, and there's no way to know it in advance (varies by device),
  // so it's measured via onLayout rather than guessed from insets.
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  function handleImageLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setImageSize({ width, height });
  }

  return (
    <View style={styles.body}>
      <Image
        source={background.source}
        style={[styles.backgroundImage, { bottom: bottomInset }]}
        contentFit={background.contentFit}
        contentPosition="center"
        onLayout={handleImageLayout}
      />
      {sky && imageSize ? <AnimatedSky width={imageSize.width} height={imageSize.height} /> : null}
      {children}
      <View style={[styles.bottomMask, { height: bottomInset }]} pointerEvents="none" />
      {/* The footer's own fine line, mirroring ScreenHeader's divider --
          same rotating palette as the header line and app-name text.
          Base `- 4` matches the header's own line-to-edge distance: on
          ScreenHeader, the divider sits shadowFade1 (2px) + shadowFade2
          (2px) = 4px before the true edge where the image begins; this
          sits that same 4px on the other side of the equivalent edge
          (bottomInset, where the image ends and the flat mask begins).
          The further `- 1` is a small manual nudge down, requested after
          eye testing on-device. */}
      <AnimatedLinearGradient
        // Static fallback so TypeScript's own required `colors` prop is
        // satisfied -- animatedProps overrides this at the native level
        // the instant it mounts.
        colors={IRIDESCENT_PALETTE}
        animatedProps={animatedProps}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.footerLine, { bottom: bottomInset - 4 - 1 }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // position: 'relative' so the image/mask (position: 'absolute' inside it)
  // place relative to this box, not the whole screen; overflow: 'hidden'
  // keeps the image from ever bleeding up behind the header above it.
  body: { flex: 1, position: 'relative', overflow: 'hidden' },
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
  footerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    // `bottom` set inline (bottomInset) -- same y as backgroundImage's own
    // `bottom` / bottomMask's own top edge.
  },
});
