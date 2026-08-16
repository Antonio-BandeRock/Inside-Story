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
//
// Step 6 of the real device-pairing prerequisite list, 2026-08-15 (see
// CLAUDE.md's own "Sharing individual recipes between two people"
// security-requirement note) -- a real, second delivery mechanism for the
// exact same real, signed envelope this file already builds: a genuine
// local .is file (writeIsFile/writeIsFileForComponent/
// writeIsFileForCuratedRecipe/writeIsFileForMeal, below), registered with
// Android/iOS at the OS level (see app.json's own real android.
// intentFilters, and lib/isFileLinking.ts's own receiving side) so tapping
// a received .is file from ANY app opens it directly here, not just a
// hashimotosapp:// deep link reached through this app's own share sheet.
// The .is file's own real content is deliberately plain, un-base64'd JSON
// (a file has no URL-safety constraint the way a query string does) --
// see writeIsFile's own comment for the full reasoning.

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
import { base64ToBytes, bytesToBase64, getDeviceIdentity, signMessage, verifySignature } from './deviceIdentity';
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

// v2, 2026-08-15 (step 5 of the real device-pairing prerequisite list --
// see CLAUDE.md's own "Sharing individual recipes between two people"
// security-requirement note): every real envelope now carries the
// sender's own real public key AND travels signed -- see encodeEnvelope/
// decodeShareEnvelope below for the actual sign/verify mechanics. No real
// users exist yet to migrate (this project's own standing, repeated
// precedent for exactly this situation), so v1 (unsigned) is retired
// outright rather than kept as a fallback -- decodeShareEnvelope treats
// anything that isn't a genuine, valid v2 envelope as malformed, the same
// as any other corrupted link.
export type ShareEnvelope = {
  v: 2;
  fromName: string;
  payload: ShareComponentPayload | ShareMealPayload;
  senderPublicKeyBase64: string;
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

// A real, zero-dependency, UTF-8-safe base64 codec, used only to make the
// deep link's own query-string payload read as a normal, opaque-looking
// token rather than raw JSON. 2026-08-15, direct on-device bug report:
// putting JSON.stringify(envelope) straight into the query string meant
// every quote/colon/comma got percent-encoded individually --
// "%3A%22tbsp%22%3A%22cookingMethod"-style visible garbage in the plain-
// text share message, unreadable and alarming-looking for someone without
// the app. Base64 first means the same real payload still travels intact,
// but what actually shows up in the message is a normal-looking run of
// letters/digits (the same visual shape as any other app's own share
// link), not obviously-broken text. Hand-written rather than reaching for
// global btoa/atob (Hermes' own support for those is a relatively recent
// addition, unconfirmed on-device in this exact build) or
// TextEncoder/TextDecoder (historically inconsistent across RN/Hermes
// versions without a polyfill) -- this needs nothing beyond plain string
// character-code operations, guaranteed in any JS engine.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)!;
    if (code > 0xffff) i++; // consumed a surrogate pair
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function bytesToUtf8(bytes: number[]): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      result += String.fromCharCode(b0);
      i += 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      result += String.fromCharCode(((b0 & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else {
      const codePoint =
        ((b0 & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      result += String.fromCodePoint(codePoint);
      i += 4;
    }
  }
  return result;
}

// Exported 2026-08-15 -- lib/connections.ts's own real invite encode/
// decode (step 4 of the device-pairing prerequisite list) needs the
// identical real job (a UTF-8 JSON string, embeddable in a URL query
// param) this codec already solves correctly here; reused directly rather
// than duplicated a third time (lib/deviceIdentity.ts's own separate
// codec is genuinely different -- byte-array-oriented, for moving raw key
// bytes through SecureStore, not a JSON string).
export function encodeBase64Utf8(str: string): string {
  const bytes = utf8Bytes(str);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const triplet = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += b1 === undefined ? '=' : BASE64_CHARS[(triplet >> 6) & 0x3f];
    result += b2 === undefined ? '=' : BASE64_CHARS[triplet & 0x3f];
  }
  return result;
}

export function decodeBase64Utf8(base64: string): string {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i]);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytesToUtf8(bytes);
}

// The real, actual thing that travels over the wire -- deliberately
// separate from ShareEnvelope itself, which is what a caller works with
// once decoded/verified. unsignedJson is the EXACT, verbatim
// JSON.stringify(ShareEnvelope) text that was signed, kept as a raw string
// rather than re-derived from a parsed object at decode time, so
// signature verification never has to rely on JSON.stringify/JSON.parse
// round-tripping key order identically -- it checks the signature against
// the precise bytes that were actually signed, byte for byte.
type SignedEnvelopeWire = {
  unsignedJson: string;
  signature: string;
};

// 2026-08-15, step 5 of the real device-pairing prerequisite list -- every
// real envelope now signs itself with this device's own real identity
// (lib/deviceIdentity.ts). Signing needs no knowledge of who will receive
// it (a device can always sign with its own key, regardless of the
// recipient) -- the real question of whether the RECEIVING device already
// recognizes this specific key is a separate, later step (see
// decodeShareEnvelope below, and app/import-shared.tsx's own "Verified"
// check), not something encoding needs to know about at all.
//
// Extracted 2026-08-15 (step 6, the real .is file) into its own real,
// shared function -- both encodeEnvelope (the URL path) and writeIsFile
// (the new file path) need the identical real "build the full envelope,
// sign it, wrap it" work; only what happens to the resulting wire object
// afterward (base64-into-a-URL vs. plain-JSON-into-a-file) differs.
async function buildSignedWire(payload: ShareComponentPayload | ShareMealPayload, fromName: string): Promise<SignedEnvelopeWire> {
  const identity = await getDeviceIdentity();
  const envelope: ShareEnvelope = {
    v: 2,
    fromName: fromName.trim() || 'A friend',
    payload,
    senderPublicKeyBase64: identity.publicKeyBase64,
  };
  const unsignedJson = JSON.stringify(envelope);
  const signature = await signMessage(new Uint8Array(utf8Bytes(unsignedJson)));
  return { unsignedJson, signature: bytesToBase64(signature) };
}

async function encodeEnvelope(payload: ShareComponentPayload | ShareMealPayload, fromName: string): Promise<string> {
  const wire = await buildSignedWire(payload, fromName);
  return Linking.createURL('/import-shared', { queryParams: { data: encodeBase64Utf8(JSON.stringify(wire)) } });
}

// Step 6, 2026-08-15, direct request: "Let's start on step 6, the .is file
// registration." A real, local .is file -- literally the same real signed
// wire object encodeEnvelope already builds, just written as plain,
// readable JSON directly to a file instead of base64-encoded into a URL
// query string (a file has no real URL-safety constraint to work around,
// so there's no real reason to add that extra encoding layer here). This
// is the actual "different DELIVERY mechanism for the same already-signed
// envelope" the roadmap named directly -- reuses buildSignedWire verbatim,
// never re-derives the signing logic a second time.
//
// Written into the app's own cache directory (Paths.cache, not
// Paths.document) -- a shared .is file is a genuinely disposable, one-time
// artifact meant to be handed straight to the OS share sheet and then
// forgotten, not a real, standing local record the way a saved photo is;
// letting the OS reclaim this under storage pressure is the right, honest
// tradeoff. A real, per-call timestamped filename avoids any risk of two
// concurrent shares colliding on the same file.
export async function writeIsFile(payload: ShareComponentPayload | ShareMealPayload, fromName: string): Promise<string | null> {
  try {
    const wire = await buildSignedWire(payload, fromName);
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'is-shares');
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, `inside-story-share-${Date.now()}.is`);
    file.write(JSON.stringify(wire));
    return file.uri;
  } catch (error) {
    console.error('[sharing] Failed to write a real .is file', error);
    return null;
  }
}

// The one real, shared place a photo gets resolved and compressed down for
// embedding -- every one of the three real payload-builders below calls
// this the same way, so none of them can drift on how a photo actually
// gets prepared.
async function resolveSharePhotoBase64(
  target: Parameters<typeof getPhotoForTarget>[0],
): Promise<string | undefined> {
  const uri = await getPhotoForTarget(target);
  if (!uri) return undefined;
  return (await prepareSharePhoto(uri)) ?? undefined;
}

// Extracted 2026-08-15 (step 6) into its own real, shared payload-builder
// -- both encodeShareLink (the URL path) and writeIsFileForComponent (the
// new file path) need the identical real "resolve this saved/favorited
// component's own ingredients and photo into a real payload" work; only
// the final encoding step (encodeEnvelope vs. writeIsFile) differs.
async function buildComponentSharePayload(
  componentType: MealComponentType,
  componentId: string,
): Promise<ShareComponentPayload | null> {
  const builder = await buildBuilderFavoritePayload(componentType, componentId);
  if (!builder) return null;
  const photoBase64 = await resolveSharePhotoBase64({ kind: 'component', componentType, componentId });
  return { kind: 'component', componentType, builder, photoBase64 };
}

export async function encodeShareLink(componentType: MealComponentType, componentId: string, fromName: string): Promise<string | null> {
  const payload = await buildComponentSharePayload(componentType, componentId);
  return payload ? encodeEnvelope(payload, fromName) : null;
}

// Step 6's own real .is-file counterpart to encodeShareLink above.
export async function writeIsFileForComponent(componentType: MealComponentType, componentId: string, fromName: string): Promise<string | null> {
  const payload = await buildComponentSharePayload(componentType, componentId);
  return payload ? writeIsFile(payload, fromName) : null;
}

// The real, separate curated-recipe case -- lets a person share one of the
// 47 bundled recipes directly (with any personal photo override they've
// added), not just their own saved creations/favorites. Extracted
// 2026-08-15 (step 6) the same way as buildComponentSharePayload above.
async function buildCuratedRecipeSharePayload(
  recipeId: string,
  componentType: BuilderFavoriteItemType,
): Promise<ShareComponentPayload | null> {
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
  return { kind: 'component', componentType, builder, photoBase64 };
}

export async function encodeShareLinkFromCuratedRecipe(
  recipeId: string,
  componentType: BuilderFavoriteItemType,
  fromName: string,
): Promise<string | null> {
  const payload = await buildCuratedRecipeSharePayload(recipeId, componentType);
  return payload ? encodeEnvelope(payload, fromName) : null;
}

// Step 6's own real .is-file counterpart to encodeShareLinkFromCuratedRecipe above.
export async function writeIsFileForCuratedRecipe(
  recipeId: string,
  componentType: BuilderFavoriteItemType,
  fromName: string,
): Promise<string | null> {
  const payload = await buildCuratedRecipeSharePayload(recipeId, componentType);
  return payload ? writeIsFile(payload, fromName) : null;
}

// The real, separate meal-favorite case -- a receiving device has no way
// to reference the sender's own component ids (those only exist locally,
// on the sender's own phone), so the payload bundles each real, resolved
// component's own full ingredient list directly, not just a reference to
// it. Extracted 2026-08-15 (step 6) the same way as the two builders above.
async function buildMealSharePayload(mealFavoriteId: string): Promise<ShareMealPayload | null> {
  const favorite = await getMealFavorite(mealFavoriteId);
  if (!favorite) return null;

  const components: ShareMealPayload['components'] = [];
  for (const component of favorite.components) {
    const builder = await buildBuilderFavoritePayload(component.componentType, component.componentId);
    if (builder) components.push({ componentType: component.componentType, builder });
  }
  if (components.length === 0) return null;

  const photoBase64 = await resolveSharePhotoBase64({ kind: 'favorite', favoriteId: mealFavoriteId });
  return { kind: 'meal', name: favorite.name, mealType: favorite.mealType, components, photoBase64 };
}

export async function encodeMealShareLink(mealFavoriteId: string, fromName: string): Promise<string | null> {
  const payload = await buildMealSharePayload(mealFavoriteId);
  return payload ? encodeEnvelope(payload, fromName) : null;
}

// Step 6's own real .is-file counterpart to encodeMealShareLink above.
export async function writeIsFileForMeal(mealFavoriteId: string, fromName: string): Promise<string | null> {
  const payload = await buildMealSharePayload(mealFavoriteId);
  return payload ? writeIsFile(payload, fromName) : null;
}

// Defensive parse AND the real verification gate -- never trusts a
// received link's own shape (or signature) blindly, the same discipline
// every other real "external input" boundary in this app already holds
// to. Returns null for anything genuinely malformed OR anything whose
// signature doesn't check out, so app/import-shared.tsx can show one
// plain, honest "this link doesn't look right" state either way, rather
// than leaking which specific check failed to a potential attacker.
// photoBase64 is still deliberately never validated beyond "is it
// present" -- a malformed base64 string simply fails to decode later
// (saveSharePhotoFromBase64 returns null, never throws), which
// stageSharedItem below already treats as "no photo," not a reason to
// reject the whole share.
//
// `raw` is the query string's own `data` value exactly as Expo Router/
// expo-linking already hand it back (percent-decoded) -- since
// encodeEnvelope now base64-encodes the wire JSON before it ever reaches
// the query string (see that function's own comment), this is the one
// real place that reverses it, before anything else runs.
//
// Deliberately does NOT check whether senderPublicKeyBase64 is a known
// Connection here -- that's a separate, async, real database lookup
// (getConnectionByPublicKey, lib/connections.ts), and this function stays
// synchronous on purpose so its one existing caller (app/import-shared.tsx's
// own useMemo) doesn't need a bigger restructure. A genuinely UNKNOWN
// sender still verifies and decodes successfully here -- "not yet a
// Connection" isn't the same thing as "the signature is wrong," and this
// app's own core sharing feature is explicitly meant to work with anyone,
// not just people already paired. Whether the sender is a recognized
// Connection is checked separately, downstream, purely to decide whether
// to show a real "Verified" badge -- never to decide whether to accept the
// share at all.
export function decodeShareEnvelope(raw: string): ShareEnvelope | null {
  try {
    const wire = JSON.parse(decodeBase64Utf8(raw)) as Partial<SignedEnvelopeWire>;
    if (typeof wire.unsignedJson !== 'string' || typeof wire.signature !== 'string') return null;

    const parsed = JSON.parse(wire.unsignedJson) as Partial<ShareEnvelope>;
    if (
      parsed.v !== 2 ||
      typeof parsed.fromName !== 'string' ||
      !parsed.payload ||
      typeof parsed.senderPublicKeyBase64 !== 'string'
    ) {
      return null;
    }

    if (parsed.payload.kind === 'component') {
      const p = parsed.payload;
      if (!p.componentType || !p.builder?.name || !Array.isArray(p.builder?.ingredients)) return null;
    } else if (parsed.payload.kind === 'meal') {
      const p = parsed.payload;
      if (!p.name || !Array.isArray(p.components) || p.components.length === 0) return null;
    } else {
      return null;
    }

    // The real, mandatory check: verify against the exact, verbatim bytes
    // that were originally signed (wire.unsignedJson's own raw text), not
    // a re-serialized object. A signature that doesn't check out here
    // means real tampering in transit or a genuinely corrupted link --
    // either way, "if the code is wrong, it isn't accepted," rejected
    // outright.
    const message = new Uint8Array(utf8Bytes(wire.unsignedJson));
    const signatureBytes = base64ToBytes(wire.signature);
    if (!verifySignature(message, signatureBytes, parsed.senderPublicKeyBase64)) return null;

    return parsed as ShareEnvelope;
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
  // The real, already-verified sender public key this share was signed
  // with (step 5, 2026-08-15) -- null only for a genuinely pre-step-5
  // staged row that predates this column existing at all; every new share
  // staged from here on always has one, since decodeShareEnvelope now
  // rejects anything without a real, valid signature before it ever
  // reaches stageSharedItem.
  senderPublicKeyBase64: string | null;
  receivedAt: string;
};

type SharedRecipeDbRow = {
  from_name: string;
  payload_json: string;
  photo_uri: string | null;
  sender_public_key_base64: string | null;
  received_at: string;
};

function sharedRecipeFromRow(id: string, row: SharedRecipeDbRow): SharedRecipeRow | null {
  try {
    const payload = JSON.parse(row.payload_json) as ShareComponentPayload | ShareMealPayload;
    return {
      id,
      fromName: row.from_name,
      payload,
      photoUri: row.photo_uri,
      senderPublicKeyBase64: row.sender_public_key_base64,
      receivedAt: row.received_at,
    };
  } catch {
    return null;
  }
}

async function getSharedRecipeRow(id: string): Promise<SharedRecipeRow | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SharedRecipeDbRow>(
    'SELECT from_name, payload_json, photo_uri, sender_public_key_base64, received_at FROM shared_recipes WHERE id = ?',
    id,
  );
  return row ? sharedRecipeFromRow(id, row) : null;
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
      INSERT INTO shared_recipes (id, from_name, kind, component_type, payload_json, photo_uri, sender_public_key_base64, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    envelope.fromName,
    envelope.payload.kind,
    componentType,
    JSON.stringify(payloadWithoutPhoto),
    photoUri,
    envelope.senderPublicKeyBase64,
    now,
  );

  return { id };
}

export async function listSharedRecipes(): Promise<SharedRecipeRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string } & SharedRecipeDbRow>(
    'SELECT id, from_name, payload_json, photo_uri, sender_public_key_base64, received_at FROM shared_recipes ORDER BY received_at DESC',
  );
  const results: SharedRecipeRow[] = [];
  for (const row of rows) {
    const parsed = sharedRecipeFromRow(row.id, row);
    if (parsed) {
      results.push(parsed);
    } else {
      // A corrupted staged row is skipped rather than crashing the whole
      // list -- not expected in practice, since stageSharedItem always
      // writes a real, valid JSON.stringify result, but a genuinely
      // external input boundary (a shared payload from someone else's
      // phone) is worth defending regardless.
      console.error('[sharing] Skipping corrupted staged recipe', row.id);
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
