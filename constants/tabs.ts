import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { colors } from './colors';

// The single source of truth for "what are our tabs, in what order, with
// what label/icon/color" -- used by the swipe gesture (SwipeableTabScreen),
// the TabHub navigation menu, and (for name/title only) the (tabs) layout
// itself. Previously this list was duplicated across two files by hand;
// keeping it in one place means adding/reordering a tab is a one-line
// change instead of an easy-to-miss multi-file edit.
//
// `color` is each tab's own jewel tone sampled from the butterfly artwork
// (see constants/colors.ts) -- TabHub uses it for the active-tab indicator
// so which tab you're in is signaled by which color is lit, not just a
// shared brand color for every active state.
export type TabRoute = {
  path: Href;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

// 2026-09-05. The order below is deliberate and means something, which it did
// not before: every tab after the original seven had been APPENDED last,
// each for the sound reason that appending changes no existing tab's swipe
// adjacency. Ten tabs later that had produced a sequence nobody chose.
//
// It reads in three groups, after Home:
//
//   Food, Schedules, Signals     what you do daily
//   Insights, Trends, Reports    what it tells you
//   Garden, Life                 the wider world
//
// The last group was Garden, Digest, Life until 2026-09-19, when the Digest
// tab was taken apart by direct instruction ("This will in essence remove
// the need for the Digest completely. Let's remove Digest as a tab after
// everything is moved."): its conditions, Basic Health (renamed Health
// Literacy) and Earth Matters became lenses on Life, Home Gardening became
// the Horticulture lens on Garden, and its recipes had already moved to
// Food on 2026-09-18. The Digest's purple used to sit between Garden's
// emerald and Life's mint to keep the two closest colours in the grid
// apart (0.134 side by side); with the tab gone they are neighbours again,
// which is the price of a menu with one fewer tile. colors.tabPurpleDigest
// stays defined for the pieces that still draw it (PurpleRibbonIcon).
//
// One correctness fix fell out of the 2026-09-05 order: Signals is where
// symptoms and flares are logged and Trends is the patterns drawn FROM
// them, so having Trends ahead of Signals put an output before its own
// input.
//
// This list drives three things at once, so changing it moves all three
// together and that is the point: TabHub's grid, SwipeableTabScreen's own
// left/right order, and the position dots under the header. TabHub lays out
// its own rows separately, since Profile and Info sit in the top row and
// neither is a tab (see TAB_HUB_MENU_ORDER there).
export const TAB_ROUTES: TabRoute[] = [
  { path: '/', title: 'Home', icon: 'home', color: colors.tabHome },
  { path: '/food', title: 'Food', icon: 'restaurant', color: colors.tabFood },
  { path: '/schedule', title: 'Schedules', icon: 'calendar', color: colors.tabSchedules },
  { path: '/log', title: 'Signals', icon: 'compass', color: colors.tabBioCompass },
  { path: '/insights', title: 'Insights', icon: 'medical', color: colors.tabInsights },
  { path: '/trends', title: 'Trends', icon: 'trending-up', color: colors.tabTrends },
  { path: '/reports', title: 'Reports', icon: 'document-text', color: colors.tabReports },
  // Added 2026-08-13 for home-gardening tracking (a real Growing Zone
  // lookup, plots/plantings/harvests, and harvest-as-ingredient sourcing
  // into the Food builders), and since 2026-09-19 the Horticulture reading
  // as well. Placed by meaning since 2026-09-05, see the block comment
  // above.
  { path: '/garden', title: 'Garden', icon: 'leaf', color: colors.tabGarden },
  // Added 2026-09-04. Direct request: "A new tab needs to be added and
  // available through TabHub menu. The name of the new tab is Life... This
  // will deal with the user's life, all aspects." Appended last, the same
  // precedent Garden set, so no earlier tab's own swipe-adjacency changed.
  //
  // `infinite` was chosen deliberately over a concrete object. Seven of the
  // nine tabs above are things (a house, a plate, a stethoscope, a
  // calendar, a chart, a compass, a document), and Life is not another
  // domain alongside them, it is the container the rest sit inside. An
  // abstract mark among concrete ones signals that before the label is
  // read. Candidates ruled out for specific reasons rather than taste: the
  // butterfly (already a selectable TabHub BUTTON icon, see
  // constants/tabHubIcons.ts, so it would appear twice on one screen),
  // `diamond` (reads as "premium" in an app with a real paid-tier model),
  // `person` (that is Profile), `planet`/`earth` (that is Earth Matters,
  // a lens on this very tab since 2026-09-19), and the solid twin of any
  // outline a lens already uses.
  //
  // Adding this also made TabHub's own grid come out even at the time: it
  // was at 11 items (9 tabs, Profile, Info) in a 3-column grid, 3/3/3/2,
  // and twelve was four full rows. Removing the Digest on 2026-09-19 put
  // it back to eleven; TabHub lays its rows out from the count, so nothing
  // there had to change.
  { path: '/life', title: 'Life', icon: 'infinite', color: colors.tabLife },
];
