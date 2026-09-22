// Keeps this device in step with the other one while the app runs.
//
// Mounted once in app/_layout.tsx after the database is ready. Renders
// nothing of its own except the dialogs it needs. What it does, and when:
//
//   - At startup and every time the app comes to the foreground: reads the
//     record in the shared folder (lib/snapshotSyncDevice.ts). The other
//     device's newer copy loads on its own when nothing here has changed
//     since the last save or load, and the app restarts so every screen
//     reads the loaded data; the notice for that shows after the restart.
//     With unsaved changes here, or on the first check after sync was
//     turned on, it asks instead. Then, if anything here is unsaved, saves.
//   - Eight seconds after the last write (SAVE_DEBOUNCE_MS): saves.
//   - When the app goes to the background: saves at once, since a phone
//     may be put down for the day at that moment.
//
// A save that finds a newer copy from the other device stops and asks,
// which is the same-time guard: nothing is ever written over that this
// device has not loaded, and nothing unsaved is ever thrown away without
// the person saying so. Every decision behind that is in
// lib/snapshotSync.ts and covered by scripts/test_snapshot_sync.js.

import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { addDatabaseWriteListener } from '../lib/databaseActivity';
import {
  conflictMessage,
  SAVE_DEBOUNCE_MS,
  saveConflictMessage,
  type SnapshotRecord,
  type SyncDevice,
} from '../lib/snapshotSync';
import {
  checkForArrival,
  getMyDevice,
  loadSnapshot,
  markDatabaseDirty,
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
  const meRef = useRef<SyncDevice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A copy the person chose not to load or save over is not asked about
  // again from the save timer; the next foreground asks once more.
  const declinedRef = useRef<string | null>(null);

  const me = useCallback(async () => {
    if (!meRef.current) meRef.current = await getMyDevice();
    return meRef.current;
  }, []);

  const askAboutArrival = useCallback(
    async (record: SnapshotRecord, reason: 'unsavedChanges' | 'firstTime') => {
      setQuestion({
        title: 'Which copy do you want?',
        message: conflictMessage({ action: 'conflict', record, reason }, await me()),
        record,
      });
    },
    [me],
  );

  const runSave = useCallback(
    async (source: 'timer' | 'background' | 'foreground') => {
      const outcome = await saveSnapshot();
      if (outcome.status === 'conflict') {
        if (source === 'timer' && declinedRef.current === outcome.record.latest.savedAt) return;
        setQuestion({
          title: 'Which copy do you want?',
          message: saveConflictMessage(outcome.record, await me()),
          record: outcome.record,
        });
      }
    },
    [me],
  );

  const runCheck = useCallback(async () => {
    const outcome = await checkForArrival();
    if (outcome.action === 'load') {
      const loaded = await loadSnapshot(outcome.record);
      if (loaded.status === 'loaded') {
        await restartAfterLoad(showNotice);
        return;
      }
      showNotice('Could not load', loaded.reason);
      return;
    }
    if (outcome.action === 'conflict') {
      await askAboutArrival(outcome.record, outcome.reason);
      return;
    }
    if (outcome.action === 'problem') {
      // Reported on Profile's Backup & Restore card rather than as a
      // dialog: a folder that is briefly unreachable is not worth a
      // dialog every time the app is opened.
      return;
    }
    await runSave('foreground');
  }, [askAboutArrival, runSave, showNotice]);

  // Startup: the notice from an automatic load before the restart, then
  // the first check.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await readSyncState();
      if (!state.enabled || cancelled) return;
      const notice = await takePendingNotice();
      if (notice && !cancelled) showNotice('Loaded from your other device', notice);
      if (!cancelled) await runCheck();
    })();
    return () => {
      cancelled = true;
    };
    // Once, at mount: later checks come from the foreground listener below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Foreground and background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        runCheck();
      } else if (next === 'background' || next === 'inactive') {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        runSave('background');
      }
    });
    return () => subscription.remove();
  }, [runCheck, runSave]);

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
