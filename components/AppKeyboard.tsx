import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useActiveInputControls, useActiveInputValue } from './ActiveInputContext';
import { AppTextInput } from './AppTextInput';
import { VoiceInputButton } from './VoiceInputButton';
import { colors } from '../constants/colors';
import {
  ACCESSORY_BUTTON_SIZE,
  KEYBOARD_HEIGHT,
  KEYBOARD_PADDING,
  KEY_BORDER_RADIUS,
  KEY_GAP,
  KEY_ROW_GAP,
  KEY_ROW_HEIGHT,
  SEARCH_ROW_HEIGHT,
} from '../constants/appKeyboard';
import { NAVIGATION_HAND, useFooterBandHeight } from '../constants/floatingButton';
import { TAB_REVEAL_DURATION_MS } from '../constants/tabReveal';
import { typography } from '../constants/typography';

const LETTER_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];
const NUMBER_ROWS = [
  ['1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '0'],
];
// A curated, not exhaustive, set of accented/special Latin characters --
// 2026-07-28, added after hitting a real wall trying to type "Sautéed" as
// a Side Dish name with no way to reach é. Covers the common vowel accents
// (á/à/â/ä, é/è/ê/ë, etc.) plus ñ/ç/ß, enough for everyday food-name use
// (crème, jalapeño, açaí, ...) without trying to be a full international
// keyboard.
const ACCENT_ROWS = [
  ['á', 'à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'í', 'ì'],
  ['î', 'ï', 'ó', 'ò', 'ô', 'ö', 'ú', 'ù', 'û', 'ü'],
  ['ñ', 'ç', 'ß'],
];

type Mode = 'letters' | 'numbers' | 'accents';

// Mounted once, at the very root (app/_layout.tsx), so it works identically
// whether the focused field is inside the (tabs) group or a top-level stack
// screen (profile.tsx, purple-digest.tsx) -- see ActiveInputContext.tsx for
// why that requires plain React state rather than something scoped to the
// tabs subtree (components/TabRevealContext.tsx's own dropRequestId, e.g.,
// only ever fires for in-tabs swipes/hub-taps, never a stack push to
// profile.tsx, so it can't be reused here the way GatedTabContent reuses it).
// Navigating anywhere -- a tab switch or a stack push/pop -- is instead
// caught directly via expo-router's usePathname() below.
//
// Reuses the exact rise/drop animation idiom already proven in
// GatedTabContent.tsx: a 0-1 progress SharedValue driven by withTiming over
// the same shared TAB_REVEAL_DURATION_MS, translateY-ed by (1 - progress) *
// its own height.
export function AppKeyboard() {
  const { activeField, searchRequest } = useActiveInputValue();
  const { forceClear, focusNextField } = useActiveInputControls();
  const footerBandHeight = useFooterBandHeight();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>('letters');
  const [shiftActive, setShiftActive] = useState(false);
  const progress = useSharedValue(0);

  const visible = activeField !== null;
  const canToggleMode = activeField?.keyboardType === 'default';
  const effectiveMode: Mode = canToggleMode ? mode : 'numbers';
  // A number-pad/decimal-pad field forces numeric mode with no way back to
  // letters (never lets that field drift into letters); a plain text field
  // starts on letters and can toggle to numbers and back via the bottom
  // row's mode key.
  const showsNumbersLayout = activeField?.keyboardType !== 'default' || effectiveMode === 'numbers';
  const showsAccentsLayout = !showsNumbersLayout && effectiveMode === 'accents';

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: TAB_REVEAL_DURATION_MS });
  }, [visible, progress]);

  // A brand-new field taking focus always resets back to its own default
  // mode/shift state -- switching from a text field mid-numbers-toggle to a
  // number field, for instance, shouldn't carry that toggle over.
  useEffect(() => {
    setMode('letters');
    setShiftActive(false);
  }, [activeField?.id]);

  // Any real navigation -- a tab switch or a stack push/pop to
  // profile.tsx/purple-digest.tsx -- should close the keyboard cleanly
  // rather than leaving it floating over a screen it no longer belongs to.
  useEffect(() => {
    if (activeField) {
      activeField.blur();
      forceClear();
    }
    // Only pathname changing should trigger this -- activeField is read via
    // the ref-like closure captured at effect-run time, not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Android-specific, reported directly 2026-08-02 after a few real
  // occurrences: the OS's own soft keyboard could appear over this
  // component's own overlay after minimizing the app (with a field still
  // focused) and reopening it. showSoftInputOnFocus={false}
  // (AppTextInput.tsx, the one prop this whole feature rests on) only
  // suppresses the OS keyboard at the moment JS-driven focus happens --
  // it doesn't survive the native window itself losing and regaining focus,
  // which is a separate path Android's own InputMethodManager can trigger
  // on its own when a backgrounded app with an already-focused EditText
  // comes back to the foreground, bypassing that prop entirely since no new
  // JS focus() call is what's causing it to show.
  //
  // Dismissing unconditionally on every return to 'active' -- not gated on
  // activeField being currently set -- is the safe, standard corrective:
  // Keyboard.dismiss() only ever hides a keyboard that's actually showing (a
  // harmless no-op otherwise, including on cold start's own first 'active'
  // transition).
  //
  // Confirmed on-device, 2026-08-02: in practice this doesn't leave the
  // field sitting focused with just the OS keyboard suppressed -- Android
  // appears to already blur the field itself as a normal part of the window
  // losing focus while backgrounded (independent of this fix), so by the
  // time 'active' fires here, this app's own activeField state has usually
  // already cleared and AppKeyboard has already hidden on its own; this
  // effect's real job is mopping up the OS keyboard the system tries to
  // show anyway for that now-blurred view a beat later. Net effect: both
  // keyboards close and the field shows as deselected after resuming,
  // requiring one more tap to resume typing -- a clean, fully-closed state
  // rather than a stale field silently still focused, and the accepted
  // trade-off here.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        Keyboard.dismiss();
      }
    });
    return () => subscription.remove();
  }, []);

  // Slides within its own fixed-height clip window (see the render below),
  // not the full KEYBOARD_HEIGHT + footerBandHeight the outer box used to
  // travel, 2026-08-01 -- reported as the keyboard visibly passing IN
  // FRONT of the footer/TabHub button while closing, rather than tucking
  // in behind it. AppKeyboard is mounted last at the app root (see this
  // file's own top comment), so it always paints over the footer by plain
  // tree order; that was never a problem while RISEN, since its resting
  // box (`bottom: footerBandHeight`) sits entirely above the footer's own
  // space with no overlap at all -- but the old translateY distance
  // carried the box's own bottom edge DOWN THROUGH that space on its way
  // off-screen, so for part of the close animation it was genuinely
  // overlapping the footer, and painting on top of it when it did. Now the
  // box's own position/size never changes (see clipWrap below); only the
  // CONTENT inside it slides, by exactly its own height, so it can only
  // ever disappear upward into nothing within a window that never leaves
  // its resting spot above the footer -- no geometry left to race the
  // paint order over.
  const risenStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * KEYBOARD_HEIGHT }],
  }));

  // Reads activeField.getValue()/getSelection() at press-time, 2026-08-02 --
  // see ActiveField's own comment in ActiveInputContext.tsx for why these
  // are functions now, not plain fields kept fresh via re-registration on
  // every keystroke.
  function insertText(char: string) {
    if (!activeField) return;
    const { onChangeText, onSelectionChange } = activeField;
    const value = activeField.getValue();
    const selection = activeField.getSelection();
    const newValue = value.slice(0, selection.start) + char + value.slice(selection.end);
    const cursor = selection.start + char.length;
    onChangeText(newValue);
    onSelectionChange({ start: cursor, end: cursor });
  }

  function backspace() {
    if (!activeField) return;
    const { onChangeText, onSelectionChange } = activeField;
    const value = activeField.getValue();
    const { start, end } = activeField.getSelection();
    if (start !== end) {
      onChangeText(value.slice(0, start) + value.slice(end));
      onSelectionChange({ start, end: start });
      return;
    }
    if (start === 0) return;
    onChangeText(value.slice(0, start - 1) + value.slice(start));
    onSelectionChange({ start: start - 1, end: start - 1 });
  }

  function pressLetter(letter: string) {
    insertText(shiftActive ? letter.toUpperCase() : letter);
    if (shiftActive) setShiftActive(false);
  }

  function done() {
    activeField?.blur();
    forceClear();
  }

  // Moves on to whatever field comes next on this screen without requiring
  // Done first -- falls back to done() when the current field is the last
  // one registered (nowhere left to go).
  function next() {
    if (!activeField) return;
    const found = focusNextField(activeField.id);
    if (!found) done();
  }

  const mainKeys =
    showsNumbersLayout ? (
      <>
        {NUMBER_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((digit) => (
              <Key key={digit} label={digit} onPress={() => insertText(digit)} />
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <Key label="." onPress={() => insertText('.')} />
          <Key label="backspace" icon="backspace-outline" onPress={backspace} flex={2} muted />
        </View>
      </>
    ) : showsAccentsLayout ? (
      <>
        {ACCENT_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((char) => (
              <Key key={char} label={char} onPress={() => insertText(char)} />
            ))}
            {rowIndex === ACCENT_ROWS.length - 1 ? (
              <Key label="backspace" icon="backspace-outline" onPress={backspace} flex={2} muted />
            ) : null}
          </View>
        ))}
      </>
    ) : (
      <>
        {LETTER_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowIndex === 2 ? (
              <Key
                label="shift"
                icon="arrow-up-outline"
                onPress={() => setShiftActive((current) => !current)}
                flex={1.5}
                active={shiftActive}
                muted={!shiftActive}
              />
            ) : null}
            {row.map((letter) => (
              <Key key={letter} label={shiftActive ? letter.toUpperCase() : letter} onPress={() => pressLetter(letter)} />
            ))}
            {rowIndex === 2 ? <Key label="backspace" icon="backspace-outline" onPress={backspace} flex={1.5} muted /> : null}
          </View>
        ))}
      </>
    );

  const bottomRow = (
    <View style={styles.row}>
      {canToggleMode ? (
        <Key
          label={effectiveMode === 'numbers' ? 'ABC' : '123'}
          onPress={() => setMode((current) => (current === 'numbers' ? 'letters' : 'numbers'))}
          flex={1}
          muted
        />
      ) : null}
      {/* Between 123 and Space, 2026-07-28 -- toggles the same way 123/ABC
          does, just to ACCENT_ROWS instead of NUMBER_ROWS. Hidden for the
          same reason 123 is: a number-pad/decimal-pad field has no use for
          accented letters either. */}
      {canToggleMode ? (
        <Key
          label={effectiveMode === 'accents' ? 'ABC' : 'áé'}
          onPress={() => setMode((current) => (current === 'accents' ? 'letters' : 'accents'))}
          flex={1}
          muted
        />
      ) : null}
      <Key label="" onPress={() => insertText(' ')} flex={canToggleMode ? 4 : 6} muted />
    </View>
  );

  // A fixed accessory row above the main key grid -- always present (Next/
  // Done never disappear, even with no search box, see this row's own
  // styles.searchBoxSlot below), pinned to whichever side NAVIGATION_HAND
  // says the person's thumb rests on. Replaces the 2026-07-27 side-column
  // attempt (reverted the same day -- it shrank every main key by stealing a
  // whole column's width). When a searchable Dropdown is open, its own
  // AppTextInput renders here (see ActiveInputContext.tsx's own
  // searchRequest comment) -- autoFocus fires the moment it mounts, which
  // registers it as the activeField and raises this keyboard, cursor ready.
  const searchRow = (
    <View style={[styles.searchRow, { flexDirection: NAVIGATION_HAND === 'left' ? 'row' : 'row-reverse' }]}>
      <Pressable onPress={next} style={styles.accessoryButton}>
        <Ionicons name="arrow-forward-outline" size={16} color={colors.textPrimary} />
      </Pressable>
      <Pressable onPress={done} style={[styles.accessoryButton, styles.accessoryButtonDone]}>
        <Ionicons name="checkmark" size={18} color={colors.textOnPrimary} />
      </Pressable>
      {activeField?.infoPress ? (
        <Pressable onPress={activeField.infoPress} style={styles.infoButton} hitSlop={8}>
          <Ionicons name="information-circle-outline" size={20} color={activeField.infoColor ?? colors.textPrimary} />
          {activeField.infoLabel ? (
            <Text style={[styles.infoLabel, { color: activeField.infoColor ?? colors.textPrimary }]} numberOfLines={1}>
              {activeField.infoLabel}
            </Text>
          ) : null}
        </Pressable>
      ) : null}
      <View style={styles.searchBoxSlot}>
        {searchRequest ? (
          <View style={styles.searchBoxRow}>
            <AppTextInput
              autoFocus
              value={searchRequest.value}
              onChangeText={searchRequest.onChangeText}
              placeholder={searchRequest.placeholder}
              style={styles.searchBox}
            />
            {/* 2026-08-16 -- a real mic button, added here rather than in
                any individual searchable list (InlineSearchSelectList,
                Dropdown.tsx's own searchable variant), since this ONE
                shared search row is where every one of them actually
                renders its own search field (see this row's own header
                comment above). One real fix point covers every
                searchable picker in the app at once, including all 11
                Food builders' own ingredient search and Insights' Food
                Lookup lens. Every result (partial included) replaces
                searchRequest's own live text, the identical thing typing
                already does through onChangeText. */}
            <VoiceInputButton onResult={(transcript) => searchRequest.onChangeText(transcript)} size={18} />
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    // clipWrap's own position/size is fixed (never animated) -- see
    // risenStyle's own comment for why this split from a single animated
    // box exists. overflow: 'hidden' is what actually enforces "the
    // keyboard can never be visible outside this window": the animated
    // content below can slide down within it, but is clipped the instant
    // it would cross this box's own bottom edge, which sits exactly at
    // the footer's own top edge.
    <View style={[styles.clipWrap, { bottom: footerBandHeight, height: KEYBOARD_HEIGHT }]} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.container, risenStyle]}>
        {searchRow}
        {mainKeys}
        {bottomRow}
      </Animated.View>
    </View>
  );
}

function Key({
  label,
  icon,
  onPress,
  flex = 1,
  muted,
  active,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  flex?: number;
  muted?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.key, { flex }, muted ? styles.keyMuted : styles.keyLetter, active ? styles.keyActive : null]}>
      {icon ? (
        <Ionicons name={icon} size={18} color={colors.textPrimary} />
      ) : label ? (
        <Text style={styles.keyLabel}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Fixed position/size, 2026-08-01 (`bottom`/`height` set inline where
  // rendered) -- see risenStyle's own comment. overflow: 'hidden' clips
  // `container` below to this box's own bounds, which is what keeps the
  // keyboard from ever visually reaching into the footer's space.
  clipWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  // No longer position: 'absolute' (2026-08-01) -- it's a normal block
  // child of clipWrap now, sized to fill it exactly so risenStyle's own
  // translateY can slide it fully out of view within that fixed window.
  // Same flat colors.background the footer band itself paints (see
  // ScreenBackground.tsx's own bottomMask) -- the keyboard is meant to read
  // as a continuation of the footer rising up, not a separate floating
  // panel in its own color.
  container: {
    height: KEYBOARD_HEIGHT,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: KEYBOARD_PADDING,
    gap: KEY_ROW_GAP,
  },
  searchRow: {
    height: SEARCH_ROW_HEIGHT,
    alignItems: 'center',
    gap: KEY_GAP,
  },
  accessoryButton: {
    width: ACCESSORY_BUTTON_SIZE,
    height: ACCESSORY_BUTTON_SIZE,
    borderRadius: KEY_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  accessoryButtonDone: { backgroundColor: colors.primary },
  // Not a fixed square like accessoryButton -- this one grows to fit its
  // own optional label text (e.g. "Provide Portion Size") next to the icon,
  // rather than clipping/wrapping it.
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: ACCESSORY_BUTTON_SIZE,
    paddingHorizontal: 8,
    borderRadius: KEY_BORDER_RADIUS,
    backgroundColor: colors.border,
  },
  infoLabel: {
    ...typography.caption,
  },
  // Always rendered, with or without an actual search box inside, so
  // Next/Done never shift position depending on whether one is present.
  searchBoxSlot: { flex: 1, height: '100%' },
  // 2026-08-16 -- wraps the search field with a real mic button beside
  // it (see the searchRow's own header comment for why this one spot
  // covers every searchable picker in the app).
  searchBoxRow: { flexDirection: 'row', alignItems: 'center', gap: 4, height: '100%' },
  searchBox: {
    flex: 1,
    height: '100%',
    borderRadius: KEY_BORDER_RADIUS,
    backgroundColor: colors.keySurface,
    paddingHorizontal: 10,
    color: colors.textPrimary,
    ...typography.body,
  },
  row: {
    flexDirection: 'row',
    height: KEY_ROW_HEIGHT,
    gap: KEY_GAP,
  },
  key: {
    flex: 1,
    borderRadius: KEY_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lighter blue than the footer-colored container behind it, so keys read
  // as raised/tappable rather than blending into the background -- see
  // colors.keySurface's own comment.
  keyLetter: { backgroundColor: colors.keySurface },
  keyMuted: { backgroundColor: colors.border },
  keyActive: { backgroundColor: colors.accent },
  keyLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, textTransform: 'none' },
});
