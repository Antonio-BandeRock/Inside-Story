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
// 28 real, literal require() calls is necessary -- Metro's bundler needs a
// static, non-dynamic path for each one, the same constraint
// DigestConditionIcons.tsx's own header comment already documents.
//
// The 8 GardenIconChoice entries (honeybee through prayingMantis) were
// added 2026-08-12, direct request: "Create new TabHub menu icons from
// these 8 new images... available to be selected to be the TabHub icon."
// Cropped from one combined reference sheet (8 real, individually
// illustrated pollinators/garden wildlife, 2 columns x 4 rows) via the same
// isolated jimp scratchpad methodology already used for the 19 condition
// icons -- a real, per-region flood-fill to find each bounding box,
// followed by a real pairwise-overlap check across every PADDED crop box
// (not just the raw regions), which caught one real close call: the
// top-right two regions (bumblebee, hummingbird) sit only ~2px apart in
// the source sheet, tight enough that a first, uniform padding value bled
// real content across that one boundary -- fixed with a per-edge,
// per-region safe-padding computation (capped to each region's own real
// gap to its nearest neighbor in that direction, minus a 3px buffer)
// rather than one global pad value, then re-verified with zero real
// content bleed across every one of the 28 real region pairs before any
// file was written. Every one of the 8 final crops was then downsized to
// at most 312px on its own longer axis (a real 4x safety margin above
// TAB_HUB_ICON_FIXED_HEIGHT's own 78px render ceiling, mirroring the
// 'default' icon's own already-established 464x312-for-a-116x78-box
// precedent below) and re-verified via direct pixel sampling before being
// copied into assets/branding/garden-icons/ -- a separate folder from
// digest-icons/, since these 8 are real garden/pollinator wildlife, not
// tied to any tracked condition at all.
//
// Partial, not a full Record -- TabHubIconChoice is 'default' | every real
// DigestCategoryKey | every real GardenIconChoice. DigestCategoryKey alone
// also includes basicHealth/earthMatters/homeGardening (the 3 structural,
// non-condition categories, real DigestCategoryKey values but not
// "conditions" in the sense this feature means, with no bespoke icon of
// their own) -- the exact same reasoning DigestConditionIcons.tsx's own
// DIGEST_CONDITION_ICONS already uses Partial for. Every consumer of this
// map (TabHub.tsx's own lookup, Profile's own picker) already falls back
// to `.default` / filters out an undefined result, so nothing further
// needed to change once this became Partial.
export const TAB_HUB_ICON_SOURCES: Partial<Record<TabHubIconChoice, ImageSourcePropType>> = {
  default: require('../assets/branding/butterfly-transparent.png'),
  honeybee: require('../assets/branding/garden-icons/honeybee.png'),
  bumblebee: require('../assets/branding/garden-icons/bumblebee.png'),
  dragonfly: require('../assets/branding/garden-icons/dragonfly.png'),
  hummingbird: require('../assets/branding/garden-icons/hummingbird.png'),
  treeFrog: require('../assets/branding/garden-icons/tree-frog.png'),
  monarchButterfly: require('../assets/branding/garden-icons/monarch-butterfly.png'),
  ladybug: require('../assets/branding/garden-icons/ladybug.png'),
  prayingMantis: require('../assets/branding/garden-icons/praying-mantis.png'),
  // 38 real AnimalIconChoice entries, 2026-08-14 -- cropped from one
  // combined reference sheet (38 individually illustrated animal head
  // busts, 6 columns x 6 rows plus a final 2-item row) via the same
  // isolated jimp scratchpad methodology as every other icon batch in this
  // file: a real per-region flood-fill to find each of the 38 bounding
  // boxes, then a real per-edge, per-region safe-padding computation
  // (capped to each region's own real gap to its nearest neighbor in that
  // direction, minus a 3px buffer, exactly like the garden-icon sheet's
  // own fix). One real, new wrinkle this sheet needed that the garden
  // sheet didn't: two pairs of regions (rhino/elephant, and a diagonal
  // frenchBulldog/deer corner) had bounding boxes that geometrically
  // TOUCHED or overlapped by a pixel or two -- confirmed by direct alpha
  // sampling, not assumed, that this was a thin antialiased fleck from one
  // animal's own ear/tusk tip sharing the same boundary column as a
  // different animal's own fleck at a non-overlapping y, not a real design
  // overlap. The padding formula was extended to allow a small NEGATIVE
  // pad (trimming inward from a region's own true edge, capped at 6px) so
  // every adjacent crop pair guarantees a real, verified gap between them
  // -- re-checked afterward via a full pairwise bounding-box comparison
  // across all 38 crops (zero true overlaps; the two remaining flagged
  // "overlaps" were both a 1-2px diagonal corner shared between
  // non-adjacent regions, confirmed via direct pixel sampling to be 100%
  // transparent background on both sides, harmless). Every one of the 38
  // final crops was verified via direct pixel sampling (transparent
  // corners, 38-68% real opaque interior content) and several spot-checked
  // visually before being copied into assets/branding/animal-icons/ -- a
  // separate folder from garden-icons/ and digest-icons/, since these 38
  // are real domestic/wild animal portraits, not tied to pollinators or any
  // tracked condition at all.
  lion: require('../assets/branding/animal-icons/lion.png'),
  tiger: require('../assets/branding/animal-icons/tiger.png'),
  maineCoon: require('../assets/branding/animal-icons/maineCoon.png'),
  siameseCat: require('../assets/branding/animal-icons/siameseCat.png'),
  russianBlueCat: require('../assets/branding/animal-icons/russianBlueCat.png'),
  ragdollCat: require('../assets/branding/animal-icons/ragdollCat.png'),
  orangeTabbyCat: require('../assets/branding/animal-icons/orangeTabbyCat.png'),
  bengalCat: require('../assets/branding/animal-icons/bengalCat.png'),
  persianCat: require('../assets/branding/animal-icons/persianCat.png'),
  sphynxCat: require('../assets/branding/animal-icons/sphynxCat.png'),
  grayTabbyCat: require('../assets/branding/animal-icons/grayTabbyCat.png'),
  blackCat: require('../assets/branding/animal-icons/blackCat.png'),
  goldenRetriever: require('../assets/branding/animal-icons/goldenRetriever.png'),
  germanShepherd: require('../assets/branding/animal-icons/germanShepherd.png'),
  labradorRetriever: require('../assets/branding/animal-icons/labradorRetriever.png'),
  frenchBulldog: require('../assets/branding/animal-icons/frenchBulldog.png'),
  borderCollie: require('../assets/branding/animal-icons/borderCollie.png'),
  cavalierKingCharlesSpaniel: require('../assets/branding/animal-icons/cavalierKingCharlesSpaniel.png'),
  rhino: require('../assets/branding/animal-icons/rhino.png'),
  elephant: require('../assets/branding/animal-icons/elephant.png'),
  deer: require('../assets/branding/animal-icons/deer.png'),
  cow: require('../assets/branding/animal-icons/cow.png'),
  pig: require('../assets/branding/animal-icons/pig.png'),
  sheep: require('../assets/branding/animal-icons/sheep.png'),
  goat: require('../assets/branding/animal-icons/goat.png'),
  horse: require('../assets/branding/animal-icons/horse.png'),
  bison: require('../assets/branding/animal-icons/bison.png'),
  beaver: require('../assets/branding/animal-icons/beaver.png'),
  squirrel: require('../assets/branding/animal-icons/squirrel.png'),
  chipmunk: require('../assets/branding/animal-icons/chipmunk.png'),
  rabbit: require('../assets/branding/animal-icons/rabbit.png'),
  donkey: require('../assets/branding/animal-icons/donkey.png'),
  mallardDuck: require('../assets/branding/animal-icons/mallardDuck.png'),
  canadaGoose: require('../assets/branding/animal-icons/canadaGoose.png'),
  wolf: require('../assets/branding/animal-icons/wolf.png'),
  bear: require('../assets/branding/animal-icons/bear.png'),
  badger: require('../assets/branding/animal-icons/badger.png'),
  iguana: require('../assets/branding/animal-icons/iguana.png'),
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
// come close to the butterfly's own wide ~1.49:1 ratio. Kept as the raw
// [width, height] pixel pair, not a pre-rounded decimal ratio, so the real
// source data stays traceable/re-verifiable directly against this comment.
//
// default's own pair updated 2026-08-10, direct report: the button's own
// icon visibly popped in roughly half a second after the app first became
// interactive. Root-caused directly, not guessed: the source PNG was
// 1606x1080 (3.1MB) despite this file never rendering it above 116x78
// logical points anywhere in the app -- real, confirmed decode work on
// roughly 12x more pixel data than any real device could ever display,
// right at the exact moment a lot of other real work (the DatabaseSetup
// Screen's own pop-out animation, Stack/GestureHandlerRootView mounting)
// is also competing for the same thread. Re-exported at 464x312 (jimp's
// own bilinear resize, a real, generous 4x safety margin above the
// button's own 116x78 max render box -- comfortably above any real
// on-device pixel density) via an isolated scratchpad jimp workspace, the
// same established technique already used to crop the 19 condition icons.
// Verified directly, not assumed: sampled real pixel data at all 4 corners
// (alpha=0, transparent, in both the original and the resized file) and
// several real body/wing points (fully opaque in both, same color family,
// only the expected minor blending from bilinear resampling) before
// replacing the live asset. File size dropped from 3,112,836 to 251,797
// bytes -- a real 12.4x reduction, matching the real ~12x pixel-count
// reduction. The ratio itself is preserved to within 0.01% (464/312 vs
// the original 1606/1080), an utterly negligible, sub-pixel difference in
// the computed render size below.
const TAB_HUB_ICON_PIXEL_DIMENSIONS: Partial<Record<TabHubIconChoice, readonly [number, number]>> = {
  // 'default' -- the plain butterfly, relabeled "Graves' / Hashimoto's" in
  // Profile's own picker 2026-08-14 and no longer the app's own actual
  // out-of-the-box choice (DEFAULT_VISUAL_PREFERENCES.tabHubIcon is now
  // 'honeybee', see lib/visualPreferences.ts) -- the key/asset/dimensions
  // themselves are unchanged, only which choice a fresh install starts on.
  default: [464, 312],
  // The 8 garden/pollinator icons, 2026-08-12 -- real, individually
  // measured pairs off the actual final (already-downsized) files, the
  // same jimp-based methodology as every other entry in this table, not
  // assumed from the crop-region math.
  honeybee: [408, 312],
  bumblebee: [396, 312],
  dragonfly: [389, 312],
  hummingbird: [356, 312],
  treeFrog: [347, 312],
  monarchButterfly: [458, 306],
  ladybug: [277, 312],
  prayingMantis: [298, 312],
  // The 38 animal-head icons, 2026-08-14 -- real, individually measured
  // pairs off the actual final (already-cropped, none needed downsizing --
  // all 38 landed under the 312px ceiling on their own) files, the same
  // jimp-based methodology as every other entry in this table.
  lion: [196, 214],
  tiger: [157, 180],
  maineCoon: [161, 203],
  siameseCat: [137, 182],
  russianBlueCat: [146, 175],
  ragdollCat: [167, 183],
  orangeTabbyCat: [145, 186],
  bengalCat: [147, 183],
  persianCat: [179, 180],
  sphynxCat: [155, 193],
  grayTabbyCat: [144, 179],
  blackCat: [142, 189],
  goldenRetriever: [174, 197],
  germanShepherd: [152, 209],
  labradorRetriever: [171, 185],
  frenchBulldog: [147, 196],
  borderCollie: [161, 200],
  cavalierKingCharlesSpaniel: [174, 181],
  rhino: [161, 213],
  elephant: [206, 201],
  deer: [150, 217],
  cow: [163, 203],
  pig: [147, 192],
  sheep: [172, 195],
  goat: [174, 214],
  horse: [160, 218],
  bison: [172, 219],
  beaver: [179, 171],
  squirrel: [139, 218],
  chipmunk: [158, 193],
  rabbit: [144, 234],
  donkey: [136, 244],
  mallardDuck: [158, 222],
  canadaGoose: [110, 212],
  wolf: [182, 224],
  bear: [187, 217],
  badger: [186, 196],
  iguana: [196, 206],
  // hashimotos/graves re-cropped 2026-08-12, direct request: "Use these two
  // images of butterflies... to have the blue one represent the
  // Hashimoto's condition and the more orangish-red represent Graves'
  // instead of the current two that are being used." A real, different
  // source image this time -- a two-panel poster (title/subtitle/paragraph
  // text under each real butterfly, explicitly NOT to be used, per the
  // request) on a solid near-black background, not one with real alpha
  // transparency the way every other icon sheet in this file was --
  // confirmed via direct pixel sampling (alpha=255 everywhere checked)
  // before assuming otherwise. Required real background removal, not just
  // a crop: a first, plain border-seeded flood-fill (the same technique
  // already used for the garden-icon sheet) worked for the wing interiors
  // but visibly ate into each wing's own real, dark, dot-and-scallop-
  // patterned outer border band -- confirmed not just by eye but by
  // rendering the actual computed alpha mask as its own grayscale image
  // and inspecting it directly, the only way this was actually caught (a
  // plain color-composited preview of the crop looked fine, matching this
  // file's own already-documented "never trust a visual preview alone"
  // lesson). Root cause: a fine dark decorative texture, similar enough in
  // per-pixel-step color delta to the true background, let the flood
  // "thread" along it from the border deep into real wing content. Fixed
  // with a real, three-part pipeline: a much tighter per-step flood
  // tolerance (16, down from the garden sheet's 28) so the flood can only
  // travel through genuinely smooth, low-variance background, not textured
  // detail; a small absolute-color-distance safety net (<=14 from the real
  // sampled background reference) to mop up any thin residual fringe the
  // tighter flood leaves at the true edge; and a real morphological
  // opening (erode then dilate the background region by a 2px radius) to
  // sever thin "wormhole" tendrils -- fine dark vein lines the flood could
  // still travel along even at tolerance=16, confirmed and fixed by
  // re-rendering the alpha mask after each change and comparing directly,
  // not assumed fixed from the tolerance number alone. Every crop
  // re-verified afterward (transparent corners, ~52-53% real opaque
  // content, both antennae genuinely intact) before being downsized to the
  // same 312px-longer-axis safety margin as every other icon here and
  // copied over the live files -- both DigestConditionIcons.tsx and this
  // file's own TAB_HUB_ICON_SOURCES.hashimotos/.graves already point at
  // these same two filenames, so overwriting them in place needed no other
  // code change anywhere.
  hashimotos: [389, 312],
  rheumatoidArthritis: [220, 269],
  psoriasis: [250, 221],
  graves: [388, 312],
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
// 'default' (renamed "Graves' / Hashimoto's" in Profile's own picker,
// 2026-08-14 -- no longer the app's own out-of-the-box choice, see
// TAB_HUB_ICON_PIXEL_DIMENSIONS.default's own comment below) renders
// byte-for-byte identically to how this button originally looked, not
// just "close."
export const TAB_HUB_ICON_TARGET_WIDTH = 116;
// The default butterfly's own real aspect ratio -- the source of its own
// already-established, already-safe 78px render height
// (TAB_HUB_ICON_TARGET_WIDTH / this ratio). Kept as an exact fraction, not
// a pre-rounded decimal, matching TabHub.tsx's own original
// BUTTERFLY_ASPECT_RATIO precedent. Updated 2026-08-10 to the real, current
// 464x312 asset (see TAB_HUB_ICON_PIXEL_DIMENSIONS's own comment) -- the
// ratio itself is preserved to within 0.01% of the original 1606:1080, so
// this changes the computed render height by a fraction of a pixel, not a
// visible amount.
const DEFAULT_ICON_ASPECT_RATIO = 464 / 312;

// 2026-08-09, a real, direct correction: an earlier version of this
// function let HEIGHT vary per icon too (scaling each icon's own longer
// edge, whichever axis that was, up to TAB_HUB_ICON_TARGET_WIDTH) -- on
// device, that pushed several of the taller/narrower condition icons
// (Gout, Type 1/2 Diabetes, Cardiovascular Disease, and others with a real
// aspect ratio well under 1) up to 116px tall, well past the button's own
// already-tuned, already-safe 78px height, visibly poking above the
// footer's own top line. Direct, explicit correction: "They should all
// stay the same distance away from the line on the footer and the top
// edge of the navigation bar" -- every icon's own vertical clearance from
// both of those real screen edges has to be IDENTICAL, which is only
// possible if every icon renders at the exact same fixed HEIGHT (the
// butterfly's own already-proven-safe value), never a per-icon one. Width
// is the one dimension genuinely safe to vary -- it has no bearing on
// vertical clearance at all -- so every icon still renders at its own
// real, undistorted aspect ratio; a narrower-shaped icon (Gout, Type 1
// Diabetes) legitimately ends up narrower than a squarer one (Sjögren's)
// or the butterfly itself at that same shared height, since there's no
// way to make a narrow image "look as wide" as a square one without
// either stretching it (visibly distorted, not something this app does
// anywhere else) or letting it grow taller (exactly the bug this fix
// closes). This IS mathematically identical to how every condition icon
// already rendered before the "proportional" pass -- see this file's own
// git history for that fuller reasoning -- reverted here specifically
// because the person's own explicit, direct requirement (identical
// clearance for every icon) rules out the alternative.
const TAB_HUB_ICON_FIXED_HEIGHT = TAB_HUB_ICON_TARGET_WIDTH / DEFAULT_ICON_ASPECT_RATIO;

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
  // Every icon shares the exact same height -- see TAB_HUB_ICON_FIXED_HEIGHT's
  // own comment for why. Width follows that fixed height at the icon's own
  // real, undistorted ratio, capped at TAB_HUB_ICON_TARGET_WIDTH as a real
  // (if currently never-hit) safety ceiling in case a future icon is ever
  // wider than the butterfly's own 1.487 ratio.
  const width = Math.min(TAB_HUB_ICON_TARGET_WIDTH, TAB_HUB_ICON_FIXED_HEIGHT * ratio);
  return { width, height: TAB_HUB_ICON_FIXED_HEIGHT };
}
