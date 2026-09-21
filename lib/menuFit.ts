// How much room a bottom-anchored popup menu actually has, and what to do
// when it does not have enough.
//
// 2026-09-18, direct request: "Do the display size and landscape pass too."
// It follows the accessibility work shipped in 1.0.40.3, which taught the two
// popup menus to budget their height from the app's line spacing setting and
// the phone's font-size setting together. That fixed how tall a card WANTS to
// be. It did not check whether the screen is that tall, and nothing else in
// the app did either: TabHub and LensHub both render at a computed fixed
// height, anchored to useMenuCardBottom(), measured against nothing.
//
// The arithmetic at the time of writing, with useMenuCardBottom() sitting at
// insets.bottom + 113:
//
//   TabHub,  Normal spacing,  font scale 1.0  ->  352 dp wanted
//   TabHub,  Roomier,         font scale 1.3  ->  396 dp
//   LensHub, Normal,          font scale 1.0  ->  402 dp
//   LensHub, Roomier,         font scale 1.3  ->  461 dp
//
// A 1080x2340 phone at ~2.625 density is 411 x 891 dp. So LensHub already
// wants nearly the whole of a 411 dp height, and anything that shrinks that
// number pushes the top of the card off the screen.
//
// Three separate settings shrink it, and one measurement covers all three,
// because useWindowDimensions() reports dp rather than pixels:
//
//   1. Android's Display size setting. It raises the density, so the same
//      physical screen reports fewer dp. Large takes roughly 1.1x to 1.3x off,
//      which is 330 to 375 dp of height on that phone. Both menus overflow.
//   2. A short viewport. app.json sets "orientation": "portrait", so an
//      ordinary phone will not rotate, but a short viewport is still reachable
//      four ways: an iPad ("supportsTablet": true), a foldable's outer or
//      unfolded screen, Android 16+ large screens which ignore an app's
//      orientation lock outright, and split-screen or multi-window, which
//      halves the height in portrait.
//   3. The phone's font-size setting, already handled for what the card wants
//      but not for what the screen can give.
//
// So: one pure function, no React, so it can be tested without a phone
// (scripts/test_menuFit.js). constants/floatingButton.ts wraps it in the hook
// the menus actually call.

export type MenuCardFit = {
  /** The height to render the card at: what it asked for, or the room available. */
  height: number;
  /** True when the card was clamped, so its content has to be able to scroll. */
  scrolls: boolean;
  /** The room the window actually offers, before the minimum is applied. */
  room: number;
};

export type MenuCardFitInput = {
  /** What the card wants to be, from its own row budget. */
  desired: number;
  /** useWindowDimensions().height, in dp. */
  windowHeight: number;
  /** Where the card's bottom edge sits above the window bottom (useMenuCardBottom). */
  cardBottom: number;
  /** insets.top: the status bar, notch, or cutout the card must not run under. */
  topInset: number;
  /** Breathing room between the top of the card and that inset. */
  topGap?: number;
  /** Never clamp below this, even on an absurdly short window. */
  minHeight?: number;
};

// A card pressed right up against the status bar reads as broken even when
// nothing is clipped, so it keeps a little air above it. Sized to match
// MENU_ABOVE_FOOTER_GAP's 10 at the bottom, plus a few px, because the
// top edge has a notch or cutout to clear rather than a flat band.
export const MENU_CARD_TOP_GAP = 16;

// The floor. Two rows of a menu grid plus its padding is roughly this, and
// below it a card stops being usable at all, so there is no point clamping
// further: better to let it run under the status bar on a window that short
// than to render a card too small to read. Nothing in the app reaches this in
// practice; it exists so the arithmetic cannot produce a zero-height or
// negative-height card from a window that has not reported its size yet.
export const MENU_CARD_MIN_HEIGHT = 140;

/**
 * How many dp a bottom-anchored menu card has between its own bottom edge and
 * the top of the window, once the status bar inset and the top gap are taken
 * out. Can come back 0 or negative on a very short window; fitMenuCard is what
 * decides what to do about that.
 */
export function menuCardRoom(input: Omit<MenuCardFitInput, 'desired' | 'minHeight'>): number {
  const { windowHeight, cardBottom, topInset, topGap = MENU_CARD_TOP_GAP } = input;
  return windowHeight - cardBottom - topInset - topGap;
}

/**
 * Fit a card's wanted height into the room the window actually has.
 *
 * Never returns more than `desired`: a short window shrinks a card, a tall one
 * does not stretch it. `scrolls` is what the caller uses to decide whether the
 * grid needs to be scrollable, though both menus pass their content through a
 * ScrollView unconditionally (a ScrollView whose content is shorter than its
 * frame simply does not scroll), so there is only ever one code path to be
 * right about.
 */
export function fitMenuCard(input: MenuCardFitInput): MenuCardFit {
  const { desired, windowHeight, minHeight = MENU_CARD_MIN_HEIGHT } = input;

  // Before the window reports a size (or if something hands us a nonsense
  // number), render exactly what the card asked for. That is what the app did
  // before this function existed, so the worst case is the old behavior rather
  // than a card collapsed to nothing.
  if (!Number.isFinite(windowHeight) || windowHeight <= 0) {
    return { height: desired, scrolls: false, room: desired };
  }

  const room = menuCardRoom(input);
  if (room >= desired) {
    return { height: desired, scrolls: false, room };
  }

  // The floor can never raise the card above what it wanted, which matters for
  // a small menu: a two-item card must not be inflated to 140.
  const floor = Math.min(minHeight, desired);
  return { height: Math.max(room, floor), scrolls: true, room };
}

// Where a menu card's left edge goes.
//
// On a phone every card is anchored to the left margin, for the thumb (see
// TabHub's component comment). On the desktop build the window is whatever
// width the person drags it to, and TabHub's card, pinned to that margin,
// drifted away from its button, which is centered. Reported 2026-09-21: "On
// the computer we aren't needing to keep anything left or right oriented, so
// it should just pop up in the middle directly above the TabHub icon." So
// there the card is centered on the window, from the live width, and follows
// a resize. Never negative: a window narrower than the card starts it at 0.
export type MenuCardLeftInput = {
  /** useWindowDimensions().width, in dp. */
  windowWidth: number;
  cardWidth: number;
  /** The phone's left anchor. */
  leftMargin: number;
  /** True on the desktop build (isDesktopApp). */
  centered: boolean;
};

export function menuCardLeft(input: MenuCardLeftInput): number {
  const { windowWidth, cardWidth, leftMargin, centered } = input;
  if (!centered || !Number.isFinite(windowWidth) || windowWidth <= 0) return leftMargin;
  return Math.max(0, Math.round(windowWidth / 2 - cardWidth / 2));
}

// Where the corner hub (LensHub, and anything stacked on it) sits, and where
// a secondary hub's card opens.
//
// On a phone LensHub is anchored to the bottom-left corner, a short reach from
// the same thumb that reaches TabHub, and shifts right only on a screen too
// narrow to hold it there clear of TabHub. The desktop build is a window of
// any width, and the corner of a wide window is nowhere near TabHub, which
// stays centered. Reported 2026-09-21: "instead of tying the LensHub icon and
// the My (TabNameHere) to the left side of the screen as an anchor, they
// should stay a specific distance from the TabHub menu icon. This is so no
// matter how wide the app is made to be, the menus are always toward the
// middle of the window and available for quick access."
//
// So on desktop the corner hub takes the second slot left of TabHub, the same
// slot formula useSecondaryHubPosition uses, one slot further out: the empty
// first slot is where My Items already centers itself, between LensHub's
// right edge and TabHub's artwork. Whatever stacks above LensHub (Insights'
// ScopeHub) reads the same left and follows. A phone keeps its corner.
export type CornerHubLeftInput = {
  /** useWindowDimensions().width, in dp. */
  windowWidth: number;
  buttonSize: number;
  /** The gap between adjacent hub buttons. */
  gap: number;
  /** The phone's corner margin. */
  cornerMargin: number;
  /** True on the desktop build (isDesktopApp). */
  nearTabHub: boolean;
};

export function cornerHubLeft(input: CornerHubLeftInput): number {
  const { windowWidth, buttonSize, gap, cornerMargin, nearTabHub } = input;
  const secondSlotLeft = windowWidth / 2 - buttonSize / 2 - 2 * (gap + buttonSize);
  if (nearTabHub) return Math.max(0, secondSlotLeft);
  return Math.min(cornerMargin, secondSlotLeft);
}

// A secondary hub's card (LensHub's lens picker, My Items, Insights' drill
// down) opens at the phone's left margin, which on a phone is also where the
// corner button is. On desktop the card opens over its button instead, so the
// two stay together however wide the window is, and never past the right
// edge: a window narrower than the card from the button starts it further
// left, down to 0.
export type SecondaryHubCardLeftInput = {
  /** useWindowDimensions().width, in dp. */
  windowWidth: number;
  cardWidth: number;
  /** The corner hub button's left, from cornerHubLeft. */
  buttonLeft: number;
  /** The phone's left margin. */
  leftMargin: number;
  /** True on the desktop build (isDesktopApp). */
  nearTabHub: boolean;
};

export function secondaryHubCardLeft(input: SecondaryHubCardLeftInput): number {
  const { windowWidth, cardWidth, buttonLeft, leftMargin, nearTabHub } = input;
  if (!nearTabHub || !Number.isFinite(windowWidth) || windowWidth <= 0) return leftMargin;
  return Math.max(0, Math.min(buttonLeft, windowWidth - cardWidth));
}
