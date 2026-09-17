// The name, icon and colour a Home group and the cards inside it wear.
//
// Lived inside app/(tabs)/index.tsx until 1.0.39.16, which was fine while
// Home was the only screen that drew a group. Profile now lists the same
// groups for its own on/off switches, and a second hand-typed copy of
// "Profile is grey, and Garden's colour comes from TAB_ROUTES" is exactly
// the kind of thing that drifts. So it moved here, next to TAB_ROUTES
// itself, and both screens read the one answer.
//
// Ten of the eleven come straight from TAB_ROUTES, so they can never drift
// from the tab's own. Profile is the exception: TabHub's menu puts it
// second, right after Home, but it is a Stack screen rather than a tab, and
// adding it to TAB_ROUTES would make it an eleventh swipeable tab. So its
// identity is stated here, matching TabHub's own tile
// (components/TabHub.tsx, renderProfileTile).
//
// Its colour is the grey TabHub gives Profile at rest, not Profile's pink
// identity colour, 1.0.39.11: "Profile's color can't be pink, or whatever
// color it is. In the TabHub menu, it is a grey color. I think it should
// stay that way on the Home screen." TabHub only reaches for the pink when
// Profile is the tab you are standing on (renderProfileTile), which is
// never true from Home.
//
// That grey works as a mark and fails as a font, 1.0.39.17: "The font for
// Profile group needs to be the same color as that of the Reports group so
// it is readable against the background." menuIconMuted is a mid slate,
// which TabHub can afford because its menu sits on a solid panel, while
// Home lays these bands over a photograph. So the identity carries a
// second colour for its words alone: Reports' near-white, which is the
// lightest thing any tab wears and the one the request named. The accent
// stripe and the icon stay grey, so Profile still reads as Profile.
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from './colors';
import { TAB_ROUTES } from './tabs';

export type HomeGroupIdentity = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  // Only set when the mark and the words want different colours. Left
  // off, every band falls back to using `color` for both, which is what
  // all ten tabs do.
  textColor?: string;
};

export const HOME_GROUP_IDENTITY: Record<string, HomeGroupIdentity> = {
  '/profile': {
    title: 'Profile',
    icon: 'person-circle',
    color: colors.menuIconMuted,
    textColor: colors.tabReports,
  },
};

export function homeGroupIdentity(tabPath: string | null | undefined): HomeGroupIdentity | undefined {
  if (!tabPath) return undefined;
  const route = TAB_ROUTES.find((r) => r.path === tabPath);
  if (route) return { title: route.title, icon: route.icon, color: route.color };
  return HOME_GROUP_IDENTITY[tabPath];
}
