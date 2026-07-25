import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../constants/colors';

export default function RootLayout() {
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
