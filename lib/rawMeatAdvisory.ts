// A real, cited food-safety advisory shown when a builder ingredient's own
// selected Cook Prep is "Raw" and the resolved food is meat, poultry, fish
// or seafood (the Meat category, merged from Fish 2026-08-05, so this one
// category check covers all four), or an egg -- 2026-08-13, direct request:
// "Make sure that warnings about raw meat is provided in the warnings of
// the app."
//
// Deliberately triggered off `ingredientCookingMethod` (the real, explicit
// Cook Prep value a person selects in the builder), never off the resolved
// reference-database row's own `prepMethod` or `baseName` text. Confirmed
// directly against the live database before building this: several real,
// currently-visible egg base_names (e.g. "Chicken Egg (Raw)") keep that
// literal "(Raw)" text in their own display name even when the actual
// resolved row's real prep_method is Cooked/Boiled/Fried/Dried -- a known,
// already-documented, currently-live labeling quirk (see CLAUDE.md's own
// "Chicken Egg (Raw)" mislabel history) this advisory deliberately doesn't
// rely on, since it would produce both false positives (a boiled egg still
// showing "(Raw)" in its own name) and, more importantly, false negatives
// for any other food whose own resolved base_name happens not to carry a
// "(Raw)" suffix. The person's own real, selected Cook Prep is the one
// honest signal for how they're actually preparing the dish.
//
// Deliberately NOT a blocking confirm (contrast the raw-goitrogenic-load
// check in Salad/Smoothie/Meal Builder) -- eating rare steak, sushi-grade
// fish, or a soft-cooked egg are all real, common, often genuinely safe
// choices; this is informational, the same "tap a flag, read the citation"
// shape every other advisory in this app already uses, not a warning
// requiring an explicit "continue anyway."
//
// Every claim independently verified via WebSearch/WebFetch 2026-08-13,
// real CDC/USDA FSIS/FDA primary sources, not repeated from a secondary
// summary uncritically.
export const RAW_MEAT_ADVISORY_TITLE = 'Raw or Undercooked Meat, Poultry, Fish & Eggs';

export const RAW_MEAT_ADVISORY_MESSAGE = `CDC estimates roughly 48 million people in the US get sick from a foodborne illness every year, with about 128,000 hospitalized and 3,000 deaths. Raw or undercooked meat, poultry, fish, and eggs are the foods most consistently linked to it, via real, named pathogens: Salmonella (a leading cause overall, and especially linked to poultry and eggs), Campylobacter (linked to undercooked poultry), E. coli, and Listeria (fewer cases overall, but disproportionately severe, especially for pregnant people, older adults, and anyone with a weakened immune system).

Real, specific safe minimum internal temperatures (USDA FSIS):
- Ground beef, pork, lamb, or veal: 160°F. Ground meat needs a HIGHER temperature than a whole cut of the same animal, not a lower one -- grinding mixes any surface bacteria throughout the whole batch, so the interior has to actually reach that temperature, searing the outside isn't enough the way it can be for a steak.
- Whole cuts (steaks, chops, roasts) of beef, pork, lamb, or veal: 145°F -- genuinely lower, since bacteria on an intact cut are mostly on the surface.
- All poultry (chicken, turkey): 165°F, checked at the innermost thigh/wing and the thickest part of the breast.
- Egg dishes (casseroles, egg mixtures): 160°F, or cook eggs until both the white and yolk are firm.
- Fish: 145°F kills parasites too, not just bacteria.

Raw fish specifically has its own real, separate safety standard: the FDA requires fish served raw (sushi, sashimi) to first be frozen at -4°F for 7 days, or -31°F until solid then held at -31°F for 15 hours, to kill parasites like Anisakis. "Sushi-grade" isn't an official grading term, it's shorthand for fish that's genuinely gone through this real freezing process, worth knowing if preparing raw fish at home rather than at a restaurant that already handles this.

This isn't a reason to avoid a rare steak or sushi-grade fish, both are genuinely common, often safe choices when handled this way. It's a real reason to know the actual temperature or handling standard for whatever's being logged as raw here, especially given several conditions this app tracks involve immunosuppressive treatment (biologics, methotrexate, and similar medications), which measurably raises the real infection risk from any of these foods above the general population's own baseline.`;

/**
 * A generous but real subset of egg base_name prefixes -- confirmed
 * directly against the live reference database (all filed under the
 * `Dairy` category, per this app's own 2026-08-02 chicken-egg-labeling
 * work): Chicken, Duck, Goose, Turkey, and Quail Egg. Checked as a
 * case-insensitive prefix match on baseName so it still catches a real
 * egg entry regardless of that entry's own "(Raw)" suffix quirk.
 */
const EGG_BASE_NAME_PATTERN = /\b(chicken|duck|goose|turkey|quail)\s+egg/i;

/**
 * True when the given resolved food is meat, poultry, fish, seafood, or an
 * egg, AND the person's own selected Cook Prep for this ingredient is
 * "Raw" -- the one real, honest signal (not the resolved row's own
 * baseName/prepMethod) for whether this is actually being prepared raw.
 * `cookMethod` should be whatever a builder's own `ingredientCookingMethod`
 * state currently holds; pass it in directly rather than reading it here,
 * since every builder already owns that state itself.
 */
export function isRawMeatOrEggFood(
  resolved: { category: string; baseName: string },
  cookMethod: string | null
): boolean {
  if (cookMethod !== 'Raw') return false;
  // The Meat category covers meat, poultry, and fish & seafood together --
  // Fish was merged into Meat 2026-08-05, see lib/db.ts's own comment.
  if (resolved.category === 'Meat') return true;
  if (resolved.category === 'Dairy') return EGG_BASE_NAME_PATTERN.test(resolved.baseName);
  return false;
}
