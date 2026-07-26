import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Image as SvgImage } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useNow } from '../hooks/useNow';
import { getMoonDistanceScale, getMoonPhaseFraction, getSkyTint, getSunMoonPosition } from '../lib/skyClock';

// Home-only (see ScreenBackground.tsx's `sky` prop) -- the wildflower-field
// background is the one image in the app with real open sky in it (the
// other six tabs are close-up tabletop photos), so this is deliberately
// not shared/reused elsewhere. Everything here is computed fresh from the
// real clock every render (via useNow), not simulated/sped-up.

// How much of the image's own height, from the top, actually shows open
// sky above the hills -- eyeballed against the real asset
// (assets/backgrounds/App_Background_Image.png). The sun/moon stay
// confined to this band; the time-of-day tint below covers the full image.
const SKY_BAND_HEIGHT_FRACTION = 0.17;

const DISC_RADIUS = 10;
const SUN_GLOW_RADIUS = 20;

// A real lunar photo (assets/sky/moon.png, transparent background) instead
// of a drawn circle.
const MOON_DISC_RADIUS = 16;
const MOON_IMAGE_BOX_SCALE = 1.15;
// A dark navy rather than pure black -- the unlit portion should read as
// "the same sphere, in shadow" rather than a flat black bite taken out of
// the photo.
const MOON_SHADOW_COLOR = '#0B0F1A';
const MOON_SHADOW_OPACITY = 0.88;

// Same quadratic-bezier "rise and fall" arc DayArc.tsx uses for its own
// time-of-day positioning, just re-derived here for the sky band's own
// (much shorter) height rather than DayArc's fixed pixel constants.
function pointOnArc(t: number, width: number, topY: number, baseY: number) {
  const x = 2 * (1 - t) * t * (width / 2) + t * t * width;
  const y = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * topY + t * t * baseY;
  return { x, y };
}

export function AnimatedSky({ width, height }: { width: number; height: number }) {
  const now = useNow(60_000);
  const { t, isDaytime } = getSunMoonPosition(now);
  const tint = getSkyTint(now);
  const skyBandHeight = height * SKY_BAND_HEIGHT_FRACTION;
  // Uses nearly the whole available band -- rise/set close to its bottom
  // edge, peak close to its top -- rather than a narrow slice of it, since
  // there's so little vertical room to work with in the first place.
  const topY = skyBandHeight * 0.08;
  const baseY = skyBandHeight * 0.95;
  const point = pointOnArc(t, width, topY, baseY);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Darkens/warms the whole image (not just the sky band) toward
          night/dawn/dusk -- real fading light dims the whole scene, not
          just the sky itself. Rendered BEFORE the sun/moon below, not
          after -- later siblings paint on top, so a dark tint rendered
          after the disc would sit over it and wash it out (this is what
          was making the moon barely visible: the ~0.75-0.8 opacity night
          tint was painting directly over it). The disc needs to stay on
          top of the tint, always fully visible regardless of how dark the
          sky itself gets. */}
      <View style={[styles.tint, { width, height, backgroundColor: tint.color, opacity: tint.opacity }]} />

      {isDaytime ? (
        <Svg width={width} height={Math.max(skyBandHeight, SUN_GLOW_RADIUS * 2)} style={styles.disc}>
          <Circle cx={point.x} cy={point.y} r={SUN_GLOW_RADIUS} fill={colors.accentTint} opacity={0.6} />
          <Circle cx={point.x} cy={point.y} r={DISC_RADIUS} fill={colors.accent} />
        </Svg>
      ) : (
        // *1.1 headroom on the canvas height -- getMoonDistanceScale can
        // push the rendered disc a bit past MOON_DISC_RADIUS at perigee,
        // and the Svg canvas would otherwise clip it right at the edge.
        <Svg width={width} height={Math.max(skyBandHeight, MOON_DISC_RADIUS * 2 * MOON_IMAGE_BOX_SCALE * 1.1)} style={styles.disc}>
          <MoonDisc cx={point.x} cy={point.y} phaseFraction={getMoonPhaseFraction(now)} distanceScale={getMoonDistanceScale(now)} />
        </Svg>
      )}
    </View>
  );
}

// The image and its phase shadow both live inside the SAME Svg as
// everything else here (not a separate expo-image layered between two
// independent Svg overlays, which is what produced the grey-square/
// black-spot rendering bug before) -- react-native-svg's own Image
// element takes the same require() source RN's Image does, so there's no
// need to cross between two different rendering systems at all.
function MoonDisc({
  cx,
  cy,
  phaseFraction,
  distanceScale,
}: {
  cx: number;
  cy: number;
  phaseFraction: number;
  // ~1.07 at perigee (closer -> bigger), ~0.94 at apogee (farther ->
  // smaller) -- see lib/skyClock.ts's getMoonDistanceScale. Applied to the
  // disc/image/shadow together so the whole moon scales as one piece, not
  // just the texture or just the shadow.
  distanceScale: number;
}) {
  const radius = MOON_DISC_RADIUS * distanceScale;
  const boxSize = radius * 2 * MOON_IMAGE_BOX_SCALE;
  // offsetMagnitude: 0 at new moon (fully overlapping -> fully dark) up to
  // 2x the radius at full moon (fully separated -> fully lit), following
  // R*(1 - cos(2pi*phase)). Sign flips at phase 0.5 so the shadow visibly
  // approaches from one side while waxing and recedes from the other
  // while waning, rather than retracing the same path both ways. This is
  // plain circle-overlap geometry, not a hand-drawn terminator arc, so
  // there's no sweep-direction sign to get backwards.
  const offsetMagnitude = radius * (1 - Math.cos(2 * Math.PI * phaseFraction));
  const shadowOffsetX = phaseFraction <= 0.5 ? -offsetMagnitude : offsetMagnitude;

  return (
    <>
      <Defs>
        {/* Clipped strictly to the moon's own circular boundary -- the
            shadow can never shade anything outside the disc itself. */}
        <ClipPath id="moonClip">
          <Circle cx={cx} cy={cy} r={radius} />
        </ClipPath>
      </Defs>
      <SvgImage
        href={require('../assets/sky/moon.png')}
        x={cx - boxSize / 2}
        y={cy - boxSize / 2}
        width={boxSize}
        height={boxSize}
        preserveAspectRatio="xMidYMid meet"
      />
      <G clipPath="url(#moonClip)">
        <Circle cx={cx + shadowOffsetX} cy={cy} r={radius} fill={MOON_SHADOW_COLOR} opacity={MOON_SHADOW_OPACITY} />
      </G>
    </>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
  disc: { position: 'absolute', top: 0, left: 0 },
  tint: { position: 'absolute', top: 0, left: 0 },
});
