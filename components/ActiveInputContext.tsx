import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type AppKeyboardType = 'default' | 'number-pad' | 'decimal-pad';

export type ActiveField = {
  // Stable per-AppTextInput-instance id (React's useId()) -- lets a delayed
  // blur (see AppTextInput.tsx's clear-on-blur guard) only clear the field it
  // actually belongs to, rather than blindly wiping out whichever field
  // focused in the meantime. Without this, quickly switching focus between
  // two AppTextInputs (e.g. profile.tsx's Y/M/D birth-date boxes) would let
  // the first field's delayed blur clear the second field's just-registered
  // focus.
  id: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType: AppKeyboardType;
  selection: { start: number; end: number };
  onSelectionChange: (selection: { start: number; end: number }) => void;
  blur: () => void;
  // Optional -- lets one specific field (e.g. Insights' own Portion amount)
  // put an (i) icon in AppKeyboard's search row, tied to whichever field is
  // actually focused rather than pinned to a fixed spot on the page. Only
  // rendered while that field is the activeField; a field that doesn't set
  // this just shows no icon, same as today.
  infoPress?: () => void;
  infoColor?: string;
  // A short label shown next to that (i) icon (e.g. "Provide Portion
  // Size") -- optional, since a field can set infoPress without one.
  infoLabel?: string;
};

export type SearchRequest = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

// Split into two contexts, deliberately -- see ActiveInputProvider's own
// comment below for the real bug this fixes (an infinite render loop).
type ActiveInputControls = {
  focusField: (field: ActiveField) => void;
  // Takes the clearing field's own id so a stale, delayed blur can never
  // clear a *different* field that has since taken focus -- see ActiveField
  // above.
  clearField: (id: string) => void;
  // Unconditional, no id guard -- used by AppKeyboard.tsx when navigation
  // itself (not a field losing focus) is what should close the keyboard, so
  // it always wins regardless of which field was last active.
  forceClear: () => void;
  // Every mounted AppTextInput registers itself here (mount order, via a
  // ref rather than state -- registering shouldn't itself trigger a
  // re-render) so AppKeyboard's Next key can walk to "whatever field comes
  // after this one on the current screen" without any screen needing to
  // hand-wire its own field order.
  registerField: (id: string, focus: () => void) => void;
  unregisterField: (id: string) => void;
  // Focuses the field immediately after `currentId` in registration order,
  // if any. Returns whether one was found -- lets AppKeyboard fall back to
  // dismissing (done()) when the current field is the last one on screen.
  focusNextField: (currentId: string) => boolean;
  // Lets a searchable Dropdown (components/Dropdown.tsx) ask AppKeyboard to
  // show its own live search box in the keyboard's search row, instead of
  // Dropdown rendering and positioning its own floating text field. Dropdown
  // sets this while its menu is open (and clears it on close/unmount);
  // AppKeyboard renders an actual AppTextInput bound to it when non-null,
  // which then registers/focuses itself through the normal activeField flow
  // above like any other field.
  setSearchRequest: (request: SearchRequest | null) => void;
};

type ActiveInputValue = {
  activeField: ActiveField | null;
  searchRequest: SearchRequest | null;
};

const ActiveInputControlsContext = createContext<ActiveInputControls | null>(null);
// activeField and searchRequest are two SEPARATE contexts, each holding the
// raw value directly (not wrapped in an object) -- see ActiveInputProvider's
// own comment below for the real bug this fixes (a second infinite-render
// loop, distinct from the controls-vs-value one above it). useActiveField()
// subscribes to just the one a consumer like Insights' own FoodLookupView
// actually needs, so it's never woken by the other one changing;
// useActiveInputValue() combines both, for AppKeyboard, which genuinely
// needs both.
const UNSET = Symbol('unset');
const ActiveFieldContext = createContext<ActiveField | null | typeof UNSET>(UNSET);
const SearchRequestContext = createContext<SearchRequest | null | typeof UNSET>(UNSET);

// Plain React state, not a Reanimated SharedValue (contrast
// components/TabRevealContext.tsx) -- nothing here needs worklet-thread
// access, key presses are ordinary JS-thread taps. AppKeyboard.tsx reads
// both the controls and the live value (it needs to render whichever field
// is active); AppTextInput.tsx/Dropdown.tsx only ever read the controls.
//
// That split is deliberate, not stylistic -- bundling activeField/
// searchRequest together with the setter functions in one memoized value (as
// this used to) caused a real infinite-render loop: Dropdown only needs
// setSearchRequest/forceClear, but because it also consumed the SAME context
// object (which changes identity whenever activeField/searchRequest change),
// it re-rendered every time ITS OWN setSearchRequest call changed that
// state -- which re-ran its effect, which called setSearchRequest again,
// forever ("Maximum update depth exceeded", surfaced 2026-07-27 the moment a
// searchable Dropdown was actually opened for real). Splitting the rarely-
// changing controls (stable for the provider's entire lifetime) from the
// frequently-changing value into two separate contexts means a controls-only
// consumer like Dropdown never gets woken up by a value change it caused.
export function ActiveInputProvider({ children }: { children: ReactNode }) {
  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  // A ref, not state: field mount/unmount order only needs to be read at the
  // moment Next is pressed, never needs to trigger a render of its own.
  const fieldOrderRef = useRef<{ id: string; focus: () => void }[]>([]);

  // Empty deps, deliberately: every function here only ever closes over
  // `setActiveField`/`setSearchRequest` (React's own stable setters) and
  // `fieldOrderRef` (a stable ref object) -- never over `activeField`/
  // `searchRequest` themselves -- so this object can genuinely never change
  // across this provider's lifetime, which is exactly what keeps
  // controls-only consumers from re-rendering on every value change.
  const controls = useMemo<ActiveInputControls>(() => {
    function focusField(field: ActiveField) {
      setActiveField(field);
    }
    function clearField(id: string) {
      setActiveField((current) => (current?.id === id ? null : current));
    }
    function forceClear() {
      setActiveField(null);
    }
    function registerField(id: string, focus: () => void) {
      const list = fieldOrderRef.current;
      if (!list.some((entry) => entry.id === id)) {
        list.push({ id, focus });
      }
    }
    function unregisterField(id: string) {
      fieldOrderRef.current = fieldOrderRef.current.filter((entry) => entry.id !== id);
    }
    function focusNextField(currentId: string): boolean {
      const list = fieldOrderRef.current;
      const index = list.findIndex((entry) => entry.id === currentId);
      if (index === -1 || index === list.length - 1) return false;
      list[index + 1].focus();
      return true;
    }
    return {
      focusField,
      clearField,
      forceClear,
      registerField,
      unregisterField,
      focusNextField,
      setSearchRequest,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ActiveInputControlsContext.Provider value={controls}>
      <ActiveFieldContext.Provider value={activeField}>
        <SearchRequestContext.Provider value={searchRequest}>{children}</SearchRequestContext.Provider>
      </ActiveFieldContext.Provider>
    </ActiveInputControlsContext.Provider>
  );
}

export function useActiveInputControls(): ActiveInputControls {
  const context = useContext(ActiveInputControlsContext);
  if (!context) {
    throw new Error('useActiveInputControls must be used within an ActiveInputProvider');
  }
  return context;
}

// Subscribes to just activeField -- use this (not useActiveInputValue)
// whenever a consumer doesn't also need searchRequest, so it's never
// re-rendered by searchRequest's own churn (InlineSearchSelectList/Dropdown
// update it on every render of their own search box, by design -- see
// InlineSearchSelectList.tsx's own comment). That distinction is exactly
// what fixed a real infinite-render loop: Insights' own FoodLookupView
// reads activeField (to size its results table around whether AppKeyboard
// is actually up), and briefly used the combined hook below instead -- an
// ordinary parent-of-InlineSearchSelectList, unlike AppKeyboard (a sibling
// at the app root that InlineSearchSelectList's own re-renders can never
// cascade back into). Reading the combined value there meant every
// searchRequest update re-rendered FoodLookupView, which re-rendered its
// own child InlineSearchSelectList, whose no-dep-array effect fired again
// and set searchRequest again -- forever ("Maximum update depth exceeded",
// 2026-07-27, the moment a food was actually picked from that list).
export function useActiveField(): ActiveField | null {
  const context = useContext(ActiveFieldContext);
  if (context === UNSET) {
    throw new Error('useActiveField must be used within an ActiveInputProvider');
  }
  return context;
}

export function useActiveInputValue(): ActiveInputValue {
  const activeField = useContext(ActiveFieldContext);
  const searchRequest = useContext(SearchRequestContext);
  if (activeField === UNSET || searchRequest === UNSET) {
    throw new Error('useActiveInputValue must be used within an ActiveInputProvider');
  }
  return { activeField, searchRequest };
}
