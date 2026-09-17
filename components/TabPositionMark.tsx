import { usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TAB_ROUTES } from '../constants/tabs';
import { TabRouteIcon } from './TabRouteIcon';

// The "you are here" mark under the title, one glyph: whichever tab you are
// standing on, drawn in that tab's own colour.
//
// It was a row of ten dots from 2026-08-21 (Phase 0 of the header growth
// vine/Timeline plan, see the Notion App Development Log) until 1.0.39.12,
// with the current tab's dot in full colour and the other nine dimmed to
// 0.35. Direct instruction: "I think the dots at the top under My Inside
// Story should just be the tabhub icons themselves instead of dots, and only
// the one that is active is shown, and in full color." A dot could only ever
// say which of ten places you were in by its position and its colour; the
// tab's own glyph says it outright, and it is the same glyph the menu, the
// tab header and the corner box all draw.
//
// Deliberately a discrete snap to `usePathname()` rather than a live
// drag-follow of an in-progress swipe: SwipeableTabScreen's own
// `translateX` is a fresh local `useSharedValue` created inside each
// mounted tab screen, not something this separately-mounted, once-only
// header (see ScreenHeader.tsx's own 2026-07-27 comment) can currently
// read from. Live following mid-swipe is a named follow-up, and it would
// need that value lifted somewhere both components can share. Not
// something this pass silently pretends to already do.
//
// Read-only, on purpose: `pointerEvents="none"`. Outside the Timeline, this
// staying purely informational (not a second way to switch tabs, alongside
// TabHub and swiping) was the deliberate call in the original brainstorm.
//
// Every tab, Home included. 2026-08-21 excluded Home on the reasoning that it
// "is sort of a completely different screen"; reversed 2026-09-05, direct
// request: "many things happen from the Home screen even though they are
// mostly just due to quick access being available for the other Tabs
// functions." It is a place you swipe to and from like any other.
//
// Profile and Info are absent, and that is not the same decision: they are
// Stack screens outside the tabs group, so they cannot be swiped to at all.
// Nothing to mark a position for, and nothing renders when the route matches
// no tab.
export const TAB_MARK_ROUTES = TAB_ROUTES;

// The glyph's own size, and the row's. Held here rather than in
// ScreenHeader so the mark can never outgrow the band reserved for it:
// ScreenHeader imports this into its own header-height sum (see
// HEADER_ROW_HEIGHT there), which is carved out of the title's budget, so a
// taller mark would push the title down rather than the header out.
export const TAB_MARK_ROW_HEIGHT = 16;

export function TabPositionMark() {
  const pathname = usePathname();
  const route = TAB_MARK_ROUTES.find((candidate) => candidate.path.toString() === pathname);

  return (
    <View style={styles.row} pointerEvents="none">
      {route ? <TabRouteIcon route={route} size={TAB_MARK_ROW_HEIGHT} /> : null}
    </View>
  );
}

// The row still spans the full width and still carries the same edge inset
// it did as ten dots. It was exported until 1.0.39.14 so GrowthMarksRow
// could line its own per-tab slots up with the dots above them; nothing
// draws under the mark any more, so the inset is this file's alone again.
const ROW_EDGE_PADDING = 20;

const styles = StyleSheet.create({
  row: {
    width: '100%',
    height: TAB_MARK_ROW_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ROW_EDGE_PADDING,
  },
});
