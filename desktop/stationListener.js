// Receives readings a weather station sends by itself (I22, 2026-09-28).
//
// In the Ecowitt app a gateway or console can be told to post every reading
// to a server on the home network ("Customized", protocol Ecowitt). This is
// that server: a small HTTP listener on this computer, started only while a
// gateway set to send is read on this computer (the app asks for it through
// 'station:start' and 'station:stop'). Each post's body is handed to the
// window as 'station:report'; what it means is worked out in the app
// (lib/ecowittPush.ts), and nothing is kept here.
//
// Only a sender on the home network is answered: a post from any address
// that is not private or this computer gets 403 and never reaches the app.
// A GET answers with a line of text, so the person can check from a phone's
// browser that the computer can be reached at all.

const http = require('node:http');
const os = require('node:os');

const MAX_BODY_BYTES = 64 * 1024;

let server = null;
let port = null;
let lastError = null;
let lastReport = null;
let send = () => {};

function plainAddress(address) {
  if (!address) return '';
  return address.startsWith('::ffff:') ? address.slice(7) : address;
}

/** Whether an address is on a home network or this computer. */
function isNearby(address) {
  const ip = plainAddress(address);
  if (ip === '::1' || ip.startsWith('127.')) return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
  const second = /^172\.(\d+)\./.exec(ip);
  if (second && Number(second[1]) >= 16 && Number(second[1]) <= 31) return true;
  if (/^f[cd]/i.test(ip) || /^fe80:/i.test(ip)) return true;
  return false;
}

/** This computer's addresses on the home network, for the setup steps. */
function addresses() {
  const found = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.internal || entry.family !== 'IPv4') continue;
      if (!isNearby(entry.address) || entry.address.startsWith('169.254.')) continue;
      found.push(entry.address);
    }
  }
  return [...new Set(found)];
}

function handle(request, response) {
  const from = plainAddress(request.socket.remoteAddress);
  if (!isNearby(from)) {
    response.writeHead(403, { 'Content-Type': 'text/plain' });
    response.end('Not from this network.');
    return;
  }
  if (request.method !== 'POST') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Lifestead is listening.');
    return;
  }
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      tooLarge = true;
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on('end', () => {
    if (tooLarge) return;
    const body = Buffer.concat(chunks).toString('utf8');
    const query = (request.url || '').includes('?') ? (request.url || '').split('?').slice(1).join('?') : '';
    const text = [body, query].filter(Boolean).join('&');
    const receivedAt = new Date().toISOString();
    lastReport = { from, receivedAt };
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('OK');
    try {
      send({ from, body: text, receivedAt });
    } catch (error) {
      console.error('station report could not be passed on', error);
    }
  });
  request.on('error', () => {});
}

/** Starts listening on a port, or moves to another. Resolves with status(). */
function start(wantedPort) {
  const next = Number(wantedPort);
  if (!Number.isInteger(next) || next < 1024 || next > 65535) {
    lastError = 'The port has to be a whole number from 1024 to 65535.';
    return Promise.resolve(status());
  }
  if (server && port === next && !lastError) return Promise.resolve(status());
  return stop().then(
    () =>
      new Promise((resolve) => {
        const created = http.createServer(handle);
        created.on('error', (error) => {
          lastError =
            error && error.code === 'EADDRINUSE'
              ? `Port ${next} is already in use by another program on this computer. Pick another port here and in the Ecowitt app.`
              : `This computer could not listen on port ${next}: ${error && error.message ? error.message : error}`;
          server = null;
          resolve(status());
        });
        created.listen(next, '0.0.0.0', () => {
          server = created;
          port = next;
          lastError = null;
          resolve(status());
        });
      }),
  );
}

function stop() {
  const current = server;
  server = null;
  lastError = null;
  if (!current) return Promise.resolve(status());
  return new Promise((resolve) => current.close(() => resolve(status())));
}

function status() {
  return {
    listening: server !== null,
    port,
    addresses: addresses(),
    error: lastError,
    lastReport,
  };
}

/** Where each post goes: the window, through main.js. */
function install(sender) {
  send = sender;
}

module.exports = { install, start, stop, status, isNearby, addresses };
