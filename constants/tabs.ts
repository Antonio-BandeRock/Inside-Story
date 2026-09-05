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

export const TAB_ROUTES: TabRoute[] = [
  { path: '/', title: 'Home', icon: 'home', color: colors.tabHome },
  { path: '/food', title: 'Food', icon: 'restaurant', color: colors.tabFood },
  { path: '/insights', title: 'Insights', icon: 'medical', color: colors.tabInsights },
  { path: '/schedule', title: 'Schedules', icon: 'calendar', color: colors.tabSchedules },
  { path: '/trends', title: 'Trends', icon: 'trending-up', color: colors.tabTrends },
  { path: '/log', title: 'Signals', icon: 'compass', color: colors.tabBioCompass },
  { path: '/reports', title: 'Reports', icon: 'document-text', color: colors.tabReports },
  // Promoted from a Stack-push-only screen (like Profile) to a real swipeable
  // tab, 2026-08-05 -- explicitly requested so it has "a real location for
  // the aggregator to exist full time" rather than being reached only via a
  // shortcut. Appended last (not interleaved among the existing seven) so no
  // other tab's own swipe-adjacency changes. `icon: 'ribbon'` is a plain
  // Ionicons fallback for any generic consumer of this list that doesn't
  // know about the real custom mark -- TabHub's own TabRouteIcon helper
  // special-cases this path (same way it already does for Home) to render
  // the real PurpleRibbonIcon instead, since a bare Ionicons "ribbon" glyph
  // was already tried and rejected once (see LensHub.tsx's own history: it
  // read as a race/award rosette, not an awareness ribbon).
  { path: '/purple-digest', title: 'Digest', icon: 'ribbon', color: colors.tabPurpleDigest },
  // The 9th real tab, added 2026-08-13 for home-gardening tracking (a real
  // Growing Zone lookup, plots/plantings/harvests, and harvest-as-ingredient
  // sourcing into the Food builders) -- same "append last" precedent Purple
  // Digest set above, so no earlier tab's own swipe-adjacency changes.
  { path: '/garden', title: 'Garden', icon: 'leaf', color: colors.tabGarden },
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
