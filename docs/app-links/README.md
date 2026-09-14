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
