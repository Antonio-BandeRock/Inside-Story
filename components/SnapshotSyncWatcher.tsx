// Keeps this device in step with the other one while the app runs.
//
// Mounted once in app/_layout.tsx after the database is ready. Renders
// nothing of its own except the dialogs it needs. What it does, and when:
//
//   - At startup and every time the app comes to the foreground: reads the
//     record in the shared folder (lib/snapshotSyncDevice.ts). A copy from
//     the other device is brought together with what is here, row by row,
//     keeping both devices' changes however many there are
//     (lib/snapshotMerge.ts); the merged result is saved straight back so
//     the other device gets it, and the app restarts only when the merge
//     actually changed something here. The first check after sync was
//     turned on asks instead, since two devices with no shared history
//     have nothing to work changes out against. Then, if anything here is
//     unsaved, saves.
//   - Every half minute while the app sits open in front
//     (CHECK_INTERVAL_MS): the same check, skipped within fifteen seconds
//     of a write (CHECK_QUIET_MS) and skipped while a question is on
//     screen. The foreground event fires only when the app was put away
//     first, so without this a phone left on the desk, or the desktop app
//     left open, showed the old data until it was put away and brought
//     back. A copy the person declined is not asked about again from here.
//   - Eight seconds after the last write (SAVE_DEBOUNCE_MS): saves.
//   - When the app goes to the background: saves at once, since a phone
//     may be put down for the day at that moment.
//
// A folder that cannot be reached is said once per run rather than left
// on Profile's Backup & Restore card for somebody to find: a phone whose
// shared folder had been taken out from under it by a snapshot went on
// looking normal while nothing it recorded reached the computer
// (1.0.42.30). Once per distinct sentence, since the check runs every
// half minute and a dialog each time would be its own problem.
//
// On the desktop app "foreground" and "background" come from the window
// gaining and losing focus. react-native-web's AppState follows the
// document's visibility, which changes only when the window is minimized
// and brought back, so clicking over to another program and back, which
// is how a computer is used, never reached the check or the save
// (1.0.42.29, "I recorded a capture on the mobile and it isn't showing up
// on the computer").
//
// The first-time question says what changed on each side, since a person
// asked to choose between two copies of their own database has nothing
// else to go on ("it doesn't actually say what the change was that
// caused this update to synchronize from the other device"). The words
// come from lib/snapshotChanges.ts. Neither list is in hand the moment
// the question is asked, so it goes up with what it has and gains the
// rest as it arrives. Every merge after that happens quietly and goes to
// the log instead (lib/syncLog.ts, read on app/sync-activity.tsx), which
// is ANNOUNCE_MERGES in lib/snapshotSync.ts and the reason the notice
// paths below are left standing rather than deleted.
//
// A save that finds a copy this device has not taken in merges first,
// which is the same-time guard: nothing is ever written over that this
// device has not seen, and nothing unsaved is ever thrown away. Every
// decision behind that is in lib/snapshotSync.ts and covered by
// scripts/test_snapshot_sync.js.
// Checks and saves run one at a time, in the order they were asked for,
// so a focus check and a timer save can never read and write the folder
// over each other.

import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { addDatabaseWriteListener, getLastDatabaseWriteAt } from '../lib/databaseActivity';
import {
  CHECK_INTERVAL_MS,
  CHECK_QUIET_MS,
  conflictMessage,
  SAVE_DEBOUNCE_MS,
  type SnapshotRecord,
  type SyncChangeNotes,
  type SyncDevice,
} from '../lib/snapshotSync';
import {
  checkForArrival,
  describeUnsavedChangesHere,
  getMyDevice,
  loadSnapshot,
  markDatabaseDirty,
  mergeSnapshot,
  peekIncomingChanges,
  readSyncState,
  saveSnapshot,
  takePendingNotice,
} from '../lib/snapshotSyncDevice';
import { AppActionSheet } from './AppActionSheet';
import { useInfoAlert } from './InfoAlert';

type Question = {
  title: string;
  message: string;
  record: SnapshotRecord;
};

type CheckSource = 'startup' | 'foreground' | 'interval';
type SaveSource = 'timer' | 'background' | 'foreground';

/** Restarts the app so every module-level cache reads the loaded data. */
export async function restartAfterLoad(showNotice: (title: string, message: string) => void): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.error('[snapshotSync] reloadAsync failed after a load', error);
    showNotice('Loaded', 'Close and reopen the app to see what was loaded.');
  }
}

export function SnapshotSyncWatcher() {
  const [showNotice, noticeElement] = useInfoAlert();
  const [question, setQuestion] = useState<Question | null>(null);
  const questionRef = useRef<Question | null>(null);
  questionRef.current = question;
  const meRef = useRef<SyncDevice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A copy the person chose not to load or save over is not asked about
  // again from the save timer or the periodic check; the next foreground
  // asks once more.
  const declinedRef = useRef<string | null>(null);
  // One check or save at a time, in order.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  // Sentences already said this run, so a folder that stays unreachable
  // is reported once rather than every half minute.
  const toldRef = useRef<Set<string>>(new Set());

  const tellOnce = useCallback(
    (reason: string) => {
      if (toldRef.current.has(reason)) return;
      toldRef.current.add(reason);
      showNotice('Sync could not reach your shared folder', reason);
    },
    [showNotice],
  );

  const enqueue = useCallback((work: () => Promise<void>) => {
    const next = queueRef.current.then(work, work).catch((error) => {
      console.error('[snapshotSync] watcher step failed', error);
    });
    queueRef.current = next;
    return next;
  }, []);

  const me = useCallback(async () => {
    if (!meRef.current) meRef.current = await getMyDevice();
    return meRef.current;
  }, []);

  // Puts the question up at once, then fills in what changed on each
  // side as it lands: what is unsaved here means reading every table,
  // and what the other copy brings means downloading and decrypting it.
  // Both happen behind the question rather than ahead of it, and a
  // question the person has already answered is left alone.
  const ask = useCallback(
    (title: string, record: SnapshotRecord, message: (notes: SyncChangeNotes) => string) => {
      const notes: SyncChangeNotes = {};
      const show = (first: boolean) => {
        setQuestion((current) => {
          if (!first && current?.record.latest.savedAt !== record.latest.savedAt) return current;
          return { title, message: message(notes), record };
        });
      };
      show(true);
      (async () => {
        notes.here = await describeUnsavedChangesHere();
        show(false);
        notes.there = await peekIncomingChanges(record);
        show(false);
      })().catch((error) => {
        console.error('[snapshotSync] could not say what changed', error);
      });
    },
    [],
  );

  const askAboutArrival = useCallback(
    async (record: SnapshotRecord) => {
      const mine = await me();
      ask('Which copy do you want?', record, (notes) =>
        conflictMessage({ action: 'conflict', record, reason: 'firstTime' }, mine, notes));
    },
    [ask, me],
  );

  // doSave asks for a merge and doMerge saves, so one of the two is
  // reached through a ref rather than either being declared twice.
  const mergeRef = useRef<(record: SnapshotRecord) => Promise<void>>(async () => {});

  // A save, and a merge first where the folder holds something this
  // device has not taken in. `allowMerge` is false for the save that
  // follows a merge: the other device saving again in those few seconds
  // is the next check's to deal with, not a reason to go round again
  // here.
  const doSave = useCallback(
    async (source: SaveSource, allowMerge = true) => {
      const outcome = await saveSnapshot();
      if (outcome.status === 'problem') {
        tellOnce(outcome.reason);
        return;
      }
      if (outcome.status === 'merge' && allowMerge) {
        if (source === 'timer' && declinedRef.current === outcome.record.latest.savedAt) return;
        await mergeRef.current(outcome.record);
      }
    },
    [tellOnce],
  );

  // Brings the other device's copy together with this one, saves the
  // result straight back so the other device converges, and restarts only
  // when the merge changed something here (the notice for after that
  // restart is left in the sync state by mergeSnapshot).
  const doMerge = useCallback(
    async (record: SnapshotRecord) => {
      const outcome = await mergeSnapshot(record);
      if (outcome.status === 'problem') {
        tellOnce(outcome.reason);
        return;
      }
      if (outcome.status === 'noBase') {
        await askAboutArrival(outcome.record);
        return;
      }
      await doSave('foreground', false);
      if (outcome.restart) {
        await restartAfterLoad(showNotice);
        return;
      }
      if (outcome.notice) showNotice('Brought together with your other device', outcome.notice);
    },
    [askAboutArrival, doSave, showNotice, tellOnce],
  );
  mergeRef.current = doMerge;

  const runSave = useCallback((source: SaveSource) => enqueue(() => doSave(source)), [doSave, enqueue]);

  const doCheck = useCallback(
    async (source: CheckSource) => {
      if (source === 'interval') {
        // Not over a question already on screen, and not while the person
        // is in the middle of something here.
        if (questionRef.current) return;
        const lastWrite = getLastDatabaseWriteAt();
        if (lastWrite > 0 && Date.now() - lastWrite < CHECK_QUIET_MS) return;
      }
      const outcome = await checkForArrival();
      if (outcome.action === 'merge') {
        await doMerge(outcome.record);
        return;
      }
      if (outcome.action === 'conflict') {
        if (source === 'interval' && declinedRef.current === outcome.record.latest.savedAt) return;
        await askAboutArrival(outcome.record);
        return;
      }
      if (outcome.action === 'problem') {
        tellOnce(outcome.reason);
        return;
      }
      if (source === 'interval') {
        // The save timer already covers anything unsaved here; a periodic
        // check only looks for what the other device saved.
        return;
      }
      await doSave('foreground');
    },
    [askAboutArrival, doMerge, doSave, tellOnce],
  );

  const runCheck = useCallback((source: CheckSource) => enqueue(() => doCheck(source)), [doCheck, enqueue]);

  // Startup: the notice from an automatic load before the restart, then
  // the first check.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await readSyncState();
      if (!state.enabled || cancelled) return;
      const notice = await takePendingNotice();
      if (notice && !cancelled) showNotice('Brought together with your other device', notice);
      if (!cancelled) await runCheck('startup');
    })();
    return () => {
      cancelled = true;
    };
    // Once, at mount: later checks come from the listeners below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelSaveTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Foreground and background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        runCheck('foreground');
      } else if (next === 'background' || next === 'inactive') {
        cancelSaveTimer();
        runSave('background');
      }
    });
    return () => subscription.remove();
  }, [cancelSaveTimer, runCheck, runSave]);

  // The desktop app: the window gaining and losing focus, which is what
  // switching between programs on a computer looks like (see the note at
  // the top). AppState above still covers minimize and restore there.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onFocus = () => {
      runCheck('foreground');
    };
    const onBlur = () => {
      cancelSaveTimer();
      runSave('background');
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [cancelSaveTimer, runCheck, runSave]);

  // While the app sits open in front: look at the folder every so often,
  // since neither listener above fires until the app is put away.
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      runCheck('interval');
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [runCheck]);

  // Every write: mark the unsaved period, and save once the writing pauses.
  useEffect(() => {
    return addDatabaseWriteListener(() => {
      markDatabaseDirty();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        runSave('timer');
      }, SAVE_DEBOUNCE_MS);
    });
  }, [runSave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const record = question?.record ?? null;
  const otherTitle = record?.latest.device.kind === 'phone' ? 'Your Phone' : 'Your Computer';

  return (
    <>
      {noticeElement}
      <AppActionSheet
        visible={question !== null}
        onClose={() => {
          if (record) declinedRef.current = record.latest.savedAt;
          setQuestion(null);
        }}
        title={question?.title}
        message={question?.message}
        actions={
          record
            ? [
                {
                  label: 'Load the Copy from ' + otherTitle,
                  destructive: true,
                  onPress: async () => {
                    const loaded = await loadSnapshot(record);
                    if (loaded.status === 'loaded') {
                      await restartAfterLoad(showNotice);
                    } else {
                      showNotice('Could not load', loaded.reason);
                    }
                  },
                },
                {
                  label: 'Keep What Is Here and Save It',
                  onPress: async () => {
                    const saved = await saveSnapshot({ force: true });
                    if (saved.status === 'problem') showNotice('Could not save', saved.reason);
                  },
                },
                {
                  label: 'Not Now',
                  onPress: () => {
                    declinedRef.current = record.latest.savedAt;
                  },
                },
              ]
            : []
        }
      />
    </>
  );
}
