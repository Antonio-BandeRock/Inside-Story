// The app's one shared "standard transition" timing constant. Used by
// AppKeyboard.tsx's own rise/drop slide, and by LensHub.tsx's brief pause
// between closing its popup menu and calling onSelect (so picking an
// option doesn't pop the new content in at the exact same instant the
// menu is still closing).
//
// 2026-07-27: this used to also drive GatedTabContent.tsx's own tab-
// content rise/drop slide, and the delay SwipeableTabScreen/TabHub paid
// before navigating away from a revealed tab (giving that slide time to
// finish first) -- removed by explicit request in favor of an instant pop
// in/out, so both of those no longer need this at all.
export const TAB_REVEAL_DURATION_MS = 220;
