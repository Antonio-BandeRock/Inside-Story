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
  // groupLabel is set only for an item that's a real member of a group
  // (matches its own header's `label` exactly) -- omitted for an
  // ungrouped singleton, even one that happens to sort alphabetically
  // right next to a group in the flattened list below. A consumer that
  // wants to know "which header, if any, actually governs this row" (see
  // InlineSelectList.tsx's own custom sticky-header overlay) needs this
  // distinction spelled out explicitly rather than inferred by walking
  // backward through the flattened array, since a group's own block of
  // members is contiguous but an unrelated singleton can immediately
  // follow it with no header of its own in between.
  | { type: 'item'; label: string; value: string; groupLabel?: string };

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
  // Round 3, 2026-08-02: the remaining 16 categories (Alcohol/Algae/Baked/
  // Bev/Brewing/Fats/Fish/Fruit/Grain/Herbs/Legume/Mixed/Mushroom/NutSeed/
  // Sprouts/SupplementPowder/Sweets) hadn't been tested when this feature
  // first shipped -- the person asked for the same sticky-header treatment
  // "for the rest of the lists," which was the prompt to actually check
  // them. Same exact failure shape as before, all confirmed by inspecting
  // real group membership, not guessed: "Salted" combined Anchovy, Carp,
  // Cod roe, Herring, Salmon, Trout (Fish) and Cashew/Hazelnut/Macadamia/
  // Peanut/Pistachio/Almond (NutSeed) -- unrelated species/nuts sharing
  // only a preservation state; "Toasted" combined Blueberry Muffins,
  // Bagels, Egg Bread, Rye/Wheat/White Bread (Baked) -- unrelated baked
  // goods; "Common" combined Bream/Cuttlefish/Mussel/Shrimp (Fish) -- a
  // generic taxonomy qualifier prefixing many unrelated species, not a
  // shared identity the way "Wild Blueberry" is one consistent species-
  // modifier pair; "Sugared"/"Unsweetened"/"Peeled" combined Apricot/
  // Blackberry/Blueberry/Fig/Gooseberry/Apple/Loquat/Pomegranate/Quince
  // (Fruit) -- also caused several DIFFERENT fruits to collide on the
  // exact same stripped label ("Canned, drained"), a real display bug on
  // top of the false grouping; "Mature" combined Broad bean/Chickpea/
  // Haricot bean/Kidney bean/Lentil (NutSeed) -- ripeness state, not
  // identity; "Sugar-Coated" combined Almond/Chocolate/Hazelnut/Peanut
  // (Sweets); "Gluten-Free" combined Baguette/Bread crumbs/Buckwheat
  // bread/Chestnut bread/Chocolate biscuits (Baked) -- a dietary
  // attribute, not identity; "Préemballée"/"préemballé" (French
  // "prepackaged") combined wildly unrelated composite dishes (Mixed);
  // "Dough" combined Apple pie/Cheese-ham crescent/Cherry strudel via
  // parenthetical mentions like "(yeast dough)"/"(strudel dough)," with
  // badly garbled remaining labels once the match word was stripped
  // (Baked) -- real standalone dough products ("Phyllo dough," "Yeast
  // dough (fine)") still show up fine as ungrouped singletons without this
  // word available as a group key. Deliberately did NOT stopword "salt"
  // (Herbs' own "Salt" group -- Rock/Sea/Table/Iodised/Common salt -- is a
  // real, coherent group of actual salt products; only Mixed's unrelated
  // "X boiled with fat and salt" collisions were bad, and there's no clean
  // way to tell those two apart with a single global stopword) or "powder"
  // (Brewing's own "Powder" group -- Cocoa/Coffee/Chicory powder -- is
  // coherent; only Herbs' own mixed-purpose "Powder" group -- baking
  // powder, bouillon cubes, cream of tartar, curry, gravy -- was bad) --
  // both left as accepted, narrower imperfections rather than risk
  // breaking a real working group elsewhere for a global word.
  'salted', 'toasted', 'sugared', 'unsweetened', 'peeled', 'mature',
  'sugar-coated', 'gluten-free', 'common', 'dough',
  'préemballée', 'préemballé',
  // Found 2026-08-02 auditing Bev's own Juice subcategory (same session as
  // the Japanese forced-group work above): 62 of its 100 real base_names
  // end in the literal word "juice" -- inside a list that's ENTIRELY
  // juice to begin with, that produces one dominant mega-group ("Juice")
  // covering most of the subcategory, which tells a browser nothing they
  // don't already know from the subcategory heading itself. Checked
  // database-wide before adding (same discipline as every other stopword
  // here): the only other categories where "juice" is even a last word are
  // Mixed (3 rows), Alcohol (1), Meat (1) -- each a single unrelated
  // composite dish ("Chicken breast fillet in its own juice," "Sparkling
  // wine with orange juice"), never 2+ genuinely related items, so no real
  // group anywhere else is lost by this.
  'juice',
  // Found the same pass, checking the Juice list after the "juice"
  // stopword above stopped it from swallowing everything: "Lemon juice,
  // canned or bottled" and "Lime juice, canned or bottled" shared "bottled"
  // as a last word, forming a real 2-item group -- but stripping just that
  // one word left each member's own label dangling on a conjunction
  // ("Lemon juice, canned or"), the same badly-garbled-remaining-label
  // failure already documented above for "dough"/"gluten-free". Checked
  // database-wide first: every other "X, bottled" row is either already
  // excluded from browsing (branded/cocktail/juice-drink entries cut
  // during the earlier juice-cleanup pass) or the only other real
  // same-category pair (two bottled mineral waters) reads fine either way
  // -- grouped under a bare "Bottled" header or, without this stopword,
  // shown as plain ungrouped singletons with their own full descriptive
  // name, which loses nothing.
  'bottled',
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

function capitalizeFirst(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

type Candidate = {
  key: string;
  // The name with this candidate's own matched word/clause removed --
  // 2026-08-02, explicitly requested: showing "Cheddar Cheese" under a
  // "Cheese" header repeats a word the header itself already said. Kept
  // alongside `key` (rather than re-deriving the strip later from just the
  // key string) so the exact original-cased substring that was actually
  // matched gets removed, with no risk of a second, looser re-match
  // clipping the wrong thing. Falls back to the full name in
  // buildFoodNameGroups below if this ever comes out empty (a name that
  // IS just the key, e.g. a lone "Cheese").
  strippedLabel: string;
};

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
function candidateEntries(name: string): Candidate[] {
  const candidates: Candidate[] = [];
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
    if (commaKey) {
      candidates.push({ key: commaKey, strippedLabel: capitalizeFirst(name.slice(commaIndex + 1).trim()) });
    }
  }
  const hasPercent = name.includes('%');
  const words = name.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1 && !hasPercent) {
    const lastKey = normalizeCandidate(words[words.length - 1]);
    if (lastKey && !candidates.some((c) => c.key === lastKey)) {
      candidates.push({ key: lastKey, strippedLabel: capitalizeFirst(words.slice(0, -1).join(' ')) });
    }
    const firstKey = normalizeCandidate(words[0]);
    if (firstKey && !candidates.some((c) => c.key === firstKey)) {
      candidates.push({ key: firstKey, strippedLabel: capitalizeFirst(words.slice(1).join(' ')) });
    }
  }
  return candidates;
}

// Builds the grouped/ungrouped display list for one category's own food
// names. Pure and synchronous -- cheap enough to run on every render of a
// list that's realistically a few hundred names at most (the same scale
// FoodLookup.tsx's own live search already filters over instantly).
//
// `forcedGroups` -- 2026-08-02, explicitly requested for Bev's Juice
// subcategory after explaining why Japan_MEXT's own citrus/fruit-juice
// entries carry quotation marks (that source's own convention for marking
// a Japanese-language term kept in its original form, e.g. "Yuzu"/"Udon" --
// not specific to these foods): "We could separate them into their own
// group to identify them as Japanese and then remove the quotations."
// This is a genuinely different kind of grouping than the name-pattern
// matching this whole file otherwise does -- it's grouping by WHERE a food
// came from, not what its name looks like -- so it's handled as an
// explicit override map (name -> forced group + display label) rather than
// folded into the candidate-key logic above, which has no concept of
// source. Callers are responsible for only forcing a name into a source-
// based group when every row behind that name really is exclusively from
// that source -- FoodLookup.tsx's own JUICE_JAPAN_DISPLAY_LABELS
// deliberately leaves out "Carrot juice"/"Tomato juice," which merge
// Japan_MEXT's own row with USDA/Canada_CNF/Germany_BLS rows measuring the
// same real food; labeling those "Japanese" would misrepresent what the
// visible entry actually resolves to.
//
// `displayLabel` -- 2026-08-02, follow-up request: "If it's under the
// Juice header, we shouldn't need the word juice in the name. Let's just
// have the name of the fruit listed." The word "juice"/"juice sacs"/
// "straight fruit juice" is redundant once a food is already sitting
// inside a Juice-subcategory list, and the quotation marks are redundant
// once it's under a header that already says "Japanese" -- so the caller
// supplies a fully hand-cleaned label per name (just "Yuzu," "Navel
// Orange," etc.) rather than this function trying to generically strip
// "juice" out of an arbitrary name, which risks mangling one that has real
// content after that word. `value` (used for actual food resolution)
// always stays the real, untouched name -- only the label shown on screen
// changes.
// deprioritizedNames -- 2026-08-09, the REORDERING half of the Healing
// Stages feature (lib/foodStageReordering.ts's own getStageDeprioritizedNames).
// Deliberately touches ONLY Pass 3's own final sort key below, nothing
// about the candidate-key/grouping logic above it (Passes 1-2.5) -- this
// whole file's own top comment already documents real, hard-won fragility
// in that grouping logic, so the safest way to add a real feature here is
// to leave it completely alone and only change how the ALREADY-DECIDED
// groups/singletons get ordered relative to each other. A GROUP is only
// deprioritized if EVERY one of its own real members is -- a group with
// even one non-deprioritized member stays in its normal position, since
// the person can still find and pick that clean member from within it.
// Omitted entirely (undefined) for every other real caller of this
// function -- every entry's own `deprioritized` computes to `false`
// either way, so the sort comparator's own first branch never actually
// fires for them, falling straight through to the exact same
// `localeCompare` comparison this function has always used.
export function buildFoodNameGroups(
  names: string[],
  forcedGroups?: Map<string, { groupLabel: string; displayLabel: string }>,
  deprioritizedNames?: Set<string>,
): GroupedFoodEntry[] {
  const forcedNames = forcedGroups
    ? names.filter((name) => forcedGroups.has(name))
    : [];
  const normalNames = forcedGroups
    ? names.filter((name) => !forcedGroups.has(name))
    : names;

  const namesCandidates = normalNames.map((name) => ({ name, candidates: candidateEntries(name) }));

  // Pass 1: how many DISTINCT names produce each candidate key, across
  // every name's own candidate list (not just its top choice) -- a key
  // only becomes a real group once at least two different foods could
  // plausibly share it.
  const keyCounts = new Map<string, number>();
  for (const { candidates } of namesCandidates) {
    for (const key of new Set(candidates.map((c) => c.key))) {
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }

  // Pass 2: assign each name to its own highest-priority candidate key
  // that actually cleared the 2+ bar above; otherwise it stays ungrouped.
  const groups = new Map<string, { name: string; strippedLabel: string }[]>();
  const ungrouped: string[] = [];
  for (const { name, candidates } of namesCandidates) {
    const chosen = candidates.find((c) => (keyCounts.get(c.key) ?? 0) >= 2);
    if (chosen) {
      const members = groups.get(chosen.key) ?? [];
      // A stripped label that comes out blank only happens when the whole
      // name WAS the matched word (a lone "Cheese" grouped alongside
      // "Cheddar Cheese") -- showing nothing under a header reads as a
      // broken row, so that one case keeps its full original name instead.
      members.push({ name, strippedLabel: chosen.strippedLabel || name });
      groups.set(chosen.key, members);
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
      ungrouped.push(...members.map((m) => m.name));
    }
  }

  // Pass 3: interleave headers and ungrouped singletons in one alphabetical
  // order (by the header's own label for a group, by the name itself for a
  // singleton), matching how the plain flat list already reads today --
  // grouping should make browsing easier to scan, not reshuffle the whole
  // list into an unfamiliar order. Within a group, members sort by their
  // own STRIPPED label (what's actually shown), not the hidden full name,
  // so what's on screen reads in true alphabetical order.
  type SortableEntry = { sortKey: string; deprioritized: boolean; entries: GroupedFoodEntry[] };
  const sortable: SortableEntry[] = [];

  for (const [key, members] of groups) {
    const label = capitalizeFirst(key);
    const sortedMembers = [...members].sort((a, b) => a.strippedLabel.localeCompare(b.strippedLabel));
    // A group is only deprioritized once EVERY real member is -- see this
    // function's own header comment on `deprioritizedNames`.
    const groupDeprioritized = deprioritizedNames
      ? members.every((m) => deprioritizedNames.has(m.name))
      : false;
    sortable.push({
      sortKey: label,
      deprioritized: groupDeprioritized,
      entries: [
        { type: 'header', key, label },
        ...sortedMembers.map((m) => ({ type: 'item' as const, label: m.strippedLabel, value: m.name, groupLabel: label })),
      ],
    });
  }
  for (const name of ungrouped) {
    sortable.push({
      sortKey: name,
      deprioritized: deprioritizedNames?.has(name) ?? false,
      entries: [{ type: 'item', label: name, value: name }],
    });
  }

  // Forced (source-based) groups -- see this function's own top comment.
  // Bypasses the candidate-key logic entirely; membership and label are
  // both already decided by the caller.
  //
  // Kept in a SEPARATE array from `sortable` and appended after it's
  // already sorted, rather than interleaved alphabetically the way a
  // name-pattern group is -- 2026-08-02, explicit direct request after the
  // interleaved placement itself turned out to be the real source of an
  // extended, repeated confusion: "Japanese" sorts alphabetically as a J,
  // landing its whole 18-entry block between "Honeydew melon juice" (H)
  // and "Kiwi fruit juice" (K) in the plain list -- close enough that
  // Kiwi, sitting immediately after the block ends, kept reading as if it
  // belonged to "Japanese" too, no matter how the individual row/header
  // styling was strengthened (see InlineSelectList.tsx's own history of
  // fixes here). Moving every forced group to the very end of the whole
  // list removes the adjacency itself, not just its visual signal --
  // there's no longer any real boundary between an ungrouped fruit and a
  // forced group for a row to be mistaken as straddling.
  const forcedSortable: SortableEntry[] = [];
  if (forcedGroups) {
    const byLabel = new Map<string, { name: string; displayLabel: string }[]>();
    for (const name of forcedNames) {
      const { groupLabel, displayLabel } = forcedGroups.get(name)!;
      const members = byLabel.get(groupLabel) ?? [];
      members.push({ name, displayLabel });
      byLabel.set(groupLabel, members);
    }
    for (const [label, members] of byLabel) {
      // Sorts by the visible display label, not the hidden full name --
      // matching Pass 3's own rule above ("members sort by their own
      // STRIPPED label... so what's on screen reads in true alphabetical
      // order"), so e.g. "Harumi" sorts under H, not buried under "Citrus,"
      // within its own group's block -- this is purely about ordering
      // members WITHIN the forced group, unrelated to where the group
      // itself lands in the overall list (see this block's own top
      // comment).
      const sortedMembers = [...members].sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));
      // Deliberately NOT deprioritized -- a forced (source-based) group
      // never participates in stage reordering, matching this whole
      // block's own already-established rule against interleaving it with
      // anything else in the list (see this block's own top comment).
      forcedSortable.push({
        sortKey: label,
        deprioritized: false,
        entries: [
          { type: 'header', key: label.toLowerCase(), label },
          ...sortedMembers.map((m) => ({
            type: 'item' as const,
            label: m.displayLabel,
            value: m.name,
            groupLabel: label,
          })),
        ],
      });
    }
  }

  // Deprioritized entries sort after every non-deprioritized one; within
  // each of those two real buckets, the exact same alphabetical order this
  // function has always used. When deprioritizedNames is undefined, every
  // entry's own `deprioritized` is false, so `a.deprioritized !==
  // b.deprioritized` is never true and this falls straight through to the
  // original, single-line comparison every existing caller already relies
  // on.
  sortable.sort((a, b) => {
    if (a.deprioritized !== b.deprioritized) return a.deprioritized ? 1 : -1;
    return a.sortKey.localeCompare(b.sortKey);
  });
  forcedSortable.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return [...sortable, ...forcedSortable].flatMap((entry) => entry.entries);
}
