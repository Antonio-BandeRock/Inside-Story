import { isMotionReduced } from '../lib/visualPreferences';
import { useVisualPreferences } from './useVisualPreferences';

// Whether this screen should skip the motion that exists for polish:
// 2026-09-16, part of low stimulation mode (see lowStimulation in
// lib/visualPreferences.ts for what that covers and why it is an override
// rather than a bulk write).
//
// A hook rather than a synchronous read, because every one of these call
// sites captures the value in a Reanimated worklet or an entering/exiting
// prop at render time. Subscribing means flipping the switch in Profile
// reaches an already-mounted screen, instead of leaving the old behavior
// in place until something else happened to re-render it. Modals are the
// exception and use modalAnimationType instead, since one mounts fresh on
// every open.
export function useReducedMotion(): boolean {
  return isMotionReduced(useVisualPreferences());
}
