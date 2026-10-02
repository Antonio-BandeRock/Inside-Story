// Seed inventory (I9, 2026-10-02): the packets a person has on hand, before
// any of them goes into the ground. Each packet records the crop, the
// variety, where it came from, the year or day it was packed for, how much
// is in it and the days to maturity it gives. A planting can be sown from a
// packet, which takes the amount sown off what the packet has left, and a
// germination test ("8 of 10 sprouted") can be recorded against it.
//
// How long a crop's seed keeps comes from one published table, Colorado
// State University Extension's "Storing Vegetable and Flower Seeds", given
// as a guide in years under cool, dry storage and never as a date the seed
// stops working. Celeriac is left out because that table lists it twice,
// under 3 years and under 4. A crop the table does not name shows its age
// with no figure beside it rather than a guessed one.
//
// Nothing here grades a packet. An old packet is not called bad, a low test
// is not called poor; the sentences say what the record holds and what a
// germination test would show.
//
// Pure, no React and no database, so scripts/test_seed_inventory.js can
// check it; reading and writing are in lib/seedInventoryDb.ts.

import { findCropGuide } from './cropGuides';

export const SEED_STOCK_OWNER_KIND = 'seed_stock';

export type SeedUnit = 'seeds' | 'grams' | 'packets';

/** In natural order, smallest thing counted first. */
export const SEED_UNITS: { code: SeedUnit; label: string }[] = [
  { code: 'seeds', label: 'Seeds' },
  { code: 'grams', label: 'Grams' },
  { code: 'packets', label: 'Packets' },
];

export type SeedPacket = {
  id: string;
  foodId: number | null;
  source: string | null;
  foodName: string;
  variety: string | null;
  fromWhere: string | null;
  packedOn: string | null;
  amount: number | null;
  amountUnit: SeedUnit | null;
  packetDays: number | null;
  notes: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type SeedUse = {
  id: string;
  seedId: string;
  plantingId: string | null;
  usedOn: string;
  amount: number | null;
  /** The planting's crop and area, read at the time, for the line. */
  plantingLabel: string | null;
};

export type SeedTest = {
  id: string;
  seedId: string;
  testedOn: string;
  sown: number;
  sprouted: number;
};

export const SEED_LONGEVITY_SOURCE = {
  title: 'Storing Vegetable and Flower Seeds, Colorado State University Extension',
  url: 'https://extension.colostate.edu/resource/storing-vegetable-and-flower-seeds/',
};

/** Years each crop's seed keeps in cool, dry storage, by crop guide key,
 *  from Table 1 of the source above. "Beans" there is the garden bean, so
 *  it is given to green, runner and dry beans and not to broad beans, which
 *  are a different plant. Muskmelon is given to melon, and summer squash
 *  to courgette. */
export const SEED_KEEPS_YEARS: Record<string, number> = {
  lettuce: 1,
  onion: 1,
  parsley: 1,
  parsnip: 1,
  sweetcorn: 2,
  leek: 2,
  okra: 2,
  pepper: 2,
  asparagus: 3,
  greenbeans: 3,
  runnerbeans: 3,
  drybeans: 3,
  broccoli: 3,
  carrot: 3,
  celery: 3,
  kohlrabi: 3,
  peas: 3,
  spinach: 3,
  beetroot: 4,
  brussels: 4,
  cabbage: 4,
  cauliflower: 4,
  chard: 4,
  aubergine: 4,
  kale: 4,
  radish: 4,
  squash: 4,
  courgette: 4,
  tomato: 4,
  turnip: 4,
  cucumber: 5,
  melon: 5,
};

export function seedKeepsYears(foodName: string | null | undefined): number | null {
  const guide = findCropGuide(foodName);
  if (!guide) return null;
  return SEED_KEEPS_YEARS[guide.key] ?? null;
}

/** A packet's date as typed: a year ("2025"), a month ("2025-03") or a
 *  day ("2025-03-14"). Packets usually print the year they were packed
 *  for, so a year alone is enough. Null for anything else. */
export function readPackedOn(text: string): { status: 'empty' } | { status: 'date'; value: string } | { status: 'invalid' } {
  const t = text.trim();
  if (!t) return { status: 'empty' };
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(t);
  if (!m) return { status: 'invalid' };
  const year = Number(m[1]);
  if (year < 1950 || year > 2200) return { status: 'invalid' };
  if (m[2]) {
    const month = Number(m[2]);
    if (month < 1 || month > 12) return { status: 'invalid' };
  }
  if (m[3]) {
    const day = Number(m[3]);
    if (day < 1 || day > 31) return { status: 'invalid' };
  }
  return { status: 'date', value: t };
}

/** How many whole growing years have passed since the packet's year: a
 *  packet for this year is 0, one for last year is 1. Counted by year
 *  because that is what a packet prints, and what the keeping table means. */
export function packetAgeYears(packedOn: string | null, today: string): number | null {
  if (!packedOn) return null;
  const packed = Number(packedOn.slice(0, 4));
  const now = Number(today.slice(0, 4));
  if (!packed || !now) return null;
  return Math.max(0, now - packed);
}

function years(n: number): string {
  return n === 1 ? '1 year' : `${n} years`;
}

/** The line about a packet's age and how long its crop's seed keeps. */
export function describeKeeping(foodName: string, packedOn: string | null, today: string): string {
  const age = packetAgeYears(packedOn, today);
  const keeps = seedKeepsYears(foodName);
  const ageLine =
    age === null
      ? 'No packing date recorded.'
      : age === 0
        ? `Packed for ${packedOn!.slice(0, 4)}, this year.`
        : `Packed for ${packedOn!.slice(0, 4)}, ${years(age)} ago.`;
  if (keeps === null) return ageLine;
  const keepLine = `${foodName} seed keeps about ${years(keeps)} in cool, dry storage, as a guide.`;
  if (age !== null && age > keeps) {
    return `${ageLine} ${keepLine} This packet is past that, and a germination test shows how much of it still sprouts.`;
  }
  return `${ageLine} ${keepLine}`;
}

/** A whole or decimal amount, above zero. Blank is allowed. */
export function readAmount(text: string): { status: 'empty' } | { status: 'amount'; value: number } | { status: 'invalid' } {
  const t = text.trim().replace(',', '.');
  if (!t) return { status: 'empty' };
  if (!/^\d+(?:\.\d+)?$/.test(t)) return { status: 'invalid' };
  const value = Number(t);
  if (!(value > 0) || value > 100000) return { status: 'invalid' };
  return { status: 'amount', value };
}

export function formatAmount(amount: number, unit: SeedUnit | null): string {
  const n = Number(amount.toFixed(2));
  if (unit === 'grams') return `${n} g`;
  if (unit === 'packets') return n === 1 ? '1 packet' : `${n} packets`;
  return n === 1 ? '1 seed' : `${n} seeds`;
}

/** What is left: the packet's amount less every amount sown from it.
 *  Null when the packet's amount was never recorded. Never below zero, and
 *  `over` says when more was recorded as sown than the packet held. */
export function remainingAmount(packet: Pick<SeedPacket, 'amount'>, uses: readonly Pick<SeedUse, 'amount'>[]): { left: number; over: boolean } | null {
  if (packet.amount === null) return null;
  const used = uses.reduce((sum, use) => sum + (use.amount ?? 0), 0);
  const left = packet.amount - used;
  return { left: Math.max(0, Number(left.toFixed(2))), over: left < -1e-9 };
}

export function describeRemaining(packet: Pick<SeedPacket, 'amount' | 'amountUnit'>, uses: readonly Pick<SeedUse, 'amount'>[]): string {
  const rem = remainingAmount(packet, uses);
  if (!rem) return uses.length === 0 ? 'No amount recorded.' : `Sown from ${uses.length === 1 ? 'once' : `${uses.length} times`}, with no amount recorded for the packet.`;
  const start = formatAmount(packet.amount!, packet.amountUnit);
  if (uses.length === 0) return `${start} in the packet.`;
  if (rem.over) return `More recorded as sown than the ${start} the packet held.`;
  return `${formatAmount(rem.left, packet.amountUnit)} left of ${start}.`;
}

/** A test's two counts, as typed. */
export function readTest(sownText: string, sproutedText: string): { status: 'ok'; sown: number; sprouted: number } | { status: 'invalid'; message: string } {
  const sown = sownText.trim();
  const sprouted = sproutedText.trim();
  if (!/^\d+$/.test(sown) || !/^\d+$/.test(sprouted)) return { status: 'invalid', message: 'Two whole numbers: how many were set to sprout, and how many did.' };
  const a = Number(sown);
  const b = Number(sprouted);
  if (a < 1 || a > 1000) return { status: 'invalid', message: 'Between 1 and 1000 seeds set to sprout.' };
  if (b > a) return { status: 'invalid', message: 'More sprouted than were set to sprout.' };
  return { status: 'ok', sown: a, sprouted: b };
}

/** "8 of 10 sprouted. At that rate, about 13 seeds give 10 seedlings." */
export function describeTest(test: Pick<SeedTest, 'sown' | 'sprouted'>): string {
  const head = `${test.sprouted} of ${test.sown} sprouted.`;
  if (test.sprouted === 0) return `${head} None came up in this test.`;
  if (test.sprouted === test.sown) return `${head} Every seed in the test came up.`;
  const forTen = Math.ceil((10 * test.sown) / test.sprouted);
  return `${head} At that rate, about ${forTen} seeds give 10 seedlings.`;
}

/** The folded line for a packet: crop and variety. */
export function packetTitle(packet: Pick<SeedPacket, 'foodName' | 'variety'>): string {
  return packet.variety && packet.variety.trim() ? `${packet.foodName}, ${packet.variety.trim()}` : packet.foodName;
}

/** Packets that could be sown as this planting: the same food, or the
 *  same crop by its growing guide, still on hand. Put-away packets are
 *  left out. */
export function packetsForCrop<T extends Pick<SeedPacket, 'foodId' | 'source' | 'foodName' | 'finishedAt'>>(
  packets: readonly T[],
  food: { foodId: number | null; source: string | null; name: string },
): T[] {
  const guide = findCropGuide(food.name);
  return packets.filter((p) => {
    if (p.finishedAt) return false;
    if (food.foodId !== null && p.foodId === food.foodId && p.source === food.source) return true;
    const other = findCropGuide(p.foodName);
    return guide !== null && other !== null && other.key === guide.key;
  });
}

/** A packet with anything recorded against it is put away rather than
 *  deleted, so a planting still says which packet it came from. */
export function canDeletePacket(useCount: number, testCount: number): boolean {
  return useCount === 0 && testCount === 0;
}

export const SEEDS_INTRO =
  'The seed packets you have on hand. Each one keeps its variety, where it came from, the year it was packed for and how much is in it. Sowing a planting from a packet takes what was sown off what it has left.';

export const SEEDS_TEST_HOW =
  'Fold a damp paper towel around a counted number of seeds, ten is easy to read, keep it in a bag somewhere warm, and count what has sprouted after the days the packet gives for coming up.';

export const SEEDS_PUT_AWAY_NOTE =
  'Packets put away stay here with what was sown from them, so a planting still says which packet it came from.';

export const SEED_USE_CAPTION = 'How much of the packet went into this sowing, in the unit the packet is counted in.';
