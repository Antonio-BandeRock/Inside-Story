// The React half of lib/hubHandoff.ts: a hub registers its button while its
// screen is focused, and renders a stand-in for every other hub's button
// inside its own popup, so a tap on one of those while this menu is open
// closes this menu and opens that one. See the long comment in
// lib/hubHandoff.ts for why the stand-ins exist and what they rely on.
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Platform, Pressable, type ViewStyle } from 'react-native';

import {
  getHubSpots,
  handoffTiming,
  otherHubSpots,
  registerHubSpot,
  subscribeHubSpots,
  type HubKey,
  type HubSpot,
} from '../lib/hubHandoff';

export type HubButtonBox = Pick<HubSpot, 'left' | 'bottom' | 'width' | 'height'>;

export type HubHandoff = {
  /** Rendered inside the hub's Modal, right after its backdrop Pressable and before its card. */
  targets: React.ReactNode;
  /** Passed to the Modal's onDismiss, which is where iOS gets to open the next menu. */
  onDismiss: () => void;
};

/**
 * @param key which hub this is
 * @param box where this hub's button is, in the same `bottom`/`left` terms the button is styled with,
 *   or null when this instance has no button (MyItemsHub used as a submenu)
 * @param open opens this hub's menu the way its button does; a fresh function each render is fine
 * @param close closes this hub's menu
 */
export function useHubHandoff(key: HubKey, box: HubButtonBox | null, open: () => void, close: () => void): HubHandoff {
  const focused = useIsFocused();

  // The registry wants one function that stays the same across renders, and
  // a hub's open routine closes over state that changes every render, so the
  // registered function reads the latest one through a ref.
  const openRef = useRef(open);
  openRef.current = open;
  const openLatest = useCallback(() => openRef.current(), []);

  const left = box?.left ?? 0;
  const bottom = box?.bottom ?? 0;
  const width = box?.width ?? 0;
  const height = box?.height ?? 0;
  const hasBox = box !== null;
  useEffect(() => {
    if (!focused || !hasBox) return undefined;
    return registerHubSpot({ key, left, bottom, width, height, open: openLatest });
  }, [focused, hasBox, key, left, bottom, width, height, openLatest]);

  const all = useSyncExternalStore(subscribeHubSpots, getHubSpots, getHubSpots);
  const others = useMemo(() => otherHubSpots(all, key), [all, key]);

  // On iOS the next menu opens from this Modal's onDismiss (see
  // handoffTiming); the target waits here until that fires.
  const pendingRef = useRef<(() => void) | null>(null);
  const closeRef = useRef(close);
  closeRef.current = close;

  const handTo = useCallback((target: HubSpot) => {
    closeRef.current();
    if (handoffTiming(Platform.OS) === 'onDismiss') {
      pendingRef.current = target.open;
    } else {
      target.open();
    }
  }, []);

  const onDismiss = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    pending?.();
  }, []);

  const targets = useMemo(
    () =>
      others.map((spot) => {
        const style: ViewStyle = {
          position: 'absolute',
          left: spot.left,
          bottom: spot.bottom,
          width: spot.width,
          height: spot.height,
        };
        return (
          <Pressable
            key={spot.key}
            style={style}
            onPress={() => handTo(spot)}
            accessibilityRole="button"
            accessibilityLabel={HANDOFF_LABELS[spot.key]}
          />
        );
      }),
    [others, handTo],
  );

  return { targets, onDismiss };
}

// What a screen reader hears for a stand-in. The real buttons underneath
// carry their own labels; these say what the tap will do instead.
const HANDOFF_LABELS: Record<HubKey, string> = {
  tab: 'Switch to the navigation menu',
  lens: 'Switch to the view menu',
  myItems: 'Switch to your saved items',
};
