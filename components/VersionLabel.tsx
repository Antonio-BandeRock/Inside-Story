import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, SECONDARY_HUB_CARD_LEFT_MARGIN } from '../constants/floatingButton';
import { textShadow } from '../constants/typography';
import { APP_VERSION } from '../constants/version';

// A small, always-on-screen version number, 2026-08-23, direct request:
// "a way to be sure I am looking at the correct version that definitely
// includes the latest updates." Mounted once, globally, in app/_layout.tsx
// (same tier as AppKeyboard), so it shows on every screen regardless of
// which tab or stack screen is active -- not just the ones that happen to
// render a hub button of their own.
//
// Positioned just under the hub-button cluster's own true bottom-left
// corner: SECONDARY_HUB_CARD_LEFT_MARGIN is the exact same left inset
// TabHub's own secondary hubs (LensHub/ScopeHub/MyItemsHub) use for their
// own left edge (see useBottomLeftHubPosition in constants/floatingButton.
// ts), and the vertical position reads FLOATING_BUTTON_BOTTOM_OFFSET
// directly (the same shared value every hub button's own `bottom` uses)
// so this always tracks a few px below the buttons' own bottom edge,
// rather than a second, separately-tuned number that could drift out of
// sync with a future adjustment to that shared offset.
const GAP_BELOW_BUTTON = 4;
const LABEL_LINE_HEIGHT = 14;
// 2026-08-23, direct request, confirmed working on-device first: "move
// the app version down by about 10 pixels." Kept as its own named
// adjustment rather than folded into GAP_BELOW_BUTTON, so this specific
// ask stays legible in the math rather than silently changing what that
// constant means.
const MOVE_DOWN_ADJUSTMENT = 10;

export function VersionLabel() {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET - GAP_BELOW_BUTTON - LABEL_LINE_HEIGHT - MOVE_DOWN_ADJUSTMENT;

  return (
    <Text style={[styles.text, { bottom, left: SECONDARY_HUB_CARD_LEFT_MARGIN }]} pointerEvents="none">
      v{APP_VERSION}
    </Text>
  );
}

const styles = StyleSheet.create({
  // 2026-08-29 standing rule: no text sits directly on the tab
  // background. This label floats over every screen, so it carries its
  // own small fill. Kept as tight as the text allows, and the existing
  // 0.75 opacity applies to the fill as well as the glyphs, so it stays
  // as unobtrusive as it was rather than becoming a solid corner badge.
  text: {
    position: 'absolute',
    fontSize: 9,
    lineHeight: LABEL_LINE_HEIGHT,
    color: colors.textMuted,
    opacity: 0.75,
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 5,
    ...textShadow,
  },
});
