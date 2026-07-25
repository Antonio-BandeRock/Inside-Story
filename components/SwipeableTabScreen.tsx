import { useRouter, type Href, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { TAB_ROUTES } from '../constants/tabs';

// Left-to-right order of the bottom tabs, as routes -- derived from the one
// shared list in constants/tabs.ts, also used by TabHub and (for name/title
// only) app/(tabs)/_layout.tsx.
const TAB_ORDER: Href[] = TAB_ROUTES.map((route) => route.path);

// How far (px) or how fast (px/s) a swipe must travel before it counts as
// an intentional tab-change rather than an accidental brush of the screen.
const DISTANCE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 500;

// Wraps a tab screen's content so a horizontal swipe moves to the
// previous/next bottom tab, in addition to tapping the tab bar itself.
// activeOffsetX/failOffsetY below mean the pan gesture only takes over from
// a nested vertical ScrollView once the movement is clearly horizontal --
// normal up/down scrolling inside a screen is left completely alone.
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

  function goToOffset(offset: 1 | -1) {
    const currentIndex = TAB_ORDER.indexOf(pathname as Href);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;
    router.navigate(TAB_ORDER[nextIndex]);
  }

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((event) => {
      'worklet';
      if (event.translationX < -DISTANCE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD) {
        runOnJS(goToOffset)(1);
      } else if (event.translationX > DISTANCE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD) {
        runOnJS(goToOffset)(-1);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
