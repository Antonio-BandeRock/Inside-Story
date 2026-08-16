import Svg, { Text as SvgText } from 'react-native-svg';

// A small, dedicated home for Food-tab builder icons. Dessert Builder,
// 2026-08-14, started here as a real, hand-drawn cupcake (a flared liner
// topped by a frosting dome with a cherry cutout, reasoned through as
// coordinates rather than traced from a photo, no reference image existing
// for it at the time) -- but on a real device that exact silhouette (narrow
// bottom, flared middle, a round dome on top) read as an ice cream cone
// instead of a cupcake, confirmed directly rather than assumed once
// reported, 2026-08-16.
//
// Rather than guess at a second hand-drawn shape, switched to the real
// thing: Ionicons already ships a genuine, professionally-designed
// "ice-cream" glyph (confirmed directly against node_modules/@expo/vector-
// icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json),
// rendered here as real SVG text -- the identical fontFamily="ionicons"/
// codepoint technique components/TabHub.tsx's own IridescentGlyphIcon
// already established for exactly this "need a real Ionicons glyph
// somewhere a plain <Ionicons/> component can't reach" problem (there,
// gradient-filled for Home/Info's own iridescent treatment; here, a flat
// single color, since this same renderer also has to work inside TabHub's
// own shadow-stacking trick, which paints several tinted copies of
// whatever this returns).
//
// 62344, not 62345 -- the SOLID "ice-cream" codepoint, not
// "ice-cream-outline" -- matching every other icon TabHub's own floating
// button ever renders (the raster condition/animal/garden art, its own
// "home"/"information-circle" glyphs): all solid-filled silhouettes, never
// an outline style. The Food tab's own LensHub grid tile for this builder
// uses the outline variant instead (icon: 'ice-cream-outline' in
// app/(tabs)/food.tsx's own FOOD_LENSES), matching every other Food-tab
// lens tile's own outline convention -- that one renders through the
// plain, default Ionicons path, no custom renderer needed for it at all.
const ICE_CREAM_GLYPH_CODEPOINT = 62344;

type IconProps = { size: number; color: string };

export function DessertBuilderIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size}>
      <SvgText
        x={size / 2}
        y={size / 2}
        fontFamily="ionicons"
        fontSize={size}
        fill={color}
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {String.fromCodePoint(ICE_CREAM_GLYPH_CODEPOINT)}
      </SvgText>
    </Svg>
  );
}
