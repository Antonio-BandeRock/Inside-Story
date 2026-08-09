import type { ImageSourcePropType } from 'react-native';
import type { TabHubIconChoice } from '../lib/visualPreferences';

// A real, raw (require()'d, not wrapped in a component) image source per
// TabHubIconChoice -- 2026-08-09, built for the "personalize the main
// TabHub button's own icon" feature (see TabHubIconChoice's own comment in
// lib/visualPreferences.ts). Kept separate from components/
// DigestConditionIcons.tsx's own already-built icon COMPONENTS (each
// wraps exactly one fixed <Image>, styled for its own single use in
// LensHub's grid or Purple Digest's header card) because TabHub.tsx's own
// button needs the raw source directly: it renders the SAME image up to
// four times per frame while open (one real copy plus several tinted,
// offset copies for its own hand-rolled drop-shadow trick -- see
// TabHub.tsx's own ELEVATION_SHADOW_LAYERS), each with different inline
// styling a pre-wrapped component couldn't accommodate. Every one of these
// 20 real, literal require() calls is necessary -- Metro's bundler needs a
// static, non-dynamic path for each one, the same constraint
// DigestConditionIcons.tsx's own header comment already documents.
//
// Partial, not a full Record -- TabHubIconChoice is 'default' | every real
// DigestCategoryKey, which also includes basicHealth/earthMatters/
// homeGardening (the 3 structural, non-condition categories, real
// DigestCategoryKey values but not "conditions" in the sense this feature
// means, with no bespoke icon of their own) -- the exact same reasoning
// DigestConditionIcons.tsx's own DIGEST_CONDITION_ICONS already uses
// Partial for. Every consumer of this map (TabHub.tsx's own lookup,
// Profile's own picker) already falls back to `.default` / filters out an
// undefined result, so nothing further needed to change once this became
// Partial.
export const TAB_HUB_ICON_SOURCES: Partial<Record<TabHubIconChoice, ImageSourcePropType>> = {
  default: require('../assets/branding/butterfly-transparent.png'),
  hashimotos: require('../assets/branding/digest-icons/hashimotos.png'),
  rheumatoidArthritis: require('../assets/branding/digest-icons/rheumatoid-arthritis.png'),
  psoriasis: require('../assets/branding/digest-icons/psoriasis.png'),
  graves: require('../assets/branding/digest-icons/graves.png'),
  type1Diabetes: require('../assets/branding/digest-icons/type1diabetes.png'),
  celiac: require('../assets/branding/digest-icons/celiac.png'),
  ibd: require('../assets/branding/digest-icons/ibd.png'),
  multipleSclerosis: require('../assets/branding/digest-icons/multiple-sclerosis.png'),
  lupus: require('../assets/branding/digest-icons/lupus.png'),
  sjogrens: require('../assets/branding/digest-icons/sjogrens.png'),
  pcos: require('../assets/branding/digest-icons/pcos.png'),
  chronicKidneyDisease: require('../assets/branding/digest-icons/chronic-kidney-disease.png'),
  fattyLiverDisease: require('../assets/branding/digest-icons/fatty-liver-disease.png'),
  type2Diabetes: require('../assets/branding/digest-icons/type2diabetes.png'),
  ibs: require('../assets/branding/digest-icons/ibs.png'),
  migraine: require('../assets/branding/digest-icons/migraine.png'),
  cardiovascularDisease: require('../assets/branding/digest-icons/cardiovascular-disease.png'),
  gout: require('../assets/branding/digest-icons/gout.png'),
  prostateHealth: require('../assets/branding/digest-icons/prostate-health.png'),
};

// Real, individually measured width/height (pixels) per icon file, 2026-08-09
// -- read directly off each real asset via a jimp script (this environment's
// established "no Python, but Node/jimp works" fallback), not assumed. This
// mattered because the original assumption ("condition icons are all
// roughly square, a single fixed box would work fine for all of them") was
// checked and found wrong: real ratios span 0.652 (type1Diabetes, tall) to
// 1.362 (pcos, wide) -- genuinely varied, not close to uniform, and none
// come close to the butterfly's own wide 1606:1080 ratio. Kept as the raw
// [width, height] pixel pair, not a pre-rounded decimal ratio, so the real
// source data stays traceable/re-verifiable directly against this comment.
const TAB_HUB_ICON_PIXEL_DIMENSIONS: Partial<Record<TabHubIconChoice, readonly [number, number]>> = {
  default: [1606, 1080],
  hashimotos: [255, 211],
  rheumatoidArthritis: [220, 269],
  psoriasis: [250, 221],
  graves: [261, 212],
  type1Diabetes: [144, 221],
  celiac: [201, 224],
  ibd: [215, 283],
  multipleSclerosis: [242, 214],
  lupus: [269, 217],
  sjogrens: [191, 196],
  pcos: [252, 185],
  chronicKidneyDisease: [181, 237],
  fattyLiverDisease: [245, 200],
  type2Diabetes: [128, 185],
  ibs: [248, 224],
  // Re-measured 2026-08-09 after migraine.png's own real, on-device-reported
  // stray-fragment fix (a piece of the Gout icon bleeding in from a padded-
  // crop overlap between two adjacent regions on the original reference
  // sheet) -- this pair reflects the corrected file, not the original crop.
  migraine: [193, 212],
  cardiovascularDisease: [198, 272],
  gout: [175, 263],
  prostateHealth: [175, 220],
};

// The default butterfly's own real, established render width -- unchanged
// from TabHub.tsx's own original BUTTERFLY_WIDTH constant, so picking
// 'default' (the app's own out-of-the-box behavior) renders byte-for-byte
// identically to how this button has always looked, not just "close." Every
// OTHER icon is scaled so its own real LONGER edge also reaches this same
// target -- the actual fix for "condition icons look smaller than the
// butterfly": under the old fixed 116x78 box, every real condition icon
// (none has a ratio anywhere near the butterfly's own wide 1.487) rendered
// height-constrained to 78px tall with a NARROWER width, and simply never
// got the butterfly's own true visual presence. Matching each icon's own
// long edge to this same target, instead of forcing every icon into one
// shape-specific box, is what makes a tall/narrow icon (Gout, Type 1
// Diabetes) and a wide one (PCOS, Lupus) both read as similarly "large,"
// the same way the butterfly always has.
export const TAB_HUB_ICON_TARGET_LONG_EDGE = 116;

// A real, shared, pure function -- not duplicated per consumer. Three real
// components each need this exact same "how big does the CURRENTLY chosen
// icon actually render" answer: TabHub.tsx itself (the button's own real
// size), PageIdentityLabel.tsx (positions its own corner box to clear
// whatever's actually on screen), and MyItemsHub.tsx (positions its own
// button relative to the artwork's real left edge, to avoid overlapping a
// wing/silhouette tip) -- all three call this directly rather than each
// re-deriving the same math, or trusting a static constant that stops
// being accurate the moment someone picks a non-default icon.
export function getTabHubIconRenderSize(choice: TabHubIconChoice): { width: number; height: number } {
  const dims = TAB_HUB_ICON_PIXEL_DIMENSIONS[choice] ?? TAB_HUB_ICON_PIXEL_DIMENSIONS.default!;
  const [pixelWidth, pixelHeight] = dims;
  const ratio = pixelWidth / pixelHeight;
  if (ratio >= 1) {
    // Wider than tall (or square) -- width is the long edge.
    return { width: TAB_HUB_ICON_TARGET_LONG_EDGE, height: TAB_HUB_ICON_TARGET_LONG_EDGE / ratio };
  }
  // Taller than wide -- height is the long edge.
  return { width: TAB_HUB_ICON_TARGET_LONG_EDGE * ratio, height: TAB_HUB_ICON_TARGET_LONG_EDGE };
}
