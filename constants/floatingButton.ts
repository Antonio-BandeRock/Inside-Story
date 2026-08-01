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
// devices with little/no bottom safe-area inset. The further `- 4` is a
// second, later, explicit "move it down a few more pixels" request,
// layered on top rather than folded into the clamp above so that history
// stays legible -- this one intentionally allows the final value to go
// slightly negative (the button sitting a few px into what insets.bottom
// marks as unsafe), a small enough amount that it's very unlikely to
// cause real clipping even on a zero-inset device, and worth revisiting
// only if that ever turns out not to hold in practice.
// The further `+ 20`, 2026-07-26: on Android 3-button navigation, that OS
// scrim strip sits exactly at insets.bottom, so the -4 above already put the
// button's own box 4px into it -- and the butterfly artwork itself renders
// ~9px taller than that box (see BUTTERFLY_OVERHANG_Y in TabHub.tsx), so its
// visible bottom tip dipped into the scrim too (confirmed on-device: a
// visible seam behind the artwork specifically in 3-button mode, not
// present in gesture-nav mode where there's no such scrim to dip into).
// +20 clears both with a few px of margin to spare, layered on rather than
// folded into the -4 for the same "keep each request legible" reason as
// that one.
// The further `+ 15`, 2026-07-26: every hub still sat a little too close
// to the bottom footer strip -- explicitly requested a good 10-15px more
// clearance above it. All of them read this same constant, so this one
// change lifts every button together and keeps their bottom edges aligned
// with each other, rather than needing the same delta applied in several
// places.
//
// 2026-07-26, same day: a follow-up briefly moved the BUTTONS themselves
// to float above the footer band entirely (an attempt at "buttons and
// their popup menus both need to move up"), then was explicitly corrected
// -- only the popup MENUS that open from these buttons were ever supposed
// to move that far; the buttons themselves belong right here, inside the
// footer, exactly as this offset already put them. See useMenuCardBottom
// below for the menu-only version of that fix.
//
// The further `- 5`, 2026-07-26: the footer band itself (FOOTER_BAND_HEIGHT
// below, which this offset feeds directly into) was reported too tall --
// explicitly requested to bring the buttons down 5px "along with the top
// of the footer." Reducing this one shared offset does both at once:
// FOOTER_BAND_HEIGHT shrinks by the same 5px (it's derived from this),
// and every button anchored to it (TabHub, LensHub, ScopeHub) moves down
// with it -- and since useMenuCardBottom below is itself derived from
// useFooterBandHeight, every popup menu card moves down the same 5px too,
// satisfying "bring down the menus... by 5 pixels" from the same edit.
//
// The further `- 3`, same day: the footer still read a few px taller than
// intended -- explicitly requested another 3px off the top of the footer,
// with the same "icons and both hub popup textboxes move down with it"
// expectation as the -5 above. Same mechanism, same reasoning, smaller
// amount.
export const FLOATING_BUTTON_BOTTOM_OFFSET = Math.max(0, BASE_BOTTOM_MARGIN - 20) - 4 + 20 + 15 - 5 - 3;

// The footer band's own height (image bottom edge / bottomMask / footer
// line, see ScreenBackground.tsx) -- the flat margin above the button's
// own top edge (BACKGROUND_IMAGE_BUTTERFLY_GAP's old value, folded in here
// now that both this and the footer band's height live in one place) is
// what keeps the button readable against a plain backdrop instead of
// competing with the busy photo directly behind it.
const FOOTER_BAND_HEIGHT = FLOATING_BUTTON_BOTTOM_OFFSET + FLOATING_BUTTON_SIZE + 20;

// Exported so ScreenBackground.tsx's own footer band can size itself from
// the same one formula as everything else in this file, rather than a
// second, separately-maintained copy.
export function useFooterBandHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + FOOTER_BAND_HEIGHT;
}

// How far above the footer band's own top edge (where its color starts --
// see FOOTER_BAND_HEIGHT above) a hub's popup MENU should float. Explicitly
// requested as a plain, literal "10 pixels above the top edge of the
// footer's color" -- a prior pass tried computing this as the midpoint
// between the footer and GatedTabContent.tsx's resting-prompt text box
// instead, which wasn't what was actually asked for; this replaces that.
const MENU_ABOVE_FOOTER_GAP = 10;

// Where every hub's own popup card (TabHub's tab picker, LensHub's lens
// picker, ScopeHub's drill-down) should set its `bottom` -- one shared
// value so all three float to the exact same height, regardless of each
// one's own button position underneath (which, unlike this, still varies
// slightly -- e.g. ScopeHub's button sits one slot further left than
// LensHub's, but both open a card ending up at this same height).
export function useMenuCardBottom(): number {
  return useFooterBandHeight() + MENU_ABOVE_FOOTER_GAP;
}

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
