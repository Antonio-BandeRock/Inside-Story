# Lifestead for Windows and Mac

The same app the phone runs, in an Electron window. Nothing in the app's
code is copied here: `build-web.js` exports the project for Expo's web
target with `LIFESTEAD_DESKTOP=1`, which makes `metro.config.js` (in the
project root) swap the phone's native modules for the stand-ins in
`lib/desktop/`, and the files in this folder do what those natives did.

| File | Does |
| --- | --- |
| `main.js` | Electron's main process: the window, the `app://inside-story/` scheme that serves `web-build/`, and the IPC the stand-ins call |
| `preload.js` | Puts `window.insideStoryDesktop` on the page; `lib/desktop/bridge.ts` describes its shape |
| `sqlite.js` | SQLite on Node's built-in `node:sqlite`; databases in `<userData>/SQLite/` |
| `files.js` | The file system behind expo-file-system's File and Directory; `Documents/` and `Cache/` under `<userData>` |
| `secrets.js` | The keystore, one `safeStorage`-encrypted file per key under `<userData>/secrets/` |
| `notifications.js` | Reminders as timers that raise system notifications |
| `zoom.js` | How large the app draws: page zoom kept in `<userData>/settings.json` (125% by default), the View menu, Ctrl and + / - / 0, and the Text size picker in Profile |
| `build-web.js` | Runs the export into `web-build/` |
| `electron-builder.yml` | The installer: NSIS for Windows, DMG for Mac; the reference database ships beside the asar |

`<userData>` is `%APPDATA%\lifestead-desktop` on Windows (`inside-story-desktop` before 1.0.66, moved across whole on the first start).

## Working on it

```
npm install                 # once, in this folder
node build-web.js           # export the app (about a minute)
npm start                   # run it
npm run dist                # export and build dist/Lifestead Setup <version>.exe
```

`LIFESTEAD_DEV_URL=http://localhost:8081 npm start` loads Metro's dev
server instead of the export (`LIFESTEAD_DESKTOP=1 npx expo start --web`
in the project root). `LIFESTEAD_LOG=1` echoes the page console,
`LIFESTEAD_SCREENSHOT=<file.png>` captures the window and quits,
`LIFESTEAD_CLICK="label,label"` presses those first, `LIFESTEAD_WINDOW="1000x900"` opens at that size, and
`LIFESTEAD_EVAL="<expression>"` logs what an expression evaluates to in
the page. Under Git Bash, set `MSYS_NO_PATHCONV=1` or a route such as
`/food` is rewritten into a Windows path before Electron sees it.

## Versions

The app's version is four parts (see `constants/version.ts`), which is not
semver, so `package.json` here carries the first three and
`electron-builder.yml`'s `buildVersion` carries all four. Bump both with the
app.
