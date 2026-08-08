import { useEffect, useState } from 'react';

// A plain, standard debounce -- returns `value` itself, but only updates
// its own returned copy `delayMs` after `value` stops changing. 2026-08-08,
// built for Purple Digest's own reported keyboard lag: typing into either
// search box updates the box's own raw, controlled state instantly (so the
// characters themselves always appear right away, completely unaffected by
// this hook), but the EXPENSIVE derived work driven by that state --
// building and re-rendering a filtered shelf-row tree, or a whole search-
// results list, potentially dozens of real card components -- was
// recomputing and reconciling on every single keystroke, the same real
// class of problem already root-caused and fixed once before for the Food
// builders' own custom keyboard (see AppTextInput.tsx's own history
// comment): a heavy owning screen re-rendering in full on every character
// typed, dragging down how quickly the next keypress itself can register.
// The fix there was isolating AppKeyboard's own registration from firing
// per keystroke; this is the general-purpose version of the same idea for
// a screen's own expensive DERIVED rendering -- let the input feel instant,
// delay the expensive part until typing actually pauses.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
