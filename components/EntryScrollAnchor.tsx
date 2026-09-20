import { useRef, type MutableRefObject, type ReactNode, type RefObject } from 'react';
import { View } from 'react-native';
import { HOME_BAND_GAP } from './HomeSectionBand';

// Brings one reading entry to the top of the screen once it has opened.
//
// A Home flip card's Read More, a Related chip and a Search Reading hit
// all land on a lens and open the entry in place. Until 2026-09-19 the
// lens scrolled to the top of the topic band the entry sits in, which is
// not where the entry is: with a subgroup and a dozen rows above it, the
// person arrived somewhere in the band with no idea which way to scroll.
// The correction: "it should open that specific one with it at the top
// of the screen so I see it right there instead of having to hunt for it."
//
// A band's top can be read off its own layout event, but a row's place in
// the scroll is the sum of every fold and heading between it and the
// section, so the row measures itself against the section instead. The
// measure runs from the row's own layout event, which is the moment it is
// certain to be where it will stay: the row fires that event when it
// mounts (its band just unfolded) and when it changes size (it just
// expanded), and both are exactly the moments a link-in produces. The
// pending id says which row is wanted, and is cleared by the first measure
// so a later relayout of the same row does not scroll again.
export type EntryScrollTarget = {
  // The id of the entry that should come to the top, or null.
  pending: MutableRefObject<string | null>;
  // The section the position is measured from. The host that owns the
  // ScrollView adds the section's own offset on the way through.
  relativeTo: RefObject<View | null>;
  onMeasured: (y: number) => void;
};

// The room left above the row so it does not sit hard against the top edge.
export const ENTRY_SCROLL_INSET = HOME_BAND_GAP;

export function EntryScrollAnchor({ id, target, children }: { id: string; target?: EntryScrollTarget; children: ReactNode }) {
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      onLayout={() => {
        if (!target || target.pending.current !== id) return;
        const host = target.relativeTo.current;
        if (!host || !ref.current) return;
        ref.current.measureLayout(
          host,
          (_x, y) => {
            if (target.pending.current !== id) return;
            target.pending.current = null;
            target.onMeasured(Math.max(0, y - ENTRY_SCROLL_INSET));
          },
          () => {},
        );
      }}
    >
      {children}
    </View>
  );
}
