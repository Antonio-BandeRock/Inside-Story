import { StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_SIZE, useBottomLeftHubPosition } from '../constants/floatingButton';
import { textShadow } from '../constants/typography';
import { APP_VERSION } from '../constants/version';

// A small, always-on-screen version number, 2026-08-23, direct request:
// "a way to be sure I am looking at the correct version that definitely
// includes the latest updates." Mounted once, globally, in app/_layout.tsx
// (same tier as AppKeyboard), so it shows on every screen regardless of
// which tab or stack screen is active -- not just the ones that happen to
// render a hub button of their own.
//
// Positioned directly under the bottom-left hub button, and centred on that
// button's own vertical axis. 2026-08-30, direct request: "move the version
// number up by 5 pixels, and center it vertically on the tab icons that sit
// above it."
//
// Both numbers come from useBottomLeftHubPosition, the same hook the corner
// hub itself uses, rather than being re-derived here. That matters for the
// horizontal position specifically: the hub's real left edge is not always
// SECONDARY_HUB_CARD_LEFT_MARGIN (on a narrow screen it is pulled further
// left so the secondary hubs still clear the centre button), and this label
// used to hardcode that margin, so it could sit off the icon it belongs to.
// Giving the text the button's own width and centring inside it puts it on
// the icon's axis on every screen size.
const GAP_BELOW_BUTTON = 4;
const LABEL_LINE_HEIGHT = 14;
// How far below the button's own bottom edge the label sits. Was 10 when
// this was first tuned on-device; moved up by 5 on 2026-08-30 by direct
// request. Kept as its own named number rather than folded into
// GAP_BELOW_BUTTON so each ask stays legible in the math.
const DROP_BELOW_BUTTON = 5;

export function VersionLabel() {
  const { bottom: buttonBottom, left } = useBottomLeftHubPosition();
  const bottom = buttonBottom - GAP_BELOW_BUTTON - LABEL_LINE_HEIGHT - DROP_BELOW_BUTTON;

  return (
    <Text style={[styles.text, { bottom, left }]} pointerEvents="none">
      v{APP_VERSION}
    </Text>
  );
}

const styles = StyleSheet.create({
  // No fill of its own, 2026-08-30, direct request. This is a deliberate,
  // documented exception to the standing "no text sits directly on a tab's
  // background" rule, recorded in scripts/audit_bare_text_on_background.js's
  // own allowlist so the audit stays meaningful rather than being quietly
  // ignored. Legibility rests on textShadow instead, which is what the two
  // hub labels beside it already rely on.
  text: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: LABEL_LINE_HEIGHT,
    color: colors.textMuted,
    opacity: 0.75,
    ...textShadow,
  },
});
