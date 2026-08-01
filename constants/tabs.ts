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
];
