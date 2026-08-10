import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { ProgressRing } from './ProgressRing';

// A real, one-time loading screen -- 2026-08-10, direct request after
// confirming what a 30-60 second blank-looking Home page on first launch
// actually was: lib/db.ts's own getReferenceDatabase() copies the app's
// entire bundled, scored, 22,000+-food reference database onto the
// device's own writable storage the first time anything actually needs
// it (expo-sqlite's importDatabaseFromAssetAsync), a real, one-time file
// operation big enough to take real, noticeable time on a phone. That
// import was never gated on anything visible -- the native splash screen
// only ever waited on fonts and the LOCAL app database's own table setup
// (see app/_layout.tsx's own dbReady), so the app's real shell rendered
// looking normal while its content sat silently empty underneath, with
// nothing telling a person it was doing real work rather than being
// broken. Confirmed directly this happens on every genuinely fresh
// install, not just a dev artifact -- a new customer's first launch has
// no record of ever having imported this database, so this same screen
// is exactly what they'd see too.
//
// A real, follow-up request, 2026-08-10: "a standard loading feature that
// fills an area as it gets farther or closer to being at 100%, and it
// shows the percent loaded until it finishes, says it is finished, and
// then the app pops into existence." A real, honest constraint shapes how
// this is built: expo-sqlite's importDatabaseFromAssetAsync is a single
// opaque Promise with no byte-level progress callback anywhere in its own
// API -- there is no real number to read "43% copied" from. Rather than
// fake a precision this app can't actually measure, or leave the request
// half-met, the percentage shown here is a real, disclosed ESTIMATE: it
// animates smoothly toward, but deliberately never reaches, 95% while the
// real import is still in flight (an asymptotic curve, so it never looks
// frozen or visibly wrong regardless of whether the real import finishes
// in 15 seconds or 90), calibrated against this app's own directly
// reported real-world timing (roughly 30-60 seconds). The one thing this
// screen NEVER does is lie about actual completion -- the jump to 100%
// and "Finished!" only happens once the real underlying Promise has
// genuinely resolved (see the `isComplete` prop below), so however
// approximate the number is while climbing, the moment it says done is
// always true.
//
// Reuses ProgressRing (already built for Home's own nutrient fuel gauges)
// rather than a new, separate progress-bar component -- the exact same
// "fills as it gets closer to 100%" visual the request describes, with
// zero changes needed to that shared component.
const PROGRESS_TICK_MS = 200;
// How much of the remaining distance to the 95% cap gets closed on each
// tick -- calibrated (not guessed) against the real ~30-60 second window
// directly reported for this import: at this rate the ring reads roughly
// 80% around 30 seconds in and roughly 93% around 60 seconds in, a
// genuinely continuous-feeling climb across that whole real range rather
// than rushing to the cap in the first few seconds and then sitting still.
const PROGRESS_STEP_FACTOR = 0.012;
const PROGRESS_CAP = 95;
// How long "Finished!" stays on screen before the pop-out starts -- long
// enough to actually register as a real, distinct state, not just a flash
// mid-transition.
const FINISHED_HOLD_MS = 600;
const POP_DURATION_MS = 260;

export function DatabaseSetupScreen({
  // True once the real reference-database import has genuinely resolved
  // (see app/_layout.tsx's own referenceDbReady/isComplete wiring) --
  // this screen owns its own "Finished!" hold + pop-out timing, and calls
  // onExitComplete only once that real, visible transition has actually
  // finished playing, not the instant the underlying import resolves.
  isComplete,
  onExitComplete,
}: {
  isComplete: boolean;
  onExitComplete: () => void;
}) {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'finished' | 'exiting'>('loading');
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // The estimated climb -- see this file's own top comment for why this
  // is a disclosed estimate, not a real byte count.
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setPercent((current) => Math.min(PROGRESS_CAP, current + (PROGRESS_CAP - current) * PROGRESS_STEP_FACTOR));
    }, PROGRESS_TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // The real import has genuinely finished -- jump to the true 100% and
  // move to the "Finished!" state.
  useEffect(() => {
    if (isComplete && phase === 'loading') {
      setPercent(100);
      setPhase('finished');
    }
  }, [isComplete, phase]);

  // Hold "Finished!" briefly, then start the real pop-out transition.
  useEffect(() => {
    if (phase !== 'finished') return;
    const timer = setTimeout(() => setPhase('exiting'), FINISHED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // The real "pops into existence" transition -- a quick scale-up-and-
  // fade on this screen itself, which reveals the real app already
  // sitting underneath once this one is gone. Matches the same
  // withTiming(...).then(runOnJS(...)) pattern already established in
  // SwipeableTabScreen.tsx for "only advance once the real animation has
  // actually finished playing," not a fixed setTimeout guess.
  useEffect(() => {
    if (phase !== 'exiting') return;
    scale.value = withTiming(1.08, { duration: POP_DURATION_MS, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: POP_DURATION_MS, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onExitComplete)();
    });
  }, [phase, onExitComplete, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ProgressRing
        percent={percent}
        color={colors.primary}
        size={104}
        strokeWidth={9}
        label={phase === 'loading' ? `${Math.round(percent)}%` : 'Finished!'}
        sublabel="Setting up your food database"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
