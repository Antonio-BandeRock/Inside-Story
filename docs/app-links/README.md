# App Links hosting for insidestoryapp.com

`.well-known/assetlinks.json` here is the file Android checks before it lets
`https://insidestoryapp.com/connect` and `/import-shared` open Inside Story
directly instead of a browser (the `autoVerify` intent filter added to
`app.json` in the 2026-09-14 rebuild, 1.0.37.33).

The certificate fingerprint in it is the EAS-managed Android signing key
(Build Credentials VmkcgH8VMO), read from the 1.0.37.33 APK with
`apksigner verify --print-certs`. It only changes if the EAS keystore is
replaced, so every later build keeps verifying against this file.

## To go live

1. Serve this folder's `.well-known/assetlinks.json` at exactly
   `https://insidestoryapp.com/.well-known/assetlinks.json`, over https, with
   `Content-Type: application/json`, no redirect. Cloudflare Pages, Netlify or
   GitHub Pages all do this for free from a folder; Namecheap's own hosting
   works too as long as https is on.
2. Point `insidestoryapp.net` at the .com with a redirect; the App Link only
   names the .com host.
3. Confirm with
   `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://insidestoryapp.com&relation=delegate_permission/common.handle_all_urls`
   (should list the package) and on a phone with
   `adb shell pm get-app-links com.insidestoryapp.app` (should say `verified`).

Until the file is hosted, the same links open in the browser, where nothing
is served yet; `hashimotosapp://connect` and `hashimotosapp://import-shared`
keep working regardless.
