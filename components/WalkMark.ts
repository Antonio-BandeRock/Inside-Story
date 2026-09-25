// Walk me through it, stage 2 (1.0.51.11): the outline on the button a walk
// line names. One hook per component, called once at the top:
//
//   const walkMark = useWalkMark();
//   <TouchableOpacity style={[styles.button, walkMark('upkeep.add')]}>
//
// walkMark returns undefined unless a walk is showing a line about that
// button, so a screen with no walk under way gets exactly the style it always
// had. An outline is drawn outside the box and takes up no room, so marking a
// button never moves anything around it. The names, and which line uses
// which, are in lib/storyWalk.ts.
import { useCallback, useEffect, useState } from 'react';
import { colors } from '../constants/colors';
import { getWalkMark, subscribeWalkMark, type WalkMark } from '../lib/storyWalk';

// Typed by its own shape, so the one value fits a button and a text box alike.
const MARKED = {
  outlineColor: colors.primary,
  outlineStyle: 'solid' as const,
  outlineWidth: 3,
  outlineOffset: 3,
};

// The three floating buttons are square boxes around round artwork, so their
// outline is drawn round and a little further out.
const ROUND = { ...MARKED, outlineOffset: 6, borderRadius: 999 };
const ROUND_MARKS: readonly WalkMark[] = ['hub', 'corner', 'bookmarks'];

export function useWalkMark(): (name: WalkMark) => typeof MARKED | undefined {
  const [active, setActive] = useState<WalkMark | null>(getWalkMark);
  useEffect(() => {
    setActive(getWalkMark());
    return subscribeWalkMark(setActive);
  }, []);
  return useCallback((name: WalkMark) => (active !== name ? undefined : ROUND_MARKS.includes(name) ? ROUND : MARKED), [active]);
}
