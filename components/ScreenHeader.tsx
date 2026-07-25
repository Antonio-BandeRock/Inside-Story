import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { getUserProfile } from '../lib/db';
import { useCurrentPageHelp } from './CurrentPageHelp';
import type { HelpSection } from './HelpButton';

// 2026-07-25: this used to be the one header carrying three things --
// the page's own title/sub-tab (left), a help icon (far left), and
// "{name}'s Inside Story" (right). All three moved out: the info icon is
// gone (TabHub's own picker grid has an equivalent "About this page" tile
// now, colored to match whatever page is open); the page title and
// sub-tab label moved to PageIdentityLabel, anchored in the screen's
// bottom corner instead (see components/PageIdentityLabel.tsx and each
// screen's own render of it). What's left here is purely the app's own
// branding -- "{name}'s Inside Story" -- now the only thing this header
// shows, in a larger size, centered both ways in the header's own space
// rather than pinned to one side of a now-empty row.
//
// Still used instead of the native Stack/Tabs header (turned off for the
// whole (tabs) group -- see app/(tabs)/_layout.tsx) so nothing shows
// twice, and still the place `helpSections`/`tabPath` get registered
// (via useCurrentPageHelp) even though neither one renders anything
// visible here anymore -- TabHub's info tile and active-tab highlight
// both still depend on this registration happening on every screen.
export function ScreenHeader({
  title,
  helpSections,
  tabPath,
}: {
  // No longer displayed here (see PageIdentityLabel) -- still required so
  // the help sheet this feeds (via useCurrentPageHelp) can show "About
  // {title}".
  title: string;
  // Omit to register no help content at all (e.g. a screen with nothing
  // yet worth explaining) -- every tab that has real content should pass
  // these.
  helpSections?: HelpSection[];
  // This screen's own entry in constants/tabs.ts's TAB_ROUTES (e.g. '/',
  // '/home') -- registered on focus so TabHub can reliably highlight the
  // tab actually being looked at (see CurrentPageHelp.tsx's activeTabPath
  // for why this can't just be read off the URL). Only the 7 tab screens
  // pass this; a screen reached outside the tab bar (Profile, Check-In)
  // should leave it unset.
  tabPath?: string;
}) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const { setCurrentHelp, setActiveTabPath } = useCurrentPageHelp();

  // Refetched on every focus (not just once on mount) so editing your name
  // in Profile and coming back to any tab picks it up immediately -- the
  // same reasoning as every other cross-screen-affected value in this app
  // (see the useFocusEffect notes on the Meals/Insights/Schedule screens).
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getUserProfile().then((profile) => {
        if (isMounted) setFirstName(profile.firstName);
      });
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // Registers this screen's own help content as "the current page" the
  // moment it gains focus, so TabHub's info tile (opened from a totally
  // different part of the tree) always shows the right thing for whatever
  // tab the person is actually looking at.
  useFocusEffect(
    useCallback(() => {
      setCurrentHelp(helpSections ? { title, sections: helpSections } : null);
    }, [title, helpSections, setCurrentHelp]),
  );

  // Same focus-driven registration, for which tab is actually on screen --
  // kept as its own effect (not folded into the one above) so a screen
  // with no helpSections still correctly reports its tab.
  useFocusEffect(
    useCallback(() => {
      if (tabPath) setActiveTabPath(tabPath);
    }, [tabPath, setActiveTabPath]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.nameStack}>
          {/* "MY" is a placeholder for when no first name is set in
              Profile -- same slot, same style as the real possessive, so
              setting a name later is a straight swap, not a layout
              change. One Text node, not two side by side -- both the name
              and "Inside Story" belong on the same row, and a single node
              guarantees that rather than depending on there being enough
              width for two separate ones to land next to each other. */}
          <Text style={styles.appName}>{firstName ? `${firstName}'s` : 'MY'} Inside Story</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.shadowFade1} />
      <View style={styles.shadowFade2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
  },
  // Centered both ways now that this is the only thing in the row --
  // paddingVertical gives the centered text real room to sit in, rather
  // than the row just shrinking to exactly the text's own height (which
  // would make "centered" technically true but visually meaningless).
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  nameStack: {
    alignItems: 'center',
  },
  // Larger than before (was 13, matching the now-removed page title) --
  // this is the one thing left in the header, so it gets to be the
  // header's own biggest text rather than sized to match a sibling that
  // no longer exists.
  appName: {
    ...typography.eyebrow,
    fontSize: 20,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  // Two fading bars stand in for a soft drop shadow, confined to strictly
  // below the divider -- flat colors instead of a shadow/elevation prop, so
  // it never wraps around the sides or top.
  shadowFade1: {
    height: 2,
    backgroundColor: 'rgba(43, 43, 40, 0.06)',
  },
  shadowFade2: {
    height: 2,
    backgroundColor: 'rgba(43, 43, 40, 0.025)',
  },
});
