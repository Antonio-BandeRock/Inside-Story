// "Your usual range" on Trends (Phase B of the 2026-09-24 gap review,
// item 14). Pure: no imports, no I/O.
//
// A latest reading means more beside the person's earlier readings than
// on its own, so weight, steps, sleep and lab results say whether the
// latest one sits inside the middle of what came before, below it, or
// above it. The range is the 10th to the 90th percentile of the earlier
// readings, and needs at least MIN_USUAL_READINGS of them.
//
// Worded with the same limits as Growing Conditions: usual is what this
// person's readings have been, never what they should be. Nothing here
// says abnormal, too high, too low, ideal, optimal or healthy, and
// scripts/test_phase_b_patterns.js sweeps for those words. A lab's
// reference range is a separate thing, printed by the lab, and stays
// where it already is.

export const MIN_USUAL_READINGS = 8;
export const USUAL_LOW_PERCENTILE = 0.1;
export const USUAL_HIGH_PERCENTILE = 0.9;

export type UsualRange = { low: number; high: number; count: number };

function percentile(sorted: number[], p: number): number {
  const at = (sorted.length - 1) * p;
  const below = Math.floor(at);
  const above = Math.ceil(at);
  return sorted[below] + (sorted[above] - sorted[below]) * (at - below);
}

// From the readings before the latest one, oldest first.
export function usualRange(earlier: number[]): UsualRange | null {
  const values = earlier.filter((value) => Number.isFinite(value));
  if (values.length < MIN_USUAL_READINGS) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    low: percentile(sorted, USUAL_LOW_PERCENTILE),
    high: percentile(sorted, USUAL_HIGH_PERCENTILE),
    count: values.length,
  };
}

export type UsualPlace = 'below' | 'within' | 'above';

export function placeInUsual(latest: number, range: UsualRange): UsualPlace {
  return latest < range.low ? 'below' : latest > range.high ? 'above' : 'within';
}

// The caption. `values` is every reading in order, the latest last;
// `format` renders one number with its unit.
export function usualSentence(values: number[], format: (value: number) => string): string {
  if (values.length === 0) return '';
  const latest = values[values.length - 1];
  const earlier = values.slice(0, -1);
  const range = usualRange(earlier);
  if (!range) {
    const have = earlier.length;
    return `Your usual range shows once there are ${MIN_USUAL_READINGS} earlier readings to draw it from. There ${have === 1 ? 'is 1' : `are ${have}`} so far.`;
  }
  const span = `${format(range.low)} to ${format(range.high)}`;
  const place = placeInUsual(latest, range);
  const where =
    place === 'within'
      ? `The latest, ${format(latest)}, is inside your usual range of ${span}`
      : `The latest, ${format(latest)}, is ${place} your usual range of ${span}`;
  return `${where}, drawn from the middle of your ${range.count} earlier readings. Usual means what your readings have been, not what they should be.`;
}
