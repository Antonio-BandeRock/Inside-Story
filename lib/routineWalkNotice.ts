// The notification that stays up while a routine is being walked (B3,
// Phase 2), so somebody who puts the phone down between steps can see
// which step they are on from the notification shade or the lock screen
// without opening the app.
//
// It says the step and the time that step came up, not a ticking clock. A
// running countdown or stopwatch in a notification needs Android's
// chronometer, which expo-notifications does not expose, so that part
// waits on a native rebuild. What is here updates each time the step
// changes and is taken down when the walk finishes or the screen closes.
//
// Android only, and never on the desktop, the same as the emergency lines
// in lib/emergencyLockScreen.ts, whose pattern this follows. It never asks
// for permission: without it, nothing is posted.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isDesktopApp } from './desktop/bridge';

const NOTIFICATION_ID = 'inside-story-routine-walk';
const CHANNEL_ID = 'routine-walk';

function supported(): boolean {
  return Platform.OS === 'android' && !isDesktopApp();
}

export type RoutineWalkNotice = { title: string; body: string };

function clock(at: Date): string {
  const hours = at.getHours();
  const minutes = String(at.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'am' : 'pm';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${minutes} ${suffix}`;
}

/** The words, kept apart from posting them so they can be checked. */
export function routineWalkNotice(input: {
  routineName: string;
  position: number;
  total: number;
  stepText: string;
  stepMinutes: number | null;
  stepStartedAt: Date;
}): RoutineWalkNotice {
  const length = input.stepMinutes
    ? `, about ${input.stepMinutes === 1 ? '1 minute' : `${input.stepMinutes} minutes`}`
    : '';
  return {
    title: `${input.routineName}: step ${input.position + 1} of ${input.total}`,
    body: `${input.stepText}. Up since ${clock(input.stepStartedAt)}${length}.`,
  };
}

export async function showRoutineWalkNotice(notice: RoutineWalkNotice): Promise<void> {
  if (!supported()) return;
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Routine in progress',
      description: 'The step you are on while walking a routine, taken down when you finish or leave it.',
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: null,
      vibrationPattern: null,
      showBadge: false,
    });
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: { title: notice.title, body: notice.body, sticky: true, autoDismiss: false, sound: false },
      trigger: { channelId: CHANNEL_ID },
    });
  } catch (error) {
    console.warn('[routineWalkNotice] Could not put the notice up', error);
  }
}

export async function clearRoutineWalkNotice(): Promise<void> {
  if (!supported()) return;
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
}
