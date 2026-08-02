// A real, cited Hashimoto's-specific advisory shown when an alcoholic food
// is added in Beverage/Fermentation/Soup/Sauces Builder (the four builders
// whose own category allowlist includes Alcohol -- see
// constants/foodBuilderCategories.ts) -- 2026-08-02.
//
// Deliberately NOT modeled as a new D1-D6 sub-criterion (lib/
// sixDimensionsReference.ts) -- that system's tier definitions are generic
// across every food sharing a tier ("Irritants: Disruptive" already covers
// many non-alcoholic foods too), and alcohol's real Hashimoto's-specific
// story doesn't compress into one tier label. Deliberately NOT a blocking
// confirm either (contrast the raw-goitrogenic-load check in Salad/
// Smoothie/Meal Builder, which really does gate on a Cancel/Continue
// choice) -- this is informational, the same "tap a flag, read the
// citation" shape DimensionFlags already uses elsewhere, not a warning to
// act on.
//
// The content itself is honestly mixed, not a one-sided "alcohol is bad"
// case -- researched via WebSearch/WebFetch 2026-08-02, tiered the same
// way this app already tiers the healing-stage sources (see CLAUDE.md):
// two real peer-reviewed studies found moderate drinking is NOT linked to
// new thyroid-antibody development and tracks with LOWER risk of
// progressing to overt autoimmune hypothyroidism -- similar to alcohol's
// documented protective association with other autoimmune diseases. The
// real, dose-dependent concerns in the literature concentrate specifically
// at heavier/more frequent drinking, not confirmed at moderate levels.
// Several specific numbers repeated across patient-education sites
// (a percent figure for reduced levothyroxine absorption, a percent drop
// in free T3) could not be traced to a verifiable primary study during
// this research pass, and are deliberately left out rather than presented
// as cited facts -- the same standard this app already held the thiamine
// case-report claim to (see CLAUDE.md's own account of that correction).
export const ALCOHOL_ADVISORY_TITLE = "Alcohol & Hashimoto's";

export const ALCOHOL_ADVISORY_MESSAGE = `Two real studies -- Carle et al. 2013 (European Journal of Endocrinology, a Danish population-based case-control study) and Effraimidis et al. (European Thyroid Journal, a prospective Amsterdam cohort) -- found moderate alcohol consumption was NOT linked to new thyroid-antibody development, and tracked with a LOWER risk of progressing to overt autoimmune hypothyroidism. This mirrors alcohol's documented protective association with other autoimmune diseases like rheumatoid arthritis and lupus. That's real evidence, not a reason to assume alcohol is simply bad here.

The real, dose-dependent concerns in the research concentrate at heavier or more frequent drinking, not confirmed at moderate levels:
- The liver performs about 80% of the body's T4-to-T3 conversion. Alcohol is also processed by the liver, so heavy use may compete for that same capacity.
- Chronic heavy drinking is linked to increased gut permeability and inflammatory signaling that can affect thyroid regulation (Sagaram et al. 2022, Cells -- a small, preliminary study, not proof this happens at moderate intake).
- Chronic alcohol use measurably dysregulates the HPA axis/cortisol rhythm (Stephens & Wand, 2012, NIAAA Alcohol Research: Current Reviews) -- relevant to the same adrenal/HPA concerns behind this app's later healing stages.
- If you take levothyroxine, alcohol can affect its absorption and how consistently doses get taken -- worth asking your doctor about timing specifically for you. Several precise numbers repeated online for this couldn't be traced to a verifiable source, so they're left out here rather than stated as fact.`;

// Matches how ResolvedFoodSelection identifies an alcoholic food -- the
// reference database carries Alcohol as both its own standalone category
// AND a "Bev > Alcoholic" subcategory (overlapping data from different
// national sources, confirmed directly against the database rather than
// assumed) -- checking both catches either route to the same real thing.
export function isAlcoholicFood(resolved: { category: string; subcategory: string | null }): boolean {
  return resolved.category === 'Alcohol' || resolved.subcategory === 'Alcoholic';
}
