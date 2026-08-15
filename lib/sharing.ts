// Sharing a saved creation/favorite/curated recipe with someone else --
// moved out of lib/db.ts on 2026-08-15 into its own real, focused leaf
// module (was a single "--- Sharing ---" block inside the mega-file),
// specifically so it can safely import lib/mealPhotos.ts's own real photo-
// compress/base64 pipeline: lib/db.ts is the one file every other leaf
// module already imports FROM, never the reverse, and mealPhotos.ts itself
// needs to import getDatabase/COMPONENT_TABLE_BY_TYPE/MealComponentType
// from db.ts -- keeping the sharing logic in db.ts too would have made
// db.ts need to import mealPhotos.ts, a real circular-import risk this
// project's own history already warns against (see lib/db.ts's own
// "backwards direction" self-correction note on reportGenerator.ts).
//
// This app has no company server and never will (see CLAUDE.md's own
// "Local-first, no company server holding health data" architecture
// decision) -- so sharing a real creation with someone else can't go
// through anything this app itself hosts. Built entirely on two real,
// already-registered pieces: this app's own hashimotosapp:// deep-link
// scheme (app.json) and React Native's built-in Share API. The wire format
// is plain, human-readable JSON in the link's own query string, URL-
// encoded by Linking.createURL (expo-linking) so the exact scheme/path
// always matches whatever this specific build is actually configured for.
//
// A real photo, when the sender has one, travels the same way -- there is
// no server to host it on, so the only way it can cross from one phone to
// another is embedded directly as base64 bytes inside this same envelope
// (see lib/mealPhotos.ts's own prepareSharePhoto, deliberately capped
// small since it has to ride inside a shareable link/message, not just sit
// on local disk).
//
// Receiving a share, 2026-08-15 direct request, changed from an immediate
// permanent import into a real staging area: a shared item now lands in
// shared_recipes (a genuine local table, distinct from both the 11 saved-
// record tables and favorites) and shows up under Purple Digest's My
// Kitchen as "Recipes Shared With Me" until the person explicitly decides
// to save it to their own recipes, save it as a favorite, or just delete
// it -- see promoteSharedRecipeToSaved/promoteSharedRecipeToFavorite/
// deleteSharedRecipe below. The old, direct-to-permanent-save
// importSharedItem is gone -- this staging flow replaces it entirely.

import * as Linking from 'expo-linking';
import {
  COMPONENT_TABLE_BY_TYPE,
  getComponentDetail,
  getComponentIngredients,
  getCuratedRecipe,
  getDatabase,
  getMealFavorite,
  saveBakedGoods,
  saveBeverage,
  saveBuilderFavorite,
  saveDessert,
  saveFermentation,
  saveHandheld,
  saveMealFavorite,
  saveSalad,
  saveSauce,
  saveSide,
  saveSmoothie,
  saveSnack,
  saveSoup,
  type BuilderFavoriteItemType,
  type BuilderFavoritePayload,
  type MealComponentType,
  type MealFavoriteComponent,
} from './db';
import { deleteMealPhotoFile, getPhotoForTarget, prepareSharePhoto, saveSharePhotoFromBase64, setPhotoForTarget } from './mealPhotos';

export type ShareComponentPayload = {
  kind: 'component';
  componentType: MealComponentType;
  builder: BuilderFavoritePayload;
  photoBase64?: string;
};

export type ShareMealPayload = {
  kind: 'meal';
  name: string;
  mealType: string;
  components: { componentType: MealComponentType; builder: BuilderFavoritePayload }[];
  // One real photo per share -- represents the whole assembled plate, not
  // any single component within it.
  photoBase64?: string;
};

export type ShareEnvelope = {
  v: 1;
  fromName: string;
  payload: ShareComponentPayload | ShareMealPayload;
};

// Real, honest limitation carried straight over from the already-shipped
// Favorites feature: BuilderFavoritePayload/BuilderFavoriteIngredient
// (what a share round-trips through) has no calculatorOverride field, so a
// beverage/fermentation/soup/sauce ingredient tracked via the Alcohol
// Calculator loses that specific override on the far end of a share, the
// exact same way it already does when favorited -- not a new gap this
// feature introduces.
export async function buildBuilderFavoritePayload(
  componentType: MealComponentType,
  componentId: string,
): Promise<BuilderFavoritePayload | null> {
  const detail = await getComponentDetail(componentType, componentId);
  if (!detail) return null;
  const ingredients = await getComponentIngredients(componentType, componentId);

  return {
    name: detail.name,
    servings: detail.servings,
    servingSizeAmount: detail.servingSizeAmount,
    servingSizeUnit: detail.servingSizeUnit,
    ingredients: ingredients
      .filter((ingredient): ingredient is typeof ingredient & { foodId: string } => Boolean(ingredient.foodId))
      .map((ingredient) => {
        const [foodIdStr, source] = ingredient.foodId.split('|');
        return {
          foodId: Number(foodIdStr),
          source,
          foodName: ingredient.foodName,
          category: ingredient.category ?? '',
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cutPrep: ingredient.cutPrep,
          cookingMethod: ingredient.cookingMethod,
          prepNote: ingredient.prepNote ?? undefined,
        };
      }),
  };
}

async function encodeEnvelope(payload: ShareComponentPayload | ShareMealPayload, fromName: string): Promise<string> {
  const envelope: ShareEnvelope = { v: 1, fromName: fromName.trim() || 'A friend', payload };
  return Linking.createURL('/import-shared', { queryParams: { data: JSON.stringify(envelope) } });
}

// The one real, shared place a photo gets resolved and compressed down for
// embedding -- every one of the three real encode entry points below calls
// this the same way, so none of them can drift on how a photo actually
// gets prepared.
async function resolveSharePhotoBase64(
  target: Parameters<typeof getPhotoForTarget>[0],
): Promise<string | undefined> {
  const uri = await getPhotoForTarget(target);
  if (!uri) return undefined;
  return (await prepareSharePhoto(uri)) ?? undefined;
}

export async function encodeShareLink(componentType: MealComponentType, componentId: string, fromName: string): Promise<string | null> {
  const builder = await buildBuilderFavoritePayload(componentType, componentId);
  if (!builder) return null;
  const photoBase64 = await resolveSharePhotoBase64({ kind: 'component', componentType, componentId });
  return encodeEnvelope({ kind: 'component', componentType, builder, photoBase64 }, fromName);
}

// The real, separate curated-recipe case -- lets a person share one of the
// 47 bundled recipes directly (with any personal photo override they've
// added), not just their own saved creations/favorites.
export async function encodeShareLinkFromCuratedRecipe(
  recipeId: string,
  componentType: BuilderFavoriteItemType,
  fromName: string,
): Promise<string | null> {
  const recipe = await getCuratedRecipe(recipeId);
  if (!recipe) return null;
  const builder: BuilderFavoritePayload = {
    name: recipe.name,
    servings: recipe.servings,
    servingSizeAmount: recipe.servingSizeAmount,
    servingSizeUnit: recipe.servingSizeUnit,
    ingredients: recipe.ingredients,
  };
  const photoBase64 = await resolveSharePhotoBase64({ kind: 'curatedRecipe', recipeId });
  return encodeEnvelope({ kind: 'component', componentType, builder, photoBase64 }, fromName);
}

// The real, separate meal-favorite case -- a receiving device has no way
// to reference the sender's own component ids (those only exist locally,
// on the sender's own phone), so the payload bundles each real, resolved
// component's own full ingredient list directly, not just a reference to
// it.
export async function encodeMealShareLink(mealFavoriteId: string, fromName: string): Promise<string | null> {
  const favorite = await getMealFavorite(mealFavoriteId);
  if (!favorite) return null;

  const components: ShareMealPayload['components'] = [];
  for (const component of favorite.components) {
    const builder = await buildBuilderFavoritePayload(component.componentType, component.componentId);
    if (builder) components.push({ componentType: component.componentType, builder });
  }
  if (components.length === 0) return null;

  const photoBase64 = await resolveSharePhotoBase64({ kind: 'favorite', favoriteId: mealFavoriteId });
  return encodeEnvelope({ kind: 'meal', name: favorite.name, mealType: favorite.mealType, components, photoBase64 }, fromName);
}

// Defensive parse -- never trusts a received link's own shape blindly, the
// same discipline every other real "external input" boundary in this app
// already holds to. Returns null for anything genuinely malformed rather
// than throwing, so app/import-shared.tsx can show a plain, honest "this
// link doesn't look right" state instead of crashing. photoBase64 is
// deliberately never validated beyond "is it present" -- a malformed
// base64 string simply fails to decode later (saveSharePhotoFromBase64
// returns null, never throws), which stageSharedItem below already treats
// as "no photo," not a reason to reject the whole share.
export function decodeShareEnvelope(raw: string): ShareEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ShareEnvelope>;
    if (parsed.v !== 1 || typeof parsed.fromName !== 'string' || !parsed.payload) return null;

    if (parsed.payload.kind === 'component') {
      const p = parsed.payload;
      if (!p.componentType || !p.builder?.name || !Array.isArray(p.builder?.ingredients)) return null;
      return parsed as ShareEnvelope;
    }
    if (parsed.payload.kind === 'meal') {
      const p = parsed.payload;
      if (!p.name || !Array.isArray(p.components) || p.components.length === 0) return null;
      return parsed as ShareEnvelope;
    }
    return null;
  } catch {
    return null;
  }
}

// A real, general fallback for a raw, un-parsed URL (e.g. one typed/pasted
// somewhere Expo Router's own linking hasn't already resolved it) --
// thin wrapper over decodeShareEnvelope above.
export function decodeShareLink(url: string): ShareEnvelope | null {
  try {
    const { queryParams } = Linking.parse(url);
    const raw = queryParams?.data;
    if (typeof raw !== 'string') return null;
    return decodeShareEnvelope(raw);
  } catch {
    return null;
  }
}

async function saveComponentFromBuilderPayload(
  componentType: MealComponentType,
  builder: BuilderFavoritePayload,
): Promise<{ id: string }> {
  const input = {
    name: builder.name,
    servings: builder.servings,
    servingSizeAmount: builder.servingSizeAmount,
    servingSizeUnit: builder.servingSizeUnit,
    ingredients: builder.ingredients,
  };
  switch (componentType) {
    case 'side':
      return saveSide(input);
    case 'salad':
      return saveSalad(input);
    case 'smoothie':
      return saveSmoothie(input);
    case 'fermentation':
      return saveFermentation(input);
    case 'beverage':
      return saveBeverage(input);
    case 'snack':
      return saveSnack(input);
    case 'bakedGoods':
      return saveBakedGoods(input);
    case 'soup':
      return saveSoup(input);
    case 'sauce':
      return saveSauce(input);
    case 'handheld':
      return saveHandheld(input);
    case 'dessert':
      return saveDessert(input);
  }
}

export async function setSharedFromName(componentType: MealComponentType, componentId: string, sharedFromName: string): Promise<void> {
  const db = await getDatabase();
  const table = COMPONENT_TABLE_BY_TYPE[componentType];
  await db.runAsync(`UPDATE ${table} SET shared_from_name = ? WHERE id = ?`, sharedFromName, componentId);
}

// Reads the small, real "who shared this with me" footnote a shared item
// carries once promoted out of staging -- a direct column read against
// whichever real table this component type actually lives in, rather than
// widening all 11 getX()'s own already-established return shape just for
// one optional, rarely-populated field.
export async function getSharedFromName(componentType: MealComponentType, componentId: string): Promise<string | null> {
  const db = await getDatabase();
  const table = COMPONENT_TABLE_BY_TYPE[componentType];
  const row = await db.getFirstAsync<{ shared_from_name: string | null }>(`SELECT shared_from_name FROM ${table} WHERE id = ?`, componentId);
  return row?.shared_from_name ?? null;
}

// --- Real staging: "Recipes Shared With Me" ------------------------------

export type SharedRecipeRow = {
  id: string;
  fromName: string;
  payload: ShareComponentPayload | ShareMealPayload;
  photoUri: string | null;
  receivedAt: string;
};

async function getSharedRecipeRow(id: string): Promise<SharedRecipeRow | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ from_name: string; payload_json: string; photo_uri: string | null; received_at: string }>(
    'SELECT from_name, payload_json, photo_uri, received_at FROM shared_recipes WHERE id = ?',
    id,
  );
  if (!row) return null;
  try {
    const payload = JSON.parse(row.payload_json) as ShareComponentPayload | ShareMealPayload;
    return { id, fromName: row.from_name, payload, photoUri: row.photo_uri, receivedAt: row.received_at };
  } catch {
    return null;
  }
}

// The one, real, always-last step app/import-shared.tsx's own explicit
// "Save to Shared Recipes" confirm calls -- writes a genuine new staging
// row, never a permanent saved record. A real photo (if the envelope
// carries one) is decoded to a real local file immediately, and the raw
// base64 itself is deliberately NOT kept in payload_json afterward -- no
// reason to store the same image twice.
export async function stageSharedItem(envelope: ShareEnvelope): Promise<{ id: string }> {
  const db = await getDatabase();
  const id = `shared_${Date.now()}`;
  const now = new Date().toISOString();

  const photoUri = envelope.payload.photoBase64 ? await saveSharePhotoFromBase64(envelope.payload.photoBase64, 'shared') : null;
  const { photoBase64: _photoBase64, ...payloadWithoutPhoto } = envelope.payload;
  const componentType = envelope.payload.kind === 'component' ? envelope.payload.componentType : null;

  await db.runAsync(
    `
      INSERT INTO shared_recipes (id, from_name, kind, component_type, payload_json, photo_uri, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    envelope.fromName,
    envelope.payload.kind,
    componentType,
    JSON.stringify(payloadWithoutPhoto),
    photoUri,
    now,
  );

  return { id };
}

export async function listSharedRecipes(): Promise<SharedRecipeRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; from_name: string; payload_json: string; photo_uri: string | null; received_at: string }>(
    'SELECT id, from_name, payload_json, photo_uri, received_at FROM shared_recipes ORDER BY received_at DESC',
  );
  const results: SharedRecipeRow[] = [];
  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload_json) as ShareComponentPayload | ShareMealPayload;
      results.push({ id: row.id, fromName: row.from_name, payload, photoUri: row.photo_uri, receivedAt: row.received_at });
    } catch (error) {
      // A corrupted staged row is skipped rather than crashing the whole
      // list -- not expected in practice, since stageSharedItem always
      // writes a real, valid JSON.stringify result, but a genuinely
      // external input boundary (a shared payload from someone else's
      // phone) is worth defending regardless.
      console.error('[sharing] Skipping corrupted staged recipe', row.id, error);
    }
  }
  return results;
}

// "Try it, then decide" -- Save to My Recipes. Saves each real component
// the same way every one of the 11 direct-ingredient builders already
// saves its own work, stamps the real sender's name and photo onto the new
// record(s), then removes the staging row. A meal-kind share's own real
// components each become their own separate My Kitchen item (not
// automatically bundled into a favorite meal -- see promoteSharedRecipeTo
// Favorite below for that) -- its own photo (representing the whole
// assembled plate) attaches to the first real saved component, since
// there's no meal-level My Kitchen record to attach it to otherwise.
export async function promoteSharedRecipeToSaved(
  id: string,
): Promise<{ componentType: MealComponentType; componentId: string }[] | null> {
  const row = await getSharedRecipeRow(id);
  if (!row) return null;

  const results: { componentType: MealComponentType; componentId: string }[] = [];

  if (row.payload.kind === 'component') {
    const { id: componentId } = await saveComponentFromBuilderPayload(row.payload.componentType, row.payload.builder);
    await setSharedFromName(row.payload.componentType, componentId, row.fromName);
    if (row.photoUri) {
      await setPhotoForTarget({ kind: 'component', componentType: row.payload.componentType, componentId }, row.photoUri);
    }
    results.push({ componentType: row.payload.componentType, componentId });
  } else {
    for (const component of row.payload.components) {
      const { id: componentId } = await saveComponentFromBuilderPayload(component.componentType, component.builder);
      await setSharedFromName(component.componentType, componentId, row.fromName);
      results.push({ componentType: component.componentType, componentId });
    }
    if (row.photoUri && results.length > 0) {
      await setPhotoForTarget({ kind: 'component', componentType: results[0].componentType, componentId: results[0].componentId }, row.photoUri);
    }
  }

  await deleteSharedRecipe(id, { keepPhotoFile: true });
  return results;
}

// "Try it, then decide" -- Save as Favorite. A component-kind share
// becomes a real, ordinary favorite; a meal-kind share still needs each
// real component saved first (favorites.components references real
// componentIds, the same real constraint saveMealFavorite already has
// everywhere else in this app), then bundles them into a real meal
// favorite -- matching the old direct-import behavior's own shape exactly,
// just reached via an explicit choice now instead of automatically.
export async function promoteSharedRecipeToFavorite(id: string): Promise<{ favoriteId: string } | null> {
  const row = await getSharedRecipeRow(id);
  if (!row) return null;

  let favoriteId: string;

  if (row.payload.kind === 'component') {
    const favorite = await saveBuilderFavorite(row.payload.componentType, row.payload.builder);
    favoriteId = favorite.id;
  } else {
    const savedComponents: MealFavoriteComponent[] = [];
    for (const component of row.payload.components) {
      const { id: componentId } = await saveComponentFromBuilderPayload(component.componentType, component.builder);
      savedComponents.push({ componentType: component.componentType, componentId, yourSharePercent: 100 });
    }
    const favorite = await saveMealFavorite({ name: row.payload.name, mealType: row.payload.mealType, components: savedComponents });
    favoriteId = favorite.id;
  }

  if (row.photoUri) {
    await setPhotoForTarget({ kind: 'favorite', favoriteId }, row.photoUri);
  }

  await deleteSharedRecipe(id, { keepPhotoFile: true });
  return { favoriteId };
}

// "Didn't like it" -- just removes the staging row. keepPhotoFile is set by
// the two promote functions above (the real photo file has already been
// re-attached to a real, permanent target and shouldn't be deleted out
// from under it); an ordinary user-initiated delete does clean up the real
// photo file, so declining a share doesn't leave an orphaned image behind.
export async function deleteSharedRecipe(id: string, options?: { keepPhotoFile?: boolean }): Promise<void> {
  const db = await getDatabase();
  if (!options?.keepPhotoFile) {
    const row = await getSharedRecipeRow(id);
    if (row?.photoUri) {
      await deleteMealPhotoFile(row.photoUri);
    }
  }
  await db.runAsync('DELETE FROM shared_recipes WHERE id = ?', id);
}
