// A small, curated catalog of real, well-known bright stars -- not an
// exhaustive sky atlas, just enough to draw a handful of genuinely
// recognizable constellations (the ones an actual person is likely to know
// by name/shape), explicitly requested over the previous random scattered
// starfield. Coordinates are real J2000 right ascension/declination
// (converted here to decimal degrees) and real apparent visual magnitudes,
// widely published, standard reference values -- approximate to roughly a
// tenth of a degree, which is intentional: this is a decorative sky
// illustration, not survey-grade astronomy, and lib/astronomy.ts's own
// horizontal-coordinate transform doesn't need more precision than that to
// look right.
//
// Picked for a ~20.65°N latitude (Puerto Vallarta, see lib/astronomy.ts):
// Ursa Major/Minor and Cassiopeia are visible most of the year (low in the
// north for part of their daily circuit, not fully circumpolar this far
// south); Orion and Leo are the winter/spring evening standouts; Scorpius
// and Cygnus are the summer evening standouts (Scorpius in particular sits
// higher in the sky from this latitude than it does farther north); Crux
// (the Southern Cross) is a genuine edge case -- only a few degrees above
// the southern horizon, and only around April-June evenings -- included
// anyway since lib/astronomy.ts's own altitude filter already hides
// anything below the horizon, so it simply won't render most of the time,
// exactly as it wouldn't be visible from here most of the time in reality.

export type CatalogStar = {
  name: string;
  raDeg: number;
  decDeg: number;
  magnitude: number; // lower = brighter (real astronomical convention)
};

export type Constellation = {
  name: string;
  stars: CatalogStar[];
  // Pairs of indices into `stars` above -- which stars get a connecting
  // line drawn between them, tracing the constellation's familiar shape
  // (not every catalog star needs to be part of a line).
  lines: readonly [number, number][];
};

function hms(hours: number, minutes: number, seconds: number): number {
  return (hours + minutes / 60 + seconds / 3600) * 15;
}

function dms(degrees: number, minutes: number, seconds: number): number {
  const sign = degrees < 0 ? -1 : 1;
  return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
}

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Ursa Major',
    stars: [
      { name: 'Dubhe', raDeg: hms(11, 3, 44), decDeg: dms(61, 45, 3), magnitude: 1.79 },
      { name: 'Merak', raDeg: hms(11, 1, 50), decDeg: dms(56, 22, 57), magnitude: 2.37 },
      { name: 'Phecda', raDeg: hms(11, 53, 50), decDeg: dms(53, 41, 41), magnitude: 2.44 },
      { name: 'Megrez', raDeg: hms(12, 15, 26), decDeg: dms(57, 1, 57), magnitude: 3.31 },
      { name: 'Alioth', raDeg: hms(12, 54, 2), decDeg: dms(55, 57, 35), magnitude: 1.77 },
      { name: 'Mizar', raDeg: hms(13, 23, 56), decDeg: dms(54, 55, 31), magnitude: 2.23 },
      { name: 'Alkaid', raDeg: hms(13, 47, 32), decDeg: dms(49, 18, 48), magnitude: 1.86 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    name: 'Ursa Minor',
    stars: [
      { name: 'Polaris', raDeg: hms(2, 31, 49), decDeg: dms(89, 15, 51), magnitude: 1.98 },
      { name: 'Kochab', raDeg: hms(14, 50, 42), decDeg: dms(74, 9, 20), magnitude: 2.08 },
      { name: 'Pherkad', raDeg: hms(15, 20, 44), decDeg: dms(71, 50, 2), magnitude: 3.05 },
    ],
    lines: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    name: 'Cassiopeia',
    stars: [
      { name: 'Caph', raDeg: hms(0, 9, 11), decDeg: dms(59, 8, 59), magnitude: 2.27 },
      { name: 'Schedar', raDeg: hms(0, 40, 30), decDeg: dms(56, 32, 14), magnitude: 2.24 },
      { name: 'Gamma Cas', raDeg: hms(0, 56, 43), decDeg: dms(60, 43, 0), magnitude: 2.47 },
      { name: 'Ruchbah', raDeg: hms(1, 25, 49), decDeg: dms(60, 14, 7), magnitude: 2.68 },
      { name: 'Segin', raDeg: hms(1, 54, 24), decDeg: dms(63, 40, 12), magnitude: 3.35 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    name: 'Orion',
    stars: [
      { name: 'Betelgeuse', raDeg: hms(5, 55, 10), decDeg: dms(7, 24, 25), magnitude: 0.5 },
      { name: 'Rigel', raDeg: hms(5, 14, 32), decDeg: dms(-8, 12, 6), magnitude: 0.13 },
      { name: 'Bellatrix', raDeg: hms(5, 25, 8), decDeg: dms(6, 20, 59), magnitude: 1.64 },
      { name: 'Mintaka', raDeg: hms(5, 32, 0), decDeg: dms(-0, 17, 57), magnitude: 2.23 },
      { name: 'Alnilam', raDeg: hms(5, 36, 13), decDeg: dms(-1, 12, 7), magnitude: 1.69 },
      { name: 'Alnitak', raDeg: hms(5, 40, 46), decDeg: dms(-1, 56, 34), magnitude: 1.77 },
      { name: 'Saiph', raDeg: hms(5, 47, 45), decDeg: dms(-9, 40, 11), magnitude: 2.09 },
    ],
    lines: [
      [0, 5], // Betelgeuse (shoulder) -> Alnitak (belt)
      [2, 3], // Bellatrix (shoulder) -> Mintaka (belt)
      [3, 4],
      [4, 5], // belt
      [5, 6], // belt -> Saiph (leg)
      [3, 1], // belt -> Rigel (leg)
    ],
  },
  {
    name: 'Scorpius',
    stars: [
      { name: 'Dschubba', raDeg: hms(16, 0, 20), decDeg: dms(-22, 37, 18), magnitude: 2.29 },
      { name: 'Graffias', raDeg: hms(16, 5, 26), decDeg: dms(-19, 48, 20), magnitude: 2.56 },
      { name: 'Antares', raDeg: hms(16, 29, 24), decDeg: dms(-26, 25, 55), magnitude: 0.96 },
      { name: 'Tau Sco', raDeg: hms(16, 35, 53), decDeg: dms(-28, 12, 58), magnitude: 2.82 },
      { name: 'Epsilon Sco', raDeg: hms(16, 50, 10), decDeg: dms(-34, 17, 36), magnitude: 2.29 },
      { name: 'Mu1 Sco', raDeg: hms(16, 51, 52), decDeg: dms(-38, 2, 51), magnitude: 3.0 },
      { name: 'Zeta2 Sco', raDeg: hms(16, 54, 35), decDeg: dms(-42, 21, 43), magnitude: 3.62 },
      { name: 'Eta Sco', raDeg: hms(17, 12, 9), decDeg: dms(-43, 14, 21), magnitude: 3.32 },
      { name: 'Shaula', raDeg: hms(17, 33, 37), decDeg: dms(-37, 6, 14), magnitude: 1.62 },
      { name: 'Sargas', raDeg: hms(17, 37, 19), decDeg: dms(-42, 59, 52), magnitude: 1.86 },
    ],
    lines: [
      [1, 0],
      [0, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
    ],
  },
  {
    name: 'Cygnus',
    stars: [
      { name: 'Deneb', raDeg: hms(20, 41, 26), decDeg: dms(45, 16, 49), magnitude: 1.25 },
      { name: 'Sadr', raDeg: hms(20, 22, 14), decDeg: dms(40, 15, 24), magnitude: 2.23 },
      { name: 'Albireo', raDeg: hms(19, 30, 43), decDeg: dms(27, 57, 35), magnitude: 3.18 },
      { name: 'Delta Cyg', raDeg: hms(19, 44, 59), decDeg: dms(45, 7, 51), magnitude: 2.87 },
      { name: 'Gienah', raDeg: hms(20, 46, 13), decDeg: dms(33, 58, 13), magnitude: 2.48 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
    ],
  },
  {
    name: 'Leo',
    stars: [
      { name: 'Epsilon Leo', raDeg: hms(9, 45, 51), decDeg: dms(23, 46, 27), magnitude: 2.98 },
      { name: 'Rasalas', raDeg: hms(9, 52, 46), decDeg: dms(26, 0, 25), magnitude: 3.88 },
      { name: 'Adhafera', raDeg: hms(10, 16, 42), decDeg: dms(23, 25, 2), magnitude: 3.44 },
      { name: 'Algieba', raDeg: hms(10, 19, 58), decDeg: dms(19, 50, 29), magnitude: 2.01 },
      { name: 'Regulus', raDeg: hms(10, 8, 22), decDeg: dms(11, 58, 2), magnitude: 1.4 },
      { name: 'Zosma', raDeg: hms(11, 14, 7), decDeg: dms(20, 31, 25), magnitude: 2.56 },
      { name: 'Chertan', raDeg: hms(11, 14, 14), decDeg: dms(15, 25, 46), magnitude: 3.34 },
      { name: 'Denebola', raDeg: hms(11, 49, 4), decDeg: dms(14, 34, 19), magnitude: 2.14 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [5, 6],
      [6, 4],
      [5, 7],
    ],
  },
  {
    name: 'Crux',
    stars: [
      { name: 'Acrux', raDeg: hms(12, 26, 36), decDeg: dms(-63, 5, 57), magnitude: 0.77 },
      { name: 'Gacrux', raDeg: hms(12, 31, 10), decDeg: dms(-57, 6, 48), magnitude: 1.63 },
      { name: 'Mimosa', raDeg: hms(12, 47, 43), decDeg: dms(-59, 41, 20), magnitude: 1.25 },
      { name: 'Imai', raDeg: hms(12, 15, 9), decDeg: dms(-58, 44, 56), magnitude: 2.79 },
    ],
    lines: [
      [1, 0],
      [2, 3],
    ],
  },
];

export const ALL_CATALOG_STARS: readonly { star: CatalogStar; constellation: string }[] = CONSTELLATIONS.flatMap(
  (constellation) => constellation.stars.map((star) => ({ star, constellation: constellation.name })),
);
