import { Nunito_600SemiBold, useFonts } from '@expo-google-fonts/nunito';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../constants/colors';

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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

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
  if (!fontsLoaded) {
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
      </Stack>
    </GestureHandlerRootView>
  );
}
