// Keeps the screen from dimming while something on it is being followed
// with the hands busy: cook mode, a workout, the Calm pacer (G4, D15, rebuild
// R1, 2026-10-02). Only while `active` is true, released the moment it goes
// false or the screen closes, and each caller has its own tag so one closing
// never lets the screen dim under another still open.
//
// expo-keep-awake on the phone; on the desktop its web half asks the window
// for a screen wake lock, which Electron grants. A refusal is quiet: the
// screen dims the way it always did, and nothing else changes.
import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export function useKeepScreenOn(active: boolean, tag: string): void {
  useEffect(() => {
    if (!active) return;
    activateKeepAwakeAsync(tag).catch(() => undefined);
    return () => {
      deactivateKeepAwake(tag).catch(() => undefined);
    };
  }, [active, tag]);
}
