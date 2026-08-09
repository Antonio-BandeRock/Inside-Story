// Custom background image upload -- 2026-08-09, explicitly requested: "Add
// the ability to upload an image to be the background for the shared
// background, and for each of the individual tabs. Make sure to have them
// comply with specific size dimensions and no more than a reasonable
// number for disk size." A real, separate leaf module (not folded into
// lib/visualPreferences.ts, which stays a plain settings-blob file with no
// native-module dependency of its own) -- this is the one place that
// actually talks to expo-image-picker/expo-image-manipulator/
// expo-file-system, all three added to this project specifically for this
// feature (2026-08-09). Adding these is a real native-module change --
// app.json gained an expo-image-picker plugin entry with a real permission
// description -- so this needs a genuine native rebuild (`npx expo run:
// android`) before it works on-device, not just a Metro/JS reload.
//
// Real, enforced compliance rather than a "please pick something smaller"
// rejection: any picked image gets automatically downscaled (if larger
// than CUSTOM_BACKGROUND_MAX_DIMENSION on its longer edge) and
// recompressed as JPEG, retrying at progressively lower quality until it
// fits under CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES -- the one thing this
// genuinely can't fix is an image too SMALL to begin with (upscaling would
// just look blurry when stretched to fill a phone screen), so that's the
// one real rejection case, reported back to the caller rather than guessed
// around.
//
// Saved into the app's own persistent document directory (a raw picker URI
// is often a temporary/cache-scoped file that doesn't survive a reload) as
// a real file, under a per-scope filename that changes on every save (a
// timestamp suffix) rather than being overwritten in place -- expo-image's
// own caching keys on the URI itself, so reusing the exact same filename
// after replacing an image risks the OLD cached image still showing;
// giving each save a genuinely new URI sidesteps that entirely. The
// previous file for that scope (if any) is deleted right after the new one
// is confirmed saved, so replacing an image doesn't leak storage.
//
// Uses expo-file-system's SDK 54 File/Directory class-based API (the real,
// current API surface -- confirmed directly against the installed
// package's own .d.ts before writing this, not assumed from an older SDK's
// docs), not the older promise-based getInfoAsync/copyAsync-style API.

import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Longer edge, after any auto-resize -- generous for a phone screen
// (several times a typical device's own longer dimension), while still
// keeping a single saved image comfortably within the disk-size ceiling
// below once JPEG-compressed.
export const CUSTOM_BACKGROUND_MAX_DIMENSION = 2400;
// Shorter edge, the one real thing this can't safely fix by resizing --
// below this, stretching to fill a phone screen would look visibly
// soft/blurry, so an image this small is rejected rather than silently
// upscaled.
export const CUSTOM_BACKGROUND_MIN_DIMENSION = 480;
// The real disk-size ceiling, enforced after compression -- "no more than
// a reasonable number for disk size." With up to 8 real scopes (the shared
// background plus 7 individual tabs), the real worst case is this times 8
// -- a reasonable amount for a phone app already bundling a multi-hundred-
// MB nutrition reference database and dozens of illustrated backgrounds.
export const CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

function customBackgroundDir(): Directory {
  const dir = new Directory(Paths.document, 'custom-backgrounds');
  // idempotent: true -- safe to call every time regardless of whether the
  // directory already exists from a previous save, no separate `.exists`
  // check needed first.
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

// scopeKey is 'shared', or a real TAB_ROUTES path (e.g. '/insights') --
// sanitized to a safe filename fragment (a path carries a leading '/').
function safeScopeFilename(scopeKey: string): string {
  return scopeKey.replace(/[^a-zA-Z0-9_-]/g, '_') || 'scope';
}

// Best-effort delete -- used both for the intermediate manipulated temp
// file and for a scope's own previous saved image. Never throws: a
// cleanup failure (the file already gone, a permissions quirk) should
// never undo or fail the real, already-successful save that triggered it.
function safeDelete(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best-effort only.
  }
}

export type PickCustomBackgroundResult =
  | { status: 'success'; uri: string; width: number; height: number; fileSizeBytes: number }
  | { status: 'canceled' }
  | { status: 'permission-denied' }
  | { status: 'too-small'; width: number; height: number }
  | { status: 'too-large-after-compression' }
  | { status: 'error'; message: string };

// Opens the device's own photo picker, validates and compresses whatever
// is chosen, and saves a real, persistent copy for the given scope.
// `previousUri`, when passed, is deleted after the new image is safely
// saved -- pass the scope's own currently-stored URI (if any) so replacing
// an image doesn't leave the old one behind on disk.
export async function pickAndSaveCustomBackgroundImage(
  scopeKey: string,
  previousUri?: string,
): Promise<PickCustomBackgroundResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { status: 'permission-denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];
    const originalWidth = asset.width ?? 0;
    const originalHeight = asset.height ?? 0;
    const shorterEdge = Math.min(originalWidth, originalHeight);

    if (shorterEdge > 0 && shorterEdge < CUSTOM_BACKGROUND_MIN_DIMENSION) {
      return { status: 'too-small', width: originalWidth, height: originalHeight };
    }

    const needsResize = Math.max(originalWidth, originalHeight) > CUSTOM_BACKGROUND_MAX_DIMENSION;
    const resizeActions: ImageManipulator.Action[] = needsResize
      ? [
          {
            resize:
              originalWidth >= originalHeight
                ? { width: CUSTOM_BACKGROUND_MAX_DIMENSION }
                : { height: CUSTOM_BACKGROUND_MAX_DIMENSION },
          },
        ]
      : [];

    // Retried at progressively lower JPEG quality until the saved file
    // fits CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES -- most real photos clear
    // this on the very first attempt (0.85); the lower steps only matter
    // for genuinely dense/high-detail images.
    const qualitySteps = [0.85, 0.7, 0.55, 0.4];
    let manipulated: ImageManipulator.ImageResult | null = null;
    let manipulatedSize = 0;

    for (const quality of qualitySteps) {
      const attempt = await ImageManipulator.manipulateAsync(asset.uri, resizeActions, {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const size = new File(attempt.uri).size;
      // A prior, worse-quality attempt's temp file is no longer needed
      // once a new attempt has been produced.
      if (manipulated && manipulated.uri !== attempt.uri) {
        safeDelete(manipulated.uri);
      }
      manipulated = attempt;
      manipulatedSize = size;
      if (size <= CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES) {
        break;
      }
    }

    if (!manipulated || manipulatedSize > CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES) {
      if (manipulated) safeDelete(manipulated.uri);
      return { status: 'too-large-after-compression' };
    }

    const destFile = new File(customBackgroundDir(), `${safeScopeFilename(scopeKey)}-${Date.now()}.jpg`);
    new File(manipulated.uri).copy(destFile);
    safeDelete(manipulated.uri);
    if (previousUri) {
      safeDelete(previousUri);
    }

    return {
      status: 'success',
      uri: destFile.uri,
      width: manipulated.width,
      height: manipulated.height,
      fileSizeBytes: manipulatedSize,
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

// Reverts a scope back to no custom image -- deletes the real file from
// disk (not just clearing the visualPreferences reference), so removing a
// custom background doesn't silently leak storage.
export function deleteCustomBackgroundImage(uri: string): void {
  safeDelete(uri);
}
