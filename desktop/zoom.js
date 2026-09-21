// How large the app draws on this computer.
//
// Reported 2026-09-21, the first day the desktop build ran: "the font isn't
// as easy to read on the Windows app. What can we do to make it a bit more
// legible." The app's text sizes were chosen for a phone held close, and a
// monitor at 100% scaling draws one CSS pixel as one screen pixel, so the
// same 13 px caption that reads fine on a phone is a small thing at arm's
// length. The phone answers this with its font-size setting, which the app
// follows everywhere; a computer has no such setting the page can see, so
// this is that setting: Chromium's page zoom, which scales text, spacing,
// artwork and the popup menus together, the way a phone's display-size
// setting does, and leaves the app's layout arithmetic alone
// (useWindowDimensions reports the zoomed width, so the app still lays out
// one phone-shaped column).
//
// The factor is kept in <userData>/settings.json, applied to the window
// every time a page loads, and changed three ways: the View menu (Alt
// shows it), Ctrl and + or - (Cmd on a Mac) with Ctrl and 0 for the
// standard size, and the Text size picker in Profile, which talks to
// this file over IPC. The steps and the standard are the same list as
// lib/desktop/zoom.ts in the app, and scripts/test_hub_handoff.js fails if
// the two drift apart.

const fs = require('node:fs');
const path = require('node:path');
const { ipcMain, Menu } = require('electron');

const ZOOM_STEPS = [1, 1.1, 1.25, 1.5, 1.75, 2];
const DEFAULT_ZOOM = 1.25;
const SETTINGS_FILE = 'settings.json';

function settingsPath(userData) {
  return path.join(userData, SETTINGS_FILE);
}

function readSettings(userData) {
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath(userData), 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSettings(userData, settings) {
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(settingsPath(userData), JSON.stringify(settings, null, 2));
}

// A factor off the list (an old settings file, a hand edit) lands on the
// nearest step rather than being refused, so the menu and the picker
// always describe what is on screen.
function nearestStep(factor) {
  const value = Number(factor);
  if (!Number.isFinite(value)) return DEFAULT_ZOOM;
  let best = ZOOM_STEPS[0];
  for (const step of ZOOM_STEPS) {
    if (Math.abs(step - value) < Math.abs(best - value)) best = step;
  }
  return best;
}

function readZoom(userData) {
  const stored = readSettings(userData).zoomFactor;
  return nearestStep(stored === undefined ? DEFAULT_ZOOM : stored);
}

function writeZoom(userData, factor) {
  writeSettings(userData, { ...readSettings(userData), zoomFactor: factor });
}

// The next step up or down from the current one, staying on the list.
function steppedZoom(current, direction) {
  const index = ZOOM_STEPS.indexOf(nearestStep(current));
  const next = Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + direction));
  return ZOOM_STEPS[next];
}

let current = DEFAULT_ZOOM;
let getWindow = () => null;
let userDataPath = null;

function apply(factor) {
  current = nearestStep(factor);
  const win = getWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.setZoomFactor(current);
    win.webContents.send('zoom:changed', current);
  }
}

function set(factor) {
  apply(factor);
  if (userDataPath) writeZoom(userDataPath, current);
  return current;
}

function larger() {
  return set(steppedZoom(current, 1));
}

function smaller() {
  return set(steppedZoom(current, -1));
}

function standard() {
  return set(DEFAULT_ZOOM);
}

// Replaces Electron's default menu, whose View items zoom through
// webContents.zoomLevel, unpersisted and in different steps, and would
// have fired beside these. On Windows and Linux the accelerators here are
// shown but not registered (registerAccelerator: false), and the keys are
// read in handleKey below instead, so that + on the main keyboard (Shift
// and =), + on the number pad and = all work and none fires twice. A Mac's
// native menu handles its own accelerators, and there they are registered.
function buildMenu() {
  const registerAccelerator = process.platform === 'darwin';
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Text Larger', accelerator: 'CmdOrCtrl+=', registerAccelerator, click: larger },
        { label: 'Text Smaller', accelerator: 'CmdOrCtrl+-', registerAccelerator, click: smaller },
        { label: 'Standard Text Size', accelerator: 'CmdOrCtrl+0', registerAccelerator, click: standard },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Ctrl and =, +, number-pad + (larger); Ctrl and -, number-pad - (smaller);
// Ctrl and 0 or number-pad 0 (standard). Windows and Linux only; see buildMenu.
function handleKey(event, input) {
  if (process.platform === 'darwin' || input.type !== 'keyDown' || !input.control || input.alt || input.meta) return;
  const key = input.key;
  if (key === '=' || key === '+' || input.code === 'NumpadAdd') {
    event.preventDefault();
    larger();
  } else if (key === '-' || key === '_' || input.code === 'NumpadSubtract') {
    event.preventDefault();
    smaller();
  } else if (key === '0' || input.code === 'Numpad0') {
    event.preventDefault();
    standard();
  }
}

/**
 * Called once from main.js: remembers where settings live and which window
 * to zoom, answers the page's IPC, and builds the menu.
 */
function install(userData, windowGetter) {
  userDataPath = userData;
  getWindow = windowGetter;
  current = readZoom(userData);
  ipcMain.handle('zoom:get', () => current);
  ipcMain.handle('zoom:set', (_event, factor) => set(factor));
  buildMenu();
}

/** Wires a new window: the stored factor on every load, and the keys. */
function attach(win) {
  win.webContents.on('did-finish-load', () => apply(current));
  win.webContents.on('before-input-event', handleKey);
}

module.exports = {
  ZOOM_STEPS,
  DEFAULT_ZOOM,
  nearestStep,
  steppedZoom,
  install,
  attach,
  get current() {
    return current;
  },
};
