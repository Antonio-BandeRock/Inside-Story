import { useCallback, useEffect, useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors } from '../constants/colors';
import { NAVIGATION_HAND, useFooterBandHeight } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import {
  getConditionStages,
  getDietaryReferenceIntakesForCurrentUser,
  getFoodIdentity,
  getFoodNutrients,
  getFoodUnitWeight,
  getPreparationMethods,
  getReferenceCategories,
  getReferenceSubcategories,
  getStageFlagScoresForNames,
  isFallbackSource,
  listAvailableHarvests,
  listScannedProducts,
  resolveFoodChoice,
  searchReferenceFoodNames,
  searchReferenceFoodNamesAcrossCategories,
  type DietaryReferenceIntake,
  type FoodNutrient,
  type FoodUnitWeight,
  type GardenHarvest,
  type GlobalFoodMatch,
  type ScannedProductRecord,
} from '../lib/db';
import { buildFoodNameGroups } from '../lib/foodNameGrouping';
import { getStageDeprioritizedNames } from '../lib/foodStageReordering';
import { analyzeNutrientIntake, formatAmount } from '../lib/nutrientAnalysis';
import { useActiveField } from './ActiveInputContext';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { InlineSearchSelectList } from './InlineSearchSelectList';
import { InlineSelectList } from './InlineSelectList';
import { useScreenHeaderHeight } from './ScreenHeader';
import { VoiceInputButton } from './VoiceInputButton';

const NUTRIENT_GROUP_LABELS: Record<string, string> = {
  macro: 'Macronutrients',
  vitamin: 'Vitamins',
  mineral: 'Minerals',
};

// What a caller gets back once every step (Category, Type if this
// category has one, Food, Prep if this food has options) is resolved to a
// single real food row -- see `onFoodResolved` below. foodId/source come
// from resolveFoodChoice, the same resolution getFoodNutrients itself
// depends on, so a caller has a precise reference to one exact row (not
// just a category/name/prep combo that could still be ambiguous -- see
// lib/db.ts's own getFoodNutrients comment on duplicate rows across
// sources) even without ever fetching that row's own nutrients.
export type ResolvedFoodSelection = {
  category: string;
  subcategory: string | null;
  baseName: string;
  prepMethod: string | null;
  foodId: number;
  source: string;
};

// The reference database's own `category` column values are short,
// abbreviated codes (imported straight from the source workbook) -- fine
// for querying (getReferenceSubcategories/searchReferenceFoodNames/
// resolveFoodChoice all key off this exact raw string, which is why
// `category` state itself is never changed), but not what a person should
// have to read. This maps just the DISPLAY side to something readable;
// see categoryLabel() below for the one place every rendered category
// string routes through it. Only categories explicitly asked to be
// relabeled are listed -- anything else (Alcohol, Algae, Baked, Fats,
// Fish, Legume, Sweets) falls through to its own raw value unchanged.
//
// Mixed -> "Mixed Dishes," not "Mixed Vegetables" -- checked directly
// against the reference database (2026-07-27): this category has no
// subcategory breakdown at all, and its actual contents are composite/
// prepared foods (stews, casseroles, salads, sandwiches -- "Spaghetti
// with meat sauce," "Burrito, beef and bean," "Potato salad, homemade"),
// not raw vegetable mixes. This matches USDA's own "Mixed Dishes" food
// group naming for exactly this kind of multi-ingredient composite food.
//
// Dairy -> "Dairy & Eggs" -- also checked directly: there is no separate
// Egg category in this database at all. Every real egg entry (Egg,
// chicken/whole/white/yolk; Eggnog; egg substitute, etc.) is filed under
// Dairy, matching the source data's own USDA-style "Dairy and Egg
// Products" convention -- renamed here so that's discoverable by the
// label itself rather than a real category quietly hiding eggs with no
// hint they're there.
// Exported, 2026-08-08 -- Insights' own new Nutrient Ranking/Safe Foods/
// Healing Stage lenses all need to show a real category name next to a
// food, the same label this file's own picker already uses, rather than
// a second, drifting copy of this same map.
export const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  Bev: 'Beverages',
  // New 2026-08-02 -- dry, not-yet-brewed tea/coffee-type products (instant
  // powder, granules, ground tea), split out of Bev per explicit request:
  // you don't drink these directly, you brew a drink FROM them, unlike
  // everything else left in Bev. See CATEGORY_OVERRIDES' own comment in
  // scripts/build_food_reference_db.py for exactly which rows moved.
  Brewing: 'Brewing & Infusions',
  // New 2026-08-04, explicitly requested: "Mixed Dishes should not have
  // anything in it that is a pre made dish... move them to the area
  // we're using for things that don't meet the criteria for this app."
  // Ties to this file's own "home cooking over commercial/branded
  // products" core-purpose decision -- the intended path for a specific
  // store-bought/branded product is scanning it in (the still-unbuilt
  // barcode feature), not picking a generic commercial reference row to
  // stand in for it. First pass moved 238 high-confidence items (explicit
  // prepackaged/canned/instant-mix/branded/frozen-refrigerated-product
  // signals) out of Mixed; the much larger remaining ambiguous bucket
  // (Germany_BLS dish descriptions with no explicit commercial OR
  // homemade marker either way) is intentionally left for direct review
  // in the Reference Database Audit tool rather than guessed at by
  // keyword. Deliberately excluded from every Food-tab builder's own
  // allowlist, same as Mixed itself.
  CommercialPremade: 'Commercial / Pre-Made',
  Dairy: 'Dairy & Eggs',
  // 2026-08-16 -- the real barcode-scanning feature this file's own
  // CommercialPremade comment above already named as "the still-unbuilt
  // barcode feature." A scanned product's own real identity (see
  // getFoodIdentity's own source==='Scanned' branch in lib/db.ts) always
  // carries this exact category, never one of the reference database's own
  // real codes -- it isn't a genuine getReferenceCategories() row (this
  // whole category is a local-database-only concept), so it never appears
  // in the ordinary Category picker at all; this label only ever shows up
  // wherever a resolved food's own category gets displayed after the fact
  // (e.g. a saved ingredient's own summary row).
  // Relabeled from "My Processed Foods" to "My Food Products," 2026-08-17,
  // direct request to unify this with the same name Food's own My Foods hub
  // tile and FoodLookup's own "From Your Scans" quick-pick section (renamed
  // the same day, see that section's own comment below) both already use
  // for the identical real concept -- one name for one real thing, not
  // three slightly different ones.
  MyProcessedFoods: 'My Food Products',
  Fruit: 'Fruits',
  Grain: 'Grains',
  Herbs: 'Herbs & Seasonings',
  // 2026-08-05, explicitly requested ("Rename the Legume Category to
  // Legumes") -- this category previously had no entry here at all, so
  // categoryLabel()'s own fallback (`?? category`) was showing the raw code
  // "Legume" verbatim.
  Legume: 'Legumes',
  // 'Fish' merged into 'Meat' entirely, 2026-08-05, explicitly requested
  // ("The Fish category belongs in the Animal Protein category, not out on
  // its own.") -- see scripts/build_food_reference_db.py's own
  // reclassify_category()/meat_subcategory() comments for the full
  // mechanism. No display-label entry needed for 'Fish' any more (there was
  // never one here to begin with -- it showed as the raw code "Fish" before
  // this).
  Meat: 'Animal Protein',
  Mixed: 'Mixed Dishes',
  Mushroom: 'Mushrooms',
  NutSeed: 'Nuts & Seeds',
  // New 2026-08-03 -- dry, shelf-stable cooking ingredients never eaten on
  // their own (baking powder, cream of tartar, baker's yeast, gelatine,
  // pectin, agar-agar, Konjac powder), explicitly requested and
  // distinguished from SupplementPowder: "Konjac is not a supplement, it
  // is a cooking ingredient like baking powder would be." See
  // scripts/build_food_reference_db.py's own CATEGORY_OVERRIDES comment
  // for the full reasoning and exactly which rows moved.
  PantryStaples: 'Pantry Staples',
  // New 2026-08-04, explicitly requested ("Please add a Pasta & Noodles
  // Food category"). 204 distinct real products moved here, almost all
  // from Grain (where flour/pasta-adjacent products already lived) plus a
  // handful of real outliers checked individually -- Konjac shirataki
  // noodles, soy/mung-bean glass noodles, and homemade fresh pasta/Japanese
  // starch noodles that had landed in Mixed/Veg via unrelated existing
  // rules. See scripts/build_food_reference_db.py's own CATEGORY_OVERRIDES
  // and reclassify_category() comments for exactly which rows moved and why.
  PastaNoodles: 'Pasta & Noodles',
  // New 2026-08-04, prompted by a "why is [X] sitting in Mixed Dishes"
  // report (tomato sauce, Worcestershire sauce, capers cited directly) --
  // Mixed is deliberately excluded from every Food-tab builder's own
  // allowlist (it's meant for composite prepared dishes), so anything
  // standalone that had been miscategorized into it was unreachable in
  // every builder, not just cluttered browsing. First pass: Australia's
  // own already-correctly-labeled "Sauces, Dressings & Condiments" raw
  // source bucket, plus France_Ciqual's "Culinary Aids & Miscellaneous
  // Ingredients" bucket's own standalone sauces/dressings/dips/pastes/
  // vinegar (the same bucket's raw herbs/spices/seaweed/leavening agents
  // went to their own existing homes -- Herbs/Algae/PantryStaples -- not
  // here). The much larger sweep for standalone sauces hiding inside
  // Mixed's two giant "mostly real composite dishes" buckets is a
  // separate, later pass -- see scripts/build_food_reference_db.py's own
  // CATEGORY_OVERRIDES comment for the full reasoning and what's still
  // left in Mixed on purpose.
  SaucesCondiments: 'Sauces & Condiments',
  Sprouts: 'Sprouts',
  SupplementPowder: 'Supplement Powders',
  Veg: 'Vegetables',
};

export function categoryLabel(category: string): string {
  return CATEGORY_DISPLAY_LABELS[category] ?? category;
}

// Real, named "food group" tiles for the Category step's own top-level
// picker -- 2026-08-17, explicitly requested to read more like a grocery
// store's own aisle layout ("Fresh Produce," "Meat, Seafood & Dairy"...)
// than a flat list of 15-20 individual database categories. Purely a
// display/navigation grouping layered on top of the real category codes
// above -- nothing about how a food is actually stored, scored, or queried
// changes; every real category code (Fruit, Veg, Meat, Dairy, etc.) stays
// exactly as it's always been, and every already-built mechanism that keys
// off those codes (builder allowlists, hidden-category rules, curated-
// recipe ingredients, the audit tool, food-name grouping) needs zero
// changes. Tapping a group tile reveals the real categories inside it as
// the next choice (see buildTopLevelCategoryOptions/groupMemberOptions
// below); picking one of those continues into the existing Subcategory ->
// Food -> Prep flow completely unchanged, same as picking any category
// always has.
//
// Any real category NOT listed in any group here (Alcohol, Bev, Brewing,
// Mixed, Sweets, SupplementPowder) stays its own standalone top-level
// tile, exactly as it already is today -- explicitly decided, not an
// oversight: these didn't fit naturally into a grocery-aisle-style
// grouping the way the other 12 did.
type FoodCategoryGroup = { key: string; label: string; categories: string[] };
const FOOD_CATEGORY_GROUPS: FoodCategoryGroup[] = [
  { key: 'group-fresh-produce', label: 'Fresh Produce', categories: ['Fruit', 'Veg', 'Mushroom', 'Sprouts'] },
  { key: 'group-meat-seafood-dairy', label: 'Meat, Seafood & Dairy', categories: ['Meat', 'Dairy'] },
  { key: 'group-grains-pasta-legumes', label: 'Grains, Pasta & Legumes', categories: ['Grain', 'PastaNoodles', 'Legume'] },
  { key: 'group-pantry-staples', label: 'Pantry & Staples', categories: ['PantryStaples', 'Fats', 'NutSeed', 'Algae'] },
  { key: 'group-sauces-herbs-seasonings', label: 'Sauces, Herbs & Seasonings', categories: ['SaucesCondiments', 'Herbs'] },
];

function isFoodCategoryGroupKey(value: string): boolean {
  return FOOD_CATEGORY_GROUPS.some((group) => group.key === value);
}

// The real categories a given group actually reveals -- intersected with
// whatever `categories` a caller's own allowedCategories restriction left
// available, since a builder that only offers a subset of the database
// (e.g. Beverage Builder never gets Meat) shouldn't ever open a group tile
// onto an empty or partly-missing list.
function groupMembersPresent(groupKey: string, categories: string[]): string[] {
  const group = FOOD_CATEGORY_GROUPS.find((g) => g.key === groupKey);
  if (!group) return [];
  return group.categories.filter((code) => categories.includes(code));
}

function groupLabelFor(groupKey: string): string {
  return FOOD_CATEGORY_GROUPS.find((g) => g.key === groupKey)?.label ?? '';
}

// The Category step's own real, top-level option list -- a real group tile
// for every group with 2+ of its own real categories actually present
// (post allowedCategories filtering), a plain standalone tile (using that
// category's own real, existing label) for anything left over -- a
// category that belongs to no group at all, OR the sole survivor of a
// group whose other members got filtered out (a real, common case: several
// builders only allow one of "Meat, Seafood & Dairy"'s two real members,
// and revealing a whole group tile just to show one single choice inside
// it would be a wasted extra tap for no real benefit). Sorted alphabetized
// by whatever label actually shows, the same single sort order this list
// already used before groups existed -- groups and standalone categories
// read as one coherent alphabetical list together, not "groups first."
function buildTopLevelCategoryOptions(categories: string[]): { label: string; value: string }[] {
  const consumed = new Set<string>();
  const groupOptions: { label: string; value: string }[] = [];
  for (const group of FOOD_CATEGORY_GROUPS) {
    const present = groupMembersPresent(group.key, categories);
    if (present.length >= 2) {
      present.forEach((code) => consumed.add(code));
      groupOptions.push({ label: group.label, value: group.key });
    }
  }
  const standaloneOptions = categories
    .filter((code) => !consumed.has(code))
    .map((code) => ({ label: categoryLabel(code), value: code }));
  return [...groupOptions, ...standaloneOptions].sort((a, b) => a.label.localeCompare(b.label));
}

// The second-level list shown once a real group tile is tapped -- just the
// real categories that group actually revealed (see groupMembersPresent),
// each using its own normal categoryLabel.
function groupMemberOptions(groupKey: string, categories: string[]): { label: string; value: string }[] {
  return groupMembersPresent(groupKey, categories).map((code) => ({ label: categoryLabel(code), value: code }));
}

// Real, human-readable labels for the reference database's own raw
// `source` column values -- 2026-08-11, built for real source attribution
// ("data from any of the datasets should always identify itself as being
// from its host dataset"), starting with Insights' own Nutrient Ranking
// lens (see app/(tabs)/insights.tsx's own renderRow) since that's the one
// place this app already lets someone compare the same nutrient across
// real, different foods -- the builders' own per-ingredient source label
// is real, planned follow-up work, not done in this same pass. 'Derived'
// is the one non-national-agency value (real USDA nutrient figures
// duplicated onto a few aged/unaged spirit variants no source measures
// separately, see scripts/build_food_reference_db.py's own
// SYNTHETIC_SPIRIT_VARIANTS) -- labeled honestly rather than implying a
// real eleventh agency.
const SOURCE_DISPLAY_LABELS: Record<string, string> = {
  USDA: 'USDA (USA)',
  Canada_CNF: 'Canada (CNF)',
  UK_CoFID: 'UK (CoFID)',
  Germany_BLS: 'Germany (BLS)',
  Australia_AFCD: 'Australia (AFCD)',
  France_Ciqual: 'France (Ciqual)',
  Japan_MEXT: 'Japan (MEXT)',
  Norway_Matvaretabellen: 'Norway (Matvaretabellen)',
  Sweden_Livsmedelsverket: 'Sweden (Livsmedelsverket)',
  Derived: 'Derived (from USDA figures)',
};

export function sourceLabel(source: string): string {
  return SOURCE_DISPLAY_LABELS[source] ?? source;
}

// Reported directly by the user, 2026-08-02, while reviewing Bev's own
// Juice subcategory: Japan_MEXT's citrus cultivar names ("Harumi,"
// "Kabosu," "Yuzu," etc.) and its "juice sacs"/"straight fruit juice" fruit
// entries read as unfamiliar and visually noisy (the quotation marks
// specifically) sitting in an otherwise plain alphabetical list -- "We
// could separate them into their own group to identify them as Japanese
// and then remove the quotations." Passed to buildFoodNameGroups as a
// forced (source-based) group, see that function's own comment for why
// this needed a different mechanism than its normal name-pattern grouping.
//
// Keyed by BASE_NAME, not the full `name` column -- a real bug in the
// first version of this dict, caught 2026-08-02 when the person reported
// the quotes were still showing after a full dev-server restart ruled out
// a caching explanation. searchReferenceFoodNames() (lib/db.ts) returns
// `base_name`, not `name` -- the two differ for most of these rows
// (base_name has its prep-method clause like ", raw"/", fresh" already
// split off, and any trailing space trimmed), so a dict keyed by `name`
// never actually matched anything reaching this component; every entry
// silently fell through to the normal, unstripped candidate-key path.
// Confirmed by direct query against the rebuilt database that all 32 of
// these base_names are still exclusively Japan_MEXT-sourced (one row
// each, no other source shares any of them) before rekeying. Deliberately
// excludes "Carrot, regular (European type), juice, canned" and
// "Tomatoes, canned products, juice, without salt" -- confirmed by direct
// query both merge into a base_name ("Carrot juice"/"Tomato juice") that
// USDA/Canada_CNF/Germany_BLS ALSO contribute rows to, so the visible
// entry isn't exclusively Japanese and labeling it that way would
// misrepresent what it actually resolves to.
//
// Values are the display label shown under the "Japanese" header --
// follow-up request the same day: "If it's under the Juice header, we
// shouldn't need the word juice in the name. Let's just have the name of
// the fruit listed." Hand-curated rather than stripped generically, since
// a few names carry a real, meaningful qualifier beyond just "juice" that
// has to survive (Satsuma mandarin's three ripening-stage rows).
//
// Narrowed a second time the same day, per direct correction: "I was
// thinking that the Japanese fruit juices listed would just be those that
// have a Japanese name. All others outside of those that match a USDA or
// other English entry should be used." The first version forced every
// Japan_MEXT-EXCLUSIVE row into this group, which is a different thing
// from a row actually being a distinctively Japanese fruit -- Apple,
// Grape, Grapefruit, Lemon, Lime, Passion Fruit, Pineapple, Navel Orange,
// and Valencia Orange only ended up Japan_MEXT-exclusive in THIS
// database's own source coverage, not because the fruit itself is
// Japanese; grouping them as "Japanese" read as a confusing, unexplained
// duplicate of the same common fruit name (worse once `juice` was added to
// GROUP_STOPWORDS above, since those same common names then also started
// surfacing normally, unlabeled, right alongside their "Japanese" copy).
// "Seminole" was cut for the same reason -- a Florida-bred tangelo named
// for the Seminole people, not a Japanese cultivar; it only had a row here
// because Japan_MEXT happened to be the one source measuring it. Genuinely
// Japanese-named citrus cultivars (Harumi, Hassaku, Hyuga-natsu, Iyo,
// Kabosu, Kawachi-bankan, Kiyomi, Natsudaidai, Sanbokan, Setoka,
// Shiikuwasha, Shiranuhi, Sudachi, Yuzu, Fukuhara, Satsuma) stay -- these
// are the names an English speaker wouldn't otherwise recognize as "just
// an orange," which is the real thing "has a Japanese name" is pointing
// at. The removed entries aren't dropped from the Juice list itself, only
// from this forced group -- they fall back to the same plain
// browsing/candidate-grouping every other juice already gets.
const JUICE_JAPAN_DISPLAY_LABELS: Record<string, string> = {
  'Citrus, "Harumi", juice sacs': 'Harumi',
  'Citrus, "Hassaku", juice sacs': 'Hassaku',
  'Citrus, "Hyuga-natsu", juice sacs': 'Hyuga-natsu',
  'Citrus, "Iyo", juice sacs': 'Iyo',
  'Citrus, "Kabosu", juice, fresh': 'Kabosu',
  'Citrus, "Kawachi-bankan", juice sacs': 'Kawachi-bankan',
  'Citrus, "Kiyomi", juice sacs': 'Kiyomi',
  'Citrus, "Natsudaidai", juice sacs': 'Natsudaidai',
  'Citrus, "Sanbokan", juice sacs': 'Sanbokan',
  'Citrus, "Setoka", juice sacs': 'Setoka',
  'Citrus, "Shiikuwasha", juice, fresh': 'Shiikuwasha',
  'Citrus, "Shiranuhi", juice sacs': 'Shiranuhi',
  'Citrus, "Sudachi", juice, fresh': 'Sudachi',
  'Citrus, "Yuzu", juice, fresh': 'Yuzu',
  'Oranges, Fukuhara-orange, juice sacs': 'Fukuhara Orange',
  'Satsuma mandarins, juice sacs, early ripening type': 'Satsuma Mandarin, Early Ripening',
  'Satsuma mandarins, juice sacs, normal ripening type': 'Satsuma Mandarin, Normal Ripening',
  'Satsuma mandarins, straight fruit juice': 'Satsuma Mandarin',
};

function buildJuiceForcedGroups(
  category: string,
  subcategory: string | null,
): Map<string, { groupLabel: string; displayLabel: string }> | undefined {
  if (category !== 'Bev' || subcategory !== 'Juice') return undefined;
  const map = new Map<string, { groupLabel: string; displayLabel: string }>();
  for (const [name, displayLabel] of Object.entries(JUICE_JAPAN_DISPLAY_LABELS)) {
    map.set(name, { groupLabel: 'Japanese', displayLabel });
  }
  return map;
}

// General food browser -- category -> optional type -> food -> optional
// prep method -> a full per-100g/per-portion/%RDA nutrient table. Built
// first for Insights' own Food Lookup lens (app/(tabs)/insights.tsx), then
// pulled out here 2026-07-27 as the shared template every future
// lookup-style screen reuses -- `tabColor` is the only thing that varies
// per caller, so each page's own identity color still shows through
// everywhere this used to hardcode Insights' own teal.
export function FoodLookup({
  tabColor,
  title,
  showNutrients = true,
  onFoodResolved,
  topReserve = 0,
  squareTop = false,
  initialCategory = '',
  initialSubcategory = null,
  allowedCategories,
  allowedSubcategories,
  allowHarvestPick = true,
  restrictToSource,
}: {
  tabColor: string;
  // An optional page-level heading above the Category step (e.g. Food's
  // own Side Builder passes "Side Dish Builder") -- Insights' own Food
  // Lookup lens leaves this unset, since PageIdentityLabel already names
  // that page elsewhere. Counted into every list/table height below
  // (TITLE_HEIGHT) the same way a resolved summary row already is -- this
  // component owns all of its own layout math, so any extra content it
  // renders above the picker has to be accounted for here, not left for
  // the caller to compensate for externally.
  title?: string;
  // false for callers that only need to know WHICH food was picked, not
  // its nutrition -- Side Builder (app/(tabs)/food.tsx's own
  // components/SideBuilder.tsx), which builds a side from ingredients and
  // quantities, deliberately doesn't duplicate Insights' own Food Lookup
  // lens's nutrient table. Skips fetching nutrients/unit weight entirely
  // (not just hiding the table after fetching it anyway) -- no reason to
  // pay for a lookup nothing on screen will show. Defaults true, so every
  // existing caller (Insights) is unaffected.
  showNutrients?: boolean;
  // Required when showNutrients is false -- the only way a caller finds
  // out a selection actually completed, since there's no table to signal
  // it visually. Fires once, the moment Category(+Type)+Food(+Prep) are
  // all resolved to one real row -- see ResolvedFoodSelection's own
  // comment for why this includes a real foodId/source, not just the raw
  // picks.
  onFoodResolved?: (resolved: ResolvedFoodSelection) => void;
  // Extra vertical space already used up by something the CALLER renders
  // above this component that isn't `title` -- e.g. SideBuilder.tsx's own
  // connected Dish/Ingredients summary card, which sits directly above a
  // connected FoodLookup with no gap between them. Folded into every
  // list/table height below exactly like `title`'s own TITLE_HEIGHT is, so
  // this component's internal layout math stays the single source of
  // truth for how much room its own lists actually have, rather than the
  // caller needing to separately clip/scroll it from outside.
  topReserve?: number;
  // Squares off the Category step's own top corners (whichever of
  // InlineSelectList or its "picked" summary row is currently showing --
  // Category is always the first thing this component renders when
  // `title` is unset) -- for a caller that sits this component directly
  // beneath another box of its own with no gap, so the two read as one
  // continuous connected unit at that seam. Only Category ever needs this:
  // every step after it stacks below Category's own (already-resolved)
  // summary row, never at this component's own top edge.
  squareTop?: boolean;
  // Seeds Category(+Type) already resolved, rather than starting blank --
  // 2026-07-28, for SideBuilder.tsx's own connected picker specifically:
  // this component always fully remounts between ingredients (a fresh
  // instance each time, see SideBuilder's own comment on why), so without
  // this every single ingredient -- and tapping "Change Food" on one
  // already picked -- landed back on a blank Category list even when the
  // obvious next ingredient is in the exact same category (a side dish's
  // second, third, ... vegetable, say). Only ever used to seed this
  // component's own initial useState -- not a true controlled prop (no
  // onChange going back out mid-session), which is enough here since a
  // fresh mount is the only time these values are ever read.
  initialCategory?: string;
  initialSubcategory?: string | null;
  // Restricts the Category step to a curated subset of the reference
  // database's own 19 raw category codes (e.g. ['Bev', 'Alcohol'] for
  // Beverage Builder) -- 2026-08-02, so each Food-tab builder only ever
  // offers categories someone would actually put in that kind of dish,
  // instead of the same full list (raw meats included) regardless of
  // whether the builder is a smoothie or a side dish. Undefined (the
  // default) means unrestricted -- Insights' own Food Lookup lens, a
  // general-purpose "look up any food" tool, deliberately never passes
  // this and keeps seeing the full list.
  allowedCategories?: string[];
  // Gates this component down to exactly ONE of its three "before Category
  // is picked" quick-start sections -- 2026-08-17, direct request: Side
  // Builder's own new "Add Ingredients" chooser (see SideBuilder.tsx) opens
  // this component already committed to one specific method (voice search,
  // the My Food Products quick-pick, or ordinary Whole Foods category
  // browsing), rather than showing all three stacked at once the way every
  // other/default caller still does. undefined (the default) means
  // unrestricted -- every existing caller (Insights' own Food Lookup lens,
  // Garden's harvest logging, every builder not yet updated to use this)
  // keeps seeing the original, unrestricted layout.
  //
  //   'voice'    -- only "Say a Food Name" (skips From Your Harvest/From
  //                 Your Scans and the plain Category list entirely, until
  //                 a real match resolves `category`, at which point the
  //                 normal downstream Subcategory/Food/Prep steps take over
  //                 exactly as they would for any other selection method).
  //   'products' -- only "My Food Products" (the scanned-item quick-pick,
  //                 formerly "From Your Scans"), shown even when empty
  //                 (with an honest "nothing scanned yet" note) since the
  //                 person explicitly chose this method.
  //   'category' -- "From Your Harvest" (if any) plus the ordinary Whole
  //                 Foods category browser -- everything the default view
  //                 already shows MINUS the voice search and My Food
  //                 Products sections. Harvest picking isn't its own,
  //                 separate chooser option in Side Builder's new 3-way
  //                 list (Say a Food Name / My Food Products / Whole
  //                 Foods) -- a home-grown harvest is still a real whole
  //                 food, so it stays folded into this mode rather than
  //                 needing a fourth chooser button nobody asked for.
  restrictToSource?: 'voice' | 'products' | 'category';
  // A real, finer-grained companion to allowedCategories -- 2026-08-13, for
  // Food's own new Beverage subtype picker (see food.tsx's own comment):
  // "Juices & Nectars" needs Bev restricted down to just its own Juice
  // subcategory, not every real Bev subcategory (Water, Tea, Coffee, etc.),
  // and "Hydration & Wellness" needs a genuinely different, narrower subset
  // of that same category's own subcategories (Water, Sports & Energy
  // Drinks) -- allowedCategories alone can only restrict at the CATEGORY
  // level, not this one level deeper. Keyed by category code, restricting
  // that category's own subcategory list to only the given values when
  // present; a category with no entry here (or no real subcategories at
  // all, e.g. Brewing) is completely unaffected. Same "read once at mount,
  // never a live-changing controlled prop" convention as allowedCategories
  // above -- undefined (the default) means every real subcategory stays
  // offered, so every existing caller is unaffected.
  allowedSubcategories?: Partial<Record<string, string[]>>;
  // Suppresses "From Your Harvest" entirely (both the fetch and the
  // section itself) -- 2026-08-13, direct report/fix: the Garden tab's own
  // Harvest Log lens embeds this component specifically to log a NEW
  // harvest, where surfacing previously-logged harvest inventory as a
  // quick-pick reads as circular ("pick from your harvest" while you're in
  // the middle of recording one). Defaults true, so every existing caller
  // (all 11 Food builders) is unaffected.
  allowHarvestPick?: boolean;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  // Which real "food group" tile (see FOOD_CATEGORY_GROUPS above) is
  // currently opened, revealing its own real categories as the next
  // choice -- null means "show the top-level group/category grid," never
  // reflects a real category or subcategory itself. Purely a navigation
  // concern for the Category step's own render below; nothing downstream
  // of `category` being set ever reads this.
  const [categoryGroupKey, setCategoryGroupKey] = useState<string | null>(null);
  const [category, setCategory] = useState(initialCategory);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState<string | null>(initialSubcategory);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodNameOptions, setFoodNameOptions] = useState<string[]>([]);
  // Healing Stages reordering, 2026-08-09 -- see lib/foodStageReordering.ts's
  // own top comment for the full feature history. conditionStages loads
  // once on mount (a person's own declared stages don't change mid-browse);
  // deprioritizedNames recomputes whenever the currently-rendered name list
  // does. Both stay at their real, empty defaults -- meaning zero extra
  // queries and zero behavior change -- for the overwhelmingly common case
  // of nobody having declared a stage at all.
  const [conditionStages, setConditionStages] = useState<Record<string, string>>({});
  const [deprioritizedNames, setDeprioritizedNames] = useState<Set<string>>(new Set());
  const [baseName, setBaseName] = useState('');
  const [prepMethods, setPrepMethods] = useState<string[]>([]);
  const [prepMethod, setPrepMethod] = useState<string | null>(null);
  // True from the moment a new baseName is picked until its own prep-method
  // list (and Raw default, see below) has actually loaded -- 2026-08-02,
  // fixes a real race: the resolve effect further down used to fall back to
  // "prepMethods.length > 0" (left over from the PREVIOUS food) to decide
  // whether it was safe to resolve yet. When the previous food had no prep
  // choices to disambiguate, that stale zero-length let the resolve effect
  // fire immediately for the new food too, with prepMethod still null --
  // resolveFoodChoice then had no "Raw" to match, fell back to whichever row
  // has no prep_method at all, and for foods like Sweet Pepper that's a
  // canned variant (lowest food_id among the untagged rows), not the raw
  // vegetable. In showNutrients=false mode (SideBuilder etc.) that wrong
  // first resolution fires onFoodResolved and the caller swaps this
  // component away immediately, so the later correct Raw re-resolve never
  // gets a chance to run. Gating on this flag instead of list length makes
  // the resolve effect wait for the CURRENT baseName's own real answer.
  const [prepMethodsLoading, setPrepMethodsLoading] = useState(false);
  const [nutrients, setNutrients] = useState<FoodNutrient[] | null>(null);
  // A real, cited typical-serving weight for this exact resolved food (see
  // getFoodUnitWeight's own comment) -- null for the (currently large)
  // majority of foods without one on file, in which case the table falls
  // back to plain per-100g amounts rather than inventing a serving size.
  const [unitWeight, setUnitWeight] = useState<FoodUnitWeight | null>(null);
  // Which real source this resolution actually landed on -- 2026-08-11,
  // real source attribution for showNutrients=true (Insights' own Food
  // Lookup lens; the showNutrients=false/builder path already gets this
  // for free via onFoodResolved's own `source` field, already passed
  // through into every builder's pendingResolved). Only meaningfully
  // differs from "USDA" once resolveFoodChoice's own new USDA-preference
  // tiebreaker (lib/db.ts) falls back to a non-USDA source for a food
  // that USDA genuinely doesn't have -- see isFromFallbackSource below.
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  // What the person actually plans to eat, by weight -- the whole reason
  // this exists: amounts/DRI% below should reflect THIS, not a fixed
  // reference amount the person has no say over. Reset to a sensible
  // default (the known serving's own weight, or 100g when none is on file)
  // every time a new food resolves -- see the effect below -- but otherwise
  // freely editable.
  const [portionGrams, setPortionGrams] = useState('100');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Resolved once against the person's own saved profile (sex/age), not
  // per food -- reused for whatever food gets looked up. Comes back as
  // more than one row per nutrient only when the profile is incomplete
  // (see getDietaryReferenceIntakesForCurrentUser's own comment) -- handled
  // in the render below by showing every matching percentage rather than
  // guessing which one applies.
  const [driRows, setDriRows] = useState<DietaryReferenceIntake[]>([]);

  useEffect(() => {
    getDietaryReferenceIntakesForCurrentUser().then(setDriRows);
  }, []);

  // "From Your Harvest" -- 2026-08-13, real, unused garden-harvest inventory
  // (see lib/db.ts's own listAvailableHarvests) surfaced as a genuine
  // quick-pick, offered ABOVE the ordinary Category step rather than folded
  // into it, so a real harvest is always the fastest path to picking
  // something you already grew. Scoped deliberately to showNutrients=false
  // callers with a real onFoodResolved (every one of the 11 Food builders,
  // via their own connected FoodLookup) -- Insights' own general-purpose,
  // showNutrients=true Food Lookup lens has no onFoodResolved contract to
  // resolve straight into, and wiring a harvest pick into its own fuller
  // nutrient-table flow is real, separate work, not attempted here. Loaded
  // once per mount, same "read once, not a live-updating subscription"
  // convention as driRows above -- a harvest logged mid-session while this
  // exact instance is already open won't appear until the next fresh mount
  // (every builder's own connected FoodLookup already remounts fresh per
  // ingredient, so this is rarely more than a few seconds stale in practice).
  const [availableHarvests, setAvailableHarvests] = useState<GardenHarvest[]>([]);
  useEffect(() => {
    if (onFoodResolved && !showNutrients && allowHarvestPick) {
      listAvailableHarvests().then(setAvailableHarvests);
    }
  }, [onFoodResolved, showNutrients, allowHarvestPick]);

  // Resolves a tapped harvest straight into a real ResolvedFoodSelection via
  // getFoodIdentity -- the exact same "reconstruct a full selection from
  // just a stored foodId/source" mechanism SideBuilder's own Edit flow
  // already relies on (see that function's own comment in lib/db.ts), not a
  // second, separate resolution path. Bypasses this component's own
  // Category/Type/Food/Prep state entirely -- deliberately: the harvest
  // record already names one exact, concrete reference-database row, so
  // there's nothing left to disambiguate.
  async function handlePickHarvest(harvest: GardenHarvest) {
    const identity = await getFoodIdentity(harvest.foodId, harvest.source);
    if (!identity) return;
    onFoodResolved?.({
      category: identity.category,
      subcategory: identity.subcategory,
      baseName: identity.baseName,
      prepMethod: identity.prepMethod,
      foodId: harvest.foodId,
      source: harvest.source,
    });
  }

  // "From Your Scans" -- 2026-08-16, the real "My Processed Foods" quick-
  // pick, same real shape as "From Your Harvest" just above (a small, flat,
  // locally-sourced list resolved straight through getFoodIdentity,
  // bypassing Category/Type/Food/Prep entirely -- a scanned product names
  // one exact record already, nothing left to disambiguate). Reuses the
  // identical scoping (showNutrients=false + a real onFoodResolved, i.e.
  // every builder's own connected FoodLookup) and the same allowHarvestPick
  // gate this file already uses for the harvest section, since the same
  // real reason applies: the Harvest Log lens (and, symmetrically, the
  // scan-a-product screen itself) shouldn't offer to add its own
  // in-progress record back into itself while creating it.
  const [availableScannedProducts, setAvailableScannedProducts] = useState<ScannedProductRecord[]>([]);
  useEffect(() => {
    if (onFoodResolved && !showNutrients && allowHarvestPick) {
      listScannedProducts(20).then(setAvailableScannedProducts);
    }
  }, [onFoodResolved, showNutrients, allowHarvestPick]);

  async function handlePickScannedProduct(product: ScannedProductRecord) {
    const identity = await getFoodIdentity(product.id, 'Scanned');
    if (!identity) return;
    onFoodResolved?.({
      category: identity.category,
      subcategory: identity.subcategory,
      baseName: identity.baseName,
      prepMethod: identity.prepMethod,
      foodId: product.id,
      source: 'Scanned',
    });
  }

  // "Say a food name," 2026-08-16 -- the real, direct answer to "add
  // broccoli without having to drill down into the groupings to find
  // where broccoli will be." null means no voice search is currently
  // showing results (the normal Category list renders); a real array
  // (even empty, meaning "searched, found nothing") replaces it with
  // this instead. Deliberately never auto-jumps straight to a single
  // match without a real tap to confirm it first -- speech recognition
  // is imperfect enough that a misheard word silently committing to the
  // wrong food would be a real, worse outcome than one extra tap.
  const [globalVoiceQuery, setGlobalVoiceQuery] = useState('');
  const [globalVoiceResults, setGlobalVoiceResults] = useState<GlobalFoodMatch[] | null>(null);
  const [globalVoiceLoading, setGlobalVoiceLoading] = useState(false);
  // True for the brief real gap between "a voice match was tapped" and
  // "onFoodResolved actually fires" -- resolving still needs two more real
  // async steps (getPreparationMethods, then resolveFoodChoice), and
  // without this, the Category/Subcategory/Food summary rows this same
  // tap just set would render, plainly visible, for that whole gap before
  // vanishing again. Direct report, 2026-08-17: "these seem like something
  // that the user shouldn't actually see during that transition" -- real,
  // because manual step-by-step navigation builds those rows up one at a
  // time on purpose (seeing each one is the point), but a voice pick sets
  // all three at once, so the same rows reappearing here are just a
  // rendering artifact of shared state, not anything meant to be shown.
  // Scoped to the voice path specifically, not resolution in general --
  // manual navigation's own resolving gap (after tapping a food name by
  // hand) is untouched, since hiding a person's own just-confirmed
  // Category/Subcategory rows there would be the real regression.
  const [resolvingFromVoice, setResolvingFromVoice] = useState(false);

  async function handleGlobalVoiceResult(transcript: string, isFinal: boolean) {
    if (!isFinal || !transcript.trim()) return;
    setGlobalVoiceQuery(transcript);
    setGlobalVoiceLoading(true);
    const matches = await searchReferenceFoodNamesAcrossCategories(transcript, allowedCategories);
    setGlobalVoiceResults(matches);
    setGlobalVoiceLoading(false);
  }

  function clearGlobalVoiceResults() {
    setGlobalVoiceResults(null);
    setGlobalVoiceQuery('');
  }

  // Jumps Category/Type/Food straight to an already-known answer,
  // skipping every intermediate step a person would otherwise have to
  // tap through by hand -- the whole point of this feature. Prep still
  // resolves normally afterward (the existing effect keyed on
  // [category, subcategory, baseName] fires the same way it would for a
  // hand-picked food), so a food with real prep options still gets that
  // one real remaining question.
  function selectGlobalMatch(match: GlobalFoodMatch) {
    setResolvingFromVoice(true);
    setCategory(match.category);
    setSubcategory(match.subcategory);
    setFoodQuery('');
    setBaseName(match.baseName);
    setPrepMethod(null);
    setNutrients(null);
    clearGlobalVoiceResults();
  }

  // Category/Type are done (whether or not this category even has a Type
  // step) once this is true -- the Food step only ever renders/mounts once
  // this flips. Category, Type, and Food are all plain inline content now
  // (see InlineSelectList.tsx/InlineSearchSelectList.tsx's own comments) --
  // none of them need a "wait for layout, then arm autoFocus" dance the
  // way the old Dropdown-based version of this step did, since there's no
  // measured position left to protect. Food's search box still autofocuses
  // (see InlineSearchSelectList.tsx) -- that's AppTextInput's own plain,
  // standard `autoFocus` prop, unrelated to Dropdown's custom
  // measureInWindow timing.
  const categoryConfirmed = category !== '' && (subcategories.length === 0 || subcategory !== null);

  // A fixed, deterministic height for whichever step's own list is
  // currently active -- computed from known constants (header height,
  // footer band height, AppKeyboard's own height), never from measuring
  // any actual rendered element, so it can't be wrong the way the old
  // Dropdown menu's measured position repeatedly was. Fills from just
  // below the header down to just above TabHub's own floating button (or,
  // for Food specifically, down to AppKeyboard's own top edge instead --
  // its search box keeps that keyboard raised the whole time its own list
  // is showing, so reserving only the footer would let the list extend
  // in underneath it).
  const { height: windowHeight } = useWindowDimensions();
  const headerHeight = useScreenHeaderHeight();
  const footerBandHeight = useFooterBandHeight();
  const activeField = useActiveField();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  // Every already-resolved step above the currently active list renders as
  // a fixed-height summary row (see the render below) instead of its own
  // list -- each one eats into how much room the active list actually has,
  // so this counts them to shrink its height by exactly that much rather
  // than assuming the active list is always the first thing on screen.
  // 34/2, down from 46/3, 2026-07-28 -- summaryRow's own paddingVertical
  // shrank to match (see its own style comment), and this constant has to
  // track that real height exactly, or the math below would keep
  // reserving the OLD, larger amount of space and undo the point of
  // shrinking it in the first place.
  const SUMMARY_ROW_HEIGHT = 34;
  const SUMMARY_ROW_GAP = 2;
  let precedingSummaryRows = 0;
  if (category !== '') precedingSummaryRows += 1;
  if (subcategories.length > 0 && subcategory !== null) precedingSummaryRows += 1;
  if (categoryConfirmed && baseName !== '') precedingSummaryRows += 1;
  const precedingRowsHeight = precedingSummaryRows * (SUMMARY_ROW_HEIGHT + SUMMARY_ROW_GAP);

  const topGap = 5;
  const listBottomMargin = 10;
  // Reserves room for the optional `title` heading above -- 0 when unset,
  // so a caller that doesn't pass one (Insights' own Food Lookup lens)
  // sees no change at all. Estimated, not measured, same reasoning as
  // every other fixed size in this file -- titleBar's own paddingVertical
  // (10*2) + its text's line height (~22 for fontSize 18) + its top border
  // (2, the bottom border is overlapped away by its own negative margin).
  const TITLE_HEIGHT = 44;
  const titleHeight = title ? TITLE_HEIGHT : 0;
  const categoryListHeight = Math.max(
    150,
    windowHeight - headerHeight - footerBandHeight - topGap - titleHeight - topReserve - precedingRowsHeight - listBottomMargin,
  );
  // Real height of the "‹ Food Groups" back row shown above a group's own
  // real-category list (see categoryGroupKey's own comment above) -- built
  // from the same borderWidth/paddingVertical recipe as summaryRow, so it
  // renders at the same real height; reused here rather than a second
  // magic number that could quietly drift from the actual row.
  const GROUP_BACK_ROW_HEIGHT = SUMMARY_ROW_HEIGHT + SUMMARY_ROW_GAP;
  const groupSubListHeight = Math.max(150, categoryListHeight - GROUP_BACK_ROW_HEIGHT);
  // Food's own list specifically -- also reserves AppKeyboard's full height
  // (see this block's own comment above for why).
  const foodListHeight = Math.max(
    150,
    windowHeight -
      headerHeight -
      footerBandHeight -
      KEYBOARD_HEIGHT -
      topGap -
      titleHeight -
      topReserve -
      precedingRowsHeight -
      listBottomMargin,
  );
  // Same idea again for the nutrient results table (a fixed box so only
  // that box scrolls internally -- see its own SectionList below -- rather
  // than the whole page). Also counts the Prep summary row, which the two
  // heights above never need to: nothing before Prep resolves depends on
  // its height, but by the time the table shows, Prep (if this food had
  // any prep options) is already a resolved summary row above it.
  let resolvedRowsForTable = precedingSummaryRows;
  if (prepMethods.length > 0 && prepMethod !== null) resolvedRowsForTable += 1;
  const resolvedRowsHeightForTable = resolvedRowsForTable * (SUMMARY_ROW_HEIGHT + SUMMARY_ROW_GAP);
  // Unlike Category/Food's own lists above -- which are only ever shown
  // while their search box keeps AppKeyboard permanently risen -- the
  // table's Portion field can be dismissed (the search row's green
  // checkmark) while the table itself stays on screen. Only reserve
  // AppKeyboard's height while it's actually up, so the table grows back
  // down to the footer once it's gone rather than leaving a permanent gap.
  const keyboardReserve = activeField ? KEYBOARD_HEIGHT : 0;
  const tableHeight = Math.max(
    200,
    windowHeight -
      headerHeight -
      footerBandHeight -
      keyboardReserve -
      topGap -
      titleHeight -
      topReserve -
      resolvedRowsHeightForTable -
      listBottomMargin,
  );

  useEffect(() => {
    getReferenceCategories().then((rows) =>
      setCategories(allowedCategories ? rows.filter((row) => allowedCategories.includes(row)) : rows),
    );
    // allowedCategories is read once at mount, same as initialCategory/
    // initialSubcategory above -- this component always fully remounts
    // rather than receiving live prop updates (see initialCategory's own
    // comment), so there's nothing for a live dependency to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Healing Stages reordering -- loaded once, same reasoning as
  // getReferenceCategories above: a person's own declared stages don't
  // change while this screen is open.
  useEffect(() => {
    let cancelled = false;
    getConditionStages().then((stages) => {
      if (!cancelled) setConditionStages(stages);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      return;
    }
    let cancelled = false;
    getReferenceSubcategories(category).then((rows) => {
      if (cancelled) return;
      const allowed = allowedSubcategories?.[category];
      setSubcategories(allowed ? rows.filter((row) => allowed.includes(row)) : rows);
    });
    return () => {
      cancelled = true;
    };
    // allowedSubcategories is read once per category the same way
    // allowedCategories is read once at mount -- a fixed restriction, not a
    // live-changing controlled prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    // A category with real sub-categories needs one picked first -- listing
    // foods across every type in a category before that would mix foods
    // that don't actually belong together for this search.
    if (!category || (subcategories.length > 0 && !subcategory)) {
      setFoodNameOptions([]);
      return;
    }
    let cancelled = false;
    searchReferenceFoodNames(category, subcategory, foodQuery).then((names) => {
      if (!cancelled) setFoodNameOptions(names);
    });
    return () => {
      cancelled = true;
    };
  }, [category, subcategory, subcategories.length, foodQuery]);

  // Healing Stages reordering -- recomputes whenever the currently
  // rendered name list does. Short-circuits to a real, empty Set with no
  // extra query at all whenever nobody's declared a stage (the common
  // case) or there's nothing to check yet -- see
  // lib/foodStageReordering.ts's own top comment for the full "why this
  // is safe to leave running" reasoning.
  useEffect(() => {
    if (Object.keys(conditionStages).length === 0 || foodNameOptions.length === 0) {
      setDeprioritizedNames(new Set());
      return;
    }
    let cancelled = false;
    getStageFlagScoresForNames(category, subcategory, foodNameOptions).then((scoresByName) => {
      if (cancelled) return;
      setDeprioritizedNames(getStageDeprioritizedNames(scoresByName, conditionStages));
    });
    return () => {
      cancelled = true;
    };
  }, [category, subcategory, foodNameOptions, conditionStages]);

  useEffect(() => {
    if (!baseName) {
      setPrepMethods([]);
      setPrepMethodsLoading(false);
      return;
    }
    let cancelled = false;
    setPrepMethodsLoading(true);
    getPreparationMethods(category, subcategory, baseName).then((methods) => {
      if (cancelled) return;
      setPrepMethods(methods);
      // Default to Raw when it's a real option, 2026-08-01 -- explicitly
      // requested: this app should assume raw/whole/unprocessed by
      // default, not leave every food's prep state as an unguided,
      // alphabetically-sorted tap. Without this, "Boiled" sorts before
      // "Raw" and "Canned" carries no visual signal that it's the wrong
      // pick for someone who just wants the plain vegetable -- confirmed
      // as a real problem, not hypothetical: reported directly, sweet
      // peppers and carrots both ended up resolved to their canned
      // variant. Still just a normal resolved field afterward, exactly
      // like a person picking it themselves -- "Change" (below) reopens
      // the full list for anyone who deliberately wants Boiled/Canned/
      // Dried/etc, e.g. Insights' own Food Lookup lens comparing prep
      // states on purpose.
      // A single real option -- however it's actually labeled ('Raw',
      // 'Dried', whatever this food's own only tagged state is) -- is
      // auto-selected the same way 'Raw' already was, 2026-08-02: with
      // getPreparationMethods now returning that one real value instead of
      // silently swallowing it (see that function's own comment), there's
      // no real choice to present for exactly one option regardless of its
      // name, and leaving it null would resolve against the wrong (empty)
      // prep_method again.
      setPrepMethod(methods.includes('Raw') ? 'Raw' : methods.length === 1 ? methods[0] : null);
      setPrepMethodsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [category, subcategory, baseName]);

  useEffect(() => {
    if (!baseName || prepMethodsLoading || (prepMethods.length > 0 && !prepMethod)) {
      setNutrients(null);
      setUnitWeight(null);
      setResolvedSource(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrorMessage('');
    resolveFoodChoice(category, subcategory, baseName, prepMethod)
      .then((resolved) => {
        if (cancelled) return null;
        if (!resolved) {
          setErrorMessage("Couldn't find that food.");
          setResolvingFromVoice(false);
          return null;
        }
        // showNutrients: false -- report the resolved selection outward
        // instead of fetching anything nobody will see. The caller is
        // expected to swap this component out the instant this fires (see
        // onFoodResolved's own comment), so there's nothing more for this
        // effect to do here.
        if (!showNutrients) {
          setResolvingFromVoice(false);
          onFoodResolved?.({
            category,
            subcategory,
            baseName,
            prepMethod,
            foodId: resolved.foodId,
            source: resolved.source,
          });
          return null;
        }
        setResolvedSource(resolved.source);
        return Promise.all([
          getFoodNutrients(resolved.foodId, resolved.source),
          getFoodUnitWeight(resolved.foodId, resolved.source),
        ]);
      })
      .then((result) => {
        if (cancelled || !result) return;
        const [rows, weight] = result;
        setNutrients(rows);
        setUnitWeight(weight);
        setPortionGrams(weight ? String(Math.round(weight.gramsPerUnit)) : '100');
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(`Could not load nutrients: ${error instanceof Error ? error.message : String(error)}`);
        setResolvingFromVoice(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategory, baseName, prepMethod, prepMethods.length, prepMethodsLoading, showNutrients]);

  function selectCategory(next: string) {
    setCategory(next);
    // Irrelevant the moment a real category is set (see this state's own
    // comment -- the whole group/category grid this drives is hidden once
    // category !== ''), but reset here too for the same reason
    // changeCategory resets it below: nothing should ever read a stale
    // value from a previously-opened group.
    setCategoryGroupKey(null);
    setSubcategory(null);
    setFoodQuery('');
    setBaseName('');
    setPrepMethod(null);
    setNutrients(null);
  }

  function selectSubcategory(next: string) {
    setSubcategory(next);
    setFoodQuery('');
    setBaseName('');
    setPrepMethod(null);
    setNutrients(null);
  }

  function selectBaseName(next: string) {
    setBaseName(next);
    setPrepMethod(null);
    setNutrients(null);
  }

  // "Change" on the Category summary row (see the render below) -- brings
  // back the plain inline list instead of the summary, resetting every
  // downstream step the same way picking a genuinely different category
  // would.
  function changeCategory() {
    setCategory('');
    // "Change" is a full restart of category selection, same as everything
    // else this function already resets -- always lands back on the
    // top-level group/category grid, never re-opens whichever group
    // happened to be showing the last time this step was visible.
    setCategoryGroupKey(null);
    setSubcategory(null);
    setSubcategories([]);
    setFoodQuery('');
    setFoodNameOptions([]);
    setBaseName('');
    setPrepMethods([]);
    setPrepMethod(null);
    setNutrients(null);
  }

  // Same idea, scoped to just the Type step -- Category stays picked.
  function changeSubcategory() {
    setSubcategory(null);
    setFoodQuery('');
    setFoodNameOptions([]);
    setBaseName('');
    setPrepMethods([]);
    setPrepMethod(null);
    setNutrients(null);
  }

  // Same idea again, scoped to just the Food step -- Category/Type stay
  // picked, only the food itself (and anything downstream of it) resets.
  function changeBaseName() {
    setBaseName('');
    setFoodQuery('');
    setPrepMethods([]);
    setPrepMethod(null);
    setNutrients(null);
  }

  const groupedNutrients = nutrients
    ? nutrients.reduce<Record<string, FoodNutrient[]>>((groups, nutrient) => {
        groups[nutrient.group] = groups[nutrient.group] ?? [];
        groups[nutrient.group].push(nutrient);
        return groups;
      }, {})
    : null;

  // SectionList's own shape (one entry per group, each with its own title)
  // -- built once here rather than inline in the render below, since it's
  // also referenced by nothing else. Groups with no rows for this food are
  // dropped rather than shown as an empty section with nothing under it.
  const nutrientSections = groupedNutrients
    ? (['macro', 'vitamin', 'mineral'] as const)
        .map((group) => ({ key: group, title: NUTRIENT_GROUP_LABELS[group], data: groupedNutrients[group] ?? [] }))
        .filter((section) => section.data.length > 0)
    : [];

  // Parsed from the person's own portion-size entry (see the render below,
  // portionGrams/setPortionGrams) -- falls back to 100 for anything that
  // isn't a real positive number (empty field, mid-edit, a stray "."),
  // rather than ever showing NaN/zero-divide garbage in the table.
  const portionGramsNumber = Number(portionGrams);
  const validPortionGrams = Number.isFinite(portionGramsNumber) && portionGramsNumber > 0 ? portionGramsNumber : 100;
  // Scales BOTH the displayed amount and the %-Daily figure to that
  // portion (nutrient content scales linearly with weight, so multiplying
  // a per-100g value by grams/100 is exact, not an approximation) -- the
  // two always stay on the same basis as each other, never an
  // amount-for-one-portion-size next to a percent computed for a
  // different one.
  const servingScale = validPortionGrams / 100;

  // Reuses lib/nutrientAnalysis.ts's own analyzeNutrientIntake -- the exact
  // same "amount vs. DRI target" math the Nutrients lens already runs for a
  // whole day's logged meals, just fed this one food's own (portion-scaled)
  // amounts instead of a day's combined total. Deliberately NOT reusing
  // that function's own `status`/severity coloring here, though -- a
  // single food isn't "deficient" in something just for not being a whole
  // day's supply of it on its own; only the plain percentage is shown.
  const nutrientGapsByCode = new Map<string, number[]>();
  if (nutrients) {
    const foodTotals: Record<string, number> = {};
    nutrients.forEach((nutrient) => {
      foodTotals[nutrient.code] = nutrient.amountPer100g * servingScale;
    });
    analyzeNutrientIntake(driRows, foodTotals).forEach((gap) => {
      const list = nutrientGapsByCode.get(gap.nutrientCode) ?? [];
      list.push(gap.percentOfTarget);
      nutrientGapsByCode.set(gap.nutrientCode, list);
    });
  }

  function showPer100gInfo() {
    showInfoAlert(
      'Per 100g',
      "Per 100g is the standard reference amount used by USDA FoodData Central and the other national nutrition authorities this app draws from (the UK, Germany, Japan, Canada, France, and Australia's own food composition databases) when they publish how much of a nutrient a food actually contains.\n\n" +
        "Reporting a fixed, uniform weight (rather than a package's own serving size, which varies by manufacturer, culture, and preparation) lets any two foods be compared on equal footing, gram for gram, regardless of how much of either one a person actually eats. It's also the form the underlying laboratory analysis itself is done in: a food sample is tested once, and its results are reported per 100g so they can be scaled to any amount afterward, rather than re-tested for every possible serving size.\n\n" +
        "That's why Per 100g never changes here, no matter what you enter in the Portion column next to it: it's this food's own fixed scientific reference point, the same number nutrition professionals themselves start from before scaling to whatever portion someone actually eats.",
    );
  }

  // useCallback, not a plain function declaration like showPer100gInfo/
  // showRdaInfo above -- this one, unlike those, gets passed as
  // AppTextInput's onInfoPress prop (see the Portion field below), which
  // AppTextInput folds into the ActiveField object it hands to
  // ActiveInputContext on every render where it's focused. A fresh
  // function reference every render would make that effect see a
  // "changed" prop and refire even when nothing the person did actually
  // changed, calling setActiveField again -- which, since this component
  // also reads activeField (see tableHeight's own keyboardReserve above),
  // re-renders this component, recreating the function again, forever
  // ("Maximum update depth exceeded"). Memoizing it on its actual
  // dependencies keeps the reference stable across those unrelated
  // re-renders, breaking that cycle.
  const showPortionInfo = useCallback(() => {
    const autoSelectNote =
      "\n\nThe amount shown here arrives already highlighted; just start typing to replace it with your own portion, no need to clear it first.";
    if (unitWeight) {
      showInfoAlert(
        'Portion',
        `This column and % RDA reflect the weight entered here (currently ${validPortionGrams}g); edit it to match what you'll actually eat. Per 100g, to its left, never changes; it's always this food's own raw reference data.\n\nA typical serving of this food is 1 ${unitWeight.unitLabel} (~${Math.round(unitWeight.gramsPerUnit)}g); tap "Use serving" below the field to reset to that.\n\nSource: ${unitWeight.citation}` +
          autoSelectNote,
      );
    } else {
      showInfoAlert(
        'Portion',
        `This column and % RDA reflect the weight entered here (currently ${validPortionGrams}g); edit it to match what you'll actually eat. Per 100g, to its left, never changes; it's always this food's own raw reference data.\n\nWe don't have a typical serving size on file for this food, so 100g was used as the starting default for this column too.` +
          autoSelectNote,
      );
    }
  }, [unitWeight, validPortionGrams, showInfoAlert]);

  function showRdaInfo() {
    showInfoAlert(
      '% RDA',
      "% RDA shows how much of your own recommended daily target for that nutrient the Portion column provides, based on the Dietary Reference Intakes set by the National Academies of Sciences, Engineering, and Medicine (NASEM), matched to the sex and age in your own profile.\n\n" +
        'A few things worth understanding about what this number actually means:\n\n' +
        "- RDA is a population target, not a personal prescription. It's set high enough to meet the needs of about 97-98% of healthy people in your age and sex group; it isn't calculated from your own body, labs, or health history, and Hashimoto's itself can change how much of some nutrients (iodine, selenium, and iron among them) your own body actually needs or absorbs.\n\n" +
        "- Not every nutrient has a true RDA. Some (like biotin or vitamin K) only have an Adequate Intake (AI) instead: a reasonable estimate used when there isn't yet enough evidence to set a precise RDA. Both are shown here the same way, as a plain percentage.\n\n" +
        "- Higher isn't always better. For sodium specifically, the figure shown is a recommended daily limit, not a floor; a lower percentage there is the goal, not a higher one.\n\n" +
        "- This percentage is one piece of context, not a verdict on any single food. A food that provides only a small percentage of something isn't \"bad\" any more than one that provides a large percentage is automatically \"good\"; what matters is the pattern across everything you eat in a day, which is what the Nutrients tab tracks over time.",
    );
  }

  // Grouped ("Cheese" heading over Colby/Cottage/Cheddar/etc.) only while
  // plain browsing -- once a search query actively narrows the list, a
  // flat list of just the matches reads better than headers for a
  // one-or-two-result set. See lib/foodNameGrouping.ts's own top comment
  // for why this groups at render time rather than baking a group into
  // the reference database itself.
  //
  // Healing Stages reordering (2026-08-09) applies in both modes, each in
  // the way that actually fits its own display shape: the flat search-
  // results list gets a real, stable sort (deprioritized names move after
  // everything else, with the exact same relevance/alphabetical order this
  // list already had preserved within each of those two real buckets --
  // Array.prototype.sort is stable in this engine, so a comparator that
  // only distinguishes the two buckets is enough); the grouped browse list
  // instead passes deprioritizedNames straight into buildFoodNameGroups,
  // which applies the identical rule at the group/singleton level (see
  // that function's own comment on why reordering INSIDE that function,
  // not the raw input array, is the only way it actually takes effect).
  const orderedFoodNameOptions =
    deprioritizedNames.size === 0
      ? foodNameOptions
      : [...foodNameOptions].sort((a, b) => {
          const aDeprioritized = deprioritizedNames.has(a);
          const bDeprioritized = deprioritizedNames.has(b);
          if (aDeprioritized === bDeprioritized) return 0;
          return aDeprioritized ? 1 : -1;
        });

  const foodListOptions = foodQuery.trim()
    ? orderedFoodNameOptions.map((value) => ({ label: value, value }))
    : buildFoodNameGroups(foodNameOptions, buildJuiceForcedGroups(category, subcategory), deprioritizedNames).map(
        (entry) =>
          entry.type === 'header'
            ? { label: entry.label, value: `__group_${entry.key}`, isHeader: true }
            : { label: entry.label, value: entry.value, groupLabel: entry.groupLabel },
      );

  const content = (
    <>
      {title ? (
        <View style={[styles.titleBar, { borderColor: tabColor }]}>
          <Text style={[styles.titleText, { color: tabColor }]}>{title}</Text>
        </View>
      ) : null}
      {/* "Say a Food Name" -- 2026-08-16, the real, direct voice shortcut
          past Category/Type entirely: speak a food name, tap the real
          match meant, done -- no manual drilling into a category first.
          Only shown before Category is picked, the same real gate "From
          Your Harvest" right below it already uses, since once a category
          is already chosen there's no genuine cross-category search left
          to offer (the Food step's own search box, further down, already
          covers "find something within this one category"). */}
      {(!restrictToSource || restrictToSource === 'voice') && category === '' ? (
        <View style={[styles.voiceFoodSection, { borderColor: tabColor }]}>
          {/* Nav-hand-aware, 2026-08-17, direct request: "The microphones
              should always be navigation hand aware and should be on the
              left side closest to the left hand with the left hand
              navigation setting, and closest to the right hand for right
              hand navigation." Same real reasoning
              useReorderedLabeledFields already applies elsewhere in this
              app -- the mic sits nearest wherever NAVIGATION_HAND says the
              person's own thumb naturally rests. */}
          <View style={styles.voiceFoodHeaderRow}>
            {/* autoStart, 2026-08-17, direct report: "instead of the
                microphone being activated, it takes me to a Say a Food Name
                text box with a microphone in it.... That's a waste of a
                tap. It should just activate the microphone from the Say a
                Food Name at the Add an Ingredient window." Only true when
                restrictToSource === 'voice' -- that value is only ever set
                the instant SideBuilder's own action sheet routes here
                BECAUSE the person just tapped "Say a Food Name," so a fresh
                mount of this section IS the same deliberate choice as
                tapping the mic button by hand; every other real caller of
                this component (Insights' general Food Lookup lens, Garden's
                harvest logging) leaves restrictToSource unset, so this stays
                false there -- the mic never starts listening on its own
                without a real, explicit choice behind it. */}
            {NAVIGATION_HAND === 'left' ? (
              <>
                <VoiceInputButton
                  onResult={handleGlobalVoiceResult}
                  color={tabColor}
                  autoStart={restrictToSource === 'voice'}
                />
                <Text style={[styles.voiceFoodHeading, { color: tabColor }]}>Say a Food Name</Text>
              </>
            ) : (
              <>
                <Text style={[styles.voiceFoodHeading, { color: tabColor }]}>Say a Food Name</Text>
                <VoiceInputButton
                  onResult={handleGlobalVoiceResult}
                  color={tabColor}
                  autoStart={restrictToSource === 'voice'}
                />
              </>
            )}
          </View>
          {globalVoiceLoading ? (
            <Text style={styles.voiceFoodStatus}>Searching for &quot;{globalVoiceQuery}&quot;…</Text>
          ) : globalVoiceResults !== null ? (
            globalVoiceResults.length > 0 ? (
              <>
                {globalVoiceResults.map((match, index) => (
                  <TouchableOpacity
                    key={`${match.category}-${match.subcategory ?? ''}-${match.baseName}-${index}`}
                    style={styles.voiceFoodResultRow}
                    onPress={() => selectGlobalMatch(match)}
                  >
                    <Text style={styles.voiceFoodResultText} numberOfLines={1}>
                      {match.baseName}
                    </Text>
                    <Text style={styles.voiceFoodResultMeta} numberOfLines={1}>
                      {categoryLabel(match.category)}
                      {match.subcategory ? ` · ${match.subcategory}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={clearGlobalVoiceResults}>
                  <Text style={[styles.voiceFoodClear, { color: tabColor }]}>Search again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.voiceFoodStatus}>
                  No matches for &quot;{globalVoiceQuery}&quot;. Try browsing below, or say it again.
                </Text>
                <TouchableOpacity onPress={clearGlobalVoiceResults}>
                  <Text style={[styles.voiceFoodClear, { color: tabColor }]}>Dismiss</Text>
                </TouchableOpacity>
              </>
            )
          ) : null}
        </View>
      ) : null}
      {/* "From Your Harvest" -- see handlePickHarvest's own comment above.
          Only shown before Category is picked (a harvest pick bypasses
          Category/Type/Food/Prep entirely, so there's nothing left for this
          to sit "inside" once one of those steps is under way) and only
          when there's real, unused harvest inventory to show. */}
      {(!restrictToSource || restrictToSource === 'category') && allowHarvestPick && category === '' && availableHarvests.length > 0 ? (
        <View style={[styles.harvestSection, { borderColor: tabColor }]}>
          <Text style={[styles.harvestHeading, { color: tabColor }]}>From Your Harvest</Text>
          {availableHarvests.map((harvest) => (
            <TouchableOpacity key={harvest.id} style={styles.harvestRow} onPress={() => handlePickHarvest(harvest)}>
              <Text style={styles.harvestText} numberOfLines={1}>
                {harvest.foodName}: {harvest.quantityRemaining} {harvest.unit} left
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {/* "My Food Products" (renamed from "From Your Scans," 2026-08-17,
          see CATEGORY_DISPLAY_LABELS' own comment above for the same rename
          elsewhere) -- see handlePickScannedProduct's own comment above.
          Same real "before Category" gating as "From Your Harvest" just
          above, but shown even with zero real inventory while
          restrictToSource === 'products' specifically -- a person who just
          explicitly chose this method from Side Builder's own 3-way chooser
          deserves an honest "nothing here yet" rather than a blank screen,
          whereas the default unrestricted view (this section stacked among
          others) still only shows itself when there's real content, exactly
          as before. */}
      {(!restrictToSource || restrictToSource === 'products') &&
      allowHarvestPick &&
      category === '' &&
      (availableScannedProducts.length > 0 || restrictToSource === 'products') ? (
        <View style={[styles.harvestSection, { borderColor: tabColor }]}>
          <Text style={[styles.harvestHeading, { color: tabColor }]}>My Food Products</Text>
          {availableScannedProducts.length > 0 ? (
            availableScannedProducts.map((product) => (
              <TouchableOpacity key={product.id} style={styles.harvestRow} onPress={() => handlePickScannedProduct(product)}>
                <Text style={styles.harvestText} numberOfLines={1}>
                  {product.name}
                  {product.brand ? ` (${product.brand})` : ''}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Nothing scanned in yet.</Text>
          )}
        </View>
      ) : null}
      {/* The real, brief stand-in for the whole Category/Subcategory/Food/
          Prep sequence below, 2026-08-17 -- see resolvingFromVoice's own
          comment above for why. Replaces, not supplements: every block
          from here down independently guards on !resolvingFromVoice too,
          so exactly one of "this message" or "the normal step sequence"
          ever shows at a time, never both. */}
      {resolvingFromVoice ? (
        <View style={[styles.voiceFoodSection, { borderColor: tabColor }]}>
          <Text style={styles.voiceFoodStatus}>Finding {baseName}…</Text>
        </View>
      ) : null}
      {/* Category: a plain always-visible InlineSelectList until one is
          picked, then a compact summary row instead (tap Change to bring
          the list back) -- see InlineSelectList.tsx's own comment for why
          this replaced a Dropdown here.

          Gated on restrictToSource, 2026-08-17: while restricted to 'voice'
          or 'products', this whole block (including the still-blank
          InlineSelectList) stays hidden until a real category actually
          gets set by one of those other two methods -- a person who
          explicitly chose "Say a Food Name" shouldn't also see a
          category-browsing list sitting right below it. Once `category` IS
          set (by any method), this always shows again, as the ordinary
          "picked" summary row -- every downstream step (Subcategory/Food/
          Prep) already only cares that a category exists, never how it got
          set.

          !resolvingFromVoice, 2026-08-17: see that state's own comment --
          this and the three blocks below it all skip rendering entirely
          during the brief real gap right after a voice pick, replaced by
          the single message just above instead. */}
      {!resolvingFromVoice && (!restrictToSource || restrictToSource === 'category' || category !== '') ? (
      <View>
        {category === '' ? (
          categoryGroupKey === null ? (
            // Top-level grid, 2026-08-17 -- a mix of real "food group"
            // tiles (Fresh Produce, Meat/Seafood/Dairy, etc., see
            // FOOD_CATEGORY_GROUPS above) and standalone leftover
            // categories, alphabetized together by whatever label actually
            // shows. Tapping a group tile opens its own real-category list
            // below instead of picking a category directly; tapping
            // anything else picks that real category exactly as before.
            <InlineSelectList
              options={buildTopLevelCategoryOptions(categories)}
              value={category}
              onChange={(next) => {
                if (isFoodCategoryGroupKey(next)) {
                  setCategoryGroupKey(next);
                } else {
                  selectCategory(next);
                }
              }}
              height={categoryListHeight}
              tabColor={tabColor}
              header="Select a Food Category"
              squareTop={squareTop}
            />
          ) : (
            // A real group is open -- show just the real categories inside
            // it, with a plain way back to the full grid above it. Picking
            // one here calls selectCategory exactly like picking a
            // standalone category always has; nothing downstream needs to
            // know it came from inside a group.
            <View>
              <TouchableOpacity
                style={[styles.categoryGroupBackRow, { borderColor: tabColor }, squareTop && styles.squareTop]}
                onPress={() => setCategoryGroupKey(null)}
              >
                <Text style={[styles.categoryGroupBackText, { color: tabColor }]}>‹ Food Groups</Text>
              </TouchableOpacity>
              <InlineSelectList
                options={groupMemberOptions(categoryGroupKey, categories)}
                value={category}
                onChange={selectCategory}
                height={groupSubListHeight}
                tabColor={tabColor}
                header={`Select a ${groupLabelFor(categoryGroupKey)} Category`}
              />
            </View>
          )
        ) : (
          <TouchableOpacity
            style={[styles.summaryRow, { borderColor: tabColor }, squareTop && styles.squareTop]}
            onPress={changeCategory}
          >
            <Text style={styles.summaryText} numberOfLines={1}>
              {categoryLabel(category)}
            </Text>
            <Text style={[styles.summaryChange, { color: tabColor }]}>Change</Text>
          </TouchableOpacity>
        )}
      </View>
      ) : null}

      {!resolvingFromVoice && category !== '' && subcategories.length > 0 ? (
        <View style={styles.stackedField}>
          {subcategory === null ? (
            <InlineSelectList
              options={subcategories.map((value) => ({ label: value, value }))}
              value={subcategory ?? ''}
              onChange={selectSubcategory}
              height={categoryListHeight}
              tabColor={tabColor}
              header={`Select a ${categoryLabel(category)} Type`}
            />
          ) : (
            <TouchableOpacity style={[styles.summaryRow, { borderColor: tabColor }]} onPress={changeSubcategory}>
              <Text style={styles.summaryText} numberOfLines={1}>
                {subcategory}
              </Text>
              <Text style={[styles.summaryChange, { color: tabColor }]}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {!resolvingFromVoice && categoryConfirmed ? (
        <View style={styles.stackedField}>
          {baseName === '' ? (
            <InlineSearchSelectList
              options={foodListOptions}
              value={baseName}
              onChange={selectBaseName}
              height={foodListHeight}
              tabColor={tabColor}
              header={`Select a ${categoryLabel(category)}`}
              searchText={foodQuery}
              onSearchChange={setFoodQuery}
              searchPlaceholder={`Search ${categoryLabel(category)} foods…`}
            />
          ) : (
            <TouchableOpacity style={[styles.summaryRow, { borderColor: tabColor }]} onPress={changeBaseName}>
              <Text style={styles.summaryText} numberOfLines={1}>
                {baseName}
              </Text>
              <Text style={[styles.summaryChange, { color: tabColor }]}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {!resolvingFromVoice && prepMethods.length > 0 ? (
        <View style={styles.stackedField}>
          {prepMethod === null ? (
            <InlineSelectList
              options={prepMethods.map((value) => ({ label: value, value }))}
              value={prepMethod ?? ''}
              onChange={setPrepMethod}
              height={categoryListHeight}
              tabColor={tabColor}
              header="Select a Preparation"
            />
          ) : (
            <TouchableOpacity style={[styles.summaryRow, { borderColor: tabColor }]} onPress={() => setPrepMethod(null)}>
              <Text style={styles.summaryText} numberOfLines={1}>
                {prepMethod}
              </Text>
              <Text style={[styles.summaryChange, { color: tabColor }]}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Real source attribution, 2026-08-11 -- only shown once a food is
          actually resolved (showNutrients=true path; the builder/
          showNutrients=false path gets the same information via
          onFoodResolved's own `source` field, already available on every
          builder's own pendingResolved), and only when the resolution
          genuinely fell back to a non-USDA source -- resolveFoodChoice
          itself already prefers USDA whenever it can (lib/db.ts), so this
          note appearing at all means USDA genuinely has no row for this
          exact food + prep state, not that this app has an opinion either
          way about which source is "better." */}
      {resolvedSource && isFallbackSource(resolvedSource) ? (
        <View style={[styles.sourceFallbackNote, { borderColor: tabColor }]}>
          <Text style={styles.sourceFallbackText}>Not in USDA: from {sourceLabel(resolvedSource)}</Text>
        </View>
      ) : null}

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : groupedNutrients ? (
        <View style={[styles.table, { height: tableHeight, borderColor: tabColor }]}>
          {/* One header for the whole table, not per group -- see
              NUTRIENT_GROUP_LABELS above for the per-group label that
              replaces what used to be a fully duplicated header row.
              Rendered here as a fixed sibling above the SectionList below,
              not as its own section/ListHeaderComponent -- it never
              scrolls at all, staying visible above even the group labels'
              own sticky behavior. */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableHeaderCell, { color: tabColor }, styles.tableCellNutrient]}>Nutrient</Text>
            {/* Always the food's own raw per-100g reference data -- never
                scaled, never editable. The Portion column next to it is the
                one that reflects what the person actually enters. Tapping
                the label shows why 100g specifically -- see
                showPer100gInfo above. */}
            <TouchableOpacity style={styles.tableCellAmount} onPress={showPer100gInfo}>
              <Text style={[styles.tableHeaderCell, { color: tabColor }]}>Per 100g</Text>
            </TouchableOpacity>
            <View style={styles.tableCellPortion}>
              <Text style={[styles.tableHeaderCell, { color: tabColor }]}>Portion</Text>
              <View style={styles.portionInputRow}>
                <AppTextInput
                  style={styles.portionInput}
                  value={portionGrams}
                  onChangeText={setPortionGrams}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  autoFocus
                  selectAllOnMount
                  onInfoPress={showPortionInfo}
                  infoColor={tabColor}
                  infoLabel="Provide Portion Size"
                />
                <Text style={[styles.tableHeaderCell, { color: tabColor }]}>g</Text>
              </View>
              {unitWeight ? (
                <TouchableOpacity onPress={() => setPortionGrams(String(Math.round(unitWeight.gramsPerUnit)))}>
                  <Text style={[styles.portionResetLink, { color: tabColor }]} numberOfLines={1}>
                    Use serving ({Math.round(unitWeight.gramsPerUnit)}g)
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {/* Tapping shows what % RDA actually means -- see showRdaInfo
                above. alignItems: 'flex-end', not textAlign --
                tableCellPercent's own textAlign: 'right' is a Text-only
                style property; it's a no-op on this TouchableOpacity
                wrapper, so the right-alignment has to come from the
                container instead. */}
            <TouchableOpacity style={[styles.tableCellPercent, styles.percentHeaderButton]} onPress={showRdaInfo}>
              <Text style={[styles.tableHeaderCell, { color: tabColor }]}>% RDA</Text>
            </TouchableOpacity>
          </View>
          {/* The results themselves are the only thing that scrolls --
              stickySectionHeadersEnabled keeps whichever group's own label
              (Macronutrients/Vitamins/Minerals) pinned right below the
              fixed column header above as its rows scroll past, swapping
              to the next group's label only once that group's last row
              has scrolled by, same as a contacts list's alphabet index. */}
          <SectionList
            style={styles.tableSectionList}
            sections={nutrientSections}
            keyExtractor={(nutrient, index) => `${nutrient.code}-${index}`}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <View style={styles.tableGroupLabelRow}>
                <Text style={[styles.tableGroupLabelText, { color: tabColor }]}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item: nutrient }) => {
              const percents = nutrientGapsByCode.get(nutrient.code);
              return (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { color: tabColor }, styles.tableCellNutrient]}>{nutrient.displayName}</Text>
                  <Text style={[styles.tableCell, { color: tabColor }, styles.tableCellAmount]}>
                    {formatAmount(nutrient.amountPer100g, nutrient.unit)}
                  </Text>
                  <Text style={[styles.tableCell, { color: tabColor }, styles.tableCellPortion]}>
                    {formatAmount(nutrient.amountPer100g * servingScale, nutrient.unit)}
                  </Text>
                  <Text style={[styles.tableCell, { color: tabColor }, styles.tableCellPercent]}>
                    {percents && percents.length > 0 ? percents.map((percent) => `${Math.round(percent)}%`).join(' / ') : '—'}
                  </Text>
                </View>
              );
            }}
          />
        </View>
      ) : null}
    </>
  );

  // Always a plain View, never this component's own ScrollView -- each
  // step's own list (InlineSelectList/InlineSearchSelectList) and, once a
  // food is resolved, the results table's own SectionList (see its own
  // `height: tableHeight` above) each handle their own scrolling already;
  // nesting a second scrollable container around them here would be
  // exactly the anti-pattern this whole layout exists to avoid. No
  // container/padding of its own, either -- the caller (see
  // app/(tabs)/insights.tsx's own foodLookupActiveListContainer) owns that,
  // since it varies by how much else is already on that caller's screen.
  return (
    <>
      {content}
      {infoAlertElement}
    </>
  );
}

const styles = StyleSheet.create({
  // Page-level heading above Category, only when the caller passes one
  // (see FoodLookup's own `title` prop comment). Styled to look physically
  // attached to the top of whatever's rendered right below it (Category's
  // own InlineSelectList or its "picked" summary row -- both share the
  // exact same borderWidth: 2/borderRadius: 10/colors.surface treatment,
  // which is what this matches): same border width/color, rounded top
  // corners only (square bottom, since that edge butts against the box
  // below), and a negative marginBottom exactly equal to the border width
  // so the two borders overlap into one continuous line instead of a
  // visible double seam. backgroundColor matches colors.surface too --
  // without an opaque fill of its own, this text was unreadable directly
  // over the page's own background photo.
  titleBar: {
    borderWidth: 2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: -2,
  },
  titleText: {
    ...typography.label,
    fontSize: 18,
    textAlign: 'center',
  },
  // "From Your Harvest" quick-pick -- see handlePickHarvest's own comment
  // above for what this is. Styled to sit right above Category's own list
  // as a distinct, bordered block, matching titleBar's own "physically
  // attached" look above whatever renders directly beneath it.
  harvestSection: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  harvestHeading: {
    ...typography.eyebrow,
    marginBottom: 4,
  },
  harvestRow: {
    paddingVertical: 6,
  },
  harvestText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  // "Say a Food Name" -- see the render-time comment on this section for
  // what it does. Same bordered-block treatment as harvestSection right
  // below it, so the two read as a matching pair of quick-pick shortcuts
  // rather than two differently-styled features.
  voiceFoodSection: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  voiceFoodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceFoodHeading: {
    ...typography.eyebrow,
  },
  voiceFoodStatus: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 6,
  },
  voiceFoodResultRow: {
    paddingVertical: 6,
  },
  voiceFoodResultText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  voiceFoodResultMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  voiceFoodClear: {
    ...typography.captionEmphasis,
    marginTop: 6,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  // Each field/summary-row after the first sits exactly 2px below the one
  // above it -- matches SUMMARY_ROW_GAP above (was 3px/SUMMARY_ROW_GAP 3,
  // tightened together 2026-07-28).
  stackedField: { marginTop: 2 },
  // Category/Type's own "picked, collapsed" row -- replaces their
  // InlineSelectList once a value is chosen, same compact single-field
  // footprint a closed Dropdown used to have. Tap anywhere on it to bring
  // the list back. paddingVertical tightened 2026-07-28 (was 10) -- same
  // "shrink the buffer around every row" pass as InlineSelectList.tsx's
  // own header/item -- SUMMARY_ROW_HEIGHT above tracks this real height.
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  // See the `squareTop` prop's own comment.
  squareTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  summaryText: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  summaryChange: {
    ...typography.captionEmphasis,
    marginLeft: 8,
  },
  // The "‹ Food Groups" row shown above a group's own real-category list,
  // 2026-08-17 -- same borderWidth/paddingVertical/backgroundColor recipe
  // as summaryRow just above (so it reads as the same visual family, not a
  // foreign element), with a small gap before the list underneath it
  // (matching stackedField's own established 2px stacking gap). Its own
  // real height is GROUP_BACK_ROW_HEIGHT above -- keep the two in sync if
  // this ever changes.
  categoryGroupBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    marginBottom: 2,
  },
  categoryGroupBackText: {
    ...typography.captionEmphasis,
  },
  // Real source-attribution note, 2026-08-11 -- see this file's own
  // render-time comment for when this actually shows.
  sourceFallbackNote: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  sourceFallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // The Portion column's own header cell -- label, the editable gram input,
  // and (when known) the "use the typical serving" reset link all stack
  // inside this one column, rather than a separate full-width row above the
  // table -- keeps the control scoped to exactly the column it drives.
  tableCellPortion: {
    flex: 1.8,
    alignItems: 'center',
  },
  portionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  portionInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 44,
    textAlign: 'center',
  },
  portionResetLink: {
    ...typography.caption,
    marginTop: 2,
  },
  // Replaces what used to be a fully duplicated header row per nutrient
  // group -- just the group's own name (NUTRIENT_GROUP_LABELS), enough to
  // keep macro/vitamin/mineral sections visually distinct without repeating
  // the column labels (and the Portion input inside them) three times over.
  tableGroupLabelRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tableGroupLabelText: {
    ...typography.eyebrow,
  },
  // Fills whatever's left of the table box below the fixed column header
  // (see that box's own `height: tableHeight`) -- this is the one thing
  // that actually scrolls; everything above it (the header row, and the
  // summary rows above the table box itself) stays put.
  tableSectionList: {
    flex: 1,
  },
  // A real table -- rows have consistent columns, so several numbers/
  // statuses per line can be scanned down a column instead of read one
  // sentence at a time. borderColor set inline (tabColor) -- this box's
  // border says which page it belongs to.
  table: {
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  tableHeaderRow: {
    borderTopWidth: 0,
    backgroundColor: colors.background,
  },
  // Color set inline (tabColor) -- every font inside this table matches
  // its own border color.
  tableCell: {
    ...typography.caption,
  },
  tableHeaderCell: {
    ...typography.eyebrow,
  },
  tableCellNutrient: {
    flex: 2,
  },
  tableCellAmount: {
    flex: 2,
  },
  tableCellPercent: {
    flex: 1.2,
    textAlign: 'right',
  },
  // See the % RDA header's own JSX comment for why this exists alongside
  // tableCellPercent rather than relying on its textAlign alone.
  percentHeaderButton: {
    alignItems: 'flex-end',
  },
});
