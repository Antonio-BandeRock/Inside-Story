// A tiny, module-level "has Home's own first real data load finished yet"
// signal -- lets app/_layout.tsx's own startup gate keep DatabaseSetupScreen
// up until Home is genuinely ready to show something, not just until the
// reference-database import resolves. Direct report, 2026-08-16: "That was
// put in place to hide the loading time of the home screen on the first
// load of the app starting... It has not changed a bit." Confirmed by
// reading app/_layout.tsx directly: the loading screen only ever gated on
// the reference-database import, with zero connection to Home's own,
// separate, un-gated load underneath it -- once the import resolved, the
// loading screen vanished and Home was left to populate on its own, in
// full view, with no progress indicator covering it at all. This closes
// that real gap between what was asked for and what got built.
//
// Same small "module-level state plus subscriber list" shape
// lib/visualPreferences.ts/lib/pendingFoodTrialReturn.ts already use for
// exactly this "one far-apart component needs to know something happened
// in another" cross-cutting case, reused here rather than introducing a
// second mechanism (React Context) for the same job.

let homeDataReady = false;
const listeners = new Set<() => void>();

// Called once by Home's own load effect, the instant its first real load
// resolves -- deliberately idempotent (a second call is a harmless no-op),
// since nothing about Home's own focus-effect re-firing on a later visit
// should ever un-ready this signal.
export function markHomeDataReady() {
  if (homeDataReady) return;
  homeDataReady = true;
  listeners.forEach((listener) => listener());
}

export function isHomeDataReady(): boolean {
  return homeDataReady;
}

export function subscribeToHomeDataReady(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
