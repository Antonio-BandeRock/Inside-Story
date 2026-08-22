import { usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TAB_ROUTES } from '../constants/tabs';

// Phase 0 of the header growth vine/Timeline plan (2026-08-21, see the
// Notion App Development Log and the "Header Vine, Timeline & Life" phased
// build plan) -- an always-on "you are here" indicator, one dot per real
// tab (TAB_ROUTES), lit in that tab's own jewel color when it's the current
// route.
//
// Deliberately a discrete snap to `usePathname()` rather than a live
// drag-follow of an in-progress swipe: SwipeableTabScreen's own
// `translateX` is a fresh local `useSharedValue` created inside each
// mounted tab screen, not something this separately-mounted, once-only
// header (see ScreenHeader.tsx's own 2026-07-27 comment) can currently
// read from. Live following mid-swipe is a real, named follow-up -- it
// would need that value lifted somewhere both components can share -- not
// something this first pass silently pretends to already do.
//
// Read-only for now, on purpose: `pointerEvents="none"`. Phase 6 gives
// these dots a second job -- tapping one inside the Timeline becomes an
// additive per-tab layer toggle -- but that's a real design decision for
// when that phase starts, not assumed here. Outside the Timeline, a dot
// staying purely informational (not a second way to switch tabs, alongside
// TabHub and swiping) was the deliberate call in the original brainstorm.
export function TabPositionDots() {
  const pathname = usePathname();

  return (
    <View style={styles.row} pointerEvents="none">
      {TAB_ROUTES.map((route) => {
        const active = route.path.toString() === pathname;
        return (
          <View
            key={route.path.toString()}
            style={[styles.dot, { backgroundColor: route.color }, !active && styles.dotInactive]}
          />
        );
      })}
    </View>
  );
}

const DOT_SIZE = 6;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  // The inactive read: dimmed via opacity rather than a separate gray
  // swatch, so a tab's own color is still faintly recognizable even when
  // it isn't the current one, not replaced by one flat "off" look for
  // every tab alike.
  dotInactive: {
    opacity: 0.35,
  },
});
