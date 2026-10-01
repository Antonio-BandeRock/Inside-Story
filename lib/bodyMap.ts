// The body map (D11 in the competitive build plan, 2026-09-30): where on
// the body a flare or a food reaction was, marked on a front and a back
// outline. Signals' flare and food reaction forms and the flare question of
// the one-at-a-time check-in write it to checkin_body_regions; Trends >
// Symptoms & Flares reads it.
//
// HOW IT BEHAVES
//
//   - Left and right are the person's own left and right, on both views.
//     On the front view their left is drawn on the viewer's right, the way
//     a body faces somebody looking at it; on the back view it is drawn on
//     the viewer's left.
//   - An area is a place, nothing more. No area is linked to an organ, a
//     condition or a cause, and nothing here says what a place means.
//   - An entry with no area marked is "not marked", never "nothing wrong".
//
// The drawing is a set of plain shapes in a 120 by 260 box, so the same
// geometry draws on a phone and on the desktop. No I/O and no React, so
// scripts/test_body_map.js checks it directly.

export type BodyView = 'front' | 'back';
export type BodySide = 'left' | 'right';

export type BodyShape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number };

export type BodyRegion = {
  key: string;
  label: string;
  /** Which outline it is drawn on. */
  views: BodyView[];
  side: BodySide | null;
};

export const BODY_BOX = { width: 120, height: 260 };

type Base = { key: string; label: string; views: BodyView[]; shape: BodyShape };

// Areas on the middle line, drawn where they stand.
const MIDDLE: Base[] = [
  { key: 'head', label: 'Head and face', views: ['front'], shape: { kind: 'ellipse', cx: 60, cy: 20, rx: 13, ry: 16 } },
  { key: 'throat', label: 'Throat and front of the neck', views: ['front'], shape: { kind: 'rect', x: 54, y: 36, w: 12, h: 8 } },
  { key: 'chest', label: 'Chest', views: ['front'], shape: { kind: 'rect', x: 40, y: 44, w: 40, h: 30 } },
  { key: 'upper_abdomen', label: 'Upper belly', views: ['front'], shape: { kind: 'rect', x: 42, y: 74, w: 36, h: 18 } },
  { key: 'lower_abdomen', label: 'Lower belly', views: ['front'], shape: { kind: 'rect', x: 42, y: 92, w: 36, h: 18 } },
  { key: 'pelvis', label: 'Pelvis and groin', views: ['front'], shape: { kind: 'rect', x: 47, y: 110, w: 26, h: 14 } },
  { key: 'back_of_head', label: 'Back of the head', views: ['back'], shape: { kind: 'ellipse', cx: 60, cy: 20, rx: 13, ry: 16 } },
  { key: 'back_of_neck', label: 'Back of the neck', views: ['back'], shape: { kind: 'rect', x: 54, y: 36, w: 12, h: 8 } },
  { key: 'upper_back', label: 'Upper back', views: ['back'], shape: { kind: 'rect', x: 40, y: 44, w: 40, h: 26 } },
  { key: 'middle_back', label: 'Middle back', views: ['back'], shape: { kind: 'rect', x: 42, y: 70, w: 36, h: 22 } },
  { key: 'lower_back', label: 'Lower back', views: ['back'], shape: { kind: 'rect', x: 42, y: 92, w: 36, h: 20 } },
  { key: 'buttocks', label: 'Buttocks', views: ['back'], shape: { kind: 'rect', x: 42, y: 112, w: 36, h: 16 } },
];

// Paired areas, each given once as drawn on the viewer's left half of the
// box. The same shape mirrored is the other side.
const PAIRED: Base[] = [
  { key: 'shoulder', label: 'shoulder', views: ['front', 'back'], shape: { kind: 'ellipse', cx: 34, cy: 50, rx: 8, ry: 7 } },
  { key: 'upper_arm', label: 'upper arm', views: ['front', 'back'], shape: { kind: 'rect', x: 23, y: 57, w: 12, h: 26 } },
  { key: 'elbow', label: 'elbow', views: ['front', 'back'], shape: { kind: 'ellipse', cx: 28, cy: 88, rx: 6, ry: 6 } },
  { key: 'forearm', label: 'forearm', views: ['front', 'back'], shape: { kind: 'rect', x: 19, y: 94, w: 12, h: 25 } },
  { key: 'wrist', label: 'wrist', views: ['front', 'back'], shape: { kind: 'rect', x: 17, y: 119, w: 12, h: 6 } },
  { key: 'hand', label: 'hand', views: ['front', 'back'], shape: { kind: 'ellipse', cx: 22, cy: 134, rx: 7, ry: 9 } },
  { key: 'hip', label: 'hip', views: ['front'], shape: { kind: 'ellipse', cx: 41, cy: 118, rx: 6, ry: 8 } },
  { key: 'thigh', label: 'thigh', views: ['front'], shape: { kind: 'rect', x: 43, y: 128, w: 15, h: 38 } },
  { key: 'knee', label: 'knee', views: ['front'], shape: { kind: 'ellipse', cx: 50, cy: 172, rx: 7, ry: 7 } },
  { key: 'shin', label: 'shin', views: ['front'], shape: { kind: 'rect', x: 44, y: 180, w: 12, h: 40 } },
  { key: 'back_of_thigh', label: 'back of the thigh', views: ['back'], shape: { kind: 'rect', x: 43, y: 130, w: 15, h: 36 } },
  { key: 'back_of_knee', label: 'back of the knee', views: ['back'], shape: { kind: 'ellipse', cx: 50, cy: 172, rx: 7, ry: 7 } },
  { key: 'calf', label: 'calf', views: ['back'], shape: { kind: 'rect', x: 44, y: 180, w: 12, h: 40 } },
  { key: 'ankle', label: 'ankle', views: ['front', 'back'], shape: { kind: 'rect', x: 44, y: 220, w: 12, h: 7 } },
  { key: 'foot', label: 'foot', views: ['front'], shape: { kind: 'ellipse', cx: 49, cy: 235, rx: 9, ry: 6 } },
  { key: 'heel', label: 'heel', views: ['back'], shape: { kind: 'ellipse', cx: 50, cy: 233, rx: 7, ry: 5 } },
];

function mirror(shape: BodyShape): BodyShape {
  return shape.kind === 'ellipse'
    ? { ...shape, cx: BODY_BOX.width - shape.cx }
    : { ...shape, x: BODY_BOX.width - shape.x - shape.w };
}

function sideLabel(side: BodySide, label: string): string {
  // "back of the thigh" reads "Back of the left thigh".
  if (label.startsWith('back of the ')) return `Back of the ${side} ${label.slice('back of the '.length)}`;
  return `${side === 'left' ? 'Left' : 'Right'} ${label}`;
}

export const BODY_REGIONS: BodyRegion[] = [
  ...MIDDLE.map(({ key, label, views }) => ({ key, label, views, side: null })),
  ...PAIRED.flatMap(({ key, label, views }) =>
    (['left', 'right'] as BodySide[]).map((side) => ({ key: `${side}_${key}`, label: sideLabel(side, label), views, side })),
  ),
];

const REGION_BY_KEY = new Map(BODY_REGIONS.map((region) => [region.key, region]));

export function isBodyRegion(key: string): boolean {
  return REGION_BY_KEY.has(key);
}

/** The words for an area, or the stored key itself for one no longer listed. */
export function regionLabel(key: string): string {
  return REGION_BY_KEY.get(key)?.label ?? key;
}

/**
 * Every shape to draw on one view, with the area it belongs to. On the
 * front view the person's right is on the viewer's left; on the back
 * view their left is.
 */
export function shapesFor(view: BodyView): { key: string; shape: BodyShape }[] {
  const out: { key: string; shape: BodyShape }[] = [];
  for (const base of MIDDLE) if (base.views.includes(view)) out.push({ key: base.key, shape: base.shape });
  for (const base of PAIRED) {
    if (!base.views.includes(view)) continue;
    const onViewerLeft: BodySide = view === 'front' ? 'right' : 'left';
    const onViewerRight: BodySide = onViewerLeft === 'left' ? 'right' : 'left';
    out.push({ key: `${onViewerLeft}_${base.key}`, shape: base.shape });
    out.push({ key: `${onViewerRight}_${base.key}`, shape: mirror(base.shape) });
  }
  return out;
}

/** The areas listed for picking by name, one view at a time, in drawing order. */
export function regionsFor(view: BodyView): BodyRegion[] {
  const keys = new Set(shapesFor(view).map((item) => item.key));
  return BODY_REGIONS.filter((region) => keys.has(region.key));
}

export function toggleRegion(selected: string[], key: string): string[] {
  return selected.includes(key) ? selected.filter((each) => each !== key) : [...selected, key];
}

/** "Left knee, Lower back", in the order they were marked. */
export function regionsSentence(keys: string[]): string {
  return keys.map(regionLabel).join(', ');
}

export const SIDES_NOTE = 'Left and right are your left and right, on both views.';

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

export type MarkedEntry = { loggedAt: string; regions: string[] };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDay(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "Areas marked on 4 of 9 entries. The other 5 have none marked." */
export function markedSentence(entries: MarkedEntry[]): string {
  if (entries.length === 0) return 'No flares or reactions logged in this range.';
  const marked = entries.filter((entry) => entry.regions.length > 0).length;
  if (marked === 0) return entries.length === 1 ? 'No area marked on the one entry in this range.' : `No area marked on any of the ${entries.length} entries in this range.`;
  const noun = entries.length === 1 ? 'entry' : 'entries';
  const rest = entries.length - marked;
  const tail = rest === 0 ? '' : rest === 1 ? ' The other one has none marked.' : ` The other ${rest} have none marked.`;
  return `Areas marked on ${marked} of ${entries.length} ${noun}.${tail}`;
}

/**
 * Each area marked in the range, with the days it was marked on, most
 * days first and then in list order. A day counts once however many
 * entries that day marked the area.
 */
export function regionDays(entries: MarkedEntry[]): { key: string; label: string; days: string[]; display: string }[] {
  const byRegion = new Map<string, Set<string>>();
  for (const entry of entries) {
    const day = entry.loggedAt.slice(0, 10);
    for (const key of entry.regions) {
      const days = byRegion.get(key) ?? new Set<string>();
      days.add(day);
      byRegion.set(key, days);
    }
  }
  const order = (key: string) => {
    const index = BODY_REGIONS.findIndex((region) => region.key === key);
    return index < 0 ? BODY_REGIONS.length : index;
  };
  return [...byRegion.entries()]
    .map(([key, set]) => {
      const days = [...set].sort();
      const shown = days.slice(-4).map(shortDay).join(', ');
      const more = days.length > 4 ? `, and ${days.length - 4} earlier` : '';
      return {
        key,
        label: regionLabel(key),
        days,
        display: `${days.length === 1 ? 'one day' : `${days.length} days`}: ${shown}${more}`,
      };
    })
    .sort((a, b) => b.days.length - a.days.length || order(a.key) - order(b.key));
}
