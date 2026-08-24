// The Digest's own content types -- built 2026-08-05 alongside its
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

// Type-only import, erased entirely at compile time -- no real runtime
// circular dependency risk, the same precedent lib/sixDimensionsReference.ts
// -> lib/db.ts already established (see this app's own 2026-08-08 Insights
// Nutrient Ranking entry in CLAUDE.md). Confirmed directly before adding
// this: lib/db.ts imports nothing from lib/digest, and no lib/digest/*.ts
// file imported from lib/db.ts before this.
import type { BuilderFavoriteItemType } from '../db';

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

// RESTRUCTURED 2026-08-08, same day as Psoriasis shipped, direct request:
// "all of the Hashimoto's specific Digest information should be within a
// Hashimoto's area of the Digest, just as the Rheumatoid arthritis has...
// basic health and knowledge everyone should be aware of about their own
// selves and food and vitamins and minerals and interactions should be
// listed in a Basic Health category like the free version will have. Each
// specific autoimmune disease and other than autoimmune disease... need
// each their own areas as well. Self advocacy should also be specific to
// each disease." This collapses what had grown into 20 topic-named
// categories (gutMicrobiome, nutrients, foodAdditives, fermentedFoods,
// labsMedication, lifestyleEnvironment, mitochondriaMetabolism,
// otherAutoimmune, healingStages, organSystems, history,
// nutrientInteractions, foodIndustryHistory, bigPicture, glossary,
// selfAdvocacy, pregnancyFamilyPlanning, complementaryTherapies, plus
// problemFoods as its own type) down to four real areas, matching the
// pattern RA and Psoriasis already established: one area per condition,
// plus one shared Basic Health area for genuinely condition-agnostic
// content. Every one of those 20 old topic files still exists on disk
// (kept for authoring/history clarity, one topic per file remains a
// reasonable way to organize the *source*), but every entry's own
// `category` field was individually reassigned into one of the four keys
// below rather than reused as-is -- see each file's own header comment for
// its specific reassignment reasoning. ProblemFoodEntry's own `category`
// (previously hardcoded to the literal 'problemFoods') was widened to this
// same union so its entries could be sorted the same way; `isProblemFoodEntry`
// switched to a structural check (see below) since `category` no longer
// serves as that type's discriminant.
export const DIGEST_CATEGORY_KEYS = [
  // Condition-agnostic: food additives, food-industry history, nutrient
  // interactions, complementary therapies, the glossary, and every entry
  // from the topic files above whose real underlying science applies
  // regardless of which condition someone has (general gut-barrier
  // biology, general inflammation causes, general fermented-food
  // microbiology, etc.) -- exactly what the Free tier shows under "Food
  // Basics" per this app's own monetization tiers (see CLAUDE.md's
  // "Monetization -- tiers" section), now built as a real structural
  // category rather than a deferred per-entry tag.
  'basicHealth',
  // Hashimoto's: this app's original, deepest-built condition. Every entry
  // whose real content is specific to thyroid physiology, TPO/Tg
  // antibodies, levothyroxine, or Hashimoto's own disease course lives
  // here now -- nutrients, labs & medication timing, healing stages, organ
  // systems (framed around hypothyroidism's own effects), history &
  // milestones, pregnancy & family planning, Other Autoimmune Diseases
  // (corroborating evidence curated FOR a Hashimoto's reader), Big Picture
  // (its own narrative device is a Hashimoto's dosing day), and the
  // Hashimoto's-specific self-advocacy entries split out of the old,
  // single shared Self Advocacy category.
  'hashimotos',
  'rheumatoidArthritis',
  'psoriasis',
  // 2026-08-08, same day, fourth condition, next in the same priority
  // order: Graves' Disease. See graves.ts's own header comment -- the
  // first condition built with its own real self-advocacy content from the
  // start, per the lesson from the same-day restructure above, rather than
  // added in a later pass.
  'graves',
  // 2026-08-08, same day, fifth condition, next in the same priority order:
  // Type 1 Diabetes. See type1Diabetes.ts's own header comment -- a
  // genuinely different shape of condition from every one built so far,
  // where food's own daily relevance is matching carbohydrate intake to
  // insulin dosing rather than triggering or avoiding a flare.
  'type1Diabetes',
  // 2026-08-08, same day, sixth condition, next in the same priority order:
  // Celiac Disease. See celiac.ts's own header comment -- a genuinely
  // different shape of condition again, the one place in this app where a
  // strict diet is the entire treatment, not one lever among several.
  'celiac',
  // 2026-08-08, same day, seventh condition, next in the same priority
  // order: Inflammatory Bowel Disease. See ibd.ts's own header comment --
  // genuinely two diseases (Crohn's and ulcerative colitis) under one
  // umbrella, where several real findings (most sharply the smoking
  // paradox) run in opposite directions depending on which one someone
  // actually has.
  'ibd',
  // 2026-08-08, same day, eighth condition, next in the same priority
  // order: Multiple Sclerosis. See multipleSclerosis.ts's own header
  // comment -- a genuinely different shape of condition again, a disease
  // of the central nervous system directly rather than the gut, joints,
  // skin, or thyroid, where the single strongest finding isn't a food at
  // all but a virus (EBV).
  'multipleSclerosis',
  // 2026-08-08, same day, ninth condition, next in the same priority
  // order: Lupus (SLE). See lupus.ts's own header comment -- a genuinely
  // wide-ranging condition that can affect nearly any organ system, giving
  // this category its own shape: a real, specific individual food trigger
  // (alfalfa sprouts), a real photosensitivity/vitamin D catch-22 unique
  // to this disease, and self-advocacy spanning eyes, kidneys, and the
  // immune system directly.
  'lupus',
  // 2026-08-08, same day, tenth condition, next in the same priority
  // order: Sjögren's Syndrome. See sjogrens.ts's own header comment -- a
  // disease defined by its attack on the exocrine (moisture-making)
  // glands, giving this category a real, direct, same-day relationship
  // with food and drink most other conditions in this app don't share.
  'sjogrens',
  // 2026-08-08, same day, eleventh condition, next in the same priority
  // order: PCOS (Polycystic Ovary Syndrome). See pcos.ts's own header
  // comment -- this app's FIRST genuinely non-autoimmune condition, a real
  // endocrine/metabolic disorder driven centrally by insulin resistance,
  // named directly in CLAUDE.md's own Beyond Hashimoto's research as one
  // of the "9 non-autoimmune candidates."
  'pcos',
  // 2026-08-08, same day, twelfth condition, next in the same priority
  // order: Chronic Kidney Disease. See chronicKidneyDisease.ts's own
  // header comment -- this app's second genuinely non-autoimmune
  // condition, and one whose real dietary management (potassium,
  // phosphorus, sodium, protein) is more directly food-restrictive than
  // almost any other condition here, with a real, honest correction to
  // some of the most commonly repeated CKD dietary advice as its own
  // leading finding.
  'chronicKidneyDisease',
  // 2026-08-08, same day, thirteenth condition, next in the same priority
  // order: Fatty Liver Disease (MASLD). See fattyLiverDisease.ts's own
  // header comment -- this app's third genuinely non-autoimmune
  // condition, built on top of a substantial amount of real, pre-existing
  // liver research already written for a Hashimoto's reader, with a
  // genuinely elegant thyroid-hormone-receptor connection (resmetirom, the
  // first-ever approved MASH drug) tying this category directly back to
  // this app's own core focus.
  'fattyLiverDisease',
  // 2026-08-08, same day, fourteenth condition, next in the same priority
  // order: Type 2 Diabetes. See type2Diabetes.ts's own header comment --
  // this app's fourth genuinely non-autoimmune condition, sitting at the
  // real center of the metabolic-syndrome cluster already built out
  // across PCOS, MASLD, and CKD, with heavy cross-linking to that
  // existing content rather than re-derivation, plus a real, important
  // distinction from Type 1 Diabetes (already built out in this app,
  // genuinely often confused with T2D by name alone).
  'type2Diabetes',
  // 2026-08-08, same day, fifteenth condition, next in the same priority
  // order: Irritable Bowel Syndrome. See ibs.ts's own header comment --
  // this app's fifth genuinely non-autoimmune condition, a real disorder
  // of gut-brain interaction rather than structural intestinal damage,
  // leaning heavily on cross-links to this app's own already-built FODMAP
  // and gut-microbiome content, plus a real, important distinction from
  // IBD (already built out in this app, genuinely often confused with IBS
  // by name alone).
  'ibs',
  // 2026-08-08, same day, sixteenth condition, next in the same priority
  // order: Migraine. See migraine.ts's own header comment -- this app's
  // sixth genuinely non-autoimmune condition, a real neurological disease
  // with its own dedicated, genuinely major medication class (CGRP
  // inhibitors) and a real, honest correction to oversimplified food
  // trigger lists.
  'migraine',
  // 2026-08-08, same day, seventeenth condition, next in the same priority
  // order: Cardiovascular Disease. See cardiovascularDisease.ts's own
  // header comment -- this app's seventh genuinely non-autoimmune
  // condition, already touched from five separate angles across existing
  // content (lupus, Hashimoto's organ systems, PCOS, psoriasis, and RA all
  // reference elevated cardiovascular risk) before this category itself
  // existed to link back to.
  'cardiovascularDisease',
  // 2026-08-08, same day, eighteenth condition: Gout. See gout.ts's own
  // header comment -- this app's eighth genuinely non-autoimmune
  // condition, with an unusually specific, individually well-studied list
  // of real dietary triggers and protective foods.
  'gout',
  // 2026-08-08, same day, nineteenth condition, added directly in response
  // to "Is there any solid reason for prostate health to be included."
  // See prostateHealth.ts's own header comment -- this app's ninth
  // genuinely non-autoimmune condition, and the first one whose real,
  // core evidence includes gut bacteria directly manufacturing the
  // hormones and metabolites (androgens from Ruminococcus, TMAO from
  // choline) that measurably affect the condition itself.
  'prostateHealth',
  // 2026-08-09, added directly alongside 'homeGardening' below, per direct
  // request: "if it doesn't actually have anything specific to do with
  // Basic Health, such as the information about the planet, pollinators,
  // chemical producers, etc., it also needs to be outside of the Basic
  // Health in an area labeled for it. For the Planet stuff and our
  // environment, put it all into a new section called Earth Matters." The
  // entire foodhistory-regen- research cluster (soil, water, pollinators,
  // seed diversity, regenerative-farming case studies, lobbying/policy,
  // food deserts, right-to-repair) plus the original soil-depletion and
  // pesticide entries -- 68 entries in total, all reassigned out of
  // 'basicHealth' the same day -- now live here instead. See
  // foodIndustryHistory.ts's own header comment for the exact reassignment.
  'earthMatters',
  // 2026-08-09, same day, same request, a genuinely new topic rather than a
  // reassignment: "Let's provide information in the Digest... about
  // subsidizing their own food by grown fresh fruits and vegetables at
  // home... include what to grow in the area where they live." See
  // homeGardening.ts's own header comment -- real, cited economic-savings
  // data, and real crop guidance organized by climate zone (US Plant
  // Hardiness Zones plus international equivalents) rather than a
  // personalized feature, since Profile carries no location/zone field to
  // build one against.
  'homeGardening',
  // 2026-08-14 -- a real, new "Recipes" category, direct request: "These
  // meals should all be available as pre-made choices already available to
  // be used in the app, and are automatically available to them from the
  // Digest area, where a new category of Recipes for different kinds of
  // meals will be available." One real DigestEntry per curated_recipes row
  // (see lib/digest/recipes.ts), each linking back to the real builder that
  // can actually construct it (linkedCuratedRecipeId/linkedBuilderType
  // below) via a "Build This Recipe" button. Given the same always-near-the-
  // top placement as basicHealth/earthMatters/homeGardening in
  // purple-digest.tsx's own reorder logic -- a real, discoverable food-
  // building tool, not a disease condition, so grouping it alphabetically
  // among the 19 conditions would bury it.
  'recipes',
  // 2026-08-15 -- two genuinely new categories, direct request: "when a
  // person uses the builders to build their own creations from any of the
  // builders, there should be a place in the Digest where their saved
  // creations are available to see with the same level of detail that you
  // included in the recipes just now. There should be another place that
  // provides the same level for their favorite builds from each category as
  // well as favorite meals." Unlike every other category, these two are NOT
  // static, bundled content -- their real entries are computed live from
  // the person's OWN local data (see lib/digestDynamicEntries.ts), never
  // shipped in lib/digest/*.ts, since there's no way to know ahead of time
  // what anyone will actually build. Given the same always-near-the-top
  // placement as recipes above, right after it -- a real place to browse
  // one's own work, not a disease condition.
  'myKitchen',
  'myFavorites',
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

// 2026-08-15 -- real, detailed recipe content, direct request: "provide a
// list of all ingredients, their individual preparation, and their
// quantities enough for 2 people, with clear instructions... how much it
// makes and serves with a rating of sorts for how much this meal alone
// provides in RDA, with a short indication of things to be aware of if you
// have a condition." A purpose-built optional addition to DigestEntry
// (same pattern as chart/relatedFoodNames/linkedCuratedRecipeId above),
// not a new shape -- a recipe entry still carries a real title/teaser/
// summary/citations/overallTier the same as every other DigestEntry, it
// just has this real, structured detail on top.
export type RecipeIngredientLine = {
  // Pre-formatted, human-readable, e.g. "2 cups broccoli florets, chopped"
  // -- deliberately not split into separate quantity/unit/name fields the
  // UI would have to reassemble, since natural recipe phrasing varies too
  // much dish to dish to force through one rigid template.
  text: string;
};

export type RecipeNutritionHighlight = {
  nutrient: string; // display name, e.g. "Vitamin C"
  // A plain-language statement grounded in a real, computed percentage
  // against this app's own dietary_reference_intakes data, e.g. "About 70%
  // of a day's worth in one bowl" -- never a bare, uncontextualized number.
  note: string;
};

export type RecipeConditionNote = {
  condition: string; // human display name, e.g. "Gout"
  // What to watch for, and, wherever a genuine workaround exists (a swap,
  // a different prep method, a smaller portion), how to actually still
  // enjoy the dish despite it.
  note: string;
};

// The full real tag vocabulary a recipe can carry, computed directly from
// its own real curated_recipe_ingredients rows -- see
// scripts/compute_recipe_diet_tags.js for the exact, auditable rule behind
// every one of these. Exactly one of the first three always applies
// (vegan implies vegetarian-safe, so a vegan dish is tagged Vegan only,
// never both); the rest are independent and a recipe can carry any
// number of them, including none.
export type RecipeDietTag =
  | 'Vegan'
  | 'Vegetarian'
  | 'Omnivore'
  | 'Plant-Based/Flexitarian'
  | 'Mediterranean'
  | 'Gluten-Free'
  | 'Dairy-Free'
  | 'Paleo'
  | 'AIP'
  | 'High-Protein';

export type RecipeCard = {
  // e.g. "Makes about 4 cups, serves 2 generous bowls."
  yield: string;
  // 2026-08-24, direct request: every recipe grouped/identified by real
  // diet compatibility (omnivore/vegetarian/vegan) and by whether it fits
  // several named popular diet philosophies. Computed once, directly from
  // the recipe's own real ingredient categories in the reference
  // database, not eyeballed -- see scripts/compute_recipe_diet_tags.js
  // for the full, auditable rule set and RecipeDietTag's own comment for
  // what "exactly one of the first three" means. Optional only because
  // dynamically-built RecipeCards (a person's own saved/favorited
  // creation, lib/digestDynamicEntries.ts) don't run through that offline
  // classification script -- RecipeCardDetail skips the badge row
  // entirely when absent, the same convention flavorNotes/instructions
  // already use.
  dietTags?: RecipeDietTag[];
  ingredients: RecipeIngredientLine[];
  // One real step per entry, numbered by the UI. Optional, 2026-08-15 --
  // My Kitchen/My Favorites (lib/digestDynamicEntries.ts) build a real
  // RecipeCard for a person's OWN saved/favorited creation too, computed
  // live against this app's own nutrient/DRI/condition data.
  // Updated 2026-08-17: Side Builder now lets a person author their own
  // real steps directly as they build a side (see SideBuilder.tsx's own
  // Steps section, and SideDetail.instructions in lib/db.ts) -- a saved/
  // favorited/shared side genuinely can carry these now. Every other
  // builder still has nothing hand-written to draw on yet, so this stays
  // undefined for them, same as flavorNotes below -- RecipeCardDetail
  // (app/(tabs)/purple-digest.tsx) skips both sections entirely when
  // absent rather than showing an empty one.
  instructions?: string[];
  nutritionHighlights: RecipeNutritionHighlight[];
  // Can be a genuinely empty array -- an honest "nothing in this dish is
  // flagged for any tracked condition" result, not a forced caution.
  conditionNotes: RecipeConditionNote[];
  flavorNotes?: string;
};

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
  // 2026-08-09, built for the Fruits, Vegetables, Nuts & Seeds profile
  // guide: the real `base_name` value(s) in the reference database this
  // entry is actually about, e.g. `['Blueberry', 'Wild Blueberry']`. When
  // set, the entry is only shown once `lib/db.ts`'s own
  // `getVisibleFoodBaseNames()` confirms at least one of these names is
  // still visible (not hidden, and not sitting in a whole-category-hidden
  // bucket) -- "if any of them get hidden in the database... then their
  // information should also disappear," per direct request. Omit entirely
  // for any entry that isn't about one specific, individually pickable
  // food (which is nearly everything else in this Digest).
  relatedFoodNames?: string[];
  // 2026-08-14, built for the new "Recipes" category -- the real
  // curated_recipes.id this entry corresponds to, and which of the 10
  // direct-ingredient Food builders can actually assemble it. Both must be
  // set together (see PurpleDigestScreen's own DigestCard render) for a
  // real "Build This Recipe" button to show; every other entry in this
  // whole Digest leaves both unset, matching how relatedFoodNames/chart
  // stay opt-in rather than retrofitted everywhere.
  linkedCuratedRecipeId?: string;
  linkedBuilderType?: BuilderFavoriteItemType;
  // 2026-08-15, built alongside the "Recipes" category's own real detail
  // pass -- see RecipeCard's own comment above. Set only on the 47 real
  // recipe entries in lib/digest/recipes.ts; every other entry in this
  // whole Digest leaves it unset.
  recipeCard?: RecipeCard;
  // 2026-08-15, built for My Kitchen/My Favorites (lib/digestDynamicEntries.ts)
  // -- the real, plain group name (e.g. "Sides", "Salads", "Favorite
  // Meals") a dynamic entry's own shelf-row should sort under, since the
  // id-prefix/keyword classifiers built for static content
  // (classifyConditionTopic etc.) have nothing real to key off for content
  // that's computed live rather than authored. Unset for every static
  // entry in this whole Digest.
  dynamicGroupLabel?: string;
  // 2026-08-15, built for the same categories -- what a real Schedule/
  // Share/Photo action on this entry should actually act on. A single
  // saved/favorited item (any of the 11 direct-ingredient/dessert
  // builders' own work) carries componentType/componentId; a favorite
  // MEAL carries mealFavoriteId instead, since scheduling/sharing a whole
  // meal already goes through the real, separately-shaped
  // scheduleMeal/encodeMealShareLink path. A real, genuine share someone
  // sent, not yet decided one way or the other (see lib/sharing.ts's own
  // shared_recipes staging table), carries sharedRecipeId instead -- its
  // own componentType is only ever set for a real component-kind share
  // (never a meal-kind one), and it gets a real "Save to My Recipes"/"Save
  // as Favorite"/"Delete" action set rather than Schedule/Share, since
  // there's nothing to schedule or re-share until the person has actually
  // decided what to do with it. Unset for every other entry in this whole
  // Digest.
  dynamicAction?:
    | { kind: 'component'; componentType: BuilderFavoriteItemType; componentId: string }
    | { kind: 'meal'; mealFavoriteId: string }
    | { kind: 'shared'; sharedRecipeId: string; componentType?: BuilderFavoriteItemType };
};

export type ProblemFoodEntry = {
  id: string;
  // Widened 2026-08-08 from the old hardcoded literal 'problemFoods' to the
  // same DigestEntryCategory union DigestEntry uses -- a problem-food entry
  // (raw goitrogenic cruciferous vegetables, say) is just as much
  // Hashimoto's-specific-or-not as a citation-review entry is, and needs
  // sorting into the same basicHealth/hashimotos/per-disease areas. See
  // isProblemFoodEntry below for how the two shapes are now told apart,
  // since `category` can no longer serve as the discriminant.
  category: DigestEntryCategory;
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

// A structural check, not a `category` comparison -- see ProblemFoodEntry's
// own `category` comment for why that field stopped being usable as this
// type's discriminant 2026-08-08. `foodName` is required on ProblemFoodEntry
// and doesn't exist on DigestEntry at all, so this is exact either way.
export function isProblemFoodEntry(entry: AnyDigestEntry): entry is ProblemFoodEntry {
  return 'foodName' in entry;
}
