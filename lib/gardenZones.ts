// The real USDA Plant Hardiness Zone list, zones 1a through 13b (26 real
// half-zones) -- the same real framework lib/digest/homeGardening.ts's own
// `garden-understanding-your-zone` entry already establishes as this app's
// zone system. One shared list, not a separate copy per screen -- both
// app/(tabs)/garden.tsx's own "My Zone" lens and app/profile.tsx's own
// Growing Zone field write to the identical user_profile.growing_zone
// column (see lib/db.ts's own UserProfile type), so they need the exact
// same real option list to stay meaningfully in sync.
export const USDA_ZONES = Array.from({ length: 13 }, (_, i) => i + 1).flatMap((zone) => [`${zone}a`, `${zone}b`]);

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
