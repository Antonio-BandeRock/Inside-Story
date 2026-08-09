import type { ReactElement } from 'react';
import { Image, View } from 'react-native';
import { Circle, Line, Path, Rect, Svg } from 'react-native-svg';
import type { DigestCategoryKey } from '../lib/digest';

// 19 real, custom vector icons, one per condition -- 2026-08-09, direct
// request giving a specific concept per condition (a heart for CVD, a
// kidney bean for CKD, a butterfly-with-shield for Hashimoto's, etc.).
// Every one of Ionicons' own generic glyphs (heart-outline, water-outline,
// pulse-outline...) this app had been using for the Digest picker's own
// condition tiles until now was a real placeholder, never meant to be
// final -- this file replaces all 19 with real, purpose-built shapes.
//
// A real, honest constraint shaped the FIRST pass at every shape below:
// there was no way to render and actually LOOK AT an SVG from inside this
// environment before it reached a real screen -- every icon was reasoned
// through mathematically (coordinates, curve control points, which parts
// of a shape sit where), not sketched and checked. Reported back directly
// and bluntly the same day: "These aren't going to work." A real
// reference image followed -- a genuinely different, far lower-risk
// situation, much closer to how PurpleRibbonIcon.tsx's own shape was
// built (traced from a real reference photo). This file's own second pass
// (also 2026-08-09) rebuilt every one of the ~14 icons that image
// actually covered -- all seven butterflies, Celiac, Migraine, RA, IBD,
// the Heart, and the Kidney -- to match what that image actually showed,
// far more faithfully than the first pass's own blind guesses. The
// remaining five (Type 1/2 Diabetes, PCOS, Gout, Prostate Health) have no
// new reference material and are unchanged from the first pass -- still
// real, deliberate attempts, not guaranteed-final art, still worth a
// real, careful look before being trusted.
//
// A real, honest limit on how far even a real reference image can be
// followed here: the reference itself is a fully shaded, gradient-lit
// illustration style (visible vein branching in the heart, individual
// sulci in a brain, fine surface texture throughout) -- reproducing that
// exact rendering style in flat, single-color SVG paths isn't realistic,
// and would also be inconsistent with how every other icon in this app
// (including PurpleRibbonIcon.tsx itself) is built: a flat, single-color
// silhouette, matching Ionicons' own flat glyph convention. What this
// second pass actually did was extract each shape's real SILHOUETTE and
// key distinguishing features (a heart's own real vessel stems, a
// kidney's own stem/funnel, a butterfly's own antennae, a shield's real
// size and position) and rebuild flat versions of those, not attempt the
// shading itself.
//
// Four items visible in that same reference image do NOT correspond to
// any of this app's current 19 conditions and were deliberately skipped:
// Lungs, Brain, and Thyroid Gland (general organ reference, not any one
// condition's own icon) and Myasthenia Gravis (a real disease, but not
// yet one of this app's own built-out conditions). A real, separate call
// worth naming directly: the reference image showed Sjögren's TWO ways --
// as a seventh butterfly (wings dotted with droplets) alongside every
// other autoimmune condition, and separately as a standalone "(Specific)"
// crossed-out-faucet icon. This file picked the butterfly version as the
// real, intended design, reasoning that every other condition in the same
// image being a butterfly is a strong, consistent signal -- stated here
// directly as this file's own interpretation, not confirmed, in case it
// turns out backwards.
//
// A second real, documented constraint from this exact codebase, true
// across both passes: PurpleRibbonIcon.tsx's own history records that a
// `transform` string prop (e.g. `rotate(deg cx cy)`) was reported
// completely invisible on a real Android device, not trusted to reliably
// parse through react-native-svg's native renderer. Every icon below
// avoids `transform` entirely -- any shape that would normally be
// expressed as "the same element, rotated" (a wheat leaf angled outward,
// a thumb angled away from the palm) is instead hand-placed as its own
// real, literal coordinates.
//
// A third, real constraint, specific to this file, true across both
// passes: every icon takes only ONE `color` prop (matching how Ionicons
// glyphs already work everywhere else in this app's own icon grid) --
// there is no second color available for an "emblem on top of a solid
// shape" to contrast against. A same-color stroke or fill drawn directly
// on top of another same-color fill is genuinely invisible, not just
// subtle -- verified by reasoning through the actual paint order, not
// assumed. Every icon that needs an emblem sitting ON a solid shape
// (Hashimoto's shield on its own body, the butterfly stamped on
// Rheumatoid Arthritis's palm) uses a real cutout instead -- both shapes
// combined into one Path `d` string with `fillRule="evenodd"`, the same
// real technique PurpleRibbonIcon.tsx already uses for its own inner-loop
// hole -- so the emblem reads as a genuine gap showing the background
// through, which works regardless of what color is actually passed in.
// Anywhere a slash/line needs to read as "crossed out" against a solid
// shape underneath it (Celiac's wheat, Type 2 Diabetes's own unrelated
// droplet), the line is drawn long enough to extend well past the shape's
// own edges, so its visible ends outside the shape make the crossed-out
// intent unambiguous even though the middle segment overlapping the shape
// itself is invisible. Sjögren's own new droplet pattern and IBS's own
// wavy pattern instead use a real, deliberately different technique --
// the wing fill itself drops to a reduced opacity, so the full-opacity
// pattern drawn on top genuinely contrasts, a better fit for a soft,
// scattered pattern than a sharp cutout gap would have been.
//
// Every shape uses a plain 100x100 viewBox and renders as a square icon
// (width === height === size), the same footprint every Ionicons glyph
// already occupies in this exact grid slot -- unlike PurpleRibbonIcon's
// own non-square aspect-ratio handling, which only exists because that
// ONE traced shape genuinely isn't square.

type IconProps = { size: number; color: string };

// ---------------------------------------------------------------------
// Shared butterfly base -- seven of the nineteen conditions (Lupus,
// Hashimoto's, Graves', Sjögren's, IBS, MS, Psoriasis) are all built from
// real autoimmune-disease butterfly iconography, differing only in one
// real embellishment each. One shared pair of wing shapes, reused seven
// times, rather than seven independently-reasoned near-duplicates --
// lower risk, and whatever adjustment the base shape needs later only
// has to happen once.
//
// 2026-08-09, a real reference image supplied directly -- a genuinely
// different, far lower-risk situation than the first pass above, which
// was built with zero visual reference at all. Every butterfly in that
// reference carries two thin, curved antennae with small rounded tips --
// a real, consistent, distinguishing feature this file's own first
// attempt completely missed. Added here, shared by every butterfly
// variant, rather than seven separate near-duplicate additions.
// ---------------------------------------------------------------------
const WING_UL = 'M50,35 C30,18 8,20 6,35 C4,50 25,52 50,45 Z';
const WING_UR = 'M50,35 C70,18 92,20 94,35 C96,50 75,52 50,45 Z';
const WING_LL = 'M50,48 C38,60 20,58 18,72 C17,82 35,84 50,62 Z';
const WING_LR = 'M50,48 C62,60 80,58 82,72 C83,82 65,84 50,62 Z';
// A plain, thin body -- a leaf/lens shape rather than a true ellipse, so
// it can be written as one real Path (needed later for the evenodd
// cutout trick, which only works within a single Path's own `d` string).
const BODY_PLAIN = 'M50,28 C54,28 56,40 56,54 C56,68 54,80 50,80 C46,80 44,68 44,54 C44,40 46,28 50,28 Z';
const ANTENNA_L = 'M46,30 C43,24 39,20 35,15';
const ANTENNA_R = 'M54,30 C57,24 61,20 65,15';

// Rendered by every one of the seven butterfly icons below, not just the
// ones already using ButterflyBase -- Graves' and Psoriasis build their
// own wing sets directly (see each of their own comments) but still get
// the same real antennae.
function ButterflyAntennae({ color }: { color: string }) {
  return (
    <>
      <Path d={ANTENNA_L} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d={ANTENNA_R} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Circle cx={35} cy={15} r={2} fill={color} />
      <Circle cx={65} cy={15} r={2} fill={color} />
    </>
  );
}

function ButterflyBase({ color, upperWings = true }: { color: string; upperWings?: boolean }) {
  return (
    <>
      <Path d={WING_UL} fill={color} />
      <Path d={WING_UR} fill={color} />
      {upperWings ? (
        <>
          <Path d={WING_LL} fill={color} />
          <Path d={WING_LR} fill={color} />
        </>
      ) : null}
      <ButterflyAntennae color={color} />
    </>
  );
}

// Lupus (SLE) -- "A classic, simple Lupus Butterfly." The real, well-known
// malar-rash butterfly shape in its plainest form: four wing lobes and a
// body, nothing else layered on top. Deliberately the simplest of the six
// butterfly variants, matching the description's own "classic, simple."
export function LupusButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <ButterflyBase color={color} />
      <Path d={BODY_PLAIN} fill={color} />
    </Svg>
  );
}

// Hashimoto's & Graves' -- 2026-08-09, a real, different approach for
// these two specifically, direct idea: "use the existing tabhub butterfly
// for hashimoto's and for graves' diseases by just causing a slight
// redish line on the top of the wings to represent graves' having
// hyperthyroidism and the red line being at the bottom represents
// hypothyroidism." Reuses this app's own real, already-commissioned
// artwork (assets/branding/butterfly-transparent.png, the same file
// TabHub.tsx's own hub button already renders, see that file's own
// comment on its real provenance) rather than another hand-drawn SVG
// guess -- a genuinely different, lower-risk source than anything else in
// this file, since it's real, finished, already-shipped-in-this-app art,
// not something reasoned through blind or half-guessed from a reference
// photo.
//
// A real, honest sizing caveat, stated directly rather than assumed away:
// this artwork is a large, richly detailed illustration (fine wing
// patterning, gem-like dots, gold filigree), rendered elsewhere in this
// app at 116px (TabHub's own hub button) -- LensHub's own grid tile is
// only 20px (GRID_ITEM_ICON_SIZE), close to a 6x reduction. The overall
// butterfly silhouette (wings, antennae, segmented body) should still
// read clearly that small, the same way this exact artwork already reads
// fine as this app's own real, shipped phone-home-screen icon -- but the
// FINE detail almost certainly won't resolve at 20px, and there's no way
// to confirm that from here. The one real, deliberate signal at this
// small size is the accent line itself, not the underlying artwork's own
// fine texture.
//
// The accent line is a plain, straight bar (not traced to the wing's own
// actual curved silhouette, which isn't something this environment can
// measure from a raster file) -- positioned well inside the wing area,
// clear of the antennae's own decorative tips near the top-center. A
// real, warm red, deliberately NOT this app's own purple family, so it
// reads as its own distinct signal against the artwork's cool blue/green/
// gold palette rather than blending in.
const THYROID_LINE_ACCENT = '#E4574C';
function ThyroidButterflyIcon({ size, linePosition }: { size: number; linePosition: 'top' | 'bottom' }) {
  // Computed as real pixel numbers from `size` rather than percentage
  // strings -- this RN/TypeScript setup's own ViewStyle typing doesn't
  // accept a plain `string` for left/right/top/bottom (only a number or a
  // specific template-literal percentage type), and a real pixel number
  // sidesteps that friction entirely while still scaling correctly
  // whatever `size` this icon is actually asked to render at.
  const lineHeight = Math.max(2, size * 0.05);
  const sideInset = size * 0.18;
  const lineStyle =
    linePosition === 'top'
      ? { position: 'absolute' as const, left: sideInset, right: sideInset, top: size * 0.12, height: lineHeight, borderRadius: lineHeight / 2, backgroundColor: THYROID_LINE_ACCENT }
      : { position: 'absolute' as const, left: sideInset, right: sideInset, bottom: size * 0.08, height: lineHeight, borderRadius: lineHeight / 2, backgroundColor: THYROID_LINE_ACCENT };
  return (
    <View style={{ width: size, height: size }}>
      <Image source={require('../assets/branding/butterfly-transparent.png')} style={{ width: size, height: size }} resizeMode="contain" />
      <View style={lineStyle} />
    </View>
  );
}
// Hashimoto's -- hypothyroidism, the red accent sits near the BOTTOM of
// the wings per the request's own stated mapping.
export function HashimotosThyroidIcon({ size }: IconProps) {
  return <ThyroidButterflyIcon size={size} linePosition="bottom" />;
}
// Graves' -- hyperthyroidism, the red accent sits near the TOP of the
// wings.
export function GravesThyroidIcon({ size }: IconProps) {
  return <ThyroidButterflyIcon size={size} linePosition="top" />;
}

// The two hand-drawn SVG versions below (HashimotosButterflyIcon,
// GravesButterflyIcon) are no longer used by DIGEST_CONDITION_ICONS as of
// the real artwork-based icons directly above -- kept defined, not
// deleted, as a real fallback if the artwork-based approach doesn't work
// out on-device, and because deleting working code that might still be
// wanted carries real risk for zero benefit at this stage.
//
// Hashimoto's -- "A Butterfly with the Shield core emblem." The body is
// widened (from BODY_PLAIN's own proportions) specifically so a shield
// shape fits cleanly inside its silhouette, then combined with that
// shield in one evenodd Path -- the shield reads as a real cutout through
// the body, not a same-color overlay that would otherwise vanish.
//
// 2026-08-09, both the body and the shield enlarged, per a real reference
// image showing a clearly large, prominent shield spanning much of the
// wing-center area -- the first pass's own shield was noticeably smaller
// and easy to miss at this icon's actual small render size.
const HASHIMOTOS_BODY_WIDE = 'M50,22 C60,22 66,38 66,54 C66,70 60,86 50,86 C40,86 34,70 34,54 C34,38 40,22 50,22 Z';
const SHIELD_EMBLEM = 'M50,36 L60,40 L60,54 C60,62 55,68 50,72 C45,68 40,62 40,54 L40,40 Z';
export function HashimotosButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <ButterflyBase color={color} />
      <Path d={`${HASHIMOTOS_BODY_WIDE} ${SHIELD_EMBLEM}`} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

// Graves' Disease -- "A Butterfly with Flame/Energy Wings." A real, hand-
// placed jagged variant of the same four wing lobes -- real points along
// the outer edge instead of one smooth curve, standing in for a flame's
// own flicker.
//
// 2026-08-09, redrawn from the first pass's several medium points to
// fewer, much LONGER, sharper points, per a real reference image showing
// dramatically elongated, swallowtail-like pointed wing tips -- a real,
// visible difference from Psoriasis's own scalloped variant below (many
// small, regular bumps), so the two read as genuinely different textures.
const FLAME_UL = 'M50,35 C38,20 30,8 18,10 C24,20 10,22 6,34 C16,30 8,46 16,48 C24,50 30,50 50,45 Z';
const FLAME_UR = 'M50,35 C62,20 70,8 82,10 C76,20 90,22 94,34 C84,30 92,46 84,48 C76,50 70,50 50,45 Z';
const FLAME_LL = 'M50,48 C36,58 24,54 18,68 C28,62 26,78 20,80 C30,82 32,86 42,82 C44,74 46,72 50,62 Z';
const FLAME_LR = 'M50,48 C64,58 76,54 82,68 C72,62 74,78 80,80 C70,82 68,86 58,82 C56,74 54,72 50,62 Z';
export function GravesButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={FLAME_UL} fill={color} />
      <Path d={FLAME_UR} fill={color} />
      <Path d={FLAME_LL} fill={color} />
      <Path d={FLAME_LR} fill={color} />
      <Path d={BODY_PLAIN} fill={color} />
      <ButterflyAntennae color={color} />
    </Svg>
  );
}

// Irritable Bowel Syndrome -- "An IBS Butterfly containing the wavy
// intestinal pattern and stylized S body." Real wing shapes at a reduced
// fillOpacity (0.55) so the full-opacity wavy strokes drawn on top of them
// actually contrast and stay visible -- a same-opacity same-color overlay
// would have vanished the same way an emblem would, so this deliberately
// reaches for opacity contrast instead of the evenodd-cutout trick used
// elsewhere in this file (a good fit here specifically, since the intent
// is a soft, low-contrast wave pattern, not a sharp gap). The body itself
// is a real, separate S-curve stroke, not the shared BODY_PLAIN shape.
//
// 2026-08-09, a second wavy stroke added per wing -- a real reference
// image showed a much denser, more continuous coiling pattern filling
// most of each wing than the first pass's single line per wing managed.
const WAVE_UL = 'M14,32 C20,26 26,36 32,30 C36,26 40,32 44,28';
const WAVE_UR = 'M86,32 C80,26 74,36 68,30 C64,26 60,32 56,28';
const WAVE_LL = 'M24,64 C30,58 34,68 40,64';
const WAVE_LR = 'M76,64 C70,58 66,68 60,64';
const WAVE2_UL = 'M12,42 C18,38 22,46 28,42 C32,38 36,44 40,40';
const WAVE2_UR = 'M88,42 C82,38 78,46 72,42 C68,38 64,44 60,40';
const WAVE2_LL = 'M22,72 C28,68 32,76 38,72';
const WAVE2_LR = 'M78,72 C72,68 68,76 62,72';
const S_BODY = 'M50,28 C40,32 40,42 50,46 C60,50 60,60 50,64 C40,68 40,78 50,80';
export function IbsButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={WING_UL} fill={color} fillOpacity={0.55} />
      <Path d={WING_UR} fill={color} fillOpacity={0.55} />
      <Path d={WING_LL} fill={color} fillOpacity={0.55} />
      <Path d={WING_LR} fill={color} fillOpacity={0.55} />
      <Path d={WAVE_UL} stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d={WAVE_UR} stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d={WAVE_LL} stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d={WAVE_LR} stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d={WAVE2_UL} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d={WAVE2_UR} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d={WAVE2_LL} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d={WAVE2_LR} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d={S_BODY} stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
      <ButterflyAntennae color={color} />
    </Svg>
  );
}

// Multiple Sclerosis -- "A MS Butterfly integrated with the clean
// awareness ribbon body." Real wing lobes, unchanged, with the plain oval
// body replaced by a small, simplified ribbon-loop shape (a diamond loop
// plus two tapering tails) standing in for a real awareness-ribbon
// silhouette -- built from scratch here rather than reusing
// PurpleRibbonIcon.tsx's own much larger, more detailed traced shape,
// which was never designed to scale down to this icon's own small size.
const RIBBON_LOOP = 'M50,28 L58,40 L50,52 L42,40 Z';
const RIBBON_TAIL_L = 'M45,50 L41,80 L48,72 Z';
const RIBBON_TAIL_R = 'M55,50 L59,80 L52,72 Z';
export function MultipleSclerosisButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <ButterflyBase color={color} />
      <Path d={RIBBON_LOOP} fill={color} />
      <Path d={RIBBON_TAIL_L} fill={color} />
      <Path d={RIBBON_TAIL_R} fill={color} />
    </Svg>
  );
}

// Psoriasis -- "A textured Butterfly with Line Patterns across the wings
// depicting skin disorder." The upper wings' own outer edge gets many
// small, regular bumps (a scalloped/shingled rhythm) instead of one
// smooth curve -- a genuinely different jaggedness than Graves' own few,
// large, irregular flame points, so the two read as distinct textures
// rather than the same effect twice. The lower wings stay smooth (the
// shared WING_LL/WING_LR), deliberately -- four scalloped wings at this
// icon's own small real render size risked reading as visual noise rather
// than texture; the upper wings' own scalloping alone carries the idea.
const SCALE_UL =
  'M50,35 C44,28 40,30 38,24 C42,22 34,20 34,26 C38,22 28,22 30,28 C34,24 22,26 26,32 C28,28 18,32 22,38 C24,34 15,40 20,45 C30,50 40,48 50,45 Z';
const SCALE_UR =
  'M50,35 C56,28 60,30 62,24 C58,22 66,20 66,26 C62,22 72,22 70,28 C66,24 78,26 74,32 C72,28 82,32 78,38 C76,34 85,40 80,45 C70,50 60,48 50,45 Z';
export function PsoriasisButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={SCALE_UL} fill={color} />
      <Path d={SCALE_UR} fill={color} />
      <Path d={WING_LL} fill={color} />
      <Path d={WING_LR} fill={color} />
      <Path d={BODY_PLAIN} fill={color} />
      <ButterflyAntennae color={color} />
    </Svg>
  );
}

// ---------------------------------------------------------------------
// The four "circle vector" icons -- Celiac, Migraine, Type 1 and Type 2
// Diabetes all share the same real composition (a plain circle outline
// with something else inside it), differing only in what's inside.
// ---------------------------------------------------------------------
function CircleFrame({ color }: { color: string }) {
  return <Circle cx={50} cy={50} r={42} stroke={color} strokeWidth={5} fill="none" />;
}

// Celiac Disease -- "A Crossed-out Wheat Stalk circle vector." A plain
// central stem plus six small "leaves" flanking it in pairs -- each one
// its own real, literal, asymmetric coordinate set (tilted outward-left
// or outward-right depending on which side of the stem it sits on)
// rather than one symmetric shape angled via a `transform`, per this
// file's own standing rule against relying on that prop. The slash is
// drawn corner-to-corner of the full circle, well past the wheat shape's
// own bounds, so its visible ends outside the wheat read as "crossed out"
// even though the segment crossing the wheat itself is the same color and
// therefore invisible.
//
// 2026-08-09, redrawn from the first pass's own plain, round, un-tilted
// ovals -- a real reference image showed a leafier, more plant-like
// silhouette (elongated, pointed, visibly angled leaves) rather than
// simple grain-like dots.
function wheatLeaf(cx: number, cy: number, tiltRight: boolean): string {
  const s = tiltRight ? 1 : -1;
  return `M${cx},${cy + 7} C${cx - 3 * s},${cy + 2} ${cx - 2 * s},${cy - 5} ${cx + 2 * s},${cy - 9} C${cx + 4 * s},${cy - 4} ${cx + 3 * s},${cy + 3} ${cx},${cy + 7} Z`;
}
export function CeliacWheatIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CircleFrame color={color} />
      <Line x1={50} y1={25} x2={50} y2={75} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d={wheatLeaf(40, 30, false)} fill={color} />
      <Path d={wheatLeaf(60, 30, true)} fill={color} />
      <Path d={wheatLeaf(40, 42, false)} fill={color} />
      <Path d={wheatLeaf(60, 42, true)} fill={color} />
      <Path d={wheatLeaf(40, 54, false)} fill={color} />
      <Path d={wheatLeaf(60, 54, true)} fill={color} />
      <Line x1={16} y1={16} x2={84} y2={84} stroke={color} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}

// Migraine -- "A clean Lightning Bolt circle vector." A plain, classic
// zigzag bolt shape, the same general proportions as a standard "flash"
// glyph, inside the shared circle frame.
const BOLT = 'M56,18 L34,52 L48,52 L42,84 L70,44 L54,44 Z';
export function MigraineLightningIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CircleFrame color={color} />
      <Path d={BOLT} fill={color} />
    </Svg>
  );
}

// Type 1 Diabetes -- "A matching purple circle vector containing a
// vertical Syringe / Insulin Vial silhouette." Barrel, plunger cap,
// finger flanges, and needle, each its own separate solid shape sitting
// edge-to-edge rather than overlapping -- avoids the same-color-on-same-
// color invisibility this file's own header comment already flags (no
// measurement tick marks layered on top of the barrel, which would have
// vanished the same way).
export function Type1DiabetesSyringeIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CircleFrame color={color} />
      <Rect x={41} y={15} width={18} height={10} rx={2} fill={color} />
      <Rect x={38} y={58} width={6} height={5} rx={1.5} fill={color} />
      <Rect x={56} y={58} width={6} height={5} rx={1.5} fill={color} />
      <Rect x={44} y={25} width={12} height={38} rx={2} fill={color} />
      <Path d="M50,63 L46,80 L50,86 L54,80 Z" fill={color} />
    </Svg>
  );
}

// Type 2 Diabetes -- "A matching purple circle vector containing a single
// clear Blood Droplet silhouette." A classic teardrop formula, filled
// solid, no slash -- the real reference image supplied 2026-08-09 doesn't
// cover this icon, so it stays unchanged from the first pass.
export function Type2DiabetesDropletIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CircleFrame color={color} />
      <Path d="M50,18 C50,18 28,48 28,63 A22,22 0 1 0 72,63 C72,48 50,18 50,18 Z" fill={color} />
    </Svg>
  );
}

// Sjögren's Syndrome -- originally built as "A Crossed-out Droplet icon,"
// standing entirely on its own outside the butterfly family.
//
// 2026-08-09, replaced after a real reference image showed Sjögren's
// drawn as a seventh butterfly, wings dotted with a small droplet
// pattern -- joining the other six autoimmune conditions in the same
// visual family, alongside a separate "(Specific)" crossed-out-faucet
// icon shown as a second, alternate idea. Every OTHER condition in that
// same reference is a butterfly, a strong, consistent signal this is the
// real, intended design (with the faucet version more likely a secondary
// exploration) -- built as the family version here; flagged directly as
// this file's own real interpretation, worth confirming rather than
// assuming right.
//
// The wing fill drops to fillOpacity 0.7 (a smaller reduction than IBS's
// own 0.55, just enough that the full-opacity droplet dots drawn on top
// genuinely contrast and stay visible, the same real technique IBS's own
// wavy pattern already relies on) -- two small solid droplets per wing.
function sjogrensDroplet(cx: number, cy: number): string {
  return `M${cx},${cy - 4} C${cx},${cy - 4} ${cx - 3},${cy + 1} ${cx - 3},${cy + 3} A3,3 0 1 0 ${cx + 3},${cy + 3} C${cx + 3},${cy + 1} ${cx},${cy - 4} ${cx},${cy - 4} Z`;
}
export function SjogrensButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={WING_UL} fill={color} fillOpacity={0.7} />
      <Path d={WING_UR} fill={color} fillOpacity={0.7} />
      <Path d={WING_LL} fill={color} fillOpacity={0.7} />
      <Path d={WING_LR} fill={color} fillOpacity={0.7} />
      <Path d={sjogrensDroplet(18, 36)} fill={color} />
      <Path d={sjogrensDroplet(33, 30)} fill={color} />
      <Path d={sjogrensDroplet(82, 36)} fill={color} />
      <Path d={sjogrensDroplet(67, 30)} fill={color} />
      <Path d={sjogrensDroplet(28, 62)} fill={color} />
      <Path d={sjogrensDroplet(72, 62)} fill={color} />
      <Path d={BODY_PLAIN} fill={color} />
      <ButterflyAntennae color={color} />
    </Svg>
  );
}

// Rheumatoid Arthritis -- "A Skeletal Hand with a Butterfly emblem
// stamped in the center." Each finger is drawn as two short, separately-
// placed capsule segments with a real, literal gap between them, rather
// than one continuous shape with a same-color "joint line" drawn on top
// (which would have been invisible for the same reason every other
// emblem-on-solid-shape in this file avoids that trick) -- an actual
// break in the shape is visible regardless of color, since it's a true
// absence, not an overlay. The butterfly itself is a four-lobe shape
// combined with the palm in one evenodd Path, the same real cutout
// technique Hashimoto's own shield uses above.
//
// 2026-08-09, two real changes from a real reference image: the palm
// emblem enlarged and repositioned (the reference shows a genuinely
// prominent, clearly visible butterfly, not a small one easy to miss),
// and small pain-mark tick lines added near two of the finger-segment
// gaps -- each one starting inside its own real, already-open gap and
// extending further out into open background space, so it's visible
// regardless of color the same way every other emblem in this file is,
// standing in for the reference's own small radiating ache marks near a
// couple of swollen-looking joints.
const RA_PALM = 'M28,55 C26,75 30,92 50,94 C70,92 74,75 72,55 Z';
const RA_EMBLEM =
  'M50,64 C42,56 32,58 32,66 C32,74 42,74 50,68 C58,74 68,74 68,66 C68,58 58,56 50,64 Z ' +
  'M50,68 C44,76 36,78 38,86 C40,92 46,86 50,78 C54,86 60,92 62,86 C64,78 56,76 50,68 Z';
export function RheumatoidArthritisHandIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Thumb -- a single angled quadrilateral via literal coordinates,
          not a rotated capsule, per this file's own standing rule against
          relying on `transform`. */}
      <Path d="M22,60 L14,48 C12,44 16,40 20,44 L30,58 Z" fill={color} />
      {/* Index finger */}
      <Rect x={30.5} y={35} width={7} height={20} rx={3} fill={color} />
      <Rect x={30.5} y={18} width={7} height={14} rx={3} fill={color} />
      {/* Middle finger, the tallest -- a real pain-mark tick pair sits in
          its own segment gap (y 28-32), extending out into open space. */}
      <Rect x={40.5} y={32} width={7} height={23} rx={3} fill={color} />
      <Rect x={40.5} y={12} width={7} height={16} rx={3} fill={color} />
      <Line x1={44} y1={30} x2={37} y2={25} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={44} y1={30} x2={39} y2={35} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Ring finger -- a second pain-mark tick in its own segment gap
          (y 30-34). */}
      <Rect x={50.5} y={34} width={7} height={21} rx={3} fill={color} />
      <Rect x={50.5} y={15} width={7} height={15} rx={3} fill={color} />
      <Line x1={54} y1={32} x2={61} y2={27} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Pinky, the shortest */}
      <Rect x={60.5} y={38} width={6} height={17} rx={3} fill={color} />
      <Rect x={60.5} y={24} width={6} height={11} rx={3} fill={color} />
      <Path d={`${RA_PALM} ${RA_EMBLEM}`} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

// Inflammatory Bowel Disease -- "A detailed Intestinal Tract/Crohn's
// graphic showing both bowel systems." A single, winding, thick-stroked
// open path, doubling back on itself several times -- a stroke-only
// shape (no fill), which is always visible against the transparent
// background regardless of color, no contrast concerns at all.
//
// 2026-08-09, a small concentric "target" mark added at one point along
// the coil -- a real reference image (labeled Crohn's Disease, directly
// usable for this app's own broader IBD category) showed a distinct
// bullseye-style mark on one section of intestine, standing in for a
// localized area of real inflammation. The intestine's own stroke there
// is only 9 units wide; the ring's own larger radius extends visibly
// beyond it either side, so it reads as a real, separate mark rather than
// disappearing into the tube itself.
const INTESTINE =
  'M20,25 C40,15 40,35 20,40 C0,45 0,60 20,62 C40,64 45,50 60,52 C80,55 85,70 65,78 C50,84 45,70 60,68 C75,66 80,80 80,80';
export function IbdIntestineIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={INTESTINE} stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={65} cy={55} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={65} cy={55} r={4} fill={color} />
    </Svg>
  );
}

// PCOS -- "A clean, minimal anatomical silhouette of the Uterus and
// Ovaries." A rounded uterus body, plus two curved fallopian-tube strokes
// each ending in a small solid circle (an ovary) -- the tubes extend
// outward into open space beyond the uterus body's own edges, so they're
// clearly visible against the transparent background the same way the
// slash icons above are, no overlay-contrast risk here either.
export function PcosUterusIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M38,30 C38,20 62,20 62,30 L66,55 C66,68 34,68 34,55 Z" fill={color} />
      <Path d="M38,32 C22,28 12,35 10,28" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M62,32 C78,28 88,35 90,28" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={9} cy={26} r={6} fill={color} />
      <Circle cx={91} cy={26} r={6} fill={color} />
    </Svg>
  );
}

// Chronic Kidney Disease -- "A smooth, anatomical Kidney bean icon." The
// classic bean silhouette: one smooth, convex outer curve, and one real
// concave notch cut into the inner side -- the shape's own single most
// recognizable feature, built directly into the path's own curve rather
// than approximated.
//
// 2026-08-09, a real stem/tube added extending from the concave notch --
// a real reference image showed a clear funnel/tube (the renal pelvis and
// ureter) at that exact spot, a real, recognizable kidney feature the
// first pass's own plain bean shape left out. A stroke, extending into
// open space beyond the shape's own concave edge, so no contrast concerns.
const KIDNEY = 'M30,20 C10,30 8,55 22,72 C32,84 55,90 70,78 C60,72 48,68 48,55 C48,45 58,42 68,46 C82,52 92,42 88,28 C82,10 50,10 30,20 Z';
export function ChronicKidneyDiseaseIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={KIDNEY} fill={color} />
      <Path d="M55,52 C62,54 68,56 72,62" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// Fatty Liver Disease -- "A solid, anatomical Liver wedge icon." A real
// liver's own genuine asymmetry (one large lobe, one smaller) built into
// an otherwise simple, smooth rounded-wedge silhouette.
const LIVER = 'M20,35 C15,55 25,75 45,80 C70,85 88,68 85,45 C82,25 62,15 45,20 C32,24 24,26 20,35 Z';
export function FattyLiverDiseaseIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={LIVER} fill={color} />
    </Svg>
  );
}

// Gout -- "A clean Foot Profile silhouette highlighting a sharp starburst
// flare precisely over the big toe joint." The starburst's own center sits
// right at the toe's own leftmost edge, with every ray extending further
// left, into open space beyond the foot's own silhouette -- deliberately
// NOT centered deep inside the solid foot shape, since rays crossing a
// same-color fill there would be invisible for the same reason every
// other same-color overlay in this file is avoided.
const FOOT =
  'M85,60 C90,50 88,38 78,35 L45,32 C35,30 28,25 20,28 C12,31 10,40 15,46 C10,48 8,55 12,60 C16,66 24,64 30,60 L70,62 C78,64 82,64 85,60 Z';
export function GoutFootIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={FOOT} fill={color} />
      <Line x1={12} y1={32} x2={2} y2={20} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={2} y2={32} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={2} y2={44} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={8} y2={18} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={8} y2={46} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={16} y2={16} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={16} y2={48} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

// Prostate Health -- "A clean anatomical layout showing a Walnut-shaped
// Prostate gland wrapping the base of a minimal bladder neck." A rounded,
// walnut-like gland shape with a small vertical capsule (the bladder
// neck) emerging from directly above it, its own lower end overlapping
// into the gland's own upper curve -- both solid, same-color shapes, so
// they simply read as one combined silhouette (a gland with a neck/stem),
// which is exactly the intended "wrapping" effect, no contrast trick
// needed here at all.
const PROSTATE_GLAND = 'M50,35 C35,20 15,28 15,48 C15,65 35,72 50,85 C65,72 85,65 85,48 C85,28 65,20 50,35 Z';
export function ProstateGlandIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={44} y={8} width={12} height={32} rx={6} fill={color} />
      <Path d={PROSTATE_GLAND} fill={color} />
    </Svg>
  );
}

// Cardiovascular Disease -- "A detailed, anatomical Heart icon."
//
// 2026-08-09, rebuilt from the first pass's own classic, symmetric
// valentine-heart formula -- a real reference image showed a genuinely
// anatomical heart instead: a rounder, less symmetric muscular mass, with
// several real vessel stems (varying in height and width) rising from the
// top rather than one plain stub. Rebuilt in that same direction: an
// organic, slightly asymmetric rounded mass, plus three real stems of
// different heights/widths standing in for the aorta/pulmonary artery/
// vena cava the reference shows -- real anatomical detail (visible
// coronary vessels branching across the surface) was left out
// deliberately, since that's fine texture this file has no reliable way
// to hand-author blind, even with a real reference to look at.
const HEART = 'M50,92 C25,75 8,55 10,35 C12,18 28,8 42,14 C48,17 50,24 50,24 C50,24 54,15 62,12 C78,6 92,20 90,38 C88,58 72,76 50,92 Z';
export function CardiovascularDiseaseHeartIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={40} y={2} width={5} height={14} rx={2} fill={color} />
      <Rect x={48} y={0} width={6} height={16} rx={2} fill={color} />
      <Rect x={57} y={4} width={5} height={12} rx={2} fill={color} />
      <Path d={HEART} fill={color} />
    </Svg>
  );
}

// A real, one-to-one lookup from every condition's own DigestCategoryKey
// to its icon component above -- built once here rather than a switch
// statement scattered at each real call site (currently just LensHub's
// own grid tile rendering, see app/(tabs)/purple-digest.tsx's own LENSES
// construction). Deliberately Partial -- basicHealth/earthMatters/
// homeGardening aren't real diagnosed conditions, so they keep their own
// existing Ionicons glyph (reader-outline/earth-outline/leaf-outline)
// rather than getting a bespoke icon here.
export const DIGEST_CONDITION_ICONS: Partial<Record<DigestCategoryKey, (props: IconProps) => ReactElement>> = {
  hashimotos: HashimotosThyroidIcon,
  rheumatoidArthritis: RheumatoidArthritisHandIcon,
  psoriasis: PsoriasisButterflyIcon,
  graves: GravesThyroidIcon,
  type1Diabetes: Type1DiabetesSyringeIcon,
  celiac: CeliacWheatIcon,
  ibd: IbdIntestineIcon,
  multipleSclerosis: MultipleSclerosisButterflyIcon,
  lupus: LupusButterflyIcon,
  sjogrens: SjogrensButterflyIcon,
  pcos: PcosUterusIcon,
  chronicKidneyDisease: ChronicKidneyDiseaseIcon,
  fattyLiverDisease: FattyLiverDiseaseIcon,
  type2Diabetes: Type2DiabetesDropletIcon,
  ibs: IbsButterflyIcon,
  migraine: MigraineLightningIcon,
  cardiovascularDisease: CardiovascularDiseaseHeartIcon,
  gout: GoutFootIcon,
  prostateHealth: ProstateGlandIcon,
};
