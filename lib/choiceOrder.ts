/**
 * Chooser lists of names read in alphabetical order.
 *
 * Direct instruction, 2026-09-21: "Make sure that the chooser lists are
 * listed in alphabetical order." A list of NAMES (kinds of equipment,
 * spaces, materials, areas, countries) is sorted by its label, with the
 * person's own entries merged in among the built-ins rather than tacked on
 * at the end, and any fixed entry (Unassigned, Add a ... of your own,
 * Something else) held at its end of the list by the caller. A list that
 * is a SCALE (sunlight amount, plant stage, planting status, moisture, a
 * cadence, a unit of measure) keeps its natural order, since alphabetical
 * would scramble it.
 */

/** Case-insensitive, accent-aware comparison of two labels. */
export function compareLabels(a: string, b: string): number {
  return a.trim().toLowerCase().localeCompare(b.trim().toLowerCase());
}

/** A copy of the list in alphabetical order of label. */
export function sortByLabel<T extends { label: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareLabels(a.label, b.label));
}
