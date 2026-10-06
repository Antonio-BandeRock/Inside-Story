// Which hand works the app's navigation, 1.0.61.13 (2026-10-05). Direct
// request: a quick way to switch between left and right hand use, by a
// switch button sticking out of the far edge just above the footer
// (components/HandSwitchButton.tsx). Until then this was the hardcoded
// NAVIGATION_HAND constant in constants/floatingButton.ts.
//
// The choice belongs to the device in the person's hand, not to their
// records, so it lives in a plain file rather than the database: it never
// travels through sync, a phone held in the left hand and a computer worked
// with a mouse can differ, and it is read synchronously at startup so the
// hubs never draw on the wrong side for a moment first. Missing or
// unreadable reads as 'left', which is where every hub sat before.
import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

export type NavigationHand = 'left' | 'right';

const MIRROR_FILE_NAME = 'navigation_hand.txt';

function mirrorFile(): File {
  return new File(Paths.document, MIRROR_FILE_NAME);
}

function readHand(): NavigationHand {
  try {
    const file = mirrorFile();
    if (file.exists) return file.textSync().trim() === 'right' ? 'right' : 'left';
  } catch {
    // Falls back to the default below.
  }
  return 'left';
}

let current: NavigationHand | null = null;
const listeners = new Set<() => void>();

// The hand right now. Safe to call during render; a component that has to
// redraw when the hand changes calls useNavigationHand instead.
export function getNavigationHand(): NavigationHand {
  if (current === null) current = readHand();
  return current;
}

export function setNavigationHand(hand: NavigationHand): void {
  if (getNavigationHand() === hand) return;
  current = hand;
  try {
    mirrorFile().write(hand);
  } catch {
    // Holds for this run; the next launch falls back to the default.
  }
  listeners.forEach((listener) => listener());
}

// The side opposite the navigation hand, where things the thumb should not
// hit by accident sit (Lock Now, the switch button itself).
export function farSide(hand: NavigationHand): NavigationHand {
  return hand === 'left' ? 'right' : 'left';
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNavigationHand(): NavigationHand {
  return useSyncExternalStore(subscribe, getNavigationHand, getNavigationHand);
}

// Where a form's main button goes, 1.0.61.14 (2026-10-05). Direct request:
// Save on the thumb side, Cancel and the other ways out on the far side. A
// row's buttons keep their order in the source, and `primary` says which end
// of it the main button is written at; the row is then laid out so that
// button lands nearest the edge the thumb rests on, with the rest packed in
// beside it toward the far side. Pure, so a test can check it without a phone.
export type ThumbRowPrimary = 'first' | 'last';

export function thumbRowLayout(
  hand: NavigationHand,
  primary: ThumbRowPrimary,
): { flexDirection: 'row' | 'row-reverse'; justifyContent: 'flex-start' | 'flex-end' } {
  // 'row' fills from the left, 'row-reverse' from the right. Written first,
  // the main button leads from the thumb's edge; written last, it closes the
  // row against that edge.
  if (primary === 'first') {
    return { flexDirection: hand === 'left' ? 'row' : 'row-reverse', justifyContent: 'flex-start' };
  }
  return { flexDirection: hand === 'left' ? 'row-reverse' : 'row', justifyContent: 'flex-end' };
}

// The thumb's end of a row, 1.0.61.15 (2026-10-05). Direct request: the
// chevron, Done check or one small action at the end of a list row goes at
// the thumb's end, and a stepper's plus goes nearest the thumb, since it is
// pressed far more often than minus. The row is written in the right-handed
// order, the everyday thing last, and for a left hand it is mirrored. Only the
// direction changes, so a row's own spacing (space-between, gap) carries over.
export function thumbEndDirection(hand: NavigationHand): 'row' | 'row-reverse' {
  return hand === 'left' ? 'row-reverse' : 'row';
}
