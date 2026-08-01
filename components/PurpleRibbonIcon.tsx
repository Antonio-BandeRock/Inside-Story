import Svg, { Path } from 'react-native-svg';

// A real folded awareness-ribbon shape, 2026-07-28 -- traced (not hand-
// drawn) from the actual reference photo (Screenshots/purple-ribbon-
// meaning.png): built a binary silhouette mask from the photo, denoised it
// (the fabric's own texture/sheen was noisy enough to jag a raw trace),
// flood-filled to isolate the ribbon's own blob plus its inner loop hole
// as two separate regions, walked each region's boundary (Moore-neighbor
// tracing), then simplified both boundaries (Ramer-Douglas-Peucker) down
// to a clean, small point set. The two closed subpaths below are exactly
// that trace, combined with fillRule="evenodd" so the hole reads as a
// true cutout rather than a second solid shape.
//
// Replaces two earlier attempts: the built-in Ionicons "ribbon" glyph
// (report: read as a race/award rosette, not a folded awareness ribbon),
// and the raw photo itself as a raster <Image> (report: didn't stand out
// against the dark navy background, and the white-outline fix tried for
// that read as wrong and still didn't match how every other icon in this
// app gets its own drop shadow). A real vector shape fixes both: it's a
// flat, single-color fill like every other icon here, and it CAN carry a
// proper drop shadow the way those do -- see SHADOW_LAYERS below.
const RIBBON_VIEWBOX_WIDTH = 268;
// The ribbon shape's own true height (matches its real traced proportions
// -- used for the size prop's aspect-ratio math below, so a caller asking
// for e.g. size=52 gets a ribbon whose visible shape is genuinely 52px
// tall, regardless of the extra canvas room carved out below for the
// shadow -- see VIEWBOX_HEIGHT).
const RIBBON_SHAPE_HEIGHT = 459;
// The bottommost traced points sit at y=451, just 8 units above
// RIBBON_SHAPE_HEIGHT -- not enough room for the largest shadow layer's
// own 30-unit drop before it runs past the shape's own coordinate space
// and gets clipped (SVG clips anything outside its viewBox by default).
// Padding the viewBox itself by more than the largest offset gives every
// layer room to draw in full.
const SHADOW_PAD = 36;
const VIEWBOX_HEIGHT = RIBBON_SHAPE_HEIGHT + SHADOW_PAD;
const RIBBON_ASPECT = RIBBON_SHAPE_HEIGHT / RIBBON_VIEWBOX_WIDTH;
const RIBBON_PATH =
  'M131,6 L149,7 L166,12 L184,25 L202,61 L221,111 L221,136 L215,156 L175,234 L261,382 L224,451 L219,447 L142,314 L134,305 L128,308 L45,451 L6,385 L92,234 L92,226 L61,169 L53,147 L50,132 L50,114 L55,94 L86,27 L95,18 L106,12 L131,6 Z ' +
  'M127,57 L150,61 L161,70 L172,93 L137,159 L129,150 L104,105 L88,70 L99,63 L127,57 Z';

// react-native-svg's own <Filter>/feGaussianBlur support is inconsistent
// enough across platforms/versions to risk a silently-blank icon -- rather
// than depend on that, this reuses the same "several offset, increasingly
// faded, flat-color copies drawn behind the real shape" trick this app
// already relies on elsewhere for its own drop shadows (see
// components/TabHub.tsx's own ELEVATION_SHADOW_LAYERS and
// components/ScreenHeader.tsx's own SHADOW_LAYERS).
//
// Each layer below is its OWN path string, with y-coordinates already
// shifted at build time -- rather than one shared path offset via a
// `transform` prop. 2026-07-28: an earlier version used
// transform={`translate(0, ${dy})`} on a shared path, and was reported as
// showing no shadow at all. react-native-svg's `transform` prop does
// accept a plain SVG-syntax string per its own type definitions, but
// trusting that string to actually get parsed by the native Android
// renderer (rather than silently no-op'ing, which would leave every
// "shadow" layer sitting at dy=0 -- exactly on top of, and fully hidden
// under, the opaque fill drawn last) isn't something to depend on without
// a device to confirm it against. Baked-in coordinates can't silently
// fail to apply the way a transform string might.
//
// dy is in viewBox units (0-459 tall), NOT display pixels -- this icon
// renders at a small fraction of that (26-52px TALL everywhere it's used),
// so an offset that looks right in viewBox space would shrink to
// sub-pixel and vanish at real display size. Checked by rendering this
// exact recipe at both the smallest (26px) and largest (52px) real call
// sites' actual footprint before settling on these values.
//
// 2026-07-28: even after the transform-string fix above, reported as
// still extremely faint to invisible -- traced to checking these values
// against the wrong background. This icon's TabHub grid appearance sits
// on `colors.menuSurface` (#545A63, a mid-tone gray), not the dark navy
// `colors.background` (#2B3753) used everywhere else this was checked --
// a black shadow reads at much lower contrast against the lighter of the
// two. Re-rendered against menuSurface specifically and pushed both the
// offsets and opacities well past what looked right against navy alone,
// until the shadow was clearly visible against the lighter background
// too (still fine against navy -- more contrast there, not less).
const RIBBON_PATH_SHADOW_10 =
  'M131,16 L149,17 L166,22 L184,35 L202,71 L221,121 L221,146 L215,166 L175,244 L261,392 L224,461 L219,457 L142,324 L134,315 L128,318 L45,461 L6,395 L92,244 L92,236 L61,179 L53,157 L50,142 L50,124 L55,104 L86,37 L95,28 L106,22 L131,16 Z ' +
  'M127,67 L150,71 L161,80 L172,103 L137,169 L129,160 L104,115 L88,80 L99,73 L127,67 Z';
const RIBBON_PATH_SHADOW_20 =
  'M131,26 L149,27 L166,32 L184,45 L202,81 L221,131 L221,156 L215,176 L175,254 L261,402 L224,471 L219,467 L142,334 L134,325 L128,328 L45,471 L6,405 L92,254 L92,246 L61,189 L53,167 L50,152 L50,134 L55,114 L86,47 L95,38 L106,32 L131,26 Z ' +
  'M127,77 L150,81 L161,90 L172,113 L137,179 L129,170 L104,125 L88,90 L99,83 L127,77 Z';
const RIBBON_PATH_SHADOW_30 =
  'M131,36 L149,37 L166,42 L184,55 L202,91 L221,141 L221,166 L215,186 L175,264 L261,412 L224,481 L219,477 L142,344 L134,335 L128,338 L45,481 L6,415 L92,264 L92,256 L61,199 L53,177 L50,162 L50,144 L55,124 L86,57 L95,48 L106,42 L131,36 Z ' +
  'M127,87 L150,91 L161,100 L172,123 L137,189 L129,180 L104,135 L88,100 L99,93 L127,87 Z';

const SHADOW_LAYERS = [
  { path: RIBBON_PATH_SHADOW_30, opacity: 0.35 },
  { path: RIBBON_PATH_SHADOW_20, opacity: 0.5 },
  { path: RIBBON_PATH_SHADOW_10, opacity: 0.7 },
] as const;

// `size` is the icon's HEIGHT, matching every other Lens icon's own `size`
// prop (Ionicons renders those as a square glyph of that many px on a
// side) -- 2026-07-28, corrected the same day this was built: `size` was
// first applied as the ribbon's WIDTH instead, and since the traced shape
// is taller than it is wide (RIBBON_ASPECT ~1.71), that let the rendered
// HEIGHT balloon to ~1.7x every call site's intended footprint (e.g. the
// 52px call site actually rendered ~89px tall), reported as "way too big."
// Deriving width from height here instead keeps every call site sized to
// match its neighboring icons, the same way it always has.
export function PurpleRibbonIcon({ size, color }: { size: number; color: string }) {
  const width = size / RIBBON_ASPECT;
  const svgHeight = size * (VIEWBOX_HEIGHT / RIBBON_SHAPE_HEIGHT);
  return (
    <Svg width={width} height={svgHeight} viewBox={`0 0 ${RIBBON_VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
      {SHADOW_LAYERS.map(({ path, opacity }) => (
        <Path key={path} d={path} fill="#000000" fillOpacity={opacity} fillRule="evenodd" />
      ))}
      <Path d={RIBBON_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
