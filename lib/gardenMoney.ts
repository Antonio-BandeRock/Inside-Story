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
//
// COST GROUPS, 2026-09-20, later the same day: "Allow the growing areas to
// also be combined if necessary as one cost group." A group is a named set
// of areas that net together as one figure: the costs tied to any of its
// areas, the costs tied to the group as a whole, and the harvests kept from
// any of its areas. An area belongs to one group at most, so nothing is
// counted twice. A group takes the place of its areas under By Area, and
// the indoors-against-outdoors rollup still counts each area where it is;
// a cost tied to a group whose areas are all in one place rolls up there,
// and one tied to a group spread across places is shown on its own line.

import { formatTradeMoney } from './harvestTrade';

// KINDS. Eight built-in kinds, and any the person adds. "Instead of listing
// 'Something else' in the Pick a Kind list, make it so the user can add
// their own" (2026-09-20): the picker offers the built-ins, the person's
// kinds, and an Add a kind of your own choice, never a catch-all. A cost is
// stored with a built-in code or the id of a garden_cost_kinds row. The
// label 'Something else' survives only as what an old 'other' row, or a
// cost whose kind was removed, reads as.

export type GrowingCostKind =
  | 'seeds_starts'
  | 'soil_amendments'
  | 'fertilizer_nutrients'
  | 'compost_materials'
  | 'water'
  | 'tools_equipment'
  | 'pest_disease'
  | 'containers_structures';

/** A kind the person named. */
export type CustomGrowingCostKind = { id: string; name: string };

/** A built-in and a person's own seen the same way: what the picker lists
 *  and what a label lookup reads. */
export type GrowingCostKindChoice = {
  code: string;
  label: string;
  /** The line under the picker, or null for a person's kind, where there is
   *  nothing to say that the name does not say already. */
  help: string | null;
  /** Whether the person made it, which is the only kind that can be renamed
   *  or removed. */
  mine: boolean;
};

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
];

/** Every kind there is: the built-ins first, in their order, then the
 *  person's, in the order they were added. */
export function growingCostKindChoices(custom: CustomGrowingCostKind[] = []): GrowingCostKindChoice[] {
  const built: GrowingCostKindChoice[] = GROWING_COST_KINDS.map((entry) => ({
    code: entry.code,
    label: entry.label,
    help: entry.help,
    mine: false,
  }));
  const mine: GrowingCostKindChoice[] = custom.map((entry) => ({ code: entry.id, label: entry.name, help: null, mine: true }));
  return [...built, ...mine];
}

export function findGrowingCostKind(kind: string, custom: CustomGrowingCostKind[] = []): GrowingCostKindChoice | null {
  return growingCostKindChoices(custom).find((entry) => entry.code === kind) ?? null;
}

/** What a cost's kind reads as. A kind that was removed, or the old 'other'
 *  code, reads as Something else rather than as nothing. */
export function growingCostKindLabel(kind: string, custom: CustomGrowingCostKind[] = []): string {
  return findGrowingCostKind(kind, custom)?.label ?? 'Something else';
}

export function isGrowingCostKind(value: string, custom: CustomGrowingCostKind[] = []): boolean {
  return findGrowingCostKind(value, custom) !== null;
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
  /** Null for the bucket of costs tied to no area and produce given to you,
   *  and for a cost group, which carries groupId instead. */
  areaId: string | null;
  /** Set on a row that stands for a cost group of combined areas. */
  groupId: string | null;
  /** The names of the areas combined into this group, in area order. */
  members: string[];
  name: string;
  /** For a group: the one place all its areas share, or null when spread. */
  locationType: GardenAreaLocation | null;
  /** For a group: every place its areas are, distinct, indoors first. */
  locations: GardenAreaLocation[];
  lightSource: string | null;
  summary: GardenMoneySummary;
  costCount: number;
  harvestCount: number;
  giftCount: number;
};

export type GardenLocationMoney = {
  /** 'mixed' holds costs tied to a group whose areas are in more than one
   *  place, which cannot honestly be put under any one of them. */
  locationType: GardenAreaLocation | 'mixed';
  label: string;
  areaCount: number;
  summary: GardenMoneySummary;
};

export const UNASSIGNED_AREA_NAME = 'Not tied to one area';
export const MIXED_LOCATION_LABEL = 'Groups spread across places';

export type GardenCostGroupInput = { id: string; name: string; memberIds: string[] };

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
  /** Cost groups of combined areas. An area named by more than one group
   *  goes with the first; an id that is not a known area is ignored. */
  groups?: GardenCostGroupInput[];
  harvests: { plotId: string | null; amount: number | null }[];
  gifts: { amount: number | null }[];
  costs: { plotId: string | null; groupId?: string | null; amount: number }[];
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
  // Groups: which areas each combines, and a bucket for costs tied to the
  // group as a whole rather than to one of its areas.
  const groupOf = new Map<string, string>();
  const groupMembers = new Map<string, string[]>();
  for (const group of input.groups ?? []) {
    const members: string[] = [];
    for (const memberId of group.memberIds) {
      if (!known.has(memberId) || groupOf.has(memberId)) continue;
      groupOf.set(memberId, group.id);
      members.push(memberId);
    }
    groupMembers.set(group.id, members);
  }
  const groupBuckets = new Map<string, Bucket>();
  const groupBucketFor = (groupId: string): Bucket => {
    let bucket = groupBuckets.get(groupId);
    if (!bucket) {
      bucket = emptyBucket();
      groupBuckets.set(groupId, bucket);
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
    // A cost tied to a group that no longer exists is untied, like one tied
    // to an area that no longer exists.
    const bucket = cost.groupId && groupMembers.has(cost.groupId) ? groupBucketFor(cost.groupId) : bucketFor(cost.plotId);
    bucket.costCount += 1;
    bucket.growingCosts += Math.max(0, cost.amount);
  }
  const addInto = (into: Bucket, from: Bucket) => {
    into.harvestsAvoided += from.harvestsAvoided;
    into.receivedAvoided += from.receivedAvoided;
    into.growingCosts += from.growingCosts;
    into.unpriced += from.unpriced;
    into.costCount += from.costCount;
    into.harvestCount += from.harvestCount;
    into.giftCount += from.giftCount;
  };
  const toMoney = (bucket: Bucket) =>
    summarizeGardenMoney({
      harvestsAvoided: bucket.harvestsAvoided,
      receivedAvoided: bucket.receivedAvoided,
      growingCosts: bucket.growingCosts,
      unpricedCount: bucket.unpriced,
    });

  const areas: GardenAreaMoney[] = [];
  const byLocationBuckets = new Map<GardenAreaLocation | 'mixed', { areaCount: number; bucket: Bucket }>();
  const rollupInto = (locationType: GardenAreaLocation | 'mixed', bucket: Bucket, countArea: boolean) => {
    const rollup = byLocationBuckets.get(locationType) ?? { areaCount: 0, bucket: emptyBucket() };
    if (countArea) rollup.areaCount += 1;
    rollup.bucket.harvestsAvoided += bucket.harvestsAvoided;
    rollup.bucket.growingCosts += bucket.growingCosts;
    rollup.bucket.unpriced += bucket.unpriced;
    byLocationBuckets.set(locationType, rollup);
  };
  const order: GardenAreaLocation[] = ['indoor', 'greenhouse', 'outdoor'];
  // Each area still rolls up where it is, grouped or not, so the
  // indoors-against-outdoors comparison is unchanged by grouping.
  for (const area of input.areas) {
    const bucket = buckets.get(area.id);
    if (bucket) rollupInto(area.locationType, bucket, true);
  }
  // A group takes the place of its areas: one row, everything combined.
  for (const group of input.groups ?? []) {
    const memberIds = groupMembers.get(group.id) ?? [];
    const memberAreas = input.areas.filter((area) => memberIds.includes(area.id));
    const combined = emptyBucket();
    for (const area of memberAreas) {
      const bucket = buckets.get(area.id);
      if (bucket) addInto(combined, bucket);
    }
    const direct = groupBuckets.get(group.id);
    if (direct) addInto(combined, direct);
    const anything = combined.costCount > 0 || combined.harvestCount > 0;
    const locations = order.filter((locationType) => memberAreas.some((area) => area.locationType === locationType));
    if (direct) rollupInto(locations.length === 1 ? locations[0] : 'mixed', direct, false);
    if (!anything) continue;
    areas.push({
      areaId: null,
      groupId: group.id,
      members: memberAreas.map((area) => area.name),
      name: group.name,
      locationType: locations.length === 1 ? locations[0] : null,
      locations,
      lightSource: null,
      summary: toMoney(combined),
      costCount: combined.costCount,
      harvestCount: combined.harvestCount,
      giftCount: 0,
    });
  }
  for (const area of input.areas) {
    const bucket = buckets.get(area.id);
    if (!bucket || groupOf.has(area.id)) continue;
    areas.push({
      areaId: area.id,
      groupId: null,
      members: [],
      name: area.name,
      locationType: area.locationType,
      locations: [area.locationType],
      lightSource: area.lightSource,
      summary: toMoney(bucket),
      costCount: bucket.costCount,
      harvestCount: bucket.harvestCount,
      giftCount: 0,
    });
  }
  const untied = buckets.get(null);
  const unassigned: GardenAreaMoney | null = untied
    ? {
        areaId: null,
        groupId: null,
        members: [],
        name: UNASSIGNED_AREA_NAME,
        locationType: null,
        locations: [],
        lightSource: null,
        summary: toMoney(untied),
        costCount: untied.costCount,
        harvestCount: untied.harvestCount,
        giftCount: untied.giftCount,
      }
    : null;
  const rollupOrder: (GardenAreaLocation | 'mixed')[] = [...order, 'mixed'];
  const byLocation: GardenLocationMoney[] = rollupOrder
    .filter((locationType) => byLocationBuckets.has(locationType))
    .map((locationType) => {
      const rollup = byLocationBuckets.get(locationType)!;
      return {
        locationType,
        label: locationType === 'mixed' ? MIXED_LOCATION_LABEL : GARDEN_AREA_LOCATION_LABELS[locationType],
        areaCount: rollup.areaCount,
        summary: toMoney(rollup.bucket),
      };
    });
  return { areas, unassigned, byLocation };
}

/** "Indoors, LED grow light" or "Outdoors"; for a group spread across
 *  places, "Indoors and outdoors". */
export function describeAreaSetting(area: {
  locationType: GardenAreaLocation | null;
  locations?: GardenAreaLocation[];
  lightSource: string | null;
}): string {
  if (!area.locationType) {
    const spread = area.locations ?? [];
    if (spread.length < 2) return '';
    const labels = spread.map((locationType, index) => {
      const label = GARDEN_AREA_LOCATION_LABELS[locationType];
      return index === 0 ? label : label.toLowerCase();
    });
    return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  }
  const label = GARDEN_AREA_LOCATION_LABELS[area.locationType];
  return area.lightSource?.trim() ? `${label}, ${area.lightSource.trim()}` : label;
}

/** Units a gift of produce can arrive in. The Harvest Log's five, plus the
 *  two ways a neighbour actually hands things over. */
export const RECEIVED_SHARE_UNITS = ['g', 'kg', 'oz', 'lb', 'count', 'bunch', 'bag'] as const;
