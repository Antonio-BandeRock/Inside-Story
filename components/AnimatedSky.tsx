import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Image as SvgImage } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useNow } from '../hooks/useNow';
import { getMoonDistanceScale, getMoonHorizonWarmth, getMoonPhaseFraction, getSkyTint, getSunMoonPosition } from '../lib/skyClock';

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
// of a drawn circle. `radius` (MOON_DISC_RADIUS) below is the visible
// disc's own intended rendered radius -- everything about how big the box
// needs to be is derived from that plus the two measurements below, not
// guessed.
const MOON_DISC_RADIUS = 16;
// A dark navy rather than pure black -- the unlit portion should read as
// "the same sphere, in shadow" rather than a flat black bite taken out of
// the photo.
const MOON_SHADOW_COLOR = '#0B0F1A';
const MOON_SHADOW_OPACITY = 0.88;
// Real atmospheric scattering warms/reddens a low moon near the horizon
// the same way it reddens sunsets -- an orange-red wash over the whole
// disc, strongest at rise/set and fading to nothing near its peak (see
// lib/skyClock.ts's getMoonHorizonWarmth).
const MOON_HORIZON_TINT_COLOR = '#FF8A50';
const MAX_HORIZON_TINT_OPACITY = 0.4;
// Both measured directly against assets/sky/moon.png's own alpha channel
// (its 2000x2000 canvas has real transparent margin around the disc, and
// that margin isn't even on all sides):
// - the visible disc only fills about 67% of the canvas's width, not
//   nearly edge-to-edge -- the earlier `* 1.15` scale factor assumed ~87%
//   and was sizing the clip/shadow for a disc noticeably bigger than what
//   actually renders, which is what was pushing the shadow away from the
//   real edge.
// - the disc's center sits 15.5px right and 28.5px up from the canvas's
//   own geometric center (out of 2000px).
// Both expressed as fractions of the canvas so they scale correctly at
// any render size.
const MOON_DISC_DIAMETER_FRACTION = 1347 / 2000;
const MOON_DISC_CENTER_OFFSET_X = 15.5 / 2000;
const MOON_DISC_CENTER_OFFSET_Y = -28.5 / 2000;

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
        <MoonDisc
          cx={point.x}
          cy={point.y}
          phaseFraction={getMoonPhaseFraction(now)}
          distanceScale={getMoonDistanceScale(now)}
          horizonWarmth={getMoonHorizonWarmth(t)}
        />
      )}
    </View>
  );
}

// The photo renders in its own tightly-sized Svg; the phase shadow renders
// in a SEPARATE plain View clipped via overflow: 'hidden' + a circular
// borderRadius -- not react-native-svg's own ClipPath, which is what was
// actually causing the earlier bugs (the grey square/black spot, and the
// shadow appearing as a whole separate disc stuck on the side rather than
// being constrained to the moon's own silhouette). Plain View clipping is
// a far more reliably supported cross-platform technique than SVG
// clipPath for this.
function MoonDisc({
  cx,
  cy,
  phaseFraction,
  distanceScale,
  horizonWarmth,
}: {
  cx: number;
  cy: number;
  phaseFraction: number;
  // ~1.07 at perigee (closer -> bigger), ~0.94 at apogee (farther ->
  // smaller) -- see lib/skyClock.ts's getMoonDistanceScale. Applied to the
  // disc/image/shadow together so the whole moon scales as one piece, not
  // just the texture or just the shadow.
  distanceScale: number;
  // 0 at the arc's peak, 1 at rise/set -- see getMoonHorizonWarmth.
  horizonWarmth: number;
}) {
  const radius = MOON_DISC_RADIUS * distanceScale;
  // Sized so the *visible* disc (not the whole padded canvas) ends up at
  // exactly `radius` -- see MOON_DISC_DIAMETER_FRACTION's own comment.
  const boxSize = (radius * 2) / MOON_DISC_DIAMETER_FRACTION;
  // Where the *visible* disc actually sits, not the invisible bounding
  // box's own geometric center -- see MOON_DISC_CENTER_OFFSET_X/Y's own
  // comment for where these numbers come from.
  const discCenterX = cx + boxSize * MOON_DISC_CENTER_OFFSET_X;
  const discCenterY = cy + boxSize * MOON_DISC_CENTER_OFFSET_Y;
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
      <Svg width={boxSize} height={boxSize} style={{ position: 'absolute', left: cx - boxSize / 2, top: cy - boxSize / 2 }}>
        <SvgImage href={require('../assets/sky/moon.png')} x={0} y={0} width={boxSize} height={boxSize} preserveAspectRatio="xMidYMid meet" />
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: discCenterX - radius,
          top: discCenterY - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          overflow: 'hidden',
        }}
      >
        <Svg width={radius * 2} height={radius * 2}>
          <Circle cx={radius + shadowOffsetX} cy={radius} r={radius} fill={MOON_SHADOW_COLOR} opacity={MOON_SHADOW_OPACITY} />
          {/* Full-disc wash, on top of the shadow so it warms the whole
              visible silhouette uniformly (lit and shadowed portions
              alike) -- a low moon looks orange overall, not just on its
              lit crescent. */}
          <Circle cx={radius} cy={radius} r={radius} fill={MOON_HORIZON_TINT_COLOR} opacity={horizonWarmth * MAX_HORIZON_TINT_OPACITY} />
        </Svg>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
  disc: { position: 'absolute', top: 0, left: 0 },
  tint: { position: 'absolute', top: 0, left: 0 },
});
