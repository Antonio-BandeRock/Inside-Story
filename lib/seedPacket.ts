// What a seed packet says about a planting (I17, 2026-09-28): the variety as
// printed, the days to maturity when the packet gives them, and a photo of
// the packet itself (media owner kind 'seed_packet', keyed by the planting's
// id, so it stays apart from the planting's growing photos).
//
// A barcode on a seed packet rarely resolves to a variety in any open
// database, so the packet is photographed and the variety typed. A lookup
// would be a job for the external data Worker (Z8), and is not built.
//
// Days to maturity are counted from the day the planting went in. A packet
// counts from sowing for a crop sown where it grows and from planting out
// for one raised elsewhere first, and either way that is the day the
// planting records. The packet's figure replaces the crop guide's window,
// since it is about this variety rather than the crop in general.
//
// Built without the database so node scripts/test_seed_packet.js can check
// it; reading and writing are in lib/seedPacketDb.ts.

export const SEED_PACKET_OWNER_KIND = 'seed_packet';

/** A packet's figure falls in this range; anything outside is a typing slip. */
export const PACKET_DAYS_MIN = 10;
export const PACKET_DAYS_MAX = 400;

export type PacketDaysReading = { status: 'empty' } | { status: 'days'; days: number } | { status: 'invalid' };

/** Reads the days to maturity typed from a packet. Blank is allowed. */
export function readPacketDays(text: string): PacketDaysReading {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'empty' };
  if (!/^\d+$/.test(trimmed)) return { status: 'invalid' };
  const days = Number(trimmed);
  if (days < PACKET_DAYS_MIN || days > PACKET_DAYS_MAX) return { status: 'invalid' };
  return { status: 'days', days };
}

export function packetDaysRangeLine(): string {
  return `A whole number of days, ${PACKET_DAYS_MIN} to ${PACKET_DAYS_MAX}.`;
}

/** The day that is `days` after `plantedOn`, both "YYYY-MM-DD". */
export function packetHarvestDate(plantedOn: string, days: number): string {
  const [y, m, d] = plantedOn.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The caption under the days field once a figure has been read. */
export function packetHarvestLine(days: number, harvestDayLabel: string): string {
  return `First harvest about ${harvestDayLabel}, ${days} days from the day it went in, as the packet gives it. This replaces the usual window for the crop.`;
}

/** The folded line on a planting, saying what the packet has given. */
export function seedPacketSummary(variety: string | null, packetDays: number | null, photoCount: number): string {
  const parts: string[] = [];
  if (variety && variety.trim()) parts.push(variety.trim());
  if (packetDays !== null) parts.push(`${packetDays} days on the packet`);
  if (photoCount > 0) parts.push(photoCount === 1 ? '1 photo' : `${photoCount} photos`);
  return parts.length ? parts.join(', ') : 'No variety or packet recorded';
}

export const SEED_PACKET_CAPTION =
  'The variety as the packet prints it, and its days to maturity if it gives them. A photo keeps the rest of the packet: the seller, the lot and the year it was packed for.';
