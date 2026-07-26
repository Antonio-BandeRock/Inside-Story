import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useNow } from '../hooks/useNow';
import { getMoonPhaseFraction, getSkyTint, getSunMoonPosition } from '../lib/skyClock';

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
// of a drawn circle -- rendered at this radius, with some extra room
// (MOON_IMAGE_BOX_SCALE) around it since the source image has a bit of
// transparent margin around the disc itself, not a perfect edge-to-edge
// crop.
const MOON_DISC_RADIUS = 16;
const MOON_IMAGE_BOX_SCALE = 1.15;
const MOON_GLOW_RADIUS = 30;
const MOON_GLOW_COLOR = 'rgba(246, 239, 221, 0.4)';
// The phase shadow is a dark navy rather than pure black, so the unlit
// portion still reads as "the same sphere, in shadow" against the night
// sky instead of turning into a flat black bite taken out of the photo.
const MOON_SHADOW_COLOR = '#0B0F1A';
const MOON_SHADOW_OPACITY = 0.86;

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
  const topY = skyBandHeight * 0.2;
  const baseY = skyBandHeight * 0.9;
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
        <MoonDisc cx={point.x} cy={point.y} phaseFraction={getMoonPhaseFraction(now)} />
      )}
    </View>
  );
}

// A real photo (Image), not SVG shapes -- can't nest inside the Svg the
// sun uses above, so this is its own absolutely-positioned layer instead.
// The glow sits behind it (plain translucent circle via a small Svg), the
// phase shadow sits on top of it (a dark circle, offset horizontally by
// phase, clipped to the moon's own circular silhouette via ClipPath) --
// same offset-circle technique as before, just now shadowing a real image
// instead of a flat color, and there's no arc-sweep-direction ambiguity
// to get backwards since it's built from plain circle overlap, not a
// hand-drawn terminator curve.
function MoonDisc({ cx, cy, phaseFraction }: { cx: number; cy: number; phaseFraction: number }) {
  const boxSize = MOON_DISC_RADIUS * 2 * MOON_IMAGE_BOX_SCALE;
  // offsetMagnitude: 0 at new moon (fully overlapping -> fully dark) up to
  // 2x the radius at full moon (fully separated -> fully lit), following
  // R*(1 - cos(2pi*phase)). Sign flips at phase 0.5 so the shadow visibly
  // approaches from one side while waxing and recedes from the other
  // while waning, rather than retracing the same path both ways.
  const offsetMagnitude = MOON_DISC_RADIUS * (1 - Math.cos(2 * Math.PI * phaseFraction));
  const shadowOffsetX = phaseFraction <= 0.5 ? -offsetMagnitude : offsetMagnitude;
  const clipId = 'moonShadowClip';

  return (
    <View
      style={{
        position: 'absolute',
        left: cx - boxSize / 2,
        top: cy - boxSize / 2,
        width: boxSize,
        height: boxSize,
      }}
    >
      <Svg width={boxSize} height={boxSize} style={StyleSheet.absoluteFillObject}>
        <Circle cx={boxSize / 2} cy={boxSize / 2} r={MOON_GLOW_RADIUS} fill={MOON_GLOW_COLOR} />
      </Svg>

      <Image
        source={require('../assets/sky/moon.png')}
        style={{ width: boxSize, height: boxSize }}
        contentFit="contain"
      />

      <Svg width={boxSize} height={boxSize} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={boxSize / 2} cy={boxSize / 2} r={MOON_DISC_RADIUS} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Circle
            cx={boxSize / 2 + shadowOffsetX}
            cy={boxSize / 2}
            r={MOON_DISC_RADIUS}
            fill={MOON_SHADOW_COLOR}
            opacity={MOON_SHADOW_OPACITY}
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
  disc: { position: 'absolute', top: 0, left: 0 },
  tint: { position: 'absolute', top: 0, left: 0 },
});
