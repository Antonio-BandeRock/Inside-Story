// General-health gradient, 2026-08-14 -- condition-agnostic food guidance
// that applies regardless of which of the 19 tracked conditions someone
// has, unified into one real, extensible registry rather than the five
// separate, near-identical hand-built advisory files this app had grown
// (lib/alcoholAdvisory.ts, coffeeAdvisory.ts, juiceAdvisory.ts,
// rawMeatAdvisory.ts, each rendered via its own copy-pasted tap-to-explain
// row across up to 10 builder files). Every one of those four is migrated
// into this file's GENERAL_HEALTH_RULES below, same evidence, same message
// text, now under a real, stable topicId a person can mute independently
// (see lib/generalHealthPreferences.ts) -- healingStageAdvisory/
// conditionStageAdvisory are deliberately NOT migrated here, since those
// are condition-specific, not general-health.
//
// Per the confirmed design: evaluateGeneralHealthRules below is
// UNCONDITIONAL -- it has no awareness of mute state at all, and never
// will. Mute is applied only by the caller (components/
// GeneralHealthAdvisories.tsx, for the interactive builder UI). Whenever
// Trends/Reports get built out, they call this same evaluator directly
// against historical meal_items, exactly the way 6-DFF scoring is already
// always recomputed live from canonical data rather than persisted
// redundantly onto a logged entry -- so a muted topic still shows up in
// full there, per the explicit requirement that muting a topic while
// building a meal must never hide it from the pattern-level record.
//
// Deliberately kept as a pure, DB-independent module, same shape as the
// four files it absorbs -- no rule here reaches into the database
// directly. A rule needing real nutrient/portion data (the portion-size
// rule below) reads it off the pending-ingredient object the caller
// already built, rather than this file doing its own async lookups.

export type GeneralHealthResolvedFood = {
  category: string;
  subcategory: string | null;
  baseName: string;
};

// One ingredient currently sitting in a builder's own pending/ingredient
// list -- resolved is required (every rule needs to know what the food
// actually is); the rest are optional, since not every rule needs them,
// and not every builder has them readily available for every ingredient.
export type GeneralHealthPendingIngredient = {
  resolved: GeneralHealthResolvedFood;
  cookMethod?: string | null;
  // Real, computed grams for this specific logged entry, and the food's
  // own real natural-unit serving weight (food_unit_weights, the same
  // real, cited data Nutrient Ranking's own %DV feature already reuses) --
  // both null when either isn't known. Populated by the caller, not this
  // file, since computing grams from a builder's own quantity/unit fields
  // already happens there.
  quantityGrams?: number | null;
  naturalUnitWeightGrams?: number | null;
};

export type GeneralHealthRuleMatch = {
  topicId: string;
  title: string;
  message: string;
};

export type GeneralHealthRule = {
  // Stable mute key -- never change once shipped, since a person's own
  // saved mute preference (lib/generalHealthPreferences.ts) is keyed on
  // this exact string.
  topicId: string;
  title: string;
  message: string;
  // Evaluated once per CURRENT ingredient (the one whose pending card is
  // showing) -- current/cookMethod describe that one ingredient;
  // allPendingIngredients is the full list currently in the builder, for
  // rules that need to look across more than one ingredient (a real
  // food-combination check). Deliberately synchronous -- every input a
  // rule needs is already resolved by the caller before this runs.
  check: (
    current: GeneralHealthResolvedFood,
    cookMethod: string | null,
    currentQuantityGrams: number | null,
    currentNaturalUnitWeightGrams: number | null,
    allPendingIngredients: GeneralHealthPendingIngredient[],
  ) => boolean;
};

// --- Migrated: same evidence, same message text as the files they --------
// --- replace, just a real, stable topicId and one shared shape. ----------

const ALCOHOL_RULE: GeneralHealthRule = {
  topicId: 'alcohol',
  title: "Alcohol & Hashimoto's",
  message: `Two real studies -- Carle et al. 2013 (European Journal of Endocrinology, a Danish population-based case-control study) and Effraimidis et al. (European Thyroid Journal, a prospective Amsterdam cohort) -- found moderate alcohol consumption was NOT linked to new thyroid-antibody development, and tracked with a LOWER risk of progressing to overt autoimmune hypothyroidism. This mirrors alcohol's documented protective association with other autoimmune diseases like rheumatoid arthritis and lupus. That's real evidence, not a reason to assume alcohol is simply bad here.

The real, dose-dependent concerns in the research concentrate at heavier or more frequent drinking, not confirmed at moderate levels:
- The liver performs about 80% of the body's T4-to-T3 conversion. Alcohol is also processed by the liver, so heavy use may compete for that same capacity.
- Chronic heavy drinking is linked to increased gut permeability and inflammatory signaling that can affect thyroid regulation (Sagaram et al. 2022, Cells -- a small, preliminary study, not proof this happens at moderate intake).
- Chronic alcohol use measurably dysregulates the HPA axis/cortisol rhythm (Stephens & Wand, 2012, NIAAA Alcohol Research: Current Reviews) -- relevant to the same adrenal/HPA concerns behind this app's later healing stages.
- If you take levothyroxine, alcohol can affect its absorption and how consistently doses get taken -- worth asking your doctor about timing specifically for you. Several precise numbers repeated online for this couldn't be traced to a verifiable source, so they're left out here rather than stated as fact.`,
  check: (current) => current.category === 'Alcohol' || current.subcategory === 'Alcoholic',
};

const COFFEE_RULE: GeneralHealthRule = {
  topicId: 'coffee-levothyroxine',
  title: 'Coffee, Brewing & Levothyroxine',
  message: `If you take levothyroxine, coffee timing matters more than roast or bean choice. A real pharmacokinetic study found espresso taken together with a levothyroxine dose delayed peak absorption by 38-43 minutes and reduced it by 19-36% (Benvenga et al., cited in a systematic review of levothyroxine/food interactions, PMC8002057) -- coffee polyphenols and tannins can bind the medication before it's absorbed, and caffeine speeds gut transit, giving it less time to dissolve. Coffee taken about an hour after a dose showed no effect. A separate study found liquid levothyroxine solution wasn't affected even 5 minutes after coffee (Endocrine Society, 2022) -- worth asking your doctor about if timing is a recurring problem for you.

Filtered vs. unfiltered is real and well-documented (Harvard T.H. Chan School of Public Health; clinical trials summarized in American Heart Association statements): unfiltered coffee (French press, Turkish, boiled, some espresso) retains oily compounds called cafestol and kahweol, which suppress the liver's own LDL clearance. Studies put the effect at roughly 10-16 mg/dL higher LDL cholesterol compared to filtered coffee. A paper filter traps nearly all of it.

Roast level and bean variety are real too, but this app's own database doesn't track either one separately for any coffee item on file, so this is general knowledge, not something scored on the specific food you picked:
- Lighter roasts retain more chlorogenic acids (antioxidant compounds broken down by heat -- roasting can destroy up to ~90% of them by the time a bean reaches a dark roast). Dark roasts develop more melanoidins instead, the compounds responsible for the color, which carry their own antioxidant and prebiotic properties -- it's a tradeoff, not a clear "better" direction.
- Robusta beans carry roughly double the caffeine of Arabica beans (well-established in food science; Arabica tends to have more natural fat and sugar instead).

Milk: the evidence is genuinely mixed, not settled. Some studies show milk proteins (casein) bind a real share of coffee's polyphenols, lowering the free antioxidant content measured afterward; other studies find the resulting milk-protein-polyphenol complex measures HIGHER antioxidant activity, not lower. Not a reason to avoid milk in coffee -- just not the clean "cuts it in half" claim it's sometimes presented as.`,
  check: (current) => {
    if (current.category === 'Bev' && current.subcategory === 'Coffee') return true;
    if (current.category === 'Brewing') {
      const lower = current.baseName.toLowerCase();
      return lower.includes('coffee') || lower.includes('café') || lower.includes('chicory') || lower.includes('chicorée');
    }
    return false;
  },
};

const JUICE_RULE: GeneralHealthRule = {
  topicId: 'juice-glycemic-fiber',
  title: 'Fruit Juice, Blood Sugar & Hashimoto’s',
  message: `Straight juice removes the fiber that would normally slow sugar absorption and limit how much you drink in one sitting -- the juice of four oranges takes seconds to drink; eating four oranges doesn't. At the population level, this shows up in real long-term data: a large study across three prospective cohorts found daily fruit juice intake tracked with up to 21% higher type 2 diabetes risk, while whole fruit -- especially blueberries, grapes, and apples -- tracked with lower risk (Muraki et al., 2013, BMJ). A separate population study (the Maastricht Study, Diabetes Care, 2022) found fructose from fruit juice and sugar-sweetened drinks independently associated with more fat stored in the liver.

That said, the simple "juice always spikes your blood sugar faster than whole fruit" claim doesn't hold up as a guarantee -- a 2025 randomized trial in adults with type 2 diabetes found no real difference in glucose or insulin response between orange juice and whole orange pieces when both were eaten as part of a meal with matched sugar content. The bigger real-world risk is likely portion size and how easy juice makes it to drink a lot of sugar quickly, not a fundamentally different absorption curve every time.

For Hashimoto's specifically, sugar swings are worth caring about, but two pieces of the reasoning need a correction. Blood sugar instability is genuinely linked to more inflammatory immune activity -- unstable glucose can push T cells toward more inflammatory signaling patterns implicated in autoimmune flares. But it's the CRASH after a sugar spike, not the spike or insulin release itself, that triggers a real stress-hormone response (cortisol, along with adrenaline) as your body works to bring glucose back up. Cortisol, in turn, is well-documented to suppress the enzymes that convert inactive thyroid hormone (T4) into active T3, while favoring the pathway that makes inactive reverse T3 instead -- real physiology, but this specific chain (juice -> sugar crash -> cortisol -> measurably less active thyroid hormone) hasn't been directly tested as an outcome of drinking juice; it's a plausible chain built from separately-established pieces, not a proven one.

Gut permeability ("leaky gut") shows up in real research too -- fructose specifically has been linked to disrupted tight-junction proteins in the gut lining in animal studies, and "leaky gut" is a real, if still debated, thread in autoimmune-disease research. Most of the strongest evidence here is still from animal models rather than controlled human trials, so treat it as a real, active area of research rather than settled fact.

On timing with levothyroxine: this is the one place the evidence is weaker than commonly claimed. The best controlled data available (a real crossover trial, cited in a systematic review of levothyroxine-food interactions) tested grapefruit juice specifically and found only a modest, likely-clinically-small effect on absorption. The reviewers' own conclusion: people on levothyroxine shouldn't feel discouraged from normal fruit juice drinking on this basis. The interaction that IS well-established is with CALCIUM-FORTIFIED juice, not juice in general -- and this app's own juice list already leaves fortified products out, so that concern mostly doesn't apply to what you'd pick here.`,
  check: (current) => current.category === 'Bev' && current.subcategory === 'Juice',
};

const EGG_BASE_NAME_PATTERN = /\b(chicken|duck|goose|turkey|quail)\s+egg/i;

const RAW_MEAT_RULE: GeneralHealthRule = {
  topicId: 'raw-meat-eggs',
  title: 'Raw or Undercooked Meat, Poultry, Fish & Eggs',
  message: `CDC estimates roughly 48 million people in the US get sick from a foodborne illness every year, with about 128,000 hospitalized and 3,000 deaths. Raw or undercooked meat, poultry, fish, and eggs are the foods most consistently linked to it, via real, named pathogens: Salmonella (a leading cause overall, and especially linked to poultry and eggs), Campylobacter (linked to undercooked poultry), E. coli, and Listeria (fewer cases overall, but disproportionately severe, especially for pregnant people, older adults, and anyone with a weakened immune system).

Real, specific safe minimum internal temperatures (USDA FSIS):
- Ground beef, pork, lamb, or veal: 160°F. Ground meat needs a HIGHER temperature than a whole cut of the same animal, not a lower one -- grinding mixes any surface bacteria throughout the whole batch, so the interior has to actually reach that temperature, searing the outside isn't enough the way it can be for a steak.
- Whole cuts (steaks, chops, roasts) of beef, pork, lamb, or veal: 145°F -- genuinely lower, since bacteria on an intact cut are mostly on the surface.
- All poultry (chicken, turkey): 165°F, checked at the innermost thigh/wing and the thickest part of the breast.
- Egg dishes (casseroles, egg mixtures): 160°F, or cook eggs until both the white and yolk are firm.
- Fish: 145°F kills parasites too, not just bacteria.

Raw fish specifically has its own real, separate safety standard: the FDA requires fish served raw (sushi, sashimi) to first be frozen at -4°F for 7 days, or -31°F until solid then held at -31°F for 15 hours, to kill parasites like Anisakis. "Sushi-grade" isn't an official grading term, it's shorthand for fish that's genuinely gone through this real freezing process, worth knowing if preparing raw fish at home rather than at a restaurant that already handles this.

This isn't a reason to avoid a rare steak or sushi-grade fish, both are genuinely common, often safe choices when handled this way. It's a real reason to know the actual temperature or handling standard for whatever's being logged as raw here, especially given several conditions this app tracks involve immunosuppressive treatment (biologics, methotrexate, and similar medications), which measurably raises the real infection risk from any of these foods above the general population's own baseline.`,
  check: (current, cookMethod) => {
    if (cookMethod !== 'Raw') return false;
    if (current.category === 'Meat') return true;
    if (current.category === 'Dairy') return EGG_BASE_NAME_PATTERN.test(current.baseName);
    return false;
  },
};

// --- New, 2026-08-14 ------------------------------------------------------

// Whole-food matrix effect -- processing/grinding a whole nut or seed
// changes how much of its own fat and calories the body actually absorbs,
// a real, distinct mechanism from glycemic index (this isn't about a sugar
// spike, it's about intact plant cell walls trapping fat during
// digestion). Deliberately worded without a specific percentage -- the
// direction and mechanism are well-established, but the exact figure
// varies by study and by food, and this app's own standing discipline is
// never to state a precise number that hasn't been independently
// re-verified for the specific claim being made.
const WHOLE_FOOD_MATRIX_KEYWORDS = ['flour', 'butter', 'ground', 'powder', 'meal', 'paste'];

const WHOLE_FOOD_MATRIX_RULE: GeneralHealthRule = {
  topicId: 'whole-food-matrix',
  title: 'Whole vs. Ground: The Food Matrix Effect',
  message: `Grinding a whole nut or seed into flour, butter, or powder does more than change its texture -- it breaks open the plant cell walls that would otherwise trap some of the fat during digestion, so a meaningful share of it can pass through less absorbed than the same weight of the whole, intact food. This is a real, distinct mechanism from glycemic index (it's about physical structure, not sugar), and it can cut either way depending on what's actually being tracked: less absorbed fat and calories from the ground form, or more readily available nutrients in other cases, since the same broken structure that lets fat escape also makes some nutrients easier to reach.

This isn't a reason to avoid nut butters, flours, or powders -- they're real, useful, often more convenient forms of the same whole food. It's a reason not to assume gram-for-gram nutrition information for a whole nut and its ground form are interchangeable in practice, even when the reference data says they're similar on paper.`,
  check: (current) => {
    if (current.category !== 'NutSeed') return false;
    const lower = current.baseName.toLowerCase();
    return WHOLE_FOOD_MATRIX_KEYWORDS.some((keyword) => lower.includes(keyword));
  },
};

// High-heat dry cooking and advanced glycation end products (AGEs) --
// already real, cited Digest content (see lib/digest/problemFoods.ts's own
// problem-charred-grilled-meat entry) that had no functional, per-food
// trigger anywhere in the app until now. Deliberately scoped to Meat
// (meat/poultry/fish/seafood, merged 2026-08-05) at a real high-heat dry
// method -- moist-heat methods (Boiled/Steamed/Simmered/Poached) don't
// trigger the same AGE-formation chemistry and are deliberately excluded.
const HIGH_HEAT_DRY_METHODS = new Set(['Grilled', 'Fried', 'Broiled', 'Roasted', 'Baked']);

const HIGH_HEAT_COOKING_RULE: GeneralHealthRule = {
  topicId: 'high-heat-cooking-age',
  title: 'High-Heat Cooking & Advanced Glycation End Products',
  message: `Grilling, frying, broiling, and roasting meat, poultry, or fish at high, dry heat measurably increases advanced glycation end products (AGEs) compared to the same food cooked with moist heat (boiling, steaming, simmering, poaching) -- real, published data finds meat cooked this way can carry several times the AGE content of the identical food cooked more gently. AGEs are linked in the research to increased oxidative stress and inflammatory signaling.

This isn't a case for avoiding grilled or roasted food outright -- it's a real, cited reason to notice that the cooking method itself, not just the ingredient, is part of what's actually being logged, and that moist-heat methods are a genuine lower-AGE alternative when it matters.`,
  check: (current, cookMethod) => current.category === 'Meat' && !!cookMethod && HIGH_HEAT_DRY_METHODS.has(cookMethod),
};

// Portion size, per entry -- explicitly NOT the frequency-over-time
// concept ("you've eaten this too often this week"), which stays Trends'
// job once it exists (see this app's own standing plan). This is a purely
// static, per-entry check: does THIS logged amount, right now, meaningfully
// exceed a sane multiple of the food's own known natural serving. Both
// grams values are optional and supplied by the caller (see
// GeneralHealthPendingIngredient's own comment) -- silently produces no
// match when either is unknown, rather than guessing.
const PORTION_SIZE_MULTIPLE_THRESHOLD = 4;

const PORTION_SIZE_RULE: GeneralHealthRule = {
  topicId: 'portion-size',
  title: 'A Larger Portion Than Usual',
  message: `This entry is several times larger than this food's own typical real-world serving. Larger portions and packages are well-documented (a Cochrane systematic review of 61 studies, Hollands et al. 2015) to measurably increase how much people actually eat, independent of hunger -- not a claim about this specific food being risky, just a real reason a bigger-than-usual amount is worth noticing rather than logging on autopilot.`,
  check: (_current, _cookMethod, quantityGrams, naturalUnitWeightGrams) => {
    if (!quantityGrams || !naturalUnitWeightGrams || naturalUnitWeightGrams <= 0) return false;
    return quantityGrams / naturalUnitWeightGrams >= PORTION_SIZE_MULTIPLE_THRESHOLD;
  },
};

// A real, conservative first food-combination rule, reusing already-cited
// Digest content (lib/digest/nutrientInteractions.ts's own tannins-iron
// entry) rather than new, unverified research -- tannin-rich tea/coffee
// genuinely competes with iron absorption when eaten close together with
// an iron-rich food. Deliberately category/keyword-based, not a nutrient
// lookup, matching this file's own DB-independent design -- Legume is used
// as a real, defensible proxy for "iron-rich" rather than a precise
// per-food iron threshold. Seeded with exactly one pairing on purpose: the
// broader "food combining" theory most of this concern's own folklore
// rests on (foods "fermenting" together in the stomach) doesn't hold up
// under scrutiny, so this registry only encodes specific, individually
// citable pairs, added one at a time as they're actually researched -- not
// a blanket combination system.
function isTanninBeverage(food: GeneralHealthResolvedFood): boolean {
  if (food.category === 'Bev' && (food.subcategory === 'Coffee' || food.subcategory === 'Tea')) return true;
  if (food.category === 'Brewing') {
    const lower = food.baseName.toLowerCase();
    return lower.includes('coffee') || lower.includes('café') || lower.includes('tea') || lower.includes('thé');
  }
  return false;
}

const TANNIN_IRON_RULE: GeneralHealthRule = {
  topicId: 'tannin-iron-combination',
  title: 'Tea/Coffee Alongside an Iron-Rich Food',
  message: `Tannins in tea and coffee bind non-heme iron in the gut, genuinely reducing how much of it gets absorbed when the two are eaten close together -- a real, well-established interaction (see this app's own Nutrient Interactions research on tannins and iron). Legumes are a real, common plant-based iron source where this is worth knowing.

Not a reason to give up either one -- spacing tea or coffee an hour or so away from an iron-rich meal is the real, practical fix already established for this same interaction elsewhere.`,
  check: (current, _cookMethod, _quantityGrams, _naturalUnitWeightGrams, allPendingIngredients) => {
    const currentIsTannin = isTanninBeverage(current);
    const currentIsLegume = current.category === 'Legume';
    if (!currentIsTannin && !currentIsLegume) return false;
    return allPendingIngredients.some((ingredient) => {
      if (currentIsTannin) return ingredient.resolved.category === 'Legume';
      return isTanninBeverage(ingredient.resolved);
    });
  },
};

export const GENERAL_HEALTH_RULES: GeneralHealthRule[] = [
  ALCOHOL_RULE,
  COFFEE_RULE,
  JUICE_RULE,
  RAW_MEAT_RULE,
  WHOLE_FOOD_MATRIX_RULE,
  HIGH_HEAT_COOKING_RULE,
  PORTION_SIZE_RULE,
  TANNIN_IRON_RULE,
];

// Every rule's real, independent match for the CURRENT pending ingredient
// -- unconditional, no mute awareness (see this file's own header
// comment). The caller decides what to do with each match, including
// filtering by mute state.
export function evaluateGeneralHealthRules(
  current: GeneralHealthResolvedFood,
  cookMethod: string | null,
  currentQuantityGrams: number | null,
  currentNaturalUnitWeightGrams: number | null,
  allPendingIngredients: GeneralHealthPendingIngredient[],
): GeneralHealthRuleMatch[] {
  const matches: GeneralHealthRuleMatch[] = [];
  for (const rule of GENERAL_HEALTH_RULES) {
    if (rule.check(current, cookMethod, currentQuantityGrams, currentNaturalUnitWeightGrams, allPendingIngredients)) {
      matches.push({ topicId: rule.topicId, title: rule.title, message: rule.message });
    }
  }
  return matches;
}
