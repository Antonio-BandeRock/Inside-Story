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

// ---------------------------------------------------------------------------
// From lux to PPFD (1.0.55.18)
// ---------------------------------------------------------------------------
//
// A phone reads lux, and a grower usually wants PPFD: the count of photons a
// leaf can use landing on a square metre each second (µmol/m²/s). The two
// weight light differently (lux by how bright each colour looks to an eye,
// PPFD by every photon from 400 to 700 nm alike), so no single number turns
// one into the other. Each kind of light has its own, because each spreads
// its light across the colours differently. These are the published ratios,
// lux per µmol/m²/s, from Thimijan and Heins, "Photometric, radiometric, and
// quantum light units of measure", HortScience 18 (1983): 818 to 822, for
// the sun, fluorescent tubes, high-pressure sodium, metal halide and
// incandescent bulbs. White LEDs came after that paper; their figure is the
// middle of published white LED spectra from warm (2700 K) to cool (6500 K),
// which run from about 63 to 72. Lights built from red and blue diodes alone
// give off little of the green an eye weights most, so their lux says almost
// nothing about their photons and no ratio is offered for them.
//
// Distance from the lamp is part of the figure already: the phone is held
// where the leaves are, so it measures the light that reaches them. The
// ratio does not change with distance, because moving a lamp changes how
// much light arrives, not which colours it is made of. Distance is kept
// beside the reading as a note so readings taken with the lamp at different
// heights can be told apart later.

export type LightSourceCode =
  | 'sun'
  | 'white_led'
  | 'white_red_led'
  | 'red_blue_led'
  | 'fluorescent'
  | 'hps'
  | 'metal_halide'
  | 'incandescent'
  | 'other';

export type LightSource = {
  code: LightSourceCode;
  label: string;
  /** How it reads inside a sentence: "under white LED light". */
  phrase: string;
  /** Lux per µmol/m²/s, or null where no honest ratio exists. */
  luxPerPpfd: number | null;
  help: string;
  lamp: boolean;
};

export const LIGHT_SOURCES: readonly LightSource[] = [
  { code: 'sun', phrase: 'sunlight', label: 'Sunlight or daylight', luxPerPpfd: 54, help: 'Outdoors, in a greenhouse, or by a window with no lamp on.', lamp: false },
  { code: 'white_led', phrase: 'white LED light', label: 'White LED', luxPerPpfd: 67, help: 'White light from LEDs: a household bulb or a white grow panel. Warm and cool white differ by about a tenth.', lamp: true },
  { code: 'white_red_led', phrase: 'white LED light with extra red', label: 'White LED with extra red', luxPerPpfd: 55, help: 'A white grow panel with deep red diodes added, which looks pinkish. The ratio moves with how much red is added.', lamp: true },
  { code: 'red_blue_led', phrase: 'red and blue LED light', label: 'Red and blue LED (purple light)', luxPerPpfd: null, help: "No general ratio exists for this light, since it gives off little of the green an eye weights most. Give this lamp's ratio below from the maker's figures, or take PPFD from the maker's chart or a quantum sensor.", lamp: true },
  { code: 'fluorescent', phrase: 'fluorescent light', label: 'Fluorescent (T5, tube or CFL)', luxPerPpfd: 74, help: 'Cool white tubes and compact bulbs.', lamp: true },
  { code: 'hps', phrase: 'high-pressure sodium light', label: 'High-pressure sodium (HPS)', luxPerPpfd: 82, help: 'The orange light of an HPS lamp.', lamp: true },
  { code: 'metal_halide', phrase: 'metal halide light', label: 'Metal halide or CMH', luxPerPpfd: 71, help: 'Metal halide and ceramic metal halide read close together.', lamp: true },
  { code: 'incandescent', phrase: 'incandescent or halogen light', label: 'Incandescent or halogen', luxPerPpfd: 50, help: 'An ordinary filament bulb.', lamp: true },
  { code: 'other', phrase: 'this light', label: 'Another light (give its ratio)', luxPerPpfd: null, help: "Any light not on this list. Give this lamp's ratio below, from the maker's figures, and PPFD is worked out from it.", lamp: true },
];

export function lightSource(code: string | null | undefined): LightSource | null {
  return LIGHT_SOURCES.find((source) => source.code === code) ?? null;
}

// ---------------------------------------------------------------------------
// This lamp's ratio (1.0.55.21)
// ---------------------------------------------------------------------------
//
// The ratio above is for a kind of light in general. The one for a
// particular lamp comes from its spectrum, and a grow light's maker has
// already done that arithmetic: a spec sheet gives the lamp's lumens (light
// as an eye weights it) and its PPF in µmol/s (the photons a leaf can use),
// and both come off the same spectrum. Lumens over PPF is lux over PPFD,
// because lux is lumens per square metre and PPFD is µmol/s per square
// metre, the same area on both sides. Efficacy works too: lm/W over µmol/J,
// since the watts cancel. So a person who types the two figures off the
// box gets this lamp's ratio rather than the kind's, and a red and blue
// panel, which has no general ratio, gets one.
//
// A ratio is kept only between 5 and 200. The published figures run from
// about 50 to 82 for the lights above; a deep red or blue panel can go well
// under that, and nothing a lamp gives off comes near either edge, so a
// figure outside it is a typing slip rather than a lamp.

export const LAMP_RATIO_MIN = 5;
export const LAMP_RATIO_MAX = 200;

/** A typed ratio as a number, or null when it is blank or out of range. */
export function parseLampRatio(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < LAMP_RATIO_MIN || value > LAMP_RATIO_MAX) return null;
  return value;
}

/** Lumens over PPF (or lm/W over µmol/J), rounded to one decimal, or null
 *  when either figure is missing or the result is out of range. */
export function lampRatioFromMaker(lumensText: string, ppfText: string): number | null {
  const lumens = Number(lumensText.trim().replace(',', '.'));
  const ppf = Number(ppfText.trim().replace(',', '.'));
  if (!lumensText.trim() || !ppfText.trim() || !Number.isFinite(lumens) || !Number.isFinite(ppf) || lumens <= 0 || ppf <= 0) {
    return null;
  }
  const ratio = Math.round((lumens / ppf) * 10) / 10;
  return ratio >= LAMP_RATIO_MIN && ratio <= LAMP_RATIO_MAX ? ratio : null;
}

/** The ratio in use: this lamp's when one is given, otherwise the kind's. */
export function ratioInUse(code: LightSourceCode | null, lampRatio: number | null): number | null {
  if (lampRatio !== null) return lampRatio;
  return lightSource(code)?.luxPerPpfd ?? null;
}

/** Where a lamp's ratio is remembered: the area and the kind of light, so
 *  the same panel over the same bed is not typed twice. */
export function lampRatioKey(plotId: string | null, code: LightSourceCode | null): string | null {
  if (!code || code === 'sun') return null;
  return `${plotId ?? 'none'}:${code}`;
}

export const LAMP_RATIO_HOW =
  "A grow light's spec sheet gives its lumens and its PPF in µmol/s, both measured off the same spectrum. Lumens divided by PPF is this lamp's ratio. Efficacy works the same way: lm/W divided by µmol/J.";

/** PPFD from lux under one kind of light, or null where no ratio exists. A
 *  lamp's own ratio, when given, is used in place of the kind's. */
export function luxToPpfd(lux: number, code: LightSourceCode, lampRatio: number | null = null): number | null {
  const ratio = ratioInUse(code, lampRatio);
  if (ratio === null || !Number.isFinite(lux) || lux < 0) return null;
  const ppfd = lux / ratio;
  return ppfd >= 10 ? Math.round(ppfd) : Math.round(ppfd * 10) / 10;
}

/** The figure the form is filled with, in the unit the form is set to, or
 *  null when PPFD cannot be worked out (no light picked, or no ratio). */
export function meterFigure(
  lux: number,
  unit: string | null,
  code: LightSourceCode | null,
  lampRatio: number | null = null,
): string | null {
  if (unit === 'PPFD') {
    if (!code) return null;
    const ppfd = luxToPpfd(lux, code, lampRatio);
    return ppfd === null ? null : String(ppfd);
  }
  return String(Math.round(lux));
}

/** The line under a measurement when the form is set to PPFD. */
export function describePpfd(lux: number, code: LightSourceCode | null, lampRatio: number | null = null): string {
  if (!code) return `${formatLux(lux)} was read. Pick the light it is under and it is worked out as PPFD.`;
  const source = lightSource(code) as LightSource;
  const ppfd = luxToPpfd(lux, code, lampRatio);
  if (ppfd === null) {
    return code === 'red_blue_led'
      ? `${formatLux(lux)} was read. Red and blue light has no general ratio, so give this lamp's ratio below from the maker's figures, set the unit to lux to keep this figure, or take PPFD from a quantum sensor.`
      : `${formatLux(lux)} was read. Give this lamp's ratio below and it is worked out as PPFD.`;
  }
  if (lampRatio !== null) {
    return `${formatLux(lux)} under ${source.phrase} is about ${ppfd} µmol/m²/s PPFD, at this lamp's ${lampRatio} lux to one µmol. As close as the maker's figures and the phone's sensor are.`;
  }
  return `${formatLux(lux)} under ${source.phrase} is about ${ppfd} µmol/m²/s PPFD, at ${source.luxPerPpfd} lux to one µmol. An estimate, since the ratio is for that kind of light in general rather than this lamp; this lamp's ratio can be given below.`;
}

export type DistanceUnit = 'cm' | 'in';

/** The note saved with a phone reading: how PPFD was worked out and how far
 *  the lamp was, each only when there is something to say. */
export function meterNote(input: {
  lux: number;
  unit: string | null;
  source: LightSourceCode | null;
  distance: string;
  distanceUnit: DistanceUnit;
  lampRatio?: number | null;
}): string {
  const parts: string[] = [];
  const source = lightSource(input.source);
  const lampRatio = input.lampRatio ?? null;
  const ratio = ratioInUse(input.source, lampRatio);
  if (input.unit === 'PPFD' && source && ratio !== null) {
    parts.push(
      `Worked out from ${formatLux(input.lux)} under ${source.phrase}, at ${lampRatio !== null ? "this lamp's " : ''}${ratio} lux to one µmol.`,
    );
  }
  const trimmed = input.distance.trim().replace(',', '.');
  const distance = Number(trimmed);
  if (source?.lamp && trimmed && Number.isFinite(distance) && distance > 0) {
    parts.push(`Lamp ${distance} ${input.distanceUnit} above where it was read.`);
  }
  return parts.join(' ');
}

/** The light an area is most likely under, from where it is and the first
 *  grow light in its Grow Setup, or null to leave the choice open. */
export function likelyLightSource(
  locationType: 'outdoor' | 'indoor' | 'greenhouse' | null,
  lights: readonly { lightType: string | null; spectrum: string | null }[],
): LightSourceCode | null {
  if (locationType === 'outdoor' || locationType === 'greenhouse') return 'sun';
  if (locationType !== 'indoor' || lights.length === 0) return null;
  const { lightType, spectrum } = lights[0];
  if (lightType === 'hps') return 'hps';
  if (lightType === 'mh' || lightType === 'cmh') return 'metal_halide';
  if (lightType === 't5' || lightType === 'cfl') return 'fluorescent';
  if (lightType === 'led' && (spectrum === 'full' || spectrum === null)) return 'white_led';
  return null;
}

export const LIGHT_METER_DISTANCE_HOW =
  'How far the lamp was above the phone. The figure already has the distance in it, since the phone was where the leaves are, so this is kept as a note to tell readings at different lamp heights apart.';

export const LIGHT_METER_IPHONE =
  'An iPhone does not let any app read its light sensor, so on this phone type the figure from a light meter. Inside Story on an Android phone can measure it.';
