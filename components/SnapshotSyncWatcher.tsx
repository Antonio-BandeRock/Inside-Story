// Keeps this device in step with the other one while the app runs.
//
// Mounted once in app/_layout.tsx after the database is ready. Renders
// the dialogs it needs and, while the other device has the session, a
// strip across the top of the screen with Take Over Now.
//
// ONE DEVICE AT A TIME (1.0.57.11, lib/syncSession.ts). Until then this
// looked at the folder every half minute and saved eight seconds after
// every write, on both devices, all day: "That seems like quite a lot of
// unnecessary traffic." Now one device has the session, and:
//
//   - At startup, and every time the app comes to the front (or, on the
//     desktop app, its window gains focus): reads the session note. If
//     the other device was used in the last half hour, this device waits:
//     read only, with the strip, and nothing is taken in or saved. If
//     not, this device takes in whatever the other one saved (the merge,
//     lib/snapshotMerge.ts, exactly as before), claims the session and
//     saves anything of its own that is unsaved.
//   - While it has the session: writes that it is in use no more than
//     every five minutes, and saves a few minutes after writing stops
//     (SESSION_SAVE_QUIET_MS) and at once when the app is put away.
//   - While it waits: a timer set for the moment the half hour is up
//     reads the note once more. The desktop app also reads it every
//     minute, which costs nothing there since the OneDrive client keeps
//     the folder on the disk, so a takeover from the phone is seen
//     without the window having to lose and regain focus. A phone never
//     reads it on a timer of its own apart from that one.
//   - Take Over Now claims the session at once and takes in the other
//     device's latest copy.
//
// A device that notices the session has come free while nobody is
// using it (the timer) takes in the other device's copy but does not
// claim the session, since claiming is for somebody using this device,
// and the restart that can follow a merge is marked quiet so the check
// after it does not claim either. Otherwise a computer left open would
// shut the phone out every half hour.
//
// A folder that cannot be reached is said once per run rather than left
// on Profile's Backup & Restore card for somebody to find (1.0.42.30).
// The note being unreachable does not shut this device out: it goes on
// as if nobody held the session, and the merge covers the rest.
//
// On the desktop app "foreground" and "background" come from the window
// gaining and losing focus, since react-native-web's AppState follows the
// document's visibility, which changes only on minimize (1.0.42.29).
//
// The first-time question says what changed on each side (the words come
// from lib/snapshotChanges.ts); every merge after that goes to the log
// quietly (lib/syncLog.ts, ANNOUNCE_MERGES in lib/snapshotSync.ts).
// Checks and saves run one at a time, in the order they were asked for.

import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, TouchableOpacity, View, type AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { addDatabaseWriteListener, setSessionWriteGuard } from '../lib/databaseActivity';
import { isDesktopApp } from '../lib/desktop/bridge';
import { syncPhotos } from '../lib/mediaSyncDevice';
import { conflictMessage, sameDevice, type SnapshotRecord, type SyncChangeNotes, type SyncDevice } from '../lib/snapshotSync';
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
  updateSyncState,
} from '../lib/snapshotSyncDevice';
import {
  describeWaiting,
  planSession,
  SESSION_SAVE_QUIET_MS,
  shouldTouchSession,
  waitingRefusal,
  type SessionNote,
  type SessionPlan,
} from '../lib/syncSession';
import { claimSession, readSessionNote } from '../lib/syncSessionDevice';
import { AppActionSheet } from './AppActionSheet';
import { useInfoAlert } from './InfoAlert';

type Question = {
  title: string;
  message: string;
  record: SnapshotRecord;
};

type Waiting = Extract<SessionPlan, { mode: 'waiting' }>;

/** Why a check runs. `timer` and `expiry` are nobody using this device. */
type CheckSource = 'startup' | 'foreground' | 'timer' | 'expiry' | 'takeover';
type SaveSource = 'timer' | 'background' | 'foreground';

/** How often the desktop app reads the note off the disk. */
const DESKTOP_NOTE_CHECK_MS = 60 * 1000;

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
  const insets = useSafeAreaInsets();
  const [showNotice, noticeElement] = useInfoAlert();
  const [question, setQuestion] = useState<Question | null>(null);
  const questionRef = useRef<Question | null>(null);
  questionRef.current = question;
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const waitingRef = useRef<Waiting | null>(null);
  const meRef = useRef<SyncDevice | null>(null);
  const noteRef = useRef<SessionNote | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A copy the person chose not to load or save over is not asked about
  // again from the save timer; the next foreground asks once more.
  const declinedRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const toldRef = useRef<Set<string>>(new Set());
  // Whether the refusal has been said out loud in this wait already.
  const refusalSaidRef = useRef(false);
  const claimingRef = useRef(false);

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

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const cancelSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  // runCheck is declared below and needed by the expiry timer, so it is
  // reached through a ref.
  const runCheckRef = useRef<(source: CheckSource) => Promise<void>>(async () => {});

  const leaveWaiting = useCallback(() => {
    waitingRef.current = null;
    setWaiting(null);
    setSessionWriteGuard(null);
    clearExpiryTimer();
  }, [clearExpiryTimer]);

  const enterWaiting = useCallback(
    (plan: Waiting) => {
      const first = waitingRef.current === null;
      waitingRef.current = plan;
      setWaiting(plan);
      if (first) refusalSaidRef.current = false;
      setSessionWriteGuard(() => {
        const current = waitingRef.current;
        if (!current) return null;
        const sentence = waitingRefusal(current.holder);
        if (!refusalSaidRef.current) {
          refusalSaidRef.current = true;
          // After the write has been refused, not inside it.
          setTimeout(() => showNotice('Changes wait for now', sentence), 0);
        }
        return sentence;
      });
      clearExpiryTimer();
      const wait = Math.max(1000, plan.freeAtMs - Date.now() + 1000);
      expiryTimerRef.current = setTimeout(() => {
        expiryTimerRef.current = null;
        void runCheckRef.current('expiry');
      }, wait);
    },
    [clearExpiryTimer, showNotice],
  );

  // Writes that this device has the session, now.
  const claim = useCallback(async () => {
    const claimed = await claimSession(await me(), noteRef.current);
    if (claimed.ok) noteRef.current = claimed.value;
    else if (claimed.reason !== 'Sync is off.') tellOnce(claimed.reason);
  }, [me, tellOnce]);

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

  const mergeRef = useRef<(record: SnapshotRecord, quiet: boolean) => Promise<void>>(async () => {});

  // A save, and a merge first where the folder holds something this
  // device has not taken in. Never while waiting: what this device has
  // is taken to the other one once it has the session back.
  const doSave = useCallback(
    async (source: SaveSource, allowMerge = true) => {
      if (waitingRef.current) return;
      const outcome = await saveSnapshot();
      if (outcome.status === 'problem') {
        tellOnce(outcome.reason);
        return;
      }
      if (outcome.status === 'merge' && allowMerge) {
        if (source === 'timer' && declinedRef.current === outcome.record.latest.savedAt) return;
        await mergeRef.current(outcome.record, false);
        return;
      }
      if (outcome.status !== 'skipped' || outcome.reason !== 'off') {
        void syncPhotos({ afterSave: outcome.status === 'saved' });
      }
    },
    [tellOnce],
  );

  // Brings the other device's copy together with this one, saves the
  // result straight back, and restarts only when the merge changed
  // something here. `quiet` marks a restart nobody using this device
  // caused, so the startup check after it leaves the session alone.
  const doMerge = useCallback(
    async (record: SnapshotRecord, quiet: boolean) => {
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
        if (quiet) await updateSyncState({ quietRestart: true });
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
      const state = await readSyncState();
      if (!state.enabled) {
        leaveWaiting();
        return;
      }
      const mine = await me();
      const quiet = source === 'timer' || source === 'expiry';
      const wasWaiting = waitingRef.current !== null;

      if (source !== 'takeover') {
        const read = await readSessionNote();
        if (!read.ok) tellOnce(read.reason);
        noteRef.current = read.ok ? read.value : noteRef.current;
        const plan: SessionPlan = read.ok ? planSession(read.value, mine, Date.now()) : { mode: 'free' };
        if (plan.mode === 'waiting') {
          enterWaiting(plan);
          return;
        }
        // The desktop's minute timer while this device already has the
        // session or nobody does: nothing to take in that the note would
        // not have shown, so the folder is left alone.
        if (source === 'timer' && !wasWaiting) return;
      }
      leaveWaiting();
      // A question already on screen is answered before anything else is
      // taken in, the way the half-minute check always left it.
      if (quiet && questionRef.current) return;

      // Claimed before the merge, so the restart a merge can bring finds
      // this device holding the session rather than waiting again.
      if (!quiet) await claim();

      const outcome = await checkForArrival();
      if (outcome.action === 'merge') {
        await doMerge(outcome.record, quiet);
        return;
      }
      if (outcome.action === 'conflict') {
        if (quiet && declinedRef.current === outcome.record.latest.savedAt) return;
        await askAboutArrival(outcome.record);
        return;
      }
      if (outcome.action === 'problem') {
        tellOnce(outcome.reason);
        return;
      }
      if (!quiet) await doSave('foreground');
    },
    [askAboutArrival, claim, doMerge, doSave, enterWaiting, leaveWaiting, me, tellOnce],
  );

  const runCheck = useCallback((source: CheckSource) => enqueue(() => doCheck(source)), [doCheck, enqueue]);
  runCheckRef.current = runCheck;

  // Startup: the notice from an automatic load before the restart, then
  // the first check, which counts as nobody using the device when it
  // follows a restart nobody asked for.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await readSyncState();
      if (!state.enabled || cancelled) return;
      const notice = await takePendingNotice();
      if (notice && !cancelled) showNotice('Brought together with your other device', notice);
      if (state.quietRestart) await updateSyncState({ quietRestart: false });
      if (!cancelled) await runCheck(state.quietRestart ? 'expiry' : 'startup');
    })();
    return () => {
      cancelled = true;
    };
    // Once, at mount: later checks come from the listeners below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Put away: save, and write that this device was in use until now.
  const onLeave = useCallback(() => {
    cancelSaveTimer();
    enqueue(async () => {
      if (waitingRef.current) return;
      await doSave('background');
      const mine = await me();
      if (noteRef.current && sameDevice(noteRef.current.holder, mine)) await claim();
    });
  }, [cancelSaveTimer, claim, doSave, enqueue, me]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') runCheck('foreground');
      else if (next === 'background' || next === 'inactive') onLeave();
    });
    return () => subscription.remove();
  }, [onLeave, runCheck]);

  // The desktop app: the window gaining and losing focus.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onFocus = () => {
      runCheck('foreground');
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onLeave);
    };
  }, [onLeave, runCheck]);

  // The desktop app reads the note off the disk every minute (see the
  // note at the top). Never on a phone, where it would be a request.
  useEffect(() => {
    if (!isDesktopApp()) return;
    const interval = setInterval(() => {
      runCheck('timer');
    }, DESKTOP_NOTE_CHECK_MS);
    return () => clearInterval(interval);
  }, [runCheck]);

  // Every write: mark the unsaved period, claim or touch the session, and
  // save once writing has paused for a few minutes.
  useEffect(() => {
    return addDatabaseWriteListener(() => {
      markDatabaseDirty();
      if (waitingRef.current) return;
      const mine = meRef.current;
      if (mine && !claimingRef.current && shouldTouchSession(noteRef.current, mine, Date.now())) {
        claimingRef.current = true;
        enqueue(async () => {
          try {
            if ((await readSyncState()).enabled) await claim();
          } finally {
            claimingRef.current = false;
          }
        });
      }
      cancelSaveTimer();
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        runSave('timer');
      }, SESSION_SAVE_QUIET_MS);
    });
  }, [cancelSaveTimer, claim, enqueue, runSave]);

  useEffect(() => {
    return () => {
      cancelSaveTimer();
      clearExpiryTimer();
      setSessionWriteGuard(null);
    };
  }, [cancelSaveTimer, clearExpiryTimer]);

  const record = question?.record ?? null;
  const otherTitle = record?.latest.device.kind === 'phone' ? 'Your Phone' : 'Your Computer';

  return (
    <>
      {waiting ? (
        <View style={[styles.strip, { top: insets.top + 6 }]} pointerEvents="box-none">
          <View style={styles.stripCard}>
            <Text style={styles.stripText}>{describeWaiting(waiting)}</Text>
            <TouchableOpacity
              style={styles.takeOver}
              accessibilityRole="button"
              onPress={() => {
                leaveWaiting();
                runCheck('takeover');
              }}
            >
              <Text style={styles.takeOverText}>Take Over Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  // menuSurface, the same solid surface the notices use: this sits over
  // whatever screen is open, so it cannot borrow a band's translucency.
  stripCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.menuSurface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  stripText: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
  takeOver: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.buttonColor,
  },
  takeOverText: {
    ...typography.body,
    color: colors.textOnButton,
    // Dark text: cancel any shadow inherited from a base style it is
    // composed with. See constants/typography.ts.
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
