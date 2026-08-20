import { useEffect, useState } from 'react';
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
//
// 2026-08-16, a real, direct correction: "That was put in place to hide
// the loading time of the home screen on the first load of the app
// starting... It has not changed a bit since I reported it." Confirmed by
// reading app/_layout.tsx directly -- `isComplete` had only ever reflected
// the reference-database import, with zero connection to Home's own,
// separate, un-gated load underneath it. `isComplete` now means "the WHOLE
// combined startup wait is genuinely over" (see app/_layout.tsx's own
// wiring), not just the reference-database half of it. This screen's own
// container is now a real, absolutely-positioned, high-elevation overlay
// (not just a flex:1 box) so it can render ON TOP of the real app --
// mounted underneath it the moment the reference-database import itself
// resolves, so Home can start its own real load immediately, while this
// stays visible over it until Home genuinely finishes too. Nothing about
// the actual percent/phase logic below changed -- only what real event
// `isComplete` is now allowed to represent.
export function DatabaseSetupScreen({
  // True once the WHOLE real startup wait is genuinely over -- both the
  // reference-database import AND Home's own first real data load (see
  // app/_layout.tsx's own wiring: referenceImportResolved && homeDataReady).
  // This is the real trigger event driving the catch-up animation below.
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
        label={phase === 'loading' ? `${Math.round(percent)}%` : 'Finished!'}
      />
      {/* A real, separate Text below the ring rather than ProgressRing's
          own sublabel slot -- 2026-08-10, direct report: that slot lives
          inside a fixed 78px-wide container built for Home's own compact
          multi-ring row, too narrow for real sentence-length copy. This
          screen is a real, standalone full-screen use, not a compact row,
          so it gets its own, real, full-width, wrapping text instead of
          touching that shared component's own existing narrow layout.
          Copy itself changed 2026-08-19, direct request -- "Setting up
          your food database for the first time" was also just literally
          inaccurate past the very first launch (this screen appears every
          time, per this file's own header comment, just resolving near-
          instantly on every launch after the first), where "Loading Your
          Inside Story" reads correctly regardless of which launch this
          is. */}
      <Text style={styles.message}>Loading Your Inside Story</Text>
    </Animated.View>
  );
}

const PROGRESS_TICK_MS = 200;
// How much of the remaining distance to the 95% cap gets closed on each
// tick -- calibrated against the real ~30-60 second window originally
// reported. A real, honest limitation, not fixable by a "better" number:
// this is a real device-speed-dependent estimate, so it will genuinely
// finish early on a faster phone (or a faster run) and late on a slower
// one. Since isComplete now jumps straight to 100 with no catch-up
// animation to absorb that variance, a real import finishing well short of
// this cap (or well past where the estimate happens to be sitting) will
// visibly snap -- an accepted, honest tradeoff of removing the animation,
// not a bug.
const PROGRESS_STEP_FACTOR = 0.012;
const PROGRESS_CAP = 95;
// How long "Finished!" stays on screen before the pop-out starts -- long
// enough to actually register as a real, distinct state, not just a
// flash mid-transition.
const FINISHED_HOLD_MS = 600;
const POP_DURATION_MS = 260;

const styles = StyleSheet.create({
  container: {
    // Absolutely positioned with a full inset, not just flex:1 -- this
    // screen can now be rendered as a real overlay ON TOP of the already-
    // mounted app tree (see app/_layout.tsx's own wiring), not only as the
    // sole thing rendered. flex:1 alone would just share space with a
    // sibling instead of covering it. A real, high elevation/zIndex, well
    // above anything else in the app (floating hub buttons top out around
    // 24, per this app's own already-documented Android elevation history)
    // -- this is meant to be the one thing nothing else can render above.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 999,
    zIndex: 999,
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
