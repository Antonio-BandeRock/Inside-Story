// Bed layout drawn to scale (I8, 2026-10-02). A garden area with a length
// and a width becomes a plan, and each planting can be given a patch on it.
// Positions are kept in centimetres whatever unit the area is measured in,
// so changing an area between feet and metres moves nothing. The grid is
// 10 cm for an area measured in metres and half a foot for one measured in
// feet. Every sentence about a patch is a caption: how much room it covers,
// about how many plants fit at the closest spacing its crop guide gives, and
// whether it overlaps another patch. Nothing here stops a placement.
//
// Pure, no React and no database, so scripts/test_bed_layout.js can check
// the arithmetic and every sentence without a phone.

export type LayoutUnit = 'feet' | 'meters';

/** One patch on the plan, in centimetres from the top left corner. */
export type LayoutPatch = {
  plantingId: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Spacing = { lowCm: number; highCm: number };

const CM_PER_FOOT = 30.48;

export function unitToCm(value: number, unit: LayoutUnit): number {
  return unit === 'feet' ? value * CM_PER_FOOT : value * 100;
}

export function cmToUnit(cm: number, unit: LayoutUnit): number {
  return unit === 'feet' ? cm / CM_PER_FOOT : cm / 100;
}

/** One grid square, in centimetres. */
export function gridStepCm(unit: LayoutUnit): number {
  return unit === 'feet' ? CM_PER_FOOT / 2 : 10;
}

/** The area's length (across) and width (down), in centimetres, or null
 *  when either is missing or not above zero. */
export function areaSizeCm(length: number | null, width: number | null, unit: LayoutUnit | null): { across: number; down: number } | null {
  if (!length || !width || length <= 0 || width <= 0) return null;
  const u = unit ?? 'meters';
  return { across: unitToCm(length, u), down: unitToCm(width, u) };
}

/** The plant spacing a crop guide's sentence gives, in centimetres: the
 *  first figure or range followed by cm or metres. "45 to 60 cm apart"
 *  reads as 45 to 60; "From 1.5 metres for dwarf rootstocks to 6" reads as
 *  150; "One plant fills a large pot" gives nothing. */
export function parseSpacing(text: string | null | undefined): Spacing | null {
  if (!text) return null;
  const match = /(\d+(?:\.\d+)?)(?:\s*to\s*(\d+(?:\.\d+)?))?\s*(cm|centimetres?|metres?|m)\b/i.exec(text);
  if (!match) return null;
  const factor = /^c/i.test(match[3]) ? 1 : 100;
  const low = parseFloat(match[1]) * factor;
  const high = match[2] ? parseFloat(match[2]) * factor : low;
  if (!(low > 0)) return null;
  return { lowCm: low, highCm: Math.max(low, high) };
}

/** Snap a length in centimetres to the nearest grid square, never below one. */
export function snapToGrid(cm: number, step: number): number {
  return Math.max(step, Math.round(cm / step) * step);
}

/** Snap a position down to the grid square it falls in. */
export function snapPosition(cm: number, step: number): number {
  return Math.max(0, Math.floor(cm / step) * step);
}

/** Keep a patch inside the area: shrink it to fit, then move it in. */
export function clampPatch(patch: LayoutPatch, across: number, down: number): LayoutPatch {
  const w = Math.min(patch.w, across);
  const h = Math.min(patch.h, down);
  const x = Math.min(Math.max(0, patch.x), across - w);
  const y = Math.min(Math.max(0, patch.y), down - h);
  return { ...patch, x, y, w, h };
}

/** A new patch at a tapped point: one plant's room square, rounded up to
 *  the grid, or a single grid square when the guide gives no spacing. */
export function newPatch(plantingId: string, atX: number, atY: number, spacing: Spacing | null, step: number, across: number, down: number): LayoutPatch {
  const side = spacing ? Math.max(step, Math.ceil(spacing.lowCm / step) * step) : step;
  return clampPatch({ plantingId, x: snapPosition(atX, step), y: snapPosition(atY, step), w: side, h: side }, across, down);
}

/** Where plants go in a patch at the given spacing: rows and columns
 *  spaced evenly, centred. Empty when the patch is narrower than one plant
 *  needs on either side. */
export function plantPoints(patch: LayoutPatch, spacingCm: number): { x: number; y: number }[] {
  if (!(spacingCm > 0)) return [];
  const cols = Math.floor(patch.w / spacingCm + 1e-6);
  const rows = Math.floor(patch.h / spacingCm + 1e-6);
  if (cols === 0 || rows === 0) return [];
  const gapX = (patch.w - cols * spacingCm) / 2;
  const gapY = (patch.h - rows * spacingCm) / 2;
  const points: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      points.push({ x: patch.x + gapX + spacingCm * (c + 0.5), y: patch.y + gapY + spacingCm * (r + 0.5) });
    }
  }
  return points;
}

export function patchesOverlap(a: LayoutPatch, b: LayoutPatch): boolean {
  const eps = 1e-6;
  return a.x < b.x + b.w - eps && b.x < a.x + a.w - eps && a.y < b.y + b.h - eps && b.y < a.y + a.h - eps;
}

/** The top patch under a tapped point, last drawn first, or null. */
export function patchAt(patches: readonly LayoutPatch[], x: number, y: number): LayoutPatch | null {
  for (let i = patches.length - 1; i >= 0; i--) {
    const p = patches[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p;
  }
  return null;
}

/** A length in the area's unit, rounded for reading: "45 cm", "1.2 m",
 *  "1.5 ft". Centimetres below a metre, so a patch reads the way a seed
 *  packet does. */
export function formatLength(cm: number, unit: LayoutUnit): string {
  if (unit === 'feet') {
    const ft = cm / CM_PER_FOOT;
    return `${trim(ft, 1)} ft`;
  }
  return cm < 100 ? `${Math.round(cm)} cm` : `${trim(cm / 100, 2)} m`;
}

function trim(value: number, places: number): string {
  return String(Number(value.toFixed(places)));
}

/** A spacing as the guide puts it, in the area's unit. */
export function formatSpacing(spacing: Spacing, unit: LayoutUnit): string {
  const low = formatLength(spacing.lowCm, unit);
  if (spacing.highCm === spacing.lowCm) return low;
  return `${low.replace(/ (cm|m|ft)$/, '')} to ${formatLength(spacing.highCm, unit)}`;
}

/** The sentences under a selected patch. */
export function describePatch(input: {
  patch: LayoutPatch;
  unit: LayoutUnit;
  spacing: Spacing | null;
  overlapsWith: readonly string[];
}): string[] {
  const { patch, unit, spacing, overlapsWith } = input;
  const lines = [`Covers ${formatLength(patch.w, unit)} across by ${formatLength(patch.h, unit)} down.`];
  if (spacing) {
    const count = plantPoints(patch, spacing.lowCm).length;
    const apart = formatLength(spacing.lowCm, unit);
    lines.push(
      count === 0
        ? `Smaller than the ${apart} its growing guide gives for one plant.`
        : `Room for about ${count} ${count === 1 ? 'plant' : 'plants'} at ${apart} apart, the closest its growing guide gives (${formatSpacing(spacing, unit)}).`,
    );
  } else {
    lines.push('Its growing guide gives no spacing in centimetres or metres, so no plants are counted.');
  }
  if (overlapsWith.length > 0) lines.push(`Overlaps ${joinNames(overlapsWith)}.`);
  return lines;
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** How a plan fits on screen: pixels per centimetre for the room given,
 *  with the plan never drawn taller than `maxHeight`. */
export function planScale(across: number, down: number, roomWidth: number, maxHeight: number): number {
  if (!(across > 0) || !(down > 0) || !(roomWidth > 0)) return 0;
  return Math.min(roomWidth / across, maxHeight / down);
}

/** How many grid squares between drawn lines, so a large area is not a
 *  solid block of lines: at most about 40 lines each way. */
export function gridLineEvery(lengthCm: number, step: number): number {
  const squares = lengthCm / step;
  if (squares <= 40) return 1;
  for (const every of [2, 5, 10, 20, 50, 100]) {
    if (squares / every <= 40) return every;
  }
  return 200;
}

export const LAYOUT_INTRO =
  'Drawn to scale from the length and width of this area. Pick a planting below, then tap the plan where it goes. Dots show about where plants sit at the closest spacing its growing guide gives.';

export const LAYOUT_NO_SIZE = 'Give this area a length and a width and it can be drawn to scale, with each planting given its patch.';

export const LAYOUT_PAST_NOTE = 'Outlines show where earlier plantings in this area sat, which helps when moving a crop family on.';
