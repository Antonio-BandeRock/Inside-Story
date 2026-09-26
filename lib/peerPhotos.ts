// Photos between two people (1.0.53.7). Direct request: "I think the photos
// should be sharable between people, but I don't want to create a glut of
// traffic and data usage for full sized photos when the app itself can't
// maintain that much data."
//
// So a photo only travels with the thing it belongs to, and only in the
// small size unless somebody asks for more:
//
//   1. Only photos of dishes on a plan being shared travel, and only when
//      the sender has granted both Meals and Photos to that person.
//   2. The thumbnail goes by itself. The report size goes only when the
//      other person taps the thumbnail and asks for it.
//   3. Nothing is sent twice. The receiving phone says which photos arrived
//      (the acks), and a photo not acknowledged is offered again only after
//      a day, so a send that never landed heals without a flood.
//   4. Each send has a byte budget, since the relay carries 256 KB at most
//      and the rest of the payload has to fit beside the photos.
//   5. Photos wait for Wi-Fi by default. A phone whose network kind cannot
//      be read (every phone until expo-network ships in the R1 rebuild) is
//      treated as allowed, since holding photos back forever on a guess
//      would be worse than the traffic.
//
// Pure, with no imports, so scripts/test_media.js can check it. The tables,
// the files and the payload wiring are in lib/peerPhotosDb.ts.

export type PeerPhotoThumb = { id: string; recipeId: string; takenOn: string; caption: string | null; thumb: string };
export type PeerPhotoFull = { id: string; data: string };

/** The photo part of a sync payload. Every field is optional, and a payload
 *  without any of them is an older app or a person with Photos off. */
export type PeerPhotoPart = {
  photos?: PeerPhotoThumb[];
  photoFull?: PeerPhotoFull[];
  /** Ids of THEIR photos whose thumbnail arrived here. */
  photoAcks?: string[];
  /** Ids of THEIR photos whose report size arrived here. */
  photoFullAcks?: string[];
  /** Ids of THEIR photos this person asked to see larger. */
  photoRequests?: string[];
};

export const PEER_PHOTO_RESEND_AFTER_MS = 24 * 60 * 60 * 1000;

/** What the photos in one send may add up to, as base64 text. The relay's
 *  256 KB limit is the whole wire, so it gets a small share of it and
 *  carries thumbnails only. */
export const PEER_PHOTO_BUDGET_RELAY = 150 * 1024;
export const PEER_PHOTO_BUDGET_DIRECT = 4 * 1024 * 1024;

/** At most this many ids in each list, so a list is never the traffic. */
export const PEER_PHOTO_LIST_LIMIT = 50;

export type NetworkKind = 'wifi' | 'mobile' | 'other' | 'unknown';

export function photosMayTravel(network: NetworkKind, wifiOnly: boolean): boolean {
  return !(wifiOnly && network === 'mobile');
}

/** One photo sent to one person: when it went and whether it arrived. */
export type OutgoingState = { sentAt: string | null; ackedAt: string | null };

function due(state: OutgoingState | undefined, now: number): boolean {
  if (!state) return true;
  if (state.ackedAt) return false;
  if (!state.sentAt) return true;
  const sent = Date.parse(state.sentAt);
  return !Number.isFinite(sent) || now - sent >= PEER_PHOTO_RESEND_AFTER_MS;
}

export type ThumbCandidate = { id: string; recipeId: string; takenOn: string; base64Length: number };
export type FullCandidate = { id: string; base64Length: number };

/**
 * Which thumbnails and report-size photos go in this send. Report sizes that
 * were asked for go first, since somebody is waiting on them, then the
 * newest thumbnails, each only while it fits the budget.
 */
export function choosePeerPhotos(input: {
  thumbs: readonly ThumbCandidate[];
  thumbState: ReadonlyMap<string, OutgoingState>;
  requestedFull: readonly FullCandidate[];
  fullState: ReadonlyMap<string, OutgoingState>;
  budget: number;
  now: number;
}): { thumbIds: string[]; fullIds: string[] } {
  let left = input.budget;
  const fullIds: string[] = [];
  for (const candidate of input.requestedFull) {
    if (!due(input.fullState.get(candidate.id), input.now)) continue;
    if (candidate.base64Length > left) continue;
    fullIds.push(candidate.id);
    left -= candidate.base64Length;
  }
  const thumbIds: string[] = [];
  const newestFirst = [...input.thumbs].sort((a, b) =>
    a.takenOn === b.takenOn ? b.id.localeCompare(a.id) : b.takenOn.localeCompare(a.takenOn),
  );
  for (const candidate of newestFirst) {
    if (thumbIds.length >= PEER_PHOTO_LIST_LIMIT) break;
    if (!due(input.thumbState.get(candidate.id), input.now)) continue;
    if (candidate.base64Length > left) continue;
    thumbIds.push(candidate.id);
    left -= candidate.base64Length;
  }
  return { thumbIds, fullIds };
}

/**
 * The photos a payload may carry, given what it carries otherwise. A photo
 * of a dish goes only while that dish is on the plan being sent, so a photo
 * can never reach somebody by a route other than the thing it is of.
 */
export function photosForPlan<T extends { recipeId: string }>(photos: readonly T[], planRecipeIds: ReadonlySet<string>): T[] {
  return photos.filter((photo) => planRecipeIds.has(photo.recipeId));
}

/** Of several photos of one dish, the newest, which is the one that goes. */
export function newestPerRecipe<T extends { id: string; recipeId: string; takenOn: string }>(photos: readonly T[]): T[] {
  const best = new Map<string, T>();
  for (const photo of photos) {
    const held = best.get(photo.recipeId);
    if (!held || photo.takenOn > held.takenOn || (photo.takenOn === held.takenOn && photo.id > held.id)) {
      best.set(photo.recipeId, photo);
    }
  }
  return [...best.values()];
}

const ID_SHAPE = /^[A-Za-z0-9_:-]{1,120}$/;
const DAY_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
const BASE64_SHAPE = /^[A-Za-z0-9+/]+={0,2}$/;

/** Largest file accepted from another phone, as base64 text: a thumbnail
 *  is kept under 50 KB and a report size under 600 KB, with room over. */
export const PEER_MAX_THUMB_BASE64 = 100 * 1024;
export const PEER_MAX_FULL_BASE64 = 1100 * 1024;

export function isPeerPhotoId(value: unknown): value is string {
  return typeof value === 'string' && ID_SHAPE.test(value);
}

function cleanIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = [...new Set(value.filter(isPeerPhotoId))].slice(0, PEER_PHOTO_LIST_LIMIT);
  return ids.length > 0 ? ids : undefined;
}

/** Reads the photo part of a received payload without trusting any of it. */
export function cleanPeerPhotoPart(raw: Record<string, unknown>): PeerPhotoPart {
  const out: PeerPhotoPart = {};
  if (Array.isArray(raw.photos)) {
    const photos: PeerPhotoThumb[] = [];
    for (const entry of raw.photos) {
      if (!entry || typeof entry !== 'object') continue;
      const p = entry as Record<string, unknown>;
      if (!isPeerPhotoId(p.id) || !isPeerPhotoId(p.recipeId)) continue;
      if (typeof p.takenOn !== 'string' || !DAY_SHAPE.test(p.takenOn)) continue;
      if (typeof p.thumb !== 'string' || p.thumb.length > PEER_MAX_THUMB_BASE64 || !BASE64_SHAPE.test(p.thumb)) continue;
      const caption = typeof p.caption === 'string' && p.caption.trim() ? p.caption.trim().slice(0, 200) : null;
      photos.push({ id: p.id, recipeId: p.recipeId, takenOn: p.takenOn, caption, thumb: p.thumb });
    }
    if (photos.length > 0) out.photos = photos.slice(0, PEER_PHOTO_LIST_LIMIT);
  }
  if (Array.isArray(raw.photoFull)) {
    const full: PeerPhotoFull[] = [];
    for (const entry of raw.photoFull) {
      if (!entry || typeof entry !== 'object') continue;
      const p = entry as Record<string, unknown>;
      if (!isPeerPhotoId(p.id)) continue;
      if (typeof p.data !== 'string' || p.data.length > PEER_MAX_FULL_BASE64 || !BASE64_SHAPE.test(p.data)) continue;
      full.push({ id: p.id, data: p.data });
    }
    if (full.length > 0) out.photoFull = full.slice(0, PEER_PHOTO_LIST_LIMIT);
  }
  const acks = cleanIds(raw.photoAcks);
  if (acks) out.photoAcks = acks;
  const fullAcks = cleanIds(raw.photoFullAcks);
  if (fullAcks) out.photoFullAcks = fullAcks;
  const requests = cleanIds(raw.photoRequests);
  if (requests) out.photoRequests = requests;
  return out;
}

export const PEER_PHOTO_TAP_LINE = 'Tap a photo to ask for the larger one.';

export function peerPhotoAskedLine(name: string): string {
  return `Asked for. The larger photo comes the next time ${name}'s phone sends.`;
}

export const PEER_PHOTOS_WIFI_ONLY_LABEL = 'Send and fetch shared photos on Wi-Fi only';

export const PEER_PHOTOS_WIFI_ONLY_WHAT =
  'Photos of shared meals wait until this phone is on Wi-Fi. The plan and the list still go straight away. Until the next app build this phone cannot tell Wi-Fi from mobile data, so for now photos go either way.';
