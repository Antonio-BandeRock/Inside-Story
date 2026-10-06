// Search near the thumb, 1.0.61.15 (2026-10-05). Direct request: "Search boxes
// at the top of a lens are the hardest thing to reach one-handed." A lens's
// search box (components/EntrySearchInput.tsx) registers here while its screen
// is the one showing, and the edge tab on the thumb side
// (components/ThumbSearchButton.tsx) appears only while something has. A tap
// asks that box to put its search into the app keyboard's own search row,
// which sits just above the keys at the bottom of the screen, so the words go
// in near the thumb and the list above narrows as they do.
//
// Only the screen on view keeps its boxes registered, since a box lets go when
// its screen loses focus. Where one screen has two (Horticulture's crop finder
// above its reading), the first to register, the one higher up, is used.
// No React here, so it can be read from anywhere.
type Entry = { id: number; open: () => void };

let entries: Entry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function registerThumbSearch(open: () => void): () => void {
  const entry = { id: nextId++, open };
  entries = [...entries, entry];
  emit();
  return () => {
    entries = entries.filter((e) => e.id !== entry.id);
    emit();
  };
}

export function hasThumbSearch(): boolean {
  return entries.length > 0;
}

export function openThumbSearch(): boolean {
  const entry = entries[0];
  if (!entry) return false;
  entry.open();
  return true;
}

export function subscribeThumbSearch(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
