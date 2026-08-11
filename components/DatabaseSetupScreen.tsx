import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { ProgressRing } from './ProgressRing';

// A real, one-time loading screen -- 2026-08-10, direct request after
// confirming what a 30-60 second blank-looking Home page on first launch
// actually was: lib/db.ts's own getReferenceDatabase() copies the app's
// entire bundled, scored, 22,000+-food reference database onto the
// device's own writable storage the first time anything actually needs
// it (expo-sqlite's importDatabaseFromAssetAsync), a real, one-time file
// operation big enough to take real, noticeable time on a phone. Confirmed
// directly this happens on every genuinely fresh install, not just a dev
// artifact -- a new customer's first launch has no record of ever having
// imported this database, so this same screen is exactly what they'd see.
//
// A real, honest constraint shapes the percentage shown: expo-sqlite's
// importDatabaseFromAssetAsync is a single opaque Promise with no
// byte-level progress callback anywhere in its own API -- there is no
// real number to read "43% copied" from. The percentage climbing below is
// a disclosed ESTIMATE, calibrated (not guessed) against this app's own
// directly reported real-world timing (roughly 30-60 seconds) -- but the
// one thing it never does is claim done before it's true.
//
// A real, direct follow-up the same day tried a CATCH-UP animation instead
// of jumping straight to 100 the instant isComplete fires -- a real, short,
// elapsed-time-driven tween from wherever the estimate happened to be
// sitting, so the finish never read as an arbitrary snap. Removed again,
// 2026-08-11, direct instruction: "Remove that" -- the manufactured "still
// doing something" animation for the last stretch was itself the problem,
// not the snap it was built to avoid. Back to the simpler, honest behavior:
// `isComplete` jumps `percent` straight to a true 100 and moves to
// 'finished' immediately, no animated close.
export function DatabaseSetupScreen({
  // True once the real reference-database import has genuinely resolved
  // (see app/_layout.tsx's own referenceImportResolved wiring) -- this is
  // the real trigger event driving the catch-up animation below.
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

  // Phase 1: the estimated climb -- see this file's own top comment for
  // why this is a disclosed estimate, not a real measurement. Never
  // reaches its own 95% cap on its own; only the real trigger below moves
  // this past that point.
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setPercent((current) => Math.min(PROGRESS_CAP, current + (PROGRESS_CAP - current) * PROGRESS_STEP_FACTOR));
    }, PROGRESS_TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // The real trigger event -- isComplete flips true the instant the real
  // import genuinely resolves. Jumps straight to a true 100 and 'finished'
  // -- no animated close, no manufactured "still working" stretch. The
  // display never says done a moment before the underlying import
  // genuinely is (isComplete is the one real signal this waits on), but
  // once it is, it says so immediately.
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
        label={phase === 'loading' || phase === 'catching-up' ? `${Math.round(percent)}%` : 'Finished!'}
      />
      {/* A real, separate Text below the ring rather than ProgressRing's
          own sublabel slot -- 2026-08-10, direct report: that slot lives
          inside a fixed 78px-wide container built for Home's own compact
          multi-ring row, and "Setting up your food database for the
          first time" genuinely doesn't fit there, showing as a clipped
          "Setting up..." with the rest of the sentence lost. This screen
          is a real, standalone full-screen use, not a compact row, so it
          gets its own, real, full-width, wrapping text instead of
          touching that shared component's own existing narrow layout. */}
      <Text style={styles.message}>{'Setting up your food database\nfor the first time'}</Text>
    </Animated.View>
  );
}

const PROGRESS_TICK_MS = 200;
// How much of the remaining distance to the 95% cap gets closed on each
// tick -- calibrated against the real ~30-60 second window originally
// reported. A real, honest limitation, not fixable by a "better" number:
// this is a real device-speed-dependent estimate, so it will genuinely
// finish early on a faster phone (or a faster run) and late on a slower
// one -- the real catch-up animation above is what actually absorbs that
// variance gracefully regardless of which real percentage the import
// happens to finish at, rather than this constant needing to be perfectly
// tuned per device.
const PROGRESS_STEP_FACTOR = 0.012;
const PROGRESS_CAP = 95;
// The real, elapsed-time-driven catch-up from wherever the estimate had
// reached up to a true 100, triggered only once isComplete is genuinely
// true -- two real segments, not one flat tween (see the effect above
// for why): a main climb up to the shared 95% cap, then a deliberately
// slower final crawl from 95 to a true 100.
const CATCH_UP_MAIN_DURATION_MS = 900;
const CATCH_UP_FINAL_DURATION_MS = 700;
const CATCH_UP_TICK_MS = 30;
// How long "Finished!" stays on screen before the pop-out starts -- long
// enough to actually register as a real, distinct state, not just a
// flash mid-transition.
const FINISHED_HOLD_MS = 600;
const POP_DURATION_MS = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  message: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
  },
});
