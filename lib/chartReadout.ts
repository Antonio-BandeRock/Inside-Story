// Where a chart's readout sits beside the dot that was tapped, 1.0.61.14
// (2026-10-05). Direct request: chart readouts away from the finger. A thumb
// tapping a dot covers the dot and the side its hand comes in from, so the
// small value label goes on the far side of the dot from the navigation
// hand, and slightly above it. Near an edge it flips to the side that has
// room, since a label cut off by the edge reads worse than one under a
// fingertip that has already lifted. Pure, so scripts/test_chart_readout.js
// checks it without a phone, and it imports nothing at run time.
import type { NavigationHand } from './navigationHand';

export const READOUT_GAP = 10;
export const READOUT_HEIGHT = 18;

// A width that holds the label at fontSize 11 without measuring text, which
// an SVG on a phone cannot do before it draws.
export function readoutWidth(label: string): number {
  return Math.ceil(label.length * 6.4) + 10;
}

export function placeReadout(args: {
  hand: NavigationHand;
  dotX: number;
  dotY: number;
  width: number;
  minX: number;
  maxX: number;
  minY: number;
}): { x: number; y: number; side: NavigationHand } {
  const { hand, dotX, dotY, width, minX, maxX, minY } = args;
  const leftX = dotX - READOUT_GAP - width;
  const rightX = dotX + READOUT_GAP;
  const fitsLeft = leftX >= minX;
  const fitsRight = rightX + width <= maxX;
  let side: NavigationHand = hand === 'left' ? 'right' : 'left';
  if (side === 'left' && !fitsLeft && fitsRight) side = 'right';
  else if (side === 'right' && !fitsRight && fitsLeft) side = 'left';
  const rawX = side === 'left' ? leftX : rightX;
  const x = Math.max(minX, Math.min(rawX, maxX - width));
  const y = Math.max(minY, dotY - READOUT_HEIGHT - 2);
  return { x, y, side };
}
