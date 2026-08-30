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
import { VersionLabel } from '../components/VersionLabel';
import { colors } from '../constants/colors';
import { useHomeDataReady } from '../hooks/useHomeDataReady';
import { getReferenceDatabase, initializeDatabase, settlePastScheduledMeals } from '../lib/db';
import { handleIncomingIsFile } from '../lib/isFileLinking';

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
  //
  // NOT where the ground-theme preference (Profile > Appearance &
  // Navigation > Ground color) gets applied, even though this looks like
  // the obvious place -- an earlier version did exactly that
  // (getVisualPreferences().then(applyGroundTheme) alongside
  // initializeDatabase() below) and it didn't work, reported directly:
  // "It only changes the color of the profile header and only after I
  // restart the app." Root cause: expo-router's file-based routing has to
  // require() every screen file to build its route table, which runs every
  // one of their module-scope StyleSheet.create() calls (each baking in
  // whatever constants/colors.ts's colors.background etc. already were)
  // before this component's own effects ever get a chance to fire -- by
  // the time an effect here could apply a theme, it's already too late for
  // anything but a JSX value read at render time. See
  // constants/colors.ts's own `initialGround`/GROUND_THEMES comments and
  // getGroundThemeSync's comment in lib/visualPreferences.ts for the real
  // fix: a synchronous read at colors.ts's own module-load time, which
  // runs before ANY file's `import { colors } from '.../constants/colors'`
  // can resolve, this one included.
  useEffect(() => {
    initializeDatabase()
      .catch((error) => console.error('initializeDatabase failed', error))
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
  //
  // Generous on purpose -- a real ~130MB one-time copy can legitimately
  // take a while on a slow device, well past the loading screen's own
  // ~30-60 second estimate. This is a last resort, not a normal path.
  // Hoisted out of the effect below, 2026-08-27, so the second, longer
  // safety-net effect further down can measure its own wait relative to
  // this same number rather than a second, separately hand-typed one.
  const REFERENCE_DB_STARTUP_TIMEOUT_MS = 120_000;

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

    const timeoutId = setTimeout(() => {
      if (!settled) {
        // 2026-08-28, direct on-device report: this timeout firing exactly
        // as designed (letting someone into the app while a slow reimport
        // keeps running in the background) was showing up as a full-screen
        // red LogBox error, not a quiet log line -- console.error is what
        // triggers that in a dev-client build, and a working fallback path
        // isn't the same thing as a crash. console.warn still surfaces in
        // the Metro/adb log for a real developer to notice, just without
        // alarming whoever's actually holding the phone.
        console.warn(
          'getReferenceDatabase: startup gate timed out after ' +
            REFERENCE_DB_STARTUP_TIMEOUT_MS +
            'ms waiting for the reference-database import; letting the app open anyway.',
        );
        markResolved();
      }
    }, REFERENCE_DB_STARTUP_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  // 2026-08-27, direct on-device report: "It loads to 95% and stalls
  // forever without moving." Root cause: the 120s gate just above only
  // ever forces referenceImportResolved true, which lets the real app
  // tree (including Home) START mounting below -- it does NOT free
  // Home's own first load from the SAME underlying getReferenceDatabase()
  // promise if the real import genuinely never finishes, only stalls (a
  // real, one-time asset copy this size has no native timeout of its own
  // -- see getReferenceDatabase's own comment in lib/db.ts). isComplete
  // below is referenceImportResolved && homeDataReady, so if Home's own
  // load stays blocked on that same still-pending import,
  // DatabaseSetupScreen's own overlay never clears no matter how long
  // someone waits -- the "fails open" promise this whole gate exists for
  // was never actually kept end to end, only half of it. This second,
  // longer safety net closes that real gap directly: if the WHOLE
  // combined wait still isn't done a full 60 seconds after the
  // reference-db gate above already gave up, force the loading overlay
  // closed regardless of whether Home's own first load ever reports
  // success -- Home may show its own honest empty/still-loading state
  // underneath rather than real data yet, but that is a genuinely usable
  // app someone can back out of and retry, not a screen with no way
  // forward at all.
  useEffect(() => {
    let settled = false;
    const HARD_STARTUP_TIMEOUT_MS = REFERENCE_DB_STARTUP_TIMEOUT_MS + 60_000;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        // 2026-08-28: console.warn, not console.error -- see the sibling
        // timeout's own comment just above for why. Direct on-device
        // report: this exact line firing (working as designed) was the
        // "error" shown right after the app finally opened.
        console.warn(
          'DatabaseSetupScreen: hard startup timeout fired after ' +
            HARD_STARTUP_TIMEOUT_MS +
            'ms; forcing the loading overlay closed regardless of Home’s own load state.',
        );
        setReferenceDbReady(true);
      }
    }, HARD_STARTUP_TIMEOUT_MS);
    return () => {
      settled = true;
      clearTimeout(timeoutId);
    };
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
            {/* contentStyle, 2026-08-21: without an explicit background here,
                a Stack.Screen's own NATIVE container has no guaranteed
                opaque backing of its own -- it relies entirely on whatever
                its JS content happens to paint, at the React Navigation/
                react-native-screens level, one layer below anything this
                app's own code controls. Added directly in response to a
                real, confirmed report and screenshot: the (tabs) group's
                own persistently-mounted background (including
                ScreenBackground.tsx's footer divider) was visibly showing
                through profile.tsx, a Stack-pushed screen that should be
                fully opaque over whatever's mounted behind it. This gives
                every screen a guaranteed solid backing at the native
                container level itself, not just wherever this app's own
                Views happen to paint one. */}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="(tabs)" />
              {/* 2026-08-21 -- the native header (with its own back arrow) is
                  removed by direct request: Profile is reached only via
                  TabHub's own corner tile and closes via its own blue circle
                  X (see profile.tsx's own closeButton), so a second, redundant
                  way back was never needed. profile.tsx now renders its own
                  "Profile" title row as a sticky, non-scrolling bar instead,
                  taking over the safe-area top inset this native header used
                  to reserve. */}
              <Stack.Screen
                name="profile"
                options={{
                  headerShown: false,
                  title: 'Profile',
                }}
              />
              {/* 2026-08-21, Phase 0 of the header growth vine/Timeline
                  plan -- the header's own title is now a real tappable
                  route into this screen (see ScreenHeader.tsx's own
                  comment). A plain themed native header for now, same
                  pattern as "assessment" below; this screen is a
                  deliberate stub, the real Timeline UI is Phase 6, not
                  built here. */}
              <Stack.Screen
                name="timeline"
                options={{
                  headerShown: true,
                  title: 'Your Inside Story',
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
                  Profile/Check-In/The Digest each are. */}
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
              {/* Quick-log, 2026-08-30 -- both reached from Home's own Log a
                  Meal card. Themed the same as every other Stack screen. */}
              <Stack.Screen
                name="find-meal"
                options={{
                  headerShown: true,
                  title: "Find a Meal You've Had",
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
              <Stack.Screen
                name="voice-log"
                options={{
                  headerShown: true,
                  title: 'Say What You Ate',
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                }}
              />
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
              {/* The Fermentation Tracker, 2026-08-20 -- reached from
                  food-items.tsx's own "Saved Fermentations" list (a new
                  "Track" action button) or opened bare. Sets its own fixed
                  title at render (see app/fermentation-tracker.tsx), same
                  themed-header treatment as every other Stack screen. */}
              <Stack.Screen
                name="fermentation-tracker"
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
            <VersionLabel />
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
