// Meal/dish photos -- 2026-08-15, direct request: "provide a way to take a
// picture using the app of the meal and upload it to the recipe" for
// Purple Digest's Recipes/My Kitchen/My Favorites cards. A real, separate
// leaf module (not folded into lib/db.ts), following the exact same
// dynamic-import pattern lib/customBackgroundImage.ts already proved for
// expo-image-picker/expo-image-manipulator/expo-file-system -- a plain
// top-level `import` from any of these once crashed the whole app on
// launch (see that file's own header comment for the full story), so every
// real, value-level API call from them stays inside a dynamic `await
// import(...)`, never at module scope.
//
// Real, deliberately SMALL size caps, sized to the actual use case rather
// than reused from the (much larger) background-image feature: a dish
// photo is mainly a small on-screen card thumbnail, and at most gets
// printed at roughly half a letter page in a report -- MEAL_PHOTO_MAX_
// DIMENSION (1000px) comfortably covers that, and MEAL_PHOTO_MAX_FILE_
// SIZE_BYTES (400KB, versus the background feature's 3MB) keeps a person
// with a few dozen saved dishes from quietly accumulating gigabytes of
// photos on their phone.
//
// This app is local-first with no backend server -- there is nowhere to
// host a photo for a second phone to fetch. That's why a SECOND, much more
// aggressively compressed path exists (prepareSharePhoto/
// saveSharePhotoFromBase64) specifically for the app-to-app sharing
// envelope (see lib/db.ts's own ShareEnvelope): the only way a photo can
// cross from one phone to another is by embedding its own bytes directly
// in the same JSON payload the ingredients already travel in, so that copy
// is kept deliberately tiny (SHARE_PHOTO_MAX_DIMENSION, well under
// MEAL_PHOTO_MAX_DIMENSION) rather than reusing the full-quality stored
// file.
//
// Every real photo target this app has (a saved builder creation, a
// favorite, a personal override on a bundled curated recipe, or a staged
// shared recipe) is represented by one real, shared PhotoTarget type below
// -- components/EntryPhotoSection.tsx is the one real place that resolves
// a Digest entry into a target and calls getPhotoForTarget/
// setPhotoForTarget, so every one of those four storage shapes gets the
// identical real UI for free.

import type { File as FileType } from 'expo-file-system';
import type { Action, ImageResult } from 'expo-image-manipulator';
import { COMPONENT_TABLE_BY_TYPE, getDatabase, type MealComponentType } from './db';

export const MEAL_PHOTO_MAX_DIMENSION = 1000;
// Below this on its shorter edge, a photo would look visibly soft even at
// small card-thumbnail size -- rejected rather than silently upscaled, the
// same real discipline lib/customBackgroundImage.ts already established.
export const MEAL_PHOTO_MIN_DIMENSION = 200;
export const MEAL_PHOTO_MAX_FILE_SIZE_BYTES = 400 * 1024; // 400 KB

// Deliberately small -- this copy has to travel inside a shared deep link/
// message, not just sit on local disk.
export const SHARE_PHOTO_MAX_DIMENSION = 320;
export const SHARE_PHOTO_MAX_FILE_SIZE_BYTES = 60 * 1024; // 60 KB

function safeScopeFilename(scopeKey: string): string {
  return scopeKey.replace(/[^a-zA-Z0-9_-]/g, '_') || 'photo';
}

function safeDelete(FileCtor: typeof FileType, uri: string): void {
  try {
    const file = new FileCtor(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best-effort only -- a cleanup failure should never undo or fail the
    // real, already-successful save/read that triggered it.
  }
}

export type PickMealPhotoResult =
  | { status: 'success'; uri: string }
  | { status: 'canceled' }
  | { status: 'permission-denied' }
  | { status: 'too-small'; width: number; height: number }
  | { status: 'too-large-after-compression' }
  | { status: 'error'; message: string };

// Real, shared compression core -- used both by the full-quality save path
// (pickAndSaveMealPhoto) and the aggressively-smaller share-copy path
// (prepareSharePhoto) below, so both stay on the identical real resize/
// retry-at-lower-quality logic rather than two independently-drifting
// copies.
async function compressToLimit(
  ImageManipulator: typeof import('expo-image-manipulator'),
  FileCtor: typeof FileType,
  sourceUri: string,
  maxDimension: number,
  maxFileSizeBytes: number,
): Promise<{ uri: string; width: number; height: number; fileSizeBytes: number } | null> {
  // The source's own real dimensions aren't known ahead of a manipulate
  // call for an arbitrary sourceUri (unlike the image-picker asset, which
  // reports width/height directly) -- manipulateAsync itself reports the
  // real output width/height on every attempt, which is what the resize
  // decision below is actually based on.
  const probe = await ImageManipulator.manipulateAsync(sourceUri, [], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
  const needsResize = Math.max(probe.width, probe.height) > maxDimension;
  const resizeActions: Action[] = needsResize
    ? [{ resize: probe.width >= probe.height ? { width: maxDimension } : { height: maxDimension } }]
    : [];
  safeDelete(FileCtor, probe.uri);

  const qualitySteps = [0.8, 0.65, 0.5, 0.35];
  let manipulated: ImageResult | null = null;
  let manipulatedSize = 0;

  for (const quality of qualitySteps) {
    const attempt = await ImageManipulator.manipulateAsync(sourceUri, resizeActions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    const size = new FileCtor(attempt.uri).size ?? 0;
    if (manipulated && manipulated.uri !== attempt.uri) {
      safeDelete(FileCtor, manipulated.uri);
    }
    manipulated = attempt;
    manipulatedSize = size;
    if (size <= maxFileSizeBytes) break;
  }

  if (!manipulated || manipulatedSize > maxFileSizeBytes) {
    if (manipulated) safeDelete(FileCtor, manipulated.uri);
    return null;
  }

  return { uri: manipulated.uri, width: manipulated.width, height: manipulated.height, fileSizeBytes: manipulatedSize };
}

// Opens the camera or the photo library, validates and compresses whatever
// is picked, and saves a real, persistent full-quality copy under
// meal-photos/. `previousUri`, when passed, is deleted after the new photo
// is safely saved -- replacing a photo never leaves the old one behind.
export async function pickAndSaveMealPhoto(
  source: 'camera' | 'library',
  scopeKey: string,
  previousUri?: string,
): Promise<PickMealPhotoResult> {
  try {
    const [{ Directory, File, Paths }, ImageManipulator, ImagePicker] = await Promise.all([
      import('expo-file-system'),
      import('expo-image-manipulator'),
      import('expo-image-picker'),
    ]);

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { status: 'permission-denied' };
    }

    // Inlined at each call site, deliberately not hoisted to a shared
    // const -- an object literal passed directly as an argument gets its
    // mediaTypes array contextually narrowed to the literal 'images' type
    // launchCameraAsync/launchImageLibraryAsync expect; assigning it to an
    // intermediate variable first widens it to plain string[] instead,
    // which no longer satisfies MediaType[].
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false, exif: false });

    if (result.canceled || result.assets.length === 0) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];
    const shorterEdge = Math.min(asset.width ?? 0, asset.height ?? 0);
    if (shorterEdge > 0 && shorterEdge < MEAL_PHOTO_MIN_DIMENSION) {
      return { status: 'too-small', width: asset.width ?? 0, height: asset.height ?? 0 };
    }

    const compressed = await compressToLimit(
      ImageManipulator,
      File,
      asset.uri,
      MEAL_PHOTO_MAX_DIMENSION,
      MEAL_PHOTO_MAX_FILE_SIZE_BYTES,
    );
    if (!compressed) {
      return { status: 'too-large-after-compression' };
    }

    const dir = new Directory(Paths.document, 'meal-photos');
    dir.create({ intermediates: true, idempotent: true });
    const destFile = new File(dir, `${safeScopeFilename(scopeKey)}-${Date.now()}.jpg`);
    new File(compressed.uri).copy(destFile);
    safeDelete(File, compressed.uri);
    if (previousUri) safeDelete(File, previousUri);

    return { status: 'success', uri: destFile.uri };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

// Real, in-app-camera counterpart to pickAndSaveMealPhoto's own 'camera'
// branch, added 2026-08-16 after a real, confirmed on-device crash: the
// scan-product screen's own "photograph the ingredients" button used to go
// through ImagePicker.launchCameraAsync, which hands the whole shot off to
// the phone's real, separate Camera app. On a real device, adb logcat
// showed Android killing our now-backgrounded, lowest-priority process
// (ActivityManager: "Killing ... (adj 900): remove task") while that
// heavier external app was active, which forced a full cold relaunch the
// instant the person came back -- looking exactly like "the app restarted".
// This function is called with the URI a real in-app expo-camera
// CameraView.takePictureAsync() already produced -- the whole app process
// never leaves the foreground, so there's nothing to kill it out from
// under. Shares the identical real compress/persist core (compressToLimit,
// the same size caps, the same meal-photos/ directory) pickAndSaveMealPhoto
// already uses -- the only real difference is skipping expo-image-picker
// entirely, since the camera-permission gate and the raw photo are both
// already in hand by the time this is called.
export async function saveCapturedPhoto(
  sourceUri: string,
  scopeKey: string,
  sourceWidth: number,
  sourceHeight: number,
  previousUri?: string,
): Promise<PickMealPhotoResult> {
  try {
    const [{ Directory, File, Paths }, ImageManipulator] = await Promise.all([
      import('expo-file-system'),
      import('expo-image-manipulator'),
    ]);

    const shorterEdge = Math.min(sourceWidth, sourceHeight);
    if (shorterEdge > 0 && shorterEdge < MEAL_PHOTO_MIN_DIMENSION) {
      return { status: 'too-small', width: sourceWidth, height: sourceHeight };
    }

    const compressed = await compressToLimit(
      ImageManipulator,
      File,
      sourceUri,
      MEAL_PHOTO_MAX_DIMENSION,
      MEAL_PHOTO_MAX_FILE_SIZE_BYTES,
    );
    if (!compressed) {
      return { status: 'too-large-after-compression' };
    }

    const dir = new Directory(Paths.document, 'meal-photos');
    dir.create({ intermediates: true, idempotent: true });
    const destFile = new File(dir, `${safeScopeFilename(scopeKey)}-${Date.now()}.jpg`);
    new File(compressed.uri).copy(destFile);
    safeDelete(File, compressed.uri);
    safeDelete(File, sourceUri);
    if (previousUri) safeDelete(File, previousUri);

    return { status: 'success', uri: destFile.uri };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteMealPhotoFile(uri: string): Promise<void> {
  const { File } = await import('expo-file-system');
  safeDelete(File, uri);
}

// The one, real place a stored photo's own bytes get turned into a small
// base64 string for embedding in a share envelope -- returns null (never
// throws) on any real failure, since a photo that can't be prepared should
// never block the rest of a share from going out.
export async function prepareSharePhoto(uri: string): Promise<string | null> {
  try {
    const [{ File }, ImageManipulator] = await Promise.all([import('expo-file-system'), import('expo-image-manipulator')]);
    const compressed = await compressToLimit(ImageManipulator, File, uri, SHARE_PHOTO_MAX_DIMENSION, SHARE_PHOTO_MAX_FILE_SIZE_BYTES);
    if (!compressed) return null;
    const base64 = await new File(compressed.uri).base64();
    safeDelete(File, compressed.uri);
    return base64;
  } catch {
    return null;
  }
}

// The receiving side's own inverse -- decodes a real base64 string a share
// envelope carried into a real, persistent local file, so the staged
// preview and any later "Recipes Shared With Me" card show a real photo,
// not a placeholder. Returns null (never throws) on any real failure --
// receiving a share with a photo that fails to decode should still let the
// rest of the share through.
export async function saveSharePhotoFromBase64(base64: string, scopeKey: string): Promise<string | null> {
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'meal-photos');
    dir.create({ intermediates: true, idempotent: true });
    const destFile = new File(dir, `${safeScopeFilename(scopeKey)}-shared-${Date.now()}.jpg`);
    destFile.write(base64, { encoding: 'base64' });
    return destFile.uri;
  } catch {
    return null;
  }
}

// --- Real photo targets -- one shared shape for every place a photo can
// actually attach, and one real get/set pair every caller uses regardless
// of which of the four real storage shapes is underneath. ---------------

export type PhotoTarget =
  | { kind: 'component'; componentType: MealComponentType; componentId: string }
  | { kind: 'favorite'; favoriteId: string }
  | { kind: 'curatedRecipe'; recipeId: string }
  // Read-only display target for a not-yet-decided staged share -- see
  // lib/db.ts's own shared_recipes table. setPhotoForTarget below is a
  // deliberate no-op for this kind; components/EntryPhotoSection.tsx never
  // offers Change/Remove/Add for it either.
  | { kind: 'sharedRecipe'; sharedRecipeId: string };

const CURATED_RECIPE_PHOTO_OVERRIDES_KEY = 'curated_recipe_photo_overrides';

// The same lightweight single-JSON-blob-under-one-app_meta-key pattern
// lib/digestFeedback.ts already established -- a curated recipe is
// bundled, identical reference content for every user, so a personal photo
// on it is a real, small per-user override, not something that belongs on
// a shared/reference table.
async function getCuratedRecipePhotoOverrides(): Promise<Record<string, string>> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', CURATED_RECIPE_PHOTO_OVERRIDES_KEY);
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function setCuratedRecipePhotoOverride(recipeId: string, photoUri: string | null): Promise<void> {
  const current = await getCuratedRecipePhotoOverrides();
  const merged = { ...current };
  if (photoUri) {
    merged[recipeId] = photoUri;
  } else {
    delete merged[recipeId];
  }
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    CURATED_RECIPE_PHOTO_OVERRIDES_KEY,
    JSON.stringify(merged),
    now,
  );
}

// Both BuilderFavoritePayload and MealFavoriteComponentsPayload
// (lib/db.ts) are plain JSON objects that share the same optional
// photoUri field name -- this reads/writes either shape identically, no
// need to know which one a given favorites row actually holds.
async function getFavoritePhoto(favoriteId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string }>('SELECT payload_json FROM favorites WHERE id = ?', favoriteId);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.payload_json) as { photoUri?: string };
    return parsed.photoUri ?? null;
  } catch {
    return null;
  }
}

export async function setFavoritePhoto(favoriteId: string, photoUri: string | null): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string }>('SELECT payload_json FROM favorites WHERE id = ?', favoriteId);
  if (!row) return;
  try {
    const parsed = JSON.parse(row.payload_json) as Record<string, unknown>;
    if (photoUri) {
      parsed.photoUri = photoUri;
    } else {
      delete parsed.photoUri;
    }
    await db.runAsync('UPDATE favorites SET payload_json = ? WHERE id = ?', JSON.stringify(parsed), favoriteId);
  } catch {
    // A corrupted payload_json shouldn't be silently overwritten by a
    // half-parsed reconstruction -- leave it alone rather than risk losing
    // the rest of a real, already-saved favorite.
  }
}

export async function getPhotoForTarget(target: PhotoTarget): Promise<string | null> {
  const db = await getDatabase();
  switch (target.kind) {
    case 'component': {
      const table = COMPONENT_TABLE_BY_TYPE[target.componentType];
      const row = await db.getFirstAsync<{ photo_uri: string | null }>(`SELECT photo_uri FROM ${table} WHERE id = ?`, target.componentId);
      return row?.photo_uri ?? null;
    }
    case 'favorite':
      return getFavoritePhoto(target.favoriteId);
    case 'curatedRecipe': {
      const overrides = await getCuratedRecipePhotoOverrides();
      return overrides[target.recipeId] ?? null;
    }
    case 'sharedRecipe': {
      const row = await db.getFirstAsync<{ photo_uri: string | null }>(
        'SELECT photo_uri FROM shared_recipes WHERE id = ?',
        target.sharedRecipeId,
      );
      return row?.photo_uri ?? null;
    }
  }
}

export async function setPhotoForTarget(target: PhotoTarget, photoUri: string | null): Promise<void> {
  switch (target.kind) {
    case 'component': {
      const db = await getDatabase();
      const table = COMPONENT_TABLE_BY_TYPE[target.componentType];
      await db.runAsync(`UPDATE ${table} SET photo_uri = ? WHERE id = ?`, photoUri, target.componentId);
      return;
    }
    case 'favorite':
      await setFavoritePhoto(target.favoriteId, photoUri);
      return;
    case 'curatedRecipe':
      await setCuratedRecipePhotoOverride(target.recipeId, photoUri);
      return;
    case 'sharedRecipe':
      // Deliberately a no-op -- a staged share's own photo (if any) is
      // whatever the sender included, read-only until the person promotes
      // it to a real saved record or favorite of their own.
      return;
  }
}
