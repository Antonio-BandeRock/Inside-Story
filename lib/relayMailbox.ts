// The mailbox, running on the relay at insidestoryapp.com.
//
// WHAT CHANGES HERE AND WHAT DOES NOT. The carrier changes: bytes wait on a
// Cloudflare Worker instead of in a cloud folder or on the same Wi-Fi. Nothing
// else does. The payload is still built by buildWireForPartner, which reads the
// grants itself, still sealed by lib/partnerCrypto.ts so only the recipient can
// open it, and still verified on arrival by the same four checks in
// lib/partnerTransfer.ts. A carrier deciding what is allowed to be true before
// something is stored is exactly the drift this app keeps having to unpick.
//
// WHY THIS ONE IS DIFFERENT FROM THE OTHER FOUR, AND WORTH SAYING OUT LOUD.
// Every other carrier moves bytes either between two phones directly or through
// storage the person already owns. This one puts a machine of ours in the path
// for the first time. What that machine holds is a sealed blob it cannot open,
// addressed by two key fingerprints. What it therefore knows is that one
// anonymous address sent something to another anonymous address, and how big it
// was. That is not nothing, and the screen says so plainly rather than calling
// the relay private and leaving it there.
//
// HOW THE RELAY KNOWS WHO IS ASKING WITHOUT ACCOUNTS. The mailbox address is a
// key fingerprint, and the credential is a signature from the key that
// fingerprint came from. There is no password to forget and no account to
// recover, because there is nothing stored on that side worth stealing. The
// signature protects the mailbox from being emptied or flooded by somebody
// else; it is not what keeps the mail private. The sealing already does that.
//
// WHAT IS DELETED AND WHEN. Only what was actually applied, named back to the
// relay in a second signed request. A payload that failed one of the four
// arrival checks stays put, so a fixable problem (a pairing not finished, a key
// not yet exchanged) can be fixed and the same message read again rather than
// thrown away unread. Anything nobody collects expires on its own after 30 days.

import { digestStringAsync, getRandomBytesAsync, CryptoDigestAlgorithm } from 'expo-crypto';

import { talksAutomatically } from './peerRelationships';
import { listConnections } from './connections';
import { getUserConditions } from './db';
import {
  bytesToBase64,
  computeKeyFingerprint,
  getDeviceIdentity,
  getMyKeyFingerprint,
  signMessage,
} from './deviceIdentity';
import { applySyncFileText, buildWireForPartner } from './partnerTransfer';
import { PEER_PHOTO_BUDGET_RELAY } from './peerPhotos';
import {
  canonicalRequest,
  describeRelayHttpFailure,
  NO_BODY_HASH,
  RELAY_BASE_URL,
  ackBodyText,
  type RelayVerb,
} from './relayProtocol';
import { compactFingerprint } from './syncInbox';

/**
 * How long to wait before calling it a failure.
 *
 * A phone on a hotel network that accepts the connection and then does nothing
 * will otherwise leave the button spinning forever. Fifteen seconds is long
 * enough for a slow mobile connection and short enough to be worth waiting out.
 */
const REQUEST_TIMEOUT_MS = 15000;

async function sha256Hex(text: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, text);
}

/** Hex, matching what the Worker expects to see in the signed string. */
async function makeNonce(): Promise<string> {
  const bytes = await getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The three fields that prove who is asking, for one exact request.
 *
 * Built per request rather than cached: the time and the nonce are what stop a
 * captured request being replayed, so reusing either would quietly undo them.
 */
async function credentials(verb: RelayVerb, mailbox: string, bodyHash: string) {
  const [identity, nonce] = await Promise.all([getDeviceIdentity(), makeNonce()]);
  const sentAt = new Date().toISOString();
  const signature = await signMessage(
    new TextEncoder().encode(canonicalRequest({ verb, mailbox, sentAt, nonce, bodyHash })),
  );
  return {
    sentAt,
    nonce,
    publicKey: identity.publicKeyBase64,
    signature: bytesToBase64(signature),
  };
}

type RelayResponse = { status: number; body: Record<string, unknown> };

async function postToRelay(route: string, payload: unknown): Promise<RelayResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${RELAY_BASE_URL}/${route}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let body: Record<string, unknown> = {};
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      // A relay that answered with something other than JSON is still a
      // failure worth reporting by its status rather than crashing the screen.
    }
    return { status: response.status, body };
  } catch {
    return { status: 0, body: {} };
  } finally {
    clearTimeout(timer);
  }
}

export type RelayPeek =
  | { ok: true; waiting: number; newest: string | null }
  | { ok: false; reason: string };

/**
 * How much is waiting, asked without proving anything.
 *
 * Deliberately unsigned and deliberately thin: it answers a count and the time
 * of the newest item, never who sent anything. Anyone who knows a fingerprint
 * could ask it, which is why it is worth being sure it gives away nothing more
 * than the count, and why collecting is a different request that needs a
 * signature.
 */
export async function peekRelay(): Promise<RelayPeek> {
  const mailbox = compactFingerprint(await getMyKeyFingerprint());
  if (!mailbox) return { ok: false, reason: 'This phone has no key fingerprint yet.' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${RELAY_BASE_URL}/peek?mailbox=${mailbox}`, {
      signal: controller.signal,
    });
    const body = (await response.json()) as { waiting?: number; newest?: string | null };
    if (!response.ok) return { ok: false, reason: describeRelayHttpFailure(response.status) };
    return {
      ok: true,
      waiting: typeof body.waiting === 'number' ? body.waiting : 0,
      newest: typeof body.newest === 'string' ? body.newest : null,
    };
  } catch {
    return { ok: false, reason: describeRelayHttpFailure(0) };
  } finally {
    clearTimeout(timer);
  }
}

export type RelaySendOutcome = {
  connectionId: string;
  name: string;
  sent: boolean;
  reason?: string;
};

/**
 * Posts one sealed blob per partner into that partner's mailbox.
 *
 * Per recipient, and so is the outcome: one partner having no encryption key
 * must not stop another partner's message being posted, so each gets its own
 * result and the caller reports all of them.
 */
export async function sendViaRelay(): Promise<{ outcomes: RelaySendOutcome[] }> {
  const [connections, myFingerprintRaw, myConditions] = await Promise.all([
    listConnections(),
    getMyKeyFingerprint(),
    getUserConditions(),
  ]);

  const myFingerprint = compactFingerprint(myFingerprintRaw);
  const partners = connections.filter((connection) => talksAutomatically(connection.role));
  if (!myFingerprint) {
    return {
      outcomes: partners.map((partner) => ({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason: 'This phone has no key fingerprint yet.',
      })),
    };
  }

  const outcomes: RelaySendOutcome[] = [];

  for (const partner of partners) {
    const theirMailbox = compactFingerprint(computeKeyFingerprint(partner.publicKeyBase64));
    if (!theirMailbox) {
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason: 'Their key could not be turned into an address.',
      });
      continue;
    }

    const built = await buildWireForPartner(partner, myFingerprintRaw, myConditions, {
      photoBudget: PEER_PHOTO_BUDGET_RELAY,
      allowFullPhotos: false,
    });
    if (!built.ok) {
      outcomes.push({
        connectionId: partner.id,
        name: partner.name,
        sent: false,
        reason:
          built.reason === 'noKey'
            ? 'They paired before this app could encrypt. Show each other a code once more.'
            : 'Their key could not be used to encrypt this. Pair with them again.',
      });
      continue;
    }

    const body = JSON.stringify(built.wire);
    const bodyHash = await sha256Hex(body);
    // The sender signs a send, so the mailbox in the signed string is theirs
    // while the key presented is this phone's. That pairing is what lets the
    // relay record who put something there instead of taking a claimed name.
    const signed = await credentials('send', theirMailbox, bodyHash);

    const result = await postToRelay('send', {
      to: theirMailbox,
      from: myFingerprint,
      body,
      ...signed,
    });

    outcomes.push({
      connectionId: partner.id,
      name: partner.name,
      sent: result.status === 200 && result.body.ok === true,
      reason:
        result.status === 200 && result.body.ok === true
          ? undefined
          : describeRelayHttpFailure(result.status, result.body.reason),
    });
  }

  return { outcomes };
}

export type RelayReceiveOutcome = {
  fromFingerprint: string;
  applied: boolean;
  message: string;
};

/** Collects whatever is addressed to this phone, applies it, and clears what was used. */
export async function receiveViaRelay(): Promise<{
  outcomes: RelayReceiveOutcome[];
  reason?: string;
}> {
  const mailbox = compactFingerprint(await getMyKeyFingerprint());
  if (!mailbox) return { outcomes: [], reason: 'This phone has no key fingerprint yet.' };

  const collected = await postToRelay('collect', {
    mailbox,
    ...(await credentials('collect', mailbox, NO_BODY_HASH)),
  });

  if (collected.status !== 200 || collected.body.ok !== true) {
    return { outcomes: [], reason: describeRelayHttpFailure(collected.status, collected.body.reason) };
  }

  const items = Array.isArray(collected.body.items)
    ? (collected.body.items as { from?: unknown; body?: unknown }[])
    : [];
  if (items.length === 0) return { outcomes: [] };

  const connections = await listConnections();
  const outcomes: RelayReceiveOutcome[] = [];
  const used: string[] = [];

  for (const item of items) {
    const from = typeof item.from === 'string' ? item.from : '';
    if (typeof item.body !== 'string') {
      outcomes.push({
        fromFingerprint: from,
        applied: false,
        message: 'Something arrived that could not be read.',
      });
      continue;
    }

    const result = await applySyncFileText(item.body, connections);
    outcomes.push({ fromFingerprint: from, applied: result.applied, message: result.message });
    if (result.applied && from) used.push(from);
  }

  // One ack for everything that worked, rather than one per item: the relay
  // clears a named list in a single statement, and a phone that loses signal
  // halfway through a run of separate acks would leave some applied messages
  // sitting there to be applied a second time.
  if (used.length > 0) {
    const names = [...new Set(used)].sort();
    await postToRelay('ack', {
      mailbox,
      from: names,
      ...(await credentials('ack', mailbox, await sha256Hex(ackBodyText(names)))),
    });
  }

  return { outcomes };
}

export function describeRelaySend(outcomes: readonly RelaySendOutcome[]): string {
  if (outcomes.length === 0) return 'Nobody is set up as a partner yet, so there was nothing to send.';
  const sent = outcomes.filter((outcome) => outcome.sent);
  const failed = outcomes.filter((outcome) => !outcome.sent);
  const parts: string[] = [];
  if (sent.length > 0) {
    parts.push('Waiting at the relay for ' + sent.map((outcome) => outcome.name).join(', ') + '.');
  }
  for (const outcome of failed) {
    parts.push(outcome.name + ': ' + (outcome.reason ?? 'It could not be sent.'));
  }
  return parts.join(' ');
}

export function describeRelayReceive(
  outcomes: readonly RelayReceiveOutcome[],
  reason?: string,
): string {
  if (reason) return reason;
  if (outcomes.length === 0) return 'Nothing addressed to this phone is waiting at the relay.';
  return outcomes.map((outcome) => outcome.message).join(' ');
}
