import { useRouter, type Href, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { TAB_ROUTES } from '../constants/tabs';

// Left-to-right order of the bottom tabs, as routes -- derived from the one
// shared list in constants/tabs.ts, also used by TabHub and (for name/title
// only) app/(tabs)/_layout.tsx.
const TAB_ORDER: Href[] = TAB_ROUTES.map((route) => route.path);

// How far (px) or how fast (px/s) a swipe must travel before it counts as
// an intentional tab-change rather than an accidental brush of the screen.
const DISTANCE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 500;

// How long the "flies off screen" exit animation takes once a swipe clears
// the threshold, before the actual tab switch fires -- fast enough to feel
// responsive, slow enough to read as a deliberate motion rather than a cut.
const EXIT_DURATION_MS = 180;

// Wraps a tab screen's content so a horizontal swipe moves to the
// previous/next bottom tab, in addition to tapping the tab bar itself.
// activeOffsetX/failOffsetY below mean the pan gesture only takes over from
// a nested vertical ScrollView once the movement is clearly horizontal --
// normal up/down scrolling inside a screen is left completely alone.
//
// 2026-07-26, in several stages (see git history / the Notion App
// Development Log for the full blow-by-blow): real per-frame drag tracking
// replaced a plain distance/velocity check in onEnd; a persistent navy
// backdrop (styles.clip) replaced a white gap the Tabs navigator's own
// default left behind a dragged screen; several attempts at showing a
// "peek" of the neighboring tab's own background during the drag were
// built and then dropped in turn (a runtime-screenshot version with no peek
// until a tab had been visited once per session, then a bundled-per-tab-
// image version needing exact header/footer-inset math to avoid a visible
// pop) -- all now removed entirely, not just simplified: every non-Home
// tab's resting state (GatedTabContent.tsx) shows the exact same shared
// field image now, and that screen is very likely already mounted (Tabs
// keeps visited screens mounted in the background), so there's nothing left
// for a separate peek layer to usefully add -- it was pure redundant
// complexity by this point, and had started producing its own visual
// artifacts (a second, independently-animated copy of an image already
// about to be shown for real). The current screen's own drag/exit is all
// that's left; whatever's behind it during that exit is just styles.clip's
// flat navy for the ~400ms round trip, which is brief enough not to need
// papering over.
//
// 2026-07-27: this used to also bump a shared dropRequestId (see
// TabRevealContext.tsx, since removed) and delay the horizontal exit by
// TAB_REVEAL_DURATION_MS, giving GatedTabContent's own risen panel time to
// visibly retreat first if the tab being left had something revealed.
// Removed along with GatedTabContent's own rise/drop animation -- dropping
// back to resting is instant now (an instant swap, not a slide), so there's
// nothing left to wait for before the horizontal exit can start right away.
export function SwipeableTabScreen({
  children,
  // Pass false to turn the gesture off, e.g. while a screen is mid-form
  // with text inputs, where a horizontal drag more likely means "move the
  // text cursor" than "switch tabs."
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);

  function goToOffset(offset: 1 | -1) {
    const currentIndex = TAB_ORDER.indexOf(pathname as Href);
    if (currentIndex === -1) {
      translateX.value = 0;
      return;
    }
    // Wraps around instead of stopping at the ends, 2026-07-27, explicitly
    // requested: swiping past Reports (the last tab) lands on Home, and
    // swiping backward from Home lands on Reports (the last tab). The
    // extra `+ TAB_ORDER.length` before the modulo is what keeps this
    // correct going backward from index 0 too -- JS's `%` can return a
    // negative result for a negative left-hand side (e.g. -1 % 7 === -1,
    // not 6), which this offsets away before the modulo ever runs.
    const nextIndex = (currentIndex + offset + TAB_ORDER.length) % TAB_ORDER.length;
    router.navigate(TAB_ORDER[nextIndex]);
    // Reset instantly (not animated) once the switch has fired -- this
    // screen is about to unmount in favor of the new tab's own fresh
    // instance, which starts at its own resting position regardless.
    translateX.value = 0;
  }

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      'worklet';
      const passedThreshold =
        event.translationX < -DISTANCE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD
          ? 1
          : event.translationX > DISTANCE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD
            ? -1
            : 0;

      if (passedThreshold !== 0) {
        // Flies fully off in the swipe's own direction before the actual
        // tab switch fires -- see EXIT_DURATION_MS's own comment.
        translateX.value = withTiming(passedThreshold === 1 ? -width : width, { duration: EXIT_DURATION_MS }, (finished) => {
          if (finished) runOnJS(goToOffset)(passedThreshold);
        });
      } else {
        // Didn't clear the threshold -- springs back to resting rather
        // than snapping instantly, same "this is a real, physical surface"
        // feel as the drag itself.
        translateX.value = withSpring(0);
      }
    });

  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={styles.clip}>
        <Animated.View style={[styles.fill, currentStyle]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1 },
});
