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
  // when this field first mounted. Also, since 2026-08-02, what
  // ActiveField's own getValue() reads -- see this component's own
  // registration effect below for why that matters.
  const valueRef = useRef(value ?? '');
  valueRef.current = value ?? '';
  // Same idea, for selection -- added 2026-08-02 alongside getSelection()
  // below, so AppKeyboard can read the live cursor position the same
  // ref-backed way it now reads the live value.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const resolvedKeyboardType: AppKeyboardType =
    keyboardType === 'number-pad' || keyboardType === 'decimal-pad' ? keyboardType : 'default';

  // Re-registers whenever this field's own IDENTITY or callbacks actually
  // change while focused, so AppKeyboard.tsx always has a way to reach the
  // live value/selection -- but not on every keystroke anymore, 2026-08-02
  // (a real, reported performance fix): `value`/`selection` used to be
  // passed as plain fields and listed as this effect's own dependencies, so
  // a brand-new field object was registered (a real setActiveField() call,
  // re-rendering both AppKeyboard and whatever screen owns this field) on
  // every single character typed -- on the Food builders specifically,
  // each ~1,900 lines of JSX reconciled in full per keystroke, exactly the
  // input lag reported. Passing getValue()/getSelection() -- closures
  // reading valueRef/selectionRef above, always current regardless of when
  // they're actually called -- lets this effect drop `value`/`selection`
  // from its own dependency array entirely: it now only re-fires on a real
  // focus change or a genuinely new onChangeText/onInfoPress/etc. (all of
  // which are stable useState setters or useCallback-wrapped handlers at
  // every real call site already, per titleCaseDishName's own precedent in
  // the Food builders), not on every keystroke.
  useEffect(() => {
    if (!isFocused) return;
    focusField({
      id,
      getValue: () => valueRef.current,
      // Wrapped, not the raw onChangeText prop directly -- 2026-08-09, a
      // real, latent race finally exposed once a screen's own render cost
      // per keystroke got fast enough for it to matter (see this app's own
      // Purple Digest search-box history for exactly how that played out).
      // valueRef above is only ever refreshed by the render-body assignment
      // a few lines up, which needs a REAL re-render of this component to
      // run -- React batches the state update AppKeyboard.tsx's insertText/
      // backspace triggers via this same onChangeText call, so that
      // re-render doesn't happen synchronously, it happens on React's own
      // next commit. If a second key gets tapped before that commit lands
      // (easy once typing itself is fast, since RN's own touch dispatch is
      // no longer being throttled by a slow re-render), insertText's own
      // activeField.getValue() call reads the STILL-STALE valueRef and
      // computes its insertion against text that's missing the previous
      // keystroke -- exactly the reported "letters end up in front of the
      // cursor" (wrong insertion index) and "a lot of the letters... do not
      // get displayed" (one keystroke's own insertion gets silently
      // clobbered by the next one's stale-based computation) symptoms.
      // Writing valueRef.current here, synchronously, the instant
      // onChangeText actually fires -- before waiting on the real prop
      // round-trip -- closes that race: even several taps landing in the
      // same JS tick each see the correct, just-computed text. The render-
      // body assignment above still runs too once the real re-render
      // eventually lands; harmless since it's writing the same, by-then-
      // committed value (or, for a field whose own onChangeText validates/
      // transforms the text before actually committing it, self-corrects to
      // the real final value on that next render regardless).
      onChangeText: (text: string) => {
        valueRef.current = text;
        onChangeText?.(text);
      },
      keyboardType: resolvedKeyboardType,
      getSelection: () => selectionRef.current,
      // Same real reasoning as onChangeText above, for the cursor position
      // insertText/backspace also read at press-time (activeField.
      // getSelection()) -- setSelection alone is the same kind of batched,
      // next-render-only update selectionRef's own render-body assignment
      // depends on; writing selectionRef.current synchronously here closes
      // the identical race for rapid consecutive keystrokes.
      onSelectionChange: (nextSelection: { start: number; end: number }) => {
        selectionRef.current = nextSelection;
        setSelection(nextSelection);
      },
      blur: () => innerRef.current?.blur(),
      infoPress: onInfoPress,
      infoColor,
      infoLabel,
    });
  }, [isFocused, id, onChangeText, resolvedKeyboardType, focusField, onInfoPress, infoColor, infoLabel]);

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
      // The real fix, 2026-08-01, after both props above (plus an
      // application-level manifest equivalent, see
      // plugins/withAutofillDisabled.js) still left the chip showing:
      // reported as appearing specifically when tapping into a field that
      // ALREADY had a cursor in it (Dish Name after its own autoFocus;
      // AppKeyboard's own search box the same way), not on first focus --
      // that's the signature of Android's native text-EDITING toolbar (the
      // floating Cut/Copy/Paste/Select-All popup that appears when tapping
      // to reposition a cursor in already-focused text), not the separate
      // Autofill-framework save/fill popup the props above target.
      // "Autofill" is one of that toolbar's own default menu items on
      // modern Android, which is why neither importantForAutofill prop
      // ever touched it -- wrong mechanism entirely. contextMenuHidden
      // suppresses that whole toolbar. Real tradeoff, not a free fix: this
      // also removes the only touch-based way to Cut/Copy/Paste in these
      // fields, since AppKeyboard provides no menu of its own to replace
      // it -- accepted here because AppKeyboard's whole premise is that no
      // native input-adjacent UI should ever appear over one of these
      // fields, and short fields like Dish Name have little real need for
      // touch-based cut/copy/paste in the first place.
      contextMenuHidden
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
