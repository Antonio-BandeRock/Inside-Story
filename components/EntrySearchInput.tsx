import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextStyle } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { VoiceInputButton } from './VoiceInputButton';
import { colors } from '../constants/colors';
import { NAVIGATION_HAND } from '../constants/floatingButton';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

// The app's one search box for a list of entries: a text field with the mic
// inside it on the hand's own side and an optional information icon pinned to
// the right. Lived inside app/(tabs)/purple-digest.tsx from 2026-08-08 until
// 1.0.40.10, when System Recipes needed the same box; moved here whole rather
// than copied, so the keyboard-lag fix below keeps having exactly one home.
//
// Why it owns its own text. 2026-08-08, the second attempt at a reported
// keyboard-lag fix and the one that found the cause: this component keeps the
// per-keystroke text itself, which is a small re-render of this component
// alone, and reports up through onDebouncedChange only once about 200ms has
// passed with no further typing. The first attempt debounced a value DERIVED
// from the owning screen's state without moving the raw state out of that
// screen, so the screen and its whole content tree still re-rendered on every
// character; only the expensive recomputation was skipped, not the much more
// expensive reconciliation of every shelf and card reading that data. The
// owning screen is now never told a keystroke happened until the debounce has
// settled. AppTextInput.tsx's own history fixed a different mechanism with
// the same "heavy owning screen blocking the next keypress" symptom.
//
// onActiveChange is a separate, non-debounced signal. It fires the instant
// this box's text crosses the empty to non-empty boundary, not on every
// character, so the caller can hide a header and snap the scroll position at
// once without having to hear about every keystroke to do it. It is optional:
// System Recipes has no header to hide and no scroll to snap, so it takes the
// debounced text and nothing else.
//
// There is deliberately no reset-on-prop-change logic here. A caller that
// wants the box cleared remounts this component through a changing `key`,
// which resets localValue for free. See searchResetKey in purple-digest.tsx.
export function EntrySearchInput({
  placeholder,
  style,
  tabColor,
  onDebouncedChange,
  onActiveChange,
  onPressInfo,
}: {
  placeholder: string;
  style: TextStyle | TextStyle[];
  // The owning tab's color, for the information icon. Everything else in
  // here is tab-neutral, and the field's own border and fill come from the
  // caller's `style`, so one box can sit on purple and another on green.
  tabColor: string;
  onDebouncedChange: (text: string) => void;
  onActiveChange?: (active: boolean) => void;
  // 2026-08-23, direct request: the match-help (i) icon moved from a spot
  // above the field to inside the field, on the right. The caller owns what
  // it opens (a HelpSheet in the Digest), this component only renders the
  // tap target. Omit it where there is nothing to explain and no icon
  // renders at all.
  onPressInfo?: () => void;
}) {
  const [localValue, setLocalValue] = useState('');
  const wasActive = useRef(false);

  // useCallback for a reason, not for tidiness. AppTextInput re-registers
  // itself with AppKeyboard whenever onChangeText's identity changes, so an
  // unmemoized function here would get a new identity on every render, which
  // is every keystroke, quietly reintroducing the per-keystroke AppKeyboard
  // cascade this whole component exists to avoid, one layer lower down.
  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);
      const active = text.trim().length > 0;
      if (active !== wasActive.current) {
        wasActive.current = active;
        onActiveChange?.(active);
      }
    },
    [onActiveChange],
  );

  const debouncedValue = useDebouncedValue(localValue, 200);
  useEffect(() => {
    onDebouncedChange(debouncedValue);
    // The trigger is debouncedValue changing, not onDebouncedChange's
    // identity. Re-committing text that is already current is harmless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // 2026-08-19, direct request: the mic sits inside the field, on whichever
  // side NAVIGATION_HAND favors, read from the same shared flag that decides
  // which side the floating hubs cluster on rather than a second notion of
  // handedness. A control that gets held while dictating belongs on the
  // hand's side; when a handedness setting exists, flipping that flag moves
  // this too with no change here.
  const micOnLeft = NAVIGATION_HAND === 'left';

  return (
    <View style={styles.searchInputWrap}>
      {/* Both sides need clearance whenever the information icon renders,
          since it is pinned right regardless of NAVIGATION_HAND while the
          mic sits left today. With no icon, only the mic's side needs it. */}
      <AppTextInput
        style={[
          ...(Array.isArray(style) ? style : [style]),
          onPressInfo ? styles.searchInputPadBoth : (micOnLeft ? styles.searchInputPadLeft : styles.searchInputPadRight),
        ]}
        placeholder={placeholder}
        value={localValue}
        onChangeText={handleChangeText}
      />
      {/* Every result, partial ones included, replaces the query live, the
          same "search as you speak" feel a phone's voice search has. It
          reuses handleChangeText, so a spoken result goes through the same
          debounce and active-change path a typed one does. */}
      <VoiceInputButton
        onResult={(transcript) => handleChangeText(transcript)}
        style={[styles.searchInputMicButton, micOnLeft ? styles.searchInputMicButtonLeft : styles.searchInputMicButtonRight]}
      />
      {onPressInfo ? (
        <Pressable
          onPress={onPressInfo}
          hitSlop={10}
          style={styles.searchInputInfoButton}
          accessibilityRole="button"
          accessibilityLabel="How search matching and the match dots work"
        >
          <Ionicons name="information-circle-outline" size={20} color={tabColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // The field is this wrap's only normal-flow child, so it already fills the
  // width. All the wrap does is give the absolutely positioned mic and
  // information icons something to anchor to.
  searchInputWrap: { position: 'relative' },
  searchInputPadBoth: { paddingLeft: 40, paddingRight: 40 },
  searchInputPadLeft: { paddingLeft: 40 },
  searchInputPadRight: { paddingRight: 40 },
  // top/bottom rather than centering across the wrap's full height: a
  // caller's field style carries trailing margin below the visible box (the
  // Digest's searchInput has marginBottom: 4), and centering across that gap
  // too would sit the icon a few pixels high. bottom: 4 excludes it.
  searchInputMicButton: { position: 'absolute', top: 0, bottom: 4, justifyContent: 'center' },
  searchInputMicButtonLeft: { left: 6 },
  searchInputMicButtonRight: { right: 6 },
  // Same vertical centering as the mic, fixed right whatever NAVIGATION_HAND
  // says. An informational tap target does not need to track hand preference
  // the way a dictation button being held does.
  searchInputInfoButton: { position: 'absolute', top: 0, bottom: 4, right: 6, justifyContent: 'center' },
});

// Kept so a caller does not have to invent its own field styling. The border
// color is the one thing a tab supplies; pass [searchFieldStyle, { borderColor: TAB_COLOR }].
export const searchFieldStyle: TextStyle = {
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  backgroundColor: colors.surface,
  color: colors.textPrimary,
  marginBottom: 4,
};
