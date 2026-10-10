// Search near the thumb, 1.0.61.15 (2026-10-05). Direct request: "Search boxes
// at the top of a lens are the hardest thing to reach one-handed." An edge tab
// on the thumb side, stacked just above the quick-access tab
// (components/QuickAccessButton.tsx) and the same shape, shown only while the
// screen on view has a lens search box (lib/thumbSearch.ts). A tap moves that
// box's search into the app keyboard's search row, just above the keys, so
// the words go in at the bottom of the screen and the list narrows above.
//
// Not on the desktop app, where a search box is a mouse click away and the
// typing comes from a real keyboard.
import { Ionicons } from '@expo/vector-icons';
import { useSyncExternalStore } from 'react';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { isDesktopApp } from '../lib/desktop/bridge';
import { useNavigationHand } from '../lib/navigationHand';
import { hasThumbSearch, openThumbSearch, subscribeThumbSearch } from '../lib/thumbSearch';
import { EDGE_TAB_HEIGHT, EdgeTab } from './EdgeTab';

// The quick-access tab sits 8 above the footer and is EDGE_TAB_HEIGHT tall; this
// one sits 8 above that.
const BOTTOM_ABOVE_FOOTER = 8 + EDGE_TAB_HEIGHT + 8;

export function ThumbSearchButton() {
  const hand = useNavigationHand();
  const footerHeight = useFooterBandHeight();
  const available = useSyncExternalStore(subscribeThumbSearch, hasThumbSearch, hasThumbSearch);
  if (!available || isDesktopApp()) return null;

  return (
    <EdgeTab
      side={hand}
      bottom={footerHeight + BOTTOM_ABOVE_FOOTER}
      onPress={() => {
        openThumbSearch();
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Search near my thumb"
      accessibilityHint="Puts this screen's search box just above the keys"
    >
      <Ionicons name="search-outline" size={18} color={colors.textPrimary} />
    </EdgeTab>
  );
}
