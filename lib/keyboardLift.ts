// How far to lift the screen so a field being typed into clears AppKeyboard.
//
// Pure, so it can be run and checked directly (scripts/test_keyboard_lift.js)
// rather than only ever by holding a phone. The component keeps the parts that
// genuinely need a device: measuring, animating, and React.

// Clear space left between the field and the top of the keyboard, so the field
// reads as visible rather than flush against the keys.
export const FIELD_GAP = 12;

// Below this, a correction reads as a twitch rather than a fix.
export const LIFT_EPSILON = 1;

export const LIFT_DURATION_MS = 180;

/**
 * The lift the content should be at, or null when it is already right.
 *
 * The keyboard's top edge never moves, so `keyboardTopY` is a known constant.
 * A field's position is not: the same field sits at a different height
 * depending on the screen and how far it is scrolled, which is the one thing
 * that has to be looked at.
 *
 * SELF-CORRECTING, and that is the only subtle part. `fieldBottomY` is
 * measured while the content is ALREADY lifted by `currentLift`, so what it
 * implies is the REMAINING overlap, not the whole of it. Adding that to the
 * current lift is what makes focusing a second field while already lifted land
 * correctly instead of double-counting and jumping too far. It also lowers
 * itself: a field that is already clear yields a negative remainder.
 */
export function computeNextLift(params: {
  currentLift: number;
  fieldBottomY: number;
  keyboardTopY: number;
}): number | null {
  const { currentLift, fieldBottomY, keyboardTopY } = params;
  const remainingOverlap = fieldBottomY + FIELD_GAP - keyboardTopY;
  // Never lifted past the keyboard's own top edge: no field can need more than
  // that, so anything beyond it is a bad measurement rather than a requirement.
  const ceiling = Math.max(keyboardTopY, 0);
  const next = Math.min(Math.max(currentLift + remainingOverlap, 0), ceiling);
  if (Math.abs(next - currentLift) < LIFT_EPSILON) return null;
  return next;
}
