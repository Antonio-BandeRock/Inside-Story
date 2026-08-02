// Groups a category's flat list of food names under a shared "kind of
// thing" header when 2+ of them share one -- 2026-08-02, explicitly
// requested: browsing "Dairy & Eggs" showed "Cheese, Mexican blend" and
// "Cheese, port de salut" nowhere near "Colby Cheese" and "Cottage
// Cheese" in a plain alphabetical list, even though a person browsing
// thinks of all four as "a kind of cheese." A food genuinely on its own
// (no sibling sharing a head word) stays a plain, ungrouped row -- exactly
// as asked ("if there are single items, they will be listed separately in
// their own grouping").
//
// Why this exists as a client-side, always-on grouping pass rather than a
// build-time database column: the underlying reason two spellings of "the
// same kind of thing" don't already sort together is real and structural,
// not a data bug to fix once -- scripts/natural_name_reorder.py (a real,
// separately hand-researched 635-line module, confirmed already wired
// into scripts/build_food_reference_db.py's own reorder_base_name() call)
// deliberately only reorders SIMPLE "Head, single-word-modifier" names
// ("Cheese, cheddar" -> "Cheddar Cheese") and leaves multi-clause ones
// ("Cheese, cheddar, natural, regular fat") in original comma form rather
// than guess wrong -- so the exact same kind of cheese can legitimately
// exist in both word orders across different source rows. Grouping at
// render time, on the name strings the app already has, means this stays
// correct automatically as the reference database changes, without a
// second data-generation pass to keep in sync with the first.
//
// Deliberately conservative, matching this whole project's own standing
// rule about guessing: a food only joins a group when its own name
// produces a candidate head word that at least one OTHER food in the same
// list also produces. Nothing is grouped on a hunch.

export type GroupedFoodEntry =
  | { type: 'header'; key: string; label: string }
  | { type: 'item'; label: string; value: string };

// Real connector/state words that end up as a name's first or last word
// often enough to be worth excluding explicitly -- grouping foods under
// "With" or "Raw" would be noise, not a useful section. Built up in two
// real passes against real data, 2026-08-02:
//   1. Testing against Dairy & Eggs (967 names) surfaced a 115-item false
//      "Matter" group from French "min. 20 % fat in dry matter" -style
//      fat-content phrasing repeating across many otherwise-unrelated
//      cheeses, and a smaller false "Fat" group the same way -- these
//      measurement/descriptor nouns end sentences constantly without ever
//      meaning "a kind of food" (row 2 below).
//   2. Testing against Meat (3,447 names, the largest category) surfaced
//      real cooking-method groups ("Broiled" -- 37 items, every one a
//      different beef cut broiled) and storage/state groups
//      ("Deep-frozen," "Skin," French "Cru" = raw) -- these describe HOW
//      a food is prepared/stored, not WHAT it is, and grouping "everything
//      that happens to be broiled" together is exactly the kind of noise
//      this feature is trying to avoid (row 3-4 below).
const GROUP_STOPWORDS = new Set([
  'with', 'without', 'and', 'or', 'in', 'of', 'the', 'a', 'an', 'raw', 'cooked', 'dried', 'fresh',
  'whole', 'ground', 'sliced', 'chopped', 'canned', 'frozen', 'prepared', 'unprepared',
  'matter', 'content', 'basis', 'weight', 'form', 'style', 'variety', 'grade', 'quality', 'type', 'class', 'fat',
  'broiled', 'roasted', 'grilled', 'fried', 'boiled', 'steamed', 'baked', 'smoked', 'braised', 'poached',
  'stewed', 'simmered', 'blanched', 'pickled', 'cured', 'deep-fried', 'pan-fried', 'air-fried',
  'deep-frozen', 'skin', 'skinless', 'boneless', 'trimmed', 'pasteurized', 'homogenized',
  'cru', 'crue', 'crus', 'crues', 'cuit', 'cuite', 'cuits', 'cuites',
  // Confirmed the same way testing against Veg (2,253 names): "Drained"
  // grouped artichokes, asparagus, aubergine, beansprouts, beetroot, and
  // black salsify together for no reason beyond all being post-canning
  // liquid state, not a shared food identity.
  'drained',
]);

function normalizeCandidate(word: string | undefined): string | null {
  if (!word) return null;
  // Strips trailing punctuation a last-word extraction can pick up
  // ("juice)" from a parenthetical, "fat." from an abbreviation-ending
  // sentence) -- the grouping key itself should never carry stray
  // symbols.
  const cleaned = word.replace(/[.,;:()%]+$/, '').replace(/^[.,;:()]+/, '').trim();
  if (cleaned.length < 3) return null;
  const lower = cleaned.toLowerCase();
  if (GROUP_STOPWORDS.has(lower)) return null;
  // A plain number ("2%") or unit-ish fragment isn't a real head word.
  if (/^\d/.test(lower)) return null;
  return lower;
}

// Every real candidate "this is the kind of thing" word a single food
// name could be grouped under, in priority order (see buildFoodNameGroups
// below for how ties/multiple matches are resolved):
//   1. The text before a top-level comma ("Cheese, cheddar" -> "cheese")
//      -- the most explicit signal already present in the source data.
//   2. The name's own last word ("Colby Cheese" -> "cheese") -- how a
//      "kind of X" kept in natural word order reads in English.
//   3. The name's own first word ("Chicken breast fillet" -> "chicken")
//      -- the OTHER natural English order, for names built around a base
//      ingredient/cut rather than a "kind of" relationship (matching
//      natural_name_reorder.py's own documented "anatomical/cut-of-meat
//      noun keeps original order" case).
function candidateKeys(name: string): string[] {
  const candidates: string[] = [];
  // A '%' occurring BEFORE a candidate's own extraction point is a
  // reliable sign that stretch of the name is a measurement clause ("min.
  // 20 % fat in dry matter," "1.5 % fat, with coffee") rather than a plain
  // "kind of X" phrase -- found testing against the real Dairy category,
  // where this caught both a 115-item false "Matter" group (edge-word
  // extraction) AND a smaller false "Fat" group hiding in the comma-key
  // path specifically ("Milk drink 1.5 % fat, with coffee, unsweetened"
  // -- comma-key extraction alone doesn't look past the % the way the
  // edge-word skip below does, so it needs its own equivalent guard).
  const commaIndex = name.indexOf(',');
  if (commaIndex > 0 && commaIndex < 40 && !name.slice(0, commaIndex).includes('%')) {
    const commaKey = normalizeCandidate(name.slice(0, commaIndex).trim().split(/\s+/).pop());
    if (commaKey) candidates.push(commaKey);
  }
  const hasPercent = name.includes('%');
  const words = name.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1 && !hasPercent) {
    const lastKey = normalizeCandidate(words[words.length - 1]);
    if (lastKey && !candidates.includes(lastKey)) candidates.push(lastKey);
    const firstKey = normalizeCandidate(words[0]);
    if (firstKey && !candidates.includes(firstKey)) candidates.push(firstKey);
  }
  return candidates;
}

function titleCase(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

// Builds the grouped/ungrouped display list for one category's own food
// names. Pure and synchronous -- cheap enough to run on every render of a
// list that's realistically a few hundred names at most (the same scale
// FoodLookup.tsx's own live search already filters over instantly).
export function buildFoodNameGroups(names: string[]): GroupedFoodEntry[] {
  // Pass 1: how many DISTINCT names produce each candidate key, across
  // every name's own candidate list (not just its top choice) -- a key
  // only becomes a real group once at least two different foods could
  // plausibly share it.
  const keyCounts = new Map<string, number>();
  const namesCandidates = names.map((name) => ({ name, candidates: candidateKeys(name) }));
  for (const { candidates } of namesCandidates) {
    for (const key of new Set(candidates)) {
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }

  // Pass 2: assign each name to its own highest-priority candidate key
  // that actually cleared the 2+ bar above; otherwise it stays ungrouped.
  const groups = new Map<string, string[]>();
  const ungrouped: string[] = [];
  for (const { name, candidates } of namesCandidates) {
    const chosenKey = candidates.find((key) => (keyCounts.get(key) ?? 0) >= 2);
    if (chosenKey) {
      const members = groups.get(chosenKey) ?? [];
      members.push(name);
      groups.set(chosenKey, members);
    } else {
      ungrouped.push(name);
    }
  }

  // Pass 2.5: keyCounts (pass 1) counts every name that COULD plausibly
  // use a key among its candidates, but a name only actually gets
  // assigned to its own highest-priority match -- e.g. "Crottin de
  // chèvre, au lait cru" counts toward both "chèvre" and "cru," but only
  // ever gets assigned to "chèvre" (comma-key wins priority over last-
  // word). A key that cleared 2+ in counting can still end up with only
  // one real assignee once every name's own higher-priority pick is
  // honored -- a lone header over one row reads worse than the same row
  // sitting as a plain ungrouped entry, so demote those back down.
  for (const [key, members] of [...groups]) {
    if (members.length < 2) {
      groups.delete(key);
      ungrouped.push(...members);
    }
  }

  // Pass 3: interleave headers and ungrouped singletons in one alphabetical
  // order (by the header's own label for a group, by the name itself for a
  // singleton), matching how the plain flat list already reads today --
  // grouping should make browsing easier to scan, not reshuffle the whole
  // list into an unfamiliar order.
  type SortableEntry = { sortKey: string; entries: GroupedFoodEntry[] };
  const sortable: SortableEntry[] = [];

  for (const [key, members] of groups) {
    const label = titleCase(key);
    const sortedMembers = [...members].sort((a, b) => a.localeCompare(b));
    sortable.push({
      sortKey: label,
      entries: [
        { type: 'header', key, label },
        ...sortedMembers.map((name) => ({ type: 'item' as const, label: name, value: name })),
      ],
    });
  }
  for (const name of ungrouped) {
    sortable.push({ sortKey: name, entries: [{ type: 'item', label: name, value: name }] });
  }

  sortable.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return sortable.flatMap((entry) => entry.entries);
}
