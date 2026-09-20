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
//   3. The netting is garden-wide, never per crop. A bag of fertilizer feeds
//      the whole bed; charging it to the tomatoes would be an invented
//      split, so a cost's plot link is a note and not an allocation.
//
// Kitchen scraps, raked leaves and grass clippings are what make the compost
// side free, which is exactly the instruction's point: only what was BOUGHT
// is a cost, and a compost pile fed from the kitchen carries none.

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

/** Units a gift of produce can arrive in. The Harvest Log's five, plus the
 *  two ways a neighbour actually hands things over. */
export const RECEIVED_SHARE_UNITS = ['g', 'kg', 'oz', 'lb', 'count', 'bunch', 'bag'] as const;
