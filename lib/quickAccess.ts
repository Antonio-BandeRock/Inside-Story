// The quick-access menu's way of opening a sheet it does not own, 1.0.66.6
// (2026-10-10). The voice note, Low Stimulation, Ask Your Records and Say
// Where Something Is sheets each stay mounted once in app/_layout.tsx, where they always were; the one
// edge button (components/QuickAccessButton.tsx) only asks for one of them to
// open. A plain listener list rather than a context, because the sheets and
// the button are siblings at the root and nothing between them needs to know.
export type QuickAccessSheet = 'voiceNote' | 'lowStimulation' | 'askRecords' | 'sayWhere';

const listeners = new Set<(sheet: QuickAccessSheet) => void>();

export function openQuickAccessSheet(sheet: QuickAccessSheet): void {
  for (const listener of listeners) listener(sheet);
}

export function subscribeQuickAccess(listener: (sheet: QuickAccessSheet) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Say Where Something Is can be opened over Where Is It itself, which only
// re-reads when it is arrived at, so a save says so here and that screen
// reads again rather than leaving the new answer out until the next visit.
const placeListeners = new Set<() => void>();

export function announcePlaceSaved(): void {
  for (const listener of placeListeners) listener();
}

export function subscribePlaceSaved(listener: () => void): () => void {
  placeListeners.add(listener);
  return () => {
    placeListeners.delete(listener);
  };
}
