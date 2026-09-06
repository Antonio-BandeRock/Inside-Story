// Step 3 of the real device-pairing prerequisite list -- see CLAUDE.md's
// own "Sharing individual recipes between two people" security-
// requirement note -- 2026-08-15, direct request: "Let's start on step 3,
// the Connections table."
//
// A real, standing local roster of people this device has actually
// paired with, so a later share to the same person doesn't need to
// re-pair every time. This file is deliberately just the table's own real
// CRUD -- the schema itself (`connections`, see lib/db.ts's own
// initializeDatabase) is owned there, matching this whole app's own
// established split: table/migration ownership stays centralized in
// lib/db.ts, while a given table's real business-logic functions live in
// whichever leaf module actually makes sense (the same real precedent
// lib/sharing.ts already set for `shared_recipes`).
//
// Steps 4 and 5 are since built: app/connect.tsx is the accept screen the
// invite below lands on, and lib/sharing.ts verifies every received payload
// against a key from this table. CLAUDE.md still describes the whole list as
// unstarted, which is stale rather than true.
//
// PARTNER LINKS, 2026-09-06. A row here is now either someone you send a
// recipe to or someone you plan meals with, distinguished by role rather than
// by living in a second table: your sister can be both, and two tables would
// guarantee her key goes stale in one of them. See lib/partners.ts for what a
// partner link actually means and for every rule about what may cross.
import { getDatabase, getUserConditions, getUserProfile } from './db';
import { getDeviceIdentity } from './deviceIdentity';
import { decodeBase64Utf8, encodeBase64Utf8 } from './sharing';
import { canEncryptTo } from './partnerCrypto';
import { defaultGrantsForRole, type ConnectionRole, type ShareGrants } from './partners';

export type Connection = {
  id: string;
  name: string;
  publicKeyBase64: string;
  /** X25519, for sealing something only they can read. Null if they paired before this existed. */
  encryptionPublicKeyBase64: string | null;
  pairedAt: string;
  role: ConnectionRole;
  /** Their claim that they added you back. See markTheyHaveMe below. */
  theyHaveMeAt: string | null;
  fingerprintVerifiedAt: string | null;
  /** What YOU grant THEM. One direction only. */
  grants: ShareGrants;
  /** Condition codes they shared. Never anything else about their health. */
  theirConditionCodes: string[];
  theirConditionsAt: string | null;
};

type ConnectionRow = {
  id: string;
  name: string;
  public_key_base64: string;
  encryption_public_key_base64: string | null;
  paired_at: string;
  role: string | null;
  they_have_me_at: string | null;
  fingerprint_verified_at: string | null;
  share_meals: number | null;
  share_shopping: number | null;
  share_conditions: number | null;
  their_condition_codes_json: string | null;
  their_conditions_at: string | null;
};

// Every SELECT in this file uses this, so a column added later cannot reach
// some reads and miss others.
const CONNECTION_COLUMNS = `
  id, name, public_key_base64, encryption_public_key_base64, paired_at, role, they_have_me_at,
  fingerprint_verified_at, share_meals, share_shopping, share_conditions,
  their_condition_codes_json, their_conditions_at
`;

function fromRow(row: ConnectionRow): Connection {
  let theirConditionCodes: string[] = [];
  // Defensive parse. This value arrived from another device, so a malformed
  // one is a real possibility rather than a theoretical one, and an empty
  // list is the honest reading of unreadable rather than a thrown error that
  // would take a whole screen down.
  if (row.their_condition_codes_json) {
    try {
      const parsed = JSON.parse(row.their_condition_codes_json);
      if (Array.isArray(parsed)) theirConditionCodes = parsed.filter((entry): entry is string => typeof entry === 'string');
    } catch {
      theirConditionCodes = [];
    }
  }
  return {
    id: row.id,
    name: row.name,
    publicKeyBase64: row.public_key_base64,
    // Null for anyone paired before 2026-09-06. Nothing can be encrypted to
    // them until they pair again, and the screens say so rather than looking
    // ready to share.
    encryptionPublicKeyBase64: row.encryption_public_key_base64,
    pairedAt: row.paired_at,
    // A row migrated from before roles existed is a recipe connection, which
    // is what every connection made before 2026-09-06 was for.
    role: row.role === 'partner' ? 'partner' : 'recipe',
    theyHaveMeAt: row.they_have_me_at,
    fingerprintVerifiedAt: row.fingerprint_verified_at,
    // Number() rather than === 1, as a belt-and-braces guard: these columns
    // are INTEGER on both paths (verified against a scratch database), and
    // this still holds if one ever slips through as TEXT.
    grants: {
      meals: Number(row.share_meals) === 1,
      shopping: Number(row.share_shopping) === 1,
      conditions: Number(row.share_conditions) === 1,
    },
    theirConditionCodes,
    theirConditionsAt: row.their_conditions_at,
  };
}

// Real, deliberate parity with lib/deviceIdentity.ts's own publicKeyBase64
// field -- both this table and this app's own device identity encode a
// real Ed25519 public key the identical way, so a value read from one is
// always directly comparable to the other with no re-encoding step.
export async function addConnection(
  name: string,
  publicKeyBase64: string,
  options: { role?: ConnectionRole; grants?: ShareGrants; encryptionPublicKeyBase64?: string | null } = {},
): Promise<Connection> {
  const db = await getDatabase();
  const id = `connection_${Date.now()}`;
  const trimmedName = name.trim();
  const role: ConnectionRole = options.role ?? 'recipe';
  // Grants default from the role rather than to nothing, so a partner starts
  // sharing meals and shopping and deliberately NOT conditions.
  const grants = options.grants ?? defaultGrantsForRole(role);
  await db.runAsync(
    `INSERT INTO connections (id, name, public_key_base64, encryption_public_key_base64, role, share_meals, share_shopping, share_conditions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    trimmedName || 'Unnamed connection',
    publicKeyBase64,
    options.encryptionPublicKeyBase64 ?? null,
    role,
    grants.meals ? 1 : 0,
    grants.shopping ? 1 : 0,
    grants.conditions ? 1 : 0,
  );
  const row = await db.getFirstAsync<ConnectionRow>(`SELECT ${CONNECTION_COLUMNS} FROM connections WHERE id = ?`, id);
  if (!row) throw new Error('Failed to save the new connection.');
  return fromRow(row);
}

// Alphabetical by name -- the same real "recognize by who they are"
// browsing order this app already establishes for every other roster a
// person picks a real, known individual from (Profile's own tracked-
// condition list, food-allergy list, etc.), not insertion/pairing order.
export async function listConnections(): Promise<Connection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ConnectionRow>(`SELECT ${CONNECTION_COLUMNS} FROM connections ORDER BY name COLLATE NOCASE ASC`);
  return rows.map(fromRow);
}

export async function getConnection(id: string): Promise<Connection | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ConnectionRow>(`SELECT ${CONNECTION_COLUMNS} FROM connections WHERE id = ?`, id);
  return row ? fromRow(row) : null;
}

// The real, direct lookup step 5's own signature-verification flow will
// need: given a public key a signed payload claims to be from, is this
// actually someone the person has paired with at all. Built now, alongside
// the rest of this table's real CRUD, rather than added later as a second
// pass over the identical table.
export async function getConnectionByPublicKey(publicKeyBase64: string): Promise<Connection | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ConnectionRow>(
    `SELECT ${CONNECTION_COLUMNS} FROM connections WHERE public_key_base64 = ?`,
    publicKeyBase64,
  );
  return row ? fromRow(row) : null;
}

export async function renameConnection(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  const trimmedName = name.trim();
  if (!trimmedName) return;
  await db.runAsync('UPDATE connections SET name = ? WHERE id = ?', trimmedName, id);
}

export async function removeConnection(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM connections WHERE id = ?', id);
}

// --- Partner links -----------------------------------------------------

export async function listPartners(): Promise<Connection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ConnectionRow>(
    `SELECT ${CONNECTION_COLUMNS} FROM connections WHERE role = 'partner' ORDER BY name COLLATE NOCASE ASC`,
  );
  return rows.map(fromRow);
}

/**
 * The one partner a meal plan is built around.
 *
 * Nothing stops a person marking two people as partners, and nothing here
 * pretends to resolve that: the first by name is used and the caller is left
 * able to see there is more than one. Planning one dinner around three sets of
 * conditions is a different feature from the one that was asked for, and
 * guessing which two of the three to use would be worse than saying so.
 */
export async function getMealPlanningPartner(): Promise<{ partner: Connection | null; others: number }> {
  const partners = await listPartners();
  return { partner: partners[0] ?? null, others: Math.max(0, partners.length - 1) };
}

export async function setConnectionRole(id: string, role: ConnectionRole): Promise<void> {
  const db = await getDatabase();
  // Grants are reset to the new role default rather than carried across.
  // Demoting a partner back to recipes-only has to stop the sharing it was
  // granted, or the row would keep permissions its role no longer implies.
  const grants = defaultGrantsForRole(role);
  await db.runAsync(
    'UPDATE connections SET role = ?, share_meals = ?, share_shopping = ?, share_conditions = ? WHERE id = ?',
    role,
    grants.meals ? 1 : 0,
    grants.shopping ? 1 : 0,
    grants.conditions ? 1 : 0,
    id,
  );
  // Their conditions are dropped on demotion. Keeping a diagnosis list for
  // someone you are no longer planning meals with would be holding health
  // data for no remaining reason.
  if (role !== 'partner') {
    await db.runAsync(
      'UPDATE connections SET their_condition_codes_json = NULL, their_conditions_at = NULL WHERE id = ?',
      id,
    );
  }
}

export async function setConnectionGrants(id: string, grants: ShareGrants): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE connections SET share_meals = ?, share_shopping = ?, share_conditions = ? WHERE id = ?',
    grants.meals ? 1 : 0,
    grants.shopping ? 1 : 0,
    grants.conditions ? 1 : 0,
    id,
  );
}

/**
 * Records that they say they have added you.
 *
 * A CLAIM carried over the same out-of-band channel the invite itself came
 * through, not proof. Pairing cannot prove anything before the keys are
 * exchanged, which is the bootstrapping problem the comment further down this
 * file already explains. So this is named for what it is, and the wording in
 * lib/partners.ts never calls it verified.
 */
export async function markTheyHaveMe(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE connections SET they_have_me_at = ? WHERE id = ? AND they_have_me_at IS NULL',
    new Date().toISOString(),
    id,
  );
}

// Only ever set by the two people saying they compared the code, never
// inferred. An app cannot know whether two people read four words to each
// other, and claiming it did would make the one real defence here worthless.
export async function markFingerprintVerified(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE connections SET fingerprint_verified_at = ? WHERE id = ?', new Date().toISOString(), id);
}

/**
 * Stores the condition codes a partner sent.
 *
 * Codes only, and filtered to strings on the way in, because this arrived from
 * another device. Replaces rather than merges: their current list is the whole
 * truth, and a condition they stopped tracking has to be able to disappear.
 */
export async function setPartnerConditionCodes(id: string, codes: string[]): Promise<void> {
  const db = await getDatabase();
  const clean = [...new Set(codes.filter((code) => typeof code === 'string' && code.trim().length > 0))].sort();
  await db.runAsync(
    'UPDATE connections SET their_condition_codes_json = ?, their_conditions_at = ? WHERE id = ?',
    JSON.stringify(clean),
    new Date().toISOString(),
    id,
  );
}

/**
 * Fills in an encryption key for someone already paired.
 *
 * This is what saves anyone paired before 2026-09-06 from having to remove the
 * connection and start over. Showing each other a code again lands on the
 * "already connected" path, and this backfills the key from that invite, so
 * catching up costs one scan rather than an unpair and a re-pair.
 *
 * Only ever fills a gap. An existing key is left alone, because silently
 * replacing the key someone's data is sealed to is how a partner link would
 * break in a way nobody could see.
 */
export async function fillMissingEncryptionKey(id: string, encryptionPublicKeyBase64: string): Promise<boolean> {
  if (!canEncryptTo(encryptionPublicKeyBase64)) return false;
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE connections SET encryption_public_key_base64 = ?
     WHERE id = ? AND (encryption_public_key_base64 IS NULL OR encryption_public_key_base64 = '')`,
    encryptionPublicKeyBase64,
    id,
  );
  return result.changes > 0;
}

// --- The real invitation exchange itself -------------------------------
//
// Deliberately a single, symmetric payload shape -- no separate "invite"
// vs. "accept-reply" message types. Both people send each other exactly
// this same kind of message (each carrying their own real device identity)
// and each independently, explicitly accepts what they receive -- the
// mutual, two-sided connection this feature needs comes from BOTH people
// doing this once each, not from one stateful multi-step handshake. This
// also mirrors how this app's own existing recipe-sharing feature already
// works (lib/sharing.ts): one real message type, sent, received, and
// explicitly accepted or discarded on the far end.
//
// There is deliberately no signature on this payload -- there is nothing
// valid to check one against yet from the recipient's own side (you can't
// verify a signature from someone whose public key you don't have until
// AFTER accepting this exact message; that's the real bootstrapping
// problem every no-server key-exchange protocol has to solve the same
// way). The real security property here is the explicit human accept step
// plus trusting the out-of-band channel the invite actually arrived
// through (the same channel a person already trusts enough to text/
// message the right individual in the first place) -- not a cryptographic
// guarantee during pairing itself. Real signature verification is step
// 5's own job, using the real public key this exchange hands over.
// v2 adds what the link is FOR, what the sender is offering, and one honest
// flag. The symmetric shape above is deliberately kept: there is still exactly
// one message type, sent by both people, rather than an invite and a separate
// reply. alreadyHaveYou is how the second sender says "I have added you",
// which is what lets the first sender stop showing a one-way link as finished.
// It is a claim over a trusted channel, not proof, and nothing here says
// otherwise.
//
// conditionCodes travels ONLY when the sender granted it. Codes, never a
// symptom, a lab result, a healing stage or a note. See lib/partners.ts.
export type ConnectionInvite = {
  v: 1 | 2 | 3;
  fromName: string;
  publicKeyBase64: string;
  /**
   * X25519, added at v3 (2026-09-06). Signing proves who wrote something;
   * this is what lets it be written so only the recipient can read it, which
   * the agreed cloud inbox needs and a signature cannot provide.
   *
   * Optional because an older invite has none. A partner without it can still
   * pair and still plan, and nothing can be sealed to them.
   */
  encryptionKeyBase64?: string;
  role?: ConnectionRole;
  grants?: ShareGrants;
  conditionCodes?: string[];
  alreadyHaveYou?: boolean;
};

export async function buildConnectionInvite(): Promise<ConnectionInvite> {
  const [profile, identity] = await Promise.all([getUserProfile(), getDeviceIdentity()]);
  return {
    v: 3,
    fromName: profile.firstName?.trim() || 'A friend',
    publicKeyBase64: identity.publicKeyBase64,
    encryptionKeyBase64: identity.encryptionPublicKeyBase64,
    role: 'recipe',
  };
}

/**
 * A partner invite: what the link is for, what is being offered, and the
 * condition codes only where that was granted.
 *
 * alreadyHaveYou is set by whoever is sending SECOND, after accepting the
 * other side. That is the whole mutual-link mechanism, and it stays inside the
 * existing symmetric payload rather than adding a second message type.
 */
export async function buildPartnerInvite(options: {
  grants: ShareGrants;
  alreadyHaveYou?: boolean;
}): Promise<ConnectionInvite> {
  const [profile, identity] = await Promise.all([getUserProfile(), getDeviceIdentity()]);
  const invite: ConnectionInvite = {
    v: 3,
    fromName: profile.firstName?.trim() || 'A friend',
    publicKeyBase64: identity.publicKeyBase64,
    encryptionKeyBase64: identity.encryptionPublicKeyBase64,
    role: 'partner',
    grants: options.grants,
    alreadyHaveYou: options.alreadyHaveYou === true,
  };
  // The gate that matters: the codes are attached ONLY when the person granted
  // them, read from the grant rather than from a caller argument, so no call
  // site can send a diagnosis list by passing the wrong parameter.
  if (options.grants.conditions) {
    invite.conditionCodes = await getUserConditions();
  }
  return invite;
}

// What a connection invite looks like inside a .is file.
//
// Deliberately NOT signed, unlike a recipe. There is nothing to verify it
// against: the receiver does not have this sender's key until they accept
// this very file, which is the bootstrapping problem every no-server key
// exchange has. Signing it would look like a guarantee it cannot make. The
// real safety gate is still the explicit accept plus the fingerprint
// comparison, which is required for a partner.
export const CONNECTION_INVITE_FILE_KIND = 'connection-invite';


/**
 * Reads a connection invite back out of a .is file's parsed contents.
 *
 * Returns the base64 the /connect route expects, or null when this file is
 * something else entirely (a shared recipe, which is the common case). Pure and
 * defensive: it decides where a tapped file goes, so a malformed one has to
 * fall through to the recipe path rather than throw.
 */
export function connectionInviteDataFromFile(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const wrapper = parsed as { kind?: unknown; invite?: unknown };
  if (wrapper.kind !== CONNECTION_INVITE_FILE_KIND) return null;
  if (!wrapper.invite || typeof wrapper.invite !== 'object') return null;
  try {
    const encoded = encodeBase64Utf8(JSON.stringify(wrapper.invite));
    // Round-tripped through the real decoder rather than trusted, so a file
    // claiming to be an invite but carrying nothing usable is treated as not
    // an invite at all.
    return decodeConnectionInvite(encoded) ? encoded : null;
  } catch {
    return null;
  }
}

/**
 * Reads an invite out of whatever someone actually pasted.
 *
 * Added 2026-09-06, after two failed attempts at getting an invite from one
 * phone to another. First it went as a hashimotosapp:// link in a message,
 * which messaging apps do not make tappable. Then it went as a .is file, and
 * tapping that in WhatsApp produced WhatsApp's own "Couldn't load object"
 * rather than opening this app at all.
 *
 * THE UNDERLYING PROBLEM, AND WHY THIS EXISTS RATHER THAN A THIRD ATTEMPT AT
 * THE SAME THING. The Android intent filter in app.json matches a .is file by
 * pathPattern, and a content:// URI handed over by another app usually has an
 * opaque path with no filename in it at all, so that pattern never matches.
 * Fixing it needs a native rebuild and may still not work across every sending
 * app, so this is a route into the app that depends on no OS handoff at all:
 * text, copied and pasted, which works through every channel there is.
 *
 * Deliberately tolerant, because people paste messily. Accepts the bare code,
 * the whole deep link, or a block of message text with the code somewhere in
 * it, and validates by actually decoding rather than by matching a shape.
 */
// The code itself, which is what actually gets copied and pasted. Same base64
// the link carries in its data param, so both routes lead to one decoder.
export function encodeInviteCode(invite: ConnectionInvite): string {
  return encodeBase64Utf8(JSON.stringify(invite));
}

export function parseInviteInput(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  const candidates: string[] = [];

  // A full link, pasted whole. Pulled out by hand rather than with a URL
  // parser, since a custom scheme is not something every parser accepts.
  const dataAt = text.indexOf('data=');
  if (dataAt !== -1) {
    // Take the leading run of characters that could BE base64, rather than
    // splitting on a guessed list of delimiters. The first version split on
    // whitespace, & and # and kept the closing bracket from this app's own
    // message, which ends "...data=CODE)". Caught by testing against the real
    // message text rather than a tidy fixture.
    const after = text.slice(dataAt + 5).match(/^[A-Za-z0-9+/=_-]+/);
    if (after) candidates.push(after[0]);
  }

  // The whole thing, for someone who pasted exactly the code.
  candidates.push(text);

  // Any single run of base64-ish characters long enough to be an invite,
  // for a paste that carries surrounding words. Longest first, since the
  // code is by far the longest such run in any message this app sends.
  const runs = text.match(/[A-Za-z0-9+/=_-]{40,}/g);
  if (runs) candidates.push(...[...runs].sort((a, b) => b.length - a.length));

  for (const candidate of candidates) {
    const cleaned = candidate.trim();
    if (!cleaned) continue;
    try {
      if (decodeConnectionInvite(cleaned)) return cleaned;
    } catch {
      // Not this one. Keep going rather than failing the whole paste.
    }
  }
  return null;
}



// Defensive parse -- never trusts a received invite's own shape blindly,
// the same discipline every other real "external input" boundary in this
// app already holds to (see lib/sharing.ts's own decodeShareEnvelope).
// Returns null for anything genuinely malformed rather than throwing, so
// app/connect.tsx can show a plain, honest "this link doesn't look right"
// state instead of crashing.
export function decodeConnectionInvite(raw: string): ConnectionInvite | null {
  try {
    const parsed = JSON.parse(decodeBase64Utf8(raw)) as Partial<ConnectionInvite>;
    // v1 and v2 are still accepted. A link sent before 2026-09-06 can still be
    // sitting in a message thread, and refusing it would break something that
    // used to work for no reason: a v1 invite is simply a recipe connection, and
    // a v2 one is a partner invite with no encryption key.
    //
    // v3 added the encryption key. Every version this app has ever produced has
    // to stay listed here, and a new one has to be ADDED rather than swapped in:
    // getting this wrong means the app cannot read the codes it builds itself,
    // which is a total pairing failure and one nothing but pairing two phones
    // would reveal.
    if (parsed.v !== 1 && parsed.v !== 2 && parsed.v !== 3) return null;
    if (typeof parsed.fromName !== 'string' || !parsed.publicKeyBase64) return null;

    // Everything below is normalised rather than trusted. This arrived from
    // another device, so a field being the wrong type is a real possibility,
    // and the failure has to be "treated as absent" rather than a crash on a
    // screen whose whole job is to let someone accept or discard safely.
    const role: ConnectionRole = parsed.role === 'partner' ? 'partner' : 'recipe';
    const rawGrants = (parsed.grants ?? {}) as Partial<ShareGrants>;
    const grants: ShareGrants = {
      meals: rawGrants.meals === true,
      shopping: rawGrants.shopping === true,
      conditions: rawGrants.conditions === true,
    };
    // Codes are kept only when they were actually granted. A payload claiming
    // no condition grant while carrying codes anyway is contradicting itself,
    // and the safe reading of that is to drop them.
    const encryptionKeyBase64 = canEncryptTo(parsed.encryptionKeyBase64) ? parsed.encryptionKeyBase64 : undefined;

    const conditionCodes = grants.conditions && Array.isArray(parsed.conditionCodes)
      ? parsed.conditionCodes.filter((code): code is string => typeof code === 'string')
      : undefined;

    return {
      v: parsed.v,
      fromName: parsed.fromName,
      publicKeyBase64: parsed.publicKeyBase64,
      encryptionKeyBase64,
      role,
      grants,
      conditionCodes,
      alreadyHaveYou: parsed.alreadyHaveYou === true,
    };
  } catch {
    return null;
  }
}
