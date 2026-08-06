// The Purple Digest's own content types -- built 2026-08-05 alongside its
// promotion from a placeholder Stack-push screen to a real tab (see
// app/(tabs)/purple-digest.tsx's own header comment). Two shapes, not one:
// most of this tab's content is DigestEntry (a citation-backed finding,
// same evidence-tier discipline as everywhere else in this app -- see
// lib/sixDimensionsReference.ts's own tier system, which this deliberately
// echoes rather than invents a second one) -- but the person explicitly
// asked for a second, more PRACTICAL kind of content too: "talk about the
// various foods that are a problem, and why, and how to get around those
// problems." That's ProblemFoodEntry -- food-first, swap-first, teaching
// general food literacy rather than reviewing a body of evidence.
//
// Every citation here is a compressed pointer (short attribution + a real
// PMID/DOI where one exists), not a full bibliography entry -- the point is
// letting someone verify a claim exists in the literature, not reproducing
// the literature itself. Deliberately no direct dependency on any
// not-yet-built feature (the 5-stage healing-journey framework named in
// CLAUDE.md is "decided, not yet built" as of this writing) -- `stageNote`
// below is a short, freeform hint for now, not a real key into a stage
// system that doesn't exist in code yet. Wire it up for real once that
// system ships, rather than fabricating the integration today.

export type EvidenceTier = 'strong' | 'moderate' | 'weak';

export type DigestCitation = {
  // A short, human-readable pointer -- author/year/journal or the name of
  // the trial/review, e.g. "Wu et al. 2024 meta-analysis, 21 RCTs". This is
  // the tappable link's own display text (see PurpleDigestScreen's
  // CitationsBlock), not just a label.
  source: string;
  // The real, verified page the finding above actually comes from --
  // PubMed, a journal's own DOI page, or the source agency's own page
  // (FDA/EFSA/IARC/Cochrane/NIH ODS/etc.). 2026-08-06: made real and
  // required, not optional -- "the references... need to also be linked
  // to the webpage where the information is derived, not just cited," per
  // explicit request. Every entry in lib/digest/*.ts was individually
  // checked via WebSearch before this field was added -- a citation this
  // app could not find a real, verifiable page for was reworded or
  // re-sourced rather than shipped with a fabricated link (see each
  // category file's own header comment for any citation still flagged
  // unresolved).
  url: string;
};

export const DIGEST_CATEGORY_KEYS = [
  'gutMicrobiome',
  'nutrients',
  'foodAdditives',
  'fermentedFoods',
  'labsMedication',
  'lifestyleEnvironment',
  'mitochondriaMetabolism',
  'otherAutoimmune',
  // 2026-08-07: four categories added in direct response to "this area MUST
  // include everything at all worth knowing" -- explicitly not exhaustive
  // even after this addition (nothing in a growing medical literature ever
  // truly is), but a real, substantial expansion rather than a token one.
  'healingStages',
  'organSystems',
  'history',
  'nutrientInteractions',
  // 2026-08-07, same day: a fifth addition, folding in the standalone
  // "What Happened to Food" research Artifact as its own category rather
  // than leaving it external -- see foodIndustryHistory.ts's own header
  // comment for the full story, including two real corrections made during
  // re-verification (a untraceable autoimmune-rise statistic replaced with
  // a real, more nuanced 2023 Lancet finding; an unverifiable margarine
  // consumption figure replaced with a verified one).
  'foodIndustryHistory',
  // 2026-08-07, same day, sixth addition: "we need some what to Tie it all
  // together of all of the digest lenses. Sort of a short story." Every
  // other category's own new "Tying it all together" entry (see each
  // category file's own closing entry) synthesizes WITHIN that one
  // category -- this one is different in kind, not degree: a short,
  // continuous narrative that crosses all 14 other categories in a single
  // read, grounding the research in one illustrative day rather than
  // reviewing it category by category. See bigPicture.ts's own header
  // comment for the full reasoning.
  'bigPicture',
  // 2026-08-07, same day, seventh addition: "Provide a glossary of words
  // and phrases and acronyms and definitions of all of them... Make it
  // another lens on the Digest." A genuinely different kind of category
  // from the other 14 -- see glossary.ts's own header comment for why it's
  // deliberately short-entry/lookup-shaped rather than narrative, and
  // index.ts's own DIGEST_CATEGORY_META comment for why, unlike every
  // category before it, this one was placed FIRST rather than appended
  // last (a direct, explicit request: "the first one at the top left").
  'glossary',
] as const;

// A real, simple bar-chart dataset -- 2026-08-07, direct request: "we need
// graph images that depict the trends and data in ways that make it easy
// to understand... to provide a professional view of the data." Every
// number in a `DigestChart` must trace back to the same real, cited source
// already backing that entry's own `summary` -- this is a visual
// restatement of a real, already-verified figure, never a new or invented
// data point (deliberately no `title`/generic decorative use -- if an
// entry's own claim isn't fundamentally a small set of real, comparable
// numbers, it doesn't get a chart). Deliberately just one simple shape
// (horizontal bars) rather than a charting library -- react-native has no
// built-in charting, and a plain, small set of styled Views (see
// DigestBarChart.tsx) covers this app's real need without adding a new
// dependency or introducing SVG-specific rendering risk for something this
// simple.
export type DigestChartDatum = {
  label: string;
  value: number;
};

export type DigestChart = {
  // Shown above the bars -- usually a shorter restatement of the entry's
  // own title, not a repeat of the full sentence already in the summary.
  title: string;
  // Appended after each bar's own numeric value, e.g. '%', 'mg', 'kcal' --
  // omit for a plain unitless count.
  unit?: string;
  data: DigestChartDatum[];
  // A short attribution shown beneath the chart -- reuses the same source
  // name already in this entry's own `citations`, not a new one.
  sourceNote: string;
};

// 'problemFoods' is deliberately its own type (ProblemFoodEntry, below),
// never mixed into DigestEntry's own category union -- the two are shaped
// too differently (a citation-review vs. a food-and-its-swaps) to pretend
// they're one schema with optional fields standing in for the difference.
export type DigestEntryCategory = (typeof DIGEST_CATEGORY_KEYS)[number];

export type DigestEntry = {
  id: string;
  category: DigestEntryCategory;
  title: string;
  // One sentence, shown on the category's own list card before it's
  // opened -- has to earn the tap on its own.
  teaser: string;
  // The real body -- a few sentences, written the same "state the finding,
  // name the real mechanism, name the real limitation" way as this whole
  // session's own research has been, not a marketing summary.
  summary: string;
  citations: DigestCitation[];
  // The single worst/most-honest tier across this entry's own citations --
  // shown as a color dot on the list card (same token reuse as the
  // alcohol/coffee/juice advisories: colors.accent/primary/textMuted for
  // strong/moderate/weak, no new hex values). An entry citing one strong
  // RCT and one weak case report is tagged 'weak' here on purpose -- the
  // overall claim is only as strong as its weakest real support.
  overallTier: EvidenceTier;
  // A short, human-readable hint at where in a healing journey this is
  // most relevant -- e.g. "Most relevant once trigger foods are already
  // identified" -- NOT a key into the not-yet-built 5-stage system.
  stageNote?: string;
  // Other entries' own `id`s (any category, including ProblemFoodEntry's)
  // worth surfacing as "related" -- e.g. the vitamin D nutrient entry
  // relates to the leaky-gut CLDN2 gut-microbiome entry.
  relatedIds?: string[];
  // A real, small dataset visualized as a horizontal bar chart, shown
  // directly under this entry's own summary when expanded -- see
  // DigestChart's own comment for the discipline behind what qualifies.
  // Optional: only added where an entry's own claim is fundamentally a
  // small set of real, comparable numbers, not retrofitted everywhere.
  chart?: DigestChart;
};

export type ProblemFoodEntry = {
  id: string;
  category: 'problemFoods';
  foodName: string;
  // The one-line reason this food shows up here at all.
  teaser: string;
  // What the real problem is, in plain terms -- not assumed universal (see
  // e.g. nightshades below, whose real answer is "test it yourself," not
  // "avoid").
  problem: string;
  // The actual biological/chemical mechanism behind the problem, named
  // specifically -- this is what makes an entry teach food literacy rather
  // than just assert a rule.
  mechanism: string;
  // Real, concrete substitutes or workarounds -- not "eat less of it."
  swaps: string[];
  citations: DigestCitation[];
  stageNote?: string;
  relatedIds?: string[];
  // Same chart mechanism as DigestEntry's own `chart` -- see that field's
  // comment. Duplicated here rather than hoisted onto a shared base type,
  // matching this file's own standing rule that DigestEntry and
  // ProblemFoodEntry stay two genuinely separate shapes, not one schema
  // with optional fields papering over the difference.
  chart?: DigestChart;
};

export type AnyDigestEntry = DigestEntry | ProblemFoodEntry;

export function isProblemFoodEntry(entry: AnyDigestEntry): entry is ProblemFoodEntry {
  return entry.category === 'problemFoods';
}
