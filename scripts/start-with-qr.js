// Wraps `expo start` so a QR code (and the plain exp:// URL as a fallback)
// always prints, every time the dev server starts -- Expo's own built-in QR
// display only shows up with a real interactive terminal attached, which
// isn't guaranteed for every way this project gets started (e.g. Claude
// Code's own shell tool runs commands without one). Also fixes a real bug
// from relying on a manually-noted IP address: this looks up the machine's
// actual current LAN IP fresh, every run, rather than reusing a
// previously-seen value that can go stale after a DHCP lease renewal.
const os = require('os');
const { execSync, spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

const PORT = 8081;

// Kills any process already listening on PORT before starting a fresh one,
// 2026-08-02 -- added after this recurring, real time-wasting pattern: a
// Metro process left running from a previous session (sometimes since the
// day before) silently keeps serving an old JS bundle to the phone. Every
// individual code change looked correct, the app got force-stopped and
// reopened, and nothing changed -- because the phone was still talking to
// the SAME stale server process the whole time, which a plain app restart
// can never fix (it only restarts the app, not the dev server on the PC).
// This happened twice in one day before this fix. Rather than relying on
// remembering to check for and kill a leftover process by hand each time,
// this wrapper -- already run for every single `npm start`/`npm run
// android` invocation -- now guarantees a genuinely fresh server on every
// run, automatically, with no memory required. Windows-only commands
// (netstat/taskkill), matching this project's own Windows-only dev
// environment.
function killExistingServer(port) {
  let output;
  try {
    output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
  } catch {
    // findstr exits non-zero when nothing matches -- the port's already
    // free, nothing to do.
    return;
  }

  const pids = new Set();
  for (const line of output.split('\n')) {
    const match = line.trim().match(/(\d+)\s*$/);
    if (match && match[1] !== '0') pids.add(match[1]);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`Stopped a leftover dev server (PID ${pid}) that was still holding port ${port}.`);
    } catch {
      // Already gone by the time taskkill ran, or couldn't be killed for
      // some other reason -- not fatal either way: if the port is truly
      // still in use, `expo start` itself will surface a clear
      // port-in-use error rather than silently reusing the old server.
    }
  }
}

// Virtual/VPN adapters (Bitdefender's own VPN service, Tailscale, Hyper-V
// vEthernet, WSL) show up in os.networkInterfaces() alongside the real
// Wi-Fi/Ethernet adapter a phone would actually route through. Prefer an
// adapter literally named Wi-Fi/Ethernet first; only fall back to "any
// other non-internal IPv4" if neither is present, and even then skip names
// that are obviously virtual.
function findLanIp() {
  const interfaces = os.networkInterfaces();
  const preferredNames = ['Wi-Fi', 'Ethernet'];
  const skipPattern = /vpn|virtual|vethernet|tailscale|loopback|wsl/i;

  for (const name of preferredNames) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (skipPattern.test(name)) continue;
    for (const iface of addrs ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

function printQr() {
  const ip = findLanIp();
  if (!ip) {
    console.log('\nCould not detect a LAN IP address -- connect Expo Go manually once the server is up.\n');
    return;
  }
  const url = `exp://${ip}:${PORT}`;
  console.log('\nScan this in Expo Go (or tap "Enter URL manually" and type the address below):\n');
  qrcode.generate(url, { small: true }, (code) => console.log(code));
  console.log(`\n${url}\n`);
}

// 2026-08-28, direct follow-up to a real, repeated on-device problem:
// "It loads to 95% and stalls forever" / "This has happened before" --
// root-caused (lib/db.ts's own getReferenceDatabase comment, 2026-08-11)
// to expo-sqlite's importDatabaseFromAssetAsync doing a real network
// fetch of the whole ~130MB+ reference-database asset over whatever
// connection the phone is talking to Metro through. That connection has
// always been the LAN IP printed above, i.e. WiFi -- confirmed directly
// that same day: the identical file copies in under a second over USB
// (149.7 MB/s) but took 100+ seconds this way. Rather than only ever
// telling a person to plug in after they're already stuck, this
// automatically sets up the USB path every time a device is already
// connected when the server starts, so it's there and ready if a real
// reimport is ever needed: `adb reverse` tunnels Metro's own port over
// the USB cable, so a phone that reaches this dev server via
// http://127.0.0.1:8081 instead of the LAN IP gets the fast path for
// free. Purely additive and best-effort -- no adb installed, no device
// currently connected, or the reverse call itself failing all just skip
// silently; the WiFi QR code above still works exactly as before either
// way, this never changes what already gets printed.
function setUpUsbReverseIfDeviceConnected(port) {
  let devices;
  try {
    devices = execSync('adb devices', { encoding: 'utf8' });
  } catch {
    return; // adb not installed/on PATH -- nothing to do.
  }
  const connected = devices
    .split('\n')
    .slice(1)
    .some((line) => line.trim().endsWith('device'));
  if (!connected) return;

  try {
    execSync(`adb reverse tcp:${port} tcp:${port}`, { stdio: 'ignore' });
    console.log(
      `A USB-connected device was detected -- reversed port ${port} over USB for a much faster connection.\n` +
        `If a real reference-database reimport is ever needed again, open the app via a build that talks to ` +
        `http://127.0.0.1:${port} (or reload the dev client while genuinely connected by USB) rather than the WiFi ` +
        `URL above -- the same real transfer that takes 100+ seconds over WiFi finishes in under a second this way.\n`,
    );
  } catch {
    // Device listed but reverse still failed (unauthorized, mid-reconnect,
    // etc.) -- not fatal, the WiFi path above still works regardless.
  }
}

killExistingServer(PORT);
printQr();
setUpUsbReverseIfDeviceConnected(PORT);

const child = spawn('npx', ['expo', 'start', '--port', String(PORT), ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
