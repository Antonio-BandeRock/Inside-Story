import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useActiveField } from './ActiveInputContext';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { useFooterBandHeight } from '../constants/floatingButton';
import { computeNextLift, LIFT_DURATION_MS } from '../lib/keyboardLift';

// Keeps whatever field is being typed into above AppKeyboard, everywhere at
// once.
//
// 2026-09-09, reported directly: "pretty much everytime I go to fill something
// in a field... the keyboard pops up right in the way of the field so i don't
// ever know if what I am typing is correct until I get done and remove the
// keyboard."
//
// WHY NOTHING ALREADY DID THIS. React Native's own keyboard avoidance listens
// for OS keyboard events. AppKeyboard is not the OS keyboard: it is a View this
// app draws itself (every AppTextInput sets showSoftInputOnFocus false), so the
// OS never reports one opening and none of that machinery fires. Twelve files
// reserve extra scroll room so a covered field CAN be scrolled to; nothing
// anywhere moved one into view.
//
// THE KEYBOARD'S POSITION IS KNOWN; THE FIELD'S IS NOT. AppKeyboard has a fixed
// height and sits at a fixed offset from the bottom, so its top edge is the
// same line every time. A field is wherever the screen and the scroll position
// put it, so it is looked at once, on focus, and the content lifts by the
// difference. A field already above the line reports no overlap and nothing
// moves.
//
// Only fill fields are affected, and by construction rather than by a rule
// anyone has to remember: Dropdown, PopoverSelect and InlineSearchSelectList
// contain no AppTextInput at all. They hand their search box to AppKeyboard's
// own search row, which sits above the keys where nothing can cover it.
//
// A SHARED VALUE, NOT STATE. This wraps the whole navigator, so re-rendering it
// per focus would reconcile every mounted screen. Reanimated moves the content
// without React re-rendering anything.

type KeyboardLift = {
  liftFieldIntoView: (fieldBottomY: number) => void;
  releaseLift: () => void;
  lift: SharedValue<number> | null;
};

const NO_LIFT: KeyboardLift = { liftFieldIntoView: () => {}, releaseLift: () => {}, lift: null };

// One context, holding an object that is stable for the provider's whole
// lifetime, so consuming it can never cause a re-render.
const KeyboardLiftContext = createContext<KeyboardLift | null>(null);

export function KeyboardLiftProvider({ children }: { children: ReactNode }) {
  const lift = useSharedValue(0);
  // The same number in plain JS: read when computing the next lift, so the
  // maths never reads a half-finished animation frame out of the shared value.
  const liftRef = useRef(0);
  const { height: windowHeight } = useWindowDimensions();
  const footerBandHeight = useFooterBandHeight();

  // The keyboard's top edge. Derived from the same two values AppKeyboard
  // positions itself with (`bottom: footerBandHeight`, `height:
  // KEYBOARD_HEIGHT`), so it cannot drift from where the keyboard is.
  const keyboardTopY = windowHeight - footerBandHeight - KEYBOARD_HEIGHT;

  const value = useMemo<KeyboardLift>(() => {
    return {
      lift,
      liftFieldIntoView(fieldBottomY: number) {
        const next = computeNextLift({ currentLift: liftRef.current, fieldBottomY, keyboardTopY });
        if (next === null) return; // already right: start no animation at all
        liftRef.current = next;
        lift.value = withTiming(next, { duration: LIFT_DURATION_MS });
      },
      releaseLift() {
        if (liftRef.current === 0) return;
        liftRef.current = 0;
        lift.value = withTiming(0, { duration: LIFT_DURATION_MS });
      },
    };
    // `lift` and `liftRef` are stable for this provider's lifetime, so
    // keyboardTopY is the one real dependency, and it only changes on a
    // rotation or a safe-area change, never while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardTopY]);

  return <KeyboardLiftContext.Provider value={value}>{children}</KeyboardLiftContext.Provider>;
}

// Forgiving rather than throwing, unlike useActiveInputControls: a field inside
// a Modal is in its own native window, outside this provider entirely. It
// should still type perfectly well, it simply has nothing to lift.
export function useKeyboardLift(): KeyboardLift {
  return useContext(KeyboardLiftContext) ?? NO_LIFT;
}

// Wraps the content that moves. AppKeyboard and the version label are siblings
// outside it, so the keyboard stays put while the content slides behind it.
export function KeyboardLiftView({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { lift } = useKeyboardLift();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift === null ? 0 : -lift.value }],
  }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

// Lowers the content when the keyboard closes. A leaf that renders null:
// subscribing the provider itself to the active field would re-render every
// mounted screen on every focus change.
export function KeyboardLiftReleaser() {
  const activeField = useActiveField();
  const { releaseLift } = useKeyboardLift();
  useEffect(() => {
    if (activeField === null) releaseLift();
  }, [activeField, releaseLift]);
  return null;
}
