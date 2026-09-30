// The two settings for the routine step timer (B5, lib/stepTimer.ts), both
// off until somebody turns them on, and the one notification it can send.
//
// Kept in app_meta and NOT device-local: whether somebody wants the ring is
// about the person, so turning it on at the computer turns it on on the
// phone at the next sync.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from './db';
import { timerSignal } from './stepTimer';

export const STEP_TIMER_RING_KEY = 'routine_timer_ring';
export const STEP_TIMER_SIGNAL_KEY = 'routine_timer_signal';

const SIGNAL_ID = 'inside-story-step-timer';
const ANDROID_CHANNEL_ID = 'reminders';

export type StepTimerSettings = { ring: boolean; signal: boolean };

export async function getStepTimerSettings(): Promise<StepTimerSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_meta WHERE key IN (?, ?)',
    STEP_TIMER_RING_KEY,
    STEP_TIMER_SIGNAL_KEY,
  );
  const on = (key: string) => rows.some((row) => row.key === key && row.value === '1');
  return { ring: on(STEP_TIMER_RING_KEY), signal: on(STEP_TIMER_SIGNAL_KEY) };
}

async function setFlag(key: string, on: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    on ? '1' : '0',
    new Date().toISOString(),
  );
}

export async function setStepTimerRing(on: boolean): Promise<void> {
  await setFlag(STEP_TIMER_RING_KEY, on);
  if (!on) await cancelStepTimerSignal();
}

export async function setStepTimerSignal(on: boolean): Promise<void> {
  await setFlag(STEP_TIMER_SIGNAL_KEY, on);
  if (!on) await cancelStepTimerSignal();
}

/** One signal at a time: scheduling replaces whatever was waiting, since
 *  only one step is ever on screen. */
export async function scheduleStepTimerSignal(atMs: number, routineName: string, stepText: string): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    await Notifications.cancelScheduledNotificationAsync(SIGNAL_ID).catch(() => undefined);
    const { title, body } = timerSignal(routineName, stepText);
    await Notifications.scheduleNotificationAsync({
      identifier: SIGNAL_ID,
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(atMs),
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
    });
  } catch (error) {
    console.warn('[stepTimer] Could not set the signal', error);
  }
}

export async function cancelStepTimerSignal(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(SIGNAL_ID).catch(() => undefined);
  await Notifications.dismissNotificationAsync(SIGNAL_ID).catch(() => undefined);
}
