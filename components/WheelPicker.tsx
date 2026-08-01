import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
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

// The wraparound-copy machinery (REPEAT_COUNT contiguous copies of the row
// list, spinning past either end into the next copy) that lived here
// 2026-08-01 is gone as of the same day, a few hours later -- removed
// outright rather than tuned further. What it cost: every copy was a full
// set of real, live Reanimated rows (memoized, but still real), and on a
// four-wheel screen that meant anywhere from ~165 (at REPEAT_COUNT 3, the
// already-once-corrected value) up to 300-500+ (at the original 9) rows
// mounted at once -- reported on-device as several seconds to open a
// wheel screen, and residual lag elsewhere in the app afterward.
// Switching each wheel to a virtualized Animated.FlatList (so only the
// rows near the visible window actually mount) was tried as the next
// step, and DID cut the mount cost -- but a FlatList is a VirtualizedList,
// and every one of these wheels sits inline inside SideBuilder's own
// vertical ScrollView (Dish Name field above them, Continue button below)
// -- nesting a VirtualizedList inside a plain ScrollView of the same
// orientation is a real, documented React Native anti-pattern (confirmed
// on-device via RN's own console warning, not just the docs), because the
// inner list can't reliably determine its own visible window once it's
// not the page's actual scroll container -- exactly the mechanism this
// whole rewrite exists to get right. Unlike FoodLookup's own big results
// list (pulled out of any surrounding ScrollView entirely, see
// SideBuilder's own comment on that), these wheels can't be pulled out --
// they're small fields mixed inline with text inputs and buttons in one
// coherent scrolling form, not a screen of their own.
// The actual fix: remove the multiplication instead of trying to
// virtualize it away. Without wraparound copies, a wheel only ever mounts
// its OWN real option list once -- worst case (Cut Prep) 19 rows, not 19
// times some copy count. That's a small enough number that a plain
// Animated.ScrollView (which nests inside another ScrollView without any
// of the VirtualizedList problem above) never needed virtualizing in the
// first place. The accepted tradeoff: spinning past either end now stops
// there, like an ordinary bounded picker, rather than wrapping around --
// the "just like a real combination lock" wraparound was a nice-to-have
// layered on top of a working picker, and cost real usability (a
// multi-second-to-open builder, on the app's single most-used form) for a
// week before this was caught. Worth reconsidering later with an approach
// that doesn't multiply mounted rows at all (e.g. a plain modulo on the
// row index inside the row's own animated style, no extra rows involved)
// rather than reintroducing either of the two approaches tried and
// rejected here.

// Sits at the top of every wheel as a real, selectable "nothing chosen
// yet" position. A wheel always has SOMETHING at its centre, which would
// otherwise hand every field a silent default -- directly against this
// form's own rule that nothing starts pre-chosen and every value must be
// picked deliberately. Landing here reports null back to the caller, so
// "centred" and "chosen" stay honestly distinct.
export const WHEEL_PLACEHOLDER = '—';

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
  const optionsKey = options.join('\u0001');
  const rows = useMemo(() => [WHEEL_PLACEHOLDER, ...options], [optionsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);
  const height = itemHeight * VISIBLE_ROWS;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const selectedLabel = selected ?? WHEEL_PLACEHOLDER;
  // Keeps the wheel physically pointing at whatever the caller says is
  // selected -- covers first mount, an external reset (the Save buttons
  // clear every field), and a change of options (switching measurement
  // system rebuilds the unit list).
  const centeredIndex = Math.max(0, rows.indexOf(selectedLabel));
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: centeredIndex * itemHeight, animated: false });
    scrollY.value = centeredIndex * itemHeight;
    // Deliberately keyed on the resolved index only -- adding scrollY/
    // itemHeight would re-fire this on every frame of a drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centeredIndex]);

  // Momentum end, not onScroll: reporting mid-flick would fire a selection
  // for every row the wheel passes through, and each of those is a real
  // state update in the parent form. Clamped rather than wrapped -- see
  // this file's own top-of-file comment for why wraparound was removed;
  // scrolling past either end is now a real, visible stop, same as a
  // native ScrollView's own bounce/rubber-banding at its edges.
  const handleSettled = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.max(0, Math.min(rows.length - 1, Math.round(event.nativeEvent.contentOffset.y / itemHeight)));
      const value = rows[index];
      const next = value === WHEEL_PLACEHOLDER ? null : value;
      if (next !== selected) onSelect(next);
    },
    [itemHeight, rows, selected, onSelect],
  );

  // Stable across renders so the memoized rows below aren't invalidated by a
  // fresh closure every time. Each row calls this with its own index
  // rather than receiving a pre-bound arrow, which is what keeps it stable.
  const handleRowPress = useCallback(
    (index: number) => scrollRef.current?.scrollTo({ y: index * itemHeight, animated: true }),
    [itemHeight],
  );

  return (
    <View style={[styles.frame, { height, minWidth }]}>
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
        {rows.map((row, index) => (
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

      {/* Shading on the curving-away thirds, 2026-07-31. A real cylinder
          doesn't just foreshorten toward its edges, it falls into shadow
          there -- the rotation alone gave the geometry of a drum without
          the lighting of one. These two gradients darken the top and
          bottom bands to transparent at the centre, so the barrel reads as
          a lit surface turning away into shade.
          Rendered AFTER the list so they sit over the rows, and
          before the window band so the live value is never shaded.
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

// One row on the barrel. Its own component rather than an inline map so
// each can hold its own useAnimatedStyle -- calling a hook inside a .map()
// breaks the rules of hooks the moment the list length changes, which it
// genuinely does here (the unit list rebuilds when measurement system
// changes).
// memo'd for the same keystroke-cascade reason as WheelPicker above -- this
// is the component that multiplies (four wheels of 7 to 18 rows each), so
// it's where the cost actually lived. Its props are all primitives plus one
// stable callback and one SharedValue whose identity never changes, so the
// comparison genuinely holds.
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
