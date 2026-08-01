// Real celestial-coordinate math for Home's night sky (components/
// AnimatedSky.tsx) -- converts a star or planet's fixed position on the
// celestial sphere into "where is it above THIS horizon right now," the
// same transform every planetarium app performs. Pure math, no device
// APIs, no location permission requested -- PUERTO_VALLARTA_LAT/LON below
// are a fixed constant baked into the app (this user's home location), not
// a runtime query, consistent with this app's deliberate "no location
// permissions anywhere" stance (see lib/skyClock.ts's own comment on why
// the sun/moon's own on-screen position is stylized rather than
// geographically real -- that stays stylized; only the starfield below was
// asked to become astronomically real).

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export const PUERTO_VALLARTA_LAT = 20.6534; // degrees North
export const PUERTO_VALLARTA_LON = -105.2253; // degrees East (negative = West)

// Julian Date -- days since noon UTC, Jan 1, 4713 BC, the standard time
// axis astronomical formulas are built on. 2440587.5 is the JD of the Unix
// epoch (1970-01-01 00:00 UTC).
function toJulianDate(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

// Greenwich Mean Sidereal Time, in degrees -- how far the sky has rotated,
// as seen from Greenwich, since a fixed reference epoch. Standard
// low-precision GMST formula (Meeus, "Astronomical Algorithms," ch. 12),
// accurate to a small fraction of a degree -- far more precision than a
// decorative sky illustration needs.
function gmstDegrees(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
  return ((gmst % 360) + 360) % 360;
}

// Local Sidereal Time -- GMST corrected for how far east/west of Greenwich
// this location sits. This one number is what actually "rotates the sky"
// through the night and across the seasons; every star/planet's own
// position below is otherwise fixed (or, for planets, slowly orbiting).
export function localSiderealTimeDegrees(date: Date, longitudeDeg: number): number {
  const gmst = gmstDegrees(toJulianDate(date));
  return ((gmst + longitudeDeg) % 360 + 360) % 360;
}

export type HorizontalPosition = { altitude: number; azimuth: number };

// Converts a fixed equatorial position (right ascension/declination -- the
// coordinates a star catalog actually stores, since they don't depend on
// observer or time) into this moment's horizontal position (altitude above
// the horizon, azimuth around it) for a given latitude and local sidereal
// time -- the standard spherical-astronomy transform (Meeus ch. 13) every
// star-chart app performs. Azimuth returned here is measured from North,
// increasing clockwise through East (the usual compass convention) --
// converted from the South-referenced formula most textbooks state by
// adding 180 degrees.
export function equatorialToHorizontal(raDeg: number, decDeg: number, latDeg: number, lstDeg: number): HorizontalPosition {
  const haDeg = ((lstDeg - raDeg) % 360 + 360) % 360;
  const ha = haDeg * DEG_TO_RAD;
  const dec = decDeg * DEG_TO_RAD;
  const lat = latDeg * DEG_TO_RAD;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG;

  const azFromSouth = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  const azimuth = ((azFromSouth * RAD_TO_DEG + 180) % 360 + 360) % 360;

  return { altitude, azimuth };
}

// ---------------------------------------------------------------------
// Planetary positions -- Paul Schlyter's well-known "low precision"
// method (a long-published, freely reproduced algorithm; see
// stjarnhimlen.se/comp/ppcomp.html for the original derivation this
// follows step-for-step). Accurate to roughly 1 arcminute near J2000,
// degrading slowly over subsequent decades -- intentional: this app needs
// "which patch of sky is Jupiter in tonight," not survey-grade ephemeris
// precision, and this method needs no external data file, staying
// consistent with the app's fully offline, no-server approach everywhere
// else.
// ---------------------------------------------------------------------

// Mean orbital elements at epoch (2000-01-00.0 UT) plus a per-day rate --
// each planet's element(d) = base + rate * d, where d is days since that
// epoch (see `d` below). N = longitude of ascending node, i = inclination,
// w = argument of perihelion, a = semi-major axis (AU), e = eccentricity,
// M = mean anomaly -- all in degrees except a (AU) and e (unitless).
type OrbitalElements = {
  N: [number, number];
  i: [number, number];
  w: [number, number];
  a: number;
  e: [number, number];
  M: [number, number];
};

const EARTH_ELEMENTS: OrbitalElements = {
  N: [0.0, 0.0],
  i: [0.0, 0.0],
  w: [282.9404, 4.70935e-5],
  a: 1.0,
  e: [0.016709, -1.151e-9],
  M: [356.047, 0.9856002585],
};

export type PlanetName = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';

const PLANET_ELEMENTS: Record<PlanetName, OrbitalElements> = {
  mercury: {
    N: [48.3313, 3.24587e-5],
    i: [7.0047, 5.0e-8],
    w: [29.1241, 1.01444e-5],
    a: 0.387098,
    e: [0.205635, 5.59e-10],
    M: [168.6562, 4.0923344368],
  },
  venus: {
    N: [76.6799, 2.4659e-5],
    i: [3.3946, 2.75e-8],
    w: [54.891, 1.38374e-5],
    a: 0.72333,
    e: [0.006773, -1.302e-9],
    M: [48.0052, 1.6021302244],
  },
  mars: {
    N: [49.5574, 2.11081e-5],
    i: [1.8497, -1.78e-8],
    w: [286.5016, 2.92961e-5],
    a: 1.523688,
    e: [0.093405, 2.516e-9],
    M: [18.6021, 0.5240207766],
  },
  jupiter: {
    N: [100.4542, 2.76854e-5],
    i: [1.303, -1.557e-7],
    w: [273.8777, 1.64505e-5],
    a: 5.20256,
    e: [0.048498, 4.469e-9],
    M: [19.895, 0.0830853001],
  },
  saturn: {
    N: [113.6634, 2.3898e-5],
    i: [2.4886, -1.081e-7],
    w: [339.3939, 2.97661e-5],
    a: 9.55475,
    e: [0.055546, -9.499e-9],
    M: [316.967, 0.0334442282],
  },
};

function elementAt(pair: [number, number], d: number): number {
  return pair[0] + pair[1] * d;
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// Position in the planet's own orbital plane (heliocentric, in AU), found
// by solving Kepler's equation for the eccentric anomaly E via a handful
// of Newton's-method iterations (more than enough for low-precision use --
// Schlyter's own reference implementation uses the same fixed small
// iteration count).
function heliocentricOrbitalPosition(elements: OrbitalElements, d: number): { x: number; y: number; r: number; v: number } {
  const e = elementAt(elements.e, d);
  const M = normalizeDeg(elementAt(elements.M, d)) * DEG_TO_RAD;

  // Kepler's equation, M = E - e*sin(E), solved for E via Newton's method
  // -- 5 iterations converges to well under a second of arc for every
  // planet's actual eccentricity (all comfortably below 0.1 here), far
  // tighter than this low-precision method's own ~1 arcminute ceiling.
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let iteration = 0; iteration < 5; iteration++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    E = E - f / fPrime;
  }

  const a = elements.a;
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const r = Math.sqrt(xv * xv + yv * yv);
  const v = Math.atan2(yv, xv);
  return { x: xv, y: yv, r, v };
}

// Heliocentric ecliptic rectangular coordinates -- rotates the orbital-
// plane position above by the orbit's own orientation in space (N, i, w).
function heliocentricEcliptic(elements: OrbitalElements, d: number): { x: number; y: number; z: number } {
  const { r, v } = heliocentricOrbitalPosition(elements, d);
  const N = elementAt(elements.N, d) * DEG_TO_RAD;
  const i = elementAt(elements.i, d) * DEG_TO_RAD;
  const w = elementAt(elements.w, d) * DEG_TO_RAD;
  const vw = v + w;

  const x = r * (Math.cos(N) * Math.cos(vw) - Math.sin(N) * Math.sin(vw) * Math.cos(i));
  const y = r * (Math.sin(N) * Math.cos(vw) + Math.cos(N) * Math.sin(vw) * Math.cos(i));
  const z = r * (Math.sin(vw) * Math.sin(i));
  return { x, y, z };
}

// Geocentric equatorial RA/Dec for a planet -- combines its own
// heliocentric position with Earth's own (to get geocentric ecliptic
// coordinates), then rotates by the obliquity of the ecliptic to get
// equatorial coordinates. Ignores light-time, aberration, and nutation
// (each worth well under a degree of correction) -- irrelevant at the
// precision this decorative sky needs.
export function planetEquatorial(planet: PlanetName, date: Date): { raDeg: number; decDeg: number } {
  const d = toJulianDate(date) - 2451543.5; // days since 2000-01-00.0 UT

  const earth = heliocentricEcliptic(EARTH_ELEMENTS, d);
  const body = heliocentricEcliptic(PLANET_ELEMENTS[planet], d);

  // Geocentric ecliptic coordinates -- Earth's own heliocentric position
  // points FROM the Sun TO Earth, so the Sun (and everything else) as seen
  // FROM Earth is offset by the negative of that, i.e. body - earth.
  const xg = body.x - earth.x;
  const yg = body.y - earth.y;
  const zg = body.z - earth.z;

  const obliquityDeg = 23.4393 - 3.563e-7 * d;
  const obliquity = obliquityDeg * DEG_TO_RAD;
  const xeq = xg;
  const yeq = yg * Math.cos(obliquity) - zg * Math.sin(obliquity);
  const zeq = yg * Math.sin(obliquity) + zg * Math.cos(obliquity);

  const raDeg = normalizeDeg(Math.atan2(yeq, xeq) * RAD_TO_DEG);
  const decDeg = Math.atan2(zeq, Math.sqrt(xeq * xeq + yeq * yeq)) * RAD_TO_DEG;
  return { raDeg, decDeg };
}
