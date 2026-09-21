// Dated reminders for the desktop app. lib/reminderNotifications.ts (via
// lib/desktop/notificationsShim.ts) schedules each reminder with an
// identifier, a title, a body, a payload and the time it should fire, and
// asks for the pending list back so it can reconcile. Here each one is a
// timer in the main process that shows an operating-system notification
// at its time; a click on it is sent to the window as a response carrying
// the payload, which the app reads the same way it reads a tap on the
// phone. The pending set is not written to disk: the app rebuilds it from
// the schedule at every startup, which is also how the phone recovers
// after a reboot.

const { Notification } = require('electron');

/** @type {Map<string, { request: any, timer: NodeJS.Timeout | null }>} */
const pending = new Map();

let lastResponse = null;
/** @type {(response: any) => void} */
let deliver = () => {};

// setTimeout takes a 32-bit delay, so anything further out than about 24
// days is checked again then rather than armed once.
const MAX_TIMER_MS = 2 ** 31 - 1;

function setDeliver(fn) {
  deliver = fn;
}

function show(request) {
  pending.delete(request.identifier);
  if (!Notification.isSupported()) {
    return;
  }
  const notification = new Notification({ title: request.title, body: request.body });
  notification.on('click', () => {
    const response = { identifier: request.identifier, data: request.data, respondedAt: Date.now() };
    lastResponse = response;
    deliver(response);
  });
  notification.show();
}

function arm(entry) {
  const delay = entry.request.fireAt - Date.now();
  if (delay <= 0) {
    show(entry.request);
    return;
  }
  entry.timer = setTimeout(() => {
    entry.timer = null;
    if (entry.request.fireAt - Date.now() > 1000) {
      arm(entry);
    } else {
      show(entry.request);
    }
  }, Math.min(delay, MAX_TIMER_MS));
}

function schedule(request) {
  cancel(request.identifier);
  const entry = { request, timer: null };
  pending.set(request.identifier, entry);
  arm(entry);
}

function cancel(identifier) {
  const entry = pending.get(identifier);
  if (!entry) {
    return;
  }
  if (entry.timer) {
    clearTimeout(entry.timer);
  }
  pending.delete(identifier);
}

function listScheduled() {
  return Array.from(pending.values(), (entry) => entry.request);
}

function getLastResponse() {
  return lastResponse;
}

module.exports = { setDeliver, schedule, cancel, listScheduled, getLastResponse };
