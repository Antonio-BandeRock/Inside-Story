// Which days a supplement was actually part of, and what the food half of
// a nutrient trend came to over a range. Asked for on 2026-09-23: "the
// Food versus supplement over time in trends should be built."
//
// WHY THIS EXISTS AT ALL. The standing goal is food first, and a
// supplement only for what food cannot supply. Insights > Nutrients
// already splits one day's figure into its food share and its supplement
// share, and Home's rings draw the supplement stretch in amber. Trends had
// neither: one line, food and supplements added together, with no way to
// see whether a rising figure was somebody eating differently or somebody
// swallowing more capsules. Those are two different outcomes and the app
// is supposed to say which one happened.
//
// THE HONESTY PROBLEM, AND WHAT IS DONE ABOUT IT. Nothing in this app
// records a dose being swallowed on a given day. Schedules > Meds shows a
// dose timeline and lets a dose be marked taken, but no per-day history of
// that is kept. So the supplement half of any past day is an estimate, and
// the only honest basis for it is what the person told the app about the
// regimen itself: treatments.start_date, end_date and whether it is still
// switched on.
//
// Until now the trend used the CURRENT regimen for every day in the range,
// so a supplement started yesterday read as having been there ninety days
// ago, and one stopped in July still counted through September. Reading
// the dates fixes both. Where a person gave no dates, nothing is invented
// in either direction: the supplement is counted across the range, the
// same as before, and the caption says that is what happened. An inactive
// supplement with no end date falls back to the day it was last changed,
// which is the day it was switched off, and is the best marker in the row.
//
// Every sentence in here says which of those it is, because a confidently
// wrong split is worse than an honestly uncertain one.

export type SupplementWindow = {
  /** treatments.start_date, or null when the person gave none. */
  startDate: string | null;
  /** treatments.end_date, or null. */
  endDate: string | null;
  active: boolean;
  /** The date part of treatments.updated_at: when it was last switched. */
  updatedDate: string | null;
};

/**
 * Whether a supplement counts toward a given date. Dates are the app's
 * plain YYYY-MM-DD strings, which compare correctly as strings.
 */
export function supplementCoversDate(window: SupplementWindow, date: string): boolean {
  if (window.startDate && date < window.startDate) return false;
  if (window.endDate) return date <= window.endDate;
  // Switched off without an end date: the day it was last changed is the
  // day it stopped, as near as the row can say.
  if (!window.active && window.updatedDate) return date <= window.updatedDate;
  return true;
}

/**
 * What the split is based on across the supplements that actually reach
 * the chart. 'none' means no supplement touches the range at all, 'dated'
 * that every one of them carries a start date, 'undated' that at least one
 * is being counted across the whole range for want of one.
 */
export function supplementBasis(windows: SupplementWindow[]): 'none' | 'dated' | 'undated' {
  if (windows.length === 0) return 'none';
  return windows.every((window) => window.startDate) ? 'dated' : 'undated';
}

export type SourceSplitPoint = {
  date: string;
  /** Percent of target reached by food alone. */
  foodPercent: number;
  /** Percent of target reached by food and supplements together. */
  totalPercent: number;
};

export type SourceSplitSummary = {
  daysCharted: number;
  daysFoodAloneCovered: number;
  averageFoodPercent: number;
  averageTotalPercent: number;
  supplementInvolved: boolean;
  /** One sentence for above the chart. */
  headline: string;
  /** How the food line reads, or null when there is only one line. */
  legendNote: string | null;
  /** Where the supplement half came from, or null when there is none. */
  basisNote: string | null;
};

function round(value: number): number {
  return Math.round(value);
}

export function summarizeSourceSplit(
  points: SourceSplitPoint[],
  basis: 'none' | 'dated' | 'undated',
): SourceSplitSummary {
  const daysCharted = points.length;
  if (daysCharted === 0) {
    return {
      daysCharted: 0,
      daysFoodAloneCovered: 0,
      averageFoodPercent: 0,
      averageTotalPercent: 0,
      supplementInvolved: false,
      headline: 'Nothing logged in this range yet.',
      legendNote: null,
      basisNote: null,
    };
  }

  const averageFoodPercent = points.reduce((sum, point) => sum + point.foodPercent, 0) / daysCharted;
  const averageTotalPercent = points.reduce((sum, point) => sum + point.totalPercent, 0) / daysCharted;
  const daysFoodAloneCovered = points.filter((point) => point.foodPercent >= 100).length;
  // A rounding of less than a percentage point apart would draw two lines
  // nobody can tell from each other, so it reads as food alone.
  const supplementInvolved = points.some((point) => point.totalPercent - point.foodPercent >= 1);

  const dayWord = daysCharted === 1 ? 'day' : 'days';

  if (!supplementInvolved) {
    return {
      daysCharted,
      daysFoodAloneCovered,
      averageFoodPercent,
      averageTotalPercent,
      supplementInvolved: false,
      headline:
        daysFoodAloneCovered === daysCharted
          ? `All food, and it covered the target on every one of these ${daysCharted} ${dayWord}.`
          : `All food. It covered the target on ${daysFoodAloneCovered} of these ${daysCharted} ${dayWord}.`,
      legendNote: null,
      basisNote: null,
    };
  }

  return {
    daysCharted,
    daysFoodAloneCovered,
    averageFoodPercent,
    averageTotalPercent,
    supplementInvolved: true,
    headline: `Your food averaged ${round(averageFoodPercent)}% of the target over these ${daysCharted} ${dayWord}, and what you take brought it to ${round(
      averageTotalPercent,
    )}%. Food by itself reached the target on ${daysFoodAloneCovered} of them.`,
    legendNote: 'The lower line is food by itself. The space up to the top line is what a supplement added.',
    basisNote:
      basis === 'dated'
        ? 'Worked out from the start and end dates you gave each supplement. No day here records a dose being swallowed, so this is the regimen as you described it.'
        : 'A supplement you have not given a start date to is counted across the whole range, since nothing here records a dose being swallowed. Adding dates in My Meds sharpens this.',
  };
}
