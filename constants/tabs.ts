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
  { path: '/purple-digest', title: 'Purple Digest', icon: 'ribbon', color: colors.tabPurpleDigest },
  // The 9th real tab, added 2026-08-13 for home-gardening tracking (a real
  // Growing Zone lookup, plots/plantings/harvests, and harvest-as-ingredient
  // sourcing into the Food builders) -- same "append last" precedent Purple
  // Digest set above, so no earlier tab's own swipe-adjacency changes.
  { path: '/garden', title: 'Garden', icon: 'leaf', color: colors.tabGarden },
];
