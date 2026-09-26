// What one phone actually sends the other.
//
// Agreed carrier: each person's own OneDrive or Google Drive, set up during
// pairing, with children inheriting the same location. This module is the
// PAYLOAD, deliberately independent of how it travels, so the same bytes work
// over a cloud folder now and over the local network later without being
// rewritten.
//
// THE SHAPE THAT MAKES THIS SMALL. A shared week is not a recipe dump. The
// reference database is bundled and version-stamped identically on both phones,
// so `linkedCuratedRecipeId` is a stable pointer and a day is a handful of short
// strings. That is only true while both sides are on the same reference
// database, which is exactly why the version travels with the payload and why a
// mismatch refuses the plan.
//
// WHAT DOES NOT TRAVEL, EVER. Condition codes and curated recipe ids. Not a
// symptom, not a lab result, not a healing stage, not a note, not a weight. The
// grant vocabulary has said so since partner links shipped, and a test asserts
// it on the text and on the shape rather than trusting the comment.
//
// SENDING ENFORCES THE GRANTS, NOT RECEIVING. What someone grants a partner is
// one-directional and stored on the sender's device, so the sender is the only
// side that can honour it. The receiving side takes absence of data as absence
// of a grant, the same reading lib/partners.ts already documents, which is why
// there is no second set of columns here to disagree with reality.
// WHAT VERSION 2 ADDED, 2026-09-22. A payload used to be a one-way
// statement: here are my conditions, here is my plan, replace what you had.
// Direct instruction the same day: "the communication flow as per what is
// being done between the user's devices needs to be the same kind of
// process that happens between partners, and their children, and where
// applicable, their care giver." So a payload now also carries the records
// of anything the two people hold BETWEEN them, and the receiving side
// merges them rather than replacing, which is what lib/peerMerge.ts does.
//
// The allowlist is applied HERE, on the way out, through tablesToSend.
// That is the same reason the condition list is filtered here rather than
// at a call site: a privacy decision is either enforced in one place or
// hoped for in several. lib/peerRelationships.ts holds the list itself.
//
// A version 1 payload is still read, since the other phone updates when it
// updates and a link that stops working on an app update is worse than one
// that carries less for a week.
import type { ShareGrants, ConnectionRole } from './partners';
import { tablesToSend } from './peerMerge';
import { cleanPeerPhotoPart, photosForPlan, type PeerPhotoPart } from './peerPhotos';
import type { Row, Tables } from './snapshotMerge';

export const SYNC_PAYLOAD_VERSION = 2;

/** Versions this app can read. Older ones carry less, never something wrong. */
export const READABLE_SYNC_PAYLOAD_VERSIONS: readonly number[] = [1, 2];

/** A slot in a shared day. Matches the generator's own three meals. */
export type SyncSlotName = 'breakfast' | 'lunch' | 'dinner';

export const SYNC_SLOT_NAMES: SyncSlotName[] = ['breakfast', 'lunch', 'dinner'];

export type SyncPlanDay = {
  /** YYYY-MM-DD. */
  date: string;
  slots: { slot: SyncSlotName; recipeIds: string[] }[];
};

export type SyncPayload = {
  v: 1 | 2;
  /** ISO timestamp, so the other side can say how fresh this is. */
  sentAt: string;
  /**
   * Which reference database the recipe ids were resolved against.
   *
   * The whole reason a plan can be a few hundred bytes. If the two phones are on
   * different reference databases, the same id can point at a different recipe,
   * and a plan that resolves to the wrong dish is worse than no plan.
   */
  referenceDbVersion: string;
  /** Short key fingerprint of the sending device, so the receiver can match it to a connection. */
  fromFingerprint: string;
  /** Present only when the sender granted conditions. */
  conditionCodes?: string[];
  /** Present only when the sender granted meals. */
  plan?: SyncPlanDay[];
  /**
   * The records of whatever this relationship holds between the two people,
   * version 2 onward, already cut down to what lib/peerRelationships.ts
   * says crosses. Merged on arrival, never used to replace.
   */
  shared?: Tables;
} & PeerPhotoPart;

/**
 * A received table of records, read back without trusting any of it.
 *
 * Rows only, flat values only. Anything nested is dropped rather than
 * passed through: a merge writes these straight into SQLite, and a column
 * holding an object is either a mistake or somebody probing.
 */
function cleanTables(value: unknown): Tables | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: Tables = {};
  for (const [table, rows] of Object.entries(value as Record<string, unknown>)) {
    if (!TABLE_NAME_SHAPE.test(table)) continue;
    if (!Array.isArray(rows)) continue;
    const kept: Row[] = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      const clean: Row = {};
      let usable = true;
      for (const [column, cell] of Object.entries(row as Record<string, unknown>)) {
        if (!TABLE_NAME_SHAPE.test(column)) { usable = false; break; }
        if (cell === null || typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') {
          clean[column] = cell;
        } else {
          usable = false;
          break;
        }
      }
      if (usable && Object.keys(clean).length > 0) kept.push(clean);
    }
    out[table] = kept;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Plain identifiers only, since these become table and column names in SQL. */
const TABLE_NAME_SHAPE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function cleanCodes(codes: readonly unknown[]): string[] {
  return [...new Set(codes.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).map((c) => c.trim()))].sort();
}

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

function cleanDay(day: unknown): SyncPlanDay | null {
  if (!day || typeof day !== 'object') return null;
  const raw = day as { date?: unknown; slots?: unknown };
  if (typeof raw.date !== 'string' || !DATE_SHAPE.test(raw.date)) return null;
  if (!Array.isArray(raw.slots)) return null;

  const slots: SyncPlanDay['slots'] = [];
  for (const entry of raw.slots) {
    if (!entry || typeof entry !== 'object') continue;
    const slotRaw = entry as { slot?: unknown; recipeIds?: unknown };
    if (typeof slotRaw.slot !== 'string') continue;
    if (!SYNC_SLOT_NAMES.includes(slotRaw.slot as SyncSlotName)) continue;
    if (!Array.isArray(slotRaw.recipeIds)) continue;
    const recipeIds = slotRaw.recipeIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    if (recipeIds.length === 0) continue;
    slots.push({ slot: slotRaw.slot as SyncSlotName, recipeIds });
  }
  if (slots.length === 0) return null;
  return { date: raw.date, slots };
}

/**
 * Assembles what to send, honouring the grants.
 *
 * The grants are read here rather than at a call site, so no caller can send a
 * condition list by passing the wrong argument. The same reasoning
 * buildPartnerInvite already follows, and for the same reason: this is the only
 * point where a privacy decision can be enforced rather than hoped for.
 */
export function buildSyncPayload(input: {
  role: ConnectionRole;
  grants: ShareGrants;
  myConditionCodes: string[];
  plan: SyncPlanDay[];
  referenceDbVersion: string;
  fromFingerprint: string;
  sentAt: string;
  /** Everything this device holds for the carried tables, unfiltered. */
  shared?: Tables;
  /** Photos of dishes, and what this phone says about theirs
   *  (lib/peerPhotosDb.ts). Cut down here to what the grants allow. */
  photos?: PeerPhotoPart;
}): SyncPayload {
  const payload: SyncPayload = {
    v: SYNC_PAYLOAD_VERSION,
    sentAt: input.sentAt,
    referenceDbVersion: input.referenceDbVersion,
    fromFingerprint: input.fromFingerprint,
  };
  if (input.grants.conditions) {
    const codes = cleanCodes(input.myConditionCodes);
    if (codes.length > 0) payload.conditionCodes = codes;
  }
  if (input.grants.meals) {
    const days = input.plan.map(cleanDay).filter((day): day is SyncPlanDay => day !== null);
    if (days.length > 0) payload.plan = days;
  }
  if (input.shared) {
    // The allowlist, applied on the way out. Handed the whole of what this
    // device holds and told who it is for, so a caller cannot widen it.
    const shared = tablesToSend(input.shared, { role: input.role, grants: input.grants });
    if (Object.keys(shared).length > 0) payload.shared = shared;
  }
  if (input.photos) {
    // A photo goes only beside the dish it is of, on a plan that is itself
    // going, and only with both Meals and Photos granted. What this phone
    // says about THEIR photos (arrived, asked for) is ids and nothing more,
    // so it always goes.
    const photos = input.photos;
    if (input.grants.meals && input.grants.photos && payload.plan) {
      const onPlan = new Set(payload.plan.flatMap((day) => day.slots.flatMap((slot) => slot.recipeIds)));
      const thumbs = photosForPlan(photos.photos ?? [], onPlan);
      if (thumbs.length > 0) payload.photos = thumbs;
      if (photos.photoFull?.length) payload.photoFull = photos.photoFull;
    }
    if (photos.photoAcks?.length) payload.photoAcks = photos.photoAcks;
    if (photos.photoFullAcks?.length) payload.photoFullAcks = photos.photoFullAcks;
    if (photos.photoRequests?.length) payload.photoRequests = photos.photoRequests;
  }
  return payload;
}

export type SyncReadResult = {
  payload: SyncPayload;
  /**
   * Whether the plan can be trusted to resolve to the same dishes here.
   *
   * False on a reference-database mismatch. The conditions are still usable in
   * that case, which is the distinction worth drawing: a condition code is a
   * plain, stable string, while a recipe id is a pointer into a specific
   * database.
   */
  planUsable: boolean;
  /** Why the plan was refused, if it was. */
  planRefusal: 'differentReferenceDatabase' | 'noPlanSent' | null;
};

/**
 * Reads a received payload, or returns null.
 *
 * Null for anything malformed rather than throwing, and every field normalised
 * rather than trusted. This sits on the boundary where data from another device
 * arrives, the same discipline decodeShareEnvelope and decodeConnectionInvite
 * already follow.
 */
export function readSyncPayload(
  raw: string,
  context: { myReferenceDbVersion: string },
): SyncReadResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const p = parsed as Partial<SyncPayload>;
  if (typeof p.v !== 'number' || !READABLE_SYNC_PAYLOAD_VERSIONS.includes(p.v)) return null;
  if (typeof p.sentAt !== 'string' || !p.sentAt.trim()) return null;
  if (typeof p.referenceDbVersion !== 'string' || !p.referenceDbVersion.trim()) return null;
  if (typeof p.fromFingerprint !== 'string' || !p.fromFingerprint.trim()) return null;

  const payload: SyncPayload = {
    // Kept as sent rather than restamped, so a caller can tell what the
    // other phone is able to do.
    v: p.v === 1 ? 1 : 2,
    sentAt: p.sentAt,
    referenceDbVersion: p.referenceDbVersion,
    fromFingerprint: p.fromFingerprint,
  };

  // Read back structurally only. WHICH tables are allowed is settled by
  // lib/peerMerge.ts against this link's own standing, which is the side
  // that knows the role and the grants; anything outside it is named and
  // left out there rather than quietly dropped here.
  const shared = cleanTables(p.shared);
  if (shared) payload.shared = shared;

  Object.assign(payload, cleanPeerPhotoPart(parsed as Record<string, unknown>));

  if (Array.isArray(p.conditionCodes)) {
    const codes = cleanCodes(p.conditionCodes);
    if (codes.length > 0) payload.conditionCodes = codes;
  }

  const sameDatabase = p.referenceDbVersion === context.myReferenceDbVersion;
  let planRefusal: SyncReadResult['planRefusal'] = null;

  if (Array.isArray(p.plan) && p.plan.length > 0) {
    if (sameDatabase) {
      const days = p.plan.map(cleanDay).filter((day): day is SyncPlanDay => day !== null);
      if (days.length > 0) payload.plan = days;
      else planRefusal = 'noPlanSent';
    } else {
      // Deliberately dropped rather than carried and marked. A caller holding a
      // plan it was told not to trust is one mistake away from using it.
      planRefusal = 'differentReferenceDatabase';
    }
  } else {
    planRefusal = 'noPlanSent';
  }

  return { payload, planUsable: Boolean(payload.plan), planRefusal };
}

/** Plain wording for what arrived. Never claims more than it received. */
export function describeSyncResult(result: SyncReadResult, partnerName: string): string {
  const parts: string[] = [];

  if (result.payload.conditionCodes?.length) {
    const n = result.payload.conditionCodes.length;
    parts.push(`${partnerName} shared ${n} ${n === 1 ? 'condition' : 'conditions'}.`);
  } else {
    parts.push(`${partnerName} did not share which conditions they track.`);
  }

  if (result.planUsable && result.payload.plan) {
    const n = result.payload.plan.length;
    parts.push(`Their plan covers ${n} ${n === 1 ? 'day' : 'days'}.`);
  } else if (result.planRefusal === 'differentReferenceDatabase') {
    parts.push(
      `Their meal plan could not be read, because their app is on a different version of the food database than yours. The same recipe number can mean a different dish, so it was left out rather than risk showing the wrong meal. Updating both apps fixes it.`,
    );
  } else {
    parts.push(`${partnerName} did not share a meal plan.`);
  }

  return parts.join(' ');
}

/**
 * How long ago a payload was written, in whole days, or null if unreadable.
 *
 * CALENDAR days, both sides normalised to midnight. Comparing the exact send
 * timestamp against midnight today under-counts anything sent later in the day:
 * something written at 9am seven days ago is six-and-a-bit days of elapsed time,
 * and reporting "6 days" for it reads as wrong to anyone who can count back on a
 * calendar. This is the same normalisation lib/partners.ts already uses to decide
 * whether a condition list has gone stale.
 */
export function daysSinceSent(sentAt: string, today: string): number | null {
  const a = Date.parse(`${sentAt.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}
