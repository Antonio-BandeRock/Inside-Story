// A real, minimal, module-level marker -- 2026-08-14, direct report: after
// starting a real food trial from a Food builder's own "Worth testing?"
// button, coming back landed on the resting picker with the in-progress
// dish's own unsaved ingredients gone entirely, not just needing the lens
// re-picked (worse still, the earlier "Back to what you were building"
// link itself landed on Home, not Food, since a tab switch inside this
// app's <Tabs> navigator never creates a real router.back()-able history
// entry the way a Stack push does).
//
// Root cause of the state loss specifically: app/(tabs)/food.tsx's own
// useFocusEffect always tore its currently-revealed builder down
// (unmounting it via GatedTabContent's real `revealed ? children : null`
// gate, destroying whatever unsaved ingredients it held) on every blur,
// and reset back to the resting picker on every subsequent focus too,
// absent one of its own real editXId/fromXFavoriteId deep-link params --
// neither of which this round trip to Signals and back ever sets.
//
// Every one of the ten direct-ingredient builders' own "Worth testing?"
// button calls markPendingFoodTrialReturn() in the exact same synchronous
// tap that navigates to /log, right before the real router.push. A plain
// module-level boolean rather than a React ref/context, since the two ends
// of this signal (a builder deep inside food.tsx's own children, and
// food.tsx's own top-level focus effect) have no direct prop path between
// them, and this app already has real precedent for exactly this shape of
// leaf module (see lib/alcoholAdvisory.ts, lib/rawMeatAdvisory.ts).
//
// food.tsx's own useFocusEffect cleanup calls consumePendingFoodTrialReturn()
// at blur time -- if it reads true, it skips its own destructive reset
// entirely for that one blur (and the matching next focus, tracked via its
// own local ref), so the builder stays genuinely, fully mounted the whole
// time -- not just visually hidden -- for the entire round trip.
let pending = false;

export function markPendingFoodTrialReturn(): void {
  pending = true;
}

export function consumePendingFoodTrialReturn(): boolean {
  const value = pending;
  pending = false;
  return value;
}
