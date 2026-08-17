// Real brightness/contrast adjustment for a captured ingredients photo,
// 2026-08-16 -- direct, explicit request right after a real on-device
// report that a shiny can's own glare made the label unreadable: "Please
// build in the brightness and contrast adjustment ability." Neither
// expo-camera's real, native CameraViewProps (confirmed via a direct read
// of its own .d.ts -- brightness/contrast/exposureCompensation only exist
// on the separate, @platform-web-only WebCameraSettings type, not usable
// on a real Android/iOS device) nor expo-image-manipulator's real Action
// union (resize/rotate/flip/crop/extent only, confirmed the same way)
// offer any color adjustment at all, so this leans on
// @shopify/react-native-skia (already installed for this feature) instead,
// which has real, native Fabric support for applying a 4x5 color matrix as
// a live filter and exporting the result as a real, modified image.
//
// Skia's own real color-matrix convention -- confirmed directly against
// the library's own OpacityMatrix reference implementation (a plain
// diagonal-alpha-scale matrix using a raw 0-1 fraction with zero offset,
// not a 0-255 value the way a web canvas filter might) -- is 0-1
// NORMALIZED channel values, not the more familiar 0-255 range.

// A standard, real brightness+contrast combined transform: each channel
// value is first pushed toward (contrast > 1) or away from (contrast < 1)
// the midpoint (0.5), then shifted by brightness -- expressed as one real,
// combined scale+offset per channel so the whole thing is a single 4x5
// matrix multiply, not two separate passes:
//   newC = contrast * (oldC - 0.5) + 0.5 + brightness
//        = contrast * oldC + (0.5 - 0.5*contrast + brightness)
export function buildToneMatrix(brightnessSlider: number, contrastSlider: number): number[] {
  // brightnessSlider/contrastSlider are both real, -1..1 slider positions
  // (see components/SimpleSlider.tsx), not raw matrix values -- mapped to
  // a real, reasonable adjustment range rather than the full, mostly
  // useless 0-1 extreme (a raw brightness offset of 1.0 would push every
  // pixel straight to pure white).
  const brightness = brightnessSlider * 0.4; // -0.4..0.4
  // contrastSlider -1 -> near-zero contrast (flat gray), 0 -> neutral
  // (unchanged), 1 -> double contrast. Floored well above zero so dragging
  // all the way to one end never lands on a literal, useless all-gray
  // image.
  const contrast = Math.max(0.15, 1 + contrastSlider);
  const offset = 0.5 - 0.5 * contrast + brightness;
  return [
    contrast, 0, 0, 0, offset,
    0, contrast, 0, 0, offset,
    0, 0, contrast, 0, offset,
    0, 0, 0, 1, 0,
  ];
}

// Real, standard aspect-fit ("contain") math -- given a source image's own
// real pixel dimensions and a bounding box, returns the exact sub-rect
// (in the box's own coordinate space) the image occupies once scaled to
// fit within the box while preserving its own aspect ratio. Computed
// directly here (not left to Skia's own `fit` prop) so the exact same
// numbers can drive both what's drawn AND where the crop overlay's own
// drag handles are positioned -- the two have to agree exactly, or a
// dragged handle would silently map to the wrong part of the real photo.
export function computeContainRect(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
): { x: number; y: number; width: number; height: number } {
  const sourceRatio = sourceWidth / sourceHeight;
  const boxRatio = boxWidth / boxHeight;
  let width: number;
  let height: number;
  if (sourceRatio > boxRatio) {
    width = boxWidth;
    height = boxWidth / sourceRatio;
  } else {
    height = boxHeight;
    width = boxHeight * sourceRatio;
  }
  return { x: (boxWidth - width) / 2, y: (boxHeight - height) / 2, width, height };
}

// Real, isolated cache-directory save for the crop+tone-adjusted working
// photo -- deliberately NOT lib/mealPhotos.ts's own saveSharePhotoFromBase64
// (which writes into the app's real, PERSISTENT meal-photos directory,
// under a "-shared-" filename meant for the app-to-app sharing envelope).
// This photo is still just one candidate angle at this point -- the same
// real "not yet a permanent file" status every other raw camera-capture
// attempt already has on this screen -- so it belongs in the same
// disposable cache location lib/sharing.ts's own writeIsFile already
// established for exactly this "real, one-time, OS-reclaimable working
// file" case, not the app's own real permanent photo storage. Only
// whichever attempt is ultimately chosen ever gets persisted for real, via
// the existing saveCapturedPhoto in lib/mealPhotos.ts.
export async function saveAdjustedIngredientsPhoto(base64Jpeg: string): Promise<string | null> {
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'scan-working-photos');
    dir.create({ intermediates: true, idempotent: true });
    const destFile = new File(dir, `ingredients-adjusted-${Date.now()}.jpg`);
    destFile.write(base64Jpeg, { encoding: 'base64' });
    return destFile.uri;
  } catch {
    return null;
  }
}
