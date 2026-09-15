# App Links hosting for insidestoryapp.com

`public/.well-known/assetlinks.json` here is the file Android checks before
it lets `https://insidestoryapp.com/connect` and `/import-shared` open Inside
Story directly instead of a browser (the `autoVerify` intent filter added to
`app.json` in the 2026-09-14 rebuild, 1.0.37.33).

The certificate fingerprint in it is the EAS-managed Android signing key
(Build Credentials VmkcgH8VMO), read from the 1.0.37.33 APK with
`apksigner verify --print-certs`. It only changes if the EAS keystore is
replaced, so every later build keeps verifying against this file.

## How it is hosted

A Cloudflare Worker named `inside-story-site` serves the `public/` folder as
static assets (Cloudflare Pages redirected new projects to Workers as of
2026-09-14, so this is the Pages-equivalent setup). `wrangler.jsonc` in this
folder is the whole configuration:

- `public/.well-known/assetlinks.json`: the App Links statement.
- `public/_headers`: forces `Content-Type: application/json` and a short
  cache on that one path.
- `public/index.html`: a placeholder home page so the apex is not blank.
- `public/connect/index.html` and `public/import-shared/index.html`: what a
  phone or desktop WITHOUT the app sees when it opens an invite link. The app
  puts the invite code in the URL fragment (`/connect#data=CODE`, see
  `buildInviteLink` in `lib/connections.ts`), which a browser never sends to
  the server, so these pages read `location.hash` in the browser and offer a
  `hashimotosapp://connect?data=CODE` fallback button. Cloudflare sees a bare
  `/connect`, never the invite. Both are `noindex`.
- `routes`: attaches `insidestoryapp.com` and `www.insidestoryapp.com` as
  custom domains. Cloudflare owns the DNS records for those, which is why the
  Namecheap parking A/CNAME records had to go first.

Fallback URL, always live regardless of DNS:
`https://inside-story-site.app-links.workers.dev/.well-known/assetlinks.json`

## To update the files

1. Edit whatever changed under `public/`.
2. From this folder (not the repo root, which has its own `wrangler.jsonc`):
   `npx wrangler deploy`. Log in first with `npx wrangler login` if the
   session has expired; the account is Tonyrockdaschel@gmail.com's, id
   `50e842969c7475bddfb22aca635bcbe8`.

## The partner sync relay

`src/index.js` is the Worker script. Static assets are still served first;
anything under `/relay/v1/` matches no file in `public/` and falls through to
the script, and the script hands everything else back to the `ASSETS` binding.
That is why there is no route list here to keep in step with the pages.

It is a mailbox for sealed blobs and nothing else. A row is one sealed message
waiting for one person from one other person, addressed by two key
fingerprints. The Worker cannot open what it holds; the sealing happened on the
sending phone in `lib/partnerCrypto.ts` and only the recipient's device has the
other half. What it can see is written down honestly in the file's own header:
that one anonymous 16-character address sent something to another, and how big
it was.

**How it knows who is asking without accounts.** The mailbox address IS a key
fingerprint, and the credential is an Ed25519 signature from the key that
fingerprint came from, over a canonical string (protocol, verb, mailbox, time,
nonce, body hash). `lib/relayProtocol.ts` in the app is the other half of that
string and has to agree with `canonicalMessage` here byte for byte. There is no
password, no account, and nothing on this side worth stealing.

**Storage.** D1, not KV, for two reasons: D1 is strongly consistent, so a plan
sent from one phone is collectable from the other immediately rather than after
KV's propagation window, and the D1 free tier allows 100,000 writes a day
against KV's 1,000. Database `inside-story-relay`, id
`3de4da77-362a-4fd7-9889-db253a35bc77`, region WNAM.

Apply or re-apply the schema (`--remote` is what makes it hit the live
database rather than a local copy):

```
npx wrangler d1 execute inside-story-relay --remote --file=./relay-schema.sql
```

### Routes

| Route | Signed by | What it does |
| --- | --- | --- |
| `GET /relay/v1/health` | nobody | Protocol name, TTL, size ceiling. |
| `GET /relay/v1/peek?mailbox=FP` | nobody | How many messages wait and the newest time. Never who from. |
| `POST /relay/v1/send` | the sender | Stores one sealed blob for one recipient. |
| `POST /relay/v1/collect` | the mailbox owner | Hands back what is waiting, without deleting it. |
| `POST /relay/v1/ack` | the mailbox owner | Deletes only the senders the phone names. |

Collect and ack are separate on purpose, the same discipline the OneDrive
mailbox follows: a payload that failed one of the four arrival checks in
`lib/partnerTransfer.ts` stays put, so a fixable problem can be fixed and the
same message read again rather than thrown away unread.

### Limits, and the lever if they are ever not enough

Set as constants at the top of `src/index.js`: 256 KB per message, 25 distinct
senders per mailbox, 5,000 rows across the whole relay, 10 items per collect,
30-day expiry, and a 120-second clock-skew window. The two row ceilings are
what bound abuse to a fixed ceiling instead of an unbounded D1 bill. Expiry is
swept opportunistically on each request rather than by a cron trigger, which
can quietly stop running without anybody noticing.

If a flood ever gets past those, the lever is a Cloudflare Rate Limiting rule
on `/relay/v1/*` in the dashboard, which needs no deploy.

### Verifying the relay

```
curl -s https://insidestoryapp.com/relay/v1/health
curl -s "https://insidestoryapp.com/relay/v1/peek?mailbox=0000000000000000"
```

The first should answer
`{"ok":true,"protocol":"inside-story/relay/v1","ttlDays":30,"maxBodyBytes":262144}`
and the second `{"ok":true,"waiting":0,"newest":null}`.

A full round trip (send, collect, ack, plus every refusal the Worker is
supposed to make) needs two signing keys, so it is a script rather than a curl:
`relay-roundtrip.mjs` in this folder, run with
`node docs/app-links/relay-roundtrip.mjs` from the repo root. It uses the
repo's own `tweetnacl` to stand in for two phones, and answered 15 passed, 0
failed against production on 2026-09-15. It proved WebCrypto Ed25519 works in
Workers and that the Worker's SHA-512 fingerprint matches
`computeKeyFingerprint` byte for byte. It writes and then clears two throwaway
mailboxes, so it is safe to re-run against the live relay.

## DNS

The domain's nameservers at Namecheap were switched to Cloudflare on
2026-09-14 (`felipe.ns.cloudflare.com`, `sofia.ns.cloudflare.com`, zone id
`cd9e0b10a28c0eb57da33b6f77ac56df`). The MX and TXT records Cloudflare found
during onboarding were imported unchanged.

`insidestoryapp.net` is a second Cloudflare zone (id
`6ca730c3ac6b02215676f71e56bc64b3`, same nameserver pair, switched at
Namecheap the same day). It hosts nothing: a single Redirect Rule, "Redirect
.net to insidestoryapp.com", matches all incoming requests and answers a 301
to `concat("https://insidestoryapp.com", http.request.uri.path)` with the
query string preserved. The imported parking A and `www` CNAME records were
kept, proxied, so the rule has something to fire on; the MX and TXT records
were kept so Namecheap email forwarding keeps working. The App Link names the
.com host only, so the .net never needs an assetlinks file.

## Verifying

- `curl -sI https://insidestoryapp.com/.well-known/assetlinks.json` should
  return 200 with `content-type: application/json` and no redirect.
- `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://insidestoryapp.com&relation=delegate_permission/common.handle_all_urls`
  should list the package.
- On a phone running a build from this keystore:
  `adb shell pm get-app-links com.insidestoryapp.app` should say `verified`
  (Android re-checks on install, or force it with
  `adb shell pm verify-app-links --re-verify com.insidestoryapp.app`).

- `curl -sI https://insidestoryapp.com/connect/` should return 200 HTML with
  `x-robots-tag: noindex` (the bare `/connect` answers a 307 to the slash
  form; browsers carry the fragment across that redirect).

On a phone where the App Link did not verify, the same links open in the
browser and the landing page offers the `hashimotosapp://` fallback, which
works regardless.
