import { colors } from '../constants/colors';

// Pure computation for Home's dynamic sky (components/AnimatedSky.tsx) --
// no DB/React dependency, same separation nutrientAnalysis.ts/
// sixDimensionsReference.ts already keep for their own screens.

// Stylized, not real geographic sunrise/sunset (that would need location
// permissions -- this app has none anywhere, deliberately, per its
// local-first stance). Same spirit as DayArc's own 6am-10pm "day" window
// assumption, just a slightly narrower day span so there's real night on
// both ends for the moon to actually show up in.
const DAY_START_MINUTES = 6 * 60; // 6:00am
const DAY_END_MINUTES = 20 * 60; // 8:00pm

export type SunMoonPosition = {
  // 0..1 across whichever arc is currently active -- 0 at that arc's
  // start (sunrise for day, sunset for night), 1 at its end.
  t: number;
  isDaytime: boolean;
};

export function getSunMoonPosition(date: Date): SunMoonPosition {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const isDaytime = minutes >= DAY_START_MINUTES && minutes < DAY_END_MINUTES;

  if (isDaytime) {
    const t = (minutes - DAY_START_MINUTES) / (DAY_END_MINUTES - DAY_START_MINUTES);
    return { t, isDaytime: true };
  }

  // Night wraps over midnight (8pm -> next day's 6am), so "minutes since
  // night start" has to handle both sides of that wrap.
  const nightSpanMinutes = 24 * 60 - (DAY_END_MINUTES - DAY_START_MINUTES);
  const minutesSinceNightStart = minutes >= DAY_END_MINUTES ? minutes - DAY_END_MINUTES : minutes + (24 * 60 - DAY_END_MINUTES);
  const t = minutesSinceNightStart / nightSpanMinutes;
  return { t, isDaytime: false };
}

// Real astronomy, unlike the stylized schedule above -- moon phase is a
// deterministic date calculation with no location dependency and nothing
// privacy-sensitive about it, so unlike sun position it's worth actually
// getting right rather than stylizing.
const SYNODIC_MONTH_DAYS = 29.53058867;
// A well-known reference new moon (2000-01-06 18:14 UTC) -- any confirmed
// new-moon timestamp works as the anchor; this is the one most lunar-phase
// approximation code uses.
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);

// 0 = new moon, 0.5 = full moon, wraps back to 0/1 at the next new moon.
// Accurate to within roughly a day, which is all a stylized illustration
// needs -- real lunar calculations that account for orbital eccentricity
// are unnecessary precision here.
export function getMoonPhaseFraction(date: Date): number {
  const daysSince = (date.getTime() - KNOWN_NEW_MOON_UTC) / 86_400_000;
  const phase = ((daysSince % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return phase / SYNODIC_MONTH_DAYS;
}

// The moon's orbit is elliptical, not circular, so its real distance (and
// therefore its apparent size in the sky) actually varies -- about 12-14%
// between perigee (closest) and apogee (farthest), the same swing behind
// "supermoon" reporting and, at the extreme, perigean spring tides. This
// is on the ~27.55-day anomalistic month, a different cycle than the
// synodic (phase) month above -- perigee and full moon don't generally
// coincide, they just happen to occasionally (that's what makes a
// "supermoon" newsworthy).
const ANOMALISTIC_MONTH_DAYS = 27.554549878;
// A real, documented perigee: 2016-11-14 11:23 UTC, ~356,509 km -- the
// closest supermoon in decades at the time, widely reported, so a solid
// anchor. Any confirmed perigee timestamp works the same way
// getMoonPhaseFraction's reference new moon does.
const KNOWN_PERIGEE_UTC = Date.UTC(2016, 10, 14, 11, 23, 0);
const PERIGEE_KM = 356_500;
const APOGEE_KM = 406_700;
const MEAN_DISTANCE_KM = (PERIGEE_KM + APOGEE_KM) / 2;

// A multiplier around 1.0 -- above 1 when the moon is closer than average
// (renders bigger), below 1 when farther (renders smaller). ~1.07 at
// perigee, ~0.94 at apogee -- real apparent-size numbers, not an
// invented range.
export function getMoonDistanceScale(date: Date): number {
  const daysSince = (date.getTime() - KNOWN_PERIGEE_UTC) / 86_400_000;
  const anomalisticPhase = ((daysSince % ANOMALISTIC_MONTH_DAYS) + ANOMALISTIC_MONTH_DAYS) % ANOMALISTIC_MONTH_DAYS;
  const distanceFraction = anomalisticPhase / ANOMALISTIC_MONTH_DAYS; // 0 = perigee, 0.5 = apogee
  const amplitude = (APOGEE_KM - PERIGEE_KM) / 2;
  const distanceKm = MEAN_DISTANCE_KM - amplitude * Math.cos(2 * Math.PI * distanceFraction);
  return MEAN_DISTANCE_KM / distanceKm;
}

export type SkyTint = { color: string; opacity: number };

type TintKeyframe = { hour: number; color: string; opacity: number };

// A dedicated near-black navy for full night -- colors.background (a
// mid-dark navy tuned as a UI surface color) isn't actually dark enough to
// read as convincing nighttime once blended at realistic opacity over a
// bright, sky-blue photo. This is deliberately its own darker constant
// rather than colors.background, specifically for that job.
const DEEP_NIGHT_COLOR = '#080B14';

// Dark at night, brightening through a warm dawn to no tint at midday,
// warming again through dusk back to dark. Ramps to real darkness quickly
// after sunset (by 9-10pm it should already look like night, not still be
// half-transitioning) rather than a slow, barely-there fade -- and night
// opacity is high enough (0.72-0.8) to actually read as dark against a
// bright photo, not just a faint wash. Daytime/dawn/dusk still use
// colors.accent's warm gold, reused from the app's own palette rather than
// inventing a separate tint-only color.
const TINT_KEYFRAMES: readonly TintKeyframe[] = [
  { hour: 0, color: DEEP_NIGHT_COLOR, opacity: 0.8 },
  { hour: 4, color: DEEP_NIGHT_COLOR, opacity: 0.72 },
  { hour: 6, color: colors.accent, opacity: 0.4 },
  { hour: 7.5, color: colors.accent, opacity: 0.15 },
  { hour: 9, color: colors.accent, opacity: 0 },
  { hour: 15, color: colors.accent, opacity: 0 },
  { hour: 17, color: colors.accent, opacity: 0.12 },
  { hour: 18.5, color: colors.accent, opacity: 0.45 },
  { hour: 19.5, color: DEEP_NIGHT_COLOR, opacity: 0.6 },
  { hour: 21, color: DEEP_NIGHT_COLOR, opacity: 0.75 },
  { hour: 24, color: DEEP_NIGHT_COLOR, opacity: 0.8 },
];

function hexToRgbTuple(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

export function getSkyTint(date: Date): SkyTint {
  const fractionalHour = date.getHours() + date.getMinutes() / 60;

  let previous = TINT_KEYFRAMES[0];
  let next = TINT_KEYFRAMES[TINT_KEYFRAMES.length - 1];
  for (let i = 0; i < TINT_KEYFRAMES.length - 1; i++) {
    if (fractionalHour >= TINT_KEYFRAMES[i].hour && fractionalHour <= TINT_KEYFRAMES[i + 1].hour) {
      previous = TINT_KEYFRAMES[i];
      next = TINT_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = next.hour - previous.hour;
  const amount = span === 0 ? 0 : (fractionalHour - previous.hour) / span;

  const [r1, g1, b1] = hexToRgbTuple(previous.color);
  const [r2, g2, b2] = hexToRgbTuple(next.color);
  const r = Math.round(lerp(r1, r2, amount));
  const g = Math.round(lerp(g1, g2, amount));
  const b = Math.round(lerp(b1, b2, amount));
  const opacity = lerp(previous.opacity, next.opacity, amount);

  return { color: `rgb(${r}, ${g}, ${b})`, opacity };
}
