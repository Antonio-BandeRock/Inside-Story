// The wording of a request to the relay, kept pure so it can be tested in
// plain node and so exactly one file decides what gets signed.
//
// WHY A CANONICAL STRING AND NOT "JUST SIGN THE JSON". Two JSON encoders
// disagree about key order and whitespace, and a signature over bytes that can
// be re-encoded differently is a signature over nothing. This builds one exact
// string, field per line, in one order, on both sides. docs/app-links/src/index.js
// contains the other half and has to agree with this byte for byte; a change
// here without a change there breaks every sync silently rather than loudly,
// which is why the protocol name carries a version.
//
// WHAT IS IN THE SIGNED STRING, AND WHY EACH PART IS THERE.
//   - the protocol name, so a signature from a future version cannot be
//     replayed against this one
//   - the verb, so a signature that proves "let me read my mailbox" cannot be
//     handed back as "delete my mailbox"
//   - the mailbox, so a signature for one address cannot be used against another
//   - the time, so a captured signature stops working within two minutes
//   - a nonce, so two requests in the same second are still different messages
//   - a hash of the body, so the sealed blob cannot be swapped after signing
//
// WHAT THIS DOES NOT DO. It does not encrypt anything. The payload was already
// sealed to the recipient by lib/partnerCrypto.ts long before it reaches here.
// This layer only answers "is the device making this request the one that owns
// this mailbox", which protects the mailbox from being emptied or flooded, not
// the mail from being read. That distinction is worth keeping straight: if this
// whole layer failed open tomorrow, an attacker would hold ciphertext.

/** Bumped only when the signed string's shape changes. The Worker checks it too. */
export const RELAY_PROTOCOL = 'inside-story/relay/v1';

/**
 * Where the relay lives.
 *
 * The same Cloudflare Worker that serves the App Links file and the two landing
 * pages, on the domain the app already names in its intent filters. One host,
 * one deployment, one thing to keep alive.
 */
export const RELAY_BASE_URL = 'https://insidestoryapp.com/relay/v1';

/** What a request can ask for. The verb is signed, so these are not interchangeable. */
export type RelayVerb = 'send' | 'collect' | 'ack';

/** Stands in for the body hash on a request that has no body. */
export const NO_BODY_HASH = '-';

export type CanonicalParts = {
  verb: RelayVerb;
  /** The mailbox being acted on, compact: 16 uppercase hex characters. */
  mailbox: string;
  /** ISO 8601, from the sending device's clock. */
  sentAt: string;
  /** Hex, at least 16 characters. */
  nonce: string;
  /** Lowercase hex SHA-256 of the body, or NO_BODY_HASH. */
  bodyHash: string;
};

/**
 * The exact string a device signs.
 *
 * Newline-joined rather than concatenated: no field can run into the next one,
 * so there is no pair of different requests that produce the same bytes. The
 * fields themselves are all constrained formats (hex, ISO dates, a fixed set of
 * verbs), none of which can contain a newline, so the separator stays unambiguous.
 */
export function canonicalRequest(parts: CanonicalParts): string {
  return [RELAY_PROTOCOL, parts.verb, parts.mailbox, parts.sentAt, parts.nonce, parts.bodyHash].join('\n');
}

/**
 * The string whose hash an ack signs.
 *
 * Sorted and de-duplicated so that two phones naming the same senders in a
 * different order produce the same bytes, which is what lets the Worker rebuild
 * it and check the signature without trusting the order it was given.
 */
export function ackBodyText(fromFingerprints: readonly string[]): string {
  return [...new Set(fromFingerprints)].sort().join(',');
}

export type RelayFailure = { ok: false; reason: string };

/**
 * Turns an HTTP answer into something worth putting on a screen.
 *
 * The relay's own wording is used when it sent one, because it knows things the
 * phone does not (the mailbox is full, the clock is off). Anything else gets a
 * plain sentence that names the carrier, since "it did not work" on a screen
 * with five carriers tells nobody which one to try instead.
 */
export function describeRelayHttpFailure(status: number, reason?: unknown): string {
  if (typeof reason === 'string' && reason.trim()) return reason;
  if (status === 0) return 'The relay could not be reached. Check the Internet connection on this phone.';
  if (status >= 500) return 'The relay is having trouble right now. Try again in a minute, or send it another way.';
  return 'The relay refused that. Try again, or send it another way.';
}
