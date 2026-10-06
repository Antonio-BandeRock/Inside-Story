// Search near the thumb, 1.0.61.15 (2026-10-05). Direct request: "Search boxes
// at the top of a lens are the hardest thing to reach one-handed." An edge tab
// on the thumb side, stacked just above the quick voice note's tab
// (components/QuickCaptureButton.tsx) and the same shape, shown only while the
// screen on view has a lens search box (lib/thumbSearch.ts). A tap moves that
// box's search into the app keyboard's search row, just above the keys, so
// the words go in at the bottom of the screen and the list narrows above.
//
// Not on the desktop app, where a search box is a mouse click away and the
// typing comes from a real keyboard.
import { Ionicons } from '@expo/vector-icons';
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { isDesktopApp } from '../lib/desktop/bridge';
import { useNavigationHand } from '../lib/navigationHand';
import { hasThumbSearch, openThumbSearch, subscribeThumbSearch } from '../lib/thumbSearch';

const TAB_HEIGHT = 44;
const TAB_WIDTH = 30;
// The voice note tab sits 8 above the footer and is 44 tall; this one sits 8
// above that.
const BOTTOM_ABOVE_FOOTER = 8 + 44 + 8;

export function ThumbSearchButton() {
  const hand = useNavigationHand();
  const footerHeight = useFooterBandHeight();
  const available = useSyncExternalStore(subscribeThumbSearch, hasThumbSearch, hasThumbSearch);
  if (!available || isDesktopApp()) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tab,
        hand === 'right' ? styles.tabOnRight : styles.tabOnLeft,
        { bottom: footerHeight + BOTTOM_ABOVE_FOOTER },
        pressed ? styles.tabPressed : null,
      ]}
      onPress={() => {
        openThumbSearch();
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Search near my thumb"
      accessibilityHint="Puts this screen's search box just above the keys"
    >
      <Ionicons name="search-outline" size={18} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.85,
  },
  tabOnRight: {
    right: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  tabOnLeft: {
    left: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  tabPressed: { opacity: 1 },
});
