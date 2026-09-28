// The arithmetic behind dragging a row to a new place in a list whose rows
// are NOT all the same height (1.0.55.15, first used for the exercises in a
// workout on Life > Workouts). Home's arrange list gets away with dividing
// by one fixed pitch because every row there is 48 dp; an exercise row
// grows with its note, its sets and reps line and the phone's text size, so
// here each row is measured and the sums are done on what was measured.
//
// Pure and with no React in it, so scripts/test_drag_reorder.js can check it
// without a phone.

// Where the held row would land: it has passed a neighbour once its middle
// has gone past that neighbour's middle, which is the point where swapping
// them looks right rather than early or late. `gap` is the space the list
// leaves between two rows.
export function dragTargetIndex(heights: readonly number[], from: number, dy: number, gap = 0): number {
  if (from < 0 || from >= heights.length) return from;
  const tops: number[] = [];
  let y = 0;
  for (const height of heights) {
    tops.push(y);
    y += height + gap;
  }
  const heldMiddle = tops[from] + heights[from] / 2 + dy;
  let to = from;
  if (dy > 0) {
    for (let i = from + 1; i < heights.length; i += 1) {
      if (heldMiddle > tops[i] + heights[i] / 2) to = i;
      else break;
    }
  } else if (dy < 0) {
    for (let i = from - 1; i >= 0; i -= 1) {
      if (heldMiddle < tops[i] + heights[i] / 2) to = i;
      else break;
    }
  }
  return to;
}

// How far a row that is NOT being held slides to make room: up by the held
// row's height if the held row has passed it going down, down by the same
// going up, nowhere otherwise.
export function dragShiftFor(
  heights: readonly number[],
  from: number,
  to: number,
  index: number,
  gap = 0,
): number {
  if (index === from || to === from || from < 0 || from >= heights.length) return 0;
  const room = heights[from] + gap;
  if (to > from && index > from && index <= to) return -room;
  if (to < from && index >= to && index < from) return room;
  return 0;
}

// The list with the row at `from` taken out and put back at `to`.
export function moveIndex<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [held] = next.splice(from, 1);
  next.splice(to, 0, held);
  return next;
}
