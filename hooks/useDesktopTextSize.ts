// The desktop build's text size, for Profile's picker. On a phone (or
// anywhere the bridge is missing) `available` is false and nothing is
// rendered; on the desktop build it reads the factor desktop/zoom.js is
// applying and follows every change, including the ones made from the
// keyboard or the View menu, so the picker never shows a stale size.
import { useCallback, useEffect, useState } from 'react';

import { getDesktopBridge, isDesktopApp } from '../lib/desktop/bridge';
import { nearestDesktopTextSize, pinnedZoomScale } from '../lib/desktop/zoom';

export type DesktopTextSize = {
  available: boolean;
  /** The current step, or null until the first read answers. */
  factor: number | null;
  setFactor: (factor: number) => void;
};

export function useDesktopTextSize(): DesktopTextSize {
  const available = isDesktopApp();
  const [factor, setFactorState] = useState<number | null>(null);

  useEffect(() => {
    if (!available) return undefined;
    const bridge = getDesktopBridge();
    let live = true;
    void bridge.zoom.get().then((current) => {
      if (live) setFactorState(nearestDesktopTextSize(current));
    });
    const remove = bridge.zoom.onChange((current) => {
      if (live) setFactorState(nearestDesktopTextSize(current));
    });
    return () => {
      live = false;
      remove();
    };
  }, [available]);

  const setFactor = useCallback(
    (next: number) => {
      if (!available) return;
      setFactorState(nearestDesktopTextSize(next));
      void getDesktopBridge().zoom.set(next);
    },
    [available],
  );

  return { available, factor, setFactor };
}

/**
 * The multiplier for a thing pinned against the desktop's text size (see
 * pinnedZoomScale): 1 on a phone, 1 until the first read answers, and the
 * standard zoom over the current one from then on, following every change.
 */
export function usePinnedZoomScale(): number {
  const { available, factor } = useDesktopTextSize();
  return available ? pinnedZoomScale(factor) : 1;
}
