// One reading a day, in order (C20 in the competitive build plan,
// 2026-09-30). The first Something to Read card on Home is no longer a
// random pick: it walks through the reading for the person's conditions in
// the order the Conditions lens on Life lays it out, one entry a day, and
// remembers where it got to.
//
// HOW IT MOVES
//
//   - The order is each condition's topics as the lens shows them, the
//     condition's closing entry last. With more than one condition the
//     conditions take turns, one entry each, so nobody reads a hundred
//     entries about one before reaching the other.
//   - A declared healing stage puts that condition's Healing Stages topic
//     first, since it is the part written for where the person is now.
//   - With no condition chosen, the order is Health Literacy, so the card
//     is there for somebody who came for something other than a condition.
//   - The day's entry stays the same all day. It moves on the next day
//     only once it has been opened. A day the app is not used, or a day
//     the card is not opened, costs nothing: the same entry is waiting.
//   - Once every entry has been opened the order starts again from the top.
//
// Nothing here counts days, keeps a run going or says anything was missed.
// No I/O and no React, so scripts/test_daily_reading.js checks it directly.

export type ReadingShelf = {
  /** The category key, only used to keep shelves apart. */
  key: string;
  /** Topic labels in lens order, each with its entry ids in lens order. */
  topics: { label: string; ids: string[] }[];
  /** The condition's closing entry, read last. */
  closingId: string | null;
  /** Whether a healing stage is declared for this condition. */
  stageDeclared: boolean;
};

export const HEALING_STAGES_TOPIC = 'Healing Stages';

function isStageTopic(label: string): boolean {
  return label === HEALING_STAGES_TOPIC || label.startsWith(HEALING_STAGES_TOPIC + '::');
}

/** One shelf's entries in reading order. */
export function shelfOrder(shelf: ReadingShelf): string[] {
  const topics = shelf.stageDeclared
    ? [...shelf.topics.filter((t) => isStageTopic(t.label)), ...shelf.topics.filter((t) => !isStageTopic(t.label))]
    : shelf.topics;
  const ids = topics.flatMap((t) => t.ids);
  if (shelf.closingId) ids.push(shelf.closingId);
  return ids;
}

/** Every shelf taking turns, one entry each, with no entry twice. */
export function buildReadingOrder(shelves: ReadingShelf[]): string[] {
  const lists = shelves.map(shelfOrder);
  const seen = new Set<string>();
  const order: string[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let index = 0; index < longest; index += 1) {
    for (const list of lists) {
      const id = list[index];
      if (id !== undefined && !seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
    }
  }
  return order;
}

export type DailyReadingState = {
  /** The local day the entry below was chosen for, YYYY-MM-DD. */
  day: string;
  /** The entry on the card. */
  id: string;
  /** Every entry opened from the card since the order last started over. */
  opened: string[];
};

export function parseDailyReadingState(text: string | null | undefined): DailyReadingState | null {
  if (!text) return null;
  try {
    const value = JSON.parse(text) as Partial<DailyReadingState> | null;
    if (!value || typeof value.day !== 'string' || typeof value.id !== 'string') return null;
    const opened = Array.isArray(value.opened) ? value.opened.filter((id): id is string => typeof id === 'string') : [];
    return { day: value.day, id: value.id, opened };
  } catch {
    return null;
  }
}

/**
 * The entry for `today`, and the state to keep. `changed` says whether the
 * state needs writing back. Null id only when the order is empty.
 */
export function todaysReading(
  order: string[],
  state: DailyReadingState | null,
  today: string,
): { id: string | null; state: DailyReadingState | null; changed: boolean } {
  if (order.length === 0) return { id: null, state, changed: false };
  const inOrder = new Set(order);
  const opened = (state?.opened ?? []).filter((id) => inOrder.has(id));

  if (state && inOrder.has(state.id)) {
    // Still today's, or never opened: it stays on the card.
    if (state.day === today) return { id: state.id, state, changed: false };
    if (!opened.includes(state.id)) {
      const next = { day: today, id: state.id, opened };
      return { id: state.id, state: next, changed: true };
    }
  }

  let id = order.find((candidate) => !opened.includes(candidate));
  let keptOpened = opened;
  if (id === undefined) {
    // Everything has been opened: start again from the top.
    keptOpened = [];
    id = order[0];
  }
  return { id, state: { day: today, id, opened: keptOpened }, changed: true };
}

/** The state after the card's entry was opened. */
export function markReadingOpened(state: DailyReadingState, id: string): DailyReadingState {
  if (state.id !== id || state.opened.includes(id)) return state;
  return { ...state, opened: [...state.opened, id] };
}
