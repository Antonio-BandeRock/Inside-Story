import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

// A combination-lock style wheel picker -- 2026-07-31, replacing the flat
// vertical pill scroller that came before it.
//
// The look is modelled on a real combination padlock (the reference image
// the request came with): one value sits flat and fully legible in a
// window at the centre, and its neighbours curl away above and below as
// though printed on a rotating drum. That curl is a genuine 3D rotation
// (rotateX under a perspective transform), not a fake -- which is what
// makes the top and bottom read as the same physical surface continuing
// around the barrel rather than as separate faded rows.
//
// Why this replaced the previous version rather than just being restyled:
// the old box was 76dp tall with 22dp of padding at each end, which left
// room for roughly one and a half rows. Measured on a real Galaxy A54, the
// SECOND row in every column was sliced through by the down-chevron badge
// (`tbsp`, `Halved` and `Sautéed` were each half-hidden). A drum needs its
// neighbours visible to read as a drum at all, so the height and the badges
// were part of the same problem.
//
// The chevron badges are gone entirely here. They existed to signal "this
// scrolls" on a flat list that gave no other hint; a wheel whose
// neighbours are visibly rotating away signals it far better, and the real
// padlock this is modelled on has no arrows either.

// 34 -> 26 (2026-07-31): on-device the rows carried a lot of dead vertical
// space above and below their text. 26 still clears the 12px caption line
// comfortably, and shrinks the whole wheel from 102dp to 78dp -- reclaiming
// 24dp of card height across a card that had grown tall.
const DEFAULT_ITEM_HEIGHT = 26;
// 3 rows visible: one curling in from the top, the live one, one curling
// away below -- exactly what the reference padlock shows per barrel.
const VISIBLE_ROWS = 3;
// How far the outer rows rotate. High enough to read as a real barrel,
// short of the angle where text becomes unreadable edge-on.
const MAX_ROTATION_DEG = 55;

// Barrel shading (see the two LinearGradients in the render). Black rather
// than a darker shade of the surface colour, so it reads as light falling
// off a curved surface rather than as a different-coloured panel. Kept at
// 0.55 rather than full: strong enough to sell the curve, light enough
// that the rows underneath stay legible, which is the whole reason the
// neighbours are shown at all.
const SHADE_STRONG = 'rgba(0,0,0,0.55)';
const SHADE_NONE = 'rgba(0,0,0,0)';

// Wraparound is back, 2026-08-01, a few hours after being removed outright
// -- see git history/CLAUDE.md for the two earlier attempts (multiplying
// every wheel's rows by a fixed copy count, then a rejected FlatList
// virtualization) and why both were wrong. The actual insight, arrived at
// after the drop-in-from-above bug on TabHub/LensHub turned out to be
// gated on WheelPicker having ANY live Reanimated content mounted, not on
// how much: the ONLY thing that ever needed the wraparound-copy buffer was
// whichever ONE wheel a person is actively touching at a given moment, not
// all three or four wheels on a screen simultaneously. A wheel that isn't
// being touched now renders as a plain, static, non-Reanimated three-row
// snapshot (see RESTING_*_STYLE and Resting below) until the moment it's
// tapped, at which point it mounts the real scrollable version below --
// this file's own WheelPickerActive -- and hands back to the static
// version the instant its scroll settles. That means the wraparound-copy
// cost is paid by at most ONE wheel at a time, lazily, only while actually
// in use, rather than by every wheel on the screen the instant it opens --
// which is what made copies expensive in the first place, independent of
// wraparound. REPEAT_COUNT itself can stay modest (matching the old,
// already-reasoned "one buffer loop each side of centre" value) precisely
// because it's no longer being multiplied by "every wheel on screen, all
// at once."
const REPEAT_COUNT = 3;
const MIDDLE_COPY = Math.floor(REPEAT_COUNT / 2);

// Sits at the top of every wheel as a real, selectable "nothing chosen
// yet" position. A wheel always has SOMETHING at its centre, which would
// otherwise hand every field a silent default -- directly against this
// form's own rule that nothing starts pre-chosen and every value must be
// picked deliberately. Landing here reports null back to the caller, so
// "centred" and "chosen" stay honestly distinct.
export const WHEEL_PLACEHOLDER = '—';

// The three resting-pose transforms every wheel settles into between
// interactions (see Resting below) -- module-level constants, not computed
// per row/per instance, because a row at rest is always at EXACTLY
// distance 0 (the live row) or distance 1 (its immediate neighbour): the
// same three numbers WheelRow's own useAnimatedStyle would converge to
// once scrollY stops changing, for every wheel and every value alike.
// Precomputing them once means the resting display needs zero Reanimated
// content of its own -- three plain Views with a fixed style, not a
// worklet in sight -- which is the whole point: nothing here should ever
// "run" for a wheel nobody is touching.
const RESTING_LIVE_STYLE = {
  opacity: 1,
  transform: [{ perspective: 420 }, { rotateX: '0deg' }, { scale: 1 }],
} as const;
const RESTING_TOP_STYLE = {
  opacity: 0.45,
  transform: [{ perspective: 420 }, { rotateX: `${-MAX_ROTATION_DEG}deg` }, { scale: 0.88 }],
} as const;
const RESTING_BOTTOM_STYLE = {
  opacity: 0.45,
  transform: [{ perspective: 420 }, { rotateX: `${MAX_ROTATION_DEG}deg` }, { scale: 0.88 }],
} as const;

// memo (2026-07-31) because of a real, measured performance path, not as a
// precaution: AppTextInput re-registers itself with the keyboard context on
// every keystroke (it has to -- the keyboard reads the live value from
// there), which re-renders SideBuilder, which renders four of these. Without
// memo that meant rebuilding roughly 53 animated rows per key press, and it
// was reported on-device as the keyboard feeling slow to respond.
//
// For this to actually hold, every prop must be referentially stable
// between keystrokes. They are: `options` are module constants except
// `unitOptions`, which SideBuilder now memoizes; `onSelect` is always a
// plain useState setter; `tabColor`/`minWidth` are primitives.
export const WheelPicker = memo(function WheelPicker({
  options,
  selected,
  onSelect,
  tabColor,
  minWidth = 0,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}: {
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  tabColor: string;
  // Floor width, supplied by the caller from its own measured label (see
  // SideBuilder's renderLabeledPicker) so a wheel is never narrower than
  // the word above it.
  minWidth?: number;
  itemHeight?: number;
}) {
  // Memoized on the option list's own contents, not its identity: callers
  // build these arrays inline (unitOptions is rebuilt whenever measurement
  // system resolves), so keying on the array reference alone would rebuild
  // `rows` every render and defeat the useCallback below it. That matters
  // here for the same reason it mattered in the Dish Name field: an
  // unstable callback identity feeding a child's effect is exactly what
  // caused a "Maximum update depth exceeded" loop earlier in this build.
  const optionsKey = options.join('');
  const rows = useMemo(() => [WHEEL_PLACEHOLDER, ...options], [optionsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const height = itemHeight * VISIBLE_ROWS;
  const selectedLabel = selected ?? WHEEL_PLACEHOLDER;
  const canonicalIndex = Math.max(0, rows.indexOf(selectedLabel));

  // Whether this ONE wheel currently owns the real, live, Reanimated
  // scrollable version -- see this file's own top comment. Starts (and
  // returns to) false: static until touched.
  const [isActive, setIsActive] = useState(false);

  return (
    <View style={[styles.frame, { height, minWidth }]}>
      {isActive ? (
        <WheelPickerActive
          rows={rows}
          canonicalIndex={canonicalIndex}
          selected={selected}
          onSelect={onSelect}
          tabColor={tabColor}
          itemHeight={itemHeight}
          onSettled={() => setIsActive(false)}
        />
      ) : (
        <WheelPickerResting rows={rows} canonicalIndex={canonicalIndex} itemHeight={itemHeight} onActivate={() => setIsActive(true)} />
      )}

      {/* Shading on the curving-away thirds, 2026-07-31. A real cylinder
          doesn't just foreshorten toward its edges, it falls into shadow
          there -- the rotation alone gave the geometry of a drum without
          the lighting of one. These two gradients darken the top and
          bottom bands to transparent at the centre, so the barrel reads as
          a lit surface turning away into shade.
          Shared between Resting and Active (rendered here, once, above
          whichever of the two is showing) so the two never have the
          slightest visual seam swapping between them.
          pointerEvents none on both so a drag still reaches the wheel. */}
      <LinearGradient
        pointerEvents="none"
        colors={[SHADE_STRONG, SHADE_NONE]}
        style={[styles.shade, { top: 0, height: itemHeight }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[SHADE_NONE, SHADE_STRONG]}
        style={[styles.shade, { bottom: 0, height: itemHeight }]}
      />

      {/* The lock's own window: a band across the middle row marking where
          the live value sits. Borders only on the top and bottom edges, so
          it reads as a cut-out the barrel turns behind rather than a
          highlighted button. Last in the stack so neither gradient can
          wash out the selected value's own framing. */}
      <View
        pointerEvents="none"
        style={[styles.window, { top: itemHeight, height: itemHeight, borderColor: tabColor }]}
      />
    </View>
  );
});

// The at-rest display for a wheel nobody is currently touching -- three
// plain, non-animated rows (previous value / live value / next value,
// wrapping around the ends the same way the active version does, via
// modulo on `rows`) using the precomputed RESTING_*_STYLE constants above.
// No Reanimated content at all: no SharedValue, no useAnimatedStyle, no
// ScrollView. This is the literal implementation of "don't run unless
// selected" -- there is nothing here that COULD run.
//
// TouchableOpacity's onPressIn (not onPress) is the activation trigger,
// deliberately -- onPress only fires after a full tap-and-release, and a
// person naturally trying to grab-and-drag a wheel picker on their very
// first touch would have that press cancelled by TouchableOpacity's own
// movement threshold before it ever fired, silently failing to activate.
// onPressIn fires the instant a touch begins, regardless of what it turns
// into next, so activation is reliable either way.
//
// Known, accepted UX tradeoff: the touch that activates a wheel is
// consumed by activation alone -- it does not also feed into the newly-
// mounted ScrollView as a continuing drag, since that ScrollView doesn't
// exist yet at the moment the touch began, and React Native's own touch
// responder system has no mechanism to hand an in-progress touch off to a
// view that didn't exist when the touch started. A person's first touch on
// a resting wheel always just wakes it (visually unchanged, since Resting
// and Active render identically at rest); a second, separate touch is what
// actually scrolls or selects. This was accepted as the safe option over a
// fully custom drag-gesture wheel (no real ScrollView, an unbounded
// Reanimated position driven by a Gesture.Pan and modulo'd per row), which
// would avoid the two-touch handoff entirely but is a much larger rewrite
// with its own untested feel/physics -- worth it only if this simpler
// version genuinely doesn't feel right in practice.
function WheelPickerResting({
  rows,
  canonicalIndex,
  itemHeight,
  onActivate,
}: {
  rows: string[];
  canonicalIndex: number;
  itemHeight: number;
  onActivate: () => void;
}) {
  const topLabel = rows[(canonicalIndex - 1 + rows.length) % rows.length];
  const liveLabel = rows[canonicalIndex];
  const bottomLabel = rows[(canonicalIndex + 1) % rows.length];
  const isLiveChosen = liveLabel !== WHEEL_PLACEHOLDER;

  return (
    <TouchableOpacity style={styles.restingTouch} onPressIn={onActivate} activeOpacity={1}>
      <View style={[{ height: itemHeight }, styles.row, RESTING_TOP_STYLE]}>
        <Text numberOfLines={1} style={[styles.rowText, styles.rowTextIdle]}>
          {topLabel}
        </Text>
      </View>
      <View style={[{ height: itemHeight }, styles.row, RESTING_LIVE_STYLE]}>
        <Text numberOfLines={1} style={[styles.rowText, isLiveChosen ? styles.rowTextLive : styles.rowTextIdle]}>
          {liveLabel}
        </Text>
      </View>
      <View style={[{ height: itemHeight }, styles.row, RESTING_BOTTOM_STYLE]}>
        <Text numberOfLines={1} style={[styles.rowText, styles.rowTextIdle]}>
          {bottomLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// The real, live, scrollable barrel -- mounted only while this ONE wheel
// is the one being touched (see WheelPicker's own isActive state above).
// Everything below is the same combination-lock mechanics this file has
// had since 2026-07-31, with wraparound restored (REPEAT_COUNT contiguous
// copies of `rows`, scrolling off one copy continuing into the next) --
// see this file's own top comment for why that's safe to do here in a way
// it wasn't when every wheel carried its own copies all the time.
function WheelPickerActive({
  rows,
  canonicalIndex,
  selected,
  onSelect,
  tabColor,
  itemHeight,
  onSettled,
}: {
  rows: string[];
  canonicalIndex: number;
  selected: string | null;
  onSelect: (value: string | null) => void;
  tabColor: string;
  itemHeight: number;
  onSettled: () => void;
}) {
  const loopedRows = useMemo(
    () => Array.from({ length: REPEAT_COUNT * rows.length }, (_, i) => rows[i % rows.length]),
    [rows],
  );
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const selectedLabel = selected ?? WHEEL_PLACEHOLDER;
  const centeredIndex = MIDDLE_COPY * rows.length + canonicalIndex;
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: centeredIndex * itemHeight, animated: false });
    scrollY.value = centeredIndex * itemHeight;
    // Deliberately keyed on the resolved index only -- adding scrollY/
    // itemHeight would re-fire this on every frame of a drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centeredIndex]);

  // Momentum end, not onScroll: reporting mid-flick would fire a selection
  // for every row the wheel passes through, and each of those is a real
  // state update in the parent form. The settled ABSOLUTE index is folded
  // back into a canonical row via modulo -- it can land in any of the
  // REPEAT_COUNT copies, not just the middle one. Always hands control
  // back to the resting display afterward (onSettled), regardless of
  // whether the value actually changed -- a wheel that's done being
  // touched has no reason to stay live.
  const handleSettled = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const absoluteIndex = Math.round(event.nativeEvent.contentOffset.y / itemHeight);
      const canonical = ((absoluteIndex % rows.length) + rows.length) % rows.length;
      const value = rows[canonical];
      const next = value === WHEEL_PLACEHOLDER ? null : value;
      if (next !== selected) onSelect(next);
      onSettled();
    },
    [itemHeight, rows, selected, onSelect, onSettled],
  );

  // Stable across renders so the memoized rows below aren't invalidated by a
  // fresh closure every time. Each row calls this with its own absolute
  // index rather than receiving a pre-bound arrow, which is what keeps it
  // stable.
  const handleRowPress = useCallback(
    (index: number) => scrollRef.current?.scrollTo({ y: index * itemHeight, animated: true }),
    [itemHeight],
  );

  return (
    <Animated.ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      // Snapping is what makes this feel like detented hardware rather
      // than a free-scrolling list -- it can only ever come to rest with
      // a row squarely in the window.
      snapToInterval={itemHeight}
      decelerationRate="fast"
      onMomentumScrollEnd={handleSettled}
      // Fires when a slow drag ends without throwing any momentum, which
      // onMomentumScrollEnd never sees.
      onScrollEndDrag={handleSettled}
      contentContainerStyle={{ paddingVertical: itemHeight }}
    >
      {loopedRows.map((row, index) => (
        <WheelRow
          key={index}
          label={row}
          index={index}
          scrollY={scrollY}
          itemHeight={itemHeight}
          tabColor={tabColor}
          isLive={row === selectedLabel}
          onPress={handleRowPress}
        />
      ))}
    </Animated.ScrollView>
  );
}

// One row on the barrel. Its own component rather than an inline map so
// each can hold its own useAnimatedStyle -- calling a hook inside a .map()
// breaks the rules of hooks the moment the list length changes, which it
// genuinely does here (the unit list rebuilds when measurement system
// changes).
// memo'd for the same keystroke-cascade reason as WheelPicker above -- this
// is the component that multiplies (up to REPEAT_COUNT copies of 7 to 18
// rows), so it's where the cost actually lived. Only ever mounted by
// WheelPickerActive now, i.e. for at most one wheel at a time -- see this
// file's own top comment.
const WheelRow = memo(function WheelRow({
  label,
  index,
  scrollY,
  itemHeight,
  tabColor,
  isLive,
  onPress,
}: {
  label: string;
  index: number;
  scrollY: SharedValue<number>;
  itemHeight: number;
  tabColor: string;
  isLive: boolean;
  onPress: (index: number) => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    // Distance, in rows, from the centre of the window. 0 = live.
    const offset = index - scrollY.value / itemHeight;
    const clamped = Math.max(-2, Math.min(2, offset));
    const distance = Math.abs(clamped);
    return {
      opacity: interpolate(distance, [0, 1, 2], [1, 0.45, 0.1]),
      transform: [
        // Perspective must come first for the rotation below to read as
        // depth rather than a flat vertical squash.
        { perspective: 420 },
        { rotateX: `${clamped * MAX_ROTATION_DEG}deg` },
        // The slight shrink is what sells the far edge of a curved surface
        // as being further away than the near edge.
        { scale: interpolate(distance, [0, 1, 2], [1, 0.88, 0.76]) },
      ],
    };
  });

  return (
    <Animated.View style={[{ height: itemHeight }, styles.row, animatedStyle]}>
      <TouchableOpacity onPress={() => onPress(index)} style={styles.rowTouch} activeOpacity={0.7}>
        {/* The live row takes the same near-white the card header uses
            (colors.textPrimary), not tabColor -- 2026-07-31. tabColor is
            this screen's colour for LABELS and chrome, so a green value
            sitting under a green label read as more of the same furniture;
            near-white is the app's content colour, which is what a chosen
            value actually is. Contrast against the idle rows comes from
            three stacked signals rather than hue alone: weight (bold vs
            regular), opacity (full vs 45%, applied by the barrel rotation),
            and now brightness. */}
        <Text
          numberOfLines={1}
          style={[styles.rowText, isLive ? styles.rowTextLive : styles.rowTextIdle]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    // Clips the barrel to the frame, which is what turns a scrolling list
    // into something that visibly disappears over a curved edge.
    overflow: 'hidden',
    // Opaque (2026-07-31), not the translucent inputBackground() every text
    // field uses. Measured problem, not a taste call: that helper is 35%
    // alpha, and the off-centre rows render at 45% opacity on top of it,
    // giving roughly 16% effective opacity over the Food tab's own busy
    // produce photograph. On-device, `Whole`/`Quartered`/`Sautéed`/
    // `Deep-Fried` were all but unreadable. The previous pill design hid
    // this because each pill carried its own near-solid background; a
    // wheel's rows have none.
    //
    // menuSurface is the app's existing token for exactly this case --
    // functional chrome (the App Keyboard, the Hub Menu Card) that
    // deliberately does NOT let the photo through, as opposed to content
    // cards that do. Using it here keeps that distinction consistent
    // rather than inventing a third surface treatment.
    backgroundColor: colors.menuSurface,
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  window: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // No fill: the value behind it must stay fully legible.
    backgroundColor: 'transparent',
  },
  // Fills the frame exactly the same way the active ScrollView does (no
  // explicit size of its own, sized entirely by the parent `frame`), so
  // swapping between Resting and Active never shifts anything.
  restingTouch: { flex: 1 },
  row: { justifyContent: 'center' },
  rowTouch: { flex: 1, justifyContent: 'center', paddingHorizontal: 6 },
  rowText: { ...typography.caption, textAlign: 'center' },
  rowTextLive: { ...typography.captionEmphasis, color: colors.textPrimary },
  // Lightened from colors.menuLabelMuted (2026-07-31): the neighbouring
  // values were dim enough on-device that it wasn't obvious the wheels
  // scrolled at all, which defeats the point of showing them. They carry
  // the same near-white as the live row now and stay clearly subordinate
  // through three other signals -- regular weight instead of bold, the
  // rotation's own opacity fade, and the new barrel shading over them.
  rowTextIdle: { color: colors.textSecondary },
});
