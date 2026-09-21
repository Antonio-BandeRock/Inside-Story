// The text size steps the desktop build offers, the app's half of
// desktop/zoom.js (which holds the same list and applies it; the test in
// scripts/test_hub_handoff.js keeps the two identical). No React and no
// bridge call in here, so the labels and the nearest-step arithmetic can
// be tested without Electron. See desktop/zoom.js for why page zoom is the
// desktop's text size setting at all.

export const DESKTOP_TEXT_SIZE_STEPS: readonly number[] = [1, 1.1, 1.25, 1.5, 1.75, 2];

export const DESKTOP_TEXT_SIZE_DEFAULT = 1.25;

/** What the picker shows for a step: the percentage, and which one is the standard. */
export function desktopTextSizeLabel(factor: number): string {
  const percent = `${Math.round(factor * 100)}%`;
  return factor === DESKTOP_TEXT_SIZE_DEFAULT ? `${percent} (standard)` : percent;
}

export const DESKTOP_TEXT_SIZE_LABELS: readonly string[] = DESKTOP_TEXT_SIZE_STEPS.map(desktopTextSizeLabel);

/** The step whose label this is, for the picker's onSelect. */
export function desktopTextSizeForLabel(label: string): number | null {
  const index = DESKTOP_TEXT_SIZE_LABELS.indexOf(label);
  return index < 0 ? null : DESKTOP_TEXT_SIZE_STEPS[index];
}

/** The listed step closest to a factor, so a stored value off the list still selects something. */
export function nearestDesktopTextSize(factor: number): number {
  if (!Number.isFinite(factor)) return DESKTOP_TEXT_SIZE_DEFAULT;
  let best = DESKTOP_TEXT_SIZE_STEPS[0];
  for (const step of DESKTOP_TEXT_SIZE_STEPS) {
    if (Math.abs(step - factor) < Math.abs(best - factor)) best = step;
  }
  return best;
}
