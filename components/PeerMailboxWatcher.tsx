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
// QUIET, like every other merge (ANNOUNCE_MERGES): what arrived is read in
// Sync Activity. Two things are never said: no folder chosen, and not
// signed in, since somebody who has not set up the mailbox is not doing
// anything wrong. A folder that was chosen and cannot be reached is said
// once a run, since failing in silence was the 1.0.42.30 bug.

import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { listConnections } from '../lib/connections';
import { addDatabaseWriteListener } from '../lib/databaseActivity';
import { receiveViaOneDrive, sendViaOneDrive, type MailboxStatus } from '../lib/oneDriveMailbox';
import { talksAutomatically } from '../lib/peerRelationships';
import { useInfoAlert } from './InfoAlert';

/** How often the folder is checked while the app is open. */
const EXCHANGE_INTERVAL_MS = 30 * 1000;
/** How long after the last change here a send goes, so typing a list sends once. */
const SEND_AFTER_CHANGE_MS = 15 * 1000;

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
    (step: Step) => {
      const work = async () => {
        if (!(await anybodyToTalkTo())) return;
        if (step !== 'send') {
          const received = await receiveViaOneDrive();
          heard(received.status);
          if (received.status.state !== 'ready') return;
          for (const outcome of received.outcomes) {
            if (!outcome.applied) console.warn('[peerMailbox] a file was left in the folder:', outcome.message);
          }
        }
        if (step !== 'check') {
          const sent = await sendViaOneDrive({ onlyWhenChanged: true });
          heard(sent.status);
          for (const outcome of sent.outcomes) {
            if (!outcome.sent && !outcome.unchanged) console.warn('[peerMailbox] not sent to ' + outcome.name + ':', outcome.reason);
          }
        }
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
    const interval = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      void run('check');
    }, EXCHANGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [run]);

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
