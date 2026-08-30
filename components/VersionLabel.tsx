import { StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET } from '../constants/floatingButton';
import { textShadow } from '../constants/typography';
import { APP_VERSION } from '../constants/version';
import { usePageIdentityBoxSpan } from './PageIdentityLabel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// A small, always-on-screen version number, 2026-08-23, direct request:
// "a way to be sure I am looking at the correct version that definitely
// includes the latest updates." Mounted once, globally, in app/_layout.tsx
// (same tier as AppKeyboard), so it shows on every screen regardless of
// which tab or stack screen is active -- not just the ones that happen to
// render a hub button of their own.
//
// 2026-08-30, direct request: "Move the version number to the lower right under
// and centered on the box that tells the user where they are in the app, and on
// the same row as what it is on now." So it takes its horizontal span from
// usePageIdentityBoxSpan, the exact same hook that box positions itself with,
// and centres inside it. Same span rather than a second copy of the math, so
// the two cannot drift apart when the TabHub icon changes size.
//
// It keeps its own vertical position rather than hanging off the box's, since
// the box only renders once a lens is actually selected and this label shows
// everywhere, all the time. Pinning to the box's bottom would make it jump
// around depending on whether the box happened to be there.
const GAP_BELOW_BUTTON = 4;
const LABEL_LINE_HEIGHT = 14;
// How far below the button row's own bottom edge the label sits. Was 10 when
// first tuned on-device, moved up by 5 on 2026-08-30 by direct request.
const DROP_BELOW_BUTTON = 5;

export function VersionLabel() {
  const insets = useSafeAreaInsets();
  const { left, right } = usePageIdentityBoxSpan();
  const bottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET - GAP_BELOW_BUTTON - LABEL_LINE_HEIGHT - DROP_BELOW_BUTTON;

  return (
    <Text style={[styles.text, { bottom, left, right }]} pointerEvents="none">
      v{APP_VERSION}
    </Text>
  );
}

const styles = StyleSheet.create({
  // No fill of its own, 2026-08-30, direct request. This is a deliberate,
  // documented exception to the standing "no text sits directly on a tab's
  // background" rule, recorded in scripts/audit_bare_text_on_background.js's
  // own allowlist so the audit stays meaningful rather than being quietly
  // ignored. Legibility rests on textShadow instead, which is what the hub
  // labels beside it already rely on.
  text: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: LABEL_LINE_HEIGHT,
    color: colors.textMuted,
    opacity: 0.75,
    ...textShadow,
  },
});
