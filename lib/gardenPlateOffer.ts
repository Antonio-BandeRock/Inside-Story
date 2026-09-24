// How logging a meal reaches the "from your garden" sheet.
//
// Phase 6 of the 2026-09-23 cross-app push. lib/plateSource.ts holds the
// matching, the wording and both bands and is the pure module;
// lib/plateSourceDb.ts does the reads and the one write. This carries the
// single listener between them.
//
// Why a listener at all. A meal gets saved from five places (voice logging,
// Find a Meal, the Meal Builder, a scanned product, and relogging), and the
// sheet has to paint over the whole window from any of them, including from
// inside a modal a builder put up. One host at the app root does that, the
// same shape lib/tellClaude.ts uses, and every call site is one line that
// needs to know nothing about gardens.
//
// Deliberately a module rather than a React context, for the same reason:
// threading a provider through five unrelated screens to carry one sheet
// would be furniture in the way of the app.

type Opener = (mealId: string) => void;

let opener: Opener | null = null;

/** Registered by components/GardenPlateOfferHost.tsx at the app root. */
export function registerGardenPlateOpener(open: Opener): () => void {
  opener = open;
  return () => {
    if (opener === open) opener = null;
  };
}

/**
 * Offer to take what this meal used off what the garden has on hand.
 *
 * Safe to call after saving any meal at all. The host reads the meal, looks
 * for a match among pickings that still have something left, and stays
 * silent when there is none, so somebody with no garden never sees anything.
 */
export function offerGardenUse(mealId: string): void {
  opener?.(mealId);
}
