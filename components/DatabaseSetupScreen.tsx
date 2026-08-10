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
// Real, direct follow-up, same day, after watching this on a real device
// with a real import finishing around 74% of the estimate's own curve:
// "Can we set it up so it gradually goes to 100% but only hits the full
// 100% ... when we know the app is fully loaded... Is there a trigger
// event that the loader can watch for." The real trigger already existed
// (`isComplete`, driven by app/_layout.tsx's own getReferenceDatabase()
// resolving) -- what was missing was using it to animate a real, short,
// smooth CATCH-UP from wherever the estimate happened to be sitting up to
// a true 100%, instead of snapping straight there. This closes the real
// tension in the request directly: the catch-up only ever STARTS once
// isComplete is genuinely true (never early), but visually CLOSES the gap
// over a real, brief, elapsed-time-driven animation rather than an
// instant jump, so it never reads as a meaningless number regardless of
// which real percentage the estimate happened to reach first.
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
  const [phase, setPhase] = useState<'loading' | 'catching-up' | 'finished' | 'exiting'>('loading');
  // Kept in exact sync with `percent` inside every setPercent call below
  // (never via a separate reactive effect, which would risk reading a
  // one-render-stale value) -- the catch-up phase needs to know exactly
  // where the estimate really was the instant isComplete flips true, to
  // animate FROM that real point, not from some already-stale snapshot.
  const percentRef = useRef(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Phase 1: the estimated climb -- see this file's own top comment for
  // why this is a disclosed estimate, not a real measurement. Never
  // reaches its own 95% cap on its own; only the real trigger below moves
  // this past that point.
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setPercent((current) => {
        const next = Math.min(PROGRESS_CAP, current + (PROGRESS_CAP - current) * PROGRESS_STEP_FACTOR);
        percentRef.current = next;
        return next;
      });
    }, PROGRESS_TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // The real trigger event -- isComplete flips true the instant the real
  // import genuinely resolves. Moves to a real catch-up animation rather
  // than jumping straight to 100, regardless of where the estimate had
  // gotten to.
  useEffect(() => {
    if (isComplete && phase === 'loading') {
      setPhase('catching-up');
    }
  }, [isComplete, phase]);

  // Phase 2: a real, elapsed-time-driven tween from wherever the estimate
  // had reached up to a true 100 -- always the same real, fixed total
  // duration regardless of the starting point (a 5-point gap and a
  // 50-point gap both close in the same real amount of time), so this
  // never reads as an arbitrary jump. Only once this real animation has
  // actually reached 100 does the screen move to "Finished!" -- the
  // display never says done a moment before the underlying import
  // genuinely is.
  //
  // Real, direct follow-up, same day, on-device: the original single-
  // stage, 550ms version read as "obviously faking it" -- a real, honest
  // completion signal shouldn't LOOK like a trick. Rebuilt as two real
  // segments rather than one flat tween: a main climb from wherever the
  // estimate was up to the same 95% cap the earlier estimate phase
  // already uses (900ms, a believable, visible amount of movement -- not
  // a snap), then a deliberately SLOWER final crawl from 95 to a true 100
  // (700ms for just that last 5 points -- roughly 3x the per-point pace
  // of the main climb), so the very end reads as a genuine, unhurried
  // settling-in rather than a rushed finish. Total, for the common case
  // (an estimate that hadn't yet reached 95 when isComplete fires): 1.6s,
  // nearly 3x the original 550ms and comfortably over the "at least
  // double" ask. A real import that runs long enough for the estimate to
  // reach 95 on its own skips straight to the slow final segment, so the
  // "last 5%" always gets this same deliberate treatment regardless of
  // how the earlier climb went.
  useEffect(() => {
    if (phase !== 'catching-up') return;
    const startPercent = percentRef.current;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let next: number;
      let done: boolean;
      if (startPercent >= PROGRESS_CAP) {
        // Already at or past the cap on its own -- go straight into the
        // slow final crawl from wherever it actually is.
        const t = Math.min(1, elapsed / CATCH_UP_FINAL_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        next = startPercent + (100 - startPercent) * eased;
        done = t >= 1;
      } else if (elapsed <= CATCH_UP_MAIN_DURATION_MS) {
        // Main climb: startPercent up to the 95% cap. Quadratic ease-out
        // -- a believable, visible pace, not a snap.
        const t = elapsed / CATCH_UP_MAIN_DURATION_MS;
        const eased = 1 - Math.pow(1 - t, 2);
        next = startPercent + (PROGRESS_CAP - startPercent) * eased;
        done = false;
      } else {
        // The slow final crawl: 95 up to a true 100. Cubic ease-out (a
        // touch stronger than the main climb's quadratic) plus a longer
        // real duration for a much smaller range -- reads as genuinely,
        // deliberately slower, not just the same curve compressed.
        const t = Math.min(1, (elapsed - CATCH_UP_MAIN_DURATION_MS) / CATCH_UP_FINAL_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        next = PROGRESS_CAP + (100 - PROGRESS_CAP) * eased;
        done = t >= 1;
      }
      setPercent(next);
      percentRef.current = next;
      if (done) {
        clearInterval(interval);
        setPhase('finished');
      }
    }, CATCH_UP_TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

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
