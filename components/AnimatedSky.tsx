import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Image as SvgImage } from 'react-native-svg';
import { useNow } from '../hooks/useNow';
import {
  equatorialToHorizontal,
  localSiderealTimeDegrees,
  planetEquatorial,
  PUERTO_VALLARTA_LAT,
  PUERTO_VALLARTA_LON,
  type PlanetName,
} from '../lib/astronomy';
import {
  getMoonDistanceScale,
  getMoonHorizonWarmth,
  getMoonPhaseFraction,
  getSkyTint,
  getStarOpacity,
  getSunMoonPosition,
} from '../lib/skyClock';
import { CONSTELLATIONS } from '../lib/starCatalog';

// Home-only (see ScreenBackground.tsx's `sky` prop) -- the wildflower-field
// background is the one image in the app with real open sky in it (the
// other six tabs are close-up tabletop photos), so this is deliberately
// not shared/reused elsewhere. Everything here is computed fresh from the
// real clock every render (via useNow), not simulated/sped-up.

// How much of the image's own height, from the top, actually shows open
// sky above the hills -- also the exact height horizonClip below cuts the
// sun/moon disc off at, so this is the one number standing between "the
// moon stays fully behind the hills" and "it visibly dips in front of
// them by a few pixels."
//
// 2026-08-02, corrected: the previous value (0.15) came from sampling only
// three vertical strips (25%/50%/75% across), which found a transition
// around y=185-210 and looked like a single flat horizon line. It isn't
// one -- the real photo is a V-shaped valley (hills rising on both sides,
// dipping to open sky in the center), confirmed by actually decoding the
// PNG's own pixel data (assets/backgrounds/App_Background_Image.png,
// 896x1200) and sampling all 448 even-numbered columns across its full
// width for the real sky-to-hill transition (hill rows detected by a
// clearly warm cast, red notably exceeding blue -- a signal clouds don't
// trigger even at full brightness, unlike a simpler
// blue-vs-red-brightness check, which was tried first and produced false
// transitions right at cloud edges). The true hill line ranges from
// fraction ~0.128 at the image's left/right edges (its highest point --
// missed entirely by the old 3-strip sample, which never looked past
// 75%) down to ~0.173 at the center valley floor. The old 0.15 sat BELOW
// the true edge value (0.128), meaning the moon could render in the real
// gap between 0.128 and 0.15 -- exactly the "coming up in front of the
// hills" bug reported, specifically whenever the moon's stylized
// horizontal position was out near the left or right edge of its arc,
// not just "a few pixels" at its lowest point. 0.12, just under the
// real measured worst case (0.128), same "clip a hair early rather than
// risk overlapping" discipline as before -- still accounts for
// contentFit: 'cover' cropping a different slice of the source per
// device (see this constant's own history) without needing to re-derive
// per-device, since 0.12 already clears the true worst case with margin.
const SKY_BAND_HEIGHT_FRACTION = 0.12;

const DISC_RADIUS = 10;

// Explicitly requested, 2026-07-27: replaces an earlier random, fixed-seed
// starfield with real stars, at their real positions for Puerto Vallarta's
// real latitude/longitude, right now -- see lib/astronomy.ts for the
// coordinate math and lib/starCatalog.ts for the actual star/constellation
// data. The sun/moon above stay stylized (see getSunMoonPosition's own
// comment in lib/skyClock.ts for why -- a real rise-to-set arc, not a
// literal position) -- only the starfield was asked to become genuinely
// real, a deliberate, known inconsistency between "this part of the sky is
// real, that part is stylized," accepted as the scope of this request.

// Anything below this altitude doesn't render -- partly the same
// imprecise-horizon-boundary safety margin the sun/moon arc's own baseY
// needed (SKY_BAND_HEIGHT_FRACTION is a measured estimate, not exact), and
// partly realistic: real stars within a couple degrees of the horizon are
// washed out by atmospheric haze and aren't actually visible either.
const MIN_VISIBLE_ALTITUDE_DEG = 2;
// Altitude-to-y mapping -- 90° (straight up) lands near the sky band's own
// top, MIN_VISIBLE_ALTITUDE_DEG (near the horizon) lands short of its
// bottom edge, matching the same 0.82 safety margin the sun/moon arc's own
// baseY uses for exactly the same reason.
const STAR_BAND_TOP_FRACTION = 0.05;
const STAR_BAND_BOTTOM_FRACTION = 0.82;

function altitudeToYFraction(altitudeDeg: number): number {
  const clamped = Math.max(MIN_VISIBLE_ALTITUDE_DEG, Math.min(90, altitudeDeg));
  const t = (clamped - MIN_VISIBLE_ALTITUDE_DEG) / (90 - MIN_VISIBLE_ALTITUDE_DEG);
  return STAR_BAND_BOTTOM_FRACTION - t * (STAR_BAND_BOTTOM_FRACTION - STAR_BAND_TOP_FRACTION);
}

// Azimuth (0-360°, the full circle around the horizon) maps directly to x
// across the sky band's own width -- effectively a horizon-to-horizon
// panorama compressed into one flat strip, the same convention many
// horizon-view star charts use. It's not a literal "looking in one
// direction" window (this app has no compass/orientation input to know
// which way the phone is actually facing), but a genuine, honest way to
// show "everything currently above the horizon" in a single wide image.
function azimuthToXFraction(azimuthDeg: number): number {
  return azimuthDeg / 360;
}

type ProjectedPoint = { x: number; y: number; visible: boolean };

function project(altitudeDeg: number, azimuthDeg: number, width: number, skyBandHeight: number): ProjectedPoint {
  if (altitudeDeg < MIN_VISIBLE_ALTITUDE_DEG) return { x: 0, y: 0, visible: false };
  return { x: azimuthToXFraction(azimuthDeg) * width, y: altitudeToYFraction(altitudeDeg) * skyBandHeight, visible: true };
}

// Brighter (lower-magnitude) stars render bigger and more opaque -- the
// same visual language real star charts use for magnitude. Range tuned
// against this catalog's actual span (roughly -0.1 to 3.9), not an
// arbitrary scale.
function starVisual(magnitude: number): { radius: number; opacity: number } {
  const radius = Math.max(0.6, Math.min(2.4, 2.4 - magnitude * 0.5));
  const opacity = Math.max(0.45, Math.min(1, 1.15 - magnitude * 0.15));
  return { radius, opacity };
}

const PLANET_COLORS: Record<PlanetName, string> = {
  mercury: '#B8B8B8',
  venus: '#F5E9C8',
  mars: '#E2725B',
  jupiter: '#E0C9A6',
  saturn: '#E8D8A0',
};
const VISIBLE_PLANETS: readonly PlanetName[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// Renders behind the sun/moon (see render order in AnimatedSky below), and
// fades in/out via `opacity` -- driven by lib/skyClock.ts's getStarOpacity,
// which reuses the existing day/night tint curve so the sky appears
// gradually as it darkens rather than switching on abruptly at a fixed
// hour. Recomputes every real star/planet's current alt/az fresh each
// render (useNow ticks this every 60s) -- cheap (a few dozen objects, plain
// trig), no memoization needed.
function RealSky({ width, skyBandHeight, opacity, now }: { width: number; skyBandHeight: number; opacity: number; now: Date }) {
  if (opacity <= 0) return null;

  const lst = localSiderealTimeDegrees(now, PUERTO_VALLARTA_LON);

  return (
    <Svg width={width} height={skyBandHeight} style={[styles.disc, { opacity }]}>
      {CONSTELLATIONS.map((constellation) => {
        const positions = constellation.stars.map((star) => {
          const horizontal = equatorialToHorizontal(star.raDeg, star.decDeg, PUERTO_VALLARTA_LAT, lst);
          return project(horizontal.altitude, horizontal.azimuth, width, skyBandHeight);
        });

        return (
          <G key={constellation.name}>
            {/* Only drawn between two currently-visible stars, and skipped
                if they land implausibly far apart in x -- a real sign of
                the 360°/0° azimuth wraparound (see azimuthToXFraction's
                own comment), not an actual wide gap; a constellation this
                catalog includes never really spans anywhere near half the
                sky. */}
            {constellation.lines.map(([fromIndex, toIndex], lineIndex) => {
              const from = positions[fromIndex];
              const to = positions[toIndex];
              if (!from.visible || !to.visible) return null;
              if (Math.abs(to.x - from.x) > width * 0.5) return null;
              return (
                <Line
                  key={lineIndex}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  strokeOpacity={0.35}
                />
              );
            })}
            {constellation.stars.map((star, index) => {
              const point = positions[index];
              if (!point.visible) return null;
              const visual = starVisual(star.magnitude);
              return <Circle key={star.name} cx={point.x} cy={point.y} r={visual.radius} fill="#FFFFFF" opacity={visual.opacity} />;
            })}
          </G>
        );
      })}

      {VISIBLE_PLANETS.map((planet) => {
        const equatorial = planetEquatorial(planet, now);
        const horizontal = equatorialToHorizontal(equatorial.raDeg, equatorial.decDeg, PUERTO_VALLARTA_LAT, lst);
        const point = project(horizontal.altitude, horizontal.azimuth, width, skyBandHeight);
        if (!point.visible) return null;
        return <Circle key={planet} cx={point.x} cy={point.y} r={2.6} fill={PLANET_COLORS[planet]} opacity={0.95} />;
      })}
    </Svg>
  );
}

// A real lunar photo (assets/sky/moon.png, transparent background) instead
// of a drawn circle. `radius` (MOON_DISC_RADIUS) below is the visible
// disc's own intended rendered radius -- everything about how big the box
// needs to be is derived from that plus the two measurements below, not
// guessed.
//
// 2026-08-13, real, on-device memory evidence (adb dumpsys meminfo, taken
// while investigating an unrelated freeze) found this app's own graphics
// memory footprint unusually large -- moon.png was the single biggest
// individual cause found: a 2000x2000 source file, decoding to a real
// ~15.3MB uncompressed bitmap, for a disc whose own real on-screen box
// (radius*2 / MOON_DISC_DIAMETER_FRACTION, with radius maxing out around
// 30-45px even at the largest real distanceScale this file computes) never
// exceeds roughly 90-135px. Resized to 480x480 -- a real, generous ~4-5x
// safety margin over that real max, the same precedent already applied to
// every other oversized image asset in this app -- cutting its own decoded
// size to well under 1MB. sun.png (452x474, ~0.82MB decoded, real on-screen
// box maxing out around 60-70px) got the same treatment, resized to
// 300x315. Neither fix alone fully explains this app's own much larger
// total memory footprint (a real, separate, ongoing investigation), but
// both were genuine, verified, one-directional wins regardless.
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

// A real photo of the sun (assets/sky/sun.png) in place of the old flat
// SVG circle, 2026-07-26 -- same idea as the moon photo above. Unlike
// moon.png, this source photo isn't pre-cropped to a transparent disc: it's
// a 452x474 photo of the sun against black space, with a stray solar-flare
// plume (visible upper-left) extending past the round disc itself. Rather
// than pre-editing the PNG, the disc is cropped live by rendering the whole
// photo oversized and clipping it to a circle sized/positioned to land
// exactly on the disc's own edge (measured directly against the photo's
// pixel data, same as the moon's own measurements) -- the black space and
// the flare both simply fall outside the clip circle and are never drawn.
const SUN_IMAGE_WIDTH = 452;
const SUN_IMAGE_HEIGHT = 474;
// A first pass at this measured the disc's bounding box (brightest pixels'
// min/max x and y), which seemed reasonable but rendered with a visible
// dark ring around the disc on-device -- the bounding-box approach was
// fooled by the flare (visible lower-left in the source photo), which
// pushed that box wider/taller than the disc's own true round edge, so the
// resulting "circle" was bigger than the actual disc and included a sliver
// of real dark space inside the clip. Re-measured properly with a radial
// scan instead: from the disc's true centroid (found via a stricter
// brightness threshold that excludes the dimmer flare/corona), the
// distance to "still bright" pixels was cast in 36 directions and ranged
// from ~153px (the tight side) to ~191px (the flare-influenced side) --
// using the *minimum* (with a few px of safety margin) as the crop radius
// guarantees the clip stays inside real disc on every side, at the cost of
// cropping a little tighter than the disc's own flare-widened edge on that
// one side (a non-issue -- a sun photo reads fine slightly smaller, not
// fine with a dark ring around it).
const SUN_DISC_DIAMETER_FRACTION = (150 * 2) / SUN_IMAGE_WIDTH;
// The disc's true centroid (not the flare-skewed bounding-box center from
// the first pass), as a fraction of the source photo's width/height.
const SUN_DISC_CENTER_X_FRACTION = 229.3 / SUN_IMAGE_WIDTH;
const SUN_DISC_CENTER_Y_FRACTION = 250.85 / SUN_IMAGE_HEIGHT;

// Same quadratic-bezier "rise and fall" arc DayArc.tsx uses for its own
// time-of-day positioning, just re-derived here for the sky band's own
// (much shorter) height rather than DayArc's fixed pixel constants.
function pointOnArc(t: number, width: number, topY: number, baseY: number) {
  const x = 2 * (1 - t) * t * (width / 2) + t * t * width;
  const y = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * topY + t * t * baseY;
  return { x, y };
}

// How far past the sky band's own bottom edge (where the image's hills
// begin -- see SKY_BAND_HEIGHT_FRACTION) the disc sits when fully hidden.
// horizonClip below only ever shows what's above the band's bottom edge,
// so once a disc's position is at least its own radius past that edge,
// it's fully hidden rather than just low in the sky. Sized to comfortably
// clear the larger of the two discs (the moon, up to ~1.07x
// MOON_DISC_RADIUS at perigee) with a few px to spare.
//
// Deliberately NOT expressed as part of the main arc's own topY/baseY (an
// earlier pass did exactly that, extending baseY this far past the sky
// band and letting the arc's own t carry the disc in and out of hiding) --
// a 14-hour day arc moves slowly near its own t=0/1 edges, so even this
// modest a dip worked out to a genuine ~30+ real-minute transition once
// tied to `t`, long enough that the sun could still be sinking after the
// stylized 8pm day/night boundary while the moon hadn't started rising
// yet -- a real empty-sky gap, confirmed on-device. horizonProgress
// (lib/skyClock.ts) exists specifically to drive this dip on its own
// short, fixed real-minutes schedule instead, independent of the arc.
const HORIZON_DIP_MARGIN = 20;

export function AnimatedSky({ width, height }: { width: number; height: number }) {
  const now = useNow(60_000);
  const { t, isDaytime, horizonProgress } = getSunMoonPosition(now);
  const tint = getSkyTint(now);
  const skyBandHeight = height * SKY_BAND_HEIGHT_FRACTION;
  // The arc's own shape stays entirely within the visible band -- topY
  // near its very top at solar noon, baseY well short of its bottom edge
  // at rise/set (not right up against it) -- so `arcPoint` alone is always
  // a fully visible position, on-screen the whole day/night through.
  // baseY explicitly pulled up from 0.95 to 0.82: SKY_BAND_HEIGHT_FRACTION
  // is a measured but still imprecise estimate of where the real hills
  // start (see that constant's own comment for why it can't be exact), and
  // 0.95 left almost no margin for that imprecision -- reported as the sun
  // visibly overlapping the hills rather than staying above them. This
  // trades a bit of "how close to the horizon the resting arc gets" for
  // headroom against that measurement uncertainty; the deliberate dip
  // BELOW this line still only happens within horizonProgress's own short
  // window right at rise/set, unaffected by this change.
  const topY = skyBandHeight * 0.05;
  const baseY = skyBandHeight * 0.82;
  const arcPoint = pointOnArc(t, width, topY, baseY);
  // Blends from fully hidden (horizonProgress 0, right at the moment of
  // rise/set) to the arc's own normal position (horizonProgress 1, once
  // HORIZON_TRANSITION_MINUTES past it) -- see horizonProgress's own
  // comment for why this needs to be a separate blend from the arc above,
  // not folded into it.
  const hiddenY = skyBandHeight + HORIZON_DIP_MARGIN;
  const point = { x: arcPoint.x, y: hiddenY + (arcPoint.y - hiddenY) * horizonProgress };

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

      <RealSky width={width} skyBandHeight={skyBandHeight} opacity={getStarOpacity(now)} now={now} />

      {/* Clips to exactly the sky band's own height -- anything the disc
          below draws past this line (which happens right around rise/set,
          see the horizonProgress blend above) is cut off rather than drawn
          over the hills, reading as the sun/moon passing behind the
          horizon rather than just getting low and then abruptly swapping
          to the other body. The swap between sun and moon (isDaytime)
          still happens at the same instant either way, but both bodies
          are already at/near fully hidden right around that moment (each
          one's own horizonProgress is 0 exactly at its own rise/set),
          so the handoff reads as one sinking out of sight while the other
          is just starting to rise, not one visibly present when the other
          pops in. */}
      <View style={[styles.horizonClip, { width, height: skyBandHeight }]}>
        {isDaytime ? (
          <SunDisc cx={point.x} cy={point.y} />
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
    </View>
  );
}

// Renders the whole sun.png photo oversized, positioned so its own bright
// disc lands centered inside a `radius`-sized circular clip window -- see
// the SUN_DISC_* constants above for where the crop math comes from. No
// phase/shadow overlay needed here (unlike MoonDisc below), so this is
// just the clipped photo on its own.
function SunDisc({ cx, cy }: { cx: number; cy: number }) {
  const radius = DISC_RADIUS;
  // The full photo, scaled up so its own disc (391.5px of the 452px-wide
  // source) renders at exactly `radius * 2` -- everything else (boxHeight,
  // both local offsets) derives from this one scale-up.
  const boxWidth = (radius * 2) / SUN_DISC_DIAMETER_FRACTION;
  const boxHeight = boxWidth * (SUN_IMAGE_HEIGHT / SUN_IMAGE_WIDTH);
  // The clip window's own top-left sits at (cx - radius, cy - radius) in
  // absolute terms, so the photo's position below is expressed relative to
  // that -- i.e. "radius, minus how far into the scaled photo its own disc
  // center sits" places that disc center exactly in the clip window's
  // middle.
  const imageLeft = radius - boxWidth * SUN_DISC_CENTER_X_FRACTION;
  const imageTop = radius - boxHeight * SUN_DISC_CENTER_Y_FRACTION;

  return (
    <View
      style={{
        position: 'absolute',
        left: cx - radius,
        top: cy - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        overflow: 'hidden',
      }}
    >
      <Image
        source={require('../assets/sky/sun.png')}
        style={{ position: 'absolute', left: imageLeft, top: imageTop, width: boxWidth, height: boxHeight }}
      />
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
  // overflow: 'hidden' is what actually clips the sun/moon disc below this
  // -- see the comment where this is rendered.
  horizonClip: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
});
