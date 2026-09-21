// One popup menu open at a time, and a tap on another hub's button while one
// is open lands on that hub rather than being swallowed.
//
// 2026-09-21, direct request, on the desktop build: "can we make it so the
// user doesn't have to click away from a menu for it to go away if for
// instance I have the TabHub menu tapped and then click on a LensHub menu."
//
// Why it needed building at all: each hub (TabHub, LensHub, MyItemsHub)
// opens a full-screen Modal whose backdrop is one Pressable covering the
// window. While it is up, the other hubs' buttons are visible underneath
// it but unreachable: a tap on one of them hits the backdrop, which closes
// the open menu, and the tap ends there. So the person taps twice, once to
// close and once to open, and the first tap looks like it did nothing.
//
// The fix keeps the Modals and puts a stand-in for every other hub's
// button inside each one, at the same window position, over the backdrop
// (components/HubHandoff.tsx renders them). A tap on a stand-in closes the
// menu it is in and opens the hub it stands for. For that, a hub has to be
// able to say where its button is and how to open it, which is what this
// registry holds: one entry per hub key, written by whichever instance is
// on the focused screen.
//
// The focus part matters. TabHub is rendered once, in the tab layout, but
// every tab screen renders its own LensHub and most render a MyItemsHub,
// and expo-router keeps every visited tab mounted. Without the focus gate
// the registry would hold whichever tab's LensHub happened to mount last,
// and a handoff from TabHub could open a menu belonging to a screen the
// person is not looking at. So a hub registers only while its screen is
// focused (useIsFocused), and unregisters the moment it is not.
//
// The stand-ins rely on one thing that the menus already rely on: a view
// placed inside the Modal with the same `bottom` and `left` a button was
// given outside it lands on the same spot. The card in each menu is placed
// exactly that way (useMenuCardBottom), and has been confirmed on-device,
// so this adds no new coordinate assumption. Where that ever failed, the
// worst case is the old behavior: the tap hits the backdrop and closes
// the menu.
//
// No React in here, so scripts/test_hub_handoff.js can check it without a
// phone. components/HubHandoff.tsx is the hook and the stand-in rendering.

export type HubKey = 'tab' | 'lens' | 'myItems';

export type HubSpot = {
  key: HubKey;
  /** The button's box in window coordinates, the way the button itself is positioned. */
  left: number;
  bottom: number;
  width: number;
  height: number;
  /** Opens that hub's menu the way its own button would (resets included). */
  open: () => void;
};

const spots = new Map<HubKey, HubSpot>();
let snapshot: readonly HubSpot[] = [];
const listeners = new Set<() => void>();

function publish(): void {
  snapshot = Array.from(spots.values());
  for (const listener of listeners) listener();
}

/**
 * Records where a hub's button is and how to open it. Returns the function
 * that takes it back out. A later registration under the same key replaces
 * the earlier one, and the earlier one's remover then does nothing, so an
 * unmounting instance can never remove the entry a newer instance wrote.
 */
export function registerHubSpot(spot: HubSpot): () => void {
  spots.set(spot.key, spot);
  publish();
  return () => {
    if (spots.get(spot.key) === spot) {
      spots.delete(spot.key);
      publish();
    }
  };
}

/** The current entries, as one stable array until the next change (for useSyncExternalStore). */
export function getHubSpots(): readonly HubSpot[] {
  return snapshot;
}

export function subscribeHubSpots(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Everything registered except the hub asking, which is the list of stand-ins its menu renders. */
export function otherHubSpots(all: readonly HubSpot[], selfKey: HubKey): HubSpot[] {
  return all.filter((spot) => spot.key !== selfKey);
}

/**
 * When the hub being handed to may open, relative to the menu that is
 * closing. On iOS a Modal presented while the previous one is still fading
 * out is refused by UIKit and never shows, so there the opening waits for
 * the closing Modal's onDismiss (which only iOS fires) and this answers
 * 'onDismiss'. Everywhere else the two can change in the same render.
 */
export function handoffTiming(platform: string): 'immediate' | 'onDismiss' {
  return platform === 'ios' ? 'onDismiss' : 'immediate';
}

/** Test seam: clears the registry between checks. Not for app code. */
export function resetHubSpotsForTests(): void {
  spots.clear();
  publish();
}
