import { useIsFocused } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CurrentPageHelpProvider } from '../../components/CurrentPageHelp';
import { ScreenBackground } from '../../components/ScreenBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TabHub } from '../../components/TabHub';

// headerShown: false everywhere here -- <ScreenHeader/> below (rendered
// once, as a sibling of <Tabs>, not once per screen -- see that
// component's own 2026-07-27 comment for why) takes its place. The native
// Tabs header used to duplicate that same title, stacking two header bars
// and wasting vertical space, especially in landscape where height is
// already tight.
//
// tabBarStyle: display 'none' -- the old 7-icon bottom bar is replaced by
// TabHub, a single bottom-center floating button that opens a picker for
// all 7 screens. This is a deliberate thumb-ergonomics choice: a
// bottom-center button is equally reachable one-handed regardless of
// which hand holds the phone, where a row of 7 icons forces some of them
// into a stretch for anyone. Swiping (SwipeableTabScreen) still covers the
// fast path between adjacent tabs; TabHub covers jumping anywhere else.
// The underlying Tabs navigator is kept (not swapped for a Stack) so every
// screen keeps behaving exactly as it did -- still mounted in the
// background on switch, still relying on useFocusEffect to refresh data.
//
// 2026-07-26: a single `<ScreenBackground variant="field" />` renders here,
// once, permanently mounted behind everything -- the fix for "the shared
// resting background should be one truly static canvas that never slides,
// resizes, or remounts between tabs." An earlier attempt had each tab's own
// GatedTabContent render its own separate copy of this image, which then
// moved along with that screen's own SwipeableTabScreen drag/slide,
// betraying the "everything else slides on top of a fixed backdrop"
// illusion -- moving it here instead, above/behind <Tabs> and never inside
// any per-screen or animated wrapper, is what actually makes it immovable.
//
// 2026-08-17: the `sky` prop (the animated sun/moon/starfield overlay that
// used to ride on top of this image) is removed -- reported as real,
// confirmed battery drain, see ScreenBackground.tsx's own header note.
//
// 2026-07-27: both the background and <Tabs> now live inside their own
// nested flex:1 View, placed *after* <ScreenHeader/> in normal document
// flow -- not an absolutely-positioned offset computed from
// useScreenHeaderHeight() like this used to be. Flex layout gives that
// wrapper the exact remaining space below the header for free, so the
// background's `cover` crop (and everything <Tabs> renders inside it) is
// automatically confined to the right region without this file needing to
// know the header's own pixel height at all.
export default function TabLayout() {
  // 2026-08-21, direct report: the shared background here (specifically
  // its own footer divider line) was visibly showing through Profile, a
  // Stack-pushed screen that this whole group sits BEHIND once open, and
  // two attempts at making Profile's own render tree more opaque (an
  // explicit contentStyle on the root Stack, then an unconditional opaque
  // View painted first in Profile's own component) both failed to block
  // it -- conclusive proof the leak isn't coming from Profile's own code
  // at all, since nothing Profile paints can matter if whatever's leaking
  // renders on top of it regardless. This is the source-side fix instead:
  // stop rendering ScreenBackground/TabHub entirely whenever this group
  // isn't the focused screen, rather than trusting React Navigation to
  // fully hide them on its own. `useIsFocused` (not useFocusEffect, which
  // only fires on gain/lose, not a live boolean) reflects this Stack.
  // Screen's own real focus state -- true while showing, false the moment
  // Profile/Assessment/etc. push on top. Deliberately does NOT also gate
  // ScreenHeader -- that's a single persistent instance specifically to
  // avoid a real flash-of-placeholder-name bug (see its own header
  // comment), and isn't implicated in this leak.
  const isFocused = useIsFocused();
  return (
    <CurrentPageHelpProvider>
      <View style={{ flex: 1 }}>
        <ScreenHeader />
        <View style={{ flex: 1 }}>
          {isFocused ? (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <ScreenBackground variant="field" />
            </View>
          ) : null}
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              // React Navigation's own per-screen scene wrapper paints an
              // opaque default background, and since <Tabs> renders after
              // (on top of) the shared background View above, that default
              // fully covers it -- background image, sky/critters, and the
              // footer strip behind TabHub/LensHub all at once -- unless
              // explicitly made transparent here. `sceneStyle` is the real,
              // current @react-navigation/bottom-tabs prop for this (see
              // this file's own git history for why `sceneContainerStyle`,
              // an older/nonexistent prop name, silently did nothing).
              sceneStyle: { backgroundColor: 'transparent' },
            }}
          >
            {/* 2026-07-26: Home is now the literal "index" file (formerly
                home.tsx; Food moved to food.tsx, formerly index.tsx) -- Expo
                Router always treats the file named "index" as the real route
                for a group's own bare path ("/"), full stop, no override
                mechanism involved. This replaces two earlier attempts (a
                plain initialRouteName prop, then Expo Router's own documented
                unstable_settings.initialRouteName) that were both, per
                Expo Router's own source, supposed to work for exactly this
                case but empirically didn't survive a real cold launch --
                swapping which file *is* "index" sidesteps that uncertainty
                entirely instead of relying on a fallback/override layer. */}
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="food" options={{ title: 'Food' }} />
            <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
            <Tabs.Screen name="schedule" options={{ title: 'Schedules' }} />
            <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
            <Tabs.Screen name="log" options={{ title: 'Signals' }} />
            <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
            {/* Promoted from a Stack push (app/purple-digest.tsx, outside this
                group entirely) to a real tab, 2026-08-05 -- see
                constants/tabs.ts's own TAB_ROUTES entry for the full
                reasoning. */}
            <Tabs.Screen name="purple-digest" options={{ title: 'Purple Digest' }} />
            {/* The 9th real tab, added 2026-08-13 -- see
                constants/tabs.ts's own TAB_ROUTES entry for the full
                reasoning. */}
            <Tabs.Screen name="garden" options={{ title: 'Garden' }} />
          </Tabs>
        </View>
        {isFocused ? <TabHub /> : null}
      </View>
    </CurrentPageHelpProvider>
  );
}
