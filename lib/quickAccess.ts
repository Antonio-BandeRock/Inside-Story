// The quick-access menu's way of opening a sheet it does not own, 1.0.66.6
// (2026-10-10). The voice note, Low Stimulation and Ask Your Records sheets
// each stay mounted once in app/_layout.tsx, where they always were; the one
// edge button (components/QuickAccessButton.tsx) only asks for one of them to
// open. A plain listener list rather than a context, because the sheets and
// the button are siblings at the root and nothing between them needs to know.
export type QuickAccessSheet = 'voiceNote' | 'lowStimulation' | 'askRecords';

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
