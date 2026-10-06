// The between-people mailbox, running by itself (J12, 2026-09-29).
//
// Until now what somebody shared with a partner, child or caregiver moved
// only when one of them pressed Send or Check on the Connections screen.
// This does the same two things on its own, on the same footing as
// SnapshotSyncWatcher does between one person's two devices:
//
//   at startup and on coming back to the app  check, then send
//   about every 30 seconds while open         check
//   about 15 seconds after a change here      send
//
// NOTHING NEW CROSSES. Sending is sendViaOneDrive and checking is
// receiveViaOneDrive, the functions the two buttons call, so what goes to
// each person is still decided by lib/peerRelationships.ts and the grants on
// that link, sealed for that person, and checked on arrival the same four
// ways. The buttons stay, for somebody who wants it to go now.
//
// A SEND GOES ONLY WHEN SOMETHING IN IT CHANGED (onlyWhenChanged), since a
// merge of what arrived is a change here too, and without that two phones
// would hand the same copy to each other for ever.
//
// TWO CARRIERS SINCE M1 (1.0.62.2): the OneDrive folder and the relay at
// insidestoryapp.com, each sent to only when what it last carried changed.
// The same copy arriving by both is merged once and then to nothing. The
// relay asks Google to wake the other phone when mail lands
// (lib/pushWake.ts), so it is checked at startup, on coming back and on a
// wake-up rather than every 30 seconds, which keeps the requests a phone
// makes to it small. The desktop gets no wake-ups and checks it every few
// minutes while its window is in front instead. OneDrive not being set up no
// longer stops the relay, since the relay needs nothing set up.
//
// QUIET, like every other merge (ANNOUNCE_MERGES): what arrived is read in
// Sync Activity. Two things are never said: no folder chosen, and not
// signed in, since somebody who has not set up the mailbox is not doing
// anything wrong. A folder that was chosen and cannot be reached is said
// once a run, since failing in silence was the 1.0.42.30 bug.

import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { listConnections } from '../lib/connections';
import { addDatabaseWriteListener } from '../lib/databaseActivity';
import { receiveViaOneDrive, sendViaOneDrive, type MailboxStatus } from '../lib/oneDriveMailbox';
import { talksAutomatically } from '../lib/peerRelationships';
import { collectAfterWake, keepWakeRegistrationCurrent, pushWakeSupported } from '../lib/pushWake';
import { receiveViaRelay, sendViaRelay } from '../lib/relayMailbox';
import { isRelayWake } from '../lib/relayWake';
import { useInfoAlert } from './InfoAlert';

/** How often the folder is checked while the app is open. */
const EXCHANGE_INTERVAL_MS = 30 * 1000;
/** How long after the last change here a send goes, so typing a list sends once. */
const SEND_AFTER_CHANGE_MS = 15 * 1000;
/** Where nothing wakes the app (the desktop), the relay rides every Nth folder check. */
const RELAY_EVERY_NTH_CHECK = 6;

// 'check' is the 30-second folder check, which leaves the relay alone unless
// relay is set; 'both' (startup, coming back) checks and sends on both.
type Step = 'check' | 'send' | 'both';

async function anybodyToTalkTo(): Promise<boolean> {
  const connections = await listConnections();
  return connections.some((connection) => talksAutomatically(connection.role) && !!connection.encryptionPublicKeyBase64);
}

export function PeerMailboxWatcher() {
  const [showNotice, noticeElement] = useInfoAlert();
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toldRef = useRef<Set<string>>(new Set());

  const heard = useCallback(
    (status: MailboxStatus) => {
      if (status.state !== 'unreachable') return;
      const key = status.folderName + ': ' + status.reason;
      if (toldRef.current.has(key)) return;
      toldRef.current.add(key);
      showNotice(
        'Sharing could not reach the mailbox folder',
        `${status.folderName}: ${status.reason.trim().replace(/\.?$/, '.')} Until it can, what you share with people waits here, and the Send and Check buttons in Connections say the same.`,
      );
    },
    [showNotice],
  );

  const run = useCallback(
    (step: Step, options: { relay?: boolean } = {}) => {
      const work = async () => {
        if (!(await anybodyToTalkTo())) {
          // The last link gone: the relay is told to forget this phone.
          if (step === 'both') await keepWakeRegistrationCurrent();
          return;
        }
        const relay = step !== 'check' || options.relay === true;
        if (step !== 'send') {
          const received = await receiveViaOneDrive();
          heard(received.status);
          for (const outcome of received.outcomes) {
            if (!outcome.applied) console.warn('[peerMailbox] a file was left in the folder:', outcome.message);
          }
          if (relay) {
            const fromRelay = await receiveViaRelay();
            for (const outcome of fromRelay.outcomes) {
              if (!outcome.applied) console.warn('[peerMailbox] left at the relay:', outcome.message);
            }
          }
        }
        if (step !== 'check') {
          const sent = await sendViaOneDrive({ onlyWhenChanged: true });
          heard(sent.status);
          for (const outcome of sent.outcomes) {
            if (!outcome.sent && !outcome.unchanged) console.warn('[peerMailbox] not sent to ' + outcome.name + ':', outcome.reason);
          }
          const viaRelay = await sendViaRelay({ onlyWhenChanged: true });
          for (const outcome of viaRelay.outcomes) {
            if (!outcome.sent && !outcome.unchanged) console.warn('[peerMailbox] relay did not take it for ' + outcome.name + ':', outcome.reason);
          }
        }
        if (step === 'both') await keepWakeRegistrationCurrent();
      };
      const next = queueRef.current.then(work, work).catch((error) => {
        console.error('[peerMailbox] exchange failed', error);
      });
      queueRef.current = next;
      return next;
    },
    [heard],
  );

  useEffect(() => {
    void run('both');
  }, [run]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void run('both');
    });
    return () => subscription.remove();
  }, [run]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onFocus = () => {
      void run('both');
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [run]);

  useEffect(() => {
    let checks = 0;
    const interval = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      checks += 1;
      void run('check', { relay: !pushWakeSupported() && checks % RELAY_EVERY_NTH_CHECK === 0 });
    }, EXCHANGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [run]);

  // M1: a wake-up arriving while the app is open, and Google handing this
  // phone a new address. The closed-app case is lib/reminderBackgroundTask.ts.
  useEffect(() => {
    if (!pushWakeSupported()) return;
    const arrivals = Notifications.addNotificationReceivedListener((notification) => {
      if (isRelayWake(notification.request)) void collectAfterWake();
    });
    const tokens = Notifications.addPushTokenListener((token) => {
      if (typeof token.data === 'string') void keepWakeRegistrationCurrent(token.data);
    });
    return () => {
      arrivals.remove();
      tokens.remove();
    };
  }, []);

  useEffect(() => {
    const stop = addDatabaseWriteListener(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void run('send');
      }, SEND_AFTER_CHANGE_MS);
    });
    return () => {
      stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [run]);

  return <>{noticeElement}</>;
}
