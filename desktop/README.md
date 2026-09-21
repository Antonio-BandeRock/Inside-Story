# Inside Story for Windows and Mac

The same app the phone runs, in an Electron window. Nothing in the app's
code is copied here: `build-web.js` exports the project for Expo's web
target with `INSIDE_STORY_DESKTOP=1`, which makes `metro.config.js` (in the
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
| `build-web.js` | Runs the export into `web-build/` |
| `electron-builder.yml` | The installer: NSIS for Windows, DMG for Mac; the reference database ships beside the asar |

`<userData>` is `%APPDATA%\inside-story-desktop` on Windows.

## Working on it

```
npm install                 # once, in this folder
node build-web.js           # export the app (about a minute)
npm start                   # run it
npm run dist                # export and build dist/Inside Story Setup <version>.exe
```

`INSIDE_STORY_DEV_URL=http://localhost:8081 npm start` loads Metro's dev
server instead of the export (`INSIDE_STORY_DESKTOP=1 npx expo start --web`
in the project root). `INSIDE_STORY_LOG=1` echoes the page console,
`INSIDE_STORY_SCREENSHOT=<file.png>` captures the window and quits,
`INSIDE_STORY_CLICK="label,label"` presses those first, and
`INSIDE_STORY_EVAL="<expression>"` logs what an expression evaluates to in
the page. Under Git Bash, set `MSYS_NO_PATHCONV=1` or a route such as
`/food` is rewritten into a Windows path before Electron sees it.

## Versions

The app's version is four parts (see `constants/version.ts`), which is not
semver, so `package.json` here carries the first three and
`electron-builder.yml`'s `buildVersion` carries all four. Bump both with the
app.
