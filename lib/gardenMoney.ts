// What the garden costs, set against what it gives back.
//
// 2026-09-20, direct instruction: "The Garden harvest should also take into
// account all money spent to grow the food. This should include nutrients
// purchased to feed the garden if natural growing techniques aren't used
// that are free to them, such as compost from kitchen scraps."
//
// Until today Money Not Spent (components/MyWholeFoodsView.tsx) counted only
// one side: what a harvest would have cost at the grocery store, valued at a
// price this person had recorded paying. A bag of fertilizer, a flat of
// seedlings, the water bill for the bed, none of it was subtracted, so the
// figure read as a saving when part of it had been spent getting there.
//
// The other side is the growing costs. Each one is a finance_entries row in
// the 'garden_supplies' category, so the household budget sees it once, and
// the Garden tab reads its total from there rather than keeping a ledger of
// its own (lib/gardenMoneyDb.ts). This module is the arithmetic and the
// vocabulary, with no database in it, so scripts/test_garden_money.js can
// check both.
//
// THREE RULES, ALL OF THEM CARRIED OVER FROM lib/harvestTrade.ts.
//
//   1. Only a recorded price values a harvest or a gift. Anything without one
//      is counted and named, never priced, and the net figure says so.
//   2. What was not spent is never income. It is compared with what was
//      spent, and that is as far as it goes.
//   3. The netting is per growing area, never per crop. A bag of fertilizer
//      feeds the whole bed; charging it to the tomatoes would be an invented
//      split. A cost tied to an area counts against that area's harvests,
//      and one tied to nothing counts against the garden as a whole.
//
// Kitchen scraps, raked leaves and grass clippings are what make the compost
// side free, which is exactly the instruction's point: only what was BOUGHT
// is a cost, and a compost pile fed from the kitchen carries none.
//
// PER AREA, 2026-09-20, same day, direct instruction: "Growing costs should
// be separated somehow, because the user might be growing something one way
// and other things another way, and they may want to track costs for one
// grow while not on another grow, or it may be a difference between indoors
// and outdoors where indoors uses a LED grow light."
//
// The unit of separation is the garden area (garden_plots), because that is
// the thing that already knows whether it is indoors, outdoors or under
// glass and what its light source is, and because a harvest already says
// which area it came from. A grow tent under an LED light is an indoor
// area; the beds out back are an outdoor one. A cost tied to an area is
// set against that area's kept harvests, so each grow gets its own figure,
// and an area with harvests but no costs recorded says so rather than
// reading as free. Costs tied to no area, and produce given to you, sit in
// a bucket of their own. On top of that, areas roll up by location type,
// which is the indoors-against-outdoors comparison the instruction names.

import { formatTradeMoney } from './harvestTrade';

export type GrowingCostKind =
  | 'seeds_starts'
  | 'soil_amendments'
  | 'fertilizer_nutrients'
  | 'compost_materials'
  | 'water'
  | 'tools_equipment'
  | 'pest_disease'
  | 'containers_structures'
  | 'other';

export const GROWING_COST_KINDS: { code: GrowingCostKind; label: string; help: string }[] = [
  { code: 'seeds_starts', label: 'Seeds and starts', help: 'Seed packets, seedlings, bulbs, bare-root plants.' },
  { code: 'soil_amendments', label: 'Soil and amendments', help: 'Bagged soil, bought compost, manure, lime, sand.' },
  {
    code: 'fertilizer_nutrients',
    label: 'Fertilizer and nutrients',
    help: 'Anything bought to feed the plants. Compost from your kitchen scraps costs nothing and is not entered.',
  },
  { code: 'compost_materials', label: 'Compost materials', help: 'Straw, bought manure, a bin or tumbler, anything paid for that went into a pile.' },
  { code: 'water', label: 'Water', help: 'The part of a water bill that went to the garden, when you can tell.' },
  { code: 'tools_equipment', label: 'Tools and equipment', help: 'Hand tools, hoses, timers, a tiller.' },
  { code: 'pest_disease', label: 'Pest and disease control', help: 'Row cover, netting, sprays, traps.' },
  { code: 'containers_structures', label: 'Containers and structures', help: 'Pots, raised-bed lumber, trellis, a cold frame.' },
  { code: 'other', label: 'Something else', help: 'Any other money spent on growing.' },
];

export function growingCostKindLabel(kind: string): string {
  return GROWING_COST_KINDS.find((entry) => entry.code === kind)?.label ?? 'Something else';
}

export function isGrowingCostKind(value: string): value is GrowingCostKind {
  return GROWING_COST_KINDS.some((entry) => entry.code === value);
}

export type GardenMoneySummary = {
  /** What kept harvests would have cost, at recorded prices only. */
  harvestsAvoided: number;
  /** What produce given to you would have cost, at recorded prices only. */
  receivedAvoided: number;
  /** Every finance entry in the garden_supplies category, all time. */
  growingCosts: number;
  /** harvestsAvoided + receivedAvoided - growingCosts. */
  net: number;
  /** Harvests and gifts that had no recorded price, so the net understates
   *  what the garden gave back. Named so the figure is never read as whole. */
  unpricedCount: number;
};

export function summarizeGardenMoney(input: {
  harvestsAvoided: number;
  receivedAvoided: number;
  growingCosts: number;
  unpricedCount: number;
}): GardenMoneySummary {
  const harvestsAvoided = Math.max(0, input.harvestsAvoided);
  const receivedAvoided = Math.max(0, input.receivedAvoided);
  const growingCosts = Math.max(0, input.growingCosts);
  return {
    harvestsAvoided,
    receivedAvoided,
    growingCosts,
    net: Math.round((harvestsAvoided + receivedAvoided - growingCosts) * 100) / 100,
    unpricedCount: Math.max(0, Math.round(input.unpricedCount)),
  };
}

/**
 * One sentence for the net figure. Says which way it went and, when
 * anything was counted without a price, that the garden gave back more than
 * the number shows.
 */
export function describeGardenNet(summary: GardenMoneySummary): string {
  const gaveBack = summary.harvestsAvoided + summary.receivedAvoided;
  let line: string;
  if (summary.growingCosts === 0 && gaveBack === 0) {
    line = 'Nothing priced on either side yet.';
  } else if (summary.growingCosts === 0) {
    line = `${formatTradeMoney(gaveBack)} you did not have to spend, with no growing costs recorded against it.`;
  } else if (summary.net > 0) {
    line = `${formatTradeMoney(summary.net)} ahead after ${formatTradeMoney(summary.growingCosts)} spent on growing.`;
  } else if (summary.net < 0) {
    line = `${formatTradeMoney(Math.abs(summary.net))} spent on growing beyond what the garden has given back at recorded prices so far.`;
  } else {
    line = `Growing costs of ${formatTradeMoney(summary.growingCosts)} matched exactly by what you did not have to spend.`;
  }
  if (summary.unpricedCount > 0) {
    line += ` ${summary.unpricedCount === 1 ? 'One harvest or gift' : `${summary.unpricedCount} harvests and gifts`} had no recorded price and ${summary.unpricedCount === 1 ? 'is' : 'are'} counted without one, so the garden gave back more than this shows.`;
  }
  return line;
}

/** Short form of the net for a row or a rollup line: "$12.40 ahead",
 *  "$5.00 behind", "$30.00 given back, no costs recorded". */
export function describeNetShort(summary: GardenMoneySummary): string {
  const gaveBack = summary.harvestsAvoided + summary.receivedAvoided;
  if (summary.growingCosts === 0 && gaveBack === 0) return 'nothing priced yet';
  if (summary.growingCosts === 0) return `${formatTradeMoney(gaveBack)} given back, no costs recorded`;
  if (summary.net > 0) return `${formatTradeMoney(summary.net)} ahead`;
  if (summary.net < 0) return `${formatTradeMoney(Math.abs(summary.net))} behind`;
  return 'costs matched by what was given back';
}

export type GardenAreaLocation = 'outdoor' | 'indoor' | 'greenhouse';

export const GARDEN_AREA_LOCATION_LABELS: Record<GardenAreaLocation, string> = {
  outdoor: 'Outdoors',
  indoor: 'Indoors',
  greenhouse: 'Greenhouse',
};

export type GardenAreaMoney = {
  /** Null for the bucket of costs tied to no area and produce given to you. */
  areaId: string | null;
  name: string;
  locationType: GardenAreaLocation | null;
  lightSource: string | null;
  summary: GardenMoneySummary;
  costCount: number;
  harvestCount: number;
  giftCount: number;
};

export type GardenLocationMoney = {
  locationType: GardenAreaLocation;
  label: string;
  areaCount: number;
  summary: GardenMoneySummary;
};

export const UNASSIGNED_AREA_NAME = 'Not tied to one area';

/**
 * The same arithmetic as summarizeGardenMoney, done once per growing area.
 *
 * An item's amount is what it would have cost at a recorded price, or null
 * when it had no recorded price, in which case it is counted and not
 * priced. Areas with nothing recorded on either side are left out, so a
 * bed that was never costed and never harvested does not show as a row of
 * zeros. The unassigned bucket appears only when something is in it.
 */
export function groupGardenMoneyByArea(input: {
  areas: { id: string; name: string; locationType: GardenAreaLocation; lightSource: string | null }[];
  harvests: { plotId: string | null; amount: number | null }[];
  gifts: { amount: number | null }[];
  costs: { plotId: string | null; amount: number }[];
}): { areas: GardenAreaMoney[]; unassigned: GardenAreaMoney | null; byLocation: GardenLocationMoney[] } {
  type Bucket = {
    harvestsAvoided: number;
    receivedAvoided: number;
    growingCosts: number;
    unpriced: number;
    costCount: number;
    harvestCount: number;
    giftCount: number;
  };
  const emptyBucket = (): Bucket => ({
    harvestsAvoided: 0,
    receivedAvoided: 0,
    growingCosts: 0,
    unpriced: 0,
    costCount: 0,
    harvestCount: 0,
    giftCount: 0,
  });
  const buckets = new Map<string | null, Bucket>();
  const known = new Set(input.areas.map((area) => area.id));
  const bucketFor = (plotId: string | null): Bucket => {
    // A cost or harvest tied to an area that no longer exists is not lost;
    // it falls into the unassigned bucket with everything else untied.
    const key = plotId && known.has(plotId) ? plotId : null;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = emptyBucket();
      buckets.set(key, bucket);
    }
    return bucket;
  };
  for (const harvest of input.harvests) {
    const bucket = bucketFor(harvest.plotId);
    bucket.harvestCount += 1;
    if (harvest.amount === null) bucket.unpriced += 1;
    else bucket.harvestsAvoided += Math.max(0, harvest.amount);
  }
  for (const gift of input.gifts) {
    const bucket = bucketFor(null);
    bucket.giftCount += 1;
    if (gift.amount === null) bucket.unpriced += 1;
    else bucket.receivedAvoided += Math.max(0, gift.amount);
  }
  for (const cost of input.costs) {
    const bucket = bucketFor(cost.plotId);
    bucket.costCount += 1;
    bucket.growingCosts += Math.max(0, cost.amount);
  }
  const toMoney = (bucket: Bucket) =>
    summarizeGardenMoney({
      harvestsAvoided: bucket.harvestsAvoided,
      receivedAvoided: bucket.receivedAvoided,
      growingCosts: bucket.growingCosts,
      unpricedCount: bucket.unpriced,
    });

  const areas: GardenAreaMoney[] = [];
  const byLocationBuckets = new Map<GardenAreaLocation, { areaCount: number; bucket: Bucket }>();
  for (const area of input.areas) {
    const bucket = buckets.get(area.id);
    if (!bucket) continue;
    areas.push({
      areaId: area.id,
      name: area.name,
      locationType: area.locationType,
      lightSource: area.lightSource,
      summary: toMoney(bucket),
      costCount: bucket.costCount,
      harvestCount: bucket.harvestCount,
      giftCount: 0,
    });
    const rollup = byLocationBuckets.get(area.locationType) ?? { areaCount: 0, bucket: emptyBucket() };
    rollup.areaCount += 1;
    rollup.bucket.harvestsAvoided += bucket.harvestsAvoided;
    rollup.bucket.growingCosts += bucket.growingCosts;
    rollup.bucket.unpriced += bucket.unpriced;
    byLocationBuckets.set(area.locationType, rollup);
  }
  const untied = buckets.get(null);
  const unassigned: GardenAreaMoney | null = untied
    ? {
        areaId: null,
        name: UNASSIGNED_AREA_NAME,
        locationType: null,
        lightSource: null,
        summary: toMoney(untied),
        costCount: untied.costCount,
        harvestCount: untied.harvestCount,
        giftCount: untied.giftCount,
      }
    : null;
  const order: GardenAreaLocation[] = ['indoor', 'greenhouse', 'outdoor'];
  const byLocation: GardenLocationMoney[] = order
    .filter((locationType) => byLocationBuckets.has(locationType))
    .map((locationType) => {
      const rollup = byLocationBuckets.get(locationType)!;
      return {
        locationType,
        label: GARDEN_AREA_LOCATION_LABELS[locationType],
        areaCount: rollup.areaCount,
        summary: toMoney(rollup.bucket),
      };
    });
  return { areas, unassigned, byLocation };
}

/** "Indoors, LED grow light" or "Outdoors". */
export function describeAreaSetting(area: { locationType: GardenAreaLocation | null; lightSource: string | null }): string {
  if (!area.locationType) return '';
  const label = GARDEN_AREA_LOCATION_LABELS[area.locationType];
  return area.lightSource?.trim() ? `${label}, ${area.lightSource.trim()}` : label;
}

/** Units a gift of produce can arrive in. The Harvest Log's five, plus the
 *  two ways a neighbour actually hands things over. */
export const RECEIVED_SHARE_UNITS = ['g', 'kg', 'oz', 'lb', 'count', 'bunch', 'bag'] as const;
