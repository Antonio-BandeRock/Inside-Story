import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { getUserProfile } from '../lib/db';
import { useCurrentPageHelp } from './CurrentPageHelp';
import { HelpButton, type HelpSection } from './HelpButton';

// The one and only header for every tab screen -- the app's own name on
// top, that page's own title/help below it, both still one header block.
// Subtitles were removed deliberately: the help sheet already covers what
// a page is/does in more depth, and a bare title pushes people toward
// actually reading it instead of skimming a one-line summary. Used instead
// of the native Stack/Tabs header (which is turned off for the whole
// (tabs) group -- see app/(tabs)/_layout.tsx) so a page's name is never
// shown twice, stacking two header bars on top of each other and eating
// vertical space that matters most in landscape.
//
// 2026-07-25: the "{name}'s Inside Story" line on the right used to double
// as a button into Profile (a person-circle icon next to it). Profile
// moved into TabHub's own picker grid instead (its 9th item, see
// components/TabHub.tsx) so it isn't tied to a specific corner of every
// screen anymore -- this text stays exactly where it was, purely as
// branding/personalization now, with nothing to tap.
//
// The title/icon row itself is inset (paddingHorizontal on `row`), but the
// divider below it is not -- screens must not put paddingHorizontal on the
// wrapper they render this in, so the line underneath can reach the true
// left/right edges of the screen. Built from plain stacked Views rather
// than the native shadow/elevation props: RN's Android `elevation` always
// casts a shadow on every side of the view, not just the bottom, which is
// exactly the "goes all the way around" look this deliberately avoids.
export function ScreenHeader({
  title,
  helpSections,
  activeLensLabel,
  tabPath,
}: {
  title: string;
  // Omit to show no help icon at all (e.g. a screen with nothing yet worth
  // explaining) -- every tab that has real content should pass these.
  helpSections?: HelpSection[];
  // The currently selected view on a screen that uses LensHub (see
  // components/LensHub.tsx) instead of a row of tab pills -- stacked
  // directly under the title, in the exact same text style/size as the
  // title itself (never a different, smaller one -- every header's title
  // stays the same size everywhere in the app). This mirrors the
  // right-hand side's own two-line stack ("MY" over "Inside Story"): both
  // stacks start at the same top and are the same line height, so the
  // second line here lands aligned with the top of "Inside Story", not
  // off on a separate row underneath the whole header. Omit entirely for a
  // screen with only one view.
  activeLensLabel?: string;
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
        {/* Leads the title it explains, rather than sitting in a generic
            icon row on the far side of the screen -- the point being that
            it visually reads as "this is about the text right next to
            it." */}
        {helpSections ? (
          <View style={styles.helpCol}>
            <HelpButton pageTitle={title} sections={helpSections} />
          </View>
        ) : null}
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          {activeLensLabel ? <Text style={styles.title}>{activeLensLabel}</Text> : null}
        </View>
        <View style={styles.rightRow}>
          <View style={styles.nameStack}>
            {/* "MY" is a placeholder for when no first name is set in
                Profile -- same slot, same style as the real possessive, so
                setting a name later is a straight swap, not a layout
                change. Plain text now, not a button -- see the header
                comment above for where Profile access moved to. */}
            <Text style={styles.possessiveName}>{firstName ? `${firstName}'s` : 'MY'}</Text>
            <Text style={styles.appName}>Inside Story</Text>
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  // No alignSelf override -- defaults to the row's own alignItems
  // ('flex-start'), so its top edge lines up with the top of the title
  // text next to it.
  helpCol: {
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    marginRight: 12,
    marginLeft: -10,
  },
  // Matches the app name's own size/font/color exactly (see `appName`
  // below) rather than a separate, larger title style.
  title: {
    ...typography.eyebrow,
    fontSize: 13,
    color: colors.primary,
  },
  // Top-aligned (not centered) so the first line of nameStack -- "MY" or
  // "{name}'s" -- lines up with the page title's top, the same way the
  // help icon on the left does.
  rightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  // Right-aligns "MY"/the possessive name over "Inside Story" below it,
  // so the two lines share a right edge instead of the name floating
  // wherever its own (shorter) text width happens to end.
  nameStack: {
    alignItems: 'flex-end',
  },
  // Same size/font/color as `appName` below -- no longer a separate
  // cursive style, per request.
  possessiveName: {
    ...typography.eyebrow,
    fontSize: 13,
    color: colors.primary,
  },
  appName: {
    ...typography.eyebrow,
    fontSize: 13,
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
