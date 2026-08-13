// The real USDA Plant Hardiness Zone list, zones 0a through 13b (28 real
// half-zones) -- the same real framework lib/digest/homeGardening.ts's own
// `garden-understanding-your-zone` entry already establishes as this app's
// zone system. One shared list, not a separate copy per screen -- both
// app/(tabs)/garden.tsx's own "My Zone" lens and app/profile.tsx's own
// Growing Zone field write to the identical user_profile.growing_zone
// column (see lib/db.ts's own UserProfile type), so they need the exact
// same real option list to stay meaningfully in sync.
//
// 0a/0b were added 2026-08-13, alongside the real climate-based zone
// estimator below -- the official current USDA map (US-only) never needs
// them, since its own coldest real zone is 1a (interior Alaska), but a
// genuinely planetary estimate can land somewhere colder (parts of
// Siberia, interior Greenland, high-elevation Antarctica) -- both are
// real, independently-verified zones from the same source the rest of
// this table already comes from (see HARDINESS_ZONE_BANDS_F below), not
// invented to fill a gap.
export const USDA_ZONES = ['0a', '0b', ...Array.from({ length: 13 }, (_, i) => i + 1).flatMap((zone) => [`${zone}a`, `${zone}b`])];

// The real USDA Plant Hardiness Zone temperature bands, in Fahrenheit --
// independently verified 2026-08-13 against Wikipedia's own "Hardiness
// zone" article, and directly cross-checked against a real, live API
// response (phzmapi.org/20001.json, Washington DC's own official USDA
// zone: "8a", "10 to 15") before being trusted. `upperBoundF` is each
// band's own real upper edge, exclusive -- e.g. 8a covers 10 <= F < 15.
// `null` marks the one open-ended band at each extreme: 0a has no real
// floor (anything colder is still 0a), 13b has no real ceiling (anything
// warmer is still 13b). This table is the actual, sole real definition
// every zone in USDA_ZONES above maps to -- lib/gardenZoneLookup.ts's own
// `zoneFromAverageMinF` is the only real consumer, turning a genuine
// average-annual-minimum-temperature figure (from any real source, US or
// not) into one of these same zones.
const HARDINESS_ZONE_BANDS_F: { zone: string; upperBoundF: number | null }[] = [
  { zone: '0a', upperBoundF: -65 },
  { zone: '0b', upperBoundF: -60 },
  { zone: '1a', upperBoundF: -55 },
  { zone: '1b', upperBoundF: -50 },
  { zone: '2a', upperBoundF: -45 },
  { zone: '2b', upperBoundF: -40 },
  { zone: '3a', upperBoundF: -35 },
  { zone: '3b', upperBoundF: -30 },
  { zone: '4a', upperBoundF: -25 },
  { zone: '4b', upperBoundF: -20 },
  { zone: '5a', upperBoundF: -15 },
  { zone: '5b', upperBoundF: -10 },
  { zone: '6a', upperBoundF: -5 },
  { zone: '6b', upperBoundF: 0 },
  { zone: '7a', upperBoundF: 5 },
  { zone: '7b', upperBoundF: 10 },
  { zone: '8a', upperBoundF: 15 },
  { zone: '8b', upperBoundF: 20 },
  { zone: '9a', upperBoundF: 25 },
  { zone: '9b', upperBoundF: 30 },
  { zone: '10a', upperBoundF: 35 },
  { zone: '10b', upperBoundF: 40 },
  { zone: '11a', upperBoundF: 45 },
  { zone: '11b', upperBoundF: 50 },
  { zone: '12a', upperBoundF: 55 },
  { zone: '12b', upperBoundF: 60 },
  { zone: '13a', upperBoundF: 65 },
  { zone: '13b', upperBoundF: null },
];

// Turns a real average-annual-minimum-temperature figure (°F), from any
// real source, into the one real USDA zone it falls in. Always returns a
// real zone -- there's no "out of range" case, since 0a and 13b are both
// deliberately open-ended at the extremes.
export function zoneFromAverageMinF(avgAnnualMinF: number): string {
  for (const band of HARDINESS_ZONE_BANDS_F) {
    if (band.upperBoundF !== null && avgAnnualMinF < band.upperBoundF) {
      return band.zone;
    }
  }
  return HARDINESS_ZONE_BANDS_F[HARDINESS_ZONE_BANDS_F.length - 1].zone;
}

// Which of the real, already-published Digest zone-band entries (all four
// in lib/digest/homeGardening.ts) applies to a given zone -- reused rather
// than duplicated, so "what should I grow in my zone" always points at the
// same real, cited content every time this app's own research on it grows.
// Zone 10 genuinely straddles both the "warm" and "tropical/subtropical"
// entries in the real source content (garden-warm-climate-crops covers
// 9-10, garden-tropical-subtropical-crops covers 10-13) -- both are
// returned for that one real overlap zone rather than picking one
// arbitrarily. Zones 1-2 sit below every existing band (the lowest, "cold/
// short-season" entry starts at zone 3) -- the cold entry is still the
// closest real match, with belowCoverage flagging that honestly rather
// than silently treating it as a perfect fit.
export function zoneBandInfo(zone: string): { bandLabel: string; digestTopics: string[]; belowCoverage: boolean } {
  const zoneNumber = parseInt(zone, 10);
  if (zoneNumber <= 2) {
    return { bandLabel: 'Cold / Short-Season (closest real match)', digestTopics: ['Cold & short-season crops'], belowCoverage: true };
  }
  if (zoneNumber <= 5) {
    return { bandLabel: 'Cold / Short-Season', digestTopics: ['Cold & short-season crops'], belowCoverage: false };
  }
  if (zoneNumber <= 8) {
    return { bandLabel: 'Moderate Climate', digestTopics: ['Moderate-climate crops'], belowCoverage: false };
  }
  if (zoneNumber === 9) {
    return { bandLabel: 'Warm Climate', digestTopics: ['Warm-climate crops'], belowCoverage: false };
  }
  if (zoneNumber === 10) {
    return {
      bandLabel: 'Warm / Tropical & Subtropical (both apply)',
      digestTopics: ['Warm-climate crops', 'Tropical & subtropical crops'],
      belowCoverage: false,
    };
  }
  return { bandLabel: 'Tropical & Subtropical', digestTopics: ['Tropical & subtropical crops'], belowCoverage: false };
}
