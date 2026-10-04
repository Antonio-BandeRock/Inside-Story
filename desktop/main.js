// Inside Story for Windows and Mac: Electron's main process.
//
// The window shows the same app the phone runs, exported for the web
// target by `node build-web.js` into web-build/ and served from there over
// a private app:// scheme (a file:// page cannot load the export's
// absolute /_expo/static/ paths, and a served origin keeps expo-router's
// history and storage working as they do in a browser). What the phone's
// native modules do is done here instead: SQLite runs in this process on
// node:sqlite (sqlite.js), secrets are encrypted with safeStorage
// (secrets.js), reminders are timers that raise system notifications
// (notifications.js), files live under the data folder (files.js), the
// shared folder is the OneDrive folder on the disk with no sign-in of its
// own (cloudFolder.js), how large the app draws is page zoom kept in
// settings.json (zoom.js), and
// the reference database is copied out of the install folder on first
// run. preload.js exposes those to the page as
// window.insideStoryDesktop, and lib/desktop/bridge.ts in the app is the
// TypeScript description of that object.
//
// INSIDE_STORY_DEV_URL=http://localhost:8081 loads Metro's dev server
// instead of web-build/, for working on the desktop build live
// (`INSIDE_STORY_DESKTOP=1 npx expo start --web` in the project root).

const { app, BrowserWindow, ipcMain, net, protocol, screen, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const sqlite = require('./sqlite');
const secrets = require('./secrets');
const notifications = require('./notifications');
const files = require('./files');
const cloudFolder = require('./cloudFolder');
const zoom = require('./zoom');
const stationListener = require('./stationListener');
const print = require('./print');
const hello = require('./hello');

const APP_ID = 'com.insidestoryapp.app';
const SCHEME = 'app';
const HOST = 'inside-story';
const WEB_ROOT = path.join(__dirname, 'web-build');
const REFERENCE_DB_FILE = 'foods_reference.db';

// A phone-shaped window: the app lays itself out for one column, the
// popup menus measure the window to place themselves, and this size keeps
// both looking as they do on a phone. The person can resize it. These are
// screen pixels; at the standard zoom (zoom.js, 125%) the app sees a 480
// by 800 window, the phone shape the 2026-09-21 build opened at, drawn a
// quarter larger so it reads at arm's length.
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 1000;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 600;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function shippedReferenceDatabase() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, REFERENCE_DB_FILE);
  }
  return path.join(__dirname, '..', 'assets', 'data', REFERENCE_DB_FILE);
}

// Resolves a request path to a file in web-build/. The export writes one
// HTML file per route (index.html, profile.html, ...), so a route without
// an extension tries its .html first, and anything unknown falls back to
// index.html for expo-router to route on the client.
function resolveWebFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');
  const candidates = [];
  if (relative === '') {
    candidates.push('index.html');
  } else {
    candidates.push(relative);
    if (!path.extname(relative)) {
      candidates.push(`${relative}.html`);
      candidates.push(path.join(relative, 'index.html'));
    }
  }
  for (const candidate of candidates) {
    const file = path.normalize(path.join(WEB_ROOT, candidate));
    if (!file.startsWith(WEB_ROOT)) {
      continue;
    }
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return file;
    }
  }
  return path.join(WEB_ROOT, 'index.html');
}

function serveWebFile(request) {
  const url = new URL(request.url);
  const file = resolveWebFile(url.pathname);
  try {
    const body = fs.readFileSync(file);
    const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    return new Response(body, { status: 200, headers: { 'Content-Type': type } });
  } catch {
    return new Response(`Not found: ${url.pathname}`, { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }
}

function registerIpc() {
  const userData = app.getPath('userData');

  ipcMain.handle('sqlite:open', (_event, name) => sqlite.openDatabase(userData, name));
  ipcMain.handle('sqlite:run', (_event, name, sql, params) => sqlite.run(userData, name, sql, params));
  ipcMain.handle('sqlite:all', (_event, name, sql, params) => sqlite.all(userData, name, sql, params));
  ipcMain.handle('sqlite:get', (_event, name, sql, params) => sqlite.get(userData, name, sql, params));
  ipcMain.handle('sqlite:exec', (_event, name, sql) => sqlite.exec(userData, name, sql));
  ipcMain.handle('sqlite:importReference', (_event, name) =>
    sqlite.importReference(userData, name, shippedReferenceDatabase()),
  );
  // App Lock (1.0.60.7): the records sealed on disk (sealedDb.js) and
  // opened into memory with the key, and Windows Hello holding a copy of it.
  ipcMain.handle('sqlite:unlock', (_event, name, keyBase64) => sqlite.unlock(userData, name, keyBase64));
  ipcMain.handle('sqlite:close', (_event, name) => sqlite.close(name));
  ipcMain.handle('sqlite:seal', (_event, name, keyBase64) => sqlite.seal(userData, name, keyBase64));
  ipcMain.handle('sqlite:unseal', (_event, name, keyBase64) => sqlite.unseal(userData, name, keyBase64));
  ipcMain.handle('sqlite:keepSealed', (_event, name) => sqlite.keepSealed(userData, name));
  ipcMain.handle('sqlite:abandonSeal', (_event, name) => sqlite.abandonSeal(userData, name));
  ipcMain.handle('sqlite:setAsideSealed', (_event, name) => sqlite.setAsideSealed(userData, name));
  ipcMain.handle('sqlite:filesOnDisk', (_event, name) => sqlite.filesOnDisk(userData, name));
  ipcMain.handle('hello:available', () => hello.available());
  ipcMain.handle('hello:wrapKey', (_event, keyBase64) => hello.wrapKey(keyBase64));
  ipcMain.handle('hello:unwrapKey', (_event, stored) => hello.unwrapKey(stored));
  ipcMain.handle('hello:remove', () => hello.remove());

  ipcMain.on('app:version', (event) => {
    event.returnValue = app.getVersion();
  });
  ipcMain.on('app:paths', (event) => {
    const { document, cache, sqlite } = files.folders(userData);
    event.returnValue = { document: files.toUri(document, true), cache: files.toUri(cache, true), sqlite };
  });

  // Files answer synchronously: the phone's File API is synchronous and
  // the app reads two small settings files with it before the first
  // render. A thrown error travels back as the reply's `error`.
  const syncFile = (channel, handler) => {
    ipcMain.on(channel, (event, ...args) => {
      try {
        event.returnValue = { value: handler(...args) };
      } catch (error) {
        event.returnValue = { error: error && error.message ? error.message : String(error) };
      }
    });
  };
  syncFile('files:stat', (uri) => files.stat(uri));
  syncFile('files:readText', (uri) => files.readText(uri));
  syncFile('files:readBase64', (uri) => files.readBase64(uri));
  syncFile('files:writeText', (uri, text) => files.writeText(userData, uri, text));
  syncFile('files:writeBase64', (uri, base64) => files.writeBase64(userData, uri, base64));
  syncFile('files:delete', (uri) => files.remove(userData, uri));
  syncFile('files:makeDirectory', (uri, intermediates) => files.makeDirectory(userData, uri, intermediates));
  syncFile('files:list', (uri) => files.list(uri));
  syncFile('files:copy', (from, to) => files.copy(userData, from, to));
  syncFile('files:move', (from, to) => files.move(userData, from, to));
  // The two dialogs wait on the person, so they answer asynchronously.
  ipcMain.handle('files:pick', (_event, options) => files.pick(() => mainWindow, options));
  ipcMain.handle('files:saveAs', (_event, uri, options) => files.saveAs(() => mainWindow, uri, options));
  // K11: a page of HTML to the printer, or laid out as a PDF file, in a
  // hidden window of its own (print.js).
  ipcMain.handle('print:html', (_event, html) => print.printHtml(files.folders(userData).cache, html));
  ipcMain.handle('print:toPdf', (_event, html, fileBase) => print.htmlToPdf(files.folders(userData).cache, html, fileBase));

  ipcMain.handle('secrets:get', (_event, key) => secrets.get(userData, key));
  ipcMain.handle('secrets:set', (_event, key, value) => secrets.set(userData, key, value));
  ipcMain.handle('secrets:delete', (_event, key) => secrets.remove(userData, key));

  // The shared folder: OneDrive's folder on this disk, no sign-in. Each
  // call answers a value or throws, and lib/desktop/cloudFolder.ts turns
  // the throw into the sentence the app shows.
  ipcMain.handle('cloud:roots', () => cloudFolder.roots());
  ipcMain.handle('cloud:pickFolder', (_event, defaultPath) => cloudFolder.pickFolder(() => mainWindow, defaultPath));
  ipcMain.handle('cloud:stat', (_event, folder) => cloudFolder.stat(folder));
  ipcMain.handle('cloud:listFolders', (_event, folder) => cloudFolder.listFolders(folder));
  ipcMain.handle('cloud:listFiles', (_event, folder) => cloudFolder.listFiles(folder));
  ipcMain.handle('cloud:makeFolder', (_event, parent, name) => cloudFolder.makeFolder(parent, name));
  ipcMain.handle('cloud:readText', (_event, folder, fileName) => cloudFolder.readText(folder, fileName));
  ipcMain.handle('cloud:writeText', (_event, folder, fileName, text) => cloudFolder.writeText(folder, fileName, text));
  ipcMain.handle('cloud:deleteFile', (_event, folder, fileName) => cloudFolder.deleteFile(folder, fileName));
  ipcMain.handle('cloud:moveFile', (_event, from, fileName, into) => cloudFolder.moveFile(from, fileName, into));
  ipcMain.handle('cloud:copyFileIn', (_event, folder, fileName, source) => cloudFolder.copyFileIn(folder, fileName, source));
  ipcMain.handle('cloud:readBytes', (_event, folder, fileName) => cloudFolder.readBytes(folder, fileName));

  ipcMain.handle('notifications:schedule', (_event, request) => notifications.schedule(request));
  ipcMain.handle('notifications:cancel', (_event, identifier) => notifications.cancel(identifier));
  ipcMain.handle('notifications:listScheduled', () => notifications.listScheduled());
  ipcMain.handle('notifications:lastResponse', () => notifications.getLastResponse());

  // A recipe page for Food > Import a Recipe (G1, 1.0.53.12). The page's
  // own fetch cannot read another site from app://, so the main process
  // reads it: http and https only, 15 seconds, 5 MB at most, text only.
  ipcMain.handle('web:fetchPage', (_event, url) => fetchPage(url));

  // A weather station that sends its readings here (I22): listening starts
  // only when the app asks, and each post is passed to the window.
  stationListener.install((report) => {
    if (mainWindow) mainWindow.webContents.send('station:report', report);
  });
  ipcMain.handle('station:start', (_event, port) => stationListener.start(port));
  ipcMain.handle('station:stop', () => stationListener.stop());
  ipcMain.handle('station:status', () => stationListener.status());
}

const PAGE_LIMIT_BYTES = 5 * 1024 * 1024;

async function fetchPage(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
    throw new Error('Only a web address starting with http or https can be read.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await net.fetch(url.trim(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': `InsideStory/${app.getVersion()} (recipe import)` },
    });
    if (!response.ok) throw new Error(`The site answered ${response.status}.`);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > PAGE_LIMIT_BYTES) throw new Error('The page is larger than 5 MB.');
    const text = await response.text();
    return { text: text.slice(0, PAGE_LIMIT_BYTES), finalUrl: response.url || url.trim() };
  } catch (error) {
    if (error && error.name === 'AbortError') throw new Error('The site took longer than 15 seconds to answer.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

let mainWindow = null;

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  // INSIDE_STORY_WINDOW="900x700" opens at that size instead, for checking
  // what a resized window does to the popup menus without dragging one.
  const sizeOverride = /^(\d+)x(\d+)$/.exec(process.env.INSIDE_STORY_WINDOW || '');
  mainWindow = new BrowserWindow({
    width: sizeOverride ? Number(sizeOverride[1]) : Math.min(DEFAULT_WIDTH, workArea.width),
    height: sizeOverride ? Number(sizeOverride[2]) : Math.min(DEFAULT_HEIGHT, workArea.height - 24),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: 'Inside Story',
    autoHideMenuBar: true,
    backgroundColor: '#0b0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      zoomFactor: zoom.current,
    },
  });
  zoom.attach(mainWindow);

  // App Lock: the page reloading is how the app locks and restarts, so the
  // key to sealed records goes with the page that held it.
  mainWindow.webContents.on('did-start-loading', () => sqlite.closeSealed());
  mainWindow.webContents.on('render-process-gone', () => sqlite.closeSealed());

  notifications.setDeliver((response) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('notifications:response', response);
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  // A link to somewhere else (a citation, a store page) opens in the
  // person's browser rather than inside this window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://`) && !url.startsWith(process.env.INSIDE_STORY_DEV_URL || '\u0000')) {
      event.preventDefault();
      if (/^https?:/.test(url)) {
        shell.openExternal(url);
      }
    }
  });

  // Two helpers for working on this build without watching the window:
  // INSIDE_STORY_LOG=1 echoes the page's console to this process's
  // stdout, and INSIDE_STORY_SCREENSHOT=<file.png> captures the window
  // after INSIDE_STORY_SCREENSHOT_AFTER_MS (default 8000) and quits.
  if (process.env.INSIDE_STORY_LOG === '1') {
    mainWindow.webContents.on('console-message', (event) => {
      const { level, message, lineNumber, sourceId } = event;
      console.log(`[page ${level}] ${message} (${sourceId}:${lineNumber})`);
    });
    mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
      console.log(`[page load failed] ${code} ${description} ${url}`);
    });
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      console.log(`[page gone] ${details.reason}`);
    });
  }
  // INSIDE_STORY_CLICK="OK,Got it" presses those labels (text or
  // aria-label) in turn, a second and a half apart, starting after
  // INSIDE_STORY_CLICK_AFTER_MS (default 4000), before the screenshot.
  const clickLabels = (process.env.INSIDE_STORY_CLICK || '').split(',').map((label) => label.trim()).filter(Boolean);
  if (clickLabels.length > 0) {
    clickLabels.forEach((label, index) => {
      setTimeout(() => {
        mainWindow.webContents.executeJavaScript(`(() => {
          const wanted = ${JSON.stringify(label)};
          const nodes = Array.from(document.querySelectorAll('div, span, button'));
          const hit = nodes.findLast((node) => node.getAttribute('aria-label') === wanted)
            || nodes.findLast((node) => node.childElementCount === 0 && node.textContent.trim() === wanted);
          if (!hit) { console.log('[click] not found: ' + wanted); return false; }
          let target = hit;
          for (let i = 0; i < 6 && target; i += 1) {
            if (target.getAttribute && (target.getAttribute('role') === 'button' || target.tabIndex >= 0)) break;
            target = target.parentElement;
          }
          (target || hit).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          console.log('[click] ' + wanted);
          return true;
        })()`).catch((error) => console.log('[click failed] ' + error.message));
      }, Number(process.env.INSIDE_STORY_CLICK_AFTER_MS || 4000) + index * 1500);
    });
  }
  // INSIDE_STORY_EVAL="<expression>" evaluates it in the page once the
  // clicks are done and logs the result, for checking the bridge directly.
  const evalSource = process.env.INSIDE_STORY_EVAL;
  if (evalSource) {
    setTimeout(() => {
      mainWindow.webContents
        .executeJavaScript(`Promise.resolve(${evalSource}).then((value) => JSON.stringify(value))`)
        .then((value) => console.log(`[eval] ${value}`))
        .catch((error) => console.log(`[eval failed] ${error.message}`));
    }, Number(process.env.INSIDE_STORY_CLICK_AFTER_MS || 4000) + clickLabels.length * 1500 + 500);
  }
  const screenshotFile = process.env.INSIDE_STORY_SCREENSHOT;
  if (screenshotFile) {
    const after = Number(process.env.INSIDE_STORY_SCREENSHOT_AFTER_MS || 8000);
    setTimeout(async () => {
      try {
        const image = await mainWindow.webContents.capturePage();
        fs.writeFileSync(screenshotFile, image.toPNG());
        console.log(`[screenshot] ${screenshotFile}`);
      } catch (error) {
        console.log(`[screenshot failed] ${error.message}`);
      }
      app.quit();
    }, after);
  }

  const devUrl = process.env.INSIDE_STORY_DEV_URL;
  const startRoute = process.env.INSIDE_STORY_ROUTE || '/';
  mainWindow.loadURL(devUrl || `${SCHEME}://${HOST}${startRoute}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

app.setAppUserModelId(APP_ID);

app.whenReady().then(() => {
  protocol.handle(SCHEME, serveWebFile);
  registerIpc();
  zoom.install(app.getPath('userData'), () => mainWindow);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  void stationListener.stop();
  sqlite.closeAll();
});
