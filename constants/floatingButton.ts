import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Shared sizing/position for the app's bottom-center floating buttons --
// TabHub's own button and HelpSheet's close button both anchor to the
// exact same spot, so they read as one consistent "reach here with your
// thumb" zone instead of two different button conventions.
export const FLOATING_BUTTON_SIZE = 60;

const BASE_BOTTOM_MARGIN = 16;
// 20px lower than the original bottom-center position (a prior, explicit
// request), clamped at 0 so it can never render partly off-screen on
// devices with little/no bottom safe-area inset.
export const FLOATING_BUTTON_BOTTOM_OFFSET = Math.max(0, BASE_BOTTOM_MARGIN - 20);

// Gap between adjacent floating hub buttons (TabHub, LensHub, and any
// screen-specific hub further left, e.g. Insights' ScopeHub), and how far
// each hub's own popup card sits from the screen's left edge -- shared so
// every "family member" lines up and spaces out consistently, however many
// of them a given screen has.
export const SECONDARY_HUB_GAP = 12;
export const SECONDARY_HUB_CARD_LEFT_MARGIN = 16;

// Where the Nth secondary hub button (anything other than TabHub itself)
// belongs, counting outward from TabHub: slotIndex 0 is immediately to its
// left (LensHub's own spot), slotIndex 1 is one further left again (e.g.
// Insights' ScopeHub), and so on -- one shared formula so every hub stays
// perfectly spaced and none of this position math gets hand-copied (and
// silently drifts) into each new hub component.
export function useSecondaryHubPosition(slotIndex: number): { bottom: number; left: number } {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET;
  const left = windowWidth / 2 - FLOATING_BUTTON_SIZE / 2 - (slotIndex + 1) * (SECONDARY_HUB_GAP + FLOATING_BUTTON_SIZE);
  return { bottom, left };
}

// A hub anchored to the screen's true bottom-LEFT corner (not just "one
// more slot to the left of TabHub" -- see useSecondaryHubPosition above),
// while still guaranteed to sit to the left of the page-view picker
// (LensHub, slot 0) with the same gap as every other hub pairing, and at
// the exact same `bottom` as TabHub/LensHub so its top edge lines up with
// both of theirs (identical height + identical bottom = identical top,
// automatically). On any normal-to-wide screen the literal corner margin
// already clears LensHub with room to spare, so this sits right at the
// corner; only on an unusually narrow screen does it shift right just
// enough to keep clear of LensHub, rather than overlapping it.
export function useBottomLeftHubPosition(): { bottom: number; left: number } {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET;
  const pageMenuLeft = windowWidth / 2 - FLOATING_BUTTON_SIZE / 2 - SECONDARY_HUB_GAP - FLOATING_BUTTON_SIZE;
  const left = Math.min(SECONDARY_HUB_CARD_LEFT_MARGIN, pageMenuLeft - SECONDARY_HUB_GAP - FLOATING_BUTTON_SIZE);
  return { bottom, left };
}

// The deferred left/right-handed layout toggle (see CLAUDE.md's Next
// Steps -- "revisit left/right-handed layout switching... toward the end
// of the project") doesn't exist yet as a real setting. Hardcoded to
// 'left' for now, matching the floating hubs' actual current behavior
// (TabHub/LensHub/ScopeHub cluster toward the left edge for a left thumb's
// sweep -- see LensHub's own comment). This is the one flag anything that
// needs to know "which side are the buttons on" should read, so that when
// a real handedness setting eventually exists, it's a single value to wire
// up rather than a search-and-replace across every position calculation.
export const NAVIGATION_HAND: 'left' | 'right' = 'left';

// The bottom corner OPPOSITE wherever the floating hubs are (see
// NAVIGATION_HAND) -- for anything that needs to stay out of the hubs' way
// without shrinking them, rather than sharing their side. Same `bottom` as
// every hub, so its row lines up with theirs; `left`/`right` (whichever is
// away from the hubs) is set, the other left `undefined` so it doesn't
// fight the one that matters.
export function useOppositeCornerPosition(): { bottom: number; left?: number; right?: number } {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET;
  return NAVIGATION_HAND === 'left'
    ? { bottom, right: SECONDARY_HUB_CARD_LEFT_MARGIN }
    : { bottom, left: SECONDARY_HUB_CARD_LEFT_MARGIN };
}

// How much room to leave below the LAST piece of real content on any
// scrollable screen, so it can always be scrolled clear of whichever
// floating button(s) sit at the bottom (TabHub, LensHub, Meals' own
// Create/Edit/Cancel buttons -- all anchored at this exact same bottom
// position, so one shared clearance value covers every one of them
// regardless of how many are present on a given screen). Device-dependent
// (insets.bottom varies a lot -- ~34px on an iPhone with a home indicator,
// up to ~48px on some Android gesture-nav devices), so this is a hook, not
// a static constant like the ones above -- a fixed guess would eventually
// undershoot on some real device and silently hide content behind a
// button again, exactly the bug this exists to rule out for good. Use as
// contentContainerStyle={{ paddingBottom: useFloatingButtonScrollPadding() }}
// (or merge into an existing contentContainerStyle) on every screen's
// outermost ScrollView.
export function useFloatingButtonScrollPadding(extraGap = 20): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET + FLOATING_BUTTON_SIZE + extraGap;
}
