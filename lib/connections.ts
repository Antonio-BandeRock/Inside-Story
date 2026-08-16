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
// Deliberately NOT built yet, named directly rather than silently
// implied: no real invitation/pairing exchange UI writes to this table
// yet (step 4 of the same list -- the actual QR-code/link-based public-
// key handshake); no real signature verification reads from it yet (step
// 5). This file's only real job is: can a connection be added, listed,
// looked up, renamed, and removed, correctly, once something else
// eventually calls it.
import * as Linking from 'expo-linking';
import { getDatabase, getUserProfile } from './db';
import { getDeviceIdentity } from './deviceIdentity';
import { decodeBase64Utf8, encodeBase64Utf8 } from './sharing';

export type Connection = {
  id: string;
  name: string;
  publicKeyBase64: string;
  pairedAt: string;
};

type ConnectionRow = {
  id: string;
  name: string;
  public_key_base64: string;
  paired_at: string;
};

function fromRow(row: ConnectionRow): Connection {
  return { id: row.id, name: row.name, publicKeyBase64: row.public_key_base64, pairedAt: row.paired_at };
}

// Real, deliberate parity with lib/deviceIdentity.ts's own publicKeyBase64
// field -- both this table and this app's own device identity encode a
// real Ed25519 public key the identical way, so a value read from one is
// always directly comparable to the other with no re-encoding step.
export async function addConnection(name: string, publicKeyBase64: string): Promise<Connection> {
  const db = await getDatabase();
  const id = `connection_${Date.now()}`;
  const trimmedName = name.trim();
  await db.runAsync(
    'INSERT INTO connections (id, name, public_key_base64) VALUES (?, ?, ?)',
    id,
    trimmedName || 'Unnamed connection',
    publicKeyBase64,
  );
  const row = await db.getFirstAsync<ConnectionRow>('SELECT id, name, public_key_base64, paired_at FROM connections WHERE id = ?', id);
  if (!row) throw new Error('Failed to save the new connection.');
  return fromRow(row);
}

// Alphabetical by name -- the same real "recognize by who they are"
// browsing order this app already establishes for every other roster a
// person picks a real, known individual from (Profile's own tracked-
// condition list, food-allergy list, etc.), not insertion/pairing order.
export async function listConnections(): Promise<Connection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ConnectionRow>('SELECT id, name, public_key_base64, paired_at FROM connections ORDER BY name COLLATE NOCASE ASC');
  return rows.map(fromRow);
}

export async function getConnection(id: string): Promise<Connection | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ConnectionRow>('SELECT id, name, public_key_base64, paired_at FROM connections WHERE id = ?', id);
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
    'SELECT id, name, public_key_base64, paired_at FROM connections WHERE public_key_base64 = ?',
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
export type ConnectionInvite = {
  v: 1;
  fromName: string;
  publicKeyBase64: string;
};

export async function buildConnectionInvite(): Promise<ConnectionInvite> {
  const [profile, identity] = await Promise.all([getUserProfile(), getDeviceIdentity()]);
  return {
    v: 1,
    fromName: profile.firstName?.trim() || 'A friend',
    publicKeyBase64: identity.publicKeyBase64,
  };
}

// A real hashimotosapp://connect deep link, reusing the exact same
// base64-JSON-in-a-query-param shape lib/sharing.ts already established
// for recipe sharing (encodeBase64Utf8, exported from there specifically
// for this reuse rather than duplicated a third time).
export async function buildConnectionInviteLink(): Promise<string> {
  const invite = await buildConnectionInvite();
  return Linking.createURL('/connect', { queryParams: { data: encodeBase64Utf8(JSON.stringify(invite)) } });
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
    if (parsed.v !== 1 || typeof parsed.fromName !== 'string' || !parsed.publicKeyBase64) return null;
    return parsed as ConnectionInvite;
  } catch {
    return null;
  }
}
