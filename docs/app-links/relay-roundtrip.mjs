// Proves the live relay end to end using the same tweetnacl the app uses.
//
// This stands in for two phones: it makes two identities, sends from one to the
// other, collects, acks, and checks every refusal the Worker is supposed to
// make. Run from the repo root so tweetnacl resolves.
import nacl from 'tweetnacl';
import crypto from 'node:crypto';

const BASE = process.env.RELAY_BASE ?? 'https://insidestoryapp.com';
const PROTOCOL = 'inside-story/relay/v1';

let passed = 0;
let failed = 0;
function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}${detail ? ` :: ${JSON.stringify(detail)}` : ''}`);
  }
}

const b64 = (bytes) => Buffer.from(bytes).toString('base64');

// Mirrors computeKeyFingerprint in lib/deviceIdentity.ts, minus the spacing.
function fingerprint(publicKey) {
  const digest = nacl.hash(publicKey); // SHA-512
  return Buffer.from(digest.slice(0, 8)).toString('hex').toUpperCase();
}

function canonical({ verb, mailbox, sentAt, nonce, bodyHash }) {
  return [PROTOCOL, verb, mailbox, sentAt, nonce, bodyHash].join('\n');
}

const sha256Hex = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

function makeIdentity() {
  const seed = nacl.randomBytes(32);
  const signing = nacl.sign.keyPair.fromSeed(seed);
  return {
    publicKeyBase64: b64(signing.publicKey),
    fingerprint: fingerprint(signing.publicKey),
    sign: (message) => b64(nacl.sign.detached(new TextEncoder().encode(message), signing.secretKey)),
  };
}

function signed(identity, { verb, mailbox, bodyHash, skewMs = 0 }) {
  const sentAt = new Date(Date.now() + skewMs).toISOString();
  const nonce = Buffer.from(nacl.randomBytes(16)).toString('hex');
  return {
    sentAt,
    nonce,
    publicKey: identity.publicKeyBase64,
    signature: identity.sign(canonical({ verb, mailbox, sentAt, nonce, bodyHash })),
  };
}

async function post(route, payload) {
  const response = await fetch(`${BASE}/relay/v1/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
}

const alice = makeIdentity();
const bob = makeIdentity();
console.log(`alice ${alice.fingerprint}   bob ${bob.fingerprint}`);
console.log(`relay ${BASE}\n`);

// A stand-in for the sealed wire. The relay never looks inside it, so its
// shape does not matter here beyond being the JSON text the app would send.
const wire = JSON.stringify({
  kind: 'partnerSync',
  v: 1,
  to: bob.fingerprint,
  from: alice.fingerprint,
  sealed: b64(nacl.randomBytes(400)),
});
const wireHash = sha256Hex(wire);

console.log('send');
{
  const sent = await post('send', {
    to: bob.fingerprint,
    from: alice.fingerprint,
    body: wire,
    ...signed(alice, { verb: 'send', mailbox: bob.fingerprint, bodyHash: wireHash }),
  });
  check('alice can send to bob', sent.status === 200 && sent.body.ok === true, sent);
}

console.log('refusals');
{
  const wrongKey = await post('send', {
    to: bob.fingerprint,
    from: alice.fingerprint,
    body: wire,
    // Bob signs, but the message claims to be from Alice.
    ...signed(bob, { verb: 'send', mailbox: bob.fingerprint, bodyHash: wireHash }),
  });
  check('a send signed by the wrong key is refused', wrongKey.status === 403, wrongKey);

  const tampered = await post('send', {
    to: bob.fingerprint,
    from: alice.fingerprint,
    body: wire + ' ',
    ...signed(alice, { verb: 'send', mailbox: bob.fingerprint, bodyHash: wireHash }),
  });
  check('a body swapped after signing is refused', tampered.status === 403, tampered);

  const stale = await post('send', {
    to: bob.fingerprint,
    from: alice.fingerprint,
    body: wire,
    ...signed(alice, { verb: 'send', mailbox: bob.fingerprint, bodyHash: wireHash, skewMs: -10 * 60 * 1000 }),
  });
  check('a stale request is refused', stale.status === 401, stale);

  const eavesdrop = await post('collect', {
    mailbox: bob.fingerprint,
    // Alice presents her own key while asking for Bob's mailbox.
    ...signed(alice, { verb: 'collect', mailbox: bob.fingerprint, bodyHash: '-' }),
  });
  check("alice cannot collect bob's mail", eavesdrop.status === 403, eavesdrop);

  const replayed = signed(bob, { verb: 'collect', mailbox: bob.fingerprint, bodyHash: '-' });
  const asAck = await post('ack', { mailbox: bob.fingerprint, from: [alice.fingerprint], ...replayed });
  check('a collect signature cannot be replayed as an ack', asAck.status === 403, asAck);
}

console.log('collect');
let collected;
{
  collected = await post('collect', {
    mailbox: bob.fingerprint,
    ...signed(bob, { verb: 'collect', mailbox: bob.fingerprint, bodyHash: '-' }),
  });
  check('bob can collect', collected.status === 200 && collected.body.ok === true, collected.status);
  check('one item waiting', collected.body.items?.length === 1, collected.body.items?.length);
  check('it is the exact bytes alice sent', collected.body.items?.[0]?.body === wire);
  check('it names alice as the sender', collected.body.items?.[0]?.from === alice.fingerprint);
}

console.log('resend replaces rather than accumulates');
{
  await post('send', {
    to: bob.fingerprint,
    from: alice.fingerprint,
    body: wire,
    ...signed(alice, { verb: 'send', mailbox: bob.fingerprint, bodyHash: wireHash }),
  });
  const again = await post('collect', {
    mailbox: bob.fingerprint,
    ...signed(bob, { verb: 'collect', mailbox: bob.fingerprint, bodyHash: '-' }),
  });
  check('still one item after a resend', again.body.items?.length === 1, again.body.items?.length);
}

console.log('peek');
{
  const peeked = await fetch(`${BASE}/relay/v1/peek?mailbox=${bob.fingerprint}`).then((r) => r.json());
  check('peek reports one waiting', peeked.waiting === 1, peeked);
  check('peek never says who from', !JSON.stringify(peeked).includes(alice.fingerprint), peeked);
}

console.log('ack');
{
  const senders = [alice.fingerprint].sort();
  const cleared = await post('ack', {
    mailbox: bob.fingerprint,
    from: senders,
    ...signed(bob, { verb: 'ack', mailbox: bob.fingerprint, bodyHash: sha256Hex(senders.join(',')) }),
  });
  check('bob can clear what he used', cleared.status === 200 && cleared.body.cleared === 1, cleared);

  const after = await post('collect', {
    mailbox: bob.fingerprint,
    ...signed(bob, { verb: 'collect', mailbox: bob.fingerprint, bodyHash: '-' }),
  });
  check('the mailbox is empty afterwards', after.body.items?.length === 0, after.body.items?.length);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
