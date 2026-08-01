// Shared sizing for AppKeyboard (components/AppKeyboard.tsx) -- one place,
// same pattern as constants/floatingButton.ts and constants/tabReveal.ts, so
// the keyboard's own height and the slide-animation math that depends on it
// can't drift apart from each other.

// The search row's own height -- a fixed accessory row above the main key
// grid, always present (not just while a searchable Dropdown is open, see
// AppKeyboard.tsx's own comment), holding Next/Done plus, when a searchable
// Dropdown is open, its live search box. Pulled out of both the side column
// (2026-07-27's first attempt, reverted the same day -- it shrank every main
// key by stealing a whole column's width) and the bottom control row (which
// it would have crowded, squeezed next to the spacebar) into its own row
// instead, so neither the main keys nor the spacebar ever have to share
// space with it.
export const SEARCH_ROW_HEIGHT = 40;
// Next/Done are small, icon-only squares in the search row -- they only ever
// show a single symbol, not a label, so they don't need real button-sized
// hit targets the way a full keycap does.
export const ACCESSORY_BUTTON_SIZE = 36;

// Same height as the search row itself (and, by extension, its own
// buttons/search field) -- explicitly requested 2026-07-27: the keyboard
// was rising as tall as the real system keyboard, covering more screen than
// it needed to. Reusing SEARCH_ROW_HEIGHT directly (not a separately-tracked
// number that happens to match) means the letter/number rows and the
// spacebar row can never drift out of sync with it again.
export const KEY_ROW_HEIGHT = SEARCH_ROW_HEIGHT;
export const KEY_ROW_GAP = 6;
export const KEYBOARD_ROWS = 4;
export const KEYBOARD_PADDING = 8;

export const KEY_GAP = 4;
export const KEY_BORDER_RADIUS = 8;

export const KEYBOARD_HEIGHT =
  SEARCH_ROW_HEIGHT +
  KEY_ROW_GAP +
  KEYBOARD_ROWS * KEY_ROW_HEIGHT +
  (KEYBOARD_ROWS - 1) * KEY_ROW_GAP +
  KEYBOARD_PADDING * 2;
