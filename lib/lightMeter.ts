// The light meter (I3, 1.0.55.17). An Android phone has a light sensor at
// the top of its screen, which apps can read through expo-sensors'
// LightSensor, so the figure a person would otherwise read off a lux meter
// can be taken with the phone they are holding and saved as a Growing
// Conditions reading like any other, marked as coming from this phone.
//
// Three honest limits shape everything below:
//   - A phone's sensor is not a calibrated meter. Two phones can read the
//     same spot differently, so the useful comparison is this phone against
//     itself: this windowsill against that one, this month against last.
//   - Lux is light as an eye sees it, not the light a leaf uses (PPFD), so a
//     grow light and the sun can read the same lux and feed a plant very
//     differently. Lux and PPFD stay on separate lines, the rule
//     lib/growingConditions.ts already keeps.
//   - An iPhone never lets an app read its light sensor, and a computer has
//     none, so on both the meter says so and the figure is typed in.
//
// A few seconds of samples are taken and the middle one kept, since a hand
// moving or a cloud passing throws single samples about. The level is
// described by what else reads about the same (indoor lamps, an overcast
// day, direct sun), never by whether it is enough, because what is enough
// depends on the plant and the crop guides are where that lives.
//
// Pure, with no React and no sensor in it, so scripts/test_light_meter.js
// checks it without a phone.

/** How long the meter listens, and how often it asks the sensor. */
export const LIGHT_METER_LISTEN_MS = 3000;
export const LIGHT_METER_INTERVAL_MS = 200;

/** Shown beside a saved reading as where it came from. */
export const LIGHT_METER_DEVICE_NAME = "this phone's light sensor";

export type LightSampleSummary = {
  /** The middle sample, rounded to a whole lux. */
  lux: number;
  low: number;
  high: number;
  samples: number;
};

/** The middle of the samples taken, or null when the sensor sent nothing. */
export function summarizeLightSamples(samples: readonly number[]): LightSampleSummary | null {
  const clean = samples.filter((sample) => Number.isFinite(sample) && sample >= 0).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const mid = Math.floor(clean.length / 2);
  const median = clean.length % 2 === 1 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
  return {
    lux: Math.round(median),
    low: Math.round(clean[0]),
    high: Math.round(clean[clean.length - 1]),
    samples: clean.length,
  };
}

/** A lux figure written the way a person reads it: 12,400 lux. */
export function formatLux(lux: number): string {
  return `${Math.round(lux).toLocaleString('en-US')} lux`;
}

// What else reads about the same, from the commonly published lux figures
// for everyday light (indoor lighting a few hundred lux, an overcast day
// about one to ten thousand, daylight out of direct sun ten to twenty-five
// thousand, direct sun from about thirty-two thousand up).
const LEVELS: { below: number; line: string }[] = [
  { below: 50, line: 'Dim, about what a room with the lights turned low reads.' },
  { below: 1000, line: 'About what a room under ordinary indoor lights reads.' },
  { below: 10000, line: 'About what daylight on an overcast day, or a spot near a bright window, reads.' },
  { below: 32000, line: 'About what full daylight out of direct sun reads.' },
  { below: Number.POSITIVE_INFINITY, line: 'In the range direct sun reads.' },
];

export function describeLightLevel(lux: number): string {
  return (LEVELS.find((level) => lux < level.below) ?? LEVELS[LEVELS.length - 1]).line;
}

/** The sentence under a finished measurement. */
export function describeMeasurement(summary: LightSampleSummary): string {
  const spread =
    summary.high - summary.low > Math.max(50, summary.lux * 0.2)
      ? ` It moved between ${formatLux(summary.low)} and ${formatLux(summary.high)} while it was read, so the middle figure is the one kept.`
      : '';
  return `${formatLux(summary.lux)}. ${describeLightLevel(summary.lux)}${spread}`;
}

export const LIGHT_METER_HOW =
  'The sensor sits at the top edge of the screen. Hold the phone where the leaves are, screen facing the way the plant faces, and keep your hand and shadow off it for the few seconds it reads.';

export const LIGHT_METER_LIMITS =
  "A phone's sensor is not a calibrated meter, so compare readings from the same phone rather than against a number from somewhere else. Lux is light as an eye sees it; a grow light and the sun can read the same lux and give a plant different amounts of the light it uses.";

export const LIGHT_METER_UNAVAILABLE =
  'This phone does not let apps read its light sensor. iPhones never do, and some Android phones have none. Type a figure from a light meter instead.';
