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

/**
 * What a thing pinned against the text size multiplies its dp by, so it keeps
 * the same number of pixels on the glass at every zoom: the standard zoom over
 * the current one. Page zoom scales every dp, so at 200% a 78 dp box is twice
 * the pixels it was at the standard 125%; drawn at 78 * (1.25 / 2) dp it is
 * the same box. 1 until the first read answers, and 1 for anything that is
 * not a zoom. Direct request, 2026-09-21: "Pin the corner box against the
 * text-size zoom too." The corner box and the version number under it are
 * the two things pinned (components/PageIdentityLabel.tsx, VersionLabel.tsx),
 * the same two the phone's font-size setting is pinned for.
 */
export function pinnedZoomScale(factor: number | null | undefined): number {
  if (factor == null || !Number.isFinite(factor) || factor <= 0) return 1;
  return DESKTOP_TEXT_SIZE_DEFAULT / factor;
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
