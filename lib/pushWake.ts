// Being woken when somebody linked to you sends something (M1, 1.0.62.2).
//
// Direct decision, 2026-10-06: "Build it to allow the relay to carry it too."
// The relay at insidestoryapp.com already held sealed mail between linked
// people, but only the Send and Check buttons on Connections used it, and the
// phone found mail only when somebody pressed Check. Now the automatic
// exchange (components/PeerMailboxWatcher.tsx) posts there whenever something
// shared changes, the relay asks Google to wake the other phone, and this file
// collects what is waiting when the wake-up lands, even with the app closed.
//
// WHAT GOOGLE AND THE RELAY LEARN. The wake-up carries one word
// (RELAY_WAKE_KIND) and nothing from the mail. The relay keeps this phone's
// Firebase address beside its key fingerprint, written only by a request this
// phone signed. A phone linked to nobody leaves no address at all, and the
// last link going takes it back (planWakeRegistration).
//
// WITH APP LOCK ON AND NOBODY UNLOCKED, nothing is collected: the database
// cannot be opened, so the mail waits at the relay and the next unlock's
// check picks it up. Nothing is shown either way; a wake-up is never a
// notification.
//
// Android only. The desktop has no Google wake-ups and checks when its window
// is focused; an iPhone build would need APNs, which is not set up.

import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isAppLockedError, isLockedNow } from './appLockSession';
import { listConnections } from './connections';
import { getMyKeyFingerprint } from './deviceIdentity';
import { talksAutomatically } from './peerRelationships';
import { receiveViaRelay, registerPushAddress } from './relayMailbox';
import { parseWakeRegistration, planWakeRegistration, type WakeRegistration } from './relayWake';
import { compactFingerprint } from './syncInbox';

// A plain file rather than an app_meta row: it describes this phone, so it
// must never travel to another device through sync, and it has to be
// readable while the database is locked.
const REGISTRATION_FILE = 'relay-wake.json';

export function pushWakeSupported(): boolean {
  return Platform.OS === 'android';
}

function readKept(): WakeRegistration | null {
  try {
    const file = new File(Paths.document, REGISTRATION_FILE);
    return file.exists ? parseWakeRegistration(file.textSync()) : null;
  } catch {
    return null;
  }
}

function writeKept(record: WakeRegistration | null): void {
  try {
    const file = new File(Paths.document, REGISTRATION_FILE);
    if (record) file.write(JSON.stringify(record));
    else if (file.exists) file.delete();
  } catch (error) {
    console.error('[pushWake] the registration record could not be kept', error);
  }
}

async function hasSomebody(): Promise<boolean> {
  const connections = await listConnections();
  return connections.some((connection) => talksAutomatically(connection.role) && !!connection.encryptionPublicKeyBase64);
}

async function devicePushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' && token.data ? token.data : null;
  } catch (error) {
    // No Google Play services, or Google unreachable: the relay is still
    // checked whenever the app opens, so this is a slower path, not a broken one.
    console.warn('[pushWake] no push address this run', error);
    return null;
  }
}

let registering: Promise<void> | null = null;

/**
 * Tells the relay where to wake this phone, or to forget it, when that has
 * changed. Cheap to call often: with nothing to do it reads one small file
 * and the connections list. A token handed in is one Google just announced.
 */
export function keepWakeRegistrationCurrent(announcedToken?: string): Promise<void> {
  if (!pushWakeSupported() || isLockedNow()) return Promise.resolve();
  if (!registering) {
    registering = registerNow(announcedToken).finally(() => {
      registering = null;
    });
  }
  return registering;
}

async function registerNow(announcedToken?: string): Promise<void> {
  try {
    const kept = readKept();
    const somebody = await hasSomebody();
    const [mailboxRaw, token] = somebody
      ? await Promise.all([getMyKeyFingerprint(), announcedToken ? Promise.resolve(announcedToken) : devicePushToken()])
      : [null, null];
    const mailbox = mailboxRaw ? compactFingerprint(mailboxRaw) : null;
    const plan = planWakeRegistration({ hasSomebody: somebody, mailbox, token, kept, now: Date.now() });
    if (plan === 'nothing') return;
    if (plan === 'forget') {
      const result = await registerPushAddress('');
      if (result.ok) writeKept(null);
      return;
    }
    if (!mailbox || !token) return;
    const result = await registerPushAddress(token);
    if (result.ok) writeKept({ mailbox, token, registeredAt: new Date().toISOString() });
    else console.warn('[pushWake] the relay did not take this address:', result.reason);
  } catch (error) {
    if (isAppLockedError(error)) return;
    console.error('[pushWake] registration failed', error);
  }
}

/**
 * Collects what the relay is holding, after a wake-up. Quiet in every case:
 * what arrived is read in Sync Activity, like every other merge.
 */
export async function collectAfterWake(): Promise<void> {
  if (isLockedNow()) return;
  try {
    const received = await receiveViaRelay();
    for (const outcome of received.outcomes) {
      if (!outcome.applied) console.warn('[pushWake] left at the relay:', outcome.message);
    }
    if (received.reason) console.warn('[pushWake] relay check:', received.reason);
  } catch (error) {
    if (isAppLockedError(error)) return;
    console.error('[pushWake] collecting after a wake-up failed', error);
  }
}
