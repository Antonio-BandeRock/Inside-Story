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
  // the trial/review, e.g. "Wu et al. 2024 meta-analysis, 21 RCTs".
  source: string;
  // Real PubMed ID when one exists -- lets a reader jump straight to
  // https://pubmed.ncbi.nlm.nih.gov/{pmid} rather than trusting the
  // attribution alone.
  pmid?: string;
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
] as const;

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
};

export type AnyDigestEntry = DigestEntry | ProblemFoodEntry;

export function isProblemFoodEntry(entry: AnyDigestEntry): entry is ProblemFoodEntry {
  return entry.category === 'problemFoods';
}
