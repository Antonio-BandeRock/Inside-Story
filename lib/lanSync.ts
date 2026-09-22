// Syncing with a partner over the Wi-Fi the two phones share.
//
// The third carrier for the same sealed PartnerSyncFile the share sheet and
// the linked file already move (lib/partnerTransfer.ts). Nothing about what
// travels, who can open it, or what has to be true before it is stored is
// decided here: buildWireForPartner builds the wire and applySyncFileText
// runs the same four checks it runs on a file somebody picked. This module
// only moves bytes across a room.
//
// HOW IT WORKS, SYMMETRICALLY. Each phone that taps Sync over Wi-Fi does the
// same four things: writes one sealed file per partner into a cache folder,
// serves that folder over plain HTTP on the phone's Wi-Fi address
// (@dr.pogodin/react-native-static-server, compiled into 1.0.37.33),
// announces itself on the local network under its key fingerprint
// (react-native-zeroconf, same build), and listens for other phones doing
// the same. When it hears a partner, it fetches the file addressed to
// itself from that partner's server and applies it. Both phones run this at
// once, so each pulls from the other and nobody has to be "the sender".
//
// WHY PLAIN HTTP IS FINE HERE. Every byte served is already sealed to one
// recipient's key (XSalsa20-Poly1305 via tweetnacl, see lib/deviceIdentity.ts),
// and the file for a partner is only addressed to that partner. Anyone else
// on the Wi-Fi who fetched it would hold ciphertext they cannot open. The
// server exists for a few minutes while the screen is open and is stopped
// with the files deleted when the person leaves.
//
// WHY A TXT RECORD RATHER THAN THE SERVICE NAME. Android renames a service
// when another with the same name is already on the network (it appends
// " (2)"), so the name cannot be relied on to carry the fingerprint. The
// TXT record travels untouched. The name is still set for anyone looking at
// the network with a browser tool.

import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import type { Connection } from './connections';
import { talksAutomatically } from './peerRelationships';
import { listConnections } from './connections';
import { getUserConditions } from './db';
import { computeKeyFingerprint, getMyKeyFingerprint } from './deviceIdentity';
import { applySyncFileText, buildWireForPartner } from './partnerTransfer';
import { compactFingerprint } from './syncInbox';

/** The mDNS service type both phones publish and look for: _insidestory._tcp. */
export const LAN_SYNC_SERVICE_TYPE = 'insidestory';
const LAN_SYNC_PROTOCOL = 'tcp';
const LAN_SYNC_DOMAIN = 'local.';
/** Bump if what is served or how it is addressed changes. */
const LAN_SYNC_WIRE_VERSION = '1';
/**
 * The TXT key carrying the address the server actually listens on. The
 * static server binds to the one IPv4 address it picked, while Android's
 * mDNS resolver hands back whichever address it heard first, which on a
 * phone with IPv6 enabled can be a link-local IPv6 one nothing is listening
 * on. Carrying the bound address in the announcement removes the guess.
 */
const LAN_SYNC_TXT_ADDRESS = 'a';
/** The cache folder the server reads from, under Paths.cache. */
const LAN_SYNC_DIR = 'lan-sync';
/** How long a session stays up on its own before stopping itself. */
export const LAN_SYNC_TIMEOUT_MS = 5 * 60 * 1000;
/** How long one fetch from a partner may take before it is given up on. */
const FETCH_TIMEOUT_MS = 10 * 1000;
/**
 * How many times one partner's file is fetched before the session reports
 * failure, and the pause between tries. The first resolve can arrive before
 * the other phone's server answers, and a phone that just re-joined the
 * Wi-Fi can refuse the first connection outright, so one try is not a
 * verdict. Four tries five seconds apart stay well inside the five-minute
 * session.
 */
const FETCH_ATTEMPTS = 4;
const FETCH_RETRY_MS = 5 * 1000;
/**
 * How often the session asks the network again for partner phones. A
 * partner that tapped Sync after this phone's first scan is announced, but
 * Android's resolver has been seen to sit on an announcement it heard once
 * and never report it again, so the scan is repeated.
 */
const RESCAN_MS = 20 * 1000;

export type LanSyncPhase = 'idle' | 'starting' | 'listening' | 'stopped' | 'failed';

export type LanSyncPartnerState = {
  connectionId: string;
  name: string;
  /** What the other phone would need to be running for this to work. */
  fingerprint: string;
  state: 'waiting' | 'fetching' | 'received' | 'failed' | 'noKey';
  message?: string;
};

export type LanSyncStatus = {
  phase: LanSyncPhase;
  /** This phone's address and port, once the server is up. */
  origin?: string;
  partners: LanSyncPartnerState[];
  /** Whatever stopped the session, if it was not the person. */
  error?: string;
  /** True once at least one partner's file was applied, so the caller can reload. */
  changed: boolean;
};

type Listener = (status: LanSyncStatus) => void;

// Listeners outlive any one session: the screen subscribes once and sees
// every session started while it is open.
const listeners = new Set<Listener>();

/** Everything one running session owns, so stop() can undo all of it. */
type Session = {
  status: LanSyncStatus;
  myCompact: string;
  partnersByCompact: Map<string, Connection>;
  fetched: Set<string>;
  connections: Connection[];
  server: { stop: () => Promise<unknown> } | null;
  zeroconf: {
    stop: () => void;
    unpublishService: (name: string) => void;
    removeAllListeners: () => unknown;
    removeDeviceListeners: () => void;
  } | null;
  serviceName: string | null;
  timer: ReturnType<typeof setTimeout> | null;
  rescanTimer: ReturnType<typeof setInterval> | null;
  dirUri: string | null;
  stopping: boolean;
};

let session: Session | null = null;

/** Where a partner's file for me is on their server, and mine for them on mine. */
function fileNameFor(recipientCompact: string): string {
  return `sync-${recipientCompact}.json`;
}

function notify(current: Session): void {
  if (current !== session) return;
  const snapshot: LanSyncStatus = { ...current.status, partners: current.status.partners.map((p) => ({ ...p })) };
  for (const listener of listeners) listener(snapshot);
}

function setPartnerState(
  current: Session,
  connectionId: string,
  state: LanSyncPartnerState['state'],
  message?: string,
): void {
  current.status.partners = current.status.partners.map((p) =>
    p.connectionId === connectionId ? { ...p, state, message } : p,
  );
  notify(current);
}

/** The current status without subscribing; idle when nothing is running. */
export function getLanSyncStatus(): LanSyncStatus {
  return session ? { ...session.status, partners: session.status.partners.map((p) => ({ ...p })) } : { phase: 'idle', partners: [], changed: false };
}

/**
 * Wi-Fi sync needs both natives, which only the compiled build has (Expo
 * Go and the web target have neither). Checked without importing either
 * package, since the static server's module import throws outright when
 * its native side is missing.
 */
export function isLanSyncAvailable(): boolean {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  try {
    return Boolean(TurboModuleRegistry.get('ReactNativeStaticServer')) && Boolean(NativeModules.RNZeroconf);
  } catch {
    return false;
  }
}

/**
 * Subscribes to status changes for the running session and any started
 * later. Returns the unsubscribe function.
 */
export function subscribeLanSync(listener: Listener): () => void {
  listeners.add(listener);
  listener(getLanSyncStatus());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Writes one sealed file per partner into the served folder. A partner with
 * no encryption key gets no file and is marked so on screen, rather than
 * stopping the others.
 */
async function writePartnerFiles(current: Session): Promise<string> {
  const { Directory, File, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.cache, LAN_SYNC_DIR);
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true });
  current.dirUri = dir.uri;

  const [myFingerprint, myConditions] = await Promise.all([getMyKeyFingerprint(), getUserConditions()]);
  for (const partner of current.partnersByCompact.values()) {
    const built = await buildWireForPartner(partner, myFingerprint, myConditions);
    if (!built.ok) {
      setPartnerState(
        current,
        partner.id,
        'noKey',
        built.reason === 'noKey'
          ? 'They paired before this app could encrypt. Show each other your codes once more first.'
          : 'Their key could not be used to encrypt this. Pair with them again.',
      );
      continue;
    }
    const toCompact = compactFingerprint(built.wire.to);
    if (!toCompact) continue;
    new File(dir, fileNameFor(toCompact)).write(JSON.stringify(built.wire));
  }

  // lighttpd wants a filesystem path, not a file:// URI.
  return decodeURI(dir.uri.replace(/^file:\/\//, '')).replace(/\/$/, '');
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The address to fetch from: the one the other phone's server announced it
 * is bound to, else the first IPv4 the resolver heard, else whatever it
 * offered. An IPv6 zone suffix ("%wlan0") is dropped since a URL cannot
 * carry it.
 */
function pickHost(
  announced: string | undefined,
  addresses: string[] | undefined,
  fallback: string | undefined,
): string | null {
  const candidates = [announced, ...(addresses ?? []), fallback].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  if (candidates.length === 0) return null;
  const ipv4 = candidates.find((value) => /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim()));
  const chosen = (ipv4 ?? candidates[0]).trim();
  return chosen.includes('%') ? chosen.slice(0, chosen.indexOf('%')) : chosen;
}

/**
 * A partner's phone was heard on the network: fetch the file it holds for
 * this phone and run it through the same checks a picked file gets.
 */
async function pullFromPartner(
  current: Session,
  partner: Connection,
  host: string,
  port: number,
): Promise<void> {
  if (current.fetched.has(partner.id)) return;
  current.fetched.add(partner.id);
  setPartnerState(current, partner.id, 'fetching', `Found ${partner.name}'s phone, fetching…`);

  // IPv6 literals need brackets in a URL; Android hands them over bare.
  const hostInUrl = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  const where = `${hostInUrl}:${port}`;
  const url = `http://${where}/${fileNameFor(current.myCompact)}`;

  let text: string | null = null;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS && !current.stopping; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.status === 404) {
        current.fetched.delete(partner.id);
        setPartnerState(
          current,
          partner.id,
          'failed',
          `${partner.name}'s phone is on the network but has nothing for you. They may not have you paired as a partner, or may have paired before this app could encrypt.`,
        );
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = await response.text();
      break;
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_ATTEMPTS) {
        setPartnerState(
          current,
          partner.id,
          'fetching',
          `Found ${partner.name}'s phone at ${where}, no answer yet. Trying again (${attempt} of ${FETCH_ATTEMPTS})…`,
        );
        await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_MS));
      }
    }
  }
  if (text === null) {
    // Let a later announcement retry it. The address is in the message on
    // purpose: "could not reach" on its own said nothing about whether the
    // phone was even asking the right place.
    current.fetched.delete(partner.id);
    if (current.stopping) return;
    setPartnerState(
      current,
      partner.id,
      'failed',
      `Could not reach ${partner.name}'s phone at ${where} (${lastError instanceof Error ? lastError.message : 'no response'}) after ${FETCH_ATTEMPTS} tries. Both phones need to be on the same Wi-Fi, and some routers keep devices from seeing each other (a guest network, or a setting called client or AP isolation).`,
    );
    return;
  }

  const result = await applySyncFileText(text, current.connections);
  if (result.applied) {
    current.status.changed = true;
    setPartnerState(current, partner.id, 'received', result.message);
  } else {
    setPartnerState(current, partner.id, 'failed', result.message);
  }
}

/**
 * Starts a Wi-Fi sync session: serves this phone's files, announces it, and
 * pulls from every partner heard on the network. Resolves once the server
 * and announcement are up; progress after that arrives through
 * subscribeLanSync. A session already running is returned as is.
 */
export async function startLanSync(): Promise<LanSyncStatus> {
  if (session && session.status.phase !== 'stopped' && session.status.phase !== 'failed') {
    return getLanSyncStatus();
  }

  const connections = await listConnections();
  const partners = connections.filter((c) => talksAutomatically(c.role));
  const myFingerprint = await getMyKeyFingerprint();
  const myCompact = compactFingerprint(myFingerprint) ?? '';

  const partnersByCompact = new Map<string, Connection>();
  for (const partner of partners) {
    const compact = compactFingerprint(computeKeyFingerprint(partner.publicKeyBase64));
    if (compact) partnersByCompact.set(compact, partner);
  }

  const current: Session = {
    status: {
      phase: 'starting',
      partners: partners.map((partner) => ({
        connectionId: partner.id,
        name: partner.name,
        fingerprint: computeKeyFingerprint(partner.publicKeyBase64),
        state: 'waiting',
        message: 'Waiting for their phone to appear on the Wi-Fi.',
      })),
      changed: false,
    },
    myCompact,
    partnersByCompact,
    fetched: new Set(),
    connections,
    server: null,
    zeroconf: null,
    serviceName: null,
    timer: null,
    rescanTimer: null,
    dirUri: null,
    stopping: false,
  };
  session = current;
  notify(current);

  if (partners.length === 0) {
    current.status.phase = 'failed';
    current.status.error = 'Nobody is paired as a partner yet, so there is nobody to sync with.';
    notify(current);
    return getLanSyncStatus();
  }
  if (!myCompact) {
    current.status.phase = 'failed';
    current.status.error = 'This phone has no key fingerprint yet. Open the pairing screen once, then try again.';
    notify(current);
    return getLanSyncStatus();
  }

  try {
    const fileDir = await writePartnerFiles(current);

    const { default: StaticServer } = await import('@dr.pogodin/react-native-static-server');
    const server = new StaticServer({
      fileDir,
      // Reachable from the other phone, not only from this one.
      nonLocal: true,
      // Keep serving while the person glances at the other phone.
      stopInBackground: false,
    });
    current.server = server;
    const origin = await server.start();
    current.status.origin = origin;

    const { default: Zeroconf } = await import('react-native-zeroconf');
    const zeroconf = new Zeroconf();
    current.zeroconf = zeroconf;

    zeroconf.on('resolved', (service) => {
      if (current.stopping) return;
      const fp = service.txt?.fp ? compactFingerprint(service.txt.fp) : null;
      if (!fp || fp === current.myCompact) return;
      const partner = current.partnersByCompact.get(fp);
      if (!partner) return;
      const host = pickHost(service.txt?.[LAN_SYNC_TXT_ADDRESS], service.addresses, service.host);
      if (!host || !service.port) return;
      void pullFromPartner(current, partner, host, service.port);
    });
    zeroconf.on('error', (error) => {
      if (current.stopping) return;
      console.warn('[lanSync] zeroconf error', error);
    });

    // A fresh name per session, so a second tap on this phone shows up on
    // the other phone as a new service rather than as the one it already
    // resolved (and possibly failed on) minutes ago. The fingerprint that
    // matters travels in the TXT record, not the name.
    const serviceName = `Inside Story ${myCompact} ${Date.now().toString(36).slice(-4)}`;
    current.serviceName = serviceName;
    zeroconf.publishService(LAN_SYNC_SERVICE_TYPE, LAN_SYNC_PROTOCOL, LAN_SYNC_DOMAIN, serviceName, server.port, {
      fp: myCompact,
      v: LAN_SYNC_WIRE_VERSION,
      [LAN_SYNC_TXT_ADDRESS]: server.hostname,
    });
    zeroconf.scan(LAN_SYNC_SERVICE_TYPE, LAN_SYNC_PROTOCOL, LAN_SYNC_DOMAIN);
    current.rescanTimer = setInterval(() => {
      if (current.stopping) return;
      try {
        zeroconf.stop();
        zeroconf.scan(LAN_SYNC_SERVICE_TYPE, LAN_SYNC_PROTOCOL, LAN_SYNC_DOMAIN);
      } catch (error) {
        console.warn('[lanSync] rescan failed', error);
      }
    }, RESCAN_MS);

    current.timer = setTimeout(() => {
      void stopLanSync('The Wi-Fi sync stopped after five minutes. Tap Sync over Wi-Fi again on both phones to try once more.');
    }, LAN_SYNC_TIMEOUT_MS);

    current.status.phase = 'listening';
    notify(current);
  } catch (error) {
    console.error('[lanSync] start failed', error);
    current.status.phase = 'failed';
    current.status.error = `Could not start: ${error instanceof Error ? error.message : 'unknown error'}.`;
    notify(current);
    await teardown(current);
  }

  return getLanSyncStatus();
}

/** Undoes everything start did, tolerating each piece having already gone. */
async function teardown(current: Session): Promise<void> {
  current.stopping = true;
  if (current.timer) {
    clearTimeout(current.timer);
    current.timer = null;
  }
  if (current.rescanTimer) {
    clearInterval(current.rescanTimer);
    current.rescanTimer = null;
  }
  const zeroconf = current.zeroconf;
  if (zeroconf) {
    try {
      if (current.serviceName) zeroconf.unpublishService(current.serviceName);
    } catch {}
    try {
      zeroconf.stop();
    } catch {}
    try {
      zeroconf.removeAllListeners();
      zeroconf.removeDeviceListeners();
    } catch {}
    current.zeroconf = null;
  }
  const server = current.server;
  if (server) {
    try {
      await server.stop();
    } catch {}
    current.server = null;
  }
  if (current.dirUri) {
    try {
      const { Directory } = await import('expo-file-system');
      const dir = new Directory(current.dirUri);
      if (dir.exists) dir.delete();
    } catch {}
    current.dirUri = null;
  }
}

/**
 * Stops the running session: takes the announcement down, stops the server,
 * deletes the served files. Safe to call when nothing is running.
 */
export async function stopLanSync(reason?: string): Promise<LanSyncStatus> {
  const current = session;
  if (!current || current.stopping) return getLanSyncStatus();
  await teardown(current);
  if (current.status.phase !== 'failed') {
    current.status.phase = 'stopped';
    if (reason) current.status.error = reason;
  }
  notify(current);
  return getLanSyncStatus();
}
