// The emergency lines on the lock screen, off until the person turns them
// on (A19, Phase 2). Which lines are shown, and whether at all, belongs to
// this device alone, so the choice lives in app_meta under a key listed in
// DEVICE_LOCAL_META_KEYS and never travels in a snapshot.
//
// Android only. A notification there can be made one the person cannot
// swipe away and shown in full on a locked screen through a channel of its
// own; an iPhone offers neither, and its Medical ID is the better place
// (lib/emergencyOutside.ts says where). The notification is not scheduled,
// it is posted, so nothing in lib/reminderNotifications.ts ever cancels it,
// and it is posted again at startup and on coming back to the foreground,
// since a phone restart clears it.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from './db';
import { isDesktopApp } from './desktop/bridge';
import { gatherFromApp, getEmergencyProfile, listEmergencyContacts } from './emergencyDb';
import { lockScreenNotice, parseLockScreenParts, type LockScreenPart } from './emergencyOutside';

const META_KEY = 'emergency_lock_screen';
const NOTIFICATION_ID = 'inside-story-emergency';
const CHANNEL_ID = 'emergency-lock-screen';

/** Whether this device can show it at all. */
export function lockScreenSupported(): boolean {
  return Platform.OS === 'android' && !isDesktopApp();
}

/** The parts picked, or an empty list when it is off. */
export async function getLockScreenParts(): Promise<LockScreenPart[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', META_KEY);
  return parseLockScreenParts(row?.value);
}

export async function setLockScreenParts(parts: LockScreenPart[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    META_KEY,
    JSON.stringify(parts),
    new Date().toISOString(),
  );
  await refreshLockScreenNotice();
}

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Puts the notice up with what the record says now, or takes it down when
 * it is off or nothing picked has anything in it. Returns whether it is up.
 * Safe to call any time; it never asks for permission, which is asked for
 * only when the person turns it on.
 */
export async function refreshLockScreenNotice(): Promise<boolean> {
  if (!lockScreenSupported()) return false;
  try {
    const parts = await getLockScreenParts();
    const [profile, fromApp, contacts] = parts.length > 0
      ? await Promise.all([getEmergencyProfile(), gatherFromApp(), listEmergencyContacts()])
      : [null, null, null];
    const notice = profile && fromApp && contacts
      ? lockScreenNotice(parts, { profile, fromApp, contacts, today: today() })
      : null;
    if (!notice) {
      await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
      return false;
    }
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return false;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Emergency lines on the lock screen',
      description: 'The emergency lines you picked in Life > Emergency, readable while the phone is locked.',
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
    return true;
  } catch (error) {
    console.warn('[emergencyLockScreen] Could not put the notice up', error);
    return false;
  }
}

/** Asks for notification permission, for the moment it is turned on. */
export async function askLockScreenPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}
