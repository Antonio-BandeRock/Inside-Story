import type { ReactElement } from 'react';
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
// A real, honest constraint shaped every shape below: there is no way to
// render and actually LOOK AT an SVG from inside this environment before
// it reaches the person's own screen -- every icon here was reasoned
// through mathematically (coordinates, curve control points, which parts
// of a shape sit where), not sketched and checked. That's a genuinely
// different, higher-risk process than PurpleRibbonIcon.tsx's own path
// (which was traced from a real reference photo, pixel by pixel) -- so
// every shape here favors clean, simple, well-understood constructions
// (a classic bezier heart, a kidney-bean curve, symmetric butterfly
// lobes) over attempting fine anatomical realism that would be far
// riskier to get right blind. These are real, deliberate first attempts,
// not guaranteed-final art -- expect some of the 19 to need real,
// on-device adjustment once someone can actually see them.
//
// A second real, documented constraint from this exact codebase:
// PurpleRibbonIcon.tsx's own history records that a `transform` string
// prop (e.g. `rotate(deg cx cy)`) was reported completely invisible on a
// real Android device, not trusted to reliably parse through react-
// native-svg's native renderer. Every icon below avoids `transform`
// entirely -- any shape that would normally be expressed as "the same
// element, rotated" (a wheat grain angled outward, a thumb angled away
// from the palm) is instead hand-placed as its own real, literal
// coordinates.
//
// A third, real constraint, specific to this file: every icon takes only
// ONE `color` prop (matching how Ionicons glyphs already work everywhere
// else in this app's own icon grid) -- there is no second color available
// for an "emblem on top of a solid shape" to contrast against. A same-
// color stroke or fill drawn directly on top of another same-color fill
// is genuinely invisible, not just subtle -- verified by reasoning through
// the actual paint order, not assumed. Every icon that needs an emblem
// sitting ON a solid shape (Hashimoto's shield on its own body, the
// butterfly stamped on Rheumatoid Arthritis's palm) uses a real cutout
// instead -- both shapes combined into one Path `d` string with
// `fillRule="evenodd"`, the same real technique PurpleRibbonIcon.tsx
// already uses for its own inner-loop hole -- so the emblem reads as a
// genuine gap showing the background through, which works regardless of
// what color is actually passed in. Anywhere a slash/line needs to read
// as "crossed out" against a solid shape underneath it (Sjögren's
// droplet, Celiac's wheat), the line is drawn long enough to extend well
// past the shape's own edges, so its visible ends outside the shape make
// the crossed-out intent unambiguous even though the middle segment
// overlapping the shape itself is invisible.
//
// Every shape uses a plain 100x100 viewBox and renders as a square icon
// (width === height === size), the same footprint every Ionicons glyph
// already occupies in this exact grid slot -- unlike PurpleRibbonIcon's
// own non-square aspect-ratio handling, which only exists because that
// ONE traced shape genuinely isn't square.

type IconProps = { size: number; color: string };

// ---------------------------------------------------------------------
// Shared butterfly base -- six of the nineteen conditions (Lupus,
// Hashimoto's, Graves', IBS, MS, Psoriasis) are all built from real
// autoimmune-disease butterfly iconography, differing only in one real
// embellishment each. One shared pair of wing shapes, reused six times,
// rather than six independently-reasoned near-duplicates -- lower risk,
// and whatever adjustment the base shape needs later only has to happen
// once.
// ---------------------------------------------------------------------
const WING_UL = 'M50,35 C30,18 8,20 6,35 C4,50 25,52 50,45 Z';
const WING_UR = 'M50,35 C70,18 92,20 94,35 C96,50 75,52 50,45 Z';
const WING_LL = 'M50,48 C38,60 20,58 18,72 C17,82 35,84 50,62 Z';
const WING_LR = 'M50,48 C62,60 80,58 82,72 C83,82 65,84 50,62 Z';
// A plain, thin body -- a leaf/lens shape rather than a true ellipse, so
// it can be written as one real Path (needed later for the evenodd
// cutout trick, which only works within a single Path's own `d` string).
const BODY_PLAIN = 'M50,28 C54,28 56,40 56,54 C56,68 54,80 50,80 C46,80 44,68 44,54 C44,40 46,28 50,28 Z';

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

// Hashimoto's -- "A Butterfly with the Shield core emblem." The body is
// widened (from BODY_PLAIN's own proportions) specifically so a small
// shield shape fits cleanly inside its silhouette, then combined with
// that shield in one evenodd Path -- the shield reads as a real cutout
// through the body, not a same-color overlay that would otherwise vanish.
const HASHIMOTOS_BODY_WIDE = 'M50,26 C58,26 62,40 62,54 C62,68 58,82 50,82 C42,82 38,68 38,54 C38,40 42,26 50,26 Z';
const SHIELD_EMBLEM = 'M50,40 L56,43 L56,53 C56,59 53,63 50,66 C47,63 44,59 44,53 L44,43 Z';
export function HashimotosButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <ButterflyBase color={color} />
      <Path d={`${HASHIMOTOS_BODY_WIDE} ${SHIELD_EMBLEM}`} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

// Graves' Disease -- "A Butterfly with Flame/Energy Wings." A real, hand-
// placed jagged variant of the same four wing lobes -- a few large,
// irregular points along the outer edge instead of one smooth curve,
// standing in for a flame's own flicker. Deliberately fewer, LARGER
// points than Psoriasis's own scalloped variant below, so the two read as
// genuinely different textures, not the same jaggedness reused twice.
const FLAME_UL = 'M50,35 C36,22 24,26 20,14 C22,26 8,24 8,36 C14,32 12,44 20,42 C22,50 34,50 50,45 Z';
const FLAME_UR = 'M50,35 C64,22 76,26 80,14 C78,26 92,24 92,36 C86,32 88,44 80,42 C78,50 66,50 50,45 Z';
const FLAME_LL = 'M50,48 C40,58 28,56 24,66 C30,64 30,74 22,76 C30,78 30,84 40,82 C42,74 46,72 50,62 Z';
const FLAME_LR = 'M50,48 C60,58 72,56 76,66 C70,64 70,74 78,76 C70,78 70,84 60,82 C58,74 54,72 50,62 Z';
export function GravesButterflyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={FLAME_UL} fill={color} />
      <Path d={FLAME_UR} fill={color} />
      <Path d={FLAME_LL} fill={color} />
      <Path d={FLAME_LR} fill={color} />
      <Path d={BODY_PLAIN} fill={color} />
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
const WAVE_UL = 'M14,32 C20,26 26,36 32,30 C36,26 40,32 44,28';
const WAVE_UR = 'M86,32 C80,26 74,36 68,30 C64,26 60,32 56,28';
const WAVE_LL = 'M24,64 C30,58 34,68 40,64';
const WAVE_LR = 'M76,64 C70,58 66,68 60,64';
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
      <Path d={S_BODY} stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
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
// central stem plus six small, pointed-oval "grains" flanking it in
// pairs -- deliberately plain, un-rotated ovals rather than grains angled
// outward via a `transform`, per this file's own standing rule against
// relying on that prop. The slash is drawn corner-to-corner of the full
// circle, well past the wheat shape's own bounds, so its visible ends
// outside the wheat read as "crossed out" even though the segment
// crossing the wheat itself is the same color and therefore invisible.
function wheatGrain(cx: number, cy: number): string {
  return `M${cx},${cy - 8} C${cx - 4},${cy - 5} ${cx - 4},${cy + 5} ${cx},${cy + 8} C${cx + 4},${cy + 5} ${cx + 4},${cy - 5} ${cx},${cy - 8} Z`;
}
export function CeliacWheatIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CircleFrame color={color} />
      <Line x1={50} y1={25} x2={50} y2={75} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d={wheatGrain(40, 30)} fill={color} />
      <Path d={wheatGrain(60, 30)} fill={color} />
      <Path d={wheatGrain(40, 42)} fill={color} />
      <Path d={wheatGrain(60, 42)} fill={color} />
      <Path d={wheatGrain(40, 54)} fill={color} />
      <Path d={wheatGrain(60, 54)} fill={color} />
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
// clear Blood Droplet silhouette." The same real droplet formula used for
// Sjögren's own icon below, scaled to sit comfortably inside the circle
// frame, filled solid with no slash.
export function Type2DiabetesDropletIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CircleFrame color={color} />
      <Path d="M50,18 C50,18 28,48 28,63 A22,22 0 1 0 72,63 C72,48 50,18 50,18 Z" fill={color} />
    </Svg>
  );
}

// Sjögren's Syndrome -- "A Crossed-out Droplet icon." A classic teardrop
// silhouette (a well-known, standard SVG shape, not something reasoned
// from scratch), with a long diagonal slash reaching corner to corner of
// the whole viewBox -- well past the droplet's own edges on both ends, so
// the crossed-out intent stays unambiguous even where the slash overlaps
// the droplet's own same-color fill invisibly.
export function SjogrensDropletIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50,10 C50,10 22,46 22,64 A28,28 0 1 0 78,64 C78,46 50,10 50,10 Z" fill={color} />
      <Line x1={12} y1={12} x2={88} y2={88} stroke={color} strokeWidth={7} strokeLinecap="round" />
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
// absence, not an overlay. The butterfly itself is a small, simplified
// four-lobe shape combined with the palm in one evenodd Path, the same
// real cutout technique Hashimoto's own shield uses above.
const RA_PALM = 'M28,55 C26,75 30,92 50,94 C70,92 74,75 72,55 Z';
const RA_EMBLEM =
  'M50,68 C44,62 36,64 36,70 C36,76 44,76 50,72 C56,76 64,76 64,70 C64,64 56,62 50,68 Z ' +
  'M50,72 C46,78 40,80 42,86 C44,90 48,86 50,80 C52,86 56,90 58,86 C60,80 54,78 50,72 Z';
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
      {/* Middle finger, the tallest */}
      <Rect x={40.5} y={32} width={7} height={23} rx={3} fill={color} />
      <Rect x={40.5} y={12} width={7} height={16} rx={3} fill={color} />
      {/* Ring finger */}
      <Rect x={50.5} y={34} width={7} height={21} rx={3} fill={color} />
      <Rect x={50.5} y={15} width={7} height={15} rx={3} fill={color} />
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
const INTESTINE =
  'M20,25 C40,15 40,35 20,40 C0,45 0,60 20,62 C40,64 45,50 60,52 C80,55 85,70 65,78 C50,84 45,70 60,68 C75,66 80,80 80,80';
export function IbdIntestineIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={INTESTINE} stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
const KIDNEY = 'M30,20 C10,30 8,55 22,72 C32,84 55,90 70,78 C60,72 48,68 48,55 C48,45 58,42 68,46 C82,52 92,42 88,28 C82,10 50,10 30,20 Z';
export function ChronicKidneyDiseaseIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={KIDNEY} fill={color} />
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

// Cardiovascular Disease -- "A detailed, anatomical Heart icon." The
// classic bezier heart formula (two rounded upper lobes meeting a lower
// point) -- a real, standard, well-understood shape, not reasoned from
// scratch -- plus one short vessel stub in the natural notch between the
// two lobes for a bit of real anatomical flavor. The notch there is
// already open background space (the heart's own two lobes rise above
// it), so the stub is clearly visible with no contrast concerns.
const HEART = 'M50,88 C20,65 5,45 5,28 C5,12 18,2 32,2 C42,2 48,8 50,15 C52,8 58,2 68,2 C82,2 95,12 95,28 C95,45 80,65 50,88 Z';
export function CardiovascularDiseaseHeartIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={HEART} fill={color} />
      <Line x1={50} y1={15} x2={50} y2={3} stroke={color} strokeWidth={4} strokeLinecap="round" />
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
  hashimotos: HashimotosButterflyIcon,
  rheumatoidArthritis: RheumatoidArthritisHandIcon,
  psoriasis: PsoriasisButterflyIcon,
  graves: GravesButterflyIcon,
  type1Diabetes: Type1DiabetesSyringeIcon,
  celiac: CeliacWheatIcon,
  ibd: IbdIntestineIcon,
  multipleSclerosis: MultipleSclerosisButterflyIcon,
  lupus: LupusButterflyIcon,
  sjogrens: SjogrensDropletIcon,
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
