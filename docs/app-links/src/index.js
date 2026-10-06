// The relay: a mailbox on the Internet that cannot read its own mail.
//
// WHY THIS EXISTS. Every carrier before this one needed the two people to
// arrange something. A file needs somebody to send it and somebody to open it.
// Sync over Wi-Fi needs both phones in the same place at the same time. The
// OneDrive mailbox needs a Microsoft account on both ends and a folder shared
// between them. All three work, and none of them work when one person is at
// the shops and the other is at home wondering what is for dinner.
//
// WHAT THIS DOES. It holds a sealed blob addressed to a key fingerprint until
// the holder of that key comes and collects it. That is the whole service.
//
// WHAT IT DELIBERATELY CANNOT DO. It cannot read anything it holds. The payload
// is sealed to the recipient's X25519 key by lib/partnerCrypto.ts on the
// sending phone, so what arrives here is ciphertext and what leaves here is the
// same ciphertext. There is no key here that could open it and no way to add
// one later without changing the app on both phones. This is the first server
// in the path of this app's health data, and that property is the entire reason
// it was acceptable to put one there.
//
// WHAT IT KNOWS, STATED HONESTLY. It knows that a device with fingerprint A put
// something addressed to fingerprint B, how big it was and when. It does not
// know who A or B are, what conditions either person has, or what is in the
// payload. That is a social graph of anonymous 16-character addresses. It is not
// nothing, and it is written down here rather than glossed over.
//
// HOW IT KNOWS WHO IS ASKING, WITHOUT A ROSTER. There are no accounts here. A
// mailbox address IS a key fingerprint, and the way to prove you own a mailbox
// is to sign a fresh challenge with the key that fingerprint came from. The
// Worker hashes the public key it was handed, checks that hash is the mailbox
// being asked for, and checks the signature. Holding the private key is the only
// credential, which means there is nothing here to steal, reset, or leak, and no
// password for anyone to forget.
//
// WHY THAT CHECK IS NOT WHAT KEEPS THE MAIL PRIVATE. The signature stops mail
// being deleted or a mailbox being flooded. It is not what stops mail being
// read: the sealing already did that. If this check were bypassed entirely
// tomorrow, an attacker would be holding ciphertext they cannot open. Depth,
// not the wall.
//
// WAKING THE OTHER PHONE (M1, 1.0.62.2). Mail that sits here until somebody
// opens the app is only half a carrier. A phone that holds a mailbox can leave
// its Firebase Cloud Messaging address here (the register verb, signed with the
// mailbox's key like everything else), and when mail is put in that mailbox
// this Worker asks Google to wake that phone. The wake-up says one thing, that
// mail is waiting, with no sender, no size and nothing from the body. The phone
// then collects it the ordinary signed way. What this adds to what the relay
// knows: that a fingerprint belongs to an Android phone Google can reach.
//
// The Firebase key lives only as the Worker secret FCM_SERVICE_ACCOUNT, never
// in this repository. Without it, mail is still held and collected; nothing
// wakes, and the phone finds it the next time the app is opened.
//
// See lib/relayProtocol.ts in the app for the canonical signed-message format
// this file has to agree with byte for byte.

const PROTOCOL = 'inside-story/relay/v1';

// How far a caller's clock may be from this Worker's. Wide enough that a phone
// with a slightly wrong clock still works, narrow enough that a captured
// signature stops being useful quickly.
const CLOCK_SKEW_SECONDS = 120;

// The sealed wire for a fortnight of meal plan and a condition list runs to a
// few kilobytes. This is headroom, not a target.
const MAX_BODY_BYTES = 256 * 1024;

// One row per sender per mailbox, so this is how many different people can have
// unread mail waiting for you at once. A household is two to six.
const MAX_SENDERS_PER_MAILBOX = 25;

// Uncollected mail is deleted after this. Somebody who stops using the app
// should not leave a blob sitting here forever, and a plan a month stale is of
// no use to anybody anyway.
const TTL_DAYS = 30;

// A ceiling on the whole table, so that if this URL is ever found and abused the
// damage is a full relay rather than an unbounded D1 bill. Raise it if there are
// ever enough people using this to reach it honestly.
const MAX_TOTAL_ROWS = 5000;

const MAX_ITEMS_PER_COLLECT = 10;

const COMPACT_FINGERPRINT = /^[0-9A-F]{16}$/;

// An FCM registration token is a few hundred characters of URL-safe text. This
// is a sanity bound, not a format Google publishes.
const PUSH_TOKEN = /^[A-Za-z0-9_:-]{20,4096}$/;

// What the wake-up carries. The app's background task looks for exactly this.
const WAKE_KIND = 'inside-story-mail';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function fail(status, reason) {
  return json({ ok: false, reason }, status);
}

function base64ToBytes(value) {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The same fingerprint the app computes, with the display spacing left out.
 *
 * Has to match computeKeyFingerprint in lib/deviceIdentity.ts exactly: SHA-512
 * over the raw public key bytes, first 8 of them, uppercase hex. The app writes
 * it in groups of four for reading out loud; this never sees the spaces.
 */
async function fingerprintOf(publicKeyBytes) {
  const digest = await crypto.subtle.digest('SHA-512', publicKeyBytes);
  return bytesToHex(new Uint8Array(digest).slice(0, 8)).toUpperCase();
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return bytesToHex(new Uint8Array(digest));
}

/**
 * The exact bytes a caller has to have signed.
 *
 * Every field that decides what the request does is in here, one per line, so a
 * signature for one verb or one mailbox cannot be replayed as another. The body
 * hash is in here too, which is what stops a sealed blob being swapped for a
 * different one after it was signed.
 */
function canonicalMessage(parts) {
  return [PROTOCOL, parts.verb, parts.mailbox, parts.sentAt, parts.nonce, parts.bodyHash].join('\n');
}

/**
 * Checks that whoever sent this holds the private key behind a fingerprint.
 *
 * Returns a reason rather than throwing, and the reasons are specific here
 * rather than uniform. Unlike opening a sealed payload, nothing secret is
 * revealed by saying a clock is wrong, and somebody whose phone will not sync
 * deserves to be told which of these it was.
 */
async function verifyRequest(input) {
  const { verb, mailbox, sentAt, nonce, bodyHash, publicKeyBase64, signatureBase64, expectedFingerprint } = input;

  if (typeof sentAt !== 'string' || typeof nonce !== 'string' || nonce.length < 16) {
    return { ok: false, status: 400, reason: 'The request was not addressed properly.' };
  }
  if (typeof publicKeyBase64 !== 'string' || typeof signatureBase64 !== 'string') {
    return { ok: false, status: 400, reason: 'The request was not addressed properly.' };
  }

  const sent = Date.parse(sentAt);
  if (Number.isNaN(sent)) {
    return { ok: false, status: 400, reason: 'The request did not carry a readable time.' };
  }
  if (Math.abs(Date.now() - sent) > CLOCK_SKEW_SECONDS * 1000) {
    return {
      ok: false,
      status: 401,
      reason: 'The clock on that phone is too far off to sync. Set the date and time automatically and try again.',
    };
  }

  let publicKeyBytes;
  let signatureBytes;
  try {
    publicKeyBytes = base64ToBytes(publicKeyBase64);
    signatureBytes = base64ToBytes(signatureBase64);
  } catch {
    return { ok: false, status: 400, reason: 'The request was not addressed properly.' };
  }
  if (publicKeyBytes.length !== 32 || signatureBytes.length !== 64) {
    return { ok: false, status: 400, reason: 'The request was not addressed properly.' };
  }

  const actual = await fingerprintOf(publicKeyBytes);
  if (actual !== expectedFingerprint) {
    return { ok: false, status: 403, reason: 'That key does not own this mailbox.' };
  }

  let key;
  try {
    key = await crypto.subtle.importKey('raw', publicKeyBytes, { name: 'Ed25519' }, false, ['verify']);
  } catch {
    return { ok: false, status: 400, reason: 'That key could not be read.' };
  }

  const message = new TextEncoder().encode(
    canonicalMessage({ verb, mailbox, sentAt, nonce, bodyHash }),
  );
  const verified = await crypto.subtle.verify({ name: 'Ed25519' }, key, signatureBytes, message);
  if (!verified) {
    return { ok: false, status: 403, reason: 'The request was not signed by the key it claims.' };
  }

  return { ok: true };
}

function compact(value) {
  if (typeof value !== 'string') return null;
  const stripped = value.replace(/\s+/g, '').toUpperCase();
  return COMPACT_FINGERPRINT.test(stripped) ? stripped : null;
}

/**
 * Clears out anything past its date.
 *
 * Run on the way in rather than on a schedule, because the table is small enough
 * that this costs nothing, and a cron trigger is one more thing that can quietly
 * stop running without anybody noticing.
 */
async function sweepExpired(env) {
  await env.RELAY_DB.prepare('DELETE FROM mail WHERE expires_at < ?')
    .bind(new Date().toISOString())
    .run();
}

async function handleSend(env, payload, ctx) {
  const to = compact(payload.to);
  const from = compact(payload.from);
  if (!to || !from) return fail(400, 'That message was not addressed properly.');
  if (to === from) return fail(400, 'Nothing sends to itself.');

  if (typeof payload.body !== 'string' || payload.body.length === 0) {
    return fail(400, 'That message had nothing in it.');
  }
  const bytes = new TextEncoder().encode(payload.body).length;
  if (bytes > MAX_BODY_BYTES) return fail(413, 'That is larger than this relay will carry.');

  const bodyHash = await sha256Hex(payload.body);
  const check = await verifyRequest({
    verb: 'send',
    mailbox: to,
    sentAt: payload.sentAt,
    nonce: payload.nonce,
    bodyHash,
    publicKeyBase64: payload.publicKey,
    signatureBase64: payload.signature,
    // The SENDER signs a send, so the key presented has to be the sender's.
    expectedFingerprint: from,
  });
  if (!check.ok) return fail(check.status, check.reason);

  await sweepExpired(env);

  // Two ceilings, checked only when this sender has nothing already waiting in
  // this mailbox. A resend replaces a row and adds none, so it cannot push
  // either count past its limit, and skipping the counts for it keeps the
  // common case to one lookup by primary key rather than a read of the table.
  const already = await env.RELAY_DB.prepare('SELECT 1 AS n FROM mail WHERE to_fp = ? AND from_fp = ?')
    .bind(to, from)
    .first();
  if (!already) {
    const existing = await env.RELAY_DB.prepare('SELECT COUNT(*) AS n FROM mail WHERE to_fp = ?')
      .bind(to)
      .first();
    if ((existing && existing.n ? existing.n : 0) >= MAX_SENDERS_PER_MAILBOX) {
      return fail(409, 'That mailbox is full.');
    }

    const total = await env.RELAY_DB.prepare('SELECT COUNT(*) AS n FROM mail').first();
    if ((total && total.n ? total.n : 0) >= MAX_TOTAL_ROWS) {
      return fail(503, 'The relay is full right now. Try again later, or send it another way.');
    }
  }

  const now = new Date();
  const expires = new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000);

  // One row per direction, replaced on resend. What is here is the latest thing
  // somebody sent, not a history: a relay that accumulated would hand back four
  // stale plans and leave the phone to work out which one is current.
  await env.RELAY_DB.prepare(
    'INSERT INTO mail (to_fp, from_fp, body, bytes, stored_at, expires_at) VALUES (?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT (to_fp, from_fp) DO UPDATE SET body = excluded.body, bytes = excluded.bytes, ' +
      'stored_at = excluded.stored_at, expires_at = excluded.expires_at',
  )
    .bind(to, from, payload.body, bytes, now.toISOString(), expires.toISOString())
    .run();

  // After the answer, never before it: a slow Google must not make a send look
  // slow, and a failed wake-up is not a failed send.
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(wakeMailbox(env, to));

  return json({ ok: true, storedAt: now.toISOString(), expiresAt: expires.toISOString() });
}

async function handleCollect(env, payload) {
  const mailbox = compact(payload.mailbox);
  if (!mailbox) return fail(400, 'That is not a mailbox address.');

  const check = await verifyRequest({
    verb: 'collect',
    mailbox,
    sentAt: payload.sentAt,
    nonce: payload.nonce,
    bodyHash: '-',
    publicKeyBase64: payload.publicKey,
    signatureBase64: payload.signature,
    expectedFingerprint: mailbox,
  });
  if (!check.ok) return fail(check.status, check.reason);

  await sweepExpired(env);

  const listed = await env.RELAY_DB.prepare(
    'SELECT from_fp, body, stored_at FROM mail WHERE to_fp = ? ORDER BY stored_at ASC LIMIT ?',
  )
    .bind(mailbox, MAX_ITEMS_PER_COLLECT)
    .all();

  const rows = listed && listed.results ? listed.results : [];
  return json({
    ok: true,
    items: rows.map((row) => ({ from: row.from_fp, body: row.body, storedAt: row.stored_at })),
  });
}

/**
 * Deletes only what the phone says it actually used.
 *
 * Separate from collecting on purpose, the same discipline the OneDrive mailbox
 * follows: a payload that failed one of the four arrival checks stays put, so a
 * fixable problem (a pairing not finished, a key not yet exchanged) can be fixed
 * and the same message read again rather than thrown away unread.
 */
async function handleAck(env, payload) {
  const mailbox = compact(payload.mailbox);
  if (!mailbox) return fail(400, 'That is not a mailbox address.');

  const named = Array.isArray(payload.from) ? payload.from.map(compact).filter(Boolean) : [];
  if (named.length === 0) return fail(400, 'Nothing was named to clear.');

  const sorted = [...new Set(named)].sort();
  const check = await verifyRequest({
    verb: 'ack',
    mailbox,
    sentAt: payload.sentAt,
    nonce: payload.nonce,
    bodyHash: await sha256Hex(sorted.join(',')),
    publicKeyBase64: payload.publicKey,
    signatureBase64: payload.signature,
    expectedFingerprint: mailbox,
  });
  if (!check.ok) return fail(check.status, check.reason);

  const placeholders = sorted.map(() => '?').join(', ');
  await env.RELAY_DB.prepare('DELETE FROM mail WHERE to_fp = ? AND from_fp IN (' + placeholders + ')')
    .bind(mailbox, ...sorted)
    .run();

  return json({ ok: true, cleared: sorted.length });
}

/**
 * What is waiting, without proving anything.
 *
 * Says only how many and how recently, never who from. A phone uses this to
 * decide whether a full collect is worth doing; anybody else learns that an
 * address they already had to know somehow has mail.
 */
async function handlePeek(env, url) {
  const mailbox = compact(url.searchParams.get('mailbox') || '');
  if (!mailbox) return fail(400, 'That is not a mailbox address.');

  const row = await env.RELAY_DB.prepare(
    'SELECT COUNT(*) AS n, MAX(stored_at) AS newest FROM mail WHERE to_fp = ? AND expires_at >= ?',
  )
    .bind(mailbox, new Date().toISOString())
    .first();

  return json({ ok: true, waiting: row ? row.n : 0, newest: row ? row.newest : null });
}

/**
 * Records, replaces or forgets where a mailbox's phone can be woken.
 *
 * Signed by the mailbox's own key, with the token as the signed body, so a
 * token can only be pointed at a mailbox by the phone that holds it. An empty
 * token forgets the row.
 */
async function handleRegister(env, payload) {
  const mailbox = compact(payload.mailbox);
  if (!mailbox) return fail(400, 'That is not a mailbox address.');
  const token = typeof payload.token === 'string' ? payload.token : null;
  if (token === null) return fail(400, 'That request could not be read.');
  if (token !== '' && !PUSH_TOKEN.test(token)) return fail(400, 'That is not an address this relay can wake.');

  const check = await verifyRequest({
    verb: 'register',
    mailbox,
    sentAt: payload.sentAt,
    nonce: payload.nonce,
    bodyHash: await sha256Hex(token),
    publicKeyBase64: payload.publicKey,
    signatureBase64: payload.signature,
    expectedFingerprint: mailbox,
  });
  if (!check.ok) return fail(check.status, check.reason);

  if (token === '') {
    await env.RELAY_DB.prepare('DELETE FROM push_tokens WHERE mailbox = ?').bind(mailbox).run();
    return json({ ok: true, registered: false });
  }
  await env.RELAY_DB.prepare(
    'INSERT INTO push_tokens (mailbox, token, updated_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT (mailbox) DO UPDATE SET token = excluded.token, updated_at = excluded.updated_at',
  )
    .bind(mailbox, token, new Date().toISOString())
    .run();
  return json({ ok: true, registered: true });
}

function base64UrlFromBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlFromText(text) {
  return base64UrlFromBytes(new TextEncoder().encode(text));
}

function pemToBytes(pem) {
  return base64ToBytes(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
}

// A Google access token lasts an hour. One is kept for as long as this Worker
// instance lives, with a few minutes' margin, so a burst of sends asks Google
// for one token rather than one each.
let cachedAccess = null;

async function googleAccessToken(account) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedAccess && cachedAccess.expiresAt - 300 > nowSeconds) return cachedAccess.token;

  const header = base64UrlFromText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlFromText(
    JSON.stringify({
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(header + '.' + claims),
  );
  const assertion = header + '.' + claims + '.' + base64UrlFromBytes(new Uint8Array(signature));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body:
      'grant_type=' +
      encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
      '&assertion=' +
      assertion,
  });
  if (!response.ok) throw new Error('google token ' + response.status);
  const granted = await response.json();
  cachedAccess = { token: granted.access_token, expiresAt: nowSeconds + (granted.expires_in || 3600) };
  return cachedAccess.token;
}

/**
 * Asks Google to wake the phone behind a mailbox, if it left an address.
 *
 * A data-only message, so Android shows nothing; the app's background task
 * collects the mail. Collapsed under one key, so ten sends while the phone is
 * off arrive as one wake-up. An address Google says is gone is forgotten.
 * Every failure here is logged and swallowed: the mail is already stored.
 */
async function wakeMailbox(env, mailbox) {
  try {
    if (!env.FCM_SERVICE_ACCOUNT) return;
    const row = await env.RELAY_DB.prepare('SELECT token FROM push_tokens WHERE mailbox = ?')
      .bind(mailbox)
      .first();
    if (!row || !row.token) return;

    const account = JSON.parse(env.FCM_SERVICE_ACCOUNT);
    const access = await googleAccessToken(account);
    const response = await fetch(
      'https://fcm.googleapis.com/v1/projects/' + account.project_id + '/messages:send',
      {
        method: 'POST',
        headers: { authorization: 'Bearer ' + access, 'content-type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: row.token,
            data: { kind: WAKE_KIND },
            android: { priority: 'HIGH', collapse_key: WAKE_KIND, ttl: '86400s' },
          },
        }),
      },
    );
    if (response.ok) return;

    const text = await response.text();
    if (response.status === 404 || text.includes('UNREGISTERED')) {
      await env.RELAY_DB.prepare('DELETE FROM push_tokens WHERE mailbox = ? AND token = ?')
        .bind(mailbox, row.token)
        .run();
      return;
    }
    if (response.status === 401) cachedAccess = null;
    console.error('relay wake', response.status);
  } catch (error) {
    console.error('relay wake', error && error.message ? error.message : error);
  }
}

async function handleRelay(request, env, url, ctx) {
  const route = url.pathname.replace(/^\/relay\/v1\/?/, '');

  if (route === 'health') {
    return json({
      ok: true,
      protocol: PROTOCOL,
      ttlDays: TTL_DAYS,
      maxBodyBytes: MAX_BODY_BYTES,
      wakes: Boolean(env.FCM_SERVICE_ACCOUNT),
    });
  }
  if (route === 'peek' && request.method === 'GET') {
    return handlePeek(env, url);
  }

  if (request.method !== 'POST') {
    return fail(405, 'That is not something this relay does.');
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return fail(400, 'That request could not be read.');
  }

  if (route === 'send') return handleSend(env, payload, ctx);
  if (route === 'register') return handleRegister(env, payload);
  if (route === 'collect') return handleCollect(env, payload);
  if (route === 'ack') return handleAck(env, payload);
  return fail(404, 'That is not something this relay does.');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/relay/')) {
      try {
        return await handleRelay(request, env, url, ctx);
      } catch (error) {
        // Never hand a stack trace or a D1 error string back to the caller. The
        // phone cannot act on it, and this is the one place internals could show.
        console.error('relay', error && error.message ? error.message : error);
        return fail(500, 'The relay could not handle that. Try again, or send it another way.');
      }
    }

    // Everything else is the static site: assetlinks.json and the two landing
    // pages. Unmatched asset requests reach this Worker, so this is also what
    // answers a plain 404.
    return env.ASSETS.fetch(request);
  },
};
