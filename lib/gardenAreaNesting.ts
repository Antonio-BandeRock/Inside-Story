// Garden areas inside other areas (2026-09-28, 1.0.55.33).
//
// Asked for directly: "in a room, it could be segregated into multiple
// areas with their own light, or even be 1 of many tents within a room and
// each have their own ventilations, heating and cooling systems."
//
// So an area can stand inside another one: a tent in a grow room, a shelf
// in a tent, a section of a greenhouse, a bed in a walled garden. Each keeps
// everything an area already has (its Grow Setup of lights, fans, exhaust,
// heaters and air conditioning, its measuring plan, readings, plantings and
// costs), and the room it stands in keeps its own too, so the air in the
// room and the air in each tent are separate figures.
//
// garden_plots.inside_plot_id names the area it stands in, or is null for an
// area standing on its own. Nesting can go as deep as the person likes. An
// area can never be put inside itself or inside anything already inside it.
//
// Removing: an area with areas still in use inside it cannot go to Past
// Areas until each of those is moved into another area or to Past Areas
// itself, the same way an area with a grow still going cannot. An area with
// any area inside it, current or past, is never deleted, since those areas
// name it. Nothing here writes to the database.

export type NestableArea = {
  id: string;
  name: string;
  insidePlotId: string | null;
  archivedAt?: string | null;
};

/** The separator between an area and the one it stands in. */
export const PATH_SEPARATOR = ' › ';

/** Deepest nesting followed when reading a path, so a loop written by two
 *  devices at once can never hang the app. */
const MAX_DEPTH = 12;

/** The chain of areas from the outermost down to this one. An area whose
 *  parent is not in the list (removed on another device) starts the chain,
 *  and a loop is cut where it repeats. */
export function areaChain<T extends NestableArea>(id: string, areas: T[]): T[] {
  const byId = new Map(areas.map((area) => [area.id, area]));
  const chain: T[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id) && chain.length < MAX_DEPTH) {
    chain.unshift(current);
    seen.add(current.id);
    current = current.insidePlotId ? byId.get(current.insidePlotId) : undefined;
  }
  return chain;
}

/** "Grow room › Tent 2", or the plain name for an area standing on its
 *  own. `areas` should include past areas, so a tent whose room has gone to
 *  Past Areas still reads under the room's name. */
export function areaPath(id: string, areas: NestableArea[]): string {
  const chain = areaChain(id, areas);
  if (chain.length === 0) return areas.find((area) => area.id === id)?.name ?? '';
  return chain.map((area) => area.name).join(PATH_SEPARATOR);
}

/** How many areas this one stands inside. */
export function areaDepth(id: string, areas: NestableArea[]): number {
  return Math.max(0, areaChain(id, areas).length - 1);
}

/** Every area inside this one, at any depth. */
export function areasWithin<T extends NestableArea>(id: string, areas: T[]): T[] {
  const out: T[] = [];
  const seen = new Set<string>([id]);
  let frontier = [id];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const area of areas) {
      if (area.insidePlotId && frontier.includes(area.insidePlotId) && !seen.has(area.id)) {
        seen.add(area.id);
        out.push(area);
        next.push(area.id);
      }
    }
    frontier = next;
  }
  return out;
}

/** The areas directly inside this one that are still in use. */
export function currentAreasDirectlyInside<T extends NestableArea>(id: string, areas: T[]): T[] {
  return areas.filter((area) => area.insidePlotId === id && !area.archivedAt);
}

/** Whether `id` may be put inside `insideId`: never itself, never anything
 *  already inside it, and never an area in Past Areas. */
export function canStandInside(id: string | null, insideId: string, areas: NestableArea[]): boolean {
  const target = areas.find((area) => area.id === insideId);
  if (!target || target.archivedAt) return false;
  if (id === null) return true;
  if (id === insideId) return false;
  return !areasWithin(id, areas).some((area) => area.id === insideId);
}

/** The areas an area may be put inside, by path, for a picker. `id` is null
 *  for an area not saved yet. */
export function insideChoices(id: string | null, areas: NestableArea[]): { label: string; value: string }[] {
  return areas
    .filter((area) => canStandInside(id, area.id, areas))
    .map((area) => ({ label: areaPath(area.id, areas), value: area.id }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Areas in the order a list reads them: each area followed directly by
 *  the areas inside it, siblings keeping the order they came in. An area
 *  whose parent is not in the list is treated as standing on its own. */
export function nestedOrder<T extends NestableArea>(areas: T[]): T[] {
  const present = new Set(areas.map((area) => area.id));
  const out: T[] = [];
  const placed = new Set<string>();
  const place = (area: T, depth: number) => {
    if (placed.has(area.id) || depth > MAX_DEPTH) return;
    placed.add(area.id);
    out.push(area);
    for (const child of areas) {
      if (child.insidePlotId === area.id) place(child, depth + 1);
    }
  };
  for (const area of areas) {
    if (!area.insidePlotId || !present.has(area.insidePlotId)) place(area, 0);
  }
  // Anything left is in a loop; it is listed rather than lost.
  for (const area of areas) place(area, 0);
  return out;
}

/** Why an area cannot go to Past Areas yet because of areas still in use
 *  inside it, or null when nothing inside it holds it back. */
export function insideAreaBlocker(id: string, areas: NestableArea[]): string | null {
  const inside = currentAreasDirectlyInside(id, areas).map((area) => area.name).sort((a, b) => a.localeCompare(b));
  if (inside.length === 0) return null;
  const names =
    inside.length === 1 ? inside[0] : `${inside.slice(0, -1).join(', ')} and ${inside[inside.length - 1]}`;
  const verb = inside.length === 1 ? 'is' : 'are';
  return `${names} ${verb} still inside this area. Set ${inside.length === 1 ? 'it' : 'each'} inside another area, or move ${inside.length === 1 ? 'it' : 'each'} to Past Areas, and then this area can go there too.`;
}

/** The words an area's Inside picker shows for standing on its own. */
export const ON_ITS_OWN = 'Not inside another area';
