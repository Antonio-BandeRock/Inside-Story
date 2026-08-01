import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { TextInput, type TextInput as TextInputType, type TextInputProps } from 'react-native';
import { useActiveInputControls, type AppKeyboardType } from './ActiveInputContext';

// Drop-in replacement for RN's own TextInput -- same prop surface, so every
// existing call site (all controlled value/onChangeText fields, see this
// component's own history in the AppKeyboard plan) just swaps the import and
// tag name, keeping keyboardType/multiline/style/onBlur exactly as before.
//
// showSoftInputOnFocus is always forced false: the one prop the whole
// AppKeyboard feature rests on -- it suppresses the OS keyboard while the
// field still gets real logical focus (blinking cursor, tap-to-place-cursor
// both keep working natively), which is what lets AppKeyboard.tsx be the only
// thing the person ever types on.
export type AppTextInputProps = TextInputProps & {
  // Starts with the whole value selected/highlighted (e.g. Insights' own
  // Portion field, which defaults to "100" and should read as ready to be
  // typed over, not appended to) rather than a plain cursor parked at the
  // end. Only affects the very first mount.
  //
  // 2026-07-28: defaults to whatever `autoFocus` is, rather than defaulting
  // to false regardless -- explicitly made a blanket rule after a field
  // that autoFocused onto a real, non-empty starting value (Quantity,
  // pre-filled to match Servings/Serving Size's own established "1"
  // default) still placed a plain cursor after it, so typing a digit
  // appended instead of replacing (e.g. typing "5" into a fresh "1"
  // produced "15"). A field is either freshly, deliberately handed real
  // content it should be able to just start typing over, or it's empty
  // (nothing to select either way) -- there's no case where autoFocusing
  // onto existing text but NOT wanting it selected actually comes up in
  // this app, so this is the new default everywhere rather than an opt-in
  // per call site. Still overridable with an explicit `false` for some
  // future field that genuinely needs the old cursor-at-end behavior.
  selectAllOnMount?: boolean;
  // Puts an (i) icon in AppKeyboard's own search row, to the right of its
  // Done checkmark, while this field is the one being edited -- see
  // ActiveField's own infoPress/infoColor comment in ActiveInputContext.tsx.
  onInfoPress?: () => void;
  infoColor?: string;
  infoLabel?: string;
};

export const AppTextInput = forwardRef<TextInputType, AppTextInputProps>(function AppTextInput(
  {
    onFocus,
    onBlur,
    onSelectionChange,
    keyboardType,
    value,
    onChangeText,
    selectAllOnMount,
    onInfoPress,
    infoColor,
    infoLabel,
    autoFocus,
    ...rest
  },
  forwardedRef,
) {
  const { focusField, clearField, registerField, unregisterField } = useActiveInputControls();
  const innerRef = useRef<TextInputType>(null);
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  // See selectAllOnMount's own comment -- defaults to whatever autoFocus is
  // when the caller doesn't explicitly say either way.
  const effectiveSelectAllOnMount = selectAllOnMount ?? autoFocus ?? false;
  const [selection, setSelection] = useState(() => {
    const length = (value ?? '').length;
    return effectiveSelectAllOnMount ? { start: 0, end: length } : { start: length, end: length };
  });
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Kept in sync every render (not just at mount) so the Next-key focus
  // callback below always selects the CURRENT text, not whatever it was
  // when this field first mounted.
  const valueRef = useRef(value ?? '');
  valueRef.current = value ?? '';

  const resolvedKeyboardType: AppKeyboardType =
    keyboardType === 'number-pad' || keyboardType === 'decimal-pad' ? keyboardType : 'default';

  // Re-registers on every render this field is focused so AppKeyboard.tsx
  // always has the live value/onChangeText/selection -- not just a snapshot
  // from the moment focus happened.
  useEffect(() => {
    if (!isFocused) return;
    focusField({
      id,
      value: value ?? '',
      onChangeText: onChangeText ?? (() => {}),
      keyboardType: resolvedKeyboardType,
      selection,
      onSelectionChange: setSelection,
      blur: () => innerRef.current?.blur(),
      infoPress: onInfoPress,
      infoColor,
      infoLabel,
    });
  }, [isFocused, id, value, onChangeText, resolvedKeyboardType, selection, focusField, onInfoPress, infoColor, infoLabel]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    },
    [],
  );

  // Registers this field with the shared mount-order list AppKeyboard's Next
  // key walks (see ActiveInputContext.tsx's own comment) -- once per mount,
  // not per render, so the order reflects when fields first appeared on
  // screen rather than churning on every keystroke.
  //
  // 2026-07-28: also selects the field's entire current text the moment
  // Next lands on it, the same "ready to be typed over" treatment
  // selectAllOnMount already gives a field on its very first autoFocus --
  // without this, Next just called .focus() alone, which places a plain
  // cursor at wherever `selection` last was (its own mount-time default,
  // end-of-text, for a field like Servings/Serving Size that starts on a
  // non-empty "1"). Typing a digit then INSERTED at that trailing position
  // instead of replacing it -- e.g. typing "5" into a fresh "1" produced
  // "15", not "5" -- reported 2026-07-28. setSelection is the real native
  // imperative call (distinct from the `selection` prop/state above, which
  // only reacts to a selection change after the fact); it fires this
  // component's own onSelectionChange in response, which keeps the
  // `selection` state -- and therefore AppKeyboard's own future key-press
  // insertion point -- correctly in sync.
  useEffect(() => {
    registerField(id, () => {
      innerRef.current?.focus();
      innerRef.current?.setSelection(0, valueRef.current.length);
    });
    return () => {
      unregisterField(id);
      // Also drops this field from shared activeField state if it was
      // still the active one, 2026-08-01 -- registration cleanup only
      // ever handled the Next-key order. The ONLY other path that clears
      // activeField is a real native blur event (see onBlur below), which
      // never fires when a field unmounts WHILE still focused -- e.g.
      // Side Builder's autoFocused Dish Name field, left by tapping
      // LensHub/TabHub rather than tapping away from the field first.
      // Without this, AppKeyboard (a global overlay reading this same
      // shared state) kept rendering against a dead field's stale
      // closures indefinitely: stuck visible across every other Food
      // builder, and -- by eating real screen height at the bottom while
      // wrongly present -- implicated in TabHub's own card mispositioning
      // itself on the first open after visiting Side Builder. clearField
      // is already id-guarded (see ActiveInputContext.tsx), so this is
      // safe to call unconditionally even when this field was already
      // cleared by its own blur.
      clearField(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <TextInput
      ref={(node) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      showSoftInputOnFocus={false}
      // Android's native Autofill service reacts to a real EditText gaining
      // focus regardless of whether the OS soft keyboard itself ever shows
      // (see showSoftInputOnFocus above) -- reported 2026-08-01 as a black
      // Autofill suggestion chip appearing over Side Builder's Dish Name
      // field the moment it's tapped. Both props below are the standard
      // Android way to opt a field out of that entirely; belongs here,
      // globally, not on one field, for the same reason showSoftInputOnFocus
      // does -- AppKeyboard is meant to be the only input surface a person
      // ever sees for ANY field in this app, and an OS Autofill popup is
      // exactly the kind of native input-adjacent UI that design is meant to
      // rule out.
      // "no" alone was reported still showing the chip, 2026-08-01 (it
      // stopped Autofill from actually FILLING anything -- tapping it said
      // the contents couldn't be autofilled -- but didn't stop the chip
      // from appearing at all). "noExcludeDescendants" is the stronger of
      // RN's two "off" values: RN's TextInput isn't a bare EditText, it has
      // its own internal descendant views, and "no" only opts the
      // top-level view out, leaving Android's autofill heuristics free to
      // still consider what's underneath. Excluding descendants too is
      // what actually removes this field from the autofill tree entirely.
      importantForAutofill="noExcludeDescendants"
      autoComplete="off"
      selection={selection}
      onSelectionChange={(event) => {
        setSelection(event.nativeEvent.selection);
        onSelectionChange?.(event);
      }}
      onFocus={(event) => {
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        // Delayed, id-guarded clear -- see ActiveField's own comment in
        // ActiveInputContext.tsx for why: lets briefly switching focus
        // between two AppTextInputs (e.g. profile.tsx's Y/M/D birth-date
        // boxes) happen without the shared keyboard flickering closed.
        blurTimeoutRef.current = setTimeout(() => clearField(id), 50);
        onBlur?.(event);
      }}
      {...rest}
    />
  );
});
