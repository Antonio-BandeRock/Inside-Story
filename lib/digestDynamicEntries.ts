// 2026-08-15 -- the real content behind Digest's My Kitchen/My
// Favorites categories, direct request: "when a person uses the builders
// to build their own creations from any of the builders, there should be
// a place in the Digest where their saved creations are available to see
// with the same level of detail that you included in the recipes just
// now. There should be another place that provides the same level for
// their favorite builds from each category as well as favorite meals."
//
// Genuinely different from every file under lib/digest/*.ts: those hold
// static, bundled content, identical for every user and shipped with the
// app. This file computes real DigestEntry[] LIVE from the person's own
// local data (their own saved builder creations, favorites, favorite
// meals) -- there's no way to know ahead of time what anyone will
// actually build, so it deliberately lives outside lib/digest/ to keep
// that directory's own "static, bundled content" contract honest. See
// app/(tabs)/purple-digest.tsx's own dynamicEntries state/useFocusEffect
// for how this gets called and re-called as the person's own data changes.
//
// Each real entry gets the same computed RecipeCard detail (ingredients,
// yield, nutrition highlights, condition notes) the curated Recipes
// category already ships (see lib/digest/recipes.ts's own header comment
// for the real, established curation rules this reuses directly), via the
// exact same lib/db.ts general, ingredient-list-based core functions --
// getNutritionHighlightsForIngredients/getConditionNotesForIngredients --
// called directly here off an already-resolved ingredient list (a real
// saved record's own resolveMealComponent, or a favorite's own plain
// payload, which has no real componentId to resolve through the saved-
// record tables at all) rather than through their own thin
// componentType/componentId wrappers, avoiding a second, redundant real
// resolve for the same component. No flavorNotes -- nobody hand-wrote
// prose for a one-off personal creation the way curated Recipes' authors
// did, and RecipeCard's own flavorNotes field was made optional
// specifically for this (see that type's own comment). instructions IS
// now real for a one-off creation, 2026-08-17 -- Side Builder is the
// first (see SideBuilder.tsx's own Steps section) to let a person author
// their own real steps directly; every other builder still has nothing
// to surface here yet, the same "undefined until wired" story
// ResolvedMealComponent/BuilderFavoritePayload's own instructions field
// already carries.

import {
  getConditionNotesForIngredients,
  getMealFavorite,
  getNutritionHighlightsForIngredients,
  getUserConditions,
  listAllConditions,
  listFavorites,
  listMealComponentOptions,
  resolveMealComponent,
  type BuilderFavoriteIngredient,
  type BuilderFavoriteItemType,
  type BuilderFavoritePayload,
  type MealComponentOption,
  type MealComponentType,
  type MealIngredientInput,
} from './db';
import { getConnectionByPublicKey } from './connections';
import { getSharedFromName, listSharedRecipes, type ShareComponentPayload, type ShareMealPayload } from './sharing';
import type { DigestEntry } from './digest/types';

const COMPONENT_TYPES: MealComponentType[] = [
  'side',
  'salad',
  'smoothie',
  'fermentation',
  'beverage',
  'snack',
  'bakedGoods',
  'soup',
  'sauce',
  'handheld',
  'dessert',
];

// The same real shelf labels app/(tabs)/purple-digest.tsx's own
// DYNAMIC_ENTRY_GROUP_ORDER groups these into -- kept here as the single
// real source, referenced by the UI layer's own dynamicGroupLabel field
// rather than re-derived there.
const GROUP_LABEL_BY_TYPE: Record<MealComponentType, string> = {
  side: 'Sides',
  salad: 'Salads & Bowls',
  smoothie: 'Smoothies',
  fermentation: 'Fermentation',
  beverage: 'Beverages',
  snack: 'Snacks',
  bakedGoods: 'Baked Goods',
  soup: 'Soups',
  sauce: 'Sauces',
  handheld: 'Handhelds',
  dessert: 'Desserts',
};

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

// Real, plain, computed formatting -- not hand-authored the way curated
// Recipes' own ingredient lines are, since there's no way to write real
// prose ahead of time for a creation that doesn't exist yet. 'N/A' is a
// real, deliberate sentinel value both CUT_PREP_METHODS and
// COOKING_METHODS use across every builder (see SideBuilder.tsx) for "this
// question doesn't apply here" -- left out rather than shown verbatim.
function formatIngredientText(ingredient: {
  foodName: string;
  quantity: number;
  unit: string;
  cutPrep?: string;
  cookingMethod?: string;
}): string {
  const base = `${formatNumber(ingredient.quantity)} ${ingredient.unit} ${ingredient.foodName}`;
  const details = [ingredient.cutPrep, ingredient.cookingMethod]
    .filter((value): value is string => Boolean(value) && value !== 'N/A')
    .map((value) => value.toLowerCase());
  return details.length > 0 ? `${base} (${details.join(', ')})` : base;
}

function builderIngredientToMealIngredientInput(ingredient: BuilderFavoriteIngredient): MealIngredientInput {
  return {
    foodId: `${ingredient.foodId}|${ingredient.source}`,
    foodName: ingredient.foodName,
    category: ingredient.category,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    cookingMethod: ingredient.cookingMethod,
    notes: ingredient.prepNote,
  };
}

function servingsLabel(servings: number): string {
  return servings === 1 ? '1 serving' : `${formatNumber(servings)} servings`;
}

// The person's own actually-tracked conditions, resolved once per screen
// load and shared across every real entry built below rather than
// re-querying the small conditions table per item -- never all 19,
// matching how the rest of this app already scopes condition-aware
// content to what someone actually tracks.
async function getTrackedConditions(): Promise<{ code: string; name: string }[]> {
  const [selectedCodes, allConditions] = await Promise.all([getUserConditions(), listAllConditions()]);
  const selected = new Set(selectedCodes);
  return allConditions.filter((condition) => selected.has(condition.code)).map((condition) => ({
    code: condition.code,
    name: condition.name,
  }));
}

// --- My Kitchen -------------------------------------------------------

async function buildMyKitchenEntryForOption(
  componentType: MealComponentType,
  option: MealComponentOption,
  conditions: { code: string; name: string }[],
): Promise<DigestEntry> {
  // One real resolve, reused for the ingredient list AND both nutrition/
  // condition computations below, rather than calling
  // getComponentNutritionHighlights/getComponentConditionNotes (which each
  // resolve the same component a second time internally) -- the same real
  // ingredient list backs all three.
  const [resolved, sharedFromName] = await Promise.all([
    resolveMealComponent({ componentType, componentId: option.id, yourSharePercent: 100 }),
    getSharedFromName(componentType, option.id),
  ]);
  const ingredients = resolved?.ingredients ?? [];
  const depthData = resolved?.depthData;
  // 2026-08-25 -- once a saved record carries real depth data (computed at
  // save time by lib/recipeDepth.ts, only 'side' so far, see
  // ResolvedMealComponent.depthData's own comment), that replaces this
  // older, thinner live check entirely rather than showing both: the two
  // would otherwise say overlapping things at different levels of detail
  // (a plain "may be worth a closer look" sentence next to a real,
  // severity-graded caution for the same ingredient). A record with no
  // depth data yet (an older side, or any other builder type before its
  // own rollout) keeps this exact original behavior, unchanged.
  const [highlights, conditionNotes] = await Promise.all([
    getNutritionHighlightsForIngredients(ingredients, resolved?.servings ?? option.servings),
    depthData ? Promise.resolve([]) : getConditionNotesForIngredients(ingredients, conditions),
  ]);
  const stageConditionNotes = (depthData?.stageNotes ?? []).map((note) => ({ condition: note.title, note: note.message }));

  const groupLabel = GROUP_LABEL_BY_TYPE[componentType];
  const sharedNote = sharedFromName ? ` Shared with you by ${sharedFromName}.` : '';

  return {
    id: `mykitchen-${componentType}-${option.id}`,
    category: 'myKitchen',
    title: option.name,
    teaser: option.ingredientNames
      ? `A saved ${groupLabel.toLowerCase()}: ${option.ingredientNames}`
      : `A saved ${groupLabel.toLowerCase()} creation.`,
    summary: `Your own saved ${groupLabel.toLowerCase().replace(/s$/, '')}, makes ${servingsLabel(option.servings)}.${sharedNote}`,
    citations: [],
    overallTier: 'strong',
    dynamicGroupLabel: groupLabel,
    dynamicAction: { kind: 'component', componentType: componentType as BuilderFavoriteItemType, componentId: option.id },
    recipeCard: {
      yield: `Makes ${servingsLabel(option.servings)}.`,
      ingredients: ingredients
        .filter((ingredient) => ingredient.foodId)
        .map((ingredient) => ({ text: formatIngredientText(ingredient) })),
      // resolveMealComponent already resolved this alongside `ingredients`
      // above (only ever real for componentType 'side' so far, see that
      // function's own comment) -- no second fetch needed.
      instructions: resolved?.instructions,
      nutritionHighlights: highlights,
      conditionNotes: [...conditionNotes, ...stageConditionNotes],
      dietTags: depthData?.dietTags,
      safeForConditions: depthData?.safeForConditions,
      conditionCautions: depthData?.conditionCautions,
    },
  };
}

export async function buildMyKitchenEntries(): Promise<DigestEntry[]> {
  const conditions = await getTrackedConditions();
  const entries: DigestEntry[] = [];
  for (const componentType of COMPONENT_TYPES) {
    const options = await listMealComponentOptions(componentType);
    for (const option of options) {
      entries.push(await buildMyKitchenEntryForOption(componentType, option, conditions));
    }
  }
  return entries;
}

// --- My Favorites -------------------------------------------------------

// A favorited item's own real ingredients live directly in
// favorites.payload_json (a BuilderFavoritePayload), never in one of the
// 11 saved-record tables -- there's no real componentId here for
// getComponentIngredients to resolve, so this reads listFavorites' own raw
// payload_json directly (not getBuilderFavorite, which touches
// last_used_at as a real side effect -- browsing this screen shouldn't
// silently bump "last used" ordering just from looking).
async function buildMyFavoritesComponentEntry(
  componentType: MealComponentType,
  favoriteId: string,
  payload: BuilderFavoritePayload,
  conditions: { code: string; name: string }[],
): Promise<DigestEntry> {
  const mealIngredients = payload.ingredients.map(builderIngredientToMealIngredientInput);
  const depthData = payload.depthData;
  // See buildMyKitchenEntryForOption's own comment on why real depth data
  // replaces this older, thinner check entirely rather than showing both.
  const [highlights, conditionNotes] = await Promise.all([
    getNutritionHighlightsForIngredients(mealIngredients, payload.servings),
    depthData ? Promise.resolve([]) : getConditionNotesForIngredients(mealIngredients, conditions),
  ]);
  const stageConditionNotes = (depthData?.stageNotes ?? []).map((note) => ({ condition: note.title, note: note.message }));

  const groupLabel = GROUP_LABEL_BY_TYPE[componentType];
  const ingredientNames = payload.ingredients.map((ingredient) => ingredient.foodName).join(', ');

  return {
    id: `myfavorites-${componentType}-${favoriteId}`,
    category: 'myFavorites',
    title: payload.name,
    teaser: ingredientNames ? `A favorite ${groupLabel.toLowerCase()}: ${ingredientNames}` : `A favorite ${groupLabel.toLowerCase()}.`,
    summary: `One of your favorite ${groupLabel.toLowerCase()}, makes ${servingsLabel(payload.servings)}.`,
    citations: [],
    overallTier: 'strong',
    dynamicGroupLabel: groupLabel,
    dynamicAction: { kind: 'component', componentType: componentType as BuilderFavoriteItemType, componentId: favoriteId },
    recipeCard: {
      yield: `Makes ${servingsLabel(payload.servings)}.`,
      ingredients: payload.ingredients.map((ingredient) => ({ text: formatIngredientText(ingredient) })),
      // Real, genuinely for free the instant any builder starts writing
      // this into a favorite's own payload_json (only Side Builder does
      // so far) -- payload IS BuilderFavoritePayload, no extra fetch.
      instructions: payload.instructions,
      nutritionHighlights: highlights,
      conditionNotes: [...conditionNotes, ...stageConditionNotes],
      dietTags: depthData?.dietTags,
      safeForConditions: depthData?.safeForConditions,
      conditionCautions: depthData?.conditionCautions,
    },
  };
}

async function buildMyFavoritesMealEntry(
  favoriteId: string,
  conditions: { code: string; name: string }[],
): Promise<DigestEntry | null> {
  const favorite = await getMealFavorite(favoriteId);
  if (!favorite) return null; // old-shape favorite, nothing real to resolve

  const allIngredients: MealIngredientInput[] = [];
  const componentNames: string[] = [];
  for (const component of favorite.components) {
    const resolved = await resolveMealComponent({
      componentType: component.componentType,
      componentId: component.componentId,
      yourSharePercent: component.yourSharePercent,
    });
    if (!resolved) continue;
    allIngredients.push(...resolved.ingredients);
    componentNames.push(resolved.name);
  }
  if (allIngredients.length === 0) return null;

  // Already at each real component's own actual yourSharePercent (not
  // forced to 100 the way a single saved item is) -- a favorite meal is a
  // real combination of specific portions, not one whole dish on its own.
  const [highlights, conditionNotes] = await Promise.all([
    getNutritionHighlightsForIngredients(allIngredients, 1),
    getConditionNotesForIngredients(allIngredients, conditions),
  ]);

  return {
    id: `myfavorites-meal-${favoriteId}`,
    category: 'myFavorites',
    title: favorite.name,
    teaser: `A favorite meal: ${componentNames.join(', ')}.`,
    summary: `One of your favorite meals, built from ${componentNames.length} saved ${componentNames.length === 1 ? 'item' : 'items'}.`,
    citations: [],
    overallTier: 'strong',
    dynamicGroupLabel: 'Favorite Meals',
    dynamicAction: { kind: 'meal', mealFavoriteId: favoriteId },
    recipeCard: {
      yield: `One plate: ${componentNames.join(' + ')}.`,
      ingredients: allIngredients
        .filter((ingredient) => ingredient.foodId)
        .map((ingredient) => ({
          text: formatIngredientText({
            foodName: ingredient.foodName,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cookingMethod: ingredient.cookingMethod,
          }),
        })),
      nutritionHighlights: highlights,
      conditionNotes,
    },
  };
}

export async function buildMyFavoritesEntries(): Promise<DigestEntry[]> {
  const conditions = await getTrackedConditions();
  const entries: DigestEntry[] = [];

  for (const componentType of COMPONENT_TYPES) {
    const records = await listFavorites(200, componentType as BuilderFavoriteItemType);
    for (const record of records) {
      try {
        const payload = JSON.parse(record.payload_json) as BuilderFavoritePayload;
        if (!payload?.name || !Array.isArray(payload.ingredients)) continue;
        entries.push(await buildMyFavoritesComponentEntry(componentType, record.id, payload, conditions));
      } catch (error) {
        console.error(`[digestDynamicEntries] Failed to parse favorite ${record.id}`, error);
      }
    }
  }

  const mealRecords = await listFavorites(200, 'meal');
  for (const record of mealRecords) {
    const entry = await buildMyFavoritesMealEntry(record.id, conditions);
    if (entry) entries.push(entry);
  }

  return entries;
}

// --- Recipes Shared With Me ----------------------------------------------
//
// A real, genuine share someone sent -- lands here, inside My Kitchen,
// rather than immediately becoming a permanent saved record, 2026-08-15
// direct request: "It stays there until they try it and decide if they
// want to add it to their own saved recipes or as a favorite... if they
// didn't like the recipe they can just delete it." See lib/sharing.ts's
// own listSharedRecipes/promoteSharedRecipeToSaved/
// promoteSharedRecipeToFavorite/deleteSharedRecipe for the real functions
// this group's own DynamicEntryActions 'shared' branch (purple-digest.tsx)
// calls.
// photoUri isn't read here -- components/EntryPhotoSection.tsx (Purple
// Digest's own rendering layer) resolves a staged share's own photo LIVE,
// via the same real {kind:'sharedRecipe', sharedRecipeId} target every
// other consumer of a staged row's photo already resolves through, rather
// than baking a snapshot of it onto this entry at build time.
async function buildSharedRecipeEntry(
  id: string,
  fromName: string,
  payload: ShareComponentPayload | ShareMealPayload,
  conditions: { code: string; name: string }[],
  senderPublicKeyBase64: string | null,
): Promise<DigestEntry> {
  const isMeal = payload.kind === 'meal';
  const ingredients: MealIngredientInput[] = isMeal
    ? payload.components.flatMap((component) => component.builder.ingredients.map(builderIngredientToMealIngredientInput))
    : payload.builder.ingredients.map(builderIngredientToMealIngredientInput);
  const servings = isMeal ? 1 : payload.builder.servings;
  const name = isMeal ? payload.name : payload.builder.name;
  const ingredientNames = isMeal
    ? payload.components.map((component) => component.builder.name).join(', ')
    : payload.builder.ingredients.map((ingredient) => ingredient.foodName).join(', ');

  // Step 5, 2026-08-15 -- a real, live "is this a known Connection" check
  // (never baked in at stage time -- see this table's own CREATE TABLE
  // comment in lib/db.ts for why), so this note stays accurate even if
  // the person pairs with this same sender LATER, after already staging
  // this share.
  const connection = senderPublicKeyBase64 ? await getConnectionByPublicKey(senderPublicKeyBase64) : null;
  const verifiedNote = connection
    ? `Verified: this is genuinely from your connection ${connection.name}.`
    : `Not yet verified -- ${fromName} isn't one of your connections yet.`;

  const [highlights, conditionNotes] = await Promise.all([
    getNutritionHighlightsForIngredients(ingredients, servings),
    getConditionNotesForIngredients(ingredients, conditions),
  ]);

  return {
    id: `sharedrecipe-${id}`,
    category: 'myKitchen',
    title: name,
    teaser: `Shared with you by ${fromName}: ${ingredientNames}.`,
    summary: isMeal
      ? `A whole meal shared by ${fromName} -- try it, then decide whether to save it to your own recipes or as a favorite. ${verifiedNote}`
      : `A ${payload.componentType.replace(/([A-Z])/g, ' $1').toLowerCase()}, shared by ${fromName}, makes ${servingsLabel(servings)} -- try it, then decide whether to save it to your own recipes or as a favorite. ${verifiedNote}`,
    citations: [],
    overallTier: 'strong',
    dynamicGroupLabel: 'Recipes Shared With Me',
    dynamicAction: isMeal
      ? { kind: 'shared', sharedRecipeId: id }
      : { kind: 'shared', sharedRecipeId: id, componentType: payload.componentType as BuilderFavoriteItemType },
    recipeCard: {
      yield: isMeal ? `One plate: ${ingredientNames}.` : `Makes ${servingsLabel(servings)}.`,
      ingredients: ingredients.filter((ingredient) => ingredient.foodId).map((ingredient) => ({ text: formatIngredientText(ingredient) })),
      // A single shared component carries its own real steps, when the
      // sender's own builder had any (see BuilderFavoritePayload's own
      // comment) -- a shared MEAL bundles several real components each
      // with their own separate steps, no honest single numbered list to
      // combine them into, so this stays undefined for that case.
      instructions: isMeal ? undefined : payload.builder.instructions,
      nutritionHighlights: highlights,
      conditionNotes,
    },
  };
}

export async function buildSharedRecipeEntries(): Promise<DigestEntry[]> {
  const [conditions, staged] = await Promise.all([getTrackedConditions(), listSharedRecipes()]);
  const entries: DigestEntry[] = [];
  for (const row of staged) {
    entries.push(await buildSharedRecipeEntry(row.id, row.fromName, row.payload, conditions, row.senderPublicKeyBase64));
  }
  return entries;
}
