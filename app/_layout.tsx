import { Nunito_600SemiBold, useFonts } from '@expo-google-fonts/nunito';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActiveInputProvider } from '../components/ActiveInputContext';
import { AppKeyboard } from '../components/AppKeyboard';
import { OverlayProvider, OverlayRoot } from '../components/OverlayContext';
import { colors } from '../constants/colors';
import { IridescentHueProvider } from '../hooks/useIridescentHueRotation';
import { initializeDatabase } from '../lib/db';

// Kept visible until the header's own branding font finishes loading (see
// ScreenHeader.tsx) -- without this, the native splash screen hides itself
// automatically as soon as the JS bundle starts, and "{name}'s Inside
// Story" would flash in the system fallback font for a moment before
// swapping to Nunito once it loads. 2026-07-25: the app's first real
// custom-font load -- @expo-google-fonts/dancing-script has sat in
// package.json unused since an earlier, since-reverted cursive-name idea,
// with no font-loading code anywhere; this is that infrastructure's actual
// first use.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold });
  const [dbReady, setDbReady] = useState(false);

  // getDatabase() elsewhere in the app only opens the SQLite file -- it
  // never guarantees initializeDatabase()'s CREATE TABLE/migration logic
  // has run. That guarantee previously only came as a side effect of
  // whichever screen happened to call getReferenceDatabase() first (see its
  // comment in lib/db.ts), which not every screen does (e.g. Home reading
  // the profile) -- on a brand-new install with no prior database file,
  // that screen hits "no such table" instead. Doing it here once, before
  // any screen mounts, removes the ordering dependency entirely.
  useEffect(() => {
    initializeDatabase()
      .catch((error) => console.error('initializeDatabase failed', error))
      .finally(() => setDbReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  // Android only -- edge-to-edge (app.json's edgeToEdgeEnabled) means the
  // app draws behind the system nav bar, but without this, Android has no
  // idea the app's own background there is dark and falls back to its own
  // default scrim instead of matching colors.background, which is exactly
  // the "bottom of the window turns dark" seam this fixes. NOT
  // setBackgroundColorAsync -- that call is explicitly unsupported once
  // edge-to-edge is on; setStyle('dark') is the documented edge-to-edge
  // equivalent. Full control over the OS's own contrast scrim in that area
  // also depends on a native config setting this JS-level call can't
  // reach -- if this doesn't fully clear it up in Expo Go, that's why; it
  // needs a real build (or dev client) to verify completely.
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('dark');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  // Renders nothing (splash screen stays up, see above) rather than
  // flashing the fallback system font for a frame -- a page's branding
  // header is exactly the kind of place a font swap is most noticeable.
  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    // Required by react-native-gesture-handler's Gesture Detector API (used
    // for the tab-swipe gesture in components/SwipeableTabScreen.tsx) --
    // without a root view of this type, gestures are silently dropped on
    // Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Stale note from the old light "Sage & Cream" theme, kept accurate
          2026-07-25: the app is dark navy now (see constants/colors.ts),
          so "dark" icons/text here is arguably wrong too, but that's a
          separate, unverified change -- not touched as a side effect of
          this edit. */}
      <StatusBar style="dark" />
      {/* Provides the one global "which field is focused, and how do I edit
          it" registry AppTextInput/AppKeyboard both read from -- wrapped
          around the whole Stack (not just the (tabs) group) so the same
          single AppKeyboard instance below works identically on top-level
          stack screens (profile.tsx, purple-digest.tsx) too, not just tab
          screens. */}
      {/* OverlayProvider: a minimal portal stand-in (see OverlayContext.tsx)
          -- Dropdown.tsx's open menu needs to escape ScreenBackground.tsx's
          own `overflow: 'hidden'` body, which a plain in-tree absolute View
          can't do on its own. */}
      {/* IridescentHueProvider: one shared Reanimated value driving every
          shimmering element in the app (ScreenHeader/ScreenBackground/
          TabHub/IridescentRingCircle/Home's own footer line) -- wrapped
          around the whole tree, same level as ActiveInputProvider, since
          this app's own top-level stack screens (profile.tsx,
          purple-digest.tsx) could in principle use it too, not just the
          (tabs) group. See hooks/useIridescentHueRotation.ts's own history
          for why this replaced a plain JS setInterval. */}
      <IridescentHueProvider>
        <ActiveInputProvider>
          <OverlayProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              {/* headerStyle/headerTintColor: the native header defaults to a
                  plain white bar with black text, which stood out as a bright
                  seam against every other screen's dark navy background. Matched
                  to the app's own palette instead -- profile.tsx's own
                  ScrollView background already used colors.background, so this
                  was purely the native chrome above it, not the page itself. */}
              <Stack.Screen
                name="profile"
                options={{
                  headerShown: true,
                  title: 'Profile',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              <Stack.Screen name="assessment" options={{ headerShown: true, title: 'Check-In' }} />
              <Stack.Screen
                name="purple-digest"
                options={{
                  headerShown: true,
                  title: 'The Purple Digest',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              {/* No fixed `title` here -- this screen sets its own via its
                  own <Stack.Screen options={{title}}/> at render time (see
                  app/food-items.tsx), since it covers every builder's every
                  saved/favorited category, not one fixed thing the way
                  Profile/Check-In/The Purple Digest each are. */}
              <Stack.Screen
                name="food-items"
                options={{
                  headerShown: true,
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              {/* Same "no fixed title" reasoning as food-items.tsx's own
                  Stack.Screen just above. */}
              <Stack.Screen
                name="food-item-detail"
                options={{
                  headerShown: true,
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
            </Stack>
            {/* Before AppKeyboard, deliberately -- see OverlayContext.tsx's own
                comment: the keyboard must always paint on top of an open
                dropdown's backdrop/menu, never the other way around. */}
            <OverlayRoot />
            <AppKeyboard />
          </OverlayProvider>
        </ActiveInputProvider>
      </IridescentHueProvider>
    </GestureHandlerRootView>
  );
}
