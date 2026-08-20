import { Nunito_600SemiBold, useFonts } from '@expo-google-fonts/nunito';
import * as Linking from 'expo-linking';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActiveInputProvider } from '../components/ActiveInputContext';
import { AppKeyboard } from '../components/AppKeyboard';
import { DatabaseSetupScreen } from '../components/DatabaseSetupScreen';
import { OverlayProvider, OverlayRoot } from '../components/OverlayContext';
import { applyGroundTheme, colors } from '../constants/colors';
import { useHomeDataReady } from '../hooks/useHomeDataReady';
import { getReferenceDatabase, initializeDatabase, settlePastScheduledMeals } from '../lib/db';
import { handleIncomingIsFile } from '../lib/isFileLinking';
import { getVisualPreferences } from '../lib/visualPreferences';

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
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold });
  const [dbReady, setDbReady] = useState(false);
  // Real reference-database readiness, 2026-08-10, separate from dbReady
  // above -- that one only covers the LOCAL app database's own table
  // setup (fast), not the real, one-time copy of the bundled 22,000+-food
  // reference database onto the device (see DatabaseSetupScreen.tsx's own
  // header comment for the full "why this exists" history). Deliberately
  // does NOT gate the native splash screen below -- the splash only shows
  // a static image with no way to display real, live text, so it still
  // hides as soon as fonts/dbReady are ready, revealing
  // DatabaseSetupScreen (a real, JS-rendered screen, so it CAN say
  // something) underneath for however long the reference import
  // genuinely takes, then the real app once it resolves.
  //
  // Two real, separate states, not one -- referenceImportResolved is the
  // real underlying Promise's own completion; referenceDbReady only flips
  // once DatabaseSetupScreen's own "Finished!" hold + pop-out transition
  // has actually finished PLAYING (its own onExitComplete callback), so
  // the real app is never swapped in mid-animation.
  const [referenceImportResolved, setReferenceImportResolved] = useState(false);
  const [referenceDbReady, setReferenceDbReady] = useState(false);
  // 2026-08-16 -- the real other half of the startup wait. See
  // lib/homeReadySignal.ts's own header comment for the full "why": the
  // loading screen used to only ever reflect referenceImportResolved,
  // leaving Home's own separate, un-gated first load to populate on its
  // own with nothing covering it.
  const homeDataReady = useHomeDataReady();

  // getDatabase() elsewhere in the app only opens the SQLite file -- it
  // never guarantees initializeDatabase()'s CREATE TABLE/migration logic
  // has run. That guarantee previously only came as a side effect of
  // whichever screen happened to call getReferenceDatabase() first (see its
  // comment in lib/db.ts), which not every screen does (e.g. Home reading
  // the profile) -- on a brand-new install with no prior database file,
  // that screen hits "no such table" instead. Doing it here once, before
  // any screen mounts, removes the ordering dependency entirely.
  // 2026-08-19: also resolves and applies the person's chosen ground theme
  // (constants/colors.ts's applyGroundTheme) here, alongside dbReady, not
  // as its own separate gate -- it has to happen before this returns
  // (see the `if (!fontsLoaded || !dbReady) return null` below), which is
  // what keeps the Stack (and therefore every screen's own module-scope
  // StyleSheet.create() calls, each of which bakes in colors.background/
  // surface/etc. once at import time) from ever mounting before the right
  // colors are in place. A real preference-load failure here still falls
  // back to whatever colors.ts already shipped with (Deep Teal) rather than
  // blocking startup on it.
  useEffect(() => {
    Promise.all([
      initializeDatabase(),
      getVisualPreferences().then((prefs) => applyGroundTheme(prefs.groundTheme)),
    ])
      .catch((error) => console.error('startup init failed', error))
      .finally(() => setDbReady(true));
  }, []);

  // Real, fire-and-forget "keep Trends honest" pass, 2026-08-14 -- see
  // settlePastScheduledMeals' own comment in lib/db.ts for the full "why."
  // Deliberately does NOT gate anything visible (no loading state, no
  // splash-screen dependency) -- a session where this happens to run
  // slightly late (or fails outright, logged rather than surfaced) is no
  // worse than before this existed; both Schedule Meals lenses also call
  // it defensively on their own focus, so this is a real, additional
  // "catch it as early as possible" pass, not the only place it runs.
  // Gated on dbReady, not fired unconditionally -- the local tables it
  // reads/writes (schedule_items, food_trials, meals, ...) only exist once
  // initializeDatabase() above has actually finished.
  useEffect(() => {
    if (!dbReady) return;
    settlePastScheduledMeals().catch((error) =>
      console.error('settlePastScheduledMeals failed at startup', error),
    );
  }, [dbReady]);

  // Kicks off the real, potentially slow reference-database import here
  // too, rather than leaving it to whichever screen happens to touch it
  // first -- getReferenceDatabase() itself is memoized (a real, module-
  // level promise, see its own comment in lib/db.ts), so calling it here
  // is completely safe alongside every other place in the app that already
  // calls it; they all resolve against this same, one real import. Fails
  // OPEN, not closed -- a genuine import failure still reveals the real
  // app rather than stranding someone on this screen forever, matching the
  // same "log it, don't block on it" pattern initializeDatabase's own
  // effect above already uses.
  //
  // 2026-08-11, a real, reported gap in that "fails open" design: it only
  // ever covered a REJECTED import (.catch already handles that) -- not a
  // genuinely HUNG one that never settles at all. Reported exactly that
  // way: DatabaseSetupScreen's own progress estimate climbed to its 95%
  // cap and then sat there indefinitely, the app never opening. The
  // reference database is a real, large (~130MB+) one-time SQLite asset
  // copy -- expo-sqlite's importDatabaseFromAssetAsync has no documented
  // timeout of its own, and if the native call genuinely never calls back
  // (not just slow, but stuck), nothing above this ever fires, and
  // referenceImportResolved never becomes true.
  //
  // Fixed with a bounded startup-only safety net, deliberately NOT placed
  // inside getReferenceDatabase() itself: that function's own contract
  // stays a truthful reflection of the real import for every other real
  // caller in the app (a screen mid-session correctly SHOULD keep waiting
  // for real data, however long it takes, not give up early). This timer
  // only decides how long the STARTUP GATE specifically is willing to wait
  // before letting the person into the app anyway -- it does not cancel or
  // otherwise affect the real underlying import, which keeps running in
  // the background and, if it does eventually succeed, still correctly
  // becomes the memoized result every other real caller uses from that
  // point on.
  useEffect(() => {
    let settled = false;
    const markResolved = () => {
      if (!settled) {
        settled = true;
        setReferenceImportResolved(true);
      }
    };

    getReferenceDatabase()
      .catch((error) => console.error('getReferenceDatabase failed', error))
      .finally(markResolved);

    // Generous on purpose -- a real ~130MB one-time copy can legitimately
    // take a while on a slow device, well past the loading screen's own
    // ~30-60 second estimate. This is a last resort, not a normal path.
    const REFERENCE_DB_STARTUP_TIMEOUT_MS = 120_000;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        console.error(
          'getReferenceDatabase: startup gate timed out after ' +
            REFERENCE_DB_STARTUP_TIMEOUT_MS +
            'ms waiting for the reference-database import; letting the app open anyway.',
        );
        markResolved();
      }
    }, REFERENCE_DB_STARTUP_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  // Step 6 of the real device-pairing prerequisite list, 2026-08-15 -- a
  // real, independent listener for a real .is file being tapped (a file
  // manager, an email/WhatsApp attachment), running ALONGSIDE Expo
  // Router's own hashimotosapp:// linking, not instead of it (see
  // lib/isFileLinking.ts's own header comment for the full reasoning on
  // why this needs its own separate listener rather than a registered
  // route). Deliberately gated on referenceDbReady, not dbReady/
  // fontsLoaded alone -- a cold launch via a tapped .is file still has to
  // wait through the whole real startup sequence (fonts, local db, the
  // reference-database import) before there's a real, mounted Stack to
  // navigate anywhere within; by the time this effect's own dependency
  // flips true, that's guaranteed to already be the case. Checks
  // getInitialURL() once (the real cold-start case) and registers the
  // live 'url' listener for as long as the app runs afterward (the real
  // already-open-and-resumed case) -- RootLayout itself never unmounts, so
  // one registration for the whole app lifetime is correct.
  useEffect(() => {
    if (!referenceDbReady) return;

    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingIsFile(url, router.push);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingIsFile(url, router.push);
    });
    return () => subscription.remove();
  }, [referenceDbReady, router]);

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

  // The native splash screen has already hidden by this point (it only
  // ever waited on the two checks above) -- what covers the rest of the
  // real startup wait is DatabaseSetupScreen, rendered below as a real
  // overlay once the reference-database import resolves, staying up until
  // Home ALSO reports its own first load done (see lib/homeReadySignal.ts's
  // own header comment). The real app tree only mounts once the reference
  // import itself resolves -- Home's own load depends on it directly (real
  // per-food lookups against the reference database) -- but that's a
  // SEPARATE condition from whether the loading screen is still showing,
  // which is why both are checked independently below rather than one
  // early-returning before the other ever gets a chance to render.
  //
  // A fast, already-imported launch with an already-fast Home (every
  // launch after the first) still passes through here, just resolving
  // close to instantly -- isComplete flips true almost immediately, and
  // the screen's own real "Finished!" + pop-out transition plays out
  // honestly fast rather than being artificially held open to look more
  // consistent with a slow, real first-time wait.
  return (
    <>
      {referenceImportResolved ? (
        // Required by react-native-gesture-handler's Gesture Detector API
        // (used for the tab-swipe gesture in
        // components/SwipeableTabScreen.tsx) -- without a root view of
        // this type, gestures are silently dropped on Android.
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
          stack screens (profile.tsx, etc.) too, not just tab screens. */}
      {/* OverlayProvider: a minimal portal stand-in (see OverlayContext.tsx)
          -- Dropdown.tsx's open menu needs to escape ScreenBackground.tsx's
          own `overflow: 'hidden'` body, which a plain in-tree absolute View
          can't do on its own. */}
      {/* 2026-08-17: the IridescentHueProvider that used to wrap here --
          one shared Reanimated value driving a continuously-animated
          rainbow across ScreenHeader/ScreenBackground/TabHub/
          IridescentRingCircle/Home's own footer line -- is removed
          entirely. Reported as real, confirmed battery drain: it forced a
          real JS-thread update up to 10 times a second, the whole time the
          app was open on any tab (react-native-svg's <Stop>, used by
          ScreenHeader's app-name text, can't be driven purely on the
          native thread). See constants/colors.ts's own header note for the
          full replacement -- every one of those elements is now a flat,
          static color instead ("features that stay active but not
          animated"), with no shared animation value left to provide. */}
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
              {/* headerStyle/headerTintColor added 2026-08-08 -- this native
                  header was the one Stack.Screen left out when every other
                  one (profile, purple-digest, food-items, food-item-detail)
                  already got themed to match the app, defaulting to a
                  plain white bar with black text against everything else's
                  dark navy. */}
              <Stack.Screen
                name="assessment"
                options={{
                  headerShown: true,
                  title: 'Check-In',
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
              {/* 2026-08-15 -- the real receiving screen for a shared
                  item, reached via a hashimotosapp://import-shared?...
                  deep link (see lib/sharing.ts's own encodeShareLink/
                  decodeShareLink -- moved out of lib/db.ts the same day).
                  Themed the same as every other Stack screen. */}
              <Stack.Screen
                name="import-shared"
                options={{
                  headerShown: true,
                  title: 'Shared With You',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              {/* Step 4 of the real device-pairing prerequisite list,
                  2026-08-15 -- reached from Profile. Themed the same as every
                  other Stack screen. */}
              <Stack.Screen
                name="connections"
                options={{
                  headerShown: true,
                  title: 'Connections',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              {/* Reached via a real hashimotosapp://connect deep link (see
                  lib/connections.ts's own shareConnectionInvite) -- the same
                  real shape import-shared's own Stack.Screen above already
                  establishes for exactly this "receive an out-of-band
                  invite, decode it, show an explicit accept/decline choice"
                  pattern. */}
              <Stack.Screen
                name="connect"
                options={{
                  headerShown: true,
                  title: 'Connect',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              {/* 2026-08-16, the real barcode-scanning feature -- reached from
                  Food's own "My Foods" hub. Themed the same as every other
                  Stack screen. */}
              <Stack.Screen
                name="scan-product"
                options={{
                  headerShown: true,
                  title: 'Scan a Product',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              {/* No fixed `title` here, same reasoning as food-item-detail's
                  own Stack.Screen above -- this screen sets its own via its
                  own <Stack.Screen options={{title}}/> at render time, once
                  the real scanned product it's showing has actually loaded.
                  2026-08-16, reached from food-items.tsx's own
                  itemType==='scannedProduct' case. */}
              <Stack.Screen
                name="food-product-detail"
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
        </GestureHandlerRootView>
      ) : null}
      {/* Rendered as a real overlay ON TOP of the tree above (not instead
          of it), for as long as the whole combined startup wait is still
          going -- see this function's own comment further up, and
          DatabaseSetupScreen.tsx's own header comment, for the full "why"
          this changed from an early-returned, mutually-exclusive screen
          into an overlay that coexists with the real app tree. */}
      {!referenceDbReady ? (
        <DatabaseSetupScreen
          isComplete={referenceImportResolved && homeDataReady}
          onExitComplete={() => setReferenceDbReady(true)}
        />
      ) : null}
    </>
  );
}
