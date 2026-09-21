// Runs in the window before the app's code, with the page isolated from
// Node. It puts one object on window, insideStoryDesktop, whose shape is
// described in lib/desktop/bridge.ts; keep the two in step. Every call
// goes to main.js over IPC, and a click on a reminder notification comes
// back the other way as 'notifications:response'.

const { contextBridge, ipcRenderer } = require('electron');

// A synchronous file call answers { value } or { error }; the error is
// rethrown here so the page sees a thrown Error the way it would on a phone.
function unwrap(reply) {
  if (reply && reply.error !== undefined) {
    throw new Error(reply.error);
  }
  return reply ? reply.value : undefined;
}

const responseListeners = new Set();
ipcRenderer.on('notifications:response', (_event, response) => {
  for (const listener of responseListeners) {
    try {
      listener(response);
    } catch (error) {
      console.error('reminder response listener failed', error);
    }
  }
});

contextBridge.exposeInMainWorld('insideStoryDesktop', {
  platform: 'desktop',
  appVersion: ipcRenderer.sendSync('app:version'),
  paths: ipcRenderer.sendSync('app:paths'),
  sqlite: {
    open: (name) => ipcRenderer.invoke('sqlite:open', name),
    run: (name, sql, params) => ipcRenderer.invoke('sqlite:run', name, sql, params),
    all: (name, sql, params) => ipcRenderer.invoke('sqlite:all', name, sql, params),
    get: (name, sql, params) => ipcRenderer.invoke('sqlite:get', name, sql, params),
    exec: (name, sql) => ipcRenderer.invoke('sqlite:exec', name, sql),
    importReference: (name) => ipcRenderer.invoke('sqlite:importReference', name),
  },
  secrets: {
    get: (key) => ipcRenderer.invoke('secrets:get', key),
    set: (key, value) => ipcRenderer.invoke('secrets:set', key, value),
    delete: (key) => ipcRenderer.invoke('secrets:delete', key),
  },
  files: {
    stat: (uri) => unwrap(ipcRenderer.sendSync('files:stat', uri)),
    readText: (uri) => unwrap(ipcRenderer.sendSync('files:readText', uri)),
    readBase64: (uri) => unwrap(ipcRenderer.sendSync('files:readBase64', uri)),
    writeText: (uri, text) => unwrap(ipcRenderer.sendSync('files:writeText', uri, text)),
    writeBase64: (uri, base64) => unwrap(ipcRenderer.sendSync('files:writeBase64', uri, base64)),
    delete: (uri) => unwrap(ipcRenderer.sendSync('files:delete', uri)),
    makeDirectory: (uri, intermediates) => unwrap(ipcRenderer.sendSync('files:makeDirectory', uri, intermediates)),
    list: (uri) => unwrap(ipcRenderer.sendSync('files:list', uri)),
    copy: (from, to) => unwrap(ipcRenderer.sendSync('files:copy', from, to)),
    move: (from, to) => unwrap(ipcRenderer.sendSync('files:move', from, to)),
  },
  notifications: {
    schedule: (request) => ipcRenderer.invoke('notifications:schedule', request),
    cancel: (identifier) => ipcRenderer.invoke('notifications:cancel', identifier),
    listScheduled: () => ipcRenderer.invoke('notifications:listScheduled'),
    lastResponse: () => ipcRenderer.invoke('notifications:lastResponse'),
    onResponse: (listener) => {
      responseListeners.add(listener);
      return () => {
        responseListeners.delete(listener);
      };
    },
  },
});
