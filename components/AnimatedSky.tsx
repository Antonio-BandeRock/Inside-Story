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
const MOON_LIGHT_COLOR = '#EDEFF7';
// Shadow uses the app's own dark navy -- a phase's unlit portion reads as
// blending into the night sky rather than being a separate "shadow" color.
const MOON_SHADOW_COLOR = colors.background;

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
      <Svg width={width} height={Math.max(skyBandHeight, SUN_GLOW_RADIUS * 2)} style={styles.disc}>
        {isDaytime ? (
          <>
            <Circle cx={point.x} cy={point.y} r={SUN_GLOW_RADIUS} fill={colors.accentTint} opacity={0.6} />
            <Circle cx={point.x} cy={point.y} r={DISC_RADIUS} fill={colors.accent} />
          </>
        ) : (
          <MoonDisc cx={point.x} cy={point.y} phaseFraction={getMoonPhaseFraction(now)} />
        )}
      </Svg>

      {/* Darkens/warms the whole image (not just the sky band) toward
          night/dawn/dusk -- real fading light dims the whole scene, not
          just the sky itself. */}
      <View style={[styles.tint, { width, height, backgroundColor: tint.color, opacity: tint.opacity }]} />
    </View>
  );
}

function MoonDisc({ cx, cy, phaseFraction }: { cx: number; cy: number; phaseFraction: number }) {
  // Two same-size circles (light base + dark "shadow"), clipped to the
  // moon's own circular silhouette -- the shadow circle's horizontal
  // offset from the light circle's center is what actually draws the
  // crescent/gibbous shape, not a hand-drawn terminator curve, so there's
  // no arc-sweep-direction ambiguity to get backwards.
  //
  // offsetMagnitude: 0 at new/new (fully overlapping -> fully dark) up to
  // 2x the radius at full moon (fully separated -> fully lit), following
  // R*(1 - cos(2pi*phase)). Sign flips at phase 0.5 so the shadow visibly
  // approaches from one side while waxing and recedes from the other
  // while waning, rather than retracing the same path both ways.
  const offsetMagnitude = DISC_RADIUS * (1 - Math.cos(2 * Math.PI * phaseFraction));
  const shadowOffsetX = phaseFraction <= 0.5 ? -offsetMagnitude : offsetMagnitude;
  const clipId = 'moonClip';

  return (
    <>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={cx} cy={cy} r={DISC_RADIUS} />
        </ClipPath>
      </Defs>
      <Circle cx={cx} cy={cy} r={DISC_RADIUS + 4} fill={MOON_LIGHT_COLOR} opacity={0.25} />
      <G clipPath={`url(#${clipId})`}>
        <Circle cx={cx} cy={cy} r={DISC_RADIUS} fill={MOON_LIGHT_COLOR} />
        <Circle cx={cx + shadowOffsetX} cy={cy} r={DISC_RADIUS} fill={MOON_SHADOW_COLOR} />
      </G>
    </>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
  disc: { position: 'absolute', top: 0, left: 0 },
  tint: { position: 'absolute', top: 0, left: 0 },
});
