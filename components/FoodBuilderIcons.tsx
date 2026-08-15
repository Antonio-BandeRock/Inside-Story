import { Path, Svg } from 'react-native-svg';

// A small, dedicated home for Food-tab builder icons -- 2026-08-14,
// starting with Dessert Builder. Deliberately NOT added to
// components/DigestConditionIcons.tsx: that file's own header comment
// scopes it explicitly to "19 real, custom vector icons, one per
// condition," and Dessert Builder isn't a Purple Digest condition at all --
// it's one of the Food tab's own twelve builders. Same real technical
// conventions as that file's own hand-drawn fallback icons throughout
// (viewBox="0 0 100 100", a single `color` prop, no `transform` anywhere --
// see DigestConditionIcons.tsx's own header comment for why that
// specifically is avoided on this renderer -- and a real `fillRule="evenodd"`
// cutout for any detail that needs to read as a distinct shape sitting on
// top of an already-solid-color fill, rather than a same-color line that
// would simply vanish).
//
// No reference photo exists for this one, unlike every icon in
// DigestConditionIcons.tsx or the garden/animal TabHub icon sets (all
// cropped from real images the app's own creator supplied) -- this is a
// real, hand-drawn first attempt, reasoned through as coordinates rather
// than traced from a photo, the same honest starting point this whole
// icon system's own 19 condition icons had before real reference art
// replaced them. Worth a real look once actually seen on a device or a
// future reference image, not assumed final.
type IconProps = { size: number; color: string };

// A plain trapezoid liner (wider at the top, the way a real cupcake paper
// flares outward) topped by a single, soft dome standing in for a
// swirl of frosting -- kept deliberately simple rather than a fussier,
// multi-tier swirl: this renders at roughly 30-40px in the grid, small
// enough that extra ridge/pleat detail wouldn't actually be legible, so a
// clean, strong silhouette was chosen over literal texture. The cherry on
// top is a real cutout (fillRule="evenodd", combined into the dome's own
// path rather than drawn as a second same-color shape on top of it, which
// would simply vanish) -- offset slightly left of center so it doesn't
// read as a plain bullseye.
const DESSERT_LINER = 'M30,88 L70,88 L82,60 L18,60 Z';
const DESSERT_DOME_WITH_CHERRY_CUTOUT =
  'M18,61 C15,36 28,13 50,15 C72,13 85,36 82,61 Z M51,27 A7,7 0 1,0 37,27 A7,7 0 1,0 51,27 Z';

export function DessertBuilderIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={DESSERT_LINER} fill={color} />
      <Path d={DESSERT_DOME_WITH_CHERRY_CUTOUT} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
