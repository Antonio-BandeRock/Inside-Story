import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE } from '../constants/floatingButton';
import { getTabHubIconRenderSize } from '../constants/tabHubIcons';
import { textShadow } from '../constants/typography';
import { APP_VERSION } from '../constants/version';
import { usePlayfulWording } from '../hooks/usePlayfulWording';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
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
// 1.0.60.11, direct request: "Move the version so that it is centered under
// the TabHub icon at the same level as it is now." So it no longer takes the
// box's span: it is a fixed width centered on the window, which is where
// TabHub is on a phone and on the computer, at the same height as before.
//
// It keeps its own vertical position rather than hanging off the box's, since
// the box only renders once a lens is actually selected and this label shows
// everywhere, all the time. Pinning to the box's bottom would make it jump
// around depending on whether the box happened to be there.
const GAP_BELOW_BUTTON = 4;
// This label is positioned by subtracting its own line height from the button
// row's bottom edge, so its size is part of where it sits: let it grow and it
// walks up into the hub buttons. allowFontScaling={false} below pins it, the
// same call made for the identity box above it on 2026-09-18 and for the same
// reason (see components/PageIdentityLabel.tsx). The version number is also on
// the About card in Profile, in text that scales like everything else there.
//
// 14 rather than pinnedLineHeight(9) = 12: this was tuned on-device and the
// two extra pixels are where it sits, not how tall the text is.
const LABEL_LINE_HEIGHT = 14;
// How far below the button row's own bottom edge the label sits. Was 10 when
// first tuned on-device, moved up by 5 on 2026-08-30 by direct request, and
// down 2 on 2026-10-07 once the TabHub well grew to 88 px: "The size change of
// the pressed-in TabHub icon has caused the need for the version under it to
// be dropped a few more pixels down, maybe 2."
const DROP_BELOW_BUTTON = 7;

// The mug, 2026-10-03, direct request: "Can just the mug pop up when you long
// press the version on the outside of Profile?" The Ghostead trailer's mug,
// and only the mug: no words with it. A long press reaches it only while
// Playful wording is on, so with it off the label is the plain number it
// always was and lets every touch through. The mug goes away by itself.
//
// 1.0.60.11, direct request: "Have the coffee cup appear to the right of the
// TabHub menu icon." It stands just past the right edge of whichever TabHub
// artwork is chosen, level with the button.
const LABEL_WIDTH = 80;
const MUG_GAP = 6;
const MUG_SIZE = 26;
const MUG_SHOWN_MS = 2500;

export function VersionLabel() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { tabHubIcon } = useVisualPreferences();
  const { width: tabHubIconWidth } = getTabHubIconRenderSize(tabHubIcon);
  const left = windowWidth / 2 - LABEL_WIDTH / 2;
  const mugLeft = windowWidth / 2 + tabHubIconWidth / 2 + MUG_GAP;
  const mugBottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET + (FLOATING_BUTTON_SIZE - MUG_SIZE) / 2;
  const bottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET - GAP_BELOW_BUTTON - LABEL_LINE_HEIGHT - DROP_BELOW_BUTTON;
  const playful = usePlayfulWording();
  const reducedMotion = useReducedMotion();
  const [mugShown, setMugShown] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const showMug = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setMugShown(true);
    if (reducedMotion) {
      pop.setValue(1);
    } else {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
    }
    hideTimer.current = setTimeout(() => setMugShown(false), MUG_SHOWN_MS);
  };

  return (
    <>
      {playful && mugShown ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.mug,
            { bottom: mugBottom, left: mugLeft, opacity: pop, transform: [{ scale: pop }] },
          ]}
        >
          <Ionicons name="cafe-outline" size={MUG_SIZE} color={colors.textSecondary} style={styles.mugIcon} />
        </Animated.View>
      ) : null}
      <Text
        style={[styles.text, { bottom, left, width: LABEL_WIDTH }]}
        pointerEvents={playful ? 'auto' : 'none'}
        onLongPress={playful ? showMug : undefined}
        allowFontScaling={false}
      >
        v{APP_VERSION}
      </Text>
    </>
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
  mug: {
    position: 'absolute',
    alignItems: 'center',
  },
  mugIcon: {
    ...textShadow,
  },
});
