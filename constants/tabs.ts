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
// It now reads in three groups of three, after Home:
//
//   Food, Schedules, Signals     what you do daily
//   Insights, Trends, Reports    what it tells you
//   Garden, Digest, Life         the wider world
//
// Garden sits ahead of Digest inside that last group for a colour reason
// rather than a meaning one: Garden's emerald and Life's mint were the closest
// pair left in the grid at 0.134, and they were side by side. Putting Digest's
// purple between them roughly doubles the separation, to 0.270 and 0.302, and
// "the wider world" reads the same in either order.
//
// One correctness fix falls out of it: Signals is where symptoms and flares
// are logged and Trends is the patterns drawn FROM them, so having Trends
// ahead of Signals put an output before its own input.
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
  // Promoted from a Stack-push-only screen (like Profile) to a real swipeable
  // tab, 2026-08-05 -- explicitly requested so it has "a real location for
  // the aggregator to exist full time" rather than being reached only via a
  // shortcut. Originally appended last so no other tab's swipe adjacency changed;
  // placed by meaning since 2026-09-05, see the block comment above. `icon: 'ribbon'` is a plain
  // Ionicons fallback for any generic consumer of this list that doesn't
  // know about the real custom mark -- TabHub's own TabRouteIcon helper
  // special-cases this path (same way it already does for Home) to render
  // the real PurpleRibbonIcon instead, since a bare Ionicons "ribbon" glyph
  // was already tried and rejected once (see LensHub.tsx's own history: it
  // read as a race/award rosette, not an awareness ribbon).
  { path: '/garden', title: 'Garden', icon: 'leaf', color: colors.tabGarden },
  // The 9th real tab, added 2026-08-13 for home-gardening tracking (a real
  // Growing Zone lookup, plots/plantings/harvests, and harvest-as-ingredient
  // sourcing into the Food builders) -- placed by meaning since 2026-09-05,
  // see the block comment above.
  { path: '/purple-digest', title: 'Digest', icon: 'ribbon', color: colors.tabPurpleDigest },
  // The 10th real tab, added 2026-09-04. Direct request: "A new tab needs
  // to be added and available through TabHub menu. The name of the new tab
  // is Life... This will deal with the user's life, all aspects." Same
  // "append last" precedent Digest and Garden both set above, so no
  // earlier tab's own swipe-adjacency changes.
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
  // `person` (that is Profile), `planet`/`earth` (that is the Digest's own
  // Earth Matters), and the solid twin of any outline a lens already uses.
  //
  // Adding this also makes TabHub's own grid come out even: it was at 11
  // items (9 tabs, Profile, Info) in a 3-column grid, an awkward 3/3/3/2.
  // Twelve is four full rows.
  { path: '/life', title: 'Life', icon: 'infinite', color: colors.tabLife },
];
