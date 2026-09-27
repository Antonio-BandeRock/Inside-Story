// The grocery list laid out the way one store is laid out (G6 of the
// competitive build plan, Phase 2, 2026-09-26). Every line already carries
// the reference category it came from (Vegetables, Dairy & Eggs and so on),
// and that category is what gets placed in an aisle. A store is an open list
// the person names, its aisles are an open list the person names and orders,
// and each category sits in at most one aisle of each store.
//
// Nothing here is required. A list with no store, or a store nobody has
// arranged, groups by category exactly as it always has, and a category no
// aisle holds keeps its own heading after the aisles rather than being
// swept into a catch-all.
//
// Pure: no database and no React, so scripts/test_grocery_aisles.js can check
// it directly.

export type GroceryAisle = { id: string; name: string; position: number };

export type GroceryStoreLayout = {
  aisles: GroceryAisle[];
  /** Category (as stored on the line) to the id of the aisle holding it. */
  placements: Record<string, string>;
};

export type GroceryAisleSection<T> = {
  key: string;
  title: string;
  /** Which categories an aisle holds, when it holds more than one. */
  caption: string | null;
  items: T[];
};

/** Categories are matched without regard to case or surrounding spaces. */
export function categoryKey(category: string): string {
  return category.trim().toLowerCase();
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function placementIndex(layout: GroceryStoreLayout | null): Map<string, string> {
  const index = new Map<string, string>();
  if (!layout) return index;
  const known = new Set(layout.aisles.map((aisle) => aisle.id));
  for (const [category, aisleId] of Object.entries(layout.placements)) {
    if (known.has(aisleId)) index.set(categoryKey(category), aisleId);
  }
  return index;
}

/**
 * The list's lines grouped for walking the store. Aisles come first in the
 * order the person set, then any category no aisle holds under its own name
 * in alphabetical order, then `lastCategory` (what was added while shopping)
 * at the very end. Within a section, lines keep the order they came in.
 */
export function arrangeByAisle<T extends { category: string }>(
  items: T[],
  layout: GroceryStoreLayout | null,
  lastCategory: string | null = null,
): GroceryAisleSection<T>[] {
  const placements = placementIndex(layout);
  const aisles = layout ? [...layout.aisles].sort((a, b) => a.position - b.position || byName(a.name, b.name)) : [];
  const inAisle = new Map<string, { items: T[]; categories: string[] }>();
  const loose = new Map<string, { title: string; items: T[] }>();
  const last: T[] = [];
  const lastKey = lastCategory ? categoryKey(lastCategory) : null;

  for (const item of items) {
    const key = categoryKey(item.category);
    if (lastKey && key === lastKey) {
      last.push(item);
      continue;
    }
    const aisleId = placements.get(key);
    if (aisleId) {
      const bucket = inAisle.get(aisleId) ?? { items: [], categories: [] };
      bucket.items.push(item);
      if (!bucket.categories.some((existing) => categoryKey(existing) === key)) bucket.categories.push(item.category.trim());
      inAisle.set(aisleId, bucket);
      continue;
    }
    const bucket = loose.get(key) ?? { title: item.category.trim() || 'Other', items: [] };
    bucket.items.push(item);
    loose.set(key, bucket);
  }

  const sections: GroceryAisleSection<T>[] = [];
  for (const aisle of aisles) {
    const bucket = inAisle.get(aisle.id);
    if (!bucket) continue;
    const categories = [...bucket.categories].sort(byName);
    sections.push({
      key: `aisle:${aisle.id}`,
      title: aisle.name,
      caption: categories.length > 1 || categoryKey(categories[0]) !== categoryKey(aisle.name) ? categories.join(', ') : null,
      items: bucket.items,
    });
  }
  const looseSections = Array.from(loose.entries()).sort((a, b) => byName(a[1].title, b[1].title));
  for (const [key, bucket] of looseSections) {
    sections.push({ key: `category:${key}`, title: bucket.title, caption: null, items: bucket.items });
  }
  if (last.length > 0 && lastCategory) {
    sections.push({ key: `category:${lastKey}`, title: lastCategory, caption: null, items: last });
  }
  return sections;
}

/** Positions 0..n-1 after moving one aisle up (-1) or down (+1). */
export function moveAisle(aisles: GroceryAisle[], aisleId: string, direction: -1 | 1): GroceryAisle[] {
  const ordered = [...aisles].sort((a, b) => a.position - b.position || byName(a.name, b.name));
  const from = ordered.findIndex((aisle) => aisle.id === aisleId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ordered.length) return ordered.map((aisle, index) => ({ ...aisle, position: index }));
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  return ordered.map((aisle, index) => ({ ...aisle, position: index }));
}

export type AisleRemovalPlan = {
  /** Categories moving to the replacement aisle. */
  move: string[];
  /** Categories going back under their own headings. */
  release: string[];
  sentence: string;
};

/**
 * What removing an aisle does to the categories it holds. An aisle carries no
 * history (nothing is recorded against it), so it is deleted outright; what it
 * held goes to the aisle the person picks, or back under its own headings when
 * they pick none. Nothing is left pointing at an aisle that is gone.
 */
export function planAisleRemoval(
  layout: GroceryStoreLayout,
  aisleId: string,
  replacementId: string | null,
): AisleRemovalPlan {
  const held = Object.entries(layout.placements)
    .filter(([, id]) => id === aisleId)
    .map(([category]) => category)
    .sort(byName);
  const replacement = replacementId && replacementId !== aisleId
    ? layout.aisles.find((aisle) => aisle.id === replacementId) ?? null
    : null;
  const name = layout.aisles.find((aisle) => aisle.id === aisleId)?.name ?? 'This aisle';
  if (held.length === 0) {
    return { move: [], release: [], sentence: `${name} holds nothing, so it simply goes.` };
  }
  const count = `${held.length} ${held.length === 1 ? 'category' : 'categories'}`;
  if (replacement) {
    return { move: held, release: [], sentence: `The ${count} in ${name} ${held.length === 1 ? 'moves' : 'move'} to ${replacement.name}.` };
  }
  return { move: [], release: held, sentence: `The ${count} in ${name} ${held.length === 1 ? 'goes back under its category heading' : 'go back under their category headings'}.` };
}

/** Every category worth placing: those seen on lists plus those already placed. */
export function placeableCategories(seen: string[], layout: GroceryStoreLayout | null, lastCategory: string | null): string[] {
  const out = new Map<string, string>();
  const lastKey = lastCategory ? categoryKey(lastCategory) : null;
  for (const category of [...seen, ...Object.keys(layout?.placements ?? {})]) {
    const trimmed = category.trim();
    const key = categoryKey(trimmed);
    if (!trimmed || key === lastKey || out.has(key)) continue;
    out.set(key, trimmed);
  }
  return Array.from(out.values()).sort(byName);
}

/** "3 aisles arranged" or null when a store has none, for a store row's caption. */
export function describeStoreLayout(layout: GroceryStoreLayout | null): string | null {
  const count = layout?.aisles.length ?? 0;
  if (count === 0) return null;
  const placed = Object.keys(layout?.placements ?? {}).length;
  return `${count} ${count === 1 ? 'aisle' : 'aisles'}, ${placed} ${placed === 1 ? 'category' : 'categories'} placed`;
}

/** A store's name cleaned for comparing: two names differing only by case are one store. */
export function storeKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
