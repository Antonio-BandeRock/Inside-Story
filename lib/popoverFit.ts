// How wide a PopoverSelect list opens, and how tall its rows are, so every
// option reads in full.
//
// 2026-09-29, direct report about Horticulture's "What do you see?" list:
// "the menu isn't wide enough to see the entirety of each selection," then
// "make sure that the fix is applied to all menus like it." The list used to
// open at a fixed 160 dp with each row cut to one line, which is right for
// "Diced" and wrong for "Something wrong with the fruit, pods, heads or roots
// you eat". Two changes, both here so node can check them without a phone
// (scripts/test_popover_fit.js):
//
// 1. The list widens to its longest option, estimated from the character
//    count at the text size the phone is set to, up to POPOVER_MAX_WIDTH and
//    never past the window less a margin each side. A caller's `width` is a
//    floor, so nothing that opened wider before opens narrower now.
// 2. A row that still does not fit wraps onto a second line rather than
//    being cut off, and the list is as tall as its wrapped rows. The
//    estimate only decides where the list sits before it is drawn; the drawn
//    height replaces it at once (onContentSizeChange in PopoverSelect).
//
// An estimate that runs short costs a wrapped line, never a hidden word,
// which is why a character-count estimate is enough here.

export const POPOVER_MIN_WIDTH = 160;
// Wide enough for any option in the app on one or two lines, narrow enough
// that a list on a computer window still reads as a list beside its field.
export const POPOVER_MAX_WIDTH = 360;
export const POPOVER_SCREEN_MARGIN = 12;
export const POPOVER_ROW_HEIGHT = 38;
export const POPOVER_ROW_PADDING_H = 12;
export const POPOVER_ROW_PADDING_V = 8;
// Average advance of a character in the system sans-serif at 1 dp of font
// size, measured across ordinary English option text (capitals, spaces and
// punctuation included). Rounded up a little so a borderline row wraps
// rather than overflowing.
const AVERAGE_CHAR_WIDTH = 0.56;

export type TextMetrics = { fontSize: number; lineHeight?: number; letterSpacing?: number; fontScale: number };

export function estimateTextWidth(text: string, metrics: TextMetrics): number {
  const chars = [...text].length;
  const scale = metrics.fontScale || 1;
  return chars * (metrics.fontSize * AVERAGE_CHAR_WIDTH + (metrics.letterSpacing ?? 0)) * scale;
}

export function popoverListWidth(requested: number, labels: string[], windowWidth: number, metrics: TextMetrics): number {
  const room = Math.max(POPOVER_MIN_WIDTH, windowWidth - POPOVER_SCREEN_MARGIN * 2);
  const longest = labels.reduce((max, label) => Math.max(max, estimateTextWidth(label, metrics)), 0);
  // Two sides of row padding plus the popover's 1 dp border each side.
  const wanted = Math.ceil(longest + POPOVER_ROW_PADDING_H * 2 + 2);
  const floor = Math.max(requested, POPOVER_MIN_WIDTH);
  return Math.min(room, Math.max(floor, Math.min(POPOVER_MAX_WIDTH, wanted)));
}

function lineHeightOf(metrics: TextMetrics): number {
  return (metrics.lineHeight ?? metrics.fontSize * 1.35) * (metrics.fontScale || 1);
}

export function estimateRowHeight(label: string, listWidth: number, metrics: TextMetrics): number {
  const textRoom = Math.max(1, listWidth - POPOVER_ROW_PADDING_H * 2 - 2);
  const lines = Math.max(1, Math.ceil(estimateTextWidth(label, metrics) / textRoom));
  return Math.max(POPOVER_ROW_HEIGHT, Math.ceil(lines * lineHeightOf(metrics) + POPOVER_ROW_PADDING_V * 2));
}

// Rows up to `maxRows` single-line rows' worth of height, then the list
// scrolls. `measured` is the drawn content height once there is one.
export function popoverListHeight(
  labels: string[],
  listWidth: number,
  metrics: TextMetrics,
  maxRows: number,
  measured: number | null,
  padding: number,
): number {
  const cap = maxRows * Math.max(POPOVER_ROW_HEIGHT, Math.ceil(lineHeightOf(metrics) + POPOVER_ROW_PADDING_V * 2));
  const content =
    measured ?? (labels.length === 0 ? POPOVER_ROW_HEIGHT : labels.reduce((sum, label) => sum + estimateRowHeight(label, listWidth, metrics), 0));
  return Math.min(cap, content) + padding * 2;
}
