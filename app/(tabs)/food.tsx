import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub, type MyItemsCategory } from '../../components/MyItemsHub';
import { BakedGoodsBuilder } from '../../components/BakedGoodsBuilder';
import { BeverageBuilder } from '../../components/BeverageBuilder';
import { BeverageSubtypePicker, type BeverageSubtypeKey } from '../../components/BeverageSubtypePicker';
import { DessertBuilder } from '../../components/DessertBuilder';
import { FermentationBuilder } from '../../components/FermentationBuilder';
import { HandheldsBuilder } from '../../components/HandheldsBuilder';
import { MealBuilder } from '../../components/MealBuilder';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SaladBuilder } from '../../components/SaladBuilder';
import { SideBuilder } from '../../components/SideBuilder';
import { SmoothieBuilder } from '../../components/SmoothieBuilder';
import { SnackBuilder } from '../../components/SnackBuilder';
import { SaucesBuilder } from '../../components/SaucesBuilder';
import { SoupBuilder } from '../../components/SoupBuilder';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import {
  listBakedGoods,
  listBeverages,
  listDesserts,
  listFavorites,
  listFermentations,
  listHandhelds,
  listSalads,
  listSauces,
  listScannedProducts,
  listSides,
  listSmoothies,
  listSnacks,
  listSoups,
} from '../../lib/db';
import { consumePendingFoodTrialReturn } from '../../lib/pendingFoodTrialReturn';

// This page's own identity color -- every box FoodLookup draws (list
// borders, the results table, its own text) takes this as its `tabColor`
// prop, the same way Insights' Food Lookup lens passes its own teal.
const TAB_COLOR = colors.tabFood;

// 2026-07-25: the Food tab's old single-purpose meal builder (ingredient
// search, favorites/templates, rotating ingredients, the whole thing) was
// deleted wholesale, by explicit request, to rebuild the tab from the floor
// up as seven focused builders instead of one form that tried to cover
// every case. The deleted implementation is not lost -- see
// ClaudeWork/backups/index.tsx.<timestamp>.bak for the full original file --
// this project has no git repository at all, so that manual backup is the
// only safety net for reviving any of that logic (ingredient search,
// favorites, rotation, etc.) when rebuilding each builder for real.
//
// Known loose end from this deletion: Schedule's "Log now" action and
// Home's Day Arc both navigate to '/' with scheduleItemId/mealType/title/
// favoriteId/templateMealId params, expecting the old builder to read them
// (via useLocalSearchParams) and open pre-filled. Nothing here reads those
// params anymore, so right now those actions just land on a blank Food tab
// with the meal not actually logged. Needs reconnecting once whichever
// builder a "scheduled meal" maps to (almost certainly Meal Builder) is
// rebuilt -- not fixed yet.
type FoodLens =
  | 'mealBuilder'
  | 'sideBuilder'
  | 'saladBuilder'
  | 'smoothieBuilder'
  | 'fermentationBuilder'
  | 'beverageBuilder'
  | 'snackBuilder'
  | 'bakedGoodsBuilder'
  | 'soupBuilder'
  | 'saucesBuilder'
  | 'handheldsBuilder'
  | 'dessertBuilder';

// Builder NAMES went plural 2026-08-04, explicitly requested ("I think we
// should choose if they should all be singular or all plural... make the
// rest plural that also should be") -- matching the house style
// CATEGORY_DISPLAY_LABELS in components/FoodLookup.tsx already used
// (Vegetables, Fruits, Beverages, Mixed Dishes, etc.), the same convention
// grocery aisles and restaurant menus use. Side -> Sides, Salad -> Salads
// & Bowls (also a real scope expansion -- grain bowls, poke, burrito
// bowls, breakfast yogurt bowls; its own category allowlist already
// covered all of these before the rename, so this was mostly a naming/
// discoverability fix, not a rebuild), Smoothie -> Smoothies, Beverage ->
// Beverages, Snack -> Snacks, Soup -> Soups. Two deliberate exceptions,
// both with real reasons rather than just left alone: Meal stays singular
// because it isn't a food category the way the other ten are -- it's the
// assembly action that combines THEIR saved output ("Meal Builder" names
// doing the assembly; "Meals Builder" would read like a generic app name).
// Fermentation stays singular because unlike Sauces/Snacks/Soups/Sides/
// Beverages it has no natural plural food-category form -- "Fermentations"
// reads clinical, like separate lab batches, not a recognizable menu-style
// label. Internal identifiers (lens keys below, component file names,
// database tables, per-item function names, itemType values) deliberately
// stay singular throughout -- matching the precedent Sauces Builder
// already set (display name "Sauces," but getSauce/sauces
// table/'sauce' itemType all stay singular) -- only what's actually shown
// on screen changed.
const FOOD_LENS_COPY: Record<FoodLens, string> = {
  mealBuilder:
    "Built 2026-08-02, last of the eleven. Name the meal (optional) and choose a meal type, then \"Add from...\" opens your own already-saved or favorited items from any builder: pick one, then say how much of THAT ONE SAVED ITEM's own stated servings you actually had (100% = the whole thing, not a share of the whole meal split between people). Repeat for as many items as the meal actually has. Checks for raw goitrogenic foods combined ACROSS the whole meal (not just within one builder's own ingredient list) before logging. Log This Now saves a meal for right now; Save & Schedule for Later saves it for a chosen time today instead. Also reachable from Past Meals' own \"Adjust\" link, to correct how much of each item a real, already-logged meal actually turned out to have. Save Changes there updates that same real meal in place, and any food trial riding on a changed item gets a real, separate prompt about whether to correct its own start date or mark it as never having happened.",
  sideBuilder:
    "In progress. Name the dish (optional), set # of Servings and Serving Size, then add one or more ingredients (category -> type -> food -> prep, then quantity/unit); nutrient lookup itself lives on Insights' own Food Lookup lens instead of being duplicated here. Done leads into a required \"how was this cooked\" step (cooking method changes retained nutrients), then a soft, skippable nudge if no cooking oil/fat or seasoning was logged, easy to miss both by accident. Saving the finished side as a reusable favorite isn't wired up yet.",
  saladBuilder:
    'In progress. Same builder flow as Sides (name, servings/serving size, then ingredients with category -> type -> food -> prep, quantity/unit, cut prep, cook prep), plus its own twist: finishing a salad or bowl checks for two or more raw goitrogenic vegetables mixed together (easy to eat far more of them raw and combined than cooked and separate) and warns before saving, rather than silently letting it through. Covers salads, grain bowls, poke, burrito bowls, and breakfast bowls: the same ingredient-assembly logic covers all of them. Saving as a reusable favorite isn\'t wired up yet, same as Sides.',
  smoothieBuilder:
    'In progress. Same builder flow as Sides and Salads & Bowls, plus the same twist Salads & Bowls has, reworded for blending: finishing a smoothie checks for two or more raw goitrogenic vegetables blended together (easy to eat far more of them at once than cooked and separate) and warns before saving. Saving as a reusable favorite isn\'t wired up yet, same as Sides and Salads & Bowls.',
  fermentationBuilder:
    "In progress. Same builder flow as Sides (name, servings/serving size, then ingredients), plus a 'Fermented' Cook Prep option the other builders don't have, so the step that actually makes something a fermentation has an answer to select. Bacterial-strain tracking (specific cultures like Lactobacillus acidophilus, eventually with cited effects) is still its own separate, not-yet-started research workstream; this covers logging the fermented food itself, not identifying what's living in it. Saving as a reusable favorite isn't wired up yet, same as Sides/Salads & Bowls/Smoothies.",
  beverageBuilder:
    "In progress. Same builder flow as Sides, minus the \"no cooking oil/fat or seasoning\" nudge Sides/Salads & Bowls/Smoothies/Fermentation all have; not a concern for a drink, so it's left out here rather than shown for no reason. Water and other drinks, including anything dissolved or mixed in. Saving as a reusable favorite isn't wired up yet, same as the others.",
  snackBuilder:
    "In progress. Same builder flow as Sides, including the \"no cooking oil/fat or seasoning\" nudge (kept here, unlike Beverages, since spiced nuts or oil-popped popcorn can involve either). For anything that isn't already a full meal or a side on its own. Saving as a reusable favorite isn't wired up yet, same as the others.",
  bakedGoodsBuilder:
    "In progress. Same builder flow as Sides, including the \"no cooking oil/fat or seasoning\" nudge (kept here, same reasoning as Snacks, since butter/oil and cinnamon/salt are both common). Bread, muffins, and other home-baked items, distinct from Meal/Sides since a baked good is usually made once and portioned out over several separate sittings (already what Servings/Serving Size capture). Saving as a reusable favorite isn't wired up yet, same as the others.",
  soupBuilder:
    "In progress. Same builder flow as Sides, plus a 'Simmered' Cook Prep option the other builders don't have, distinct from 'Boiled' (lower heat, longer time, less mechanical breakdown). Broth-base tracking and simmered-down ingredient-concentration math are still deferred; both would need dedicated research (how does a given ingredient's nutrient contribution change as broth reduces?) before being more than a guess. Saving as a reusable favorite isn't wired up yet, same as the others.",
  saucesBuilder:
    "In progress. Same builder flow as Sides, plus a 'Reduced' Cook Prep option the other builders don't have: arguably THE defining sauce-making technique (pan sauces, gravies, glazes). Covers sauces, gravies, dressings, dips, and anything else in that family. Saving as a reusable favorite isn't wired up yet, same as the others.",
  handheldsBuilder:
    "New 2026-08-04, requested alongside the plural-naming pass: \"Layers\" as a working name, renamed to \"Handhelds\" since every other builder is named after a recognizable food category, not a structural description. Same builder flow as Sides, reordered around four layers: outer casing (bread, tortilla, bun, lettuce wrap), primary protein, toppings, and condiment/spread, covering sandwiches, wraps, burgers, and tacos with one flexible tool instead of four near-identical ones. Saving as a reusable favorite isn't wired up yet, same as the others.",
  dessertBuilder:
    "New 2026-08-14, the twelfth builder. Same builder flow as Sides, plus a 'Chilled/Frozen' Cook Prep option the other builders don't have (a real, common state none of them covered -- mousse, panna cotta, pudding, no-bake cheesecake, and ice cream are never heated at all). Reaches further into Alcohol, Brewing, and Bev than most sides/snacks-style builders do, since real desserts genuinely draw on all three (rum cake, tiramisu, mocha-flavored bakes), so it gets the same alcohol calculator and general-health advisories Beverage/Fermentation/Soup/Sauces already have. Covers cakes, cookies, pies, custards, puddings, and frozen desserts. Saving as a reusable favorite isn't wired up yet, same as the others.",
};

// The full name shown in PageIdentityLabel's own corner box once a lens
// is picked, 2026-07-28 -- deliberately separate from FOOD_LENSES' own
// short grid label (below): that label dropped "Builder" from every
// option back on 2026-07-27 (see that change's own comment) specifically
// because the popup's shared header already says "Nutrition Builders"
// once for the whole grid, but the corner box has no such shared header
// nearby to lean on, so it needs the real full name spelled out on its
// own. "Side Dish Builder" was originally chosen, not the mechanical
// "Side Builder," to match SideBuilder.tsx's own in-page title bar --
// that title bar was itself removed the same day (see SideBuilder.tsx's
// own 2026-07-28 comment), so by the time of the 2026-08-04 plural-naming
// pass there was no in-page title left to stay in sync with, freeing this
// box to just say "Sides" like everywhere else now does.
//
// 2026-07-28: a forced line break (\n) before "Builder" in every one of
// these, even the ones that would otherwise fit on one line (e.g. "Snack
// Builder") -- explicitly requested so every name in this box reads as
// two lines, "what it builds" then "Builder," consistently across all
// ten rather than some wrapping and some not depending on length alone.
const FOOD_LENS_FULL_NAMES: Record<FoodLens, string> = {
  mealBuilder: 'Meal\nBuilder',
  sideBuilder: 'Sides\nBuilder',
  saladBuilder: 'Salads &\nBowls Builder',
  smoothieBuilder: 'Smoothies\nBuilder',
  fermentationBuilder: 'Fermentation\nBuilder',
  beverageBuilder: 'Beverages\nBuilder',
  snackBuilder: 'Snacks\nBuilder',
  bakedGoodsBuilder: 'Baked Goods\nBuilder',
  soupBuilder: 'Soups\nBuilder',
  saucesBuilder: 'Sauces\nBuilder',
  handheldsBuilder: 'Handhelds\nBuilder',
  dessertBuilder: 'Desserts\nBuilder',
};

// Per-builder Info content (LensHub's own bottom-left Info tile) -- one
// real section each, reusing FOOD_LENS_COPY's own text as the single
// source of truth rather than a second, separately-worded copy that could
// drift from what the empty-state placeholder itself says.
//
// 2026-07-27: "Builder" dropped from every option's own label here (was
// "Meal Builder," "Side Builder," etc.) -- every single one of these is a
// builder, so that's said once now, in the popup's own header instead (see
// this file's own <LensHub headerLabel="Nutrition Builders" .../> below),
// rather than repeated ten times over. Each `help` heading was shortened
// to match, for the same reason -- it used to just repeat the label.
const FOOD_LENSES: LensOption<FoodLens>[] = [
  {
    key: 'mealBuilder',
    label: 'Meal',
    icon: 'restaurant-outline',
    help: [{ heading: 'Meal', body: FOOD_LENS_COPY.mealBuilder }],
  },
  {
    key: 'sideBuilder',
    label: 'Sides',
    icon: 'fast-food-outline',
    help: [{ heading: 'Sides', body: FOOD_LENS_COPY.sideBuilder }],
  },
  {
    key: 'saladBuilder',
    label: 'Salads & Bowls',
    icon: 'leaf-outline',
    help: [{ heading: 'Salads & Bowls', body: FOOD_LENS_COPY.saladBuilder }],
  },
  {
    key: 'smoothieBuilder',
    label: 'Smoothies',
    icon: 'wine-outline',
    help: [{ heading: 'Smoothies', body: FOOD_LENS_COPY.smoothieBuilder }],
  },
  {
    key: 'fermentationBuilder',
    label: 'Fermentation',
    icon: 'flask-outline',
    help: [{ heading: 'Fermentation', body: FOOD_LENS_COPY.fermentationBuilder }],
  },
  {
    key: 'beverageBuilder',
    label: 'Beverages',
    icon: 'cafe-outline',
    help: [{ heading: 'Beverages', body: FOOD_LENS_COPY.beverageBuilder }],
  },
  {
    key: 'snackBuilder',
    label: 'Snacks',
    icon: 'nutrition-outline',
    help: [{ heading: 'Snacks', body: FOOD_LENS_COPY.snackBuilder }],
  },
  {
    key: 'bakedGoodsBuilder',
    label: 'Baked Goods',
    icon: 'pizza-outline',
    help: [{ heading: 'Baked Goods', body: FOOD_LENS_COPY.bakedGoodsBuilder }],
  },
  {
    key: 'soupBuilder',
    label: 'Soups',
    icon: 'flame-outline',
    help: [{ heading: 'Soups', body: FOOD_LENS_COPY.soupBuilder }],
  },
  {
    key: 'saucesBuilder',
    label: 'Sauces',
    icon: 'water-outline',
    help: [{ heading: 'Sauces', body: FOOD_LENS_COPY.saucesBuilder }],
  },
  {
    key: 'handheldsBuilder',
    label: 'Handhelds',
    icon: 'layers-outline',
    help: [{ heading: 'Handhelds', body: FOOD_LENS_COPY.handheldsBuilder }],
  },
  {
    // Deliberately last, 2026-08-14 -- the newest builder, placed at the
    // end of the list the same way every prior builder addition (Sauces,
    // then Handhelds) has been. Unlike those two, no special-case
    // positioning comment is needed here anymore: LensHub's own Info-
    // centering math (blanksBeforeInfo in components/LensHub.tsx) is fully
    // computed from options.length/columns, not a fixed assumption about
    // exactly 10 or 11 items -- 12 items across 3 columns lands as 4 clean
    // full rows, with Info centered on its own 5th row below them, with
    // zero manual adjustment required for this addition.
    key: 'dessertBuilder',
    label: 'Desserts',
    // A plain Ionicons glyph, like every other Food-tab lens tile -- no
    // custom renderIcon needed here. 2026-08-14 originally shipped this
    // as a real, hand-drawn cupcake (components/FoodBuilderIcons.tsx), the
    // same custom-icon mechanism Purple Digest's own condition tiles use;
    // that shape read as an ice cream cone on a real device instead of a
    // cupcake, so 2026-08-16 dropped the custom renderer for the real
    // thing Ionicons already ships (this exact glyph was already set here
    // as the required fallback the whole time, just never actually shown).
    // DessertBuilderIcon still exists, now rendering this same real
    // ice-cream glyph as SVG text, for TabHub's own floating-button icon
    // choice (see components/TabHub.tsx's own TAB_HUB_VECTOR_ICONS), which
    // can't use this plain <Ionicons/> path at all.
    icon: 'ice-cream-outline',
    help: [{ heading: 'Desserts', body: FOOD_LENS_COPY.dessertBuilder }],
  },
];

const FOOD_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page is for',
    body: 'So building something to eat automatically gets real nutrient and 6 Dimensions scoring as you go, instead of you having to work that out yourself afterward. The Food tab is built from one all-in-one meal builder into twelve focused builders, one per kind of thing you actually make: a full meal, a side, a salad or bowl, a smoothie, a fermented food, a beverage, a snack, a baked good, a soup, a sauce/gravy/dressing/dip, a sandwich/wrap/burger/taco, or a dessert.',
  },
  {
    heading: 'The twelve builders',
    body: 'Meal, Sides, Salads & Bowls, Smoothies, Fermentation, Beverages, Snacks, Baked Goods, Soups, Sauces, Handhelds, and Desserts: pick one from the button to the left of the main navigation button, bottom of the screen.',
  },
  {
    heading: 'Status',
    body: "All twelve builders are built: Sides, Salads & Bowls, Smoothies, Fermentation, Beverages, Snacks, Baked Goods, Soups, Sauces, Handhelds, and Desserts each build and save their own dish, and can also be saved as a reusable favorite; Meal (built last, on purpose, since it assembles the other eleven's own saved output) assembles a meal out of them, logs it now, or schedules it for later.",
  },
];

export default function FoodScreen() {
  useRegisterScreenHelp('Food', FOOD_HELP_SECTIONS, '/food');
  const router = useRouter();
  // Set when reached via a saved side's/salad's/smoothie's/fermentation's/
  // beverage's/snack's/baked good's/soup's/sauce's own Edit button (see
  // app/food-items.tsx), 2026-08-01 (editSaladId/editSmoothieId/
  // editFermentationId/editBeverageId/editSnackId/editBakedGoodsId/
  // editSoupId/editSauceId added 2026-08-02, same reasoning) -- pushed here
  // as a route param rather than a prop, since food-items.tsx is a separate
  // stack screen with no other way to hand SideBuilder/SaladBuilder/
  // SmoothieBuilder/FermentationBuilder/BeverageBuilder/SnackBuilder/
  // BakedGoodsBuilder/SoupBuilder/SaucesBuilder a specific record to load.
  // Read once below to jump straight into the right builder already
  // revealed, bypassing the normal "pick a lens from LensHub" step entirely
  // -- editing isn't a fresh choice of what to build, it's returning to
  // something specific.
  const {
    // Past Meals' own portion-correction flow (Schedule tab), 2026-08-14 --
    // same "jump straight into the right builder, already revealed" shape
    // as every editXId below, but names a real, already-logged MEAL rather
    // than one of the ten sub-builders' own saved records (see
    // MealBuilder's own editMealId prop for the load/save logic this
    // drives).
    editMealId,
    editSideId,
    editSaladId,
    editSmoothieId,
    editFermentationId,
    editBeverageId,
    editSnackId,
    editBakedGoodsId,
    editSoupId,
    editSauceId,
    editHandheldId,
    editDessertId,
    // Set when reached via a saved favorite's own "Use this Favorite" tap
    // (see app/food-items.tsx), 2026-08-08 -- same routing shape as
    // editSideId/etc. just above, except these never mark anything as an
    // edit: each sub-builder's own fromFavoriteId prop (see e.g.
    // SideBuilder.tsx) always produces a genuinely NEW saved item,
    // pre-filled from the favorite's own saved ingredients.
    fromSideFavoriteId,
    fromSaladFavoriteId,
    fromSmoothieFavoriteId,
    fromFermentationFavoriteId,
    fromBeverageFavoriteId,
    fromSnackFavoriteId,
    fromBakedGoodsFavoriteId,
    fromSoupFavoriteId,
    fromSauceFavoriteId,
    fromHandheldFavoriteId,
    fromDessertFavoriteId,
    // Purple Digest's own new "Recipes" category, 2026-08-14 -- one
    // "Build This Recipe" button per curated-recipe card (see
    // app/(tabs)/purple-digest.tsx's own DigestCard), one param per
    // builder, same shape as the fromXFavoriteId params just above: opens
    // that builder fresh and pre-filled from the named curated recipe,
    // never marks anything as an edit. Reused directly by each builder's
    // own openRecipeId prop, added in Phase 2 -- see e.g. SideBuilder.tsx's
    // own openRecipeId comment for the full mechanism (getCuratedRecipe ->
    // getFoodIdentity/getFoodScores per ingredient). No openMealRecipeId --
    // Meal Builder has no curated recipes of its own; it assembles from the
    // other ten builders' saved output instead.
    openSideRecipeId,
    openSaladRecipeId,
    openSmoothieRecipeId,
    openFermentationRecipeId,
    openBeverageRecipeId,
    openSnackRecipeId,
    openBakedGoodsRecipeId,
    openSoupRecipeId,
    openSauceRecipeId,
    openHandheldRecipeId,
    openDessertRecipeId,
    // Set when reached via a saved MEAL favorite's own "Use this Favorite"
    // tap (see app/food-items.tsx) -- 2026-08-08. Named mealFavoriteId
    // rather than fromMealFavoriteId (unlike the ten fromXFavoriteId params
    // just above) since it maps straight onto MealBuilder's own
    // favoriteId prop, not a builder-specific fromFavoriteId one -- Meal
    // Builder assembles from the other builders' saved records rather than
    // having its own X_ingredients table, so its favorite payload is a
    // genuinely different shape (see MealFavoriteComponentsPayload in
    // lib/db.ts) with no "editSideId-style" edit concept to mirror either.
    mealFavoriteId,
    // Schedule's/Home's own "Log now" action (see schedule.tsx's
    // handleLogNow and index.tsx's own Day Arc equivalent) -- both push
    // these same five params, unread by anything until Meal Builder existed
    // to read them. mealType/title prefill Meal Builder's identity step;
    // templateMealId, when it names a meal Meal Builder itself built,
    // resumes with that meal's own component selections already loaded
    // (see MealBuilder's own templateMealId comment). favoriteId isn't read
    // here -- none of the nine sub-builders' own favoriting is wired up to
    // write one yet, so there's nothing for it to resolve against.
    scheduleItemId,
    mealType: scheduledMealType,
    title: scheduledTitle,
    templateMealId,
    // Set by TabHub's own go() (components/TabHub.tsx) whenever Food is
    // picked directly from the hub -- 2026-08-08, see
    // hooks/useAutoOpenLensHubSignal.ts for the full reasoning. Read
    // directly out of this screen's own existing useLocalSearchParams
    // call rather than that shared hook, purely to avoid a second,
    // redundant call to it in this one file (every other tab screen has
    // no pre-existing params of its own to fold this into).
    openLensHub,
  } = useLocalSearchParams<{
    editMealId?: string;
    editSideId?: string;
    editSaladId?: string;
    editSmoothieId?: string;
    editFermentationId?: string;
    editBeverageId?: string;
    editSnackId?: string;
    editBakedGoodsId?: string;
    editSoupId?: string;
    editSauceId?: string;
    editHandheldId?: string;
    editDessertId?: string;
    fromSideFavoriteId?: string;
    fromSaladFavoriteId?: string;
    fromSmoothieFavoriteId?: string;
    fromFermentationFavoriteId?: string;
    fromBeverageFavoriteId?: string;
    fromSnackFavoriteId?: string;
    fromBakedGoodsFavoriteId?: string;
    fromSoupFavoriteId?: string;
    fromSauceFavoriteId?: string;
    fromHandheldFavoriteId?: string;
    fromDessertFavoriteId?: string;
    openSideRecipeId?: string;
    openSaladRecipeId?: string;
    openSmoothieRecipeId?: string;
    openFermentationRecipeId?: string;
    openBeverageRecipeId?: string;
    openSnackRecipeId?: string;
    openBakedGoodsRecipeId?: string;
    openSoupRecipeId?: string;
    openSauceRecipeId?: string;
    openHandheldRecipeId?: string;
    openDessertRecipeId?: string;
    mealFavoriteId?: string;
    scheduleItemId?: string;
    mealType?: string;
    title?: string;
    templateMealId?: string;
    openLensHub?: string;
  }>();
  const [lens, setLens] = useState<FoodLens>('mealBuilder');
  const activeLensLabel = FOOD_LENS_FULL_NAMES[lens];
  // Which real answer, if any, was given on BeverageSubtypePicker's own
  // screen -- 2026-08-13, see that component's own header comment for the
  // full request. null means "haven't asked yet this visit," so the
  // Beverages lens shows the picker before BeverageBuilder itself ever
  // mounts (see the render switch below). Reset to null in the LensHub
  // onSelect handler below, same as every other piece of "which lens am I
  // really in" state on this screen -- a fresh pick of Beverages from the
  // menu always asks again, matching this whole app's own "never an
  // instant resume of whatever was last open" convention (Purple Digest's
  // Basic Health tree does the identical reset on its own fresh arrival).
  const [beverageSubtype, setBeverageSubtype] = useState<BeverageSubtypeKey | null>(null);
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  // Lifted out of MyItemsHub itself, 2026-08-16 -- so LensHub's own new
  // "My Foods" top-left tile (see its extraTile prop below) can open THIS
  // SAME popup, at its own already-established position, after closing
  // itself first. MyItemsHub's own floating button (further down) still
  // works exactly as it always has, fully independent of this state -- see
  // that component's own open/onOpenChange comment for the full "why."
  const [myFoodsOpen, setMyFoodsOpen] = useState(false);
  // 2026-08-17: the "Saved & Favorites" submenu -- a SECOND, hidden-trigger-
  // button MyItemsHub instance (see that component's own hideTriggerButton
  // comment) opened by tapping the real "Saved & Favorites" row inside the
  // primary My Foods popup above. Composes correctly with zero extra
  // plumbing: MyItemsHub's own row handler already calls setOpen(false) on
  // the popup that owns the row BEFORE firing that row's own onPress, the
  // same close-then-open sequencing LensHub's own extraTile already relies
  // on, so the primary popup always closes itself first.
  const [savedFavoritesOpen, setSavedFavoritesOpen] = useState(false);
  // A real food-trial round trip, 2026-08-14 -- see lib/pendingFoodTrialReturn.ts's
  // own comment for the full "why." A ref, not state, deliberately -- this
  // screen itself never unmounts on a tab switch (app/(tabs)/_layout.tsx's
  // own <Tabs> keeps every screen mounted in the background), so a plain
  // ref reliably carries "we're returning from a trial we ourselves
  // started" from the departure blur into the very next focus, with no
  // extra render needed to smuggle it across.
  const resumingFromFoodTrial = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // The real blur-time decision, shared by every path below (the
      // early-return trial-resume branch included) -- skips the normal
      // "tear the builder down" reset for exactly one blur when it's
      // caused by navigating away to start a food trial, marking
      // resumingFromFoodTrial so the very next focus knows to skip its own
      // reset too. Any OTHER blur (a real, unrelated departure) resets
      // normally, same as always.
      function handleBlur() {
        if (consumePendingFoodTrialReturn()) {
          resumingFromFoodTrial.current = true;
          return;
        }
        setRevealed(false);
      }

      // Genuinely nothing to do here -- revealed/lens were never actually
      // reset in the first place (see handleBlur just above), so whatever
      // builder was open, and however far into building it, is still
      // exactly there.
      if (resumingFromFoodTrial.current) {
        resumingFromFoodTrial.current = false;
        return handleBlur;
      }
      // editSideId/editSaladId/editSmoothieId/editFermentationId/
      // editBeverageId/editSnackId/editBakedGoodsId/editSoupId/editSauceId
      // override the normal "always land on the picker" reset below --
      // without this, arriving here to edit a record would still show the
      // LensHub picker for a beat (or permanently, once revealed was reset
      // false on focus) instead of the record itself.
      if (scheduleItemId) {
        setLens('mealBuilder');
        setRevealed(true);
        return;
      }
      if (mealFavoriteId) {
        setLens('mealBuilder');
        setRevealed(true);
        return;
      }
      if (editMealId) {
        setLens('mealBuilder');
        setRevealed(true);
        return;
      }
      if (editSideId) {
        setLens('sideBuilder');
        setRevealed(true);
        return;
      }
      if (editSaladId) {
        setLens('saladBuilder');
        setRevealed(true);
        return;
      }
      if (editSmoothieId) {
        setLens('smoothieBuilder');
        setRevealed(true);
        return;
      }
      if (editFermentationId) {
        setLens('fermentationBuilder');
        setRevealed(true);
        return;
      }
      if (editBeverageId) {
        setLens('beverageBuilder');
        setRevealed(true);
        return;
      }
      if (editSnackId) {
        setLens('snackBuilder');
        setRevealed(true);
        return;
      }
      if (editBakedGoodsId) {
        setLens('bakedGoodsBuilder');
        setRevealed(true);
        return;
      }
      if (editSoupId) {
        setLens('soupBuilder');
        setRevealed(true);
        return;
      }
      if (editSauceId) {
        setLens('saucesBuilder');
        setRevealed(true);
        return;
      }
      if (editHandheldId) {
        setLens('handheldsBuilder');
        setRevealed(true);
        return;
      }
      if (editDessertId) {
        setLens('dessertBuilder');
        setRevealed(true);
        return;
      }
      // Favorite-reuse routing, 2026-08-08 -- same shape as the ten
      // editXId checks just above, checked after them so an edit link
      // always wins if somehow both were present (shouldn't happen in
      // practice, since food-items.tsx only ever pushes one or the other).
      if (fromSideFavoriteId) {
        setLens('sideBuilder');
        setRevealed(true);
        return;
      }
      if (fromSaladFavoriteId) {
        setLens('saladBuilder');
        setRevealed(true);
        return;
      }
      if (fromSmoothieFavoriteId) {
        setLens('smoothieBuilder');
        setRevealed(true);
        return;
      }
      if (fromFermentationFavoriteId) {
        setLens('fermentationBuilder');
        setRevealed(true);
        return;
      }
      if (fromBeverageFavoriteId) {
        setLens('beverageBuilder');
        setRevealed(true);
        return;
      }
      if (fromSnackFavoriteId) {
        setLens('snackBuilder');
        setRevealed(true);
        return;
      }
      if (fromBakedGoodsFavoriteId) {
        setLens('bakedGoodsBuilder');
        setRevealed(true);
        return;
      }
      if (fromSoupFavoriteId) {
        setLens('soupBuilder');
        setRevealed(true);
        return;
      }
      if (fromSauceFavoriteId) {
        setLens('saucesBuilder');
        setRevealed(true);
        return;
      }
      if (fromHandheldFavoriteId) {
        setLens('handheldsBuilder');
        setRevealed(true);
        return;
      }
      if (fromDessertFavoriteId) {
        setLens('dessertBuilder');
        setRevealed(true);
        return;
      }
      // Purple Digest's own "Build This Recipe" routing, 2026-08-14 -- same
      // shape as the fromXFavoriteId checks just above, checked right after
      // them so an edit or favorite-reuse link always wins if somehow more
      // than one of these were present at once (shouldn't happen in
      // practice, since purple-digest.tsx only ever pushes one of these ten
      // params at a time).
      if (openSideRecipeId) {
        setLens('sideBuilder');
        setRevealed(true);
        return;
      }
      if (openSaladRecipeId) {
        setLens('saladBuilder');
        setRevealed(true);
        return;
      }
      if (openSmoothieRecipeId) {
        setLens('smoothieBuilder');
        setRevealed(true);
        return;
      }
      if (openFermentationRecipeId) {
        setLens('fermentationBuilder');
        setRevealed(true);
        return;
      }
      if (openBeverageRecipeId) {
        setLens('beverageBuilder');
        setRevealed(true);
        return;
      }
      if (openSnackRecipeId) {
        setLens('snackBuilder');
        setRevealed(true);
        return;
      }
      if (openBakedGoodsRecipeId) {
        setLens('bakedGoodsBuilder');
        setRevealed(true);
        return;
      }
      if (openSoupRecipeId) {
        setLens('soupBuilder');
        setRevealed(true);
        return;
      }
      if (openSauceRecipeId) {
        setLens('saucesBuilder');
        setRevealed(true);
        return;
      }
      if (openHandheldRecipeId) {
        setLens('handheldsBuilder');
        setRevealed(true);
        return;
      }
      if (openDessertRecipeId) {
        setLens('dessertBuilder');
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return handleBlur;
    }, [
      scheduleItemId,
      mealFavoriteId,
      editMealId,
      editSideId,
      editSaladId,
      editSmoothieId,
      editFermentationId,
      editBeverageId,
      editSnackId,
      editBakedGoodsId,
      editSoupId,
      editSauceId,
      editHandheldId,
      editDessertId,
      fromSideFavoriteId,
      fromSaladFavoriteId,
      fromSmoothieFavoriteId,
      fromFermentationFavoriteId,
      fromBeverageFavoriteId,
      fromSnackFavoriteId,
      fromBakedGoodsFavoriteId,
      fromSoupFavoriteId,
      fromSauceFavoriteId,
      fromHandheldFavoriteId,
      fromDessertFavoriteId,
      openSideRecipeId,
      openSaladRecipeId,
      openSmoothieRecipeId,
      openFermentationRecipeId,
      openBeverageRecipeId,
      openSnackRecipeId,
      openBakedGoodsRecipeId,
      openSoupRecipeId,
      openSauceRecipeId,
      openHandheldRecipeId,
      openDessertRecipeId,
    ]),
  );

  // "My Foods" categories (see MyItemsHub below) -- refetched every time
  // that popup opens (via its own onOpen prop), not just once at mount, so
  // a side saved a moment ago is reflected in its own count right away
  // rather than whatever was fetched the first time this screen rendered.
  // Only counts are kept here -- the real item lists are fetched again by
  // app/food-items.tsx itself once a category is actually opened, so this
  // screen never has to hold two copies of the same data in sync.
  //
  // This array is the one place that grows as more builders get a real
  // save path -- Side, Salad, Smoothie, Fermentation, Beverage, Snack,
  // Baked Goods, Soup, Sauces, Handhelds, and Dessert are all eleven
  // sub-builders now built (see Status above); Meal Builder assembles from
  // these rather than saving its own kind of record, so it never adds an
  // entry here. Favorites filtered to 'side'/'salad'/'smoothie'/
  // 'fermentation'/'beverage'/'snack'/'bakedGoods'/'soup'/'sauce'/
  // 'handheld'/'dessert' specifically -- this list has no use for meal
  // favorites saved by the old, deleted meal builder.
  const [sideCount, setSideCount] = useState(0);
  const [sideFavoriteCount, setSideFavoriteCount] = useState(0);
  const [saladCount, setSaladCount] = useState(0);
  const [saladFavoriteCount, setSaladFavoriteCount] = useState(0);
  const [smoothieCount, setSmoothieCount] = useState(0);
  const [smoothieFavoriteCount, setSmoothieFavoriteCount] = useState(0);
  const [fermentationCount, setFermentationCount] = useState(0);
  const [fermentationFavoriteCount, setFermentationFavoriteCount] = useState(0);
  const [beverageCount, setBeverageCount] = useState(0);
  const [beverageFavoriteCount, setBeverageFavoriteCount] = useState(0);
  const [snackCount, setSnackCount] = useState(0);
  const [snackFavoriteCount, setSnackFavoriteCount] = useState(0);
  const [bakedGoodsCount, setBakedGoodsCount] = useState(0);
  const [bakedGoodsFavoriteCount, setBakedGoodsFavoriteCount] = useState(0);
  const [soupCount, setSoupCount] = useState(0);
  const [soupFavoriteCount, setSoupFavoriteCount] = useState(0);
  const [sauceCount, setSauceCount] = useState(0);
  const [sauceFavoriteCount, setSauceFavoriteCount] = useState(0);
  const [handheldCount, setHandheldCount] = useState(0);
  const [handheldFavoriteCount, setHandheldFavoriteCount] = useState(0);
  const [dessertCount, setDessertCount] = useState(0);
  const [dessertFavoriteCount, setDessertFavoriteCount] = useState(0);
  // Meal favorites, 2026-08-08 -- no "Saved Meals" count alongside it the
  // way every sub-builder gets: Meal Builder logs a real meals row directly
  // (via createMealFromComponents), it never saves its own separate
  // standalone record the way sides/salads/etc. do, so there's nothing to
  // browse here except favorites (see saveMealFavorite/getMealFavorite in
  // lib/db.ts).
  const [mealFavoriteCount, setMealFavoriteCount] = useState(0);
  // "My Food Products," 2026-08-16 -- real barcode-scanned items, direct
  // request: "add My Food Products. This is where the scanned in foods
  // from the store should go outside of being able to use them in
  // building some food thing." A real count, refetched the same way as
  // every other tile above, alongside a real detail screen (see
  // app/food-product-detail.tsx) reached via app/food-items.tsx's own new
  // itemType==='scannedProduct' case -- not just the already-existing
  // "From Your Scans" quick-pick inside FoodLookup, which only ever lets a
  // scanned product be found and reused as an INGREDIENT, never browsed,
  // renamed, priced, or deleted on its own.
  const [scannedProductCount, setScannedProductCount] = useState(0);
  async function loadMyFoodsCounts() {
    const [
      scannedProducts,
      sides,
      sideFavorites,
      salads,
      saladFavorites,
      smoothies,
      smoothieFavorites,
      fermentations,
      fermentationFavorites,
      beverages,
      beverageFavorites,
      snacks,
      snackFavorites,
      bakedGoods,
      bakedGoodsFavorites,
      soups,
      soupFavorites,
      sauces,
      sauceFavorites,
      handhelds,
      handheldFavorites,
      desserts,
      dessertFavorites,
      mealFavorites,
    ] = await Promise.all([
      listScannedProducts(),
      listSides(),
      listFavorites(50, 'side'),
      listSalads(),
      listFavorites(50, 'salad'),
      listSmoothies(),
      listFavorites(50, 'smoothie'),
      listFermentations(),
      listFavorites(50, 'fermentation'),
      listBeverages(),
      listFavorites(50, 'beverage'),
      listSnacks(),
      listFavorites(50, 'snack'),
      listBakedGoods(),
      listFavorites(50, 'bakedGoods'),
      listSoups(),
      listFavorites(50, 'soup'),
      listSauces(),
      listFavorites(50, 'sauce'),
      listHandhelds(),
      listFavorites(50, 'handheld'),
      listDesserts(),
      listFavorites(50, 'dessert'),
      listFavorites(50, 'meal'),
    ]);
    setScannedProductCount(scannedProducts.length);
    setSideCount(sides.length);
    setSideFavoriteCount(sideFavorites.length);
    setSaladCount(salads.length);
    setSaladFavoriteCount(saladFavorites.length);
    setSmoothieCount(smoothies.length);
    setSmoothieFavoriteCount(smoothieFavorites.length);
    setFermentationCount(fermentations.length);
    setFermentationFavoriteCount(fermentationFavorites.length);
    setBeverageCount(beverages.length);
    setBeverageFavoriteCount(beverageFavorites.length);
    setSnackCount(snacks.length);
    setSnackFavoriteCount(snackFavorites.length);
    setBakedGoodsCount(bakedGoods.length);
    setBakedGoodsFavoriteCount(bakedGoodsFavorites.length);
    setSoupCount(soups.length);
    setSoupFavoriteCount(soupFavorites.length);
    setSauceCount(sauces.length);
    setSauceFavoriteCount(sauceFavorites.length);
    setHandheldCount(handhelds.length);
    setHandheldFavoriteCount(handheldFavorites.length);
    setDessertCount(desserts.length);
    setDessertFavoriteCount(dessertFavorites.length);
    setMealFavoriteCount(mealFavorites.length);
  }
  // 2026-08-17: restructured from one flat 24-tile list into the requested
  // 4-tier grouping -- "the My Foods menu should list things in the
  // following way: My Food Products... My Whole Foods... System Meals...
  // Saved & Favorites (a sub menu appears with the choices for each
  // builder)." The real "Scan a Product" action tile that used to lead this
  // list is gone entirely -- moved to Home, per the same direct request
  // ("Move the Scan a Product link to the home screen for now").
  const myFoodsCategories: MyItemsCategory[] = [
    {
      // "My Food Products" -- unchanged from its own 2026-08-16 original
      // (see scannedProductCount's own comment above), just promoted to a
      // real top-level tile now that its own former sibling action tile is
      // gone.
      id: 'scanned-products',
      label: 'My Food Products',
      count: scannedProductCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'scannedProduct', status: 'saved', title: 'My Food Products' } }),
    },
    {
      // "My Whole Foods" -- real home-grown harvests, tracked on the Garden
      // tab (see lib/db.ts's own garden_harvests table). Deep-links straight
      // into Garden's own Harvest Log lens via openGardenLens, the same real
      // "land on the actual content, not this tab's own resting picker"
      // pattern already established by openDigestLens on purple-digest.tsx.
      // No count here -- a real query would need pulling in Garden's own
      // listGardenHarvests just for this one tile, and unlike a saved
      // side/salad/etc. a harvest's own real "worth showing" number (an
      // unused amount still on hand) isn't just its row count -- left as a
      // real, honest, deferred follow-up rather than a misleading count.
      id: 'whole-foods',
      label: 'My Whole Foods',
      onPress: () => router.push({ pathname: '/garden', params: { openGardenLens: 'harvestLog' } }),
    },
    {
      // "System Meals" -- this app's own curated Recipes library (Purple
      // Digest's real, app-authored recipe cards), not anything the user
      // created themselves -- the real, most plausible referent for content
      // the SYSTEM (not the user) provides, sitting between "My Whole Foods"
      // (the user's own harvests) and "Saved & Favorites" (the user's own
      // creations) in the request's own ordering.
      id: 'system-meals',
      label: 'System Meals',
      onPress: () => router.push({ pathname: '/purple-digest', params: { openDigestLens: 'recipes' } }),
    },
    {
      // "Saved & Favorites" -- opens the second, submenu MyItemsHub instance
      // below (savedAndFavoritesCategories), holding every builder's own
      // real saved/favorite pair. See savedFavoritesOpen's own comment above
      // for how this composes with zero extra plumbing.
      id: 'saved-favorites',
      label: 'Saved & Favorites',
      onPress: () => setSavedFavoritesOpen(true),
    },
  ];

  // The real submenu opened by "Saved & Favorites" above -- every builder's
  // own saved/favorite pair, unchanged in content and order from what used
  // to be the tail of the single flat myFoodsCategories list.
  const savedAndFavoritesCategories: MyItemsCategory[] = [
    {
      id: 'side-saved',
      label: 'Saved Sides',
      count: sideCount,
      onPress: () => router.push({ pathname: '/food-items', params: { itemType: 'side', status: 'saved', title: 'Saved Sides' } }),
    },
    {
      id: 'side-favorite',
      label: 'Favorite Sides',
      count: sideFavoriteCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'side', status: 'favorite', title: 'Favorite Sides' } }),
    },
    {
      id: 'salad-saved',
      label: 'Saved Salads & Bowls',
      count: saladCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'salad', status: 'saved', title: 'Saved Salads & Bowls' } }),
    },
    {
      id: 'salad-favorite',
      label: 'Favorite Salads & Bowls',
      count: saladFavoriteCount,
      onPress: () =>
        router.push({
          pathname: '/food-items',
          params: { itemType: 'salad', status: 'favorite', title: 'Favorite Salads & Bowls' },
        }),
    },
    {
      id: 'smoothie-saved',
      label: 'Saved Smoothies',
      count: smoothieCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'smoothie', status: 'saved', title: 'Saved Smoothies' } }),
    },
    {
      id: 'smoothie-favorite',
      label: 'Favorite Smoothies',
      count: smoothieFavoriteCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'smoothie', status: 'favorite', title: 'Favorite Smoothies' } }),
    },
    {
      id: 'fermentation-saved',
      label: 'Saved Fermentations',
      count: fermentationCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'fermentation', status: 'saved', title: 'Saved Fermentations' } }),
    },
    {
      id: 'fermentation-favorite',
      label: 'Favorite Fermentations',
      count: fermentationFavoriteCount,
      onPress: () =>
        router.push({
          pathname: '/food-items',
          params: { itemType: 'fermentation', status: 'favorite', title: 'Favorite Fermentations' },
        }),
    },
    {
      id: 'beverage-saved',
      label: 'Saved Beverages',
      count: beverageCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'beverage', status: 'saved', title: 'Saved Beverages' } }),
    },
    {
      id: 'beverage-favorite',
      label: 'Favorite Beverages',
      count: beverageFavoriteCount,
      onPress: () =>
        router.push({
          pathname: '/food-items',
          params: { itemType: 'beverage', status: 'favorite', title: 'Favorite Beverages' },
        }),
    },
    {
      id: 'snack-saved',
      label: 'Saved Snacks',
      count: snackCount,
      onPress: () => router.push({ pathname: '/food-items', params: { itemType: 'snack', status: 'saved', title: 'Saved Snacks' } }),
    },
    {
      id: 'snack-favorite',
      label: 'Favorite Snacks',
      count: snackFavoriteCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'snack', status: 'favorite', title: 'Favorite Snacks' } }),
    },
    {
      id: 'baked-goods-saved',
      label: 'Saved Baked Goods',
      count: bakedGoodsCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'bakedGoods', status: 'saved', title: 'Saved Baked Goods' } }),
    },
    {
      id: 'baked-goods-favorite',
      label: 'Favorite Baked Goods',
      count: bakedGoodsFavoriteCount,
      onPress: () =>
        router.push({
          pathname: '/food-items',
          params: { itemType: 'bakedGoods', status: 'favorite', title: 'Favorite Baked Goods' },
        }),
    },
    {
      id: 'soup-saved',
      label: 'Saved Soups',
      count: soupCount,
      onPress: () => router.push({ pathname: '/food-items', params: { itemType: 'soup', status: 'saved', title: 'Saved Soups' } }),
    },
    {
      id: 'soup-favorite',
      label: 'Favorite Soups',
      count: soupFavoriteCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'soup', status: 'favorite', title: 'Favorite Soups' } }),
    },
    {
      id: 'sauce-saved',
      label: 'Saved Sauces',
      count: sauceCount,
      onPress: () => router.push({ pathname: '/food-items', params: { itemType: 'sauce', status: 'saved', title: 'Saved Sauces' } }),
    },
    {
      id: 'sauce-favorite',
      label: 'Favorite Sauces',
      count: sauceFavoriteCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'sauce', status: 'favorite', title: 'Favorite Sauces' } }),
    },
    {
      id: 'handheld-saved',
      label: 'Saved Handhelds',
      count: handheldCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'handheld', status: 'saved', title: 'Saved Handhelds' } }),
    },
    {
      id: 'handheld-favorite',
      label: 'Favorite Handhelds',
      count: handheldFavoriteCount,
      onPress: () =>
        router.push({
          pathname: '/food-items',
          params: { itemType: 'handheld', status: 'favorite', title: 'Favorite Handhelds' },
        }),
    },
    {
      id: 'dessert-saved',
      label: 'Saved Desserts',
      count: dessertCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'dessert', status: 'saved', title: 'Saved Desserts' } }),
    },
    {
      id: 'dessert-favorite',
      label: 'Favorite Desserts',
      count: dessertFavoriteCount,
      onPress: () =>
        router.push({
          pathname: '/food-items',
          params: { itemType: 'dessert', status: 'favorite', title: 'Favorite Desserts' },
        }),
    },
    // No 'meal-saved' tile alongside it -- see mealFavoriteCount's own
    // comment above for why Meal Builder has nothing standalone to browse
    // besides its favorites.
    {
      id: 'meal-favorite',
      label: 'Favorite Meals',
      count: mealFavoriteCount,
      onPress: () =>
        router.push({ pathname: '/food-items', params: { itemType: 'meal', status: 'favorite', title: 'Favorite Meals' } }),
    },
  ];

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- 2026-07-28, explicitly requested: with a
          builder's own content showing, a horizontal drag that doesn't
          land cleanly on one of its own scrollers (e.g. SideBuilder's
          pill pickers) was being caught by this swipe gesture instead,
          closing the builder and jumping to the next/previous tab. Swipe-
          to-change-tab now only works from a lens's OWN picker (nothing
          revealed yet) -- once a real builder is open, only its own
          LensHub corner button can back out of it. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Food" variant="produce" revealed={revealed}>
          {lens === 'mealBuilder' ? (
            // MealBuilder owns its own layout entirely, same reasoning as
            // every other builder below -- but never sits behind a
            // connected FoodLookup (it assembles from already-saved
            // records, not raw ingredients), so it's always inside its own
            // ScrollView, never the plain-View branch some of the others need.
            <MealBuilder
              tabColor={TAB_COLOR}
              scheduleItemId={scheduleItemId}
              initialMealType={scheduledMealType}
              initialTitle={scheduledTitle}
              templateMealId={templateMealId}
              favoriteId={mealFavoriteId}
              editMealId={editMealId}
            />
          ) : lens === 'sideBuilder' ? (
            // SideBuilder owns its own layout entirely (a plain View while
            // FoodLookup's own picker is active, its own ScrollView
            // otherwise) -- see that component's own comment for why,
            // same FlatList-in-ScrollView reasoning as Insights' own Food
            // Lookup lens.
            <SideBuilder
              tabColor={TAB_COLOR}
              editSideId={editSideId}
              fromFavoriteId={fromSideFavoriteId}
              openRecipeId={openSideRecipeId}
            />
          ) : lens === 'saladBuilder' ? (
            // SaladBuilder is a direct adaptation of SideBuilder (see that
            // file's own top comment) -- same layout-ownership reasoning
            // applies here too.
            <SaladBuilder
              tabColor={TAB_COLOR}
              editSaladId={editSaladId}
              fromFavoriteId={fromSaladFavoriteId}
              openRecipeId={openSaladRecipeId}
            />
          ) : lens === 'smoothieBuilder' ? (
            // SmoothieBuilder is a direct adaptation of SaladBuilder (see
            // that file's own top comment) -- same layout-ownership
            // reasoning applies here too.
            <SmoothieBuilder
              tabColor={TAB_COLOR}
              editSmoothieId={editSmoothieId}
              fromFavoriteId={fromSmoothieFavoriteId}
              openRecipeId={openSmoothieRecipeId}
            />
          ) : lens === 'fermentationBuilder' ? (
            // FermentationBuilder is a direct adaptation of SideBuilder
            // (see that file's own top comment for why Side, not Salad/
            // Smoothie) -- same layout-ownership reasoning applies here too.
            <FermentationBuilder
              tabColor={TAB_COLOR}
              editFermentationId={editFermentationId}
              fromFavoriteId={fromFermentationFavoriteId}
              openRecipeId={openFermentationRecipeId}
            />
          ) : lens === 'beverageBuilder' ? (
            // BeverageBuilder is a direct adaptation of SideBuilder (see
            // that file's own top comment for why Side, not Salad/Smoothie)
            // -- same layout-ownership reasoning applies here too.
            //
            // 2026-08-13: a real "what kind of beverage" question, via
            // BeverageSubtypePicker, sits in front of BeverageBuilder
            // itself now -- but only for a genuinely fresh arrival at this
            // lens. editBeverageId/fromBeverageFavoriteId (editing or
            // reusing something that already exists) skip it outright,
            // matching every other builder's own identical deep-link
            // convention -- openBeverageRecipeId (Purple Digest's own
            // "Build This Recipe" button, 2026-08-14) does the same, for
            // the identical reason: a curated recipe already names its own
            // real ingredients, so there's no real "what kind" question
            // left to ask. Two of the picker's own seven real options
            // (Smoothies, Fermentation) don't lead to a beverageSubtype at
            // all -- BeverageSubtypePicker's own onPress calls setLens
            // directly for those, so this branch is simply never reached
            // for them; this component just needs to render the picker
            // until a real "stay in Beverage Builder" answer sets one.
            editBeverageId || fromBeverageFavoriteId || openBeverageRecipeId ? (
              <BeverageBuilder
                tabColor={TAB_COLOR}
                editBeverageId={editBeverageId}
                fromFavoriteId={fromBeverageFavoriteId}
                openRecipeId={openBeverageRecipeId}
              />
            ) : beverageSubtype ? (
              <BeverageBuilder tabColor={TAB_COLOR} subtype={beverageSubtype} />
            ) : (
              <BeverageSubtypePicker
                tabColor={TAB_COLOR}
                onPick={(choice) => {
                  if (choice.kind === 'redirect') setLens(choice.lens);
                  else setBeverageSubtype(choice.key);
                }}
              />
            )
          ) : lens === 'snackBuilder' ? (
            // SnackBuilder is a direct adaptation of SideBuilder (see that
            // file's own top comment for why Side, not Salad/Smoothie) --
            // same layout-ownership reasoning applies here too.
            <SnackBuilder
              tabColor={TAB_COLOR}
              editSnackId={editSnackId}
              fromFavoriteId={fromSnackFavoriteId}
              openRecipeId={openSnackRecipeId}
            />
          ) : lens === 'bakedGoodsBuilder' ? (
            // BakedGoodsBuilder is a direct adaptation of SideBuilder (see
            // that file's own top comment for why Side, not Salad/Smoothie)
            // -- same layout-ownership reasoning applies here too.
            <BakedGoodsBuilder
              tabColor={TAB_COLOR}
              editBakedGoodsId={editBakedGoodsId}
              fromFavoriteId={fromBakedGoodsFavoriteId}
              openRecipeId={openBakedGoodsRecipeId}
            />
          ) : lens === 'soupBuilder' ? (
            // SoupBuilder is a direct adaptation of SideBuilder (see that
            // file's own top comment for why Side, not Salad/Smoothie) --
            // same layout-ownership reasoning applies here too.
            <SoupBuilder
              tabColor={TAB_COLOR}
              editSoupId={editSoupId}
              fromFavoriteId={fromSoupFavoriteId}
              openRecipeId={openSoupRecipeId}
            />
          ) : lens === 'saucesBuilder' ? (
            // SaucesBuilder is a direct adaptation of SideBuilder (see that
            // file's own top comment for why Side, not Salad/Smoothie, and
            // for why this one component is plural despite everything
            // inside it being named singular) -- same layout-ownership
            // reasoning applies here too.
            <SaucesBuilder
              tabColor={TAB_COLOR}
              editSauceId={editSauceId}
              fromFavoriteId={fromSauceFavoriteId}
              openRecipeId={openSauceRecipeId}
            />
          ) : lens === 'handheldsBuilder' ? (
            // HandheldsBuilder is a direct adaptation of SideBuilder (see
            // that file's own top comment for why Side, not Salad/Smoothie,
            // and for why this one component is plural despite everything
            // inside it being named singular, the same situation Sauces
            // already established) -- same layout-ownership reasoning
            // applies here too.
            <HandheldsBuilder
              tabColor={TAB_COLOR}
              editHandheldId={editHandheldId}
              fromFavoriteId={fromHandheldFavoriteId}
              openRecipeId={openHandheldRecipeId}
            />
          ) : lens === 'dessertBuilder' ? (
            // DessertBuilder is a direct adaptation of SaucesBuilder (see
            // that file's own top comment for the full reasoning, including
            // why -- unlike Sauces/Handhelds -- this one component stays
            // singular throughout, matching its own singular lens key) --
            // same layout-ownership reasoning applies here too.
            <DessertBuilder
              tabColor={TAB_COLOR}
              editDessertId={editDessertId}
              fromFavoriteId={fromDessertFavoriteId}
              openRecipeId={openDessertRecipeId}
            />
          ) : null}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Food" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Foods"
        tabColor={TAB_COLOR}
        categories={myFoodsCategories}
        onOpen={loadMyFoodsCounts}
        open={myFoodsOpen}
        onOpenChange={setMyFoodsOpen}
      />
      {/* "Saved & Favorites" submenu, 2026-08-17 -- see savedFavoritesOpen's
          own comment above. No onOpen refetch of its own: the primary My
          Foods popup already refetches the same counts every time IT opens
          (loadMyFoodsCounts), and this submenu only ever opens as a direct
          result of that popup opening first, so its own counts are already
          current by the time it shows. */}
      <MyItemsHub
        label="Saved & Favorites"
        tabColor={TAB_COLOR}
        categories={savedAndFavoritesCategories}
        open={savedFavoritesOpen}
        onOpenChange={setSavedFavoritesOpen}
        hideTriggerButton
      />
      <LensHub
        pageTitle="Food"
        headerLabel="Nutrition Builders"
        buttonLabel="Food"
        options={FOOD_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={openLensHub}
        extraTile={{ label: 'My Foods', icon: 'bookmarks-outline', onPress: () => setMyFoodsOpen(true) }}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
          // A fresh pick of Beverages always asks "what kind" again --
          // see beverageSubtype's own comment above. Reset unconditionally
          // on every pick (not just when key === 'beverageBuilder'), the
          // simplest way to guarantee it's never stale the next time this
          // lens IS picked again.
          setBeverageSubtype(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
