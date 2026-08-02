// A real, cited advisory shown when a coffee item is added in
// Beverage/Fermentation Builder (the two builders whose own category
// allowlist includes `Brewing`) -- 2026-08-02, built the same session and
// same way as lib/alcoholAdvisory.ts: informational, not a blocking
// confirm, and every claim independently verified via WebSearch/WebFetch
// rather than taken on trust from the summary that prompted this.
//
// Real constraint that shaped what this can and can't say: this app's own
// reference database (all 7 national sources) never distinguishes roast
// level or bean variety (Arabica vs. Robusta) for ANY of its ~90 coffee
// rows -- confirmed directly, zero matches for "light/dark roast" or
// "Arabica/Robusta" anywhere in the data -- and never measured chlorogenic
// acids or the diterpenes cafestol/kahweol at all, in any of the 7
// sheets. So none of this can be scored per-food the way D1-D6 sub-
// criteria are; it's general, cited education about what those choices
// mean, the same shape as the alcohol advisory's own non-blocking design,
// not a claim about the specific row someone just picked. Caffeine is the
// one real exception -- see lib/db.ts's own NUTRIENT_DEFINITIONS comment
// for why it WAS added as a real per-food nutrient this same session.
//
// The milk/polyphenol-binding claim in the original prompt ("cuts
// absorption by 50% or more") did not hold up under verification -- real
// research here is genuinely mixed (some studies show ~28-40% less free
// chlorogenic acid when bound to milk casein; others show the resulting
// protein-polyphenol complex actually INCREASES measured antioxidant
// activity), so it's presented that way below, not as a settled fact.
export const COFFEE_ADVISORY_TITLE = 'Coffee, Brewing & Levothyroxine';

export const COFFEE_ADVISORY_MESSAGE = `If you take levothyroxine, coffee timing matters more than roast or bean choice. A real pharmacokinetic study found espresso taken together with a levothyroxine dose delayed peak absorption by 38-43 minutes and reduced it by 19-36% (Benvenga et al., cited in a systematic review of levothyroxine/food interactions, PMC8002057) -- coffee polyphenols and tannins can bind the medication before it's absorbed, and caffeine speeds gut transit, giving it less time to dissolve. Coffee taken about an hour after a dose showed no effect. A separate study found liquid levothyroxine solution wasn't affected even 5 minutes after coffee (Endocrine Society, 2022) -- worth asking your doctor about if timing is a recurring problem for you.

Filtered vs. unfiltered is real and well-documented (Harvard T.H. Chan School of Public Health; clinical trials summarized in American Heart Association statements): unfiltered coffee (French press, Turkish, boiled, some espresso) retains oily compounds called cafestol and kahweol, which suppress the liver's own LDL clearance. Studies put the effect at roughly 10-16 mg/dL higher LDL cholesterol compared to filtered coffee. A paper filter traps nearly all of it.

Roast level and bean variety are real too, but this app's own database doesn't track either one separately for any coffee item on file, so this is general knowledge, not something scored on the specific food you picked:
- Lighter roasts retain more chlorogenic acids (antioxidant compounds broken down by heat -- roasting can destroy up to ~90% of them by the time a bean reaches a dark roast). Dark roasts develop more melanoidins instead, the compounds responsible for the color, which carry their own antioxidant and prebiotic properties -- it's a tradeoff, not a clear "better" direction.
- Robusta beans carry roughly double the caffeine of Arabica beans (well-established in food science; Arabica tends to have more natural fat and sugar instead).

Milk: the evidence is genuinely mixed, not settled. Some studies show milk proteins (casein) bind a real share of coffee's polyphenols, lowering the free antioxidant content measured afterward; other studies find the resulting milk-protein-polyphenol complex measures HIGHER antioxidant activity, not lower. Not a reason to avoid milk in coffee -- just not the clean "cuts it in half" claim it's sometimes presented as.`;

// A coffee item can come from either the Bev>Coffee subcategory (real,
// already-brewed/ready-to-drink coffee) or the Brewing category (dry,
// not-yet-brewed instant coffee/chicory-coffee-substitute powder, see
// scripts/build_food_reference_db.py's own CATEGORY_OVERRIDES) -- Brewing
// also holds tea/cocoa/malt items, so a coffee-specific keyword check on
// the food's own base name is what actually narrows it down there.
export function isCoffeeFood(resolved: { category: string; subcategory: string | null; baseName: string }): boolean {
  if (resolved.category === 'Bev' && resolved.subcategory === 'Coffee') return true;
  if (resolved.category === 'Brewing') {
    const lower = resolved.baseName.toLowerCase();
    return lower.includes('coffee') || lower.includes('café') || lower.includes('chicory') || lower.includes('chicorée');
  }
  return false;
}
