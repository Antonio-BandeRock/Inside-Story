// Wraps `expo start` so a QR code (and the plain exp:// URL as a fallback)
// always prints, every time the dev server starts -- Expo's own built-in QR
// display only shows up with a real interactive terminal attached, which
// isn't guaranteed for every way this project gets started (e.g. Claude
// Code's own shell tool runs commands without one). Also fixes a real bug
// from relying on a manually-noted IP address: this looks up the machine's
// actual current LAN IP fresh, every run, rather than reusing a
// previously-seen value that can go stale after a DHCP lease renewal.
const os = require('os');
const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

const PORT = 8081;

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

printQr();

const child = spawn('npx', ['expo', 'start', '--port', String(PORT), ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
