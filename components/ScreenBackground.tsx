import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE } from '../constants/floatingButton';

// How far above TabHub's own floating button (see constants/floatingButton.ts)
// the wildflower background image's bottom edge stops -- a plain margin of
// the page's own dark background, not the image, sits directly behind and
// around the butterfly (and any secondary/tertiary corner hubs -- LensHub,
// ScopeHub) so they stay clearly readable on a flat backdrop instead of
// competing with a busy, detailed scene right behind them.
const BACKGROUND_IMAGE_BUTTERFLY_GAP = 20;

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
};

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
// alone to happen to leave it empty. Eventual home for the planned
// breeze/pollinator animation (see CLAUDE.md) -- static for now.
export function ScreenBackground({
  children,
  variant = 'field',
}: {
  children?: ReactNode;
  variant?: keyof typeof BACKGROUNDS;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET + FLOATING_BUTTON_SIZE + BACKGROUND_IMAGE_BUTTERFLY_GAP;
  const background = BACKGROUNDS[variant];

  return (
    <View style={styles.body}>
      <Image
        source={background.source}
        style={[styles.backgroundImage, { bottom: bottomInset }]}
        contentFit={background.contentFit}
        contentPosition="center"
      />
      {children}
      <View style={[styles.bottomMask, { height: bottomInset }]} pointerEvents="none" />
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
});
